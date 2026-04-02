import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { 
  collection, query, where, getDocs, doc, getDoc, orderBy 
} from "firebase/firestore";
import { Player } from '@lottiefiles/react-lottie-player';
import { 
  Clock, Users, BookOpen, Star, ArrowRight, 
  Eye, Megaphone, Info, Calendar, Layout, MapPin, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import ClassSession from './ClassSession';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [guru, setGuru] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaySchedules, setTodaySchedules] = useState([]);      
  const [mode, setMode] = useState('dashboard'); 
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [pendingSchedule, setPendingSchedule] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- STATE PENGUMUMAN & SLIDER ---
  const [announcements, setAnnouncements] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedNews, setSelectedNews] = useState(null); // Modal Detail Berita
  const sliderRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // AUTO-SLIDE LOGIC
  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % announcements.length);
      }, 5000); // Slide tiap 5 detik
      return () => clearInterval(interval);
    }
  }, [announcements]);

  const fetchTeacherProfile = useCallback(async () => {
    const saved = JSON.parse(localStorage.getItem('teacherData'));
    if (!saved) return navigate('/login-guru');
    setGuru(saved);
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!guru?.nama) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const qJadwal = query(collection(db, "jadwal_bimbel"), where("booker", "==", guru.nama.trim()));
      const snapJadwal = await getDocs(qJadwal);
      const filtered = snapJadwal.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.dateStr === todayStr)
        .sort((a,b) => a.start.localeCompare(b.start));
      setTodaySchedules(filtered);

      const qAnnounce = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
      const snapAnnounce = await getDocs(qAnnounce);
      const allData = snapAnnounce.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const teacherFeeds = allData.filter(p => 
        p.targetPortal === "Guru" || p.targetPortal === "Semua"
      );
      setAnnouncements(teacherFeeds);

    } catch (e) { console.error("Error sync:", e); } finally { setLoading(false); }
  }, [guru]);

  useEffect(() => { fetchTeacherProfile(); }, [fetchTeacherProfile]);
  useEffect(() => { if (guru) fetchData(); }, [guru, fetchData]);

  const handleVerifyAndStart = async () => {
    if (!inputToken) return alert("Sistem: Masukkan kode absensi!");
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const codeRef = doc(db, "settings", `daily_code_${todayStr}`);
      const codeSnap = await getDoc(codeRef);
      if (codeSnap.exists() && inputToken.toUpperCase() === codeSnap.data().code) {
          setMode('session');
          setShowStartModal(false);
          setInputToken("");
      } else {
          alert("❌ KODE ABSENSI SALAH!");
      }
    } catch (e) { alert("Error koneksi server."); }
  };

  if (mode === 'session') {
      return <ClassSession schedule={pendingSchedule} teacher={guru} onBack={() => { setMode('dashboard'); fetchData(); }} />;
  }

  if (loading) return (
    <div className="main-content-wrapper" style={{display:'flex', justifyContent:'center', alignItems:'center', height: '100vh'}}>
        <div className="spinner-global"></div>
    </div>
  );

  return (
    <div className="main-content-wrapper" style={{backgroundColor: '#f8fafc'}}>
      <div className="teacher-container-padding">
        
        {/* --- 1. HERO AUTO-SLIDER (TOP SECTION) --- */}
        {announcements.length > 0 && (
          <div style={styles.heroSlider}>
            <div style={{...styles.sliderTrack, transform: `translateX(-${activeSlide * 100}%)`}}>
              {announcements.map((p, idx) => (
                <div key={idx} style={styles.slideItem} onClick={() => setSelectedNews(p)}>
                  <img 
                    src={p.imageUrl} 
                    style={{...styles.heroImg, objectPosition: p.imgPosition || 'center'}} 
                    alt="banner" 
                  />
                  <div style={styles.heroOverlay}>
                    <div style={styles.heroContent}>
                        <span style={styles.heroBadge}><Megaphone size={12}/> Info Akademik</span>
                        <h2 style={styles.heroTitle}>{p.title}</h2>
                        <button style={styles.heroBtn}>Baca Selengkapnya <ChevronRight size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Dots Indicator */}
            <div style={styles.sliderDots}>
              {announcements.map((_, idx) => (
                <div key={idx} style={{...styles.dot, backgroundColor: activeSlide === idx ? '#fff' : 'rgba(255,255,255,0.4)'}} onClick={() => setActiveSlide(idx)} />
              ))}
            </div>
          </div>
        )}

        {/* --- 2. BANNER PROFIL GURU --- */}
        <div style={styles.banner}>
            <div style={{flex: 1}}>
                <div style={styles.badgeTop}>Dashboard Instruktur</div>
                <h1 style={styles.title}>Assalamu'alaikum, {guru?.nama?.split(' ')[0]}!</h1>
                <p style={styles.subtitle}>Selamat datang kembali di panel manajemen Bimbel Gemilang.</p>
                <div style={styles.statsRow}>
                    <div style={styles.miniStat}><Calendar size={14}/> {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</div>
                    <div style={styles.miniStat}><Clock size={14}/> {todaySchedules.length} Sesi Aktif</div>
                </div>
            </div>
            {!isMobile && (
                <div style={styles.lottieBox}>
                    <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: '140px' }} />
                </div>
            )}
        </div>

        <div className="responsive-grid" style={{alignItems: 'flex-start', gap: '30px'}}>
            
            {/* KOLOM KIRI: AGENDA MENGAJAR */}
            <div style={{flex: 1.5}}>
                <div className="teacher-card" style={styles.mainCard}>
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.cardTitle}><Layout size={20} color="#6366f1"/> Agenda Mengajar</h3>
                        <button onClick={() => navigate('/guru/schedule')} style={styles.btnText}>Lihat Kalender <ArrowRight size={14}/></button>
                    </div>

                    {todaySchedules.length === 0 ? (
                        <div style={styles.emptyBox}>
                            <Info size={30} style={{marginBottom: 10, opacity: 0.5}}/>
                            <p>Tidak ada jadwal mengajar untuk hari ini.</p>
                        </div>
                    ) : (
                        <div style={styles.listContainer}>
                            {todaySchedules.map(item => (
                                <div key={item.id} style={styles.listCard} className="teacher-card-hover">
                                    <div style={styles.cardLeft}>
                                        <div style={styles.timeLabel}>{item.start}</div>
                                        <div style={styles.verticalLine}></div>
                                    </div>
                                    <div style={styles.cardMain}>
                                        <h4 style={styles.classTitle}>{item.title}</h4>
                                        <div style={styles.classMeta}>
                                            <span>{item.program}</span>
                                            <span style={styles.dotSeparator}>•</span>
                                            <MapPin size={12} style={{marginRight: 4}}/> <span>Ruang: {item.planet}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => { setPendingSchedule(item); setShowStartModal(true); }} style={styles.btnAction}>MULAI SESI</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SHORTCUTS */}
                <div style={styles.shortcutContainer}>
                    <div onClick={() => navigate('/guru/modul')} style={styles.shortBtn} className="teacher-card-hover">
                        <div style={{...styles.iconCircle, background: '#eef2ff'}}><BookOpen color="#6366f1"/></div>
                        <b style={{fontSize: 14}}>E-Learning</b>
                        <p style={{fontSize: 11, color: '#64748b', margin: 0}}>Materi & Modul</p>
                    </div>
                    <div onClick={() => navigate('/guru/grades/input')} style={styles.shortBtn} className="teacher-card-hover">
                        <div style={{...styles.iconCircle, background: '#fffbeb'}}><Star color="#f59e0b"/></div>
                        <b style={{fontSize: 14}}>Input Nilai</b>
                        <p style={{fontSize: 11, color: '#64748b', margin: 0}}>Evaluasi Siswa</p>
                    </div>
                </div>
            </div>

            {/* KOLOM KANAN: LIST PENGUMUMAN BAWAH */}
            <div style={{flex: 1}}>
                <div className="teacher-card" style={styles.announceCard}>
                    <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 20}}>
                        <Megaphone size={22} color="#e11d48"/>
                        <h3 style={{margin:0, fontWeight: '900', color: '#1e293b'}}>Informasi Terbaru</h3>
                    </div>

                    <div style={styles.announceList}>
                        {announcements.slice(0, 4).map(p => (
                            <div key={p.id} style={styles.miniPoster} onClick={() => setSelectedNews(p)}>
                                <img src={p.imageUrl} style={styles.miniThumb} alt="thumb" />
                                <div style={{flex: 1}}>
                                    <b style={styles.miniTitle}>{p.title}</b>
                                    <div style={styles.miniDate}>{new Date(p.createdAt?.toDate()).toLocaleDateString('id-ID')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- MODAL DETAIL BERITA --- */}
      {selectedNews && (
          <div style={styles.overlay} onClick={() => setSelectedNews(null)}>
              <div style={styles.newsModal} onClick={e => e.stopPropagation()}>
                  <button style={styles.closeBtn} onClick={() => setSelectedNews(null)}><X size={20}/></button>
                  <img src={selectedNews.imageUrl} style={styles.modalImg} alt="news" />
                  <div style={styles.modalBody}>
                      <span style={styles.officialBadge}>Official Admin BIMBEL</span>
                      <h2 style={styles.modalTitle}>{selectedNews.title}</h2>
                      <p style={styles.modalText}>{selectedNews.content}</p>
                      {selectedNews.originalUrl && selectedNews.originalUrl !== "Internal Upload" && (
                          <button onClick={() => window.open(selectedNews.originalUrl)} style={styles.btnOpenSource}>Lihat Media Asli <ArrowRight size={14}/></button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MODAL KODE ABSENSI */}
      {showStartModal && (
         <div style={styles.overlay}>
            <div style={styles.modal} className="teacher-card">
                <h3 style={{marginTop: 0, fontWeight: '900', color: '#1e293b'}}>Otentikasi Kelas</h3>
                <p style={{fontSize: 12, color: '#64748b', marginBottom: 20}}>Gunakan kode absensi harian untuk memulai sesi pengajaran ini.</p>
                <input 
                    type="text" 
                    value={inputToken} 
                    onChange={e => setInputToken(e.target.value.toUpperCase())} 
                    style={styles.inputCode} 
                    placeholder="KODE" 
                    maxLength={6}
                />
                <div style={{display:'flex', gap:10, marginTop:30}}>
                    <button onClick={()=>setShowStartModal(false)} style={styles.btnCancel}>KEMBALI</button>
                    <button onClick={handleVerifyAndStart} style={styles.btnConfirm}>VERIFIKASI</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

const styles = {
  // HERO SLIDER STYLES
  heroSlider: { width: '100%', height: '350px', borderRadius: '30px', overflow: 'hidden', position: 'relative', marginBottom: '30px', backgroundColor: '#000' },
  sliderTrack: { display: 'flex', width: '100%', height: '100%', transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' },
  slideItem: { minWidth: '100%', height: '100%', position: 'relative' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover', opacity: '0.7' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 10%, transparent 70%)', display: 'flex', alignItems: 'flex-end', padding: '40px' },
  heroContent: { color: '#fff', maxWidth: '600px' },
  heroBadge: { background: '#e11d48', padding: '5px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content', marginBottom: '15px' },
  heroTitle: { fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: '900', margin: '0 0 20px 0', lineHeight: 1.2 },
  heroBtn: { background: 'white', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  sliderDots: { position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', transition: '0.3s', cursor: 'pointer' },

  // BASIC STYLES
  banner: { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '35px', borderRadius: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' },
  badgeTop: { background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '4px 12px', borderRadius: '50px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', display: 'inline-block', border: '1px solid rgba(99, 102, 241, 0.3)' },
  title: { margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: '900', letterSpacing: '-0.5px' },
  subtitle: { opacity: 0.8, fontSize: '14px', marginTop: 5 },
  statsRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  miniStat: { background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' },
  lottieBox: { background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: 10 },

  mainCard: { padding: '25px', borderRadius: '24px', background: '#fff' },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: '900', display: 'flex', alignItems: 'center', gap: 10, color: '#1e293b' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  btnText: { background: 'none', border: 'none', color: '#6366f1', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 },

  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listCard: { background: '#f8fafc', padding: '15px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', border: '1px solid #f1f5f9', transition: '0.2s' },
  cardLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' },
  timeLabel: { fontSize: 12, fontWeight: '900', color: '#1e293b' },
  verticalLine: { width: '2px', height: '20px', background: '#e2e8f0', marginTop: 5 },
  cardMain: { flex: 1, paddingLeft: 15 },
  classTitle: { margin: 0, fontSize: 15, fontWeight: '800', color: '#1e293b' },
  classMeta: { fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center' },
  dotSeparator: { margin: '0 8px' },
  btnAction: { background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '900', fontSize: 12, cursor: 'pointer' },

  shortcutContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' },
  shortBtn: { background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '1px solid #f1f5f9' },
  iconCircle: { width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  announceCard: { padding: '25px', borderRadius: '24px', background: '#fff' },
  announceList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  miniPoster: { display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', padding: '10px', borderRadius: '15px', border: '1px solid #f1f5f9' },
  miniThumb: { width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' },
  miniTitle: { fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'block', lineHeight: 1.3 },
  miniDate: { fontSize: '11px', color: '#94a3b8', marginTop: 4 },

  // MODAL BERITA STYLES
  newsModal: { width: '90%', maxWidth: '600px', backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', position: 'relative' },
  closeBtn: { position: 'absolute', top: 15, right: 15, background: 'rgba(255,255,255,0.8)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', zIndex: 10 },
  modalImg: { width: '100%', maxHeight: '300px', objectFit: 'cover' },
  modalBody: { padding: '30px' },
  officialBadge: { fontSize: '10px', color: '#6366f1', fontWeight: '900', letterSpacing: '1px' },
  modalTitle: { margin: '10px 0 20px 0', fontSize: '24px', fontWeight: '900', color: '#1e293b', lineHeight: 1.2 },
  modalText: { fontSize: '15px', color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  btnOpenSource: { marginTop: '25px', background: '#f1f5f9', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#6366f1' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(10px)', padding: '20px' },
  modal: { width: '90%', maxWidth: '360px', textAlign: 'center', padding: '35px' },
  inputCode: { width: '100%', padding: '18px', fontSize: '28px', textAlign: 'center', borderRadius: '15px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '900' },
  btnConfirm: { flex: 2, padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900' },
  btnCancel: { flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '700' },
  emptyBox: { padding: '50px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: '600' }
};

export default TeacherDashboard;