import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { 
  Search, Plus, Edit3, Trash2, Eye, UserCheck, UserX, Users,
  Home, ChevronRight, BookOpen, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
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

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      setStudents(data);
    } catch (error) { console.error("Fetch error:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus "${nama}"?\n\nSemua data siswa ini akan hilang permanen.`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "students", id));
      showAlert(`🗑️ "${nama}" berhasil dihapus!`);
      fetchStudents();
    } catch (error) { showAlert("❌ Gagal menghapus: " + error.message); }
    setDeleting(null);
  };

  const handleToggleBlock = async (id, currentStatus, nama) => {
    const newStatus = !currentStatus;
    try {
      await updateDoc(doc(db, "students", id), { isBlocked: newStatus });
      showAlert(`${newStatus ? '🚫' : '✅'} "${nama}" ${newStatus ? 'diblokir' : 'diaktifkan kembali'}!`);
      fetchStudents();
    } catch (error) { showAlert("❌ Gagal update: " + error.message); }
  };

  // Filter
  const kelasList = ['Semua', ...new Set(students.map(s => s.kelasSekolah).filter(Boolean))].sort();
  
  const filtered = students.filter(s => {
    const matchNama = (s.nama || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = filterKelas === 'Semua' || s.kelasSekolah === filterKelas;
    return matchNama && matchKelas;
  });

  const totalAktif = students.filter(s => !s.isBlocked).length;
  const totalBlokir = students.filter(s => s.isBlocked).length;

  if (loading) return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Memuat data siswa...</p>
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
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Kelola Siswa</span>
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}><Users size={22} /> Daftar Siswa</h2>
            <p style={styles.subtitle}>{students.length} siswa terdaftar</p>
          </div>
          <button onClick={() => navigate('/admin/students/add')} style={styles.btnAdd(isMobile)}>
            <Plus size={18} /> Tambah Siswa
          </button>
        </div>

        {/* STATS */}
        <div style={styles.statsRow(isMobile)}>
          <div style={styles.statMini}>
            <Users size={16} color="#3b82f6" />
            <div>
              <h3>{students.length}</h3>
              <span>Total</span>
            </div>
          </div>
          <div style={styles.statMini}>
            <CheckCircle size={16} color="#10b981" />
            <div>
              <h3>{totalAktif}</h3>
              <span>Aktif</span>
            </div>
          </div>
          <div style={styles.statMini}>
            <AlertCircle size={16} color="#ef4444" />
            <div>
              <h3>{totalBlokir}</h3>
              <span>Diblokir</span>
            </div>
          </div>
        </div>

        {/* FILTER */}
        <div style={styles.filterBar(isMobile)}>
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari nama siswa..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={styles.selectFilter(isMobile)}>
            {kelasList.map(k => <option key={k} value={k}>{k === 'Semua' ? '📚 Semua Kelas' : k}</option>)}
          </select>
          <button onClick={fetchStudents} style={styles.btnRefresh(isMobile)}>
            <RefreshCw size={14} /> {!isMobile && 'Refresh'}
          </button>
        </div>

        {/* TABEL */}
        <div style={styles.card}>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <BookOpen size={48} color="#94a3b8" />
              <p style={{fontWeight: 'bold', marginTop: 10}}>
                {searchTerm ? 'Tidak ada siswa yang cocok.' : 'Belum ada siswa terdaftar.'}
              </p>
              <p style={{fontSize: 13}}>
                {searchTerm ? 'Coba kata kunci lain.' : 'Klik "Tambah Siswa" untuk memulai.'}
              </p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thr}>
                    <th style={styles.th}>Nama</th>
                    {!isMobile && <th style={styles.th}>Kelas</th>}
                    <th style={styles.th}>Program</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} style={{...styles.tr, opacity: s.isBlocked ? 0.6 : 1}}>
                      <td style={styles.td}>
                        <div style={{fontWeight: 'bold', fontSize: 14}}>{s.nama}</div>
                        {isMobile && <div style={{fontSize: 11, color: '#94a3b8'}}>{s.kelasSekolah || '-'}</div>}
                      </td>
                      {!isMobile && <td style={styles.td}>{s.kelasSekolah || '-'}</td>}
                      <td style={styles.td}>
                        <span style={styles.programBadge(s.kategori)}>
                          {s.kategori === 'English' ? '🇬🇧 English' : '📚 Reguler'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(s.isBlocked)}>
                          {s.isBlocked ? '🚫 Blokir' : '✅ Aktif'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button onClick={() => navigate(`/admin/students/attendance/${s.id}`)} style={styles.btnAction} title="Kehadiran">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => navigate(`/admin/students/edit/${s.id}`)} style={{...styles.btnAction, background: '#fef3c7', color: '#b45309'}} title="Edit">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleToggleBlock(s.id, s.isBlocked, s.nama)} style={{...styles.btnAction, background: s.isBlocked ? '#dcfce7' : '#fee2e2', color: s.isBlocked ? '#166534' : '#ef4444'}} title={s.isBlocked ? 'Aktifkan' : 'Blokir'}>
                            {s.isBlocked ? <CheckCircle size={14} /> : <UserX size={14} />}
                          </button>
                          <button onClick={() => handleDelete(s.id, s.nama)} disabled={deleting === s.id} style={{...styles.btnAction, background: '#fee2e2', color: '#ef4444', opacity: deleting === s.id ? 0.5 : 1}} title="Hapus">
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
  breadcrumb: (m) => ({ marginBottom: 20 }),
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  
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
  selectFilter: (m) => ({ flex: m ? 1 : 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, background: 'white' }),
  btnRefresh: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '10px 15px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b' }),
  
  // TABLE
  card: { background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', overflow: 'hidden' },
  emptyState: { textAlign: 'center', padding: 60, color: '#94a3b8' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '12px 15px', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '12px 15px', fontSize: 13, verticalAlign: 'middle' },
  programBadge: (kat) => ({ padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', background: kat === 'English' ? '#e0e7ff' : '#f0fdf4', color: kat === 'English' ? '#3730a3' : '#166534' }),
  statusBadge: (blocked) => ({ padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', background: blocked ? '#fee2e2' : '#dcfce7', color: blocked ? '#ef4444' : '#166534' }),
  actionGroup: { display: 'flex', gap: 5, flexWrap: 'wrap' },
  btnAction: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '7px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default StudentList;