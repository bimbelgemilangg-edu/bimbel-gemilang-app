import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { Layout, Calendar, MonitorPlay, User, LogOut, Star } from 'lucide-react';

// --- IMPORT KOMPONEN HALAMAN (ANAK) ---
import TeacherHome from './Home';
import TeacherSmartClass from './SmartClass';
import TeacherProfile from './Profile';
import TeacherActiveSession from './ActiveSession';

export default function TeacherDashboard({ db, user, onLogout }) {
  const [view, setView] = useState('token'); // token | app
  const [activeTab, setActiveTab] = useState('home');
  const [inputToken, setInputToken] = useState("");
  
  // State untuk Data Sharing antar halaman
  const [activeSessionId, setActiveSessionId] = useState(null); // ID kelas yg sedang jalan
  const [activeScheduleData, setActiveScheduleData] = useState(null); // Data jadwal yg dipilih

  useEffect(() => {
    const savedToken = localStorage.getItem('GEMILANG_TEACHER_TOKEN');
    if (savedToken === 'VALID') setView('app');
  }, []);

  const verifyToken = async (e) => {
    e.preventDefault();
    const snap = await getDoc(doc(db, "settings", "attendanceToken"));
    if (snap.exists() && inputToken.toUpperCase() === snap.data().token) {
      localStorage.setItem('GEMILANG_TEACHER_TOKEN', 'VALID');
      // Catat Log Masuk
      await addDoc(collection(db, "teacher_presences"), { 
        name: user, timestamp: serverTimestamp(), type: 'check-in', 
        date: new Date().toLocaleDateString('id-ID'), time: new Date().toLocaleTimeString('id-ID')
      });
      setView('app');
    } else { alert("Token Salah!"); }
  };

  // Fungsi pindah ke mode Absensi
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

  // --- TAMPILAN 1: TOKEN GATE ---
  if (view === 'token') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] text-center max-w-lg w-full shadow-2xl">
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Portal Guru</h1>
          <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest">Masukkan Kode Akses Harian</p>
          <form onSubmit={verifyToken}>
            <input autoFocus className="w-full text-center text-5xl font-black tracking-[0.5em] p-6 border-4 border-slate-100 rounded-[2rem] outline-none focus:border-blue-600 uppercase transition-all" placeholder="****" value={inputToken} onChange={e=>setInputToken(e.target.value)} />
            <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl mt-6 shadow-xl hover:bg-blue-700 active:scale-95 transition-all">BUKA DASHBOARD</button>
          </form>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <nav className="bg-white w-full md:w-28 md:h-screen shadow-2xl flex md:flex-col justify-between items-center py-8 px-4 md:px-0 sticky top-0 z-50">
        <div className="bg-blue-600 p-4 rounded-2xl text-white mb-8 hidden md:block shadow-lg shadow-blue-200"><Star size={28} fill="currentColor"/></div>
        
        <div className="flex md:flex-col gap-8 w-full md:w-auto justify-evenly md:justify-start">
          {[
            {id:'home', i:Layout, l:'Home'},
            {id:'smartclass', i:MonitorPlay, l:'Smart'},
            {id:'profile', i:User, l:'Profil'},
          ].map(m => (
            <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`p-4 rounded-2xl transition-all flex flex-col items-center gap-2 group ${activeTab===m.id?'bg-slate-900 text-white shadow-xl scale-110':'text-slate-400 hover:bg-blue-50'}`}>
              <m.i size={24} className={activeTab===m.id ? "text-yellow-400" : "group-hover:text-blue-600"}/>
              <span className="text-[9px] font-black uppercase tracking-wider">{m.l}</span>
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="text-red-400 hover:text-red-600 p-4 hover:bg-red-50 rounded-2xl transition-all"><LogOut size={24}/></button>
      </nav>

      {/* KONTEN DINAMIS */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        {activeTab === 'home' && <TeacherHome db={db} user={user} onStartClass={startSession} />}
        {activeTab === 'smartclass' && <TeacherSmartClass db={db} user={user} />}
        {activeTab === 'profile' && <TeacherProfile db={db} user={user} />}
        {activeTab === 'session' && <TeacherActiveSession db={db} user={user} sessionId={activeSessionId} scheduleData={activeScheduleData} onFinish={endSession} />}
      </main>
    </div>
  );
}