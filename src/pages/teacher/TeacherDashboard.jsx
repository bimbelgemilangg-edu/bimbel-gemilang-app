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

  // --- AMBIL DATA DARI CLOUD (ANTI REFRESH HILANG) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil SEMUA data jadwal
        const snapshot = await getDocs(collection(db, "jadwal_bimbel"));
        const allData = snapshot.docs.map(doc => doc.data());

        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Cari Jadwal Hari Ini untuk Guru Ini
        const myToday = allData.find(s => s.booker === teacherName && s.dateStr === todayStr);
        setTodayClass(myToday);

        // 2. Cari Jadwal Mendatang
        const myNext = allData.filter(s => s.booker === teacherName && s.dateStr > todayStr);
        setUpcomingClasses(myNext);

        // 3. Setup Absensi
        if (myToday && myToday.students) {
          const init = {};
          myToday.students.forEach(s => init[s.id] = "Hadir");
          setAttendance(init);
        }

      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    fetchData();
  }, [teacherName]);

  const handleUnlock = (e) => {
    e.preventDefault();
    const adminCode = localStorage.getItem("DAILY_TEACHER_CODE") || "GEMILANG-2026";
    if (inputCode === adminCode) {
      setIsLocked(false);
    } else {
      alert("Kode Salah!");
    }
  };

  const handleAbsenChange = (id, val) => setAttendance({...attendance, [id]: val});

  const handleSubmitAbsen = () => {
    alert("Absensi tersimpan (Simulasi Cloud)!");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{color:'white', margin:0}}>Halo, {teacherName}</h2>
        <button onClick={() => navigate('/')} style={styles.btnLogout}>Keluar</button>
      </div>

      <div style={styles.content}>
        {isLocked ? (
          <div style={styles.lockBox}>
            <h3>🔒 Masukkan Kode Harian</h3>
            <form onSubmit={handleUnlock}>
              <input style={styles.inputCode} value={inputCode} onChange={e => setInputCode(e.target.value)} />
              <button style={styles.btnUnlock}>Buka Kelas</button>
            </form>
          </div>
        ) : (
          <div style={styles.grid}>
            {/* KARTU JADWAL HARI INI */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{color:'white', fontWeight:'bold'}}>HARI INI</span>
              </div>
              <div style={{padding:'20px'}}>
                {todayClass ? (
                  <>
                    <h1 style={{marginTop:0}}>🪐 {todayClass.planet}</h1>
                    <h3>{todayClass.title} ({todayClass.start})</h3>
                    
                    <h4>📝 Absensi Siswa</h4>
                    <table style={{width:'100%', marginBottom:'20px'}}>
                      <tbody>
                        {todayClass.students.map(s => (
                          <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:'10px'}}>{s.nama}</td>
                            <td style={{textAlign:'right'}}>
                              <select value={attendance[s.id]} onChange={e => handleAbsenChange(s.id, e.target.value)}>
                                <option>Hadir</option><option>Sakit</option><option>Alpha</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={handleSubmitAbsen} style={styles.btnSave}>Simpan Absen</button>
                  </>
                ) : (
                  <p style={{color:'#999', textAlign:'center'}}>Tidak ada jadwal hari ini.</p>
                )}
              </div>
            </div>

            {/* JADWAL MENDATANG */}
            <div style={styles.cardSide}>
              <h3>📅 Mendatang</h3>
              {upcomingClasses.length === 0 && <small>Kosong</small>}
              {upcomingClasses.map((item, idx) => (
                <div key={idx} style={{borderBottom:'1px solid #eee', padding:'10px 0'}}>
                  <b>{item.dateStr}</b><br/>
                  {item.title} ({item.planet})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5', fontFamily: 'sans-serif' },
  header: { background: '#2980b9', padding: '20px', display: 'flex', justifyContent: 'space-between' },
  btnLogout: { background: 'none', border: '1px solid white', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' },
  content: { padding: '30px', maxWidth: '1000px', margin: '0 auto' },
  lockBox: { background: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center', maxWidth: '300px', margin: '50px auto' },
  inputCode: { fontSize: '20px', padding: '10px', textAlign: 'center', marginBottom: '10px', width: '100%' },
  btnUnlock: { width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' },
  card: { background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  cardHeader: { background: '#34495e', padding: '10px 20px' },
  btnSave: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  cardSide: { background: 'white', padding: '20px', borderRadius: '10px' }
};

export default TeacherDashboard;