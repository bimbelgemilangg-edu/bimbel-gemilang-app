// tests/gambarStimulusSekaliCetak.test.mjs
// ============================================================
// Uji "SATU GAMBAR UNTUK BANYAK SOAL" di mesin cetak (2026-10-29).
//
//     node tests/gambarStimulusSekaliCetak.test.mjs
//
// KENAPA INI ADA (audit owner: "Bimbel Gemilang System-ini.pdf", 13 halaman):
// PDF cetak TO Bahasa Inggris memuat 25 objek gambar tetapi hanya 7 unik —
// 6 gambar stimulus 640×358 tercetak 23 kali (5+5+4+3+3+3). Foto gunung untuk
// soal 1–5 dan foto perpustakaan untuk 6–10 muncul lagi di SETIAP butir,
// padahal rujukan naskah ujian besar (kunci PBM SNBT 2025) menaruh stimulus
// SEKALI di kepala grup ("TEKS 1 (No. 1—4)").
//
// Janji yang dipaku di sini:
//   1. gambar yang dipakai ≥2 butir serun DIANGKAT ke blok stimulus dan
//      tercetak SEKALI ("Perhatikan gambar berikut untuk soal N–M" untuk
//      grup gambar-murni; menempel di blok bacaan untuk grup berteks);
//   2. butir yang gambarnya diangkat TIDAK mencetaknya lagi — termasuk
//      bila gambar dirujuk placeholder {{GAMBAR_n}} (indeks teman-temannya
//      tidak boleh bergeser);
//   3. run SATU butir tidak berubah apa-apa (soal mandiri tetap bergambar);
//   4. tinggi taksiran blok stimulus & butir memakai rumus ukuran yang SAMA
//      dengan yang dirender, dan jumlah blok tetap selaras dengan array
//      tinggi/bendera (penyusun kolom tidak boleh jatuh ke taksiran buta).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  kelompokkanStimulus,
  blokBacaanNaskah,
  butirNaskahHtml,
  daftarBlokNaskah,
  daftarTinggiPerkiraan,
  estimasiTinggiBlokMm,
  estimasiTinggiBacaan,
  gambarStimulusBersama,
  ukuranGambarStimulus,
  ukuranGambarNaskah,
} from '../src/utils/naskahSoal.js';
import { kunciStimulus, gambarButirDari } from '../src/utils/fieldButirSoal.js';

const FOTO = 'https://cdn.gemilang.id/stimulus/gunung-banjir.png';
const FOTO2 = 'https://cdn.gemilang.id/stimulus/perpustakaan.png';
const mandiri = 'https://cdn.gemilang.id/ilustrasi/mandiri.png';

const butirGambar = (id, urls, teks = 'Perhatikan stimulus dengan saksama.') => ({
  id,
  soal: `${id}: ${teks}`,
  gambarUrls: urls,
});
const hitung = (haystack, jarum) => haystack.split(jarum).length - 1;

test('gambarButirDari: gambarUrls utama, alias gambar array cadangan, kosong bila tiada', () => {
  assert.deepEqual(gambarButirDari({ gambarUrls: [FOTO, ''] }), [FOTO]);
  assert.deepEqual(gambarButirDari({ gambar: [{ url: FOTO2 }] }), [FOTO2]);
  assert.deepEqual(gambarButirDari({ soal: 'x' }), []);
  assert.deepEqual(gambarButirDari(null), []);
});

test('kunciStimulus: butir tanpa bacaan tetapi bergambar mendapat kunci gbr: yang sama', () => {
  const a = butirGambar('a', [FOTO]);
  const b = butirGambar('b', [FOTO]);
  const c = butirGambar('c', [mandiri]);
  assert.equal(kunciStimulus(a), kunciStimulus(b));
  assert.ok(kunciStimulus(a).startsWith('gbr:'));
  assert.notEqual(kunciStimulus(a), kunciStimulus(c));
  assert.equal(kunciStimulus({ soal: 'polos' }), '', 'tanpa bacaan tanpa gambar tetap tanpa kunci');
});

test('gambarStimulusBersama: hanya url yang dipakai ≥2 butir, urutan kemunculan pertama', () => {
  const daftar = [
    butirGambar('a', [FOTO, mandiri]),
    butirGambar('b', [FOTO]),
    butirGambar('c', [FOTO2]),
  ];
  assert.deepEqual(gambarStimulusBersama(daftar), [FOTO]);
  assert.deepEqual(gambarStimulusBersama([butirGambar('x', [FOTO])]), [], 'satunya butir bukan stimulus bersama');
  assert.deepEqual(gambarStimulusBersama([]), []);
});

