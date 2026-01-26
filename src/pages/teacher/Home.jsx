import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Clock, Calendar, Play, BookOpen } from 'lucide-react';

const QUOTES = [
  "Mengajar adalah seni menyentuh masa depan.",
  "Guru biasa memberitahu, Guru hebat menginspirasi.",
  "Pendidikan adalah senjata paling mematikan untuk mengubah dunia.",
  "Satu anak, satu guru, satu pena bisa mengubah dunia."
];
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function TeacherHome({ db, user, onStartClass }) {
  const [schedules, setSchedules] = useState([]);
  const [time, setTime] = useState(new Date());
  const [qIndex, setQIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const q = setInterval(() => setQIndex(prev => (prev + 1) % QUOTES.length), 6000);
    
    // Ambil Jadwal
    const unsub = onSnapshot(query(collection(db, "schedules"), where("teacherName", "==", user)), 
      (snap) => setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { clearInterval(t); clearInterval(q); unsub(); };
  }, [db, user]);

  const handleStartClick = async (schedule) => {
    if(!confirm("Mulai kelas ini sekarang?")) return;
    
    // Copy data siswa dari master ke log kelas
    const snap = await getDocs(collection(db, "students"));
    const students = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(s => schedule.studentIds?.includes(s.id));
    
    const logRef = await addDoc(collection(db, "class_logs"), {
      teacherName: user, subject: schedule.subject, room: schedule.room,
      date: new Date().toISOString().split('T')[0], startTime: schedule.startTime, endTime: '-',
      studentsLog: students.map(s => ({id: s.id, name: s.name, status: 'Alpha'})),
      status: 'ongoing', timestamp: serverTimestamp()
    });
    
    onStartClass(schedule, logRef.id); // Panggil fungsi di Dashboard untuk pindah tab
  };

  const todayName = DAYS[time.getDay()];
  const todaySchedules = schedules.filter(s => s.day === todayName || s.date === time.toISOString().split('T')[0]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* HERO HEADER */}
      <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-3">Dashboard Pengajar</p>
          <h1 className="text-4xl md:text-5xl font-black mb-8 leading-tight max-w-3xl">"{QUOTES[qIndex]}"</h1>
          <div className="flex items-center gap-8 text-sm font-bold opacity-80">
            <span className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full"><Clock size={18}/> {time.toLocaleTimeString('id-ID')}</span>
            <span className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full"><Calendar size={18}/> {time.toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10"><BookOpen size={300}/></div>
      </div>

      {/* JADWAL HARI INI */}
      <div>
        <h2 className="text-2xl font-black uppercase text-slate-800 mb-8 flex items-center gap-3"><div className="w-4 h-10 bg-blue-600 rounded-full"></div> Jadwal Mengajar Hari Ini</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {todaySchedules.length === 0 && <div className="p-12 border-4 border-dashed rounded-[3rem] text-center col-span-full text-slate-400 font-bold">Tidak ada kelas hari ini.</div>}
          
          {todaySchedules.map(s => (
            <div key={s.id} className="bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-white hover:border-blue-100 group">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">{s.type}</span>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-800">{s.startTime}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Sampai {s.endTime}</p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase mb-2">{s.subject}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase mb-8 flex items-center gap-2">Ruang {s.room}</p>
              <button onClick={()=>handleStartClick(s)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-blue-600 active:scale-95 transition-all">
                <Play size={20} fill="currentColor"/> Mulai Kelas
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}