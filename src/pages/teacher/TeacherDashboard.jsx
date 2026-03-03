import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import TeacherLayout from './TeacherLayout';
import ClassSession from './ClassSession';

// Import Player untuk animasi Lottie
import { Player } from '@lottiefiles/react-lottie-player';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // STATE MANAGEMENT (Tetap sesuai aslinya)
  const [guru, setGuru] = useState(location.state?.teacher || null);
  const [loading, setLoading] = useState(true);
  const [todaySchedules, setTodaySchedules] = useState([]);      
  
  // SESSION STATES (Tetap sesuai aslinya)
  const [mode, setMode] = useState('dashboard'); 
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [pendingSchedule, setPendingSchedule] = useState(null);

  // 1. FETCH DATA (Logika asli tidak diubah)
  const fetchData = useCallback(async () => {
    if (!guru) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const qMySched = query(
        collection(db, "jadwal_bimbel"), 
        where("booker", "==", guru.nama), 
        where("dateStr", "==", todayStr)
      );
      const snapMy = await getDocs(qMySched);
      const todays = snapMy.docs.map(d => ({id: d.id, ...d.data()}));
      
      todays.sort((a,b) => a.start.localeCompare(b.start));
      setTodaySchedules(todays);
    } catch (error) { 
      console.error("Gagal ambil jadwal:", error); 
    } finally { 
      setLoading(false); 
    }
  }, [guru]);

  // 2. INITIALIZATION (Logika asli tidak diubah)
  useEffect(() => {
    if (!guru) {
        const savedGuru = localStorage.getItem('teacherData');
        if (savedGuru) {
            setGuru(JSON.parse(savedGuru));
        } else {
            navigate('/login-guru');
        }
    } else {
        localStorage.setItem('teacherData', JSON.stringify(guru));
        fetchData();
    }
  }, [guru, fetchData, navigate]);

  // 3. ACTION HANDLERS (Logika asli tidak diubah)
  const handleInitStart = (sched) => {
    setPendingSchedule(sched);
    setInputToken("");
    setShowStartModal(true);
  };

  const confirmStartClass = async (e) => {
    e.preventDefault();
    try {
        const today = new Date().toISOString().split('T')[0];
        const codeRef = doc(db, "settings", `daily_code_${today}`);
        const codeSnap = await getDoc(codeRef);
        
        if (!codeSnap.exists() || codeSnap.data().code.toUpperCase() !== inputToken.toUpperCase().trim()) {
            alert("⛔ KODE HARIAN SALAH!\nMinta kode terbaru ke Admin."); 
            return;
        }

        setActiveSchedule({ ...pendingSchedule, actualTeacher: guru.nama });
        setMode('session');
        setShowStartModal(false);
    } catch (error) {
        alert("Terjadi kesalahan verifikasi.");
    }
  };

  // RENDER CLASS SESSION (Layar penuh saat mengajar)
  if (mode === 'session') {
      return (
        <ClassSession 
            schedule={activeSchedule} 
            teacher={guru} 
            onBack={() => { setMode('dashboard'); fetchData(); }} 
        />
      );
  }

  return (
    <TeacherLayout guru={guru} activeTab="dashboard">
      <div style={{padding: '30px 40px'}}>
        
        {/* --- BANNER RAMADHAN (Fitur Baru) --- */}
        <div style={styles.ramadanBanner}>
          <div style={styles.bannerText}>
              <h2 style={{margin:0, fontSize:28}}>Marhaban ya Ramadhan ✨</h2>
              <p style={{margin:'10px 0 0', fontSize:16, opacity:0.9, lineHeight:'1.5'}}>
                  Selamat menunaikan ibadah puasa, Ustaz/Ustazah {guru?.nama}. <br/>
                  Semoga lelahnya mengajar menjadi lillah. Tetap semangat! 💪
              </p>
          </div>
          <div style={styles.animationArea}>
            <Player
              autoplay
              loop
              src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" 
              style={{ height: '140px', width: '140px' }}
            />
          </div>
        </div>

        {/* --- JADWAL HARI INI --- */}
        <div style={{marginTop: 35}}>
          <h3 style={styles.sectionTitle}>🚀 Aksi Hari Ini</h3>
          
          {todaySchedules.length === 0 && !loading ? (
            <div style={styles.emptyState}>
              🏝️ Tidak ada jadwal mengajar hari ini. Istirahatlah yang cukup.
            </div>
          ) : (
            <div style={styles.gridContainer}>
              {todaySchedules.map(item => (
                <div key={item.id} style={styles.scheduleCard}>
                  <div style={styles.cardHeader}>
                    <span style={styles.timeTag}>{item.start} - {item.end}</span>
                    <span style={styles.roomTag}>Ruang: {item.planet}</span>
                  </div>
                  <h4 style={styles.classTitle}>{item.title}</h4>
                  <p style={styles.classInfo}>{item.program} | {item.level}</p>
                  <button onClick={() => handleInitStart(item)} style={styles.btnStart}>
                    ▶ MULAI KELAS & ABSEN
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL VERIFIKASI (Tetap sesuai aslinya) */}
      {showStartModal && (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={{marginTop:0}}>🚀 Verifikasi Kode</h3>
                <form onSubmit={confirmStartClass}>
                    <input 
                        type="text" value={inputToken} 
                        onChange={e => setInputToken(e.target.value)} 
                        style={styles.inputCode} autoFocus required
                    />
                    <div style={{display:'flex', gap:10, marginTop:20}}>
                        <button type="button" onClick={()=>setShowStartModal(false)} style={styles.btnCancel}>Batal</button>
                        <button type="submit" style={styles.btnConfirm}>MASUK</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </TeacherLayout>
  );
};

const styles = {
  ramadanBanner: { 
    background: 'linear-gradient(135deg, #4a148c 0%, #7e57c2 50%, #ffc107 100%)',
    padding: '35px 45px', borderRadius: '24px', color: 'white', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 10px 30px rgba(126, 87, 194, 0.3)'
  },
  bannerText: { flex: 2 },
  animationArea: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  sectionTitle: { fontSize: '20px', color: '#2c3e50', marginBottom: '20px', borderLeft: '4px solid #4a148c', paddingLeft: 12 },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  scheduleCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timeTag: { background: '#e8f4fd', color: '#3498db', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  roomTag: { fontSize: '12px', color: '#95a5a6' },
  classTitle: { margin: '15px 0 5px 0', fontSize: '18px' },
  classInfo: { fontSize: '13px', color: '#7f8c8d', margin: 0 },
  btnStart: { width: '100%', padding: '14px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer', boxShadow: '0 4px 0 #1e8449' },
  emptyState: { padding: '50px', textAlign: 'center', background: 'white', borderRadius: '15px', color: '#95a5a6', border: '2px dashed #eee' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '350px', textAlign: 'center' },
  inputCode: { width: '100%', padding: '15px', fontSize: '32px', textAlign: 'center', borderRadius: '10px', border: '2px solid #3498db', fontWeight: 'bold', letterSpacing: 5 },
  btnConfirm: { flex: 2, padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor:'pointer' },
  btnCancel: { flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '8px', color: '#7f8c8d', cursor:'pointer' }
};

export default TeacherDashboard;