// src/pages/admin/banksoal/BankSoalImport.jsx
// ============================================================
// Halaman admin: unggah PDF berisi soal -> soal dipotong PER BUTIR
// (tanpa AI) -> AI cuma menjawab + membahas tiap butir -> admin
// meninjau & mengoreksi -> simpan ke Bank Soal.
//
// ------------------------------------------------------------
// ⚠️ PERUBAHAN ARSITEKTUR (Agustus 2026)
// ------------------------------------------------------------
// Versi sebelumnya meminta AI membaca SATU HALAMAN PENUH dan
// mentranskripsi ulang SEMUA soal jadi teks sekaligus. Itu ternyata
// jadi sumber dua masalah nyata: (a) AI kadang salah membaca notasi
// matematika yang rumit, dan (b) respons AI kepotong di tengah pada
// halaman padat (banyak soal + LaTeX + pembahasan sekaligus).
//
// Sekarang PEMOTONGAN SOAL DILAKUKAN TANPA AI SAMA SEKALI --
// deteksi nomor soal dari POSISI TEKS ASLI di file PDF (bukan
// tebakan visual dari gambar), lalu soal dipotong sebagai CROP
// PIKSEL PERSIS dari halaman asli. Logika ini DIPORTING PERSIS dari
// SmartImportPanel.jsx (fitur impor PDF lain yang sudah lama
// terbukti jalan di project ini) -- bukan ditulis ulang dari nol,
// supaya perilakunya sudah teruji.
//
// AI HANYA dipanggil untuk satu tugas kecil per butir: melihat crop
// itu dan menentukan JAWABAN YANG BENAR + pembahasan singkat. AI
// TIDAK PERNAH diminta menyalin ulang teks soal -- soal yang
// tersimpan adalah gambar aslinya sendiri, jadi mustahil salah
// transkripsi. Karena keluaran yang diminta dari AI kini kecil (satu
// objek pendek per SATU soal, bukan banyak soal dibungkus jadi satu
// respons besar), risiko kepotong di tengah jalan jadi jauh lebih
// kecil dibanding versi sebelumnya.
//
// ------------------------------------------------------------
// SYARAT PENTING: PDF HARUS PUNYA LAPISAN TEKS ASLI
// ------------------------------------------------------------
// Deteksi nomor soal bergantung pada posisi teks SUNGGUHAN di dalam
// file PDF (bukan menebak dari gambar). Kalau PDF-nya hasil SCAN
// MURNI tanpa lapisan teks (foto halaman yang ditempel jadi PDF),
// deteksi ini tidak akan menemukan apa pun. Untuk PDF hasil scan
// murni, perlu jalur lain (OCR) yang belum dibangun di sini.
//
// ------------------------------------------------------------
// KENAPA PDF.JS DIMUAT DARI CDN, BUKAN NPM
// ------------------------------------------------------------
// Sempat dicoba lewat `import * as pdfjsLib from 'pdfjs-dist'` +
// Vite `?url` untuk workernya -- GAGAL BUILD di Vercel ("Rollup
// failed to resolve import"). SmartImportPanel.jsx (sudah lama jalan
// di project ini) memuat pdf.js lewat tag <script> dari CDN, bukan
// npm import -- pola yang SAMA PERSIS dipakai di sini, termasuk
// versi CDN-nya, supaya dua fitur berbagi cache browser yang sama.
//
// ------------------------------------------------------------
// KENAPA TINJAUAN ADMIN TETAP ADA DI TAHAP INI
// ------------------------------------------------------------
// Di tahap IMPOR ini tidak ada jawaban yang perlu "diverifikasi" --
// belum ada AI yang menjawab apa pun. Tinjauan admin di sini gunanya
// memastikan BATAS POTONGAN (crop) tiap soal sudah pas (tidak
// terpotong atau mengambil sedikit bagian soal berikutnya), dan
// opsional menandai jawaban benar sekarang kalau admin kebetulan
// tahu -- tapi ini TIDAK WAJIB untuk menyetujui soal.
//
// ------------------------------------------------------------
// INTEGRASI YANG DIBUTUHKAN
// ------------------------------------------------------------
// props:
//   folderId, folderName : folder tujuan penyimpanan
//   onSaveQuestions(soal[]) : dipanggil saat admin menekan "Simpan".
//   onCancel() : opsional, menutup halaman.
//
// 🔥 FILE INI TIDAK MEMANGGIL API/AI SAMA SEKALI. Semua pemrosesan
// (render halaman, deteksi nomor soal, potong gambar) berjalan di
// browser. Endpoint /api/smartParseQuiz mode "questionImage" sudah
// disiapkan (lihat smartParseQuiz.js) untuk langkah GENERATE JAWABAN
// yang akan dipanggil dari ManageQuiz nanti -- BUKAN dari file ini.
// ============================================================

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  
  // Sama persis dengan pola SmartImportPanel.jsx -- lihat penjelasan
  // panjang di header file ini.
  const PDFJS_SCRIPT =
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
  
  const PDFJS_WORKER =
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  
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
  // DETEKSI & POTONG SOAL -- DIPORTING PERSIS DARI SmartImportPanel.jsx
  // ============================================================
  // Tidak ditulis ulang dari nol -- logika di bawah ini (deteksi
  // margin kiri, deteksi awal soal, deteksi klaster gambar opsi) SUDAH
  // TERBUKTI JALAN di fitur lain project ini. Diporting apa adanya
  // supaya perilakunya konsisten dan tidak menghadirkan bug baru yang
  // sebenarnya sudah pernah dipecahkan di file lain.
  
  const RENDER_SCALE = 2.2;
  const LEFT_MARGIN_TOLERANCE = 40; // px toleransi posisi X nomor soal asli vs sub-list menjorok
  
  function detectLeftMargin(items) {
    const xCounts = new Map();
    items.forEach((it) => {
      const xKey = Math.round(it.transform[4] / 5) * 5;
      xCounts.set(xKey, (xCounts.get(xKey) || 0) + 1);
    });
    let bestX = 0;
    let bestCount = 0;
    xCounts.forEach((count, x) => {
      if (count > bestCount) {
        bestCount = count;
        bestX = x;
      }
    });
    return bestX;
  }
  
  function detectQuestionStarts(items, leftMargin) {
    const lineMap = new Map();
    items.forEach((item) => {
      const yKey = Math.round(item.transform[5] / 2) * 2;
      if (!lineMap.has(yKey)) lineMap.set(yKey, []);
      lineMap.get(yKey).push(item);
    });
  
    const starts = [];
    lineMap.forEach((lineItems, y) => {
      const sorted = lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
      const first = sorted[0];
      const text = sorted.map((i) => i.str).join(' ').trim();
      const isNearMargin =
        Math.abs(first.transform[4] - leftMargin) <= LEFT_MARGIN_TOLERANCE;
      const matchesNumber = /^\d{1,3}[.)]\s*/.test(text);
      if (isNearMargin && matchesNumber) {
        starts.push({ y, number: parseInt(text.match(/^\d{1,3}/)[0], 10) });
      }
    });
  
    return starts.sort((a, b) => b.y - a.y); // urut atas ke bawah (PDF: y besar = atas)
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
    return candidate.sort((a, b) => a.x - b.x); // kiri ke kanan (A, B, C, D)
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
  
  // ============================================================
  // KONSTANTA LAIN
  // ============================================================
  
  const STATUS = {
    IDLE: 'idle',
    LOADING_PDF: 'loading_pdf',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    DONE: 'done',
    ERROR: 'error',
  };
  
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
  
  // 🔥 PERUBAHAN ARSITEKTUR: TIDAK ADA PEMANGGILAN AI DI FILE INI SAMA
  // SEKALI. Sebelumnya di sini ada langkah "tanya AI jawaban+pembahasan
  // tiap butir" yang berjalan otomatis untuk SETIAP soal yang terdeteksi
  // -- itu boros (memanggil AI untuk semua soal padahal belum tentu
  // semuanya akan dipakai guru) dan lambat (satu per satu, dengan jeda
  // antar panggilan supaya tidak kena rate limit).
  //
  // Sekarang tugas file ini MURNI: deteksi & potong soal per butir dari
  // PDF (tanpa AI, lihat bagian di atas), lalu simpan gambarnya ke Bank
  // Soal apa adanya. Jawaban dan pembahasan BELUM DIISI di tahap ini --
  // itu dibuat NANTI, saat guru benar-benar memilih soal ini untuk
  // dipakai di sebuah kuis (langkah terpisah, belum dibangun, akan
  // menumpang di endpoint /api/smartParseQuiz yang mode "questionImage"
  // -nya sudah disiapkan tapi sengaja TIDAK dipanggil dari sini).
  
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
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(0);
  
    // Hasil deteksi per halaman: { pageNumber, pageImage, questions[], error }
    const [pages, setPages] = useState([]);
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  
    const [saving, setSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
  
    const pdfDocRef = useRef(null);
    const abortRef = useRef(false);
    const pauseRef = useRef(false);
  
    // ----------------------------------------------------------
    // MUAT PDF
    // ----------------------------------------------------------
  
    const handleFileChange = useCallback(async (event) => {
      const picked = event.target.files?.[0];
      if (!picked) return;
  
      if (picked.type !== 'application/pdf') {
        setErrorMessage(
          'Berkas harus PDF. Word tidak didukung karena tata letak dan rumusnya bisa bergeser antar versi Office.',
        );
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
        setStartPage(1);
        setEndPage(doc.numPages);
        setStatus(STATUS.IDLE);
      } catch (error) {
        setErrorMessage(
          `PDF tidak bisa dibuka: ${error?.message || 'berkas mungkin rusak atau terkunci sandi'}.`,
        );
        setStatus(STATUS.ERROR);
      }
    }, []);
  
    // ----------------------------------------------------------
    // DETEKSI & POTONG SOAL DI SATU HALAMAN (TANPA AI)
    // ----------------------------------------------------------
  
    const detectQuestionsOnPage = useCallback(async (pageNumber) => {
      const ref = pdfDocRef.current;
      if (!ref) return { pageImage: '', crops: [] };
  
      const { doc, pdfjsLib } = ref;
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
  
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = viewport.width;
      pageCanvas.height = viewport.height;
      const ctx = pageCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
  
      const pageImage = pageCanvas.toDataURL('image/jpeg', 0.82);
  
      const textContent = await page.getTextContent();
      const items = textContent.items;
  
      if (items.length === 0) {
        // Tidak ada lapisan teks sama sekali -- kemungkinan besar hasil
        // scan murni. Kembalikan halaman kosong dengan gambar halaman
        // tetap ada, supaya admin bisa lihat kenapa (bukan error, tapi
        // memang tidak bisa dideteksi otomatis).
        return { pageImage, crops: [] };
      }
  
      const leftMargin = detectLeftMargin(items);
      const starts = detectQuestionStarts(items, leftMargin);
      const imageRegions = await findImageRegions(page, pdfjsLib);
  
      const crops = [];
  
      for (let i = 0; i < starts.length; i++) {
        const top = starts[i].y;
        const bottom = i + 1 < starts.length ? starts[i + 1].y : page.view[1];
  
        const rect = pdfRectToCanvasRect(
          viewport,
          page.view[0],
          top + 14,
          bottom + 4,
          page.view[2] - page.view[0],
        );
  
        const mainCrop = cropCanvasToDataUrl(pageCanvas, rect);
        if (!mainCrop) continue;
  
        const regionsInThisQuestion = imageRegions.filter(
          (r) => r.y <= top + 20 && r.y >= bottom - 20,
        );
        const optionImageCluster = clusterOptionImages(regionsInThisQuestion);
  
        let optionCrops = [];
        if (optionImageCluster) {
          optionCrops = optionImageCluster
            .map((region) => {
              const oRect = pdfRectToCanvasRect(
                viewport,
                region.x,
                region.y + region.height,
                region.y,
                region.width,
              );
              return cropCanvasToDataUrl(pageCanvas, oRect, 4);
            })
            .filter(Boolean);
        }
  
        crops.push({
          printedNumber: starts[i].number,
          qImage: mainCrop,
          optionsAreImages: optionCrops.length >= 2,
          optionImages: optionCrops,
        });
      }
  
      return { pageImage, crops };
    }, []);
  
    // ----------------------------------------------------------
    // PROSES SATU HALAMAN LENGKAP: deteksi (tanpa AI) + jawab tiap
    // soal (dengan AI, satu per satu)
    // ----------------------------------------------------------
  
    const processOnePage = useCallback(
      async (pageNumber) => {
        const { pageImage, crops } = await detectQuestionsOnPage(pageNumber);
  
        // 🔥 Murni pemetaan hasil crop -> objek soal. TIDAK ADA
        // pemanggilan AI, TIDAK ADA jeda jaringan -- makanya satu
        // halaman sekarang selesai dalam hitungan milidetik (dibatasi
        // cuma oleh kecepatan render kanvas di browser), bukan lagi
        // dibatasi kecepatan API seperti sebelumnya.
        const questions = crops.map((crop) => ({
          id: newId(),
          pageNumber,
          printedNumber: crop.printedNumber,
          qImage: crop.qImage,
          optionsAreImages: crop.optionsAreImages,
          optionImages: crop.optionImages,
          // optionCount belum diketahui di tahap ini (tidak ada AI yang
          // membacanya) -- default aman 5 (A-E) supaya pemilih jawaban
          // manual di bawah tetap bisa dipakai admin kalau mau menandai
          // sambil meninjau; kalau tidak, biarkan kosong (null), nanti
          // diisi di langkah "generate jawaban" saat soal ini dipakai
          // di kuis.
          optionCount: 5,
          correct: null,
          explanation: '',
          needsManualAnswer: true,
          approved: false,
        }));
  
        return { pageImage, questions };
      },
      [detectQuestionsOnPage],
    );
  
    // ----------------------------------------------------------
    // PROSES BERURUTAN SEMUA HALAMAN DALAM RENTANG
    // ----------------------------------------------------------
  
    const processPages = useCallback(async () => {
      abortRef.current = false;
      pauseRef.current = false;
      setStatus(STATUS.PROCESSING);
      setErrorMessage('');
  
      const from = Math.max(1, Math.min(startPage, totalPages));
      const to = Math.max(from, Math.min(endPage || totalPages, totalPages));
  
      for (let pageNumber = from; pageNumber <= to; pageNumber += 1) {
        if (abortRef.current) break;
  
        setCurrentPage(pageNumber);
  
        try {
          // eslint-disable-next-line no-await-in-loop
          const { pageImage, questions } = await processOnePage(pageNumber);
  
          setPages((prev) => [
            ...prev,
            { pageNumber, pageImage, questions, error: null },
          ]);
        } catch (error) {
          setPages((prev) => [
            ...prev,
            {
              pageNumber,
              pageImage: '',
              questions: [],
              error: error?.message || 'Gagal memproses halaman ini.',
            },
          ]);
        }
      }
  
      setStatus(abortRef.current ? STATUS.IDLE : STATUS.DONE);
    }, [startPage, endPage, totalPages, processOnePage]);
  
    // ----------------------------------------------------------
    // ULANG SATU HALAMAN
    // ----------------------------------------------------------
  
    const retryPage = useCallback(
      async (pageNumber) => {
        setErrorMessage('');
        try {
          const { pageImage, questions } = await processOnePage(pageNumber);
  
          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNumber
                ? { pageNumber, pageImage, questions, error: null }
                : p,
            ),
          );
        } catch (error) {
          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNumber
                ? { ...p, error: error?.message || 'Masih gagal.' }
                : p,
            ),
          );
        }
      },
      [processOnePage],
    );
  
    // ----------------------------------------------------------
    // SUNTING SOAL (jawaban, pembahasan, tingkat kesulitan, dsb.)
    // ----------------------------------------------------------
  
    const updateQuestion = useCallback((pageNumber, questionId, patch) => {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber !== pageNumber
            ? p
            : {
                ...p,
                questions: p.questions.map((q) =>
                  q.id === questionId ? { ...q, ...patch } : q,
                ),
              },
        ),
      );
    }, []);
  
    const removeQuestion = useCallback((pageNumber, questionId) => {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber !== pageNumber
            ? p
            : { ...p, questions: p.questions.filter((q) => q.id !== questionId) },
        ),
      );
    }, []);
  
    // ----------------------------------------------------------
    // RINGKASAN
    // ----------------------------------------------------------
  
    const allQuestions = useMemo(
      () => pages.flatMap((p) => p.questions),
      [pages],
    );
  
    const approvedQuestions = useMemo(
      () => allQuestions.filter((q) => q.approved),
      [allQuestions],
    );
  
    const failedPages = useMemo(() => pages.filter((p) => p.error), [pages]);
  
    const selectedPage = pages[selectedPageIndex] || null;
  
    useEffect(() => {
      if (status === STATUS.PROCESSING && pages.length > 0) {
        setSelectedPageIndex(pages.length - 1);
      }
    }, [pages.length, status]);
  
    // ----------------------------------------------------------
    // SIMPAN
    // ----------------------------------------------------------
  
    const handleSave = useCallback(async () => {
      if (approvedQuestions.length === 0) return;
  
      setSaving(true);
      setErrorMessage('');
  
      try {
        const payload = approvedQuestions.map((q) => ({
          type: 'multiple',
          // Teks soal SENGAJA cuma placeholder pendek -- badan soal
          // yang sesungguhnya adalah qImage (crop asli, bukan hasil
          // baca ulang AI). Konvensi ini SAMA PERSIS dengan
          // SmartImportPanel.jsx supaya kompatibel dengan cara
          // ManageQuiz/StudentQuizView menampilkan soal berbasis gambar.
          question: q.printedNumber
            ? `Soal ${q.printedNumber}`
            : 'Soal (lihat gambar)',
          qImage: q.qImage,
          options: Array.from({ length: q.optionCount || 5 }, () => ''),
          optionImages: q.optionsAreImages ? q.optionImages : [],
          optionsAreImages: Boolean(q.optionsAreImages),
          // 🔥 null (bukan 0) kalau belum ditandai -- 0 berarti "opsi A
          // benar", jadi TIDAK BOLEH dipakai sebagai nilai default
          // "belum dijawab". needsAnswerGeneration menandai soal yang
          // jawaban+pembahasannya masih harus dibuat nanti (baik oleh
          // AI saat dipakai di kuis, maupun oleh guru secara manual).
          correct: Number.isInteger(q.correct) ? q.correct : null,
          explanation: q.explanation || '',
          needsAnswerGeneration: !Number.isInteger(q.correct),
          difficulty: q.difficulty || '',
          topik: q.topik || '',
          folderId,
          folderName,
          sourceName: file?.name || '',
          sourcePage: q.pageNumber,
          sourcePrintedNumber: q.printedNumber || null,
          createdAt: new Date().toISOString(),
        }));
  
        await onSaveQuestions?.(payload);
  
        setSavedCount(payload.length);
  
        setPages((prev) =>
          prev.map((p) => ({
            ...p,
            questions: p.questions.filter((q) => !q.approved),
          })),
        );
      } catch (error) {
        setErrorMessage(
          `Gagal menyimpan: ${error?.message || 'coba lagi sebentar.'}`,
        );
      } finally {
        setSaving(false);
      }
    }, [approvedQuestions, folderId, folderName, file, onSaveQuestions]);
  
    const isBusy = status === STATUS.PROCESSING || status === STATUS.LOADING_PDF;
  
    // ----------------------------------------------------------
    // TAMPILAN
    // ----------------------------------------------------------
  
    return (
      <div className="bsi">
        <style>{styles}</style>
  
        <header className="bsi-head">
          <div>
            <p className="bsi-eyebrow">{folderName}</p>
            <h1 className="bsi-title">Tambah soal dari PDF</h1>
            <p className="bsi-sub">
              Soal dipotong per butir langsung dari halaman asli, tanpa
              AI sama sekali. Jawaban & pembahasan dibuat belakangan,
              saat soal ini dipakai di sebuah kuis -- periksa dulu
              batas potongan gambarnya di sini sebelum disetujui.
            </p>
          </div>
  
          {onCancel && (
            <button type="button" className="bsi-btn ghost" onClick={onCancel}>
              Tutup
            </button>
          )}
        </header>
  
        {/* ---------------- UNGGAH ---------------- */}
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
              Gunakan PDF yang punya lapisan teks asli (bukan hasil scan
              murni) -- deteksi nomor soal bergantung pada posisi teks
              sungguhan di dalam file, bukan tebakan visual.
            </span>
          </label>
        )}
  
        {/* ---------------- KENDALI ---------------- */}
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
                <label>
                  Dari halaman
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                  />
                </label>
                <label>
                  sampai
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                  />
                </label>
  
                <button
                  type="button"
                  className="bsi-btn primary"
                  onClick={processPages}
                  disabled={isBusy}
                >
                  {pages.length > 0 ? 'Baca lagi' : 'Mulai baca'}
                </button>
              </div>
            )}
  
            {totalPages > 60 && status !== STATUS.PROCESSING && (
              <p className="bsi-note">
                Berkas ini panjang. Sebaiknya kerjakan per 20–30 halaman
                dulu.
              </p>
            )}
  
            {status === STATUS.PROCESSING && (
              <div className="bsi-progress">
                <div className="bsi-bar">
                  <div
                    className="bsi-bar-fill"
                    style={{
                      width: `${
                        ((currentPage - startPage + 1) /
                          Math.max(1, endPage - startPage + 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="bsi-progress-row">
                  <span>
                    Memproses halaman {currentPage} dari {endPage}
                  </span>
                  <div className="bsi-progress-actions">
                    <button
                      type="button"
                      className="bsi-btn ghost sm"
                      onClick={() => {
                        pauseRef.current = !pauseRef.current;
                        setStatus(
                          pauseRef.current ? STATUS.PAUSED : STATUS.PROCESSING,
                        );
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
  
        {errorMessage && <div className="bsi-alert">{errorMessage}</div>}
  
        {savedCount > 0 && (
          <div className="bsi-alert ok">
            {savedCount} soal tersimpan ke {folderName}.
          </div>
        )}
  
        {failedPages.length > 0 && (
          <div className="bsi-alert warn">
            {failedPages.length} halaman gagal diproses:{' '}
            {failedPages.map((p) => p.pageNumber).join(', ')}. Buka
            halamannya lalu tekan Ulangi.
          </div>
        )}
  
        {/* ---------------- TINJAU ---------------- */}
        {pages.length > 0 && (
          <section className="bsi-review">
            <nav className="bsi-pagelist" aria-label="Daftar halaman">
              {pages.map((p, i) => (
                <button
                  type="button"
                  key={p.pageNumber}
                  className={`bsi-pagechip${
                    i === selectedPageIndex ? ' active' : ''
                  }${p.error ? ' failed' : ''}`}
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
                  <div className="bsi-panel-label">
                    Halaman asli {selectedPage.pageNumber}
                  </div>
                  {selectedPage.pageImage ? (
                    <img
                      src={selectedPage.pageImage}
                      alt={`Halaman ${selectedPage.pageNumber}`}
                    />
                  ) : (
                    <div className="bsi-empty">
                      Halaman ini gagal dirender.
                      <button
                        type="button"
                        className="bsi-btn ghost sm"
                        onClick={() => retryPage(selectedPage.pageNumber)}
                      >
                        Ulangi
                      </button>
                    </div>
                  )}
                </div>
  
                <div className="bsi-parsed">
                  <div className="bsi-panel-label">
                    Soal terdeteksi — periksa batas potongan gambar sebelum disetujui
                  </div>
  
                  {selectedPage.error && (
                    <div className="bsi-empty">
                      {selectedPage.error}
                      <button
                        type="button"
                        className="bsi-btn ghost sm"
                        onClick={() => retryPage(selectedPage.pageNumber)}
                      >
                        Ulangi halaman ini
                      </button>
                    </div>
                  )}
  
                  {!selectedPage.error && selectedPage.questions.length === 0 && (
                    <div className="bsi-empty">
                      Tidak ada soal terdeteksi di halaman ini. Biasanya
                      karena: (a) halaman ini memang sampul/daftar
                      isi/kunci jawaban, atau (b) PDF ini hasil scan
                      murni tanpa lapisan teks asli, sehingga nomor soal
                      tidak bisa dideteksi otomatis.
                    </div>
                  )}
  
                  {selectedPage.questions.map((q, qi) => (
                    <article
                      key={q.id}
                      className={`bsi-card${q.approved ? ' approved' : ''}`}
                    >
                      <div className="bsi-card-head">
                        <span className="bsi-card-no">
                          Soal {qi + 1}
                          {q.printedNumber ? ` (tercetak no. ${q.printedNumber})` : ''}
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
                            onClick={() =>
                              removeQuestion(selectedPage.pageNumber, q.id)
                            }
                          >
                            Buang
                          </button>
                        </div>
                      </div>
  
                      {/* Gambar soal -- CROP ASLI, badan soal & opsi teks
                          sudah baked-in di gambar ini, tidak ditranskrip
                          ulang oleh AI. */}
                      <img src={q.qImage} alt="Soal" className="bsi-qimg" />
  
                      <p className="bsi-flag">
                        Jawaban & pembahasan belum diisi -- akan
                        dibuatkan otomatis nanti saat soal ini dipakai
                        di sebuah kuis. Boleh ditandai sekarang kalau
                        admin sudah tahu jawabannya (opsional).
                      </p>
  
                      {/* Pemilih jawaban -- OPSIONAL, murni penanda
                          manual admin (tanpa AI). Kalau opsinya berupa
                          gambar, tampilkan crop tiap opsi sebagai
                          tombol; kalau tidak, tampilkan huruf A-E biasa
                          (labelnya sendiri sudah ada di dalam gambar
                          qImage). */}
                      {q.optionsAreImages ? (
                        <div className="bsi-optimg-row">
                          {q.optionImages.map((url, oi) => (
                            <button
                              key={oi}
                              type="button"
                              className={`bsi-optimg-btn${
                                q.correct === oi ? ' selected' : ''
                              }`}
                              onClick={() =>
                                updateQuestion(selectedPage.pageNumber, q.id, {
                                  correct: oi,
                                  needsManualAnswer: false,
                                })
                              }
                            >
                              <img src={url} alt={`Opsi ${String.fromCharCode(65 + oi)}`} />
                              <span>{String.fromCharCode(65 + oi)}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bsi-letter-row">
                          {Array.from(
                            { length: Math.max(2, Math.min(5, q.optionCount || 5)) },
                            (_, oi) => oi,
                          ).map((oi) => (
                            <button
                              key={oi}
                              type="button"
                              className={`bsi-letter-btn${
                                q.correct === oi ? ' selected' : ''
                              }`}
                              onClick={() =>
                                updateQuestion(selectedPage.pageNumber, q.id, {
                                  correct: oi,
                                  needsManualAnswer: false,
                                })
                              }
                            >
                              {String.fromCharCode(65 + oi)}
                            </button>
                          ))}
                        </div>
                      )}
  
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
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
  
        {/* ---------------- SIMPAN ---------------- */}
        {allQuestions.length > 0 && (
          <footer className="bsi-foot">
            <span className="bsi-footinfo">
              {approvedQuestions.length} dari {allQuestions.length} soal
              disetujui
            </span>
            <button
              type="button"
              className="bsi-btn primary"
              onClick={handleSave}
              disabled={approvedQuestions.length === 0 || saving}
            >
              {saving
                ? 'Menyimpan…'
                : `Simpan ${approvedQuestions.length} soal ke ${folderName}`}
            </button>
          </footer>
        )}
      </div>
    );
  }
  
  // ============================================================
  // GAYA
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
  .bsi-range{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-top:14px}
  .bsi-range label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted)}
  .bsi-range input{width:90px;padding:7px 9px;border:1px solid var(--line);border-radius:7px;font-size:14px;color:var(--ink)}
  .bsi-note{margin:12px 0 0;font-size:13px;color:var(--warn);line-height:1.5}
  .bsi-progress{margin-top:14px}
  .bsi-bar{height:6px;background:var(--line);border-radius:99px;overflow:hidden}
  .bsi-bar-fill{height:100%;background:var(--brand);transition:width .3s ease}
  .bsi-progress-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px;font-size:13px;color:var(--muted);flex-wrap:wrap}
  .bsi-progress-actions{display:flex;gap:8px}
  .bsi-btn{border:1px solid var(--line);background:#fff;color:var(--ink);padding:9px 15px;
    border-radius:8px;font-size:14px;font-weight:550;cursor:pointer;font-family:inherit}
  .bsi-btn:hover:not(:disabled){border-color:var(--ink)}
  .bsi-btn:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
  .bsi-btn:disabled{opacity:.45;cursor:not-allowed}
  .bsi-btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
  .bsi-btn.primary:hover:not(:disabled){background:#1a43b8}
  .bsi-btn.sm{padding:5px 10px;font-size:12.5px}
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
  .bsi-card{border:1px solid var(--line);border-radius:11px;padding:14px;background:#fff;
    display:flex;flex-direction:column;gap:10px}
  .bsi-card.approved{border-color:#a7f3d0;background:#f7fffc}
  .bsi-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
  .bsi-card-no{font-size:12.5px;font-weight:650;color:var(--muted);letter-spacing:.03em}
  .bsi-card-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .bsi-check{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;font-weight:550}
  .bsi-select{padding:6px 8px;border:1px solid var(--line);border-radius:7px;font-size:13px;
    font-family:inherit;color:var(--ink);background:#fff}
  .bsi-qimg{max-width:100%;border:1px solid var(--line);border-radius:8px;background:#fff}
  .bsi-input{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:7px;
    font-size:14px;font-family:inherit;color:var(--ink);line-height:1.5;resize:vertical;background:#fff}
  .bsi-input:focus{outline:2px solid var(--brand);outline-offset:-1px;border-color:var(--brand)}
  .bsi-letter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .bsi-letter-btn{width:34px;height:34px;border-radius:7px;border:1px solid var(--line);background:#fff;
    font-weight:700;font-size:13px;color:var(--muted);cursor:pointer;font-family:inherit}
  .bsi-letter-btn.selected{border-color:var(--ok);background:#ecfdf5;color:var(--ok)}
  .bsi-optimg-row{display:flex;gap:8px;flex-wrap:wrap}
  .bsi-optimg-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px;
    border:2px solid var(--line);border-radius:9px;background:#fff;cursor:pointer;font-family:inherit}
  .bsi-optimg-btn.selected{border-color:var(--ok);background:#ecfdf5}
  .bsi-optimg-btn img{height:64px;width:auto;border-radius:5px}
  .bsi-optimg-btn span{font-size:12px;font-weight:700;color:var(--muted)}
  .bsi-details summary{font-size:13px;color:var(--muted);cursor:pointer;padding:2px 0}
  .bsi-details[open] summary{margin-bottom:7px}
  .bsi-flag{margin:0;font-size:12.5px;color:var(--warn);line-height:1.5}
  .bsi-foot{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);
    padding:12px 20px;display:flex;justify-content:flex-end;align-items:center;gap:16px;z-index:20}
  .bsi-footinfo{font-size:13.5px;color:var(--muted)}
  @media (max-width:900px){
    .bsi-compare{grid-template-columns:1fr}
    .bsi-original{position:static}
    .bsi-original img{max-height:60vh;object-fit:contain}
  }
  @media (prefers-reduced-motion:reduce){
    .bsi-bar-fill{transition:none}
  }
  `;