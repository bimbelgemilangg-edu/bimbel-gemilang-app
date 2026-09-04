// src/components/LencanaPencapaian.jsx
// ============================================================
// Kartu "lencana pencapaian" -- didesain SENGAJA menarik & branded,
// karena tujuannya BUKAN cuma kasih tau angka, tapi bikin siswa MAU
// screenshot & posting ke status mereka sendiri (promosi organik buat
// Bimbel Gemilang, gratis, dari mulut siswa sendiri).
//
// 3 varian:
//   - tipe="streak"  -> lencana api, buat streak harian (Latihan Harian)
//   - tipe="skor"    -> lencana trofi, buat hasil Try Out
//   - tipe="level"   -> lencana bintang, buat naik Level
//
// Animasinya CSS murni (gak pakai library animasi tambahan) --
// api berputar goyang + menyala (glow pulsing), biar terasa "hidup"
// kayak video pencapaian di TikTok/game, bukan gambar statis.
// ============================================================

import React from 'react';

const GRADIEN = {
  streak: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 50%, #7C2D12 100%)',
  skor: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 50%, #1E1B4B 100%)',
  level: 'linear-gradient(135deg, #06B6D4 0%, #7C3AED 60%, #4C1D95 100%)',
};

const IKON = { streak: '🔥', skor: '🏆', level: '⭐' };

export default function LencanaPencapaian({ tipe = 'streak', nilai, namaSiswa, xp, keterangan }) {
  const judul = {
    streak: `${nilai} Hari Beruntun!`,
    skor: `Skor ${nilai}%`,
    level: `Level ${nilai} Tercapai!`,
  }[tipe];

  return (
    <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', padding: '28px 20px', textAlign: 'center', background: GRADIEN[tipe], boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}>
      <style>{`
        @keyframes lencanaGoyangApi {
          0%, 100% { transform: rotate(-6deg) scale(1); }
          50% { transform: rotate(6deg) scale(1.08); }
        }
        @keyframes lencanaGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(255,200,0,0.5)); }
          50% { filter: drop-shadow(0 0 22px rgba(255,160,0,0.9)); }
        }
        @keyframes lencanaKilau {
          0% { transform: translateX(-120%) rotate(20deg); }
          100% { transform: translateX(220%) rotate(20deg); }
        }
        @keyframes lencanaMuncul {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Kilau yang lewat sekali di belakang kartu -- efek "premium badge" */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
        animation: 'lencanaKilau 2.2s ease-in-out 1',
      }} />
      {/* Starfield kecil biar konsisten sama tema "Misi Harian" astronot */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, white, transparent), radial-gradient(1.5px 1.5px at 70% 20%, white, transparent), radial-gradient(1px 1px at 40% 80%, white, transparent), radial-gradient(1.5px 1.5px at 85% 65%, white, transparent), radial-gradient(1px 1px at 10% 70%, white, transparent)',
      }} />

      <div style={{ position: 'relative', animation: 'lencanaMuncul 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <div style={{ fontSize: 62, marginBottom: 6, display: 'inline-block', animation: 'lencanaGoyangApi 1.4s ease-in-out infinite, lencanaGlow 1.4s ease-in-out infinite' }}>
          {IKON[tipe]}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.3)', marginBottom: 4 }}>
          {judul}
        </div>
        {namaSiswa && (
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>{namaSiswa}</div>
        )}
        {keterangan && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>{keterangan}</div>
        )}
        {typeof xp === 'number' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', borderRadius: 999, padding: '5px 16px', fontSize: 13, fontWeight: 800, color: 'white', marginBottom: 14 }}>
            🚀 +{xp} XP
          </div>
        )}

        {/* Branding -- ini yang bikin screenshot-nya jadi promosi gratis */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: 'white', letterSpacing: 0.5 }}>✨ BIMBEL GEMILANG</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Belajar makin seru, makin gemilang 🚀</div>
        </div>
      </div>
    </div>
  );
}