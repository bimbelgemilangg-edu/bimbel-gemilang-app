// src/pages/student/StudentQuizView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, 
  HelpCircle, Send, User, Hash, Award, Timer, 
  BarChart3, TrendingUp, Shield, AlertTriangle,
  ChevronLeft, ChevronRight, BookOpen, Zap, RefreshCw
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

  // ===== FETCH QUIZ - AMBIL DARI MODUL =====
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

        // 🔥 CEK APAKAH SUDAH PERNAH MENGERJAKAN
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
          
          // Cek batas percobaan
          const maxAttempts = data.maxAttempts || 1;
          if (maxAttempts > 0 && existing >= maxAttempts) {
            setError(`⚠️ Anda sudah mengerjakan kuis ini ${existing} kali. Batas maksimal ${maxAttempts} kali.`);
            setLoading(false);
            return;
          }
        }

        // 🔥 Siapkan soal - PASTIKAN FORMATNYA BENAR
        let questionsData = quizDataRaw.map((q, idx) => ({
          id: q.id || idx,
          question: q.question || q.q || `Soal ${idx + 1}`,
          questionImage: q.questionImage || q.qImage || '',
          options: q.options || [],
          optionImages: q.optionImages || [],
          correctAnswer: q.correctAnswer || q.correct || 0,
          explanation: q.explanation || '',
        }));

        // 🔥 Acak soal jika diminta
        if (data.randomOrder) {
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
  }, [modulId, studentInfo.nim]);

  // ===== TIMER =====
  useEffect(() => {
    if (!quizStarted || isSubmitted || timeLeft <= 0) return;

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
  }, [quizStarted, isSubmitted]);

  // ===== AUTO SUBMIT =====
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitted) return;
    alert('⏰ Waktu habis! Jawaban akan dikirim otomatis.');
    await handleSubmitQuiz(true);
  }, [isSubmitted]);

  // ===== HANDLE ANSWER =====
  const handleSelectAnswer = (questionId, optionIndex) => {
    if (isSubmitted) return;
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
    if (isSubmitted) return;

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
        ...q,
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

  // ===== LOADING =====
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Memuat kuis...</p>
      </div>
    );
  }

  // ===== ERROR =====
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
  // RENDER - QUIZ NOT STARTED
  // ============================================================
  if (!quizStarted) {
    return (
      <div style={styles.container}>
        <div style={styles.startCard}>
          <div style={styles.startHeader}>
            <div style={styles.startIcon}>❓</div>
            <h2 style={styles.startTitle}>{quizData?.title || 'Kuis'}</h2>
            <p style={styles.startSubject}>{quizData?.subject || 'Umum'}</p>
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
              <li>Pilih satu jawaban yang paling benar</li>
              {quizData?.timeLimit > 0 && (
                <li>⏰ Waktu pengerjaan: {quizData.timeLimit} menit</li>
              )}
              {quizData?.maxAttempts > 1 ? (
                <li>🔄 Bisa dikerjakan {quizData.maxAttempts} kali</li>
              ) : (
                <li>🔒 Hanya bisa dikerjakan 1 kali</li>
              )}
              {quizData?.showExplanation && (
                <li>💡 Pembahasan akan tampil setelah selesai</li>
              )}
              {quizData?.randomOrder && (
                <li>🎲 Soal diacak untuk setiap siswa</li>
              )}
            </ul>
          </div>

          <div style={styles.startFooter}>
            <button onClick={handleBack} style={styles.btnCancel}>Batal</button>
            <button onClick={handleStartQuiz} style={styles.btnStart}>
              <Zap size={16} /> Mulai Kuis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - SUBMITTED
  // ============================================================
  if (isSubmitted && results) {
    const { correctCount, totalQuestions, score, details, isAuto } = results;
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
              {isPassed ? 'Anda lulus dengan hasil yang memuaskan' : 'Jangan menyerah, coba lagi lain waktu'}
            </p>
          </div>

          <div style={styles.resultScore}>
            <div style={styles.scoreCircle}>
              <span style={styles.scoreValue}>{score}</span>
              <span style={styles.scoreLabel}>Nilai</span>
            </div>
            <div style={styles.scoreDetails}>
              <div style={styles.scoreDetailItem}>
                <CheckCircle size={16} color="#10b981" />
                <span>Benar: {correctCount}</span>
              </div>
              <div style={styles.scoreDetailItem}>
                <XCircle size={16} color="#ef4444" />
                <span>Salah: {totalQuestions - correctCount}</span>
              </div>
              <div style={styles.scoreDetailItem}>
                <HelpCircle size={16} color="#3b82f6" />
                <span>Total: {totalQuestions}</span>
              </div>
              {isAuto && (
                <div style={styles.scoreDetailItem}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  <span>⏰ Dikirim otomatis (waktu habis)</span>
                </div>
              )}
            </div>
          </div>

          {/* PEMBAHASAN */}
          {quizData?.showExplanation && (
            <div style={styles.explanationSection}>
              <button 
                onClick={() => setShowExplanation(!showExplanation)}
                style={styles.explanationToggle}
              >
                {showExplanation ? '📖 Sembunyikan Pembahasan' : '📖 Lihat Pembahasan'}
              </button>

              {showExplanation && (
                <div style={styles.explanationList}>
                  {details.map((q, idx) => (
                    <div key={q.id} style={styles.explanationItem}>
                      <div style={styles.explanationQuestion}>
                        <span style={styles.explanationNum}>{idx + 1}.</span>
                        <span>{q.question}</span>
                      </div>
                      <div style={styles.explanationAnswer}>
                        <span>Jawaban Anda: </span>
                        <span style={{
                          fontWeight: 'bold',
                          color: q.isCorrect ? '#10b981' : '#ef4444'
                        }}>
                          {q.userAnswer !== undefined ? q.options[q.userAnswer] || 'Tidak dijawab' : 'Tidak dijawab'}
                        </span>
                        {!q.isCorrect && (
                          <span style={{ color: '#10b981', marginLeft: 8 }}>
                            ✅ Jawaban benar: {q.options[q.correctAnswer]}
                          </span>
                        )}
                      </div>
                      {q.explanation && (
                        <div style={styles.explanationText}>
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={styles.resultFooter}>
            <button onClick={handleBack} style={styles.btnHome}>
              🏠 Kembali ke Dashboard
            </button>
            {!isAuto && quizData?.maxAttempts > 1 && attemptCount < quizData.maxAttempts - 1 && (
              <button onClick={() => {
                setQuizStarted(false);
                setIsSubmitted(false);
                setAnswers({});
                setResults(null);
                setCurrentIndex(0);
                setTimeLeft(quizData.timeLimit * 60);
              }} style={styles.btnRetry}>
                <RefreshCw size={16} /> Coba Lagi
              </button>
            )}
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

        {/* Gambar soal */}
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

      {/* QUESTION PAGINATION */}
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

  // RESULT CARD
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

  explanationSection: { marginBottom: 20 },
  explanationToggle: {
    width: '100%',
    padding: '10px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    color: '#1e293b'
  },
  explanationList: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 400,
    overflowY: 'auto'
  },
  explanationItem: {
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0'
  },
  explanationQuestion: { fontWeight: 600, fontSize: 13, marginBottom: 4 },
  explanationNum: { color: '#94a3b8', marginRight: 4 },
  explanationAnswer: { fontSize: 12, color: '#64748b' },
  explanationText: {
    marginTop: 6,
    padding: '8px 12px',
    background: '#eef2ff',
    borderRadius: 6,
    fontSize: 12,
    color: '#4338ca'
  },

  resultFooter: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap'
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