import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();
  
  // STATE
  const [isAdminMode, setIsAdminMode] = useState(false); 
  const [inputPassword, setInputPassword] = useState(""); 

  // --- LOGIKA LOGIN ADMIN (PASSWORD DASHBOARD) ---
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);
        
        // Default Password Login Admin
        let correctPassword = "admin123"; 
        
        // Ambil dari database jika ada
        if (docSnap.exists() && docSnap.data().adminPassword) {
            correctPassword = docSnap.data().adminPassword;
        }

        if(inputPassword === correctPassword) {
            // PENTING: Simpan 'role' agar App.js mengizinkan akses ke /admin
            localStorage.setItem("isLoggedIn", "true"); 
            localStorage.setItem("role", "admin"); // <--- INI KUNCINYA
            
            alert("✅ Login Admin Berhasil!");
            navigate("/admin"); 
        } else {
            alert("⛔ Password Admin Salah!");
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Gagal koneksi ke server.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{marginBottom:30}}>
            <h2 style={{color:'#2c3e50', margin:0, fontSize:28}}>Bimbel Gemilang</h2>
            <p style={{color:'#7f8c8d', margin:'5px 0 0 0'}}>Portal Akademik & Absensi</p>
        </div>

        {isAdminMode ? (
            /* === LOGIN ADMIN (PASSWORD) === */
            <form onSubmit={handleAdminLogin}>
                <div style={{textAlign:'left', marginBottom:15}}>
                    <label style={styles.label}>🔐 Password Admin</label>
                    <input 
                        type="password" 
                        value={inputPassword} 
                        onChange={e=>setInputPassword(e.target.value)} 
                        style={styles.input} 
                        placeholder="Masukkan Password..." 
                        autoFocus
                    />
                </div>
                <button type="submit" style={styles.btnPrimary}>MASUK DASHBOARD</button>
                
                <button type="button" onClick={()=>setIsAdminMode(false)} style={styles.btnLinkGray}>
                    ← Kembali (Menu Guru/Siswa)
                </button>
            </form>
        ) : (
            /* === MENU PILIHAN UTAMA === */
            <>
                <div style={{textAlign:'center', marginBottom:20}}>
                    <p style={{fontSize: 14, color: '#666'}}>Silakan pilih portal login Anda:</p>
                </div>
                
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                    <button onClick={()=>navigate('/login-guru')} style={{...styles.btnPrimary, background:'#34495e'}}>
                        👨‍🏫 PORTAL GURU
                    </button>
                    
                    <button onClick={()=>navigate('/login-siswa')} style={{...styles.btnPrimary, background:'#27ae60'}}>
                        🎓 PORTAL SISWA
                    </button>
                </div>
                
                <div style={{marginTop:40, borderTop:'1px solid #eee', paddingTop:20}}>
                    <button onClick={()=>setIsAdminMode(true)} style={styles.btnLinkRed}>
                        Masuk sebagai Admin (Pemilik)
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
  btnPrimary: { width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  btnLinkRed: { background: 'none', border: 'none', color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  btnLinkGray: { background: 'none', border: 'none', color: '#7f8c8d', cursor: 'pointer', fontSize: '13px', marginTop: 15 }
};

export default Login;