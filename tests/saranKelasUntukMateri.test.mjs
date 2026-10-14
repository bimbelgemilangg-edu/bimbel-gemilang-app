// tests/saranKelasUntukMateri.test.mjs — "sistem yang tahu materi kelas berapa"
import test from 'node:test';
import assert from 'node:assert/strict';
import { saranKelasUntukMateri } from '../src/utils/saranKelasUntukMateri.js';

const bank = [
  { materi: 'Persamaan Kuadrat', tingkatKelas: '10' },
  { materi: 'Persamaan Kuadrat', tingkatKelas: '10' },
  { materi: 'persamaan kuadrat', tingkatKelas: '11' },
  { materi: 'Matrices', tingkatKelas: '11' },
];

test('saran kelas = modus kelas butir bank bermateri sama', () => {
  const s = saranKelasUntukMateri({ mapel: 'Matematika', materi: 'Persamaan Kuadrat', sampelBank: bank });
  assert.equal(s.kelas, '10');
  assert.match(s.alasan, /fase E/);
  assert.equal(s.kandidat.length, 2);
});

test('tanpa padanan di bank: saran kosong + acuan fase jujur', () => {
  const s = saranKelasUntukMateri({ materi: 'Transformasi Geometri', sampelBank: bank });
  assert.equal(s.kelas, '');
  assert.match(s.alasan, /fase Kurikulum Merdeka/);
});

test('materi kosong tidak menebak', () => {
  assert.equal(saranKelasUntukMateri({ materi: '', sampelBank: bank }).kelas, '');
});
