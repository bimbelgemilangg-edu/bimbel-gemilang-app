// tests/keranjangTryOut.test.mjs
// ============================================================
// Uji pagar tipe soal + rincian keranjang buat tombol BARU
// "＋ 1 Folder" di halaman Terbitkan Try Out (permintaan owner
// 2026-10: terbitkan try out langsung satu folder).
// KENAPA di-test: pagar tipeDidukung() adalah SATU-SATU nya yang
// mencegah soal tipe belum didukung (menjodohkan dst) bocor ke try
// out siswa. Kalau pagar ini bocor, siswa lihat soal rusak diam-diam.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TIPE_TERDUKUNG, tipeDidukung, hitungRincianMasukKeranjang, teksRincianKeranjang,
} from '../src/utils/keranjangTryOut.js';

test('semua tipe yang punya renderer didukung', () => {
  ['pg_sederhana', 'pg_kompleks', 'benar_salah', 'pg_kategori', 'isian_singkat', 'numerik', 'esai', 'uraian']
    .forEach((tipe) => assert.equal(tipeDidukung({ id: 'x', tipe }), true, `tipe ${tipe} harus didukung`));
});

test('tipe tanpa renderer tetap diblokir (pagar jangan bocor)', () => {
  ['menjodohkan', 'pg_komplek', 'PG_SEDERHANA', 'multiple_choice'].forEach((tipe) => {
    assert.equal(tipeDidukung({ id: 'x', tipe }), false, `tipe "${tipe}" harus diblokir`);
  });
});

test('tipe kosong string dianggap pg_sederhana (perilaku lama DIPERTAHANKAN)', () => {
  // KENAPA: soal-soal lama di Firestore ada yang field tipe-nya string
  // kosong, dan sejak awal sistem itu dibaca sebagai pg_sederhana.
  // Mengubahnya jadi "diblokir" akan membuat soal lama tiba-tiba gak
  // bisa diterbitkan -- itu regresi, bukan perbaikan.
  assert.equal(tipeDidukung({ id: 'x', tipe: '' }), true);
});

test('soal tanpa field tipe dianggap pg_sederhana (perilaku lama dipertahankan)', () => {
  assert.equal(tipeDidukung({ id: 'x' }), true);
  assert.equal(tipeDidukung(undefined), true); // gak boleh melempar
});

test('daftar TIPE_TERDUKUNG tidak berubah tanpa sengaja (kontrak renderer)', () => {
  assert.deepEqual(TIPE_TERDUKUNG, ['pg_sederhana', 'pg_kompleks', 'benar_salah', 'pg_kategori', 'isian_singkat', 'numerik', 'esai', 'uraian']);
});

test('rincian keranjang: pisah baru / sudah ada / dilewati', () => {
  const keranjang = new Set(['s1']);
  const daftar = [
    { id: 's1', tipe: 'pg_sederhana' },   // sudah ada
    { id: 's2', tipe: 'pg_kompleks' },    // baru
    { id: 's3', tipe: 'benar_salah' },    // baru
    { id: 's4', tipe: 'menjodohkan' },    // dilewati
    { id: 's5' },                          // baru (tanpa tipe = pg_sederhana)
  ];
  assert.deepEqual(hitungRincianMasukKeranjang(keranjang, daftar), { baru: 3, sudahAda: 1, dilewati: 1 });
});

test('rincian keranjang terima Map (keranjang halaman memang Map)', () => {
  const keranjang = new Map([['a', { id: 'a' }]]);
  const rincian = hitungRincianMasukKeranjang(keranjang, [{ id: 'a', tipe: 'esai' }, { id: 'b', tipe: 'esai' }]);
  assert.deepEqual(rincian, { baru: 1, sudahAda: 1, dilewati: 0 });
});

test('rincian keranjang aman buat folder kosong / input aneh', () => {
  assert.deepEqual(hitungRincianMasukKeranjang(new Set(), []), { baru: 0, sudahAda: 0, dilewati: 0 });
  assert.deepEqual(hitungRincianMasukKeranjang(null, null), { baru: 0, sudahAda: 0, dilewati: 0 });
});

test('kalimat konfirmasi jujur per kombinasi', () => {
  assert.equal(teksRincianKeranjang({ baru: 25, sudahAda: 0, dilewati: 0 }), '✓ 25 soal masuk keranjang.');
  assert.equal(
    teksRincianKeranjang({ baru: 5, sudahAda: 20, dilewati: 2 }),
    '✓ 5 soal masuk keranjang, 20 sudah ada sebelumnya, 2 dilewati karena tipe belum didukung.',
  );
  assert.equal(teksRincianKeranjang({ baru: 0, sudahAda: 30, dilewati: 0 }), '✓ 30 sudah ada sebelumnya.');
  assert.equal(teksRincianKeranjang({ baru: 0, sudahAda: 0, dilewati: 0 }), 'Folder ini belum punya soal aktif bertipe didukung.');
});
