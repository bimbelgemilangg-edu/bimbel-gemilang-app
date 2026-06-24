// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { 
  Users, GraduationCap, Shield, LogIn, ArrowRight, 
  ChevronRight, Sparkles, Rocket, Star, Moon, Sun
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  
  // STATE
  const [isAdminMode, setIsAdminMode] = useState(false); 
  const [inputPassword, setInputPassword] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');

  const isDark = theme === 'dark';

  // ============================================================
  // LOGIN ADMIN
  // ============================================================
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const docRef = doc(db, "settings", "global_config");
      const docSnap = await getDoc(docRef);
      
      let correctPassword = "admin123";
      if (docSnap.exists() && docSnap.data().adminPassword) {
        correctPassword = docSnap.data().adminPassword;
      }

      if (inputPassword === correctPassword) {
        localStorage.setItem("isLoggedIn", "true"); 
        localStorage.setItem("role", "admin");
        alert("✅ Login Admin Berhasil!");
        navigate("/admin"); 
      } else {
        alert("⛔ Password Admin Salah!");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Gagal koneksi ke server.");
    }
    setLoading(false);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ 
      ...styles.container, 
      background: isDark 
        ? 'linear-gradient(135deg, #05070f 0%, #0d1b2a 40%, #1a0a2e 80%, #02040a 100%)' 
        : 'linear-gradient(135deg, #f0f4f8 0%, #d4e4f7 40%, #e8f0fe 100%)' 
    }}>
      
      {/* Background Stars */}
      <div style={styles.background}>
        {isDark ? (
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

      {/* Main Card */}
      <div style={{ 
        ...styles.glassCard,
        background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        
        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(isDark ? 'light' : 'dark')} 
          style={styles.themeToggle}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Logo */}
        <div style={styles.logoArea}>
          <img 
            src="/pwa-192x192.png" 
            alt="Logo Bimbel Gemilang" 
            style={styles.logo}
          />
          <h1 style={{ ...styles.title, color: isDark ? '#ffffff' : '#1a1a2e' }}>
            Bimbel Gemilang
          </h1>
          <p style={{ ...styles.subtitle, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
            Portal Akademik & Absensi
          </p>
        </div>

        {isAdminMode ? (
          /* ============================================================ */
          /* LOGIN ADMIN */
          /* ============================================================ */
          <form onSubmit={handleAdminLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                <Shield size={14} /> Password Admin
              </label>
              <input 
                type="password" 
                value={inputPassword} 
                onChange={e => setInputPassword(e.target.value)} 
                style={{ 
                  ...styles.input,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  color: isDark ? '#ffffff' : '#1a1a2e',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'
                }} 
                placeholder="Masukkan Password..." 
                autoFocus
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                ...styles.btnPrimary,
                background: isDark ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'linear-gradient(135deg, #1a237e, #283593)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '⏳ Memproses...' : '🚀 Masuk Dashboard'}
            </button>
            
            <button 
              type="button" 
              onClick={() => setIsAdminMode(false)} 
              style={{ ...styles.btnLink, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
            >
              ← Kembali ke Menu
            </button>
          </form>
        ) : (
          /* ============================================================ */
          /* MENU PILIHAN PORTAL */
          /* ============================================================ */
          <>
            <p style={{ ...styles.portalLabel, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
              Silakan pilih portal login Anda:
            </p>
            
            <div style={styles.portalGrid}>
              {/* Portal Guru */}
              <div 
                style={styles.portalCard(isDark)} 
                onClick={() => navigate('/login-guru')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = isDark ? '0 12px 40px rgba(139,92,246,0.15)' : '0 12px 40px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.portalIcon('guru')}>
                  <Users size={28} />
                </div>
                <h3 style={styles.portalName}>Portal Guru</h3>
                <p style={styles.portalDesc}>Manajemen kelas & absensi</p>
                <div style={styles.portalArrow}>
                  <ArrowRight size={16} />
                </div>
              </div>

              {/* Portal Siswa */}
              <div 
                style={styles.portalCard(isDark)} 
                onClick={() => navigate('/login-siswa')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = isDark ? '0 12px 40px rgba(16,185,129,0.15)' : '0 12px 40px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.portalIcon('siswa')}>
                  <GraduationCap size={28} />
                </div>
                <h3 style={styles.portalName}>Portal Siswa</h3>
                <p style={styles.portalDesc}>Rapor & jadwal belajar</p>
                <div style={styles.portalArrow}>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>

            {/* Admin Link */}
            <div style={styles.adminArea}>
              <button 
                onClick={() => setIsAdminMode(true)} 
                style={{ ...styles.adminLink, color: isDark ? '#f39c12' : '#1a237e' }}
              >
                <Shield size={14} /> Login Admin
              </button>
            </div>
          </>
        )}

        <div style={styles.footer}>
          <small style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}>
            Bimbel Gemilang · Glagahagung · v3.0
          </small>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
        }
        @keyframes orbitReverse {
          from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          to { transform: rotate(-360deg) translateX(60px) rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(60px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .glass-card {
          animation: fadeUp 0.8s ease both;
          animation-delay: 0.2s;
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 0.6s ease'
  },

  // Background
  background: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden'
  },

  // Stars (Malam)
  star1: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '10%', left: '15%', borderRadius: '50%', animation: 'twinkle 3s ease-in-out infinite' },
  star2: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '25%', right: '20%', borderRadius: '50%', animation: 'twinkle 4s ease-in-out infinite 0.5s' },
  star3: { position: 'absolute', width: '2px', height: '2px', background: 'white', bottom: '30%', left: '10%', borderRadius: '50%', animation: 'twinkle 2.5s ease-in-out infinite 1s' },
  star4: { position: 'absolute', width: '4px', height: '4px', background: 'white', top: '50%', right: '8%', borderRadius: '50%', animation: 'twinkle 3.5s ease-in-out infinite 0.3s' },
  star5: { position: 'absolute', width: '2px', height: '2px', background: 'white', bottom: '15%', right: '30%', borderRadius: '50%', animation: 'twinkle 2.8s ease-in-out infinite 0.8s' },
  star6: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '70%', left: '5%', borderRadius: '50%', animation: 'twinkle 3.2s ease-in-out infinite 1.2s' },
  star7: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '40%', left: '45%', borderRadius: '50%', animation: 'twinkle 2.2s ease-in-out infinite 0.6s' },
  star8: { position: 'absolute', width: '4px', height: '4px', background: 'white', top: '80%', right: '50%', borderRadius: '50%', animation: 'twinkle 3.8s ease-in-out infinite 1.4s' },
  planet1: { position: 'absolute', width: '50px', height: '50px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #f39c12, #d35400)', top: '8%', right: '10%', opacity: 0.1, animation: 'orbit 30s linear infinite' },
  planet2: { position: 'absolute', width: '70px', height: '70px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #8b5cf6, #4c1d95)', bottom: '10%', left: '5%', opacity: 0.08, animation: 'orbitReverse 40s linear infinite' },
  nebula: { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 8s ease-in-out infinite' },

  // Clouds (Siang)
  cloud1: { position: 'absolute', width: '180px', height: '50px', background: 'rgba(255,255,255,0.5)', borderRadius: '30px', top: '15%', left: '8%', filter: 'blur(2px)', animation: 'cloudFloat 25s ease-in-out infinite' },
  cloud2: { position: 'absolute', width: '220px', height: '60px', background: 'rgba(255,255,255,0.35)', borderRadius: '40px', bottom: '20%', right: '5%', filter: 'blur(2px)', animation: 'cloudFloat 30s ease-in-out infinite reverse' },
  sun: { position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ffd700, #ff8c00)', top: '5%', right: '5%', opacity: 0.1, animation: 'pulse 4s ease-in-out infinite' },

  // Glass Card
  glassCard: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '440px',
    padding: '32px 28px 24px',
    borderRadius: '24px',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    boxSizing: 'border-box',
    transition: 'all 0.6s ease'
  },

  themeToggle: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.03)',
    color: '#fbbf24',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'scale(1.1)',
      background: 'rgba(255,255,255,0.06)'
    }
  },

  logoArea: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    boxShadow: '0 0 40px rgba(139,92,246,0.15)',
    border: '2px solid rgba(139,92,246,0.2)',
    objectFit: 'cover'
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    margin: '12px 0 2px',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '12px',
    margin: 0,
    letterSpacing: '0.3px'
  },

  portalLabel: {
    fontSize: '13px',
    textAlign: 'center',
    margin: '0 0 16px 0'
  },

  portalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px'
  },

  portalCard: (isDark) => ({
    padding: '20px 16px',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
    border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
    position: 'relative',
    ':hover': {
      transform: 'translateY(-4px)'
    }
  }),

  portalIcon: (type) => ({
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 8px',
    background: type === 'guru' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)',
    color: type === 'guru' ? '#8b5cf6' : '#10b981',
    border: type === 'guru' ? '1px solid rgba(139,92,246,0.15)' : '1px solid rgba(16,185,129,0.15)'
  }),

  portalName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 2px'
  },

  portalDesc: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.3)',
    margin: 0
  },

  portalArrow: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    color: 'rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease'
  },

  adminArea: {
    textAlign: 'center',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.04)'
  },

  adminLink: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    ':hover': {
      opacity: 0.7
    }
  },

  // Form Admin
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
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    width: '100%',
    boxSizing: 'border-box',
    ':focus': {
      borderColor: 'rgba(243,156,18,0.3)',
      boxShadow: '0 0 20px rgba(243,156,18,0.05)'
    },
    '::placeholder': {
      color: 'rgba(255,255,255,0.2)'
    }
  },

  btnPrimary: {
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    color: 'white',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 30px rgba(243,156,18,0.15)',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(243,156,18,0.25)'
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none'
    }
  },

  btnLink: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      opacity: 0.7
    }
  },

  footer: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '9px'
  }
};

export default Login;