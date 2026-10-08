// tests/watermarkNaskah.test.mjs
// ============================================================
// Uji watermark logo Gemilang di kedua mesin cetak
// (src/utils/naskahSoal.js + src/utils/cetakLatihan.js).
//
//     node tests/watermarkNaskah.test.mjs
//
// KENAPA INI PENTING
// Owner 2026-10-08 minta kartu baca tentor dan lembar yang dicetak membawa
// logo Gemilang di belakangnya — dan menyebut logo itu "muncul di kwitansi
// juga". Maka ada tiga janji yang harus terpaku:
//
//   1. SATU IDENTITAS: watermark memakai berkas logo yang sama dengan
//      kwitansi. Kalau tiap mesin punya logo sendiri, suatu hari ada
//      dokumen Gemilang yang memakai logo yang sudah tidak dipakai.
//      (Repo ini sudah punya tiga berkas merujuk /logo-gemilang.png.png
//      yang TIDAK ADA di public/ — diselamatkan onError, jadi logonya
//      diam-diam tidak pernah tampil. Jangan menambah yang keempat.)
//   2. TIDAK BOLEH MENUTUPI ISI: watermark ada di lapisan belakang
//      (z-index 0 + pointer-events none), dan konten naik ke z-index 1.
//   3. TIDAK BOLEH MEMBOCORKAN KUNCI: watermark ikut ke lembar siswa,
//      jadi ia tidak boleh membawa teks kunci/pembahasan.
//
// Plus: watermark bisa dimatikan secara eksplisit (`watermark: false`)
// untuk dokumen internal yang tidak akan beredar.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  LOGO_WATERMARK,
  gayaWatermark,
  watermarkHtml,
  daftarBlokNaskah,
  susunNaskahDariBlok,
} from '../src/utils/naskahSoal.js';
import { htmlPaketSiswa, htmlKunciTentor, htmlLembarCatatan } from '../src/utils/cetakLatihan.js';

const soalContoh = {
  tipe: 'pg_sederhana',
  soal: 'Luas lingkaran dengan jari-jari 7 cm adalah',
  opsiJawaban: ['154 cm²', '144 cm²', '164 cm²', '174 cm²'],
  kunciJawaban: 'A',
  pembahasan: 'Luas persegi dikurangi empat kali lipat.',
};
const paket = { judul: 'Latihan Lingkaran', mapel: 'Matematika', targetKelas: 'SMA/MA' };

const diRepo = join(dirname(fileURLToPath(import.meta.url)), '..');

// ------------------------------------------------------------
// 1. Satu identitas dengan kwitansi
// ------------------------------------------------------------

test('logo watermark = logo yang dipakai kwitansi (satu identitas)', () => {
  const kwitansi = readFileSync(join(diRepo, 'src/utils/kwitansi.js'), 'utf8');
  const dipakaiKwitansi = kwitansi.match(/const logo = '([^']+)'/);
  assert.ok(dipakaiKwitansi, 'kwitansi harus punya konstanta logo');
  assert.equal(LOGO_WATERMARK, dipakaiKwitansi[1]);
});

