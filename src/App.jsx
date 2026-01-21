import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  CheckSquare, 
  LogOut, 
  Plus, 
  Search,
  School,
  UserCheck
} from 'lucide-react';

// --- 1. KONFIGURASI FIREBASE (EXISTING) ---
const firebaseConfig = {
  apiKey: "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",
  authDomain: "gemilangsystem.firebaseapp.com",
  projectId: "gemilangsystem",
  storageBucket: "gemilangsystem.firebasestorage.app",
  messagingSenderId: "1078433073773",
  appId: "1:1078433073773:web:cdb13ae553efbc1d1bcd64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 2. KOMPONEN UTAMA ---
export default function App() {
  // State Global
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'ADMIN' or 'GURU'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // State Data (Disinkronkan dengan Firestore)
  const [students, setStudents] = useState([]);

  // --- AUTHENTICATION SETUP ---
  useEffect(() => {
    // 1. Auth Init
    const initAuth = async () => {
        // Menggunakan Anonymous login untuk demo lingkungan ini
        // Pada produksi asli, ini akan menggunakan sistem Auth yang sudah ada
        await signInAnonymously(auth);
    };
    initAuth();

    // 2. Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // Reset role on logout/login change logic handled in Login component
    });

    return () => unsubscribeAuth();
  }, []);

  // --- DATA SYNC (REALTIME) ---
  useEffect(() => {
    // Hanya sync jika user sudah login (optimasi read)
    if (!user) return;

    // QUERY: Ambil semua students, urutkan berdasarkan tanggalDaftar descending
    // Menggunakan try-catch untuk safety jika index belum dibuat
    const q = query(collection(db, 'students'), orderBy('tanggalDaftar', 'desc'));
    
    const unsubscribeStudents = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    }, (error) => {
      console.error("Sync Error:", error);
      // Fallback jika query complex gagal (biasanya karena index), ambil raw collection
      // Ini menjaga aplikasi tetap jalan meski tanpa sorting server-side
      const fallbackUnsub = onSnapshot(collection(db, 'students'), (snap) => {
        const rawData = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setStudents(rawData);
      });
      return fallbackUnsub;
    });

    return () => unsubscribeStudents();
  }, [user]);

  // --- FUNGSI LOGOUT ---
  const handleLogout = () => {
    setRole(null);
    setActiveTab('dashboard');
  };

  // --- RENDER ---
  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100">Loading System...</div>;

  if (!role) {
    return <LoginPage setRole={setRole} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* SIDEBAR */}
      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Header role={role} title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
        
        <div className="mt-6">
          {activeTab === 'dashboard' && <Dashboard role={role} students={students} />}
          {activeTab === 'students' && <StudentManagement role={role} students={students} />}
          {/* Placeholder tabs for future features */}
          {activeTab === 'jadwal' && <div className="p-4 bg-white rounded shadow">Fitur Jadwal (Coming Soon)</div>}
          {activeTab === 'keuangan' && <div className="p-4 bg-white rounded shadow">Fitur Keuangan (Coming Soon)</div>}
        </div>
      </main>
    </div>
  );
}

// --- 3. SUB-COMPONENTS (UI & LOGIC) ---

// Login Page (Simpel untuk Demo Role)
function LoginPage({ setRole }) {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // HARDCODED LOGIC FOR DEMO PURPOSE - Sesuai instruksi "Login Admin" & "Guru"
    if (inputCode === 'admin123') {
      setRole('ADMIN');
    } else if (inputCode === 'guru123') {
      setRole('GURU');
    } else {
      setError('Kode akses salah! (Coba: admin123 atau guru123)');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-900 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">GEMILANG</h1>
          <p className="text-gray-500">Sistem Manajemen Bimbingan Belajar</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kode Akses / Password</label>
            <input 
              type="password" 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Masukkan kode..."
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
            Masuk Sistem
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>Admin: admin123 | Guru: guru123</p>
        </div>
      </div>
    </div>
  );
}

// Sidebar Navigation
function Sidebar({ role, activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <School size={20} /> },
    { id: 'students', label: 'Siswa', icon: <Users size={20} /> },
    { id: 'jadwal', label: 'Jadwal', icon: <Calendar size={20} /> },
  ];

  if (role === 'ADMIN') {
    menuItems.push({ id: 'keuangan', label: 'Keuangan', icon: <CreditCard size={20} /> });
  }

  return (
    <aside className="hidden w-64 flex-col bg-white shadow-lg md:flex">
      <div className="flex items-center justify-center h-20 border-b">
        <h2 className="text-2xl font-bold text-blue-600">GSA</h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t p-4">
        <button 
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={20} />
          Keluar
        </button>
      </div>
    </aside>
  );
}

