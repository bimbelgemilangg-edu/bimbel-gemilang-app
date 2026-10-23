// src/utils/rapikanLatexLengket.js
// ============================================================
// PEMULIH PERINTAH LATEX YANG LENGKET.
//
// 🔥 KENAPA ADA (insiden 2026-10-23, owner urgent): keluaran Gemini untuk
// impor 391 soal matematika memuat perintah LaTeX yang LENGKET dengan token
// sesudahnya, mis.
//     $\rightarrowa=18$        seharusnya $\rightarrow a=18$
//     $A(x,y)\rightarrowA'(y,x)$   seharusnya $\rightarrow A'(y,x)$
//     $\timest=...$, $\triangleABC$, $\pir$, $\cdott$
// KaTeX tidak mengenal perintah "\rightarrowa", jadi dengan
// throwOnError:false ia merender POTONGAN MERAH mentah di tengah rumus --
// persis yang dilihat owner di preview admin, dan yang AKAN dilihat siswa
// karena layar siswa memakai perender yang sama. 815 segmen math di satu
// berkas itu terkena.
//
// PRINSIP (sama dengan filosofi repo: jangan mengarang isi):
//   - Yang diperbaiki HANYAMarkup: menyisipkan spasi antara perintah sahih
//     dan token yang lengket padanya. Tidak ada token yang ditambah,
//     dibuang, atau diganti makna.
//   - Perintah yang TIDAK dikenali dibiarkan apa adanya (tidak ditebak),
//     supaya tidak pernah "memperbaiki" sesuatu yang sebenarnya benar.
//   - Pemecahan memakai PREFIX PERINTAH SAHIH TERPANJANG, jadi `\int`,
//     `\leq`, `\ell`, `\textbf` utuh tak tersentuh; `\rightarrowA` pecah
//     jadi `\rightarrow` + `A`.
//
// Uji: tests/rapikanLatexLengket.test.mjs
// ============================================================

/**
 * Perintah LaTeX yang dikenal (subset yang muncul di konten bimbel +
 * perintah umum KaTeX). Dipakai untuk (a) membiarkan perintah sahih utuh,
 * (b) mencari prefix sahih terpanjang saat memecah token lengket.
 */
export const PERINTAH_SAHIH = new Set([
  // pecahan & akar
  'frac', 'dfrac', 'tfrac', 'cfrac', 'sqrt', 'binom',
  // operator & relasi
  'times', 'div', 'pm', 'mp', 'cdot', 'ast', 'star', 'dagger', 'oplus', 'ominus', 'otimes', 'oslash', 'odot',
  'le', 'ge', 'leq', 'geq', 'leqslant', 'geqslant', 'ne', 'neq', 'approx', 'equiv', 'sim', 'simeq', 'cong', 'propto',
  'll', 'gg', 'prec', 'succ', 'preceq', 'succeq',
  // panah
  'to', 'rightarrow', 'Rightarrow', 'leftarrow', 'Leftarrow', 'leftrightarrow', 'Leftrightarrow',
  'mapsto', 'longrightarrow', 'implies', 'iff', 'uparrow', 'downarrow',
  // himpunan & logika
  'in', 'ni', 'notin', 'subset', 'supset', 'subseteq', 'supseteq', 'cup', 'cap', 'setminus',
  'emptyset', 'varnothing', 'forall', 'exists', 'nexists', 'neg', 'land', 'lor',
  // huruf yunani
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'sigma', 'tau', 'upsilon',
  'phi', 'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
  // geometri & simbol lain
  'angle', 'triangle', 'square', 'circle', 'ell', 'hbar', 'partial', 'nabla', 'degree', 'circ',
  'bullet', 'prime', 'infty', 'aleph', 'wp', 'Re', 'Im',
  // fungsi & operator besar
  'sum', 'prod', 'int', 'oint', 'iint', 'lim', 'limsup', 'liminf', 'max', 'min', 'sup', 'inf',
  'log', 'ln', 'lg', 'exp', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'det', 'gcd', 'deg',
  // struktur & teks
  'left', 'right', 'big', 'Big', 'bigg', 'Bigg', 'begin', 'end', 'text', 'textbf', 'textit', 'textrm',
  'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt', 'mathcal', 'mathbb', 'operatorname',
  'quad', 'qquad', 'displaystyle', 'limits', 'nolimits', 'space',
  // aksen & garis
  'overline', 'underline', 'overbrace', 'underbrace', 'hat', 'widehat', 'bar', 'vec', 'dot', 'ddot',
  'tilde', 'widetilde', 'check', 'breve',
  // pembatas
  'vert', 'Vert', 'lvert', 'rvert', 'lVert', 'rVert', 'langle', 'rangle',
  'lceil', 'rceil', 'lfloor', 'rfloor', 'lbrace', 'rbrace',
]);

const RE_TOKEN_PERINTAH = /\\([a-zA-Z]+)/g;

