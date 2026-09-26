// src/components/belajar/PembahasanBox.jsx
// ============================================================
// KARTU PEMBAHASAN DUA JALUR (dipisahkan turn 95 agar bisa dipakai
// BelajarReader, RiwayatLatihanPanel, dan ReviewSesi tanpa import
// sirkular): kartu biru "Jalur konsep" (otomatis daftar bernomor
// untuk pola Baris/Pernyataan pada soal tabel) + kartu amber
// "Jalur Cara Gemilang".
// ============================================================
import React from 'react';
import { Lightbulb, Crown } from 'lucide-react';
import { MathText } from '../MathText';

export default function PembahasanBox({ soal }) {
  const teks = String(soal?.pembahasan || '').trim();
  if (!teks) return null;
  const iCg = teks.indexOf('Jalur Cara Gemilang:');
  const konsep = (iCg >= 0 ? teks.slice(0, iCg) : teks).replace(/^Jalur konsep:\s*/, '').trim();
  const cg = iCg >= 0 ? teks.slice(iCg + 'Jalur Cara Gemilang:'.length).trim() : '';
  let list = konsep.split(/(?=Baris \d+ —)/).map((x) => x.trim()).filter(Boolean);
  if (list.length < 2) list = konsep.split(/(?=Pernyataan \(\d+\))/).map((x) => x.trim()).filter(Boolean);
  if (list.length < 2) list = null;
  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 14, padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, color: '#1D4ED8', fontSize: 12, marginBottom: 6 }}>
          <Lightbulb size={14} /> Jalur konsep
        </div>
        {list ? list.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{
              flexShrink: 0, width: 20, height: 20, borderRadius: 999, background: '#1D4ED8',
              color: '#fff', fontSize: 11, fontWeight: 900, marginTop: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{i + 1}</span>
            <span style={{ fontSize: 13, lineHeight: 1.7, color: '#1E3A8A' }}><MathText text={it} /></span>
          </div>
        )) : (
          <div style={{ fontSize: 13, lineHeight: 1.8, color: '#1E3A8A' }}><MathText text={konsep} /></div>
        )}
      </div>
      {cg ? (
        <div style={{ background: '#FFF6DE', border: '1.5px solid #F1E1AE', borderRadius: 14, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, color: '#8A6D1A', fontSize: 12, marginBottom: 4 }}>
            <Crown size={14} /> Jalur Cara Gemilang
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: '#8A6D1A' }}><MathText text={cg} /></div>
        </div>
      ) : null}
    </div>
  );
}
