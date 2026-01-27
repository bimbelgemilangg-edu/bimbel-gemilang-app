import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, serverTimestamp, query, where, onSnapshot, getDocs } from 'firebase/firestore'; 
import { Layout, Calendar, MonitorPlay, User, LogOut, Star } from 'lucide-react';

// Import komponen anak
import TeacherHome from './Home';
import TeacherSmartClass from './SmartClass';
import TeacherProfile from './Profile';
import TeacherActiveSession from './ActiveSession';

export default function TeacherDashboard({ db, user, onLogout }) {
  const [view, setView] = useState('token'); 
  const [activeTab, setActiveTab] = useState('home');
  const [inputToken, setInputToken] = useState("");
  
  const [activeSessionId, setActiveSessionId] = useState(null); 
  const [activeScheduleData, setActiveScheduleData] = useState(null); 

  useEffect(() => {
    // Cek sesi di browser saat ini
    const savedToken = localStorage.getItem('GEMILANG_TEACHER_TOKEN');
    if (savedToken === 'VALID') setView('app');
  }, []);

  // --- LOGIKA VERIFIKASI TOKEN & ABSENSI CERDAS ---
  const verifyToken = async (e) => {
    e.preventDefault();
    try {
      const snap = await getDoc(doc(db, "settings", "attendanceToken"));
      
      // Validasi Token
      if (snap.exists() && inputToken.toUpperCase() === snap.data().token) {
        
        // 1. Simpan tanda valid di browser ini (biar gak tanya token terus)
        localStorage.setItem('GEMILANG_TEACHER_TOKEN', 'VALID');

        // 2. Cek Database: Apakah guru ini SUDAH absen hari ini?
        const todayStr = new Date().toLocaleDateString('id-ID'); // Contoh: 27/1/2026
        
        const q = query(
          collection(db, "teacher_presences"),
          where("name", "==", user),
          where("date", "==", todayStr),
          where("type", "==", "check-in")
        );

        const checkSnap = await getDocs(q);

        // 3. Logika Absen
        if (checkSnap.empty) {
          // KASUS A: Belum pernah absen hari ini -> Catat Jam Sekarang
          await addDoc(collection(db, "teacher_presences"), { 
            name: user, 
            timestamp: serverTimestamp(), 
            type: 'check-in', 
            date: todayStr, 
            time: new Date().toLocaleTimeString('id-ID'),
            device: 'First Login'
          });
        } else {
          // KASUS B: Sudah absen di perangkat lain -> JANGAN catat lagi (biar jam tidak berubah)
          console.log("User sudah absen hari ini. Skip pencatatan waktu.");
        }

        // 4. Masuk ke Dashboard
        setView('app');

      } else { 
        alert("Token Salah! Silakan tanya Admin."); 
      }
    } catch (err) {
      console.error("Error verify:", err);
      alert("Gagal memverifikasi. Cek koneksi internet.");
    }
  };
  
  // --- END LOGIKA ABSENSI ---

  const startSession = (schedule, logId) => {
    setActiveScheduleData(schedule);
    setActiveSessionId(logId);
    setActiveTab('session');
  };

  const endSession = () => {
    setActiveSessionId(null);
    setActiveScheduleData(null);
    setActiveTab('home');
  };

  // TAMPILAN 1: HALAMAN LOGIN TOKEN
  if (view === 'token') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-12 rounded-[3rem] text-center max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <User size={40} />
          </div>
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter text-slate-800">Portal Guru</h1>
          <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest">Masukkan Kode Akses Harian</p>
          
          <form onSubmit={verifyToken}>
            <input 
              autoFocus 
              className="w-full text-center text-5xl font-black tracking-[0.5em] p-6 border-4 border-slate-100 rounded-[2rem] outline-none focus:border-blue-600 uppercase transition-all text-slate-800 placeholder:text-slate-200" 
              placeholder="****" 
              value={inputToken} 
              onChange={e=>setInputToken(e.target.value)} 
            />
            <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl mt-6 shadow-xl hover:bg-blue-700 active:scale-95 transition-all">
              BUKA DASHBOARD
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TAMPILAN 2: DASHBOARD UTAMA
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGASI */}
      <nav className="bg-white w-full md:w-28 md:h-screen shadow-2xl flex md:flex-col justify-between items-center py-8 px-4 md:px-0 sticky top-0 z-50">
        <div className="bg-blue-600 p-4 rounded-2xl text-white mb-8 hidden md:block shadow-lg shadow-blue-200">
          <Star size={28} fill="currentColor"/>
        </div>
        
        <div className="flex md:flex-col gap-8 w-full md:w-auto justify-evenly md:justify-start">
          {[
            {id:'home', i:Layout, l:'Home'},
            {id:'smartclass', i:MonitorPlay, l:'Smart'},
            {id:'profile', i:User, l:'Profil'},
          ].map(m => (
            <button 
              key={m.id} 
              onClick={()=>setActiveTab(m.id)} 
              className={`p-4 rounded-2xl transition-all flex flex-col items-center gap-2 group ${activeTab===m.id?'bg-slate-900 text-white shadow-xl scale-110':'text-slate-400 hover:bg-blue-50'}`}
            >
              <m.i size={24} className={activeTab===m.id ? "text-yellow-400" : "group-hover:text-blue-600"}/>
              <span className="text-[9px] font-black uppercase tracking-wider">{m.l}</span>
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="text-red-400 hover:text-red-600 p-4 hover:bg-red-50 rounded-2xl transition-all" title="Logout">
          <LogOut size={24}/>
        </button>
      </nav>

      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        {activeTab === 'home' && <TeacherHome db={db} user={user} onStartClass={startSession} />}
        {activeTab === 'smartclass' && <TeacherSmartClass db={db} user={user} />}
        {activeTab === 'profile' && <TeacherProfile db={db} user={user} />}
        {activeTab === 'session' && <TeacherActiveSession db={db} user={user} sessionId={activeSessionId} scheduleData={activeScheduleData} onFinish={endSession} />}
      </main>
    </div>
  );
}