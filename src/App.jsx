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
  CalendarDays,
  Phone,
  MapPin,
  Megaphone,
  CheckSquare,
  MessageCircle,
  XCircle,
  HelpCircle,
  Lock,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  CalendarCheck,
  LayoutGrid,
  FilePlus
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
  setDoc,
  getDoc
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

// --- CONSTANTS ---
const CLASS_ROOMS = ['MERKURIUS', 'VENUS', 'BUMI', 'MARS', 'JUPITER'];
const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];

// --- HELPERS ---
const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const getDayNameFromDate = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  return days[date.getDay()];
};

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
              className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-sm font-bold outline-none cursor-pointer"
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
  const [attendance, setAttendance] = useState({});
  
  const [masterTeacherCode, setMasterTeacherCode] = useState('GURU123'); 
  const [tutorAttendance, setTutorAttendance] = useState(null); 
  const [inputTeacherCode, setInputTeacherCode] = useState('');

  const [scheduleDateView, setScheduleDateView] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentsForClass, setSelectedStudentsForClass] = useState([]);
  const [classScheduleType, setClassScheduleType] = useState('regular'); 

  // Registration & Edit States
  const [regSelectedPackage, setRegSelectedPackage] = useState('');
  const [regLevel, setRegLevel] = useState(''); 
  const [regFee, setRegFee] = useState(0);
  const [regPaymentType, setRegPaymentType] = useState('lunas'); 
  const [regAmountReceived, setRegAmountReceived] = useState(0);
  const [regInstallmentPlan, setRegInstallmentPlan] = useState(3); 
  const [regInstallmentDates, setRegInstallmentDates] = useState([new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('SD');
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [selectedStudentToEdit, setSelectedStudentToEdit] = useState(null);

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
    const unsubConfig = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global_config'), (doc) => {
      if (doc.exists() && doc.data().teacherCode) {
        setMasterTeacherCode(doc.data().teacherCode);
      }
    });
    return () => unsubConfig();
  }, []);

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
    const unsubAttendance = onSnapshot(getCollectionPath('attendance'), (s) => {
       const data = {};
       s.docs.forEach(d => { data[d.id] = d.data(); });
       setAttendance(data);
    });
    return () => { unsubStudents(); unsubClasses(); unsubPayments(); unsubSettings(); unsubAttendance(); };
  }, [user, isLoggedIn]);

  useEffect(() => {
    if (userRole !== 'tutor' || !userName || !user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const docId = `${userName.replace(/\s+/g, '_')}_${todayStr}`;
    
    const unsubTutorAtt = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'teacher_attendance', docId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setTutorAttendance(docSnapshot.data());
      } else {
        setTutorAttendance(null);
      }
    });
    return () => unsubTutorAtt();
  }, [userRole, userName, user]);

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
  const handleLogout = () => { setIsLoggedIn(false); setUserRole(null); setUserName(''); setActiveTab('dashboard'); setTutorAttendance(null); };

  const getPackagePriceVal = () => {
    const p = packagePrices.find(p => p.name === regSelectedPackage && p.level === regLevel);
    return parseInt(p?.price || 0);
  };
  
  const getTotalBill = () => getPackagePriceVal() + parseInt(regFee || 0);
  const getMonthlyBill = () => Math.ceil(getPackagePriceVal() / parseInt(regInstallmentPlan));

  const getTodayIndo = () => ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'][new Date().getDay()];
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  const handleTeacherMarkAttendance = async (classId, studentId) => {
    if (!user) return;
    const todayStr = getTodayIndo();
    const todayDate = getTodayDateStr();
    const docId = `${classId}_${todayDate}`;
    
    const currentRecord = attendance[docId] || { students: {} };
    const newStatus = currentRecord.students?.[studentId] === 'hadir' ? null : 'hadir';

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', docId), {
        classId, date: todayDate, day: todayStr, markedBy: userName,
        students: { ...currentRecord.students, [studentId]: newStatus },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) { notify("Gagal update absensi.", "error"); }
  };

  const handleAdminUpdateAttendance = async (classId, studentId, status) => {
    if (!user) return;
    const todayDate = getTodayDateStr();
    const docId = `${classId}_${todayDate}`;
    const currentRecord = attendance[docId] || { students: {} };

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', docId), {
        students: { ...currentRecord.students, [studentId]: status }
      }, { merge: true });
      notify(`Status siswa diubah: ${status}`);
    } catch (e) { notify("Gagal update status.", "error"); }
  };

  const handleTeacherClockIn = async (e) => {
    e.preventDefault();
    if (inputTeacherCode !== masterTeacherCode) { notify("Kode Absensi Salah!", "error"); return; }
    const todayStr = getTodayDateStr();
    const docId = `${userName.replace(/\s+/g, '_')}_${todayStr}`;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teacher_attendance', docId), {
        tutorName: userName, date: todayStr, checkInTime: new Date().toISOString(), checkOutTime: null, status: 'active'
      });
      notify("Berhasil Absen Masuk!"); setInputTeacherCode('');
    } catch (err) { notify("Gagal absen masuk.", "error"); }
  };

  const handleTeacherClockOut = async () => {
    const todayStr = getTodayDateStr();
    const docId = `${userName.replace(/\s+/g, '_')}_${todayStr}`;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teacher_attendance', docId), { checkOutTime: new Date().toISOString(), status: 'completed' });
      notify("Berhasil Absen Pulang!");
    } catch (err) { notify("Gagal absen pulang.", "error"); }
  };

  const handleSaveMasterCode = async (formData) => {
    const newCode = formData.get('code');
    if (!newCode) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global_config'), { teacherCode: newCode }, { merge: true });
    notify("Kode Absensi Guru Diperbarui!"); setIsModalOpen(false);
  };

  const handleSendWA = (student, status) => {
    const message = `Halo Wali Murid ${student.name}, kami menginfokan status kehadiran siswa pada ${new Date().toLocaleDateString('id-ID')} adalah: *${status.toUpperCase()}*. Terima kasih.`;
    window.open(`https://wa.me/${student.studentPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const checkScheduleConflict = (newClass) => {
    const newStart = timeToMinutes(newClass.time);
    const newEnd = timeToMinutes(newClass.endTime);
    return classes.some(existing => {
      if (existing.room !== newClass.room) return false;
      let isDayOverlap = false;
      const existDay = existing.type === 'regular' ? existing.day : getDayNameFromDate(existing.date);
      const incomingDay = newClass.type === 'regular' ? newClass.day : getDayNameFromDate(newClass.date);
      if (existDay === incomingDay) isDayOverlap = true;
      if (!isDayOverlap) return false;
      const existStart = timeToMinutes(existing.time);
      const existEnd = timeToMinutes(existing.endTime);
      return (newStart < existEnd && newEnd > existStart);
    });
  };

  const handleAddData = async (type, data) => {
    if (!user) return;
    try {
      if (type === 'classes') {
        if (checkScheduleConflict(data)) { notify(`BENTROK! Ruang ${data.room} terisi.`, "error"); return; }
        await addDoc(getCollectionPath('classes'), { ...data, studentIds: selectedStudentsForClass, createdAt: new Date().toISOString(), createdBy: user.uid });
        notify("Jadwal Berhasil Dibuat!"); setSelectedStudentsForClass([]);
      } else if (type === 'students') {
        const studentRef = await addDoc(getCollectionPath('students'), { ...data, createdAt: new Date().toISOString(), createdBy: user.uid });
        const studentName = data.name.toUpperCase();
        const pkgPrice = getPackagePriceVal();
        const regFeeInt = parseInt(regFee || 0);
        const totalCost = pkgPrice + regFeeInt;

        if (regPaymentType === 'lunas') {
          await addDoc(getCollectionPath('payments'), {
            student: studentName, type: 'income', amount: totalCost, note: `PENDAFTARAN & PAKET ${regSelectedPackage} (${regLevel}) - LUNAS`, method: 'TUNAI', status: 'completed', month: new Date().toLocaleString('id-ID', { month: 'long' }), createdAt: new Date().toISOString(), createdBy: user.uid
          });
        } else {
          // Both 'cicilan' and default creates pending records for warning system
          if (regFeeInt > 0) {
             await addDoc(getCollectionPath('payments'), { student: studentName, type: 'income', amount: regFeeInt, note: `BIAYA PENDAFTARAN - ${studentName}`, method: 'TUNAI', status: 'completed', month: new Date().toLocaleString('id-ID', { month: 'long' }), createdAt: new Date().toISOString(), createdBy: user.uid });
          }
          const monthlyBill = Math.ceil(pkgPrice / parseInt(regInstallmentPlan));
          for (let i = 0; i < parseInt(regInstallmentPlan); i++) {
            const dueDate = regInstallmentDates[i] || new Date().toISOString();
            await addDoc(getCollectionPath('payments'), { student: studentName, type: 'income', amount: monthlyBill, note: `TAGIHAN KE-${i+1} PAKET ${regSelectedPackage} (${regLevel})`, method: 'PENDING', status: 'pending', month: new Date(dueDate).toLocaleString('id-ID', { month: 'long' }), dueDate: dueDate, createdAt: new Date().toISOString(), createdBy: user.uid });
          }
        }
        notify("Siswa Tersimpan!");
      } else if (modalType === 'package_price') {
         await handleUpdatePrice(data.packageName, data.level, data.price);
      } else if (modalType === 'income' || modalType === 'expense') {
         await addDoc(getCollectionPath('payments'), { ...data, type: modalType, status: 'completed', createdAt: new Date().toISOString(), createdBy: user.uid });
         notify("Transaksi Berhasil!");
      } else if (modalType === 'edit_student') {
        // Handle Student Update
        if (selectedStudentToEdit) {
           await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentToEdit.id), data);
           notify("Data Siswa Diperbarui!");
        }
      } else if (modalType === 'add_bill') {
        // Add new pending bill for student
        await addDoc(getCollectionPath('payments'), {
           student: selectedStudentToEdit.name.toUpperCase(),
           type: 'income',
           amount: parseInt(data.amount),
           note: data.note.toUpperCase(),
           method: 'PENDING',
           status: 'pending',
           month: new Date(data.dueDate).toLocaleString('id-ID', { month: 'long' }),
           dueDate: data.dueDate,
           createdAt: new Date().toISOString(),
           createdBy: user.uid
        });
        notify("Tagihan Baru Ditambahkan!");
      } else {
        await addDoc(getCollectionPath(type), { ...data, createdAt: new Date().toISOString(), createdBy: user.uid });
        notify("Data Tersimpan!");
      }
      setIsModalOpen(false);
    } catch (error) { console.error(error); notify("Gagal simpan.", "error"); }
  };

  const handleUpdatePrice = async (packageName, level, price) => {
    const docId = `${packageName.replace(/\s+/g, '_')}_${level}`; 
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', docId), { name: packageName, level, price, updatedAt: new Date().toISOString() });
    notify(`Harga ${packageName} (${level}) diperbarui!`);
  };

  const handleSettleArrear = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', id), { status: 'paid', type: 'income', paidAt: new Date().toISOString() });
    notify("Tagihan Lunas!");
  };

  const handleDelete = async (type, id) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', type, id)); notify("Terhapus."); } 
    catch (error) { notify("Gagal hapus.", "error"); }
  };

  const handleEditStudent = (student) => {
    setSelectedStudentToEdit(student);
    setModalType('edit_student');
    setIsModalOpen(true);
  };

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

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
  const todayClasses = classes.filter(c => {
    if (c.type === 'regular') return c.day.toUpperCase() === getTodayIndo();
    if (c.type === 'special') return c.date === getTodayDateStr();
    return false;
  });

  const pendingBills = payments.filter(p => p.status === 'pending');
  const myTodayClasses = classes.filter(c => {
    const isMyTutor = c.tutor.toLowerCase() === userName.toLowerCase();
    if (!isMyTutor) return false;
    if (c.type === 'regular') return c.day.toUpperCase() === getTodayIndo();
    if (c.type === 'special') return c.date === getTodayDateStr();
    return false;
  });

  const getClassStudents = (classData) => {
    if (!classData.studentIds || !Array.isArray(classData.studentIds)) return [];
    return students.filter(s => classData.studentIds.includes(s.id));
  };

  const getStudentStatus = (classId, studentId) => {
    const docId = `${classId}_${getTodayDateStr()}`;
    return attendance[docId]?.students?.[studentId] || 'absen';
  };

  const getRoomOccupancy = (roomName, dateStr) => {
    const dayName = getDayNameFromDate(dateStr);
    return classes.filter(c => {
      if (c.room !== roomName) return false;
      if (c.type === 'regular') return c.day === dayName;
      if (c.type === 'special') return c.date === dateStr;
      return false;
    }).sort((a,b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  };

  const SidebarItem = ({ id, icon: Icon, label, roles = ['admin', 'tutor'] }) => {
    if (!roles.includes(userRole)) return null;
    return (
      <button onClick={() => setActiveTab(id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-800'}`}>
        <Icon size={18} /> <span className="font-bold text-[10px] uppercase tracking-widest">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      <aside className="w-80 bg-gray-900 text-white p-10 flex flex-col hidden lg:flex h-screen sticky top-0 shadow-2xl">
        <div className="flex items-center space-x-4 mb-16"><div className="bg-indigo-500 p-3 rounded-2xl"><GraduationCap size={28} /></div><div><h1 className="text-xl font-black uppercase italic leading-none">Gemilang</h1><p className="text-[9px] text-indigo-400 font-black mt-2">{userRole} PANEL</p></div></div>
        <nav className="flex-1 space-y-3">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="students" icon={Users} label="Siswa" roles={['admin']} />
          <SidebarItem id="tutors" icon={UserCheck} label="Tentor" roles={['admin']} />
          <SidebarItem id="classes" icon={Calendar} label="Jadwal & Ruang" />
          <SidebarItem id="payments" icon={Wallet} label="Keuangan" roles={['admin']} />
          {userRole === 'tutor' && (
            <>
              <SidebarItem id="my-students" icon={Users} label="Siswa Bimbingan" roles={['tutor']} />
              <SidebarItem id="resources" icon={BookOpen} label="E-Learning" roles={['tutor']} />
            </>
          )}
        </nav>
        <div className="mt-auto pt-10 border-t border-white/5"><button onClick={handleLogout} className="w-full py-4 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Log Out</button></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl h-24 border-b border-gray-100 flex items-center justify-between px-12 sticky top-0 z-30">
          <div><h2 className="text-2xl font-black uppercase italic tracking-tighter">{activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ')}</h2><p className="text-[10px] text-gray-400 font-black uppercase mt-1">Sistem Bimbel Gemilang Cloud</p></div>
          <div className="flex items-center space-x-10 text-right">
             <div className="hidden sm:block"><p className="text-xl font-black leading-none">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p><p className="text-[9px] text-indigo-500 font-black mt-1.5 uppercase">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
             {userRole === 'admin' && activeTab === 'dashboard' && <button onClick={() => { setModalType('student'); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-xl flex items-center space-x-2"><Plus size={18} strokeWidth={3} /><span>DAFTAR SISWA</span></button>}
          </div>
        </header>

        <div className="p-12">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               {/* Dashboard Content */}
               <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10"><h3 className="text-4xl font-black italic">Halo, {userName}! 👋</h3><p className="mt-5 font-bold uppercase tracking-widest text-sm opacity-90">{userRole === 'tutor' ? 'Saatnya mengajar! Absensi siswa diaktifkan untuk kelas hari ini.' : 'Sistem SD & SMP Gemilang Terintegrasi Cloud.'}</p></div>
                  <GraduationCap className="absolute -right-16 -bottom-16 text-white/5 w-96 h-96 rotate-12" />
               </div>
               
               {userRole === 'tutor' ? (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Tutor Dashboard */}
                    <div className="lg:col-span-1 space-y-8">
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100 flex flex-col justify-between h-full">
                        <div>
                          <h4 className="text-xl font-black uppercase italic text-gray-800 border-b pb-4 mb-6">Presensi Harian</h4>
                          {tutorAttendance ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                <div className="p-2 bg-emerald-500 text-white rounded-xl"><LogInIcon size={20}/></div>
                                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Waktu Masuk</p><p className="text-lg font-black text-emerald-700">{new Date(tutorAttendance.checkInTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p></div>
                              </div>
                              {tutorAttendance.checkOutTime ? (
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
                                  <div className="p-2 bg-rose-500 text-white rounded-xl"><LogOutIcon size={20}/></div>
                                  <div><p className="text-[10px] font-bold text-gray-400 uppercase">Waktu Pulang</p><p className="text-lg font-black text-rose-700">{new Date(tutorAttendance.checkOutTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p></div>
                                </div>
                              ) : <button onClick={handleTeacherClockOut} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200"><LogOutIcon size={16}/> Akhiri Kelas / Pulang</button>}
                              <p className="text-[10px] text-center text-gray-400 italic mt-4">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                            </div>
                          ) : (
                            <form onSubmit={handleTeacherClockIn} className="space-y-4">
                              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Masukkan Kode Guru</label><input type="password" value={inputTeacherCode} onChange={(e) => setInputTeacherCode(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none font-black text-center tracking-[0.3em] uppercase focus:border-indigo-500 transition-all" placeholder="••••••" required /></div>
                              <button type="submit" className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"><LogInIcon size={16}/> Absen Masuk</button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <h3 className="text-xl font-black uppercase italic border-b pb-4">Jadwal Mengajar Hari Ini</h3>
                        {myTodayClasses.length > 0 ? (
                          <div className="grid grid-cols-1 gap-8">
                            {myTodayClasses.map(c => (
                              <div key={c.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative group">
                                {c.type === 'special' && <div className="absolute top-0 right-0 bg-rose-500 text-white px-4 py-2 rounded-bl-2xl rounded-tr-[2.5rem] text-[9px] font-black uppercase tracking-widest">Booking Khusus</div>}
                                <div className="flex justify-between items-start mb-6">
                                    <div><div className="flex items-center space-x-2 mb-2"><span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{c.room}</span><span className="text-xs font-black text-gray-400">{c.time} - {c.endTime}</span></div><h4 className="text-2xl font-black text-gray-800 uppercase italic">{c.subject}</h4></div>
                                    <div className="text-right"><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Siswa</p><p className="text-xl font-black text-indigo-600">{getClassStudents(c).length}</p></div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2"><CheckCircle2 size={12}/> Klik Nama Untuk Absensi (Hijau = Hadir)</p>
                                    <div className="flex flex-wrap gap-3">{getClassStudents(c).map(s => { const status = getStudentStatus(c.id, s.id); return (<button key={s.id} onClick={() => handleTeacherMarkAttendance(c.id, s.id)} className={`px-5 py-3 rounded-xl text-xs font-black uppercase transition-all shadow-sm flex items-center space-x-2 ${status === 'hadir' ? 'bg-emerald-500 text-white ring-2 ring-emerald-200' : 'bg-white text-gray-500 border hover:border-indigo-300'}`}><span>{s.name}</span>{status === 'hadir' && <CheckCircle2 size={14} />}</button>); })}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <div className="py-20 text-center text-gray-300 font-black uppercase text-sm tracking-widest bg-white rounded-[3rem] border border-gray-100">Tidak ada jadwal hari ini</div>}
                    </div>
                 </div>
               ) : (
                 // ADMIN DASHBOARD CONTENT
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <StatCard title="Saldo Tunai" value={formatIDR(financeMetrics.cash)} icon={Wallet} color="bg-indigo-500" />
                      <StatCard title="Siswa SD" value={sdStudents.length} icon={School} color="bg-blue-600" />
                      <StatCard title="Siswa SMP" value={smpStudents.length} icon={GraduationCap} color="bg-rose-500" />
                      <StatCard title="Kelas Hari Ini" value={todayClasses.length} icon={Calendar} color="bg-amber-500" />
                   </div>
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                      <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black uppercase italic mb-8 border-b pb-6">Jadwal & Absensi Hari Ini</h3>
                        <div className="space-y-6">
                          {todayClasses.map(c => (
                            <div key={c.id} className="p-6 bg-gray-50 rounded-[2.5rem] border group hover:border-indigo-200 transition-all relative overflow-hidden">
                              {c.type === 'special' && <div className="absolute top-0 right-0 bg-rose-500 text-white px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-widest">Khusus</div>}
                              <div className="flex justify-between items-center mb-4">
                                <div><p className="font-black text-gray-800 text-lg uppercase italic leading-none">{c.subject}</p><p className="text-[9px] font-bold text-gray-400 uppercase mt-1">TENTOR: {c.tutor} • RUANG: {c.room}</p></div>
                                <div className="text-right"><button onClick={() => { setSelectedClassForAttendance(c); setIsModalOpen(true); setModalType('attendance_check'); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">Cek Absensi</button></div>
                              </div>
                              <div className="flex gap-1 overflow-hidden">{getClassStudents(c).map(s => (<div key={s.id} className={`w-2 h-2 rounded-full ${getStudentStatus(c.id, s.id) === 'hadir' ? 'bg-emerald-500' : getStudentStatus(c.id, s.id) === 'izin' ? 'bg-amber-500' : getStudentStatus(c.id, s.id) === 'alpha' ? 'bg-rose-500' : 'bg-gray-200'}`}></div>))}</div>
                            </div>
                          ))}
                          {todayClasses.length === 0 && <p className="text-center py-10 text-gray-300 font-black uppercase text-xs">Agenda Kosong</p>}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-[3rem] p-12 border-l-[16px] border-amber-400 shadow-sm">
                        <h3 className="text-xl font-black uppercase italic text-amber-700 mb-8 border-b pb-6">Warning Tagihan</h3>
                        <div className="space-y-5">
                          {pendingBills.length > 0 ? pendingBills.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-6 bg-amber-50 rounded-[2rem] border border-amber-100"><div className="flex items-center space-x-5"><div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center font-black uppercase">{p.student?.[0]}</div><div><p className="font-black text-amber-900 text-sm uppercase">{p.student}</p><p className="text-[9px] text-amber-600 font-bold uppercase mt-1 italic">{p.note}</p></div></div><div className="text-right"><p className="text-xs font-black text-amber-800">{formatIDR(p.amount)}</p><button className="mt-2 text-[8px] font-black text-amber-500 underline uppercase tracking-widest">Tagih WA</button></div></div>
                          )) : <div className="text-center py-20 opacity-30 italic"><CheckCircle2 className="mx-auto mb-4" size={48} /><p className="font-black uppercase text-xs">Cash Flow Aman</p></div>}
                        </div>
                      </div>
                   </div>
                 </>
               )}
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               {userRole === 'admin' && (
                 <div className="flex flex-col gap-6">
                   <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black uppercase italic text-gray-700 flex items-center gap-2"><LayoutGrid size={18}/> Peta Ketersediaan Ruangan</h3>
                        <input type="date" value={scheduleDateView} onChange={(e) => setScheduleDateView(e.target.value)} className="px-4 py-2 border rounded-xl text-xs font-bold uppercase bg-gray-50" />
                      </div>
                      <div className="grid grid-cols-5 gap-4">
                        {CLASS_ROOMS.map(room => {
                          const occupancy = getRoomOccupancy(room, scheduleDateView);
                          return (
                            <div key={room} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2 min-h-[150px]">
                              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center mb-2">{room}</p>
                              {occupancy.length > 0 ? occupancy.map(c => (
                                <div key={c.id} className={`p-2 rounded-xl text-[9px] font-bold uppercase text-white ${c.type === 'special' ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                                  {c.time} - {c.endTime}<br/>{c.subject}
                                </div>
                              )) : <p className="text-[9px] text-gray-300 text-center italic mt-4">KOSONG</p>}
                            </div>
                          );
                        })}
                      </div>
                   </div>
                   <div className="flex justify-end"><button onClick={() => { setModalType('class'); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-xl flex items-center space-x-2"><Plus size={18} strokeWidth={3} /><span>BUAT JADWAL BARU</span></button></div>
                 </div>
               )}
               
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                 {DAYS.map(day => {
                   const dayClasses = classes.filter(c => c.day === day && c.type === 'regular');
                   if (dayClasses.length === 0) return null;
                   return (
                     <div key={day} className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
                       <h3 className="text-lg font-black uppercase italic mb-6 text-indigo-700 border-b pb-4">{day} (Reguler)</h3>
                       <div className="space-y-4">
                         {dayClasses.map(c => (
                           <div key={c.id} className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition-all relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-5"><School size={64} /></div>
                             <div>
                               <div className="flex items-center space-x-2 mb-1">
                                 <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">{c.room}</span>
                                 <span className="text-[10px] font-bold text-gray-400">{c.time} - {c.endTime}</span>
                               </div>
                               <p className="font-black text-gray-800 text-sm uppercase">{c.subject}</p>
                               <div className="flex items-center gap-3 mt-2">
                                 <span className="text-[9px] font-bold text-indigo-500 uppercase italic">Guru: {c.tutor}</span>
                                 <span className="text-[9px] font-bold text-gray-400 uppercase italic">Siswa: {getClassStudents(c).length} Orang</span>
                               </div>
                             </div>
                             {userRole === 'admin' && <button onClick={() => handleDelete('classes', c.id)} className="p-3 text-gray-300 hover:text-rose-500 transition-all z-10"><Trash2 size={16} /></button>}
                           </div>
                         ))}
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}

          {activeTab === 'tutors' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               {userRole === 'admin' && (
                 <div className="flex justify-end gap-4">
                   <button onClick={() => { setModalType('set_teacher_code'); setIsModalOpen(true); }} className="bg-white text-indigo-600 border border-indigo-100 px-8 py-4 rounded-2xl text-xs font-black shadow-sm flex items-center space-x-2 hover:bg-indigo-50"><Lock size={18} /><span>SET KODE ABSEN</span></button>
                   <button onClick={() => { setModalType('tutor'); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-xl flex items-center space-x-2"><Plus size={18} strokeWidth={3} /><span>TAMBAH GURU</span></button>
                 </div>
               )}
               <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b"><tr><th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase">Nama Guru</th><th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase">Mata Pelajaran</th><th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase">Kontak</th><th className="px-12 py-10 text-[10px] font-black text-gray-400 uppercase text-right">Opsi</th></tr></thead>
                  <tbody className="divide-y">
                    {tutors.map(t => (
                      <tr key={t.id} className="group hover:bg-indigo-50/10">
                        <td className="px-12 py-10"><div className="flex items-center space-x-6"><div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border bg-indigo-50 text-indigo-600 border-indigo-100">{t.name?.[0]}</div><div><p className="font-black text-gray-800 text-lg uppercase italic tracking-tighter leading-none mb-2">{t.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase italic">ID: {t.id.slice(0,5)}</p></div></div></td>
                        <td className="px-12 py-10"><p className="text-sm font-black text-gray-700 italic">{t.subject}</p></td>
                        <td className="px-12 py-10"><p className="text-[10px] font-black text-gray-400 uppercase italic flex items-center space-x-2"><Phone size={12} className="text-indigo-500" /><span>{t.phone}</span></p></td>
                        <td className="px-12 py-10 text-right"><button onClick={() => handleDelete('tutors', t.id)} className="p-4 text-gray-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>
          )}
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
                        <td className="px-12 py-10 text-right"><button onClick={() => handleEditStudent(s)} className="p-4 text-gray-300 hover:text-indigo-600 transition-all"><Edit2 size={18} /></button><button onClick={() => handleDelete('students', s.id)} className="p-4 text-gray-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button></td>
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
              {/* ... (Finance Summary, Transactions, Arrears remain same) ... */}
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
                </div>
              )}
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
              {financeTab === 'packages' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {['1 BULAN', '3 BULAN', '6 BULAN'].map((pkg) => {
                    const sdPrice = packagePrices.find(p => p.name === pkg && p.level === 'SD');
                    const smpPrice = packagePrices.find(p => p.name === pkg && p.level === 'SMP');
                    return (
                      <div key={pkg} className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all">
                        <div className="absolute top-10 right-10"><Settings className="text-gray-200 group-hover:text-indigo-400 transition-colors" size={20} /></div>
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 italic leading-none">Paket {pkg}</h4>
                        <div className="mb-6"><p className="text-[10px] font-bold text-gray-400 uppercase">Harga SD</p><p className="text-3xl font-black text-indigo-600 tracking-tighter">{sdPrice ? formatIDR(sdPrice.price) : 'Rp -'}</p><button onClick={() => { setSelectedPackage(pkg); setSelectedLevel('SD'); setModalType('package_price'); setIsModalOpen(true); }} className="text-[9px] font-black uppercase underline text-gray-400 hover:text-indigo-500 mt-1">Ubah Harga SD</button></div>
                        <div><p className="text-[10px] font-bold text-gray-400 uppercase">Harga SMP</p><p className="text-3xl font-black text-blue-600 tracking-tighter">{smpPrice ? formatIDR(smpPrice.price) : 'Rp -'}</p><button onClick={() => { setSelectedPackage(pkg); setSelectedLevel('SMP'); setModalType('package_price'); setIsModalOpen(true); }} className="text-[9px] font-black uppercase underline text-gray-400 hover:text-blue-500 mt-1">Ubah Harga SMP</button></div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              <div><h3 className="font-black text-gray-800 text-3xl tracking-tighter uppercase italic">{modalType === 'attendance_check' ? 'Kontrol Absensi' : modalType === 'set_teacher_code' ? 'Kode Absensi Guru' : modalType === 'package_price' ? 'Update Harga' : modalType === 'edit_student' ? 'Edit Data Siswa' : 'Input Data'}</h3><p className="text-[10px] text-indigo-500 font-black uppercase mt-3 italic underline">Bimbel Gemilang Edu Pusat</p></div>
              <button onClick={() => { setIsModalOpen(false); setSelectedStudentsForClass([]); setSelectedClassForAttendance(null); setSelectedStudentToEdit(null); }} className="bg-white p-5 rounded-[2rem] active:scale-90 shadow-xl"><X size={24} /></button>
            </div>
            
            <div className="p-14 overflow-y-auto">
              {modalType === 'attendance_check' && selectedClassForAttendance ? (
                <div className="space-y-8">
                  {/* Attendance Check UI */}
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex justify-between items-center">
                    <div><p className="text-xs font-black text-indigo-400 uppercase">Jadwal</p><h4 className="text-2xl font-black text-indigo-900 italic uppercase">{selectedClassForAttendance.subject}</h4></div>
                    <div className="text-right"><p className="text-xs font-black text-indigo-400 uppercase">Tentor</p><p className="text-lg font-black text-indigo-900">{selectedClassForAttendance.tutor}</p></div>
                  </div>
                  <div className="space-y-4">
                    {getClassStudents(selectedClassForAttendance).map(s => {
                      const status = getStudentStatus(selectedClassForAttendance.id, s.id);
                      return (
                        <div key={s.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${status === 'hadir' ? 'bg-emerald-500' : status === 'izin' ? 'bg-amber-500' : status === 'alpha' ? 'bg-rose-500' : 'bg-gray-300'}`}>{s.name[0]}</div>
                            <div><p className="font-bold text-gray-800 uppercase">{s.name}</p><p className={`text-[10px] font-black uppercase tracking-widest ${status === 'hadir' ? 'text-emerald-500' : status === 'izin' ? 'text-amber-500' : status === 'alpha' ? 'text-rose-500' : 'text-gray-400'}`}>Status: {status ? status : 'Belum Absen'}</p></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleAdminUpdateAttendance(selectedClassForAttendance.id, s.id, 'hadir')} className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 text-[10px] font-bold">Hadir</button>
                            <button onClick={() => handleAdminUpdateAttendance(selectedClassForAttendance.id, s.id, 'izin')} className="p-2 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 text-[10px] font-bold">Izin</button>
                            <button onClick={() => handleAdminUpdateAttendance(selectedClassForAttendance.id, s.id, 'alpha')} className="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 text-[10px] font-bold">Alpha</button>
                            <button onClick={() => handleSendWA(s, status || 'Belum Ada Keterangan')} className="p-2 ml-2 rounded-lg bg-green-500 text-white hover:bg-green-600"><MessageCircle size={16} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <form className="space-y-12" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const data = Object.fromEntries(formData.entries());
                  
                  if (modalType === 'student') handleAddData('students', data);
                  else if (modalType === 'tutor') handleAddData('tutors', data);
                  else if (modalType === 'class') {
                    handleAddData('classes', { 
                      ...data, 
                      type: classScheduleType, 
                      date: classScheduleType === 'special' ? data.date : null 
                    });
                  }
                  else if (modalType === 'package_price') handleUpdatePrice(data.packageName, data.level, data.price);
                  else if (modalType === 'set_teacher_code') handleSaveMasterCode(formData);
                  else if (modalType === 'edit_student') handleAddData('payments', data); // This handles adding payments in edit mode too if structured right, or calls separate update logic
                  else if (modalType === 'add_bill') {
                     // Special handler for adding bill
                     handleAddData('payments', { ...data, type: 'add_bill' });
                  }
                  else handleAddData('payments', { ...data, type: modalType, status: 'completed' }); 
                }}>
                  {modalType === 'set_teacher_code' ? (
                    <div className="space-y-4">
                      <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl mb-4">
                        <p className="text-xs text-indigo-600 font-bold mb-2 uppercase tracking-widest">Kode Saat Ini</p>
                        <p className="text-3xl font-black text-indigo-900 tracking-[0.2em]">{masterTeacherCode}</p>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase italic">Set Kode Baru</label>
                        <input name="code" required placeholder="MASUKKAN KODE BARU" className="w-full px-8 py-6 bg-gray-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-sm font-black uppercase tracking-widest text-center" />
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[3rem] shadow-2xl flex items-center justify-center space-x-5 uppercase tracking-[0.4em] text-sm italic active:scale-[0.98] transition-all"><CheckCircle2 size={24} strokeWidth={3} /><span>Update Kode</span></button>
                    </div>
                  ) : modalType === 'class' ? (
                    <>
                      <div className="flex items-center justify-center space-x-4 mb-6">
                        <button type="button" onClick={() => setClassScheduleType('regular')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all ${classScheduleType === 'regular' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>Jadwal Reguler (Mingguan)</button>
                        <button type="button" onClick={() => setClassScheduleType('special')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all ${classScheduleType === 'special' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>Booking Khusus (Tanggal)</button>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase italic">Mata Pelajaran / Kegiatan</label>
                        <input name="subject" required placeholder="NAMA KELAS/MAPEL" className="w-full px-8 py-6 bg-gray-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-sm font-black uppercase" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                        {classScheduleType === 'regular' ? (
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-gray-400 uppercase italic">Hari</label>
                            <select name="day" className="w-full px-8 py-6 bg-gray-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-sm font-black appearance-none italic">
                              {DAYS.map(d => <option key={d}>{d}</option>)}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-gray-400 uppercase italic">Tanggal Booking</label>
                            <input name="date" type="date" required className="w-full px-8 py-6 bg-gray-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-sm font-black uppercase" />
                          </div>
                        )}
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-gray-400 uppercase italic">Jam Mulai</label>
                          <input name="time" type="time" required className="w-full px-8 py-6 bg-gray-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-sm font-black" />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase italic">Jam Selesai</label>
                        <input name="endTime" type="time" required className="w-full px-8 py-6 bg-gray-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-sm font-black" />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase italic">Ruangan</label>
                        <select name="room" required className="w-full px-8 py-6 bg-gray-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-sm font-black appearance-none italic">
                          {CLASS_ROOMS.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase italic">Pilih Tentor / PJ</label>
                        <select name="tutor" required className="w-full px-8 py-6 bg-gray-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-sm font-black appearance-none italic">
                          <option value="">-- PILIH --</option>
                          {tutors.map((t, idx) => <option key={idx} value={t.name}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase italic">Pilih Siswa (Multi-Select)</label>
                        <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          {students.map(s => (
                            <div key={s.id} 
                              onClick={() => {
                                if (selectedStudentsForClass.includes(s.id)) setSelectedStudentsForClass(prev => prev.filter(id => id !== s.id));
                                else setSelectedStudentsForClass(prev => [...prev, s.id]);
                              }}
                              className={`p-3 rounded-xl cursor-pointer text-xs font-bold uppercase transition-all ${selectedStudentsForClass.includes(s.id) ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border'}`}
                            >
                              {s.name} ({s.grade})
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-gray-400 italic text-right">{selectedStudentsForClass.length} Siswa Dipilih</p>
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[3rem] shadow-2xl flex items-center justify-center space-x-5 uppercase tracking-[0.4em] text-sm italic active:scale-[0.98] transition-all"><CheckCircle2 size={24} strokeWidth={3} /><span>Simpan Jadwal</span></button>
                    </>
                  ) : modalType === 'edit_student' ? (
                     <div className="space-y-8">
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                           <h4 className="font-black text-gray-800 uppercase italic mb-4">Edit Data Siswa</h4>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 italic">Nama</label><input name="name" defaultValue={selectedStudentToEdit.name} className="w-full px-4 py-3 bg-white border-2 rounded-xl text-sm font-bold uppercase" /></div>
                             <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 italic">Kelas</label><input name="grade" defaultValue={selectedStudentToEdit.grade} className="w-full px-4 py-3 bg-white border-2 rounded-xl text-sm font-bold uppercase" /></div>
                             <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 italic">HP</label><input name="studentPhone" defaultValue={selectedStudentToEdit.studentPhone} className="w-full px-4 py-3 bg-white border-2 rounded-xl text-sm font-bold" /></div>
                           </div>
                           <button type="button" onClick={(e) => { 
                             const form = e.target.closest('form');
                             const updatedData = {
                               name: form.name.value,
                               grade: form.grade.value,
                               studentPhone: form.studentPhone.value
                             };
                             // Update student logic would go here, simplified for brevity to reuse main handler or separate
                             updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentToEdit.id), updatedData);
                             notify("Data Siswa Diupdate!");
                           }} className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Simpan Perubahan Data</button>
                        </div>

                        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                           <h4 className="font-black text-amber-800 uppercase italic mb-4 flex items-center gap-2"><DollarSign size={18}/> Kelola Tagihan</h4>
                           
                           {/* List Pending Bills for this student */}
                           <div className="space-y-3 mb-6">
                             <p className="text-[10px] font-bold text-gray-400 uppercase">Tagihan Belum Lunas:</p>
                             {payments.filter(p => p.student === selectedStudentToEdit.name && p.status === 'pending').map(p => (
                               <div key={p.id} className="flex justify-between items-center p-3 bg-white border border-amber-200 rounded-xl">
                                  <div><p className="text-[10px] font-black uppercase text-amber-700">{p.note}</p><p className="text-[9px] font-bold text-gray-400">{formatIDR(p.amount)}</p></div>
                                  <button type="button" onClick={() => handleSettleArrear(p.id)} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase">Lunas</button>
                               </div>
                             ))}
                             {payments.filter(p => p.student === selectedStudentToEdit.name && p.status === 'pending').length === 0 && <p className="text-[10px] italic text-gray-400">Tidak ada tagihan pending.</p>}
                           </div>

                           <div className="pt-4 border-t border-amber-200">
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Tambah Tagihan Baru (Hutang)</p>
                             <div className="grid grid-cols-2 gap-3 mb-3">
                               <input id="newBillAmount" type="number" placeholder="Nominal Rp..." className="px-3 py-2 bg-white border rounded-lg text-xs" />
                               <input id="newBillNote" type="text" placeholder="Keterangan..." className="px-3 py-2 bg-white border rounded-lg text-xs" />
                               <input id="newBillDate" type="date" className="col-span-2 px-3 py-2 bg-white border rounded-lg text-xs" />
                             </div>
                             <button type="button" onClick={() => {
                               const amt = document.getElementById('newBillAmount').value;
                               const note = document.getElementById('newBillNote').value;
                               const date = document.getElementById('newBillDate').value;
                               if(amt && note && date) {
                                 setModalType('add_bill'); // Switch mode slightly to handle logic in main submit or just call addDoc here directly
                                 // Directly calling addDoc for cleaner flow inside this button
                                 addDoc(getCollectionPath('payments'), {
                                    student: selectedStudentToEdit.name,
                                    type: 'income',
                                    amount: parseInt(amt),
                                    note: note.toUpperCase(),
                                    method: 'PENDING',
                                    status: 'pending',
                                    month: new Date(date).toLocaleString('id-ID', { month: 'long' }),
                                    dueDate: date,
                                    createdAt: new Date().toISOString(),
                                    createdBy: user.uid
                                 });
                                 notify("Tagihan Baru Ditambahkan!");
                               } else {
                                 notify("Lengkapi data tagihan!", "error");
                               }
                             }} className="w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase">Simpan Tagihan Baru</button>
                           </div>
                        </div>
                     </div>
                  ) : modalType === 'tutor' ? (
                    <>
                      <div className="space-y-3"><label className="text-[11px] font-black italic">Nama Guru</label><input name="name" required placeholder="NAMA LENGKAP" className="w-full px-8 py-6 bg-gray-100 border-2 rounded-[1.8rem] font-black uppercase" /></div>
                      <div className="space-y-3"><label className="text-[11px] font-black italic">Mata Pelajaran</label><input name="subject" placeholder="SPESIALISASI" required className="w-full px-8 py-6 bg-gray-100 border-2 rounded-[1.8rem] font-black uppercase" /></div>
                      <div className="space-y-3"><label className="text-[11px] font-black italic">Nomor HP</label><input name="phone" type="tel" placeholder="08..." required className="w-full px-8 py-6 bg-gray-100 border-2 rounded-[1.8rem] font-black uppercase" /></div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[3rem] shadow-2xl flex items-center justify-center space-x-5 uppercase tracking-[0.4em] text-sm italic active:scale-[0.98] transition-all"><CheckCircle2 size={24} strokeWidth={3} /><span>Simpan Data</span></button>
                    </>
                  ) : modalType === 'student' ? (
                    <>
                      {/* Student form content from previous step */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black italic">Nama Siswa</label><input name="name" required className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl font-black uppercase" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black italic">Jenis Kelamin</label><select name="gender" required className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl font-black uppercase"><option value="">-- PILIH --</option><option>LAKI-LAKI</option><option>PEREMPUAN</option></select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black italic">Jenjang</label><select name="level" required className="w-full px-6 py-4 bg-indigo-50 border-2 rounded-2xl font-black uppercase" onChange={(e) => setRegLevel(e.target.value)}><option value="">-- PILIH --</option><option value="SD">SD</option><option value="SMP">SMP</option></select></div>
                      </div>
                      <div className="space-y-2"><label className="text-[10px] font-black italic">Paket</label><select name="package" required className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase" onChange={(e) => setRegSelectedPackage(e.target.value)}><option value="">-- PILIH PAKET --</option><option>1 BULAN</option><option>3 BULAN</option><option>6 BULAN</option></select></div>
                      <input name="grade" type="hidden" value="Reguler" /> 
                      <input name="studentPhone" type="hidden" value="-" />
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[3rem] shadow-2xl flex items-center justify-center space-x-5 uppercase tracking-[0.4em] text-sm italic active:scale-[0.98] transition-all"><CheckCircle2 size={24} strokeWidth={3} /><span>Simpan Data</span></button>
                    </>
                  ) : modalType === 'package_price' ? (
                    <div className="space-y-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase italic">Pilih Paket</label>
                          <select name="packageName" defaultValue={selectedPackage} required className="w-full px-8 py-5 bg-gray-50 border-2 rounded-[1.8rem] font-black uppercase italic"><option>1 BULAN</option><option>3 BULAN</option><option>6 BULAN</option></select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase italic">Jenjang Pendidikan</label>
                          <select name="level" defaultValue={selectedLevel} required className="w-full px-8 py-5 bg-gray-50 border-2 rounded-[1.8rem] font-black uppercase italic"><option>SD</option><option>SMP</option></select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase italic">Harga Baru (Rp)</label>
                          <input name="price" type="number" required placeholder="INPUT HARGA..." className="w-full px-8 py-5 bg-gray-50 border-2 rounded-[1.8rem] font-black italic" />
                       </div>
                       <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[3rem] shadow-2xl flex items-center justify-center space-x-5 uppercase tracking-[0.4em] text-sm italic active:scale-[0.98] transition-all"><CheckCircle2 size={24} strokeWidth={3} /><span>Simpan Perubahan</span></button>
                    </div>
                  ) : (
                    // Payment forms (income/expense)
                    <div className="space-y-8">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Keterangan Transaksi</label><input name="note" required placeholder="CONTOH: BAYAR LISTRIK / SPP" className="w-full px-8 py-5 bg-gray-50 border-2 rounded-2xl font-black uppercase italic" /></div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Nominal Uang</label><input name="amount" type="number" required placeholder="RP..." className="w-full px-8 py-5 bg-gray-50 border-2 rounded-2xl font-black italic" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase italic">Metode</label><select name="method" required className="w-full px-8 py-5 bg-gray-50 border-2 rounded-2xl font-black uppercase italic"><option value="">-- PILIH --</option><option>TUNAI</option><option>TRANSFER BANK</option></select></div>
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[3rem] shadow-2xl flex items-center justify-center space-x-5 uppercase tracking-[0.4em] text-sm italic active:scale-[0.98] transition-all"><CheckCircle2 size={24} strokeWidth={3} /><span>Simpan Data</span></button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}