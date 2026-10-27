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

export default function RenderMath({ text }) {
  if (!text) return null;
  // 🔥 2026-10-23: pemecah lama di sini pakai titik yang TIDAK melewati \n,
  // sehingga $$ multiline lolos sebagai teks mentah di try out. Kini pakai
  // SATU SUMBER utils/segmenMatematika + kebijakan ukuran seragam (layar =
  // kertas).
  // pre-line: baris buku (bullet/step) tetap baris di try out & latihan
  return (
    <span style={{ whiteSpace: 'pre-line' }}>
      {pecahSegmenMatematika(text).map((seg, i) => {
        if (seg.jenis === 'teks') return <React.Fragment key={i}>{seg.isi}</React.Fragment>;
        const math = sumberKaTeX(seg);
        return seg.jenis === 'blok'
          ? <BlockMath key={i} math={math} />
          : <InlineMath key={i} math={math} />;
      })}
    </span>
  );
}