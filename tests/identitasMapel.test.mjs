// tests/identitasMapel.test.mjs — penjaga identitas mapel (anti anak-pinak)
// Keluhan owner 31 Okt 2026: registry mapel beranak jadi varian per jenjang
// ("GEOGRAFI SMA", "IPA SMP", "BAHASA INGGRIS SD") + program ("TKA …"),
// membuat rekap tentor berisik dan kode varian gagal menempel di PDF.
//   node tests/identitasMapel.test.mjs
import assert from 'node:assert/strict';
import {
  kodeKurikulumDariNama, kategoriMapelRegistry, grupVarian, namaKurikulum,
} from '../src/utils/identitasMapel.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('identitasMapel — resolver nama registry → kode Kurikulum Merdeka');

uji('varian ber-sufiks jenjang resolve ke kode kurikulum yang sama', () => {
  assert.equal(kodeKurikulumDariNama('GEOGRAFI SMA'), 'geo');
  assert.equal(kodeKurikulumDariNama('Geografi'), 'geo');
  assert.equal(kodeKurikulumDariNama('Bahasa Indonesia SMP'), 'bind');
  assert.equal(kodeKurikulumDariNama('BAHASA INDONESIA SD'), 'bind');
  assert.equal(kodeKurikulumDariNama('Matematika'), 'mtk');
  assert.equal(kodeKurikulumDariNama('BAHASA INGGRIS SD'), 'bing');
});

uji('jebakan IPA vs IPAS tidak boleh tertukar', () => {
  assert.equal(kodeKurikulumDariNama('IPA SMP'), 'ipa');
  assert.equal(kodeKurikulumDariNama('IPAS SD'), 'ipas');
  assert.notEqual(kodeKurikulumDariNama('IPA SMP'), kodeKurikulumDariNama('IPAS SD'));
});

uji('program bimbel = lokal, bukan mapel kurikulum', () => {
  assert.equal(kodeKurikulumDariNama('TES KOMPETENSI AKADEMIK'), '');
  assert.equal(kodeKurikulumDariNama('TKA BAHASA INGGRIS SMA'), '');
  assert.equal(kodeKurikulumDariNama('ENGLISH COURSE'), '');
  assert.equal(kategoriMapelRegistry('ENGLISH COURSE'), 'lokal');
  assert.equal(kategoriMapelRegistry('IPA SMP'), 'kurikulum');
});

uji('grupVarian mendeteksi duplikasi registry per kode kurikulum', () => {
  const g = grupVarian(['GEOGRAFI SMA', 'Geografi', 'IPA SMP', 'ENGLISH COURSE']);
  assert.deepEqual(g.geo, ['GEOGRAFI SMA', 'Geografi']);
  assert.equal(g.ipa, undefined); // satu entri = bukan varian
  assert.equal(g.lokal, undefined); // nama lokal tidak ikut grup varian
});

uji('namaKurikulum mengembalikan nama kanonik untuk picker', () => {
  assert.equal(namaKurikulum('geo'), 'Geografi');
  assert.equal(namaKurikulum('ipas'), 'IPAS');
  assert.equal(namaKurikulum('tidak-ada'), '');
});

console.log(`\n${gagal === 0 ? '✅' : '❌'} identitasMapel: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
