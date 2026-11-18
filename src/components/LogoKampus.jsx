// src/components/LogoKampus.jsx
// ============================================================
// Komponen Logo Kampus Bulletproof Anti-Glitch
// 1. Memuat logo resmi PTN Indonesia 1:1 AmbisPTN CDN.
// 2. Jika gambar gagal / timeout / offline, otomatis bertransformasi
//    menjadi Badge Monogram Emerald elegan (tanpa icon broken image & teks tumpang tindih).
// 3. alt="" mencegah glitch browser merender teks rusak.
// 4. referrerPolicy="no-referrer" mencegah pemblokiran hotlinking (403).
// ============================================================
import React, { useState, useEffect } from 'react';
import { getLogoPtn, getMonogramPtn } from '../utils/logoPtnHelper';

export default function LogoKampus({
  ptn,
  size = 44,
  radius = 10,
  style = {},
  className = '',
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = getLogoPtn(ptn);
  const monogram = getMonogramPtn(ptn);

  // Reset status jika ptn / logo berganti
  useEffect(() => {
    setImgFailed(false);
  }, [logoUrl]);

  const titleText = (typeof ptn === 'object' && ptn) ? (ptn.name || ptn.nama || ptn.short_name || monogram.inisial) : monogram.inisial;

  if (!logoUrl || imgFailed) {
    const fontSize = Math.max(
      9,
      Math.floor(size * (monogram.inisial.length > 5 ? 0.22 : monogram.inisial.length > 3 ? 0.28 : 0.36))
    );

    return (
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: radius,
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize,
          letterSpacing: '0.4px',
          boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          userSelect: 'none',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: 2,
          boxSizing: 'border-box',
          flexShrink: 0,
          lineHeight: 1,
          ...style,
        }}
        className={className}
        title={titleText}
      >
        {monogram.inisial}
      </div>
    );
  }

  const paddingVal = Math.max(2, Math.floor(size * 0.08));

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: radius,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: paddingVal,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        boxSizing: 'border-box',
        flexShrink: 0,
        position: 'relative',
        ...style,
      }}
      className={className}
      title={titleText}
    >
      <img
        src={logoUrl}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}

export { LogoKampus };
