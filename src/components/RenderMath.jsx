// src/components/RenderMath.jsx
// ============================================================
// Render teks yang mengandung rumus matematika (LaTeX) -- SATU-
// SATUNYA sumber logika ini, dipakai bareng oleh LatihanHarianPage.jsx
// DAN semua renderer Try Out (RendererPgSederhana/PgKompleks/
// BenarSalah/IsianSingkat.jsx, TryOutView.jsx).
//
// 🔥 KENAPA INI PENTING: sebelumnya Try Out SAMA SEKALI TIDAK PUNYA
// render LaTeX -- soal matematika tampil sebagai kode mentah kayak
// "$\frac{1}{3}$" bukan pecahan yang dirender rapi. Latihan Harian
// udah lebih dulu punya ini (renderMath), tapi Try Out ketinggalan.
// Sekarang disatukan ke 1 komponen bersama, biar ke depannya gak ada
// lagi 1 tempat yang lupa dibenerin pas 1 tempat lain diupdate (persis
// pola bug format kelas "7" vs "7 SMP" yang pernah kejadian).
//
// Kenal DUA gaya delimiter LaTeX: $...$ / $$...$$ (gaya dolar) DAN
// \(...\) / \[...\] (gaya standar LaTeX) -- soal dari Bank Soal
// ternyata pakai campuran keduanya tergantung mapel/sumbernya.
// ============================================================

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { pecahSegmenMatematika, sumberKaTeX } from '../utils/segmenMatematika.js';
import { renderLatexHtml } from '../utils/renderLatexHtml.js';

function ubahMarkdownTableDanGambar(teks) {
  if (!teks || typeof teks !== 'string') return teks;
  let hasil = teks;

  // 1. Ekstraksi markdown table: | a | b | \n |---|---| \n | c | d |
  const reTable = /(?:^|\n)(\|[^\n]+\|\r?\n\|(?:\s*:?-+:?\s*\|)+\r?\n(?:\|[^\n]+\|\r?\n?)+)/g;
  hasil = hasil.replace(reTable, (match) => {
    const lines = match.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return match;
    const parseCells = (line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    const headerCells = parseCells(lines[0]);
    const bodyLines = lines.slice(2);
    const ths = headerCells.map((h) => `<th style="border:1px solid #cbd5e1;padding:8px 10px;background:#f1f5f9;font-weight:700;">${h}</th>`).join('');
    const trs = bodyLines.map((b) => {
      const cells = parseCells(b);
      return `<tr>${cells.map((c) => `<td style="border:1px solid #cbd5e1;padding:8px 10px;vertical-align:top;">${c}</td>`).join('')}</tr>`;
    }).join('');
    return `\n<div class="nsk-tabel" style="overflow-x:auto;margin:10px 0;"><table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;background:#fff;border-radius:8px;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>\n`;
  });

  // 2. Ekstraksi markdown image: ![alt](url)
  hasil = hasil.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:8px;margin:8px auto;display:block;" />');

  // 3. Ekstraksi format markdown teks: tebal (**teks**) dan miring (*teks*) di luar rumus LaTeX
  // Simpan rumus matematika sementara agar tidak merusak karakter * pada rumus perkalian
  const rumusSimpanan = [];
  hasil = hasil.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g, (m) => {
    const placeholder = `___GB_MATH_FORMULA_${rumusSimpanan.length}___`;
    rumusSimpanan.push(m);
    return placeholder;
  });

  // Tebal: **teks**
  hasil = hasil.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  // Miring: *teks* (hanya jika ada teks di antara bintang dan bukan spasi kosong)
  hasil = hasil.replace(/(^|[^\*])\*([^\*\s\n](?:[^*\n]*?[^\*\s\n])?)\*(?!\*)/g, '$1<em>$2</em>');

  // Kembalikan rumus matematika utuh
  for (let idx = 0; idx < rumusSimpanan.length; idx++) {
    hasil = hasil.split(`___GB_MATH_FORMULA_${idx}___`).join(rumusSimpanan[idx]);
  }

  return hasil;
}

export default function RenderMath({ text }) {
  if (!text) return null;

  const raw = String(text);
  const diproses = ubahMarkdownTableDanGambar(raw);

  // Jika teks memuat tag HTML (tabel, gambar, paragraf, div, bold, dll), render dengan renderLatexHtml
  if (/<(table|thead|tbody|tr|th|td|img|div|p|span|b|strong|i|em|ul|ol|li)\b/i.test(diproses)) {
    return (
      <span
        className="gb-math-html"
        style={{ display: 'inline-block', width: '100%' }}
        dangerouslySetInnerHTML={{ __html: renderLatexHtml(diproses) }}
      />
    );
  }

  // pre-line: baris buku (bullet/step) tetap baris di try out & latihan
  return (
    <span style={{ whiteSpace: 'pre-line' }}>
      {pecahSegmenMatematika(raw).map((seg, i) => {
        if (seg.jenis === 'teks') return <React.Fragment key={i}>{seg.isi}</React.Fragment>;
        const math = sumberKaTeX(seg);
        return seg.jenis === 'blok'
          ? <BlockMath key={i} math={math} />
          : <InlineMath key={i} math={math} />;
      })}
    </span>
  );
}