import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db, firebaseConfig } from '../../../firebase'; 
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [dailyCode, setDailyCode] = useState("");
  const [savedCode, setSavedCode] = useState("Loading...");
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const [newGuru, setNewGuru] = useState({ 
    nama: "", email: "", mapel: "", password: "",
    cabang: "", fotoUrl: "", kpiScore: 5.0 
  });
  const [loading, setLoading] = useState(false);

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

  useEffect(() => { fetchData(); }, []);

  // FUNGSI KONVERSI FILE KE BASE64 (Agar bisa upload dari perangkat)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewGuru({ ...newGuru, fotoUrl: reader.result });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSetCode = async () => {
    if(!dailyCode) return alert("Kode tidak boleh kosong!");
    const today = new Date().toISOString().split('T')[0];
    try {
        await setDoc(doc(db, "settings", `daily_code_${today}`), { code: dailyCode });
        setSavedCode(dailyCode);
        alert(`✅ Kode berhasil diset: ${dailyCode}`);
    } catch (error) { console.error(error); }
  };

  const handleAddGuru = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (isEdit) {
            // FIX: Gunakan || "" agar tidak mengirim 'undefined' ke Firestore
            await updateDoc(doc(db, "teachers", editId), {
                nama: newGuru.nama || "",
                mapel: newGuru.mapel || "",
                cabang: newGuru.cabang || "",
                fotoUrl: newGuru.fotoUrl || "",
                kpiScore: parseFloat(newGuru.kpiScore) || 0
            });
            alert("✅ Update Berhasil!");
        } else {
            // LOGIKA TAMBAH (SECONDARY APP ASLI ANDA)
            let secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newGuru.email, newGuru.password);
            
            await addDoc(collection(db, "teachers"), {
                uid: userCredential.user.uid,
                nama: newGuru.nama || "",
                email: newGuru.email || "", 
                mapel: newGuru.mapel || "",
                cabang: newGuru.cabang || "",
                fotoUrl: newGuru.fotoUrl || "",
                kpiScore: parseFloat(newGuru.kpiScore) || 5.0,
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
        alert("Gagal: " + error.message);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Hapus data guru?")) {
        await deleteDoc(doc(db, "teachers", id));
        fetchData();
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.codePanel}>
            <div><h3 style={{margin:0, color:'white'}}>🔑 Kode Absen: {savedCode}</h3></div>
            <div style={{display:'flex', gap:10}}>
                <input type="text" value={dailyCode} onChange={(e)=>setDailyCode(e.target.value)} style={styles.inputCode}/>
                <button onClick={handleSetCode} style={styles.btnSet}>SET KODE</button>
            </div>
        </div>

        <div style={styles.headerRow}>
            <h2>👨‍🏫 Manajemen Guru & KPI</h2>
            <button onClick={() => { setIsEdit(false); setNewGuru({nama:"", email:"", mapel:"", password:"", cabang:"", fotoUrl:"", kpiScore:5.0}); setShowAddModal(true); }} style={styles.btnAdd}>+ Tambah Guru Baru</button>
        </div>
        
        <div style={styles.grid}>
            {teachers.map(guru => (
                <div key={guru.id} style={styles.card}>
                    <div style={{display:'flex', alignItems:'center', gap:15, marginBottom:15}}>
                        <img src={guru.fotoUrl || "https://via.placeholder.com/50"} style={styles.avatarImg} alt="p" />
                        <div style={{flex:1}}>
                            <h3 style={{margin:0}}>{guru.nama}</h3>
                            <span style={{color:'#f39c12', fontWeight:'bold'}}>⭐ {guru.kpiScore || '5.0'}</span>
                        </div>
                    </div>
                    <div style={{display:'flex', gap:5}}>
                        <button onClick={() => { 
                            setIsEdit(true); 
                            setEditId(guru.id); 
                            // Pastikan state baru terisi data lama atau string kosong (cegah undefined)
                            setNewGuru({
                                nama: guru.nama || "",
                                email: guru.email || "",
                                mapel: guru.mapel || "",
                                cabang: guru.cabang || "",
                                fotoUrl: guru.fotoUrl || "",
                                kpiScore: guru.kpiScore || 5.0,
                                password: ""
                            }); 
                            setShowAddModal(true); 
                        }} style={styles.btnEdit}>Edit/KPI</button>
                        <button onClick={() => handleDelete(guru.id)} style={styles.btnDel}>Hapus</button>
                    </div>
                </div>
            ))}
        </div>

        {showAddModal && (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <h3>{isEdit ? "Edit Guru" : "Tambah Guru"}</h3>
                    <form onSubmit={handleAddGuru}>
                        <label style={styles.label}>Nama</label>
                        <input type="text" style={styles.input} required value={newGuru.nama} onChange={e=>setNewGuru({...newGuru, nama: e.target.value})} />
                        
                        {!isEdit && (
                            <>
                                <label style={styles.label}>Email & Password</label>
                                <input type="email" style={styles.input} required value={newGuru.email} onChange={e=>setNewGuru({...newGuru, email: e.target.value})} />
                                <input type="text" style={styles.input} required value={newGuru.password} onChange={e=>setNewGuru({...newGuru, password: e.target.value})} />
                            </>
                        )}

                        <div style={{display:'flex', gap:10}}>
                            <div style={{flex:1}}>
                                <label style={styles.label}>Cabang</label>
                                <input type="text" style={styles.input} value={newGuru.cabang} onChange={e=>setNewGuru({...newGuru, cabang: e.target.value})} />
                            </div>
                            <div style={{flex:1}}>
                                <label style={styles.label}>KPI (1-5)</label>
                                <input type="number" step="0.1" style={styles.input} value={newGuru.kpiScore} onChange={e=>setNewGuru({...newGuru, kpiScore: e.target.value})} />
                            </div>
                        </div>

                        {/* INPUT FILE DARI PERANGKAT */}
                        <label style={styles.label}>Foto Profil (Upload File)</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} style={{marginBottom:15}} />
                        {newGuru.fotoUrl && <img src={newGuru.fotoUrl} alt="Preview" style={{width:50, height:50, display:'block', marginBottom:10}} />}

                        <div style={{display:'flex', gap:10}}>
                            <button type="button" onClick={()=>setShowAddModal(false)} style={styles.btnCancel}>Batal</button>
                            <button type="submit" disabled={loading} style={styles.btnSave}>Simpan</button>
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
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh' },
  codePanel: { background: 'linear-gradient(to right, #2980b9, #2c3e50)', padding: 15, borderRadius: 10, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 },
  inputCode: { padding: 8, borderRadius: 5, border: 'none' },
  btnSet: { padding: '8px 15px', background: '#f1c40f', border: 'none', borderRadius: 5, fontWeight:'bold', cursor:'pointer' },
  headerRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 },
  btnAdd: { padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  avatarImg: { width:50, height:50, borderRadius:'50%', objectFit:'cover', background:'#eee' },
  btnEdit: { flex:1, padding:'8px', background:'#3498db', color:'white', border:'none', borderRadius:5, cursor:'pointer' },
  btnDel: { padding:'8px', background:'white', color:'#e74c3c', border:'1px solid #e74c3c', borderRadius:5, cursor:'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '25px', borderRadius: '10px', width: '400px', maxHeight:'90vh', overflowY:'auto' },
  label: { display:'block', marginBottom:5, fontSize:12, fontWeight:'bold' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom:10 },
  btnSave: { flex: 1, padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnCancel: { flex: 1, padding: '10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default TeacherList;