// tests/backupFirestoreRest.test.mjs
// ============================================================
// Test penerjemah proto-JSON Firestore REST dipakai backup mingguan
// (api/backupFirestore.js). Format hasil backup HARUS sama dengan
// ekspor manual: {__id, ...data polos} -- kalau dekode salah, backup
// ada tapi tidak bisa dipakai restore (sama saja bohong).
//
// Api/backupFirestore.js sengaja 100% REST (tanpa firebase-admin):
// build Vercel proyek ini hanya kuat satu function berbobot
// firebase-admin. Lihat catatan teknis di kepala file tsb.
// ============================================================

import assert from 'node:assert/strict';
import { decodeNilai, decodeFields } from '../api/backupFirestore.js';

let lulus = 0, gagal = 0;
const kegagalan = [];
function uji(nama, fn) {
  try { fn(); lulus++; }
  catch (e) { gagal++; kegagalan.push(`${nama}: ${e.message}`); }
}

uji('stringValue jadi string', () => {
  assert.equal(decodeNilai({ stringValue: 'Bimbel Gemilang' }), 'Bimbel Gemilang');
});
uji('integerValue jadi angka (proto mengirim string)', () => {
  assert.equal(decodeNilai({ integerValue: '75' }), 75);
});
uji('doubleValue tetap angka', () => {
  assert.equal(decodeNilai({ doubleValue: 8.5 }), 8.5);
});
uji('booleanValue tetap boolean', () => {
  assert.equal(decodeNilai({ booleanValue: true }), true);
});
uji('nullValue jadi null', () => {
  assert.equal(decodeNilai({ nullValue: null }), null);
});
uji('timestampValue disimpan apa adanya (string ISO)', () => {
  assert.equal(decodeNilai({ timestampValue: '2026-10-05T02:25:58Z' }), '2026-10-05T02:25:58Z');
});
uji('arrayValue diterjemahkan per unsur', () => {
  assert.deepEqual(decodeNilai({ arrayValue: { values: [{ integerValue: '1' }, { stringValue: 'dua' }] } }), [1, 'dua']);
});
uji('arrayValue kosong jadi []', () => {
  assert.deepEqual(decodeNilai({ arrayValue: {} }), []);
});
uji('mapValue jadi objek bersarang', () => {
  assert.deepEqual(
    decodeNilai({ mapValue: { fields: { kota: { stringValue: 'Bandung' }, skor: { integerValue: '90' } } } }),
    { kota: 'Bandung', skor: 90 },
  );
});
uji('geoPointValue disimpan apa adanya', () => {
  assert.deepEqual(decodeNilai({ geoPointValue: { latitude: -6.9, longitude: 107.6 } }), { latitude: -6.9, longitude: 107.6 });
});
uji('decodeFields merakit dokumen polos', () => {
  const docs = decodeFields({
    nama: { stringValue: 'Zalsabela' },
    peran: { stringValue: 'operasional' },
    gaji: { integerValue: '1500000' },
    aktif: { booleanValue: true },
    catatan: { nullValue: null },
    tag: { arrayValue: { values: [{ stringValue: 'matematika' }] } },
  });
  assert.deepEqual(docs, {
    nama: 'Zalsabela',
    peran: 'operasional',
    gaji: 1500000,
    aktif: true,
    catatan: null,
    tag: ['matematika'],
  });
});
uji('decodeFields dokumen kosong jadi {}', () => {
  assert.deepEqual(decodeFields({}), {});
});

console.log(`backupFirestoreRest: ${lulus} lulus, ${gagal} gagal`);
if (kegagalan.length) {
  console.log(kegagalan.join('\n'));
  process.exit(1);
}
