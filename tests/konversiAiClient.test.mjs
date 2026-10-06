// tests/konversiAiClient.test.mjs
// ============================================================
// Test bagian MURNI dari kabel konversi AI (src/utils/konversiAiClient.js):
// pemotongan rentang halaman & pembersihan placeholder gambar.
//
//     node tests/konversiAiClient.test.mjs
//
// KENAPA INI PENTING
// Berkas ini pernah berupa STUB yang melempar "Mesin AI sudah
// dipensiunkan", sehingga modul scan hanya bisa masuk sebagai PDF mentah
// (berat di HP, kelihatan tidak rapi). Saat kabelnya ditulis ulang, dua
// bagian ini yang paling gampang salah tanpa kelihatan:
//   - potongan rentang: salah hitung = halaman tercecer atau dobel, dan
//     server menolak (>14 halaman per panggilan);
//   - placeholder: lolos = siswa melihat token {{GAMBAR_3}} di reader,
//     penyakit yang sama dengan yang diperbaiki di penempatanGambar.js.
// ============================================================

import assert from 'node:assert/strict';
import { substitusiPlaceholder, potonganRentang } from '../src/utils/konversiAiClient.js';

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

function bagian(judul) {
  console.log(`\n${judul}`);
}

console.log('konversiAiClient — potongan rentang & pembersihan placeholder');

// ============================================================
bagian('1. POTONGAN RENTANG HALAMAN');
// ============================================================

uji('39 halaman -> 4 potongan (10,10,10,9), tidak ada yang tercecer', () => {
  const p = potonganRentang(1, 39);
  assert.deepEqual(p, [[1, 10], [11, 20], [21, 30], [31, 39]]);
});

uji('tidak pernah melebihi batas server (14)', () => {
  for (const [a, b] of [[1, 14], [1, 15], [3, 60], [1, 140]]) {
    for (const [x, y] of potonganRentang(a, b)) assert.ok(y - x + 1 <= 10);
  }
});

uji('satu halaman -> satu potongan; rentang kosong -> tidak ada potongan', () => {
  assert.deepEqual(potonganRentang(7, 7), [[7, 7]]);
  assert.deepEqual(potonganRentang(5, 4), []);
});

uji('rentang di luar akal diklem, bukan meledak', () => {
  assert.deepEqual(potonganRentang(-3, 12), [[1, 10], [11, 12]]);
});

// ============================================================
bagian('2. PLACEHOLDER GAMBAR TIDAK BOLEH LOLOS KE READER');
// ============================================================

const babContoh = {
  judul: 'Bab 5',
  sections: [{
    judul: 'A. Fotosintesis',
    blocks: [
      { tipe: 'p', isi: 'Perhatikan diagram {{GAMBAR_1}} berikut.' },
      { tipe: 'list', items: ['tahap 1 {{GAMBAR_2}}', 'tahap 2'] },
      { tipe: 'math', isi: '$6CO_2 + 6H_2O \\to C_6H_{12}O_6$' },
    ],
  }],
  ujiPemahaman: [{ soal: 'Apa hasil akhir {{GAMBAR_1}}?' }],
};

uji('token tanpa pasangan URL dibuang & spasi dirapikan', () => {
  const { bab, tokenDibuang } = substitusiPlaceholder(babContoh);
  assert.equal(tokenDibuang, 3);
  assert.ok(!JSON.stringify(bab).includes('{{GAMBAR'), 'token lolos ke bab');
  assert.equal(bab.sections[0].blocks[0].isi, 'Perhatikan diagram berikut.');
});

uji('token dengan pasangan URL diganti URL-nya', () => {
  const { bab, tokenDibuang } = substitusiPlaceholder(babContoh, { 1: 'https://cdn.contoh/g1.png' });
  assert.equal(tokenDibuang, 1); // hanya GAMBAR_2 yang tak berpasangan
  assert.ok(bab.sections[0].blocks[0].isi.includes('https://cdn.contoh/g1.png'));
  assert.ok(bab.ujiPemahaman[0].soal.includes('https://cdn.contoh/g1.png'));
});

uji('masukan tidak dimutasi (bab asal dipakai ulang lintas percobaan)', () => {
  const sebelum = JSON.stringify(babContoh);
  substitusiPlaceholder(babContoh);
  assert.equal(JSON.stringify(babContoh), sebelum);
});

uji('bab kosong/rusak tidak melempar', () => {
  assert.deepEqual(substitusiPlaceholder(null).bab, {});
  assert.equal(substitusiPlaceholder({ sections: [] }).tokenDibuang, 0);
});

// ============================================================
// RINGKASAN
// ============================================================
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
