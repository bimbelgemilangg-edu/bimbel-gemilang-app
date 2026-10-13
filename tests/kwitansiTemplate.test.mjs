// ============================================================
// tests/kwitansiTemplate.test.mjs
// Test bentuk DOKUMEN RESMI kwitansi: ukuran kertas & larangan garis hitam.
//   node tests/kwitansiTemplate.test.mjs
//
// KENAPA DIJAGA TEST: kwitansi dicetak di kertas SETENGAH A4 (A4 dipotong
// melintang) lalu ditandatangani & diarsipkan orang tua. Kalau template
// diam-diam kembali ke A4 atau memunculkan bingkai/garis hitam lagi, yang
// rusak bukan layar — yang rusak dokumen fisik, dan tidak ada error yang
// muncul. Keputusan owner 11 Okt 2026: setengah A4 + tanpa garis hitam.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KERTAS_A4, KERTAS_KWITANSI, cssAturanPage, htmlKwitansi,
} from '../src/utils/kwitansiTemplate.js';

const contoh = {
  nomor: 'KWT-202610-021',
  tanggal: '2026-10-06',
  diterimaDari: 'Naura Fitria Septiani',
  studentId: 'STD-0926070001',
  jumlah: 900000,
  keperluan: 'Perpanjangan Bimbingan — Paket Bimbel Regular',
  metode: 'Tunai',
  catatanTambahan: 'Nominal dikoreksi dari Rp 1.050.000 (kesalahan input)',
  penandaTangan: 'Admin Keuangan',
};

test('kertas kwitansi = setengah A4 (210mm x 148,5mm), dokumen lain tetap A4', () => {
  assert.equal(KERTAS_KWITANSI.size, '210mm 148.5mm');
  assert.equal(KERTAS_A4.size, 'A4');
  assert.match(cssAturanPage(KERTAS_KWITANSI), /@page \{ size: 210mm 148\.5mm; margin: 8mm; \}/);
  assert.match(cssAturanPage(), /@page \{ size: A4; margin: 14mm; \}/);
});

test('kwitansi TANPA garis hitam: tidak ada bingkai, <hr>, kotak bergaris, atau garis putus-putus', () => {
  const html = htmlKwitansi(contoh);
  assert.ok(!/3px double/i.test(html), 'bingkai double hitam masih ada');
  assert.ok(!/<hr/i.test(html), 'garis <hr> masih ada');
  assert.ok(!/border[^;"']*#0f172a/i.test(html), 'masih ada border warna hitam pekat');
  assert.ok(!/dashed/i.test(html), 'masih ada garis putus-putus');
  assert.ok(!/border:\s*[^;"']*(solid|double)/i.test(html), 'masih ada border garis');
});

test('isi kwitansi tetap lengkap & benar walau tanpa garis', () => {
  const html = htmlKwitansi(contoh);
  for (const wajib of [
    'KWT-202610-021', 'Naura Fitria Septiani', 'STD-0926070001',
    'Sembilan Ratus Ribu', 'Rp 900.000', 'Tunai',
    'Perpanjangan Bimbingan', 'dikoreksi dari Rp 1.050.000',
  ]) assert.ok(html.includes(wajib), `hilang dari kwitansi: ${wajib}`);
  assert.match(html, /KWITANSI/);
  assert.match(html, /Admin Keuangan/);
});

test('tipografi muat di setengah A4: tidak ada teks lebih dari 17px', () => {
  const html = htmlKwitansi(contoh);
  const ukuran = [...html.matchAll(/font-size:\s*([\d.]+)px/gi)].map((m) => parseFloat(m[1]));
  assert.ok(ukuran.length > 5, 'font-size tidak terbaca — template berubah?');
  assert.ok(Math.max(...ukuran) <= 17, `ada teks terlalu besar untuk setengah A4: ${Math.max(...ukuran)}px`);
});
