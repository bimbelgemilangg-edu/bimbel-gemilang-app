// src/pages/teacher/modul/CekTugasSiswa.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, 
  query, where, serverTimestamp 
} from "firebase/firestore";
import { 
  CheckCircle, Clock, Search, Edit3, Save, 
  Trash2, FileText, HelpCircle, BarChart3, RefreshCw, 
  User, Hash, Tag, Filter, X, BookOpen, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// 🔥 Render math sederhana (sama seperti di ManageQuiz/StudentQuizView)
const renderMath = (text) => {
  if (!text) return null;
  const parts = String(text).split(/(\$\$.*?\$\$|\$.*?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return <BlockMath key={i} math={part.substring(2, part.length - 2)} />; }
      catch (e) { return <span key={i}>{part}</span>; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={i} math={part.substring(1, part.length - 1)} />; }
      catch (e) { return <span key={i}>{part}</span>; }
    }
    return <span key={i}>{part}</span>;
  });
};

// 🔥 Ringkasan jawaban per tipe soal (buat modal detail guru)
const describeAnswer = (q, which) => {
  const ans = which === 'user' ? q.userAnswer : null;
  switch (q.type) {
    case 'multiple':
      return which === 'user'
        ? (ans !== undefined && q.options?.[ans] !== undefined ? q.options[ans] : 'Tidak dijawab')
        : (q.options?.[q.correctAnswer] ?? '-');
    case 'multiselect':
      if (which === 'user') {
        return Array.isArray(ans) && ans.length ? ans.map(i => q.options?.[i]).join(', ') : 'Tidak dijawab';
      }
      return (q.correctAnswers || []).map(i => q.options?.[i]).join(', ');
    case 'shortanswer':
      return which === 'user' ? (ans || 'Tidak dijawab') : (q.shortAnswer || '-');
    case 'truefalse':
      return (q.statements || []).map((s, idx) => {
        const val = which === 'user' ? q.userAnswer?.[idx] : s.isTrue;
        return `${s.text || `Pernyataan ${idx + 1}`}: ${val === true ? 'Benar' : val === false ? 'Salah' : '-'}`;
      }).join(' | ');
    case 'causeeffect':
      if (which === 'user') {
        return `Sebab: ${q.userAnswer?.cause === true ? 'Benar' : q.userAnswer?.cause === false ? 'Salah' : '-'}, Akibat: ${q.userAnswer?.effect === true ? 'Benar' : q.userAnswer?.effect === false ? 'Salah' : '-'}`;
      }
      return `Sebab: ${q.isCauseTrue ? 'Benar' : 'Salah'}, Akibat: ${q.isEffectTrue ? 'Benar' : 'Salah'}`;
    case 'matching':
      return (q.matchingPairs || []).map((p, idx) => {
        const rightIdx = which === 'user' ? q.userAnswer?.[idx] : idx;
        const rightText = rightIdx !== undefined ? q.matchingPairs?.[rightIdx]?.right : '-';
        return `${p.left} → ${rightText || '-'}`;
      }).join(' | ');
    case 'reading':
      return (q.subQuestions || []).map((sq, idx) => {
        const oIdx = which === 'user' ? q.userAnswer?.[idx] : sq.correct;
        return `${idx + 1}. ${oIdx !== undefined ? sq.options?.[oIdx] : '-'}`;
      }).join(' | ');
    default:
      return '-';
  }
};

