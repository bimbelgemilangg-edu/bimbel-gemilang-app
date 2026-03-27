import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // MEMBERSIHKAN INPUT (Menghapus spasi di awal/akhir dan mengubah ke huruf kecil)
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      return alert("Silakan masukkan Username dan Password!");
    }
    
    setLoading(true);
    try {
      // 1. MENCARI DOKUMEN SISWA BERDASARKAN FIELD 'username'
      const q = query(
        collection(db, "students"), 
        where("username", "==", cleanUsername)
      );
      
      const snap = await getDocs(q);

      if (!snap.empty) {
        const studentDoc = snap.docs[0];
        const studentData = studentDoc.data();

        // 2. VERIFIKASI PASSWORD (Memastikan perbandingan tipe data string)
        if (String(studentData.password) === cleanPassword) {
            
            // SIMPAN SESSI KE LOCALSTORAGE
            localStorage.setItem("isSiswaLoggedIn", "true");
            localStorage.setItem("role", "siswa");
            localStorage.setItem("studentId", studentDoc.id);
            localStorage.setItem("studentName", studentData.nama);

            alert(`Selamat Datang, ${studentData.nama}!`);
            navigate("/siswa/dashboard");
        } else {
            alert("⛔ Password salah! Silakan coba lagi.");
        }
      } else {
        // JIKA USERNAME TIDAK DITEMUKAN
        alert("⛔ Username tidak ditemukan. Pastikan Admin sudah mengatur Username di menu Edit Student.");
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
            <h2 style={{ color: '#2c3e50', margin: 0 }}>Portal Siswa</h2>
            <p style={{ color: '#7f8c8d', fontSize: 13, marginTop: 5 }}>Bimbel Gemilang - Akses Rapor & Jadwal</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: 15 }}>
            <label style={styles.label}>📧 Username / Email</label>
            <input 
              type="text" 
              placeholder="contoh: budi123@gemilang.com"
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

const styles = {
  container: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
    fontFamily: "'Segoe UI', Roboto, sans-serif" 
  },
  card: { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '16px', 
    boxShadow: '0 15px 35px rgba(0,0,0,0.1)', 
    width: '100%', 
    maxWidth: '400px', 
    textAlign: 'center' 
  },
  header: { marginBottom: '30px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#34495e' },
  input: { 
    width: '100%', 
    padding: '12px', 
    borderRadius: '8px', 
    border: '2px solid #edf2f7', 
    fontSize: '15px', 
    boxSizing: 'border-box', 
    transition: 'border-color 0.2s',
    outline: 'none',
    color: '#000'
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
    transition: 'background 0.3s'
  },
  btnBack: { 
    background: 'none', 
    border: 'none', 
    color: '#95a5a6', 
    marginTop: '20px', 
    cursor: 'pointer', 
    fontSize: '14px',
    textDecoration: 'underline'
  },
  footerNote: { marginTop: '25px', color: '#bdc3c7' }
};

export default LoginSiswa;