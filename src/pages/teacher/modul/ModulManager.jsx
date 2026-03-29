import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, deleteDoc, query, orderBy 
} from "firebase/firestore";
import { 
  BookOpen, Plus, Search, FileText, HelpCircle, 
  Layers, Trash2, Edit3, Eye, Clock, User, 
  AlertCircle, Users, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModulManager = () => {
  const [moduls, setModuls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("Semua");
  const navigate = useNavigate();

  const COLLECTION_NAME = "bimbel_modul";

  useEffect(() => {
    fetchModuls();
  }, []);

  const fetchModuls = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setModuls(data);
    } catch (error) {
      try {
        const fallbackSnap = await getDocs(collection(db, COLLECTION_NAME));
        const fallbackData = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setModuls(fallbackData);
      } catch (err) {
        console.error("Final Fetch Error:", err);
      }
    }
    setLoading(false);
  };

  const handleDeleteModul = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("⚠️ PERINGATAN: Modul akan dihapus permanen dari database. Lanjutkan?")) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        setModuls(moduls.filter(m => m.id !== id));
      } catch (e) {
        alert("Gagal menghapus: " + e.message);
      }
    }
  };

  const filteredModuls = moduls.filter(m => {
    const title = m.title || "";
    const subject = m.subject || "";
    const matchSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === "Semua" || m.subject === filterSubject;
    return matchSearch && matchSubject;
  });

  const subjects = ["Semua", ...new Set(moduls.map(m => m.subject).filter(Boolean))];

  return (
    <div style={st.container}>
      {/* --- HEADER SECTION --- */}
      <div style={st.header}>
        <div style={st.titleGroup}>
          <div style={st.iconCircle}><BookOpen size={24} color="white"/></div>
          <div>
            <h2 style={st.titleText}>E-Learning Console</h2>
            <p style={st.subtitleText}>Pusat Kendali Materi & Kuis Siswa</p>
          </div>
        </div>
        
        <div style={st.headerActions}>
           <div style={st.searchWrapper}>
              <Search size={16} color="#94a3b8" />
              <input 
                placeholder="Cari materi..." 
                style={st.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div style={st.filterWrapper}>
             <Filter size={14} color="#64748b"/>
             <select 
               style={st.filterSelect} 
               value={filterSubject} 
               onChange={(e) => setFilterSubject(e.target.value)}
             >
               {subjects.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>

           <button onClick={() => navigate('/guru/modul/materi')} style={st.btnAdd}>
             <Plus size={18}/> <span className="hide-on-mobile">Buat Modul</span>
           </button>
        </div>
      </div>

      {/* --- STATS OVERVIEW --- */}
      <div style={st.statsRow}>
        <div style={st.statCard}>
          <div style={{...st.statIcon, background:'#f5f3ff'}}><Layers size={20} color="#673ab7"/></div>
          <div>
            <span style={st.statLabel}>MODUL AKTIF</span>
            <span style={st.statValue}>{moduls.length}</span>
          </div>
        </div>
        <div style={st.statCard}>
          <div style={{...st.statIcon, background:'#ecfdf5'}}><Users size={20} color="#10b981"/></div>
          <div>
            <span style={st.statLabel}>TARGET</span>
            <span style={st.statValue}>Semua Tingkat</span>
          </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      {loading ? (
        <div style={st.loadingArea}>
          <div className="spinner-global"></div>
          <p>Sinkronisasi Database...</p>
        </div>
      ) : (
        <div style={st.grid}>
          {filteredModuls.map((modul) => (
            <div key={modul.id} style={st.card} className="teacher-card-hover">
              <div style={st.cardCover}>
                <img 
                  src={modul.coverImage || "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=500"} 
                  style={st.coverImg} 
                  alt="Cover"
                />
                <div style={st.coverOverlay}>
                  <span style={st.badge}>{modul.subject || 'UMUM'}</span>
                  <button onClick={(e) => handleDeleteModul(e, modul.id)} style={st.btnDel}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              <div style={st.cardBody}>
                <h3 style={st.cardTitle}>{modul.title || "Untitled Module"}</h3>
                
                <div style={st.tagRow}>
                   <span style={st.tag}><Users size={10}/> {modul.targetKategori || "Semua"}</span>
                   <span style={st.tag}><Layers size={10}/> Kelas {modul.targetKelas || "Semua"}</span>
                </div>

                <div style={st.cardMeta}>
                  <div style={st.metaItem}><FileText size={13}/> {modul.blocks?.length || 0} Materi</div>
                  <div style={st.metaItem}><HelpCircle size={13}/> {modul.quizData?.length || 0} Soal</div>
                </div>

                <div style={st.cardActions}>
                  <button 
                    onClick={() => navigate(`/guru/modul/materi?edit=${modul.id}`)} 
                    style={st.btnEdit}
                  >
                    <Edit3 size={14}/> Kelola
                  </button>
                  <button 
                    onClick={() => window.open(`/siswa/materi/${modul.id}`, '_blank')} 
                    style={st.btnPreview}
                  >
                    <Eye size={14}/> Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- EMPTY STATE --- */}
      {!loading && filteredModuls.length === 0 && (
        <div style={st.emptyState}>
           <AlertCircle size={48} color="#cbd5e1"/>
           <h3>Tidak Ada Modul</h3>
           <p>Coba ubah kata kunci atau buat modul baru.</p>
           <button onClick={() => navigate('/guru/modul/materi')} style={st.btnAddEmpty}>Mulai Buat Modul</button>
        </div>
      )}
    </div>
  );
};

const st = {
  container: { padding: '20px', width: '100%', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  iconCircle: { background: '#673ab7', padding: '10px', borderRadius: '14px' },
  titleText: { margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: '900', color: '#0f172a' },
  subtitleText: { margin: 0, color: '#64748b', fontSize: '13px' },
  
  headerActions: { display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: '1 1 250px' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
  filterWrapper: { display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '0 12px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: '0 1 180px' },
  filterSelect: { border: 'none', background: 'none', padding: '10px 0', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer', outline: 'none', width: '100%' },
  btnAdd: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
  
  statsRow: { display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' },
  statCard: { background: 'white', padding: '15px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #f1f5f9', flex: '1 1 200px' },
  statIcon: { padding: '10px', borderRadius: '12px' },
  statLabel: { display: 'block', fontSize: '10px', fontWeight: '800', color: '#94a3b8' },
  statValue: { display: 'block', fontSize: '20px', fontWeight: '900', color: '#1e293b' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%' },
  card: { background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' },
  cardCover: { height: '150px', position: 'relative' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(rgba(0,0,0,0.2), transparent)', padding: '12px', display: 'flex', justifyContent: 'space-between' },
  badge: { background: '#673ab7', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '800' },
  btnDel: { background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' },
  cardBody: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '17px', color: '#0f172a', fontWeight: '800', lineHeight: 1.3 },
  tagRow: { display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' },
  tag: { fontSize: '10px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 4 },
  cardMeta: { display: 'flex', gap: '12px', marginBottom: '15px', borderBottom: '1px solid #f8fafc', paddingBottom: '12px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b', fontWeight: '600' },
  cardActions: { display: 'flex', gap: '8px', marginTop: 'auto' },
  btnEdit: { flex: 1, background: '#f1f5f9', color: '#1e293b', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
  btnPreview: { flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
  
  loadingArea: { textAlign: 'center', padding: '60px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  emptyState: { textAlign: 'center', padding: '50px', color: '#94a3b8', background: 'white', borderRadius: '25px', border: '2px dashed #e2e8f0', width: '100%', boxSizing: 'border-box' },
  btnAddEmpty: { marginTop: '15px', background: '#673ab7', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold' }
};

export default ModulManager;