import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, getDocs, addDoc, query, where, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import SidebarGuru from '../../../components/SidebarGuru';
import { 
  CheckCircle, XCircle, AlertCircle, Search, Filter, User, BookOpen, 
  Star, TrendingUp, Award, Calendar, Clock, Save, ArrowLeft, Users,
  FileText, HelpCircle, Send, Database, RefreshCw, Eye, Info
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
  const [activeTab, setActiveTab] = useState('manual');

  // State Input Nilai
  const [score, setScore] = useState(""); 
  const [topic, setTopic] = useState("");
  const [komponen, setKomponen] = useState("keaktifan");
  const [aspects, setAspects] = useState({
    pemahaman: 3, aplikasi: 3, literasi: 3, inisiatif: 3, mandiri: 3    
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

  // ➕ State untuk detail siswa
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [studentScores, setStudentScores] = useState(null); // Nilai bulan ini
  const [lastMonthScores, setLastMonthScores] = useState(null); // Nilai bulan lalu

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
      const tugasSnap = await getDocs(query(collection(db, "jawaban_tugas"), where("score", "!=", null)));
      const semuaTugas = tugasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const belumEkspor = semuaTugas.filter(t => !t.exportedToRaport);
      setPendingTasks(belumEkspor.slice(0, 20));

      const quizSnap = await getDocs(query(collection(db, "jawaban_kuis"), where("score", "!=", null)));
      const semuaQuiz = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const belumEksporQuiz = semuaQuiz.filter(q => !q.exportedToRaport);
      setPendingQuizzes(belumEksporQuiz.slice(0, 20));
    } catch (error) {
      console.error("Error fetching pending data:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  // ➕ Fetch detail nilai per siswa
  const fetchStudentDetail = async (studentId) => {
    try {
      // Ambil nilai bulan ini dari raport_scores
      const scoresSnap = await getDocs(query(
        collection(db, RAPORT_COLLECTIONS.SCORES),
        where("studentId", "==", studentId),
        where("periode", "==", currentPeriode)
      ));
      const currentScores = scoresSnap.docs.map(d => d.data());
      
      // Kelompokkan per komponen
      const grouped = { kuis: [], catatan: [], ujian: [], keaktifan: [] };
      currentScores.forEach(s => {
        if (grouped[s.komponen]) grouped[s.komponen].push(s);
      });
      setStudentScores(grouped);

      // Ambil nilai bulan lalu
      const lastMonth = getPreviousMonth(currentPeriode);
      const lastSnap = await getDocs(query(
        collection(db, RAPORT_COLLECTIONS.FINAL),
        where("studentId", "==", studentId),
        where("periode", "==", lastMonth)
      ));
      if (!lastSnap.empty) {
        setLastMonthScores(lastSnap.docs[0].data());
      } else {
        setLastMonthScores(null);
      }
      
      setShowStudentDetail(true);
    } catch (e) {
      console.error("Error fetch student detail:", e);
    }
  };

  const getPreviousMonth = (periode) => {
    const [year, month] = periode.split('-');
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) { prevMonth = 12; prevYear--; }
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const snapSiswa = await getDocs(collection(db, "students"));
      const dataSiswa = snapSiswa.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Ambil semua nilai bulan ini
      const qScores = query(
        collection(db, RAPORT_COLLECTIONS.SCORES),
        where("periode", "==", currentPeriode)
      );
      const snapScores = await getDocs(qScores);
      const allScores = snapScores.docs.map(d => d.data());

      // ➕ Hitung kelengkapan per siswa (per komponen)
      const mergedData = dataSiswa.map(siswa => {
        const siswaScores = allScores.filter(s => s.studentId === siswa.id);
        const komponenTerisi = [...new Set(siswaScores.map(s => s.komponen))];
        const totalTerisi = komponenTerisi.length;
        
        return { 
          ...siswa, 
          totalTerisi,
          komponenTerisi,
          statusNilai: totalTerisi >= 2 ? 'Sudah' : totalTerisi > 0 ? 'Sebagian' : 'Belum'
        };
      });

      mergedData.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      setStudents(mergedData);
      setFilteredStudents(mergedData);
      
      setStats({
        total: mergedData.length,
        sudah: mergedData.filter(s => s.totalTerisi >= 2).length,
        sebagian: mergedData.filter(s => s.totalTerisi === 1).length,
        belum: mergedData.filter(s => s.totalTerisi === 0).length
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
      const result = await exportToRaportScores({
        studentId: selectedStudent.id,
        studentName: selectedStudent.nama,
        mapel: selectedMapel,
        topik: topic,
        nilai: parseInt(score),
        komponen: komponen,
        teacherId: guru.id,
        teacherName: guru.nama,
        qualitative: aspects
      });
      
      if (result.success) {
        alert(`✅ Nilai ${selectedStudent.nama} (${komponen}) berhasil disimpan!`);
        setScore("");
        setTopic("");
        setKomponen("keaktifan");
        setAspects({ pemahaman: 3, aplikasi: 3, literasi: 3, inisiatif: 3, mandiri: 3 });
        // Refresh detail
        fetchStudentDetail(selectedStudent.id);
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
        try {
          await updateDoc(doc(db, "jawaban_tugas", item.id), { exportedToRaport: true });
        } catch (updateErr) {}
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
        try {
          await updateDoc(doc(db, "jawaban_kuis", item.id), { exportedToRaport: true });
        } catch (updateErr) {}
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

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreAdvice = (score) => {
    if (score >= 85) return { text: 'Luar biasa! Pertahankan prestasi ini!', color: '#10b981', icon: '🏆' };
    if (score >= 75) return { text: 'Bagus! Tingkatkan terus konsistensi belajarnya.', color: '#3b82f6', icon: '👍' };
    if (score >= 60) return { text: 'Cukup. Perlu bimbingan lebih intensif.', color: '#f59e0b', icon: '⚠️' };
    return { text: 'Perlu perhatian khusus. Segera evaluasi!', color: '#ef4444', icon: '🔴' };
  };

  const getKomponenLabel = (komp) => {
    const labels = {
      kuis: '📝 Kuis (30% bobot)',
      catatan: '📓 Tugas Catatan (30% bobot)',
      ujian: '📖 Ujian Materi (20% bobot)',
      keaktifan: '⭐ Keaktifan (20% bobot)'
    };
    return labels[komp] || '📋 Nilai Umum';
  };

  const getStatusColor = (status) => {
    if (status === 'Sudah') return { bg: '#dcfce7', color: '#166534', border: '#10b981' };
    if (status === 'Sebagian') return { bg: '#fef3c7', color: '#b45309', border: '#f59e0b' };
    return { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' };
  };

  const komponenList = ['kuis', 'catatan', 'ujian', 'keaktifan'];

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
        padding: isMobile ? '10px' : '20px', 
        width: isMobile ? '100%' : 'calc(100% - 260px)',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease'
      }}>
        <div style={{maxWidth: '100%', margin: '0 auto'}}>
          
          {/* HEADER */}
          <div style={{marginBottom: 20}}>
            <h1 style={{margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', color: '#1e293b'}}>
              📊 Smart Input Nilai
            </h1>
            <p style={{margin: '4px 0 0', fontSize: '12px', color: '#64748b'}}>
              Input nilai akademik, karakter, atau impor dari tugas/kuis otomatis
            </p>
          </div>

          {/* ➕ INFO SKEMA BOBOT */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 12,
            padding: isMobile ? 12 : 16,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            flexWrap: 'wrap'
          }}>
            <Info size={18} color="#0369a1" style={{marginTop: 2}} />
            <div style={{flex: 1, fontSize: isMobile ? 10 : 12, color: '#0369a1', lineHeight: 1.6}}>
              <b>ℹ️ Skema Penilaian:</b> Kuis 30% • Tugas/Catatan 30% • Ujian 20% • Keaktifan 20%<br/>
              <span style={{fontSize: isMobile ? 9 : 10}}>
                Minimal <b>2 komponen</b> untuk generate raport. Bobot dihitung <b>otomatis proporsional</b> jika ada komponen kosong.
                Nilai berdasarkan observasi <b>riil</b>: kuis (auto-score), tugas (upload), ujian (bila ada), keaktifan (absensi).
              </span>
            </div>
          </div>

          {/* INFO GURU */}
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: isMobile ? 12 : 16,
            marginBottom: 16,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: '10px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '32px', height: '32px', background: '#eef2ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="#3b82f6" />
                  </div>
                  <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{guru?.nama}</span>
                  <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', color: '#d97706' }}>{selectedMapel}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Periode: {currentPeriode.replace('-', ' / ')}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: 8 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.total}</div>
                  <div style={{ fontSize: '8px', color: '#64748b' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center', background: '#dcfce7', padding: '6px 10px', borderRadius: 8 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>{stats.sudah}</div>
                  <div style={{ fontSize: '8px', color: '#166534' }}>≥2 komp</div>
                </div>
                <div style={{ textAlign: 'center', background: '#fef3c7', padding: '6px 10px', borderRadius: 8 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#b45309' }}>{stats.sebagian || 0}</div>
                  <div style={{ fontSize: '8px', color: '#b45309' }}>1 komp</div>
                </div>
                <div style={{ textAlign: 'center', background: '#fee2e2', padding: '6px 10px', borderRadius: 8 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#991b1b' }}>{stats.belum}</div>
                  <div style={{ fontSize: '8px', color: '#991b1b' }}>0 komp</div>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => { setActiveTab('manual'); setShowStudentDetail(false); }} style={{
              padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
              background: activeTab === 'manual' ? '#3b82f6' : 'white',
              color: activeTab === 'manual' ? 'white' : '#64748b',
              boxShadow: activeTab === 'manual' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
              border: activeTab === 'manual' ? 'none' : '1px solid #e2e8f0'
            }}>✍️ Input Manual</button>
            <button onClick={() => { setActiveTab('fromTasks'); fetchPendingData(); }} style={{
              padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
              background: activeTab === 'fromTasks' ? '#10b981' : 'white',
              color: activeTab === 'fromTasks' ? 'white' : '#64748b',
              boxShadow: activeTab === 'fromTasks' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
              border: activeTab === 'fromTasks' ? 'none' : '1px solid #e2e8f0'
            }}>📥 Impor Tugas ({pendingTasks.length})</button>
            <button onClick={() => { setActiveTab('fromQuizzes'); fetchPendingData(); }} style={{
              padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
              background: activeTab === 'fromQuizzes' ? '#8b5cf6' : 'white',
              color: activeTab === 'fromQuizzes' ? 'white' : '#64748b',
              boxShadow: activeTab === 'fromQuizzes' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
              border: activeTab === 'fromQuizzes' ? 'none' : '1px solid #e2e8f0'
            }}>❓ Impor Kuis ({pendingQuizzes.length})</button>
          </div>

          {/* ============================================================ */}
          {/* KONTEN: INPUT MANUAL */}
          {/* ============================================================ */}
          {activeTab === 'manual' && !selectedStudent && (
            <>
              {/* FILTER */}
              <div style={{ background: 'white', borderRadius: 12, padding: isMobile ? 12 : 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <Search size={16} color="#94a3b8" />
                      <input type="text" placeholder="Cari nama siswa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px' }} />
                    </div>
                  </div>
                  <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                    <option value="Semua">📚 Semua Jenjang</option>
                    <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                    <option value="Semua">📋 Semua Status</option>
                    <option value="Belum">🔴 Belum (0)</option>
                    <option value="Sebagian">🟡 Sebagian (1)</option>
                    <option value="Sudah">🟢 Lengkap (≥2)</option>
                  </select>
                  <button onClick={() => { fetchData(); }} style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer' }}>
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* DAFTAR SISWA */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: 12 }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                  <p style={{ color: '#64748b', fontSize: 13 }}>Memuat data siswa...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: 12 }}>
                  <Users size={40} color="#cbd5e1" />
                  <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: 13 }}>Tidak ada siswa ditemukan</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '140px' : '200px'}, 1fr))`, gap: '10px' }}>
                  {filteredStudents.map(s => {
                    const statusStyle = getStatusColor(s.statusNilai);
                    return (
                      <div key={s.id} style={{
                        background: 'white', borderRadius: 12, padding: isMobile ? 10 : 14, cursor: 'pointer',
                        transition: 'all 0.2s ease', border: `2px solid ${statusStyle.border}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        {/* Info siswa + tombol detail */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div onClick={() => { setSelectedStudent(s); fetchStudentDetail(s.id); }} style={{ flex: 1, cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={16} color="#3b82f6" />
                              </div>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: isMobile ? 11 : 13, color: '#1e293b' }}>{s.nama}</div>
                                <div style={{ fontSize: '9px', color: '#64748b' }}>{s.kelasSekolah || '-'}</div>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => { setSelectedStudent(s); fetchStudentDetail(s.id); }} style={{
                            background: '#eef2ff', border: 'none', color: '#3b82f6', padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap'
                          }}>
                            <Eye size={12} /> Detail
                          </button>
                        </div>
                        
                        {/* Badge komponen terisi */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                          {komponenList.map(komp => {
                            const terisi = s.komponenTerisi?.includes(komp);
                            return (
                              <span key={komp} style={{
                                fontSize: 8, padding: '2px 6px', borderRadius: 6,
                                background: terisi ? '#dcfce7' : '#fee2e2',
                                color: terisi ? '#166534' : '#991b1b',
                                fontWeight: 'bold'
                              }}>
                                {komp === 'kuis' ? '📝' : komp === 'catatan' ? '📓' : komp === 'ujian' ? '📖' : '⭐'}
                                {terisi ? '✓' : '✗'}
                              </span>
                            );
                          })}
                        </div>
                        
                        <div style={{
                          fontSize: '9px', fontWeight: 'bold', marginTop: 6,
                          color: statusStyle.color, background: statusStyle.bg,
                          padding: '3px 8px', borderRadius: 6, textAlign: 'center'
                        }}>
                          {s.statusNilai === 'Sudah' ? `✅ LENGKAP (${s.totalTerisi}/4)` : 
                           s.statusNilai === 'Sebagian' ? `🟡 SEBAGIAN (${s.totalTerisi}/4)` : '🔴 BELUM'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* ➕ DETAIL SISWA + FORM INPUT */}
          {/* ============================================================ */}
          {activeTab === 'manual' && selectedStudent && (
            <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 16 : 24, border: '1px solid #e2e8f0' }}>
              <button onClick={() => { setSelectedStudent(null); setShowStudentDetail(false); }} style={{
                display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
                color: '#3b82f6', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '16px'
              }}>
                <ArrowLeft size={16} /> Kembali ke Daftar
              </button>

              {/* Info Siswa */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>{selectedStudent.nama}</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{selectedStudent.kelasSekolah} | {selectedStudent.program || selectedStudent.detailProgram || 'Reguler'}</p>
              </div>

              {/* ➕ RIWAYAT NILAI BULAN INI + BULAN LALU */}
              {showStudentDetail && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>📋 Status Penilaian Bulan Ini</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {komponenList.map(komp => {
                      const dataKomp = studentScores?.[komp] || [];
                      const terisi = dataKomp.length > 0;
                      const avgNilai = terisi ? Math.round(dataKomp.reduce((a,b) => a + b.nilai, 0) / dataKomp.length) : null;
                      return (
                        <div key={komp} style={{
                          padding: 12, borderRadius: 10, textAlign: 'center',
                          background: terisi ? '#dcfce7' : '#fee2e2',
                          border: `1px solid ${terisi ? '#10b981' : '#ef4444'}`
                        }}>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>
                            {komp === 'kuis' ? '📝' : komp === 'catatan' ? '📓' : komp === 'ujian' ? '📖' : '⭐'}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: terisi ? '#166534' : '#991b1b' }}>
                            {komp === 'kuis' ? 'Kuis' : komp === 'catatan' ? 'Catatan' : komp === 'ujian' ? 'Ujian' : 'Keaktifan'}
                          </div>
                          {terisi ? (
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#166534' }}>{avgNilai}</div>
                          ) : (
                            <div style={{ fontSize: 10, color: '#991b1b', fontWeight: 600 }}>BELUM</div>
                          )}
                          <div style={{ fontSize: 8, color: '#64748b' }}>{terisi ? `${dataKomp.length} data` : 'Butuh input'}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Nilai bulan lalu */}
                  {lastMonthScores && (
                    <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 10, border: '1px solid #bae6fd', marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>📅 Nilai Bulan Lalu ({getPreviousMonth(currentPeriode).replace('-', '/')})</div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#0369a1' }}>Nilai Akhir: <b>{lastMonthScores.nilai_akhir}</b></span>
                        <span style={{ fontSize: 11, color: '#0369a1' }}>Kuis: <b>{lastMonthScores.nilai_kuis}</b></span>
                        <span style={{ fontSize: 11, color: '#0369a1' }}>Catatan: <b>{lastMonthScores.nilai_catatan}</b></span>
                        <span style={{ fontSize: 11, color: '#0369a1' }}>Ujian: <b>{lastMonthScores.nilai_ujian}</b></span>
                        <span style={{ fontSize: 11, color: '#0369a1' }}>Keaktifan: <b>{lastMonthScores.nilai_keaktifan}</b></span>
                      </div>
                    </div>
                  )}
                  {!lastMonthScores && (
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 16, textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
                      Belum ada data raport bulan lalu
                    </div>
                  )}

                  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />
                </div>
              )}

              {/* FORM INPUT */}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: 6 }}>🎯 Komponen Nilai</label>
                  <select value={komponen} onChange={e => setKomponen(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: 'white' }}>
                    <option value="keaktifan">⭐ Keaktifan (20% bobot)</option>
                    <option value="catatan">📓 Tugas Catatan (30% bobot)</option>
                    <option value="kuis">📝 Kuis (30% bobot)</option>
                    <option value="ujian">📖 Ujian Materi (20% bobot)</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={16} color="#3b82f6" /> A. Capaian Akademik
                  </h4>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: 4 }}>Topik / Materi</label>
                      <input type="text" list="topics" required placeholder="Contoh: Aljabar..." value={topic} onChange={e => setTopic(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
                      <datalist id="topics">{availableTopics.map(t => <option key={t} value={t} />)}</datalist>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: 4 }}>Nilai (0-100)</label>
                      <input type="number" required min="0" max="100" placeholder="85" value={score} onChange={e => setScore(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #3b82f6', fontSize: 16, fontWeight: 'bold', textAlign: 'center', outline: 'none' }} />
                    </div>
                  </div>
                  {score && (
                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: getScoreAdvice(score).color + '10', border: `1px solid ${getScoreAdvice(score).color}` }}>
                      <span style={{ fontSize: 12 }}>{getScoreAdvice(score).icon} {getScoreAdvice(score).text}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={16} color="#f59e0b" /> B. Karakter & Sikap
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <RenderRating label="Pemahaman Konsep" desc="Penguasaan teori dasar" value={aspects.pemahaman} field="pemahaman" />
                    <RenderRating label="Logika & Aplikasi" desc="Kemampuan variasi soal" value={aspects.aplikasi} field="aplikasi" />
                    <RenderRating label="Literasi / Fokus" desc="Ketelitian membaca soal" value={aspects.literasi} field="literasi" />
                    <RenderRating label="Inisiatif" desc="Keaktifan bertanya" value={aspects.inisiatif} field="inisiatif" />
                    <RenderRating label="Kemandirian" desc="Mengerjakan tanpa bantuan" value={aspects.mandiri} field="mandiri" />
                  </div>
                </div>

                <button type="submit" disabled={submitting} style={{
                  width: '100%', padding: 14, background: submitting ? '#94a3b8' : '#10b981', color: 'white',
                  border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 14,
                  cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <Save size={18} /> {submitting ? 'Menyimpan...' : '💾 SIMPAN KE RAPORT'}
                </button>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB IMPOR DARI TUGAS */}
          {/* ============================================================ */}
          {activeTab === 'fromTasks' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#10b981" /> Nilai Tugas Siap Diimpor
              </h3>
              {loadingTasks ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                  <p style={{ fontSize: 13 }}>Memuat data tugas...</p>
                </div>
              ) : pendingTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <CheckCircle size={40} />
                  <p style={{ marginTop: 12 }}>Semua nilai tugas sudah diimpor</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingTasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 10 }}>
                      <div><div style={{ fontWeight: 'bold', fontSize: 13 }}>{task.studentName}</div><div style={{ fontSize: 10, color: '#64748b' }}>{task.modulTitle} • Nilai: {task.score}</div></div>
                      <button onClick={() => handleExportFromTask(task)} disabled={submitting} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>📥 Impor</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB IMPOR DARI KUIS */}
          {/* ============================================================ */}
          {activeTab === 'fromQuizzes' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={18} color="#8b5cf6" /> Nilai Kuis Siap Diimpor
              </h3>
              {loadingTasks ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                  <p style={{ fontSize: 13 }}>Memuat data kuis...</p>
                </div>
              ) : pendingQuizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <CheckCircle size={40} />
                  <p style={{ marginTop: 12 }}>Semua nilai kuis sudah diimpor</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingQuizzes.map(quiz => (
                    <div key={quiz.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 10 }}>
                      <div><div style={{ fontWeight: 'bold', fontSize: 13 }}>{quiz.userName}</div><div style={{ fontSize: 10, color: '#64748b' }}>{quiz.modulTitle || quiz.quizTitle} • Nilai: {quiz.score}</div></div>
                      <button onClick={() => handleExportFromQuiz(quiz)} disabled={submitting} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>📥 Impor</button>
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