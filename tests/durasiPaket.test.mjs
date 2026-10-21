// regresi 21 Okt 2026: durasi paket bebas (2, 4, … custom) + promo bonus
// bulan ("bayar 2 dapat 3") + clamp akhir bulan. Keluhan owner: "untuk
// paket itu ada paket lebih bisa 2 bulan 4 dll sesuai kadang promonya".
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESET_DURASI,
  normalisasiDurasi,
  normalisasiBonus,
  tambahBulanKeTanggal,
  rencanaPaketPromo,
  rencanaDurasiKesepakatan,
} from '../src/utils/durasiPaket.js';

test('normalisasiDurasi: preset 2 & 4 sah, nilai rusak ditolak jadi 0', () => {
  assert.ok(PRESET_DURASI.includes(2), 'paket 2 bulan tersedia');
  assert.ok(PRESET_DURASI.includes(4), 'paket 4 bulan tersedia');
  assert.equal(normalisasiDurasi('2'), 2);
  assert.equal(normalisasiDurasi(4.9), 4, 'dibulatkan ke bawah');
  assert.equal(normalisasiDurasi(60), 60);
  assert.equal(normalisasiDurasi(61), 0, 'di atas maks = tidak valid');
  assert.equal(normalisasiDurasi(0), 0);
  assert.equal(normalisasiDurasi(-3), 0);
  assert.equal(normalisasiDurasi('abc'), 0);
  assert.equal(normalisasiDurasi(null), 0);
  assert.equal(normalisasiDurasi(undefined), 0);
});

test('normalisasiBonus: 0 = tanpa bonus; negatif/NaN/kebesaran ditolak', () => {
  assert.equal(normalisasiBonus(1), 1);
  assert.equal(normalisasiBonus('3'), 3);
  assert.equal(normalisasiBonus(0), 0);
  assert.equal(normalisasiBonus(-1), 0);
  assert.equal(normalisasiBonus(25), 0, 'di atas BONUS_MAX(24)');
  assert.equal(normalisasiBonus(''), 0);
  assert.equal(normalisasiBonus(undefined), 0);
});

test('tambahBulanKeTanggal: kasus normal, lintas tahun, mundur', () => {
  assert.equal(tambahBulanKeTanggal('2026-10-21', 2), '2026-12-21');
  assert.equal(tambahBulanKeTanggal('2026-10-21', 4), '2027-02-21', 'lintas tahun');
  assert.equal(tambahBulanKeTanggal('2026-11-15', 3), '2027-02-15');
  assert.equal(tambahBulanKeTanggal('2026-03-15', -2), '2026-01-15', 'mundur (dipakai reversal)');
});

test('tambahBulanKeTanggal: clamp akhir bulan — 31 Jan + 1 bln = 28 Feb, BUKAN 3 Mar', () => {
  assert.equal(tambahBulanKeTanggal('2026-01-31', 1), '2026-02-28');
  assert.equal(tambahBulanKeTanggal('2028-01-31', 1), '2028-02-29', 'tahun kabisat');
  assert.equal(tambahBulanKeTanggal('2026-01-30', 1), '2026-02-28');
  assert.equal(tambahBulanKeTanggal('2026-08-31', 6), '2027-02-28');
});

test('tambahBulanKeTanggal: input rusak → string kosong (jujur, bukan tanggal karangan)', () => {
  assert.equal(tambahBulanKeTanggal('', 1), '');
  assert.equal(tambahBulanKeTanggal('bukan-tanggal', 1), '');
  assert.equal(tambahBulanKeTanggal(null, 1), '');
  assert.equal(tambahBulanKeTanggal('2026-13-01', 1), '', 'bulan 13 tidak ada');
  assert.equal(tambahBulanKeTanggal('2026-10-21', 'x'), '');
});

test('rencanaPaketPromo: bayar 2 dapat 3 — uang hanya 2 bulan, masa aktif 3', () => {
  const r = rencanaPaketPromo({
    hargaPerBulan: 500000,
    bulanBayar: 2,
    bulanBonus: 1,
    tanggalSelesaiLama: '2026-10-31',
  });
  assert.equal(r.bulanBayar, 2);
  assert.equal(r.bulanBonus, 1);
  assert.equal(r.bulanTotal, 3);
  assert.equal(r.totalTagihan, 1000000, 'bonus tidak ditagih');
  assert.equal(r.omzetPerBulan, 333333, 'amortisasi dibagi bulan TOTAL');
  assert.equal(r.tanggalSelesaiBaru, '2027-01-31', 'clamp akhir bulan');
});

test('rencanaPaketPromo: tanpa bonus = perilaku lama (harga × bulan)', () => {
  const r = rencanaPaketPromo({ hargaPerBulan: 300000, bulanBayar: 4, tanggalSelesaiLama: '2026-05-10' });
  assert.equal(r.bulanBonus, 0);
  assert.equal(r.bulanTotal, 4);
  assert.equal(r.totalTagihan, 1200000);
  assert.equal(r.tanggalSelesaiBaru, '2026-09-10');
});

test('rencanaPaketPromo: bulanBayar tak valid → null (pemanggil wajib menolak)', () => {
  assert.equal(rencanaPaketPromo({ hargaPerBulan: 500000, bulanBayar: 0 }), null);
  assert.equal(rencanaPaketPromo({ hargaPerBulan: 500000, bulanBayar: 'x' }), null);
  assert.equal(rencanaPaketPromo({}), null);
});

test('rencanaPaketPromo: tanpa tanggal selesai lama → pakai tanggal acuan', () => {
  const r = rencanaPaketPromo({ hargaPerBulan: 100000, bulanBayar: 2, tanggalAcuan: '2026-10-21' });
  assert.equal(r.tanggalSelesaiBaru, '2026-12-21');
});

test('rencanaDurasiKesepakatan: paket promo 4 bulan dihitung dari tanggal mulai', () => {
  const r = rencanaDurasiKesepakatan({ tanggalMulai: '2026-10-01', durasiKesepakatan: 4 });
  assert.equal(r.durasiBulan, 4);
  assert.equal(r.tanggalSelesai, '2027-02-01');
  assert.equal(r.peringatan, '');
});

test('rencanaDurasiKesepakatan: 0/tak valid → null (durasi tidak diubah; perilaku #263 utuh)', () => {
  assert.equal(rencanaDurasiKesepakatan({ tanggalMulai: '2026-10-01', durasiKesepakatan: 0 }), null);
  assert.equal(rencanaDurasiKesepakatan({ tanggalMulai: '2026-10-01', durasiKesepakatan: '' }), null);
  assert.equal(rencanaDurasiKesepakatan({ tanggalMulai: '2026-10-01', durasiKesepakatan: 61 }), null);
  assert.equal(rencanaDurasiKesepakatan({}), null);
});

test('rencanaDurasiKesepakatan: tanpa tanggal mulai → durasi disimpan + peringatan jujur, tanggal TIDAK dikarang', () => {
  const r = rencanaDurasiKesepakatan({ tanggalMulai: '', durasiKesepakatan: 2 });
  assert.equal(r.durasiBulan, 2);
  assert.equal(r.tanggalSelesai, '');
  assert.ok(/Koreksi Data Paket/.test(r.peringatan), 'peringatan menunjuk pintu koreksi');
});
