// tests/kunciDuplikatSoal.test.mjs
// ============================================================
// Uji sidik jari duplikat yang sadar gambar
// (src/utils/kunciDuplikatSoal.js).
//
//     node tests/kunciDuplikatSoal.test.mjs
//
// KASUS NYATA YANG MELAHIRKAN BERKAS INI (tangkapan layar owner 2026-10-08)
// Halaman Bersihkan Soal menampilkan grup "2 soal identik" yang isinya:
//   A: "Berdasarkan gambar poster di atas, tentukan apakah setiap
//       pernyataan berikut Benar atau Salah!"  + poster LOMBA LARI
//   B: kalimat perintah YANG SAMA PERSIS                          + poster DAUR AIR
// Detektor lama membaca TEKS SAJA, jadi keduanya "identik" dan salah satu
// otomatis tercentang untuk dihapus. Padahal gambar itulah soalnya.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_TEKS_DUPLIKAT,
  sidikJariGambar,
  kunciDuplikat,
  alasanDuplikat,
} from '../src/utils/kunciDuplikatSoal.js';

const PERINTAH = 'Berdasarkan gambar poster di atas, tentukan apakah setiap pernyataan berikut Benar atau Salah!';

const butirPoster = (urlGambar, tambahan = {}) => ({
  mataPelajaran: 'Bahasa Indonesia',
  jenjang: 'SMP/MTs',
  tingkatKelas: '8',
  soal: PERINTAH,
  tipe: 'benar_salah',
  gambarUrls: [urlGambar],
  tabelBenarSalah: [
    { pernyataan: 'Pernyataan pertama tentang poster ini', kunci: 'benar' },
    { pernyataan: 'Pernyataan kedua tentang poster ini', kunci: 'salah' },
  ],
  ...tambahan,
});

// ------------------------------------------------------------
// 1. Kasus screenshot: perintah sama, gambar beda = BUKAN duplikat
// ------------------------------------------------------------

test('INVARIAN: perintah identik + gambar berbeda BUKAN duplikat', () => {
  const a = kunciDuplikat(butirPoster('https://cdn.test/poster-lomba-lari.png'));
  const b = kunciDuplikat(butirPoster('https://cdn.test/poster-daur-air.png'));
  assert.ok(a && b);
  assert.notEqual(a, b, 'dua poster berbeda tidak boleh masuk grup duplikat yang sama');
});

test('perintah identik + gambar SAMA = duplikat (inilah duplikat sejati)', () => {
  const a = kunciDuplikat(butirPoster('https://cdn.test/poster-x.png'));
  const b = kunciDuplikat(butirPoster('https://cdn.test/poster-x.png', { nomor: 99 }));
  assert.equal(a, b);
});

test('urutan penyimpanan gambar tidak mempengaruhi sidik jari', () => {
  const a = kunciDuplikat({ ...butirPoster(''), gambarUrls: ['https://a/1.png', 'https://a/2.png'] });
  const b = kunciDuplikat({ ...butirPoster(''), gambarUrls: ['https://a/2.png', 'https://a/1.png'] });
  assert.equal(a, b);
});

test('gambar di dalam pilihan juga dihitung', () => {
  const a = kunciDuplikat({ soal: PERINTAH, tipe: 'pg_sederhana', opsiJawaban: [{ teks: 'grafik a', gambar: [{ url: 'https://a/g1.png' }] }, { teks: 'grafik b' }] });
  const b = kunciDuplikat({ soal: PERINTAH, tipe: 'pg_sederhana', opsiJawaban: [{ teks: 'grafik a', gambar: [{ url: 'https://a/g2.png' }] }, { teks: 'grafik b' }] });
  assert.notEqual(a, b, 'pilihan bergambar berbeda bukan duplikat');
  const c = kunciDuplikat({ soal: PERINTAH, tipe: 'pg_sederhana', opsiJawaban: [{ teks: 'grafik a', gambar: [{ url: 'https://a/g1.png' }] }, { teks: 'grafik b' }] });
  assert.equal(a, c);
});

// ------------------------------------------------------------
// 2. Isi per tipe ikut dihitung
// ------------------------------------------------------------

