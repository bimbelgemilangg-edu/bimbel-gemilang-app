// tests/rapikanLatexLengket.test.mjs
// ============================================================
// Test regresi INSIDEN 2026-10-23 (lanjutan): markup LaTeX rusak dari
// keluaran Gemini membuat KaTeX merender POTONGAN MERAH di layar admin,
// dan akan sama merahnya di layar siswa karena perendernya sama.
//
//     node tests/rapikanLatexLengket.test.mjs
//
// Dua cacat markup yang dipulihkan (fixture dikutip apa adanya dari berkas
// HTML 391 soal yang dikirim owner 2026-10-23):
//
//   1. PERINTAH LENGKET -- "\rightarrowa", "\Rightarrowx", "\timest",
//      "\triangleABC", "\pir", "\cdott". KaTeX tidak mengenal perintah
//      "\rightarrowa" -> ParseError -> render merah (throwOnError:false).
//      343 token lengket di satu berkas itu.
//   2. NEGASI SOLIDUS GABUNG -- "152̸=180", "̸=10\sqrt{2}", "2̸2"
//      (U+0338 combining long solidus dipakai sebagai "tidak sama dengan").
//      KaTeX: "Unknown accent" -> render merah. 6 segmen di berkas itu.
//
// Prinsip yang dipaku test ini: pemulihan HANYA menyentuh markup (sisip
// spasi / ganti solidus jadi \ne). Perintah sahih TIDAK berubah, perintah
// tak dikenal TIDAK ditebak, dan hasilnya idempoten.
// ============================================================

import assert from 'node:assert/strict';
import katex from 'katex';
import {
  rapikanPerintahLengket,
  rapikanSimbolNegasi,
  rapikanLatexTeks,
  rapikanLatexSoal,
} from '../src/utils/rapikanLatexLengket.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus += 1; console.log('ok ' + lulus + ' - ' + nama); }
  catch (e) { gagal += 1; console.log('not ok ' + (lulus + gagal) + ' - ' + nama); console.log('  ' + e.message); }
}

// ------------------------------------------------------------
// 1. Perintah lengket terpisah jadi perintah sahih + token
// ------------------------------------------------------------
uji('fixture owner: $\\rightarrowa=18$ -> $\\rightarrow a=18$', () => {
  assert.equal(rapikanPerintahLengket('$\\rightarrowa=18$'), '$\\rightarrow a=18$');
});
uji('fixture owner: panah lengket di tengah rumus titik refleksi', () => {
  const masuk = '$A(x,y)\\rightarrowA^{\\prime}(x+a,y+b)$';
  const keluar = rapikanPerintahLengket(masuk);
  assert.equal(keluar, '$A(x,y)\\rightarrow A^{\\prime}(x+a,y+b)$');
});
uji('fixture owner: \\timest (panjang kali lebar) -> \\times t', () => {
  assert.equal(rapikanPerintahLengket('$=p\\timesl=(2x+5)$'), '$=p\\times l=(2x+5)$');
});
uji('fixture owner: \\triangleABC -> \\triangle ABC', () => {
  assert.equal(rapikanPerintahLengket('$\\triangleABC$'), '$\\triangle ABC$');
});
uji('fixture owner: \\pir -> \\pi r', () => {
  assert.equal(rapikanPerintahLengket('$\\pir$'), '$\\pi r$');
});
uji('fixture owner: \\cdott -> \\cdot t', () => {
  assert.equal(rapikanPerintahLengket('$\\cdott$'), '$\\cdot t$');
});

// ------------------------------------------------------------
// 2. Perintah sahih & tak dikenal TIDAK diubah
// ------------------------------------------------------------
for (const t of ['$\\frac{1}{2}$', '$\\leq$', '$\\ell$', '$\\int x\\,dx$', '$\\text{luas}$', '$\\lim_{x\\to 0}$', '$\\Rightarrow x$']) {
  uji(`perintah sahih tidak diubah: ${t}`, () => {
    assert.equal(rapikanPerintahLengket(t), t);
  });
}
uji('perintah tak dikenal dibiarkan (tidak ditebak)', () => {
  assert.equal(rapikanPerintahLengket('$\\blahx$'), '$\\blahx$');
});

