// src/components/buku/PemotongGambar.jsx
// ============================================================
// PEMOTONG GAMBAR MODUL -- pengganti "upload gambar manual".
//
// Masalah lama: setiap gambar/diagram/tabel di modul harus
// di-screenshot satu-satu, di-upload manual, lalu URL-nya
// ditempel ke JSON. Untuk 21 bab x puluhan gambar = mustahil.
//
// Cara baru: buka halaman modul di dalam app -> sistem mendeteksi
// bagian-bagian visual (gambar, diagram, tabel) secara otomatis ->
// admin KETUK salah satu (atau tarik kotak sendiri) -> gambar
// terpotong HD, terupload ke Storage, dan URL-nya langsung
// dikembalikan ke pemanggil untuk dipasang ke soal/materi.
//
// Dipakai oleh: ManajerBuku (tombol "Gambar dari Modul") dan
// halaman Impor Modul.
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  X, ChevronLeft, ChevronRight, ScanSearch, Save, Loader2, ZoomIn, ZoomOut,
  ImageIcon, Crop, RotateCcw, Copy, Check,
} from 'lucide-react';
import {
  bukaPdf, renderHalamanKeCanvas, potongRegionKeBlob, deteksiBagianDariCanvas,
  teksHalaman, infoModul, namaFileAman,
} from '../../utils/modulPdf';

const PRESET = [
  { id: 'penuh', label: 'Seluruh halaman' },
  { id: 'atas', label: 'Setengah atas' },
  { id: 'bawah', label: 'Setengah bawah' },
  { id: 'kiri', label: 'Separuh kiri' },
  { id: 'kanan', label: 'Separuh kanan' },
];

