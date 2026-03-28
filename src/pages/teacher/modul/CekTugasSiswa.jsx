import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { CheckCircle, Clock, AlertCircle, Search, Edit3, Save, Download, Trash2, FileText, HelpCircle } from 'lucide-react';

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
    if (window.confirm("Hapus data ini?")) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        fetchData();
      } catch (e) { alert("Gagal menghapus data!"); }
    }
  };

  const handleUpdateScore = async (id, collectionName) => {
    try {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, { 
        score: Number(newScore),
        status: "Dinilai"
      });
      alert("Nilai berhasil disimpan!");
      setEditingScore(null);
      fetchData();
    } catch (e) { alert("Gagal update nilai"); }
  };

  const currentData = activeTab === 'tugas' ? tasks : quizzes;
  const filtered = currentData.filter(s => 
    s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.modulTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{margin: 0, color: '#1e293b'}}>📋 Pusat Pemeriksaan Tugas & Kuis</h2>
          <p style={{color: '#64748b', fontSize: '14px', marginTop: 5}}>Pantau ketepatan waktu dan beri nilai hasil belajar siswa.</p>
        </div>
        
        <div style={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input 
                placeholder="Cari siswa atau modul..." 
                style={styles.searchInput}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div style={styles.tabContainer}>
        <button onClick={() => setActiveTab('tugas')} style={activeTab === 'tugas' ? styles.tabActive : styles.tab}>
          <FileText size={16}/> Tugas Upload ({tasks.length})
        </button>
        <button onClick={() => setActiveTab('kuis')} style={activeTab === 'kuis' ? styles.tabActive : styles.tab}>
          <HelpCircle size={16}/> Hasil Kuis ({quizzes.length})
        </button>
      </div>

      {loading ? <p style={{textAlign:'center', padding:40}}>Memuat data cerdas...</p> : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th style={styles.th}>Siswa & Kelas</th>
                <th style={styles.th}>Materi / Bagian</th>
                <th style={styles.th}>Waktu Pengumpulan</th>
                <th style={styles.th}>Status Waktu</th>
                <th style={styles.th}>Jawaban</th>
                <th style={styles.th}>Nilai</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const dateObj = item.submittedAt?.toDate();
                const timeString = dateObj ? `${dateObj.toLocaleDateString('id-ID')} ${dateObj.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}` : '-';
                const colName = item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis';

                return (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong style={{color:'#0f172a', display:'block'}}>{item.studentName}</strong>
                      <span style={{fontSize:12, color:'#64748b'}}>Kelas: {item.studentClass || '-'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{fontWeight:'bold'}}>{item.modulTitle || 'Modul Tanpa Judul'}</span><br/>
                      <span style={{fontSize:11, color:'#673ab7'}}>{item.blockTitle || 'Kuis'}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.timeTag}><Clock size={12}/> {timeString}</div>
                    </td>
                    <td style={styles.td}>
                      {/* UPDATE: Indikator Keterlambatan Otomatis */}
                      {item.isLate ? (
                        <span style={{color: '#ef4444', fontWeight: 'bold', fontSize: 11, background: '#fee2e2', padding: '4px 8px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: 4}}>
                          <AlertCircle size={12}/> TERLAMBAT
                        </span>
                      ) : (
                        <span style={{color: '#10b981', fontWeight: 'bold', fontSize: 11, background: '#dcfce7', padding: '4px 8px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: 4}}>
                          <CheckCircle size={12}/> TEPAT WAKTU
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {item.type === 'tugas' && item.fileUrl ? (
                        <button onClick={() => handleDownloadFile(item.fileUrl, item.studentName, item.modulTitle)} style={styles.btnDownload}>
                          <Download size={14}/> Unduh
                        </button>
                      ) : item.type === 'kuis' ? (
                        <span style={{color:'#64748b', fontSize:12}}>Data Terinput</span>
                      ) : '-'}
                    </td>
                    <td style={styles.td}>
                      {editingScore === item.id ? (
                        <input type="number" style={styles.scoreInput} value={newScore} onChange={(e) => setNewScore(e.target.value)} autoFocus />
                      ) : (
                        <span style={{fontWeight:'bold', fontSize:15, color: item.score ? '#10b981' : '#f43f5e'}}>
                          {item.score || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={{display:'flex', gap:8}}>
                        {editingScore === item.id ? (
                          <button onClick={() => handleUpdateScore(item.id, colName)} style={styles.btnSave}><Save size={14}/></button>
                        ) : (
                          <button onClick={() => {setEditingScore(item.id); setNewScore(item.score || "")}} style={styles.btnEdit}><Edit3 size={14}/></button>
                        )}
                        <button onClick={() => handleDelete(item.id, colName)} style={styles.btnDelete}>
                          <Trash2 size={14}/>
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
  );
};

const styles = {
  container: { padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 15px', borderRadius: '12px', width: '300px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tab: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', background: '#e2e8f0', color: '#64748b', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', background: '#673ab7', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  tableWrapper: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thr: { background: '#f8fafc', color: '#475569', fontSize: '12px', textTransform: 'uppercase' },
  th: { padding: '15px 20px', fontWeight: 'bold' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px 20px', fontSize: '13px', color: '#334155' },
  timeTag: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#475569', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' },
  btnDownload: { background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' },
  scoreInput: { width: '50px', padding: '5px', borderRadius: '5px', border: '2px solid #673ab7', outline: 'none', textAlign: 'center' },
  btnEdit: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  btnSave: { background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  btnDelete: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }
};

export default CekTugasSiswa;