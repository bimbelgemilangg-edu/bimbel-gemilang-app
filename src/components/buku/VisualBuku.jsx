// src/components/buku/VisualBuku.jsx
// VISUAL BUKU -- pengganti SEMUA gambar statis dari PDF/modul cetak.
// Tipe didukung: 'termometer' | 'tabel' | 'garis' | 'bangun' | 'gambar'
// Prinsip: tidak boleh ada soal yang menyebut gambar tapi gambarnya
// tidak tampil; semua visual vektor (tajim di zoom/proyektor) dan
// interaktif/animatif biar enak dipakai siswa belajar & guru mengajar.
import React, { useState } from 'react';
import { deretBaris } from '../../utils/konversiPdfBuku';

export default function VisualBuku({ visual }) {
  if (!visual) return null;
  if (visual.tipe === 'termometer') return <TermometerInteraktif data={visual.data} satuan={visual.satuan} />;
  if (visual.tipe === 'tabel') return <TabelBuku caption={visual.caption} kepala={visual.kepala} baris={visual.baris} />;
  if (visual.tipe === 'garis') return <GarisBuku titik={visual.titik} keterangan={visual.keterangan} />;
  if (visual.tipe === 'bangun') return <BangunDatar titik={visual.titik} sisi={visual.sisi} isi={visual.isi} keterangan={visual.keterangan} />;
  if (visual.tipe === 'gambar') return <GambarBuku src={visual.src} alt={visual.alt} caption={visual.caption} />;
  return null;
}

// 🔥 TERMOMETER INTERAKTIF -- nilai disembunyikan ('?'), siswa ketuk untuk membaca.
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

// 🔥 BARU: BANGUN DATAR -- SVG generik untuk gambar geometri (persegi
// tangga, bangun-L, persegi+diagonal, dll). Garis "terbang" saat masuk
// (animasi draw), titik & label muncul bertahap, dan sisi yang punya
// field `sembunyi` bisa DIKETUK untuk membuka nilainya (guru bisa
// pakai ini sebagai momen tanya-jawab di kelas).
export function BangunDatar({ titik = [], sisi = [], isi = [], keterangan = '' }) {
  const [buka, setBuka] = useState({});
  const P = {};
  titik.forEach((t) => { P[t.id] = t; });
  const grupIsi = deretBaris(isi); // tahan bentuk mentah [[..]] maupun hasil sanitasi Firestore [{s:[..]}]
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 8px 8px', marginBottom: 12 }}>
      <style>{`
        @keyframes bdDraw { to { stroke-dashoffset: 0; } }
        @keyframes bdFade { from { opacity: 0; } to { opacity: 1; } }
        .bd-sisi { stroke-dasharray: 1; stroke-dashoffset: 1; animation: bdDraw 0.9s ease forwards; }
        .bd-fade { opacity: 0; animation: bdFade 0.6s ease forwards; }
      `}</style>
      <svg width="100%" viewBox="0 0 100 100" style={{ maxHeight: 230, display: 'block' }}>
        {grupIsi.map((grup, i) => (
          <polygon
            key={i}
            points={grup.map((id) => `${P[id].x},${P[id].y}`).join(' ')}
            fill="#cbd5e1" opacity={0.35} className="bd-fade"
            style={{ animationDelay: `${0.5 + i * 0.15}s` }}
          />
        ))}
        {sisi.map((s, i) => {
          const a = P[s.dari], b = P[s.ke];
          if (!a || !b) return null;
          return (
            <line
              key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="#334155" strokeWidth={1.3}
              strokeDasharray={s.putus ? '3 2' : undefined}
              pathLength={s.putus ? undefined : 1}
              className={s.putus ? 'bd-fade' : 'bd-sisi'}
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          );
        })}
        {sisi.map((s, i) => {
          const a = P[s.dari], b = P[s.ke];
          if (!a || !b || !s.label) return null;
          const m = mid(a, b);
          const vertikal = a.x === b.x;
          const horizontal = a.y === b.y;
          const dx = vertikal ? -2.5 : (s.diag ? -2 : 0);
          const dy = horizontal ? -2 : (s.diag ? -2 : 0);
          const anchor = vertikal || s.diag ? 'end' : 'middle';
          const kunci = `${s.dari}-${s.ke}`;
          const tampil = s.sembunyi ? (buka[kunci] ? s.sembunyi : '?') : s.label;
          return (
            <g key={'l' + i} className="bd-fade" style={{ animationDelay: `${0.6 + i * 0.08}s` }}>
              <text x={m.x + dx} y={m.y + dy} fontSize={4.2} fontWeight={800} fill="#652D90" textAnchor={anchor}>{tampil}</text>
              {s.sembunyi && (
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={6}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setBuka((p) => ({ ...p, [kunci]: !p[kunci] }))}
                />
              )}
            </g>
          );
        })}
        {titik.map((t, i) => (
          <g key={t.id} className="bd-fade" style={{ animationDelay: `${0.3 + i * 0.05}s` }}>
            <circle cx={t.x} cy={t.y} r={1.6} fill="#4C6EF5" stroke="white" strokeWidth={0.6} />
            {t.label && (
              <text x={t.x} y={t.y > 85 ? t.y + 7 : t.y - 3} fontSize={5} fontWeight={800} fill="#1e293b" textAnchor="middle">{t.label}</text>
            )}
          </g>
        ))}
      </svg>
      {keterangan && <div style={{ textAlign: 'center', fontSize: 9.5, color: '#94a3b8', marginTop: 4 }}>{keterangan}</div>}
    </div>
  );
}

