import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, 
  onSnapshot, query, getDoc, setDoc, where 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  LayoutDashboard, Users, GraduationCap, Calendar, DollarSign, 
  Bell, Settings, Trash2, PlusCircle, LogOut, Key,
  TrendingUp, TrendingDown, Save, User, Briefcase, MapPin, 
  Phone, Calculator, Percent, FileText, Download, Map, 
  CheckCircle, Clock, AlertTriangle, MessageCircle, CreditCard, 
  CalendarClock, Wallet, Landmark, PieChart, ClipboardCheck, 
  BookOpen, Lock, X, Search, Filter, Info, AlertOctagon, UserCheck, ListChecks,
  Maximize, Minimize, Printer, FileSpreadsheet, FileBarChart, Monitor, Smartphone, Edit, ArrowRightCircle, School, Layers,
  ChevronRight, Check, ShieldCheck
} from 'lucide-react';

// ==========================================
// 1. KONFIGURASI & HELPER
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",
  authDomain: "gemilangsystem.firebaseapp.com",
  projectId: "gemilangsystem",
  storageBucket: "gemilangsystem.firebasestorage.app",
  messagingSenderId: "1078433073773",
  appId: "1:1078433073773:web:cdb13ae553efbc1d1bcd64"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'gemilang-data-production';

const getCollection = (name) => collection(db, 'artifacts', APP_ID, 'public', 'data', name);
const getDocRef = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);

const formatRupiah = (num) => new Intl.NumberFormat('id-ID').format(num);

const PRICING = {
  SD: { '1': { price: 250000, installments: 1 }, '3': { price: 675000, installments: 2 }, '6': { price: 1200000, installments: 3 } },
  SMP: { '1': { price: 300000, installments: 1 }, '3': { price: 810000, installments: 2 }, '6': { price: 1500000, installments: 3 } }
};
const ROOMS = ['MERKURIUS', 'VENUS', 'BUMI', 'MARS', 'JUPITER'];
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// ==========================================
// 2. KOMPONEN UI UMUM
// ==========================================

const ToastContext = React.createContext();
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-xl text-white text-sm font-bold animate-in slide-in-from-right fade-in duration-300 flex items-center gap-3 ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-slate-800'}`}>
            {t.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
const useToast = () => React.useContext(ToastContext);

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isDanger = false }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isDanger ? <AlertOctagon size={24} /> : <Info size={24} />}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-700 mb-6 whitespace-pre-line leading-relaxed italic">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-black text-slate-700 hover:bg-slate-50 transition">Batal</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-black text-white shadow-lg transition ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Ya, Lanjutkan</button>
                </div>
            </div>
        </div>
    );
}

