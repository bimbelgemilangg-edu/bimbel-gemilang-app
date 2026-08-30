import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UploadCloud, FileText, Play, Download,
  CheckCircle, Loader2, FileJson, FileSpreadsheet,
  Trash2, Edit3, Save, Image as ImageIcon,
  Layers, CheckSquare, Square, RefreshCw, Sparkles,
  Crop, X, Check, Plus, Settings, Code, AlertTriangle
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Helpers: paksa tipe data hasil AI supaya tidak pernah meng-crash   */
/* komponen render (misal .replace()/.map() dipanggil pada non-string)*/
/* ------------------------------------------------------------------ */

const toStr = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    // Kalau AI membalas object/array padahal seharusnya string,
    // jangan crash — tampilkan representasi JSON-nya saja.
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const toStrArray = (v) => {
  if (Array.isArray(v)) return v.map(toStr).filter((s) => s.length > 0);
  if (v == null || v === '') return [];
  return [toStr(v)];
};

const VALID_TYPES = ['pg_sederhana', 'pg_kompleks', 'benar_salah'];

/**
 * Memastikan setiap objek soal hasil AI punya bentuk & tipe field yang
 * konsisten, apapun yang sebenarnya dibalas oleh model. Ini dijalankan
 * SEBELUM soal disimpan ke state, jadi komponen render tidak pernah lagi
 * bertemu field yang bukan string/array seperti yang diharapkan.
 */
const normalizeQuestion = (raw, fallbackNomor) => {
  const q = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  const nomorParsed =
    typeof q.nomor === 'number' && Number.isFinite(q.nomor)
      ? q.nomor
      : parseInt(q.nomor, 10);

  return {
    nomor: Number.isFinite(nomorParsed) ? nomorParsed : fallbackNomor,
    tipe: VALID_TYPES.includes(q.tipe) ? q.tipe : 'pg_sederhana',
    teks_soal: toStr(q.teks_soal),
    pernyataan: toStrArray(q.pernyataan),
    opsi_jawaban: toStrArray(q.opsi_jawaban),
    tabel_benar_salah: toStrArray(q.tabel_benar_salah),
    kunci_jawaban: toStr(q.kunci_jawaban),
    // gambar tetap array of object, tapi disaring supaya tiap entri valid
    gambar: Array.isArray(q.gambar)
      ? q.gambar
          .filter((g) => g && typeof g === 'object')
          .map((g) => ({
            id: toStr(g.id) || undefined,
            deskripsi: toStr(g.deskripsi),
            dataUrl: typeof g.dataUrl === 'string' ? g.dataUrl : null,
            sourcePage: g.sourcePage,
            metode: toStr(g.metode) || undefined,
          }))
      : [],
  };
};

/* ------------------------------------------------------------------ */
/* Error boundary: kalau SATU kartu soal tetap gagal render karena     */
/* sebab tak terduga, hanya kartu itu yang gagal — bukan seluruh app. */
/* ------------------------------------------------------------------ */

class QuestionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error('Gagal merender kartu soal:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Satu butir soal gagal ditampilkan.</p>
            <p className="text-red-300/80 text-xs">
              Kemungkinan hasil AI untuk soal ini tidak lengkap. Soal lain tetap aman.
              Anda bisa hapus soal ini lalu proses ulang halaman terkait.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', role: 'utama' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', role: 'fallback' },
];

const GEMINI_RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      nomor: { type: 'INTEGER' },
      tipe: {
        type: 'STRING',
        enum: ['pg_sederhana', 'pg_kompleks', 'benar_salah']
      },
      teks_soal: { type: 'STRING' },
      pernyataan: { type: 'ARRAY', items: { type: 'STRING' } },
      opsi_jawaban: { type: 'ARRAY', items: { type: 'STRING' } },
      tabel_benar_salah: { type: 'ARRAY', items: { type: 'STRING' } },
      kunci_jawaban: { type: 'STRING' },
      gambar: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            deskripsi: { type: 'STRING' }
          },
          required: ['id', 'deskripsi']
        }
      }
    },
    required: [
      'nomor', 'tipe', 'teks_soal', 'pernyataan',
      'opsi_jawaban', 'tabel_benar_salah', 'kunci_jawaban', 'gambar'
    ]
  }
};

