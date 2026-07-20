// src/pages/teacher/modul/SmartImportPanel.jsx
import React, { useRef, useState } from 'react';
import { uploadElearningFile } from '../../../services/uploadService';
import { Loader2, X } from 'lucide-react';

const SMART_PARSE_URL = "/api/smartParseQuiz";

const SmartImportPanel = ({ onParsed, onClose }) => {
  const editorRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | parsing
  const [progressText, setProgressText] = useState('');

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
          document.execCommand('insertHTML', false, `<p>[[GAMBAR]]::${result.downloadURL}</p>`);
        } else {
          alert('❌ Gagal upload salah satu gambar: ' + result.error);
        }
      }
      setStatus('idle');
    }
  };

  const handleParse = async () => {
    const rawHtml = editorRef.current.innerHTML;
    if (!rawHtml || rawHtml.trim().length < 5) {
      alert('⚠️ Paste dulu soalnya di kotak putih.');
      return;
    }

    setStatus('parsing');
    setProgressText('AI sedang membaca dan mengklasifikasi soal, mohon tunggu...');

    try {
      const res = await fetch(SMART_PARSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rawHtml })
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 700, padding: 25, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>🧠 Smart Import Soal (AI)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          Copy soal langsung dari Word/PDF/Google Docs (boleh dengan gambar & teks tebal untuk kunci jawaban), lalu <b>paste (Ctrl+V)</b> di kotak bawah ini.
        </p>
        <div
          ref={editorRef}
          contentEditable
          onPaste={handlePaste}
          style={{
            minHeight: 250, maxHeight: 400, overflowY: 'auto',
            border: '1px solid #e2e8f0', borderRadius: 8, padding: 12,
            fontSize: 13, outline: 'none', lineHeight: 1.6
          }}
        />
        {status !== 'idle' && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#673ab7', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={14} className="spin" /> {progressText}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Batal</button>
          <button
            onClick={handleParse}
            disabled={status !== 'idle'}
            style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#673ab7', color: 'white', fontWeight: 700, cursor: status !== 'idle' ? 'not-allowed' : 'pointer', opacity: status !== 'idle' ? 0.7 : 1 }}
          >
            🚀 Proses dengan AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartImportPanel;