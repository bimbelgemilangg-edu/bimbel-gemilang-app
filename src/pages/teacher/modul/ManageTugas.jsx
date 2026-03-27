import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Edit3, Clock } from 'lucide-react';

const ManageTugas = () => {
  const [tugas, setTugas] = useState({ title: '', desc: '', deadline: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "bimbel_modul"), {
      ...tugas,
      type: 'tugas',
      createdAt: serverTimestamp()
    });
    alert("📝 Tugas telah dikirim ke siswa!");
  };

  return (
    <div style={styles.card}>
      <h3><Edit3 size={20}/> Buat Tugas Baru</h3>
      <input style={styles.input} placeholder="Nama Tugas" onChange={e => setTugas({...tugas, title: e.target.value})} />
      <textarea style={{...styles.input, height: '80px'}} placeholder="Instruksi Tugas..." onChange={e => setTugas({...tugas, desc: e.target.value})} />
      <div style={{marginBottom: '10px'}}>
        <label style={{fontSize: '12px', color: '#666'}}><Clock size={12}/> Batas Waktu:</label>
        <input type="datetime-local" style={styles.input} onChange={e => setTugas({...tugas, deadline: e.target.value})} />
      </div>
      <button onClick={handleCreate} style={{...styles.btn, background: '#1e293b'}}>Kirim Tugas</button>
    </div>
  );
};

export default ManageTugas; // Styles sama dengan ManageMateri