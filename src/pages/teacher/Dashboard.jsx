import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, serverTimestamp, updateDoc, getDocs } from 'firebase/firestore';
import { 
  Play, CheckCircle, XCircle, Clock, Calendar, 
  LogOut, Star, Smile, Meh, Frown, BookOpen, AlertTriangle, ExternalLink 
} from 'lucide-react';

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function TeacherDashboard({ db, user, onLogout }) {
  // State Utama
  const [view, setView] = useState('loading'); // loading | token | schedule | active
  const [schedules, setSchedules] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null); // ID Log di Database
  const [activeScheduleData, setActiveScheduleData] = useState(null);
  const [studentList, setStudentList] = useState([]); 
  const [attendanceState, setAttendanceState] = useState({}); // { id_siswa: 'Hadir' | 'Sakit' ... }
  
  // State Token & Waktu
  const [inputToken, setInputToken] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFinishModal, setShowFinishModal] = useState(false);

  // --- 1. INISIALISASI & CEK SESI ---
  useEffect(() => {
    // Jam Realtime
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Cek apakah Guru sudah pernah login di browser ini (Persistent Login)
    const savedToken = localStorage.getItem('GEMILANG_TEACHER_TOKEN');
    if (savedToken === 'VALID') {
      setView('schedule');
    } else {
      setView('token');
    }

    // Ambil Jadwal Guru
    const q = query(collection(db, "schedules"), where("teacherName", "==", user));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSchedules(all);
    });

    return () => { unsub(); clearInterval(timer); };
  }, [db, user]);

  // --- 2. LOGIKA VERIFIKASI TOKEN (AUTO TIMESTAMP) ---
  const verifyToken = async (e) => {
    e.preventDefault();
    try {
      const snap = await getDoc(doc(db, "settings", "attendanceToken"));
      const dbToken = snap.exists() ? snap.data().token : "";

      if (inputToken.toUpperCase() === dbToken) {
        // 1. Simpan sesi di browser (biar ga tanya lagi)
        localStorage.setItem('GEMILANG_TEACHER_TOKEN', 'VALID');
        
        // 2. CATAT TIMESTAMP KEHADIRAN GURU (Hanya saat login pertama)
        await addDoc(collection(db, "teacher_presences"), {
          name: user,
          timestamp: serverTimestamp(),
          date: new Date().toLocaleDateString('id-ID'),
          time: new Date().toLocaleTimeString('id-ID'),
          type: 'check-in',
          device: navigator.userAgent
        });

        alert(`Verifikasi Berhasil! Kehadiran ${user} tercatat.`);
        setView('schedule');
      } else {
        alert("Token Salah! Hubungi Admin.");
      }
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleResetSession = () => {
    if(confirm("Keluar dari sesi ini? Anda harus memasukkan token lagi nanti.")) {
      localStorage.removeItem('GEMILANG_TEACHER_TOKEN');
      setView('token');
      onLogout();
    }
  };

  // --- 3. MULAI KELAS (BUKA ABSENSI) ---
  const handleStartClass = async (schedule) => {
    // Ambil data siswa berdasarkan ID yang ada di jadwal
    const snap = await getDocs(collection(db, "students"));
    const classStudents = snap.docs
      .map(d => ({id: d.id, ...d.data()}))
      .filter(s => schedule.studentIds?.includes(s.id));
    
    setStudentList(classStudents);
    setActiveScheduleData(schedule);

    // Inisialisasi status default (Alpha dulu sebelum diabsen)
    const initialAtt = {};
    classStudents.forEach(s => initialAtt[s.id] = 'Alpha');
    setAttendanceState(initialAtt);

    // MEMBUAT DOKUMEN LOG (Status: ONGOING) - Realtime Sync ke Admin
    const logRef = await addDoc(collection(db, "class_logs"), {
      teacherName: user,
      subject: schedule.subject,
      room: schedule.room,
      date: new Date().toISOString().split('T')[0],
      startTime: schedule.startTime,
      endTime: '-', // Belum selesai
      studentsLog: classStudents.map(s => ({id: s.id, name: s.name, status: 'Alpha'})), // Default Alpha
      status: 'ongoing', // Status sedang berjalan
      timestamp: serverTimestamp()
    });

    setActiveSessionId(logRef.id);
    setView('active');
  };

  // --- 4. UPDATE ABSENSI (REALTIME UPDATE) ---
  const toggleAttendance = async (studentId, status) => {
    const newState = { ...attendanceState, [studentId]: status };
    setAttendanceState(newState);

    // Update langsung ke Database Admin
    if (activeSessionId) {
      const updatedLogs = studentList.map(s => ({
        id: s.id, 
        name: s.name, 
        status: s.id === studentId ? status : newState[s.id]
      }));
      
      await updateDoc(doc(db, "class_logs", activeSessionId), {
        studentsLog: updatedLogs
      });
    }
  };

  // --- 5. AKHIRI KELAS (KUNCI & JURNAL) ---
  const handleFinishClass = async () => {
    try {
      await updateDoc(doc(db, "class_logs", activeSessionId), {
        endTime: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}),
        status: 'completed' // Kunci kelas
      });
      alert("Kelas Ditutup! Terima kasih, Cikgu!");
      setShowFinishModal(false);
      setView('schedule');
      setActiveSessionId(null);
    } catch (err) { alert(err.message); }
  };

  // ================= TAMPILAN 1: TOKEN GATE (AUTO FIT SCREEN) =================
  if (view === 'token') {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40}/></div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">ABSENSI TENTOR</h1>
          <p className="text-slate-400 font-bold mb-8">Masukkan Kode Harian dari Admin</p>
          <form onSubmit={verifyToken} className="space-y-6">
            <input 
              autoFocus
              className="w-full text-center text-5xl font-black tracking-[0.5em] p-6 border-4 border-slate-100 rounded-[2rem] outline-none focus:border-blue-500 transition-all uppercase"
              placeholder="****"
              value={inputToken} onChange={e=>setInputToken(e.target.value)}
            />
            <button className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95">VERIFIKASI MASUK</button>
          </form>
          <p className="text-[10px] text-slate-300 mt-6 font-bold uppercase tracking-widest">*Waktu masuk akan tercatat otomatis</p>
        </div>
      </div>
    );
  }

  // ================= TAMPILAN 2: JADWAL KELAS (DASHBOARD) =================
  if (view === 'schedule') {
    const todayName = DAYS[currentTime.getDay()];
    const todayDateStr = currentTime.toISOString().split('T')[0];
    const todaySchedules = schedules.filter(s => (s.type === 'routine' && s.day === todayName) || (s.type === 'booking' && s.date === todayDateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime));

    return (
      <div className="min-h-screen bg-gray-50 font-sans p-6 md:p-10">
        <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-[2rem] shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase">Halo, {user}</h1>
            <p className="text-sm font-bold text-blue-500 flex items-center gap-2 mt-1"><Clock size={16}/> {currentTime.toLocaleString('id-ID')}</p>
          </div>
          <button onClick={handleResetSession} className="bg-red-50 text-red-500 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"><LogOut size={16}/> Ganti Akun</button>
        </header>

        <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">Kelas Hari Ini</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {todaySchedules.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
              <Smile size={60} className="mx-auto text-slate-300 mb-4"/>
              <p className="text-slate-400 font-bold text-lg">Tidak ada jadwal mengajar hari ini.</p>
            </div>
          )}

          {todaySchedules.map(s => (
            <div key={s.id} className="bg-white p-8 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-blue-100 group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{s.type}</span>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-800">{s.startTime}</p>
                  <p className="text-[10px] font-bold text-slate-400">s/d {s.endTime}</p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase mb-1 leading-tight">{s.subject}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase mb-8 flex items-center gap-2"><Calendar size={14}/> Ruang {s.room}</p>
              
              <button onClick={()=>handleStartClass(s)} className="w-full bg-slate-900 text-white py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 group-hover:bg-blue-600 transition-all active:scale-95">
                <Play size={20} fill="currentColor"/> Mulai Mengajar
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================= TAMPILAN 3: ABSENSI AKTIF (SD FRIENDLY & COLORFUL) =================
  if (view === 'active') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        {/* Header Kelas */}
        <div className="bg-blue-600 text-white p-6 md:p-10 rounded-b-[3rem] shadow-2xl z-10">
          <div className="max-w-7xl mx-auto flex justify-between items-end">
            <div>
              <p className="text-blue-200 font-black uppercase text-xs tracking-[0.2em] mb-2">KELAS SEDANG BERLANGSUNG</p>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">{activeScheduleData.subject}</h1>
              <p className="font-bold text-xl mt-2 opacity-90 flex items-center gap-2"><Clock size={24}/> {activeScheduleData.startTime} - Selesai</p>
            </div>
            <button onClick={() => setShowFinishModal(true)} className="bg-white text-red-600 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
              <XCircle size={20}/> Akhiri Kelas
            </button>
          </div>
        </div>

        {/* Grid Siswa (Fun UI) */}
        <div className="flex-1 p-6 md:p-10 max-w-[1920px] mx-auto w-full overflow-y-auto">
          <h2 className="text-center text-slate-400 font-black uppercase tracking-[0.3em] mb-10">Klik Status Kehadiran Siswa</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {studentList.map(s => {
              const status = attendanceState[s.id];
              let bgColor = 'bg-white';
              let borderColor = 'border-slate-200';
              let icon = <Meh size={40} className="text-slate-300"/>;

              if(status === 'Hadir') { bgColor = 'bg-green-100'; borderColor = 'border-green-400'; icon = <Smile size={50} className="text-green-600"/>; }
              else if(status === 'Sakit') { bgColor = 'bg-yellow-100'; borderColor = 'border-yellow-400'; icon = <div className="text-3xl">🤒</div>; }
              else if(status === 'Izin') { bgColor = 'bg-blue-100'; borderColor = 'border-blue-400'; icon = <div className="text-3xl">👋</div>; }
              else if(status === 'Alpha') { bgColor = 'bg-red-50'; borderColor = 'border-red-200'; icon = <Frown size={40} className="text-red-400"/>; }

              return (
                <div key={s.id} className={`relative p-6 rounded-[2.5rem] border-[6px] ${borderColor} ${bgColor} shadow-lg transition-all transform hover:scale-105 flex flex-col items-center justify-center gap-4 min-h-[250px]`}>
                  <div className="bg-white p-4 rounded-full shadow-sm border-4 border-white">
                    {icon}
                  </div>
                  <h3 className="font-black text-xl text-slate-800 text-center leading-none uppercase">{s.name}</h3>
                  
                  {/* Tombol Pilihan Status (Bubble Style) */}
                  <div className="flex flex-wrap justify-center gap-2 w-full mt-2">
                    <button onClick={()=>toggleAttendance(s.id, 'Hadir')} className={`p-2 rounded-xl border-2 font-black text-[10px] uppercase ${status==='Hadir'?'bg-green-600 text-white border-green-600':'bg-white text-green-600 border-green-200'}`}>Hadir</button>
                    <button onClick={()=>toggleAttendance(s.id, 'Sakit')} className={`p-2 rounded-xl border-2 font-black text-[10px] uppercase ${status==='Sakit'?'bg-yellow-500 text-white border-yellow-500':'bg-white text-yellow-600 border-yellow-200'}`}>Sakit</button>
                    <button onClick={()=>toggleAttendance(s.id, 'Izin')} className={`p-2 rounded-xl border-2 font-black text-[10px] uppercase ${status==='Izin'?'bg-blue-500 text-white border-blue-500':'bg-white text-blue-500 border-blue-200'}`}>Izin</button>
                    <button onClick={()=>toggleAttendance(s.id, 'Alpha')} className={`p-2 rounded-xl border-2 font-black text-[10px] uppercase ${status==='Alpha'?'bg-red-500 text-white border-red-500':'bg-white text-red-500 border-red-200'}`}>Alpha</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL KONFIRMASI TUTUP KELAS */}
        {showFinishModal && (
          <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={48}/></div>
              <h2 className="text-3xl font-black text-slate-800 uppercase mb-2">Tutup Kelas Sekarang?</h2>
              <p className="text-slate-500 font-bold mb-8">Pastikan semua siswa sudah diabsen dengan benar.</p>
              
              <div className="bg-blue-50 border-l-8 border-blue-500 p-6 rounded-r-2xl text-left mb-8">
                <p className="font-black text-blue-800 uppercase text-xs tracking-widest mb-2">Wajib Diisi:</p>
                <p className="font-bold text-slate-700 text-sm mb-4">Sebelum menutup, mohon isi Jurnal Harian Pengajaran pada link di bawah ini:</p>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLScExDWWtEHH-S1TAkL7_krYyZP-vTFplFxd4GpDKm_Abvqxdg/viewform?usp=sf_link" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 font-black underline decoration-2 underline-offset-4 hover:text-blue-800">
                  <BookOpen size={18}/> BUKA JURNAL GOOGLE FORM <ExternalLink size={14}/>
                </a>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowFinishModal(false)} className="flex-1 py-5 rounded-[2rem] font-black text-slate-400 uppercase bg-slate-100 hover:bg-slate-200 transition-all">Batal</button>
                <button onClick={handleFinishClass} className="flex-1 py-5 rounded-[2rem] font-black text-white uppercase bg-red-600 hover:bg-red-700 shadow-xl transition-all">Ya, Tutup Kelas</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div className="text-center p-10">Memuat Sistem...</div>;
}