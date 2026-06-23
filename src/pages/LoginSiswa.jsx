// src/pages/LoginSiswa.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [posters, setPosters] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [theme, setTheme] = useState('dark');
  const [rocketHover, setRocketHover] = useState(false);
  const [rocketClicked, setRocketClicked] = useState(false);
  
  // PWA Install
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const isDark = theme === 'dark';

  // ============================================================
  // AMBIL DATA DARI FIRESTORE
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const qPoster = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
        const snapPoster = await getDocs(qPoster);
        const posterData = snapPoster.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosters(posterData.filter(p => p.targetPortal === "Siswa" || p.targetPortal === "Semua" || !p.targetPortal));

        const qSurvey = query(collection(db, "surveys"), where("status", "==", "aktif"));
        const snapSurvey = await getDocs(qSurvey);
        setSurveys(snapSurvey.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Gagal ambil data:", err);
      }
    };
    fetchData();
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
  // LOGIN (TETAP SAMA)
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
  // HANDLE SURVEY
  // ============================================================
  const handleSurveyChange = (index, value) => {
    setSurveyAnswers(prev => ({ ...prev, [index]: value }));
  };

  const handleSurveySubmit = () => {
    const allAnswered = selectedSurvey?.questions?.every((_, i) => surveyAnswers[i]?.trim());
    if (!allAnswered) {
      alert("Silakan isi semua pertanyaan survei terlebih dahulu!");
      return;
    }
    alert("✅ Terima kasih telah mengisi survei!");
    setSelectedSurvey(null);
    setSurveyAnswers({});
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
      
      {/* BACKGROUND GALAKSI / AWAN */}
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

      {/* MODAL POSTER - FULL BACA */}
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

      {/* MODAL SURVEI */}
      {selectedSurvey && (
        <div style={styles.modalOverlay} onClick={() => { setSelectedSurvey(null); setSurveyAnswers({}); }}>
          <div style={{...styles.modalContent, maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setSelectedSurvey(null); setSurveyAnswers({}); }} style={styles.modalClose}>✕</button>
            <div style={styles.modalBody}>
              <h3 style={styles.modalTitle}>📋 {selectedSurvey.title}</h3>
              <p style={{color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontSize: 11, marginBottom: 12}}>
                {selectedSurvey.targetType} · {selectedSurvey.isRequired ? '🔴 Wajib' : '🔵 Opsional'}
              </p>
              {selectedSurvey.questions?.map((q, i) => (
                <div key={i} style={{marginBottom: 12, padding: 12, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10}}>
                  <div style={{color: isDark ? 'white' : '#1e293b', fontSize: 13, fontWeight: 600, marginBottom: 6}}>
                    {i+1}. {q.question}
                  </div>
                  {q.type === 'teks' ? (
                    <textarea
                      value={surveyAnswers[i] || ""}
                      onChange={(e) => handleSurveyChange(i, e.target.value)}
                      placeholder="Tulis jawaban di sini..."
                      style={{ 
                        ...styles.input, 
                        padding: '10px 14px', 
                        fontSize: '13px', 
                        minHeight: '60px',
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', 
                        color: isDark ? '#fff' : '#000',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={surveyAnswers[i] || ""}
                      onChange={(e) => handleSurveyChange(i, e.target.value)}
                      placeholder="Pilih jawaban..." 
                      style={{ 
                        ...styles.input, 
                        padding: '10px 14px', 
                        fontSize: '13px', 
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', 
                        color: isDark ? '#fff' : '#000',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1'
                      }}
                    />
                  )}
                </div>
              ))}
              <button 
                onClick={handleSurveySubmit}
                style={{...styles.submitBtn, padding: '10px', fontSize: '13px', marginTop: '10px'}}
              >
                Kirim Jawaban
              </button>
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
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <img 
            src="/pwa-192x192.png" 
            alt="Logo" 
            style={{ width: 64, height: 64, borderRadius: '50%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} 
          />
          <h2 style={{ ...styles.title, color: isDark ? '#ffffff' : '#1e293b', margin: '8px 0 2px 0' }}>
            Bimbel Gemilang
          </h2>
          
          {/* ROKET EKSPLORASI */}
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
              opacity: rocketHover || rocketClicked ? 1 : 0.4,
              transition: 'all 0.3s ease'
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

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setRocketHover(true)}
            onMouseLeave={() => setRocketHover(false)}
            style={{
              ...styles.submitBtn,
              transform: rocketClicked ? 'translateY(-20px) scale(0.95)' : rocketHover ? 'scale(1.02)' : 'scale(1)',
              opacity: loading ? 0.7 : 1,
              background: isDark ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'linear-gradient(135deg, #1a237e, #283593)'
            }}
          >
            {loading ? "⏳ Menghubungkan..." : "🚀 Masuk Kelas"}
          </button>
        </form>

        {/* INSTALLED BADGE */}
        {isInstalled && (
          <div style={styles.installedBadge}>✅ Aplikasi sudah terinstall</div>
        )}

        {/* POSTER - HORIZONTAL SCROLL DENGAN GAMBAR */}
        {posters.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>📢</span>
              <h4 style={{ color: isDark ? '#fff' : '#1e293b', fontSize: 12, margin: 0, fontWeight: 700 }}>
                Pengumuman & Poster Terbaru
              </h4>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>
                {posters.length}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch', 
              paddingBottom: 10,
              scrollbarWidth: 'thin',
              msOverflowStyle: 'auto'
            }}>
              {posters.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPoster(p)} 
                  style={{ 
                    flexShrink: 0,
                    width: '160px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <img 
                    src={p.imageUrl} 
                    alt={p.title} 
                    style={{ width: '100%', height: '90px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://placehold.co/160x90/1a1a3e/white?text=📷'; }}
                  />
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: isDark ? 'white' : '#1a1a2e',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {p.title}
                    </div>
                    <div style={{ 
                      fontSize: '9px', 
                      color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      marginTop: 2
                    }}>
                      {p.createdAt?.toDate?.()?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) || 'Baru'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SURVEI - HORIZONTAL SCROLL */}
        {surveys.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>📋</span>
              <h4 style={{ color: isDark ? '#fff' : '#1e293b', fontSize: 12, margin: 0, fontWeight: 700 }}>
                Survei Siswa Aktif
              </h4>
              <span style={{ fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                {surveys.length}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: 10, 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch', 
              paddingBottom: 8,
              scrollbarWidth: 'thin'
            }}>
              {surveys.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedSurvey(s)} 
                  style={{ 
                    flexShrink: 0,
                    padding: '10px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    maxWidth: '200px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
                    📝 {s.title}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {s.questions?.length || 0} pertanyaan
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 9, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }}>
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
        .poster-scroll { animation: fadeUp 0.8s ease both; animation-delay: 0.4s; }
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
    padding: '24px 24px 20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    border: '1px solid',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    maxHeight: '95vh',
    overflowY: 'auto'
  },
  title: { fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' },
  slogan: { fontSize: '13px', fontWeight: 600, margin: '0 0 2px', letterSpacing: '0.3px' },
  subtitle: { fontSize: '11px', margin: '0 0 14px', letterSpacing: '0.5px' },
  
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
  rocket: {
    fontSize: '32px',
    display: 'inline-block',
    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  rocketText: {
    fontSize: '8px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    marginTop: '1px',
    letterSpacing: '0.5px'
  },
  
  installBtn: {
    width: '100%', padding: '10px',
    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    color: 'white', border: 'none', borderRadius: '12px',
    fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
    marginBottom: '14px', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
    transition: 'transform 0.2s'
  },
  installedBadge: {
    marginTop: '10px',
    padding: '6px 12px',
    borderRadius: '10px',
    background: 'rgba(46,213,115,0.1)',
    border: '1px solid rgba(46,213,115,0.15)',
    color: '#2ed573',
    fontSize: '11px',
    fontWeight: 600,
    textAlign: 'center'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: {
    padding: '12px 16px', borderRadius: '12px', border: '1px solid',
    fontSize: '14px', outline: 'none', transition: 'all 0.3s ease',
    width: '100%', boxSizing: 'border-box',
    ':focus': {
      borderColor: 'rgba(243,156,18,0.3)',
      boxShadow: '0 0 20px rgba(243,156,18,0.05)'
    }
  },
  submitBtn: {
    padding: '14px',
    color: '#0a0a1a',
    border: 'none', borderRadius: '14px',
    fontWeight: 800, fontSize: '15px', cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(243,156,18,0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginTop: '4px',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(243,156,18,0.3)'
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none'
    }
  },
  themeToggle: {
    background: 'none', border: 'none', fontSize: '12px',
    fontWeight: 600, cursor: 'pointer', outline: 'none',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'scale(1.05)'
    }
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
    maxWidth: '540px', position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.06)',
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  modalClose: {
    position: 'absolute', top: '12px', right: '12px',
    background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
    borderRadius: '50%', width: '32px', height: '32px',
    cursor: 'pointer', fontSize: '16px', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      background: 'rgba(0,0,0,0.7)'
    }
  },
  modalImage: {
    width: '100%',
    maxHeight: '280px',
    objectFit: 'cover'
  },
  modalBody: { padding: '20px 24px 24px' },
  modalTitle: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 8px 0'
  },
  modalText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    lineHeight: 1.8,
    margin: 0,
    whiteSpace: 'pre-wrap'
  },

  // BACKGROUND - MALAM (BINTANG & PLANET)
  star1: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '15%', left: '20%', borderRadius: '50%', animation: 'twinkle 3s ease-in-out infinite' },
  star2: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '40%', left: '75%', borderRadius: '50%', opacity: 0.7, animation: 'twinkle 4s ease-in-out infinite 0.5s' },
  star3: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '70%', left: '10%', borderRadius: '50%', animation: 'twinkle 2.5s ease-in-out infinite 1s' },
  star4: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '25%', left: '55%', borderRadius: '50%', animation: 'twinkle 3.5s ease-in-out infinite 0.3s' },
  star5: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '60%', right: '20%', borderRadius: '50%', animation: 'twinkle 2.8s ease-in-out infinite 0.8s' },
  star6: { position: 'absolute', width: '4px', height: '4px', background: 'white', top: '10%', left: '40%', borderRadius: '50%', animation: 'twinkle 3.2s ease-in-out infinite 1.2s' },
  planet1: { position: 'absolute', width: '50px', height: '50px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #f39c12, #d35400)', top: '8%', right: '12%', opacity: 0.12, boxShadow: '0 0 60px rgba(243,156,18,0.06)', animation: 'orbit 30s linear infinite' },
  planet2: { position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #8b5cf6, #4c1d95)', bottom: '8%', left: '3%', opacity: 0.08, boxShadow: '0 0 80px rgba(139,92,246,0.04)', animation: 'orbitReverse 40s linear infinite' },
  planet3: { position: 'absolute', width: '35px', height: '35px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #2ed573, #1a8a4a)', top: '50%', right: '8%', opacity: 0.06, animation: 'orbit 20s linear infinite' },
  nebula: { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.03), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 8s ease-in-out infinite' },

  // BACKGROUND - SIANG (AWAN & MATAHARI)
  cloud1: { position: 'absolute', width: '180px', height: '50px', background: 'rgba(255,255,255,0.5)', borderRadius: '30px', top: '15%', left: '8%', filter: 'blur(2px)', animation: 'cloudFloat 25s ease-in-out infinite' },
  cloud2: { position: 'absolute', width: '220px', height: '60px', background: 'rgba(255,255,255,0.35)', borderRadius: '40px', bottom: '20%', right: '5%', filter: 'blur(2px)', animation: 'cloudFloat 30s ease-in-out infinite reverse' },
  cloud3: { position: 'absolute', width: '150px', height: '40px', background: 'rgba(255,255,255,0.3)', borderRadius: '25px', top: '45%', left: '2%', filter: 'blur(2px)', animation: 'cloudFloat 20s ease-in-out infinite 5s' },
  sun: { position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ffd700, #ff8c00)', top: '5%', right: '5%', opacity: 0.15, animation: 'sunPulse 4s ease-in-out infinite' }
};

export default LoginSiswa;