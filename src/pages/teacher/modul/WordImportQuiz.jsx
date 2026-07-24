// src/pages/teacher/modul/WordImportQuiz.jsx
import React, { useState, useRef } from 'react';
import mammoth from 'mammoth/mammoth.browser';
import imageCompression from 'browser-image-compression';
import { X, Loader2, AlertCircle, FileText, Upload, CheckCircle2 } from 'lucide-react';

// 🔥 KENAPA DIPROSES DI BROWSER (BUKAN DIKIRIM MENTAH KE SERVER):
// File Word yang ada banyak gambar bisa gampang tembus beberapa MB, sementara
// server (Vercel) cuma terima request maksimal ~4.5MB. Kalau file dikirim
// mentah-mentah, PASTI ditolak untuk dokumen yang gambarnya banyak.
// Solusinya: dokumen dibongkar & dikecilin DI BROWSER dulu (teks diekstrak,
// gambar kecil/dekoratif dibuang, gambar asli dikompres), baru hasil yang udah
// ramping itu yang dikirim ke server buat diproses AI.

// 🔥 Dipecah per JUMLAH SOAL (bukan per jumlah karakter) supaya tiap request
// ke server isinya kecil & waktu prosesnya bisa ditebak. Server punya batas
// waktu 60 detik per request — kalau 1 request disuruh proses 40 soal
// sekaligus, pasti kelewat batas dan gagal total (timeout). Dengan 5 soal per
// paket, tiap request cuma butuh beberapa detik, jadi aman berapa pun jumlah
// soal di dokumennya (40, 100, dst) karena diproses bertahap satu per satu.
const QUESTIONS_PER_PACKAGE = 5;
const MIN_IMAGE_BYTES = 8 * 1024; // gambar di bawah ini kemungkinan cuma bullet/ikon huruf, bukan diagram

// ============================================================
// Kompres & bersihkan gambar di dalam HTML hasil ekstraksi Word
// ============================================================
async function processImagesInHtml(html, onProgress) {
  const imgRegex = /<img[^>]*src="(data:[^"]+)"[^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];
  const seenSignatures = new Set();
  let result = html;
  let realImageCount = 0;

  for (let i = 0; i < matches.length; i++) {
    const fullTag = matches[i][0];
    const dataUri = matches[i][1];
    const base64Part = dataUri.split(',')[1] || '';
    const approxBytes = Math.floor(base64Part.length * 0.75);

    // Buang gambar kecil (kemungkinan besar cuma bullet/ikon pilihan a/b/c/d,
    // bukan diagram/foto soal beneran)
    if (approxBytes < MIN_IMAGE_BYTES) {
      result = result.replace(fullTag, '');
      continue;
    }

    // Buang duplikat persis (dokumen sering ada bagian yang keulang)
    const signature = dataUri.length + '_' + dataUri.slice(0, 80);
    if (seenSignatures.has(signature)) {
      result = result.replace(fullTag, '');
      continue;
    }
    seenSignatures.add(signature);

    try {
      onProgress?.(`Mengecilkan gambar ${++realImageCount}...`);
      const fetched = await fetch(dataUri);
      const blob = await fetched.blob();
      const compressedBlob = await imageCompression(blob, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      });
      const compressedDataUri = await imageCompression.getDataUrlFromFile(compressedBlob);
      result = result.replace(fullTag, `\n[[GAMBAR]]::${compressedDataUri}\n`);
    } catch (e) {
      // Gagal kompres 1 gambar -> buang aja gambarnya, jangan gagalkan semuanya
      result = result.replace(fullTag, '');
    }
  }

  return result;
}

// ============================================================
// Konversi sisa HTML (setelah gambar diproses) -> teks polos berpenanda
// ============================================================
function htmlToPlainText(html) {
  let text = html;

  // Bold -> **...** (penanda jawaban benar)
  text = text.replace(/<\/?(strong|b)>/gi, '**');

  // List bernomor Word (<ol><li>) -> mammoth biasanya buang angkanya,
  // jadi dinomori ulang manual supaya deteksi "1. " tetap jalan
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, inner) => {
    let counter = 0;
    return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m2, item) => {
      counter++;
      return `\n${counter}. ${item}\n`;
    });
  });

  // Paragraf & line break -> baris baru
  text = text.replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');

  // Buang sisa tag HTML
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entity dasar
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

// ============================================================
// Pecah teks jadi beberapa paket berdasarkan batas nomor soal,
// supaya tiap paket yang dikirim ke server tetap kecil & aman
// ============================================================
function splitIntoPackages(text, perPackage) {
  const lines = text.split('\n');
  const blocks = [];
  let current = [];

  for (const line of lines) {
    const isNewQuestion = /^\d{1,3}[.)]\s+/.test(line.trim());
    if (isNewQuestion && current.length > 0) {
      blocks.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current.join('\n'));

  // Gabungkan tiap `perPackage` soal jadi satu paket kiriman
  const packages = [];
  for (let i = 0; i < blocks.length; i += perPackage) {
    const chunk = blocks.slice(i, i + perPackage).join('\n');
    if (chunk.trim().length > 10) packages.push(chunk);
  }
  return packages;
}

