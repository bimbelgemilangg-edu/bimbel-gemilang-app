import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

// --- IMPORT KOMPONEN MENU (PENTING AGAR TIDAK MUNCUL "SILAKAN PILIH MENU") ---
import StudentFinanceSiswa from './StudentFinance';
import StudentGrades from './StudentGrades';
import StudentSchedule from './StudentSchedule';
import StudentAttendanceSiswa from './StudentAttendance';

// --- IMPORT LUCIDE ICONS ---
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Trophy, 
  AlertCircle,
  GraduationCap,
  X 
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
  const studentName = localStorage.getItem('studentName') || "Siswa";
  const studentId = localStorage.getItem('studentId');

  // State Data
  const [posters, setPosters] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Berita
  const [selectedNews, setSelectedNews] = useState(null);

  // Data Dummy untuk Poster (Cadangan jika Firebase kosong)
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
        
        const qTask = query(collection(db, "tasks"), where("studentId", "==", studentId), limit(3));
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
      {/* HEADER SALUTATION */}
      <div style={styles.welcomeHeader}>
        <div>
          <h1 style={styles.title}>Halo, {studentName}! 👋</h1>
          <p style={styles.subtitle}>Ayo lanjutkan progres belajarmu hari ini.</p>
        </div>
        <div style={styles.statusBadge}>
          <GraduationCap size={18} />
          <span>Siswa Aktif</span>
        </div>
      </div>

      {/* 1. LINI MASA POSTER (Slider Berita) */}
      <div style={styles.carouselContainer}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          effect={'fade'}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000 }}
          style={styles.mySwiper}
        >
          {posters.map((post) => (
            <SwiperSlide key={post.id} onClick={() => setSelectedNews(post)}>
              <div style={{...styles.slideCard, backgroundImage: `url(${post.imageUrl})`, cursor: 'pointer'}}>
                <div style={styles.slideOverlay}>
                  <h2 style={styles.slideTitle}>{post.title}</h2>
                  <p style={styles.slideDesc}>
                    {post.desc || (post.content ? post.content.substring(0, 70) + "..." : "Klik untuk baca selengkapnya")}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* GRID BAWAH */}
      <div style={styles.mainGrid}>
        <div style={styles.leftColumn}>
          {/* 2. AKSES TERAKHIR MATERI */}
          <section style={styles.sectionCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.sectionTitle}><BookOpen size={20} color="#3498db" /> Materi Terakhir</h3>
              <span style={styles.linkText}>Lihat Semua <ChevronRight size={14}/></span>
            </div>
            <div style={styles.lastMaterialItem}>
              <div style={styles.iconBox}><BookOpen color="#3498db" /></div>
              <div style={{flex: 1}}>
                <b style={{fontSize: '15px'}}>Matematika Dasar - Aljabar</b>
                <p style={{fontSize: '12px', color: '#7f8c8d', margin: '4px 0 0 0'}}>Terakhir dibuka: Hari ini, 10:20 WIB</p>
              </div>
              <button style={styles.btnContinue}>Lanjut</button>
            </div>
          </section>

          {/* 3. TIMELINE TUGAS */}
          <section style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}><Clock size={20} color="#e67e22" /> Timeline Tugas</h3>
            <div style={styles.timelineList}>
              {tasks.length > 0 ? tasks.map((task, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineMarker}>
                    <div style={styles.dot}></div>
                    {i !== tasks.length -1 && <div style={styles.line}></div>}
                  </div>
                  <div style={styles.timelineContent}>
                    <span style={{fontWeight: '600', color: '#2c3e50'}}>{task.title || "Tugas Mandiri"}</span>
                    <span style={styles.deadlineLabel}>Deadline: {task.dueDate || "Besok"}</span>
                  </div>
                </div>
              )) : (
                <div style={styles.emptyState}><Trophy size={30} color="#f1c40f" /><p>Belum ada tugas baru!</p></div>
              )}
            </div>
          </section>
        </div>

        <div style={styles.rightColumn}>
          {/* 4. JADWAL HARI INI */}
          <section style={styles.scheduleCard}>
            <div style={styles.cardHeader}>
              <h3 style={{...styles.sectionTitle, color: 'white'}}><Calendar size={20} /> Jadwal Hari Ini</h3>
            </div>
            <div style={styles.scheduleList}>
              {schedules.length > 0 ? schedules.map((sch, i) => (
                <div key={i} style={styles.schItem}>
                  <div style={styles.schTime}>
                    <b style={{color: '#2c3e50'}}>{sch.start || "16:00"}</b>
                    <small style={{color: '#7f8c8d'}}>{sch.end || "17:30"}</small>
                  </div>
                  <div style={styles.schInfo}>
                    <b style={{display:'block', fontSize: '14px'}}>{sch.title || "Konsultasi Belajar"}</b>
                    <span style={styles.roomTag}>{sch.planet || "BUMI"}</span>
                  </div>
                </div>
              )) : (
                <div style={styles.emptySched}>
                  <AlertCircle size={24} color="white" style={{opacity: 0.7}} />
                  <p>Tidak ada jadwal hari ini.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* POPUP MODAL UNTUK BACA BERITA */}
      {selectedNews && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{position: 'relative'}}>
              <img src={selectedNews.imageUrl} style={styles.modalImg} alt="News" />
              <button style={styles.closeBtn} onClick={() => setSelectedNews(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{padding: '25px'}}>
              <h2 style={{margin: 0, color: '#1e293b'}}>{selectedNews.title}</h2>
              <div style={{display: 'flex', gap: '10px', marginTop: '10px', color: '#64748b', fontSize: '13px'}}>
                <span>Bimbel Gemilang</span>
                <span>•</span>
                <span>{selectedNews.createdAt?.toDate ? selectedNews.createdAt.toDate().toLocaleDateString('id-ID') : 'Terbaru'}</span>
              </div>
              <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid #e2e8f0'}} />
              <p style={styles.modalBody}>
                {selectedNews.content || selectedNews.desc || "Tidak ada detail tambahan untuk berita ini."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return renderDashboardHome();
      case 'keuangan': return <StudentFinanceSiswa />; // <-- MENAMBAHKAN INI
      case 'rapor': return <StudentGrades />; // <-- MENAMBAHKAN INI
      case 'jadwal': return <StudentSchedule />; // <-- MENAMBAHKAN INI
      case 'absensi': return <StudentAttendanceSiswa />; // <-- MENAMBAHKAN INI
      case 'nilai': return <StudentGrades />; // Cadangan rute nilai
      default: return renderDashboardHome();
    }
  };

  return (
    <div style={styles.mainContainer}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={styles.contentArea}>
        {renderContent()}
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  mainContainer: { display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  contentArea: { marginLeft: '270px', padding: '30px', width: 'calc(100% - 270px)', boxSizing: 'border-box' },
  contentWrapper: { display: 'flex', flexDirection: 'column', gap: '30px' },
  
  welcomeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '5px' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: '100px', fontWeight: 'bold', fontSize: '14px' },

  carouselContainer: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', aspectRatio: '16/9', width: '100%' },
  mySwiper: { width: '100%', height: '100%' },
  slideCard: { width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end' },
  slideOverlay: { width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '40px', color: 'white', boxSizing: 'border-box' },
  slideTitle: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  slideDesc: { fontSize: '16px', opacity: 0.9, marginTop: '8px' },

  mainGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '25px' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '25px' },
  rightColumn: {},

  sectionCard: { background: 'white', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
  linkText: { fontSize: '13px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600' },

  lastMaterialItem: { display: 'flex', alignItems: 'center', gap: '15px', background: '#f8fafc', padding: '15px', borderRadius: '12px' },
  iconBox: { width: '45px', height: '45px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  btnContinue: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },

  timelineList: { display: 'flex', flexDirection: 'column', marginTop: '10px' },
  timelineItem: { display: 'flex', gap: '15px' },
  timelineMarker: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', background: '#f97316', marginTop: '6px' },
  line: { width: '2px', flexGrow: 1, background: '#e2e8f0', margin: '4px 0' },
  timelineContent: { paddingBottom: '20px', display: 'flex', flexDirection: 'column' },
  deadlineLabel: { fontSize: '12px', color: '#ef4444', fontWeight: '600', marginTop: '4px' },

  scheduleCard: { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '24px', borderRadius: '20px', color: 'white' },
  scheduleList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' },
  schItem: { background: 'white', padding: '15px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '15px' },
  schTime: { textAlign: 'center', borderRight: '1px solid #f1f5f9', paddingRight: '15px' },
  roomTag: { background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', marginTop: '5px', display: 'inline-block' },
  emptyState: { textAlign: 'center', padding: '20px', color: '#94a3b8' },
  emptySched: { textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },

  // MODAL STYLES
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(5px)' },
  modalContent: { background: 'white', width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  modalImg: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', border: 'none', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#1e293b', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  modalBody: { fontSize: '16px', lineHeight: '1.7', color: '#334155', whiteSpace: 'pre-wrap' }
};

export default StudentDashboard;