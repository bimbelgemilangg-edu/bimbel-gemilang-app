// src/components/buku/FlipbookBukuPdf.jsx
// ============================================================
// FLIPBOOK BUKU PDF GEMILANG — UX "membalik kertas buku asli"
// (20 Okt 2026, permintaan owner): animasi putar halaman 3D ringan +
// bayangan lipatan + MODE PENUH SATU LAYAR HP (fixed inset, chrome
// aplikasi minggir). Navigasi: tombol, panah keyboard, usap sentuh.
// Mode siswa melewatkan halaman pembahasan; mode guru membuka penuh.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { bukaPdf, renderHalamanKeCanvas } from '../../utils/modulPdf';
import { daftarHalamanSiswa, labelModeBaca } from '../../utils/bukuPdfFlip';

const GAYA_FLIP = `
@keyframes fbBalikKanan { 0% { transform: perspective(1400px) rotateY(0deg); } 45% { transform: perspective(1400px) rotateY(-14deg) translateX(-6px); } 100% { transform: perspective(1400px) rotateY(0deg); } }
@keyframes fbBalikKiri { 0% { transform: perspective(1400px) rotateY(0deg); } 45% { transform: perspective(1400px) rotateY(14deg) translateX(6px); } 100% { transform: perspective(1400px) rotateY(0deg); } }
@keyframes fbLipatan { 0% { opacity: 0; } 35% { opacity: 1; } 100% { opacity: 0; } }
.fbHalaman { transform-origin: left center; will-change: transform; }
.fbHalaman.fbNext { animation: fbBalikKanan 380ms ease; }
.fbHalaman.fbPrev { animation: fbBalikKiri 380ms ease; }
.fbLipatanKanan { position: absolute; top: 0; bottom: 0; right: 0; width: 46px; pointer-events: none;
  background: linear-gradient(to left, rgba(0,0,0,0.28), rgba(0,0,0,0.0) 70%); opacity: 0; }
.fbHalaman.fbNext ~ .fbLipatanKanan, .fbWrap.fbNext .fbLipatanKanan { animation: fbLipatan 380ms ease; }
.fbWrap.fbPrev .fbLipatanKiri { animation: fbLipatan 380ms ease; }
.fbLipatanKiri { position: absolute; top: 0; bottom: 0; left: 0; width: 46px; pointer-events: none;
  background: linear-gradient(to right, rgba(0,0,0,0.28), rgba(0,0,0,0.0) 70%); opacity: 0; }
`;

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
  const [penuh, setPenuh] = useState(false);
  const [anim, setAnim] = useState('');

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
        await renderHalamanKeCanvas(pdf, nomor, { canvas, maxLebar: penuh ? 1600 : 1500 });
        if (hidup) setPesan('');
      } catch (e) {
        if (hidup) setPesan(`Gagal merender halaman ${nomor}: ${e?.message || e}`);
      }
    })();
    return () => { hidup = false; };
  }, [idx, status, daftarHal, penuh]);

  const balik = (arah) => {
    setIdx((i) => {
      const t = Math.max(0, Math.min(daftarHal.length - 1, i + arah));
      if (t !== i) {
        setAnim(arah > 0 ? 'fbNext' : 'fbPrev');
        setTimeout(() => setAnim(''), 400);
      }
      return t;
    });
  };

  useEffect(() => {
    const kunci = (e) => {
      if (e.key === 'ArrowRight') balik(1);
      if (e.key === 'ArrowLeft') balik(-1);
      if (e.key === 'Escape') setPenuh(false);
    };
    window.addEventListener('keydown', kunci);
    return () => window.removeEventListener('keydown', kunci);
  }, [daftarHal.length]);

  const kulit = penuh
    ? { position: 'fixed', inset: 0, zIndex: 1500, borderRadius: 0, padding: '8px 8px calc(8px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }
    : { borderRadius: 14, padding: 10, position: 'relative' };

  return (
    <div style={{ ...kulit, background: penuh ? '#0c0a09' : '#52525b' }}>
      <style>{GAYA_FLIP}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: mode === 'guru' ? '#fbbf24' : '#a7f3d0', background: mode === 'guru' ? '#78350f' : '#064e3b', borderRadius: 999, padding: '4px 10px' }}>
          {labelModeBaca(mode)}
        </span>
        <span style={{ fontSize: 11.5, color: '#e4e4e7', fontWeight: 700 }}>
          {status === 'siap' ? `hal ${daftarHal[idx] || '-'} · lembar ${idx + 1}/${daftarHal.length}` : 'memuat buku…'}
        </span>
        <button
          type="button"
          onClick={() => setPenuh((v) => !v)}
          style={{ border: 'none', background: '#27272a', color: '#e4e4e7', borderRadius: 8, padding: '6px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' }}
        >
          {penuh ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {penuh ? 'kecilkan' : 'layar penuh'}
        </button>
      </div>
      <div
        className={`fbWrap ${anim}`}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', touchAction: 'pan-y', minHeight: penuh ? 0 : 320, overflow: 'hidden' }}
        onTouchStart={(e) => { sentuhX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (sentuhX.current === null) return;
          const dx = e.changedTouches[0].clientX - sentuhX.current;
          if (Math.abs(dx) > 42) balik(dx < 0 ? 1 : -1);
          sentuhX.current = null;
        }}
      >
        {status === 'memuat' && <Loader2 className="animate-spin" size={28} color="#e4e4e7" />}
        {status === 'gagal' && <div style={{ color: '#fca5a5', fontSize: 12.5 }}>Gagal memuat PDF: {pesan}</div>}
        <div className={`fbHalaman ${anim}`} style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
          <canvas
            ref={canvasRef}
            style={{ maxWidth: penuh ? '100vw' : '100%', maxHeight: penuh ? 'calc(100vh - 120px)' : '72vh', height: 'auto', borderRadius: 4, boxShadow: '0 10px 34px rgba(0,0,0,0.5)', background: '#fff', display: status === 'siap' ? 'block' : 'none' }}
          />
          <div className="fbLipatanKanan" aria-hidden="true" />
          <div className="fbLipatanKiri" aria-hidden="true" />
        </div>
      </div>
      {status === 'siap' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
          <button type="button" onClick={() => balik(-1)} disabled={idx === 0} style={{ border: 'none', background: idx === 0 ? '#3f3f46' : '#f97316', color: '#fff', borderRadius: 999, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === 0 ? 'not-allowed' : 'pointer', flexShrink: 0 }} aria-label="halaman sebelumnya">
            <ChevronLeft size={22} />
          </button>
          <span style={{ fontSize: 10.5, color: '#a1a1aa', textAlign: 'center' }}>usap / panah keyboard / tombol untuk membalik halaman</span>
          <button type="button" onClick={() => balik(1)} disabled={idx >= daftarHal.length - 1} style={{ border: 'none', background: idx >= daftarHal.length - 1 ? '#3f3f46' : '#f97316', color: '#fff', borderRadius: 999, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx >= daftarHal.length - 1 ? 'not-allowed' : 'pointer', flexShrink: 0 }} aria-label="halaman berikutnya">
            <ChevronRight size={22} />
          </button>
        </div>
      )}
      {pesan && status === 'siap' && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 6 }}>{pesan}</div>}
    </div>
  );
}
