// src/pages/teacher/modul/SmartImportPanel.jsx
// Versi "Crop Visual" — soal di-crop sebagai gambar per blok, opsi gambar terdeteksi otomatis.
//
// ============================================================
// 🔥 ROMBAKAN (lihat riwayat di bawah)
// ============================================================
// 1. BARU: CHECKLIST PILIH HALAMAN -- sebelumnya SELURUH halaman PDF
//    langsung diproses begitu file dipilih, tanpa kesempatan guru
//    menyingkirkan halaman cover/daftar isi/halaman tak relevan
//    dulu. Sekarang alurnya 2 tahap: (1) PDF dimuat, thumbnail semua
//    halaman ditampilkan dengan centang default SEMUA terpilih, guru
//    bisa uncheck yang gak perlu -> (2) baru klik "Proses Halaman
//    Terpilih" buat benar-benar mendeteksi & meng-crop soal, HANYA
//    dari halaman yang masih tercentang.
//
// 2. FIX BUG NYATA: DUKUNGAN PDF DUA KOLOM. Sebelumnya
//    detectLeftMargin() cuma mencari SATU posisi margin kiri --
//    kalau dokumennya 2 kolom (umum di soal Fisika/Kimia/Matematika
//    gaya tryout TKA), crop soal di kolom KIRI akan ikut menyeret isi
//    kolom KANAN yang sejajar tingginya (dan sebaliknya), karena
//    lebar crop dan batas-bawah crop dihitung LINTAS KOLOM. Sekarang
//    mendeteksi 1 ATAU 2 margin kiri, lebar crop dibatasi PER KOLOM,
//    dan batas bawah crop dicari dari soal BERIKUTNYA DI KOLOM YANG
//    SAMA (bukan sekadar "soal berikutnya secara global").
//
// 3. BARU: DETEKSI HALAMAN "PEMBAHASAN" (kunci jawaban) -- tanpa ini,
//    halaman kunci jawaban di bagian akhir dokumen ikut ke-crop
//    sebagai "soal baru" yang sebenarnya cuma teks pembahasan. Kalau
//    suatu halaman terdeteksi punya pola "<nomor>. Pembahasan:",
//    HALAMAN ITU DILEWATI TOTAL dari deteksi soal.
// ============================================================
import React, { useRef, useState } from 'react';
import { uploadElearningFile } from '../../../services/uploadService';
import { Loader2, X, FileText, CheckCircle, Image as ImageIcon } from 'lucide-react';

const PDFJS_SCRIPT = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
const PDFJS_WORKER = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
const RENDER_SCALE = 2.2;
const THUMBNAIL_SCALE = 0.32; // 🔥 BARU: skala kecil khusus thumbnail pemilihan halaman, biar cepat dimuat
const LEFT_MARGIN_TOLERANCE = 40; // px toleransi posisi X untuk "nomor soal asli" vs sub-list menjorok
const COLUMN_GAP_MIN_PX = 200; // 🔥 BARU: jarak minimal antar 2 kandidat margin kiri supaya dianggap dokumen 2 kolom (bukan cuma variasi indentasi kecil)

function ensurePdfJsLoaded() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = PDFJS_SCRIPT;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Gagal memuat pembaca PDF.'));
    document.body.appendChild(script);
  });
}

