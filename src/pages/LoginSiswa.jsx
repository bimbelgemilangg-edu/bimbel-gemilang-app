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
  
  // PWA Install
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // ============================================================
  // AMBIL POSTER DARI FIRESTORE
  // ============================================================
  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter hanya yang targetnya "Siswa" atau "Semua"
        const filtered = data.filter(p => p.targetPortal === "Siswa" || p.targetPortal === "Semua" || !p.targetPortal);
        setPosters(filtered.slice(0, 5));
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
    <div style={styles.container}>
      {/* Background dengan bintang & planet */}
      <div style={styles.background}>
        <div style={styles.star1}></div>
        <div style={styles.star2}></div>
        <div style={styles.star3}></div>
        <div style={styles.star4}></div>
        <div style={styles.star5}></div>
        <div style={styles.star6}></div>
        <div style={styles.star7}></div>
        <div style={styles.planet1}></div>
        <div style={styles.planet2}></div>
      </div>

      {/* Modal Poster */}
      {selectedPoster && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPoster(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPoster(null)} style={styles.modalClose}>✕</button>
            <img src={selectedPoster.imageUrl} alt={selectedPoster.title} style={styles.modalImage} />
            <div style={styles.modalBody}>
              <h3 style={styles.modalTitle}>{selectedPoster.title}</h3>
              <p style={styles.modalText}>{selectedPoster.content || "Tidak ada deskripsi."}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div style={styles.cardWrapper}>
        <div style={styles.glassCard}>
          {/* Logo */}
          <div style={styles.logoArea}>
            <img 
              src="/logo-gemilang.png.png" 
              alt="Logo Gemilang" 
              style={styles.logo}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <h1 style={styles.title}>Portal Siswa</h1>
          <p style={styles.subtitle}>Bimbel Gemilang · Glagahagung</p>

          {/* Form Login */}
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>👤 Username</label>
              <input 
                type="text" 
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>🔑 Password</label>
              <input 
                type="password" 
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>
            
            <button type="submit" disabled={loading} style={styles.btnLogin}>
              {loading ? "⏳ Memproses..." : "🚀 Masuk ke Portal"}
            </button>
          </form>

          {/* PWA Install */}
          {!isInstalled && showInstallBtn && (
            <div style={styles.installArea}>
              <button onClick={handleInstall} style={styles.btnInstall}>
                📱 Install Aplikasi
              </button>
            </div>
          )}
          {!isInstalled && !showInstallBtn && (
            <div style={styles.installArea}>
              <button onClick={handleInstall} style={styles.btnInstallOutline}>
                📲 Cara Install di HP
              </button>
            </div>
          )}
          {isInstalled && (
            <div style={styles.installedBadge}>
              ✅ Aplikasi sudah terinstall
            </div>
          )}

          <div style={styles.footer}>
            <small>Lupa password? Hubungi Admin.</small>
          </div>
        </div>

        {/* Poster/berita di samping */}
        {posters.length > 0 && (
          <div style={styles.posterPanel}>
            <div style={styles.posterHeader}>
              <span style={styles.posterIcon}>📢</span>
              <span style={styles.posterTitle}>Pengumuman & Berita</span>
            </div>
            <div style={styles.posterList}>
              {posters.map((p, i) => (
                <div 
                  key={p.id} 
                  style={styles.posterItem}
                  onClick={() => setSelectedPoster(p)}
                >
                  <img src={p.imageUrl} alt={p.title} style={styles.posterThumb} />
                  <div style={styles.posterInfo}>
                    <div style={styles.posterName}>{p.title}</div>
                    <div style={styles.posterDate}>
                      {p.createdAt?.toDate?.()?.toLocaleDateString('id-ID') || 'Baru'}
                    </div>
                  </div>
                </div>
              ))}
              {posters.length >= 5 && (
                <div style={styles.posterMore}>+{posters.length - 5} lagi</div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .glass-card {
          animation: fadeUp 0.8s ease both;
          animation-delay: 0.2s;
        }
        .poster-panel {
          animation: fadeUp 0.8s ease both;
          animation-delay: 0.4s;
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a3e 30%, #0d1b2a 60%, #1b0a2e 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },

  // Background
  background: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  star1: {
    position: 'absolute',
    width: '3px',
    height: '3px',
    background: 'white',
    borderRadius: '50%',
    top: '10%',
    left: '15%',
    animation: 'twinkle 3s ease-in-out infinite',
  },
  star2: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: 'white',
    borderRadius: '50%',
    top: '20%',
    right: '25%',
    animation: 'twinkle 4s ease-in-out infinite 0.5s',
  },
  star3: {
    position: 'absolute',
    width: '2px',
    height: '2px',
    background: 'white',
    borderRadius: '50%',
    bottom: '30%',
    left: '30%',
    animation: 'twinkle 2.5s ease-in-out infinite 1s',
  },
  star4: {
    position: 'absolute',
    width: '5px',
    height: '5px',
    background: 'white',
    borderRadius: '50%',
    top: '60%',
    right: '10%',
    animation: 'twinkle 3.5s ease-in-out infinite 0.3s',
  },
  star5: {
    position: 'absolute',
    width: '3px',
    height: '3px',
    background: 'white',
    borderRadius: '50%',
    bottom: '15%',
    right: '40%',
    animation: 'twinkle 2.8s ease-in-out infinite 0.8s',
  },
  star6: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: 'white',
    borderRadius: '50%',
    top: '40%',
    left: '5%',
    animation: 'twinkle 3.2s ease-in-out infinite 1.2s',
  },
  star7: {
    position: 'absolute',
    width: '2px',
    height: '2px',
    background: 'white',
    borderRadius: '50%',
    bottom: '45%',
    left: '55%',
    animation: 'twinkle 2.2s ease-in-out infinite 0.6s',
  },
  planet1: {
    position: 'absolute',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #f39c12, #d35400)',
    top: '15%',
    right: '8%',
    opacity: 0.15,
    boxShadow: '0 0 60px rgba(243,156,18,0.1)',
    animation: 'orbit 25s linear infinite',
  },
  planet2: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #8b5cf6, #4c1d95)',
    bottom: '10%',
    left: '3%',
    opacity: 0.1,
    boxShadow: '0 0 80px rgba(139,92,246,0.08)',
    animation: 'orbit 35s linear infinite reverse',
  },

  // Card wrapper (flex row)
  cardWrapper: {
    display: 'flex',
    gap: '24px',
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
    minWidth: '320px',
    maxWidth: '440px',
    padding: '40px 36px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
  },

  logoArea: {
    marginBottom: '16px',
  },
  logo: {
    height: '70px',
    filter: 'drop-shadow(0 0 30px rgba(243,156,18,0.3))',
    mixBlendMode: 'screen',
  },

  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'white',
    margin: '0 0 4px',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    margin: '0 0 28px',
    letterSpacing: '0.5px',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    '::placeholder': {
      color: 'rgba(255,255,255,0.3)',
    },
  },

  btnLogin: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
    color: '#0a0a1a',
    fontWeight: 800,
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 30px rgba(243,156,18,0.3)',
    marginTop: '8px',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(243,156,18,0.4)',
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },

  installArea: {
    marginTop: '20px',
  },
  btnInstall: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      background: 'rgba(255,255,255,0.1)',
    },
  },
  btnInstallOutline: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 500,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      background: 'rgba(255,255,255,0.05)',
    },
  },
  installedBadge: {
    marginTop: '16px',
    padding: '10px',
    borderRadius: '10px',
    background: 'rgba(46,213,115,0.15)',
    border: '1px solid rgba(46,213,115,0.2)',
    color: '#2ed573',
    fontSize: '12px',
    fontWeight: 600,
  },

  footer: {
    marginTop: '24px',
    color: 'rgba(255,255,255,0.25)',
    fontSize: '12px',
  },

  // Poster Panel
  posterPanel: {
    flex: '1',
    minWidth: '280px',
    maxWidth: '380px',
    padding: '24px 20px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    maxHeight: '500px',
    display: 'flex',
    flexDirection: 'column',
  },
  posterHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    marginBottom: '16px',
  },
  posterIcon: {
    fontSize: '20px',
  },
  posterTitle: {
    color: 'white',
    fontWeight: 700,
    fontSize: '15px',
    letterSpacing: '0.3px',
  },
  posterList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    '::-webkit-scrollbar': {
      width: '3px',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'rgba(255,255,255,0.15)',
      borderRadius: '10px',
    },
  },
  posterItem: {
    display: 'flex',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid transparent',
    ':hover': {
      background: 'rgba(255,255,255,0.06)',
      borderColor: 'rgba(255,255,255,0.08)',
      transform: 'translateX(4px)',
    },
  },
  posterThumb: {
    width: '64px',
    height: '64px',
    borderRadius: '10px',
    objectFit: 'cover',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  posterInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
  },
  posterName: {
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  posterDate: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: '10px',
    marginTop: '2px',
  },
  posterMore: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.2)',
    fontSize: '11px',
    padding: '8px',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalContent: {
    background: 'rgba(20,20,40,0.95)',
    borderRadius: '20px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover',
  },
  modalBody: {
    padding: '24px',
  },
  modalTitle: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  modalText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    lineHeight: 1.7,
    margin: 0,
  },
};

export default LoginSiswa;