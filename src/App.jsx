import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, setDoc, doc, getDoc, 
  onSnapshot, query, where, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  Bell, Clock, DollarSign, Users, GraduationCap, Calendar, 
  AlertTriangle, CheckCircle, Key, Settings, MessageCircle, Menu, X
} from 'lucide-react';

// --- IMPORT HALAMAN ---
import AdminSchedule from './pages/admin/Schedule';
import AdminFinance from './pages/admin/Finance';
import AdminSettings from './pages/admin/Settings'; 
import AdminStudents from './pages/admin/Students';

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
// 1. COMPONENT: DASHBOARD HOME
// ==========================================
const DashboardHome = () => {
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [isBellRinging, setIsBellRinging] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);

  const startBell = () => {
    if (isBellRinging) return;
    setIsBellRinging(true);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const carrier = ctx.createOscillator(); carrier.frequency.value = 880; carrier.type = 'square';
    const lfo = ctx.createOscillator(); lfo.frequency.value = 25; lfo.type = 'square';
    const gain = ctx.createGain(); const lfoGain = ctx.createGain();
    lfo.connect(lfoGain.gain); carrier.connect(gain); gain.connect(ctx.destination);
    carrier.start(); lfo.start();
    audioContextRef.current = ctx; oscillatorRef.current = carrier; 
  };
  const stopBell = () => {
    if(!isBellRinging) return;
    setIsBellRinging(false);
    if(oscillatorRef.current) oscillatorRef.current.stop();
    if(audioContextRef.current) audioContextRef.current.close();
  };

  useEffect(() => {
    const dayName = DAYS_INDONESIA[new Date().getDay()];
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Jadwal Hari Ini
    const u1 = onSnapshot(query(collection(db, "schedules")), (snap) => {
      const all = snap.docs.map(d => d.data());
      setTodaySchedules(all.filter(s => (s.type === 'routine' && s.day === dayName) || (s.type === 'booking' && s.date === dateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime)));
    });

    // Tagihan H-7
    const u2 = onSnapshot(query(collection(db, "invoices"), where("remainingAmount", ">", 0)), (snap) => {
      const sevenDaysLater = new Date(); 
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const filtered = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(inv => new Date(inv.dueDate) <= sevenDaysLater);
      setOverdueInvoices(filtered);
    });
    return () => { u1(); u2(); };
  }, []);

  return (
    <div className="space-y-6">
      {/* WIDGET BEL */}
      <div className="w-full bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold flex items-center gap-3"><Bell className={isBellRinging?"animate-bounce":""}/> Bel Sekolah</h2><p className="opacity-90">Bunyikan manual saat pergantian jam.</p></div>
        <button onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} className="w-full md:w-auto bg-white text-red-600 px-8 py-4 rounded-lg font-bold shadow-lg hover:bg-gray-100 active:scale-95 transition-transform">TEKAN BEL</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WIDGET KELAS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-4 border-b pb-2"><Clock className="text-blue-500"/> Kelas Hari Ini</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {todaySchedules.length > 0 ? todaySchedules.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                <div><h4 className="font-bold text-sm text-gray-800">{s.subject}</h4><p className="text-xs text-gray-500">{s.teacherName} • {s.room}</p></div>
                <div className="text-right font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{s.startTime}</div>
              </div>
            )) : <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border border-dashed">Tidak ada kelas aktif saat ini.</div>}
          </div>
        </div>

        {/* WIDGET TAGIHAN */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-4 border-b pb-2"><AlertTriangle className="text-red-500"/> Tagihan (H-7 Jatuh Tempo)</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {overdueInvoices.length > 0 ? overdueInvoices.map((inv, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border-l-4 border-red-500 bg-red-50 rounded shadow-sm">
                <div className="overflow-hidden">
                  <div className="font-bold text-sm text-gray-800 truncate">{inv.studentName}</div>
                  <div className="text-xs text-red-600 font-medium">Jatuh Tempo: {inv.dueDate}</div>
                  <div className="font-black text-xs text-red-700 mt-1">{formatIDR(inv.remainingAmount)}</div>
                </div>
                {inv.waPhone && (
                  <a href={generateWALink(inv.waPhone, inv.studentName, inv.remainingAmount)} target="_blank" rel="noreferrer" className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 shadow flex-shrink-0">
                    <MessageCircle size={18}/>
                  </a>
                )}
              </div>
            )) : <div className="text-center py-10 text-gray-400 bg-green-50 rounded border border-green-100 border-dashed">Keuangan Aman. Tidak ada tunggakan mendesak.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPONENT: ADMIN TEACHERS
