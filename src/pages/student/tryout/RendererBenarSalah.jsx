// src/pages/student/tryout/RendererBenarSalah.jsx
// ============================================================
// Render soal tipe "benar_salah" / "pg_kategori" -- tabel pernyataan,
// tiap baris dijawab Benar/Salah sendiri-sendiri. Bank Soal simpan
// datanya di `tabel_benar_salah` ATAU `pernyataan` (bentuknya SAMA
// PERSIS, cuma nama field beda tergantung tipe -- lihat catatan yang
// sama di ImportHasilScanPage.jsx), jadi komponen ini nerima dua-duanya.
//
// Sama seperti RendererPgKompleks.jsx: `modeTinjau` ngatur apa lagi
// ngerjakan (netral, gak ada reveal) atau lagi lihat hasil (reveal
// penuh, gaya CBT resmi -- centang di kolom yang benar, silang merah
// kalau siswa milih yang salah).
// ============================================================

import React from 'react';
import { soalBelumDijawab } from '../../../utils/skorSoalTryOut';

// 🔥 BARU (bug freeze/blank putih ditemukan): lihat penjelasan lengkap
// di skoringSoalKompleks.js -- jangan percaya tabel_benar_salah/
// pernyataan PASTI array.
function safeArray(v) {
  if (Array.isArray(v)) return v;
  return [];
}

export default function RendererBenarSalah({ soal, jawabanTerpilih = [], onChange, modeTinjau = false, disabled = false }) {
  const barisMentah = safeArray(soal.tabel_benar_salah).length ? soal.tabel_benar_salah : soal.pernyataan;
  const baris = safeArray(barisMentah);
  // 🔥 BARU: sama kayak 2 renderer lain -- biar jelas beda antara
  // "siswa skip semua baris" vs "salah jawab semua baris".
  const tidakDijawab = modeTinjau && soalBelumDijawab(soal, jawabanTerpilih);

  const pilihBaris = (index, nilai) => {
    if (disabled || modeTinjau) return;
    const baru = [...jawabanTerpilih];
    baru[index] = nilai;
    onChange?.(baru);
  };

  return (
    <>
      {tidakDijawab && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e', fontWeight: 700 }}>
          ⚠️ Soal ini tidak dijawab
        </div>
      )}
      <div style={{ borderRadius: 10, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ background: '#1e293b' }}>
            <th style={{ width: 36, padding: '10px 8px', textAlign: 'center', color: '#e2e8f0', fontWeight: 600, fontSize: 12, borderRight: '1px solid #334155' }}>No</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#e2e8f0', fontWeight: 600, fontSize: 12 }}>Pernyataan</th>
            <th style={{ width: 76, padding: '10px 6px', textAlign: 'center', color: '#e2e8f0', fontWeight: 600, fontSize: 12, borderLeft: '1px solid #334155' }}>Benar</th>
            <th style={{ width: 76, padding: '10px 6px', textAlign: 'center', color: '#e2e8f0', fontWeight: 600, fontSize: 12, borderLeft: '1px solid #334155' }}>Salah</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((item, i) => {
            const teks = typeof item === 'object' ? (item.pernyataan || item.teks || '') : String(item);
            const kunci = String(item?.jawaban || '').toLowerCase().trim();
            const jawabanSiswa = String(jawabanTerpilih[i] || '').toLowerCase().trim();

            const renderSel = (labelSel) => {
              const isDipilihSiswa = jawabanSiswa === labelSel.toLowerCase();
              const isKunci = kunci === labelSel.toLowerCase();

              let bg = 'transparent';
              let border = '#cbd5e1';
              let tanda = '';

              if (modeTinjau) {
                if (isKunci) { border = '#15803d'; bg = isDipilihSiswa ? '#15803d' : 'white'; tanda = isDipilihSiswa ? '✓' : (isKunci ? '•' : ''); }
                if (isDipilihSiswa && !isKunci) { border = '#dc2626'; bg = '#dc2626'; tanda = '✕'; }
              } else if (isDipilihSiswa) {
                border = '#7c3aed'; bg = '#7c3aed'; tanda = '✓';
              }

              return (
                <td
                  onClick={() => pilihBaris(i, labelSel)}
                  style={{
                    padding: '10px 6px', textAlign: 'center', borderLeft: '1px solid #e2e8f0', verticalAlign: 'middle',
                    cursor: modeTinjau || disabled ? 'default' : 'pointer',
                  }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: 4, border: `2px solid ${border}`,
                    background: bg, color: 'white', fontSize: 12, fontWeight: 700,
                  }}>
                    {tanda}
                  </span>
                </td>
              );
            };

            return (
              <tr key={i} style={{ borderTop: i > 0 ? '1px solid #e2e8f0' : 'none', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, borderRight: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                  {i + 1}
                </td>
                <td style={{ padding: '10px 14px', color: '#1e293b', verticalAlign: 'top' }}>{teks}</td>
                {renderSel('Benar')}
                {renderSel('Salah')}
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </>
  );
}