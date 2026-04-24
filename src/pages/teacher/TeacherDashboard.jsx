import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { Player } from '@lottiefiles/react-lottie-player';
import { Clock, Users, BookOpen, Star, ArrowRight, Eye, Megaphone, Info, Calendar, Layout, MapPin, X, ChevronRight, ChevronLeft } from 'lucide-react';
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
  const [announcements, setAnnouncements] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedNews, setSelectedNews] = useState(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % announcements.length);
      }, 5000);
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
      const teacherFeeds = allData.filter(p => p.targetPortal === "Guru" || p.targetPortal === "Semua");
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div style={{ width: 35, height: 35, border: '4px solid #f3f4f6', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* HERO SLIDER */}
      {announcements.length > 0 && (
        <div style={{ width: '100%', height: isMobile ? '200px' : '300px', borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 25, backgroundColor: '#000' }}>
          <div style={{ display: 'flex', width: '100%', height: '100%', transition: 'transform 0.8s ease', transform: `translateX(-${activeSlide * 100}%)` }}>
            {announcements.map((p, idx) => (
              <div key={idx} style={{ minWidth: '100%', height: '100%', position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedNews(p)}>
                <img src={p.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} alt="" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 10%, transparent 70%)', display: 'flex', alignItems: 'flex-end', padding: isMobile ? 20 : 30 }}>
                  <div style={{ color: '#fff', maxWidth: 600 }}>
                    <span style={{ background: '#e11d48', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10 }}><Megaphone size={12}/> Info Akademik</span>
                    <h2 style={{ fontSize: isMobile ? 16 : 24, fontWeight: 900, margin: '0 0 10px 0', lineHeight: 1.2 }}>{p.title}</h2>
                    <button style={{ background: 'white', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>Baca <ChevronRight size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 15, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {announcements.map((_, idx) => (
              <div key={idx} onClick={() => setActiveSlide(idx)} style={{ width: 6, height: 6, borderRadius: '50%', background: activeSlide === idx ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: '0.3s' }}></div>
            ))}
          </div>
        </div>
      )}

      {/* BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: isMobile ? 20 : 30, borderRadius: 20, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, flexDirection: isMobile ? 'column' : 'row', gap: 15 }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, display: 'inline-block', marginBottom: 10, border: '1px solid rgba(99, 102, 241, 0.3)' }}>Dashboard Instruktur</div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 24, fontWeight: 900 }}>Assalamu'alaikum, {guru?.nama?.split(' ')[0]}!</h1>
          <p style={{ opacity: 0.8, fontSize: 13, marginTop: 5 }}>Selamat datang kembali di panel manajemen Bimbel Gemilang.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 15, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14}/> {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14}/> {todaySchedules.length} Sesi Aktif</span>
          </div>
        </div>
        {!isMobile && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 10 }}>
            <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: 120 }} />
          </div>
        )}
      </div>

      {/* GRID KONTEN */}
      <div style={{ display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* KIRI */}
        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b' }}><Layout size={18} color="#6366f1"/> Agenda Mengajar</h3>
              <button onClick={() => navigate('/guru/schedule')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Kalender <ArrowRight size={14}/></button>
            </div>
            {todaySchedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}><Info size={30} style={{ marginBottom: 10 }} /><p>Tidak ada jadwal hari ini.</p></div>
            ) : (
              todaySchedules.map(item => (
                <div key={item.id} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 14, display: 'flex', alignItems: 'center', marginBottom: 8, border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 60, textAlign: 'center', fontWeight: 900, fontSize: 13, color: '#1e293b' }}>{item.start}</div>
                  <div style={{ flex: 1, paddingLeft: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>{item.program} • <MapPin size={10}/> {item.planet}</div>
                  </div>
                  <button onClick={() => { setPendingSchedule(item); setShowStartModal(true); }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 10, fontWeight: 800, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>MULAI</button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div onClick={() => navigate('/guru/modul')} style={{ background: 'white', padding: 16, borderRadius: 16, cursor: 'pointer', border: '1px solid #f1f5f9', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}><BookOpen color="#6366f1"/></div>
              <b style={{ fontSize: 13 }}>E-Learning</b>
              <p style={{ fontSize: 10, color: '#64748b', margin: '4px 0 0' }}>Materi & Modul</p>
            </div>
            <div onClick={() => navigate('/guru/grades/input')} style={{ background: 'white', padding: 16, borderRadius: 16, cursor: 'pointer', border: '1px solid #f1f5f9', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}><Star color="#f59e0b"/></div>
              <b style={{ fontSize: 13 }}>Input Nilai</b>
              <p style={{ fontSize: 10, color: '#64748b', margin: '4px 0 0' }}>Evaluasi Siswa</p>
            </div>
          </div>
        </div>

        {/* KANAN */}
        <div style={{ flex: 1 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 20, border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
              <Megaphone size={20} color="#e11d48"/><h3 style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: 15 }}>Informasi Terbaru</h3>
            </div>
            {announcements.slice(0, 4).map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 10, padding: 10, cursor: 'pointer', borderRadius: 12, border: '1px solid #f1f5f9', marginBottom: 8 }} onClick={() => setSelectedNews(p)}>
                <img src={p.imageUrl} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} alt="" />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 12, color: '#1e293b' }}>{p.title}</b>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString('id-ID') : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL BERITA */}
      {selectedNews && (
        <div onClick={() => setSelectedNews(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: 20, backdropFilter: 'blur(10px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', width: '90%', maxWidth: 550, position: 'relative' }}>
            <button onClick={() => setSelectedNews(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', zIndex: 1 }}><X size={16}/></button>
            <img src={selectedNews.imageUrl} style={{ width: '100%', maxHeight: 250, objectFit: 'cover' }} alt="" />
            <div style={{ padding: 20 }}>
              <span style={{ fontSize: 9, color: '#6366f1', fontWeight: 800 }}>Official Admin BIMBEL</span>
              <h2 style={{ margin: '6px 0 12px', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{selectedNews.title}</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedNews.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KODE ABSENSI */}
      {showStartModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 20, width: '90%', maxWidth: 340, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px', fontWeight: 900, color: '#1e293b' }}>Otentikasi Kelas</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Masukkan kode absensi harian.</p>
            <input type="text" value={inputToken} onChange={e => setInputToken(e.target.value.toUpperCase())} style={{ width: '100%', padding: 14, fontSize: 24, textAlign: 'center', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none', fontWeight: 900 }} placeholder="KODE" maxLength={6} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowStartModal(false)} style={{ flex: 1, padding: 12, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontWeight: 700 }}>KEMBALI</button>
              <button onClick={handleVerifyAndStart} style={{ flex: 2, padding: 12, background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800 }}>VERIFIKASI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;