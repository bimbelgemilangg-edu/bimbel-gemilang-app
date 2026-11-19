// tests/tkaSmpModul.test.mjs
import assert from 'node:assert/strict';
import {
  DAFTAR_SUBTES_SMP,
  SEMUA_BAB_SMP,
  MTK_SMP_MODUL,
  BIN_SMP_MODUL,
  IPA_SMP_MODUL,
  BIG_SMP_MODUL,
  getSubtestSmpByKode,
  getBabSmpBySlug,
  getBabSmpTetangga,
} from '../src/data/tkaSmpModulData.js';

console.log('🧪 Memulai pengujian Modul Belajar TKA SMP...');

// 1. Verifikasi Subtes Utama & Tambahan
const subtesUtama = DAFTAR_SUBTES_SMP.filter((s) => s.isUtama);
const subtesTambahan = DAFTAR_SUBTES_SMP.filter((s) => !s.isUtama);

assert.equal(subtesUtama.length, 2, 'Subtes utama harus tepat 2 (MTK & BIN)');
assert.equal(subtesUtama[0].kode, 'MTK_SMP', 'Subtes utama pertama harus Matematika');
assert.equal(subtesUtama[1].kode, 'BIN_SMP', 'Subtes utama kedua harus Bahasa Indonesia');

assert.equal(subtesTambahan.length, 2, 'Subtes tambahan harus tepat 2 (IPA & BIG)');
assert.equal(subtesTambahan[0].kode, 'IPA_SMP', 'Subtes tambahan pertama harus IPA');
assert.equal(subtesTambahan[1].kode, 'BIG_SMP', 'Subtes tambahan kedua harus Bahasa Inggris');
console.log('✅ Uji 1 Berhasil: Pemetaan Subtes Utama (MTK & BIN) dan Tambahan (IPA & BIG) valid');

// 2. Verifikasi Bab & Atribut Visual
assert.equal(SEMUA_BAB_SMP.length, 12, 'Total bab SMP harus tepat 12');
const mtkBabCount = SEMUA_BAB_SMP.filter((b) => b.subtestKode === 'MTK_SMP').length;
const binBabCount = SEMUA_BAB_SMP.filter((b) => b.subtestKode === 'BIN_SMP').length;
const ipaBabCount = SEMUA_BAB_SMP.filter((b) => b.subtestKode === 'IPA_SMP').length;
const bigBabCount = SEMUA_BAB_SMP.filter((b) => b.subtestKode === 'BIG_SMP').length;

assert.equal(mtkBabCount, 5, 'Matematika harus memiliki 5 bab');
assert.equal(binBabCount, 3, 'Bahasa Indonesia harus memiliki 3 bab');
assert.equal(ipaBabCount, 2, 'IPA harus memiliki 2 bab');
assert.equal(bigBabCount, 2, 'Bahasa Inggris harus memiliki 2 bab');
console.log('✅ Uji 2 Berhasil: Komposisi Bab per subtes sesuai (MTK: 5, BIN: 3, IPA: 2, BIG: 2)');

// 3. Verifikasi Kelengkapan Konten setiap Bab
SEMUA_BAB_SMP.forEach((bab) => {
  assert.ok(bab.id, `Bab ${bab.judul} harus memiliki ID`);
  assert.ok(bab.slug, `Bab ${bab.judul} harus memiliki slug`);
  assert.ok(bab.judul, `Bab harus memiliki judul`);
  assert.ok(bab.subtestWarna, `Bab ${bab.judul} harus memiliki subtestWarna`);
  assert.ok(bab.subtestBgLight, `Bab ${bab.judul} harus memiliki subtestBgLight`);
  assert.ok(bab.subtestEmoji, `Bab ${bab.judul} harus memiliki subtestEmoji`);
  assert.ok(bab.ringkasanSingkat, `Bab ${bab.judul} harus memiliki ringkasanSingkat`);
  assert.ok(bab.learningObjectives && bab.learningObjectives.length > 0, `Bab ${bab.judul} harus memiliki learningObjectives`);
  assert.ok(bab.konsepTeori && bab.konsepTeori.length > 0, `Bab ${bab.judul} harus memiliki konsepTeori`);
  assert.ok(bab.trikCepat, `Bab ${bab.judul} harus memiliki trikCepat`);
  assert.ok(bab.jebakanUmum, `Bab ${bab.judul} harus memiliki jebakanUmum`);
  assert.ok(bab.contohSoal && bab.contohSoal.length > 0, `Bab ${bab.judul} harus memiliki contohSoal`);
  assert.ok(bab.kuisPemahaman && bab.kuisPemahaman.length > 0, `Bab ${bab.judul} harus memiliki kuisPemahaman`);
});
console.log('✅ Uji 3 Berhasil: Seluruh 12 Bab memiliki konten lengkap (Trik Cepat, Jebakan, Contoh Soal & Kuis)');

// 4. Verifikasi Helper getBabSmpBySlug & getBabSmpTetangga
const bab1 = getBabSmpBySlug('MTK_SMP', 'perpangkatan-dan-bentuk-akar');
assert.ok(bab1, 'Bab 1 MTK harus dapat ditemukan');
assert.equal(bab1.babNumber, 1);

const tetangga1 = getBabSmpTetangga('MTK_SMP', 'perpangkatan-dan-bentuk-akar');
assert.equal(tetangga1.prevBab, null, 'Bab 1 tidak memiliki bab sebelumnya');
assert.ok(tetangga1.nextBab, 'Bab 1 harus memiliki bab berikutnya');
assert.equal(tetangga1.nextBab.babNumber, 2, 'Bab berikutnya harus Bab 2');

const tetanggaAkhir = getBabSmpTetangga('MTK_SMP', 'bangun-ruang-sisi-lengkung');
assert.ok(tetanggaAkhir.prevBab, 'Bab 5 harus memiliki bab sebelumnya');
assert.equal(tetanggaAkhir.nextBab, null, 'Bab 5 tidak memiliki bab berikutnya');
console.log('✅ Uji 4 Berhasil: Helper pencarian bab dan navigasi bab tetangga berjalan akurat');

console.log('🎉 SEMUA TEST MODUL BELAJAR TKA SMP LULUS 100%!');
