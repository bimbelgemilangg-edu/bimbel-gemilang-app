// src/pages/guru/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Clock, Users, BookOpen, Star, ArrowRight, Eye, Megaphone, 
  Info, Calendar, Layout, MapPin, X, ChevronRight, Send, 
  TrendingUp, Award, UserCheck 
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

  // Survey states
  const [mandatorySurvey, setMandatorySurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [showSurveyModal, setShowSurveyModal] = useState(false);

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
  // FETCH FUNCTIONS (SUPABASE)
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
      console.error('Error fetching profile:', e);
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
      const { data: schedules, error: schedError } = await supabase
        .from('jadwal_bimbel')
        .select('*')
        .eq('booker', teacher.nama.trim())
        .eq('dateStr', todayStr)
        .order('start', { ascending: true });

      if (schedError) throw schedError;
      
      setTodaySchedules(schedules || []);

      // 🔥 Ambil jadwal minggu ini
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const { data: weekSchedules, error: weekError } = await supabase
        .from('jadwal_bimbel')
        .select('*')
        .eq('booker', teacher.nama.trim())
        .gte('dateStr', weekAgoStr)
        .lte('dateStr', todayStr);

      if (weekError) throw weekError;

      // 🔥 Hitung total siswa unik
      const allStudents = new Set();
      (schedules || []).forEach(s => {
        if (s.students) {
          s.students.forEach(st => allStudents.add(st.id || st.studentId || st));
        }
      });

      // 🔥 Ambil attendance rate (dari teacher_logs)
      const { data: logs, error: logsError } = await supabase
        .from('teacher_logs')
        .select('siswa_hadir, siswa_total')
        .eq('teacher_id', teacher.id)
        .gte('tanggal', weekAgoStr);

      let attendanceRate = 0;
      if (logs && logs.length > 0) {
        const totalHadir = logs.reduce((acc, l) => acc + (l.siswa_hadir || 0), 0);
        const totalSiswa = logs.reduce((acc, l) => acc + (l.siswa_total || l.siswa_hadir || 0), 0);
        attendanceRate = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;
      }

      setStats({
        todaySessions: schedules?.length || 0,
        weekSessions: weekSchedules?.length || 0,
        totalStudents: allStudents.size || 0,
        attendanceRate,
      });

      // 🔥 Ambil announcements
      const { data: annData, error: annError } = await supabase
        .from('student_contents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!annError && annData) {
        setAnnouncements(
          annData.filter(p => p.target_portal === 'Guru' || p.target_portal === 'Semua')
        );
      }

      // 🔥 CEK SURVEI WAJIB
      const { data: surveys, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'aktif')
        .eq('is_required', true);

      if (!surveyError && surveys) {
        const mandatory = surveys.find(s => 
          s.target_type === 'semua_guru' || s.target_type === 'semua'
        );
        
        if (mandatory) {
          const { data: responses, error: respError } = await supabase
            .from('survey_responses')
            .select('*')
            .eq('survey_id', mandatory.id)
            .eq('user_id', teacher.id);

          if (!respError && (!responses || responses.length === 0)) {
            setMandatorySurvey(mandatory);
            setShowSurveyModal(true);
          }
        }
      }

    } catch (e) {
      console.error('Error fetching data:', e);
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
      
      const { data: codeData, error: codeError } = await supabase
        .from('settings')
        .select('code')
        .eq('id', `daily_code_${todayStr}`)
        .single();

      if (codeError) throw codeError;

      if (codeData && inputToken.toUpperCase() === codeData.code) {
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

  const submitSurvey = async () => {
    if (!mandatorySurvey) return;
    
    const unanswered = mandatorySurvey.questions.filter((_, i) => surveyAnswers[i] === undefined);
    if (unanswered.length > 0) {
      return alert(`❌ ${unanswered.length} pertanyaan belum dijawab.`);
    }
    
    try {
      const { error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: mandatorySurvey.id,
          user_id: guru.id,
          user_name: guru.nama,
          answers: mandatorySurvey.questions.map((_, i) => ({ 
            question_index: i, 
            answer: surveyAnswers[i] 
          })),
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setShowSurveyModal(false);
      setMandatorySurvey(null);
      alert("✅ Survei berhasil dikirim!");
    } catch (err) {
      alert("❌ Gagal: " + err.message);
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
  // RENDER: SESSION MODE
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

  // ============================================================
  // RENDER: LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Memuat dashboard...</p>
      </div>
    );
  }

  // ============================================================
  // RENDER: MAIN DASHBOARD
  // ============================================================
  return (
    <div style={styles.container}>
      
      {/* ============ HEADER DENGAN LOGO ============ */}
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

      {/* ============ HERO SLIDER ============ */}
      {announcements.length > 0 && (
        <div style={styles.sliderContainer(isMobile)}>
          <div style={styles.sliderTrack(activeSlide, announcements.length)}>
            {announcements.map((p, idx) => (
              <div 
                key={idx} 
                style={styles.sliderSlide} 
                onClick={() => setSelectedNews(p)}
              >
                <img 
                  src={p.image_url || p.imageUrl} 
                  style={styles.sliderImage} 
                  alt={p.title} 
                />
                <div style={styles.sliderOverlay(isMobile)}>
                  <div style={styles.sliderContent}>
                    <span style={styles.sliderBadge}>
                      <Megaphone size={10} /> Info Akademik
                    </span>
                    <h2 style={styles.sliderTitle(isMobile)}>{p.title}</h2>
                    <button style={styles.sliderBtn}>Baca <ChevronRight size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {announcements.length > 1 && (
            <div style={styles.sliderDots}>
              {announcements.map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveSlide(idx)} 
                  style={styles.sliderDot(activeSlide === idx)} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ BANNER GREETING ============ */}
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

      {/* ============ STATS CARDS ============ */}
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

      {/* ============ TODAY'S SCHEDULES + QUICK ACTIONS ============ */}
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

        {/* Right: Quick Actions + Info */}
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
                <img src={p.image_url || p.imageUrl} style={styles.infoImage} alt="" />
                <div style={styles.infoContent}>
                  <b style={styles.infoItemTitle}>{p.title}</b>
                  <div style={styles.infoDate}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ FOOTER ============ */}
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

      {/* ============ MODAL BERITA ============ */}
      {selectedNews && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNews(null)} style={styles.modalClose}>
              <X size={18} />
            </button>
            <img src={selectedNews.image_url || selectedNews.imageUrl} style={styles.modalImage} alt="" />
            <div style={styles.modalBody}>
              <span style={styles.modalTag}>Official Admin</span>
              <h2 style={styles.modalTitle}>{selectedNews.title}</h2>
              <p style={styles.modalText}>{selectedNews.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL KODE ABSENSI ============ */}
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

      {/* ============ MODAL SURVEI ============ */}
      {showSurveyModal && mandatorySurvey && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalSurvey} onClick={e => e.stopPropagation()}>
            <div style={styles.surveyHeader}>
              <span style={styles.surveyIcon}>📋</span>
              <div>
                <h2 style={styles.surveyTitle}>{mandatorySurvey.title}</h2>
                <p style={styles.surveyRequired}>🔴 WAJIB DIISI</p>
              </div>
            </div>
            {mandatorySurvey.questions.map((q, qIdx) => (
              <div key={qIdx} style={styles.surveyQuestion}>
                <p style={styles.surveyQuestionText}>{qIdx+1}. {q.question}</p>
                {q.options.filter(o => o).map((opt, oIdx) => (
                  <label key={oIdx} style={styles.surveyOption(surveyAnswers[qIdx] === opt)}>
                    <input 
                      type="radio" 
                      name={`q-${qIdx}`} 
                      checked={surveyAnswers[qIdx] === opt} 
                      onChange={() => setSurveyAnswers({...surveyAnswers, [qIdx]: opt})} 
                      style={styles.surveyRadio} 
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            <button onClick={submitSurvey} style={styles.surveySubmit}>
              <Send size={14} /> Kirim Jawaban
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .slide-up {
          animation: slideUp 0.3s ease;
        }
        .fade-in {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  // Container
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '12px 16px 32px',
    width: '100%',
    boxSizing: 'border-box',
  },

  // Loading
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

  // Header
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

  // Slider
  sliderContainer: (m) => ({
    width: '100%',
    height: m ? 180 : 240,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    backgroundColor: '#000',
  }),
  sliderTrack: (active, total) => ({
    display: 'flex',
    width: `${total * 100}%`,
    height: '100%',
    transition: 'transform 0.8s ease',
    transform: `translateX(-${(active * 100) / total}%)`,
  }),
  sliderSlide: {
    minWidth: `${100 / (announcements?.length || 1)}%`,
    height: '100%',
    position: 'relative',
    cursor: 'pointer',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.7,
  },
  sliderOverlay: (m) => ({
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 10%, transparent 70%)',
    display: 'flex',
    alignItems: 'flex-end',
    padding: m ? 14 : 20,
  }),
  sliderContent: { color: '#fff', maxWidth: 500 },
  sliderBadge: {
    background: '#e11d48',
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 8,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  sliderTitle: (m) => ({
    fontSize: m ? 14 : 20,
    fontWeight: 900,
    margin: '0 0 6px',
    lineHeight: 1.2,
  }),
  sliderBtn: {
    background: 'white',
    color: '#000',
    border: 'none',
    padding: '5px 12px',
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  sliderDots: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 4,
  },
  sliderDot: (active) => ({
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: active ? '#fff' : 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    transition: '0.3s',
  }),

  // Banner
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

  // Stats
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

  // Two Column
  twoColGrid: (m) => ({
    display: 'grid',
    gridTemplateColumns: m ? '1fr' : '1.5fr 1fr',
    gap: 16,
    marginBottom: 20,
  }),
  rightCol: { display: 'flex', flexDirection: 'column', gap: 14 },

  // Section
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

  // Schedule
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

  // Empty
  emptyState: {
    textAlign: 'center',
    padding: '24px 12px',
    color: '#94a3b8',
  },
  emptyText: { fontSize: 13, fontWeight: 600, margin: '8px 0 2px', color: '#64748b' },
  emptySub: { fontSize: 11, margin: 0 },

  // Quick Actions
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

  // Info Card
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

  // Footer
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

  // Modal
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

  // Modal Code
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

  // Survey Modal
  modalSurvey: {
    background: 'white',
    borderRadius: 14,
    padding: 20,
    width: '90%',
    maxWidth: 480,
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  surveyHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 },
  surveyIcon: { fontSize: 22 },
  surveyTitle: { margin: 0, fontSize: 16, fontWeight: 800 },
  surveyRequired: { margin: 0, fontSize: 10, color: '#ef4444', fontWeight: 700 },
  surveyQuestion: { marginBottom: 12 },
  surveyQuestionText: { fontWeight: 700, fontSize: 12, marginBottom: 4 },
  surveyOption: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    marginBottom: 3,
    borderRadius: 6,
    cursor: 'pointer',
    background: active ? '#eef2ff' : '#f8fafc',
    border: `1px solid ${active ? '#3b82f6' : '#e2e8f0'}`,
    fontSize: 11,
  }),
  surveyRadio: { width: 14, height: 14 },
  surveySubmit: {
    width: '100%',
    padding: 10,
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
};

export default TeacherDashboard;