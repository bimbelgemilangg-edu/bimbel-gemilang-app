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
  Maximize, Minimize, Printer, FileSpreadsheet, FileBarChart, Monitor, Smartphone, Edit, ArrowRightCircle, School
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
                <p className="text-slate-700 mb-6 whitespace-pre-line leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition">Batal</button>
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
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shadow-sm">
              {badgeCount}
          </span>
      )}
    </button>
  );
}

// Global Printing Helper for Student PDF
const printStudentPDF = (s) => {
  const printWindow = window.open('', '_blank');
  const installmentsHTML = s.installments?.map(ins => `
      <div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee;">
          <span style="font-weight: 700;">CICILAN ${ins.id} (${ins.dueDate})</span>
          <span style="font-weight: 900; color: ${ins.status === 'paid' ? '#059669' : '#dc2626'};">
              ${ins.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'} - Rp ${formatRupiah(ins.amount)}
          </span>
      </div>
  `).join('') || '';

  printWindow.document.write(`
    <html>
      <head>
        <title>Kartu Siswa - ${s.name}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #111; }
          .header { text-align: center; border-bottom: 5px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 26px; font-weight: 900; color: #1e40af; margin-bottom: 5px; }
          .section-title { font-size: 14px; font-weight: 900; margin: 25px 0 10px 0; border-left: 5px solid #1e40af; padding-left: 10px; text-transform: uppercase; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; }
          .box { padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
          .label { font-size: 9px; color: #64748b; font-weight: 900; text-transform: uppercase; }
          .value { font-size: 13px; font-weight: 900; margin-top: 3px; color: #0f172a; }
          .footer { margin-top: 60px; text-align: right; font-weight: 800; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header"><div class="title">BIMBEL GEMILANG</div><p style="letter-spacing: 3px; font-weight: 800;">KARTU KONTROL DATA & SPP SISWA</p></div>
        <div class="section-title">A. Biodata Peserta</div>
        <div class="grid">
          <div class="box"><div class="label">Nama Lengkap</div><div class="value">${s.name.toUpperCase()}</div></div>
          <div class="box"><div class="label">Sekolah & Kelas</div><div class="value">${s.school} (Kelas ${s.grade})</div></div>
          <div class="box"><div class="label">Program Belajar</div><div class="value">${s.level} - ${s.duration} BULAN</div></div>
          <div class="box"><div class="label">Nomor WhatsApp</div><div class="value">${s.emergencyContact}</div></div>
        </div>
        <div class="section-title">B. Data Wali Murid</div>
        <div class="grid">
          <div class="box"><div class="label">Nama Ayah</div><div class="value">${s.fatherName} (${s.fatherJob})</div></div>
          <div class="box"><div class="label">Nama Ibu</div><div class="value">${s.motherName} (${s.motherJob})</div></div>
        </div>
        ${s.notes ? `<div class="section-title">C. Catatan Khusus</div><div class="box"><div class="value">${s.notes}</div></div>` : ''}
        <div class="section-title">D. Histori Administrasi Keuangan</div>
        <div style="border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;">
          ${installmentsHTML}
        </div>
        <div class="footer"><p>Dicetak: ${new Date().toLocaleString('id-ID')}</p><br><br><p>________________________</p><p>Admin Bimbel Gemilang</p></div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

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
            list.push({ ...ins, studentName: s.name, contact: s.emergencyContact, isLate, level: s.level });
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
          <h2 className="text-blue-100 font-bold mb-1 uppercase tracking-widest text-sm">{today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</h2>
          <h1 className="text-5xl font-black font-mono tracking-wider">{today.toLocaleTimeString('id-ID')}</h1>
          <div className="flex gap-4 mt-6">
             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"><span className="block text-2xl font-black">{todayClasses.length}</span><span className="text-[10px] text-blue-50 font-black uppercase">Kelas Aktif</span></div>
             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"><span className="block text-2xl font-black text-yellow-300">{billingWarnings.length}</span><span className="text-[10px] text-blue-50 font-black uppercase">Jatuh Tempo</span></div>
          </div>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex flex-col items-center">
          <button onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} onTouchStart={startBell} onTouchEnd={stopBell} className="group relative w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer select-none border-8 border-blue-100/50">
            <div className={`p-4 rounded-full transition-all duration-100 ${bellStatus ? 'bg-orange-500 text-white scale-110 shadow-[0_0_40px_rgba(249,115,22,0.8)]' : 'bg-blue-50 text-blue-600'}`}><Bell size={44} className={bellStatus?'animate-bounce':''} /></div>
            <span className="mt-2 font-black text-slate-800 text-[10px] uppercase tracking-widest">{bellStatus ? 'LEPAS' : 'TEKAN BELL'}</span>
          </button>
        </div>
        <GraduationCap size={180} className="hidden md:block absolute right-[-20px] bottom-[-20px] opacity-10 transform rotate-12" />
      </div>

      {billingWarnings.length > 0 && (
          <div className="bg-white border-l-8 border-orange-500 p-5 rounded-2xl shadow-md flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-4">
                  <div className="bg-orange-100 text-orange-600 p-3 rounded-2xl animate-pulse shadow-sm"><Bell size={24}/></div>
                  <div>
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">Perhatian Tagihan Siswa!</h4>
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-tight">Ada {billingWarnings.length} tagihan yang butuh tindak lanjut segera.</p>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b bg-slate-50 flex items-center gap-2 font-black text-slate-800 uppercase tracking-tight text-xs"><Users size={18} className="text-blue-600"/> List Penagihan Terdekat (Minggu Ini)</div>
          <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-[10px] text-slate-600 uppercase bg-slate-100 border-b font-black tracking-widest">
                      <tr><th className="p-5">Siswa / Level</th><th className="p-5">Jatuh Tempo</th><th className="p-5">Tagihan (IDR)</th><th className="p-5 text-right">Tindakan</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {billingWarnings.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic font-black text-xs uppercase tracking-widest">Database Keuangan Bersih.</td></tr> : 
                        billingWarnings.sort((a,b) => a.level.localeCompare(b.level)).map((item, i) => (
                          <tr key={i} className={`${item.isLate ? 'bg-red-50/50' : 'bg-white'} hover:bg-slate-50 transition`}>
                              <td className="p-5">
                                  <div className="font-black text-slate-900 uppercase text-xs">{item.studentName}</div>
                                  <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-block mt-1 ${item.level === 'SD' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{item.level}</div>
                              </td>
                              <td className="p-5">
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black shadow-sm uppercase ${item.isLate ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
                                      {item.dueDate} {item.isLate ? '(TERLAMBAT)' : ''}
                                  </span>
                              </td>
                              <td className="p-5 font-mono font-black text-slate-900 text-sm">Rp {formatRupiah(item.amount)}</td>
                              <td className="p-5 text-right">
                                  <button onClick={() => sendWA(item.contact, `Halo Bapak/Ibu Wali dari ${item.studentName}, kami menginformasikan bahwa tagihan SPP sebesar Rp ${formatRupiah(item.amount)} akan segera jatuh tempo pada ${item.dueDate}. Mohon dapat dipersiapkan. Terima kasih.`)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 ml-auto hover:bg-emerald-700 transition shadow-md border-b-4 border-emerald-800 uppercase tracking-widest">
                                      <MessageCircle size={14}/> Kirim WA
                                  </button>
                              </td>
                          </tr>
                        ))
                      }
                  </tbody>
              </table>
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
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const showToast = useToast();
   
  const [formData, setFormData] = useState({
    regDate: new Date().toISOString().split('T')[0],
    name: '', school: '', grade: '',
    fatherName: '', fatherJob: '',
    motherName: '', motherJob: '',
    address: '', emergencyContact: '',
    level: 'SD', duration: '1', discount: 0, 
    regFee: 25000,
    receivedAmount: 0, promiseDate: '', paymentMethod: 'Cash',
    notes: ''
  });

  const [customInstallments, setCustomInstallments] = useState([]); // State untuk merancang cicilan manual
  const colRef = getCollection('gemilang_students');
  const financeRef = getCollection('gemilang_finance');

  useEffect(() => {
    const unsub = onSnapshot(colRef, (snap) => {
        const sorted = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setStudents(sorted);
    });
    return unsub;
  }, []);

  const filteredStudents = useMemo(() => students.filter(s => s.level === activeLevel), [students, activeLevel]);

  const calculation = useMemo(() => {
    const pricingConfig = PRICING[formData.level][formData.duration];
    const basePrice = pricingConfig.price;
    const discountAmount = (basePrice * formData.discount) / 100;
    const finalPrice = basePrice - discountAmount;
    const installmentCount = pricingConfig.installments || 1;
    const totalBill = finalPrice + Number(formData.regFee);
    const remainingAfterPaid = Math.max(0, totalBill - Number(formData.receivedAmount));
    return { basePrice, discountAmount, finalPrice, installmentCount, totalBill, remainingAfterPaid };
  }, [formData.level, formData.duration, formData.discount, formData.regFee, formData.receivedAmount]);

  // Update rancangan cicilan ketika data dasar berubah
  useEffect(() => {
    if (!isEditing && calculation.remainingAfterPaid > 0) {
      const plans = [];
      const perTerm = calculation.remainingAfterPaid / (calculation.installmentCount || 1);
      const baseDate = new Date(formData.regDate);
      
      for (let i = 0; i < calculation.installmentCount; i++) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1 + i, 1);
        plans.push({
            id: i + 1,
            dueDate: d.toISOString().split('T')[0],
            amount: Math.round(perTerm),
            status: 'unpaid'
        });
      }
      setCustomInstallments(plans);
    } else if (calculation.remainingAfterPaid === 0) {
      setCustomInstallments([]);
    }
  }, [calculation.remainingAfterPaid, calculation.installmentCount, formData.regDate, isEditing]);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const updatePlan = (idx, field, val) => {
    const newPlans = [...customInstallments];
    newPlans[idx][field] = field === 'amount' ? Number(val) : val;
    setCustomInstallments(newPlans);
  };

  const handleEditClick = (student) => {
    setFormData({
      regDate: student.regDate || '',
      name: student.name || '',
      school: student.school || '',
      grade: student.grade || '',
      fatherName: student.fatherName || '',
      fatherJob: student.fatherJob || '',
      motherName: student.motherName || '',
      motherJob: student.motherJob || '',
      address: student.address || '',
      emergencyContact: student.emergencyContact || '',
      level: student.level || 'SD',
      duration: student.duration || '1',
      discount: student.discount || 0,
      regFee: student.regFee || 25000,
      receivedAmount: 0,
      promiseDate: student.promiseDate || '',
      paymentMethod: 'Cash',
      notes: student.notes || ''
    });
    setEditingId(student.id);
    setIsEditing(true);
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    // Verifikasi total cicilan harus sama dengan sisa tagihan
    const totalPlanned = customInstallments.reduce((a, b) => a + b.amount, 0);
    if (customInstallments.length > 0 && Math.abs(totalPlanned - calculation.remainingAfterPaid) > 100) {
       return showToast("Total cicilan tidak sesuai dengan sisa tagihan!", "error");
    }

    if (isEditing) {
      await updateDoc(getDocRef('gemilang_students', editingId), { ...formData, regFee: Number(formData.regFee), discount: Number(formData.discount) });
      showToast("Profil Diperbarui!", 'success');
    } else {
      // Logic Penyimpanan: Jika dibayar lunas hari ini, status registrasi & installment langsung 'paid'
      let finalInstallments = [];
      
      // Jika ada uang muka hari ini, catat sebagai entitas pembayaran lunas
      if (Number(formData.receivedAmount) > 0) {
         finalInstallments.push({
            id: 0, // Mark sebagai Down Payment/Initial
            dueDate: formData.regDate,
            amount: Number(formData.receivedAmount),
            status: 'paid'
         });
      }

      // Masukkan rancangan cicilan masa depan
      finalInstallments = [...finalInstallments, ...customInstallments];

      const regFeePaid = Number(formData.receivedAmount) >= Number(formData.regFee);

      await addDoc(colRef, { 
        ...formData, 
        regFee: Number(formData.regFee), 
        discount: Number(formData.discount), 
        installments: finalInstallments, 
        regFeePaid: regFeePaid, 
        createdAt: new Date().toISOString() 
      });

      if (formData.receivedAmount > 0) {
        await addDoc(financeRef, { 
          type: 'in', 
          amount: Number(formData.receivedAmount), 
          description: `Pendaftaran & Awal: ${formData.name}`, 
          method: formData.paymentMethod, 
          createdAt: new Date().toISOString() 
        });
      }
      showToast("Siswa & Pembayaran Awal Tersimpan!", 'success');
    }
    setIsEditing(false); setEditingId(null); setView('list');
    setFormData({ regDate: new Date().toISOString().split('T')[0], name: '', school: '', grade: '', fatherName: '', fatherJob: '', motherName: '', motherJob: '', address: '', emergencyContact: '', level: 'SD', duration: '1', discount: 0, regFee: 25000, receivedAmount: 0, promiseDate: '', paymentMethod: 'Cash', notes: '' });
  };

  if (view === 'form') {
    return (
      <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom duration-500">
        <button onClick={() => { setView('list'); setIsEditing(false); }} className="mb-4 text-slate-800 hover:text-blue-700 flex items-center gap-2 font-black uppercase tracking-widest text-xs">&larr; Batal & Kembali</button>
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-blue-700 p-8 text-white font-black text-2xl flex items-center gap-4 shadow-lg uppercase italic tracking-tighter">
            {isEditing ? <Edit size={28}/> : <PlusCircle size={28}/>} {isEditing ? 'Update Profil Siswa' : 'Registrasi & Setup Cicilan'}
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            <section><h3 className="text-xs font-black border-b-4 border-slate-50 pb-3 mb-6 text-slate-900 uppercase tracking-widest">A. Identitas Dasar</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-1"><label className="text-[10px] font-black text-slate-500 ml-3 uppercase">Tgl Masuk</label><input type="date" name="regDate" value={formData.regDate} onChange={handleInputChange} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 focus:border-blue-500 outline-none" required /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-500 ml-3 uppercase">Nama Lengkap</label><input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 focus:border-blue-500 outline-none uppercase" required /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-500 ml-3 uppercase">Level</label><select name="level" value={formData.level} onChange={handleInputChange} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 shadow-inner"><option value="SD">SD</option><option value="SMP">SMP</option></select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-500 ml-3 uppercase">Kelas</label><input name="grade" value={formData.grade} onChange={handleInputChange} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50" required /></div></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-500 ml-3 uppercase">Sekolah Asal</label><input name="school" value={formData.school} onChange={handleInputChange} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 uppercase" required /></div><div className="md:col-span-2 space-y-1"><label className="text-[10px] font-black text-blue-600 ml-3 uppercase">Nomor WA Wali</label><input name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} placeholder="CONTOH: 0812XXX" className="w-full p-4 border-4 border-blue-50 rounded-2xl font-black bg-blue-50/30" required /></div></div></section>
            
            {!isEditing && (
              <section className="bg-slate-100 p-8 rounded-[40px] border-4 border-white shadow-inner">
                <h3 className="text-xs font-black border-b-2 border-slate-200 pb-3 mb-8 text-slate-900 uppercase tracking-widest">B. Setup Pembayaran & Cicilan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 space-y-4 shadow-sm">
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Pilih Paket</label><select name="duration" value={formData.duration} onChange={handleInputChange} className="w-full p-3 border-2 border-slate-200 rounded-xl font-black uppercase text-xs"><option value="1">Reguler (1 Bln)</option><option value="3">Paket 3 Bln</option><option value="6">Paket 6 Bln</option></select></div>
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Uang Diterima Hari Ini (Rp)</label><input type="number" name="receivedAmount" value={formData.receivedAmount} onChange={handleInputChange} className="w-full p-4 border-4 border-emerald-400 rounded-2xl text-2xl font-black text-emerald-800 bg-emerald-50 outline-none" placeholder="0" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Metode Bayar</label><select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="w-full p-3 border-2 border-slate-200 rounded-xl font-black text-xs uppercase"><option value="Cash">💵 Tunai</option><option value="Transfer">💳 Transfer</option></select></div>
                    </div>
                    <div className="p-6 bg-indigo-900 text-white rounded-3xl shadow-xl space-y-3">
                       <div className="flex justify-between items-center text-xs opacity-70 uppercase font-black"><span>Total Tagihan:</span><span>Rp {formatRupiah(calculation.totalBill)}</span></div>
                       <div className="flex justify-between items-center text-xs opacity-70 uppercase font-black"><span>Bayar Hari Ini:</span><span>- Rp {formatRupiah(formData.receivedAmount)}</span></div>
                       <div className="flex justify-between items-center text-xl font-black border-t border-white/20 pt-3 italic"><span>SISA PIUTANG:</span><span>Rp {formatRupiah(calculation.remainingAfterPaid)}</span></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase ml-2 tracking-widest">Rencana Cicilan Sisa</label>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {customInstallments.length === 0 ? (
                        <div className="p-10 border-2 border-dashed border-slate-300 rounded-3xl text-center text-slate-400 font-black uppercase text-[10px] italic tracking-widest">Lunas / Tidak Ada Cicilan</div>
                      ) : customInstallments.map((plan, i) => (
                        <div key={i} className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col gap-3">
                           <div className="flex justify-between items-center border-b pb-2"><span className="text-[10px] font-black text-indigo-600 uppercase">TERMIN #{i+1}</span><input type="date" value={plan.dueDate} onChange={(e) => updatePlan(i, 'dueDate', e.target.value)} className="text-[10px] font-black outline-none bg-slate-50 p-1 rounded border" /></div>
                           <div className="flex items-center gap-3"><span className="text-[10px] font-black text-slate-400">Rp</span><input type="number" value={plan.amount} onChange={(e) => updatePlan(i, 'amount', e.target.value)} className="flex-1 text-sm font-black outline-none border-b-2 border-slate-100 focus:border-indigo-500" /></div>
                        </div>
                      ))}
                    </div>
                    {calculation.remainingAfterPaid > 0 && <p className="text-[9px] text-orange-600 font-black uppercase text-center italic">* Pastikan total termin sama dengan sisa piutang</p>}
                  </div>
                </div>
              </section>
            )}

            <button type="submit" className={`w-full ${isEditing ? 'bg-orange-600 border-orange-800' : 'bg-blue-800 border-blue-950'} hover:opacity-90 text-white py-6 rounded-[30px] font-black shadow-2xl transition transform active:scale-95 uppercase tracking-[0.5em] text-sm border-b-8`}>
              {isEditing ? 'SIMPAN PERUBAHAN PROFIL' : 'SIMPAN DATA & JADWAL BAYAR'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={async () => { await deleteDoc(getDocRef('gemilang_students', studentToDelete.id)); setIsDeleteModalOpen(false); showToast("Siswa Terhapus.", "success"); }} title="HAPUS SISWA?" message="Seluruh data identitas dan histori pendaftaran akan hilang permanen." isDanger={true} />
      <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Database Siswa</h3><p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-2">Registration & Profiles</p></div>
          <button onClick={() => setView('form')} className="bg-blue-800 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-900 transition uppercase text-xs border-b-4 border-blue-950"><PlusCircle size={20}/> Tambah Siswa Baru</button>
      </div>

      <div className="flex bg-slate-200 p-2 rounded-2xl shadow-inner max-w-xs mx-auto">
         {['SD', 'SMP'].map(lv => (
           <button key={lv} onClick={() => setActiveLevel(lv)} className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all ${activeLevel === lv ? 'bg-white text-blue-800 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}>{lv} MODE</button>
         ))}
      </div>

      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-50 text-[11px] uppercase font-black text-slate-700 tracking-widest border-b-2 border-slate-200"><tr><th className="p-5">Siswa</th><th className="p-5">Sekolah / Kls</th><th className="p-5">Program</th><th className="p-5">Kontak</th><th className="p-5 text-right">Opsi</th></tr></thead>
              <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-blue-50 transition">
                        <td className="p-5 font-black text-slate-900 uppercase text-sm tracking-tighter">{s.name}</td>
                        <td className="p-5 text-[10px] text-slate-500 font-black uppercase">{s.school} <span className="text-blue-600 ml-1">| KLS {s.grade}</span></td>
                        <td className="p-5"><span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 uppercase">{s.duration} BLN</span></td>
                        <td className="p-5 text-[10px] text-slate-600 font-black">WA: {s.emergencyContact}</td>
                        <td className="p-5 text-right flex justify-end gap-2">
                            <button onClick={() => handleEditClick(s)} className="p-2.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition rounded-xl border border-blue-100"><Edit size={16}/></button>
                            <button onClick={() => { setStudentToDelete(s); setIsDeleteModalOpen(true); }} className="p-2.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition rounded-xl border border-rose-100"><Trash2 size={16}/></button>
                        </td>
                    </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
}

// 3.2.1 PaymentManager (Menu Baru Khusus Keuangan)
function PaymentManager() {
  const [students, setStudents] = useState([]);
  const [activeLevel, setActiveLevel] = useState('SD');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const showToast = useToast();

  useEffect(() => {
    const unsub = onSnapshot(getCollection('gemilang_students'), (snap) => {
        setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name)));
    });
    return unsub;
  }, []);

  const filteredStudents = useMemo(() => students.filter(s => s.level === activeLevel), [students, activeLevel]);
  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const handlePayInstallment = async (student, idx, method) => {
      const installment = student.installments[idx];
      const newInstallments = [...student.installments];
      newInstallments[idx].status = 'paid';
      await updateDoc(getDocRef('gemilang_students', student.id), { installments: newInstallments });
      await addDoc(getCollection('gemilang_finance'), { type: 'in', amount: installment.amount, description: `Cicilan ${student.name} (#${installment.id || idx})`, method: method, createdAt: new Date().toISOString() });
      showToast("Cicilan Lunas!", 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Manajemen Bayar</h3><p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-2">Billing & Collections</p></div>
          <div className="flex bg-slate-200 p-2 rounded-2xl shadow-inner w-full md:w-auto">
            {['SD', 'SMP'].map(lv => (
              <button key={lv} onClick={() => { setActiveLevel(lv); setSelectedStudentId(''); }} className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all ${activeLevel === lv ? 'bg-white text-indigo-700 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}>{lv}</button>
            ))}
          </div>
      </div>

      <div className="max-w-xl mx-auto space-y-2">
         <label className="text-[10px] font-black text-indigo-600 uppercase ml-3 tracking-[0.2em]">Pilih Siswa {activeLevel}</label>
         <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full p-5 border-4 border-indigo-50 bg-indigo-50/30 rounded-[25px] font-black text-slate-900 outline-none focus:border-indigo-500 transition shadow-inner uppercase tracking-tight text-center">
            <option value="">-- DAFTAR SISWA AKTIF --</option>
            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.school})</option>)}
         </select>
      </div>

      {!selectedStudent ? (
        <div className="bg-slate-200/50 border-4 border-dashed border-slate-300 rounded-[50px] p-20 text-center flex flex-col items-center justify-center space-y-4">
           <div className="w-20 h-20 bg-slate-300 rounded-full flex items-center justify-center text-slate-400"><CreditCard size={40}/></div>
           <p className="font-black text-slate-400 uppercase tracking-[0.3em] italic">Pilih Siswa Di Atas Untuk Mengelola Keuangan</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-200 rounded-[40px] p-8 shadow-2xl space-y-8 max-w-5xl mx-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b-4 border-slate-50 pb-5">
                <div>
                  <h4 className="font-black text-indigo-900 flex items-center gap-3 uppercase tracking-tighter text-xl italic leading-none"><Wallet size={28}/> Kartu Kontrol Keuangan</h4>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">{selectedStudent.name} • {selectedStudent.level} MODE</p>
                </div>
                <button onClick={() => printStudentPDF(selectedStudent)} className="bg-slate-900 text-white px-8 py-3.5 rounded-[20px] text-[11px] font-black flex items-center gap-3 hover:bg-black transition shadow-xl uppercase border-b-4 border-slate-700"><Printer size={18}/> Cetak Kartu</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl grid grid-cols-2 gap-4 shadow-inner">
                    <div className="col-span-2 border-b pb-2 mb-2 flex justify-between items-center"><label className="text-[9px] font-black text-slate-400 uppercase">Ringkasan Profil</label><span className="text-[10px] font-black text-indigo-700 italic uppercase">KLS {selectedStudent.grade}</span></div>
                    <div><label className="text-[9px] font-black text-slate-400 uppercase">Sekolah</label><div className="font-black text-slate-900 text-xs uppercase">{selectedStudent.school}</div></div>
                    <div><label className="text-[9px] font-black text-slate-400 uppercase">Kontak Wali</label><div className="font-black text-blue-700 text-sm">{selectedStudent.emergencyContact}</div></div>
                </div>
                {selectedStudent.notes && <div className="p-5 bg-amber-50 border-2 border-amber-200 rounded-3xl shadow-inner"><p className="text-[10px] font-black text-amber-700 uppercase mb-1">Catatan:</p><p className="text-xs font-bold text-slate-700 uppercase">{selectedStudent.notes}</p></div>}
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-4">Histori & Rencana Angsuran</h5>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedStudent.installments?.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map((ins, idx) => (
                      <div key={idx} className={`p-5 rounded-3xl border-2 flex justify-between items-center shadow-sm transition group ${ins.status === 'paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-indigo-400'}`}>
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase group-hover:text-indigo-600 transition">
                              {ins.id === 0 ? 'PEMBAYARAN AWAL' : `TERMIN #${ins.id}`} • {ins.dueDate}
                            </div>
                            <div className="font-black text-slate-900 text-base font-mono">Rp {formatRupiah(ins.amount)}</div>
                          </div>
                          {ins.status === 'paid' ? (
                            <div className="text-emerald-600 font-black text-xs uppercase flex items-center gap-2 italic bg-white px-4 py-1.5 rounded-full border border-emerald-200 shadow-sm"><CheckCircle size={18}/> LUNAS</div>
                          ) : (
                            <select onChange={(e) => e.target.value && handlePayInstallment(selectedStudent, idx, e.target.value)} className="text-[10px] p-2 border-2 border-slate-300 rounded-xl bg-slate-50 font-black uppercase outline-none focus:border-indigo-600 shadow-sm">
                              <option value="">💰 BAYAR</option>
                              <option value="Cash">Cash</option>
                              <option value="Transfer">Bank</option>
                            </select>
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
  const handleAdd = async (e) => { e.preventDefault(); if (!name || !subject) return; await addDoc(getCollection('gemilang_teachers'), { name, subject, createdAt: new Date().toISOString() }); setName(''); setSubject(''); showToast("Guru Tersimpan!", "success"); };
  const handleSetCode = async () => { await setDoc(getDocRef('gemilang_settings', 'attendance'), { code: attendanceCode.toUpperCase() }); showToast("PIN Absen Update!", "success"); setAttendanceCode(''); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="space-y-8">
        <div className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-200"><h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-tighter text-slate-900"><Key className="text-orange-600"/> Security Code</h3><div className="p-6 bg-orange-100/50 rounded-[25px] mb-6 text-center border-4 border-orange-200 tracking-[0.5em] font-mono text-5xl font-black text-orange-900 shadow-inner">{activeCode}</div><div className="flex gap-3"><input value={attendanceCode} onChange={e => setAttendanceCode(e.target.value.toUpperCase())} className="flex-1 p-4 border-2 border-slate-200 rounded-2xl uppercase text-center font-black text-xl shadow-inner outline-none focus:border-orange-500" placeholder="BARU" maxLength={4} /><button onClick={handleSetCode} className="bg-orange-600 text-white px-6 rounded-2xl font-black shadow-xl uppercase text-xs border-b-4 border-orange-800">SET</button></div></div>
        <div className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-200"><h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-tighter text-slate-900"><GraduationCap className="text-purple-600"/> Registrasi Guru</h3><form onSubmit={handleAdd} className="space-y-5"><input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black uppercase text-sm" placeholder="NAMA PENGAJAR" /><input value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black uppercase text-sm" placeholder="BIDANG STUDI" /><button className="w-full bg-purple-700 text-white py-5 rounded-2xl font-black shadow-2xl uppercase text-xs border-b-4 border-purple-900">Tambahkan Guru</button></form></div>
      </div>
      <div className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-200 lg:h-[650px] flex flex-col"><h3 className="font-black text-lg mb-6 uppercase italic tracking-tighter border-b-4 border-slate-50 pb-4">Database Guru Aktif</h3><div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">{teachers.map(t => (<div key={t.id} className="border-2 border-slate-100 p-4 rounded-3xl flex justify-between items-center group transition hover:border-purple-400"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700 font-black uppercase text-xl border-2 border-purple-200 shadow-inner">{t.name.charAt(0)}</div><div><h4 className="font-black text-slate-900 text-sm uppercase">{t.name}</h4><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t.subject}</p></div></div><button onClick={() => deleteDoc(getDocRef('gemilang_teachers', t.id))} className="p-3 text-slate-300 hover:text-rose-600 transition"><Trash2 size={18}/></button></div>))}</div></div>
      <div className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-200 lg:h-[650px] flex flex-col"><h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-tighter border-b-4 border-slate-50 pb-4"><Clock size={24} className="text-blue-600"/> Log Kehadiran</h3><div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">{logs.map(log => (<div key={log.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-3xl border-2 border-slate-100"><div><div className="font-black text-slate-900 text-xs uppercase">{log.teacherName}</div><div className="text-[9px] text-slate-500 font-black uppercase">{log.date}</div></div><div className="text-right font-mono font-black text-blue-700 text-sm">{log.time}</div></div>))}</div></div>
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
        if (timeToMinutes(form.startTime) >= timeToMinutes(form.endTime)) return showToast("Waktu Tidak Valid!", "error");
        const conflict = checkConflict(form);
        if (conflict) return showToast(`RUANGAN TERPAKAI!`, "error");
        await addDoc(colRef, { ...form, enrolledStudents: [] });
        showToast("Jadwal Ditambahkan!", "success");
        setView('list');
    };

    const matrixData = classes.filter(c => {
        const selectedDayName = DAYS[new Date(viewDate).getDay()];
        return (c.type === 'Regular' && c.day === selectedDayName) || (c.type === 'Booking' && c.specificDate === viewDate);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={async () => { await deleteDoc(getDocRef('gemilang_classes', deleteId)); setIsDeleteModalOpen(false); }} title="HAPUS JADWAL?" message="Permanen. Absensi terkait akan terhapus." isDanger={true} />
             {isManageStudentOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                         <div className="p-8 border-b-4 border-slate-50 flex justify-between items-center bg-slate-50 rounded-t-[40px]"><div><h3 className="font-black text-xl text-slate-900 uppercase italic leading-none">Daftar Peserta</h3><p className="text-[10px] text-blue-600 font-black uppercase mt-2">{selectedClassForStudents?.subject}</p></div><button onClick={() => setIsManageStudentOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition shadow-sm bg-white border-2 border-slate-200"><X size={24}/></button></div>
                         <div className="p-6 overflow-y-auto flex-1 bg-white custom-scrollbar"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{students.map(s => { const isSelected = tempSelectedStudents.includes(s.id); return ( <div key={s.id} onClick={() => { if(isSelected) setTempSelectedStudents(p => p.filter(id => id !== s.id)); else setTempSelectedStudents(p => [...p, s.id]); }} className={`p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition ${isSelected ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-white border-slate-100'}`}><div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition shadow-inner ${isSelected ? 'bg-blue-700 border-blue-700 text-white' : 'border-slate-200 bg-slate-50'}`}>{isSelected && <CheckCircle size={18} strokeWidth={3}/>}</div><div><div className="font-black text-xs text-slate-900 uppercase">{s.name}</div><div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">KLS {s.grade} • {s.level}</div></div></div> ) })}</div></div>
                         <div className="p-6 border-t-4 border-slate-50 bg-slate-50 rounded-b-[40px] flex justify-between items-center shadow-inner"><span className="text-[10px] font-black text-slate-900 uppercase bg-white px-5 py-2.5 rounded-full border-2 border-slate-200">{tempSelectedStudents.length} SISWA TERPILIH</span><button onClick={async () => { await updateDoc(getDocRef('gemilang_classes', selectedClassForStudents.id), { enrolledStudents: tempSelectedStudents }); setIsManageStudentOpen(false); showToast("Siswa Diupdate!", "success"); }} className="bg-blue-800 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-900 shadow-xl uppercase text-[10px] border-b-4 border-blue-950">Simpan</button></div>
                    </div>
                 </div>
             )}
             <div className="flex justify-between items-center bg-white p-7 rounded-3xl shadow-sm border border-slate-200"><div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Penempatan Ruang</h3><p className="text-[10px] text-slate-500 font-black uppercase mt-2 tracking-[0.4em]">Room Management System</p></div><button onClick={() => setView(view === 'list' ? 'form' : 'list')} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg border-b-4 ${view === 'list' ? 'bg-blue-800 text-white border-blue-950' : 'bg-slate-200 text-slate-800 border-slate-300'}`}>{view === 'list' ? 'Tambah Jadwal' : 'Batal'}</button></div>
             {view === 'form' && (
                 <div className="bg-white p-10 rounded-[40px] shadow-2xl border-2 border-blue-50 animate-in zoom-in-95">
                     <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 p-5 bg-slate-100 rounded-[30px] border-4 border-white flex gap-5 shadow-inner"><button type="button" onClick={() => setForm({...form, type: 'Regular'})} className={`flex-1 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition ${form.type === 'Regular' ? 'bg-blue-800 text-white shadow-2xl border-b-4 border-blue-950' : 'bg-white border-2 border-slate-200 text-slate-500'}`}>Rutin (Mingguan)</button><button type="button" onClick={() => setForm({...form, type: 'Booking'})} className={`flex-1 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition ${form.type === 'Booking' ? 'bg-purple-800 text-white shadow-2xl border-b-4 border-purple-950' : 'bg-white border-2 border-slate-200 text-slate-500'}`}>Khusus (Tanggal)</button></div>
                        <div className="space-y-2"><label className="block text-[10px] font-black text-slate-600 mb-1 uppercase ml-3">Pilih Hari/Tgl</label>{form.type === 'Regular' ? (<select value={form.day} onChange={e => setForm({...form, day: e.target.value})} className="w-full p-4 border-2 border-slate-200 rounded-2xl bg-slate-50 font-black uppercase focus:border-blue-600">{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>) : (<input type="date" value={form.specificDate} onChange={e => setForm({...form, specificDate: e.target.value})} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 focus:border-blue-600 shadow-inner" required />)}</div>
                        <div className="space-y-2"><label className="block text-[10px] font-black text-slate-600 mb-1 uppercase ml-3">Pilih Ruangan</label><select value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 uppercase">{ROOMS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                        <div className="flex gap-6"><div className="flex-1 space-y-2"><label className="block text-[10px] font-black text-slate-600 mb-1 uppercase ml-3">Mulai</label><input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 focus:border-blue-600 shadow-inner" required /></div><div className="flex-1 space-y-2"><label className="block text-[10px] font-black text-slate-600 mb-1 uppercase ml-3">Selesai</label><input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 focus:border-blue-600 shadow-inner" required /></div></div>
                        <div className="space-y-2"><label className="block text-[10px] font-black text-slate-600 mb-1 uppercase ml-3">Mata Pelajaran</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="CONTOH: MATEMATIKA" className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 uppercase focus:border-blue-600 text-sm shadow-inner" required /></div>
                        <div className="md:col-span-2 space-y-2"><label className="block text-[10px] font-black text-slate-600 mb-1 uppercase ml-3">PIC Pengajar</label><select value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-black bg-slate-50 uppercase focus:border-blue-600" required><option value="">-- PILIH GURU --</option>{teachers.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <button className="md:col-span-2 w-full bg-blue-800 text-white py-6 rounded-3xl font-black shadow-2xl hover:bg-blue-900 transition transform active:scale-95 uppercase tracking-[0.3em] text-sm border-b-8 border-blue-950">Simpan Jadwal</button>
                     </form>
                 </div>
             )}
             <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b-4 border-slate-50 bg-slate-50/50 flex justify-between items-center"><h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-sm flex items-center gap-3 leading-none"><Map size={24} className="text-blue-600"/> Monitor Kapasitas Ruangan</h3><div className="bg-white p-3 border-2 border-slate-200 rounded-2xl flex items-center gap-4 text-xs font-black"><span className="text-slate-500 uppercase">TAMPILKAN TANGGAL:</span><input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="outline-none text-blue-800 uppercase" /></div></div>
                <div className="overflow-x-auto p-6"><div className="grid grid-cols-5 gap-6 min-w-[1200px]">{ROOMS.map(room => (<div key={room} className="bg-white rounded-[32px] border-2 border-slate-100 flex flex-col h-[700px] shadow-lg overflow-hidden"><div className="p-5 bg-slate-900 text-white text-center font-black text-xs rounded-t-[30px] uppercase tracking-[0.3em] border-b-8 border-blue-700 shadow-xl">{room}</div><div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">{matrixData.filter(c => c.room === room).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(c => (<div key={c.id} className={`p-5 rounded-[25px] border-2 shadow-sm transition-all duration-300 ${c.type === 'Booking' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}><div className="flex justify-between items-start mb-3"><span className="text-[10px] font-black bg-white/90 px-3 py-1 rounded-xl text-slate-900 border-2 border-slate-100 shadow-sm">{c.startTime}</span><div className="flex gap-1.5"><button onClick={() => { setSelectedClassForStudents(c); setTempSelectedStudents(c.enrolledStudents || []); setIsManageStudentOpen(true); }} className="text-blue-700 bg-white p-2 rounded-xl border-2 border-blue-100 shadow-sm"><Users size={14} strokeWidth={3}/></button><button onClick={() => { setDeleteId(c.id); setIsDeleteModalOpen(true); }} className="text-rose-600 bg-white p-2 rounded-xl border-2 border-rose-100 shadow-sm"><Trash2 size={14} strokeWidth={3}/></button></div></div><div className="font-black text-sm text-slate-900 uppercase italic leading-none tracking-tighter mb-4">{c.subject}</div><div className="text-[10px] text-slate-800 font-black mt-2 flex items-center gap-2 uppercase border-t-2 border-slate-100 pt-3"><User size={12} className="text-blue-700"/> {c.pic}</div><div className="text-[9px] text-slate-500 font-black uppercase mt-2 flex items-center gap-2"><ListChecks size={12}/> {c.enrolledStudents?.length || 0} Siswa</div></div>))}{matrixData.filter(c => c.room === room).length === 0 && (<div className="h-full flex items-center justify-center text-slate-200 text-[11px] italic font-black uppercase tracking-[0.4em] transform -rotate-90">KOSONG</div>)}</div></div>))}</div></div>
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
  const [isTxDeleteModalOpen, setIsTxDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    const unsubF = onSnapshot(getCollection('gemilang_finance'), (snap) => setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt.localeCompare(a.createdAt))));
    const unsubS = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubF(); unsubS(); };
  }, []);

  const executeDeleteTx = async () => {
    if(!txToDelete) return;
    await deleteDoc(getDocRef('gemilang_finance', txToDelete.id));
    setIsTxDeleteModalOpen(false);
    showToast("Catatan Mutasi Terhapus.", "success");
  };

  const cashIn = finances.filter(f => f.type === 'in' && f.method === 'Cash').reduce((a, b) => a + b.amount, 0);
  const cashOut = finances.filter(f => f.type === 'out' && f.method === 'Cash').reduce((a, b) => a + b.amount, 0);
  const bankIn = finances.filter(f => f.type === 'in' && f.method === 'Transfer').reduce((a, b) => a + b.amount, 0);
  const bankOut = finances.filter(f => f.type === 'out' && f.method === 'Transfer').reduce((a, b) => a + b.amount, 0);
  const totalReceivable = useMemo(() => { let t = 0; students.forEach(s => s.installments?.forEach(i => { if(i.status === 'unpaid') t += i.amount; })); return t; }, [students]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmModal isOpen={isTxDeleteModalOpen} onClose={() => setIsTxDeleteModalOpen(false)} onConfirm={executeDeleteTx} title="HAPUS MUTASI?" message="Hapus histori mutasi ini? Saldo akan dikalkulasi ulang." isDanger={true} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-7 rounded-[40px] shadow-2xl border-b-[10px] border-blue-700 relative overflow-hidden group"><div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:rotate-45 transition duration-500"><PieChart size={100}/></div><p className="text-slate-400 text-[11px] uppercase font-black tracking-[0.3em] mb-2 relative z-10">Total Saldo Terpadu</p><h3 className="text-4xl font-black font-mono relative z-10">Rp {formatRupiah((cashIn + bankIn) - (cashOut + bankOut))}</h3></div>
        <div className="bg-white p-7 rounded-[40px] shadow-sm border-2 border-emerald-100 hover:border-emerald-500 transition-all cursor-default group"><div className="flex justify-between items-start mb-3"><p className="text-emerald-700 text-[10px] font-black uppercase tracking-[0.3em]">Saldo Tunai</p><Wallet className="text-emerald-600 group-hover:scale-125 transition" size={24}/></div><h3 className="text-3xl font-black text-slate-900 font-mono tracking-tighter">Rp {formatRupiah(cashIn - cashOut)}</h3></div>
        <div className="bg-white p-7 rounded-[40px] shadow-sm border-2 border-blue-100 hover:border-blue-500 transition-all cursor-default group"><div className="flex justify-between items-start mb-3"><p className="text-blue-700 text-[10px] font-black uppercase tracking-[0.3em]">Saldo Rekening</p><Landmark className="text-blue-600 group-hover:scale-125 transition" size={24}/></div><h3 className="text-3xl font-black text-slate-900 font-mono tracking-tighter">Rp {formatRupiah(bankIn - bankOut)}</h3></div>
        <div className="bg-white p-7 rounded-[40px] shadow-sm border-2 border-orange-100 hover:border-orange-500 transition-all cursor-default group"><p className="text-orange-700 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Tanggungan Piutang</p><h3 className="text-3xl font-black text-slate-900 font-mono tracking-tighter">Rp {formatRupiah(totalReceivable)}</h3></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="bg-white p-8 rounded-[40px] shadow-xl h-fit border border-slate-200">
            <h3 className="font-black text-xl mb-8 flex items-center gap-3 text-slate-900 uppercase tracking-tighter border-b-4 border-slate-50 pb-5 italic leading-none"><DollarSign className="text-blue-600" size={28}/> Input Kas Baru</h3>
            <form onSubmit={async (e) => { e.preventDefault(); if(!amount || !desc) return; await addDoc(getCollection('gemilang_finance'), { type, amount: parseInt(amount), description: desc, method, createdAt: new Date().toISOString() }); setAmount(''); setDesc(''); showToast("Data Kas Tersimpan!", "success"); }} className="space-y-6">
                <div className="flex gap-3 p-2 bg-slate-100 rounded-3xl shadow-inner border-2 border-slate-200"><button type="button" onClick={() => setType('in')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition transform ${type === 'in' ? 'bg-emerald-600 text-white shadow-2xl scale-105 border-b-4 border-emerald-800' : 'text-slate-500 hover:text-slate-800'}`}>Pemasukan</button><button type="button" onClick={() => setType('out')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition transform ${type === 'out' ? 'bg-rose-600 text-white shadow-2xl scale-105 border-b-4 border-rose-800' : 'text-slate-500 hover:text-slate-800'}`}>Pengeluaran</button></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase ml-4 tracking-[0.3em]">Nominal (Rp)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-5 border-4 border-slate-100 rounded-[25px] outline-none font-black text-slate-900 bg-slate-50 focus:border-blue-600 text-3xl shadow-inner font-mono tracking-tighter" required /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase ml-4 tracking-[0.3em]">Perihal</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-4 border-2 border-slate-200 rounded-2xl outline-none font-black text-slate-900 bg-slate-50 focus:border-blue-600 uppercase text-xs shadow-inner" required /></div>
                <button className={`w-full py-6 rounded-[30px] font-black text-white shadow-2xl transition transform active:scale-95 uppercase tracking-[0.3em] text-xs border-b-8 ${type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-900' : 'bg-rose-600 hover:bg-rose-700 border-rose-900'}`}>SIMPAN KE BUKU</button>
            </form>
        </div>
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 flex flex-col"><h3 className="font-black text-xl mb-6 text-slate-900 uppercase border-b-4 border-slate-50 pb-5 italic leading-none tracking-tighter">Log 10 Mutasi Terakhir</h3><div className="space-y-3 mt-4 overflow-y-auto custom-scrollbar flex-1 pr-2">{finances.slice(0, 10).map(f => (<div key={f.id} className="group flex justify-between items-center p-5 border-2 border-slate-50 rounded-[25px] hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"><div className="flex items-center gap-5"><div className={`p-4 rounded-2xl shadow-inner border-2 ${f.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{f.type === 'in' ? <TrendingUp size={24} strokeWidth={3}/> : <TrendingDown size={24} strokeWidth={3}/>}</div><div><div className="font-black text-sm text-slate-900 uppercase tracking-tight leading-none">{f.description}</div><div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">{new Date(f.createdAt).toLocaleDateString('id-ID')} | {f.method}</div></div></div><div className="flex items-center gap-6"><span className={`font-mono font-black text-lg tracking-tighter ${f.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}`}>{f.type === 'in' ? '+' : '-'} {formatRupiah(f.amount)}</span><button onClick={() => { setTxToDelete(f); setIsTxDeleteModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 hover:text-rose-600 transition-all rounded-xl border-2 border-transparent hover:border-rose-100"><Trash2 size={18}/></button></div></div>))}</div></div>
      </div>
    </div>
  );
}

// 3.6 AttendanceReportManager
function AttendanceReportManager() {
  const [students, setStudents] = useState([]);
  const [activeLevel, setActiveLevel] = useState('SD');
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const showToast = useToast();

  useEffect(() => {
    const unsubStudents = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubAttendance = onSnapshot(getCollection('gemilang_class_attendance'), (snap) => setAttendanceLogs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubStudents(); unsubAttendance(); };
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.level === activeLevel && s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [students, searchQuery, activeLevel]);

  const printAttendancePDF = (s) => {
    const logs = attendanceLogs.filter(log => log.studentId === s.id).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    const stats = { Hadir: logs.filter(l => l.status === 'Hadir').length, Ijin: logs.filter(l => l.status === 'Ijin').length, Alpha: logs.filter(l => l.status === 'Alpha').length };
    const rowsHTML = logs.map((log, i) => `<tr><td style="text-align: center;">${i + 1}</td><td>${log.date}</td><td>${log.className}</td><td>${log.teacherName}</td><td style="font-weight: 900; color: ${log.status === 'Hadir' ? '#059669' : log.status === 'Ijin' ? '#d97706' : '#dc2626'}; text-transform: uppercase;">${log.status}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #999; font-weight: 900; text-transform: uppercase;">Belum ada riwayat absensi masuk.</td></tr>';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Report - ${s.name}</title><style>body { font-family: sans-serif; padding: 50px; color: #000; line-height: 1.4; }.header { text-align: center; border-bottom: 5px solid #7c3aed; padding-bottom: 25px; margin-bottom: 40px; }.title { font-size: 32px; font-weight: 900; color: #7c3aed; text-transform: uppercase; }.student-info { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 40px; background: #f9fafb; padding: 30px; border-radius: 30px; border: 3px solid #e5e7eb; }.label { color: #6b7280; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }.value { font-weight: 900; font-size: 16px; text-transform: uppercase; margin-top: 5px; color: #111; }table { width: 100%; border-collapse: collapse; margin-top: 30px; }th { background: #111827; color: white; padding: 18px; font-size: 11px; text-transform: uppercase; text-align: left; }td { padding: 18px; font-size: 13px; border-bottom: 2px solid #f3f4f6; font-weight: 800; }.stats { display: flex; gap: 20px; margin-top: 30px; }.stat-box { flex: 1; padding: 20px; border-radius: 20px; text-align: center; color: white; font-weight: 900; text-transform: uppercase; font-size: 14px; }.hadir { background: #059669; } .ijin { background: #d97706; } .alpha { background: #dc2626; }.footer { margin-top: 80px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; border-top: 2px dashed #eee; pt: 30px; }</style></head><body><div class="header"><div class="title">BIMBEL GEMILANG</div><p style="font-weight: 900; letter-spacing: 5px; margin-top: 10px; font-size: 14px;">LAPORAN KEHADIRAN & AKTIVITAS SISWA</p></div><div class="student-info"><div><div class="label">Peserta Didik</div><div class="value">${s.name}</div></div><div><div class="label">Sekolah & Kelas</div><div class="value">${s.school} (Kls ${s.grade})</div></div><div><div class="label">Program Paket</div><div class="value">${s.level} - ${s.duration} Bln</div></div><div><div class="label">Tanggal Laporan</div><div class="value">${new Date().toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}</div></div></div><div class="stats"><div class="stat-box hadir">Hadir: ${stats.Hadir}</div><div class="stat-box ijin">Ijin: ${stats.Ijin}</div><div class="stat-box alpha">Alpha: ${stats.Alpha}</div></div><table><thead><tr><th width="5%">No</th><th width="20%">Tanggal</th><th width="35%">Mata Pelajaran</th><th width="25%">Guru / Mentor</th><th width="15%">Status</th></tr></thead><tbody>${rowsHTML}</tbody></table><div class="footer"><div>Gemilang System v2.6 <br> Integrated Cloud Services</div><div style="text-align: center;">Mengesahkan,<br><br><br><br><br>(____________________)<br>Kepala Cabang</div></div><script>window.onload = function() { window.print(); window.close(); }</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Laporan Presensi</h3><p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Attendance Report Center</p></div>
        <div className="relative w-full md:w-[450px] group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition" size={24} /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="CARI NAMA..." className="w-full pl-14 pr-4 py-5 border-4 border-slate-100 rounded-[25px] focus:ring-8 focus:ring-purple-100 focus:border-purple-600 outline-none transition font-black text-slate-900 shadow-inner text-sm uppercase tracking-tight" /></div>
      </div>

      <div className="flex bg-slate-200 p-2 rounded-2xl shadow-inner max-w-xs mx-auto">
         {['SD', 'SMP'].map(lv => (
           <button key={lv} onClick={() => setActiveLevel(lv)} className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all ${activeLevel === lv ? 'bg-white text-purple-800 shadow-md scale-105' : 'text-slate-500 hover:text-slate-900'}`}>{lv}</button>
         ))}
      </div>

      <div className="bg-white rounded-[40px] shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"><tr><th className="p-6">Peserta</th><th className="p-6 text-center">Sesi Belajar</th><th className="p-6 text-right">Opsi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(s => {
                const logsCount = attendanceLogs.filter(l => l.studentId === s.id).length;
                return (
                  <tr key={s.id} className="hover:bg-purple-50/50 transition">
                    <td className="p-6 font-black text-slate-900 uppercase leading-none italic"><div className="text-[14px]">{s.name}</div><div className="text-[9px] text-slate-400 mt-2">{s.school}</div></td>
                    <td className="p-6 text-center"><span className="bg-purple-600 text-white px-5 py-2 rounded-2xl text-[10px] uppercase font-black">{logsCount} Sesi</span></td>
                    <td className="p-6 text-right"><button onClick={() => printAttendancePDF(s)} className="bg-white text-purple-700 px-6 py-3 rounded-2xl text-[10px] font-black flex items-center gap-3 ml-auto hover:bg-purple-600 hover:text-white transition shadow-md uppercase tracking-[0.1em] border-2 border-purple-200"><Printer size={16}/> Laporan</button></td>
                  </tr>
                );
              })}
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
    <div className="max-w-xl mx-auto bg-white p-10 rounded-[45px] shadow-2xl border-2 border-slate-50 animate-in fade-in duration-500">
       <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-slate-900 uppercase italic tracking-tighter border-b-4 border-slate-50 pb-6 leading-none"><Lock className="text-blue-700" size={32}/> PIN Keamanan Admin</h3>
       <div className="space-y-8">
         <div className="space-y-3">
           <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.3em] ml-2">Ganti PIN Akses</label>
           <div className="flex gap-4"><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="flex-1 p-5 border-4 border-slate-100 rounded-[30px] outline-none font-black text-slate-900 bg-slate-50 focus:border-blue-600 shadow-inner tracking-[0.5em] text-center text-2xl" placeholder="••••••" /><button onClick={async () => { if(!newPass) return; await setDoc(getDocRef('gemilang_settings', 'admin_auth'), { password: newPass }); showToast("PIN Diupdate!", 'success'); setNewPass(''); }} className="bg-blue-800 text-white px-10 py-5 rounded-[25px] font-black hover:bg-blue-900 transition shadow-2xl uppercase border-b-4 border-blue-950 leading-none">Update</button></div>
         </div>
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
    <div className={`flex h-screen bg-slate-100 font-sans overflow-hidden transition-all ${displayMode === 'hp' ? 'max-w-[430px] mx-auto border-x-[12px] border-slate-900 shadow-2xl' : 'w-full'}`}>
      <aside className={`${displayMode === 'hp' ? 'w-16' : 'w-20 md:w-64'} bg-slate-900 text-white flex flex-col shadow-2xl z-20 shrink-0 border-r border-slate-800`}>
        <div className={`p-4 ${displayMode === 'hp' ? '' : 'md:p-8'} border-b border-slate-800 flex items-center gap-4 bg-slate-900/50`}>
          <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl border-2 border-blue-400 transition hover:rotate-12 transform"><GraduationCap size={28} className="text-white" /></div>
          <div className={`${displayMode === 'hp' ? 'hidden' : 'hidden md:block'}`}><h1 className="font-black text-xl tracking-tighter uppercase leading-none italic">GEMILANG</h1><p className="text-[9px] text-slate-500 uppercase tracking-[0.4em] font-black mt-2">V2.6 CLOUD</p></div>
        </div>
        <nav className="flex-1 py-8 space-y-3 overflow-y-auto px-3 custom-scrollbar">
          <MenuButton id="home" icon={<LayoutDashboard size={22}/>} label="DASHBOARD UTAMA" active={activeTab} set={setActiveTab} badgeCount={overdueCount} />
          <MenuButton id="students" icon={<Users size={22}/>} label="DATABASE SISWA" active={activeTab} set={setActiveTab} />
          <MenuButton id="payments" icon={<Wallet size={22}/>} label="MANAJEMEN BAYAR" active={activeTab} set={setActiveTab} />
          <MenuButton id="attendance_report" icon={<ClipboardCheck size={22}/>} label="LAPORAN ABSEN" active={activeTab} set={setActiveTab} />
          <MenuButton id="finance" icon={<DollarSign size={22}/>} label="BUKU KAS" active={activeTab} set={setActiveTab} />
          <MenuButton id="teachers" icon={<Briefcase size={22}/>} label="TENAGA PENGAJAR" active={activeTab} set={setActiveTab} />
          <MenuButton id="classes" icon={<Calendar size={22}/>} label="RUANG BELAJAR" active={activeTab} set={setActiveTab} />
          <div className="pt-8 mt-8 border-t border-slate-800">
            <MenuButton id="settings" icon={<Settings size={22}/>} label="SECURITY PIN" active={activeTab} set={setActiveTab} />
            <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 text-rose-500 hover:bg-rose-500/10 transition-all mt-3 rounded-2xl group border-2 border-transparent hover:border-rose-500/20 shadow-sm leading-none">
              <LogOut size={22} className="group-hover:translate-x-2 transition" /> <span className={`${displayMode === 'hp' ? 'hidden' : 'hidden md:inline'} font-black text-[11px] text-left uppercase tracking-[0.2em]`}>Keluar Sesi</span>
            </button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto relative bg-[#f4f7fa] scroll-smooth custom-scrollbar">
        <div className="p-4 md:p-12 w-full max-w-[1920px] mx-auto"> 
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
        showToast(`Absen Diterima!`, 'success');
        setAttendanceCode('');
    } else { showToast("Kode Salah!", 'error'); }
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] font-sans transition-all ${displayMode === 'hp' ? 'max-w-[430px] mx-auto border-x-[12px] border-slate-900 shadow-2xl' : 'w-full'}`}>
      <div className="bg-purple-800 text-white p-7 shadow-xl border-b-8 border-purple-900">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div><h1 className="text-2xl font-black uppercase italic leading-none">GEMILANG</h1><p className="text-purple-200 text-[10px] font-black mt-2 uppercase tracking-widest">{teacherName}</p></div>
          <div className="flex gap-3">
              <button onClick={() => setActiveView('home')} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase ${activeView === 'home' ? 'bg-white text-purple-800 shadow-lg' : 'bg-purple-700'}`}>Beranda</button>
              <button onClick={() => setActiveView('attendance')} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase ${activeView === 'attendance' ? 'bg-white text-purple-800 shadow-lg' : 'bg-purple-700'}`}>Absen</button>
              <button onClick={onLogout} className="p-3 bg-rose-600 rounded-2xl shadow-xl leading-none"><LogOut size={18}/></button>
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto p-6 space-y-10">
        {activeView === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-left duration-300">
                <div className="bg-white rounded-[50px] p-12 text-center flex flex-col justify-center border-4 border-purple-100 shadow-xl">
                    <div className="text-7xl font-mono font-black text-slate-900 mb-10 tracking-widest leading-none italic">{time.toLocaleTimeString('id-ID')}</div>
                    <form onSubmit={handleAbsen} className="max-w-xs mx-auto space-y-6 w-full">
                        <input type="text" value={attendanceCode} onChange={e => setAttendanceCode(e.target.value.toUpperCase())} className="w-full text-center text-6xl font-black p-8 border-4 border-slate-100 rounded-[35px] uppercase focus:border-purple-600 outline-none bg-slate-50 shadow-inner" placeholder="0000" maxLength={4} />
                        <button className="w-full bg-purple-700 text-white py-8 rounded-[35px] font-black shadow-2xl uppercase tracking-[0.4em] text-sm border-b-8 border-purple-900">ABSEN MASUK</button>
                    </form>
                </div>
                <div className="bg-white rounded-[50px] p-10 border border-slate-200 h-[550px] flex flex-col shadow-xl overflow-hidden">
                    <h3 className="font-black mb-8 flex items-center gap-4 text-slate-900 uppercase italic text-xl border-b-4 pb-4 leading-none"><Clock size={28} className="text-purple-600"/> Riwayat Absen</h3>
                    <div className="overflow-y-auto flex-1 space-y-4 pr-3 custom-scrollbar mt-2">{history.map(h => (<div key={h.id} className="p-6 bg-slate-50 rounded-[28px] flex justify-between items-center border-2 border-slate-100 shadow-inner"><span className="text-xs font-black text-slate-900 uppercase">{h.date}</span><span className="font-mono font-black text-purple-800 text-lg leading-none">{h.time}</span></div>))}</div>
                </div>
            </div>
        )}
        {activeView === 'attendance' && (
            <div className="bg-white rounded-[50px] p-10 border border-slate-200 animate-in slide-in-from-right duration-300 shadow-2xl min-h-[700px]">
                {!selectedClassForAttendance ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myClasses.map(c => (<div key={c.id} onClick={() => setSelectedClassForAttendance(c)} className="border-4 border-slate-50 p-8 rounded-[35px] hover:border-purple-500 hover:shadow-2xl cursor-pointer transition-all bg-white shadow-xl group flex flex-col justify-between relative overflow-hidden"><div className="absolute right-[-20px] top-[-20px] opacity-5 group-hover:rotate-12 transition"><ClipboardCheck size={120}/></div><div className="mb-6 relative z-10"><h4 className="font-black text-2xl text-slate-900 group-hover:text-purple-800 uppercase italic leading-none tracking-tighter">{c.subject}</h4><div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-[10px] font-black bg-purple-100 text-purple-800 px-4 py-1.5 rounded-xl uppercase shadow-sm border border-purple-200 leading-none">{c.room}</span><span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 leading-none">{c.startTime} WIB</span></div></div><div className="pt-6 border-t-2 border-slate-50 flex items-center justify-between relative z-10"><span className="text-xs font-black text-slate-900 uppercase">PESERTA: {c.enrolledStudents?.length || 0}</span><div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center border-2 border-purple-100 group-hover:bg-purple-800 group-hover:text-white transition shadow-sm transform group-hover:rotate-12"><CheckCircle size={20} strokeWidth={3}/></div></div></div>))}
                        {myClasses.length === 0 && <div className="text-center py-40 text-slate-300 font-black uppercase flex flex-col items-center gap-5 w-full"><Calendar size={64} className="opacity-20"/> Tidak Ada Jadwal</div>}
                    </div>
                ) : (
                    <div className="space-y-10 max-w-4xl mx-auto">
                        <div className="flex justify-between items-center pb-8 border-b-4 border-slate-50"><div><h3 className="font-black text-4xl text-slate-900 uppercase italic leading-none tracking-tighter">{selectedClassForAttendance.subject}</h3><p className="text-[12px] text-slate-400 font-black uppercase mt-3 bg-slate-100 inline-block px-4 py-1.5 rounded-full">Database Absensi Siswa</p></div><button onClick={() => setSelectedClassForAttendance(null)} className="p-5 bg-white rounded-3xl hover:bg-slate-100 shadow-2xl border-4 border-slate-50"><X size={32}/></button></div>
                        <div className="space-y-5">{selectedClassForAttendance.enrolledStudents?.map(sid => { const s = students.find(st => st.id === sid); if(!s) return null; return (<div key={sid} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-slate-50 rounded-[35px] gap-8 border-2 border-slate-100 shadow-sm transition group hover:scale-[1.01]"><div className="font-black text-slate-900 uppercase tracking-tight text-xl leading-none italic">{s.name} <span className={`text-[10px] ml-3 px-3 py-1 rounded-full font-black ${s.level === 'SD' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>{s.level}</span></div><div className="flex gap-3 p-2 bg-white rounded-[25px] border-4 border-slate-100 shadow-inner">{['Hadir', 'Ijin', 'Alpha'].map(st => (<button key={st} onClick={() => setAttendanceStatuses(p => ({...p, [sid]: st}))} className={`px-8 py-4 rounded-[20px] text-[11px] font-black transition-all transform active:scale-90 uppercase tracking-widest ${attendanceStatuses[sid] === st ? (st === 'Hadir' ? 'bg-emerald-600 text-white shadow-2xl scale-105 border-b-4 border-emerald-800' : st === 'Ijin' ? 'bg-amber-600 text-white shadow-2xl scale-105 border-b-4 border-amber-800' : 'bg-rose-600 text-white shadow-2xl scale-105 border-b-4 border-rose-800') : 'bg-transparent text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}>{st}</button>))}</div></div>); })}</div>
                        <button onClick={async () => { if(Object.keys(attendanceStatuses).length < selectedClassForAttendance.enrolledStudents.length) return showToast("Absen belum lengkap!", "error"); const todayStr = new Date().toLocaleDateString('id-ID'); const promises = Object.keys(attendanceStatuses).map(sid => addDoc(getCollection('gemilang_class_attendance'), { classId: selectedClassForAttendance.id, className: selectedClassForAttendance.subject, studentId: sid, status: attendanceStatuses[sid], date: todayStr, teacherName, timestamp: new Date().toISOString() })); await Promise.all(promises); showToast("Selesai!", "success"); setSelectedClassForAttendance(null); setAttendanceStatuses({}); }} className="w-full bg-emerald-600 text-white py-8 rounded-[35px] font-black shadow-2xl hover:bg-emerald-700 transition transform active:scale-95 tracking-[0.4em] text-sm uppercase border-b-8 border-emerald-900 leading-none">VERIFIKASI KE SERVER</button>
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
    const unsubT = onSnapshot(getCollection('gemilang_teachers'), (snap) => setTeachers(snap.docs.map(d => d.data().name)));
    const unsubP = onSnapshot(getDocRef('gemilang_settings', 'admin_auth'), (snap) => { if(snap.exists() && snap.data().password) setRealAdminPass(snap.data().password); });
    return () => { unsubT(); unsubP(); };
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] font-sans p-4 animate-in fade-in duration-700 overflow-hidden relative">
      <div className="absolute top-10 opacity-5 font-black text-white text-[150px] leading-none select-none italic pointer-events-none uppercase tracking-tighter">GEMILANG</div>
      <div className={`bg-white p-12 rounded-[60px] shadow-[0_45px_100px_-20px_rgba(0,0,0,0.7)] border-[12px] border-white/10 relative animate-in zoom-in-95 duration-500 transition-all z-10 ${displayMode === 'hp' ? 'w-[430px]' : displayMode === 'pc' ? 'w-full max-w-6xl' : 'w-full max-w-xl md:max-w-3xl'}`}>
        <div className="text-center mb-12 mt-2"><div className="w-28 h-28 bg-blue-800 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-2xl text-white transform hover:rotate-12 transition duration-500 border-b-[10px] border-blue-950"><GraduationCap size={56} strokeWidth={2.5} /></div><h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic drop-shadow-sm">Bimbel Gemilang</h1><p className="text-slate-500 text-[12px] font-black uppercase tracking-[0.6em] mt-5 bg-slate-100 inline-block px-6 py-2.5 rounded-full border-2 border-slate-200 shadow-inner">Smart Management v2.6</p></div>
        <div className="flex bg-slate-200 p-2.5 rounded-[30px] mb-10 shadow-inner border-2 border-slate-100"><button onClick={() => setView('admin')} className={`flex-1 py-5 rounded-[22px] text-[12px] font-black transition-all uppercase tracking-[0.2em] transform ${view === 'admin' ? 'bg-white shadow-2xl text-blue-900 scale-105 border-b-4 border-blue-100' : 'text-slate-500 hover:text-slate-900'}`}>Administrator</button><button onClick={() => setView('guru')} className={`flex-1 py-5 rounded-[22px] text-[12px] font-black transition-all uppercase tracking-[0.2em] transform ${view === 'guru' ? 'bg-white shadow-2xl text-purple-900 scale-105 border-b-4 border-purple-100' : 'text-slate-500 hover:text-slate-900'}`}>Staff Pengajar</button></div>
        <form onSubmit={(e) => { e.preventDefault(); if(view === 'admin') { if(password === realAdminPass) onLogin('admin'); else showToast("Sandi Salah!", 'error'); } else { if(!selectedTeacher) return showToast("Pilih Identitas!", 'error'); onLogin('teacher', selectedTeacher); } }} className="space-y-8">
          {view === 'admin' ? (<div className="space-y-3"><label className="block text-[11px] font-black text-slate-800 mb-1 uppercase tracking-[0.4em] ml-4">PIN Keamanan Admin</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-6 border-4 border-slate-100 rounded-[35px] focus:ring-[12px] focus:ring-blue-100 focus:border-blue-800 outline-none transition text-3xl font-black text-slate-900 bg-slate-50 shadow-inner tracking-[0.6em] text-center font-mono leading-none" placeholder="••••••" /></div>) : 
            (<div className="space-y-3"><label className="block text-[11px] font-black text-slate-800 mb-1 uppercase tracking-[0.4em] ml-4">Pilih Identitas</label><select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="w-full p-6 border-4 border-slate-100 rounded-[35px] bg-slate-50 font-black text-slate-900 outline-none text-xl transition focus:border-purple-700 shadow-inner uppercase cursor-pointer"><option value="">-- STAFF PENGAJAR --</option>{teachers.map((t, i) => <option key={i} value={t}>{t}</option>)}</select></div>)}
          <button className={`w-full py-8 rounded-[35px] text-white font-black shadow-2xl transition-all transform active:scale-95 text-sm tracking-[0.5em] uppercase border-b-[10px] group ${view === 'admin' ? 'bg-blue-800 border-blue-950' : 'bg-purple-800 border-purple-950'}`}><span className="italic">Login Sistem &rarr;</span></button>
        </form>
      </div>
      <div className="flex flex-col items-center gap-6 mt-16 z-10">
        <div className="flex gap-5">
            <button onClick={() => setDisplayMode('hp')} className={`p-4 rounded-2xl flex items-center gap-3 text-[11px] font-black tracking-[0.2em] transition shadow-2xl border-2 ${displayMode === 'hp' ? 'bg-white text-blue-950 border-white' : 'bg-white/5 text-white/40 border-white/10'}`}><Smartphone size={20} strokeWidth={3}/> HP MODE</button>
            <button onClick={() => setDisplayMode('pc')} className={`p-4 rounded-2xl flex items-center gap-3 text-[11px] font-black tracking-[0.2em] transition shadow-2xl border-2 ${displayMode === 'pc' ? 'bg-white text-blue-950 border-white' : 'bg-white/5 text-white/40 border-white/10'}`}><Monitor size={20} strokeWidth={3}/> PC MODE</button>
        </div>
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
  const [displayMode, setDisplayMode] = useState('auto'); // auto, hp, pc
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (err) { console.error("Auth Error:", err); setInitError("Cloud Connection Failed."); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
      <div className="w-20 h-20 border-[8px] border-blue-600 border-t-transparent rounded-full animate-spin mb-8 shadow-2xl"></div>
      <div className="font-black animate-pulse tracking-[0.8em] text-xs uppercase italic">Connecting Cloud...</div>
    </div>
  );
  
  if (initError) return (
    <div className="h-screen flex items-center justify-center bg-rose-950 text-rose-100 font-black p-12 text-center border-t-[15px] border-rose-600 flex-col gap-6 font-sans uppercase">
      <AlertTriangle size={80} className="mb-4 animate-bounce"/>
      <div className="max-w-lg text-2xl italic leading-tight">{initError}</div>
      <button onClick={() => window.location.reload()} className="mt-6 bg-rose-600 text-white px-12 py-5 rounded-[25px] font-black hover:bg-rose-700 transition transform active:scale-95 uppercase tracking-widest leading-none">Muat Ulang</button>
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