function MenuButton({ id, icon, label, active, set, badgeCount = 0 }) {
  const isActive = active === id;
  return (
    <button onClick={() => set(id)} className={`w-full flex items-center gap-3 px-4 md:px-6 py-3 transition-all relative ${isActive ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>}
      <span className={isActive ? 'text-blue-400' : ''}>{icon}</span>
      <span className="hidden md:inline font-medium text-sm flex-1 text-left uppercase tracking-widest">{label}</span>
      {badgeCount > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shadow-sm">{badgeCount}</span>}
    </button>
  );
}

// ==========================================
// 3. KOMPONEN FITUR ADMIN
// ==========================================

// 3.1 HomeDashboard
function HomeDashboard() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [today, setToday] = useState(new Date());
  const [bellStatus, setBellStatus] = useState(null);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscillatorRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 1000);
    const unsubClasses = onSnapshot(getCollection('gemilang_classes'), (snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubStudents = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { clearInterval(timer); unsubClasses(); unsubStudents(); };
  }, []);

  const todayClasses = useMemo(() => {
    const dayName = DAYS[today.getDay()];
    const dateStr = today.toISOString().split('T')[0];
    return classes.filter(c => 
      (c.type === 'Regular' && c.day === dayName) || 
      (c.type === 'Paralel' && c.days?.includes(dayName)) ||
      (c.type === 'Booking' && c.specificDate === dateStr)
    ).sort((a,b) => a.startTime.localeCompare(b.startTime));
  }, [classes, today]);

  const billingWarnings = useMemo(() => {
    let list = [];
    const now = new Date();
    const threshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    students.forEach(s => {
      s.installments?.forEach(ins => {
        if(ins.status === 'unpaid' && ins.dueDate <= threshold) {
            list.push({ ...ins, studentName: s.name, contact: s.emergencyContact, isLate: ins.dueDate <= todayStr, level: s.level });
        }
      });
    });
    return list;
  }, [students]);

  const startBell = () => { if (bellStatus) return; setBellStatus("🔔"); try { const Ctx = window.AudioContext || window.webkitAudioContext; if (!audioCtxRef.current) audioCtxRef.current = new Ctx(); const ctx = audioCtxRef.current; if (ctx.state === 'suspended') ctx.resume(); const gain = ctx.createGain(); gain.connect(ctx.destination); gain.gain.setValueAtTime(0.4, ctx.currentTime); const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.setValueAtTime(600, ctx.currentTime); o1.connect(gain); o1.start(); const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.setValueAtTime(800, ctx.currentTime); o2.connect(gain); o2.start(); oscillatorRef.current = { stop: () => { o1.stop(); o2.stop(); } }; gainNodeRef.current = gain; } catch(e){} };
  const stopBell = () => { setBellStatus(null); if(gainNodeRef.current) { gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05); setTimeout(()=>oscillatorRef.current?.stop(), 50); }};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-b-[12px] border-blue-900/50">
        <div className="relative z-10">
          <h2 className="text-blue-100 font-black mb-1 uppercase tracking-[0.3em] text-xs">{today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</h2>
          <h1 className="text-6xl font-black font-mono tracking-wider leading-none">{today.toLocaleTimeString('id-ID')}</h1>
          <div className="flex gap-4 mt-8">
             <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-inner"><span className="block text-3xl font-black">{todayClasses.length}</span><span className="text-[10px] text-blue-100 font-black uppercase tracking-widest">Kelas Aktif</span></div>
             <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-inner"><span className="block text-3xl font-black text-yellow-300">{billingWarnings.length}</span><span className="text-[10px] text-blue-100 font-black uppercase tracking-widest">Jatuh Tempo</span></div>
          </div>
        </div>
        <button onMouseDown={startBell} onMouseUp={stopBell} onTouchStart={startBell} onTouchEnd={stopBell} className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all border-[10px] border-blue-100 z-10 mt-8 md:mt-0 group">
          <Bell size={48} className={`transition-all duration-75 ${bellStatus ? 'text-orange-500 animate-bounce' : 'text-blue-700 group-hover:rotate-12'}`}/>
          <span className="mt-3 text-[10px] font-black text-slate-800 uppercase tracking-widest">{bellStatus ? 'LEPAS' : 'TEKAN BELL'}</span>
        </button>
        <GraduationCap size={220} className="hidden md:block absolute right-[-40px] bottom-[-40px] opacity-10 transform rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b bg-slate-50 flex items-center gap-3 font-black text-slate-800 uppercase text-xs tracking-widest leading-none"><Calendar className="text-blue-600" size={20}/> Jadwal Ruangan Hari Ini</div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
               {todayClasses.length === 0 ? <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase italic text-xs">Tidak ada jadwal</div> : 
               todayClasses.map(c => (
                 <div key={c.id} className="p-5 border-2 rounded-3xl flex justify-between items-center transition hover:border-blue-400 group bg-slate-50/50">
                    <div>
                      <div className="font-black text-slate-900 uppercase tracking-tighter italic">{c.subject}</div>
                      <div className="text-[10px] font-black text-blue-700 mt-1 uppercase tracking-widest">{c.startTime} - {c.endTime} • {c.room}</div>
                    </div>
                    <span className="text-[9px] font-black px-3 py-1.5 bg-white border-2 rounded-full uppercase shadow-sm group-hover:bg-blue-600 group-hover:text-white transition group-hover:border-blue-600">{c.pic}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b bg-slate-50 flex items-center gap-3 font-black text-slate-800 uppercase text-xs tracking-widest leading-none"><Bell className="text-orange-600" size={20}/> Peringatan Tagihan SPP</div>
            <div className="flex-1 overflow-y-auto p-0 divide-y custom-scrollbar">
               {billingWarnings.length === 0 ? <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase italic text-xs">Keuangan Aman</div> : 
               billingWarnings.map((item, i) => (
                 <div key={i} className={`p-5 flex justify-between items-center transition hover:bg-slate-50 ${item.isLate ? 'bg-red-50/30' : ''}`}>
                    <div>
                      <div className="font-black text-slate-900 uppercase text-xs tracking-tighter">{item.studentName}</div>
                      <div className="flex gap-2 items-center mt-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${item.level === 'SD' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>{item.level}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{item.dueDate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="font-mono font-black text-slate-900 text-sm">Rp {formatRupiah(item.amount)}</div>
                       <button onClick={() => window.open(`https://wa.me/${item.contact.replace(/\D/g,'')}?text=Halo...`)} className="text-[9px] font-black text-emerald-600 uppercase mt-1 flex items-center gap-1 ml-auto">Kirim WA <ArrowRightCircle size={10}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
      </div>
    </div>
  );
}

// 3.2 StudentManager
function StudentManager() {
  const [students, setStudents] = useState([]);
  const [view, setView] = useState('list');
  const [activeLevel, setActiveLevel] = useState('SD');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const showToast = useToast();
   
  const [formData, setFormData] = useState({
    regDate: new Date().toISOString().split('T')[0],
    name: '', school: '', grade: '',
    fatherName: '', fatherJob: '', motherName: '', motherJob: '',
    address: '', emergencyContact: '', level: 'SD', duration: '1', discount: 0, 
    regFee: 25000, receivedAmount: 0, paymentMethod: 'Cash', notes: ''
  });

  const [customInstallments, setCustomInstallments] = useState([]);
  const colRef = getCollection('gemilang_students');
  const financeRef = getCollection('gemilang_finance');

  useEffect(() => {
    return onSnapshot(colRef, (snap) => setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
  }, []);

  const calculation = useMemo(() => {
    const pkg = PRICING[formData.level][formData.duration];
    const finalPrice = pkg.price - (pkg.price * formData.discount / 100);
    const totalBill = finalPrice + Number(formData.regFee);
    return { totalBill, remaining: Math.max(0, totalBill - Number(formData.receivedAmount)), count: pkg.installments };
  }, [formData.level, formData.duration, formData.discount, formData.regFee, formData.receivedAmount]);

  useEffect(() => {
    if (!isEditing && calculation.remaining > 0) {
      const plans = [];
      const perTerm = Math.round(calculation.remaining / calculation.count);
      const baseDate = new Date(formData.regDate);
      for (let i = 0; i < calculation.count; i++) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1 + i, 1);
        plans.push({ id: i + 1, dueDate: d.toISOString().split('T')[0], amount: perTerm, status: 'unpaid' });
      }
      setCustomInstallments(plans);
    } else if (calculation.remaining === 0) setCustomInstallments([]);
  }, [calculation.remaining, calculation.count, formData.regDate, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      await updateDoc(getDocRef('gemilang_students', editingId), formData);
      showToast("Profil Updated!");
    } else {
      let ins = Number(formData.receivedAmount) > 0 ? [{ id: 0, dueDate: formData.regDate, amount: Number(formData.receivedAmount), status: 'paid' }] : [];
      ins = [...ins, ...customInstallments];
      await addDoc(colRef, { ...formData, installments: ins, regFeePaid: Number(formData.receivedAmount) >= Number(formData.regFee), createdAt: new Date().toISOString() });
      if (formData.receivedAmount > 0) {
        await addDoc(financeRef, { type: 'in', amount: Number(formData.receivedAmount), description: `Registrasi: ${formData.name}`, method: formData.paymentMethod, createdAt: new Date().toISOString() });
      }
      showToast("Berhasil Terdaftar!");
    }
    setView('list'); setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-7 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-6">
          <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-none">Database Siswa</h3>
          <button onClick={() => { setView('form'); setIsEditing(false); }} className="bg-blue-800 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl uppercase text-xs border-b-4 border-blue-950 transition active:scale-95 leading-none"><PlusCircle size={20}/> Registrasi Baru</button>
      </div>

      {view === 'list' ? (
        <>
          <div className="flex bg-slate-200 p-2 rounded-2xl shadow-inner max-w-xs mx-auto">
             {['SD', 'SMP'].map(lv => (
               <button key={lv} onClick={() => setActiveLevel(lv)} className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all ${activeLevel === lv ? 'bg-white text-blue-800 shadow-md scale-105' : 'text-slate-500'}`}>{lv} MODE</button>
             ))}
          </div>
          <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest border-b-2"><tr><th className="p-5">Nama</th><th className="p-5">Sekolah / Kls</th><th className="p-5">Program</th><th className="p-5">Kontak</th><th className="p-5 text-right">Opsi</th></tr></thead>
                  <tbody>
                      {students.filter(s => s.level === activeLevel).sort((a,b)=>a.name.localeCompare(b.name)).map(s => (
                        <tr key={s.id} className="border-b hover:bg-blue-50/50 transition">
                            <td className="p-5 font-black text-slate-900 uppercase text-sm tracking-tighter italic">{s.name}</td>
                            <td className="p-5 text-[10px] text-slate-500 font-black uppercase leading-tight">{s.school} <br/> <span className="text-blue-600">Kelas {s.grade}</span></td>
                            <td className="p-5"><span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg border uppercase shadow-inner tracking-widest">{s.duration} Bulan</span></td>
                            <td className="p-5 text-[10px] font-black text-slate-600 uppercase italic">WA: {s.emergencyContact}</td>
                            <td className="p-5 text-right flex justify-end gap-2"><button onClick={() => { setFormData(s); setEditingId(s.id); setIsEditing(true); setView('form'); }} className="p-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition"><Edit size={16}/></button><button onClick={() => deleteDoc(getDocRef('gemilang_students', s.id))} className="p-2.5 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-600 hover:text-white transition"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        </>
      ) : (
        <div className="max-w-5xl mx-auto animate-in zoom-in-95 pb-20">
          <button onClick={() => setView('list')} className="mb-4 text-slate-800 font-black uppercase text-xs flex items-center gap-2 hover:translate-x-[-4px] transition">&larr; Batalkan & Kembali</button>
          <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-2xl border-4 border-slate-50 overflow-hidden">
             <div className="bg-blue-800 p-10 text-white flex justify-between items-center border-b-8 border-blue-950">
               <div><h2 className="text-3xl font-black uppercase italic leading-none tracking-tighter">Formulir Registrasi</h2><p className="text-[10px] opacity-60 uppercase font-black mt-2 tracking-[0.4em]">Integrated Cloud Database v2.6</p></div>
               <ShieldCheck size={48} className="opacity-20"/>
             </div>
             <div className="p-10 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-widest">Nama Lengkap Siswa</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black uppercase focus:border-blue-500 outline-none transition" required /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-widest">Kontak WA Wali</label><input value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black focus:border-blue-500 outline-none transition" required /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-widest">Level Sekolah</label><select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black focus:border-blue-500 outline-none transition"><option value="SD">SD (Sekolah Dasar)</option><option value="SMP">SMP (Sekolah Menengah Pertama)</option></select></div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-widest">Sekolah Asal</label><input value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black uppercase focus:border-blue-500 outline-none transition" required /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-widest text-center block">Kelas</label><input value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black text-center focus:border-blue-500 outline-none transition" required /></div>
                   </div>
                </div>

                {!isEditing && (
                  <div className="bg-slate-100 p-10 rounded-[50px] border-4 border-white grid grid-cols-1 md:grid-cols-2 gap-12 shadow-inner">
                     <div className="space-y-6">
                        <h4 className="font-black text-xs uppercase border-b-2 border-slate-200 pb-3 text-slate-500 tracking-[0.3em]">Finansial & Paket</h4>
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase ml-2 opacity-50">Paket Bimbel</label><select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full p-4 border-2 rounded-2xl font-black uppercase text-xs shadow-sm"><option value="1">1 BULAN (REGULER)</option><option value="3">3 BULAN (DISKON)</option><option value="6">6 BULAN (PREMIUM)</option></select></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-emerald-700 uppercase ml-2">Uang Diterima Hari Ini (Rp)</label><input type="number" value={formData.receivedAmount} onChange={e => setFormData({...formData, receivedAmount: e.target.value})} className="w-full p-6 border-4 border-emerald-400 rounded-[30px] text-3xl font-black text-emerald-800 bg-emerald-50 outline-none shadow-xl font-mono text-center" /></div>
                        <div className="p-6 bg-indigo-900 text-white rounded-[35px] space-y-3 shadow-2xl border-b-[8px] border-indigo-950">
                           <div className="flex justify-between text-xs font-black opacity-50 uppercase tracking-widest"><span>Total Tagihan:</span><span>Rp {formatRupiah(calculation.totalBill)}</span></div>
                           <div className="flex justify-between text-xl font-black italic tracking-tighter"><span>SISA PIUTANG:</span><span>Rp {formatRupiah(calculation.remaining)}</span></div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="font-black text-xs uppercase border-b-2 border-slate-200 pb-3 text-slate-500 tracking-[0.3em]">Penjadwalan Cicilan</h4>
                        <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                          {customInstallments.length === 0 ? <div className="p-10 text-center font-black text-slate-400 text-[10px] uppercase opacity-40">Lunas / Tidak Ada Rencana Cicilan</div> : 
                            customInstallments.map((plan, i) => (
                              <div key={i} className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-blue-400 transition">
                                 <div className="flex justify-between items-center border-b pb-2"><span className="text-[10px] font-black text-indigo-600">TERMIN #{i+1}</span><input type="date" value={plan.dueDate} onChange={e => { const n = [...customInstallments]; n[i].dueDate = e.target.value; setCustomInstallments(n); }} className="text-[10px] border px-2 py-1 rounded font-black outline-none bg-slate-50" /></div>
                                 <div className="flex items-center gap-3"><span className="text-xs font-black opacity-30">Rp</span><input type="number" value={plan.amount} onChange={e => { const n = [...customInstallments]; n[i].amount = Number(e.target.value); setCustomInstallments(n); }} className="flex-1 font-black text-sm outline-none font-mono" /></div>
                              </div>
                            ))
                          }
                        </div>
                        {calculation.remaining > 0 && <p className="text-[9px] text-orange-600 font-black text-center uppercase tracking-widest italic animate-pulse">Mohon pastikan total cicilan sesuai sisa tagihan</p>}
                     </div>
                  </div>
                )}
                <button type="submit" className="w-full bg-blue-800 text-white py-8 rounded-[40px] font-black shadow-[0_20px_50px_rgba(30,64,175,0.4)] uppercase tracking-[0.5em] border-b-[10px] border-blue-950 transition transform active:scale-95 leading-none">Simpan Data & Pembayaran Awal</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}

// 3.2.1 PaymentManager
function PaymentManager() {
  const [students, setStudents] = useState([]);
  const [activeLevel, setActiveLevel] = useState('SD');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    return onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
  }, []);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const handlePay = async (student, idx, method) => {
      const ins = [...student.installments];
      ins[idx].status = 'paid';
      await updateDoc(getDocRef('gemilang_students', student.id), { installments: ins });
      await addDoc(getCollection('gemilang_finance'), { type: 'in', amount: ins[idx].amount, description: `SPP: ${student.name} (#${idx})`, method, createdAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-7 rounded-[35px] shadow-sm border flex flex-col md:flex-row justify-between items-center gap-6">
          <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-none">Manajemen Bayar</h3>
          <div className="flex bg-slate-200 p-2 rounded-2xl shadow-inner border-2">
            {['SD', 'SMP'].map(lv => (
              <button key={lv} onClick={() => { setActiveLevel(lv); setSelectedStudentId(''); }} className={`px-10 py-3 rounded-xl font-black uppercase text-[11px] transition-all ${activeLevel === lv ? 'bg-white text-indigo-700 shadow-md scale-105' : 'text-slate-500'}`}>{lv}</button>
            ))}
          </div>
      </div>

      <div className="max-w-xl mx-auto space-y-2">
         <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full p-5 border-4 border-indigo-100 bg-indigo-50/30 rounded-[30px] font-black text-slate-900 outline-none focus:border-indigo-600 transition shadow-inner uppercase tracking-tight text-center italic">
            <option value="">-- CARI SISWA AKTIF --</option>
            {students.filter(s => s.level === activeLevel).sort((a,b)=>a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.school})</option>)}
         </select>
      </div>

      {selectedStudent && (
        <div className="bg-white border-4 border-slate-50 rounded-[50px] p-10 shadow-2xl space-y-10 max-w-5xl mx-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b-4 border-slate-50 pb-8">
                <div><h4 className="font-black text-indigo-900 flex items-center gap-3 uppercase tracking-tighter text-2xl italic leading-none"><Wallet size={32}/> Kartu Kontrol Keuangan</h4><p className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mt-3">Personal Billing Terminal</p></div>
                <button onClick={() => printStudentPDF(selectedStudent)} className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black uppercase text-[11px] border-b-[6px] border-slate-950 transition active:translate-y-1"><Printer size={18} className="mr-2 inline"/> Cetak Kartu</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="p-8 bg-slate-50 border-4 border-white rounded-[40px] space-y-4 shadow-inner">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Siswa</label>
                    <div className="font-black text-slate-900 uppercase text-xl italic leading-none">{selectedStudent.name}</div>
                    <div className="text-xs font-black text-blue-700 opacity-60">WA WALI: {selectedStudent.emergencyContact}</div>
                    <div className="pt-4 border-t-2 border-white flex gap-2">
                       <span className="bg-white px-4 py-1.5 rounded-full border text-[9px] font-black uppercase">{selectedStudent.level} MODE</span>
                       <span className="bg-white px-4 py-1.5 rounded-full border text-[9px] font-black uppercase">KLS {selectedStudent.grade}</span>
                    </div>
                </div>
                {selectedStudent.notes && <div className="p-6 bg-amber-50 border-2 border-amber-100 rounded-3xl italic font-black text-[11px] uppercase opacity-70 text-amber-900">Catatan: {selectedStudent.notes}</div>}
              </div>
              <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase text-center tracking-[0.4em] mb-6">Jadwal Angsuran & Histori</h5>
                  <div className="space-y-4 overflow-y-auto max-h-[500px] pr-4 custom-scrollbar">
                      {selectedStudent.installments?.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map((ins, idx) => (
                          <div key={idx} className={`p-6 rounded-[30px] border-2 flex justify-between items-center transition shadow-sm ${ins.status === 'paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-indigo-400'}`}>
                              <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter opacity-60">
                                  {ins.id === 0 ? 'DP AWAL' : `TERMIN #${ins.id}`} • {ins.dueDate}
                                </div>
                                <div className="font-black text-slate-900 text-lg font-mono">Rp {formatRupiah(ins.amount)}</div>
                              </div>
                              {ins.status === 'paid' ? (
                                <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-full font-black text-[9px] italic flex items-center gap-2 shadow-lg border-b-4 border-emerald-800 uppercase tracking-widest"><Check size={12} strokeWidth={4}/> Lunas</div>
                              ) : (
                                <select onChange={(e) => e.target.value && handlePay(selectedStudent, idx, e.target.value)} className="text-[10px] p-2 border-2 border-indigo-200 rounded-xl bg-indigo-50 font-black outline-none focus:border-indigo-600 shadow-sm uppercase tracking-tighter"><option value="">💰 BAYAR</option><option value="Cash">Cash</option><option value="Transfer">Bank</option></select>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

// 3.4 ClassManager
function ClassManager() {
    const [classes, setClasses] = useState([]);
    const [view, setView] = useState('list'); 
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [activeLevel, setActiveLevel] = useState('SD');
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [isManageStudentOpen, setIsManageStudentOpen] = useState(false);
    const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
    const [tempSelectedStudents, setTempSelectedStudents] = useState([]);
    const showToast = useToast();

    const [form, setForm] = useState({
        day: 'Senin', startTime: '13:00', endTime: '14:30',
        subject: '', room: 'MERKURIUS', pic: '', type: 'Regular', specificDate: '',
        level: 'SD', days: ['Senin'], enrolledStudents: [] 
    });

    useEffect(() => {
        const unsubC = onSnapshot(getCollection('gemilang_classes'), (snap) => setClasses(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubT = onSnapshot(getCollection('gemilang_teachers'), (snap) => setTeachers(snap.docs.map(d => d.data().name)));
        const unsubS = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => { unsubC(); unsubT(); unsubS(); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addDoc(getCollection('gemilang_classes'), { ...form, level: activeLevel });
        showToast("Jadwal Baru Diaktifkan!"); setView('list');
    };

    const matrixData = classes.filter(c => {
        const selDay = DAYS[new Date(viewDate).getDay()];
        return c.level === activeLevel && (
            (c.type === 'Regular' && c.day === selDay) || 
            (c.type === 'Paralel' && c.days?.includes(selDay)) ||
            (c.type === 'Booking' && c.specificDate === viewDate)
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
             {isManageStudentOpen && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
                    <div className="bg-white rounded-[50px] shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] border-[12px] border-white/20">
                         <div className="p-8 border-b-4 flex justify-between items-center bg-slate-50 rounded-t-[40px]"><div><h3 className="font-black text-2xl italic leading-none tracking-tighter">Manajemen Peserta</h3><p className="text-blue-600 font-black text-[10px] uppercase mt-3 tracking-widest bg-white inline-block px-3 py-1 rounded-full shadow-sm">{selectedClassForStudents?.subject} • {activeLevel}</p></div><button onClick={() => setIsManageStudentOpen(false)} className="p-4 bg-white border-2 rounded-[25px] shadow-xl hover:rotate-90 transition transform"><X size={28}/></button></div>
                         <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-white"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{students.filter(s => s.level === activeLevel).sort((a,b)=>a.name.localeCompare(b.name)).map(s => { const isSel = tempSelectedStudents.includes(s.id); return ( <div key={s.id} onClick={() => setTempSelectedStudents(isSel ? tempSelectedStudents.filter(id => id !== s.id) : [...tempSelectedStudents, s.id])} className={`p-4 rounded-3xl border-2 flex items-center gap-4 cursor-pointer transition transform active:scale-95 ${isSel ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}><div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition ${isSel ? 'bg-blue-700 border-blue-700 text-white shadow-lg' : 'bg-white'}`}>{isSel && <Check size={16} strokeWidth={4}/>}</div><div className="font-black text-xs uppercase italic tracking-tight">{s.name} <br/> <span className="text-[8px] opacity-40">KLS {s.grade} - {s.school}</span></div></div> ) })}</div></div>
                         <div className="p-8 border-t-4 bg-slate-50 flex justify-between items-center rounded-b-[40px] shadow-inner"><span className="text-[11px] font-black uppercase bg-white px-6 py-2 rounded-full border-2 border-slate-200 shadow-sm leading-none">{tempSelectedStudents.length} SISWA TERDAFTAR</span><button onClick={async () => { await updateDoc(getDocRef('gemilang_classes', selectedClassForStudents.id), { enrolledStudents: tempSelectedStudents }); setIsManageStudentOpen(false); showToast("Database Peserta Sinkron!"); }} className="bg-blue-800 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs border-b-[6px] border-blue-950 shadow-2xl transition transform active:translate-y-1">Simpan Database</button></div>
                    </div>
                 </div>
             )}

             <div className="bg-white p-7 rounded-[40px] shadow-sm border flex flex-col md:flex-row justify-between items-center gap-6">
                <div><h3 className="text-3xl font-black text-slate-900 uppercase italic italic leading-none tracking-tighter">Manajemen Ruang</h3><p className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] mt-3">Smart Room Allocator v2.6</p></div>
                <div className="flex gap-4">
                  <div className="flex bg-slate-200 p-2 rounded-2xl shadow-inner border-2">
                    {['SD', 'SMP'].map(lv => (<button key={lv} onClick={() => setActiveLevel(lv)} className={`px-8 py-2.5 rounded-xl font-black text-[11px] transition-all ${activeLevel === lv ? 'bg-white text-blue-800 shadow-md scale-105' : 'text-slate-500'}`}>{lv}</button>))}
                  </div>
                  <button onClick={() => setView(view === 'list' ? 'form' : 'list')} className="bg-blue-800 text-white px-10 py-2.5 rounded-2xl font-black uppercase text-xs border-b-4 border-blue-950 shadow-xl">{view === 'list' ? 'Input Jadwal' : 'Batalkan'}</button>
                </div>
             </div>

             {view === 'form' && (
                 <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[50px] shadow-2xl border-4 border-slate-50 space-y-10 animate-in zoom-in-95">
                    <div className="grid grid-cols-1 md:grid-cols-3 p-3 bg-slate-100 rounded-[35px] gap-4 shadow-inner border-4 border-white">
                        {['Regular', 'Paralel', 'Booking'].map(t => (<button key={t} type="button" onClick={() => setForm({...form, type: t})} className={`py-5 rounded-3xl text-[11px] font-black uppercase transition-all ${form.type === t ? 'bg-blue-800 text-white shadow-2xl scale-105 border-b-8 border-blue-950 italic' : 'bg-white text-slate-400 border-2'}`}>{t === 'Regular' ? 'Rutin Mingguan' : t === 'Paralel' ? 'Kelas Paralel' : 'Jadwal Khusus'}</button>))}
                    </div>
                    
                    {form.type === 'Paralel' && (
                      <div className="space-y-4 p-8 bg-indigo-50 border-4 border-white rounded-[40px] shadow-inner">
                        <label className="text-[11px] font-black text-indigo-700 uppercase ml-2 tracking-[0.2em] flex items-center gap-3"><Layers size={20}/> Tentukan Hari Paralel (Aktif Selamanya)</label>
                        <div className="flex flex-wrap gap-3">
                           {DAYS.map(d => (
                             <button key={d} type="button" onClick={() => setForm({...form, days: form.days.includes(d) ? form.days.filter(x=>x!==d) : [...form.days, d]})} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase border-4 transition-all transform active:scale-95 ${form.days.includes(d) ? 'bg-indigo-700 border-indigo-900 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-400'}`}>{d}</button>
                           ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {form.type === 'Regular' && (<div className="space-y-1"><label className="text-[10px] font-black uppercase ml-4 opacity-40">Pilih Hari Rutin</label><select value={form.day} onChange={e => setForm({...form, day: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black uppercase shadow-inner">{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>)}
                        {form.type === 'Booking' && (<div className="space-y-1"><label className="text-[10px] font-black uppercase ml-4 opacity-40">Pilih Tanggal Sesi</label><input type="date" value={form.specificDate} onChange={e => setForm({...form, specificDate: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black shadow-inner" required /></div>)}
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase ml-4 opacity-40">Ruangan Belajar</label><select value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black uppercase shadow-inner">{ROOMS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                        <div className="flex gap-4"><div className="flex-1 space-y-1"><label className="text-[10px] font-black uppercase ml-4 opacity-40">Jam Mulai</label><input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black shadow-inner" required /></div><div className="flex-1 space-y-1"><label className="text-[10px] font-black uppercase ml-4 opacity-40">Jam Selesai</label><input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black shadow-inner" required /></div></div>
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase ml-4 opacity-40">Mata Pelajaran / Program</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black uppercase shadow-inner focus:border-blue-500 outline-none" required /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase ml-4 opacity-40">Pengajar Bertugas (PIC)</label><select value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} className="w-full p-5 border-4 bg-slate-50 rounded-3xl font-black uppercase shadow-inner" required><option value="">-- PILIH GURU PENGAJAR --</option>{teachers.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <button className="md:col-span-2 w-full bg-blue-800 text-white py-8 rounded-[40px] font-black shadow-2xl uppercase tracking-[0.6em] border-b-[10px] border-blue-950 transition transform active:scale-95 leading-none">Aktivasi Jadwal Bimbel</button>
                    </div>
                 </form>
             )}

             <div className="bg-white rounded-[45px] shadow-sm border-4 border-slate-50 overflow-hidden">
                <div className="p-8 border-b-4 bg-slate-50 flex justify-between items-center leading-none italic"><h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-sm flex items-center gap-4"><Map size={32} className="text-blue-600 shadow-sm"/> Monitor Kapasitas: {activeLevel}</h3><input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="p-3 rounded-2xl border-4 font-black text-xs uppercase italic outline-none focus:border-blue-600" /></div>
                <div className="overflow-x-auto p-10 bg-slate-50/50"><div className="grid grid-cols-5 gap-8 min-w-[1500px]">{ROOMS.map(room => (<div key={room} className="bg-white rounded-[40px] border-4 border-white shadow-2xl flex flex-col h-[750px] overflow-hidden"><div className="p-6 bg-slate-900 text-white text-center font-black text-[12px] uppercase border-b-[10px] border-blue-700 leading-none tracking-[0.4em] italic drop-shadow-lg">{room}</div><div className="flex-1 p-5 space-y-5 overflow-y-auto custom-scrollbar bg-slate-50/20">{matrixData.filter(c => c.room === room).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(c => (<div key={c.id} className={`p-6 rounded-[35px] border-4 shadow-xl relative group transition-all duration-300 transform hover:scale-[1.03] ${c.type === 'Paralel' ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'}`}><div className="flex justify-between items-start mb-4"><span className="text-[11px] font-black bg-white px-4 py-1.5 rounded-full shadow-md border-b-4 italic tracking-tighter">{c.startTime}</span><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition"><button onClick={() => { setSelectedClassForStudents(c); setTempSelectedStudents(c.enrolledStudents || []); setIsManageStudentOpen(true); }} className="p-2.5 bg-blue-700 text-white rounded-2xl shadow-lg border-b-4 border-blue-900 hover:translate-y-[-2px] transition active:translate-y-1"><Users size={16}/></button><button onClick={() => deleteDoc(getDocRef('gemilang_classes', c.id))} className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-lg border-b-4 border-rose-900 hover:translate-y-[-2px] transition active:translate-y-1"><Trash2 size={16}/></button></div></div><div className="font-black text-[15px] uppercase italic leading-none tracking-tighter text-slate-800 border-b-2 border-white pb-3">{c.subject}</div><div className="text-[11px] mt-4 font-black flex items-center gap-3 uppercase opacity-80 italic"><div className="w-8 h-8 rounded-xl bg-white shadow-inner flex items-center justify-center"><User size={14} className="text-blue-600"/></div> {c.pic}</div><div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-white"><span className="text-[9px] font-black uppercase px-3 py-1 bg-white rounded-full shadow-sm opacity-50 italic">{c.type}</span><div className="text-[10px] font-black text-indigo-700 uppercase flex items-center gap-2 bg-indigo-100/50 px-3 py-1 rounded-full"><ListChecks size={12}/> {c.enrolledStudents?.length || 0} Siswa</div></div></div>))}{matrixData.filter(c => c.room === room).length === 0 && (<div className="h-full flex flex-col items-center justify-center text-slate-200 text-[14px] italic font-black uppercase tracking-[0.8em] transform -rotate-90 select-none pointer-events-none opacity-50">RUANG KOSONG</div>)}</div></div>))}</div></div>
             </div>
        </div>
    );
}

// 3.5 FinanceManager
function FinanceManager() {
  const [finances, setFinances] = useState([]);
  const [type, setType] = useState('in');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const showToast = useToast();

  useEffect(() => {
    onSnapshot(getCollection('gemilang_finance'), (snap) => setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt.localeCompare(a.createdAt))));
  }, []);

  const cashIn = finances.filter(f => f.type === 'in' && f.method === 'Cash').reduce((a, b) => a + b.amount, 0);
  const cashOut = finances.filter(f => f.type === 'out' && f.method === 'Cash').reduce((a, b) => a + b.amount, 0);
  const bankIn = finances.filter(f => f.type === 'in' && f.method === 'Transfer').reduce((a, b) => a + b.amount, 0);
  const bankOut = finances.filter(f => f.type === 'out' && f.method === 'Transfer').reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl border-b-[15px] border-blue-800 relative overflow-hidden group"><PieChart size={180} className="absolute right-[-40px] top-[-40px] opacity-10 group-hover:rotate-45 transition duration-1000"/><p className="text-[12px] uppercase font-black opacity-40 mb-3 tracking-[0.5em] leading-none">Saldo Kumulatif</p><h3 className="text-5xl font-black font-mono tracking-tighter leading-none italic">Rp {formatRupiah((cashIn + bankIn) - (cashOut + bankOut))}</h3></div>
        <div className="bg-white p-8 rounded-[40px] border-4 border-emerald-50 shadow-lg flex flex-col justify-center"><p className="text-emerald-700 text-[10px] font-black uppercase mb-3 tracking-widest leading-none">Dana Tunai (Brangkas)</p><h3 className="text-3xl font-black font-mono tracking-tighter leading-none italic">Rp {formatRupiah(cashIn - cashOut)}</h3></div>
        <div className="bg-white p-8 rounded-[40px] border-4 border-blue-50 shadow-lg flex flex-col justify-center"><p className="text-blue-700 text-[10px] font-black uppercase mb-3 tracking-widest leading-none">Dana Bank (Rekening)</p><h3 className="text-3xl font-black font-mono tracking-tighter leading-none italic">Rp {formatRupiah(bankIn - bankOut)}</h3></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
        <div className="bg-white p-10 rounded-[50px] shadow-xl border-4 border-slate-50 space-y-8 h-fit">
            <h3 className="font-black text-2xl flex items-center gap-4 uppercase italic leading-none tracking-tighter"><DollarSign size={36} className="text-blue-600 bg-blue-50 p-2 rounded-2xl shadow-inner"/> Input Mutasi Kas</h3>
            <div className="flex gap-4 bg-slate-100 p-2.5 rounded-3xl border-2">
                <button onClick={() => setType('in')} className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase transition-all ${type === 'in' ? 'bg-emerald-600 text-white shadow-xl border-b-4 border-emerald-800' : 'text-slate-400'}`}>Pemasukan</button>
                <button onClick={() => setType('out')} className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase transition-all ${type === 'out' ? 'bg-rose-600 text-white shadow-xl border-b-4 border-rose-800' : 'text-slate-400'}`}>Pengeluaran</button>
            </div>
            <div className="space-y-4">
              <input type="number" placeholder="Nominal Rp" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-6 border-4 border-slate-100 rounded-[35px] font-black text-4xl font-mono text-center outline-none focus:border-blue-600 shadow-inner italic" />
              <input placeholder="Keterangan Mutasi..." value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-5 border-4 border-slate-100 rounded-3xl font-black uppercase text-xs shadow-inner outline-none focus:border-blue-600" />
            </div>
            <button onClick={async () => { if(!amount || !desc) return; await addDoc(getCollection('gemilang_finance'), { type, amount: Number(amount), description: desc, method: 'Cash', createdAt: new Date().toISOString() }); setAmount(''); setDesc(''); showToast("Histori Kas Diperbarui!"); }} className={`w-full py-7 rounded-[40px] font-black text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] uppercase tracking-[0.4em] text-xs border-b-[10px] transform active:translate-y-1 transition leading-none ${type === 'in' ? 'bg-emerald-600 border-emerald-900' : 'bg-rose-600 border-rose-900'}`}>POSTING DATA KAS</button>
        </div>
        <div className="lg:col-span-2 bg-white p-10 rounded-[50px] border-4 border-slate-50 flex flex-col h-[700px] shadow-sm overflow-hidden"><h3 className="font-black text-2xl mb-8 uppercase italic border-b-4 pb-6 leading-none tracking-tighter">Histori Jurnal Kas</h3><div className="space-y-4 flex-1 overflow-y-auto pr-4 custom-scrollbar">{finances.slice(0, 15).map(f => (<div key={f.id} className="group flex justify-between items-center p-6 border-4 border-slate-50 rounded-[35px] shadow-sm transition-all hover:bg-slate-50 hover:border-blue-200 transform hover:scale-[1.01]"><div className="flex items-center gap-6"><div className={`p-4 rounded-2xl shadow-inner border-2 ${f.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{f.type === 'in' ? <TrendingUp size={24}/> : <TrendingDown size={24}/>}</div><div><div className="font-black text-[14px] uppercase italic leading-none tracking-tighter text-slate-800">{f.description}</div><div className="text-[10px] font-black opacity-30 uppercase mt-2 tracking-widest leading-none">{new Date(f.createdAt).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})} | {f.method}</div></div></div><div className="flex items-center gap-6 text-right"><span className={`font-mono font-black text-xl italic tracking-tighter ${f.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}`}>{f.type === 'in' ? '+' : '-'} {formatRupiah(f.amount)}</span><button onClick={() => deleteDoc(getDocRef('gemilang_finance', f.id))} className="opacity-0 group-hover:opacity-100 transition p-2 bg-rose-50 rounded-xl text-rose-300 hover:text-rose-600"><Trash2 size={18}/></button></div></div>))}</div></div>
      </div>
    </div>
  );
}

// 3.6 AttendanceReportManager (MODAL ADMIN CONTROL)
function AttendanceReportManager() {
  const [students, setStudents] = useState([]);
  const [activeLevel, setActiveLevel] = useState('SD');
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    const unsubS = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubA = onSnapshot(getCollection('gemilang_class_attendance'), (snap) => setAttendanceLogs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubS(); unsubA(); };
  }, []);

  const changeStatus = async (log, newStatus) => {
     await updateDoc(getDocRef('gemilang_class_attendance', log.id), { status: newStatus });
     showToast(`Status Updated to ${newStatus}`);
     setEditingLog(null);
  };

  const printAttendancePDF = (s) => {
    const logs = attendanceLogs.filter(l => l.studentId === s.id).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    const stats = { Hadir: logs.filter(l => l.status === 'Hadir').length, Ijin: logs.filter(l => l.status === 'Ijin').length, Alpha: logs.filter(l => l.status === 'Alpha').length, Sakit: logs.filter(l => l.status === 'Sakit').length };
    const rows = logs.map((l, i) => `<tr><td>${i+1}</td><td>${l.date}</td><td>${l.className}</td><td>${l.teacherName}</td><td style="font-weight:900; color:${l.status === 'Hadir' ? '#059669' : '#dc2626'}">${l.status}</td></tr>`).join('');
    const pw = window.open('', '_blank');
    pw.document.write(`<html><head><title>Absensi ${s.name}</title><style>body{font-family:sans-serif;padding:40px;color:#111}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #eee;padding:12px;text-align:left}th{background:#f8fafc;font-size:10px;text-transform:uppercase}.header{text-align:center;border-bottom:4px solid #7c3aed;padding-bottom:20px;margin-bottom:30px}.stat{display:flex;gap:10px;margin-top:20px}.box{flex:1;padding:15px;border-radius:15px;color:white;font-weight:900;text-align:center;font-size:12px}</style></head><body><div class="header"><h1>BIMBEL GEMILANG</h1><p>${s.name.toUpperCase()} - ${s.level} | ${s.school}</p></div><div class="stat"><div class="box" style="background:#059669">Hadir: ${stats.Hadir}</div><div class="box" style="background:#d97706">Ijin: ${stats.Ijin}</div><div class="box" style="background:#4b5563">Sakit: ${stats.Sakit}</div><div class="box" style="background:#dc2626">Alpha: ${stats.Alpha}</div></div><table><thead><tr><th>No</th><th>Tanggal</th><th>Mata Pelajaran</th><th>Guru</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:40px;text-align:right">Tanda Tangan,<br><br><br><br><b>( Admin Bimbel )</b></p><script>window.onload=function(){window.print();window.close()}</script></body></html>`);
    pw.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {editingLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
           <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border-[10px] border-white/20">
              <h3 className="font-black text-2xl uppercase italic italic leading-none tracking-tighter mb-8 flex items-center gap-3"><ShieldCheck size={32} className="text-blue-600"/> Otoritas Status</h3>
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase italic mb-6">Ubah status absensi siswa "${editingLog.studentName}" secara manual:</p>
                 <div className="grid grid-cols-2 gap-4">
                    {['Hadir', 'Ijin', 'Sakit', 'Alpha'].map(st => (
                      <button key={st} onClick={() => changeStatus(editingLog, st)} className={`py-5 rounded-[25px] font-black uppercase text-xs shadow-xl transition transform active:scale-90 border-b-4 ${st === editingLog.status ? 'bg-indigo-600 text-white border-indigo-900 shadow-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>{st}</button>
                    ))}
                 </div>
                 <button onClick={() => setEditingLog(null)} className="w-full mt-8 py-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-[10px]">Tutup</button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white p-7 rounded-[40px] shadow-sm border flex flex-col md:flex-row justify-between items-center gap-6">
        <div><h3 className="text-3xl font-black text-slate-900 uppercase italic italic leading-none tracking-tighter">Kontrol Presensi</h3><p className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] mt-3">Admin Overriding Center v2.6</p></div>
        <div className="relative group w-full md:w-[450px]">
           <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-600 transition"/>
           <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="CARI NAMA SISWA..." className="w-full pl-16 pr-8 py-5 border-4 bg-slate-50 border-slate-50 rounded-[30px] font-black uppercase text-xs focus:ring-[10px] focus:ring-purple-100 focus:border-purple-600 transition outline-none shadow-inner italic" />
        </div>
      </div>
      <div className="flex bg-slate-200 p-2 rounded-2xl shadow-inner max-w-xs mx-auto border-2">
         {['SD', 'SMP'].map(lv => (<button key={lv} onClick={() => setActiveLevel(lv)} className={`flex-1 py-3 rounded-xl font-black uppercase text-[11px] transition-all transform active:scale-95 ${activeLevel === lv ? 'bg-white text-purple-800 shadow-md' : 'text-slate-500'}`}>{lv} MODE</button>))}
      </div>
      <div className="bg-white rounded-[50px] shadow-2xl border-4 border-slate-50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]"><tr><th className="p-8">Nama & Sekolah</th><th className="p-8 text-center">Rekap Sesi</th><th className="p-8 text-right">Navigasi Admin</th></tr></thead>
            <tbody className="divide-y-2 divide-slate-50">
              {students.filter(s => s.level === activeLevel && s.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name)).map(s => {
                  const logs = attendanceLogs.filter(l => l.studentId === s.id);
                  const latestLog = [...logs].sort((a,b)=>b.timestamp.localeCompare(a.timestamp))[0];
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-8 font-black uppercase leading-none italic"><div className="text-[18px] tracking-tighter text-slate-800">{s.name}</div><div className="text-[10px] opacity-40 mt-3 font-black tracking-widest">{s.school} • KELAS {s.grade}</div></td>
                      <td className="p-8 text-center">
                         <div className="flex justify-center items-center gap-3">
                            <span className="bg-purple-100 text-purple-700 px-5 py-2.5 rounded-full text-[11px] font-black border-2 border-purple-200 shadow-sm leading-none italic">{logs.length} SESI</span>
                            {latestLog && <div onClick={() => setEditingLog({...latestLog, studentName: s.name})} className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase cursor-pointer border-b-4 hover:brightness-110 transition shadow-lg ${latestLog.status === 'Hadir' ? 'bg-emerald-600 text-white border-emerald-900' : latestLog.status === 'Alpha' ? 'bg-rose-600 text-white border-rose-900 animate-pulse' : 'bg-amber-600 text-white border-amber-900'}`}>{latestLog.status} (Ubah)</div>}
                         </div>
                      </td>
                      <td className="p-8 text-right">
                         <div className="flex justify-end gap-3">
                            <button onClick={() => window.open(`https://wa.me/${s.emergencyContact.replace(/\D/g,'')}?text=Halo...`)} title="Kirim Pesan" className="p-4 bg-emerald-50 text-emerald-700 rounded-3xl border-2 border-emerald-100 shadow-md hover:bg-emerald-600 hover:text-white transition transform hover:rotate-12 active:scale-90"><MessageCircle size={22}/></button>
                            <button onClick={() => printAttendancePDF(s)} title="Download Report" className="p-4 bg-slate-900 text-white rounded-3xl border-b-[8px] border-black shadow-xl hover:translate-y-[-2px] transition active:translate-y-1"><Download size={22}/></button>
                         </div>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
          {students.filter(s => s.level === activeLevel).length === 0 && <div className="p-32 text-center text-slate-200 font-black italic uppercase tracking-[0.8em]">Database Kosong</div>}
      </div>
    </div>
  );
}

// 3.7 SettingsView
function SettingsView() {
  const [newPass, setNewPass] = useState('');
  const showToast = useToast();
  return (
    <div className="max-w-xl mx-auto bg-white p-12 rounded-[50px] shadow-2xl border-4 border-slate-50 animate-in fade-in duration-500">
       <h3 className="text-3xl font-black mb-12 flex items-center gap-4 uppercase italic border-b-4 pb-8 leading-none tracking-tighter"><Lock size={40} className="text-blue-700 shadow-sm"/> PIN Administrator</h3>
       <div className="space-y-3">
           <label className="block text-[11px] font-black text-slate-400 uppercase ml-4 tracking-[0.4em] italic mb-2">Update Kode Keamanan Cloud</label>
           <div className="flex gap-4"><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="flex-1 p-6 border-4 bg-slate-50 rounded-[35px] font-black text-4xl font-mono text-center outline-none focus:ring-[15px] focus:ring-blue-100 focus:border-blue-700 shadow-inner transition italic" placeholder="••••••" /><button onClick={async () => { if(!newPass) return; await setDoc(getDocRef('gemilang_settings', 'admin_auth'), { password: newPass }); showToast("PIN Cloud Berhasil Diupdate!", "success"); setNewPass(''); }} className="bg-blue-800 text-white px-10 rounded-[30px] font-black uppercase shadow-[0_15px_40px_rgba(30,64,175,0.4)] border-b-[10px] border-blue-950 transition active:translate-y-1 italic leading-none">Update</button></div>
       </div>
    </div>
  );
}

// ==========================================
// 4. DASHBOARD UTAMA
// ==========================================

function AdminDashboard({ onLogout, displayMode }) {
  const [activeTab, setActiveTab] = useState('home');
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    return onSnapshot(getCollection('gemilang_students'), (snap) => {
        const threshold = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        let count = 0;
        snap.docs.forEach(doc => {
            doc.data().installments?.forEach(ins => { if (ins.status === 'unpaid' && ins.dueDate <= threshold) count++; });
        });
        setOverdueCount(count);
    });
  }, []);

  return (
    <div className={`flex h-screen bg-[#f4f7fa] font-sans overflow-hidden transition-all ${displayMode === 'hp' ? 'max-w-[430px] mx-auto border-x-[15px] border-slate-900 shadow-2xl' : 'w-full'}`}>
      <aside className={`${displayMode === 'hp' ? 'w-20' : 'w-24 md:w-72'} bg-[#0f172a] text-white flex flex-col shadow-2xl shrink-0 z-20 border-r-8 border-slate-900/50`}>
        <div className={`p-6 ${displayMode === 'hp' ? '' : 'md:p-10'} border-b border-white/5 flex items-center gap-5 bg-slate-900/20`}>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-[20px] flex items-center justify-center shrink-0 shadow-2xl transform hover:rotate-12 transition-all border-b-4 border-blue-900"><GraduationCap size={32} className="text-white" /></div>
          <div className={`${displayMode === 'hp' ? 'hidden' : 'hidden md:block'}`}><h1 className="font-black text-2xl uppercase italic leading-none tracking-tighter">GEMILANG</h1><p className="text-[10px] opacity-40 uppercase tracking-[0.5em] font-black mt-3">Smart System</p></div>
        </div>
        <nav className="flex-1 py-10 space-y-4 overflow-y-auto px-5 custom-scrollbar">
          <MenuButton id="home" icon={<LayoutDashboard size={24}/>} label="Beranda" active={activeTab} set={setActiveTab} badgeCount={overdueCount} />
          <MenuButton id="students" icon={<Users size={24}/>} label="Database Siswa" active={activeTab} set={setActiveTab} />
          <MenuButton id="payments" icon={<Wallet size={24}/>} label="Bayar & Tagihan" active={activeTab} set={setActiveTab} />
          <MenuButton id="attendance_report" icon={<ClipboardCheck size={24}/>} label="Laporan Absen" active={activeTab} set={setActiveTab} />
          <MenuButton id="finance" icon={<DollarSign size={24}/>} label="Buku Mutasi Kas" active={activeTab} set={setActiveTab} />
          <div className="pt-10 mt-10 border-t border-white/5">
            <MenuButton id="teachers" icon={<Briefcase size={24}/>} label="Data Pengajar" active={activeTab} set={setActiveTab} />
            <MenuButton id="classes" icon={<Calendar size={24}/>} label="Jadwal Ruangan" active={activeTab} set={setActiveTab} />
            <MenuButton id="settings" icon={<Settings size={24}/>} label="PIN Keamanan" active={activeTab} set={setActiveTab} />
            <button onClick={onLogout} className="w-full flex items-center gap-5 px-6 py-5 text-rose-500 hover:bg-rose-500/10 transition-all rounded-3xl mt-5 group border-2 border-transparent hover:border-rose-500/20"><LogOut size={24} className="group-hover:translate-x-2 transition" /> <span className={`${displayMode === 'hp' ? 'hidden' : 'hidden md:inline'} font-black text-[12px] uppercase tracking-widest`}>Keluar Sesi</span></button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto relative bg-[#f4f7fa] scroll-smooth custom-scrollbar">
        <div className="p-6 md:p-12 w-full max-w-[1920px] mx-auto"> 
          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'students' && <StudentManager />}
          {activeTab === 'payments' && <PaymentManager />}
          {activeTab === 'attendance_report' && <AttendanceReportManager />}
          {activeTab === 'teachers' && <TeacherManager />}
          {activeTab === 'classes' && <ClassManager />}
          {activeTab === 'finance' && <FinanceManager />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

function TeacherDashboard({ teacherName, onLogout, displayMode }) {
  const [activeView, setActiveView] = useState('home'); 
  const [attendanceCode, setAttendanceCode] = useState('');
  const [time, setTime] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [attendanceStatuses, setAttendanceStatuses] = useState({}); // Local state for toggle
  const showToast = useToast();

  useEffect(() => {
    onSnapshot(getCollection('gemilang_attendance'), (snap) => setHistory(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(l => l.teacherName === teacherName).sort((a,b) => b.timestamp.localeCompare(a.timestamp))));
    onSnapshot(getCollection('gemilang_classes'), (snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [teacherName]);

  const myClasses = useMemo(() => {
      const dayName = DAYS[time.getDay()];
      const dateStr = time.toISOString().split('T')[0];
      return classes.filter(c => (
          ((c.type === 'Regular' && c.day === dayName) || 
           (c.type === 'Paralel' && c.days?.includes(dayName)) ||
           (c.type === 'Booking' && c.specificDate === dateStr)) && 
          c.pic?.toLowerCase().includes(teacherName.toLowerCase())
      ));
  }, [classes, time, teacherName]);

  const handleAbsenStaff = async (e) => {
    e.preventDefault();
    const settingsSnap = await getDoc(getDocRef('gemilang_settings', 'attendance'));
    if (settingsSnap.exists() && attendanceCode === settingsSnap.data().code) {
        await addDoc(getCollection('gemilang_attendance'), { teacherName, timestamp: new Date().toISOString(), date: new Date().toLocaleDateString('id-ID'), time: new Date().toLocaleTimeString('id-ID'), status: 'Hadir' });
        showToast(`Absen Masuk Berhasil!`); setAttendanceCode('');
    } else showToast("Pin Salah!", 'error');
  };

  const finishClass = async () => {
     // Semua siswa di enrolledStudents harus ada di attendanceStatuses
     const studentsIds = selectedClassForAttendance.enrolledStudents || [];
     if(Object.keys(attendanceStatuses).length < studentsIds.length) {
        return showToast("Pastikan status semua siswa sudah diproses (Hijau/Merah)!", "error");
     }

     const promises = studentsIds.map(sid => {
        const student = students.find(s => s.id === sid);
        return addDoc(getCollection('gemilang_class_attendance'), {
           classId: selectedClassForAttendance.id,
           className: selectedClassForAttendance.subject,
           studentId: sid,
           studentName: student?.name || 'Anonim',
           status: attendanceStatuses[sid], // Hadir atau Alpha
           date: new Date().toLocaleDateString('id-ID'),
           teacherName,
           timestamp: new Date().toISOString()
        });
     });

     await Promise.all(promises);
     showToast("Sesi Kelas Berhasil Diakhiri & Data Terkirim ke Admin!", "success");
     setSelectedClassForAttendance(null);
     setAttendanceStatuses({});
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] font-sans transition-all ${displayMode === 'hp' ? 'max-w-[430px] mx-auto border-x-[15px] border-slate-900 shadow-2xl' : 'w-full'}`}>
      <div className="bg-indigo-700 text-white p-8 shadow-2xl border-b-[12px] border-indigo-900 flex justify-between items-center rounded-b-[40px]">
          <div><h1 className="text-3xl font-black uppercase italic leading-none tracking-tighter">GEMILANG</h1><p className="text-indigo-200 text-[10px] font-black mt-3 uppercase tracking-[0.4em] opacity-60">Guru: {teacherName}</p></div>
          <div className="flex gap-4">
              <button onClick={() => setActiveView('home')} className={`px-8 py-3 rounded-2xl font-black text-[11px] uppercase transition-all shadow-lg ${activeView === 'home' ? 'bg-white text-indigo-700 border-b-4 border-indigo-200' : 'bg-indigo-600'}`}>Dashboard</button>
              <button onClick={() => setActiveView('attendance')} className={`px-8 py-3 rounded-2xl font-black text-[11px] uppercase transition-all shadow-lg ${activeView === 'attendance' ? 'bg-white text-indigo-700 border-b-4 border-indigo-200' : 'bg-indigo-600'}`}>Presensi</button>
              <button onClick={onLogout} className="p-4 bg-rose-600 rounded-2xl border-b-4 border-rose-900 shadow-xl transform active:translate-y-1 transition"><LogOut size={20}/></button>
          </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-12">
        {activeView === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-left duration-300">
                <div className="bg-white rounded-[50px] p-12 text-center border-4 border-indigo-50 shadow-2xl flex flex-col justify-center items-center">
                    <div className="text-[80px] font-mono font-black text-slate-900 mb-10 leading-none italic tracking-tighter">{time.toLocaleTimeString('id-ID')}</div>
                    <form onSubmit={handleAbsenStaff} className="max-w-xs w-full space-y-8">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block italic">Token Harian Staff</label><input type="text" value={attendanceCode} onChange={e => setAttendanceCode(e.target.value.toUpperCase())} className="w-full text-center text-6xl font-black p-8 border-4 border-slate-100 rounded-[35px] focus:ring-[15px] focus:ring-indigo-100 focus:border-indigo-600 outline-none bg-slate-50 shadow-inner italic" placeholder="0000" maxLength={4} /></div>
                        <button className="w-full bg-indigo-600 text-white py-8 rounded-[40px] font-black shadow-[0_20px_50px_rgba(79,70,229,0.3)] uppercase text-sm border-b-[10px] border-indigo-800 transition transform active:scale-95 leading-none italic">ABSEN MASUK BIMBEL</button>
                    </form>
                </div>
                <div className="bg-white rounded-[50px] p-10 border-4 border-slate-50 h-[600px] flex flex-col shadow-2xl overflow-hidden relative">
                    <h3 className="font-black mb-8 flex items-center gap-4 text-slate-900 uppercase italic text-2xl border-b-4 pb-6 leading-none tracking-tighter"><Clock size={32} className="text-indigo-600"/> Histori Mengajar</h3>
                    <div className="overflow-y-auto flex-1 space-y-4 pr-3 custom-scrollbar">
                      {history.map(h => (<div key={h.id} className="p-6 bg-slate-50 rounded-[30px] border-4 border-white flex justify-between items-center shadow-lg transform hover:scale-[1.02] transition-all"><span className="text-xs font-black uppercase text-slate-400 italic tracking-widest">{h.date}</span><span className="font-mono font-black text-indigo-800 text-2xl italic">{h.time}</span></div>))}
                      {history.length === 0 && <div className="h-full flex items-center justify-center opacity-20 font-black uppercase italic tracking-[0.5em] text-xs">Belum ada absen</div>}
                    </div>
                </div>
            </div>
        )}

        {activeView === 'attendance' && (
            <div className="bg-white rounded-[60px] p-12 border-4 border-slate-50 animate-in slide-in-from-right duration-300 shadow-2xl min-h-[800px] relative">
                {!selectedClassForAttendance ? (
                    <div className="space-y-10">
                      <div className="text-center"><h3 className="text-4xl font-black uppercase italic tracking-tighter text-slate-800">Pilih Jadwal Mengajar</h3><p className="text-[11px] font-black opacity-40 uppercase tracking-[0.5em] mt-4">Pilih kelas yang akan Anda absen sekarang</p></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                          {myClasses.map(c => (<div key={c.id} onClick={() => { setSelectedClassForAttendance(c); setAttendanceStatuses({}); }} className="border-4 p-10 rounded-[45px] hover:border-indigo-500 cursor-pointer transition-all bg-slate-50 hover:bg-white shadow-xl group relative overflow-hidden flex flex-col justify-between transform hover:translate-y-[-10px]"><div className="absolute right-[-30px] top-[-30px] opacity-5 transition group-hover:rotate-12 transform scale-150"><ClipboardCheck size={150}/></div><div className="mb-10 z-10"><h4 className="font-black text-3xl group-hover:text-indigo-800 uppercase italic leading-none tracking-tighter border-b-2 border-white pb-5">{c.subject}</h4><div className="mt-6 flex flex-col gap-3"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-5 py-2 rounded-full border-2 border-indigo-200 uppercase leading-none shadow-sm">{c.room}</span><span className="text-[10px] font-black bg-white px-5 py-2 rounded-full border uppercase leading-none shadow-sm">{c.startTime} WIB</span></div></div></div><div className="pt-8 border-t-2 border-white flex items-center justify-between z-10 font-black"><span className="text-[11px] uppercase tracking-widest opacity-40">{c.enrolledStudents?.length || 0} PESERTA DIDIK</span><div className="w-14 h-14 bg-white text-indigo-700 rounded-3xl flex items-center justify-center border-4 border-indigo-50 group-hover:bg-indigo-700 group-hover:text-white transition-all shadow-xl transform group-hover:rotate-12"><ChevronRight size={28} strokeWidth={3}/></div></div></div>))}
                          {myClasses.length === 0 && <div className="col-span-full py-40 text-center space-y-6 opacity-30"><Calendar size={120} className="mx-auto"/><p className="font-black uppercase italic tracking-[0.8em] text-sm">Tidak ada jadwal terdeteksi</p></div>}
                      </div>
                    </div>
                ) : (
                    <div className="space-y-12 max-w-5xl mx-auto animate-in zoom-in-95">
                        <div className="flex justify-between items-center pb-10 border-b-[8px] border-slate-50"><div><h3 className="font-black text-5xl text-slate-900 uppercase italic leading-none tracking-tighter">{selectedClassForAttendance.subject}</h3><div className="mt-5 flex gap-3 items-center"><span className="bg-indigo-700 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-lg tracking-widest leading-none">RUANG: {selectedClassForAttendance.room}</span><span className="bg-slate-100 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest leading-none italic opacity-50">SINKRONISASI AKTIF</span></div></div><button onClick={() => setSelectedClassForAttendance(null)} className="p-6 bg-white rounded-[30px] shadow-2xl border-4 border-slate-100 hover:rotate-90 transition transform"><X size={40}/></button></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {selectedClassForAttendance.enrolledStudents?.map(sid => { 
                              const s = students.find(st => st.id === sid); 
                              const status = attendanceStatuses[sid] || 'Belum';
                              if(!s) return null; 
                              return (
                                <div key={sid} onClick={() => setAttendanceStatuses(p => ({...p, [sid]: status === 'Hadir' ? 'Alpha' : 'Hadir'}))} className={`p-8 rounded-[40px] border-4 flex items-center justify-between cursor-pointer transition-all transform active:scale-95 group shadow-lg ${status === 'Hadir' ? 'bg-emerald-50 border-emerald-400' : 'bg-rose-50 border-rose-400'}`}>
                                   <div className="flex items-center gap-5">
                                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl transition border-b-[6px] ${status === 'Hadir' ? 'bg-emerald-600 text-white border-emerald-800' : 'bg-rose-600 text-white border-rose-800 animate-pulse'}`}>{s.name.charAt(0)}</div>
                                      <div><div className="font-black text-xl uppercase italic leading-none tracking-tighter text-slate-800">{s.name}</div><div className="text-[10px] font-black opacity-30 mt-3 uppercase tracking-widest">{s.school} • KLS {s.grade}</div></div>
                                   </div>
                                   <div className={`px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-inner italic border-2 transition ${status === 'Hadir' ? 'bg-white text-emerald-700 border-emerald-100' : 'bg-white text-rose-700 border-rose-100'}`}>{status === 'Hadir' ? 'HADIR' : 'ALPHA'}</div>
                                </div>
                              ); 
                           })}
                        </div>

                        <div className="pt-12 border-t-[8px] border-slate-50 flex flex-col items-center space-y-6">
                           <div className="p-6 bg-slate-900 text-white rounded-[35px] border-b-[10px] border-blue-900 shadow-2xl flex items-center gap-6 w-full md:w-auto px-12">
                              <ShieldCheck size={40} className="text-blue-400"/>
                              <div><h4 className="font-black uppercase italic italic leading-none tracking-tighter text-xl">Selesaikan Kelas Ini?</h4><p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-2">Data akan dikirim ke portal Admin</p></div>
                              <button onClick={finishClass} className="ml-10 bg-white text-slate-900 px-10 py-4 rounded-2xl font-black uppercase text-[12px] border-b-8 border-slate-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-800 transition-all leading-none italic transform hover:scale-105 active:translate-y-2">KONFIRMASI & KIRIM SEKARANG</button>
                           </div>
                           <p className="text-[10px] font-black opacity-20 uppercase tracking-[1em] italic text-center">Gemilang Security Protocol Active</p>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. HALAMAN LOGIN
// ==========================================

function LoginPage({ onLogin, displayMode, setDisplayMode, isFullScreen, toggleFullScreen }) {
  const [view, setView] = useState('admin');
  const [password, setPassword] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [realAdminPass, setRealAdminPass] = useState('admin123');
  const showToast = useToast();

  useEffect(() => {
    onSnapshot(getCollection('gemilang_teachers'), (snap) => setTeachers(snap.docs.map(d => d.data().name)));
    onSnapshot(getDocRef('gemilang_settings', 'admin_auth'), (snap) => { if(snap.exists() && snap.data().password) setRealAdminPass(snap.data().password); });
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070b14] p-4 animate-in fade-in duration-700 relative overflow-hidden">
      <div className="absolute top-10 opacity-5 font-black text-white text-[180px] italic select-none pointer-events-none uppercase tracking-tighter leading-none">GEMILANG</div>
      <div className={`bg-white p-16 rounded-[70px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-[15px] border-white/10 relative z-10 transition-all ${displayMode === 'hp' ? 'w-[430px]' : displayMode === 'pc' ? 'w-full max-w-6xl' : 'w-full max-w-xl md:max-w-3xl'}`}>
        <div className="text-center mb-16"><div className="w-32 h-32 bg-blue-800 rounded-[50px] flex items-center justify-center mx-auto mb-10 shadow-2xl text-white transform hover:rotate-12 transition-all border-b-[12px] border-blue-950 leading-none"><GraduationCap size={64} strokeWidth={2.5} /></div><h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none drop-shadow-lg">Bimbel Gemilang</h1><p className="text-slate-400 text-[14px] font-black uppercase tracking-[0.8em] mt-8 bg-slate-50 inline-block px-10 py-3 rounded-full border-2 border-slate-100 shadow-inner">Smart Cloud System v2.6</p></div>
        <div className="flex bg-slate-100 p-3 rounded-[40px] mb-12 shadow-inner border-4 border-white"><button onClick={() => setView('admin')} className={`flex-1 py-6 rounded-[30px] text-[13px] font-black uppercase transition-all transform ${view === 'admin' ? 'bg-white shadow-2xl text-blue-900 border-b-[8px] border-blue-100 scale-105 italic' : 'text-slate-400'}`}>Portal Admin</button><button onClick={() => setView('guru')} className={`flex-1 py-6 rounded-[30px] text-[13px] font-black uppercase transition-all transform ${view === 'guru' ? 'bg-white shadow-2xl text-indigo-900 border-b-[8px] border-indigo-100 scale-105 italic' : 'text-slate-400'}`}>Portal Pengajar</button></div>
        <form onSubmit={(e) => { e.preventDefault(); if(view === 'admin') { if(password === realAdminPass) onLogin('admin'); else showToast("Akses Ditolak: PIN Salah!", 'error'); } else { if(!selectedTeacher) return showToast("Silahkan Pilih Nama!", 'error'); onLogin('teacher', selectedTeacher); } }} className="space-y-10">
          {view === 'admin' ? (<div className="space-y-3"><label className="text-[11px] font-black text-slate-300 uppercase ml-6 tracking-[0.4em] italic mb-2 block">Ketik PIN Keamanan</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-8 border-4 border-slate-50 bg-slate-50 rounded-[40px] text-4xl font-black font-mono text-center outline-none focus:ring-[20px] focus:ring-blue-100 focus:border-blue-800 shadow-inner transition-all italic tracking-[0.5em]" placeholder="••••••" /></div>) : 
            (<div className="space-y-3"><label className="text-[11px] font-black text-slate-300 uppercase ml-6 tracking-[0.4em] italic mb-2 block">Pilih Identitas Staff</label><select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="w-full p-8 border-4 border-slate-50 bg-slate-50 rounded-[40px] font-black uppercase text-2xl transition-all shadow-inner outline-none focus:border-indigo-700 cursor-pointer italic italic tracking-tighter leading-none"><option value="">-- PILIH NAMA PENGAJAR --</option>{teachers.sort().map((t, i) => <option key={i} value={t}>{t}</option>)}</select></div>)}
          <button className={`w-full py-10 rounded-[45px] text-white font-black shadow-[0_25px_60px_rgba(0,0,0,0.4)] uppercase tracking-[0.6em] text-[14px] border-b-[12px] transition transform active:scale-95 leading-none italic ${view === 'admin' ? 'bg-blue-800 border-blue-950' : 'bg-indigo-800 border-indigo-950'}`}>OTENTIKASI CLOUD SYSTEM &rarr;</button>
        </form>
      </div>
      <div className="flex gap-8 mt-16 z-10 opacity-30 hover:opacity-100 transition duration-700">
          <button onClick={() => setDisplayMode('hp')} className={`flex items-center gap-4 text-[12px] font-black uppercase italic tracking-widest ${displayMode === 'hp' ? 'text-white' : 'text-slate-600'}`}><Smartphone size={24}/> Smartphone</button>
          <button onClick={() => setDisplayMode('pc')} className={`flex items-center gap-4 text-[12px] font-black uppercase italic tracking-widest ${displayMode === 'pc' ? 'text-white' : 'text-slate-600'}`}><Monitor size={24}/> Computer</button>
      </div>
    </div>
  );
}

// ==========================================
// 6. APLIKASI UTAMA (MAIN APP)
// ==========================================

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [activeTeacherName, setActiveTeacherName] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');
  const [displayMode, setDisplayMode] = useState('auto');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (err) { setInitError("Gagal Terhubung ke Database Cloud."); }
    };
    initAuth();
    onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070b14] text-white font-sans uppercase">
      <div className="w-24 h-24 border-[10px] border-indigo-600 border-t-transparent rounded-full animate-spin mb-10 shadow-[0_0_80px_rgba(79,70,229,0.5)]"></div>
      <div className="font-black animate-pulse tracking-[1em] text-xs italic">Syncing Gemilang Cloud...</div>
    </div>
  );
  
  if (initError) return (
    <div className="h-screen flex items-center justify-center bg-rose-950 text-rose-100 font-black p-12 text-center border-t-[20px] border-rose-600 flex-col gap-8 font-sans uppercase">
      <AlertTriangle size={100} className="animate-bounce text-rose-500 shadow-2xl"/>
      <div className="max-w-2xl text-3xl italic leading-tight tracking-tighter">{initError}</div>
      <button onClick={() => window.location.reload()} className="bg-rose-600 text-white px-16 py-6 rounded-[30px] font-black text-xl shadow-2xl hover:bg-rose-500 transition border-b-[10px] border-rose-900 leading-none">RESTART CONNECTION</button>
    </div>
  );

  return (
    <ToastProvider>
       {!role ? (
         <LoginPage 
           onLogin={(r, t) => { setRole(r); if(t) setActiveTeacherName(t); }} 
           displayMode={displayMode}
           setDisplayMode={setDisplayMode}
           isFullScreen={isFullScreen}
           toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
         />
       ) : (
         role === 'admin' ? (
           <AdminDashboard 
             onLogout={() => { setRole(null); setActiveTeacherName(''); }} 
             displayMode={displayMode} 
           />
         ) : (
           <TeacherDashboard 
             teacherName={activeTeacherName} 
             onLogout={() => { setRole(null); setActiveTeacherName(''); }} 
             displayMode={displayMode} 
           />
         )
       )}
    </ToastProvider>
  );
}