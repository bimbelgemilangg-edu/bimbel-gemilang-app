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

  // ✅ Styles yang butuh isMobile ditaruh di dalam komponen
  const wrapperStyle = {
    padding: isMobile ? '15px' : '30px',
    marginLeft: isMobile ? 0 : '260px',
    transition: 'margin-left 0.3s ease',
    maxWidth: 1400,
    margin: '0 auto'
  };

  return (
    <div style={wrapperStyle}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexDirection: isMobile ? 'column' : 'row',
        gap: 10
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={22} /> E-Learning Console
          </h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Pusat Kendali Materi & Kuis</p>
        </div>
        <button onClick={() => navigate('/guru/modul/materi')} style={{
          background: '#6366f1', color: 'white', border: 'none',
          padding: isMobile ? '10px 15px' : '12px 22px', borderRadius: 12, cursor: 'pointer',
          fontWeight: 700, fontSize: isMobile ? 12 : 14, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
        }}>
          <Plus size={16} /> {!isMobile && 'Buat Modul'}
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: isMobile ? 6 : 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={s.statCard}><Layers size={18} color="#10b981"/><span>{moduls.filter(m => m.status === 'aktif' || !m.status).length} Aktif</span></div>
        <div style={s.statCard}><Calendar size={18} color="#f59e0b"/><span>{moduls.filter(m => m.status === 'terjadwal').length} Terjadwal</span></div>
        <div style={s.statCard}><Target size={18} color="#64748b"/><span>{moduls.filter(m => m.status === 'arsip').length} Arsip</span></div>
      </div>

      {/* FILTER */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={s.searchBox}><Search size={16} color="#94a3b8" /><input placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={s.searchInput} /></div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={s.select}>
          {subjects.map(s => <option key={s} value={s}>{s === 'Semua' ? '📚 Mapel' : s}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['Semua','aktif','terjadwal','arsip'].map(st => (
            <button key={st} onClick={() => setFilterStatus(st)} style={{
              padding: '6px 10px', borderRadius: 8,
              border: filterStatus === st ? '2px solid #6366f1' : '1px solid #e2e8f0',
              background: filterStatus === st ? '#eef2ff' : 'white',
              cursor: 'pointer', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap'
            }}>
              {st === 'Semua' ? '📋' : st === 'aktif' ? '🟢' : st === 'terjadwal' ? '🟡' : '📦'} {st === 'Semua' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div style={s.spinner}></div><p>Memuat...</p></div> :
       filteredModuls.length === 0 ? <div style={s.empty}><AlertCircle size={48} color="#cbd5e1" /><p>Belum ada modul.</p></div> :
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filteredModuls.map(modul => {
          const sb = getStatusBadge(modul.status);
          return (
            <div key={modul.id} style={s.card}>
              <div style={{ height: 120, position: 'relative' }}>
                <img src={modul.coverImage || "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=500"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={s.badge}>{modul.subject || 'UMUM'}</span>
                  <button onClick={(e) => handleDeleteModul(e, modul.id)} style={s.btnDel}>🗑️</button>
                </div>
              </div>
              <div style={{ padding: 14 }}>
                <span style={{...s.statusBadge, background: sb.bg, color: sb.color}}>{sb.label}</span>
                <h3 style={{ margin: '6px 0', fontSize: 15, color: '#1e293b', fontWeight: 700 }}>{modul.title || "Untitled"}</h3>
                <div style={s.meta}>
                  <FileText size={12} /> {(modul.blocks || []).length} <HelpCircle size={12} /> {modul.quizData?.length || 0} <Users size={12} /> {modul.targetKelas || 'Semua'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => navigate(`/guru/modul/materi?edit=${modul.id}`)} style={s.btnEdit}><Edit3 size={14} /> Kelola</button>
                  <button onClick={() => window.open(`/siswa/materi/${modul.id}`, '_blank')} style={s.btnPreview}><Eye size={14} /> Preview</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
};

// ✅ Styles yang TIDAK butuh isMobile tetap di luar
const s = {
  statCard: { flex: 1, minWidth: 100, background: 'white', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', flex: 2, minWidth: 160 },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 13 },
  select: { padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, background: 'white' },
  card: { background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden' },
  badge: { background: '#6366f1', color: 'white', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800 },
  btnDel: { background: '#ef4444', color: 'white', border: 'none', padding: '4px', borderRadius: 6, cursor: 'pointer', fontSize: 11 },
  statusBadge: { display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, marginBottom: 6 },
  meta: { display: 'flex', gap: 10, fontSize: 11, color: '#94a3b8', alignItems: 'center', marginBottom: 12 },
  btnEdit: { flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  btnPreview: { flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  spinner: { width: 32, height: 32, border: '3px solid #f3e8ff', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' },
  empty: { textAlign: 'center', padding: 60, color: '#94a3b8', background: 'white', borderRadius: 16, border: '2px dashed #e2e8f0' },
};

export default ModulManager;