// src/components/RenderMath.jsx
// ============================================================
// Render teks yang mengandung rumus matematika (LaTeX), tabel,
// tipografi (tebal, miring, garis bawah, pangkat/indeks), judul wacana,
// dan pemisah paragraf bergaya buku/PDF ujian resmi.
//
// Dipakai universal oleh:
// - Siswa Try Out (TryOutView.jsx, TobkCbtPage.jsx, RendererPgSederhana, dll.)
// - Siswa Latihan (ModalKerjakanLatihanSesi.jsx)
// - Guru (GuruPantauTryOut.jsx, ModalSiapkanLatihanSesi.jsx)
// - Admin (HasilTryOutAdminPage.jsx, TerbitkanTryOutPage.jsx, TeksSoalBergambar.jsx)
// ============================================================

import React from 'react';
import 'katex/dist/katex.min.css';
import { normalisasiTeksMatematika } from '../utils/segmenMatematika.js';
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
    return `\n<div class="nsk-tabel" style="overflow-x:auto;margin:12px 0;"><table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;background:#fff;border-radius:8px;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>\n`;
  });

  // 2. Ekstraksi markdown image: ![alt](url)
  hasil = hasil.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:8px;margin:8px auto;display:block;" />');

  // 3. Ekstraksi format teks (tebal, miring, judul wacana, dsb) di luar rumus LaTeX
  const rumusSimpanan = [];
  hasil = hasil.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g, (m) => {
    const placeholder = `___GB_MATH_FORMULA_${rumusSimpanan.length}___`;
    rumusSimpanan.push(m);
    return placeholder;
  });

  // Markdown headings (#, ##, ###, ####)
  hasil = hasil.replace(/^#{1,6}\s+(.+)$/gm, '<div class="gb-judul-wacana" style="font-weight:800;font-size:1.08em;color:#1e293b;margin:16px 0 8px;letter-spacing:-0.01em;">$1</div>');

  // Judul wacana/teks mandiri pada baris tersendiri (misal "Text 1", "Text 2", "Passage A", "Wacana 1", "Teks 1")
  hasil = hasil.replace(/^((?:Text|Passage|Wacana|Teks|Part|Bab)\s+[A-Z0-9]+)\s*$/gmi, '<div class="gb-judul-wacana" style="font-weight:800;font-size:1.1em;color:#1e293b;margin:18px 0 8px;border-left:3px solid #6366f1;padding-left:8px;">$1</div>');

  // Sumber wacana (misal "(Adapted from https://...)" atau "(Sumber: ...)")
  hasil = hasil.replace(/^(\((?:Adapted from|Sumber|Source|Disadur dari)[^)]+\))\s*$/gmi, '<div class="gb-sumber-wacana" style="font-style:italic;color:#64748b;font-size:0.92em;margin:6px 0 14px;">$1</div>');

  // Tebal: **teks**
  hasil = hasil.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  // Miring asteris: *teks*
  hasil = hasil.replace(/(^|[^\*])\*([^\*\s\n](?:[^*\n]*?[^\*\s\n])?)\*(?!\*)/g, '$1<em>$2</em>');
  // Miring garis bawah: _teks_
  hasil = hasil.replace(/(^|[^a-zA-Z0-9_])_([^_\s\n](?:[^_\n]*?[^_\s\n])?)_(?![a-zA-Z0-9_])/g, '$1<em>$2</em>');

  // Kembalikan rumus matematika utuh
  for (let idx = 0; idx < rumusSimpanan.length; idx++) {
    hasil = hasil.split(`___GB_MATH_FORMULA_${idx}___`).join(rumusSimpanan[idx]);
  }

  // Format paragraf dan jeda baris
  // Jika teks memuat pergantian paragraf ganda (\n\n), susun sebagai paragraf berjarak rapi
  if (hasil.includes('\n\n')) {
    const blokParagraf = hasil.split(/\n{2,}/);
    hasil = blokParagraf.map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      // Jangan bungkus jika sudah berupa tag blok (div wacana, tabel, dsb)
      if (/^<(div|table|h[1-6]|figure|p|ul|ol)\b/i.test(trimmed)) return trimmed;
      return `<div class="gb-paragraf" style="margin-bottom:12px;line-height:1.7;">${trimmed.replace(/\n/g, '<br/>')}</div>`;
    }).filter(Boolean).join('\n');
  } else if (!/<(p|div|table|br)\b/i.test(hasil) && hasil.includes('\n')) {
    hasil = hasil.replace(/\n/g, '<br/>');
  }

  return hasil;
}

export default function RenderMath({ text }) {
  if (!text) return null;

  const raw = normalisasiTeksMatematika(String(text));
  const diproses = ubahMarkdownTableDanGambar(raw);

  return (
    <span
      className="gb-math-html"
      style={{ display: 'inline-block', width: '100%', lineHeight: '1.7', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: renderLatexHtml(diproses) }}
    />
  );
}