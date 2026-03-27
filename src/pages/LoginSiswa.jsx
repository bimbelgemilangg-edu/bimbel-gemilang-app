import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from "firebase/firestore";

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // 1. Ambil input dan bersihkan dari spasi tak sengaja
    const inputUsername = username.trim();
    const inputPassword = password.trim();

    if (!inputUsername || !inputPassword) {
      return alert("Silakan masukkan Username dan Password!");
    }
    
    setLoading(true);
    try {
      // 2. Ambil semua data siswa (untuk pencarian abaikan huruf kapital)
      const querySnapshot = await getDocs(collection(db, "students"));
      let studentData = null;
      let studentId = null;

      // 3. Lakukan pencarian manual (Case Insensitive)
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Pastikan field 'username' ada di Firestore
        if (data.username && data.username.toLowerCase() === inputUsername.toLowerCase()) {
          studentData = data;
          studentId = doc.id;
        }
      });

      // 4. Evaluasi Hasil Pencarian
      if (studentData) {
        // 5. VERIFIKASI PASSWORD (Konversi ke String untuk keamanan)
        if (String(studentData.password) === inputPassword) {
            
            // SIMPAN SESSI KE LOCALSTORAGE
            localStorage.setItem("isSiswaLoggedIn", "true");
            localStorage.setItem("role", "siswa");
            localStorage.setItem("studentId", studentId);
            localStorage.setItem("studentName", studentData.nama);

            alert(`Selamat Datang, ${studentData.nama}!`);
            navigate("/siswa/dashboard");
        } else {
            alert("⛔ Password salah! Silakan coba lagi.");
        }
      } else {
        // JIKA USERNAME TIDAK DITEMUKAN (Setelah abaikan kapital)
        alert("⛔ Username tidak ditemukan. Pastikan Admin sudah mengatur Username di menu Edit Student dengan benar.");
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
              placeholder="contoh: FafianZiantara10@gemilang.com"
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
              placeholder="Masukkan password Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>
          
          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? "MEMPROSES..." : "MASUK KE PORTAL"}
          </button>

          <button type="button" onClick={() => navigate('/')} style={styles.btnBack}>
            ← Kembali ke Beranda
          </button>
        </form>

        <div style={styles.footerNote}>
            <small>Lupa password? Hubungi Admin Cabang.</small>
        </div>
      </div>
    </div>
  );
};

// --- STYLES (Sedikit disesuaikan agar mirip gambar Anda) ---
const styles = {
  container: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    background: '#f0f2f5', // Warna background abu-abu muda seperti di gambar
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  card: { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '16px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)', // Shadow lembut
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
    border: '1px solid #ddd', // Border tipis seperti di gambar
    fontSize: '16px', 
    boxSizing: 'border-box', 
    outline: 'none',
    color: '#000',
    background: '#fff'
  },
  btnPrimary: { 
    width: '100%', 
    padding: '14px', 
    background: '#27ae60', // Warna hijau tombol
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(39, 174, 96, 0.1)',
    transition: 'background 0.3s'
  },
  btnBack: { 
    background: 'none', 
    border: 'none', 
    color: '#7f8c8d', 
    marginTop: '25px', 
    cursor: 'pointer', 
    fontSize: '14px',
    textDecoration: 'none'
  },
  footerNote: { marginTop: '30px', color: '#bdc3c7', fontSize: '12px' }
};

export default LoginSiswa;