import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import SidebarGuru from '../../../components/SidebarGuru';
import { 
  CheckCircle, Search, User, BookOpen, 
  Star, Save, ArrowLeft, Users,
  FileText, HelpCircle, RefreshCw, Eye, Info, 
  Brain, Lightbulb, Target, Clock, Zap, MessageSquare
} from 'lucide-react';
import { RAPORT_COLLECTIONS, DIMENSI_CONFIG, DIMENSI_KEYS, KOMPONEN_BOBOT, KOMPONEN_LABEL } from '../../../firebase/raportCollection';
import { exportToRaportScores, saveCatatanGuru, getCatatanGuru } from '../../../services/raportService';

const TeacherInputGrade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [guru] = useState(() => {
    const stateGuru = location.state?.teacher;
    const localGuru = localStorage.getItem('teacherData');
    return stateGuru || (localGuru ? JSON.parse(localGuru) : null);
  });

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("Semua");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  // 5 Dimensi Penilaian (0-100)
  const [dimensi, setDimensi] = useState({
    pemahaman: 75,
    analisis: 75,
    ketelitian: 75,
    waktu: 75,
    dayaTangkap: 75
  });
  
  const [topic, setTopic] = useState("");
  const [komponen, setKomponen] = useState("kuis");
  const [catatanGuru, setCatatanGuru] = useState("");
  const [savedCatatan, setSavedCatatan] = useState(null);
  
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
  const [loadingStudentData, setLoadingStudentData] = useState(false);

  // Ikon untuk tiap dimensi
  const dimensiIcons = {
    pemahaman: <Brain size={16} />,
    analisis: <Lightbulb size={16} />,
    ketelitian: <Target size={16} />,
    waktu: <Clock size={16} />,
    dayaTangkap: <Zap size={16} />
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!guru) { 
      alert("Sesi berakhir, silakan login kembali.");
      navigate('/login-guru'); 
      return; 
    }
    fetchAllStudents();
    fetchTopics();
    fetchPendingData();
  }, [guru, navigate]);

  // AMBIL SEMUA SISWA
  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const snapSiswa = await getDocs(collection(db, "students"));
      let dataSiswa = snapSiswa.docs.map(d => ({ id: d.id, ...d.data() }));
      
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
    } catch (err) { console.error("Error fetchAllStudents:", err); } 
    finally { setLoading(false); }
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
      const grouped = { kuis: [], tugas: [], ujian: [] };
      currentScores.forEach(s => { if (grouped[s.komponen]) grouped[s.komponen].push(s); });
      setStudentScores(grouped);

      // Ambil catatan guru yang sudah ada
      const existingCatatan = await getCatatanGuru(studentId, selectedMapel, currentPeriode);
      setSavedCatatan(existingCatatan);
      setCatatanGuru(existingCatatan?.catatan || "");
      
      setShowStudentDetail(true);
    } catch (e) { console.error("Error fetch student detail:", e); }
    finally { setLoadingStudentData(false); }
  };

  useEffect(() => {
    let result = students;
    if (searchTerm) result = result.filter(s => s.nama?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterClass !== "Semua") result = result.filter(s => s.kelasSekolah?.includes(filterClass) || s.program?.includes(filterClass));
    setFilteredStudents(result);
  }, [searchTerm, filterClass, students]);

  // HITUNG RATA-RATA 5 DIMENSI
  const hitungRataDimensi = () => {
    const values = DIMENSI_KEYS.map(k => dimensi[k] || 0);
    return Math.round((values.reduce((a, b) => a + b, 0) / 5) * 10) / 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic) { alert("Mohon isi topik materi!"); return; }
    
    const nilaiAkhir = hitungRataDimensi();
    
    setSubmitting(true);
    try {
      // 1. Simpan nilai ke raport_scores
      const result = await exportToRaportScores({
        studentId: selectedStudent.id, 
        studentName: selectedStudent.nama, 
        mapel: selectedMapel,
        topik: topic, 
        nilai: nilaiAkhir, 
        komponen: komponen,
        dimensi: dimensi,
        teacherId: guru.id, 
        teacherName: guru.nama,
        catatan: catatanGuru || undefined
      });
      
      // 2. Simpan catatan guru (jika diisi)
      if (catatanGuru.trim()) {
        await saveCatatanGuru({
          studentId: selectedStudent.id,
          studentName: selectedStudent.nama,
          mapel: selectedMapel,
          periode: currentPeriode,
          catatan: catatanGuru,
          teacherId: guru.id,
          teacherName: guru.nama
        });
      }
      
      if (result.success) {
        alert(`✅ Nilai ${selectedStudent.nama} (${KOMPONEN_LABEL[komponen]}) berhasil disimpan!\nRata-rata 5 Dimensi: ${nilaiAkhir}`);
        setTopic("");
        setCatatanGuru("");
        setDimensi({ pemahaman: 75, analisis: 75, ketelitian: 75, waktu: 75, dayaTangkap: 75 });
        fetchStudentDetail(selectedStudent.id);
        fetchAllStudents();
        fetchTopics();
      } else { alert("❌ Gagal menyimpan: " + result.error); }
    } catch (err) { alert("❌ Gagal menyimpan: " + err.message); }
    finally { setSubmitting(false); }
  };

  // Simpan catatan guru saja (tanpa nilai)
  const handleSaveCatatanOnly = async () => {
    if (!catatanGuru.trim()) { alert("Catatan tidak boleh kosong!"); return; }
    setSubmitting(true);
    try {
      const result = await saveCatatanGuru({
        studentId: selectedStudent.id,
        studentName: selectedStudent.nama,
        mapel: selectedMapel,
        periode: currentPeriode,
        catatan: catatanGuru,
        teacherId: guru.id,
        teacherName: guru.nama
      });
      if (result.success) {
        alert("✅ Catatan berhasil disimpan!");
        setSavedCatatan({ catatan: catatanGuru });
      } else { alert("❌ Gagal: " + result.error); }
    } catch (err) { alert("❌ Gagal: " + err.message); }
    finally { setSubmitting(false); }
  };

  const handleImportSingleForStudent = async (item) => {
    setSubmitting(true);
    try {
      // Konversi nilai lama ke 5 dimensi (rata-rata)
      const nilaiScore = item.score || 75;
      const defaultDimensi = {
        pemahaman: nilaiScore,
        analisis: Math.max(0, nilaiScore - 5),
        ketelitian: Math.max(0, nilaiScore - 10),
        waktu: Math.max(0, nilaiScore - 5),
        dayaTangkap: nilaiScore
      };
      
      const avgNilai = Math.round(
        DIMENSI_KEYS.reduce((sum, k) => sum + defaultDimensi[k], 0) / 5 * 10
      ) / 10;
      
      const result = await exportToRaportScores({
        studentId: item.studentId || item.userId,
        studentName: item.studentName || item.userName,
        mapel: selectedMapel,
        topik: item.modulTitle || item.quizTitle || 'Impor Otomatis',
        nilai: avgNilai,
        komponen: item.source === 'kuis' ? 'kuis' : 'tugas',
        dimensi: defaultDimensi,
        teacherId: guru.id,
        teacherName: guru.nama
      });
      
      if (result.success) {
        const colName = item.source === 'kuis' ? 'jawaban_kuis' : 'jawaban_tugas';
        try { await updateDoc(doc(db, colName, item.id), { exportedToRaport: true }); } catch (e) {}
        alert(`✅ ${item.source === 'kuis' ? 'Kuis' : 'Tugas'} berhasil diimpor ke ${selectedMapel}!`);
        fetchStudentDetail(selectedStudent.id);
        fetchAllStudents();
      } else { alert("❌ Gagal: " + result.error); }
    } catch (err) { alert("❌ Gagal: " + err.message); }
    finally { setSubmitting(false); }
  };

  const getStatusColor = (status) => { 
    if (status === 'Sudah') return { bg: '#dcfce7', color: '#166534', border: '#10b981' }; 
    if (status === 'Sebagian') return { bg: '#fef3c7', color: '#b45309', border: '#f59e0b' }; 
    return { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' }; 
  };
  
  const komponenList = ['kuis', 'tugas', 'ujian'];
  const formatDate = (ts) => { 
    if (!ts) return "-"; 
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); } 
    catch { return "-"; } 
  };

  // Komponen render 1 slider dimensi
  const RenderDimensiSlider = ({ field, label, desc, icon }) => (
    <div style={{
      background: '#f8fafc', 
      padding: '14px', 
      borderRadius: 10, 
      border: '1px solid #e2e8f0',
      marginBottom: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#3b82f6' }}>{icon}</span>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: 12, color: '#1e293b' }}>{label}</label>
            <p style={{ fontSize: 9, color: '#64748b', margin: '2px 0 0 0' }}>{desc}</p>
          </div>
        </div>
        <span style={{ 
          fontWeight: 'bold', 
          fontSize: 18, 
          color: dimensi[field] >= 70 ? '#10b981' : dimensi[field] >= 50 ? '#f59e0b' : '#ef4444',
          minWidth: 40, 
          textAlign: 'center' 
        }}>
          {dimensi[field]}
        </span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        step="5"
        value={dimensi[field]} 
        onChange={(e) => setDimensi({...dimensi, [field]: parseInt(e.target.value)})} 
        style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }} 
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 8, color: '#94a3b8' }}>
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
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
        <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto' }}>
          
          {/* HEADER */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 'bold', color: '#1e293b' }}>📊 Input Nilai 5 Dimensi</h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
              Nilai berdasarkan 5 aspek: Pemahaman, Analisis, Ketelitian, Manajemen Waktu, & Daya Tangkap
            </p>
          </div>

          {/* ATURAN NILAI */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>
              <b>📐 Aturan Nilai Akhir:</b><br/>
              • Ada <b>Ujian</b> → pakai nilai ujian<br/>
              • <b>Quiz + Tugas</b> (belum ujian) → rata-rata keduanya<br/>
              • <b>Lengkap</b> (Quiz+Tugas+Ujian) → Quiz 30% + Tugas 30% + Ujian 40%
            </div>
          </div>

          {/* INFO GURU */}
          <div style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: '#eef2ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="#3b82f6" />
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: 13, color: '#1e293b' }}>{guru?.nama}</span>
                  <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 'bold', color: '#d97706', marginLeft: 8 }}>{selectedMapel}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#3b82f6' }}>{stats.total}</div>
                  <div style={{ fontSize: 8, color: '#64748b' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center', background: '#dcfce7', padding: '6px 10px', borderRadius: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#166534' }}>{stats.sudah}</div>
                  <div style={{ fontSize: 8, color: '#166534' }}>≥2 komp</div>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => { setActiveTab('manual'); setSelectedStudent(null); setShowStudentDetail(false); }} 
              style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', 
                background: activeTab === 'manual' ? '#3b82f6' : 'white', color: activeTab === 'manual' ? 'white' : '#64748b', 
                border: activeTab === 'manual' ? 'none' : '1px solid #e2e8f0' }}>
              ✍️ Input Manual
            </button>
            <button onClick={() => { setActiveTab('fromTasks'); fetchPendingData(); }} 
              style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', 
                background: activeTab === 'fromTasks' ? '#10b981' : 'white', color: activeTab === 'fromTasks' ? 'white' : '#64748b', 
                border: activeTab === 'fromTasks' ? 'none' : '1px solid #e2e8f0' }}>
              📥 Impor Tugas ({pendingTasks.length})
            </button>
            <button onClick={() => { setActiveTab('fromQuizzes'); fetchPendingData(); }} 
              style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', 
                background: activeTab === 'fromQuizzes' ? '#8b5cf6' : 'white', color: activeTab === 'fromQuizzes' ? 'white' : '#64748b', 
                border: activeTab === 'fromQuizzes' ? 'none' : '1px solid #e2e8f0' }}>
              ❓ Impor Kuis ({pendingQuizzes.length})
            </button>
          </div>

          {/* ============================================================ */}
          {/* DAFTAR SISWA */}
          {/* ============================================================ */}
          {activeTab === 'manual' && !selectedStudent && (
            <>
              <div style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
                  <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <Search size={16} color="#94a3b8" />
                    <input type="text" placeholder="Cari nama siswa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13 }} />
                  </div>
                  <select value={filterClass} onChange={e => setFilterClass(e.target.value)} 
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, background: 'white', minWidth: 120 }}>
                    <option value="Semua">📚 Semua Jenjang</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                  </select>
                  <button onClick={() => { fetchAllStudents(); }} 
                    style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer' }}>
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                  <p style={{ color: '#64748b', fontSize: 13 }}>Memuat data siswa...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
                  <Users size={40} color="#cbd5e1" />
                  <p style={{ marginTop: 10, color: '#94a3b8', fontSize: 13 }}>Tidak ada siswa ditemukan</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '140px' : '170px'}, 1fr))`, gap: 10 }}>
                  {filteredStudents.map(s => {
                    const statusStyle = getStatusColor(s.statusNilai);
                    return (
                      <div key={s.id} style={{ background: 'white', borderRadius: 12, padding: 12, border: `2px solid ${statusStyle.border}`, cursor: 'pointer' }}
                        onClick={() => { setSelectedStudent(s); fetchStudentDetail(s.id); }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={15} color="#3b82f6" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: 12, color: '#1e293b' }}>{s.nama}</div>
                            <div style={{ fontSize: 9, color: '#64748b' }}>{s.kelasSekolah || '-'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 6 }}>
                          {komponenList.map(komp => { 
                            const terisi = s.komponenTerisi?.includes(komp); 
                            return (
                              <span key={komp} style={{ fontSize: 7, padding: '2px 5px', borderRadius: 4, 
                                background: terisi ? '#dcfce7' : '#fee2e2', color: terisi ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                                {komp === 'kuis' ? '📝' : komp === 'tugas' ? '📓' : '📖'}{terisi ? '✓' : '✗'}
                              </span>
                            ); 
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* DETAIL SISWA + FORM 5 DIMENSI */}
          {/* ============================================================ */}
          {activeTab === 'manual' && selectedStudent && (
            <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 16 : 24, border: '1px solid #e2e8f0' }}>
              <button onClick={() => { setSelectedStudent(null); setShowStudentDetail(false); }} 
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                <ArrowLeft size={16} /> Kembali ke Daftar
              </button>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 'bold', color: '#1e293b' }}>{selectedStudent.nama}</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{selectedStudent.kelasSekolah} | {selectedStudent.program || selectedStudent.detailProgram || 'Reguler'}</p>
              </div>

              {/* STATUS KOMPONEN */}
              {showStudentDetail && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 10, color: '#1e293b' }}>
                    📋 Status Periode {currentPeriode.replace('-', ' / ')}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {komponenList.map(komp => {
                      const dataKomp = studentScores?.[komp] || [];
                      const terisi = dataKomp.length > 0;
                      const avgNilai = terisi ? Math.round(dataKomp.reduce((a,b) => a + (b.nilai || 0), 0) / dataKomp.length) : null;
                      return (
                        <div key={komp} style={{ padding: 10, borderRadius: 8, textAlign: 'center', 
                          background: terisi ? '#dcfce7' : '#fee2e2', border: `1px solid ${terisi ? '#10b981' : '#ef4444'}` }}>
                          <div style={{ fontSize: 18 }}>{komp === 'kuis' ? '📝' : komp === 'tugas' ? '📓' : '📖'}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: terisi ? '#166534' : '#991b1b' }}>
                            {KOMPONEN_LABEL[komp]}
                          </div>
                          {terisi ? <div style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>{avgNilai}</div> : 
                            <div style={{ fontSize: 9, color: '#991b1b', fontWeight: 600 }}>BELUM</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />

              {/* FORM INPUT 5 DIMENSI */}
              <form onSubmit={handleSubmit}>
                {/* PILIH KOMPONEN */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: 6 }}>🎯 Komponen Nilai</label>
                  <select value={komponen} onChange={e => setKomponen(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: 'white' }}>
                    <option value="kuis">📝 Kuis / Latihan (30%)</option>
                    <option value="tugas">📓 Tugas / Catatan (30%)</option>
                    <option value="ujian">📖 Ujian / Evaluasi (40%)</option>
                  </select>
                </div>

                {/* TOPIK */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: 6 }}>📌 Topik Materi</label>
                  <input type="text" list="topics" required placeholder="Contoh: Aljabar, Trigonometri..." value={topic} 
                    onChange={e => setTopic(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
                  <datalist id="topics">{availableTopics.map(t => <option key={t} value={t} />)}</datalist>
                </div>

                {/* 5 DIMENSI PENILAIAN */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={16} color="#f59e0b" /> 5 Dimensi Penilaian
                  </h4>
                  
                  <RenderDimensiSlider 
                    field="pemahaman" 
                    label={DIMENSI_CONFIG.pemahaman.label}
                    desc={DIMENSI_CONFIG.pemahaman.indikator}
                    icon={dimensiIcons.pemahaman}
                  />
                  <RenderDimensiSlider 
                    field="analisis" 
                    label={DIMENSI_CONFIG.analisis.label}
                    desc={DIMENSI_CONFIG.analisis.indikator}
                    icon={dimensiIcons.analisis}
                  />
                  <RenderDimensiSlider 
                    field="ketelitian" 
                    label={DIMENSI_CONFIG.ketelitian.label}
                    desc={DIMENSI_CONFIG.ketelitian.indikator}
                    icon={dimensiIcons.ketelitian}
                  />
                  <RenderDimensiSlider 
                    field="waktu" 
                    label={DIMENSI_CONFIG.waktu.label}
                    desc={DIMENSI_CONFIG.waktu.indikator}
                    icon={dimensiIcons.waktu}
                  />
                  <RenderDimensiSlider 
                    field="dayaTangkap" 
                    label={DIMENSI_CONFIG.dayaTangkap.label}
                    desc={DIMENSI_CONFIG.dayaTangkap.indikator}
                    icon={dimensiIcons.dayaTangkap}
                  />
                </div>

                {/* RATA-RATA 5 DIMENSI */}
                <div style={{ 
                  background: '#eef2ff', 
                  padding: 14, 
                  borderRadius: 10, 
                  marginBottom: 16, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: '2px solid #3b82f6'
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: 14, color: '#1e293b' }}>📊 Nilai Akhir (Rata-rata 5 Dimensi)</span>
                  <span style={{ fontWeight: 'bold', fontSize: 24, color: '#3b82f6' }}>{hitungRataDimensi()}</span>
                </div>

                {/* CATATAN GURU */}
                <div style={{ marginBottom: 20, background: '#fffbeb', padding: 14, borderRadius: 10, border: '1px solid #fde68a' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 'bold', color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={16} /> Catatan Guru (Opsional)
                  </h4>
                  <textarea 
                    placeholder="Tulis catatan khusus untuk siswa ini..." 
                    value={catatanGuru}
                    onChange={e => setCatatanGuru(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={handleSaveCatatanOnly} disabled={submitting}
                      style={{ padding: '6px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}>
                      💾 Simpan Catatan Saja
                    </button>
                    {savedCatatan && (
                      <span style={{ fontSize: 10, color: '#b45309', display: 'flex', alignItems: 'center' }}>
                        ✅ Catatan tersimpan
                      </span>
                    )}
                  </div>
                </div>

                {/* TOMBOL SIMPAN */}
                <button type="submit" disabled={submitting} 
                  style={{ width: '100%', padding: 13, background: submitting ? '#94a3b8' : '#10b981', color: 'white', border: 'none', 
                    borderRadius: 12, fontWeight: 'bold', fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Save size={18} />{submitting ? 'Menyimpan...' : '💾 SIMPAN NILAI'}
                </button>
              </form>
            </div>
          )}

          {/* TAB IMPOR TUGAS */}
          {activeTab === 'fromTasks' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 'bold' }}>📥 Nilai Tugas Siap Diimpor</h3>
              {loadingTasks ? <div style={{ textAlign: 'center', padding: 40 }}>Memuat...</div>
              : pendingTasks.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Semua sudah diimpor</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>{task.studentName}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{task.modulTitle} • {task.score}</div>
                    </div>
                    <button onClick={() => handleImportSingleForStudent({...task, source: 'tugas'})} disabled={submitting}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>
                      📥 Impor
                    </button>
                  </div>
                ))}
              </div>}
            </div>
          )}

          {/* TAB IMPOR KUIS */}
          {activeTab === 'fromQuizzes' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 'bold' }}>❓ Nilai Kuis Siap Diimpor</h3>
              {loadingTasks ? <div style={{ textAlign: 'center', padding: 40 }}>Memuat...</div>
              : pendingQuizzes.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Semua sudah diimpor</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingQuizzes.map(quiz => (
                  <div key={quiz.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>{quiz.userName}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{quiz.modulTitle || quiz.quizTitle} • {quiz.score}</div>
                    </div>
                    <button onClick={() => handleImportSingleForStudent({...quiz, source: 'kuis'})} disabled={submitting}
                      style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>
                      📥 Impor
                    </button>
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TeacherInputGrade;