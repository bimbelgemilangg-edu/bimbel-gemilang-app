import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import ClassSession from './ClassSession';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [guru, setGuru] = useState(null);
  const [todaySchedules, setTodaySchedules] = useState([]);      
  const [upcomingSchedules, setUpcomingSchedules] = useState([]); 
  const [otherSchedules, setOtherSchedules] = useState([]);       
  const [mode, setMode] = useState('dashboard'); 
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [substituteMode, setSubstituteMode] = useState(false); 
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("Mengajar");
  const [pendingSchedule, setPendingSchedule] = useState(null);

  useEffect(() => {
    const init = async () => {
      const sessionGuru = location.state?.teacher;
      // FIX: Jika refresh, kembalikan ke Login Utama
      if (!sessionGuru) { navigate('/'); return; }
      setGuru(sessionGuru);

      const todayStr = new Date().toISOString().split('T')[0];
      
      // 1. Ambil Jadwal Saya
      const qMySched = query(collection(db, "jadwal_bimbel"), where("booker", "==", sessionGuru.nama));
      const snapMy = await getDocs(qMySched);
      const allMySched = snapMy.docs.map(d => ({id: d.id, ...d.data()}));

      const todays = [];
      const upcomings = [];

      allMySched.forEach(item => {
        if (item.dateStr === todayStr) todays.push(item);
        else if (item.dateStr > todayStr) upcomings.push(item);
      });

      todays.sort((a,b) => a.start.localeCompare(b.start));
      upcomings.sort((a,b) => new Date(a.dateStr) - new Date(b.dateStr));

      setTodaySchedules(todays);
      setUpcomingSchedules(upcomings);

      // 2. Ambil Jadwal Guru Lain (Untuk Mode Pengganti)
      const qOthers = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr));
      const snapOthers = await getDocs(qOthers);
      const othersData = snapOthers.docs.map(d => ({id: d.id, ...d.data()})).filter(s => s.booker !== sessionGuru.nama); 
      setOtherSchedules(othersData);
    };
    init();
  }, []);

  const handleInitStart = (sched) => {
    setPendingSchedule(sched);
    setInputToken("");
    if (sched.program === 'English') setSelectedActivity("English Course");
    else setSelectedActivity("Mengajar");
    setShowStartModal(true);
  };

  const confirmStartClass = async (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const codeRef = doc(db, "settings", `daily_code_${today}`);
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists() || codeSnap.data().code.toUpperCase() !== inputToken.toUpperCase()) {
        alert("⛔ Kode Harian Salah!"); return;
    }
    const finalSchedule = { ...pendingSchedule, actualActivity: selectedActivity, actualTeacher: guru.nama };
    setActiveSchedule(finalSchedule);
    setMode('session');
    setShowStartModal(false);
  };

  if (mode === 'session') return <ClassSession schedule={activeSchedule} teacher={guru} onBack={() => { setMode('dashboard'); window.location.reload(); }} />;

  const formatDateIndo = (dateStr) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  return (
    <div style={{minHeight:'100vh', background:'#f4f7f6', fontFamily:'sans-serif', paddingBottom:50}}>
      {/* HEADER DENGAN TOMBOL LENGKAP */}
      <div style={{background:'#2c3e50', padding:'20px 30px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
        <div>
            <h2 style={{margin:0, fontSize:22}}>Halo, {guru?.nama} 👋</h2>
            <small style={{opacity:0.8}}>Dashboard Guru Profesional</small>
        </div>
        <div style={{display:'flex', gap:10}}>
             
             {/* --- 1. TOMBOL UNGU: INPUT NILAI (YANG DICARI BOS) --- */}
             <button 
                onClick={() => navigate('/guru/grades/input', { state: { teacher: guru } })} 
                style={{background:'#8e44ad', border:'none', color:'white', borderRadius:20, padding:'8px 15px', cursor:'pointer', fontWeight:'bold', fontSize:13, display:'flex', alignItems:'center', gap:5}}
             >
                📝 Input Nilai
             </button>
             {/* ---------------------------------------------------- */}

             {/* 2. TOMBOL BIRU: RIWAYAT */}
             <button onClick={() => navigate('/guru/history', { state: { teacher: guru } })} style={{background:'#3498db', border:'none', color:'white', borderRadius:20, padding:'8px 15px', cursor:'pointer', fontWeight:'bold', fontSize:13, display:'flex', alignItems:'center', gap:5}}>📄 Riwayat</button>
             
             {/* 3. TOMBOL MERAH: SUSULAN */}
             <button onClick={() => navigate('/guru/manual-input', { state: { teacher: guru } })} style={{background:'#e74c3c', border:'none', color:'white', borderRadius:20, padding:'8px 15px', cursor:'pointer', fontWeight:'bold', fontSize:13, display:'flex', alignItems:'center', gap:5}}>⚠️ Susulan</button>
             
             {/* 4. TOMBOL ORANGE: MODE PENGGANTI */}
             <button onClick={() => setSubstituteMode(!substituteMode)} style={{background: substituteMode ? '#e67e22' : 'transparent', border:'1px solid #e67e22', color: substituteMode ? 'white' : '#e67e22', padding:'8px 15px', borderRadius:20, cursor:'pointer', fontWeight:'bold', fontSize:13}}>{substituteMode ? "Kembali" : "🔄 Mode Pengganti"}</button>
             
             {/* 5. TOMBOL KELUAR (FIX: Ke Halaman Utama) */}
             <button onClick={()=>navigate('/')} style={{background:'#c0392b', border:'none', color:'white', borderRadius:20, padding:'8px 15px', cursor:'pointer', fontSize:13}}>Keluar</button>
        </div>
      </div>

      <div style={{padding:'30px', maxWidth:800, margin:'0 auto'}}>
        {substituteMode ? (
            <div>
                <div style={{background:'#fff3e0', borderLeft:'5px solid #e67e22', padding:15, marginBottom:20, borderRadius:5}}>
                    <h3 style={{margin:0, color:'#d35400'}}>⚠️ Mode Guru Pengganti (Switch)</h3>
                    <p style={{margin:'5px 0 0 0', fontSize:14, color:'#666'}}>Anda sedang melihat jadwal guru lain hari ini. Klik "Gantikan" untuk mengambil alih kelas.</p>
                </div>
                {otherSchedules.map(item => (
                    <div key={item.id} style={styles.cardSwitch}>
                        <div style={{fontWeight:'bold', fontSize:16}}>{item.start} - {item.end}</div>
                        <div style={{fontSize:14, margin:'5px 0'}}><b>{item.title}</b> <br/>Guru Asli: {item.booker} | {item.planet}</div>
                        <button onClick={() => handleInitStart(item)} style={styles.btnSwitch}>✋ SAYA GANTIKAN KELAS INI</button>
                    </div>
                ))}
                {otherSchedules.length === 0 && <p style={{textAlign:'center', color:'#999'}}>Tidak ada jadwal guru lain hari ini.</p>}
            </div>
        ) : (
            <>
                <h3 style={{borderBottom:'2px solid #2c3e50', paddingBottom:10, marginBottom:20, color:'#2c3e50'}}>🚀 Aksi Hari Ini</h3>
                {todaySchedules.length === 0 ? (
                    <div style={{textAlign:'center', padding:30, background:'white', borderRadius:10, color:'#999', marginBottom:40}}>🏝️ Tidak ada jadwal mengajar hari ini. Istirahatlah!</div>
                ) : (
                    todaySchedules.map(item => (
                        <div key={item.id} style={styles.cardActive}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div><span style={{background:'#27ae60', color:'white', padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:'bold', marginRight:10}}>SEKARANG</span><span style={{fontSize:20, fontWeight:'bold', color:'#2c3e50'}}>{item.start} - {item.end}</span></div>
                                <div style={{textAlign:'right'}}><span style={{background: item.program==='English'?'#f1c40f':'#3498db', color:'white', padding:'4px 10px', borderRadius:15, fontSize:12, fontWeight:'bold'}}>{item.program}</span></div>
                            </div>
                            <div style={{margin:'15px 0', padding:'15px', background:'#f8f9fa', borderRadius:8}}>
                                <div style={{fontSize:16, fontWeight:'bold', color:'#34495e'}}>{item.title}</div>
                                <div style={{fontSize:13, color:'#7f8c8d', marginTop:5}}>Level: {item.level} | Ruangan: {item.planet}</div>
                            </div>
                            <button onClick={() => handleInitStart(item)} style={styles.btnStart}>▶ MULAI KELAS & ABSEN</button>
                        </div>
                    ))
                )}
                <h3 style={{borderBottom:'2px solid #bdc3c7', paddingBottom:10, marginBottom:20, marginTop:40, color:'#7f8c8d'}}>📅 Agenda Mendatang</h3>
                {upcomingSchedules.length === 0 ? <p style={{color:'#999'}}>Belum ada jadwal masa depan.</p> : upcomingSchedules.map((item, index) => {
                        const showHeader = index === 0 || item.dateStr !== upcomingSchedules[index-1].dateStr;
                        return (
                            <div key={item.id}>
                                {showHeader && <div style={{margin:'25px 0 10px 0', fontWeight:'bold', color:'#2c3e50', fontSize:15}}>{formatDateIndo(item.dateStr)}</div>}
                                <div style={styles.cardFuture}><div style={{display:'flex', gap:15, alignItems:'center'}}><div style={{minWidth:80, fontWeight:'bold', color:'#2980b9'}}>{item.start}</div><div style={{flex:1}}><div style={{fontWeight:'bold'}}>{item.title}</div><div style={{fontSize:12, color:'#666'}}>{item.program} ({item.level}) | {item.planet}</div></div></div></div>
                            </div>
                        );
                    })}
            </>
        )}
      </div>
      {showStartModal && pendingSchedule && (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={{marginTop:0}}>🚀 Persiapan Kelas</h3>
                <p style={{fontSize:13}}>Materi: <b>{pendingSchedule.title}</b></p>
                <form onSubmit={confirmStartClass}>
                    <div style={{marginBottom:15}}>
                        <label style={styles.labelForm}>Apa kegiatan hari ini?</label>
                        <select value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)} style={styles.inputForm}>
                            <option value="Mengajar">📚 Mengajar Materi</option>
                            <option value="Ujian">📝 Ujian / Try Out</option>
                            <option value="Buat Soal">📄 Hanya Buat Soal</option>
                        </select>
                    </div>
                    <div style={{marginBottom:15}}>
                        <label style={styles.labelForm}>Kode Harian Admin</label>
                        <input type="text" placeholder="Contoh: SENIN-CERIA" value={inputToken} onChange={e => setInputToken(e.target.value)} style={styles.inputCode} autoFocus />
                    </div>
                    <button type="submit" style={styles.btnConfirm}>VERIFIKASI & MASUK</button>
                    <button type="button" onClick={()=>setShowStartModal(false)} style={styles.btnCancel}>Batal</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
    cardActive: { background:'white', padding:20, borderRadius:12, boxShadow:'0 4px 15px rgba(0,0,0,0.08)', marginBottom:20, borderLeft:'6px solid #27ae60' },
    cardFuture: { background:'white', padding:'15px 20px', borderRadius:8, boxShadow:'0 2px 5px rgba(0,0,0,0.03)', marginBottom:10, borderLeft:'4px solid #bdc3c7' },
    cardSwitch: { background:'white', padding:15, borderRadius:8, marginBottom:10, borderLeft:'4px solid #e67e22', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
    btnStart: { width:'100%', padding:12, background:'#27ae60', color:'white', border:'none', borderRadius:8, fontWeight:'bold', fontSize:14, cursor:'pointer', marginTop:10 },
    btnSwitch: { marginTop:10, padding:'8px 15px', background:'#e67e22', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold' },
    overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999 },
    modal: { background:'white', padding:25, borderRadius:10, width:'85%', maxWidth:350 },
    inputForm: { width:'100%', padding:10, borderRadius:5, border:'1px solid #ddd' },
    inputCode: { width:'100%', padding:10, borderRadius:5, border:'2px solid #3498db', textAlign:'center', textTransform:'uppercase', boxSizing:'border-box', fontSize:16, letterSpacing:2 },
    labelForm: { display:'block', fontSize:12, fontWeight:'bold', marginBottom:5, color:'#555' },
    btnConfirm: { width:'100%', padding:12, background:'#2980b9', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer' },
    btnCancel: { width:'100%', marginTop:10, background:'transparent', border:'none', color:'#999', cursor:'pointer' }
};

export default TeacherDashboard;