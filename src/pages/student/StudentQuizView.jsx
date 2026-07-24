// src/pages/student/StudentQuizView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, 
  HelpCircle, Send, User, Hash, Award, Timer, 
  BarChart3, TrendingUp, Shield, AlertTriangle,
  ChevronLeft, ChevronRight, BookOpen, Zap, RefreshCw,
  Eye, EyeOff, Calendar, Lock, Unlock, Flag, AlertTriangle as AlertTriangleIcon,
  FileQuestion, Table, CheckSquare, AlignLeft, Grid
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// ============================================================
// HELPERS
// ============================================================
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================================
// 🔥 RENDER MATH - SUPPORT KATEX
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
// MAIN COMPONENT
// ============================================================
const StudentQuizView = ({ modulId, studentData, onBack }) => {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🔥 FIX BUG KRITIS: sebelumnya React.useMemo untuk mengacak urutan kolom
  // "Menjodohkan" dipanggil DI DALAM percabangan if (question.type === 'matching')
  // pada fungsi renderQuestionOptions — artinya hook itu KADANG kepanggil,
  // KADANG enggak, tergantung tipe soal yang lagi ditampilkan. Ini melanggar
  // Rules of Hooks React (jumlah hook yang dipanggil harus selalu SAMA setiap
  // render), dan menyebabkan crash total (layar putih kosong) begitu siswa
  // pindah dari soal Menjodohkan ke tipe soal lain atau sebaliknya.
  // Sekarang hook ini dipindah ke level atas komponen, dipanggil TANPA SYARAT
  // di setiap render — aman sesuai aturan React.
  const currentQuestionForShuffle = questions[currentIndex];
  const shuffledMatchingPairs = React.useMemo(() => {
    if (!currentQuestionForShuffle || currentQuestionForShuffle.type !== 'matching') return [];
    const pairs = currentQuestionForShuffle.matchingPairs || [];
    const arr = pairs.map((p, i) => ({ text: p.right, originalIndex: i }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionForShuffle?.id]);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ nim: '', name: '', kelas: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showConfirm, setShowConfirm] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  
  // 🔥 STATE UNTUK PREVIEW JAWABAN
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [hasExistingAnswer, setHasExistingAnswer] = useState(false);
  const [existingResult, setExistingResult] = useState(null);

  // ===== RESPONSIVE =====
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ===== AMBIL DATA SISWA =====
  useEffect(() => {
    const nim = studentData?.studentId || studentData?.nim || studentData?.studentNim || 
                localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
    const name = studentData?.nama || localStorage.getItem('studentName') || 'Siswa';
    const kelas = studentData?.kelasSekolah || localStorage.getItem('studentKelas') || '';
    setStudentInfo({ nim, name, kelas });
  }, [studentData]);

  // ===== FETCH QUIZ =====
  useEffect(() => {
    if (!modulId) {
      setError('Modul tidak ditemukan');
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        const snap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (!snap.exists()) {
          setError('Modul tidak ditemukan');
          setLoading(false);
          return;
        }

        const data = snap.data();
        const quizDataRaw = data.quizData || [];
        
        if (quizDataRaw.length === 0) {
          setError('Belum ada kuis di modul ini');
          setLoading(false);
          return;
        }

        const nim = studentInfo.nim;
        
        if (nim) {
          const qJawaban = query(
            collection(db, "jawaban_kuis"),
            where("modulId", "==", modulId),
            where("studentNim", "==", nim)
          );
          const snapJawaban = await getDocs(qJawaban);
          const existing = snapJawaban.docs.length;
          setAttemptCount(existing);
          
          if (existing > 0) {
            const lastDoc = snapJawaban.docs[snapJawaban.docs.length - 1];
            const lastData = lastDoc.data();
            setExistingResult({
              score: lastData.score || 0,
              correctAnswers: lastData.correctAnswers || 0,
              totalQuestions: lastData.totalQuestions || 0,
              answers: lastData.answers || {},
              details: lastData.details || [],
              isAutoSubmit: lastData.isAutoSubmit || false,
              timeUsed: lastData.timeUsed || 0,
              submittedAt: lastData.submittedAt,
            });
            setHasExistingAnswer(true);
          }
          
          // 🔥 FIX BUG PENTING: sebelumnya di sini ada pengecekan "batas maksimal
          // percobaan" yang langsung nge-set `error` dan MENGHENTIKAN proses —
          // padahal beberapa baris di atas sudah nyiapin `existingResult` buat
          // nampilin layar review (skor + jawaban + pembahasan). Karena `error`
          // dicek LEBIH DULU daripada `hasExistingAnswer` di render, siswa yang
          // sudah pernah ngerjain SELALU kena layar blokir "Batas maksimal X
          // kali" dan gak pernah bisa lihat pembahasannya lagi — padahal itu
          // justru yang dimaksud guru: siswa gak bisa ngerjain ULANG, tapi
          // TETAP bisa buka lagi buat baca pembahasan kapan aja selama kuisnya
          // belum dihapus. Baris pengecekan itu sengaja dihapus di sini;
          // layar review (existingResult) sudah cukup jadi satu-satunya jalur.
        }

        const now = new Date();
        
        if (data.useSchedule) {
          if (data.quizOpenDate) {
            const open = new Date(data.quizOpenDate);
            if (now < open) {
              setError(`⏳ Kuis belum dibuka. Akan dibuka pada ${open.toLocaleString('id-ID')}`);
              setLoading(false);
              return;
            }
          }
          if (data.quizCloseDate) {
            const close = new Date(data.quizCloseDate);
            if (now > close) {
              setError(`⛔ Kuis sudah ditutup.`);
              setLoading(false);
              return;
            }
          }
        }

        // 🔥 Siapkan soal dengan semua tipe
        let questionsData = quizDataRaw.map((q, idx) => ({
          id: q.id || idx,
          type: q.type || 'multiple',
          question: q.question || q.q || `Soal ${idx + 1}`,
          questionImage: q.questionImage || q.qImage || '',
          options: q.options || ['', '', '', ''],
          optionImages: q.optionImages || ['', '', '', ''],
          correctAnswer: q.correctAnswer || q.correct || 0,
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
          // 🔥 FIX BUG: matchingPairs dulu tidak pernah dibaca dari database, jadi soal
          // Menjodohkan selalu tampil kosong ke siswa. Sekarang diikutkan.
          matchingPairs: q.matchingPairs && q.matchingPairs.length ? q.matchingPairs : [{ left: '', right: '' }, { left: '', right: '' }],
        }));

        if (data.randomOrder && !hasExistingAnswer) {
          questionsData = shuffleArray(questionsData);
        }

        const timeLimit = data.timeLimit || 0;
        setTimeLeft(timeLimit * 60);

        setQuizData({
          title: data.title || 'Kuis',
          subject: data.subject || 'Umum',
          totalQuestions: questionsData.length,
          timeLimit: timeLimit,
          maxAttempts: data.maxAttempts || 1,
          showExplanation: data.showExplanation !== false,
          difficulty: data.difficulty || 'Sedang',
          useSchedule: data.useSchedule || false,
          quizOpenDate: data.quizOpenDate || null,
          quizCloseDate: data.quizCloseDate || null,
          // 🔥 Disimpan supaya bisa didenormalisasi ke jawaban_kuis pas submit —
          // dipakai CekTugasSiswa.jsx untuk mencocokkan submission ke guru yang
          // benar berdasarkan ID, bukan cocok-cocokan nama mapel yang rapuh.
          guruId: data.guruId || '',
          kodeMapel: data.kodeMapel || '',
        });

        setQuestions(questionsData);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Gagal memuat kuis: ' + err.message);
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [modulId, studentInfo.nim, hasExistingAnswer]);

  // ===== TIMER =====
  useEffect(() => {
    if (!quizStarted || isSubmitted || timeLeft <= 0 || hasExistingAnswer) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, isSubmitted, hasExistingAnswer]);

  // ===== AUTO SUBMIT =====
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitted || hasExistingAnswer) return;
    alert('⏰ Waktu habis! Jawaban akan dikirim otomatis.');
    await handleSubmitQuiz(true);
  }, [isSubmitted, hasExistingAnswer]);

  // ===== HANDLE ANSWER =====
  const handleSelectAnswer = (questionId, optionIndex) => {
    if (isSubmitted || hasExistingAnswer) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  // ===== HANDLE FLAG (RAGU-RAGU) =====
  const handleFlagQuestion = (questionId) => {
    if (isSubmitted || hasExistingAnswer) return;
    setFlaggedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // ===== NAVIGASI SOAL =====
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getProgress = () => {
    return questions.length > 0 ? (getAnsweredCount() / questions.length) * 100 : 0;
  };

  // ===== CEK STATUS SOAL =====
  const getQuestionStatus = (questionId) => {
    if (answers[questionId] !== undefined) return 'answered';
    if (flaggedQuestions[questionId]) return 'flagged';
    return 'unanswered';
  };

  // ============================================================
  // 🔥 RENDER OPSI BERDASARKAN TIPE SOAL
  // ============================================================
  const renderQuestionOptions = (question) => {
    if (question.type === 'truefalse') {
      // 🔥 Tabel Benar/Salah
      return (
        <div style={{ marginTop: 12 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr auto auto',
            gap: 8,
            padding: '4px 0',
            fontSize: 11,
            fontWeight: 700,
            color: '#64748b',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <span>Pernyataan</span>
            <span>Benar</span>
            <span>Salah</span>
          </div>
          {question.statements.map((stmt, idx) => {
            const userAnswer = answers[question.id]?.[idx];
            return (
              <div key={idx} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto auto',
                gap: 8,
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, color: '#1e293b' }}>
                  {renderMath(stmt.text) || `Pernyataan ${idx + 1}`}
                </span>
                <button
                  onClick={() => {
                    if (isSubmitted || hasExistingAnswer) return;
                    const newAnswers = { ...answers };
                    if (!newAnswers[question.id]) newAnswers[question.id] = {};
                    newAnswers[question.id][idx] = true;
                    setAnswers(newAnswers);
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: userAnswer === true ? '2px solid #10b981' : '1px solid #e2e8f0',
                    background: userAnswer === true ? '#dcfce7' : 'white',
                    color: userAnswer === true ? '#166534' : '#64748b',
                    cursor: isSubmitted || hasExistingAnswer ? 'not-allowed' : 'pointer',
                    fontWeight: userAnswer === true ? 700 : 500,
                    fontSize: 11,
                    opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
                  }}
                  disabled={isSubmitted || hasExistingAnswer}
                >
                  ✅
                </button>
                <button
                  onClick={() => {
                    if (isSubmitted || hasExistingAnswer) return;
                    const newAnswers = { ...answers };
                    if (!newAnswers[question.id]) newAnswers[question.id] = {};
                    newAnswers[question.id][idx] = false;
                    setAnswers(newAnswers);
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: userAnswer === false ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    background: userAnswer === false ? '#fee2e2' : 'white',
                    color: userAnswer === false ? '#dc2626' : '#64748b',
                    cursor: isSubmitted || hasExistingAnswer ? 'not-allowed' : 'pointer',
                    fontWeight: userAnswer === false ? 700 : 500,
                    fontSize: 11,
                    opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
                  }}
                  disabled={isSubmitted || hasExistingAnswer}
                >
                  ❌
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    if (question.type === 'multiselect') {
      // 🔥 Pilih Lebih dari Satu
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {question.options.map((opt, idx) => {
            const isSelected = answers[question.id]?.includes(idx) || false;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (isSubmitted || hasExistingAnswer) return;
                  const current = answers[question.id] || [];
                  const newSelected = isSelected 
                    ? current.filter(i => i !== idx)
                    : [...current, idx];
                  setAnswers(prev => ({ ...prev, [question.id]: newSelected }));
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                  background: isSelected ? '#f3e8ff' : 'white',
                  cursor: isSubmitted || hasExistingAnswer ? 'not-allowed' : 'pointer',
                  opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
                }}
                disabled={isSubmitted || hasExistingAnswer}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  border: `2px solid ${isSelected ? '#8b5cf6' : '#cbd5e1'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? '#8b5cf6' : 'white'
                }}>
                  {isSelected && <CheckCircle size={12} color="white" />}
                </div>
                <span style={{ fontSize: 13 }}>{renderMath(opt) || `Opsi ${String.fromCharCode(65 + idx)}`}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.type === 'shortanswer') {
      // 🔥 Isian Singkat
      return (
        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => {
              if (isSubmitted || hasExistingAnswer) return;
              setAnswers(prev => ({ ...prev, [question.id]: e.target.value }));
            }}
            placeholder="Ketik jawaban Anda..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              outline: 'none',
              background: isSubmitted || hasExistingAnswer ? '#f8fafc' : 'white',
              opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
            }}
            disabled={isSubmitted || hasExistingAnswer}
          />
          <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
            💡 Gunakan $...$ untuk rumus matematika
          </p>
        </div>
      );
    }

    if (question.type === 'causeeffect') {
      // 🔥 Sebab Akibat
      return (
        <div style={{ marginTop: 12 }}>
          <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, marginBottom: 8 }}>
            <p style={{ fontSize: 13, margin: 0 }}>
              <strong>SEBAB:</strong> {renderMath(question.cause) || 'Tidak ada pernyataan'}
            </p>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>AKIBAT:</strong> {renderMath(question.effect) || 'Tidak ada pernyataan'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Pernyataan Sebab BENAR', field: 'cause' },
              { label: 'Pernyataan Akibat BENAR', field: 'effect' }
            ].map((item) => {
              const isSelected = answers[question.id]?.[item.field] !== undefined 
                ? answers[question.id][item.field] 
                : false;
              return (
                <div key={item.field}>
                  <button
                    onClick={() => {
                      if (isSubmitted || hasExistingAnswer) return;
                      const current = answers[question.id] || {};
                      current[item.field] = !current[item.field];
                      setAnswers(prev => ({ ...prev, [question.id]: current }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                      background: isSelected ? '#dcfce7' : 'white',
                      color: isSelected ? '#166534' : '#64748b',
                      cursor: isSubmitted || hasExistingAnswer ? 'not-allowed' : 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: 11,
                      opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
                    }}
                    disabled={isSubmitted || hasExistingAnswer}
                  >
                    {isSelected ? '✅' : '⬜'} {item.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (question.type === 'reading') {
      // 🔥 Membaca Teks - tampilkan sub questions
      return (
        <div style={{ marginTop: 12 }}>
          {question.subQuestions.map((sq, sqIdx) => (
            <div key={sqIdx} style={{ 
              background: '#f8fafc', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 8,
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                {renderMath(sq.q) || `Pertanyaan ${sqIdx + 1}`}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sq.options.map((opt, oIdx) => {
                  const isSelected = answers[question.id]?.[sqIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => {
                        if (isSubmitted || hasExistingAnswer) return;
                        const current = answers[question.id] || {};
                        current[sqIdx] = oIdx;
                        setAnswers(prev => ({ ...prev, [question.id]: current }));
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: isSelected ? '2px solid #673ab7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f3e8ff' : 'white',
                        cursor: isSubmitted || hasExistingAnswer ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
                      }}
                      disabled={isSubmitted || hasExistingAnswer}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isSelected ? '#673ab7' : '#f1f5f9',
                        color: isSelected ? 'white' : '#64748b',
                        fontWeight: 700, fontSize: 10
                      }}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{renderMath(opt) || `Opsi ${String.fromCharCode(65 + oIdx)}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (question.type === 'matching') {
      const pairs = question.matchingPairs || [];
      // 🔥 Dipakai dari hook di level atas komponen (shuffledMatchingPairs),
      // BUKAN dipanggil ulang di sini — lihat penjelasan fix di atas.
      const rightShuffled = shuffledMatchingPairs;

      const currentAnswers = answers[question.id] || {};

      return (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            {pairs.map((p, lIdx) => (
              <div key={lIdx} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                {lIdx + 1}. {renderMath(p.left)}
              </div>
            ))}
          </div>
          <div>
            {pairs.map((p, lIdx) => (
              <select
                key={lIdx}
                value={currentAnswers[lIdx] !== undefined ? currentAnswers[lIdx] : ''}
                onChange={(e) => {
                  if (isSubmitted || hasExistingAnswer) return;
                  const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                  const next = { ...currentAnswers, [lIdx]: val };
                  setAnswers(prev => ({ ...prev, [question.id]: next }));
                }}
                disabled={isSubmitted || hasExistingAnswer}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, marginBottom: 6, background: 'white' }}
              >
                <option value="">-- Pilih jodoh --</option>
                {rightShuffled.map((r, rIdx) => (
                  <option key={rIdx} value={r.originalIndex}>{r.text}</option>
                ))}
              </select>
            ))}
          </div>
        </div>
      );
    }

    if (question.optionsAreImages) {
      return (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          {question.options.map((_, idx) => {
            const isSelected = answers[question.id] === idx;
            const letter = String.fromCharCode(65 + idx);
            const imgUrl = question.optionImages?.[idx];
            if (!imgUrl) return null;
            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(question.id, idx)}
                disabled={isSubmitted || hasExistingAnswer}
                style={{
                  padding: 4, borderRadius: 8, cursor: isSubmitted || hasExistingAnswer ? 'not-allowed' : 'pointer',
                  border: isSelected ? '3px solid #673ab7' : '2px solid #e2e8f0',
                  background: isSelected ? '#f3e8ff' : 'white',
                  opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
                }}
              >
                <img src={imgUrl} alt={`Opsi ${letter}`} style={{ maxWidth: 130, maxHeight: 130, display: 'block' }} />
                <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', marginTop: 4, color: isSelected ? '#673ab7' : '#64748b' }}>
                  {letter} {isSelected && <CheckCircle size={12} style={{ display: 'inline', marginLeft: 2 }} />}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // 🔥 DEFAULT: Pilihan Ganda Biasa
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {question.options.map((option, idx) => {
          const isSelected = answers[question.id] === idx;
          const letter = String.fromCharCode(65 + idx);
          return (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(question.id, idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: isSelected ? '2px solid #673ab7' : '1px solid #e2e8f0',
                background: isSelected ? '#f3e8ff' : 'white',
                cursor: isSubmitted || hasExistingAnswer ? 'not-allowed' : 'pointer',
                fontSize: 13,
                color: isSelected ? '#673ab7' : '#1e293b',
                fontWeight: isSelected ? 700 : 500,
                opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
              }}
              disabled={isSubmitted || hasExistingAnswer}
            >
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected ? '#673ab7' : '#f1f5f9',
                color: isSelected ? 'white' : '#64748b',
                fontWeight: 700, fontSize: 12, flexShrink: 0
              }}>
                {letter}
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>{renderMath(option) || `Opsi ${letter}`}</span>
              {isSelected && <CheckCircle size={16} color="#673ab7" />}
            </button>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // 🔥 SUBMIT QUIZ
  // ============================================================
  const handleSubmitQuiz = async (isAuto = false) => {
    if (isSubmitted || hasExistingAnswer) return;

    if (!isAuto) {
      const unanswered = questions.filter(q => {
        if (q.type === 'truefalse' || q.type === 'reading') {
          return !answers[q.id] || Object.keys(answers[q.id]).length === 0;
        }
        return answers[q.id] === undefined;
      });
      if (unanswered.length > 0) {
        if (!window.confirm(`⚠️ Anda belum menjawab ${unanswered.length} soal. Yakin ingin mengirim?`)) {
          return;
        }
      }
    }

    setShowConfirm(false);
    setIsSubmitted(true);

    // 🔥 NILAI PROPORSIONAL untuk soal multi-bagian (Benar/Salah, Sebab-Akibat,
    // Menjodohkan, Membaca Teks): sebelumnya SEMUA-ATAU-TIDAK-SAMA-SEKALI —
    // misal soal Menjodohkan 4 pasang, benar cuma 1, itu dihitung SALAH TOTAL
    // (0 poin), sama kayak kalau semua salah. Sekarang dihitung proporsional:
    // benar 1 dari 4 = dapat 1/4 poin untuk soal itu, bukan 0.
    // Pilihan Ganda, Pilih Lebih dari Satu, dan Isian Singkat TETAP semua-atau-
    // tidak-sama-sekali (memang wajar untuk tipe itu, jawabannya cuma satu).
    let correctCount = 0; // jumlah soal yang BENAR SEMPURNA (buat statistik "Benar: X")
    let pointsEarned = 0; // total poin (boleh pecahan) buat hitung skor akhir
    const detailedResults = questions.map(q => {
      const userAnswer = answers[q.id];
      let isCorrect = false;
      let partialFraction = 0;
      let partsCorrect = null;
      let partsTotal = null;

      if (q.type === 'truefalse') {
        const total = q.statements?.length || 0;
        let benar = 0;
        if (typeof userAnswer === 'object' && userAnswer !== null) {
          q.statements.forEach((stmt, idx) => { if (userAnswer[idx] === stmt.isTrue) benar++; });
        }
        partsCorrect = benar; partsTotal = total;
        partialFraction = total > 0 ? benar / total : 0;
        isCorrect = total > 0 && benar === total;
      } else if (q.type === 'multiselect') {
        if (Array.isArray(userAnswer) && Array.isArray(q.correctAnswers)) {
          const sortedUser = [...userAnswer].sort();
          const sortedCorrect = [...q.correctAnswers].sort();
          isCorrect = sortedUser.length === sortedCorrect.length &&
                      sortedUser.every((val, i) => val === sortedCorrect[i]);
        }
        partialFraction = isCorrect ? 1 : 0;
      } else if (q.type === 'shortanswer') {
        isCorrect = userAnswer?.toLowerCase().trim() === q.shortAnswer?.toLowerCase().trim();
        partialFraction = isCorrect ? 1 : 0;
      } else if (q.type === 'causeeffect') {
        let benar = 0;
        if (userAnswer?.cause === q.isCauseTrue) benar++;
        if (userAnswer?.effect === q.isEffectTrue) benar++;
        partsCorrect = benar; partsTotal = 2;
        partialFraction = benar / 2;
        isCorrect = benar === 2;
      } else if (q.type === 'reading') {
        const total = q.subQuestions?.length || 0;
        let benar = 0;
        if (typeof userAnswer === 'object' && userAnswer !== null) {
          q.subQuestions.forEach((sq, idx) => { if (userAnswer[idx] === sq.correct) benar++; });
        }
        partsCorrect = benar; partsTotal = total;
        partialFraction = total > 0 ? benar / total : 0;
        isCorrect = total > 0 && benar === total;
      } else if (q.type === 'matching') {
        const pairs = q.matchingPairs || [];
        const total = pairs.length;
        let benar = 0;
        if (typeof userAnswer === 'object' && userAnswer !== null) {
          pairs.forEach((p, idx) => { if (userAnswer[idx] === idx) benar++; });
        }
        partsCorrect = benar; partsTotal = total;
        partialFraction = total > 0 ? benar / total : 0;
        isCorrect = total > 0 && benar === total;
      } else {
        // Pilihan Ganda (termasuk yang opsinya gambar)
        isCorrect = userAnswer === q.correctAnswer;
        partialFraction = isCorrect ? 1 : 0;
      }

      if (isCorrect) correctCount++;
      pointsEarned += partialFraction;

      return {
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        correctAnswers: q.correctAnswers,
        statements: q.statements,
        shortAnswer: q.shortAnswer,
        cause: q.cause,
        effect: q.effect,
        isCauseTrue: q.isCauseTrue,
        isEffectTrue: q.isEffectTrue,
        subQuestions: q.subQuestions,
        readingText: q.readingText,
        matchingPairs: q.matchingPairs,
        explanation: q.explanation || '',
        userAnswer,
        isCorrect,
        // 🔥 info nilai sebagian, dipakai buat nampilin "2 dari 4 benar" di layar hasil
        partialFraction,
        partsCorrect,
        partsTotal,
      };
    });

    const score = questions.length > 0 ? Math.round((pointsEarned / questions.length) * 100) : 0;

    try {
      const nim = studentInfo.nim;
      await addDoc(collection(db, "jawaban_kuis"), {
        modulId,
        modulTitle: quizData?.title || 'Kuis',
        studentNim: nim,
        studentName: studentInfo.name,
        studentClass: studentInfo.kelas,
        subject: quizData?.subject || 'Umum',
        // 🔥 FIX: guruId & kodeMapel didenormalisasi dari dokumen kuis, supaya
        // "Cek Tugas Siswa" bisa cocokin submission ke guru yang benar pakai ID
        // (akurat), bukan cocok-cocokan nama mapel (rapuh, gampang meleset).
        guruId: quizData?.guruId || '',
        kodeMapel: quizData?.kodeMapel || '',
        answers: answers,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        score: score,
        details: detailedResults,
        timeUsed: (quizData?.timeLimit || 0) * 60 - timeLeft,
        isAutoSubmit: isAuto,
        submittedAt: serverTimestamp(),
        status: "Dinilai"
      });

      // 🔥 FIX BUG: sebelumnya `results` cuma di-set tapi TIDAK PERNAH ada
      // bagian render yang menampilkannya — jadi siswa tetap nyangkut di
      // layar soal (yang sekarang disabled) tanpa pernah lihat nilai/jawaban.
      // Sekarang pakai jalur yang SAMA dengan layar "sudah pernah mengerjakan"
      // (existingResult + hasExistingAnswer) yang memang sudah punya tampilan
      // lengkap skor + review jawaban — jadi begitu submit sukses, langsung
      // pindah ke layar itu.
      setExistingResult({
        score,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        details: detailedResults,
        isAutoSubmit: isAuto,
        timeUsed: (quizData?.timeLimit || 0) * 60 - timeLeft,
        submittedAt: new Date(),
      });
      setHasExistingAnswer(true);

      setResults({
        correctCount,
        totalQuestions: questions.length,
        score,
        details: detailedResults,
        isAuto,
      });

    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('❌ Gagal menyimpan jawaban: ' + err.message);
      setIsSubmitted(false);
    }
  };

  // ===== START QUIZ =====
  const handleStartQuiz = () => {
    if (attemptCount > 0 && quizData?.maxAttempts > 1) {
      if (!window.confirm(`⚠️ Anda sudah mengerjakan ${attemptCount} kali. Batas maksimal ${quizData.maxAttempts} kali. Lanjutkan?`)) {
        return;
      }
    }
    setQuizStarted(true);
  };

  // ===== BACK =====
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // ============================================================
  // RENDER - LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Memuat kuis...</p>
      </div>
    );
  }

  // ============================================================
  // RENDER - ERROR
  // ============================================================
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <h2 style={styles.errorTitle}>⚠️ {error}</h2>
        <button onClick={handleBack} style={styles.backButton}>
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    );
  }

  // ============================================================
  // RENDER - SUDAH PERNAH MENGERJAKAN (PREVIEW MODE)
  // ============================================================
  if (hasExistingAnswer && existingResult) {
    const { score, correctAnswers, totalQuestions, details, isAutoSubmit } = existingResult;
    const isPassed = score >= 70;

    return (
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <div style={styles.resultIcon(isPassed)}>
              {isPassed ? <Award size={48} color="white" /> : <AlertCircle size={48} color="white" />}
            </div>
            <h2 style={styles.resultTitle(isPassed)}>
              {isPassed ? '🎉 Selamat!' : '💪 Terus Belajar!'}
            </h2>
            <p style={styles.resultSubtitle}>
              Anda telah mengerjakan kuis ini pada{' '}
              {existingResult.submittedAt?.toDate 
                ? existingResult.submittedAt.toDate().toLocaleString('id-ID')
                : existingResult.submittedAt instanceof Date
                  ? existingResult.submittedAt.toLocaleString('id-ID')
                  : 'barusan'}
            </p>
            {isAutoSubmit && (
              <p style={{ color: '#f59e0b', fontSize: 13, marginTop: 4 }}>
                ⏰ Dikirim otomatis karena waktu habis
              </p>
            )}
          </div>

          <div style={styles.resultScore}>
            <div style={styles.scoreCircle}>
              <span style={styles.scoreValue}>{score}</span>
              <span style={styles.scoreLabel}>Nilai</span>
            </div>
            <div style={styles.scoreDetails}>
              <div style={styles.scoreDetailItem}>
                <CheckCircle size={16} color="#10b981" />
                <span>Benar: {correctAnswers}</span>
              </div>
              <div style={styles.scoreDetailItem}>
                <XCircle size={16} color="#ef4444" />
                <span>Salah: {totalQuestions - correctAnswers}</span>
              </div>
              <div style={styles.scoreDetailItem}>
                <HelpCircle size={16} color="#3b82f6" />
                <span>Total: {totalQuestions}</span>
              </div>
            </div>
          </div>

          <div style={styles.actionButtons}>
            <button 
              onClick={() => setShowAllAnswers(!showAllAnswers)}
              style={styles.btnToggleAnswers}
            >
              {showAllAnswers ? (
                <><EyeOff size={16} /> Sembunyikan Jawaban</>
              ) : (
                <><Eye size={16} /> Lihat Semua Jawaban & Pembahasan</>
              )}
            </button>
          </div>

          {showAllAnswers && details && (
            <div style={styles.allAnswersSection}>
              <h4 style={styles.answersTitle}>📋 Daftar Jawaban & Pembahasan</h4>
              {details.map((q, idx) => {
                const isCorrect = q.isCorrect;
                const hasPartial = q.partsTotal !== null && q.partsTotal !== undefined && q.partsTotal > 0;
                return (
                  <div key={q.id} style={styles.answerItem(isCorrect)}>
                    <div style={styles.answerHeader}>
                      <span style={styles.answerNumber}>Soal {idx + 1}</span>
                      <span style={styles.answerStatus(isCorrect)}>
                        {isCorrect
                          ? '✅ Benar'
                          : hasPartial && q.partsCorrect > 0
                            ? `🟡 ${q.partsCorrect} dari ${q.partsTotal} benar`
                            : '❌ Salah'}
                      </span>
                    </div>
                    
                    <div style={styles.answerQuestion}>{renderMath(q.question)}</div>
                    
                    <div style={styles.answerOptions}>
                      {q.options.map((opt, oIdx) => {
                        let isCorrectAnswer = false;
                        let isUserAnswer = false;
                        
                        if (q.type === 'multiselect') {
                          isCorrectAnswer = q.correctAnswers.includes(oIdx);
                          isUserAnswer = q.userAnswer?.includes(oIdx) || false;
                        } else if (q.type === 'truefalse') {
                          // Handle truefalse di detail
                          return null;
                        } else {
                          isCorrectAnswer = oIdx === q.correctAnswer;
                          isUserAnswer = q.userAnswer === oIdx;
                        }
                        
                        let bgColor = 'transparent';
                        let textColor = '#1e293b';
                        
                        if (isCorrectAnswer) {
                          bgColor = '#dcfce7';
                          textColor = '#166534';
                        }
                        if (isUserAnswer && !isCorrectAnswer) {
                          bgColor = '#fee2e2';
                          textColor = '#dc2626';
                        }
                        if (isUserAnswer && isCorrectAnswer) {
                          bgColor = '#dcfce7';
                          textColor = '#166534';
                        }
                        
                        return (
                          <div key={oIdx} style={{...styles.optionRow, background: bgColor, color: textColor}}>
                            <span style={styles.optionLabel}>{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{renderMath(opt) || `Opsi ${String.fromCharCode(65 + oIdx)}`}</span>
                            {isCorrectAnswer && <CheckCircle size={14} color="#10b981" style={{marginLeft: 'auto'}} />}
                            {isUserAnswer && !isCorrectAnswer && <XCircle size={14} color="#dc2626" style={{marginLeft: 'auto'}} />}
                          </div>
                        );
                      })}
                    </div>
                    
                    {q.userAnswer !== undefined && (
                      <div style={styles.answerUser}>
                        <span>📝 Jawaban Anda: </span>
                        <span style={{ fontWeight: 'bold', color: isCorrect ? '#10b981' : '#dc2626' }}>
                          {q.type === 'shortanswer' 
                            ? q.userAnswer || 'Tidak dijawab'
                            : q.type === 'multiselect' 
                              ? (q.userAnswer || []).map(i => q.options[i]).join(', ') || 'Tidak dijawab'
                              : q.type === 'truefalse'
                                ? 'Lihat tabel di atas'
                                : q.options[q.userAnswer] || 'Tidak dijawab'}
                        </span>
                      </div>
                    )}
                    
                    {q.explanation && (
                      <div style={styles.answerExplanation}>
                        💡 <span style={{ fontWeight: 600 }}>Pembahasan:</span> {renderMath(q.explanation)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={styles.resultFooter}>
            <button onClick={handleBack} style={styles.btnHome}>
              🏠 Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - QUIZ NOT STARTED
  // ============================================================
  if (!quizStarted) {
    let statusText = '';
    let statusColor = '#10b981';
    let statusIcon = <Unlock size={16} color="#10b981" />;
    
    if (quizData?.useSchedule) {
      const now = new Date();
      const open = new Date(quizData.quizOpenDate);
      const close = new Date(quizData.quizCloseDate);
      
      if (now < open) {
        statusText = `🔒 Belum Dibuka (${open.toLocaleString('id-ID')})`;
        statusColor = '#f59e0b';
        statusIcon = <Lock size={16} color="#f59e0b" />;
      } else if (now > close) {
        statusText = '⛔ Kuis Ditutup';
        statusColor = '#ef4444';
        statusIcon = <Lock size={16} color="#ef4444" />;
      } else {
        statusText = '✅ Kuis Aktif';
        statusColor = '#10b981';
        statusIcon = <Unlock size={16} color="#10b981" />;
      }
    }

    return (
      <div style={styles.container}>
        <div style={styles.startCard}>
          <div style={styles.startHeader}>
            <div style={styles.startIcon}>❓</div>
            <h2 style={styles.startTitle}>{quizData?.title || 'Kuis'}</h2>
            <p style={styles.startSubject}>{quizData?.subject || 'Umum'}</p>
            
            {quizData?.useSchedule && (
              <div style={{...styles.quizStatusBadge, borderColor: statusColor, color: statusColor}}>
                {statusIcon} {statusText}
              </div>
            )}
          </div>

          <div style={styles.startInfo}>
            <div style={styles.startInfoItem}>
              <BookOpen size={18} color="#3b82f6" />
              <span>{quizData?.totalQuestions || 0} Soal</span>
            </div>
            <div style={styles.startInfoItem}>
              <Timer size={18} color="#f59e0b" />
              <span>{quizData?.timeLimit > 0 ? `${quizData.timeLimit} Menit` : 'Tanpa Batas'}</span>
            </div>
            <div style={styles.startInfoItem}>
              <Award size={18} color="#8b5cf6" />
              <span>Tingkat {quizData?.difficulty || 'Sedang'}</span>
            </div>
            <div style={styles.startInfoItem}>
              <Shield size={18} color="#10b981" />
              <span>Maks {quizData?.maxAttempts || 1}x</span>
            </div>
            {attemptCount > 0 && (
              <div style={{...styles.startInfoItem, background: '#fef3c7', borderColor: '#f59e0b'}}>
                <AlertCircle size={18} color="#f59e0b" />
                <span>Sudah {attemptCount} kali dikerjakan</span>
              </div>
            )}
          </div>

          <div style={styles.startRules}>
            <h4 style={styles.rulesTitle}>📋 Aturan Pengerjaan:</h4>
            <ul style={styles.rulesList}>
              <li>Baca soal dengan teliti sebelum menjawab</li>
              <li>Pilih jawaban yang paling benar</li>
              {quizData?.timeLimit > 0 && (
                <li>⏰ Waktu pengerjaan: {quizData.timeLimit} menit</li>
              )}
              {quizData?.maxAttempts > 1 ? (
                <li>🔄 Bisa dikerjakan {quizData.maxAttempts} kali</li>
              ) : (
                <li>🔒 Hanya bisa dikerjakan 1 kali</li>
              )}
              <li>📖 Setelah selesai, Anda bisa melihat jawaban & pembahasan</li>
              <li>🚩 Tandai soal yang ragu-ragu dengan tombol bendera</li>
              {quizData?.randomOrder && <li>🎲 Soal diacak untuk setiap siswa</li>}
            </ul>
          </div>

          <div style={styles.startFooter}>
            <button onClick={handleBack} style={styles.btnCancel}>Batal</button>
            <button 
              onClick={handleStartQuiz} 
              style={{
                ...styles.btnStart,
                opacity: quizData?.useSchedule && new Date() > new Date(quizData.quizCloseDate) ? 0.5 : 1,
                cursor: quizData?.useSchedule && new Date() > new Date(quizData.quizCloseDate) ? 'not-allowed' : 'pointer'
              }}
              disabled={quizData?.useSchedule && new Date() > new Date(quizData.quizCloseDate)}
            >
              <Zap size={16} /> Mulai Kuis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - QUIZ ACTIVE
  // ============================================================
  const currentQuestion = questions[currentIndex];
  const progress = getProgress();
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const questionStatus = getQuestionStatus(currentQuestion.id);

  // 🔥 TIPE IKON
  const typeIcons = {
    multiple: <CheckCircle size={14} />,
    truefalse: <Table size={14} />,
    multiselect: <CheckSquare size={14} />,
    reading: <AlignLeft size={14} />,
    shortanswer: <Hash size={14} />,
    causeeffect: <Grid size={14} />,
    matching: <Grid size={14} />
  };

  const typeLabels = {
    multiple: 'Pilihan Ganda',
    truefalse: 'Benar/Salah',
    multiselect: 'Pilih > 1',
    reading: 'Membaca Teks',
    shortanswer: 'Isian Singkat',
    causeeffect: 'Sebab Akibat',
    matching: 'Menjodohkan'
  };

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.quizHeader}>
        <div style={styles.quizHeaderLeft}>
          <button onClick={() => {
            if (window.confirm('Yakin keluar? Jawaban akan hilang.')) {
              handleBack();
            }
          }} style={styles.quizBackBtn}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3 style={styles.quizTitle}>{quizData?.title}</h3>
            <span style={styles.quizSubject}>{quizData?.subject}</span>
          </div>
        </div>
        <div style={styles.quizHeaderRight}>
          {quizData?.timeLimit > 0 && (
            <div style={styles.timerBox(timeLeft < 60)}>
              <Timer size={16} />
              <span style={styles.timerText}>{formatTime(timeLeft)}</span>
            </div>
          )}
          <div style={styles.progressBox}>
            <span style={styles.progressText}>{getAnsweredCount()}/{questions.length}</span>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={styles.progressBarContainer}>
        <div style={{...styles.progressBar, width: `${progress}%`}} />
      </div>

      {/* 🔥 NAVIGASI SOAL */}
      <div style={styles.questionNavigator}>
        <button 
          onClick={() => goToQuestion(currentIndex - 1)} 
          disabled={isFirstQuestion}
          style={styles.navButtonSmall(isFirstQuestion)}
        >
          <ChevronLeft size={14} /> Sebelumnya
        </button>
        <div style={styles.questionDots}>
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q.id);
            const isActive = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                style={styles.questionDot(status, isActive)}
                title={`Soal ${idx + 1}${status === 'answered' ? ' (Terjawab)' : status === 'flagged' ? ' (Ragu-ragu)' : ' (Belum)'}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <button 
          onClick={() => goToQuestion(currentIndex + 1)} 
          disabled={isLastQuestion}
          style={styles.navButtonSmall(isLastQuestion)}
        >
          Selanjutnya <ChevronRight size={14} />
        </button>
      </div>

      {/* QUESTION */}
      <div style={styles.questionCard}>
        <div style={styles.questionNumber}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={styles.questionNumText}>Soal {currentIndex + 1} dari {questions.length}</span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 10,
              background: questionStatus === 'answered' ? '#dcfce7' : questionStatus === 'flagged' ? '#fef3c7' : '#f1f5f9',
              color: questionStatus === 'answered' ? '#166534' : questionStatus === 'flagged' ? '#b45309' : '#94a3b8'
            }}>
              {questionStatus === 'answered' ? '✅ Terjawab' : questionStatus === 'flagged' ? '🚩 Ragu-ragu' : '⏳ Belum'}
            </span>
            <span style={{
              fontSize: 8,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 10,
              background: '#f1f5f9',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              {typeIcons[currentQuestion.type] || <HelpCircle size={12} />}
              {typeLabels[currentQuestion.type] || 'Soal'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              onClick={() => handleFlagQuestion(currentQuestion.id)}
              style={{
                background: flaggedQuestions[currentQuestion.id] ? '#fef3c7' : '#f1f5f9',
                border: flaggedQuestions[currentQuestion.id] ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: isSubmitted || hasExistingAnswer ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 600,
                color: flaggedQuestions[currentQuestion.id] ? '#b45309' : '#64748b',
                opacity: isSubmitted || hasExistingAnswer ? 0.6 : 1
              }}
              disabled={isSubmitted || hasExistingAnswer}
            >
              <Flag size={14} /> {flaggedQuestions[currentQuestion.id] ? 'Batalkan' : 'Ragu-ragu'}
            </button>
          </div>
        </div>

        {/* Gambar Soal */}
        {currentQuestion.questionImage && (
          <div style={styles.questionImage}>
            <img src={currentQuestion.questionImage} alt="Soal" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} />
          </div>
        )}

        {/* Teks Bacaan (untuk tipe reading) */}
        {currentQuestion.type === 'reading' && currentQuestion.readingText && (
          <div style={styles.readingText}>
            <h4 style={styles.readingTitle}>📖 Teks Bacaan</h4>
            <div style={styles.readingContent}>{renderMath(currentQuestion.readingText)}</div>
          </div>
        )}

        <h3 style={styles.questionText}>{renderMath(currentQuestion.question)}</h3>

        {/* Opsi Jawaban */}
        {renderQuestionOptions(currentQuestion)}
      </div>

      {/* SUBMIT BUTTON */}
      <div style={styles.submitContainer}>
        <button 
          onClick={() => setShowConfirm(true)}
          style={styles.submitButton}
        >
          <Send size={16} /> Kirim Jawaban
        </button>
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalIcon}>📤</div>
            <h3 style={styles.modalTitle}>Kirim Jawaban?</h3>
            <p style={styles.modalDesc}>
              Anda telah menjawab {getAnsweredCount()} dari {questions.length} soal.
              {getAnsweredCount() < questions.length && (
                <span style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                  ⚠️ Masih ada {questions.length - getAnsweredCount()} soal belum dijawab
                </span>
              )}
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowConfirm(false)} style={styles.modalCancel}>Batal</button>
              <button onClick={() => handleSubmitQuiz()} style={styles.modalSubmit}>
                Kirim Jawaban
              </button>
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
const styles = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '16px',
    minHeight: '100vh',
    background: '#f8fafc'
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: 16
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #673ab7',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: 16,
    textAlign: 'center',
    padding: 20
  },
  errorTitle: { fontSize: 20, color: '#1e293b', fontWeight: 700 },
  backButton: {
    background: '#f1f5f9',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },

  // START CARD
  startCard: {
    background: 'white',
    borderRadius: 20,
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },
  startHeader: { textAlign: 'center', marginBottom: 24 },
  startIcon: { fontSize: 48, marginBottom: 8 },
  startTitle: { fontSize: 24, fontWeight: 900, color: '#1e293b', margin: 0 },
  startSubject: { fontSize: 14, color: '#64748b', marginTop: 4 },
  
  quizStatusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 14px',
    borderRadius: 20,
    border: '2px solid',
    fontSize: 12,
    fontWeight: 700,
    marginTop: 8
  },

  startInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 8,
    marginBottom: 20
  },
  startInfoItem: {
    background: '#f8fafc',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b'
  },

  startRules: {
    background: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    border: '1px solid #e2e8f0'
  },
  rulesTitle: { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' },
  rulesList: { listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.8 },

  startFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  btnCancel: {
    padding: '10px 24px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    color: '#64748b'
  },
  btnStart: {
    padding: '10px 32px',
    background: 'linear-gradient(135deg, #673ab7, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(103,58,183,0.3)'
  },

  // QUIZ ACTIVE
  quizHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'white',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8
  },
  quizHeaderLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  quizBackBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer'
  },
  quizTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' },
  quizSubject: { fontSize: 11, color: '#94a3b8' },

  quizHeaderRight: { display: 'flex', gap: 8, alignItems: 'center' },
  timerBox: (warning) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    background: warning ? '#fee2e2' : '#f1f5f9',
    color: warning ? '#ef4444' : '#64748b',
    fontWeight: 700,
    fontSize: 13
  }),
  timerText: { fontFamily: 'monospace', fontWeight: 900 },
  progressBox: {
    padding: '6px 12px',
    borderRadius: 8,
    background: '#eef2ff',
    color: '#3b82f6',
    fontWeight: 700,
    fontSize: 12
  },

  progressBarContainer: {
    width: '100%',
    height: 4,
    background: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #673ab7, #8b5cf6)',
    borderRadius: 2,
    transition: 'width 0.3s ease'
  },

  // 🔥 NAVIGATOR SOAL
  questionNavigator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'white',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  navButtonSmall: (disabled) => ({
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    background: disabled ? '#f1f5f9' : 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#94a3b8' : '#1e293b',
    fontWeight: 600,
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    opacity: disabled ? 0.5 : 1
  }),
  questionDots: {
    display: 'flex',
    gap: 4,
    flex: 1,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  questionDot: (status, active) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: active ? '2px solid #673ab7' : '1px solid #e2e8f0',
    background: status === 'answered' ? '#10b981' : status === 'flagged' ? '#f59e0b' : 'white',
    color: status === 'answered' ? 'white' : status === 'flagged' ? 'white' : active ? '#673ab7' : '#94a3b8',
    cursor: 'pointer',
    fontWeight: active ? 900 : 600,
    fontSize: 11,
    transition: '0.2s',
    boxShadow: active ? '0 2px 8px rgba(103,58,183,0.3)' : 'none'
  }),

  questionCard: {
    background: 'white',
    borderRadius: 14,
    padding: '20px 24px',
    border: '1px solid #e2e8f0',
    marginBottom: 12
  },
  questionNumber: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8
  },
  questionNumText: { fontSize: 12, fontWeight: 600, color: '#64748b' },

  questionImage: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 300,
    display: 'flex',
    justifyContent: 'center',
    background: '#f8fafc'
  },
  questionText: {
    fontSize: 17,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 16px',
    lineHeight: 1.6
  },

  // READING TEXT
  readingText: {
    background: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    marginBottom: 16,
    maxHeight: 200,
    overflowY: 'auto'
  },
  readingTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    margin: '0 0 8px'
  },
  readingContent: {
    fontSize: 13,
    lineHeight: 1.7,
    color: '#1e293b',
    whiteSpace: 'pre-wrap'
  },

  // SUBMIT
  submitContainer: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'center'
  },
  submitButton: {
    padding: '12px 32px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
    transition: '0.2s'
  },

  // MODAL CONFIRM
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20,
    backdropFilter: 'blur(4px)'
  },
  modalCard: {
    background: 'white',
    borderRadius: 16,
    padding: '28px 32px',
    maxWidth: 400,
    width: '100%',
    textAlign: 'center'
  },
  modalIcon: { fontSize: 40, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' },
  modalDesc: { fontSize: 13, color: '#64748b', margin: '0 0 16px' },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'center' },
  modalCancel: {
    padding: '8px 20px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
    color: '#64748b'
  },
  modalSubmit: {
    padding: '8px 24px',
    background: 'linear-gradient(135deg, #673ab7, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12
  },

  // ============================================================
  // RESULT & PREVIEW STYLES
  // ============================================================
  resultCard: {
    background: 'white',
    borderRadius: 20,
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },
  resultHeader: { textAlign: 'center', marginBottom: 24 },
  resultIcon: (passed) => ({
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: passed ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px'
  }),
  resultTitle: (passed) => ({
    fontSize: 24,
    fontWeight: 900,
    color: passed ? '#065f46' : '#92400e',
    margin: 0
  }),
  resultSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  resultScore: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    justifyContent: 'center',
    padding: '20px',
    background: '#f8fafc',
    borderRadius: 12,
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #673ab7, #8b5cf6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  scoreValue: { fontSize: 32, fontWeight: 900 },
  scoreLabel: { fontSize: 10, fontWeight: 600, opacity: 0.8 },

  scoreDetails: { display: 'flex', flexDirection: 'column', gap: 4 },
  scoreDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#1e293b'
  },

  // 🔥 TOMBOL LIHAT JAWABAN
  actionButtons: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16
  },
  btnToggleAnswers: {
    padding: '10px 24px',
    background: '#eef2ff',
    color: '#4338ca',
    border: '2px solid #4338ca',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: '0.2s'
  },

  // 🔥 DAFTAR JAWABAN
  allAnswersSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '2px solid #e2e8f0'
  },
  answersTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#1e293b',
    margin: '0 0 16px'
  },
  
  answerItem: (isCorrect) => ({
    padding: '16px',
    marginBottom: 12,
    borderRadius: 12,
    border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
    background: isCorrect ? '#f0fdf4' : '#fef2f2',
    transition: '0.2s'
  }),
  
  answerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  answerNumber: { fontSize: 12, fontWeight: 700, color: '#64748b' },
  answerStatus: (isCorrect) => ({
    fontSize: 12,
    fontWeight: 700,
    color: isCorrect ? '#10b981' : '#ef4444'
  }),
  
  answerQuestion: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 10
  },
  
  answerOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 8
  },
  
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 13
  },
  optionLabel: { fontWeight: 700, color: '#64748b' },
  
  answerUser: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  
  answerExplanation: {
    marginTop: 8,
    padding: '8px 12px',
    background: '#eef2ff',
    borderRadius: 6,
    fontSize: 12,
    color: '#4338ca',
    lineHeight: 1.6
  },

  resultFooter: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16
  },
  btnHome: {
    padding: '10px 24px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    color: '#64748b'
  },
  btnRetry: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  }
};

export default StudentQuizView;