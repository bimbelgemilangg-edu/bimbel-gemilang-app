// src/pages/teacher/modul/ManageQuiz.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { 
  Plus, Trash2, CheckCircle, ArrowLeft, Save, FileText, X, 
  Calculator, Target, BookOpen, Users, Send, Settings, 
  Clock as ClockIcon, HelpCircle, Image, Upload, Calendar, 
  CalendarDays, AlertCircle, Eye, EyeOff, Lock, Unlock,
  Layers, Type, FileUp, Video, Rocket, Sparkles, Loader2,
  List, Table, Grid, Hash, AlignLeft, CheckSquare, Square,
  Edit3, FileQuestion, ArrowLeftRight, Undo2, Redo2,
  Search, UserPlus, Download
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadElearningFile } from '../../../services/uploadService';
import SmartImportPanel from './SmartImportPanel';
import WordImportQuiz from './WordImportQuiz';
import AIGenerateQuiz from './AIGenerateQuiz';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// ============================================================
// 🔥 HELPER TANGGAL — FIX BUG TIMEZONE
// ============================================================
// 🔥 FIX BUG PENTING: sebelumnya default tanggal buka/tutup kuis dibuat
// pakai `date.toISOString().slice(0, 16)`. `toISOString()` SELALU
// mengonversi ke UTC, sementara `<input type="datetime-local">` butuh
// string dalam WAKTU LOKAL. Untuk WIB (UTC+7), efeknya: jam 00:00 lokal
// jadi "17:00 hari sebelumnya" pas di-slice, lalu saat dibaca ulang buat
// mengecek status kuis (`new Date(quizOpenDate)`), string itu di-parse
// lagi sebagai waktu LOKAL — jadi geser lagi 7 jam dari yang seharusnya.
// Ini akar dari keluhan "tanggal berantakan" / status kuis salah.
// Fix: helper ini membangun string datetime-local dari KOMPONEN WAKTU
// LOKAL (getFullYear/getHours/dst), bukan dari toISOString().
const toLocalInputValue = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ============================================================
// 🔥 TIPE SOAL
// ============================================================
const QUESTION_TYPES = [
  { id: 'multiple', label: 'Pilihan Ganda Biasa', icon: <CheckCircle size={14} />, color: '#3b82f6' },
  { id: 'truefalse', label: 'Tabel Benar/Salah', icon: <Table size={14} />, color: '#10b981' },
  { id: 'multiselect', label: 'Pilih Lebih dari Satu', icon: <CheckSquare size={14} />, color: '#8b5cf6' },
  { id: 'reading', label: 'Membaca Teks', icon: <AlignLeft size={14} />, color: '#f59e0b' },
  { id: 'shortanswer', label: 'Isian Singkat', icon: <Hash size={14} />, color: '#ef4444' },
  { id: 'causeeffect', label: 'Sebab Akibat', icon: <Grid size={14} />, color: '#06b6d4' },
  { id: 'matching', label: 'Menjodohkan', icon: <ArrowLeftRight size={14} />, color: '#ec4899' },
];

// ============================================================
// 🔥 RENDER MATH
// ============================================================
const renderMath = (text) => {
  if (!text) return null;
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return <BlockMath key={i} math={part.substring(2, part.length - 2)} />; }
      catch (e) { return <span key={i} style={{color:'red'}}>{part}</span>; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={i} math={part.substring(1, part.length - 1)} />; }
      catch (e) { return <span key={i} style={{color:'red'}}>{part}</span>; }
    }
    // 🔥 FIX: bagian non-math -- prompt AI sekarang udah dilarang pakai
    // markdown, TAPI ini lapis jaga-jaga kedua kalau suatu saat masih
    // kelolos (model AI beda, arahan guru yang aneh-aneh, dll). Tanpa ini,
    // "**Perlakuan A**" nongol mentah dengan bintangnya dan bikin guru
    // bingung baca soal -- sekarang **teks** beneran dirender tebal, dan
    // baris baru (\n) jadi line break asli, bukan simbol mentah.
    const lines = part.split('\n');
    return (
      <React.Fragment key={i}>
        {lines.map((line, li) => {
          const boldParts = line.split(/(\*\*.+?\*\*)/g);
          return (
            <React.Fragment key={li}>
              {boldParts.map((bp, bi) =>
                bp.startsWith('**') && bp.endsWith('**') && bp.length > 4
                  ? <strong key={bi}>{bp.slice(2, -2)}</strong>
                  : bp
              )}
              {li < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  });
};

// Template soal kosong (dipakai di banyak tempat)
const emptyQuestion = (idx = 0) => ({
  id: Date.now() + idx,
  type: 'multiple',
  q: '',
  qImage: '',
  options: ['', '', '', ''],
  optionImages: ['', '', '', ''],
  correct: 0,
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
  needsManualAnswer: false,
  // 🔥 BARU: penanda dari AI Generate ("Generate dari Topik") kalau soal ini
  // sebaiknya dilengkapi gambar/diagram akurat oleh guru. Kosong/false untuk
  // soal yang dibuat manual (gak relevan).
  needsImage: false,
  imageHint: '',
  imageSource: null,
  researchBacked: false,
  researchSources: [],
  visualRequired: false,
  visualKind: 'none',
  optionsAreImages: false,
  matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }]
});

// ============================================================
// 🔥 BARU: DOWNLOAD SOAL & JAWABAN LENGKAP (PDF)
// ============================================================
// KENAPA DITAMBAHKAN: kasus nyata -- Guru A gak bisa hadir buat bahas
// pembahasan try out yang dia bikin sendiri, digantikan Guru C. Daripada
// Guru C harus masuk akun Guru A (risiko gak sengaja ubah/hapus data guru
// lain), Guru A (atau admin) tinggal download PDF ini SEKALI dan kirim
// lewat WhatsApp/email ke Guru C -- isinya semua soal, opsi, KUNCI
// JAWABAN, dan pembahasan, dari SEMUA tipe soal (bukan cuma pilihan
// ganda). Guru C bisa langsung pegang PDF ini pas ngajar tanpa pernah
// nyentuh dashboard Guru A sama sekali.
const TYPE_LABELS_PDF_QUIZ = {
  multiple: 'Pilihan Ganda',
  truefalse: 'Tabel Benar/Salah',
  multiselect: 'Pilih Lebih dari Satu',
  reading: 'Membaca Teks',
  shortanswer: 'Isian Singkat',
  causeeffect: 'Sebab Akibat',
  matching: 'Menjodohkan',
};

// 🔥 BARU: jsPDF TIDAK BISA render rumus LaTeX/KaTeX beneran (beda dari
// tampilan di layar guru/siswa yang pakai KaTeX buat nge-render simbol
// matematika visual) -- kalau teks mentah "$\frac{v \times t}{2}$" langsung
// ditulis ke PDF, hasilnya persis kode aslinya yang berantakan dibaca,
// bukan simbol matematika. Fungsi ini mengonversi notasi LaTeX yang PALING
// SERING dipakai di soal (pecahan, kali, subscript/superscript, \text{},
// implies, dll) jadi teks biasa yang tetap kebaca jelas walau gak
// se-rapi rendering visual asli. Gak lengkap 100% buat LaTeX yang rumit
// banget, tapi jauh lebih baik daripada kode mentah apa adanya.
const latexToPlainTextForPdf = (raw = '') => {
  let s = String(raw || '');
  // \text{...} -> isinya doang
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  // \frac{a}{b} -> (a)/(b)
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');
  // \sqrt{a} -> √(a)
  s = s.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
  // operator umum
  s = s
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\implies/g, '⟹')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\eta/g, 'η')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\%/g, '%');
  // subscript/superscript sederhana: X_1 -> X1, X^2 -> X^2 (dibiarkan
  // simple, cukup dihapus kurung kurawalnya kalau ada)
  s = s.replace(/_\{([^}]*)\}/g, '$1').replace(/\^\{([^}]*)\}/g, '^$1');
  s = s.replace(/_([a-zA-Z0-9])/g, '$1');
  // buang delimiter dolar & kurung kurawal sisa yang gak kepakai fungsi di atas
  s = s.replace(/\$\$/g, '').replace(/\$/g, '');
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/[{}]/g, '');
  return s;
};

// 🔥 Coba unduh gambar & ubah jadi data URI buat ditempel ke PDF. Gambar
// tersimpan di Firebase Storage, dan environment ini sudah pernah
// kejadian gagal load gambar gara-gara CORS -- jadi ini WAJIB dibungkus
// try/catch. Kalau gagal, PDF tetap lanjut jalan (skip gambar itu, kasih
// catatan link-nya) daripada bikin seluruh proses download gagal total.
const loadImageForPdf = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 120, h: 90 });
      img.src = dataUrl;
    });
    return { dataUrl, ...dims };
  } catch (e) {
    console.error('Gagal muat gambar buat PDF:', url, e);
    return null;
  }
};

