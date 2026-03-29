import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Player } from '@lottiefiles/react-lottie-player';
import { Clock, Users, BookOpen, Star, ArrowRight, LayoutDashboard } from 'lucide-react';
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

      if (codeSnap.exists()) {
        const serverCode = codeSnap.data().code;
        if (inputToken.toUpperCase() === serverCode) {
          setMode('session');
          setShowStartModal(false);
          setInputToken("");
        } else {
          alert("❌ KODE SALAH! Silahkan cek kembali atau hubungi Admin.");
        }
      } else {
        alert("⚠️ Admin belum mengatur kode absensi untuk hari ini.");
      }
    } catch (e) {
      alert("Terjadi kesalahan koneksi server.");
    }
  };

  if (mode === 'session') {
      return <ClassSession schedule={pendingSchedule} teacher={guru} onBack={() => { setMode('dashboard'); fetchTodayData(); }} />;
  }

  if (loading) return <div style={{padding:50, textAlign:'center', color:'#7f8c8d'}}>☕ Memuat Dashboard Guru...</div>;

  return (
    <div style={styles.container}>
      {/* BANNER UTAMA */}
      <div style={styles.banner}>
        <div style={styles.bannerContent}>
          <h1 style={styles.welcomeText}>Assalamu'alaikum, {guru?.nama?.split(' ')[0]}! 👋</h1>
          <p style={styles.subWelcome}>Semoga hari ini penuh keberkahan dalam menebar ilmu.</p>
          <div style={styles.statsRow}>
            <div style={styles.miniStat}><Clock size={16}/> {todaySchedules.length} Kelas Hari Ini</div>
            <div style={styles.miniStat}><Users size={16}/> {guru?.level || 'Pengajar'}</div>
          </div>
        </div>
        <div style={styles.lottieWrapper}>
            <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: '140px' }} />
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* KOLOM KIRI: JADWAL */}
        <div style={styles.leftCol}>
          <div style={styles.sectionHeader}>
            <h3 style={{margin:0, fontSize:18, color:'#2c3e50'}}>📅 Jadwal Hari Ini</h3>
            <button onClick={() => navigate('/guru/schedule')} style={styles.btnText}>Semua <ArrowRight size={14}/></button>
          </div>

          {todaySchedules.length === 0 ? (
            <div style={styles.emptyBox}>Libur mengajar hari ini. Selamat istirahat!</div>
          ) : (
            todaySchedules.map(item => (
              <div key={item.id} style={styles.listCard}>
                <div style={styles.cardInfo}>
                    <div style={styles.timeLabel}>{item.start}</div>
                    <div style={styles.classDetail}>
                        <h4 style={{margin:'0 0 3px', fontSize:15}}>{item.title}</h4>
                        <p style={{margin:0, fontSize:12, color:'#7f8c8d'}}>{item.program} • Ruang {item.planet}</p>
                    </div>
                </div>
                <button 
                  onClick={() => { setPendingSchedule(item); setShowStartModal(true); }} 
                  style={styles.btnAction}
                >
                  Mulai
                </button>
              </div>
            ))
          )}
        </div>

        {/* KOLOM KANAN: SHORTCUT */}
        <div style={styles.rightCol}>
          <h3 style={styles.sectionTitle}>⚡ Akses Cepat</h3>
          <div style={styles.shortcutGrid}>
            <div onClick={() => navigate('/guru/modul')} style={styles.shortBtn}>
                <div style={{...styles.iconCircle, background:'#ebf5fb'}}><BookOpen size={20} color="#3498db"/></div>
                <span>E-Learning</span>
            </div>
            <div onClick={() => navigate('/guru/grades/input')} style={styles.shortBtn}>
                <div style={{...styles.iconCircle, background:'#fff9e6'}}><Star size={20} color="#f1c40f"/></div>
                <span>Input Nilai</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL KODE HARIAN */}
      {showStartModal && (
         <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={{marginBottom:20}}>
                    <h3 style={{marginTop: 0, color: '#2c3e50'}}>🚀 Masukkan Kode</h3>
                    <p style={{fontSize: 12, color: '#7f8c8d'}}>Minta kode harian ke Admin/Receptionist.</p>
                </div>
                <input 
                    type="text" 
                    value={inputToken} 
                    onChange={e => setInputToken(e.target.value.toUpperCase())} 
                    style={styles.inputCode} 
                    placeholder="KODE" 
                    autoFocus
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
  container: { padding: window.innerWidth <= 768 ? '15px' : '30px' },
  banner: { 
    background: 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)', 
    padding: window.innerWidth <= 768 ? '25px' : '35px', 
    borderRadius: '24px', color: 'white', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: '30px', position: 'relative', overflow: 'hidden' 
  },
  bannerContent: { flex: 1, zIndex: 2 },
  welcomeText: { margin: 0, fontSize: window.innerWidth <= 768 ? '22px' : '28px' },
  subWelcome: { opacity: 0.8, marginTop: '8px', fontSize: window.innerWidth <= 768 ? '14px' : '16px' },
  lottieWrapper: { display: window.innerWidth <= 768 ? 'none' : 'block' },
  statsRow: { display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' },
  miniStat: { background: 'rgba(255,255,255,0.15)', padding: '6px 15px', borderRadius: '30px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
  
  mainGrid: { display: 'flex', gap: '25px', flexDirection: window.innerWidth <= 1024 ? 'column' : 'row' },
  leftCol: { flex: 2 },
  rightCol: { flex: 1 },
  
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  btnText: { background: 'none', border: 'none', color: '#3498db', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 },
  
  listCard: { 
    background: 'white', padding: '15px 20px', borderRadius: '18px', 
    display: 'flex', alignItems: 'center', justifyContent:'space-between', 
    marginBottom: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' 
  },
  cardInfo: { display: 'flex', alignItems: 'center', gap: '15px', flex: 1 },
  timeLabel: { background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold', color: '#2c3e50', fontSize: '13px', minWidth:'50px', textAlign:'center' },
  classDetail: { flex: 1 },
  btnAction: { padding: '8px 18px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: 13 },
  
  sectionTitle: { fontSize: '17px', color: '#2c3e50', marginBottom: '15px', fontWeight: 'bold' },
  shortcutGrid: { display: 'grid', gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : '1fr 1fr', gap: '15px' },
  shortBtn: { 
    background: 'white', padding: '15px', borderRadius: '18px', 
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', 
    fontWeight: 'bold', cursor: 'pointer', border: '1px solid #f1f5f9', fontSize: 13 
  },
  iconCircle: { width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  emptyBox: { padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: 14 },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)', padding: 20 },
  modal: { background: 'white', padding: '25px', borderRadius: '24px', width: '100%', maxWidth: '350px', textAlign: 'center' },
  inputCode: { width: '100%', padding: '12px', fontSize: '22px', textAlign: 'center', borderRadius: '12px', border: '2px solid #3498db', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' },
  btnConfirm: { flex: 2, padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', color: '#64748b', cursor: 'pointer' }
};

export default TeacherDashboard;