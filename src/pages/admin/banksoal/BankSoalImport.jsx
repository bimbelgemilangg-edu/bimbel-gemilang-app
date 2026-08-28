// src/pages/admin/banksoal/BankSoalImport.jsx
// ============================================================
// Halaman admin: unggah PDF berisi soal -> soal dipotong PER BUTIR
// (tanpa AI) -> teks soal & opsinya ditranskripsi OCR.space + Groq
// -> admin meninjau & mengoreksi -> simpan ke Bank Soal.
// ============================================================

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  
  import 'katex/dist/katex.min.css';
  import { InlineMath } from 'react-katex';
  
  // ============================================================
  // KONSTANTA
  // ============================================================
  
  const PDFJS_SCRIPT =
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
  
  const PDFJS_WORKER =
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  
  const RENDER_SCALE = 2.2;
  const LEFT_MARGIN_TOLERANCE = 40;
  const COLUMN_SEGMENT_GAP = 60;
  const NORMAL_LINE_GAP_MAX = 22;
  const MIN_FIGURE_GAP = 40;
  
  const STATUS = {
    IDLE: 'idle',
    LOADING_PDF: 'loading_pdf',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    DONE: 'done',
    ERROR: 'error',
  };
  
  const TIPE_SOAL_META = {
    pilihan_ganda: { label: 'Pilihan Ganda', color: '#1d4ed8', bg: '#eff6ff' },
    pernyataan_kompleks: {
      label: 'Pernyataan Kompleks (1,2,3,4)',
      color: '#7e22ce',
      bg: '#faf5ff',
    },
    hubungan_kuantitas: {
      label: 'Hubungan Kuantitas (P & Q)',
      color: '#047857',
      bg: '#ecfdf5',
    },
    isian_singkat: {
      label: 'Isian Singkat / Nilai',
      color: '#b45309',
      bg: '#fffbeb',
    },
  };
  
  // ============================================================
  // FUNGSI BANTU
  // ============================================================
  
  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB'];
    let value = bytes;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i += 1;
    }
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  }
  
  function newId() {
    return `q_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
  
  function renderWithLatexPreview(text) {
    if (!text) return null;
  
    const parts = String(text).split(/(\\\(.*?\\\))/g);
  
    return parts.map((part, i) => {
      const match = /^\\\((.*)\\\)$/.exec(part);
  
      if (!match) {
        return part ? <span key={i}>{part}</span> : null;
      }
  
      try {
        return <InlineMath key={i} math={match[1]} />;
      } catch (e) {
        return <span key={i}>{part}</span>;
      }
    });
  }
  
  function canvasToDataUrlScaled(sourceCanvas, maxWidth = 1800, quality = 0.82) {
    const scale = Math.min(1, maxWidth / sourceCanvas.width);
    const width = Math.max(1, Math.round(sourceCanvas.width * scale));
    const height = Math.max(1, Math.round(sourceCanvas.height * scale));
  
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
  
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, width, height);
  
    return out.toDataURL('image/jpeg', quality);
  }
  
  // ============================================================
  // LOADER PDF.JS
  // ============================================================
  
  function ensurePdfJsLoaded() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
  
      const script = document.createElement('script');
      script.src = PDFJS_SCRIPT;
  
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve(window.pdfjsLib);
      };
  
      script.onerror = () =>
        reject(new Error('Gagal memuat pembaca PDF.'));
  
      document.body.appendChild(script);
    });
  }
  
  // ============================================================
  // DETEKSI SOAL DARI PDF (TANPA AI)
  // ============================================================
  
  function detectLeftMargins(items) {
    const xCounts = new Map();
    items.forEach((it) => {
      const xKey = Math.round(it.transform[4] / 5) * 5;
      xCounts.set(xKey, (xCounts.get(xKey) || 0) + 1);
    });
  
    const sortedX = [...xCounts.entries()].sort((a, b) => b[1] - a[1]);
  
    const clusters = [];
    for (const [x, count] of sortedX) {
      const existing = clusters.find(
        (c) => Math.abs(c.x - x) <= LEFT_MARGIN_TOLERANCE,
      );
      if (existing) {
        existing.count += count;
      } else {
        clusters.push({ x, count });
      }
    }
  
    const MIN_LINES_FOR_COLUMN = 5;
  
    return clusters
      .filter((c) => c.count >= MIN_LINES_FOR_COLUMN)
      .sort((a, b) => a.x - b.x)
      .slice(0, 2)
      .map((c) => c.x);
  }
  
  function detectQuestionStarts(items, leftMargins) {
    const lineMap = new Map();
    items.forEach((item) => {
      const yKey = Math.round(item.transform[5] / 2) * 2;
      if (!lineMap.has(yKey)) lineMap.set(yKey, []);
      lineMap.get(yKey).push(item);
    });
  
    const startsByColumn = leftMargins.map(() => []);
  
    lineMap.forEach((lineItems, y) => {
      const sorted = lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
  
      const segments = [];
      let current = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const prevItem = sorted[i - 1];
        const prevRight =
          prevItem.transform[4] + (prevItem.width || 0);
        const gap = sorted[i].transform[4] - prevRight;
  
        if (gap > COLUMN_SEGMENT_GAP) {
          segments.push(current);
          current = [sorted[i]];
        } else {
          current.push(sorted[i]);
        }
      }
      segments.push(current);
  
      for (const segment of segments) {
        const first = segment[0];
        const text = segment.map((i) => i.str).join(' ').trim();
        const matchesNumber = /^\d{1,3}[.)]\s*/.test(text);
        if (!matchesNumber) continue;
  
        let bestColumn = -1;
        let bestDistance = Infinity;
        leftMargins.forEach((marginX, ci) => {
          const distance = Math.abs(first.transform[4] - marginX);
          if (distance <= LEFT_MARGIN_TOLERANCE && distance < bestDistance) {
            bestDistance = distance;
            bestColumn = ci;
          }
        });
  
        if (bestColumn === -1) continue;
  
        startsByColumn[bestColumn].push({
          y,
          number: parseInt(text.match(/^\d{1,3}/)[0], 10),
        });
      }
    });
  
    const result = [];
    startsByColumn.forEach((columnStarts, columnIndex) => {
      const sorted = columnStarts.sort((a, b) => b.y - a.y);
      sorted.forEach((s, i) => {
        result.push({
          y: s.y,
          number: s.number,
          columnIndex,
          nextYInSameColumn: i + 1 < sorted.length ? sorted[i + 1].y : null,
        });
      });
    });
  
    return result.sort((a, b) => {
      if (a.columnIndex !== b.columnIndex) return a.columnIndex - b.columnIndex;
      return b.y - a.y;
    });
  }
  
  async function findImageRegions(page, pdfjsLib) {
    const opList = await page.getOperatorList();
    const regions = [];
    let currentTransform = null;
  
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      if (fn === pdfjsLib.OPS.transform) {
        currentTransform = opList.argsArray[i];
      }
      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintJpegXObject
      ) {
        if (currentTransform) {
          const [a, b, c, d, e, f] = currentTransform;
          const width = Math.hypot(a, b);
          const height = Math.hypot(c, d);
          regions.push({ x: e, y: f, width, height });
        }
      }
    }
    return regions;
  }
  
  function clusterOptionImages(regions) {
    if (regions.length < 2) return null;
    const sorted = [...regions].sort((a, b) => b.y - a.y);
    const groups = [];
    let current = [sorted[0]];
  
    for (let i = 1; i < sorted.length; i++) {
      const prev = current[current.length - 1];
      if (Math.abs(sorted[i].y - prev.y) < 30) {
        current.push(sorted[i]);
      } else {
        groups.push(current);
        current = [sorted[i]];
      }
    }
    groups.push(current);
  
    const candidate = groups.find((g) => {
      if (g.length < 2 || g.length > 5) return false;
      const avgW = g.reduce((s, r) => s + r.width, 0) / g.length;
      return g.every((r) => Math.abs(r.width - avgW) / avgW < 0.4);
    });
  
    if (!candidate) return null;
    return candidate.sort((a, b) => a.x - b.x);
  }
  
  function pdfRectToCanvasRect(viewport, xPdf, yTopPdf, yBottomPdf, widthPdf) {
    const [x1, y1] = viewport.convertToViewportPoint(xPdf, yTopPdf);
    const [x2, y2] = viewport.convertToViewportPoint(xPdf + widthPdf, yBottomPdf);
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    };
  }
  
  function cropCanvasToDataUrl(sourceCanvas, rect, paddingPx = 8, quality = 0.9) {
    const x = Math.max(0, rect.x - paddingPx);
    const y = Math.max(0, rect.y - paddingPx);
    const w = Math.min(sourceCanvas.width - x, rect.width + paddingPx * 2);
    const h = Math.min(sourceCanvas.height - y, rect.height + paddingPx * 2);
    if (w <= 0 || h <= 0) return null;
  
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);
    return out.toDataURL('image/jpeg', quality);
  }
  
  function extractLinesInRange(items, top, bottom, colLeft, colRight) {
    const relevant = items.filter((it) => {
      const x = it.transform[4];
      const y = it.transform[5];
      return (
        y <= top + 14 &&
        y >= bottom + 4 &&
        x >= colLeft - 5 &&
        x <= colRight + 5
      );
    });
  
    const lineMap = new Map();
    relevant.forEach((item) => {
      const yKey = Math.round(item.transform[5] / 2) * 2;
      if (!lineMap.has(yKey)) lineMap.set(yKey, []);
      lineMap.get(yKey).push(item);
    });
  
    return [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([y, lineItems]) => ({
        y,
        text: lineItems
          .sort((a, b) => a.transform[4] - b.transform[4])
          .map((i) => i.str)
          .join(' ')
          .trim(),
      }))
      .filter((l) => l.text.length > 0);
  }
  
  function findFigureGap(lines) {
    let maxGap = 0;
    let gapTop = null;
    let gapBottom = null;
  
    for (let i = 0; i < lines.length - 1; i++) {
      const gap = lines[i].y - lines[i + 1].y;
      if (gap > maxGap) {
        maxGap = gap;
        gapTop = lines[i].y;
        gapBottom = lines[i + 1].y;
      }
    }
  
    if (maxGap < MIN_FIGURE_GAP) return null;
  
    return { top: gapTop, bottom: gapBottom, gap: maxGap };
  }
  
  function splitOptionsFromText(fullText) {
    const matches = [...fullText.matchAll(/(?:^|\s)([A-E])[.)]\s+/g)];
  
    if (matches.length < 2) {
      return { question: fullText.trim(), options: [] };
    }
  
    const question = fullText.slice(0, matches[0].index).trim();
  
    const rawOptions = [];
    for (let i = 0; i < matches.length; i++) {
      const letter = matches[i][1];
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : fullText.length;
      rawOptions.push({ letter, text: fullText.slice(start, end).trim() });
    }
  
    rawOptions.sort((a, b) => a.letter.localeCompare(b.letter));
  
    return { question, options: rawOptions.map((o) => o.text) };
  }
  
  function classifyTipeSoal(fullText, hasImageOptions) {
    const hasNumberedStatements =
      /\(1\)[\s\S]*\(2\)[\s\S]*\(3\)/.test(fullText);
  
    if (hasNumberedStatements) return 'pernyataan_kompleks';
  
    const hasQuantityPQ =
      /kuantitas\s*p/i.test(fullText) && /kuantitas\s*q/i.test(fullText);
  
    if (hasQuantityPQ) return 'hubungan_kuantitas';
  
    if (hasImageOptions) return 'pilihan_ganda';
  
    const optionLetterCount = (
      fullText.match(/(?:^|\s)[A-E][.)]\s+/g) || []
    ).length;
  
    if (optionLetterCount < 2) return 'isian_singkat';
  
    return 'pilihan_ganda';
  }
  
  function cropCanvasRegion(sourceCanvas, x, y, width, height) {
    const sx = Math.max(0, Math.floor(x));
    const sy = Math.max(0, Math.floor(y));
    const sw = Math.min(sourceCanvas.width - sx, Math.floor(width));
    const sh = Math.min(sourceCanvas.height - sy, Math.floor(height));
    if (sw <= 10 || sh <= 10) return null;
  
    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sw, sh);
    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  
    return out;
  }
  
  function cropFigureFromQuestionImage(questionImageDataUrl, bbox) {
    return new Promise((resolve) => {
      if (!bbox) {
        resolve(null);
        return;
      }
  
      const img = new Image();
      img.onload = () => {
        const x = Math.max(0, Math.min(1, Number(bbox.x) || 0));
        const y = Math.max(0, Math.min(1, Number(bbox.y) || 0));
        const w = Math.max(0, Math.min(1 - x, Number(bbox.width) || 0));
        const h = Math.max(0, Math.min(1 - y, Number(bbox.height) || 0));
  
        if (!(w > 0.02) || !(h > 0.02)) {
          resolve(null);
          return;
        }
  
        const sx = Math.round(x * img.width);
        const sy = Math.round(y * img.height);
        const sw = Math.round(w * img.width);
        const sh = Math.round(h * img.height);
  
        const out = document.createElement('canvas');
        out.width = sw;
        out.height = sh;
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve(out.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(null);
      img.src = questionImageDataUrl;
    });
  }
  
  // ============================================================
  // PANGGIL API TRANSKRIPSI
  // ============================================================
  
  async function transcribeQuestionWithAI(questionImageDataUrl) {
    const response = await fetch('/api/smartParseQuiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionCropImage: questionImageDataUrl,
      }),
    });
  
    const data = await response.json();
  
    if (!response.ok || !data.success) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }
  
    return {
      question: typeof data.question === 'string' ? data.question : '',
      options: Array.isArray(data.options) ? data.options : [],
      tipeSoal:
        [
          'pilihan_ganda',
          'pernyataan_kompleks',
          'hubungan_kuantitas',
          'isian_singkat',
        ].includes(data.tipeSoal)
          ? data.tipeSoal
          : 'pilihan_ganda',
      kuantitasP: typeof data.kuantitasP === 'string' ? data.kuantitasP : '',
      kuantitasQ: typeof data.kuantitasQ === 'string' ? data.kuantitasQ : '',
      hasFigure: Boolean(data.hasFigure),
      figureBBox: data.figureBBox || null,
      readingConfidence: data.readingConfidence === 'low' ? 'low' : 'high',
    };
  }
  
  async function transcribePageWithAI(pageImageDataUrl) {
    const response = await fetch('/api/smartParseQuiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'transcribePage',
        pageImage: pageImageDataUrl,
      }),
    });
  
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data?.error || `AI gagal membaca halaman (HTTP ${response.status})`);
    }
  
    return {
      pageType: data.pageType || 'questions',
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
  }
  
  async function transcribePageRegionWithAI(regionImageDataUrl) {
    const response = await fetch('/api/smartParseQuiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'transcribeRegion',
        pageImage: regionImageDataUrl,
      }),
    });
  
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data?.error || `AI gagal membaca kolom (HTTP ${response.status})`);
    }
  
    return {
      pageType: data.pageType || 'questions',
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
  }
  
  function cropNormalizedFromCanvas(sourceCanvas, bbox, paddingPx = 8) {
    if (!bbox) return null;
  
    const x = Math.max(0, Math.min(1, Number(bbox.x) || 0));
    const y = Math.max(0, Math.min(1, Number(bbox.y) || 0));
    const width = Math.max(0, Math.min(1 - x, Number(bbox.width) || 0));
    const height = Math.max(0, Math.min(1 - y, Number(bbox.height) || 0));
  
    if (width <= 0.01 || height <= 0.01) return null;
  
    const px = Math.max(0, Math.floor(x * sourceCanvas.width) - paddingPx);
    const py = Math.max(0, Math.floor(y * sourceCanvas.height) - paddingPx);
    const right = Math.min(
      sourceCanvas.width,
      Math.ceil((x + width) * sourceCanvas.width) + paddingPx,
    );
    const bottom = Math.min(
      sourceCanvas.height,
      Math.ceil((y + height) * sourceCanvas.height) + paddingPx,
    );
  
    const w = right - px;
    const h = bottom - py;
    if (w <= 0 || h <= 0) return null;
  
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
  
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(sourceCanvas, px, py, w, h, 0, 0, w, h);
  
    return out.toDataURL('image/jpeg', 0.92);
  }
  
  function relativeFigureBBox(questionBBox, figureBBox) {
    if (!questionBBox || !figureBBox) return null;
    const fx = Number(figureBBox.x) || 0;
    const fy = Number(figureBBox.y) || 0;
    const fw = Number(figureBBox.width) || 0;
    const fh = Number(figureBBox.height) || 0;
    const qx = Number(questionBBox.x) || 0;
    const qy = Number(questionBBox.y) || 0;
    const qw = Number(questionBBox.width) || 0;
    const qh = Number(questionBBox.height) || 0;
    if (qw <= 0 || qh <= 0) return null;
    return {
      x: Math.max(0, Math.min(1, (fx - qx) / qw)),
      y: Math.max(0, Math.min(1, (fy - qy) / qh)),
      width: Math.max(0, Math.min(1, fw / qw)),
      height: Math.max(0, Math.min(1, fh / qh)),
    };
  }
  
  // ============================================================
  // KOMPONEN UTAMA
  // ============================================================
  
  export default function BankSoalImport({
    folderId = null,
    folderName = 'Bank Soal',
    onSaveQuestions,
    onCancel,
  }) {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState(STATUS.IDLE);
    const [errorMessage, setErrorMessage] = useState('');
  
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedPageNumbers, setSelectedPageNumbers] = useState([]);
    const [pagePreviewImages, setPagePreviewImages] = useState([]);
    const [showPagePicker, setShowPagePicker] = useState(false);
  
    const [pages, setPages] = useState([]);
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  
    const [saving, setSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
  
    const pdfDocRef = useRef(null);
    const abortRef = useRef(false);
    const pauseRef = useRef(false);
  
    // ============================================================
    // MUAT PDF
    // ============================================================
  
    const handleFileChange = useCallback(async (event) => {
      const picked = event.target.files?.[0];
      if (!picked) return;
  
      if (picked.type !== 'application/pdf') {
        setErrorMessage('Berkas harus PDF.');
        setStatus(STATUS.ERROR);
        return;
      }
  
      setFile(picked);
      setErrorMessage('');
      setPages([]);
      setSavedCount(0);
      setStatus(STATUS.LOADING_PDF);
  
      try {
        const pdfjsLib = await ensurePdfJsLoaded();
        const buffer = await picked.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  
        pdfDocRef.current = { doc, pdfjsLib };
        setTotalPages(doc.numPages);
        setSelectedPageNumbers(Array.from({ length: doc.numPages }, (_, i) => i + 1));
        setPagePreviewImages([]);
        setShowPagePicker(true);
        setStatus(STATUS.IDLE);
  
        // Generate preview
        const previews = [];
        for (let pageNumber = 1; pageNumber <= Math.min(doc.numPages, 10); pageNumber += 1) {
          try {
            const pg = await doc.getPage(pageNumber);
            const vp = pg.getViewport({ scale: 0.2 });
            const cv = document.createElement('canvas');
            cv.width = Math.max(1, Math.round(vp.width));
            cv.height = Math.max(1, Math.round(vp.height));
            const cx = cv.getContext('2d', { alpha: false });
            cx.fillStyle = '#ffffff';
            cx.fillRect(0, 0, cv.width, cv.height);
            await pg.render({ canvasContext: cx, viewport: vp }).promise;
            previews.push({ pageNumber, image: cv.toDataURL('image/jpeg', 0.5) });
          } catch (_) {
            previews.push({ pageNumber, image: '' });
          }
          setPagePreviewImages([...previews]);
        }
      } catch (error) {
        setErrorMessage(
          `Berkas tidak bisa dibuka: ${error?.message || 'berkas mungkin rusak.'}`,
        );
        setStatus(STATUS.ERROR);
      }
    }, []);
  
    const togglePageSelection = useCallback((pageNumber) => {
      setSelectedPageNumbers((prev) =>
        prev.includes(pageNumber)
          ? prev.filter((n) => n !== pageNumber)
          : [...prev, pageNumber].sort((a, b) => a - b)
      );
    }, []);
  
    const selectAllPages = useCallback(() => {
      setSelectedPageNumbers(Array.from({ length: totalPages }, (_, i) => i + 1));
    }, [totalPages]);
  
    const clearAllPages = useCallback(() => setSelectedPageNumbers([]), []);
  
    const invertPages = useCallback(() => {
      setSelectedPageNumbers((prev) => {
        const set = new Set(prev);
        return Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => !set.has(n));
      });
    }, [totalPages]);
  
    // ============================================================
    // PROSES SATU HALAMAN
    // ============================================================
  
    const processOnePage = useCallback(async (pageNumber) => {
      const ref = pdfDocRef.current;
      if (!ref) throw new Error('Dokumen PDF belum siap.');
      const { doc } = ref;
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
  
      const pageImage = canvas.toDataURL('image/jpeg', 0.84);
  
      try {
        const analysis = await transcribePageWithAI(canvasToDataUrlScaled(canvas, 3200, 0.84));
        let detected = Array.isArray(analysis.questions) ? analysis.questions : [];
  
        // Fallback: coba split 2 kolom
        if (!detected.length && analysis.pageType !== 'pembahasan') {
          const mid = Math.floor(canvas.width / 2);
          const gap = Math.max(8, Math.round(canvas.width * 0.015));
          const leftW = Math.max(1, mid - gap);
          const rightX = Math.min(canvas.width - 1, mid + gap);
          const rightW = Math.max(1, canvas.width - rightX);
  
          const leftCanvas = cropCanvasRegion(canvas, 0, 0, leftW, canvas.height);
          const rightCanvas = cropCanvasRegion(canvas, rightX, 0, rightW, canvas.height);
  
          const [la, ra] = await Promise.all([
            leftCanvas ? transcribePageRegionWithAI(leftCanvas.toDataURL('image/jpeg', 0.84)) : { questions: [] },
            rightCanvas ? transcribePageRegionWithAI(rightCanvas.toDataURL('image/jpeg', 0.84)) : { questions: [] },
          ]);
  
          const mapRegion = (list, ox, rw) => (Array.isArray(list) ? list : []).map((q) => ({
            ...q,
            bbox: q.bbox ? {
              x: (ox + (Number(q.bbox.x) || 0) * rw) / canvas.width,
              y: Number(q.bbox.y) || 0,
              width: ((Number(q.bbox.width) || 0) * rw) / canvas.width,
              height: Number(q.bbox.height) || 0,
            } : null,
            figureBBox: q.figureBBox ? {
              x: (ox + (Number(q.figureBBox.x) || 0) * rw) / canvas.width,
              y: Number(q.figureBBox.y) || 0,
              width: ((Number(q.figureBBox.width) || 0) * rw) / canvas.width,
              height: Number(q.figureBBox.height) || 0,
            } : null,
          }));
  
          detected = [
            ...mapRegion(la.questions || [], 0, leftW),
            ...mapRegion(ra.questions || [], rightX, rightW),
          ];
          detected.sort((a, b) => {
            const ax = Number(a?.bbox?.x) || 0;
            const bx = Number(b?.bbox?.x) || 0;
            return Math.abs(ax - bx) > 0.2 ? ax - bx : (Number(a?.bbox?.y) || 0) - (Number(b?.bbox?.y) || 0);
          });
        }
  
        if (analysis.pageType === 'pembahasan') {
          return { pageImage, questions: [], isPembahasanPage: true };
        }
  
        const questions = [];
        const seen = new Set();
  
        for (const q of detected) {
          if (!q?.bbox) continue;
          const num = Number(q.printedNumber);
          if (!Number.isFinite(num)) continue;
          const key = `${num}-${Math.round((Number(q.bbox.x) || 0) * 1000)}`;
          if (seen.has(key)) continue;
          seen.add(key);
  
          const rawCropImage = cropNormalizedFromCanvas(canvas, q.bbox, 12);
          if (!rawCropImage) continue;
  
          const relFig = relativeFigureBBox(q.bbox, q.figureBBox);
          const qImage = relFig ? (await cropFigureFromQuestionImage(rawCropImage, relFig)) || '' : '';
  
          // Transkripsi teks soal dari crop
          let transcribed = { question: '', options: [], tipeSoal: 'pilihan_ganda', kuantitasP: '', kuantitasQ: '' };
          try {
            transcribed = await transcribeQuestionWithAI(rawCropImage);
          } catch (e) {
            console.warn('Transkripsi gagal untuk soal', num, e.message);
          }
  
          questions.push({
            id: newId(),
            pageNumber,
            printedNumber: num,
            rawCropImage,
            question: transcribed.question || '',
            options: Array.isArray(transcribed.options) && transcribed.options.length
              ? transcribed.options
              : ['', '', '', ''],
            tipeSoal: transcribed.tipeSoal || 'pilihan_ganda',
            kuantitasP: transcribed.kuantitasP || '',
            kuantitasQ: transcribed.kuantitasQ || '',
            optionsAreImages: false,
            optionImages: [],
            qImage,
            tableHtml: '',
            correct: null,
            explanation: '',
            shortAnswerValue: '',
            approved: false,
            readingConfidence: transcribed.readingConfidence || 'high',
            possibleMathNotationIssue: false,
            aiRetryInProgress: false,
            transcribeError: null,
            aiSuggestion: null,
          });
        }
  
        return { pageImage, questions, isPembahasanPage: false };
      } catch (error) {
        console.error('Error processing page:', error);
        return { pageImage, questions: [], error: error.message };
      }
    }, []);
  
    // ============================================================
    // PROSES SEMUA HALAMAN
    // ============================================================
  
    const processPages = useCallback(async () => {
      abortRef.current = false;
      pauseRef.current = false;
      setStatus(STATUS.PROCESSING);
      setErrorMessage('');
  
      const selected = selectedPageNumbers.slice().sort((a, b) => a - b);
      if (!selected.length) {
        setStatus(STATUS.IDLE);
        setErrorMessage('Pilih minimal satu halaman.');
        return;
      }
  
      for (const pageNumber of selected) {
        if (abortRef.current) break;
  
        while (pauseRef.current && !abortRef.current) {
          await new Promise((r) => setTimeout(r, 300));
        }
        if (abortRef.current) break;
  
        setCurrentPage(pageNumber);
  
        try {
          const result = await processOnePage(pageNumber);
          setPages((prev) => [
            ...prev,
            {
              pageNumber,
              pageImage: result.pageImage || '',
              questions: result.questions || [],
              error: result.error || null,
              isPembahasanPage: result.isPembahasanPage || false,
            },
          ]);
        } catch (error) {
          setPages((prev) => [
            ...prev,
            {
              pageNumber,
              pageImage: '',
              questions: [],
              error: error?.message || 'Gagal memproses halaman ini.',
              isPembahasanPage: false,
            },
          ]);
        }
      }
  
      setStatus(abortRef.current ? STATUS.IDLE : STATUS.DONE);
    }, [selectedPageNumbers, processOnePage]);
  
    // ============================================================
    // UPDATE & REMOVE SOAL
    // ============================================================
  
    const updateQuestion = useCallback((pageNumber, questionId, patch) => {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber !== pageNumber
            ? p
            : {
                ...p,
                questions: p.questions.map((q) =>
                  q.id === questionId ? { ...q, ...patch } : q
                ),
              }
        )
      );
    }, []);
  
    const removeQuestion = useCallback((pageNumber, questionId) => {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber !== pageNumber
            ? p
            : { ...p, questions: p.questions.filter((q) => q.id !== questionId) }
        )
      );
    }, []);
  
    const retryQuestionWithAI = useCallback(
      async (pageNumber, questionId) => {
        const page = pages.find((p) => p.pageNumber === pageNumber);
        const question = page?.questions.find((q) => q.id === questionId);
        if (!question?.rawCropImage) return;
  
        updateQuestion(pageNumber, questionId, {
          aiRetryInProgress: true,
          transcribeError: null,
        });
  
        try {
          const transcript = await transcribeQuestionWithAI(question.rawCropImage);
  
          const figureImage = transcript.hasFigure
            ? (await cropFigureFromQuestionImage(
                question.rawCropImage,
                transcript.figureBBox
              )) || ''
            : '';
  
          updateQuestion(pageNumber, questionId, {
            question: transcript.question,
            options: Array.isArray(transcript.options) && transcript.options.length
              ? transcript.options
              : ['', '', '', ''],
            tipeSoal: transcript.tipeSoal,
            kuantitasP: transcript.kuantitasP || '',
            kuantitasQ: transcript.kuantitasQ || '',
            qImage: figureImage,
            readingConfidence: transcript.readingConfidence,
            aiRetryInProgress: false,
            transcribeError: null,
          });
        } catch (error) {
          updateQuestion(pageNumber, questionId, {
            transcribeError: error?.message || 'AI gagal membaca soal ini.',
            aiRetryInProgress: false,
          });
        }
      },
      [pages, updateQuestion]
    );
  
    const retryPage = useCallback(
      async (pageNumber) => {
        setErrorMessage('');
        try {
          const result = await processOnePage(pageNumber);
          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNumber
                ? {
                    pageNumber,
                    pageImage: result.pageImage || '',
                    questions: result.questions || [],
                    error: result.error || null,
                    isPembahasanPage: result.isPembahasanPage || false,
                  }
                : p
            )
          );
        } catch (error) {
          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNumber
                ? { ...p, error: error?.message || 'Masih gagal.' }
                : p
            )
          );
        }
      },
      [processOnePage]
    );
  
    // ============================================================
    // SIMPAN
    // ============================================================
  
    const allQuestions = useMemo(() => pages.flatMap((p) => p.questions), [pages]);
    const approvedQuestions = useMemo(() => allQuestions.filter((q) => q.approved), [allQuestions]);
    const selectedPage = pages[selectedPageIndex] || null;
  
    useEffect(() => {
      if (status === STATUS.PROCESSING && pages.length > 0) {
        setSelectedPageIndex(pages.length - 1);
      }
    }, [pages.length, status]);
  
    const handleSave = useCallback(async () => {
      if (approvedQuestions.length === 0) return;
  
      setSaving(true);
      setErrorMessage('');
  
      try {
        const payload = approvedQuestions.map((q) => ({
          type: q.tipeSoal === 'isian_singkat' ? 'shortanswer' : 'multiple',
          tipeSoal: q.tipeSoal,
          question: q.question?.trim() || (q.printedNumber ? `Soal ${q.printedNumber}` : 'Soal (lihat gambar)'),
          qImage: q.qImage || '',
          options: q.optionsAreImages ? [] : q.options.filter((o) => o.trim().length > 0),
          optionImages: q.optionsAreImages ? q.optionImages : [],
          optionsAreImages: Boolean(q.optionsAreImages),
          kuantitasP: q.tipeSoal === 'hubungan_kuantitas' ? q.kuantitasP || '' : '',
          kuantitasQ: q.tipeSoal === 'hubungan_kuantitas' ? q.kuantitasQ || '' : '',
          shortAnswer: q.tipeSoal === 'isian_singkat' ? q.shortAnswerValue || '' : '',
          correct: Number.isInteger(q.correct) ? q.correct : null,
          explanation: q.explanation || '',
          needsAnswerGeneration:
            q.tipeSoal === 'isian_singkat'
              ? !(q.shortAnswerValue || '').trim()
              : !Number.isInteger(q.correct),
          difficulty: q.difficulty || '',
          topik: q.topik || '',
          folderId,
          folderName,
          sourceName: file?.name || '',
          sourcePage: q.pageNumber,
          sourcePrintedNumber: q.printedNumber || null,
          tableHtml: q.tableHtml || '',
          createdAt: new Date().toISOString(),
        }));
  
        await onSaveQuestions?.(payload);
        setSavedCount(payload.length);
  
        setPages((prev) =>
          prev.map((p) => ({
            ...p,
            questions: p.questions.filter((q) => !q.approved),
          }))
        );
      } catch (error) {
        setErrorMessage(`Gagal menyimpan: ${error?.message || 'coba lagi sebentar.'}`);
      } finally {
        setSaving(false);
      }
    }, [approvedQuestions, folderId, folderName, file, onSaveQuestions]);
  
    const isBusy = status === STATUS.PROCESSING || status === STATUS.LOADING_PDF;
  
    // ============================================================
    // RENDER
    // ============================================================
  
    return (
      <div className="bsi">
        <style>{styles}</style>
  
        <header className="bsi-head">
          <div>
            <p className="bsi-eyebrow">{folderName}</p>
            <h1 className="bsi-title">Tambah soal dari PDF</h1>
            <p className="bsi-sub">
              AI membaca setiap halaman soal sekaligus dan mengekstrak semua
              butir pada halaman tersebut. Teks, matematika, tabel, grafik,
              dan gambar tetap dipertahankan, lalu hasilnya bisa diedit
              admin sebelum disetujui.
            </p>
          </div>
          {onCancel && (
            <button type="button" className="bsi-btn ghost" onClick={onCancel}>
              Tutup
            </button>
          )}
        </header>
  
        {/* UNGGAH */}
        {!file && (
          <label className="bsi-drop">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              hidden
            />
            <span className="bsi-drop-title">Pilih berkas PDF</span>
            <span className="bsi-drop-hint">
              PDF teks maupun scan dapat digunakan. Setelah upload, pilih manual halaman yang akan diproses agar cover/pembahasan tidak ikut memakan quota AI.
            </span>
          </label>
        )}
  
        {/* KENDALI */}
        {file && (
          <section className="bsi-panel">
            <div className="bsi-fileinfo">
              <span className="bsi-filename">{file.name}</span>
              <span className="bsi-meta">
                {formatBytes(file.size)}
                {totalPages > 0 && ` · ${totalPages} halaman`}
              </span>
            </div>
  
            {totalPages > 0 && status !== STATUS.PROCESSING && (
              <div className="bsi-range">
                <span className="bsi-selection-summary">
                  <strong>{selectedPageNumbers.length}</strong> dipilih ·{' '}
                  <strong>{Math.max(0, totalPages - selectedPageNumbers.length)}</strong> dikecualikan
                </span>
                <button
                  type="button"
                  className="bsi-btn"
                  onClick={() => setShowPagePicker((v) => !v)}
                >
                  {showPagePicker ? 'Tutup pilihan halaman' : 'Pilih / kecualikan halaman'}
                </button>
                <button
                  type="button"
                  className="bsi-btn primary"
                  onClick={processPages}
                  disabled={isBusy || selectedPageNumbers.length === 0}
                >
                  {pages.length > 0 ? 'Baca lagi halaman terpilih' : 'Mulai baca halaman terpilih'}
                </button>
              </div>
            )}
  
            {status === STATUS.PROCESSING && (
              <div className="bsi-progress">
                <div className="bsi-bar">
                  <div
                    className="bsi-bar-fill"
                    style={{
                      width: `${
                        (Math.max(1, selectedPageNumbers.indexOf(currentPage) + 1) /
                          Math.max(1, selectedPageNumbers.length)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="bsi-progress-row">
                  <span>
                    Memproses halaman {currentPage} · {selectedPageNumbers.length} halaman dipilih
                  </span>
                  <div className="bsi-progress-actions">
                    <button
                      type="button"
                      className="bsi-btn ghost sm"
                      onClick={() => {
                        pauseRef.current = !pauseRef.current;
                        setStatus(pauseRef.current ? STATUS.PAUSED : STATUS.PROCESSING);
                      }}
                    >
                      {pauseRef.current ? 'Lanjutkan' : 'Jeda'}
                    </button>
                    <button
                      type="button"
                      className="bsi-btn ghost sm"
                      onClick={() => {
                        abortRef.current = true;
                      }}
                    >
                      Hentikan
                    </button>
                  </div>
                </div>
              </div>
            )}
  
            {status === STATUS.PAUSED && (
              <p className="bsi-note">
                Dijeda di halaman {currentPage}. Hasil yang sudah
                diproses tetap tersimpan di layar ini.
              </p>
            )}
          </section>
        )}
  
        {showPagePicker && totalPages > 0 && (
          <section className="bsi-page-picker-panel">
            <div className="bsi-page-picker-head">
              <div>
                <h3 className="bsi-page-picker-title">Pilih halaman yang diproses AI</h3>
                <p className="bsi-page-picker-sub">
                  Centang halaman soal. Hilangkan centang untuk cover, kisi-kisi, pembahasan, iklan, atau halaman lain yang tidak dipakai.
                </p>
              </div>
              <div className="bsi-page-picker-actions">
                <button type="button" className="bsi-btn ghost sm" onClick={selectAllPages}>
                  Pilih semua
                </button>
                <button type="button" className="bsi-btn ghost sm" onClick={clearAllPages}>
                  Hapus semua
                </button>
                <button type="button" className="bsi-btn ghost sm" onClick={invertPages}>
                  Balik pilihan
                </button>
              </div>
            </div>
            <div className="bsi-page-picker-grid">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                const selected = selectedPageNumbers.includes(pageNumber);
                const preview = pagePreviewImages.find((p) => p.pageNumber === pageNumber)?.image || '';
                return (
                  <button
                    type="button"
                    key={pageNumber}
                    className={`bsi-page-select-card${selected ? ' selected' : ' excluded'}`}
                    onClick={() => togglePageSelection(pageNumber)}
                    aria-pressed={selected}
                  >
                    <span className="bsi-page-select-thumb">
                      {preview ? (
                        <img src={preview} alt={`Halaman ${pageNumber}`} />
                      ) : (
                        <span className="bsi-page-thumb-loading">Memuat…</span>
                      )}
                      <span className="bsi-page-select-check">{selected ? '✓' : '×'}</span>
                    </span>
                    <span className="bsi-page-select-label">Halaman {pageNumber}</span>
                    <span className="bsi-page-select-status">
                      {selected ? 'Diproses AI' : 'Dikecualikan'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
  
        {errorMessage && <div className="bsi-alert">{errorMessage}</div>}
  
        {savedCount > 0 && (
          <div className="bsi-alert ok">{savedCount} soal tersimpan ke {folderName}.</div>
        )}
  
        {/* TINJAU */}
        {pages.length > 0 && (
          <section className="bsi-review">
            <nav className="bsi-pagelist" aria-label="Daftar halaman">
              {pages.map((p, i) => (
                <button
                  type="button"
                  key={p.pageNumber}
                  className={`bsi-pagechip${i === selectedPageIndex ? ' active' : ''}${p.error ? ' failed' : ''}`}
                  onClick={() => setSelectedPageIndex(i)}
                >
                  <span className="bsi-pagenum">Hal {p.pageNumber}</span>
                  <span className="bsi-pagecount">
                    {p.error ? 'gagal' : `${p.questions.length} soal`}
                  </span>
                </button>
              ))}
            </nav>
  
            {selectedPage && (
              <div className="bsi-compare">
                <div className="bsi-original">
                  <div className="bsi-panel-label">Halaman asli {selectedPage.pageNumber}</div>
                  {selectedPage.pageImage ? (
                    <img src={selectedPage.pageImage} alt={`Halaman ${selectedPage.pageNumber}`} />
                  ) : (
                    <div className="bsi-empty">
                      Halaman ini gagal dirender.
                      <button type="button" className="bsi-btn ghost sm" onClick={() => retryPage(selectedPage.pageNumber)}>
                        Ulangi
                      </button>
                    </div>
                  )}
                </div>
  
                <div className="bsi-parsed">
                  <div className="bsi-panel-label">Soal hasil AI — periksa transkripsi sebelum disetujui</div>
  
                  {selectedPage.error && (
                    <div className="bsi-empty">
                      {selectedPage.error}
                      <button type="button" className="bsi-btn ghost sm" onClick={() => retryPage(selectedPage.pageNumber)}>
                        Ulangi halaman ini
                      </button>
                    </div>
                  )}
  
                  {!selectedPage.error && selectedPage.isPembahasanPage && (
                    <div className="bsi-empty pembahasan">
                      ✅ Halaman ini terdeteksi sebagai bagian <strong>PEMBAHASAN</strong> (kunci
                      jawaban) -- SENGAJA dilewati, bukan soal baru.
                    </div>
                  )}
  
                  {!selectedPage.error && !selectedPage.isPembahasanPage && selectedPage.questions.length === 0 && (
                    <div className="bsi-empty">
                      AI tidak menemukan butir soal pada halaman ini.
                      Bisa jadi halaman ini memang sampul/kisi-kisi/pembahasan,
                      atau AI belum berhasil menentukan batas soalnya.
                      Tekan "Ulangi" untuk meminta AI membaca halaman ini lagi.
                    </div>
                  )}
  
                  {selectedPage.questions.map((q, qi) => (
                    <article key={q.id} className={`bsi-card${q.approved ? ' approved' : ''}`}>
                      <div className="bsi-card-head">
                        <span className="bsi-card-no">
                          Soal {qi + 1}
                          {q.printedNumber ? ` (tercetak no. ${q.printedNumber})` : ''}
                        </span>
                        <span
                          className="bsi-tipe-badge"
                          style={{
                            color: TIPE_SOAL_META[q.tipeSoal]?.color,
                            background: TIPE_SOAL_META[q.tipeSoal]?.bg,
                          }}
                        >
                          {TIPE_SOAL_META[q.tipeSoal]?.label || 'Pilihan Ganda'}
                        </span>
                        <div className="bsi-card-actions">
                          <select
                            className="bsi-select"
                            value={q.difficulty || ''}
                            onChange={(e) =>
                              updateQuestion(selectedPage.pageNumber, q.id, {
                                difficulty: e.target.value,
                              })
                            }
                          >
                            <option value="">Tingkat kesulitan…</option>
                            <option value="Mudah">Mudah</option>
                            <option value="Sedang">Sedang</option>
                            <option value="Sulit">Sulit</option>
                          </select>
                          <label className="bsi-check">
                            <input
                              type="checkbox"
                              checked={q.approved}
                              onChange={(e) =>
                                updateQuestion(selectedPage.pageNumber, q.id, {
                                  approved: e.target.checked,
                                })
                              }
                            />
                            Setujui
                          </label>
                          <button
                            type="button"
                            className="bsi-btn ghost sm"
                            onClick={() => retryQuestionWithAI(selectedPage.pageNumber, q.id)}
                            disabled={q.aiRetryInProgress}
                          >
                            {q.aiRetryInProgress ? 'Membaca…' : 'AI baca ulang'}
                          </button>
                          <button
                            type="button"
                            className="bsi-btn ghost sm"
                            onClick={() => removeQuestion(selectedPage.pageNumber, q.id)}
                          >
                            Buang
                          </button>
                        </div>
                      </div>
  
                      <div className="bsi-transcript-row">
                        {q.rawCropImage && (
                          <img src={q.rawCropImage} alt="Crop asli" className="bsi-rawcrop" />
                        )}
  
                        <div className="bsi-transcript-fields">
                          <textarea
                            className="bsi-input bsi-question-input"
                            rows={3}
                            placeholder="Teks soal..."
                            value={q.question || ''}
                            onChange={(e) =>
                              updateQuestion(selectedPage.pageNumber, q.id, {
                                question: e.target.value,
                              })
                            }
                          />
  
                          {q.question && (
                            <div className="bsi-latex-preview">
                              <span className="bsi-latex-preview-label">
                                Pratinjau (begini nanti tampilnya ke siswa):
                              </span>
                              <div className="bsi-latex-preview-body">
                                {renderWithLatexPreview(q.question)}
                              </div>
                            </div>
                          )}
  
                          {q.qImage && (
                            <div className="bsi-figure-wrap">
                              <span className="bsi-figure-label">
                                Diagram/gambar terdeteksi dalam soal ini:
                              </span>
                              <img src={q.qImage} alt="Diagram soal" className="bsi-figure-img" />
                            </div>
                          )}
  
                          {q.tipeSoal === 'hubungan_kuantitas' && (
                            <div className="bsi-pq-row">
                              <div className="bsi-pq-box">
                                <span className="bsi-pq-label">Kuantitas P</span>
                                <input
                                  className="bsi-input"
                                  value={q.kuantitasP || ''}
                                  onChange={(e) =>
                                    updateQuestion(selectedPage.pageNumber, q.id, {
                                      kuantitasP: e.target.value,
                                    })
                                  }
                                />
                                {q.kuantitasP && (
                                  <div className="bsi-pq-preview">
                                    {renderWithLatexPreview(q.kuantitasP)}
                                  </div>
                                )}
                              </div>
                              <div className="bsi-pq-box">
                                <span className="bsi-pq-label">Kuantitas Q</span>
                                <input
                                  className="bsi-input"
                                  value={q.kuantitasQ || ''}
                                  onChange={(e) =>
                                    updateQuestion(selectedPage.pageNumber, q.id, {
                                      kuantitasQ: e.target.value,
                                    })
                                  }
                                />
                                {q.kuantitasQ && (
                                  <div className="bsi-pq-preview">
                                    {renderWithLatexPreview(q.kuantitasQ)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
  
                          {q.transcribeError && (
                            <p className="bsi-flag">Percobaan "Baca ulang (AI)" gagal -- ({q.transcribeError}).</p>
                          )}
  
                          {!q.transcribeError && q.readingConfidence === 'low' && (
                            <p className="bsi-flag">
                              AI kurang yakin membaca sebagian teks ini -- cocokkan dengan crop asli di sebelah kiri.
                            </p>
                          )}
  
                          {q.tipeSoal === 'isian_singkat' ? (
                            <div className="bsi-shortanswer-wrap">
                              <span className="bsi-figure-label">
                                Jawaban singkat (opsional, boleh dikosongkan):
                              </span>
                              <input
                                className="bsi-input"
                                placeholder="Nilai/jawaban yang diminta..."
                                value={q.shortAnswerValue || ''}
                                onChange={(e) =>
                                  updateQuestion(selectedPage.pageNumber, q.id, {
                                    shortAnswerValue: e.target.value,
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <ul className="bsi-option-list">
                              {q.options.map((opt, oi) => (
                                <li key={oi}>
                                  <button
                                    type="button"
                                    className={`bsi-letter-btn${q.correct === oi ? ' selected' : ''}`}
                                    onClick={() =>
                                      updateQuestion(selectedPage.pageNumber, q.id, {
                                        correct: oi,
                                      })
                                    }
                                    title="Tandai sebagai jawaban benar (opsional)"
                                  >
                                    {String.fromCharCode(65 + oi)}
                                  </button>
                                  <input
                                    className="bsi-input"
                                    value={opt}
                                    onChange={(e) => {
                                      const options = [...q.options];
                                      options[oi] = e.target.value;
                                      updateQuestion(selectedPage.pageNumber, q.id, {
                                        options,
                                      });
                                    }}
                                  />
                                  {/\\\(.*\\\)/.test(opt) && (
                                    <span className="bsi-option-preview">
                                      {renderWithLatexPreview(opt)}
                                    </span>
                                  )}
                                </li>
                              ))}
                              <li>
                                <button
                                  type="button"
                                  className="bsi-btn ghost sm"
                                  onClick={() =>
                                    updateQuestion(selectedPage.pageNumber, q.id, {
                                      options: [...q.options, ''],
                                    })
                                  }
                                >
                                  + opsi
                                </button>
                              </li>
                            </ul>
                          )}
  
                          <p className="bsi-flag muted">
                            Jawaban benar & pembahasan opsional diisi sekarang -- kalau dikosongkan, akan dibuatkan otomatis nanti.
                          </p>
  
                          <details className="bsi-details">
                            <summary>Pembahasan (opsional)</summary>
                            <textarea
                              className="bsi-input"
                              rows={3}
                              placeholder="Belum ada pembahasan. Boleh ditulis sendiri."
                              value={q.explanation || ''}
                              onChange={(e) =>
                                updateQuestion(selectedPage.pageNumber, q.id, {
                                  explanation: e.target.value,
                                })
                              }
                            />
                          </details>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
  
        {/* SIMPAN */}
        {allQuestions.length > 0 && (
          <footer className="bsi-foot">
            <span className="bsi-footinfo">
              {approvedQuestions.length} dari {allQuestions.length} soal disetujui
            </span>
            <button
              type="button"
              className="bsi-btn primary"
              onClick={handleSave}
              disabled={approvedQuestions.length === 0 || saving}
            >
              {saving ? 'Menyimpan…' : `Simpan ${approvedQuestions.length} soal ke ${folderName}`}
            </button>
          </footer>
        )}
      </div>
    );
  }
  
  // ============================================================
  // STYLES (tetap sama seperti sebelumnya)
  // ============================================================
  
  const styles = `
    .bsi { --ink:#16202b; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc;
      --brand:#1d4ed8; --ok:#047857; --warn:#b45309; --danger:#b91c1c;
      color:var(--ink); max-width:1400px; margin:0 auto; padding:24px 20px 96px;
      font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
    .bsi *{box-sizing:border-box}
    .bsi-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px}
    .bsi-eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
    .bsi-title{font-size:24px;font-weight:650;margin:0 0 6px;letter-spacing:-.01em}
    .bsi-sub{margin:0;color:var(--muted);font-size:14px;max-width:64ch;line-height:1.5}
    .bsi-drop{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px 24px;
      border:2px dashed var(--line);border-radius:12px;background:var(--bg);cursor:pointer;text-align:center}
    .bsi-drop:hover{border-color:var(--brand);background:#f1f5ff}
    .bsi-drop-title{font-weight:600;font-size:16px}
    .bsi-drop-hint{color:var(--muted);font-size:13px;max-width:52ch;line-height:1.5}
    .bsi-panel{border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px;background:#fff}
    .bsi-fileinfo{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
    .bsi-filename{font-weight:600;font-size:15px;word-break:break-all}
    .bsi-meta{color:var(--muted);font-size:13px;white-space:nowrap}
    .bsi-range{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}
    .bsi-selection-summary{font-size:13px;color:var(--muted)}
    .bsi-note{margin:12px 0 0;font-size:13px;color:var(--warn);line-height:1.5}
    .bsi-progress{margin-top:14px}
    .bsi-bar{height:6px;background:var(--line);border-radius:99px;overflow:hidden}
    .bsi-bar-fill{height:100%;background:var(--brand);transition:width .3s ease}
    .bsi-progress-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px;font-size:13px;color:var(--muted);flex-wrap:wrap}
    .bsi-progress-actions{display:flex;gap:8px}
    .bsi-btn{border:1px solid var(--line);background:#fff;color:var(--ink);padding:9px 15px;
      border-radius:8px;font-size:14px;font-weight:550;cursor:pointer;font-family:inherit}
    .bsi-btn:hover:not(:disabled){border-color:var(--ink)}
    .bsi-btn:disabled{opacity:.45;cursor:not-allowed}
    .bsi-btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
    .bsi-btn.primary:hover:not(:disabled){background:#1a43b8}
    .bsi-btn.sm{padding:5px 10px;font-size:12.5px}
    .bsi-btn.ghost{border-color:transparent;background:transparent}
    .bsi-btn.ghost:hover{border-color:var(--line);background:var(--bg)}
    .bsi-alert{padding:11px 14px;border-radius:9px;font-size:13.5px;margin-bottom:14px;line-height:1.5;
      background:#fef2f2;color:var(--danger);border:1px solid #fecaca}
    .bsi-alert.ok{background:#ecfdf5;color:var(--ok);border-color:#a7f3d0}
    .bsi-alert.warn{background:#fffbeb;color:var(--warn);border-color:#fde68a}
    .bsi-pagelist{display:flex;gap:8px;overflow-x:auto;padding:4px 0 12px}
    .bsi-pagechip{flex:0 0 auto;display:flex;flex-direction:column;gap:2px;padding:8px 13px;
      border:1px solid var(--line);border-radius:9px;background:#fff;cursor:pointer;font-family:inherit;text-align:left}
    .bsi-pagechip.active{border-color:var(--brand);background:#eff4ff}
    .bsi-pagechip.failed{border-color:#fecaca;background:#fef2f2}
    .bsi-pagenum{font-size:13px;font-weight:600}
    .bsi-pagecount{font-size:11.5px;color:var(--muted)}
    .bsi-compare{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:start}
    .bsi-panel-label{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);
      margin-bottom:8px;font-weight:600}
    .bsi-original{position:sticky;top:16px}
    .bsi-original img{width:100%;border:1px solid var(--line);border-radius:10px;background:#fff}
    .bsi-parsed{display:flex;flex-direction:column;gap:14px}
    .bsi-empty{padding:24px;border:1px dashed var(--line);border-radius:10px;color:var(--muted);
      font-size:13.5px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;line-height:1.5}
    .bsi-empty.pembahasan{border-color:#a7f3d0;background:#f0fdf4;color:#166534;border-style:solid}
    .bsi-card{border:1px solid var(--line);border-radius:11px;padding:14px;background:#fff;
      display:flex;flex-direction:column;gap:10px}
    .bsi-card.approved{border-color:#a7f3d0;background:#f7fffc}
    .bsi-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
    .bsi-tipe-badge{font-size:11.5px;font-weight:650;padding:4px 10px;border-radius:99px;white-space:nowrap}
    .bsi-pq-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .bsi-pq-box{display:flex;flex-direction:column;gap:5px;padding:9px;border:1px solid #a7f3d0;
      background:#ecfdf5;border-radius:8px}
    .bsi-pq-label{font-size:11px;font-weight:700;color:#047857}
    .bsi-pq-preview{font-size:14px;color:var(--ink)}
    .bsi-shortanswer-wrap{display:flex;flex-direction:column;gap:5px;padding:9px;border:1px solid #fde68a;
      background:#fffbeb;border-radius:8px}
    .bsi-card-no{font-size:12.5px;font-weight:650;color:var(--muted);letter-spacing:.03em}
    .bsi-card-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .bsi-check{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;font-weight:550}
    .bsi-select{padding:6px 8px;border:1px solid var(--line);border-radius:7px;font-size:13px;
      font-family:inherit;color:var(--ink);background:#fff}
    .bsi-transcript-row{display:flex;gap:12px;align-items:flex-start}
    .bsi-rawcrop{width:150px;flex:0 0 150px;border:1px solid var(--line);border-radius:8px;background:#fff}
    .bsi-transcript-fields{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
    .bsi-question-input{font-size:14.5px}
    .bsi-figure-wrap{display:flex;flex-direction:column;gap:4px}
    .bsi-figure-label{font-size:11.5px;color:var(--muted);font-weight:600}
    .bsi-figure-img{max-width:220px;border:1px solid var(--line);border-radius:7px;background:#fff}
    .bsi-option-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
    .bsi-option-list li{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
    .bsi-latex-preview{border:1px solid #dbeafe;background:#f0f7ff;border-radius:8px;padding:9px 11px;
      display:flex;flex-direction:column;gap:5px}
    .bsi-latex-preview-label{font-size:11px;font-weight:650;color:#1d4ed8;letter-spacing:.02em}
    .bsi-latex-preview-body{font-size:14.5px;line-height:1.6;color:var(--ink)}
    .bsi-option-preview{font-size:13.5px;color:var(--ink);padding:3px 8px;background:#f0f7ff;
      border-radius:6px;border:1px solid #dbeafe}
    .bsi-flag.muted{color:var(--muted)}
    .bsi-flag{margin:0;font-size:12.5px;color:var(--warn);line-height:1.5}
    .bsi-input{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:7px;
      font-size:14px;font-family:inherit;color:var(--ink);line-height:1.5;resize:vertical;background:#fff}
    .bsi-input:focus{outline:2px solid var(--brand);outline-offset:-1px;border-color:var(--brand)}
    .bsi-letter-btn{width:34px;height:34px;border-radius:7px;border:1px solid var(--line);background:#fff;
      font-weight:700;font-size:13px;color:var(--muted);cursor:pointer;font-family:inherit}
    .bsi-letter-btn.selected{border-color:var(--ok);background:#ecfdf5;color:var(--ok)}
    .bsi-details summary{font-size:13px;color:var(--muted);cursor:pointer;padding:2px 0}
    .bsi-details[open] summary{margin-bottom:7px}
    .bsi-page-picker-panel{border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 16px;background:#fff}
    .bsi-page-picker-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}
    .bsi-page-picker-title{margin:0 0 4px;font-size:16px;font-weight:650}
    .bsi-page-picker-sub{margin:0;color:var(--muted);font-size:12.5px;line-height:1.5;max-width:80ch}
    .bsi-page-picker-actions{display:flex;gap:7px;flex-wrap:wrap}
    .bsi-page-picker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px;max-height:58vh;overflow:auto;margin-top:12px;padding:2px}
    .bsi-page-select-card{border:1px solid var(--line);border-radius:10px;padding:7px;background:#fff;text-align:left;cursor:pointer;font-family:inherit}
    .bsi-page-select-card.selected{border-color:var(--brand);background:#eff6ff}
    .bsi-page-select-card.excluded{opacity:.58;background:#f8fafc}
    .bsi-page-select-card:hover{border-color:var(--brand);opacity:1}
    .bsi-page-select-thumb{position:relative;display:block;aspect-ratio:.71;border:1px solid var(--line);border-radius:7px;overflow:hidden;background:#fff}
    .bsi-page-select-thumb img{width:100%;height:100%;display:block;object-fit:contain}
    .bsi-page-thumb-loading{display:flex;height:100%;align-items:center;justify-content:center;font-size:10px;color:var(--muted)}
    .bsi-page-select-check{position:absolute;right:5px;top:5px;width:21px;height:21px;border-radius:99px;border:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}
    .bsi-page-select-card.selected .bsi-page-select-check{background:var(--brand);border-color:var(--brand);color:#fff}
    .bsi-page-select-label{display:block;margin-top:6px;font-size:11.5px;font-weight:650}
    .bsi-page-select-status{display:block;margin-top:2px;font-size:10px;color:var(--muted)}
    .bsi-foot{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);
      padding:12px 20px;display:flex;justify-content:flex-end;align-items:center;gap:16px;z-index:20}
    .bsi-footinfo{font-size:13.5px;color:var(--muted)}
    @media (max-width:900px){
      .bsi-compare{grid-template-columns:1fr}
      .bsi-original{position:static}
      .bsi-original img{max-height:60vh;object-fit:contain}
    }
  `;