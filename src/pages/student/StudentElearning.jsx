// src/pages/student/StudentElearning.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase';
import { 
  collection, getDocs, doc, getDoc, query, orderBy, where 
} from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, Filter, X, Grid3x3, List, 
  Hash, Tag, User, ChevronRight, FileQuestion,
  Layers, Send, HelpCircle, Clock, CheckCircle,
  AlertCircle, Lock, ChevronLeft, ArrowLeft
} from 'lucide-react';
import StudentModuleView from './StudentModuleView';

// ============================================================
// CONSTANTS
// ============================================================
const STATUS_COLORS = {
  not_submitted: { bg: '#fee2e2', color: '#ef4444', label: 'Belum' },
  submitted: { bg: '#fef3c7', color: '#f59e0b', label: 'Terkirim' },
  graded: { bg: '#dcfce7', color: '#10b981', label: 'Dinilai' }
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentElearning = () => {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMapel, setFilterMapel] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);
  
  // ===== STUDENT DATA =====
  const [studentData, setStudentData] = useState({
    id: '',
    nim: '',
    name: '',
    kelas: '',
    program: 'Reguler'
  });
  
  // ===== STATS =====
  const [stats, setStats] = useState({
    total: 0, modul: 0, tugas: 0, kuis: 0, submitted: 0
  });

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Ambil data siswa
  useEffect(() => {
    const id = localStorage.getItem('studentId') || '';
    const nim = localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
    const name = localStorage.getItem('studentName') || 'Siswa';
    const kelas = localStorage.getItem('studentKelas') || '';
    const program = localStorage.getItem('studentProgram') || 'Reguler';
    
    setStudentData({ id, nim, name, kelas, program });
    
    if (id) {
      getDoc(doc(db, "students", id)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setStudentData(prev => ({
            ...prev,
            nim: data.studentId || data.nim || nim,
            kelas: data.kelasSekolah || kelas,
            program: data.kategori || data.program || program
          }));
        }
      }).catch(() => {});
    }
  }, []);

  // ===== FETCH MODULES =====
  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      // 🔥 AMBIL SEMUA MODUL AKTIF
      const q = query(
        collection(db, "bimbel_modul"),
        where("status", "==", "aktif"),
        orderBy("updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      let allModules = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // 🔥 FILTER BERDASARKAN AKSES SISWA
      const { nim, kelas, program, id } = studentData;
      
      allModules = allModules.filter(module => {
        // 1. Cek jika modul dikirim ke siswa tertentu
        if (module.sendToSpecificStudents) {
          const targetIds = module.studentIds || [];
          const selectedIds = (module.selectedStudents || []).map(s => s.studentId || s.id);
          const allTargetIds = [...targetIds, ...selectedIds];
          return allTargetIds.includes(nim) || allTargetIds.includes(id);
        }
        
        // 2. Cek berdasarkan kelas & program
        const targetKelas = module.targetKelas || 'Semua';
        const targetProgram = module.targetKategori || 'Semua';
        const matchKelas = targetKelas === 'Semua' || targetKelas === kelas;
        const matchProgram = targetProgram === 'Semua' || targetProgram === program;
        
        return matchKelas && matchProgram;
      });
      
      setModules(allModules);
      setFilteredModules(allModules);
      
      // Hitung stats
      const modulCount = allModules.filter(m => m.type !== 'kuis_mandiri' && m.blocks?.length > 0).length;
      const tugasCount = allModules.filter(m => m.blocks?.some(b => b.type === 'assignment')).length;
      const kuisCount = allModules.filter(m => m.type === 'kuis_mandiri' || m.quizData?.length > 0).length;
      
      setStats({
        total: allModules.length,
        modul: modulCount,
        tugas: tugasCount,
        kuis: kuisCount,
        submitted: 0
      });
      
    } catch (error) {
      console.error("Error fetch modules:", error);
    }
    setLoading(false);
  }, [studentData]);

  // Fetch saat data siswa berubah
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // ===== FILTER MODULES =====
  useEffect(() => {
    let filtered = modules;
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        (m.title || '').toLowerCase().includes(term) ||
        (m.subject || '').toLowerCase().includes(term) ||
        (m.kodeMapel || '').toLowerCase().includes(term) ||
        (m.description || '').toLowerCase().includes(term)
      );
    }
    
    // Filter type
    if (filterType === 'modul') {
      filtered = filtered.filter(m => m.type !== 'kuis_mandiri' && m.blocks?.length > 0);
    } else if (filterType === 'tugas') {
      filtered = filtered.filter(m => m.blocks?.some(b => b.type === 'assignment'));
    } else if (filterType === 'kuis') {
      filtered = filtered.filter(m => m.type === 'kuis_mandiri' || m.quizData?.length > 0);
    }
    
    // Filter mapel
    if (filterMapel !== 'all') {
      filtered = filtered.filter(m => 
        m.subject === filterMapel || m.kodeMapel === filterMapel
      );
    }
    
    setFilteredModules(filtered);
  }, [searchTerm, filterType, filterMapel, modules]);

  // ===== GET MAPEL UNIK =====
  const mapelOptions = useMemo(() => {
    const mapelSet = new Set();
    modules.forEach(m => {
      if (m.subject) mapelSet.add(m.subject);
      if (m.kodeMapel) mapelSet.add(m.kodeMapel);
    });
    return ['all', ...Array.from(mapelSet)];
  }, [modules]);

  // ===== HANDLERS =====
  const handleModuleClick = (moduleId) => {
    setSelectedModuleId(moduleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedModuleId(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMapel('all');
    setFilterType('all');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm || filterMapel !== 'all' || filterType !== 'all';

  // ============================================================
  // RENDER: MODULE CARD
  // ============================================================
  const renderModuleCard = (module) => {
    const isQuiz = module.type === 'kuis_mandiri';
    const hasAssignment = module.blocks?.some(b => b.type === 'assignment');
    const hasQuiz = module.quizData?.length > 0;
    const coverImage = module.coverImage || null;
    const isForAll = module.targetKelas === 'Semua';
    
    return (
      <div 
        key={module.id} 
        onClick={() => handleModuleClick(module.id)}
        style={cardStyles.card}
      >
        <div style={cardStyles.cover}>
          {coverImage ? (
            <img src={coverImage} alt={module.title} style={cardStyles.coverImage} />
          ) : (
            <div style={cardStyles.coverPlaceholder}>
              {isQuiz ? <FileQuestion size={40} color="#8b5cf6" /> : <BookOpen size={40} color="#3b82f6" />}
            </div>
          )}
          <div style={cardStyles.badgeTop}>
            <span style={{...cardStyles.badge, background: isQuiz ? '#8b5cf6' : '#3b82f6', color: 'white' }}>
              {isQuiz ? <><FileQuestion size={10} /> Kuis</> : <><BookOpen size={10} /> Modul</>}
            </span>
            {module.kodeMapel && (
              <span style={{...cardStyles.badge, background: '#ede9fe', color: '#8b5cf6' }}>
                <Tag size={10} /> {module.kodeMapel}
              </span>
            )}
            {module.guruId && (
              <span style={{...cardStyles.badge, background: '#eef2ff', color: '#3b82f6' }}>
                <Hash size={10} /> {module.guruId}
              </span>
            )}
          </div>
          <div style={cardStyles.badgeBottom}>
            <span style={{...cardStyles.badge, background: isForAll ? '#fef3c7' : '#e0e7ff', color: isForAll ? '#b45309' : '#3730a3' }}>
              {isForAll ? '🌐 Semua' : `🎓 ${module.targetKelas}`}
            </span>
            {module.targetKategori && module.targetKategori !== 'Semua' && (
              <span style={{...cardStyles.badge, background: '#fce7f3', color: '#be185d' }}>
                {module.targetKategori}
              </span>
            )}
          </div>
        </div>
        <div style={cardStyles.body}>
          <h3 style={cardStyles.title}>{module.title}</h3>
          <div style={cardStyles.subject}>
            <BookOpen size={12} /> {module.subject || 'Materi'}
            {module.authorName && (
              <span style={cardStyles.authorTag}><User size={10} /> {module.authorName}</span>
            )}
          </div>
          <div style={cardStyles.meta}>
            {hasAssignment && <span style={cardStyles.metaItem}><Send size={10} /> Tugas</span>}
            {hasQuiz && <span style={cardStyles.metaItem}><HelpCircle size={10} /> Kuis</span>}
            {module.blocks?.length > 0 && (
              <span style={cardStyles.metaItem}><Layers size={10} /> {module.blocks.length}</span>
            )}
          </div>
          <button style={cardStyles.btn}>
            Buka <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading && modules.length === 0) {
    return (
      <div style={listStyles.container}>
        <div style={listStyles.loading}>
          <div style={listStyles.spinner}></div>
          <p>Memuat materi pembelajaran...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ============================================================
  // DETAIL VIEW (pakai StudentModuleView)
  // ============================================================
  if (selectedModuleId) {
    return (
      <div style={{ width: '100%', padding: isMobile ? 10 : 20, boxSizing: 'border-box' }}>
        <button 
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'white', border: '1px solid #e2e8f0',
            padding: '8px 16px', borderRadius: 10,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            marginBottom: 16
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Daftar
        </button>
        <StudentModuleView 
          modulId={selectedModuleId} 
          onBack={handleBack}
          studentData={studentData}
        />
      </div>
    );
  }

  // ============================================================
  // LIST VIEW
  // ============================================================
  return (
    <div style={listStyles.container}>
      {/* HEADER */}
      <div style={listStyles.header}>
        <div>
          <h1 style={listStyles.title}>
            <BookOpen size={28} color="#652D90" /> E-Learning
          </h1>
          <p style={listStyles.subtitle}>
            {studentData.name} • {studentData.program} • 
            {studentData.kelas ? ` Kelas ${studentData.kelas}` : ' Semua Kelas'}
            {studentData.nim && (
              <span style={listStyles.nimBadge}>
                <Hash size={10} /> {studentData.nim}
              </span>
            )}
          </p>
        </div>
        <div style={listStyles.viewToggle}>
          <button 
            onClick={() => setViewMode('grid')} 
            style={{...listStyles.viewBtn, background: viewMode === 'grid' ? '#652D90' : '#f1f5f9', color: viewMode === 'grid' ? 'white' : '#64748b' }}
          >
            <Grid3x3 size={16} />
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            style={{...listStyles.viewBtn, background: viewMode === 'list' ? '#652D90' : '#f1f5f9', color: viewMode === 'list' ? 'white' : '#64748b' }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={listStyles.statsRow}>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.total}</span>
          <span style={listStyles.statLabel}>📚 Modul</span>
        </div>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.tugas}</span>
          <span style={listStyles.statLabel}>📝 Tugas</span>
        </div>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.kuis}</span>
          <span style={listStyles.statLabel}>❓ Kuis</span>
        </div>
        <div style={{...listStyles.statItem, background: '#f0fdf4', borderColor: '#bbf7d0'}}>
          <span style={{...listStyles.statValue, color: '#10b981'}}>
            {modules.filter(m => m.type === 'kuis_mandiri' || m.quizData?.length > 0).length}
          </span>
          <span style={listStyles.statLabel}>✅ Selesai</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={listStyles.filterBar}>
        <div style={listStyles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari judul, mapel, atau ID..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={listStyles.searchInput} 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={listStyles.clearBtn}>✕</button>
          )}
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          style={{
            ...listStyles.filterBtn,
            background: hasActiveFilters ? '#3b82f6' : '#f1f5f9',
            color: hasActiveFilters ? 'white' : '#64748b'
          }}
        >
          <Filter size={14} /> Filter
          {hasActiveFilters && <span style={listStyles.filterDot}>●</span>}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} style={listStyles.clearFilterBtn}>
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {/* ADVANCED FILTERS */}
      {showFilters && (
        <div style={listStyles.advancedFilters}>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)} 
            style={listStyles.filterSelect}
          >
            <option value="all">📚 Semua</option>
            <option value="modul">📖 Modul</option>
            <option value="tugas">📝 Tugas</option>
            <option value="kuis">❓ Kuis</option>
          </select>
          <select 
            value={filterMapel} 
            onChange={e => setFilterMapel(e.target.value)} 
            style={listStyles.filterSelect}
          >
            <option value="all">📖 Semua Mapel</option>
            {mapelOptions.filter(s => s !== 'all').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* FILTER INFO */}
      {hasActiveFilters && (
        <div style={listStyles.filterInfo}>
          <span>🔍 {filteredModules.length} modul</span>
          {filterType !== 'all' && (
            <span style={listStyles.filterTag}>📋 {filterType}</span>
          )}
          {filterMapel !== 'all' && (
            <span style={listStyles.filterTag}>📖 {filterMapel}</span>
          )}
        </div>
      )}

      {/* CONTENT */}
      {filteredModules.length === 0 ? (
        <div style={listStyles.emptyState}>
          <BookOpen size={56} color="#cbd5e1" />
          <h3 style={listStyles.emptyTitle}>Tidak Ada Modul</h3>
          <p style={listStyles.emptyDesc}>
            {searchTerm ? 'Coba ubah kata kunci pencarian' : 
             `Belum ada modul untuk ${studentData.program}${studentData.kelas ? ` - Kelas ${studentData.kelas}` : ''}`}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={listStyles.grid}>
          {filteredModules.map(module => renderModuleCard(module))}
        </div>
      ) : (
        <div style={listStyles.list}>
          {filteredModules.map(module => {
            const isQuiz = module.type === 'kuis_mandiri';
            const hasAssignment = module.blocks?.some(b => b.type === 'assignment');
            
            return (
              <div 
                key={module.id} 
                onClick={() => handleModuleClick(module.id)} 
                style={listStyles.listItem}
              >
                <div style={listStyles.listItemIcon}>
                  {isQuiz ? <FileQuestion size={20} color="#8b5cf6" /> : <BookOpen size={20} color="#3b82f6" />}
                </div>
                <div style={listStyles.listItemContent}>
                  <div style={listStyles.listItemHeader}>
                    <span style={listStyles.listItemTitle}>{module.title}</span>
                    {module.kodeMapel && (
                      <span style={listStyles.listItemTag}><Tag size={8} /> {module.kodeMapel}</span>
                    )}
                    {module.guruId && (
                      <span style={listStyles.listItemTag}><Hash size={8} /> {module.guruId}</span>
                    )}
                  </div>
                  <div style={listStyles.listItemMeta}>
                    <span>{module.subject || 'Materi'}</span>
                    {hasAssignment && <span>📝 Tugas</span>}
                    {module.blocks?.length > 0 && <span>📄 {module.blocks.length} konten</span>}
                  </div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const cardStyles = {
  card: { 
    background: 'white', borderRadius: 16, overflow: 'hidden', 
    cursor: 'pointer', transition: 'all 0.3s ease', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
    border: '1px solid #f1f5f9', 
    height: '100%', display: 'flex', flexDirection: 'column' 
  },
  cover: { 
    position: 'relative', height: 140, 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    overflow: 'hidden', flexShrink: 0 
  },
  coverImage: { width: '100%', height: '100%', objectFit: 'cover' },
  coverPlaceholder: { 
    width: '100%', height: '100%', display: 'flex', 
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
  },
  badgeTop: { 
    position: 'absolute', top: 10, left: 10, 
    display: 'flex', gap: 4, flexWrap: 'wrap' 
  },
  badgeBottom: { 
    position: 'absolute', bottom: 10, left: 10, 
    display: 'flex', gap: 4, flexWrap: 'wrap' 
  },
  badge: { 
    display: 'inline-flex', alignItems: 'center', gap: 4, 
    padding: '2px 10px', borderRadius: 12, fontSize: 9, 
    fontWeight: 700, background: 'rgba(255,255,255,0.9)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  },
  body: { padding: 14, flex: 1, display: 'flex', flexDirection: 'column' },
  title: { 
    fontSize: 14, fontWeight: 700, color: '#1e293b', 
    margin: '0 0 4px', lineHeight: 1.3 
  },
  subject: { 
    fontSize: 11, color: '#64748b', display: 'flex', 
    alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' 
  },
  authorTag: { 
    fontSize: 9, color: '#3b82f6', background: '#eef2ff', 
    padding: '1px 8px', borderRadius: 10, display: 'inline-flex', 
    alignItems: 'center', gap: 2 
  },
  meta: { 
    display: 'flex', gap: 6, flexWrap: 'wrap', 
    marginBottom: 10, marginTop: 'auto' 
  },
  metaItem: { 
    fontSize: 9, padding: '2px 8px', borderRadius: 10, 
    background: '#f1f5f9', color: '#64748b', 
    display: 'inline-flex', alignItems: 'center', gap: 3 
  },
  btn: { 
    width: '100%', padding: 8, background: '#3b82f6', 
    color: 'white', border: 'none', borderRadius: 8, 
    fontSize: 11, fontWeight: 700, cursor: 'pointer', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 
  }
};

const listStyles = {
  container: { 
    width: '100%', padding: '20px', boxSizing: 'border-box', 
    minHeight: '100vh', background: '#f8fafc' 
  },
  loading: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '70vh', gap: 16,
    color: '#94a3b8', fontSize: 13
  },
  spinner: {
    width: 40, height: 40, border: '4px solid #e2e8f0',
    borderTop: '4px solid #652D90', borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  header: { 
    display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 
  },
  title: { 
    fontSize: 24, fontWeight: 800, color: '#1e293b', 
    margin: 0, display: 'flex', alignItems: 'center', gap: 8 
  },
  subtitle: { 
    fontSize: 13, color: '#64748b', margin: '4px 0 0' 
  },
  nimBadge: { 
    display: 'inline-flex', alignItems: 'center', gap: 3, 
    background: '#eef2ff', color: '#3b82f6', 
    padding: '1px 8px', borderRadius: 10, fontSize: 10, 
    fontWeight: 600, marginLeft: 6 
  },
  viewToggle: { 
    display: 'flex', gap: 4, background: '#f1f5f9', 
    padding: 4, borderRadius: 10 
  },
  viewBtn: { 
    padding: '8px 10px', borderRadius: 8, border: 'none', 
    cursor: 'pointer', display: 'flex', alignItems: 'center', 
    justifyContent: 'center' 
  },
  statsRow: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
    gap: 12, marginBottom: 20 
  },
  statItem: { 
    background: 'white', padding: '12px 16px', borderRadius: 12, 
    border: '1px solid #f1f5f9', textAlign: 'center' 
  },
  statValue: { fontSize: 18, fontWeight: 900, color: '#1e293b', display: 'block' },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 500 },
  
  filterBar: { 
    display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' 
  },
  searchBox: { 
    flex: 2, display: 'flex', alignItems: 'center', gap: 8, 
    background: 'white', padding: '8px 14px', borderRadius: 10, 
    border: '1px solid #e2e8f0', minWidth: 200 
  },
  searchInput: { 
    flex: 1, border: 'none', outline: 'none', fontSize: 13, 
    background: 'transparent' 
  },
  clearBtn: { 
    background: 'none', border: 'none', color: '#94a3b8', 
    cursor: 'pointer', fontSize: 14 
  },
  filterBtn: { 
    border: 'none', padding: '8px 14px', borderRadius: 10, 
    cursor: 'pointer', fontSize: 12, fontWeight: 600, 
    display: 'flex', alignItems: 'center', gap: 4 
  },
  filterDot: {
    background: 'white', color: '#3b82f6', borderRadius: '50%',
    padding: '1px 5px', fontSize: 7, marginLeft: 2
  },
  clearFilterBtn: {
    background: 'none', border: 'none', color: '#ef4444',
    cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3
  },
  advancedFilters: {
    display: 'flex', gap: 10, flexWrap: 'wrap',
    padding: 12, background: 'white', borderRadius: 12,
    border: '1px solid #f1f5f9', marginBottom: 12
  },
  filterSelect: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
    fontSize: 12, background: 'white', flex: 1, minWidth: 120,
    cursor: 'pointer', outline: 'none'
  },
  filterInfo: {
    fontSize: 11, color: '#3b82f6', marginBottom: 12,
    display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'
  },
  filterTag: {
    background: '#eef2ff', padding: '2px 10px', borderRadius: 12,
    fontSize: 10, fontWeight: 600
  },
  grid: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
    gap: 16 
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { 
    display: 'flex', alignItems: 'center', gap: 12, 
    background: 'white', padding: '12px 16px', borderRadius: 12, 
    border: '1px solid #e2e8f0', cursor: 'pointer', transition: '0.2s' 
  },
  listItemIcon: { 
    width: 40, height: 40, borderRadius: 10, background: '#f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
  },
  listItemContent: { flex: 1, minWidth: 0 },
  listItemHeader: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  listItemTitle: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  listItemTag: { 
    display: 'inline-flex', alignItems: 'center', gap: 2,
    background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontSize: 9,
    color: '#64748b'
  },
  listItemMeta: { display: 'flex', gap: 8, fontSize: 11, color: '#94a3b8', marginTop: 2, flexWrap: 'wrap' },
  emptyState: { 
    textAlign: 'center', padding: '60px 20px', background: 'white', 
    borderRadius: 16, border: '2px dashed #e2e8f0', color: '#94a3b8' 
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#64748b', margin: '12px 0 4px' },
  emptyDesc: { fontSize: 13 }
};

export default StudentElearning;