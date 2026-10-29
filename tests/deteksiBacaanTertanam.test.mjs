// tests/deteksiBacaanTertanam.test.mjs
// ============================================================
// Uji detektor "bacaan tertanam di teks_soal" (2026-10-29, audit owner:
// PDF TO B.Inggris — wacana tercetak 5× karena pihak ketiga menyalin
// wacana ke TEKS tiap nomor alih-alih field bacaan).
//
//     node tests/deteksiBacaanTertanam.test.mjs
//
// Janji yang dipaku:
//   1. sederetan soal BERURUTAN tanpa field bacaan yang berbagi awalan
//      identik ≥300 karakter terdeteksi sebagai satu wacana tertanam;
//   2. data yang patuh kontrak (field bacaan terisi) TIDAK dituduh;
//   3. deteksi = peringatan, bukan penolakan — util murni, tidak mengubah data;
//   4. run yang terputus soal sisipan dideteksi sebagai dua temuan terpisah.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { deteksiBacaanTertanam, panjangAwalanSama } from '../src/utils/deteksiBacaanTertanam.js';

const BACAAN = 'The Legend of Son Tinh and Thuy Tinh. King Hung Vuong VI had a beautiful daughter. '.repeat(6); // ~510 karakter
const soalTertanam = (nomor, tanya) => ({ nomor, soal: `${BACAAN}${tanya}`, opsiJawaban: ['a', 'b'], kunciJawaban: 'A' });
const soalRapi = (nomor, tanya, grup = 'g1') => ({
  nomor,
  soal: tanya,
  bacaan: { teks: BACAAN, gambar: [], grup },
  opsiJawaban: ['a', 'b'],
  kunciJawaban: 'A',
});

test('run berurutan berbagi awalan panjang tanpa field bacaan = SATU temuan', () => {
  const t = deteksiBacaanTertanam([soalTertanam(1, 'Q1?'), soalTertanam(2, 'Q2?'), soalTertanam(3, 'Q3?')]);
  assert.equal(t.length, 1);
  assert.equal(t[0].jumlahSoal, 3);
  assert.deepEqual(t[0].nomor, [1, 2, 3]);
  assert.equal(t[0].dariIndeks, 0);
  assert.equal(t[0].sampaiIndeks, 2);
  assert.ok(t[0].panjangAwalan >= 300, `awalan ${t[0].panjangAwalan} harus ≥ 300`);
  assert.ok(t[0].contohAwalan.startsWith('The Legend'), 'contoh awalan untuk pesan admin');
});

test('data patuh kontrak (field bacaan terisi) tidak dituduh', () => {
  assert.deepEqual(deteksiBacaanTertanam([soalRapi(1, 'Q1?'), soalRapi(2, 'Q2?')]), []);
});

test('campuran patuh: hanya butir tanpa bacaan yang berawalan sama yang kena', () => {
  const t = deteksiBacaanTertanam([soalRapi(1, 'Q1?'), soalTertanam(2, 'Q2?'), soalTertanam(3, 'Q3?')]);
  assert.equal(t.length, 1);
  assert.deepEqual(t[0].nomor, [2, 3]);
});

test('awalan berbeda / teks pendek / butir tunggal tidak menghasilkan temuan', () => {
  const a = { nomor: 1, soal: `X ${'teks panjang '.repeat(60)}` };
  const b = { nomor: 2, soal: `Y ${'teks panjang '.repeat(60)}` };
  assert.deepEqual(deteksiBacaanTertanam([a, b]), [], 'awalan langsung berbeda');
  assert.deepEqual(deteksiBacaanTertanam([{ nomor: 1, soal: 'Soal pendek.' }]), [], 'butir tunggal');
  assert.deepEqual(deteksiBacaanTertanam([soalTertanam(1, 'Q1?')]), [], 'sendirian bukan pola');
  assert.deepEqual(deteksiBacaanTertanam([]), []);
  assert.deepEqual(deteksiBacaanTertanam(null), []);
});

test('run yang terputus sisipan dideteksi sebagai dua temuan terpisah', () => {
  const sisip = { nomor: 3, soal: 'Soal sisipan pendek tanpa wacana.' };
  const t = deteksiBacaanTertanam([
    soalTertanam(1, 'Q1?'), soalTertanam(2, 'Q2?'),
    sisip,
    soalTertanam(4, 'Q4?'), soalTertanam(5, 'Q5?'),
  ]);
  assert.equal(t.length, 2);
  assert.deepEqual(t[0].nomor, [1, 2]);
  assert.deepEqual(t[1].nomor, [4, 5]);
});

test('util murni: tidak memutasi masukan', () => {
  const daftar = [soalTertanam(1, 'Q1?'), soalTertanam(2, 'Q2?')];
  const salinan = JSON.stringify(daftar);
  deteksiBacaanTertanam(daftar);
  assert.equal(JSON.stringify(daftar), salinan);
});

test('panjangAwalanSama dasar', () => {
  assert.equal(panjangAwalanSama('abcX', 'abcY'), 3);
  assert.equal(panjangAwalanSama('', 'abc'), 0);
  assert.equal(panjangAwalanSama('abc', 'abc'), 3);
});
