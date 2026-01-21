import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  LayoutDashboard, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  CheckCircle2, 
  Clock, 
  UserCheck,
  AlertCircle,
  RefreshCw,
  WifiOff,
  LogIn,
  LogOut,
  ShieldCheck,
  BookOpen,
  KeyRound,
  ChevronRight,
  BellRing,
  User,
  School,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
  Receipt,
  PiggyBank,
  History,
  FileText,
  DollarSign,
  AlertTriangle,
  Calculator,
  CalendarDays
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  setDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",
  authDomain: "gemilangsystem.firebaseapp.com",
  projectId: "gemilangsystem",
  storageBucket: "gemilangsystem.firebasestorage.app",
  messagingSenderId: "1078433073773",
  appId: "1:1078433073773:web:cdb13ae553efbc1d1bcd64"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'bimbel-gemilang-edu';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const getCollectionPath = (name) => collection(db, 'artifacts', appId, 'public', 'data', name);

// --- UI COMPONENTS ---

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-rose-500' : 'bg-emerald-500';
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div className={`fixed bottom-8 right-8 ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 z-[1000] animate-in slide-in-from-right duration-300`}>
      <Icon size={20} />
      <span className="font-bold text-sm">{message}</span>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        <X size={18} />
      </button>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-all hover:shadow-md">
    <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-current/10`}>
      <Icon className="text-white" size={24} />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{title}</p>
      <div className="flex items-baseline space-x-2">
        <p className="text-xl font-black text-gray-800 tracking-tighter">{value}</p>
        {subtitle && <span className="text-[9px] font-bold text-gray-400 uppercase">{subtitle}</span>}
      </div>
    </div>
  </div>
);

// --- LOGIN PAGE COMPONENT ---
const LoginPage = ({ onLogin, notify, tutorList }) => {
  const [loginMode, setLoginMode] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (accessCode === 'ADMIN123') {
        onLogin('admin', 'Administrator');
      } else {
        notify("Sandi Admin Salah!", "error");
      }
      setIsLoading(false);
    }, 800);
  };

  const handleTutorSubmit = (e) => {
    e.preventDefault();
    if (!selectedTutor) return notify("Pilih nama Anda!", "error");
    setIsLoading(true);
    setTimeout(() => {
      onLogin('tutor', selectedTutor);
      setIsLoading(false);
    }, 800);
  };

  if (!loginMode) {
    return (
      <div className="h-screen w-full bg-gray-950 flex items-center justify-center p-6 overflow-hidden relative font-sans text-gray-900">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="w-full max-w-xl text-center z-10">
          <div className="mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
              <GraduationCap size={48} className="text-white -rotate-3" />
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Gemilang</h2>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.4em] mt-4">Pilih Mode Akses</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setLoginMode('admin')} className="group bg-white/5 hover:bg-white/10 border border-white/10 p-10 rounded-[2.5rem] transition-all text-center flex flex-col items-center space-y-4">
              <ShieldCheck size={32} className="text-indigo-400" />
              <h3 className="text-white font-black uppercase tracking-widest text-lg">Admin</h3>
            </button>
            <button onClick={() => setLoginMode('tutor')} className="group bg-white/5 hover:bg-white/10 border border-white/10 p-10 rounded-[2.5rem] transition-all text-center flex flex-col items-center space-y-4">
              <UserCheck size={32} className="text-blue-400" />
              <h3 className="text-white font-black uppercase tracking-widest text-lg">Tentor</h3>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-950 flex items-center justify-center p-6 relative">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 shadow-2xl">
        <button onClick={() => setLoginMode(null)} className="mb-8 text-gray-500 flex items-center space-x-2 text-xs uppercase font-black">
          <ChevronRight className="rotate-180" size={14} /> <span>Kembali</span>
        </button>
        <h2 className="text-3xl font-black text-white uppercase italic mb-8 leading-none">
          {loginMode === 'admin' ? 'Login Admin' : 'Login Tentor'}
        </h2>
        <form onSubmit={loginMode === 'admin' ? handleAdminSubmit : handleTutorSubmit} className="space-y-6">
          {loginMode === 'tutor' && (
            <select 
              required value={selectedTutor} 
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-sm font-bold outline-none"
            >
              <option value="" className="bg-gray-900 italic">-- PILIH NAMA --</option>
              {tutorList.map((t, idx) => <option key={idx} value={t.name} className="bg-gray-900">{t.name}</option>)}
            </select>
          )}
          {loginMode === 'admin' && (
            <input 
              type="password" required value={accessCode} 
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="KODE AKSES" 
              className="w-full px-8 py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-center text-lg font-black tracking-widest outline-none"
            />
          )}
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 py-6 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            {isLoading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : 'Masuk Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [financeTab, setFinanceTab] = useState('summary'); 
  const [studentLevelFilter, setStudentLevelFilter] = useState('all');
  
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [packagePrices, setPackagePrices] = useState([]);
  
  // Registration States
  const [regSelectedPackage, setRegSelectedPackage] = useState('');
  const [regFee, setRegFee] = useState(0);
  const [regPaymentType, setRegPaymentType] = useState('lunas'); // lunas, cicilan
  const [regAmountReceived, setRegAmountReceived] = useState(0);
  const [regInstallmentPlan, setRegInstallmentPlan] = useState(3); // 1, 2, 3 months
  const [regInstallmentDates, setRegInstallmentDates] = useState([new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); setIsAuthLoading(false); } 
      catch (error) { notify("Firebase failed.", "error"); setIsAuthLoading(false); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, [notify]);

  useEffect(() => {
    if (!user) return;
    const unsubTutors = onSnapshot(getCollectionPath('tutors'), (s) => setTutors(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => unsubTutors();
  }, [user]);

  useEffect(() => {
    if (!user || !isLoggedIn) return;
    const unsubStudents = onSnapshot(getCollectionPath('students'), (s) => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubClasses = onSnapshot(getCollectionPath('classes'), (s) => setClasses(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPayments = onSnapshot(getCollectionPath('payments'), (s) => setPayments(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubSettings = onSnapshot(getCollectionPath('settings'), (s) => setPackagePrices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubStudents(); unsubClasses(); unsubPayments(); unsubSettings(); };
  }, [user, isLoggedIn]);

  const financeMetrics = useMemo(() => {
    const m = { cash: 0, bank: 0, income: 0, expense: 0, arrears: 0 };
    payments.forEach(p => {
      const amount = parseFloat(p.amount || 0);
      if (p.type === 'income') {
        m.income += amount;
        if (p.method === 'TUNAI') m.cash += amount; else m.bank += amount;
      } else if (p.type === 'expense') {
        m.expense += amount;
        if (p.method === 'TUNAI') m.cash -= amount; else m.bank -= amount;
      } else if (p.status === 'pending') {
        m.arrears += amount;
      }
    });
    return m;
  }, [payments]);

  const handleLogin = (role, name) => { setIsLoggedIn(true); setUserRole(role); setUserName(name); notify(`Welcome, ${name}!`); };
  const handleLogout = () => { setIsLoggedIn(false); setUserRole(null); setUserName(''); setActiveTab('dashboard'); };

  const handleAddData = async (type, data) => {
    if (!user) return;
    try {
      // Logic khusus untuk pendaftaran siswa dengan pembayaran
      if (type === 'students') {
        // 1. Simpan Data Siswa
        const studentRef = await addDoc(getCollectionPath('students'), { ...data, createdAt: new Date().toISOString(), createdBy: user.uid });
        const studentName = data.name.toUpperCase();

        // 2. Proses Pembayaran
        const pkgPrice = parseInt(packagePrices.find(p => p.name === regSelectedPackage)?.price || 0);
        const regFeeInt = parseInt(regFee || 0);
        const totalCost = pkgPrice + regFeeInt;

        if (regPaymentType === 'lunas') {
          // Buat record pembayaran lunas
          await addDoc(getCollectionPath('payments'), {
            student: studentName,
            type: 'income',
            amount: totalCost,
            note: `PENDAFTARAN & PAKET ${regSelectedPackage} (LUNAS)`,
            method: 'TUNAI', // Default cash for simplicity here, could be added to form
            status: 'completed',
            month: new Date().toLocaleString('id-ID', { month: 'long' }),
            createdAt: new Date().toISOString(),
            createdBy: user.uid
          });
        } else {
          // CICILAN:
          // A. Bayar Biaya Pendaftaran dulu (jika ada) - dianggap lunas saat daftar
          if (regFeeInt > 0) {
             await addDoc(getCollectionPath('payments'), {
              student: studentName,
              type: 'income',
              amount: regFeeInt,
              note: `BIAYA PENDAFTARAN - ${studentName}`,
              method: 'TUNAI',
              status: 'completed',
              month: new Date().toLocaleString('id-ID', { month: 'long' }),
              createdAt: new Date().toISOString(),
              createdBy: user.uid
            });
          }

          // B. Buat Tagihan Cicilan (Pending)
          const monthlyBill = Math.ceil(pkgPrice / parseInt(regInstallmentPlan));
          for (let i = 0; i < parseInt(regInstallmentPlan); i++) {
            const dueDate = regInstallmentDates[i] || new Date().toISOString();
            await addDoc(getCollectionPath('payments'), {
              student: studentName,
              type: 'income', // Akan jadi income saat dibayar
              amount: monthlyBill,
              note: `CICILAN KE-${i+1} PAKET ${regSelectedPackage}`,
              method: 'PENDING',
              status: 'pending', // Masuk ke piutang
              month: new Date(dueDate).toLocaleString('id-ID', { month: 'long' }),
              dueDate: dueDate,
              createdAt: new Date().toISOString(),
              createdBy: user.uid
            });
          }
        }
        notify("Siswa & Pembayaran Tersimpan!");
      } else {
        // Data umum lain
        await addDoc(getCollectionPath(type), { ...data, createdAt: new Date().toISOString(), createdBy: user.uid });
        notify("Data Tersimpan!");
      }
      setIsModalOpen(false);
    } catch (error) { console.error(error); notify("Gagal simpan.", "error"); }
  };

  const handleUpdatePrice = async (packageName, price) => {
    if (!user) return;
    try {
      const docId = packageName.replace(/\s+/g, '_'); 
      const priceDoc = doc(db, 'artifacts', appId, 'public', 'data', 'settings', docId);
      await setDoc(priceDoc, { name: packageName, price: price, updatedAt: new Date().toISOString() });
      notify(`Harga ${packageName} diperbarui!`);
      setIsModalOpen(false);
    } catch (error) { notify("Gagal update harga.", "error"); }
  };

  const handleSettleArrear = async (id) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', id), {
        status: 'paid',
        type: 'income', 
        paidAt: new Date().toISOString()
      });
      notify("Tagihan Lunas!");
    } catch (error) { notify("Gagal update status.", "error"); }
  };

  const handleDelete = async (type, id) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', type, id)); notify("Terhapus."); } 
    catch (error) { notify("Gagal hapus.", "error"); }
  };

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const getTodayIndo = () => ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'][new Date().getDay()];

  if (isAuthLoading) return <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-white"><RefreshCw className="animate-spin text-indigo-500" size={48} /></div>;

  if (!isLoggedIn) return (
    <>
      <LoginPage onLogin={handleLogin} notify={notify} tutorList={tutors} />
      {notifications.map(n => <Notification key={n.id} {...n} onClose={() => removeNotification(n.id)} />)}
    </>
  );

  const sdStudents = students.filter(s => s.level === 'SD');
  const smpStudents = students.filter(s => s.level === 'SMP');
  const filteredStudents = studentLevelFilter === 'all' ? students : (studentLevelFilter === 'SD' ? sdStudents : smpStudents);
  const todayClasses = classes.filter(c => c.day.toUpperCase() === getTodayIndo());
  const pendingBills = payments.filter(p => p.status === 'pending');
  const myTodayClasses = classes.filter(c => c.tutor.toLowerCase() === userName.toLowerCase() && c.day.toUpperCase() === getTodayIndo());

  const SidebarItem = ({ id, icon: Icon, label, roles = ['admin', 'tutor'] }) => {
    if (!roles.includes(userRole)) return null;
    return (
      <button onClick={() => setActiveTab(id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-800'}`}>
        <Icon size={18} /> <span className="font-bold text-[10px] uppercase tracking-widest">{label}</span>
      </button>
    );
  };

  // Helper untuk hitungan pembayaran di modal
  const getPackagePriceVal = () => parseInt(packagePrices.find(p => p.name === regSelectedPackage)?.price || 0);
  const getTotalBill = () => getPackagePriceVal() + parseInt(regFee || 0);
  const getMonthlyBill = () => Math.ceil(getPackagePriceVal() / parseInt(regInstallmentPlan));

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      <aside className="w-80 bg-gray-900 text-white p-10 flex flex-col hidden lg:flex h-screen sticky top-0 shadow-2xl">
        <div className="flex items-center space-x-4 mb-16"><div className="bg-indigo-500 p-3 rounded-2xl"><GraduationCap size={28} /></div><div><h1 className="text-xl font-black uppercase italic leading-none">Gemilang</h1><p className="text-[9px] text-indigo-400 font-black mt-2">{userRole} PANEL</p></div></div>
        <nav className="flex-1 space-y-3">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="students" icon={Users} label="Siswa" roles={['admin']} />
          <SidebarItem id="tutors" icon={UserCheck} label="Tentor" roles={['admin']} />
          <SidebarItem id="classes" icon={Calendar} label="Jadwal" />
          <SidebarItem id="payments" icon={Wallet} label="Keuangan" roles={['admin']} />
        </nav>
        <div className="mt-auto pt-10 border-t border-white/5"><button onClick={handleLogout} className="w-full py-4 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Log Out</button></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl h-24 border-b border-gray-100 flex items-center justify-between px-12 sticky top-0 z-30">
          <div><h2 className="text-2xl font-black uppercase italic tracking-tighter">{activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ')}</h2><p className="text-[10px] text-gray-400 font-black uppercase mt-1">Sistem Bimbel Gemilang Cloud</p></div>
          <div className="flex items-center space-x-10 text-right">
             <div className="hidden sm:block"><p className="text-xl font-black leading-none">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p><p className="text-[9px] text-indigo-500 font-black mt-1.5 uppercase">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
             {userRole === 'admin' && <button onClick={() => { setModalType('student'); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-xl flex items-center space-x-2"><Plus size={18} /><span>DAFTAR SISWA</span></button>}
          </div>
        </header>

        <div className="p-12">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10"><h3 className="text-4xl font-black italic">Selamat Datang, {userName}! 👋</h3><p className="mt-5 font-bold uppercase tracking-widest text-sm opacity-90">Sistem SD & SMP Gemilang Terintegrasi Cloud.</p></div>
                  <GraduationCap className="absolute -right-16 -bottom-16 text-white/5 w-96 h-96 rotate-12" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <StatCard title="Saldo Tunai" value={formatIDR(financeMetrics.cash)} icon={Wallet} color="bg-indigo-500" />
                  <StatCard title="Siswa SD" value={sdStudents.length} icon={School} color="bg-blue-600" />
                  <StatCard title="Siswa SMP" value={smpStudents.length} icon={GraduationCap} color="bg-rose-500" />
                  <StatCard title="Kelas Hari Ini" value={todayClasses.length} icon={Calendar} color="bg-amber-500" />
               </div>
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black uppercase italic mb-8 border-b pb-6">Jadwal Aktif Hari Ini</h3>
                    <div className="space-y-6">
                      {(userRole === 'admin' ? todayClasses : myTodayClasses).map(c => (
                        <div key={c.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border group hover:border-indigo-200 transition-all">
                          <div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black"><p className="text-[9px] opacity-70">JAM</p><p className="text-xs">{c.time}</p></div><div><p className="font-black text-gray-800 text-lg uppercase italic leading-none">{c.subject}</p><p className="text-[9px] font-bold text-gray-400 uppercase mt-3">TENTOR: {c.tutor}</p></div></div>
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                      ))}
                      {todayClasses.length === 0 && <p className="text-center py-10 text-gray-300 font-black uppercase text-xs">Agenda Kosong</p>}
                    </div>
                  </div>
                  {userRole === 'admin' && (
                    <div className="bg-white rounded-[3rem] p-12 border-l-[16px] border-amber-400 shadow-sm">
                      <h3 className="text-xl font-black uppercase italic text-amber-700 mb-8 border-b pb-6">Warning Tagihan</h3>
                      <div className="space-y-5">
                        {pendingBills.length > 0 ? pendingBills.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-6 bg-amber-50 rounded-[2rem] border border-amber-100"><div className="flex items-center space-x-5"><div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center font-black uppercase">{p.student?.[0]}</div><div><p className="font-black text-amber-900 text-sm uppercase">{p.student}</p><p className="text-[9px] text-amber-600 font-bold uppercase mt-1 italic">{p.month}</p></div></div><div className="text-right"><p className="text-xs font-black text-amber-800">{formatIDR(p.amount)}</p><button className="mt-2 text-[8px] font-black text-amber-500 underline uppercase tracking-widest">Tagih WA</button></div></div>
                        )) : <div className="text-center py-20 opacity-30 italic"><CheckCircle2 className="mx-auto mb-4" size={48} /><p className="font-black uppercase text-xs">Cash Flow Aman</p></div>}
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* ... (Students and Finance Tabs remain largely the same, logic is in Modal below) ... */}
          {activeTab === 'students' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100 inline-flex items-center space-x-2">
                {['all', 'SD', 'SMP'].map(l => <button key={l} onClick={() => setStudentLevelFilter(l)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${studentLevelFilter === l ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>{l === 'all' ? 'Semua Siswa' : `Jenjang ${l}`}</button>)}
              </div>
              <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b"><tr><th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase">Profil Siswa</th><th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase">Akademik</th><th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase">Paket</th><th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase text-right">Opsi</th></tr></thead>
                  <tbody className="divide-y">
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="group hover:bg-indigo-50/10">
                        <td className="px-12 py-10"><div className="flex items-center space-x-6"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${s.level === 'SD' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{s.name?.[0]}</div><div><p className="font-black text-gray-800 text-lg uppercase italic tracking-tighter leading-none mb-2">{s.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase italic">{s.originSchool}</p></div></div></td>
                        <td className="px-12 py-10"><p className="text-[10px] font-black uppercase inline-block px-3 py-1 rounded-lg mb-2 bg-gray-100">{s.level} - KELAS {s.grade}</p><p className="text-[10px] text-gray-400 font-bold uppercase italic">HP: {s.studentPhone}</p></td>
                        <td className="px-12 py-10"><p className="text-sm font-black text-gray-700 italic">PAKET {s.package}</p><p className="text-[9px] text-emerald-500 font-black uppercase mt-2 italic flex items-center space-x-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span><span>AKTIF</span></p></td>
                        <td className="px-12 py-10 text-right"><button onClick={() => handleDelete('students', s.id)} className="p-4 text-gray-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              {/* FINANCE NAV */}
              <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-gray-100 inline-flex items-center space-x-2">
                {['summary', 'transactions', 'arrears', 'packages'].map(t => (
                  <button key={t} onClick={() => setFinanceTab(t)} className={`px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${financeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>
                    {t === 'summary' ? 'Laporan' : t === 'transactions' ? 'Kas & Mutasi' : t === 'arrears' ? 'Piutang' : 'Harga Paket'}
                  </button>
                ))}
              </div>

              {/* TAB: SUMMARY (LAPORAN KEUANGAN) */}
              {financeTab === 'summary' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
                      <h3 className="text-xl font-black uppercase italic mb-10 border-b pb-6">Laporan Arus Kas</h3>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase mb-3 flex items-center space-x-2"><ArrowUpCircle size={14}/><span>Total Uang Masuk</span></p>
                            <p className="text-3xl font-black text-emerald-700">{formatIDR(financeMetrics.income)}</p>
                         </div>
                         <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100">
                            <p className="text-[10px] font-black text-rose-600 uppercase mb-3 flex items-center space-x-2"><ArrowDownCircle size={14}/><span>Total Uang Keluar</span></p>
                            <p className="text-3xl font-black text-rose-700">{formatIDR(financeMetrics.expense)}</p>
                         </div>
                         <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 col-span-2 text-center">
                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-3">Profit / Balance</p>
                            <p className="text-5xl font-black text-indigo-600 tracking-tighter">{formatIDR(financeMetrics.income - financeMetrics.expense)}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                       <h4 className="text-sm font-black uppercase italic mb-8 flex items-center space-x-2"><Wallet className="text-indigo-500" size={18} /><span>Posisi Saldo</span></h4>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
                             <span className="text-[10px] font-black text-gray-500 uppercase">Saldo Tunai</span>
                             <span className="font-black text-gray-800">{formatIDR(financeMetrics.cash)}</span>
                          </div>
                          <div className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
                             <span className="text-[10px] font-black text-gray-500 uppercase">Saldo Bank</span>
                             <span className="font-black text-gray-800">{formatIDR(financeMetrics.bank)}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: TRANSACTIONS (MUTASI DETAIL) */}
              {financeTab === 'transactions' && (
                <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-12 py-10 border-b flex justify-between items-center bg-gray-50/30">
                     <h3 className="font-black uppercase italic text-xl tracking-tighter">Mutasi Detail</h3>
                     <div className="flex space-x-4">
                        <button onClick={() => { setModalType('expense'); setIsModalOpen(true); }} className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center space-x-2">
                          <ArrowDownCircle size={16} /> <span>Kas Keluar</span>
                        </button>
                        <button onClick={() => { setModalType('income'); setIsModalOpen(true); }} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center space-x-2">
                          <ArrowUpCircle size={16} /> <span>Kas Masuk</span>
                        </button>
                     </div>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu Transaksi</th>
                        <th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Uraian</th>
                        <th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Metode</th>
                        <th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payments.filter(p => p.status !== 'pending').slice().reverse().map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-all">
                          <td className="px-12 py-8">
                            <p className="text-sm font-black text-gray-700">{new Date(p.createdAt).toLocaleDateString('id-ID')}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{new Date(p.createdAt).toLocaleTimeString('id-ID')}</p>
                          </td>
                          <td className="px-12 py-8">
                             <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${p.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                   {p.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                </div>
                                <p className="font-black text-gray-700 text-xs uppercase">{p.note}</p>
                             </div>
                          </td>
                          <td className="px-12 py-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{p.method}</td>
                          <td className={`px-12 py-8 text-right font-black text-lg ${p.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {p.type === 'income' ? '+' : '-'} {formatIDR(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {payments.filter(p => p.status !== 'pending').length === 0 && <div className="py-40 text-center italic text-gray-200 uppercase font-black tracking-widest opacity-50">Belum ada transaksi tercatat</div>}
                </div>
              )}

              {/* TAB: ARREARS (TUNGGAKAN / PIUTANG) */}
              {financeTab === 'arrears' && (
                <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-12 py-10 border-b bg-amber-50/50 flex justify-between items-center">
                     <div>
                       <h3 className="font-black uppercase italic text-xl tracking-tighter text-amber-700">Daftar Tunggakan Siswa</h3>
                       <p className="text-[10px] font-bold text-amber-500 uppercase mt-1">Total Piutang: {formatIDR(financeMetrics.arrears)}</p>
                     </div>
                     <BellRing className="text-amber-400" size={24} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-12">
                    {pendingBills.map(p => (
                      <div key={p.id} className="p-6 rounded-[2rem] border border-amber-100 bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle size={64} className="text-amber-500" /></div>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Tagihan: {p.month}</p>
                        <h4 className="text-lg font-black text-gray-800 uppercase leading-none mb-1">{p.student}</h4>
                        <p className="text-2xl font-black text-amber-600 mt-4 mb-6">{formatIDR(p.amount)}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-4">Jatuh Tempo: {new Date(p.dueDate).toLocaleDateString('id-ID')}</p>
                        <button onClick={() => handleSettleArrear(p.id)} className="w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center space-x-2">
                          <CheckCircle2 size={14} /><span>Tandai Lunas</span>
                        </button>
                      </div>
                    ))}
                    {pendingBills.length === 0 && <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase text-xs italic">Tidak ada tunggakan aktif</div>}
                  </div>
                </div>
              )}

              {/* TAB: PACKAGES (HARGA PAKET) */}
              {financeTab === 'packages' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {['1 BULAN', '3 BULAN', '6 BULAN'].map((pkg, i) => {
                    const priceData = packagePrices.find(p => p.name === pkg);
                    return (
                      <div key={i} className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all">
                        <div className="absolute top-10 right-10"><Settings className="text-gray-200 group-hover:text-indigo-400 transition-colors" size={20} /></div>
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 italic leading-none">Paket Belajar</h4>
                        <p className="text-3xl font-black text-gray-800 uppercase italic mb-8">{pkg}</p>
                        <p className="text-4xl font-black text-indigo-600 tracking-tighter">{priceData ? formatIDR(priceData.price) : 'Rp -'}</p>
                        <button onClick={() => { setSelectedPackage(pkg); setModalType('package_price'); setIsModalOpen(true); }} className="w-full mt-10 py-5 bg-gray-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-100">Update Harga</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {['tutors', 'classes', 'resources', 'my-students'].includes(activeTab) && (
            <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 p-40 flex flex-col items-center justify-center text-center">
               <RefreshCw className="text-indigo-200 animate-spin mb-10" size={64} />
               <h3 className="text-4xl font-black text-gray-800 uppercase tracking-tighter italic">Sync Cloud</h3>
               <p className="text-gray-400 text-[10px] mt-6 max-w-sm font-black leading-relaxed uppercase tracking-widest italic opacity-50">Menunggu data dari Firebase Cloud Bimbel Gemilang...</p>
            </div>
          )}
        </div>
      </main>

      {/* NOTIFIKASI & MODAL */}
      {notifications.map(n => <Notification key={n.id} {...n} onClose={() => removeNotification(n.id)} />)}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in duration-300 flex flex-col">
            <div className="px-14 py-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div><h3 className="font-black text-gray-800 text-3xl tracking-tighter uppercase italic">{modalType === 'student' ? 'Pendaftaran Siswa' : modalType === 'package_price' ? 'Update Harga' : 'Data Keuangan'}</h3><p className="text-[10px] text-indigo-500 font-black uppercase mt-3 italic underline">Bimbel Gemilang Edu Pusat</p></div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white p-5 rounded-[2rem] active:scale-90 shadow-xl"><X size={24} /></button>
            </div>
            
            <form className="p-14 space-y-12 overflow-y-auto" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              
              if (modalType === 'student') handleAddData('students', data);
              else if (modalType === 'package_price') handleUpdatePrice(data.packageName, data.price);
              else handleAddData('payments', { ...data, type: modalType, status: 'completed' }); 
            }}>
              {modalType === 'student' ? (
                <>
                  <div className="space-y-8">
                    <div className="flex items-center space-x-3 border-b border-indigo-100 pb-5"><User className="text-indigo-600" size={24} /><h4 className="font-black uppercase tracking-widest text-sm italic">Identitas Siswa</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Nama Siswa</label><input name="name" required placeholder="NAMA LENGKAP" className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl outline-none font-black uppercase italic" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Jenis Kelamin</label><select name="gender" required className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl font-black uppercase italic"><option value="">-- PILIH --</option><option>LAKI-LAKI</option><option>PEREMPUAN</option></select></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Kota & Tgl Lahir</label><input name="birthPlaceDate" required placeholder="KOTA, DD/MM/YYYY" className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl outline-none font-black uppercase italic" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Asal Sekolah</label><input name="originSchool" required placeholder="NAMA SEKOLAH" className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl outline-none font-black uppercase italic" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-indigo-500 uppercase font-bold underline">Jenjang</label><select name="level" required className="w-full px-6 py-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl font-black uppercase italic"><option value="">-- PILIH JENJANG --</option><option>SD</option><option>SMP</option></select></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Kelas</label><input name="grade" placeholder="MISAL: 5 SD" required className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl outline-none font-black uppercase italic" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">No. HP Siswa</label><input name="studentPhone" type="tel" required placeholder="08XXXXXXXXXX" className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl font-black italic" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-indigo-600 uppercase font-bold">Paket Belajar</label>
                        <select name="package" required className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic" onChange={(e) => setRegSelectedPackage(e.target.value)} value={regSelectedPackage}>
                          <option value="">-- PILIH PAKET --</option><option>1 BULAN</option><option>3 BULAN</option><option>6 BULAN</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* SEKSI SETUP PEMBAYARAN */}
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center space-x-3 border-b border-emerald-100 pb-5"><Calculator className="text-emerald-600" size={24} /><h4 className="font-black uppercase tracking-widest text-sm italic">Setup Pembayaran & Administrasi</h4></div>
                    <div className="p-8 bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-[2.5rem]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                           <div className="space-y-6">
                              <div className="flex justify-between items-center"><span className="text-xs font-black text-gray-400 uppercase italic">Harga Paket Terpilih</span><span className="text-lg font-black text-indigo-600">{formatIDR(getPackagePriceVal())}</span></div>
                              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Biaya Pendaftaran</label><input type="number" value={regFee} onChange={(e) => setRegFee(e.target.value)} className="w-full px-6 py-4 bg-white border-2 border-emerald-100 rounded-2xl outline-none font-black text-emerald-600" /></div>
                              <div className="flex justify-between items-center pt-4 border-t border-emerald-200"><span className="text-sm font-black text-gray-600 uppercase italic">Total Tagihan</span><span className="text-2xl font-black text-emerald-600">{formatIDR(getTotalBill())}</span></div>
                           </div>
                           <div className="space-y-6">
                              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Skema Pembayaran</label><div className="flex space-x-2"><button type="button" onClick={() => setRegPaymentType('lunas')} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase transition-all ${regPaymentType === 'lunas' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-gray-400 border-2 border-gray-100'}`}>Lunas (Cash)</button><button type="button" onClick={() => setRegPaymentType('cicilan')} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase transition-all ${regPaymentType === 'cicilan' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-gray-400 border-2 border-gray-100'}`}>Cicilan (Termin)</button></div></div>
                              
                              {regPaymentType === 'lunas' ? (
                                <div className="space-y-4 animate-in fade-in">
                                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Uang Diterima</label><input type="number" value={regAmountReceived} onChange={(e) => setRegAmountReceived(e.target.value)} className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none font-black" /></div>
                                   <div className="flex justify-between items-center p-4 bg-emerald-100 rounded-2xl"><span className="text-[10px] font-black text-emerald-600 uppercase">Kembalian</span><span className="font-black text-emerald-700">{formatIDR(regAmountReceived - getTotalBill())}</span></div>
                                </div>
                              ) : (
                                <div className="space-y-4 animate-in fade-in">
                                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Pilih Tenor</label><select value={regInstallmentPlan} onChange={(e) => setRegInstallmentPlan(e.target.value)} className="w-full px-6 py-4 bg-white border-2 border-amber-100 rounded-2xl outline-none font-black text-sm"><option value="1">1 Bulan</option><option value="2">2 Bulan</option><option value="3">3 Bulan</option></select></div>
                                   <div className="space-y-3">
                                      <p className="text-[10px] font-black text-gray-400 uppercase italic">Jadwal & Nominal Cicilan (Otomatis)</p>
                                      {Array.from({ length: parseInt(regInstallmentPlan) }).map((_, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                           <span className="text-[10px] font-bold text-amber-500 w-6">{idx + 1}.</span>
                                           <input type="date" value={regInstallmentDates[idx]} onChange={(e) => { const newDates = [...regInstallmentDates]; newDates[idx] = e.target.value; setRegInstallmentDates(newDates); }} className="flex-1 px-4 py-2 bg-white border rounded-xl text-xs font-bold" />
                                           <span className="text-xs font-black text-gray-600">{formatIDR(getMonthlyBill())}</span>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center space-x-3 border-b border-amber-100 pb-5"><ShieldCheck className="text-amber-600" size={24} /><h4 className="font-black uppercase tracking-widest text-sm italic">Wali / Orang Tua</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="grid grid-cols-2 gap-4"><input name="fatherName" placeholder="NAMA AYAH" className="px-6 py-4 bg-gray-50 border-2 rounded-2xl uppercase italic font-black text-sm" /><input name="fatherJob" placeholder="PEKERJAAN" className="px-6 py-4 bg-gray-50 border-2 rounded-2xl uppercase italic font-black text-sm" /></div>
                      <div className="grid grid-cols-2 gap-4"><input name="motherName" placeholder="NAMA IBU" className="px-6 py-4 bg-gray-50 border-2 rounded-2xl uppercase italic font-black text-sm" /><input name="motherJob" placeholder="PEKERJAAN" className="px-6 py-4 bg-gray-50 border-2 rounded-2xl uppercase italic font-black text-sm" /></div>
                      <div className="md:col-span-2"><textarea name="address" required rows="2" placeholder="ALAMAT LENGKAP RUMAH" className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl outline-none font-black uppercase italic text-sm"></textarea></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">HP Ortu (WA)</label><input name="phone" type="tel" required placeholder="08XXXXXXXXXX" className="w-full px-6 py-4 bg-indigo-50 border-2 rounded-2xl font-black italic" /></div>
                    </div>
                  </div>
                </>
              ) : modalType === 'package_price' ? (
                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase italic">Pilih Paket</label>
                      <select name="packageName" defaultValue={selectedPackage} required className="w-full px-8 py-5 bg-gray-50 border-2 rounded-[1.8rem] font-black uppercase italic"><option>1 BULAN</option><option>3 BULAN</option><option>6 BULAN</option></select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase italic">Harga Baru (Rp)</label>
                      <input name="price" type="number" required placeholder="INPUT HARGA..." className="w-full px-8 py-5 bg-gray-50 border-2 rounded-[1.8rem] font-black italic" />
                   </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Keterangan Transaksi</label><input name="note" required placeholder="CONTOH: BAYAR LISTRIK / SPP" className="w-full px-8 py-5 bg-gray-50 border-2 rounded-2xl font-black uppercase italic" /></div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Nominal Uang</label><input name="amount" type="number" required placeholder="RP..." className="w-full px-8 py-5 bg-gray-50 border-2 rounded-2xl font-black italic" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Metode</label><select name="method" required className="w-full px-8 py-5 bg-gray-50 border-2 rounded-2xl font-black uppercase italic"><option value="">-- PILIH --</option><option>TUNAI</option><option>TRANSFER BANK</option></select></div>
                  </div>
                </div>
              )}
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[3rem] shadow-2xl flex items-center justify-center space-x-5 uppercase tracking-[0.4em] text-sm italic active:scale-[0.98] transition-all"><CheckCircle2 size={24} strokeWidth={3} /><span>Simpan Perubahan</span></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}