test('kelompokkanStimulus: run gambar-murni jadi unit stimulus + butir membawa daftar angkat', () => {
  const units = kelompokkanStimulus([
    butirGambar('a', [FOTO]),
    butirGambar('b', [FOTO]),
    butirGambar('c', [FOTO]),
    butirGambar('d', [mandiri]),
  ]);
  assert.equal(units[0].jenis, 'bacaan');
  assert.equal(units[0].bacaan, null, 'grup gambar-murni tidak punya teks bacaan');
  assert.deepEqual(units[0].gambarAngkat, [FOTO]);
  assert.deepEqual([units[0].dari, units[0].sampai], [1, 3]);
  assert.deepEqual(units.slice(1, 4).map((u) => u.gambarAngkat), [[FOTO], [FOTO], [FOTO]]);
  assert.deepEqual(units[4].gambarAngkat, [], 'butir mandiri tidak mengangkat apa-apa');
});

test('kelompokkanStimulus: run SATU butir bergambar tidak menghasilkan blok stimulus', () => {
  const units = kelompokkanStimulus([butirGambar('a', [FOTO])]);
  assert.equal(units.length, 2);
  assert.deepEqual(units[0].gambarAngkat, []);
  assert.deepEqual(blokBacaanNaskah(units[0], 90), [], 'run tunggal tanpa blok (gambar tetap milik butir)');
});

test('blokBacaanNaskah: grup gambar-murni mencetak gambar SEKALI dengan penanda rentang', () => {
  const units = kelompokkanStimulus([
    butirGambar('a', [FOTO]),
    butirGambar('b', [FOTO]),
    butirGambar('c', [FOTO]),
  ]);
  const chunks = blokBacaanNaskah(units[0], 90);
  assert.equal(chunks.length, 1);
  assert.equal(hitung(chunks[0].html, FOTO), 1, 'gambar tercetak tepat sekali');
  assert.ok(chunks[0].html.includes('Perhatikan gambar berikut untuk soal 1–3'), 'penanda rentang gaya naskah besar');
  assert.equal(chunks[0].penuh, false);
  assert.ok(chunks[0].tinggi > 0 && Number.isFinite(chunks[0].tinggi));
});

test('blokBacaanNaskah: grup BERTEKS dengan gambar bersama — gambar menyusul teks, sekali', () => {
  const wacana = 'The legend of Son Tinh and Thuy Tinh tells about a flood battle.';
  const daftar = [1, 2].map((n) => ({
    id: `s${n}`,
    soal: `q${n}`,
    bacaan: { teks: wacana, gambar: [] },
    gambarUrls: [FOTO],
  }));
  const units = kelompokkanStimulus(daftar);
  const chunks = blokBacaanNaskah(units[0], 90);
  const gabung = chunks.map((c) => c.html).join('');
  assert.ok(gabung.includes('Bacalah teks berikut untuk soal 1–2'), 'penanda teks tetap dipakai');
  assert.equal(hitung(gabung, FOTO), 1, 'gambar bersama tidak dobel di blok bacaan');
  assert.ok(gabung.indexOf(wacana.slice(0, 20)) < gabung.indexOf(FOTO), 'teks dulu, gambar stimulus menyusul');
});

test('butirNaskahHtml: gambar terangkat tidak tercetak lagi, indeks placeholder teman tetap', () => {
  const soal = {
    id: 'a',
    soal: `Lihat {{GAMBAR}} pertama lalu {{GAMBAR_2}} kedua.`,
    gambarUrls: [FOTO, FOTO2],
  };
  const tanpaAngkat = butirNaskahHtml(soal, 1, 90);
  assert.equal(hitung(tanpaAngkat, FOTO), 1);
  assert.equal(hitung(tanpaAngkat, FOTO2), 1);
  const denganAngkat = butirNaskahHtml(soal, 1, 90, {}, { gambarAngkat: [FOTO] });
  assert.equal(hitung(denganAngkat, FOTO), 0, 'gambar stimulus tidak boleh dobel di butir');
  assert.equal(hitung(denganAngkat, FOTO2), 1, 'gambar lain tetap tercetak');
  assert.ok(!denganAngkat.includes('{{GAMBAR'), 'placeholder tidak bocor jadi token mentah');
});

