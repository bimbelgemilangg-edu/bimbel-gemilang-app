import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import ManageMateri from './ManageMateri'; 
import { Plus, Book, Trash2, Calendar, Users, Edit3 } from 'lucide-react';

const ModulManager = () => {
  const [view, setView] = useState('list'); 
  const [moduls, setModuls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (view === 'list') fetchModuls();
  }, [view]);

  const fetchModuls = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "bimbel_modul"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setModuls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Gagal ambil data:", e);
    }
    setLoading(false);
  };

  if (view === 'editor') return <ManageMateri onBack={() => setView('list')} />;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>E-Learning Builder</h2>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>Susun materi pembelajaran modular untuk siswa.</p>
        </div>
        <button onClick={() => setView('editor')} style={styles.addBtn}>
          <Plus size={20} /> Buat Modul Baru
        </button>
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div style={styles.grid}>
          {moduls.map((m) => (
            <div key={m.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <Book size={20} color="#673ab7"/>
                <span style={styles.badge}>{m.settings?.target || 'Umum'}</span>
              </div>
              <h3 style={styles.cardTitle}>{m.title}</h3>
              <p style={styles.cardDesc}>{m.description?.substring(0, 60)}...</p>
              
              <div style={styles.cardFooter}>
                <div style={styles.cardMeta}>
                  <Calendar size={14}/> {m.settings?.releaseDate || 'Tanpa Tgl'}
                </div>
                <button 
                  onClick={async () => {
                    if(window.confirm('Hapus modul ini selamanya?')) {
                      await deleteDoc(doc(db, "bimbel_modul", m.id));
                      fetchModuls();
                    }
                  }} 
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  addBtn: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(103, 58, 183, 0.2)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #edf2f7', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  badge: { background: '#f3e8ff', color: '#6b21a8', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  cardTitle: { margin: '0 0 8px 0', fontSize: '18px', color: '#1a202c' },
  cardDesc: { color: '#718096', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f7fafc', paddingTop: '15px' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '5px', color: '#a0aec0', fontSize: '12px' },
  deleteBtn: { background: 'none', border: 'none', color: '#feb2b2', cursor: 'pointer', transition: '0.2s', '&:hover': { color: '#f56565' } }
};

export default ModulManager;