// props:
// - onParsed: (questionsArray) => void  -> parent yang gabungin ke `questions`
// - onClose: () => void
const WordImportQuiz = ({ onParsed, onClose }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('❌ Hanya file .docx (Word) yang didukung. Kalau punyanya .doc lama, buka di Word lalu Save As ➜ pilih format .docx dulu.');
      return;
    }

    setFileName(file.name);
    setProcessing(true);

    try {
      // 1. Baca & ekstrak isi Word LANGSUNG DI BROWSER (bukan dikirim ke server dulu)
      setStatusLabel('Membaca isi file Word...');
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

      // 2. Kecilin & bersihin gambar di dalamnya (masih di browser)
      setStatusLabel('Memeriksa gambar di dalam dokumen...');
      const htmlWithProcessedImages = await processImagesInHtml(html, (msg) => setStatusLabel(msg));

      // 3. Ubah jadi teks polos berpenanda
      const plainText = htmlToPlainText(htmlWithProcessedImages);
      if (!plainText || plainText.trim().length < 10) {
        throw new Error('File Word kosong atau teksnya tidak bisa dibaca.');
      }

      // 4. Pecah jadi paket-paket kecil biar aman dikirim (di bawah batas server)
      const packages = splitIntoPackages(plainText, QUESTIONS_PER_PACKAGE);
      if (packages.length === 0) {
        throw new Error('Tidak ditemukan soal. Pastikan tiap soal diawali nomor (1. 2. 3. dst).');
      }

      // 5. Kirim tiap paket satu-satu ke AI (server), gabungkan hasilnya
      let allQuestions = [];
      let failedPackages = 0;
      for (let i = 0; i < packages.length; i++) {
        setStatusLabel(
          packages.length > 1
            ? `Memproses bagian ${i + 1} dari ${packages.length}...`
            : 'AI sedang memisahkan soal...'
        );
        try {
          const res = await fetch('/api/smartParseQuiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: packages[i] }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.questions) {
            allQuestions = allQuestions.concat(data.questions);
          } else {
            failedPackages++;
          }
        } catch (e) {
          // Kalau 1 paket gagal, tetap lanjut ke paket berikutnya -> partial success
          failedPackages++;
        }
      }

      if (allQuestions.length === 0) {
        throw new Error('Tidak ada soal yang berhasil diproses. Coba cek format penomoran soalnya.');
      }

      onParsed(allQuestions);

      if (failedPackages > 0) {
        alert(
          `✅ ${allQuestions.length} soal berhasil diimpor.\n\n` +
          `⚠️ Tapi ${failedPackages} bagian gagal diproses (kemungkinan kuota AI penuh atau koneksi terputus). ` +
          `Cek dulu apakah ada nomor soal yang terlewat — kalau ada, bisa diimpor ulang atau ditambah manual.`
        );
      }

      onClose();
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.overlay} onClick={!processing ? onClose : undefined}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}><FileText size={18} color="#2563eb" /> Import Soal dari Word</span>
          {!processing && <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>}
        </div>

        {!processing ? (
          <>
            <label style={styles.dropZone}>
              <Upload size={28} color="#94a3b8" />
              <span style={styles.dropTitle}>Klik untuk pilih file .docx</span>
              <span style={styles.dropSub}>Format Word (.docx) — file besar & banyak gambar tetap aman</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                hidden
                onChange={handleFileChange}
              />
            </label>

            {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}

            <div style={styles.guideBox}>
              <div style={styles.guideTitle}><CheckCircle2 size={13} color="#2563eb" /> Cara menyiapkan file Word-nya:</div>
              <ul style={styles.guideList}>
                <li>Tiap soal diawali nomor, contoh: <b>1. Sebuah teko listrik...</b></li>
                <li>Jawaban benar ditandai <b>bold/tebal</b> langsung di depan opsinya</li>
                <li>Gambar (kalau ada) ditempel langsung di dalam dokumen Word, tepat dekat soalnya</li>
                <li>Kalau file masih PDF, convert dulu ke Word (banyak tools gratis di internet) sebelum upload di sini</li>
              </ul>
            </div>
          </>
        ) : (
          <div style={styles.progressBox}>
            <Loader2 size={34} className="spin-word" color="#2563eb" />
            <p style={styles.progressFileName}>{fileName}</p>
            <p style={styles.progressLabel}>{statusLabel}</p>
            <div style={styles.progressBarBg}><div style={styles.progressBarIndeterminate} /></div>
            <p style={styles.progressHint}>Diproses langsung di HP/laptop kamu dulu sebelum dikirim ke AI, jadi mungkin agak lama kalau gambarnya banyak. Jangan tutup halaman ini dulu ya.</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spinWord{to{transform:rotate(360deg)}}
        .spin-word{animation:spinWord 1s linear infinite}
        @keyframes slideWord{0%{margin-left:-40%}100%{margin-left:100%}}
      `}</style>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: 'white', borderRadius: 16, padding: 20, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 15, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' },
  dropZone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '30px 20px', border: '2px dashed #93c5fd', borderRadius: 12,
    cursor: 'pointer', background: '#eff6ff', marginBottom: 14,
  },
  dropTitle: { fontSize: 13, fontWeight: 700, color: '#1e40af' },
  dropSub: { fontSize: 10, color: '#64748b' },
  errorBox: { background: '#fee2e2', color: '#ef4444', padding: 10, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 12, lineHeight: 1.5 },
  guideBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 },
  guideTitle: { fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  guideList: { margin: 0, paddingLeft: 18, fontSize: 11, color: '#475569', lineHeight: 1.8 },
  progressBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0' },
  progressFileName: { fontSize: 12, color: '#1e293b', fontWeight: 700 },
  progressLabel: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 1.5 },
  progressBarBg: { width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarIndeterminate: { width: '40%', height: '100%', background: 'linear-gradient(90deg,#2563eb,#1d4ed8)', borderRadius: 4, animation: 'slideWord 1.4s ease-in-out infinite' },
  progressHint: { fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
};

export default WordImportQuiz;