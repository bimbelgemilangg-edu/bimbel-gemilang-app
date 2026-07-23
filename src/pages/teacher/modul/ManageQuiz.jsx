// src/pages/teacher/modul/ManageQuiz.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { 
  Plus, Trash2, CheckCircle, ArrowLeft, Save, FileText, X, 
  Calculator, Target, BookOpen, Users, Send, Settings, 
  Clock as ClockIcon, HelpCircle, Image, Upload, Calendar, 
  CalendarDays, AlertCircle, Eye, EyeOff, Lock, Unlock,
  Layers, Type, FileUp, Video, Rocket, Sparkles, Loader2,
  List, Table, Grid, Hash, AlignLeft, CheckSquare, Square,
  Edit3, FileQuestion, ArrowLeftRight, Undo2, Redo2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadElearningFile } from '../../../services/uploadService';
import SmartImportPanel from './SmartImportPanel';
import WordImportQuiz from './WordImportQuiz';
import AIGenerateQuiz from './AIGenerateQuiz';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

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
    return <span key={i}>{part}</span>;
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
  optionsAreImages: false,
  matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }]
});

// ============================================================
// MAIN COMPONENT
// ============================================================
const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modulId = searchParams.get('modulId');
  const sectionId = searchParams.get('sectionId');
  const isFromModul = !!modulId && !!sectionId;
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTarget, setUploadTarget] = useState(null);
  
  // 🔥 MODE KUIS
  const [quizMode, setQuizMode] = useState('simple');
  
  // Data Quiz
  const [quizTitle, setQuizTitle] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  
  // Jadwal
  const [quizOpenDate, setQuizOpenDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [quizCloseDate, setQuizCloseDate] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    now.setHours(23, 59, 0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [useSchedule, setUseSchedule] = useState(false);
  
  const [questions, setQuestions] = useState([emptyQuestion(0)]);
  
  // Fitur Lanjutan
  const [timeLimit, setTimeLimit] = useState(0);
  const [randomOrder, setRandomOrder] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [showExplanation, setShowExplanation] = useState(true);
  const [difficulty, setDifficulty] = useState('Sedang');
  
  // Target
  const [publishTarget, setPublishTarget] = useState('modul');
  const [selectedModul, setSelectedModul] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedProgram, setSelectedProgram] = useState("Semua");
  
  // Data referensi
  const [modulList, setModulList] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjects, setSubjects] = useState(["Umum"]);
  
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
          setUseSchedule(data.useSchedule || false);
          setQuizOpenDate(data.quizOpenDate || quizOpenDate);
          setQuizCloseDate(data.quizCloseDate || quizCloseDate);
          setIsAIGenerated(data.generatedByAI || false);
          
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
              needsManualAnswer: false
            })));
          }
        }
      };
      fetchQuiz();
    }
  }, [modulId]);

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
              return { ...q, qImage: url };
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

  const handleRemoveImage = (questionId, targetType, optionIndex = null) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        if (targetType === 'question') {
          return { ...q, qImage: '' };
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
        </div>
        
        {isEditing && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
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
                        <div key={oIdx} onClick={() => { updateQuestion(item.id, 'correct', oIdx); clearManualFlag(item.id); }} style={{
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
                    <div key={oIdx} 
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

              {/* Opsi Jawaban */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
                {item.options.map((opt, oIdx) => {
                  const isSelected = (() => {
                    if (item.type === 'multiselect') {
                      return userAnswer?.includes(oIdx) || false;
                    }
                    return userAnswer === oIdx;
                  })();
                  const isCorrectAnswer = (() => {
                    if (item.type === 'multiselect') {
                      return item.correctAnswers.includes(oIdx);
                    }
                    return oIdx === item.correct;
                  })();
                  
                  let bgColor = 'white', borderColor = '#e2e8f0';
                  if (showCorrectAnswers) {
                    if (isCorrectAnswer) { bgColor = '#dcfce7'; borderColor = '#10b981'; }
                    if (isSelected && !isCorrectAnswer) { bgColor = '#fee2e2'; borderColor = '#ef4444'; }
                  } else {
                    if (isSelected) { bgColor = '#eef2ff'; borderColor = '#3b82f6'; }
                  }
                  
                  return (
                    <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: `2px solid ${borderColor}`, background: bgColor }}>
                      <span style={{ 
                        width: 20, height: 20, borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        background: isSelected ? '#3b82f6' : '#f1f5f9', 
                        color: isSelected ? 'white' : '#64748b', 
                        fontWeight: 700, fontSize: 10 
                      }}>{String.fromCharCode(65 + oIdx)}</span>
                      <span style={{ fontSize: 12 }}>{renderMath(opt)}</span>
                      {showCorrectAnswers && isCorrectAnswer && <CheckCircle size={12} color="#10b981" style={{ marginLeft: 'auto' }} />}
                      {showCorrectAnswers && isSelected && !isCorrectAnswer && <X size={12} color="#ef4444" style={{ marginLeft: 'auto' }} />}
                    </div>
                  );
                })}
              </div>

              {showCorrectAnswers && (
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

    const stillNeedsReview = valid.filter(q => q.needsManualAnswer).length;
    if (stillNeedsReview > 0) {
      const lanjut = window.confirm(`⚠️ Masih ada ${stillNeedsReview} soal yang belum ditandai jawaban benarnya. Tetap simpan?`);
      if (!lanjut) return;
    }
    
    if (useSchedule) {
      const open = new Date(quizOpenDate);
      const close = new Date(quizCloseDate);
      if (open >= close) return alert("❌ Tanggal buka harus lebih awal dari tanggal tutup!");
      if (open < new Date()) return alert("❌ Tanggal buka tidak boleh kurang dari waktu sekarang!");
    }
    
    setLoading(true);
    try {
      const quizPayload = {
        quizData: valid.map(q => ({ 
          id: q.id, 
          type: q.type || 'multiple',
          question: q.q.trim(), 
          questionImage: q.qImage || '',
          options: q.options,
          optionImages: q.optionImages || ['', '', '', ''],
          correctAnswer: q.type === 'multiselect' ? undefined : q.correct,
          correctAnswers: q.type === 'multiselect' ? q.correctAnswers : [],
          explanation: quizMode === 'advanced' ? (q.explanation || '') : '',
          statements: q.type === 'truefalse' ? q.statements : undefined,
          readingText: q.type === 'reading' ? q.readingText : undefined,
          subQuestions: q.type === 'reading' ? q.subQuestions : undefined,
          shortAnswer: q.type === 'shortanswer' ? q.shortAnswer : undefined,
          cause: q.type === 'causeeffect' ? q.cause : undefined,
          effect: q.type === 'causeeffect' ? q.effect : undefined,
          isCauseTrue: q.type === 'causeeffect' ? q.isCauseTrue : undefined,
          isEffectTrue: q.type === 'causeeffect' ? q.isEffectTrue : undefined,
          // 🔥 FIX BUG: matchingPairs dulu tidak pernah ikut disimpan, jadi soal
          // Menjodohkan selalu kosong pas sampai ke siswa. Sekarang diikutkan.
          matchingPairs: q.type === 'matching' ? q.matchingPairs : undefined,
        })),
        totalQuestions: valid.length,
        deadlineQuiz: deadline || null,
        useSchedule: useSchedule,
        quizOpenDate: useSchedule ? quizOpenDate : null,
        quizCloseDate: useSchedule ? quizCloseDate : null,
        updatedAt: serverTimestamp(),
        generatedByAI: isAIGenerated,
        generatedAt: isAIGenerated ? serverTimestamp() : null
      };

      if (quizMode === 'advanced') {
        quizPayload.timeLimit = timeLimit;
        quizPayload.randomOrder = randomOrder;
        quizPayload.maxAttempts = maxAttempts;
        quizPayload.showExplanation = showExplanation;
        quizPayload.difficulty = difficulty;
      }

      // 🔥 JIKA DARI MODUL
      if (isFromModul) {
        const modulSnap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (modulSnap.exists()) {
          const modulData = modulSnap.data();
          const blocks = modulData.blocks || [];
          
          const sectionIndex = blocks.findIndex(b => 
            String(b.id) === String(sectionId) || b.id === sectionId
          );
          
          if (sectionIndex === -1) {
            return alert("❌ Section tidak ditemukan di modul!");
          }
          
          const section = blocks[sectionIndex];
          let quizId = section.quizId;
          
          if (quizId) {
            // Update quiz yang sudah ada
            await updateDoc(doc(db, "bimbel_modul", quizId), quizPayload);
          } else {
            // Buat quiz baru
            const newQuiz = await addDoc(collection(db, "bimbel_modul"), {
              ...quizPayload,
              title: quizTitle.toUpperCase(),
              subject: quizSubject || "Kuis",
              type: 'kuis_mandiri',
              status: 'aktif',
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
          navigate(-1);
          return;
        }
      }

      // 🔥 JIKA KUIS MANDIRI (bukan dari modul)
      if (publishTarget === 'modul') {
        if (!selectedModul) return alert("❌ Pilih modul tujuan!");
        const modulSnap = await getDoc(doc(db, "bimbel_modul", selectedModul));
        let modulSubject = '';
        if (modulSnap.exists()) modulSubject = modulSnap.data().subject || '';
        await updateDoc(doc(db, "bimbel_modul", selectedModul), {
          ...quizPayload,
          subject: modulSubject || quizSubject || "Kuis"
        });
        alert(`✅ Kuis disimpan ke modul!`);
      } else {
        const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
        await addDoc(collection(db, "bimbel_modul"), {
          title: quizTitle.toUpperCase(),
          subject: quizSubject || "Kuis",
          ...quizPayload,
          type: 'kuis_mandiri',
          targetKategori: publishTarget === 'jenjang' ? selectedProgram : "Semua",
          targetKelas: publishTarget === 'jenjang' ? selectedKelas : "Semua",
          status: 'aktif',
          guruId: saved.guruId || saved.id || '',
          kodeMapel: saved.kodeMapel || '',
          guruName: saved.nama || '',
          authorName: localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru",
          createdAt: serverTimestamp()
        });
        alert(`✅ Kuis mandiri diterbitkan!`);
      }
      localStorage.removeItem(draftKey);
      navigate(-1);
    } catch (err) { 
      alert("❌ Gagal: " + err.message); 
    }
    setLoading(false);
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)} style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white' }}>
            <option value="">Pilih Mapel</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none' }} />
        </div>
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
      <div style={{ background: 'white', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={18} /> 5. Target Publish
        </h4>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <button onClick={() => setPublishTarget('modul')} style={{ 
            padding: '8px 14px', 
            borderRadius: 8, 
            border: publishTarget === 'modul' ? '2px solid #10b981' : '1px solid #e2e8f0',
            background: publishTarget === 'modul' ? '#f0fdf4' : 'white',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <BookOpen size={14} color={publishTarget === 'modul' ? '#10b981' : '#94a3b8'} /> Tautkan ke Modul
          </button>
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
        </div>

        {publishTarget === 'modul' && (
          <select value={selectedModul} onChange={e => setSelectedModul(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #10b981', fontSize: 12, outline: 'none', background: 'white' }}>
            <option value="">Pilih Modul...</option>
            {modulList.filter(m => !m.type || m.type !== 'kuis_mandiri').map(m => <option key={m.id} value={m.id}>{m.title || m.id}</option>)}
          </select>
        )}

        {publishTarget === 'jenjang' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #f59e0b', fontSize: 12, outline: 'none', background: 'white' }}>
              <option value="Semua">Semua Program</option>
              <option value="Reguler">📚 Reguler</option>
              <option value="English">🗣️ English</option>
            </select>
            <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #f59e0b', fontSize: 12, outline: 'none', background: 'white' }}>
              <option value="Semua">Semua Kelas</option>
              {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}
      </div>

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