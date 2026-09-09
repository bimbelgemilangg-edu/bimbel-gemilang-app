// src/components/MaskotAstronot.jsx
// ============================================================
// "Master G" -- maskot resmi Bimbel Gemilang.
//
// 🔥 BUG SERIUS DITEMUKAN & DIBENERIN: sebelumnya kalau file gambar
// `src/assets/master-g.png` BELUM DITARUH di project (atau gagal
// dimuat karena alasan apapun -- koneksi lambat, dll), yang muncul ke
// siswa itu ICON GAMBAR RUSAK bawaan browser -- keliatan berantakan,
// dan di HP jadul bisa nge-lag nunggu proses gagal-muatnya. Sekarang
// ada fallback: kalau gambar gagal dimuat, otomatis ganti ke maskot
// darurat berbasis emoji (ringan banget, gak pernah gagal muat sama
// sekali) -- SISWA GAK AKAN PERNAH LIHAT GAMBAR RUSAK LAGI.
// ============================================================

import React, { useState } from 'react';
import MasterG from '../assets/master-g.png';

export default function MaskotAstronot({ size = 100, mengambang = true }) {
  // Kalau <img> gagal dimuat (file gak ada di server, koneksi
  // putus, dll), onError bikin komponen ini pindah ke mode fallback --
  // ini JAUH lebih ringan buat HP jadul (cuma teks emoji, 0 request
  // jaringan tambahan) dibanding nunggu browser berkali-kali nyoba
  // muat gambar yang emang gak akan pernah berhasil.
  const [gagalMuat, setGagalMuat] = useState(false);

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
      {gagalMuat ? (
        // Fallback darurat -- ringan, gak pernah gagal, tetap ada
        // "karakter" biar gak kosong sama sekali.
        <div style={{
          position: 'relative', width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55,
          animation: mengambang ? 'maskotMengambang 3.2s ease-in-out infinite' : 'none',
        }}>
          🧑‍🚀
        </div>
      ) : (
        <img
          src={MasterG}
          alt="Master G"
          width={size}
          height={size}
          loading="eager"
          onError={() => setGagalMuat(true)}
          style={{
            position: 'relative', width: '100%', height: '100%', objectFit: 'contain',
            animation: mengambang ? 'maskotMengambang 3.2s ease-in-out infinite' : 'none',
          }}
        />
      )}
      <span style={{ position: 'absolute', top: -2, left: -8, fontSize: size * 0.14 }}>✨</span>
      <span style={{ position: 'absolute', bottom: 4, right: -10, fontSize: size * 0.12 }}>⭐</span>
    </div>
  );
}