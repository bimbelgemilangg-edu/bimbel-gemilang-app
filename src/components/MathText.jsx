// src/components/MathText.jsx
// Renderer LaTeX dalam teks, SATU sumber. Kenal dua gaya delimiter:
// $...$ / $$...$$ dan \(...\) / \[...\]. MathSafe = error boundary
// kecil: rumus rusak cuma tampil mentah, bukan crash satu halaman.
import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { pecahSegmenMatematika, sumberKaTeX } from '../utils/segmenMatematika.js';

// 17 Okt 2026: display math ($$...$$ / \[...\]) SERING multiline pada
// pembahasan JSON owner; titik tidak melewati \n sehingga dulu lolos
// sebagai teks mentah. Pakai [\s\S] untuk blok display; inline tetap
// satu baris agar tidak melahap dua rumus terpisah.
const REGEX_MATH = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\n$]*?\$|\\\([^\n]*?\\\))/g;

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
      return <span style={{ color: '#334155' }} title="rumus gagal dirender KaTeX">{this.props.fallback}</span>;
    }
    return this.props.children;
  }
}

export function MathText({ text }) {
  if (!text) return null;
  return (
    <>
      {pecahSegmenMatematika(text).map((seg, i) => {
        if (seg.jenis === 'teks') return <React.Fragment key={i}>{seg.isi}</React.Fragment>;
        const math = sumberKaTeX(seg);
        return seg.jenis === 'blok'
          ? <MathSafe key={i} fallback={seg.isi}><BlockMath math={math} /></MathSafe>
          : <MathSafe key={i} fallback={seg.isi}><InlineMath math={math} /></MathSafe>;
      })}
    </>
  );
}

export function MathBlock({ text }) {
  if (!text) return null;
  // 17 Okt 2026: block 'math' warisan adaptor awal ada yang sebenarnya
  // PROSA ber-inline-math; BlockMath atas kalimat = error. Route ulang
  // ke MathText supaya dokumen tersimpan sembuh saat render.
  const t0 = String(text);
  const punyaDelim = /\$|\\\[|\\\(/.test(t0);
  const plain = t0.replace(REGEX_MATH, '').replace(/[^A-Za-z]/g, '');
  if (punyaDelim && plain.length > 12) return <MathText text={text} />;
  // 🔧 16 Okt 2026: data tersimpan dari adaptor awal masih membawa
  // pembungkus '$$...$$' -> KaTeX error (teks merah). Lucut di sini
  // supaya dokumen lama ikut sembuh tanpa impor ulang.
  const t = String(text).trim();
  const raw = (t.startsWith('$$') && t.endsWith('$$') && t.length > 4) || (t.startsWith('\\[') && t.endsWith('\\]') && t.length > 4)
    ? t.slice(2, -2).trim()
    : t;
  return (
    <div style={{ overflowX: 'auto', padding: '8px 0', textAlign: 'center' }}>
      <MathSafe fallback={raw}>
        <BlockMath math={raw} />
      </MathSafe>
    </div>
  );
}

export default MathText;