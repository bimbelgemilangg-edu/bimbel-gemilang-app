// src/pages/LoginSiswa.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [posters, setPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [rocketHover, setRocketHover] = useState(false);
  const [rocketClicked, setRocketClicked] = useState(false);
  
  // ============================================================
  // GAME STATE
  // ============================================================
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
  const [showGame, setShowGame] = useState(false);

  // ============================================================
  // PWA INSTALL
  // ============================================================
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const isDark = theme === 'dark';

  // ============================================================
  // AMBIL POSTER DARI FIRESTORE
  // ============================================================
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

  // ============================================================
  // PWA INSTALL
  // ============================================================
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) setIsInstalled(true);

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBtn(false);
    });

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !isStandalone) setShowInstallBtn(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS || !installPrompt) {
      alert(
        '📱 CARA INSTAL GEMILANG SUPER APP:\n\n' +
        '▶️ Pengguna iPhone (Safari):\n' +
        '1. Klik ikon [Bagikan/Share] (kotak panah ke atas di bawah layar).\n' +
        '2. Gulir ke bawah lalu klik "Add to Home Screen" (Tambahkan ke Layar Utama).\n' +
        '3. Klik "Add" di pojok kanan atas.\n\n' +
        '▶️ Pengguna Android (Chrome):\n' +
        'Klik tombol titik tiga (⋮) di pojok kanan atas browser → Pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".'
      );
      return;
    }

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallBtn(false);
    } catch (err) {
      console.log('Install dibatalkan:', err);
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================
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
          
          setRocketClicked(true);
          setTimeout(() => {
            alert(`Selamat Datang, ${studentData.nama}! 🚀`);
            navigate("/siswa/dashboard");
          }, 800);
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

  // ============================================================
  // GAME FUNCTIONS
  // ============================================================
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

    // Cek jawaban
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ 
      ...styles.container, 
      background: isDark 
        ? 'linear-gradient(135deg, #05070f 0%, #0d1b2a 30%, #1a0a2e 60%, #0a0e1a 100%)' 
        : 'linear-gradient(135deg, #f0f4f8 0%, #d4e4f7 40%, #e8f0fe 100%)' 
    }}>
      
      {/* BACKGROUND */}
      <div style={styles.background}>
        {isDark ? (
          <>
            <div style={styles.star1}></div>
            <div style={styles.star2}></div>
            <div style={styles.star3}></div>
            <div style={styles.star4}></div>
            <div style={styles.star5}></div>
            <div style={styles.star6}></div>
            <div style={styles.planet1}></div>
            <div style={styles.planet2}></div>
            <div style={styles.planet3}></div>
            <div style={styles.nebula}></div>
          </>
        ) : (
          <>
            <div style={styles.cloud1}></div>
            <div style={styles.cloud2}></div>
            <div style={styles.cloud3}></div>
            <div style={styles.sun}></div>
          </>
        )}
      </div>

      {/* MODAL POSTER */}
      {selectedPoster && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPoster(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPoster(null)} style={styles.modalClose}>✕</button>
            <img 
              src={selectedPoster.imageUrl} 
              alt={selectedPoster.title} 
              style={styles.modalImage} 
              onError={(e) => { e.target.src = 'https://placehold.co/600x300/1a1a3e/white?text=Gambar+Tidak+Tersedia'; }} 
            />
            <div style={styles.modalBody}>
              <h3 style={styles.modalTitle}>{selectedPoster.title}</h3>
              <p style={styles.modalText}>{selectedPoster.content || "Tidak ada deskripsi."}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <div style={{ 
        ...styles.card, 
        backgroundColor: isDark ? 'rgba(13, 22, 42, 0.75)' : 'rgba(255, 255, 255, 0.9)', 
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
      }}>
        
        {/* THEME TOGGLE */}
        <button 
          onClick={() => setTheme(isDark ? 'light' : 'dark')} 
          style={{ 
            ...styles.themeToggle, 
            color: isDark ? '#fbbf24' : '#1e293b',
            float: 'right',
            background: 'none',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isDark ? '☀️ Siang' : '🌙 Malam'}
        </button>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <img 
            src="/pwa-192x192.png" 
            alt="Logo" 
            style={{ width: 64, height: 64, borderRadius: '50%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} 
          />
          <h2 style={{ ...styles.title, color: isDark ? '#ffffff' : '#1e293b', margin: '8px 0 2px 0' }}>
            Bimbel Gemilang
          </h2>
          
          {/* ROKET */}
          <div 
            style={styles.rocketWrapper}
            onMouseEnter={() => setRocketHover(true)}
            onMouseLeave={() => setRocketHover(false)}
            onClick={() => setRocketClicked(!rocketClicked)}
          >
            <div style={{
              ...styles.rocket,
              transform: rocketHover ? 'scale(1.3) rotate(-15deg)' : rocketClicked ? 'scale(1.5) rotate(-25deg) translateY(-20px)' : 'scale(1) rotate(0deg)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              🚀
            </div>
            <span style={{
              ...styles.rocketText,
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              opacity: rocketHover || rocketClicked ? 1 : 0.4
            }}>
              {rocketClicked ? '✨ Eksplorasi Dimulai!' : 'Klik untuk Eksplorasi'}
            </span>
          </div>

          <p style={{ ...styles.slogan, color: isDark ? '#f39c12' : '#1a237e' }}>
            Mari Eksplorasi Ilmu di Galaksi Pengetahuan
          </p>
          <p style={{ ...styles.subtitle, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
            Portal Akademik & Evaluasi Siswa
          </p>
        </div>

        {/* INSTALL BUTTON */}
        {showInstallBtn && !isInstalled && (
          <button onClick={handleInstall} style={styles.installBtn}>
            📲 Instal Aplikasi Bimbel (PWA)
          </button>
        )}

        {/* FORM LOGIN */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={{ ...styles.label, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              👤 Username Siswa
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username Anda"
              style={{ 
                ...styles.input, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', 
                color: isDark ? '#ffffff' : '#1e293b', 
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1' 
              }}
              autoFocus
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={{ ...styles.label, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              🔑 Password PIN
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password PIN"
              style={{ 
                ...styles.input, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', 
                color: isDark ? '#ffffff' : '#1e293b', 
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1' 
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                flex: 2,
                transform: rocketClicked ? 'translateY(-10px) scale(0.95)' : rocketHover ? 'scale(1.02)' : 'scale(1)',
                opacity: loading ? 0.7 : 1,
                background: isDark ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'linear-gradient(135deg, #1a237e, #283593)'
              }}
            >
              {loading ? "⏳..." : "🚀 Masuk"}
            </button>
            
            <button
              type="button"
              onClick={startGame}
              style={{
                ...styles.submitBtn,
                flex: 1,
                background: isDark ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'linear-gradient(135deg, #6d28d9, #4c1d95)',
                fontSize: '13px',
                padding: '14px 10px'
              }}
            >
              🎮 Game
            </button>
          </div>
        </form>

        {/* INSTALLED BADGE */}
        {isInstalled && (
          <div style={styles.installedBadge}>✅ Aplikasi sudah terinstall</div>
        )}

        {/* ============================================================ */}
        {/* GAME SECTION */}
        {/* ============================================================ */}
        {showGame && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            borderRadius: 16,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ color: isDark ? '#fff' : '#1e293b', margin: 0, fontSize: 13, fontWeight: 700 }}>
                🎯 Susun Kata Astronot
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                  ⭐ {gameScore}
                </span>
                <button 
                  onClick={resetGame}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {gameComplete ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
                <h4 style={{ color: isDark ? '#fff' : '#1e293b', margin: 0 }}>Selamat! Kamu Hebat!</h4>
                <p style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                  Skor akhir: {gameScore} poin
                </p>
                <button 
                  onClick={startGame}
                  style={{
                    marginTop: 12,
                    padding: '8px 20px',
                    background: isDark ? '#f39c12' : '#1a237e',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Main Lagi
                </button>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 4 }}>
                    {gameWords[currentWordIndex].hint}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: isDark ? '#f39c12' : '#1a237e',
                    letterSpacing: 4
                  }}>
                    {selectedLetters.map((l, i) => (
                      <span key={i} style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        margin: '0 2px',
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        borderRadius: 4,
                        minWidth: 24,
                        textAlign: 'center'
                      }}>
                        {l}
                      </span>
                    ))}
                    {Array.from({ length: gameWords[currentWordIndex].word.length - selectedLetters.length }).map((_, i) => (
                      <span key={`empty-${i}`} style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        margin: '0 2px',
                        borderBottom: '2px solid ' + (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                        minWidth: 24,
                        textAlign: 'center',
                        color: 'transparent'
                      }}>
                        _
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {shuffledLetters.map((letter, index) => (
                    <button
                      key={index}
                      onClick={() => handleLetterClick(letter, index)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        border: isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(0,0,0,0.1)',
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'white',
                        color: isDark ? 'white' : '#1e293b',
                        fontSize: 20,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                        e.currentTarget.style.background = isDark ? 'rgba(243,156,18,0.2)' : 'rgba(26,35,126,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'white';
                      }}
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                {gameMessage && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: 10, 
                    fontSize: 13, 
                    fontWeight: 700,
                    color: gameMessage.includes('✅') ? '#10b981' : gameMessage.includes('🏆') ? '#f59e0b' : '#ef4444'
                  }}>
                    {gameMessage}
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 8,
                  fontSize: 10,
                  color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                }}>
                  <span>Kata {currentWordIndex + 1}/{gameWords.length}</span>
                  <span>💡 {gameWords[currentWordIndex].hint}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* POSTER SECTION */}
        {/* ============================================================ */}
        {posters.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>📢</span>
              <h4 style={{ color: isDark ? '#fff' : '#1e293b', fontSize: 11, margin: 0, fontWeight: 700 }}>
                Pengumuman & Poster
              </h4>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 8 }}>
                {posters.length}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: 10, 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch', 
              paddingBottom: 8,
              scrollbarWidth: 'thin',
              msOverflowStyle: 'auto'
            }}>
              {posters.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPoster(p)} 
                  style={{ 
                    flexShrink: 0,
                    width: '140px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <img 
                    src={p.imageUrl} 
                    alt={p.title} 
                    style={{ width: '100%', height: '75px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://placehold.co/140x75/1a1a3e/white?text=📷'; }}
                  />
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: 600, 
                      color: isDark ? 'white' : '#1a1a2e',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {p.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 8, color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}>
          Bimbel Gemilang · Glagahagung · v3.0
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
        }
        @keyframes orbitReverse {
          from { transform: rotate(0deg) translateX(70px) rotate(0deg); }
          to { transform: rotate(-360deg) translateX(70px) rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(80px); }
        }
        @keyframes sunPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(255,200,50,0.2); }
          50% { box-shadow: 0 0 80px rgba(255,200,50,0.5); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar {
          height: 3px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(243,156,18,0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(243,156,18,0.5);
        }
        .glass-card { animation: fadeUp 0.8s ease both; animation-delay: 0.2s; }
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
    transition: 'background 0.6s ease'
  },
  background: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
    zIndex: 1,
    overflow: 'hidden'
  },
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '440px',
    borderRadius: '24px',
    padding: '20px 22px 18px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    border: '1px solid',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    maxHeight: '96vh',
    overflowY: 'auto'
  },
  title: { fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' },
  slogan: { fontSize: '12px', fontWeight: 600, margin: '0 0 2px', letterSpacing: '0.3px' },
  subtitle: { fontSize: '10px', margin: '0 0 12px', letterSpacing: '0.5px' },
  
  rocketWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    margin: '2px 0',
    padding: '4px',
    borderRadius: '12px',
    transition: 'all 0.3s ease'
  },
  rocket: { fontSize: '28px', display: 'inline-block', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' },
  rocketText: { fontSize: '8px', fontWeight: 600, transition: 'all 0.3s ease', marginTop: '1px', letterSpacing: '0.5px' },
  
  installBtn: {
    width: '100%', padding: '8px',
    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    color: 'white', border: 'none', borderRadius: '10px',
    fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
    marginBottom: '12px', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
    transition: 'transform 0.2s'
  },
  installedBadge: {
    marginTop: '8px',
    padding: '4px 10px',
    borderRadius: '8px',
    background: 'rgba(46,213,115,0.1)',
    border: '1px solid rgba(46,213,115,0.15)',
    color: '#2ed573',
    fontSize: '10px',
    fontWeight: 600,
    textAlign: 'center'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '3px' },
  label: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: {
    padding: '10px 14px', borderRadius: '10px', border: '1px solid',
    fontSize: '13px', outline: 'none', transition: 'all 0.3s ease',
    width: '100%', boxSizing: 'border-box',
    ':focus': {
      borderColor: 'rgba(243,156,18,0.3)',
      boxShadow: '0 0 20px rgba(243,156,18,0.05)'
    }
  },
  submitBtn: {
    padding: '12px',
    color: '#0a0a1a',
    border: 'none', borderRadius: '12px',
    fontWeight: 800, fontSize: '14px', cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(243,156,18,0.15)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(243,156,18,0.25)'
    },
    ':disabled': { opacity: 0.6, cursor: 'not-allowed', transform: 'none' }
  },
  themeToggle: {
    background: 'none', border: 'none', fontSize: '11px',
    fontWeight: 600, cursor: 'pointer', outline: 'none',
    transition: 'all 0.3s ease',
    ':hover': { transform: 'scale(1.05)' }
  },
  
  // MODAL
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '20px'
  },
  modalContent: {
    background: 'rgba(15,20,40,0.95)',
    borderRadius: '20px', width: '100%',
    maxWidth: '520px', position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.06)',
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  modalClose: {
    position: 'absolute', top: '10px', right: '10px',
    background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
    borderRadius: '50%', width: '28px', height: '28px',
    cursor: 'pointer', fontSize: '14px', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  modalImage: { width: '100%', maxHeight: '240px', objectFit: 'cover' },
  modalBody: { padding: '16px 20px 20px' },
  modalTitle: { color: 'white', fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0' },
  modalText: { color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' },

  // BACKGROUND
  star1: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '15%', left: '20%', borderRadius: '50%', animation: 'twinkle 3s ease-in-out infinite' },
  star2: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '40%', left: '75%', borderRadius: '50%', opacity: 0.7, animation: 'twinkle 4s ease-in-out infinite 0.5s' },
  star3: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '70%', left: '10%', borderRadius: '50%', animation: 'twinkle 2.5s ease-in-out infinite 1s' },
  star4: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '25%', left: '55%', borderRadius: '50%', animation: 'twinkle 3.5s ease-in-out infinite 0.3s' },
  star5: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '60%', right: '20%', borderRadius: '50%', animation: 'twinkle 2.8s ease-in-out infinite 0.8s' },
  star6: { position: 'absolute', width: '4px', height: '4px', background: 'white', top: '10%', left: '40%', borderRadius: '50%', animation: 'twinkle 3.2s ease-in-out infinite 1.2s' },
  planet1: { position: 'absolute', width: '50px', height: '50px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #f39c12, #d35400)', top: '8%', right: '12%', opacity: 0.12, boxShadow: '0 0 60px rgba(243,156,18,0.06)', animation: 'orbit 30s linear infinite' },
  planet2: { position: 'absolute', width: '70px', height: '70px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #8b5cf6, #4c1d95)', bottom: '8%', left: '3%', opacity: 0.08, animation: 'orbitReverse 40s linear infinite' },
  planet3: { position: 'absolute', width: '30px', height: '30px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #2ed573, #1a8a4a)', top: '50%', right: '8%', opacity: 0.06, animation: 'orbit 20s linear infinite' },
  nebula: { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.03), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 8s ease-in-out infinite' },
  cloud1: { position: 'absolute', width: '180px', height: '50px', background: 'rgba(255,255,255,0.5)', borderRadius: '30px', top: '15%', left: '8%', filter: 'blur(2px)', animation: 'cloudFloat 25s ease-in-out infinite' },
  cloud2: { position: 'absolute', width: '220px', height: '60px', background: 'rgba(255,255,255,0.35)', borderRadius: '40px', bottom: '20%', right: '5%', filter: 'blur(2px)', animation: 'cloudFloat 30s ease-in-out infinite reverse' },
  cloud3: { position: 'absolute', width: '150px', height: '40px', background: 'rgba(255,255,255,0.3)', borderRadius: '25px', top: '45%', left: '2%', filter: 'blur(2px)', animation: 'cloudFloat 20s ease-in-out infinite 5s' },
  sun: { position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ffd700, #ff8c00)', top: '5%', right: '5%', opacity: 0.15, animation: 'sunPulse 4s ease-in-out infinite' }
};

export default LoginSiswa;