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

  if (mode === 'session') {
      return <ClassSession schedule={pendingSchedule} teacher={guru} onBack={() => { setMode('dashboard'); fetchTodayData(); }} />;
  }

  return (
    <div style={{ padding: '30px' }}>
      {/* BANNER UTAMA */}
      <div style={styles.banner}>
        <div>
          <h1 style={{margin:0, fontSize:28}}>Assalamu'alaikum, {guru?.nama?.split(' ')[0]}! 👋</h1>
          <p style={{opacity:0.9, marginTop:10, fontSize:16}}>Semoga hari ini penuh keberkahan dalam menebar ilmu.</p>
          <div style={styles.statsRow}>
            <div style={styles.miniStat}><Clock size={16}/> {todaySchedules.length} Kelas Hari Ini</div>
            <div style={styles.miniStat}><Users size={16}/> {guru?.level || 'Pengajar'}</div>
          </div>
        </div>
        <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: '140px' }} />
      </div>

      <div style={styles.mainGrid}>
        {/* KOLOM KIRI: JADWAL */}
        <div style={{flex: 2}}>
          <div style={styles.sectionHeader}>
            <h3 style={{margin:0}}>📅 Jadwal Mengajar Hari Ini</h3>
            <button onClick={() => navigate('/guru/schedule')} style={styles.btnText}>Lihat Semua <ArrowRight size={14}/></button>
          </div>

          {todaySchedules.length === 0 ? (
            <div style={styles.emptyBox}>Libur mengajar hari ini. Selamat istirahat!</div>
          ) : (
            todaySchedules.map(item => (
              <div key={item.id} style={styles.listCard}>
                <div style={styles.timeInfo}>
                  <span style={styles.timeText}>{item.start}</span>
                  <div style={styles.line}></div>
                </div>
                <div style={styles.classDetail}>
                  <h4 style={{margin:'0 0 5px'}}>{item.title}</h4>
                  <p style={{margin:0, fontSize:13, color:'#7f8c8d'}}>{item.program} • Ruang {item.planet}</p>
                </div>
                <button onClick={() => { setPendingSchedule(item); setShowStartModal(true); }} style={styles.btnAction}>Mulai Sesi</button>
              </div>
            ))
          )}
        </div>

        {/* KOLOM KANAN: SHORTCUT */}
        <div style={{flex: 1}}>
          <h3 style={styles.sectionTitle}>⚡ Akses Cepat</h3>
          <div style={styles.shortcutGrid}>
            <div onClick={() => navigate('/guru/modul')} style={styles.shortBtn}><BookOpen color="#3498db"/> E-Learning</div>
            <div onClick={() => navigate('/guru/grades/input')} style={styles.shortBtn}><Star color="#f1c40f"/> Input Nilai</div>
          </div>
        </div>
      </div>

      {/* MODUL KODE HARIAN (Sama seperti sebelumnya) */}
      {showStartModal && (
         <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3>🚀 Masukkan Kode Harian</h3>
                <input type="text" value={inputToken} onChange={e => setInputToken(e.target.value.toUpperCase())} style={styles.inputCode} placeholder="KODE" />
                <div style={{display:'flex', gap:10, marginTop:20}}>
                    <button onClick={()=>setShowStartModal(false)} style={styles.btnCancel}>Batal</button>
                    <button onClick={() => { setMode('session'); setShowStartModal(false); }} style={styles.btnConfirm}>MASUK KELAS</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

const styles = {
  banner: { background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', padding: '35px', borderRadius: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' },
  statsRow: { display: 'flex', gap: '15px', marginTop: '20px' },
  miniStat: { background: 'rgba(255,255,255,0.1)', padding: '8px 15px', borderRadius: '30px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' },
  mainGrid: { display: 'flex', gap: '30px', flexWrap: 'wrap' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnText: { background: 'none', border: 'none', color: '#3498db', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
  listCard: { background: 'white', padding: '20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  timeInfo: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' },
  timeText: { fontWeight: 'bold', color: '#2c3e50', fontSize: '15px' },
  line: { width: '2px', height: '20px', background: '#f1f5f9', marginTop: '5px' },
  classDetail: { flex: 1 },
  btnAction: { padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  shortcutGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '15px' },
  shortBtn: { background: 'white', padding: '20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #f1f5f9', transition: '0.2s' },
  emptyBox: { padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '24px', width: '350px', textAlign: 'center' },
  inputCode: { width: '100%', padding: '15px', fontSize: '24px', textAlign: 'center', borderRadius: '12px', border: '2px solid #3498db', fontWeight: 'bold', outline: 'none' },
  btnConfirm: { flex: 2, padding: '14px', background: '#3498db', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '10px', color: '#64748b', cursor: 'pointer' }
};

export default TeacherDashboard;