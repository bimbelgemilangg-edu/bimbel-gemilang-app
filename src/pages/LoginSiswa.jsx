import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState(""); // TAMBAHAN: State Password
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return alert("Masukkan Username dan Password!");
    
    setLoading(true);
    try {
      // Mencari siswa berdasarkan USERNAME
      const q = query(collection(db, "students"), where("username", "==", username.toLowerCase()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const studentDoc = snap.docs[0];
        const studentData = studentDoc.data();

        // VERIFIKASI PASSWORD
        if (studentData.password === password) {
            // SIMPAN DATA KE STORAGE
            localStorage.setItem("isSiswaLoggedIn", "true");
            localStorage.setItem("role", "siswa");
            localStorage.setItem("studentId", studentDoc.id);
            localStorage.setItem("studentName", studentData.nama);

            alert(`Selamat Datang, ${studentData.nama}!`);
            navigate("/siswa/dashboard");
        } else {
            alert("⛔ Password salah! Silakan periksa kembali.");
        }
      } else {
        alert("⛔ Username tidak ditemukan. Pastikan format benar (contoh: budi123@gemilang.com)");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#2c3e50', marginBottom: 5 }}>Portal Siswa</h2>
        <p style={{ color: '#7f8c8d', fontSize: 13, marginBottom: 25 }}>
            Gunakan akun yang diberikan admin saat pendaftaran.
        </p>
        
        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: 15 }}>
            <label style={styles.label}>📧 Username / Email Siswa</label>
            <input 
              type="text" 
              placeholder="nama123@gemilang.com"
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
            {loading ? "MENGECEK AKUN..." : "MASUK KE PORTAL"}
          </button>

          <button type="button" onClick={() => navigate('/')} style={styles.btnBack}>
            ← Kembali ke Beranda
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' },
  card: { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '380px', textAlign: 'center' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#34495e' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box', background: '#fff', color: '#000' },
  btnPrimary: { width: '100%', padding: '14px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)' },
  btnBack: { background: 'none', border: 'none', color: '#7f8c8d', marginTop: '20px', cursor: 'pointer', fontSize: '14px' }
};

export default LoginSiswa;