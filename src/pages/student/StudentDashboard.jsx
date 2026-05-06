// src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db, auth } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from 'react-router-dom';
import StudentFinanceSiswa from './StudentFinance';
import StudentGrades from './StudentGrades';
import StudentSchedule from './StudentSchedule';
import StudentAttendanceSiswa from './StudentAttendance';
import StudentElearning from './StudentElearning';
import { RAPORT_COLLECTIONS } from '../../firebase/raportCollection';

import { 
  BookOpen, Calendar, Clock, GraduationCap, Menu, ChevronRight, 
  ClipboardList, X, Camera, User, MapPin, Send, CheckCircle, 
  TrendingUp, Trophy, ArrowRight
} from 'lucide-react';

const CACHE_KEY = 'dashboard_cache';
const CACHE_EXPIRY = 30 * 60 * 1000;

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [studentName, setStudentName] = useState("Siswa");
  const [studentId, setStudentId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [activeSurveys, setActiveSurveys] = useState([]);
  const [filledSurveys, setFilledSurveys] = useState({});
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [surveyLoading, setSurveyLoading] = useState(false);

  const [raportSummary, setRaportSummary] = useState(null);

  useEffect(() => { 
    const h = () => setWindowWidth(window.innerWidth); 
    window.addEventListener('resize', h); 
    return () => window.removeEventListener('resize', h); 
  }, []);
  
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const storedName = localStorage.getItem('studentName');
        const storedId = localStorage.getItem('studentId');
        setStudentName(storedName || user.email || "Siswa");
        setStudentId(storedId || user.uid);
        setAuthReady(true);
      } else { setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  const loadCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY) return parsed.data;
      }
    } catch (e) {}
    return null;
  };

  const saveCache = (data) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data })); } catch (e) {}
  };

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
                  studentId, studentName, teacherName: d.teacher, date: today, 
                  tanggal: today, timestamp: serverTimestamp(), status: "Hadir", 
                  mapel: d.mapel, scheduleId: d.scheduleId || '', keterangan: "Scan QR"
                }, { merge: true });
                alert(`✅ Absen: ${d.mapel}`);
                stop();
              }
            } catch (e) {}
          }, (err) => console.warn('QR scan error:', err)
        );
      } catch (e) {}
    };
    const stop = async () => {
      if (qr && qr.isScanning) { try { await qr.stop(); qr.clear(); } catch (e) {} }
      setIsScanning(false);
    };
    if (isScanning && studentId) start();
    return () => { if (qr) stop(); };
  }, [isScanning, studentId, studentName]);

  const formatDateOnly = (ts) => { 
    if (!ts) return "-"; 
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }); } 
    catch { return "-"; }
  };
  
  const isDeadlineSoon = (dl) => { 
    if (!dl) return false; 
    try { const d = dl.toDate ? dl.toDate() : new Date(dl); return (d - new Date()) / 36e5 > 0 && (d - new Date()) / 36e5 < 48; } 
    catch { return false; }
  };
  
  const isDeadlinePassed = (dl) => { 
    if (!dl) return false; 
    try { return (dl.toDate ? dl.toDate() : new Date(dl)) < new Date(); } 
    catch { return false; }
  };

  // 🔄 SURVEI: 2 query parallel (cepat)
  const fetchSurveys = async (studentKelas, studentIdParam) => {
    try {
      const [surveiSnap, respSnap] = await Promise.all([
        getDocs(query(collection(db, "surveys"), where("status", "==", "aktif"))),
        getDocs(query(collection(db, "survey_responses"), where("userId", "==", studentIdParam)))
      ]);
      
      const allActive = surveiSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const myResponses = respSnap.docs.map(d => d.data());
      
      const cocok = allActive.filter(s => {
        const target = (s.targetType || '').toLowerCase().trim();
        if (target === 'semua_siswa' || target === 'semua') return true;
        if (target === 'jenjang' || target === 'per_jenjang') {
          return (s.targetKelas || 'Semua') === 'Semua' || s.targetKelas === studentKelas;
        }
        return false;
      });
      
      const filled = {};
      cocok.forEach(survey => {
        filled[survey.id] = myResponses.some(r => r.surveyId === survey.id);
      });
      
      return { surveys: cocok, filled };
    } catch (error) { return { surveys: [], filled: {} }; }
  };

  const fetchRaportSummary = async (studentIdParam) => {
    try {
      const now = new Date();
      const periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const finalSnap = await getDocs(query(
        collection(db, RAPORT_COLLECTIONS.FINAL),
        where("studentId", "==", studentIdParam),
        where("periode", "==", periode),
        limit(1)
      ));
      if (!finalSnap.empty) {
        const data = finalSnap.docs[0].data();
        return { nilaiAkhir: data.nilai_akhir, komponenDipake: data.komponen_dipakai || [], periode };
      }
      return null;
    } catch (e) { return null; }
  };

  useEffect(() => {
    if (!authReady || !studentId) return;
    
    const fetchAll = async () => {
      const cache = loadCache();
      if (cache) {
        setTodaySchedules(cache.todaySchedules || []);
        setTasks(cache.tasks || []);
        setStudentProfile(cache.studentProfile || null);
        setActiveSurveys(cache.activeSurveys || []);
        setFilledSurveys(cache.filledSurveys || {});
        setRaportSummary(cache.raportSummary || null);
        setLoading(false);
      }
      
      try {
        const sSnap = await getDoc(doc(db, "students", studentId));
        let curKat = "Semua", curKel = "Semua";
        if (sSnap.exists()) { const d = sSnap.data(); curKat = d.kategori || "Semua"; curKel = d.kelasSekolah || "Semua"; }

        let fetchedSchedules = [];
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          fetchedSchedules = (await getDocs(query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr))))
            .docs.map(d => ({ id: d.id, ...d.data() }))
            .filter(sch => sch.students?.some(s => s.id === studentId || s === studentId))
            .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
        } catch (e) {}

        let fetchedTasks = [];
        try {
          const modulSnap = await getDocs(query(collection(db, "bimbel_modul"), where("targetKategori", "in", ["Semua", curKat])));
          let allModuls = modulSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          allModuls = allModuls.filter(m => (m.targetKelas || "Semua") === "Semua" || m.targetKelas === curKel);
          const kuisSnap = await getDocs(query(collection(db, "bimbel_modul"), where("type", "==", "kuis_mandiri")));
          let kuisMandiri = kuisSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          kuisMandiri = kuisMandiri.filter(m => (m.targetKelas || "Semua") === "Semua" || m.targetKelas === curKel);
          const combined = [...allModuls, ...kuisMandiri];
          combined.sort((a, b) => { const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0); const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0); return dateB - dateA; });
          fetchedTasks = combined.filter(m => m.quizData?.length > 0 || m.blocks?.some(b => b.type === 'assignment')).slice(0, 5);
        } catch (e) {}

        const { surveys: fetchedSurveys, filled: filledStatus } = await fetchSurveys(curKel, studentId);

        fetchRaportSummary(studentId).then(data => { if (data) setRaportSummary(data); });

        setTodaySchedules(fetchedSchedules);
        setTasks(fetchedTasks);
        setStudentProfile(sSnap.exists() ? sSnap.data() : null);
        setActiveSurveys(fetchedSurveys);
        setFilledSurveys(filledStatus);

        saveCache({ todaySchedules: fetchedSchedules, tasks: fetchedTasks, studentProfile: sSnap.exists() ? sSnap.data() : null, activeSurveys: fetchedSurveys, filledSurveys: filledStatus, raportSummary: null });
      } catch (err) { console.error('Error fetch dashboard:', err); } 
      finally { setLoading(false); }
    };
    
    fetchAll();
  }, [authReady, studentId]);

  const getAssignmentDeadline = (modul) => {
    const ab = modul.blocks?.find(b => b.type === 'assignment' && b.endTime);
    return ab?.endTime || modul.deadlineTugas || modul.deadlineQuiz || null;
  };

  const openSurvey = (s) => { setCurrentSurvey(s); setSurveyAnswers({}); setShowSurveyModal(true); };
  
  const submitSurvey = async () => {
    if (!currentSurvey) return;
    const unanswered = currentSurvey.questions?.filter((_, i) => !surveyAnswers[i]) || [];
    if (unanswered.length > 0) { alert(`❌ ${unanswered.length} pertanyaan belum dijawab!`); return; }
    setSurveyLoading(true);
    try {
      await addDoc(collection(db, "survey_responses"), {
        surveyId: currentSurvey.id, userId: studentId, userName: studentName,
        answers: currentSurvey.questions.map((q, i) => ({ questionIndex: i, answer: surveyAnswers[i] || '' })),
        submittedAt: serverTimestamp()
      });
      setFilledSurveys({ ...filledSurveys, [currentSurvey.id]: true });
      setShowSurveyModal(false); setCurrentSurvey(null);
      alert("✅ Terima kasih!");
    } catch (err) { alert("❌ Gagal: " + err.message); } 
    finally { setSurveyLoading(false); }
  };

  if (loading || !authReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const renderDashboardHome = () => (
    <div style={st.contentWrapper}>
      <div style={isMobile ? st.welcomeHeaderMobile : st.welcomeHeader}>
        <div>
          <h1 style={isMobile ? st.titleMobile : st.title}>Halo, {studentName}! 👋</h1>
          <p style={st.subtitle}>{studentProfile ? `${studentProfile.kategori || 'Reguler'} - Kelas ${studentProfile.kelasSekolah || '-'}` : "Memuat profil..."}</p>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setIsScanning(true)} style={st.btnScanHeader}><Camera size={18} /> SCAN ABSEN</button>
            <div style={st.statusBadge}><GraduationCap size={18} /><span>Siswa Aktif</span></div>
          </div>
        )}
      </div>

      {/* RINGKASAN RAPORT */}
      {raportSummary && (
        <div onClick={() => navigate('/siswa/smart-rapor')} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: 20, color: 'white', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Trophy size={28} color="#fbbf24" /><div><h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>📊 Ringkasan Raport</h3><p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.85 }}>Periode {raportSummary.periode?.replace('-', ' / ')}</p></div></div>
            <ArrowRight size={20} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            {raportSummary.nilaiAkhir !== null ? <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32, fontWeight: 900 }}>{raportSummary.nilaiAkhir}</div><div style={{ fontSize: 10, opacity: 0.8 }}>Nilai Akhir</div></div> : <div style={{ textAlign: 'center' }}><div style={{ fontSize: 13 }}>Belum tersedia</div></div>}
          </div>
        </div>
      )}

      {/* SURVEI */}
      {activeSurveys.length > 0 && (
        <div style={{ background: 'white', padding: 20, borderRadius: 15, border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6' }}>
          <h3 style={{ margin: '0 0 15px', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={20} color="#3b82f6" /> Survei {activeSurveys.filter(s => !filledSurveys[s.id]).length > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{activeSurveys.filter(s => !filledSurveys[s.id]).length}</span>}</h3>
          {activeSurveys.map(survey => {
            const done = filledSurveys[survey.id];
            return (
              <div key={survey.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: done ? '#f0fdf4' : '#fffbeb', borderRadius: 10, marginBottom: 8 }}>
                <div><strong>{survey.title}</strong>{survey.isRequired && !done && <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: 4, fontSize: 9, marginLeft: 8 }}>WAJIB</span>}</div>
                {done ? <span style={{ color: '#10b981', fontWeight: 700, fontSize: 12 }}>✅</span> : <button onClick={() => openSurvey(survey)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Isi</button>}
              </div>
            );
          })}
        </div>
      )}

      {/* MAIN GRID */}
      <div style={isMobile ? st.mainGridMobile : st.mainGrid}>
        <div style={st.leftColumn}>
          <section style={st.sectionCard}><h3 style={st.sectionTitle}><Calendar size={20} color="#3498db" /> Jadwal Hari Ini</h3>{todaySchedules.length === 0 ? <div style={st.emptyState}>📭 Tidak ada jadwal.</div> : todaySchedules.map((sch, i) => <div key={i} style={st.schItem}><div style={st.schTime}><b>{sch.start}</b><br /><span style={{ fontSize: 10 }}>{sch.end}</span></div><div style={st.schInfo}><b>{sch.title || "Kelas"}</b><div style={{ fontSize: 11, color: '#64748b' }}><MapPin size={10} /> {sch.planet || 'Ruangan'} • <User size={10} /> {sch.booker || 'Guru'}</div></div></div>)}</section>
          <section style={st.sectionCard}><div style={st.cardHeader}><h3 style={st.sectionTitle}><ClipboardList size={20} color="#9b59b6" /> Tugas & Kuis</h3><button onClick={() => setActiveMenu('materi')} style={st.btnViewAll}>Lihat Semua <ChevronRight size={14} /></button></div>{tasks.length === 0 ? <div style={st.emptyState}>📭 Belum ada tugas.</div> : tasks.map((task, i) => { const dl = getAssignmentDeadline(task); return <div key={i} style={{ ...st.taskItem, borderLeftColor: isDeadlinePassed(dl) ? '#ef4444' : isDeadlineSoon(dl) ? '#f59e0b' : '#9b59b6' }}><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{task.title}</div>{dl && <div style={{ fontSize: 11, marginTop: 4 }}><Clock size={12} /> {formatDateOnly(dl)}</div>}</div><button onClick={() => { localStorage.setItem('selectedModuleId', task.id); setActiveMenu('materi'); }} style={st.btnTaskBuka}>Buka</button></div>; })}</section>
        </div>
        <div style={st.rightColumn}>
          <section style={st.sectionCard}><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}><div style={st.avatar}>{studentName?.charAt(0) || 'S'}</div><div><b>{studentName}</b><p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{studentProfile?.kelasSekolah || '-'} • {studentProfile?.kategori || 'Reguler'}</p></div></div><button onClick={() => setActiveMenu('materi')} style={st.btnAccess}><BookOpen size={16} /> Buka Materi Belajar</button></section>
          <section style={st.sectionCard}><h3 style={{ ...st.sectionTitle, marginBottom: 10 }}><TrendingUp size={20} color="#10b981" /> Ringkasan</h3><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>{todaySchedules.length}</div><div style={{ fontSize: 10, color: '#64748b' }}>Jadwal</div></div><div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: 20, fontWeight: 800, color: '#9b59b6' }}>{tasks.length}</div><div style={{ fontSize: 10, color: '#64748b' }}>Tugas</div></div></div></section>
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

  return (
    <div style={st.mainContainer}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={(menu) => { setActiveMenu(menu); if (isMobile) setIsSidebarOpen(false); }} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      {isMobile && <button onClick={() => setIsSidebarOpen(true)} style={st.mobileMenuBtn}><Menu size={24} /></button>}
      <div style={{ ...st.contentArea, marginLeft: isMobile ? '0' : '260px', width: isMobile ? '100%' : 'calc(100% - 260px)', padding: isMobile ? '15px' : '30px', paddingTop: isMobile ? '70px' : '30px' }}>{renderContent()}</div>
      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={st.overlay} />}

      {isScanning && (<div style={st.modalOverlay} onClick={() => setIsScanning(false)}><div style={st.qrModalContent} onClick={e => e.stopPropagation()}><button onClick={() => setIsScanning(false)} style={st.btnCloseModal}><X size={20} /></button><h3>Scan QR</h3><div id="reader" style={{ width: '100%', borderRadius: 15 }}></div></div></div>)}

      {showSurveyModal && currentSurvey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setShowSurveyModal(false)} style={{ float: 'right', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}><X size={18} /></button>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>{currentSurvey.title}</h2>
            {currentSurvey.questions?.map((q, i) => (
              <div key={i} style={{ marginTop: 16 }}><p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{i+1}. {q.question}</p>
                {(q.options || []).filter(o => o).map((opt, oi) => (
                  <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: surveyAnswers[i] === opt ? '#eef2ff' : '#f8fafc', border: `2px solid ${surveyAnswers[i] === opt ? '#3b82f6' : '#e2e8f0'}`, marginBottom: 4, fontSize: 12 }}>
                    <input type="radio" name={`sq-${i}`} checked={surveyAnswers[i] === opt} onChange={() => setSurveyAnswers({...surveyAnswers, [i]: opt})} />{opt}
                  </label>
                ))}
              </div>
            ))}
            <button onClick={submitSurvey} disabled={surveyLoading} style={{ width: '100%', marginTop: 16, padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>{surveyLoading ? 'Mengirim...' : 'Kirim'}</button>
          </div>
        </div>
      )}

      {isMobile && <button onClick={() => setIsScanning(true)} style={st.fabQR}><Camera size={22} /></button>}
    </div>
  );
};

