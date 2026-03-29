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

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Memuat Dashboard...</div>;

  return (
    <div style={styles.container}>
      {/* BANNER: Menyesuaikan lebar kontainer */}
      <div style={styles.banner}>
        <div style={{flex: 1}}>
          <h1 style={styles.title}>Assalamu'alaikum, {guru?.nama?.split(' ')[0]}! 👋</h1>
          <p style={styles.subtitle}>Selamat mengajar di Bimbel Gemilang hari ini.</p>
          <div style={styles.statsRow}>
            <div style={styles.miniStat}><Clock size={16}/> {todaySchedules.length} Kelas</div>
            <div style={styles.miniStat}><Users size={16}/> {guru?.level}</div>
          </div>
        </div>
        <div style={styles.lottieHideMobile}>
           <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: '140px' }} />
        </div>
      </div>

      {/* GRID UTAMA: flex-wrap agar tidak menyempit */}
      <div style={styles.mainGrid}>
        
        {/* KOLOM JADWAL: Lebar 100% di HP, ~65% di Laptop */}
        <div style={styles.leftColumn}>
          <div style={styles.sectionHeader}>
            <h3 style={{margin:0}}>📅 Jadwal Hari Ini</h3>
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
                    <h4 style={{margin:0, fontSize: 16}}>{item.title}</h4>
                    <p style={{margin:0, fontSize:12, color:'#7f8c8d'}}>{item.program} • Ruang {item.planet}</p>
                  </div>
                </div>
                <button onClick={() => { setPendingSchedule(item); setShowStartModal(true); }} style={styles.btnAction}>Mulai</button>
              </div>
            ))
          )}
        </div>

        {/* KOLOM AKSES CEPAT: Lebar 100% di HP, ~30% di Laptop */}
        <div style={styles.rightColumn}>
          <h3 style={{fontSize: 18, marginBottom: 15}}>⚡ Akses Cepat</h3>
          <div style={styles.shortcutGrid}>
            <div onClick={() => navigate('/guru/modul')} style={styles.shortBtn}>
              <div style={styles.iconBox}><BookOpen color="#3498db"/></div>
              <span>E-Learning</span>
            </div>
            <div onClick={() => navigate('/guru/grades/input')} style={styles.shortBtn}>
              <div style={{...styles.iconBox, background:'#fff9e6'}}><Star color="#f1c40f"/></div>
              <span>Input Nilai</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL KODE */}
      {showStartModal && (
         <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={{marginTop: 0}}>🚀 Masukkan Kode Harian</h3>
                <input 
                    type="text" 
                    value={inputToken} 
                    onChange={e => setInputToken(e.target.value.toUpperCase())} 
                    style={styles.inputCode} 
                    placeholder="KODE" 
                />
                <div style={{display:'flex', gap:10, marginTop:20}}>
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
  container: { padding: '20px', width: '100%', boxSizing: 'border-box' },
  banner: { 
    background: 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)', 
    padding: '30px', borderRadius: '20px', color: 'white', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: '30px', width: '100%', boxSizing: 'border-box' 
  },
  title: { margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' },
  subtitle: { opacity: 0.8, fontSize: 'clamp(0.9rem, 2vw, 1rem)' },
  statsRow: { display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' },
  miniStat: { background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' },
  
  mainGrid: { 
    display: 'flex', 
    flexWrap: 'wrap', // Kunci agar otomatis pindah baris jika layar sempit
    gap: '25px', 
    width: '100%' 
  },
  leftColumn: { 
    flex: '1 1 600px', // Mencoba mengambil 600px, tapi bisa melebar (grow)
    minWidth: '300px' 
  },
  rightColumn: { 
    flex: '1 1 300px', // Mengambil sisa ruang samping
    minWidth: '300px' 
  },
  
  sectionHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  btnText: { background: 'none', border: 'none', color: '#3498db', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
  
  listCard: { 
    background: 'white', padding: '15px 20px', borderRadius: '15px', 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
    marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' 
  },
  cardInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  timeBadge: { background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' },
  btnAction: { padding: '8px 18px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  
  shortcutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' },
  shortBtn: { 
    background: 'white', padding: '20px', borderRadius: '15px', 
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', 
    fontWeight: 'bold', cursor: 'pointer', border: '1px solid #f1f5f9', transition: '0.2s' 
  },
  iconBox: { width: '40px', height: '40px', background: '#ebf5fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  emptyBox: { padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '15px', border: '2px dashed #e2e8f0', color: '#94a3b8' },
  lottieHideMobile: { display: window.innerWidth < 768 ? 'none' : 'block' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '350px', textAlign: 'center' },
  inputCode: { width: '100%', padding: '15px', fontSize: '20px', textAlign: 'center', borderRadius: '10px', border: '2px solid #3498db', outline: 'none', boxSizing: 'border-box' },
  btnConfirm: { flex: 2, padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  btnCancel: { flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px' }
};

export default TeacherDashboard;