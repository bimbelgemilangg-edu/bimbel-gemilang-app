import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { 
  BookOpen, Plus, Search, FileText, HelpCircle, 
  Layers, Trash2, Edit3, Eye, MoreVertical 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModulManager = () => {
  const [moduls, setModuls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchModuls();
  }, []);

  const fetchModuls = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "moduls"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setModuls(data);
    } catch (error) {
      console.error("Error fetching moduls:", error);
    }
    setLoading(false);
  };

  const handleDeleteModul = async (id) => {
    if (window.confirm("Hapus modul ini beserta isinya?")) {
      try {
        await deleteDoc(doc(db, "moduls", id));
        fetchModuls();
      } catch (e) {
        alert("Gagal menghapus modul");
      }
    }
  };

  const filteredModuls = moduls.filter(m => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* HEADER UTAMA */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}><BookOpen size={28} color="#673ab7"/> E-Learning Management</h2>
          <p style={styles.subtitle}>Kelola materi, tugas, dan kuis interaktif untuk siswa Anda.</p>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                placeholder="Cari modul atau mapel..." 
                style={styles.searchInput}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button onClick={() => navigate('/guru/modul/materi')} style={styles.btnAdd}>
             <Plus size={18}/> Buat Modul Baru
           </button>
        </div>
      </div>

      {/* STATS RINGKAS */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <Layers size={20} color="#673ab7"/>
          <div>
            <span style={styles.statValue}>{moduls.length}</span>
            <span style={styles.statLabel}>Total Modul</span>
          </div>
        </div>
        {/* Tombol Pemeriksaan Tugas Dihilangkan dari sini sesuai instruksi */}
      </div>

      {/* GRID MODUL */}
      {loading ? (
        <div style={styles.loadingArea}>Memuat konten pembelajaran...</div>
      ) : (
        <div style={styles.grid}>
          {filteredModuls.map((modul) => (
            <div key={modul.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.badge}>{modul.subject || 'Umum'}</span>
                <button onClick={() => handleDeleteModul(modul.id)} style={styles.btnDelIcon}>
                  <Trash2 size={16}/>
                </button>
              </div>
              
              <h3 style={styles.cardTitle}>{modul.title}</h3>
              <p style={styles.cardDesc}>{modul.description?.substring(0, 80)}...</p>

              <div style={styles.cardMeta}>
                <div style={styles.metaItem}><FileText size={14}/> {modul.blocks?.length || 0} Materi</div>
                <div style={styles.metaItem}><HelpCircle size={14}/> {modul.quiz?.length || 0} Soal Kuis</div>
              </div>

              <div style={styles.cardActions}>
                <button onClick={() => navigate(`/guru/modul/materi?edit=${modul.id}`)} style={styles.btnEdit}>
                  <Edit3 size={14}/> Edit Konten
                </button>
                <button onClick={() => window.open(`/siswa/materi/${modul.id}`, '_blank')} style={styles.btnView}>
                  <Eye size={14}/> Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredModuls.length === 0 && !loading && (
        <div style={styles.emptyState}>
          <img src="https://illustrations.popsy.co/purple/searching.svg" alt="empty" style={{width: 200}}/>
          <p>Belum ada modul. Mulai buat modul materi pertama Anda!</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px' },
  subtitle: { margin: '5px 0 0 40px', color: '#64748b', fontSize: '14px' },
  headerActions: { display: 'flex', gap: '15px', alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '250px' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
  btnAdd: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(103, 58, 183, 0.25)' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  statCard: { background: 'white', padding: '15px 25px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  statValue: { display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#1e293b' },
  statLabel: { fontSize: '12px', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', transition: '0.3s', display: 'flex', flexDirection: 'column', position: 'relative' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  badge: { background: '#f3e8ff', color: '#673ab7', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  btnDelIcon: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' },
  cardDesc: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', flex: 1, marginBottom: '20px' },
  cardMeta: { display: 'flex', gap: '15px', padding: '15px 0', borderTop: '1px solid #f1f5f9', marginBottom: '15px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' },
  cardActions: { display: 'flex', gap: '10px' },
  btnEdit: { flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
  btnView: { flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
  loadingArea: { textAlign: 'center', padding: '100px', color: '#64748b' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }
};

export default ModulManager;