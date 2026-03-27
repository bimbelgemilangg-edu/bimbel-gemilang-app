import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import SidebarGuru from '../../components/SidebarGuru'; 
import ClassSession from './ClassSession';
import { Player } from '@lottiefiles/react-lottie-player';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [guru, setGuru] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaySchedules, setTodaySchedules] = useState([]);      
  const [upcomingSchedules, setUpcomingSchedules] = useState([]); 

  const [mode, setMode] = useState('dashboard'); 
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [pendingSchedule, setPendingSchedule] = useState(null);

  const getFmtDate = (d) => {
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fetchTeacherProfile = useCallback(async () => {
    try {
      const saved = JSON.parse(localStorage.getItem('teacherData'));
      if (saved) {
        const q = query(collection(db, "teachers"), where("email", "==", saved.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const freshData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setGuru(freshData);
          localStorage.setItem('teacherData', JSON.stringify(freshData));
        }
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchData = useCallback(async () => {
    if (!guru || !guru.nama) return;
    setLoading(true);
    try {
      const todayStr = getFmtDate(new Date());
      const q = query(collection(db, "jadwal_bimbel"), where("booker", "==", guru.nama.trim()));
      const snap = await getDocs(q);
      const allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const today = allData.filter(s => s.dateStr === todayStr);
      const upcoming = allData.filter(s => s.dateStr > todayStr);

      today.sort((a,b) => a.start.localeCompare(b.start));
      upcoming.sort((a,b) => a.dateStr.localeCompare(b.dateStr) || a.start.localeCompare(b.start));

      setTodaySchedules(today);
      setUpcomingSchedules(upcoming.slice(0, 10));
    } catch (error) { 
      console.error("FIREBASE ERROR:", error);
    } finally { 
      setLoading(false); 
    }
  }, [guru]);

  useEffect(() => {
    fetchTeacherProfile().then(() => {
        if (!localStorage.getItem('teacherData')) navigate('/login-guru');
    });
  }, [fetchTeacherProfile, navigate]);

  useEffect(() => {
    if (guru) fetchData();
  }, [guru, fetchData]);

  const handleInitStart = (sched) => {
    setPendingSchedule(sched);
    setInputToken("");
    setShowStartModal(true);
  };

  const confirmStartClass = async (e) => {
    e.preventDefault();
    try {
        const todayStr = getFmtDate(new Date());
        const codeRef = doc(db, "settings", `daily_code_${todayStr}`);
        const codeSnap = await getDoc(codeRef);
        
        if (!codeSnap.exists() || codeSnap.data().code.toUpperCase() !== inputToken.toUpperCase().trim()) {
            alert("⛔ KODE HARIAN SALAH!"); 
            return;
        }
        setActiveSchedule({ ...pendingSchedule, actualTeacher: guru.nama });
        setMode('session');
        setShowStartModal(false);
    } catch (error) { alert("Gagal verifikasi kode."); }
  };

  if (mode === 'session') {
      return <ClassSession schedule={activeSchedule} teacher={guru} onBack={() => { setMode('dashboard'); fetchData(); }} />;
  }

  return (
    <div style={{ display: 'flex' }}>
      <SidebarGuru /> 
      
      <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', background: '#f8f9fa', minHeight: '100vh' }}>
        <header style={styles.topHeader}>
          <div>
            <h4 style={{margin:0}}>Halo, {guru?.nama} ✨</h4>
            <small style={{color:'#7f8c8d'}}>Bimbel Gemilang - Portal Akademik</small>
          </div>
          <img src={guru?.fotoUrl || "https://via.placeholder.com/40"} style={styles.avatarImg} alt="Profil" />
        </header>

        <div style={{padding: '30px 40px'}}>
            <div style={styles.ramadanBanner}>
            <div style={styles.bannerText}>
                <h2 style={{margin:0, fontSize:26}}>Marhaban ya Ramadhan ✨</h2>
                <p style={{margin:'10px 0 0', fontSize:15, opacity:0.9}}>
                    Selamat mengabdi, Ustaz/Ustazah {guru?.nama}.
                </p>
            </div>
            <div style={styles.animationArea}>
                <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: '100px', width: '100px' }} />
            </div>
            </div>

            <div style={{marginTop: 35}}>
                <h3 style={styles.sectionTitle}>📅 Jadwal Mengajar Hari Ini ({getFmtDate(new Date())})</h3>
                {todaySchedules.length === 0 ? (
                <div style={styles.emptyState}>
                    <p style={{margin:0, fontWeight:'bold', color:'#7f8c8d'}}>Tidak ada jadwal untuk hari ini.</p>
                </div>
                ) : (
                <div style={styles.gridContainer}>
                    {todaySchedules.map(item => (
                    <div key={item.id} style={styles.scheduleCard}>
                        <div style={styles.cardHeader}>
                        <span style={styles.timeTag}>{item.start} - {item.end}</span>
                        <span style={styles.roomTag}>Ruang: {item.planet}</span>
                        </div>
                        <h4 style={styles.classTitle}>{item.title || "Kelas"}</h4>
                        <p style={styles.classInfo}>{item.program} | {item.level}</p>
                        <button onClick={() => handleInitStart(item)} style={styles.btnStart}>▶ MULAI KELAS</button>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </div>
      </div>

      {showStartModal && (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3>🚀 Verifikasi Kode</h3>
                <form onSubmit={confirmStartClass}>
                    <input type="text" value={inputToken} onChange={e => setInputToken(e.target.value)} style={styles.inputCode} autoFocus required />
                    <div style={{display:'flex', gap:10, marginTop:20}}>
                        <button type="button" onClick={()=>setShowStartModal(false)} style={styles.btnCancel}>Batal</button>
                        <button type="submit" style={styles.btnConfirm}>MASUK</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  topHeader: { background: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' },
  avatarImg: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3498db' },
  ramadanBanner: { background: 'linear-gradient(135deg, #4a148c 0%, #7e57c2 50%, #ffc107 100%)', padding: '25px 35px', borderRadius: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bannerText: { flex: 2 },
  animationArea: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  sectionTitle: { fontSize: '18px', color: '#2c3e50', marginBottom: '20px', borderLeft: '4px solid #4a148c', paddingLeft: 12, fontWeight:'bold' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  scheduleCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timeTag: { background: '#e8f4fd', color: '#3498db', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  roomTag: { fontSize: '12px', color: '#95a5a6' },
  classTitle: { margin: '15px 0 5px 0', fontSize: '17px', fontWeight:'bold' },
  classInfo: { fontSize: '13px', color: '#7f8c8d', margin: 0 },
  btnStart: { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' },
  emptyState: { padding: '40px', textAlign: 'center', background: 'white', borderRadius: '15px', color: '#95a5a6', border: '2px dashed #eee' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '340px', textAlign: 'center' },
  inputCode: { width: '100%', padding: '15px', fontSize: '32px', textAlign: 'center', borderRadius: '10px', border: '2px solid #3498db', fontWeight: 'bold' },
  btnConfirm: { flex: 2, padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  btnCancel: { flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '8px', color: '#7f8c8d' }
};

export default TeacherDashboard;