import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, where, getDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Bell, Calendar, Users, GraduationCap, Settings, LogOut, Menu } from 'lucide-react';

// --- IMPORT HALAMAN ---
// Pastikan file-file ini ada di folder yang benar
import AdminSchedule from './pages/admin/Schedule';
import AdminTeachers from './pages/admin/Teachers';
import AdminSettings from './pages/admin/Settings';
import AdminStudentsIndex from './pages/admin/students/index'; 
import TeacherDashboard from './pages/teacher/Dashboard'; // Import Dashboard Guru

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",
  authDomain: "gemilangsystem.firebaseapp.com",
  projectId: "gemilangsystem",
  storageBucket: "gemilangsystem.firebasestorage.app",
  messagingSenderId: "1078433073773",
  appId: "1:1078433073773:web:cdb13ae553efbc1d1bcd64"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- KOMPONEN DASHBOARD ADMIN ---
const DashboardHome = () => (
  <div className="p-10 md:p-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-200 text-center animate-in fade-in">
    <h2 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tighter">BIMBEL GEMILANG</h2>
    <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest text-center">Sistem Manajemen Operasional</p>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
       <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 font-bold text-xs">JADWAL OK</div>
       <div className="p-4 bg-green-50 rounded-2xl text-green-600 font-bold text-xs">SISWA OK</div>
       <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 font-bold text-xs">GURU OK</div>
    </div>
  </div>
);

// --- LAYOUT ADMIN ---
const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-5 border-b flex justify-between items-center shadow-sm z-30">
        <h1 className="font-black text-2xl text-blue-600 italic">GEMILANG</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-100 rounded-lg"><Menu/></button>
      </div>

      {/* Sidebar */}
      <nav className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform z-40 w-72 bg-white border-r h-screen flex flex-col p-8 shadow-2xl md:shadow-none`}>
        <h1 className="font-black text-3xl text-blue-600 mb-12 text-center italic tracking-tighter hidden md:block">GEMILANG</h1>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {[
            {id:'dashboard', l:'Beranda', i:Bell},
            {id:'schedule', l:'Jadwal', i:Calendar},
            {id:'students', l:'Siswa', i:GraduationCap},
            {id:'teachers', l:'Guru', i:Users},
            {id:'settings', l:'Pengaturan', i:Settings}
          ].map(m => (
            <button key={m.id} onClick={() => {setView(m.id); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase transition-all ${view === m.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
              <m.i size={20}/> {m.l}
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="mt-auto w-full text-red-500 font-black text-xs uppercase p-4 flex items-center justify-center gap-2 hover:bg-red-50 rounded-2xl transition-all border border-red-100"><LogOut size={18}/> Logout</button>
      </nav>

      {/* Konten Utama */}
      <main className="flex-1 p-6 md:p-10 overflow-auto h-screen">
        <div className="max-w-7xl mx-auto pb-20">
          {view === 'dashboard' && <DashboardHome />}
          {view === 'schedule' && <AdminSchedule db={db} />}
          {view === 'students' && <AdminStudentsIndex db={db} />}
          {view === 'teachers' && <AdminTeachers db={db} />}
          {view === 'settings' && <AdminSettings db={db} />}
        </div>
      </main>
      
      {/* Overlay untuk Mobile */}
      {isSidebarOpen && <div onClick={()=>setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>}
    </div>
  );
};

// --- HALAMAN LOGIN (ADMIN & GURU) ---
const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('admin'); // 'admin' atau 'guru'
  const [pass, setPass] = useState('');
  const [guru, setGuru] = useState('');
  const [teachersList, setTeachersList] = useState([]);

  // Ambil data guru untuk dropdown
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "guru"));
    const unsub = onSnapshot(q, (snap) => {
      setTeachersList(snap.docs.map(d => d.data()));
    });
    return () => unsub();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'admin') {
      // Login Admin
      const snap = await getDoc(doc(db, "settings", "auth"));
      const correct = snap.exists() ? snap.data().password : 'admin123';
      if(pass === correct) {
        onLogin('admin', 'Administrator');
      } else {
        alert("Sandi Admin Salah!");
      }
    } else {
      // Login Guru
      if (guru) {
        onLogin('guru', guru);
      } else {
        alert("Pilih nama guru dulu!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
        
        {/* Header Biru */}
        <div className="bg-blue-600 p-10 text-center">
          <h1 className="text-4xl font-black italic text-white tracking-tighter">GEMILANG</h1>
          <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-2">Portal Akses Sistem</p>
        </div>

        {/* Tab Pilihan (Admin / Guru) */}
        <div className="flex border-b border-slate-100">
          <button onClick={() => setMode('admin')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest ${mode === 'admin' ? 'bg-white text-blue-600' : 'bg-slate-50 text-slate-400'}`}>Admin</button>
          <button onClick={() => setMode('guru')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest ${mode === 'guru' ? 'bg-white text-green-600' : 'bg-slate-50 text-slate-400'}`}>Guru</button>
        </div>

        {/* Form Login */}
        <form onSubmit={submit} className="p-10 space-y-6">
          {mode === 'admin' ? (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Kata Sandi Admin</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full border-4 border-slate-100 p-4 rounded-2xl text-center font-black text-xl outline-none focus:border-blue-600 transition-all text-slate-800" placeholder="••••••" />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Pilih Nama Anda</label>
              <select value={guru} onChange={e=>setGuru(e.target.value)} className="w-full border-4 border-slate-100 p-4 rounded-2xl text-center font-black text-lg outline-none focus:border-green-600 transition-all bg-white text-slate-800">
                <option value="">-- Pilih Guru --</option>
                {teachersList.map((t, i) => (
                  <option key={i} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <button className={`w-full py-5 rounded-2xl font-black text-white text-lg uppercase tracking-widest shadow-xl active:scale-95 transition-all ${mode === 'admin' ? 'bg-slate-900 hover:bg-black' : 'bg-green-600 hover:bg-green-700'}`}>
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA (ROOT) ---
export default function App() {
  const [page, setPage] = useState('login'); // 'login', 'admin', 'guru'
  const [user, setUser] = useState('');

  useEffect(() => { signInAnonymously(auth); }, []);

  const handleLogin = (role, userName) => {
    setUser(userName);
    setPage(role);
  };

  return (
    <div className="antialiased w-full min-h-screen bg-white">
      {page === 'login' && <LoginPage onLogin={handleLogin}/>}
      {page === 'admin' && <DashboardAdmin onLogout={()=>setPage('login')}/>}
      {page === 'guru' && <TeacherDashboard db={db} user={user} onLogout={()=>setPage('login')}/>}
    </div>
  );
}