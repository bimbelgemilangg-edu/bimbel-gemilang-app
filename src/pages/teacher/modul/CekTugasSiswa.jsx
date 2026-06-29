// src/pages/teacher/modul/CekTugasSiswa.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, 
  query, orderBy, Timestamp, serverTimestamp, where, 
  limit, startAfter, getCountFromServer 
} from "firebase/firestore";
import { 
  CheckCircle, Clock, AlertCircle, Search, Edit3, 
  Save, Download, Trash2, FileText, HelpCircle, 
  BarChart3, RefreshCw, User, Hash, Tag, Filter,
  X, ChevronDown, ChevronUp, Layers, BookOpen,
  GraduationCap, Award, TrendingUp, Activity, PieChart,
  Calendar, Users, Zap, Sparkles, Shield, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CekTugasSiswa = () => {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('tugas');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [refreshing, setRefreshing] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [newScore, setNewScore] = useState("");
  const [filterMapel, setFilterMapel] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [showFilters, setShowFilters] = useState(false);
  
  // ===== DATA GURU =====
  const [guruData, setGuruData] = useState(null);
  const [guruId, setGuruId] = useState('');
  const [kodeMapel, setKodeMapel] = useState('');
  const [guruName, setGuruName] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // ===== STATS =====
  const [stats, setStats] = useState({
    totalTugas: 0,
    pendingTugas: 0,
    gradedTugas: 0,
    totalKuis: 0,
    avgScore: 0
  });

  // ============================================================
  // EFFECTS
  // ============================================================
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
        setGuruName(teacherName);
        
        if (teacherName) {
          const q = query(collection(db, "teachers"), where("nama", "==", teacherName));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const guru = snap.docs[0].data();
            setGuruData(guru);
            setKodeMapel(guru.kodeMapel || '');
            setIsAuthorized(true);
          }
        }
        
        if (teacherId) {
          fetchData();
        }
      } catch (e) {
        console.error("Error getting guru:", e);
      }
    };
    getGuru();
  }, []);

  // ============================================================
  // FETCH DATA - HANYA UNTUK GURU YANG LOGIN
  // ============================================================
  const fetchData = useCallback(async () => {
    if (!guruId && !guruName) return;
    
    setLoading(true);
    try {
      // 🔥 FILTER TUGAS BERDASARKAN GURU ID
      const qTasks = query(
        collection(db, "jawaban_tugas"),
        where("guruId", "==", guruId),
        orderBy("submittedAt", "desc")
      );
      const snapTasks = await getDocs(qTasks);
      const tasksData = snapTasks.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        type: 'tugas' 
      }));
      setTasks(tasksData);

      // 🔥 FILTER KUIS BERDASARKAN GURU ID
      const qQuiz = query(
        collection(db, "jawaban_kuis"),
        where("guruId", "==", guruId),
        orderBy("submittedAt", "desc")
      );
      const snapQuiz = await getDocs(qQuiz);
      const quizPromises = snapQuiz.docs.map(async (d) => {
        const data = d.data();
        const docRef = doc(db, "jawaban_kuis", d.id);
        let calculatedScore = data.score;
        let needsUpdate = false;
        
        if (data.correctAnswers !== undefined && data.totalQuestions && data.totalQuestions > 0) {
          const autoScore = Math.round((data.correctAnswers / data.totalQuestions) * 100);
          if (data.score === undefined || data.score === null || data.score !== autoScore) {
            calculatedScore = autoScore;
            needsUpdate = true;
          }
        }
        if (needsUpdate || data.status !== "Dinilai") {
          try { 
            await updateDoc(docRef, { 
              score: calculatedScore, 
              status: "Dinilai", 
              gradedAt: serverTimestamp() 
            }); 
          } catch (e) {}
        }
        return { 
          id: d.id, 
          ...data, 
          type: 'kuis', 
          score: calculatedScore, 
          status: "Dinilai" 
        };
      });
      const quizData = await Promise.all(quizPromises);
      setQuizzes(quizData);
      
      // ===== HITUNG STATS =====
      const pending = tasksData.filter(t => t.status === 'Pending' || !t.score);
      const graded = tasksData.filter(t => t.score !== undefined && t.score !== null);
      const quizScores = quizData.filter(q => q.score !== undefined && q.score !== null);
      const avgScore = quizScores.length > 0 
        ? Math.round(quizScores.reduce((acc, q) => acc + (q.score || 0), 0) / quizScores.length) 
        : 0;
      
      setStats({
        totalTugas: tasksData.length,
        pendingTugas: pending.length,
        gradedTugas: graded.length,
        totalKuis: quizData.length,
        avgScore: avgScore
      });
      
    } catch (e) { 
      console.error("Error:", e);
    }
    setLoading(false);
    setRefreshing(false);
  }, [guruId, guruName]);

  const handleRefresh = () => { 
    setRefreshing(true); 
    fetchData(); 
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleUpdateScore = async (id, collectionName) => {
    if (newScore === "" || isNaN(newScore) || newScore < 0 || newScore > 100) {
      return alert("Nilai harus 0-100!");
    }
    try {
      await updateDoc(doc(db, collectionName, id), { 
        score: Number(newScore), 
        status: "Dinilai", 
        gradedAt: serverTimestamp() 
      });
      setEditingScore(null);
      setNewScore("");
      fetchData();
      alert("✅ Nilai berhasil diperbarui!");
    } catch (e) { 
      alert("Gagal: " + e.message); 
    }
  };

  const handleDelete = async (id, collectionName) => {
    if (!window.confirm("⚠️ Hapus permanen?")) return;
    try { 
      await deleteDoc(doc(db, collectionName, id)); 
      fetchData(); 
    } catch (e) { 
      alert("Gagal: " + e.message); 
    }
  };

  // ============================================================
  // FILTER DATA
  // ============================================================
  const currentData = useMemo(() => {
    return activeTab === 'tugas' ? tasks : quizzes;
  }, [activeTab, tasks, quizzes]);

  const filteredData = useMemo(() => {
    let filtered = currentData;
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.studentName || '').toLowerCase().includes(term) ||
        (item.modulTitle || '').toLowerCase().includes(term) ||
        (item.studentNim || '').toLowerCase().includes(term) ||
        (item.studentId || '').toLowerCase().includes(term)
      );
    }
    
    // Filter status
    if (filterStatus !== "Semua") {
      if (filterStatus === "Pending") {
        filtered = filtered.filter(item => !item.score && item.status !== 'Dinilai');
      } else if (filterStatus === "Dinilai") {
        filtered = filtered.filter(item => item.score !== undefined && item.score !== null);
      }
    }
    
    return filtered;
  }, [currentData, searchTerm, filterStatus]);

  // ============================================================
  // RENDER
  // ============================================================
  if (!isAuthorized && !loading) {
    return (
      <div style={styles.unauthorized}>
        <AlertCircle size={48} color="#ef4444" />
        <h3>Akses Ditolak</h3>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
        <button onClick={() => navigate('/guru/dashboard')} style={styles.btnBack}>
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 0.8s linear infinite; }
        .fade-in { animation: fadeInUp 0.3s ease-out; }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <BarChart3 size={22} color="white" />
          </div>
          <div>
            <h2 style={styles.headerTitle}>Pemeriksaan Hasil Belajar</h2>
            <p style={styles.headerSub}>
              {guruId && <span style={styles.guruBadge}><Hash size={10} /> {guruId}</span>}
              {kodeMapel && <span style={styles.mapelBadge}><Tag size={10} /> {kodeMapel}</span>}
              <span style={styles.headerCount}>{activeTab === 'tugas' ? tasks.length : quizzes.length} item</span>
            </p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={handleRefresh} disabled={refreshing} style={styles.refreshBtn}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari nama atau ID..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={styles.filterBtn(showFilters)}
          >
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.totalTugas}</span>
          <span style={styles.statLabel}>📝 Total Tugas</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.pendingTugas}</span>
          <span style={styles.statLabel}>⏳ Perlu Dinilai</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.gradedTugas}</span>
          <span style={styles.statLabel}>✅ Sudah Dinilai</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.totalKuis}</span>
          <span style={styles.statLabel}>❓ Total Kuis</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.avgScore}%</span>
          <span style={styles.statLabel}>⭐ Rata-rata</span>
        </div>
      </div>

      {/* FILTERS */}
      {showFilters && (
        <div style={styles.filtersPanel}>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            style={styles.filterSelect}
          >
            <option value="Semua">📋 Semua Status</option>
            <option value="Pending">⏳ Perlu Dinilai</option>
            <option value="Dinilai">✅ Sudah Dinilai</option>
          </select>
          <button onClick={() => { setFilterStatus("Semua"); setSearchTerm(""); }} style={styles.resetFiltersBtn}>
            <X size={12} /> Reset
          </button>
        </div>
      )}

      {/* TABS */}
      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('tugas')} 
          style={styles.tabButton(activeTab === 'tugas')}
        >
          <FileText size={14} /> Tugas ({tasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('kuis')} 
          style={styles.tabButton(activeTab === 'kuis')}
        >
          <HelpCircle size={14} /> Kuis ({quizzes.length})
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Memuat data...</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          {filteredData.length === 0 ? (
            <div style={styles.emptyState}>
              <BookOpen size={48} color="#cbd5e1" />
              <h4>Belum ada data</h4>
              <p>{searchTerm ? 'Tidak ada hasil pencarian.' : 'Belum ada siswa yang mengirim tugas/kuis.'}</p>
            </div>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.th}>Siswa / ID</th>
                    <th style={styles.th}>Materi</th>
                    <th style={styles.th}>Waktu</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>{activeTab === 'tugas' ? 'File' : 'Jawaban'}</th>
                    <th style={styles.th}>Nilai</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => {
                    const timeString = item.submittedAt 
                      ? new Date(
                          item.submittedAt instanceof Timestamp 
                            ? item.submittedAt.toDate() 
                            : item.submittedAt
                        ).toLocaleString('id-ID', { 
                          day: '2-digit', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : '-';
                    
                    const displayScore = item.score;
                    const scoreColor = displayScore >= 75 
                      ? '#10b981' 
                      : displayScore >= 50 
                        ? '#f59e0b' 
                        : '#ef4444';

                    return (
                      <tr key={item.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <div style={styles.studentCell}>
                            <div style={styles.studentAvatar}>
                              {item.studentName?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <strong style={styles.studentName}>{item.studentName || '-'}</strong>
                              <div style={styles.studentMeta}>
                                <span style={styles.classBadge}>{item.studentClass || '-'}</span>
                                {item.studentNim && (
                                  <span style={styles.nimBadge}>#{item.studentNim}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.modulCell}>
                            <span style={styles.modulTitle}>{item.modulTitle || '-'}</span>
                            {item.blockTitle && (
                              <span style={styles.blockTitle}>{item.blockTitle}</span>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.timeCell}>
                            <Clock size={10} color="#94a3b8" />
                            <span>{timeString}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          {item.isLate ? (
                            <span style={styles.statusBadge('late')}>⏰ Terlambat</span>
                          ) : (
                            <span style={styles.statusBadge('ontime')}>✅ On Time</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {item.type === 'tugas' ? (
                            item.fileUrl ? (
                              <button 
                                onClick={() => window.open(item.fileUrl, '_blank')} 
                                style={styles.viewFileBtn}
                              >
                                <Download size={12} /> Lihat
                              </button>
                            ) : (
                              <span style={styles.noFile}>Tidak ada file</span>
                            )
                          ) : (
                            <span style={styles.quizAnswerBadge}>
                              ✅ {item.correctAnswers || 0}/{item.totalQuestions || '?'}
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {editingScore === item.id ? (
                            <div style={styles.scoreEdit}>
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={newScore} 
                                onChange={e => setNewScore(e.target.value)} 
                                onBlur={() => setEditingScore(null)} 
                                onKeyDown={e => e.key === 'Enter' && handleUpdateScore(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} 
                                autoFocus 
                                style={styles.scoreInput} 
                              />
                              <span style={styles.scoreMax}>/100</span>
                            </div>
                          ) : (
                            <div style={styles.scoreDisplay}>
                              <span style={{ ...styles.scoreValue, color: scoreColor }}>
                                {displayScore ?? '--'}
                              </span>
                              <span style={styles.scoreMax}>/100</span>
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionGroup}>
                            {editingScore === item.id ? (
                              <button 
                                onClick={() => handleUpdateScore(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} 
                                style={styles.actionBtn('save')}
                              >
                                <Save size={12} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => { 
                                  setEditingScore(item.id); 
                                  setNewScore(item.score?.toString() || ""); 
                                }} 
                                style={styles.actionBtn('edit')}
                                title="Edit Nilai"
                              >
                                <Edit3 size={12} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} 
                              style={styles.actionBtn('delete')}
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FOOTER INFO */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          Menampilkan {filteredData.length} dari {currentData.length} data
        </span>
        <span style={styles.footerText}>
          {guruId && <span>👨‍🏫 {guruName} ({guruId})</span>}
        </span>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: { 
    width: '100%', 
    maxWidth: 1300, 
    margin: '0 auto',
    padding: '16px 20px 40px',
    minHeight: '100vh',
    background: '#f8fafc'
  },
  
  unauthorized: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 12,
    color: '#64748b'
  },
  btnBack: {
    padding: '10px 24px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerIcon: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    padding: 10,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' },
  headerSub: { margin: '2px 0 0', fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  guruBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '1px 8px', borderRadius: 10,
    background: '#eef2ff', color: '#3b82f6',
    fontSize: 9, fontWeight: 600
  },
  mapelBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '1px 8px', borderRadius: 10,
    background: '#ede9fe', color: '#8b5cf6',
    fontSize: 9, fontWeight: 600
  },
  headerCount: { fontWeight: 600, color: '#64748b' },
  headerRight: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  refreshBtn: {
    background: 'white', border: '1px solid #e2e8f0',
    padding: '8px 10px', borderRadius: 10,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#64748b'
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'white', padding: '8px 14px',
    borderRadius: 10, border: '1px solid #e2e8f0'
  },
  searchInput: {
    border: 'none', outline: 'none', fontSize: 13,
    width: 160, background: 'transparent'
  },
  clearBtn: {
    background: 'none', border: 'none', color: '#94a3b8',
    cursor: 'pointer', fontSize: 14, padding: '0 4px'
  },
  filterBtn: (active) => ({
    background: active ? '#3b82f6' : 'white',
    border: '1px solid #e2e8f0',
    padding: '8px 10px', borderRadius: 10,
    cursor: 'pointer', color: active ? 'white' : '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }),
  
  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: 10,
    marginBottom: 16
  },
  statCard: {
    background: 'white',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #f1f5f9',
    textAlign: 'center'
  },
  statValue: { fontSize: 18, fontWeight: 900, color: '#1e293b', display: 'block' },
  statLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 500 },
  
  // Filters
  filtersPanel: {
    display: 'flex', gap: 10, flexWrap: 'wrap',
    padding: 12, background: 'white', borderRadius: 12,
    border: '1px solid #f1f5f9', marginBottom: 16
  },
  filterSelect: {
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 11,
    background: 'white', cursor: 'pointer'
  },
  resetFiltersBtn: {
    padding: '6px 12px', background: '#fee2e2',
    border: 'none', borderRadius: 8,
    color: '#ef4444', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
  },
  
  // Tabs
  tabs: {
    display: 'flex', gap: 8, marginBottom: 16
  },
  tabButton: (active) => ({
    padding: '8px 16px', borderRadius: 8,
    border: 'none', fontWeight: 700, fontSize: 12,
    cursor: 'pointer',
    background: active ? '#6366f1' : '#f1f5f9',
    color: active ? 'white' : '#64748b',
    display: 'flex', alignItems: 'center', gap: 4
  }),
  
  // Loading
  loadingState: {
    textAlign: 'center', padding: 60,
    color: '#94a3b8'
  },
  spinner: {
    width: 32, height: 32,
    border: '3px solid #f3e8ff',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 12px'
  },
  
  // Table
  tableWrapper: {
    background: 'white',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    overflow: 'hidden'
  },
  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  tableHead: { background: '#f8fafc', textAlign: 'left' },
  th: {
    padding: '10px 14px',
    fontSize: 10, color: '#64748b',
    fontWeight: 800, textTransform: 'uppercase',
    borderBottom: '2px solid #f1f5f9',
    whiteSpace: 'nowrap'
  },
  tableRow: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '10px 14px', fontSize: 12, verticalAlign: 'middle' },
  
  // Cells
  studentCell: { display: 'flex', alignItems: 'center', gap: 8 },
  studentAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 10, fontWeight: 700,
    flexShrink: 0
  },
  studentName: { fontSize: 12 },
  studentMeta: { display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' },
  classBadge: {
    fontSize: 8, color: '#3b82f6',
    background: '#eef2ff', padding: '1px 6px',
    borderRadius: 4, fontWeight: 600
  },
  nimBadge: {
    fontSize: 8, color: '#94a3b8',
    fontFamily: 'monospace'
  },
  modulCell: { display: 'flex', flexDirection: 'column', gap: 2 },
  modulTitle: { fontSize: 12, fontWeight: 500 },
  blockTitle: { fontSize: 9, color: '#94a3b8' },
  timeCell: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' },
  statusBadge: (type) => ({
    padding: '2px 8px', borderRadius: 4,
    fontSize: 9, fontWeight: 700,
    background: type === 'late' ? '#fee2e2' : '#dcfce7',
    color: type === 'late' ? '#ef4444' : '#166534'
  }),
  viewFileBtn: {
    background: '#6366f1', color: 'white',
    border: 'none', padding: '4px 10px',
    borderRadius: 6, cursor: 'pointer',
    fontSize: 9, fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', gap: 4
  },
  noFile: { fontSize: 10, color: '#94a3b8' },
  quizAnswerBadge: {
    fontSize: 10, fontWeight: 700, color: '#475569',
    background: '#f1f5f9', padding: '2px 6px', borderRadius: 4
  },
  
  // Score
  scoreEdit: { display: 'flex', alignItems: 'center', gap: 4 },
  scoreInput: {
    width: 50, border: '2px solid #6366f1',
    borderRadius: 4, textAlign: 'center',
    fontWeight: 'bold', fontSize: 14,
    padding: 2, outline: 'none'
  },
  scoreDisplay: { display: 'flex', alignItems: 'center', gap: 2 },
  scoreValue: { fontSize: 15, fontWeight: 800 },
  scoreMax: { fontSize: 9, color: '#cbd5e1' },
  
  // Actions
  actionGroup: { display: 'flex', gap: 4 },
  actionBtn: (type) => ({
    padding: '5px 8px', borderRadius: 6,
    border: 'none', cursor: 'pointer',
    background: type === 'save' ? '#10b981' : type === 'edit' ? '#f1f5f9' : '#fee2e2',
    color: type === 'save' ? 'white' : type === 'edit' ? '#475569' : '#ef4444',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }),
  
  // Empty
  emptyState: {
    textAlign: 'center', padding: 60,
    color: '#94a3b8'
  },
  
  // Footer
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    fontSize: 10,
    color: '#94a3b8',
    flexWrap: 'wrap',
    gap: 8
  },
  footerText: { display: 'flex', alignItems: 'center', gap: 4 }
};

export default CekTugasSiswa;