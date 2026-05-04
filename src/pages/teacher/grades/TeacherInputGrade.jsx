// src/pages/teacher/grades/TeacherInputGrade.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, getDocs, addDoc, query, where, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import SidebarGuru from '../../../components/SidebarGuru';
import { 
  CheckCircle, XCircle, AlertCircle, Search, Filter, User, BookOpen, 
  Star, TrendingUp, Award, Calendar, Clock, Save, ArrowLeft, Users,
  FileText, HelpCircle, Send, Database, RefreshCw, Eye, Info, Download
} from 'lucide-react';
import { RAPORT_COLLECTIONS, DEFAULT_WEIGHTS } from '../../../firebase/raportCollection';
import { calculateFinalScore, generateNarasi, exportToRaportScores } from '../../../services/raportService';

const TeacherInputGrade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);

  const [guru] = useState(() => {
    const stateGuru = location.state?.teacher;
    const localGuru = localStorage.getItem('teacherData');
    return stateGuru || (localGuru ? JSON.parse(localGuru) : null);
  });

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  const [score, setScore] = useState(""); 
  const [topic, setTopic] = useState("");
  const [komponen, setKomponen] = useState("keaktifan");
  const [aspects, setAspects] = useState({
    pemahaman: 3, aplikasi: 3, literasi: 3, inisiatif: 3, mandiri: 3    
  });
  
  const [selectedMapel] = useState(guru?.mapel || "Umum");
  const [availableTopics, setAvailableTopics] = useState([]);
  
  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  const [stats, setStats] = useState({ total: 0, sudah: 0, sebagian: 0, belum: 0 });
  const [currentPeriode, setCurrentPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [studentScores, setStudentScores] = useState(null);
  const [lastMonthScores, setLastMonthScores] = useState(null);
  const [studentTasks, setStudentTasks] = useState([]);
  const [studentQuizzes, setStudentQuizzes] = useState([]);
  const [loadingStudentData, setLoadingStudentData] = useState(false);

  // ➕ State: daftar ID siswa dari jadwal guru ini
  const [assignedStudentIds, setAssignedStudentIds] = useState([]);

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
    fetchAssignedStudents(); // ➕ Ambil dulu daftar siswa dari jadwal
  }, [guru, navigate]);

  // ➕ Ambil daftar siswa yang pernah dijadwalkan dengan guru ini
  const fetchAssignedStudents = async () => {
    try {
      const jadwalSnap = await getDocs(query(
        collection(db, "jadwal_bimbel"),
        where("teacherId", "==", guru.id)
      ));
      
      // Kumpulkan semua studentId unik dari semua jadwal
      const allStudentIds = new Set();
      jadwalSnap.docs.forEach(d => {
        const data = d.data();
        if (data.students && Array.isArray(data.students)) {
          data.students.forEach(s => {
            if (s.id) allStudentIds.add(s.id);
          });
        }
      });
      
      const studentIdArray = [...allStudentIds];
      setAssignedStudentIds(studentIdArray);
      console.log(`📋 Guru ${guru.nama}: ${studentIdArray.length} siswa dari jadwal`);
      
      // Setelah dapat daftar siswa, baru fetch data
      fetchData(studentIdArray);
      fetchTopics();
      fetchPendingData();
    } catch (e) {
      console.error("Error fetch assigned students:", e);
      // Fallback: tampilkan semua siswa
      fetchData([]);
      fetchTopics();
      fetchPendingData();
    }
  };

  const getPreviousMonth = (periode) => {
    const [year, month] = periode.split('-');
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) { prevMonth = 12; prevYear--; }
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  };

  const fetchTopics = async () => {
    try {
      const gradesSnap = await getDocs(query(collection(db, "grades"), where("teacherId", "==", guru.id), where("mapel", "==", selectedMapel)));
      const topics = [...new Set(gradesSnap.docs.map(d => d.data().topik).filter(Boolean))];
      setAvailableTopics(topics);
    } catch (error) { console.error("Error fetching topics:", error); }
  };

  const fetchPendingData = async () => {
    setLoadingTasks(true);
    try {
      const tugasSnap = await getDocs(query(collection(db, "jawaban_tugas"), where("score", "!=", null)));
      const semuaTugas = tugasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const belumEksporTugas = semuaTugas.filter(t => !t.exportedToRaport && t.studentId && t.studentName);
      setPendingTasks(belumEksporTugas.slice(0, 20));

      const quizSnap = await getDocs(query(collection(db, "jawaban_kuis"), where("score", "!=", null)));
      const semuaQuiz = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const belumEksporQuiz = semuaQuiz.filter(q => !q.exportedToRaport && q.userId && q.userName);
      setPendingQuizzes(belumEksporQuiz.slice(0, 20));
    } catch (error) { console.error("Error fetching pending data:", error); }
    finally { setLoadingTasks(false); }
  };

  const fetchStudentDetail = async (studentId) => {
    setLoadingStudentData(true);
    try {
      const scoresSnap = await getDocs(query(
        collection(db, RAPORT_COLLECTIONS.SCORES), 
        where("studentId", "==", studentId), 
        where("periode", "==", currentPeriode),
        where("mapel", "==", selectedMapel)
      ));
      const currentScores = scoresSnap.docs.map(d => d.data());
      const grouped = { kuis: [], catatan: [], ujian: [], keaktifan: [] };
      currentScores.forEach(s => { if (grouped[s.komponen]) grouped[s.komponen].push(s); });
      setStudentScores(grouped);

      const lastMonth = getPreviousMonth(currentPeriode);
      const lastSnap = await getDocs(query(
        collection(db, RAPORT_COLLECTIONS.FINAL), 
        where("studentId", "==", studentId), 
        where("periode", "==", lastMonth),
        where("mapel", "==", selectedMapel)
      ));
      setLastMonthScores(!lastSnap.empty ? lastSnap.docs[0].data() : null);

      const tugasSnap = await getDocs(query(collection(db, "jawaban_tugas"), where("studentId", "==", studentId)));
      const semuaTugas = tugasSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'tugas' }));
      semuaTugas.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0);
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setStudentTasks(semuaTugas);

      const kuisSnap = await getDocs(query(collection(db, "jawaban_kuis"), where("userId", "==", studentId)));
      const semuaKuis = kuisSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'kuis' }));
      semuaKuis.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0);
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setStudentQuizzes(semuaKuis);
      
      setShowStudentDetail(true);
    } catch (e) { console.error("Error fetch student detail:", e); }
    finally { setLoadingStudentData(false); }
  };

  // ➕ fetchData sekarang terima parameter assignedIds
  const fetchData = async (assignedIds = []) => {
    setLoading(true);
    try {
      const snapSiswa = await getDocs(collection(db, "students"));
      let dataSiswa = snapSiswa.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // ➕ Filter: hanya siswa yang pernah dijadwalkan dengan guru ini
      if (assignedIds.length > 0) {
        dataSiswa = dataSiswa.filter(s => assignedIds.includes(s.id));
      }
      
      const qScores = query(
        collection(db, RAPORT_COLLECTIONS.SCORES), 
        where("periode", "==", currentPeriode),
        where("mapel", "==", selectedMapel)
      );
      const snapScores = await getDocs(qScores);
      const allScores = snapScores.docs.map(d => d.data());

      const mergedData = dataSiswa.map(siswa => {
        const siswaScores = allScores.filter(s => s.studentId === siswa.id);
        const komponenTerisi = [...new Set(siswaScores.map(s => s.komponen))];
        const totalTerisi = komponenTerisi.length;
        return { ...siswa, totalTerisi, komponenTerisi, statusNilai: totalTerisi >= 2 ? 'Sudah' : totalTerisi > 0 ? 'Sebagian' : 'Belum' };
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
    } catch (err) { console.error("Error fetchData:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let result = students;
    if (searchTerm) result = result.filter(s => s.nama?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterClass !== "Semua") result = result.filter(s => s.kelasSekolah?.includes(filterClass) || s.program?.includes(filterClass));
    if (filterStatus !== "Semua") result = result.filter(s => s.statusNilai === filterStatus);
    setFilteredStudents(result);
  }, [searchTerm, filterClass, filterStatus, students]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score || !topic) { alert("Mohon lengkapi nilai dan topik!"); return; }
    if (score < 0 || score > 100) { alert("Nilai harus antara 0-100!"); return; }
    
    setSubmitting(true);
    try {
      const result = await exportToRaportScores({
        studentId: selectedStudent.id, studentName: selectedStudent.nama, mapel: selectedMapel,
        topik: topic, nilai: parseInt(score), komponen: komponen,
        teacherId: guru.id, teacherName: guru.nama, qualitative: aspects
      });
      
      if (result.success) {
        alert(`✅ Nilai ${selectedStudent.nama} (${komponen}) berhasil disimpan ke raport ${selectedMapel}!`);
        setScore(""); setTopic(""); setKomponen("keaktifan");
        setAspects({ pemahaman: 3, aplikasi: 3, literasi: 3, inisiatif: 3, mandiri: 3 });
        fetchStudentDetail(selectedStudent.id);
        fetchData(assignedStudentIds);
        fetchTopics();
      } else { alert("❌ Gagal menyimpan: " + result.error); }
    } catch (err) { alert("❌ Gagal menyimpan: " + err.message); }
    finally { setSubmitting(false); }
  };

  const handleImportSingleForStudent = async (item) => {
    setSubmitting(true);
    try {
      const result = await exportToRaportScores({
        studentId: item.studentId || item.userId,
        studentName: item.studentName || item.userName,
        mapel: selectedMapel,
        topik: item.modulTitle || item.quizTitle,
        nilai: item.score,
        komponen: item.source === 'kuis' ? 'kuis' : 'catatan',
        teacherId: guru.id,
        teacherName: guru.nama
      });
      if (result.success) {
        const colName = item.source === 'kuis' ? 'jawaban_kuis' : 'jawaban_tugas';
        try { await updateDoc(doc(db, colName, item.id), { exportedToRaport: true }); } catch (e) {}
        alert(`✅ ${item.source === 'kuis' ? 'Kuis' : 'Tugas'} berhasil diimpor ke ${selectedMapel}!`);
        fetchStudentDetail(selectedStudent.id);
        fetchData(assignedStudentIds);
      } else { alert("❌ Gagal: " + result.error); }
    } catch (err) { alert("❌ Gagal: " + err.message); }
    finally { setSubmitting(false); }
  };

  const handleExportFromTask = async (item) => {
    setSubmitting(true);
    try {
      const result = await exportToRaportScores({ studentId: item.studentId, studentName: item.studentName, mapel: selectedMapel, topik: item.modulTitle, nilai: item.score, komponen: 'catatan', teacherId: guru.id, teacherName: guru.nama });
      if (result.success) {
        try { await updateDoc(doc(db, "jawaban_tugas", item.id), { exportedToRaport: true }); } catch (updateErr) {}
        alert(`✅ Nilai tugas ${item.studentName} berhasil diekspor ke ${selectedMapel}!`);
        fetchPendingData(); fetchData(assignedStudentIds);
      } else { alert("❌ Gagal: " + result.error); }
    } catch (err) { alert("❌ Gagal: " + err.message); }
    finally { setSubmitting(false); }
  };

  const handleExportFromQuiz = async (item) => {
    setSubmitting(true);
    try {
      const result = await exportToRaportScores({ studentId: item.userId, studentName: item.userName, mapel: selectedMapel, topik: item.modulTitle || item.quizTitle, nilai: item.score, komponen: 'kuis', teacherId: guru.id, teacherName: guru.nama });
      if (result.success) {
        try { await updateDoc(doc(db, "jawaban_kuis", item.id), { exportedToRaport: true }); } catch (updateErr) {}
        alert(`✅ Nilai kuis ${item.userName} berhasil diekspor ke ${selectedMapel}!`);
        fetchPendingData(); fetchData(assignedStudentIds);
      } else { alert("❌ Gagal: " + result.error); }
    } catch (err) { alert("❌ Gagal: " + err.message); }
    finally { setSubmitting(false); }
  };

  const getScoreColor = (score) => { if (score >= 85) return '#10b981'; if (score >= 70) return '#3b82f6'; if (score >= 60) return '#f59e0b'; return '#ef4444'; };
  const getScoreAdvice = (score) => { if (score >= 85) return { text: 'Luar biasa!', color: '#10b981', icon: '🏆' }; if (score >= 75) return { text: 'Bagus!', color: '#3b82f6', icon: '👍' }; if (score >= 60) return { text: 'Cukup.', color: '#f59e0b', icon: '⚠️' }; return { text: 'Perlu perhatian.', color: '#ef4444', icon: '🔴' }; };
  const getKomponenLabel = (komp) => { const labels = { kuis: '📝 Kuis (30% bobot)', catatan: '📓 Tugas Catatan (30% bobot)', ujian: '📖 Ujian Materi (20% bobot)', keaktifan: '⭐ Keaktifan (20% bobot)' }; return labels[komp] || '📋 Nilai Umum'; };
  const getStatusColor = (status) => { if (status === 'Sudah') return { bg: '#dcfce7', color: '#166534', border: '#10b981' }; if (status === 'Sebagian') return { bg: '#fef3c7', color: '#b45309', border: '#f59e0b' }; return { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' }; };
  const komponenList = ['kuis', 'catatan', 'ujian', 'keaktifan'];
  const formatDate = (ts) => { if (!ts) return "-"; try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); } catch { return "-"; } };

  const RenderRating = ({ label, value, field, desc }) => (
    <div style={{marginBottom:12, background:'#f8fafc', padding:'12px', borderRadius:10, border:'1px solid #e2e8f0'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{flex:1}}><label style={{fontWeight:'bold', fontSize:12, color:'#2c3e50'}}>{label}</label><p style={{fontSize:10, color:'#7f8c8d', margin:'2px 0 0 0'}}>{desc}</p></div>
        <span style={{fontWeight:'bold', color:'#3498db', fontSize:14, marginLeft:10}}>{value}/5</span>
      </div>
      <input type="range" min="1" max="5" step="1" value={value} onChange={(e) => setAspects({...aspects, [field]: parseInt(e.target.value)})} style={{width:'100%', accentColor:'#3498db', marginTop:8, cursor:'pointer'}} />
      <div style={{display:'flex', justifyContent:'space-between', marginTop:4, fontSize:9, color:'#94a3b8'}}><span>Kurang</span><span>Cukup</span><span>Baik</span><span>Sangat Baik</span><span>Luar Biasa</span></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', background: '#f1f5f9', minHeight: '100vh' }}>
      <SidebarGuru />
      <div style={{ marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '10px' : '20px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box', transition: 'all 0.3s ease' }}>
        <div style={{width: '100%'}}>
          
          {/* HEADER */}
          <div style={{marginBottom: 20}}>
            <h1 style={{margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 'bold', color: '#1e293b'}}>📊 Smart Input Nilai</h1>
            <p style={{margin: '4px 0 0', fontSize: 12, color: '#64748b'}}>
              Input nilai akademik, karakter, dan impor tugas/kuis • Menampilkan {assignedStudentIds.length} siswa dari jadwal Anda
            </p>
          </div>

          {/* ➕ PANDUAN GURU */}
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Info size={18} color="#b45309" style={{marginTop: 2, flexShrink: 0}} />
            <div style={{flex: 1, fontSize: 11, color: '#b45309', lineHeight: 1.8}}>
              <b>📋 Cara Input Nilai:</b><br/>
              1️⃣ Hanya siswa yang <b>pernah dijadwalkan</b> dengan Anda yang muncul di sini<br/>
              2️⃣ Klik <b>Detail</b> → lihat status komponen (✅/❌) + tugas & kuis siswa<br/>
              3️⃣ Klik <b>Impor</b> untuk memasukkan nilai otomatis dari tugas/kuis<br/>
              4️⃣ Atau isi manual: pilih komponen → isi nilai 0-100 → atur karakter (1-5)<br/>
              5️⃣ Minimal <b>2 komponen</b> terisi → buka <b>Generate Raport</b>
            </div>
          </div>

          {/* INFO SKEMA BOBOT */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Info size={18} color="#0369a1" style={{marginTop: 2}} />
            <div style={{flex: 1, fontSize: 12, color: '#0369a1', lineHeight: 1.6}}>
              <b>ℹ️ Skema:</b> Kuis 30% • Tugas 30% • Ujian 20% • Keaktifan 20% | Minimal <b>2 komponen</b>. Bobot <b>otomatis proporsional</b> jika ada komponen kosong.
            </div>
          </div>

          {/* INFO GURU */}
          <div style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 32, height: 32, background: '#eef2ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="#3b82f6" /></div>
                  <span style={{ fontWeight: 'bold', fontSize: 13, color: '#1e293b' }}>{guru?.nama}</span>
                  <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 'bold', color: '#d97706' }}>{selectedMapel}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Periode: {currentPeriode.replace('-', ' / ')} • 
                  ➕ <b>{assignedStudentIds.length}</b> siswa dari jadwal
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: 8 }}><div style={{ fontSize: 16, fontWeight: 'bold', color: '#3b82f6' }}>{stats.total}</div><div style={{ fontSize: 8, color: '#64748b' }}>Total</div></div>
                <div style={{ textAlign: 'center', background: '#dcfce7', padding: '6px 10px', borderRadius: 8 }}><div style={{ fontSize: 16, fontWeight: 'bold', color: '#166534' }}>{stats.sudah}</div><div style={{ fontSize: 8, color: '#166534' }}>≥2 komp</div></div>
                <div style={{ textAlign: 'center', background: '#fef3c7', padding: '6px 10px', borderRadius: 8 }}><div style={{ fontSize: 16, fontWeight: 'bold', color: '#b45309' }}>{stats.sebagian || 0}</div><div style={{ fontSize: 8, color: '#b45309' }}>1 komp</div></div>
                <div style={{ textAlign: 'center', background: '#fee2e2', padding: '6px 10px', borderRadius: 8 }}><div style={{ fontSize: 16, fontWeight: 'bold', color: '#991b1b' }}>{stats.belum}</div><div style={{ fontSize: 8, color: '#991b1b' }}>0 komp</div></div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => { setActiveTab('manual'); setSelectedStudent(null); setShowStudentDetail(false); }} style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', background: activeTab === 'manual' ? '#3b82f6' : 'white', color: activeTab === 'manual' ? 'white' : '#64748b', border: activeTab === 'manual' ? 'none' : '1px solid #e2e8f0', boxShadow: activeTab === 'manual' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>✍️ Input Manual</button>
            <button onClick={() => { setActiveTab('fromTasks'); fetchPendingData(); }} style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', background: activeTab === 'fromTasks' ? '#10b981' : 'white', color: activeTab === 'fromTasks' ? 'white' : '#64748b', border: activeTab === 'fromTasks' ? 'none' : '1px solid #e2e8f0', boxShadow: activeTab === 'fromTasks' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>📥 Impor Tugas ({pendingTasks.length})</button>
            <button onClick={() => { setActiveTab('fromQuizzes'); fetchPendingData(); }} style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', background: activeTab === 'fromQuizzes' ? '#8b5cf6' : 'white', color: activeTab === 'fromQuizzes' ? 'white' : '#64748b', border: activeTab === 'fromQuizzes' ? 'none' : '1px solid #e2e8f0', boxShadow: activeTab === 'fromQuizzes' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>❓ Impor Kuis ({pendingQuizzes.length})</button>
          </div>

          {/* ============================================================ */}
          {/* DAFTAR SISWA */}
          {/* ============================================================ */}
          {activeTab === 'manual' && !selectedStudent && (
            <>
              {/* ➕ INFO JUMLAH SISWA */}
              {assignedStudentIds.length === 0 && !loading && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: 20, marginBottom: 16, textAlign: 'center' }}>
                  <Users size={40} color="#b45309" style={{marginBottom: 8}} />
                  <p style={{fontWeight: 700, color: '#b45309', margin: 0}}>Belum ada siswa di jadwal Anda</p>
                  <p style={{fontSize: 12, color: '#92400e', margin: '4px 0 0'}}>
                    Siswa akan muncul di sini setelah Admin menambahkan Anda ke jadwal mengajar.
                  </p>
                </div>
              )}

              <div style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, width: '100%' }}>
                  <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <Search size={16} color="#94a3b8" />
                    <input type="text" placeholder="Cari nama siswa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13 }} />
                  </div>
                  <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, background: 'white', minWidth: 120 }}>
                    <option value="Semua">📚 Semua Jenjang</option><option value="SD">SD</option><option value="SMP">SMP</option>
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, background: 'white', minWidth: 120 }}>
                    <option value="Semua">📋 Semua Status</option><option value="Belum">🔴 Belum</option><option value="Sebagian">🟡 Sebagian</option><option value="Sudah">🟢 Lengkap</option>
                  </select>
                  <button onClick={() => { fetchData(assignedStudentIds); }} style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer' }}><RefreshCw size={14} /></button>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}><div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div><p style={{ color: '#64748b', fontSize: 13 }}>Memuat data siswa...</p></div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}><Users size={40} color="#cbd5e1" /><p style={{ marginTop: 10, color: '#94a3b8', fontSize: 13 }}>Tidak ada siswa ditemukan</p></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '140px' : '170px'}, 1fr))`, gap: 10 }}>
                  {filteredStudents.map(s => {
                    const statusStyle = getStatusColor(s.statusNilai);
                    return (
                      <div key={s.id} style={{ background: 'white', borderRadius: 12, padding: 12, border: `2px solid ${statusStyle.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div onClick={() => { setSelectedStudent(s); fetchStudentDetail(s.id); }} style={{ flex: 1, cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={15} color="#3b82f6" /></div>
                              <div style={{ flex: 1 }}><div style={{ fontWeight: 'bold', fontSize: 12, color: '#1e293b' }}>{s.nama}</div><div style={{ fontSize: 9, color: '#64748b' }}>{s.kelasSekolah || '-'}</div></div>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(s); fetchStudentDetail(s.id); }} style={{ background: '#eef2ff', border: 'none', color: '#3b82f6', padding: '3px 7px', borderRadius: 6, fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}><Eye size={11} /> Detail</button>
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 6 }}>
                          {komponenList.map(komp => { const terisi = s.komponenTerisi?.includes(komp); return (<span key={komp} style={{ fontSize: 7, padding: '2px 5px', borderRadius: 4, background: terisi ? '#dcfce7' : '#fee2e2', color: terisi ? '#166534' : '#991b1b', fontWeight: 'bold' }}>{komp === 'kuis' ? '📝' : komp === 'catatan' ? '📓' : komp === 'ujian' ? '📖' : '⭐'}{terisi ? '✓' : '✗'}</span>); })}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 'bold', marginTop: 6, color: statusStyle.color, background: statusStyle.bg, padding: '3px 6px', borderRadius: 4, textAlign: 'center' }}>{s.statusNilai === 'Sudah' ? `✅ LENGKAP (${s.totalTerisi}/4)` : s.statusNilai === 'Sebagian' ? `🟡 SEBAGIAN (${s.totalTerisi}/4)` : '🔴 BELUM'}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* DETAIL SISWA + FORM (TIDAK BERUBAH) */}
          {/* ============================================================ */}
          {activeTab === 'manual' && selectedStudent && (
            <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 16 : 20, border: '1px solid #e2e8f0' }}>
              <button onClick={() => { setSelectedStudent(null); setShowStudentDetail(false); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 14 }}><ArrowLeft size={16} /> Kembali ke Daftar</button>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 'bold', color: '#1e293b' }}>{selectedStudent.nama}</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{selectedStudent.kelasSekolah} | {selectedStudent.program || selectedStudent.detailProgram || 'Reguler'}</p>
              </div>

              {showStudentDetail && (
                <>
                  <h4 style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 10, color: '#1e293b' }}>📋 Status {currentPeriode.replace('-', ' / ')} — Mapel: {selectedMapel}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {komponenList.map(komp => {
                      const dataKomp = studentScores?.[komp] || [];
                      const terisi = dataKomp.length > 0;
                      const avgNilai = terisi ? Math.round(dataKomp.reduce((a,b) => a + b.nilai, 0) / dataKomp.length) : null;
                      return (
                        <div key={komp} style={{ padding: 10, borderRadius: 8, textAlign: 'center', background: terisi ? '#dcfce7' : '#fee2e2', border: `1px solid ${terisi ? '#10b981' : '#ef4444'}` }}>
                          <div style={{ fontSize: 18, marginBottom: 2 }}>{komp === 'kuis' ? '📝' : komp === 'catatan' ? '📓' : komp === 'ujian' ? '📖' : '⭐'}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: terisi ? '#166534' : '#991b1b' }}>{komp === 'kuis' ? 'Kuis' : komp === 'catatan' ? 'Catatan' : komp === 'ujian' ? 'Ujian' : 'Keaktifan'}</div>
                          {terisi ? <div style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>{avgNilai}</div> : <div style={{ fontSize: 9, color: '#991b1b', fontWeight: 600 }}>BELUM</div>}
                          <div style={{ fontSize: 7, color: '#64748b' }}>{terisi ? `${dataKomp.length} data` : 'Butuh input'}</div>
                        </div>
                      );
                    })}
                  </div>

                  {lastMonthScores && (
                    <div style={{ background: '#f0f9ff', padding: 10, borderRadius: 8, border: '1px solid #bae6fd', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>📅 Bulan Lalu ({selectedMapel}): Nilai Akhir <b>{lastMonthScores.nilai_akhir}</b></div>
                    </div>
                  )}

                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 6 }}><Download size={16} /> 📥 Tugas & Kuis {selectedStudent.nama}</h4>
                    {loadingStudentData ? (
                      <div style={{ textAlign: 'center', padding: 16 }}><div style={{ width: 20, height: 20, border: '2px solid #e9d5ff', borderTop: '2px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }}></div></div>
                    ) : (
                      <>
                        <div style={{ marginBottom: 12 }}>
                          <h5 style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>📓 Tugas ({studentTasks.length})</h5>
                          {studentTasks.length === 0 ? <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>Belum ada</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                              {studentTasks.map(task => (
                                <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'white', borderRadius: 6, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 4 }}>
                                  <div style={{ flex: 1, minWidth: 100 }}><div style={{ fontSize: 10, fontWeight: 700 }}>{task.modulTitle || 'Tugas'}</div><div style={{ fontSize: 8, color: '#64748b' }}>{formatDate(task.submittedAt)} • Nilai: <b>{task.score ?? '?'}</b></div></div>
                                  {task.exportedToRaport ? <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: 12, fontSize: 8, fontWeight: 700 }}>✅</span> : task.score ? <button onClick={() => handleImportSingleForStudent({...task, source: 'tugas', studentId: task.studentId || selectedStudent.id, studentName: task.studentName || selectedStudent.nama})} disabled={submitting} style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>📥 Impor</button> : <span style={{ fontSize: 8, color: '#f59e0b' }}>⏳</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>📝 Kuis ({studentQuizzes.length})</h5>
                          {studentQuizzes.length === 0 ? <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>Belum ada</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                              {studentQuizzes.map(quiz => (
                                <div key={quiz.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'white', borderRadius: 6, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 4 }}>
                                  <div style={{ flex: 1, minWidth: 100 }}><div style={{ fontSize: 10, fontWeight: 700 }}>{quiz.modulTitle || quiz.quizTitle || 'Kuis'}</div><div style={{ fontSize: 8, color: '#64748b' }}>{formatDate(quiz.submittedAt)} • Nilai: <b>{quiz.score ?? '?'}</b></div></div>
                                  {quiz.exportedToRaport ? <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: 12, fontSize: 8, fontWeight: 700 }}>✅</span> : quiz.score ? <button onClick={() => handleImportSingleForStudent({...quiz, source: 'kuis', studentId: selectedStudent.id, studentName: selectedStudent.nama, userId: selectedStudent.id, userName: selectedStudent.nama})} disabled={submitting} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>📥 Impor</button> : <span style={{ fontSize: 8, color: '#f59e0b' }}>⏳</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />
                </>
              )}

              {/* FORM INPUT MANUAL */}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: 6 }}>🎯 Komponen Nilai</label>
                  <select value={komponen} onChange={e => setKomponen(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: 'white' }}>
                    <option value="keaktifan">⭐ Keaktifan (20%)</option><option value="catatan">📓 Tugas (30%)</option><option value="kuis">📝 Kuis (30%)</option><option value="ujian">📖 Ujian (20%)</option>
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={15} color="#3b82f6" /> A. Capaian Akademik</h4>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
                    <div style={{ flex: 2 }}><label style={{ fontSize: 10, fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: 4 }}>Topik</label><input type="text" list="topics" required placeholder="Materi..." value={topic} onChange={e => setTopic(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} /><datalist id="topics">{availableTopics.map(t => <option key={t} value={t} />)}</datalist></div>
                    <div style={{ flex: 1 }}><label style={{ fontSize: 10, fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: 4 }}>Nilai (0-100)</label><input type="number" required min="0" max="100" placeholder="85" value={score} onChange={e => setScore(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #3b82f6', fontSize: 16, fontWeight: 'bold', textAlign: 'center', outline: 'none' }} /></div>
                  </div>
                  {score && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: getScoreAdvice(score).color + '10', border: `1px solid ${getScoreAdvice(score).color}` }}><span style={{ fontSize: 12 }}>{getScoreAdvice(score).icon} {getScoreAdvice(score).text}</span></div>}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}><Star size={15} color="#f59e0b" /> B. Karakter & Sikap</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                    <RenderRating label="Pemahaman Konsep" desc="Penguasaan teori" value={aspects.pemahaman} field="pemahaman" />
                    <RenderRating label="Logika & Aplikasi" desc="Variasi soal" value={aspects.aplikasi} field="aplikasi" />
                    <RenderRating label="Literasi / Fokus" desc="Ketelitian" value={aspects.literasi} field="literasi" />
                    <RenderRating label="Inisiatif" desc="Bertanya" value={aspects.inisiatif} field="inisiatif" />
                    <RenderRating label="Kemandirian" desc="Tanpa bantuan" value={aspects.mandiri} field="mandiri" />
                  </div>
                </div>
                <button type="submit" disabled={submitting} style={{ width: '100%', padding: 13, background: submitting ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Save size={18} />{submitting ? 'Menyimpan...' : '💾 SIMPAN'}</button>
              </form>
            </div>
          )}

          {/* TAB IMPOR TUGAS (BULK) */}
          {activeTab === 'fromTasks' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color="#10b981" /> Nilai Tugas Siap Diimpor</h3>
              {loadingTasks ? <div style={{ textAlign: 'center', padding: 40 }}><div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div></div>
              : pendingTasks.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}><CheckCircle size={40} /><p style={{ marginTop: 12 }}>Semua sudah diimpor</p></div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{pendingTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>
                  <div><div style={{ fontWeight: 'bold', fontSize: 13 }}>{task.studentName}</div><div style={{ fontSize: 10, color: '#64748b' }}>{task.modulTitle} • {task.score}</div></div>
                  <button onClick={() => handleExportFromTask(task)} disabled={submitting} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>📥 Impor</button>
                </div>
              ))}</div>}
            </div>
          )}

          {/* TAB IMPOR KUIS (BULK) */}
          {activeTab === 'fromQuizzes' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}><HelpCircle size={18} color="#8b5cf6" /> Nilai Kuis Siap Diimpor</h3>
              {loadingTasks ? <div style={{ textAlign: 'center', padding: 40 }}><div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div></div>
              : pendingQuizzes.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}><CheckCircle size={40} /><p style={{ marginTop: 12 }}>Semua sudah diimpor</p></div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{pendingQuizzes.map(quiz => (
                <div key={quiz.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>
                  <div><div style={{ fontWeight: 'bold', fontSize: 13 }}>{quiz.userName}</div><div style={{ fontSize: 10, color: '#64748b' }}>{quiz.modulTitle || quiz.quizTitle} • {quiz.score}</div></div>
                  <button onClick={() => handleExportFromQuiz(quiz)} disabled={submitting} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>📥 Impor</button>
                </div>
              ))}</div>}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TeacherInputGrade;