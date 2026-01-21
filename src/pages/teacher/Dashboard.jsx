import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Calendar, Clock, CheckCircle, LogOut, PlayCircle, StopCircle, Key, X, Sparkles, Quote, Trophy } from 'lucide-react';

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// --- KATA-KATA MOTIVASI PENYEMANGAT ---
const TEACHER_QUOTES = [
  "Mengajar adalah seni menyentuh masa depan.",
  "Guru yang baik itu seperti lilin, menghabiskan dirinya untuk menerangi jalan orang lain.",
  "Masa depan bangsa ada di tangan para pendidik hebat seperti Anda!",
  "Satu anak, satu guru, satu buku, dan satu pena bisa mengubah dunia.",
  "Terima kasih telah menjadi jembatan ilmu bagi anak-anak bangsa.",
  "Mengajar bukan hanya profesi, tapi panggilan hati.",
  "Setiap benih ilmu yang Anda tanam hari ini akan menjadi pohon kesuksesan besok."
];

export default function TeacherDashboard({ db, user, onLogout }) {
  const [view, setView] = useState('today'); 
  const [schedules, setSchedules] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [studentList, setStudentList] = useState([]); 
  const [attendance, setAttendance] = useState({});
  const [currentQuote, setCurrentQuote] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // STATE TOKEN
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [dbToken, setDbToken] = useState("");

  useEffect(() => {
    // Jam Realtime
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    // Quote Random
    setCurrentQuote(TEACHER_QUOTES[Math.floor(Math.random() * TEACHER_QUOTES.length)]);

    getDoc(doc(db, "settings", "attendanceToken")).then(s => {
      if(s.exists()) setDbToken(s.data().token);
    });

    const q = query(collection(db, "schedules"), where("teacherName", "==", user));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSchedules(all);
    });
    return () => { unsub(); clearInterval(timer); };
  }, [db, user]);

  const verifyToken = (e) => {
    e.preventDefault();
    if (inputToken.toUpperCase() === dbToken) {
      setIsTokenVerified(true);
      alert("Token Berhasil! Selamat bertugas, Pahlawan Tanda Jasa.");
    } else {
      alert("Token Salah! Silakan hubungi Admin untuk token hari ini.");
    }
  };

  const todayName = DAYS[currentTime.getDay()];
  const todayDateStr = currentTime.toISOString().split('T')[0];
  const fullDateIndo = currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const todaySchedules = schedules.filter(s => (s.type === 'routine' && s.day === todayName) || (s.type === 'booking' && s.date === todayDateStr)).sort((a,b) => a.startTime.localeCompare(b.startTime));

  const handleStartClass = async (schedule) => {
    const snap = await getDocs(collection(db, "students"));
    const classStudents = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(s => schedule.studentIds?.includes(s.id));
    setStudentList(classStudents);
    setActiveClass(schedule);
    setAttendance({});
  };

  const handleEndClass = async () => {
    if(!confirm("Selesaikan sesi belajar ini?")) return;
    try {
      await addDoc(collection(db, "class_logs"), {
        teacherName: user,
        subject: activeClass.subject,
        room: activeClass.room,
        date: todayDateStr,
        startTime: activeClass.startTime,
        endTime: currentTime.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
        studentsLog: studentList.map(s => ({id: s.id, name: s.name, status: attendance[s.id] ? 'Hadir' : 'Alpha'})),
        timestamp: serverTimestamp()
      });
      alert("Hebat! Laporan kelas sudah terkirim ke Admin.");
      setActiveClass(null);
    } catch (err) { alert(err.message); }
  };

  // --- TAMPILAN 1: GATEKEEPER TOKEN (PREMIUM LOOK) ---
  if (!isTokenVerified) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="absolute top-10 text-center text-white/20 uppercase tracking-[1em] font-black pointer-events-none">Gemilang System</div>
        <div className="bg-white w-full max-w-2xl p-12 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border-t-8 border-blue-600 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8"><div className="bg-blue-100 p-6 rounded-full text-blue-600 shadow-inner"><Key size={48}/></div></div>
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">VERIFIKASI TENTOR</h1>
            <p className="text-slate-400 font-medium">Masukkan kunci akses harian untuk mengaktifkan jadwal.</p>
          </div>
          <form onSubmit={verifyToken} className="space-y-6">
            <input 
              autoFocus
              value={inputToken} onChange={e=>setInputToken(e.target.value)} 
              className="w-full text-center text-5xl font-black tracking-[0.4em] border-4 border-slate-100 bg-slate-50 rounded-3xl p-8 uppercase focus:border-blue-600 focus:bg-white outline-none transition-all shadow-inner"
              placeholder="••••"
            />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-6 rounded-[2rem] shadow-2xl shadow-blue-500/40 transition-all active:scale-95 flex items-center justify-center gap-3">
              AKTIFKAN DASHBOARD <PlayCircle/>
            </button>
          </form>
          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-center italic text-slate-500 text-sm flex items-center justify-center gap-2">
              <Quote size={14} className="text-blue-500"/> {currentQuote}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: DASHBOARD UTAMA (FULL SCREEN LAPTOP) ---
  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans overflow-x-hidden">
      {/* HEADER ELEGAN */}
      <header className="bg-slate-900 text-white w-full shadow-2xl z-20">
        <div className="max-w-[1800px] mx-auto px-10 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/50"><Trophy size={32}/></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">TENTOR: {user}</h1>
              <p className="text-blue-400 font-bold flex items-center gap-2"><Sparkles size={16}/> {fullDateIndo}</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <div className="text-4xl font-black tracking-tighter text-white mb-1">
              {currentTime.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}
            </div>
            <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Log Out</button>
          </div>
        </div>
      </header>

      {/* BODY FULL WIDTH */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-8">
        
        {/* QUOTE PENYEMANGAT */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-[2.5rem] border-2 border-blue-100 mb-10 flex items-center gap-6 shadow-sm">
          <div className="bg-white p-4 rounded-2xl shadow-sm text-blue-600"><Quote size={32}/></div>
          <p className="text-2xl font-bold text-slate-700 leading-relaxed">"{currentQuote}"</p>
        </div>

        {/* NAVIGASI BESAR */}
        <div className="flex gap-4 mb-10">
          <button onClick={()=>setView('today')} className={`flex-1 py-6 rounded-[2rem] font-black text-xl transition-all shadow-lg ${view==='today'?'bg-blue-600 text-white scale-[1.02] shadow-blue-200':'bg-slate-100 text-slate-400'}`}>JADWAL HARI INI</button>
          <button onClick={()=>setView('weekly')} className={`flex-1 py-6 rounded-[2rem] font-black text-xl transition-all shadow-lg ${view==='weekly'?'bg-blue-600 text-white scale-[1.02] shadow-blue-200':'bg-slate-100 text-slate-400'}`}>JADWAL MINGGUAN</button>
        </div>

        {/* LIST JADWAL GRID BESAR */}
        {view === 'today' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {todaySchedules.length === 0 && <div className="col-span-full text-center py-32 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 text-slate-300 font-black text-3xl uppercase tracking-widest">Tidak Ada Kelas</div>}
            
            {todaySchedules.map(s => (
              <div key={s.id} className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between group">
                <div className="relative">
                  <div className="flex justify-between items-center mb-6">
                    <span className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-black tracking-widest uppercase">{s.type}</span>
                    <div className="text-3xl font-black text-blue-600 flex items-center gap-2"><Clock size={24}/> {s.startTime}</div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 mb-2 leading-tight group-hover:text-blue-700 transition-colors">{s.subject}</h3>
                  <p className="text-xl text-slate-400 font-bold uppercase tracking-widest mb-8">RUANG: {s.room}</p>
                </div>
                
                {activeClass?.id === s.id ? (
                  <div className="w-full bg-orange-100 text-orange-600 font-black py-6 rounded-3xl text-center animate-pulse border-2 border-orange-200 text-xl uppercase tracking-tighter">KELAS SEDANG BERJALAN...</div>
                ) : (
                  <button onClick={()=>handleStartClass(s)} className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black text-xl py-6 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-4 group-hover:scale-105">
                    MULAI MENGAJAR <PlayCircle size={28}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'weekly' && (
          <div className="bg-slate-50 rounded-[3rem] p-10 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-8">
            {DAYS.map(day => {
              const events = schedules.filter(s => s.day === day && s.type === 'routine');
              if(events.length === 0) return null;
              return (
                <div key={day} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="font-black text-2xl text-slate-900 mb-6 border-l-8 border-blue-600 pl-4 uppercase tracking-tighter">{day}</h3>
                  <div className="space-y-4">
                    {events.map(s => (
                      <div key={s.id} className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                        <span className="font-black text-lg text-slate-700 uppercase">{s.subject}</span>
                        <span className="font-black text-blue-600 bg-white px-4 py-2 rounded-xl shadow-sm border">{s.startTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* MODAL KELAS - FULL OVERLAY & BIG ICONS */}
      {activeClass && (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white p-10 flex justify-between items-center shadow-2xl">
            <div>
              <h2 className="font-black text-5xl text-slate-900 leading-none">{activeClass.subject}</h2>
              <p className="text-slate-400 font-black text-xl mt-2 uppercase tracking-[0.2em]">RUANG {activeClass.room}</p>
            </div>
            <button onClick={()=>setActiveClass(null)} className="bg-slate-100 p-4 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"><X size={40}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-12">
            <h3 className="text-white/40 text-center font-black text-2xl mb-12 uppercase tracking-[0.3em]">Klik Nama Siswa Yang Hadir</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-[1600px] mx-auto">
              {studentList.map(student => (
                <button 
                  key={student.id} 
                  onClick={()=>{setAttendance(prev => ({ ...prev, [student.id]: !prev[student.id] }));}}
                  className={`aspect-square rounded-[3rem] border-4 transition-all flex flex-col items-center justify-center gap-6 p-6 ${
                    attendance[student.id] 
                    ? 'bg-blue-600 border-white text-white shadow-[0_0_50px_rgba(37,99,235,0.6)] scale-110' 
                    : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-blue-500'
                  }`}
                >
                  <CheckCircle size={attendance[student.id] ? 80 : 48} strokeWidth={3} className={attendance[student.id] ? "animate-bounce" : "opacity-20"}/>
                  <span className="font-black text-xl text-center uppercase tracking-tight leading-none">{student.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-12 bg-slate-900 border-t border-slate-800 flex justify-center">
            <button onClick={handleEndClass} className="w-full max-w-4xl bg-red-600 hover:bg-red-700 text-white font-black text-3xl py-10 rounded-[3rem] shadow-[0_20px_50px_rgba(220,38,38,0.3)] flex items-center justify-center gap-6 transition-all active:scale-95">
              <StopCircle size={48}/> AKHIRI SESI MENGAJAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}