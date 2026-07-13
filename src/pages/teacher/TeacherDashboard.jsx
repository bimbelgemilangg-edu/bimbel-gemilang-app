// src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  collection, query, where, getDocs, doc, getDoc, 
  orderBy, serverTimestamp, limit, onSnapshot, updateDoc
} from "firebase/firestore";
import { 
  Clock, Users, BookOpen, Star, ArrowRight, 
  Calendar, Layout, MapPin, X, ChevronRight, 
  TrendingUp, Award, UserCheck, Megaphone, 
  Home, LogOut, Settings, Bell, Sparkles, 
  ChevronDown, Menu, Sun, Moon, Gift, Crown,
  Zap, Flame, Target, Layers, FileText, Send,
  CheckCircle, AlertCircle, MessageCircle, Phone,
  Video, ExternalLink, Copy, Hash, Tag, Link2,
  CalendarDays, Clock4, User, GraduationCap,
  Briefcase, BarChart3, Activity, PieChart,
  RefreshCw, Loader2, Eye, EyeOff
} from 'lucide-react';
import LogoGemilang from '../../components/LogoGemilang';

// ============================================================
// MAIN COMPONENT
// ============================================================
const TeacherDashboard = () => {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [guru, setGuru] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [pendingSchedule, setPendingSchedule] = useState(null);
  const [dailyCode, setDailyCode] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    todaySessions: 0,
    weekSessions: 0,
    totalStudents: 0,
    attendanceRate: 0,
    totalClasses: 0,
    completedClasses: 0
  });
  const [greeting, setGreeting] = useState('');
  
  // ===== REFS =====
  const notificationRef = useRef(null);

  // ===== EFFECTS =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi 🌅');
    else if (hour < 15) setGreeting('Selamat Siang ☀️');
    else if (hour < 19) setGreeting('Selamat Sore 🌤️');
    else setGreeting('Selamat Malam 🌙');
  }, []);

  // Click outside notification
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== FETCH FUNCTIONS =====
  const fetchTeacherProfile = useCallback(async () => {
    try {
      const saved = JSON.parse(localStorage.getItem('teacherData'));
      if (!saved) {
        navigate('/login-guru');
        return null;
      }
      
      try {
        const teacherQuery = query(
          collection(db, "teachers"),
          where("email", "==", saved.email)
        );
        const snap = await getDocs(teacherQuery);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const fullData = { ...saved, ...data, id: snap.docs[0].id };
          setGuru(fullData);
          return fullData;
        }
      } catch (e) {
        console.log("Using cached teacher data");
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
      const today = new Date();
      
      const teacherName = teacher.nama.trim();
      const teacherId = teacher.guruId || teacher.id || teacherName;
      
      // ===== JADWAL HARI INI =====
      const qJadwal = query(
        collection(db, "jadwal_bimbel"),
        where("teacherName", "==", teacherName)
      );
      const snapJadwal = await getDocs(qJadwal);
      const allSchedules = snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const todayScheds = allSchedules
        .filter(s => s.dateStr === todayStr)
        .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
      setTodaySchedules(todayScheds);
      
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 7);
      const futureStr = futureDate.toISOString().split('T')[0];
      
      const upcoming = allSchedules
        .filter(s => s.dateStr > todayStr && s.dateStr <= futureStr)
        .sort((a, b) => (a.dateStr || '').localeCompare(b.dateStr || ''));
      setUpcomingSchedules(upcoming);
      
      // ===== STATISTIK =====
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      
      const weekSchedules = allSchedules.filter(s => 
        s.dateStr >= weekAgoStr && s.dateStr <= todayStr
      );
      
      const allStudents = new Set();
      allSchedules.forEach(s => {
        if (s.students) {
          s.students.forEach(st => {
            const id = st.studentId || st.id || st;
            if (id) allStudents.add(id);
          });
        }
      });
      
      // ===== AMBIL DAILY CODE =====
      try {
        const codeDoc = await getDoc(doc(db, "settings", 'daily_code_' + todayStr));
        if (codeDoc.exists()) {
          setDailyCode(codeDoc.data().code || '');
        } else {
          setDailyCode('');
        }
      } catch (e) {
        setDailyCode('');
      }
      
      // ===== ATTENDANCE RATE =====
      const qLogs = query(
        collection(db, "teacher_logs"),
        where("teacherId", "==", teacherId),
        orderBy("tanggal", "desc"),
        limit(30)
      );
      const snapLogs = await getDocs(qLogs);
      const logs = snapLogs.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let attendanceRate = 0;
      if (logs.length > 0) {
        const totalHadir = logs.reduce((acc, l) => acc + (l.siswaHadir || 0), 0);
        const totalSiswa = logs.reduce((acc, l) => acc + (l.siswa_total || l.siswaHadir || 0), 0);
        attendanceRate = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;
      }
      
      setStats({
        todaySessions: todayScheds.length,
        weekSessions: weekSchedules.length,
        totalStudents: allStudents.size || 0,
        attendanceRate,
        totalClasses: allSchedules.length,
        completedClasses: allSchedules.filter(s => s.status === 'completed').length
      });
      
      // ===== ANNOUNCEMENTS =====
      const qAnnounce = query(
        collection(db, "student_contents"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const snapAnnounce = await getDocs(qAnnounce);
      const annData = snapAnnounce.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnnouncements(
        annData.filter(p => p.targetPortal === "Guru" || p.targetPortal === "Semua" || !p.targetPortal)
      );
      
      // ===== NOTIFICATIONS =====
      const qNotif = query(
        collection(db, "notifications"),
        where("userId", "==", teacherId),
        where("userType", "==", "teacher"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const snapNotif = await getDocs(qNotif);
      const notifData = snapNotif.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(notifData);
      
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ===== MAIN EFFECT =====
  useEffect(() => {
    const init = async () => {
      const teacher = await fetchTeacherProfile();
      if (teacher) {
        await fetchData(teacher);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, "jadwal_bimbel"),
          where("teacherName", "==", teacher.nama.trim()),
          where("dateStr", "==", todayStr)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          data.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
          setTodaySchedules(data);
        }, (error) => {
          console.error("Real-time error:", error);
        });
        
        return () => unsubscribe();
      }
    };
    init();
  }, [fetchTeacherProfile, fetchData]);

  // ===== HANDLERS =====
  const handleRefresh = async () => {
    setRefreshing(true);
    const teacher = await fetchTeacherProfile();
    if (teacher) await fetchData(teacher);
  };

  // 🔥 FUNGSI VERIFIKASI TOKEN DENGAN ROUTING
  const handleVerifyTokenAndStart = async () => {
    if (!pendingSchedule) return;
    if (!inputToken) {
      alert("⚠️ Masukkan kode absensi terlebih dahulu!");
      return;
    }
    
    if (inputToken.trim().toUpperCase() !== dailyCode.trim().toUpperCase()) {
      alert("⚠️ Token absensi salah! Silakan periksa kembali atau hubungi admin.");
      setInputToken("");
      return;
    }

    try {
      await updateDoc(doc(db, "jadwal_bimbel", pendingSchedule.id), {
        status: 'ongoing',
        startedAt: serverTimestamp()
      });

      setShowStartModal(false);
      setInputToken("");
      
      // 🔥 PINDAH KE HALAMAN ATTENDANCE DENGAN ROUTING
      navigate('/guru/attendance/' + pendingSchedule.id);
      
    } catch (error) {
      console.error("Gagal memulai kelas:", error);
      alert("❌ Terjadi kesalahan sistem saat membuka kelas.");
    }
  };

  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar?')) {
      localStorage.removeItem('teacherData');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      navigate('/login-guru');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return '#10b981';
    if (status === 'in-progress') return '#f59e0b';
    if (status === 'scheduled') return '#3b82f6';
    return '#94a3b8';
  };

  const getStatusText = (status) => {
    if (status === 'completed') return 'Selesai ✅';
    if (status === 'in-progress') return 'Berlangsung 🟡';
    if (status === 'scheduled') return 'Terjadwal 🔵';
    return 'Belum Dimulai';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return parseInt(parts[2]) + ' ' + months[parseInt(parts[1]) - 1] + ' ' + parts[0];
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <LogoGemilang size="medium" variant="default" showText={true} />
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      {/* ===== HEADER ===== */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <LogoGemilang size="small" variant="default" />
          <span style={styles.headerVersion}>v2.0</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.greeting}>{greeting}</span>
          
          <div style={styles.notifWrapper} ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              style={styles.notifBtn}
            >
              <Bell size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={styles.notifDot}>{notifications.filter(n => !n.read).length}</span>
              )}
            </button>
            {showNotifications && (
              <div style={styles.notifDropdown}>
                <div style={styles.notifHeader}>
                  <span style={styles.notifTitle}>Notifikasi</span>
                  <button style={styles.notifMarkAll}>Tandai semua</button>
                </div>
                {notifications.length === 0 ? (
                  <div style={styles.notifEmpty}>Tidak ada notifikasi</div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={n.id || i} style={styles.notifItem(!n.read)}>
                      <div style={styles.notifIcon}>
                        {n.type === 'modul_baru' ? <BookOpen size={12} /> : <Bell size={12} />}
                      </div>
                      <div style={styles.notifContent}>
                        <div style={styles.notifMsg}>{n.message || n.title}</div>
                        <div style={styles.notifTime}>
                          {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleDateString('id-ID') : 'Baru'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          <button onClick={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          
          <div style={styles.avatar} onClick={() => navigate('/guru/profile')}>
            {getInitials(guru?.nama)}
          </div>
          
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ===== BANNER ===== */}
      <div style={styles.banner}>
        <div style={styles.bannerLeft}>
          <div style={styles.bannerBadge}>
            <Sparkles size={12} /> Welcome
          </div>
          <h1 style={styles.bannerTitle}>
            Assalamu'alaikum, {guru?.nama?.split(' ')[0] || 'Guru'}! 👋
          </h1>
          <p style={styles.bannerSub}>
            {guru?.mapel ? 'Pengajar ' + guru.mapel : 'Pengajar Bimbel Gemilang'}
            {guru?.guruId && <span style={styles.bannerId}> • <Hash size={10} /> {guru.guruId}</span>}
          </p>
          <div style={styles.bannerTags}>
            <span style={styles.bannerTag}>
              <Calendar size={12} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span style={styles.bannerTag}>
              <Clock size={12} /> {todaySchedules.length} sesi hari ini
            </span>
            <span style={styles.bannerTag}>
              <Users size={12} /> {stats.totalStudents} siswa
            </span>
          </div>
        </div>
        <div style={styles.bannerRight}>
          <div style={styles.bannerLogo}>
            <LogoGemilang size="large" variant="dark" showText={false} />
          </div>
          <div style={styles.bannerProgress}>
            <div style={styles.bannerProgressLabel}>
              <span>Kehadiran</span>
              <span style={styles.bannerProgressValue}>{stats.attendanceRate}%</span>
            </div>
            <div style={styles.bannerProgressBar}>
              <div style={{...styles.bannerProgressFill, width: stats.attendanceRate + '%'}} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon('primary')}>
            <Calendar size={20} color="#3b82f6" />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.todaySessions}</div>
            <div style={styles.statLabel}>Sesi Hari Ini</div>
          </div>
          <div style={styles.statTrend('up')}>
            <TrendingUp size={12} /> +{stats.weekSessions}
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon('success')}>
            <Users size={20} color="#10b981" />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.totalStudents}</div>
            <div style={styles.statLabel}>Total Siswa</div>
          </div>
          <div style={styles.statTrend('neutral')}>
            <User size={12} /> Aktif
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon('warning')}>
            <BookOpen size={20} color="#f59e0b" />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.totalClasses}</div>
            <div style={styles.statLabel}>Total Kelas</div>
          </div>
          <div style={styles.statTrend('up')}>
            <CheckCircle size={12} /> {stats.completedClasses} selesai
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon('purple')}>
            <Award size={20} color="#8b5cf6" />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.attendanceRate}%</div>
            <div style={styles.statLabel}>Kehadiran</div>
          </div>
          <div style={styles.statTrend(stats.attendanceRate > 70 ? 'up' : 'down')}>
            {stats.attendanceRate > 70 ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{transform: 'rotate(180deg)'}} />}
            {stats.attendanceRate}%
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={styles.mainGrid(isMobile)}>
        
        {/* ===== LEFT: SCHEDULES ===== */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <Layout size={16} /> Jadwal Mengajar
            </h3>
            <div style={styles.sectionActions}>
              <button onClick={() => navigate('/guru/schedule')} style={styles.seeAllBtn}>
                Lihat Semua <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Today's Schedules */}
          <div style={styles.scheduleSubHeader}>
            <span style={styles.scheduleSubTitle}>📅 Hari Ini</span>
            <span style={styles.scheduleCount}>{todaySchedules.length} sesi</span>
          </div>
          
          {todaySchedules.length === 0 ? (
            <div style={styles.emptyState}>
              <Calendar size={32} color="#cbd5e1" />
              <p style={styles.emptyText}>Tidak ada jadwal hari ini</p>
              <p style={styles.emptySub}>Istirahat atau persiapan materi 📚</p>
            </div>
          ) : (
            <div style={styles.scheduleList}>
              {todaySchedules.slice(0, 5).map(item => {
                const isCompleted = item.status === 'completed';
                const isOngoing = item.status === 'ongoing';
                const isScheduled = item.status === 'scheduled' || !item.status;
                
                let btnText = 'Mulai Kelas';
                let btnBg = '#3b82f6';
                let disabled = false;
                
                if (isCompleted) {
                  btnText = '✓ Selesai';
                  btnBg = '#10b981';
                  disabled = true;
                } else if (isOngoing) {
                  btnText = '🔄 Berlangsung';
                  btnBg = '#f59e0b';
                  disabled = true;
                }
                
                return (
                  <div key={item.id} style={styles.scheduleCard}>
                    <div style={styles.scheduleTime}>
                      <span style={styles.scheduleTimeText}>{item.start}</span>
                      <span style={styles.scheduleTimeEnd}>- {item.end}</span>
                    </div>
                    <div style={styles.scheduleContent}>
                      <div style={styles.scheduleTitle}>
                        {item.title || 'Materi Umum'}
                        {item.mapelId && (
                          <span style={styles.scheduleMapelId}>
                            <Tag size={10} /> {item.mapelId}
                          </span>
                        )}
                      </div>
                      <div style={styles.scheduleMeta}>
                        <span><MapPin size={10} /> {item.planet || 'Ruang'}</span>
                        <span><Users size={10} /> {item.students?.length || 0} siswa</span>
                        <span style={styles.programBadge(item.program)}>
                          {item.program || 'Reguler'}
                        </span>
                        {item.teacherId && (
                          <span style={styles.teacherIdBadge}>
                            <Hash size={8} /> {item.teacherId}
                          </span>
                        )}
                      </div>
                      {item.students && item.students.length > 0 && (
                        <div style={styles.studentPreview}>
                          {item.students.slice(0, 3).map((s, i) => (
                            <span key={i} style={styles.studentChip}>
                              {s.nama?.split(' ')[0] || 'Siswa'}
                            </span>
                          ))}
                          {item.students.length > 3 && (
                            <span style={styles.studentMore}>+{item.students.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        if (!isCompleted && !isOngoing) {
                          setPendingSchedule(item);
                          setShowStartModal(true);
                          setInputToken("");
                        }
                      }}
                      style={{
                        background: btnBg,
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: disabled ? 0.7 : 1,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      disabled={disabled}
                    >
                      {btnText} <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming Schedules */}
          {upcomingSchedules.length > 0 && (
            <div style={styles.upcomingSection}>
              <div style={styles.scheduleSubHeader}>
                <span style={styles.scheduleSubTitle}>📆 7 Hari Ke Depan</span>
                <span style={styles.scheduleCount}>{upcomingSchedules.length} sesi</span>
              </div>
              <div style={styles.upcomingList}>
                {upcomingSchedules.slice(0, 3).map(item => (
                  <div key={item.id} style={styles.upcomingCard}>
                    <span style={styles.upcomingDate}>{formatDate(item.dateStr)}</span>
                    <span style={styles.upcomingTime}>{item.start}</span>
                    <span style={styles.upcomingTitle}>{item.title || 'Materi'}</span>
                    <span style={styles.upcomingTeacher}>{item.teacherName || item.booker}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT: QUICK ACTIONS & INFO ===== */}
        <div style={styles.rightCol}>
          
          {/* Quick Actions */}
          <div style={styles.quickActionsCard}>
            <h4 style={styles.quickActionsTitle}>⚡ Akses Cepat</h4>
            <div style={styles.quickActionsGrid}>
              <button onClick={() => navigate('/guru/attendance')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#e0e7ff', color: '#4338ca'}}>
                  <UserCheck size={18} />
                </div>
                <span style={styles.quickLabel}>Klaim Absen</span>
                <span style={styles.quickDesc}>Catat kehadiran</span>
              </button>
              
              <button onClick={() => navigate('/guru/history')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#fef3c7', color: '#b45309'}}>
                  <Clock4 size={18} />
                </div>
                <span style={styles.quickLabel}>Riwayat</span>
                <span style={styles.quickDesc}>Lihat histori</span>
              </button>
              
              <button onClick={() => navigate('/guru/modul')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#d1fae5', color: '#059669'}}>
                  <Layers size={18} />
                </div>
                <span style={styles.quickLabel}>E-Learning</span>
                <span style={styles.quickDesc}>Materi & tugas</span>
              </button>
              
              <button onClick={() => navigate('/guru/profile')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#fce7f3', color: '#be185d'}}>
                  <User size={18} />
                </div>
                <span style={styles.quickLabel}>Profil</span>
                <span style={styles.quickDesc}>Data diri</span>
              </button>

              <button onClick={() => navigate('/guru/grades/input')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#ede9fe', color: '#6d28d9'}}>
                  <GraduationCap size={18} />
                </div>
                <span style={styles.quickLabel}>Nilai</span>
                <span style={styles.quickDesc}>Input nilai</span>
              </button>

              <button onClick={() => navigate('/guru/modul/tugas')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#fef2f2', color: '#dc2626'}}>
                  <Send size={18} />
                </div>
                <span style={styles.quickLabel}>Tugas</span>
                <span style={styles.quickDesc}>Kelola tugas</span>
              </button>
            </div>
          </div>

          {/* Teacher Info Card */}
          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <User size={16} color="#652D90" />
              <h4 style={styles.infoTitle}>Profil Guru</h4>
            </div>
            <div style={styles.teacherInfo}>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>Nama</span>
                <span style={styles.teacherInfoValue}>{guru?.nama || '-'}</span>
              </div>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>ID Guru</span>
                <span style={styles.teacherInfoValue}>
                  <Hash size={12} /> {guru?.guruId || 'Belum ada ID'}
                </span>
              </div>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>Mapel</span>
                <span style={styles.teacherInfoValue}>
                  <BookOpen size={12} /> {guru?.mapel || '-'}
                  {guru?.kodeMapel && <span style={styles.mapelIdTag}> {guru.kodeMapel}</span>}
                </span>
              </div>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>Status</span>
                <span style={styles.teacherInfoValue}>
                  <span style={styles.statusActive}>{guru?.status || 'Aktif'}</span>
                </span>
              </div>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>Email</span>
                <span style={styles.teacherInfoValue}>{guru?.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div style={styles.announceCard}>
              <div style={styles.infoHeader}>
                <Megaphone size={16} color="#e11d48" />
                <h4 style={styles.infoTitle}>Pengumuman</h4>
              </div>
              {announcements.slice(0, 3).map(p => (
                <div key={p.id} style={styles.announceItem} onClick={() => setSelectedNews(p)}>
                  {p.imageUrl && (
                    <img src={p.imageUrl} style={styles.announceImage} alt="" />
                  )}
                  <div style={styles.announceContent}>
                    <div style={styles.announceTitle}>{p.title}</div>
                    <div style={styles.announceDate}>
                      {p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString('id-ID') : ''}
                    </div>
                  </div>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <LogoGemilang size="small" variant="default" showText={true} />
          <div style={styles.footerLinks}>
            <a href="/" style={styles.footerLink}>Home</a>
            <a href="/guru/modul" style={styles.footerLink}>E-Learning</a>
            <a href="/guru/schedule" style={styles.footerLink}>Jadwal</a>
            <a href="/guru/grades/input" style={styles.footerLink}>Nilai</a>
          </div>
          <div style={styles.socialLinks}>
            <a href="https://instagram.com/bimbelgemilangs" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              <span style={styles.socialIcon}>📸</span>
            </a>
            <a href="https://tiktok.com/@bimbelgemilang" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              <span style={styles.socialIcon}>🎵</span>
            </a>
            <a href="https://youtube.com/@bimbelgemilang" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              <span style={styles.socialIcon}>▶️</span>
            </a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Bimbel Gemilang. All rights reserved.</span>
          <span style={styles.footerVersion}>Versi 2.0</span>
        </div>
      </div>

      {/* ===== MODAL: NEWS DETAIL ===== */}
      {selectedNews && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNews(null)} style={styles.modalClose}>
              <X size={18} />
            </button>
            {selectedNews.imageUrl && (
              <img src={selectedNews.imageUrl} style={styles.modalImage} alt="" />
            )}
            <div style={styles.modalBody}>
              <span style={styles.modalTag}>📢 Pengumuman</span>
              <h2 style={styles.modalTitle}>{selectedNews.title}</h2>
              <p style={styles.modalText}>{selectedNews.content}</p>
              {selectedNews.createdAt?.toDate && (
                <div style={styles.modalDate}>
                  {new Date(selectedNews.createdAt.toDate()).toLocaleDateString('id-ID', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: KODE ABSENSI ===== */}
      {showStartModal && (
        <div style={styles.modalOverlay} onClick={() => setShowStartModal(false)}>
          <div style={styles.modalCode} onClick={e => e.stopPropagation()}>
            <div style={styles.modalCodeIcon}>🔐</div>
            <h3 style={styles.modalCodeTitle}>Otentikasi Kelas</h3>
            <p style={styles.modalCodeSub}>
              Masukkan kode absensi harian untuk memulai sesi.
            </p>
            <input 
              type="text" 
              value={inputToken} 
              onChange={e => setInputToken(e.target.value.toUpperCase())} 
              style={styles.modalCodeInput} 
              placeholder="KODE ABSEN" 
              maxLength={6} 
              autoFocus
            />
            <div style={styles.modalCodeHint}>
              <Clock size={12} /> Kode berlaku hari ini
            </div>
            <div style={styles.modalCodeActions}>
              <button onClick={() => setShowStartModal(false)} style={styles.modalCodeCancel}>
                BATAL
              </button>
              <button onClick={handleVerifyTokenAndStart} style={styles.modalCodeSubmit}>
                <Zap size={14} /> VERIFIKASI
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
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 16px 32px',
    width: '100%',
    boxSizing: 'border-box',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '70vh',
    gap: 16,
    background: '#f8fafc'
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #652D90',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#94a3b8', fontSize: 13, fontWeight: 500 },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: '10px 16px',
    background: 'white',
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerVersion: {
    fontSize: 8,
    fontWeight: 700,
    color: '#94a3b8',
    background: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: 4,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  greeting: { fontSize: 12, color: '#64748b', fontWeight: 500 },
  
  notifWrapper: { position: 'relative' },
  notifBtn: {
    position: 'relative',
    background: '#f1f5f9',
    border: 'none',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    background: '#ef4444',
    color: 'white',
    fontSize: 8,
    fontWeight: 700,
    width: 16,
    height: 16,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 320,
    maxHeight: 400,
    overflowY: 'auto',
    background: 'white',
    borderRadius: 14,
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    border: '1px solid #f1f5f9',
    zIndex: 100,
    padding: 8,
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #f1f5f9',
  },
  notifTitle: { fontWeight: 700, fontSize: 13, color: '#1e293b' },
  notifMarkAll: { fontSize: 10, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' },
  notifEmpty: { padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 12 },
  notifItem: (unread) => ({
    display: 'flex',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    background: unread ? '#eff6ff' : 'transparent',
    borderBottom: '1px solid #f1f5f9',
    transition: '0.2s',
    cursor: 'pointer',
  }),
  notifIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#3b82f6',
  },
  notifContent: { flex: 1 },
  notifMsg: { fontSize: 12, color: '#1e293b' },
  notifTime: { fontSize: 9, color: '#94a3b8', marginTop: 2 },

  refreshBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #652D90, #8b5cf6)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(101,45,144,0.3)',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    padding: '6px 8px',
    cursor: 'pointer',
    color: '#94a3b8',
    borderRadius: 8,
    transition: '0.2s',
  },

  banner: {
    background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)',
    padding: '20px 24px',
    borderRadius: 16,
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
    boxShadow: '0 4px 20px rgba(26,35,126,0.3)',
  },
  bannerLeft: { flex: 1 },
  bannerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(255,255,255,0.15)',
    padding: '2px 10px',
    borderRadius: 16,
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 4,
  },
  bannerTitle: { margin: '4px 0', fontSize: 22, fontWeight: 800 },
  bannerSub: { margin: '2px 0 10px', fontSize: 13, opacity: 0.85 },
  bannerId: { fontSize: 11, opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 2 },
  bannerTags: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  bannerTag: {
    background: 'rgba(255,255,255,0.12)',
    padding: '3px 12px',
    borderRadius: 16,
    fontSize: 10,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  bannerRight: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  bannerLogo: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerProgress: { width: 160 },
  bannerProgressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.8, marginBottom: 2 },
  bannerProgressValue: { fontWeight: 700 },
  bannerProgressBar: { height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  bannerProgressFill: { height: '100%', background: 'linear-gradient(90deg, #fbbf24, #10b981)', borderRadius: 2, transition: 'width 0.8s ease' },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    background: 'white',
    padding: '14px 16px',
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  statIcon: (color) => ({
    width: 40,
    height: 40,
    borderRadius: 12,
    background: color === 'primary' ? '#eff6ff' : color === 'success' ? '#ecfdf5' : color === 'warning' ? '#fffbeb' : '#f5f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  statInfo: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 500 },
  statTrend: (direction) => ({
    fontSize: 9,
    fontWeight: 600,
    color: direction === 'up' ? '#10b981' : direction === 'down' ? '#ef4444' : '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 8px',
    borderRadius: 8,
    background: direction === 'up' ? '#ecfdf5' : direction === 'down' ? '#fef2f2' : '#f1f5f9',
  }),

  mainGrid: (m) => ({
    display: 'grid',
    gridTemplateColumns: m ? '1fr' : '1.6fr 1fr',
    gap: 16,
    marginBottom: 20,
  }),
  rightCol: { display: 'flex', flexDirection: 'column', gap: 14 },

  section: { 
    background: 'white', 
    padding: 16, 
    borderRadius: 14, 
    border: '1px solid #f1f5f9', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
  },
  sectionHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  sectionTitle: { 
    margin: 0, 
    fontSize: 14, 
    fontWeight: 800, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    color: '#1e293b' 
  },
  sectionActions: { display: 'flex', gap: 6 },
  seeAllBtn: {
    background: 'none',
    border: 'none',
    color: '#652D90',
    fontWeight: 600,
    fontSize: 11,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  scheduleSubHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  scheduleSubTitle: { fontSize: 12, fontWeight: 600, color: '#64748b' },
  scheduleCount: { 
    fontSize: 10, 
    color: '#94a3b8', 
    background: '#f1f5f9', 
    padding: '2px 8px', 
    borderRadius: 10 
  },

  scheduleList: { display: 'flex', flexDirection: 'column', gap: 8 },
  scheduleCard: {
    background: '#f8fafc',
    padding: '12px 14px',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    border: '1px solid #f1f5f9',
    transition: '0.2s',
  },
  scheduleTime: { minWidth: 60, flexShrink: 0 },
  scheduleTimeText: { fontWeight: 800, fontSize: 13, color: '#1e293b' },
  scheduleTimeEnd: { fontSize: 10, color: '#94a3b8' },
  scheduleContent: { flex: 1, minWidth: 120 },
  scheduleTitle: { 
    fontWeight: 700, 
    fontSize: 13, 
    color: '#1e293b', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    flexWrap: 'wrap' 
  },
  scheduleMapelId: { 
    fontSize: 8, 
    color: '#8b5cf6', 
    background: '#ede9fe', 
    padding: '1px 6px', 
    borderRadius: 4, 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: 2 
  },
  scheduleMeta: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 2, 
    fontSize: 10, 
    color: '#64748b', 
    flexWrap: 'wrap' 
  },
  programBadge: (p) => ({
    fontSize: 8,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 12,
    background: p === 'English' ? '#fef3c7' : '#dbeafe',
    color: p === 'English' ? '#b45309' : '#2563eb',
  }),
  teacherIdBadge: {
    fontSize: 8,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 4,
    background: '#f1f5f9',
    color: '#64748b',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
  },
  studentPreview: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  studentChip: {
    background: '#e0e7ff',
    color: '#3730a3',
    padding: '1px 8px',
    borderRadius: 10,
    fontSize: 9,
    fontWeight: 600,
  },
  studentMore: { fontSize: 9, color: '#94a3b8' },

  emptyState: { textAlign: 'center', padding: '30px 12px', color: '#94a3b8' },
  emptyText: { fontSize: 13, fontWeight: 600, margin: '8px 0 2px', color: '#64748b' },
  emptySub: { fontSize: 11, margin: 0 },

  upcomingSection: { marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' },
  upcomingList: { display: 'flex', flexDirection: 'column', gap: 6 },
  upcomingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: 8,
    fontSize: 11,
    flexWrap: 'wrap',
  },
  upcomingDate: { fontWeight: 600, color: '#1e293b', minWidth: 70 },
  upcomingTime: { color: '#3b82f6', fontWeight: 600 },
  upcomingTitle: { color: '#64748b', flex: 1 },
  upcomingTeacher: { fontSize: 10, color: '#94a3b8' },

  quickActionsCard: {
    background: 'white',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  quickActionsTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b' },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  quickAction: {
    background: '#f8fafc',
    padding: '10px 8px',
    borderRadius: 10,
    border: '1px solid #f1f5f9',
    textAlign: 'center',
    cursor: 'pointer',
    transition: '0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    fontFamily: 'inherit',
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickLabel: { fontSize: 10, fontWeight: 700, color: '#1e293b' },
  quickDesc: { fontSize: 8, color: '#94a3b8' },

  infoCard: {
    background: 'white',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  infoHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoTitle: { margin: 0, fontWeight: 700, fontSize: 13, color: '#1e293b' },
  teacherInfo: { display: 'flex', flexDirection: 'column', gap: 6 },
  teacherInfoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '2px 0' },
  teacherInfoLabel: { color: '#94a3b8' },
  teacherInfoValue: { fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 },
  mapelIdTag: { fontSize: 8, color: '#8b5cf6', background: '#ede9fe', padding: '1px 6px', borderRadius: 4 },
  statusActive: { color: '#10b981', background: '#dcfce7', padding: '1px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700 },

  announceCard: {
    background: 'white',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  announceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    cursor: 'pointer',
    borderRadius: 10,
    border: '1px solid #f1f5f9',
    marginBottom: 6,
    transition: '0.2s',
  },
  announceImage: { width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 },
  announceContent: { flex: 1 },
  announceTitle: { fontSize: 11, fontWeight: 600, color: '#1e293b' },
  announceDate: { fontSize: 8, color: '#94a3b8', marginTop: 2 },

  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid #f1f5f9',
  },
  footerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerLinks: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  footerLink: { color: '#64748b', textDecoration: 'none', fontSize: 11, fontWeight: 500 },
  socialLinks: { display: 'flex', gap: 8 },
  socialLink: {
    color: '#1e293b',
    textDecoration: 'none',
    fontSize: 16,
    padding: '4px 8px',
    background: '#f8fafc',
    borderRadius: 8,
    transition: '0.2s',
  },
  socialIcon: { fontSize: 16 },
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
    padding: '2px 10px',
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
    backdropFilter: 'blur(4px)',
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
    animation: 'fadeInUp 0.3s ease',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(255,255,255,0.95)',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    cursor: 'pointer',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  modalImage: { width: '100%', maxHeight: 200, objectFit: 'cover' },
  modalBody: { padding: 20 },
  modalTag: { fontSize: 9, color: '#652D90', fontWeight: 800, textTransform: 'uppercase' },
  modalTitle: { margin: '4px 0 8px', fontSize: 18, fontWeight: 900, color: '#1e293b' },
  modalText: { fontSize: 13, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  modalDate: { marginTop: 12, fontSize: 10, color: '#94a3b8' },

  modalCode: {
    background: 'white',
    padding: 28,
    borderRadius: 20,
    width: '90%',
    maxWidth: 340,
    textAlign: 'center',
    animation: 'fadeInUp 0.3s ease',
  },
  modalCodeIcon: { fontSize: 40, marginBottom: 8 },
  modalCodeTitle: { margin: '0 0 4px', fontWeight: 900, fontSize: 18, color: '#1e293b' },
  modalCodeSub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  modalCodeInput: {
    width: '100%',
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    outline: 'none',
    fontWeight: 900,
    letterSpacing: 4,
    background: '#f8fafc',
    transition: '0.2s',
  },
  modalCodeHint: { fontSize: 10, color: '#94a3b8', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  modalCodeActions: { display: 'flex', gap: 8, marginTop: 16 },
  modalCodeCancel: {
    flex: 1,
    padding: 10,
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  modalCodeSubmit: {
    flex: 2,
    padding: 10,
    background: 'linear-gradient(135deg, #652D90, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(101,45,144,0.3)',
  },
};

export default TeacherDashboard;