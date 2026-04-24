import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { BookOpen, Plus, Search, FileText, HelpCircle, Trash2, Edit3, Eye, AlertCircle, Users, Calendar, Target, Layers, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModulManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Semua"); // Semua | modul | kuis
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  const COLLECTION_NAME = "bimbel_modul";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
      const data = (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(data);
    } catch {
      const data = (await getDocs(collection(db, COLLECTION_NAME))).docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(data);
    }
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("⚠️ Hapus permanen?")) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      setItems(items.filter(i => i.id !== id));
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

  const filteredItems = items.filter(i => {
    const t = (i.title || "").toLowerCase();
    const s = (i.subject || "").toLowerCase();
    const matchSearch = t.includes(searchTerm.toLowerCase()) || s.includes(searchTerm.toLowerCase());
    const isKuis = i.type === 'kuis_mandiri';
    const matchType = filterType === "Semua" || (filterType === "kuis" && isKuis) || (filterType === "modul" && !isKuis);
    const matchStatus = filterStatus === "Semua" || i.status === filterStatus || (!i.status && filterStatus === "aktif");
    return matchSearch && matchType && matchStatus;
  });

  const totalModul = items.filter(i => !i.type || i.type !== 'kuis_mandiri').length;
  const totalKuis = items.filter(i => i.type === 'kuis_mandiri').length;
  const totalAktif = items.filter(i => i.status === 'aktif' || !i.status).length;

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#6366f1', padding: 10, borderRadius: 14 }}><BookOpen size={22} color="white"/></div>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b' }}>E-Learning Console</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Modul & Kuis</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => navigate('/guru/manage-quiz')} style={{
            background: '#f59e0b', color: 'white', border: 'none', padding: isMobile ? '10px 14px' : '12px 18px', borderRadius: 10,
            cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 11 : 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
          }}>
            <HelpCircle size={16} /> Kuis
          </button>
          <button onClick={() => navigate('/guru/modul/materi')} style={{
            background: '#6366f1', color: 'white', border: 'none', padding: isMobile ? '10px 14px' : '12px 18px', borderRadius: 10,
            cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 11 : 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
          }}>
            <Plus size={16} /> Modul
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: isMobile ? 6 : 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 80, background: 'white', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9' }}>
          <Layers size={16} color="#6366f1"/><span style={{ fontSize: 12, fontWeight: 700 }}>{totalModul} <span style={{fontWeight:400, color:'#64748b'}}>Modul</span></span>
        </div>
        <div style={{ flex: 1, minWidth: 80, background: 'white', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9' }}>
          <Send size={16} color="#f59e0b"/><span style={{ fontSize: 12, fontWeight: 700 }}>{totalKuis} <span style={{fontWeight:400, color:'#64748b'}}>Kuis</span></span>
        </div>
        <div style={{ flex: 1, minWidth: 80, background: 'white', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9' }}>
          <Target size={16} color="#10b981"/><span style={{ fontSize: 12, fontWeight: 700 }}>{totalAktif} <span style={{fontWeight:400, color:'#64748b'}}>Aktif</span></span>
        </div>
      </div>

      {/* FILTER */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', flex: 2, minWidth: 150 }}>
          <Search size={14} color="#94a3b8" />
          <input placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: 12 }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, background: 'white' }}>
          <option value="Semua">📋 Semua</option>
          <option value="modul">📚 Modul</option>
          <option value="kuis">❓ Kuis</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, background: 'white' }}>
          <option value="Semua">📋 Status</option>
          <option value="aktif">🟢 Aktif</option>
          <option value="terjadwal">🟡 Terjadwal</option>
          <option value="arsip">📦 Arsip</option>
        </select>
      </div>

      {/* GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <div style={{ width: 30, height: 30, border: '3px solid #f3e8ff', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Memuat...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
          <AlertCircle size={48} color="#cbd5e1" />
          <h3 style={{ margin: '10px 0 4px', color: '#64748b' }}>Tidak Ada</h3>
          <p style={{ fontSize: 12 }}>{searchTerm ? 'Coba ubah filter.' : 'Buat modul atau kuis baru.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filteredItems.map(item => {
            const isKuis = item.type === 'kuis_mandiri';
            const sb = getStatusBadge(item.status);
            return (
              <div key={item.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', borderTop: `4px solid ${isKuis ? '#f59e0b' : '#6366f1'}` }}>
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: sb.bg, color: sb.color }}>{sb.label}</span>
                    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: isKuis ? '#fef3c7' : '#e0e7ff', color: isKuis ? '#b45309' : '#3730a3' }}>
                      {isKuis ? '❓ Kuis' : '📚 Modul'}
                    </span>
                    {item.subject && <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: '#f1f5f9', color: '#64748b' }}>{item.subject}</span>}
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 14, color: '#1e293b', fontWeight: 700, lineHeight: 1.3 }}>{item.title || "Untitled"}</h3>
                  <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>
                    {isKuis ? (
                      <span><HelpCircle size={10}/> {item.quizData?.length || 0} soal</span>
                    ) : (
                      <span><FileText size={10}/> {(item.blocks || []).length} materi</span>
                    )}
                    <span><Users size={10}/> {item.targetKelas || 'Semua'}</span>
                    {item.mingguKe && <span>📅 Mg ke-{item.mingguKe}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => navigate(isKuis ? `/guru/manage-quiz?modulId=${item.id}` : `/guru/modul/materi?edit=${item.id}`)} style={{ flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: 7, borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <Edit3 size={11} /> Edit
                    </button>
                    <button onClick={() => window.open(`/siswa/materi/${item.id}`, '_blank')} style={{ flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: 7, borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <Eye size={11} /> Preview
                    </button>
                    <button onClick={(e) => handleDelete(e, item.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: 7, borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={11} />
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