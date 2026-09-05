// src/pages/student/tryout/RingkasanPelanggaran.jsx
// ============================================================
// Ditampilkan di layar HASIL Try Out -- daftar pelanggaran yang
// kedeteksi selama pengerjaan + berapa XP yang kepotong gara-gara itu.
// Transparan ke siswa (bukan cuma potongan diam-diam) supaya dia tahu
// PERSIS kenapa XP-nya lebih kecil dari yang diharapkan.
// ============================================================

import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { LABEL_PELANGGARAN, hitungPotonganXP } from '../../../utils/potonganXPTryOut';

export default function RingkasanPelanggaran({ pelanggaran, jumlahFotoTersimpan, fotoPengawasan = [], xpMentah, xpFinal }) {
  const { totalPoin, persenPotongan } = hitungPotonganXP(pelanggaran);

  if (pelanggaran.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: '#166534', marginBottom: 16 }}>
        <CheckCircle2 size={18} />
        <span>Tidak ada pelanggaran terdeteksi selama try out ini. XP penuh, kerja bagus!</span>
      </div>
    );
  }

  // Kelompokkan per jenis, biar gak nampilin 5 baris "Pindah tab" satu-satu.
  const kelompok = {};
  pelanggaran.forEach((p) => { kelompok[p.type] = (kelompok[p.type] || 0) + 1; });

  return (
    // 🔥 BARU: dikemas jadi 1 kartu rapi (rounded, shadow lembut) --
    // bukan kotak merah alarm mentah kayak sebelumnya. Ini ditaruh DI
    // BAWAH Lencana Pencapaian di layar hasil, jadi harus tetap enak
    // dilihat kalau seandainya ke-screenshot bareng lencananya, bukan
    // bikin tampilan jadi berantakan/serem.
    <div style={{ background: 'white', border: '1px solid #fecaca', borderRadius: 16, padding: '16px 18px', marginBottom: 16, textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13, color: '#b91c1c', marginBottom: 10 }}>
        <ShieldAlert size={18} /> {pelanggaran.length} pelanggaran terdeteksi
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {Object.entries(kelompok).map(([type, jumlah]) => (
          <div key={type} style={{ fontSize: 12, color: '#7f1d1d', display: 'flex', justifyContent: 'space-between' }}>
            <span>{LABEL_PELANGGARAN[type] || type}</span>
            <span style={{ fontWeight: 700 }}>{jumlah}x</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#7f1d1d', borderTop: '1px solid #fecaca', paddingTop: 8 }}>
        Total {totalPoin} poin pelanggaran → XP dipotong <strong>{Math.round(persenPotongan * 100)}%</strong>
        {typeof xpMentah === 'number' && typeof xpFinal === 'number' && (
          <> ({xpMentah} XP → <strong>{xpFinal} XP</strong>)</>
        )}
      </div>

      {/* 🔥 BARU: foto pengawasan ditampilkan LANGSUNG dalam bingkai
          kecil rapi (bukan cuma angka "sekian foto tersimpan" doang) --
          siswa juga berhak tau persis foto apa yang kesimpen dari
          dirinya sendiri, bukan cuma admin yang bisa lihat. */}
      {fotoPengawasan.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid #fecaca', paddingTop: 12 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
            📷 {fotoPengawasan.length} foto pengawasan tersimpan (buat ditinjau admin/wali kelas kalau perlu):
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {fotoPengawasan.map((url, i) => (
              <div key={i} style={{ padding: 4, background: 'white', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <img
                  src={url}
                  alt={`Foto pengawasan ${i + 1}`}
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}