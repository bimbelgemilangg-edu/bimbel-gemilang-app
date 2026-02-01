import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();
  
  // STATE MODE: Apakah sedang login Guru atau Admin?
  const [isAdminMode, setIsAdminMode] = useState(false); 
  
  // DATA
  const [teachers, setTeachers] = useState([]);
  
  // INPUT
  const [selectedGuru, setSelectedGuru] = useState("");
  const [adminPin, setAdminPin] = useState("");

  // LOAD NAMA GURU UTK DROPDOWN
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const snap = await getDocs(collection(db, "teachers"));
        setTeachers(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch (e) { console.error(e); }
    };
    fetchTeachers();
  }, []);

  // --- LOGIKA LOGIN ADMIN ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    // Password Sederhana (Bisa diganti nanti)
    // Coba masukkan "admin123" atau "1234"
    if(adminPin === "admin123" || adminPin === "1234") {
        localStorage.setItem("isLoggedIn", "true"); // 🔑 BERIKAN TIKET MASUK
        navigate("/admin"); // 🚀 MELUNCUR KE DASHBOARD
    } else {
        alert("⛔ PIN Admin Salah!");
    }
  };

  // --- LOGIKA LOGIN GURU ---
  const handleGuruLogin = () => {
    if(!selectedGuru) return alert("Pilih nama guru dulu!");
    const guruData = teachers.find(t => t.nama === selectedGuru);
    
    // Guru tidak perlu password, langsung masuk tapi BUKAN ke area admin
    navigate("/guru/dashboard", { state: { teacher: guruData } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{marginBottom:30}}>
            <h2 style={{color:'#2c3e50', margin:0, fontSize:28}}>Bimbel Gemilang</h2>
            <p style={{color:'#7f8c8d', margin:'5px 0 0 0'}}>Portal Akademik & Absensi</p>
        </div>

        {isAdminMode ? (
            /* === TAMPILAN 2: LOGIN ADMIN (PASSWORD) === */
            <form onSubmit={handleAdminLogin}>
                <div style={{textAlign:'left', marginBottom:15}}>
                    <label style={styles.label}>🔐 Masukkan PIN Admin</label>
                    <input 
                        type="password" 
                        value={adminPin} 
                        onChange={e=>setAdminPin(e.target.value)} 
                        style={styles.input} 
                        placeholder="PIN Rahasia..." 
                        autoFocus
                    />
                </div>
                <button type="submit" style={styles.btnPrimary}>MASUK DASHBOARD</button>
                
                <button type="button" onClick={()=>setIsAdminMode(false)} style={styles.btnLinkGray}>
                    ← Kembali ke Login Guru
                </button>
            </form>
        ) : (
            /* === TAMPILAN 1: LOGIN GURU (DROPDOWN) === */
            <>
                <div style={{textAlign:'left', marginBottom:15}}>
                    <label style={styles.label}>👤 Pilih Nama Anda</label>
                    <select value={selectedGuru} onChange={e=>setSelectedGuru(e.target.value)} style={styles.select}>
                        <option value="">-- Daftar Nama Guru --</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.nama}>{t.nama}</option>
                        ))}
                    </select>
                </div>
                <button onClick={handleGuruLogin} style={styles.btnPrimary}>MASUK KELAS</button>
                
                <div style={{marginTop:40, borderTop:'1px solid #eee', paddingTop:20}}>
                    <small style={{color:'#999', display:'block', marginBottom:5}}>Administrator?</small>
                    {/* TOMBOL INI SKRG CUMA GANTI STATE, TIDAK PINDAH HALAMAN */}
                    <button onClick={()=>setIsAdminMode(true)} style={styles.btnLinkRed}>
                        Login Admin
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' },
  card: { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '350px', textAlign: 'center' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '14px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', background: 'white' },
  btnPrimary: { width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: '0.3s' },
  btnLinkRed: { background: 'none', border: 'none', color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  btnLinkGray: { background: 'none', border: 'none', color: '#7f8c8d', cursor: 'pointer', fontSize: '13px', marginTop: 15 }
};

export default Login;