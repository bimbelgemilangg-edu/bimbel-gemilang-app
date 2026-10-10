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
import RenderMath from '../../../components/RenderMath';
import { opsiTampilDari } from '../../../utils/bersihkanGlifKunci.js';

export default function RendererPgSederhana({ soal, jawabanTerpilih = null, onChange, modeTinjau = false, disabled = false, onKlikGambar = null }) {
  const opsi = opsiTampilDari(soal);
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
        // 🔥 BARU (celah serius ditemukan): opsi jawaban BISA punya
        // gambar sendiri (bukan cuma teks) -- mis. opsi berupa diagram/
        // grafik berbeda-beda. SEBELUMNYA gambar ini gak pernah
        // dirender sama sekali, cuma teksnya doang -- kalau opsi itu
        // MURNI gambar tanpa teks, siswa liat opsi kosong.
        const gambarOpsi = typeof opt === 'object' ? (opt?.gambar || []) : [];
        const dipilih = jawabanTerpilih === i;

        // 🔥 (2026-10-10, restyle mockup owner): format menjawab diubah --
        // teks opsi di kiri (berawalan huruf), radio bulat di KANAN seperti
        // lembar jawaban digital pada mockup. Mode tinjau memakai hijau/merah
        // dengan ikon centang/silang di radio yang sama.
        let border = '#E3E6F0';
        let bg = 'white';
        let radio = { border: '#C7CBE0', dot: null, ikon: null };

        if (modeTinjau) {
          if (i === indexBenar) { border = '#22c55e'; bg = '#f0fdf4'; radio = { border: '#22c55e', dot: '#22c55e', ikon: '✓' }; }
          else if (dipilih) { border = '#ef4444'; bg = '#fef2f2'; radio = { border: '#ef4444', dot: '#ef4444', ikon: '✕' }; }
          else radio = { border: '#d1d5db', dot: null, ikon: null };
        } else if (dipilih) {
          border = '#3949AB';
          bg = '#EEF0FB';
          radio = { border: '#3949AB', dot: '#3949AB', ikon: null };
        }

        return (
          <button
            key={i}
            type="button"
            disabled={disabled || modeTinjau}
            onClick={() => !modeTinjau && !disabled && onChange?.(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${border}`, marginBottom: 10,
              background: bg, cursor: modeTinjau || disabled ? 'default' : 'pointer',
              fontSize: 13.5, color: '#1f2937', fontWeight: dipilih && !modeTinjau ? 700 : 500,
            }}
          >
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <b style={{ color: '#3949AB', fontWeight: 800 }}>{huruf}.</b>
                {teksOpsi ? <RenderMath text={teksOpsi} /> : null}
              </span>
              {gambarOpsi.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {gambarOpsi.map((g, gi) => {
                    const src = g.uploadedUrl || g.url || '';
                    if (!src) return null;
                    return (
                      <img
                        key={gi}
                        src={src}
                        alt={`Gambar opsi ${huruf}`}
                        onClick={onKlikGambar ? () => onKlikGambar(src) : undefined}
                        title={onKlikGambar ? 'Klik untuk memperbesar' : undefined}
                        style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, border: '1px solid #e2e8f0', cursor: onKlikGambar ? 'zoom-in' : 'default' }}
                      />
                    );
                  })}
                </div>
              )}
            </span>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${radio.border}`, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 900,
            }}
            >
              {radio.ikon || (radio.dot && !modeTinjau ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: radio.dot }} /> : '')}
            </span>
          </button>
        );
      })}
    </div>
  );
}