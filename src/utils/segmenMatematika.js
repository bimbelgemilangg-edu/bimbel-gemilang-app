// src/utils/segmenMatematika.js
// ============================================================
// SATU SUMBER KEBENARAN pemecahan segmen matematika dalam teks.
//
// 🔥 KENAPA ADA (audit owner 2026-10-23: "pastikan tampilan soal asli dan
// rapi sampai di cetak, try out, dll semuanya"). Sebelumnya ada EMPAT
// pemecah berbeda dengan perilaku berbeda:
//
//   naskahSoal.js (CETAK)     : TIDAK mengenal \(..\) / \[..\] -> mentah di kertas
//   RenderMath.jsx (try out)  : titik tak melewati \n -> $$ multiline mentah di layar
//   MathText.jsx (belajar)    : tanpa guarda "$ " -> dolar biasa bisa tertelan
//   renderLatexHtml.js (buku) : paling lengkap, tapi kebijakan ukuran beda
//
// Akibatnya dokumen yang sama tampil beda di empat permukaan: pecahan
// kecil-gepeng di layar tapi sebesar buku di kertas; delimiter tertentu
// mentah di satu permukaan dan rapi di permukaan lain. Owner meminta
// bentuk yang ASLI & RAPI KONSISTEN sampai cetak/try out -- karenanya
// pemecahan dan kebijakan ukuran dirangkum di sini dan dipakai bersama.
//
// KEBIJAKAN UKURAN (keluhan guru matematika 2026-10-09, dulu hanya berlaku
// di cetak): pecahan/akar/konstruk bertingkat yang ditulis INLINE dirender
// dengan \displaystyle supaya tampil setinggi buku pelajaran, bukan kecil
// gepeng. Kini berlaku di SEMUA permukaan, jadi layar siswa = kertas.
//
// Uji: tests/segmenMatematika.test.mjs
// ============================================================

/**
 * Empat gaya delimiter yang diakui kontrak impor:
 *   $$...$$  dan \[...\]  -> blok (boleh multiline)
 *   $...$    dan \(...\)  -> inline (satu baris; "$" diikuti spasi BUKAN
 *                            math, supaya dolar biasa/teks uang tak tertelan)
 */
const RE_SEGMEN = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\s)[^\n$]+?\$|\\\([^\n]*?\\\))/g;

/** Konstruksi yang di buku pelajaran dicetak bertingkat (tinggi). */
const RE_BERTINGKAT = /\\(frac|dfrac|tfrac|cfrac|sqrt|sum|prod|int|oint|iint|lim|binom|begin\{)/;

/**
 * Normalisasi otomatis rumus matematika:
 * 1. Mengonversi pecahan miring (horizontal) seperti 1/2, 3/4 menjadi pecahan vertikal atas-bawah \frac{1}{2}.
 * 2. Membungkus perintah LaTeX kali (\times) dan bagi (\div) yang tercecer di luar delimiter $...$.
 * 3. Menghindari kesalahan render KaTeX pada simbol perkalian dan pembagian.
 * @param {string} teks
 * @returns {string}
 */
export function normalisasiTeksMatematika(teks) {
  if (!teks || typeof teks !== 'string') return '';
  let hasil = teks;

  const mathPlaceholders = [];
  hasil = hasil.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\s)[^\n$]+?\$|\\\([^\n]*?\\\))/g, (m) => {
    let inner = m;
    const isDolar = inner.startsWith('$') && inner.endsWith('$');
    const isDuaDolar = inner.startsWith('$$') && inner.endsWith('$$');
    let raw = isDuaDolar ? inner.slice(2, -2) : (isDolar ? inner.slice(1, -1) : inner);

    // Ganti simbol unicode di dalam rumus LaTeX menjadi perintah KaTeX yang valid
    raw = raw
      .replace(/×/g, '\\times ')
      .replace(/÷/g, '\\div ')
      .replace(/±/g, '\\pm ')
      .replace(/≤/g, '\\le ')
      .replace(/≥/g, '\\ge ')
      .replace(/≠/g, '\\ne ')
      .replace(/≈/g, '\\approx ')
      .replace(/[°◦]C\b/g, '^\\circ\\text{C}')
      .replace(/[°◦]/g, '^\\circ');

    inner = isDuaDolar ? `$$${raw}$$` : (isDolar ? `$${raw}$` : raw);
    const ph = `___GB_SAFE_MATH_${mathPlaceholders.length}___`;
    mathPlaceholders.push(inner);
    return ph;
  });

  // Bungkus perintah LaTeX mentah yang tercecer di luar $...$ (mis. \times, \div, \cdot, \frac, \sqrt, dll)
  hasil = hasil.replace(/(\\(?:times|div|cdot|pm|mp|le|ge|ne|neq|approx|infty|degree|circ|alpha|beta|gamma|theta|pi|sqrt|frac|dfrac)\b(?:\{[^{}]*\}\{[^{}]*\}|\{[^{}]*\}|\[[^[\]]*\]\{[^{}]*\}|(?![a-zA-Z]))(?:\s*=\s*[^,\s\n]+)?)/g, (match) => {
    return `$${match.trim()}$`;
  });

  // Derajat di luar math: 30°C -> $30^\circ\text{C}$, 45° -> $45^\circ$
  hasil = hasil.replace(/(\d+)\s*[°◦]\s*C\b/g, '$$$1^\\circ\\text{C}$');
  hasil = hasil.replace(/(\d+)\s*[°◦]\b/g, '$$$1^\\circ$');

  // Akar di luar math: √16 -> $\sqrt{16}$, √(x+1) -> $\sqrt{x+1}$
  hasil = hasil.replace(/√\s*\(([^)]+)\)/g, '$\\sqrt{$1}$');
  hasil = hasil.replace(/√\s*\{([^}]+)\}/g, '$\\sqrt{$1}$');
  hasil = hasil.replace(/√\s*(\d+|[a-zA-Z])\b/g, '$\\sqrt{$1}$');
  hasil = hasil.replace(/√/g, '$\\sqrt{}$');

  // Operasi matematika di luar math: 12 ÷ 3 -> $12 \div 3$, 4 × 5 -> $4 \times 5$, ± -> $\pm$
  hasil = hasil.replace(/([0-9a-zA-Z\)\]\}]+)\s*÷\s*([0-9a-zA-Z\(\[\{]+)/g, '$$1 \\div $2$');
  hasil = hasil.replace(/÷/g, '$\\div$');
  hasil = hasil.replace(/([0-9a-zA-Z\)\]\}]+)\s*×\s*([0-9a-zA-Z\(\[\{]+)/g, '$$1 \\times $2$');
  hasil = hasil.replace(/×/g, '$\\times$');
  hasil = hasil.replace(/±/g, '$\\pm$');
  hasil = hasil.replace(/≤/g, '$\\le$');
  hasil = hasil.replace(/≥/g, '$\\ge$');
  hasil = hasil.replace(/≠/g, '$\\ne$');
  hasil = hasil.replace(/≈/g, '$\\approx$');

  // Pangkat sederhana di luar math: mis. x^2, x^3, 2^10, 10^-3
  hasil = hasil.replace(/(?<![\w$])([a-zA-Z]|\d+)\^([0-9a-zA-Z\-+]+)(?![\w$])/g, '$$$1^{$2}$');

  // Konversi pecahan miring sederhana (1/2, 3/4) menjadi pecahan bertingkat atas-bawah (\frac{1}{2})
  // Mencegah konversi pada tanggal (mis. 16/11/2026) atau url
  hasil = hasil.replace(/(?<![\d/.:\-\w])([1-9]\d*)\s*\/\s*([1-9]\d*)(?![\d/.:\-\w])/g, (match, pembilang, penyebut) => {
    if (pembilang.length <= 4 && penyebut.length <= 4) {
      return `$\\frac{${pembilang}}{${penyebut}}$`;
    }
    return match;
  });

  // Kembalikan placeholder rumus asli
  for (let idx = 0; idx < mathPlaceholders.length; idx++) {
    hasil = hasil.split(`___GB_SAFE_MATH_${idx}___`).join(mathPlaceholders[idx]);
  }

  return hasil;
}

/**
 * Pecah teks menjadi runtutan segmen teks biasa & segmen matematika.
 * @param {string} teks
 * @returns {{jenis: 'teks'|'inline'|'blok', isi: string}[]}
 */
export function pecahSegmenMatematika(teks) {
  const sumber = normalisasiTeksMatematika(String(teks ?? ''));
  const keluar = [];
  let terakhir = 0;
  for (const m of sumber.matchAll(RE_SEGMEN)) {
    if (m.index > terakhir) keluar.push({ jenis: 'teks', isi: sumber.slice(terakhir, m.index) });
    const token = m[0];
    const blok = token.startsWith('$$') || token.startsWith('\\[');
    // Delimiter 2 karakter ($$, \[, \() dilucut 2-2; dolar tunggal 1-1.
    const isi = (token[0] === '$' && token[1] !== '$') ? token.slice(1, -1) : token.slice(2, -2);
    keluar.push({ jenis: blok ? 'blok' : 'inline', isi });
    terakhir = m.index + token.length;
  }
  if (terakhir < sumber.length) keluar.push({ jenis: 'teks', isi: sumber.slice(terakhir) });
  return keluar;
}

/** Apakah teks memuat setidaknya satu segmen matematika? */
export function adaMatematika(teks) {
  return pecahSegmenMatematika(teks).some((s) => s.jenis !== 'teks');
}

/**
 * String sumber untuk KaTeX dari satu segmen, dengan kebijakan ukuran
 * seragam: blok selalu displaystyle; inline memakai displaystyle hanya
 * bila memuat konstruksi bertingkat (supaya teks biasa tetap rapat).
 * @param {{jenis: 'inline'|'blok', isi: string}} segmen
 * @returns {string}
 */
export function sumberKaTeX(segmen) {
  const isi = String(segmen?.isi ?? '').trim();
  if (segmen?.jenis === 'blok') return `\\displaystyle ${isi}`;
  return RE_BERTINGKAT.test(isi) ? `\\displaystyle ${isi}` : isi;
}

export default { normalisasiTeksMatematika, pecahSegmenMatematika, adaMatematika, sumberKaTeX };
