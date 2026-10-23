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
 * Pecah teks menjadi runtutan segmen teks biasa & segmen matematika.
 * @param {string} teks
 * @returns {{jenis: 'teks'|'inline'|'blok', isi: string}[]}
 */
export function pecahSegmenMatematika(teks) {
  const sumber = String(teks ?? '');
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

export default { pecahSegmenMatematika, adaMatematika, sumberKaTeX };
