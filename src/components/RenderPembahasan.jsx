// src/components/RenderPembahasan.jsx
// ============================================================
// Renderer pembahasan bergaya BUKU sumber (permintaan owner 2026-10-10):
// kode sumber jadi kepala, premis/logika jadi blok tersendiri, baris
// "Kesimpulan :" bergaris seperti di buku, "Jawaban X" tebal menutup, dan
// highlight ==teks== / <mark> kuning seperti stabilo tentor.
//
// Strukturnya diparse utils/strukturPembahasan.js (murni, teruji); berkas
// ini hanya urusan tampilan. RenderMath dipakai per baris supaya rumus
// LaTeX di pembahasan tetap hidup.
// ============================================================
import React from 'react';
import RenderMath from './RenderMath';
import { strukturPembahasan, pecahHighlight } from '../utils/strukturPembahasan';

const S = {
  kode: {
    fontWeight: 800, fontSize: 11, letterSpacing: 0.4, color: '#0f172a',
    borderLeft: '3px solid #7c3aed', paddingLeft: 8, margin: '2px 0 6px',
  },
  teks: { fontSize: 12.5, color: '#334155', lineHeight: 1.7, margin: '4px 0' },
  logika: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '8px 10px', margin: '6px 0', textAlign: 'center',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12, color: '#1e293b', lineHeight: 1.9,
  },
  kesimpulan: {
    display: 'inline-block', borderTop: '1.5px solid #0f172a', paddingTop: 3,
    marginTop: 4, fontWeight: 800, fontSize: 12.5, color: '#0f172a',
  },
  jawaban: {
    display: 'flex', justifyContent: 'flex-end', color: '#b91c1c',
    fontWeight: 900, fontSize: 13, margin: '6px 0 2px',
  },
  mark: { background: '#fef08a', padding: '0 2px', borderRadius: 2 },
};

function Baris({ teks }) {
  const bagian = pecahHighlight(teks);
  return (
    <>
      {bagian.map((b, i) => (b.highlight
        ? <mark key={i} style={S.mark}><RenderMath text={b.teks} /></mark>
        : <RenderMath key={i} text={b.teks} />))}
    </>
  );
}

export default function RenderPembahasan({ teks }) {
  const blok = strukturPembahasan(teks);
  if (!blok.length) return null;
  return (
    <div>
      {blok.map((b, i) => {
        if (b.jenis === 'kode') return <div key={i} style={S.kode}>{b.teks}</div>;
        if (b.jenis === 'logika') {
          return (
            <div key={i} style={S.logika}>
              {b.baris.map((baris, j) => <div key={j}><Baris teks={baris} /></div>)}
            </div>
          );
        }
        if (b.jenis === 'kesimpulan') return <div key={i} style={{ margin: '6px 0' }}><span style={S.kesimpulan}><Baris teks={b.teks} /></span></div>;
        if (b.jenis === 'jawaban') return <div key={i} style={S.jawaban}>Jawaban: {b.huruf}</div>;
        return <div key={i} style={S.teks}><Baris teks={b.teks} /></div>;
      })}
    </div>
  );
}
