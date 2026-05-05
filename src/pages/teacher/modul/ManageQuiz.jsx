// src/pages/teacher/modul/ManageQuiz.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Plus, Trash2, CheckCircle, ArrowLeft, Save, Layout, FileText, X, Calculator, Target, BookOpen, Users, Send, Settings, Clock as ClockIcon, HelpCircle, Image, Upload, FileUp, Brain, Eye, Shuffle, Hash, Type, ListOrdered, ClipboardCheck, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadToDrive } from '../../../services/uploadService';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// ============================================================
// 🧠 SAYA: AI PARSER — DETEKSI JENIS SOAL DARI TEKS
// ============================================================
const AI_PARSER = {
  /**
   * Parse teks mentah dari PDF/Word menjadi array soal
   * @param {string} rawText - Teks hasil ekstrak PDF/Word
   * @returns {Array} Array soal yang sudah diparse
   */
  parseQuizFromText(rawText) {
    const questions = [];
    let currentId = Date.now();
    
    // Bersihkan teks
    let text = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // ==========================================
    // STRATEGI 1: Deteksi PILIHAN GANDA (A. B. C. D.)
    // ==========================================
    const pgPattern = /(\d+)[\.\)]\s+(.+?)(?=\n\s*A[\.\)\s])/gs;
    const pgMatches = [...text.matchAll(pgPattern)];
    
    if (pgMatches.length >= 2) {
      console.log('🧠 AI Detected: PILIHAN GANDA');
      for (const match of pgMatches) {
        const num = match[1];
        const questionText = match[2].trim();
        
        // Ambil 4 opsi setelah pertanyaan
        const afterQuestion = text.substring(match.index + match[0].length, match.index + match[0].length + 500);
        const optionPattern = /([A-D])[\.\)\s]+(.+?)(?=\n\s*[A-D][\.\)\s]|\n\s*\d+[\.\)\s]|$)/gs;
        const optionMatches = [...afterQuestion.matchAll(optionPattern)];
        
        if (optionMatches.length >= 2) {
          const options = ['', '', '', ''];
          optionMatches.slice(0, 4).forEach(opt => {
            const idx = opt[1].charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
            if (idx >= 0 && idx < 4) {
              options[idx] = opt[2].trim();
            }
          });
          
          questions.push({
            id: currentId + questions.length,
            q: questionText,
            qImage: '',
            options: options,
            optionImages: ['', '', '', ''],
            correct: 0,
            explanation: '',
            aiDetected: 'pilihan_ganda'
          });
        }
      }
      
      if (questions.length > 0) {
        console.log(`🧠 AI: ${questions.length} soal pilihan ganda terdeteksi`);
        return questions;
      }
    }
    
    // ==========================================
    // STRATEGI 2: Deteksi TRUE/FALSE
    // ==========================================
    const tfPattern = /(\d+)[\.\)]\s+(.+?)\n\s*(True|False|T|F)\s*\/\s*(True|False|T|F)/gi;
    const tfMatches = [...text.matchAll(tfPattern)];
    
    if (tfMatches.length >= 2) {
      console.log('🧠 AI Detected: TRUE/FALSE');
      for (const match of tfMatches) {
        const questionText = match[2].trim();
        questions.push({
          id: currentId + questions.length,
          q: questionText,
          qImage: '',
          options: ['True', 'False', '', ''],
          optionImages: ['', '', '', ''],
          correct: 0,
          explanation: '',
          aiDetected: 'true_false'
        });
      }
      return questions;
    }
    
    // ==========================================
    // STRATEGI 3: Deteksi URUTAN (Arrange/Sequence)
    // ==========================================
    const seqPattern = /(\d+)[\.\)]\s*Arrange.+?(?:\n\s*[A-E][\.\)\s].+?){3,}/gi;
    const seqMatches = [...text.matchAll(seqPattern)];
    
    if (seqMatches.length >= 1) {
      console.log('🧠 AI Detected: URUTAN/SEQUENCING');
      for (const match of seqMatches) {
        const fullBlock = match[0];
        const questionMatch = fullBlock.match(/Arrange[^:]+:?\s*(.+)/i);
        const questionText = questionMatch ? questionMatch[1].trim() : 'Arrange the following in correct order';
        
        const stepsPattern = /([A-E])[\.\)\s]+(.+?)(?=\n|$)/g;
        const steps = [...fullBlock.matchAll(stepsPattern)].map(s => s[2].trim());
        
        questions.push({
          id: currentId + questions.length,
          q: questionText,
          qImage: '',
          options: steps.slice(0, 5).concat(Array(5 - Math.min(steps.length, 5)).fill('')),
          optionImages: ['', '', '', ''],
          correct: 0,
          explanation: '',
          aiDetected: 'urutan'
        });
      }
      return questions;
    }
    
    // ==========================================
    // STRATEGI 4: Deteksi ESSAY (pertanyaan + tidak ada opsi)
    // ==========================================
    const essayPattern = /(\d+)[\.\)]\s*(Explain|Describe|What|Why|How|Discuss|Analyze|Compare|Write|Calculate|Find)[^?.\n]*[?.]/gi;
    const essayMatches = [...text.matchAll(essayPattern)];
    
    if (essayMatches.length >= 2) {
      console.log('🧠 AI Detected: ESSAY');
      for (const match of essayMatches) {
        const questionText = match[0].replace(/^\d+[\.\)]\s*/, '').trim();
        questions.push({
          id: currentId + questions.length,
          q: questionText,
          qImage: '',
          options: ['', '', '', ''],
          optionImages: ['', '', '', ''],
          correct: 0,
          explanation: '',
          aiDetected: 'essay'
        });
      }
      return questions;
    }
    
    // ==========================================
    // STRATEGI 5: Deteksi READING COMPREHENSION
    // (Text + beberapa pertanyaan pilihan ganda)
    // ==========================================
    const readingPattern = /(Text\s*for|Read\s*the|Passage|Paragraph).+?(?=\n\s*\d+[\.\)\s])/gi;
    const readingMatches = [...text.matchAll(readingPattern)];
    
    if (readingMatches.length >= 1) {
      console.log('🧠 AI Detected: READING COMPREHENSION');
      // Tetap parse sebagai pilihan ganda tapi tandai
      return this.parseAsMultipleChoice(text, currentId, 'reading');
    }
    
    // ==========================================
    // FALLBACK: Coba parse manual per nomor
    // ==========================================
    console.log('🧠 AI: Fallback — mencoba deteksi per baris');
    const lines = text.split('\n').filter(l => l.trim());
    const numberPattern = /^(\d+)[\.\)]\s+(.+)/;
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(numberPattern);
      if (match) {
        const questionNum = match[1];
        let questionText = match[2].trim();
        
        // Cek apakah ada opsi di baris berikutnya
        let options = ['', '', '', ''];
        let hasOptions = false;
        
        for (let j = 1; j <= 6 && i + j < lines.length; j++) {
          const optMatch = lines[i + j].match(/^([A-D])[\.\)\s]+(.+)/);
          if (optMatch) {
            const idx = optMatch[1].charCodeAt(0) - 65;
            if (idx >= 0 && idx < 4) {
              options[idx] = optMatch[2].trim();
              hasOptions = true;
            }
          }
        }
        
        // Gabungkan baris jika pertanyaan panjang
        if (!hasOptions && i + 1 < lines.length && !lines[i + 1].match(/^[A-D][\.\)]/)) {
          questionText += ' ' + lines[i + 1].trim();
        }
        
        questions.push({
          id: currentId + questions.length,
          q: questionText,
          qImage: '',
          options: options,
          optionImages: ['', '', '', ''],
          correct: 0,
          explanation: '',
          aiDetected: hasOptions ? 'pilihan_ganda' : 'essay'
        });
        
        // Skip baris opsi yang sudah diproses
        i += hasOptions ? 4 : 0;
      }
    }
    
    console.log(`🧠 AI: ${questions.length} soal terdeteksi (${[...new Set(questions.map(q => q.aiDetected))].join(', ')})`);
    return questions;
  },
  
  parseAsMultipleChoice(text, startId, type) {
    // Fallback untuk reading comprehension
    const questions = [];
    const lines = text.split('\n').filter(l => l.trim());
    const numberPattern = /^(\d+)[\.\)]\s+(.+)/;
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(numberPattern);
      if (match) {
        let options = ['', '', '', ''];
        for (let j = 1; j <= 4 && i + j < lines.length; j++) {
          const optMatch = lines[i + j].match(/^([A-D])[\.\)\s]+(.+)/);
          if (optMatch) {
            const idx = optMatch[1].charCodeAt(0) - 65;
            if (idx >= 0 && idx < 4) options[idx] = optMatch[2].trim();
          }
        }
        questions.push({
          id: startId + questions.length,
          q: match[2].trim(),
          qImage: '',
          options: options,
          optionImages: ['', '', '', ''],
          correct: 0,
          explanation: '',
          aiDetected: type
        });
      }
    }
    return questions;
  }
};

