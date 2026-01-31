import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs } from "firebase/firestore";
import ClassSession from './ClassSession'; // Import file yang baru kita buat

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [guru, setGuru] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // STATE NAVIGASI: Apakah sedang lihat jadwal atau sedang mengajar?
  // Mode: 'dashboard' (Jadwal) atau 'session' (Mengajar)
  const [mode, setMode] = useState('dashboard');
  const [activeSchedule, setActiveSchedule] = useState(null);

  // 1. INIT SESI AMAN
  useEffect(() => {
    const init = async () => {
      const sessionGuru = location.state?.teacher;
      if (!sessionGuru) { navigate('/login-guru'); return; }
      setGuru(sessionGuru);

      // AMBIL JADWAL GURU DARI DATABASE (Jadwal Bimbel)
      // Kita cari jadwal dimana 'booker' (Nama Guru) sama dengan nama guru ini
      try {
        const q = query(collection(db, "jadwal_bimbel"), where("booker", "==", sessionGuru.nama));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        
        // Filter jadwal seminggu kedepan (Opsional, sementara tampilkan semua milik dia)
        // Sortir berdasarkan tanggal & jam
        data.sort((a,b) => new Date(a.dateStr + ' ' + a.start) - new Date(b.dateStr + ' ' + b.start));
        
        setSchedules(data);
      } catch (e) {
        console.error("Gagal ambil jadwal:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate, location]);

  const handleLogout = () => navigate('/login-guru');

  // LOGIKA TOMBOL MULAI
  const checkCanStart = (sched) => {
    const now = new Date();
    const schedDate = new Date(sched.dateStr + ' ' + sched.start);
    const schedEnd = new Date(sched.dateStr + ' ' + sched.end);
    
    // Tombol aktif jika:
    // 1. Tanggalnya HARI INI
    // 2. Jam sekarang sudah masuk waktu mulai (atau telat)
    // 3. Jam sekarang belum lewat waktu selesai
    // (Bisa dikasih toleransi misal boleh buka 15 menit sebelum mulai)
    
    // Simplifikasi Logic untuk Demo: Cek Tanggal Saja dulu
    const todayStr = now.toISOString().split('T')[0];
    if (sched.dateStr !== todayStr) return false; // Bukan hari ini

    // Cek Jam (Opsional: Aktifkan jika ingin strict jam)
    // const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // const startMinutes = schedDate.getHours() * 60 + schedDate.getMinutes();
    // if (currentMinutes < startMinutes - 15) return false; // Belum waktunya (toleransi 15 mnt)

    return true; 
  };

  const handleStartClass = (sched) => {
    setActiveSchedule(sched);
    setMode('session'); // PINDAH TAMPILAN KE FILE ClassSession
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Memuat Jadwal...</div>;

  // --- TAMPILAN 1: MODE MENGAJAR (Panggil File Sebelah) ---
  if (mode === 'session' && activeSchedule) {
    return (
      <ClassSession 
        schedule={activeSchedule} 
        teacher={guru} 
        onBack={() => {
            setMode('dashboard');
            setActiveSchedule(null);
            // Reload jadwal bisa ditaruh disini kalau perlu update status
        }} 
      />
    );
  }

  // --- TAMPILAN 2: MODE JADWAL (DEFAULT) ---
  return (
    <div style={{minHeight:'100vh', background:'#f4f7f6', fontFamily:'sans-serif'}}>
      <div style={{background:'#2c3e50', padding:20, color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
            <h2 style={{margin:0}}>Halo, {guru?.nama} 👋</h2>
            <small>Jadwal Mengajar Anda</small>
        </div>
        <button onClick={handleLogout} style={{background:'#c0392b', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer'}}>Logout</button>
      </div>

      <div style={{padding:20, maxWidth:600, margin:'0 auto'}}>
        {schedules.length === 0 ? (
            <div style={{textAlign:'center', padding:40, color:'#999'}}>Belum ada jadwal yang diassign Admin ke Anda.</div>
        ) : (
            schedules.map(item => {
                const isActive = checkCanStart(item);
                const isDone = false; // Nanti bisa cek di log apakah sudah selesai

                return (
                    <div key={item.id} style={{
                        background:'white', 
                        padding:20, 
                        borderRadius:10, 
                        marginBottom:15, 
                        boxShadow:'0 2px 5px rgba(0,0,0,0.05)',
                        borderLeft: isActive ? '5px solid #27ae60' : '5px solid #bdc3c7',
                        opacity: isActive ? 1 : 0.7
                    }}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                            <span style={{fontWeight:'bold', fontSize:18, color:'#2c3e50'}}>{item.start} - {item.end}</span>
                            <span style={{fontSize:12, background:'#eee', padding:'2px 8px', borderRadius:4}}>{item.dateStr}</span>
                        </div>
                        
                        <h3 style={{margin:'0 0 5px 0', color:'#34495e'}}>{item.planet} ({item.type})</h3>
                        <p style={{margin:0, color:'#7f8c8d'}}>{item.title}</p>
                        <p style={{fontSize:12, color:'#95a5a6'}}>Siswa: {item.students?.length || 0} orang</p>

                        <button 
                            disabled={!isActive}
                            onClick={() => handleStartClass(item)}
                            style={{
                                width:'100%', 
                                marginTop:15, 
                                padding:12, 
                                background: isActive ? '#3498db' : '#ecf0f1', 
                                color: isActive ? 'white' : '#bdc3c7', 
                                border:'none', 
                                borderRadius:5, 
                                fontWeight:'bold', 
                                cursor: isActive ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {isActive ? "MULAI MENGAJAR ▶" : "Belum Waktunya / Selesai"}
                        </button>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;