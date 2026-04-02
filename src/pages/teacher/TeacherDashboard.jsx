import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { 
  collection, query, where, getDocs, doc, getDoc, orderBy 
} from "firebase/firestore";
import { Player } from '@lottiefiles/react-lottie-player';
import { 
  Clock, Users, BookOpen, Star, ArrowRight, 
  Eye, Megaphone, Info, Calendar, Layout, MapPin
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

  // --- STATE PENGUMUMAN (Read-Only dari Admin) ---
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTeacherProfile = useCallback(async () => {
    const saved = JSON.parse(localStorage.getItem('teacherData'));
    if (!saved) return navigate('/login-guru');
    setGuru(saved);
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!guru?.nama) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // 1. Fetch Jadwal Mengajar Guru
      const qJadwal = query(collection(db, "jadwal_bimbel"), where("booker", "==", guru.nama.trim()));
      const snapJadwal = await getDocs(qJadwal);
      const filtered = snapJadwal.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.dateStr === todayStr)
        .sort((a,b) => a.start.localeCompare(b.start));
      setTodaySchedules(filtered);

      // 2. Fetch Pengumuman (Filter Target: 'Guru' atau 'Semua')
      const qAnnounce = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
      const snapAnnounce = await getDocs(qAnnounce);
      const allData = snapAnnounce.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sinkronisasi dengan Pilihan Admin: Tampilkan hanya yang ditujukan untuk Guru/Semua
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
    <div className="main-content-wrapper">
      <div className="teacher-container-padding">
        
        {/* BANNER UTAMA */}
        <div style={styles.banner}>
            <div style={{flex: 1}}>
                <div style={styles.badgeTop}>Dashboard Instruktur</div>
                <h1 style={styles.title}>Assalamu'alaikum, {guru?.nama?.split(' ')[0]}!</h1>
                <p style={styles.subtitle}>Pantau jadwal dan informasi akademik terbaru di sini.</p>
                <div style={styles.statsRow}>
                    <div style={styles.miniStat}><Calendar size={14}/> {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</div>
                    <div style={styles.miniStat}><Clock size={14}/> {todaySchedules.length} Sesi Hari Ini</div>
                </div>
            </div>
            {!isMobile && (
                <div style={styles.lottieBox}>
                    <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: '160px' }} />
                </div>
            )}
        </div>

        <div className="responsive-grid" style={{alignItems: 'flex-start', gap: '30px'}}>
            
            {/* KOLOM KIRI: AGENDA MENGAJAR */}
            <div style={{flex: 1.5}}>
                <div className="teacher-card" style={styles.mainCard}>
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.cardTitle}><Layout size={20} color="#6366f1"/> Agenda Mengajar</h3>
                        <button onClick={() => navigate('/guru/schedule')} style={styles.btnText}>Selengkapnya <ArrowRight size={14}/></button>
                    </div>

                    {todaySchedules.length === 0 ? (
                        <div style={styles.emptyBox}>
                            <Info size={30} style={{marginBottom: 10, opacity: 0.5}}/>
                            <p>Tidak ada jadwal mengajar untuk Anda hari ini.</p>
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
                                    <button onClick={() => { setPendingSchedule(item); setShowStartModal(true); }} style={styles.btnAction}>MULAI</button>
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

            {/* KOLOM KANAN: PAPAN INFORMASI ADMIN (POSTER) */}
            <div style={{flex: 1}}>
                <div className="teacher-card" style={styles.announceCard}>
                    <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 20}}>
                        <Megaphone size={22} color="#e11d48"/>
                        <h3 style={{margin:0, fontWeight: '900', color: '#1e293b'}}>Papan Informasi</h3>
                    </div>

                    <div style={styles.announceList}>
                        {announcements.length === 0 ? (
                            <div style={{textAlign:'center', padding:'40px 0', opacity: 0.5}}>
                                <p style={{fontSize: 13}}>Belum ada pengumuman resmi.</p>
                            </div>
                        ) : (
                            announcements.map(p => (
                                <div key={p.id} style={styles.posterItem}>
                                    <div style={styles.imgWrapper}>
                                        <img 
                                            src={p.imageUrl} 
                                            style={{...styles.posterImg, objectPosition: p.imgPosition || 'center'}} 
                                            alt="announcement" 
                                        />
                                        <div style={styles.imgOverlay}>
                                            <button onClick={() => window.open(p.originalUrl || p.imageUrl, '_blank')} style={styles.btnExpand}><Eye size={16}/></button>
                                        </div>
                                    </div>
                                    <div style={styles.posterDetail}>
                                        <div style={styles.posterMeta}>Official Announcement</div>
                                        <h4 style={styles.posterTitle}>{p.title}</h4>
                                        <p style={styles.posterDesc}>{p.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
      </div>

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
  banner: { 
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
    padding: '35px', borderRadius: '24px', color: 'white', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: '30px', width: '100%', boxSizing: 'border-box',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
  },
  badgeTop: { background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '4px 12px', borderRadius: '50px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', display: 'inline-block', border: '1px solid rgba(99, 102, 241, 0.3)' },
  title: { margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: '900', letterSpacing: '-0.5px' },
  subtitle: { opacity: 0.8, fontSize: '14px', marginTop: 5 },
  statsRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  miniStat: { background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' },
  lottieBox: { background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: 10 },

  mainCard: { padding: '25px', borderRadius: '24px' },
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
  btnAction: { background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '900', fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' },

  shortcutContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' },
  shortBtn: { background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '1px solid #f1f5f9' },
  iconCircle: { width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  announceCard: { padding: '25px', borderRadius: '24px', background: '#fff' },
  announceList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  posterItem: { borderRadius: '20px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #f1f5f9' },
  imgWrapper: { position: 'relative', width: '100%', height: '160px', overflow: 'hidden' },
  posterImg: { width: '100%', height: '100%', objectFit: 'cover' },
  imgOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.3s' },
  btnExpand: { background: 'white', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: '#1e293b' },
  posterDetail: { padding: '15px' },
  posterMeta: { fontSize: 10, fontWeight: '800', color: '#e11d48', textTransform: 'uppercase', marginBottom: 5 },
  posterTitle: { margin: '0 0 8px 0', fontSize: 15, fontWeight: '900', color: '#1e293b' },
  posterDesc: { margin: 0, fontSize: 12, color: '#64748b', lineHeight: '1.5' },

  emptyBox: { padding: '50px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(10px)' },
  modal: { width: '90%', maxWidth: '360px', textAlign: 'center', padding: '35px' },
  inputCode: { width: '100%', padding: '18px', fontSize: '28px', textAlign: 'center', borderRadius: '15px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '900', letterSpacing: '4px', color: '#1e293b', background: '#f8fafc' },
  btnConfirm: { flex: 2, padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }
};

export default TeacherDashboard;