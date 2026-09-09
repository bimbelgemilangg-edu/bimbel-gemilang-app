// src/components/MaskotAstronot.jsx
// ============================================================
// "Master G" -- maskot resmi Bimbel Gemilang.
//
// 🔥 BUG PALING SERIUS DITEMUKAN & DIBENERIN: sebelumnya file gambar
// di-`import` dari src/assets/master-g.png. Cara import kayak gitu
// diproses sama Vite SAAT BUILD -- kalau filenya gak ketemu, BUKAN
// cuma gambarnya doang yang rusak, tapi SELURUH BUILD APLIKASI GAGAL
// TOTAL (persis error yang berkali-kali kejadian kemarin). Sekarang
// gambarnya dipindah ke folder `public/` dan dipanggil pakai PATH
// STRING BIASA (bukan import) -- file di public/ TIDAK diproses Vite
// sama sekali, jadi kalaupun filenya kelewat/gak ada, BUILD TETAP
// JALAN NORMAL (cuma gambar itu doang yang gak muncul, ketangkep
// sama fallback emoji di bawah -- gak akan pernah bikin APLIKASI
// GAGAL DEPLOY lagi).
//
// PENTING: taruh file gambarnya di public/master-g.png (BUKAN lagi
// di src/assets/) -- persis di folder `public` yang sejajar sama
// `src`, bukan di dalam src sama sekali.
// ============================================================

import React, { useState } from 'react';

const MasterG = '/master-g.png'; // path public -- BUKAN import dari src/assets

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