const st = {
  mainContainer: { display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative' },
  contentArea: { transition: 'margin 0.3s ease', boxSizing: 'border-box' },
  contentWrapper: { display: 'flex', flexDirection: 'column', gap: 20 },
  welcomeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  welcomeHeaderMobile: { textAlign: 'left', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 800, color: '#1e293b', margin: 0 },
  titleMobile: { fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: 5, fontSize: 14 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: 100, fontWeight: 'bold' },
  btnScanHeader: { display: 'flex', alignItems: 'center', gap: 8, background: '#3498db', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 100, fontWeight: 'bold', cursor: 'pointer' },
  mobileMenuBtn: { position: 'fixed', top: 15, left: 15, zIndex: 900, background: '#1e293b', color: 'white', border: 'none', padding: 10, borderRadius: 10, cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 },
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
  schInfo: { flex: 1 },
  taskItem: { display: 'flex', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 10, borderLeft: '4px solid', marginBottom: 8 },
  btnTaskBuka: { background: '#9b59b6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  avatar: { width: 45, height: 45, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, flexShrink: 0 },
  btnAccess: { width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  emptyState: { fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 15 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
  btnCloseModal: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qrModalContent: { background: 'white', padding: '30px 20px', borderRadius: 25, width: '90%', maxWidth: 400, textAlign: 'center', position: 'relative' },
  fabQR: { position: 'fixed', bottom: 20, right: 20, width: 60, height: 60, borderRadius: '50%', background: '#3498db', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 900, cursor: 'pointer' },
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default StudentDashboard;