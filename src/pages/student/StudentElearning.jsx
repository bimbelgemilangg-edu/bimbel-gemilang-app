import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { Book, Play, FileCheck, ArrowLeft, Clock, User } from 'lucide-react';
import StudentModuleView from './StudentModuleView'; // Import Viewer Riil

const StudentElearning = () => {
  const [moduls, setModuls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModuls();
  }, []);

  const fetchModuls = async () => {
    try {
      const q = query(collection(db, "bimbel_modul"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setModuls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // LOGIKA TRANSISI KE VIEW RIIL
  if (selected) {
    return (
      <StudentModuleView 
        modulId={selected.id} 
        onBack={() => setSelected(null)} 
        studentData={{
          id: localStorage.getItem('studentId'),
          nama: localStorage.getItem('studentName') || "Siswa"
        }}
      />
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ marginBottom: '20px' }}>📚 Modul Belajar Kamu</h2>
      {loading ? <p>Memuat materi...</p> : (
        <div style={st.grid}>
          {moduls.map(m => (
            <div key={m.id} onClick={() => setSelected(m)} style={st.card}>
              <div style={st.iconCircle}><Book color="#673ab7"/></div>
              <h3 style={st.cardTitle}>{m.title}</h3>
              <p style={st.cardAuthor}>Guru: {m.authorName || m.author || 'Guru Gemilang'}</p>
              <div style={st.cardFoot}>Buka Materi ↗</div>
            </div>
          ))}
          {moduls.length === 0 && <p style={{color: '#94a3b8'}}>Belum ada modul tersedia.</p>}
        </div>
      )}
    </div>
  );
};

const st = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer', transition: '0.3s' },
  iconCircle: { width: '50px', height: '50px', borderRadius: '15px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' },
  cardTitle: { margin: '0 0 5px 0', fontSize: '18px' },
  cardAuthor: { color: '#94a3b8', fontSize: '13px', margin: 0 },
  cardFoot: { marginTop: '20px', color: '#673ab7', fontWeight: 'bold', fontSize: '13px' },
  // Style lama tetap ada di sini jika dibutuhkan untuk render internal
  backBtn: { border: 'none', background: 'white', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: 25 },
  viewerHeader: { marginBottom: 40 },
  viewTitle: { fontSize: '32px', color: '#1e293b', marginBottom: 10 },
  viewMeta: { display: 'flex', gap: 20, color: '#64748b', fontSize: '13px', marginBottom: 15 },
  viewDesc: { color: '#475569', lineHeight: 1.6 },
  blockView: { background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  blockTitle: { margin: '0 0 15px 0', color: '#334155', fontSize: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: 10 },
  textContent: { lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap' },
  mediaContent: { display: 'flex', alignItems: 'center', gap: 15, background: '#f8fafc', padding: 20, borderRadius: 12 },
  mediaIcon: { width: 45, height: 45, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mediaLink: { color: '#3b82f6', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' },
  taskBox: { display: 'flex', gap: 15, background: '#ecfdf5', padding: 20, borderRadius: 12, border: '1px solid #a7f3d0' },
  upBtn: { marginTop: 15, padding: '8px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default StudentElearning;