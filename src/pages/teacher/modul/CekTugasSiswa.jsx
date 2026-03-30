import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { 
  CheckCircle, Clock, AlertCircle, Search, Edit3, Save, 
  Download, Trash2, FileText, HelpCircle, User, BookOpen 
} from 'lucide-react';

const CekTugasSiswa = () => {
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('tugas'); 
  
  const [editingScore, setEditingScore] = useState(null);
  const [newScore, setNewScore] = useState("");

  useEffect(() => {
    fetchData();
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
      console.error("Error fetching data:", e);
    }
    setLoading(false);
  };

  const handleDownloadFile = (base64String, studentName, modulTitle) => {
    if (!base64String) return alert("File tidak ditemukan!");
    try {
      const a = document.createElement("a");
      a.href = base64String;
      a.download = `Tugas_${studentName}_${modulTitle.replace(/\s+/g, '_')}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      alert("Gagal mendownload file.");
    }
  };

  const handleDelete = async (id, collectionName) => {
    if (window.confirm("Hapus data ini secara permanen dari database?")) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        fetchData();
      } catch (e) { alert("Gagal menghapus data!"); }
    }
  };

  const handleUpdateScore = async (id, collectionName) => {
    if (!newScore || isNaN(newScore)) return alert("Masukkan nilai angka yang valid!");
    try {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, { 
        score: Number(newScore),
        status: "Dinilai",
        gradedAt: new Date().toISOString()
      });
      alert("✅ Nilai berhasil disimpan!");
      setEditingScore(null);
      fetchData();
    } catch (e) { alert("Gagal update nilai"); }
  };

  const currentData = activeTab === 'tugas' ? tasks : quizzes;
  const filtered = currentData.filter(s => 
    s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.modulTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentClass?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-content-wrapper">
      <div className="teacher-container-padding">
        {/* SECTION HEADER */}
        <div style={styles.header}>
            <div style={styles.titleGroup}>
                <div style={styles.iconCircle}><BookOpen size={24} color="white"/></div>
                <div>
                    <h2 style={styles.titleText}>Pemeriksaan Tugas & Kuis</h2>
                    <p style={styles.subtitleText}>Pantau pengumpulan dan beri penilaian real-time.</p>
                </div>
            </div>
            
            <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input 
                    placeholder="Cari siswa, kelas, atau modul..." 
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* STATS SUMMARY */}
        <div style={styles.statsRow}>
            <div className="teacher-card" style={styles.statCardInline}>
                <FileText size={20} color="#673ab7"/>
                <div>
                    <span style={styles.statLabel}>TUGAS MASUK</span>
                    <span style={styles.statValue}>{tasks.length}</span>
                </div>
            </div>
            <div className="teacher-card" style={styles.statCardInline}>
                <HelpCircle size={20} color="#10b981"/>
                <div>
                    <span style={styles.statLabel}>KUIS SELESAI</span>
                    <span style={styles.statValue}>{quizzes.length}</span>
                </div>
            </div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={styles.tabContainer}>
            <button onClick={() => setActiveTab('tugas')} style={activeTab === 'tugas' ? styles.tabActive : styles.tab}>
                <FileText size={16}/> Tugas Upload
            </button>
            <button onClick={() => setActiveTab('kuis')} style={activeTab === 'kuis' ? styles.tabActive : styles.tab}>
                <HelpCircle size={16}/> Hasil Kuis
            </button>
        </div>

        {loading ? (
            <div style={styles.loadingArea}>
                <div className="spinner-global"></div>
                <p style={{marginTop: 15, fontWeight: 'bold', color: '#64748b'}}>Menganalisis pengumpulan...</p>
            </div>
        ) : (
            <div className="teacher-card" style={{padding: 0, overflow: 'hidden'}}>
                <div className="table-container">
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thr}>
                                <th style={styles.th}>Info Siswa</th>
                                <th style={styles.th}>Modul & Bagian</th>
                                <th style={styles.th}>Waktu Submit</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>File / Respon</th>
                                <th style={styles.th}>Skor</th>
                                <th style={styles.th}>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map((item) => {
                                const dateObj = item.submittedAt?.toDate();
                                const timeString = dateObj ? `${dateObj.toLocaleDateString('id-ID')} - ${dateObj.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}` : '-';
                                const colName = item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis';
                                const isLate = item.isLate || false; 

                                return (
                                    <tr key={item.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={{display:'flex', alignItems:'center', gap:10}}>
                                                <div style={styles.avatar}><User size={14} color="#64748b"/></div>
                                                <div>
                                                    <strong style={styles.studentNameText}>{item.studentName}</strong>
                                                    <span style={styles.classBadge}>KELAS: {item.studentClass || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.modulInfo}>
                                                <span style={styles.modulTitleText}>{item.modulTitle || 'Modul Tanpa Judul'}</span>
                                                <span style={styles.blockTitleText}>{item.blockTitle || 'Kuis Materi'}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.timeTag}><Clock size={12}/> {timeString}</div>
                                        </td>
                                        <td style={styles.td}>
                                            {isLate ? (
                                                <div style={styles.lateStatus}><AlertCircle size={12}/> TERLAMBAT</div>
                                            ) : (
                                                <div style={styles.onTimeStatus}><CheckCircle size={12}/> TEPAT WAKTU</div>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            {item.type === 'tugas' && item.fileUrl ? (
                                                <button onClick={() => handleDownloadFile(item.fileUrl, item.studentName, item.modulTitle)} style={styles.btnDownload}>
                                                    <Download size={14}/> Download
                                                </button>
                                            ) : (
                                                <div style={styles.kuisInfoTag}>{item.type === 'kuis' ? 'Pilihan Ganda' : 'N/A'}</div>
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
                                                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateScore(item.id, colName)}
                                                        autoFocus 
                                                    />
                                                ) : (
                                                    <span style={{
                                                        ...styles.scoreDisplay, 
                                                        color: item.score >= 75 ? '#10b981' : (item.score ? '#f43f5e' : '#94a3b8')
                                                    }}>
                                                        {item.score !== undefined && item.score !== null ? item.score : '--'}
                                                    </span>
                                                )}
                                                <span style={styles.scoreLabel}>/100</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actionGroup}>
                                                {editingScore === item.id ? (
                                                    <button onClick={() => handleUpdateScore(item.id, colName)} style={styles.btnSaveAction}><Save size={16}/></button>
                                                ) : (
                                                    <button onClick={() => {setEditingScore(item.id); setNewScore(item.score || "")}} style={styles.btnEditAction}><Edit3 size={16}/></button>
                                                )}
                                                <button onClick={() => handleDelete(item.id, colName)} style={styles.btnDeleteAction}><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="7" style={styles.emptyRow}>Tidak ada data pengumpulan.</td>
                                </tr>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  iconCircle: { background: '#673ab7', padding: '12px', borderRadius: '16px' },
  titleText: { margin: 0, color: '#1e293b', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: '800' },
  subtitleText: { color: '#64748b', fontSize: '13px', margin: 0 },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '12px 18px', borderRadius: '15px', width: 'clamp(100%, 100%, 350px)', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
  
  statsRow: { display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' },
  statCardInline: { padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e2e8f0', flex: '1 1 200px' },
  statLabel: { display: 'block', fontSize: '10px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' },
  statValue: { display: 'block', fontSize: '20px', fontWeight: '900', color: '#1e293b' },

  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', background: '#e2e8f0', color: '#64748b', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  tabActive: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', background: '#673ab7', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(103, 58, 183, 0.2)' },
  
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thr: { background: '#f8fafc', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' },
  th: { padding: '15px 20px', fontWeight: '800' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px 20px', verticalAlign: 'middle' },

  avatar: { width: 32, height: 32, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  studentNameText: { color: '#0f172a', display: 'block', fontSize: '14px', fontWeight: '700' },
  classBadge: { fontSize: '9px', color: '#673ab7', background: '#f3e8ff', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', marginTop: 3, display: 'inline-block' },

  modulInfo: { display: 'flex', flexDirection: 'column' },
  modulTitleText: { fontWeight: '700', color: '#334155', fontSize: '13px' },
  blockTitleText: { fontSize: '11px', color: '#94a3b8' },
  timeTag: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#475569', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '700' },
  
  lateStatus: { color: '#ef4444', fontWeight: '800', fontSize: '9px', background: '#fee2e2', padding: '4px 8px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: 4 },
  onTimeStatus: { color: '#10b981', fontWeight: '800', fontSize: '9px', background: '#dcfce7', padding: '4px 8px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: 4 },
  
  btnDownload: { background: '#673ab7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 'bold' },
  kuisInfoTag: { color: '#64748b', fontSize: '10px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: '600' },
  
  scoreContainer: { display: 'flex', alignItems: 'baseline', gap: 2 },
  scoreDisplay: { fontWeight: '900', fontSize: '16px' },
  scoreLabel: { fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' },
  scoreInput: { width: '50px', padding: '5px', borderRadius: '8px', border: '2px solid #673ab7', outline: 'none', textAlign: 'center', fontWeight: 'bold' },
  
  actionGroup: { display: 'flex', gap: '6px' },
  btnEditAction: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  btnSaveAction: { background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  btnDeleteAction: { background: '#fff1f2', color: '#f43f5e', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  
  loadingArea: { textAlign: 'center', padding: '100px', color: '#64748b' },
  emptyRow: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }
};

export default CekTugasSiswa;