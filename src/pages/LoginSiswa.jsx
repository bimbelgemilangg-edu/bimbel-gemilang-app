// src/pages/LoginSiswa.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [posters, setPosters] = useState([]);
  const [currentPoster, setCurrentPoster] = useState(0);
  
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
        const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"), limit(10));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter hanya yang targetnya "Semua" atau "Siswa"
        const filtered = data.filter(p => p.targetPortal === "Semua" || p.targetPortal === "Siswa");
        setPosters(filtered.length > 0 ? filtered : [
          { imageUrl: '', title: 'Selamat Datang di Bimbel Gemilang', content: 'Masuk ke portal siswa untuk melihat jadwal & rapor' }
        ]);
      } catch (err) {
        console.error("Gagal ambil poster:", err);
      }
    };
    fetchPosters();
  }, []);

  // ============================================================
  // AUTO SLIDE POSTER
  // ============================================================
  useEffect(() => {
    if (posters.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPoster(prev => (prev + 1) % posters.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [posters.length]);

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
        'Klik 🗳️ (Share) → "Add to Home Screen"'
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
          navigate("/siswa/dashboard");
        } else {
          alert("⛔ Password salah! Silakan coba lagi.");
        }
      } else {
        alert("⛔ Username tidak ditemukan.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const current = posters[currentPoster] || posters[0] || {};

  return (
    <div style={styles.container}>
      {/* ⭐ BINTANG BACKGROUND */}
      <div style={styles.stars}>
        {[...Array(80)].map((_, i) => (
          <div key={i} style={{
            ...styles.star,
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 3 + 's',
            animationDuration: (Math.random() * 2 + 1) + 's',
          }} />
        ))}
      </div>

      {/* 🌍 PLANET DECOR */}
      <div style={styles.planet1} />
      <div style={styles.planet2} />
      <div style={styles.planet3} />

      {/* ========================================================== */}
      {/* ═══════ POSTER SLIDER (DI ATAS KARTU LOGIN) ═══════ */}
      {/* ========================================================== */}
      <div style={styles.posterWrapper}>
        <div style={styles.posterSlide}>
          {current.imageUrl ? (
            <img 
              src={current.imageUrl} 
              alt={current.title} 
              style={styles.posterImage}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={styles.posterPlaceholder}>
              <span style={styles.posterIcon}>🚀</span>
            </div>
          )}
          <div style={styles.posterOverlay}>
            <div style={styles.posterBadge}>📢 PENGUMUMAN</div>
            <h3 style={styles.posterTitle}>{current.title || 'Selamat Datang!'}</h3>
            <p style={styles.posterContent}>{current.content || 'Masuk ke portal siswa untuk melihat jadwal & rapor'}</p>
          </div>
        </div>
        
        {/* Dots indicator */}
        {posters.length > 1 && (
          <div style={styles.posterDots}>
            {posters.map((_, i) => (
              <div 
                key={i} 
                style={{
                  ...styles.posterDot,
                  background: i === currentPoster ? '#f39c12' : 'rgba(255,255,255,0.3)',
                  width: i === currentPoster ? 24 : 8,
                }}
                onClick={() => setCurrentPoster(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* ═══════ KARTU LOGIN (GLASSMORPHISM) ═══════ */}
      {/* ========================================================== */}
      <div style={styles.card}>
        {/* LOGO */}
        <div style={styles.logoWrapper}>
          <img 
            src="/logo-gemilang.png.png" 
            alt="Logo Bimbel Gemilang" 
            style={styles.logo}
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.parentElement.innerHTML = '<span style="font-size:28px;font-weight:900;color:#f39c12;">GEMILANG</span>';
            }}
          />
        </div>

        <h2 style={styles.cardTitle}>Portal Siswa</h2>
        <p style={styles.cardSub}>Bimbel Gemilang · Akses Rapor & Jadwal</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>📧 Username / Email</label>
            <input 
              type="text" 
              placeholder="Masukkan Username Anda"
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
              placeholder="Masukkan Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btnLogin}>
            {loading ? "⏳ MEMPROSES..." : "🚀 MASUK KE PORTAL"}
          </button>
        </form>

        {/* PWA INSTALL */}
        {!isInstalled && showInstallBtn && (
          <button onClick={handleInstall} style={styles.btnInstall}>
            📱 Install Aplikasi
          </button>
        )}
        {!isInstalled && !showInstallBtn && (
          <button onClick={handleInstall} style={styles.btnInstallOutline}>
            📲 Cara Install di HP
          </button>
        )}
        {isInstalled && (
          <div style={styles.installedBadge}>
            ✅ Aplikasi sudah terinstall
          </div>
        )}

        <div style={styles.footerNote}>
          <small>Lupa password? Hubungi Admin Cabang.</small>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STYLES — GLASSMORPHISM + SPACE THEME
// ============================================================
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'radial-gradient(ellipse at 20% 50%, #0d0d2b 0%, #1a1a3e 40%, #0a0a1a 100%)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Stars
  stars: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    background: 'white',
    borderRadius: '50%',
    animation: 'twinkle 2s ease-in-out infinite alternate',
    opacity: 0.6,
  },
  
  // Planets
  planet1: {
    position: 'fixed',
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #f39c12, #e67e22)',
    top: '10%',
    right: '-30px',
    opacity: 0.15,
    filter: 'blur(20px)',
    zIndex: 0,
  },
  planet2: {
    position: 'fixed',
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #8b5cf6, #6d28d9)',
    bottom: '15%',
    left: '-20px',
    opacity: 0.12,
    filter: 'blur(15px)',
    zIndex: 0,
  },
  planet3: {
    position: 'fixed',
    width: 50,
    height: 50,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #3b82f6, #1d4ed8)',
    top: '45%',
    left: '55%',
    opacity: 0.08,
    filter: 'blur(10px)',
    zIndex: 0,
  },

  // ═══ POSTER SLIDER ═══
  posterWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '480px',
    height: '180px',
    borderRadius: '20px',
    overflow: 'hidden',
    marginBottom: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    zIndex: 1,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  posterSlide: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: 'linear-gradient(135deg, #1a1a3e, #2d1b69)',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a3e, #2d1b69)',
  },
  posterIcon: {
    fontSize: 64,
    opacity: 0.5,
  },
  posterOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  posterBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: '#f39c12',
    background: 'rgba(0,0,0,0.5)',
    padding: '3px 12px',
    borderRadius: 20,
    display: 'inline-block',
    width: 'fit-content',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  posterTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: 'white',
    margin: 0,
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  posterContent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    margin: '4px 0 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  posterDots: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 6,
    zIndex: 2,
  },
  posterDot: {
    height: 6,
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  // ═══ KARTU LOGIN (GLASS) ═══
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '28px',
    padding: '36px 32px 28px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    boxSizing: 'border-box',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    zIndex: 1,
    position: 'relative',
  },
  logoWrapper: {
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'center',
  },
  logo: {
    height: 52,
    filter: 'drop-shadow(0 0 20px rgba(243,156,18,0.3))',
    mixBlendMode: 'screen',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: 'white',
    margin: 0,
    letterSpacing: 0.5,
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  cardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    marginBottom: 24,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  inputGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: 'white',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  },
  inputFocus: {
    borderColor: 'rgba(243,156,18,0.5)',
    boxShadow: '0 0 0 4px rgba(243,156,18,0.06)',
  },

  btnLogin: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
    border: 'none',
    borderRadius: '14px',
    color: '#0a0a1a',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 24px rgba(243,156,18,0.35)',
    marginTop: 4,
  },

  btnInstall: {
    width: '100%',
    padding: '12px',
    marginTop: 14,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  btnInstallOutline: {
    width: '100%',
    padding: '12px',
    marginTop: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  installedBadge: {
    marginTop: 14,
    padding: '10px 16px',
    background: 'rgba(37,211,102,0.12)',
    border: '1px solid rgba(37,211,102,0.2)',
    borderRadius: '10px',
    fontSize: 12,
    color: '#25D366',
    fontWeight: 600,
  },
  footerNote: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
  },
};

// Tambahkan keyframe animation ke global
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes twinkle {
    0% { opacity: 0.2; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1.2); }
  }
`;
document.head.appendChild(styleSheet);

export default LoginSiswa;