// src/pages/teacher/modul/CekTugasSiswa.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc, 
  query, where, serverTimestamp 
} from "firebase/firestore";
import { 
  CheckCircle, Clock, Search, Edit3, Save, 
  Trash2, FileText, HelpCircle, BarChart3, RefreshCw, 
  User, Hash, Tag, Filter, X, BookOpen, Eye,
  ChevronDown, ChevronUp, Users, AlertTriangle, ArrowLeft,
  Download, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// 🔥 Render math sederhana (sama seperti di ManageQuiz/StudentQuizView)
const renderMath = (text) => {
  if (!text) return null;
  const parts = String(text).split(/(\$\$.*?\$\$|\$.*?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return <BlockMath key={i} math={part.substring(2, part.length - 2)} />; }
      catch (e) { return <span key={i}>{part}</span>; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={i} math={part.substring(1, part.length - 1)} />; }
      catch (e) { return <span key={i}>{part}</span>; }
    }
    // 🔥 FIX: sama seperti di ManageQuiz.jsx/StudentQuizView.jsx -- biar
    // guru cek jawaban siswa juga gak liat markdown mentah kayak **bold**.
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

// 🔥 BARU: jsPDF TIDAK BISA render rumus LaTeX/KaTeX beneran (beda dari
// tampilan di layar yang pakai KaTeX/react-katex buat nge-render simbol
// matematika visual) -- sebelumnya di sini cuma tanda "$" yang dibuang
// (baris qText di bawah), tapi kode LaTeX-nya sendiri (\frac{}, \text{},
// \times, dll) tetap ditulis mentah ke PDF, jadi hasilnya berantakan
// dibaca. Fungsi ini konversi notasi LaTeX yang PALING SERING dipakai di
// soal jadi teks biasa yang tetap kebaca jelas -- sama persis pola yang
// dipakai di generateQuizAnswerKeyPDF() (ManageQuiz.jsx).
const latexToPlainTextForPdf = (raw = '') => {
  let s = String(raw || '');
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');
  s = s.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
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
  s = s.replace(/_\{([^}]*)\}/g, '$1').replace(/\^\{([^}]*)\}/g, '^$1');
  s = s.replace(/_([a-zA-Z0-9])/g, '$1');
  s = s.replace(/\$\$/g, '').replace(/\$/g, '');
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/[{}]/g, '');
  return s;
};

// 🔥 Ringkasan jawaban per tipe soal (buat modal detail guru)
const describeAnswer = (q, which) => {
  const ans = which === 'user' ? q.userAnswer : null;
  switch (q.type) {
    case 'multiple':
      return which === 'user'
        ? (ans !== undefined && q.options?.[ans] !== undefined ? q.options[ans] : 'Tidak dijawab')
        : (q.options?.[q.correctAnswer] ?? '-');
    case 'multiselect':
      if (which === 'user') {
        return Array.isArray(ans) && ans.length ? ans.map(i => q.options?.[i]).join(', ') : 'Tidak dijawab';
      }
      return (q.correctAnswers || []).map(i => q.options?.[i]).join(', ');
    case 'shortanswer':
      return which === 'user' ? (ans || 'Tidak dijawab') : (q.shortAnswer || '-');
    case 'truefalse':
      return (q.statements || []).map((s, idx) => {
        const val = which === 'user' ? q.userAnswer?.[idx] : s.isTrue;
        return `${s.text || `Pernyataan ${idx + 1}`}: ${val === true ? 'Benar' : val === false ? 'Salah' : '-'}`;
      }).join(' | ');
    case 'causeeffect':
      if (which === 'user') {
        return `Sebab: ${q.userAnswer?.cause === true ? 'Benar' : q.userAnswer?.cause === false ? 'Salah' : '-'}, Akibat: ${q.userAnswer?.effect === true ? 'Benar' : q.userAnswer?.effect === false ? 'Salah' : '-'}`;
      }
      return `Sebab: ${q.isCauseTrue ? 'Benar' : 'Salah'}, Akibat: ${q.isEffectTrue ? 'Benar' : 'Salah'}`;
    case 'matching':
      return (q.matchingPairs || []).map((p, idx) => {
        const rightIdx = which === 'user' ? q.userAnswer?.[idx] : idx;
        const rightText = rightIdx !== undefined ? q.matchingPairs?.[rightIdx]?.right : '-';
        return `${p.left} → ${rightText || '-'}`;
      }).join(' | ');
    case 'reading':
      return (q.subQuestions || []).map((sq, idx) => {
        const oIdx = which === 'user' ? q.userAnswer?.[idx] : sq.correct;
        return `${idx + 1}. ${oIdx !== undefined ? sq.options?.[oIdx] : '-'}`;
      }).join(' | ');
    default:
      return '-';
  }
};

// ============================================================
// 🌟 ASTRO GEMILANG — LAPORAN EVALUASI KOGNITIF (PDF, siap diunduh & dikirim
// ke orang tua)
// ============================================================
// 🔥 KENAPA NARASINYA BERBASIS ATURAN (BUKAN AI GENERATIF LANGSUNG): ini
// dokumen RESMI yang dikirim ke orang tua. Kalau narasinya digenerate AI
// setiap kali, ada risiko AI "mengarang" kesimpulan yang gak didukung data
// aslinya (halusinasi) -- itu bisa bikin bimbel kelihatan gak profesional
// kalau orang tua nangkep ada kesimpulan yang gak nyambung sama angkanya.
// Semua kalimat di laporan ini ditarik LANGSUNG dari data pengerjaan siswa
// yang beneran tersimpan (skor, akurasi per tipe soal, waktu, pelanggaran)
// -- 100% bisa dipertanggungjawabkan, gak ada yang "dikarang".
const TYPE_LABELS_PDF = {
  multiple: 'Pilihan Ganda',
  truefalse: 'Benar/Salah',
  multiselect: 'Pilih Lebih dari Satu',
  reading: 'Membaca Teks',
  shortanswer: 'Isian Singkat',
  causeeffect: 'Sebab Akibat',
  matching: 'Menjodohkan',
};

const VIOLATION_LABELS_PDF = {
  halaman_diterjemahkan_otomatis: 'Halaman diterjemahkan otomatis',
  pindah_tab_atau_aplikasi: 'Berpindah tab/aplikasi',
  keluar_dari_jendela: 'Keluar dari jendela browser',
  keluar_fullscreen: 'Keluar dari mode layar penuh',
};

