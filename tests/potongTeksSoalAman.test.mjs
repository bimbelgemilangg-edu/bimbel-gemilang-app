// regresi 17 Okt: kartu Rakit Try Out memotong teks soal di tengah rumus.
import test from 'node:test';
import assert from 'node:assert/strict';
import { potongTeksSoalAman } from '../src/utils/fieldButirSoal.js';

test('potongTeksSoalAman: teks pendek utuh, panjang dipotong di batas kata', () => {
  assert.equal(potongTeksSoalAman('soal pendek', 150), 'soal pendek');
  const panjang = 'kata '.repeat(60).trim();
  const out = potongTeksSoalAman(panjang, 150);
  assert.ok(out.endsWith(' …'));
  assert.ok(!out.slice(0, -2).endsWith('k'), 'tidak memotong tengah kata');
});

test('potongTeksSoalAman: tidak membelah rumus $...$', () => {
  const teks = 'Diketahui nilai $x$ kecil lalu $\\frac{a}{b} + \\frac{c}{d} = \\sqrt{e}$ maka nilai $a$ yang memenuhi persamaan panjang berikut adalah ....';
  const out = potongTeksSoalAman(teks, 60);
  const dolar = (out.match(/\$/g) || []).length;
  assert.equal(dolar % 2, 0, 'delimeter math tetap berpasangan');
});
