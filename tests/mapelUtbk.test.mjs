// tests/mapelUtbk.test.mjs — tujuh subtes UTBK sebagai mapel bank soal
// ============================================================
//     node tests/mapelUtbk.test.mjs
//
// KENAPA INI ADA (permintaan owner 2026-10-10: "tambahkan mapel utbk untuk
// aku scan soal utbk html nya di situ dulu yang belum ada")
//
// Sebelumnya daftar mapel scan hanya punya SATU entri UTBK ('TPS/Penalaran
// Umum'). Enam subtes lain tidak punya rumah, jadi soal hasil scan terpaksa
// ditumpukkan ke mapel kurikulum yang berbeda karakter soalnya: Penalaran
// Matematika jadi "Matematika", Literasi Bahasa Inggris jadi "Bahasa
// Inggris". Raport kompetensi dan rekomendasi belajar jadi salah arah.
//
// Test ini menjaga tiga hal:
//   1. ketujuh subtes terdaftar SATU SUMBER dan muncul di kedua halaman scan;
//   2. deteksi otomatis memilih kode UTBK untuk nama UTBK, dan TIDAK MEREGRESI
//      mapel kurikulum (kata "Matematika" polos tetap mtk, bukan utbk_pm);
//   3. mesin try out mengenali nama UTBK sebelum nama kurikulum yang
//      terkandung di dalamnya ("Literasi/Bahasa Indonesia" mengandung
//      "bahasa indonesia").
// ============================================================
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KATALOG_MAPEL, MAPEL_UTBK, NAMA_MAPEL_UTBK, deteksiMapel,
} from '../src/utils/mesinTaksonomiSoal.js';
import { kodeMapel } from '../src/utils/aliasMapel.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}

console.log('mapelUtbk — tujuh subtes UTBK di bank soal');

const SUBTES = ['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM'];

// ======================================================== SATU SUMBER
uji('tujuh subtes terdaftar dengan kode & nama yang stabil', () => {
  assert.equal(MAPEL_UTBK.length, 7);
  assert.deepEqual(MAPEL_UTBK.map((m) => m.subtes), SUBTES);
  assert.deepEqual(MAPEL_UTBK.map((m) => m.kode), [
    'utbk_pu', 'utbk_ppu', 'utbk_pbm', 'utbk_pk', 'utbk_lbi', 'utbk_lbe', 'utbk_pm',
  ]);
  assert.ok(NAMA_MAPEL_UTBK.includes('TPS/Penalaran Umum'),
    'nama lama dipertahankan supaya soal yang sudah ter-tag tidak yatim');
});

uji('kode & nama UTBK tidak bentrok dengan katalog yang sudah ada', () => {
  const kode = new Set();
  const nama = new Set();
  for (const m of KATALOG_MAPEL) {
    assert.ok(!kode.has(m.kode), `kode duplikat: ${m.kode}`);
    assert.ok(!nama.has(m.nama), `nama duplikat: ${m.nama}`);
    kode.add(m.kode);
    nama.add(m.nama);
  }
  assert.equal(KATALOG_MAPEL.length, 22 + 7, 'katalog lama 22 entri + 7 UTBK');
});

uji('INVARIAN: kedua halaman scan memakai daftar yang SATU SUMBER', () => {
  // Sebelum 2026-10-10 DAFTAR_MAPEL ditulis tangan di DUA berkas. Dua daftar
  // tulisan tangan pasti berpencar suatu hari -- pola yang sudah berulang di
  // repo ini (lihat kepala utils/cocokkanTargetPaket.js).
  for (const rel of [
    'src/pages/admin/bank-soal/ImportHasilScanPage.jsx',
    'src/pages/admin/bank-soal/AdvancedQuestionExtractor.jsx',
  ]) {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    const m = src.match(/const DAFTAR_MAPEL = \[([\s\S]*?)\];/);
    assert.ok(m, `${rel}: DAFTAR_MAPEL tidak ketemu`);
    assert.ok(m[1].includes('...NAMA_MAPEL_UTBK'), `${rel}: tidak menyebar NAMA_MAPEL_UTBK`);
    assert.ok(!/'TPS\/Penalaran Umum'/.test(m[1]),
      `${rel}: masih punya entri UTBK tulisan tangan di dalam daftar`);
    assert.ok(src.includes("from '../../../utils/mesinTaksonomiSoal'"), `${rel}: impor belum ada`);
  }
});

// ========================================================= DETEKSI OTOMATIS
const kode = (teks, jenjang = 'UTBK/SNBT') => deteksiMapel(teks, { jenjang }).kode;

