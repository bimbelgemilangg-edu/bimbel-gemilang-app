// src/components/buku/VisualBuku.jsx
// VISUAL BUKU -- pengganti gambar statis dari PDF/modul cetak.
// SVG interaktif: tajam di zoom berapa pun & bisa diketuk
// (termometer menyembunyikan nilainya sampai siswa mengetuk).
import React, { useState } from 'react';

export default function VisualBuku({ visual }) {
  if (!visual) return null;
  if (visual.tipe === 'termometer') return <TermometerInteraktif data={visual.data} satuan={visual.satuan} />;
  if (visual.tipe === 'tabel') return <TabelBuku caption={visual.caption} kepala={visual.kepala} baris={visual.baris} />;
  if (visual.tipe === 'gambar') return <GambarBuku src={visual.src} alt={visual.alt} />;
  return null;
}

export function TermometerInteraktif({ data = [], satuan = '°C' }) {
  const [buka, setBuka] = useState({});
  const MAX = 10, MIN = -20;
  const T = { w: 64, h: 190, tubeX: 26, tubeW: 12, top: 14, bottom: 150, bulbR: 11 };
  const yFor = (v) => T.top + ((MAX - v) / (MAX - MIN)) * (T.bottom - T.top);
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 8px 10px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 6 }}>
        {data.map((d, i) => {
          const terbuka = !!buka[i];
          const y = yFor(d.nilai);
          return (
            <button
              key={i}
              onClick={() => setBuka((p) => ({ ...p, [i]: !terbuka }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0 }}
            >
              <span style={{ fontSize: 10, fontWeight: 800, color: terbuka ? '#dc2626' : '#94a3b8', minHeight: 14 }}>
                {terbuka ? `${d.nilai} ${satuan || '°C'}` : '?'}
              </span>
              <svg width={T.w} height={T.h} viewBox={`0 0 ${T.w} ${T.h}`}>
                {[10, 5, 0, -5, -10, -15, -20].map((v) => (
                  <g key={v}>
                    <line x1={T.tubeX - 6} x2={T.tubeX} y1={yFor(v)} y2={yFor(v)} stroke="#94a3b8" strokeWidth={1} />
                    <text x={T.tubeX - 9} y={yFor(v) + 3} fontSize={7} fill="#94a3b8" textAnchor="end">{v}</text>
                  </g>
                ))}
                <rect x={T.tubeX} y={T.top} width={T.tubeW} height={T.bottom - T.top} rx={6} fill="white" stroke="#cbd5e1" strokeWidth={1.5} />
                <rect x={T.tubeX + 2.5} y={y} width={T.tubeW - 5} height={Math.max(2, T.bottom - y)} rx={3} fill="#ef4444" />
                <circle cx={T.tubeX + T.tubeW / 2} cy={T.bottom + T.bulbR - 2} r={T.bulbR} fill="#ef4444" stroke="#b91c1c" strokeWidth={1} />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#334155' }}>{d.nama}</span>
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', fontSize: 9.5, color: '#94a3b8', marginTop: 6 }}>👆 Ketuk tiap termometer untuk membaca nilainya</div>
    </div>
  );
}

export function TabelBuku({ caption, kepala = [], baris = [] }) {
  return (
    <div style={{ overflowX: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 10, marginBottom: 12 }}>
      {caption && <div style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 6 }}>{caption}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {kepala.map((k, i) => (
              <th key={i} style={{ border: '1px solid #e2e8f0', background: '#eef2ff', color: '#3730a3', padding: '6px 8px', textAlign: 'left', fontSize: 11 }}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ border: '1px solid #e2e8f0', padding: '6px 8px', color: '#334155' }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GambarBuku({ src, alt = '' }) {
  const [gagal, setGagal] = useState(false);
  if (!src || gagal) {
    return (
      <div style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 12, padding: 12, textAlign: 'center', marginBottom: 12 }}>
        🖼️ Gambar tidak tersedia{alt ? `: ${alt}` : ''}
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setGagal(true)} style={{ display: 'block', maxWidth: '100%', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12 }} />;
}