import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, 
  onSnapshot, query, where, orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  Bell, Clock, DollarSign, Users, GraduationCap, Calendar, 
  AlertTriangle, Settings, MessageCircle, Menu, LogOut, TrendingUp, BarChart3
} from 'lucide-react';

// --- IMPORT FILE HALAMAN LAMA (Jadwal, Guru, Setting) ---
import AdminSchedule from './pages/admin/Schedule';
import AdminSettings from './pages/admin/Settings'; 
import AdminTeachers from './pages/admin/Teachers';
import TeacherDashboard from './pages/teacher/Dashboard';

// --- 🔴 BYPASS FINANCE (LANGSUNG KE FOLDER) ---
// Memaksa sistem membaca file index.jsx di dalam folder finance
import AdminFinance from './pages/admin/finance/index.jsx'; 

// --- 🔴 BYPASS SISWA (LANGSUNG KE FOLDER) ---
// Memanggil komponen langsung dari folder students
import StudentList from './pages/admin/students/StudentList';
import StudentForm from './pages/admin/students/StudentForm'; 
import StudentDetail from './pages/admin/students/StudentDetail';

// --- WRAPPER SISWA (PENGGANTI STUDENTS.JSX) ---
// Komponen pembungkus ini menggantikan peran file Students.jsx yang bermasalah
function AdminStudentsWrapper({ db }) {
  const [view, setView] = useState('list'); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]); 
  const [payments, setPayments] = useState([]); 
  const [classLogs, setClassLogs] = useState([]); 

  useEffect(() => {
    // Menggunakan require untuk menghindari error import
    const u1 = onSnapshot(query(collection(db, "students"), (require('firebase/firestore').orderBy)("createdAt", "desc")), s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, "invoices"), s => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u3 = onSnapshot(query(collection(db, "payments"), (require('firebase/firestore').orderBy)("date", "desc")), s => setPayments(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u4 = onSnapshot(query(collection(db, "class_logs"), (require('firebase/firestore').orderBy)("date", "desc")), s => setClassLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { u1(); u2(); u3(); u4(); };
  }, [db]);

  const handleCreate = () => { setSelectedStudent(null); setView('form'); };
  const handleEdit = (s) => { setSelectedStudent(s); setView('form'); };
  const handleDetail = (s) => { setSelectedStudent(s); setView('detail'); };
  const handleBack = () => { setView('list'); setSelectedStudent(null); };

  return (
    <div className="w-full">
      {view === 'list' && <StudentList db={db} students={students} classLogs={classLogs} onSelect={handleDetail} onCreate={handleCreate} />}
      {view === 'detail' && selectedStudent && <StudentDetail student={selectedStudent} studentInvoices={invoices.filter(i => i.studentId === selectedStudent.id)} studentPayments={payments.filter(p => p.studentName === selectedStudent.name)} studentLogs={classLogs.filter(l => l.studentsLog.some(s => s.id === selectedStudent.id))} onBack={handleBack} onEdit={() => handleEdit(selectedStudent)} />}
      {view === 'form' && <StudentForm db={db} initialData={selectedStudent} onCancel={handleBack} onSuccess={handleBack} />}
    </div>
  );
}

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
const MONTHS_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// --- MARKETING CHART ---
const MarketingChart = ({ data, label, color }) => {
  const max = Math.max(...data, 5);
  const height = 100;
  const width = 300;
  const points = data.map((val, i) => `${(i * (width / (data.length - 1)))},${height - (val / max * height)}`).join(' ');

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-black uppercase text-gray-400">{label}</span>
        <span className="text-xs font-black" style={{ color }}>{data[data.length-1]} Siswa</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        <polyline fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} className="drop-shadow-lg" />
        {data.map((val, i) => (
          <circle key={i} cx={(i * (width / (data.length - 1)))} cy={height - (val / max * height)} r="4" fill="white" stroke={color} strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
};

// --- DASHBOARD HOME ---
const DashboardHome = () => {
  const [stats, setStats] = useState({ siswa: 0, sd: 0, smp: 0, guruHadir: 0 });
  const [marketingTrend, setMarketingTrend] = useState(new Array(12).fill(0));
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
    carrier.connect(ctx.destination);
    carrier.start(); audioContextRef.current = ctx; oscillatorRef.current = carrier; 
  };
  const stopBell = () => { if(!isBellRinging) return; setIsBellRinging(false); oscillatorRef.current?.stop(); audioContextRef.current?.close(); };

  useEffect(() => {
    const dayName = DAYS_INDONESIA[new Date().getDay()];
    const dateStr = new Date().toISOString().split('T')[0];
    
    const unsubStudents = onSnapshot(collection(db, "students"), s => {
      const all = s.docs.map(d => ({id: d.id, ...d.data()}));
      const sd = all.filter(x => x.schoolLevel === 'SD').length;
      const smp = all.filter(x => x.schoolLevel === 'SMP').length;
      const trend = new Array(12).fill(0);
      all.forEach(std => { if(std.createdAt) { const m = std.createdAt.toDate().getMonth(); trend[m]++; } });
      setMarketingTrend(trend);
      setStats(prev => ({ ...prev, siswa: s.size, sd, smp }));
      setExpiringPackages(all.filter(std => { if(!std.createdAt) return false; const diff = Math.ceil(Math.abs(new Date() - std.createdAt.toDate()) / (1000 * 60 * 60 * 24)); return diff >= 25; }));
    });

    const unsubInvoices = onSnapshot(query(collection(db, "invoices"), where("remainingAmount", ">", 0)), snap => {
      const h7 = new Date(); h7.setDate(h7.getDate() + 7);
      setOverdueInvoices(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(inv => new Date(inv.dueDate) <= h7));
    });

    const unsubLogs = onSnapshot(query(collection(db, "class_logs"), where("date", "==", dateStr)), s => { setStats(prev => ({ ...prev, guruHadir: s.size })); });
    const unsubSched = onSnapshot(query(collection(db, "schedules")), snap => { setTodaySchedules(snap.docs.map(d => d.data()).filter(s => (s.type === 'routine' && s.day === dayName) || (s.type === 'booking' && s.date === dateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime))); });

    return () => { unsubStudents(); unsubInvoices(); unsubLogs(); unsubSched(); };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border shadow-sm"><Users className="text-blue-500 mb-2"/><div className="text-3xl font-black">{stats.siswa}</div><div className="text-[10px] font-bold text-gray-400 uppercase">Siswa Aktif</div></div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm"><TrendingUp className="text-green-500 mb-2"/><div className="text-3xl font-black">{stats.sd}</div><div className="text-[10px] font-bold text-gray-400 uppercase">Siswa SD</div></div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm"><TrendingUp className="text-purple-500 mb-2"/><div className="text-3xl font-black">{stats.smp}</div><div className="text-[10px] font-bold text-gray-400 uppercase">Siswa SMP</div></div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm"><Calendar className="text-orange-500 mb-2"/><div className="text-3xl font-black">{stats.guruHadir}</div><div className="text-[10px] font-bold text-gray-400 uppercase">Kelas Hari Ini</div></div>
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
        <h3 className="text-lg font-black mb-8 flex items-center gap-3 uppercase tracking-widest"><BarChart3 className="text-blue-600"/> Grafik Pertumbuhan Pendaftaran</h3>
        <MarketingChart data={marketingTrend} label="Tren Siswa Baru (Bulan)" color="#2563eb" />
        <div className="flex justify-between mt-4 px-2">{MONTHS_LABEL.map(m => <span key={m} className="text-[10px] font-bold text-gray-300">{m}</span>)}</div>
      </div>
      <div className="w-full bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div><h2 className="text-3xl font-black flex items-center gap-4"><Bell className={isBellRinging?"animate-bounce text-yellow-400":""}/> BEL SEKOLAH</h2><p className="opacity-50 mt-2">Tahan untuk bunyi, lepas untuk berhenti.</p></div>
        <button onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} className="bg-red-600 hover:bg-red-700 text-white px-16 py-6 rounded-2xl font-black text-2xl shadow-2xl transition-all active:scale-95">BUNYIKAN</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border shadow-sm"><h3 className="font-bold border-b pb-4 mb-4 flex gap-2"><Clock className="text-blue-500"/> JADWAL AKTIF</h3><div className="space-y-3">{todaySchedules.map((s, i) => (<div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border"><div><div className="font-bold text-xs">{s.subject}</div><div className="text-[10px] text-gray-400">{s.teacherName}</div></div><div className="font-black text-blue-600 text-xs">{s.startTime}</div></div>))}</div></div>
        <div className="bg-white p-8 rounded-3xl border shadow-sm"><h3 className="font-bold border-b pb-4 mb-4 flex gap-2"><AlertTriangle className="text-red-500"/> JATUH TEMPO</h3><div className="space-y-3">{overdueInvoices.map((inv, i) => (<div key={i} className="p-3 border-l-4 border-red-500 bg-red-50 flex justify-between items-center rounded-r-xl"><div className="overflow-hidden"><div className="font-bold text-xs truncate w-32">{inv.studentName}</div><div className="text-[10px] text-red-600">{inv.dueDate}</div></div>{inv.waPhone && <a href={`https://wa.me/${inv.waPhone}`} target="_blank" className="bg-green-600 text-white p-1.5 rounded-full"><MessageCircle size={14}/></a>}</div>))}</div></div>
        <div className="bg-white p-8 rounded-3xl border shadow-sm"><h3 className="font-bold border-b pb-4 mb-4 flex gap-2"><TrendingUp className="text-orange-500"/> RENEWAL PAKET</h3><div className="space-y-3">{expiringPackages.map((std, i) => (<div key={i} className="p-3 border-l-4 border-orange-500 bg-orange-50 rounded-r-xl"><div className="font-black text-xs">{std.name}</div><div className="text-[10px] text-orange-700 italic">Segera siapkan invoice perpanjangan.</div></div>))}</div></div>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ADMIN (SUDAH DIPERBAIKI) ---
const DashboardAdmin = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row w-full overflow-x-hidden font-sans">
      <div className="md:hidden bg-white p-5 border-b flex justify-between items-center z-30 shadow-sm">
        <h1 className="font-black text-2xl text-blue-600 tracking-tighter">GEMILANG</h1>
        <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-100 rounded-lg"><Menu/></button>
      </div>
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform z-40 w-72 bg-white border-r h-full flex flex-col shadow-xl md:shadow-none`}>
        <div className="p-8 border-b hidden md:block text-center"><h1 className="font-black text-blue-600 text-3xl italic tracking-tighter">GEMILANG</h1></div>
        <nav className="p-6 space-y-2 flex-1 overflow-y-auto">
          {[{id:'dashboard',l:'Beranda',i:Bell}, {id:'schedule',l:'Jadwal',i:Calendar}, {id:'students',l:'Siswa',i:GraduationCap}, {id:'finance',l:'Keuangan',i:DollarSign}, {id:'teachers',l:'Guru',i:Users}, {id:'settings',l:'Pengaturan',i:Settings}].map(m => (
            <button key={m.id} onClick={()=>{setView(m.id); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${view===m.id?'bg-blue-600 text-white shadow-xl translate-x-2':'text-gray-400 hover:bg-gray-50'}`}><m.i size={20}/> {m.l}</button>
          ))}
        </nav>
        <div className="p-6 border-t bg-gray-50"><button onClick={onLogout} className="w-full text-red-600 font-black text-xs py-4 hover:bg-red-50 rounded-2xl border-2 border-red-100 flex items-center justify-center gap-2 transition-all"><LogOut size={16}/> Logout</button></div>
      </div>
      {isSidebarOpen && <div onClick={()=>setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"></div>}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative bg-gray-50">
        <header className="bg-white border-b px-10 py-6 flex justify-between items-center flex-shrink-0 shadow-sm z-10"><h2 className="font-black uppercase text-gray-400 text-sm tracking-widest">{view}</h2><div className="font-black text-[10px] text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">ADMINISTRATOR</div></header>
        <main className="flex-1 overflow-auto bg-gray-50 w-full relative">
          <div className="h-full w-full"> 
            {view === 'dashboard' && <div className="p-8 md:p-10 max-w-[1600px] mx-auto"><DashboardHome /></div>}
            {view === 'schedule' && <div className="p-8 md:p-10 max-w-[1600px] mx-auto"><AdminSchedule db={db} /></div>}
            
            {/* --- INI DIA YANG BAPAK CARI: MEMANGGIL FOLDER BARU --- */}
            {view === 'finance' && <AdminFinance db={db} />}
            {view === 'students' && <div className="p-8 md:p-10 max-w-[1600px] mx-auto"><AdminStudentsWrapper db={db} /></div>}
            
            {view === 'teachers' && <div className="p-8 md:p-10 max-w-[1600px] mx-auto"><AdminTeachers db={db} /></div>} 
            {view === 'settings' && <div className="p-8 md:p-10 max-w-[1600px] mx-auto"><AdminSettings db={db} /></div>}
          </div>
        </main>
      </div>
    </div>
  );
};

