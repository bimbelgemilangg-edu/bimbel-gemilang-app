import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Html5Qrcode } from "html5-qrcode";

import StudentFinanceSiswa from './StudentFinance';
import StudentGrades from './StudentGrades';
import StudentSchedule from './StudentSchedule';
import StudentAttendanceSiswa from './StudentAttendance';
import StudentElearning from './StudentElearning'; 

import { 
  BookOpen, Calendar, Clock, GraduationCap, Menu, ChevronRight,
  Target, ClipboardList, AlertCircle, QrCode, X, Camera, User, MapPin
} from 'lucide-react';

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

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  // 🔥 SCANNER QR
  useEffect(() => {
    let html5QrCode = null;
    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              if (data.type === "ABSENSI_BIMBEL") {
                const today = new Date().toISOString().split('T')[0];
                const absenRef = doc(db, "attendance", `${studentId}_${today}_${data.scheduleId || ''}`);
                await setDoc(absenRef, {
                  studentId, studentName,
                  teacherName: data.teacher,
                  date: today, tanggal: today,
                  timestamp: serverTimestamp(),
                  status: "Hadir",
                  mapel: data.mapel,
                  scheduleId: data.scheduleId || '',
                  keterangan: "Scan QR Mandiri Siswa"
                }, { merge: true });
                alert(`✅ Absen Berhasil: ${data.mapel}`);
                stopScanner();
              }
            } catch (err) { console.error("QR tidak valid", err); }
          },
          () => {}
        );
      } catch (err) { console.error("Kamera gagal:", err); }
    };
    const stopScanner = async () => {
      if (html5QrCode && html5QrCode.isScanning) {
        try { await html5QrCode.stop(); html5QrCode.clear(); } catch (err) {}
      }
      setIsScanning(false);
    };
    if (isScanning) startScanner();
    return () => { if (html5QrCode) stopScanner(); };
  }, [isScanning, studentId, studentName]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateOnly = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // 🔥 FUNGSI CEK DEADLINE
  const isDeadlineSoon = (deadline) => {
    if (!deadline) return false;
    const dl = deadline.toDate ? deadline.toDate() : new Date(deadline);
    const now = new Date();
    const diffHours = (dl - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 48;
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    const dl = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return dl < new Date();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        // 🔥 DATA SISWA
        const studentSnap = await getDoc(doc(db, "students", studentId));
        let currentKategori = "Semua";
        let currentKelas = "Semua";
        if (studentSnap.exists()) {
          const sData = studentSnap.data();
          setStudentProfile(sData);
          currentKategori = sData.kategori || "Semua";
          currentKelas = sData.kelasSekolah || "Semua";
        }

        // 🔥 POSTER
        const qPost = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
        const snapPost = await getDocs(qPost);
        setPosters(snapPost.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // 🔥 JADWAL HARI INI (DIPERBAIKI)
        const todayStr = new Date().toISOString().split('T')[0];
        const qAllSched = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr));
        const snapAllSched = await getDocs(qAllSched);
        
        // Filter manual: cek apakah studentId ada di array students
        const studentSchedules = snapAllSched.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(sch => {
            if (!sch.students || !Array.isArray(sch.students)) return false;
            return sch.students.some(s => s.id === studentId || s === studentId);
          })
          .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
        
        setTodaySchedules(studentSchedules.slice(0, 5));

        // 🔥 TUGAS/MODUL (DIPERBAIKI)
        const qModul = query(
          collection(db, "bimbel_modul"),
          where("targetKategori", "in", ["Semua", currentKategori]),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const snapModul = await getDocs(qModul);
        const allModuls = snapModul.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter yang memiliki deadlineQuiz atau deadlineTugas
        const tugasList = allModuls.filter(m => m.deadlineQuiz || m.deadlineTugas || m.quizData?.length > 0 || m.blocks?.some(b => b.type === 'assignment'));
        setTasks(tugasList.slice(0, 5));

      } catch (err) { console.error("Error:", err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [studentId]);

  // 🔥 FUNGSI CEK TUGAS DEADLINE DARI BLOCKS
  const getAssignmentDeadline = (modul) => {
    if (modul.blocks) {
      const assignmentBlock = modul.blocks.find(b => b.type === 'assignment' && b.endTime);
      if (assignmentBlock) return assignmentBlock.endTime;
    }
    return modul.deadlineTugas || modul.deadlineQuiz || null;
  };

  const renderDashboardHome = () => (
    <div style={styles.contentWrapper}>
      {/* HEADER */}
      <div style={isMobile ? styles.welcomeHeaderMobile : styles.welcomeHeader}>
        <div>
          <h1 style={isMobile ? styles.titleMobile : styles.title}>Halo, {studentName}! 👋</h1>
          <p style={styles.subtitle}>
            {studentProfile ? `${studentProfile.kategori} - Kelas ${studentProfile.kelasSekolah}` : "Memuat..."}
          </p>
        </div>
        {!isMobile && (
          <div style={{display:'flex', gap: 10}}>
            <button onClick={() => setIsScanning(true)} style={styles.btnScanHeader}>
              <Camera size={18} /> SCAN ABSEN
            </button>
            <div style={styles.statusBadge}>
              <GraduationCap size={18} /><span>Siswa Aktif</span>
            </div>
          </div>
        )}
      </div>

      {/* CAROUSEL */}
      <div style={{...styles.carouselContainer, aspectRatio: isMobile ? '4/3' : '21/9'}}>
        <Swiper modules={[Navigation, Pagination, Autoplay, EffectFade]} effect={'fade'} navigation={!isMobile} pagination={{ clickable: true }} autoplay={{ delay: 5000, disableOnInteraction: false }} loop={posters.length > 1} style={styles.mySwiper}>
          {posters.map((post) => (
            <SwiperSlide key={post.id} onClick={() => setSelectedNews(post)}>
              <div style={{...styles.slideCard, backgroundImage: `url(${post.imageUrl})`, cursor: 'pointer'}}>
                <div style={styles.slideOverlay}>
                  <h2 style={isMobile ? styles.slideTitleMobile : styles.slideTitle}>{post.title}</h2>
                  {!isMobile && <p style={styles.slideDesc}>{post.desc || "Klik untuk baca selengkapnya"}</p>}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* MAIN GRID */}
      <div style={isMobile ? styles.mainGridMobile : styles.mainGrid}>
        
        {/* KOLOM KIRI */}
        <div style={styles.leftColumn}>
          
          {/* JADWAL HARI INI */}
          <section style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}><Calendar size={20} color="#3498db" /> Jadwal Hari Ini</h3>
            {todaySchedules.length === 0 ? (
              <div style={styles.emptyState}>📭 Tidak ada jadwal hari ini.</div>
            ) : (
              todaySchedules.map((sch, i) => (
                <div key={i} style={styles.schItem}>
                  <div style={styles.schTime}><b>{sch.start}</b><br/><span style={{fontSize:10}}>{sch.end}</span></div>
                  <div style={{...styles.schLine, background: sch.program === 'English' ? '#e74c3c' : '#3498db'}}></div>
                  <div style={styles.schInfo}>
                    <b>{sch.title || "Kelas"}</b>
                    <div style={{fontSize:11, color:'#64748b', marginTop:2}}>
                      <MapPin size={10} /> {sch.planet || "Ruang"} • <User size={10} /> {sch.booker || "Guru"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* TUGAS MENDATANG */}
          <section style={styles.sectionCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.sectionTitle}><ClipboardList size={20} color="#9b59b6" /> Tugas & Kuis</h3>
              <button onClick={() => setActiveMenu('materi')} style={styles.btnViewAll}>Lihat Semua <ChevronRight size={14} /></button>
            </div>
            {tasks.length === 0 ? (
              <div style={styles.emptyState}>📭 Tidak ada tugas.</div>
            ) : (
              tasks.map((task, i) => {
                const deadline = getAssignmentDeadline(task);
                const isSoon = isDeadlineSoon(deadline);
                const isPassed = isDeadlinePassed(deadline);
                return (
                  <div key={i} style={{
                    ...styles.taskItem,
                    borderLeftColor: isPassed ? '#ef4444' : isSoon ? '#f59e0b' : '#9b59b6'
                  }}>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: 14, fontWeight: 700, color: '#1e293b'}}>{task.title}</div>
                      {deadline && (
                        <div style={{fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
                          <Clock size={12} color={isPassed ? '#ef4444' : '#64748b'} />
                          <span style={{color: isPassed ? '#ef4444' : '#64748b', fontWeight: isSoon ? 700 : 400}}>
                            {isPassed ? '⛔ Terlambat: ' : isSoon ? '⚠️ Segera: ' : '📅 Deadline: '}
                            {formatDateOnly(deadline)}
                          </span>
                          {isSoon && <span style={styles.badgeUrgent}>SEGERA</span>}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setActiveMenu('materi')} style={styles.btnTaskBuka}>Buka</button>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* KOLOM KANAN */}
        <div style={styles.rightColumn}>
          
          {/* PROFIL + AKSES CEPAT */}
          <section style={styles.sectionCard}>
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:15}}>
              <div style={styles.avatar}>{studentName?.charAt(0) || 'S'}</div>
              <div>
                <b>{studentName}</b>
                <p style={{fontSize:11, color:'#64748b', margin:0}}>{studentProfile?.kelasSekolah || '-'}</p>
              </div>
            </div>
            <button onClick={() => setActiveMenu('materi')} style={styles.btnAccess}>
              <BookOpen size={16} /> Buka Materi Belajar
            </button>
          </section>

          {/* RIWAYAT MATERI */}
          <section style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}><Clock size={20} color="#e67e22" /> Materi Terbaru</h3>
            {tasks.slice(0, 3).map((task, i) => (
              <div key={i} style={styles.historyItem}>
                <div style={styles.dot}></div>
                <div>
                  <div style={{fontWeight:600, fontSize:13}}>{task.title}</div>
                  <div style={{fontSize:11, color:'#94a3b8'}}>{formatDateOnly(task.createdAt)}</div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <div style={styles.emptyState}>Belum ada materi.</div>}
          </section>
        </div>
      </div>

      {/* MODAL BERITA */}
      {selectedNews && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={{...styles.modalContent, width: isMobile ? '90%' : '600px'}} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNews(null)} style={styles.btnCloseModal}><X size={20} /></button>
            <img src={selectedNews.imageUrl} style={styles.modalImg} alt="News" />
            <div style={{padding: 20}}>
              <h2 style={{margin:0, fontSize: isMobile ? 18 : 22}}>{selectedNews.title}</h2>
              <p style={{fontSize:14, color:'#475569', marginTop:10, lineHeight:1.6}}>{selectedNews.content || selectedNews.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SCANNER */}
      {isScanning && (
        <div style={styles.modalOverlay} onClick={() => setIsScanning(false)}>
          <div style={styles.qrModalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsScanning(false)} style={styles.btnCloseModal}><X size={20}/></button>
            <h3 style={{marginTop:0, fontSize:18, color:'#2c3e50'}}>Scan QR Absensi</h3>
            <p style={{fontSize:12, color:'#7f8c8d', marginBottom:20}}>Arahkan kamera ke kode QR Guru</p>
            <div id="reader" style={{ width: '100%', borderRadius: 15, overflow: 'hidden', background: '#000' }}></div>
            <p style={{fontSize:11, color:'#3498db', marginTop:15}}>{studentName}</p>
          </div>
        </div>
      )}

      {/* FAB MOBILE */}
      {isMobile && (
        <button onClick={() => setIsScanning(true)} style={styles.fabQR}>
          <Camera size={22} />
        </button>
      )}
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
    <div style={styles.mainContainer}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p>Menyiapkan dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={styles.mainContainer}>
      <SidebarSiswa 
        activeMenu={activeMenu} 
        setActiveMenu={(menu) => { setActiveMenu(menu); if(isMobile) setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      {isMobile && (
        <button onClick={() => setIsSidebarOpen(true)} style={styles.mobileMenuBtn}><Menu size={24} /></button>
      )}
      <div style={{
        ...styles.contentArea,
        marginLeft: isMobile ? '0' : '260px',
        width: isMobile ? '100%' : 'calc(100% - 260px)',
        padding: isMobile ? '15px' : '30px',
        paddingTop: isMobile ? '70px' : '30px'
      }}>
        {renderContent()}
      </div>
      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={styles.overlay} />}
    </div>
  );
};

const styles = {
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
  
  // JADWAL
  schItem: { display: 'flex', alignItems: 'stretch', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  schTime: { minWidth: 55, fontSize: 13, textAlign: 'center' },
  schLine: { width: 3, borderRadius: 3 },
  schInfo: { flex: 1 },
  
  // TUGAS
  taskItem: { display: 'flex', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 10, borderLeft: '4px solid', marginBottom: 8 },
  badgeUrgent: { background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 'bold' },
  btnTaskBuka: { background: '#9b59b6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  
  // AKSES CEPAT
  avatar: { width: 45, height: 45, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, flexShrink: 0 },
  btnAccess: { width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  
  // HISTORY
  historyItem: { display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#f97316', marginTop: 5, flexShrink: 0 },
  
  emptyState: { fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 15 },
  
  // MODALS
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
  modalContent: { background: 'white', borderRadius: 15, overflow: 'hidden', position: 'relative' },
  modalImg: { width: '100%', maxHeight: 250, objectFit: 'cover' },
  btnCloseModal: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  // QR
  qrModalContent: { background: 'white', padding: '30px 20px', borderRadius: 25, width: '90%', maxWidth: 400, textAlign: 'center', position: 'relative' },
  fabQR: { position: 'fixed', bottom: 20, right: 20, width: 60, height: 60, borderRadius: '50%', background: '#3498db', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 900 },
};

export default StudentDashboard;