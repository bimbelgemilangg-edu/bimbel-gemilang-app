// tests/keputusanMuat.test.mjs
// ============================================================
// Test kebijakan muat ulang & perilaku saat gagal (src/utils/keputusanMuat.js).
//
//     node tests/keputusanMuat.test.mjs
//
// KENAPA INI PENTING
// Lahir dari audit 2026-10-06: proyek menjawab bacaan Firestore dengan
// 429 RESOURCE_EXHAUSTED, dan banyak halaman menelan error secara senyap
// (`catch -> daftar kosong`), sehingga kuota yang habis terlihat seperti
// "soalnya hilang / datanya kurang". Dua keputusan kecil di berkas ini
// yang menentukan apakah pengguna melihat KEBOHONGAN (daftar kosong) atau
// KEBENARAN (data lama + pesan jujur):
//   1. kapan boleh menembak server lagi (TTL cache),
//   2. apa yang ditampilkan saat tembakan itu gagal.
// ============================================================

import assert from 'node:assert/strict';
import { perluSegar, kebijakanGagalMuat } from '../src/utils/keputusanMuat.js';

let lulus = 0;
let gagal = 0;
const kegagalan = [];

function uji(nama, fn) {
  try {
    fn();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal += 1;
    const pesan = String(e && e.message ? e.message : e);
    kegagalan.push({ nama, pesan });
    console.log(`  ✗ ${nama}`);
    console.log(`      ${pesan.split('\n').join('\n      ').slice(0, 400)}`);
  }
}

function bagian(judul) {
  console.log(`\n${judul}`);
}

console.log('keputusanMuat — frekuensi tembak server & kejujuran saat gagal');

// ============================================================
bagian('1. FREKUENSI: CACHE MENGHORMATI TTL');
// ============================================================

uji('belum ada cache -> boleh memuat', () => {
  assert.equal(perluSegar({ waktuCacheMs: 0, ttlMs: 600000, sekarangMs: 1000 }), true);
});

uji('cache masih muda -> TIDAK menembak server (ini yang menghemat kuota)', () => {
  assert.equal(perluSegar({ waktuCacheMs: 1000, ttlMs: 600000, sekarangMs: 60000 }), false);
});

uji('cache lewat TTL -> boleh memuat lagi', () => {
  assert.equal(perluSegar({ waktuCacheMs: 1000, ttlMs: 600000, sekarangMs: 611000 }), true);
});

uji('paksa (tombol Coba lagi / Muat ulang) selalu menembak, walau cache muda', () => {
  assert.equal(perluSegar({ waktuCacheMs: 1000, ttlMs: 600000, sekarangMs: 2000, paksa: true }), true);
});

uji('pindah tab bolak-balik tidak menumpuk tembakan (10x dalam TTL = 1x)', () => {
  let tembakan = 0;
  const cache = { waktu: 0 };
  for (let t = 0; t < 10; t += 1) {
    const kini = 1000 + t * 5000; // 10 peristiwa focus dalam 50 detik
    if (perluSegar({ waktuCacheMs: cache.waktu, ttlMs: 600000, sekarangMs: kini })) {
      tembakan += 1;
      cache.waktu = kini;
    }
  }
  assert.equal(tembakan, 1);
});

// ============================================================
bagian('2. SAAT GAGAL: JUJUR, BUKAN DAFTAR KOSONG');
// ============================================================

uji('ada data lama -> pertahankan + pesan jujur', () => {
  const k = kebijakanGagalMuat(true, 'kuota habis');
  assert.equal(k.pertahankanDataLama, true);
  assert.ok(k.pesan.includes('kuota habis'));
  assert.ok(k.pesan.includes('Coba lagi'));
});

uji('tidak ada data lama sama sekali -> pesan tetap jujur, tidak bohong', () => {
  const k = kebijakanGagalMuat(false);
  assert.equal(k.pertahankanDataLama, false);
  assert.ok(k.pesan.length > 10);
});

uji('pesan tidak pernah kosong walau keterangan kosong', () => {
  assert.ok(kebijakanGagalMuat(true, '').pesan.trim().length > 0);
  assert.ok(kebijakanGagalMuat(true).pesan.trim().length > 0);
});

// ============================================================
// RINGKASAN
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log(`  LULUS : ${lulus}`);
console.log(`  GAGAL : ${gagal}`);
console.log('='.repeat(60));

if (gagal > 0) {
  console.log('\nRingkasan kegagalan:');
  kegagalan.forEach((k, i) => console.log(`  ${i + 1}. ${k.nama}\n     ${k.pesan.split('\n')[0]}`));
  console.error('\n❌ ADA TEST YANG GAGAL.');
  process.exit(1);
}
console.log('\n✅ Semua test lulus.');
