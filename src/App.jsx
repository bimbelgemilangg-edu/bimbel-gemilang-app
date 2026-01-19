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
  Maximize, Minimize, Printer, FileSpreadsheet, FileBarChart, Monitor, Smartphone
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

const timeToMinutes = (timeStr) => {
    if(!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};
const isOverlap = (startA, endA, startB, endB) => {
    return Math.max(startA, startB) < Math.min(endA, endB);
};

const PRICING = {
  SD: { '1': { price: 250000 }, '3': { price: 675000, installments: 2 }, '6': { price: 1200000, installments: 3 } },
  SMP: { '1': { price: 300000 }, '3': { price: 810000, installments: 2 }, '6': { price: 1500000, installments: 3 } }
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
                <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600 mb-6 whitespace-pre-line leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">Batal</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Ya, Lanjutkan</button>
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
      <span className="hidden md:inline font-medium text-sm flex-1 text-left">{label}</span>
      {badgeCount > 0 && (
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
              {badgeCount}
          </span>
      )}
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
  const [absences, setAbsences] = useState([]);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscillatorRef = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 1000);
    const unsubClasses = onSnapshot(getCollection('gemilang_classes'), (snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error(err));
    const unsubStudents = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error(err));
    const todayStr = new Date().toLocaleDateString('id-ID');
    const qAbsence = query(getCollection('gemilang_class_attendance'), where('date', '==', todayStr));
    const unsubAbsence = onSnapshot(qAbsence, (snap) => {
        const data = snap.docs.map(d => d.data()).filter(d => d.status !== 'Hadir');
        setAbsences(data);
    }, (err) => console.error(err));
    return () => { clearInterval(timer); unsubClasses(); unsubStudents(); unsubAbsence(); };
  }, []);

  const todayClasses = useMemo(() => {
    const dayName = DAYS[today.getDay()];
    const dateStr = today.toISOString().split('T')[0];
    return classes.filter(c => (c.type === 'Regular' && c.day === dayName) || (c.type === 'Booking' && c.specificDate === dateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime));
  }, [classes, today]);

  const billingWarnings = useMemo(() => {
    let list = [];
    const now = new Date();
    const threshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); 
    const todayStr = now.toISOString().split('T')[0];
    const thresholdStr = threshold.toISOString().split('T')[0];

    students.forEach(s => {
      s.installments?.forEach(ins => {
        if(ins.status === 'unpaid' && ins.dueDate <= thresholdStr) {
            const isLate = ins.dueDate <= todayStr;
            list.push({ ...ins, studentName: s.name, contact: s.emergencyContact, isLate });
        }
      });
    });
    return list;
  }, [students]);

  const startBell = () => { if (bellStatus) return; setBellStatus("🔔 BUNYI..."); try { const Ctx = window.AudioContext || window.webkitAudioContext; if (!audioCtxRef.current) audioCtxRef.current = new Ctx(); const ctx = audioCtxRef.current; if (ctx.state === 'suspended') ctx.resume(); const gain = ctx.createGain(); gain.connect(ctx.destination); gain.gain.setValueAtTime(0.4, ctx.currentTime); const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.setValueAtTime(600, ctx.currentTime); o1.connect(gain); o1.start(); const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.setValueAtTime(800, ctx.currentTime); o2.connect(gain); o2.start(); oscillatorRef.current = { stop: () => { o1.stop(); o2.stop(); } }; gainNodeRef.current = gain; } catch(e){} };
  const stopBell = () => { setBellStatus(null); if(gainNodeRef.current) { gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05); setTimeout(()=>oscillatorRef.current?.stop(), 50); }};
  const sendWA = (num, msg) => { if(!num) return showToast("No HP Kosong", 'error'); let n = num.replace(/\D/g,''); if(n.startsWith('0')) n='62'+n.substring(1); window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`,'_blank'); };

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="relative z-10">
          <h2 className="text-blue-200 font-semibold mb-1">{today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</h2>
          <h1 className="text-5xl font-bold font-mono tracking-wider">{today.toLocaleTimeString('id-ID')}</h1>
          <div className="flex gap-4 mt-6">
             <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg"><span className="block text-2xl font-bold">{todayClasses.length}</span><span className="text-xs text-blue-100">Kelas Hari Ini</span></div>
             <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg"><span className="block text-2xl font-bold text-yellow-300">{billingWarnings.length}</span><span className="text-xs text-blue-100">Peringatan Tagihan</span></div>
          </div>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex flex-col items-center">
          <button onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} onTouchStart={startBell} onTouchEnd={stopBell} className="group relative w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer select-none active:bg-orange-50">
            <div className={`p-4 rounded-full transition-all duration-100 ${bellStatus ? 'bg-orange-500 text-white scale-110 shadow-[0_0_30px_rgba(249,115,22,0.6)]' : 'bg-blue-50 text-blue-600'}`}><Bell size={40} className={bellStatus?'animate-bounce':''} /></div>
            <span className="mt-2 font-bold text-slate-700 text-sm">{bellStatus ? 'LEPAS' : 'TEKAN'}</span>
          </button>
        </div>
        <GraduationCap size={150} className="hidden md:block absolute right-0 bottom-0 opacity-10 transform rotate-12" />
      </div>

      {billingWarnings.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3">
                  <div className="bg-orange-500 text-white p-2 rounded-full animate-pulse"><Bell size={24}/></div>
                  <div>
                      <h4 className="font-bold text-orange-900">Perhatian Admin!</h4>
                      <p className="text-sm text-orange-700">Ada {billingWarnings.length} tagihan yang perlu diperhatikan (1 minggu sebelum/sesudah jatuh tempo).</p>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex items-center gap-2 font-bold text-slate-700"><Users size={18}/> List Penagihan Terdekat (Minggu Ini)</div>
          <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                      <tr><th className="p-4">Siswa</th><th className="p-4">Jatuh Tempo</th><th className="p-4">Nominal</th><th className="p-4 text-right">Aksi</th></tr>
                  </thead>
                  <tbody>
                      {billingWarnings.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">Tidak ada tagihan mendesak.</td></tr> : 
                        billingWarnings.map((item, i) => (
                          <tr key={i} className={`border-b last:border-0 ${item.isLate ? 'bg-red-50/50' : 'bg-white'}`}>
                              <td className="p-4">
                                  <div className="font-bold text-slate-800">{item.studentName}</div>
                                  <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Cicilan Ke-{item.id}</div>
                              </td>
                              <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isLate ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                                      {item.dueDate} {item.isLate ? '(TERLAMBAT)' : ''}
                                  </span>
                              </td>
                              <td className="p-4 font-mono font-bold text-slate-700">Rp {formatRupiah(item.amount)}</td>
                              <td className="p-4 text-right">
                                  <button onClick={() => sendWA(item.contact, `Halo Bapak/Ibu Wali dari ${item.studentName}, kami menginformasikan bahwa tagihan SPP sebesar Rp ${formatRupiah(item.amount)} akan segera jatuh tempo pada ${item.dueDate}. Mohon dapat dipersiapkan. Terima kasih.`)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto hover:bg-green-700">
                                      <MessageCircle size={14}/> WA Wali
                                  </button>
                              </td>
                          </tr>
                        ))
                      }
                  </tbody>
              </table>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <div className="p-4 border-b bg-blue-50 rounded-t-2xl font-bold text-slate-800 flex gap-2"><Calendar className="text-blue-600"/> Jadwal Hari Ini</div>
          <div className="p-4 overflow-y-auto space-y-3 flex-1">{todayClasses.length===0?<div className="text-center text-slate-400 mt-10">Tidak ada kelas.</div>:todayClasses.map(c=>(<div key={c.id} className="p-3 border rounded-xl flex justify-between items-center hover:bg-slate-50"><div><div className="font-bold">{c.subject}</div><div className="text-xs text-slate-500">{c.startTime}-{c.endTime} • <span className="font-bold text-orange-600">{c.room}</span></div></div><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{c.pic}</span></div>))}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <div className="p-4 border-b bg-slate-50 rounded-t-2xl font-bold text-slate-800 flex gap-2"><UserCheck className="text-red-600"/> Log Absensi Guru</div>
          <div className="p-4 overflow-y-auto space-y-3 flex-1">{absences.length===0?<div className="text-center text-slate-400 mt-10">Semua hadir.</div>:absences.map((ab,i)=>(<div key={i} className="p-3 border rounded-xl flex justify-between items-center"><div><div className="font-bold">{ab.teacherName}</div><div className="text-xs text-red-500 font-bold">{ab.status}</div></div></div>))}</div>
        </div>
      </div>
    </div>
  );
}

// 3.2 StudentManager
function StudentManager() {
  const [students, setStudents] = useState([]);
  const [view, setView] = useState('list');
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const showToast = useToast();
   
  const [formData, setFormData] = useState({
    regDate: new Date().toISOString().split('T')[0],
    name: '', school: '', grade: '',
    fatherName: '', fatherJob: '',
    motherName: '', motherJob: '',
    address: '', emergencyContact: '',
    level: 'SD', duration: '1', discount: 0, 
    regFee: 25000,
    receivedAmount: 0, promiseDate: '', paymentMethod: 'Cash'
  });

  const [customDates, setCustomDates] = useState([]);
  const colRef = getCollection('gemilang_students');
  const financeRef = getCollection('gemilang_finance');

  useEffect(() => {
    const unsub = onSnapshot(colRef, (snap) => {
        const sorted = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setStudents(sorted);
    });
    return unsub;
  }, []);

  const calculation = useMemo(() => {
    const pricingConfig = PRICING[formData.level][formData.duration];
    const basePrice = pricingConfig.price;
    const discountAmount = (basePrice * formData.discount) / 100;
    const finalPrice = basePrice - discountAmount;
    const installmentCount = pricingConfig.installments || 1;
    const perInstallment = finalPrice / installmentCount;
    const totalBill = finalPrice + Number(formData.regFee);
    return { basePrice, discountAmount, finalPrice, installmentCount, perInstallment, totalBill };
  }, [formData.level, formData.duration, formData.discount, formData.regFee]);

  useEffect(() => {
    const dates = [];
    const startDate = new Date(formData.regDate);
    for (let i = 0; i < calculation.installmentCount; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + 1 + i, 1);
      dates.push(d.toISOString().split('T')[0]);
    }
    setCustomDates(dates);
  }, [calculation.installmentCount, formData.regDate]);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCustomDateChange = (idx, val) => {
    const newDates = [...customDates];
    newDates[idx] = val;
    setCustomDates(newDates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const installmentData = customDates.map((date, index) => ({ 
      id: index + 1, 
      dueDate: date, 
      amount: calculation.perInstallment, 
      status: 'unpaid' 
    }));
    
    let remainingPayment = Number(formData.receivedAmount);
    let regFeePaid = false;

    if (remainingPayment >= Number(formData.regFee)) {
        regFeePaid = true;
        remainingPayment -= Number(formData.regFee);
    }
    
    if (remainingPayment >= calculation.perInstallment) {
        installmentData[0].status = 'paid';
    }

    await addDoc(colRef, { ...formData, regFee: Number(formData.regFee), discount: Number(formData.discount), pricing: { basePrice: calculation.basePrice, finalPrice: calculation.finalPrice, installmentCount: calculation.installmentCount }, installments: installmentData, regFeePaid: regFeePaid, createdAt: new Date().toISOString() });
    
    if (formData.receivedAmount > 0) {
      await addDoc(financeRef, { type: 'in', amount: Number(formData.receivedAmount), description: `Pendaftaran Siswa: ${formData.name}`, method: formData.paymentMethod, createdAt: new Date().toISOString() });
    }
    
    showToast("Siswa berhasil didaftarkan!", 'success');
    setView('list');
  };

  const handlePayInstallment = async (student, idx, method) => {
      const installment = student.installments[idx];
      const newInstallments = [...student.installments];
      newInstallments[idx].status = 'paid';
      await updateDoc(getDocRef('gemilang_students', student.id), { installments: newInstallments });
      await addDoc(financeRef, { type: 'in', amount: installment.amount, description: `Cicilan ${student.name} (Ke-${installment.id})`, method: method, createdAt: new Date().toISOString() });
      showToast("Pembayaran tercatat!", 'success');
  };

  const downloadCSV = () => {
    const headers = ["Nama", "Sekolah", "Kelas", "Level", "Paket", "Status Pendaftaran", "Status Keuangan"];
    const rows = students.map(s => [
        s.name, s.school, s.grade, s.level, `${s.duration} Bulan`,
        s.regFeePaid ? 'Lunas' : 'Belum',
        s.installments?.every(i => i.status === 'paid') ? 'Lunas' : 'Ada Tagihan'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Siswa_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printAllStudentsPDF = () => {
    const printWindow = window.open('', '_blank');
    const rowsHTML = students.map((s, index) => {
      const financeStatus = s.installments?.every(i => i.status === 'paid') ? 'LUNAS' : 'ADA TAGIHAN';
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div style="font-weight: bold;">${s.name}</div>
            <div style="font-size: 9px; color: #666;">${s.school} (Kls ${s.grade})</div>
          </td>
          <td>${s.level}</td>
          <td>${s.duration} Bln</td>
          <td>
            <div style="font-size: 10px;">A: ${s.fatherName} (${s.fatherJob})</div>
            <div style="font-size: 10px;">I: ${s.motherName} (${s.motherJob})</div>
          </td>
          <td>${s.emergencyContact}</td>
          <td style="font-weight: bold; color: ${financeStatus === 'LUNAS' ? 'green' : 'red'}; text-align: center;">
            ${financeStatus}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Database Siswa - Bimbel Gemilang</title>
          <style>
            body { font-family: sans-serif; padding: 20px; font-size: 12px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .header h1 { color: #1e40af; margin: 0; font-size: 20px; }
            .header p { margin: 5px 0; color: #666; font-size: 10px; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 10px; padding: 10px; border: 1px solid #cbd5e1; }
            td { padding: 8px; border: 1px solid #cbd5e1; vertical-align: top; }
            tr:nth-child(even) { background: #f8fafc; }
            .summary { margin-top: 20px; font-weight: bold; font-size: 11px; }
            @media print { @page { margin: 1cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BIMBEL GEMILANG</h1>
            <p>LAPORAN DATABASE SISWA TERPADU</p>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <table>
            <thead><tr><th>No</th><th>Nama Siswa / Sekolah</th><th>Level</th><th>Paket</th><th>Orang Tua & Pekerjaan</th><th>Kontak</th><th>Status Keuangan</th></tr></thead>
            <tbody>${rowsHTML}</tbody>
          </table>
          <div class="summary">Total Siswa Terdaftar: ${students.length} Orang</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printStudentPDF = (s) => {
    const printWindow = window.open('', '_blank');
    const installmentsHTML = s.installments?.map(ins => `
        <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
            <span>Cicilan ${ins.id} (${ins.dueDate})</span>
            <span style="font-weight: bold; color: ${ins.status === 'paid' ? 'green' : 'red'};">
                ${ins.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'} - Rp ${formatRupiah(ins.amount)}
            </span>
        </div>
    `).join('') || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Data Siswa - ${s.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-bold; color: #1e40af; margin-bottom: 5px; }
            .subtitle { font-size: 12px; letter-spacing: 2px; color: #666; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .box { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .label { font-size: 10px; font-weight: bold; color: #888; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: bold; margin-top: 4px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #1e40af; padding-left: 10px; }
            .footer { margin-top: 50px; text-align: right; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">BIMBEL GEMILANG</div>
            <div class="subtitle">KARTU DATA & PEMBAYARAN SISWA TERPADU</div>
          </div>
          <div class="section-title">DATA PRIBADI SISWA</div>
          <div class="grid">
            <div class="box"><div class="label">Nama Lengkap</div><div class="value">${s.name}</div></div>
            <div class="box"><div class="label">Sekolah & Kelas</div><div class="value">${s.school} (Kelas ${s.grade})</div></div>
            <div class="box"><div class="label">Paket Belajar</div><div class="value">${s.level} - ${s.duration} Bulan</div></div>
            <div class="box"><div class="label">No. Darurat</div><div class="value">${s.emergencyContact}</div></div>
          </div>
          <div class="section-title">DATA ORANG TUA</div>
          <div class="grid">
            <div class="box"><div class="label">Nama Ayah</div><div class="value">${s.fatherName}</div></div>
            <div class="box"><div class="label">Pekerjaan Ayah</div><div class="value">${s.fatherJob}</div></div>
            <div class="box"><div class="label">Nama Ibu</div><div class="value">${s.motherName}</div></div>
            <div class="box"><div class="label">Pekerjaan Ibu</div><div class="value">${s.motherJob}</div></div>
          </div>
          <div style="margin-top: 30px;">
            <div class="section-title">KARTU KONTROL PEMBAYARAN (SPP)</div>
            <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 10px; display: flex; justify-content: space-between; border-bottom: 2px solid #ddd; font-weight: bold;">
                    <span>Biaya Pendaftaran</span>
                    <span style="color: ${s.regFeePaid ? 'green' : 'red'};">${s.regFeePaid ? 'SUDAH LUNAS' : 'BELUM LUNAS'} - Rp ${formatRupiah(s.regFee || 0)}</span>
                </div>
                ${installmentsHTML}
            </div>
          </div>
          <div class="footer"><p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p><br><br><br><p>__________________________</p><p>Admin Gemilang</p></div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const executeDeleteStudent = async () => { if (!studentToDelete) return; await deleteDoc(getDocRef('gemilang_students', studentToDelete.id)); setIsDeleteModalOpen(false); showToast("Data dihapus", "success"); };

  if (view === 'form') {
    return (
      <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
        <button onClick={() => setView('list')} className="mb-4 text-slate-500 hover:text-blue-600 flex items-center gap-2">&larr; Kembali</button>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white font-bold text-xl flex items-center gap-2"><PlusCircle/> Pendaftaran Baru</div>
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <section><h3 className="text-lg font-bold border-b pb-2 mb-4 text-slate-700">Identitas Siswa</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><input type="date" name="regDate" value={formData.regDate} onChange={handleInputChange} className="p-3 border rounded-xl" required /><input name="name" value={formData.name} onChange={handleInputChange} placeholder="Nama Lengkap" className="p-3 border rounded-xl" required /><div className="grid grid-cols-2 gap-4"><select name="level" value={formData.level} onChange={handleInputChange} className="p-3 border rounded-xl font-bold"><option value="SD">SD</option><option value="SMP">SMP</option></select><input name="grade" value={formData.grade} onChange={handleInputChange} placeholder="Kelas" className="p-3 border rounded-xl" required /></div><input name="school" value={formData.school} onChange={handleInputChange} placeholder="Sekolah" className="p-3 border rounded-xl" required /></div></section>
            <section>
                <h3 className="text-lg font-bold border-b pb-2 mb-4 text-slate-700">Data Orang Tua & Kontak</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <input name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Nama Ayah" className="w-full p-3 border rounded-xl" required />
                        <input name="fatherJob" value={formData.fatherJob} onChange={handleInputChange} placeholder="Pekerjaan Ayah" className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                        <input name="motherName" value={formData.motherName} onChange={handleInputChange} placeholder="Nama Ibu" className="w-full p-3 border rounded-xl" required />
                        <input name="motherJob" value={formData.motherJob} onChange={handleInputChange} placeholder="Pekerjaan Ibu" className="w-full p-3 border rounded-xl" required />
                    </div>
                    <input name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} placeholder="No HP/WA Aktif Wali" className="md:col-span-2 p-3 border rounded-xl" required />
                    <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Alamat Lengkap" className="md:col-span-2 p-3 border rounded-xl"></textarea>
                </div>
            </section>
            <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 text-slate-700">Biaya & Jadwal Pembayaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Durasi Paket</label><select name="duration" value={formData.duration} onChange={handleInputChange} className="w-full p-3 border rounded-xl"><option value="1">1 Bulan</option><option value="3">3 Bulan (2x Cicil)</option><option value="6">6 Bulan (3x Cicil)</option></select></div>
                        <div>
                            <label className="block text-xs font-bold text-blue-600 mb-1">Biaya Pendaftaran (Rp)</label>
                            <input type="number" name="regFee" value={formData.regFee} onChange={handleInputChange} className="w-full p-3 border-2 border-blue-100 rounded-xl font-bold text-blue-800" placeholder="Biaya Daftar" />
                        </div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Diskon Paket (%)</label><input type="number" name="discount" value={formData.discount} onChange={handleInputChange} className="w-full p-3 border rounded-xl" /></div>
                        {calculation.installmentCount > 0 && (
                            <div className="pt-4 border-t space-y-3">
                                <label className="block text-xs font-bold text-orange-600 uppercase tracking-widest">Atur Jadwal Cicilan (Custom)</label>
                                {customDates.map((date, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 w-16">KE-{i+1}:</span>
                                        <input type="date" value={date} onChange={(e) => handleCustomDateChange(i, e.target.value)} className="flex-1 p-2 border rounded-lg text-sm font-bold text-slate-700" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between text-sm"><span>Harga Paket:</span> <span className="font-bold">Rp {formatRupiah(calculation.finalPrice)}</span></div>
                        <div className="flex justify-between text-sm"><span>Biaya Daftar:</span> <span className="font-bold text-blue-600">+ Rp {formatRupiah(formData.regFee)}</span></div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total Tagihan:</span> <span className="text-indigo-600">Rp {formatRupiah(calculation.totalBill)}</span></div>
                        <div className="pt-4 space-y-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Uang Diterima Sekarang (Rp)</label>
                            <input type="number" name="receivedAmount" value={formData.receivedAmount} onChange={handleInputChange} className="w-full p-4 border-2 border-green-200 rounded-2xl text-2xl font-bold text-green-700 focus:border-green-600 outline-none" placeholder="0" />
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="w-full p-3 border rounded-xl bg-slate-50 font-bold"><option value="Cash">💵 Cash / Tunai</option><option value="Transfer">💳 Transfer Bank</option></select>
                        </div>
                    </div>
                </div>
            </section>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-blue-700 transition transform active:scale-95">SIMPAN DATA PENDAFTARAN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={executeDeleteStudent} title="Hapus Siswa?" message="Data tidak bisa dikembalikan." isDanger={true} />
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div><h3 className="text-2xl font-bold">Database Siswa</h3><p className="text-xs text-slate-400">Total: {students.length} Siswa terdaftar</p></div>
          <div className="flex gap-2">
            <button title="Download CSV" onClick={downloadCSV} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600 transition"><FileSpreadsheet size={20}/></button>
            <button title="Cetak Seluruh Database (PDF)" onClick={printAllStudentsPDF} className="p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 text-indigo-600 transition"><FileText size={20}/></button>
            <button onClick={() => setView('form')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition"><PlusCircle size={20}/> Tambah Baru</button>
          </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500"><tr className="border-b"><th className="p-4">Siswa / Sekolah</th><th className="p-4">Paket</th><th className="p-4">Pendaftaran</th><th className="p-4 text-center">Status Keuangan</th><th className="p-4 text-right">Aksi</th></tr></thead>
              <tbody>
                  {students.map(s => (<React.Fragment key={s.id}>
                    <tr onClick={() => setExpandedStudentId(expandedStudentId === s.id ? null : s.id)} className="border-b hover:bg-slate-50 cursor-pointer transition">
                        <td className="p-4"><div className="font-bold text-slate-700">{s.name}</div><div className="text-[10px] text-slate-400">{s.school} (Kls {s.grade})</div></td>
                        <td className="p-4 text-sm font-medium">{s.level} - {s.duration} Bulan</td>
                        <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.regFeePaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>DAFTAR: {formatRupiah(s.regFee || 0)}</span></td>
                        <td className="p-4 text-center">{s.installments?.every(i => i.status === 'paid') ? <span className="bg-green-500 text-white px-2 py-1 rounded-full text-[10px] font-bold">LUNAS</span> : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold">CICILAN</span>}</td>
                        <td className="p-4 text-right"><button onClick={(e) => { e.stopPropagation(); setStudentToDelete(s); setIsDeleteModalOpen(true); }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button></td>
                    </tr>
                    {expandedStudentId === s.id && (
                        <tr className="bg-slate-50"><td colSpan="5" className="p-4">
                            <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-blue-800 flex items-center gap-2"><CreditCard size={16}/> Kartu SPP Digital</h4>
                                    <button onClick={() => printStudentPDF(s)} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition"><Printer size={14}/> Cetak PDF / Kartu Siswa</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border flex justify-between items-center ${s.regFeePaid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <div><div className="text-xs font-bold text-slate-500 uppercase">Biaya Pendaftaran</div><div className="font-bold">Rp {formatRupiah(s.regFee || 0)}</div></div>
                                        {s.regFeePaid ? <span className="text-green-600 font-bold text-xs">LUNAS</span> : <select onChange={(e) => {
                                            if(e.target.value) {
                                                updateDoc(getDocRef('gemilang_students', s.id), { regFeePaid: true });
                                                addDoc(getCollection('gemilang_finance'), { type: 'in', amount: s.regFee, description: `Pendaftaran ${s.name}`, method: e.target.value, createdAt: new Date().toISOString() });
                                                showToast("Pendaftaran dilunasi!", "success");
                                            }
                                        }} className="text-xs p-1 border rounded bg-white"><option value="">Bayar Daftar...</option><option value="Cash">Cash</option><option value="Transfer">Bank</option></select>}
                                    </div>
                                    {s.installments?.map((ins, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border bg-white flex justify-between items-center">
                                            <div><div className="text-[10px] font-bold text-slate-400">CICILAN {ins.id} - {ins.dueDate}</div><div className="font-bold">Rp {formatRupiah(ins.amount)}</div></div>
                                            {ins.status === 'paid' ? <CheckCircle className="text-green-500" size={20}/> : <select onChange={(e) => handlePayInstallment(s, idx, e.target.value)} className="text-xs p-1 border rounded bg-slate-50"><option value="">Bayar...</option><option value="Cash">Cash</option><option value="Transfer">Bank</option></select>}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 italic font-medium">*Setelah memilih metode bayar, status warning cicilan di dashboard akan otomatis terhapus.</p>
                            </div>
                        </td></tr>
                    )}
                  </React.Fragment>))}
              </tbody>
          </table>
      </div>
    </div>
  );
}

// 3.3 TeacherManager
function TeacherManager() {
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [attendanceCode, setAttendanceCode] = useState('');
  const [activeCode, setActiveCode] = useState('...');
  const [logs, setLogs] = useState([]);
  const showToast = useToast();
  useEffect(() => {
    const unsubT = onSnapshot(getCollection('gemilang_teachers'), (snap) => setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubS = onSnapshot(getDocRef('gemilang_settings', 'attendance'), (snap) => { if(snap.exists()) setActiveCode(snap.data().code); });
    const unsubL = onSnapshot(getCollection('gemilang_attendance'), (snap) => setLogs(snap.docs.map(d => ({id:d.id, ...d.data()})).sort((a,b) => b.timestamp.localeCompare(a.timestamp))));
    return () => { unsubT(); unsubS(); unsubL(); };
  }, []);
  const handleAdd = async (e) => { e.preventDefault(); if (!name || !subject) return; await addDoc(getCollection('gemilang_teachers'), { name, subject, createdAt: new Date().toISOString() }); setName(''); setSubject(''); showToast("Guru tersimpan", "success"); };
  const handleSetCode = async () => { await setDoc(getDocRef('gemilang_settings', 'attendance'), { code: attendanceCode.toUpperCase() }); showToast("Kode Absen Aktif!", "success"); setAttendanceCode(''); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-in fade-in duration-500">
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Key className="text-orange-600"/> Setup Kode Absen</h3><div className="p-4 bg-orange-50 rounded-xl mb-4 text-center border border-orange-200 tracking-widest font-mono text-3xl font-bold text-orange-800">{activeCode}</div><div className="flex gap-2"><input value={attendanceCode} onChange={e => setAttendanceCode(e.target.value.toUpperCase())} className="flex-1 p-3 border rounded-xl uppercase text-center font-bold" placeholder="Kode Baru" maxLength={4} /><button onClick={handleSetCode} className="bg-orange-600 text-white px-4 rounded-xl font-bold hover:bg-orange-700">Set</button></div></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><GraduationCap className="text-purple-600"/> Tambah Guru</h3><form onSubmit={handleAdd} className="space-y-4"><input value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-xl outline-none" placeholder="Nama Guru" /><input value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 border rounded-xl outline-none" placeholder="Bidang Studi" /><button className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg">Simpan</button></form></div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:h-[600px] flex flex-col"><h3 className="font-bold text-lg mb-4">Daftar Pengajar</h3><div className="space-y-3 overflow-y-auto flex-1 pr-2">{teachers.map(t => (<div key={t.id} className="border p-3 rounded-xl flex justify-between items-center bg-white"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold uppercase">{t.name.charAt(0)}</div><div><h4 className="font-bold text-slate-700 text-sm">{t.name}</h4><p className="text-[10px] text-slate-400">{t.subject}</p></div></div><button onClick={() => deleteDoc(getDocRef('gemilang_teachers', t.id))} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button></div>))}</div></div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:h-[600px] flex flex-col"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="text-blue-600"/> Realtime Log</h3><div className="space-y-3 overflow-y-auto flex-1 pr-2">{logs.map(log => (<div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"><div><div className="font-bold text-slate-700 text-xs">{log.teacherName}</div><div className="text-[10px] text-slate-400">{log.date}</div></div><div className="text-right font-mono font-bold text-blue-600 text-xs">{log.time}</div></div>))}</div></div>
    </div>
  );
}

// 3.4 ClassManager
function ClassManager() {
    const [classes, setClasses] = useState([]);
    const [view, setView] = useState('list'); 
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [isManageStudentOpen, setIsManageStudentOpen] = useState(false);
    const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
    const [tempSelectedStudents, setTempSelectedStudents] = useState([]);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const showToast = useToast();

    const [form, setForm] = useState({
        day: 'Senin', startTime: '13:00', endTime: '14:30',
        subject: '', room: 'MERKURIUS', pic: '', type: 'Regular', specificDate: '',
        enrolledStudents: [] 
    });

    const colRef = getCollection('gemilang_classes');
    
    useEffect(() => {
        const unsub = onSnapshot(colRef, (snap) => setClasses(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubT = onSnapshot(getCollection('gemilang_teachers'), (snap) => setTeachers(snap.docs.map(d => d.data().name)));
        const unsubS = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => { unsub(); unsubT(); unsubS(); };
    }, []);

    const checkConflict = (newClass) => {
        const newStart = timeToMinutes(newClass.startTime);
        const newEnd = timeToMinutes(newClass.endTime);
        const targetDayName = newClass.type === 'Regular' ? newClass.day : DAYS[new Date(newClass.specificDate).getDay()];
        for (const existing of classes) {
            if (existing.room !== newClass.room) continue;
            let isDayMatch = false;
            if (newClass.type === 'Regular' && existing.type === 'Regular') { if (newClass.day === existing.day) isDayMatch = true; }
            else if (newClass.type === 'Booking' && existing.type === 'Booking') { if (newClass.specificDate === existing.specificDate) isDayMatch = true; }
            else if (newClass.type === 'Regular' && existing.type === 'Booking') { const existingDayName = DAYS[new Date(existing.specificDate).getDay()]; if (newClass.day === existingDayName) isDayMatch = true; }
            else if (newClass.type === 'Booking' && existing.type === 'Regular') { if (targetDayName === existing.day) isDayMatch = true; }
            if (!isDayMatch) continue;
            if (isOverlap(newStart, newEnd, timeToMinutes(existing.startTime), timeToMinutes(existing.endTime))) return existing;
        }
        return null; 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (timeToMinutes(form.startTime) >= timeToMinutes(form.endTime)) return showToast("Waktu tidak valid!", "error");
        const conflict = checkConflict(form);
        if (conflict) return showToast(`BENTROK RUANGAN dengan ${conflict.subject}!`, "error");
        await addDoc(colRef, { ...form, enrolledStudents: [] });
        showToast("Jadwal Berhasil Disimpan", "success");
        setView('list');
    };

    const matrixData = classes.filter(c => {
        const selectedDayName = DAYS[new Date(viewDate).getDay()];
        return (c.type === 'Regular' && c.day === selectedDayName) || (c.type === 'Booking' && c.specificDate === viewDate);
    });

    return (
        <div className="space-y-6 w-full animate-in fade-in duration-500">
             <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={async () => { await deleteDoc(getDocRef('gemilang_classes', deleteId)); setIsDeleteModalOpen(false); }} title="Hapus Jadwal?" message="Tindakan ini permanen." isDanger={true} />
             {isManageStudentOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                     <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh]">
                         <div className="p-6 border-b flex justify-between items-center"><div><h3 className="font-bold text-lg">Kelola Siswa Kelas</h3><p className="text-xs text-slate-500">{selectedClassForStudents?.subject}</p></div><button onClick={() => setIsManageStudentOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div>
                         <div className="p-4 overflow-y-auto flex-1 bg-slate-50"><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{students.map(s => { const isSelected = tempSelectedStudents.includes(s.id); return ( <div key={s.id} onClick={() => { if(isSelected) setTempSelectedStudents(p => p.filter(id => id !== s.id)); else setTempSelectedStudents(p => [...p, s.id]); }} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${isSelected ? 'bg-blue-100 border-blue-400' : 'bg-white border-slate-200 hover:bg-slate-100'}`}><div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-400'}`}>{isSelected && <CheckCircle size={14}/>}</div><div><div className="font-bold text-sm">{s.name}</div><div className="text-[10px] text-slate-400 tracking-wider">KLS {s.grade}</div></div></div> ) })}</div></div>
                         <div className="p-4 border-t bg-white flex justify-between items-center"><span className="text-sm font-bold text-slate-600">{tempSelectedStudents.length} Terpilih</span><button onClick={async () => { await updateDoc(getDocRef('gemilang_classes', selectedClassForStudents.id), { enrolledStudents: tempSelectedStudents }); setIsManageStudentOpen(false); showToast("Siswa diperbarui", "success"); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Simpan</button></div>
                     </div>
                 </div>
             )}
             <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><div><h3 className="text-2xl font-bold">Ruangan & Jadwal</h3><p className="text-xs text-slate-400 tracking-widest uppercase">Room Management</p></div><button onClick={() => setView(view === 'list' ? 'form' : 'list')} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{view === 'list' ? <><PlusCircle size={20}/> Tambah Jadwal</> : 'Batal'}</button></div>
             {view === 'form' && (
                 <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-100">
                     <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-200 flex gap-4"><button type="button" onClick={() => setForm({...form, type: 'Regular'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.type === 'Regular' ? 'bg-blue-600 text-white shadow' : 'bg-white border'}`}>Regular (Mingguan)</button><button type="button" onClick={() => setForm({...form, type: 'Booking'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.type === 'Booking' ? 'bg-purple-600 text-white shadow' : 'bg-white border'}`}>Booking (Sekali)</button></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">{form.type === 'Regular' ? 'HARI' : 'TANGGAL'}</label>{form.type === 'Regular' ? (<select value={form.day} onChange={e => setForm({...form, day: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50">{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>) : (<input type="date" value={form.specificDate} onChange={e => setForm({...form, specificDate: e.target.value})} className="w-full p-3 border rounded-xl" required />)}</div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">RUANGAN</label><select value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full p-3 border rounded-xl font-bold">{ROOMS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                        <div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">MULAI</label><input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full p-3 border rounded-xl" required /></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">SELESAI</label><input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full p-3 border rounded-xl" required /></div></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">MATA PELAJARAN</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Matematika / English" className="w-full p-3 border rounded-xl" required /></div>
                        <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">GURU (PIC)</label><select value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} className="w-full p-3 border rounded-xl" required><option value="">-- Pilih Guru --</option>{teachers.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <button className="md:col-span-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">SIMPAN JADWAL</button>
                     </form>
                 </div>
             )}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-700 flex items-center gap-2"><Map size={18} className="text-blue-600"/> Ketersediaan Ruangan</h3><div className="bg-white p-2 border rounded-lg shadow-sm flex items-center gap-2 text-xs"><span className="text-slate-400 font-bold">TANGGAL:</span><input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="font-bold outline-none" /></div></div>
                <div className="overflow-x-auto p-4"><div className="grid grid-cols-5 gap-4 min-w-[800px]">{ROOMS.map(room => (<div key={room} className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-[500px]"><div className="p-3 bg-slate-800 text-white text-center font-bold text-[10px] rounded-t-xl uppercase tracking-widest">{room}</div><div className="flex-1 p-2 space-y-2 overflow-y-auto">{matrixData.filter(c => c.room === room).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(c => (<div key={c.id} className={`p-3 rounded-lg border shadow-sm group hover:scale-[1.02] transition duration-200 ${c.type === 'Booking' ? 'bg-purple-100 border-purple-300' : 'bg-blue-100 border-blue-300'}`}><div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold bg-white/50 px-1 rounded">{c.startTime}</span><div className="flex gap-1"><button onClick={() => { setSelectedClassForStudents(c); setTempSelectedStudents(c.enrolledStudents || []); setIsManageStudentOpen(true); }} className="text-blue-500 bg-white p-1 rounded hover:bg-blue-50"><Users size={10}/></button><button onClick={() => { setDeleteId(c.id); setIsDeleteModalOpen(true); }} className="text-red-500 bg-white p-1 rounded hover:bg-red-50"><Trash2 size={10}/></button></div></div><div className="font-bold text-[11px] text-slate-800 leading-tight">{c.subject}</div><div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><User size={8}/> {c.pic}</div></div>))}{matrixData.filter(c => c.room === room).length === 0 && (<div className="h-full flex items-center justify-center text-slate-300 text-[10px] italic">Kosong</div>)}</div></div>))}</div></div>
             </div>
        </div>
    );
}

// 3.5 FinanceManager
function FinanceManager() {
  const [finances, setFinances] = useState([]);
  const [students, setStudents] = useState([]);
  const [type, setType] = useState('in');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [method, setMethod] = useState('Cash'); 
  const showToast = useToast();

  useEffect(() => {
    const unsubF = onSnapshot(getCollection('gemilang_finance'), (snap) => setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt.localeCompare(a.createdAt))));
    const unsubS = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubF(); unsubS(); };
  }, []);

  const cashIn = finances.filter(f => f.type === 'in' && f.method === 'Cash').reduce((a, b) => a + b.amount, 0);
  const cashOut = finances.filter(f => f.type === 'out' && f.method === 'Cash').reduce((a, b) => a + b.amount, 0);
  const bankIn = finances.filter(f => f.type === 'in' && f.method === 'Transfer').reduce((a, b) => a + b.amount, 0);
  const bankOut = finances.filter(f => f.type === 'out' && f.method === 'Transfer').reduce((a, b) => a + b.amount, 0);
  const totalReceivable = useMemo(() => { let t = 0; students.forEach(s => s.installments?.forEach(i => { if(i.status === 'unpaid') t += i.amount; })); return t; }, [students]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-500"><p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Total Saldo</p><h3 className="text-3xl font-bold">Rp {formatRupiah((cashIn + bankIn) - (cashOut + bankOut))}</h3></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100"><div className="flex justify-between items-start mb-2"><p className="text-blue-600 text-[10px] uppercase font-bold tracking-widest">Saldo Brangkas</p><Wallet className="text-blue-500" size={18}/></div><h3 className="text-2xl font-bold text-slate-800">Rp {formatRupiah(cashIn - cashOut)}</h3></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100"><div className="flex justify-between items-start mb-2"><p className="text-purple-600 text-[10px] uppercase font-bold tracking-widest">Saldo Bank</p><Landmark className="text-purple-500" size={18}/></div><h3 className="text-2xl font-bold text-slate-800">Rp {formatRupiah(bankIn - bankOut)}</h3></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100"><p className="text-orange-500 text-[10px] uppercase font-bold tracking-widest mb-1">Piutang</p><h3 className="text-2xl font-bold text-slate-800">Rp {formatRupiah(totalReceivable)}</h3></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm h-fit border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><DollarSign className="text-blue-600"/> Catat Transaksi</h3>
            <form onSubmit={async (e) => { e.preventDefault(); if(!amount || !desc) return; await addDoc(getCollection('gemilang_finance'), { type, amount: parseInt(amount), description: desc, method, createdAt: new Date().toISOString() }); setAmount(''); setDesc(''); showToast("Tersimpan!", "success"); }} className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl"><button type="button" onClick={() => setType('in')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${type === 'in' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Masuk</button><button type="button" onClick={() => setType('out')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${type === 'out' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Keluar</button></div>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Nominal (Rp)" className="w-full p-3 border rounded-xl outline-none" required /><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Keterangan" className="w-full p-3 border rounded-xl outline-none" required />
                <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-slate-700 bg-slate-50"><option value="Cash">💵 Tunai / Cash</option><option value="Transfer">💳 Bank / Transfer</option></select>
                <button className={`w-full py-4 rounded-xl font-bold text-white shadow-lg ${type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>SIMPAN</button>
            </form>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><h3 className="font-bold text-lg mb-4">Mutasi Terakhir</h3><div className="space-y-2">{finances.slice(0, 10).map(f => (<div key={f.id} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-slate-50 transition"><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${f.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{f.type === 'in' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}</div><div><div className="font-bold text-xs text-slate-700">{f.description}</div><div className="text-[9px] text-slate-400 uppercase">{new Date(f.createdAt).toLocaleDateString('id-ID')} • {f.method}</div></div></div><span className={`font-mono font-bold text-xs ${f.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{f.type === 'in' ? '+' : '-'} {formatRupiah(f.amount)}</span></div>))}</div></div>
      </div>
    </div>
  );
}

