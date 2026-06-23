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
        // Poster
        const qPoster = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
        const snapPoster = await getDocs(qPoster);
        const posterData = snapPoster.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosters(posterData.filter(p => p.targetPortal === "Siswa" || p.targetPortal === "Semua" || !p.targetPortal));

        // Survei Aktif
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
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
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
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      alert(
        '📱 Cara install:\n\n' +
        'Android (Chrome):\n' +
        'Klik ⋮ → "Tambahkan ke Layar Utama"\n\n' +
        'iPhone (Safari):\n' +
        'Klik 🗳️ (Share) → "Add to Home Screen"\n\n' +
        'Laptop (Chrome/Edge):\n' +
        'Klik ikon ⊕ di address bar'
      );
      return;
    }
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
      }
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
          alert(`Selamat Datang, ${studentData.nama}!`);
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ ...styles.container, background: isDark ? 'linear-gradient(135deg, #05070f 0%, #0d1b2a 30%, #1a0a2e 60%, #0a0e1a 100%)' : 'linear-gradient(135deg, #f0f4f8 0%, #d4e4f7 40%, #e8f0fe 100%)' }}>
      
      {/* Background */}
      <div style={styles.background}>
        {isDark ? (
          // 🌙 MALAM: Bintang + Planet
          <>
            <div style={styles.star1}></div>
            <div style={styles.star2}></div>
            <div style={styles.star3}></div>
            <div style={styles.star4}></div>
            <div style={styles.star5}></div>
            <div style={styles.star6}></div>
            <div style={styles.star7}></div>
            <div style={styles.star8}></div>
            <div style={styles.planet1}></div>
            <div style={styles.planet2}></div>
            <div style={styles.planet3}></div>
            <div style={styles.nebula}></div>
          </>
        ) : (
          // ☀️ SIANG: Awan
          <>
            <div style={styles.cloud1}></div>
            <div style={styles.cloud2}></div>
            <div style={styles.cloud3}></div>
            <div style={styles.sun}></div>
          </>
        )}
      </div>

      {/* Modal Poster */}
      {selectedPoster && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPoster(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPoster(null)} style={styles.modalClose}>✕</button>
            <img src={selectedPoster.imageUrl} alt={selectedPoster.title} style={styles.modalImage} onError={(e) => { e.target.src = 'https://placehold.co/600x300/1a1a3e/white?text=Gambar+Tidak+Tersedia'; }} />
            <div style={styles.modalBody}>
              <h3 style={styles.modalTitle}>{selectedPoster.title}</h3>
              <p style={styles.modalText}>{selectedPoster.content || "Tidak ada deskripsi."}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Survey */}
      {selectedSurvey && (
        <div style={styles.modalOverlay} onClick={() => setSelectedSurvey(null)}>
          <div style={{...styles.modalContent, maxWidth: '480px'}} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedSurvey(null)} style={styles.modalClose}>✕</button>
            <div style={styles.modalBody}>
              <h3 style={styles.modalTitle}>📋 {selectedSurvey.title}</h3>
              <p style={{color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 12}}>
                {selectedSurvey.targetType} · {selectedSurvey.isRequired ? '🔴 Wajib' : '🔵 Opsional'}
              </p>
              {selectedSurvey.questions?.map((q, i) => (
                <div key={i} style={{marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8}}>
                  <div style={{color: 'white', fontSize: 12, fontWeight: 600, marginBottom: 4}}>{i+1}. {q.question}</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 3}}>
                    {q.options?.filter(o => o).map((opt, oi) => (
                      <div key={oi} style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)'}}>
                        <span>○</span> {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p style={{color: 'rgba(255,255,255,0.2)', fontSize: 10}}>Silakan login untuk mengisi survei</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={styles.mainWrapper}>
        
        {/* LEFT: Login Card */}
        <div style={{...styles.glassCard, background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)' }}>
          
          {/* Theme Toggle */}
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={styles.themeToggle}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Logo */}
          <div style={styles.logoArea}>
            <img 
              src="/pwa-192x192.png" 
              alt="Logo Bimbel Gemilang" 
              style={styles.logo}
            />
          </div>

          <h1 style={{...styles.title, color: isDark ? 'white' : '#1a1a2e' }}>🚀 Portal Siswa</h1>
          
          {/* Rocket Animation */}
          <div 
            style={styles.rocketWrapper}
            onMouseEnter={() => setRocketHover(true)}
            onMouseLeave={() => setRocketHover(false)}
            onClick={() => setRocketClicked(!rocketClicked)}
          >
            <div style={{...styles.rocket, transform: rocketHover ? 'scale(1.3) rotate(-15deg)' : rocketClicked ? 'scale(1.5) rotate(-25deg) translateY(-20px)' : 'scale(1) rotate(0deg)' }}>
              🚀
            </div>
            <span style={{...styles.rocketText, opacity: rocketHover || rocketClicked ? 1 : 0.4 }}>
              {rocketClicked ? '✨ Eksplorasi Dimulai!' : 'Klik untuk Eksplorasi'}
            </span>
          </div>

          <p style={{...styles.slogan, color: isDark ? '#f39c12' : '#1a237e' }}>
            Mari Eksplorasi Ilmu di Galaksi Pengetahuan
          </p>
          <p style={{...styles.subtitle, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
            Bimbel Gemilang · Glagahagung
          </p>

          {/* Form Login */}
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={{...styles.label, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>👤 Username</label>
              <input 
                type="text" 
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{...styles.input, color: isDark ? 'white' : '#1a1a2e', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={{...styles.label, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>🔑 Password</label>
              <input 
                type="password" 
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{...styles.input, color: isDark ? 'white' : '#1a1a2e', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
              />
            </div>
            
            <button type="submit" disabled={loading} style={{...styles.btnLogin, background: isDark ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'linear-gradient(135deg, #1a237e, #283593)' }}>
              {loading ? "⏳ Memproses..." : "🌌 Masuk ke Galaksi"}
            </button>
          </form>

          {/* PWA Install */}
          {!isInstalled && showInstallBtn && (
            <div style={styles.installArea}>
              <button onClick={handleInstall} style={{...styles.btnInstall, color: isDark ? 'white' : '#1a1a2e' }}>📱 Install Aplikasi</button>
            </div>
          )}
          {!isInstalled && !showInstallBtn && (
            <div style={styles.installArea}>
              <button onClick={handleInstall} style={{...styles.btnInstallOutline, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>📲 Cara Install di HP</button>
            </div>
          )}
          {isInstalled && (
            <div style={styles.installedBadge}>✅ Aplikasi sudah terinstall</div>
          )}

          <div style={{...styles.footer, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)' }}>
            <small>Lupa password? Hubungi Admin.</small>
          </div>
        </div>

        {/* RIGHT: Poster Panel */}
        <div style={{...styles.posterPanel, background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)' }}>
          <div style={styles.posterHeader}>
            <span style={styles.posterIcon}>📡</span>
            <span style={{...styles.posterTitle, color: isDark ? 'white' : '#1a1a2e' }}>Sinyal Berita & Pengumuman</span>
            <span style={styles.posterCount}>{posters.length}</span>
          </div>
          
          {/* Survey Alert */}
          {surveys.length > 0 && (
            <div style={{...styles.surveyAlert, background: isDark ? 'rgba(243,156,18,0.08)' : 'rgba(26,35,126,0.06)', border: isDark ? '1px solid rgba(243,156,18,0.2)' : '1px solid rgba(26,35,126,0.1)' }}>
              <span style={styles.surveyAlertIcon}>📋</span>
              <span style={{...styles.surveyAlertText, color: isDark ? '#f39c12' : '#1a237e' }}>
                {surveys.length} survei aktif! Klik untuk lihat
              </span>
              <button onClick={() => setSelectedSurvey(surveys[0])} style={styles.surveyAlertBtn}>Lihat</button>
            </div>
          )}

          <div style={styles.posterList}>
            {posters.length === 0 ? (
              <div style={styles.emptyPoster}>
                <span style={styles.emptyIcon}>🛸</span>
                <p style={styles.emptyText}>Belum ada pengumuman</p>
                <p style={styles.emptySub}>Pantau terus ya!</p>
              </div>
            ) : (
              posters.map((p) => (
                <div 
                  key={p.id} 
                  style={{...styles.posterItem, border: isDark ? '1px solid transparent' : '1px solid rgba(0,0,0,0.04)' }}
                  onClick={() => setSelectedPoster(p)}
                >
                  <img 
                    src={p.imageUrl} 
                    alt={p.title} 
                    style={styles.posterThumb} 
                    onError={(e) => { e.target.src = 'https://placehold.co/80x80/1a1a3e/white?text=📷'; }}
                  />
                  <div style={styles.posterInfo}>
                    <div style={{...styles.posterName, color: isDark ? 'white' : '#1a1a2e' }}>{p.title}</div>
                    <div style={{...styles.posterDate, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>
                      {p.createdAt?.toDate?.()?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Baru'}
                    </div>
                    {p.content && (
                      <div style={{...styles.posterPreview, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                        {p.content.substring(0, 60)}...
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(140px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
        }
        @keyframes orbitReverse {
          from { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          to { transform: rotate(-360deg) translateX(100px) rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(60px); }
        }
        @keyframes sunPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(255,200,50,0.3); }
          50% { box-shadow: 0 0 80px rgba(255,200,50,0.6); }
        }
        @keyframes rocketLaunch {
          0% { transform: scale(1) rotate(0deg) translateY(0); }
          50% { transform: scale(1.5) rotate(-25deg) translateY(-30px); }
          100% { transform: scale(1.5) rotate(-25deg) translateY(-20px); }
        }
        .glass-card { animation: fadeUp 0.8s ease both; animation-delay: 0.2s; }
        .poster-panel { animation: fadeUp 0.8s ease both; animation-delay: 0.4s; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(243,156,18,0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(243,156,18,0.5); }
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 0.6s ease',
  },

  background: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },

  // 🌙 MALAM - Bintang & Planet
  star1: { position: 'absolute', width: '3px', height: '3px', background: 'white', borderRadius: '50%', top: '8%', left: '12%', animation: 'twinkle 3s ease-in-out infinite' },
  star2: { position: 'absolute', width: '4px', height: '4px', background: 'white', borderRadius: '50%', top: '18%', right: '20%', animation: 'twinkle 4s ease-in-out infinite 0.5s' },
  star3: { position: 'absolute', width: '2px', height: '2px', background: 'white', borderRadius: '50%', bottom: '25%', left: '25%', animation: 'twinkle 2.5s ease-in-out infinite 1s' },
  star4: { position: 'absolute', width: '5px', height: '5px', background: 'white', borderRadius: '50%', top: '55%', right: '8%', animation: 'twinkle 3.5s ease-in-out infinite 0.3s' },
  star5: { position: 'absolute', width: '3px', height: '3px', background: 'white', borderRadius: '50%', bottom: '12%', right: '35%', animation: 'twinkle 2.8s ease-in-out infinite 0.8s' },
  star6: { position: 'absolute', width: '4px', height: '4px', background: 'white', borderRadius: '50%', top: '35%', left: '4%', animation: 'twinkle 3.2s ease-in-out infinite 1.2s' },
  star7: { position: 'absolute', width: '2px', height: '2px', background: 'white', borderRadius: '50%', bottom: '40%', left: '50%', animation: 'twinkle 2.2s ease-in-out infinite 0.6s' },
  star8: { position: 'absolute', width: '3px', height: '3px', background: 'white', borderRadius: '50%', top: '75%', right: '55%', animation: 'twinkle 3.8s ease-in-out infinite 1.5s' },
  planet1: { position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #f39c12, #d35400)', top: '10%', right: '5%', opacity: 0.12, boxShadow: '0 0 80px rgba(243,156,18,0.08)', animation: 'orbit 30s linear infinite' },
  planet2: { position: 'absolute', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #8b5cf6, #4c1d95)', bottom: '5%', left: '2%', opacity: 0.08, boxShadow: '0 0 100px rgba(139,92,246,0.06)', animation: 'orbitReverse 40s linear infinite' },
  planet3: { position: 'absolute', width: '60px', height: '60px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #2ed573, #1a8a4a)', top: '50%', right: '15%', opacity: 0.06, animation: 'orbit 20s linear infinite' },
  nebula: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 8s ease-in-out infinite' },

  // ☀️ SIANG - Awan & Matahari
  cloud1: { position: 'absolute', width: '200px', height: '60px', background: 'rgba(255,255,255,0.6)', borderRadius: '100px', top: '15%', left: '10%', animation: 'cloudFloat 25s ease-in-out infinite', filter: 'blur(2px)' },
  cloud2: { position: 'absolute', width: '300px', height: '80px', background: 'rgba(255,255,255,0.4)', borderRadius: '100px', top: '25%', right: '15%', animation: 'cloudFloat 30s ease-in-out infinite reverse', filter: 'blur(3px)' },
  cloud3: { position: 'absolute', width: '250px', height: '70px', background: 'rgba(255,255,255,0.3)', borderRadius: '100px', bottom: '30%', left: '5%', animation: 'cloudFloat 20s ease-in-out infinite 5s', filter: 'blur(2px)' },
  sun: { position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ffd700, #ff8c00)', top: '5%', right: '10%', opacity: 0.15, animation: 'sunPulse 4s ease-in-out infinite' },

  // Main
  mainWrapper: {
    display: 'flex',
    gap: '28px',
    alignItems: 'stretch',
    maxWidth: '1100px',
    width: '100%',
    zIndex: 1,
    position: 'relative',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  // Glass Card
  glassCard: {
    flex: '1',
    minWidth: '300px',
    maxWidth: '420px',
    padding: '32px 28px 24px',
    borderRadius: '24px',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    position: 'relative',
  },

  themeToggle: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'scale(1.1)',
      background: 'rgba(255,255,255,0.06)',
    },
  },

  logoArea: { marginBottom: '12px' },
  logo: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: '2px solid rgba(243,156,18,0.25)',
    boxShadow: '0 0 40px rgba(243,156,18,0.15)',
    objectFit: 'cover',
  },

  title: {
    fontSize: '26px',
    fontWeight: 800,
    margin: '0 0 2px',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
  },

  rocketWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    margin: '6px 0 4px',
    padding: '8px',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
  },
  rocket: {
    fontSize: '40px',
    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    display: 'inline-block',
  },
  rocketText: {
    fontSize: '9px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    marginTop: '2px',
    letterSpacing: '0.5px',
  },

  slogan: {
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 2px',
    textShadow: '0 0 30px rgba(243,156,18,0.1)',
    letterSpacing: '0.3px',
  },
  subtitle: {
    fontSize: '12px',
    margin: '0 0 20px',
    letterSpacing: '0.5px',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  inputGroup: { textAlign: 'left' },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    marginBottom: '4px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    ':focus': {
      borderColor: 'rgba(243,156,18,0.3)',
      boxShadow: '0 0 20px rgba(243,156,18,0.05)',
    },
    '::placeholder': {
      color: 'rgba(255,255,255,0.2)',
    },
  },

  btnLogin: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    color: '#0a0a1a',
    fontWeight: 800,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 30px rgba(243,156,18,0.2)',
    marginTop: '2px',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(243,156,18,0.3)',
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },

  installArea: { marginTop: '14px' },
  btnInstall: {
    width: '100%',
    padding: '10px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      background: 'rgba(255,255,255,0.05)',
    },
  },
  btnInstallOutline: {
    width: '100%',
    padding: '10px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(255,255,255,0.01)',
    fontWeight: 500,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      background: 'rgba(255,255,255,0.03)',
    },
  },
  installedBadge: {
    marginTop: '12px',
    padding: '6px 12px',
    borderRadius: '10px',
    background: 'rgba(46,213,115,0.1)',
    border: '1px solid rgba(46,213,115,0.15)',
    color: '#2ed573',
    fontSize: '11px',
    fontWeight: 600,
  },

  footer: { marginTop: '16px', fontSize: '11px' },

  // Poster Panel
  posterPanel: {
    flex: '1',
    minWidth: '280px',
    maxWidth: '380px',
    padding: '18px 16px',
    borderRadius: '24px',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.3)',
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background 0.6s ease',
  },
  posterHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    marginBottom: '12px',
    flexShrink: 0,
  },
  posterIcon: { fontSize: '18px' },
  posterTitle: {
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.3px',
    flex: 1,
  },
  posterCount: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.04)',
    padding: '2px 10px',
    borderRadius: '20px',
    fontWeight: 600,
  },

  surveyAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '10px',
    marginBottom: '12px',
    flexShrink: 0,
  },
  surveyAlertIcon: { fontSize: '16px' },
  surveyAlertText: { fontSize: '11px', fontWeight: 600, flex: 1 },
  surveyAlertBtn: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(243,156,18,0.2)',
    color: '#f39c12',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  posterList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingRight: '4px',
    minHeight: 0,
  },
  posterItem: {
    display: 'flex',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      background: 'rgba(255,255,255,0.05)',
      transform: 'translateX(4px)',
    },
  },
  posterThumb: {
    width: '56px',
    height: '56px',
    borderRadius: '10px',
    objectFit: 'cover',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.04)',
  },
  posterInfo: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 },
  posterName: { fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  posterDate: { fontSize: '9px', marginTop: '1px' },
  posterPreview: { fontSize: '10px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  emptyPoster: { textAlign: 'center', padding: '30px 20px' },
  emptyIcon: { fontSize: '36px', display: 'block', marginBottom: '8px' },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 },
  emptySub: { color: 'rgba(255,255,255,0.15)', fontSize: '11px', margin: '2px 0 0' },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  modalContent: {
    background: 'rgba(15,20,40,0.95)',
    borderRadius: '20px',
    maxWidth: '540px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)',
    position: 'relative',
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': { background: 'rgba(0,0,0,0.7)' },
  },
  modalImage: { width: '100%', maxHeight: '260px', objectFit: 'cover' },
  modalBody: { padding: '20px 24px 24px' },
  modalTitle: { color: 'white', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' },
  modalText: { color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' },
};

export default LoginSiswa;