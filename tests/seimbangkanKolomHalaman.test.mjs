import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seimbangkanKolomHalaman } from '../src/utils/naskahSoal.js';

// 2026-10-21 (owner: "kadang itemnya di dalam berkas dikit banget, banyak space
// kosong, membuang kertas"): pengepakan rakus menutup kolom begitu butir
// berikutnya tak muat, jadi dasar kolom menyisakan lubang sebesar satu butir.
// Penyeimbang ini meratakan isi antar kolom TANPA memotong butir dan TANPA
// mengubah urutan nomor.
//
// Bentuk data: halaman = [ [kolomA, kolomB, ...], ... ]; tiap kolom = daftar
// indeks blok. Jadi satu halaman dua kolom berisi tiga butir = [[[0,1],[2]]].

const jumlah = (kolom, tinggi) => kolom.reduce((a, i) => a + (Number.isFinite(tinggi[i]) ? tinggi[i] : 10), 0);

test('lubang antar kolom diperkecil dan urutan nomor tetap naik', () => {
  const halaman = [[[0, 1], [2]]];
  const tinggi = [60, 30, 50];
  const out = seimbangkanKolomHalaman(halaman, tinggi, 2, 120)[0];
  assert.deepEqual(out.flat().sort((a, b) => a - b), [0, 1, 2]);
  const sesudah = out.map((k) => jumlah(k, tinggi));
  const sebelum = [jumlah([0, 1], tinggi), jumlah([2], tinggi)];
  assert.ok(
    Math.max(...sesudah) - Math.min(...sesudah) < Math.max(...sebelum) - Math.min(...sebelum),
    `selisih tinggi kolom harus mengecil: sebelum ${sebelum} sesudah ${sesudah}`,
  );
  assert.ok(out.every((k) => k.length > 0), 'tak boleh ada kolom kosong');
});

test('menolak penyebaran yang membuat kolom meluber kapasitas', () => {
  const halaman = [[[0, 1], [2]]];
  const tinggi = [100, 100, 100];
  const out = seimbangkanKolomHalaman(halaman, tinggi, 2, 120)[0];
  assert.deepEqual(out, [[0, 1], [2]]); // susunan lama dipertahankan
});

test('menolak penyebaran yang mengosongkan sebuah kolom', () => {
  const halaman = [[[0], [1]]];
  const out = seimbangkanKolomHalaman(halaman, [10, 10], 4, 120)[0];
  assert.deepEqual(out, [[0], [1]]);
});

test('satu kolom, halaman kosong, dan kolom tunggal dikembalikan apa adanya', () => {
  assert.deepEqual(seimbangkanKolomHalaman([[[0, 1, 2]]], [10, 10, 10], 1, 120)[0], [[0, 1, 2]]);
  assert.deepEqual(seimbangkanKolomHalaman([], [10], 2, 120), []);
});

test('tinggi tak terukur dianggap 10 mm dan tidak melempar galat', () => {
  const out = seimbangkanKolomHalaman([[[0, 1], [2]]], [undefined, 40, 40], 2, 200)[0];
  assert.deepEqual(out.flat().sort((a, b) => a - b), [0, 1, 2]);
});

// 🔥 2026-10-29 (audit owner: PDF TO B.Inggris menunjukkan nomor tercetak
// SELANG-SELING antar kolom — halaman 11: 21,23,22,24; halaman 17: 43,45,44):
// versi lama menyebar blok greedy "kolom termuat dulu" sehingga kolom bisa
// berisi [21,23] dan [22,24]. Di kertas, siswa membaca kolom 1 atas-bawah
// lalu kolom 2 — nomor WAJIB urut lanjut, jadi satu-satunya penyebaran sah
// adalah POTONGAN BERURUTAN.
test('INVARIAN URUTAN: isi kolom selalu rentang berurutan, greedy selang-seling ditolak', () => {
  // Kasus nyata yang diacak versi lama: tinggi [10,100,10,10] membuat greedy
  // lama menghasilkan kolom [0,2,3] dan [1] (selisih 70 < 90 → diterima).
  const halaman = [[[0, 1], [2, 3]]];
  const tinggi = [10, 100, 10, 10];
  const out = seimbangkanKolomHalaman(halaman, tinggi, 2, 200)[0];
  assert.deepEqual(out.flat(), [0, 1, 2, 3], 'dibaca kolom 1 lalu kolom 2, nomor harus naik');
  for (const k of out) {
    for (let i = 1; i < k.length; i += 1) assert.equal(k[i], k[i - 1] + 1, 'isi kolom berurutan tanpa lompatan');
  }
  if (out.length > 1) {
    assert.ok(out[1][0] === out[0][out[0].length - 1] + 1, 'kolom 2 menyambung tepat setelah kolom 1');
  }
});

test('potongan berurutan yang menguntungkan tetap dipakai (selisih tinggi mengecil)', () => {
  const halaman = [[[0, 1, 2], [3]]];
  const tinggi = [40, 40, 10, 10];
  const out = seimbangkanKolomHalaman(halaman, tinggi, 2, 200)[0];
  assert.deepEqual(out, [[0], [1, 2, 3]], 'titik potong terbaik: 40 vs 60 (selisih 20, dari 80)');
});

test('tiga kolom pun hanya boleh memotong berurutan', () => {
  const halaman = [[[0, 1], [2, 3], [4, 5]]];
  const tinggi = [50, 10, 10, 10, 10, 50];
  const out = seimbangkanKolomHalaman(halaman, tinggi, 3, 200)[0];
  assert.deepEqual(out.flat(), [0, 1, 2, 3, 4, 5], 'urutan baca lintas kolom tetap naik');
  for (const k of out) {
    for (let i = 1; i < k.length; i += 1) assert.equal(k[i], k[i - 1] + 1);
  }
});
