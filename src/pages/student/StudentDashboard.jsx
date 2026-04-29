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
import { BookOpen, Calendar, Clock, GraduationCap, Menu, ChevronRight, Target, ClipboardList, AlertCircle, QrCode, X, Camera, User, MapPin, Send, CheckCircle, Megaphone } from 'lucide-react';
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
  const [selectedNews, setSelectedNews] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // 🔥 SURVEI
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [filledSurveys, setFilledSurveys] = useState({});
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});

  useEffect(() => { const h = () => setWindowWidth(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  const isMobile = windowWidth <= 768;

  // QR SCANNER
  useEffect(() => {
    let qr = null;
    const start = async () => {
      try {
        qr = new Html5Qrcode("reader");
        await qr.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
          async (text) => {
            try {
              const d = JSON.parse(text);
              if (d.type === "ABSENSI_BIMBEL") {
                const today = new Date().toISOString().split('T')[0];
                await setDoc(doc(db, "attendance", `${studentId}_${today}_${d.scheduleId || ''}`), {
                  studentId, studentName, teacherName: d.teacher, date: today, tanggal: today,
                  timestamp: serverTimestamp(), status: "Hadir", mapel: d.mapel,
                  scheduleId: d.scheduleId || '', keterangan: "Scan QR"
                }, { merge: true });
                alert(`✅ Absen: ${d.mapel}`);
                stop();
              }
            } catch (e) {}
          }, () => {});
      } catch (e) {}
    };
    const stop = async () => {
      if (qr && qr.isScanning) { try { await qr.stop(); qr.clear(); } catch (e) {} }
      setIsScanning(false);
    };
    if (isScanning) start();
    return () => { if (qr) stop(); };
  }, [isScanning, studentId, studentName]);

  const formatDate = (ts) => { if (!ts) return "-"; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); };
  const formatDateOnly = (ts) => { if (!ts) return "-"; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }); };
  const isDeadlineSoon = (dl) => { if (!dl) return false; const d = dl.toDate ? dl.toDate() : new Date(dl); return (d - new Date()) / 36e5 > 0 && (d - new Date()) / 36e5 < 48; };
  const isDeadlinePassed = (dl) => { if (!dl) return false; return (dl.toDate ? dl.toDate() : new Date(dl)) < new Date(); };

  useEffect(() => {
    const fetchAll = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const sSnap = await getDoc(doc(db, "students", studentId));
        let curKat = "Semua", curKel = "Semua";
        if (sSnap.exists()) { const d = sSnap.data(); setStudentProfile(d); curKat = d.kategori || "Semua"; curKel = d.kelasSekolah || "Semua"; }

        // POSTER
        setPosters((await getDocs(query(collection(db, "student_contents"), orderBy("createdAt", "desc")))).docs.map(d => ({ id: d.id, ...d.data() })));

        // JADWAL
        const todayStr = new Date().toISOString().split('T')[0];
        const scheds = (await getDocs(query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr)))).docs.map(d => ({ id: d.id, ...d.data() })).filter(sch => sch.students?.some(s => s.id === studentId || s === studentId)).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
        setTodaySchedules(scheds.slice(0, 5));

        // TUGAS
        const moduls = (await getDocs(query(collection(db, "bimbel_modul"), where("targetKategori", "in", ["Semua", curKat]), orderBy("createdAt", "desc"), limit(10)))).docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(moduls.filter(m => m.quizData?.length > 0 || m.blocks?.some(b => b.type === 'assignment')).slice(0, 5));

        // 🔥 SURVEI — PERSIS DARI TeacherDashboard (TERBUKTI MUNCUL)
        const qSurvey = query(collection(db, "surveys"), where("status", "==", "aktif"), where("isRequired", "==", true));
        const surveys = (await getDocs(qSurvey)).docs.map(d => ({ id: d.id, ...d.data() }));
        const cocok = surveys.filter(s => {
          if (s.targetType === 'semua_siswa' || s.targetType === 'semua') return true;
          if (s.targetType === 'jenjang' && (s.targetKelas === 'Semua' || s.targetKelas === curKel)) return true;
          return false;
        });
        const filled = {};
        for (const s of cocok) {
          const resp = await getDocs(query(collection(db, "survey_responses"), where("surveyId", "==", s.id), where("userId", "==", studentId)));
          if (!resp.empty) filled[s.id] = true;
        }
        setActiveSurveys(cocok);
        setFilledSurveys(filled);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchAll();
  }, [studentId]);

  const getAssignmentDeadline = (modul) => {
    const ab = modul.blocks?.find(b => b.type === 'assignment' && b.endTime);
    return ab?.endTime || modul.deadlineTugas || modul.deadlineQuiz || null;
  };

  const openSurvey = (s) => { setCurrentSurvey(s); setSurveyAnswers({}); setShowSurveyModal(true); };
  const submitSurvey = async () => {
    if (!currentSurvey) return;
    try {
      await addDoc(collection(db, "survey_responses"), {
        surveyId: currentSurvey.id, userId: studentId, userName: studentName,
        answers: currentSurvey.questions.map((_, i) => ({ questionIndex: i, answer: surveyAnswers[i] || '' })),
        submittedAt: serverTimestamp()
      });
      setFilledSurveys({ ...filledSurveys, [currentSurvey.id]: true });
      setShowSurveyModal(false); setCurrentSurvey(null);
      alert("✅ Survei dikirim!");
    } catch (err) { alert("❌ Gagal"); }
  };

  const renderDashboardHome = () => (
    <div style={st.contentWrapper}>
      {/* HEADER */}
      <div style={isMobile ? st.welcomeHeaderMobile : st.welcomeHeader}>
        <div>
          <h1 style={isMobile ? st.titleMobile : st.title}>Halo, {studentName}! 👋</h1>
          <p style={st.subtitle}>{studentProfile ? `${studentProfile.kategori} - Kelas ${studentProfile.kelasSekolah}` : "Memuat..."}</p>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setIsScanning(true)} style={st.btnScanHeader}><Camera size={18} /> SCAN ABSEN</button>
            <div style={st.statusBadge}><GraduationCap size={18} /><span>Siswa Aktif</span></div>
          </div>
        )}
      </div>

      {/* CAROUSEL POSTER */}
      <div style={{ ...st.carouselContainer, aspectRatio: isMobile ? '4/3' : '21/9' }}>
        <Swiper modules={[Navigation, Pagination, Autoplay, EffectFade]} effect={'fade'} navigation={!isMobile} pagination={{ clickable: true }} autoplay={{ delay: 5000, disableOnInteraction: false }} loop={posters.length > 1} style={st.mySwiper}>
          {posters.map((post) => (
            <SwiperSlide key={post.id} onClick={() => setSelectedNews(post)}>
              <div style={{ ...st.slideCard, backgroundImage: `url(${post.imageUrl})`, cursor: 'pointer' }}>
                <div style={st.slideOverlay}>
                  <span style={{ background: '#e11d48', padding: '4px 10px', borderRadius: 12, fontSize: 9, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}><Megaphone size={10} /> Info Akademik</span>
                  <h2 style={isMobile ? st.slideTitleMobile : st.slideTitle}>{post.title}</h2>
                  {!isMobile && <p style={st.slideDesc}>{post.desc || "Klik untuk baca selengkapnya"}</p>}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* 🔥 SURVEI CARD */}
      {activeSurveys.length > 0 && (
        <div style={{ background: 'white', padding: 20, borderRadius: 15, border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6' }}>
          <h3 style={{ margin: '0 0 15px', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={20} color="#3b82f6" /> Survei Aktif</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeSurveys.map(survey => {
              const done = filledSurveys[survey.id];
              return (
                <div key={survey.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: done ? '#f0fdf4' : survey.isRequired ? '#fef2f2' : '#fffbeb', borderRadius: 12, border: `1px solid ${done ? '#bbf7d0' : survey.isRequired ? '#fecaca' : '#fde68a'}`, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {done ? <CheckCircle size={16} color="#10b981" /> : <Send size={16} color={survey.isRequired ? '#ef4444' : '#f59e0b'} />}
                      <strong style={{ fontSize: 14 }}>{survey.title}</strong>
                      {survey.isRequired && <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800 }}>WAJIB</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{survey.questions?.length || 0} pertanyaan • {survey.deadline ? `Deadline: ${new Date(survey.deadline).toLocaleDateString('id-ID')}` : 'Tanpa batas'}</div>
                  </div>
                  {done ? <span style={{ color: '#10b981', fontWeight: 700, fontSize: 12 }}>✅ Terisi</span> : <button onClick={() => openSurvey(survey)} style={{ background: survey.isRequired ? '#ef4444' : '#f59e0b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} /> Isi Survei</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GRID UTAMA */}
      <div style={isMobile ? st.mainGridMobile : st.mainGrid}>
        <div style={st.leftColumn}>
          {/* JADWAL */}
          <section style={st.sectionCard}>
            <h3 style={st.sectionTitle}><Calendar size={20} color="#3498db" /> Jadwal Hari Ini</h3>
            {todaySchedules.length === 0 ? <div style={st.emptyState}>📭 Tidak ada jadwal hari ini.</div> : todaySchedules.map((sch, i) => (
              <div key={i} style={st.schItem}>
                <div style={st.schTime}><b>{sch.start}</b><br /><span style={{ fontSize: 10 }}>{sch.end}</span></div>
                <div style={{ ...st.schLine, background: sch.program === 'English' ? '#e74c3c' : '#3498db' }}></div>
                <div style={st.schInfo}><b>{sch.title || "Kelas"}</b><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}><MapPin size={10} /> {sch.planet || "Ruang"} • <User size={10} /> {sch.booker || "Guru"}</div></div>
              </div>
            ))}
          </section>

          {/* TUGAS */}
          <section style={st.sectionCard}>
            <div style={st.cardHeader}>
              <h3 style={st.sectionTitle}><ClipboardList size={20} color="#9b59b6" /> Tugas & Kuis</h3>
              <button onClick={() => setActiveMenu('materi')} style={st.btnViewAll}>Lihat Semua <ChevronRight size={14} /></button>
            </div>
            {tasks.length === 0 ? <div style={st.emptyState}>📭 Tidak ada tugas.</div> : tasks.map((task, i) => {
              const deadline = getAssignmentDeadline(task);
              const isSoon = isDeadlineSoon(deadline);
              const isPassed = isDeadlinePassed(deadline);
              return (
                <div key={i} style={{ ...st.taskItem, borderLeftColor: isPassed ? '#ef4444' : isSoon ? '#f59e0b' : '#9b59b6' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{task.title}</div>
                    {deadline && (
                      <div style={{ fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Clock size={12} color={isPassed ? '#ef4444' : '#64748b'} />
                        <span style={{ color: isPassed ? '#ef4444' : '#64748b', fontWeight: isSoon ? 700 : 400 }}>{isPassed ? '⛔ Terlambat: ' : isSoon ? '⚠️ Segera: ' : '📅 Deadline: '}{formatDateOnly(deadline)}</span>
                        {isSoon && <span style={st.badgeUrgent}>SEGERA</span>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setActiveMenu('materi')} style={st.btnTaskBuka}>Buka</button>
                </div>
              );
            })}
          </section>
        </div>

        <div style={st.rightColumn}>
          {/* PROFIL */}
          <section style={st.sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
              <div style={st.avatar}>{studentName?.charAt(0) || 'S'}</div>
              <div><b>{studentName}</b><p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{studentProfile?.kelasSekolah || '-'}</p></div>
            </div>
            <button onClick={() => setActiveMenu('materi')} style={st.btnAccess}><BookOpen size={16} /> Buka Materi Belajar</button>
          </section>

          {/* RIWAYAT MATERI */}
          <section style={st.sectionCard}>
            <h3 style={st.sectionTitle}><Clock size={20} color="#e67e22" /> Materi Terbaru</h3>
            {tasks.slice(0, 3).map((task, i) => (
              <div key={i} style={st.historyItem}>
                <div style={st.dot}></div>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{formatDateOnly(task.createdAt)}</div></div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return renderDashboardHome();
      case 'keuangan': return <StudentFinanceSiswa />;
      case 'rapor': return <StudentGrades />;
      case 'jadwal': return <StudentSchedule />;
      case 'absensi': return <StudentAttendanceSiswa />;
      case 'materi': return <StudentElearning />;
      default: return renderDashboardHome();
    }
  };

  if (loading) return (
    <div style={st.mainContainer}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div style={st.loadingScreen}><div style={st.spinner}></div><p>Menyiapkan dashboard...</p></div>
    </div>
  );

  return (
    <div style={st.mainContainer}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={(menu) => { setActiveMenu(menu); if (isMobile) setIsSidebarOpen(false); }} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      {isMobile && <button onClick={() => setIsSidebarOpen(true)} style={st.mobileMenuBtn}><Menu size={24} /></button>}
      <div style={{ ...st.contentArea, marginLeft: isMobile ? '0' : '260px', width: isMobile ? '100%' : 'calc(100% - 260px)', padding: isMobile ? '15px' : '30px', paddingTop: isMobile ? '70px' : '30px' }}>
        {renderContent()}
      </div>
      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={st.overlay} />}

      {/* MODAL BERITA */}
      {selectedNews && (
        <div style={st.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={{ ...st.modalContent, width: isMobile ? '90%' : '600px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNews(null)} style={st.btnCloseModal}><X size={20} /></button>
            <img src={selectedNews.imageUrl} style={st.modalImg} alt="News" />
            <div style={{ padding: 20 }}><h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22 }}>{selectedNews.title}</h2><p style={{ fontSize: 14, color: '#475569', marginTop: 10, lineHeight: 1.6 }}>{selectedNews.content || selectedNews.desc}</p></div>
          </div>
        </div>
      )}

      {/* MODAL SCANNER */}
      {isScanning && (
        <div style={st.modalOverlay} onClick={() => setIsScanning(false)}>
          <div style={st.qrModalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsScanning(false)} style={st.btnCloseModal}><X size={20} /></button>
            <h3 style={{ marginTop: 0, fontSize: 18, color: '#2c3e50' }}>Scan QR Absensi</h3>
            <p style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 20 }}>Arahkan kamera ke kode QR Guru</p>
            <div id="reader" style={{ width: '100%', borderRadius: 15, overflow: 'hidden', background: '#000' }}></div>
            <p style={{ fontSize: 11, color: '#3498db', marginTop: 15 }}>{studentName}</p>
          </div>
        </div>
      )}

      {/* 🔥 MODAL SURVEI */}
      {showSurveyModal && currentSurvey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 30, width: '100%', maxWidth: 550, maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setShowSurveyModal(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}><X size={20} /></button>
            <div style={{ textAlign: 'center', marginBottom: 25 }}>
              <span style={{ fontSize: 40 }}>📋</span>
              <h2 style={{ margin: '10px 0 5px', fontSize: 20, fontWeight: 800 }}>{currentSurvey.title}</h2>
              {currentSurvey.isRequired ? <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 13, margin: 0 }}>🔴 WAJIB DIISI</p> : <p style={{ color: '#64748b', fontSize: 12 }}>{currentSurvey.questions?.length || 0} pertanyaan</p>}
            </div>
            {currentSurvey.questions.map((q, qIdx) => (
              <div key={qIdx} style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{qIdx + 1}. {q.question}</p>
                {q.options.filter(o => o).map((opt, oIdx) => (
                  <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 6, borderRadius: 10, cursor: 'pointer', background: surveyAnswers[qIdx] === opt ? '#eef2ff' : '#f8fafc', border: `2px solid ${surveyAnswers[qIdx] === opt ? '#3b82f6' : '#e2e8f0'}` }}>
                    <input type="radio" name={`sq-${qIdx}`} checked={surveyAnswers[qIdx] === opt} onChange={() => setSurveyAnswers({ ...surveyAnswers, [qIdx]: opt })} style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: 13 }}>{opt}</span>
                  </label>
                ))}
              </div>
            ))}
            <button onClick={submitSurvey} style={{ width: '100%', padding: 14, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}><Send size={18} /> Kirim Jawaban</button>
          </div>
        </div>
      )}

      {/* FAB MOBILE */}
      {isMobile && <button onClick={() => setIsScanning(true)} style={st.fabQR}><Camera size={22} /></button>}
    </div>
  );
};

const st = {
  mainContainer: { display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative' },
  contentArea: { transition: 'margin 0.3s ease', boxSizing: 'border-box' },
  contentWrapper: { display: 'flex', flexDirection: 'column', gap: 20 },
  loadingScreen: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginLeft: 260 },
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 10 },
  welcomeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  welcomeHeaderMobile: { textAlign: 'left', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 800, color: '#1e293b', margin: 0 },
  titleMobile: { fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: 5, fontSize: 14 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: 100, fontWeight: 'bold' },
  btnScanHeader: { display: 'flex', alignItems: 'center', gap: 8, background: '#3498db', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 100, fontWeight: 'bold', cursor: 'pointer' },
  mobileMenuBtn: { position: 'fixed', top: 15, left: 15, zIndex: 900, background: '#1e293b', color: 'white', border: 'none', padding: 10, borderRadius: 10 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 },
  carouselContainer: { borderRadius: 15, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%' },
  mySwiper: { width: '100%', height: '100%' },
  slideCard: { width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end' },
  slideOverlay: { width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: 20, color: 'white' },
  slideTitle: { fontSize: 24, fontWeight: 'bold', margin: 0 },
  slideTitleMobile: { fontSize: 16, fontWeight: 'bold', margin: 0 },
  slideDesc: { fontSize: 14, opacity: 0.8, marginTop: 5 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 25 },
  mainGridMobile: { display: 'flex', flexDirection: 'column', gap: 20 },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: 20 },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: 20 },
  sectionCard: { background: 'white', padding: 20, borderRadius: 15, border: '1px solid #e2e8f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 8 },
  btnViewAll: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  schItem: { display: 'flex', alignItems: 'stretch', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  schTime: { minWidth: 55, fontSize: 13, textAlign: 'center' },
  schLine: { width: 3, borderRadius: 3 },
  schInfo: { flex: 1 },
  taskItem: { display: 'flex', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 10, borderLeft: '4px solid', marginBottom: 8 },
  badgeUrgent: { background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 'bold' },
  btnTaskBuka: { background: '#9b59b6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  avatar: { width: 45, height: 45, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, flexShrink: 0 },
  btnAccess: { width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  historyItem: { display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#f97316', marginTop: 5, flexShrink: 0 },
  emptyState: { fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 15 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
  modalContent: { background: 'white', borderRadius: 15, overflow: 'hidden', position: 'relative' },
  modalImg: { width: '100%', maxHeight: 250, objectFit: 'cover' },
  btnCloseModal: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qrModalContent: { background: 'white', padding: '30px 20px', borderRadius: 25, width: '90%', maxWidth: 400, textAlign: 'center', position: 'relative' },
  fabQR: { position: 'fixed', bottom: 20, right: 20, width: 60, height: 60, borderRadius: '50%', background: '#3498db', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 900 },
};

export default StudentDashboard;