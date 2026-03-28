import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, deleteDoc, query } from "firebase/firestore";
import { 
  BookOpen, Plus, Search, FileText, HelpCircle, 
  Layers, Trash2, Edit3, Eye, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModulManager = () => {
  const [moduls, setModuls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // KUNCI: Harus sesuai dengan nama koleksi di Firebase Anda (bimbel_modul)
  const COLLECTION_NAME = "bimbel_modul";

  useEffect(() => {
    fetchModuls();
  }, []);

  const fetchModuls = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setModuls(data);
    } catch (error) {
      console.error("Error fetching moduls:", error);
    }
    setLoading(false);
  };

  const handleDeleteModul = async (e, id) => {
    e.stopPropagation(); // Mencegah klik menyebar ke card
    if (window.confirm("Hapus modul ini secara permanen?")) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        fetchModuls();
      } catch (e) {
        alert("Gagal menghapus: " + e.message);
      }
    }
  };

  const filteredModuls = moduls.filter(m => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* SECTION HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}><BookOpen size={28} color="#673ab7"/> E-Learning Management</h2>
          <p style={styles.subtitle}>Kelola materi dan kuis di koleksi <b>"{COLLECTION_NAME}"</b></p>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                placeholder="Cari modul..." 
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button onClick={() => navigate('/guru/modul/materi')} style={styles.btnAdd}>
             <Plus size={18}/> Modul Baru
           </button>
        </div>
      </div>

      {/* STATS */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <Layers size={20} color="#673ab7"/>
          <div>
            <span style={styles.statValue}>{moduls.length}</span>
            <span style={styles.statLabel}>Total Modul Aktif</span>
          </div>
        </div>
      </div>

      {/* GRID DATA */}
      {loading ? (
        <div style={styles.loadingArea}>Memuat data dari database...</div>
      ) : (
        <div style={styles.grid}>
          {filteredModuls.map((modul) => (
            <div key={modul.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.badge}>{modul.subject || 'UMUM'}</span>
                <button onClick={(e) => handleDeleteModul(e, modul.id)} style={styles.btnDelIcon}>
                  <Trash2 size={16}/>
                </button>
              </div>
              
              <h3 style={styles.cardTitle}>{modul.title || "Judul Kosong"}</h3>
              
              <div style={styles.cardMeta}>
                {/* Menampilkan jumlah konten berdasarkan struktur field 'content' di Firebase */}
                <div style={styles.metaItem}>
                  <FileText size={14}/> {modul.blocks ? `${modul.blocks.length} Bagian` : (modul.content ? "1 Materi" : "0 Materi")}
                </div>
                <div style={styles.metaItem}>
                  <HelpCircle size={14}/> {modul.quizData ? `${modul.quizData.length} Soal` : "0 Soal Kuis"}
                </div>
                {/* UPDATE: Indikator Deadline jika ada */}
                {(modul.deadlineTugas || modul.deadlineQuiz) && (
                  <div style={{...styles.metaItem, color: '#f59e0b', fontWeight: 'bold'}}>
                    <Clock size={14}/> Ada Tenggat
                  </div>
                )}
              </div>

              <div style={styles.cardActions}>
                {/* Navigasi ke halaman edit dengan ID modul */}
                <button 
                  onClick={() => navigate(`/guru/modul/materi?edit=${modul.id}`)} 
                  style={styles.btnEdit}
                >
                  <Edit3 size={14}/> Edit Konten
                </button>
                {/* Link Preview ke halaman siswa */}
                <button 
                  onClick={() => window.open(`/siswa/materi/${modul.id}`, '_blank')} 
                  style={styles.btnView}
                >
                  <Eye size={14}/> Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAMPILAN JIKA KOSONG */}
      {!loading && filteredModuls.length === 0 && (
        <div style={styles.emptyState}>
           <p>Belum ada modul. Mulai buat modul materi pertama Anda!</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 'bold' },
  subtitle: { margin: '5px 0 0 40px', color: '#64748b', fontSize: '14px' },
  headerActions: { display: 'flex', gap: '15px', alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '250px' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
  btnAdd: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  statCard: { background: 'white', padding: '15px 25px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e2e8f0' },
  statValue: { display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#1e293b' },
  statLabel: { fontSize: '12px', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  badge: { background: '#f3e8ff', color: '#673ab7', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  btnDelIcon: { background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' },
  cardTitle: { margin: '0 0 15px 0', fontSize: '18px', color: '#1e293b', fontWeight: 'bold' },
  cardMeta: { display: 'flex', gap: '15px', padding: '15px 0', borderTop: '1px solid #f1f5f9', marginBottom: '15px', flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' },
  cardActions: { display: 'flex', gap: '10px' },
  btnEdit: { flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
  btnView: { flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
  loadingArea: { textAlign: 'center', padding: '100px', color: '#64748b' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#94a3b8' }
};

export default ModulManager;