test('berkas logonya BENAR-BENAR ADA di public/ (bukan rujukan buntu)', () => {
  // Tiga berkas di repo ini merujuk /logo-gemilang.png.png yang tidak ada.
  // Watermark tidak boleh mengulang kesalahan yang sama.
  const path = join(diRepo, 'public', LOGO_WATERMARK.replace(/^\//, ''));
  const ada = readFileSync(path);
  assert.ok(ada.length > 0, `${LOGO_WATERMARK} harus ada dan tidak kosong`);
});

// ------------------------------------------------------------
// 2. CSS & HTML watermark
// ------------------------------------------------------------

test('watermark di lapisan belakang dan tidak menangkap klik', () => {
  const css = gayaWatermark({ mode: 'halaman' });
  assert.match(css, /z-index: 0/);
  assert.match(css, /pointer-events: none/);
  // konten dinaikkan supaya tidak tertutup
  assert.match(css, /z-index: 1/);
});

test('mode tetap memakai position:fixed supaya diulang tiap halaman cetak', () => {
  assert.match(gayaWatermark({ mode: 'tetap' }), /position: fixed/);
  assert.match(gayaWatermark({ mode: 'halaman' }), /position: absolute/);
});

test('opacity default rendah tapi tidak nol (harus tetap terlihat)', () => {
  const css = gayaWatermark();
  const opacity = Number(css.match(/opacity:\s*([0-9.]+)/)[1]);
  assert.ok(opacity > 0, 'opacity 0 = watermark tidak berguna');
  assert.ok(opacity <= 0.2, `opacity ${opacity} terlalu pekat, akan mengganggu baca`);
});

test('watermarkHtml menandai diri sebagai hiasan (aria-hidden) dan meng-escape logo', () => {
  const html = watermarkHtml();
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /<img src="\/pwa-192x192\.png"/);
  const jahat = watermarkHtml({ logo: '/a.png" onerror="alert(1)' });
  assert.ok(!jahat.includes('" onerror="'), 'atribut tidak boleh bisa disuntik');
});

// ------------------------------------------------------------
// 3. Naskah dua kolom
// ------------------------------------------------------------

test('naskah siswa membawa watermark secara default', () => {
  const blok = daftarBlokNaskah('siswa', paket, [soalContoh], 92);
  const { fragmen } = susunNaskahDariBlok(blok, { kertas: 'A4', tinggiBlokMm: [40, 40] });
  assert.match(fragmen, /wm-gemilang/);
  assert.match(fragmen, /pwa-192x192\.png/);
});

test('watermark bisa dimatikan secara eksplisit', () => {
  const blok = daftarBlokNaskah('siswa', paket, [soalContoh], 92);
  const { fragmen } = susunNaskahDariBlok(blok, { kertas: 'A4', tinggiBlokMm: [40, 40], watermark: false });
  assert.ok(!fragmen.includes('wm-gemilang'));
});

test('INVARIAN: watermark tidak membocorkan kunci ke lembar siswa', () => {
  const blok = daftarBlokNaskah('siswa', paket, [soalContoh], 92);
  const { fragmen } = susunNaskahDariBlok(blok, { kertas: 'A4', tinggiBlokMm: [40, 40] });
  assert.ok(!/Kunci:/.test(fragmen));
  assert.ok(!fragmen.includes('Luas persegi dikurangi'));
});

test('tiap halaman punya watermark sendiri (bukan satu untuk semua)', () => {
  const blok = daftarBlokNaskah('siswa', paket, [soalContoh, soalContoh, soalContoh], 92);
  // PENTING: daftarBlokNaskah menghasilkan blok KOPO + satu blok per butir,
  // jadi panjangnya jumlahSoal + 1. `susunNaskahDariBlok` hanya memakai
  // tinggiBlokMm bila panjangnya PERSIS sama dengan jumlah blok; kalau
  // tidak cocok ia diam-diam jatuh ke tinggi perkiraan dan seluruh butir
  // muat di satu halaman (uji ini akan lolos palsu). Angka di bawah
  // dinyatakan dari jumlah blok, bukan ditebak.
  const tinggi = blok.map((_, i) => (i === 0 ? 26 : 200));
  assert.equal(tinggi.length, blok.length);
  const { fragmen, jumlahHalaman } = susunNaskahDariBlok(blok, { kertas: 'A4', tinggiBlokMm: tinggi });
  assert.ok(jumlahHalaman >= 2, `uji ini butuh >=2 halaman, dapat ${jumlahHalaman}`);
  // Hitung ELEMEN-nya, bukan semua kemunculan teks `wm-gemilang`: nama itu
  // juga muncul di dalam blok <style> sebagai selektor CSS, jadi menghitung
  // teks polos akan selalu lebih besar dari jumlah halaman.
  const jumlah = (fragmen.match(/<div class="wm-gemilang/g) || []).length;
  assert.equal(jumlah, jumlahHalaman, 'satu watermark per halaman');
});

// ------------------------------------------------------------
// 4. Lembar gunting (cetakLatihan)
// ------------------------------------------------------------

test('ketiga dokumen lembar gunting membawa watermark', () => {
  for (const [nama, hasil] of [
    ['paket siswa', htmlPaketSiswa(paket, [soalContoh], { kertas: 'A4' })],
    ['kunci tentor', htmlKunciTentor(paket, [soalContoh], { kertas: 'A4' })],
    ['lembar catatan', htmlLembarCatatan(paket, [soalContoh], { kertas: 'A4' })],
  ]) {
    assert.match(hasil, /wm-gemilang/, `${nama} harus ber-watermark`);
    assert.match(hasil, /position: fixed/, `${nama} harus mengulang watermark tiap halaman`);
  }
});

test('watermark lembar gunting juga bisa dimatikan', () => {
  const h = htmlPaketSiswa(paket, [soalContoh], { kertas: 'A4', watermark: false });
  assert.ok(!h.includes('wm-gemilang'));
  assert.ok(!h.includes('position: fixed; top: 50%'));
});

test('kunci tentor tetap mengaku sebagai pegangan guru', () => {
  const h = htmlKunciTentor(paket, [soalContoh], { kertas: 'A4' });
  assert.match(h, /PEGANGAN TENTOR/);
  assert.match(h, /Kunci:/);
});
