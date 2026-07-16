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
  List, Table, Grid, Hash, AlignLeft, CheckSquare, Square
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadElearningFile } from '../../../services/uploadService';
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
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modulId = searchParams.get('modulId');
  
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
  
  const [questions, setQuestions] = useState([{ 
    id: Date.now(), 
    type: 'multiple',
    q: '', 
    qImage: '',
    options: ['', '', '', ''], 
    optionImages: ['', '', '', ''],
    correct: 0, 
    correctAnswers: [],
    explanation: '',
    // 🔥 UNTUK TIPE TRUE/FALSE
    statements: [{ text: '', isTrue: true }],
    // 🔥 UNTUK TIPE READING
    readingText: '',
    subQuestions: [{ q: '', options: ['', '', '', ''], correct: 0 }],
    // 🔥 UNTUK TIPE SHORT ANSWER
    shortAnswer: '',
    // 🔥 UNTUK TIPE CAUSE EFFECT
    cause: '',
    effect: '',
    isCauseTrue: true,
    isEffectTrue: true
  }]);
  
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
  
  // Bulk import
  const [showImport, setShowImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  
  // Preview
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  
  // 🔥 EDITING SECTION
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [toast, setToast] = useState(null);
  
  // 🔥 Flag untuk AI Generate
  const [isAIGenerated, setIsAIGenerated] = useState(false);

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
              isEffectTrue: q.isEffectTrue !== undefined ? q.isEffectTrue : true
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

  // ============================================================
  // 🔥 CRUD SOAL
  // ============================================================
  const addQuestion = (type = 'multiple') => {
    const newQuestion = {
      id: Date.now(),
      type: type,
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
      isEffectTrue: true
    };
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
          border: isEditing ? `2px solid ${typeInfo.color}` : '1px solid #e2e8f0',
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
          {item.q.trim() || 'Klik untuk edit soal...'}
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
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 6 }}>
                  {item.options.map((opt, oIdx) => (
                    <div key={oIdx} onClick={() => updateQuestion(item.id, 'correct', oIdx)} style={{
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
                        placeholder={`Opsi ${String.fromCharCode(65+oIdx)}`} 
                        onChange={e => {
                          const newOpts = [...item.options]; newOpts[oIdx] = e.target.value;
                          updateQuestion(item.id, 'options', newOpts);
                        }}
                        onClick={e => e.stopPropagation()}
                        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, outline: 'none' }} 
                      />
                      {item.correct === oIdx && <CheckCircle size={14} color="#10b981"/>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {item.options.map((_, oIdx) => (
                    <label key={oIdx} style={{ 
                      display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 8, color: '#64748b'
                    }}>
                      <Upload size={10} /> Gambar {String.fromCharCode(65+oIdx)}
                      <input type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], item.id, 'option', oIdx); }} />
                    </label>
                  ))}
                </div>
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
                    onChange={e => updateQuestion(item.id, 'shortAnswer', e.target.value)}
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
                      onClick={() => updateQuestion(item.id, 'isCauseTrue', !item.isCauseTrue)}
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
                      onClick={() => updateQuestion(item.id, 'isEffectTrue', !item.isEffectTrue)}
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
  // 🔥 SAVE QUIZ
  // ============================================================
  const handleSaveQuiz = async () => {
    const valid = questions.filter(q => q.q.trim() || q.qImage);
    if (valid.length === 0) return alert("❌ Minimal 1 soal!");
    if (!quizTitle) return alert("❌ Judul kuis wajib diisi!");
    
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
      navigate(-1);
    } catch (err) { alert("❌ Gagal: " + err.message); }
    setLoading(false);
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

  // ============================================================
  // 🔥 RENDER PREVIEW
  // ============================================================
  // ... (sama seperti sebelumnya, disesuaikan dengan tipe baru)

  // ============================================================
  // 🔥 RENDER MAIN - TOMBOL TAMBAH SOAL DENGAN TYPE
  // ============================================================
  // Tambahkan tombol tambah soal dengan pilihan type

  // ... (rest of the code similar to previous)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? 12 : 20, paddingBottom: 100 }}>
      {/* ... Header, Identitas, Jadwal, Mode Kuis ... */}
      
      {/* 🔥 SECTION SOAL DENGAN TOMBOL TAMBAH PER TIPE */}
      <div style={{ background: 'white', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} /> 4. Soal Kuis ({questions.filter(q => q.q.trim() || q.qImage).length})
          </h4>
          <button onClick={() => setShowImport(true)} style={{ padding: '4px 10px', background: '#eef2ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#3730a3' }}>
            <Calculator size={12} /> Import
          </button>
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

      {/* ... Target Publish, Footer ... */}
    </div>
  );
};

export default ManageQuiz;