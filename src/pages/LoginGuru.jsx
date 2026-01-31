import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

const LoginGuru = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [dailyCode, setDailyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. CEK KODE HARIAN (Security Layer 1)
      const today = new Date().toISOString().split('T')[0];
      const codeRef = doc(db, "settings", `daily_code_${today}`);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists() || codeSnap.data().code.toUpperCase() !== dailyCode.toUpperCase()) {
        alert("⛔ Kode Harian SALAH! Hubungi Admin.");
        setLoading(false);
        return;
      }

      // 2. CEK EMAIL GURU (Security Layer 2)
      const q = query(collection(db, "teachers"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("❌ Email tidak terdaftar.");
        setLoading(false);
        return;
      }

      // 3. LOGIN SUKSES (SECURE MEMORY MODE)
      const guruData = querySnapshot.docs[0].data();
      const guruId = querySnapshot.docs[0].id;
      
      const fullData = { id: guruId, ...guruData };

      // ⚠️ PENTING: Kita TIDAK simpan ke localStorage.
      // Kita "lempar" datanya langsung ke halaman Dashboard via Memory.
      alert(`✅ Login Berhasil! Selamat Datang, ${guruData.nama}`);
      
      navigate('/guru/dashboard', { state: { teacher: fullData } });

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{textAlign:'center', marginBottom:20}}>
            <h2 style={{color:'#2c3e50', margin:0}}>🚪 Portal Guru</h2>
            <p style={{color:'#7f8c8d', fontSize:14}}>Secure Access (No-Cache)</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:15}}>
            <label style={styles.label}>Email Terdaftar</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={styles.input} required placeholder="nama@email.com" />
          </div>
          <div style={{marginBottom:20}}>
            <label style={styles.label}>Kode Absen Hari Ini</label>
            <input type="text" value={dailyCode} onChange={e=>setDailyCode(e.target.value)} style={styles.input} required placeholder="Contoh: SENIN-CERIA" />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Memverifikasi..." : "MASUK DASHBOARD"}
          </button>
        </form>
        <p style={{textAlign:'center', fontSize:11, color:'#999', marginTop:15}}>
           Demi keamanan, reload halaman akan otomatis logout.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { height:'100vh', background:'#f0f2f5', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'sans-serif' },
  card: { background:'white', padding:30, borderRadius:10, boxShadow:'0 4px 10px rgba(0,0,0,0.1)', width:'100%', maxWidth:'350px' },
  label: { display:'block', marginBottom:5, fontSize:13, fontWeight:'bold', color:'#333' },
  input: { width:'100%', padding:12, borderRadius:5, border:'1px solid #ccc', boxSizing:'border-box', fontSize:16 },
  btn: { width:'100%', padding:12, background:'#2980b9', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer', fontSize:14 }
};

export default LoginGuru;