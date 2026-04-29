import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { Html5Qrcode } from "html5-qrcode";
import StudentFinanceSiswa from './StudentFinance';
import StudentGrades from './StudentGrades';
import StudentSchedule from './StudentSchedule';
import StudentAttendanceSiswa from './StudentAttendance';
import StudentElearning from './StudentElearning'; 
import { BookOpen, Calendar, Clock, GraduationCap, Menu, ClipboardList, X, Camera, User, MapPin, Send, CheckCircle } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const StudentDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const studentName = localStorage.getItem('studentName') || "Siswa";
  const studentId = localStorage.getItem('studentId');
  const [posters, setPosters] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  // 🔥 SURVEI POPUP
  const [showSurveyPopup, setShowSurveyPopup] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [allActiveSurveys, setAllActiveSurveys] = useState([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth <= 768;

  // QR SCANNER
  useEffect(() => {
    let html5QrCode = null;
    const start = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              if (data.type === "ABSENSI_BIMBEL") {
                const today = new Date().toISOString().split('T')[0];
                await setDoc(doc(db, "attendance", `${studentId}_${today}_${data.scheduleId || ''}`), {
                  studentId, studentName, teacherName: data.teacher, date: today, tanggal: today,
                  timestamp: serverTimestamp(), status: "Hadir", mapel: data.mapel,
                  scheduleId: data.scheduleId || '', keterangan: "Scan QR"
                }, { merge: true });
                alert(`✅ Absen: ${data.mapel}`);
                stop();
              }
            } catch (err) {}
          }, () => {});
      } catch (err) {}
    };
    const stop = async () => {
      if (html5QrCode && html5QrCode.isScanning) { try { await html5QrCode.stop(); html5QrCode.clear(); } catch (err) {} }
      setIsScanning(false);
    };
    if (isScanning) start();
    return () => { if (html5QrCode) stop(); };
  }, [isScanning, studentId, studentName]);

  const formatDate = (ts) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchAll = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const sSnap = await getDoc(doc(db, "students", studentId));
        let curKat = "Semua", curKel = "Semua";
        if (sSnap.exists()) { const d = sSnap.data(); setStudentProfile(d); curKat = d.kategori || "Semua"; curKel = d.kelasSekolah || "Semua"; }

        setPosters((await getDocs(query(collection(db, "student_contents"), orderBy("createdAt", "desc")))).docs.map(d => ({ id: d.id, ...d.data() })));

        const todayStr = new Date().toISOString().split('T')[0];
        const scheds = (await getDocs(query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr)))).docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(sch => sch.students?.some(s => s.id === studentId || s === studentId));
        setTodaySchedules(scheds.slice(0, 5));

        const moduls = (await getDocs(query(collection(db, "bimbel_modul"), where("targetKategori", "in", ["Semua", curKat]), orderBy("createdAt", "desc"), limit(10)))).docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(moduls.filter(m => m.quizData?.length > 0 || m.blocks?.some(b => b.type === 'assignment')).slice(0, 5));

        // 🔥 AMBIL SEMUA SURVEI AKTIF
        const allSurveys = (await getDocs(query(collection(db, "surveys"), where("status", "==", "aktif")))).docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter yang cocok dengan siswa
        const cocok = allSurveys.filter(s => {
          if (s.targetType === 'semua_siswa' || s.targetType === 'semua') return true;
          if (s.targetType === 'jenjang' && (s.targetKelas === 'Semua' || s.targetKelas === curKel)) return true;
          return false;
        });

        // Cek yang BELUM diisi
        const belumDiisi = [];
        for (const s of cocok) {
          const respSnap = await getDocs(query(collection(db, "survey_responses"), where("surveyId", "==", s.id), where("userId", "==", studentId)));
          if (respSnap.empty) belumDiisi.push(s);
        }

        setAllActiveSurveys(belumDiisi);
        
        // 🔥 KALAU ADA SURVEI WAJIB YANG BELUM DIISI → POPUP OTOMATIS
        const mandatoryUnfilled = belumDiisi.find(s => s.isRequired);
        if (mandatoryUnfilled) {
          setCurrentSurvey(mandatoryUnfilled);
          setShowSurveyPopup(true);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchAll();
  }, [studentId]);

  const submitSurvey = async () => {
    if (!currentSurvey) return;
    const unanswered = currentSurvey.questions.filter((_, i) => surveyAnswers[i] === undefined);
    if (unanswered.length > 0) return alert(`❌ ${unanswered.length} pertanyaan belum dijawab.`);
    try {
      await addDoc(collection(db, "survey_responses"), {
        surveyId: currentSurvey.id, userId: studentId, userName: studentName,
        answers: currentSurvey.questions.map((_, i) => ({ questionIndex: i, answer: surveyAnswers[i] })),
        submittedAt: serverTimestamp()
      });
      
      // Cek apakah masih ada survei lain yang belum diisi
      const remaining = allActiveSurveys.filter(s => s.id !== currentSurvey.id);
      const nextMandatory = remaining.find(s => s.isRequired);
      
      if (nextMandatory) {
        setCurrentSurvey(nextMandatory);
        setSurveyAnswers({});
      } else {
        setShowSurveyPopup(false);
        setCurrentSurvey(null);
        setSurveyAnswers({});
      }
      alert("✅ Survei berhasil dikirim!");
      window.location.reload();
    } catch (err) { alert("❌ Gagal: " + err.message); }
  };

  const openSurvey = (survey) => {
    setCurrentSurvey(survey);
    setSurveyAnswers({});
    setShowSurveyPopup(true);
  };

  const renderContent = () => {
    if (activeMenu === 'keuangan') return <StudentFinanceSiswa />;
    if (activeMenu === 'rapor') return <StudentGrades />;
    if (activeMenu === 'jadwal') return <StudentSchedule />;
    if (activeMenu === 'absensi') return <StudentAttendanceSiswa />;
    if (activeMenu === 'materi') return <StudentElearning />;

    // DASHBOARD HOME
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#1e293b', margin: 0 }}>Halo, {studentName}! 👋</h1>
            <p style={{ color: '#64748b' }}>{studentProfile ? `${studentProfile.kategori} - ${studentProfile.kelasSekolah}` : ''}</p>
          </div>
          {!isMobile && (
            <button onClick={() => setIsScanning(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3498db', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 100, fontWeight: 'bold', cursor: 'pointer' }}>
              <Camera size={18} /> SCAN ABSEN
            </button>
          )}
        </div>

        {/* CAROUSEL */}
        {posters.length > 0 && (
          <div style={{ borderRadius: 15, overflow: 'hidden', aspectRatio: isMobile ? '4/3' : '21/9' }}>
            <Swiper modules={[Navigation, Pagination, Autoplay, EffectFade]} effect="fade" autoplay={{ delay: 5000 }} loop={posters.length > 1} style={{ width: '100%', height: '100%' }}>
              {posters.map(p => (
                <SwiperSlide key={p.id}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: 20, color: 'white' }}>
                      <h2 style={{ fontSize: isMobile ? 16 : 24 }}>{p.title}</h2>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* 🔥 SURVEI SECTION */}
        {allActiveSurveys.length > 0 && (
          <div style={{ background: 'white', padding: 20, borderRadius: 15, border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 15px', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={20} color="#3b82f6" /> Survei
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allActiveSurveys.map(survey => (
                <div key={survey.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14,
                  background: survey.isRequired ? '#fef2f2' : '#fffbeb',
                  borderRadius: 12, border: `1px solid ${survey.isRequired ? '#fecaca' : '#fde68a'}`, flexWrap: 'wrap', gap: 10
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Send size={16} color={survey.isRequired ? '#ef4444' : '#f59e0b'} />
                      <strong style={{ fontSize: 14 }}>{survey.title}</strong>
                      {survey.isRequired && (
                        <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800 }}>WAJIB</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {survey.questions?.length || 0} pertanyaan • Deadline: {survey.deadline ? new Date(survey.deadline).toLocaleDateString('id-ID') : 'Tanpa batas'}
                    </div>
                  </div>
                  <button onClick={() => openSurvey(survey)} style={{
                    background: survey.isRequired ? '#ef4444' : '#f59e0b', color: 'white', border: 'none',
                    padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <Send size={14} /> Isi Survei
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JADWAL & TUGAS */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 15, border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 15px' }}>
                <Calendar size={20} color="#3498db" style={{ marginRight: 8 }} /> Jadwal Hari Ini
              </h3>
              {todaySchedules.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>📭 Tidak ada jadwal</p>
              ) : todaySchedules.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <b style={{ width: 50 }}>{s.start}</b>
                  <div><b>{s.title || 'Kelas'}</b><div style={{ fontSize: 11, color: '#64748b' }}>{s.planet} • {s.booker}</div></div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', padding: 20, borderRadius: 15, border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 15px' }}>
                <ClipboardList size={20} color="#9b59b6" style={{ marginRight: 8 }} /> Tugas
              </h3>
              {tasks.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>📭 Tidak ada tugas</p>
              ) : tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, background: '#f8fafc', borderRadius: 10, borderLeft: '4px solid #9b59b6', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{t.title}</span>
                  <button onClick={() => setActiveMenu('materi')} style={{ background: '#9b59b6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Buka</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 15, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                <div style={{ width: 45, height: 45, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>{studentName?.charAt(0)}</div>
                <b>{studentName}</b>
              </div>
              <button onClick={() => setActiveMenu('materi')} style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                <BookOpen size={16} style={{ marginRight: 8 }} /> Buka Materi Belajar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={false} setIsOpen={() => {}} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginLeft: isMobile ? 0 : 260 }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }}></div>
        <p style={{ color: '#64748b' }}>Memuat dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
      <SidebarSiswa 
        activeMenu={activeMenu} 
        setActiveMenu={(menu) => {
          console.log('Sidebar clicked:', menu);
          setActiveMenu(menu); 
          if (isMobile) setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      {isMobile && (
        <button onClick={() => setIsSidebarOpen(true)} style={{ position: 'fixed', top: 15, left: 15, zIndex: 900, background: '#1e293b', color: 'white', border: 'none', padding: 10, borderRadius: 10 }}>
          <Menu size={24} />
        </button>
      )}
      
      <div style={{ marginLeft: isMobile ? 0 : 260, width: isMobile ? '100%' : 'calc(100% - 260px)', padding: isMobile ? 15 : 30, paddingTop: isMobile ? 70 : 30, boxSizing: 'border-box' }}>
        {renderContent()}
      </div>
      
      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} />
      )}

      {/* MODAL SCANNER */}
      {isScanning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setIsScanning(false)}>
          <div style={{ background: 'white', padding: 20, borderRadius: 15, width: '90%', maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Scan QR Absensi</h3>
            <div id="reader" style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }}></div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL SURVEI POPUP FULLSCREEN */}
      {showSurveyPopup && currentSurvey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 30, width: '100%', maxWidth: 550, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => { if(!currentSurvey.isRequired){ setShowSurveyPopup(false); setCurrentSurvey(null); } }} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>
              {!currentSurvey.isRequired && <X size={24} />}
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: 25 }}>
              <span style={{ fontSize: 40 }}>📋</span>
              <h2 style={{ margin: '10px 0 5px', fontSize: 20, fontWeight: 800 }}>{currentSurvey.title}</h2>
              {currentSurvey.isRequired ? (
                <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 13, margin: 0 }}>🔴 WAJIB DIISI — Tidak bisa ditutup sebelum diisi</p>
              ) : (
                <p style={{ color: '#64748b', fontSize: 12 }}>Silakan isi survei berikut</p>
              )}
            </div>

            {currentSurvey.questions.map((q, qIdx) => (
              <div key={qIdx} style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{qIdx + 1}. {q.question}</p>
                {q.options.filter(o => o).map((opt, oIdx) => (
                  <label key={oIdx} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 6,
                    borderRadius: 10, cursor: 'pointer',
                    background: surveyAnswers[qIdx] === opt ? '#eef2ff' : '#f8fafc',
                    border: `2px solid ${surveyAnswers[qIdx] === opt ? '#3b82f6' : '#e2e8f0'}`
                  }}>
                    <input type="radio" name={`sq-${qIdx}`} checked={surveyAnswers[qIdx] === opt} onChange={() => setSurveyAnswers({ ...surveyAnswers, [qIdx]: opt })} style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: 13 }}>{opt}</span>
                  </label>
                ))}
              </div>
            ))}

            <button onClick={submitSurvey} style={{
              width: '100%', padding: 14, background: currentSurvey.isRequired ? '#ef4444' : '#3b82f6',
              color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20
            }}>
              <Send size={18} /> Kirim Jawaban
            </button>
          </div>
        </div>
      )}

      {/* FAB MOBILE */}
      {isMobile && (
        <button onClick={() => setIsScanning(true)} style={{ position: 'fixed', bottom: 20, right: 20, width: 56, height: 56, borderRadius: '50%', background: '#3498db', color: 'white', border: 'none', fontSize: 22, zIndex: 900, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
          <Camera size={22} />
        </button>
      )}
    </div>
  );
};

export default StudentDashboard;