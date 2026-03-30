import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, deleteDoc, query, orderBy 
} from "firebase/firestore";
import { 
  BookOpen, Plus, Search, FileText, HelpCircle, 
  Layers, Trash2, Edit3, Eye, AlertCircle, Users, Filter
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
    <div className="main-content-wrapper">
      <div className="teacher-container-padding">
        {/* --- HEADER SECTION --- */}
        <div style={st.header}>
            <div style={st.titleGroup}>
                <div style={st.iconCircle}><BookOpen size={24} color="white"/></div>
                <div>
                    <h2 style={st.titleText}>E-Learning Console</h2>
                    <p style={st.subtitleText}>Pusat Kendali Materi & Kuis Siswa</p>
                </div>
            </div>
            
            <button onClick={() => navigate('/guru/modul/materi')} style={st.btnAdd}>
                <Plus size={18}/> <span className="hide-on-mobile">Buat Modul Baru</span>
            </button>
        </div>

        {/* --- FILTER & SEARCH BAR --- */}
        <div style={st.toolbar}>
           <div style={st.searchWrapper}>
              <Search size={18} color="#94a3b8" />
              <input 
                placeholder="Cari judul materi atau mata pelajaran..." 
                style={st.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div style={st.filterWrapper}>
             <Filter size={16} color="#64748b"/>
             <select 
               style={st.filterSelect} 
               value={filterSubject} 
               onChange={(e) => setFilterSubject(e.target.value)}
             >
               {subjects.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
        </div>

        {/* --- STATS OVERVIEW --- */}
        <div style={st.statsRow}>
            <div className="teacher-card" style={st.statCardInline}>
                <div style={{...st.statIcon, background:'#eff6ff'}}><Layers size={20} color="#2563eb"/></div>
                <div>
                    <span style={st.statLabel}>MODUL AKTIF</span>
                    <span style={st.statValue}>{moduls.length} Unit</span>
                </div>
            </div>
            <div className="teacher-card" style={st.statCardInline}>
                <div style={{...st.statIcon, background:'#ecfdf5'}}><Users size={20} color="#10b981"/></div>
                <div>
                    <span style={st.statLabel}>AKSES</span>
                    <span style={st.statValue}>Semua Siswa</span>
                </div>
            </div>
        </div>

        {/* --- CONTENT GRID --- */}
        {loading ? (
            <div style={st.loadingArea}>
                <div className="spinner-global"></div>
                <p style={{fontWeight: 'bold', color: '#64748b', marginTop: 10}}>Sinkronisasi Database...</p>
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
            <h3 style={{color: '#1e293b', marginTop: 15}}>Tidak Ada Modul</h3>
            <p>Coba ubah kata kunci atau buat modul baru sekarang.</p>
            <button onClick={() => navigate('/guru/modul/materi')} style={st.btnAddEmpty}>Mulai Buat Modul</button>
            </div>
        )}
      </div>
    </div>
  );
};

const st = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '20px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  iconCircle: { background: '#6366f1', padding: '12px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' },
  titleText: { margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: '900', color: '#0f172a' },
  subtitleText: { margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '500' },
  
  toolbar: { display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 20px', borderRadius: '15px', border: '1px solid #e2e8f0', flex: '1 1 400px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '15px', fontWeight: '500' },
  filterWrapper: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '0 15px', borderRadius: '15px', border: '1px solid #e2e8f0', flex: '0 1 200px' },
  filterSelect: { border: 'none', background: 'none', padding: '12px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b', cursor: 'pointer', outline: 'none', width: '100%' },
  btnAdd: { background: '#6366f1', color: 'white', border: 'none', padding: '14px 25px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)' },
  
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' },
  statCardInline: { padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 250px', border: 'none' },
  statIcon: { padding: '12px', borderRadius: '14px' },
  statLabel: { display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' },
  statValue: { display: 'block', fontSize: '20px', fontWeight: '900', color: '#1e293b' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', width: '100%' },
  card: { background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' },
  cardCover: { height: '160px', position: 'relative' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(rgba(0,0,0,0.3), transparent)', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { background: '#6366f1', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' },
  btnDel: { background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)' },
  cardBody: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' },
  cardTitle: { margin: '0 0 12px 0', fontSize: '18px', color: '#1e293b', fontWeight: '800', lineHeight: 1.4 },
  tagRow: { display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' },
  tag: { fontSize: '11px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '5px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 5 },
  cardMeta: { display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #f8fafc', paddingBottom: '15px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  cardActions: { display: 'flex', gap: '10px', marginTop: 'auto' },
  btnEdit: { flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnPreview: { flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  
  loadingArea: { textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8', background: 'white', borderRadius: '30px', border: '2px dashed #e2e8f0', width: '100%', boxSizing: 'border-box' },
  btnAddEmpty: { marginTop: '20px', background: '#6366f1', color: 'white', border: 'none', padding: '14px 30px', borderRadius: '15px', fontWeight: '800', cursor: 'pointer' }
};

export default ModulManager;