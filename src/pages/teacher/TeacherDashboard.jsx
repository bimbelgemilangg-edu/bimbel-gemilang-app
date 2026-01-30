import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const teacherName = location.state?.teacherName || "Guru"; // Ambil nama dari Login

  // STATE
  const [inputCode, setInputCode] = useState("");
  const [isClassStarted, setIsClassStarted] = useState(false); // Status Kelas Terbuka/Terkunci

  // DATA DUMMY (SINKRON DENGAN ADMIN)
  const todaySchedule = {
    planet: "MERKURIUS",
    time: "14:00 - 15:30",
    mapel: "Matematika SD",
    students: [
      { id: 1, nama: "Adit Sopo", status: "Hadir" },
      { id: 2, nama: "Jarwo Kuat", status: "Hadir" },
      { id: 3, nama: "Denis Kancil", status: "Sakit" }
    ]
  };

  const nextWeekSchedule = [
    { day: "Senin", date: "3 Feb", planet: "VENUS", time: "16:00", mapel: "B. Inggris" },
    { day: "Rabu", date: "5 Feb", planet: "MARS", time: "14:00", mapel: "Matematika" },
    { day: "Jumat", date: "7 Feb", planet: "BUMI", time: "15:30", mapel: "IPA" },
  ];

  // LOGIKA CEK KODE
  const handleStartClass = (e) => {
    e.preventDefault();
    // 1. Ambil kode asli dari Admin (LocalStorage)
    const adminCode = localStorage.getItem("DAILY_TEACHER_CODE");

    // 2. Cek kecocokan
    if (inputCode === adminCode) {
      setIsClassStarted(true);
      alert(`✅ Kode Benar!\nSelamat mengajar, ${teacherName}.`);
    } else {
      alert("⛔ Kode Salah! Silakan minta kode harian ke Admin.");
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={{margin:0, color:'white'}}>Halo, {teacherName} 👋</h2>
          <p style={{margin:0, color:'#ecf0f1', fontSize:'14px'}}>Dashboard Guru</p>
        </div>
        <button onClick={() => navigate('/')} style={styles.btnLogout}>Keluar</button>
      </div>

      <div style={styles.content}>
        
        {/* --- JIKA KELAS BELUM DIMULAI --- */}
        {!isClassStarted ? (
          <div style={styles.lockScreen}>
            <div style={styles.lockBox}>
              <h3 style={{marginTop:0}}>🔒 Kelas Terkunci</h3>
              <p>Silakan masukkan <b>Kode Akses Harian</b> dari Admin untuk melihat jadwal hari ini dan melakukan absensi.</p>
              
              <form onSubmit={handleStartClass} style={{marginTop:'20px'}}>
                <input 
                  type="text" 
                  placeholder="Masukkan Kode Admin..." 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  style={styles.inputCode}
                />
                <button type="submit" style={styles.btnStart}>MULAI KELAS</button>
              </form>
            </div>
          </div>
        ) : (
          
          /* --- JIKA KELAS SUDAH DIMULAI (KODE BENAR) --- */
          <div style={styles.grid}>
            
            {/* KIRI: KELAS HARI INI & ABSENSI */}
            <div>
              <div style={styles.cardActive}>
                <div style={styles.cardHeader}>
                  <h3 style={{margin:0}}>📍 Jadwal Hari Ini</h3>
                  <span style={styles.badgeLive}>SEDANG BERLANGSUNG</span>
                </div>
                
                <div style={{marginTop:'15px'}}>
                  <h1 style={{margin:0, color:'#2c3e50'}}>🪐 {todaySchedule.planet}</h1>
                  <p style={{fontSize:'18px', fontWeight:'bold', color:'#7f8c8d'}}>{todaySchedule.time}</p>
                  <p style={{color:'#3498db', fontWeight:'bold'}}>{todaySchedule.mapel}</p>
                </div>

                <div style={styles.studentList}>
                  <h4 style={{borderBottom:'1px solid #eee', paddingBottom:'10px'}}>📝 Absensi Siswa</h4>
                  <table style={styles.table}>
                    <tbody>
                      {todaySchedule.students.map(s => (
                        <tr key={s.id}>
                          <td>{s.nama}</td>
                          <td style={{textAlign:'right'}}>
                            <select style={styles.selectAbsen}>
                              <option>Hadir</option>
                              <option>Sakit</option>
                              <option>Izin</option>
                              <option>Alpha</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button style={styles.btnFinish}>✅ Simpan Absensi & Selesai</button>
                </div>
              </div>
            </div>

            {/* KANAN: JADWAL MINGGU DEPAN */}
            <div>
              <div style={styles.card}>
                <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>📅 Jadwal Minggu Depan</h3>
                <div style={styles.listNext}>
                  {nextWeekSchedule.map((item, idx) => (
                    <div key={idx} style={styles.nextItem}>
                      <div style={styles.dateBox}>
                        <span style={{fontWeight:'bold'}}>{item.day}</span>
                        <small>{item.date}</small>
                      </div>
                      <div style={{flex:1}}>
                        <b>{item.mapel}</b>
                        <div style={{fontSize:'12px', color:'#7f8c8d'}}>{item.planet} • {item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

// CSS
const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5', fontFamily: 'sans-serif' },
  header: { background: '#2980b9', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' },
  btnLogout: { background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  content: { padding: '30px', maxWidth: '1100px', margin: '0 auto' },

  // Lock Screen
  lockScreen: { display: 'flex', justifyContent: 'center', marginTop: '50px' },
  lockBox: { background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' },
  inputCode: { width: '100%', padding: '15px', fontSize: '18px', textAlign: 'center', border: '2px solid #ddd', borderRadius: '5px', marginBottom: '15px', boxSizing:'border-box', letterSpacing:'2px' },
  btnStart: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },

  // Grid Layout
  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' },
  
  // Card Active
  cardActive: { background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderTop: '5px solid #27ae60' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badgeLive: { background: '#ffebee', color: '#c0392b', padding: '5px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', animation: 'pulse 2s infinite' },
  
  studentList: { marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed #ddd' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  selectAbsen: { padding: '8px', borderRadius: '5px', border: '1px solid #ccc' },
  btnFinish: { width: '100%', padding: '15px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' },

  // Next Schedule
  card: { background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  listNext: { display: 'flex', flexDirection: 'column', gap: '15px' },
  nextItem: { display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #f9f9f9', paddingBottom: '10px' },
  dateBox: { background: '#e8f6f3', color: '#16a085', padding: '10px', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', minWidth: '50px' }
};

export default TeacherDashboard;