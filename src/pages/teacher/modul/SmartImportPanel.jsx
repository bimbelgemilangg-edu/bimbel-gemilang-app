// src/pages/teacher/modul/SmartImportPanel.jsx
// Versi "Crop Visual" — soal di-crop sebagai gambar per blok, opsi gambar terdeteksi otomatis.
import React, { useRef, useState } from 'react';
import { uploadElearningFile } from '../../../services/uploadService';
import { Loader2, X, FileText, CheckCircle, Image as ImageIcon } from 'lucide-react';

const PDFJS_SCRIPT = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
const PDFJS_WORKER = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
const RENDER_SCALE = 2.2;
const LEFT_MARGIN_TOLERANCE = 40; // px toleransi posisi X untuk "nomor soal asli" vs sub-list menjorok

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
// Ambil garis kiri margin halaman (posisi X paling umum dipakai nomor soal)
// ============================================================
function detectLeftMargin(items) {
  const xCounts = new Map();
  items.forEach((it) => {
    const xKey = Math.round(it.transform[4] / 5) * 5;
    xCounts.set(xKey, (xCounts.get(xKey) || 0) + 1);
  });
  let bestX = 0, bestCount = 0;
  xCounts.forEach((count, x) => {
    if (count > bestCount) { bestCount = count; bestX = x; }
  });
  return bestX;
}

// ============================================================
// Deteksi baris "N." yang ada TEPAT di margin kiri (soal asli),
// bukan yang menjorok (sub-list di dalam soal, mis. "1. Lisosom" yang menjorok)
// ============================================================
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
    const isNearMargin = Math.abs(first.transform[4] - leftMargin) <= LEFT_MARGIN_TOLERANCE;
    const matchesNumber = /^\d{1,3}[.)]\s*/.test(text);
    if (isNearMargin && matchesNumber) {
      starts.push({ y, number: parseInt(text.match(/^\d{1,3}/)[0], 10) });
    }
  });

  return starts.sort((a, b) => b.y - a.y); // urut dari atas ke bawah (PDF: y besar = atas)
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
  const [status, setStatus] = useState('idle'); // idle | processing
  const [progressText, setProgressText] = useState('');
  const [detected, setDetected] = useState([]); // { id, image(blob url sementara), type, needsUpload }

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('⚠️ Pilih file PDF ya.');
      return;
    }

    try {
      setStatus('processing');
      setProgressText('Memuat pembaca PDF...');
      const pdfjsLib = await ensurePdfJsLoaded();

      setProgressText('Membuka file PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const results = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProgressText(`Menganalisis halaman ${pageNum} dari ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: RENDER_SCALE });

        // Render seluruh halaman jadi canvas resolusi tinggi
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = viewport.width;
        pageCanvas.height = viewport.height;
        const ctx = pageCanvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const textContent = await page.getTextContent();
        const items = textContent.items;
        if (items.length === 0) continue;

        const leftMargin = detectLeftMargin(items);
        const starts = detectQuestionStarts(items, leftMargin);
        const imageRegions = await findImageRegions(page, pdfjsLib);

        for (let i = 0; i < starts.length; i++) {
          const top = starts[i].y;
          const bottom = i + 1 < starts.length ? starts[i + 1].y : page.view[1]; // batas bawah halaman PDF

          const rect = pdfRectToCanvasRect(
            viewport,
            page.view[0],
            top + 14, // sedikit ruang di atas teks
            bottom + 4,
            page.view[2] - page.view[0]
          );

          const cropped = cropCanvas(pageCanvas, rect);
          if (!cropped) continue;

          // Cek apakah ada klaster gambar kecil sejajar DI DALAM rentang y soal ini → opsi bergambar
          const regionsInThisQuestion = imageRegions.filter(
            (r) => r.y <= top + 20 && r.y >= bottom - 20
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
                region.width
              );
              const oCropped = cropCanvas(pageCanvas, oRect, 4);
              if (oCropped) {
                const blob = await canvasToBlob(oCropped);
                optionCrops.push(blob);
              }
            }
          }

          const mainBlob = await canvasToBlob(cropped);

          results.push({
            id: `q-${pageNum}-${starts[i].number}-${Date.now()}-${i}`,
            number: starts[i].number,
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

      if (results.length === 0) {
        alert('⚠️ Tidak ada soal terdeteksi. Pastikan PDF berisi teks asli (bukan hasil scan gambar) dan penomoran soal (1. 2. 3. dst) ada di margin kiri halaman.');
        setStatus('idle');
        return;
      }

      setDetected(results);
      setProgressText('');
      setStatus('idle');
    } catch (err) {
      console.error(err);
      alert('❌ Gagal membaca PDF: ' + err.message);
      setStatus('idle');
    }
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
    setStatus('processing');
    const finalQuestions = [];

    for (let i = 0; i < detected.length; i++) {
      const d = detected[i];
      setProgressText(`Mengupload soal ${i + 1}/${detected.length}...`);

      const mainFile = new File([d.imageBlob], `soal-${d.id}.jpg`, { type: 'image/jpeg' });
      const mainUpload = await uploadElearningFile(mainFile, 'kuis-smart-import');
      const qImage = mainUpload.success ? mainUpload.downloadURL : '';

      let optionImages = ['', '', '', ''];
      if (d.optionsAreImages && d.optionImageBlobs.length > 0) {
        optionImages = [];
        for (let j = 0; j < d.optionImageBlobs.length; j++) {
          const oFile = new File([d.optionImageBlobs[j]], `opsi-${d.id}-${j}.jpg`, { type: 'image/jpeg' });
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
    setStatus('idle');
    onClose();
  };

  const busy = status !== 'idle';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 820, maxHeight: '90vh', padding: 25, borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>🧠 Smart Import Soal (Visual Crop)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
        </div>

        {detected.length === 0 && (
          <>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              Upload PDF soal — tiap soal akan otomatis di-crop sebagai gambar persis seperti aslinya (termasuk tabel, pecahan, diagram). Jika opsi jawaban berupa gambar, sistem akan mendeteksinya otomatis.
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

        {detected.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#eef2ff', borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#4338ca' }}>
              {detected.length} soal terdeteksi. Klik jawaban benar untuk tiap soal (opsional, bisa dilewati dan ditandai nanti di editor).
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