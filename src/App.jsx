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
  BookOpen, Lock, X, Search, Filter, Info, AlertOctagon, UserCheck, ListChecks
} from 'lucide-react';

// --- KONFIGURASI FIREBASE PRODUKSI ---
// Ini adalah konfigurasi asli milikmu yang sudah dimasukkan.
const firebaseConfig = {
  apiKey: "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",
  authDomain: "gemilangsystem.firebaseapp.com",
  projectId: "gemilangsystem",
  storageBucket: "gemilangsystem.firebasestorage.app",
  messagingSenderId: "1078433073773",
  appId: "1:1078433073773:web:cdb13ae553efbc1d1bcd64"
};

// --- SMART INITIALIZATION (Anti-Crash) ---
// Mencegah inisialisasi ganda yang sering bikin error di React
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// --- APP ID CONSTANT ---
// Folder penyimpanan data di database. 
// Menggunakan 'gemilang-data-production' agar terpisah dari data test sebelumnya.
const APP_ID = 'gemilang-data-production';

// Helper path yang aman
const getCollection = (name) => collection(db, 'artifacts', APP_ID, 'public', 'data', name);
const getDocRef = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);

// --- KONSTANTA APLIKASI ---
const ADMIN_FEE = 25000;
const PRICING = {
  SD: {
    '1': { price: 250000, installments: 1, label: '1 Bulan' },
    '3': { price: 675000, installments: 2, label: '3 Bulan (Cicil 2x)' },
    '6': { price: 1200000, installments: 3, label: '6 Bulan (Cicil 3x)' }
  },
  SMP: {
    '1': { price: 300000, installments: 1, label: '1 Bulan' },
    '3': { price: 810000, installments: 2, label: '3 Bulan (Cicil 2x)' },
    '6': { price: 1500000, installments: 3, label: '6 Bulan (Cicil 3x)' }
  }
};
const ROOMS = ['MERKURIUS', 'VENUS', 'BUMI', 'MARS', 'JUPITER'];
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// --- HELPER FUNCTIONS ---
const formatRupiah = (num) => new Intl.NumberFormat('id-ID').format(num);
const timeToMinutes = (timeStr) => {
    if(!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};
const isOverlap = (startA, endA, startB, endB) => {
    return Math.max(startA, startB) < Math.min(endA, endB);
};

// --- TOAST NOTIFICATION SYSTEM ---
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

// --- MODAL KONFIRMASI ---
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

// --- KOMPONEN UTAMA ---
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [activeTeacherName, setActiveTeacherName] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    // Fungsi inisialisasi auth yang aman
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
        setInitError("Gagal terhubung ke database. Periksa koneksi internet Anda.");
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (userRole, teacherName = '') => {
    setRole(userRole);
    if (userRole === 'teacher') setActiveTeacherName(teacherName);
  };

  const handleLogout = () => {
    setRole(null);
    setActiveTeacherName('');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-blue-900 text-white font-bold animate-pulse">Memuat Sistem Gemilang...</div>;
  if (initError) return <div className="h-screen flex items-center justify-center bg-red-100 text-red-600 font-bold p-4 text-center">{initError}</div>;

  return (
    <ToastProvider>
       {!role ? <LoginPage onLogin={handleLogin} /> : 
        role === 'admin' ? <AdminDashboard onLogout={handleLogout} /> : 
        <TeacherDashboard teacherName={activeTeacherName} onLogout={handleLogout} />
       }
    </ToastProvider>
  );
}

// --- LOGIN PAGE ---
function LoginPage({ onLogin }) {
  const [view, setView] = useState('admin');
  const [password, setPassword] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [realAdminPass, setRealAdminPass] = useState('admin123');
  const showToast = useToast();

  useEffect(() => {
    const unsub = onSnapshot(getCollection('gemilang_teachers'), (snap) => setTeachers(snap.docs.map(d => d.data().name)));
    const unsubP = onSnapshot(getDocRef('gemilang_settings', 'admin_auth'), (snap) => {
      if(snap.exists() && snap.data().password) setRealAdminPass(snap.data().password);
    });
    return () => { unsub(); unsubP(); };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (view === 'admin') {
      if (password === realAdminPass) { 
        showToast('Login Admin Berhasil', 'success');
        onLogin('admin');
      } else {
        showToast("Password Admin Salah!", 'error');
      }
    } else {
      if (!selectedTeacher) return showToast("Pilih nama Anda!", 'error');
      showToast(`Selamat datang, ${selectedTeacher}`, 'success');
      onLogin('teacher', selectedTeacher);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 font-sans p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-blue-500/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white"><GraduationCap size={32} /></div>
          <h1 className="text-2xl font-bold text-slate-800">Bimbel Gemilang</h1>
          <p className="text-slate-500 text-sm">Sistem Manajemen Terpadu</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button onClick={() => setView('admin')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${view === 'admin' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Admin</button>
          <button onClick={() => setView('guru')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${view === 'guru' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>Guru</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'admin' ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password Admin</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan Password..." />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Guru</label>
              <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                <option value="">-- Pilih Nama Anda --</option>
                {teachers.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <button className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition transform active:scale-95 ${view === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>Masuk System &rarr;</button>
        </form>
      </div>
    </div>
  );
}

// --- CLASS MANAGER ---
function ClassManager() {
    const [classes, setClasses] = useState([]);
    const [view, setView] = useState('list'); 
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Manage Students Modal
    const [isManageStudentOpen, setIsManageStudentOpen] = useState(false);
    const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
    const [tempSelectedStudents, setTempSelectedStudents] = useState([]);

    // Delete Modal
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const showToast = useToast();

    const [form, setForm] = useState({
        day: 'Senin', startTime: '13:00', endTime: '14:30',
        subject: '', room: 'MERKURIUS', pic: '', type: 'Regular', specificDate: '',
        enrolledStudents: [] // Array of Student IDs
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
            
            if (newClass.type === 'Regular' && existing.type === 'Regular') {
                if (newClass.day === existing.day) isDayMatch = true;
            }
            else if (newClass.type === 'Booking' && existing.type === 'Booking') {
                if (newClass.specificDate === existing.specificDate) isDayMatch = true;
            }
            else if (newClass.type === 'Regular' && existing.type === 'Booking') {
                const existingDayName = DAYS[new Date(existing.specificDate).getDay()];
                if (newClass.day === existingDayName) isDayMatch = true;
            }
            else if (newClass.type === 'Booking' && existing.type === 'Regular') {
                if (targetDayName === existing.day) isDayMatch = true;
            }

            if (!isDayMatch) continue;
            const exStart = timeToMinutes(existing.startTime);
            const exEnd = timeToMinutes(existing.endTime);

            if (isOverlap(newStart, newEnd, exStart, exEnd)) {
                return existing;
            }
        }
        return null; 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (timeToMinutes(form.startTime) >= timeToMinutes(form.endTime)) {
            return showToast("Jam selesai harus lebih akhir dari jam mulai!", "error");
        }
        const conflict = checkConflict(form);
        if (conflict) {
            return showToast(`BENTROK RUANGAN! Sudah ada kelas "${conflict.subject}" (${conflict.startTime}-${conflict.endTime}) di ${conflict.room}.`, "error");
        }
        try {
            await addDoc(colRef, { ...form, enrolledStudents: [] });
            showToast("Jadwal Berhasil Disimpan", "success");
            setView('list');
            setForm({...form, subject: ''});
        } catch(err) {
            showToast("Gagal menyimpan data", "error");
        }
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(getDocRef('gemilang_classes', deleteId));
            showToast("Jadwal dihapus", "success");
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        } catch (err) {
            showToast("Gagal menghapus jadwal", "error");
        }
    };

    // --- STUDENT MANAGEMENT LOGIC ---
    const openStudentManager = (cls) => {
        setSelectedClassForStudents(cls);
        setTempSelectedStudents(cls.enrolledStudents || []);
        setIsManageStudentOpen(true);
    };

    const toggleStudent = (studentId) => {
        if (tempSelectedStudents.includes(studentId)) {
            setTempSelectedStudents(prev => prev.filter(id => id !== studentId));
        } else {
            setTempSelectedStudents(prev => [...prev, studentId]);
        }
    };

    const saveStudentEnrollment = async () => {
        if (!selectedClassForStudents) return;
        try {
            await updateDoc(getDocRef('gemilang_classes', selectedClassForStudents.id), {
                enrolledStudents: tempSelectedStudents
            });
            showToast(`Berhasil menyimpan ${tempSelectedStudents.length} siswa di kelas ini.`, "success");
            setIsManageStudentOpen(false);
        } catch (err) {
            showToast("Gagal update siswa.", "error");
        }
    };

    const getClassesForMatrix = () => {
        const selectedDayName = DAYS[new Date(viewDate).getDay()];
        return classes.filter(c => {
            if (c.type === 'Regular' && c.day === selectedDayName) return true;
            if (c.type === 'Booking' && c.specificDate === viewDate) return true;
            return false;
        });
    };
    
    const matrixData = getClassesForMatrix();

    return (
        <div className="space-y-6">
             <ConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDelete}
                title="Hapus Jadwal?"
                message="Anda yakin ingin menghapus jadwal ini? Jadwal yang dihapus tidak dapat dikembalikan."
                isDanger={true}
             />

             {/* MANAGE STUDENTS MODAL */}
             {isManageStudentOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                     <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh]">
                         <div className="p-6 border-b flex justify-between items-center">
                             <div>
                                 <h3 className="font-bold text-lg">Atur Siswa</h3>
                                 <p className="text-xs text-slate-500">Kelas: {selectedClassForStudents?.subject} ({selectedClassForStudents?.day || selectedClassForStudents?.specificDate})</p>
                             </div>
                             <button onClick={() => setIsManageStudentOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                         </div>
                         <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 {students.map(s => {
                                     const isSelected = tempSelectedStudents.includes(s.id);
                                     return (
                                         <div 
                                            key={s.id} 
                                            onClick={() => toggleStudent(s.id)}
                                            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${isSelected ? 'bg-blue-100 border-blue-400' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                                         >
                                             <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                                                 {isSelected && <CheckCircle size={14} className="text-white"/>}
                                             </div>
                                             <div>
                                                 <div className="font-bold text-sm text-slate-700">{s.name}</div>
                                                 <div className="text-xs text-slate-500">{s.grade} - {s.level}</div>
                                             </div>
                                         </div>
                                     )
                                 })}
                             </div>
                         </div>
                         <div className="p-4 border-t flex justify-between items-center bg-white rounded-b-2xl">
                             <span className="text-sm font-bold text-slate-600">{tempSelectedStudents.length} Siswa Dipilih</span>
                             <button onClick={saveStudentEnrollment} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow">Simpan Perubahan</button>
                         </div>
                     </div>
                 </div>
             )}

             <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm gap-4">
                 <div>
                    <h3 className="text-2xl font-bold">Manajemen Ruangan & Jadwal</h3>
                    <p className="text-slate-500 text-sm">Atur jadwal regular dan booking ruangan.</p>
                 </div>
                 <button onClick={() => setView(view === 'list' ? 'form' : 'list')} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition ${view === 'list' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                     {view === 'list' ? <><PlusCircle size={18} /> Booking / Tambah Kelas</> : <><X size={18} /> Batal / Kembali</>}
                 </button>
             </div>

             {view === 'form' && (
                 <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-100 animate-in slide-in-from-top duration-300">
                     <h4 className="font-bold text-lg mb-6 flex items-center gap-2 text-blue-800"><CalendarClock /> Form Jadwal / Booking Ruangan</h4>
                     <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-200 flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase text-blue-600 mb-1 block">Tipe Jadwal</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setForm({...form, type: 'Regular'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.type === 'Regular' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-500 border'}`}>Regular (Mingguan)</button>
                                    <button type="button" onClick={() => setForm({...form, type: 'Booking'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.type === 'Booking' ? 'bg-purple-600 text-white shadow' : 'bg-white text-slate-500 border'}`}>Booking (Sekali)</button>
                                </div>
                            </div>
                        </div>

                        <div>
                             <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                                 {form.type === 'Regular' ? 'Hari (Berulang Tiap Minggu)' : 'Tanggal Booking'}
                             </label>
                             {form.type === 'Regular' ? (
                                 <select value={form.day} onChange={e => setForm({...form, day: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50">
                                     {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                 </select>
                             ) : (
                                 <input type="date" value={form.specificDate} onChange={e => setForm({...form, specificDate: e.target.value})} className="w-full p-3 border rounded-xl bg-purple-50 border-purple-200" required />
                             )}
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Ruangan</label>
                            <select value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 font-bold text-slate-700">
                                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-4">
                             <div className="flex-1">
                                 <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Jam Mulai</label>
                                 <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full p-3 border rounded-xl" required />
                             </div>
                             <div className="flex-1">
                                 <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Jam Selesai</label>
                                 <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full p-3 border rounded-xl" required />
                             </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Mata Pelajaran / Kegiatan</label>
                            <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Contoh: Matematika, Rapat Guru, dll" className="w-full p-3 border rounded-xl" required />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">PIC / Guru</label>
                            <select value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} className="w-full p-3 border rounded-xl" required>
                                <option value="">-- Pilih Penanggung Jawab --</option>
                                {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        
                        <div className="md:col-span-2 pt-4 border-t">
                            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
                                <Save size={20}/> Simpan & Cek Bentrok Otomatis
                            </button>
                        </div>
                     </form>
                 </div>
             )}

             {/* MATRIX VIEW */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Map className="text-blue-600"/> Visualisasi Ketersediaan Ruangan</h3>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                        <span className="text-xs font-bold text-slate-400">PILIH TANGGAL:</span>
                        <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="font-bold text-slate-700 outline-none" />
                    </div>
                </div>
                <div className="overflow-x-auto p-4">
                    <div className="grid grid-cols-5 gap-4 min-w-[800px]">
                        {ROOMS.map(room => (
                            <div key={room} className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-[500px]">
                                <div className="p-3 bg-slate-800 text-white text-center font-bold text-sm rounded-t-xl uppercase tracking-wider">
                                    {room}
                                </div>
                                <div className="flex-1 p-2 space-y-2 overflow-y-auto relative">
                                    {matrixData.filter(c => c.room === room).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(c => (
                                        <div key={c.id} className={`p-3 rounded-lg border text-left shadow-sm relative group hover:scale-[1.02] transition duration-200 ${c.type === 'Booking' ? 'bg-purple-100 border-purple-300' : 'bg-blue-100 border-blue-300'}`}>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-bold bg-white/50 px-1 rounded text-slate-700">{c.startTime} - {c.endTime}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); openStudentManager(c); }} className="text-blue-500 bg-white p-1 rounded hover:bg-blue-50" title="Atur Siswa"><Users size={12}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); confirmDelete(c.id); }} className="text-red-400 hover:text-red-600 bg-white p-1 rounded hover:bg-red-50" title="Hapus"><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                            <div className="font-bold text-sm text-slate-800 mt-1 leading-tight">{c.subject}</div>
                                            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1"><User size={10}/> {c.pic}</div>
                                            <div className="text-[10px] bg-white/60 w-fit px-1 rounded mt-1 text-slate-500 font-bold border border-slate-200">
                                                {c.enrolledStudents?.length || 0} Siswa
                                            </div>
                                            {c.type === 'Booking' && <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-[8px] px-1 rounded font-bold">BOOKING</div>}
                                        </div>
                                    ))}
                                    {matrixData.filter(c => c.room === room).length === 0 && (
                                        <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">Kosong</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        </div>
    );
}

// --- STUDENT MANAGER ---
function StudentManager() {
  const [students, setStudents] = useState([]);
  const [view, setView] = useState('list');
  const [filter, setFilter] = useState('ALL');
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  
  // Modal State
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  const showToast = useToast();
   
  const [formData, setFormData] = useState({
    regDate: new Date().toISOString().split('T')[0],
    name: '', school: '', grade: '',
    fatherName: '', fatherJob: '',
    motherName: '', motherJob: '',
    address: '', emergencyContact: '',
    level: 'SD', duration: '1', discount: 0, receivedAmount: 0, promiseDate: '', paymentMethod: 'Cash'
  });

  const [customDates, setCustomDates] = useState([]);
  const colRef = getCollection('gemilang_students');
  const financeRef = getCollection('gemilang_finance');

  useEffect(() => {
    const unsub = onSnapshot(colRef, (snap) => {
        const sorted = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setStudents(sorted);
    });
    return unsub;
  }, []);

  const calculation = useMemo(() => {
    const pricingConfig = PRICING[formData.level][formData.duration];
    const basePrice = pricingConfig.price;
    const discountAmount = (basePrice * formData.discount) / 100;
    const finalPrice = basePrice - discountAmount;
    const installmentCount = pricingConfig.installments;
    const perInstallment = finalPrice / installmentCount;
    const totalBill = finalPrice + ADMIN_FEE;
    return { basePrice, discountAmount, finalPrice, installmentCount, perInstallment, totalBill };
  }, [formData.level, formData.duration, formData.discount]);

  useEffect(() => {
    const dates = [];
    const startDate = new Date(formData.regDate);
    for (let i = 0; i < calculation.installmentCount; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + 1 + i, 1);
      const year = d.getFullYear(); 
      const month = String(d.getMonth() + 1).padStart(2, '0'); 
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    setCustomDates(dates);
  }, [calculation.installmentCount, formData.regDate]);

  const handleDateChange = (index, val) => { const n = [...customDates]; n[index] = val; setCustomDates(n); };
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    const installmentData = customDates.map((date, index) => ({ id: index + 1, dueDate: date, amount: calculation.perInstallment, status: 'unpaid' }));
    let remainingPayment = Number(formData.receivedAmount) - ADMIN_FEE;
    if (remainingPayment >= calculation.perInstallment) installmentData[0].status = 'paid';

    await addDoc(colRef, { ...formData, discount: Number(formData.discount), pricing: { basePrice: calculation.basePrice, finalPrice: calculation.finalPrice, installmentCount: calculation.installmentCount }, installments: installmentData, adminFeePaid: true, createdAt: new Date().toISOString() });
    if (formData.receivedAmount > 0) {
      await addDoc(financeRef, { type: 'in', amount: Number(formData.receivedAmount), description: `Pendaftaran: ${formData.name}`, method: formData.paymentMethod, createdAt: new Date().toISOString() });
    }
    showToast("Siswa berhasil didaftarkan!", 'success');
    setFormData({ regDate: new Date().toISOString().split('T')[0], name: '', school: '', grade: '', fatherName: '', fatherJob: '', motherName: '', motherJob: '', address: '', emergencyContact: '', level: 'SD', duration: '1', discount: 0, receivedAmount: 0, promiseDate: '', paymentMethod: 'Cash' });
    setView('list');
  };

  const handlePayInstallment = async (student, idx, method) => {
      const installment = student.installments[idx];
      const newInstallments = [...student.installments];
      newInstallments[idx].status = 'paid';
      await updateDoc(getDocRef('gemilang_students', student.id), { installments: newInstallments });
      await addDoc(financeRef, { type: 'in', amount: installment.amount, description: `Cicilan ${student.name} (Ke-${installment.id})`, method: method, createdAt: new Date().toISOString() });
      showToast("Pembayaran diterima & tercatat.", 'success');
  };

  const confirmDeleteStudent = (student) => {
      const hasDebt = student.installments.some(ins => ins.status === 'unpaid');
      setStudentToDelete(student);
      
      if (hasDebt) {
          setDeleteMessage(`PERINGATAN KERAS:\nSiswa a.n ${student.name} masih memiliki tunggakan/cicilan yang BELUM LUNAS.\n\nApakah Anda yakin tetap ingin menghapus data ini?`);
      } else {
          setDeleteMessage(`Apakah Anda yakin ingin menghapus data siswa ${student.name}?`);
      }
      setIsDeleteModalOpen(true);
  };

  const executeDeleteStudent = async () => {
      if (!studentToDelete) return;
      try {
          await deleteDoc(getDocRef('gemilang_students', studentToDelete.id));
          showToast("Data siswa dihapus.", "success");
          setIsDeleteModalOpen(false);
          setStudentToDelete(null);
      } catch (err) {
          showToast("Gagal menghapus data.", "error");
      }
  };

  const filteredStudents = filter === 'ALL' ? students : students.filter(s => s.level === filter);

  if (view === 'form') {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setView('list')} className="mb-4 text-slate-500 hover:text-blue-600 flex items-center gap-2">&larr; Kembali</button>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white"><h2 className="text-xl font-bold flex items-center gap-2"><PlusCircle size={24} /> Pendaftaran Siswa Baru</h2></div>
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <section><h3 className="text-lg font-bold border-b pb-2 mb-4 text-slate-700">1. Identitas Siswa</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><input type="date" name="regDate" value={formData.regDate} onChange={handleInputChange} className="p-3 border rounded-xl" required /><input name="name" value={formData.name} onChange={handleInputChange} placeholder="Nama Lengkap" className="p-3 border rounded-xl" required /><input name="school" value={formData.school} onChange={handleInputChange} placeholder="Sekolah" className="p-3 border rounded-xl" required /><div className="grid grid-cols-2 gap-4"><select name="level" value={formData.level} onChange={handleInputChange} className="p-3 border rounded-xl bg-slate-50 font-bold"><option value="SD">SD</option><option value="SMP">SMP</option></select><input name="grade" value={formData.grade} onChange={handleInputChange} placeholder="Kelas" className="p-3 border rounded-xl" required /></div></div></section>
            <section><h3 className="text-lg font-bold border-b pb-2 mb-4 text-slate-700">2. Data Orang Tua</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><input name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Nama Ayah" className="p-3 border rounded-xl" required /><input name="fatherJob" value={formData.fatherJob} onChange={handleInputChange} placeholder="Pekerjaan Ayah" className="p-3 border rounded-xl" /><input name="motherName" value={formData.motherName} onChange={handleInputChange} placeholder="Nama Ibu" className="p-3 border rounded-xl" required /><input name="motherJob" value={formData.motherJob} onChange={handleInputChange} placeholder="Pekerjaan Ibu" className="p-3 border rounded-xl" /><textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Alamat" className="md:col-span-2 p-3 border rounded-xl" required></textarea><input name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} placeholder="No HP/WA (Wajib)" className="md:col-span-2 p-3 border rounded-xl" required /></div></section>
            <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200"><h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 text-slate-700 flex items-center gap-2"><CreditCard className="text-blue-600"/> 3. Pembayaran & Admin</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-4"><div><label className="block text-sm font-bold mb-1">Durasi</label><select name="duration" value={formData.duration} onChange={handleInputChange} className="w-full p-3 border rounded-xl"><option value="1">1 Bulan</option><option value="3">3 Bulan</option><option value="6">6 Bulan</option></select></div><div><label className="block text-sm font-bold mb-1">Diskon (%)</label><input type="number" name="discount" value={formData.discount} onChange={handleInputChange} placeholder="0" className="w-full p-3 border rounded-xl" /></div><div className="bg-orange-50 p-4 rounded-xl border border-orange-200"><h4 className="text-sm font-bold text-orange-800 mb-2">Jadwal Jatuh Tempo (Auto Awal Bulan)</h4><p className="text-xs text-orange-600 mb-2">Admin bisa ubah tanggal jika perlu:</p><div className="space-y-2 max-h-32 overflow-y-auto">{customDates.map((d, i) => (<div key={i} className="flex items-center gap-2"><span className="text-xs font-bold w-6 text-slate-500">{i+1}.</span><input type="date" value={d} onChange={(e) => handleDateChange(i, e.target.value)} className="text-sm p-1 border rounded w-full" /></div>))}</div></div><div className="bg-white p-4 rounded-xl border border-slate-200"><div className="flex justify-between text-sm mb-1"><span>Paket:</span> <span>Rp {formatRupiah(calculation.finalPrice)}</span></div><div className="flex justify-between text-sm mb-1 text-red-600"><span>Admin:</span> <span>+ Rp {formatRupiah(ADMIN_FEE)}</span></div><div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total:</span> <span>Rp {formatRupiah(calculation.totalBill)}</span></div></div></div><div className="bg-blue-100 p-4 rounded-xl border border-blue-200 h-fit"><label className="block text-sm font-bold text-blue-800 mb-2">Uang Diterima (Rp)</label><input type="number" name="receivedAmount" value={formData.receivedAmount} onChange={handleInputChange} placeholder="Min. 25000" className="w-full p-4 text-xl font-bold text-blue-900 border-2 border-blue-300 rounded-xl focus:ring-blue-500 mb-2" /><label className="block text-sm font-bold text-blue-800 mb-1">Metode Pembayaran</label><select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="w-full p-2 border rounded-lg mb-4 font-bold text-slate-700"><option value="Cash">Cash / Brangkas</option><option value="Transfer">Transfer Bank</option></select>{Number(formData.receivedAmount) < calculation.totalBill && (<div><label className="block text-sm font-bold text-red-600 mb-1 flex items-center gap-1"><CalendarClock size={16}/> Janji Pelunasan</label><input type="date" name="promiseDate" value={formData.promiseDate} onChange={handleInputChange} className="w-full p-2 border border-red-300 rounded-lg text-sm bg-red-50" /><p className="text-xs text-red-500 mt-1 italic">*Sisa Rp {formatRupiah(calculation.totalBill - Number(formData.receivedAmount))} ditagih nanti.</p></div>)}</div></div></section>
            <div className="flex justify-end gap-4 border-t pt-4"><button type="button" onClick={() => setView('list')} className="px-6 py-3 border rounded-xl font-bold text-slate-500">Batal</button><button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700">Simpan</button></div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteStudent}
        title="Konfirmasi Hapus Siswa"
        message={deleteMessage}
        isDanger={true}
      />

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm"><h3 className="text-2xl font-bold">Manajemen Siswa</h3><div className="flex gap-2">{students.length > 0 && (<><button onClick={downloadCSV} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition flex items-center gap-2"><Download size={18} /> Excel</button><button onClick={printPDF} className="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition flex items-center gap-2"><FileText size={18} /> PDF</button></>)}<button onClick={() => setView('form')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition"><PlusCircle size={18} /> Daftar Baru</button></div></div>
      <div className="bg-white p-6 rounded-2xl shadow-sm"><div className="flex gap-2 mb-4">{['ALL', 'SD', 'SMP'].map(f => (<button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-bold ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{f}</button>))}</div><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 text-xs uppercase text-slate-500"><th className="p-4">Siswa</th><th className="p-4">Kontak Ortu</th><th className="p-4">Paket</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{filteredStudents.map(s => (<React.Fragment key={s.id}><tr className="border-b hover:bg-slate-50 transition cursor-pointer" onClick={() => setExpandedStudentId(expandedStudentId === s.id ? null : s.id)}><td className="p-4 font-bold text-slate-700">{s.name}<div className="text-xs font-normal text-slate-400">{s.school}</div></td><td className="p-4 text-sm">{s.fatherName}<div className="text-xs text-green-600 font-bold">{s.emergencyContact}</div></td><td className="p-4 text-sm">{s.level} - {s.duration} Bulan</td><td className="p-4 text-center">{s.installments.every(i => i.status === 'paid') ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">LUNAS</span> : <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">CICILAN</span>}</td><td className="p-4 text-right"><button className="text-blue-500 hover:bg-blue-50 p-2 rounded mr-1"><CreditCard size={18}/></button><button onClick={(e) => { e.stopPropagation(); confirmDeleteStudent(s); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button></td></tr>{expandedStudentId === s.id && (<tr className="bg-blue-50/50"><td colSpan="5" className="p-4"><div className="bg-white border border-blue-200 rounded-xl p-4"><h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><CreditCard size={16}/> Kartu SPP</h4><div className="flex flex-col gap-2"><div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-sm font-bold text-slate-600">Admin Fee</span><span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Lunas (Rp 25.000)</span></div>{s.installments.map((ins, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm"><div><div className="text-sm font-bold text-slate-700">Cicilan Ke-{ins.id}</div><div className="text-xs text-slate-500">Jatuh Tempo: {ins.dueDate}</div></div><div className="flex items-center gap-4"><span className="font-mono font-bold text-slate-700">Rp {formatRupiah(ins.amount)}</span>{ins.status === 'paid' ? (<span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Lunas</span>) : (<div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg"><select className="text-xs p-1 rounded border" onChange={(e) => handlePayInstallment(s, idx, e.target.value)} value=""><option value="" disabled>Bayar...</option><option value="Cash">Cash</option><option value="Transfer">Transfer</option></select></div>)}</div></div>))}{s.promiseDate && !s.installments.every(i => i.status === 'paid') && (<div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2"><CalendarClock size={14}/> <strong>Janji Bayar Sisa:</strong> {s.promiseDate}</div>)}</div></div></td></tr>)}</React.Fragment>))}</tbody></table></div></div>
  );
}

// --- ADMIN DASHBOARD ---
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col transition-all duration-300 shadow-2xl z-20">
        <div className="p-4 md:p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shrink-0">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-lg leading-tight">GEMILANG</h1>
            <p className="text-xs text-slate-400">Admin Dashboard</p>
          </div>
        </div>
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
          <MenuButton id="home" icon={<LayoutDashboard />} label="Beranda" active={activeTab} set={setActiveTab} />
          <MenuButton id="students" icon={<Users />} label="Data Siswa" active={activeTab} set={setActiveTab} />
          <MenuButton id="finance" icon={<DollarSign />} label="Keuangan" active={activeTab} set={setActiveTab} />
          <MenuButton id="teachers" icon={<Briefcase />} label="Data & Absen Guru" active={activeTab} set={setActiveTab} />
          <MenuButton id="classes" icon={<Calendar />} label="Jadwal & Kelas" active={activeTab} set={setActiveTab} />
          <div className="pt-6 mt-6 border-t border-slate-800">
            <MenuButton id="settings" icon={<Settings />} label="Pengaturan" active={activeTab} set={setActiveTab} />
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-6 py-3 text-red-400 hover:text-red-300 hover:bg-slate-800/50 transition-all mt-2">
              <LogOut size={20} /> <span className="hidden md:inline font-medium text-sm">Keluar</span>
            </button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto relative bg-slate-50">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'students' && <StudentManager />}
          {activeTab === 'teachers' && <TeacherManager />}
          {activeTab === 'classes' && <ClassManager />}
          {activeTab === 'finance' && <FinanceManager />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

function MenuButton({ id, icon, label, active, set }) {
  const isActive = active === id;
  return (
    <button onClick={() => set(id)} className={`w-full flex items-center gap-3 px-4 md:px-6 py-3 transition-all relative ${isActive ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>}
      <span className={isActive ? 'text-blue-400' : ''}>{icon}</span>
      <span className="hidden md:inline font-medium text-sm">{label}</span>
    </button>
  );
}

// --- TEACHER DASHBOARD ---
function TeacherDashboard({ teacherName, onLogout }) {
  const [activeView, setActiveView] = useState('home'); // 'home' | 'attendance'
  const [attendanceCode, setAttendanceCode] = useState('');
  const [time, setTime] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const showToast = useToast();

  useEffect(() => {
    const unsubHistory = onSnapshot(getCollection('gemilang_attendance'), (snap) => {
      const myLogs = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(Log => Log.teacherName === teacherName).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
      setHistory(myLogs);
    });
    const unsubClasses = onSnapshot(getCollection('gemilang_classes'), (snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubStudents = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { unsubHistory(); unsubClasses(); unsubStudents(); clearInterval(timer); };
  }, [teacherName]);

  const todaySchedule = useMemo(() => {
    const dayName = DAYS[time.getDay()];
    const dateStr = time.toISOString().split('T')[0];
    return classes.filter(c => (c.type === 'Regular' && c.day === dayName) || (c.type === 'Booking' && c.specificDate === dateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime));
  }, [classes, time]);

  const myTodayClasses = useMemo(() => {
      return todaySchedule.filter(c => c.pic && c.pic.toLowerCase().includes(teacherName.toLowerCase()));
  }, [todaySchedule, teacherName]);

  const handleAbsen = async (e) => {
    e.preventDefault();
    if (!attendanceCode) return;
    const settingsRef = getDocRef('gemilang_settings', 'attendance');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      const activeCode = settingsSnap.data().code;
      if (attendanceCode === activeCode) {
        await addDoc(getCollection('gemilang_attendance'), { teacherName, timestamp: new Date().toISOString(), date: new Date().toLocaleDateString('id-ID'), time: new Date().toLocaleTimeString('id-ID'), status: 'Hadir' });
        showToast(`Absensi Berhasil! Semangat, ${teacherName}.`, 'success');
        setAttendanceCode('');
      } else { showToast("Kode Salah!", 'error'); }
    } else { showToast("Sistem Error.", 'error'); }
  };

  const handleStudentAttendanceSubmit = async () => {
      if (!selectedClassForAttendance) return;
      const todayStr = new Date().toLocaleDateString('id-ID');
      
      const promises = Object.keys(attendanceStatuses).map(async (studentId) => {
          const status = attendanceStatuses[studentId];
          await addDoc(getCollection('gemilang_class_attendance'), {
              classId: selectedClassForAttendance.id,
              className: selectedClassForAttendance.subject,
              studentId: studentId,
              status: status,
              date: todayStr,
              teacherName: teacherName,
              timestamp: new Date().toISOString()
          });
      });

      await Promise.all(promises);
      showToast("Data Absensi Siswa Tersimpan!", "success");
      setSelectedClassForAttendance(null);
      setAttendanceStatuses({});
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="bg-purple-700 text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Halo, {teacherName}</h1><p className="text-purple-200 text-sm">Dashboard Guru • {time.toLocaleDateString('id-ID', {weekday: 'long', day:'numeric', month:'long', year:'numeric'})}</p></div>
          <div className="flex gap-2">
              <button onClick={() => setActiveView('home')} className={`px-4 py-2 rounded-lg font-bold transition ${activeView === 'home' ? 'bg-white text-purple-700' : 'bg-purple-800 text-white hover:bg-purple-900'}`}>Beranda</button>
              <button onClick={() => setActiveView('attendance')} className={`px-4 py-2 rounded-lg font-bold transition ${activeView === 'attendance' ? 'bg-white text-purple-700' : 'bg-purple-800 text-white hover:bg-purple-900'}`}>Absensi Siswa</button>
              <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold transition flex items-center gap-1"><LogOut size={16}/> Keluar</button>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        
        {activeView === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center flex flex-col justify-center">
                    <h2 className="text-slate-500 font-bold mb-2 tracking-wide text-xs uppercase">Konfirmasi Kehadiran Anda</h2>
                    <div className="text-5xl font-mono font-bold text-slate-800 mb-6 tracking-tight">{time.toLocaleTimeString('id-ID')}</div>
                    <form onSubmit={handleAbsen} className="max-w-xs mx-auto space-y-4 w-full">
                        <input type="text" value={attendanceCode} onChange={e => setAttendanceCode(e.target.value.toUpperCase())} className="w-full text-center text-2xl font-bold tracking-widest p-4 border-2 border-purple-200 rounded-2xl focus:border-purple-600 outline-none uppercase placeholder:text-slate-200" placeholder="KODE" maxLength={4} />
                        <button className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"><ClipboardCheck /> KONFIRMASI HADIR</button>
                    </form>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700"><Clock className="text-slate-400"/> Riwayat Kehadiran Anda</h3>
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs"><tr><th className="p-3">Tanggal</th><th className="p-3">Jam Masuk</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{history.map(h => (<tr key={h.id} className="hover:bg-slate-50"><td className="p-3">{h.date}</td><td className="p-3 font-mono font-bold text-slate-700">{h.time}</td><td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Hadir</span></td></tr>))}{history.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-400 italic">Belum ada data absensi.</td></tr>}</tbody></table></div>
                </div>
            </div>
        )}

        {activeView === 'attendance' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {!selectedClassForAttendance ? (
                    <div className="p-6">
                        <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2"><ListChecks className="text-purple-600"/> Pilih Kelas Untuk Diabsen</h3>
                        <p className="text-slate-500 text-sm mb-4">Hanya kelas yang Anda ajar HARI INI yang muncul di sini.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myTodayClasses.length === 0 && <div className="text-slate-400 italic p-4 border rounded-xl text-center">Tidak ada jadwal mengajar hari ini.</div>}
                            {myTodayClasses.map(c => (
                                <div key={c.id} onClick={() => setSelectedClassForAttendance(c)} className="border p-4 rounded-xl hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition group">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-purple-700">{c.subject}</h4>
                                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{c.startTime}</span>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-2"><MapPin size={14}/> {c.room}</div>
                                    <div className="mt-3 text-xs font-bold text-purple-600 bg-purple-100 w-fit px-2 py-1 rounded flex items-center gap-1"><Users size={12}/> {c.enrolledStudents?.length || 0} Siswa</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-[600px]">
                        <div className="p-4 border-b bg-purple-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-purple-900">{selectedClassForAttendance.subject}</h3>
                                <p className="text-xs text-purple-600">{selectedClassForAttendance.room} • {selectedClassForAttendance.startTime}</p>
                            </div>
                            <button onClick={() => setSelectedClassForAttendance(null)} className="text-slate-400 hover:text-slate-600"><X/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(selectedClassForAttendance.enrolledStudents || []).length === 0 && <div className="text-center text-slate-400 mt-10">Belum ada siswa di kelas ini. Minta Admin update data.</div>}
                            {(selectedClassForAttendance.enrolledStudents || []).map(studentId => {
                                const s = students.find(st => st.id === studentId);
                                if (!s) return null;
                                return (
                                    <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl bg-white shadow-sm gap-4">
                                        <div>
                                            <div className="font-bold text-slate-800">{s.name}</div>
                                            <div className="text-xs text-slate-500">Wali: {s.emergencyContact}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {['Hadir', 'Ijin', 'Alpha'].map(status => (
                                                <button 
                                                    key={status}
                                                    onClick={() => setAttendanceStatuses(prev => ({...prev, [s.id]: status}))}
                                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold border transition ${attendanceStatuses[s.id] === status 
                                                        ? (status === 'Hadir' ? 'bg-green-600 text-white border-green-600' : status === 'Ijin' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-red-600 text-white border-red-600') 
                                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="p-4 border-t bg-white">
                            <button onClick={handleStudentAttendanceSubmit} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg">Simpan Absensi Kelas</button>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
}

// --- HOME DASHBOARD ---
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
    const unsubClasses = onSnapshot(getCollection('gemilang_classes'), (snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubStudents = onSnapshot(getCollection('gemilang_students'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    // Listen for today's absences
    const todayStr = new Date().toLocaleDateString('id-ID');
    const qAbsence = query(getCollection('gemilang_class_attendance'), where('date', '==', todayStr));
    const unsubAbsence = onSnapshot(qAbsence, (snap) => {
        const data = snap.docs.map(d => d.data()).filter(d => d.status !== 'Hadir');
        setAbsences(data);
    });

    return () => { clearInterval(timer); unsubClasses(); unsubStudents(); unsubAbsence(); };
  }, []);

  const todayClasses = useMemo(() => {
    const dayName = DAYS[today.getDay()];
    const dateStr = today.toISOString().split('T')[0];
    return classes.filter(c => (c.type === 'Regular' && c.day === dayName) || (c.type === 'Booking' && c.specificDate === dateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime));
  }, [classes, today]);

  const duePayments = useMemo(() => {
    let dues = [];
    const todayStr = today.toISOString().split('T')[0];
    students.forEach(s => {
      if (s.installments) {
        s.installments.forEach(ins => {
          if(ins.status === 'unpaid' && ins.dueDate <= todayStr) {
            dues.push({ ...ins, studentName: s.name, contact: s.emergencyContact, parent: s.fatherName });
          }
        });
      }
    });
    return dues;
  }, [students, today]);

  const startBell = () => {
    if (bellStatus) return; 
    setBellStatus("🔔 BUNYI...");
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext; 
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current; 
      if (ctx.state === 'suspended') ctx.resume();
      const gain = ctx.createGain(); gain.connect(ctx.destination); gain.gain.setValueAtTime(0.4, ctx.currentTime);
      const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.setValueAtTime(600, ctx.currentTime); o1.connect(gain); o1.start();
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.setValueAtTime(800, ctx.currentTime); o2.connect(gain); o2.start();
      oscillatorRef.current = { stop: () => { o1.stop(); o2.stop(); } }; gainNodeRef.current = gain;
    } catch(e){}
  };
  
  const stopBell = () => { setBellStatus(null); if(gainNodeRef.current) { gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05); setTimeout(()=>oscillatorRef.current?.stop(), 50); }};
  
  const sendWA = (num, msg) => { 
      if(!num) return showToast("No HP Kosong", 'error'); 
      let n = num.replace(/\D/g,''); 
      if(n.startsWith('0')) n='62'+n.substring(1); 
      window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`,'_blank'); 
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="relative z-10">
          <h2 className="text-blue-200 font-semibold mb-1">{today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</h2>
          <h1 className="text-5xl font-bold font-mono tracking-wider">{today.toLocaleTimeString('id-ID')}</h1>
          <div className="flex gap-4 mt-6">
             <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg"><span className="block text-2xl font-bold">{todayClasses.length}</span><span className="text-xs text-blue-100">Kelas Hari Ini</span></div>
             <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg"><span className="block text-2xl font-bold text-yellow-300">{duePayments.length}</span><span className="text-xs text-blue-100">Jatuh Tempo</span></div>
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

      {/* ABSENSI REPORT CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="p-4 border-b bg-red-50 flex items-center gap-2">
              <UserCheck className="text-red-600"/> 
              <h3 className="font-bold text-red-900">Laporan Ketidakhadiran Hari Ini</h3>
          </div>
          <div className="p-4 overflow-x-auto">
              {absences.length === 0 ? (
                  <p className="text-center text-slate-400 italic py-4">Semua siswa hadir (atau belum diabsen).</p>
              ) : (
                  <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                          <tr>
                              <th className="p-3">Siswa</th>
                              <th className="p-3">Kelas</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Hubungi Wali</th>
                          </tr>
                      </thead>
                      <tbody>
                          {absences.map((ab, i) => {
                              const s = students.find(st => st.id === ab.studentId);
                              if (!s) return null;
                              return (
                                  <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                      <td className="p-3 font-bold text-slate-700">{s.name}</td>
                                      <td className="p-3 text-slate-600">{ab.className}</td>
                                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold text-white ${ab.status === 'Alpha' ? 'bg-red-500' : 'bg-yellow-500'}`}>{ab.status}</span></td>
                                      <td className="p-3 text-right">
                                          <button 
                                            onClick={() => sendWA(s.emergencyContact, `Halo Bapak/Ibu Wali dari ${s.name}, kami menginformasikan bahwa siswa belum hadir di kelas ${ab.className} hari ini. Mohon konfirmasinya. Terima kasih.`)}
                                            className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-xs font-bold ml-auto hover:bg-green-700"
                                          >
                                              <MessageCircle size={14}/> WA Wali
                                          </button>
                                      </td>
                                  </tr>
                              )
                          })}
                      </tbody>
                  </table>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <div className="p-4 border-b bg-blue-50 rounded-t-2xl font-bold text-slate-800 flex gap-2"><Calendar className="text-blue-600"/> Jadwal Hari Ini</div>
          <div className="p-4 overflow-y-auto space-y-3 flex-1">{todayClasses.length===0?<div className="text-center text-slate-400 mt-10">Tidak ada kelas.</div>:todayClasses.map(c=>(<div key={c.id} className="p-3 border rounded-xl flex justify-between items-center hover:bg-slate-50"><div><div className="font-bold">{c.subject}</div><div className="text-xs text-slate-500">{c.startTime}-{c.endTime} • <span className="font-bold text-orange-600">{c.room}</span></div></div><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{c.pic}</span></div>))}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <div className="p-4 border-b bg-red-50 rounded-t-2xl font-bold text-slate-800 flex gap-2"><AlertTriangle className="text-red-500"/> Tagihan Perlu Ditagih</div>
          <div className="p-4 overflow-y-auto space-y-3 flex-1">{duePayments.length===0?<div className="text-center text-slate-400 mt-10">Aman.</div>:duePayments.map((item,i)=>(<div key={i} className="p-3 border border-red-100 bg-red-50/30 rounded-xl flex justify-between items-center"><div><div className="font-bold text-slate-800">{item.studentName}</div><div className="text-xs text-red-500 font-bold">Rp {formatRupiah(item.amount)}</div></div><button onClick={()=>sendWA(item.contact, `Halo ${item.studentName}, tagihan Rp ${formatRupiah(item.amount)} jatuh tempo.`)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold flex gap-1"><MessageCircle size={12}/> WA</button></div>))}</div>
        </div>
      </div>
    </div>
  );
}

// --- TEACHER MANAGER ---
function TeacherManager() {
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [attendanceCode, setAttendanceCode] = useState('');
  const [activeCode, setActiveCode] = useState('...');
  const [logs, setLogs] = useState([]);
  const showToast = useToast();
  const colRef = getCollection('gemilang_teachers');
  useEffect(() => {
    const unsubTeachers = onSnapshot(colRef, (snap) => setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSettings = onSnapshot(getDocRef('gemilang_settings', 'attendance'), (snap) => { if(snap.exists()) setActiveCode(snap.data().code); });
    const unsubLogs = onSnapshot(getCollection('gemilang_attendance'), (snap) => { const sorted = snap.docs.map(d => ({id:d.id, ...d.data()})).sort((a,b) => b.timestamp.localeCompare(a.timestamp)); setLogs(sorted); });
    return () => { unsubTeachers(); unsubSettings(); unsubLogs(); };
  }, []);
  const handleAdd = async (e) => { e.preventDefault(); if (!name || !subject) return; await addDoc(colRef, { name, subject, createdAt: new Date().toISOString() }); setName(''); setSubject(''); showToast("Guru ditambahkan", "success"); };
  const handleSetCode = async () => { await setDoc(getDocRef('gemilang_settings', 'attendance'), { code: attendanceCode.toUpperCase() }); showToast("Kode Absen Diperbarui!", "success"); setAttendanceCode(''); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Key className="text-orange-600"/> Setup Kode Absen</h3><div className="p-4 bg-orange-50 rounded-xl mb-4 text-center border border-orange-200"><span className="text-xs text-orange-600 uppercase font-bold">Kode Aktif Saat Ini</span><div className="text-3xl font-mono font-bold text-orange-800 tracking-widest mt-1">{activeCode}</div></div><div className="flex gap-2"><input value={attendanceCode} onChange={e => setAttendanceCode(e.target.value.toUpperCase())} className="flex-1 p-3 border rounded-xl uppercase text-center font-bold" placeholder="Kode Baru" maxLength={4} /><button onClick={handleSetCode} className="bg-orange-600 text-white px-4 rounded-xl font-bold hover:bg-orange-700">Set</button></div></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><GraduationCap className="text-purple-600"/> Input Guru Baru</h3><form onSubmit={handleAdd} className="space-y-4"><input value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-xl outline-none" placeholder="Nama Guru" /><input value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 border rounded-xl outline-none" placeholder="Mata Pelajaran" /><button className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700">Simpan Guru</button></form></div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm lg:h-[600px] flex flex-col"><h3 className="font-bold text-lg mb-4">Daftar Pengajar</h3><div className="space-y-3 overflow-y-auto flex-1 pr-2">{teachers.map(t => (<div key={t.id} className="border p-3 rounded-xl flex justify-between items-center hover:bg-slate-50"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">{t.name.charAt(0)}</div><div><h4 className="font-bold text-slate-700">{t.name}</h4><p className="text-xs text-slate-500">{t.subject}</p></div></div><button onClick={() => deleteDoc(getDocRef('gemilang_teachers', t.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></div>))}</div></div>
      <div className="bg-white p-6 rounded-2xl shadow-sm lg:h-[600px] flex flex-col"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="text-blue-600"/> Log Absensi Realtime</h3><div className="space-y-3 overflow-y-auto flex-1 pr-2">{logs.length === 0 && <p className="text-slate-400 text-center text-sm mt-10">Belum ada data absensi.</p>}{logs.map(log => (<div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"><div><div className="font-bold text-slate-700">{log.teacherName}</div><div className="text-xs text-slate-500">{log.date}</div></div><div className="text-right"><div className="font-mono font-bold text-blue-600">{log.time}</div><div className="text-[10px] text-green-600 font-bold uppercase">Hadir</div></div></div>))}</div></div>
    </div>
  );
}

// --- FINANCE MANAGER ---
function FinanceManager() {
  const [finances, setFinances] = useState([]);
  const [students, setStudents] = useState([]);
  const [type, setType] = useState('in');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [method, setMethod] = useState('Cash'); 
  const showToast = useToast();
  const colRef = getCollection('gemilang_finance');
  const studentRef = getCollection('gemilang_students');
  useEffect(() => {
    const unsubFinance = onSnapshot(colRef, (snap) => { const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt.localeCompare(a.createdAt)); setFinances(sorted); });
    const unsubStudents = onSnapshot(studentRef, (snap) => { setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => { unsubFinance(); unsubStudents(); };
  }, []);
  const handleAdd = async (e) => { e.preventDefault(); if (!amount || !desc) return; await addDoc(colRef, { type, amount: parseInt(amount), description: desc, method, createdAt: new Date().toISOString() }); setAmount(''); setDesc(''); showToast("Transaksi dicatat", "success"); };
  const totalIn = finances.filter(f => f.type === 'in').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = finances.filter(f => f.type === 'out').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIn - totalOut;
  const cashIn = finances.filter(f => f.type === 'in' && f.method === 'Cash').reduce((acc, curr) => acc + curr.amount, 0);
  const cashOut = finances.filter(f => f.type === 'out' && f.method === 'Cash').reduce((acc, curr) => acc + curr.amount, 0);
  const cashBalance = cashIn - cashOut;
  const bankIn = finances.filter(f => f.type === 'in' && f.method === 'Transfer').reduce((acc, curr) => acc + curr.amount, 0);
  const bankOut = finances.filter(f => f.type === 'out' && f.method === 'Transfer').reduce((acc, curr) => acc + curr.amount, 0);
  const bankBalance = bankIn - bankOut;
  const totalReceivable = useMemo(() => { let total = 0; students.forEach(s => { if(s.installments) { s.installments.forEach(ins => { if(ins.status === 'unpaid') total += ins.amount; }); } }); return total; }, [students]);
  const maxVal = Math.max(totalIn, totalOut) || 1;
  const inHeight = (totalIn / maxVal) * 100;
  const outHeight = (totalOut / maxVal) * 100;
  const downloadReportPDF = () => { const w = window.open('','','height=600,width=800'); w.document.write(`<html><head><style>body{font-family:Arial,sans-serif}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #000;padding:8px;text-align:left}h1,h3{text-align:center}.sum{margin:20px 0;padding:10px;border:1px solid #000;display:flex;justify-content:space-around;font-weight:bold}</style></head><body><h1>Laporan Keuangan Bimbel Gemilang</h1><p style="text-align:center">Dicetak: ${new Date().toLocaleString('id-ID')}</p><div class="sum"><div>Saldo Total: Rp ${formatRupiah(balance)}</div><div>Cash (Brangkas): Rp ${formatRupiah(cashBalance)}</div><div>Bank (Transfer): Rp ${formatRupiah(bankBalance)}</div></div><div class="sum" style="background:#f9f9f9"><div>Total Masuk: Rp ${formatRupiah(totalIn)}</div><div>Total Keluar: Rp ${formatRupiah(totalOut)}</div><div>Piutang (Belum Lunas): Rp ${formatRupiah(totalReceivable)}</div></div><h3>Riwayat Transaksi</h3><table><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Metode</th><th>Masuk</th><th>Keluar</th></tr></thead><tbody>${finances.map(f => `<tr><td>${new Date(f.createdAt).toLocaleDateString('id-ID')}</td><td>${f.description}</td><td>${f.method}</td><td style="color:green">${f.type === 'in' ? formatRupiah(f.amount) : '-'}</td><td style="color:red">${f.type === 'out' ? formatRupiah(f.amount) : '-'}</td></tr>`).join('')}</tbody></table><script>window.print();</script></body></html>`); w.document.close(); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h3 className="text-xl font-bold">Keuangan</h3><button onClick={downloadReportPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-blue-700 transition"><FileText size={18} /> Laporan PDF</button></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg"><p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Total Saldo Aktif</p><h3 className="text-3xl font-bold">Rp {formatRupiah(balance)}</h3><div className="mt-4 flex gap-2 text-xs"><div className="bg-slate-700 px-2 py-1 rounded flex items-center gap-1"><Wallet size={12}/> Cash: {formatRupiah(cashBalance)}</div><div className="bg-slate-700 px-2 py-1 rounded flex items-center gap-1"><Landmark size={12}/> Bank: {formatRupiah(bankBalance)}</div></div></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100"><p className="text-orange-500 text-xs mb-1 uppercase font-bold">Potensi / Piutang</p><h3 className="text-2xl font-bold text-slate-800">Rp {formatRupiah(totalReceivable)}</h3><p className="text-xs text-slate-400 mt-1">Total tagihan siswa belum lunas</p></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100"><div className="flex justify-between items-center"><p className="text-green-600 text-xs uppercase font-bold">Pemasukan</p><TrendingUp size={16} className="text-green-500"/></div><h3 className="text-xl font-bold text-slate-800 mt-2">Rp {formatRupiah(totalIn)}</h3></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100"><div className="flex justify-between items-center"><p className="text-red-600 text-xs uppercase font-bold">Pengeluaran</p><TrendingDown size={16} className="text-red-500"/></div><h3 className="text-xl font-bold text-slate-800 mt-2">Rp {formatRupiah(totalOut)}</h3></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm h-fit border border-slate-200"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><DollarSign className="text-blue-600"/> Input Transaksi Lain</h3><form onSubmit={handleAdd} className="space-y-4"><div className="flex gap-2 p-1 bg-slate-100 rounded-xl"><button type="button" onClick={() => setType('in')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${type === 'in' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Masuk</button><button type="button" onClick={() => setType('out')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${type === 'out' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Keluar</button></div><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Nominal (Rp)" className="w-full p-3 border rounded-xl outline-none" /><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Keterangan (Gaji/Beli Spidol/dll)" className="w-full p-3 border rounded-xl outline-none" /><select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-3 border rounded-xl outline-none bg-slate-50"><option value="Cash">Cash / Brangkas</option><option value="Transfer">Transfer Bank</option></select><button className={`w-full py-3 rounded-xl font-bold text-white ${type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Simpan Transaksi</button></form></div>
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><PieChart className="text-purple-600"/> Arus Kas</h3><div className="flex items-end gap-4 h-32 pl-4 border-l border-slate-200"><div className="flex-1 flex flex-col justify-end gap-2 group"><div className="bg-green-500 rounded-t-lg transition-all group-hover:bg-green-600 relative" style={{height: `${inHeight}%`}}><div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">{formatRupiah(totalIn)}</div></div><div className="text-center text-xs font-bold text-slate-500">Pemasukan</div></div><div className="flex-1 flex flex-col justify-end gap-2 group"><div className="bg-red-500 rounded-t-lg transition-all group-hover:bg-red-600 relative" style={{height: `${outHeight}%`}}><div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">{formatRupiah(totalOut)}</div></div><div className="text-center text-xs font-bold text-slate-500">Pengeluaran</div></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h3 className="font-bold text-lg mb-4">Riwayat Transaksi Terakhir</h3><div className="space-y-3">{finances.slice(0, 5).map(f => (<div key={f.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition"><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${f.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{f.type === 'in' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}</div><div><p className="font-medium text-slate-700 text-sm">{f.description}</p><p className="text-[10px] text-slate-400 flex items-center gap-1">{new Date(f.createdAt).toLocaleDateString()} • <span className={`font-bold ${f.method === 'Cash' ? 'text-orange-500' : 'text-blue-500'}`}>{f.method}</span></p></div></div><div className="flex items-center gap-4"><span className={`font-bold text-sm ${f.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{f.type === 'in' ? '+' : '-'} Rp {formatRupiah(f.amount)}</span><button onClick={() => deleteDoc(getDocRef('gemilang_finance', f.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></div></div>))}{finances.length > 5 && <p className="text-center text-xs text-slate-400 mt-2">Scroll data di database untuk melihat lebih banyak.</p>}</div></div>
        </div>
      </div>
    </div>
  );
}

// --- SETTINGS VIEW ---
function SettingsView() {
  const [newPass, setNewPass] = useState('');
  const showToast = useToast();
  const handleChangePass = async () => { if(!newPass) return showToast("Sandi tidak boleh kosong", 'error'); await setDoc(getDocRef('gemilang_settings', 'admin_auth'), { password: newPass }); showToast("Sandi Admin Berhasil Diubah!", 'success'); setNewPass(''); };
  const resetData = async () => { if(!window.confirm("PERINGATAN: Ini akan menghapus SEMUA data (Siswa, Guru, Keuangan) di aplikasi ini. Lanjutkan?")) return; showToast("Mohon hapus data secara manual melalui menu masing-masing.", 'info'); };
  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"><h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2"><Lock className="text-blue-600"/> Keamanan Admin</h3><div className="flex gap-4 items-end"><div className="flex-1"><label className="block text-sm font-bold text-slate-500 mb-1">Ganti Password Admin</label><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan Password Baru..." /></div><button onClick={handleChangePass} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md">Simpan</button></div></div>
       <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"><h3 className="text-xl font-bold mb-6 text-slate-800">Status Sistem</h3><div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6"><h4 className="font-bold text-blue-800 mb-2">Status Aplikasi</h4><p className="text-sm text-blue-600">Aplikasi berjalan dalam mode <strong>Cloud Artifact Production</strong>. Data tersimpan aman di infrastruktur Google Cloud.</p></div><div className="pt-6 border-t border-slate-100"><button onClick={resetData} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg transition border border-red-200 w-full justify-center font-bold"><Trash2 size={18} /> Reset Database (Hapus Semua Data)</button></div></div>
    </div>
  );
}