// ============================================================
// KOMPONEN ManageQuiz
// ============================================================
const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modulId = searchParams.get('modulId');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [aiParsing, setAiParsing] = useState(false); // ➕ State AI parsing
  const [aiResult, setAiResult] = useState(null); // ➕ Hasil AI
  
  // Data Quiz
  const [quizTitle, setQuizTitle] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState([{ 
    id: Date.now(), q: '', qImage: '', options: ['', '', '', ''], 
    optionImages: ['', '', '', ''], correct: 0, explanation: '' 
  }]);
  
  // FITUR LANJUTAN
  const [timeLimit, setTimeLimit] = useState(0);
  const [randomOrder, setRandomOrder] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [showExplanation, setShowExplanation] = useState(true);
  const [difficulty, setDifficulty] = useState('Sedang');
  
  // Target Publish
  const [publishTarget, setPublishTarget] = useState('modul');
  const [selectedModul, setSelectedModul] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedProgram, setSelectedProgram] = useState("Semua");
  
  // Data referensi
  const [modulList, setModulList] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjects, setSubjects] = useState(["Umum"]);
  
  // Bulk import
  const [showImport, setShowImport] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // ➕ Upload PDF/Word
  const fileInputRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parsedPreview, setParsedPreview] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchRefs = async () => {
      const snapModul = await getDocs(query(collection(db, "bimbel_modul"), orderBy("updatedAt", "desc")));
      setModulList(snapModul.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const snapSiswa = await getDocs(collection(db, "students"));
      const siswaData = snapSiswa.docs.map(d => d.data());
      const kelas = [...new Set(siswaData.map(s => s.kelasSekolah))].filter(Boolean).sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
      setAvailableClasses(kelas);
      
      const snapGuru = await getDocs(collection(db, "teachers"));
      const guruData = snapGuru.docs.map(d => d.data());
      const mapel = [...new Set(guruData.map(t => t.mapel).filter(Boolean))];
      if (mapel.length === 0) mapel.push("Umum");
      setSubjects(mapel.sort());
    };
    fetchRefs();
  }, []);

  useEffect(() => {
    if (modulId) {
      setPublishTarget('modul');
      setSelectedModul(modulId);
      const fetchQuiz = async () => {
        const snap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (snap.exists()) {
          const data = snap.data();
          setQuizTitle(data.title || "");
          setQuizSubject(data.subject || "");
          setDeadline(data.deadlineQuiz || "");
          setTimeLimit(data.timeLimit || 0);
          setRandomOrder(data.randomOrder || false);
          setMaxAttempts(data.maxAttempts || 1);
          setShowExplanation(data.showExplanation !== false);
          setDifficulty(data.difficulty || 'Sedang');
          if (data.quizData?.length > 0) {
            setQuestions(data.quizData.map((q, idx) => ({
              id: q.id || Date.now() + idx,
              q: q.question || '',
              qImage: q.questionImage || '',
              options: q.options || ['', '', '', ''],
              optionImages: q.optionImages || ['', '', '', ''],
              correct: q.correctAnswer || 0,
              explanation: q.explanation || ''
            })));
          }
        }
      };
      fetchQuiz();
    }
  }, [modulId]);

  // ============================================================
  // ➕ UPLOAD PDF/WORD & AI PARSING
  // ============================================================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadedFileName(file.name);
    setAiParsing(true);
    setShowUploadModal(true);
    
    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        // Ekstrak teks dari PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        extractedText = fullText;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Ekstrak teks dari DOCX
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else {
        alert("❌ Format tidak didukung. Gunakan PDF atau DOCX.");
        setAiParsing(false);
        setShowUploadModal(false);
        return;
      }
      
      // ➕ PANGGIL SAYA (AI PARSER)
      console.log('🧠 AI: Menganalisis teks...', { length: extractedText.length });
      const parsed = AI_PARSER.parseQuizFromText(extractedText);
      
      if (parsed.length === 0) {
        alert("⚠️ Tidak dapat mendeteksi soal. Pastikan format: 1. Pertanyaan (Enter) A. Opsi (Enter) B. Opsi...");
        setAiParsing(false);
        setShowUploadModal(false);
        return;
      }
      
      setParsedPreview(parsed);
      setAiResult({
        totalQuestions: parsed.length,
        types: [...new Set(parsed.map(q => q.aiDetected))]
      });
      setAiParsing(false);
      
    } catch (error) {
      console.error("Upload/Parse error:", error);
      alert("❌ Gagal memproses file: " + error.message);
      setAiParsing(false);
      setShowUploadModal(false);
    }
  };
  
  // ➕ Konfirmasi & masukkan hasil AI ke questions
  const handleConfirmAiResult = () => {
    if (parsedPreview.length === 0) return;
    
    setQuestions(prev => {
      // Jika masih soal kosong, ganti semua
      if (prev.length === 1 && prev[0].q === '' && !prev[0].qImage) {
        return parsedPreview;
      }
      // Jika sudah ada soal, tambahkan
      return [...prev, ...parsedPreview];
    });
    
    setShowUploadModal(false);
    setParsedPreview([]);
    setAiResult(null);
    setUploadedFileName("");
    alert(`✅ ${parsedPreview.length} soal berhasil ditambahkan! Silakan review & pilih jawaban benar.`);
  };

  // 🔥 FUNGSI UPLOAD GAMBAR (TIDAK BERUBAH)
  const handleImageUpload = async (file, questionId, targetType, optionIndex = null) => {
    if (!file) return;
    setUploading(true);
    setUploadTarget(`${questionId}-${targetType}-${optionIndex || ''}`);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (e) => {
        const result = await uploadToDrive(e.target.result, file.name, file.type);
        if (result.success) {
          setQuestions(prev => prev.map(q => {
            if (q.id === questionId) {
              if (targetType === 'question') return { ...q, qImage: result.downloadURL };
              else if (targetType === 'option' && optionIndex !== null) {
                const newOptImgs = [...q.optionImages];
                newOptImgs[optionIndex] = result.downloadURL;
                return { ...q, optionImages: newOptImgs };
              }
            }
            return q;
          }));
        } else { alert("❌ Gagal upload: " + result.error); }
        setUploading(false);
        setUploadTarget(null);
      };
      reader.onerror = () => { alert("❌ Gagal membaca file"); setUploading(false); setUploadTarget(null); };
    } catch (error) { alert("❌ Gagal upload: " + error.message); setUploading(false); setUploadTarget(null); }
  };

  const handleRemoveImage = (questionId, targetType, optionIndex = null) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        if (targetType === 'question') return { ...q, qImage: '' };
        else if (targetType === 'option' && optionIndex !== null) {
          const newOptImgs = [...q.optionImages];
          newOptImgs[optionIndex] = '';
          return { ...q, optionImages: newOptImgs };
        }
      }
      return q;
    }));
  };

  const renderMath = (text) => {
    if (!text) return null;
    const parts = text.split(/(\$.*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        try { return <InlineMath key={i} math={part.substring(1, part.length - 1)} />; }
        catch (e) { return <span key={i} style={{color:'red'}}>{part}</span>; }
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const blocks = bulkText.split(/\n(?=\d+[\.\$\s])/);
    const parsed = blocks.map((block, idx) => {
      const lines = block.trim().split('\n').filter(l => l.trim());
      if (lines.length === 0) return null;
      const qt = lines[0].replace(/^\d+[\.\$\s]*/, '').trim();
      const opts = lines.slice(1).filter(l => /^[A-E][\.\$\s]/i.test(l.trim())).map(o => o.replace(/^[A-E][\.\$\s]*/i, '').trim());
      while (opts.length < 4) opts.push("");
      return { id: Date.now() + idx, q: qt, qImage: '', options: opts.slice(0,4), optionImages: ['', '', '', ''], correct: 0, explanation: '' };
    }).filter(Boolean);
    if (parsed.length > 0) {
      setQuestions(prev => (prev.length === 1 && prev[0].q === "") ? parsed : [...prev, ...parsed]);
      setBulkText(""); setShowImport(false);
    }
  };

  const handleSaveQuiz = async () => {
    const valid = questions.filter(q => q.q.trim() || q.qImage);
    if (valid.length === 0) return alert("❌ Minimal 1 soal (teks atau gambar)!");
    if (!quizTitle) return alert("❌ Judul kuis wajib diisi!");
    setLoading(true);
    try {
      const quizPayload = {
        quizData: valid.map(q => ({ 
          id: q.id, question: q.q.trim(), questionImage: q.qImage || '',
          options: q.options, optionImages: q.optionImages || ['', '', '', ''],
          correctAnswer: q.correct, explanation: advancedMode ? (q.explanation || '') : ''
        })),
        totalQuestions: valid.length,
        deadlineQuiz: deadline || null,
        updatedAt: serverTimestamp()
      };
      if (advancedMode) {
        quizPayload.timeLimit = timeLimit;
        quizPayload.randomOrder = randomOrder;
        quizPayload.maxAttempts = maxAttempts;
        quizPayload.showExplanation = showExplanation;
        quizPayload.difficulty = difficulty;
      }
      if (publishTarget === 'modul') {
        if (!selectedModul) return alert("❌ Pilih modul tujuan!");
        await updateDoc(doc(db, "bimbel_modul", selectedModul), quizPayload);
        alert(`✅ Kuis disimpan ke modul!`);
      } else {
        await addDoc(collection(db, "bimbel_modul"), {
          title: quizTitle.toUpperCase(), subject: quizSubject || "Kuis",
          quizData: quizPayload.quizData, totalQuestions: quizPayload.totalQuestions,
          deadlineQuiz: deadline || null, type: 'kuis_mandiri',
          targetKategori: publishTarget === 'jenjang' ? selectedProgram : "Semua",
          targetKelas: publishTarget === 'jenjang' ? selectedKelas : "Semua",
          status: 'aktif',
          authorName: localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru",
          timeLimit: advancedMode ? timeLimit : null,
          randomOrder: advancedMode ? randomOrder : null,
          maxAttempts: advancedMode ? maxAttempts : null,
          showExplanation: advancedMode ? showExplanation : null,
          difficulty: advancedMode ? difficulty : null,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        alert(`✅ Kuis mandiri diterbitkan!`);
      }
      navigate(-1);
    } catch (err) { alert("❌ Gagal: " + err.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14}/> Kembali
        </button>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' }}>
          ❓ {modulId ? 'Edit Kuis Modul' : 'Buat Kuis Baru'}
        </h2>
        <button onClick={handleSaveQuiz} disabled={loading} style={{ background: '#673ab7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Send size={14}/> {loading ? '...' : 'Terbitkan'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* SIDEBAR KIRI */}
        <div style={{ width: isMobile ? '100%' : '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* ➕ UPLOAD PDF/WORD - FITUR BARU */}
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', color: 'white' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={16} /> 🧠 AI Smart Import
            </h4>
            <p style={{ fontSize: 10, opacity: 0.9, marginBottom: 10 }}>
              Upload PDF/Word — AI auto-deteksi soal pilihan ganda, essay, true/false, urutan.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px dashed rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <FileUp size={16} /> Upload PDF / DOCX
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.docx" 
              hidden 
              onChange={handleFileUpload}
            />
            <p style={{ fontSize: 8, opacity: 0.7, marginTop: 6, textAlign: 'center' }}>
              Supports: .pdf, .docx (Max 10MB)
            </p>
          </div>

          {/* IDENTITAS QUIZ */}
          <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b' }}><FileText size={14} /> Identitas Kuis</h4>
            <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Judul kuis..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }} />
            <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box', background: 'white' }}>
              <option value="">Mapel</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* TOGGLE MODE UJIAN */}
          <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748b' }}><Settings size={14} /> Mode Kuis</h4>
              <button onClick={() => setAdvancedMode(!advancedMode)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: advancedMode ? '#673ab7' : '#f1f5f9', color: advancedMode ? 'white' : '#64748b', border: 'none', cursor: 'pointer' }}>{advancedMode ? '🔒 Mode Ujian' : '📝 Mode Sederhana'}</button>
            </div>
            <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{advancedMode ? 'Mode Ujian: +Timer, Random Soal, Batas Pengulangan, Pembahasan' : 'Mode Sederhana: Kuis biasa tanpa pengaturan lanjutan'}</p>
          </div>

          {/* PENGATURAN LANJUTAN */}
          {advancedMode && (
            <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>⚙️ Pengaturan Ujian</h4>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>⏱️ Batas Waktu</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="number" min="0" max="180" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value))} style={{ width: 70, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11 }} /><span style={{ fontSize: 11, color: '#64748b' }}>menit (0 = tidak terbatas)</span></div></div>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>🎲 Pengaturan Soal</label><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}><input type="checkbox" checked={randomOrder} onChange={e => setRandomOrder(e.target.checked)} /> Acak urutan soal</label><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}><input type="checkbox" checked={showExplanation} onChange={e => setShowExplanation(e.target.checked)} /> Tampilkan pembahasan</label></div>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>🔄 Batas Pengulangan</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="number" min="0" max="10" value={maxAttempts} onChange={e => setMaxAttempts(parseInt(e.target.value))} style={{ width: 70, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11 }} /><span style={{ fontSize: 11, color: '#64748b' }}>kali (0 = tidak terbatas)</span></div></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>📊 Tingkat Kesulitan</label><select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, background: 'white' }}><option value="Mudah">🟢 Mudah</option><option value="Sedang">🟡 Sedang</option><option value="Sulit">🔴 Sulit</option></select></div>
            </div>
          )}

          {/* TARGET PUBLISH */}
          <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b' }}><Target size={14} /> Target Publish</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => setPublishTarget('mandiri')} style={{ padding: '8px 12px', borderRadius: 6, border: publishTarget === 'mandiri' ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: publishTarget === 'mandiri' ? '#eef2ff' : 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}><Send size={14} color={publishTarget === 'mandiri' ? '#3b82f6' : '#94a3b8'} /> Kuis Mandiri</button>
              <button onClick={() => setPublishTarget('modul')} style={{ padding: '8px 12px', borderRadius: 6, border: publishTarget === 'modul' ? '2px solid #10b981' : '1px solid #e2e8f0', background: publishTarget === 'modul' ? '#f0fdf4' : 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}><BookOpen size={14} color={publishTarget === 'modul' ? '#10b981' : '#94a3b8'} /> Tautkan ke Modul</button>
              <button onClick={() => setPublishTarget('jenjang')} style={{ padding: '8px 12px', borderRadius: 6, border: publishTarget === 'jenjang' ? '2px solid #f59e0b' : '1px solid #e2e8f0', background: publishTarget === 'jenjang' ? '#fffbeb' : 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}><Users size={14} color={publishTarget === 'jenjang' ? '#f59e0b' : '#94a3b8'} /> Tautkan ke Jenjang</button>
            </div>
            {publishTarget === 'modul' && (
              <select value={selectedModul} onChange={e => setSelectedModul(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #10b981', fontSize: 11, outline: 'none', marginTop: 8, background: 'white', boxSizing: 'border-box' }}><option value="">Pilih Modul...</option>{modulList.filter(m => !m.type || m.type !== 'kuis_mandiri').map(m => <option key={m.id} value={m.id}>{m.title || m.id}</option>)}</select>
            )}
            {publishTarget === 'jenjang' && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #f59e0b', fontSize: 11, background: 'white', boxSizing: 'border-box' }}><option value="Semua">Semua Program</option><option value="Reguler">📚 Reguler</option><option value="English">🗣️ English</option></select>
                <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #f59e0b', fontSize: 11, background: 'white', boxSizing: 'border-box' }}><option value="Semua">Semua Kelas</option>{availableClasses.map(k => <option key={k} value={k}>{k}</option>)}</select>
              </div>
            )}
          </div>

          <div style={{ background: '#f0fdf4', padding: 10, borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 600, color: '#166534' }}>
            📊 {questions.filter(q => q.q.trim() || q.qImage).length} soal aktif
          </div>

          <button onClick={() => setShowImport(true)} style={{ width: '100%', padding: 10, background: 'white', border: '1px solid #673ab7', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, color: '#673ab7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Calculator size={14} /> Bulk Import Teks
          </button>
        </div>

        {/* AREA SOAL */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {questions.map((item, idx) => (
            <div key={item.id} style={{ background: 'white', padding: isMobile ? 15 : 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#673ab7', background: '#f3e8ff', padding: '4px 10px', borderRadius: 6 }}>
                  SOAL {idx + 1}
                  {item.aiDetected && (
                    <span style={{ marginLeft: 6, fontSize: 8, background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: 4 }}>
                      {item.aiDetected === 'pilihan_ganda' ? '📝 PG' : 
                       item.aiDetected === 'essay' ? '📄 Essay' :
                       item.aiDetected === 'true_false' ? '✅ T/F' :
                       item.aiDetected === 'urutan' ? '🔢 Urutan' : ''}
                    </span>
                  )}
                </span>
                <button onClick={() => setQuestions(questions.filter(q => q.id !== item.id))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={14}/></button>
              </div>
              
              {/* UPLOAD GAMBAR SOAL */}
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#f3e8ff', border: '1px solid #673ab7', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#673ab7', opacity: uploading ? 0.6 : 1 }}>
                  <Image size={14} /> Upload Gambar Soal
                  <input type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], item.id, 'question'); }} disabled={uploading} />
                </label>
                {item.qImage && (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={item.qImage} alt="Soal" style={{ maxHeight: 80, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <button onClick={() => handleRemoveImage(item.id, 'question')} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}><X size={10}/></button>
                  </div>
                )}
                {uploading && uploadTarget === `${item.id}-question-` && <span style={{ fontSize: 10, color: '#673ab7' }}>⏳ Uploading...</span>}
              </div>

              <textarea value={item.q} onChange={e => setQuestions(questions.map(q => q.id === item.id ? {...q, q: e.target.value} : q))}
                placeholder="Tulis soal... ($ untuk rumus matematika)" style={{ width: '100%', minHeight: 55, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 6 }} />

              {item.q && <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, marginBottom: 10, fontSize: 12 }}>{renderMath(item.q)}</div>}

              {/* DETEKSI JENIS: Hanya tampilkan opsi untuk pilihan ganda & true/false */}
              {(item.aiDetected !== 'essay' && item.aiDetected !== 'urutan') && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 6 }}>
                  {item.options.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div onClick={() => setQuestions(questions.map(q => q.id === item.id ? {...q, correct: oIdx} : q))} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, cursor: 'pointer', border: `2px solid ${item.correct === oIdx ? '#10b981' : '#e2e8f0'}`, background: item.correct === oIdx ? '#f0fdf4' : 'white' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${item.correct === oIdx ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.correct === oIdx && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981' }}></div>}</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <input value={opt} placeholder={`Opsi ${String.fromCharCode(65+oIdx)}`} onChange={e => { const newOpts = [...item.options]; newOpts[oIdx] = e.target.value; setQuestions(questions.map(q => q.id === item.id ? {...q, options: newOpts} : q)); }} onClick={e => e.stopPropagation()} style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 500, fontSize: 12, outline: 'none' }} />
                          {item.optionImages?.[oIdx] && (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={item.optionImages[oIdx]} alt={`Opsi ${oIdx+1}`} style={{ maxHeight: 60, borderRadius: 6, border: '1px solid #e2e8f0' }} />
                              <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(item.id, 'option', oIdx); }} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer' }}><X size={9}/></button>
                            </div>
                          )}
                        </div>
                        {item.correct === oIdx && <CheckCircle size={12} color="#10b981"/>}
                      </div>
                      {opt && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 9, color: '#64748b', marginLeft: 28, opacity: uploading ? 0.6 : 1 }}>
                          <Upload size={10} /> Gambar
                          <input type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], item.id, 'option', oIdx); }} disabled={uploading} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Untuk ESSAY */}
              {item.aiDetected === 'essay' && (
                <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, border: '1px solid #fde68a', marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: '#b45309', fontWeight: 700 }}>📄 ESSAY — Siswa akan menulis jawaban panjang</span>
                </div>
              )}

              {/* Untuk URUTAN */}
              {item.aiDetected === 'urutan' && (
                <div style={{ background: '#e0e7ff', padding: 12, borderRadius: 8, border: '1px solid #c7d2fe', marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: '#3730a3', fontWeight: 700 }}>🔢 URUTAN — Siswa akan mengurutkan langkah</span>
                </div>
              )}

              {advancedMode && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><HelpCircle size={12} color="#673ab7" /><span style={{ fontSize: 10, fontWeight: 700, color: '#673ab7' }}>Pembahasan</span></div>
                  <textarea value={item.explanation || ''} onChange={e => setQuestions(questions.map(q => q.id === item.id ? {...q, explanation: e.target.value} : q))} placeholder="Tulis pembahasan..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} rows={2} />
                </div>
              )}
            </div>
          ))}

          <button onClick={() => setQuestions([...questions, { id: Date.now(), q: '', qImage: '', options: ['', '', '', ''], optionImages: ['', '', '', ''], correct: 0, explanation: '' }])} style={{ width: '100%', padding: 12, border: '2px dashed #cbd5e1', background: 'white', borderRadius: 10, fontWeight: 700, color: '#64748b', cursor: 'pointer', fontSize: 12 }}><Plus size={14}/> Tambah Soal</button>
        </div>
      </div>

      {/* MODAL BULK IMPORT TEKS */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 550, padding: 25, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><h3 style={{ margin: 0, fontSize: 16 }}>📥 Bulk Import Soal</h3><button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X/></button></div>
            <div style={{ background: '#eef2ff', padding: 10, borderRadius: 8, fontSize: 10, color: '#4338ca', marginBottom: 12 }}><b>Format:</b> 1. Soal (Enter) A. Opsi (Enter) B. Opsi...<br/>Gambar bisa ditambahkan setelah import.</div>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"1. Berapa $\\sqrt{64}$?\nA. 6\nB. 8\nC. 10\nD. 12"} style={{ width: '100%', height: 220, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'monospace', marginBottom: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            <button onClick={handleBulkImport} style={{ width: '100%', padding: 12, background: '#673ab7', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>PROSES</button>
          </div>
        </div>
      )}

      {/* ➕ MODAL AI PARSING RESULT */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 600, maxHeight: '85vh', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header Modal */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20, color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={20} /> 🧠 AI Smart Import
                </h3>
                <button onClick={() => { setShowUploadModal(false); setParsedPreview([]); setAiResult(null); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}><X size={18}/></button>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.9 }}>
                File: {uploadedFileName}
              </p>
            </div>

            {/* Loading atau Hasil */}
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {aiParsing ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 48, height: 48, border: '4px solid #e9d5ff', borderTop: '4px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
                  <p style={{ fontWeight: 700, color: '#4c1d95' }}>🧠 AI sedang menganalisis teks...</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>Mendeteksi jenis soal & struktur jawaban</p>
                </div>
              ) : aiResult ? (
                <>
                  {/* Statistik Hasil */}
                  <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{aiResult.totalQuestions}</div>
                        <div style={{ fontSize: 10, color: '#166534' }}>Soal Terdeteksi</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#4c1d95', fontWeight: 700 }}>
                          {aiResult.types.map(t => {
                            const labels = {
                              'pilihan_ganda': '📝 Pilihan Ganda',
                              'essay': '📄 Essay',
                              'true_false': '✅ True/False',
                              'urutan': '🔢 Urutan',
                              'reading': '📖 Reading'
                            };
                            return <div key={t}>{labels[t] || t}</div>;
                          })}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>Jenis Terdeteksi</div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Soal */}
                  <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                    {parsedPreview.slice(0, 10).map((q, i) => (
                      <div key={q.id} style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ background: '#673ab7', color: 'white', minWidth: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{i+1}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{q.q}</div>
                            {q.options.filter(o => o).length > 0 && (
                              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                                {q.options.filter(o => o).map((opt, oi) => (
                                  <span key={oi} style={{ marginRight: 12 }}>{String.fromCharCode(65+oi)}. {opt}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: 8, background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: 4 }}>
                            {q.aiDetected === 'pilihan_ganda' ? 'PG' : q.aiDetected?.substring(0,4)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {parsedPreview.length > 10 && (
                      <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', padding: 8 }}>
                        ...dan {parsedPreview.length - 10} soal lainnya
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            {!aiParsing && aiResult && (
              <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowUploadModal(false); setParsedPreview([]); setAiResult(null); }} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Batal</button>
                <button onClick={handleConfirmAiResult} style={{ flex: 2, padding: 12, background: '#673ab7', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CheckCircle size={16} /> Tambah {parsedPreview.length} Soal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ManageQuiz;