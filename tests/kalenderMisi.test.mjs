// tests/kalenderMisi.test.mjs — strip tanggal berhenti di hari ini
//     node tests/kalenderMisi.test.mjs
import assert from 'node:assert/strict';
import { jumlahTanggalTampil, bolehBulanBerikutnya } from '../src/utils/kalenderMisi.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('kalenderMisi — batas tampil strip tanggal');

const KINI = new Date(2026, 9, 25, 21, 0, 0); // 25 Oktober 2026

uji('bulan berjalan tampil s.d. hari ini saja', () => {
  assert.equal(jumlahTanggalTampil(2026, 9, KINI), 25);
});
uji('bulan sebelumnya tampil penuh (termasuk Februari kabisat)', () => {
  assert.equal(jumlahTanggalTampil(2026, 8, KINI), 30);
  assert.equal(jumlahTanggalTampil(2028, 1, new Date(2028, 5, 1)), 29);
});
uji('bulan sesudahnya kosong', () => {
  assert.equal(jumlahTanggalTampil(2026, 10, KINI), 0);
  assert.equal(jumlahTanggalTampil(2027, 0, KINI), 0);
});
uji('tombol bulan berikutnya hanya aktif untuk bulan sebelum berjalan', () => {
  assert.equal(bolehBulanBerikutnya(2026, 8, KINI), true);
  assert.equal(bolehBulanBerikutnya(2026, 9, KINI), false);
  assert.equal(bolehBulanBerikutnya(2026, 10, KINI), false);
  assert.equal(bolehBulanBerikutnya(2025, 11, KINI), true);
});
uji('tanggal 1 pada bulan berjalan tetap tampil satu hari', () => {
  assert.equal(jumlahTanggalTampil(2026, 9, new Date(2026, 9, 1, 0, 5, 0)), 1);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
