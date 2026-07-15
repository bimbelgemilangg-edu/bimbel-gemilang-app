// src/pages/teacher/modul/ManageQuiz.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { 
  Plus, Trash2, CheckCircle, ArrowLeft, Save, FileText, X, 
  Calculator, Target, BookOpen, Users, Send, Settings, 
  Clock as ClockIcon, HelpCircle, Image, Upload, Calendar, 
  CalendarDays, AlertCircle, Eye, EyeOff, Lock, Unlock,
  Layers, Type, FileUp, Video, Rocket, Sparkles
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadElearningFile } from '../../../services/uploadService';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modulId = searchParams.get('modulId');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  
  // 🔥 MODE KUIS - JELAS
  const [quizMode, setQuizMode] = useState('simple'); // 'simple' | 'advanced'
  
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
    q: '', 
    qImage: '',
    options: ['', '', '', ''], 
    optionImages: ['', '', '', ''],
    correct: 0, 
    explanation: '' 
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
  
  // 🔥 EDITING SECTION
  const [editingQuestion, setEditingQuestion] = useState(null);

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
          
          // 🔥 Deteksi mode dari data
          if (data.timeLimit > 0 || data.randomOrder || data.maxAttempts > 1) {
            setQuizMode('advanced');
          }
          
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

  const handleImageUpload = async (file, questionId, targetType, optionIndex = null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("❌ Gambar maksimal 10MB!");
      return;
    }
    
    setUploading(true);
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
      
      const qt = lines[0].replace(/^\d+[\.\$\s\)]*/, '').trim();
      const opts = lines.slice(1)
        .filter(l => /^[A-E][\.\$\s\)]/i.test(l.trim()))
        .map(o => o.replace(/^[A-E][\.\$\s\)]*/i, '').trim());
      
      while (opts.length < 4) opts.push("");
      
      return { 
        id: Date.now() + idx, 
        q: qt, 
        qImage: '', 
        options: opts.slice(0, 4), 
        optionImages: ['', '', '', ''], 
        correct: 0, 
        explanation: '' 
      };
    }).filter(Boolean);
    
    if (parsed.length > 0) {
      setQuestions(prev => (prev.length === 1 && prev[0].q === "") ? parsed : [...prev, ...parsed]);
      setBulkText("");
      setShowImport(false);
      alert(`✅ ${parsed.length} soal berhasil diimpor!`);
    } else {
      alert("⚠️ Format tidak terdeteksi.");
    }
  };

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

  const handlePreviewQuiz = () => {
    const previewAns = {};
    questions.forEach(q => {
      previewAns[q.id] = Math.floor(Math.random() * 4);
    });
    setPreviewAnswers(previewAns);
    setPreviewMode(true);
  };

  const handleClosePreview = () => {
    setPreviewMode(false);
    setPreviewAnswers({});
  };

  const getUserAnswer = (questionId) => {
    return previewAnswers[questionId];
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      q: '',
      qImage: '',
      options: ['', '', '', ''],
      optionImages: ['', '', '', ''],
      correct: 0,
      explanation: ''
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion.id);
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

  const renderQuestionEditor = (item, idx) => {
    const isEditing = editingQuestion === item.id;
    
    return (
      <div 
        key={item.id} 
        style={{
          background: 'white',
          padding: isMobile ? 14 : 18,
          borderRadius: 12,
          border: isEditing ? '2px solid #3b82f6' : '1px solid #e2e8f0',
          marginBottom: 10,
          transition: '0.2s',
          cursor: 'pointer'
        }}
        onClick={() => setEditingQuestion(item.id)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
            Soal {idx + 1} {item.q.trim() && '✅'}
          </span>
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
        
        {/* EDITOR YANG MUNCUL SAAT DIKLIK */}
        {isEditing && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            {/* Upload Gambar Soal */}
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f3e8ff', border: '1px solid #673ab7', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#673ab7' }}>
                <Image size={14} /> Upload Gambar
                <input type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], item.id, 'question'); }} />
              </label>
              {item.qImage && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={item.qImage} alt="Soal" style={{ maxHeight: 60, borderRadius: 6 }} />
                  <button onClick={() => handleRemoveImage(item.id, 'question')} style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={8}/></button>
                </div>
              )}
            </div>

            <textarea 
              value={item.q} 
              onChange={e => setQuestions(questions.map(q => q.id === item.id ? {...q, q: e.target.value} : q))}
              placeholder="Tulis soal... ($ untuk rumus matematika)"
              style={{ width: '100%', minHeight: 50, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 6 }} 
            />

            {item.q && <div style={{ padding: 6, background: '#f8fafc', borderRadius: 6, marginBottom: 10, fontSize: 12 }}>{renderMath(item.q)}</div>}

            {/* Opsi Jawaban */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 4 }}>
              {item.options.map((opt, oIdx) => (
                <div key={oIdx} onClick={() => setQuestions(questions.map(q => q.id === item.id ? {...q, correct: oIdx} : q))} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                  border: `2px solid ${item.correct === oIdx ? '#10b981' : '#e2e8f0'}`,
                  background: item.correct === oIdx ? '#f0fdf4' : 'white'
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${item.correct === oIdx ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.correct === oIdx && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>}
                  </div>
                  <input 
                    value={opt} 
                    placeholder={`Opsi ${String.fromCharCode(65+oIdx)}`} 
                    onChange={e => {
                      const newOpts = [...item.options]; newOpts[oIdx] = e.target.value;
                      setQuestions(questions.map(q => q.id === item.id ? {...q, options: newOpts} : q));
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 11, outline: 'none' }} 
                  />
                  {item.correct === oIdx && <CheckCircle size={12} color="#10b981"/>}
                </div>
              ))}
            </div>

            {/* Pembahasan */}
            {quizMode === 'advanced' && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <HelpCircle size={12} color="#673ab7" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#673ab7' }}>Pembahasan</span>
                </div>
                <textarea 
                  value={item.explanation || ''} 
                  onChange={e => setQuestions(questions.map(q => q.id === item.id ? {...q, explanation: e.target.value} : q))}
                  placeholder="Tulis pembahasan soal ini..."
                  style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none', resize: 'vertical' }}
                  rows={2}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
          question: q.q.trim(), 
          questionImage: q.qImage || '',
          options: q.options,
          optionImages: q.optionImages || ['', '', '', ''],
          correctAnswer: q.correct,
          explanation: quizMode === 'advanced' ? (q.explanation || '') : ''
        })),
        totalQuestions: valid.length,
        deadlineQuiz: deadline || null,
        useSchedule: useSchedule,
        quizOpenDate: useSchedule ? quizOpenDate : null,
        quizCloseDate: useSchedule ? quizCloseDate : null,
        updatedAt: serverTimestamp()
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
  // RENDER PREVIEW
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
          <button onClick={handleClosePreview} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
            <X size={14} /> Tutup
          </button>
        </div>

        {questions.filter(q => q.q.trim() || q.qImage).map((item, idx) => {
          const userAnswer = getUserAnswer(item.id);
          const isCorrect = userAnswer === item.correct;
          
          return (
            <div key={item.id} style={{ 
              background: 'white', 
              padding: isMobile ? 15 : 20, 
              borderRadius: 12, 
              border: `2px solid ${userAnswer !== undefined ? (isCorrect ? '#10b981' : '#ef4444') : '#e2e8f0'}`,
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

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
                {item.options.map((opt, oIdx) => {
                  const isSelected = userAnswer === oIdx;
                  const isCorrectAnswer = item.correct === oIdx;
                  
                  let bgColor = 'white', borderColor = '#e2e8f0';
                  if (isSelected && isCorrectAnswer) { bgColor = '#dcfce7'; borderColor = '#10b981'; }
                  else if (isSelected && !isCorrectAnswer) { bgColor = '#fee2e2'; borderColor = '#ef4444'; }
                  else if (isCorrectAnswer) { bgColor = '#f0fdf4'; borderColor = '#10b981'; }
                  
                  return (
                    <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: `2px solid ${borderColor}`, background: bgColor }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? (isCorrectAnswer ? '#10b981' : '#ef4444') : '#f1f5f9', color: isSelected ? 'white' : '#64748b', fontWeight: 700, fontSize: 10 }}>{String.fromCharCode(65 + oIdx)}</span>
                      <span style={{ fontSize: 12 }}>{opt}</span>
                      {isCorrectAnswer && <CheckCircle size={12} color="#10b981" style={{ marginLeft: 'auto' }} />}
                      {isSelected && !isCorrectAnswer && <X size={12} color="#ef4444" style={{ marginLeft: 'auto' }} />}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0', fontSize: 11 }}>
                <span style={{ color: '#64748b' }}>✅ Jawaban benar: </span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{item.options[item.correct] || `Opsi ${String.fromCharCode(65 + item.correct)}`}</span>
                {userAnswer !== undefined && (
                  <span style={{ marginLeft: 12, color: '#64748b' }}>📝 Jawaban Anda: <span style={{ fontWeight: 700, color: isCorrect ? '#10b981' : '#ef4444' }}>{item.options[userAnswer]}</span></span>
                )}
              </div>
            </div>
          );
        })}

        <div style={{ textAlign: 'center', padding: 16, background: '#f8fafc', borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: '#64748b' }}>💡 Hijau = Benar, Merah = Salah (simulasi jawaban acak)</p>
          <button onClick={handleClosePreview} style={{ padding: '8px 24px', background: '#673ab7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, marginTop: 8 }}>Tutup Preview</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER MAIN - VERTIKAL
  // ============================================================
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? 12 : 20, paddingBottom: 100 }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14}/> Kembali
        </button>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' }}>
          ❓ {modulId ? 'Edit Kuis Modul' : 'Buat Kuis Baru'}
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handlePreviewQuiz} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={14}/> Preview
          </button>
          <button onClick={handleSaveQuiz} disabled={loading} style={{ background: '#673ab7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Send size={14}/> {loading ? '...' : 'Terbitkan'}
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
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white' }}>
            <option value="">Pilih Mapel</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none' }} />
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
      {/* 3️⃣ MODE KUIS - TOMBOL JELAS */}
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

        {/* Pengaturan Lanjutan - Muncul jika mode ujian */}
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
          <button onClick={() => setShowImport(true)} style={{ padding: '4px 10px', background: '#eef2ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#3730a3' }}>
            <Calculator size={12} /> Import
          </button>
        </div>

        {questions.map((item, idx) => renderQuestionEditor(item, idx))}

        <button onClick={addQuestion} style={{
          width: '100%', padding: '12px', border: '2px dashed #cbd5e1', background: 'white', borderRadius: 10, fontWeight: 700, color: '#64748b', cursor: 'pointer', fontSize: 12, marginTop: 8
        }}>
          <Plus size={14}/> Tambah Soal
        </button>
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
      {/* BULK IMPORT MODAL */}
      {/* ========================================================== */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 550, padding: 25, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>📥 Bulk Import Soal</h3>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X/></button>
            </div>
            <div style={{ background: '#eef2ff', padding: 10, borderRadius: 8, fontSize: 10, color: '#4338ca', marginBottom: 12 }}>
              <b>Format:</b><br/>
              1. Pertanyaan<br/>
              A. Opsi A<br/>
              B. Opsi B<br/>
              C. Opsi C<br/>
              D. Opsi D
            </div>
            <textarea 
              value={bulkText} 
              onChange={e => setBulkText(e.target.value)}
              placeholder={"1. Berapa 2+2?\nA. 2\nB. 4\nC. 6\nD. 8"}
              style={{ width: '100%', height: 200, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'monospace', marginBottom: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} 
            />
            <button onClick={handleBulkImport} style={{ width: '100%', padding: 12, background: '#673ab7', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
              🚀 Proses & Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuiz;