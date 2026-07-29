// src/pages/LoginOwner.jsx
// 🔥 HALAMAN BARU: sebelumnya "akses Owner" cuma berupa PIN yang nempel di
// DALAM portal Admin (buka Settings, masukin PIN). Sekarang Owner punya
// jalur login sendiri, terpisah total dari akun Admin -- persis kayak
// Guru dan Siswa yang sudah punya portalnya masing-masing.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import { Crown, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const LoginOwner = () => {
  const navigate = useNavigate();
  const [inputPin, setInputPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "settings", "global_config"));

      if (!docSnap.exists() || !docSnap.data().ownerPin) {
        alert("⚠️ PIN Owner belum pernah diatur di sistem. Hubungi pengembang sistem untuk pengaturan awal.");
        setLoading(false);
        return;
      }

      const correctPin = docSnap.data().ownerPin;

      if (inputPin === correctPin) {
        localStorage.setItem("isOwnerLoggedIn", "true");
        localStorage.setItem("role", "owner");
        navigate("/owner/settings");
      } else {
        alert("⛔ PIN Owner salah!");
      }
    } catch (error) {
      console.error("Login Owner Error:", error);
      alert("Gagal koneksi ke server.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}>
        <div style={styles.glow1} />
        <div style={styles.glow2} />
      </div>

      <div style={styles.card}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          <ArrowLeft size={16} /> Kembali
        </button>

        <div style={styles.iconArea}>
          <div style={styles.iconCircle}>
            <Crown size={30} color="#fbbf24" />
          </div>
          <h1 style={styles.title}>Portal Owner</h1>
          <p style={styles.subtitle}>Akses khusus pemilik/manajer bimbel</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>PIN Owner</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPin ? 'text' : 'password'}
                value={inputPin}
                onChange={e => setInputPin(e.target.value)}
                style={styles.input}
                placeholder="••••••"
                maxLength={6}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={styles.eyeBtn}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...styles.btnSubmit, opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Memproses...' : '👑 Masuk Portal Owner'}
          </button>
        </form>

        <div style={styles.footer}>
          <small>Bimbel Gemilang · Area Terbatas</small>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'linear-gradient(135deg, #0f0a1e 0%, #1a1030 50%, #0a0614 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  background: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 },
  glow1: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.08), transparent 70%)',
    top: '10%', left: '10%',
  },
  glow2: {
    position: 'absolute', width: 350, height: 350, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
    bottom: '5%', right: '5%',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 380,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(251,191,36,0.15)',
    borderRadius: 24,
    padding: '28px 26px 20px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
    boxSizing: 'border-box',
  },
  backBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: 6, marginBottom: 16, padding: 0,
  },
  iconArea: { textAlign: 'center', marginBottom: 24 },
  iconCircle: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 14px',
  },
  title: { color: 'white', fontSize: 20, fontWeight: 800, margin: '0 0 4px' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    width: '100%', padding: '14px 44px 14px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', fontSize: 18, letterSpacing: 4, outline: 'none',
    boxSizing: 'border-box', textAlign: 'center', fontWeight: 700,
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
  },
  btnSubmit: {
    padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1a1030',
    fontWeight: 800, fontSize: 14,
  },
  footer: { textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.15)', fontSize: 9 },
};

export default LoginOwner;