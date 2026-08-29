// src/pages/admin/bank-soal/AdvancedQuestionExtractor.jsx
// ============================================================
// Upload PDF soal ujian -> AI ekstrak jadi JSON per halaman ->
// gambar/diagram tiap soal diupload ke Supabase Storage lewat
// api/uploadBankSoalImages.js -> hasil akhir ditulis ke Firestore
// koleksi "bank_soal" pakai writeBatch(db), guru tinggal ambil
// dari sana.
//
// ⚠️ CATATAN PENTING soal field Firestore di bawah (BANKSOAL_DOC):
// Nama field ini masih ASUMSI karena saya belum lihat isi
// BankSoalImportPage.jsx (versi lama) punya project ini. Kalau
// nama field di situ ternyata beda (misal "pertanyaan" bukan
// "soal", atau "opsiJawaban" bukan "opsi"), tinggal sesuaikan di
// SATU fungsi "buildBankSoalDoc" di bawah -- tidak perlu ubah
// bagian lain.
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UploadCloud, FileText, Play, CheckCircle, Loader2,
  Trash2, Edit3, Save, Image as ImageIcon, Layers,
  CheckSquare, Square, RefreshCw, Sparkles, Crop, X, Check,
  Plus, Database, CloudUpload,
} from 'lucide-react';
import {
  collection, doc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../../firebase';

const BANK_SOAL_COLLECTION = 'bank_soal';

// ============================================================
// 🔧 SESUAIKAN DI SINI kalau field Firestore lama beda nama.
// ============================================================
function buildBankSoalDoc(q, meta) {
  return {
    soal: q.teks_soal || '',
    tipe: q.tipe || 'pg_sederhana',
    pernyataan: q.pernyataan || [],
    opsiJawaban: q.opsi_jawaban || [],
    tabelBenarSalah: q.tabel_benar_salah || [],
    kunciJawaban: q.kunci_jawaban || '',
    gambarUrls: (q.gambar || []).filter(g => g.url).map(g => g.url),
    mataPelajaran: meta.mataPelajaran || '',
    tingkatKelas: meta.tingkatKelas || '',
    sumberFile: meta.fileName,
    sumberHalaman: q.__sourcePage || null,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid || null,
    status: 'aktif',
  };
}

const DAFTAR_MAPEL = ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia', 'Bahasa Inggris'];
const DAFTAR_KELAS = ['SD', '7', '8', '9', '10', '11', '12'];

export default function BankSoalImportPage() {
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isMathReady, setIsMathReady] = useState(false);
  const [file, setFile] = useState(null);
  const [appState, setAppState] = useState('idle'); // idle, preview, processing, editing, saving, done, error
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [extractedData, setExtractedData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pdfDocument, setPdfDocument] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState([]);
  const [coverThumbnail, setCoverThumbnail] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [mataPelajaran, setMataPelajaran] = useState('Matematika');
  const [tingkatKelas, setTingkatKelas] = useState('10');
  const logsEndRef = useRef(null);

  const settings = { resolution: 2.5, delayBetweenPages: 3000 };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setIsPdfReady(true);
      addLog('Mesin PDF.js siap.', 'success');
    };
    script.onerror = () => addLog('Gagal memuat PDF.js.', 'error');
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  useEffect(() => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(css);
    const coreScript = document.createElement('script');
    coreScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    coreScript.async = true;
    coreScript.onload = () => {
      const autoRender = document.createElement('script');
      autoRender.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js';
      autoRender.async = true;
      autoRender.onload = () => setIsMathReady(true);
      document.body.appendChild(autoRender);
    };
    document.body.appendChild(coreScript);
    return () => {
      if (css.parentNode) css.parentNode.removeChild(css);
      if (coreScript.parentNode) coreScript.parentNode.removeChild(coreScript);
    };
  }, []);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: timestamp, message, type }]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      addLog('Harap unggah file PDF yang valid.', 'error');
      return;
    }
    if (!isPdfReady) { addLog('Pustaka PDF belum siap, tunggu sebentar...', 'warning'); return; }

    setFile(selectedFile);
    setExtractedData([]);
    setLogs([]);
    addLog(`File terdeteksi: ${selectedFile.name}`, 'success');
    setAppState('preview');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setSelectedPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
      const page1 = await pdf.getPage(1);
      const cover = await renderPageToCanvas(page1, 0.6);
      setCoverThumbnail(cover.toDataURL('image/jpeg', 0.9));
      addLog(`PDF dimuat. ${pdf.numPages} halaman terdeteksi.`, 'success');
    } catch (error) {
      addLog(`Gagal memuat PDF: ${error.message}`, 'error');
      setAppState('error');
    }
  };

  const renderPageToCanvas = async (page, scale = 2.0) => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
  };

  // --- deteksi & crop diagram vektor (versi ringkas dari sebelumnya) ---
  const detectDiagramRegions = async (page) => {
    try {
      const opList = await page.getOperatorList();
      const OPS = window.pdfjsLib.OPS;
      const base = page.getViewport({ scale: 1 });
      const W = base.width, H = base.height;
      const boxes = [];
      let ctm = base.transform.slice();
      const stack = [];
      let cur = null;
      const mul = (m, n) => [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
      const apply = (m, x, y) => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
      const startBox = () => { cur = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, pts: 0 }; };
      const addPt = (x, y) => { const [dx, dy] = apply(ctm, x, y); cur.x0 = Math.min(cur.x0, dx); cur.y0 = Math.min(cur.y0, dy); cur.x1 = Math.max(cur.x1, dx); cur.y1 = Math.max(cur.y1, dy); cur.pts++; };
      const endBox = () => { if (cur && cur.pts > 0 && cur.x1 > cur.x0 && cur.y1 > cur.y0) boxes.push(cur); cur = null; };
      const args = opList.argsArray;
      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i]; const a = args[i];
        if (fn === OPS.save) stack.push(ctm.slice());
        else if (fn === OPS.restore) ctm = stack.pop() || ctm;
        else if (fn === OPS.transform) ctm = mul(ctm, a);
        else if (fn === OPS.constructPath) {
          startBox();
          const ops = a[0], coords = a[1]; let p = 0;
          for (let k = 0; k < ops.length; k++) {
            const op = ops[k];
            if (op === OPS.moveTo || op === OPS.lineTo) { addPt(coords[p], coords[p+1]); p += 2; }
            else if (op === OPS.curveTo) { addPt(coords[p],coords[p+1]); addPt(coords[p+2],coords[p+3]); addPt(coords[p+4],coords[p+5]); p += 6; }
            else if (op === OPS.curveTo2 || op === OPS.curveTo3) { addPt(coords[p],coords[p+1]); addPt(coords[p+2],coords[p+3]); p += 4; }
            else if (op === OPS.rectangle) { addPt(coords[p],coords[p+1]); addPt(coords[p]+coords[p+2],coords[p+1]+coords[p+3]); p += 4; }
          }
          endBox();
        }
      }
      const EXPAND = 3;
      let rects = boxes.filter(b => {
        const w = b.x1 - b.x0, h = b.y1 - b.y0;
        if (w > 0.8 * W && h < 3) return false;
        if (b.y1 < 0.05 * H || b.y0 > 0.95 * H) return false;
        if (w * h < 4) return false;
        return true;
      }).map(b => [b.x0 - EXPAND, b.y0 - EXPAND, b.x1 + EXPAND, b.y1 + EXPAND]);
      let changed = true;
      while (changed) {
        changed = false;
        const out = [];
        while (rects.length) {
          let a = rects.pop();
          let merged = true;
          while (merged) {
            merged = false;
            const keep = [];
            for (const b of rects) {
              const overlap = a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
              if (overlap) { a = [Math.min(a[0],b[0]), Math.min(a[1],b[1]), Math.max(a[2],b[2]), Math.max(a[3],b[3])]; merged = true; changed = true; }
              else keep.push(b);
            }
            rects = keep;
          }
          out.push(a);
        }
        rects = out;
      }
      return rects.filter(r => (r[2]-r[0]) > 25 && (r[3]-r[1]) > 25)
        .filter(r => !(r[0] > 0.8 * W && r[1] > 0.85 * H))
        .map(r => ({ x0: Math.max(0, r[0]), y0: Math.max(0, r[1]), x1: Math.min(W, r[2]), y1: Math.min(H, r[3]) }))
        .sort((a, b) => a.y0 - b.y0);
    } catch {
      return [];
    }
  };

  const renderFullPageSharp = async (page, dpiScale = 4) => {
    const vp = page.getViewport({ scale: dpiScale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return canvas;
  };

  const sliceRegionSharp = (fullCanvas, scale, region) => {
    const sx = Math.round(region.x0 * scale), sy = Math.round(region.y0 * scale);
    const sw = Math.round((region.x1 - region.x0) * scale), sh = Math.round((region.y1 - region.y0) * scale);
    if (sw < 8 || sh < 8) return null;
    const out = document.createElement('canvas');
    out.width = sw; out.height = sh;
    const octx = out.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, sw, sh);
    octx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return out.toDataURL('image/png');
  };

  // Panggil api/extractPdfBankSoal.js -- TIDAK ada API key di sini.
  const extractFromImageWithAI = async (base64Image, pageNum, onRateLimit) => {
    let retries = 5, delay = 2000;
    const MAX_DELAY = 30000;
    while (retries > 0) {
      try {
        const response = await fetch('/api/extractPdfBankSoal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, pageNum }),
        });
        if (response.status === 429 || response.status >= 500) {
          retries--;
          if (retries === 0) throw new Error(`Server AI sibuk (status ${response.status}).`);
          const waitMs = Math.min(delay, MAX_DELAY);
          onRateLimit?.(Math.round(waitMs / 1000), response.status);
          await sleep(waitMs);
          delay = Math.min(delay * 2, MAX_DELAY);
          continue;
        }
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || `HTTP ${response.status}`);
        return result.questions || [];
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await sleep(Math.min(delay, MAX_DELAY));
        delay = Math.min(delay * 2, MAX_DELAY);
      }
    }
  };

  const startProcessing = async () => {
    if (!file || !pdfDocument || selectedPages.length === 0) return;
    setAppState('processing');
    setExtractedData([]);
    setProgress({ current: 0, total: selectedPages.length });
    setActiveTab('terminal');
    addLog(`Memulai ekstraksi AI untuk ${selectedPages.length} halaman...`, 'info');

    let allQuestions = [];
    const failedPages = [];

    for (let i = 0; i < selectedPages.length; i++) {
      const pageNum = selectedPages[i];
      addLog(`[Hal ${pageNum}] Merender halaman...`, 'info');
      const page = await pdfDocument.getPage(pageNum);
      const pageCanvas = await renderPageToCanvas(page, settings.resolution);
      const base64Image = pageCanvas.toDataURL('image/jpeg', 0.92);
      addLog(`[Hal ${pageNum}] Mengirim ke AI...`, 'info');

      try {
        const onRateLimit = (secs, status) => addLog(`[Hal ${pageNum}] Server sibuk (${status}). Tunggu ${secs}s...`, 'warning');
        const [questions, regions] = await Promise.all([
          extractFromImageWithAI(base64Image, pageNum, onRateLimit),
          detectDiagramRegions(page),
        ]);

        if (questions.length > 0) {
          let renderedImages = [];
          if (regions.length > 0) {
            const sharpPage = await renderFullPageSharp(page, 4);
            renderedImages = regions.map(r => sliceRegionSharp(sharpPage, 4, r)).filter(Boolean).map(url => ({ url }));
          }
          let imgPtr = 0;
          const withImages = questions.map(q => {
            const gambarList = Array.isArray(q.gambar) ? q.gambar : [];
            const gambar = gambarList.map(g => {
              if (imgPtr < renderedImages.length) {
                const img = renderedImages[imgPtr++];
                return { ...g, dataUrl: img.url, metode: 'render-pdf' };
              }
              return { ...g, dataUrl: null };
            });
            return { ...q, gambar, __sourcePage: pageNum };
          });
          allQuestions = [...allQuestions, ...withImages];
          setExtractedData([...allQuestions]);
          addLog(`[Hal ${pageNum}] Sukses, ${questions.length} soal ditemukan.`, 'success');
        } else {
          addLog(`[Hal ${pageNum}] Tidak ada soal ditemukan.`, 'warning');
        }
      } catch (err) {
        failedPages.push(pageNum);
        addLog(`[Hal ${pageNum}] Gagal: ${err.message}`, 'error');
      }

      setProgress({ current: i + 1, total: selectedPages.length });
      if (i < selectedPages.length - 1) await sleep(settings.delayBetweenPages);
    }

    addLog(failedPages.length > 0
      ? `Selesai dengan ${failedPages.length} halaman gagal. Total ${allQuestions.length} soal.`
      : `Selesai. Total ${allQuestions.length} soal berhasil diekstrak.`, failedPages.length > 0 ? 'warning' : 'success');
    setAppState('editing');
    setActiveTab('questions');
  };

  const handleEditClick = (q, index) => {
    setEditingId(index);
    setEditForm({ ...q });
  };
  const handleSaveEdit = (index) => {
    const updated = [...extractedData];
    updated[index] = editForm;
    setExtractedData(updated);
    setEditingId(null);
  };
  const handleDeleteQuestion = (index) => {
    setExtractedData(extractedData.filter((_, i) => i !== index));
  };

  // ============================================================
  // SIMPAN KE BANK SOAL:
  // 1. Upload semua gambar (dataUrl lokal) -> Supabase lewat
  //    api/uploadBankSoalImages.js -> dapat URL publik.
  // 2. Tulis semua soal ke Firestore "bank_soal" pakai writeBatch,
  //    sama seperti pola upload guru yang lain di project ini.
  // ============================================================
  const saveToBankSoal = async () => {
    if (extractedData.length === 0) return;
    setAppState('saving');
    addLog('Mengunggah gambar diagram ke penyimpanan...', 'info');

    // Kumpulkan semua gambar yang masih berupa dataUrl lokal
    const imagesToUpload = [];
    extractedData.forEach((q, qi) => {
      (q.gambar || []).forEach((g, gi) => {
        if (g.dataUrl && g.dataUrl.startsWith('data:image')) {
          imagesToUpload.push({ key: `soal-${Date.now()}-${qi}-${gi}`, dataUrl: g.dataUrl, qi, gi });
        }
      });
    });

    let uploadedMap = {};
    if (imagesToUpload.length > 0) {
      try {
        const resp = await fetch('/api/uploadBankSoalImages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: imagesToUpload.map(i => ({ key: i.key, dataUrl: i.dataUrl })) }),
        });
        const result = await resp.json();
        if (!resp.ok || !result.success) throw new Error(result.error || 'Gagal upload gambar.');
        (result.uploaded || []).forEach(u => { uploadedMap[u.key] = u.url; });
        if ((result.errors || []).length > 0) {
          addLog(`${result.errors.length} gambar gagal diupload, soal tetap disimpan tanpa gambar itu.`, 'warning');
        }
        addLog(`${result.uploaded.length} gambar berhasil diunggah ke Supabase.`, 'success');
      } catch (err) {
        addLog(`Gagal upload gambar: ${err.message}. Melanjutkan simpan tanpa gambar.`, 'error');
      }
    }

    // Tempel URL hasil upload ke masing-masing soal
    const finalData = extractedData.map((q, qi) => {
      const gambar = (q.gambar || []).map((g, gi) => {
        const match = imagesToUpload.find(i => i.qi === qi && i.gi === gi);
        if (match && uploadedMap[match.key]) return { ...g, url: uploadedMap[match.key] };
        return g;
      });
      return { ...q, gambar };
    });

    addLog(`Menulis ${finalData.length} soal ke Firestore (koleksi "${BANK_SOAL_COLLECTION}")...`, 'info');
    try {
      const batch = writeBatch(db);
      finalData.forEach(q => {
        const ref = doc(collection(db, BANK_SOAL_COLLECTION));
        batch.set(ref, buildBankSoalDoc(q, { fileName: file?.name || 'dokumen.pdf', mataPelajaran, tingkatKelas }));
      });
      await batch.commit();
      addLog('Semua soal berhasil disimpan ke Bank Soal. Guru sudah bisa mengambilnya.', 'success');
      setAppState('done');
    } catch (err) {
      addLog(`Gagal menyimpan ke Firestore: ${err.message}`, 'error');
      setAppState('editing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Scan Soal PDF &rarr; Bank Soal</h1>
            <p className="text-xs text-gray-400">Ekstrak otomatis, langsung tersimpan, guru tinggal ambil</p>
          </div>
        </div>
        {file && (
          <button onClick={() => { setFile(null); setAppState('idle'); setExtractedData([]); setLogs([]); }} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-6">

        {appState === 'idle' && (
          <div className="flex flex-col items-center justify-center flex-1 my-12">
            <div className="w-full max-w-xl border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-12 text-center bg-gray-900/40 transition-all">
              <input type="file" id="pdf-upload" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                <div className="bg-blue-600/10 p-5 rounded-full mb-5 border border-blue-500/20 text-blue-400">
                  <UploadCloud className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold mb-2">Unggah PDF Soal Ujian</h3>
                <p className="text-sm text-gray-400 mb-6">Hasil scan otomatis masuk ke Bank Soal, guru tinggal ambil.</p>
                <span className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm">Pilih File PDF</span>
              </label>
            </div>
          </div>
        )}

        {appState === 'preview' && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/3 flex flex-col items-center bg-gray-950/60 p-6 rounded-xl border border-gray-800">
                {coverThumbnail ? <img src={coverThumbnail} alt="cover" className="w-full max-w-[200px] rounded-lg border border-gray-700 mb-4" /> : <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />}
                <h3 className="font-bold text-center truncate max-w-full">{file?.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{totalPages} halaman</p>
              </div>
              <div className="w-full md:w-2/3 flex flex-col flex-1">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Mata Pelajaran</label>
                    <select value={mataPelajaran} onChange={e => setMataPelajaran(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-2.5 text-sm">
                      {DAFTAR_MAPEL.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Tingkat Kelas</label>
                    <select value={tingkatKelas} onChange={e => setTingkatKelas(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-2.5 text-sm">
                      {DAFTAR_KELAS.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-blue-400" /> Pilih Halaman</h2>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1))} className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">Pilih Semua</button>
                    <button onClick={() => setSelectedPages([])} className="text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">Batal</button>
                  </div>
                </div>
                <div className="grid grid-cols-6 md:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto p-4 border border-gray-800 rounded-xl bg-gray-950/60 mb-6">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                    const isSelected = selectedPages.includes(pageNum);
                    return (
                      <button key={pageNum} onClick={() => setSelectedPages(prev => isSelected ? prev.filter(p => p !== pageNum) : [...prev, pageNum].sort((a,b)=>a-b))}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border ${isSelected ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                        {isSelected ? <CheckSquare className="w-4 h-4 mb-1" /> : <Square className="w-4 h-4 mb-1" />}
                        <span className="text-xs font-mono font-bold">Hal {pageNum}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={startProcessing} disabled={selectedPages.length === 0} className="w-full px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <Play className="w-4 h-4 fill-current" /> Mulai Ekstraksi AI
                </button>
              </div>
            </div>
          </div>
        )}

        {(appState === 'processing' || appState === 'editing' || appState === 'saving' || appState === 'done') && (
          <div className="flex flex-col flex-1 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                {appState === 'processing' && <><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><div><h3 className="font-bold text-sm">Mengekstrak...</h3><p className="text-xs text-gray-400">Halaman {progress.current}/{progress.total}</p></div></>}
                {appState === 'saving' && <><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /><div><h3 className="font-bold text-sm">Menyimpan ke Bank Soal...</h3></div></>}
                {appState === 'editing' && <><CheckCircle className="w-5 h-5 text-emerald-400" /><div><h3 className="font-bold text-sm">Ekstraksi Selesai</h3><p className="text-xs text-gray-400">{extractedData.length} soal siap disimpan</p></div></>}
                {appState === 'done' && <><Database className="w-5 h-5 text-emerald-400" /><div><h3 className="font-bold text-sm">Tersimpan di Bank Soal!</h3><p className="text-xs text-gray-400">Guru sudah bisa mengambil {extractedData.length} soal ini.</p></div></>}
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-950 p-1 rounded-xl border border-gray-800 flex gap-1">
                  <button onClick={() => setActiveTab('questions')} className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab === 'questions' ? 'bg-blue-600' : 'text-gray-400'}`}>Daftar Soal ({extractedData.length})</button>
                  <button onClick={() => setActiveTab('terminal')} className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab === 'terminal' ? 'bg-blue-600' : 'text-gray-400'}`}>Log ({logs.length})</button>
                </div>
                {appState === 'editing' && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 bg-gray-950 border border-gray-800 px-3 py-2 rounded-xl">
                      {mataPelajaran} &bull; Kelas {tingkatKelas}
                    </span>
                    <button onClick={saveToBankSoal} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <CloudUpload className="w-4 h-4" /> Simpan ke Bank Soal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {activeTab === 'terminal' && (
              <div className="bg-gray-950 text-green-400 font-mono text-xs p-6 rounded-2xl h-[450px] overflow-y-auto border border-gray-800">
                {logs.map((log) => (
                  <div key={log.id} className={log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-blue-300' : 'text-gray-300'}>
                    <span className="text-gray-600">[{log.time}]</span> {log.message}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-4">
                {extractedData.map((q, index) => (
                  <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    {editingId === index ? (
                      <div className="space-y-3">
                        <textarea rows={4} value={editForm.teks_soal} onChange={(e) => setEditForm({ ...editForm, teks_soal: e.target.value })} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-sm font-mono" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg bg-gray-800 text-xs">Batal</button>
                          <button onClick={() => handleSaveEdit(index)} className="px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Simpan</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold">Soal No. {q.nomor} &bull; {q.tipe}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditClick(q, index)} className="p-2 bg-gray-800 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteQuestion(index)} className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="mb-3 bg-gray-950/40 p-4 rounded-xl border border-gray-800/60">
                          <RichQuestionText isMathReady={isMathReady} text={q.teks_soal} gambar={q.gambar} />
                        </div>
                        {q.gambar?.filter(g => g.dataUrl).length > 0 && (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                            <ImageIcon className="w-4 h-4" /> {q.gambar.filter(g => g.dataUrl).length} gambar terdeteksi
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function RichQuestionText({ text, gambar, isMathReady }) {
  const containerRef = useRef(null);
  const html = useMemo(() => {
    if (!text) return '';
    let escaped = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const imgs = (gambar || []).filter(Boolean);
    let idx = 0;
    escaped = escaped.replace(/\{\{\s*GAMBAR[^}]*\}\}/gi, () => {
      const g = imgs[idx++];
      const src = g?.url || g?.dataUrl;
      if (src) return `<img src="${src}" style="max-width:100%;max-height:280px;border-radius:8px;border:1px solid #374151;background:#fff;padding:4px;margin:8px 0;" />`;
      return `<span style="color:#fbbf24;font-size:12px;">[Gambar tidak ditemukan]</span>`;
    });
    return escaped;
  }, [text, gambar]);

  useEffect(() => {
    if (containerRef.current && isMathReady && window.renderMathInElement) {
      try {
        window.renderMathInElement(containerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
        });
      } catch {}
    }
  }, [html, isMathReady]);

  return <div ref={containerRef} className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html }} />;
}
