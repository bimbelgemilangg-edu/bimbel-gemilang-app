import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy } from 'lucide-react';

const ManageQuiz = () => {
  const [quiz, setQuiz] = useState({ title: '', link: '', duration: '30 Menit' });

  const handleQuiz = async () => {
    await addDoc(collection(db, "bimbel_modul"), { ...quiz, type: 'kuis', createdAt: serverTimestamp() });
    alert("🏆 Kuis diaktifkan!");
  };

  return (
    <div style={styles.card}>
      <h3><Trophy size={20}/> Setup Kuis</h3>
      <input style={styles.input} placeholder="Judul Kuis" onChange={e => setQuiz({...quiz, title: e.target.value})} />
      <input style={styles.input} placeholder="Link Kuis (Jika ada)" onChange={e => setQuiz({...quiz, link: e.target.value})} />
      <button onClick={handleQuiz} style={{...styles.btn, background: '#f59e0b'}}>Aktifkan Kuis</button>
    </div>
  );
};

export default ManageQuiz;