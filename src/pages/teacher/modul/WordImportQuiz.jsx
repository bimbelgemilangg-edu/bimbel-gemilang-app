// src/pages/teacher/modul/WordImportQuiz.jsx
import React, { useState, useRef } from 'react';
import { X, Loader2, AlertCircle, FileText, Upload, CheckCircle2 } from 'lucide-react';

// props:
// - onParsed: (questionsArray) => void  -> parent yang gabungin ke `questions`
// - onClose: () => void
const WordImportQuiz = ({ onParsed, onClose }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const [error, setError] = useState('');

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // buang prefix "data:...;base64,"
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    const isDocx = file.name.toLowerCase().endsWith('.docx');
    if (!isDocx) {
      setError('❌ Hanya file .docx (Word) yang didukung. Kalau punyanya .doc lama, buka di Word lalu Save As ➜ pilih format .docx dulu.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('❌ Ukuran file maksimal 15MB (biasanya karena kebanyakan gambar beresolusi besar).');
      return;
    }

    setFileName(file.name);
    setProcessing(true);
    setStatusLabel('Membaca isi file Word...');

    try {
      const fileBase64 = await fileToBase64(file);
      setStatusLabel('AI sedang memisahkan soal... (bisa 30-90 detik kalau soalnya banyak)');

      const res = await fetch('/api/parseDocxQuiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64 }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses file Word');
      }

      const questions = data.questions || [];
      if (questions.length === 0) {
        throw new Error('Tidak ada soal yang terdeteksi. Pastikan tiap soal diawali nomor (1. 2. 3. dst).');
      }

      onParsed(questions);
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
              <span style={styles.dropSub}>Format Word (.docx) — bukan .doc atau .pdf</span>
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
};

export default WordImportQuiz;