// ============================================================
// 🔥 DIPERBAIKI: dulu detectLeftMargin() (tunggal) cuma cari SATU
// posisi X margin kiri paling umum. Sekarang detectLeftMargins()
// (jamak) mencari 1 ATAU 2 posisi -- kalau ada 2 posisi X yang
// SAMA-SAMA sering dipakai DAN cukup jauh terpisah (> COLUMN_GAP_MIN_PX),
// itu tandanya dokumen 2 kolom. Kalau cuma 1 yang dominan, tetap
// dianggap 1 kolom seperti sebelumnya (tidak mengubah perilaku untuk
// dokumen yang memang 1 kolom).
// ============================================================
function detectLeftMargins(items) {
  const xCounts = new Map();
  items.forEach((it) => {
    const xKey = Math.round(it.transform[4] / 5) * 5;
    xCounts.set(xKey, (xCounts.get(xKey) || 0) + 1);
  });

  const sorted = [...xCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return [0];

  const primary = sorted[0];
  const secondary = sorted.find(
    ([x, count]) => Math.abs(x - primary[0]) > COLUMN_GAP_MIN_PX && count >= primary[1] * 0.3,
  );

  if (secondary) {
    return [primary[0], secondary[0]].sort((a, b) => a - b);
  }
  return [primary[0]];
}

// ============================================================
// 🔥 DIPERBAIKI: sekarang menerima leftMargins (array, 1 atau 2
// elemen) alih-alih 1 nilai tunggal. Setiap baris yang match pola
// nomor soal ditandai TERMASUK KOLOM MANA (column: 0 atau 1) sesuai
// margin kiri mana yang paling dekat dengannya. Juga menghitung
// nextYInSameColumn -- posisi Y soal BERIKUTNYA DI KOLOM YANG SAMA
// (bukan sekadar soal berikutnya secara global) -- ini yang dipakai
// nanti sebagai batas BAWAH crop, supaya crop soal kolom kiri tidak
// ikut kepotong oleh soal kolom kanan yang kebetulan sejajar.
// ============================================================
function detectQuestionStarts(items, leftMargins) {
  const lineMap = new Map();
  items.forEach((item) => {
    const yKey = Math.round(item.transform[5] / 2) * 2;
    if (!lineMap.has(yKey)) lineMap.set(yKey, []);
    lineMap.get(yKey).push(item);
  });

  const rawStarts = [];
  lineMap.forEach((lineItems, y) => {
    const sorted = lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
    const first = sorted[0];
    const text = sorted.map((i) => i.str).join(' ').trim();
    const matchesNumber = /^\d{1,3}[.)]\s*/.test(text);
    if (!matchesNumber) return;

    // Cari margin/kolom mana yang paling dekat dengan baris ini
    let columnIndex = 0;
    let bestDist = Infinity;
    leftMargins.forEach((margin, idx) => {
      const dist = Math.abs(first.transform[4] - margin);
      if (dist < bestDist) {
        bestDist = dist;
        columnIndex = idx;
      }
    });

    if (bestDist > LEFT_MARGIN_TOLERANCE) return; // bukan margin kolom mana pun -> sub-list menjorok, bukan soal asli

    rawStarts.push({
      y,
      number: parseInt(text.match(/^\d{1,3}/)[0], 10),
      column: columnIndex,
    });
  });

  const sortedStarts = rawStarts.sort((a, b) => b.y - a.y); // urut atas ke bawah (PDF: y besar = atas)

  return sortedStarts.map((s, idx) => {
    const nextInSameColumn = sortedStarts.slice(idx + 1).find((o) => o.column === s.column);
    return { ...s, nextYInSameColumn: nextInSameColumn ? nextInSameColumn.y : null };
  });
}

// ============================================================
// 🔥 BARU: DETEKSI HALAMAN "PEMBAHASAN" (kunci jawaban). Pola paling
// spesifik & andal: "<nomor>. Pembahasan:" -- pola ini TIDAK PERNAH
// muncul di halaman soal biasa. Kalau ketemu di suatu halaman,
// SELURUH halaman itu dilewati dari deteksi soal (bukan cuma butir
// yang match), karena kalau satu ketemu, seisi halaman itu hampir
// pasti bagian pembahasan.
// ============================================================
function isPembahasanPage(fullPageText) {
  return /\d+\s*[.)]\s*Pembahasan\s*:/i.test(fullPageText);
}

// ============================================================
// Cari klaster gambar kecil sejajar (kandidat opsi bergambar)
// ============================================================
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

// Kelompokkan region gambar yang sejajar (y mirip) dan ukurannya mirip → kemungkinan opsi bergambar
function clusterOptionImages(regions, pageHeight) {
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

  // Cari grup dengan 2-5 gambar berukuran mirip (kandidat kuat opsi bergambar)
  const candidate = groups.find((g) => {
    if (g.length < 2 || g.length > 5) return false;
    const avgW = g.reduce((s, r) => s + r.width, 0) / g.length;
    return g.every((r) => Math.abs(r.width - avgW) / avgW < 0.4);
  });

  if (!candidate) return null;
  return candidate.sort((a, b) => a.x - b.x); // urut kiri ke kanan (A, B, C, D)
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

function cropCanvas(sourceCanvas, rect, paddingPx = 8) {
  const x = Math.max(0, rect.x - paddingPx);
  const y = Math.max(0, rect.y - paddingPx);
  const w = Math.min(sourceCanvas.width - x, rect.width + paddingPx * 2);
  const h = Math.min(sourceCanvas.height - y, rect.height + paddingPx * 2);
  if (w <= 0 || h <= 0) return null;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);
  return out;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9));
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
const SmartImportPanel = ({ onParsed, onClose }) => {
  const fileInputRef = useRef(null);
  // 🔥 BARU: simpan dokumen PDF & pdfjsLib yang sudah dimuat, supaya
  // tahap "pilih halaman" dan tahap "proses" tidak perlu membaca
  // ulang file dari awal.
  const pdfDocRef = useRef(null);
  const pdfjsLibRef = useRef(null);

  // 🔥 BARU: status alur sekarang 3 tahap, bukan cuma idle/processing:
  // 'idle' (belum upload) -> 'selecting' (thumbnail + checklist
  // tampil, tunggu guru pilih halaman) -> 'processing' (sedang
  // deteksi & crop) -> kembali 'idle' dengan `detected` terisi
  // (layar tinjau soal, seperti sebelumnya).
  const [phase, setPhase] = useState('idle');
  const [progressText, setProgressText] = useState('');
  const [detected, setDetected] = useState([]); // { id, image(blob url sementara), type, needsUpload }

  // 🔥 BARU: daftar thumbnail halaman + status centangnya
  const [pageThumbnails, setPageThumbnails] = useState([]); // { pageNumber, thumbnailUrl, checked }
  const [skippedPembahasanPages, setSkippedPembahasanPages] = useState([]);

  // ============================================================
  // TAHAP 1: PDF dipilih -> muat & render THUMBNAIL semua halaman
  // (resolusi kecil, cepat), TAMPILKAN CHECKLIST -- BELUM mendeteksi
  // soal sama sekali di tahap ini.
  // ============================================================
  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('⚠️ Pilih file PDF ya.');
      return;
    }

    try {
      setPhase('processing');
      setProgressText('Memuat pembaca PDF...');
      const pdfjsLib = await ensurePdfJsLoaded();
      pdfjsLibRef.current = pdfjsLib;

      setProgressText('Membuka file PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = pdf;

      const thumbnails = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProgressText(`Membuat pratinjau halaman ${pageNum} dari ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        // eslint-disable-next-line no-await-in-loop
        await page.render({ canvasContext: ctx, viewport }).promise;
        // eslint-disable-next-line no-await-in-loop
        const blob = await canvasToBlob(canvas);
        thumbnails.push({
          pageNumber: pageNum,
          thumbnailUrl: URL.createObjectURL(blob),
          checked: true, // 🔥 default semua tercentang -- guru tinggal UNCHECK yang mau di-skip
        });
      }

      setPageThumbnails(thumbnails);
      setProgressText('');
      setPhase('selecting');
    } catch (err) {
      console.error(err);
      alert('❌ Gagal membaca PDF: ' + err.message);
      setPhase('idle');
    }
  };

  const togglePageChecked = (pageNumber) => {
    setPageThumbnails((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, checked: !p.checked } : p)),
    );
  };

  const checkAllPages = () => setPageThumbnails((prev) => prev.map((p) => ({ ...p, checked: true })));
  const uncheckAllPages = () => setPageThumbnails((prev) => prev.map((p) => ({ ...p, checked: false })));

  // ============================================================
  // TAHAP 2: guru klik "Proses Halaman Terpilih" -> BARU di sini
  // deteksi & crop soal dijalankan, HANYA untuk halaman yang masih
  // tercentang. Pakai pdfDocRef yang sudah dimuat, tidak baca ulang file.
  // ============================================================
  const handleStartProcessing = async () => {
    const pdf = pdfDocRef.current;
    const pdfjsLib = pdfjsLibRef.current;
    if (!pdf || !pdfjsLib) {
      alert('❌ Dokumen PDF tidak ditemukan lagi, silakan upload ulang.');
      setPhase('idle');
      return;
    }

    const checkedPages = pageThumbnails.filter((p) => p.checked).map((p) => p.pageNumber);
    if (checkedPages.length === 0) {
      alert('⚠️ Pilih minimal 1 halaman untuk diproses.');
      return;
    }

    setPhase('processing');
    const results = [];
    const pembahasanSkipped = [];

    for (const pageNum of checkedPages) {
      setProgressText(`Menganalisis halaman ${pageNum} (${checkedPages.indexOf(pageNum) + 1}/${checkedPages.length} halaman terpilih)...`);
      // eslint-disable-next-line no-await-in-loop
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: RENDER_SCALE });

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = viewport.width;
      pageCanvas.height = viewport.height;
      const ctx = pageCanvas.getContext('2d');
      // eslint-disable-next-line no-await-in-loop
      await page.render({ canvasContext: ctx, viewport }).promise;

      // eslint-disable-next-line no-await-in-loop
      const textContent = await page.getTextContent();
      const items = textContent.items;
      if (items.length === 0) continue;

      // 🔥 BARU: cek halaman Pembahasan SEBELUM deteksi soal -- kalau
      // ketemu, lewati TOTAL halaman ini.
      const fullPageTextForCheck = items.map((it) => it.str).join(' ');
      if (isPembahasanPage(fullPageTextForCheck)) {
        pembahasanSkipped.push(pageNum);
        continue;
      }

      const leftMargins = detectLeftMargins(items);
      const starts = detectQuestionStarts(items, leftMargins);
      // eslint-disable-next-line no-await-in-loop
      const imageRegions = await findImageRegions(page, pdfjsLib);

      const pageLeftPdf = page.view[0];
      const pageRightPdf = page.view[2];
      // 🔥 BARU: rentang X per kolom -- kalau 2 kolom terdeteksi,
      // batas crop dipisah di titik tengah antar margin; kalau cuma 1
      // kolom, tetap pakai lebar halaman penuh seperti sebelumnya.
      const columnXRanges = leftMargins.length >= 2
        ? [
            { left: pageLeftPdf, right: (leftMargins[0] + leftMargins[1]) / 2 },
            { left: (leftMargins[0] + leftMargins[1]) / 2, right: pageRightPdf },
          ]
        : [{ left: pageLeftPdf, right: pageRightPdf }];

      for (let i = 0; i < starts.length; i++) {
        const start = starts[i];
        const top = start.y;
        // 🔥 FIX: batas bawah crop sekarang dari soal BERIKUTNYA DI
        // KOLOM YANG SAMA (start.nextYInSameColumn), bukan sekadar
        // "soal berikutnya secara urutan y" -- itu yang menyebabkan
        // crop kolom kiri kepotong salah oleh soal kolom kanan yang
        // kebetulan sejajar tingginya.
        const bottom = start.nextYInSameColumn !== null ? start.nextYInSameColumn : page.view[1];
        const colRange = columnXRanges[start.column] || columnXRanges[0];

        const rect = pdfRectToCanvasRect(
          viewport,
          colRange.left,
          top + 14, // sedikit ruang di atas teks
          bottom + 4,
          colRange.right - colRange.left,
        );

        const cropped = cropCanvas(pageCanvas, rect);
        if (!cropped) continue;

        // Cek apakah ada klaster gambar kecil sejajar DI DALAM rentang y & X soal ini → opsi bergambar
        const regionsInThisQuestion = imageRegions.filter(
          (r) =>
            r.y <= top + 20 &&
            r.y >= bottom - 20 &&
            r.x >= colRange.left - 20 &&
            r.x <= colRange.right + 20,
        );
        const optionImageCluster = clusterOptionImages(regionsInThisQuestion, page.view[3]);

        let optionCrops = [];
        if (optionImageCluster) {
          for (const region of optionImageCluster) {
            const oRect = pdfRectToCanvasRect(
              viewport,
              region.x,
              region.y + region.height,
              region.y,
              region.width,
            );
            // eslint-disable-next-line no-await-in-loop
            const oCropped = cropCanvas(pageCanvas, oRect, 4);
            if (oCropped) {
              // eslint-disable-next-line no-await-in-loop
              const blob = await canvasToBlob(oCropped);
              optionCrops.push(blob);
            }
          }
        }

        // eslint-disable-next-line no-await-in-loop
        const mainBlob = await canvasToBlob(cropped);

        results.push({
          id: `q-${pageNum}-${start.number}-${Date.now()}-${i}`,
          number: start.number,
          page: pageNum,
          imageBlob: mainBlob,
          imagePreviewUrl: URL.createObjectURL(mainBlob),
          optionsAreImages: optionCrops.length >= 2,
          optionImageBlobs: optionCrops,
          optionImagePreviewUrls: optionCrops.map((b) => URL.createObjectURL(b)),
          type: 'multiple',
          correct: 0,
          needsManualAnswer: true,
        });
      }
    }

    setSkippedPembahasanPages(pembahasanSkipped);

    if (results.length === 0) {
      const pembahasanNote = pembahasanSkipped.length > 0
        ? ` (${pembahasanSkipped.length} halaman dilewati karena terdeteksi sebagai Pembahasan.)`
        : '';
      alert(`⚠️ Tidak ada soal terdeteksi dari halaman yang dipilih.${pembahasanNote} Pastikan PDF berisi teks asli (bukan hasil scan gambar) dan penomoran soal (1. 2. 3. dst) ada di margin kiri halaman/kolom.`);
      setPhase('selecting');
      return;
    }

    setDetected(results);
    setProgressText('');
    setPhase('idle');
  };

  const setAnswer = (id, correctIndex) => {
    setDetected((prev) => prev.map((q) => (q.id === id ? { ...q, correct: correctIndex, needsManualAnswer: false } : q)));
  };

  const setType = (id, type) => {
    setDetected((prev) => prev.map((q) => (q.id === id ? { ...q, type } : q)));
  };

  const removeDetected = (id) => {
    setDetected((prev) => prev.filter((q) => q.id !== id));
  };

  // ============================================================
  // Upload semua gambar ke Supabase & kirim ke ManageQuiz
  // ============================================================
  const handleConfirmAll = async () => {
    setPhase('processing');
    const finalQuestions = [];

    for (let i = 0; i < detected.length; i++) {
      const d = detected[i];
      setProgressText(`Mengupload soal ${i + 1}/${detected.length}...`);

      const mainFile = new File([d.imageBlob], `soal-${d.id}.jpg`, { type: 'image/jpeg' });
      // eslint-disable-next-line no-await-in-loop
      const mainUpload = await uploadElearningFile(mainFile, 'kuis-smart-import');
      const qImage = mainUpload.success ? mainUpload.downloadURL : '';

      let optionImages = ['', '', '', ''];
      if (d.optionsAreImages && d.optionImageBlobs.length > 0) {
        optionImages = [];
        for (let j = 0; j < d.optionImageBlobs.length; j++) {
          const oFile = new File([d.optionImageBlobs[j]], `opsi-${d.id}-${j}.jpg`, { type: 'image/jpeg' });
          // eslint-disable-next-line no-await-in-loop
          const oUpload = await uploadElearningFile(oFile, 'kuis-smart-import');
          optionImages.push(oUpload.success ? oUpload.downloadURL : '');
        }
        while (optionImages.length < 4) optionImages.push('');
      }

      finalQuestions.push({
        id: Date.now() + i,
        type: d.type,
        q: `Soal ${d.number}`, // teks pendek, badan soal utuh ada di qImage
        qImage,
        options: d.optionsAreImages ? ['', '', '', ''] : ['', '', '', ''],
        optionImages,
        optionsAreImages: d.optionsAreImages,
        correct: d.correct,
        correctAnswers: [],
        explanation: '',
        statements: [{ text: '', isTrue: true }],
        readingText: '',
        subQuestions: [{ q: '', options: ['', '', '', ''], correct: 0 }],
        shortAnswer: '',
        cause: '',
        effect: '',
        isCauseTrue: true,
        isEffectTrue: true,
        needsManualAnswer: d.needsManualAnswer,
      });
    }

    onParsed(finalQuestions);
    setPhase('idle');
    onClose();
  };

  const busy = phase === 'processing';
  const checkedCount = pageThumbnails.filter((p) => p.checked).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 820, maxHeight: '90vh', padding: 25, borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>🧠 Smart Import Soal (Visual Crop)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
        </div>

        {/* TAHAP 0: BELUM UPLOAD PDF */}
        {phase !== 'selecting' && detected.length === 0 && pageThumbnails.length === 0 && (
          <>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              Upload PDF soal — setelah dimuat, Anda bisa memilih halaman mana saja yang mau diproses (misalnya melewati halaman sampul/daftar isi) sebelum sistem meng-crop tiap soal sebagai gambar persis seperti aslinya (termasuk tabel, pecahan, diagram). Jika opsi jawaban berupa gambar, sistem akan mendeteksinya otomatis.
            </p>
            <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handlePdfChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                border: '2px dashed #673ab7', background: '#f3e8ff', color: '#673ab7',
                fontWeight: 700, fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.6 : 1,
              }}
            >
              <FileText size={16} /> 📄 Upload PDF Soal
            </button>
            {busy && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#673ab7', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={14} className="spin" /> {progressText}
              </div>
            )}
          </>
        )}

        {/* 🔥 BARU -- TAHAP 1: CHECKLIST PILIH HALAMAN */}
        {phase === 'selecting' && detected.length === 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                {pageThumbnails.length} halaman dimuat. Uncheck halaman cover/daftar isi/tidak relevan sebelum diproses -- <strong>{checkedCount} halaman</strong> akan diproses.
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={checkAllPages} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Pilih Semua</button>
                <button onClick={uncheckAllPages} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Batal Semua</button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, padding: 4 }}>
              {pageThumbnails.map((p) => (
                <label
                  key={p.pageNumber}
                  style={{
                    cursor: 'pointer',
                    border: p.checked ? '2px solid #673ab7' : '2px solid #e2e8f0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                    opacity: p.checked ? 1 : 0.45,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={p.checked}
                    onChange={() => togglePageChecked(p.pageNumber)}
                    style={{ position: 'absolute', top: 4, left: 4, width: 16, height: 16, zIndex: 2 }}
                  />
                  <img src={p.thumbnailUrl} alt={`Halaman ${p.pageNumber}`} style={{ width: '100%', display: 'block' }} />
                  <div style={{ fontSize: 10, textAlign: 'center', padding: '3px 0', background: p.checked ? '#f3e8ff' : '#f1f5f9', color: p.checked ? '#673ab7' : '#94a3b8', fontWeight: 700 }}>
                    Hal. {p.pageNumber}
                  </div>
                </label>
              ))}
            </div>

            {busy && (
              <div style={{ marginBottom: 12, fontSize: 12, color: '#673ab7', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={14} className="spin" /> {progressText}
              </div>
            )}
          </>
        )}

        {/* LAYAR TINJAU SOAL TERDETEKSI (setelah diproses) -- TIDAK DIUBAH */}
        {detected.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#eef2ff', borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#4338ca' }}>
              {detected.length} soal terdeteksi. Klik jawaban benar untuk tiap soal (opsional, bisa dilewati dan ditandai nanti di editor).
              {skippedPembahasanPages.length > 0 && (
                <> {skippedPembahasanPages.length} halaman dilewati otomatis karena terdeteksi sebagai Pembahasan.</>
              )}
            </div>

            <div style={{ overflowY: 'auto', flex: 1, marginBottom: 12 }}>
              {detected.map((q, idx) => (
                <div key={q.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#673ab7' }}>Soal {q.number} (hal. {q.page})</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select
                        value={q.type}
                        onChange={(e) => setType(q.id, e.target.value)}
                        style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}
                      >
                        <option value="multiple">Pilihan Ganda</option>
                        <option value="multiselect">Pilih {'>'} 1</option>
                        <option value="truefalse">Benar/Salah</option>
                        <option value="causeeffect">Sebab Akibat</option>
                        <option value="shortanswer">Isian Singkat</option>
                        <option value="reading">Bacaan</option>
                      </select>
                      <button onClick={() => removeDetected(q.id)} style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Hapus</button>
                    </div>
                  </div>

                  <img src={q.imagePreviewUrl} alt={`Soal ${q.number}`} style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid #f1f5f9', marginBottom: 8 }} />

                  {q.optionsAreImages ? (
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ImageIcon size={12} /> Terdeteksi opsi bergambar — klik gambar yang benar:
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {q.optionImagePreviewUrls.map((url, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => setAnswer(q.id, oIdx)}
                            style={{
                              padding: 4, borderRadius: 8, cursor: 'pointer',
                              border: q.correct === oIdx ? '3px solid #10b981' : '2px solid #e2e8f0',
                              background: q.correct === oIdx ? '#f0fdf4' : 'white',
                            }}
                          >
                            <img src={url} alt={`Opsi ${String.fromCharCode(65 + oIdx)}`} style={{ height: 70, display: 'block' }} />
                            <div style={{ fontSize: 9, textAlign: 'center', marginTop: 2, fontWeight: 700 }}>
                              {String.fromCharCode(65 + oIdx)} {q.correct === oIdx && <CheckCircle size={10} style={{ display: 'inline', marginLeft: 2 }} color="#10b981" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Klik huruf jawaban benar (lihat gambar di atas untuk tahu isi opsinya):</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['A', 'B', 'C', 'D', 'E'].map((letter, oIdx) => (
                          <button
                            key={letter}
                            onClick={() => setAnswer(q.id, oIdx)}
                            style={{
                              width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                              border: q.correct === oIdx ? '2px solid #10b981' : '1px solid #e2e8f0',
                              background: q.correct === oIdx ? '#dcfce7' : 'white',
                              color: q.correct === oIdx ? '#166534' : '#64748b',
                            }}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Batal</button>

          {/* 🔥 BARU: tombol proses muncul di tahap checklist, bukan di tahap tinjau */}
          {phase === 'selecting' && detected.length === 0 && (
            <button
              onClick={handleStartProcessing}
              disabled={busy || checkedCount === 0}
              style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#673ab7', color: 'white', fontWeight: 700, cursor: (busy || checkedCount === 0) ? 'not-allowed' : 'pointer', opacity: (busy || checkedCount === 0) ? 0.6 : 1 }}
            >
              {busy ? <Loader2 size={14} className="spin" /> : `🔍 Proses ${checkedCount} Halaman Terpilih`}
            </button>
          )}

          {detected.length > 0 && (
            <button
              onClick={handleConfirmAll}
              disabled={busy}
              style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#673ab7', color: 'white', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}
            >
              {busy ? <Loader2 size={14} className="spin" /> : `✅ Masukkan ${detected.length} Soal ke Kuis`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartImportPanel;