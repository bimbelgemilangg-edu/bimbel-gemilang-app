import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Send, Users, FileText, HardDrive, AlertCircle, 
  Trash2, Bell, Eye, RefreshCw, CheckCircle, Search, ArrowLeft,
  Layout, ChevronRight, Home, FolderOpen, Upload, Download
} from 'lucide-react';

// Konfigurasi Supabase
const supabaseUrl = 'https://hqoasblnrsijbflupoir.supabase.co';
const supabaseAnonKey = 'sb_publishable_TsPJgcnaLOCPV9-DpSyMuA_EQkbrEKt';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET_NAME = 'materi-bimbel';

const ManageMateri = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState({ totalSiswa: 0, totalModul: 0, totalTugasPending: 0, storageUsed: '0 MB' });
  const [materiList, setMateriList] = useState([]);
  const [data, setData] = useState({ title: '', link: '', subject: 'Umum' });
  const [pendingTasks, setPendingTasks] = useState([]);
  const [storageFiles, setStorageFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [storageLoading, setStorageLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Toast Alert
  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const userRole = localStorage.getItem('userRole');
      const role = localStorage.getItem('role');
      const teacherData = localStorage.getItem('teacherData');
      
      const isAdmin = userRole === 'admin' || role === 'admin' || (teacherData && JSON.parse(teacherData)?.role === 'admin');
      
      if (isAdmin) {
        setIsAuthorized(true);
        fetchOverviewData();
        fetchMateriList();
        fetchPendingTasks();
        fetchStorageFiles();
      } else {
        navigate('/admin');
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const fetchOverviewData = async () => {
    try {
      const siswaSnap = await getDocs(collection(db, 'students'));
      const modulSnap = await getDocs(collection(db, 'bimbel_modul'));
      const tugasSnap = await getDocs(query(collection(db, 'jawaban_tugas'), where('status', '==', 'Pending')));
      
      setStats({
        totalSiswa: siswaSnap.size,
        totalModul: modulSnap.size,
        totalTugasPending: tugasSnap.size,
        storageUsed: '...'
      });
      
      // Hitung storage async
      const { data: files } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });
      let totalSize = 0;
      if (files) files.forEach(f => totalSize += f.metadata?.size || 0);
      setStats(prev => ({ ...prev, storageUsed: totalSize > 0 ? (totalSize / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB' }));
    } catch (err) { console.error(err); }
  };

  const fetchMateriList = async () => {
    const snap = await getDocs(collection(db, 'bimbel_modul'));
    setMateriList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchPendingTasks = async () => {
    const snap = await getDocs(query(collection(db, 'jawaban_tugas'), where('status', '==', 'Pending')));
    setPendingTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchStorageFiles = async () => {
    setStorageLoading(true);
    const { data } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 100 });
    setStorageFiles(data || []);
    setStorageLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStorageFiles();
    fetchOverviewData();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!data.title || !data.link) return showAlert('⚠️ Judul dan Link wajib diisi!');
    setLoading(true);
    try {
      await addDoc(collection(db, "bimbel_modul"), {
        ...data,
        type: 'materi',
        createdAt: serverTimestamp(),
        author: localStorage.getItem('teacherName') || 'Admin'
      });
      showAlert('✅ Materi Berhasil Terbit!');
      setData({ title: '', link: '', subject: 'Umum' });
      fetchMateriList();
      fetchOverviewData();
    } catch (err) { showAlert('❌ Error: ' + err.message); }
    setLoading(false);
  };

  const handleDeleteFile = async (fileName) => {
    if(!window.confirm(`Hapus permanen "${fileName}"?`)) return;
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    if (error) showAlert('❌ Gagal hapus: ' + error.message);
    else { showAlert('🗑️ File berhasil dihapus!'); fetchStorageFiles(); fetchOverviewData(); }
  };

  const handleSendReminder = (task) => {
    showAlert(`🔔 Reminder untuk ${task.studentName}: "${task.modulTitle}"`);
  };

  const handleMarkAsDone = async (taskId) => {
    await updateDoc(doc(db, 'jawaban_tugas', taskId), { status: 'Done' });
    showAlert('✅ Tugas ditandai selesai!');
    fetchPendingTasks();
  };

  if (checkingAuth) return <div style={styles.loadingScreen}>🔐 Memeriksa Akses Admin...</div>;
  if (!isAuthorized) return null;

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* 🔥 TOAST ALERT */}
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* 🔥 BREADCRUMB + TOMBOL KEMBALI */}
        <div style={styles.breadcrumb}>
          <button onClick={() => navigate('/admin/portal')} style={styles.backButton}>
            <ArrowLeft size={16} /> Kembali ke Portal Siswa
          </button>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#94a3b8'}}>Portal Siswa</span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Pantau Materi</span>
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={styles.title(isMobile)}>📊 Panel Administrasi Materi & Tugas</h2>
          <p style={styles.subtitle}>Pemantauan menyeluruh untuk kelancaran operasional bimbel.</p>
        </div>

        {/* STATS CARDS */}
        <div style={styles.statsGrid(isMobile)}>
          <div style={styles.statCard}><Users size={24} color="#3b82f6"/><h3>{stats.totalSiswa}</h3><p>Siswa Aktif</p></div>
          <div style={styles.statCard}><BookOpen size={24} color="#10b981"/><h3>{stats.totalModul}</h3><p>Modul Materi</p></div>
          <div style={styles.statCard}><AlertCircle size={24} color="#f59e0b"/><h3>{stats.totalTugasPending}</h3><p>Tugas Menumpuk</p></div>
          <div style={styles.statCard}><HardDrive size={24} color="#8b5cf6"/><h3>{stats.storageUsed}</h3><p>Storage</p></div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={styles.tabBar(isMobile)}>
          <button onClick={() => setActiveTab('overview')} style={styles.tab(activeTab === 'overview')}>📊 Ringkasan</button>
          <button onClick={() => setActiveTab('materi')} style={styles.tab(activeTab === 'materi')}>📚 Materi</button>
          <button onClick={() => setActiveTab('tugas')} style={styles.tab(activeTab === 'tugas')}>⏳ Tugas</button>
          <button onClick={() => setActiveTab('storage')} style={styles.tab(activeTab === 'storage')}>🗄️ Storage</button>
        </div>

        {/* CONTENT AREA */}
        <div style={styles.contentCard(isMobile)}>
          
          {/* TAB: RINGKASAN */}
          {activeTab === 'overview' && (
            <div>
              <h4 style={styles.sectionTitle}>📡 Aktivitas Terbaru</h4>
              {pendingTasks.length === 0 ? (
                <div style={styles.emptyState}>
                  <CheckCircle size={40} color="#10b981" />
                  <p>✅ Semua tugas sudah selesai!</p>
                </div>
              ) : (
                pendingTasks.slice(0, 10).map(task => (
                  <div key={task.id} style={styles.activityItem}>
                    <FileText size={16} color="#673ab7" />
                    <div>
                      <strong>{task.studentName}</strong> mengumpulkan <span style={{color: '#673ab7'}}>{task.modulTitle}</span>
                      <div style={{fontSize: 11, color: '#94a3b8'}}>{task.fileName}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: MATERI */}
          {activeTab === 'materi' && (
            <div>
              <h4 style={styles.sectionTitle}>📤 Upload Materi Baru (Link)</h4>
              <form onSubmit={handleUpload} style={styles.form(isMobile)}>
                <input style={styles.input(isMobile)} placeholder="Judul Materi" value={data.title} onChange={e => setData({...data, title: e.target.value})} required />
                <input style={styles.input(isMobile)} placeholder="Link Google Drive/Video" value={data.link} onChange={e => setData({...data, link: e.target.value})} required />
                <select style={styles.input(isMobile)} value={data.subject} onChange={e => setData({...data, subject: e.target.value})}>
                  <option value="Umum">Umum</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="IPA">IPA</option>
                  <option value="IPS">IPS</option>
                </select>
                <button type="submit" style={styles.btn} disabled={loading}>
                  <Send size={16} /> {loading ? 'Menerbitkan...' : 'Terbitkan'}
                </button>
              </form>

              <h4 style={{...styles.sectionTitle, marginTop: 30}}>📚 Daftar Materi ({materiList.length})</h4>
              {materiList.length === 0 ? (
                <div style={styles.emptyState}>
                  <FolderOpen size={40} color="#94a3b8" />
                  <p>Belum ada materi. Upload materi baru di atas.</p>
                </div>
              ) : (
                materiList.map(m => (
                  <div key={m.id} style={styles.listItem}>
                    <div style={{flex: 1}}>
                      <a href={m.link} target="_blank" rel="noreferrer" style={{fontWeight: 'bold', color: '#1e293b', textDecoration: 'none'}}>{m.title}</a>
                      <div style={{fontSize: 11, color: '#94a3b8'}}>{m.subject} • {m.author || 'Admin'}</div>
                    </div>
                    <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                      <span style={styles.subjectBadge}>{m.subject}</span>
                      <button onClick={() => window.open(m.link, '_blank')} style={styles.iconBtn}><Eye size={14} /> Buka</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: TUGAS */}
          {activeTab === 'tugas' && (
            <div>
              <div style={styles.searchBox}>
                <Search size={16} color="#94a3b8" />
                <input placeholder="Cari siswa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
              </div>
              {pendingTasks.filter(t => t.studentName?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <div style={styles.emptyState}>
                  <CheckCircle size={40} color="#10b981" />
                  <p>{searchTerm ? 'Tidak ada hasil pencarian.' : '✅ Tidak ada tugas yang menumpuk!'}</p>
                </div>
              ) : (
                pendingTasks.filter(t => t.studentName?.toLowerCase().includes(searchTerm.toLowerCase())).map(task => (
                  <div key={task.id} style={styles.taskCard(isMobile)}>
                    <div style={styles.taskHeader}>
                      <strong>{task.studentName}</strong>
                      <span style={styles.classBadge}>{task.studentClass}</span>
                    </div>
                    <p style={styles.taskInfo}>{task.modulTitle} • {task.fileName}</p>
                    <div style={styles.actionGroup(isMobile)}>
                      <button onClick={() => window.open(task.fileUrl, '_blank')} style={styles.actionBtn}><Eye size={14} /> Lihat</button>
                      <button onClick={() => handleSendReminder(task)} style={{...styles.actionBtn, background: '#fef3c7', color: '#b45309'}}><Bell size={14} /> Remind</button>
                      <button onClick={() => handleMarkAsDone(task.id)} style={{...styles.actionBtn, background: '#dcfce7', color: '#166534'}}><CheckCircle size={14} /> Selesai</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: STORAGE */}
          {activeTab === 'storage' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10}}>
                <h4 style={{margin: 0}}>🗄️ File di Supabase Storage</h4>
                <button onClick={handleRefresh} style={styles.refreshBtn(refreshing)}>
                  <RefreshCw size={14} style={{animation: refreshing ? 'spin 1s linear infinite' : 'none'}} /> 
                  {refreshing ? 'Memuat...' : 'Refresh'}
                </button>
              </div>
              {storageLoading ? (
                <div style={styles.emptyState}>Memuat data storage...</div>
              ) : storageFiles.length === 0 ? (
                <div style={styles.emptyState}>
                  <Upload size={40} color="#94a3b8" />
                  <p>Bucket kosong. Upload file dari Guru atau Siswa terlebih dahulu.</p>
                </div>
              ) : (
                <div style={{overflowX: 'auto'}}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thr}>
                        <th style={styles.th}>Nama File</th>
                        <th style={styles.th}>Ukuran</th>
                        <th style={styles.th}>Dibuat</th>
                        <th style={styles.th}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageFiles.map(file => (
                        <tr key={file.id} style={styles.tr}>
                          <td style={styles.td}>
                            <FileText size={14} color="#673ab7" style={{marginRight: 6}} />
                            {file.name}
                          </td>
                          <td style={styles.td}>{(file.metadata?.size / 1024).toFixed(1)} KB</td>
                          <td style={styles.td}>{file.created_at ? new Date(file.created_at).toLocaleDateString('id-ID') : '-'}</td>
                          <td style={styles.td}>
                            <button onClick={() => handleDeleteFile(file.name)} style={styles.deleteBtn}>
                              <Trash2 size={14} /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden', transition: '0.3s' }),
  loadingScreen: { padding: 50, textAlign: 'center', color: '#64748b', fontWeight: 'bold' },
  
  // TOAST
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'fadeIn 0.3s ease' },
  
  // BREADCRUMB
  breadcrumb: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  backButton: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  
  // HEADER
  header: { marginBottom: 25 },
  title: (m) => ({ margin: 0, fontSize: m ? 20 : 24, fontWeight: 800, color: '#1e293b' }),
  subtitle: { color: '#64748b', marginTop: 4 },
  
  // STATS
  statsGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 15, marginBottom: 25 }),
  statCard: { background: 'white', padding: 18, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid #f1f5f9' },
  
  // TABS
  tabBar: (m) => ({ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10, overflowX: 'auto', flexWrap: m ? 'nowrap' : 'wrap' }),
  tab: (active) => ({ padding: '10px 18px', border: 'none', background: active ? '#3b82f6' : 'transparent', color: active ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 600, borderRadius: 10, fontSize: 13, whiteSpace: 'nowrap' }),
  
  // CONTENT
  contentCard: (m) => ({ background: 'white', padding: m ? 20 : 25, borderRadius: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }),
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, marginTop: 0 },
  emptyState: { textAlign: 'center', padding: 40, color: '#94a3b8' },
  
  // FORM
  form: (m) => ({ display: 'flex', gap: 10, marginBottom: 20, flexDirection: m ? 'column' : 'row', flexWrap: 'wrap' }),
  input: (m) => ({ flex: 1, minWidth: m ? '100%' : '150px', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }),
  btn: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 },
  
  // LIST
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', gap: 10, flexWrap: 'wrap' },
  subjectBadge: { background: '#e0e7ff', color: '#3730a3', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  iconBtn: { background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' },
  
  // TASKS
  taskCard: (m) => ({ padding: 15, border: '1px solid #f1f5f9', borderRadius: 14, marginBottom: 10 }),
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, flexWrap: 'wrap', gap: 5 },
  classBadge: { background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 },
  taskInfo: { margin: '8px 0', fontSize: 13, color: '#64748b' },
  actionGroup: (m) => ({ display: 'flex', gap: 8, flexWrap: m ? 'wrap' : 'nowrap' }),
  actionBtn: { background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: '#1e293b' },
  
  // STORAGE TABLE
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '12px 15px', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 15px', fontSize: 13, verticalAlign: 'middle' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 15px', borderRadius: 10, marginBottom: 15, border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 14 },
  refreshBtn: (loading) => ({ background: loading ? '#e2e8f0' : 'white', border: '1px solid #e2e8f0', padding: '8px 15px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }),
  deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 },
  activityItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }
};

export default ManageMateri;