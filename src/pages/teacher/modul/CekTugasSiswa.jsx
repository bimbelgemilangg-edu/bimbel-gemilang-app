import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, serverTimestamp 
} from "firebase/firestore";
import { 
  CheckCircle, Clock, AlertCircle, Search, Edit3, Save, 
  Download, Trash2, FileText, HelpCircle, BarChart3
} from 'lucide-react';

const CekTugasSiswa = () => {
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('tugas'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  
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
      const qTasks = query(collection(db, "jawaban_tugas"), orderBy("submittedAt", "desc"));
      const snapTasks = await getDocs(qTasks);
      setTasks(snapTasks.docs.map(d => ({ id: d.id, ...d.data(), type: 'tugas' })));

      const qQuiz = query(collection(db, "jawaban_kuis"), orderBy("submittedAt", "desc"));
      const snapQuiz = await getDocs(qQuiz);
      setQuizzes(snapQuiz.docs.map(d => ({ id: d.id, ...d.data(), type: 'kuis' })));
    } catch (e) {
      console.error("Sinkronisasi Gagal:", e);
    }
    setLoading(false);
  };

  const handleUpdateScore = async (id, collectionName) => {
    if (newScore === "" || isNaN(newScore)) return alert("Input nilai tidak valid!");
    try {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, { 
        score: Number(newScore),
        status: "Dinilai",
        gradedAt: serverTimestamp() 
      });
      setEditingScore(null);
      fetchData();
    } catch (e) { alert("Gagal memperbarui nilai"); }
  };

  const handleDelete = async (id, collectionName) => {
    if(!window.confirm("Hapus data ini permanen?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      fetchData();
    } catch (e) { alert("Gagal menghapus"); }
  };

  const currentData = activeTab === 'tugas' ? tasks : quizzes;
  const filtered = currentData.filter(s => 
    s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.modulTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentClass?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <p style={styles.subtitleText}>Data masuk real-time dari aplikasi siswa.</p>
                </div>
            </div>
            
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
                <p>Sinkronisasi Database...</p>
            </div>
        ) : (
            <div style={styles.tableCard}>
                <div style={{overflowX: 'auto'}}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thr}>
                                <th style={styles.th}>Siswa</th>
                                <th style={styles.th}>Materi / Modul</th>
                                <th style={styles.th}>Waktu Selesai</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>{activeTab === 'tugas' ? 'File' : 'Detail'}</th>
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

                                return (
                                    <tr key={item.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <strong style={styles.studentNameText}>{item.studentName}</strong>
                                            <span style={styles.classBadge}>{item.studentClass || 'Umum'}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.modulTitleText}>{item.modulTitle}</span>
                                            <span style={styles.blockTitleText}>{item.blockTitle || 'Latihan'}</span>
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
                                                <button onClick={() => window.open(item.fileUrl, '_blank')} style={styles.btnDownload}>
                                                    <Download size={14}/> Lihat File
                                                </button>
                                            ) : (
                                                <span style={styles.kuisInfoTag}>{item.correctAnswers || 0} Benar</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.scoreContainer}>
                                                {editingScore === item.id ? (
                                                    <input 
                                                        type="number" 
                                                        style={styles.scoreInput} 
                                                        value={newScore} 
                                                        onChange={(e) => setNewScore(e.target.value)}
                                                        onBlur={() => setEditingScore(null)}
                                                        autoFocus 
                                                    />
                                                ) : (
                                                    <span style={{...styles.scoreDisplay, color: item.score >= 75 ? '#10b981' : '#f43f5e'}}>
                                                        {item.score ?? '--'}
                                                    </span>
                                                )}
                                                <span style={styles.scoreLabel}>/100</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actionGroup}>
                                                {editingScore === item.id ? (
                                                    <button onClick={() => handleUpdateScore(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} style={styles.btnSaveAction}><Save size={16}/></button>
                                                ) : (
                                                    <button onClick={() => {setEditingScore(item.id); setNewScore(item.score || "")}} style={styles.btnEditAction}><Edit3 size={16}/></button>
                                                )}
                                                <button onClick={() => handleDelete(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} style={styles.btnDeleteAction}><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7" style={styles.emptyRow}>Belum ada data masuk.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

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
    maxWidth: '1200px'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  iconCircle: { background: '#673ab7', padding: '12px', borderRadius: '16px' },
  titleText: { margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: '900' },
  subtitleText: { color: '#64748b', fontSize: '13px', margin: 0 },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 18px', borderRadius: '12px', width: '320px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tab: { padding: '10px 20px', border: 'none', background: '#f1f5f9', color: '#64748b', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
  tabActive: { padding: '10px 20px', border: 'none', background: '#673ab7', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
  tableCard: { background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '15px', fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px', verticalAlign: 'middle' },
  studentNameText: { display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' },
  classBadge: { fontSize: '9px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '2px 6px', borderRadius: '5px' },
  modulTitleText: { fontWeight: '700', color: '#334155', fontSize: '13px', display: 'block' },
  blockTitleText: { fontSize: '11px', color: '#94a3b8' },
  timeTag: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '10px', fontWeight: '700', color: '#64748b' },
  lateStatus: { color: '#ef4444', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 4 },
  onTimeStatus: { color: '#10b981', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 4 },
  btnDownload: { background: '#673ab7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 },
  kuisInfoTag: { fontSize: '10px', fontWeight: '800', color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' },
  scoreDisplay: { fontSize: '16px', fontWeight: '900' },
  scoreLabel: { fontSize: '10px', color: '#cbd5e1', marginLeft: 2 },
  scoreInput: { width: '50px', border: '2px solid #673ab7', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' },
  actionGroup: { display: 'flex', gap: 5 },
  btnEditAction: { padding: '8px', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer' },
  btnSaveAction: { padding: '8px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer' },
  btnDeleteAction: { padding: '8px', borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#ef4444', cursor: 'pointer' },
  loadingArea: { padding: '100px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' },
  emptyRow: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }
};

export default CekTugasSiswa;