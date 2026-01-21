import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, setDoc, doc, getDoc, 
  onSnapshot, query, where, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  Bell, Clock, DollarSign, Users, GraduationCap, Calendar, 
  AlertTriangle, CheckCircle, Key, Settings, MessageCircle, Menu, LogOut, TrendingUp
} from 'lucide-react';

// --- IMPORT FILE HALAMAN ADMIN ---
import AdminSchedule from './pages/admin/Schedule';
import AdminFinance from './pages/admin/Finance';
import AdminSettings from './pages/admin/Settings'; 
import AdminStudents from './pages/admin/Students';
import AdminTeachers from './pages/admin/Teachers';

// --- IMPORT FILE HALAMAN GURU ---
import TeacherDashboard from './pages/teacher/Dashboard';

// --- CONFIG FIREBASE ---
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
  let p = phone.replace(/\D/g, ''); 
  if (p.startsWith('0')) p = '62' + p.substring(1);
  const text = `Halo, mengingatkan tagihan siswa *${name}* sebesar ${formatIDR(amount)} sudah jatuh tempo. Mohon segera diselesaikan. Terima kasih.`;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
};

// ==========================================
// 1. COMPONENT: DASHBOARD HOME (CLEAN VERSION)
// ==========================================
const DashboardHome = () => {
  const [stats, setStats] = useState({ siswa: 0, guruHadir: 0 });
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [expiringPackages, setExpiringPackages] = useState([]); 
  const [isBellRinging, setIsBellRinging] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);

  const startBell = () => {
    if (isBellRinging) return;
    setIsBellRinging(true);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const carrier = ctx.createOscillator(); carrier.frequency.value = 880; carrier.type = 'square';
    const lfo = ctx.createOscillator(); lfo.frequency.value = 25; lfo.type = 'square';
    const gain = ctx.createGain(); 
    carrier.connect(gain); gain.connect(ctx.destination);
    carrier.start(); audioContextRef.current = ctx; oscillatorRef.current = carrier; 
  };
  const stopBell = () => { if(!isBellRinging) return; setIsBellRinging(false); oscillatorRef.current?.stop(); audioContextRef.current?.close(); };

  useEffect(() => {
    const dayName = DAYS_INDONESIA[new Date().getDay()];
    const dateStr = new Date().toISOString().split('T')[0];
    
    const unsubStudents = onSnapshot(collection(db, "students"), s => {
      setStats(prev => ({ ...prev, siswa: s.size }));
      const nearEnd = s.docs.map(d => ({id: d.id, ...d.data()})).filter(std => {
        if(!std.createdAt) return false;
        const joinDate = std.createdAt.toDate();
        const diffTime = Math.abs(new Date() - joinDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) >= 25;
      });
      setExpiringPackages(nearEnd);
    });

    const unsubInvoices = onSnapshot(query(collection(db, "invoices"), where("remainingAmount", ">", 0)), snap => {
      const sevenDaysLater = new Date(); sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      setOverdueInvoices(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(inv => new Date(inv.dueDate) <= sevenDaysLater));
    });

    const unsubLogs = onSnapshot(query(collection(db, "class_logs"), where("date", "==", dateStr)), s => {
      setStats(prev => ({ ...prev, guruHadir: s.size }));
    });

    const unsubSched = onSnapshot(query(collection(db, "schedules")), snap => {
      setTodaySchedules(snap.docs.map(d => d.data()).filter(s => (s.type === 'routine' && s.day === dayName) || (s.type === 'booking' && s.date === dateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime)));
    });

    return () => { unsubStudents(); unsubInvoices(); unsubLogs(); unsubSched(); };
  }, []);

  return (
    <div className="space-y-8">
      {/* STATS KONDISI OPERASIONAL (BUKAN KEUANGAN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
          <div><div className="text-3xl font-black text-gray-800">{stats.siswa}</div><div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Siswa Terdaftar</div></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Calendar size={24}/></div>
          <div><div className="text-3xl font-black text-gray-800">{stats.guruHadir}</div><div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kelas Selesai Hari Ini</div></div>
        </div>
      </div>

      <div className="w-full bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-3xl font-black flex items-center gap-4"><Bell className={isBellRinging?"animate-bounce text-yellow-400":""}/> TOMBOL BEL SEKOLAH</h2>
          <p className="opacity-50 mt-2 text-lg">Gunakan saat pergantian jam atau waktu pulang.</p>
        </div>
        <button onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} className="z-10 bg-red-600 hover:bg-red-700 text-white px-16 py-6 rounded-2xl font-black text-2xl shadow-2xl active:scale-95 transition-all">BUNYIKAN SEKARANG</button>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600/10 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-3 mb-6 text-xl border-b pb-4"><Clock className="text-blue-500"/> JADWAL AKTIF</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {todaySchedules.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div><h4 className="font-bold text-gray-800">{s.subject}</h4><p className="text-xs text-gray-500">{s.teacherName} • {s.room}</p></div>
                <div className="font-black text-blue-600 bg-white px-3 py-1 rounded-lg border shadow-sm">{s.startTime}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-3 mb-6 text-xl border-b pb-4"><AlertTriangle className="text-red-500"/> WARNING TAGIHAN</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {overdueInvoices.map((inv, i) => (
              <div key={i} className="flex justify-between items-center p-4 border-l-8 border-red-500 bg-red-50/50 rounded-r-2xl">
                <div className="overflow-hidden">
                  <div className="font-bold text-gray-800 truncate">{inv.studentName}</div>
                  <div className="text-xs text-red-600 font-bold">{inv.dueDate} • {formatIDR(inv.remainingAmount)}</div>
                </div>
                {inv.waPhone && <a href={generateWALink(inv.waPhone, inv.studentName, inv.remainingAmount)} target="_blank" className="bg-green-600 text-white p-2.5 rounded-full hover:bg-green-700 shadow-lg"><MessageCircle size={20}/></a>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-3 mb-6 text-xl border-b pb-4"><TrendingUp className="text-orange-500"/> RENEWAL PAKET</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {expiringPackages.map((std, i) => (
              <div key={i} className="p-4 border-l-8 border-orange-500 bg-orange-50 rounded-r-2xl">
                <div className="font-black text-gray-800">{std.name}</div>
                <div className="text-xs text-orange-700 mt-1 font-medium italic">Paket sudah berjalan 25+ hari.</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. MAIN LAYOUT ADMIN (FULL WIDTH CONFIG)
// ==========================================
const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row w-full overflow-x-hidden">
      <div className="md:hidden bg-white p-5 border-b flex justify-between items-center shadow-md z-30">
        <h1 className="font-black text-2xl text-blue-600 italic">GEMILANG</h1>
        <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-100 rounded-lg"><Menu/></button>
      </div>

      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40 w-72 bg-white border-r flex-shrink-0 h-full flex flex-col shadow-2xl md:shadow-none`}>
        <div className="p-8 border-b hidden md:block text-center">
          <h1 className="font-black text-blue-600 text-3xl italic tracking-tighter">GEMILANG<span className="text-gray-800 not-italic uppercase text-xs block tracking-[0.3em] mt-1 opacity-50">Business System</span></h1>
        </div>
        <nav className="p-6 space-y-2 flex-1 overflow-y-auto">
          {[
            {id:'dashboard',l:'Beranda',i:Bell}, {id:'schedule',l:'Jadwal',i:Calendar}, {id:'students',l:'Siswa',i:GraduationCap}, 
            {id:'finance',l:'Keuangan',i:DollarSign}, {id:'teachers',l:'Guru',i:Users}, {id:'settings',l:'Pengaturan',i:Settings}
          ].map(m => (
            <button key={m.id} onClick={()=>{setView(m.id); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${view===m.id?'bg-blue-600 text-white shadow-xl translate-x-2':'text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}>
              <m.i size={22}/> {m.l}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t bg-gray-50"><button onClick={onLogout} className="w-full text-red-600 font-black text-xs uppercase tracking-widest py-4 hover:bg-red-50 rounded-2xl border-2 border-red-100 flex items-center justify-center gap-2"><LogOut size={16}/> Keluar Sistem</button></div>
      </div>

      {isSidebarOpen && <div onClick={()=>setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"></div>}

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="bg-white border-b px-10 py-6 flex justify-between items-center flex-shrink-0 shadow-sm">
          <h2 className="font-black uppercase text-gray-400 text-sm tracking-[0.2em]">{view} CONTROL</h2>
          <div className="font-black text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">STAF ADMINISTRATOR</div>
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-10 bg-white w-full">
          <div className="max-w-[1600px] mx-auto pb-20"> 
            {view === 'dashboard' && <DashboardHome />}
            {view === 'schedule' && <AdminSchedule db={db} />}
            {view === 'finance' && <AdminFinance db={db} />}
            {view === 'teachers' && <AdminTeachers db={db} />} 
            {view === 'students' && <AdminStudents db={db} />}
            {view === 'settings' && <AdminSettings db={db} />}
          </div>
        </main>
      </div>
    </div>
  );
};

// ==========================================
// 3. LOGIN PAGE (PERFECT CENTER & WIDE)
// ==========================================
const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('admin');
  const [pass, setPass] = useState('');
  const [guru, setGuru] = useState('');
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "users"), where("role","==","guru")), s => setTeachers(s.docs.map(d => d.data())));
    return () => unsub();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if(mode === 'admin') {
      if(pass === 'admin123') onLogin('admin', 'Admin');
      else alert("Password Salah!");
    } else {
      if(guru) onLogin('guru', guru);
      else alert("Pilih Nama Guru!");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
        <div className="bg-blue-600 p-12 text-center text-white">
          <h1 className="font-black text-5xl italic tracking-tighter">GEMILANG<span className="not-italic opacity-50 block text-xs tracking-[0.5em] mt-2">SYSTEM</span></h1>
        </div>
        <div className="flex bg-gray-50">
          <button onClick={()=>setMode('admin')} className={`flex-1 py-6 text-sm font-black uppercase tracking-widest ${mode==='admin'?'bg-white text-blue-600 border-b-4 border-blue-600':'text-gray-400'}`}>Admin</button>
          <button onClick={()=>setMode('guru')} className={`flex-1 py-6 text-sm font-black uppercase tracking-widest ${mode==='guru'?'bg-white text-green-600 border-b-4 border-green-600':'text-gray-400'}`}>Guru</button>
        </div>
        <form onSubmit={submit} className="p-12 space-y-8 bg-white">
          {mode==='admin' ? (
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full border-2 border-gray-200 p-5 rounded-2xl outline-none focus:border-blue-600 font-bold text-xl text-center" placeholder="Password Admin"/>
          ) : (
            <select value={guru} onChange={e=>setGuru(e.target.value)} className="w-full border-2 border-gray-200 p-5 rounded-2xl font-bold text-xl text-center outline-none">
              <option value="">-- Pilih Guru --</option>
              {teachers.map((t, i)=><option key={i} value={t.name}>{t.name}</option>)}
            </select>
          )}
          <button className={`w-full text-white py-6 rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${mode==='admin'?'bg-gray-900':'bg-green-600'}`}>Masuk Sistem</button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState('');
  useEffect(() => { signInAnonymously(auth); }, []);
  const login = (role, username) => { setUser(username); setPage(role); };

  return (
    <div className="antialiased w-full min-h-screen bg-white">
      {page === 'login' && <LoginPage onLogin={login}/>}
      {page === 'admin' && <DashboardAdmin onLogout={()=>setPage('login')}/>}
      {page === 'guru' && <TeacherDashboard db={db} user={user} onLogout={()=>setPage('login')}/>}
    </div>
  );
}