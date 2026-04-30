import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, getDocs, addDoc, query, where, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import SidebarGuru from '../../../components/SidebarGuru';
import { 
  CheckCircle, XCircle, AlertCircle, Search, Filter, User, BookOpen, 
  Star, TrendingUp, Award, Calendar, Clock, Save, ArrowLeft, Users,
  FileText, HelpCircle, Send, Database, RefreshCw
} from 'lucide-react';
import { RAPORT_COLLECTIONS, DEFAULT_WEIGHTS } from '../../../firebase/raportCollection';
import { calculateFinalScore, generateNarasi, exportToRaportScores } from '../../../services/raportService';

const TeacherInputGrade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Responsive
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);

  // Data Guru
  const [guru] = useState(() => {
    const stateGuru = location.state?.teacher;
    const localGuru = localStorage.getItem('teacherData');
    return stateGuru || (localGuru ? JSON.parse(localGuru) : null);
  });

  // State
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'fromTasks', 'fromQuizzes'

  // State Input Nilai
  const [score, setScore] = useState(""); 
  const [topic, setTopic] = useState("");
  const [komponen, setKomponen] = useState("keaktifan"); // kuis, catatan, ujian, keaktifan
  const [aspects, setAspects] = useState({
    pemahaman: 3, 
    aplikasi: 3, 
    literasi: 3, 
    inisiatif: 3, 
    mandiri: 3    
  });
  
  const [selectedMapel] = useState(guru?.mapel || "Umum");
  const [availableTopics, setAvailableTopics] = useState([]);
  
  // Data dari tugas & kuis
  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Statistik
  const [stats, setStats] = useState({ total: 0, sudah: 0, belum: 0 });
  const [currentPeriode, setCurrentPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024 && window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!guru) { 
      alert("Sesi berakhir, silakan login kembali.");
      navigate('/login-guru'); 
      return; 
    }
    fetchData();
    fetchTopics();
    fetchPendingData();
  }, [guru, selectedMapel, navigate, currentPeriode]);

  const fetchTopics = async () => {
    try {
      const gradesSnap = await getDocs(query(
        collection(db, "grades"),
        where("teacherId", "==", guru.id),
        where("mapel", "==", selectedMapel)
      ));
      const topics = [...new Set(gradesSnap.docs.map(d => d.data().topik).filter(Boolean))];
      setAvailableTopics(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const fetchPendingData = async () => {
    setLoadingTasks(true);
    try {
      // Ambil tugas yang sudah dinilai tapi belum diekspor
      const tugasSnap = await getDocs(query(
        collection(db, "jawaban_tugas"),
        where("score", "!=", null)
      ));
      const semuaTugas = tugasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const belumEkspor = semuaTugas.filter(t => !t.exportedToRaport);
      setPendingTasks(belumEkspor.slice(0, 20));

      // Ambil kuis yang sudah otomatis dinilai
      const quizSnap = await getDocs(query(
        collection(db, "jawaban_kuis"),
        where("score", "!=", null)
      ));
      const semuaQuiz = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const belumEksporQuiz = semuaQuiz.filter(q => !q.exportedToRaport);
      setPendingQuizzes(belumEksporQuiz.slice(0, 20));
    } catch (error) {
      console.error("Error fetching pending data:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const snapSiswa = await getDocs(collection(db, "students"));
      const dataSiswa = snapSiswa.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Cek nilai yang sudah ada di raport_scores untuk periode ini
      const qScores = query(
        collection(db, RAPORT_COLLECTIONS.SCORES),
        where("teacherId", "==", guru.id),
        where("periode", "==", currentPeriode)
      );
      const snapScores = await getDocs(qScores);
      const existingScores = snapScores.docs.map(d => d.data());

      const mergedData = dataSiswa.map(siswa => {
        const hasScore = existingScores.find(s => 
          s.studentId === siswa.id && s.komponen === komponen
        );
        return { ...siswa, statusNilai: hasScore ? 'Sudah' : 'Belum' };
      });

      mergedData.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      setStudents(mergedData);
      setFilteredStudents(mergedData);
      
      setStats({
        total: mergedData.length,
        sudah: mergedData.filter(s => s.statusNilai === 'Sudah').length,
        belum: mergedData.filter(s => s.statusNilai === 'Belum').length
      });
    } catch (err) {
      console.error("Error fetchData:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = students;
    if (searchTerm) {
      result = result.filter(s => s.nama?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterClass !== "Semua") {
      result = result.filter(s => s.kelasSekolah?.includes(filterClass) || s.program?.includes(filterClass));
    }
    if (filterStatus !== "Semua") {
      result = result.filter(s => s.statusNilai === filterStatus);
    }
    setFilteredStudents(result);
  }, [searchTerm, filterClass, filterStatus, students]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score || !topic) { alert("Mohon lengkapi nilai dan topik!"); return; }
    if (score < 0 || score > 100) { alert("Nilai harus antara 0-100!"); return; }
    
    setSubmitting(true);
    try {
      // Simpan ke raport_scores
      const result = await exportToRaportScores({
        studentId: selectedStudent.id,
        studentName: selectedStudent.nama,
        mapel: selectedMapel,
        topik: topic,
        nilai: parseInt(score),
        komponen: komponen,
        teacherId: guru.id,
        teacherName: guru.nama
      });
      
      if (result.success) {
        alert(`✅ Nilai ${selectedStudent.nama} berhasil disimpan ke raport!`);
        setSelectedStudent(null);
        setScore("");
        setTopic("");
        setKomponen("keaktifan");
        fetchData();
        fetchTopics();
      } else {
        alert("❌ Gagal menyimpan: " + result.error);
      }
    } catch (err) { 
      alert("❌ Gagal menyimpan: " + err.message); 
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportFromTask = async (item) => {
    setSubmitting(true);
    try {
      const result = await exportToRaportScores({
        studentId: item.studentId,
        studentName: item.studentName,
        mapel: selectedMapel,
        topik: item.modulTitle,
        nilai: item.score,
        komponen: 'catatan',
        teacherId: guru.id,
        teacherName: guru.nama
      });
      
      if (result.success) {
        alert(`✅ Nilai tugas ${item.studentName} berhasil diekspor!`);
        fetchPendingData();
        fetchData();
      } else {
        alert("❌ Gagal: " + result.error);
      }
    } catch (err) {
      alert("❌ Gagal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportFromQuiz = async (item) => {
    setSubmitting(true);
    try {
      const result = await exportToRaportScores({
        studentId: item.userId,
        studentName: item.userName,
        mapel: selectedMapel,
        topik: item.modulTitle || item.quizTitle,
        nilai: item.score,
        komponen: 'kuis',
        teacherId: guru.id,
        teacherName: guru.nama
      });
      
      if (result.success) {
        alert(`✅ Nilai kuis ${item.userName} berhasil diekspor!`);
        fetchPendingData();
        fetchData();
      } else {
        alert("❌ Gagal: " + result.error);
      }
    } catch (err) {
      alert("❌ Gagal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreAdvice = (score) => {
    if (score >= 85) return { text: 'Luar biasa! Pertahankan prestasi ini!', color: '#10b981', icon: '🏆' };
    if (score >= 75) return { text: 'Bagus! Tingkatkan terus konsistensi belajarnya.', color: '#3b82f6', icon: '👍' };
    if (score >= 60) return { text: 'Cukup. Perlu bimbingan lebih intensif.', color: '#f59e0b', icon: '⚠️' };
    return { text: 'Perlu perhatian khusus. Segera evaluasi!', color: '#ef4444', icon: '🔴' };
  };

  const getKomponenLabel = (komp) => {
    const labels = {
      kuis: '📝 Kuis (25% bobot)',
      catatan: '📓 Tugas Catatan (25% bobot)',
      ujian: '📖 Ujian Materi (35% bobot)',
      keaktifan: '⭐ Keaktifan (15% bobot)'
    };
    return labels[komp] || '📋 Nilai Umum';
  };

  const RenderRating = ({ label, value, field, desc }) => (
    <div style={{marginBottom:12, background:'#f8fafc', padding:'12px', borderRadius:10, border:'1px solid #e2e8f0'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{flex:1}}>
          <label style={{fontWeight:'bold', fontSize:12, color:'#2c3e50'}}>{label}</label>
          <p style={{fontSize:10, color:'#7f8c8d', margin:'2px 0 0 0'}}>{desc}</p>
        </div>
        <span style={{fontWeight:'bold', color:'#3498db', fontSize:14, marginLeft:10}}>{value}/5</span>
      </div>
      <input 
        type="range" min="1" max="5" step="1" 
        value={value}
        onChange={(e) => setAspects({...aspects, [field]: parseInt(e.target.value)})}
        style={{width:'100%', accentColor:'#3498db', marginTop:8, cursor:'pointer'}} 
      />
      <div style={{display:'flex', justifyContent:'space-between', marginTop:4, fontSize:9, color:'#94a3b8'}}>
        <span>Kurang</span><span>Cukup</span><span>Baik</span><span>Sangat Baik</span><span>Luar Biasa</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', background: '#f1f5f9', minHeight: '100vh' }}>
      <SidebarGuru />
      <div style={{ 
        marginLeft: isMobile ? '0' : '260px', 
        padding: isMobile ? '15px' : '24px', 
        width: isMobile ? '100%' : 'calc(100% - 260px)',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease'
      }}>
        <div style={{maxWidth: 1100, margin: '0 auto'}}>
          
          {/* HEADER */}
          <div style={{marginBottom: 24}}>
            <h1 style={{margin: 0, fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: '#1e293b'}}>
              📊 Smart Input Nilai
            </h1>
            <p style={{margin: '4px 0 0', fontSize: '13px', color: '#64748b'}}>
              Input nilai akademik, karakter, atau impor dari tugas/kuis otomatis
            </p>
          </div>

          {/* INFO GURU */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '32px', height: '32px', background: '#eef2ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="#3b82f6" />
                  </div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{guru?.nama}</span>
                  <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', color: '#d97706' }}>{selectedMapel}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Periode: {currentPeriode.replace('-', ' / ')}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.total}</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Total Siswa</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{stats.sudah}</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Sudah Dinilai</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{stats.belum}</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Belum Dinilai</div>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => { setActiveTab('manual'); setSelectedStudent(null); }}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                background: activeTab === 'manual' ? '#3b82f6' : 'white',
                color: activeTab === 'manual' ? 'white' : '#64748b',
                boxShadow: activeTab === 'manual' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                border: activeTab === 'manual' ? 'none' : '1px solid #e2e8f0'
              }}
            >
              ✍️ Input Manual
            </button>
            <button 
              onClick={() => { setActiveTab('fromTasks'); fetchPendingData(); }}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                background: activeTab === 'fromTasks' ? '#10b981' : 'white',
                color: activeTab === 'fromTasks' ? 'white' : '#64748b',
                boxShadow: activeTab === 'fromTasks' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                border: activeTab === 'fromTasks' ? 'none' : '1px solid #e2e8f0'
              }}
            >
              📥 Impor dari Tugas ({pendingTasks.length})
            </button>
            <button 
              onClick={() => { setActiveTab('fromQuizzes'); fetchPendingData(); }}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                background: activeTab === 'fromQuizzes' ? '#8b5cf6' : 'white',
                color: activeTab === 'fromQuizzes' ? 'white' : '#64748b',
                boxShadow: activeTab === 'fromQuizzes' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                border: activeTab === 'fromQuizzes' ? 'none' : '1px solid #e2e8f0'
              }}
            >
              ❓ Impor dari Kuis ({pendingQuizzes.length})
            </button>
          </div>

          {/* KONTEN BERDASARKAN TAB */}
          {activeTab === 'manual' && !selectedStudent && (
            <>
              {/* FILTER untuk Input Manual */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '12px'
                }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <Search size={16} color="#94a3b8" />
                      <input 
                        type="text" 
                        placeholder="Cari nama siswa..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <select 
                      value={filterClass} 
                      onChange={e => setFilterClass(e.target.value)} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}
                    >
                      <option value="Semua">📚 Semua Jenjang</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <select 
                      value={filterStatus} 
                      onChange={e => setFilterStatus(e.target.value)} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}
                    >
                      <option value="Semua">📋 Semua Status</option>
                      <option value="Belum">⚠️ Belum Dinilai</option>
                      <option value="Sudah">✅ Sudah Dinilai</option>
                    </select>
                  </div>
                  <button onClick={() => { setKomponen('keaktifan'); fetchData(); }} style={{ padding: '10px 15px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer' }}>
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* DAFTAR SISWA untuk Input Manual */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                  <p style={{ color: '#64748b' }}>Memuat data siswa...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px' }}>
                  <Users size={48} color="#cbd5e1" />
                  <p style={{ marginTop: '12px', color: '#94a3b8' }}>Tidak ada siswa yang ditemukan</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid', 
                  gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '150px' : '180px'}, 1fr))`, 
                  gap: '12px'
                }}>
                  {filteredStudents.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedStudent(s)} 
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `2px solid ${s.statusNilai === 'Sudah' ? '#10b981' : '#e2e8f0'}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={18} color="#3b82f6" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{s.nama}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{s.kelasSekolah || '-'}</div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: s.statusNilai === 'Sudah' ? '#10b981' : '#ef4444',
                        background: s.statusNilai === 'Sudah' ? '#dcfce7' : '#fee2e2',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        {s.statusNilai === 'Sudah' ? '✅ TERISI' : '⚠️ BELUM'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* FORM INPUT MANUAL */}
          {activeTab === 'manual' && selectedStudent && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: isMobile ? '20px' : '24px',
              border: '1px solid #e2e8f0'
            }}>
              <button 
                onClick={() => setSelectedStudent(null)} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}
              >
                <ArrowLeft size={16} /> Kembali ke Daftar
              </button>

              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{selectedStudent.nama}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  {selectedStudent.kelasSekolah} | {selectedStudent.program || selectedStudent.detailProgram || 'Reguler'}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Pilih Komponen Nilai */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' }}>🎯 Komponen Nilai</label>
                  <select 
                    value={komponen} 
                    onChange={e => setKomponen(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}
                  >
                    <option value="keaktifan">⭐ Keaktifan (15% bobot)</option>
                    <option value="catatan">📓 Tugas Catatan (25% bobot)</option>
                    <option value="kuis">📝 Kuis (25% bobot)</option>
                    <option value="ujian">📖 Ujian Materi (35% bobot)</option>
                  </select>
                  <p style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                    {getKomponenLabel(komponen)} • Pastikan memilih komponen yang sesuai
                  </p>
                </div>

                {/* Akademik */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} color="#3b82f6" /> A. Capaian Akademik
                  </h4>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Topik / Materi</label>
                      <input 
                        type="text" 
                        list="topics"
                        required 
                        placeholder="Contoh: Aljabar, Persamaan Linear..." 
                        value={topic} 
                        onChange={e => setTopic(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                      />
                      <datalist id="topics">
                        {availableTopics.map(t => <option key={t} value={t} />)}
                      </datalist>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Nilai (0-100)</label>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        max="100"
                        placeholder="85" 
                        value={score} 
                        onChange={e => setScore(e.target.value)} 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #3b82f6', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }}
                      />
                    </div>
                  </div>
                  {score && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: getScoreAdvice(score).color + '10', border: `1px solid ${getScoreAdvice(score).color}` }}>
                      <span style={{ fontSize: '12px' }}>{getScoreAdvice(score).icon} {getScoreAdvice(score).text}</span>
                    </div>
                  )}
                </div>

                {/* Karakter */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={16} color="#f59e0b" /> B. Karakter & Sikap
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <RenderRating label="Pemahaman Konsep" desc="Penguasaan teori dasar" value={aspects.pemahaman} field="pemahaman" />
                    <RenderRating label="Logika & Aplikasi" desc="Kemampuan variasi soal" value={aspects.aplikasi} field="aplikasi" />
                    <RenderRating label="Literasi / Fokus" desc="Ketelitian membaca soal" value={aspects.literasi} field="literasi" />
                    <RenderRating label="Inisiatif" desc="Keaktifan bertanya" value={aspects.inisiatif} field="inisiatif" />
                    <RenderRating label="Kemandirian" desc="Mengerjakan tanpa bantuan" value={aspects.mandiri} field="mandiri" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: submitting ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Save size={18} />
                  {submitting ? 'Menyimpan...' : '💾 SIMPAN KE RAPORT'}
                </button>
              </form>
            </div>
          )}

          {/* TAB IMPOR DARI TUGAS */}
          {activeTab === 'fromTasks' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#10b981" /> Nilai Tugas yang Siap Diimpor
              </h3>
              
              {loadingTasks ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                  <p>Memuat data tugas...</p>
                </div>
              ) : pendingTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <CheckCircle size={40} />
                  <p style={{ marginTop: '12px' }}>Semua nilai tugas sudah diimpor ke raport</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingTasks.map(task => (
                    <div key={task.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{task.studentName}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{task.modulTitle} • Nilai: {task.score}</div>
                      </div>
                      <button 
                        onClick={() => handleExportFromTask(task)}
                        disabled={submitting}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        📥 Impor ke Raport
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB IMPOR DARI KUIS */}
          {activeTab === 'fromQuizzes' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={18} color="#8b5cf6" /> Nilai Kuis yang Siap Diimpor
              </h3>
              
              {loadingTasks ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                  <p>Memuat data kuis...</p>
                </div>
              ) : pendingQuizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <CheckCircle size={40} />
                  <p style={{ marginTop: '12px' }}>Semua nilai kuis sudah diimpor ke raport</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingQuizzes.map(quiz => (
                    <div key={quiz.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{quiz.userName}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{quiz.modulTitle || quiz.quizTitle} • Nilai: {quiz.score}</div>
                      </div>
                      <button 
                        onClick={() => handleExportFromQuiz(quiz)}
                        disabled={submitting}
                        style={{
                          background: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        📥 Impor ke Raport
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TeacherInputGrade;