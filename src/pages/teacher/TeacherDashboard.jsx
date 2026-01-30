import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. AMBIL NAMA GURU DARI LOGIN
  const teacherName = location.state?.teacherName || "Guru Gemilang";

  // --- STATE ---
  const [isLocked, setIsLocked] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [todayClass, setTodayClass] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  
  // State Absensi
  const [attendance, setAttendance] = useState({}); // { id_siswa: 'Hadir' }

  // --- 2. SMART LOGIC: LOAD DATA DARI ADMIN (LOCALSTORAGE) ---
  useEffect(() => {
    // A. Ambil Data Jadwal Global
    const savedSchedules = localStorage.getItem("DB_SCHEDULES"); // Nanti pastikan Admin save ke sini
    
    // DATA DUMMY (JIKA ADMIN BELUM ISI DATA, UNTUK DEMO)
    // Supaya layar tidak blank saat Anda mencoba pertama kali
    const demoSchedules = savedSchedules ? JSON.parse(savedSchedules) : [
      {
        id: 1,
        planet: "MERKURIUS",
        dateStr: new Date().toISOString().split('T')[0], // HARI INI
        start: "14:00",
        end: "15:30",
        title: "Matematika Dasar",
        booker: teacherName, // Milik Guru yang Login
        students: [
          { id: 101, nama: "Adit Sopo", kelas: "4 SD" },
          { id: 102, nama: "Jarwo Kuat", kelas: "4 SD" }
        ]
      },
      {
        id: 2,
        planet: "VENUS",
        dateStr: "2026-02-05", // MINGGU DEPAN
        start: "16:00",
        end: "17:30",
        title: "Bahasa Inggris",
        booker: teacherName,
        students: []
      }
    ];

    // B. Filter Jadwal Milik Guru Ini
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Jadwal Hari Ini
    const today = demoSchedules.find(s => s.booker === teacherName && s.dateStr === todayStr);
    setTodayClass(today);

    // Jadwal Mendatang (Filter tanggal > hari ini)
    const upcoming = demoSchedules.filter(s => s.booker === teacherName && s.dateStr > todayStr);
    setUpcomingClasses(upcoming);

    // C. Siapkan State Absensi Default
    if (today && today.students) {
      const initialAbsen = {};
      today.students.forEach(s => initialAbsen[s.id] = "Hadir");
      setAttendance(initialAbsen);
    }

  }, [teacherName]);

  // --- 3. LOGIKA UNLOCK KELAS ---
  const handleUnlock = (e) => {
    e.preventDefault();
    // Ambil kode asli yang diset Admin
    const adminCode = localStorage.getItem("DAILY_TEACHER_CODE") || "GEMILANG-2026"; // Default jika admin lupa set
    
    if (inputCode === adminCode) {
      setIsLocked(false);
      alert(`🔓 KELAS TERBUKA!\nSelamat mengajar, ${teacherName}.`);
    } else {
      alert("⛔ KODE SALAH!\nSilakan minta kode harian terbaru ke Admin.");
    }
  };

  // --- 4. SIMPAN ABSENSI ---
  const handleSubmitAbsen = () => {
    // Disini logika simpan ke database
    console.log("Data Absensi:", attendance);
    alert("✅ Absensi Berhasil Disimpan!\nTerima kasih telah mengajar.");
    // Bisa redirect atau disable tombol
  };

  const handleAbsenChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={{margin:0, color:'white'}}>Halo, {teacherName} 👋</h2>
          <p style={{margin:0, color:'#dbeafe', fontSize:'14px'}}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => navigate('/')} style={styles.btnLogout}>Keluar</button>
      </div>

      <div style={styles.content}>

        {/* --- SCREEN 1: TERKUNCI --- */}
        {isLocked ? (
          <div style={styles.lockWrapper}>
            <div style={styles.lockBox}>
              <div style={styles.lockIcon}>🔒</div>
              <h3 style={{color: '#2c3e50'}}>Kelas Terkunci</h3>
              <p style={{color: '#7f8c8d', fontSize: '14px'}}>
                Masukkan <b>Kode Akses Harian</b> dari Admin untuk membuka jadwal dan absensi.
              </p>
              <form onSubmit={handleUnlock} style={{marginTop: '20px'}}>
                <input 
                  type="text" 
                  placeholder="Kode Akses..." 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  style={styles.inputCode}
                />
                <button type="submit" style={styles.btnUnlock}>BUKA KELAS</button>
              </form>
            </div>
          </div>
        ) : (

          /* --- SCREEN 2: TERBUKA (DASHBOARD) --- */
          <div style={styles.grid}>
            
            {/* KOLOM KIRI: KELAS HARI INI */}
            <div style={styles.mainCol}>
              {todayClass ? (
                <div style={styles.activeCard}>
                  <div style={styles.cardHeader}>
                    <span style={styles.badgeLive}>SEDANG BERLANGSUNG</span>
                    <span style={{fontWeight:'bold', color:'white'}}>{todayClass.start} - {todayClass.end}</span>
                  </div>
                  
                  <div style={styles.classInfo}>
                    <h1 style={{margin:'10px 0', color:'#2c3e50'}}>🪐 {todayClass.planet}</h1>
                    <h3 style={{margin:0, color:'#2980b9'}}>{todayClass.title}</h3>
                    <p style={{color:'#7f8c8d', fontSize:'14px'}}>Total Siswa: {todayClass.students.length} orang</p>
                  </div>

                  {/* TABEL ABSENSI */}
                  <div style={styles.attendanceBox}>
                    <h4 style={{borderBottom:'1px solid #eee', paddingBottom:'10px', marginTop:0}}>📝 Absensi Siswa</h4>
                    
                    {todayClass.students.length === 0 ? (
                      <p style={{fontStyle:'italic', color:'#999'}}>Tidak ada siswa terdaftar di jadwal ini.</p>
                    ) : (
                      <table style={styles.table}>
                        <thead>
                          <tr style={{textAlign:'left', color:'#999', fontSize:'12px'}}>
                            <th>NAMA SISWA</th>
                            <th>KELAS</th>
                            <th style={{textAlign:'right'}}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todayClass.students.map(student => (
                            <tr key={student.id} style={{borderBottom:'1px solid #f9f9f9'}}>
                              <td style={{padding:'10px 0', fontWeight:'bold'}}>{student.nama}</td>
                              <td style={{color:'#777'}}>{student.kelas}</td>
                              <td style={{textAlign:'right'}}>
                                <select 
                                  style={styles.selectStatus}
                                  value={attendance[student.id]}
                                  onChange={(e) => handleAbsenChange(student.id, e.target.value)}
                                >
                                  <option value="Hadir">Hadir</option>
                                  <option value="Sakit">Sakit</option>
                                  <option value="Izin">Izin</option>
                                  <option value="Alpha">Alpha</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    
                    <button onClick={handleSubmitAbsen} style={styles.btnSubmit}>
                      ✅ Simpan & Selesai Mengajar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <h3>🏖️ Tidak Ada Jadwal Hari Ini</h3>
                  <p>Anda tidak memiliki jadwal mengajar hari ini. Silakan cek jadwal mendatang.</p>
                </div>
              )}
            </div>

            {/* KOLOM KANAN: JADWAL MENDATANG */}
            <div style={styles.sideCol}>
              <div style={styles.sideCard}>
                <h3 style={styles.sideTitle}>📅 Jadwal Minggu Depan</h3>
                
                {upcomingClasses.length === 0 ? (
                  <p style={{color:'#999', fontSize:'13px'}}>Belum ada jadwal mendatang.</p>
                ) : (
                  <div style={styles.listSchedule}>
                    {upcomingClasses.map((item) => (
                      <div key={item.id} style={styles.scheduleItem}>
                        <div style={styles.dateBox}>
                          <span style={{fontSize:'12px', fontWeight:'bold'}}>{item.dateStr.split('-')[2]}</span>
                          <span style={{fontSize:'10px'}}>BLN INI</span>
                        </div>
                        <div>
                          <div style={{fontWeight:'bold', color:'#2c3e50'}}>{item.title}</div>
                          <div style={{fontSize:'12px', color:'#7f8c8d'}}>
                            {item.planet} • {item.start}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* INFO TAMBAHAN */}
              <div style={{...styles.sideCard, marginTop:'20px', background:'#e8f6f3', border:'1px solid #d1f2eb'}}>
                <h4 style={{margin:'0 0 10px 0', color:'#16a085'}}>💡 Info Guru</h4>
                <p style={{fontSize:'12px', color:'#16a085', margin:0}}>
                  Pastikan mengisi absensi sebelum meninggalkan kelas. Honor dihitung otomatis berdasarkan kehadiran.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

// --- STYLING MODERN (User Friendly) ---
const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5', fontFamily: 'sans-serif' },
  header: { background: '#3498db', padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(52, 152, 219, 0.2)' },
  btnLogout: { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  content: { padding: '30px 5%', maxWidth: '1200px', margin: '0 auto' },

  // Lock Screen
  lockWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' },
  lockBox: { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center', width: '100%', maxWidth: '350px' },
  lockIcon: { fontSize: '40px', marginBottom: '10px' },
  inputCode: { width: '100%', padding: '15px', textAlign: 'center', fontSize: '20px', letterSpacing: '3px', border: '2px solid #eee', borderRadius: '10px', marginBottom: '15px', boxSizing: 'border-box', fontWeight: 'bold', outline: 'none' },
  btnUnlock: { width: '100%', padding: '15px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px' },

  // Dashboard Layout
  grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' },
  
  // Active Class Card
  activeCard: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
  cardHeader: { background: '#2c3e50', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badgeLive: { background: '#e74c3c', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' },
  classInfo: { padding: '25px', borderBottom: '1px solid #eee', background: '#f8f9fa' },
  
  attendanceBox: { padding: '25px' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
  selectStatus: { padding: '8px', borderRadius: '5px', border: '1px solid #ddd', background: 'white' },
  btnSubmit: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },

  emptyState: { textAlign: 'center', padding: '50px', background: 'white', borderRadius: '15px', color: '#999' },

  // Sidebar
  sideCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  sideTitle: { margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#2c3e50' },
  listSchedule: { display: 'flex', flexDirection: 'column', gap: '15px' },
  scheduleItem: { display: 'flex', gap: '10px', alignItems: 'center' },
  dateBox: { background: '#ebf5fb', color: '#3498db', padding: '8px', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', minWidth: '40px' }
};

// Media Query untuk Responsif (Optional simple check)
if (window.innerWidth < 768) {
  styles.grid.gridTemplateColumns = '1fr';
}

export default TeacherDashboard;