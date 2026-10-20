// regresi 20 Okt: kode soal pendek siswa harus stabil & mudah dicari.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenMapel, tanggalKeyPaket, kodeSoalSiswa, cocokCariKode,
} from '../src/utils/kodeSoalSiswa.js';

test('tokenMapel: pemetaan & fallback', () => {
  assert.equal(tokenMapel('Matematika'), 'MTK');
  assert.equal(tokenMapel('Bahasa Indonesia'), 'BIND');
  assert.equal(tokenMapel('TPS/Penalaran Umum'), 'TPU');
  assert.equal(tokenMapel(''), 'UMUM');
});

test('tanggalKeyPaket: dari kodePaket dulu, lalu createdAt', () => {
  assert.equal(tanggalKeyPaket({ kodePaket: 'GM-SMP-TKA-20261017-0800' }), '20261017');
  assert.equal(tanggalKeyPaket({ createdAt: new Date('2026-10-05T08:00:00') }), '20261005');
  assert.equal(tanggalKeyPaket({}), '00000000');
});

test('kodeSoalSiswa v2: turunan kode paket, stabil per nomor paket', () => {
  const paket = { kodePaket: 'GM-SMP-TKA-20261017-0800' };
  assert.equal(kodeSoalSiswa({ paket, nomor: 7 }), 'SMP-0800-07');
  assert.equal(kodeSoalSiswa({ paket, nomor: 7 }), 'SMP-0800-07', 'tak bergantung urutan acak');
  assert.equal(kodeSoalSiswa({ paket, nomor: 12 }), 'SMP-0800-12');
});

test('cocokCariKode: toleran spasi, strip, huruf kecil', () => {
  assert.equal(cocokCariKode('SMP-0800-07', 'smp080007'), true);
  assert.equal(cocokCariKode('SMP-0800-07', '0800-07'), true);
  assert.equal(cocokCariKode('SMP-0800-07', '07'), true);
  assert.equal(cocokCariKode('SMP-0800-07', 'sma'), false);
  assert.equal(cocokCariKode('SMP-0800-07', ''), true);
});
