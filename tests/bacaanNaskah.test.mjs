// tests/bacaanNaskah.test.mjs
// ============================================================
// Uji bahwa BACAAN/wacana dan teks soal sadar-alias benar-benar sampai ke
// lembar cetak (src/utils/naskahSoal.js + src/utils/cetakLatihan.js).
//
//     node tests/bacaanNaskah.test.mjs
//
// KENAPA INI PENTING
// Owner 2026-10-08: "gambar dan soal rumus atau bacaan panjang pastikan
// terlihat ok". Setelah diperiksa, ini bukan soal kosmetik — KEDUA mesin
// cetak tidak merender field `bacaan` sama sekali, dan keduanya hanya
// membaca `soal?.soal || soal?.teks_soal` (tidak `teksSoal`).
//
// Akibat nyata sebelum perbaikan:
//   - Soal literasi (Bahasa Indonesia/Inggris, TKA) tercetak TANPA wacana.
//     Siswa melihat "Simpulan teks di atas adalah ..." dengan tidak ada
//     teks di atasnya. Ini bukan lembar yang kurang rapi — ini lembar
//     yang tidak bisa dikerjakan.
//   - Butir dari Mesin Bank Soal / Impor HTML Gemini yang teksnya ada di
//     `teksSoal` bisa tercetak kosong.
//   - `estimasiTinggiBlokMm` tidak menghitung bacaan, jadi mesin menumpuk
//     terlalu banyak butir per kolom dan naskah meluber — pratinjau layar
//     tidak sama dengan hasil cetak.
//
// Uji di bawah memaku: bacaan tercetak, URUTANNYA sebelum pertanyaan,
// tingginya ikut dihitung, dan teks soal terbaca dari ketiga nama field.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bacaanNaskahHtml,
  butirNaskahHtml,
  estimasiTinggiBlokMm,
  daftarBlokNaskah,
  susunNaskahDariBlok,
} from '../src/utils/naskahSoal.js';
import { htmlPaketSiswa, htmlKunciTentor } from '../src/utils/cetakLatihan.js';
import { bacaanDari, teksSoalDari } from '../src/utils/fieldButirSoal.js';

const WACANA = 'Bimbel Gemilang berdiri tahun 2015 di sebuah kota kecil. '
  + 'Setiap hari ratusan siswa datang untuk belajar bersama tentor. '
  + 'Mereka mengerjakan latihan, membahas soal, dan mengikuti try out rutin.';

const soalLiterasi = (tambahan = {}) => ({
  tipe: 'pg_sederhana',
  soal: 'Simpulan yang paling tepat dari teks di atas adalah',
  opsiJawaban: ['Gemilang hanya menerima siswa kota kecil', 'Gemilang menyediakan latihan dan try out rutin', 'Siswa tidak perlu belajar mandiri', 'Try out diadakan sekali setahun'],
  kunciJawaban: 'B',
  bacaan: { teks: WACANA, gambar: [], grup: 'bacaan_1_5', rentang: { dari: 1, sampai: 5 } },
  ...tambahan,
});

// ------------------------------------------------------------
// 1. Pembaca field sadar-alias
// ------------------------------------------------------------

test('bacaan terbaca dari ketiga nama field yang beredar', () => {
  assert.equal(bacaanDari({ bacaan: { teks: WACANA } }).teks, WACANA);
  assert.equal(bacaanDari({ stimulus: WACANA }).teks, WACANA, 'string polos juga diterima');
  assert.equal(bacaanDari({ wacana: { teks: WACANA } }).teks, WACANA);
  assert.equal(bacaanDari({ bacaan: null }), null);
  assert.equal(bacaanDari({ bacaan: { teks: '   ' } }), null, 'bacaan kosong = tidak ada bacaan');
  assert.equal(bacaanDari(null), null);
});

test('teks soal terbaca dari soal / teksSoal / teks_soal', () => {
  assert.equal(teksSoalDari({ soal: 'A' }), 'A');
  assert.equal(teksSoalDari({ teksSoal: 'B' }), 'B');
  assert.equal(teksSoalDari({ teks_soal: 'C' }), 'C');
  assert.equal(teksSoalDari({ soal: '  ', teksSoal: 'B' }), 'B');
});

// ------------------------------------------------------------
// 2. Naskah dua kolom
// ------------------------------------------------------------

test('bacaan tercetak di naskah, LENGKAP dengan isi wacananya', () => {
  const html = butirNaskahHtml(soalLiterasi(), 1, 92);
  assert.match(html, /nsk-bacaan/);
  assert.ok(html.includes('berdiri tahun 2015'), 'isi wacana harus tercetak, bukan cuma kotaknya');
  assert.match(html, /Bacalah teks berikut/);
});

test('rentang nomor ikut tertulis supaya siswa tahu wacana untuk soal mana', () => {
  const html = butirNaskahHtml(soalLiterasi(), 1, 92);
  assert.match(html, /untuk soal 1–5/);
});

test('INVARIAN: bacaan muncul SEBELUM pertanyaannya', () => {
  const html = butirNaskahHtml(soalLiterasi(), 1, 92);
  const posisiWacana = html.indexOf('berdiri tahun 2015');
  const posisiTanya = html.indexOf('Simpulan yang paling tepat');
  assert.ok(posisiWacana > -1 && posisiTanya > -1);
  assert.ok(posisiWacana < posisiTanya, 'soal literasi merujuk "teks di atas" — wacana harus di atas');
});

