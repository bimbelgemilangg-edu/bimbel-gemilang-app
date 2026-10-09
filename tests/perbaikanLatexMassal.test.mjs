// tests/perbaikanLatexMassal.test.mjs
// ============================================================
// Uji rencana perbaikan kurung himpunan LaTeX untuk data lama
// (src/utils/perbaikanLatexMassal.js).
//
//     node tests/perbaikanLatexMassal.test.mjs
//
// 51 butir warisan masih memuat `{2, 3}` polos di dalam span matematika.
// Mesin perbaiknya sudah ada & teruji (kurungLatex.js, dipasang di jalur
// impor sejak 2026-10-05); berkas ini hanya membawanya ke data lama sebagai
// RENCANA yang bisa dibaca manusia sebelum diterapkan.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { rencanaPerbaikanLatex, hitungFieldBerubah } from '../src/utils/perbaikanLatexMassal.js';

test('kurung himpunan polos DI DALAM span matematika diperbaiki', () => {
  const r = rencanaPerbaikanLatex([{ id: 'a', data: { soal: 'Himpunan penyelesaian: ${2, 3}$.', tipe: 'pg_sederhana' } }]);
  assert.equal(r.length, 1);
  assert.match(r[0].perubahan.soal, /\\\{2, 3\\\}/);
  assert.equal(r[0].sebelum.soal, 'Himpunan penyelesaian: ${2, 3}$.', 'nilai lama wajib disertakan');
});

test('INVARIAN: idempoten — hasil perbaikan tidak menghasilkan rencana baru', () => {
  const awal = [{ id: 'a', data: { soal: 'HP: ${x > 2}$ dan ${3}$.', opsiJawaban: ['${1, 2}$', 'x'] } }];
  const r1 = rencanaPerbaikanLatex(awal);
  assert.ok(r1.length === 1);
  const sesudah = [{ id: 'a', data: { ...awal[0].data, ...r1[0].perubahan } }];
  assert.deepEqual(rencanaPerbaikanLatex(sesudah), [], 'jalan kedua kali harus nol perubahan');
});

test('kurung di LUAR span matematika adalah teks biasa — tidak disentuh', () => {
  assert.deepEqual(rencanaPerbaikanLatex([{ id: 'luar', data: { soal: 'Daftar {2, 3} bukan matematika.' } }]), []);
});

test('teks yang sudah di-escape dan perintah LaTeX TIDAK disentuh', () => {
  const r = rencanaPerbaikanLatex([{
    id: 'b',
    data: { soal: 'Himpunan $\\{2\\}$ dan $\\frac{1}{2}$ serta f(x) = x^2.', pembahasan: 'Pakai $\\text{cara}$ biasa.' },
  }]);
  assert.deepEqual(r, []);
});

test('alias teksSoal juga diperbaiki bila soal tidak ada', () => {
  const r = rencanaPerbaikanLatex([{ id: 'c', data: { teksSoal: 'Anggota ${1, 2, 3}$ adalah' } }]);
  assert.equal(r.length, 1);
  assert.match(r[0].perubahan.teksSoal, /\\\{1, 2, 3\\\}/);
  assert.equal(r[0].perubahan.soal, undefined, 'field yang tidak ada tidak boleh diciptakan');
});

test('opsi, pernyataan, tabel, pasangan, dan pembahasan ikut diperbaiki', () => {
  const r = rencanaPerbaikanLatex([{
    id: 'd',
    data: {
      soal: 'OK',
      opsiJawaban: ['${2}$', { teks: '${3}$' }, 'x'],
      pernyataan: ['Himpunan ${a}$'],
      tabelBenarSalah: [{ pernyataan: 'Himpunan ${b}$', kunci: 'benar' }],
      pasangan: [{ kiri: '${k}$', kanan: 'v' }],
      pembahasan: 'Jawaban ${2}$.',
    },
  }]);
  assert.equal(r.length, 1);
  const p = r[0].perubahan;
  assert.match(p.opsiJawaban[0], /\\\{2\\\}/);
  assert.match(p.opsiJawaban[1].teks, /\\\{3\\\}/);
  assert.equal(p.opsiJawaban[2], 'x', 'opsi bersih tidak berubah');
  assert.match(p.pernyataan[0], /\\\{a\\\}/);
  assert.match(p.tabelBenarSalah[0].pernyataan, /\\\{b\\\}/);
  assert.match(p.pasangan[0].kiri, /\\\{k\\\}/);
  assert.match(p.pembahasan, /\\\{2\\\}/);
  assert.equal(hitungFieldBerubah(r), 5);
});

test('kunci jawaban TIDAK disentuh (huruf/teks pasti, bukan himpunan)', () => {
  const r = rencanaPerbaikanLatex([{ id: 'e', data: { soal: 'OK', kunciJawaban: 'B' } }]);
  assert.deepEqual(r, []);
});

test('input janggal tidak melempar', () => {
  assert.deepEqual(rencanaPerbaikanLatex(null), []);
  assert.deepEqual(rencanaPerbaikanLatex([{}]), []);
  assert.deepEqual(rencanaPerbaikanLatex([{ id: 'x', data: null }]), []);
  assert.equal(hitungFieldBerubah(null), 0);
});
