// src/components/MathText.jsx
// Renderer LaTeX dalam teks, SATU sumber. Kenal dua gaya delimiter:
// $...$ / $$...$$ dan \(...\) / \[...\]. MathSafe = error boundary
// kecil: rumus rusak cuma tampil mentah, bukan crash satu halaman.
import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const REGEX_MATH = /(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/g;

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