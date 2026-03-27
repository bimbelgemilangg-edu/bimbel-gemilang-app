import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

// --- IMPORT KOMPONEN MENU ---
import StudentFinanceSiswa from './StudentFinance';
import StudentGrades from './StudentGrades';
import StudentSchedule from './StudentSchedule';
import StudentAttendanceSiswa from './StudentAttendance';
import StudentElearning from './StudentElearning'; // KOMPONEN BARU UNTUK E-LEARNING

// --- IMPORT LUCIDE ICONS ---
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap,
  Menu,
  ChevronRight
} from 'lucide-react';

// --- IMPORT SWIPER ---
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
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const dummyPosters = [
    { id: 1, imageUrl: 'https://images.unsplash.com/photo-1523050335392-93851179428c?q=80&w=1600', title: 'Selamat Datang di Bimbel Gemilang', desc: 'Wujudkan mimpimu bersama pengajar terbaik kami.', content: 'Selamat datang di tahun ajaran baru! Mari tingkatkan semangat belajar untuk meraih prestasi terbaik bersama mentor-mentor ahli kami.' },
    { id: 2, imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600', title: 'Try Out Nasional Ke-5', desc: 'Pantau jadwal dan persiapkan dirimu sebaik mungkin!', content: 'Try Out akan dilaksanakan serentak. Pastikan koneksi internet stabil dan siapkan alat tulis serta nomor ujian masing-masing.' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const qPost = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
        const snapPost = await getDocs(qPost);
        const postData = snapPost.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosters(postData.length > 0 ? postData : dummyPosters);

        const qSched = query(collection(db, "jadwal_bimbel"), where("students", "array-contains", studentId), limit(3));
        const snapSched = await getDocs(qSched);
        setSchedules(snapSched.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Query Tugas yang rilisnya sudah lewat hari ini (Logic Hacker)
        const now = new Date().getTime();
        const qTask = query(
            collection(db, "bimbel_modul"), 
            where("type", "==", "tugas"), 
            where("isOpen", "==", true),
            limit(3)
        );
        const snapTask = await getDocs(qTask);
        setTasks(snapTask.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const renderDashboardHome = () => (
    <div style={styles.contentWrapper}>
      <div style={isMobile ? styles.welcomeHeaderMobile : styles.welcomeHeader}>
        <div>
          <h1 style={isMobile ? styles.titleMobile : styles.title}>Halo, {studentName}! 👋</h1>
          <p style={styles.subtitle}>Sistem E-Learning siap membantumu hari ini.</p>
        </div>
        {!isMobile && (
          <div style={styles.statusBadge}>
            <GraduationCap size={18} />
            <span>Siswa Aktif</span>
          </div>
        )}
      </div>

      <div style={{...styles.carouselContainer, aspectRatio: isMobile ? '4/3' : '16/9'}}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          effect={'fade'}
          navigation={!isMobile}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000 }}
          style={styles.mySwiper}
        >
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

      <div style={isMobile ? styles.mainGridMobile : styles.mainGrid}>
        <div style={styles.leftColumn}>
          <section style={styles.sectionCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.sectionTitle}><BookOpen size={20} color="#3498db" /> Akses Cepat Modul</h3>
            </div>
            <div style={styles.lastMaterialItem}>
              <div style={styles.iconBox}><BookOpen color="#3498db" /></div>
              <div style={{flex: 1}}>
                <b style={{fontSize: '14px'}}>Materi & Tugas</b>
                <p style={{fontSize: '11px', color: '#7f8c8d'}}>Lihat rilis materi minggu ini</p>
              </div>
              <button onClick={() => setActiveMenu('materi')} style={styles.btnContinue}>Buka</button>
            </div>
          </section>

          <section style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}><Clock size={20} color="#e67e22" /> Deadline Terdekat</h3>
            <div style={styles.timelineList}>
              {tasks.length > 0 ? tasks.map((task, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineMarker}><div style={styles.dot}></div><div style={styles.line}></div></div>
                  <div style={styles.timelineContent}>
                    <span style={{fontWeight: '600', fontSize: '13px'}}>{task.title}</span>
                    <span style={styles.deadlineLabel}>Batas: {task.deadline || "Segera"}</span>
                  </div>
                </div>
              )) : <div style={styles.emptyState}>Semua tugas sudah aman!</div>}
            </div>
          </section>
        </div>

        <div style={styles.rightColumn}>
          <section style={styles.scheduleCard}>
            <h3 style={{...styles.sectionTitle, color: 'white'}}><Calendar size={20} /> Jadwal Hari Ini</h3>
            <div style={styles.scheduleList}>
              {schedules.length > 0 ? schedules.map((sch, i) => (
                <div key={i} style={styles.schItem}>
                  <div style={styles.schTime}><b>{sch.start}</b></div>
                  <div style={styles.schInfo}><b style={{fontSize: '13px'}}>{sch.title}</b></div>
                </div>
              )) : <div style={{padding:'10px', fontSize:'12px', opacity:0.7}}>Tidak ada jadwal hari ini.</div>}
            </div>
          </section>
        </div>
      </div>

      {selectedNews && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={{...styles.modalContent, width: isMobile ? '90%' : '700px'}} onClick={e => e.stopPropagation()}>
            <img src={selectedNews.imageUrl} style={styles.modalImg} alt="News" />
            <div style={{padding: '20px'}}>
              <h2 style={{margin: 0, fontSize: isMobile ? '18px' : '24px'}}>{selectedNews.title}</h2>
              <p style={styles.modalBody}>{selectedNews.content || selectedNews.desc}</p>
            </div>
          </div>
        </div>
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
      case 'materi': return <StudentElearning />; // MENGARAH KE FILE E-LEARNING BARU
      default: return renderDashboardHome();
    }
  };

  return (
    <div style={styles.mainContainer}>
      <SidebarSiswa 
        activeMenu={activeMenu} 
        setActiveMenu={(menu) => { setActiveMenu(menu); if(isMobile) setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      {isMobile && (
        <button onClick={() => setIsSidebarOpen(true)} style={styles.mobileMenuBtn}>
          <Menu size={24} />
        </button>
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

      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={styles.overlay} />
      )}
    </div>
  );
};

// --- STYLES TETAP KONSISTEN ---
const styles = {
  mainContainer: { display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative' },
  contentArea: { transition: 'margin 0.3s ease', boxSizing: 'border-box' },
  contentWrapper: { display: 'flex', flexDirection: 'column', gap: '20px' },
  welcomeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  welcomeHeaderMobile: { textAlign: 'left', marginBottom: '10px' },
  title: { fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 },
  titleMobile: { fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '5px', fontSize: '14px' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: '100px', fontWeight: 'bold' },
  mobileMenuBtn: { position: 'fixed', top: '15px', left: '15px', zIndex: 900, background: '#1e293b', color: 'white', border: 'none', padding: '10px', borderRadius: '10px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 },
  carouselContainer: { borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%' },
  mySwiper: { width: '100%', height: '100%' },
  slideCard: { width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end' },
  slideOverlay: { width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '20px', color: 'white' },
  slideTitle: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  slideTitleMobile: { fontSize: '16px', fontWeight: 'bold', margin: 0 },
  slideDesc: { fontSize: '14px', opacity: 0.8, marginTop: '5px' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '25px' },
  mainGridMobile: { display: 'flex', flexDirection: 'column', gap: '20px' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionCard: { background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  lastMaterialItem: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '10px' },
  iconBox: { width: '35px', height: '35px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  btnContinue: { background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  timelineList: { marginTop: '10px' },
  timelineItem: { display: 'flex', gap: '10px' },
  timelineMarker: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' },
  line: { width: '2px', flexGrow: 1, background: '#e2e8f0' },
  timelineContent: { paddingBottom: '15px' },
  deadlineLabel: { fontSize: '11px', color: '#ef4444', display: 'block' },
  scheduleCard: { background: '#1e293b', padding: '20px', borderRadius: '15px', color: 'white' },
  scheduleList: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' },
  schItem: { background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
  schTime: { borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '10px' },
  emptyState: { fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalContent: { background: 'white', borderRadius: '15px', overflow: 'hidden' },
  modalImg: { width: '100%', height: '200px', objectFit: 'cover' },
  modalBody: { fontSize: '14px', color: '#475569', lineHeight: '1.6' }
};

export default StudentDashboard;