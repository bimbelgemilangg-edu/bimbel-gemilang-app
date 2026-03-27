import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Book, Lock, Unlock, ExternalLink, Clock } from 'lucide-react';

const StudentElearning = () => {
  const [modul, setModul] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModul = async () => {
      try {
        const q = query(collection(db, "bimbel_modul"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setModul(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchModul();
  }, []);

  const checkStatus = (releaseTimestamp) => {
    const now = new Date().getTime();
    return now >= releaseTimestamp;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>📚 Timeline Belajar Kamu</h2>
      {loading ? <p>Memuat materi...</p> : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {modul.map((m) => {
            const isAvailable = checkStatus(m.releaseTimestamp) && m.isOpen;
            return (
              <div key={m.id} style={{ 
                background: 'white', padding: '15px', borderRadius: '12px', 
                border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between',
                opacity: isAvailable ? 1 : 0.6
              }}>
                <div>
                  <h4 style={{ margin: 0 }}>{m.title}</h4>
                  <small style={{ color: '#64748b' }}>{m.type.toUpperCase()} • {m.author}</small>
                </div>
                {isAvailable ? (
                  <button onClick={() => window.open(m.link, '_blank')} 
                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>
                    <Unlock size={16} /> Buka
                  </button>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Lock size={14} /> Terkunci
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentElearning; // HARUS ADA BARIS INI AGAR VERCEL TIDAK ERROR