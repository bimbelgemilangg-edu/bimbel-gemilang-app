// tests/parseTeksBukuDaftarIsi.test.mjs — regresi dialek buku scan (15 Okt 2026):
// daftar isi & kepala seksi kunci tidak boleh lagi lahir sebagai bab, dan
// judul bab badan buku (CAPS tanpa prefiks "BAB") berjangkar ke daftar isi.
// Kasus lapangan: Buku_Matematika_Fase_E_Kelas_10 (392 hal) — sebelum fix:
// 20 bab palsu/raksasa (satu bab 419 seksi); sesudah: 8 bab rapi, 57 soal terbagi.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTeksBuku, entriDaftarIsi, bersihkanJudulBab, barisKolomKunci, barisSampahPendek,
} from '../src/utils/parseTeksBuku.js';

const TOC = [
  'Bab Fase E Topik Kurikulum Merdeka Sumber Bab Buku Asli Hal. PDF Hal. Asli',
  'Bab 1 Eksponen, Bentuk Akar, dan Bab 1: Eksponen Hal. 3 Hal. 1–22',
  'Bab 2 Barisan dan Deret Bab 16: Barisan dan Hal. 70 Hal. 387–',
].join('\n');

const BADAN = [
  'EKSPONEN 1',
  'A. PENGERTIAN EKSPONEN',
  'Eksponen adalah bilangan pangkat.',
  '',
  '1. Nilai dari 2^3 adalah ....',
  'a. 6',
  'b. 8',
  'c. 9',
  'Kunci: B',
  '',
  'BARISAN DAN DERET',
  'Barisan adalah urutan bilangan.',
].join('\n');

const KUNCI = [
  'BAB 1. EKSPONEN BAB 2. BENTUK AKAR', // dua penanda satu baris: noise
  'BAB 24 RELATIVITAS', // kepala seksi kunci, diikuti kolom jawaban
  'D Cc E',
  'E E D',
  '3 E D',
  'BAB 15 TRANSFORMASI GEOMETRI', // kepala seksi kunci rusak (sampah pendek)
  'Im',
  'H£YU',
  'w le)',
].join('\n');

test('entriDaftarIsi: baris TOC jadi kamus, baris badan tidak', () => {
  assert.deepEqual(entriDaftarIsi('Bab 1 Eksponen, Bentuk Akar, dan Bab 1: Eksponen Hal. 3 Hal. 1–22'),
    { nomor: 1, judul: 'Bab 1 Eksponen, Bentuk Akar, dan' });
  assert.equal(entriDaftarIsi('Bab 2 Barisan dan Deret Bab 16: Barisan dan Hal. 70 Hal. 387–').nomor, 2);
  assert.equal(entriDaftarIsi('Bab 2. Persamaan Kuadrat'), null, 'penanda bab biasa bukan TOC');
  assert.equal(entriDaftarIsi('Eksponen adalah bilangan pangkat.'), null);
});

test('bersihkanJudulBab: gema TOC & nomor halaman dibuang', () => {
  assert.equal(bersihkanJudulBab('Bab 8 Teori Peluang Bab 23: Teori Peluang Hal. 353 Hal. 657–'), 'Bab 8 Teori Peluang');
  assert.equal(bersihkanJudulBab('Bab 5 Sistem Persamaan,'), 'Bab 5 Sistem Persamaan');
  assert.equal(bersihkanJudulBab('Bab 2. Persamaan Kuadrat'), 'Bab 2. Persamaan Kuadrat');
});

test('barisKolomKunci & barisSampahPendek', () => {
  assert.equal(barisKolomKunci('D Cc E'), true);
  assert.equal(barisKolomKunci('3 E D'), true);
  assert.equal(barisKolomKunci('Eksponen adalah bilangan pangkat.'), false);
  assert.equal(barisSampahPendek('H£YU'), true);
  assert.equal(barisSampahPendek('w le)'), true);
  assert.equal(barisSampahPendek('Barisan adalah urutan bilangan.'), false);
});

test('parseTeksBuku: TOC & kepala kunci bukan bab; judul CAPS berjangkar TOC', () => {
  const { bab } = parseTeksBuku([TOC, BADAN, KUNCI].join('\n'));
  assert.equal(bab.length, 2, 'hanya bab badan buku yang lahir');
  assert.deepEqual(bab.map((b) => b.judul), ['Bab 1 Eksponen, Bentuk Akar, dan', 'Bab 2 Barisan dan Deret']);
  assert.equal(bab[0].ujiPemahaman.length, 1);
  assert.equal(bab[0].ujiPemahaman[0].benar, 1, 'kunci B');
  assert.equal(bab[0].sections.length, 1, 'seksi awal kosong dibuang; subbab A. tersisa');
  assert.equal(bab[0].sections[0].judul, 'A. PENGERTIAN EKSPONEN');
});

test('parseTeksBuku: buku tanpa daftar isi tetap pakai penanda BAB biasa', () => {
  const teks = [
    'BAB 1 PERSAMAAN KUADRAT',
    'Materi persamaan kuadrat.',
    '1. Akar x^2-4=0 adalah ....',
    'a. 2 dan -2',
    'b. 4 dan -4',
    'Kunci: A',
  ].join('\n');
  const { bab } = parseTeksBuku(teks);
  assert.equal(bab.length, 1);
  assert.equal(bab[0].judul, 'BAB 1 PERSAMAAN KUADRAT');
  assert.equal(bab[0].ujiPemahaman.length, 1);
});