// 🔥 CACAT KEDUA dari berkas yang sama (2026-10-23): AI menulis "tidak sama
// dengan" sebagai TANDA SAMBAH MENGGABUNG U+0338 (combining long solidus)
// yang ditempelkan ke "=" ("152̸=180", "̸=10\sqrt{2}"). KaTeX tidak
// mengenal U+0338 sebagai aksen -> ParseError "Unknown accent" -> render
// merah. Maknanya tidak ambigu: itu \ne. Diperbaiki jadi `\ne` berspasi.
// U+0338 yang TIDAK menempel pada "=" dibiarkan (tidak ditebak).
const SOLIDUS_GABUNG = '̸'; // U+0338

/**
 * Pulihkan "tidak sama dengan" yang ditulis sebagai solidus gabung U+0338
 * menjadi `\ne`. `152̸=180` -> `152 \ne 180`.
 *
 * @param {string} teks
 * @returns {string}
 */
export function rapikanSimbolNegasi(teks) {
  const asli = String(teks ?? '');
  if (!asli.includes(SOLIDUS_GABUNG)) return asli;
  return asli
    .replace(/≠/g, ' \\ne ')
    .replace(/̸=/g, ' \\ne ')
    // Sisa U+0338 yang tidak berdampingan dengan "=" (mis. "2̸2"):
    // solidus gabung SELALU bermakna negasi, jadi dipetakan ke \\ne juga.
    .replace(/̸/g, ' \\ne ');
}

/**
 * Semua pemulihan markup LaTeX dalam satu pintu (urutan tetap):
 * perintah lengket, lalu simbol negasi gabung.
 *
 * @param {string} teks
 * @returns {string}
 */
export function rapikanLatexTeks(teks) {
  return rapikanSimbolNegasi(rapikanPerintahLengket(teks));
}

/**
 * Sisipkan spasi antara perintah LaTeX sahih dan token yang lengket
 * padanya. `\rightarrowa` -> `\rightarrow a`. Perintah yang sudah benar
 * dan perintah yang tidak dikenal TIDAK diubah.
 *
 * @param {string} teks
 * @returns {string}
 */
export function rapikanPerintahLengket(teks) {
  const asli = String(teks ?? '');
  if (!asli.includes('\\')) return asli;
  return asli.replace(RE_TOKEN_PERINTAH, (token, kata) => {
    if (PERINTAH_SAHIH.has(kata)) return token;
    // Prefix sahih terpanjang: `\rightarrowA` -> `\rightarrow` + `A`.
    for (let i = kata.length - 1; i >= 2; i -= 1) {
      const prefix = kata.slice(0, i);
      if (PERINTAH_SAHIH.has(prefix)) {
        return `\\${prefix} ${kata.slice(i)}`;
      }
    }
    return token; // tidak dikenal: biarkan, jangan mengarang
  });
}

const FIELD_TEKS = ['teks_soal', 'soal', 'question', 'pertanyaan', 'pembahasan', 'penjelasan', 'explanation', 'solusi'];
const FIELD_OPSI = ['opsi_jawaban', 'opsi', 'options', 'choices'];
const FIELD_BACAAN = ['bacaan', 'stimulus', 'wacana'];

function rapikanOpsi(opsi) {
  if (typeof opsi === 'string') return rapikanLatexTeks(opsi);
  if (opsi && typeof opsi === 'object') {
    return { ...opsi, teks: rapikanLatexTeks(opsi.teks ?? '') };
  }
  return opsi;
}

function rapikanBacaan(bacaan) {
  if (typeof bacaan === 'string') return rapikanLatexTeks(bacaan);
  if (bacaan && typeof bacaan === 'object') {
    return { ...bacaan, teks: rapikanLatexTeks(bacaan.teks ?? '') };
  }
  return bacaan;
}

/**
 * Terapkan pemulihan perintah lengket ke SELURUH field teks sebuah butir
 * mentah (teks soal, opsi, bacaan, pembahasan, pernyataan). TIDAK mutasi.
 * Dipakai di normalizeSoal supaya semua pintu impor (HTML/JSON/CSV/.tex)
 * dan semua layar hilir (siswa, cetak naskah, guru) mendapat markup rapi.
 *
 * @param {object} q butir mentah
 * @returns {object} butir baru dengan markup LaTeX terpulihkan
 */
export function rapikanLatexSoal(q) {
  if (!q || typeof q !== 'object') return q;
  const keluar = { ...q };
  for (const k of FIELD_TEKS) {
    if (typeof keluar[k] === 'string') keluar[k] = rapikanLatexTeks(keluar[k]);
  }
  for (const k of FIELD_OPSI) {
    if (Array.isArray(keluar[k])) keluar[k] = keluar[k].map(rapikanOpsi);
  }
  for (const k of FIELD_BACAAN) {
    if (k in keluar) keluar[k] = rapikanBacaan(keluar[k]);
  }
  if (Array.isArray(keluar.pernyataan)) keluar.pernyataan = keluar.pernyataan.map(rapikanOpsi);
  return keluar;
}

export default { PERINTAH_SAHIH, rapikanPerintahLengket, rapikanSimbolNegasi, rapikanLatexTeks, rapikanLatexSoal };
