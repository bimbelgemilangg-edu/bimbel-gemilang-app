// src/pages/teacher/modul/SmartImportPanel.jsx
// Versi 100% GRATIS — parsing pakai pola/logika (bukan AI), jalan di browser, tanpa server.
import React, { useRef, useState } from 'react';
import { uploadElearningFile } from '../../../services/uploadService';
import { Loader2, X, Info } from 'lucide-react';

// ============================================================
// HTML → baris teks, dengan **bold** tetap ditandai
// ============================================================
function htmlToLines(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  const lines = [];
  let current = '';
  const BLOCK_TAGS = new Set(['DIV', 'P', 'LI', 'TR']);

  const pushLine = () => {
    if (current.trim().length > 0) lines.push(current.trim());
    current = '';
  };

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      current += node.textContent;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName;
    if (tag === 'BR') { pushLine(); return; }
    if (tag === 'B' || tag === 'STRONG') {
      current += '**';
      node.childNodes.forEach(walk);
      current += '**';
      return;
    }
    const isBlock = BLOCK_TAGS.has(tag);
    if (isBlock) pushLine();
    node.childNodes.forEach(walk);
    if (isBlock) pushLine();
  };

  container.childNodes.forEach(walk);
  pushLine();
  return lines;
}

// ============================================================
// HELPERS PARSING
// ============================================================
const stripBold = (text) => text.replace(/\*\*/g, '').trim();
const isBold = (text) => /^\*\*.*\*\*$/.test(text.trim());

function detectType(blockLines) {
  const joined = blockLines.join(' ').toLowerCase();
  if (joined.includes('sebab') && joined.includes('akibat')) return 'causeeffect';
  if (joined.includes('pilih lebih dari satu') || joined.includes('pilih semua yang benar') || joined.includes('beberapa jawaban benar')) return 'multiselect';
  const hasLetterOptions = blockLines.some((l) => /^[A-Ea-e][.)]\s+/.test(l));
  if (!hasLetterOptions) {
    if (joined.includes('benar atau salah') || joined.includes('benar/salah')) return 'truefalse';
    return 'shortanswer';
  }
  return 'multiple';
}

function parseBlock(blockLines) {
  const optionLines = [];
  const questionLines = [];
  let seenOption = false;

  for (const line of blockLines) {
    if (/^[A-Ea-e][.)]\s+/.test(line)) {
      seenOption = true;
      optionLines.push(line);
    } else if (!seenOption) {
      questionLines.push(line);
    }
  }

  let questionText = questionLines.join(' ').replace(/^\d{1,3}[.)]\s*/, '').trim();

  let qImage = '';
  const imgLine = blockLines.find((l) => l.startsWith('[[GAMBAR]]::'));
  if (imgLine) {
    qImage = imgLine.replace('[[GAMBAR]]::', '').trim();
    questionText = questionText.replace(/\[\[GAMBAR\]\]::\S+/, '').trim();
  }

  const type = detectType(blockLines);
  const options = optionLines.map((l) => stripBold(l.replace(/^[A-Ea-e][.)]\s*/, '')));

  let correct = 0;
  let needsManualAnswer = true;
  const boldIdx = optionLines.findIndex((l) => isBold(l.replace(/^[A-Ea-e][.)]\s*/, '')));
  if (boldIdx !== -1) {
    correct = boldIdx;
    needsManualAnswer = false;
  }

  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    type,
    q: questionText,
    qImage,
    options: options.length ? options : ['', '', '', ''],
    optionImages: ['', '', '', ''],
    correct,
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
    needsManualAnswer,
  };
}

function smartParseQuestions(lines) {
  const blocks = [];
  let current = [];

  for (const line of lines) {
    const isNewQuestion = /^\d{1,3}[.)]\s+/.test(line);
    if (isNewQuestion && current.length > 0) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  const questionBlocks = blocks.filter((b) => /^\d{1,3}[.)]\s+/.test(b[0]));
  return questionBlocks.map((b) => parseBlock(b)).filter((q) => q.q.length > 3);
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
const SmartImportPanel = ({ onParsed, onClose }) => {
  const editorRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | uploading
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

  const handleParse = () => {
    const rawHtml = editorRef.current.innerHTML;
    if (!rawHtml || rawHtml.trim().length < 5) {
      alert('⚠️ Paste dulu soalnya di kotak putih.');
      return;
    }

    const lines = htmlToLines(rawHtml);
    const questions = smartParseQuestions(lines);

    if (questions.length === 0) {
      alert('⚠️ Tidak ada soal yang terdeteksi. Pastikan soal diawali angka (1. 2. 3. dst) dan opsi diawali huruf (A. B. C. dst).');
      return;
    }

    onParsed(questions);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 700, padding: 25, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>⚡ Smart Import Soal</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#eef2ff', borderRadius: 8, marginBottom: 12 }}>
          <Info size={14} color="#4338ca" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 11, color: '#4338ca', margin: 0 }}>
            Soal diawali angka (1. 2. 3.), opsi diawali huruf (A. B. C.). Tebalkan (bold) opsi yang benar biar otomatis tertandai. Setelah diproses, cek badge <b>"⚠️ Perlu tandai jawaban"</b> pada soal yang belum ke-bold.
          </p>
        </div>

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
            ⚡ Proses Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartImportPanel;