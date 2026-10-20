// src/components/buku/FlipbookBukuPdf.jsx
// ============================================================
// FLIPBOOK BUKU PDF GEMILANG v3 (20 Okt 2026, permintaan owner):
//  • ZOOM halaman (tombol + / − / reset) dengan wadah scroll;
//  • UI BERSIH: badge & kalimat panjang dibuang (cukup penghitung
//    halaman kecil);
//  • animasi balik kertas 3D + bayangan lipatan + layar penuh HP;
//  • SISWA bisa MENYOROT (highlight) bagian halaman: seret saat mode
//    sorot aktif; tersimpan per siswa per buku di Firestore
//    `buku_pdf_coretan` (koordinat normalisasi, tahan layar);
//  • batas halaman siswa (materi belum diajarkan dikunci tentor)
//    dihormati: daftarHalamanSiswa(total Efektif, rangePembahasan).
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut, Highlighter, Eraser } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { bukaPdf, renderHalamanKeCanvas } from '../../utils/modulPdf';
import { daftarHalamanSiswa } from '../../utils/bukuPdfFlip';

const GAYA_FLIP = `
@keyframes fbBalikKanan { 0% { transform: perspective(1400px) rotateY(0deg); } 45% { transform: perspective(1400px) rotateY(-14deg) translateX(-6px); } 100% { transform: perspective(1400px) rotateY(0deg); } }
@keyframes fbBalikKiri { 0% { transform: perspective(1400px) rotateY(0deg); } 45% { transform: perspective(1400px) rotateY(14deg) translateX(6px); } 100% { transform: perspective(1400px) rotateY(0deg); } }
@keyframes fbLipatan { 0% { opacity: 0; } 35% { opacity: 1; } 100% { opacity: 0; } }
.fbHalaman { transform-origin: left center; will-change: transform; position: relative; }
.fbHalaman.fbNext { animation: fbBalikKanan 380ms ease; }
.fbHalaman.fbPrev { animation: fbBalikKiri 380ms ease; }
.fbLipatanKanan { position: absolute; top: 0; bottom: 0; right: 0; width: 46px; pointer-events: none;
  background: linear-gradient(to left, rgba(0,0,0,0.28), rgba(0,0,0,0) 70%); opacity: 0; }
.fbLipatanKiri { position: absolute; top: 0; bottom: 0; left: 0; width: 46px; pointer-events: none;
  background: linear-gradient(to right, rgba(0,0,0,0.28), rgba(0,0,0,0) 70%); opacity: 0; }
.fbWrap.fbNext .fbLipatanKanan { animation: fbLipatan 380ms ease; }
.fbWrap.fbPrev .fbLipatanKiri { animation: fbLipatan 380ms ease; }
`;

const ZOOM_LANGKAH = [1, 1.4, 1.9, 2.6];

