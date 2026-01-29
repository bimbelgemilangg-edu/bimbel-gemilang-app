import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, where, getDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Bell, Calendar, Users, GraduationCap, Settings, LogOut, Menu } from 'lucide-react';

// --- IMPORT HALAMAN (Pastikan jalurnya sesuai folder src) ---
import AdminSchedule from './pages/admin/Schedule';
import AdminTeachers from './pages/admin/Teachers';
import AdminSettings from './pages/admin/Settings';
import AdminStudentsIndex from './pages/admin/students/index'; 

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

const DashboardHome = () => (
  <div className="p-20 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-200 text-center animate-in fade-in">
    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">BIMBEL GEMILANG</h2>
    <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest text-center">Sistem Berhasil Terhubung</p>
  </div>
);

const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <div className="md:hidden bg-white p-5 border-b flex justify-between items-center shadow-sm">
        <h1 className="font-black text-2xl text-blue-600 italic">GEMILANG</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-100 rounded-lg"><Menu/></button>
      </div>

      <nav className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform z-40 w-72 bg-white border-r h-screen flex flex-col p-8`}>
        <h1 className="font-black text-3xl text-blue-600 mb-12 text-center italic tracking-tighter">GEMILANG</h1>
        <div className="space-y-2 flex-1">
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
        <button onClick={onLogout} className="mt-auto w-full text-red-500 font-black text-xs uppercase p-4 flex items-center justify-center gap-2 hover:bg-red-50 rounded-2xl transition-all"><LogOut size={18}/> Logout</button>
      </nav>

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <DashboardHome />}
          {view === 'schedule' && <AdminSchedule db={db} />}
          {view === 'students' && <AdminStudentsIndex db={db} />}
          {view === 'teachers' && <AdminTeachers db={db} />}
          {view === 'settings' && <AdminSettings db={db} />}
        </div>
      </main>
    </div>
  );
};

const LoginPage = ({ onLogin }) => {
  const [pass, setPass] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const snap = await getDoc(doc(db, "settings", "auth"));
    const correct = snap.exists() ? snap.data().password : 'admin123';
    if(pass === correct) onLogin(); else alert("Sandi Salah!");
  };
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <form onSubmit={submit} className="bg-white p-12 rounded-[3rem] text-center w-full max-w-md shadow-2xl">
        <h1 className="text-4xl font-black italic mb-8 text-blue-600">GEMILANG</h1>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full border-4 border-slate-100 p-5 rounded-2xl mb-4 text-center font-bold outline-none focus:border-blue-600" placeholder="Password Admin" />
        <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest">MASUK</button>
      </form>
    </div>
  );
};

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  useEffect(() => { signInAnonymously(auth); }, []);
  return isAuth ? <DashboardAdmin onLogout={()=>setIsAuth(false)} /> : <LoginPage onLogin={()=>setIsAuth(true)} />;
}