// 3.6 AttendanceReportManager
function AttendanceReportManager() {
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  showToast = useToast();

  useEffect(() => {
    const unsubStudents = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubAttendance = onSnapshot(getCollection('gemilang_class_attendance'), (snap) => setAttendanceLogs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubStudents(); unsubAttendance(); };
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [students, searchQuery]);

  const printAttendancePDF = (s) => {
    const logs = attendanceLogs.filter(log => log.studentId === s.id).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    const stats = { Hadir: logs.filter(l => l.status === 'Hadir').length, Ijin: logs.filter(l => l.status === 'Ijin').length, Alpha: logs.filter(l => l.status === 'Alpha').length };
    const rowsHTML = logs.map((log, i) => `<tr><td style="text-align: center;">${i + 1}</td><td>${log.date}</td><td>${log.className}</td><td>${log.teacherName}</td><td style="font-weight: bold; color: ${log.status === 'Hadir' ? 'green' : log.status === 'Ijin' ? 'orange' : 'red'};">${log.status.toUpperCase()}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #999;">Tidak ada riwayat absensi.</td></tr>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Absensi - ${s.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #7c3aed; margin-bottom: 5px; }
            .subtitle { font-size: 12px; letter-spacing: 2px; color: #666; text-transform: uppercase; }
            .student-info { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
            .info-item { font-size: 14px; }
            .label { color: #6b7280; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .value { font-weight: bold; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f3f4f6; color: #374151; padding: 12px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; border-top: 1px solid #e5e7eb; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
            .stats { display: flex; gap: 10px; margin-top: 20px; }
            .stat-box { flex: 1; padding: 15px; border-radius: 10px; text-align: center; color: white; font-weight: bold; }
            .hadir { background: #10b981; } .ijin { background: #f59e0b; } .alpha { background: #ef4444; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header"><div class="title">BIMBEL GEMILANG</div><div class="subtitle">Laporan Kehadiran Siswa Terpadu</div></div>
          <div class="student-info"><div class="info-item"><div class="label">Nama Siswa</div><div class="value">${s.name}</div></div><div class="info-item"><div class="label">Sekolah & Kelas</div><div class="value">${s.school} (Kelas ${s.grade})</div></div><div class="info-item"><div class="label">Level Belajar</div><div class="value">${s.level}</div></div><div class="info-item"><div class="label">Periode Laporan</div><div class="value">${new Date().toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</div></div></div>
          <div class="stats"><div class="stat-box hadir">Hadir: ${stats.Hadir}</div><div class="stat-box ijin">Ijin: ${stats.Ijin}</div><div class="stat-box alpha">Alpha: ${stats.Alpha}</div></div>
          <table><thead><tr><th width="5%">No</th><th width="20%">Tanggal</th><th width="35%">Mata Pelajaran</th><th width="25%">Guru / PIC</th><th width="15%">Status</th></tr></thead><tbody>${rowsHTML}</tbody></table>
          <div class="footer"><div>Dicetak pada: ${new Date().toLocaleString('id-ID')}<br><i>Laporan ini dihasilkan secara otomatis oleh Gemilang System</i></div><div style="text-align: center;">Mengetahui,<br><br><br><br>(____________________)<br>Admin Gemilang</div></div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h3 className="text-2xl font-bold">Laporan Absensi Siswa</h3><p className="text-xs text-slate-400">Pilih siswa untuk mencetak rekam kehadiran.</p></div>
        <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama siswa..." className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition" /></div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr><th className="p-4">Nama Siswa</th><th className="p-4">Kelas</th><th className="p-4 text-center">Total Pertemuan</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y">
              {filteredStudents.map(s => {
                const logsCount = attendanceLogs.filter(l => l.studentId === s.id).length;
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="p-4"><div className="font-bold text-slate-700">{s.name}</div><div className="text-[10px] text-slate-400 uppercase tracking-tighter">{s.level}</div></td>
                    <td className="p-4 text-sm text-slate-600">{s.school} (Kls {s.grade})</td>
                    <td className="p-4 text-center"><span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{logsCount} Sesi</span></td>
                    <td className="p-4 text-right"><button onClick={() => printAttendancePDF(s)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ml-auto hover:bg-purple-700 transition shadow-md"><Printer size={14}/> Cetak Laporan</button></td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 3.7 SettingsView
function SettingsView() {
  const [newPass, setNewPass] = useState('');
  const showToast = useToast();
  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
       <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock className="text-blue-600"/> Pengaturan Admin</h3>
       <label className="block text-sm font-bold text-slate-500 mb-2">Ganti Password Admin</label>
       <div className="flex gap-4"><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="flex-1 p-3 border rounded-xl outline-none" placeholder="Password Baru" /><button onClick={async () => { if(!newPass) return; await setDoc(getDocRef('gemilang_settings', 'admin_auth'), { password: newPass }); showToast("Tersimpan!", 'success'); setNewPass(''); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">Simpan</button></div>
    </div>
  );
}

// ==========================================
// 4. DASHBOARD UTAMA
// ==========================================

function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(getCollection('gemilang_students'), (snap) => {
        const now = new Date();
        const threshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thresholdStr = threshold.toISOString().split('T')[0];
        let count = 0;
        snap.docs.forEach(doc => {
            doc.data().installments?.forEach(ins => {
                if (ins.status === 'unpaid' && ins.dueDate <= thresholdStr) count++;
            });
        });
        setOverdueCount(count);
    });
    return unsub;
  }, []);

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-4 md:p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg"><GraduationCap size={24} className="text-white" /></div>
          <div className="hidden md:block"><h1 className="font-bold text-lg">GEMILANG</h1><p className="text-[10px] text-slate-400 uppercase tracking-widest">Administrator</p></div>
        </div>
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
          <MenuButton id="home" icon={<LayoutDashboard />} label="Beranda" active={activeTab} set={setActiveTab} badgeCount={overdueCount} />
          <MenuButton id="students" icon={<Users />} label="Data Siswa" active={activeTab} set={setActiveTab} />
          <MenuButton id="attendance_report" icon={<ClipboardCheck />} label="Laporan Absensi" active={activeTab} set={setActiveTab} />
          <MenuButton id="finance" icon={<DollarSign />} label="Keuangan" active={activeTab} set={setActiveTab} />
          <MenuButton id="teachers" icon={<Briefcase />} label="Data Guru" active={activeTab} set={setActiveTab} />
          <MenuButton id="classes" icon={<Calendar />} label="Jadwal & Kelas" active={activeTab} set={setActiveTab} />
          <div className="pt-6 mt-6 border-t border-slate-800">
            <MenuButton id="settings" icon={<Settings />} label="Pengaturan" active={activeTab} set={setActiveTab} />
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-6 py-3 text-red-400 hover:bg-red-500/10 transition-all mt-2">
              <LogOut size={20} /> <span className="hidden md:inline font-medium text-sm text-left">Keluar</span>
            </button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto relative bg-slate-50 w-full">
        <div className="p-4 md:p-8 w-full"> 
          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'students' && <StudentManager />}
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

function TeacherDashboard({ teacherName, onLogout }) {
  const [activeView, setActiveView] = useState('home'); 
  const [attendanceCode, setAttendanceCode] = useState('');
  const [time, setTime] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const showToast = useToast();

  useEffect(() => {
    const unsubH = onSnapshot(getCollection('gemilang_attendance'), (snap) => setHistory(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(l => l.teacherName === teacherName).sort((a,b) => b.timestamp.localeCompare(a.timestamp))));
    const unsubC = onSnapshot(getCollection('gemilang_classes'), (snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubS = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { unsubH(); unsubC(); unsubS(); clearInterval(timer); };
  }, [teacherName]);

  const myClasses = useMemo(() => {
      const dayName = DAYS[time.getDay()];
      const dateStr = time.toISOString().split('T')[0];
      return classes.filter(c => ((c.type === 'Regular' && c.day === dayName) || (c.type === 'Booking' && c.specificDate === dateStr)) && c.pic?.toLowerCase().includes(teacherName.toLowerCase()));
  }, [classes, time, teacherName]);

  const handleAbsen = async (e) => {
    e.preventDefault();
    if (!attendanceCode) return;
    const settingsSnap = await getDoc(getDocRef('gemilang_settings', 'attendance'));
    if (settingsSnap.exists() && attendanceCode === settingsSnap.data().code) {
        await addDoc(getCollection('gemilang_attendance'), { teacherName, timestamp: new Date().toISOString(), date: new Date().toLocaleDateString('id-ID'), time: new Date().toLocaleTimeString('id-ID'), status: 'Hadir' });
        showToast(`Absen Berhasil!`, 'success');
        setAttendanceCode('');
    } else { showToast("Kode Salah!", 'error'); }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="bg-purple-700 text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div><h1 className="text-2xl font-bold uppercase tracking-tight">GEMILANG TEACHER</h1><p className="text-purple-200 text-xs font-bold uppercase tracking-widest">{teacherName}</p></div>
          <div className="flex gap-2">
              <button onClick={() => setActiveView('home')} className={`px-4 py-2 rounded-lg font-bold text-xs transition ${activeView === 'home' ? 'bg-white text-purple-700 shadow' : 'text-white'}`}>BERANDA</button>
              <button onClick={() => setActiveView('attendance')} className={`px-4 py-2 rounded-lg font-bold text-xs transition ${activeView === 'attendance' ? 'bg-white text-purple-700 shadow' : 'text-white'}`}>ABSEN SISWA</button>
              <button onClick={onLogout} className="p-2 bg-red-600 rounded-lg"><LogOut size={16}/></button>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {activeView === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-10 text-center flex flex-col justify-center border-4 border-purple-100">
                    <div className="text-5xl font-mono font-bold text-slate-800 mb-8">{time.toLocaleTimeString('id-ID')}</div>
                    <form onSubmit={handleAbsen} className="max-w-xs mx-auto space-y-4 w-full">
                        <input type="text" value={attendanceCode} onChange={e => setAttendanceCode(e.target.value.toUpperCase())} className="w-full text-center text-3xl font-bold p-5 border-2 border-purple-200 rounded-3xl uppercase tracking-widest focus:border-purple-600 outline-none" placeholder="KODE" maxLength={4} />
                        <button className="w-full bg-purple-600 text-white py-5 rounded-3xl font-bold shadow-xl hover:bg-purple-700 transition transform active:scale-95">KONFIRMASI HADIR</button>
                    </form>
                </div>
                <div className="bg-white rounded-3xl p-6 border-4 border-purple-50 overflow-hidden h-[450px] flex flex-col">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Clock size={20} className="text-purple-600"/> Riwayat Masuk Anda</h3>
                    <div className="overflow-y-auto flex-1 space-y-2 pr-2">{history.map(h => (<div key={h.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase">{h.date}</span><span className="font-mono font-bold text-purple-600">{h.time} (HADIR)</span></div>))}</div>
                </div>
            </div>
        )}
        {activeView === 'attendance' && (
            <div className="bg-white rounded-3xl p-6 border-4 border-purple-50 animate-in slide-in-from-right duration-300">
                {!selectedClassForAttendance ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myClasses.map(c => (<div key={c.id} onClick={() => setSelectedClassForAttendance(c)} className="border-2 border-slate-100 p-5 rounded-3xl hover:border-purple-300 cursor-pointer transition bg-white shadow-sm group">
                            <h4 className="font-bold text-lg group-hover:text-purple-600">{c.subject}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{c.room} • {c.startTime}</p>
                            <div className="mt-4 text-xs font-bold text-purple-600 bg-purple-50 w-fit px-3 py-1 rounded-full">Siswa: {c.enrolledStudents?.length || 0} orang</div>
                        </div>))}
                        {myClasses.length === 0 && <div className="md:col-span-2 text-center py-20 text-slate-400">Jadwal Anda kosong hari ini.</div>}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b"><div><h3 className="font-bold text-2xl">{selectedClassForAttendance.subject}</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Absensi Siswa Gemilang</p></div><button onClick={() => setSelectedClassForAttendance(null)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button></div>
                        <div className="space-y-3">{selectedClassForAttendance.enrolledStudents?.map(sid => { const s = students.find(st => st.id === sid); if(!s) return null; return (<div key={sid} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 rounded-3xl gap-4"><div className="font-bold text-slate-700">{s.name}</div><div className="flex gap-2">{['Hadir', 'Ijin', 'Alpha'].map(st => (<button key={st} onClick={() => setAttendanceStatuses(p => ({...p, [sid]: st}))} className={`px-5 py-2 rounded-2xl text-xs font-bold border-2 transition ${attendanceStatuses[sid] === st ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>{st}</button>))}</div></div>); })}</div>
                        <button onClick={async () => { const todayStr = new Date().toLocaleDateString('id-ID'); const promises = Object.keys(attendanceStatuses).map(sid => addDoc(getCollection('gemilang_class_attendance'), { classId: selectedClassForAttendance.id, className: selectedClassForAttendance.subject, studentId: sid, status: attendanceStatuses[sid], date: todayStr, teacherName, timestamp: new Date().toISOString() })); await Promise.all(promises); showToast("Absensi Tersimpan!", "success"); setSelectedClassForAttendance(null); setAttendanceStatuses({}); }} className="w-full bg-purple-600 text-white py-5 rounded-3xl font-bold shadow-2xl hover:bg-purple-700 transition">SIMPAN SEMUA ABSENSI</button>
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

