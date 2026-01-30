import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
// KONEKSI DATABASE
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({ nama: "", mapel: "" });
  const [dailyCode, setDailyCode] = useState(localStorage.getItem("DAILY_TEACHER_CODE") || "");

  // --- 1. AMBIL DATA GURU DARI CLOUD ---
  const fetchTeachers = async () => {
    const querySnapshot = await getDocs(collection(db, "teachers")); // Nama tabel: teachers
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTeachers(data);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // --- 2. SIMPAN GURU KE CLOUD ---
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!newTeacher.nama) return alert("Nama wajib diisi!");

    try {
      await addDoc(collection(db, "teachers"), newTeacher);
      alert("✅ Guru Berhasil Disimpan ke Database!");
      setNewTeacher({ nama: "", mapel: "" });
      fetchTeachers(); // Refresh tabel
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // --- 3. HAPUS DARI CLOUD ---
  const handleDelete = async (id) => {
    if (window.confirm("Hapus guru ini?")) {
      await deleteDoc(doc(db, "teachers", id));
      fetchTeachers();
    }
  };

  const handleSaveCode = () => {
    localStorage.setItem("DAILY_TEACHER_CODE", dailyCode);
    alert("Kode Harian Disimpan!");
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2>👨‍🏫 Master Data Guru (Online)</h2>
        
        {/* INPUT KODE HARIAN */}
        <div style={styles.cardInfo}>
          <b>🔑 Kode Akses Harian:</b>
          <input value={dailyCode} onChange={e => setDailyCode(e.target.value)} style={{marginLeft:10, padding:5}} />
          <button onClick={handleSaveCode} style={{marginLeft:10}}>Simpan</button>
        </div>

        <div style={styles.grid}>
          {/* FORM TAMBAH */}
          <div style={styles.card}>
            <h3>+ Tambah Guru</h3>
            <form onSubmit={handleAddTeacher}>
              <div style={styles.group}>
                <label>Nama Guru</label>
                <input style={styles.input} value={newTeacher.nama} onChange={e => setNewTeacher({...newTeacher, nama: e.target.value})} placeholder="Contoh: Pak Budi" />
              </div>
              <div style={styles.group}>
                <label>Mapel</label>
                <input style={styles.input} value={newTeacher.mapel} onChange={e => setNewTeacher({...newTeacher, mapel: e.target.value})} placeholder="Contoh: Matematika" />
              </div>
              <button style={styles.btnSave}>Simpan ke Database</button>
            </form>
          </div>

          {/* TABEL LIST */}
          <div style={styles.card}>
            <h3>Daftar Guru</h3>
            <table style={styles.table}>
              <thead>
                <tr style={{background:'#eee'}}><th>Nama</th><th>Mapel</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id}>
                    <td style={{padding:10}}><b>{t.nama}</b></td>
                    <td>{t.mapel}</td>
                    <td><button onClick={() => handleDelete(t.id)} style={{color:'red'}}>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  cardInfo: { background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px' },
  group: { marginBottom: '10px' },
  input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop:5, boxSizing:'border-box' },
  btnSave: { width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' }
};

export default TeacherList;