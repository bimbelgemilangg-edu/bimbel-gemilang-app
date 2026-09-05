// src/pages/student/tryout/RendererIsianSingkat.jsx
// ============================================================
// Renderer buat 2 tipe soal yang tadinya BELUM DIDUKUNG sama sekali
// di Try Out (soal isian_singkat & numerik cuma bisa "diblokir",
// gak bisa dikerjain): input teks/angka bebas, bukan pilihan ganda.
//
// Cara nilai (lihat skorSoalTryOut.js -> cocokJawabanSingkat):
// - isian_singkat: dicocokkan case-insensitive & spasi dirapikan,
//   boleh cocok ke kunciJawaban ATAU salah satu jawabanEkuivalen.
// - numerik: dibaca sebagai angka (koma dianggap titik desimal),
//   dianggap benar kalau selisihnya <= toleransiJawaban.
// ============================================================

import React from 'react';
import { soalBelumDijawab } from '../../../utils/skorSoalTryOut';

export default function RendererIsianSingkat({ soal, jawabanTerpilih = '', onChange, modeTinjau = false, disabled = false }) {
  const tidakDijawab = modeTinjau && soalBelumDijawab(soal, jawabanTerpilih);
  const isNumerik = soal.tipe === 'numerik';

  return (
    <div>
      {tidakDijawab && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e', fontWeight: 700 }}>
          ⚠️ Soal ini tidak dijawab
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type={isNumerik ? 'text' : 'text'}
          inputMode={isNumerik ? 'decimal' : 'text'}
          value={jawabanTerpilih || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled || modeTinjau}
          placeholder={isNumerik ? 'Ketik jawaban angka...' : 'Ketik jawabanmu...'}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 14,
            border: modeTinjau
              ? `2px solid ${soal.tipe && (jawabanTerpilih || '').trim() ? '#cbd5e1' : '#e2e8f0'}`
              : '1px solid #cbd5e1',
            background: disabled || modeTinjau ? '#f8fafc' : 'white',
          }}
        />
        {isNumerik && soal.satuanJawaban && (
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{soal.satuanJawaban}</span>
        )}
      </div>

      {modeTinjau && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: '#16a34a', background: '#f0fdf4', borderRadius: 8, padding: '8px 12px' }}>
          ✔️ Kunci jawaban: <b>{soal.kunciJawaban}</b>{isNumerik && soal.satuanJawaban ? ` ${soal.satuanJawaban}` : ''}
        </div>
      )}
    </div>
  );
}