// Header
function Header({ role, title }) {
  return (
    <header className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{role === 'ADMIN' ? 'Administrator' : 'Guru Pengajar'}</p>
          <p className="text-xs text-gray-500">{role === 'ADMIN' ? 'Akses Penuh' : 'Akses Terbatas'}</p>
        </div>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${role === 'ADMIN' ? 'bg-blue-600' : 'bg-green-600'}`}>
          {role.charAt(0)}
        </div>
      </div>
    </header>
  );
}

// Dashboard View
function Dashboard({ role, students }) {
  // Simple stats
  const activeStudents = students.filter(s => s.status === 'AKTIF').length;
  const waitingStudents = students.filter(s => s.status === 'MENUNGGU').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Siswa</p>
              <h3 className="text-2xl font-bold text-gray-800">{students.length}</h3>
            </div>
            <Users className="text-blue-500 opacity-20" size={32} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Siswa Aktif</p>
              <h3 className="text-2xl font-bold text-gray-800">{activeStudents}</h3>
            </div>
            <UserCheck className="text-green-500 opacity-20" size={32} />
          </div>
        </div>
        {role === 'ADMIN' && (
          <div className="rounded-xl bg-white p-6 shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Menunggu Pembayaran</p>
                <h3 className="text-2xl font-bold text-gray-800">{waitingStudents}</h3>
              </div>
              <CreditCard className="text-orange-500 opacity-20" size={32} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-800">Selamat Datang di Gemilang Super Apps</h3>
        <p className="text-gray-600">
          {role === 'ADMIN' 
            ? 'Anda memiliki akses penuh untuk mengelola pendaftaran siswa, keuangan, dan manajemen guru.' 
            : 'Silakan cek jadwal mengajar Anda dan lakukan absensi siswa secara berkala.'}
        </p>
      </div>
    </div>
  );
}

// --- 4. FITUR UTAMA: MANAJEMEN SISWA ---
function StudentManagement({ role, students }) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initial State Form
  const initialForm = {
    namaLengkap: '',
    jenjang: 'SD',
    kelas: '',
    noHP: '',
    emailOrangTua: '',
    statusPembayaran: 'BELUM_LUNAS'
  };
  const [formData, setFormData] = useState(initialForm);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Submit (HANYA ADMIN)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role !== 'ADMIN') return; // Double protection

    setIsSubmitting(true);
    try {
      // Logic Status: LUNAS -> AKTIF, else MENUNGGU
      const status = formData.statusPembayaran === 'LUNAS' ? 'AKTIF' : 'MENUNGGU';
      
      const newStudentData = {
        ...formData,
        status: status,
        tanggalDaftar: new Date().toISOString() // Simpan sebagai ISO String agar mudah dibaca client-side tanpa konversi timestamp complex dulu
      };

      // WRITE KE FIRESTORE (Non-destructive, addDoc generates new ID)
      await addDoc(collection(db, 'students'), newStudentData);

      // Reset Form
      setFormData(initialForm);
      setShowForm(false);
      alert('Siswa berhasil didaftarkan!');
    } catch (error) {
      console.error("Error adding student: ", error);
      alert('Gagal mendaftarkan siswa. Cek koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ACTION BAR (ADMIN ONLY) */}
      {role === 'ADMIN' && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow"
          >
            {showForm ? 'Batal' : <><Plus size={18} /> Daftar Siswa Baru</>}
          </button>
        </div>
      )}

      {/* FORM PENDAFTARAN (ADMIN ONLY) */}
      {showForm && role === 'ADMIN' && (
        <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 animate-fade-in-down">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Form Pendaftaran Siswa</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input required name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Budi Santoso" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">No HP (WA)</label>
              <input required name="noHP" value={formData.noHP} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0812..." />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Jenjang</label>
              <select name="jenjang" value={formData.jenjang} onChange={handleChange} className="w-full border rounded p-2 bg-white">
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Kelas</label>
              <input required name="kelas" value={formData.kelas} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 6, 9, 12" />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-700">Email Orang Tua</label>
              <input required type="email" name="emailOrangTua" value={formData.emailOrangTua} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@contoh.com" />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1 bg-yellow-50 p-3 rounded border border-yellow-200">
              <label className="text-sm font-bold text-gray-700 block mb-2">Status Pembayaran Awal</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="statusPembayaran" value="BELUM_LUNAS" checked={formData.statusPembayaran === 'BELUM_LUNAS'} onChange={handleChange} />
                  <span className="text-sm">Belum Lunas (Status: MENUNGGU)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="statusPembayaran" value="LUNAS" checked={formData.statusPembayaran === 'LUNAS'} onChange={handleChange} />
                  <span className="text-sm font-bold text-green-700">Lunas (Status: AKTIF)</span>
                </label>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 pt-4">
              <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition disabled:bg-gray-400">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pendaftaran'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TABLE DATA SISWA (ADMIN & GURU) */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Data Siswa Terdaftar</h3>
          <span className="text-xs text-gray-500">Total: {students.length} Siswa</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Jenjang/Kelas</th>
                {role === 'ADMIN' && <th className="px-4 py-3">Kontak</th>}
                <th className="px-4 py-3">Status Bayar</th>
                <th className="px-4 py-3">Status Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-400">Belum ada data siswa.</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.namaLengkap}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{s.jenjang} - {s.kelas}</span>
                    </td>
                    {role === 'ADMIN' && (
                      <td className="px-4 py-3 text-gray-500">
                        <div>{s.noHP}</div>
                        <div className="text-xs text-blue-500">{s.emailOrangTua}</div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${s.statusPembayaran === 'LUNAS' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {s.statusPembayaran}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                       <span className={`flex items-center gap-1 text-xs font-bold ${s.status === 'AKTIF' ? 'text-blue-600' : 'text-orange-600'}`}>
                        {s.status === 'AKTIF' ? <CheckSquare size={14}/> : <div className="w-3 h-3 rounded-full bg-orange-400"></div>}
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}