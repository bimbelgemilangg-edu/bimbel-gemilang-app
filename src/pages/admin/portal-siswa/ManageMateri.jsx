import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { BookOpen, Link, Send } from 'lucide-react';

const ManageMateri = () => {
  const [data, setData] = useState({ title: '', link: '', subject: 'Umum' });

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "bimbel_modul"), {
        ...data,
        type: 'materi',
        createdAt: serverTimestamp(),
        author: localStorage.getItem('teacherName') || 'Guru Gemilang'
      });
      alert("✅ Materi Berhasil Terbit!");
      setData({ title: '', link: '', subject: 'Umum' });
    } catch (err) { alert("Error: " + err.message); }
  };

  return (
    <div style={styles.card}>
      <h3><BookOpen size={20}/> Upload Materi Baru</h3>
      <form onSubmit={handleUpload}>
        <input style={styles.input} placeholder="Judul Materi" value={data.title} onChange={e => setData({...data, title: e.target.value})} required />
        <input style={styles.input} placeholder="Link Google Drive/Video" value={data.link} onChange={e => setData({...data, link: e.target.value})} required />
        <button type="submit" style={styles.btn}><Send size={18}/> Terbitkan</button>
      </form>
    </div>
  );
};

const styles = {
  card: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' },
  btn: { width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }
};

export default ManageMateri;