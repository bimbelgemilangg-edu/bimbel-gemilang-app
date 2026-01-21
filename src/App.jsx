import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, setDoc, doc, getDoc, 
  onSnapshot, query, where, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  Bell, User, Lock, LogOut, CheckCircle, Clock, 
  DollarSign, Users, GraduationCap, Menu, Save, Plus, Trash2 
} from 'lucide-react';

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

// =================================================================
// 1. FILE: src/pages/admin/Settings.jsx (Keuangan & Paket)
// =================================================================
const AdminSettings = () => {
  const [prices, setPrices] = useState({
    sd_1: 0, sd_3: 0, sd_6: 0,
    smp_1: 0, smp_3: 0, smp_6: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ambil data harga saat load
    const fetchPrices = async () => {
      const docRef = doc(db, "settings", "prices");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPrices(docSnap.data());
      }
    };
    fetchPrices();
  }, []);

  const handleChange = (e) => {
    setPrices({ ...prices, [e.target.name]: parseInt(e.target.value) || 0 });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "prices"), prices, { merge: true });
      alert("Harga Paket Berhasil Disimpan!");
    } catch (error) {
      console.error("Error saving prices:", error);
      alert("Gagal menyimpan data.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <DollarSign className="text-blue-600" /> Pengaturan Harga Paket
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Paket SD */}
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">Jenjang SD</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Paket 1 Bulan</label>
              <input type="number" name="sd_1" value={prices.sd_1} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Paket 3 Bulan</label>
              <input type="number" name="sd_3" value={prices.sd_3} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Paket 6 Bulan</label>
              <input type="number" name="sd_6" value={prices.sd_6} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
          </div>
        </div>

        {/* Paket SMP */}
        <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
          <h3 className="font-bold text-purple-800 mb-4 border-b border-purple-200 pb-2">Jenjang SMP</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Paket 1 Bulan</label>
              <input type="number" name="smp_1" value={prices.smp_1} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Paket 3 Bulan</label>
              <input type="number" name="smp_3" value={prices.smp_3} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Paket 6 Bulan</label>
              <input type="number" name="smp_6" value={prices.smp_6} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
        >
          <Save size={18} /> {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
};

// =================================================================
// 2. FILE: src/pages/admin/Teachers.jsx (Guru & Token)
// =================================================================
const AdminTeachers = () => {
  const [dailyToken, setDailyToken] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [newGuru, setNewGuru] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);

  // Load Token & List Guru
  useEffect(() => {
    // 1. Get Token
    const fetchToken = async () => {
      const docSnap = await getDoc(doc(db, "settings", "attendanceToken"));
      if (docSnap.exists()) setDailyToken(docSnap.data().token);
    };
    fetchToken();

    // 2. Listen Users (Guru)
    const q = query(collection(db, "users"), where("role", "==", "guru"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guruData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(guruData);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveToken = async () => {
    if (!dailyToken) return alert("Token tidak boleh kosong!");
    await setDoc(doc(db, "settings", "attendanceToken"), { token: dailyToken });
    alert("Token Harian Berhasil Diupdate!");
  };

  const handleAddGuru = async (e) => {
    e.preventDefault();
    if (!newGuru.name || !newGuru.phone) return alert("Isi semua data!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "users"), {
        name: newGuru.name,
        phone: newGuru.phone,
        role: "guru",
        createdAt: serverTimestamp()
      });
      setNewGuru({ name: "", phone: "" });
      alert("Guru berhasil ditambahkan!");
    } catch (err) {
      console.error(err);
      alert("Error adding guru");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* SECTION TOKEN */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl shadow text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Lock size={24} /> Token Absensi Hari Ini
          </h2>
          <p className="text-orange-100 text-sm">Update token ini setiap pagi agar guru bisa check-in.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 w-full md:w-auto">
          <input 
            type="text" 
            value={dailyToken}
            onChange={(e) => setDailyToken(e.target.value.toUpperCase())}
            placeholder="CONTOH: SENIN01"
            className="px-4 py-2 text-gray-800 font-bold outline-none rounded-l-md w-full md:w-48"
          />
          <button onClick={handleSaveToken} className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800">
            Set Token
          </button>
        </div>
      </div>

      {/* SECTION LIST GURU */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="text-blue-600" /> Daftar Guru Pengajar
        </h3>
        
        {/* Form Tambah */}
        <form onSubmit={handleAddGuru} className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-3">
          <input 
            type="text" placeholder="Nama Lengkap Guru" 
            value={newGuru.name} onChange={(e) => setNewGuru({...newGuru, name: e.target.value})}
            className="flex-1 px-3 py-2 border rounded"
          />
          <input 
            type="text" placeholder="No. HP / WA" 
            value={newGuru.phone} onChange={(e) => setNewGuru({...newGuru, phone: e.target.value})}
            className="w-full md:w-48 px-3 py-2 border rounded"
          />
          <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 flex items-center gap-1 justify-center">
            <Plus size={16} /> Tambah
          </button>
        </form>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600 text-sm">
                <th className="p-3">Nama Guru</th>
                <th className="p-3">No. HP</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((guru) => (
                <tr key={guru.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{guru.name}</td>
                  <td className="p-3 text-gray-600">{guru.phone}</td>
                  <td className="p-3 text-right text-green-600 text-sm">Aktif</td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr><td colSpan="3" className="p-4 text-center text-gray-400">Belum ada data guru.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// 3. FILE: src/pages/admin/Students.jsx (Siswa & Marketing)
// =================================================================
const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    name: "", level: "SD", grade: "1", school: "",
    parentName: "", parentJob: "", parentPhone: ""
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), {
        ...form,
        createdAt: serverTimestamp()
      });
      alert("Siswa berhasil ditambahkan!");
      setForm({ name: "", level: "SD", grade: "1", school: "", parentName: "", parentJob: "", parentPhone: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Gagal menambah siswa.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <GraduationCap className="text-blue-600" /> Data Siswa
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
        >
          {showForm ? "Batal" : "+ Siswa Baru"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4">Form Pendaftaran Siswa Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data Siswa */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase">Data Anak</label>
              <input required type="text" placeholder="Nama Lengkap Siswa" className="w-full p-2 border rounded" 
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              
              <div className="flex gap-2">
                <select className="p-2 border rounded w-1/3" value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                </select>
                <input required type="text" placeholder="Kelas (Angka)" className="w-2/3 p-2 border rounded" 
                  value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              </div>
              <input required type="text" placeholder="Asal Sekolah" className="w-full p-2 border rounded" 
                value={form.school} onChange={e => setForm({...form, school: e.target.value})} />
            </div>

            {/* Data Ortu */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase">Data Orang Tua (Marketing)</label>
              <input required type="text" placeholder="Nama Ayah / Ibu" className="w-full p-2 border rounded" 
                value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} />
              <input required type="text" placeholder="Pekerjaan (Penting utk Tagihan)" className="w-full p-2 border rounded" 
                value={form.parentJob} onChange={e => setForm({...form, parentJob: e.target.value})} />
              <input required type="text" placeholder="No HP / WhatsApp" className="w-full p-2 border rounded" 
                value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} />
            </div>
          </div>
          <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">SIMPAN DATA SISWA</button>
        </form>
      )}

      {/* Tabel Siswa */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 font-semibold border-b">
            <tr>
              <th className="p-3">Nama Siswa</th>
              <th className="p-3">Jenjang</th>
              <th className="p-3">Ortu</th>
              <th className="p-3">Pekerjaan</th>
              <th className="p-3">No HP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-800">{s.name} <span className="text-xs text-gray-400 block">{s.school}</span></td>
                <td className="p-3">{s.level} - Kls {s.grade}</td>
                <td className="p-3">{s.parentName}</td>
                <td className="p-3 text-blue-600 font-medium">{s.parentJob}</td>
                <td className="p-3">{s.parentPhone}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <div className="p-6 text-center text-gray-400">Belum ada data siswa.</div>}
      </div>
    </div>
  );
};

// =================================================================
// 4. COMPONENTS: Sidebar & Main Layout
// =================================================================
const AdminSidebar = ({ activeView, setView }) => {
  const menus = [
    { id: 'dashboard', label: 'Dashboard', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Keuangan & Paket', icon: <DollarSign size={20} /> },
    { id: 'teachers', label: 'Guru & Token', icon: <Users size={20} /> },
    { id: 'students', label: 'Data Siswa', icon: <GraduationCap size={20} /> },
  ];

  return (
    <div className="bg-white w-64 min-h-screen border-r border-gray-200 hidden md:block">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-extrabold text-blue-600 tracking-tighter">GEMILANG<span className="text-gray-800">SYSTEM</span></h1>
        <p className="text-xs text-gray-400 mt-1">Administrator Panel</p>
      </div>
      <nav className="p-4 space-y-1">
        {menus.map(menu => (
          <button
            key={menu.id}
            onClick={() => setView(menu.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeView === menu.id 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {menu.icon}
            {menu.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

// =================================================================
// MAIN PAGES
// =================================================================

// --- PAGE: LOGIN (Dipertahankan dari sebelumnya) ---
const LoginPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('admin'); 
  const [password, setPassword] = useState('');
  const [selectedGuru, setSelectedGuru] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');

  // Load Guru untuk dropdown login
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "guru"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (activeTab === 'admin') {
      if (password === 'admin123') onLogin('admin', 'Administrator');
      else setError('Password Admin salah!');
    } else {
      if (selectedGuru) onLogin('guru', selectedGuru);
      else setError('Silakan pilih nama Anda!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Bimbel Gemilang</h1>
          <p className="text-blue-100 text-sm">System Login</p>
        </div>
        <div className="flex border-b">
          <button onClick={() => setActiveTab('admin')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'admin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Admin</button>
          <button onClick={() => setActiveTab('guru')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'guru' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}>Guru</button>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {activeTab === 'admin' ? (
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded" placeholder="Password Admin" />
            ) : (
              <select value={selectedGuru} onChange={e => setSelectedGuru(e.target.value)} className="w-full px-4 py-2 border rounded">
                <option value="">-- Pilih Guru --</option>
                {teachers.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            )}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button className="w-full py-2 rounded bg-blue-600 text-white font-bold">Masuk</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- PAGE: DASHBOARD ADMIN (Updated with Sidebar & Routing) ---
const DashboardAdmin = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Bel Logic (Short version)
  const [isBellRinging, setIsBellRinging] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const lfoRef = useRef(null);

  const startBell = () => {
    if (isBellRinging) return;
    setIsBellRinging(true);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const carrier = ctx.createOscillator(); carrier.frequency.value = 880; carrier.type = 'square';
    const lfo = ctx.createOscillator(); lfo.frequency.value = 25; lfo.type = 'square';
    const gain = ctx.createGain(); const lfoGain = ctx.createGain();
    lfo.connect(lfoGain.gain); carrier.connect(gain); gain.connect(ctx.destination);
    carrier.start(); lfo.start();
    audioContextRef.current = ctx; oscillatorRef.current = carrier; lfoRef.current = lfo;
  };

  const stopBell = () => {
    if(!isBellRinging) return;
    setIsBellRinging(false);
    if(oscillatorRef.current) oscillatorRef.current.stop();
    if(audioContextRef.current) audioContextRef.current.close();
  };

  const renderContent = () => {
    switch(currentView) {
      case 'settings': return <AdminSettings />;
      case 'teachers': return <AdminTeachers />;
      case 'students': return <AdminStudents />;
      default:
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-96">
            <div className="mb-4 bg-orange-100 p-4 rounded-full">
              <Bell className={`w-8 h-8 text-orange-600 ${isBellRinging ? 'animate-bounce' : ''}`} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Bel Sekolah</h2>
            <button
              onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} onTouchStart={startBell} onTouchEnd={stopBell}
              className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${isBellRinging ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}
            >
              {isBellRinging ? 'MEMBUNYIKAN...' : 'TEKAN BEL'}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar activeView={currentView} setView={setCurrentView} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 uppercase">{currentView}</h2>
          <button onClick={onLogout} className="text-red-600 font-medium hover:underline">Keluar</button>
        </header>
        <main className="p-6 flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// --- PAGE: DASHBOARD GURU (Minimal Update) ---
const DashboardGuru = ({ guruName, onLogout }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    // Ambil Token dari Database Settings
    try {
      const docSnap = await getDoc(doc(db, "settings", "attendanceToken"));
      const validToken = docSnap.exists() ? docSnap.data().token : "SENIN01"; // Fallback

      if (tokenInput.toUpperCase() !== validToken) {
        setStatus('error');
        setStatusMsg('Token Salah! Hubungi Admin.');
        return;
      }

      await addDoc(collection(db, "attendance_teachers"), {
        name: guruName, timestamp: serverTimestamp(), tokenUsed: tokenInput, status: 'Hadir'
      });
      setStatus('success');
      setStatusMsg('Check In Berhasil!');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-green-700">{guruName}</h2>
          <button onClick={onLogout} className="text-red-500 text-sm">Keluar</button>
        </div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock /> Absensi Harian</h3>
        {status === 'success' ? (
          <div className="text-center text-green-600 font-bold p-4 bg-green-100 rounded">{statusMsg}</div>
        ) : (
          <form onSubmit={handleCheckIn}>
            <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value.toUpperCase())} className="w-full p-3 border-2 border-green-200 rounded mb-4" placeholder="Masukkan Token..." />
            <button className="w-full bg-green-600 text-white py-3 rounded font-bold">CHECK IN</button>
            {status === 'error' && <p className="text-red-500 mt-2 text-center">{statusMsg}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

// --- APP ROOT ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('login'); 
  const [userRole, setUserRole] = useState(null);
  const [currentGuruName, setCurrentGuruName] = useState('');

  useEffect(() => { signInAnonymously(auth); }, []);

  const handleLogin = (role, name) => {
    setUserRole(role);
    if (role === 'guru') setCurrentGuruName(name);
    setCurrentPage(role);
  };

  const handleLogout = () => {
    setUserRole(null); setCurrentPage('login');
  };

  return (
    <div className="font-sans text-gray-900">
      {currentPage === 'login' && <LoginPage onLogin={handleLogin} />}
      {currentPage === 'admin' && <DashboardAdmin onLogout={handleLogout} />}
      {currentPage === 'guru' && <DashboardGuru guruName={currentGuruName} onLogout={handleLogout} />}
    </div>
  );
}