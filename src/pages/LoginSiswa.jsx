// src/pages/LoginSiswa.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { 
  User, Lock, Eye, EyeOff, LogIn, BookOpen, 
  Sparkles, Shield, CheckCircle, AlertCircle, 
  Rocket, Star, Trophy, Gamepad2, X, ChevronLeft, 
  ChevronRight, Calendar, Clock, Users, Award,
  TrendingUp, Zap, Globe, Menu
} from 'lucide-react';

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posters, setPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [theme] = useState('dark');
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  
  // ===== GAME STATE =====
  const [showGame, setShowGame] = useState(false);
  const [gameWords, setGameWords] = useState([
    { word: 'BINTANG', hint: '🌌 Cahaya di langit malam' },
    { word: 'PLANET', hint: '🪐 Pengeliling matahari' },
    { word: 'ROKET', hint: '🚀 Kendaraan ke luar angkasa' },
    { word: 'GALAKSI', hint: '🌠 Kumpulan miliaran bintang' },
    { word: 'ASTRONOT', hint: '👨‍🚀 Penjelajah luar angkasa' }
  ]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [shuffledLetters, setShuffledLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [gameMessage, setGameMessage] = useState('');
  const [gameScore, setGameScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== FETCH POSTERS =====
  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosters(data.filter(p => p.targetPortal === "Siswa" || p.targetPortal === "Semua" || !p.targetPortal));
      } catch (err) {
        console.error("Gagal ambil poster:", err);
      }
    };
    fetchPosters();
  }, []);

  // ===== AUTO SLIDE POSTER =====
  useEffect(() => {
    if (posters.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPosterIndex(prev => (prev + 1) % posters.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [posters.length]);

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    const inputUsername = username.trim();
    const inputPassword = password.trim();

    if (!inputUsername || !inputPassword) {
      return alert("Silakan masukkan Username dan Password!");
    }
    
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      let studentData = null;
      let studentId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.username && data.username.toLowerCase() === inputUsername.toLowerCase()) {
          studentData = data;
          studentId = doc.id;
        }
      });

      if (studentData) {
        if (String(studentData.password) === inputPassword) {
          localStorage.setItem("isSiswaLoggedIn", "true");
          localStorage.setItem("role", "siswa");
          localStorage.setItem("studentId", studentId);
          localStorage.setItem("studentName", studentData.nama);
          localStorage.setItem("studentGrade", studentData.kelasSekolah || "");
          
          navigate("/siswa/dashboard");
        } else {
          alert("⛔ Password salah! Silakan coba lagi.");
        }
      } else {
        alert("⛔ Username tidak ditemukan. Pastikan data sudah benar.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Terjadi kesalahan koneksi ke server database.");
    } finally {
      setLoading(false);
    }
  };

  // ===== GAME FUNCTIONS =====
  const startGame = () => {
    setShowGame(true);
    setGameScore(0);
    setCurrentWordIndex(0);
    setGameComplete(false);
    setGameMessage('');
    shuffleWord(0);
  };

  const shuffleWord = (index) => {
    const word = gameWords[index].word;
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setShuffledLetters(letters);
    setSelectedLetters([]);
    setGameMessage('');
  };

  const handleLetterClick = (letter, index) => {
    if (gameComplete) return;
    const newSelected = [...selectedLetters, letter];
    setSelectedLetters(newSelected);
    
    const newShuffled = [...shuffledLetters];
    newShuffled.splice(index, 1);
    setShuffledLetters(newShuffled);

    const currentWord = gameWords[currentWordIndex].word;
    if (newSelected.length === currentWord.length) {
      if (newSelected.join('') === currentWord) {
        setGameMessage('✅ Benar! 🎉');
        setGameScore(prev => prev + 10);
        setTimeout(() => {
          if (currentWordIndex < gameWords.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
            shuffleWord(currentWordIndex + 1);
          } else {
            setGameComplete(true);
            setGameMessage('🏆 Selamat! Kamu menyelesaikan semua kata!');
          }
        }, 800);
      } else {
        setGameMessage('❌ Coba lagi!');
        setTimeout(() => {
          shuffleWord(currentWordIndex);
        }, 600);
      }
    }
  };

  const resetGame = () => {
    setShowGame(false);
    setGameScore(0);
    setCurrentWordIndex(0);
    setGameComplete(false);
    setGameMessage('');
  };

  // ===== NAVIGASI POSTER =====
  const prevPoster = () => {
    setCurrentPosterIndex(prev => (prev - 1 + posters.length) % posters.length);
  };

  const nextPoster = () => {
    setCurrentPosterIndex(prev => (prev + 1) % posters.length);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={styles.container}>
      
      {/* ===== BACKGROUND EPIK ===== */}
      <div style={styles.background}>
        <div style={styles.gradientOrbit1}></div>
        <div style={styles.gradientOrbit2}></div>
        <div style={styles.gradientOrbit3}></div>
        <div style={styles.starField}>
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              style={{
                ...styles.star,
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: (Math.random() * 3 + 2) + 's'
              }}
            />
          ))}
        </div>
      </div>

      {/* ===== MODAL POSTER (BESAR & INTERAKTIF) ===== */}
      {selectedPoster && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPoster(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPoster(null)} style={styles.modalClose}>
              <X size={20} />
            </button>
            <div style={styles.modalImageWrapper}>
              <img 
                src={selectedPoster.imageUrl} 
                alt={selectedPoster.title} 
                style={styles.modalImage} 
                onError={(e) => { e.target.src = 'https://placehold.co/800x400/1a1a3e/white?text=📷+Gambar+Tidak+Tersedia'; }} 
              />
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalBadge}>
                <Calendar size={12} /> 
                {selectedPoster.createdAt?.toDate 
                  ? new Date(selectedPoster.createdAt.toDate()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Terbaru'}
              </div>
              <h2 style={styles.modalTitle}>{selectedPoster.title}</h2>
              <p style={styles.modalText}>{selectedPoster.content || "Tidak ada deskripsi."}</p>
              <button 
                onClick={() => setSelectedPoster(null)} 
                style={styles.modalReadBtn}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CARD ===== */}
      <div style={styles.card}>
        
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <img 
              src="/pwa-192x192.png" 
              alt="Logo" 
              style={styles.logo} 
              onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="%23652D90"/><text x="32" y="40" text-anchor="middle" fill="white" font-size="28" font-weight="bold">G</text></svg>'; }}
            />
            <div>
              <h1 style={styles.title}>Bimbel Gemilang</h1>
              <p style={styles.subtitle}>Portal Akademik Siswa</p>
            </div>
          </div>
          <div style={styles.headerBadge}>
            <Sparkles size={12} color="#fbbf24" />
            <span style={styles.headerBadgeText}>v3.0</span>
          </div>
        </div>

        {/* ===== POSTER SLIDER (BESAR) ===== */}
        {posters.length > 0 && (
          <div style={styles.posterSection}>
            <div style={styles.posterSlider}>
              <button onClick={prevPoster} style={styles.posterNav} className="poster-nav">
                <ChevronLeft size={20} />
              </button>
              
              <div 
                style={styles.posterWrapper}
                onClick={() => setSelectedPoster(posters[currentPosterIndex])}
              >
                <img 
                  src={posters[currentPosterIndex]?.imageUrl} 
                  alt={posters[currentPosterIndex]?.title || 'Poster'} 
                  style={styles.posterImage}
                  onError={(e) => { e.target.src = 'https://placehold.co/600x250/1a1a3e/white?text=📷+Poster'; }} 
                />
                <div style={styles.posterOverlay}>
                  <div style={styles.posterBadge}>📢 Pengumuman</div>
                  <h3 style={styles.posterTitle}>{posters[currentPosterIndex]?.title}</h3>
                  <p style={styles.posterDesc}>
                    {posters[currentPosterIndex]?.content?.slice(0, 80) || 'Klik untuk baca selengkapnya...'}
                  </p>
                  <span style={styles.posterReadMore}>Klik untuk baca ➜</span>
                </div>
              </div>
              
              <button onClick={nextPoster} style={styles.posterNav} className="poster-nav">
                <ChevronRight size={20} />
              </button>
            </div>
            
            {/* Poster Indicators */}
            {posters.length > 1 && (
              <div style={styles.posterDots}>
                {posters.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPosterIndex(idx)}
                    style={{
                      ...styles.posterDot,
                      background: idx === currentPosterIndex ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                      width: idx === currentPosterIndex ? '24px' : '8px'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== FORM LOGIN ===== */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <User size={14} /> Username Siswa
            </label>
            <div style={styles.inputWrapper}>
              <User size={16} color="#94a3b8" style={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                style={styles.input}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Lock size={14} /> Password
            </label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#94a3b8" style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={styles.actionRow}>
            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.btnDisabled : styles.btnLogin}
            >
              {loading ? (
                <div style={styles.spinner}></div>
              ) : (
                <>
                  <LogIn size={18} /> Masuk ke Portal
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={startGame}
              style={styles.btnGame}
            >
              <Gamepad2 size={16} /> Game
            </button>
          </div>
        </form>

        {/* ===== GAME SECTION ===== */}
        {showGame && (
          <div style={styles.gameSection}>
            <div style={styles.gameHeader}>
              <div style={styles.gameTitleWrapper}>
                <Rocket size={16} color="#fbbf24" />
                <h4 style={styles.gameTitle}>Susun Kata Astronot</h4>
              </div>
              <div style={styles.gameScore}>
                <Trophy size={14} color="#fbbf24" />
                <span>{gameScore}</span>
              </div>
              <button onClick={resetGame} style={styles.gameClose}>
                <X size={16} />
              </button>
            </div>

            {gameComplete ? (
              <div style={styles.gameComplete}>
                <div style={styles.gameCompleteIcon}>🏆</div>
                <h4 style={styles.gameCompleteTitle}>Selamat! Kamu Hebat!</h4>
                <p style={styles.gameCompleteScore}>Skor akhir: {gameScore} poin</p>
                <button onClick={startGame} style={styles.gameRestartBtn}>
                  Main Lagi
                </button>
              </div>
            ) : (
              <>
                <div style={styles.gameHint}>
                  <span style={styles.gameHintText}>{gameWords[currentWordIndex].hint}</span>
                </div>
                
                <div style={styles.gameWordDisplay}>
                  {selectedLetters.map((l, i) => (
                    <span key={i} style={styles.gameLetterFilled}>{l}</span>
                  ))}
                  {Array.from({ length: gameWords[currentWordIndex].word.length - selectedLetters.length }).map((_, i) => (
                    <span key={`empty-${i}`} style={styles.gameLetterEmpty}>_</span>
                  ))}
                </div>

                <div style={styles.gameLetters}>
                  {shuffledLetters.map((letter, index) => (
                    <button
                      key={index}
                      onClick={() => handleLetterClick(letter, index)}
                      style={styles.gameLetterBtn}
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                {gameMessage && (
                  <div style={{
                    ...styles.gameMessage,
                    color: gameMessage.includes('✅') ? '#10b981' : gameMessage.includes('🏆') ? '#fbbf24' : '#ef4444'
                  }}>
                    {gameMessage}
                  </div>
                )}

                <div style={styles.gameProgress}>
                  <span>Kata {currentWordIndex + 1}/{gameWords.length}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <Shield size={12} color="#94a3b8" />
            <span style={styles.footerText}>Aman & Terpercaya</span>
          </div>
          <div style={styles.footerRight}>
            <span style={styles.footerText}>© {new Date().getFullYear()} Bimbel Gemilang</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .poster-nav:hover {
          background: rgba(255,255,255,0.2) !important;
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(243,156,18,0.3);
          border-radius: 10px;
        }
        .game-letter-btn {
          transition: all 0.15s ease;
        }
        .game-letter-btn:hover {
          transform: scale(1.08);
          background: rgba(243,156,18,0.2);
        }
        .game-letter-btn:active {
          transform: scale(0.92);
        }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflowX: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #05070f 0%, #0d1b2a 30%, #1a0a2e 60%, #0a0e1a 100%)'
  },
  
  // ===== BACKGROUND =====
  background: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden'
  },
  gradientOrbit1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(243,156,18,0.03), transparent 70%)',
    top: '-100px',
    right: '-100px',
    animation: 'orbit 60s linear infinite'
  },
  gradientOrbit2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.03), transparent 70%)',
    bottom: '-50px',
    left: '-50px',
    animation: 'orbit 45s linear infinite reverse'
  },
  gradientOrbit3: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.02), transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'pulse 8s ease-in-out infinite'
  },
  starField: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none'
  },
  star: {
    position: 'absolute',
    background: 'white',
    borderRadius: '50%',
    animation: 'twinkle ease-in-out infinite'
  },
  
  // ===== CARD =====
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '480px',
    borderRadius: '24px',
    padding: '24px 28px 20px',
    background: 'rgba(13, 22, 42, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
    boxSizing: 'border-box',
    maxHeight: '96vh',
    overflowY: 'auto',
    animation: 'fadeUp 0.6s ease'
  },
  
  // ===== HEADER =====
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)'
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logo: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(101,45,144,0.3)'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    background: 'rgba(243,156,18,0.1)',
    border: '1px solid rgba(243,156,18,0.1)'
  },
  headerBadgeText: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#fbbf24'
  },
  
  // ===== POSTER SECTION =====
  posterSection: {
    marginBottom: '16px',
    borderRadius: '14px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)'
  },
  posterSlider: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative'
  },
  posterNav: {
    position: 'absolute',
    zIndex: 5,
    background: 'rgba(0,0,0,0.3)',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)'
  },
  posterWrapper: {
    width: '100%',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    aspectRatio: '16/9'
  },
  posterImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s ease'
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 18px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.85) 60%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  posterBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '12px',
    background: 'rgba(243,156,18,0.2)',
    color: '#fbbf24',
    fontSize: '8px',
    fontWeight: 700,
    width: 'fit-content'
  },
  posterTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: 'white',
    lineHeight: 1.2
  },
  posterDesc: {
    margin: 0,
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  posterReadMore: {
    fontSize: '10px',
    color: '#fbbf24',
    fontWeight: 600,
    marginTop: '2px'
  },
  posterDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 0 8px'
  },
  posterDot: {
    height: '6px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  
  // ===== FORM =====
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'all 0.2s ease'
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    opacity: 0.4
  },
  input: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: 'white',
    boxSizing: 'border-box',
    '&:focus': {
      '& + .input-icon': { opacity: 0.8 }
    }
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': { color: 'rgba(255,255,255,0.6)' }
  },
  
  // ===== BUTTONS =====
  actionRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px'
  },
  btnLogin: {
    flex: 2,
    padding: '12px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#0a0a1a',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(243,156,18,0.2)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 30px rgba(243,156,18,0.3)'
    }
  },
  btnDisabled: {
    flex: 2,
    padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '10px',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnGame: {
    flex: 1,
    padding: '12px',
    background: 'rgba(139,92,246,0.15)',
    color: '#8b5cf6',
    border: '1px solid rgba(139,92,246,0.1)',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(139,92,246,0.25)',
      transform: 'translateY(-2px)'
    }
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(0,0,0,0.2)',
    borderTop: '2px solid #0a0a1a',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite'
  },
  
  // ===== GAME SECTION =====
  gameSection: {
    marginTop: '12px',
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    animation: 'fadeUp 0.3s ease'
  },
  gameHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  gameTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  gameTitle: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 700,
    color: 'white'
  },
  gameScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#fbbf24'
  },
  gameClose: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.2)',
    cursor: 'pointer',
    padding: '2px',
    '&:hover': { color: 'rgba(255,255,255,0.5)' }
  },
  gameHint: {
    textAlign: 'center',
    padding: '4px 0',
    marginBottom: '8px'
  },
  gameHintText: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500
  },
  gameWordDisplay: {
    display: 'flex',
    justifyContent: 'center',
    gap: '4px',
    marginBottom: '12px',
    padding: '4px 0'
  },
  gameLetterFilled: {
    display: 'inline-block',
    padding: '6px 10px',
    minWidth: '32px',
    textAlign: 'center',
    background: 'rgba(243,156,18,0.15)',
    borderBottom: '2px solid #fbbf24',
    borderRadius: '4px',
    color: 'white',
    fontSize: '18px',
    fontWeight: 700
  },
  gameLetterEmpty: {
    display: 'inline-block',
    padding: '6px 10px',
    minWidth: '32px',
    textAlign: 'center',
    borderBottom: '2px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.1)',
    fontSize: '18px',
    fontWeight: 700
  },
  gameLetters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  gameLetterBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },
  gameMessage: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 0'
  },
  gameProgress: {
    textAlign: 'center',
    fontSize: '9px',
    color: 'rgba(255,255,255,0.15)',
    marginTop: '4px'
  },
  
  // ===== GAME COMPLETE =====
  gameComplete: {
    textAlign: 'center',
    padding: '16px 0'
  },
  gameCompleteIcon: {
    fontSize: '48px',
    marginBottom: '8px'
  },
  gameCompleteTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: 'white'
  },
  gameCompleteScore: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '12px'
  },
  gameRestartBtn: {
    padding: '8px 24px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#0a0a1a',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer'
  },
  
  // ===== FOOTER =====
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.04)'
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center'
  },
  footerText: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.15)',
    fontWeight: 500
  },
  
  // ===== MODAL POSTER =====
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    animation: 'fadeUp 0.3s ease'
  },
  modalContent: {
    background: 'rgba(15,20,40,0.95)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '600px',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)'
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.1)'
    }
  },
  modalImageWrapper: {
    width: '100%',
    maxHeight: '280px',
    overflow: 'hidden'
  },
  modalImage: {
    width: '100%',
    height: '100%',
    maxHeight: '280px',
    objectFit: 'cover'
  },
  modalBody: {
    padding: '20px 24px 24px'
  },
  modalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '12px',
    background: 'rgba(243,156,18,0.1)',
    color: '#fbbf24',
    fontSize: '9px',
    fontWeight: 600,
    marginBottom: '8px'
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 800,
    color: 'white',
    letterSpacing: '-0.5px'
  },
  modalText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.8,
    margin: '8px 0 16px',
    whiteSpace: 'pre-wrap'
  },
  modalReadBtn: {
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#0a0a1a',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 16px rgba(243,156,18,0.2)'
    }
  }
};

export default LoginSiswa;