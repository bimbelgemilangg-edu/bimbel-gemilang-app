// Uji urutan folder sumber (permintaan owner 2026-11-03): folder yang
// BARU masuk harus selalu tampil paling atas di halaman penerbitan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { urutkanFolderTerbaruDulu, waktuFolder } from '../src/utils/urutanFolderSumber.js';

test('waktuFolder toleran terhadap semua bentuk penyimpanan', () => {
  assert.equal(waktuFolder({ createdAt: { seconds: 100 } }), 100);
  assert.equal(waktuFolder({ createdAt: 1700000000000 }), 1700000000);
  assert.equal(waktuFolder({ createdAt: 1700000000 }), 1700000000);
  assert.equal(waktuFolder({}), 0);
  assert.equal(waktuFolder(null), 0);
  assert.equal(waktuFolder({ createdAt: { toDate: () => new Date(2000) } }), 2);
});

test('folder terbaru selalu paling atas', () => {
  const daftar = [
    { id: 'lama', judul: 'TKA MATEMATIKA WAJIB SMA 2026', createdAt: { seconds: 10 } },
    { id: 'baru', judul: 'TKA GEL 2', createdAt: { seconds: 99 } },
    { id: 'tengah', judul: 'BAHASA INGGRIS', createdAt: { seconds: 50 } },
  ];
  const urut = urutkanFolderTerbaruDulu(daftar).map((f) => f.id);
  assert.deepEqual(urut, ['baru', 'tengah', 'lama']);
  // masukan tidak ikut termutasi
  assert.deepEqual(daftar.map((f) => f.id), ['lama', 'baru', 'tengah']);
});

test('folder tanpa createdAt jatuh ke bawah, diurutkan judul', () => {
  const daftar = [
    { id: 'x', judul: 'Zebra' },
    { id: 'y', judul: 'Apel' },
    { id: 'z', judul: 'Baru', createdAt: { seconds: 5 } },
  ];
  const urut = urutkanFolderTerbaruDulu(daftar).map((f) => f.id);
  assert.deepEqual(urut, ['z', 'y', 'x']);
});

test('masukan bukan array tidak meledak', () => {
  assert.deepEqual(urutkanFolderTerbaruDulu(undefined), []);
  assert.deepEqual(urutkanFolderTerbaruDulu('bukan'), []);
});
