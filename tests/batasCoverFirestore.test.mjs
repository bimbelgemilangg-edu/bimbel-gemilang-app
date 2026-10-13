// tests/batasCoverFirestore.test.mjs
// ============================================================
// Test pagar ukuran cover folder (src/utils/batasCoverFirestore.js).
//
//     node tests/batasCoverFirestore.test.mjs
//
// KENAPA INI PENTING
// Bug nyata 2026-10-11: pembuatan folder sumber soal gagal dengan
// "The value of property \"coverUrl\" is longer than 1048487 bytes"
// setelah menunggu lama -- sebab cover OPSIONAL disimpan sebagai base64
// mentah ke Firestore. Dua invariant yang dikunci di sini:
//   1. ukuran byte data-URI dihitung benar (base64 = 4 karakter per 3 byte);
//   2. cover yang lewat ambang dinyatakan TIDAK aman, sehingga halaman
//      bisa membuang cover dan TETAP membuat folder -- field opsional
//      tidak boleh menyandera operasi utama.
// ============================================================

import assert from 'node:assert/strict';
import {
  BATAS_FIELD_FIRESTORE,
  AMBAN_AMAN_COVER,
  ukuranByteDataUrl,
  putuskanCover,
} from '../src/utils/batasCoverFirestore.js';

let lulus = 0;
let gagal = 0;
const kegagalan = [];
function uji(nama, fn) {
  try {
    fn();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal += 1;
    const pesan = String(e && e.message ? e.message : e);
    kegagalan.push({ nama, pesan });
    console.log(`  ✗ ${nama}`);
    console.log(`      ${pesan.split('\n').join('\n      ').slice(0, 400)}`);
  }
}

const dataUrlDari = (byte) => `data:image/jpeg;base64,${'A'.repeat(Math.ceil((byte * 4) / 3))}`;

uji('ambang aman berada di bawah batas keras Firestore', () => {
  assert.ok(AMBAN_AMAN_COVER < BATAS_FIELD_FIRESTORE);
});

uji('ukuran byte data-URI mengikuti rasio base64 (3 byte per 4 karakter)', () => {
  const byte = ukuranByteDataUrl(dataUrlDari(3000));
  assert.ok(Math.abs(byte - 3000) <= 3, `diharap ~3000, dapat ${byte}`);
});

uji('cover kecil dinyatakan aman', () => {
  const r = putuskanCover(dataUrlDari(50_000));
  assert.equal(r.aman, true);
  assert.ok(r.alasan.includes('batas aman'), r.alasan);
});

uji('cover 1,2 MB dinyatakan TIDAK aman dengan alasan berisi angka', () => {
  const r = putuskanCover(dataUrlDari(1_200_000));
  assert.equal(r.aman, false);
  assert.ok(r.byte > AMBAN_AMAN_COVER);
  assert.ok(r.alasan.includes('1.048.487'), `alasan harus menyebut batas Firestore: ${r.alasan}`);
});

uji('tanpa cover selalu aman (folder tetap bisa dibuat)', () => {
  const r = putuskanCover('');
  assert.equal(r.aman, true);
  assert.equal(r.byte, 0);
});

console.log(`\n${'='.repeat(60)}`);
console.log(`  LULUS : ${lulus}`);
console.log(`  GAGAL : ${gagal}`);
console.log('='.repeat(60));
if (gagal > 0) {
  console.log('\nRingkasan kegagalan:');
  kegagalan.forEach((k, i) => console.log(`  ${i + 1}. ${k.nama}\n     ${k.pesan.split('\n')[0]}`));
  console.error('\n❌ ADA TEST YANG GAGAL.');
  process.exit(1);
}
console.log('\n✅ Semua test lulus.');
