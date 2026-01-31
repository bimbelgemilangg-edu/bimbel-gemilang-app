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
      // 1. CEK KODE HARIAN DULU (Gerbang Pertama)
      const today = new Date().toISOString().split('T')[0];
      const codeRef = doc(db, "settings", `daily_code_${today}`);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists() || codeSnap.data().code !== dailyCode) {
        alert("⛔ Kode Harian SALAH! Minta kode terbaru ke Admin.");
        setLoading(false);
        return;
      }

      // 2. CEK EMAIL GURU (Apakah terdaftar?)
      const q = query(collection(db, "teachers"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("❌ Email tidak terdaftar sebagai Guru.");
        setLoading(false);
        return;
      }

      // 3. LOGIN SUKSES -> SIMPAN SESI SEMENTARA
      const guruData = querySnapshot.docs[0].data();
      const guruId = querySnapshot.docs[0].id;
      
      localStorage.setItem("guruSession", JSON.stringify({ id: guruId, ...guruData }));
      alert(`Selamat Datang, ${guruData.nama}!`);
      navigate('/guru/dashboard');

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{textAlign:'center', color:'#2c3e50'}}>🚪 Login Guru</h2>
        <p style={{textAlign:'center', color:'#7f8c8d', fontSize:14}}>Masukkan Email & Kode Harian dari Admin</p>
        
        <form onSubmit={handleLogin} style={{marginTop:20}}>
          <div style={{marginBottom:15}}>
            <label style={{display:'block', marginBottom:5}}>Email Guru</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={styles.input} required placeholder="email@guru.com" />
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block', marginBottom:5}}>Kode Harian</label>
            <input type="text" value={dailyCode} onChange={e=>setDailyCode(e.target.value)} style={styles.input} required placeholder="Contoh: SENIN-BERKAH" />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Memproses..." : "MASUK KELAS"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { height:'100vh', background:'#f0f2f5', display:'flex', justifyContent:'center', alignItems:'center' },
  card: { background:'white', padding:40, borderRadius:10, boxShadow:'0 4px 10px rgba(0,0,0,0.1)', width:'100%', maxWidth:'400px' },
  input: { width:'100%', padding:12, borderRadius:5, border:'1px solid #ccc', boxSizing:'border-box' },
  btn: { width:'100%', padding:12, background:'#2980b9', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer' }
};

export default LoginGuru;