// src/pages/student/tryout/RendererPgSederhana.jsx
// ============================================================
// Render soal tipe "pg_sederhana" -- radio button, 1 jawaban benar.
// Dibuat SATU GAYA sama RendererPgKompleks.jsx & RendererBenarSalah.jsx
// (prop modeTinjau yang sama), biar TryOutView.jsx bisa switch antar
// 3 tipe tanpa logika beda-beda.
// ============================================================

import React from 'react';
import { cariIndexBenar } from '../../../utils/skoringSoalKompleks';
import { soalBelumDijawab } from '../../../utils/skorSoalTryOut';

export default function RendererPgSederhana({ soal, jawabanTerpilih = null, onChange, modeTinjau = false, disabled = false }) {
  const opsi = soal.opsiJawaban || [];
  const indexBenar = cariIndexBenar(soal);
  const tidakDijawab = modeTinjau && soalBelumDijawab(soal, jawabanTerpilih);

  return (
    <div>
      {tidakDijawab && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e', fontWeight: 700 }}>
          ⚠️ Soal ini tidak dijawab
        </div>
      )}
      {opsi.map((opt, i) => {
        const huruf = String.fromCharCode(65 + i);
        const teksOpsi = typeof opt === 'string' ? opt : (opt?.teks || '');
        const dipilih = jawabanTerpilih === i;

        let border = '#e2e8f0';
        let bg = dipilih ? '#f5f3ff' : 'white';
        let ikon = null;

        if (modeTinjau) {
          if (i === indexBenar) { border = '#22c55e'; bg = '#f0fdf4'; ikon = '✔️'; }
          else if (dipilih) { border = '#ef4444'; bg = '#fef2f2'; ikon = '✖️'; }
        } else if (dipilih) {
          border = '#7c3aed';
        }

        return (
          <button
            key={i}
            type="button"
            disabled={disabled || modeTinjau}
            onClick={() => !modeTinjau && !disabled && onChange?.(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
              padding: '13px 14px', borderRadius: 12, border: `2px solid ${border}`, marginBottom: 9,
              background: bg, cursor: modeTinjau || disabled ? 'default' : 'pointer', fontSize: 13.5, color: '#1e293b',
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: '50%', border: `2px solid ${modeTinjau ? border : (dipilih ? '#7c3aed' : '#cbd5e1')}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0,
              color: modeTinjau ? border : '#7c3aed',
            }}>
              {huruf}
            </span>
            <span style={{ flex: 1 }}>{teksOpsi}</span>
            {modeTinjau && ikon && <span style={{ fontSize: 14 }}>{ikon}</span>}
          </button>
        );
      })}
    </div>
  );
}