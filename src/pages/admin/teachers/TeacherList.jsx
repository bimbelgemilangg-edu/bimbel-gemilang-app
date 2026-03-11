import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Sidebar from '../../../components/Sidebar';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Untuk Guru Baru
  const [mapel, setMapel] = useState("");
  const [cabang, setCabang] = useState("Pusat");
  const [kpiScore, setKpiScore] = useState(5);
  const [fotoUrl, setFotoUrl] = useState("");

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teachers"));
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  // Fungsi Kompresi Foto
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
        // UPDATE GURU
        const ref = doc(db, "teachers", editingId);
        await updateDoc(ref, { 
          nama, mapel, cabang, 
          kpiScore: parseFloat(kpiScore), 
          fotoUrl,
          email // Tetap simpan email agar sinkron
        });
        alert("✅ Data Guru Diperbarui!");
      } else {
        // TAMBAH GURU BARU + BUAT AKUN LOGIN
        if (!password) return alert("Password wajib diisi untuk guru baru!");
        
        // 1. Buat akun di Firebase Auth
        await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Simpan ke Database Firestore
        await addDoc(collection(db, "teachers"), {
          nama, email, mapel, cabang, 
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
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus guru ini?")) {
      await deleteDoc(doc(db, "teachers", id));
      fetchTeachers();
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h2>👨‍🏫 Manajemen Guru & KPI</h2>
          <button onClick={() => setShowModal(true)} style={styles.btnAdd}>+ Tambah Guru Baru</button>
        </div>

        {loading ? <p>Memuat...</p> : (
          <table style={styles.table}>
            <thead>
              <tr style={{background:'#f8f9fa'}}>
                <th>Foto</th>
                <th>Nama / Email</th>
                <th>Mata Pelajaran</th>
                <th>Cabang</th>
                <th>Skor KPI</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id}>
                  <td><img src={t.fotoUrl || "https://via.placeholder.com/40"} style={styles.thumb} /></td>
                  <td>
                    <strong>{t.nama}</strong><br/>
                    <span style={{fontSize:11, color:'#666'}}>{t.email}</span>
                  </td>
                  <td>{t.mapel}</td>
                  <td>{t.cabang}</td>
                  <td style={{fontWeight:'bold', color:'#f39c12'}}>⭐ {t.kpiScore}</td>
                  <td>
                    <button onClick={() => handleEdit(t)} style={styles.btnEdit}>Edit</button>
                    <button onClick={() => handleDelete(t.id)} style={styles.btnDelete}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* MODAL INPUT/EDIT */}
        {showModal && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>{editingId ? "Edit Guru" : "Tambah Guru Baru"}</h3>
              <form onSubmit={handleSubmit}>
                <label style={styles.label}>Nama Lengkap</label>
                <input style={styles.input} value={nama} onChange={e=>setNama(e.target.value)} required />

                <label style={styles.label}>Email (Username Login)</label>
                <input style={styles.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={editingId} />

                {!editingId && (
                  <>
                    <label style={styles.label}>Password Login</label>
                    <input style={styles.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                  </>
                )}

                <label style={styles.label}>Mata Pelajaran</label>
                <input style={styles.input} value={mapel} onChange={e=>setMapel(e.target.value)} />

                <div style={{display:'flex', gap:10}}>
                  <div style={{flex:1}}>
                    <label style={styles.label}>Cabang</label>
                    <select style={styles.input} value={cabang} onChange={e=>setCabang(e.target.value)}>
                      <option value="Pusat">Pusat</option>
                      <option value="Cabang 1">Cabang 1</option>
                      <option value="Cabang 2">Cabang 2</option>
                    </select>
                  </div>
                  <div style={{flex:1}}>
                    <label style={styles.label}>KPI (Skor 1-5)</label>
                    <input style={styles.input} type="number" step="0.1" min="1" max="5" value={kpiScore} onChange={e=>setKpiScore(e.target.value)} />
                  </div>
                </div>

                <label style={styles.label}>Foto Profil</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{marginBottom:15}} />

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
  content: { marginLeft: '250px', padding: '30px', width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  btnAdd: { padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  thumb: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: { width: '100%', padding: '10px', borderRadius: 5, border: '1px solid #ddd', boxSizing: 'border-box' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: 30, borderRadius: 15, width: '400px', maxHeight: '90vh', overflowY: 'auto' },
  modalAction: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  btnSubmit: { padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' },
  btnCancel: { padding: '10px 20px', background: '#eee', border: 'none', borderRadius: 5, cursor: 'pointer' },
  btnEdit: { padding: '5px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', marginRight: 5 },
  btnDelete: { padding: '5px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }
};

export default TeacherList;