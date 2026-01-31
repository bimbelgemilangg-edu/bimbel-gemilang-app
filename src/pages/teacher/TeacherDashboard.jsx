import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import ClassSession from './ClassSession';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [guru, setGuru] = useState(null);
  const [mySchedules, setMySchedules] = useState([]); // Jadwal Saya
  const [otherSchedules, setOtherSchedules] = useState([]); // Jadwal Guru Lain (Untuk Switch)
  
  const [mode, setMode] = useState('dashboard'); // 'dashboard', 'switch', 'session'
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [substituteMode, setSubstituteMode] = useState(false); // Mode Guru Pengganti

  // POPUP SECURITY & ACTIVITY
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("Mengajar"); // Default
  const [pendingSchedule, setPendingSchedule] = useState(null);

  useEffect(() => {
    const init = async () => {
      const sessionGuru = location.state?.teacher;
      if (!sessionGuru) { navigate('/login-guru'); return; }
      setGuru(sessionGuru);

      // AMBIL SEMUA JADWAL HARI INI
      const today = new Date().toISOString().split('T')[0];
      const q = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", today));
      const snap = await getDocs(q);
      const allToday = snap.docs.map(d => ({id: d.id, ...d.data()}));
      
      // PISAHKAN: Jadwal Saya vs Jadwal Orang Lain
      const mine = allToday.filter(s => s.booker === sessionGuru.nama);
      const others = allToday.filter(s => s.booker !== sessionGuru.nama); // Yang bisa digantikan
      
      // Sort jam
      mine.sort((a,b) => a.start.localeCompare(b.start));
      others.sort((a,b) => a.start.localeCompare(b.start));

      setMySchedules(mine);
      setOtherSchedules(others);
    };
    init();
  }, []);

  // 1. KLIK MULAI -> BUKA POPUP KONFIRMASI
  const handleInitStart = (sched) => {
    setPendingSchedule(sched);
    setInputToken("");
    // Reset activity default based on program
    if (sched.program === 'English') setSelectedActivity("English Course");
    else setSelectedActivity("Mengajar");
    
    setShowStartModal(true);
  };

  // 2. VERIFIKASI & SET ACTIVITY
  const confirmStartClass = async (e) => {
    e.preventDefault();
    
    // Verifikasi Token
    const today = new Date().toISOString().split('T')[0];
    const codeRef = doc(db, "settings", `daily_code_${today}`);
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists() || codeSnap.data().code.toUpperCase() !== inputToken.toUpperCase()) {
        alert("⛔ Kode Harian Salah!"); return;
    }

    // UPDATE JADWAL DENGAN AKTIVITAS YANG DIPILIH
    // Kita "Inject" pilihan guru ke dalam object schedule yang akan dibawa ke ClassSession
    const finalSchedule = {
        ...pendingSchedule,
        actualActivity: selectedActivity, // "Mengajar", "Ujian", "English Course"
        actualTeacher: guru.nama // Menandakan siapa yang SEBENARNYA mengajar (untuk kasus Switch)
    };

    setActiveSchedule(finalSchedule);
    setMode('session');
    setShowStartModal(false);
  };

  if (mode === 'session') {
    return <ClassSession schedule={activeSchedule} teacher={guru} onBack={() => { setMode('dashboard'); window.location.reload(); }} />;
  }

  return (
    <div style={{minHeight:'100vh', background:'#f4f7f6', fontFamily:'sans-serif', paddingBottom:50}}>
      {/* HEADER */}
      <div style={{background:'#2c3e50', padding:20, color:'white', display:'flex', justifyContent:'space-between'}}>
        <div>
            <h3 style={{margin:0}}>Halo, {guru?.nama} 👋</h3>
            <small>Dashboard Guru</small>
        </div>
        <button onClick={()=>navigate('/login-guru')} style={{background:'red', border:'none', color:'white', borderRadius:5, padding:'5px 10px'}}>Keluar</button>
      </div>

      <div style={{padding:20, maxWidth:600, margin:'0 auto'}}>
        
        {/* TOMBOL TOGGLE SWITCH GURU */}
        <button 
            onClick={() => setSubstituteMode(!substituteMode)}
            style={{width:'100%', padding:12, marginBottom:20, background: substituteMode ? '#e67e22' : '#ecf0f1', color: substituteMode ? 'white' : '#7f8c8d', border:'none', borderRadius:8, fontWeight:'bold'}}
        >
            {substituteMode ? "🔄 KEMBALI KE JADWAL SAYA" : "🔄 SAYA GURU PENGGANTI (SWITCH)"}
        </button>

        {substituteMode ? (
            /* --- MODE GURU PENGGANTI --- */
            <div>
                <h4 style={{color:'#e67e22'}}>Daftar Kelas Guru Lain (Hari Ini)</h4>
                <p style={{fontSize:12, color:'#666'}}>Klik untuk mengambil alih kelas jika guru asli berhalangan.</p>
                {otherSchedules.map(item => (
                    <div key={item.id} style={{background:'white', padding:15, borderRadius:8, marginBottom:10, borderLeft:'4px solid #e67e22'}}>
                        <div style={{fontWeight:'bold'}}>{item.start} - {item.end}</div>
                        <div>{item.title} (Guru Asli: {item.booker})</div>
                        <button onClick={() => handleInitStart(item)} style={{marginTop:10, padding:'8px 15px', background:'#e67e22', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>
                            ✋ GANTIKAN KELAS INI
                        </button>
                    </div>
                ))}
                {otherSchedules.length === 0 && <p>Tidak ada jadwal guru lain hari ini.</p>}
            </div>
        ) : (
            /* --- MODE JADWAL SAYA --- */
            <div>
                 <h4 style={{color:'#2c3e50'}}>Jadwal Anda Hari Ini</h4>
                 {mySchedules.length === 0 && <p style={{color:'#999'}}>Tidak ada jadwal hari ini.</p>}
                 {mySchedules.map(item => (
                    <div key={item.id} style={{background:'white', padding:15, borderRadius:8, marginBottom:10, borderLeft:'4px solid #27ae60', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <span style={{fontWeight:'bold', fontSize:16}}>{item.start} - {item.end}</span>
                            <span style={{background:'#eee', fontSize:11, padding:'2px 6px', borderRadius:4}}>{item.program}</span>
                        </div>
                        <div style={{color:'#555', marginTop:5}}>{item.title}</div>
                        <div style={{fontSize:12, color:'#999'}}>{item.level} | {item.planet}</div>
                        
                        <button onClick={() => handleInitStart(item)} style={{width:'100%', marginTop:10, padding:10, background:'#3498db', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>
                            MULAI KELAS ▶
                        </button>
                    </div>
                 ))}
            </div>
        )}

      </div>

      {/* MODAL START CLASS (PENTING: PILIH AKTIVITAS) */}
      {showStartModal && pendingSchedule && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999}}>
            <div style={{background:'white', padding:25, borderRadius:10, width:'85%', maxWidth:350}}>
                <h3 style={{marginTop:0}}>🚀 Persiapan Kelas</h3>
                <p style={{fontSize:13}}>Materi: <b>{pendingSchedule.title}</b></p>
                
                <form onSubmit={confirmStartClass}>
                    
                    {/* INPUT 1: PILIH AKTIVITAS (DINAMIS) */}
                    {pendingSchedule.program === 'Reguler' ? (
                        <div style={{marginBottom:15}}>
                            <label style={{display:'block', fontSize:12, fontWeight:'bold', marginBottom:5}}>Apa kegiatan hari ini?</label>
                            <select 
                                value={selectedActivity} 
                                onChange={e => setSelectedActivity(e.target.value)}
                                style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ddd'}}
                            >
                                <option value="Mengajar">📚 Mengajar Materi (Rate Jam)</option>
                                <option value="Ujian">📝 Ujian / Try Out (Rate Paket)</option>
                                <option value="Buat Soal">📄 Hanya Buat Soal</option>
                            </select>
                        </div>
                    ) : (
                        <div style={{marginBottom:15, padding:10, background:'#fff3cd', borderRadius:5, fontSize:12}}>
                            🔒 Program <b>English Course</b>. Tarif Flat (Paket).
                        </div>
                    )}

                    {/* INPUT 2: KODE HARIAN */}
                    <div style={{marginBottom:15}}>
                        <label style={{display:'block', fontSize:12, fontWeight:'bold', marginBottom:5}}>Kode Harian Admin</label>
                        <input 
                            type="text" 
                            placeholder="Contoh: SENIN-CERIA" 
                            value={inputToken} 
                            onChange={e => setInputToken(e.target.value)}
                            style={{width:'100%', padding:10, borderRadius:5, border:'2px solid #3498db', textAlign:'center', textTransform:'uppercase', boxSizing:'border-box'}}
                            autoFocus
                        />
                    </div>

                    <button type="submit" style={{width:'100%', padding:12, background:'#27ae60', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer'}}>
                        VERIFIKASI & MASUK
                    </button>
                    <button type="button" onClick={()=>setShowStartModal(false)} style={{width:'100%', marginTop:10, background:'transparent', border:'none', color:'#999', cursor:'pointer'}}>Batal</button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default TeacherDashboard;