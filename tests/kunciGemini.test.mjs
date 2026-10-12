// tests/kunciGemini.test.mjs
// ============================================================
// Test pemilihan kunci Gemini (api/kunciGemini.js) — skema pemisahan
// beban yang ditetapkan owner 2026-10-06: GEMINI_SOAL untuk beban soal,
// GEMINI_API_KEY untuk fungsi lain.
//
//     node tests/kunciGemini.test.mjs
//
// KENAPA INI PENTING
// Sebelum ada satu pintu ini, tujuh endpoint membaca process.env.
// GEMINI_API_KEY langsung di tempatnya masing-masing. Memisahkan beban
// dengan cara menyalin logika ke tujuh tempat = tujuh peluang salah.
// Test ini mengunci perilaku jatuh-balik (fallback) supaya deploy yang
// belum memisahkan kunci TIDAK tiba-tiba kehilangan AI-nya.
// ============================================================

import assert from 'node:assert/strict';
import {
  kunciGeminiUntuk, pesanKunciBelumAda, apakahMapelUtbk,
  kelompokUntukMapel, peringatanIsolasi,
} from '../lib/kunciGemini.js';
import { MAPEL_UTBK } from '../src/utils/mesinTaksonomiSoal.js';

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

console.log('kunciGemini — pemisahan beban soal vs umum');

// ============================================================
bagian('1. BEBAN SOAL MEMAKAI KUNCI KHUSUSNYA');
// ============================================================

uji('kelompok soal memakai GEMINI_SOAL bila ada', () => {
  const env = { GEMINI_SOAL: 'kunci-soal', GEMINI_API_KEY: 'kunci-umum' };
  assert.equal(kunciGeminiUntuk(env, 'soal'), 'kunci-soal');
});

uji('kelompok umum TIDAK boleh menyentuh GEMINI_SOAL', () => {
  const env = { GEMINI_SOAL: 'kunci-soal', GEMINI_API_KEY: 'kunci-umum' };
  assert.equal(kunciGeminiUntuk(env, 'umum'), 'kunci-umum');
});

// ============================================================
bagian('2. FALLBACK: DEPLOY LAMA TIDAK BOLEH KEHILANGAN AI');
// ============================================================

uji('soal tanpa GEMINI_SOAL jatuh ke GEMINI_API_KEY', () => {
  assert.equal(kunciGeminiUntuk({ GEMINI_API_KEY: 'kunci-umum' }, 'soal'), 'kunci-umum');
});

uji('kunci berisi spasi dianggap belum ada (trim)', () => {
  const env = { GEMINI_SOAL: '   ', GEMINI_API_KEY: 'kunci-umum' };
  assert.equal(kunciGeminiUntuk(env, 'soal'), 'kunci-umum');
});

uji('tidak ada kunci sama sekali -> string kosong, bukan undefined', () => {
  assert.equal(kunciGeminiUntuk({}, 'soal'), '');
  assert.equal(kunciGeminiUntuk(undefined, 'umum'), '');
});

// ============================================================
bagian('3. PESAN KESALAHAN MENYEBUT KEDUA NAMA KUNCI');
// ============================================================

uji('pesan kelompok soal menyebut GEMINI_SOAL dan GEMINI_API_KEY', () => {
  const p = pesanKunciBelumAda('soal');
  assert.ok(p.includes('GEMINI_SOAL') && p.includes('GEMINI_API_KEY'));
});

uji('pesan kelompok umum menyebut GEMINI_API_KEY saja', () => {
  const p = pesanKunciBelumAda('umum');
  assert.ok(p.includes('GEMINI_API_KEY'));
  assert.ok(!p.includes('GEMINI_SOAL'));
});

// ============================================================
// RINGKASAN
// ============================================================
// ============================================================
// 🔥 BARU (2026-10-10): kelompok kunci ketiga, GEMINI_UTBK.
// Keputusan owner: kunci tryout UTBK berasal dari AKUN GOOGLE PRIBADI yang
// berbeda dari akun Gemilang, supaya beban tryout Sabtu tidak pernah antre
// di kuota yang sama dengan pembuatan kuis harian tentor. Kuota gratis
// menempel pada akun/proyek Google, jadi beda akun = beda kolam sungguhan.
// ============================================================
const ENV_TIGA = { GEMINI_API_KEY: 'umum', GEMINI_SOAL: 'soal', GEMINI_UTBK: 'utbk' };

uji('tujuh nama resmi subtes UTBK dikenali; mapel kurikulum tidak', () => {
  for (const m of MAPEL_UTBK) assert.equal(apakahMapelUtbk(m.nama, MAPEL_UTBK), true, m.nama);
  assert.equal(apakahMapelUtbk('utbk_pm', MAPEL_UTBK), true);
  assert.equal(apakahMapelUtbk('UTBK/SNBT', MAPEL_UTBK), true);
  for (const n of ['Matematika', 'Bahasa Indonesia', 'Kimia', 'Literasi', '', null]) {
    assert.equal(apakahMapelUtbk(n, MAPEL_UTBK), false, String(n));
  }
});

uji('routing kelompok: subtes UTBK -> utbk, lainnya -> soal', () => {
  assert.equal(kelompokUntukMapel('TPS/Pengetahuan Kuantitatif', MAPEL_UTBK), 'utbk');
  assert.equal(kelompokUntukMapel('Literasi/Bahasa Inggris', MAPEL_UTBK), 'utbk');
  assert.equal(kelompokUntukMapel('Matematika', MAPEL_UTBK), 'soal');
  assert.equal(kelompokUntukMapel('', MAPEL_UTBK), 'soal', 'perilaku lama dipertahankan');
});

uji('kunci utbk dipakai untuk kelompok utbk; rantai jatuh-balik utuh', () => {
  assert.equal(kunciGeminiUntuk(ENV_TIGA, 'utbk'), 'utbk');
  assert.equal(kunciGeminiUntuk({ GEMINI_SOAL: 'soal', GEMINI_API_KEY: 'umum' }, 'utbk'), 'soal');
  assert.equal(kunciGeminiUntuk({ GEMINI_API_KEY: 'umum' }, 'utbk'), 'umum');
  assert.equal(kunciGeminiUntuk(ENV_TIGA, 'soal'), 'soal', 'beban kuis tidak boleh nyasar ke kunci pribadi');
  assert.equal(kunciGeminiUntuk(ENV_TIGA, 'umum'), 'umum');
});

uji('INVARIAN: isolasi kuota yang rusak WAJIB bersuara', () => {
  assert.equal(peringatanIsolasi(ENV_TIGA, 'utbk'), null);
  const rusak = peringatanIsolasi({ GEMINI_SOAL: 'soal' }, 'utbk');
  assert.match(rusak, /isolasi kuota TIDAK aktif/);
  assert.equal(peringatanIsolasi({ GEMINI_SOAL: 'soal' }, 'soal'), null, 'kelompok lain tidak ikut ribut');
});

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