test('taksiran tinggi: gambar terangkat pindah dari butir ke blok stimulus', () => {
  const soal = butirGambar('a', [FOTO]);
  const rasio = { [FOTO]: 640 / 358 };
  const penuh = estimasiTinggiBlokMm('siswa', soal, 90, rasio);
  const diangkat = estimasiTinggiBlokMm('siswa', soal, 90, rasio, { gambarAngkat: [FOTO] });
  // Butir kehilangan gambar dengan UKURAN NASKAH (rumus lama, mode samping
  // untuk foto melebar); blok stimulus menambahkannya dengan UKURAN STIMULUS
  // (blok, lebih besar). Dua-duanya harus konsisten dengan renderernya.
  const uNaskah = ukuranGambarNaskah(640 / 358, 1, 90);
  assert.ok(Math.abs((penuh - diangkat) - (uNaskah.tinggiMm + 2)) <= 1,
    'tinggi butir berkurang setinggi gambar naskah (toleransi pembulatan 1mm)');
  const u = ukuranGambarStimulus(640 / 358, 90);
  const chunks = blokBacaanNaskah(kelompokkanStimulus([soal, butirGambar('b', [FOTO])])[0], 90, { [FOTO]: 640 / 358 });
  assert.equal(chunks[0].tinggi, Math.round((8 + u.tinggiMm + 2) * 10) / 10, 'blok stimulus menaksir dengan rumus render');
  const bacaan = { teks: 'Teks wacana pendek untuk grup soal literasi.', gambar: [] };
  const tanpa = estimasiTinggiBacaan(bacaan, 90);
  const dengan = estimasiTinggiBacaan(bacaan, 90, rasio, [FOTO]);
  assert.ok(Math.abs((dengan - tanpa) - (u.tinggiMm + 2)) <= 1,
    'blok bacaan menambah tinggi gambar dengan rumus yang sama (toleransi pembulatan 1mm)');
});

test('ukuranGambarStimulus: selalu blok, tinggi dipatok, rasio bawaan bila tak diketahui', () => {
  const u = ukuranGambarStimulus(640 / 358, 90);
  assert.equal(u.mode, 'blok');
  assert.ok(u.lebarMm <= 0.7 * 90 + 0.01 && u.tinggiMm <= 60.01);
  const tegak = ukuranGambarStimulus(0.4, 90);
  assert.ok(tegak.tinggiMm <= 70.01 && tegak.lebarMm >= 26);
  const bawaan = ukuranGambarStimulus(undefined, 90);
  assert.ok(Number.isFinite(bawaan.tinggiMm) && bawaan.tinggiMm > 0);
});

test('daftarBlokNaskah end-to-end: 6 gambar unik tidak lagi jadi 23 cetakan', () => {
  const daftar = [
    ...[1, 2, 3].map((n) => butirGambar(`g${n}`, [FOTO])),
    ...[4, 5].map((n) => butirGambar(`g${n}`, [FOTO2])),
    butirGambar('m1', [mandiri]),
  ];
  const blok = daftarBlokNaskah('siswa', { mapel: 'B.Inggris' }, daftar, 90);
  const gabung = blok.join('');
  assert.equal(hitung(gabung, FOTO), 1, 'foto grup 1–3 sekali');
  assert.equal(hitung(gabung, FOTO2), 1, 'foto grup 4–5 sekali');
  assert.equal(hitung(gabung, mandiri), 1, 'gambar mandiri tetap sekali di butinya');
  assert.ok(gabung.includes('Perhatikan gambar berikut untuk soal 1–3'));
  assert.ok(gabung.includes('Perhatikan gambar berikut untuk soal 4–5'));
  const tinggi = daftarTinggiPerkiraan('siswa', { mapel: 'B.Inggris' }, daftar, 90);
  assert.equal(tinggi.length, blok.length, 'array tinggi selaras indeks dengan blok');
  assert.ok(tinggi.every((t) => Number.isFinite(t) && t > 0));
});

test('grup gambar tidak merusak lembar kunci (kunci tetap per butir, tanpa blok stimulus)', () => {
  const daftar = [1, 2].map((n) => ({ ...butirGambar(`g${n}`, [FOTO]), pembahasan: `Bahasan ${n}.` }));
  const blok = daftarBlokNaskah('kunci', { mapel: 'X' }, daftar, 90);
  assert.equal(blok.length, 1 + 2, 'kop + satu blok per butir kunci');
  assert.ok(!blok.join('').includes('Perhatikan gambar berikut'), 'penanda stimulus tidak menyusup ke kunci');
});
