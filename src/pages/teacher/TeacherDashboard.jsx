import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Player } from '@lottiefiles/react-lottie-player';
import { Clock, Users, BookOpen, Star, ArrowRight } from 'lucide-react';
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

  // Handle Resize untuk Lottie
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

  const fetchTodayData = useCallback(async () => {
    if (!guru?.nama) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const q = query(collection(db, "jadwal_bimbel"), where("booker", "==", guru.nama.trim()));
      const snap = await getDocs(q);
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.dateStr === todayStr)
        .sort((a,b) => a.start.localeCompare(b.start));
      setTodaySchedules(filtered);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [guru]);

  useEffect(() => { fetchTeacherProfile(); }, [fetchTeacherProfile]);
  useEffect(() => { if (guru) fetchTodayData(); }, [guru, fetchTodayData]);

  const handleVerifyAndStart = async () => {
    if (!inputToken) return alert("Silahkan masukkan kode absensi!");
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const codeRef = doc(db, "settings", `daily_code_${todayStr}`);
      const codeSnap = await getDoc(codeRef);
      if (codeSnap.exists() && inputToken.toUpperCase() === codeSnap.data().code) {
          setMode('session');
          setShowStartModal(false);
          setInputToken("");
      } else {
          alert("❌ KODE SALAH atau belum diatur oleh Admin.");
      }
    } catch (e) { alert("Error koneksi."); }
  };

  if (mode === 'session') {
      return <ClassSession schedule={pendingSchedule} teacher={guru} onBack={() => { setMode('dashboard'); fetchTodayData(); }} />;
  }

  if (loading) return (
    <div className="main-content-wrapper" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
        <div className="spinner-global"></div>
        <p style={{marginLeft: 15, fontWeight: 'bold', color: '#64748b'}}>Memuat Dashboard...</p>
    </div>
  );

  return (
    <div className="main-content-wrapper">
      <div className="teacher-container-padding">
        {/* BANNER UTAMA */}
        <div style={styles.banner}>
            <div style={{flex: 1}}>
                <h1 style={styles.title}>Assalamu'alaikum, {guru?.nama?.split(' ')[0]}! 👋</h1>
                <p style={styles.subtitle}>Selamat mengajar di Bimbel Gemilang hari ini.</p>
                <div style={styles.statsRow}>
                    <div style={styles.miniStat}><Clock size={16}/> {todaySchedules.length} Kelas</div>
                    <div style={styles.miniStat}><Users size={16}/> {guru?.level}</div>
                </div>
            </div>
            {!isMobile && (
                <div style={styles.lottieBox}>
                    <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: '140px' }} />
                </div>
            )}
        </div>

        {/* GRID KONTEN RESPONSIF */}
        <div className="responsive-grid" style={{alignItems: 'flex-start'}}>
            
            {/* JADWAL HARI INI */}
            <div className="teacher-card">
                <div style={styles.sectionHeader}>
                    <h3 style={{margin:0, fontWeight: '800', color: '#1e293b'}}>📅 Jadwal Hari Ini</h3>
                    <button onClick={() => navigate('/guru/schedule')} style={styles.btnText}>Lihat Semua <ArrowRight size={14}/></button>
                </div>

                {todaySchedules.length === 0 ? (
                    <div style={styles.emptyBox}>Tidak ada jadwal mengajar hari ini.</div>
                ) : (
                    todaySchedules.map(item => (
                    <div key={item.id} style={styles.listCard}>
                        <div style={styles.cardInfo}>
                            <div style={styles.timeBadge}>{item.start}</div>
                            <div>
                                <h4 style={{margin:0, fontSize: 15, fontWeight: '700'}}>{item.title}</h4>
                                <p style={{margin:0, fontSize:12, color:'#64748b'}}>{item.program} • Ruang {item.planet}</p>
                            </div>
                        </div>
                        <button onClick={() => { setPendingSchedule(item); setShowStartModal(true); }} style={styles.btnAction}>Mulai</button>
                    </div>
                    ))
                )}
            </div>

            {/* AKSES CEPAT */}
            <div className="teacher-card" style={{background: '#f1f5f9', border: 'none'}}>
                <h3 style={{fontSize: 18, marginBottom: 20, fontWeight: '800', color: '#1e293b'}}>⚡ Akses Cepat</h3>
                <div style={styles.shortcutGrid}>
                    <div onClick={() => navigate('/guru/modul')} style={styles.shortBtn} className="teacher-card-hover">
                        <div style={styles.iconBox}><BookOpen color="#3498db"/></div>
                        <span style={{fontSize: 13}}>E-Learning</span>
                    </div>
                    <div onClick={() => navigate('/guru/grades/input')} style={styles.shortBtn} className="teacher-card-hover">
                        <div style={{...styles.iconBox, background:'#fff9e6'}}><Star color="#f1c40f"/></div>
                        <span style={{fontSize: 13}}>Input Nilai</span>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* MODAL KODE */}
      {showStartModal && (
         <div style={styles.overlay}>
            <div style={styles.modal} className="teacher-card">
                <h3 style={{marginTop: 0, fontWeight: '800'}}>🚀 Masukkan Kode Harian</h3>
                <p style={{fontSize: 12, color: '#64748b', marginBottom: 15}}>Gunakan kode absensi hari ini untuk memulai kelas.</p>
                <input 
                    type="text" 
                    value={inputToken} 
                    onChange={e => setInputToken(e.target.value.toUpperCase())} 
                    style={styles.inputCode} 
                    placeholder="KODE" 
                />
                <div style={{display:'flex', gap:10, marginTop:25}}>
                    <button onClick={()=>setShowStartModal(false)} style={styles.btnCancel}>Batal</button>
                    <button onClick={handleVerifyAndStart} style={styles.btnConfirm}>MASUK</button>
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
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
  },
  title: { margin: 0, fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800' },
  subtitle: { opacity: 0.8, fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', marginTop: 5 },
  statsRow: { display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' },
  miniStat: { background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' },
  
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnText: { background: 'none', border: 'none', color: '#6366f1', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 },
  
  listCard: { 
    background: '#f8fafc', padding: '15px', borderRadius: '16px', 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
    marginBottom: '12px', border: '1px solid #f1f5f9' 
  },
  cardInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  timeBadge: { background: 'white', color: '#1e293b', padding: '8px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', border: '1px solid #e2e8f0' },
  btnAction: { padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: 13 },
  
  shortcutGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  shortBtn: { 
    background: 'white', padding: '25px 15px', borderRadius: '18px', 
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', 
    fontWeight: '800', cursor: 'pointer', border: '1px solid #e2e8f0'
  },
  iconBox: { width: '45px', height: '45px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  emptyBox: { padding: '50px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8', fontWeight: '600' },
  lottieBox: { background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: 5 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  modal: { width: '90%', maxWidth: '380px', textAlign: 'center', padding: '35px' },
  inputCode: { width: '100%', padding: '18px', fontSize: '24px', textAlign: 'center', borderRadius: '15px', border: '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', fontWeight: '900', color: '#1e293b', background: '#f8fafc' },
  btnConfirm: { flex: 2, padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }
};

export default TeacherDashboard;