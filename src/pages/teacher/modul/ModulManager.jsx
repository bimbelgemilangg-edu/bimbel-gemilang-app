import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { BookOpen, Plus, Search, FileText, HelpCircle, Layers, Trash2, Edit3, Eye, AlertCircle, Users, Calendar, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModulManager = () => {
  const [moduls, setModuls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  const COLLECTION_NAME = "bimbel_modul";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchModuls(); }, []);

  const fetchModuls = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
      const data = (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
      setModuls(data);
    } catch {
      const data = (await getDocs(collection(db, COLLECTION_NAME))).docs.map(d => ({ id: d.id, ...d.data() }));
      setModuls(data);
    }
    setLoading(false);
  };

  const handleDeleteModul = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("⚠️ Hapus modul ini permanen?")) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      setModuls(moduls.filter(m => m.id !== id));
    }
  };

  const getStatusBadge = (status) => {
    const b = {
      'aktif': { label: '🟢 Aktif', color: '#10b981', bg: '#dcfce7' },
      'terjadwal': { label: '🟡 Terjadwal', color: '#f59e0b', bg: '#fef3c7' },
      'arsip': { label: '📦 Arsip', color: '#64748b', bg: '#f1f5f9' }
    };
    return b[status] || b['aktif'];
  };

  const filteredModuls = moduls.filter(m => {
    const t = (m.title || "").toLowerCase();
    const s = (m.subject || "").toLowerCase();
    return t.includes(searchTerm.toLowerCase()) || s.includes(searchTerm.toLowerCase());
  }).filter(m => filterSubject === "Semua" || m.subject === filterSubject)
    .filter(m => filterStatus === "Semua" || m.status === filterStatus || (!m.status && filterStatus === "aktif"));

  const subjects = ["Semua", ...new Set(moduls.map(m => m.subject).filter(Boolean))];

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <div style={styles.header(isMobile)}>
        <div>
          <h2 style={styles.title(isMobile)}><BookOpen size={22} /> E-Learning Console</h2>
          <p style={styles.subtitle}>Pusat Kendali Materi & Kuis</p>
        </div>
        <button onClick={() => navigate('/guru/modul/materi')} style={styles.btnAdd(isMobile)}>
          <Plus size={16} /> {!isMobile && 'Buat Modul'}
        </button>
      </div>

      {/* STATS */}
      <div style={styles.statsRow(isMobile)}>
        <div style={styles.statCard}><Layers size={18} color="#10b981"/><span>{moduls.filter(m => m.status === 'aktif' || !m.status).length} Aktif</span></div>
        <div style={styles.statCard}><Calendar size={18} color="#f59e0b"/><span>{moduls.filter(m => m.status === 'terjadwal').length} Terjadwal</span></div>
        <div style={styles.statCard}><Target size={18} color="#64748b"/><span>{moduls.filter(m => m.status === 'arsip').length} Arsip</span></div>
      </div>

      {/* FILTER */}
      <div style={styles.filterBar(isMobile)}>
        <div style={styles.searchBox}><Search size={16} color="#94a3b8" /><input placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} /></div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={styles.select}>
          {subjects.map(s => <option key={s} value={s}>{s === 'Semua' ? '📚 Mapel' : s}</option>)}
        </select>
        <div style={styles.statusBtns}>
          {['Semua','aktif','terjadwal','arsip'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={styles.statusBtn(filterStatus === s)}>
              {s === 'Semua' ? '📋' : s === 'aktif' ? '🟢' : s === 'terjadwal' ? '🟡' : '📦'} {s === 'Semua' ? 'Semua' : s}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      {loading ? <div style={styles.loading}><div style={styles.spinner}></div><p>Memuat...</p></div> :
       filteredModuls.length === 0 ? <div style={styles.empty}><AlertCircle size={48} color="#cbd5e1" /><p>Belum ada modul.</p></div> :
       <div style={styles.grid}>
        {filteredModuls.map(modul => {
          const sb = getStatusBadge(modul.status);
          return (
            <div key={modul.id} style={styles.card}>
              <div style={styles.cardCover}>
                <img src={modul.coverImage || "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=500"} style={styles.coverImg} alt="" />
                <div style={styles.coverOverlay}>
                  <span style={styles.badge}>{modul.subject || 'UMUM'}</span>
                  <button onClick={(e) => handleDeleteModul(e, modul.id)} style={styles.btnDel}>🗑️</button>
                </div>
              </div>
              <div style={styles.cardBody}>
                <span style={{...styles.statusBadge, background: sb.bg, color: sb.color}}>{sb.label}</span>
                <h3 style={styles.cardTitle}>{modul.title || "Untitled"}</h3>
                <div style={styles.meta}>
                  <FileText size={12} /> {(modul.blocks || []).length} <HelpCircle size={12} /> {modul.quizData?.length || 0} <Users size={12} /> {modul.targetKelas || 'Semua'}
                </div>
                <div style={styles.actions}>
                  <button onClick={() => navigate(`/guru/modul/materi?edit=${modul.id}`)} style={styles.btnEdit}><Edit3 size={14} /> Kelola</button>
                  <button onClick={() => window.open(`/siswa/materi/${modul.id}`, '_blank')} style={styles.btnPreview}><Eye size={14} /> Preview</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
};

const styles = {
  wrapper: { padding: 0 },
  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: 10 }),
  title: (m) => ({ margin: 0, fontSize: m ? 18 : 22, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }),
  subtitle: { color: '#64748b', fontSize: 13 },
  btnAdd: (m) => ({ background: '#6366f1', color: 'white', border: 'none', padding: m ? '10px 15px' : '12px 22px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: m ? 12 : 14, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }),
  statsRow: (m) => ({ display: 'flex', gap: m ? 6 : 12, marginBottom: 20, flexWrap: 'wrap' }),
  statCard: { flex: 1, minWidth: 100, background: 'white', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700 },
  filterBar: (m) => ({ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }),
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', flex: 2, minWidth: 160 },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 13 },
  select: { padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, background: 'white' },
  statusBtns: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  statusBtn: (active) => ({ padding: '6px 10px', borderRadius: 8, border: active ? '2px solid #6366f1' : '1px solid #e2e8f0', background: active ? '#eef2ff' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden' },
  cardCover: { height: 120, position: 'relative' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, padding: 8, display: 'flex', justifyContent: 'space-between' },
  badge: { background: '#6366f1', color: 'white', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800 },
  btnDel: { background: '#ef4444', color: 'white', border: 'none', padding: '4px', borderRadius: 6, cursor: 'pointer', fontSize: 11 },
  cardBody: { padding: 14 },
  statusBadge: { display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, marginBottom: 6 },
  cardTitle: { margin: '6px 0', fontSize: 15, color: '#1e293b', fontWeight: 700 },
  meta: { display: 'flex', gap: 10, fontSize: 11, color: '#94a3b8', alignItems: 'center', marginBottom: 12 },
  actions: { display: 'flex', gap: 6 },
  btnEdit: { flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  btnPreview: { flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  loading: { textAlign: 'center', padding: 40 },
  spinner: { width: 32, height: 32, border: '3px solid #f3e8ff', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' },
  empty: { textAlign: 'center', padding: 60, color: '#94a3b8', background: 'white', borderRadius: 16, border: '2px dashed #e2e8f0' },
};

export default ModulManager;