const generateQuizAnswerKeyPDF = async (quizTitle, quizSubject, questions, quizMode, difficulty) => {
  const validQuestions = questions.filter(q => q.q.trim() || q.qImage);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let y = 20;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFillColor(103, 58, 183);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('SOAL & KUNCI JAWABAN LENGKAP', marginX, 11);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Bimbel Gemilang - Dokumen internal guru (bukan untuk siswa)', marginX, 18);
  doc.setTextColor(30, 41, 59);
  y = 32;

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(quizTitle || 'Kuis', marginX, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Mapel: ${quizSubject || '-'}  |  Jumlah soal: ${validQuestions.length}  |  Tingkat: ${difficulty || '-'}  |  Dibuat: ${new Date().toLocaleDateString('id-ID')}`, marginX, y);
  doc.setTextColor(30, 41, 59);
  y += 8;

  for (let idx = 0; idx < validQuestions.length; idx++) {
    const q = validQuestions[idx];
    ensureSpace(20);

    // Nomor + tipe soal
    doc.setFillColor(243, 232, 255);
    doc.roundedRect(marginX, y - 4, 28, 6, 2, 2, 'F');
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(103, 58, 183);
    doc.text(`Soal ${idx + 1}`, marginX + 3, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(TYPE_LABELS_PDF_QUIZ[q.type] || q.type, marginX + 32, y);
    doc.setTextColor(30, 41, 59);
    y += 6;

    // Teks soal (rumus LaTeX dikonversi dulu ke teks biasa -- jsPDF gak bisa
    // render LaTeX beneran, lihat penjelasan lengkap di latexToPlainTextForPdf())
    doc.setFontSize(10.5);
    doc.setFont(undefined, 'bold');
    const qLines = doc.splitTextToSize(latexToPlainTextForPdf(q.q) || '(soal bergambar)', contentWidth);
    ensureSpace(qLines.length * 5 + 4);
    doc.text(qLines, marginX, y);
    y += qLines.length * 5 + 2;
    doc.setFont(undefined, 'normal');

    // Gambar soal (kalau ada)
    if (q.qImage) {
      const img = await loadImageForPdf(q.qImage);
      if (img) {
        const maxW = 80, maxH = 60;
        let w = img.w, h = img.h;
        const scale = Math.min(maxW / w, maxH / h, 1);
        w *= scale; h *= scale;
        ensureSpace(h + 4);
        try {
          doc.addImage(img.dataUrl, 'PNG', marginX, y, w, h);
          y += h + 4;
        } catch (e) {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text('[Gambar gagal ditempel - buka link di editor kuis]', marginX, y);
          doc.setTextColor(30, 41, 59);
          y += 5;
        }
      } else {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('[Gambar tidak dapat dimuat - cek langsung di editor kuis]', marginX, y);
        doc.setTextColor(30, 41, 59);
        y += 5;
      }
    }

    doc.setFontSize(9.5);

    // ===== BODY PER TIPE SOAL =====
    if (q.type === 'multiple') {
      if (q.optionsAreImages) {
        for (let oi = 0; oi < q.options.length; oi++) {
          const letter = String.fromCharCode(65 + oi);
          const isCorrect = q.correct === oi;
          ensureSpace(10);
          doc.setFont(undefined, isCorrect ? 'bold' : 'normal');
          doc.setTextColor(isCorrect ? 16 : 30, isCorrect ? 129 : 41, isCorrect ? 76 : 59);
          doc.text(`${letter}. ${isCorrect ? '(KUNCI JAWABAN)' : '(gambar opsi - lihat di editor kuis)'}`, marginX + 3, y);
          doc.setTextColor(30, 41, 59);
          y += 5;
        }
      } else {
        (q.options || []).forEach((opt, oi) => {
          const letter = String.fromCharCode(65 + oi);
          const isCorrect = q.correct === oi;
          const lines = doc.splitTextToSize(`${letter}. ${latexToPlainTextForPdf(opt) || '-'}${isCorrect ? '   (KUNCI)' : ''}`, contentWidth - 6);
          ensureSpace(lines.length * 5);
          doc.setFont(undefined, isCorrect ? 'bold' : 'normal');
          if (isCorrect) doc.setTextColor(16, 129, 76); else doc.setTextColor(51, 65, 85);
          doc.text(lines, marginX + 3, y);
          doc.setTextColor(30, 41, 59);
          y += lines.length * 5;
        });
      }
    } else if (q.type === 'multiselect') {
      (q.options || []).forEach((opt, oi) => {
        const letter = String.fromCharCode(65 + oi);
        const isCorrect = (q.correctAnswers || []).includes(oi);
        const lines = doc.splitTextToSize(`${letter}. ${latexToPlainTextForPdf(opt) || '-'}${isCorrect ? '   (KUNCI)' : ''}`, contentWidth - 6);
        ensureSpace(lines.length * 5);
        doc.setFont(undefined, isCorrect ? 'bold' : 'normal');
        if (isCorrect) doc.setTextColor(16, 129, 76); else doc.setTextColor(51, 65, 85);
        doc.text(lines, marginX + 3, y);
        doc.setTextColor(30, 41, 59);
        y += lines.length * 5;
      });
    } else if (q.type === 'truefalse') {
      (q.statements || []).forEach((stmt, si) => {
        const lines = doc.splitTextToSize(`${si + 1}. ${latexToPlainTextForPdf(stmt.text) || '-'}   [Kunci: ${stmt.isTrue ? 'BENAR' : 'SALAH'}]`, contentWidth - 6);
        ensureSpace(lines.length * 5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(lines, marginX + 3, y);
        doc.setTextColor(30, 41, 59);
        y += lines.length * 5;
      });
    } else if (q.type === 'shortanswer') {
      ensureSpace(6);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(16, 129, 76);
      doc.text(`Kunci Jawaban: ${latexToPlainTextForPdf(q.shortAnswer) || '-'}`, marginX + 3, y);
      doc.setTextColor(30, 41, 59);
      y += 6;
    } else if (q.type === 'causeeffect') {
      ensureSpace(12);
      doc.setFont(undefined, 'normal');
      const causeLines = doc.splitTextToSize(`SEBAB: ${latexToPlainTextForPdf(q.cause) || '-'}   [${q.isCauseTrue ? 'BENAR' : 'SALAH'}]`, contentWidth - 6);
      doc.text(causeLines, marginX + 3, y);
      y += causeLines.length * 5;
      const effectLines = doc.splitTextToSize(`AKIBAT: ${latexToPlainTextForPdf(q.effect) || '-'}   [${q.isEffectTrue ? 'BENAR' : 'SALAH'}]`, contentWidth - 6);
      ensureSpace(effectLines.length * 5);
      doc.text(effectLines, marginX + 3, y);
      y += effectLines.length * 5;
    } else if (q.type === 'matching') {
      (q.matchingPairs || []).forEach((p, pi) => {
        const lines = doc.splitTextToSize(`${pi + 1}. ${latexToPlainTextForPdf(p.left) || '-'}  ->  ${latexToPlainTextForPdf(p.right) || '-'}`, contentWidth - 6);
        ensureSpace(lines.length * 5);
        doc.text(lines, marginX + 3, y);
        y += lines.length * 5;
      });
    } else if (q.type === 'reading') {
      if (q.readingText) {
        ensureSpace(10);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(100, 116, 139);
        const rLines = doc.splitTextToSize(latexToPlainTextForPdf(q.readingText), contentWidth - 6);
        doc.text(rLines, marginX + 3, y);
        doc.setTextColor(30, 41, 59);
        y += rLines.length * 5 + 2;
      }
      (q.subQuestions || []).forEach((sq, sqi) => {
        doc.setFont(undefined, 'bold');
        const sqLines = doc.splitTextToSize(`${sqi + 1}. ${latexToPlainTextForPdf(sq.q) || '-'}`, contentWidth - 6);
        ensureSpace(sqLines.length * 5);
        doc.text(sqLines, marginX + 3, y);
        y += sqLines.length * 5;
        doc.setFont(undefined, 'normal');
        (sq.options || []).forEach((opt, oi) => {
          const letter = String.fromCharCode(65 + oi);
          const isCorrect = sq.correct === oi;
          const lines = doc.splitTextToSize(`   ${letter}. ${latexToPlainTextForPdf(opt) || '-'}${isCorrect ? '  (KUNCI)' : ''}`, contentWidth - 10);
          ensureSpace(lines.length * 5);
          if (isCorrect) doc.setTextColor(16, 129, 76); else doc.setTextColor(51, 65, 85);
          doc.text(lines, marginX + 6, y);
          doc.setTextColor(30, 41, 59);
          y += lines.length * 5;
        });
      });
    }

    // Pembahasan
    if (q.explanation) {
      ensureSpace(10);
      y += 1;
      doc.setFillColor(238, 242, 255);
      const expLines = doc.splitTextToSize(`Pembahasan: ${latexToPlainTextForPdf(q.explanation)}`, contentWidth - 8);
      const boxH = expLines.length * 4.6 + 4;
      ensureSpace(boxH);
      doc.roundedRect(marginX, y - 3, contentWidth, boxH, 2, 2, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(67, 56, 202);
      doc.text(expLines, marginX + 3, y + 1);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9.5);
      y += boxH + 2;
    }

    // Separator antar soal
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
  }

  // Footer di semua halaman
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Dokumen internal guru - berisi kunci jawaban lengkap, JANGAN dibagikan ke siswa.', marginX, pageHeight - 8);
    doc.text(`Halaman ${p}/${pageCount}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }

  const safeName = String(quizTitle || 'Kuis').replace(/[^a-z0-9]/gi, '_');
  doc.save(`Soal_Jawaban_${safeName}.pdf`);
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modulId = searchParams.get('modulId');
  const sectionId = searchParams.get('sectionId');
  // 🔥 BARU: id dokumen KUIS itu sendiri (kalau section ini sudah pernah
  // dibuatkan kuis sebelumnya). Dikirim oleh ManageMateri.jsx dari
  // section.quizId. Ini yang benerin bug "kuis yang sudah ada hilang saat
  // dibuka lagi" — lihat penjelasan di useEffect pemuatan data di bawah.
  const linkedQuizIdParam = searchParams.get('quizId');
  const isFromModul = !!modulId && !!sectionId;
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);
  // 🔥 BARU: status terpisah buat tombol download PDF soal+jawaban --
  // dipisah dari `loading` (yang dipakai buat simpan kuis) karena
  // proses ambil gambar buat PDF makan waktu sendiri & gak boleh ke-mix
  // sama proses simpan.
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTarget, setUploadTarget] = useState(null);
  // 🔥 BARU: hasil pencarian gambar otomatis (Openverse -> Wikimedia fallback)
  // buat soal yang AI tandai "needsImage". Disimpan per-questionId biar
  // beberapa soal bisa nampilin hasil pencarian sendiri-sendiri tanpa
  // tabrakan. searchingImageFor nyimpen id soal yang lagi dicariin (buat
  // munculin loading spinner cuma di soal itu).
  const [imageSearchResults, setImageSearchResults] = useState({}); // { [questionId]: [{url, thumb, title, source}] }
  const [searchingImageFor, setSearchingImageFor] = useState(null);
  const [imageSearchError, setImageSearchError] = useState({});
  
  // 🔥 MODE KUIS
  const [quizMode, setQuizMode] = useState('simple');
  
  // Data Quiz
  const [quizTitle, setQuizTitle] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  // 🔥 Field "deadline" lama dihapus dari UI (lihat penjelasan di Identitas
  // Kuis) — state-nya juga dihapus di sini karena sudah tidak dipakai.
  
  // Jadwal
  // 🔥 FIX BUG TANGGAL: dulu pakai toISOString() (UTC) — sekarang pakai
  // toLocalInputValue() (waktu lokal perangkat), lihat penjelasan di atas.
  const [quizOpenDate, setQuizOpenDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return toLocalInputValue(now);
  });
  const [quizCloseDate, setQuizCloseDate] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    now.setHours(23, 59, 0, 0);
    return toLocalInputValue(now);
  });
  const [useSchedule, setUseSchedule] = useState(false);
  
  const [questions, setQuestions] = useState([emptyQuestion(0)]);
  
  // Fitur Lanjutan
  const [timeLimit, setTimeLimit] = useState(0);
  const [randomOrder, setRandomOrder] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showScoreToStudent, setShowScoreToStudent] = useState(true);
  // 🔥 BARU: fitur "target siswa tertentu" buat kuis STANDALONE (yang
  // gak nempel ke modul). Sebelumnya opsi ini cuma ada buat kuis yang
  // ngikutin target modul induknya -- kuis mandiri gak punya jalan sama
  // sekali buat ditargetin ke siswa spesifik.
  const [allStudentsForQuiz, setAllStudentsForQuiz] = useState([]);
  const [filteredStudentsForQuiz, setFilteredStudentsForQuiz] = useState([]);
  // 🔥 BARU: data siswa MENTAH (belum disaring kodeMapel) -- diisi oleh
  // loadRefs(), disaring reaktif di effect terpisah tiap `kodeMapel`
  // (mapel yang lagi dipilih) berubah. Lihat penjelasan lengkap di loadRefs.
  const [allStudentsForQuizRaw, setAllStudentsForQuizRaw] = useState([]);
  const [studentSearchForQuiz, setStudentSearchForQuiz] = useState('');
  const [showStudentPickerForQuiz, setShowStudentPickerForQuiz] = useState(false);
  const [selectedStudentsForQuiz, setSelectedStudentsForQuiz] = useState([]);
  // 🔥 BARU: kode SATU mapel spesifik yang lagi dipilih guru (beda dari
  // `quizSubject` yang cuma nyimpen NAMA-nya) -- dipakai buat nyaring
  // daftar siswa & disimpan ke dokumen kuis, supaya target kuis "Bahasa
  // Indonesia SD" gak nyasar ke siswa SMP/SMA walau guru yang sama ngajar
  // ketiganya. Lihat penjelasan lengkap di loadRefs().
  const [kodeMapel, setKodeMapel] = useState('');
  // 🔥 BARU: pasangan {nama, kode} tiap mapel yang diampu guru ini secara
  // individual -- dipakai buat nyari kodeMapel yang BENAR begitu guru
  // ganti pilihan mapel di dropdown Identitas Kuis.
  const [teacherMapelOptions, setTeacherMapelOptions] = useState([]);

  useEffect(() => {
    if (!studentSearchForQuiz.trim()) {
      setFilteredStudentsForQuiz(allStudentsForQuiz);
      return;
    }
    const term = studentSearchForQuiz.toLowerCase();
    setFilteredStudentsForQuiz(allStudentsForQuiz.filter(s =>
      (s.nama || '').toLowerCase().includes(term) || (s.studentId || '').toLowerCase().includes(term)
    ));
  }, [studentSearchForQuiz, allStudentsForQuiz]);

  const toggleStudentForQuiz = (student) => {
    setSelectedStudentsForQuiz(prev => {
      const exists = prev.some(s => s.studentId === student.studentId);
      if (exists) return prev.filter(s => s.studentId !== student.studentId);
      return [...prev, { id: student.id, studentId: student.studentId, nama: student.nama, kelasSekolah: student.kelasSekolah }];
    });
  };

  const selectAllFilteredForQuiz = () => {
    const already = selectedStudentsForQuiz.map(s => s.studentId);
    const toAdd = filteredStudentsForQuiz.filter(s => !already.includes(s.studentId));
    setSelectedStudentsForQuiz(prev => [...prev, ...toAdd.map(s => ({ id: s.id, studentId: s.studentId, nama: s.nama, kelasSekolah: s.kelasSekolah }))]);
  };
  const [difficulty, setDifficulty] = useState('Sedang');
  // 🔥 BARU: Deteksi kecurangan dasar khusus Mode Ujian — mendeteksi siswa
  // pindah tab/aplikasi (BUKAN mencegah HP kedua, itu di luar jangkauan web).
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(false);
  
  // Target
  // 🔥 BERUBAH: opsi "Tautkan ke Modul" DIHAPUS -- kalau guru mau kuis
  // nempel ke sebuah modul, satu-satunya jalan resmi sekarang lewat
  // "Tambah Kuis" DARI DALAM ManageMateri.jsx. Default sekarang 'mandiri'.
  const [publishTarget, setPublishTarget] = useState('mandiri');
  // `selectedModul`/`modulList` DIHAPUS -- gak dipakai lagi.
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedProgram, setSelectedProgram] = useState("Semua");
  
  // Data referensi
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // 🔥 SMART IMPORT
  const [showSmartImport, setShowSmartImport] = useState(false);

  // 🔥 IMPORT DARI WORD (lebih akurat dari PDF crop)
  const [showWordImport, setShowWordImport] = useState(false);

  // 🔥 AI GENERATE DARI TOPIK
  const [showAIGenerateQuiz, setShowAIGenerateQuiz] = useState(false);
  
  // Preview
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  
  // 🔥 EDITING SECTION
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [toast, setToast] = useState(null);
  
  // 🔥 Flag untuk AI Generate
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  // 🔥 FIX BUG: flag buat bedain 2 skenario yang KEBETULAN sama-sama pakai
  // `modulId` di URL tapi maksudnya beda total:
  // (a) BUKA KUIS YANG SUDAH ADA buat diedit -> modulId = ID kuis itu sendiri
  // (b) BIKIN KUIS BARU lalu ditautkan ke sebuah modul -> modulId dipilih dari
  //     dropdown "Tautkan ke Modul", targetnya modul materi (BUKAN kuis)
  // Tanpa flag ini, skenario (a) kesimpulan salah dianggap skenario (b),
  // sehingga update malah bikin DUPLIKAT kuis baru alih-alih nimpa yang lama.
  const [isEditingExistingQuiz, setIsEditingExistingQuiz] = useState(false);

  // 🔥 UNDO / REDO
  const [history, setHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const isUndoRedoAction = React.useRef(false);
  const hasMountedHistory = React.useRef(false);

  useEffect(() => {
    if (isUndoRedoAction.current) { isUndoRedoAction.current = false; return; }
    if (!hasMountedHistory.current) { hasMountedHistory.current = true; }
    setHistory(prev => {
      const trimmed = prev.slice(0, historyPointer + 1);
      return [...trimmed, questions].slice(-20);
    });
    setHistoryPointer(prev => Math.min(prev + 1, 19));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const handleUndo = () => {
    if (historyPointer <= 0) return;
    isUndoRedoAction.current = true;
    const targetIndex = historyPointer - 1;
    setHistoryPointer(targetIndex);
    setQuestions(history[targetIndex]);
  };

  const handleRedo = () => {
    if (historyPointer >= history.length - 1) return;
    isUndoRedoAction.current = true;
    const targetIndex = historyPointer + 1;
    setHistoryPointer(targetIndex);
    setQuestions(history[targetIndex]);
  };

  // 🔥 DRAFT OTOMATIS (localStorage)
  const draftKey = `quizDraft_${modulId || 'new'}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (questions.some(q => q.q.trim() || q.qImage)) {
        localStorage.setItem(draftKey, JSON.stringify({
          quizTitle, quizSubject, questions, savedAt: Date.now()
        }));
      }
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, quizTitle, quizSubject]);

  useEffect(() => {
    // 🔥 FIX BUG: dulu prompt "kembalikan draft?" muncul untuk SEMUA kuis,
    // termasuk kuis yang datanya sudah tersimpan rapi di database. Dua masalah:
    //  (1) Membingungkan — guru cuma mau mengedit, malah ditanya soal draft
    //      yang mereka nggak ingat pernah buat.
    //  (2) BERBAHAYA — pemulihan draft ini berlomba dengan pengambilan data
    //      dari database (dua-duanya jalan bersamaan). Tergantung siapa yang
    //      selesai duluan, isi kuis bisa tertimpa draft basi, atau draft yang
    //      baru dipulihkan langsung hilang tertimpa data database.
    // Sekarang draft HANYA untuk kuis yang benar-benar baru (belum pernah
    // disimpan). Untuk kuis yang sudah ada, database satu-satunya acuan.
    if (modulId) return;

    const raw = localStorage.getItem(draftKey);
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        if (draft.questions?.length > 0) {
          const waktu = new Date(draft.savedAt).toLocaleString('id-ID');
          if (window.confirm(`📝 Ditemukan draft tersimpan otomatis (${waktu}). Lanjutkan draft ini?`)) {
            setQuestions(draft.questions);
            if (draft.quizTitle) setQuizTitle(draft.quizTitle);
            if (draft.quizSubject) setQuizSubject(draft.quizSubject);
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      } catch (e) { /* abaikan draft rusak */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // TOAST
  // ============================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 FIX BUG "Tautkan ke Modul selalu error" & "Jenjang kadang gak
  // keluar": sebelumnya TIGA query di sini (daftar modul, daftar kelas dari
  // siswa, daftar mapel dari guru) dijalankan BERURUTAN (`await` satu-satu)
  // TANPA try/catch sama sekali. Begitu SATU SAJA dari ketiganya gagal
  // (paling sering karena race condition -- query nembak Firestore sebelum
  // sesi login/Auth sempat pulih penuh begitu halaman baru dibuka), seluruh
  // fungsi berhenti di situ dan SISANYA tidak pernah ke-set: dropdown
  // "Pilih Modul..." tetap kosong (bikin "Tautkan ke Modul" selalu gagal
  // dengan pesan "Pilih modul tujuan!"), dan dropdown kelas buat "Tautkan
  // ke Jenjang" ikut kosong juga -- padahal keduanya sebenarnya gak saling
  // berhubungan. Sekarang ketiganya dijalankan PARALEL & INDEPENDEN lewat
  // Promise.allSettled: kalaupun satu gagal, dua lainnya tetap berhasil
  // dimuat. Kalau ADA yang gagal, otomatis dicoba ulang sekali, dan kalau
  // masih gagal juga, UI kasih tombol "Coba Lagi" yang jelas.
  const [refsStatus, setRefsStatus] = useState('loading'); // loading | error | loaded

  const loadRefs = React.useCallback(async () => {
    setRefsStatus('loading');
    // 🔥 BERUBAH: fetch daftar modul (buat dropdown "Tautkan ke Modul")
    // DIHAPUS -- opsi itu sudah gak ada lagi (lihat penjelasan di bagian
    // handleSaveQuiz & render Target Publish). Fetch guru juga DIUBAH: dulu
    // ambil SEMUA guru se-sekolah lalu gabung SEMUA mapel mereka jadi satu
    // daftar besar (dropdown nampilin mapel guru LAIN juga, aneh dan gak
    // relevan) -- sekarang cuma ambil dokumen guru yang LAGI LOGIN, terus
    // pecah mapel-mapel MILIK GURU ITU SENDIRI jadi opsi individual.
    const savedTeacher = JSON.parse(localStorage.getItem('teacherData') || '{}');
    const teacherName = savedTeacher.nama || '';

    const [siswaResult, guruResult] = await Promise.allSettled([
      getDocs(collection(db, "students")),
      teacherName
        ? getDocs(query(collection(db, "teachers"), where("nama", "==", teacherName)))
        : Promise.resolve({ docs: [] }),
    ]);

    let anyFailed = false;

    if (siswaResult.status === 'fulfilled') {
      const siswaData = siswaResult.value.docs.map(d => {
        const s = d.data();
        return {
          id: d.id,
          studentId: s.studentId || d.id,
          nama: s.nama || 'Siswa',
          kelasSekolah: s.kelasSekolah || '-',
          program: s.kategori || 'Reguler',
          enrolledSubjects: Array.isArray(s.enrolledSubjects) ? s.enrolledSubjects : [],
        };
      }).sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      // 🔥 BARU: data siswa MENTAH (belum disaring kodeMapel) buat panel
      // "Siswa Tertentu" -- penyaringan sebenarnya dilakukan di effect
      // terpisah (bereaksi ke `kodeMapel`), lihat penjelasan di sana.
      setAllStudentsForQuizRaw(siswaData);
      // 🔥 `availableClasses` DIHAPUS dari sini -- sekarang dihitung
      // REAKTIF di effect terpisah (bereaksi ke `kodeMapel`) di bawah,
      // supaya ke-scope cuma ke jenjang yang beneran ada siswanya
      // terdaftar di mapel yang lagi diedit.
    } else {
      anyFailed = true;
      console.error("Gagal ambil daftar kelas & siswa:", siswaResult.reason);
    }

    if (guruResult.status === 'fulfilled') {
      const guru = guruResult.value.docs[0]?.data();
      // 🔥 FIX BUG NYATA & PERKETAT (sama seperti perbaikan di
      // ManageMateri.jsx): guru bisa ngajar LEBIH DARI 1 mapel, disimpan
      // sebagai STRING GABUNGAN dipisah koma di field `mapel` (nama) &
      // `kodeMapel` (kode) yang SALING BERPASANGAN posisinya. Sekarang
      // dipecah jadi pasangan {nama, kode} individual -- guru WAJIB pilih
      // SATU dari situ buat tiap kuis, supaya kodeMapel yang kesimpen ke
      // kuis jadi SATU kode spesifik aja (bukan gabungan semua mapel guru
      // itu) -- ini yang mastiin target siswanya juga tepat sesuai mapel
      // yang benar-benar dipilih, bukan nyasar ke jenjang lain.
      const namaList = String(guru?.mapel || '').split(',').map(s => s.trim()).filter(Boolean);
      const kodeList = String(guru?.kodeMapel || '').split(',').map(s => s.trim()).filter(Boolean);
      const pairedOptions = namaList.map((nama, idx) => ({ nama, kode: kodeList[idx] || '' }));

      setTeacherMapelOptions(pairedOptions);
      // 🔥 FIX BUG AKAR MASALAH (laporan langsung: "kuis tertaut Mapel
      // Umum, padahal Mapel Umum gak pernah ditambahin di mana pun"):
      // SEBELUMNYA di sini ada fallback `["Umum"]` kalau guru belum punya
      // mapel/kodeMapel valid di Firestore -- itu OPSI PALSU yang gak
      // terhubung ke kodeMapel manapun. Begitu guru (siapa pun) kepaksa
      // milih itu karena cuma itu opsi yang ada, tersimpan permanen ke
      // database sebagai subject:"Umum", kodeMapel:"" -- lalu (a) target
      // siswanya jadi TIDAK TERSARING SAMA SEKALI (lihat efek kodeMapel di
      // bawah, kodeMapel kosong = "jangan blokir siapa pun" = bocor ke
      // SEMUA siswa lintas mapel), dan (b) kuis itu jadi ORPHAN permanen:
      // begitu data guru DIPERBAIKI admin, opsi "Umum" ini hilang dari
      // dropdown (karena sekarang munculnya cuma dari mapel ASLI guru),
      // sehingga kuis lama itu gak pernah bisa dipilih ulang mapelnya lewat
      // dropdown biasa -- makanya WAJIB ditangani khusus di bawah (lihat
      // blok "opsi tambahan buat nilai lama yang gak valid lagi").
      // SEKARANG: kalau guru beneran belum py mapel valid, `subjects`
      // dibiarkan KOSONG -- form akan menampilkan peringatan jelas & kunci
      // tombol simpan (lihat render-nya di bawah), BUKAN diam-diam kasih
      // opsi palsu yang bisa kepilih dan mencemari database lagi.
      setSubjects(pairedOptions.map(o => o.nama));

      // Default: pilih mapel PERTAMA guru itu, TAPI cuma kalau ini kuis
      // BARU (belum ada quizSubject terisi dari data tersimpan) -- jangan
      // menimpa pilihan yang sudah dipulihkan dari dokumen lewat
      // populateQuizFromDoc().
      if (pairedOptions.length > 0 && !quizSubject) {
        setQuizSubject(pairedOptions[0].nama);
        setKodeMapel(pairedOptions[0].kode);
      }
    } else {
      anyFailed = true;
      console.error("Gagal ambil data mapel guru:", guruResult.reason);
    }

    setRefsStatus(anyFailed ? 'error' : 'loaded');
    return !anyFailed;
  }, [quizSubject]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await loadRefs();
      if (!ok && !cancelled) {
        setTimeout(() => { if (!cancelled) loadRefs(); }, 1200);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 🔥 sengaja cuma sekali di awal (bukan [loadRefs]) -- loadRefs sekarang punya dependency quizSubject yang berubah-ubah, kalau diikutin bisa refetch berulang terus

  // ============================================================
  // 🔥 BARU: SARING DAFTAR SISWA "SISWA TERTENTU" SESUAI MAPEL TERPILIH
  // ============================================================
  // Bereaksi ke `kodeMapel` (kode SATU mapel spesifik yang lagi dipilih di
  // dropdown Identitas Kuis) -- bukan dihitung sekali doang. Jadi kalau
  // guru ganti pilihan mapel, daftar siswa yang bisa ditarget di panel
  // "Siswa Tertentu" otomatis ikut nyesuaiin diri: cuma siswa yang memang
  // didaftarkan admin ke mapel itu (lewat halaman Edit Siswa) yang muncul.
  useEffect(() => {
    const normKode = (v) => String(v || '').toLowerCase().trim();
    const kodeAktif = normKode(kodeMapel);
    const hasil = !kodeAktif
      ? allStudentsForQuizRaw // belum ada mapel terpilih -> jangan blokir siapa pun
      : allStudentsForQuizRaw.filter(s =>
          s.enrolledSubjects.some(code => normKode(code) === kodeAktif || normKode(code) === 'semua')
        );
    setAllStudentsForQuiz(hasil);
    setFilteredStudentsForQuiz(hasil);

    // 🔥 FIX BUG NYATA (sama persis kelasnya dengan yang ketemu di
    // ManageMateri.jsx): sebelumnya `availableClasses` dihitung dari
    // SEMUA siswa system-wide, gak peduli kodeMapel yang lagi diedit --
    // dropdown "Target Jenjang" jadi nampilin kelas yang gak nyambung
    // sama sekali ke mapel kuis ini, gampang bikin guru salah pencet.
    // Sekarang di-scope PERSIS pakai `hasil` yang sama (siswa yang
    // BENERAN terdaftar admin ke kodeMapel yang lagi aktif).
    const kelasRelevan = [...new Set(hasil.map(s => s.kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    setAvailableClasses(kelasRelevan);
  }, [kodeMapel, allStudentsForQuizRaw]);

  // 🔥 Helper: isi semua state kuis dari SATU dokumen kuis (bukan dokumen
  // modul materi). Dipisah jadi fungsi sendiri supaya bisa dipanggil dari
  // dua jalur pemuatan (kuis mandiri langsung, atau kuis yang nempel di
  // dalam modul materi) tanpa duplikasi kode.
  const populateQuizFromDoc = (data) => {
    setQuizTitle(data.title || "");
    setQuizSubject(data.subject || "");
    // 🔥 FIX BUG NYATA: kodeMapel materi/kuis ini WAJIB disinkronkan ke yang
    // TERSIMPAN di dokumennya sendiri -- sebelumnya cuma `subject` (nama)
    // yang dipulihkan, `kodeMapel` gak disentuh sama sekali, jadi tetap
    // nyangkut ke default mapel PERTAMA guru (dari loadRefs). Kalau kuis
    // ini sebenarnya buat mapel ke-2/ke-3 guru, kodeMapel-nya jadi SALAH
    // begitu dibuka lagi -- daftar siswa "Siswa Tertentu" bisa nampilin
    // siswa mapel yang keliru, dan pengecekan akses siswa jadi salah arah.
    if (data.kodeMapel) setKodeMapel(data.kodeMapel);
    // deadlineQuiz lama tidak lagi dibaca ke state (field sudah dihapus dari UI)
    setTimeLimit(data.timeLimit || 0);
    setRandomOrder(data.randomOrder || false);
    setMaxAttempts(data.maxAttempts || 1);
    setShowExplanation(data.showExplanation !== false);
    setShowScoreToStudent(data.showScoreToStudent !== false);
    setDifficulty(data.difficulty || 'Sedang');
    setAntiCheatEnabled(data.antiCheatEnabled || false);
    setUseSchedule(data.useSchedule || false);
    setQuizOpenDate(data.quizOpenDate || quizOpenDate);
    setQuizCloseDate(data.quizCloseDate || quizCloseDate);
    setIsAIGenerated(data.generatedByAI || false);

    // 🔥 FIX BUG BESAR (pasangan dari fix di handleSaveQuiz): sebelumnya
    // fungsi ini TIDAK PERNAH memulihkan target publish (publishTarget,
    // siswa yang dipilih, kelas/program) dari data yang tersimpan --
    // panel "5. Target Publish" selalu balik ke nilai DEFAULT setiap kali
    // guru membuka lagi kuis yang sudah ada. Ini berbahaya: kalau guru
    // buka kuis buat alasan lain (mis. nambah soal) tanpa sadar panel
    // Target sudah "diam-diam" ke-reset, terus klik Simpan, target yang
    // sebenarnya (misal "Siswa Tertentu" yang sudah benar) bisa KETIMPA
    // balik ke default. Sekarang dipulihkan persis sesuai data tersimpan.
    if (data.sendToSpecificStudents) {
      setPublishTarget('siswa');
      setSelectedStudentsForQuiz(data.selectedStudents || []);
    } else if ((data.targetKelas && data.targetKelas !== 'Semua') || (data.targetKategori && data.targetKategori !== 'Semua')) {
      setPublishTarget('jenjang');
      setSelectedKelas(data.targetKelas || 'Semua');
      setSelectedProgram(data.targetKategori || 'Semua');
    } else {
      setPublishTarget('mandiri');
    }

    if (data.timeLimit > 0 || data.randomOrder || data.maxAttempts > 1) {
      setQuizMode('advanced');
    }

    if (data.quizData?.length > 0) {
      setQuestions(data.quizData.map((q, idx) => ({
        id: q.id || Date.now() + idx,
        type: q.type || 'multiple',
        q: q.question || '',
        qImage: q.questionImage || '',
        options: q.options || ['', '', '', ''],
        optionImages: q.optionImages || ['', '', '', ''],
        // 🔥 PELENGKAP PERUBAHAN B: field-field baru ini harus ikut DIBACA
        // BALIK juga waktu kuis dibuka lagi buat diedit. Kalau cuma
        // disimpan tapi gak dibaca, nilainya balik ke default tiap kali
        // guru buka kuisnya -- lalu ketimpa nilai default itu pas
        // disimpan ulang, alias HILANG PERMANEN walau tadinya sudah benar
        // tersimpan di database.
        optionsAreImages: !!q.optionsAreImages,
        answerVerification: q.answerVerification || '',
        analysisSummary: q.analysisSummary || '',
        sourceMode: q.sourceMode || 'source',
        sourceQuestionVerbatim: !!q.sourceQuestionVerbatim,
        sourceTitle: q.sourceTitle || '',
        sourceUrl: q.sourceUrl || '',
        correct: q.correctAnswer || 0,
        correctAnswers: q.correctAnswers || [],
        explanation: q.explanation || '',
        statements: q.statements || [{ text: '', isTrue: true }],
        readingText: q.readingText || '',
        subQuestions: q.subQuestions || [{ q: '', options: ['', '', '', ''], correct: 0 }],
        shortAnswer: q.shortAnswer || '',
        cause: q.cause || '',
        effect: q.effect || '',
        isCauseTrue: q.isCauseTrue !== undefined ? q.isCauseTrue : true,
        isEffectTrue: q.isEffectTrue !== undefined ? q.isEffectTrue : true,
        matchingPairs: q.matchingPairs && q.matchingPairs.length ? q.matchingPairs : [{ left: '', right: '' }, { left: '', right: '' }],
        needsImage: q.needsImage || false,
        imageHint: q.imageHint || '',
        researchBacked: q.researchBacked || false,
        researchSources: q.researchSources || [],
        visualRequired: q.visualRequired || false,
        visualKind: q.visualKind || 'none',
        needsManualAnswer: false
      })));
    }
  };

  useEffect(() => {
    if (!modulId) return;

    const fetchQuiz = async () => {
      // ── KASUS A: TIDAK ada sectionId → modulId di URL adalah ID DOKUMEN
      // KUIS itu sendiri (kuis mandiri yang dibuka langsung buat diedit).
      if (!sectionId) {
        const snap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (!snap.exists()) return;
        const data = snap.data();

        // 🔥 PENGAMAN: kalau dokumen ini sebenarnya MODUL MATERI (punya
        // blocks, dan bukan kuis mandiri), berarti guru nyasar ke sini.
        // Daripada menampilkan layar kuis kosong, alihkan ke editor materi.
        if (data.type !== 'kuis_mandiri' && (data.blocks?.length > 0)) {
          navigate(`/guru/modul/materi?edit=${modulId}`, { replace: true });
          return;
        }

        setPublishTarget('mandiri'); // nilai sementara, langsung ditimpa populateQuizFromDoc() di bawah kalau datanya sudah punya target lain
        setIsEditingExistingQuiz(true);
        populateQuizFromDoc(data);
        return;
      }

      // ── KASUS B: ADA sectionId → modulId di URL adalah MODUL MATERI
      // INDUK (bukan dokumen kuis). Kuis yang sebenarnya — kalau sudah
      // pernah dibuat — tersimpan di DOKUMEN TERPISAH yang idnya ada di
      // `section.quizId` di dalam modul induk.
      //
      // 🔥 FIX BUG UTAMA ("kuis yang sudah ada hilang saat dibuka lagi"):
      // sebelumnya kode di sini SALAH membaca dokumen MODUL MATERI seolah
      // itu dokumen kuis — jadi soal, timer, dan pengaturan kuis yang SUDAH
      // ADA sebelumnya tidak pernah termuat sama sekali (selalu tampil
      // kosong, seolah kuisnya hilang), karena dokumen modul materi memang
      // tidak punya field `quizData`/`timeLimit`/dst di level atasnya itu.
      // Sekarang kita cari dulu ID dokumen kuis yang benar (dari parameter
      // `quizId` di URL, atau sebagai cadangan dicari dari `section.quizId`
      // di dalam modul induk), baru fetch DOKUMEN KUIS-nya sendiri.
      // 🔥 BERUBAH: `setPublishTarget`/`setSelectedModul` yang dulu ada di
      // sini DIHAPUS -- gak relevan buat kuis isFromModul (panel Target
      // Publish sama sekali gak dirender buat kasus ini, selalu diganti
      // kotak info "Kuis Ini Bagian dari Modul").

      let quizIdToLoad = linkedQuizIdParam || null;
      if (!quizIdToLoad) {
        const parentSnap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (parentSnap.exists()) {
          const parentData = parentSnap.data();
          const block = (parentData.blocks || []).find(b => String(b.id) === String(sectionId));
          quizIdToLoad = block?.quizId || null;
          // 🔥 FIX BUG AKAR "guru terblokir gak bisa simpan kuis dalam modul":
          // sebelumnya cuma `subject` (NAMA mapel) yang disalin dari modul
          // induk ke state kuis baru ini, `kodeMapel` (KODE-nya, yang beneran
          // dipakai buat validasi & penyaringan akses siswa) TIDAK PERNAH
          // ikut disalin. Karena `quizSubject` jadi terisi duluan, default-
          // setter kodeMapel di loadRefs() (yang syaratnya "cuma isi kalau
          // quizSubject masih kosong") ikut ke-skip -- hasilnya kodeMapel
          // nyangkut KOSONG SELAMANYA walau nama mapelnya keliatan benar di
          // dropdown. Begitu guru klik "Simpan ke Modul", validasi
          // `!quizSubject || !kodeMapel` di handleSaveQuiz nge-block dengan
          // pesan seolah guru belum terdaftar ke mapel manapun -- padahal
          // guru udah bener, sistemnya yang lupa nyalin kode mapelnya.
          // Sekarang identitas mapel kuis 100% DISALIN UTUH (nama + kode)
          // dari modul induk, konsisten dengan prinsip "kuis-dalam-modul
          // ikut aturan modul induknya", persis kayak Target Publish.
          if (!quizIdToLoad) {
            setQuizSubject(parentData.subject || '');
            setKodeMapel(parentData.kodeMapel || '');
          }
        }
      }

      if (quizIdToLoad) {
        const quizSnap = await getDoc(doc(db, "bimbel_modul", quizIdToLoad));
        if (quizSnap.exists()) {
          setIsEditingExistingQuiz(true);
          populateQuizFromDoc(quizSnap.data());
        }
      } else {
        // Kuis ini memang belum pernah dibuat -- mulai dari kosong, wajar.
        setIsEditingExistingQuiz(false);
      }
    };

    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulId, sectionId, linkedQuizIdParam]);

  // ============================================================
  // 🔥 HANDLER UPLOAD GAMBAR
  // ============================================================
  const handleImageUpload = async (file, questionId, targetType, optionIndex = null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("❌ Gambar maksimal 10MB!");
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setUploadTarget(`${questionId}-${targetType}-${optionIndex || ''}`);
    
    try {
      const result = await uploadElearningFile(file, 'kuis');
      
      if (result.success) {
        const url = result.downloadURL;
        setQuestions(prev => prev.map(q => {
          if (q.id === questionId) {
            if (targetType === 'question') {
              return { ...q, qImage: url, imageSource: null };
            } else if (targetType === 'option' && optionIndex !== null) {
              const newOptionImages = [...q.optionImages];
              newOptionImages[optionIndex] = url;
              return { ...q, optionImages: newOptionImages };
            }
          }
          return q;
        }));
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      } else {
        alert("❌ Gagal upload: " + result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Gagal upload gambar: " + error.message);
    }
    
    setUploading(false);
    setUploadTarget(null);
  };

  // ============================================================
  // 🔥 BARU: PENCARIAN GAMBAR OTOMATIS (Openverse -> Wikimedia fallback)
  // ============================================================
  // Cuma dipakai buat soal yang AI tandai "needsImage" -- yaitu objek/
  // fenomena NYATA yang emang perlu FOTO ASLI (bukan diagram teknis yang
  // sudah dihandle graph/shape/pattern). Openverse jadi sumber utama karena
  // dia agregat dari banyak sumber (Flickr, museum, dll) yang lebih
  // beragam & lebih baru dibanding Wikimedia doang; Wikimedia jadi
  // cadangan kalau Openverse gak nemu apa-apa. DUA-DUANYA gratis, gak
  // perlu API key, dan HANYA nampilin gambar yang beneran berlisensi bebas
  // pakai ulang -- bukan comot sembarangan dari web yang berisiko hak
  // cipta. Guru TETAP yang milih dari beberapa kandidat (bukan auto-pasang
  // tanpa cek), karena AI gak selalu bisa mastiin akurasi gambar buat
  // konten sains/anatomi presisi.
  const searchImagesForQuestion = async (questionId, keyword) => {
    if (!keyword || !keyword.trim()) return;
    setSearchingImageFor(questionId);
    setImageSearchError(prev => ({ ...prev, [questionId]: '' }));
    setImageSearchResults(prev => ({ ...prev, [questionId]: [] }));

    const results = [];

    // Sumber 1: Openverse (api.openverse.org) -- agregat CC-licensed image
    // dari banyak sumber, cakupan lebih luas & lebih baru dari Wikimedia.
    try {
      const ovRes = await fetch(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(keyword)}&license_type=all-cc&page_size=6`
      );
      if (ovRes.ok) {
        const ovData = await ovRes.json();
        (ovData.results || []).forEach(r => {
          if (r.url) {
            results.push({
              url: r.url,
              thumb: r.thumbnail || r.url,
              title: r.title || keyword,
              source: `Openverse (${r.source || r.license || 'CC'})`,
            });
          }
        });
      }
    } catch (e) {
      console.warn('Openverse search gagal, lanjut ke Wikimedia:', e.message);
    }

    // Sumber 2: Wikimedia Commons -- fallback kalau Openverse kosong/gagal.
    // Endpoint publik, CORS-enabled lewat origin=*, gak perlu API key.
    if (results.length < 4) {
      try {
        const wmRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(keyword)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json&origin=*`
        );
        if (wmRes.ok) {
          const wmData = await wmRes.json();
          const pages = wmData?.query?.pages || {};
          Object.values(pages).forEach(p => {
            const info = p.imageinfo && p.imageinfo[0];
            if (info && info.url) {
              results.push({
                url: info.url,
                thumb: info.thumburl || info.url,
                title: p.title ? p.title.replace('File:', '') : keyword,
                source: 'Wikimedia Commons',
              });
            }
          });
        }
      } catch (e) {
        console.warn('Wikimedia search gagal:', e.message);
      }
    }

    setImageSearchResults(prev => ({ ...prev, [questionId]: results }));
    if (results.length === 0) {
      setImageSearchError(prev => ({
        ...prev,
        [questionId]: 'Gak nemu gambar yang cocok. Coba upload manual dari sumber terpercaya.',
      }));
    }
    setSearchingImageFor(null);
  };

  // Guru klik salah satu hasil pencarian -> langsung dipasang jadi qImage,
  // sama seperti hasil upload manual.
  const selectSearchedImage = (questionId, result) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? {
      ...q,
      qImage: result?.url || '',
      imageSource: result ? { title: result.title || '', url: result.url || '', source: result.source || '' } : null
    } : q));
    setImageSearchResults(prev => ({ ...prev, [questionId]: [] }));
  };


  const handleRemoveImage = (questionId, targetType, optionIndex = null) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        if (targetType === 'question') {
          return { ...q, qImage: '', imageSource: null };
        } else if (targetType === 'option' && optionIndex !== null) {
          const newOptionImages = [...q.optionImages];
          newOptionImages[optionIndex] = '';
          return { ...q, optionImages: newOptionImages };
        }
      }
      return q;
    }));
  };

  // ============================================================
  // 🔥 CRUD SOAL
  // ============================================================
  const addQuestion = (type = 'multiple') => {
    const newQuestion = { ...emptyQuestion(questions.length), type };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion.id);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const removeQuestion = (id) => {
    if (questions.length <= 1) {
      alert("⚠️ Minimal 1 soal!");
      return;
    }
    if (!window.confirm("Hapus soal ini?")) return;
    setQuestions(questions.filter(q => q.id !== id));
    if (editingQuestion === id) setEditingQuestion(null);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  // Dipanggil setiap guru menandai jawaban benar secara manual -> hilangkan badge peringatan
  const clearManualFlag = (id) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, needsManualAnswer: false } : q));
  };

  // ============================================================
  // 🔥 SMART IMPORT - HASIL PARSING
  // ============================================================
  const handleSmartParsed = (parsedQuestions) => {
    if (!parsedQuestions || parsedQuestions.length === 0) {
      showToast("⚠️ Tidak ditemukan soal pada teks tersebut.", 'error');
      return;
    }
    setQuestions(prev => {
      const isPrevEmpty = prev.length === 1 && !prev[0].q.trim() && !prev[0].qImage;
      return isPrevEmpty ? parsedQuestions : [...prev, ...parsedQuestions];
    });
    const needsReview = parsedQuestions.filter(q => q.needsManualAnswer).length;
    showToast(`✅ ${parsedQuestions.length} soal berhasil diimpor!${needsReview > 0 ? ` ${needsReview} soal perlu ditandai jawabannya.` : ''}`);
  };

  // ============================================================
  // 🔥 AI GENERATE DARI TOPIK - HASIL GENERATE
  // ============================================================
  const handleAIQuizGenerated = (generatedQuestions) => {
    if (!generatedQuestions || generatedQuestions.length === 0) {
      showToast("⚠️ AI tidak menghasilkan soal.", 'error');
      return;
    }
    setQuestions(prev => {
      const isPrevEmpty = prev.length === 1 && !prev[0].q.trim() && !prev[0].qImage;
      return isPrevEmpty ? generatedQuestions : [...prev, ...generatedQuestions];
    });
    setIsAIGenerated(true);
    showToast(`✨ ${generatedQuestions.length} soal berhasil dibuat AI! Cek dulu sebelum diterbitkan.`);
  };

  // ============================================================
  // 🔥 GET QUIZ STATUS
  // ============================================================
  const getQuizStatus = () => {
    if (!useSchedule) return { status: 'aktif', label: '🟢 Aktif (Tanpa Jadwal)', color: '#10b981', icon: <Unlock size={14} /> };
    const now = new Date();
    const open = new Date(quizOpenDate);
    const close = new Date(quizCloseDate);
    
    if (now < open) {
      return { status: 'belum', label: '⏳ Belum Dibuka', color: '#f59e0b', icon: <Lock size={14} /> };
    } else if (now > close) {
      return { status: 'kadaluarsa', label: '⛔ Kadaluarsa', color: '#ef4444', icon: <Lock size={14} /> };
    } else {
      return { status: 'aktif', label: '✅ Aktif', color: '#10b981', icon: <Unlock size={14} /> };
    }
  };

  // ============================================================
  // 🔥 PREVIEW
  // ============================================================
  const handlePreviewQuiz = () => {
    const previewAns = {};
    questions.forEach(q => {
      if (q.type === 'multiselect') {
        previewAns[q.id] = q.correctAnswers;
      } else if (q.type === 'truefalse') {
        previewAns[q.id] = q.statements.map(s => s.isTrue);
      } else if (q.type === 'shortanswer') {
        previewAns[q.id] = q.shortAnswer;
      } else if (q.type === 'causeeffect') {
        previewAns[q.id] = { cause: q.isCauseTrue, effect: q.isEffectTrue };
      } else if (q.type === 'reading') {
        previewAns[q.id] = q.subQuestions.map(sq => sq.correct);
      } else {
        previewAns[q.id] = q.correct;
      }
    });
    setPreviewAnswers(previewAns);
    setShowCorrectAnswers(true);
    setPreviewMode(true);
  };

  const handleClosePreview = () => {
    setPreviewMode(false);
    setPreviewAnswers({});
    setShowCorrectAnswers(false);
  };

  const toggleCorrectAnswers = () => {
    setShowCorrectAnswers(!showCorrectAnswers);
  };

  // ============================================================
  // 🔥 RENDER QUESTION EDITOR - PER TIPE
  // ============================================================
  const renderQuestionEditor = (item, idx) => {
    const isEditing = editingQuestion === item.id;
    const typeInfo = QUESTION_TYPES.find(t => t.id === item.type) || QUESTION_TYPES[0];
    
    return (
      <div 
        key={item.id} 
        style={{
          background: 'white',
          padding: isMobile ? 14 : 18,
          borderRadius: 12,
          border: isEditing ? `2px solid ${typeInfo.color}` : (item.needsManualAnswer ? '2px solid #f59e0b' : '1px solid #e2e8f0'),
          marginBottom: 10,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          boxShadow: isEditing ? `0 4px 12px ${typeInfo.color}25` : 'none'
        }}
        onClick={() => setEditingQuestion(item.id)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              color: item.q.trim() ? '#10b981' : '#94a3b8',
              background: item.q.trim() ? '#dcfce7' : '#f1f5f9',
              padding: '2px 10px',
              borderRadius: 10
            }}>
              Soal {idx + 1} {item.q.trim() ? '✅' : '⏳'}
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: typeInfo.color,
              background: typeInfo.color + '15',
              padding: '2px 10px',
              borderRadius: 10
            }}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            {item.needsManualAnswer && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', border: '1px solid #f59e0b', padding: '2px 8px', borderRadius: 10 }}>
                ⚠️ Perlu tandai jawaban
              </span>
            )}
            {item.needsImage && !item.qImage && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#92400e', background: '#fef3c7', border: '1px solid #f59e0b', padding: '2px 8px', borderRadius: 10 }}>
                💡 AI: sebaiknya pakai gambar
              </span>
            )}
            {isEditing && (
              <span style={{ fontSize: 9, color: '#3b82f6', fontWeight: 600, background: '#eef2ff', padding: '2px 8px', borderRadius: 4 }}>
                ✏️ Edit
              </span>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); removeQuestion(item.id); }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        <div style={{ fontSize: 13, color: item.q.trim() ? '#1e293b' : '#94a3b8' }}>
          {item.q.trim() ? renderMath(item.q) : 'Klik untuk edit soal...'}
          {item.qImage && <span style={{ marginLeft: 6, fontSize: 10, color: '#10b981' }}>🖼️</span>}
          {item.researchBacked && <span style={{ marginLeft: 6, fontSize: 9, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>🌐 RISET INTERNET</span>}
        </div>
        
        {isEditing && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            {item.researchBacked && item.researchSources?.length > 0 && (
              <div style={{ marginBottom: 10, padding: '8px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 10, color: '#0c4a6e' }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>🌐 Dasar riset internet</div>
                <div style={{ lineHeight: 1.5 }}>Contoh web yang dibaca untuk menyusun pola soal ini:</div>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {item.researchSources.slice(0, 5).map((src, i) => (
                    <li key={i}>
                      {src?.url ? <a href={src.url} target="_blank" rel="noreferrer" style={{ color: '#0369a1' }}>{src.title || src.url}</a> : String(src?.title || src)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Pilih Tipe Soal */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>📋 Tipe Soal</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {QUESTION_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => updateQuestion(item.id, 'type', type.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: item.type === type.id ? `2px solid ${type.color}` : '1px solid #e2e8f0',
                      background: item.type === type.id ? type.color + '15' : 'white',
                      color: item.type === type.id ? type.color : '#64748b',
                      cursor: 'pointer',
                      fontSize: 9,
                      fontWeight: item.type === type.id ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 🔥 BARU: kalau soal ini dihasilkan AI ("Generate dari Topik") dan
                AI menandai soal ini idealnya pakai gambar/diagram (mis. soal
                pola bangun ruang, diagram sel, grafik), tampilkan sinyal jelas
                di sini -- supaya guru gampang lihat soal mana yang perlu
                dilengkapi gambar akurat SENDIRI. AI sengaja TIDAK disuruh
                menggambar diagramnya sendiri -- untuk konten sains/matematika
                yang butuh presisi (posisi organel sel, struktur nefron, dll),
                AI gambar bisa salah tanpa guru sadar, dan itu bahaya buat
                akurasi materi ajar. Jadi AI cuma "kasih tau", guru yang
                lengkapi gambarnya (dari bank soal resmi/sumber terpercaya).*/}
            {item.needsImage && !item.qImage && (
              <div style={{
                marginBottom: 10, padding: '10px 12px', background: '#fffbeb',
                border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#92400e',
                display: 'flex', gap: 8, alignItems: 'flex-start'
              }}>
                <span style={{ flexShrink: 0 }}>💡</span>
                <span>
                  <b>AI menyarankan soal ini pakai gambar/diagram</b>
                  {item.imageHint ? `: ${item.imageHint}` : '.'} Klik "Cari Gambar" buat cari otomatis dari sumber berlisensi bebas, atau upload sendiri dari bank soal/sumber terpercaya kalau hasil pencarian kurang pas.
                </span>
              </div>
            )}

            {/* 🔥 BARU: Cari Gambar Otomatis (Openverse/Wikimedia, gratis & legal
                buat dipakai ulang) -- guru tetap yang milih dari kandidat,
                bukan auto-pasang, supaya akurasi konten sains/anatomi tetap
                terjaga. */}
            {item.needsImage && !item.qImage && (
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => searchImagesForQuestion(item.id, item.imageHint || item.q)}
                  disabled={searchingImageFor === item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: 6,
                    cursor: searchingImageFor === item.id ? 'not-allowed' : 'pointer',
                    fontSize: 10, fontWeight: 600, color: '#3b82f6',
                    opacity: searchingImageFor === item.id ? 0.6 : 1,
                  }}
                >
                  {searchingImageFor === item.id ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
                  {searchingImageFor === item.id ? 'Nyari gambar...' : '🔍 Cari Gambar (Openverse/Wikimedia)'}
                </button>

                {imageSearchError[item.id] && (
                  <div style={{ marginTop: 6, fontSize: 10, color: '#ef4444' }}>{imageSearchError[item.id]}</div>
                )}

                {imageSearchResults[item.id] && imageSearchResults[item.id].length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>
                      Pilih gambar yang paling akurat buat soal ini:
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {imageSearchResults[item.id].map((r, ri) => (
                        <div
                          key={ri}
                          onClick={() => selectSearchedImage(item.id, r)}
                          title={`${r.title} — ${r.source} (klik untuk pakai)`}
                          style={{
                            width: 90, cursor: 'pointer', border: '2px solid #e2e8f0', borderRadius: 8,
                            overflow: 'hidden', transition: '0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                          <img src={r.thumb} alt={r.title} style={{ width: '100%', height: 70, objectFit: 'cover', display: 'block' }} />
                          <div style={{ fontSize: 8, color: '#94a3b8', padding: '2px 4px', background: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.source}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Gambar Soal */}
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4, 
                padding: '6px 14px', 
                background: '#f3e8ff',
                border: '1px solid #673ab7', 
                borderRadius: 6, 
                cursor: uploading ? 'not-allowed' : 'pointer', 
                fontSize: 10, 
                fontWeight: 600, 
                color: '#673ab7',
                opacity: uploading ? 0.6 : 1
              }}>
                {uploading && uploadTarget === `${item.id}-question-` ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Image size={14} />
                )}
                {uploading && uploadTarget === `${item.id}-question-` ? 'Uploading...' : 'Upload Gambar'}
                <input type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], item.id, 'question'); }} disabled={uploading} />
              </label>
              
              {item.qImage && item.imageSource?.url && (
                <div style={{ width: '100%', fontSize: 9, color: '#64748b' }}>
                  Sumber gambar: <a href={item.imageSource.url} target="_blank" rel="noreferrer" style={{ color: '#0369a1' }}>{item.imageSource.title || item.imageSource.source || item.imageSource.url}</a>
                </div>
              )}
              {item.qImage && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={item.qImage} alt="Soal" style={{ maxHeight: 60, borderRadius: 6, border: '1px solid #e2e8f0' }} />
                  <button onClick={() => handleRemoveImage(item.id, 'question')} style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={8}/></button>
                </div>
              )}
            </div>

            {/* Pertanyaan */}
            <textarea 
              value={item.q} 
              onChange={e => updateQuestion(item.id, 'q', e.target.value)}
              placeholder="Tulis soal... (Gunakan $...$ untuk rumus matematika)"
              style={{ width: '100%', minHeight: 50, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 6, fontFamily: 'inherit' }} 
            />
            {item.q && <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, marginBottom: 10, fontSize: 13 }}>{renderMath(item.q)}</div>}

            {/* ========================================================== */}
            {/* 🔥 TIPE 1: PILIHAN GANDA BIASA */}
            {/* ========================================================== */}
            {item.type === 'multiple' && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={item.optionsAreImages}
                    onChange={(e) => updateQuestion(item.id, 'optionsAreImages', e.target.checked)}
                  />
                  🖼️ Opsi jawaban berupa gambar (bukan teks)
                </label>

                {item.optionsAreImages ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3].map((oIdx) => (
                      <div key={oIdx} style={{ textAlign: 'center' }}>
                        <div
                          onClick={() => { updateQuestion(item.id, 'correct', oIdx); clearManualFlag(item.id); }}
                          style={{
                            padding: 4, borderRadius: 8, cursor: 'pointer', width: 90, height: 90,
                            border: item.correct === oIdx ? '3px solid #10b981' : '2px dashed #cbd5e1',
                            background: item.correct === oIdx ? '#f0fdf4' : '#f8fafc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
                          }}
                        >
                          {item.optionImages[oIdx] ? (
                            <img src={item.optionImages[oIdx]} alt={`Opsi ${String.fromCharCode(65 + oIdx)}`} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                          ) : (
                            <Upload size={16} color="#cbd5e1" />
                          )}
                          {item.correct === oIdx && <CheckCircle size={14} color="#10b981" style={{ position: 'absolute', top: 2, right: 2 }} />}
                        </div>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#673ab7', cursor: 'pointer', display: 'block', marginTop: 2 }}>
                          {String.fromCharCode(65 + oIdx)} — ganti gambar
                          <input type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], item.id, 'option', oIdx); }} />
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 6 }}>
                      {item.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div onClick={() => { updateQuestion(item.id, 'correct', oIdx); clearManualFlag(item.id); }} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            border: `2px solid ${item.correct === oIdx ? '#10b981' : '#e2e8f0'}`,
                            background: item.correct === oIdx ? '#f0fdf4' : 'white',
                            transition: '0.2s'
                          }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%',
                              border: `2px solid ${item.correct === oIdx ? '#10b981' : '#cbd5e1'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {item.correct === oIdx && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></div>}
                            </div>
                            <input
                              value={opt}
                              placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`}
                              onChange={e => {
                                const newOpts = [...item.options]; newOpts[oIdx] = e.target.value;
                                updateQuestion(item.id, 'options', newOpts);
                              }}
                              onClick={e => e.stopPropagation()}
                              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, outline: 'none' }}
                            />
                            {item.correct === oIdx && <CheckCircle size={14} color="#10b981" />}
                          </div>
                          {/* 🔥 Preview rumus ter-render — biar guru gak cuma liat kode "$...$" mentah */}
                          {opt && opt.includes('$') && (
                            <div style={{ paddingLeft: 30, fontSize: 11, color: '#64748b' }}>
                              👁️ {renderMath(opt)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ========================================================== */}
            {/* 🔥 TIPE 2: TABEL BENAR/SALAH */}
            {/* ========================================================== */}
            {item.type === 'truefalse' && (
              <div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Pernyataan</label>
                </div>
                {item.statements.map((stmt, sIdx) => (
                  <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <input 
                      value={stmt.text} 
                      onChange={e => {
                        const newStatements = [...item.statements];
                        newStatements[sIdx].text = e.target.value;
                        updateQuestion(item.id, 'statements', newStatements);
                      }}
                      placeholder={`Pernyataan ${sIdx + 1}`}
                      style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none' }}
                    />
                    <button 
                      onClick={() => {
                        const newStatements = [...item.statements];
                        newStatements[sIdx].isTrue = !newStatements[sIdx].isTrue;
                        updateQuestion(item.id, 'statements', newStatements);
                        clearManualFlag(item.id);
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        background: stmt.isTrue ? '#dcfce7' : '#fee2e2',
                        border: `1px solid ${stmt.isTrue ? '#10b981' : '#ef4444'}`,
                        color: stmt.isTrue ? '#166534' : '#dc2626',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 600
                      }}
                    >
                      {stmt.isTrue ? '✅ Benar' : '❌ Salah'}
                    </button>
                    <button 
                      onClick={() => {
                        const newStatements = item.statements.filter((_, i) => i !== sIdx);
                        updateQuestion(item.id, 'statements', newStatements);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newStatements = [...item.statements, { text: '', isTrue: true }];
                    updateQuestion(item.id, 'statements', newStatements);
                  }}
                  style={{ padding: '4px 12px', background: '#eef2ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#3b82f6', marginTop: 4 }}
                >
                  <Plus size={12} /> Tambah Pernyataan
                </button>
              </div>
            )}

            {/* ========================================================== */}
            {/* 🔥 TIPE 3: PILIH LEBIH DARI SATU */}
            {/* ========================================================== */}
            {item.type === 'multiselect' && (
              <div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>Pilihan (Klik untuk pilih jawaban benar)</label>
                </div>
                {item.options.map((opt, oIdx) => {
                  const isCorrect = item.correctAnswers.includes(oIdx);
                  return (
                    <div key={oIdx}>
                    <div
                      onClick={() => {
                        const newCorrect = isCorrect 
                          ? item.correctAnswers.filter(i => i !== oIdx)
                          : [...item.correctAnswers, oIdx];
                        updateQuestion(item.id, 'correctAnswers', newCorrect);
                        clearManualFlag(item.id);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${isCorrect ? '#8b5cf6' : '#e2e8f0'}`,
                        background: isCorrect ? '#f3e8ff' : 'white',
                        transition: '0.2s',
                        marginBottom: 4
                      }}
                    >
                      <div style={{ 
                        width: 20, height: 20, borderRadius: 4,
                        border: `2px solid ${isCorrect ? '#8b5cf6' : '#cbd5e1'}`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: isCorrect ? '#8b5cf6' : 'white'
                      }}>
                        {isCorrect && <CheckSquare size={14} color="white" />}
                      </div>
                      <input 
                        value={opt} 
                        placeholder={`Opsi ${String.fromCharCode(65+oIdx)}`} 
                        onChange={e => {
                          const newOpts = [...item.options]; newOpts[oIdx] = e.target.value;
                          updateQuestion(item.id, 'options', newOpts);
                        }}
                        onClick={e => e.stopPropagation()}
                        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, outline: 'none' }} 
                      />
                      {isCorrect && <CheckCircle size={14} color="#8b5cf6"/>}
                    </div>
                    {/* 🔥 FIX: preview rumus ter-render -- sebelumnya cuma ada
                        di tipe Pilihan Ganda Biasa, jadi di tipe Pilih Lebih
                        dari Satu guru selalu liat kode LaTeX mentah kayak
                        "$\text{NaHCO}_3$" apa adanya. Sekarang disamakan. */}
                    {opt && opt.includes('$') && (
                      <div style={{ paddingLeft: 30, marginBottom: 4, fontSize: 11, color: '#64748b' }}>
                        👁️ {renderMath(opt)}
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ========================================================== */}
            {/* 🔥 TIPE 4: MEMBACA TEKS */}
            {/* ========================================================== */}
            {item.type === 'reading' && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>📖 Teks Bacaan</label>
                  <textarea 
                    value={item.readingText} 
                    onChange={e => updateQuestion(item.id, 'readingText', e.target.value)}
                    placeholder="Tempel teks bacaan di sini..."
                    style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>📝 Pertanyaan</label>
                </div>
                {item.subQuestions.map((sq, sIdx) => (
                  <div key={sIdx} style={{ background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 6 }}>
                    <input 
                      value={sq.q} 
                      onChange={e => {
                        const newSub = [...item.subQuestions];
                        newSub[sIdx].q = e.target.value;
                        updateQuestion(item.id, 'subQuestions', newSub);
                      }}
                      placeholder={`Pertanyaan ${sIdx + 1}`}
                      style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none', marginBottom: 4 }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {sq.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button 
                            onClick={() => {
                              const newSub = [...item.subQuestions];
                              newSub[sIdx].correct = oIdx;
                              updateQuestion(item.id, 'subQuestions', newSub);
                              clearManualFlag(item.id);
                            }}
                            style={{ 
                              width: 16, height: 16, borderRadius: '50%', 
                              border: `2px solid ${sq.correct === oIdx ? '#10b981' : '#cbd5e1'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}
                          >
                            {sq.correct === oIdx && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />}
                          </button>
                          <input 
                            value={opt} 
                            placeholder={`Opsi ${String.fromCharCode(65+oIdx)}`} 
                            onChange={e => {
                              const newSub = [...item.subQuestions];
                              newSub[sIdx].options[oIdx] = e.target.value;
                              updateQuestion(item.id, 'subQuestions', newSub);
                            }}
                            style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 10, outline: 'none' }}
                          />
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        const newSub = item.subQuestions.filter((_, i) => i !== sIdx);
                        updateQuestion(item.id, 'subQuestions', newSub);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 10, marginTop: 4 }}
                    >
                      <X size={12} /> Hapus Pertanyaan
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newSub = [...item.subQuestions, { q: '', options: ['', '', '', ''], correct: 0 }];
                    updateQuestion(item.id, 'subQuestions', newSub);
                  }}
                  style={{ padding: '4px 12px', background: '#eef2ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#3b82f6' }}
                >
                  <Plus size={12} /> Tambah Pertanyaan
                </button>
              </div>
            )}

            {/* ========================================================== */}
            {/* 🔥 TIPE 5: ISIAN SINGKAT */}
            {/* ========================================================== */}
            {item.type === 'shortanswer' && (
              <div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>🔑 Kunci Jawaban</label>
                  <input 
                    value={item.shortAnswer} 
                    onChange={e => { updateQuestion(item.id, 'shortAnswer', e.target.value); clearManualFlag(item.id); }}
                    placeholder="Masukkan jawaban yang benar..."
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none' }}
                  />
                  <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                    💡 Siswa akan mengetik jawaban. Gunakan $...$ untuk rumus matematika.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* 🔥 TIPE 6: SEBAB AKIBAT */}
            {/* ========================================================== */}
            {item.type === 'causeeffect' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>📌 SEBAB</label>
                    <textarea 
                      value={item.cause} 
                      onChange={e => updateQuestion(item.id, 'cause', e.target.value)}
                      placeholder="Tulis pernyataan sebab..."
                      style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical' }}
                    />
                    <button 
                      onClick={() => { updateQuestion(item.id, 'isCauseTrue', !item.isCauseTrue); clearManualFlag(item.id); }}
                      style={{
                        marginTop: 4,
                        padding: '4px 12px',
                        borderRadius: 6,
                        background: item.isCauseTrue ? '#dcfce7' : '#fee2e2',
                        border: `1px solid ${item.isCauseTrue ? '#10b981' : '#ef4444'}`,
                        color: item.isCauseTrue ? '#166534' : '#dc2626',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 600
                      }}
                    >
                      {item.isCauseTrue ? '✅ Pernyataan BENAR' : '❌ Pernyataan SALAH'}
                    </button>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>🔗 AKIBAT</label>
                    <textarea 
                      value={item.effect} 
                      onChange={e => updateQuestion(item.id, 'effect', e.target.value)}
                      placeholder="Tulis pernyataan akibat..."
                      style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical' }}
                    />
                    <button 
                      onClick={() => { updateQuestion(item.id, 'isEffectTrue', !item.isEffectTrue); clearManualFlag(item.id); }}
                      style={{
                        marginTop: 4,
                        padding: '4px 12px',
                        borderRadius: 6,
                        background: item.isEffectTrue ? '#dcfce7' : '#fee2e2',
                        border: `1px solid ${item.isEffectTrue ? '#10b981' : '#ef4444'}`,
                        color: item.isEffectTrue ? '#166534' : '#dc2626',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 600
                      }}
                    >
                      {item.isEffectTrue ? '✅ Pernyataan BENAR' : '❌ Pernyataan SALAH'}
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 8, padding: 8, background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: 10, color: '#166534', margin: 0 }}>
                    💡 Siswa akan menilai: 
                    {item.isCauseTrue ? ' Sebab BENAR' : ' Sebab SALAH'} dan 
                    {item.isEffectTrue ? ' Akibat BENAR' : ' Akibat SALAH'}
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* 🔥 TIPE 7: MENJODOHKAN */}
            {/* ========================================================== */}
            {item.type === 'matching' && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
                  🔗 Pasangan Kiri ↔ Kanan (siswa menjodohkan)
                </label>
                {item.matchingPairs.map((pair, pIdx) => (
                  <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <input
                      value={pair.left}
                      onChange={(e) => {
                        const newPairs = [...item.matchingPairs];
                        newPairs[pIdx] = { ...newPairs[pIdx], left: e.target.value };
                        updateQuestion(item.id, 'matchingPairs', newPairs);
                      }}
                      placeholder={`Kiri ${pIdx + 1}`}
                      style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none' }}
                    />
                    <ArrowLeftRight size={12} color="#94a3b8" />
                    <input
                      value={pair.right}
                      onChange={(e) => {
                        const newPairs = [...item.matchingPairs];
                        newPairs[pIdx] = { ...newPairs[pIdx], right: e.target.value };
                        updateQuestion(item.id, 'matchingPairs', newPairs);
                      }}
                      placeholder={`Kanan ${pIdx + 1} (jodoh yang benar)`}
                      style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none' }}
                    />
                    <button
                      onClick={() => {
                        const newPairs = item.matchingPairs.filter((_, i) => i !== pIdx);
                        updateQuestion(item.id, 'matchingPairs', newPairs);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newPairs = [...item.matchingPairs, { left: '', right: '' }];
                    updateQuestion(item.id, 'matchingPairs', newPairs);
                  }}
                  style={{ padding: '4px 12px', background: '#fdf2f8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#ec4899', marginTop: 4 }}
                >
                  <Plus size={12} /> Tambah Pasangan
                </button>
                <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 6 }}>
                  💡 Urutan kiri tetap; sistem akan mengacak urutan kolom kanan saat ditampilkan ke siswa.
                </p>
              </div>
            )}

            {/* Pembahasan - Mode Ujian */}
            {quizMode === 'advanced' && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <HelpCircle size={14} color="#673ab7" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#673ab7' }}>Pembahasan</span>
                </div>
                <textarea 
                  value={item.explanation || ''} 
                  onChange={e => updateQuestion(item.id, 'explanation', e.target.value)}
                  placeholder="Tulis pembahasan soal ini..."
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  rows={2}
                />
                {/* 🔥 Preview rumus ter-render — biar guru bisa BACA pembahasannya, bukan cuma liat kode LaTeX mentah */}
                {item.explanation && (
                  <div style={{ marginTop: 6, padding: 10, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, lineHeight: 1.6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>👁️ TAMPILAN UNTUK DIBACA</div>
                    {renderMath(item.explanation)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // 🔥 RENDER PREVIEW
  // ============================================================
  if (previewMode) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #673ab7, #8b5cf6)', 
          padding: '16px 20px', 
          borderRadius: 12, 
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: isMobile ? 16 : 20 }}>👁️ Preview: {quizTitle || 'Kuis'}</h2>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Simulasi tampilan siswa</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={toggleCorrectAnswers} style={{ 
              padding: '6px 14px', 
              background: showCorrectAnswers ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.15)', 
              color: 'white', 
              border: showCorrectAnswers ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.2)', 
              borderRadius: 8, 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: 11 
            }}>
              {showCorrectAnswers ? '✅ Tampilkan Jawaban' : '👁️ Sembunyikan Jawaban'}
            </button>
            <button onClick={handleClosePreview} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              <X size={14} /> Tutup
            </button>
          </div>
        </div>

        {questions.filter(q => q.q.trim() || q.qImage).map((item, idx) => {
          const userAnswer = previewAnswers[item.id];
          const isCorrect = (() => {
            if (item.type === 'multiselect') {
              return Array.isArray(userAnswer) && Array.isArray(item.correctAnswers) &&
                userAnswer.length === item.correctAnswers.length &&
                userAnswer.every(v => item.correctAnswers.includes(v));
            }
            if (item.type === 'truefalse') {
              return Array.isArray(userAnswer) && Array.isArray(item.statements) &&
                userAnswer.every((v, i) => v === item.statements[i].isTrue);
            }
            if (item.type === 'reading') {
              return Array.isArray(userAnswer) && Array.isArray(item.subQuestions) &&
                userAnswer.every((v, i) => v === item.subQuestions[i].correct);
            }
            if (item.type === 'shortanswer') {
              return userAnswer?.toLowerCase().trim() === item.shortAnswer?.toLowerCase().trim();
            }
            if (item.type === 'causeeffect') {
              return userAnswer?.cause === item.isCauseTrue && userAnswer?.effect === item.isEffectTrue;
            }
            return userAnswer === item.correct;
          })();
          
          return (
            <div key={item.id} style={{ 
              background: 'white', 
              padding: isMobile ? 15 : 20, 
              borderRadius: 12, 
              border: showCorrectAnswers ? (isCorrect ? '2px solid #10b981' : '2px solid #ef4444') : '2px solid #e2e8f0',
              marginBottom: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#673ab7', background: '#f3e8ff', padding: '4px 10px', borderRadius: 6 }}>SOAL {idx + 1}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: userAnswer !== undefined ? (isCorrect ? '#dcfce7' : '#fee2e2') : '#f1f5f9', color: userAnswer !== undefined ? (isCorrect ? '#166534' : '#dc2626') : '#94a3b8' }}>
                  {userAnswer !== undefined ? (isCorrect ? '✅ Benar' : '❌ Salah') : '⏳ Belum'}
                </span>
              </div>
              
              {item.qImage && <img src={item.qImage} alt="Soal" style={{ maxHeight: 120, borderRadius: 8, marginBottom: 8 }} />}
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{renderMath(item.q)}</div>

              {/* 🔥 FIX BUG BESAR: sebelumnya SEMUA tipe soal di preview ini
                  dipaksa render sebagai pilihan ganda A/B/C/D (`item.options.map`),
                  gak peduli tipe aslinya. Buat "Isian Singkat", "Tabel
                  Benar/Salah", "Sebab Akibat", "Menjodohkan", "Membaca Teks" --
                  field `options` itu kosong/gak relevan, jadi hasilnya kacau
                  (kotak kosong dikasih huruf A/B/C/D, "Jawaban benar" nunjuk ke
                  opsi yang gak ada). Sekarang tiap tipe dirender sesuai
                  bentuknya masing-masing. */}
              {item.type === 'multiple' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
                  {item.options.map((opt, oIdx) => {
                    const isSelected = userAnswer === oIdx;
                    const isCorrectAnswer = oIdx === item.correct;
                    let bgColor = 'white', borderColor = '#e2e8f0';
                    if (showCorrectAnswers) {
                      if (isCorrectAnswer) { bgColor = '#dcfce7'; borderColor = '#10b981'; }
                      if (isSelected && !isCorrectAnswer) { bgColor = '#fee2e2'; borderColor = '#ef4444'; }
                    } else if (isSelected) { bgColor = '#eef2ff'; borderColor = '#3b82f6'; }
                    return (
                      <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: `2px solid ${borderColor}`, background: bgColor }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? '#3b82f6' : '#f1f5f9', color: isSelected ? 'white' : '#64748b', fontWeight: 700, fontSize: 10 }}>{String.fromCharCode(65 + oIdx)}</span>
                        <span style={{ fontSize: 12 }}>{renderMath(opt)}</span>
                        {showCorrectAnswers && isCorrectAnswer && <CheckCircle size={12} color="#10b981" style={{ marginLeft: 'auto' }} />}
                        {showCorrectAnswers && isSelected && !isCorrectAnswer && <X size={12} color="#ef4444" style={{ marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {item.type === 'multiselect' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
                  {item.options.map((opt, oIdx) => {
                    const isSelected = userAnswer?.includes(oIdx) || false;
                    const isCorrectAnswer = item.correctAnswers.includes(oIdx);
                    let bgColor = 'white', borderColor = '#e2e8f0';
                    if (showCorrectAnswers) {
                      if (isCorrectAnswer) { bgColor = '#dcfce7'; borderColor = '#10b981'; }
                      if (isSelected && !isCorrectAnswer) { bgColor = '#fee2e2'; borderColor = '#ef4444'; }
                    } else if (isSelected) { bgColor = '#eef2ff'; borderColor = '#3b82f6'; }
                    return (
                      <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: `2px solid ${borderColor}`, background: bgColor }}>
                        <span style={{ width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? '#3b82f6' : '#f1f5f9', color: isSelected ? 'white' : '#64748b', fontWeight: 700, fontSize: 10 }}>{String.fromCharCode(65 + oIdx)}</span>
                        <span style={{ fontSize: 12 }}>{renderMath(opt)}</span>
                        {showCorrectAnswers && isCorrectAnswer && <CheckCircle size={12} color="#10b981" style={{ marginLeft: 'auto' }} />}
                        {showCorrectAnswers && isSelected && !isCorrectAnswer && <X size={12} color="#ef4444" style={{ marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {item.type === 'truefalse' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(item.statements || []).map((stmt, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <span style={{ fontSize: 12, flex: 1 }}>{sIdx + 1}. {renderMath(stmt.text)}</span>
                      {showCorrectAnswers && <span style={{ fontSize: 10, fontWeight: 700, color: stmt.isTrue ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>Kunci: {stmt.isTrue ? 'BENAR' : 'SALAH'}</span>}
                    </div>
                  ))}
                </div>
              )}

              {item.type === 'shortanswer' && (
                <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Jawaban siswa berupa isian teks bebas.</span>
                  {showCorrectAnswers && (
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>Kunci: {renderMath(item.shortAnswer)}</span>
                    </div>
                  )}
                </div>
              )}

              {item.type === 'causeeffect' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>SEBAB</div>
                    <div style={{ fontSize: 12 }}>{renderMath(item.cause)}</div>
                    {showCorrectAnswers && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: item.isCauseTrue ? '#10b981' : '#ef4444' }}>Kunci: {item.isCauseTrue ? 'BENAR' : 'SALAH'}</div>}
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>AKIBAT</div>
                    <div style={{ fontSize: 12 }}>{renderMath(item.effect)}</div>
                    {showCorrectAnswers && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: item.isEffectTrue ? '#10b981' : '#ef4444' }}>Kunci: {item.isEffectTrue ? 'BENAR' : 'SALAH'}</div>}
                  </div>
                </div>
              )}

              {item.type === 'matching' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(item.matchingPairs || []).map((p, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12 }}>
                      <span style={{ flex: 1 }}>{renderMath(p.left)}</span>
                      <span style={{ color: '#94a3b8' }}>→</span>
                      <span style={{ flex: 1, fontWeight: showCorrectAnswers ? 700 : 400, color: showCorrectAnswers ? '#10b981' : '#1e293b' }}>{renderMath(p.right)}</span>
                    </div>
                  ))}
                </div>
              )}

              {item.type === 'reading' && (
                <div>
                  {item.readingText && (
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10, fontSize: 12, fontStyle: 'italic', color: '#475569' }}>
                      {renderMath(item.readingText)}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(item.subQuestions || []).map((sq, sqIdx) => (
                      <div key={sqIdx}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{sqIdx + 1}. {renderMath(sq.q)}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
                          {(sq.options || []).map((opt, oIdx) => {
                            const isCorrectAnswer = oIdx === sq.correct;
                            return (
                              <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, border: `1px solid ${showCorrectAnswers && isCorrectAnswer ? '#10b981' : '#e2e8f0'}`, background: showCorrectAnswers && isCorrectAnswer ? '#dcfce7' : 'white' }}>
                                <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 9 }}>{String.fromCharCode(65 + oIdx)}</span>
                                <span style={{ fontSize: 11 }}>{renderMath(opt)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showCorrectAnswers && (item.type === 'multiple' || item.type === 'multiselect') && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0', fontSize: 11 }}>
                  <span style={{ color: '#64748b' }}>✅ Jawaban benar: </span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>
                    {item.type === 'multiselect' 
                      ? item.correctAnswers.map(i => item.options[i]).join(', ')
                      : item.options[item.correct] || `Opsi ${String.fromCharCode(65 + item.correct)}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ textAlign: 'center', padding: 16, background: '#f8fafc', borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: '#64748b' }}>💡 Preview menampilkan jawaban benar secara otomatis</p>
          <button onClick={handleClosePreview} style={{ padding: '8px 24px', background: '#673ab7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, marginTop: 8 }}>Tutup Preview</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // 🔥 SAVE QUIZ - DENGAN INTEGRASI MODUL
  // ============================================================
  const handleSaveQuiz = async () => {
    const valid = questions.filter(q => q.q.trim() || q.qImage);
    if (valid.length === 0) return alert("❌ Minimal 1 soal!");
    if (!quizTitle) return alert("❌ Judul kuis wajib diisi!");
    // 🔥 BARU: FIX BUG AKAR MASALAH "Mapel Umum" -- validasi ini yang
    // mastiin kuis TIDAK PERNAH bisa tersimpan lagi tanpa mapel & kodeMapel
    // yang beneran valid (lihat penjelasan lengkap di loadRefs soal
    // kenapa ini penting: kodeMapel kosong = target siswa gak tersaring
    // sama sekali = bocor ke semua siswa lintas mapel).
    // 🔥 FIX BUG AKAR "guru terblokir gak bisa simpan kuis dalam modul":
    // validasi mapel di bawah ini SEKARANG DIPISAH jadi dua jalur:
    //  (a) Kuis MANDIRI (isFromModul === false) -- mapelnya milik guru
    //      sendiri, jadi tetap WAJIB dicocokkan persis ke daftar mapel yang
    //      beneran terdaftar buat guru ini (mencegah kasus "Mapel Umum"
    //      lama, lihat penjelasan panjang di loadRefs).
    //  (b) Kuis DALAM MODUL (isFromModul === true) -- mapelnya 100% WARISAN
    //      dari modul induk (lihat panel "1. Identitas Kuis" & fetchQuiz di
    //      atas), BUKAN pilihan bebas guru dari dropdown mapelnya sendiri.
    //      Sebelumnya kuis-dalam-modul ikut kena pengecekan
    //      `teacherMapelOptions.some(...)` yang sama seperti kuis mandiri --
    //      begitu kodeMapel warisan modul gak PERSIS cocok satu-satu dengan
    //      salah satu mapel guru yang lagi login (misal guru kolaborator,
    //      atau sekadar format string beda), simpan ditolak dengan pesan
    //      seolah guru belum terdaftar mapel apa pun, padahal dia jelas
    //      berhak (sudah lolos pengecekan akses edit di ModulManager).
    //      Sekarang kuis-dalam-modul cukup dicek ADA isinya (gak kosong),
    //      gak perlu cocok ke daftar mapel pribadi guru ini.
    if (!quizSubject || !kodeMapel) {
      return alert(
        isFromModul
          ? "❌ Mapel dari modul induk belum termuat. Tunggu sebentar lalu coba simpan lagi -- kalau masih gagal, buka ulang halaman ini."
          : teacherMapelOptions.length === 0
            ? "❌ Kamu belum terdaftar mengajar mapel apa pun. Hubungi admin untuk didaftarkan ke mapel dulu sebelum bisa membuat kuis."
            : "❌ Pilih mapel yang valid dari daftar dulu sebelum menyimpan (mapel kuis ini belum/tidak valid)."
      );
    }
    // 🔥 BARU: jaga-jaga tambahan -- kalau quizSubject somehow gak
    // cocok persis sama salah satu mapel guru yang beneran terdaftar
    // (misal nilai lama/orphan yang belum diganti guru), tetap tolak.
    // Cuma berlaku buat kuis MANDIRI -- kuis dalam modul warisan mapelnya
    // dari modul induk, bukan dari daftar mapel pribadi guru ini (lihat
    // penjelasan di atas).
    if (!isFromModul && !teacherMapelOptions.some(o => o.nama === quizSubject && o.kode === kodeMapel)) {
      return alert("❌ Mapel yang dipilih sudah tidak valid. Silakan pilih ulang mapel dari daftar dropdown sebelum menyimpan.");
    }
    // 🔥 BARU: validasi buat mode target "Siswa Tertentu"
    if (publishTarget === 'siswa' && selectedStudentsForQuiz.length === 0) {
      return alert("❌ Pilih minimal 1 siswa dulu buat mode 'Siswa Tertentu'!");
    }

    const stillNeedsReview = valid.filter(q => q.needsManualAnswer).length;
    if (stillNeedsReview > 0) {
      const lanjut = window.confirm(`⚠️ Masih ada ${stillNeedsReview} soal yang belum ditandai jawaban benarnya. Tetap simpan?`);
      if (!lanjut) return;
    }

    // PROFESSIONAL QUALITY GATE: soal yang secara eksplisit membutuhkan
    // stimulus visual tidak boleh diterbitkan tanpa stimulus. Ini mencegah
    // kasus seperti "jam 08:30" yang tampil tanpa jam yang benar.
    const missingVisual = valid.find(q => q.visualRequired && !q.qImage);
    if (missingVisual) {
      return alert(
        `❌ Soal #${valid.indexOf(missingVisual) + 1} membutuhkan gambar/diagram (${missingVisual.visualKind || 'visual'}) tetapi stimulus belum tersedia. ` +
        `Lengkapi gambarnya dulu sebelum kuis diterbitkan.`
      );
    }

    // Soal riset internet harus tetap menyimpan minimal satu sumber untuk
    // audit guru. Soal AI biasa tidak terkena aturan ini.
    const researchWithoutSource = valid.find(q => q.researchBacked && (!Array.isArray(q.researchSources) || q.researchSources.length === 0));
    if (researchWithoutSource) {
      return alert(`❌ Ada soal yang bertanda RISET INTERNET tetapi sumber risetnya hilang. Generate ulang soal tersebut agar jejak sumber tetap ada.`);
    }
    
    if (useSchedule) {
      const open = new Date(quizOpenDate);
      const close = new Date(quizCloseDate);
      if (open >= close) return alert("❌ Tanggal buka harus lebih awal dari tanggal tutup!");
      if (open < new Date()) return alert("❌ Tanggal buka tidak boleh kurang dari waktu sekarang!");
    }
    
    setLoading(true);
    try {
      // 🔥 Dipindah ke atas: dipakai di SEMUA jalur simpan (bukan cuma kuis
      // mandiri), supaya guruId konsisten ada di setiap dokumen kuis —
      // ini yang dipakai CekTugasSiswa.jsx buat nampilin submission ke guru
      // yang benar, jadi harus selalu keisi, gak boleh ketinggalan.
      const savedTeacher = JSON.parse(localStorage.getItem('teacherData') || '{}');

      const quizPayload = {
        // 🔥 FIX BUG PENTING: Firestore MENOLAK field bernilai `undefined` (bikin
        // addDoc/updateDoc gagal total dengan error "Unsupported field value:
        // undefined"). Sebelumnya banyak field di sini pakai `: undefined` kalau
        // tipe soalnya beda — itu penyebab kuis gagal disimpan. Sekarang SEMUA
        // field selalu diisi nilai valid (null/array kosong/string kosong),
        // apapun tipe soalnya.
        quizData: valid.map(q => ({ 
          id: q.id, 
          type: q.type || 'multiple',
          question: q.q.trim(), 
          questionImage: q.qImage || '',
          options: q.options || ['', '', '', ''],
          optionImages: q.optionImages || ['', '', '', ''],
          // 🔥 PERUBAHAN B: penanda kalau PILIHAN JAWABAN soal ini berupa
          // gambar (bukan teks). StudentQuizView sebenarnya SUDAH punya
          // dukungan menampilkan opsi bergambar, tapi flag-nya gak pernah
          // ikut tersimpan ke Firestore -- jadi di sisi siswa opsi
          // gambarnya gak pernah aktif. Sekarang ikut disimpan.
          optionsAreImages: !!q.optionsAreImages,
          correctAnswer: q.type === 'multiselect' ? null : (q.correct ?? 0),
          correctAnswers: q.type === 'multiselect' ? (q.correctAnswers || []) : [],
          // 🔥 PERUBAHAN A: sebelumnya pembahasan CUMA disimpan kalau kuis
          // dalam Mode Ujian (advanced) -- di mode biasa, `explanation`
          // dipaksa jadi string kosong walau AI/guru sudah mengisinya,
          // jadi pembahasannya HILANG PERMANEN begitu kuis disimpan.
          // Padahal soal hasil riset internet selalu membawa pembahasan
          // dan itu justru nilai utamanya. Sekarang selalu disimpan apa
          // adanya, terlepas dari mode kuisnya.
          explanation: q.explanation || '',
          // 🔥 PERUBAHAN B: metadata hasil riset internet -- verifikasi
          // kunci jawaban, ringkasan analisis, asal sumber (judul + URL),
          // dan penanda mode (ambil-dari-sumber vs prediksi). Tanpa ini,
          // jejak "soal ini datang dari mana dan kenapa kuncinya begitu"
          // hilang begitu kuis disimpan.
          answerVerification: q.answerVerification || '',
          analysisSummary: q.analysisSummary || '',
          sourceMode: q.sourceMode || 'source',
          sourceQuestionVerbatim: !!q.sourceQuestionVerbatim,
          sourceTitle: q.sourceTitle || '',
          sourceUrl: q.sourceUrl || '',
          statements: q.type === 'truefalse' ? (q.statements || []) : [],
          readingText: q.type === 'reading' ? (q.readingText || '') : '',
          subQuestions: q.type === 'reading' ? (q.subQuestions || []) : [],
          shortAnswer: q.type === 'shortanswer' ? (q.shortAnswer || '') : '',
          cause: q.type === 'causeeffect' ? (q.cause || '') : '',
          effect: q.type === 'causeeffect' ? (q.effect || '') : '',
          isCauseTrue: q.type === 'causeeffect' ? !!q.isCauseTrue : true,
          isEffectTrue: q.type === 'causeeffect' ? !!q.isEffectTrue : true,
          matchingPairs: q.type === 'matching' ? (q.matchingPairs || []) : [],
          // 🔥 BARU: simpan sinyal "AI menyarankan gambar" supaya kalau guru
          // buka lagi kuis ini nanti buat diedit, hint-nya masih ada
          // (bukan cuma muncul sekali pas baru di-generate lalu hilang).
          // Otomatis gak lagi relevan begitu guru sudah upload gambarnya
          // sendiri (dicek via `!item.qImage` di tampilan, bukan di sini).
          needsImage: q.needsImage || false,
          imageHint: q.imageHint || '',
          imageSource: q.imageSource || null,
          researchBacked: q.researchBacked || false,
          researchSources: q.researchSources || [],
          visualRequired: q.visualRequired || false,
          visualKind: q.visualKind || 'none',
        })),
        totalQuestions: valid.length,
        deadlineQuiz: null, // field lama, sudah tidak dipakai (lihat catatan di Identitas Kuis)
        useSchedule: useSchedule,
        quizOpenDate: useSchedule ? quizOpenDate : null,
        quizCloseDate: useSchedule ? quizCloseDate : null,
        updatedAt: serverTimestamp(),
        generatedByAI: isAIGenerated,
        generatedAt: isAIGenerated ? serverTimestamp() : null,
        // 🔥 Selalu disertakan (gak cuma di Mode Ujian) — guru bisa milih siswa
        // langsung lihat nilai angka setelah submit, atau disembunyikan dulu
        // (misal guru mau cek/bahas manual sebelum siswa tau nilainya).
        showScoreToStudent: showScoreToStudent,
        // 🔥 PERUBAHAN C: pengaturan "Tampilkan pembahasan" sebelumnya
        // CUMA ikut tersimpan kalau kuis dalam Mode Ujian (advanced) --
        // di mode biasa field ini gak pernah ada di dokumen sama sekali.
        // Sisi siswa (StudentQuizView) membacanya dengan
        // `data.showExplanation !== false`, jadi field yang hilang itu
        // kebetulan masih jatuh ke "true"; tapi artinya pilihan guru buat
        // MENYEMBUNYIKAN pembahasan di kuis biasa TIDAK PERNAH BERLAKU.
        // Sekarang selalu disimpan supaya pengaturannya benar-benar
        // dihormati di semua mode.
        showExplanation: showExplanation !== false,
      };

      if (quizMode === 'advanced') {
        quizPayload.timeLimit = timeLimit;
        quizPayload.randomOrder = randomOrder;
        quizPayload.maxAttempts = maxAttempts;
        quizPayload.difficulty = difficulty;
        quizPayload.antiCheatEnabled = antiCheatEnabled;
      }

      // 🔥 FIX BUG PALING PENTING (baru ditemukan): kalau ini KUIS YANG SUDAH
      // ADA lagi diedit (bukan bikin baru), langsung UPDATE dokumen itu
      // sendiri di tempat. Ini WAJIB dicek PALING DULU, sebelum percabangan
      // lain (isFromModul / Tautkan ke Modul) — soalnya kalau enggak, sistem
      // bisa salah kira ini "mau bikin kuis baru ditautkan ke modul lain"
      // dan malah bikin DUPLIKAT.
      //
      // 🔥 FIX BUG KRUSIAL (kasus nyata): update ini SEBELUMNYA TIDAK
      // MENYERTAKAN field target sama sekali (targetKategori, targetKelas,
      // sendToSpecificStudents, selectedStudents, studentIds) — cuma
      // quizPayload + title + subject. Akibatnya: kalau guru bikin kuis
      // dengan target biasa (jenjang/kelas) dulu, lalu BELAKANGAN buka lagi
      // buat diedit dan ganti ke "Siswa Tertentu" (pilih nama siswa
      // langsung), pilihan itu KELIHATAN tersimpan di UI tapi SEBENARNYA
      // TIDAK PERNAH nyampe ke database sama sekali — field
      // `sendToSpecificStudents` di database tetap `false` (nilai lama),
      // jadi siswa yang dipilih guru tetap kena pengecekan mapel/kelas
      // biasa dan ditolak, walau di layar guru keliatan sudah benar. Ini
      // yang bikin fitur "Siswa Tertentu" kelihatan "gak jalan" padahal
      // sebenarnya cuma gak pernah kesimpen.
      if (isEditingExistingQuiz && !isFromModul) {
        await updateDoc(doc(db, "bimbel_modul", modulId), {
          ...quizPayload,
          title: quizTitle.toUpperCase(),
          subject: quizSubject || "Kuis",
          // 🔥 FIX BUG NYATA: kodeMapel sebelumnya TIDAK ikut diupdate di
          // sini -- kalau guru buka lagi kuis lama buat diedit dan GANTI
          // pilihan mapelnya, `subject` (nama) keupdate tapi `kodeMapel`
          // (kode yang beneran dipakai buat pengecekan akses) tetap
          // nyangkut ke nilai lama. Sekarang ikut disinkronkan.
          kodeMapel: kodeMapel || '',
          targetKategori: publishTarget === 'jenjang' ? selectedProgram : "Semua",
          targetKelas: publishTarget === 'jenjang' ? selectedKelas : "Semua",
          sendToSpecificStudents: publishTarget === 'siswa',
          selectedStudents: publishTarget === 'siswa' ? selectedStudentsForQuiz : [],
          studentIds: publishTarget === 'siswa' ? selectedStudentsForQuiz.map(s => s.studentId) : [],
        });
        alert(`✅ Kuis "${quizTitle}" berhasil diperbarui!`);
        localStorage.removeItem(draftKey);
        navigate(-1);
        return;
      }

      // 🔥 JIKA DARI MODUL
      if (isFromModul) {
        const modulSnap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (modulSnap.exists()) {
          const modulData = modulSnap.data();
          const blocks = modulData.blocks || [];
          
          let sectionIndex = blocks.findIndex(b => 
            String(b.id) === String(sectionId) || b.id === sectionId
          );
          
          // 🔥 FIX BUG "Section tidak ditemukan": kalau section belum tercatat
          // di modul (misal auto-save telat / section dibuat sangat baru),
          // JANGAN gagal mati. Bikin section baru bertipe quiz otomatis, biar
          // guru gak pernah kejebak error yang bikin kerjaan hilang.
          if (sectionIndex === -1) {
            blocks.push({
              id: sectionId,
              type: 'quiz',
              title: quizTitle || 'Kuis',
              quizId: null,
            });
            sectionIndex = blocks.length - 1;
          }
          
          const section = blocks[sectionIndex];
          let quizId = section.quizId;

          // 🔥 FIX: dulu guruId gak pernah diisi di jalur ini, jadi kuis yang
          // ditautkan ke modul gak kedeteksi di halaman "Cek Tugas Siswa".
          // Utamakan guruId dari modul induknya (paling akurat, karena kuis
          // ini emang bagian dari modul itu), fallback ke akun guru yang lagi login.
          const ownerGuruId = modulData.guruId || savedTeacher.guruId || savedTeacher.id || '';
          const ownerGuruName = modulData.guruName || savedTeacher.nama || '';
          const ownerKodeMapel = modulData.kodeMapel || savedTeacher.kodeMapel || '';

          // 🔥 FIX BUG URGENT (revisi ke-2): perbaikan sebelumnya (menyalin
          // target modul induk ke kuisnya) ternyata masih bisa basi — kalau
          // guru UBAH target modul induk BELAKANGAN, kuis yang udah lebih
          // dulu dibuat gak ikut ke-update otomatis, jadi tetap bawa target
          // lama yang salah (persis laporan "sudah update tapi masih nyasar").
          //
          // Fix yang benar: kuis ini ditandai `parentModulId` — dengan
          // penanda ini, sisi siswa TIDAK PERNAH mengevaluasi target kuis ini
          // sendiri sama sekali. Aksesnya 100% ngikut modul induk, bukan
          // ngikut field target di kuisnya sendiri (yang gampang basi).
          // Target tetap disalin sebagai CADANGAN kalau ada bagian sistem
          // yang belum diperbarui buat baca parentModulId.
          const inheritedTargeting = {
            parentModulId: modulId,
            targetKategori: modulData.targetKategori || 'Semua',
            targetKelas: modulData.targetKelas || 'Semua',
            sendToSpecificStudents: !!modulData.sendToSpecificStudents,
            selectedStudents: modulData.selectedStudents || [],
            studentIds: modulData.studentIds || [],
          };
          
          if (quizId) {
            // 🔥 FIX BUG: sebelumnya update di sini TIDAK PERNAH menyertakan
            // `subject`/`title` -- jadi kalau guru edit ULANG kuis yang udah
            // nempel di modul (bukan bikin baru), field mapel & judulnya di
            // database TETAP nyangkut ke nilai lama dari kali PERTAMA
            // dibuat, walau guru udah ganti pilihan mapel/judul di form.
            // Ini bisa jadi biang kerok siswa "tidak memiliki akses" -- soal
            // pengecekan akses mapel siswa cocokin ke field `subject` ini,
            // jadi kalau field-nya basi/salah, aksesnya ikut salah walau
            // tampilan form guru udah keliatan benar.
            await updateDoc(doc(db, "bimbel_modul", quizId), {
              ...quizPayload,
              ...inheritedTargeting,
              title: quizTitle.toUpperCase(),
              subject: quizSubject || "Kuis",
              guruId: ownerGuruId,
              guruName: ownerGuruName,
              kodeMapel: ownerKodeMapel,
            });
          } else {
            // Buat quiz baru
            const newQuiz = await addDoc(collection(db, "bimbel_modul"), {
              ...quizPayload,
              ...inheritedTargeting,
              title: quizTitle.toUpperCase(),
              subject: quizSubject || "Kuis",
              type: 'kuis_mandiri',
              status: 'aktif',
              guruId: ownerGuruId,
              guruName: ownerGuruName,
              kodeMapel: ownerKodeMapel,
              createdAt: serverTimestamp()
            });
            quizId = newQuiz.id;
          }
          
          // 🔥 UPDATE SECTION DI MODUL
          blocks[sectionIndex] = {
            ...section,
            quizId: quizId,
            quizTitle: quizTitle,
            quizQuestions: valid.length
          };
          
          await updateDoc(doc(db, "bimbel_modul", modulId), {
            blocks: blocks,
            updatedAt: serverTimestamp()
          });
          
          alert(`✅ Kuis berhasil disimpan ke modul!`);
          // 🔥 FIX BUG NYATA: sebelumnya `navigate(-1)` (andalkan "kembali"
          // berdasar riwayat browser) -- ini GAK RELIABLE. Kalau riwayat
          // browser sempat "kacau" (refresh halaman, dibuka lewat cara
          // lain, dll), navigate(-1) bisa nyasar ke halaman MANA PUN yang
          // kebetulan ada di riwayat sebelumnya -- termasuk balik ke
          // halaman "buat modul baru" yang kosong (laporan nyata: "kembali
          // malah ke modul baru kosongan"). Sekarang navigasi eksplisit ke
          // modul yang BENERAN barusan diedit (`modulId` yang sama persis
          // dipakai buat updateDoc di atas) -- gak ngandelin riwayat
          // browser sama sekali, jadi SELALU balik ke modul yang benar.
          navigate(`/guru/modul/materi?edit=${modulId}`, { replace: true });
          return;
        }
      }

      // 🔥 BERUBAH: blok "Tautkan ke Modul" DIHAPUS TOTAL. Alasannya: dua
      // jalur berbeda buat hasil yang sama (nempelin kuis ke sebuah modul)
      // -- (1) lewat sini, pilih modul dari dropdown SETELAH kuis dibuat
      // terpisah, vs (2) lewat "Tambah Kuis" DARI DALAM ManageMateri.jsx --
      // bikin sistem gampang salah kira satu skenario sebagai skenario
      // lainnya. Sekarang cuma ada SATU jalan resmi buat kuis nempel ke
      // modul: dibuat DARI DALAM modul itu sendiri (isFromModul, ditangani
      // di percabangan atas). Kuis yang dibuat dari halaman ini SELALU jadi
      // kuis mandiri.
      //
      // 🔥 FIX BUG NYATA & PERKETAT: `kodeMapel` yang disimpan sekarang
      // pakai state `kodeMapel` (kode SATU mapel spesifik yang dipilih guru
      // di dropdown Identitas Kuis) -- BUKAN LAGI `savedTeacher.kodeMapel`
      // (gabungan SEMUA mapel guru itu). Sebelumnya, guru yang ngajar 3
      // mapel (mis. Bahasa Indonesia SD/SMP/SMA) selalu nyimpen KETIGA kode
      // itu ke SETIAP kuis yang dia buat, gak peduli mapel mana yang
      // sebenernya dipilih -- akibatnya kuis "Bahasa Indonesia SD" bisa
      // "nyasar" ketarget juga ke siswa SMP/SMA. Sekarang targetnya presisi
      // ke SATU mapel yang benar-benar dipilih.
      await addDoc(collection(db, "bimbel_modul"), {
        title: quizTitle.toUpperCase(),
        subject: quizSubject || "Kuis",
        ...quizPayload,
        type: 'kuis_mandiri',
        targetKategori: publishTarget === 'jenjang' ? selectedProgram : "Semua",
        targetKelas: publishTarget === 'jenjang' ? selectedKelas : "Semua",
        // 🔥 BARU: sebelumnya field-field ini TIDAK PERNAH ditulis di
        // jalur kuis standalone -- makanya "target siswa tertentu"
        // buat kuis mandiri gak pernah bisa berfungsi sama sekali.
        sendToSpecificStudents: publishTarget === 'siswa',
        selectedStudents: publishTarget === 'siswa' ? selectedStudentsForQuiz : [],
        studentIds: publishTarget === 'siswa' ? selectedStudentsForQuiz.map(s => s.studentId) : [],
        status: 'aktif',
        guruId: savedTeacher.guruId || savedTeacher.id || '',
        kodeMapel: kodeMapel || savedTeacher.kodeMapel || '',
        guruName: savedTeacher.nama || '',
        authorName: localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru",
        createdAt: serverTimestamp()
      });
      alert(`✅ Kuis mandiri diterbitkan!`);
      localStorage.removeItem(draftKey);
      navigate(-1);
    } catch (err) { 
      // 🔥 FIX BUG PENTING: sebelumnya `setLoading(false)` ditulis sebagai
      // baris BIASA setelah blok try/catch — bukan di dalam `finally`. Begitu
      // ada `return` di tengah proses (misal validasi "Pilih modul tujuan!"
      // gagal), `return` itu langsung KELUAR DARI SELURUH FUNGSI dan
      // MELOMPATI baris `setLoading(false)` yang ada di bawahnya — akibatnya
      // tombol macet loading terus tanpa pernah balik normal. Sekarang
      // `setLoading(false)` dipindah ke `finally`, yang DIJAMIN selalu
      // jalan apapun yang terjadi (sukses, gagal, atau return di tengah).
      alert("❌ Gagal: " + err.message); 
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER MAIN
  // ============================================================
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? 12 : 20, paddingBottom: 100 }}>
      
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', fontWeight: 600, fontSize: 13,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14}/> Kembali
        </button>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' }}>
          ❓ {modulId ? `Kuis untuk Modul` : 'Buat Kuis Baru'}
          {isFromModul && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>#{modulId}</span>}
        </h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={handleUndo}
            disabled={historyPointer <= 0}
            title="Undo"
            style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: 8, cursor: historyPointer <= 0 ? 'not-allowed' : 'pointer', opacity: historyPointer <= 0 ? 0.4 : 1 }}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyPointer >= history.length - 1}
            title="Redo"
            style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: 8, cursor: historyPointer >= history.length - 1 ? 'not-allowed' : 'pointer', opacity: historyPointer >= history.length - 1 ? 0.4 : 1 }}
          >
            <Redo2 size={14} />
          </button>
          <button 
            onClick={() => setShowAIGenerateQuiz(true)} 
            style={{ 
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', 
              border: 'none', 
              padding: '8px 14px', 
              borderRadius: 8, 
              fontWeight: 700, 
              fontSize: 12, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
            }}
          >
            <Sparkles size={14} /> Generate dari Topik
          </button>
          <button 
            onClick={() => setShowSmartImport(true)} 
            style={{ 
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: 'white', 
              border: 'none', 
              padding: '8px 14px', 
              borderRadius: 8, 
              fontWeight: 700, 
              fontSize: 12, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
            }}
          >
            <Sparkles size={14} /> Smart Import
          </button>
          <button 
            onClick={() => setShowWordImport(true)} 
            style={{ 
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', 
              border: 'none', 
              padding: '8px 14px', 
              borderRadius: 8, 
              fontWeight: 700, 
              fontSize: 12, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
          >
            <FileText size={14} /> Import dari Word
          </button>
          <button
            onClick={async () => {
              if (!quizTitle) return alert("❌ Isi dulu judul kuisnya sebelum download.");
              const hasContent = questions.some(q => q.q.trim() || q.qImage);
              if (!hasContent) return alert("❌ Belum ada soal untuk didownload.");
              setPdfDownloading(true);
              try {
                await generateQuizAnswerKeyPDF(quizTitle, quizSubject, questions, quizMode, difficulty);
              } catch (err) {
                alert("❌ Gagal membuat PDF: " + err.message);
              }
              setPdfDownloading(false);
            }}
            disabled={pdfDownloading}
            title="Unduh semua soal + kunci jawaban lengkap sebagai PDF — buat dikirim ke guru pengganti tanpa perlu masuk akun ini"
            style={{ background: '#0d9488', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: pdfDownloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: pdfDownloading ? 0.7 : 1 }}
          >
            {pdfDownloading ? <Loader2 size={14} className="spin" /> : <Download size={14}/>}
            {pdfDownloading ? 'Menyiapkan...' : 'Soal + Jawaban (PDF)'}
          </button>
          <button onClick={handlePreviewQuiz} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={14}/> Preview
          </button>
          <button onClick={handleSaveQuiz} disabled={loading} style={{ background: '#673ab7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            {loading ? <Loader2 size={14} className="spin" /> : <Send size={14}/>} 
            {loading ? '...' : isFromModul ? 'Simpan ke Modul' : 'Terbitkan'}
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1️⃣ IDENTITAS KUIS */}
      {/* ========================================================== */}
      <div style={{ background: 'white', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} /> 1. Identitas Kuis
        </h4>
        <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Judul kuis..." style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
        {/* 🔥 FIX: field tanggal "deadline" yang dulu ada di sini dihapus —
            bikin bingung karena mirip "Jadwal Kuis" di bawah, padahal field ini
            TIDAK PERNAH dibaca/dipakai sama sekali di sisi siswa. Pengaturan
            buka/tutup kuis yang beneran berfungsi cuma "2. Jadwal Kuis". */}
        {/* 🔥 FIX KEBINGUNGAN & BLOKIR UTAMA (sama prinsipnya dengan panel
            "5. Target Publish" di bawah): kalau kuis ini BAGIAN DARI MODUL,
            mapel/kodeMapel-nya WAJIB 100% ikut modul induk -- guru gak perlu
            (dan gak boleh) pilih ulang dari dropdown mapel pribadinya
            sendiri. Sebelumnya dropdown editable ini tetap tampil buat kuis
            dalam-modul juga, lalu divalidasi HARUS PERSIS COCOK ke salah
            satu mapel guru yang lagi login (lihat handleSaveQuiz) -- itu
            akar masalah "guru terblokir gak bisa simpan kuis dalam modul"
            (kombinasi dengan kodeMapel yang lupa disalin di fetchQuiz di
            atas). Sekarang buat kuis-dalam-modul cukup tampilkan info
            read-only; validasi ketat itu juga sudah gak dipakai lagi buat
            kasus ini di handleSaveQuiz. */}
        {isFromModul ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#166534' }}>
              📎 Mapel kuis ini otomatis mengikuti modul induk:
            </span>
            <span style={{ fontWeight: 700, fontSize: 12, color: '#166534' }}>
              {quizSubject || '(memuat...)'}
            </span>
            {kodeMapel && <span style={{ background: '#dcfce7', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap' }}>📌 {kodeMapel}</span>}
          </div>
        ) : (
        <>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={quizSubject}
            onChange={e => {
              const namaTerpilih = e.target.value;
              setQuizSubject(namaTerpilih);
              // 🔥 FIX: begitu guru ganti pilihan mapel, kodeMapel kuis ini
              // ikut disetel ke kode yang SPESIFIK punya mapel itu (bukan
              // tetap nyangkut ke kode gabungan semua mapel guru) -- ini
              // yang mastiin target siswa "Siswa Tertentu" di bawah otomatis
              // ikut nyaring sesuai mapel yang benar-benar dipilih di sini.
              const match = teacherMapelOptions.find(o => o.nama === namaTerpilih);
              setKodeMapel(match?.kode || '');
            }}
            disabled={subjects.length === 0}
            style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${(!kodeMapel && quizSubject) ? '#f59e0b' : '#e2e8f0'}`, fontSize: 13, outline: 'none', background: subjects.length === 0 ? '#f1f5f9' : 'white', boxSizing: 'border-box' }}
          >
            <option value="">Pilih Mapel</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            {/* 🔥 BARU: kalau kuis ini kebetulan lagi bawa nilai mapel LAMA
                yang gak ada lagi di daftar mapel guru sekarang (data
                "orphan" -- lihat contoh kasus "Mapel Umum" yang sebenarnya
                gak pernah beneran terdaftar di mana pun), tampilkan SATU
                opsi tambahan yang jelas ditandai peringatan. Ini supaya
                guru LANGSUNG LIHAT ada yang gak beres (bukan dropdown
                kosong yang membingungkan), dan validasi di handleSaveQuiz
                akan TETAP MENOLAK simpan selama opsi ini yang kepilih --
                guru wajib ganti ke salah satu mapel asli di atas dulu. */}
            {quizSubject && !subjects.includes(quizSubject) && (
              <option value={quizSubject}>⚠️ {quizSubject} (mapel tidak valid — wajib diganti)</option>
            )}
          </select>
          {kodeMapel && <span style={{ background: '#ede9fe', padding: '0 12px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>📌 {kodeMapel}</span>}
        </div>
        {subjects.length === 0 && (
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#b91c1c', background: '#fef2f2', padding: '8px 10px', borderRadius: 8 }}>
            ⚠️ Kamu belum terdaftar mengajar mapel apa pun di sistem. Hubungi admin untuk didaftarkan ke mapel dulu — kuis tidak bisa disimpan tanpa mapel yang valid.
          </p>
        )}
        {quizSubject && !subjects.includes(quizSubject) && subjects.length > 0 && (
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#b45309', background: '#fffbeb', padding: '8px 10px', borderRadius: 8 }}>
            ⚠️ Kuis ini tertaut ke mapel "{quizSubject}" yang sudah tidak valid/tidak terdaftar. Pilih salah satu mapel di atas sebelum menyimpan.
          </p>
        )}
        </>
        )}
      </div>

      {/* ========================================================== */}
      {/* 2️⃣ JADWAL KUIS */}
      {/* ========================================================== */}
      <div style={{ background: 'white', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={18} /> 2. Jadwal Kuis
          </h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={useSchedule} onChange={() => setUseSchedule(!useSchedule)} />
            Aktifkan Jadwal
          </label>
        </div>
        
        {useSchedule && (
          <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>📅 Buka</label>
              <input type="datetime-local" value={quizOpenDate} onChange={e => setQuizOpenDate(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>📅 Tutup</label>
              <input type="datetime-local" value={quizCloseDate} onChange={e => setQuizCloseDate(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}
        
        {useSchedule && (
          <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: getQuizStatus().color + '15', border: `1px solid ${getQuizStatus().color}`, fontSize: 11, fontWeight: 600, color: getQuizStatus().color, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {getQuizStatus().icon} {getQuizStatus().label}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* 3️⃣ MODE KUIS */}
      {/* ========================================================== */}
      <div style={{ background: 'white', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={18} /> 3. Mode Kuis
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          <button 
            onClick={() => setQuizMode('simple')} 
            style={{
              padding: '14px',
              borderRadius: 10,
              border: quizMode === 'simple' ? '3px solid #3b82f6' : '2px solid #e2e8f0',
              background: quizMode === 'simple' ? '#eef2ff' : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: '0.2s'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>📝</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: quizMode === 'simple' ? '#1e293b' : '#64748b' }}>Mode Sederhana</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Kuis biasa tanpa pengaturan lanjutan</div>
            {quizMode === 'simple' && <div style={{ marginTop: 6, fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>✅ Aktif</div>}
          </button>

          <button 
            onClick={() => setQuizMode('advanced')} 
            style={{
              padding: '14px',
              borderRadius: 10,
              border: quizMode === 'advanced' ? '3px solid #673ab7' : '2px solid #e2e8f0',
              background: quizMode === 'advanced' ? '#f3e8ff' : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: '0.2s'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>🔒</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: quizMode === 'advanced' ? '#1e293b' : '#64748b' }}>Mode Ujian</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>+Timer, Random Soal, Batas Pengulangan</div>
            {quizMode === 'advanced' && <div style={{ marginTop: 6, fontSize: 10, color: '#673ab7', fontWeight: 700 }}>✅ Aktif</div>}
          </button>
        </div>

        {/* 🔥 Tampilkan/sembunyikan skor ke siswa — berlaku di SEMUA mode kuis */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showScoreToStudent}
              onChange={e => setShowScoreToStudent(e.target.checked)}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
              Tampilkan nilai angka ke siswa setelah submit
            </span>
          </label>
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, marginLeft: 24 }}>
            {showScoreToStudent
              ? 'Siswa langsung lihat nilai (misal 58/100) begitu selesai mengerjakan.'
              : 'Siswa cuma lihat "kuis sudah terkirim", nilainya disembunyikan dulu sampai guru infokan manual.'}
          </p>
        </div>

        {/* Pengaturan Lanjutan - Mode Ujian */}
        {quizMode === 'advanced' && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>⏱️ Batas Waktu (menit)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" min="0" max="180" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value))} style={{ width: 80, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>(0 = tidak terbatas)</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>🔄 Batas Pengulangan</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" min="0" max="10" value={maxAttempts} onChange={e => setMaxAttempts(parseInt(e.target.value))} style={{ width: 80, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>kali (0 = tak terbatas)</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={randomOrder} onChange={e => setRandomOrder(e.target.checked)} /> Acak soal
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={showExplanation} onChange={e => setShowExplanation(e.target.checked)} /> Tampilkan pembahasan
              </label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, background: 'white' }}>
                <option value="Mudah">🟢 Mudah</option><option value="Sedang">🟡 Sedang</option><option value="Sulit">🔴 Sulit</option>
              </select>
            </div>

            {/* 🔥 DETEKSI KECURANGAN — BARU */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={antiCheatEnabled} onChange={e => setAntiCheatEnabled(e.target.checked)} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>🛡️ Deteksi Kecurangan (pindah tab/aplikasi)</span>
              </label>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0 24px', lineHeight: 1.6 }}>
                Kalau aktif: layar siswa dikunci ke mode layar-penuh, dan setiap kali siswa <b>pindah tab, buka aplikasi lain,
                atau keluar dari layar-penuh</b> selama mengerjakan, itu tercatat otomatis dan kelihatan di hasil kuis buat kamu.
                <br /><br />
                <b>⚠️ Jujur soal batasnya:</b> ini nangkep kalau siswa pindah-pindah di <b>perangkat yang sama</b> yang lagi dipakai
                ngerjain kuis. Kalau siswa nyari jawaban pakai <b>HP kedua</b> yang terpisah, itu di luar jangkauan sistem apapun
                berbasis web — gak ada yang bisa deteksi itu.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* 4️⃣ SOAL KUIS */}
      {/* ========================================================== */}
      <div style={{ background: 'white', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} /> 4. Soal Kuis ({questions.filter(q => q.q.trim() || q.qImage).length})
          </h4>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowAIGenerateQuiz(true)} style={{ padding: '4px 10px', background: '#fffbeb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#b45309' }}>
              <Sparkles size={12} /> Generate dari Topik
            </button>
            <button onClick={() => setShowSmartImport(true)} style={{ padding: '4px 10px', background: '#eef2ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#3730a3' }}>
              <Sparkles size={12} /> Smart Import
            </button>
            <button onClick={() => setShowWordImport(true)} style={{ padding: '4px 10px', background: '#eff6ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#1d4ed8' }}>
              <FileText size={12} /> Import dari Word
            </button>
          </div>
        </div>

        {questions.map((item, idx) => renderQuestionEditor(item, idx))}

        {/* 🔥 TOMBOL TAMBAH SOAL DENGAN PILIHAN TIPE */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 4 }}>
            {QUESTION_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => addQuestion(type.id)}
                style={{
                  padding: '6px 4px',
                  borderRadius: 6,
                  border: `1px solid ${type.color}30`,
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  transition: '0.2s',
                  color: type.color,
                  fontSize: 8,
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                {type.icon}
                <span style={{ fontSize: 7 }}>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 5️⃣ TARGET PUBLISH */}
      {/* ========================================================== */}
      {/* 🔥 FIX KEBINGUNGAN UTAMA: kalau kuis ini bagian DARI MODUL (dibuka
          lewat "Tambah Kuis" di dalam materi), targetnya OTOMATIS IKUT MODUL —
          guru gak perlu (dan gak boleh) milih target lagi. Dulu pilihan
          "Tautkan ke Modul / Kuis Mandiri / Jenjang" tetap muncul walaupun
          kuis udah jelas nempel di modul, bikin sistem "bingung" (kuis udah
          jadi satu kesatuan dgn modul tapi masih ditanya mau dikirim kemana).
          Sekarang untuk kuis-dalam-modul, panel ini cuma nampilin info bahwa
          dia ikut aturan modul induknya. */}
      {isFromModul ? (
        <div style={{ background: '#f0fdf4', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #bbf7d0', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} /> Kuis Ini Bagian dari Modul
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>
            Kuis ini otomatis mengikuti target modul induknya — jadi kalau modulnya dikirim ke kelas/siswa tertentu, kuis ini ikut ke sana juga. Kamu tidak perlu memilih target lagi di sini. Cukup klik <b>Simpan ke Modul</b> di atas.
          </p>
        </div>
      ) : (
      <div style={{ background: 'white', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={18} /> 5. Target Publish
        </h4>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {/* 🔥 BERUBAH: tombol "Tautkan ke Modul" DIHAPUS -- kalau guru mau
              kuis nempel ke modul, satu-satunya jalan resmi sekarang lewat
              "Tambah Kuis" DARI DALAM ManageMateri.jsx. */}
          <button onClick={() => setPublishTarget('mandiri')} style={{ 
            padding: '8px 14px', 
            borderRadius: 8, 
            border: publishTarget === 'mandiri' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: publishTarget === 'mandiri' ? '#eef2ff' : 'white',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Send size={14} color={publishTarget === 'mandiri' ? '#3b82f6' : '#94a3b8'} /> Kuis Mandiri
          </button>
          <button onClick={() => setPublishTarget('jenjang')} style={{ 
            padding: '8px 14px', 
            borderRadius: 8, 
            border: publishTarget === 'jenjang' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            background: publishTarget === 'jenjang' ? '#fffbeb' : 'white',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Users size={14} color={publishTarget === 'jenjang' ? '#f59e0b' : '#94a3b8'} /> Tautkan ke Jenjang
          </button>
          {/* 🔥 BARU: mode ini sebelumnya gak ada sama sekali -- kuis
              standalone cuma bisa "Semua" atau kelas/kategori, gak pernah
              bisa ditargetin ke siswa spesifik. */}
          <button onClick={() => setPublishTarget('siswa')} style={{ 
            padding: '8px 14px', 
            borderRadius: 8, 
            border: publishTarget === 'siswa' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
            background: publishTarget === 'siswa' ? '#f5f3ff' : 'white',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <UserPlus size={14} color={publishTarget === 'siswa' ? '#8b5cf6' : '#94a3b8'} /> Siswa Tertentu
          </button>
        </div>

        {refsStatus === 'error' && (
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#ef4444' }}>
            ⚠️ Gagal memuat sebagian data (daftar siswa/kelas/mapel).
            <button type="button" onClick={loadRefs} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10 }}>🔄 Coba Lagi</button>
          </div>
        )}

        {publishTarget === 'jenjang' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #f59e0b', fontSize: 12, outline: 'none', background: 'white' }}>
                <option value="Semua">Semua Program</option>
                <option value="Reguler">📚 Reguler</option>
                <option value="English">🗣️ English</option>
              </select>
              <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #f59e0b', fontSize: 12, outline: 'none', background: 'white' }}>
                <option value="Semua">{refsStatus === 'loading' ? 'Memuat daftar kelas...' : 'Semua Kelas'}</option>
                {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            {refsStatus === 'error' && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#ef4444' }}>
                ⚠️ Gagal memuat daftar kelas.
                <button type="button" onClick={loadRefs} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10 }}>🔄 Coba Lagi</button>
              </div>
            )}
          </div>
        )}

        {/* 🔥 BARU: panel picker siswa buat mode "Siswa Tertentu" */}
        {publishTarget === 'siswa' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={studentSearchForQuiz}
                  onChange={e => setStudentSearchForQuiz(e.target.value)}
                  placeholder="Cari siswa..."
                  style={{ width: '100%', padding: '8px 10px 8px 28px', borderRadius: 8, border: '1px solid #8b5cf6', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={() => setShowStudentPickerForQuiz(true)}
                />
              </div>
              <button onClick={selectAllFilteredForQuiz} style={{ padding: '4px 12px', background: '#f5f3ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#6d28d9' }}>Pilih Semua</button>
            </div>

            {showStudentPickerForQuiz && (
              <div style={{ marginTop: 6, maxHeight: 200, overflowY: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {refsStatus === 'loading' ? (
                  <p style={{ padding: 12, fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>⏳ Memuat daftar siswa...</p>
                ) : refsStatus === 'error' ? (
                  <div style={{ padding: 14, textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#ef4444', margin: '0 0 8px' }}>⚠️ Gagal memuat daftar siswa.</p>
                    <button type="button" onClick={loadRefs} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>🔄 Coba Lagi</button>
                  </div>
                ) : filteredStudentsForQuiz.length === 0 ? (
                  <p style={{ padding: 12, fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                    {allStudentsForQuiz.length === 0
                      ? (kodeMapel ? `Belum ada siswa yang terdaftar ke mapel ini (${kodeMapel}). Daftarkan dulu lewat halaman Edit Siswa.` : 'Belum ada data siswa.')
                      : 'Siswa tidak ditemukan.'}
                  </p>
                ) : (
                  filteredStudentsForQuiz.map(student => {
                    const checked = selectedStudentsForQuiz.some(s => s.studentId === student.studentId);
                    return (
                      <div
                        key={student.id}
                        onClick={() => toggleStudentForQuiz(student)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                          background: checked ? '#f5f3ff' : 'white', fontSize: 12,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{student.nama}</span>
                          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>#{student.studentId}</span>
                          <span style={{ fontSize: 9, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, marginLeft: 6 }}>
                            {student.kelasSekolah} · {student.program}
                          </span>
                        </div>
                        <input type="checkbox" checked={checked} onChange={() => {}} style={{ accentColor: '#8b5cf6', width: 16, height: 16 }} />
                      </div>
                    );
                  })
                )}
              </div>
            )}
            {selectedStudentsForQuiz.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {selectedStudentsForQuiz.slice(0, 10).map(s => (
                  <span key={s.studentId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f5f3ff', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: '#6d28d9' }}>
                    {s.nama}
                    <button onClick={() => toggleStudentForQuiz(s)} style={{ background: 'none', border: 'none', color: '#6d28d9', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                  </span>
                ))}
                {selectedStudentsForQuiz.length > 10 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{selectedStudentsForQuiz.length - 10}</span>}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* ========================================================== */}
      {/* SMART IMPORT MODAL */}
      {/* ========================================================== */}
      {showSmartImport && (
        <SmartImportPanel
          onParsed={handleSmartParsed}
          onClose={() => setShowSmartImport(false)}
        />
      )}

      {/* ========================================================== */}
      {/* IMPORT DARI WORD MODAL (lebih akurat dari PDF crop) */}
      {/* ========================================================== */}
      {showWordImport && (
        <WordImportQuiz
          onParsed={handleSmartParsed}
          onClose={() => setShowWordImport(false)}
        />
      )}

      {/* ========================================================== */}
      {/* AI GENERATE DARI TOPIK MODAL */}
      {/* ========================================================== */}
      {showAIGenerateQuiz && (
        <AIGenerateQuiz
          subject={quizSubject}
          onGenerated={handleAIQuizGenerated}
          onClose={() => setShowAIGenerateQuiz(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ManageQuiz;