// src/pages/teacher/modul/ModulManager.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, deleteDoc, query, orderBy, 
  limit, startAfter, where, onSnapshot 
} from "firebase/firestore";
import { 
  BookOpen, Plus, Search, FileText, HelpCircle, Trash2, 
  Edit3, Eye, AlertCircle, Users, Calendar, Target, Layers, 
  Send, Filter, X, Clock, ChevronLeft, ChevronRight,
  Hash, Tag, User, GraduationCap, Sparkles, Zap,
  Archive, CheckCircle, CalendarDays, Award, Star,
  Grid, List, RefreshCw, Loader2, ChevronDown,
  Home, Layout, FolderOpen, File, Video, Clipboard,
  BarChart3, TrendingUp, Activity, PieChart,
  Rocket, Gift, BookMarked, FileQuestion
} from 'lucide-react';

const ModulManager = () => {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('semua');
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterMapel, setFilterMapel] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterGuru, setFilterGuru] = useState("saya");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [viewMode, setViewMode] = useState('grid');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [guruData, setGuruData] = useState(null);
  const [guruId, setGuruId] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const COLLECTION_NAME = "bimbel_modul";
  const PAGE_SIZE = 12;

  // ===== TOAST =====
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ===== RESPONSIVE =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== AMBIL DATA GURU =====
  useEffect(() => {
    const getGuru = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
        const teacherName = saved.nama || '';
        const teacherId = saved.guruId || saved.id || '';
        
        setGuruId(teacherId);
        
        if (teacherName) {
          const q = query(collection(db, "teachers"), where("nama", "==", teacherName));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setGuruData(snap.docs[0].data());
          }
        }
      } catch (e) {
        console.error("Error getting guru:", e);
      }
    };
    getGuru();
  }, []);

  // ===== FETCH DATA =====
  const fetchFilterOptions = useCallback(async () => {
    try {
      // Kelas dari siswa
      const siswaSnap = await getDocs(collection(db, "students"));
      const kelasSet = new Set();
      siswaSnap.forEach(doc => {
        const kelas = doc.data().kelasSekolah;
        if (kelas) kelasSet.add(kelas);
      });
      setAvailableClasses(['Semua', ...Array.from(kelasSet).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      })]);

      // Mapel dari modul
      const modulSnap = await getDocs(collection(db, COLLECTION_NAME));
      const mapelSet = new Set();
      modulSnap.forEach(doc => {
        const mapel = doc.data().subject;
        if (mapel && mapel !== "Tugas") mapelSet.add(mapel);
      });
      setAvailableSubjects(['Semua', ...Array.from(mapelSet).sort()]);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  const fetchItems = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setLastDoc(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let qConstraints = [orderBy("updatedAt", "desc")];
      
      // 🔥 FILTER BERDASARKAN GURU ID
      if (filterGuru === 'saya' && guruId) {
        qConstraints.push(where("guruId", "==", guruId));
      }
      
      if (!isLoadMore && lastDoc) qConstraints.push(startAfter(lastDoc));
      qConstraints.push(limit(PAGE_SIZE));
      
      const q = query(collection(db, COLLECTION_NAME), ...qConstraints);
      const snapshot = await getDocs(q);
      const newItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (isLoadMore) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching items:", error);
      // Fallback: ambil semua
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(allItems);
      setHasMore(false);
    }
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, [lastDoc, filterGuru, guruId]);

  // ===== REAL-TIME LISTENER =====
  useEffect(() => {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("updatedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(data);
      setLoading(false);
    }, (error) => {
      console.error("Real-time error:", error);
      fetchItems();
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // ===== HANDLERS =====
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ Hapus permanen? Data tidak dapat dikembalikan.")) return;
    
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      showToast('✅ Modul berhasil dihapus!');
    } catch (error) {
      showToast('❌ Gagal menghapus: ' + error.message, 'error');
    }
    setDeletingId(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const getStatusBadge = (status) => {
    const b = {
      'aktif': { label: '🟢 Aktif', color: '#10b981', bg: '#dcfce7' },
      'terjadwal': { label: '🟡 Terjadwal', color: '#f59e0b', bg: '#fef3c7' },
      'arsip': { label: '📦 Arsip', color: '#64748b', bg: '#f1f5f9' }
    };
    return b[status] || b['aktif'];
  };

  const getTypeInfo = (item) => {
    // 🔥 CEK APAKAH ADA QUIZ DI DALAM MODUL
    const hasQuiz = item.blocks?.some(b => b.type === 'quiz' && b.quizId);
    const hasQuizData = item.quizData?.length > 0;
    
    if (item.type === 'kuis_mandiri' || hasQuizData) {
      return { 
        label: 'Kuis', 
        icon: <FileQuestion size={12} />, 
        color: '#f59e0b', 
        bg: '#fef3c7',
        emoji: '❓',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
      };
    }
    if (item.type === 'assignment') {
      return { 
        label: 'Tugas', 
        icon: <Send size={12} />, 
        color: '#ef4444', 
        bg: '#fee2e2',
        emoji: '📝',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
      };
    }
    if (item.blocks?.length > 0) {
      return { 
        label: 'Modul', 
        icon: <BookOpen size={12} />, 
        color: '#3b82f6', 
        bg: '#dbeafe',
        emoji: '📚',
        gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
      };
    }
    return { 
      label: 'Materi', 
      icon: <FileText size={12} />, 
      color: '#64748b', 
      bg: '#f1f5f9',
      emoji: '📄',
      gradient: 'linear-gradient(135deg, #64748b, #475569)'
    };
  };

  // ============================================================
  // 🔥 FILTERED ITEMS - USE MEMO
  // ============================================================
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Filter berdasarkan guru (jika tidak pakai query)
    if (filterGuru === 'saya' && guruId) {
      filtered = filtered.filter(item => 
        item.guruId === guruId || item.createdBy === guruData?.nama
      );
    }
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.title || "").toLowerCase().includes(term) ||
        (item.subject || "").toLowerCase().includes(term) ||
        (item.kodeMapel || "").toLowerCase().includes(term) ||
        (item.guruId || "").toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term)
      );
    }
    
    // Tab filter
    if (activeTab === 'modul') {
      filtered = filtered.filter(item => 
        !item.type || (item.blocks?.length > 0 && item.type !== 'kuis_mandiri' && item.type !== 'assignment')
      );
    } else if (activeTab === 'tugas') {
      filtered = filtered.filter(item => item.type === 'assignment');
    } else if (activeTab === 'kuis') {
      filtered = filtered.filter(item => 
        item.type === 'kuis_mandiri' || item.quizData?.length > 0 || item.blocks?.some(b => b.type === 'quiz' && b.quizId)
      );
    }
    
    // Kelas
    if (filterKelas !== "Semua") {
      filtered = filtered.filter(item => {
        const targetKelas = item.targetKelas || "Semua";
        return targetKelas === filterKelas || targetKelas === "Semua";
      });
    }
    
    // Mapel
    if (filterMapel !== "Semua") {
      filtered = filtered.filter(item => (item.subject || "Umum") === filterMapel);
    }
    
    // Status
    if (filterStatus !== "Semua") {
      filtered = filtered.filter(item => 
        item.status === filterStatus || (!item.status && filterStatus === "aktif")
      );
    }
    
    return filtered;
  }, [items, searchTerm, activeTab, filterKelas, filterMapel, filterStatus, filterGuru, guruId, guruData]);

  const hasActiveFilters = filterKelas !== "Semua" || filterMapel !== "Semua" || 
                          filterStatus !== "Semua" || filterGuru === 'saya' || searchTerm;

  const clearFilters = () => {
    setFilterKelas("Semua");
    setFilterMapel("Semua");
    setFilterStatus("Semua");
    setFilterGuru("semua");
    setSearchTerm("");
    setActiveTab('semua');
  };

  const stats = useMemo(() => ({
    total: items.length,
    modul: items.filter(i => !i.type || (i.blocks?.length > 0 && i.type !== 'kuis_mandiri' && i.type !== 'assignment')).length,
    tugas: items.filter(i => i.type === 'assignment').length,
    kuis: items.filter(i => i.type === 'kuis_mandiri' || i.quizData?.length > 0 || i.blocks?.some(b => b.type === 'quiz' && b.quizId)).length,
    milikSaya: items.filter(i => i.guruId === guruId || i.createdBy === guruData?.nama).length,
  }), [items, guruId, guruData]);

  // ============================================================
  // SKELETON LOADING
  // ============================================================
  const SkeletonCard = () => (
    <div style={skeletonStyles.card}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <div style={skeletonStyles.badge}></div>
        <div style={{...skeletonStyles.badge, width: 60}}></div>
        <div style={{...skeletonStyles.badge, width: 40}}></div>
      </div>
      <div style={{...skeletonStyles.line, width: '75%', height: 18}}></div>
      <div style={{...skeletonStyles.line, width: '50%', height: 14, marginTop: 4}}></div>
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

  const skeletonStyles = {
    card: {
      background: 'white', borderRadius: 14,
      border: '1px solid #f1f5f9', padding: 16,
      overflow: 'hidden', height: '100%'
    },
    badge: { width: 50, height: 18, background: '#f1f5f9', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' },
    line: { background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }
  };

  // ============================================================
  // RENDER MAIN
  // ============================================================
  if (loading && items.length === 0) {
    return (
      <div style={styles.container}>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#e2e8f0' }}></div>
            <div>
              <div style={{ width: 180, height: 24, background: '#e2e8f0', borderRadius: 6, marginBottom: 4 }}></div>
              <div style={{ width: 120, height: 14, background: '#e2e8f0', borderRadius: 4 }}></div>
            </div>
          </div>
          <div style={{ width: 140, height: 40, background: '#e2e8f0', borderRadius: 10 }}></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ width: 100, height: 36, background: '#e2e8f0', borderRadius: 20 }}></div>
          ))}
        </div>
        <div style={styles.gridContainer}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeInUp 0.3s ease-out; }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', fontWeight: 600, fontSize: 13,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <BookOpen size={22} color="white" />
          </div>
          <div>
            <h2 style={styles.pageTitle}>E-Learning Console</h2>
            <p style={styles.pageSubtitle}>
              Kelola Modul Pembelajaran
              {guruId && <span style={styles.guruIdBadge}> <Hash size={10} /> {guruId}</span>}
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={styles.viewToggle}>
            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
          </button>
          <button onClick={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          {activeTab === 'kuis' ? (
            <button onClick={() => navigate('/guru/modul/quiz')} style={{...styles.btnCreate, background: '#f59e0b'}}>
              <FileQuestion size={16} /> Buat Kuis
            </button>
          ) : (
            <button onClick={() => navigate('/guru/modul/materi')} style={styles.btnCreate}>
              <Plus size={16} /> Buat Modul
            </button>
          )}
        </div>
      </div>

      {/* ===== STATS TABS ===== */}
      <div style={styles.statsTabs}>
        <button 
          onClick={() => setActiveTab('semua')}
          style={styles.tabButton(activeTab === 'semua', '#6366f1')}
        >
          Semua ({stats.total})
        </button>
        <button 
          onClick={() => setActiveTab('modul')}
          style={styles.tabButton(activeTab === 'modul', '#3b82f6')}
        >
          <BookOpen size={14} /> Modul ({stats.modul})
        </button>
        <button 
          onClick={() => setActiveTab('tugas')}
          style={styles.tabButton(activeTab === 'tugas', '#ef4444')}
        >
          <Send size={14} /> Tugas ({stats.tugas})
        </button>
        <button 
          onClick={() => setActiveTab('kuis')}
          style={styles.tabButton(activeTab === 'kuis', '#f59e0b')}
        >
          <FileQuestion size={14} /> Kuis ({stats.kuis})
        </button>
        {guruId && (
          <button 
            onClick={() => setFilterGuru(filterGuru === 'saya' ? 'semua' : 'saya')}
            style={{
              ...styles.tabButton(filterGuru === 'saya', '#8b5cf6'),
              background: filterGuru === 'saya' ? '#8b5cf6' : '#f1f5f9',
              color: filterGuru === 'saya' ? 'white' : '#64748b'
            }}
          >
            <User size={14} /> Milik Saya ({stats.milikSaya})
          </button>
        )}
      </div>

      {/* ===== SEARCH & FILTER ===== */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <input 
            placeholder="Cari judul, mapel, ID guru..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={styles.searchInput} 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
          )}
        </div>
        <div style={styles.filterActions}>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{
              ...styles.btnFilter,
              background: hasActiveFilters ? '#3b82f6' : '#f1f5f9',
              color: hasActiveFilters ? 'white' : '#64748b'
            }}
          >
            <Filter size={14} /> Filter
            {hasActiveFilters && <span style={styles.filterDot}>●</span>}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={styles.btnClearFilter}>
              <X size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ===== ADVANCED FILTERS ===== */}
      {showFilters && (
        <div style={styles.advancedFilters}>
          <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">🎓 Semua Kelas</option>
            {availableClasses.filter(k => k !== 'Semua').map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <select value={filterMapel} onChange={e => setFilterMapel(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">📖 Semua Mapel</option>
            {availableSubjects.filter(s => s !== 'Semua').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">📋 Semua Status</option>
            <option value="aktif">🟢 Aktif</option>
            <option value="terjadwal">🟡 Terjadwal</option>
            <option value="arsip">📦 Arsip</option>
          </select>
        </div>
      )}

      {/* ===== FILTER INFO ===== */}
      {hasActiveFilters && (
        <div style={styles.filterInfo}>
          <span>🔍 {filteredItems.length} item</span>
          {filterGuru === 'saya' && <span style={styles.filterTag}>👤 Milik Saya</span>}
          {filterKelas !== "Semua" && <span style={styles.filterTag}>🎓 {filterKelas}</span>}
          {filterMapel !== "Semua" && <span style={styles.filterTag}>📖 {filterMapel}</span>}
          {filterStatus !== "Semua" && <span style={styles.filterTag}>📋 {filterStatus}</span>}
        </div>
      )}

      {/* ===== CONTENT ===== */}
      {filteredItems.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <FolderOpen size={56} color="#cbd5e1" />
          </div>
          <h3 style={styles.emptyTitle}>Tidak Ada Konten</h3>
          <p style={styles.emptyDesc}>
            {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Buat modul pembelajaran baru untuk siswa.'}
          </p>
          <button onClick={() => navigate('/guru/modul/materi')} style={styles.emptyBtn}>
            <Plus size={16} /> Buat Modul Sekarang
          </button>
        </div>
      ) : (
        <>
          <div style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
            {filteredItems.map((item, index) => {
              const typeInfo = getTypeInfo(item);
              const sb = getStatusBadge(item.status);
              const targetKelas = item.targetKelas || "Semua";
              const isForAllClasses = targetKelas === "Semua";
              const isMine = item.guruId === guruId || item.createdBy === guruData?.nama;
              const isDeleting = deletingId === item.id;
              const hasQuizInside = item.blocks?.some(b => b.type === 'quiz' && b.quizId);
              const guruName = item.guruName || item.authorName || item.createdBy || 'Admin';
              
              const CardComponent = () => (
                <div 
                  style={{
                    ...styles.card,
                    borderTop: `4px solid ${typeInfo.color}`,
                    opacity: item.status === 'arsip' ? 0.7 : 1
                  }}
                  onClick={() => {
                    if (typeInfo.label === 'Kuis' || hasQuizInside) {
                      // Cari quizId pertama di blocks
                      const quizBlock = item.blocks?.find(b => b.type === 'quiz' && b.quizId);
                      if (quizBlock) {
                        // 🔥 FIX: navigate langsung ke path final (bukan lewat redirect
                        // /guru/manage-quiz yang membuang query param modulId & sectionId)
                        navigate(`/guru/modul/quiz?modulId=${item.id}&sectionId=${quizBlock.id}`);
                      } else {
                        navigate(`/guru/modul/quiz?modulId=${item.id}`);
                      }
                    } else if (typeInfo.label === 'Tugas') {
                      navigate(`/guru/modul/materi?edit=${item.id}`);
                    } else {
                      navigate(`/guru/modul/materi?edit=${item.id}`);
                    }
                  }}
                >
                  {/* Badges */}
                  <div style={styles.cardBadges}>
                    <span style={{...styles.badge, background: sb.bg, color: sb.color }}>
                      {sb.label}
                    </span>
                    <span style={{...styles.badge, background: typeInfo.bg, color: typeInfo.color }}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    {item.subject && (
                      <span style={{...styles.badge, background: '#f1f5f9', color: '#64748b' }}>
                        {item.subject}
                      </span>
                    )}
                    <span style={{
                      ...styles.badge,
                      background: isForAllClasses ? '#fef3c7' : '#e0e7ff',
                      color: isForAllClasses ? '#b45309' : '#3730a3'
                    }}>
                      {isForAllClasses ? '🌐 Semua' : `🎓 ${targetKelas}`}
                    </span>
                    {isMine && (
                      <span style={{...styles.badge, background: '#dbeafe', color: '#3b82f6' }}>
                        <User size={10} /> Saya
                      </span>
                    )}
                    {item.guruId && (
                      <span style={{...styles.badge, background: '#f3e8ff', color: '#7c3aed', fontSize: 7 }}>
                        <Hash size={8} /> {item.guruId}
                      </span>
                    )}
                    {hasQuizInside && (
                      <span style={{...styles.badge, background: '#f3e8ff', color: '#8b5cf6' }}>
                        <FileQuestion size={10} /> Kuis
                      </span>
                    )}
                    {item.selectedStudents && item.selectedStudents.length > 0 && (
                      <span style={{...styles.badge, background: '#fce7f3', color: '#be185d' }}>
                        <Users size={10} /> {item.selectedStudents.length} siswa
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={styles.cardTitle}>
                    {item.title || "Untitled"}
                    {item.kodeMapel && (
                      <span style={styles.mapelIdTag}>
                        <Tag size={10} /> {item.kodeMapel}
                      </span>
                    )}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p style={styles.cardDesc}>{item.description}</p>
                  )}

                  {/* Meta */}
                  <div style={styles.cardMeta}>
                    {typeInfo.label === 'Kuis' ? (
                      <span><FileQuestion size={10} /> {item.quizData?.length || 0} soal</span>
                    ) : typeInfo.label === 'Tugas' ? (
                      <span><Clock size={10} /> {item.deadlineTugas ? new Date(item.deadlineTugas).toLocaleDateString('id-ID') : 'Tanpa deadline'}</span>
                    ) : (
                      <span><FileText size={10} /> {(item.blocks || []).length} konten</span>
                    )}
                    <span><Users size={10} /> {item.targetKategori || 'Reguler'}</span>
                    {item.mingguKe && <span>📅 Mg {item.mingguKe}</span>}
                    <span><Calendar size={10} /> {item.tahunAjaran || '-'}</span>
                    {item.updatedBy && <span>✏️ {item.updatedBy}</span>}
                  </div>

                  {/* Actions */}
                  <div style={styles.cardActions}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); 
                        if (typeInfo.label === 'Kuis' || hasQuizInside) {
                          const quizBlock = item.blocks?.find(b => b.type === 'quiz' && b.quizId);
                          if (quizBlock) {
                            // 🔥 FIX: sama, langsung ke path final
                            navigate(`/guru/modul/quiz?modulId=${item.id}&sectionId=${quizBlock.id}`);
                          } else {
                            navigate(`/guru/modul/quiz?modulId=${item.id}`);
                          }
                        } else {
                          navigate(`/guru/modul/materi?edit=${item.id}`);
                        }
                      }} 
                      style={styles.btnEdit}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`/siswa/materi/${item.id}`, '_blank'); }} 
                      style={styles.btnPreview}
                    >
                      <Eye size={12} /> Preview
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, item.id)} 
                      disabled={isDeleting}
                      style={styles.btnDelete}
                    >
                      {isDeleting ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              );

              return viewMode === 'grid' ? (
                <div key={item.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardComponent />
                </div>
              ) : (
                <div key={item.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardComponent />
                </div>
              );
            })}
          </div>
          
          {/* LOAD MORE */}
          {hasMore && filteredItems.length === items.length && items.length > 0 && (
            <div style={styles.loadMore}>
              <button 
                onClick={() => fetchItems(true)} 
                disabled={loadingMore}
                style={styles.btnLoadMore}
              >
                {loadingMore ? (
                  <><Loader2 size={14} className="spin" /> Memuat...</>
                ) : (
                  'Muat Lebih Banyak'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '16px 20px 40px',
    width: '100%',
    boxSizing: 'border-box',
    background: '#f8fafc',
    minHeight: '100vh'
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
    background: 'white',
    padding: '16px 20px',
    borderRadius: 16,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  headerIcon: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' },
  pageSubtitle: { margin: '2px 0 0', fontSize: 12, color: '#94a3b8' },
  guruIdBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '1px 8px', borderRadius: 10, fontSize: 9,
    background: '#eef2ff', color: '#3b82f6', fontWeight: 600
  },
  headerActions: { display: 'flex', gap: 8, alignItems: 'center' },
  viewToggle: {
    background: '#f1f5f9', border: 'none', padding: '8px 10px',
    borderRadius: 8, cursor: 'pointer', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  refreshBtn: {
    background: '#f1f5f9', border: 'none', padding: '8px 10px',
    borderRadius: 8, cursor: 'pointer', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  btnCreate: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white', border: 'none', padding: '10px 18px',
    borderRadius: 10, cursor: 'pointer', fontWeight: 700,
    fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
    transition: '0.2s'
  },

  // Stats Tabs
  statsTabs: {
    display: 'flex', gap: 6, marginBottom: 16,
    flexWrap: 'wrap', background: 'white',
    padding: '8px 12px', borderRadius: 12,
    border: '1px solid #f1f5f9'
  },
  tabButton: (active, color) => ({
    padding: '6px 14px', borderRadius: 20, border: 'none',
    fontWeight: 700, fontSize: 12, cursor: 'pointer',
    transition: '0.2s',
    background: active ? color : '#f1f5f9',
    color: active ? 'white' : '#64748b',
    display: 'flex', alignItems: 'center', gap: 4,
    boxShadow: active ? `0 2px 8px ${color}40` : 'none'
  }),

  // Filter Bar
  filterBar: {
    background: 'white', borderRadius: 12,
    padding: '12px 16px', marginBottom: 16,
    border: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: 10
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#f8fafc', padding: '8px 14px',
    borderRadius: 10, border: '1px solid #e2e8f0',
    flex: 2, minWidth: 200
  },
  searchInput: {
    border: 'none', outline: 'none', width: '100%',
    fontSize: 13, background: 'transparent'
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', fontSize: 14, padding: '0 4px'
  },
  filterActions: { display: 'flex', gap: 6, alignItems: 'center' },
  btnFilter: {
    border: 'none', padding: '8px 14px', borderRadius: 10,
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 4,
    transition: '0.2s'
  },
  filterDot: {
    background: 'white', color: '#3b82f6',
    borderRadius: '50%', padding: '1px 5px', fontSize: 7,
    marginLeft: 2
  },
  btnClearFilter: {
    background: 'none', border: 'none', color: '#ef4444',
    cursor: 'pointer', fontSize: 12, display: 'flex',
    alignItems: 'center', gap: 3
  },

  // Advanced Filters
  advancedFilters: {
    display: 'flex', gap: 10, flexWrap: 'wrap',
    padding: 12, background: 'white', borderRadius: 12,
    border: '1px solid #f1f5f9', marginBottom: 16
  },
  filterSelect: {
    padding: '8px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 12,
    background: 'white', flex: 1, minWidth: 120,
    cursor: 'pointer', outline: 'none'
  },

  // Filter Info
  filterInfo: {
    fontSize: 11, color: '#3b82f6', marginBottom: 12,
    display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'
  },
  filterTag: {
    background: '#eef2ff', padding: '2px 10px',
    borderRadius: 12, fontSize: 10, fontWeight: 600
  },

  // Grid / List
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 16
  },
  listContainer: {
    display: 'flex', flexDirection: 'column', gap: 12
  },

  // Card
  card: {
    background: 'white', borderRadius: 14, overflow: 'hidden',
    padding: 16, border: '1px solid #f1f5f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    borderTop: '4px solid #3b82f6',
    height: '100%',
    display: 'flex', flexDirection: 'column'
  },
  cardBadges: {
    display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap'
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 10px', borderRadius: 12, fontSize: 9,
    fontWeight: 700, whiteSpace: 'nowrap'
  },
  cardTitle: {
    margin: '0 0 4px', fontSize: 14, color: '#1e293b',
    fontWeight: 700, lineHeight: 1.3,
    display: 'flex', alignItems: 'center', gap: 6,
    flexWrap: 'wrap'
  },
  mapelIdTag: {
    fontSize: 8, color: '#8b5cf6', background: '#ede9fe',
    padding: '1px 6px', borderRadius: 4,
    display: 'inline-flex', alignItems: 'center', gap: 2,
    fontFamily: 'monospace'
  },
  cardDesc: {
    fontSize: 12, color: '#64748b', margin: '4px 0 10px',
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
    lineHeight: 1.4
  },
  cardMeta: {
    display: 'flex', gap: 10, fontSize: 10,
    color: '#94a3b8', marginBottom: 12, flexWrap: 'wrap',
    alignItems: 'center', marginTop: 'auto'
  },
  cardActions: {
    display: 'flex', gap: 6, marginTop: 10,
    paddingTop: 10, borderTop: '1px solid #f1f5f9'
  },
  btnEdit: {
    flex: 1, background: '#f8fafc', color: '#1e293b',
    border: '1px solid #e2e8f0', padding: '6px 0',
    borderRadius: 8, cursor: 'pointer', fontWeight: 600,
    fontSize: 10, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 3
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
  },

  // Empty State
  emptyState: {
    textAlign: 'center', padding: '60px 20px',
    background: 'white', borderRadius: 16,
    border: '2px dashed #e2e8f0', color: '#94a3b8'
  },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#64748b', margin: '8px 0 4px' },
  emptyDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  emptyBtn: {
    background: '#6366f1', color: 'white', border: 'none',
    padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
    fontWeight: 600, fontSize: 13, display: 'inline-flex',
    alignItems: 'center', gap: 6
  },

  // Load More
  loadMore: { textAlign: 'center', marginTop: 24 },
  btnLoadMore: {
    background: '#f1f5f9', border: 'none', padding: '10px 24px',
    borderRadius: 20, cursor: 'pointer', fontSize: 12,
    fontWeight: 600, color: '#64748b', display: 'inline-flex',
    alignItems: 'center', gap: 6, transition: '0.2s'
  }
};

export default ModulManager;