// tests/sesiNganggur.test.mjs — v1.6.0: sesi admin kedaluwarsa 30 menit nganggur
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MENIT_NGANGGUR_MAKS, KUNCI_STEMPEL,
  umurNganggurMs, sesiLewatBatas, stempelAktivitas, bacaStempel, keluarkanSesiAdmin,
} from '../src/utils/sesiNganggur.js';

const storagePalsu = () => {
  const peta = new Map();
  return {
    getItem: (k) => (peta.has(k) ? peta.get(k) : null),
    setItem: (k, v) => peta.set(k, String(v)),
    removeItem: (k) => peta.delete(k),
  };
};

test('batas nganggur = 30 menit (keputusan owner dipaku)', () => {
  assert.equal(MENIT_NGANGGUR_MAKS, 30);
});

test('umurNganggurMs: tanpa stempel = 0 (sesi lama pra-fitur tidak dihukum)', () => {
  assert.equal(umurNganggurMs(1_000_000, null), 0);
  assert.equal(umurNganggurMs(1_000_000, 0), 0);
});

test('umurNganggurMs: selisih wajar & tidak pernah negatif', () => {
  assert.equal(umurNganggurMs(10_000, 4_000), 6_000);
  assert.equal(umurNganggurMs(1_000, 9_000), 0, 'jam perangkat mundur tidak menghasilkan negatif');
});

test('sesiLewatBatas: tepat 30 menit = keluar; 29:59 = tetap masuk', () => {
  const stempel = 1_000_000;
  const batas = 30 * 60 * 1000;
  assert.equal(sesiLewatBatas(stempel + batas - 1, stempel), false);
  assert.equal(sesiLewatBatas(stempel + batas, stempel), true);
  assert.equal(sesiLewatBatas(stempel + batas + 5_000, stempel), true);
});

test('sesiLewatBatas: menit custom dihormati', () => {
  const stempel = 500_000;
  assert.equal(sesiLewatBatas(stempel + 5 * 60 * 1000, stempel, 5), true);
  assert.equal(sesiLewatBatas(stempel + 4 * 60 * 1000, stempel, 5), false);
});

test('stempel ↔ baca: round-trip lewat storage injeksi', () => {
  const s = storagePalsu();
  assert.equal(bacaStempel(s), null);
  stempelAktivitas(s);
  const st = bacaStempel(s);
  assert.ok(st > 0);
  assert.equal(typeof s.getItem(KUNCI_STEMPEL), 'string');
});

test('bacaStempel: nilai rusak tidak dipercaya', () => {
  const s = storagePalsu();
  s.setItem(KUNCI_STEMPEL, 'bukan-angka');
  assert.equal(bacaStempel(s), null);
  s.setItem(KUNCI_STEMPEL, '-5');
  assert.equal(bacaStempel(s), null);
});

test('keluarkanSesiAdmin: semua kunci sesi + stempel hilang', () => {
  const s = storagePalsu();
  s.setItem('isLoggedIn', 'true');
  s.setItem('role', 'admin');
  s.setItem('isOwnerLoggedIn', 'true');
  s.setItem(KUNCI_STEMPEL, '123');
  s.setItem('halamanLain', 'tetap'); // kunci tak berkaitan TIDAK boleh ikut hapus
  keluarkanSesiAdmin(s);
  assert.equal(s.getItem('isLoggedIn'), null);
  assert.equal(s.getItem('role'), null);
  assert.equal(s.getItem('isOwnerLoggedIn'), null);
  assert.equal(s.getItem(KUNCI_STEMPEL), null);
  assert.equal(s.getItem('halamanLain'), 'tetap');
});
