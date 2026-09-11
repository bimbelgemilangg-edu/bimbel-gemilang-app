// src/components/MathText.jsx
// ============================================================
// MATHTEXT -- renderer LaTeX di dalam teks, SATU sumber.
// Logika sama dengan renderMath() di LatihanHarianPage.jsx,
// diekstrak biar Buku Digital & halaman masa depan pakai logika
// yang sama tanpa copy-paste. Kenal DUA gaya delimiter sekaligus:
// $...$ / $$...$$  dan  \(...\) / \[...\].
//
// Dependensi: katex & react-katex -- SUDAH ada di package.json
// (LatihanHarianPage sejak lama memakainya), jadi TIDAK perlu
// install apa pun lagi.
//
// 🔥 BONUS KEAMANAN: MathSafe (error boundary kecil) -- kalau ada
// satu rumus yang LaTeX-nya rusak, cuma rumus itu yang tampil
// mentah (merah), BUKAN seluruh halaman reader yang crash putih.
// ============================================================
import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const REGEX_MATH = /(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/g;

// Error boundary minimal khusus rumus -- jatuh per-rumus, bukan per-halaman.
class MathSafe extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) {
      return <span style={{ color: '#dc2626' }}>{this.props.fallback}</span>;
    }
    return this.props.children;
  }
}

// Render LaTeX yang MENYATU di dalam paragraf (inline).
export function MathText({ text }) {
  if (!text) return null;
  const parts = String(text).split(REGEX_MATH);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const raw = part.slice(2, -2);
          return <MathSafe key={i} fallback={raw}><BlockMath math={raw} /></MathSafe>;
        }
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const raw = part.slice(2, -2);
          return <MathSafe key={i} fallback={raw}><BlockMath math={raw} /></MathSafe>;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const raw = part.slice(1, -1);
          return <MathSafe key={i} fallback={raw}><InlineMath math={raw} /></MathSafe>;
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const raw = part.slice(2, -2);
          return <MathSafe key={i} fallback={raw}><InlineMath math={raw} /></MathSafe>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

// Render satu rumus sebagai BLOK terpisah (di tengah, bisa scroll
// horizontal kalau rumusnya panjang).
export function MathBlock({ text }) {
  if (!text) return null;
  return (
    <div style={{ overflowX: 'auto', padding: '8px 0', textAlign: 'center' }}>
      <MathSafe fallback={text}>
        <BlockMath math={text} />
      </MathSafe>
    </div>
  );
}

export default MathText;