export default function FlipbookBukuPdf({ buku, mode = 'siswa', coretanId = '' }) {
  const canvasRef = useRef(null);
  const wadahRef = useRef(null);
  const pdfRef = useRef(null);
  const sentuhX = useRef(null);
  const dragRef = useRef(null);
  const batas = Number(buku?.batasHalamanSiswa || 0) || Number(buku?.totalHalaman || 0);
  const [daftarHal] = useState(() => (mode === 'guru'
    ? Array.from({ length: buku?.totalHalaman || 0 }, (_, i) => i + 1)
    : daftarHalamanSiswa(batas, buku?.rangePembahasan)));
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState('memuat');
  const [pesan, setPesan] = useState('');
  const [penuh, setPenuh] = useState(false);
  const [zoom, setZoom] = useState(0); // indeks ZOOM_LANGKAH
  const [anim, setAnim] = useState('');
  const [modeSorot, setModeSorot] = useState(false);
  const [coretan, setCoretan] = useState({}); // { [halaman]: [rect] }

  const docCoretan = coretanId ? doc(db, 'buku_pdf_coretan', coretanId) : null;
  useEffect(() => {
    if (!docCoretan) return;
    let hidup = true;
    getDoc(docCoretan).then((sn) => { if (hidup && sn.exists()) setCoretan(sn.data() || {}); }).catch(() => {});
    return () => { hidup = false; };
  }, [coretanId]);

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
        await renderHalamanKeCanvas(pdf, nomor, { canvas, maxLebar: 1600 });
        if (hidup) setPesan('');
      } catch (_e) {
        if (hidup) setPesan(`Gagal merender halaman ${nomor}.`);
      }
    })();
    return () => { hidup = false; };
  }, [idx, status, daftarHal]);

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

  // ---- sorotan siswa ----
  const halamanKini = daftarHal[idx];
  const rectKini = coretan[`h${halamanKini}`] || [];
  const mulaiSorot = (e) => {
    if (!modeSorot || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
  };
  const selesaiSorot = (e) => {
    if (!modeSorot || !dragRef.current || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x2 = (e.clientX - r.left) / r.width;
    const y2 = (e.clientY - r.top) / r.height;
    const a = dragRef.current;
    dragRef.current = null;
    const rect = {
      x: Math.min(a.x, x2), y: Math.min(a.y, y2),
      w: Math.abs(x2 - a.x), h: Math.abs(y2 - a.y),
    };
    if (rect.w < 0.02 || rect.h < 0.015) return;
    const baru = { ...coretan, [`h${halamanKini}`]: [...rectKini, rect] };
    setCoretan(baru);
    if (docCoretan) setDoc(docCoretan, baru, { merge: true }).catch(() => {});
  };
  const hapusSorotHalaman = () => {
    const baru = { ...coretan, [`h${halamanKini}`]: [] };
    setCoretan(baru);
    if (docCoretan) setDoc(docCoretan, baru, { merge: true }).catch(() => {});
  };

  const skala = ZOOM_LANGKAH[zoom];
  const kulit = penuh
    ? { position: 'fixed', inset: 0, zIndex: 1500, borderRadius: 0, padding: '6px 6px calc(6px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', background: '#0c0a09' }
    : { borderRadius: 14, padding: 10, position: 'relative', background: '#52525b' };

  const tombolKecil = (aktif) => ({
    border: 'none', background: aktif ? '#f97316' : '#27272a', color: '#e4e4e7',
    borderRadius: 8, padding: '6px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', gap: 5, alignItems: 'center',
  });

  return (
    <div style={kulit}>
      <style>{GAYA_FLIP}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#d4d4d8', fontWeight: 700 }}>
          {status === 'siap' ? `${idx + 1}/${daftarHal.length}` : 'memuat…'}
        </span>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button type="button" style={tombolKecil(false)} onClick={() => setZoom((z) => Math.max(0, z - 1))} aria-label="perkeil"><ZoomOut size={14} /></button>
          <button type="button" style={tombolKecil(false)} onClick={() => setZoom((z) => Math.min(ZOOM_LANGKAH.length - 1, z + 1))} aria-label="perbesar"><ZoomIn size={14} /></button>
          {zoom > 0 && <button type="button" style={tombolKecil(false)} onClick={() => setZoom(0)}>reset</button>}
          {mode === 'siswa' && coretanId && (
            <button type="button" style={tombolKecil(modeSorot)} onClick={() => setModeSorot((v) => !v)}><Highlighter size={14} /> sorot</button>
          )}
          {mode === 'siswa' && modeSorot && rectKini.length > 0 && (
            <button type="button" style={tombolKecil(false)} onClick={hapusSorotHalaman}><Eraser size={14} /> hapus sorot hal ini</button>
          )}
          <button type="button" style={tombolKecil(false)} onClick={() => setPenuh((v) => !v)}>
            {penuh ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
      <div
        ref={wadahRef}
        className={`fbWrap ${anim}`}
        style={{ flex: 1, display: 'flex', alignItems: zoom > 0 ? 'flex-start' : 'center', justifyContent: zoom > 0 ? 'flex-start' : 'center', position: 'relative', touchAction: modeSorot ? 'none' : 'pan-y', minHeight: penuh ? 0 : 300, overflow: 'auto', overscrollBehavior: 'contain' }}
        onTouchStart={(e) => { sentuhX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (modeSorot) return;
          if (sentuhX.current === null) return;
          const dx = e.changedTouches[0].clientX - sentuhX.current;
          if (Math.abs(dx) > 42) balik(dx < 0 ? 1 : -1);
          sentuhX.current = null;
        }}
      >
        {status === 'memuat' && <Loader2 className="animate-spin" size={28} color="#e4e4e7" />}
        {status === 'gagal' && <div style={{ color: '#fca5a5', fontSize: 12.5 }}>Gagal memuat PDF.</div>}
        <div className={`fbHalaman ${anim}`} style={{ position: 'relative', flexShrink: 0, width: `${100 * skala}%`, maxWidth: 'none' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', borderRadius: 4, boxShadow: '0 10px 34px rgba(0,0,0,0.5)', background: '#fff', display: status === 'siap' ? 'block' : 'none' }}
          />
          {status === 'siap' && (
            <div
              style={{ position: 'absolute', inset: 0, cursor: modeSorot ? 'crosshair' : 'default' }}
              onPointerDown={mulaiSorot}
              onPointerUp={selesaiSorot}
            >
              {rectKini.map((r, ri) => (
                <div
                  key={ri}
                  style={{
                    position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`,
                    width: `${r.w * 100}%`, height: `${r.h * 100}%`,
                    background: 'rgba(250, 204, 21, 0.35)', border: '1px solid rgba(202, 138, 4, 0.55)',
                    pointerEvents: 'none', borderRadius: 2,
                  }}
                />
              ))}
            </div>
          )}
          <div className="fbLipatanKanan" aria-hidden="true" />
          <div className="fbLipatanKiri" aria-hidden="true" />
        </div>
      </div>
      {status === 'siap' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 8 }}>
          <button type="button" onClick={() => balik(-1)} disabled={idx === 0} style={{ border: 'none', background: idx === 0 ? '#3f3f46' : '#f97316', color: '#fff', borderRadius: 999, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === 0 ? 'not-allowed' : 'pointer', flexShrink: 0 }} aria-label="halaman sebelumnya">
            <ChevronLeft size={22} />
          </button>
          <span style={{ fontSize: 10.5, color: '#71717a' }}>hal {halamanKini}{modeSorot ? ' · mode sorot: seret untuk menandai' : ''}</span>
          <button type="button" onClick={() => balik(1)} disabled={idx >= daftarHal.length - 1} style={{ border: 'none', background: idx >= daftarHal.length - 1 ? '#3f3f46' : '#f97316', color: '#fff', borderRadius: 999, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx >= daftarHal.length - 1 ? 'not-allowed' : 'pointer', flexShrink: 0 }} aria-label="halaman berikutnya">
            <ChevronRight size={22} />
          </button>
        </div>
      )}
      {pesan && status === 'siap' && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 6 }}>{pesan}</div>}
    </div>
  );
}
