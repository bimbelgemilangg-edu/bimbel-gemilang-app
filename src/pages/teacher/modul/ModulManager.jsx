import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { BookOpen, Plus, Search, FileText, HelpCircle, Trash2, Edit3, Eye, AlertCircle, Users, Calendar, Target, Layers } from 'lucide-react';
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
      'aktif': { label: 'Aktif', color: '#10b981', bg: '#dcfce7' },
      'terjadwal': { label: 'Terjadwal', color: '#f59e0b', bg: '#fef3c7' },
      'arsip': { label: 'Arsip', color: '#64748b', bg: '#f1f5f9' }
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

  const totalAktif = moduls.filter(m => m.status === 'aktif' || !m.status).length;
  const totalTerjadwal = moduls.filter(m => m.status === 'terjadwal').length;
  const totalArsip = moduls.filter(m => m.status === 'arsip').length;

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#6366f1', padding: 10, borderRadius: 14 }}><BookOpen size={22} color="white"/></div>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b' }}>E-Learning Console</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Pusat Kendali Materi & Kuis</p>
          </div>
        </div>
        <button onClick={() => navigate('/guru/modul/materi')} style={{
          background: '#6366f1', color: 'white', border: 'none', padding: isMobile ? '10px 15px' : '12px 22px', borderRadius: 10,
          cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 12 : 14, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
        }}>
          <Plus size={16} /> Buat Modul
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: isMobile ? 6 : 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 90, background: 'white', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9' }}>
          <Layers size={16} color="#10b981"/><span style={{ fontSize: 12, fontWeight: 700 }}>{totalAktif} <span style={{fontWeight:400, color:'#64748b'}}>Aktif</span></span>
        </div>
        <div style={{ flex: 1, minWidth: 90, background: 'white', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9' }}>
          <Calendar size={16} color="#f59e0b"/><span style={{ fontSize: 12, fontWeight: 700 }}>{totalTerjadwal} <span style={{fontWeight:400, color:'#64748b'}}>Terjadwal</span></span>
        </div>
        <div style={{ flex: 1, minWidth: 90, background: 'white', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9' }}>
          <Target size={16} color="#64748b"/><span style={{ fontSize: 12, fontWeight: 700 }}>{totalArsip} <span style={{fontWeight:400, color:'#64748b'}}>Arsip</span></span>
        </div>
      </div>

      {/* FILTER */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', flex: 2, minWidth: 160 }}>
          <Search size={14} color="#94a3b8" />
          <input placeholder="Cari judul atau mapel..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: 12 }} />
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white' }}>
          {subjects.map(s => <option key={s} value={s}>{s === 'Semua' ? '📚 Mapel' : s}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {['Semua','aktif','terjadwal','arsip'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '5px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              border: filterStatus === s ? '2px solid #6366f1' : '1px solid #e2e8f0',
              background: filterStatus === s ? '#eef2ff' : 'white', whiteSpace: 'nowrap'
            }}>
              {s === 'Semua' ? '📋 Semua' : s === 'aktif' ? '🟢 Aktif' : s === 'terjadwal' ? '🟡 Terjadwal' : '📦 Arsip'}
            </button>
          ))}
        </div>
      </div>

      {/* GRID MODUL */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <div style={{ width: 30, height: 30, border: '3px solid #f3e8ff', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Memuat...</p>
        </div>
      ) : filteredModuls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
          <AlertCircle size={48} color="#cbd5e1" />
          <h3 style={{ margin: '10px 0 4px', color: '#64748b' }}>Tidak Ada Modul</h3>
          <p style={{ fontSize: 12 }}>{searchTerm ? 'Coba ubah filter.' : 'Buat modul baru dengan klik tombol di atas.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filteredModuls.map(modul => {
            const sb = getStatusBadge(modul.status);
            return (
              <div key={modul.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ height: 110, position: 'relative' }}>
                  <img src={modul.coverImage || "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=500"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ background: '#6366f1', color: 'white', padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 800 }}>{modul.subject || 'UMUM'}</span>
                    <button onClick={(e) => handleDeleteModul(e, modul.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 6px', borderRadius: 5, cursor: 'pointer', fontSize: 10 }}>🗑️</button>
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, marginBottom: 6, background: sb.bg, color: sb.color }}>{sb.label}</span>
                  <h3 style={{ margin: '0 0 6px', fontSize: 14, color: '#1e293b', fontWeight: 700, lineHeight: 1.3 }}>{modul.title || "Untitled"}</h3>
                  <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>
                    <span><FileText size={10}/> {(modul.blocks || []).length}</span>
                    <span><HelpCircle size={10}/> {modul.quizData?.length || 0}</span>
                    <span><Users size={10}/> {modul.targetKelas || 'Semua'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => navigate(`/guru/modul/materi?edit=${modul.id}`)} style={{ flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: 7, borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <Edit3 size={11} /> Kelola
                    </button>
                    <button onClick={() => window.open(`/siswa/materi/${modul.id}`, '_blank')} style={{ flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: 7, borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <Eye size={11} /> Preview
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModulManager;