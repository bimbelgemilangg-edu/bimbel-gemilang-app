// --- FILE: src/App.jsx ---
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, setDoc, doc, getDoc, 
  onSnapshot, query, where, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  Bell, Clock, DollarSign, Users, GraduationCap, Calendar, 
  AlertTriangle, CheckCircle, Key, Settings, Menu
} from 'lucide-react';

// --- IMPORT SEMUA HALAMAN BARU ---
import AdminSchedule from './pages/admin/Schedule';
import AdminFinance from './pages/admin/Finance';
import AdminSettings from './pages/admin/Settings'; 
import AdminStudents from './pages/admin/Students'; // <--- INI PENTING!

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

// --- 1. COMPONENT: DASHBOARD HOME ---
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
    const u1 = onSnapshot(query(collection(db, "schedules")), (snap) => {
      const all = snap.docs.map(d => d.data());
      setTodaySchedules(all.filter(s => (s.type === 'routine' && s.day === dayName) || (s.type === 'booking' && s.date === dateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime)));
    });
    const u2 = onSnapshot(query(collection(db, "invoices"), where("remainingAmount", ">", 0)), (snap) => {
      setOverdueInvoices(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(inv => new Date(inv.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 7))));
    });
    return () => { u1(); u2(); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
        <div><h2 className="text-2xl font-bold flex items-center gap-3"><Bell className={isBellRinging?"animate-bounce":""}/> Bel Sekolah</h2><p className="opacity-80">Tekan tombol untuk membunyikan bel.</p></div>
        <button onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold shadow-lg">TEKAN BEL</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-4"><Clock className="text-blue-500"/> Kelas Hari Ini</h3>
          <div className="space-y-3 h-80 overflow-y-auto">
            {todaySchedules.length > 0 ? todaySchedules.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                <div><h4 className="font-bold text-sm">{s.subject}</h4><p className="text-xs text-gray-500">{s.teacherName} • {s.room}</p></div><div className="text-right font-mono font-bold text-blue-600">{s.startTime}</div>
              </div>
            )) : <p className="text-center text-gray-400 py-10">Tidak ada kelas.</p>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-4"><AlertTriangle className="text-red-500"/> Tagihan (H-7)</h3>
          <div className="space-y-3 h-80 overflow-y-auto">
            {overdueInvoices.length > 0 ? overdueInvoices.map((inv, idx) => (
              <div key={idx} className="p-3 border-l-4 border-red-500 bg-red-50 flex justify-between items-center">
                <div><div className="font-bold text-sm">{inv.studentName}</div><div className="text-[10px] text-red-600">Due: {inv.dueDate}</div></div><div className="text-right font-black text-red-600 text-sm">{formatIDR(inv.remainingAmount)}</div>
              </div>
            )) : <div className="text-center py-10 text-gray-400">Keuangan Aman.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. ADMIN TEACHERS ---
const AdminTeachers = () => {
  const [token, setToken] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({name:"", phone:""});
  useEffect(() => {
    getDoc(doc(db, "settings", "attendanceToken")).then(s => s.exists() && setToken(s.data().token));
    const unsub = onSnapshot(query(collection(db, "users"), where("role","==","guru")), s => setTeachers(s.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => unsub();
  }, []);
  const saveToken = async () => {
    if(!token) return alert("Token tidak boleh kosong");
    await setDoc(doc(db, "settings", "attendanceToken"), { token: token.toUpperCase() });
    alert("Token Absensi Tersimpan!");
  };
  const addGuru = async (e) => {
    e.preventDefault();
    await addDoc(collection(db,"users"),{...form, role:"guru", createdAt: serverTimestamp()});
    setForm({name:"", phone:""});
  };
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3"><div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Key size={24}/></div><div><h3 className="font-bold text-gray-800">Token Absensi Guru</h3><p className="text-xs text-gray-500">Guru wajib memasukkan kode ini untuk absen.</p></div></div>
        <div className="flex gap-2 w-full md:w-auto"><input value={token} onChange={e=>setToken(e.target.value.toUpperCase())} className="border-2 border-gray-200 p-2 rounded-lg font-mono font-bold text-center tracking-widest uppercase flex-1" placeholder="KODE123"/><button onClick={saveToken} className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800">SIMPAN</button></div>
      </div>
      <div className="bg-white p-6 rounded-xl border"><h2 className="font-bold mb-4 flex items-center gap-2"><Users className="text-blue-600"/> Master Data Guru</h2><form onSubmit={addGuru} className="flex gap-2 mb-6 p-4 bg-gray-50 rounded-lg border"><input placeholder="Nama Lengkap Guru" className="border p-2 rounded flex-1" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><input placeholder="No. HP" className="border p-2 rounded w-32" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><button className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700">+</button></form><div className="space-y-2 max-h-96 overflow-y-auto">{teachers.map(t=>(<div key={t.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors"><span className="font-bold text-gray-700">{t.name}</span><span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{t.phone || "No Phone"}</span></div>))}</div></div>
    </div>
  );
};