export default function PemotongGambar({
  terbuka = false,
  tutup,
  sumber = null,            // { pdfUrl } | { file } | { bytes }
  bukuId = 'umum',
  judul = 'Modul',
  halamanAwal = 1,
  halamanMin = 1,
  halamanMax = null,
  onSelesai,                // (hasil) => void   hasil = { url, path, halaman, rect, lebar, tinggi, blob }
}) {
  const canvasRef = useRef(null);
  const kotakRef = useRef(null);
  const pdfRef = useRef(null);
  const renderToken = useRef(0);

  const [pdfSiap, setPdfSiap] = useState(false);
  const [jumlahHalaman, setJumlahHalaman] = useState(0);
  const [halaman, setHalaman] = useState(halamanAwal);
  const [ukuranCanvas, setUkuranCanvas] = useState({ w: 0, h: 0 });
  const [rasioPdf, setRasioPdf] = useState(1);   // satuan PDF per piksel canvas
  const [adaTeks, setAdaTeks] = useState(false);

  const [pilihan, setPilihan] = useState(null);   // { x, y, w, h } dalam piksel canvas
  const [usulan, setUsulan] = useState([]);       // [{ x, y, w, h, jenis, thumb }] (piksel canvas)
  const [sembunyikanTeks, setSembunyikanTeks] = useState(true);
  const [zoom, setZoom] = useState(1);

  const [format, setFormat] = useState('image/jpeg');
  const [kualitas, setKualitas] = useState(0.88);
  const [maxLebar, setMaxLebar] = useState(1400);

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [galeri, setGaleri] = useState([]);       // hasil potongan sesi ini
  const [tersalin, setTersalin] = useState('');

  const [tarik, setTarik] = useState(null);       // { x0, y0, x1, y1 } piksel canvas

  const maxHal = Math.min(halamanMax || jumlahHalaman || 999, jumlahHalaman || 999);

  // ------------------------------------------------------------
  // MUAT PDF
  // ------------------------------------------------------------
  useEffect(() => {
    if (!terbuka || !sumber) return;
    let batal = false;
    (async () => {
      setStatus('Membuka modul...');
      setError('');
      try {
        const src = sumber.bytes ? sumber.bytes : sumber.file ? sumber.file : sumber.pdfUrl;
        const pdf = await bukaPdf(src);
        if (batal) { try { await pdf.destroy(); } catch { /* abaikan */ } return; }
        pdfRef.current = pdf;
        setJumlahHalaman(pdf.numPages);
        setHalaman(Math.min(Math.max(halamanAwal, halamanMin), pdf.numPages));
        try {
          const info = await infoModul(pdf, { halamanSampel: 1 });
          setAdaTeks(!!info.adaLapisanTeks);
        } catch { setAdaTeks(false); }
        setPdfSiap(true);
        setStatus('');
      } catch (e) {
        console.error('Gagal membuka PDF:', e);
        setError('Gagal membuka modul: ' + (e?.message || e));
        setStatus('');
      }
    })();
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terbuka, sumber?.pdfUrl, sumber?.file, sumber?.bytes]);

  // Tutup -> bersihkan memori (PDF besar jangan dibiarkan menggantung)
  useEffect(() => {
    if (terbuka) return;
    const pdf = pdfRef.current;
    pdfRef.current = null;
    setPdfSiap(false); setUsulan([]); setPilihan(null); setGaleri([]); setStatus(''); setError('');
    if (pdf) { try { pdf.destroy(); } catch { /* abaikan */ } }
  }, [terbuka]);

  // ------------------------------------------------------------
  // RENDER HALAMAN KE CANVAS TAMPILAN
  // ------------------------------------------------------------
  const renderHalaman = useCallback(async () => {
    const pdf = pdfRef.current;
    if (!pdf || !canvasRef.current) return;
    const token = ++renderToken.current;
    setStatus(`Merender halaman ${halaman}...`);
    try {
      const lebarTarget = Math.min(1000, Math.max(420, (kotakRef.current?.clientWidth || 700))) * zoom;
      const { canvas } = await renderHalamanKeCanvas(pdf, halaman, {
        maxLebar: lebarTarget,
        maxSkala: 3.2 * zoom,
        canvas: canvasRef.current,
      });
      if (token !== renderToken.current) return;
      const page = await pdf.getPage(halaman);
      const vp = page.getViewport({ scale: 1 });
      setUkuranCanvas({ w: canvas.width, h: canvas.height });
      setRasioPdf(vp.width / canvas.width);   // 1 piksel canvas = rasioPdf satuan PDF
      setPilihan(null);
      setUsulan([]);
      setStatus('');
    } catch (e) {
      console.error('Gagal render halaman:', e);
      if (token === renderToken.current) { setError('Gagal merender halaman: ' + (e?.message || e)); setStatus(''); }
    }
  }, [halaman, zoom]);

  useEffect(() => { if (pdfSiap) renderHalaman(); }, [pdfSiap, renderHalaman]);

  // ------------------------------------------------------------
  // DETEKSI OTOMATIS bagian visual halaman ini
  // ------------------------------------------------------------
  const jalankanDeteksi = async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    setStatus('Mendeteksi bagian visual...');
    setError('');
    try {
      let kotakTeks = [];
      if (adaTeks) {
        try {
          const baris = await teksHalaman(pdf, halaman);
          kotakTeks = baris.map((b) => ({ x: b.x / rasioPdf, y: b.y / rasioPdf, w: b.w / rasioPdf, h: b.h / rasioPdf }));
        } catch { kotakTeks = []; }
      }
      const hasil = deteksiBagianDariCanvas(canvas, { kotakTeks, rasio: 1 });
      const denganThumb = hasil.map((h, i) => ({ ...h, id: `${halaman}-${i}`, thumb: buatThumb(canvas, h) }));
      setUsulan(denganThumb);
      setStatus(denganThumb.length
        ? `Ditemukan ${denganThumb.length} bagian visual di halaman ${halaman}. Ketuk salah satu untuk memilihnya.`
        : 'Tidak ada bagian visual yang terdeteksi di halaman ini. Tarik kotak sendiri di atas halaman, atau coba halaman lain.');
    } catch (e) {
      console.error('Deteksi gagal:', e);
      setError('Deteksi otomatis gagal: ' + (e?.message || e));
      setStatus('');
    }
  };

  const buatThumb = (canvas, r) => {
    try {
      const c = document.createElement('canvas');
      const skala = Math.min(1, 150 / Math.max(1, r.w));
      c.width = Math.max(1, Math.round(r.w * skala));
      c.height = Math.max(1, Math.round(r.h * skala));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(canvas, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.72);
    } catch { return ''; }
  };

  // ------------------------------------------------------------
  // INTERAKSI TARIK KOTAK (mouse + sentuh, lewat pointer events)
  // ------------------------------------------------------------
  const kePiksel = (e) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const sx = c.width / Math.max(1, rect.width);
    const sy = c.height / Math.max(1, rect.height);
    return {
      x: Math.max(0, Math.min(c.width, (e.clientX - rect.left) * sx)),
      y: Math.max(0, Math.min(c.height, (e.clientY - rect.top) * sy)),
    };
  };

  const mulaiTarik = (e) => {
    if (!ukuranCanvas.w) return;
    e.preventDefault();
    const p = kePiksel(e);
    setTarik({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* abaikan */ }
  };
  const lanjutTarik = (e) => {
    if (!tarik) return;
    const p = kePiksel(e);
    setTarik({ ...tarik, x1: p.x, y1: p.y });
  };
  const selesaiTarik = () => {
    if (!tarik) return;
    const r = kotakDariTarik(tarik);
    setTarik(null);
    if (r && r.w > 8 && r.h > 8) setPilihan(r);
  };

  const kotakDariTarik = (t) => {
    const x = Math.min(t.x0, t.x1), y = Math.min(t.y0, t.y1);
    const w = Math.abs(t.x1 - t.x0), h = Math.abs(t.y1 - t.y0);
    return { x, y, w, h };
  };

  const pakaiPreset = (id) => {
    const W = ukuranCanvas.w, H = ukuranCanvas.h;
    if (!W || !H) return;
    const peta = {
      penuh: { x: 0, y: 0, w: W, h: H },
      atas: { x: 0, y: 0, w: W, h: H / 2 },
      bawah: { x: 0, y: H / 2, w: W, h: H / 2 },
      kiri: { x: 0, y: 0, w: W / 2, h: H },
      kanan: { x: W / 2, y: 0, w: W / 2, h: H },
    };
    setPilihan(peta[id] || null);
  };

  const kePdf = (r) => ({ x: r.x * rasioPdf, y: r.y * rasioPdf, w: r.w * rasioPdf, h: r.h * rasioPdf });

  // ------------------------------------------------------------
  // POTONG + UPLOAD
  // ------------------------------------------------------------
  const simpanPotongan = async () => {
    const pdf = pdfRef.current;
    if (!pdf || !pilihan) { setError('Pilih dulu area yang mau dipotong.'); return; }
    setMenyimpan(true); setError(''); setStatus('Memotong & mengupload...');
    try {
      const rectPdf = kePdf(pilihan);
      const hasil = await potongRegionKeBlob(pdf, halaman, rectPdf, { format, kualitas, maxLebar });
      const storage = getStorage();
      const ext = format === 'image/png' ? 'png' : 'jpg';
      const path = `buku-digital/${bukuId}/potongan/${Date.now()}_hal${halaman}_${namaFileAman(judul).slice(0, 30)}.${ext}`;
      const r = sRef(storage, path);
      await uploadBytes(r, hasil.blob, { contentType: hasil.format });
      const url = await getDownloadURL(r);
      const catatan = { url, path, halaman, rect: rectPdf, lebar: hasil.lebar, tinggi: hasil.tinggi, blob: hasil.blob, thumb: buatThumb(canvasRef.current, pilihan) };
      setGaleri((g) => [catatan, ...g]);
      setStatus(`✅ Gambar ${hasil.lebar}×${hasil.tinggi}px terupload.`);
      if (onSelesai) onSelesai(catatan);
      setPilihan(null);
    } catch (e) {
      console.error('Gagal potong/upload:', e);
      setError('Gagal menyimpan gambar: ' + (e?.message || e));
      setStatus('');
    }
    setMenyimpan(false);
  };

  const salin = async (teks, label) => {
    try { await navigator.clipboard.writeText(teks); } catch { window.prompt('Salin manual:', teks); }
    setTersalin(label);
    setTimeout(() => setTersalin(''), 1800);
  };

  if (!terbuka) return null;

  const usulanTerlihat = sembunyikanTeks ? usulan.filter((u) => u.jenis !== 'mirip-teks') : usulan;

  // ------------------------------------------------------------
  return (
    <div style={st.latar} onClick={tutup}>
      <div style={st.modal} onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div style={st.header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Crop size={16} color="#4C6EF5" /> Ambil Gambar dari Modul
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {judul} • {jumlahHalaman ? `${jumlahHalaman} halaman` : '...'} {adaTeks ? '• ada lapisan teks' : '• modul scan'}
            </div>
          </div>
          <button onClick={tutup} style={st.iconBtn} title="Tutup"><X size={18} /></button>
        </div>

        {error && <div style={st.error}>⚠️ {error}</div>}
        {status && !error && <div style={st.status}>{status}</div>}

        <div style={st.isi}>
          {/* ===== KOLOM KIRI: HALAMAN ===== */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={st.barHalaman}>
              <button style={st.btnKecil} disabled={halaman <= halamanMin} onClick={() => setHalaman((h) => Math.max(halamanMin, h - 1))} title="Halaman sebelumnya">
                <ChevronLeft size={15} />
              </button>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', minWidth: 84, textAlign: 'center' }}>
                Hal. <input
                  type="number" min={halamanMin} max={maxHal} value={halaman}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!isNaN(v)) setHalaman(Math.max(halamanMin, Math.min(maxHal || v, v)));
                  }}
                  style={st.inputHalaman}
                /> / {maxHal || '—'}
              </div>
              <button style={st.btnKecil} disabled={halaman >= maxHal} onClick={() => setHalaman((h) => Math.min(maxHal, h + 1))} title="Halaman berikutnya">
                <ChevronRight size={15} />
              </button>
              <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
              <button style={st.btnKecil} onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))} title="Perkecil"><ZoomOut size={15} /></button>
              <span style={{ fontSize: 11, color: '#64748b', minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button style={st.btnKecil} onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(2)))} title="Perbesar"><ZoomIn size={15} /></button>
            </div>

            <div ref={kotakRef} style={st.kotakCanvas}>
              <canvas
                ref={canvasRef}
                style={{ ...st.canvas, width: '100%', height: 'auto', cursor: 'crosshair', touchAction: 'none' }}
                onPointerDown={mulaiTarik}
                onPointerMove={lanjutTarik}
                onPointerUp={selesaiTarik}
                onPointerCancel={selesaiTarik}
              />
              {/* lapisan usulan + pilihan */}
              <div style={st.lapis}>
                {usulanTerlihat.map((u) => {
                  const p = { left: `${(u.x / ukuranCanvas.w) * 100}%`, top: `${(u.y / ukuranCanvas.h) * 100}%`, width: `${(u.w / ukuranCanvas.w) * 100}%`, height: `${(u.h / ukuranCanvas.h) * 100}%` };
                  const aktif = pilihan && Math.abs(pilihan.x - u.x) < 2 && Math.abs(pilihan.y - u.y) < 2;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setPilihan({ x: u.x, y: u.y, w: u.w, h: u.h })}
                      title={`${u.jenis} — ketuk untuk memilih`}
                      style={{ ...st.kotakUsulan, ...p, borderColor: aktif ? '#4C6EF5' : '#22c55e', background: aktif ? 'rgba(76,110,245,0.14)' : 'rgba(34,197,94,0.08)' }}
                    />
                  );
                })}
                {pilihan && (
                  <div style={{
                    ...st.kotakPilihan,
                    left: `${(pilihan.x / ukuranCanvas.w) * 100}%`,
                    top: `${(pilihan.y / ukuranCanvas.h) * 100}%`,
                    width: `${(pilihan.w / ukuranCanvas.w) * 100}%`,
                    height: `${(pilihan.h / ukuranCanvas.h) * 100}%`,
                  }}>
                    <span style={st.labelPilihan}>
                      {Math.round(pilihan.w * rasioPdf)}×{Math.round(pilihan.h * rasioPdf)} pt
                    </span>
                  </div>
                )}
                {tarik && (
                  <div style={{
                    ...st.kotakPilihan,
                    left: `${(Math.min(tarik.x0, tarik.x1) / ukuranCanvas.w) * 100}%`,
                    top: `${(Math.min(tarik.y0, tarik.y1) / ukuranCanvas.h) * 100}%`,
                    width: `${(Math.abs(tarik.x1 - tarik.x0) / ukuranCanvas.w) * 100}%`,
                    height: `${(Math.abs(tarik.y1 - tarik.y0) / ukuranCanvas.h) * 100}%`,
                    borderStyle: 'dashed',
                  }} />
                )}
              </div>
            </div>

            <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 6, lineHeight: 1.6 }}>
              Tarik kotak langsung di atas halaman untuk memilih area, atau pakai <b>Deteksi otomatis</b> lalu ketuk kotaknya.
            </div>
          </div>

          {/* ===== KOLOM KANAN: KENDALI ===== */}
          <div style={st.kanan}>
            <button onClick={jalankanDeteksi} disabled={!pdfSiap} style={st.btnUtama}>
              <ScanSearch size={15} /> Deteksi bagian otomatis
            </button>
            {usulan.length > 0 && (
              <label style={st.ceklis}>
                <input type="checkbox" checked={sembunyikanTeks} onChange={(e) => setSembunyikanTeks(e.target.checked)} />
                Sembunyikan baris mirip teks ({usulan.filter((u) => u.jenis === 'mirip-teks').length})
              </label>
            )}

            {usulanTerlihat.length > 0 && (
              <div style={st.galeriThumb}>
                {usulanTerlihat.map((u) => (
                  <button key={u.id} onClick={() => setPilihan({ x: u.x, y: u.y, w: u.w, h: u.h })}
                    style={{ ...st.thumb, borderColor: pilihan && pilihan.x === u.x && pilihan.y === u.y ? '#4C6EF5' : '#e2e8f0' }}
                    title={`${u.jenis} • ${Math.round(u.w * rasioPdf)}×${Math.round(u.h * rasioPdf)} pt`}>
                    {u.thumb ? <img src={u.thumb} alt={u.jenis} style={st.thumbImg} /> : <ImageIcon size={16} color="#cbd5e1" />}
                    <span style={st.thumbLabel}>{u.jenis}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={st.judulGrup}>Potongan cepat</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {PRESET.map((p) => <button key={p.id} onClick={() => pakaiPreset(p.id)} style={st.btnKecil2}>{p.label}</button>)}
              <button onClick={() => setPilihan(null)} style={{ ...st.btnKecil2, color: '#dc2626' }}><RotateCcw size={11} /> Kosongkan</button>
            </div>

            <div style={st.judulGrup}>Kualitas hasil</div>
            <label style={st.label}>Format
              <select value={format} onChange={(e) => setFormat(e.target.value)} style={st.input}>
                <option value="image/jpeg">JPEG (kecil, untuk foto/diagram)</option>
                <option value="image/png">PNG (tajam, file lebih besar)</option>
              </select>
            </label>
            <label style={st.label}>Lebar maksimum: <b>{maxLebar}px</b>
              <input type="range" min={600} max={2200} step={100} value={maxLebar} onChange={(e) => setMaxLebar(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            {format === 'image/jpeg' && (
              <label style={st.label}>Kualitas: <b>{Math.round(kualitas * 100)}%</b>
                <input type="range" min={0.5} max={0.98} step={0.02} value={kualitas} onChange={(e) => setKualitas(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            )}

            <button onClick={simpanPotongan} disabled={!pilihan || menyimpan} style={{ ...st.btnSimpan, opacity: !pilihan || menyimpan ? 0.5 : 1 }}>
              {menyimpan ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
              {menyimpan ? 'Menyimpan...' : 'Potong & Upload ke Storage'}
            </button>

            {galeri.length > 0 && (
              <>
                <div style={st.judulGrup}>Hasil sesi ini ({galeri.length})</div>
                <div style={st.hasilList}>
                  {galeri.map((g, i) => (
                    <div key={i} style={st.hasilRow}>
                      {g.thumb ? <img src={g.thumb} alt="" style={st.hasilThumb} /> : <ImageIcon size={14} color="#cbd5e1" />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1e293b' }}>hal {g.halaman} • {g.lebar}×{g.tinggi}px</div>
                        <div style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.url}</div>
                      </div>
                      <button onClick={() => salin(g.url, g.url)} style={st.btnTiny} title="Salin URL">
                        {tersalin === g.url ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const st = {
  latar: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.62)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, fontFamily: 'sans-serif' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 1180, maxHeight: '94vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
  iconBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, display: 'flex' },
  error: { background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#991b1b', fontSize: 11.5, padding: '8px 14px' },
  status: { background: '#eff6ff', borderBottom: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 11.5, padding: '8px 14px' },
  isi: { display: 'flex', gap: 14, padding: 14, overflow: 'auto', alignItems: 'flex-start', flexWrap: 'wrap' },
  barHalaman: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  inputHalaman: { width: 46, border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 4px', fontSize: 12, textAlign: 'center' },
  btnKecil: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, display: 'flex', cursor: 'pointer', color: '#334155' },
  btnKecil2: { background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '6px 9px', fontSize: 10.5, fontWeight: 700, color: '#334155', cursor: 'pointer' },
  kotakCanvas: { position: 'relative', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', lineHeight: 0 },
  canvas: { display: 'block' },
  lapis: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  kotakUsulan: { position: 'absolute', border: '2px solid #22c55e', borderRadius: 4, cursor: 'pointer', pointerEvents: 'auto', padding: 0 },
  kotakPilihan: { position: 'absolute', border: '2px solid #4C6EF5', background: 'rgba(76,110,245,0.10)', borderRadius: 4, pointerEvents: 'none' },
  labelPilihan: { position: 'absolute', top: -18, left: 0, background: '#4C6EF5', color: 'white', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' },
  kanan: { width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  btnUtama: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#4C6EF5', color: 'white', border: 'none', borderRadius: 9, padding: '10px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnSimpan: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#16a34a', color: 'white', border: 'none', borderRadius: 9, padding: '11px 12px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' },
  ceklis: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: '#475569', fontWeight: 600 },
  judulGrup: { fontSize: 10.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 },
  label: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, fontWeight: 700, color: '#475569' },
  input: { border: '1px solid #cbd5e1', borderRadius: 7, padding: '6px 8px', fontSize: 11.5, background: 'white', color: '#1e293b' },
  galeriThumb: { display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 190, overflowY: 'auto', padding: 2 },
  thumb: { width: 74, background: 'white', border: '2px solid #e2e8f0', borderRadius: 8, padding: 3, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  thumbImg: { width: '100%', height: 52, objectFit: 'contain', background: '#f8fafc', borderRadius: 4 },
  thumbLabel: { fontSize: 8.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  hasilList: { display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 170, overflowY: 'auto' },
  hasilRow: { display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #e2e8f0', borderRadius: 8, padding: 5, background: '#f8fafc' },
  hasilThumb: { width: 34, height: 34, objectFit: 'contain', background: 'white', border: '1px solid #e2e8f0', borderRadius: 5 },
  btnTiny: { background: '#eef2ff', color: '#4338ca', border: 'none', borderRadius: 6, padding: 5, display: 'flex', cursor: 'pointer' },
};