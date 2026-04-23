import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { BookOpen, Plus, Search, FileText, HelpCircle, Layers, Trash2, Edit3, Eye, AlertCircle, Users, Filter, ChevronDown, Calendar, Target } from 'lucide-react';
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

  useEffect(() => {
    fetchModuls();
  }, []);

  const fetchModuls = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setModuls(data);
    } catch (error) {
      const fallbackSnap = await getDocs(collection(db, COLLECTION_NAME));
      setModuls(fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    setLoading(false);
  };

  const handleDeleteModul = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("⚠️ PERINGATAN: Modul akan dihapus permanen. Lanjutkan?")) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        setModuls(moduls.filter(m => m.id !== id));
      } catch (e) { alert("Gagal menghapus: " + e.message); }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'aktif': { label: '🟢 Aktif', color: '#10b981', bg: '#dcfce7' },
      'terjadwal': { label: '🟡 Terjadwal', color: '#f59e0b', bg: '#fef3c7' },
      'arsip': { label: '📦 Arsip', color: '#64748b', bg: '#f1f5f9' }
    };
    return badges[status] || badges['aktif'];
  };

  const filteredModuls = moduls.filter(m => {
    const title = (m.title || "").toLowerCase();
    const subject = (m.subject || "").toLowerCase();
    const matchSearch = title.includes(searchTerm.toLowerCase()) || subject.includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === "Semua" || m.subject === filterSubject;
    const matchStatus = filterStatus === "Semua" || m.status === filterStatus || (!m.status && filterStatus === "aktif");
    return matchSearch && matchSubject && matchStatus;
  });

  const subjects = ["Semua", ...new Set(moduls.map(m => m.subject).filter(Boolean))];
  const statusFilters = [
    { value: 'Semua', label: '📋 Semua' },
    { value: 'aktif', label: '🟢 Aktif' },
    { value: 'terjadwal', label: '🟡 Terjadwal' },
    { value: 'arsip', label: '📦 Arsip' }
  ];

  const totalAktif = moduls.filter(m => m.status === 'aktif' || !m.status).length;
  const totalTerjadwal = moduls.filter(m => m.status === 'terjadwal').length;
  const totalArsip = moduls.filter(m => m.status === 'arsip').length;

  return (
    <div style={styles.container(isMobile)}>
      {/* HEADER */}
      <div style={styles.header(isMobile)}>
        <div style={styles.titleGroup}>
          <div style={styles.iconCircle}><BookOpen size={22} color="white"/></div>
          <div>
            <h2 style={styles.titleText(isMobile)}>E-Learning Console</h2>
            <p style={styles.subtitleText}>Pusat Kendali Materi & Kuis Siswa</p>
          </div>
        </div>
        <button onClick={() => navigate('/guru/modul/materi')} style={styles.btnAdd(isMobile)}>
          <Plus size={16} /> {!isMobile && 'Buat Modul Baru'}
        </button>
      </div>

      {/* STATS */}
      <div style={styles.statsRow(isMobile)}>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#dcfce7'}}><Layers size={18} color="#10b981"/></div>
          <div><span style={styles.statLabel}>AKTIF</span><span style={styles.statValue}>{totalAktif}</span></div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fef3c7'}}><Calendar size={18} color="#f59e0b"/></div>
          <div><span style={styles.statLabel}>TERJADWAL</span><span style={styles.statValue}>{totalTerjadwal}</span></div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#f1f5f9'}}><Target size={18} color="#64748b"/></div>
          <div><span style={styles.statLabel}>ARSIP</span><span style={styles.statValue}>{totalArsip}</span></div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={styles.filterBar(isMobile)}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#94a3b8" />
          <input placeholder="Cari judul atau mapel..." style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select style={styles.filterSelect} value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          {subjects.map(s => <option key={s} value={s}>{s === 'Semua' ? '📚 Semua Mapel' : s}</option>)}
        </select>
        <div style={styles.statusFilter}>
          {statusFilters.map(s => (
            <button key={s.value} onClick={() => setFilterStatus(s.value)} style={styles.statusBtn(filterStatus === s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={styles.loadingArea}><div style={styles.spinner}></div><p>Memuat modul...</p></div>
      ) : filteredModuls.length === 0 ? (
        <div style={styles.emptyState}>
          <AlertCircle size={48} color="#cbd5e1" />
          <h3>Tidak Ada Modul</h3>
          <p>{searchTerm || filterSubject !== 'Semua' || filterStatus !== 'Semua' ? 'Coba ubah filter.' : 'Buat modul baru sekarang.'}</p>
          {!searchTerm && filterSubject === 'Semua' && filterStatus === 'Semua' && (
            <button onClick={() => navigate('/guru/modul/materi')} style={styles.btnAddEmpty}>Mulai Buat Modul</button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredModuls.map((modul) => {
            const statusBadge = getStatusBadge(modul.status);
            return (
              <div key={modul.id} style={styles.card}>
                <div style={styles.cardCover}>
                  <img src={modul.coverImage || "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=500"} style={styles.coverImg} alt="Cover" />
                  <div style={styles.coverOverlay}>
                    <span style={styles.subjectBadge}>{modul.subject || 'UMUM'}</span>
                    <button onClick={(e) => handleDeleteModul(e, modul.id)} style={styles.btnDel}>🗑️</button>
                  </div>
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{modul.title || "Untitled"}</h3>
                  
                  {/* STATUS & MINGGU */}
                  <div style={styles.tagRow}>
                    <span style={{...styles.tag, background: statusBadge.bg, color: statusBadge.color}}>{statusBadge.label}</span>
                    {modul.mingguKe && <span style={styles.tag}>📅 Minggu ke-{modul.mingguKe}</span>}
                    {modul.tahunAjaran && <span style={styles.tag}>📆 {modul.tahunAjaran}</span>}
                  </div>

                  <div style={styles.cardMeta}>
                    <div style={styles.metaItem}><FileText size={12}/> {(modul.blocks || []).length} Materi</div>
                    <div style={styles.metaItem}><HelpCircle size={12}/> {modul.quizData?.length || 0} Soal</div>
                    <div style={styles.metaItem}><Users size={12}/> {modul.targetKelas || 'Semua'}</div>
                  </div>

                  <div style={styles.cardActions}>
                    <button onClick={() => navigate(`/guru/modul/materi?edit=${modul.id}`)} style={styles.btnEdit}>
                      <Edit3 size={14}/> Kelola
                    </button>
                    <button onClick={() => window.open(`/siswa/materi/${modul.id}`, '_blank')} style={styles.btnPreview}>
                      <Eye size={14}/> Preview
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

const styles = {
  container: (m) => ({ padding: m ? '15px' : '30px', maxWidth: 1200, marginLeft: m ? 0 : '260px', transition: 'margin-left 0.3s ease', margin: m ? '0 auto' : '0 auto' }),
  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, flexWrap: 'wrap', gap: 15 }),
  titleGroup: { display: 'flex', alignItems: 'center', gap: 15 },
  iconCircle: { background: '#6366f1', padding: 12, borderRadius: 16, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' },
  titleText: (m) => ({ margin: 0, fontSize: m ? 18 : 22, fontWeight: 900, color: '#0f172a' }),
  subtitleText: { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 500 },
  btnAdd: (m) => ({ background: '#6366f1', color: 'white', border: 'none', padding: m ? '10px 15px' : '14px 25px', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: m ? 12 : 14, boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)' }),

  // STATS
  statsRow: (m) => ({ display: 'flex', gap: m ? 8 : 15, marginBottom: 25, flexWrap: 'wrap' }),
  statCard: { flex: 1, minWidth: 120, background: 'white', padding: 15, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  statIcon: { padding: 10, borderRadius: 12 },
  statLabel: { display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8' },
  statValue: { display: 'block', fontSize: 20, fontWeight: 900, color: '#1e293b' },

  // FILTER
  filterBar: (m) => ({ display: 'flex', gap: 10, marginBottom: 25, flexWrap: 'wrap' }),
  searchWrapper: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', padding: '10px 15px', borderRadius: 12, border: '1px solid #e2e8f0', flex: 2, minWidth: 200 },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 14, fontWeight: 500 },
  filterSelect: { padding: '10px 15px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, background: 'white', cursor: 'pointer' },
  statusFilter: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  statusBtn: (active) => ({ padding: '8px 14px', borderRadius: 10, border: active ? '2px solid #6366f1' : '1px solid #e2e8f0', background: active ? '#eef2ff' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12, color: active ? '#6366f1' : '#64748b' }),

  // GRID
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
  card: { background: 'white', borderRadius: 18, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' },
  cardCover: { height: 140, position: 'relative' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, padding: 10, display: 'flex', justifyContent: 'space-between' },
  subjectBadge: { background: '#6366f1', color: 'white', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800 },
  btnDel: { background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
  cardBody: { padding: 16, flex: 1, display: 'flex', flexDirection: 'column' },
  cardTitle: { margin: '0 0 8px 0', fontSize: 16, color: '#1e293b', fontWeight: 800, lineHeight: 1.3 },
  tagRow: { display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  tag: { fontSize: 10, fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: 6 },
  cardMeta: { display: 'flex', gap: 12, marginBottom: 15, borderBottom: '1px solid #f8fafc', paddingBottom: 10 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b', fontWeight: 600 },
  cardActions: { display: 'flex', gap: 8, marginTop: 'auto' },
  btnEdit: { flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
  btnPreview: { flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },

  loadingArea: { textAlign: 'center', padding: 60 },
  spinner: { width: 36, height: 36, border: '4px solid #f3e8ff', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },
  emptyState: { textAlign: 'center', padding: 60, color: '#94a3b8', background: 'white', borderRadius: 20, border: '2px dashed #e2e8f0' },
  btnAddEmpty: { marginTop: 20, background: '#6366f1', color: 'white', border: 'none', padding: '12px 25px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 14 },
};

export default ModulManager;