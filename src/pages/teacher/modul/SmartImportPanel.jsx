// src/pages/teacher/modul/SmartImportPanel.jsx
// Upload PDF -> ekstrak teks+gambar otomatis (pdf.js dari CDN, tanpa install apapun)
// -> gambar auto-upload ke Supabase -> teks dikirim ke AI -> soal jadi otomatis.
import React, { useRef, useState } from 'react';
import { uploadElearningFile } from '../../../services/uploadService';
import { Loader2, X, Upload, FileText } from 'lucide-react';

const SMART_PARSE_URL = "/api/smartParseQuiz";
const PDFJS_SCRIPT = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
const PDFJS_WORKER = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

// Muat pdf.js dari CDN sekali saja (tidak perlu npm install)
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

// Kumpulkan item teks per halaman jadi baris, tandai bold via nama font
async function extractPageLines(page, textContent) {
  const items = textContent.items;
  const styles = textContent.styles || {};
  const lineMap = new Map();

  items.forEach((item) => {
    const yKey = Math.round(item.transform[5] / 2) * 2; // toleransi baris
    const style = styles[item.fontName];
    const isBold = style && /bold/i.test(style.fontFamily || '');
    const text = isBold ? `**${item.str}**` : item.str;
    if (!lineMap.has(yKey)) lineMap.set(yKey, []);
    lineMap.get(yKey).push({ x: item.transform[4], text });
  });

  const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a); // atas ke bawah
  return sortedY
    .map((y) => lineMap.get(y).sort((a, b) => a.x - b.x).map((p) => p.text).join(' ').trim())
    .filter((l) => l.length > 0);
}

async function pageHasImage(page, pdfjsLib) {
  const opList = await page.getOperatorList();
  return opList.fnArray.some(
    (fn) => fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintJpegXObject || fn === pdfjsLib.OPS.paintImageMaskXObject
  );
}

function renderPageToBlob(page, scale = 2) {
  return new Promise(async (resolve) => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
  });
}

const SmartImportPanel = ({ onParsed, onClose }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | reading | uploading | parsing
  const [progressText, setProgressText] = useState('');
  const [pageInfo, setPageInfo] = useState('');

  // ============================================================
  // UPLOAD & BACA PDF
  // ============================================================
  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset supaya bisa pilih file sama lagi kalau perlu
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('⚠️ Pilih file PDF ya.');
      return;
    }

    try {
      setStatus('reading');
      setProgressText('Memuat pembaca PDF...');
      const pdfjsLib = await ensurePdfJsLoaded();

      setProgressText('Membuka file PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let combinedLines = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setPageInfo(`Halaman ${i} dari ${pdf.numPages}`);
        const page = await pdf.getPage(i);

        const hasImage = await pageHasImage(page, pdfjsLib);
        if (hasImage) {
          setProgressText(`Mengambil & mengupload gambar halaman ${i}...`);
          const blob = await renderPageToBlob(page);
          const imgFile = new File([blob], `pdf-page-${i}.jpg`, { type: 'image/jpeg' });
          const result = await uploadElearningFile(imgFile, 'kuis-smart-import');
          if (result.success) {
            combinedLines.push(`[[GAMBAR]]::${result.downloadURL}`);
          }
        }

        setProgressText(`Membaca teks halaman ${i}...`);
        const textContent = await page.getTextContent();
        const lines = await extractPageLines(page, textContent);
        combinedLines.push(...lines);
      }

      const combinedText = combinedLines.join('\n');
      if (editorRef.current) {
        editorRef.current.innerText = combinedText;
      }
      setPageInfo('');
      setStatus('idle');
    } catch (err) {
      console.error(err);
      alert('❌ Gagal membaca PDF: ' + err.message);
      setStatus('idle');
      setPageInfo('');
    }
  };

  // Tetap dukung paste manual + gambar dari clipboard (opsional, sebagai alternatif)
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items || [];
    const imageFiles = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      setStatus('uploading');
      for (let i = 0; i < imageFiles.length; i++) {
        setProgressText(`Mengupload gambar ${i + 1}/${imageFiles.length}...`);
        const result = await uploadElearningFile(imageFiles[i], 'kuis-smart-import');
        if (result.success) {
          document.execCommand('insertText', false, `\n[[GAMBAR]]::${result.downloadURL}\n`);
        }
      }
      setStatus('idle');
    }
  };

  // ============================================================
  // KIRIM KE AI
  // ============================================================
  const handleParse = async () => {
    const rawText = editorRef.current.innerText;
    if (!rawText || rawText.trim().length < 5) {
      alert('⚠️ Upload PDF dulu, atau paste teks soal di kotak putih.');
      return;
    }
    setStatus('parsing');
    setProgressText('AI sedang membaca & mengelompokkan soal (bisa 10-30 detik jika baru pertama kali)...');
    try {
      const res = await fetch(SMART_PARSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });
      const data = await res.json();
      if (data.success) {
        onParsed(data.questions);
        onClose();
      } else {
        alert('❌ Gagal parsing: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Tidak bisa terhubung ke server AI: ' + err.message);
    }
    setStatus('idle');
  };

  const busy = status !== 'idle';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 720, padding: 25, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>🧠 Smart Import Soal (dari PDF)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
        </div>

        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          Upload file PDF soal — teks dan gambar akan diambil otomatis. Atau paste manual di kotak bawah (boleh sertakan gambar).
        </p>

        <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handlePdfChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, marginBottom: 10,
            border: '2px dashed #673ab7', background: '#f3e8ff', color: '#673ab7',
            fontWeight: 700, fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.6 : 1,
          }}
        >
          <FileText size={16} /> 📄 Upload PDF Soal
        </button>

        <div
          ref={editorRef}
          contentEditable
          onPaste={handlePaste}
          style={{
            minHeight: 220, maxHeight: 380, overflowY: 'auto',
            border: '1px solid #e2e8f0', borderRadius: 8, padding: 12,
            fontSize: 12, outline: 'none', lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}
        />

        {busy && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#673ab7', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={14} className="spin" /> {progressText}
            </div>
            {pageInfo && <div style={{ fontSize: 11, color: '#94a3b8', marginLeft: 20 }}>{pageInfo}</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Batal</button>
          <button
            onClick={handleParse}
            disabled={busy}
            style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#673ab7', color: 'white', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}
          >
            🚀 Proses dengan AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartImportPanel;