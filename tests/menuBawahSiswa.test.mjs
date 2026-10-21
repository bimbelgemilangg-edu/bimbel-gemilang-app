// regresi 20 Okt: pemetaan slot navigasi bawah siswa (tombol tengah =
// kawasan belajar gabungan e-learning + buku digital).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DAFTAR_MENU_BAWAH, menuAktifBawah, navBawahSembunyiDiRute } from '../src/utils/menuBawahSiswa.js';

test('lima slot dengan tepat satu tombol tengah', () => {
  assert.equal(DAFTAR_MENU_BAWAH.length, 5);
  assert.equal(DAFTAR_MENU_BAWAH.filter((m) => m.tengah).length, 1);
  assert.equal(DAFTAR_MENU_BAWAH.find((m) => m.tengah).rute, '/siswa/akses-belajar');
});

test('rute anak belajar menyalakan slot tengah', () => {
  for (const p of ['/siswa/akses-belajar', '/siswa/buku', '/siswa/buku/b1', '/siswa/buku/b1/bab2', '/siswa/materi', '/siswa/belajar/x', '/siswa/kuis/k1']) {
    assert.equal(menuAktifBawah(p), 'akses', p);
  }
});

test('slot lain & rute tak dikenal', () => {
  assert.equal(menuAktifBawah('/siswa/dashboard'), 'beranda');
  assert.equal(menuAktifBawah('/siswa/tryout/p1'), 'tryout');
  assert.equal(menuAktifBawah('/siswa/jadwal'), 'jadwal');
  assert.equal(menuAktifBawah('/siswa/absensi'), 'absensi');
  assert.equal(menuAktifBawah('/admin/buku'), '');
});

// ============================================================
// REGRESI 21 OKT 2026 -- foto owner dari ponsel: "harusnya full
// tampilan soal ... tombol kirim submit ... bahkan soal tertutupi".
// Bar navigasi bawah (zIndex 1200) menutupi opsi jawaban + tombol
// Kirim di sesi try out, dan menutupi TOTAL bar submit kuis
// StudentQuizView (fixed bottom, zIndex cuma 100). Solusi: nav
// MENGHILANG di rute "sedang mengerjakan".
// ============================================================

test('nav bawah SEMBUNYI di rute sedang mengerjakan', () => {
  for (const p of [
    '/siswa/tryout/paket123',        // sesi ujian (bukan daftar)
    '/siswa/tryout/p1/sub',          // rute anak sesi tetap tersembunyi
    '/siswa/kuis/k1',                // kuis ber-timer, bar submit sendiri
    '/siswa/kuis/k1/hasil',
    '/siswa/latihan-harian',         // gaya app mobile, back sendiri
    '/siswa/latihan-harian/mode',
  ]) {
    assert.equal(navBawahSembunyiDiRute(p), true, p);
  }
});

test('nav bawah TETAP tampil di daftar & halaman konten', () => {
  for (const p of [
    '/siswa/tryout',                 // DAFTAR try out tetap butuh nav
    '/siswa/tryout/',                // trailing slash = tetap daftar
    '/siswa/kuis',
    '/siswa/modul/m1',               // halaman materi, bukan pengerjaan
    '/siswa/dashboard', '/siswa/jadwal', '/siswa/absensi',
    '/siswa/akses-belajar', '/siswa/buku/b1/bab2', '/siswa/belajar/x',
    '/siswa/leaderboard', '/siswa/survei/s1', '/siswa/buku-pdf/b1',
    '/admin/tryout/p1',              // rute admin tak tersentuh
    '', '/',
  ]) {
    assert.equal(navBawahSembunyiDiRute(p), false, p);
  }
});

test('navBawahSembunyiDiRute aman untuk input null/undefined/angka', () => {
  assert.equal(navBawahSembunyiDiRute(), false);
  assert.equal(navBawahSembunyiDiRute(null), false);
  assert.equal(navBawahSembunyiDiRute(undefined), false);
  assert.equal(navBawahSembunyiDiRute(123), false);
});