// Garis lurus bertitik (mis. titik A-C-F-I pada satu garis).
export function GarisBuku({ titik = [], keterangan = '' }) {
  const n = titik.length;
  const W = 260, H = 64, x0 = 24, x1 = W - 24, y = 24;
  const xs = titik.map((_, i) => x0 + (i * (x1 - x0)) / Math.max(1, n - 1));
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 8px 8px', marginBottom: 12 }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <line x1={x0} y1={y} x2={x1} y2={y} stroke="#334155" strokeWidth={2} />
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={4.5} fill="#4C6EF5" stroke="white" strokeWidth={1.5} />
            <text x={x} y={y + 24} fontSize={12} fontWeight={800} fill="#334155" textAnchor="middle">{titik[i]}</text>
          </g>
        ))}
      </svg>
      {keterangan && <div style={{ textAlign: 'center', fontSize: 9.5, color: '#94a3b8', marginTop: 2 }}>{keterangan}</div>}
    </div>
  );
}

// Tabel data sederhana (pengganti tabel cetak di modul).
// baris boleh bentuk mentah [["a","b"]] atau bentuk Firestore [{s:["a","b"]}].
export function TabelBuku({ caption, kepala = [], baris = [] }) {
  const rows = deretBaris(baris);
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
          {rows.map((r, i) => (
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

// Gambar asli (URL) + caption opsional, dengan fallback sopan kalau gagal dimuat.
export function GambarBuku({ src, alt = '', caption = '' }) {
  const [gagal, setGagal] = useState(false);
  if (!src || gagal) {
    return (
      <div style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 12, padding: 12, textAlign: 'center', marginBottom: 12 }}>
        🖼️ Gambar tidak tersedia{alt ? `: ${alt}` : ''}
      </div>
    );
  }
  return (
    <figure style={{ margin: '0 0 12px' }}>
      <img src={src} alt={alt || caption} onError={() => setGagal(true)} style={{ display: 'block', maxWidth: '100%', maxHeight: 340, objectFit: 'contain', margin: '0 auto', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }} />
      {caption && <figcaption style={{ textAlign: 'center', fontSize: 10.5, color: '#94a3b8', marginTop: 5, lineHeight: 1.5 }}>{caption}</figcaption>}
    </figure>
  );
}