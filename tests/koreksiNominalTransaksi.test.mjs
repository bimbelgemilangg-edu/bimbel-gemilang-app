// tests/koreksiNominalTransaksi.test.mjs
// Pintu koreksi nominal/metode transaksi (diskon & salah input) -- hotfix
// kasus nyata 2026-10-13 (perpanjangan didiskon, koreksi lama gak mempan).
import assert from 'node:assert/strict';
import {
  hitungKaskadeKoreksiNominal, validasiAlasanKoreksi, selisihRingkasanVsLedger,
} from '../src/utils/koreksiNominalTransaksi.js';

let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

const logPerpanjangan = { id: 'L1', type: 'Pemasukan', category: 'Perpanjangan Paket', amount: 1050000, method: 'Tunai', noKwitansi: 'KWT-202610-021', durasiTambah: 3 };
const siswaNaura = { totalTagihan: 1950000, totalBayar: 1950000, durasiBulan: 6, tanggalSelesai: '2027-01-13' };

uji('diskon perpanjangan 1.050.000 -> 900.000: tagihan & dibayar ikut turun 150rb', () => {
  const h = hitungKaskadeKoreksiNominal({ log: logPerpanjangan, siswa: siswaNaura, nominalBaru: 900000, metodeBaru: 'Tunai' });
  assert.deepEqual(h.updateLog, { amount: 900000, method: 'Tunai' });
  assert.deepEqual(h.updateSiswa, { totalTagihan: 1800000, totalBayar: 1800000 });
  assert.equal(h.deltaTagihan, -150000);
  assert.equal(h.deltaUang, -150000);
});

uji('durasi & tanggal selesai TIDAK disentuh kaskade (discount hanya uang)', () => {
  const h = hitungKaskadeKoreksiNominal({ log: logPerpanjangan, siswa: siswaNaura, nominalBaru: 900000, metodeBaru: 'Tunai' });
  assert.equal('durasiBulan' in h.updateSiswa, false);
  assert.equal('tanggalSelesai' in h.updateSiswa, false);
  assert.ok(h.catatan.some((c) => c.includes('TIDAK diubah')));
});

uji('pendaftaran: nominal membentuk tagihan juga', () => {
  const log = { id: 'L2', type: 'Pemasukan', category: 'Pendaftaran', amount: 900000, method: 'Transfer' };
  const h = hitungKaskadeKoreksiNominal({ log, siswa: { totalTagihan: 900000, totalBayar: 900000 }, nominalBaru: 850000, metodeBaru: 'Transfer' });
  assert.deepEqual(h.updateSiswa, { totalTagihan: 850000, totalBayar: 850000 });
});

uji('pembayaran SPP: nominal TIDAK mengubah tagihan, hanya dibayar', () => {
  const log = { id: 'L3', type: 'Pemasukan', category: 'SPP / Cicilan', amount: 300000, method: 'Tunai' };
  const h = hitungKaskadeKoreksiNominal({ log, siswa: { totalTagihan: 900000, totalBayar: 600000 }, nominalBaru: 350000, metodeBaru: 'Tunai' });
  assert.deepEqual(h.updateSiswa, { totalTagihan: 900000, totalBayar: 650000 });
});

uji('metode Tunai -> Cicilan: uang dianggap belum diterima (dibayar turun nominal lama)', () => {
  const h = hitungKaskadeKoreksiNominal({ log: logPerpanjangan, siswa: siswaNaura, nominalBaru: 1050000, metodeBaru: 'Cicilan' });
  assert.deepEqual(h.updateSiswa, { totalTagihan: 1950000, totalBayar: 900000 });
});

uji('metode Cicilan -> Transfer: uang dianggap diterima (dibayar naik nominal baru)', () => {
  const log = { id: 'L4', type: 'Pemasukan', category: 'Perpanjangan Paket', amount: 1050000, method: 'Cicilan', durasiTambah: 3 };
  const h = hitungKaskadeKoreksiNominal({ log, siswa: { totalTagihan: 1950000, totalBayar: 900000 }, nominalBaru: 1050000, metodeBaru: 'Transfer' });
  assert.deepEqual(h.updateSiswa, { totalTagihan: 1950000, totalBayar: 1950000 });
});

uji('DITOLAK: hasil minus', () => {
  assert.throws(() => hitungKaskadeKoreksiNominal({
    log: { id: 'L5', type: 'Pemasukan', category: 'SPP / Cicilan', amount: 1000000, method: 'Tunai' },
    siswa: { totalTagihan: 900000, totalBayar: 900000 }, nominalBaru: 1000000, metodeBaru: 'Cicilan',
  }), /minus/);
});

uji('DITOLAK: tagihan jadi lebih kecil dari dibayar', () => {
  assert.throws(() => hitungKaskadeKoreksiNominal({
    log: { id: 'L6', type: 'Pemasukan', category: 'SPP / Cicilan', amount: 400000, method: 'Tunai' },
    siswa: { totalTagihan: 900000, totalBayar: 600000 }, nominalBaru: 900000, metodeBaru: 'Tunai',
  }), /lebih kecil dari Dibayar/);
});

uji('DITOLAK: bukan Pemasukan / nominal negatif / metode aneh', () => {
  const base = { siswa: siswaNaura, nominalBaru: 100, metodeBaru: 'Tunai' };
  assert.throws(() => hitungKaskadeKoreksiNominal({ ...base, log: { id: 'X', type: 'Transfer', category: 'Setor Kas', amount: 5 } }), /Pemasukan/);
  assert.throws(() => hitungKaskadeKoreksiNominal({ ...base, log: logPerpanjangan, nominalBaru: -1 }), /tidak sah/);
  assert.throws(() => hitungKaskadeKoreksiNominal({ ...base, log: logPerpanjangan, metodeBaru: 'QRIS' }), /Metode baru tidak sah/);
});

uji('alasan koreksi wajib & tidak boleh terlalu pendek', () => {
  assert.ok(validasiAlasanKoreksi(''));
  assert.ok(validasiAlasanKoreksi('   '));
  assert.ok(validasiAlasanKoreksi('abc'));
  assert.equal(validasiAlasanKoreksi('diskon saudara sesuai persetujuan owner'), null);
});

uji('deteksi dua buku tidak cocok (banner sinkronisasi)', () => {
  const logs = [
    { type: 'Pemasukan', method: 'Transfer', amount: 900000 },
    { type: 'Pemasukan', method: 'Tunai', amount: 1050000 },
    { type: 'Pemasukan', method: 'Cicilan', amount: 999999 }, // komitmen: tidak dihitung
  ];
  assert.equal(selisihRingkasanVsLedger({ logs, totalBayar: 900000 }), 1050000);
  assert.equal(selisihRingkasanVsLedger({ logs, totalBayar: 1950000 }), 0);
  assert.equal(selisihRingkasanVsLedger({ logs: [], totalBayar: 0 }), 0);
});

console.log(`\nkoreksiNominalTransaksi: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);

// Gerbang CI: harness wajib exit non-zero bila ada kegagalan (14 Okt 2026).
if (typeof gagal !== "undefined" && gagal > 0) process.exit(1);
