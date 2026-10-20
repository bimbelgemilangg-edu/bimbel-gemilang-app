// regresi 20 Okt: pemisahan halaman pembahasan guru dari edisi siswa.
import test from 'node:test';
import assert from 'node:assert/strict';
import { daftarHalamanSiswa, labelModeBaca, slugBukuPdf, rentangPembahasanDariInput } from '../src/utils/bukuPdfFlip.js';

test('daftarHalamanSiswa menyembunyikan rentang pembahasan', () => {
  const hal = daftarHalamanSiswa(81, [69, 81]);
  assert.equal(hal.length, 68);
  assert.equal(hal[0], 1);
  assert.equal(hal[hal.length - 1], 68);
  assert.ok(!hal.includes(69) && !hal.includes(81));
});

test('tanpa rentang = semua halaman; rentang kosong aman', () => {
  assert.equal(daftarHalamanSiswa(10, []).length, 10);
  assert.equal(daftarHalamanSiswa(10, null).length, 10);
  assert.equal(daftarHalamanSiswa(0, [1, 5]).length, 0);
});

test('label mode baca jujur', () => {
  assert.match(labelModeBaca('guru'), /MODE GURU/);
  assert.match(labelModeBaca('siswa'), /EDISI SISWA/);
});

test('slugBukuPdf & rentangPembahasanDariInput (form upload owner)', () => {
  assert.equal(slugBukuPdf('Master Matematika SMP/MTs Kelas IX!'), 'master-matematika-smp-mts-kelas-ix');
  assert.deepEqual(rentangPembahasanDariInput('69-81'), [69, 81]);
  assert.deepEqual(rentangPembahasanDariInput('81 s/d 69'), [69, 81]);
  assert.deepEqual(rentangPembahasanDariInput('69..81'), [69, 81]);
  assert.deepEqual(rentangPembahasanDariInput(''), []);
  assert.deepEqual(rentangPembahasanDariInput('tidak ada'), []);
});
