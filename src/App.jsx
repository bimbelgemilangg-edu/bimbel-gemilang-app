import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, setDoc, doc, getDoc, 
  onSnapshot, query, where, serverTimestamp, orderBy, deleteDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  Bell, User, Lock, LogOut, CheckCircle, Clock, 
  DollarSign, Users, GraduationCap, Calendar, MapPin, 
  Save, Plus, X, Search, ChevronLeft, ChevronRight, Repeat, CalendarDays, AlertTriangle, ArrowRight 
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

// --- HELPER: GET HARI INDONESIA ---
const getIndonesianDay = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
};

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
    const fetchPrices = async () => {
      const docRef = doc(db, "settings", "prices");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setPrices(docSnap.data());
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
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">Jenjang SD</h3>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-gray-600">Paket 1 Bulan</label><input type="number" name="sd_1" value={prices.sd_1} onChange={handleChange} className="w-full mt-1 p-2 border rounded" /></div>
            <div><label className="text-sm font-medium text-gray-600">Paket 3 Bulan</label><input type="number" name="sd_3" value={prices.sd_3} onChange={handleChange} className="w-full mt-1 p-2 border rounded" /></div>
            <div><label className="text-sm font-medium text-gray-600">Paket 6 Bulan</label><input type="number" name="sd_6" value={prices.sd_6} onChange={handleChange} className="w-full mt-1 p-2 border rounded" /></div>
          </div>
        </div>
        <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
          <h3 className="font-bold text-purple-800 mb-4 border-b border-purple-200 pb-2">Jenjang SMP</h3>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-gray-600">Paket 1 Bulan</label><input type="number" name="smp_1" value={prices.smp_1} onChange={handleChange} className="w-full mt-1 p-2 border rounded" /></div>
            <div><label className="text-sm font-medium text-gray-600">Paket 3 Bulan</label><input type="number" name="smp_3" value={prices.smp_3} onChange={handleChange} className="w-full mt-1 p-2 border rounded" /></div>
            <div><label className="text-sm font-medium text-gray-600">Paket 6 Bulan</label><input type="number" name="smp_6" value={prices.smp_6} onChange={handleChange} className="w-full mt-1 p-2 border rounded" /></div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
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

  useEffect(() => {
    const fetchToken = async () => {
      const docSnap = await getDoc(doc(db, "settings", "attendanceToken"));
      if (docSnap.exists()) setDailyToken(docSnap.data().token);
    };
    fetchToken();

    const q = query(collection(db, "users"), where("role", "==", "guru"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
        name: newGuru.name, phone: newGuru.phone, role: "guru", createdAt: serverTimestamp()
      });
      setNewGuru({ name: "", phone: "" });
      alert("Guru berhasil ditambahkan!");
    } catch (err) { console.error(err); alert("Error"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl shadow text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Lock size={24} /> Token Absensi Hari Ini</h2>
          <p className="text-orange-100 text-sm">Update token ini setiap pagi agar guru bisa check-in.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 w-full md:w-auto">
          <input type="text" value={dailyToken} onChange={(e) => setDailyToken(e.target.value.toUpperCase())} placeholder="CONTOH: SENIN01" className="px-4 py-2 text-gray-800 font-bold outline-none rounded-l-md w-full md:w-48" />
          <button onClick={handleSaveToken} className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800">Set Token</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="text-blue-600" /> Daftar Guru Pengajar</h3>
        <form onSubmit={handleAddGuru} className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-3">
          <input type="text" placeholder="Nama Lengkap Guru" value={newGuru.name} onChange={(e) => setNewGuru({...newGuru, name: e.target.value})} className="flex-1 px-3 py-2 border rounded" />
          <input type="text" placeholder="No. HP / WA" value={newGuru.phone} onChange={(e) => setNewGuru({...newGuru, phone: e.target.value})} className="w-full md:w-48 px-3 py-2 border rounded" />
          <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 flex items-center gap-1 justify-center"><Plus size={16} /> Tambah</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b bg-gray-50 text-gray-600 text-sm"><th className="p-3">Nama Guru</th><th className="p-3">No. HP</th><th className="p-3 text-right">Status</th></tr></thead>
            <tbody>
              {teachers.map((guru) => (
                <tr key={guru.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{guru.name}</td>
                  <td className="p-3 text-gray-600">{guru.phone}</td>
                  <td className="p-3 text-right text-green-600 text-sm">Aktif</td>
                </tr>
              ))}
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
  const [form, setForm] = useState({ name: "", level: "SD", grade: "1", school: "", parentName: "", parentJob: "", parentPhone: "" });
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
      await addDoc(collection(db, "students"), { ...form, createdAt: serverTimestamp() });
      alert("Siswa berhasil ditambahkan!");
      setForm({ name: "", level: "SD", grade: "1", school: "", parentName: "", parentJob: "", parentPhone: "" });
      setShowForm(false);
    } catch (error) { console.error("Error adding student:", error); alert("Gagal menambah siswa."); }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><GraduationCap className="text-blue-600" /> Data Siswa</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">{showForm ? "Batal" : "+ Siswa Baru"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4">Form Pendaftaran Siswa Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase">Data Anak</label>
              <input required type="text" placeholder="Nama Lengkap Siswa" className="w-full p-2 border rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <div className="flex gap-2">
                <select className="p-2 border rounded w-1/3" value={form.level} onChange={e => setForm({...form, level: e.target.value})}><option value="SD">SD</option><option value="SMP">SMP</option></select>
                <input required type="text" placeholder="Kelas (Angka)" className="w-2/3 p-2 border rounded" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              </div>
              <input required type="text" placeholder="Asal Sekolah" className="w-full p-2 border rounded" value={form.school} onChange={e => setForm({...form, school: e.target.value})} />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase">Data Orang Tua (Marketing)</label>
              <input required type="text" placeholder="Nama Ayah / Ibu" className="w-full p-2 border rounded" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} />
              <input required type="text" placeholder="Pekerjaan" className="w-full p-2 border rounded" value={form.parentJob} onChange={e => setForm({...form, parentJob: e.target.value})} />
              <input required type="text" placeholder="No HP / WhatsApp" className="w-full p-2 border rounded" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} />
            </div>
          </div>
          <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">SIMPAN DATA SISWA</button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 font-semibold border-b"><tr><th className="p-3">Nama Siswa</th><th className="p-3">Jenjang</th><th className="p-3">Ortu</th><th className="p-3">Pekerjaan</th><th className="p-3">No HP</th></tr></thead>
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
      </div>
    </div>
  );
};

