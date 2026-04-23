import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Link as LinkIcon, Send, Users, FileText, HardDrive, AlertCircle, 
  Trash2, Bell, Eye, Download, RefreshCw, CheckCircle, XCircle, BarChart3, Search
} from 'lucide-react';

// --- KONFIGURASI SUPABASE ---
const supabaseUrl = 'https://hqoasblnrsijbflupoir.supabase.co';
const supabaseAnonKey = 'sb_publishable_TsPJgcnaLOCPV9-DpSyMuA_EQkbrEKt';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET_NAME = 'materi-bimbel';

const ManageMateri = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Overview State
  const [stats, setStats] = useState({ totalSiswa: 0, totalModul: 0, totalTugasPending: 0, storageUsed: '0 MB' });
  
  // Materi State
  const [materiList, setMateriList] = useState([]);
  const [data, setData] = useState({ title: '', link: '', subject: 'Umum' });

  // Tugas & Storage State
  const [pendingTasks, setPendingTasks] = useState([]);
  const [storageFiles, setStorageFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔥 PERBAIKAN UTAMA: Pengecekan Role Admin yang lebih longgar
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const userRole = localStorage.getItem('userRole');
      const role = localStorage.getItem('role');
      const teacherData = localStorage.getItem('teacherData');
      
      // DEBUG: Log semua key di localStorage
      console.log('🔍 [ManageMateri] Auth Check:', { isLoggedIn, userRole, role, teacherData });
      
      // Jika tidak ada data login sama sekali
      if (!isLoggedIn && !userRole && !role && !teacherData) {
        console.warn('❌ Tidak ada sesi login. Redirect ke home.');
        navigate('/');
        return;
      }
      
      // Cek berbagai kemungkinan role admin
      const isAdmin = 
        userRole === 'admin' || 
        role === 'admin' || 
        (teacherData && JSON.parse(teacherData)?.role === 'admin');
      
      if (isAdmin) {
        console.log('✅ Admin terverifikasi!');
        setIsAuthorized(true);
        fetchOverviewData();
        fetchMateriList();
        fetchPendingTasks();
        fetchStorageFiles();
      } else {
        console.warn('❌ Bukan Admin. Redirect ke dashboard.');
        alert('Akses ditolak! Hanya Admin yang bisa mengakses halaman ini.');
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
      
      const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });
      let totalSize = 0;
      if (files) files.forEach(f => totalSize += f.metadata?.size || 0);
      
      setStats({
        totalSiswa: siswaSnap.size,
        totalModul: modulSnap.size,
        totalTugasPending: tugasSnap.size,
        storageUsed: (totalSize / (1024 * 1024)).toFixed(2) + ' MB'
      });
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
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 100 });
    if (data) setStorageFiles(data);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "bimbel_modul"), {
        ...data,
        type: 'materi',
        createdAt: serverTimestamp(),
        author: localStorage.getItem('teacherName') || 'Admin'
      });
      alert("✅ Materi Berhasil Terbit!");
      setData({ title: '', link: '', subject: 'Umum' });
      fetchMateriList();
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const handleDeleteFile = async (fileName) => {
    if(!window.confirm(`Hapus permanen ${fileName}?`)) return;
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    if (error) alert("Gagal hapus: " + error.message);
    else { alert("File dihapus!"); fetchStorageFiles(); fetchOverviewData(); }
  };

  const handleSendReminder = (task) => {
    alert(`🔔 Reminder dikirim ke ${task.studentName} untuk tugas ${task.modulTitle}`);
  };

  const handleMarkAsDone = async (taskId) => {
    await updateDoc(doc(db, 'jawaban_tugas', taskId), { status: 'Done' });
    fetchPendingTasks();
  };

  if (checkingAuth) return <div style={{padding: 50, textAlign: 'center'}}>🔐 Memeriksa Akses Admin...</div>;
  if (!isAuthorized) return null;
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Panel Administrasi Materi & Tugas</h2>
        <p style={styles.subtitle}>Pemantauan menyeluruh untuk kelancaran operasional bimbel.</p>
      </div>

      {/* --- STATS CARDS --- */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}><Users size={24} color="#3b82f6"/><h3>{stats.totalSiswa}</h3><p>Siswa Aktif</p></div>
        <div style={styles.statCard}><BookOpen size={24} color="#10b981"/><h3>{stats.totalModul}</h3><p>Modul Materi</p></div>
        <div style={styles.statCard}><AlertCircle size={24} color="#f59e0b"/><h3>{stats.totalTugasPending}</h3><p>Tugas Menumpuk</p></div>
        <div style={styles.statCard}><HardDrive size={24} color="#8b5cf6"/><h3>{stats.storageUsed}</h3><p>Storage Terpakai</p></div>
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div style={styles.tabBar}>
        <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.tabActive : styles.tab}>📊 Ringkasan</button>
        <button onClick={() => setActiveTab('materi')} style={activeTab === 'materi' ? styles.tabActive : styles.tab}>📚 Materi</button>
        <button onClick={() => setActiveTab('tugas')} style={activeTab === 'tugas' ? styles.tabActive : styles.tab}>⏳ Tugas Menumpuk</button>
        <button onClick={() => setActiveTab('storage')} style={activeTab === 'storage' ? styles.tabActive : styles.tab}>🗄️ Storage</button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div style={styles.contentCard}>
        {activeTab === 'overview' && (
          <div>
            <h4>Aktivitas Terbaru</h4>
            {pendingTasks.slice(0, 5).map(task => <div key={task.id} style={styles.activityItem}><FileText size={16}/> {task.studentName} mengumpulkan {task.modulTitle}</div>)}
            {pendingTasks.length === 0 && <p>Tidak ada aktivitas terbaru.</p>}
          </div>
        )}

        {activeTab === 'materi' && (
          <div>
            <h4>Upload Materi Baru (Link)</h4>
            <form onSubmit={handleUpload} style={styles.form}>
              <input style={styles.input} placeholder="Judul Materi" value={data.title} onChange={e => setData({...data, title: e.target.value})} required />
              <input style={styles.input} placeholder="Link Google Drive/Video" value={data.link} onChange={e => setData({...data, link: e.target.value})} required />
              <button type="submit" style={styles.btn} disabled={loading}><Send size={18}/> {loading ? 'Menerbitkan...' : 'Terbitkan'}</button>
            </form>
            <h4 style={{marginTop: 30}}>Daftar Materi</h4>
            {materiList.map(m => <div key={m.id} style={styles.listItem}><a href={m.link} target="_blank" rel="noreferrer">{m.title}</a> <span style={styles.badge}>{m.subject}</span></div>)}
          </div>
        )}

        {activeTab === 'tugas' && (
          <div>
            <div style={styles.searchBox}><Search size={16}/><input placeholder="Cari siswa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            {pendingTasks.filter(t => t.studentName?.toLowerCase().includes(searchTerm.toLowerCase())).map(task => (
              <div key={task.id} style={styles.taskCard}>
                <div><strong>{task.studentName}</strong> <span style={styles.badge}>{task.studentClass}</span></div>
                <p>{task.modulTitle} - {task.fileName}</p>
                <div style={styles.actionGroup}>
                  <button onClick={() => window.open(task.fileUrl, '_blank')} style={styles.iconBtn}><Eye size={16}/> Lihat</button>
                  <button onClick={() => handleSendReminder(task)} style={styles.iconBtn}><Bell size={16}/> Remind</button>
                  <button onClick={() => handleMarkAsDone(task.id)} style={styles.iconBtn}><CheckCircle size={16}/> Tandai Selesai</button>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && <p>✅ Tidak ada tugas yang menumpuk!</p>}
          </div>
        )}

        {activeTab === 'storage' && (
          <div>
            <button onClick={fetchStorageFiles} style={styles.refreshBtn}><RefreshCw size={16}/> Refresh</button>
            <table style={styles.table}>
              <thead><tr><th>Nama File</th><th>Ukuran</th><th>Aksi</th></tr></thead>
              <tbody>
                {storageFiles.map(file => (
                  <tr key={file.id}>
                    <td>{file.name}</td>
                    <td>{file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) : '0'} KB</td>
                    <td>
                      <button onClick={() => handleDeleteFile(file.name)} style={styles.deleteBtn}><Trash2 size={14}/> Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '30px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 800, color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: 5 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 },
  statCard: { background: 'white', padding: 20, borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  tabBar: { display: 'flex', gap: 5, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 },
  tab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, color: '#64748b', borderRadius: 10 },
  tabActive: { padding: '10px 20px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600, borderRadius: 10 },
  contentCard: { background: 'white', padding: 25, borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  form: { display: 'flex', gap: 10, marginBottom: 20 },
  input: { flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 },
  btn: { background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 },
  listItem: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  badge: { background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  taskCard: { padding: 15, border: '1px solid #f1f5f9', borderRadius: 15, marginBottom: 10 },
  actionGroup: { display: 'flex', gap: 10, marginTop: 10 },
  iconBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 },
  deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 20 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 15px', borderRadius: 10, marginBottom: 20, border: '1px solid #e2e8f0' },
  refreshBtn: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 15px', borderRadius: 8, cursor: 'pointer', marginBottom: 15 },
  activityItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }
};

export default ManageMateri;