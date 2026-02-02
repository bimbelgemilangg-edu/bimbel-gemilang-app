import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginGuru = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. LOGIN KE FIREBASE AUTH
      await signInWithEmailAndPassword(auth, email, password);

      // 2. AMBIL DATA GURU DARI DATABASE
      const q = query(collection(db, "teachers"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Data Guru Ketemu
        const teacherData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        
        // Simpan sesi (opsional jika pakai context)
        localStorage.setItem('guruInfo', JSON.stringify(teacherData));

        alert(`Selamat Datang, ${teacherData.nama}!`);
        
        // Redirect ke Dashboard Guru membawa data
        navigate('/guru/dashboard', { state: { teacher: teacherData } });
      } else {
        alert("Login berhasil, tapi data profil guru tidak ditemukan di database. Hubungi Admin.");
      }

    } catch (error) {
      console.error(error);
      alert("Login Gagal! Periksa Email dan Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoCircle}>👨‍🏫</div>
        <h2 style={{color:'#2c3e50', marginBottom:5}}>Portal Guru</h2>
        <p style={{color:'#7f8c8d', marginBottom:20, fontSize:14}}>Bimbel Gemilang</p>
        
        <form onSubmit={handleLogin}>
          <div style={{textAlign:'left', marginBottom:15}}>
            <label style={styles.label}>Email</label>
            <input 
              type="email" 
              placeholder="email@guru.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={{textAlign:'left', marginBottom:20}}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Memproses..." : "MASUK SEKARANG"}
          </button>
        </form>

        <p style={{marginTop:20, fontSize:12, color:'#999'}}>
          Belum punya akun? Minta Admin untuk mendaftarkan.
        </p>
        <button onClick={() => navigate('/')} style={{background:'none', border:'none', color:'#3498db', cursor:'pointer', fontSize:12, textDecoration:'underline'}}>
            Kembali ke Menu Utama
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', fontFamily:'sans-serif' },
  card: { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center', width: '320px' },
  logoCircle: { width:60, height:60, background:'#eaf2f8', borderRadius:'50%', fontSize:30, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 15px auto' },
  label: { display:'block', fontSize:12, fontWeight:'bold', color:'#333', marginBottom:5 },
  input: { width: '100%', padding: '12px', marginBottom: '5px', border: '1px solid #ddd', borderRadius: '5px', boxSizing:'border-box', fontSize:14 },
  button: { width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', marginTop:10 },
};

export default LoginGuru;