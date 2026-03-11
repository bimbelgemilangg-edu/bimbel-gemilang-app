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
        const doc = querySnapshot.docs[0];
        const teacherData = { id: doc.id, ...doc.data() };
        
        // 3. SIMPAN KE LOCALSTORAGE (Backup Utama agar tidak Blank/Kepental)
        localStorage.setItem('isGuruLoggedIn', 'true');
        localStorage.setItem('teacherData', JSON.stringify(teacherData));
        localStorage.setItem('guruInfo', JSON.stringify(teacherData));

        // 4. NAVIGASI KE DASHBOARD
        // PENTING: Sertakan state agar dashboard langsung mengenali user tanpa loading lama
        alert(`Selamat Datang, ${teacherData.nama}!`);
        navigate('/guru/dashboard', { state: { teacher: teacherData } });
      } else {
        alert("Data profil guru tidak ditemukan di database.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login Gagal! Periksa kembali Email dan Password Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoCircle}>👨‍🏫</div>
        <h2 style={{color:'#2c3e50', margin:'0 0 5px 0'}}>Portal Guru</h2>
        <p style={{color:'#7f8c8d', marginBottom:25, fontSize:14}}>Bimbel Gemilang</p>
        
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
            {loading ? "MEMPROSES..." : "MASUK SEKARANG"}
          </button>
        </form>
        
        <button 
          onClick={() => navigate('/')} 
          style={styles.btnBack}
        >
          Kembali ke Menu Utama
        </button>
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
    background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', 
    fontFamily: 'sans-serif' 
  },
  card: { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '15px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
    textAlign: 'center', 
    width: '320px' 
  },
  logoCircle: { 
    width: 70, 
    height: 70, 
    background: '#eaf2f8', 
    borderRadius: '50%', 
    fontSize: 35, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    margin: '0 auto 15px auto' 
  },
  label: { 
    display: 'block', 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 5,
    paddingLeft: 2
  },
  input: { 
    width: '100%', 
    padding: '12px', 
    border: '1px solid #ddd', 
    borderRadius: '8px', 
    boxSizing: 'border-box', 
    fontSize: 14,
    outline: 'none'
  },
  button: { 
    width: '100%', 
    padding: '14px', 
    background: '#2c3e50', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '14px', 
    fontWeight: 'bold', 
    marginTop: 10,
    transition: '0.3s'
  },
  btnBack: { 
    background: 'none', 
    border: 'none', 
    color: '#3498db', 
    cursor: 'pointer', 
    fontSize: 13, 
    textDecoration: 'underline', 
    marginTop: 25 
  }
};

export default LoginGuru;