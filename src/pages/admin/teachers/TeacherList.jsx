import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db, firebaseConfig } from '../../../firebase'; // Pastikan import firebaseConfig
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
// Import khusus untuk bikin user baru tanpa logout admin
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [dailyCode, setDailyCode] = useState("");
  const [savedCode, setSavedCode] = useState("Loading...");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Fitur Edit KPI
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  // State Form Guru (KODE ASLI + Field Baru: cabang, fotoUrl, kpiScore)
  const [newGuru, setNewGuru] = useState({ 
    nama: "", email: "", mapel: "", password: "",
    cabang: "", fotoUrl: "", kpiScore: 5.0 // <--- Tambahan
  });
  const [loading, setLoading] = useState(false);

  // LOAD DATA (KODE ASLI)
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

  // SET KODE HARIAN (KODE ASLI)
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

  // --- TAMBAH GURU + BUAT AKUN LOGIN (KODE ASLI + UPDATE FIELD) ---
  const handleAddGuru = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
        if (isEdit) {
            // Logika Update (Hanya Firestore)
            await updateDoc(doc(db, "teachers", editId), {
                nama: newGuru.nama,
                mapel: newGuru.mapel,
                cabang: newGuru.cabang,
                fotoUrl: newGuru.fotoUrl,
                kpiScore: parseFloat(newGuru.kpiScore)
            });
            alert("✅ Data & KPI Berhasil Diupdate!");
        } else {
            // Logika Tambah Baru (PAKAI SECONDARY APP ASLI KAMU)
            if(!newGuru.nama || !newGuru.email || !newGuru.password) return alert("Data wajib diisi!");
            
            let secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newGuru.email, newGuru.password);
            const user = userCredential.user;

            await addDoc(collection(db, "teachers"), {
                uid: user.uid,
                nama: newGuru.nama,
                email: newGuru.email, 
                mapel: newGuru.mapel,
                cabang: newGuru.cabang, // <--- Field baru
                fotoUrl: newGuru.fotoUrl, // <--- Field baru
                kpiScore: parseFloat(newGuru.kpiScore), // <--- Field baru
                passwordHint: newGuru.password,
                status: "Aktif",
                createdAt: new Date().toISOString()
            });

            await deleteApp(secondaryApp);
            alert(`✅ Guru Berhasil Didaftarkan!`);
        }
        
        setShowAddModal(false);
        setNewGuru({ nama: "", email: "", mapel: "", password: "", cabang: "", fotoUrl: "", kpiScore: 5.0 }); 
        fetchData(); 

    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Hapus data guru ini?")) {
        await deleteDoc(doc(db, "teachers", id));
        fetchData();
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        {/* PANEL KODE HARIAN (KODE ASLI) */}
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
            <h2 style={{color:'#333', margin:0}}>👨‍🏫 Daftar & KPI Guru</h2>
            <button onClick={() => { setIsEdit(false); setShowAddModal(true); }} style={styles.btnAdd}>+ Tambah Guru Baru</button>
        </div>
        
        {/* LIST GURU (KODE ASLI + Visual KPI) */}
        <div style={styles.grid}>
            {teachers.map(guru => (
                <div key={guru.id} style={styles.card}>
                    <div style={{display:'flex', alignItems:'center', gap:15, marginBottom:15}}>
                        <img 
                          src={guru.fotoUrl || "https://via.placeholder.com/50"} 
                          style={{width:50, height:50, borderRadius:'50%', objectFit:'cover', background:'#3498db'}} 
                          alt="profil"
                        />
                        <div style={{flex:1}}>
                            <h3 style={{margin:0, color:'#333'}}>{guru.nama}</h3>
                            <div style={{display:'flex', alignItems:'center', gap:5}}>
                                <span style={{color:'#f1c40f'}}>⭐</span>
                                <strong style={{fontSize:14}}>{guru.kpiScore || '5.0'}</strong>
                                <small style={{color:'#999'}}>| {guru.cabang || 'Pusat'}</small>
                            </div>
                        </div>
                    </div>
                    <div style={{display:'flex', gap:5}}>
                        <button 
                            onClick={() => { setIsEdit(true); setEditId(guru.id); setNewGuru(guru); setShowAddModal(true); }} 
                            style={styles.btnEdit}
                        >Edit & KPI</button>
                        <button onClick={() => handleDelete(guru.id)} style={styles.btnDel}>Hapus</button>
                    </div>
                </div>
            ))}
        </div>

        {/* MODAL INPUT (KODE ASLI + Field Baru) */}
        {showAddModal && (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <h3 style={{marginTop:0, color:'#333'}}>{isEdit ? "Update KPI & Data Guru" : "Buat Akun Guru Baru"}</h3>
                    <form onSubmit={handleAddGuru}>
                        <div style={{marginBottom:10}}>
                            <label style={styles.label}>Nama Lengkap</label>
                            <input type="text" style={styles.input} required 
                                value={newGuru.nama} onChange={e=>setNewGuru({...newGuru, nama: e.target.value})} 
                            />
                        </div>
                        
                        {!isEdit && (
                            <>
                            <div style={{marginBottom:10}}>
                                <label style={styles.label}>Email Login</label>
                                <input type="email" style={styles.input} required 
                                    value={newGuru.email} onChange={e=>setNewGuru({...newGuru, email: e.target.value})} 
                                />
                            </div>
                            <div style={{marginBottom:10}}>
                                <label style={styles.label}>Password Login</label>
                                <input type="text" style={styles.input} required 
                                    value={newGuru.password} onChange={e=>setNewGuru({...newGuru, password: e.target.value})} 
                                />
                            </div>
                            </>
                        )}

                        <div style={{display:'flex', gap:10, marginBottom:10}}>
                            <div style={{flex:1}}>
                                <label style={styles.label}>Mata Pelajaran</label>
                                <input type="text" style={styles.input} required
                                    value={newGuru.mapel} onChange={e=>setNewGuru({...newGuru, mapel: e.target.value})} 
                                />
                            </div>
                            <div style={{flex:1}}>
                                <label style={styles.label}>Cabang</label>
                                <input type="text" style={styles.input}
                                    value={newGuru.cabang} onChange={e=>setNewGuru({...newGuru, cabang: e.target.value})} 
                                    placeholder="Contoh: Pusat"
                                />
                            </div>
                        </div>

                        <div style={{marginBottom:10}}>
                            <label style={styles.label}>Skor KPI (1.0 - 5.0)</label>
                            <input type="number" step="0.1" max="5" min="1" style={{...styles.input, background:'#fffde7'}} 
                                value={newGuru.kpiScore} onChange={e=>setNewGuru({...newGuru, kpiScore: e.target.value})} 
                            />
                        </div>

                        <div style={{marginBottom:20}}>
                            <label style={styles.label}>Link Foto Profil (URL)</label>
                            <input type="text" style={styles.input}
                                value={newGuru.fotoUrl} onChange={e=>setNewGuru({...newGuru, fotoUrl: e.target.value})} 
                                placeholder="https://..."
                            />
                        </div>

                        <div style={{display:'flex', gap:10}}>
                            <button type="button" onClick={()=>setShowAddModal(false)} style={styles.btnCancel}>Batal</button>
                            <button type="submit" disabled={loading} style={styles.btnSave}>
                                {loading ? "Menyimpan..." : "Simpan Data"}
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  btnEdit: { flex: 1, padding:'8px', background:'#3498db', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontSize:12 },
  btnDel: { padding:'8px', background:'white', color:'#e74c3c', border:'1px solid #e74c3c', borderRadius:5, cursor:'pointer', fontSize:12 },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '25px', borderRadius: '10px', width: '400px', maxHeight:'90vh', overflowY:'auto' },
  label: { display:'block', marginBottom:5, fontSize:12, fontWeight:'bold' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btnSave: { flex: 1, padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnCancel: { flex: 1, padding: '10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default TeacherList;