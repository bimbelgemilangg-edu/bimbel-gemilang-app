import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, serverTimestamp } from "firebase/firestore";
import { CheckCircle, Clock, AlertCircle, Search, Edit3, Save, Download, Trash2, FileText, HelpCircle, BarChart3, RefreshCw } from 'lucide-react';

const CekTugasSiswa = () => {
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('tugas'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [refreshing, setRefreshing] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [newScore, setNewScore] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
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
          try { await updateDoc(docRef, { score: calculatedScore, status: "Dinilai", gradedAt: serverTimestamp() }); } catch (e) {}
        }
        return { id: d.id, ...data, type: 'kuis', score: calculatedScore, status: "Dinilai" };
      });
      setQuizzes(await Promise.all(quizPromises));
    } catch (e) { console.error("Error:", e); }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleUpdateScore = async (id, collectionName) => {
    if (newScore === "" || isNaN(newScore) || newScore < 0 || newScore > 100) return alert("Nilai 0-100!");
    try {
      await updateDoc(doc(db, collectionName, id), { score: Number(newScore), status: "Dinilai", gradedAt: serverTimestamp() });
      setEditingScore(null); setNewScore(""); fetchData();
    } catch (e) { alert("Gagal: " + e.message); }
  };

  const handleDelete = async (id, collectionName) => {
    if(!window.confirm("Hapus permanen?")) return;
    try { await deleteDoc(doc(db, collectionName, id)); fetchData(); } catch (e) { alert("Gagal: " + e.message); }
  };

  const currentData = activeTab === 'tugas' ? tasks : quizzes;
  const filtered = currentData.filter(s => 
    (s.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.modulTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentClass || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ width: '100%', maxWidth: 1300, margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, flexWrap: 'wrap', gap: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#673ab7', padding: 10, borderRadius: 14 }}><BarChart3 size={22} color="white"/></div>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' }}>Pemeriksaan Hasil Belajar</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{activeTab === 'tugas' ? `${tasks.length} Tugas` : `${quizzes.length} Kuis`} • Real-time</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <Search size={16} color="#94a3b8" />
            <input placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, width: isMobile ? 120 : 200 }} />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setActiveTab('tugas')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: activeTab === 'tugas' ? '#673ab7' : '#f1f5f9', color: activeTab === 'tugas' ? 'white' : '#64748b' }}>
          <FileText size={14}/> Tugas ({tasks.length})
        </button>
        <button onClick={() => setActiveTab('kuis')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: activeTab === 'kuis' ? '#673ab7' : '#f1f5f9', color: activeTab === 'kuis' ? 'white' : '#64748b' }}>
          <HelpCircle size={14}/> Kuis ({quizzes.length})
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #f3e8ff', borderTop: '3px solid #673ab7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p>Memuat...</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: 12, fontSize: 10, color: '#64748b', fontWeight: 800, textAlign: 'left' }}>Siswa</th>
                  <th style={{ padding: 12, fontSize: 10, color: '#64748b', fontWeight: 800, textAlign: 'left' }}>Materi</th>
                  <th style={{ padding: 12, fontSize: 10, color: '#64748b', fontWeight: 800, textAlign: 'left' }}>Waktu</th>
                  <th style={{ padding: 12, fontSize: 10, color: '#64748b', fontWeight: 800, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 12, fontSize: 10, color: '#64748b', fontWeight: 800, textAlign: 'left' }}>{activeTab === 'tugas' ? 'File' : 'Jawaban'}</th>
                  <th style={{ padding: 12, fontSize: 10, color: '#64748b', fontWeight: 800, textAlign: 'left' }}>Nilai</th>
                  <th style={{ padding: 12, fontSize: 10, color: '#64748b', fontWeight: 800, textAlign: 'left' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>📭 Belum ada data.</td></tr>
                ) : filtered.map(item => {
                  let timeString = "-";
                  if (item.submittedAt) {
                    const d = item.submittedAt instanceof Timestamp ? item.submittedAt.toDate() : new Date(item.submittedAt);
                    timeString = d.toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
                  }
                  const displayScore = item.score;
                  const scoreColor = displayScore >= 75 ? '#10b981' : displayScore >= 50 ? '#f59e0b' : '#ef4444';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 10 }}>
                        <strong style={{ fontSize: 13 }}>{item.studentName || '-'}</strong>
                        <span style={{ display: 'block', fontSize: 9, color: '#673ab7', background: '#f3e8ff', padding: '2px 6px', borderRadius: 4, width: 'fit-content', marginTop: 2 }}>{item.studentClass || '-'}</span>
                      </td>
                      <td style={{ padding: 10, fontSize: 12 }}>{item.modulTitle || '-'}</td>
                      <td style={{ padding: 10, fontSize: 11, color: '#64748b' }}><Clock size={10}/> {timeString}</td>
                      <td style={{ padding: 10 }}>
                        {item.isLate ? (
                          <span style={{ color: '#ef4444', background: '#fee2e2', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>⏰ Terlambat</span>
                        ) : (
                          <span style={{ color: '#10b981', background: '#dcfce7', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>✅ On Time</span>
                        )}
                      </td>
                      <td style={{ padding: 10 }}>
                        {item.type === 'tugas' ? (
                          item.fileUrl ? <button onClick={() => window.open(item.fileUrl, '_blank')} style={{ background: '#673ab7', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}><Download size={12}/> Lihat</button> : <span style={{ fontSize: 10, color: '#94a3b8' }}>-</span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 6px', borderRadius: 4 }}>
                            ✅ {item.correctAnswers || 0}/{item.totalQuestions || '?'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 10 }}>
                        {editingScore === item.id ? (
                          <input type="number" min="0" max="100" value={newScore} onChange={e => setNewScore(e.target.value)} onBlur={() => setEditingScore(null)} onKeyDown={e => e.key === 'Enter' && handleUpdateScore(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} autoFocus style={{ width: 50, border: '2px solid #673ab7', borderRadius: 4, textAlign: 'center', fontWeight: 'bold', fontSize: 14, padding: 4 }} />
                        ) : (
                          <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor }}>{displayScore ?? '--'}</span>
                        )}
                        <span style={{ fontSize: 9, color: '#cbd5e1' }}>/100</span>
                      </td>
                      <td style={{ padding: 10 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {editingScore === item.id ? (
                            <button onClick={() => handleUpdateScore(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} style={{ background: '#10b981', color: 'white', border: 'none', padding: 5, borderRadius: 6, cursor: 'pointer' }}><Save size={12}/></button>
                          ) : (
                            <button onClick={() => { setEditingScore(item.id); setNewScore(item.score?.toString() || ""); }} style={{ background: '#f1f5f9', border: 'none', padding: 5, borderRadius: 6, cursor: 'pointer' }}><Edit3 size={12}/></button>
                          )}
                          <button onClick={() => handleDelete(item.id, item.type === 'tugas' ? 'jawaban_tugas' : 'jawaban_kuis')} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: 5, borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CekTugasSiswa;