// --- 3. DASHBOARD GURU ---
const DashboardGuru = ({ guruName, onLogout }) => {
  const [tokenInput, setTokenInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const handleAbsen = async (e) => {
    e.preventDefault();
    try {
      const snap = await getDoc(doc(db, "settings", "attendanceToken"));
      if (!snap.exists()) throw new Error("Sistem belum di-setup.");
      if (tokenInput.toUpperCase() === snap.data().token) {
        await addDoc(collection(db, "attendance_teachers"), { name: guruName, timestamp: serverTimestamp(), status: 'Hadir', date: new Date().toISOString().split('T')[0] });
        setStatusMsg("✅ ABSENSI BERHASIL!");
      } else { setStatusMsg("❌ Token Salah."); }
    } catch (err) { setStatusMsg("Error: " + err.message); }
  };
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border-t-4 border-green-600"><div className="flex justify-between items-start mb-6"><div><h1 className="text-2xl font-bold text-gray-800">Halo, {guruName}</h1><p className="text-sm text-gray-500">Silakan absen.</p></div><button onClick={onLogout} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm font-bold">Keluar</button></div>{statusMsg ? <div className="p-4 bg-green-100 text-green-700 font-bold rounded text-center">{statusMsg}</div> : <form onSubmit={handleAbsen} className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Token Absensi</label><input value={tokenInput} onChange={e=>setTokenInput(e.target.value)} className="w-full border-2 border-gray-300 p-3 rounded-xl font-mono text-center text-xl font-bold uppercase" placeholder="TOKEN"/></div><button className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg">KIRIM ABSENSI</button></form>}</div></div>
  );
};

// --- MAIN LAYOUT ---
const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r hidden md:block flex-shrink-0"><div className="p-6 border-b"><h1 className="font-black text-blue-600 text-xl italic">GEMILANG<span className="text-gray-800 not-italic">BIZ</span></h1></div><nav className="p-4 space-y-1">{[
        {id:'dashboard', label:'Beranda', icon:<Bell size={18}/>},
        {id:'schedule', label:'Penjadwalan', icon:<Calendar size={18}/>},
        {id:'finance', label:'Keuangan', icon:<DollarSign size={18}/>},
        {id:'teachers', label:'Data Guru', icon:<Users size={18}/>},
        {id:'students', label:'Data Siswa', icon:<GraduationCap size={18}/>},
        {id:'settings', label:'Pengaturan', icon:<Settings size={18}/>}
      ].map(m => <button key={m.id} onClick={()=>setView(m.id)} className={`w-full flex gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${view===m.id?'bg-blue-600 text-white shadow-lg':'text-gray-500 hover:bg-gray-50'}`}>{m.icon} {m.label}</button>)}</nav></div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden"><header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm shrink-0"><h2 className="font-black uppercase text-gray-400 text-xs tracking-widest">{view}</h2><button onClick={onLogout} className="text-red-500 font-bold text-sm hover:bg-red-50 px-3 py-1 rounded-lg">Keluar</button></header>
        <main className="flex-1 overflow-auto p-6 bg-gray-50/50">
          {view === 'dashboard' && <DashboardHome />}
          {view === 'schedule' && <AdminSchedule db={db} />}
          {view === 'finance' && <AdminFinance db={db} />}
          {view === 'teachers' && <AdminTeachers />}
          
          {/* INI KUNCI SUKSESNYA: MENGIRIM PROP db KE COMPONENT BARU */}
          {view === 'students' && <AdminStudents db={db} />}
          
          {view === 'settings' && <AdminSettings db={db} />}
        </main>
      </div>
    </div>
  );
};

// --- LOGIN ---
const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('admin');
  const [pass, setPass] = useState('');
  const [guru, setGuru] = useState('');
  const [teachers, setTeachers] = useState([]);
  useEffect(() => onSnapshot(query(collection(db, "users"), where("role","==","guru")), s => setTeachers(s.docs.map(d => d.data()))), []);
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"><div className="bg-blue-600 p-8 text-center text-white"><h1 className="font-black text-3xl italic tracking-tighter">GEMILANG<span className="not-italic opacity-50">SYSTEM</span></h1></div><div className="flex border-b"><button onClick={()=>setMode('admin')} className={`flex-1 py-4 text-sm font-black uppercase ${mode==='admin'?'text-blue-600 border-b-4 border-blue-600':'text-gray-400'}`}>Admin</button><button onClick={()=>setMode('guru')} className={`flex-1 py-4 text-sm font-black uppercase ${mode==='guru'?'text-green-600 border-b-4 border-green-600':'text-gray-400'}`}>Guru</button></div><div className="p-8 space-y-4">{mode==='admin' ? <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full border-2 p-3 rounded-xl font-bold" placeholder="Password Admin"/> : <select value={guru} onChange={e=>setGuru(e.target.value)} className="w-full border-2 p-3 rounded-xl font-bold"><option value="">Pilih Guru</option>{teachers.map(t=><option key={t.name}>{t.name}</option>)}</select>}<button onClick={() => { if(mode==='admin' && pass==='admin123') onLogin('admin','Admin'); else if(mode==='guru' && guru) onLogin('guru',guru); }} className="w-full bg-gray-900 text-white py-4 rounded-xl font-black uppercase shadow-lg">Masuk</button></div></div></div>
  );
};

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState('');
  useEffect(() => { signInAnonymously(auth); }, []);
  return (
    <div className="antialiased">
      {page === 'login' && <LoginPage onLogin={(r,u)=>{setUser(u); setPage(r==='admin'?'admin':'guru');}}/>}
      {page === 'admin' && <DashboardAdmin onLogout={()=>setPage('login')}/>}
      {page === 'guru' && <DashboardGuru guruName={user} onLogout={()=>setPage('login')}/>}
    </div>
  );
}