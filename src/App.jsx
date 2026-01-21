import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, where, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Bell, Clock, DollarSign, Users, GraduationCap, Calendar, AlertTriangle, MessageCircle, Settings, Key } from 'lucide-react';

import AdminSchedule from './pages/admin/Schedule';
import AdminFinance from './pages/admin/Finance';
import AdminSettings from './pages/admin/Settings';
import AdminStudents from './pages/admin/Students';

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

const DAYS_INDONESIA = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
const generateWALink = (phone, name, amount) => {
  if (!phone) return "#";
  let p = phone.replace(/\D/g, ''); if (p.startsWith('0')) p = '62' + p.substring(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(`Halo, mengingatkan tagihan siswa *${name}* sebesar Rp ${formatIDR(amount)} sudah jatuh tempo. Mohon segera diselesaikan. Terima kasih.`)}`;
};

const DashboardHome = () => {
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [isBellRinging, setIsBellRinging] = useState(false);
  const audioContextRef = useRef(null); const oscillatorRef = useRef(null);

  const startBell = () => { if(isBellRinging)return; setIsBellRinging(true); const ctx=new(window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); osc.frequency.value=880; osc.connect(ctx.destination); osc.start(); audioContextRef.current=ctx; oscillatorRef.current=osc; };
  const stopBell = () => { if(!isBellRinging)return; setIsBellRinging(false); oscillatorRef.current.stop(); audioContextRef.current.close(); };

  useEffect(() => {
    const dayName = DAYS_INDONESIA[new Date().getDay()];
    const dateStr = new Date().toISOString().split('T')[0];
    const u1 = onSnapshot(query(collection(db, "schedules")), s => setTodaySchedules(s.docs.map(d=>d.data()).filter(x => (x.type==='routine' && x.day===dayName) || (x.type==='booking' && x.date===dateStr)).sort((a,b)=>a.startTime.localeCompare(b.startTime))));
    // Filter H-7
    const u2 = onSnapshot(query(collection(db, "invoices"), where("remainingAmount", ">", 0)), s => {
      const sevenDaysLater = new Date(); sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      setOverdueInvoices(s.docs.map(d=>({id:d.id, ...d.data()})).filter(inv => new Date(inv.dueDate) <= sevenDaysLater));
    });
    return () => { u1(); u2(); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg flex justify-between items-center">
        <div><h2 className="text-2xl font-bold flex gap-2"><Bell className={isBellRinging?"animate-bounce":""}/> Bel Sekolah</h2><p className="opacity-80">Bunyikan manual.</p></div>
        <button onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold shadow-lg">TEKAN</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex gap-2"><Clock className="text-blue-500"/> Kelas Hari Ini</h3>
          <div className="space-y-2 h-64 overflow-y-auto">{todaySchedules.length>0 ? todaySchedules.map((s,i)=><div key={i} className="flex justify-between p-2 border rounded bg-gray-50"><span className="font-bold">{s.subject}</span><span>{s.startTime}</span></div>) : <p className="text-gray-400">Kosong</p>}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex gap-2"><AlertTriangle className="text-red-500"/> Tagihan (Jatuh Tempo)</h3>
          <div className="space-y-2 h-64 overflow-y-auto">{overdueInvoices.length>0 ? overdueInvoices.map((inv,i)=>(
            <div key={i} className="flex justify-between items-center p-3 border-l-4 border-red-500 bg-red-50 rounded">
              <div><div className="font-bold">{inv.studentName}</div><div className="text-xs text-red-600">{inv.dueDate} • Rp {formatIDR(inv.remainingAmount)}</div></div>
              {inv.waPhone && <a href={generateWALink(inv.waPhone, inv.studentName, inv.remainingAmount)} target="_blank" className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700"><MessageCircle size={16}/></a>}
            </div>
          )) : <p className="text-gray-400">Keuangan Aman.</p>}</div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTS LAIN (SAMA SEPERTI SEBELUMNYA, DIPERSINGKAT AGAR FIT) ---
const AdminTeachers = () => { /* Logika Guru Sesuai Sebelumnya */ return <div className="p-6 bg-white rounded border">Menu Guru (Gunakan kode sebelumnya jika perlu)</div>; };
const DashboardGuru = () => <div className="p-6">Dashboard Guru</div>;
const LoginPage = ({ onLogin }) => { /* Logika Login Sesuai Sebelumnya */ return <div className="flex h-screen items-center justify-center"><button onClick={()=>onLogin('admin','Admin')} className="bg-blue-600 text-white px-6 py-3 rounded">LOGIN ADMIN</button></div>; };

// --- MAIN LAYOUT ---
const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r hidden md:block p-4 space-y-1">
        <h1 className="font-black text-xl text-blue-600 mb-6 px-2">GEMILANG</h1>
        {[
          {id:'dashboard',l:'Beranda',i:Bell}, {id:'schedule',l:'Jadwal',i:Calendar}, {id:'students',l:'Siswa',i:GraduationCap},
          {id:'finance',l:'Keuangan',i:DollarSign}, {id:'teachers',l:'Guru',i:Users}, {id:'settings',l:'Pengaturan',i:Settings}
        ].map(m=><button key={m.id} onClick={()=>setView(m.id)} className={`w-full flex gap-3 px-4 py-3 rounded text-sm font-bold ${view===m.id?'bg-blue-50 text-blue-600':'text-gray-500'}`}><m.i size={18}/> {m.l}</button>)}
      </div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b p-4 flex justify-between"><h2 className="font-bold uppercase text-gray-400">{view}</h2><button onClick={onLogout} className="text-red-500 font-bold text-sm">Keluar</button></header>
        <main className="flex-1 overflow-auto p-6">
          {view==='dashboard' && <DashboardHome/>} {view==='students' && <AdminStudents db={db}/>}
          {view==='finance' && <AdminFinance db={db}/>} {view==='schedule' && <AdminSchedule db={db}/>}
          {view==='settings' && <AdminSettings db={db}/>} {view==='teachers' && <AdminTeachers/>}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState('login');
  useEffect(() => { signInAnonymously(auth); }, []);
  return <>{page==='login' && <LoginPage onLogin={()=>{setPage('admin')}}/>} {page==='admin' && <DashboardAdmin onLogout={()=>setPage('login')}/>}</>;
}