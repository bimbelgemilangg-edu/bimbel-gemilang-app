// src/components/MaskotAstronot.jsx
// ============================================================
// "Master G" -- maskot resmi Bimbel Gemilang. Versi ini PAKAI GAMBAR
// ASLI (file yang dikasih user, background-nya udah dibersihin jadi
// transparan) -- BUKAN ilustrasi SVG buatan lagi. Ini paling akurat
// & paling cepat, dibanding coba nebak-nebak bikin ulang lewat kode.
//
// PENTING: taruh file gambarnya di src/assets/master-g.png (nama file
// harus PERSIS itu, atau sesuaikan path import di bawah).
// ============================================================

import React from 'react';
import MasterG from '../assets/master-g.png';

export default function MaskotAstronot({ size = 100, mengambang = true }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <style>{`
        @keyframes maskotMengambang {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,46,204,0.15) 0%, transparent 70%)',
      }} />
      <img
        src={MasterG}
        alt="Master G"
        style={{
          position: 'relative', width: '100%', height: '100%', objectFit: 'contain',
          animation: mengambang ? 'maskotMengambang 3.2s ease-in-out infinite' : 'none',
        }}
      />
      <span style={{ position: 'absolute', top: -2, left: -8, fontSize: size * 0.14 }}>✨</span>
      <span style={{ position: 'absolute', bottom: 4, right: -10, fontSize: size * 0.12 }}>⭐</span>
    </div>
  );
}