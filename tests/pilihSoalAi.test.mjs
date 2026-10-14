// tests/pilihSoalAi.test.mjs
import assert from 'node:assert/strict';
import { ringkasButirUntukAi, validasiPilihanAi } from '../src/utils/pilihSoalAi.js';
import { kisiKisiUntuk, MAPEL_TKA_RESMI, VERSI_KISI } from '../src/utils/kisiKisiTkaUtbk.js';
let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }
const KOLAM = new Set(['a', 'b', 'c']);
uji('pilihan sah diterima utuh dengan alasan', () => {
  const v = validasiPilihanAi({ pilihan: [{ id: 'b', alasan: 'silogisme' }, { id: 'a', alasan: 'tabel' }] }, KOLAM, 2);
  assert.equal(v.ok, true); assert.equal(v.urutan[0].id, 'b');
});
uji('id di luar kolam / duplikat / jumlah salah => ditolak', () => {
  assert.equal(validasiPilihanAi({ pilihan: [{ id: 'z' }] }, KOLAM, 1).ok, false);
  assert.equal(validasiPilihanAi({ pilihan: [{ id: 'a' }, { id: 'a' }] }, KOLAM, 2).ok, false);
  assert.equal(validasiPilihanAi({ pilihan: [{ id: 'a' }] }, KOLAM, 2).ok, false);
  assert.ok(validasiPilihanAi({ pilihan: [] }, KOLAM, 1).alasanGagal);
});
uji('ringkasan tidak membocorkan kunci/pembahasan', () => {
  const r = ringkasButirUntukAi({ id: 'x', kunciJawaban: 'B', pembahasan: 'rahasia', teksSoal: 'Soal panjang '.repeat(30) });
  assert.equal('kunciJawaban' in r, false); assert.equal('pembahasan' in r, false);
  assert.ok(r.teks.length <= 140);
});
uji('kisi-kisi resmi: SD/SMP dua mapel, SMA 3+7, UTBK 7 subtes', () => {
  assert.deepEqual(MAPEL_TKA_RESMI.SMP, ['Matematika', 'Bahasa Indonesia']);
  assert.equal(MAPEL_TKA_RESMI.SMA.pilihan.length, 7);
  assert.ok(VERSI_KISI.startsWith('2026'));
  // 🔥 ROMBAK 2026-10-13 (keputusan owner): prompt AI TKA TIDAK menyebut
  // rentang kelas; AI diberitahu kolamnya bank soal jenjang seluruhnya.
  const kisiTka = kisiKisiUntuk('SMP/MTs', 'TKA', 'Matematika');
  assert.ok(kisiTka.includes('BANK SOAL'));
  assert.equal(kisiTka.includes('7-9'), false);
});
console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