function LoginPage({ onLogin }) {
  const [view, setView] = useState('admin');
  const [password, setPassword] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [realAdminPass, setRealAdminPass] = useState('admin123');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [displayMode, setDisplayMode] = useState('auto'); // auto, hp, pc
  const showToast = useToast();

  useEffect(() => {
    const unsubT = onSnapshot(getCollection('gemilang_teachers'), (snap) => setTeachers(snap.docs.map(d => d.data().name)));
    const unsubP = onSnapshot(getDocRef('gemilang_settings', 'admin_auth'), (snap) => { if(snap.exists() && snap.data().password) setRealAdminPass(snap.data().password); });
    return () => { unsubT(); unsubP(); };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}); setIsFullScreen(true); } 
    else { if (document.exitFullscreen) { document.exitFullscreen(); setIsFullScreen(false); } }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 font-sans p-4 animate-in fade-in duration-700 overflow-hidden">
      <div className={`bg-white p-8 rounded-3xl shadow-2xl border-4 border-blue-500/20 relative animate-in zoom-in-95 duration-500 transition-all ${displayMode === 'hp' ? 'w-[360px]' : displayMode === 'pc' ? 'w-[500px]' : 'w-full max-w-md'}`}>
        <div className="text-center mb-8 mt-2"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white"><GraduationCap size={32} /></div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bimbel Gemilang</h1><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sistem Manajemen Terpadu</p></div>
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6"><button onClick={() => setView('admin')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${view === 'admin' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Admin</button><button onClick={() => setView('guru')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${view === 'guru' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}>Guru</button></div>
        <form onSubmit={(e) => { e.preventDefault(); if(view === 'admin') { if(password === realAdminPass) onLogin('admin'); else showToast("Sandi Salah!", 'error'); } else { if(!selectedTeacher) return showToast("Pilih Nama!", 'error'); onLogin('teacher', selectedTeacher); } }} className="space-y-4">
          {view === 'admin' ? (<div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Sandi Administrator</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Masukkan Password..." /></div>) : 
            (<div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Pilih Nama Pengajar</label><select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 font-bold text-slate-700 outline-none"><option value="">-- Pilih Nama --</option>{teachers.map((t, i) => <option key={i} value={t}>{t}</option>)}</select></div>)}
          <button className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition transform active:scale-95 ${view === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>Masuk ke System &rarr;</button>
        </form>
      </div>

      <div className="flex flex-col items-center gap-3 mt-8">
        <div className="flex gap-2">
            <button onClick={() => setDisplayMode('hp')} className={`p-2 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition ${displayMode === 'hp' ? 'bg-white text-blue-900 shadow-lg' : 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/20'}`}><Smartphone size={12}/> MODE HP</button>
            <button onClick={() => setDisplayMode('pc')} className={`p-2 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition ${displayMode === 'pc' ? 'bg-white text-blue-900 shadow-lg' : 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/20'}`}><Monitor size={12}/> MODE PC</button>
        </div>
        <button onClick={toggleFullScreen} className="hidden md:flex text-white/30 hover:text-white transition items-center gap-2 text-[10px] font-bold bg-white/5 px-4 py-2 rounded-full border border-white/5">{isFullScreen ? <Minimize size={12}/> : <Maximize size={12}/>} {isFullScreen ? 'KELUAR FULLSCREEN' : 'MASUK FULLSCREEN'}</button>
      </div>
      
      <p className="mt-4 text-[10px] text-white/10 uppercase tracking-[0.2em]">Gemilang System v2.4</p>
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

  useEffect(() => {
    const initAuth = async () => {
      try { 
        await signInAnonymously(auth); 
      } catch (err) { 
        console.error("Auth Error:", err);
        setInitError("Koneksi gagal."); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold animate-pulse tracking-[0.5em] text-sm uppercase">Menghidupkan Gemilang...</div>;
  if (initError) return <div className="h-screen flex items-center justify-center bg-red-100 text-red-600 font-bold p-4 text-center">{initError}</div>;

  return (
    <ToastProvider>
       {!role ? <LoginPage onLogin={(r, t) => { setRole(r); if(t) setActiveTeacherName(t); }} /> : 
        role === 'admin' ? <AdminDashboard onLogout={() => setRole(null)} /> : 
        <TeacherDashboard teacherName={activeTeacherName} onLogout={() => setRole(null)} />
       }
    </ToastProvider>
  );
}