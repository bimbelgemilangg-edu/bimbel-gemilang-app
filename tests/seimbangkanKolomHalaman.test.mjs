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
