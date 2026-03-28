import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, deleteDoc, query, orderBy 
} from "firebase/firestore";
import { 
  BookOpen, Plus, Search, FileText, HelpCircle, 
  Layers, Trash2, Edit3, Eye, Clock, User, 
  AlertCircle, Users
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
      // 1. Coba ambil data terurut (Membutuhkan Index di Firebase Console)
      const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setModuls(data);
    } catch (error) {
      console.error("Sorting Error / Index missing:", error);
      // 2. Fallback: Ambil data tanpa sorting jika index belum siap agar tidak BLANK
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
    // Menambahkan proteksi string agar .toLowerCase() tidak error jika field null
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
            <p style={st.subtitleText}>Pusat Kendali Materi & Kuis Siswa Gemilang</p>
          </div>
        </div>
        
        <div style={st.headerActions}>
           <div style={st.searchContainer}>
              <Search size={16} color="#94a3b8" />
              <input 
                placeholder="Cari judul atau mapel..." 
                style={st.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <select 
             style={st.filterSelect} 
             value={filterSubject} 
             onChange={(e) => setFilterSubject(e.target.value)}
           >
             {subjects.map(s => <option key={s} value={s}>{s}</option>)}
           </select>

           <button onClick={() => navigate('/guru/modul/materi')} style={st.btnAdd}>
             <Plus size={18}/> Buat Modul
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
          <div style={{...st.statIcon, background:'#ecfdf5'}}><FileText size={20} color="#10b981"/></div>
          <div>
            <span style={st.statLabel}>TARGET PROGRAM</span>
            <span style={st.statValue}>Multi-Tier</span>
          </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      {loading ? (
        <div style={st.loadingArea}>
          <div style={st.spinner}></div>
          <p>Sinkronisasi Database...</p>
        </div>
      ) : (
        <div style={st.grid}>
          {filteredModuls.map((modul) => (
            <div key={modul.id} style={st.card}>
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
                  {/* PENGGUNAAN OPTIONAL CHAINING (?.) AGAR TIDAK BLANK */}
                  <div style={st.metaItem}>
                    <FileText size={13}/> {modul.blocks?.length || 0} Materi
                  </div>
                  <div style={st.metaItem}>
                    <HelpCircle size={13}/> {modul.quizData?.length || 0} Soal
                  </div>
                  {modul.authorName && (
                    <div style={st.metaItem}>
                      <User size={13}/> {modul.authorName.split(' ')[0]}
                    </div>
                  )}
                </div>

                {(modul.deadlineTugas || modul.deadlineQuiz) && (
                  <div style={st.deadlineIndicator}>
                    <Clock size={12}/> 
                    <span>Tenggat: {new Date(modul.deadlineTugas || modul.deadlineQuiz).toLocaleDateString()}</span>
                  </div>
                )}

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
           <h3>Tidak Ada Modul Ditemukan</h3>
           <p>Coba ubah kata kunci pencarian atau buat modul baru.</p>
           <button onClick={() => navigate('/guru/modul/materi')} style={st.btnAddEmpty}>Mulai Buat Modul</button>
        </div>
      )}
    </div>
  );
};

const st = {
  container: { padding: '40px', background: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: 20 },
  titleGroup: { display: 'flex', alignItems: 'center', gap: 20 },
  iconCircle: { background: '#673ab7', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(103, 58, 183, 0.2)' },
  titleText: { margin: 0, fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' },
  subtitleText: { margin: '2px 0 0', color: '#64748b', fontSize: '14px', fontWeight: '500' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  searchContainer: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '280px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '500' },
  filterSelect: { padding: '10px 15px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer', outline: 'none' },
  btnAdd: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', transition: '0.2s', boxShadow: '0 4px 12px rgba(103, 58, 183, 0.3)' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '40px' },
  statCard: { background: 'white', padding: '20px 30px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #f1f5f9', flex: 1, maxWidth: '300px' },
  statIcon: { padding: '12px', borderRadius: '14px' },
  statLabel: { display: 'block', fontSize: '10px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' },
  statValue: { display: 'block', fontSize: '24px', fontWeight: '900', color: '#1e293b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' },
  card: { background: 'white', borderRadius: '28px', border: '1px solid #f1f5f9', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default', display: 'flex', flexDirection: 'column' },
  cardCover: { height: '160px', position: 'relative', overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(rgba(0,0,0,0.3), transparent)', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { background: '#673ab7', color: 'white', padding: '5px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' },
  btnDel: { background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' },
  cardBody: { padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' },
  cardTitle: { margin: '0 0 12px 0', fontSize: '19px', color: '#0f172a', fontWeight: '800', lineHeight: 1.4 },
  tagRow: { display: 'flex', gap: '8px', marginBottom: '15px' },
  tag: { fontSize: '10px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 5 },
  cardMeta: { display: 'flex', gap: '15px', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #f8fafc' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  deadlineIndicator: { fontSize: '11px', color: '#d97706', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '20px', background: '#fffbeb', padding: '6px 12px', borderRadius: '8px', width: 'fit-content' },
  cardActions: { display: 'flex', gap: '10px', marginTop: 'auto' },
  btnEdit: { flex: 1.2, background: '#f1f5f9', color: '#1e293b', border: 'none', padding: '12px', borderRadius: '14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnPreview: { flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '12px', borderRadius: '14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  loadingArea: { textAlign: 'center', padding: '100px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3e8ff', borderTop: '4px solid #673ab7', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  emptyState: { textAlign: 'center', padding: '80px', color: '#94a3b8', background: 'white', borderRadius: '35px', border: '2px dashed #e2e8f0' },
  btnAddEmpty: { marginTop: '20px', background: '#673ab7', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }
};

// Injection CSS untuk animasi spinner (Hanya dijalankan sekali di client)
if (typeof document !== "undefined") {
  const styleId = "spinner-animation-style";
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement("style");
    styleTag.id = styleId;
    styleTag.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(styleTag);
  }
}

export default ModulManager;