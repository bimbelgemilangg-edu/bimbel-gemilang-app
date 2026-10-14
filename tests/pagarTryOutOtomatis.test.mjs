// tests/pagarTryOutOtomatis.test.mjs
// Menjaga dua pagar keselamatan mesin try out otomatis yang pernah hilang
// diam-diam saat merge (insiden 2026-10-13) + kisi-kisi per mapel untuk AI.
import assert from 'node:assert/strict';
import { pagarIdentitasTemplate, gerbangStokDraf, kisiKisiUntukBaris } from '../src/utils/pagarTryOutOtomatis.js';
let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('PAGAR IDENTITAS: jenjang sekolah + sasaran "Semua" DITOLAK', () => {
  const h = pagarIdentitasTemplate({ jenjang: 'SMP', targetKelas: 'Semua' });
  assert.equal(h.ok, false);
  assert.match(h.error, /PAGAR IDENTITAS/);
  // bentuk array (warisan bug lama) juga harus tertolak
  assert.equal(pagarIdentitasTemplate({ jenjang: 'SD', targetKelas: ['Semua'] }).ok, false);
  assert.equal(pagarIdentitasTemplate({ jenjang: 'SMA', targetKelas: undefined }).ok, false);
});
uji('PAGAR IDENTITAS: template nama-TKA warisan ber-"Semua" lolos VIA penurunan jenis ujian', () => {
  const h = pagarIdentitasTemplate({ jenjang: 'SMP', nama: 'TRY OUT PEMAHAMAN TKA SMP', targetKelas: 'Semua' });
  assert.equal(h.ok, true); // jenis ujian TKA menurunkan sasaran kelas 9 otomatis
  // template Reguler (nama tanpa TKA/UTBK) tetap ditolak walau bernama mirip
  assert.equal(pagarIdentitasTemplate({ jenjang: 'SMA', nama: 'Try Out Wajib', targetKelas: ['Semua'] }).ok, false);
});
uji('PAGAR IDENTITAS: pesan penolakan punya ringkasan & cara perbaikan', () => {
  const h = pagarIdentitasTemplate({ jenjang: 'SMP', targetKelas: 'Semua' });
  assert.match(h.singkat, /sasaran kelas masih/);
  assert.match(h.solusi, /Jenis ujian/);
  const g = gerbangStokDraf([{ mapel: 'Matematika', butuh: 20, dapat: 4 }]);
  assert.match(g.singkat, /stok soal kurang/);
  assert.match(g.solusi, /Kesiapan Stok/);
});
uji('PAGAR IDENTITAS: sasaran spesifik lolos; izinkanSemua sadar lolos', () => {
  assert.equal(pagarIdentitasTemplate({ jenjang: 'SMP', targetKelas: '9' }).ok, true);
  assert.equal(pagarIdentitasTemplate({ jenjang: 'SMP/MTs', targetKelas: 'Kelas 9' }).ok, true);
  assert.equal(pagarIdentitasTemplate({ jenjang: 'SMP', targetKelas: 'Semua' }, true).ok, true);
  // jenjang non-sekolah (mis. kategori campuran) tidak kena pagar
  assert.equal(pagarIdentitasTemplate({ jenjang: 'Umum', targetKelas: 'Semua' }).ok, true);
});
uji('GERBANG STOK: mapel kurang => draf diblokir dengan rincian', () => {
  const h = gerbangStokDraf([{ mapel: 'Bahasa Indonesia', butuh: 15, dapat: 0 }, { mapel: 'Matematika', butuh: 15, dapat: 15 }]);
  assert.equal(h.ok, false);
  assert.match(h.error, /GERBANG STOK/);
  assert.match(h.error, /Bahasa Indonesia \(0\/15\)/);
  assert.equal(h.error.includes('Matematika'), false); // yang cukup tidak dituduh
});
uji('GERBANG STOK: stok cukup lolos; izinkanKurang sadar lolos', () => {
  assert.equal(gerbangStokDraf([]).ok, true);
  assert.equal(gerbangStokDraf([{ mapel: 'IPA', butuh: 10, dapat: 10 }]).ok, true);
  assert.equal(gerbangStokDraf([{ mapel: 'IPA', butuh: 10, dapat: 2 }], true).ok, true);
});
uji('KISI-KISI PER MAPEL: tiap baris komposisi menyebut mapel & ranahnya', () => {
  const kMat = kisiKisiUntukBaris({ jenjang: 'SMP' }, '', { mapel: 'Matematika' });
  const kBind = kisiKisiUntukBaris({ jenjang: 'SMP' }, '', { mapel: 'Bahasa Indonesia' });
  assert.ok(kMat.includes('Matematika') && kMat.includes('bilangan & operasi'));
  assert.ok(kBind.includes('Bahasa Indonesia') && kBind.includes('ide pokok'));
  assert.notEqual(kMat, kBind); // inti bug S5: dulu keduanya identik "(umum)"
});
uji('KISI-KISI UTBK: kepala & ranah subtes resmi ikut jenisUjian template', () => {
  const k = kisiKisiUntukBaris({ jenjang: 'SMA', jenisUjian: 'SNBT/UTBK' }, '', { mapel: 'TPS/Penalaran Umum' });
  assert.ok(k.includes('UTBK/SNBT'));
  assert.ok(k.includes('silogisme'));
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
