// regresi 20 Okt: harga kesepakatan owner harus menjaga cicilan & kwitansi tetap hidup.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hitungUlangCicilan, hitungSelisihPenawaran, bangunPenyesuaianTagihan,
} from '../src/utils/penyesuaianTagihan.js';

test('hitungUlangCicilan: sisa dibagi ke cicilan belum lunas, yang lunas sejarah', () => {
  const detail = [
    { bulanKe: 1, nominal: 500000, status: 'Lunas', jatuhTempo: '2026-08-01', tanggalBayar: '2026-08-03' },
    { bulanKe: 2, nominal: 500000, status: 'Belum Lunas', jatuhTempo: '2026-09-01', tanggalBayar: null },
    { bulanKe: 3, nominal: 500000, status: 'Belum Lunas', jatuhTempo: '2026-10-01', tanggalBayar: null },
  ];
  const out = hitungUlangCicilan(detail, 700000);
  assert.equal(out[0].nominal, 500000, 'cicilan lunas tidak diubah');
  assert.equal(out[0].status, 'Lunas');
  assert.equal(out[1].nominal, 350000);
  assert.equal(out[2].nominal, 350000);
  assert.equal(out[1].jatuhTempo, '2026-09-01', 'jatuh tempo tidak digeser');
  const ganjil = hitungUlangCicilan(detail, 700001);
  assert.equal(ganjil[1].nominal + ganjil[2].nominal, 700001, 'modulus jatuh ke cicilan terakhir');
});

test('hitungSelisihPenawaran: diskon positif, naik negatif', () => {
  assert.equal(hitungSelisihPenawaran(3000000, 2500000), 500000);
  assert.equal(hitungSelisihPenawaran(3000000, 3200000), -200000);
});

test('bangunPenyesuaianTagihan: siswa & tagihan sinkron, kwitansi aman', () => {
  const p = bangunPenyesuaianTagihan({
    student: { totalTagihan: 3000000, totalBayar: 1000000 },
    tagihan: { totalKatalog: 3000000, detailCicilan: [
      { bulanKe: 1, nominal: 1000000, status: 'Lunas' },
      { bulanKe: 2, nominal: 1000000, status: 'Belum Lunas' },
      { bulanKe: 3, nominal: 1000000, status: 'Belum Lunas' },
    ] },
    kesepakatan: 2400000,
    alasan: 'penawaran keluarga / paket pecah',
    rincian: 'modul A 1.200.000; modul B 1.200.000',
  });
  assert.equal(p.siswa.totalTagihan, 2400000);
  assert.equal(p.tagihan.sisaTagihan, 1400000);
  assert.equal(p.tagihan.selisihPenawaran, 600000);
  assert.equal(p.tagihan.detailCicilan[1].nominal, 700000);
  assert.equal(p.tagihan.rincianPenawaran, 'modul A 1.200.000; modul B 1.200.000');
  assert.equal(p.sisa, 1400000);
});

test('bangunPenyesuaianTagihan: tanpa dokumen tagihan tetap sah (siswa saja)', () => {
  const p = bangunPenyesuaianTagihan({ student: { totalTagihan: 900000, totalBayar: 0 }, tagihan: null, kesepakatan: 750000, alasan: 'diskon saudara' });
  assert.equal(p.tagihan, null);
  assert.equal(p.siswa.totalTagihan, 750000);
  assert.equal(p.selisih, 150000);
});
