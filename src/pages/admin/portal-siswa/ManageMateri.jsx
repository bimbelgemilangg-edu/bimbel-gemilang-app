// src/pages/admin/portal-siswa/ManageMateri.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  collection, addDoc, query, where, getDocs, doc, 
  updateDoc, deleteDoc, serverTimestamp, orderBy, limit 
} from "firebase/firestore";
import { supabase } from '../../../services/uploadService';
import { 
  BookOpen, Send, Users, FileText, HardDrive, AlertCircle, 
  Trash2, Bell, Eye, RefreshCw, CheckCircle, Search, ArrowLeft,
  Layout, ChevronRight, Home, FolderOpen, Upload, Download,
  Hash, Tag, User, Calendar, Clock, Filter, X, Layers,
  Database, Server, Cloud, Zap, Shield, BarChart3,
  TrendingUp, Activity, PieChart, Globe, Link as LinkIcon,
  Copy, Edit3, Plus, Grid3x3, List, ChevronDown
} from 'lucide-react';

// ============================================================
// BUCKET NAME
// ============================================================
const BUCKET_NAME = 'materi-bimbel';

// ============================================================
// MAIN COMPONENT
// ============================================================
const ManageMateri = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [filterGuru, setFilterGuru] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  const [stats, setStats] = useState({ 
    totalSiswa: 0, 
    totalModul: 0, 
    totalTugasPending: 0, 
    storageUsed: '0 MB',
    totalFiles: 0,
    totalGuru: 0
  });
  const [materiList, setMateriList] = useState([]);
  const [filteredMateri, setFilteredMateri] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [storageFiles, setStorageFiles] = useState([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [availableMapel, setAvailableMapel] = useState([]);
  const [availableGuru, setAvailableGuru] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);

  // ===== TOAST =====
  const showAlert = (msg, isError = false) => {
    setAlertMsg({ text: msg, isError });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // ===== RESPONSIVE =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== AUTH CHECK =====
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const userRole = localStorage.getItem('userRole');
      const role = localStorage.getItem('role');
      const teacherData = localStorage.getItem('teacherData');
      
      const isAdmin = userRole === 'admin' || role === 'admin' || 
                      (teacherData && JSON.parse(teacherData)?.role === 'admin');
      
      if (isAdmin) {
        setIsAuthorized(true);
        fetchAllData();
      } else {
        navigate('/admin');
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  // ===== FETCH ALL DATA =====
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverviewData(),
        fetchMateriList(),
        fetchPendingTasks(),
        fetchStorageFiles(),
        fetchFilterOptions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const fetchOverviewData = async () => {
    try {
      const siswaSnap = await getDocs(collection(db, 'students'));
      const modulSnap = await getDocs(collection(db, 'bimbel_modul'));
      const tugasSnap = await getDocs(query(collection(db, 'jawaban_tugas'), where('status', '==', 'Pending')));
      const guruSnap = await getDocs(collection(db, 'teachers'));
      
      // Hitung storage
      const { data: files } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });
      let totalSize = 0;
      if (files) files.forEach(f => totalSize += f.metadata?.size || 0);
      
      setStats({
        totalSiswa: siswaSnap.size,
        totalModul: modulSnap.size,
        totalTugasPending: tugasSnap.size,
        totalFiles: files?.length || 0,
        totalGuru: guruSnap.size,
        storageUsed: totalSize > 0 ? (totalSize / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB'
      });
    } catch (err) { console.error(err); }
  };

  const fetchMateriList = async () => {
    const snap = await getDocs(query(collection(db, 'bimbel_modul'), orderBy('updatedAt', 'desc')));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setMateriList(data);
    setFilteredMateri(data);
  };

  const fetchPendingTasks = async () => {
    const snap = await getDocs(query(collection(db, 'jawaban_tugas'), where('status', '==', 'Pending')));
    setPendingTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchStorageFiles = async () => {
    setStorageLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });
      if (error) throw error;
      setStorageFiles(data || []);
    } catch (error) {
      console.error('Error fetching storage:', error);
    }
    setStorageLoading(false);
    setRefreshing(false);
  };

  const fetchFilterOptions = async () => {
    try {
      // Ambil mapel dari modul
      const modulSnap = await getDocs(collection(db, 'bimbel_modul'));
      const mapelSet = new Set();
      modulSnap.forEach(doc => {
        const mapel = doc.data().subject;
        if (mapel) mapelSet.add(mapel);
      });
      setAvailableMapel(['Semua', ...Array.from(mapelSet).sort()]);

      // Ambil guru dari modul
      const guruSet = new Set();
      modulSnap.forEach(doc => {
        const guru = doc.data().guruName || doc.data().authorName || doc.data().createdBy;
        if (guru) guruSet.add(guru);
      });
      setAvailableGuru(['Semua', ...Array.from(guruSet).sort()]);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  // ===== FILTER MATERI =====
  useEffect(() => {
    let filtered = materiList;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.title?.toLowerCase().includes(term) ||
        m.subject?.toLowerCase().includes(term) ||
        m.guruId?.toLowerCase().includes(term) ||
        m.guruName?.toLowerCase().includes(term)
      );
    }
    
    if (filterMapel !== 'Semua') {
      filtered = filtered.filter(m => m.subject === filterMapel);
    }
    
    if (filterGuru !== 'Semua') {
      filtered = filtered.filter(m => 
        m.guruName === filterGuru || 
        m.authorName === filterGuru || 
        m.createdBy === filterGuru
      );
    }
    
    if (filterStatus !== 'Semua') {
      filtered = filtered.filter(m => m.status === filterStatus);
    }
    
    setFilteredMateri(filtered);
  }, [searchTerm, filterMapel, filterGuru, filterStatus, materiList]);

  // ===== HANDLERS =====
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // ===== HAPUS MODUL DARI FIRESTORE & SUPABASE =====
  const handleDeleteModul = async (id, modul) => {
    if (!window.confirm(`⚠️ Hapus modul "${modul.title || 'Untitled'}"?\n\nSemua file terkait juga akan dihapus dari Supabase!`)) return;
    
    setDeletingId(id);
    try {
      // 1. Kumpulkan semua filePath dari sections
      const filePaths = [];
      if (modul.blocks) {
        modul.blocks.forEach(block => {
          if (block.filePath) filePaths.push(block.filePath);
        });
      }
      
      // 2. Hapus cover image jika ada
      if (modul.coverFilePath) {
        filePaths.push(modul.coverFilePath);
      }
      
      // 3. Hapus file dari Supabase
      if (filePaths.length > 0) {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths);
        if (error) {
          console.warn('Gagal hapus beberapa file:', error);
        } else {
          console.log(`✅ ${filePaths.length} file dihapus dari Supabase`);
        }
      }
      
      // 4. Hapus data dari Firestore
      await deleteDoc(doc(db, 'bimbel_modul', id));
      
      showAlert(`✅ Modul "${modul.title}" berhasil dihapus!`);
      fetchAllData();
    } catch (error) {
      showAlert('❌ Gagal menghapus modul: ' + error.message, true);
    }
    setDeletingId(null);
  };

  // ===== HAPUS FILE DARI SUPABASE =====
  const handleDeleteFile = async (fileName, filePath) => {
    if (!window.confirm(`⚠️ Hapus permanen file "${fileName}"?`)) return;
    
    setDeletingFile(fileName);
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath || fileName]);
      if (error) throw error;
      showAlert(`🗑️ File "${fileName}" berhasil dihapus!`);
      fetchStorageFiles();
      fetchOverviewData();
    } catch (error) {
      showAlert('❌ Gagal hapus file: ' + error.message, true);
    }
    setDeletingFile(null);
  };

  // ===== TANDAI TUGAS SELESAI =====
  const handleMarkAsDone = async (taskId) => {
    try {
      await updateDoc(doc(db, 'jawaban_tugas', taskId), { status: 'Done' });
      showAlert('✅ Tugas ditandai selesai!');
      fetchPendingTasks();
    } catch (error) {
      showAlert('❌ Gagal update: ' + error.message, true);
    }
  };

  // ===== GET TYPE INFO =====
  const getTypeInfo = (item) => {
    if (item.type === 'kuis_mandiri') return { 
      label: 'Kuis', 
      icon: <BookOpen size={12} />, 
      color: '#f59e0b', 
      bg: '#fef3c7' 
    };
    if (item.type === 'assignment') return { 
      label: 'Tugas', 
      icon: <Send size={12} />, 
      color: '#ef4444', 
      bg: '#fee2e2' 
    };
    if (item.blocks?.length > 0) return { 
      label: 'Modul', 
      icon: <BookOpen size={12} />, 
      color: '#3b82f6', 
      bg: '#dbeafe' 
    };
    return { 
      label: 'Materi', 
      icon: <FileText size={12} />, 
      color: '#64748b', 
      bg: '#f1f5f9' 
    };
  };

  const getStatusBadge = (status) => {
    const b = {
      'aktif': { label: '🟢 Aktif', color: '#10b981', bg: '#dcfce7' },
      'terjadwal': { label: '🟡 Terjadwal', color: '#f59e0b', bg: '#fef3c7' },
      'arsip': { label: '📦 Arsip', color: '#64748b', bg: '#f1f5f9' }
    };
    return b[status] || b['aktif'];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // ===== RENDER: SKELETON =====
  const SkeletonCard = () => (
    <div style={skeletonStyles.card}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <div style={skeletonStyles.badge}></div>
        <div style={{...skeletonStyles.badge, width: 60}}></div>
      </div>
      <div style={{...skeletonStyles.line, width: '70%', height: 18}}></div>
      <div style={{...skeletonStyles.line, width: '40%', height: 14, marginTop: 4}}></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div style={{...skeletonStyles.line, flex: 1, height: 10}}></div>
        <div style={{...skeletonStyles.line, flex: 1, height: 10}}></div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        <div style={{ flex: 1, height: 30, background: '#f1f5f9', borderRadius: 6 }}></div>
        <div style={{ flex: 1, height: 30, background: '#f1f5f9', borderRadius: 6 }}></div>
        <div style={{ width: 30, height: 30, background: '#f1f5f9', borderRadius: 6 }}></div>
      </div>
    </div>
  );

  // ===== RENDER: MODUL CARD =====
  const renderModulCard = (item) => {
    const typeInfo = getTypeInfo(item);
    const sb = getStatusBadge(item.status);
    const isDeleting = deletingId === item.id;

    return (
      <div 
        key={item.id} 
        style={{
          ...cardStyles.card,
          borderTop: `4px solid ${typeInfo.color}`,
          opacity: item.status === 'arsip' ? 0.7 : 1
        }}
      >
        {/* Badges */}
        <div style={cardStyles.badges}>
          <span style={{...cardStyles.badge, background: sb.bg, color: sb.color }}>
            {sb.label}
          </span>
          <span style={{...cardStyles.badge, background: typeInfo.bg, color: typeInfo.color }}>
            {typeInfo.icon} {typeInfo.label}
          </span>
          {item.subject && (
            <span style={{...cardStyles.badge, background: '#f1f5f9', color: '#64748b' }}>
              {item.subject}
            </span>
          )}
          {item.guruId && (
            <span style={{...cardStyles.badge, background: '#eef2ff', color: '#3b82f6', fontSize: 7 }}>
              <Hash size={8} /> {item.guruId}
            </span>
          )}
          {item.kodeMapel && (
            <span style={{...cardStyles.badge, background: '#ede9fe', color: '#8b5cf6', fontSize: 7 }}>
              <Tag size={8} /> {item.kodeMapel}
            </span>
          )}
          {item.selectedStudents && item.selectedStudents.length > 0 && (
            <span style={{...cardStyles.badge, background: '#fce7f3', color: '#be185d' }}>
              <Users size={10} /> {item.selectedStudents.length} siswa
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={cardStyles.title}>
          {item.title || "Untitled"}
          <span style={cardStyles.idTag}>#{item.id?.slice(-6)}</span>
        </h3>

        {/* Description */}
        {item.description && (
          <p style={cardStyles.desc}>{item.description}</p>
        )}

        {/* Meta */}
        <div style={cardStyles.meta}>
          <span><User size={10} /> {item.guruName || item.authorName || item.createdBy || 'Admin'}</span>
          <span><Calendar size={10} /> {formatDate(item.updatedAt || item.createdAt)}</span>
          <span><Layers size={10} /> {(item.blocks || []).length} konten</span>
          {item.totalKonten > 0 && <span>📄 {item.totalKonten}</span>}
        </div>

        {/* Actions */}
        <div style={cardStyles.actions}>
          <button 
            onClick={() => navigate(`/guru/modul/materi?edit=${item.id}`)}
            style={cardStyles.btnEdit}
          >
            <Edit3 size={12} /> Edit
          </button>
          <button 
            onClick={() => window.open(`/siswa/materi/${item.id}`, '_blank')}
            style={cardStyles.btnPreview}
          >
            <Eye size={12} /> Preview
          </button>
          <button 
            onClick={() => handleDeleteModul(item.id, item)}
            disabled={isDeleting}
            style={cardStyles.btnDelete}
          >
            {isDeleting ? <RefreshCw size={12} className="spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>
    );
  };

  const cardStyles = {
    card: {
      background: 'white', borderRadius: 14, overflow: 'hidden',
      padding: 16, border: '1px solid #f1f5f9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      height: '100%', display: 'flex', flexDirection: 'column'
    },
    badges: { display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' },
    badge: {
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 10px', borderRadius: 12, fontSize: 9,
      fontWeight: 700, whiteSpace: 'nowrap'
    },
    title: {
      fontSize: 14, fontWeight: 700, color: '#1e293b',
      margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6
    },
    idTag: { fontSize: 8, color: '#94a3b8', fontFamily: 'monospace', fontWeight: 400 },
    desc: {
      fontSize: 12, color: '#64748b', margin: '4px 0 10px',
      display: '-webkit-box', WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical', overflow: 'hidden'
    },
    meta: {
      display: 'flex', gap: 10, fontSize: 10,
      color: '#94a3b8', marginBottom: 12, flexWrap: 'wrap',
      marginTop: 'auto'
    },
    actions: {
      display: 'flex', gap: 6, marginTop: 10,
      paddingTop: 10, borderTop: '1px solid #f1f5f9'
    },
    btnEdit: {
      flex: 1, background: '#fef3c7', color: '#b45309',
      border: 'none', padding: '6px 0', borderRadius: 8,
      cursor: 'pointer', fontWeight: 600, fontSize: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3
    },
    btnPreview: {
      flex: 1, background: '#1e293b', color: 'white',
      border: 'none', padding: '6px 0', borderRadius: 8,
      cursor: 'pointer', fontWeight: 600, fontSize: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3
    },
    btnDelete: {
      background: '#fee2e2', color: '#ef4444',
      border: 'none', padding: '6px 12px', borderRadius: 8,
      cursor: 'pointer', fontWeight: 600, fontSize: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }
  };

  const skeletonStyles = {
    card: {
      background: 'white', borderRadius: 14,
      border: '1px solid #f1f5f9', padding: 16,
      overflow: 'hidden', height: '100%'
    },
    badge: { width: 50, height: 18, background: '#f1f5f9', borderRadius: 12 },
    line: { background: '#f1f5f9', borderRadius: 6 }
  };

  // ===== RENDER: STORAGE TABLE =====
  const renderStorageTable = () => (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyles.table}>
        <thead>
          <tr style={tableStyles.thr}>
            <th style={tableStyles.th}>Nama File</th>
            <th style={tableStyles.th}>Path</th>
            <th style={tableStyles.th}>Ukuran</th>
            <th style={tableStyles.th}>Dibuat</th>
            <th style={tableStyles.th}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {storageFiles.map(file => (
            <tr key={file.id || file.name} style={tableStyles.tr}>
              <td style={tableStyles.td}>
                <FileText size={14} color="#3b82f6" style={{ marginRight: 6 }} />
                {file.name}
              </td>
              <td style={tableStyles.td}>
                <span style={tableStyles.pathText}>{file.name?.split('/').slice(0, -1).join('/') || 'root'}</span>
              </td>
              <td style={tableStyles.td}>{formatFileSize(file.metadata?.size || 0)}</td>
              <td style={tableStyles.td}>{file.created_at ? new Date(file.created_at).toLocaleDateString('id-ID') : '-'}</td>
              <td style={tableStyles.td}>
                <button 
                  onClick={() => handleDeleteFile(file.name, file.name)} 
                  disabled={deletingFile === file.name}
                  style={tableStyles.deleteBtn}
                >
                  {deletingFile === file.name ? <RefreshCw size={12} className="spin" /> : <Trash2 size={14} />}
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const tableStyles = {
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
    thr: { background: '#f8fafc', textAlign: 'left' },
    th: { 
      padding: '10px 12px', fontSize: 10, color: '#64748b', 
      fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' 
    },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '10px 12px', fontSize: 12, verticalAlign: 'middle' },
    pathText: { fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' },
    deleteBtn: {
      background: '#fee2e2', color: '#ef4444', border: 'none',
      padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
      fontSize: 10, fontWeight: 600, display: 'inline-flex',
      alignItems: 'center', gap: 4
    }
  };

  // ============================================================
  // RENDER: MAIN
  // ============================================================
  if (checkingAuth) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p>🔐 Memeriksa Akses Admin...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* TOAST */}
        {alertMsg && (
          <div style={{...styles.toast, background: alertMsg.isError ? '#ef4444' : '#1e293b'}}>
            {alertMsg.text}
          </div>
        )}

        {/* BREADCRUMB */}
        <div style={styles.breadcrumb}>
          <button onClick={() => navigate('/admin/portal')} style={styles.backButton}>
            <ArrowLeft size={16} /> Kembali ke Portal
          </button>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#94a3b8'}}>Portal Siswa</span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Kelola Materi</span>
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title(isMobile)}>
              <BookOpen size={24} color="#3b82f6" /> Manajemen Materi & Modul
            </h2>
            <p style={styles.subtitle}>
              Pantau dan kelola semua materi dari seluruh guru • 
              <span style={{color: '#10b981', fontWeight: 600}}> {stats.totalModul} modul</span>
            </p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={styles.viewToggle}>
              {viewMode === 'grid' ? <List size={16} /> : <Grid3x3 size={16} />}
            </button>
            <button onClick={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> {!isMobile && 'Refresh'}
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div style={styles.statsGrid(isMobile)}>
          <div style={styles.statCard}>
            <Users size={20} color="#3b82f6" />
            <div><h3>{stats.totalSiswa}</h3><p>Siswa Aktif</p></div>
          </div>
          <div style={styles.statCard}>
            <BookOpen size={20} color="#10b981" />
            <div><h3>{stats.totalModul}</h3><p>Total Modul</p></div>
          </div>
          <div style={styles.statCard}>
            <AlertCircle size={20} color="#f59e0b" />
            <div><h3>{stats.totalTugasPending}</h3><p>Tugas Pending</p></div>
          </div>
          <div style={styles.statCard}>
            <HardDrive size={20} color="#8b5cf6" />
            <div><h3>{stats.storageUsed}</h3><p>Storage</p></div>
          </div>
          <div style={styles.statCard}>
            <Server size={20} color="#06b6d4" />
            <div><h3>{stats.totalFiles}</h3><p>File di Storage</p></div>
          </div>
          <div style={styles.statCard}>
            <User size={20} color="#ec4899" />
            <div><h3>{stats.totalGuru}</h3><p>Total Guru</p></div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={styles.tabBar(isMobile)}>
          <button onClick={() => setActiveTab('overview')} style={styles.tab(activeTab === 'overview')}>
            📊 Ringkasan
          </button>
          <button onClick={() => setActiveTab('materi')} style={styles.tab(activeTab === 'materi')}>
            📚 Modul
          </button>
          <button onClick={() => setActiveTab('tugas')} style={styles.tab(activeTab === 'tugas')}>
            ⏳ Tugas ({stats.totalTugasPending})
          </button>
          <button onClick={() => setActiveTab('storage')} style={styles.tab(activeTab === 'storage')}>
            🗄️ Storage ({stats.totalFiles})
          </button>
        </div>

        {/* CONTENT */}
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
              
              {/* Modul terbaru */}
              <h4 style={{...styles.sectionTitle, marginTop: 30}}>📚 Modul Terbaru</h4>
              {materiList.slice(0, 5).map(m => (
                <div key={m.id} style={styles.listItem}>
                  <div style={{flex: 1}}>
                    <span style={{fontWeight: 'bold'}}>{m.title}</span>
                    <div style={{fontSize: 11, color: '#94a3b8'}}>
                      {m.subject} • {m.guruName || m.authorName || 'Admin'}
                      {m.guruId && <span style={styles.idTag}> <Hash size={8} /> {m.guruId}</span>}
                    </div>
                  </div>
                  <span style={styles.statusBadgeSmall(m.status)}>
                    {m.status || 'aktif'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB: MATERI */}
          {activeTab === 'materi' && (
            <div>
              {/* Filter Bar */}
              <div style={styles.filterBar}>
                <div style={styles.searchBox}>
                  <Search size={16} color="#94a3b8" />
                  <input 
                    placeholder="Cari judul, mapel, atau ID..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    style={styles.searchInput} 
                  />
                  {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>}
                </div>
                <div style={styles.filterGroup}>
                  <select value={filterMapel} onChange={e => setFilterMapel(e.target.value)} style={styles.filterSelect}>
                    <option value="Semua">📖 Semua Mapel</option>
                    {availableMapel.filter(m => m !== 'Semua').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select value={filterGuru} onChange={e => setFilterGuru(e.target.value)} style={styles.filterSelect}>
                    <option value="Semua">👨‍🏫 Semua Guru</option>
                    {availableGuru.filter(g => g !== 'Semua').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.filterSelect}>
                    <option value="Semua">📋 Semua Status</option>
                    <option value="aktif">🟢 Aktif</option>
                    <option value="terjadwal">🟡 Terjadwal</option>
                    <option value="arsip">📦 Arsip</option>
                  </select>
                </div>
              </div>

              {/* Hasil Filter */}
              <div style={{fontSize: 11, color: '#94a3b8', marginBottom: 12}}>
                Menampilkan {filteredMateri.length} dari {materiList.length} modul
              </div>

              {/* Grid / List */}
              {loading ? (
                <div style={styles.gridContainer}>
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : filteredMateri.length === 0 ? (
                <div style={styles.emptyState}>
                  <FolderOpen size={48} color="#94a3b8" />
                  <p>{searchTerm ? 'Tidak ada hasil pencarian.' : 'Belum ada modul.'}</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div style={styles.gridContainer}>
                  {filteredMateri.map(item => renderModulCard(item))}
                </div>
              ) : (
                <div style={styles.listContainer}>
                  {filteredMateri.map(item => renderModulCard(item))}
                </div>
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
                      {task.studentNim && <span style={styles.nimBadge}>#{task.studentNim}</span>}
                    </div>
                    <p style={styles.taskInfo}>{task.modulTitle} • {task.fileName}</p>
                    <div style={styles.actionGroup(isMobile)}>
                      <button onClick={() => window.open(task.fileUrl, '_blank')} style={styles.actionBtn}>
                        <Eye size={14} /> Lihat
                      </button>
                      <button onClick={() => handleMarkAsDone(task.id)} style={{...styles.actionBtn, background: '#dcfce7', color: '#166534'}}>
                        <CheckCircle size={14} /> Selesai
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: STORAGE */}
          {activeTab === 'storage' && (
            <div>
              <div style={styles.storageHeader}>
                <h4 style={{margin: 0}}>🗄️ File di Supabase Storage</h4>
                <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                  <span style={{fontSize: 11, color: '#94a3b8'}}>
                    {storageFiles.length} file • {stats.storageUsed}
                  </span>
                  <button onClick={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
                    <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
                  </button>
                </div>
              </div>
              
              {storageLoading ? (
                <div style={styles.emptyState}>Memuat data storage...</div>
              ) : storageFiles.length === 0 ? (
                <div style={styles.emptyState}>
                  <Upload size={40} color="#94a3b8" />
                  <p>Bucket kosong. Belum ada file yang diupload.</p>
                </div>
              ) : (
                renderStorageTable()
              )}
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .spin { animation: spin 0.8s linear infinite; }
        `}</style>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '250px', 
    padding: m ? '15px' : '30px', 
    width: '100%', 
    boxSizing: 'border-box', 
    overflowX: 'hidden', 
    transition: '0.3s' 
  }),
  loadingScreen: { 
    display: 'flex', flexDirection: 'column', alignItems: 'center', 
    justifyContent: 'center', height: '100vh', gap: 16,
    color: '#64748b', fontWeight: 'bold' 
  },
  spinner: {
    width: 40, height: 40, border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  toast: { 
    position: 'fixed', top: 20, right: 20, zIndex: 9999, 
    padding: '12px 20px', borderRadius: 12, 
    fontWeight: 'bold', fontSize: 14, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
    color: 'white' 
  },
  breadcrumb: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 20, flexWrap: 'wrap', gap: 10 
  },
  backButton: { 
    background: 'white', border: '1px solid #e2e8f0', 
    padding: '8px 14px', borderRadius: 8, cursor: 'pointer', 
    fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, 
    color: '#64748b' 
  },
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  header: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 20, flexWrap: 'wrap', gap: 10 
  },
  title: (m) => ({ 
    margin: 0, fontSize: m ? 20 : 24, fontWeight: 800, color: '#1e293b',
    display: 'flex', alignItems: 'center', gap: 8 
  }),
  subtitle: { color: '#64748b', marginTop: 4 },
  headerActions: { display: 'flex', gap: 8 },
  viewToggle: {
    background: '#f1f5f9', border: 'none', padding: '8px 10px',
    borderRadius: 8, cursor: 'pointer', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  refreshBtn: {
    background: 'white', border: '1px solid #e2e8f0',
    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
    fontSize: 12, fontWeight: 600, color: '#64748b',
    display: 'flex', alignItems: 'center', gap: 4
  },
  statsGrid: (m) => ({ 
    display: 'grid', gridTemplateColumns: m ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)', 
    gap: 12, marginBottom: 20 
  }),
  statCard: { 
    background: 'white', padding: '14px 16px', borderRadius: 12, 
    display: 'flex', alignItems: 'center', gap: 12,
    border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  tabBar: (m) => ({ 
    display: 'flex', gap: 4, marginBottom: 16, 
    background: 'white', padding: '6px', borderRadius: 12,
    border: '1px solid #f1f5f9', overflowX: 'auto' 
  }),
  tab: (active) => ({ 
    padding: '8px 16px', border: 'none', 
    background: active ? '#3b82f6' : 'transparent', 
    color: active ? 'white' : '#64748b', 
    cursor: 'pointer', fontWeight: 600, borderRadius: 8, 
    fontSize: 12, whiteSpace: 'nowrap' 
  }),
  contentCard: (m) => ({ 
    background: 'white', padding: m ? 16 : 24, 
    borderRadius: 16, border: '1px solid #f1f5f9' 
  }),
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginTop: 0 },
  emptyState: { textAlign: 'center', padding: 40, color: '#94a3b8' },
  gridContainer: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
    gap: 16 
  },
  listContainer: { display: 'flex', flexDirection: 'column', gap: 12 },
  filterBar: { 
    display: 'flex', gap: 10, marginBottom: 16, 
    flexWrap: 'wrap', alignItems: 'center' 
  },
  searchBox: { 
    flex: 2, display: 'flex', alignItems: 'center', gap: 8, 
    background: '#f8fafc', padding: '8px 14px', borderRadius: 10, 
    border: '1px solid #e2e8f0', minWidth: 200 
  },
  searchInput: { 
    border: 'none', outline: 'none', width: '100%', 
    fontSize: 13, background: 'transparent' 
  },
  clearBtn: { 
    background: 'none', border: 'none', color: '#94a3b8', 
    cursor: 'pointer', fontSize: 14 
  },
  filterGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterSelect: { 
    padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', 
    fontSize: 12, background: 'white', cursor: 'pointer', outline: 'none' 
  },
  idTag: { fontSize: 8, color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 2 },
  statusBadgeSmall: (s) => ({
    fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
    background: s === 'aktif' ? '#dcfce7' : s === 'terjadwal' ? '#fef3c7' : '#f1f5f9',
    color: s === 'aktif' ? '#166534' : s === 'terjadwal' ? '#b45309' : '#64748b'
  }),
  listItem: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid #f1f5f9', gap: 10, flexWrap: 'wrap'
  },
  taskCard: (m) => ({ 
    padding: 14, border: '1px solid #f1f5f9', borderRadius: 12, marginBottom: 10 
  }),
  taskHeader: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 4, flexWrap: 'wrap', gap: 5 
  },
  classBadge: { 
    background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', 
    borderRadius: 10, fontSize: 10, fontWeight: 600 
  },
  nimBadge: { 
    background: '#f1f5f9', color: '#64748b', padding: '2px 8px', 
    borderRadius: 10, fontSize: 9, fontWeight: 600, fontFamily: 'monospace' 
  },
  taskInfo: { margin: '6px 0', fontSize: 12, color: '#64748b' },
  actionGroup: (m) => ({ display: 'flex', gap: 8, flexWrap: m ? 'wrap' : 'nowrap' }),
  actionBtn: { 
    background: '#f1f5f9', border: 'none', padding: '6px 12px', 
    borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, 
    display: 'flex', alignItems: 'center', gap: 4, color: '#1e293b' 
  },
  storageHeader: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 12, flexWrap: 'wrap', gap: 10 
  }
};

export default ManageMateri;