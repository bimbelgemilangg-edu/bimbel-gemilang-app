import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Bell, Calendar, Users, GraduationCap, Settings, LogOut } from 'lucide-react';

// IMPORT HANYA 3 HALAMAN UTAMA
import AdminSchedule from './pages/admin/Schedule';
import AdminTeachers from './pages/admin/Teachers';
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

export default function App() {
  const [view, setView] = useState('dashboard');
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => { signInAnonymously(auth); }, []);

  if (!isLogin) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[2rem] text-center shadow-2xl">
        <h1 className="text-4xl font-black italic mb-6 text-blue-600">GEMILANG</h1>
        <button onClick={() => setIsLogin(true)} className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest">Masuk Sistem</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR BERSIH TOTAL */}
      <nav className="w-72 bg-white border-r h-screen flex flex-col p-6 space-y-2">
        <h1 className="font-black text-2xl text-blue-600 mb-10 text-center italic">GEMILANG</h1>
        {[
          {id:'dashboard', l:'Beranda', i:Bell},
          {id:'schedule', l:'Jadwal', i:Calendar},
          {id:'students', l:'Siswa', i:GraduationCap},
          {id:'teachers', l:'Guru', i:Users}
        ].map(m => (
          <button key={m.id} onClick={() => setView(m.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase transition-all ${view === m.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
            <m.i size={18}/> {m.l}
          </button>
        ))}
        <button onClick={() => setIsLogin(false)} className="mt-auto w-full text-red-500 font-bold p-4 flex items-center gap-2"><LogOut size={18}/> Logout</button>
      </nav>

      {/* KONTEN */}
      <main className="flex-1 p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <div className="p-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-200 text-center"><h2 className="text-2xl font-black text-slate-300">SELAMAT DATANG DI BIMBEL GEMILANG</h2><p className="text-slate-400 font-bold uppercase text-[10px] mt-2">Sistem Manajemen Operasional</p></div>}
          {view === 'schedule' && <AdminSchedule db={db} />}
          {view === 'students' && <AdminStudentsIndex db={db} />}
          {view === 'teachers' && <AdminTeachers db={db} />}
        </div>
      </main>
    </div>
  );
}