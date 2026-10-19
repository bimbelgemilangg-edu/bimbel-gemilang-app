// regresi 19 Okt: pembahasan di naskah KUNCI GURU dulu tercetak mentah
// ($$...$$ lolos escape); kini segmen math wajib terender KaTeX.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kunciButirNaskahHtml, teksKeHtml } from '../src/utils/naskahSoal.js';

test('kunciButirNaskahHtml: pembahasan $$ dan $ terender KaTeX, bukan mentah', () => {
  const html = kunciButirNaskahHtml({
    kunciJawaban: 'C',
    pembahasan: 'Karena $$3 \\cdot {}^b\\log a = 4 \\implies {}^b\\log a = \\frac{4}{3}$$ maka nilai $\\frac{3}{4}$.',
  }, 3);
  assert.ok(html.includes('katex'), 'ada markup katex');
  assert.ok(!html.includes('$$'), 'tidak ada $$ mentah tersisa');
  assert.match(html, /Kunci:/);
});

test('teksKeHtml: display math multiline dirender', () => {
  const html = teksKeHtml('Buktikan:\n$$\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}$$ selesai');
  assert.ok(html.includes('katex'));
  assert.ok(!html.includes('$$'));
});
