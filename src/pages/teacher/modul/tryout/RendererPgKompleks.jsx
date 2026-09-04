// src/pages/student/tryout/RendererPgKompleks.jsx
// ============================================================
// Render soal tipe "pg_kompleks" -- checkbox, jawaban benar bisa
// lebih dari satu. Dipakai di 2 KONTEKS beda (diatur lewat prop
// `modeTinjau`):
//
// 1. modeTinjau=false (LAGI NGERJAIN): checkbox polos, TIDAK ada
//    reveal benar/salah sama sekali -- konsisten sama prinsip yang
//    sudah dipakai di Latihan Harian ("kerjakan dulu, baru tau
//    hasilnya di akhir").
// 2. modeTinjau=true (LAYAR HASIL/REVIEW): tiap opsi diberi tanda
//    jelas -- centang HIJAU kalau itu kunci & dicentang siswa (benar),
//    centang MERAH kalau dicentang siswa tapi SALAH, kotak kosong
//    bergaris HIJAU kalau itu kunci tapi KELEWAT gak dicentang siswa.
//    Gaya visualnya sengaja netral (mirip lembar jawaban CBT resmi),
//    bukan playful kayak Latihan Harian -- ini konteks formal.
// ============================================================

import React from 'react';

export default function RendererPgKompleks({ soal, jawabanTerpilih = [], onChange, modeTinjau = false, disabled = false }) {
  const opsi = soal.opsiJawaban || [];
  const kunci = (soal.kunciJawaban || []).map((h) => String(h).toUpperCase().trim());
  const dipilih = new Set((jawabanTerpilih || []).map((h) => String(h).toUpperCase().trim()));

  const toggle = (huruf) => {
    if (disabled || modeTinjau) return;
    const set = new Set(dipilih);
    if (set.has(huruf)) set.delete(huruf); else set.add(huruf);
    onChange?.(Array.from(set));
  };

  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', display: 'inline-block', padding: '4px 10px', borderRadius: 999, marginBottom: 10 }}>
        ☑️ Pilih SEMUA jawaban yang benar (bisa lebih dari satu)
      </div>

      {opsi.map((opt, i) => {
        const huruf = String.fromCharCode(65 + i);
        const teksOpsi = typeof opt === 'string' ? opt : (opt?.teks || '');
        const siswaCentang = dipilih.has(huruf);
        const iniKunci = kunci.includes(huruf);

        // Tentukan warna & ikon HANYA kalau modeTinjau -- pas lagi
        // ngerjakan (modeTinjau=false), semua opsi netral/ungu biasa.
        let border = '#e2e8f0';
        let bg = siswaCentang ? '#f5f3ff' : 'white';
        let ikon = null;

        if (modeTinjau) {
          if (iniKunci && siswaCentang) { border = '#22c55e'; bg = '#f0fdf4'; ikon = '✔️'; } // benar
          else if (!iniKunci && siswaCentang) { border = '#ef4444'; bg = '#fef2f2'; ikon = '✖️'; } // salah dicentang
          else if (iniKunci && !siswaCentang) { border = '#22c55e'; bg = 'white'; ikon = '⬜'; } // kelewat, harusnya dicentang
        } else if (siswaCentang) {
          border = '#7c3aed';
        }

        return (
          <button
            key={i}
            type="button"
            disabled={disabled || modeTinjau}
            onClick={() => toggle(huruf)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
              padding: '13px 14px', borderRadius: 12, border: `2px solid ${border}`, marginBottom: 9,
              background: bg, cursor: modeTinjau || disabled ? 'default' : 'pointer', fontSize: 13.5, color: '#1e293b',
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 6, border: `2px solid ${modeTinjau ? border : (siswaCentang ? '#7c3aed' : '#cbd5e1')}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0,
              background: !modeTinjau && siswaCentang ? '#7c3aed' : 'transparent', color: 'white',
            }}>
              {!modeTinjau && siswaCentang ? '✓' : ''}
            </span>
            <span style={{ fontWeight: 700, color: '#64748b', width: 18, flexShrink: 0 }}>{huruf}.</span>
            <span style={{ flex: 1 }}>{teksOpsi}</span>
            {modeTinjau && ikon && <span style={{ fontSize: 14 }}>{ikon}</span>}
          </button>
        );
      })}
    </div>
  );
}