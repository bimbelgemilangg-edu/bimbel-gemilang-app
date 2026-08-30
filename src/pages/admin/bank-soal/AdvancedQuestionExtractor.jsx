// src/pages/admin/bank-soal/AdvancedQuestionExtractor.jsx
// ============================================================
// Upload PDF soal -> /api/extractPdfBankSoal (AI, API key aman
// di server) -> gambar upload via /api/uploadBankSoalImages ->
// tulis ke Firestore "bank_soal" pakai writeBatch.
//
// Support semua tipe: pg_sederhana, pg_kompleks, benar_salah,
// isian_singkat, menjodohkan — dengan render LaTeX via KaTeX.
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UploadCloud, Play, CheckCircle, Loader2,
  Trash2, Edit3, Save, Image as ImageIcon,
  Layers, CheckSquare, Square, RefreshCw, Sparkles,
  X, ArrowRight, Link2, HelpCircle, CloudUpload, Database,
} from 'lucide-react';
import {
  collection, doc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../../firebase';

/* ============================================================
   KONSTANTA
============================================================ */

const BANK_SOAL_COLLECTION = 'bank_soal';

const DAFTAR_MAPEL = [
  'Matematika','Fisika','Kimia','Biologi',
  'Bahasa Indonesia','Bahasa Inggris',
  'Ekonomi','Geografi','Sosiologi','Sejarah',
  'PKN','TPS/Penalaran Umum','Lainnya',
];
const DAFTAR_JENJANG  = ['SD/MI','SMP/MTs','SMA/MA','SMK','UTBK/SNBT'];
const DAFTAR_KELAS    = ['1','2','3','4','5','6','7','8','9','10','11','12','Semua'];
const DAFTAR_KESULITAN= ['mudah','sedang','sulit'];

const TIPE_LABELS = {
  pg_sederhana  : 'PG Sederhana',
  pg_kompleks   : 'PG Kompleks',
  benar_salah   : 'Benar / Salah',
  isian_singkat : 'Isian Singkat',
  menjodohkan   : 'Menjodohkan',
};

/* ============================================================
   buildBankSoalDoc — SEMUA TIPE LENGKAP
   Sesuaikan nama field Firestore di sini jika perlu.
============================================================ */

function buildBankSoalDoc(q, meta) {
  // Gambar: URL Supabase (g.url) atau URL https langsung.
  // Base64 yang belum terupload di-skip — jangan simpan di Firestore.
  const gambarUrls = (q.gambar || [])
    .map(g => g.url || (g.dataUrl?.startsWith('https') ? g.dataUrl : null))
    .filter(Boolean);

  return {
    // ── isi soal ──
    nomor : q.nomor ?? 0,
    soal  : q.teks_soal || '',
    tipe  : q.tipe || 'pg_sederhana',

    // per-tipe (semua field disimpan, UI pilih sesuai tipe)
    opsiJawaban      : q.opsi_jawaban      || [],  // pg_sederhana, pg_kompleks
    pernyataan       : q.pernyataan        || [],  // pg_kompleks
    tabelBenarSalah  : q.tabel_benar_salah || [],  // benar_salah
    pasangan         : (q.pasangan || []).map(p => ({  // menjodohkan
      kiri : String(p.kiri  || ''),
      kanan: String(p.kanan || ''),
    })),

    // jawaban
    kunciJawaban       : q.kunci_jawaban        || '',
    kunciTerverifikasi : q.kunci_terverifikasi   || false,

    // gambar (URL Supabase)
    gambarUrls,

    // metadata
    mataPelajaran    : meta.mataPelajaran    || '',
    tingkatKelas     : meta.tingkatKelas     || '',
    jenjang          : meta.jenjang          || 'SMA/MA',
    kategori         : meta.kategori         || '',
    tags             : meta.tags             || [],
    tingkatKesulitan : meta.tingkatKesulitan || 'sedang',
    pembahasan       : '',

    // sistem
    sumberFile    : meta.fileName || '',
    sumberHalaman : q.__sourcePage || null,
    createdAt     : serverTimestamp(),
    createdBy     : auth.currentUser?.uid || null,
    status        : 'aktif',
  };
}

/* ============================================================
   KOMPONEN UTAMA
============================================================ */

export default function BankSoalImportPage() {
  const [isPdfReady,   setIsPdfReady]   = useState(false);
  const [isMathReady,  setIsMathReady]  = useState(false);
  const [file,         setFile]         = useState(null);
  const [appState,     setAppState]     = useState('idle');
  const [logs,         setLogs]         = useState([]);
  const [progress,     setProgress]     = useState({ current: 0, total: 0 });
  const [extractedData,setExtractedData]= useState([]);
  const [editingId,    setEditingId]    = useState(null);
  const [editForm,     setEditForm]     = useState({});
  const [pdfDocument,  setPdfDocument]  = useState(null);
  const [totalPages,   setTotalPages]   = useState(0);
  const [selectedPages,setSelectedPages]= useState([]);
  const [coverThumbnail,setCoverThumbnail]=useState(null);
  const [activeTab,    setActiveTab]    = useState('questions');

  // Metadata soal
  const [mataPelajaran,    setMataPelajaran]    = useState('Matematika');
  const [tingkatKelas,     setTingkatKelas]     = useState('10');
  const [jenjang,          setJenjang]          = useState('SMA/MA');
  const [kategori,         setKategori]         = useState('');
  const [tags,             setTags]             = useState('');
  const [tingkatKesulitan, setTingkatKesulitan] = useState('sedang');

  const logsEndRef = useRef(null);
  const settings   = { resolution: 2.5, delayBetweenPages: 2500 };

  /* ── PDF.js ── */
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setIsPdfReady(true);
      addLog('PDF.js siap.', 'success');
    };
    script.onerror = () => addLog('Gagal memuat PDF.js.', 'error');
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  /* ── KaTeX (hanya core, pakai renderToString) ── */
  useEffect(() => {
    const css = document.createElement('link');
    css.rel  = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(css);

    if (window.katex) { setIsMathReady(true); return; }

    const script = document.createElement('script');
    script.src   = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    script.async = true;
    script.onload = () => { setIsMathReady(true); addLog('KaTeX siap.', 'success'); };
    script.onerror= () => addLog('Gagal memuat KaTeX.', 'error');
    document.body.appendChild(script);
    return () => { if (css.parentNode) css.parentNode.removeChild(css); };
  }, []);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (message, type = 'info') => {
    const t = new Date().toLocaleTimeString('id-ID', { hour12: false });
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: t, message, type }]);
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ============================================================
     LOAD PDF
  ============================================================ */

  const handleFileUpload = async e => {
    const f = e.target.files?.[0];
    if (!f || f.type !== 'application/pdf') { addLog('Harap unggah file PDF.', 'error'); return; }
    if (!isPdfReady) { addLog('PDF.js belum siap, tunggu sebentar...', 'warning'); return; }

    setFile(f); setExtractedData([]); setLogs([]);
    addLog(`File: ${f.name} (${(f.size/1024/1024).toFixed(2)} MB)`, 'success');
    setAppState('preview');

    try {
      const pdf = await window.pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setSelectedPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
      const cover = await renderPageToCanvas(await pdf.getPage(1), 0.6);
      setCoverThumbnail(cover.toDataURL('image/jpeg', 0.9));
      addLog(`PDF dimuat. ${pdf.numPages} halaman.`, 'success');
    } catch (err) {
      addLog(`Gagal memuat PDF: ${err.message}`, 'error');
      setAppState('error');
    }
  };

  const handleDragOver = e => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = e => {
    e.preventDefault(); e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileUpload({ target: { files: [f] } });
  };

  /* ============================================================
     RENDER PDF
  ============================================================ */

  const renderPageToCanvas = async (page, scale = 2.0) => {
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    return canvas;
  };

  /* ============================================================
     DETEKSI DIAGRAM PDF
  ============================================================ */

  const detectDiagramRegions = async page => {
    try {
      const opList = await page.getOperatorList();
      const OPS = window.pdfjsLib.OPS;
      const base = page.getViewport({ scale: 1 });
      const W = base.width, H = base.height;
      const boxes = [];
      let ctm = base.transform.slice(), stack = [], cur = null;
      const mul = (m, n) => [m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
      const apply = (m,x,y) => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
      const startBox = () => { cur = {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity,pts:0}; };
      const addPt = (x,y) => { const [dx,dy]=apply(ctm,x,y); cur.x0=Math.min(cur.x0,dx); cur.y0=Math.min(cur.y0,dy); cur.x1=Math.max(cur.x1,dx); cur.y1=Math.max(cur.y1,dy); cur.pts++; };
      const endBox = () => { if(cur&&cur.pts>0&&cur.x1>cur.x0&&cur.y1>cur.y0) boxes.push(cur); cur=null; };
      const args = opList.argsArray;
      for (let i=0;i<opList.fnArray.length;i++) {
        const fn=opList.fnArray[i], a=args[i];
        if(fn===OPS.save) stack.push(ctm.slice());
        else if(fn===OPS.restore) ctm=stack.pop()||ctm;
        else if(fn===OPS.transform) ctm=mul(ctm,a);
        else if(fn===OPS.constructPath) {
          startBox();
          const ops=a[0],coords=a[1]; let p=0;
          for(let k=0;k<ops.length;k++){
            const op=ops[k];
            if(op===OPS.moveTo||op===OPS.lineTo){addPt(coords[p],coords[p+1]);p+=2;}
            else if(op===OPS.curveTo){addPt(coords[p],coords[p+1]);addPt(coords[p+2],coords[p+3]);addPt(coords[p+4],coords[p+5]);p+=6;}
            else if(op===OPS.curveTo2||op===OPS.curveTo3){addPt(coords[p],coords[p+1]);addPt(coords[p+2],coords[p+3]);p+=4;}
            else if(op===OPS.rectangle){addPt(coords[p],coords[p+1]);addPt(coords[p]+coords[p+2],coords[p+1]+coords[p+3]);p+=4;}
          }
          endBox();
        }
      }
      const EXPAND=3;
      let rects = boxes.filter(b=>{const w=b.x1-b.x0,h=b.y1-b.y0;return!(w>0.8*W&&h<3)&&b.y1>=0.05*H&&b.y0<=0.95*H&&w*h>=4;}).map(b=>[b.x0-EXPAND,b.y0-EXPAND,b.x1+EXPAND,b.y1+EXPAND]);
      let changed=true;
      while(changed){changed=false;const out=[];while(rects.length){let a=rects.pop(),merged=true;while(merged){merged=false;const keep=[];for(const b of rects){const ov=a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];if(ov){a=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])];merged=true;changed=true;}else keep.push(b);}rects=keep;}out.push(a);}rects=out;}
      return rects.filter(r=>(r[2]-r[0])>25&&(r[3]-r[1])>25&&!(r[0]>0.8*W&&r[1]>0.85*H)).map(r=>({x0:Math.max(0,r[0]),y0:Math.max(0,r[1]),x1:Math.min(W,r[2]),y1:Math.min(H,r[3])})).sort((a,b)=>a.y0-b.y0);
    } catch { return []; }
  };

  const renderFullPageSharp = async (page, dpi=4) => {
    const vp = page.getViewport({ scale: dpi });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return canvas;
  };

  const sliceRegionSharp = (full, scale, r) => {
    const sx=Math.round(r.x0*scale),sy=Math.round(r.y0*scale);
    const sw=Math.round((r.x1-r.x0)*scale),sh=Math.round((r.y1-r.y0)*scale);
    if(sw<8||sh<8) return null;
    const out = document.createElement('canvas');
    out.width=sw; out.height=sh;
    const ctx = out.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,sw,sh);
    ctx.drawImage(full,sx,sy,sw,sh,0,0,sw,sh);
    return out.toDataURL('image/png');
  };

  /* ============================================================
     AI EXTRACTION — panggil /api/extractPdfBankSoal (backend)
     API key aman di server, tidak expose ke browser.
  ============================================================ */

  const extractFromImageWithAI = async (base64Image, pageNum, onRateLimit) => {
    let retries = 5, delay = 2000;
    while (retries > 0) {
      try {
        const resp = await fetch('/api/extractPdfBankSoal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, pageNum }),
        });
        if (resp.status === 429 || resp.status >= 500) {
          retries--;
          if (retries === 0) throw new Error(`Server AI sibuk (${resp.status}).`);
          const waitMs = Math.min(delay, 30000);
          onRateLimit?.(Math.round(waitMs/1000), resp.status);
          await sleep(waitMs);
          delay = Math.min(delay * 2, 30000);
          continue;
        }
        const result = await resp.json();
        if (!resp.ok || !result.success) throw new Error(result.error || `HTTP ${resp.status}`);
        return result.questions || [];
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await sleep(Math.min(delay, 30000));
        delay = Math.min(delay * 2, 30000);
      }
    }
  };

  /* ============================================================
     START PROCESSING
  ============================================================ */

  const startProcessing = async () => {
    if (!file || !pdfDocument || selectedPages.length === 0) return;
    setAppState('processing');
    setExtractedData([]);
    setProgress({ current: 0, total: selectedPages.length });
    setActiveTab('terminal');
    addLog(`Memulai ekstraksi ${selectedPages.length} halaman...`, 'info');

    let allQuestions = [];
    const failedPages = [];

    for (let i = 0; i < selectedPages.length; i++) {
      const pageNum = selectedPages[i];
      addLog(`[Hal ${pageNum}] Render resolusi tinggi (${settings.resolution}x)...`, 'info');
      const page = await pdfDocument.getPage(pageNum);
      const canvas = await renderPageToCanvas(page, settings.resolution);
      const base64 = canvas.toDataURL('image/jpeg', 0.92);
      addLog(`[Hal ${pageNum}] Mengirim ke AI...`, 'info');

      try {
        const onRL = (secs, status) => addLog(`[Hal ${pageNum}] Server sibuk (${status}). Tunggu ${secs}s...`, 'warning');
        const [questions, regions] = await Promise.all([
          extractFromImageWithAI(base64, pageNum, onRL),
          detectDiagramRegions(page).catch(() => []),
        ]);

        if (questions.length > 0) {
          let renderedImages = [];
          if (regions.length > 0) {
            const sharp = await renderFullPageSharp(page, 4);
            renderedImages = regions.map(r => sliceRegionSharp(sharp, 4, r)).filter(Boolean).map(url => ({ url: null, dataUrl: url }));
          }
          let ptr = 0;
          const withImages = questions.map(q => ({
            ...q,
            gambar: (q.gambar || []).map(g => ptr < renderedImages.length
              ? { ...g, dataUrl: renderedImages[ptr++].dataUrl, metode: 'render-pdf' }
              : { ...g, dataUrl: null }
            ),
            __sourcePage: pageNum,
          }));
          allQuestions = [...allQuestions, ...withImages];
          setExtractedData([...allQuestions]);
          addLog(`[Hal ${pageNum}] ✓ ${questions.length} soal, ${renderedImages.length} gambar.`, 'success');
        } else {
          addLog(`[Hal ${pageNum}] Tidak ada soal ditemukan.`, 'warning');
        }
      } catch (err) {
        failedPages.push(pageNum);
        addLog(`[Hal ${pageNum}] Gagal: ${err.message}`, 'error');
      }

      setProgress({ current: i+1, total: selectedPages.length });
      if (i < selectedPages.length-1) await sleep(settings.delayBetweenPages);
    }

    addLog(failedPages.length > 0
      ? `Selesai. ${failedPages.length} halaman gagal. Total ${allQuestions.length} soal.`
      : `Selesai. Total ${allQuestions.length} soal berhasil diekstrak.`,
      failedPages.length > 0 ? 'warning' : 'success');
    setAppState('editing');
    setActiveTab('questions');
  };

  /* ============================================================
     EDIT
  ============================================================ */

  const handleEditClick = (q, index) => { setEditingId(index); setEditForm({ ...q }); };
  const handleSaveEdit  = index => {
    const updated = [...extractedData];
    updated[index] = editForm;
    setExtractedData(updated);
    setEditingId(null);
    addLog(`Soal No. ${editForm.nomor} diperbarui.`, 'success');
  };
  const handleDeleteQuestion = index => {
    setExtractedData(extractedData.filter((_, i) => i !== index));
    addLog('Soal dihapus.', 'warning');
  };

  /* ============================================================
     SIMPAN KE BANK SOAL
     1. Upload gambar base64 → Supabase via /api/uploadBankSoalImages
     2. Tulis ke Firestore "bank_soal" dengan writeBatch
  ============================================================ */

  const saveToBankSoal = async () => {
    if (extractedData.length === 0) return;
    setAppState('saving');
    addLog('Mengunggah gambar ke Supabase...', 'info');

    // Kumpulkan gambar yang masih base64
    const toUpload = [];
    extractedData.forEach((q, qi) => {
      (q.gambar || []).forEach((g, gi) => {
        if (g.dataUrl?.startsWith('data:image')) {
          toUpload.push({ key: `q${qi}-g${gi}-${Date.now()}`, dataUrl: g.dataUrl, qi, gi });
        }
      });
    });

    // Upload ke Supabase via backend
    let uploadedMap = {};
    if (toUpload.length > 0) {
      try {
        const resp = await fetch('/api/uploadBankSoalImages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: toUpload.map(i => ({ key: i.key, dataUrl: i.dataUrl })) }),
        });
        const result = await resp.json();
        if (!resp.ok || !result.success) throw new Error(result.error || 'Gagal upload gambar.');
        (result.uploaded || []).forEach(u => { uploadedMap[u.key] = u.url; });
        addLog(`${result.uploadedCount || 0}/${toUpload.length} gambar berhasil diupload ke Supabase.`, 'success');
        if ((result.errors || []).length > 0) {
          addLog(`${result.errors.length} gambar gagal upload, soal tetap disimpan.`, 'warning');
        }
      } catch (err) {
        addLog(`Upload gambar gagal: ${err.message}. Melanjutkan tanpa gambar.`, 'error');
      }
    }

    // Tempel URL ke masing-masing soal
    const finalData = extractedData.map((q, qi) => ({
      ...q,
      gambar: (q.gambar || []).map((g, gi) => {
        const match = toUpload.find(t => t.qi === qi && t.gi === gi);
        return match && uploadedMap[match.key]
          ? { ...g, url: uploadedMap[match.key], dataUrl: null }
          : g;
      }),
    }));

    // Tulis ke Firestore
    addLog(`Menyimpan ${finalData.length} soal ke Firestore...`, 'info');
    const meta = {
      fileName        : file?.name || '',
      mataPelajaran,
      tingkatKelas,
      jenjang,
      kategori,
      tags            : tags.split(',').map(t => t.trim()).filter(Boolean),
      tingkatKesulitan,
    };

    try {
      const batch = writeBatch(db);
      finalData.forEach(q => {
        const ref = doc(collection(db, BANK_SOAL_COLLECTION));
        batch.set(ref, buildBankSoalDoc(q, meta));
      });
      await batch.commit();
      addLog(`✅ ${finalData.length} soal berhasil disimpan ke Bank Soal!`, 'success');
      setAppState('done');
    } catch (err) {
      addLog(`Gagal simpan ke Firestore: ${err.message}`, 'error');
      setAppState('editing');
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">

      {/* HEADER */}
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Scan Soal PDF → Bank Soal</h1>
            <p className="text-xs text-gray-400">PG · PG Kompleks · Benar/Salah · Isian Singkat · Menjodohkan · LaTeX</p>
          </div>
        </div>
        {file && (
          <button
            onClick={() => { setFile(null); setAppState('idle'); setExtractedData([]); setLogs([]); }}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-6">

        {/* ── IDLE ── */}
        {appState === 'idle' && (
          <div className="flex flex-col items-center justify-center flex-1 my-12">
            <div
              className="w-full max-w-xl border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-12 text-center bg-gray-900/40 transition-all"
              onDragOver={handleDragOver} onDrop={handleDrop}
            >
              <input type="file" id="pdf-upload" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                <div className="bg-blue-600/10 p-5 rounded-full mb-5 border border-blue-500/20 text-blue-400">
                  <UploadCloud className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold mb-2">Unggah PDF Soal Ujian</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Drag &amp; drop atau klik untuk pilih. Hasil scan otomatis masuk ke Bank Soal.
                </p>
                <span className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm">
                  Pilih File PDF
                </span>
              </label>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-xl text-xs">
              {[['bg-sky-100 text-sky-700','✓ PG Sederhana (A-E)'],['bg-violet-100 text-violet-700','✓ PG Kompleks'],['bg-amber-100 text-amber-700','✓ Benar / Salah'],['bg-emerald-100 text-emerald-700','✓ Isian Singkat UTBK'],['bg-rose-100 text-rose-700','✓ Menjodohkan'],['bg-cyan-100 text-cyan-700','✓ LaTeX · Fisika · Kimia']].map(([cls, label], i) => (
                <div key={i} className={`rounded-lg p-2.5 font-medium ${cls}`}>{label}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {appState === 'preview' && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Cover + Metadata */}
              <div className="w-full md:w-1/3 flex flex-col gap-4 bg-gray-950/60 p-6 rounded-xl border border-gray-800">
                {coverThumbnail
                  ? <img src={coverThumbnail} alt="cover" className="w-full max-w-[200px] mx-auto rounded-lg border border-gray-700" />
                  : <div className="w-full aspect-[3/4] bg-gray-900 rounded-lg flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}
                <div>
                  <p className="font-bold text-center text-sm truncate">{file?.name}</p>
                  <p className="text-xs text-gray-400 text-center mt-1">{totalPages} halaman</p>
                </div>

                {/* Metadata form */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Mata Pelajaran</label>
                      <select value={mataPelajaran} onChange={e => setMataPelajaran(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs">
                        {DAFTAR_MAPEL.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Jenjang</label>
                      <select value={jenjang} onChange={e => setJenjang(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs">
                        {DAFTAR_JENJANG.map(j => <option key={j}>{j}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Kelas</label>
                      <select value={tingkatKelas} onChange={e => setTingkatKelas(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs">
                        {DAFTAR_KELAS.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Kesulitan</label>
                      <select value={tingkatKesulitan} onChange={e => setTingkatKesulitan(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs">
                        {DAFTAR_KESULITAN.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Kategori / Bab</label>
                    <input type="text" placeholder="mis: Fungsi Kuadrat" value={kategori} onChange={e => setKategori(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Tags (pisah koma)</label>
                    <input type="text" placeholder="UTBK, TKA, Try Out" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs" />
                  </div>
                </div>
              </div>

              {/* Page selector */}
              <div className="w-full md:w-2/3 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" /> Pilih Halaman
                  </h2>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => setSelectedPages(Array.from({ length: totalPages }, (_, i) => i+1))} className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">Pilih Semua</button>
                    <button onClick={() => setSelectedPages([])} className="text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">Batal</button>
                  </div>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-80 overflow-y-auto p-4 border border-gray-800 rounded-xl bg-gray-950/60 mb-6">
                  {Array.from({ length: totalPages }, (_, i) => i+1).map(n => {
                    const sel = selectedPages.includes(n);
                    return (
                      <button key={n} onClick={() => setSelectedPages(prev => sel ? prev.filter(p=>p!==n) : [...prev,n].sort((a,b)=>a-b))}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${sel ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                        {sel ? <CheckSquare className="w-4 h-4 mb-0.5" /> : <Square className="w-4 h-4 mb-0.5" />}
                        <span className="text-xs font-mono">{n}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-800">
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                    {selectedPages.length} / {totalPages} halaman dipilih
                  </span>
                  <button onClick={startProcessing} disabled={selectedPages.length === 0}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                    <Play className="w-4 h-4 fill-current" /> Mulai Ekstraksi AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROCESSING / EDITING / SAVING / DONE ── */}
        {['processing','editing','saving','done'].includes(appState) && (
          <div className="flex flex-col flex-1 gap-6">

            {/* Status bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                {appState === 'processing' && <><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><div><p className="font-bold text-sm">Mengekstrak soal...</p><p className="text-xs text-gray-400">Halaman {progress.current}/{progress.total}</p></div></>}
                {appState === 'saving'     && <><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /><div><p className="font-bold text-sm">Menyimpan ke Bank Soal...</p></div></>}
                {appState === 'editing'    && <><CheckCircle className="w-5 h-5 text-emerald-400" /><div><p className="font-bold text-sm">Ekstraksi Selesai</p><p className="text-xs text-gray-400">{extractedData.length} soal siap disimpan</p></div></>}
                {appState === 'done'       && <><Database className="w-5 h-5 text-emerald-400" /><div><p className="font-bold text-sm">Tersimpan di Bank Soal!</p><p className="text-xs text-gray-400">Guru sudah bisa mengambil {extractedData.length} soal.</p></div></>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-gray-950 p-1 rounded-xl border border-gray-800 flex">
                  <button onClick={() => setActiveTab('questions')} className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab==='questions'?'bg-blue-600 text-white':'text-gray-400'}`}>Daftar Soal ({extractedData.length})</button>
                  <button onClick={() => setActiveTab('terminal')}  className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab==='terminal' ?'bg-blue-600 text-white':'text-gray-400'}`}>Log ({logs.length})</button>
                </div>
                {appState === 'editing' && (
                  <button onClick={saveToBankSoal} className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CloudUpload className="w-4 h-4" /> Simpan ke Bank Soal ({extractedData.length})
                  </button>
                )}
              </div>
            </div>

            {/* Terminal */}
            {activeTab === 'terminal' && (
              <div className="bg-gray-950 font-mono text-xs p-6 rounded-2xl h-[450px] overflow-y-auto border border-gray-800">
                <div className="text-gray-500 pb-3 mb-3 border-b border-gray-900 flex justify-between">
                  <span>BANK SOAL AI CORE</span><span>{appState.toUpperCase()}</span>
                </div>
                {logs.map(log => (
                  <div key={log.id} className={log.type==='error'?'text-red-400':log.type==='warning'?'text-yellow-400':log.type==='success'?'text-blue-300':'text-gray-300'}>
                    <span className="text-gray-600">[{log.time}]</span> {log.message}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}

            {/* Daftar Soal */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {extractedData.length === 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
                    Belum ada soal terekstrak.
                  </div>
                )}
                {extractedData.map((q, index) => (
                  <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    {editingId === index ? (
                      /* EDIT MODE */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400">Nomor</label>
                            <input type="number" value={editForm.nomor||0} onChange={e => setEditForm({...editForm, nomor: parseInt(e.target.value)||0})} className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Tipe</label>
                            <select value={editForm.tipe||'pg_sederhana'} onChange={e => setEditForm({...editForm, tipe: e.target.value})} className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
                              {Object.entries(TIPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Teks Soal</label>
                          <textarea rows={4} value={editForm.teks_soal||''} onChange={e => setEditForm({...editForm, teks_soal: e.target.value})} className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-sm font-mono" />
                        </div>
                        {/* Kunci untuk isian_singkat */}
                        {editForm.tipe === 'isian_singkat' && (
                          <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                            <label className="text-xs text-emerald-400 font-bold mb-1 block">Kunci / Isian Jawaban:</label>
                            <input type="text" value={editForm.kunci_jawaban||''} onChange={e => setEditForm({...editForm, kunci_jawaban: e.target.value})} placeholder="mis: 42 atau 2,5 m/s" className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                          </div>
                        )}
                        {/* Pasangan untuk menjodohkan */}
                        {editForm.tipe === 'menjodohkan' && (
                          <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs text-rose-300 font-bold">Pasangan Menjodohkan:</label>
                              <button type="button" onClick={() => setEditForm({...editForm, pasangan: [...(editForm.pasangan||[]), {kiri:'',kanan:''}]})} className="text-xs px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">+ Tambah</button>
                            </div>
                            {(editForm.pasangan||[]).map((p, pi) => (
                              <div key={pi} className="flex gap-2 items-center">
                                <input type="text" placeholder="Kiri" value={p.kiri} onChange={e => { const ps=[...editForm.pasangan]; ps[pi]={...ps[pi],kiri:e.target.value}; setEditForm({...editForm,pasangan:ps}); }} className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                                <ArrowRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                                <input type="text" placeholder="Kanan" value={p.kanan} onChange={e => { const ps=[...editForm.pasangan]; ps[pi]={...ps[pi],kanan:e.target.value}; setEditForm({...editForm,pasangan:ps}); }} className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                                <button type="button" onClick={() => setEditForm({...editForm, pasangan: editForm.pasangan.filter((_,i)=>i!==pi)})} className="text-red-400 p-1 hover:bg-red-500/10 rounded"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg bg-gray-800 text-xs">Batal</button>
                          <button onClick={() => handleSaveEdit(index)} className="px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Simpan</button>
                        </div>
                      </div>
                    ) : (
                      /* VIEW MODE */
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold">Soal {q.nomor}</span>
                            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold font-mono ${
                              q.tipe==='pg_sederhana'  ?'bg-sky-500/10 border-sky-500/20 text-sky-300':
                              q.tipe==='pg_kompleks'   ?'bg-violet-500/10 border-violet-500/20 text-violet-300':
                              q.tipe==='benar_salah'   ?'bg-amber-500/10 border-amber-500/20 text-amber-300':
                              q.tipe==='isian_singkat' ?'bg-emerald-500/10 border-emerald-500/20 text-emerald-300':
                                                        'bg-rose-500/10 border-rose-500/20 text-rose-300'
                            }`}>{TIPE_LABELS[q.tipe]||q.tipe}</span>
                            {q.kunci_jawaban && q.tipe !== 'isian_singkat' && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono">Kunci: {q.kunci_jawaban}</span>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleEditClick(q, index)} className="p-1.5 bg-gray-800 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteQuestion(index)} className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>

                        {/* Teks soal + gambar */}
                        <div className="mb-4 bg-gray-950/40 p-4 rounded-xl border border-gray-800/60">
                          <RichText text={q.teks_soal} gambar={q.gambar} isMathReady={isMathReady} />
                        </div>

                        {/* Gambar status */}
                        {(q.gambar||[]).some(g => g.dataUrl) && (
                          <div className="mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                              <ImageIcon className="w-3.5 h-3.5" /> {(q.gambar||[]).filter(g=>g.dataUrl).length} gambar terdeteksi
                            </span>
                          </div>
                        )}

                        {/* Isian singkat: tampilkan kunci */}
                        {q.tipe === 'isian_singkat' && (
                          <div className="mb-4 bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl">
                            <div className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> Kunci / Isian Jawaban UTBK:</div>
                            <div className="font-mono text-sm font-bold text-white bg-gray-950 px-3 py-1.5 rounded border border-gray-800 inline-block">
                              {q.kunci_jawaban || '[Belum diisi]'}
                            </div>
                          </div>
                        )}

                        {/* Menjodohkan */}
                        {q.tipe === 'menjodohkan' && (q.pasangan||[]).length > 0 && (
                          <div className="mb-4 overflow-hidden rounded-xl border border-rose-500/30 bg-rose-950/10">
                            <div className="px-4 py-2 bg-rose-950/40 border-b border-rose-500/30 text-xs font-bold text-rose-300 flex items-center gap-1.5">
                              <Link2 className="w-4 h-4" /> Pasangan (Menjodohkan)
                            </div>
                            <div className="p-3 space-y-2">
                              {q.pasangan.map((p, pi) => (
                                <div key={pi} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                  <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs"><RichText text={p.kiri} gambar={[]} isMathReady={isMathReady} /></div>
                                  <ArrowRight className="w-4 h-4 text-rose-400" />
                                  <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs"><RichText text={p.kanan} gambar={[]} isMathReady={isMathReady} /></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pernyataan (pg_kompleks) */}
                        {(q.pernyataan||[]).length > 0 && (
                          <div className="mb-4 space-y-1.5">
                            <p className="text-xs font-bold text-violet-300">Pernyataan:</p>
                            {q.pernyataan.map((p, pi) => (
                              <div key={pi} className="bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-xs">
                                <RichText text={p} gambar={[]} isMathReady={isMathReady} />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tabel Benar/Salah */}
                        {(q.tabel_benar_salah||[]).length > 0 && (
                          <div className="mb-4 overflow-x-auto rounded-xl border border-gray-800">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-950">
                                  <th className="px-4 py-2 text-left border-b border-gray-800 text-gray-400">Pernyataan</th>
                                  <th className="px-3 py-2 text-center border-b border-l border-gray-800 text-emerald-400 w-20">Benar</th>
                                  <th className="px-3 py-2 text-center border-b border-l border-gray-800 text-red-400 w-20">Salah</th>
                                </tr>
                              </thead>
                              <tbody>
                                {q.tabel_benar_salah.map((row, ri) => (
                                  <tr key={ri} className="border-t border-gray-800">
                                    <td className="px-4 py-2.5"><RichText text={row} gambar={[]} isMathReady={isMathReady} /></td>
                                    <td className="px-3 py-2.5 border-l border-gray-800 text-center"><span className="inline-block w-5 h-5 rounded border border-gray-600 bg-gray-950" /></td>
                                    <td className="px-3 py-2.5 border-l border-gray-800 text-center"><span className="inline-block w-5 h-5 rounded border border-gray-600 bg-gray-950" /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Opsi Jawaban (pg) */}
                        {(q.opsi_jawaban||[]).length > 0 && (
                          <div className="grid sm:grid-cols-2 gap-2">
                            {q.opsi_jawaban.map((opt, oi) => (
                              <div key={oi} className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-2.5 text-xs">
                                <span className="text-blue-400 font-bold mr-2">{String.fromCharCode(65+oi)}.</span>
                                <RichText text={opt} gambar={[]} isMathReady={isMathReady} />
                              </div>
                            ))}
                          </div>
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

/* ============================================================
   RichText — LaTeX via katex.renderToString (sinkron, no timing issue)
============================================================ */

function findInlineEnd(text, start, close) {
  for (let i = start; i < text.length; i++) {
    if (text[i] === '\n') return -1;
    if (text.startsWith(close, i)) return i;
    if (text[i] === '\\') i++;
  }
  return -1;
}

function processSegment(text, renderMath) {
  let result = '', i = 0;
  while (i < text.length) {
    if (text[i]==='$'&&text[i+1]==='$') { const e=text.indexOf('$$',i+2); if(e!==-1){result+=renderMath(text.slice(i+2,e),true);i=e+2;continue;} }
    if (text[i]==='$') { const e=findInlineEnd(text,i+1,'$'); if(e!==-1){result+=renderMath(text.slice(i+1,e),false);i=e+1;continue;} }
    if (text[i]==='\\' && text[i+1]==='[') { const e=text.indexOf('\\]',i+2); if(e!==-1){result+=renderMath(text.slice(i+2,e),true);i=e+2;continue;} }
    if (text[i]==='\\' && text[i+1]==='(') { const e=text.indexOf('\\)',i+2); if(e!==-1){result+=renderMath(text.slice(i+2,e),false);i=e+2;continue;} }
    const ch=text[i];
    if(ch==='&') result+='&amp;';
    else if(ch==='<') result+='&lt;';
    else if(ch==='>') result+='&gt;';
    else if(ch==='\n') result+='<br>';
    else result+=ch;
    i++;
  }
  return result;
}

function RichText({ text, gambar, isMathReady }) {
  const html = useMemo(() => {
    const safe = typeof text === 'string' ? text : (text ?? '');
    if (!safe) return '';
    const imgs = (Array.isArray(gambar) ? gambar : []).filter(Boolean);
    const katexLib = isMathReady && typeof window !== 'undefined' ? window.katex : null;

    const renderMath = (math, display) => {
      if (!katexLib) return display ? `<span>$$${math}$$</span>` : `<span>$${math}$</span>`;
      try { return katexLib.renderToString(math, { displayMode: display, throwOnError: false, output: 'html' }); }
      catch { return display ? `$$${math}$$` : `$${math}$`; }
    };

    const makeImg = g => {
      const src = g.url || (g.dataUrl && !g.dataUrl.startsWith('data:') ? g.dataUrl : null) || g.dataUrl;
      const alt = (g.deskripsi||'Gambar soal').replace(/"/g,'&quot;');
      if (src) return `<figure style="margin:10px 0;"><img src="${src}" alt="${alt}" style="max-width:100%;max-height:320px;border-radius:8px;border:1px solid #374151;background:#fff;padding:4px;"/><figcaption style="font-size:11px;color:#9ca3af;margin-top:4px;">${alt}</figcaption></figure>`;
      return `<span style="color:#fbbf24;font-size:11px;">[Gambar belum dicrop]</span>`;
    };

    const parts = safe.split(/(\{\{\s*GAMBAR(?:_\d+)?\s*\}\})/gi);
    let gIdx = 0, result = '';
    for (const part of parts) {
      if (/^\{\{\s*GAMBAR/i.test(part)) result += makeImg(imgs[gIdx++] || {});
      else result += processSegment(part, renderMath);
    }
    if (gIdx === 0 && imgs.some(g => g.dataUrl || g.url)) imgs.forEach(g => { result += makeImg(g); });
    return result;
  }, [text, gambar, isMathReady]);

  return (
    <div className="text-sm text-gray-200 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: html }} />
  );
}