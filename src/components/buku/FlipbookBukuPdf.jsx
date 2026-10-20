// src/components/buku/FlipbookBukuPdf.jsx
// ============================================================
// FLIPBOOK BUKU PDF GEMILANG (20 Okt 2026): pengalaman "buku konvensional
// yang bisa dibalik" — render halaman PDF ke canvas (pdfjs via modulPdf),
// navigasi tombol / panah keyboard / swipe sentuh. Mode siswa melewatkan
// halaman pembahasan (daftarHalamanSiswa); mode guru membuka semua dengan
// badge peringatan.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { bukaPdf, renderHalamanKeCanvas } from '../../utils/modulPdf';
import { daftarHalamanSiswa, labelModeBaca } from '../../utils/bukuPdfFlip';

export default function FlipbookBukuPdf({ buku, mode = 'siswa' }) {
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const sentuhX = useRef(null);
  const [daftarHal] = useState(() => (mode === 'guru'
    ? Array.from({ length: buku?.totalHalaman || 0 }, (_, i) => i + 1)
    : daftarHalamanSiswa(buku?.totalHalaman, buku?.rangePembahasan)));
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState('memuat');
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        setStatus('memuat');
        const pdf = await bukaPdf(buku.url);
        if (!hidup) return;
        pdfRef.current = pdf;
        setStatus('siap');
      } catch (e) {
        if (hidup) { setStatus('gagal'); setPesan(String(e?.message || e)); }
      }
    })();
    return () => { hidup = false; };
  }, [buku.url]);

  useEffect(() => {
    let hidup = true;
    (async () => {
      const pdf = pdfRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas || status !== 'siap') return;
      const nomor = daftarHal[idx];
      if (!nomor) return;
      try {
        await renderHalamanKeCanvas(pdf, nomor, { canvas, maxLebar: 1500 });
        if (hidup) setPesan('');
      } catch (e) {
        if (hidup) setPesan(`Gagal merender halaman ${nomor}: ${e?.message || e}`);
      }
    })();
    return () => { hidup = false; };
  }, [idx, status, daftarHal]);

  useEffect(() => {
    const kunci = (e) => {
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(daftarHal.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', kunci);
    return () => window.removeEventListener('keydown', kunci);
  }, [daftarHal.length]);

  const balik = (arah) => setIdx((i) => Math.max(0, Math.min(daftarHal.length - 1, i + arah)));

  return (
    <div style={{ background: '#52525b', borderRadius: 14, padding: 10, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: mode === 'guru' ? '#fbbf24' : '#a7f3d0', background: mode === 'guru' ? '#78350f' : '#064e3b', borderRadius: 999, padding: '4px 10px' }}>
          {labelModeBaca(mode)}
        </span>
        <span style={{ fontSize: 11.5, color: '#e4e4e7', fontWeight: 700 }}>
          {status === 'siap' ? `Halaman ${daftarHal[idx] || '-'} · lembar ke-${idx + 1}/${daftarHal.length}` : 'memuat buku…'}
        </span>
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, touchAction: 'pan-y' }}
        onTouchStart={(e) => { sentuhX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (sentuhX.current === null) return;
          const dx = e.changedTouches[0].clientX - sentuhX.current;
          if (Math.abs(dx) > 45) balik(dx < 0 ? 1 : -1);
          sentuhX.current = null;
        }}
      >
        {status === 'memuat' && <Loader2 className="animate-spin" size={28} color="#e4e4e7" />}
        {status === 'gagal' && <div style={{ color: '#fca5a5', fontSize: 12.5 }}>Gagal memuat PDF: {pesan}</div>}
        <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', borderRadius: 6, boxShadow: '0 8px 30px rgba(0,0,0,0.45)', background: '#fff', display: status === 'siap' ? 'block' : 'none' }} />
      </div>
      {status === 'siap' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <button type="button" onClick={() => balik(-1)} disabled={idx === 0} style={{ border: 'none', background: idx === 0 ? '#71717a' : '#f97316', color: '#fff', borderRadius: 999, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === 0 ? 'not-allowed' : 'pointer' }} aria-label="halaman sebelumnya">
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 11, color: '#d4d4d8' }}>balik halaman: tombol, panah keyboard, atau usap kiri/kanan</span>
          <button type="button" onClick={() => balik(1)} disabled={idx >= daftarHal.length - 1} style={{ border: 'none', background: idx >= daftarHal.length - 1 ? '#71717a' : '#f97316', color: '#fff', borderRadius: 999, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx >= daftarHal.length - 1 ? 'not-allowed' : 'pointer' }} aria-label="halaman berikutnya">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
      {pesan && status === 'siap' && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 6 }}>{pesan}</div>}
    </div>
  );
}
