import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from "firebase/firestore";

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [loading, setLoading] = useState(false);
  
  // ➕ STATE UNTUK PWA INSTALL
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // ➕ DETEKSI PWA INSTALL EVENT
  useEffect(() => {
    // Cek apakah sudah terinstall
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Tangkap event beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Cek appinstalled
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBtn(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // ➕ FUNGSI INSTALL APLIKASI
  const handleInstall = async () => {
    if (!installPrompt) {
      // Fallback untuk iOS / browser yang tidak support beforeinstallprompt
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
        console.log('✅ Aplikasi terinstall');
        setIsInstalled(true);
      }
      setInstallPrompt(null);
      setShowInstallBtn(false);
    } catch (err) {
      console.log('Install dibatalkan:', err);
    }
  };

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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
            <h2 style={{ color: '#2c3e50', margin: 0, fontSize: '24px' }}>Portal Siswa</h2>
            <p style={{ color: '#7f8c8d', fontSize: 13, marginTop: 5 }}>Bimbel Gemilang - Akses Rapor & Jadwal</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: 15 }}>
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

          <div style={{ textAlign: 'left', marginBottom: 25 }}>
            <label style={styles.label}>🔑 Password</label>
            <input 
              type="password" 
              placeholder="Masukkan Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>
          
          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? "MEMPROSES..." : "MASUK KE PORTAL"}
          </button>
        </form>

        {/* ➕ TOMBOL INSTAL APLIKASI */}
        {!isInstalled && showInstallBtn && (
          <div style={{ marginTop: 20 }}>
            <button 
              type="button"
              onClick={handleInstall}
              style={styles.btnInstall}
            >
              📱 Install Aplikasi di HP
            </button>
            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
              Simpan ke layar utama biar buka lebih cepat
            </p>
          </div>
        )}

        {/* ➕ INFO UNTUK IOS (Safari tidak support beforeinstallprompt) */}
        {!isInstalled && !showInstallBtn && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
              📱 Buka aplikasi lebih cepat:
            </p>
            <button 
              type="button"
              onClick={handleInstall}
              style={styles.btnInstallOutline}
            >
              📲 Cara Install di HP
            </button>
          </div>
        )}

        {/* ➕ SUDAH TERINSTALL */}
        {isInstalled && (
          <div style={{ marginTop: 20, background: '#dcfce7', padding: 10, borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: '#166534', margin: 0, fontWeight: 600 }}>
              ✅ Aplikasi sudah terinstall di HP kamu
            </p>
          </div>
        )}

        <div style={styles.footerNote}>
            <small>Lupa password? Hubungi Admin Cabang.</small>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    background: '#f0f2f5', 
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  card: { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '16px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
    width: '100%', 
    maxWidth: '420px', 
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  header: { marginBottom: '35px' },
  label: { display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#2c3e50' },
  input: { 
    width: '100%', 
    padding: '12px 15px', 
    borderRadius: '8px', 
    border: '1px solid #ddd', 
    fontSize: '16px', 
    boxSizing: 'border-box', 
    outline: 'none',
    color: '#000',
    background: '#fff'
  },
  btnPrimary: { 
    width: '100%', 
    padding: '14px', 
    background: '#27ae60', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(39, 174, 96, 0.1)',
  },
  // ➕ STYLE TOMBOL INSTAL
  btnInstall: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnInstallOutline: {
    width: '100%',
    padding: '12px',
    background: 'white',
    color: '#4f46e5',
    border: '2px solid #c7d2fe',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  footerNote: { marginTop: '30px', color: '#bdc3c7', fontSize: '12px' }
};

export default LoginSiswa;