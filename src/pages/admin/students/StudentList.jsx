import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  // Form State (Sederhana untuk demo)
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("4 SD");

  // --- 1. AMBIL SISWA DARI CLOUD ---
  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, "students")); // Nama tabel: students
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStudents(data);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // --- 2. SIMPAN SISWA KE CLOUD ---
  const handleAddStudent = async () => {
    if (!newName) return alert("Nama kosong!");
    await addDoc(collection(db, "students"), { 
      nama: newName, 
      kelas: newClass, 
      status: "Aktif" 
    });
    alert("✅ Siswa Tersimpan!");
    setNewName("");
    fetchStudents();
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2>👨‍🎓 Master Data Siswa (Online)</h2>

        {/* FORM CEPAT */}
        <div style={styles.card}>
          <h3>+ Input Siswa Baru</h3>
          <div style={{display:'flex', gap:'10px'}}>
            <input style={styles.input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nama Siswa..." />
            <select style={styles.select} value={newClass} onChange={e => setNewClass(e.target.value)}>
              <option>4 SD</option><option>5 SD</option><option>6 SD</option>
              <option>7 SMP</option><option>8 SMP</option><option>9 SMP</option>
            </select>
            <button onClick={handleAddStudent} style={styles.btnSave}>Simpan</button>
          </div>
        </div>

        {/* LIST SISWA */}
        <div style={{...styles.card, marginTop: 20}}>
          <h3>Daftar Siswa</h3>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#eee', textAlign:'left'}}>
                <th style={{padding:10}}>Nama</th><th>Kelas</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={{padding:10}}><b>{s.nama}</b></td>
                  <td>{s.kelas}</td>
                  <td><span style={{background:'#d4edda', padding:'3px 8px', borderRadius:'10px', fontSize:'12px'}}>Aktif</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', flex: 2 },
  select: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 },
  btnSave: { padding: '10px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default StudentList;