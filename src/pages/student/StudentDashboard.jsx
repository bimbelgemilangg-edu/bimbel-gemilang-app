import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Html5Qrcode } from "html5-qrcode"; // Menggunakan Html5Qrcode langsung untuk kontrol lebih baik

// --- IMPORT KOMPONEN MENU ---
import StudentFinanceSiswa from './StudentFinance';
import StudentGrades from './StudentGrades';
import StudentSchedule from './StudentSchedule';
import StudentAttendanceSiswa from './StudentAttendance';
import StudentElearning from './StudentElearning'; 

// --- IMPORT LUCIDE ICONS ---
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap,
  Menu,
  ChevronRight,
  Target,
  ClipboardList,
  AlertCircle,
  QrCode,
  X,
  Camera
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
  const [studentProfile, setStudentProfile] = useState(null);
  
  // State untuk Scanner
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  // LOGIKA SCANNER FIXED
  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        await html5QrCode.start(
          { facingMode: "environment" }, // Paksa kamera belakang
          config,
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              if (data.type === "ABSENSI_BIMBEL") {
                const today = new Date().toISOString().split('T')[0];
                const absenRef = doc(db, "attendance", `${studentId}_${today}`);
                
                await setDoc(absenRef, {
                  studentId: studentId,
                  studentName: studentName,
                  teacherName: data.teacher,
                  date: today,
                  tanggal: today,
                  timestamp: serverTimestamp(),
                  status: "Hadir",
                  mapel: data.mapel,
                  keterangan: "Scan QR Mandiri Siswa"
                }, { merge: true });

                alert(`✅ Absen Berhasil: ${data.mapel}`);
                stopScanner();
              }
            } catch (err) {
              console.error("Format QR tidak valid", err);
            }
          },
          (errorMessage) => { /* scanning... */ }
        );
      } catch (err) {
        console.error("Gagal inisialisasi kamera:", err);
      }
    };

    const stopScanner = async () => {
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          await html5QrCode.stop();
          html5QrCode.clear();
        } catch (err) {
          console.error("Gagal menghentikan scanner:", err);
        }
      }
      setIsScanning(false);
    };

    if (isScanning) {
      startScanner();
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(e => console.log(e));
      }
    };
  }, [isScanning, studentId, studentName]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const studentSnap = await getDoc(doc(db, "students", studentId));
        let currentKategori = "Semua";
        let currentKelas = "Semua";

        if (studentSnap.exists()) {
          const sData = studentSnap.data();
          setStudentProfile(sData);
          currentKategori = sData.kategori || "Semua";
          currentKelas = sData.kelasSekolah || "Semua";
        }

        const qPost = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
        const snapPost = await getDocs(qPost);
        setPosters(snapPost.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const qSched = query(collection(db, "jadwal_bimbel"), where("students", "array-contains", studentId), limit(3));
        const snapSched = await getDocs(qSched);
        setSchedules(snapSched.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const qTask = query(
            collection(db, "bimbel_modul"), 
            where("targetKategori", "in", ["Semua", currentKategori]),
            where("targetKelas", "in", ["Semua", currentKelas]),
            orderBy("createdAt", "desc"),
            limit(5)
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
          <p style={styles.subtitle}>
            {studentProfile ? `${studentProfile.kategori} - Kelas ${studentProfile.kelasSekolah}` : "Memuat data kelas..."}
          </p>
        </div>
        {!isMobile && (
          <div style={{display:'flex', gap: 10}}>
              <button onClick={() => setIsScanning(true)} style={styles.btnScanHeader}>
                <Camera size={18} /> SCAN ABSEN
              </button>
              <div style={styles.statusBadge}>
                <GraduationCap size={18} />
                <span>Siswa Aktif</span>
              </div>
          </div>
        )}
      </div>

      <div style={{...styles.carouselContainer, aspectRatio: isMobile ? '4/3' : '21/9'}}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          effect={'fade'}
          navigation={!isMobile}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={posters.length > 1}
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
              <div style={styles.iconBox}><Target color="#3498db" size={20} /></div>
              <div style={{flex: 1}}>
                <b style={{fontSize: '14px'}}>Materi Khusus {studentProfile?.kelasSekolah || "Anda"}</b>
                <p style={{fontSize: '11px', color: '#7f8c8d'}}>Lihat rilis materi terbaru hari ini</p>
              </div>
              <button onClick={() => setActiveMenu('materi')} style={styles.btnContinue}>Buka</button>
            </div>
          </section>

          <section style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}><Clock size={20} color="#e67e22" /> Riwayat Materi Terbaru</h3>
            <div style={styles.timelineList}>
              {tasks.length > 0 ? tasks.slice(0, 3).map((task, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineMarker}><div style={styles.dot}></div><div style={styles.line}></div></div>
                  <div style={styles.timelineContent}>
                    <span style={{fontWeight: '600', fontSize: '13px'}}>{task.title}</span>
                    <span style={styles.deadlineLabel}>Rilis: {formatDate(task.createdAt)}</span>
                  </div>
                </div>
              )) : <div style={styles.emptyState}>Belum ada materi baru.</div>}
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

          <section style={{...styles.sectionCard, marginTop: '20px'}}>
            <h3 style={styles.sectionTitle}><ClipboardList size={20} color="#9b59b6" /> Upcoming Tugas</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px'}}>
              {tasks.length > 0 ? tasks.map((task, i) => (
                <div key={i} style={styles.upcomingTaskItem}>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: '13px', fontWeight: '700', color: '#2c3e50'}}>{task.title}</div>
                    <div style={{fontSize: '11px', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px'}}>
                       <Clock size={12} /> Deadline: <span style={{color: '#e74c3c', fontWeight: '600'}}>{formatDate(task.deadline)}</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveMenu('materi')} style={styles.btnActionSmall}>Buka</button>
                </div>
              )) : <div style={styles.emptyState}>Tidak ada tugas mendatang.</div>}
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

      {/* MODAL SCANNER QR */}
      {isScanning && (
        <div style={styles.modalOverlay} onClick={() => setIsScanning(false)}>
          <div style={styles.qrModalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsScanning(false)} style={styles.btnCloseQR}><X size={20}/></button>
            <h3 style={{marginTop:0, fontSize:18, color:'#2c3e50'}}>Scan QR Absensi</h3>
            <p style={{fontSize:12, color:'#7f8c8d', marginBottom:20}}>Arahkan kamera ke kode QR yang ditampilkan Guru</p>
            <div id="reader" style={{ width: '100%', borderRadius: '15px', overflow: 'hidden', background: '#000' }}></div>
            <div style={styles.qrInfo}>
               <div style={{fontSize:14, fontWeight:'bold', color:'#2c3e50'}}>{studentName}</div>
               <div style={{fontSize:11, color:'#3498db'}}>Posisikan QR tepat di tengah kotak</div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON UNTUK SCAN DI MOBILE */}
      {isMobile && (
        <button onClick={() => setIsScanning(true)} style={styles.fabQR}>
          <Camera size={24} />
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
  btnScanHeader: { display:'flex', alignItems:'center', gap:8, background:'#3498db', color:'white', border:'none', padding:'8px 16px', borderRadius:100, fontWeight:'bold', cursor:'pointer' },
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
  deadlineLabel: { fontSize: '11px', color: '#64748b', display: 'block' },
  scheduleCard: { background: '#1e293b', padding: '20px', borderRadius: '15px', color: 'white' },
  scheduleList: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' },
  schItem: { background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
  schTime: { borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '10px' },
  emptyState: { fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
  modalContent: { background: 'white', borderRadius: '15px', overflow: 'hidden' },
  modalImg: { width: '100%', height: '200px', objectFit: 'cover' },
  modalBody: { fontSize: '14px', color: '#475569', lineHeight: '1.6' },
  upcomingTaskItem: { display: 'flex', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', borderLeft: '4px solid #9b59b6' },
  btnActionSmall: { background: '#9b59b6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  
  // SCANNER MODAL STYLES
  fabQR: { position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#3498db', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 900 },
  qrModalContent: { background: 'white', padding: '30px 20px', borderRadius: '25px', width: '90%', maxWidth: '400px', textAlign: 'center', position: 'relative' },
  btnCloseQR: { position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  qrInfo: { marginTop: '20px', borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }
};

export default StudentDashboard;