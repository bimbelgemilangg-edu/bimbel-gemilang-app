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

// Helper WA Generator
const generateWALink = (phone, name, amount) => {
  if (!phone) return "#";
  let p = phone.replace(/\D/g, ''); 
  if (p.startsWith('0')) p = '62' + p.substring(1);
  const text = `Halo, mengingatkan tagihan siswa *${name}* sebesar ${formatIDR(amount)} sudah jatuh tempo. Mohon segera diselesaikan. Terima kasih.`;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
};

// ==========================================
// 1. COMPONENT: DASHBOARD HOME (WAR ROOM VERSION)
// ==========================================
const DashboardHome = () => {
  const [stats, setStats] = useState({ siswa: 0, piutang: 0, kas: 0, guruHadir: 0 });
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [expiringPackages, setExpiringPackages] = useState([]); // Siswa hampir habis paket
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
    carrier.start(); 
    audioContextRef.current = ctx; oscillatorRef.current = carrier; 
  };
  
  const stopBell = () => { 
    if(!isBellRinging) return; 
    setIsBellRinging(false); 
    oscillatorRef.current?.stop(); 
    audioContextRef.current?.close(); 
  };

  useEffect(() => {
    const dayName = DAYS_INDONESIA[new Date().getDay()];
    const dateStr = new Date().toISOString().split('T')[0];
    
    // 1. Fetch Realtime Stats & Expiring Packages
    const unsubStudents = onSnapshot(collection(db, "students"), s => {
      setStats(prev => ({ ...prev, siswa: s.size }));
      const nearEnd = s.docs.map(d => ({id: d.id, ...d.data()})).filter(std => {
        if(!std.createdAt) return false;
        const joinDate = std.createdAt.toDate();
        const diffTime = Math.abs(new Date() - joinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 25 && diffDays <= 30;
      });
      setExpiringPackages(nearEnd);
    });

    // 2. Fetch Cash Balance
    const unsubFinance = onSnapshot(collection(db, "payments"), s => {
      let total = 0;
      s.docs.forEach(d => {
        const t = d.data();
        total += (t.type === 'expense' ? -(t.amount || 0) : (t.amount || 0));
      });
      setStats(prev => ({ ...prev, kas: total }));
    });

    // 3. Fetch Overdue Invoices & Piutang
    const unsubInvoices = onSnapshot(query(collection(db, "invoices"), where("remainingAmount", ">", 0)), snap => {
      let piutang = 0;
      const invs = snap.docs.map(d => {
        const data = d.data();
        piutang += data.remainingAmount;
        return { id: d.id, ...data };
      });
      setStats(prev => ({ ...prev, piutang }));
      const sevenDaysLater = new Date(); sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      setOverdueInvoices(invs.filter(inv => new Date(inv.dueDate) <= sevenDaysLater));
    });

    // 4. Fetch Class Logs Today
    const unsubLogs = onSnapshot(query(collection(db, "class_logs"), where("date", "==", dateStr)), s => {
      setStats(prev => ({ ...prev, guruHadir: s.size }));
    });

    // 5. Fetch Schedules
    const unsubSched = onSnapshot(query(collection(db, "schedules")), snap => {
      setTodaySchedules(snap.docs.map(d => d.data()).filter(s => (s.type === 'routine' && s.day === dayName) || (s.type === 'booking' && s.date === dateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime)));
    });

    return () => { unsubStudents(); unsubFinance(); unsubInvoices(); unsubLogs(); unsubSched(); };
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. TOP CARDS STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="text-blue-500 mb-1"><Users size={20}/></div>
          <div className="text-2xl font-black text-gray-800">{stats.siswa}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase">Siswa Aktif</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
          <div className="text-orange-500 mb-1"><AlertTriangle size={20}/></div>
          <div className="text-2xl font-black text-gray-800">Rp {formatIDR(stats.piutang).replace("Rp","")}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase">Total Piutang</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
          <div className="text-green-500 mb-1"><DollarSign size={20}/></div>
          <div className="text-2xl font-black text-gray-800">Rp {formatIDR(stats.kas).replace("Rp","")}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase">Kas Tersedia</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
          <div className="text-purple-500 mb-1"><Calendar size={20}/></div>
          <div className="text-2xl font-black text-gray-800">{stats.guruHadir}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase">Kelas Selesai Hari Ini</div>
        </div>
      </div>

      {/* 2. BEL SEKOLAH */}
      <div className="w-full bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="z-10 text-center md:text-left">
          <h2 className="text-2xl font-black flex items-center gap-3 justify-center md:justify-start">
            <Bell className={isBellRinging?"animate-bounce text-yellow-400":""}/> BEL PERGANTIAN JAM
          </h2>
          <p className="opacity-60 text-sm">Klik dan tahan untuk membunyikan bel seluruh area.</p>
        </div>
        <button onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} className="z-10 w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-xl font-black shadow-2xl active:scale-95 transition-all tracking-widest uppercase">BUNYIKAN</button>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. JADWAL HARI INI */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><Clock className="text-blue-500" size={18}/> LIVE JADWAL</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {todaySchedules.length > 0 ? todaySchedules.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div><h4 className="font-bold text-xs text-gray-800">{s.subject}</h4><p className="text-[10px] text-gray-500">{s.teacherName} • {s.room}</p></div>
                <div className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{s.startTime}</div>
              </div>
            )) : <div className="text-center py-10 text-gray-300 text-xs italic">Belum ada kelas...</div>}
          </div>
        </div>

        {/* 4. WARNING TAGIHAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><AlertTriangle className="text-red-500" size={18}/> JATUH TEMPO</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {overdueInvoices.length > 0 ? overdueInvoices.map((inv, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border-l-4 border-red-500 bg-red-50 rounded-r-lg shadow-sm">
                <div className="overflow-hidden">
                  <div className="font-bold text-xs text-gray-800 truncate">{inv.studentName}</div>
                  <div className="text-[10px] text-red-600 font-bold">{inv.dueDate} • Rp {formatIDR(inv.remainingAmount).replace("Rp","")}</div>
                </div>
                {inv.waPhone && (
                  <a href={generateWALink(inv.waPhone, inv.studentName, inv.remainingAmount)} target="_blank" rel="noreferrer" className="bg-green-600 text-white p-1.5 rounded-full hover:bg-green-700 shadow flex-shrink-0">
                    <MessageCircle size={14}/>
                  </a>
                )}
              </div>
            )) : <div className="text-center py-10 text-gray-300 text-xs italic">Keuangan aman terkendali.</div>}
          </div>
        </div>

        {/* 5. PAKET SEGERA HABIS (TO-DO LIST) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><TrendingUp className="text-orange-500" size={18}/> RENEWAL PAKET</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {expiringPackages.length > 0 ? expiringPackages.map((std, idx) => (
              <div key={idx} className="p-3 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
                <div className="font-bold text-xs text-gray-800">{std.name}</div>
                <div className="text-[10px] text-orange-600 font-bold italic">Paket sudah berjalan 25+ hari. Siapkan tagihan bulan depan!</div>
              </div>
            )) : <div className="text-center py-10 text-gray-300 text-xs italic">Belum ada siswa yang harus perpanjang.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPONENT: DASHBOARD ADMIN (LAYOUT)
// ==========================================
const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row w-full overflow-hidden">
      <div className="md:hidden bg-white p-4 border-b flex justify-between items-center shadow-sm z-20">
        <h1 className="font-black text-xl text-blue-600 italic">GEMILANG<span className="text-gray-800 not-italic">BIZ</span></h1>
        <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600"><Menu/></button>
      </div>

      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-white border-r flex-shrink-0 h-full flex flex-col`}>
        <div className="p-6 border-b hidden md:block">
          <h1 className="font-black text-blue-600 text-2xl italic tracking-tighter">GEMILANG<span className="text-gray-800 not-italic">BIZ</span></h1>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {[
            {id:'dashboard',l:'Beranda',i:Bell}, 
            {id:'schedule',l:'Jadwal',i:Calendar}, 
            {id:'students',l:'Siswa',i:GraduationCap}, 
            {id:'finance',l:'Keuangan',i:DollarSign}, 
            {id:'teachers',l:'Guru',i:Users}, 
            {id:'settings',l:'Pengaturan',i:Settings}
          ].map(m => (
            <button key={m.id} onClick={()=>{setView(m.id); setIsSidebarOpen(false);}} className={`w-full flex gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${view===m.id?'bg-blue-600 text-white shadow-md':'text-gray-500 hover:bg-gray-100'}`}>
              <m.i size={18}/> {m.l}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t bg-gray-50">
          <button onClick={onLogout} className="w-full text-red-600 font-bold text-sm py-2 hover:bg-red-100 rounded border border-red-200">Keluar Sistem</button>
        </div>
      </div>

      {isSidebarOpen && <div onClick={()=>setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden"></div>}

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="font-black uppercase text-gray-400 text-xs tracking-widest">{view} PANEL</h2>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50/50 w-full relative">
          <div className="max-w-7xl mx-auto pb-20"> 
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
// 3. LOGIN PAGE
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
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center text-white">
          <h1 className="font-black text-3xl italic tracking-tighter">GEMILANG<span className="not-italic opacity-50">SYSTEM</span></h1>
          <p className="text-xs opacity-70 mt-1 uppercase font-bold tracking-widest">Education Management</p>
        </div>
        <div className="flex border-b">
          <button onClick={()=>setMode('admin')} className={`flex-1 py-4 text-sm font-black uppercase ${mode==='admin'?'text-blue-600 border-b-4 border-blue-600 bg-blue-50':'text-gray-400'}`}>Admin</button>
          <button onClick={()=>setMode('guru')} className={`flex-1 py-4 text-sm font-black uppercase ${mode==='guru'?'text-green-600 border-b-4 border-green-600 bg-green-50':'text-gray-400'}`}>Guru</button>
        </div>
        <form onSubmit={submit} className="p-8 space-y-6">
          {mode==='admin' ? (
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 font-bold" placeholder="Password Admin"/>
          ) : (
            <select value={guru} onChange={e=>setGuru(e.target.value)} className="w-full border-2 border-gray-300 p-3 rounded-xl font-bold">
              <option value="">-- Pilih Nama --</option>
              {teachers.map((t, i)=><option key={i} value={t.name}>{t.name}</option>)}
            </select>
          )}
          <button className={`w-full text-white py-4 rounded-xl font-black uppercase shadow-lg ${mode==='admin'?'bg-gray-900':'bg-green-600'}`}>Masuk Sistem</button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. ROOT APP
// ==========================================
export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState('');
  
  useEffect(() => { signInAnonymously(auth); }, []);

  const login = (role, username) => {
    setUser(username);
    setPage(role);
  };

  return (
    <div className="antialiased w-full min-h-screen bg-gray-50">
      {page === 'login' && <LoginPage onLogin={login}/>}
      {page === 'admin' && <DashboardAdmin onLogout={()=>setPage('login')}/>}
      {page === 'guru' && <TeacherDashboard db={db} user={user} onLogout={()=>setPage('login')}/>}
    </div>
  );
}