test('butir tanpa bacaan tidak mendapat blok bacaan kosong', () => {
  const html = butirNaskahHtml({ tipe: 'pg_sederhana', soal: '2 + 2 =', opsiJawaban: ['3', '4'], kunciJawaban: 'B' }, 1, 92);
  assert.ok(!html.includes('nsk-bacaan'));
});

test('teks soal di `teksSoal` (bukan `soal`) tetap tercetak', () => {
  const html = butirNaskahHtml({ tipe: 'pg_sederhana', teksSoal: 'Nilai dari x + 2 = 5 adalah', opsiJawaban: ['2', '3'], kunciJawaban: 'B' }, 1, 92);
  assert.ok(html.includes('Nilai dari x + 2 = 5 adalah'), 'butir dari Mesin Bank Soal tidak boleh tercetak kosong');
});

test('rumus LaTeX dirender jadi KaTeX, bukan teks $ mentah', () => {
  const html = butirNaskahHtml({
    tipe: 'pg_sederhana',
    soal: 'Hasil dari $\\frac{1}{2} + \\frac{1}{4}$ adalah',
    opsiJawaban: ['$\\frac{3}{4}$', '$\\frac{2}{6}$'],
    kunciJawaban: 'A',
  }, 1, 92);
  assert.match(html, /class="katex"/);
  assert.ok(!html.includes('$\\frac'), 'tanda $ mentah tidak boleh ikut tercetak');
});

test('INVARIAN: tinggi blok bertambah bila ada bacaan panjang', () => {
  const denganBacaan = estimasiTinggiBlokMm('siswa', soalLiterasi(), 92);
  const tanpaBacaan = estimasiTinggiBlokMm('siswa', soalLiterasi({ bacaan: null }), 92);
  assert.ok(denganBacaan > tanpaBacaan,
    `bacaan panjang harus menambah tinggi blok (${denganBacaan} vs ${tanpaBacaan}); kalau tidak, kolom meluber dan pratinjau != hasil cetak`);
});

test('bacaan bergambar ikut dihitung tingginya', () => {
  const denganGambar = estimasiTinggiBlokMm('siswa', soalLiterasi({
    bacaan: { teks: WACANA, gambar: ['https://contoh.test/diagram.png'] },
  }), 92);
  const tanpaGambar = estimasiTinggiBlokMm('siswa', soalLiterasi(), 92);
  assert.ok(denganGambar > tanpaGambar);
});

test('gambar di dalam bacaan dirender sebagai img (bukan diabaikan)', () => {
  const html = bacaanNaskahHtml(soalLiterasi({
    bacaan: { teks: 'Perhatikan diagram {{GAMBAR_1}} berikut.', gambar: ['https://contoh.test/diagram.png'] },
  }), 1, 92);
  assert.match(html, /<img/);
  assert.match(html, /contoh\.test\/diagram\.png/);
  assert.ok(!html.includes('{{GAMBAR'), 'placeholder tidak boleh tercetak mentah');
});

test('naskah lengkap: wacana sampai ke fragmen yang dicetak', () => {
  const blok = daftarBlokNaskah('siswa', { judul: 'Literasi' }, [soalLiterasi()], 92);
  const { fragmen } = susunNaskahDariBlok(blok, { kertas: 'A4', tinggiBlokMm: blok.map((_, i) => (i === 0 ? 26 : 60)) });
  assert.ok(fragmen.includes('berdiri tahun 2015'));
  assert.ok(!/Kunci:/.test(fragmen), 'lembar siswa tetap tidak boleh memuat kunci');
});

// ------------------------------------------------------------
// 3. Lembar gunting (cetakLatihan)
// ------------------------------------------------------------

test('lembar latihan siswa memuat wacana sebelum pertanyaan', () => {
  const html = htmlPaketSiswa({ judul: 'Literasi' }, [soalLiterasi()], { kertas: 'A4' });
  assert.match(html, /class="bacaan"/);
  assert.ok(html.includes('berdiri tahun 2015'));
  assert.ok(html.indexOf('berdiri tahun 2015') < html.indexOf('Simpulan yang paling tepat'));
});

test('kunci tentor tetap ringkas: nomor + kunci + pembahasan (TANPA wacana)', () => {
  // Dinyatakan apa adanya, bukan apa yang diharapkan. Lembar kunci memang
  // SENGAJA ringkas supaya tentor bisa mencocokkan jawaban dengan cepat;
  // wacana lengkapnya ada di lembar siswa. Kalau suatu hari lembar kunci
  // perlu memuat cuplikan soal, ubah htmlKunciTentor + uji ini bersamaan.
  const html = htmlKunciTentor({ judul: 'Literasi' }, [soalLiterasi()], { kertas: 'A4' });
  assert.match(html, /Kunci:/);
  assert.match(html, /PEGANGAN TENTOR/);
  assert.ok(!html.includes('berdiri tahun 2015'), 'wacana sengaja tidak diulang di lembar kunci');
});

test('lembar siswa tanpa bacaan tidak mendapat blok kosong', () => {
  const html = htmlPaketSiswa({ judul: 'Matematika' }, [{ tipe: 'pg_sederhana', soal: '2 + 2 =', opsiJawaban: ['3', '4'], kunciJawaban: 'B' }], { kertas: 'A4' });
  assert.ok(!html.includes('class="bacaan"'));
});