export default function AdvancedQuestionExtractor() {
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isMathReady, setIsMathReady] = useState(false);
  const [file, setFile] = useState(null);
  const [appState, setAppState] = useState('idle'); // idle, preview, processing, editing, error
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [extractedData, setExtractedData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [settings] = useState({
    resolution: 2.5,
    delayBetweenPages: 3000
  });

  const [pdfDocument, setPdfDocument] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState([]);
  const [coverThumbnail, setCoverThumbnail] = useState(null);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'terminal' | 'markdown'
  const [manualCrop, setManualCrop] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try { return localStorage.getItem('aqe_gemini_api_key') || ''; } catch { return ''; }
  });
  const [showApiSettings, setShowApiSettings] = useState(false);

  const logsEndRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setIsPdfReady(true);
      addLog('Mesin PDF.js berhasil diinisialisasi & siap digunakan.', 'success');
    };
    script.onerror = () => addLog('Gagal memuat pustaka PDF.js dari CDN.', 'error');
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
      autoRender.onload = () => {
        setIsMathReady(true);
        addLog('Mesin render matematika (KaTeX) siap. Rumus akan ditampilkan rapi.', 'success');
      };
      autoRender.onerror = () => addLog('Gagal memuat auto-render KaTeX.', 'error');
      document.body.appendChild(autoRender);
    };
    coreScript.onerror = () => addLog('Gagal memuat KaTeX dari CDN.', 'error');
    document.body.appendChild(coreScript);

    return () => {
      if (css.parentNode) css.parentNode.removeChild(css);
      if (coreScript.parentNode) coreScript.parentNode.removeChild(coreScript);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: timestamp, message, type }]);
  };

  const processUploadedFile = async (selectedFile) => {
    if (!isPdfReady) {
      addLog('Pustaka PDF belum siap, mohon tunggu beberapa detik...', 'warning');
      return;
    }

    setFile(selectedFile);
    setExtractedData([]);
    setLogs([]);
    addLog(`File terdeteksi: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
    setAppState('preview');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDocument(pdf);
      const total = pdf.numPages;
      setTotalPages(total);
      setSelectedPages(Array.from({ length: total }, (_, i) => i + 1));

      const page1 = await pdf.getPage(1);
      const coverCanvas = await renderPageToCanvas(page1, 0.6);
      setCoverThumbnail(coverCanvas.toDataURL('image/jpeg', 0.9));

      addLog(`PDF berhasil dimuat. Total ${total} halaman terdeteksi. Silakan pilih halaman.`, 'success');
    } catch (error) {
      addLog(`Gagal memuat struktur PDF: ${error.message}`, 'error');
      setAppState('error');
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      processUploadedFile(selectedFile);
    } else {
      addLog('Harap unggah file PDF yang valid.', 'error');
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      processUploadedFile(droppedFile);
    } else {
      addLog('Format file tidak didukung. Harap gunakan PDF.', 'error');
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

  const detectDiagramRegions = async (page) => {
    const opList = await page.getOperatorList();
    const OPS = window.pdfjsLib.OPS;
    const base = page.getViewport({ scale: 1 });
    const W = base.width, H = base.height;

    const boxes = [];
    let ctm = base.transform.slice();
    const stack = [];
    let cur = null;
    const mul = (m, n) => [
      m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1],
      m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3],
      m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5],
    ];
    const apply = (m, x, y) => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
    const startBox = () => { cur = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, pts: 0 }; };
    const addPt = (x, y) => {
      const [dx, dy] = apply(ctm, x, y);
      cur.x0 = Math.min(cur.x0, dx); cur.y0 = Math.min(cur.y0, dy);
      cur.x1 = Math.max(cur.x1, dx); cur.y1 = Math.max(cur.y1, dy);
      cur.pts++;
    };
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
    let rects = boxes
      .filter(b => {
        const w = b.x1 - b.x0, h = b.y1 - b.y0;
        if (w > 0.8 * W && h < 3) return false;
        if (b.y1 < 0.05 * H || b.y0 > 0.95 * H) return false;
        if (w * h < 4) return false;
        return true;
      })
      .map(b => [b.x0 - EXPAND, b.y0 - EXPAND, b.x1 + EXPAND, b.y1 + EXPAND]);

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

    const regions = rects
      .filter(r => (r[2]-r[0]) > 25 && (r[3]-r[1]) > 25)
      .filter(r => !(r[0] > 0.8 * W && r[1] > 0.85 * H))
      .map(r => ({
        x0: Math.max(0, r[0]), y0: Math.max(0, r[1]),
        x1: Math.min(W, r[2]), y1: Math.min(H, r[3]),
        cx: (r[0]+r[2])/2, cy: (r[1]+r[3])/2,
      }))
      .sort((a, b) => a.y0 - b.y0);

    return { regions, W, H };
  };

  const sliceRegionSharp = (fullCanvas, scale, region) => {
    const s = scale;
    const sx = Math.round(region.x0 * s);
    const sy = Math.round(region.y0 * s);
    const sw = Math.round((region.x1 - region.x0) * s);
    const sh = Math.round((region.y1 - region.y0) * s);
    if (sw < 8 || sh < 8) return null;
    const out = document.createElement('canvas');
    out.width = sw; out.height = sh;
    const octx = out.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, sw, sh);
    octx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return out.toDataURL('image/png');
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

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const salvagePartialJsonArray = (text) => {
    const start = text.indexOf('[');
    if (start === -1) return [];
    let depth = 0, inStr = false, esc = false, lastGoodEnd = -1;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') {
        depth--;
        if (depth === 1 && ch === '}') lastGoodEnd = i;
      }
    }
    if (lastGoodEnd === -1) return [];
    const candidate = text.slice(start, lastGoodEnd + 1) + ']';
    try {
      const parsed = JSON.parse(candidate);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveGeminiApiKey = (value) => {
    const clean = String(value || '').trim();
    setGeminiApiKey(clean);
    try {
      if (clean) localStorage.setItem('aqe_gemini_api_key', clean);
      else localStorage.removeItem('aqe_gemini_api_key');
    } catch {
      // localStorage may be unavailable in restricted preview environments.
    }
  };

  const extractJsonFromGemini = (result) => {
    const text = (result?.candidates?.[0]?.content?.parts || [])
      .filter(part => typeof part.text === 'string')
      .map(part => part.text)
      .join('\n')
      .trim();

    if (!text) {
      const blockReason = result?.promptFeedback?.blockReason;
      if (blockReason) throw new Error(`Permintaan AI diblokir: ${blockReason}`);
      throw new Error('Gemini tidak mengembalikan teks JSON.');
    }

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      try {
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        const salvaged = salvagePartialJsonArray(cleaned);
        if (salvaged.length) return { items: salvaged, truncated: true };
        throw new Error('Respons Gemini bukan JSON yang valid.');
      }
    }
  };

  const extractFromImageWithAI = async (base64Image, pageNum, onRateLimit) => {
    const apiKey = geminiApiKey.trim();
    if (!apiKey) {
      throw new Error('API key Gemini belum diisi. Buka tombol AI Key di kanan atas.');
    }

    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const systemPrompt = `Kamu adalah mesin AI ekstraktor soal ujian tingkat lanjut yang sangat teliti untuk guru.
Tugasmu membaca SATU halaman gambar ujian dan mengekstrak SEMUA butir soal yang benar-benar terlihat pada halaman tersebut.

ATURAN WAJIB:
1. Pertahankan teks soal sedekat mungkin dengan sumber. Jangan meringkas, mengarang, memperbaiki isi, atau mengubah angka.
2. Pertahankan persamaan matematika, simbol, variabel, satuan, indeks, akar, pecahan, integral, limit, matriks, dan notasi lain menggunakan LaTeX yang bersih. Gunakan $...$ untuk inline dan $$...$$ untuk display.
3. Jika soal mempunyai gambar/diagram/grafik/tabel visual yang merupakan bagian soal, sisipkan token {{GAMBAR_1}}, {{GAMBAR_2}}, dst. pada posisi yang sesuai di teks_soal. Array gambar harus memuat id token dan deskripsi singkat visualnya.
4. Jangan membuat gambar baru. Jangan menebak gambar yang tidak terlihat.
5. Semua field teks harus string; field pernyataan, opsi_jawaban, dan tabel_benar_salah adalah array string.
6. Tipe soal hanya salah satu dari:
   - pg_sederhana: pilihan ganda biasa dengan satu daftar opsi A-E.
   - pg_kompleks: pilihan ganda kompleks dengan pernyataan bernomor dan opsi A-E.
   - benar_salah: model kategori/tabel pernyataan Benar-Salah tanpa opsi A-E.
7. kunci_jawaban diisi hanya jika kunci terlihat/tercantum jelas pada halaman. Jika tidak terlihat, isi string kosong. Jangan menebak kunci.
8. Jika halaman tidak berisi soal, kembalikan array kosong.
9. Jangan menggabungkan dua soal berbeda menjadi satu soal.
10. Nomor soal harus mengikuti nomor yang tercetak pada halaman. Jika nomor tidak terbaca, gunakan urutan relatif pada halaman.
11. Balas HANYA JSON sesuai schema. Tidak boleh ada markdown atau penjelasan tambahan.`;

    const userText = `Ekstrak seluruh butir soal dari halaman ${pageNum}. Pastikan setiap soal lengkap, termasuk opsi, pernyataan, tabel Benar/Salah, rumus, dan referensi gambar/diagram.`;

    const callModel = async (modelId, attempt = 0) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
      const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: 'user',
          parts: [
            { text: userText },
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body)
      });

      if (response.ok) return extractJsonFromGemini(await response.json());

      const errData = await response.json().catch(() => ({}));
      const message = errData?.error?.message || errData?.message || `HTTP ${response.status}`;
      const retryable = response.status === 429 || response.status === 408 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504;
      if (retryable && attempt < 2) {
        const retryAfterHeader = Number(response.headers.get('retry-after'));
        const waitMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
          ? Math.min(retryAfterHeader * 1000, 30000)
          : Math.min(2000 * (2 ** attempt), 12000);
        if (typeof onRateLimit === 'function') onRateLimit(Math.ceil(waitMs / 1000), response.status);
        await sleep(waitMs);
        return callModel(modelId, attempt + 1);
      }

      const error = new Error(`Gemini ${modelId}: ${message}`);
      error.status = response.status;
      throw error;
    };

    let lastError = null;
    for (const model of GEMINI_MODELS) {
      try {
        if (model.role === 'fallback') {
          addLog(`[Halaman ${pageNum}] Beralih ke ${model.label} sebagai fallback...`, 'warning');
        } else {
          addLog(`[Halaman ${pageNum}] Memakai ${model.label}...`, 'info');
        }
        return await callModel(model.id);
      } catch (err) {
        lastError = err;
        const status = err?.status;
        const canFallback = status === 429 || status === 408 || status >= 500;
        if (!canFallback) throw err;
        addLog(`[Halaman ${pageNum}] ${model.label} gagal (${status || 'error'}).`, 'warning');
      }
    }
    throw lastError || new Error('Semua model Gemini gagal.');
  };

  const startProcessing = async () => {
    if (!file || !isPdfReady || !pdfDocument || selectedPages.length === 0) return;

    setAppState('processing');
    setExtractedData([]);
    setProgress({ current: 0, total: selectedPages.length });
    setActiveTab('terminal');
    addLog(`Memulai ekstraksi AI untuk ${selectedPages.length} halaman terpilih...`, 'info');

    try {
      let allQuestions = [];
      const failedPages = [];
      const totalToProcess = selectedPages.length;

      for (let i = 0; i < totalToProcess; i++) {
        const pageNum = selectedPages[i];
        addLog(`[Halaman ${pageNum}] Merender halaman ke resolusi tinggi (${settings.resolution}x)...`, 'info');
        const page = await pdfDocument.getPage(pageNum);

        const pageCanvas = await renderPageToCanvas(page, settings.resolution);
        const base64Image = pageCanvas.toDataURL('image/jpeg', 0.92);
        addLog(`[Halaman ${pageNum}] Mengirim ke AI & mengekstrak vektor diagram asli dari PDF...`, 'info');

        try {
          const onRateLimit = (secs, status) =>
            addLog(`[Halaman ${pageNum}] Server sibuk (${status}). Menunggu ${secs} detik...`, 'warning');

          const [rawResult, regionInfo] = await Promise.all([
            extractFromImageWithAI(base64Image, pageNum, onRateLimit),
            detectDiagramRegions(page).catch(() => ({ regions: [] })),
          ]);

          const rawQuestions = Array.isArray(rawResult) ? rawResult : (rawResult?.items || []);
          const wasTruncated = !Array.isArray(rawResult) && rawResult?.truncated;
          if (wasTruncated) {
            addLog(`[Halaman ${pageNum}] Peringatan: respons sempat terpotong; ${rawQuestions.length} soal diselamatkan.`, 'warning');
          }

          // Paksa setiap soal hasil AI ke bentuk/tipe data yang aman untuk
          // dirender. Ini mencegah crash "text.replace is not a function"
          // saat AI membalas field dengan tipe tak terduga (object/array/null).
          const questions = (Array.isArray(rawQuestions) ? rawQuestions : [])
            .map((raw, idx) => normalizeQuestion(raw, idx + 1))
            .filter((q) => q.teks_soal.trim().length > 0);

          const skippedCount = rawQuestions.length - questions.length;
          if (skippedCount > 0) {
            addLog(`[Halaman ${pageNum}] ${skippedCount} entri dari AI dilewati karena kosong/tidak valid.`, 'warning');
          }

          if (questions.length > 0) {
            const regions = regionInfo.regions || [];
            const renderedImages = [];
            if (regions.length > 0) {
              const sharpPage = await renderFullPageSharp(page, 4);
              for (const region of regions) {
                const url = sliceRegionSharp(sharpPage, 4, region);
                if (url) renderedImages.push({ url, region });
              }
            }
            addLog(`[Halaman ${pageNum}] ${renderedImages.length} diagram/gambar vektor dirender tajam.`, 'info');

            let imgPtr = 0;
            let assigned = 0;
            const questionsWithImages = questions.map(q => {
              const gambarList = Array.isArray(q.gambar) ? q.gambar : [];
              if (gambarList.length === 0) return { ...q, gambar: [] };
              const gambarWithImg = gambarList.map(g => {
                if (imgPtr < renderedImages.length) {
                  const img = renderedImages[imgPtr++];
                  assigned++;
                  return { ...g, dataUrl: img.url, sourcePage: pageNum, metode: 'render-pdf' };
                }
                return { ...g, dataUrl: null, sourcePage: pageNum, metode: 'tak-ditemukan' };
              });
              return { ...q, gambar: gambarWithImg };
            });

            allQuestions = [...allQuestions, ...questionsWithImages];
            setExtractedData([...allQuestions]);
            addLog(`[Halaman ${pageNum}] Sukses! ${questions.length} soal, ${assigned} gambar tertanam.`, 'success');
          } else {
            addLog(`[Halaman ${pageNum}] Tidak ditemukan butir soal pada halaman ini.`, 'warning');
          }
        } catch (aiError) {
          failedPages.push(pageNum);
          addLog(`[Halaman ${pageNum}] Gagal memproses: ${aiError.message}`, 'error');
        }

        setProgress({ current: i + 1, total: totalToProcess });
        if (i < totalToProcess - 1) await sleep(settings.delayBetweenPages);
      }

      if (failedPages.length > 0) {
        addLog(`PROSES SELESAI dengan ${failedPages.length} halaman gagal: ${failedPages.join(', ')}. Total ${allQuestions.length} soal terekstrak.`, 'warning');
      } else {
        addLog(`PROSES SELESAI. Total seluruh soal berhasil diekstrak: ${allQuestions.length}`, 'success');
      }
      setAppState('editing');
      setActiveTab('questions');
    } catch (error) {
      addLog(`GAGAL TOTAL PROSES PDF: ${error.message}`, 'error');
      setAppState('error');
    }
  };

  const handleEditClick = (q, index) => {
    setEditingId(index);
    setEditForm({
      ...q,
      opsi_jawaban: [...(q.opsi_jawaban || [])],
      pernyataan: [...(q.pernyataan || [])],
      tabel_benar_salah: [...(q.tabel_benar_salah || [])],
      gambar: [...(q.gambar || [])],
    });
  };

  const handleSaveEdit = (index) => {
    const updated = [...extractedData];
    // Sanitasi ulang juga di titik ini — kalau pengguna sempat memasukkan
    // nilai aneh lewat form (jarang, tapi tetap dijaga).
    updated[index] = normalizeQuestion(editForm, editForm.nomor ?? index + 1);
    setExtractedData(updated);
    setEditingId(null);
    addLog(`Soal nomor ${updated[index].nomor} berhasil diperbarui.`, 'success');
  };

  const handleDeleteQuestion = (index) => {
    const updated = extractedData.filter((_, i) => i !== index);
    setExtractedData(updated);
    addLog('Butir soal dihapus dari daftar.', 'warning');
  };

  const openManualCrop = (qIndex, gIndex) => {
    const q = extractedData[qIndex];
    const pageNum = q?.gambar?.[gIndex]?.sourcePage || q?.gambar?.[0]?.sourcePage || selectedPages[0] || 1;
    setManualCrop({ qIndex, gIndex, pageNum });
  };

  const applyManualCrop = (qIndex, gIndex, dataUrl, pageNum) => {
    setExtractedData(prev => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      const gambar = [...(q.gambar || [])];
      if (gIndex != null && gambar[gIndex]) {
        gambar[gIndex] = { ...gambar[gIndex], dataUrl, sourcePage: pageNum, metode: 'manual' };
      } else {
        gambar.push({ id: `GAMBAR_${gambar.length + 1}`, deskripsi: '', dataUrl, sourcePage: pageNum, metode: 'manual' });
        if (!/\{\{\s*GAMBAR/i.test(q.teks_soal || '')) {
          q.teks_soal = `${q.teks_soal || ''} {{GAMBAR}}`;
        }
      }
      q.gambar = gambar;
      next[qIndex] = q;
      return next;
    });
    addLog('Gambar hasil render manual berhasil disematkan ke sistem.', 'success');
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(extractedData, null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `soal_ekstrak_${file?.name || 'dokumen'}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    addLog('File JSON berhasil diunduh.', 'success');
  };

  const downloadCSV = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    let csvContent = "data:text/csv;charset=utf-8,Nomor,Tipe,Soal,Pernyataan,Tabel Benar-Salah,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci,Jumlah Gambar\n";
    extractedData.forEach(q => {
      const opsi = q.opsi_jawaban || [];
      const jumlahGambar = (q.gambar || []).filter(g => g.dataUrl).length;
      const row = [
        q.nomor,
        esc(q.tipe || ''),
        esc(q.teks_soal || ''),
        esc((q.pernyataan || []).join(' | ')),
        esc((q.tabel_benar_salah || []).join(' | ')),
        esc(opsi[0] || ''),
        esc(opsi[1] || ''),
        esc(opsi[2] || ''),
        esc(opsi[3] || ''),
        esc(opsi[4] || ''),
        esc(q.kunci_jawaban || ''),
        jumlahGambar
      ];
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `soal_ekstrak_${file?.name || 'dokumen'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    addLog('File CSV berhasil diunduh.', 'success');
  };

  const downloadMarkdown = () => {
    let md = `# Hasil Ekstrak Soal - ${file?.name || 'Dokumen'}\n\n`;
    extractedData.forEach((q, idx) => {
      md += `### Soal No. ${q.nomor} (${q.tipe})\n\n${q.teks_soal}\n\n`;
      if (q.pernyataan && q.pernyataan.length > 0) {
        q.pernyataan.forEach(p => md += `- ${p}\n`);
        md += '\n';
      }
      if (q.opsi_jawaban && q.opsi_jawaban.length > 0) {
        q.opsi_jawaban.forEach(opt => md += `- ${opt}\n`);
        md += '\n';
      }
      md += `---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soal_ekstrak_${file?.name || 'dokumen'}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    addLog('File Markdown berhasil diunduh.', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Advanced AI Question Extractor <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full font-mono font-normal">v12.0 Gemini</span>
            </h1>
            <p className="text-xs text-gray-400">Vektor PDF murni &bull; Render KaTeX &bull; PG Sederhana, Kompleks & Benar/Salah &bull; Gemini 2.5 Flash + fallback Lite</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setShowApiSettings(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${geminiApiKey ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}
          >
            <Settings className="w-3.5 h-3.5" /> {geminiApiKey ? 'AI Key tersimpan' : 'Set AI Key'}
          </button>
          {showApiSettings && (
            <div className="absolute right-0 top-12 w-[360px] bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl z-[100]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-white text-sm">Gemini API Key</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Key disimpan lokal di browser ini. Tidak ada sesi chat Claude/ChatGPT.</p>
                </div>
                <button onClick={() => setShowApiSettings(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => saveGeminiApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-gray-950 border border-gray-700 focus:border-blue-500 outline-none rounded-lg px-3 py-2 text-xs text-gray-200 font-mono"
              />
              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-[10px] text-amber-300">Jangan bagikan key ini ke orang lain.</span>
                <button
                  onClick={() => saveGeminiApiKey('')}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                >Hapus key</button>
              </div>
            </div>
          )}
          {file && (
            <button
              onClick={() => { setFile(null); setAppState('idle'); setExtractedData([]); setLogs([]); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Dokumen
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">

        {appState === 'idle' && (
          <div className="flex flex-col items-center justify-center flex-1 my-12 animate-in fade-in duration-500">
            <div className="w-full max-w-2xl">
              <div
                className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-12 text-center bg-gray-900/40 hover:bg-gray-900/85 transition-all cursor-pointer shadow-2xl relative overflow-hidden group"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input type="file" id="pdf-upload" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="bg-blue-600/10 p-5 rounded-full mb-5 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 text-blue-400">
                    <UploadCloud className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">Unggah File PDF Soal Ujian</h3>
                  <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                    Mendukung dokumen PDF matematika & sains dengan rumus LaTeX serta ekstraksi diagram vektor otomatis. Gunakan Gemini API key gratis; model utama otomatis fallback ke Gemini Flash-Lite.
                  </p>
                  <span className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all">
                    Pilih File PDF dari Perangkat
                  </span>
                </label>
              </div>

              <div className="mt-8 bg-gray-900/60 border border-gray-800 rounded-xl p-5 text-sm text-gray-300">
                <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Contoh Tampilan Rumus KaTeX:
                </h4>
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800/80">
                  <RichQuestionText
                    isMathReady={isMathReady}
                    text={'Diketahui fungsi $f(x) = \\frac{\\sin x + \\cos x}{\\tan x}$, nilai dari $\\lim_{x \\to 0} f(x)$ adalah...'}
                    gambar={[]}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {appState === 'preview' && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 shadow-2xl animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/3 flex flex-col items-center bg-gray-950/60 p-6 rounded-xl border border-gray-800">
                {coverThumbnail ? (
                  <img src={coverThumbnail} alt="PDF Cover Preview" className="w-full max-w-[200px] rounded-lg shadow-xl border border-gray-700 mb-4 object-contain aspect-[1/1.4]" />
                ) : (
                  <div className="w-full max-w-[200px] aspect-[1/1.4] bg-gray-900 rounded-lg shadow-inner flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                )}
                <h3 className="font-bold text-white text-center truncate max-w-full">{file?.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{totalPages} Halaman Dokumen Total</p>
              </div>

              <div className="w-full md:w-2/3 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" /> Pilih Halaman Target Ekstraksi
                    </h2>
                    <p className="text-xs text-gray-400">Pilih halaman yang berisi butir soal.</p>
                  </div>
                  <div className="flex gap-2 text-xs font-medium">
                    <button onClick={() => setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1))} className="text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-colors">
                      Pilih Semua
                    </button>
                    <button onClick={() => setSelectedPages([])} className="text-gray-400 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors">
                      Batalkan Semua
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto p-4 border border-gray-800 rounded-xl bg-gray-950/60 mb-6">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                    const isSelected = selectedPages.includes(pageNum);
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setSelectedPages(prev => isSelected ? prev.filter(p => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b))}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${isSelected ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'}`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 mb-1 text-blue-400" /> : <Square className="w-4 h-4 mb-1 text-gray-600" />}
                        <span className="text-xs font-mono font-bold">Hal {pageNum}</span>
                      </button>
                    );
                  })}
                </div>

                {!geminiApiKey && (
                  <div className="w-full mb-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                    <b>API key Gemini diperlukan.</b> Klik <b>Set AI Key</b> di kanan atas sebelum memulai ekstraksi.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-800">
                  <div className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Target: {selectedPages.length} dari {totalPages} halaman
                  </div>
                  <button
                    onClick={startProcessing}
                    disabled={selectedPages.length === 0 || !geminiApiKey}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/25"
                  >
                    <Play className="w-4 h-4 fill-current" /> Mulai Ekstraksi AI Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(appState === 'processing' || appState === 'editing') && (
          <div className="flex flex-col flex-1 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                {appState === 'processing' ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <div>
                      <h3 className="font-bold text-white text-sm">Sedang Mengekstrak Soal...</h3>
                      <p className="text-xs text-gray-400">Memproses halaman {progress.current} dari {progress.total}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Ekstraksi Selesai!</h3>
                      <p className="text-xs text-gray-400">Total {extractedData.length} butir soal berhasil diekstrak.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-gray-950 p-1 rounded-xl border border-gray-800 flex gap-1">
                  <button onClick={() => setActiveTab('questions')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'questions' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                    Daftar Soal ({extractedData.length})
                  </button>
                  <button onClick={() => setActiveTab('terminal')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'terminal' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                    Log Terminal ({logs.length})
                  </button>
                </div>

                {appState === 'editing' && (
                  <div className="flex items-center gap-2">
                    <button onClick={downloadJSON} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all">
                      <FileJson className="w-4 h-4" /> JSON
                    </button>
                    <button onClick={downloadCSV} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all">
                      <FileSpreadsheet className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={downloadMarkdown} className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all">
                      <Code className="w-4 h-4" /> Markdown
                    </button>
                  </div>
                )}
              </div>
            </div>

            {activeTab === 'terminal' && (
              <div className="bg-gray-950 text-green-400 font-mono text-xs p-6 rounded-2xl shadow-inner h-[500px] overflow-y-auto border border-gray-800 flex flex-col">
                <div className="text-gray-500 pb-3 mb-3 border-b border-gray-900 flex justify-between">
                  <span>SYSTEM LOG STREAM -- AI MULTIMODAL CORE</span>
                  <span>STATUS: {appState.toUpperCase()}</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  {logs.map((log) => (
                    <div key={log.id} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-blue-300' : 'text-gray-300'}`}>
                      <span className="text-gray-600">[{log.time}]</span> {log.message}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-4">
                {extractedData.length === 0 ? (
                  <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
                    Belum ada soal terekstrak...
                  </div>
                ) : (
                  extractedData.map((q, index) => (
                    <QuestionErrorBoundary key={index}>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative group">
                      {editingId === index ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono font-bold text-blue-400">Edit Soal Nomor:</span>
                            <input
                              type="number"
                              value={editForm.nomor}
                              onChange={(e) => setEditForm({ ...editForm, nomor: parseInt(e.target.value) || 0 })}
                              className="w-20 bg-gray-950 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Teks Soal:</label>
                            <textarea
                              rows={4}
                              value={editForm.teks_soal}
                              onChange={(e) => setEditForm({ ...editForm, teks_soal: e.target.value })}
                              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-sm text-white font-mono"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300">Batal</button>
                            <button onClick={() => handleSaveEdit(index)} className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold flex items-center gap-1.5">
                              <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold">
                                Soal No. {q.nomor}
                              </span>
                              <TypeBadge tipe={q.tipe} />
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditClick(q, index)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors" title="Edit Soal">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteQuestion(index)} className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors" title="Hapus Soal">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mb-4 bg-gray-950/40 p-4 rounded-xl border border-gray-800/60">
                            <RichQuestionText isMathReady={isMathReady} text={q.teks_soal} gambar={q.gambar} />
                          </div>

                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            {q.gambar?.filter(g => g.dataUrl).length > 0 && (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                                <ImageIcon className="w-4 h-4" />
                                {q.gambar.filter(g => g.dataUrl).length} gambar vektor tertanam (hal {q.gambar.find(g => g.dataUrl)?.sourcePage})
                              </span>
                            )}
                            {q.gambar?.map((g, gi) => (
                              <button
                                key={gi}
                                onClick={() => openManualCrop(index, gi)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 text-xs font-medium transition-colors"
                              >
                                <Crop className="w-3.5 h-3.5" /> {g.dataUrl ? `Atur ulang gambar ${gi + 1}` : `Perbaiki gambar ${gi + 1}`}
                              </button>
                            ))}
                            <button
                              onClick={() => openManualCrop(index, null)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-xs font-medium transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah gambar manual
                            </button>
                          </div>

                          {q.pernyataan?.length > 0 && (
                            <div className="mb-4 space-y-2">
                              {q.pernyataan.map((p, pIdx) => (
                                <div key={pIdx} className="bg-gray-950/60 border border-gray-800/60 rounded-xl px-4 py-2.5">
                                  <RichQuestionText isMathReady={isMathReady} text={p} gambar={[]} />
                                </div>
                              ))}
                            </div>
                          )}

                          {q.tabel_benar_salah?.length > 0 && (
                            <div className="mb-4 overflow-x-auto rounded-xl border border-gray-800">
                              <table className="w-full border-collapse text-xs">
                                <thead>
                                  <tr className="bg-gray-950 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                    <th className="px-4 py-2.5 text-left border-b border-gray-800">Pernyataan</th>
                                    <th className="px-3 py-2.5 text-center border-b border-l border-gray-800 text-emerald-400 w-20">Benar</th>
                                    <th className="px-3 py-2.5 text-center border-b border-l border-gray-800 text-red-400 w-20">Salah</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {q.tabel_benar_salah.map((row, rIdx) => (
                                    <tr key={rIdx} className="align-middle">
                                      <td className="px-4 py-3 border-b border-gray-800/60 text-gray-200">
                                        <RichQuestionText isMathReady={isMathReady} text={row} gambar={[]} />
                                      </td>
                                      <td className="px-3 py-3 border-b border-l border-gray-800/60 text-center">
                                        <span className="inline-block w-5 h-5 rounded border border-gray-600 bg-gray-950 align-middle" />
                                      </td>
                                      <td className="px-3 py-3 border-b border-l border-gray-800/60 text-center">
                                        <span className="inline-block w-5 h-5 rounded border border-gray-600 bg-gray-950 align-middle" />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {q.opsi_jawaban?.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.opsi_jawaban.map((opt, oIdx) => (
                                <div key={oIdx} className="bg-gray-950/80 border border-gray-800/80 rounded-xl px-4 py-2.5 text-xs text-gray-300">
                                  <RichQuestionText isMathReady={isMathReady} text={opt} gambar={[]} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    </QuestionErrorBoundary>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {manualCrop && pdfDocument && (
        <ManualCropModal
          pdfDocument={pdfDocument}
          pageNum={manualCrop.pageNum}
          totalPages={totalPages}
          onClose={() => setManualCrop(null)}
          onApply={(dataUrl, pageNum) => {
            applyManualCrop(manualCrop.qIndex, manualCrop.gIndex, dataUrl, pageNum);
            setManualCrop(null);
          }}
        />
      )}
    </div>
  );
}

function TypeBadge({ tipe }) {
  const map = {
    pg_sederhana: { label: 'PG Sederhana', cls: 'bg-sky-500/10 border-sky-500/20 text-sky-300' },
    pg_kompleks: { label: 'PG Kompleks', cls: 'bg-violet-500/10 border-violet-500/20 text-violet-300' },
    benar_salah: { label: 'Benar / Salah', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
  };
  const item = map[tipe];
  if (!item) return null;
  return (
    <span className={`px-2.5 py-1 rounded-full border font-mono text-[10px] font-bold ${item.cls}`}>
      {item.label}
    </span>
  );
}

function RichQuestionText({ text, gambar, isMathReady }) {
  const containerRef = useRef(null);

  const html = useMemo(() => {
    // Pertahanan ekstra: apapun tipe "text" yang masuk, paksa jadi string
    // dulu sebelum dipakai. Ini mencegah crash white-screen kalau ada jalur
    // lain (di luar normalizeQuestion) yang meloloskan nilai non-string.
    const safeText = toStr(text);
    if (!safeText) return '';
    let escaped = safeText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const imgs = (Array.isArray(gambar) ? gambar : []).filter(g => g);
    let idx = 0;
    escaped = escaped.replace(/\{\{\s*GAMBAR[^}]*\}\}/gi, () => {
      const g = imgs[idx++];
      if (g && g.dataUrl) {
        const alt = (g.deskripsi || '').replace(/"/g, '&quot;');
        return `<figure style="margin:10px 0;"><img src="${g.dataUrl}" alt="${alt}" style="max-width:100%;max-height:320px;border-radius:8px;border:1px solid #374151;background:#fff;padding:4px;" /><figcaption style="font-size:11px;color:#9ca3af;margin-top:4px;">${alt}</figcaption></figure>`;
      }
      return `<span style="color:#fbbf24;font-size:12px;">[Gambar tidak ditemukan]</span>`;
    });

    if (idx === 0 && imgs.some(g => g.dataUrl)) {
      imgs.forEach(g => {
        if (g.dataUrl) {
          const alt = (g.deskripsi || '').replace(/"/g, '&quot;');
          escaped += `<figure style="margin:10px 0;"><img src="${g.dataUrl}" alt="${alt}" style="max-width:100%;max-height:320px;border-radius:8px;border:1px solid #374151;background:#fff;padding:4px;" /><figcaption style="font-size:11px;color:#9ca3af;margin-top:4px;">${alt}</figcaption></figure>`;
        }
      });
    }

    return escaped;
  }, [text, gambar]);

  useEffect(() => {
    if (containerRef.current && isMathReady && window.renderMathInElement) {
      try {
        window.renderMathInElement(containerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      } catch (e) {}
    }
  }, [html, isMathReady]);

  return (
    <div
      ref={containerRef}
      className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ManualCropModal({ pdfDocument, pageNum, totalPages, onClose, onApply }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [curPage, setCurPage] = useState(pageNum);
  const [rendering, setRendering] = useState(true);
  const [pageObj, setPageObj] = useState(null);
  const [viewScale, setViewScale] = useState(1);
  const [box, setBox] = useState({ x: 60, y: 60, w: 200, h: 160 });
  const drag = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRendering(true);
      const page = await pdfDocument.getPage(curPage);
      if (cancelled) return;
      setPageObj(page);
      const maxW = Math.min(820, (wrapRef.current?.clientWidth || 820));
      const base = page.getViewport({ scale: 1 });
      const scale = maxW / base.width;
      setViewScale(scale);
      const vp = page.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = Math.ceil(vp.width);
      canvas.height = Math.ceil(vp.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      if (cancelled) return;
      setBox({ x: canvas.width * 0.3, y: canvas.height * 0.25, w: canvas.width * 0.4, h: canvas.height * 0.3 });
      setRendering(false);
    })();
    return () => { cancelled = true; };
  }, [pdfDocument, curPage]);

  const onPointerDown = (e, mode) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    drag.current = {
      mode,
      startX: e.clientX, startY: e.clientY,
      startBox: { ...box },
      scaleX: canvasRef.current.width / rect.width,
      scaleY: canvasRef.current.height / rect.height,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const d = drag.current;
    const dx = (e.clientX - d.startX) * d.scaleX;
    const dy = (e.clientY - d.startY) * d.scaleY;
    const cw = canvasRef.current.width, ch = canvasRef.current.height;
    let { x, y, w, h } = d.startBox;
    if (d.mode === 'move') { x += dx; y += dy; }
    else {
      if (d.mode.includes('e')) w += dx;
      if (d.mode.includes('s')) h += dy;
      if (d.mode.includes('w')) { x += dx; w -= dx; }
      if (d.mode.includes('n')) { y += dy; h -= dy; }
    }
    w = Math.max(20, w); h = Math.max(20, h);
    x = Math.max(0, Math.min(x, cw - w));
    y = Math.max(0, Math.min(y, ch - h));
    if (x + w > cw) w = cw - x;
    if (y + h > ch) h = ch - y;
    setBox({ x, y, w, h });
  };

  const onPointerUp = () => {
    drag.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  const handleTake = async () => {
    if (!pageObj) return;
    const region = {
      x0: box.x / viewScale,
      y0: box.y / viewScale,
      x1: (box.x + box.w) / viewScale,
      y1: (box.y + box.h) / viewScale,
    };
    const dpi = 4;
    const vp = pageObj.getViewport({ scale: dpi });
    const full = document.createElement('canvas');
    full.width = Math.ceil(vp.width); full.height = Math.ceil(vp.height);
    const fctx = full.getContext('2d');
    fctx.fillStyle = '#fff'; fctx.fillRect(0, 0, full.width, full.height);
    await pageObj.render({ canvasContext: fctx, viewport: vp }).promise;
    const sx = Math.round(region.x0 * dpi), sy = Math.round(region.y0 * dpi);
    const sw = Math.round((region.x1 - region.x0) * dpi), sh = Math.round((region.y1 - region.y0) * dpi);
    const out = document.createElement('canvas');
    out.width = sw; out.height = sh;
    const octx = out.getContext('2d');
    octx.fillStyle = '#fff'; octx.fillRect(0, 0, sw, sh);
    octx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
    onApply(out.toDataURL('image/png'), curPage);
  };

  const handles = [
    ['nw','-top-1.5 -left-1.5 cursor-nwse-resize'], ['n','-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'], ['ne','-top-1.5 -right-1.5 cursor-nesw-resize'],
    ['w','top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize'], ['e','top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize'],
    ['sw','-bottom-1.5 -left-1.5 cursor-nesw-resize'], ['s','-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'], ['se','-bottom-1.5 -right-1.5 cursor-nwse-resize'],
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Crop className="w-4 h-4 text-blue-400" /> Penyesuaian Vektor Area Manual
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <button disabled={curPage <= 1} onClick={() => setCurPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs disabled:opacity-40">‹</button>
              <span className="text-xs text-gray-400 font-mono">Hal {curPage}/{totalPages}</span>
              <button disabled={curPage >= totalPages} onClick={() => setCurPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs disabled:opacity-40">›</button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-5 py-2 text-xs text-gray-400 border-b border-gray-800">
          Geser kotak untuk memilih area vektor PDF, lalu klik <span className="text-blue-300 font-semibold">Ambil Vektor</span>.
        </div>

        <div ref={wrapRef} className="relative overflow-auto p-4 flex-1 flex items-start justify-center bg-gray-950">
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-950/70">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          <div className="relative" style={{ lineHeight: 0 }}>
            <canvas ref={canvasRef} className="rounded-lg shadow-lg select-none" style={{ maxWidth: '100%', height: 'auto' }} />
            {!rendering && canvasRef.current && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/10 cursor-move"
                style={{
                  left: `${(box.x / canvasRef.current.width) * 100}%`,
                  top: `${(box.y / canvasRef.current.height) * 100}%`,
                  width: `${(box.w / canvasRef.current.width) * 100}%`,
                  height: `${(box.h / canvasRef.current.height) * 100}%`,
                }}
                onPointerDown={(e) => onPointerDown(e, 'move')}
              >
                {handles.map(([mode, cls]) => (
                  <span
                    key={mode}
                    onPointerDown={(e) => onPointerDown(e, mode)}
                    className={`absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm ${cls}`}
                  />
                ))}
              </div>
            )}
            {/* Tombol konfirmasi mengambang, menempel di kotak crop itu sendiri.
                Kalau kotak berada di bagian bawah kanvas, tombol dipindah ke ATAS
                kotak supaya tidak pernah tersembunyi/terlihat macet. */}
            {!rendering && canvasRef.current && (() => {
              const cw = canvasRef.current.width;
              const ch = canvasRef.current.height;
              const nearBottom = box.y + box.h > ch - 56;
              const topPct = nearBottom
                ? ((box.y - 48) / ch) * 100
                : ((box.y + box.h + 10) / ch) * 100;
              const clampedTop = Math.max(0, Math.min(100, topPct));
              const leftPct = (box.x / cw) * 100;
              const widthPct = (box.w / cw) * 100;
              return (
                <div
                  className="absolute flex items-center gap-1.5 z-20"
                  style={{
                    top: `${clampedTop}%`,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onClose}
                    className="p-1.5 rounded-full bg-gray-900/90 border border-gray-600 text-gray-300 hover:bg-gray-800 shadow-lg"
                    title="Batal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleTake}
                    className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white shadow-lg shadow-blue-600/40 flex items-center gap-1 px-2.5"
                    title="Ambil Vektor"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">Ambil</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm">Batal</button>
          <button onClick={handleTake} disabled={rendering} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            <Check className="w-4 h-4" /> Ambil Vektor
          </button>
        </div>
      </div>
    </div>
  );
}