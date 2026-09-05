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

export default function RenderMath({ text }) {
  if (!text) return null;
  const parts = String(text).split(/(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          try { return <BlockMath key={i} math={part.slice(2, -2)} />; } catch (e) { return <span key={i}>{part}</span>; }
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          try { return <InlineMath key={i} math={part.slice(1, -1)} />; } catch (e) { return <span key={i}>{part}</span>; }
        }
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          try { return <BlockMath key={i} math={part.slice(2, -2)} />; } catch (e) { return <span key={i}>{part}</span>; }
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          try { return <InlineMath key={i} math={part.slice(2, -2)} />; } catch (e) { return <span key={i}>{part}</span>; }
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}