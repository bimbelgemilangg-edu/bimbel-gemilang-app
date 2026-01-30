import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// IMPORT FIREBASE
import { db } from '../../firebase';
import { collection, getDocs, query, where } from "firebase/firestore";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const teacherName = location.state?.teacherName || "Guru";

  const [isLocked, setIsLocked] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [todayClass, setTodayClass] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [attendance, setAttendance] = useState({});

  // --- 1. AMBIL DATA DARI CLOUD ---
  useEffect(() => {
    const fetchCloudSchedule = async () => {
      try {
        // Ambil SEMUA jadwal
        const q = query(collection(db, "jadwal_bimbel")); 
        const snapshot = await getDocs(q);
        const allSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const todayStr = new Date().toISOString().split('T')[0];

        // Filter Milik Guru Ini
        const myToday = allSchedules.find(s => s.booker === teacherName && s.dateStr === todayStr);
        setTodayClass(myToday);

        const myNext = allSchedules.filter(s => s.booker === teacherName && s.dateStr > todayStr);
        setUpcomingClasses(myNext);
        
        // Init Absen
        if (myToday && myToday.students) {
          const init = {};
          myToday.students.forEach(s => init[s.id] = "Hadir");
          setAttendance(init);
        }

      } catch (error) {
        console.error("Gagal ambil data:", error);
      }
    };

    fetchCloudSchedule();
  }, [teacherName]);

  // --- LOGIKA UNLOCK (Sementara masih Local, karena Kode Harian belum di-onlinekan) ---
  const handleUnlock = (e) => {
    e.preventDefault();
    const adminCode = localStorage.getItem("DAILY_TEACHER_CODE") || "GEMILANG-2026";
    
    // Kita buat agar guru bisa masuk walau pakai kode default dulu untuk testing
    if (inputCode === adminCode || inputCode === "TEST") {
      setIsLocked(false);
      alert(`🔓 KELAS TERBUKA!\nData diambil dari Server Online.`);
    } else {
      alert("⛔ KODE SALAH!");
    }
  };

  // Simpan Absen (Logic Only)
  const handleSubmitAbsen = () => {
    alert("✅ Absensi Berhasil Disimpan ke Cloud (Simulasi)!");
  };

  const handleAbsenChange = (id, val) => setAttendance({...attendance, [id]: val});

  // TAMPILAN (Sama persis seperti sebelumnya, hanya logic useEffect yang berubah)
  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={{margin:0, color:'white'}}>Halo, {teacherName} 👋</h2>
          <p style={{margin:0, color:'#dbeafe', fontSize:'14px'}}>Online Mode</p>
        </div>
        <button onClick={() => navigate('/')} style={styles.btnLogout}>Keluar</button>
      </div>

      <div style={styles.content}>
        {isLocked ? (
          <div style={styles.lockWrapper}>
            <div style={styles.lockBox}>
              <h3>🔒 Kelas Terkunci</h3>
              <p>Masukkan Kode Harian dari Admin</p>
              <form onSubmit={handleUnlock}>
                <input type="text" value={inputCode} onChange={e => setInputCode(e.target.value)} style={styles.inputCode} placeholder="Kode..." />
                <button style={styles.btnUnlock}>BUKA</button>
              </form>
            </div>
          </div>
        ) : (
          <div style={styles.grid}>
            {/* KIRI */}
            <div style={styles.activeCard}>
              <div style={styles.cardHeader}>
                <span style={styles.badgeLive}>ONLINE</span>
                <b style={{color:'white'}}>{todayClass ? todayClass.start : "--:--"}</b>
              </div>
              <div style={styles.classInfo}>
                {todayClass ? (
                  <>
                    <h1>🪐 {todayClass.planet}</h1>
                    <h3>{todayClass.title}</h3>
                    
                    <div style={styles.attendanceBox}>
                      <h4>📝 Absensi Siswa</h4>
                      <table style={styles.table}>
                        <tbody>
                          {todayClass.students.map(s => (
                            <tr key={s.id}>
                              <td>{s.nama}</td>
                              <td>
                                <select value={attendance[s.id]} onChange={e => handleAbsenChange(s.id, e.target.value)}>
                                  <option>Hadir</option><option>Sakit</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={handleSubmitAbsen} style={styles.btnSubmit}>Simpan</button>
                    </div>
                  </>
                ) : (
                  <div style={{padding:'40px', textAlign:'center', color:'#999'}}>Tidak ada jadwal hari ini di Cloud.</div>
                )}
              </div>
            </div>

            {/* KANAN */}
            <div style={styles.sideCard}>
              <h3>📅 Minggu Depan</h3>
              {upcomingClasses.map(item => (
                 <div key={item.id} style={{borderBottom:'1px solid #eee', padding:'10px 0'}}>
                   <b>{item.title}</b><br/>
                   <small>{item.dateStr} • {item.planet}</small>
                 </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// CSS SEDERHANA
const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5', fontFamily: 'sans-serif' },
  header: { background: '#2980b9', padding: '20px', display: 'flex', justifyContent: 'space-between' },
  btnLogout: { background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px' },
  content: { padding: '30px', maxWidth: '1000px', margin: '0 auto' },
  lockWrapper: { display: 'flex', justifyContent: 'center', marginTop: '50px' },
  lockBox: { background: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 5px 10px rgba(0,0,0,0.1)' },
  inputCode: { padding: '10px', fontSize: '18px', textAlign: 'center', marginBottom: '10px' },
  btnUnlock: { padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' },
  activeCard: { background: 'white', borderRadius: '10px', overflow: 'hidden' },
  cardHeader: { background: '#34495e', padding: '15px', display: 'flex', justifyContent: 'space-between' },
  badgeLive: { background: 'red', color: 'white', padding: '2px 8px', borderRadius: '5px', fontSize: '10px' },
  classInfo: { padding: '20px' },
  attendanceBox: { marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' },
  table: { width: '100%', marginBottom: '10px' },
  btnSubmit: { width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none' },
  sideCard: { background: 'white', padding: '20px', borderRadius: '10px' }
};

export default TeacherDashboard;