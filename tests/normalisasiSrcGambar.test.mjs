// tests/normalisasiSrcGambar.test.mjs
// ============================================================
// Test pelepas bungkus markdown alamat gambar (src/utils/normalisasiSrcGambar.js).
//
//     node tests/normalisasiSrcGambar.test.mjs
//
// KENAPA INI PENTING
// Keluhan owner 2026-10-07: "gambar dari Gemini gak muncul semua".
// Akar masalah: Gemini Canvas menulis src="<url>(<url>)" gaya tautan
// markdown; sistem membaca apa adanya -> gambar dicap rusak/palsu dan
// impor tertahan. Util ini melepas bungkusnya di pintu masuk parse.
//
// Invarian yang dikunci:
//   1. Bungkus markdown [url](url), [label](url), [url]() -> url inti
//   2. Bungkus kurung siku/sudut/bundar polos -> url inti
//   3. Alamat polos & data: URI TIDAK berubah sedikit pun (idempoten)
//   4. Masukan kosong/bukan string -> string kosong, tidak melempar
// ============================================================

import assert from 'node:assert/strict';
import { lepasBungkusanSrcGambar } from '../src/utils/normalisasiSrcGambar.js';

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

const URL_WIKI = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Hydrochinon2.svg/450px-Hydrochinon2.svg.png';

bagian('1. Bungkus markdown gaya Gemini Canvas (kasus nyata owner)');

uji('src "[url](url)" persis seperti file kimia owner dilepas jadi url polos', () => {
  const mentah = `[${URL_WIKI}](${URL_WIKI})`;
  assert.equal(lepasBungkusanSrcGambar(mentah), URL_WIKI);
});

uji('markdown berlabel "[gambar](url)" mengambil isi kurung bundar', () => {
  assert.equal(
    lepasBungkusanSrcGambar('[struktur senyawa](https://contoh.org/a.png)'),
    'https://contoh.org/a.png',
  );
});

uji('markdown tanpa judul di kurung bundar "[url]()" fallback ke kurung siku', () => {
  assert.equal(
    lepasBungkusanSrcGambar('[https://contoh.org/b.png]()'),
    'https://contoh.org/b.png',
  );
});

uji('markdown berjudul "[label](url "judul.png")" membuang judulnya', () => {
  assert.equal(
    lepasBungkusanSrcGambar('[gbr](https://contoh.org/c.png "judul.png")'),
    'https://contoh.org/c.png',
  );
});

uji('spasi tepi sebelum/sesudah bungkus dirapikan', () => {
  assert.equal(
    lepasBungkusanSrcGambar('  [https://contoh.org/d.png](https://contoh.org/d.png)  '),
    'https://contoh.org/d.png',
  );
});

bagian('2. Bungkus kurung polos');

uji('kurung siku saja "[url]" dilepas', () => {
  assert.equal(
    lepasBungkusanSrcGambar('[https://contoh.org/e.png]'),
    'https://contoh.org/e.png',
  );
});

uji('kurung sudut saja "<url>" dilepas', () => {
  assert.equal(
    lepasBungkusanSrcGambar('<https://contoh.org/f.png>'),
    'https://contoh.org/f.png',
  );
});

uji('kurung bundar saja "(url)" dilepas', () => {
  assert.equal(
    lepasBungkusanSrcGambar('(https://contoh.org/g.png)'),
    'https://contoh.org/g.png',
  );
});

uji('bungkus bertumpuk "<[url](url)>" ikut terlepas (maks 2 putaran)', () => {
  assert.equal(
    lepasBungkusanSrcGambar(`<[${URL_WIKI}](${URL_WIKI})>`),
    URL_WIKI,
  );
});

bagian('3. Alamat sah TIDAK berubah & idempoten');

uji('url polos dikembalikan utuh', () => {
  assert.equal(lepasBungkusanSrcGambar(URL_WIKI), URL_WIKI);
});

uji('data: URI base64 dikembalikan utuh (jangan sampai rusak)', () => {
  const dataUrl = 'data:image/png;base64,iVBORw0KGgo=AAA';
  assert.equal(lepasBungkusanSrcGambar(dataUrl), dataUrl);
});

uji('pemanggilan dua kali beruntun hasil sama (idempoten)', () => {
  const mentah = `[${URL_WIKI}](${URL_WIKI})`;
  const sekali = lepasBungkusanSrcGambar(mentah);
  assert.equal(lepasBungkusanSrcGambar(sekali), sekali);
});

uji('url berisi kurung bundar di tengah tidak terpotong', () => {
  const url = 'https://contoh.org/berkas(1).png';
  assert.equal(lepasBungkusanSrcGambar(url), url);
});

bagian('4. Masukan kosong / aneh tidak melempar');

uji('string kosong -> string kosong', () => {
  assert.equal(lepasBungkusanSrcGambar('   '), '');
});

uji('null/undefined/objek -> string kosong', () => {
  assert.equal(lepasBungkusanSrcGambar(null), '');
  assert.equal(lepasBungkusanSrcGambar(undefined), '');
  assert.equal(lepasBungkusanSrcGambar({ src: 'x' }), '');
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
