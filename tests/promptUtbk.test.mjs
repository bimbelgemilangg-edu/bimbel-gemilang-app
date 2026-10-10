// tests/promptUtbk.test.mjs — blok prompt subtes UTBK
//     node tests/promptUtbk.test.mjs
import assert from 'node:assert/strict';
import { blokPromptUtbk, KARAKTER_SUBTES } from '../lib/promptUtbk.js';
import { MAPEL_UTBK } from '../src/utils/mesinTaksonomiSoal.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('promptUtbk — karakter subtes dari sheet KOMPONEN, bukan karangan');

uji('tujuh subtes mendapat blok; mapel kurikulum mendapat string kosong', () => {
  for (const m of MAPEL_UTBK) {
    const b = blokPromptUtbk(m.nama);
    assert.ok(b.length > 100, `${m.nama} harus punya blok`);
    assert.match(b, /MODE SUBTES UTBK/);
  }
  for (const n of ['Matematika', 'Bahasa Indonesia', '', null, 'Kimia']) {
    assert.equal(blokPromptUtbk(n), '', String(n));
  }
});

uji('kecepatan detik/soal persis sheet KOMPONEN owner', () => {
  const harapan = { PU: 60, PPU: 45, PBM: 75, PK: 60, LBI: 108, LBE: 90, PM: 90 };
  for (const m of MAPEL_UTBK) {
    const b = blokPromptUtbk(m.nama);
    assert.match(b, new RegExp(`${harapan[m.subtes]} detik/soal`), `${m.nama} -> ${harapan[m.subtes]} dtk`);
  }
  assert.equal(Object.keys(KARAKTER_SUBTES).length, 7);
});

uji('blok melarang klaim resmi dan mewajibkan stimulus', () => {
  for (const m of MAPEL_UTBK) {
    const b = blokPromptUtbk(m.nama);
    assert.match(b, /wajib punya stimulus|perbandingan kuantitatif murni/);
    assert.match(b, /Jangan menyebut soal ini "soal UTBK resmi"/);
  }
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
