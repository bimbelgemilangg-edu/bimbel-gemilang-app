import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginSiswa = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); // Bisa Nama atau ID
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier) return alert("Masukkan Nama atau ID Siswa!");
    
    setLoading(true);
    try {
      // Mencari di koleksi 'students' berdasarkan nama
      const q = query(collection(db, "students"), where("nama", "==", identifier));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const studentDoc = snap.docs[0];
        const studentData = studentDoc.data();

        // SIMPAN DATA KE STORAGE (Agar semua halaman student bisa 'konek')
        localStorage.setItem("isSiswaLoggedIn", "true");
        localStorage.setItem("studentId", studentDoc.id);
        localStorage.setItem("studentName", studentData.nama);

        alert(`Selamat Datang, ${studentData.nama}!`);
        navigate("/siswa/dashboard");
      } else {
        alert("⛔ Data Siswa tidak ditemukan. Pastikan nama sesuai (Perhatikan Huruf Kapital).");
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
        <h2 style={{ color: '#2c3e50', marginBottom: 10 }}>Portal Siswa</h2>
        <p style={{ color: '#7f8c8d', fontSize: 14, marginBottom: 25 }}>Silakan masukkan Nama Lengkap Anda untuk mengakses Rapor & Jadwal.</p>
        
        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <label style={styles.label}>👤 Nama Lengkap Siswa</label>
            <input 
              type="text" 
              placeholder="Contoh: Budi Santoso"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={styles.input}
              autoFocus
            />
          </div>
          
          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? "MENCARI DATA..." : "MASUK KE PORTAL"}
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
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', fontFamily: 'sans-serif' },
  card: { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '380px', textAlign: 'center' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' },
  btnPrimary: { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  btnBack: { background: 'none', border: 'none', color: '#7f8c8d', marginTop: '20px', cursor: 'pointer', fontSize: '14px' }
};

export default LoginSiswa;