uji('nama UTBK terdeteksi ke kode UTBK, bukan mapel kurikulum', () => {
  assert.equal(kode('Penalaran Umum'), 'utbk_pu');
  assert.equal(kode('Pengetahuan & Pemahaman Umum'), 'utbk_ppu');
  assert.equal(kode('Pemahaman Bacaan & Menulis'), 'utbk_pbm');
  assert.equal(kode('Pengetahuan Kuantitatif'), 'utbk_pk');
  assert.equal(kode('Literasi Bahasa Indonesia'), 'utbk_lbi');
  assert.equal(kode('Literasi Bahasa Inggris'), 'utbk_lbe');
  assert.equal(kode('Penalaran Matematika'), 'utbk_pm');
});

uji('INVARIAN: mapel kurikulum TIDAK terebut oleh entri UTBK', () => {
  // Kata "Matematika" polos harus tetap mtk. Kalau entri UTBK menyerapnya,
  // seluruh bank soal kurikulum lama akan salah kelas saat dirapikan ulang.
  assert.equal(kode('Matematika', 'SMA/MA'), 'mtk');
  assert.equal(kode('Bahasa Indonesia', 'SMA/MA'), 'bind');
  assert.equal(kode('Bahasa Inggris', 'SMA/MA'), 'bing');
  // Catatan: 'Matematika Tingkat Lanjut' lewat jalur skor teks memang jatuh
  // ke mtk sejak sebelum fitur ini (skor 'matematika'+'matematik' = 4 mengalahkan
  // 'matematika tingkat lanjut' = 3); penghalusan ke mtk_tl terjadi di jalur
  // peta kurikulum, bukan di skor deteksiMapel. Yang dikunci di sini hanyalah:
  // entri UTBK tidak MENGUBAH perilaku lama itu.
  assert.equal(kode('Matematika Tingkat Lanjut', 'SMA/MA'), 'mtk', 'perilaku lama tidak berubah');
  assert.equal(kode('Fisika', 'SMA/MA'), 'fis');
  assert.equal(kode('Biologi', 'SMP/MTs'), 'ipa', 'penyelarasan kurikulum lintas jenjang tetap jalan');
});

uji('teks campuran dimenangkan oleh frasa yang lebih spesifik', () => {
  assert.equal(kode('Soal Penalaran Matematika dengan konteks Matematika'), 'utbk_pm');
  assert.equal(kode('Literasi Bahasa Inggris: teks sains populer'), 'utbk_lbe');
});

uji('nama UTBK tidak diubah oleh penyelaras kurikulum pada jenjang UTBK/SNBT', () => {
  // selaraskanKeKurikulum() boleh mengganti nama mapel yang tidak sah di
  // jenjangnya. Untuk jenjang UTBK/SNBT dan nama UTBK, tidak boleh ada yang
  // diganti -- kalau diganti, soal masuk ke mapel yang tidak dipilih admin.
  for (const m of MAPEL_UTBK) {
    const r = deteksiMapel(m.nama, { jenjang: 'UTBK/SNBT' });
    assert.equal(r.kode, m.kode, m.nama);
    assert.equal(r.nama, m.nama, `${m.nama} tidak boleh diganti namanya`);
  }
});

// ===================================================== MESIN TRY OUT
uji('mesin try out mengenali nama UTBK sebelum nama kurikulum di dalamnya', () => {
  // 'Literasi/Bahasa Indonesia' mengandung 'bahasa indonesia'; kalau alias
  // kurikulum dicocokkan lebih dulu, komposisi try out UTBK akan menarik
  // soal Bahasa Indonesia kurikulum.
  assert.equal(kodeMapel('Literasi/Bahasa Indonesia'), 'utbk_lbi');
  assert.equal(kodeMapel('Literasi/Bahasa Inggris'), 'utbk_lbe');
  assert.equal(kodeMapel('Literasi/Penalaran Matematika'), 'utbk_pm');
  assert.equal(kodeMapel('TPS/Pengetahuan Kuantitatif'), 'utbk_pk');
  assert.equal(kodeMapel('TPS/Penalaran Umum'), 'utbk_pu');
});

uji('INVARIAN: alias kurikulum lama tidak berubah perilakunya', () => {
  assert.equal(kodeMapel('Bahasa Indonesia'), 'bind');
  assert.equal(kodeMapel('Bahasa Inggris'), 'bing');
  assert.equal(kodeMapel('Matematika'), 'mtk');
  assert.equal(kodeMapel('Matematika Tingkat Lanjut'), 'mtk_tl');
  assert.equal(kodeMapel('Sosiologi'), 'sos');
});

uji('setiap mapel UTBK bisa diminta komposisi try out dengan namanya sendiri', () => {
  // cocokkanMapel dipakai mesin otomatis mencocokkan soal ke komposisi
  // template. Nama template == nama mapel UTBK harus cocok ke kode yang sama.
  for (const m of MAPEL_UTBK) {
    assert.equal(kodeMapel(m.nama), m.kode, m.nama);
  }
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
