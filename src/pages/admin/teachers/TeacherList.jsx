import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  
  // STATE KODE HARIAN
  const [dailyCode, setDailyCode] = useState("");
  const [savedCode, setSavedCode] = useState("Loading...");

  // LOAD DATA
  useEffect(() => {
    const fetchData = async () => {
        // 1. Ambil List Guru
        const tSnap = await getDocs(collection(db, "teachers"));
        setTeachers(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // 2. Ambil Kode Hari Ini
        const today = new Date().toISOString().split('T')[0];
        const codeRef = doc(db, "settings", `daily_code_${today}`);
        const codeSnap = await getDoc(codeRef);
        
        if (codeSnap.exists()) {
            setSavedCode(codeSnap.data().code);
            setDailyCode(codeSnap.data().code);
        } else {
            setSavedCode("(Belum diset)");
        }
    };
    fetchData();
  }, []);

  // SET KODE HARIAN
  const handleSetCode = async () => {
    if(!dailyCode) return alert("Kode tidak boleh kosong!");
    const today = new Date().toISOString().split('T')[0];
    try {
        await setDoc(doc(db, "settings", `daily_code_${today}`), { code: dailyCode });
        setSavedCode(dailyCode);
        alert(`✅ Kode hari ini (${today}) berhasil diset: ${dailyCode}`);
    } catch (error) {
        console.error(error);
        alert("Gagal set kode.");
    }
  };

  const handleDelete = async (id) => {
    if(confirm("Hapus data guru ini?")) {
        await deleteDoc(doc(db, "teachers", id));
        window.location.reload(); 
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        {/* PANEL KODE HARIAN (PENTING!) */}
        <div style={styles.codePanel}>
            <div>
                <h3 style={{margin:0, color:'white'}}>🔑 Kode Absen Hari Ini</h3>
                <p style={{margin:0, color:'#ecf0f1', fontSize:12}}>Bagikan kode ini ke guru agar bisa absen.</p>
            </div>
            <div style={{display:'flex', gap:10}}>
                <input 
                    type="text" 
                    value={dailyCode} 
                    onChange={(e)=>setDailyCode(e.target.value)} 
                    placeholder="Contoh: SENIN-BERKAH"
                    style={styles.inputCode}
                />
                <button onClick={handleSetCode} style={styles.btnSet}>SET KODE</button>
            </div>
            <div style={{background:'rgba(255,255,255,0.2)', padding:'5px 15px', borderRadius:5}}>
                Status: <strong>{savedCode}</strong>
            </div>
        </div>

        <h2 style={{color:'#333', marginTop:20}}>👨‍🏫 Daftar Guru</h2>
        
        <div style={styles.grid}>
            {teachers.map(guru => (
                <div key={guru.id} style={styles.card}>
                    <div style={{display:'flex', alignItems:'center', gap:15, marginBottom:15}}>
                        <div style={styles.avatar}>{guru.nama ? guru.nama.charAt(0) : 'G'}</div>
                        <div>
                            <h3 style={{margin:0, color:'#333'}}>{guru.nama}</h3>
                            <small style={{color:'#666'}}>{guru.email}</small>
                        </div>
                    </div>
                    <button onClick={() => handleDelete(guru.id)} style={styles.btnDel}>Hapus Akses</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'Segoe UI, sans-serif' },
  codePanel: { background: 'linear-gradient(to right, #2980b9, #2c3e50)', padding: 20, borderRadius: 10, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 4px 6px rgba(0,0,0,0.1)' },
  inputCode: { padding: 10, borderRadius: 5, border: 'none', fontWeight:'bold', textTransform:'uppercase' },
  btnSet: { padding: '10px 20px', background: '#f1c40f', border: 'none', borderRadius: 5, fontWeight:'bold', cursor:'pointer', color:'#2c3e50' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  avatar: { width:50, height:50, borderRadius:'50%', background:'#3498db', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:'bold' },
  btnDel: { width:'100%', padding:'8px', background:'white', color:'#e74c3c', border:'1px solid #e74c3c', borderRadius:5, cursor:'pointer', fontSize:12 },
};

export default TeacherList;