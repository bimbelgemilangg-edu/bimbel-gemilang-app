// tests/acakSoalTryOut.test.mjs
// ============================================================
// Uji pengacak urutan soal SADAR GRUP (2026-10-29, kegelisahan owner:
// "takutnya ada pertanyaan yang bacaan atau bagian objek soal itu hilang
// ... apalagi waktu soal di acak di ujian atau tryout").
//
//     node tests/acakSoalTryOut.test.mjs
//
// Janji yang dipaku:
//   1. soal segolongan (kunci stimulus sama & bersebelahan) TIDAK PERNAH
//      dipisahkan pengacakan — persis aplikasi ujian besar: yang diundi
//      letak BLOK wacana, bukan memecah wacana dari soalnya;
//   2. deterministik: seed sama → urutan sama (tidak loncat-loncat tiap reload);
//   3. daftar TANPA grup menghasilkan permutasi yang SAMA PERSIS dengan
//     versi lama (seed & algoritma tidak berubah) — paket lama tak terkejut;
//   4. keluaran selalu permutasi (tidak ada soal hilang/duplikat).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { acakSoalPerSiswa, unitSoalBerurutan } from '../src/utils/acakSoalTryOut.js';

const W = 'Wacana panjang yang sama persis untuk sekelompok soal literasi Bahasa Inggris.';
const soal = (id, bacaanTeks = '') => (bacaanTeks
  ? { id, soal: `Pertanyaan ${id}`, bacaan: { teks: bacaanTeks, gambar: [], grup: '' } }
  : { id, soal: `Pertanyaan ${id}` });

test('unitSoalBerurutan: run segolongan jadi satu unit, yang tidak bersebelahan tidak dipaksa gabung', () => {
  const units = unitSoalBerurutan([soal('a', W), soal('b', W), soal('c'), soal('d', W)]);
  assert.deepEqual(units.map((u) => u.map((s) => s.id)), [['a', 'b'], ['c'], ['d']],
    '"d" berbagi teks dengan a-b tapi tidak bersebelahan → unit sendiri (dicetak ulang memang layak)');
});

test('bacaan kosong (baru punya grup, menunggu backfill impor) tidak ditebak-nebak pengacakan', () => {
  const s1 = { id: 'x', soal: 'q1', bacaan: { teks: 'versi lengkap '.repeat(30), gambar: [], grup: 'bacaan_7' } };
  const s2 = { id: 'y', soal: 'q2', bacaan: { teks: '', gambar: [], grup: 'bacaan_7' } };
  // bacaan kosong → bacaanDari null → kunci '' → unit tunggal (backfill impor
  // yang mengisi teksnya; pengacakan tidak boleh menebak-nebak).
  const units = unitSoalBerurutan([s1, s2]);
  assert.deepEqual(units.map((u) => u.map((s) => s.id)), [['x'], ['y']]);
});

test('pengacakan TIDAK memecah grup: anggota tetap bersebelahan dan urut', () => {
  const daftar = [soal('a', W), soal('b', W), soal('c', W), soal('d'), soal('e'), soal('f', 'Wacana lain yang benar-benar berbeda isinya.')];
  for (const sid of ['s1', 's2', 's3', 'siswa-xyz-123']) {
    const out = acakSoalPerSiswa(daftar, sid, 'paket-1', '0');
    assert.deepEqual(out.map((s) => s.id).sort(), ['a', 'b', 'c', 'd', 'e', 'f'], 'permutasi utuh');
    const ia = out.findIndex((s) => s.id === 'a');
    assert.deepEqual(out.slice(ia, ia + 3).map((s) => s.id), ['a', 'b', 'c'],
      `grup a-b-c tetap bersebelahan & urut untuk siswa ${sid}`);
  }
});

test('deterministik: seed sama → hasil sama persis', () => {
  const daftar = [soal('a'), soal('b'), soal('c'), soal('d'), soal('e')];
  const x = acakSoalPerSiswa(daftar, 's1', 'p1', '0').map((s) => s.id).join(',');
  const y = acakSoalPerSiswa(daftar, 's1', 'p1', '0').map((s) => s.id).join(',');
  assert.equal(x, y);
});

test('daftar tanpa grup: permutasi IDENTIK dengan perilaku lama (opt-out pisahGrup)', () => {
  const daftar = [soal('a'), soal('b'), soal('c'), soal('d')];
  const baru = acakSoalPerSiswa(daftar, 's1', 'p1', 'g').map((s) => s.id);
  const lama = acakSoalPerSiswa(daftar, 's1', 'p1', 'g', { pisahGrup: true }).map((s) => s.id);
  assert.deepEqual(baru, lama);
});

test('input tidak sah aman (null / bukan array)', () => {
  assert.deepEqual(acakSoalPerSiswa(null, 'a', 'b'), []);
  assert.deepEqual(unitSoalBerurutan(undefined), []);
});
