import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import TeacherLayout from './TeacherLayout';
import ClassSession from './ClassSession';
import { Player } from '@lottiefiles/react-lottie-player';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [guru, setGuru] = useState(location.state?.teacher || null);
  const [loading, setLoading] = useState(true);
  const [todaySchedules, setTodaySchedules] = useState([]);      
  const [upcomingSchedules, setUpcomingSchedules] = useState([]); 

  const [mode, setMode] = useState('dashboard'); 
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [pendingSchedule, setPendingSchedule] = useState(null);

  /**
   * FUNGSI SMART DATE: 
   * Menghasilkan YYYY-MM-DD berdasarkan waktu lokal alat masing-masing
   * tanpa terpengaruh perbedaan jam server (UTC).
   */
  const getSmartDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = useCallback(async () => {
    if (!guru) return;
    setLoading(true);
    try {
      const sekarang = new Date();
      const todayStr = getSmartDate(sekarang);
      
      // Ambil range 7 hari ke depan
      const semingguLagi = new Date();
      semingguLagi.setDate(sekarang.getDate() + 7);
      const nextWeekStr = getSmartDate(semingguLagi);

      const qMySched = query(
        collection(db, "jadwal_bimbel"), 
        where("booker", "==", guru.nama), 
        where("dateStr", ">=", todayStr),
        where("dateStr", "<=", nextWeekStr)
      );

      const snapMy = await getDocs(qMySched);
      const allScheds = snapMy.docs.map(d => ({id: d.id, ...d.data()}));
      
      // Filter yang lebih akurat
      const today = allScheds.filter(s => s.dateStr.trim() === todayStr);
      const upcoming = allScheds.filter(s => s.dateStr.trim() > todayStr);

      // Sorting jam: Kelas yang paling dekat jamnya muncul paling atas
      today.sort((a,b) => a.start.localeCompare(b.start));
      upcoming.sort((a,b) => a.dateStr.localeCompare(b.dateStr) || a.start.localeCompare(b.start));

      setTodaySchedules(today);
      setUpcomingSchedules(upcoming);
    } catch (error) { 
      console.error("Firebase Error:", error); 
    } finally { 
      setLoading(false); 
    }
  }, [guru]);

  useEffect(() => {
    if (!guru) {
        const savedGuru = localStorage.getItem('teacherData');
        if (savedGuru) setGuru(JSON.parse(savedGuru));
        else navigate('/login-guru');
    } else {
        localStorage.setItem('teacherData', JSON.stringify(guru));
        fetchData();
    }
  }, [guru, fetchData, navigate]);

  const handleInitStart = (sched) => {
    setPendingSchedule(sched);
    setInputToken("");
    setShowStartModal(true);
  };

  const confirmStartClass = async (e) => {
    e.preventDefault();
    try {
        const todayStr = getSmartDate(new Date());
        const codeRef = doc(db, "settings", `daily_code_${todayStr}`);
        const codeSnap = await getDoc(codeRef);
        
        if (!codeSnap.exists() || codeSnap.data().code.toUpperCase() !== inputToken.toUpperCase().trim()) {
            alert("⛔ KODE HARIAN SALAH!"); 
            return;
        }
        setActiveSchedule({ ...pendingSchedule, actualTeacher: guru.nama });
        setMode('session');
        setShowStartModal(false);
    } catch (error) { alert("Terjadi gangguan koneksi."); }
  };

  if (mode === 'session') {
      return <ClassSession schedule={activeSchedule} teacher={guru} onBack={() => { setMode('dashboard'); fetchData(); }} />;
  }

  return (
    <TeacherLayout guru={guru} activeTab="dashboard">
      <div style={{padding: '20px 5%'}}>
        
        {/* BANNER RAMADHAN - Responsive padding */}
        <div style={styles.ramadanBanner}>
          <div style={styles.bannerText}>
              <h2 style={styles.bannerTitle}>Marhaban ya Ramadhan ✨</h2>
              <p style={styles.bannerSub}>
                  Selamat berpuasa, Ustaz/Ustazah {guru?.nama}. <br/>
                  Semoga berkah setiap langkahnya mengajar. Semangat! 💪
              </p>
          </div>
          <div style={styles.animationArea}>
            <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height: '120px', width: '120px' }} />
          </div>
        </div>

        {/* JADWAL HARI INI */}
        <div style={{marginTop: 35}}>
          <h3 style={styles.sectionTitle}>📅 Jadwal Mengajar Hari Ini</h3>
          {loading ? (
             <div style={styles.loadingInfo}>Sedang mensinkronkan jadwal...</div>
          ) : todaySchedules.length === 0 ? (
            <div style={styles.emptyState}>
               <p style={{margin:0, fontWeight:'bold', color:'#7f8c8d'}}>Tidak ada jadwal untuk hari ini.</p>
               <small>Cek jadwal mendatang untuk persiapan.</small>
            </div>
          ) : (
            <div style={styles.gridContainer}>
              {todaySchedules.map(item => (
                <div key={item.id} style={styles.scheduleCard}>
                  <div style={styles.cardHeader}>
                    <span style={styles.timeTag}>{item.start} - {item.end}</span>
                    <span style={styles.roomTag}>📍 {item.planet}</span>
                  </div>
                  <h4 style={styles.classTitle}>{item.title}</h4>
                  <p style={styles.classInfo}>{item.program} | {item.level}</p>
                  <button onClick={() => handleInitStart(item)} style={styles.btnStart}>▶ MULAI KELAS</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* JADWAL MENDATANG */}
        <div style={{marginTop: 45, marginBottom: 50}}>
          <h3 style={{...styles.sectionTitle, borderLeft: '4px solid #f39c12'}}>🗓️ Jadwal Mendatang</h3>
          {loading ? null : upcomingSchedules.length === 0 ? (
            <p style={{color:'#999', paddingLeft: 15, fontSize: 14}}>Tidak ada jadwal minggu ini.</p>
          ) : (
            <div style={styles.gridContainer}>
              {upcomingSchedules.map(item => (
                <div key={item.id} style={{...styles.scheduleCard, opacity: 0.8, border: '1px dashed #ccc', background:'#fafafa'}}>
                  <div style={styles.cardHeader}>
                    <span style={{...styles.timeTag, background:'#fef9e7', color:'#f39c12'}}>{item.dateStr}</span>
                    <span style={styles.roomTag}>{item.start}</span>
                  </div>
                  <h4 style={{...styles.classTitle, fontSize: '16px'}}>{item.title}</h4>
                  <p style={styles.classInfo}>{item.program} | {item.level}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showStartModal && (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={{marginTop:0}}>🚀 Masukkan Kode</h3>
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
    </TeacherLayout>
  );
};

const styles = {
  ramadanBanner: { background: 'linear-gradient(135deg, #4a148c 0%, #7e57c2 50%, #ffc107 100%)', padding: '30px', borderRadius: '20px', color: 'white', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { margin: 0, fontSize: '24px', fontWeight: '800' },
  bannerSub: { margin: '8px 0 0', fontSize: '15px', opacity: 0.9 },
  sectionTitle: { fontSize: '18px', color: '#2c3e50', marginBottom: '15px', borderLeft: '4px solid #4a148c', paddingLeft: 12, fontWeight: '700' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
  scheduleCard: { background: 'white', padding: '18px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timeTag: { background: '#e8f4fd', color: '#3498db', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
  roomTag: { fontSize: '11px', color: '#95a5a6' },
  classTitle: { margin: '12px 0 4px 0', fontSize: '17px', fontWeight: '700' },
  classInfo: { fontSize: '13px', color: '#7f8c8d', margin: 0 },
  btnStart: { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' },
  emptyState: { padding: '40px', textAlign: 'center', background: 'white', borderRadius: '15px', border: '2px dashed #eee' },
  loadingInfo: { padding: '20px', color: '#3498db', fontStyle: 'italic' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', padding: '25px', borderRadius: '20px', width: '90%', maxWidth: '340px', textAlign: 'center' },
  inputCode: { width: '100%', padding: '12px', fontSize: '28px', textAlign: 'center', borderRadius: '10px', border: '2px solid #3498db', fontWeight: 'bold' },
  btnConfirm: { flex: 2, padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  btnCancel: { flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '8px', color: '#7f8c8d' }
};

export default TeacherDashboard;