// --- LOGIN PAGE ---
const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('admin');
  const [pass, setPass] = useState('');
  const [guru, setGuru] = useState('');
  const [teachers, setTeachers] = useState([]);

  useEffect(() => { onSnapshot(query(collection(db, "users"), where("role","==","guru")), s => setTeachers(s.docs.map(d => d.data()))); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if(mode === 'admin') {
      const authSnap = await getDoc(doc(db, "settings", "auth"));
      const correctPass = authSnap.exists() ? authSnap.data().password : 'admin123';
      if(pass === correctPass) onLogin('admin', 'Admin'); else alert("Sandi Salah!");
    } else { if(guru) onLogin('guru', guru); else alert("Pilih Guru!"); }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-blue-600 p-12 text-center text-white"><h1 className="font-black text-5xl italic tracking-tighter">GEMILANG</h1><p className="text-xs font-bold uppercase tracking-widest mt-2 opacity-80">Tutoring Management System</p></div>
        <div className="flex bg-gray-50 border-b"><button onClick={()=>setMode('admin')} className={`flex-1 py-6 text-sm font-black uppercase transition-colors ${mode==='admin'?'bg-white text-blue-600 border-b-4 border-blue-600':'text-gray-400 hover:bg-gray-100'}`}>Admin</button><button onClick={()=>setMode('guru')} className={`flex-1 py-6 text-sm font-black uppercase transition-colors ${mode==='guru'?'bg-white text-green-600 border-b-4 border-green-600':'text-gray-400 hover:bg-gray-100'}`}>Guru</button></div>
        <form onSubmit={submit} className="p-12 space-y-8 bg-white">
          {mode==='admin' ? (<div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-4">Kata Sandi</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full border-4 border-gray-100 p-5 rounded-[2rem] outline-none focus:border-blue-600 font-bold text-xl text-center placeholder:text-gray-300" placeholder="••••••"/></div>) : (<div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-4">Pilih Akun</label><select value={guru} onChange={e=>setGuru(e.target.value)} className="w-full border-4 border-gray-100 p-5 rounded-[2rem] font-bold text-xl text-center outline-none focus:border-green-600 bg-white"><option value="">-- Nama Guru --</option>{teachers.map((t, i)=><option key={i} value={t.name}>{t.name}</option>)}</select></div>)}
          <button className={`w-full text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest active:scale-95 transition-all shadow-xl ${mode==='admin'?'bg-slate-900 hover:bg-black':'bg-green-600 hover:bg-green-700'}`}>Masuk</button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState('');
  useEffect(() => { signInAnonymously(auth).catch(console.error); }, []);
  return (<div className="antialiased w-full min-h-screen bg-white">{page === 'login' && <LoginPage onLogin={(role, name)=>{setUser(name); setPage(role);}}/>}{page === 'admin' && <DashboardAdmin onLogout={()=>setPage('login')}/>}{page === 'guru' && <TeacherDashboard db={db} user={user} onLogout={()=>setPage('login')}/>}</div>);
}