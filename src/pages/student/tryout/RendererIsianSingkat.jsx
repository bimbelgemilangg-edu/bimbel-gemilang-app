// src/pages/student/tryout/RendererIsianSingkat.jsx
// ============================================================
// Renderer buat tipe soal isian_singkat & numerik (input teks/angka bebas).
// Mendukung UTBK-SNBT 2026 (Pengetahuan Kuantitatif & Penalaran Matematika).
//
// Cara nilai (lihat skorSoalTryOut.js -> cocokJawabanSingkat):
// - isian_singkat: dicocokkan case-insensitive & spasi dirapikan,
//   boleh cocok ke kunciJawaban ATAU salah satu jawabanEkuivalen.
// - numerik: dibaca sebagai angka (koma dianggap titik desimal),
//   dianggap benar kalau selisihnya <= toleransiJawaban.
// ============================================================

import React from 'react';
import { soalBelumDijawab, cocokJawabanSingkat } from '../../../utils/skorSoalTryOut';

export default function RendererIsianSingkat({ 
  soal, 
  jawabanTerpilih = '', 
  onChange, 
  modeTinjau = false, 
  disabled = false, 
  sembunyikanKunci = false 
}) {
  const tidakDijawab = modeTinjau && soalBelumDijawab(soal, jawabanTerpilih);
  const isNumerik = soal?.tipe === 'numerik';
  const isBenar = modeTinjau ? (cocokJawabanSingkat(soal, jawabanTerpilih) > 0) : null;

  return (
    <div style={{ marginTop: 12 }}>
      {/* Petunjuk pengerjaan saat ujian aktif */}
      {!modeTinjau && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          fontSize: 12, 
          color: '#b45309', 
          background: '#fef3c7', 
          border: '1px solid #fde68a', 
          borderRadius: 8, 
          padding: '6px 10px', 
          marginBottom: 10,
          fontWeight: 700 
        }}>
          <span>✏️</span>
          <span>Soal Isian Singkat: Ketikkan jawaban angka atau nilai akhir kamu pada kotak di bawah.</span>
        </div>
      )}

      {tidakDijawab && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e', fontWeight: 700 }}>
          ⚠️ Soal ini tidak dijawab
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          inputMode={isNumerik ? 'decimal' : 'text'}
          value={jawabanTerpilih || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled || modeTinjau}
          placeholder={isNumerik ? 'Ketik jawaban angka...' : 'Ketik jawaban angka / teks singkat...'}
          style={{
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: 10, 
            fontSize: 15,
            fontWeight: 600,
            border: modeTinjau
              ? (isBenar ? '2px solid #22c55e' : (tidakDijawab ? '2px solid #f59e0b' : '2px solid #ef4444'))
              : '2px solid #cbd5e1',
            background: disabled || modeTinjau ? '#f8fafc' : '#ffffff',
            color: '#0f172a'
          }}
        />
        {isNumerik && soal.satuanJawaban && (
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{soal.satuanJawaban}</span>
        )}
      </div>

      {/* Mode Tinjau Hasil */}
      {modeTinjau && !sembunyikanKunci && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {isBenar ? (
            <div style={{ fontSize: 13, color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', fontWeight: 700 }}>
              ✔️ Jawabanmu Tepat! <b>({jawabanTerpilih})</b>
            </div>
          ) : tidakDijawab ? (
            <div style={{ fontSize: 13, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontWeight: 700 }}>
              ⚠️ Tidak dijawab · Kunci resmi: <b>{soal.kunciJawaban}</b>{isNumerik && soal.satuanJawaban ? ` ${soal.satuanJawaban}` : ''}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px' }}>
              ❌ Jawabanmu: <b>"{jawabanTerpilih}"</b> · Kunci resmi: <b>{soal.kunciJawaban}</b>{isNumerik && soal.satuanJawaban ? ` ${soal.satuanJawaban}` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
