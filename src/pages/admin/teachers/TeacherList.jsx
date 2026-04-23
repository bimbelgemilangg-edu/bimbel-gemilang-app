import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { 
  Search, Plus, Edit3, Trash2, Users, Home, ChevronRight, 
  RefreshCw, BookOpen, DollarSign, Calendar, Briefcase, GraduationCap
} from 'lucide-react';

const TeacherList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teachers"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      setTeachers(data);
    } catch (error) { console.error("Fetch error:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus guru "${nama}"?\n\nSemua data guru ini akan hilang permanen.`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "teachers", id));
      showAlert(`🗑️ "${nama}" berhasil dihapus!`);
      fetchTeachers();
    } catch (error) { showAlert("❌ Gagal menghapus: " + error.message); }
    setDeleting(null);
  };

  const filtered = teachers.filter(t => 
    (t.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.mapel || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mapelList = [...new Set(teachers.map(t => t.mapel).filter(Boolean))];

  if (loading) return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Memuat data guru...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* TOAST */}
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* BREADCRUMB */}
        <div style={styles.breadcrumb(isMobile)}>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Kelola Guru</span>
          </div>
          <div style={styles.breadcrumbActions(isMobile)}>
            <button onClick={() => navigate('/admin/teachers/salaries')} style={styles.btnSalary(isMobile)}>
              <DollarSign size={14} /> Gaji Guru
            </button>
            <button onClick={() => navigate('/admin/schedule')} style={styles.btnSchedule(isMobile)}>
              <Calendar size={14} /> Jadwal
            </button>
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}><Users size={22} /> Daftar Guru</h2>
            <p style={styles.subtitle}>{teachers.length} guru terdaftar • {mapelList.length} mata pelajaran</p>
          </div>
          <button onClick={() => window.location.href = '/login-guru'} style={styles.btnAdd(isMobile)}>
            <Plus size={18} /> Tambah Guru
          </button>
        </div>

        {/* STATS */}
        <div style={styles.statsRow(isMobile)}>
          <div style={styles.statMini}>
            <Users size={16} color="#3b82f6" />
            <div>
              <h3>{teachers.length}</h3>
              <span>Total Guru</span>
            </div>
          </div>
          <div style={styles.statMini}>
            <BookOpen size={16} color="#8b5cf6" />
            <div>
              <h3>{mapelList.length}</h3>
              <span>Mapel</span>
            </div>
          </div>
          <div style={styles.statMini}>
            <Briefcase size={16} color="#10b981" />
            <div>
              <h3>{teachers.filter(t => t.status === 'Aktif').length}</h3>
              <span>Aktif</span>
            </div>
          </div>
        </div>

        {/* FILTER */}
        <div style={styles.filterBar(isMobile)}>
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari nama guru atau mapel..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <button onClick={fetchTeachers} style={styles.btnRefresh(isMobile)}>
            <RefreshCw size={14} /> {!isMobile && 'Refresh'}
          </button>
        </div>

        {/* TABEL */}
        <div style={styles.card}>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <GraduationCap size={48} color="#94a3b8" />
              <p style={{fontWeight: 'bold', marginTop: 10}}>
                {searchTerm ? 'Tidak ada guru yang cocok.' : 'Belum ada guru terdaftar.'}
              </p>
              <p style={{fontSize: 13}}>
                {searchTerm ? 'Coba kata kunci lain.' : 'Daftarkan guru melalui halaman login guru.'}
              </p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thr}>
                    <th style={styles.th}>Nama</th>
                    <th style={styles.th}>Mapel</th>
                    {!isMobile && <th style={styles.th}>No. HP</th>}
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.teacherName}>
                          <div style={styles.avatar}>{t.nama?.charAt(0) || 'G'}</div>
                          <div>
                            <div style={{fontWeight: 'bold', fontSize: 14}}>{t.nama}</div>
                            {isMobile && <div style={{fontSize: 11, color: '#94a3b8'}}>{t.nohp || '-'}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.mapelBadge}>
                          {t.mapel || 'Umum'}
                        </span>
                      </td>
                      {!isMobile && <td style={styles.td}>{t.nohp || '-'}</td>}
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button onClick={() => navigate('/admin/teachers/salaries')} style={{...styles.btnAction, background: '#f0fdf4', color: '#166534'}} title="Gaji">
                            <DollarSign size={14} />
                          </button>
                          <button onClick={() => navigate(`/admin/schedule`)} style={{...styles.btnAction, background: '#e0e7ff', color: '#3730a3'}} title="Jadwal">
                            <Calendar size={14} />
                          </button>
                          <button onClick={() => navigate(`/admin/teachers/edit/${t.id}`)} style={{...styles.btnAction, background: '#fef3c7', color: '#b45309'}} title="Edit">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDelete(t.id, t.nama)} disabled={deleting === t.id} style={{...styles.btnAction, background: '#fee2e2', color: '#ef4444', opacity: deleting === t.id ? 0.5 : 1}} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  
  // TOAST
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { width: 40, height: 40, border: '4px solid #f3e8ff', borderTop: '4px solid #673ab7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },
  
  // BREADCRUMB
  breadcrumb: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 8 : 0 }),
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  breadcrumbActions: (m) => ({ display: 'flex', gap: 8 }),
  btnSalary: (m) => ({ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 }),
  btnSchedule: (m) => ({ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 }),
  
  // HEADER
  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 10 : 0 }),
  pageTitle: (m) => ({ margin: 0, color: '#1e293b', fontSize: m ? 18 : 22, display: 'flex', alignItems: 'center', gap: 8 }),
  subtitle: { color: '#64748b', marginTop: 4, fontSize: 13 },
  btnAdd: (m) => ({ background: '#3b82f6', color: 'white', border: 'none', padding: m ? '10px 15px' : '12px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: m ? 12 : 14 }),
  
  // STATS
  statsRow: (m) => ({ display: 'flex', gap: m ? 8 : 15, marginBottom: 20 }),
  statMini: { flex: 1, background: 'white', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  
  // FILTER
  filterBar: (m) => ({ display: 'flex', gap: 10, marginBottom: 20, flexDirection: m ? 'column' : 'row' }),
  searchBox: { flex: 2, display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '10px 15px', borderRadius: 10, border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 14, background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 },
  btnRefresh: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '10px 15px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b' }),
  
  // TABLE
  card: { background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', overflow: 'hidden' },
  emptyState: { textAlign: 'center', padding: 60, color: '#94a3b8' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '12px 15px', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '12px 15px', fontSize: 13, verticalAlign: 'middle' },
  
  teacherName: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#673ab7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16, flexShrink: 0 },
  mapelBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold', background: '#e0e7ff', color: '#3730a3' },
  
  actionGroup: { display: 'flex', gap: 5, flexWrap: 'wrap' },
  btnAction: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '7px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default TeacherList;