// ------------------------------------------------------------
// 3. Negasi solidus gabung (U+0338) jadi \ne
// ------------------------------------------------------------
uji('fixture owner: 152̸=180 -> 152 \\ne 180', () => {
  assert.equal(rapikanSimbolNegasi('$152̸=180$'), '$152 \\ne 180$');
});
uji('fixture owner: solidus di depan sama dengan', () => {
  assert.equal(rapikanSimbolNegasi('$̸=10\\sqrt{2}$'), '$ \\ne 10\\sqrt{2}$');
});
uji('fixture owner: solidus tanpa tanda sama dengan (2̸2)', () => {
  assert.equal(rapikanSimbolNegasi('$\\frac{1}{2}2̸2$'), '$\\frac{1}{2}2 \\ne 2$');
});
uji('teks tanpa solidus tidak berubah', () => {
  assert.equal(rapikanSimbolNegasi('$a=b$'), '$a=b$');
});

// ------------------------------------------------------------
// 4. rapikanLatexSoal menyentuh semua field teks butir
// ------------------------------------------------------------
uji('rapikanLatexSoal: teks soal, opsi, pembahasan, pernyataan terpulihkan', () => {
  const q = {
    teks_soal: 'Nilai $\\pir$ adalah ....',
    opsi_jawaban: [{ teks: '$\\timest$' }, '227'],
    pembahasan: 'Jadi $\\rightarrowa=18$ dan $152̸=180$.',
    pernyataan: [{ teks: '$\\triangleABC$ siku-siku' }],
  };
  const r = rapikanLatexSoal(q);
  assert.equal(r.teks_soal, 'Nilai $\\pi r$ adalah ....');
  assert.equal(r.opsi_jawaban[0].teks, '$\\times t$');
  assert.equal(r.opsi_jawaban[1], '227');
  assert.equal(r.pembahasan, 'Jadi $\\rightarrow a=18$ dan $152 \\ne 180$.');
  assert.equal(r.pernyataan[0].teks, '$\\triangle ABC$ siku-siku');
  // tidak mutasi objek masuk
  assert.equal(q.teks_soal, 'Nilai $\\pir$ adalah ....');
});

// ------------------------------------------------------------
// 5. Idempoten -- pemulihan kedua kali tidak mengubah apa pun
// ------------------------------------------------------------
uji('idempoten pada teks campuran', () => {
  const t = 'Jadi $\\rightarrowa=18$, $152̸=180$, dan $\\frac{1}{2}$.';
  assert.equal(rapikanLatexTeks(rapikanLatexTeks(t)), rapikanLatexTeks(t));
});

// ------------------------------------------------------------
// 6. KUNCI PERILAKU: hasil pemulihan bebas katex-error.
//    Ini yang benar-benar dilihat siswa -- bukan stringnya, tapi
//    apakah perender masih membuang potongan merah.
// ------------------------------------------------------------
function merah(teks) {
  return [...teks.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)]
    .map((m) => (m[1] ?? m[2]).trim())
    .filter((raw) => katex.renderToString(raw, { throwOnError: false, strict: 'ignore', output: 'html' }).includes('katex-error'));
}
uji('fixture owner: semua segmen math render tanpa katex-error', () => {
  const masuk = 'Titik $A(24,-30)\\rightarrowx=24,y=-30$ dan $152̸=180$ serta $\\triangleABC$.';
  assert.ok(merah(masuk).length > 0, 'sanity: masukan memang harus merah dulu');
  assert.deepEqual(merah(rapikanLatexTeks(masuk)), []);
});

console.log('');
console.log(`# rapikanLatexLengket: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
