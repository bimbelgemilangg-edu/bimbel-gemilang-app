// tests/kurungLatex.test.mjs — perbaikan otomatis kurung himpunan LaTeX
import assert from 'node:assert/strict';
import { perbaikiKurungHimpunanLatex as fix } from '../src/utils/kurungLatex.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}

console.log('kurungLatex — perbaikan kurung himpunan');

uji('kurung himpunan polos di opsi diperbaiki', () => {
  assert.equal(fix('Himpunan ${(3, 2)}$'), 'Himpunan $\\{(3, 2)\\}$');
});

uji('dua himpunan dalam satu span', () => {
  assert.equal(fix('$A = {2, 3}$ ke $B = {4, 6}$'), '$A = \\{2, 3\\}$ ke $B = \\{4, 6\\}$');
});

uji('sudah benar tidak diubah (idempoten)', () => {
  assert.equal(fix('$\\{(3, 2)\\}$'), '$\\{(3, 2)\\}$');
  assert.equal(fix(fix('$A = {2, 3}$')), fix('$A = {2, 3}$'));
});

uji('grouping sah tidak disentuh', () => {
  for (const t of [
    '$\\frac{1}{2}$', '$x^{2}$', '$a_{1}$', '$\\text{bilangan asli}$',
    '$\\sqrt{9}$', '$2^{n+1}$', '$\\frac{x}{a} + \\frac{y}{b} = 1$',
  ]) assert.equal(fix(t), t, `tidak boleh berubah: ${t}`);
});

uji('teks tanpa matematika tidak disentuh', () => {
  assert.equal(fix('Harga {nota} bukan matematika'), 'Harga {nota} bukan matematika');
});

uji('kurung tak berpasangan dibiarkan (jangan merusak)', () => {
  assert.equal(fix('$ {(3, 2) $'), '$ {(3, 2) $');
});

// 🔥 2026-10-09: grup kosong adalah konstruksi LaTeX sah (logaritma basis
// Indonesia `{}^3\\log x`). Ditemukan saat rencana perbaikan massal diuji
// terhadap data produksi: satu-satunya "perbaikan" yang diusulkan justru
// korupsi rumus logaritma.
uji('grup kosong {} TIDAK di-escape (notasi {}^3 log)', () => {
  const masuk = 'Daerah asal $f(x) = {}^3\\log(x^2 - 9)$ adalah ....';
  assert.equal(fix(masuk), masuk);
});

uji('himpunan berisi angka di dalam span tetap diperbaiki', () => {
  assert.match(fix('HP: ${2, 3}$.'), /\\\{2, 3\\\}/);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
