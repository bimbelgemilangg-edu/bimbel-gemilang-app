// src/components/guru/TombolAkhiri.jsx
// ============================================================
// TOMBOL BERBAHAYA DUA LANGKAH (Turn 96 —(owner: guru pernah kepencet
// "akhiri" saat siswa masih mengerjakan). Klik pertama = ARM
// (tombol berubah jadi peringatan berisi detail + hitung mundur 5
// detik); klik kedua dalam jendela itu = eksekusi. Lewat 5 detik
// tombol kembali normal sendiri -> tidak bisa kepencet saat presentasi.
// ============================================================
import React, { useEffect, useState } from 'react';

export default function TombolAkhiri({
  label, detail = '', onConfirm, kecil = false,
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const t = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => {
        if (!armed) { setArmed(true); return; }
        setArmed(false);
        onConfirm();
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 7, cursor: 'pointer', fontFamily: 'inherit',
        borderRadius: 12, padding: kecil ? '7px 12px' : '10px 16px',
        fontSize: kecil ? 11.5 : 12.5, fontWeight: 900,
        border: armed ? '2px solid #B91C1C' : '1.5px solid #FCA5A5',
        background: armed ? '#DC2626' : '#FEF2F2',
        color: armed ? '#fff' : '#B91C1C',
        boxShadow: armed ? '0 0 0 4px rgba(220,38,38,.18)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      {armed
        ? `⚠️ ${detail ? detail + ' — ' : ''}KLIK LAGI UNTUK YAKIN (5 dtk)`
        : label}
    </button>
  );
}
