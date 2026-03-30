import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import SidebarAdmin from '../../../components/SidebarAdmin';
import { Camera, Star, Trash2, Edit3, X, UserPlus } from 'lucide-react';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Form State
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [mapel, setMapel] = useState("");
  const [cabang, setCabang] = useState("Pusat");
  const [kpiScore, setKpiScore] = useState(5);
  const [fotoUrl, setFotoUrl] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    fetchTeachers();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teachers"));
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setFotoUrl(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const ref = doc(db, "teachers", editingId);
        await updateDoc(ref, { 
          nama, mapel, cabang, 
          kpiScore: parseFloat(kpiScore), 
          fotoUrl,
          email,
          password 
        });
        alert("✅ Data Guru Diperbarui!");
      } else {
        if (!password) return alert("Password wajib diisi!");
        await createUserWithEmailAndPassword(auth, email, password);
        await addDoc(collection(db, "teachers"), {
          nama, email, password, mapel, cabang, 
          kpiScore: parseFloat(kpiScore), 
          fotoUrl,
          createdAt: new Date()
        });
        alert("✅ Guru Berhasil Ditambahkan!");
      }
      resetForm();
      fetchTeachers();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const resetForm = () => {
    setNama(""); setEmail(""); setPassword(""); setMapel("");
    setCabang("Pusat"); setKpiScore(5); setFotoUrl("");
    setEditingId(null); setShowModal(false);
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setNama(t.nama);
    setEmail(t.email);
    setMapel(t.mapel || "");
    setCabang(t.cabang || "Pusat");
    setKpiScore(t.kpiScore || 5);
    setFotoUrl(t.fotoUrl || "");
    setPassword(t.password || ""); 
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus guru ini?")) {
      await deleteDoc(doc(db, "teachers", id));
      fetchTeachers();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      
      <div className="main-content-wrapper" style={{ 
          marginLeft: isMobile ? '0' : '260px', 
          padding: isMobile ? '15px' : '30px', 
          width: isMobile ? '100%' : 'calc(100% - 260px)',
          boxSizing: 'border-box' 
      }}>
        
        <div style={styles.header}>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>👨‍🏫 Manajemen Guru</h2>
          <button onClick={() => setShowModal(true)} style={styles.btnAdd}>+ Tambah Guru</button>
        </div>

        <div className="teacher-card" style={{overflowX: 'auto'}}>
            <table style={styles.table}>
            <thead>
                <tr style={{ background: '#2c3e50', color: 'white' }}>
                <th style={styles.th}>Foto</th>
                <th style={styles.th}>Nama / Email</th>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>Cabang</th>
                <th style={styles.th}>Aksi</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>Memuat...</td></tr>
                ) : teachers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={styles.td}>
                        <img src={t.fotoUrl || `https://ui-avatars.com/api/?name=${t.nama}`} style={styles.thumb} alt="p" />
                    </td>
                    <td style={styles.td}>
                        <b>{t.nama}</b><br/>
                        <small>{t.email}</small><br/>
                        <code style={{fontSize:10, color:'#7f8c8d'}}>Pass: {t.password}</code>
                    </td>
                    <td style={styles.td}>
                        <div style={{display:'flex', alignItems:'center', gap:4, color:'#f1c40f', fontWeight:'bold'}}>
                            <Star size={14} fill="#f1c40f"/> {t.kpiScore || 0}
                        </div>
                    </td>
                    <td style={styles.td}>{t.cabang}</td>
                    <td style={styles.td}>
                    <div style={{display:'flex', gap:5}}>
                        <button onClick={() => handleEdit(t)} style={styles.btnEdit}><Edit3 size={14}/></button>
                        <button onClick={() => handleDelete(t.id)} style={styles.btnDelete}><Trash2 size={14}/></button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {showModal && (
          <div style={styles.overlay}>
            <div style={{...styles.modal, width: isMobile ? '90%' : '450px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h3 style={{margin:0}}>{editingId ? "✏️ Edit Guru" : "🚀 Guru Baru"}</h3>
                <X onClick={resetForm} style={{cursor:'pointer'}}/>
              </div>

              <form onSubmit={handleSubmit} style={{maxHeight: '70vh', overflowY: 'auto', paddingRight: 10}}>
                {/* INPUT FOTO */}
                <div style={{textAlign:'center', marginBottom:20}}>
                    <div style={styles.photoContainer}>
                        {fotoUrl ? <img src={fotoUrl} style={styles.photoPreview} alt="preview"/> : <Camera size={40} color="#cbd5e1"/>}
                        <input type="file" accept="image/*" onChange={handleFileChange} style={styles.fileInput} />
                    </div>
                    <small style={{color:'#7f8c8d'}}>Klik ikon untuk upload foto profil</small>
                </div>

                <label style={styles.label}>Nama Lengkap</label>
                <input style={styles.input} value={nama} onChange={e=>setNama(e.target.value)} required placeholder="Budi Santoso" />
                
                <label style={styles.label}>Email Login</label>
                <input style={styles.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={editingId} placeholder="guru@email.com" />
                
                <label style={styles.label}>Password Guru</label>
                <input style={styles.input} type="text" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min 6 Karakter" />
                
                <div style={{display:'flex', gap:10}}>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Mata Pelajaran</label>
                        <input style={styles.input} value={mapel} onChange={e=>setMapel(e.target.value)} placeholder="Matematika" />
                    </div>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Rating / KPI (1-5)</label>
                        <input style={styles.input} type="number" step="0.1" min="1" max="5" value={kpiScore} onChange={e=>setKpiScore(e.target.value)} />
                    </div>
                </div>

                <div style={styles.modalAction}>
                  <button type="button" onClick={resetForm} style={styles.btnCancel}>Batal</button>
                  <button type="submit" style={styles.btnSubmit}>Simpan Data</button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  btnAdd: { padding: '12px 24px', background: '#673ab7', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight:'bold', boxShadow:'0 4px 10px rgba(103, 58, 183, 0.3)' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white' },
  th: { padding: '15px', textAlign: 'left', fontSize: 13 },
  td: { padding: '15px', fontSize: 14 },
  thumb: { width: 45, height: 45, borderRadius: 12, objectFit: 'cover', background:'#f1f5f9' },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', marginTop: 15, color: '#64748b' },
  input: { width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 5, boxSizing:'border-box', outline:'none' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', padding: 30, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  modalAction: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 30 },
  btnSubmit: { padding: '12px 25px', background: '#673ab7', color: 'white', border: 'none', borderRadius: 10, cursor:'pointer', fontWeight:'bold' },
  btnCancel: { padding: '12px 25px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, cursor:'pointer', fontWeight:'bold' },
  btnEdit: { padding: '8px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnDelete: { padding: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer' },
  
  // Photo Upload Styles
  photoContainer: { width: 100, height: 100, borderRadius: 25, background: '#f8fafc', margin: '0 auto', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1', cursor:'pointer' },
  photoPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  fileInput: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }
};

export default TeacherList;