// 🔥 Kelompokkan jawaban per TIPE SOAL, hitung akurasi -- ini jadi proxy
// "analisis kognitif" yang paling jujur bisa ditarik dari data yang ada
// (belum ada tagging domain seperti "Numerasi"/"Literasi" per soal di
// skema kuis saat ini -- kalau nanti ditambahkan, tabel ini tinggal
// dikelompokkan ulang berdasarkan domain, bukan tipe soal).
const summarizeByType = (details) => {
  const byType = {};
  (details || []).forEach(q => {
    const t = q.type || 'multiple';
    if (!byType[t]) byType[t] = { count: 0, points: 0 };
    byType[t].count += 1;
    byType[t].points += (q.partialFraction !== undefined && q.partialFraction !== null)
      ? q.partialFraction
      : (q.isCorrect ? 1 : 0);
  });
  return byType;
};

const buildNarrative = (item, byType) => {
  const lines = [];
  const score = item.score ?? 0;
  const title = item.modulTitle || 'kuis ini';

  if (score >= 85) lines.push(`Ananda menunjukkan penguasaan yang sangat baik pada "${title}" dengan perolehan nilai ${score}.`);
  else if (score >= 70) lines.push(`Ananda menunjukkan penguasaan yang baik pada "${title}" dengan perolehan nilai ${score}.`);
  else if (score >= 50) lines.push(`Ananda menunjukkan penguasaan yang cukup pada "${title}" dengan perolehan nilai ${score}, dan masih ada ruang untuk peningkatan.`);
  else lines.push(`Ananda memerlukan pendampingan lebih lanjut pada "${title}" dengan perolehan nilai ${score}.`);

  const typesArr = Object.entries(byType).map(([t, s]) => ({ type: t, acc: s.count ? s.points / s.count : 0 }));
  if (typesArr.length > 1) {
    const sorted = [...typesArr].sort((a, b) => b.acc - a.acc);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    if (strongest.acc >= 0.7) {
      lines.push(`Kekuatan utama terlihat pada soal tipe ${TYPE_LABELS_PDF[strongest.type] || strongest.type} (akurasi ${Math.round(strongest.acc * 100)}%).`);
    }
    if (weakest.acc < 0.6) {
      lines.push(`Area yang disarankan untuk diperkuat adalah soal tipe ${TYPE_LABELS_PDF[weakest.type] || weakest.type} (akurasi ${Math.round(weakest.acc * 100)}%).`);
    }
  }

  if (item.isAutoSubmit) {
    lines.push('Kuis ini terkirim otomatis karena waktu pengerjaan habis -- disarankan untuk melatih manajemen waktu saat mengerjakan soal.');
  }

  const pending = (item.totalQuestions || 0) - (item.details || []).filter(d => d.userAnswer !== undefined && d.userAnswer !== null && d.userAnswer !== '').length;
  if (pending > 0) {
    lines.push(`Terdapat ${pending} soal yang belum dijawab pada saat pengumpulan.`);
  }

  return lines;
};

