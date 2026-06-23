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
            alert(`Selamat Datang, ${studentData.nama}!`);
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
  // RENDER
  // ============================================================
  return (
    <div style={{ 
      ...styles.container, 
      background: isDark 
        ? 'linear-gradient(135deg, #05070f 0%, #0d1b2a 30%, #1a0a2e 60%, #0a0e1a 100%)' 
        : 'linear-gradient(135deg, #f0f4f8 0%, #d4e4f7 40%, #e8f0fe 100%)' 
    }}>
      
      {/* Background */}
      <div style={styles.background}>
        {isDark ? (
          <>
            <div style={styles.star1}></div>
            <div style={styles.star2}></div>
            <div style={styles.star3}></div>
            <div style={styles.star4}></div>
            <div style={styles.planet1}></div>
            <div style={styles.planet2}></div>
            <div style={styles.nebula}></div>
          </>
        ) : (
          <>
            <div style={styles.cloud1}></div>
            <div style={styles.cloud2}></div>
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

      {/* MODAL SURVEI */}
      {selectedSurvey && (
        <div style={styles.modalOverlay} onClick={() => setSelectedSurvey(null)}>
          <div style={{...styles.modalContent, maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedSurvey(null)} style={styles.modalClose}>✕</button>
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
                  <input 
                    type="text" 
                    placeholder="Isi jawaban survei di sini..." 
                    style={{ 
                      ...styles.input, 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', 
                      color: isDark ? '#fff' : '#000',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1'
                    }}
                  />
                </div>
              ))}
              <button 
                onClick={() => { 
                  alert('Terima kasih telah mengisi survei!'); 
                  setSelectedSurvey(null); 
                }} 
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
        
        {/* Theme Toggle */}
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

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 15 }}>
          <img 
            src="/pwa-192x192.png" 
            alt="Logo" 
            style={{ width: 64, height: 64, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
          />
          <h2 style={{ ...styles.title, color: isDark ? '#ffffff' : '#1e293b', margin: '10px 0 2px 0' }}>
            Bimbel Gemilang
          </h2>
          <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12, margin: 0 }}>
            Portal Akademik & Evaluasi Siswa
          </p>
        </div>

        {/* Install Button PWA */}
        {showInstallBtn && !isInstalled && (
          <button onClick={handleInstall} style={styles.installBtn}>
            📲 Instal Aplikasi Bimbel (PWA)
          </button>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={{ ...styles.label, color: isDark ? '#94a3b8' : '#475569' }}>
              Username Siswa
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
            <label style={{ ...styles.label, color: isDark ? '#94a3b8' : '#475569' }}>
              Password PIN
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
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Menghubungkan..." : "Masuk Kelas 🚀"}
          </button>
        </form>

        {/* POSTER / BERITA - HORIZONTAL SCROLL */}
        {posters.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 15, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0' }}>
            <h4 style={{ color: isDark ? '#fff' : '#1e293b', fontSize: 12, margin: '0 0 10px 0' }}>
              📢 Pengumuman & Poster Terbaru:
            </h4>
            <div style={{ 
              display: 'flex', 
              gap: 10, 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch', 
              paddingBottom: '8px',
              scrollbarWidth: 'thin',
              msOverflowStyle: 'auto'
            }}>
              {posters.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPoster(p)} 
                  style={{ 
                    ...styles.badge, 
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0', 
                    color: isDark ? '#cbd5e1' : '#334155',
                    flexShrink: 0,
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🖼️ {p.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SURVEI AKTIF - HORIZONTAL SCROLL */}
        {surveys.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <h4 style={{ color: isDark ? '#fff' : '#1e293b', fontSize: 12, margin: '0 0 10px 0' }}>
              📋 Survei Siswa Aktif:
            </h4>
            <div style={{ 
              display: 'flex', 
              gap: 10, 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch', 
              paddingBottom: '8px',
              scrollbarWidth: 'thin',
              msOverflowStyle: 'auto'
            }}>
              {surveys.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedSurvey(s)} 
                  style={{ 
                    ...styles.badge, 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: '#10b981', 
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    flexShrink: 0,
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📝 {s.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
          Bimbel Gemilang · Glagahagung · v2.0
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
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(60px); }
        }
        @keyframes sunPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(255,200,50,0.3); }
          50% { box-shadow: 0 0 80px rgba(255,200,50,0.6); }
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
    boxSizing: 'border-box'
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
    maxWidth: '420px',
    borderRadius: '24px',
    padding: '28px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    border: '1px solid',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease'
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.5px'
  },
  installBtn: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    marginBottom: '15px',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    transition: 'transform 0.2s'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600'
  },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box'
  },
  submitBtn: {
    padding: '14px',
    background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  themeToggle: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none'
  },
  badge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 0.7
    }
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalContent: {
    background: '#111827',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '550px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  modalClose: {
    position: 'absolute',
    top: '12px', right: '12px',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '28px', height: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    zIndex: 10
  },
  modalImage: {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover'
  },
  modalBody: {
    padding: '20px'
  },
  modalTitle: {
    color: 'white',
    fontSize: '18px',
    margin: '0 0 8px 0',
    fontWeight: '700'
  },
  modalText: {
    color: '#9ca3af',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: 0,
    whiteSpace: 'pre-wrap'
  },
  // Bintang & Planet (Malam)
  star1: { 
    position: 'absolute', 
    width: '2px', height: '2px', 
    background: 'white', 
    top: '15%', left: '20%', 
    borderRadius: '50%',
    animation: 'twinkle 3s ease-in-out infinite'
  },
  star2: { 
    position: 'absolute', 
    width: '3px', height: '3px', 
    background: 'white', 
    top: '40%', left: '75%', 
    borderRadius: '50%', 
    opacity: 0.7,
    animation: 'twinkle 4s ease-in-out infinite 0.5s'
  },
  star3: {
    position: 'absolute',
    width: '2px', height: '2px',
    background: 'white',
    top: '70%', left: '10%',
    borderRadius: '50%',
    animation: 'twinkle 2.5s ease-in-out infinite 1s'
  },
  star4: {
    position: 'absolute',
    width: '3px', height: '3px',
    background: 'white',
    top: '25%', left: '55%',
    borderRadius: '50%',
    animation: 'twinkle 3.5s ease-in-out infinite 0.3s'
  },
  planet1: { 
    position: 'absolute', 
    width: '40px', height: '40px', 
    borderRadius: '50%', 
    background: 'radial-gradient(circle at 30% 30%, #f39c12, #d35400)', 
    top: '10%', right: '15%', 
    opacity: 0.15,
    animation: 'orbit 30s linear infinite'
  },
  planet2: {
    position: 'absolute',
    width: '60px', height: '60px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #8b5cf6, #4c1d95)',
    bottom: '15%', left: '5%',
    opacity: 0.1,
    animation: 'orbit 40s linear infinite reverse'
  },
  nebula: { 
    position: 'absolute', 
    width: '200px', height: '200px', 
    borderRadius: '50%', 
    background: 'radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)',
    top: '-40px', left: '-40px', 
    animation: 'pulse 8s ease-in-out infinite'
  },
  // Awan & Matahari (Siang)
  cloud1: { 
    position: 'absolute', 
    width: '120px', height: '40px', 
    background: 'rgba(255,255,255,0.5)', 
    borderRadius: '20px', 
    top: '20%', left: '10%', 
    filter: 'blur(2px)',
    animation: 'cloudFloat 25s ease-in-out infinite'
  },
  cloud2: {
    position: 'absolute',
    width: '160px', height: '50px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '25px',
    bottom: '25%', right: '10%',
    filter: 'blur(2px)',
    animation: 'cloudFloat 30s ease-in-out infinite reverse'
  },
  sun: { 
    position: 'absolute', 
    width: '60px', height: '60px', 
    borderRadius: '50%', 
    background: 'radial-gradient(circle at 30% 30%, #ffd700, #ff8c00)', 
    top: '10%', right: '10%', 
    opacity: 0.3,
    animation: 'sunPulse 4s ease-in-out infinite'
  }
};

export default LoginSiswa;