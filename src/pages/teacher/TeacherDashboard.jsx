import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore"; // Ditambah deleteDoc
import ClassSession from './ClassSession';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // STATE MANAGEMENT
  const [guru, setGuru] = useState(location.state?.teacher || null); // Ambil dari state, fallback null
  const [loading, setLoading] = useState(true);
  
  // SCHEDULE STATES
  const [todaySchedules, setTodaySchedules] = useState([]);      
  const [upcomingSchedules, setUpcomingSchedules] = useState([]); 
  const [otherSchedules, setOtherSchedules] = useState([]);       
  
  // MODAL & SESSION STATES
  const [mode, setMode] = useState('dashboard'); // 'dashboard' | 'session'
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [substituteMode, setSubstituteMode] = useState(false); 
  const [showStartModal, setShowStartModal] = useState(false);
  
  // FORM STATES
  const [inputToken, setInputToken] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("Mengajar");
  const [pendingSchedule, setPendingSchedule] = useState(null);

  // 1. INITIALIZATION & DATA FETCHING
  const fetchData = useCallback(async () => {
    if (!guru) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // A. JADWAL SAYA (MY SCHEDULES)
      const qMySched = query(collection(db, "jadwal_bimbel"), where("booker", "==", guru.nama));
      const snapMy = await getDocs(qMySched);
      const allMySched = snapMy.docs.map(d => ({id: d.id, ...d.data()}));

      const todays = [];
      const upcomings = [];

      allMySched.forEach(item => {
        if (item.dateStr === todayStr) todays.push(item);
        else if (item.dateStr > todayStr) upcomings.push(item);
      });

      // Sortir Jadwal
      todays.sort((a,b) => a.start.localeCompare(b.start));
      upcomings.sort((a,b) => new Date(a.dateStr) - new Date(b.dateStr) || a.start.localeCompare(b.start));

      setTodaySchedules(todays);
      setUpcomingSchedules(upcomings);

      // B. JADWAL ORANG LAIN (UNTUK FITUR PENGGANTI)
      if (substituteMode) {
          const qOthers = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr));
          const snapOthers = await getDocs(qOthers);
          const othersData = snapOthers.docs.map(d => ({id: d.id, ...d.data()}))
                            .filter(s => s.booker !== guru.nama); // Filter jadwal bukan milik saya
          setOtherSchedules(othersData);
      }

    } catch (error) {
        console.error("Gagal memuat jadwal:", error);
    } finally {
        setLoading(false);
    }
  }, [guru, substituteMode]);

  // Efek Saat Komponen Dimuat / Guru Berubah
  useEffect(() => {
    if (!guru) {
        // Coba ambil dari localStorage jika refresh page
        const savedGuru = localStorage.getItem('teacherData');
        if (savedGuru) {
            setGuru(JSON.parse(savedGuru));
        } else {
            navigate('/login-guru'); // Redirect jika tidak ada sesi
        }
    } else {
        localStorage.setItem('teacherData', JSON.stringify(guru)); // Simpan sesi
        fetchData();
    }
  }, [guru, substituteMode, fetchData, navigate]);


  // 2. ACTION HANDLERS
  
  // Menghapus Jadwal Nyasar (Ghost Schedule)
  const handleDeleteGhost = async (id, title, date) => {
      if(window.confirm(`⚠️ Yakin hapus jadwal ini?\n"${title}" pada ${date}\n(Tindakan ini permanen)`)) {
          try {
              await deleteDoc(doc(db, "jadwal_bimbel", id));
              alert("✅ Jadwal berhasil dihapus.");
              fetchData(); // Refresh data
          } catch (error) {
              alert("Gagal menghapus: " + error.message);
          }
      }
  };

  // Persiapan Mulai Kelas
  const handleInitStart = (sched) => {
    setPendingSchedule(sched);
    setInputToken(""); // Reset input token
    
    // Auto-select activity based on program
    if (sched.program && sched.program.includes('English')) {
        setSelectedActivity("English Course");
    } else {
        setSelectedActivity("Mengajar");
    }
    
    setShowStartModal(true);
  };

  // Konfirmasi Mulai Kelas (Verifikasi Token)
  const confirmStartClass = async (e) => {
    e.preventDefault();
    try {
        const today = new Date().toISOString().split('T')[0];
        const codeRef = doc(db, "settings", `daily_code_${today}`);
        const codeSnap = await getDoc(codeRef);
        
        // Validasi Kode
        if (!codeSnap.exists() || codeSnap.data().code.toUpperCase() !== inputToken.toUpperCase().trim()) {
            alert("⛔ KODE HARIAN SALAH!\nMinta kode terbaru ke Admin."); 
            return;
        }

        // Jika Sukses -> Masuk Mode Session
        const finalSchedule = { 
            ...pendingSchedule, 
            actualActivity: selectedActivity, 
            actualTeacher: guru.nama // Override jika mode pengganti
        };
        setActiveSchedule(finalSchedule);
        setMode('session');
        setShowStartModal(false);

    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan sistem saat verifikasi.");
    }
  };

  // Helper Format Tanggal
  const formatDateIndo = (dateStr) => {
    if(!dateStr) return "-";
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  // 3. RENDER LOGIC

  // Jika sedang dalam sesi kelas -> Render Komponen ClassSession
  if (mode === 'session') {
      return (
        <ClassSession 
            schedule={activeSchedule} 
            teacher={guru} 
            onBack={() => { 
                setMode('dashboard'); 
                fetchData(); // Refresh jadwal setelah kelas selesai
            }} 
        />
      );
  }

  // Jika belum login / data guru belum siap -> Jangan render apa-apa (atau loading spinner)
  if (!guru) return <div style={{padding:50, textAlign:'center'}}>Memuat Profil Guru...</div>;

  return (
    <div style={{minHeight:'100vh', background:'#f4f7f6', fontFamily:'Segoe UI, sans-serif', paddingBottom:50}}>
      
      {/* HEADER DASHBOARD */}
      <div style={styles.headerContainer}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
            <div>
                <h2 style={{margin:0, fontSize:22, fontWeight:'600'}}>Halo, {guru.nama} 👋</h2>
                <small style={{opacity:0.8, fontSize:13}}>Dashboard Guru Bimbel Gemilang</small>
            </div>
            <button 
                onClick={()=>{
                    if(window.confirm("Keluar dari akun?")) {
                        localStorage.removeItem('teacherData');
                        navigate('/login-guru');
                    }
                }} 
                style={styles.btnLogout}
            >
                KELUAR
            </button>
        </div>

        {/* --- TOMBOL UNGU & ORANGE (INPUT & EDIT) --- */}
        <div style={{marginBottom:20, display:'flex', gap:10}}>
             <button 
                onClick={() => navigate('/guru/grades/input', { state: { teacher: guru } })} 
                style={styles.btnActionPurple}
             >
                📝 INPUT NILAI
             </button>
             <button 
                onClick={() => navigate('/guru/grades/manage', { state: { teacher: guru } })} 
                style={styles.btnActionOrange}
             >
                🛠️ EDIT
             </button>
        </div>

        {/* --- MENU NAVIGASI KECIL --- */}
        <div style={{display:'flex', gap:10, overflowX:'auto', paddingBottom:5}}>
             <button onClick={() => navigate('/guru/history', { state: { teacher: guru } })} style={styles.btnMenuSmall}>📄 Riwayat</button>
             <button onClick={() => navigate('/guru/manual-input', { state: { teacher: guru } })} style={styles.btnMenuSmall}>⚠️ Susulan</button>
             <button 
                onClick={() => setSubstituteMode(!substituteMode)} 
                style={{...styles.btnMenuSmall, background: substituteMode ? '#e67e22' : 'rgba(255,255,255,0.2)', border: substituteMode ? '1px solid white' : 'none'}}
             >
                {substituteMode ? "❌ Tutup Mode Pengganti" : "🔄 Mode Pengganti"}
            </button>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div style={{padding:'20px', maxWidth:800, margin:'0 auto'}}>
        
        {/* Loading Indicator */}
        {loading && <p style={{textAlign:'center', color:'#888'}}>Sedang memuat jadwal...</p>}

        {/* --- MODE GURU PENGGANTI --- */}
        {substituteMode ? (
            <div>
                <div style={styles.alertBox}>
                    <h3 style={{margin:0, color:'#d35400'}}>⚠️ Mode Guru Pengganti</h3>
                    <p style={{margin:'5px 0 0 0', fontSize:14, color:'#666'}}>
                        Klik "Gantikan" untuk mengajar kelas teman yang berhalangan hadir.
                    </p>
                </div>
                {otherSchedules.length === 0 ? (
                    <p style={{textAlign:'center', color:'#999', fontStyle:'italic'}}>Tidak ada jadwal guru lain hari ini.</p>
                ) : (
                    otherSchedules.map(item => (
                        <div key={item.id} style={styles.cardSwitch}>
                            <div style={{fontWeight:'bold', fontSize:16, color:'#d35400'}}>{item.start} - {item.end}</div>
                            <div style={{fontSize:14, margin:'8px 0'}}>
                                <b style={{fontSize:16}}>{item.title}</b> <br/>
                                <span style={{color:'#555'}}>Guru Asli: {item.booker} | {item.planet}</span>
                            </div>
                            <button onClick={() => handleInitStart(item)} style={styles.btnSwitch}>✋ SAYA GANTIKAN KELAS INI</button>
                        </div>
                    ))
                )}
            </div>
        ) : (
            <>
                {/* --- JADWAL HARI INI --- */}
                <h3 style={styles.sectionTitle}>🚀 Aksi Hari Ini</h3>
                
                {!loading && todaySchedules.length === 0 ? (
                    <div style={styles.emptyStateBox}>
                        🏝️ <b>Tidak ada jadwal mengajar hari ini.</b><br/>
                        <span style={{fontSize:13}}>Istirahatlah atau cek "Mode Pengganti".</span>
                    </div>
                ) : (
                    todaySchedules.map(item => (
                        <div key={item.id} style={styles.cardActive}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                    <span style={styles.badgeNow}>HARI INI</span>
                                    <span style={{fontSize:18, fontWeight:'bold', color:'#2c3e50'}}>{item.start} - {item.end}</span>
                                </div>
                                <div>
                                    <span style={{
                                        background: item.program==='English'?'#f1c40f':'#3498db', 
                                        color:'white', padding:'4px 10px', borderRadius:15, fontSize:11, fontWeight:'bold'
                                    }}>
                                        {item.program}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={styles.cardContent}>
                                <div style={{fontSize:16, fontWeight:'bold', color:'#34495e'}}>{item.title || "(Tanpa Judul)"}</div>
                                <div style={{fontSize:13, color:'#7f8c8d', marginTop:5}}>
                                    Level: {item.level} | Ruangan: <b>{item.planet}</b>
                                </div>
                            </div>
                            
                            <button onClick={() => handleInitStart(item)} style={styles.btnStart}>
                                ▶ MULAI KELAS & ABSEN
                            </button>
                        </div>
                    ))
                )}

                {/* --- JADWAL MENDATANG --- */}
                <h3 style={{...styles.sectionTitle, marginTop:40, borderColor:'#bdc3c7', color:'#7f8c8d'}}>📅 Agenda Mendatang</h3>
                
                {!loading && upcomingSchedules.length === 0 ? (
                    <p style={{color:'#999', fontStyle:'italic'}}>Belum ada jadwal masa depan.</p>
                ) : (
                    upcomingSchedules.map((item, index) => {
                        // Cek apakah tanggal berubah dari item sebelumnya (untuk grouping header)
                        const showHeader = index === 0 || item.dateStr !== upcomingSchedules[index-1].dateStr;
                        return (
                            <div key={item.id}>
                                {showHeader && (
                                    <div style={{margin:'25px 0 10px 0', fontWeight:'bold', color:'#2c3e50', fontSize:15, borderBottom:'1px dashed #ccc', paddingBottom:5}}>
                                        {formatDateIndo(item.dateStr)}
                                    </div>
                                )}
                                
                                <div style={styles.cardFuture}>
                                    <div style={{display:'flex', gap:15, alignItems:'center', flex:1}}>
                                        <div style={{minWidth:60, fontWeight:'bold', color:'#2980b9'}}>{item.start}</div>
                                        <div style={{flex:1}}>
                                            <div style={{fontWeight:'bold', fontSize:14}}>{item.title || "Jadwal Belum Diberi Judul"}</div>
                                            <div style={{fontSize:12, color:'#666'}}>{item.program} ({item.level}) | {item.planet}</div>
                                        </div>
                                    </div>
                                    {/* TOMBOL SAMPAH UNTUK JADWAL HANTU */}
                                    <button 
                                        onClick={() => handleDeleteGhost(item.id, item.title, item.dateStr)}
                                        style={styles.btnTrash}
                                        title="Hapus jadwal ini"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </>
        )}
      </div>

      {/* --- MODAL START CLASS --- */}
      {showStartModal && pendingSchedule && (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:10}}>🚀 Persiapan Kelas</h3>
                <div style={{background:'#f9f9f9', padding:10, borderRadius:5, fontSize:13, marginBottom:15}}>
                    Mapel: <b>{pendingSchedule.title}</b><br/>
                    Jam: {pendingSchedule.start} - {pendingSchedule.end}
                </div>
                
                <form onSubmit={confirmStartClass}>
                    <div style={{marginBottom:15}}>
                        <label style={styles.labelForm}>Apa kegiatan hari ini?</label>
                        <select 
                            value={selectedActivity} 
                            onChange={e => setSelectedActivity(e.target.value)} 
                            style={styles.inputForm}
                        >
                            <option value="Mengajar">📚 Mengajar Materi</option>
                            <option value="Ujian">📝 Ujian / Try Out</option>
                            <option value="Buat Soal">📄 Hanya Buat Soal</option>
                            <option value="English Course">🇬🇧 English Course</option>
                        </select>
                    </div>
                    
                    <div style={{marginBottom:20}}>
                        <label style={styles.labelForm}>Kode Harian Admin</label>
                        <input 
                            type="text" 
                            placeholder="Contoh: KODE-123" 
                            value={inputToken} 
                            onChange={e => setInputToken(e.target.value)} 
                            style={styles.inputCode} 
                            autoFocus 
                            required
                        />
                        <small style={{fontSize:11, color:'#888'}}>Tanya Admin jika belum tahu.</small>
                    </div>
                    
                    <div style={{display:'flex', gap:10}}>
                        <button type="button" onClick={()=>setShowStartModal(false)} style={styles.btnCancel}>Batal</button>
                        <button type="submit" style={styles.btnConfirm}>VERIFIKASI & MASUK</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

// --- STYLING OBJEK (CSS-in-JS) ---
const styles = {
    headerContainer: {
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
        padding: '25px', 
        color: 'white', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
    },
    btnLogout: {
        background: '#c0392b', border: 'none', color: 'white', borderRadius: 6, 
        padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 'bold',
        transition: '0.2s'
    },
    btnActionPurple: {
        flex: 2, background: '#8e44ad', border: 'none', color: 'white', borderRadius: 10, 
        padding: '14px', cursor: 'pointer', fontWeight: 'bold', fontSize:14,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, 
        boxShadow: '0 4px 0 #6c3483', transition: 'transform 0.1s'
    },
    btnActionOrange: {
        flex: 1, background: '#f39c12', border: 'none', color: 'white', borderRadius: 10, 
        padding: '14px', cursor: 'pointer', fontWeight: 'bold', fontSize:14,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, 
        boxShadow: '0 4px 0 #d68910', transition: 'transform 0.1s'
    },
    btnMenuSmall: { 
        background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', 
        borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontSize: 13, 
        minWidth: 'fit-content', whiteSpace: 'nowrap', backdropFilter:'blur(5px)'
    },
    
    // CONTENT STYLES
    sectionTitle: { borderBottom: '2px solid #2c3e50', paddingBottom: 10, marginBottom: 20, color: '#2c3e50' },
    emptyStateBox: { textAlign: 'center', padding: 30, background: 'white', borderRadius: 12, color: '#7f8c8d', marginBottom: 20, border:'2px dashed #ddd' },
    alertBox: { background: '#fff3e0', borderLeft: '5px solid #e67e22', padding: 15, marginBottom: 20, borderRadius: 6 },
    
    // CARDS
    cardActive: { background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.08)', marginBottom: 20, borderLeft: '6px solid #27ae60' },
    cardContent: { margin: '15px 0', padding: '15px', background: '#f8f9fa', borderRadius: 8 },
    badgeNow: { background: '#27ae60', color: 'white', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', marginRight: 10, verticalAlign:'middle' },
    
    cardFuture: { 
        background: 'white', padding: '15px 20px', borderRadius: 8, 
        boxShadow: '0 2px 5px rgba(0,0,0,0.03)', marginBottom: 10, borderLeft: '4px solid #bdc3c7',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    
    cardSwitch: { background: 'white', padding: 15, borderRadius: 8, marginBottom: 15, borderLeft: '4px solid #e67e22', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    
    // BUTTONS
    btnStart: { width: '100%', padding: 14, background: '#27ae60', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 14, cursor: 'pointer', marginTop: 10, boxShadow:'0 3px 0 #1e8449' },
    btnSwitch: { marginTop: 10, padding: '10px 15px', background: '#e67e22', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold', width:'100%' },
    btnTrash: { background: '#ffebee', color: '#c0392b', border: 'none', borderRadius: 5, width: 30, height: 30, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 },

    // MODAL
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, backdropFilter: 'blur(3px)' },
    modal: { background: 'white', padding: 25, borderRadius: 15, width: '90%', maxWidth: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' },
    inputForm: { width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize:14, background:'white' },
    inputCode: { width: '100%', padding: 12, borderRadius: 6, border: '2px solid #3498db', textAlign: 'center', textTransform: 'uppercase', boxSizing: 'border-box', fontSize: 18, letterSpacing: 3, fontWeight:'bold' },
    labelForm: { display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: '#555' },
    btnConfirm: { flex: 2, padding: 12, background: '#2980b9', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' },
    btnCancel: { flex: 1, padding: 12, background: '#ecf0f1', border: 'none', color: '#7f8c8d', borderRadius: 6, cursor: 'pointer', fontWeight:'bold' }
};

export default TeacherDashboard;