// =================================================================
// 4. FILE: src/pages/admin/Schedule.jsx (JADWAL PLANETS & FILTER RUANGAN)
// =================================================================
const AdminSchedule = () => {
  const ROOMS = ["Merkurius", "Venus", "Bumi", "Mars", "Jupiter"];
  const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  
  const [selectedRoom, setSelectedRoom] = useState("Merkurius");
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [scheduleType, setScheduleType] = useState('routine'); 
  const [newSchedule, setNewSchedule] = useState({
    subject: "", teacherId: "", teacherName: "", day: "Senin", date: "", 
    startTime: "14:00", endTime: "15:30", studentIds: []
  });

  // Fetch Data
  useEffect(() => {
    const unsubSchedule = onSnapshot(query(collection(db, "schedules"), orderBy("startTime")), (snap) => setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTeachers = onSnapshot(query(collection(db, "users"), where("role", "==", "guru")), (snap) => setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubStudents = onSnapshot(query(collection(db, "students"), orderBy("name")), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubSchedule(); unsubTeachers(); unsubStudents(); };
  }, []);

  // Filter Jadwal berdasarkan Ruangan Aktif
  const filteredSchedules = schedules.filter(s => s.room === selectedRoom);

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.subject || !newSchedule.teacherId) return alert("Lengkapi data!");
    const selectedGuru = teachers.find(t => t.id === newSchedule.teacherId);

    try {
      await addDoc(collection(db, "schedules"), {
        ...newSchedule, room: selectedRoom, type: scheduleType,
        teacherName: selectedGuru ? selectedGuru.name : "Unknown", createdAt: serverTimestamp()
      });
      setShowModal(false);
      setNewSchedule({ subject: "", teacherId: "", teacherName: "", day: "Senin", date: "", startTime: "14:00", endTime: "15:30", studentIds: [] });
    } catch (err) { console.error(err); alert("Gagal menyimpan jadwal"); }
  };

  const handleDelete = async (id) => { if(confirm("Hapus jadwal ini?")) await deleteDoc(doc(db, "schedules", id)); };

  const toggleStudent = (studentId) => {
    const currentIds = newSchedule.studentIds;
    setNewSchedule(prev => ({
      ...prev, studentIds: currentIds.includes(studentId) ? currentIds.filter(id => id !== studentId) : [...currentIds, studentId]
    }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header & Filter Ruangan */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Calendar className="text-blue-600" /> Manajemen Jadwal (Planets)</h2>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 text-sm">+ Tambah Jadwal</button>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-lg overflow-x-auto">
          {ROOMS.map(room => (
            <button key={room} onClick={() => setSelectedRoom(room)} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-colors ${selectedRoom === room ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {room}
            </button>
          ))}
        </div>
      </div>

      {/* List Jadwal Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-6">
        {filteredSchedules.length > 0 ? filteredSchedules.map(sch => (
          <div key={sch.id} className={`p-4 rounded-xl border relative group transition-all hover:shadow-md ${sch.type === 'booking' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${sch.type === 'booking' ? 'bg-purple-200 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                {sch.type === 'booking' ? `BOOKING: ${sch.date}` : `RUTIN: ${sch.day}`}
              </span>
              <button onClick={() => handleDelete(sch.id)} className="text-gray-300 hover:text-red-500"><X size={16} /></button>
            </div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{sch.subject}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Clock size={14} className="text-blue-500" /> {sch.startTime} - {sch.endTime}
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1"><User size={12} /> {sch.teacherName}</div>
              <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">{sch.studentIds?.length || 0} Siswa</div>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            Belum ada jadwal di ruangan {selectedRoom}.
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">Booking: {selectedRoom}</h3>
              <button onClick={() => setShowModal(false)}><X className="text-gray-500 hover:text-red-500" /></button>
            </div>
            <form onSubmit={handleSaveSchedule} className="p-6 space-y-5">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={() => setScheduleType('routine')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${scheduleType === 'routine' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}><Repeat size={16} /> Rutin (Mingguan)</button>
                <button type="button" onClick={() => setScheduleType('booking')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${scheduleType === 'booking' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}><CalendarDays size={16} /> Booking (Tanggal)</button>
              </div>
              
              {scheduleType === 'routine' ? (
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Hari</label><select className="w-full p-2 border rounded" value={newSchedule.day} onChange={e => setNewSchedule({...newSchedule, day: e.target.value})}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              ) : (
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Tanggal</label><input type="date" className="w-full p-2 border rounded" value={newSchedule.date} onChange={e => setNewSchedule({...newSchedule, date: e.target.value})} /></div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Mapel</label><input type="text" className="w-full p-2 border rounded" value={newSchedule.subject} onChange={e => setNewSchedule({...newSchedule, subject: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Guru</label><select className="w-full p-2 border rounded" value={newSchedule.teacherId} onChange={e => setNewSchedule({...newSchedule, teacherId: e.target.value})}><option value="">- Pilih -</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <div><label className="text-xs font-bold text-yellow-700 block mb-1">Mulai</label><input type="time" className="w-full p-2 border border-yellow-200 rounded" value={newSchedule.startTime} onChange={e => setNewSchedule({...newSchedule, startTime: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-yellow-700 block mb-1">Selesai</label><input type="time" className="w-full p-2 border border-yellow-200 rounded" value={newSchedule.endTime} onChange={e => setNewSchedule({...newSchedule, endTime: e.target.value})} /></div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Pilih Siswa ({newSchedule.studentIds.length})</label>
                <div className="border rounded-lg h-32 overflow-y-auto p-2 bg-gray-50 grid grid-cols-2 gap-2">
                  {students.map(s => (
                    <div key={s.id} onClick={() => toggleStudent(s.id)} className={`p-2 rounded flex items-center gap-2 cursor-pointer border text-xs ${newSchedule.studentIds.includes(s.id) ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'}`}>
                      <div className={`w-3 h-3 rounded-sm border ${newSchedule.studentIds.includes(s.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}></div><span className="truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">SIMPAN</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 5. COMPONENTS: Sidebar & Main Layout
// =================================================================
const AdminSidebar = ({ activeView, setView }) => {
  const menus = [
    { id: 'dashboard', label: 'Dashboard', icon: <Bell size={20} /> },
    { id: 'schedule', label: 'Jadwal & Ruangan', icon: <Calendar size={20} /> },
    { id: 'settings', label: 'Keuangan & Paket', icon: <DollarSign size={20} /> },
    { id: 'teachers', label: 'Guru & Token', icon: <Users size={20} /> },
    { id: 'students', label: 'Data Siswa', icon: <GraduationCap size={20} /> },
  ];

  return (
    <div className="bg-white w-64 min-h-screen border-r border-gray-200 hidden md:block sticky top-0 h-screen overflow-y-auto">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-extrabold text-blue-600 tracking-tighter">GEMILANG<span className="text-gray-800">SYSTEM</span></h1>
        <p className="text-xs text-gray-400 mt-1">Administrator Panel</p>
      </div>
      <nav className="p-4 space-y-1">
        {menus.map(menu => (
          <button key={menu.id} onClick={() => setView(menu.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeView === menu.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            {menu.icon} {menu.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

// =================================================================
// MAIN PAGES
// =================================================================

// --- PAGE: LOGIN ---
const LoginPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('admin'); 
  const [password, setPassword] = useState('');
  const [selectedGuru, setSelectedGuru] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');

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
        <div className="bg-blue-600 p-6 text-center"><h1 className="text-2xl font-bold text-white">Bimbel Gemilang</h1><p className="text-blue-100 text-sm">System Login</p></div>
        <div className="flex border-b">
          <button onClick={() => setActiveTab('admin')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'admin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Admin</button>
          <button onClick={() => setActiveTab('guru')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'guru' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}>Guru</button>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {activeTab === 'admin' ? (
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded" placeholder="Password Admin" />
            ) : (
              <select value={selectedGuru} onChange={e => setSelectedGuru(e.target.value)} className="w-full px-4 py-2 border rounded"><option value="">-- Pilih Guru --</option>{teachers.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}</select>
            )}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button className="w-full py-2 rounded bg-blue-600 text-white font-bold">Masuk</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- PAGE: DASHBOARD ADMIN (HOME) ---
const DashboardAdmin = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  
  // Bel Logic
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

  // Fetch Data Dashboard (Schedule & Invoices)
  useEffect(() => {
    // 1. Fetch Today Schedules
    const dayName = getIndonesianDay();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const unsubSchedule = onSnapshot(query(collection(db, "schedules")), (snap) => {
      const all = snap.docs.map(d => d.data());
      // Filter JS (Mix Routine & Booking)
      const today = all.filter(s => 
        (s.type === 'routine' && s.day === dayName) || 
        (s.type === 'booking' && s.date === dateStr)
      ).sort((a,b) => a.startTime.localeCompare(b.startTime));
      setTodaySchedules(today);
    });

    // 2. Fetch Overdue Invoices (Mockup Logic but Real Fetch)
    // Note: Collection 'invoices' mungkin masih kosong, tapi logic sudah siap.
    const unsubInvoices = onSnapshot(query(collection(db, "invoices"), where("status", "==", "unpaid")), (snap) => {
      // Logic H-7 (Simulasi filter di client side karena query firestore date complex)
      setOverdueInvoices(snap.docs.map(d => d.data())); 
    });

    return () => { unsubSchedule(); unsubInvoices(); };
  }, []);

  const renderContent = () => {
    switch(currentView) {
      case 'schedule': return <AdminSchedule />;
      case 'settings': return <AdminSettings />;
      case 'teachers': return <AdminTeachers />;
      case 'students': return <AdminStudents />;
      default:
        // --- DASHBOARD HOME ---
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Widget 1: Bel Sekolah (Priority) */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-lg"><Bell size={24} className={isBellRinging ? "animate-bounce" : ""} /></div>
                  <h3 className="font-bold text-lg">Bel Sekolah Manual</h3>
                </div>
                <p className="text-orange-100 text-sm mb-6">Tekan dan tahan tombol di bawah untuk membunyikan bel tanda masuk/pulang.</p>
                <button
                  onMouseDown={startBell} onMouseUp={stopBell} onMouseLeave={stopBell} onTouchStart={startBell} onTouchEnd={stopBell}
                  className={`w-full py-3 rounded-lg font-bold text-red-600 shadow-md transition-all active:scale-95 ${isBellRinging ? 'bg-white' : 'bg-white'}`}
                >
                  {isBellRinging ? 'SEDANG MEMBUNYIKAN...' : 'TEKAN BEL'}
                </button>
              </div>
              <Bell size={100} className="absolute -bottom-4 -right-4 text-white/10" />
            </div>

            {/* Widget 2: Kelas Hari Ini */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-1 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Clock className="text-blue-500" /> Kelas Hari Ini</h3>
                  <p className="text-xs text-gray-500">{getIndonesianDay()}, {new Date().toLocaleDateString('id-ID')}</p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">{todaySchedules.length} Kelas</span>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {todaySchedules.length > 0 ? todaySchedules.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{s.subject}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><User size={10}/> {s.teacherName}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono text-sm font-bold text-blue-600">{s.startTime}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{s.room}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">Tidak ada kelas aktif hari ini.</div>
                )}
              </div>
            </div>

            {/* Widget 3: Tagihan (Invoices) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><AlertTriangle className="text-yellow-500" /> Tagihan Jatuh Tempo</h3>
              <div className="space-y-3">
                {overdueInvoices.length > 0 ? overdueInvoices.map((inv, idx) => (
                  <div key={idx} className="p-3 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg">
                    <div className="flex justify-between">
                      <span className="font-bold text-sm text-gray-800">{inv.studentName}</span>
                      <span className="text-xs font-bold text-red-500">Rp {inv.amount?.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Jatuh Tempo: {inv.dueDate}</div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400 flex flex-col items-center">
                    <CheckCircle className="text-green-300 mb-2" size={32} />
                    <span className="text-xs">Aman! Tidak ada tagihan H-7.</span>
                  </div>
                )}
              </div>
              <button className="w-full mt-4 py-2 text-xs font-bold text-blue-600 border border-blue-200 rounded hover:bg-blue-50">Lihat Semua Tagihan</button>
            </div>

          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar activeView={currentView} setView={setCurrentView} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-800 uppercase">{currentView === 'dashboard' ? 'Dashboard Overview' : currentView.replace('_', ' ')}</h2>
          <button onClick={onLogout} className="text-red-600 font-medium hover:underline">Keluar</button>
        </header>
        <main className="p-6 flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// --- PAGE: DASHBOARD GURU ---
const DashboardGuru = ({ guruName, onLogout }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const docSnap = await getDoc(doc(db, "settings", "attendanceToken"));
      const validToken = docSnap.exists() ? docSnap.data().token : "SENIN01";
      if (tokenInput.toUpperCase() !== validToken) {
        setStatus('error'); setStatusMsg('Token Salah! Hubungi Admin.'); return;
      }
      await addDoc(collection(db, "attendance_teachers"), {
        name: guruName, timestamp: serverTimestamp(), tokenUsed: tokenInput, status: 'Hadir'
      });
      setStatus('success'); setStatusMsg('Check In Berhasil!');
    } catch (err) { console.error(err); setStatus('error'); }
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

  const handleLogout = () => { setUserRole(null); setCurrentPage('login'); };

  return (
    <div className="font-sans text-gray-900">
      {currentPage === 'login' && <LoginPage onLogin={handleLogin} />}
      {currentPage === 'admin' && <DashboardAdmin onLogout={handleLogout} />}
      {currentPage === 'guru' && <DashboardGuru guruName={currentGuruName} onLogout={handleLogout} />}
    </div>
  );
}