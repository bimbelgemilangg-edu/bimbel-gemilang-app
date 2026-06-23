// src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  collection, query, where, getDocs, doc, getDoc, 
  orderBy, serverTimestamp 
} from "firebase/firestore";
import { 
  Clock, Users, BookOpen, Star, ArrowRight, 
  Calendar, Layout, MapPin, X, ChevronRight, 
  TrendingUp, Award, UserCheck, Megaphone
} from 'lucide-react';
import LogoGemilang from '../../components/LogoGemilang';
import ClassSession from './ClassSession';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  
  // ============================================================
  // STATES
  // ============================================================
  const [guru, setGuru] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [mode, setMode] = useState('dashboard');
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [pendingSchedule, setPendingSchedule] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [announcements, setAnnouncements] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedNews, setSelectedNews] = useState(null);
  const [stats, setStats] = useState({
    todaySessions: 0,
    weekSessions: 0,
    totalStudents: 0,
    attendanceRate: 0,
  });

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => setActiveSlide(prev => (prev + 1) % announcements.length), 5000);
      return () => clearInterval(interval);
    }
  }, [announcements]);

  // ============================================================
  // FETCH FUNCTIONS - FIREBASE
  // ============================================================
  const fetchTeacherProfile = useCallback(async () => {
    try {
      const saved = JSON.parse(localStorage.getItem('teacherData'));
      if (!saved) {
        navigate('/login-guru');
        return null;
      }
      setGuru(saved);
      return saved;
    } catch (e) {
      console.error('Error:', e);
      navigate('/login-guru');
      return null;
    }
  }, [navigate]);

  const fetchData = useCallback(async (teacher) => {
    if (!teacher?.nama) return;
    
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // 🔥 Ambil jadwal hari ini
      const qJadwal = query(
        collection(db, "jadwal_bimbel"),
        where("booker", "==", teacher.nama.trim()),
        where("dateStr", "==", todayStr)
      );
      const snapJadwal = await getDocs(qJadwal);
      const schedules = snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }));
      schedules.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
      setTodaySchedules(schedules);

      // 🔥 Ambil jadwal minggu ini
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const qWeek = query(
        collection(db, "jadwal_bimbel"),
        where("booker", "==", teacher.nama.trim())
      );
      const snapWeek = await getDocs(qWeek);
      const weekSchedules = snapWeek.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.dateStr >= weekAgoStr && s.dateStr <= todayStr);

      // 🔥 Hitung total siswa unik
      const allStudents = new Set();
      schedules.forEach(s => {
        if (s.students) {
          s.students.forEach(st => allStudents.add(st.id || st.studentId || st));
        }
      });

      // 🔥 Ambil attendance rate
      const qLogs = query(
        collection(db, "teacher_logs"),
        where("teacher_id", "==", teacher.id)
      );
      const snapLogs = await getDocs(qLogs);
      const logs = snapLogs.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(l => l.tanggal >= weekAgoStr);

      let attendanceRate = 0;
      if (logs.length > 0) {
        const totalHadir = logs.reduce((acc, l) => acc + (l.siswa_hadir || 0), 0);
        const totalSiswa = logs.reduce((acc, l) => acc + (l.siswa_total || l.siswa_hadir || 0), 0);
        attendanceRate = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;
      }

      setStats({
        todaySessions: schedules.length,
        weekSessions: weekSchedules.length,
        totalStudents: allStudents.size || 0,
        attendanceRate,
      });

      // 🔥 Ambil announcements
      const qAnnounce = query(
        collection(db, "student_contents"),
        orderBy("createdAt", "desc")
      );
      const snapAnnounce = await getDocs(qAnnounce);
      const annData = snapAnnounce.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnnouncements(
        annData.filter(p => p.targetPortal === "Guru" || p.targetPortal === "Semua")
      );

    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // MAIN EFFECT
  // ============================================================
  useEffect(() => {
    const init = async () => {
      const teacher = await fetchTeacherProfile();
      if (teacher) {
        await fetchData(teacher);
      }
    };
    init();
  }, [fetchTeacherProfile, fetchData]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleVerifyAndStart = async () => {
    if (!inputToken) return alert("Masukkan kode absensi!");
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const codeDoc = await getDoc(doc(db, "settings", `daily_code_${todayStr}`));
      
      if (codeDoc.exists() && inputToken.toUpperCase() === codeDoc.data().code) {
        setMode('session');
        setShowStartModal(false);
        setInputToken("");
      } else {
        alert("❌ KODE SALAH!");
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi 🌅';
    if (hour < 15) return 'Selamat Siang ☀️';
    if (hour < 19) return 'Selamat Sore 🌤️';
    return 'Selamat Malam 🌙';
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (mode === 'session') {
    return (
      <ClassSession 
        schedule={pendingSchedule} 
        teacher={guru} 
        onBack={() => { 
          setMode('dashboard'); 
          fetchData(guru); 
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      {/* HEADER DENGAN LOGO */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <LogoGemilang size="small" variant="default" />
        </div>
        <div style={styles.headerRight}>
          <span style={styles.greeting}>{getGreeting()}</span>
          <div style={styles.avatar}>
            {guru?.nama?.charAt(0) || 'G'}
          </div>
        </div>
      </div>

      {/* BANNER */}
      <div style={styles.banner}>
        <div>
          <h1 style={styles.bannerTitle}>
            Assalamu'alaikum, {guru?.nama?.split(' ')[0] || 'Guru'} 👋
          </h1>
          <p style={styles.bannerSub}>Selamat datang di panel pengajar Bimbel Gemilang</p>
          <div style={styles.bannerTags}>
            <span style={styles.bannerTag}>
              <Calendar size={12} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span style={styles.bannerTag}>
              <Clock size={12} /> {todaySchedules.length} sesi hari ini
            </span>
          </div>
        </div>
        <div style={styles.bannerIcon}>
          <LogoGemilang size="large" variant="dark" showText={false} />
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon('primary')}>
            <Calendar size={20} color="#3b82f6" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.todaySessions}</div>
            <div style={styles.statLabel}>Sesi Hari Ini</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon('success')}>
            <BookOpen size={20} color="#10b981" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.weekSessions}</div>
            <div style={styles.statLabel}>Sesi Minggu Ini</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon('warning')}>
            <Users size={20} color="#f59e0b" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalStudents}</div>
            <div style={styles.statLabel}>Total Siswa</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon('purple')}>
            <TrendingUp size={20} color="#8b5cf6" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.attendanceRate}%</div>
            <div style={styles.statLabel}>Tingkat Kehadiran</div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN */}
      <div style={styles.twoColGrid(isMobile)}>
        {/* Left: Schedules */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <Layout size={16} /> Agenda Mengajar
            </h3>
            <button onClick={() => navigate('/guru/schedule')} style={styles.seeAllBtn}>
              Kalender <ArrowRight size={12} />
            </button>
          </div>

          {todaySchedules.length === 0 ? (
            <div style={styles.emptyState}>
              <Calendar size={32} color="#cbd5e1" />
              <p style={styles.emptyText}>Tidak ada jadwal hari ini</p>
              <p style={styles.emptySub}>Istirahat atau persiapan materi</p>
            </div>
          ) : (
            <div style={styles.scheduleList}>
              {todaySchedules.map(item => (
                <div key={item.id} style={styles.scheduleCard}>
                  <div style={styles.scheduleTime}>
                    <span style={styles.scheduleTimeText}>{item.start}</span>
                  </div>
                  <div style={styles.scheduleContent}>
                    <div style={styles.scheduleTitle}>{item.title || 'Materi Umum'}</div>
                    <div style={styles.scheduleMeta}>
                      <span><MapPin size={10} /> {item.planet || 'Ruang'}</span>
                      <span><Users size={10} /> {item.students?.length || 0} siswa</span>
                      <span style={styles.programBadge(item.program)}>
                        {item.program || 'Reguler'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      setPendingSchedule(item); 
                      setShowStartModal(true); 
                    }} 
                    style={styles.startBtn}
                  >
                    MULAI
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div style={styles.rightCol}>
          <div style={styles.quickActionsGrid}>
            <div onClick={() => navigate('/guru/input')} style={styles.quickAction}>
              <div style={{...styles.quickIcon, background: '#e0e7ff', color: '#4338ca'}}>
                <UserCheck size={18} />
              </div>
              <span style={styles.quickLabel}>Klaim Absen</span>
            </div>
            <div onClick={() => navigate('/guru/history')} style={styles.quickAction}>
              <div style={{...styles.quickIcon, background: '#fef3c7', color: '#b45309'}}>
                <Award size={18} />
              </div>
              <span style={styles.quickLabel}>Riwayat</span>
            </div>
            <div onClick={() => navigate('/guru/profile')} style={styles.quickAction}>
              <div style={{...styles.quickIcon, background: '#d1fae5', color: '#059669'}}>
                <Star size={18} />
              </div>
              <span style={styles.quickLabel}>Profil</span>
            </div>
            <div onClick={() => navigate('/guru/modul')} style={styles.quickAction}>
              <div style={{...styles.quickIcon, background: '#fce7f3', color: '#be185d'}}>
                <BookOpen size={18} />
              </div>
              <span style={styles.quickLabel}>E-Learning</span>
            </div>
          </div>

          {/* Info Terbaru */}
          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <Megaphone size={16} color="#e11d48" />
              <h4 style={styles.infoTitle}>Informasi Terbaru</h4>
            </div>
            {announcements.slice(0, 3).map(p => (
              <div key={p.id} style={styles.infoItem} onClick={() => setSelectedNews(p)}>
                <img src={p.imageUrl} style={styles.infoImage} alt="" />
                <div style={styles.infoContent}>
                  <b style={styles.infoItemTitle}>{p.title}</b>
                  <div style={styles.infoDate}>
                    {p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString('id-ID') : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <LogoGemilang size="small" variant="default" showText={true} />
          <div style={styles.socialLinks}>
            <a href="https://instagram.com/bimbelgemilangs" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              <span style={styles.socialIcon}>📸</span> @bimbelgemilangs
            </a>
            <a href="https://tiktok.com/@bimbelgemilang" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              <span style={styles.socialIcon}>🎵</span> @bimbelgemilang
            </a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Bimbel Gemilang</span>
          <span style={styles.footerVersion}>v2.0</span>
        </div>
      </div>

      {/* MODAL BERITA */}
      {selectedNews && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNews(null)} style={styles.modalClose}>
              <X size={18} />
            </button>
            <img src={selectedNews.imageUrl} style={styles.modalImage} alt="" />
            <div style={styles.modalBody}>
              <span style={styles.modalTag}>Official Admin</span>
              <h2 style={styles.modalTitle}>{selectedNews.title}</h2>
              <p style={styles.modalText}>{selectedNews.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KODE ABSENSI */}
      {showStartModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCode} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalCodeTitle}>Otentikasi Kelas</h3>
            <p style={styles.modalCodeSub}>Masukkan kode absensi harian.</p>
            <input 
              type="text" 
              value={inputToken} 
              onChange={e => setInputToken(e.target.value.toUpperCase())} 
              style={styles.modalCodeInput} 
              placeholder="KODE" 
              maxLength={6} 
              autoFocus
            />
            <div style={styles.modalCodeActions}>
              <button onClick={() => setShowStartModal(false)} style={styles.modalCodeCancel}>
                BATAL
              </button>
              <button onClick={handleVerifyAndStart} style={styles.modalCodeSubmit}>
                VERIFIKASI
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '12px 16px 32px',
    width: '100%',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '70vh',
    gap: 12,
  },
  spinner: {
    width: 36,
    height: 36,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #652D90',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: '10px 14px',
    background: 'white',
    borderRadius: 12,
    border: '1px solid #f1f5f9',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 12, color: '#64748b', fontWeight: 500 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: '#652D90',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: 13,
    flexShrink: 0,
  },
  banner: {
    background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)',
    padding: '18px 22px',
    borderRadius: 14,
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  bannerTitle: { margin: 0, fontSize: 20, fontWeight: 800 },
  bannerSub: { margin: '4px 0 10px', fontSize: 12, opacity: 0.8 },
  bannerTags: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  bannerTag: {
    background: 'rgba(255,255,255,0.15)',
    padding: '3px 10px',
    borderRadius: 16,
    fontSize: 10,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  bannerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%',
    padding: 6,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    background: 'white',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: (color) => ({
    width: 36,
    height: 36,
    borderRadius: 10,
    background: color === 'primary' ? '#eff6ff' : color === 'success' ? '#ecfdf5' : color === 'warning' ? '#fffbeb' : '#f5f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  statValue: { fontSize: 18, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 500 },
  twoColGrid: (m) => ({
    display: 'grid',
    gridTemplateColumns: m ? '1fr' : '1.5fr 1fr',
    gap: 16,
    marginBottom: 20,
  }),
  rightCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  section: { background: 'white', padding: 16, borderRadius: 14, border: '1px solid #f1f5f9' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { margin: 0, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 },
  seeAllBtn: {
    background: 'none',
    border: 'none',
    color: '#652D90',
    fontWeight: 600,
    fontSize: 11,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  scheduleList: { display: 'flex', flexDirection: 'column', gap: 8 },
  scheduleCard: {
    background: '#f8fafc',
    padding: '10px 14px',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    border: '1px solid #f1f5f9',
  },
  scheduleTime: { minWidth: 50, flexShrink: 0 },
  scheduleTimeText: { fontWeight: 800, fontSize: 12, color: '#1e293b' },
  scheduleContent: { flex: 1, minWidth: 120 },
  scheduleTitle: { fontWeight: 700, fontSize: 13, color: '#1e293b' },
  scheduleMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    fontSize: 10,
    color: '#64748b',
    flexWrap: 'wrap',
  },
  programBadge: (p) => ({
    fontSize: 8,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 12,
    background: p === 'English' ? '#fef3c7' : '#dbeafe',
    color: p === 'English' ? '#b45309' : '#2563eb',
  }),
  startBtn: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 10,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '24px 12px',
    color: '#94a3b8',
  },
  emptyText: { fontSize: 13, fontWeight: 600, margin: '8px 0 2px', color: '#64748b' },
  emptySub: { fontSize: 11, margin: 0 },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  quickAction: {
    background: 'white',
    padding: '12px',
    borderRadius: 12,
    border: '1px solid #f1f5f9',
    textAlign: 'center',
    cursor: 'pointer',
    transition: '0.2s',
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 6px',
  },
  quickLabel: { fontSize: 11, fontWeight: 600, color: '#1e293b' },
  infoCard: {
    background: 'white',
    padding: 14,
    borderRadius: 12,
    border: '1px solid #f1f5f9',
  },
  infoHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 },
  infoTitle: { margin: 0, fontWeight: 800, fontSize: 13 },
  infoItem: {
    display: 'flex',
    gap: 10,
    padding: 8,
    cursor: 'pointer',
    borderRadius: 8,
    border: '1px solid #f1f5f9',
    marginBottom: 6,
  },
  infoImage: { width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 },
  infoContent: { flex: 1 },
  infoItemTitle: { fontSize: 11 },
  infoDate: { fontSize: 8, color: '#94a3b8', marginTop: 2 },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #f1f5f9',
  },
  footerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialLinks: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  socialLink: {
    color: '#1e293b',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    background: '#f8fafc',
    borderRadius: 8,
  },
  socialIcon: { fontSize: 14 },
  footerBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #f1f5f9',
    fontSize: 10,
    color: '#94a3b8',
  },
  footerVersion: {
    background: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 700,
    color: '#64748b',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modalContent: {
    background: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 480,
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: '50%',
    width: 28,
    height: 28,
    cursor: 'pointer',
    zIndex: 1,
  },
  modalImage: { width: '100%', maxHeight: 200, objectFit: 'cover' },
  modalBody: { padding: 16 },
  modalTag: { fontSize: 8, color: '#652D90', fontWeight: 800, textTransform: 'uppercase' },
  modalTitle: { margin: '4px 0 8px', fontSize: 16, fontWeight: 900 },
  modalText: { fontSize: 13, color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  modalCode: {
    background: 'white',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 320,
    textAlign: 'center',
  },
  modalCodeTitle: { margin: '0 0 4px', fontWeight: 900 },
  modalCodeSub: { fontSize: 11, color: '#64748b', marginBottom: 16 },
  modalCodeInput: {
    width: '100%',
    padding: 12,
    fontSize: 22,
    textAlign: 'center',
    borderRadius: 10,
    border: '2px solid #e2e8f0',
    outline: 'none',
    fontWeight: 900,
  },
  modalCodeActions: { display: 'flex', gap: 8, marginTop: 16 },
  modalCodeCancel: {
    flex: 1,
    padding: 10,
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  modalCodeSubmit: {
    flex: 2,
    padding: 10,
    background: '#652D90',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 12,
    cursor: 'pointer',
  },
};

export default TeacherDashboard;