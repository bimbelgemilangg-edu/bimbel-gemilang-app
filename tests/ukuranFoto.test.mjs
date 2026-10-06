// tests/ukuranFoto.test.mjs
// ============================================================
// Test rumus pengecilan foto kamera (src/utils/ukuranFoto.js).
//
//     node tests/ukuranFoto.test.mjs
//
// KENAPA INI PENTING
// Jawaban esai berupa foto disimpan sebagai data-URI di dokumen
// tryout_sesi, dan Firestore membatasi satu dokumen 1 MB. Foto kamera
// belakang HP bisa 4000x3000 px. Kalau rumus pengecilannya salah,
// akibatnya salah satu dari dua kegagalan yang sama-sama buruk:
//   - foto tetap kebesaran  -> dokumen jebol / ditolak, jawaban hilang
//   - rasio aspek rusak     -> foto gepeng, tulisan tangan tak terbaca,
//                              guru menilai dari gambar yang menyesatkan
// ============================================================

import assert from 'node:assert/strict';
import { ukuranFoto } from '../src/utils/ukuranFoto.js';

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

const rasio = (w, h) => w / h;

console.log('ukuranFoto — pengecilan foto jawaban esai');

// ============================================================
bagian('1. FOTO BESAR DIKECILKAN, RASIO DIPERTAHANKAN');
// ============================================================

uji('landscape 4000x3000 -> sisi terpanjang 1600, rasio utuh', () => {
  const h = ukuranFoto(4000, 3000, 1600);
  assert.equal(h.lebar, 1600);
  assert.equal(h.tinggi, 1200);
  assert.equal(h.diskalakan, true);
  assert.ok(Math.abs(rasio(h.lebar, h.tinggi) - rasio(4000, 3000)) < 0.01);
});

uji('portrait 3000x4000 -> tinggi yang jadi 1600', () => {
  const h = ukuranFoto(3000, 4000, 1600);
  assert.equal(h.tinggi, 1600);
  assert.equal(h.lebar, 1200);
  assert.equal(h.diskalakan, true);
});

uji('persegi tepat di batas -> tidak diskalakan', () => {
  const h = ukuranFoto(1600, 1600, 1600);
  assert.deepEqual(h, { lebar: 1600, tinggi: 1600, diskalakan: false });
});

uji('foto kecil dibiarkan utuh (tidak diperbesar = tidak menambah byte)', () => {
  const h = ukuranFoto(640, 480, 1600);
  assert.deepEqual(h, { lebar: 640, tinggi: 480, diskalakan: false });
});

// ============================================================
bagian('2. TIDAK PERNAH MENGHASILKAN UKURAN RUSAK');
// ============================================================

uji('hasil selalu >= 1 px walau sumber sangat memanjang', () => {
  const h = ukuranFoto(9000, 3, 1600);
  assert.ok(h.lebar >= 1 && h.tinggi >= 1);
  assert.equal(h.lebar, 1600);
});

uji('sumber nol / negatif / bukan angka -> 1x1, tidak melempar', () => {
  for (const [w, h2] of [[0, 0], [-10, 100], [NaN, NaN], [undefined, undefined]]) {
    const h = ukuranFoto(w, h2, 1600);
    assert.deepEqual(h, { lebar: 1, tinggi: 1, diskalakan: false });
  }
});

uji('string angka diterima (videoWidth kadang datang aneh)', () => {
  const h = ukuranFoto('4000', '3000', 1600);
  assert.equal(h.lebar, 1600);
  assert.equal(h.tinggi, 1200);
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
