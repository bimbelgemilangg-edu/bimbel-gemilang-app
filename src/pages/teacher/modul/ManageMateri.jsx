import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, Plus, Eye, EyeOff, Layout } from 'lucide-react';

const ManageMateri = () => {
  const [data, setData] = useState({
    title: '',
    link: '',
    sessionName: 'Pertemuan 1', // Label Pertemuan
    releaseDate: '',            // Tanggal otomatis buka
    isOpen: true,               // Status Manual (Buka/Tutup)
    category: 'Materi'          // Materi / Quiz / Tugas
  });

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "bimbel_modul"), {
        ...data,
        type: 'materi',
        createdAt: serverTimestamp(),
        // Taktik Hacker: Menyimpan timestamp untuk filter otomatis di sisi siswa
        releaseTimestamp: new Date(data.releaseDate).getTime() 
      });
      alert(`✅ ${data.sessionName} Berhasil Disimpan di Kalender Belajar!`);
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3><Layout size={20}/> Perencana Pembelajaran Bulanan</h3>
        <p>Atur semua materi pertemuan di awal bulan.</p>
      </div>

      <form onSubmit={handleSavePlan} style={styles.card}>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label>Label Pertemuan</label>
            <input style={styles.input} placeholder="Contoh: Pertemuan 1 - Aljabar" 
              onChange={e => setData({...data, title: e.target.value})} required />
          </div>

          <div style={styles.inputGroup}>
            <label>Tanggal Rilis Otomatis</label>
            <input type="date" style={styles.input} 
              onChange={e => setData({...data, releaseDate: e.target.value})} required />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label>Link Materi (GDrive/YouTube)</label>
          <input style={styles.input} placeholder="https://..." 
            onChange={e => setData({...data, link: e.target.value})} required />
        </div>

        <div style={styles.statusBox}>
          <label>Status Awal:</label>
          <button type="button" 
            onClick={() => setData({...data, isOpen: !data.isOpen})}
            style={{...styles.toggleBtn, background: data.isOpen ? '#10b981' : '#ef4444'}}>
            {data.isOpen ? <Eye size={16}/> : <EyeOff size={16}/>}
            {data.isOpen ? 'Langsung Terbuka' : 'Terkunci (Manual)'}
          </button>
        </div>

        <button type="submit" style={styles.btnMain}>
          <Plus size={18}/> Tambahkan ke Jadwal E-Learning
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { padding: '10px' },
  card: { background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  grid: { display: 'flex', gap: '15px', marginBottom: '15px' },
  inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' },
  statusBox: { margin: '15px 0', display: 'flex', alignItems: 'center', gap: '10px' },
  toggleBtn: { border: 'none', color: 'white', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
  btnMain: { width: '100%', padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }
};

export default ManageMateri;