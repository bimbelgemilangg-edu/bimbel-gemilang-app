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

// ============================================================
// 21 Okt 2026 — PERLUASAN DURASI KESEPAKATAN (paket promo 2/4/x bulan):
// nominal dan LAMA paket disesuaikan bareng; tanpa durasiKesepakatan
// perilaku lama harus 100% utuh (backward-compatible).
// ============================================================

test('bangunPenyesuaianTagihan + durasiKesepakatan: promo bayar 3 dapat 4 bulan', () => {
  const p = bangunPenyesuaianTagihan({
    student: { totalTagihan: 2000000, totalBayar: 500000, tanggalMulai: '2026-10-01', durasiBulan: 4, tanggalSelesai: '2027-02-01' },
    tagihan: { totalKatalog: 2000000, detailCicilan: [
      { bulanKe: 1, nominal: 500000, status: 'Lunas' },
      { bulanKe: 2, nominal: 500000, status: 'Belum Lunas' },
      { bulanKe: 3, nominal: 500000, status: 'Belum Lunas' },
      { bulanKe: 4, nominal: 500000, status: 'Belum Lunas' },
    ] },
    kesepakatan: 1500000, // harga 3 bulan
    durasiKesepakatan: 4, // tapi paket hidup 4 bulan (bulan ke-4 gratis)
    alasan: 'promo bayar 3 dapat 4',
  });
  assert.equal(p.siswa.durasiBulan, 4);
  assert.equal(p.siswa.tanggalSelesai, '2027-02-01', 'tanggal selesai = mulai + 4 bulan');
  assert.equal(p.durasi.durasiBulan, 4);
  assert.equal(p.durasi.tanggalSelesai, '2027-02-01');
  assert.equal(p.durasi.peringatan, '');
  assert.equal(p.sisa, 1000000);
  assert.equal(p.tagihan.detailCicilan[1].nominal + p.tagihan.detailCicilan[2].nominal + p.tagihan.detailCicilan[3].nominal, 1000000, 'sisa tetap terdistribusi ke cicilan belum lunas');
});

test('bangunPenyesuaianTagihan + durasiKesepakatan: tanpa tanggal mulai → durasi disimpan, tanggal tidak dikarang, ada peringatan', () => {
  const p = bangunPenyesuaianTagihan({
    student: { totalTagihan: 1000000, totalBayar: 0 },
    tagihan: null,
    kesepakatan: 800000,
    durasiKesepakatan: 2,
    alasan: 'paket promo 2 bulan',
  });
  assert.equal(p.siswa.durasiBulan, 2);
  assert.equal('tanggalSelesai' in p.siswa, false, 'tanggal selesai TIDAK dikarang');
  assert.ok(p.durasi.peringatan.length > 0);
});

test('bangunPenyesuaianTagihan TANPA durasiKesepakatan: payload siswa identik dengan versi #263 (regresi)', () => {
  const p = bangunPenyesuaianTagihan({
    student: { totalTagihan: 3000000, totalBayar: 1000000, tanggalMulai: '2026-10-01', durasiBulan: 3 },
    tagihan: { totalKatalog: 3000000, detailCicilan: [
      { bulanKe: 1, nominal: 1000000, status: 'Lunas' },
      { bulanKe: 2, nominal: 1000000, status: 'Belum Lunas' },
      { bulanKe: 3, nominal: 1000000, status: 'Belum Lunas' },
    ] },
    kesepakatan: 2400000,
    alasan: 'penawaran keluarga',
  });
  assert.equal(p.durasi, null);
  assert.deepEqual(Object.keys(p.siswa).sort(), ['catatanPenawaran', 'totalKatalog', 'totalTagihan'], 'tidak ada field durasi/tanggal baru');
  assert.equal('durasiBulan' in p.siswa, false);
  assert.equal('tanggalSelesai' in p.siswa, false);
  assert.equal(p.tagihan.detailCicilan[1].nominal, 700000);
});

test('bangunPenyesuaianTagihan: durasiKesepakatan tidak valid (0/61/teks) diperlakukan sebagai "tidak diubah"', () => {
  const dasar = { student: { totalTagihan: 1000000, totalBayar: 0, tanggalMulai: '2026-10-01' }, tagihan: null, kesepakatan: 900000, alasan: 'x' };
  for (const d of [0, 61, 'abc', -2, null, undefined]) {
    const p = bangunPenyesuaianTagihan({ ...dasar, durasiKesepakatan: d });
    assert.equal(p.durasi, null, `durasiKesepakatan=${d} → null`);
    assert.equal('durasiBulan' in p.siswa, false);
  }
});