const generateAstroGemilangReport = (item) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 34;

  // Header / letterhead
  doc.setFillColor(103, 58, 183);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Astro Gemilang', 14, 12);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Asisten Analisis Akademik - Bimbel Gemilang', 14, 19);
  doc.setFontSize(8);
  const genDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Laporan dibuat: ${genDate}`, pageWidth - 14, 19, { align: 'right' });
  doc.setTextColor(30, 41, 59);

  // Info siswa & kuis
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Informasi Siswa & Kuis', 14, y);
  y += 4;
  const infoRows = [
    ['Nama Siswa', item.studentName || '-'],
    ['NIM / ID', item.studentNim || '-'],
    ['Kelas', item.studentClass || '-'],
    ['Mata Pelajaran', item.subject || '-'],
    ['Nama Kuis', item.modulTitle || '-'],
    ['Waktu Pengerjaan', item.submittedAt?.toDate ? item.submittedAt.toDate().toLocaleString('id-ID') : '-'],
  ];
  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Ringkasan skor
  const score = item.score ?? 0;
  const scoreColor = score >= 85 ? [16, 185, 129] : score >= 70 ? [59, 130, 246] : score >= 50 ? [245, 158, 11] : [239, 68, 68];
  doc.setFillColor(...scoreColor);
  doc.roundedRect(14, y, 45, 26, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(String(score ?? '-'), 36.5, y + 14, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.text('NILAI AKHIR', 36.5, y + 21, { align: 'center' });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  const rightColX = 65;
  doc.text(`Benar: ${item.correctAnswers ?? 0} dari ${item.totalQuestions ?? 0} soal`, rightColX, y + 6);
  doc.text(`Waktu digunakan: ${item.timeUsed ? Math.round(item.timeUsed / 60) + ' menit' : '-'}`, rightColX, y + 12);
  doc.text(`Status pengiriman: ${item.isAutoSubmit ? 'Otomatis (waktu habis)' : 'Dikirim manual oleh siswa'}`, rightColX, y + 18);
  y += 34;

  // Analisis kognitif per tipe soal
  const byType = summarizeByType(item.details);
  const typeTableRows = Object.entries(byType).map(([t, s]) => [
    TYPE_LABELS_PDF[t] || t,
    String(s.count),
    s.points.toFixed(1),
    Math.round((s.points / s.count) * 100) + '%',
  ]);

  if (typeTableRows.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Analisis Kognitif per Tipe Soal', 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Tipe Soal', 'Jumlah', 'Skor Diperoleh', 'Akurasi']],
      body: typeTableRows,
      theme: 'striped',
      headStyles: { fillColor: [103, 58, 183] },
      styles: { fontSize: 9 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Narasi (berbasis data, lihat penjelasan di buildNarrative)
  const narrativeLines = buildNarrative(item, byType);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Ringkasan Analisis', 14, y);
  y += 6;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9.5);
  narrativeLines.forEach(line => {
    const split = doc.splitTextToSize('- ' + line, pageWidth - 28);
    doc.text(split, 14, y);
    y += split.length * 5 + 2;
  });
  y += 4;

  // Rincian jawaban per soal
  if (y > 240) { doc.addPage(); y = 18; }
  if ((item.details || []).length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Rincian Jawaban', 14, y);
    y += 4;
    const detailRows = item.details.map((q, i) => {
      const status = q.isCorrect ? 'Benar' : (q.partsTotal ? `Sebagian (${q.partsCorrect}/${q.partsTotal})` : 'Salah');
      const qText = latexToPlainTextForPdf(q.question).slice(0, 65);
      return [String(i + 1), qText, TYPE_LABELS_PDF[q.type] || q.type, status];
    });
    autoTable(doc, {
      startY: y,
      head: [['No', 'Soal', 'Tipe', 'Status']],
      body: detailRows,
      theme: 'striped',
      headStyles: { fillColor: [103, 58, 183] },
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 100 }, 2: { cellWidth: 35 }, 3: { cellWidth: 30 } },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Catatan integritas pengerjaan (kalau ada pelanggaran tercatat)
  if ((item.cheatViolationCount || 0) > 0) {
    if (y > 235) { doc.addPage(); y = 18; }
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(180, 60, 20);
    doc.text('Catatan Integritas Pengerjaan', 14, y);
    doc.setTextColor(30, 41, 59);
    y += 5;
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    const noteSplit = doc.splitTextToSize(
      'Sistem mendeteksi beberapa aktivitas selama pengerjaan (mis. berpindah tab/aplikasi). Ini adalah sinyal untuk didiskusikan bersama guru, bukan vonis kecurangan otomatis.',
      pageWidth - 28
    );
    doc.text(noteSplit, 14, y);
    y += noteSplit.length * 4 + 4;
    const violRows = (item.cheatViolations || []).map((v, i) => [
      String(i + 1),
      VIOLATION_LABELS_PDF[v.type] || v.type,
      v.at ? new Date(v.at).toLocaleTimeString('id-ID') : '-',
    ]);
    autoTable(doc, {
      startY: y,
      head: [['No', 'Jenis Aktivitas', 'Waktu']],
      body: violRows,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Footer disclaimer + nomor halaman di setiap halaman
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Laporan dihasilkan otomatis dari data hasil pengerjaan kuis (Astro Gemilang). Untuk diskusi lebih lanjut, silakan hubungi guru mata pelajaran terkait.',
      14, 290
    );
    doc.text(`Halaman ${p} dari ${pageCount}`, pageWidth - 14, 290, { align: 'right' });
  }

  const safeName = (s) => String(s || '').replace(/[^a-z0-9]/gi, '_');
  doc.save(`Laporan_AstroGemilang_${safeName(item.studentName)}_${safeName(item.modulTitle)}.pdf`);
};

const CekTugasSiswa = () => {
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tugas');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [refreshing, setRefreshing] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [newScore, setNewScore] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showFilters, setShowFilters] = useState(false);
  
  const [guruData, setGuruData] = useState(null);
  const [guruId, setGuruId] = useState('');
  const [kodeMapel, setKodeMapel] = useState('');
  const [guruName, setGuruName] = useState('');
  const [mapelList, setMapelList] = useState([]);

  const [stats, setStats] = useState({ totalTugas: 0, pendingTugas: 0, gradedTugas: 0, totalKuis: 0, avgScore: 0 });
  const [viewingDetail, setViewingDetail] = useState(null);
  // 🔥 BARU: urutan soal KANONIK (urutan asli sesuai dokumen kuisnya, BUKAN
  // urutan yang tersimpan di submission siswa -- yang bisa beda-beda per
  // siswa kalau kuisnya pakai "Acak Soal"). Lihat penjelasan lengkap di
  // openDetail() di bawah.
  const [canonicalOrderMap, setCanonicalOrderMap] = useState({}); // { [quizDocId]: [questionId, ...] }
  const [loadingCanonicalOrder, setLoadingCanonicalOrder] = useState(false);

  // 🔥 BARU: target tampilan card per tugas/kuis (bukan tabel gepeng semua
  // dicampur). `null` = tampilan daftar card ringkasan. Kalau diisi id
  // grup, berarti lagi "masuk" ke satu tugas/kuis spesifik buat lihat
  // daftar siswa yang mengerjakan itu SAJA.
  const [openGroupKey, setOpenGroupKey] = useState(null);
  // Target audiens per modul (dari targeting kelas/kategori/siswa spesifik)
  // -- dipakai buat hitung persentase "X dari Y siswa sudah mengerjakan".
  const [targetCounts, setTargetCounts] = useState({}); // { [modulId]: totalSiswaTarget }

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ===== AMBIL DATA GURU =====
  useEffect(() => {
    const init = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
        const name = saved.nama || '';
        const id = saved.guruId || saved.id || '';
        setGuruId(id);
        setGuruName(name);

        if (name) {
          const q = query(collection(db, "teachers"), where("nama", "==", name));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const guru = snap.docs[0].data();
            setGuruData(guru);
            setKodeMapel(guru.kodeMapel || '');
            // 🔥 Simpan SEMUA variasi mapel (capitalized, uppercase, lowercase)
            // — ini tetap dipertahankan sebagai FALLBACK untuk data submission
            // lama yang belum punya guruId (lihat filterByOwner di bawah).
            const mapelVariations = [];
            if (guru.mapel) {
              // 🔥 Guru bisa ngampu lebih dari 1 mapel (field `mapel` bisa
              // berisi gabungan "Matematika, IPA" dipisah koma) -- dipecah
              // dulu per mapel biar semua variannya ikut dicek.
              guru.mapel.split(',').map(m => m.trim()).filter(Boolean).forEach(m => {
                mapelVariations.push(m);
                mapelVariations.push(m.toUpperCase());
                mapelVariations.push(m.toLowerCase());
                mapelVariations.push(m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
              });
            }
            setMapelList([...new Set(mapelVariations)]);
          }
        }
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  // ===== FETCH DATA - CLIENT-SIDE FILTER =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
      const guruMapel = saved.mapel || '';
      const myGuruId = saved.guruId || saved.id || '';
      
      // 🔥 Ambil SEMUA data dulu (1 query per koleksi)
      const [snapT, snapQ] = await Promise.all([
        getDocs(collection(db, "jawaban_tugas")),
        getDocs(collection(db, "jawaban_kuis"))
      ]);
      
      const allTasks = snapT.docs.map(d => ({ id: d.id, ...d.data(), type: 'tugas' }));
      const allQuizzes = snapQ.docs.map(d => ({ id: d.id, ...d.data(), type: 'kuis' }));

      // 🔥 Gabungkan semua variasi mapel untuk filter FALLBACK (nama teks)
      const mapelVariations = [...new Set([
        kodeMapel,
        guruMapel,
        guruMapel?.toUpperCase(),
        guruMapel?.toLowerCase(),
        guruData?.mapel,
        guruData?.mapel?.toUpperCase(),
        guruData?.mapel?.toLowerCase(),
        ...mapelList
      ].filter(Boolean))];

      // 🔥 FIX UTAMA: dulu filter SATU-SATUNYA cara adalah cocok-cocokan nama
      // mapel (rapuh — gampang meleset kalau ada perbedaan kapitalisasi, spasi,
      // atau kuis dibuat dengan label mapel yang beda dari mapel utama guru).
      // Sekarang PRIORITAS UTAMA: cocokkan guruId (ID unik, akurat, gak bisa
      // salah). Fallback ke cocok-cocokan nama mapel HANYA untuk submission
      // lama yang dokumennya belum punya field guruId sama sekali.
      const filterByOwner = (item) => {
        // Prioritas 1: match berdasarkan guruId (akurat)
        if (item.guruId) {
          return myGuruId && item.guruId === myGuruId;
        }
        // Fallback: data lama tanpa guruId, tetap pakai cocok-cocokan nama
        if (mapelVariations.length === 0) return true; // Tampilkan semua kalau guru belum ada data mapel
        const itemSubject = (item.subject || '').toLowerCase();
        const itemModulTitle = (item.modulTitle || '').toLowerCase();
        return mapelVariations.some(m => {
          const ml = m.toLowerCase();
          return itemSubject.includes(ml) || itemModulTitle.includes(ml);
        });
      };

      const filteredTasks = allTasks.filter(filterByOwner);
      const filteredQuizzes = allQuizzes.filter(filterByOwner);

      // 🔥 FIX BUG: dulu skor SELALU dihitung ulang pakai rumus lama
      // (correctAnswers/totalQuestions*100) dan NIMPA skor asli yang sudah
      // tersimpan — padahal sejak ada nilai sebagian (partial credit) untuk
      // soal Benar/Salah, Sebab-Akibat, Menjodohkan, dan Membaca Teks, skor
      // yang benar itu YANG SUDAH TERSIMPAN di database (dihitung pas siswa
      // submit), bukan hasil hitung ulang di sini yang gak tau soal nilai
      // sebagian. Sekarang cuma dipakai sebagai CADANGAN kalau skornya
      // benar-benar belum ada sama sekali (data lampau yang rusak).
      const updatedQuizzes = filteredQuizzes.map(q => {
        if (q.score === undefined || q.score === null) {
          if (q.correctAnswers !== undefined && q.totalQuestions && q.totalQuestions > 0) {
            const autoScore = Math.round((q.correctAnswers / q.totalQuestions) * 100);
            return { ...q, score: autoScore, status: 'Dinilai' };
          }
        }
        return q;
      });

      setTasks(filteredTasks);
      setQuizzes(updatedQuizzes);

      setStats({
        totalTugas: filteredTasks.length,
        pendingTugas: filteredTasks.filter(t => !t.score || t.status === 'Pending').length,
        gradedTugas: filteredTasks.filter(t => t.score && t.status !== 'Pending').length,
        totalKuis: updatedQuizzes.length,
        avgScore: updatedQuizzes.length 
          ? Math.round(updatedQuizzes.reduce((a, q) => a + (q.score || 0), 0) / updatedQuizzes.length) 
          : 0
      });

      // 🔥 BARU: hitung berapa siswa yang SEHARUSNYA mengerjakan tiap
      // modul/kuis (buat persentase progres), dengan fetch dokumen modulnya
      // + cocokkan ke koleksi "students" berdasarkan targeting (kelas,
      // kategori, atau daftar siswa spesifik). Dijalankan sekali per
      // modulId unik yang muncul di submission, PARALEL & independen
      // (kalau satu modul gagal di-fetch, yang lain tetap jalan).
      const allModulIds = [...new Set([...filteredTasks, ...updatedQuizzes].map(i => i.modulId).filter(Boolean))];
      if (allModulIds.length > 0) {
        const snapSiswaAll = await getDocs(collection(db, "students")).catch(() => null);
        const allSiswa = snapSiswaAll ? snapSiswaAll.docs.map(d => ({ id: d.id, ...d.data() })) : [];

        const results = await Promise.allSettled(
          allModulIds.map(mid => getDoc(doc(db, "bimbel_modul", mid)))
        );
        const counts = {};
        results.forEach((res, idx) => {
          const mid = allModulIds[idx];
          if (res.status !== 'fulfilled' || !res.value.exists()) { counts[mid] = null; return; }
          const modul = res.value.data();
          if (modul.sendToSpecificStudents) {
            const ids = modul.studentIds || (modul.selectedStudents || []).map(s => s.studentId || s.id);
            counts[mid] = ids.length;
          } else {
            const targetKelas = modul.targetKelas || 'Semua';
            const targetKategori = modul.targetKategori || 'Semua';
            counts[mid] = allSiswa.filter(s =>
              (targetKelas === 'Semua' || s.kelasSekolah === targetKelas) &&
              (targetKategori === 'Semua' || s.kategori === targetKategori)
            ).length;
          }
        });
        setTargetCounts(counts);
      }
    } catch (e) { 
      console.error("Error fetch:", e); 
    }
    setLoading(false);
    setRefreshing(false);
  }, [kodeMapel, guruData, mapelList]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  // ===== UPDATE SCORE =====
  const handleUpdateScore = async (id, collectionName) => {
    if (newScore === "" || isNaN(newScore) || newScore < 0 || newScore > 100) {
      return alert("Nilai harus 0-100!");
    }
    try {
      await updateDoc(doc(db, collectionName, id), { 
        score: Number(newScore), 
        status: "Dinilai", 
        gradedAt: serverTimestamp() 
      });
      setEditingScore(null);
      setNewScore("");
      fetchData();
    } catch (e) { alert("Gagal: " + e.message); }
  };

  // ===== DELETE =====
  const handleDelete = async (id, collectionName) => {
    if (!window.confirm("⚠️ Hapus permanen?")) return;
    try { 
      await deleteDoc(doc(db, collectionName, id)); 
      fetchData(); 
    } catch (e) { alert("Gagal: " + e.message); }
  };

  // ============================================================
  // 🔥 BUKA DETAIL SATU SUBMISSION -- SEKALIGUS BENERIN "POLA SOAL BEDA"
  // ============================================================
  // Kalau kuisnya pakai "Acak Soal" (randomOrder), urutan soal yang
  // TERSIMPAN di `details` tiap siswa itu urutan HASIL ACAKAN buat siswa
  // itu masing-masing -- BUKAN urutan asli di dokumen kuis. Jadi kalau guru
  // buka jawaban Siswa A lalu Siswa B untuk KUIS YANG SAMA, "Soal 1" bisa
  // merujuk ke pertanyaan yang BEDA di masing-masing (keliatan "polanya
  // beda" padahal sebenarnya soal yang sama, cuma urutannya diacak per
  // siswa). Fix: begitu modal dibuka, ambil dokumen kuis ASLI-nya (pakai
  // modulId yang tersimpan di submission), catat urutan soal KANONIK-nya
  // (urutan asli di database, sebelum diacak), lalu urutkan ulang `details`
  // berdasarkan itu tiap kali ditampilkan -- supaya "Soal 1" SELALU berarti
  // pertanyaan yang sama, siapapun siswanya.
  const openDetail = async (item) => {
    setViewingDetail(item);
    if (item.type !== 'kuis' || !item.modulId || canonicalOrderMap[item.modulId]) return;
    setLoadingCanonicalOrder(true);
    try {
      const snap = await getDoc(doc(db, "bimbel_modul", item.modulId));
      if (snap.exists()) {
        const order = (snap.data().quizData || []).map(q => q.id);
        setCanonicalOrderMap(prev => ({ ...prev, [item.modulId]: order }));
      }
    } catch (e) {
      console.error("Gagal ambil urutan soal asli:", e);
    }
    setLoadingCanonicalOrder(false);
  };

  const orderedDetailQuestions = useMemo(() => {
    if (!viewingDetail?.details) return [];
    const order = canonicalOrderMap[viewingDetail.modulId];
    if (!order || order.length === 0) return viewingDetail.details;
    return [...viewingDetail.details].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [viewingDetail, canonicalOrderMap]);

  // ===== FILTER (dalam satu grup yang lagi dibuka) =====
  const currentData = useMemo(() => activeTab === 'tugas' ? tasks : quizzes, [activeTab, tasks, quizzes]);

  // ============================================================
  // 🔥 BARU: KELOMPOKKAN SUBMISSION PER TUGAS/KUIS (bukan tabel gepeng)
  // ============================================================
  // Dikelompokkan pakai `modulId` (paling akurat -- selalu merujuk ke
  // dokumen tugas/kuis yang sama persis), dengan fallback ke kombinasi
  // judul+blockId untuk data lampau yang mungkin belum punya modulId.
  const groups = useMemo(() => {
    const map = new Map();
    currentData.forEach(item => {
      const key = item.modulId || `${item.modulTitle || 'Tanpa Judul'}::${item.blockId || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          modulId: item.modulId || null,
          title: item.modulTitle || 'Tanpa Judul',
          subject: item.subject || 'Umum',
          items: [],
        });
      }
      map.get(key).items.push(item);
    });
    return Array.from(map.values())
      .map(g => {
        const scored = g.items.filter(i => i.score !== undefined && i.score !== null);
        const pending = g.items.filter(i => !i.score || i.status === 'Pending').length;
        const violations = g.items.filter(i => (i.cheatViolationCount || 0) > 0).length;
        const target = g.modulId ? targetCounts[g.modulId] : null;
        return {
          ...g,
          submittedCount: g.items.length,
          gradedCount: scored.length,
          pendingCount: pending,
          violationCount: violations,
          avgScore: scored.length ? Math.round(scored.reduce((a, i) => a + i.score, 0) / scored.length) : null,
          targetCount: target,
          percentDone: target ? Math.round((g.items.length / target) * 100) : null,
        };
      })
      .sort((a, b) => b.submittedCount - a.submittedCount);
  }, [currentData, targetCounts]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(g => g.title.toLowerCase().includes(term) || g.subject.toLowerCase().includes(term));
  }, [groups, searchTerm]);

  const openGroup = groups.find(g => g.key === openGroupKey) || null;

  const filteredGroupItems = useMemo(() => {
    if (!openGroup) return [];
    let data = openGroup.items;
    if (filterStatus === 'Pending') data = data.filter(item => !item.score || item.status === 'Pending');
    if (filterStatus === 'Dinilai') data = data.filter(item => item.score && item.status !== 'Pending');
    return data;
  }, [openGroup, filterStatus]);

  // ===== RENDER =====
  if (loading && tasks.length === 0) {
    return (
      <div style={s.center}>
        <div style={s.spinner}></div>
        <p style={{color:'#94a3b8',marginTop:12}}>Memuat data...</p>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin .8s linear infinite}`}</style>

      {/* HEADER */}
      <div style={s.header}>
        <div style={s.hLeft}>
          <div style={s.hIcon}><BarChart3 size={20} color="white"/></div>
          <div>
            <h2 style={s.hTitle}>Pemeriksaan Hasil Belajar</h2>
            <div style={s.hMeta}>
              {guruId && <span style={s.badge}><Hash size={10}/> {guruId}</span>}
              {kodeMapel && <span style={s.badge2}><Tag size={10}/> {kodeMapel}</span>}
              <span>{currentData.length} submission • {groups.length} tugas/kuis</span>
            </div>
          </div>
        </div>
        <div style={s.hRight}>
          <button onClick={handleRefresh} disabled={refreshing} style={s.btnR}>
            <RefreshCw size={16} className={refreshing?'spin':''}/>
          </button>
          <div style={s.searchBox}>
            <Search size={14} color="#94a3b8"/>
            <input placeholder="Cari judul tugas/kuis..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={s.searchIn}/>
            {searchTerm && <button onClick={()=>setSearchTerm('')} style={s.btnX}><X size={12}/></button>}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={s.stats}>
        {[
          {v:stats.totalTugas,l:'Total Tugas',c:'📝'},
          {v:stats.pendingTugas,l:'Perlu Dinilai',c:'⏳'},
          {v:stats.gradedTugas,l:'Sudah Dinilai',c:'✅'},
          {v:stats.totalKuis,l:'Total Kuis',c:'❓'},
          {v:stats.avgScore+'%',l:'Rata-rata',c:'⭐'},
        ].map((st,i)=>(
          <div key={i} style={s.statCard}>
            <span style={s.statV}>{st.v}</span>
            <span style={s.statL}>{st.c} {st.l}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={s.tabs}>
        <button onClick={()=>{setActiveTab('tugas'); setOpenGroupKey(null);}} style={s.tab(activeTab==='tugas')}><FileText size={14}/> Tugas ({tasks.length})</button>
        <button onClick={()=>{setActiveTab('kuis'); setOpenGroupKey(null);}} style={s.tab(activeTab==='kuis')}><HelpCircle size={14}/> Kuis ({quizzes.length})</button>
      </div>

      {/* ============================================================ */}
      {/* MODE A: DAFTAR CARD PER TUGAS/KUIS (default, gak dicampur lagi) */}
      {/* ============================================================ */}
      {!openGroup ? (
        filteredGroups.length === 0 ? (
          <div style={s.empty}>
            <BookOpen size={48} color="#cbd5e1"/>
            <h4>Belum ada data</h4>
            <p>{searchTerm?'Tidak ditemukan.':'Siswa belum mengirim tugas/kuis.'}</p>
          </div>
        ) : (
          <div style={s.groupGrid}>
            {filteredGroups.map(g => (
              <div key={g.key} style={s.groupCard} onClick={() => { setOpenGroupKey(g.key); setFilterStatus('Semua'); }}>
                <div style={s.groupCardTop}>
                  <span style={s.groupSubjectBadge}>{g.subject}</span>
                  {g.violationCount > 0 && (
                    <span style={s.groupViolationBadge}><AlertTriangle size={10}/> {g.violationCount} pelanggaran</span>
                  )}
                </div>
                <h4 style={s.groupTitle}>{g.title}</h4>

                {/* 🔥 Progres pengerjaan -- persentase siswa yang sudah mengerjakan */}
                <div style={s.progressWrap}>
                  <div style={s.progressLabelRow}>
                    <span style={{display:'flex',alignItems:'center',gap:4}}><Users size={11}/> {g.submittedCount}{g.targetCount != null ? ` / ${g.targetCount} siswa` : ' siswa mengerjakan'}</span>
                    {g.percentDone != null && <span style={{fontWeight:800,color: g.percentDone>=80?'#10b981':g.percentDone>=40?'#f59e0b':'#ef4444'}}>{g.percentDone}%</span>}
                  </div>
                  {g.percentDone != null && (
                    <div style={s.progressBarBg}>
                      <div style={{...s.progressBarFill, width:`${Math.min(g.percentDone,100)}%`, background: g.percentDone>=80?'#10b981':g.percentDone>=40?'#f59e0b':'#ef4444'}} />
                    </div>
                  )}
                </div>

                <div style={s.groupMetaRow}>
                  <span>⏳ {g.pendingCount} perlu dinilai</span>
                  {g.avgScore != null && <span>⭐ Rata-rata {g.avgScore}</span>}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // ============================================================
        // MODE B: DAFTAR SISWA UNTUK 1 TUGAS/KUIS YANG DIBUKA
        // ============================================================
        <div>
          <div style={s.groupDetailHeader}>
            <button onClick={() => setOpenGroupKey(null)} style={s.btnBackToGroups}><ArrowLeft size={14}/> Semua {activeTab === 'tugas' ? 'Tugas' : 'Kuis'}</button>
            <div style={{flex:1, minWidth:180}}>
              <h3 style={{margin:0, fontSize:15, fontWeight:800, color:'#1e293b'}}>{openGroup.title}</h3>
              <p style={{margin:'2px 0 0', fontSize:11, color:'#64748b'}}>
                {openGroup.subject} • {openGroup.submittedCount}{openGroup.targetCount != null ? ` dari ${openGroup.targetCount} siswa` : ' siswa'} sudah mengerjakan
                {openGroup.percentDone != null && ` (${openGroup.percentDone}%)`}
              </p>
            </div>
            <div style={s.filterActionsRow}>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={s.sel}>
                <option value="Semua">Semua Status</option>
                <option value="Pending">Perlu Dinilai</option>
                <option value="Dinilai">Sudah Dinilai</option>
              </select>
            </div>
          </div>

          <div style={s.tableWrap}>
            {filteredGroupItems.length === 0 ? (
              <div style={s.empty}>
                <BookOpen size={40} color="#cbd5e1"/>
                <p>Tidak ada siswa yang cocok dengan filter ini.</p>
              </div>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.thead}>
                      <th style={s.th}>Siswa</th>
                      <th style={s.th}>Waktu</th>
                      <th style={s.th}>{activeTab==='tugas'?'File':'Jawaban'}</th>
                      <th style={s.th}>Nilai</th>
                      <th style={s.th}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroupItems.map(item => {
                      let tStr = '-';
                      try {
                        if (item.submittedAt?.toDate) {
                          tStr = item.submittedAt.toDate().toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
                        } else if (item.submittedAt) {
                          const d = new Date(item.submittedAt);
                          if (!isNaN(d.getTime())) {
                            tStr = d.toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
                          }
                        }
                      } catch(e) { /* biarkan '-' */ }
                      
                      const sc = item.score;
                      const scColor = sc>=75?'#10b981':sc>=50?'#f59e0b':'#ef4444';
                      const coll = item.type==='tugas'?'jawaban_tugas':'jawaban_kuis';
                      
                      return (
                        <tr key={item.id} style={s.tr}>
                          <td style={s.td}>
                            <div style={s.stuCell}>
                              <div style={s.av}>{item.studentName?.charAt(0)||'S'}</div>
                              <div>
                                <strong>{item.studentName||'-'}</strong>
                                <div style={s.meta}>
                                  <span style={s.cls}>{item.studentClass||'-'}</span>
                                  {item.studentNim && <span style={s.nim}>#{item.studentNim}</span>}
                                  {(item.cheatViolationCount || 0) > 0 && (
                                    <span style={s.violationTag}><AlertTriangle size={9}/> {item.cheatViolationCount}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={s.td}>
                            <span style={{fontSize:11,color:'#64748b'}}><Clock size={10}/> {tStr}</span>
                          </td>
                          <td style={s.td}>
                            {item.type==='tugas' ? (
                              item.fileUrl ? (
                                <a href={item.fileUrl} target="_blank" rel="noreferrer" style={s.btnView}><Eye size={12}/> Lihat</a>
                              ) : <span style={{fontSize:10,color:'#94a3b8'}}>-</span>
                            ) : (
                              <span
                                style={{...s.quizBadge, cursor: item.details?.length ? 'pointer' : 'default', textDecoration: item.details?.length ? 'underline' : 'none'}}
                                onClick={() => item.details?.length && openDetail(item)}
                              >
                                ✅ {item.correctAnswers||0}/{item.totalQuestions||'?'} {item.details?.length ? '👁️' : ''}
                              </span>
                            )}
                          </td>
                          <td style={s.td}>
                            {editingScore===item.id ? (
                              <div style={{display:'flex',alignItems:'center',gap:4}}>
                                <input type="number" min="0" max="100" value={newScore} onChange={e=>setNewScore(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleUpdateScore(item.id,coll)} autoFocus style={s.scoreIn}/>
                                <button onClick={()=>handleUpdateScore(item.id,coll)} style={s.btnSave}><Save size={12}/></button>
                              </div>
                            ) : (
                              <div style={{display:'flex',alignItems:'center',gap:2,cursor:'pointer'}} onClick={()=>{setEditingScore(item.id);setNewScore(item.score?.toString()||'')}}>
                                <span style={{fontSize:15,fontWeight:800,color:scColor}}>{sc??'--'}</span>
                                <span style={{fontSize:9,color:'#cbd5e1'}}>/100</span>
                              </div>
                            )}
                          </td>
                          <td style={s.td}>
                            <div style={{display:'flex',gap:4}}>
                              {editingScore!==item.id && (
                                <button onClick={()=>{setEditingScore(item.id);setNewScore(item.score?.toString()||'')}} style={s.btnEdit}><Edit3 size={12}/></button>
                              )}
                              {item.type === 'kuis' && item.details?.length > 0 && (
                                <button
                                  onClick={() => generateAstroGemilangReport(item)}
                                  style={s.btnPdf}
                                  title="Unduh Laporan PDF (Astro Gemilang) — bisa dikirim ke orang tua"
                                >
                                  <Download size={12}/>
                                </button>
                              )}
                              <button onClick={()=>handleDelete(item.id,coll)} style={s.btnDel}><Trash2 size={12}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={s.footer}>
        <span>{groups.length} tugas/kuis • {currentData.length} total submission</span>
        <span>{guruName && `👨‍🏫 ${guruName}`}</span>
      </div>

      {/* ========================================================== */}
      {/* MODAL DETAIL JAWABAN KUIS — guru bisa cek per soal + bahas */}
      {/* ========================================================== */}
      {viewingDetail && (
        <div style={s.modalOverlay} onClick={() => setViewingDetail(null)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>{viewingDetail.studentName}</h3>
                <p style={s.modalSub}>{viewingDetail.modulTitle} — Nilai: {viewingDetail.score ?? '-'}/100 ({viewingDetail.correctAnswers}/{viewingDetail.totalQuestions} benar)</p>
                {loadingCanonicalOrder && (
                  <p style={{margin:'4px 0 0', fontSize:10, color:'#94a3b8'}}>⏳ Menyusun urutan soal asli...</p>
                )}
                {/* 🔥 Info deteksi kecurangan (Mode Ujian) — cuma tampil kalau
                    ada pelanggaran tercatat. Ini SINYAL buat guru menilai
                    sendiri, bukan vonis otomatis "curang".
                    Dipecah PER JENIS karena artinya beda-beda: "keluar
                    halaman" ≠ "pakai terjemahan otomatis". */}
                {viewingDetail.cheatViolationCount > 0 && (() => {
                  const daftar = viewingDetail.cheatViolations || [];
                  const jmlTerjemahan = daftar.filter(v => v.type === 'halaman_diterjemahkan_otomatis').length;
                  const jmlKeluar = viewingDetail.cheatViolationCount - jmlTerjemahan;
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {jmlKeluar > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fffbeb', padding: '3px 10px', borderRadius: 6 }}>
                          ⚠️ Keluar dari halaman kuis {jmlKeluar}x
                        </span>
                      )}
                      {jmlTerjemahan > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', background: '#fef2f2', padding: '3px 10px', borderRadius: 6 }}>
                          🌐 Pakai terjemahan otomatis browser
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => generateAstroGemilangReport(viewingDetail)}
                  style={s.btnPdfModal}
                  title="Unduh Laporan PDF (Astro Gemilang) — bisa dikirim ke orang tua"
                >
                  <Sparkles size={13}/> <Download size={13}/> PDF
                </button>
                <button onClick={() => setViewingDetail(null)} style={s.modalCloseBtn}><X size={18}/></button>
              </div>
            </div>
            <div style={s.modalBody}>
              {orderedDetailQuestions.map((q, idx) => {
                const partial = q.partsTotal ? (q.isCorrect ? null : (q.partsCorrect > 0 ? `🟡 ${q.partsCorrect}/${q.partsTotal} benar` : null)) : null;
                return (
                  <div key={q.id || idx} style={s.qCard(q.isCorrect)}>
                    <div style={s.qHeader}>
                      <span style={s.qNum}>Soal {idx + 1}</span>
                      <span style={s.qStatus(q.isCorrect)}>
                        {q.isCorrect ? '✅ Benar' : partial || '❌ Salah'}
                      </span>
                    </div>
                    <div style={s.qText}>{renderMath(q.question)}</div>
                    {/* 🔥 BARU: gambar soal SEBELUMNYA TIDAK PERNAH ditampilkan
                        di sini sama sekali -- soal yang punya gambar (upload
                        manual guru atau hasil generate Astro Gemilang: grafik
                        fungsi/bangun ruang/pola bentuk) jadi gak lengkap kalau
                        gurunya mau koreksi manual & gambarnya gak kelihatan. */}
                    {q.questionImage && (
                      <div style={{ margin: '8px 0', textAlign: 'center' }}>
                        <img src={q.questionImage} alt="Gambar soal" style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      </div>
                    )}
                    <div style={s.qAnswerRow}>
                      <span style={s.qAnswerLabelUser}>📝 Jawaban siswa:</span> {renderMath(describeAnswer(q, 'user'))}
                    </div>
                    <div style={s.qAnswerRow}>
                      <span style={s.qAnswerLabelCorrect}>🔑 Jawaban benar:</span> {renderMath(describeAnswer(q, 'correct'))}
                    </div>
                    {q.explanation && (
                      <div style={s.qExplanation}>
                        <span style={{fontWeight:700}}>💡 Pembahasan:</span> {renderMath(q.explanation)}
                      </div>
                    )}
                  </div>
                );
              })}
              {orderedDetailQuestions.length === 0 && (
                <p style={{textAlign:'center', color:'#94a3b8', padding: 20}}>Detail jawaban tidak tersedia untuk submission ini.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const s = {
  wrap: { width:'100%', maxWidth:1300, margin:'0 auto', padding:'16px 20px 40px', minHeight:'100vh', background:'#f8fafc' },
  center: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh' },
  spinner: { width:32, height:32, border:'3px solid #e2e8f0', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 1s linear infinite' },
  
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 },
  hLeft: { display:'flex', alignItems:'center', gap:12 },
  hIcon: { background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:10, borderRadius:14 },
  hTitle: { margin:0, fontSize:18, fontWeight:800, color:'#1e293b' },
  hMeta: { fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' },
  badge: { display:'inline-flex',alignItems:'center',gap:3,padding:'1px 8px',borderRadius:10,background:'#eef2ff',color:'#3b82f6',fontSize:9,fontWeight:600 },
  badge2: { display:'inline-flex',alignItems:'center',gap:3,padding:'1px 8px',borderRadius:10,background:'#ede9fe',color:'#8b5cf6',fontSize:9,fontWeight:600 },
  hRight: { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' },
  btnR: { background:'white',border:'1px solid #e2e8f0',padding:'8px 10px',borderRadius:10,cursor:'pointer',color:'#64748b' },
  searchBox: { display:'flex',alignItems:'center',gap:8,background:'white',padding:'8px 14px',borderRadius:10,border:'1px solid #e2e8f0' },
  searchIn: { border:'none',outline:'none',fontSize:13,width:180,background:'transparent' },
  btnX: { background:'none',border:'none',color:'#94a3b8',cursor:'pointer' },
  
  stats: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:10, marginBottom:16 },
  statCard: { background:'white', padding:'10px 14px', borderRadius:10, border:'1px solid #f1f5f9', textAlign:'center' },
  statV: { fontSize:18, fontWeight:900, color:'#1e293b', display:'block' },
  statL: { fontSize:9, color:'#94a3b8' },
  
  sel: { padding:'6px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:11,background:'white',cursor:'pointer' },
  
  tabs: { display:'flex',gap:8,marginBottom:16 },
  tab: (active) => ({ padding:'8px 16px',borderRadius:8,border:'none',fontWeight:700,fontSize:12,cursor:'pointer',background:active?'#6366f1':'#f1f5f9',color:active?'white':'#64748b',display:'flex',alignItems:'center',gap:4 }),

  // 🔥 CARD GRID PER TUGAS/KUIS
  groupGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 },
  groupCard: { background:'white', borderRadius:14, border:'1px solid #e2e8f0', padding:16, cursor:'pointer', transition:'0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.03)' },
  groupCardTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:6 },
  groupSubjectBadge: { fontSize:9, fontWeight:700, background:'#eef2ff', color:'#3b82f6', padding:'2px 8px', borderRadius:10 },
  groupViolationBadge: { fontSize:9, fontWeight:700, background:'#fef2f2', color:'#dc2626', padding:'2px 8px', borderRadius:10, display:'flex', alignItems:'center', gap:3 },
  groupTitle: { margin:'0 0 10px', fontSize:14, fontWeight:800, color:'#1e293b', lineHeight:1.3 },
  progressWrap: { marginBottom:10 },
  progressLabelRow: { display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'#64748b', marginBottom:4 },
  progressBarBg: { width:'100%', height:6, background:'#f1f5f9', borderRadius:4, overflow:'hidden' },
  progressBarFill: { height:'100%', borderRadius:4, transition:'width 0.3s ease' },
  groupMetaRow: { display:'flex', gap:12, fontSize:10, color:'#94a3b8', flexWrap:'wrap' },

  // Detail 1 grup
  groupDetailHeader: { display:'flex', alignItems:'center', gap:14, marginBottom:14, flexWrap:'wrap', background:'white', padding:'12px 16px', borderRadius:12, border:'1px solid #f1f5f9' },
  btnBackToGroups: { background:'#f1f5f9', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, color:'#475569', display:'flex', alignItems:'center', gap:4, flexShrink:0 },
  filterActionsRow: { display:'flex', gap:8, alignItems:'center' },
  
  tableWrap: { background:'white',borderRadius:16,border:'1px solid #e2e8f0',overflow:'hidden' },
  table: { width:'100%',borderCollapse:'collapse',minWidth:700 },
  thead: { background:'#f8fafc' },
  th: { padding:'10px 14px',fontSize:10,color:'#64748b',fontWeight:800,textTransform:'uppercase',borderBottom:'2px solid #f1f5f9',textAlign:'left',whiteSpace:'nowrap' },
  tr: { borderBottom:'1px solid #f1f5f9' },
  td: { padding:'10px 14px',fontSize:12,verticalAlign:'middle' },
  stuCell: { display:'flex',alignItems:'center',gap:8 },
  av: { width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0 },
  meta: { display:'flex',gap:4,alignItems:'center',flexWrap:'wrap' },
  cls: { fontSize:8,color:'#3b82f6',background:'#eef2ff',padding:'1px 6px',borderRadius:4,fontWeight:600 },
  nim: { fontSize:8,color:'#94a3b8',fontFamily:'monospace' },
  violationTag: { fontSize:8, fontWeight:700, color:'#dc2626', background:'#fef2f2', padding:'1px 6px', borderRadius:4, display:'inline-flex', alignItems:'center', gap:2 },
  btnView: { background:'#6366f1',color:'white',border:'none',padding:'4px 10px',borderRadius:6,cursor:'pointer',fontSize:9,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4,textDecoration:'none' },
  quizBadge: { fontSize:10,fontWeight:700,color:'#475569',background:'#f1f5f9',padding:'2px 6px',borderRadius:4 },
  scoreIn: { width:50,border:'2px solid #6366f1',borderRadius:4,textAlign:'center',fontWeight:'bold',fontSize:14,padding:2,outline:'none' },
  btnSave: { padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',background:'#10b981',color:'white' },
  btnEdit: { padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',background:'#f1f5f9',color:'#475569' },
  btnPdf: { padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',background:'#ede9fe',color:'#7c3aed' },
  btnPdfModal: { display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',color:'white',fontSize:11,fontWeight:700 },
  btnDel: { padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',background:'#fee2e2',color:'#ef4444' },
  empty: { textAlign:'center',padding:60,color:'#94a3b8' },
  footer: { display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontSize:10,color:'#94a3b8',flexWrap:'wrap',gap:8 },

  // Modal detail jawaban
  modalOverlay: { position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modalContent: { background:'white', borderRadius:16, width:'100%', maxWidth:700, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 50px rgba(0,0,0,0.3)' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'18px 20px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'white', zIndex:1 },
  modalTitle: { margin:0, fontSize:16, fontWeight:800, color:'#1e293b' },
  modalSub: { margin:'4px 0 0', fontSize:12, color:'#64748b' },
  modalCloseBtn: { background:'#f1f5f9', border:'none', borderRadius:8, padding:6, cursor:'pointer', flexShrink:0 },
  modalBody: { padding:20, display:'flex', flexDirection:'column', gap:12 },
  qCard: (correct) => ({ padding:14, borderRadius:10, border:`2px solid ${correct?'#10b981':'#ef4444'}`, background: correct?'#f0fdf4':'#fef2f2' }),
  qHeader: { display:'flex', justifyContent:'space-between', marginBottom:8 },
  qNum: { fontSize:11, fontWeight:700, color:'#64748b' },
  qStatus: (correct) => ({ fontSize:11, fontWeight:700, color: correct?'#10b981':'#ef4444' }),
  qText: { fontSize:13, fontWeight:600, color:'#1e293b', marginBottom:8, lineHeight:1.5 },
  qAnswerRow: { fontSize:12, color:'#334155', marginBottom:4, lineHeight:1.5 },
  qAnswerLabelUser: { fontWeight:700, color:'#475569' },
  qAnswerLabelCorrect: { fontWeight:700, color:'#166534' },
  qExplanation: { marginTop:8, padding:'8px 10px', background:'#eef2ff', borderRadius:8, fontSize:12, color:'#3730a3', lineHeight:1.6 },
};

export default CekTugasSiswa;