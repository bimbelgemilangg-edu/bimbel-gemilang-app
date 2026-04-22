import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, serverTimestamp 
} from "firebase/firestore";
import { 
  CheckCircle, Clock, AlertCircle, Search, Edit3, Save, 
  Download, Trash2, FileText, HelpCircle, BarChart3, RefreshCw
} from 'lucide-react';

const CekTugasSiswa = () => {
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('tugas'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [refreshing, setRefreshing] = useState(false);
  
  const [editingScore, setEditingScore] = useState(null);
  const [newScore, setNewScore] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // TUGAS
      const qTasks = query(collection(db, "jawaban_tugas"), orderBy("submittedAt", "desc"));
      const snapTasks = await getDocs(qTasks);
      const tasksData = snapTasks.docs.map(d => ({ id: d.id, ...d.data(), type: 'tugas' }));
      setTasks(tasksData);

      // QUIZ - FETCH DAN AUTO-HITUNG ULANG JIKA PERLU
      const qQuiz = query(collection(db, "jawaban_kuis"), orderBy("submittedAt", "desc"));
      const snapQuiz = await getDocs(qQuiz);
      
      const quizPromises = snapQuiz.docs.map(async (d) => {
        const data = d.data();
        const docRef = doc(db, "jawaban_kuis", d.id);
        
        // HITUNG SKOR
        let calculatedScore = data.score;
        let needsUpdate = false;
        
        // Jika ada correctAnswers dan totalQuestions
        if (data.correctAnswers !== undefined && data.totalQuestions && data.totalQuestions > 0) {
          const autoScore = Math.round((data.correctAnswers / data.totalQuestions) * 100);
          
          // Update jika score tidak ada atau berbeda
          if (data.score === undefined || data.score === null || data.score !== autoScore) {
            calculatedScore = autoScore;
            needsUpdate = true;
          }
        }
        
        // Juga update status jika perlu
        if (needsUpdate || data.status !== "Dinilai") {
          try {
            await updateDoc(docRef, { 
              score: calculatedScore,
              status: "Dinilai",
              gradedAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Gagal update skor:", e);
          }
        }
        
        return { 
          id: d.id, 
          ...data, 
          type: 'kuis',
          score: calculatedScore,
          status: "Dinilai"
        };
      });
      
      const resolvedQuizzes = await Promise.all(quizPromises);
      
      // SORTING MANUAL (karena orderBy sudah DESC)
      setQuizzes(resolvedQuizzes);
      
    } catch (e) {
      console.error("Sinkronisasi Gagal:", e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleUpdateScore = async (id, collectionName) => {
    if (newScore === "" || isNaN(newScore) || newScore < 0 || newScore > 100) {
      return alert("Input nilai tidak valid! Masukkan angka 0-100.");
    }
    try {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, { 
        score: Number(newScore),
        status: "Dinilai",
        gradedAt: serverTimestamp() 
      });
      setEditingScore(null);
      setNewScore("");
      fetchData();
    } catch (e) { 
      alert("Gagal memperbarui nilai: " + e.message); 
    }
  };

  const handleDelete = async (id, collectionName) => {
    if(!window.confirm("Hapus data ini permanen?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      fetchData();
    } catch (e) { 
      alert("Gagal menghapus: " + e.message); 
    }
  };

  const currentData = activeTab === 'tugas' ? tasks : quizzes;
  const filtered = currentData.filter(s => 
    (s.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.modulTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentClass || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.mainWrapper(isMobile)}>
      <div style={styles.container}>
        
        {/* HEADER SECTION */}
        <div style={styles.header}>
            <div style={styles.titleGroup}>
                <div style={styles.iconCircle}><BarChart3 size={24} color="white"/></div>
                <div>
                    <h2 style={styles.titleText}>Pemeriksaan Hasil Belajar</h2>
                    <p style={styles.subtitleText}>
                      {activeTab === 'tugas' ? `${tasks.length} Tugas` : `${quizzes.length} Kuis`} • Data real-time
                    </p>
                </div>
            </div>
            
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
                <RefreshCw size={16} style={{animation: refreshing ? 'spin 1s linear infinite' : 'none'}} />
              </button>
              <div style={styles.searchBox}>
                  <Search size={18} color="#94a3b8" />
                  <input 
                      placeholder="Cari siswa/materi..." 
                      style={styles.searchInput}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
            </div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={styles.tabContainer}>
            <button onClick={() => setActiveTab('tugas')} style={activeTab === 'tugas' ? styles.tabActive : styles.tab}>
                <FileText size={16}/> Tugas File ({tasks.length})
            </button>
            <button onClick={() => setActiveTab('kuis')} style={activeTab === 'kuis' ? styles.tabActive : styles.tab}>
                <HelpCircle size={16}/> Hasil Kuis ({quizzes.length})
            </button>
        </div>

        {loading ? (
            <div style={styles.loadingArea}>
                <div className="spinner-global"></div>
                <p>Memuat data dari server...</p>
            </div>
        ) : (
            <div style={styles.tableCard}>
                <div style={{overflowX: 'auto'}}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thr}>
                                <th style={styles.th}>Siswa</th>
                                <th style={styles.th}>Materi / Modul</th>
                                <th style={styles.th}>Waktu Submit</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>{activeTab === 'tugas' ? 'File' : 'Jawaban'}</th>
                                <th style={styles.th}>Nilai</th>
                                <th style={styles.th}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map((item) => {
                                let timeString = "-";
                                if (item.submittedAt) {
                                    const d = item.submittedAt instanceof Timestamp ? item.submittedAt.toDate() : new Date(item.submittedAt);
                                    timeString = d.toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
                                }

                                // Hitung skor tampilan
                                let displayScore = item.score;
                                let scoreColor = '#94a3b8';
                                
                                if (displayScore !== undefined && displayScore !== null) {
                                  scoreColor = displayScore >= 75 ? '#10b981' : displayScore >= 50 ? '#f59e0b' : '#ef4444';
                                }

                                return (
                                    <tr key={item.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <strong style={styles.studentNameText}>
                                              {item.studentName || 'Tanpa Nama'}
                                            </strong>
                                            <span style={styles.classBadge}>{item.studentClass || 'Umum'}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.modulTitleText}>{item.modulTitle || '-'}</span>
                                            <span style={styles.blockTitleText}>{item.blockTitle || ''}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.timeTag}><Clock size={12}/> {timeString}</div>
                                        </td>
                                        <td style={styles.td}>
                                            {item.isLate ? (
                                                <div style={styles.lateStatus}><AlertCircle size={12}/> Terlambat</div>
                                            ) : (
                                                <div style={styles.onTimeStatus}><CheckCircle size={12}/> On Time</div>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            {item.type === 'tugas' ? (
                                                item.fileUrl ? (
                                                  <button onClick={() => window.open(item.fileUrl, '_blank')} style={styles.btnDownload}>
                                                      <Download size={14}/> Lihat File
                                                  </button>
                                                ) : (
                                                  <span style={{fontSize: 11, color: '#94a3b8'}}>Tidak ada file</span>
                                                )
                                            ) : (
                                                <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                                                    <span style={styles.kuisInfoTag}>
                                                        ✅ {item.correctAnswers || 0} / {item.totalQuestions || '?'} Benar
                                                    </span>
                                                    {item.correctAnswers !== undefined && item.totalQuestions && (
                                                        <span style={styles.scorePreview}>
                                                            {Math.round((item.correctAnswers / item.totalQuestions) * 100)}%
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.scoreContainer}>
                                                {editingScore === item.id ? (
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        max="100"
                                                        style={styles.scoreInput} 
                                                        value={newScore} 
                                                        onChange={(e) => setNewScore(e.target.value)}
                                                        onBlur={() => {
                                                          if (newScore) {
                                                            handleUpdateScore(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis');
                                                          } else {
                                                            setEditingScore(null);
                                                          }
                                                        }}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter') {
                                                            handleUpdateScore(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis');
                                                          }
                                                        }}
                                                        autoFocus 
                                                    />
                                                ) : (
                                                    <span style={{...styles.scoreDisplay, color: scoreColor}}>
                                                        {displayScore ?? '--'}
                                                    </span>
                                                )}
                                                <span style={styles.scoreLabel}>/100</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actionGroup}>
                                                {editingScore === item.id ? (
                                                    <button 
                                                      onClick={() => handleUpdateScore(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} 
                                                      style={styles.btnSaveAction}
                                                    >
                                                      <Save size={16}/>
                                                    </button>
                                                ) : (
                                                    <button 
                                                      onClick={() => {
                                                        setEditingScore(item.id); 
                                                        setNewScore(item.score?.toString() || "");
                                                      }} 
                                                      style={styles.btnEditAction}
                                                    >
                                                      <Edit3 size={16}/>
                                                    </button>
                                                )}
                                                <button 
                                                  onClick={() => handleDelete(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} 
                                                  style={styles.btnDeleteAction}
                                                >
                                                  <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                  <td colSpan="7" style={styles.emptyRow}>
                                    {activeTab === 'tugas' 
                                      ? '📭 Belum ada tugas yang dikumpulkan siswa.' 
                                      : '📭 Belum ada siswa yang mengerjakan kuis.'}
                                  </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        
        {/* CSS Animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner-global {
            width: 40px;
            height: 40px;
            border: 4px solid #f3e8ff;
            border-top: 4px solid #673ab7;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
          }
        `}</style>
      </div>
    </div>
  );
};

// STYLES
const styles = {
  mainWrapper: (isMobile) => ({
    minHeight: '100vh',
    background: '#f8fafc',
    marginLeft: isMobile ? '0' : '260px',
    padding: isMobile ? '15px' : '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'margin-left 0.3s ease'
  }),
  container: {
    width: '100%',
    maxWidth: '1300px'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  iconCircle: { background: '#673ab7', padding: '12px', borderRadius: '16px' },
  titleText: { margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: '900' },
  subtitleText: { color: '#64748b', fontSize: '13px', margin: 0 },
  refreshBtn: { 
    background: 'white', 
    border: '1px solid #e2e8f0', 
    padding: '10px 15px', 
    borderRadius: '12px', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 18px', borderRadius: '12px', width: '320px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tab: { padding: '10px 20px', border: 'none', background: '#f1f5f9', color: '#64748b', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
  tabActive: { padding: '10px 20px', border: 'none', background: '#673ab7', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
  tableCard: { background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '15px', fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px', verticalAlign: 'middle' },
  studentNameText: { display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' },
  classBadge: { fontSize: '9px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '2px 6px', borderRadius: '5px', marginLeft: '6px' },
  modulTitleText: { fontWeight: '700', color: '#334155', fontSize: '13px', display: 'block' },
  blockTitleText: { fontSize: '11px', color: '#94a3b8' },
  timeTag: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '10px', fontWeight: '700', color: '#64748b' },
  lateStatus: { color: '#ef4444', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' },
  onTimeStatus: { color: '#10b981', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' },
  btnDownload: { background: '#673ab7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 },
  kuisInfoTag: { fontSize: '10px', fontWeight: '800', color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' },
  scorePreview: { fontSize: '9px', fontWeight: '900', color: '#10b981', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start' },
  scoreDisplay: { fontSize: '16px', fontWeight: '900' },
  scoreLabel: { fontSize: '10px', color: '#cbd5e1', marginLeft: 2 },
  scoreContainer: { display: 'flex', alignItems: 'center', gap: 4 },
  scoreInput: { width: '60px', border: '2px solid #673ab7', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', padding: '4px', outline: 'none' },
  actionGroup: { display: 'flex', gap: 5 },
  btnEditAction: { padding: '8px', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnSaveAction: { padding: '8px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnDeleteAction: { padding: '8px', borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingArea: { padding: '100px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' },
  emptyRow: { padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }
};

export default CekTugasSiswa;