test('perintah sama + pernyataan benar/salah beda = bukan duplikat', () => {
  const a = kunciDuplikat(butirPoster(''));
  const b = kunciDuplikat(butirPoster('', {
    tabelBenarSalah: [{ pernyataan: 'Pernyataan SAMA SEKALI LAIN', kunci: 'benar' }],
  }));
  assert.notEqual(a, b);
});

test('perintah sama + pilihan ganda beda = bukan duplikat', () => {
  const dasar = { soal: PERINTAH, tipe: 'pg_sederhana', opsiJawaban: ['satu', 'dua', 'tiga', 'empat'] };
  const lain = { soal: PERINTAH, tipe: 'pg_sederhana', opsiJawaban: ['lima', 'enam', 'tujuh', 'delapan'] };
  assert.notEqual(kunciDuplikat(dasar), kunciDuplikat(lain));
  assert.equal(kunciDuplikat(dasar), kunciDuplikat({ ...dasar, kunciJawaban: 'C' }), 'kunci berbeda tidak membuat soal berbeda');
});

test('duplikat sejati tetap tertangkap walau beda spasi/huruf besar-kecil/tag HTML', () => {
  const a = kunciDuplikat({ soal: 'Hasil dari 12 x 8 dibagi 4 adalah', opsiJawaban: ['24', '26'], mataPelajaran: 'Matematika', jenjang: 'SD/MI' });
  const b = kunciDuplikat({ soal: '  hasil dari 12 x 8 dibagi 4 adalah  ', opsiJawaban: ['24', '26'], mataPelajaran: 'Matematika', jenjang: 'SD/MI' });
  const c = kunciDuplikat({ soal: '<p>Hasil dari 12 x 8 dibagi 4 adalah</p>', opsiJawaban: ['24', '26'], mataPelajaran: 'Matematika', jenjang: 'SD/MI' });
  assert.equal(a, b);
  assert.equal(a, c);
});

test('mapel/jenjang/kelas berbeda tidak digabung jadi satu grup', () => {
  const a = kunciDuplikat({ soal: PERINTAH, mataPelajaran: 'Bahasa Indonesia', jenjang: 'SMP/MTs', tingkatKelas: '8' });
  const b = kunciDuplikat({ soal: PERINTAH, mataPelajaran: 'Bahasa Indonesia', jenjang: 'SMP/MTs', tingkatKelas: '9' });
  assert.notEqual(a, b);
});

// ------------------------------------------------------------
// 3. Batas aman
// ------------------------------------------------------------

test(`teks lebih pendek dari ${MIN_TEKS_DUPLIKAT} karakter tidak ikut diperiksa`, () => {
  assert.equal(kunciDuplikat({ soal: 'berapa hasil', opsiJawaban: ['1', '2'] }), null, '12 karakter: di bawah batas');
  assert.equal(kunciDuplikat({ soal: 'berapa hasil???', opsiJawaban: ['1', '2'] }), null, 'tanda baca dibuang dulu, baru dihitung: 12 karakter');
  assert.equal(kunciDuplikat({ soal: '' }), null);
  assert.equal(kunciDuplikat(null), null);
  assert.equal(kunciDuplikat(undefined), null);
});

test('butir tanpa gambar sama sekali tetap bisa diduplikatkan berdasar teks+isi', () => {
  const a = kunciDuplikat({ soal: 'Ibu kota provinsi Jawa Timur adalah kota', opsiJawaban: ['Surabaya', 'Malang'] });
  const b = kunciDuplikat({ soal: 'Ibu kota provinsi Jawa Timur adalah kota', opsiJawaban: ['Surabaya', 'Malang'] });
  assert.equal(a, b);
  assert.equal(sidikJariGambar({}), '');
});

test('alias field teks dihormati (teksSoal vs soal)', () => {
  const a = kunciDuplikat({ soal: PERINTAH, gambarUrls: ['https://a/x.png'] });
  const b = kunciDuplikat({ teksSoal: PERINTAH, gambarUrls: ['https://a/x.png'] });
  assert.equal(a, b);
});

// ------------------------------------------------------------
// 4. Alasan yang manusiawi
// ------------------------------------------------------------

test('alasan duplikat menyebut gambar bila ada, dan jujur bila tidak', () => {
  assert.match(alasanDuplikat(butirPoster('https://a/x.png')), /1 gambar sama/);
  assert.match(alasanDuplikat({ soal: PERINTAH }), /tidak ada gambar/);
});