// ==========================================
const AdminTeachers = () => {
  const [token, setToken] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({name:"", phone:""});
  useEffect(() => {
    getDoc(doc(db, "settings", "attendanceToken")).then(s => s.exists() && setToken(s.data().token));
    const unsub = onSnapshot(query(collection(db, "users"), where("role","==","guru")), s => setTeachers(s.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => unsub();
  }, []);
  const saveToken = async () => { if(!token) return alert("Kosong!"); await setDoc(doc(db, "settings", "attendanceToken"), { token: token.toUpperCase() }); alert("Tersimpan!"); };
  const addGuru = async (e) => { e.preventDefault(); await addDoc(collection(db,"users"),{...form, role:"guru", createdAt: serverTimestamp()}); setForm({name:"", phone:""}); };
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 items-center"><div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Key/></div><div><h3 className="font-bold text-gray-800">Token Absensi</h3><p className="text-xs text-gray-500">Password untuk guru absen.</p></div></div>
        <div className="flex gap-2 w-full md:w-auto"><input value={token} onChange={e=>setToken(e.target.value.toUpperCase())} className="border-2 p-2 rounded flex-1 text-center font-bold tracking-widest uppercase" placeholder="TOKEN"/><button onClick={saveToken} className="bg-black text-white px-4 py-2 rounded font-bold">SIMPAN</button></div>
      </div>
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="font-bold mb-4 flex gap-2"><Users className="text-blue-600"/> Data Guru</h2>
        <form onSubmit={addGuru} className="flex gap-2 mb-4"><input placeholder="Nama Guru" className="border p-2 rounded flex-1" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><input placeholder="HP" className="border p-2 rounded w-32" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><button className="bg-blue-600 text-white px-4 rounded font-bold">+</button></form>
        <div className="space-y-2 h-64 overflow-y-auto">{teachers.map(t=><div key={t.id} className="p-3 border rounded flex justify-between bg-gray-50"><span className="font-bold">{t.name}</span><span className="text-gray-500 text-sm">{t.phone}</span></div>)}</div>
      </div>
    </div>
  );
};

// ==========================================
// 3. COMPONENT: DASHBOARD GURU
// ==========================================
const DashboardGuru = ({ guruName, onLogout }) => {
  const [tokenInput, setTokenInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const handleAbsen = async (e) => {
    e.preventDefault();
    try {
      const snap = await getDoc(doc(db, "settings", "attendanceToken"));
      if (!snap.exists()) throw new Error("Sistem belum siap.");
      if (tokenInput.toUpperCase() === snap.data().token) {
        await addDoc(collection(db, "attendance_teachers"), { name: guruName, timestamp: serverTimestamp(), status: 'Hadir', date: new Date().toISOString().split('T')[0] });
        setStatusMsg("✅ ABSENSI BERHASIL! Semangat Mengajar.");
      } else { setStatusMsg("❌ Token Salah."); }
    } catch (err) { setStatusMsg("Error: " + err.message); }
  };
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border-t-4 border-green-600">
        <div className="flex justify-between items-start mb-6"><div><h1 className="text-2xl font-bold text-gray-800">Halo, {guruName}</h1><p className="text-sm text-gray-500">Silakan absen sebelum kelas.</p></div><button onClick={onLogout} className="text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded">Keluar</button></div>
        {statusMsg ? <div className={`p-4 rounded text-center font-bold mb-4 ${statusMsg.includes('✅')?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{statusMsg}</div> : 
        <form onSubmit={handleAbsen} className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Token Absensi</label><input value={tokenInput} onChange={e=>setTokenInput(e.target.value)} className="w-full border-2 border-gray-300 p-3 rounded-xl font-mono text-center text-xl font-bold uppercase tracking-widest focus:border-green-600 outline-none" placeholder="TOKEN"/></div><button className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700">KIRIM ABSENSI</button></form>}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN LAYOUT ADMIN (RESPONSIVE FIX)
// ==========================================
const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Menu State

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row w-full overflow-hidden">
      
      {/* MOBILE HEADER (HAMBURGER MENU) */}
      <div className="md:hidden bg-white p-4 border-b flex justify-between items-center shadow-sm z-20">
        <h1 className="font-black text-xl text-blue-600 italic">GEMILANG<span className="text-gray-800 not-italic">BIZ</span></h1>
        <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600"><Menu/></button>
      </div>

      {/* SIDEBAR (RESPONSIVE) */}
      <div className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:relative md:translate-x-0 transition duration-200 ease-in-out z-30
        w-64 bg-white border-r flex-shrink-0 shadow-xl md:shadow-none h-full flex flex-col
      `}>
        <div className="p-6 border-b hidden md:block">
          <h1 className="font-black text-blue-600 text-2xl italic tracking-tighter">GEMILANG<span className="text-gray-800 not-italic">BIZ</span></h1>
        </div>
        
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {[
            {id:'dashboard',l:'Beranda',i:Bell}, {id:'schedule',l:'Jadwal',i:Calendar}, 
            {id:'students',l:'Siswa',i:GraduationCap}, {id:'finance',l:'Keuangan',i:DollarSign}, 
            {id:'teachers',l:'Guru',i:Users}, {id:'settings',l:'Pengaturan',i:Settings}
          ].map(m => (
            <button key={m.id} onClick={()=>{setView(m.id); setIsSidebarOpen(false);}} 
              className={`w-full flex gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${view===m.id?'bg-blue-600 text-white shadow-md':'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <m.i size={18}/> {m.l}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t bg-gray-50">
          <button onClick={onLogout} className="w-full text-red-600 font-bold text-sm py-2 hover:bg-red-100 rounded border border-red-200">Keluar Sistem</button>
        </div>
      </div>

      {/* OVERLAY UNTUK MOBILE */}
      {isSidebarOpen && <div onClick={()=>setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden"></div>}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm flex-shrink-0">
          <h2 className="font-black uppercase text-gray-400 text-xs tracking-widest md:text-sm">{view} PANEL</h2>
          <div className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full hidden md:block">ADMINISTRATOR</div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50/50 w-full relative">
          <div className="max-w-7xl mx-auto pb-20"> {/* Container Limit agar tidak terlalu lebar di layar besar */}
            {view === 'dashboard' && <DashboardHome />}
            {view === 'schedule' && <AdminSchedule db={db} />}
            {view === 'finance' && <AdminFinance db={db} />}
            {view === 'teachers' && <AdminTeachers />}
            {view === 'students' && <AdminStudents db={db} />}
            {view === 'settings' && <AdminSettings db={db} />}
          </div>
        </main>
      </div>
    </div>
  );
};

// ==========================================
// 5. LOGIN PAGE (FULL SCREEN CENTER FIX)
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
    // FIX UTAMA DISINI: w-full dan h-screen memastikan full layar
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <div className="bg-blue-600 p-8 text-center text-white">
          <h1 className="font-black text-3xl italic tracking-tighter">GEMILANG<span className="not-italic opacity-50">SYSTEM</span></h1>
          <p className="text-xs opacity-70 mt-1 uppercase font-bold tracking-widest">Education Management</p>
        </div>
        
        <div className="flex border-b">
          <button onClick={()=>setMode('admin')} className={`flex-1 py-4 text-sm font-black uppercase transition-colors ${mode==='admin'?'text-blue-600 border-b-4 border-blue-600 bg-blue-50':'text-gray-400 hover:bg-gray-50'}`}>Admin</button>
          <button onClick={()=>setMode('guru')} className={`flex-1 py-4 text-sm font-black uppercase transition-colors ${mode==='guru'?'text-green-600 border-b-4 border-green-600 bg-green-50':'text-gray-400 hover:bg-gray-50'}`}>Guru</button>
        </div>

        <form onSubmit={submit} className="p-8 space-y-6">
          {mode==='admin' ? (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Password Admin</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 font-bold text-gray-800 transition-colors" placeholder="Masukkan Kode..."/>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nama Guru</label>
              <select value={guru} onChange={e=>setGuru(e.target.value)} className="w-full border-2 border-gray-300 p-3 rounded-xl font-bold text-gray-800 outline-none focus:border-green-600 transition-colors">
                <option value="">-- Pilih Nama --</option>
                {teachers.map((t, i)=><option key={i} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          )}
          <button className={`w-full text-white py-4 rounded-xl font-black uppercase shadow-lg transition-transform active:scale-95 ${mode==='admin'?'bg-gray-900 hover:bg-blue-800':'bg-green-600 hover:bg-green-700'}`}>Masuk Sistem</button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 6. ROOT APP
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
      {page === 'guru' && <DashboardGuru guruName={user} onLogout={()=>setPage('login')}/>}
    </div>
  );
}