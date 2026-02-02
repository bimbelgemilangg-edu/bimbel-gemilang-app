import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db, firebaseConfig } from '../../../firebase'; // Pastikan import firebaseConfig
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
// Import khusus untuk bikin user baru tanpa logout admin
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [dailyCode, setDailyCode] = useState("");
  const [savedCode, setSavedCode] = useState("Loading...");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State Form Guru (Ditambah Password)
  const [newGuru, setNewGuru] = useState({ nama: "", email: "", mapel: "", password: "" });
  const [loading, setLoading] = useState(false);

  // LOAD DATA
  const fetchData = async () => {
    const tSnap = await getDocs(collection(db, "teachers"));
    setTeachers(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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

  useEffect(() => {
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

  // --- TAMBAH GURU + BUAT AKUN LOGIN (CORE FEATURE) ---
  const handleAddGuru = async (e) => {
    e.preventDefault();
    if(!newGuru.nama || !newGuru.email || !newGuru.password) return alert("Semua data wajib diisi!");

    setLoading(true);
    let secondaryApp = null;

    try {
        // 1. BUAT AKUN DI FIREBASE AUTH (Tanpa Logout Admin)
        // Kita inisialisasi app kedua khusus untuk register user baru
        secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newGuru.email, newGuru.password);
        const user = userCredential.user;

        // 2. SIMPAN DATA PROFIL KE DATABASE (Firestore)
        await addDoc(collection(db, "teachers"), {
            uid: user.uid, // Simpan UID biar terhubung
            nama: newGuru.nama,
            email: newGuru.email, 
            mapel: newGuru.mapel, 
            passwordHint: newGuru.password, // (Opsional) Biar admin ingat passwordnya
            status: "Aktif",
            createdAt: new Date().toISOString()
        });

        alert(`✅ Guru Berhasil Didaftarkan!\nEmail: ${newGuru.email}\nPass: ${newGuru.password}`);
        setShowAddModal(false);
        setNewGuru({ nama: "", email: "", mapel: "", password: "" }); 
        fetchData(); 

    } catch (error) {
        console.error(error);
        if(error.code === 'auth/email-already-in-use') {
            alert("❌ Email ini sudah terdaftar sebelumnya!");
        } else {
            alert("Gagal menambah guru: " + error.message);
        }
    } finally {
        // Hapus app secondary agar tidak membebani memori
        if(secondaryApp) deleteApp(secondaryApp);
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Hapus data guru ini? (Catatan: Akun login harus dinonaktifkan manual di Firebase Console jika ingin hapus permanen aksesnya).")) {
        await deleteDoc(doc(db, "teachers", id));
        fetchData();
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        {/* PANEL KODE HARIAN */}
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

        {/* HEADER */}
        <div style={styles.headerRow}>
            <h2 style={{color:'#333', margin:0}}>👨‍🏫 Daftar & Akun Guru</h2>
            <button onClick={() => setShowAddModal(true)} style={styles.btnAdd}>+ Tambah Guru Baru</button>
        </div>
        
        {/* LIST GURU */}
        <div style={styles.grid}>
            {teachers.map(guru => (
                <div key={guru.id} style={styles.card}>
                    <div style={{display:'flex', alignItems:'center', gap:15, marginBottom:15}}>
                        <div style={styles.avatar}>{guru.nama ? guru.nama.charAt(0) : 'G'}</div>
                        <div>
                            <h3 style={{margin:0, color:'#333'}}>{guru.nama}</h3>
                            <small style={{color:'#666', display:'block'}}>{guru.email}</small>
                            {guru.passwordHint && <small style={{color:'#999', fontSize:10}}>Pass: {guru.passwordHint}</small>}
                            <div style={{marginTop:5}}>
                                <small style={{color:'#2980b9', fontWeight:'bold', background:'#eaf2f8', padding:'2px 8px', borderRadius:4}}>
                                    {guru.mapel || "Umum"}
                                </small>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => handleDelete(guru.id)} style={styles.btnDel}>Hapus Data</button>
                </div>
            ))}
        </div>

        {/* MODAL INPUT DENGAN PASSWORD */}
        {showAddModal && (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <h3 style={{marginTop:0, color:'#333'}}>Buat Akun Guru Baru</h3>
                    <form onSubmit={handleAddGuru}>
                        <div style={{marginBottom:15}}>
                            <label style={{display:'block', marginBottom:5}}>Nama Lengkap</label>
                            <input type="text" style={styles.input} required 
                                value={newGuru.nama} onChange={e=>setNewGuru({...newGuru, nama: e.target.value})} 
                                placeholder="Mr. Budi Santoso"
                            />
                        </div>
                        <div style={{marginBottom:15}}>
                            <label style={{display:'block', marginBottom:5}}>Email Login</label>
                            <input type="email" style={styles.input} required 
                                value={newGuru.email} onChange={e=>setNewGuru({...newGuru, email: e.target.value})} 
                                placeholder="budi@gmail.com"
                            />
                        </div>
                        
                        {/* INPUT PASSWORD BARU */}
                        <div style={{marginBottom:15}}>
                            <label style={{display:'block', marginBottom:5, color:'#c0392b', fontWeight:'bold'}}>Password Login</label>
                            <input type="text" style={{...styles.input, border:'1px solid #c0392b'}} required 
                                value={newGuru.password} onChange={e=>setNewGuru({...newGuru, password: e.target.value})} 
                                placeholder="Buatkan password (min 6 karakter)"
                            />
                            <small style={{color:'#7f8c8d'}}>Password ini digunakan guru untuk login.</small>
                        </div>

                        <div style={{marginBottom:20}}>
                            <label style={{display:'block', marginBottom:5, fontWeight:'bold', color:'#2980b9'}}>Mata Pelajaran</label>
                            <input type="text" style={styles.input} required
                                value={newGuru.mapel} onChange={e=>setNewGuru({...newGuru, mapel: e.target.value})} 
                                placeholder="Contoh: Matematika"
                            />
                        </div>

                        <div style={{display:'flex', gap:10}}>
                            <button type="button" onClick={()=>setShowAddModal(false)} style={styles.btnCancel}>Batal</button>
                            <button type="submit" disabled={loading} style={styles.btnSave}>
                                {loading ? "Mendaftarkan..." : "Simpan & Buat Akun"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'Segoe UI, sans-serif' },
  codePanel: { background: 'linear-gradient(to right, #2980b9, #2c3e50)', padding: 20, borderRadius: 10, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 4px 6px rgba(0,0,0,0.1)', marginBottom: 20 },
  inputCode: { padding: 10, borderRadius: 5, border: 'none', fontWeight:'bold', textTransform:'uppercase' },
  btnSet: { padding: '10px 20px', background: '#f1c40f', border: 'none', borderRadius: 5, fontWeight:'bold', cursor:'pointer', color:'#2c3e50' },
  headerRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 },
  btnAdd: { padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  avatar: { width:50, height:50, borderRadius:'50%', background:'#3498db', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:'bold' },
  btnDel: { width:'100%', padding:'8px', background:'white', color:'#e74c3c', border:'1px solid #e74c3c', borderRadius:5, cursor:'pointer', fontSize:12 },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '25px', borderRadius: '10px', width: '400px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btnSave: { flex: 1, padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnCancel: { flex: 1, padding: '10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default TeacherList;