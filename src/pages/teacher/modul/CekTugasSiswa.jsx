import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CheckCircle, User } from 'lucide-react';

const CekTugasSiswa = () => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      // Mengambil data dari koleksi 'jawaban_siswa'
      const q = query(collection(db, "jawaban_siswa"));
      const snap = await getDocs(q);
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchSubmissions();
  }, []);

  return (
    <div style={styles.card}>
      <h3><CheckCircle size={20}/> Berkas Masuk</h3>
      {submissions.length === 0 ? <p>Belum ada siswa mengumpulkan.</p> : 
        submissions.map(s => (
          <div key={s.id} style={styles.list}>
            <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
              <User size={16}/> <strong>{s.studentName}</strong> 
            </div>
            <p style={{fontSize: '13px', margin: '5px 0'}}>{s.taskTitle}</p>
            <a href={s.fileLink} target="_blank" style={{color: '#3b82f6', fontSize: '12px'}}>Buka Jawaban →</a>
          </div>
        ))
      }
    </div>
  );
};

const styles = {
  // Gunakan styles yang sama agar konsisten
  card: { background: 'white', padding: '20px', borderRadius: '15px' },
  list: { padding: '15px', borderBottom: '1px solid #eee' },
  btn: { width: '100%', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'white', border: 'none' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }
};

export default CekTugasSiswa;