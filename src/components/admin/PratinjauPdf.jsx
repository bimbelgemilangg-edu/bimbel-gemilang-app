// src/components/admin/PratinjauPdf.jsx
// Panel kiri editor: render halaman PDF modul + mode potong figur.
// Memakai fungsi yang SUDAH ADA di src/utils/modulPdf (bukaPdf,
// renderHalamanKeCanvas, deteksiBagianDariCanvas) — tanpa dependensi baru.
import { useEffect, useRef, useState } from 'react';
import { bukaPdf, renderHalamanKeCanvas, deteksiBagianDariCanvas } from '../../utils/modulPdf';
import PemotongGambar from './PemotongGambar';

export default function PratinjauPdf({
  sumber,
  halamanMulai = 1,
  halamanSampai = null,
  modePotong = false,
  onRegionSiap,
}) {
  const [pdf, setPdf] = useState(null);
  const [err, setErr] = useState('');
  const [hal, setHal] = useState(Math.max(1, halamanMulai));
  const [total, setTotal] = useState(halamanSampai || 0);
  const [kandidat, setKandidat] = useState([]);
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    let hidup = true;
    if (!sumber) {
      setErr('Tidak ada URL PDF untuk pratinjau. Bab ini akan tetap bisa diedit tanpa pratinjau.');
      return;
    }
    setErr('');
    bukaPdf(sumber)
      .then((p) => {
        if (!hidup) return;
        pdfRef.current = p;
        setPdf(p);
        setTotal((t) => t || p.numPages);
      })
      .catch((e) => setErr('Gagal membuka PDF: ' + e.message));
    return () => {
      hidup = false;
      try { pdfRef.current && pdfRef.current.destroy(); } catch { /* abaikan */ }
      pdfRef.current = null;
    };
  }, [sumber]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let hidup = true;
    renderHalamanKeCanvas(pdf, hal, { maxLebar: 1000, maxSkala: 2.5 })
      .then(({ canvas }) => {
        if (!hidup || !canvasRef.current) return;
        const c = canvasRef.current;
        c.width = canvas.width;
        c.height = canvas.height;
        c.getContext('2d').drawImage(canvas, 0, 0);
        canvas.width = 0;
        canvas.height = 0;
        setKandidat([]);
      })
      .catch((e) => setErr('Gagal merender halaman ' + hal + ': ' + e.message));
    return () => { hidup = false; };
  }, [pdf, hal]);

  function deteksi() {
    const c = canvasRef.current;
    if (!c) return;
    try {
      const region = deteksiBagianDariCanvas(c, {}).filter((r) => r.jenis !== 'mirip-teks');
      setKandidat(
        region.map((r) => ({
          x: r.x / c.width,
          y: r.y / c.height,
          w: r.w / c.width,
          h: r.h / c.height,
        }))
      );
    } catch {
      setKandidat([]);
    }
  }

  return (
    <div className="eb-pdf">
      <div className="eb-pdf-toolbar">
        <button className="eb-btn" disabled={hal <= 1} onClick={() => setHal(hal - 1)}>‹</button>
        <span className="eb-pdf-hal">Hal {hal}{total ? ` / ${total}` : ''}</span>
        <button className="eb-btn" disabled={!total || hal >= total} onClick={() => setHal(hal + 1)}>›</button>
        <button className="eb-btn" onClick={deteksi} title="Tandai kandidat figur otomatis">🔍 Deteksi figur</button>
        {kandidat.length > 0 && (
          <button className="eb-btn" onClick={() => setKandidat([])}>Bersihkan</button>
        )}
      </div>
      <div className="eb-pdf-wrap">
        <canvas ref={canvasRef} className="eb-pdf-canvas" />
        {modePotong && (
          <PemotongGambar
            aktif
            kandidat={kandidat}
            onPilih={(rect) => onRegionSiap && onRegionSiap({ rect, halaman: hal, canvas: canvasRef.current })}
          />
        )}
      </div>
      {err && <div className="eb-err">{err}</div>}
      {!modePotong && !err && (
        <div className="eb-pdf-hint">Mode baca. Aktifkan ✂️ Mode Potong untuk mengambil gambar figur.</div>
      )}
    </div>
  );
}