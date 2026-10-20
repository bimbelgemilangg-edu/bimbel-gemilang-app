// regresi 20 Okt: pemetaan slot navigasi bawah siswa (tombol tengah =
// kawasan belajar gabungan e-learning + buku digital).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DAFTAR_MENU_BAWAH, menuAktifBawah } from '../src/utils/menuBawahSiswa.js';

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
