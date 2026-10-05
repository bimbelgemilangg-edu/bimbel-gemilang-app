// src/components/LihatGambar.jsx
// ============================================================
// LIGHTBOX gambar tanpa dependensi: overlay gelap + gambar ukuran penuh.
//
// KENAPA ADA (permintaan owner 2026-10-05, saat mencoba halaman pantau
// try out sebagai tentor): "bisa gak guru klik gambarnya biar jelas".
// Gambar soal dirender kecil (maxWidth 200px) dan gambar opsi lebih kecil
// lagi (160px) -- cukup untuk mengenali, TIDAK cukup untuk membaca label
// diagram atau tulisan tangan. Foto jawaban esai justru yang paling
// butuh: tentor menilai dari foto tulisan siswa, dan di 160px itu
// tidak terbaca.
//
// Dipakai lewat satu prop opsional `onKlikGambar` yang dilewatkan ke
// renderer soal (RendererPgSederhana/PgKompleks/Esai). Kalau propnya
// tidak diberikan, renderer berperilaku PERSIS seperti sebelumnya --
// jadi halaman siswa tidak berubah tanpa diminta.
//
// Sengaja tanpa library: repo ini sudah membawa 30+ dependensi dan
// build-nya boros memori; overlay 40 baris tidak layak menambah satu.
// ============================================================

import { useEffect } from 'react';

/**
 * @param {string}   src      URL gambar yang diperbesar
 * @param {string}   [alt]    teks alternatif
 * @param {string}   [caption] keterangan kecil di bawah gambar
 * @param {Function} onClose  dipanggil saat pengguna menutup
 */
export default function LihatGambar({ src, alt = 'Gambar diperbesar', caption = '', onClose }) {
  // Esc sebagai jalan keluar kedua, selain klik. Kebiasaan yang sudah
  // dipahami guru maupun siswa dari modal mana pun.
  useEffect(() => {
    const saatTombol = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', saatTombol);
    return () => window.removeEventListener('keydown', saatTombol);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(2, 6, 23, 0.86)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        cursor: 'zoom-out',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: '94vw',
          maxHeight: '84vh',
          borderRadius: 10,
          background: 'white',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.55)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#e2e8f0', fontSize: 12 }}>
        {caption && <span style={{ maxWidth: '70vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caption}</span>}
        <span style={{ opacity: 0.75 }}>Klik di mana saja atau tekan Esc untuk menutup</span>
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid #475569',
            background: '#0f172a', color: '#e2e8f0', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ✕ Tutup
        </button>
      </div>
    </div>
  );
}