const CekTugasSiswa = () => {
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tugas');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [refreshing, setRefreshing] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [newScore, setNewScore] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showFilters, setShowFilters] = useState(false);
  
  const [guruData, setGuruData] = useState(null);
  const [guruId, setGuruId] = useState('');
  const [kodeMapel, setKodeMapel] = useState('');
  const [guruName, setGuruName] = useState('');
  const [mapelList, setMapelList] = useState([]);

  const [stats, setStats] = useState({ totalTugas: 0, pendingTugas: 0, gradedTugas: 0, totalKuis: 0, avgScore: 0 });
  const [viewingDetail, setViewingDetail] = useState(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ===== AMBIL DATA GURU =====
  useEffect(() => {
    const init = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
        const name = saved.nama || '';
        const id = saved.guruId || saved.id || '';
        setGuruId(id);
        setGuruName(name);

        if (name) {
          const q = query(collection(db, "teachers"), where("nama", "==", name));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const guru = snap.docs[0].data();
            setGuruData(guru);
            setKodeMapel(guru.kodeMapel || '');
            // 🔥 Simpan SEMUA variasi mapel (capitalized, uppercase, lowercase)
            // — ini tetap dipertahankan sebagai FALLBACK untuk data submission
            // lama yang belum punya guruId (lihat filterByOwner di bawah).
            const mapelVariations = [];
            if (guru.mapel) {
              mapelVariations.push(guru.mapel);
              mapelVariations.push(guru.mapel.toUpperCase());
              mapelVariations.push(guru.mapel.toLowerCase());
              mapelVariations.push(guru.mapel.charAt(0).toUpperCase() + guru.mapel.slice(1).toLowerCase());
            }
            setMapelList([...new Set(mapelVariations)]);
          }
        }
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  // ===== FETCH DATA - CLIENT-SIDE FILTER =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
      const guruMapel = saved.mapel || '';
      const myGuruId = saved.guruId || saved.id || '';
      
      // 🔥 Ambil SEMUA data dulu (1 query per koleksi)
      const [snapT, snapQ] = await Promise.all([
        getDocs(collection(db, "jawaban_tugas")),
        getDocs(collection(db, "jawaban_kuis"))
      ]);
      
      const allTasks = snapT.docs.map(d => ({ id: d.id, ...d.data(), type: 'tugas' }));
      const allQuizzes = snapQ.docs.map(d => ({ id: d.id, ...d.data(), type: 'kuis' }));

      // 🔥 Gabungkan semua variasi mapel untuk filter FALLBACK (nama teks)
      const mapelVariations = [...new Set([
        kodeMapel,
        guruMapel,
        guruMapel?.toUpperCase(),
        guruMapel?.toLowerCase(),
        guruData?.mapel,
        guruData?.mapel?.toUpperCase(),
        guruData?.mapel?.toLowerCase(),
        ...mapelList
      ].filter(Boolean))];

      // 🔥 FIX UTAMA: dulu filter SATU-SATUNYA cara adalah cocok-cocokan nama
      // mapel (rapuh — gampang meleset kalau ada perbedaan kapitalisasi, spasi,
      // atau kuis dibuat dengan label mapel yang beda dari mapel utama guru).
      // Sekarang PRIORITAS UTAMA: cocokkan guruId (ID unik, akurat, gak bisa
      // salah). Fallback ke cocok-cocokan nama mapel HANYA untuk submission
      // lama yang dokumennya belum punya field guruId sama sekali.
      const filterByOwner = (item) => {
        // Prioritas 1: match berdasarkan guruId (akurat)
        if (item.guruId) {
          return myGuruId && item.guruId === myGuruId;
        }
        // Fallback: data lama tanpa guruId, tetap pakai cocok-cocokan nama
        if (mapelVariations.length === 0) return true; // Tampilkan semua kalau guru belum ada data mapel
        const itemSubject = (item.subject || '').toLowerCase();
        const itemModulTitle = (item.modulTitle || '').toLowerCase();
        return mapelVariations.some(m => {
          const ml = m.toLowerCase();
          return itemSubject.includes(ml) || itemModulTitle.includes(ml);
        });
      };

      const filteredTasks = allTasks.filter(filterByOwner);
      const filteredQuizzes = allQuizzes.filter(filterByOwner);

      // Auto-hitung skor kuis
      const updatedQuizzes = filteredQuizzes.map(q => {
        if (q.correctAnswers !== undefined && q.totalQuestions && q.totalQuestions > 0) {
          const autoScore = Math.round((q.correctAnswers / q.totalQuestions) * 100);
          if (!q.score || q.score !== autoScore) {
            return { ...q, score: autoScore, status: 'Dinilai' };
          }
        }
        return q;
      });

      setTasks(filteredTasks);
      setQuizzes(updatedQuizzes);

      setStats({
        totalTugas: filteredTasks.length,
        pendingTugas: filteredTasks.filter(t => !t.score || t.status === 'Pending').length,
        gradedTugas: filteredTasks.filter(t => t.score && t.status !== 'Pending').length,
        totalKuis: updatedQuizzes.length,
        avgScore: updatedQuizzes.length 
          ? Math.round(updatedQuizzes.reduce((a, q) => a + (q.score || 0), 0) / updatedQuizzes.length) 
          : 0
      });
    } catch (e) { 
      console.error("Error fetch:", e); 
    }
    setLoading(false);
    setRefreshing(false);
  }, [kodeMapel, guruData, mapelList]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  // ===== UPDATE SCORE =====
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
    } catch (e) { alert("Gagal: " + e.message); }
  };

  // ===== DELETE =====
  const handleDelete = async (id, collectionName) => {
    if (!window.confirm("⚠️ Hapus permanen?")) return;
    try { 
      await deleteDoc(doc(db, collectionName, id)); 
      fetchData(); 
    } catch (e) { alert("Gagal: " + e.message); }
  };

  // ===== FILTER =====
  const currentData = useMemo(() => activeTab === 'tugas' ? tasks : quizzes, [activeTab, tasks, quizzes]);

  const filteredData = useMemo(() => {
    let data = currentData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item => 
        (item.studentName || '').toLowerCase().includes(term) ||
        (item.modulTitle || '').toLowerCase().includes(term) ||
        (item.studentNim || '').toLowerCase().includes(term)
      );
    }
    if (filterStatus === 'Pending') data = data.filter(item => !item.score || item.status === 'Pending');
    if (filterStatus === 'Dinilai') data = data.filter(item => item.score && item.status !== 'Pending');
    return data;
  }, [currentData, searchTerm, filterStatus]);

  // ===== RENDER =====
  if (loading && tasks.length === 0) {
    return (
      <div style={s.center}>
        <div style={s.spinner}></div>
        <p style={{color:'#94a3b8',marginTop:12}}>Memuat data...</p>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin .8s linear infinite}`}</style>

      {/* HEADER */}
      <div style={s.header}>
        <div style={s.hLeft}>
          <div style={s.hIcon}><BarChart3 size={20} color="white"/></div>
          <div>
            <h2 style={s.hTitle}>Pemeriksaan Hasil Belajar</h2>
            <div style={s.hMeta}>
              {guruId && <span style={s.badge}><Hash size={10}/> {guruId}</span>}
              {kodeMapel && <span style={s.badge2}><Tag size={10}/> {kodeMapel}</span>}
              <span>{currentData.length} data</span>
            </div>
          </div>
        </div>
        <div style={s.hRight}>
          <button onClick={handleRefresh} disabled={refreshing} style={s.btnR}>
            <RefreshCw size={16} className={refreshing?'spin':''}/>
          </button>
          <div style={s.searchBox}>
            <Search size={14} color="#94a3b8"/>
            <input placeholder="Cari..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={s.searchIn}/>
            {searchTerm && <button onClick={()=>setSearchTerm('')} style={s.btnX}><X size={12}/></button>}
          </div>
          <button onClick={()=>setShowFilters(!showFilters)} style={s.btnF(showFilters)}><Filter size={14}/></button>
        </div>
      </div>

      {/* STATS */}
      <div style={s.stats}>
        {[
          {v:stats.totalTugas,l:'Total Tugas',c:'📝'},
          {v:stats.pendingTugas,l:'Perlu Dinilai',c:'⏳'},
          {v:stats.gradedTugas,l:'Sudah Dinilai',c:'✅'},
          {v:stats.totalKuis,l:'Total Kuis',c:'❓'},
          {v:stats.avgScore+'%',l:'Rata-rata',c:'⭐'},
        ].map((st,i)=>(
          <div key={i} style={s.statCard}>
            <span style={s.statV}>{st.v}</span>
            <span style={s.statL}>{st.c} {st.l}</span>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      {showFilters && (
        <div style={s.filterBar}>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={s.sel}>
            <option value="Semua">Semua Status</option>
            <option value="Pending">Perlu Dinilai</option>
            <option value="Dinilai">Sudah Dinilai</option>
          </select>
          <button onClick={()=>{setFilterStatus('Semua');setSearchTerm('')}} style={s.btnReset}><X size={12}/> Reset</button>
        </div>
      )}

      {/* TABS */}
      <div style={s.tabs}>
        <button onClick={()=>setActiveTab('tugas')} style={s.tab(activeTab==='tugas')}><FileText size={14}/> Tugas ({tasks.length})</button>
        <button onClick={()=>setActiveTab('kuis')} style={s.tab(activeTab==='kuis')}><HelpCircle size={14}/> Kuis ({quizzes.length})</button>
      </div>

      {/* TABLE */}
      <div style={s.tableWrap}>
        {filteredData.length === 0 ? (
          <div style={s.empty}>
            <BookOpen size={48} color="#cbd5e1"/>
            <h4>Belum ada data</h4>
            <p>{searchTerm?'Tidak ditemukan.':'Siswa belum mengirim tugas/kuis.'}</p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Siswa</th>
                  <th style={s.th}>Materi</th>
                  <th style={s.th}>Waktu</th>
                  <th style={s.th}>{activeTab==='tugas'?'File':'Jawaban'}</th>
                  <th style={s.th}>Nilai</th>
                  <th style={s.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(item => {
                  // 🔥 Format tanggal yang aman
                  let tStr = '-';
                  try {
                    if (item.submittedAt?.toDate) {
                      tStr = item.submittedAt.toDate().toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
                    } else if (item.submittedAt) {
                      const d = new Date(item.submittedAt);
                      if (!isNaN(d.getTime())) {
                        tStr = d.toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
                      }
                    }
                  } catch(e) { /* biarkan '-' */ }
                  
                  const sc = item.score;
                  const scColor = sc>=75?'#10b981':sc>=50?'#f59e0b':'#ef4444';
                  const coll = item.type==='tugas'?'jawaban_tugas':'jawaban_kuis';
                  
                  return (
                    <tr key={item.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={s.stuCell}>
                          <div style={s.av}>{item.studentName?.charAt(0)||'S'}</div>
                          <div>
                            <strong>{item.studentName||'-'}</strong>
                            <div style={s.meta}>
                              <span style={s.cls}>{item.studentClass||'-'}</span>
                              {item.studentNim && <span style={s.nim}>#{item.studentNim}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div>
                          <div style={s.mTitle}>{item.modulTitle||'-'}</div>
                          {item.blockTitle && <small style={{color:'#94a3b8'}}>{item.blockTitle}</small>}
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={{fontSize:11,color:'#64748b'}}><Clock size={10}/> {tStr}</span>
                      </td>
                      <td style={s.td}>
                        {item.type==='tugas' ? (
                          item.fileUrl ? (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" style={s.btnView}><Eye size={12}/> Lihat</a>
                          ) : <span style={{fontSize:10,color:'#94a3b8'}}>-</span>
                        ) : (
                          <span
                            style={{...s.quizBadge, cursor: item.details?.length ? 'pointer' : 'default', textDecoration: item.details?.length ? 'underline' : 'none'}}
                            onClick={() => item.details?.length && setViewingDetail(item)}
                          >
                            ✅ {item.correctAnswers||0}/{item.totalQuestions||'?'} {item.details?.length ? '👁️' : ''}
                          </span>
                        )}
                      </td>
                      <td style={s.td}>
                        {editingScore===item.id ? (
                          <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <input type="number" min="0" max="100" value={newScore} onChange={e=>setNewScore(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleUpdateScore(item.id,coll)} autoFocus style={s.scoreIn}/>
                            <button onClick={()=>handleUpdateScore(item.id,coll)} style={s.btnSave}><Save size={12}/></button>
                          </div>
                        ) : (
                          <div style={{display:'flex',alignItems:'center',gap:2,cursor:'pointer'}} onClick={()=>{setEditingScore(item.id);setNewScore(item.score?.toString()||'')}}>
                            <span style={{fontSize:15,fontWeight:800,color:scColor}}>{sc??'--'}</span>
                            <span style={{fontSize:9,color:'#cbd5e1'}}>/100</span>
                          </div>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={{display:'flex',gap:4}}>
                          {editingScore!==item.id && (
                            <button onClick={()=>{setEditingScore(item.id);setNewScore(item.score?.toString()||'')}} style={s.btnEdit}><Edit3 size={12}/></button>
                          )}
                          <button onClick={()=>handleDelete(item.id,coll)} style={s.btnDel}><Trash2 size={12}/></button>
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

      <div style={s.footer}>
        <span>{filteredData.length} dari {currentData.length} data</span>
        <span>{guruName && `👨‍🏫 ${guruName}`}</span>
      </div>

      {/* ========================================================== */}
      {/* MODAL DETAIL JAWABAN KUIS — guru bisa cek per soal + bahas */}
      {/* ========================================================== */}
      {viewingDetail && (
        <div style={s.modalOverlay} onClick={() => setViewingDetail(null)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>{viewingDetail.studentName}</h3>
                <p style={s.modalSub}>{viewingDetail.modulTitle} — Nilai: {viewingDetail.score ?? '-'}/100 ({viewingDetail.correctAnswers}/{viewingDetail.totalQuestions} benar)</p>
              </div>
              <button onClick={() => setViewingDetail(null)} style={s.modalCloseBtn}><X size={18}/></button>
            </div>
            <div style={s.modalBody}>
              {(viewingDetail.details || []).map((q, idx) => {
                const partial = q.partsTotal ? (q.isCorrect ? null : (q.partsCorrect > 0 ? `🟡 ${q.partsCorrect}/${q.partsTotal} benar` : null)) : null;
                return (
                  <div key={q.id || idx} style={s.qCard(q.isCorrect)}>
                    <div style={s.qHeader}>
                      <span style={s.qNum}>Soal {idx + 1}</span>
                      <span style={s.qStatus(q.isCorrect)}>
                        {q.isCorrect ? '✅ Benar' : partial || '❌ Salah'}
                      </span>
                    </div>
                    <div style={s.qText}>{renderMath(q.question)}</div>
                    <div style={s.qAnswerRow}>
                      <span style={s.qAnswerLabelUser}>📝 Jawaban siswa:</span> {renderMath(describeAnswer(q, 'user'))}
                    </div>
                    <div style={s.qAnswerRow}>
                      <span style={s.qAnswerLabelCorrect}>🔑 Jawaban benar:</span> {renderMath(describeAnswer(q, 'correct'))}
                    </div>
                    {q.explanation && (
                      <div style={s.qExplanation}>
                        <span style={{fontWeight:700}}>💡 Pembahasan:</span> {renderMath(q.explanation)}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!viewingDetail.details || viewingDetail.details.length === 0) && (
                <p style={{textAlign:'center', color:'#94a3b8', padding: 20}}>Detail jawaban tidak tersedia untuk submission ini.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const s = {
  wrap: { width:'100%', maxWidth:1300, margin:'0 auto', padding:'16px 20px 40px', minHeight:'100vh', background:'#f8fafc' },
  center: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh' },
  spinner: { width:32, height:32, border:'3px solid #e2e8f0', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 1s linear infinite' },
  
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 },
  hLeft: { display:'flex', alignItems:'center', gap:12 },
  hIcon: { background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:10, borderRadius:14 },
  hTitle: { margin:0, fontSize:18, fontWeight:800, color:'#1e293b' },
  hMeta: { fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' },
  badge: { display:'inline-flex',alignItems:'center',gap:3,padding:'1px 8px',borderRadius:10,background:'#eef2ff',color:'#3b82f6',fontSize:9,fontWeight:600 },
  badge2: { display:'inline-flex',alignItems:'center',gap:3,padding:'1px 8px',borderRadius:10,background:'#ede9fe',color:'#8b5cf6',fontSize:9,fontWeight:600 },
  hRight: { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' },
  btnR: { background:'white',border:'1px solid #e2e8f0',padding:'8px 10px',borderRadius:10,cursor:'pointer',color:'#64748b' },
  searchBox: { display:'flex',alignItems:'center',gap:8,background:'white',padding:'8px 14px',borderRadius:10,border:'1px solid #e2e8f0' },
  searchIn: { border:'none',outline:'none',fontSize:13,width:140,background:'transparent' },
  btnX: { background:'none',border:'none',color:'#94a3b8',cursor:'pointer' },
  btnF: (active) => ({ background:active?'#3b82f6':'white',border:'1px solid #e2e8f0',padding:'8px 10px',borderRadius:10,cursor:'pointer',color:active?'white':'#64748b' }),
  
  stats: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:10, marginBottom:16 },
  statCard: { background:'white', padding:'10px 14px', borderRadius:10, border:'1px solid #f1f5f9', textAlign:'center' },
  statV: { fontSize:18, fontWeight:900, color:'#1e293b', display:'block' },
  statL: { fontSize:9, color:'#94a3b8' },
  
  filterBar: { display:'flex',gap:10,padding:12,background:'white',borderRadius:12,border:'1px solid #f1f5f9',marginBottom:16 },
  sel: { padding:'6px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:11,background:'white',cursor:'pointer' },
  btnReset: { padding:'6px 12px',background:'#fee2e2',border:'none',borderRadius:8,color:'#ef4444',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 },
  
  tabs: { display:'flex',gap:8,marginBottom:16 },
  tab: (active) => ({ padding:'8px 16px',borderRadius:8,border:'none',fontWeight:700,fontSize:12,cursor:'pointer',background:active?'#6366f1':'#f1f5f9',color:active?'white':'#64748b',display:'flex',alignItems:'center',gap:4 }),
  
  tableWrap: { background:'white',borderRadius:16,border:'1px solid #e2e8f0',overflow:'hidden' },
  table: { width:'100%',borderCollapse:'collapse',minWidth:800 },
  thead: { background:'#f8fafc' },
  th: { padding:'10px 14px',fontSize:10,color:'#64748b',fontWeight:800,textTransform:'uppercase',borderBottom:'2px solid #f1f5f9',textAlign:'left',whiteSpace:'nowrap' },
  tr: { borderBottom:'1px solid #f1f5f9' },
  td: { padding:'10px 14px',fontSize:12,verticalAlign:'middle' },
  stuCell: { display:'flex',alignItems:'center',gap:8 },
  av: { width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0 },
  meta: { display:'flex',gap:4,alignItems:'center',flexWrap:'wrap' },
  cls: { fontSize:8,color:'#3b82f6',background:'#eef2ff',padding:'1px 6px',borderRadius:4,fontWeight:600 },
  nim: { fontSize:8,color:'#94a3b8',fontFamily:'monospace' },
  mTitle: { fontSize:12,fontWeight:500 },
  btnView: { background:'#6366f1',color:'white',border:'none',padding:'4px 10px',borderRadius:6,cursor:'pointer',fontSize:9,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4,textDecoration:'none' },
  quizBadge: { fontSize:10,fontWeight:700,color:'#475569',background:'#f1f5f9',padding:'2px 6px',borderRadius:4 },
  scoreIn: { width:50,border:'2px solid #6366f1',borderRadius:4,textAlign:'center',fontWeight:'bold',fontSize:14,padding:2,outline:'none' },
  btnSave: { padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',background:'#10b981',color:'white' },
  btnEdit: { padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',background:'#f1f5f9',color:'#475569' },
  btnDel: { padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',background:'#fee2e2',color:'#ef4444' },
  empty: { textAlign:'center',padding:60,color:'#94a3b8' },
  footer: { display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontSize:10,color:'#94a3b8',flexWrap:'wrap',gap:8 },

  // Modal detail jawaban
  modalOverlay: { position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modalContent: { background:'white', borderRadius:16, width:'100%', maxWidth:700, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 50px rgba(0,0,0,0.3)' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'18px 20px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'white', zIndex:1 },
  modalTitle: { margin:0, fontSize:16, fontWeight:800, color:'#1e293b' },
  modalSub: { margin:'4px 0 0', fontSize:12, color:'#64748b' },
  modalCloseBtn: { background:'#f1f5f9', border:'none', borderRadius:8, padding:6, cursor:'pointer', flexShrink:0 },
  modalBody: { padding:20, display:'flex', flexDirection:'column', gap:12 },
  qCard: (correct) => ({ padding:14, borderRadius:10, border:`2px solid ${correct?'#10b981':'#ef4444'}`, background: correct?'#f0fdf4':'#fef2f2' }),
  qHeader: { display:'flex', justifyContent:'space-between', marginBottom:8 },
  qNum: { fontSize:11, fontWeight:700, color:'#64748b' },
  qStatus: (correct) => ({ fontSize:11, fontWeight:700, color: correct?'#10b981':'#ef4444' }),
  qText: { fontSize:13, fontWeight:600, color:'#1e293b', marginBottom:8, lineHeight:1.5 },
  qAnswerRow: { fontSize:12, color:'#334155', marginBottom:4, lineHeight:1.5 },
  qAnswerLabelUser: { fontWeight:700, color:'#475569' },
  qAnswerLabelCorrect: { fontWeight:700, color:'#166534' },
  qExplanation: { marginTop:8, padding:'8px 10px', background:'#eef2ff', borderRadius:8, fontSize:12, color:'#3730a3', lineHeight:1.6 },
};

export default CekTugasSiswa;