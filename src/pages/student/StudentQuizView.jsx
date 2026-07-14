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
  Eye, EyeOff, Calendar, Lock, Unlock
} from 'lucide-react';

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
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ nim: '', name: '', kelas: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showConfirm, setShowConfirm] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  
  // 🔥 STATE UNTUK PREVIEW JAWABAN
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [hasExistingAnswer, setHasExistingAnswer] = useState(false);
  const [existingResult, setExistingResult] = useState(null);
  const [quizStatus, setQuizStatus] = useState('');

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
        // 🔥 AMBIL DATA MODUL
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
        
        // 🔥 CEK SUDAH PERNAH MENGERJAKAN
        if (nim) {
          const qJawaban = query(
            collection(db, "jawaban_kuis"),
            where("modulId", "==", modulId),
            where("studentNim", "==", nim)
          );
          const snapJawaban = await getDocs(qJawaban);
          const existing = snapJawaban.docs.length;
          setAttemptCount(existing);
          
          // 🔥 AMBIL HASIL TERAKHIR jika sudah pernah
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
          
          // 🔥 CEK BATAS PERCOBAAN
          const maxAttempts = data.maxAttempts || 1;
          if (maxAttempts > 0 && existing >= maxAttempts) {
            setError(`⚠️ Anda sudah mengerjakan kuis ini ${existing} kali. Batas maksimal ${maxAttempts} kali.`);
            setLoading(false);
            return;
          }
        }

        // 🔥 CEK JADWAL BUKA/TUTUP
        const now = new Date();
        
        if (data.useSchedule) {
          // CEK TANGGAL BUKA
          if (data.quizOpenDate) {
            const open = new Date(data.quizOpenDate);
            if (now < open) {
              setError(`⏳ Kuis belum dibuka. Akan dibuka pada ${open.toLocaleString('id-ID', { 
                day: 'numeric', month: 'long', year: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
              })}`);
              setLoading(false);
              return;
            }
          }
          
          // CEK TANGGAL TUTUP
          if (data.quizCloseDate) {
            const close = new Date(data.quizCloseDate);
            if (now > close) {
              setError(`⛔ Kuis sudah ditutup pada ${close.toLocaleString('id-ID', { 
                day: 'numeric', month: 'long', year: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
              })}. Tidak dapat dikerjakan lagi.`);
              setLoading(false);
              return;
            }
          }
        }

        // 🔥 Siapkan soal
        let questionsData = quizDataRaw.map((q, idx) => ({
          id: q.id || idx,
          question: q.question || q.q || `Soal ${idx + 1}`,
          questionImage: q.questionImage || q.qImage || '',
          options: q.options || [],
          optionImages: q.optionImages || [],
          correctAnswer: q.correctAnswer || q.correct || 0,
          explanation: q.explanation || '',
        }));

        // 🔥 Acak soal jika diminta (hanya jika belum pernah dikerjakan)
        if (data.randomOrder && !hasExistingAnswer) {
          questionsData = shuffleArray(questionsData);
        }

        // 🔥 Set timer
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

  // ===== SUBMIT QUIZ =====
  const handleSubmitQuiz = async (isAuto = false) => {
    if (isSubmitted || hasExistingAnswer) return;

    // Cek semua soal sudah dijawab (kecuali auto submit)
    if (!isAuto) {
      const unanswered = questions.filter(q => answers[q.id] === undefined);
      if (unanswered.length > 0) {
        if (!window.confirm(`⚠️ Anda belum menjawab ${unanswered.length} soal. Yakin ingin mengirim?`)) {
          return;
        }
      }
    }

    setShowConfirm(false);
    setIsSubmitted(true);

    // 🔥 HITUNG NILAI
    let correctCount = 0;
    const detailedResults = questions.map(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        userAnswer,
        isCorrect,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    // 🔥 SIMPAN KE FIRESTORE
    try {
      const nim = studentInfo.nim;
      await addDoc(collection(db, "jawaban_kuis"), {
        modulId,
        modulTitle: quizData?.title || 'Kuis',
        studentNim: nim,
        studentName: studentInfo.name,
        studentClass: studentInfo.kelas,
        subject: quizData?.subject || 'Umum',
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
          {/* HEADER */}
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
                : 'sebelumnya'}
            </p>
            {isAutoSubmit && (
              <p style={{ color: '#f59e0b', fontSize: 13, marginTop: 4 }}>
                ⏰ Dikirim otomatis karena waktu habis
              </p>
            )}
          </div>

          {/* SKOR */}
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

          {/* 🔥 TOMBOL LIHAT JAWABAN */}
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

          {/* 🔥 DAFTAR JAWABAN - HIJAU/MERAH */}
          {showAllAnswers && details && (
            <div style={styles.allAnswersSection}>
              <h4 style={styles.answersTitle}>📋 Daftar Jawaban & Pembahasan</h4>
              {details.map((q, idx) => {
                const isCorrect = q.isCorrect;
                return (
                  <div key={q.id} style={styles.answerItem(isCorrect)}>
                    <div style={styles.answerHeader}>
                      <span style={styles.answerNumber}>Soal {idx + 1}</span>
                      <span style={styles.answerStatus(isCorrect)}>
                        {isCorrect ? '✅ Benar' : '❌ Salah'}
                      </span>
                    </div>
                    
                    <div style={styles.answerQuestion}>{q.question}</div>
                    
                    <div style={styles.answerOptions}>
                      {q.options.map((opt, oIdx) => {
                        const isCorrectAnswer = oIdx === q.correctAnswer;
                        const isUserAnswer = oIdx === q.userAnswer;
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
                            <span>{opt || `Opsi ${String.fromCharCode(65 + oIdx)}`}</span>
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
                          {q.options[q.userAnswer] || 'Tidak dijawab'}
                        </span>
                      </div>
                    )}
                    
                    {q.explanation && (
                      <div style={styles.answerExplanation}>
                        💡 <span style={{ fontWeight: 600 }}>Pembahasan:</span> {q.explanation}
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
    // 🔥 CEK STATUS KUIS
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
            
            {/* 🔥 STATUS KUIS */}
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
            {quizData?.useSchedule && quizData?.quizOpenDate && quizData?.quizCloseDate && (
              <div style={{...styles.startInfoItem, background: '#eef2ff', borderColor: '#3b82f6'}}>
                <Calendar size={18} color="#3b82f6" />
                <span>
                  {new Date(quizData.quizOpenDate).toLocaleDateString()} - {new Date(quizData.quizCloseDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div style={styles.startRules}>
            <h4 style={styles.rulesTitle}>📋 Aturan Pengerjaan:</h4>
            <ul style={styles.rulesList}>
              <li>Baca soal dengan teliti sebelum menjawab</li>
              <li>Pilih satu jawaban yang paling benar</li>
              {quizData?.timeLimit > 0 && (
                <li>⏰ Waktu pengerjaan: {quizData.timeLimit} menit</li>
              )}
              {quizData?.maxAttempts > 1 ? (
                <li>🔄 Bisa dikerjakan {quizData.maxAttempts} kali</li>
              ) : (
                <li>🔒 Hanya bisa dikerjakan 1 kali</li>
              )}
              <li>📖 Setelah selesai, Anda bisa melihat jawaban & pembahasan</li>
              {quizData?.showExplanation && (
                <li>💡 Pembahasan akan tampil setelah selesai</li>
              )}
              {quizData?.randomOrder && (
                <li>🎲 Soal diacak untuk setiap siswa</li>
              )}
              {quizData?.useSchedule && (
                <li>📅 Kuis hanya bisa dikerjakan dalam periode yang ditentukan</li>
              )}
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

      {/* QUESTION */}
      <div style={styles.questionCard}>
        <div style={styles.questionNumber}>
          <span style={styles.questionNumText}>Soal {currentIndex + 1} dari {questions.length}</span>
          <span style={styles.questionStatus}>
            {answers[currentQuestion.id] !== undefined ? '✅ Terjawab' : '⏳ Belum dijawab'}
          </span>
        </div>

        {currentQuestion.questionImage && (
          <div style={styles.questionImage}>
            <img src={currentQuestion.questionImage} alt="Soal" />
          </div>
        )}

        <h3 style={styles.questionText}>{currentQuestion.question}</h3>

        <div style={styles.optionsContainer}>
          {currentQuestion.options.map((option, idx) => {
            const isSelected = answers[currentQuestion.id] === idx;
            const letter = String.fromCharCode(65 + idx);
            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(currentQuestion.id, idx)}
                style={styles.optionButton(isSelected)}
                disabled={isSubmitted}
              >
                <span style={styles.optionLetter(isSelected)}>{letter}</span>
                <span style={styles.optionText}>{option || `Opsi ${letter}`}</span>
                {currentQuestion.optionImages?.[idx] && (
                  <img src={currentQuestion.optionImages[idx]} alt={`Opsi ${letter}`} style={styles.optionImage} />
                )}
                {isSelected && <CheckCircle size={16} color="#10b981" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* NAVIGATION */}
      <div style={styles.navigation}>
        <button 
          onClick={() => goToQuestion(currentIndex - 1)} 
          disabled={isFirstQuestion}
          style={styles.navButton(isFirstQuestion)}
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>

        <div style={styles.navCenter}>
          <span style={styles.navProgress}>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {isLastQuestion ? (
          <button 
            onClick={() => setShowConfirm(true)}
            style={styles.submitButton}
          >
            <Send size={16} /> Kirim Jawaban
          </button>
        ) : (
          <button 
            onClick={() => goToQuestion(currentIndex + 1)} 
            style={styles.navButton(false)}
          >
            Selanjutnya <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* PAGINATION */}
      <div style={styles.pagination}>
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          const isActive = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(idx)}
              style={styles.paginationDot(isAnswered, isActive)}
              title={`Soal ${idx + 1}${isAnswered ? ' (Terjawab)' : ''}`}
            >
              {idx + 1}
            </button>
          );
        })}
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
              <button onClick={handleSubmitQuiz} style={styles.modalSubmit}>
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
    gap: 4
  },
  questionNumText: { fontSize: 12, fontWeight: 600, color: '#64748b' },
  questionStatus: { fontSize: 11, fontWeight: 600, color: '#3b82f6' },

  questionImage: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 300,
    display: 'flex',
    justifyContent: 'center'
  },
  questionText: {
    fontSize: 17,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 16px',
    lineHeight: 1.6
  },

  optionsContainer: { display: 'flex', flexDirection: 'column', gap: 6 },
  optionButton: (selected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 10,
    border: `2px solid ${selected ? '#673ab7' : '#e2e8f0'}`,
    background: selected ? '#f3e8ff' : 'white',
    cursor: 'pointer',
    transition: '0.2s',
    fontSize: 14,
    color: selected ? '#673ab7' : '#1e293b',
    fontWeight: selected ? 700 : 500,
    width: '100%',
    textAlign: 'left'
  }),
  optionLetter: (selected) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: selected ? '#673ab7' : '#f1f5f9',
    color: selected ? 'white' : '#64748b',
    fontWeight: 700,
    fontSize: 12,
    flexShrink: 0
  }),
  optionText: { flex: 1 },
  optionImage: { maxHeight: 40, borderRadius: 4 },

  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  navButton: (disabled) => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: disabled ? '#f1f5f9' : 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#94a3b8' : '#1e293b',
    fontWeight: 600,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }),
  navCenter: { flex: 1, textAlign: 'center' },
  navProgress: { fontSize: 12, color: '#94a3b8', fontWeight: 600 },
  submitButton: {
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },

  pagination: {
    display: 'flex',
    gap: 4,
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: '8px 0'
  },
  paginationDot: (answered, active) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: active ? '2px solid #673ab7' : '1px solid #e2e8f0',
    background: active ? '#f3e8ff' : answered ? '#10b981' : 'white',
    color: active ? '#673ab7' : answered ? 'white' : '#94a3b8',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11
  }),

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

// Tambahkan keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default StudentQuizView;