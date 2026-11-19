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
 *   $...$    dan \(...\)  -> inline (satu baris; "$" tanpa penutup BUKAN math)
 */
const RE_SEGMEN = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\s*\$)[^\n$]+?\$|\\\([^\n]*?\\\))/g;

/** Konstruksi yang di buku pelajaran dicetak bertingkat (tinggi). */
const RE_BERTINGKAT = /\\(frac|dfrac|tfrac|cfrac|sqrt|sum|prod|int|oint|iint|lim|binom|begin\{)/;

/**
 * Normalisasi otomatis rumus matematika:
 * 1. Mengonversi pecahan miring (horizontal) seperti 1/2, 3/4 menjadi pecahan vertikal atas-bawah \frac{1}{2}.
 * 2. Membungkus perintah LaTeX kali (\times) dan bagi (\div) yang tercecer di luar delimiter $...$.
 * 3. Menghindari kesalahan render KaTeX pada simbol perkalian, pembagian, dan tanda minus.
 * 4. Menyembuhkan ekspresi aljabar terpecah & tanda minus unari/pecahan terpisah.
 * @param {string} teks
 * @returns {string}
 */
export function normalisasiTeksMatematika(teks) {
  if (!teks || typeof teks !== 'string') return '';
  let hasil = teks;

  // 0a. Satukan tanda minus/plus yang tercecer tepat sebelum math block:
  // mis. "- $\frac{3}{5}$" -> "$-\frac{3}{5}$" atau "= - $\frac{5}{3}$" -> "=$-\frac{5}{3}$"
  hasil = hasil.replace(/([=:\s(\[])\s*([+\-–—])\s*\$(\\frac\{[^{}]+\}\{[^{}]+\}|\d+)\$/g, '$1$$$2$3$');

  // 0b. Rapikan spasi liar tepat setelah/sebelum delimiter dolar math:
  // mis. "$ -5 $" -> "$-5$", "$ \frac{1}{2} $" -> "$\frac{1}{2}$", "$- 18$" -> "$-18$"
  hasil = hasil.replace(/\$\s+([^\n$]+?)\s+\$/g, '$$$1$');
  hasil = hasil.replace(/\$\s+([^\n$]+?)\$/g, '$$$1$');
  hasil = hasil.replace(/\$([^\n$]+?)\s+\$/g, '$$$1$');

  // 0c. Sembuhkan polinomial/aljabar yang terpotong keluar dari $:
  // mis. "($15a^{2} - 3b^{2}$ +4 ab)" -> "($15a^{2} - 3b^{2} + 4ab$)"
  // mis. "($30x^{2}$ +19x +5)" -> "($30x^{2} + 19x + 5$)"
  // mis. "($2x^{2}$ - x)" -> "($2x^{2} - x$)"
  // mis. "($28x^{2}$ + 18x- 5)" -> "($28x^{2} + 18x - 5$)"
  hasil = hasil.replace(/\$([^\$]+)\$\s*([+\-–—]\s*[0-9a-zA-Z\s+\-–—^]+?)(?=\s*(?:\$|\)|<|;|\.|$))/g, (match, inside, tail) => {
    let cleanTail = tail.trim().replace(/([a-zA-Z0-9])\s*([+\-–—])\s*([a-zA-Z0-9])/g, '$1 $2 $3');
    cleanTail = cleanTail.replace(/^([+\-–—])\s*(\d+)\s*([a-zA-Z]+)/, '$1 $2$3');
    return `$${inside.trim()} ${cleanTail}$`;
  });

  const mathPlaceholders = [];
  hasil = hasil.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\s*\$)[^\n$]+?\$|\\\([^\n]*?\\\))/g, (m) => {
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
      .replace(/[°◦]/g, '^\\circ')
      .replace(/[−–]/g, '-');

    // Rapikan spasi setelah minus unari dalam math: "$- 18$" -> "$-18$", "$- 4$" -> "$-4$"
    raw = raw
      .replace(/^-\s+(\d+)/, '-$1')
      .replace(/([=+\-–—(])\s*-\s+(\d+)/g, '$1-$2');

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
  hasil = hasil.replace(/(\d+)\s*[°◦]\s*C\b/g, (m, g1) => `$${g1}^\\circ\\text{C}$`);
  hasil = hasil.replace(/(\d+)\s*[°◦]\b/g, (m, g1) => `$${g1}^\\circ$`);

  // Akar di luar math: √16 -> $\sqrt{16}$, √(x+1) -> $\sqrt{x+1}$
  hasil = hasil.replace(/√\s*\(([^)]+)\)/g, (m, g1) => `$\\sqrt{${g1}}$`);
  hasil = hasil.replace(/√\s*\{([^}]+)\}/g, (m, g1) => `$\\sqrt{${g1}}$`);
  hasil = hasil.replace(/√\s*(\d+|[a-zA-Z])\b/g, (m, g1) => `$\\sqrt{${g1}}$`);
  hasil = hasil.replace(/√/g, '$\\sqrt{}$');

  // Konversi unicode superscript (², ³, ⁴, ⁻⁵, dll) ke format caret sebelum normalisasi eksponen
  const mapSup = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
  hasil = hasil.replace(/([0-9a-zA-Z\)])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/g, (m, base, exp) => {
    const normExp = exp.split('').map(c => mapSup[c] || c).join('');
    return `${base}^(${normExp})`;
  });

  // Notasi Ilmiah di luar math: mis. 7,25 × 10^-4 atau 7.25 x 10^-5
  hasil = hasil.replace(/(\d+(?:[.,]\d+)?)\s*[×x]\s*10\^([0-9\-+]+)/g, (m, g1, g2) => {
    const mantissa = g1.replace(',', '{,}');
    return `$${mantissa} \\times 10^{${g2}}$`;
  });

  // Pangkat dengan tanda kurung: mis. 4^(-2), 2^(-3), (-2)^4, a^(m+n)
  hasil = hasil.replace(/\((-?[0-9a-zA-Z]+)\)\^([0-9a-zA-Z\-+]+)/g, (m, g1, g2) => `$(${g1})^{${g2}}$`);
  hasil = hasil.replace(/(?<![\w$])([a-zA-Z]|\d+|\([^\)]+\))\^\(([^\)]+)\)(?![\w$])/g, (m, g1, g2) => `$${g1}^{${g2}}$`);

  // Pangkat sederhana di luar math: mis. x^2, x^3, 2^10, 10^-3
  hasil = hasil.replace(/(?<![\w$])([a-zA-Z]|\d+)\^([0-9a-zA-Z\-+]+)(?![\w$])/g, (m, g1, g2) => `$${g1}^{${g2}}$`);

  // Gabungkan perkalian di antara dua token math yang berdekatan: $a^m$ × $a^n$ -> $a^m \times a^n$
  hasil = hasil.replace(/\$([^\$]+)\$\s*[×x]\s*\$([^\$]+)\$/g, (m, g1, g2) => `$${g1} \\times ${g2}$`);

  // Operasi matematika di luar math: 12 ÷ 3 -> $12 \div 3$, 4 × 5 -> $4 \times 5$, ± -> $\pm$
  hasil = hasil.replace(/([0-9a-zA-Z,.\)\]\}]+)\s*÷\s*([0-9a-zA-Z,.\(\[\{]+)/g, (m, g1, g2) => `$${g1} \\div ${g2}$`);
  hasil = hasil.replace(/÷/g, '$\\div$');
  hasil = hasil.replace(/([0-9a-zA-Z,.\)\]\}]+)\s*×\s*([0-9a-zA-Z,.\(\[\{]+)/g, (m, g1, g2) => `$${g1} \\times ${g2}$`);
  hasil = hasil.replace(/×/g, '$\\times$');
  hasil = hasil.replace(/±/g, '$\\pm$');
  hasil = hasil.replace(/≤/g, '$\\le$');
  hasil = hasil.replace(/≥/g, '$\\ge$');
  hasil = hasil.replace(/≠/g, '$\\ne$');
  hasil = hasil.replace(/≈/g, '$\\approx$');

  // Normalisasi tanda minus unicode di luar math:
  hasil = hasil.replace(/([0-9a-zA-Z\)\]\}]+)\s*[−–]\s*([0-9a-zA-Z\(\[\{]+)/g, '$1 - $2');
  hasil = hasil.replace(/(^|[\s(=:])\s*[−–]\s*(\d+)/g, '$1-$2');

  // Konversi pecahan miring sederhana (1/2, 3/4) menjadi pecahan bertingkat atas-bawah (\frac{1}{2})
  // Mencegah konversi pada tanggal (mis. 16/11/2026) atau url atau tahun ajaran (2025/2026)
  hasil = hasil.replace(/(?<![\d/.:\-\w])([1-9]\d*)\s*\/\s*([1-9]\d*)(?![\d/.:\-\w])/g, (match, pembilang, penyebut) => {
    // Jangan konversi tahun (4 digit >= 1900 atau >= 2000, misal 2025/2026)
    if (pembilang.length === 4 && penyebut.length === 4 && (pembilang.startsWith('19') || pembilang.startsWith('20'))) {
      return match;
    }
    if (pembilang.length <= 4 && penyebut.length <= 4) {
      return `$\\frac{${pembilang}}{${penyebut}}$`;
    }
    return match;
  });

  // Fungsi linear & persamaan di luar math:
  // misal: "f(x) = ax + b", "f(-3) = -18", "2x + y = 14", "x + 2y = 16", "(22x+8)"
  hasil = hasil.replace(/(?<![\w$\\])([fgh]\([0-9a-zA-Z\-+\s]+\)\s*=\s*[-0-9a-zA-Z\s+\-–—^]+?)(?=[,;.!\s)]|$)/g, (match, eq) => {
    if (/\b(dan|atau|adalah|jika|maka|untuk|dengan)\b/i.test(eq)) return match;
    return `$${eq.trim()}$`;
  });
  hasil = hasil.replace(/(?<![\w$\\])([0-9]*[a-zA-Z]\s*[+\-–—]\s*[0-9]*[a-zA-Z]\s*=\s*[-]?\d+)(?=[,;.!\s)]|$)/g, '$$$1$');
  hasil = hasil.replace(/(?<![\w$\\])\((\d+[a-zA-Z]\s*[+\-–—]\s*\d+)\)/g, '($$$1$)');

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
