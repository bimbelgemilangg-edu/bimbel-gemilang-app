import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import SidebarAdmin from '../../../components/SidebarAdmin';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
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
          password // Update password di catatan firestore
        });
        alert("✅ Data Guru Diperbarui!");
      } else {
        if (!password) return alert("Password wajib diisi!");
        
        // Buat akun auth
        await createUserWithEmailAndPassword(auth, email, password);
        
        // Simpan data + password ke Firestore agar admin bisa lihat
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
      <div style={{ marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', boxSizing: 'border-box' }}>
        <div style={styles.header}>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>👨‍🏫 Manajemen Guru</h2>
          <button onClick={() => setShowModal(true)} style={styles.btnAdd}>+ Tambah Guru</button>
        </div>

        {loading ? <p>Memuat...</p> : (
          <table style={styles.table}>
            <thead>
              <tr style={{ background: '#2c3e50', color: 'white' }}>
                <th style={styles.th}>Foto</th>
                <th style={styles.th}>Nama / Email</th>
                <th style={styles.th}>Password</th>
                <th style={styles.th}>Cabang</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={styles.td}><img src={t.fotoUrl || "https://via.placeholder.com/40"} style={styles.thumb} alt="p" /></td>
                  <td style={styles.td}><b>{t.nama}</b><br/><small>{t.email}</small></td>
                  <td style={styles.td}><code style={{background:'#eee', padding:'2px 5px'}}>{t.password || 'N/A'}</code></td>
                  <td style={styles.td}>{t.cabang}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleEdit(t)} style={styles.btnEdit}>Edit</button>
                    <button onClick={() => handleDelete(t.id)} style={styles.btnDelete}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showModal && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>{editingId ? "Edit Guru" : "Guru Baru"}</h3>
              <form onSubmit={handleSubmit}>
                <label style={styles.label}>Nama</label>
                <input style={styles.input} value={nama} onChange={e=>setNama(e.target.value)} required />
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={editingId} />
                <label style={styles.label}>Password (Akan terlihat oleh admin)</label>
                <input style={styles.input} type="text" value={password} onChange={e=>setPassword(e.target.value)} required />
                <label style={styles.label}>Mata Pelajaran</label>
                <input style={styles.input} value={mapel} onChange={e=>setMapel(e.target.value)} />
                <div style={styles.modalAction}>
                  <button type="button" onClick={resetForm} style={styles.btnCancel}>Batal</button>
                  <button type="submit" style={styles.btnSubmit}>Simpan</button>
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
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 25 },
  btnAdd: { padding: '12px 24px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight:'bold' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  th: { padding: '15px', textAlign: 'left' },
  td: { padding: '15px' },
  thumb: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', marginTop: 12 },
  input: { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd', marginTop: 5, boxSizing:'border-box' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: 30, borderRadius: 20, width: '400px' },
  modalAction: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 25 },
  btnSubmit: { padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 8, cursor:'pointer' },
  btnCancel: { padding: '10px 20px', background: '#eee', border: 'none', borderRadius: 8, cursor:'pointer' },
  btnEdit: { padding: '6px 12px', background: '#3498db', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 5 },
  btnDelete: { padding: '6px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }
};

export default TeacherList;