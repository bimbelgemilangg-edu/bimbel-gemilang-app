import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Calendar, Clock, CheckCircle, User, LogOut, ChevronRight, X, PlayCircle, StopCircle } from 'lucide-react';

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function TeacherDashboard({ db, user, onLogout }) {
  const [view, setView] = useState('today'); // 'today' | 'weekly'
  const [schedules, setSchedules] = useState([]);
  const [activeClass, setActiveClass] = useState(null); // Kelas yang sedang berlangsung
  const [studentList, setStudentList] = useState([]); // Data siswa di kelas aktif
  const [attendance, setAttendance] = useState({}); // State checklist kehadiran {idSiswa: true/false}

  // 1. AMBIL JADWAL GURU
  useEffect(() => {
    // Ambil jadwal dimana teacherName == user (nama guru yg login)
    const q = query(collection(db, "schedules"), where("teacherName", "==", user));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSchedules(all);
    });
    return () => unsub();
  }, [db, user]);

  // 2. FILTER JADWAL
  const todayName = DAYS[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];

  const todaySchedules = schedules.filter(s => 
    (s.type === 'routine' && s.day === todayName) || 
    (s.type === 'booking' && s.date === todayDate)
  ).sort((a,b) => a.startTime.localeCompare(b.startTime));

  // 3. MULAI KELAS (LOAD DATA SISWA)
  const handleStartClass = async (schedule) => {
    // Ambil detail nama siswa berdasarkan ID yang ada di jadwal
    if (schedule.studentIds && schedule.studentIds.length > 0) {
      // Teknik fetch 'IN' query untuk ambil data siswa sekaligus
      const studentsRef = collection(db, "students");
      // Karena firestore 'in' limit 10, kita ambil manual saja biar aman client side filter
      // (Untuk skala kecil ini oke, skala besar butuh query optimasi)
      const snap = await getDocs(studentsRef);
      const classStudents = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(s => schedule.studentIds.includes(s.id));
      
      setStudentList(classStudents);
    } else {
      setStudentList([]);
    }
    setActiveClass(schedule);
    setAttendance({});
  };

  // 4. KLIK ABSEN SISWA
  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  // 5. AKHIRI KELAS (SIMPAN KE JURNAL)
  const handleEndClass = async () => {
    if(!confirm("Akhiri kelas dan simpan absensi?")) return;

    // Siapkan data kehadiran
    const presentStudents = studentList.filter(s => attendance[s.id]).map(s => ({id: s.id, name: s.name, status: 'Hadir'}));
    const absentStudents = studentList.filter(s => !attendance[s.id]).map(s => ({id: s.id, name: s.name, status: 'Alpha'})); // Default Alpha, Admin nanti ubah ke Izin/Sakit

    const logData = {
      teacherName: user,
      subject: activeClass.subject,
      room: activeClass.room,
      date: new Date().toISOString().split('T')[0],
      startTime: activeClass.startTime,
      endTime: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
      studentsLog: [...presentStudents, ...absentStudents],
      scheduleId: activeClass.id,
      timestamp: serverTimestamp() // Ini untuk sorting
    };

    try {
      await addDoc(collection(db, "class_logs"), logData); // Simpan ke koleksi baru 'class_logs'
      alert("Kelas Selesai! Data tersimpan.");
      setActiveClass(null);
      setAttendance({});
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="font-black text-xl text-blue-600">HALO, {user.toUpperCase()}</h1>
          <p className="text-xs text-gray-500">Selamat Mengajar!</p>
        </div>
        <button onClick={onLogout} className="text-red-500 bg-red-50 p-2 rounded-full"><LogOut size={20}/></button>
      </div>

      {/* NAVIGASI */}
      <div className="p-4 pb-0 flex gap-2">
        <button onClick={()=>setView('today')} className={`flex-1 py-2 font-bold text-sm rounded-t-lg ${view==='today'?'bg-blue-600 text-white shadow':'bg-white text-gray-500 border'}`}>Jadwal Hari Ini</button>
        <button onClick={()=>setView('weekly')} className={`flex-1 py-2 font-bold text-sm rounded-t-lg ${view==='weekly'?'bg-blue-600 text-white shadow':'bg-white text-gray-500 border'}`}>Jadwal Mingguan</button>
      </div>

      {/* KONTEN UTAMA */}
      <div className="flex-1 p-4 overflow-y-auto">
        
        {/* VIEW 1: HARI INI */}
        {view === 'today' && (
          <div className="space-y-4">
            {todaySchedules.length === 0 && <div className="text-center text-gray-400 py-10 bg-white rounded-xl border border-dashed">Tidak ada jadwal mengajar hari ini.</div>}
            
            {todaySchedules.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{s.subject}</h3>
                    <div className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12}/> {s.startTime} - {s.endTime} • {s.room}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.type==='routine'?'bg-green-100 text-green-700':'bg-purple-100 text-purple-700'}`}>{s.type}</span>
                </div>
                
                {/* TOMBOL AKSI */}
                {activeClass?.id === s.id ? (
                  <button className="w-full bg-orange-100 text-orange-700 font-bold py-2 rounded border border-orange-200 animate-pulse">Sedang Berlangsung...</button>
                ) : (
                  <button onClick={()=>handleStartClass(s)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                    <PlayCircle size={18}/> MULAI KELAS
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: MINGGUAN (SIMPLE LIST) */}
        {view === 'weekly' && (
          <div className="space-y-6">
            {DAYS.map(day => {
              const dayEvents = schedules.filter(s => s.day === day && s.type === 'routine');
              if (dayEvents.length === 0) return null;
              return (
                <div key={day}>
                  <h3 className="font-black text-gray-400 uppercase text-xs mb-2 border-b">{day}</h3>
                  <div className="space-y-2">
                    {dayEvents.map(s => (
                      <div key={s.id} className="bg-white p-3 rounded border flex justify-between items-center">
                        <span className="font-bold text-sm">{s.subject}</span>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{s.startTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL ABSENSI KELAS (AKSI GURU) */}
      {activeClass && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-in fade-in slide-in-from-bottom-10">
          {/* Header Modal */}
          <div className="bg-gray-900 p-6 flex justify-between items-center border-b border-gray-800">
            <div>
              <h2 className="text-white font-black text-xl">{activeClass.subject}</h2>
              <p className="text-gray-400 text-xs">{activeClass.startTime} - Sekarang</p>
            </div>
            <button onClick={()=>setActiveClass(null)} className="text-gray-500"><X/></button>
          </div>

          {/* List Siswa */}
          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-gray-400 text-sm mb-4 uppercase font-bold tracking-widest text-center">Klik Nama untuk Absen</p>
            <div className="grid grid-cols-2 gap-4">
              {studentList.length > 0 ? studentList.map(student => (
                <button 
                  key={student.id} 
                  onClick={()=>toggleAttendance(student.id)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    attendance[student.id] 
                    ? 'bg-green-600 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)] transform scale-105' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <CheckCircle size={32} className={attendance[student.id] ? "text-white" : "text-gray-600"}/>
                  <span className="font-bold text-sm text-center">{student.name}</span>
                </button>
              )) : (
                <div className="col-span-2 text-center text-gray-500 italic">Tidak ada data siswa di jadwal ini.</div>
              )}
            </div>
          </div>

          {/* Footer Aksi */}
          <div className="p-6 bg-gray-900 border-t border-gray-800">
            <button onClick={handleEndClass} className="w-full bg-red-600 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all">
              <StopCircle size={24}/> AKHIRI KELAS & SIMPAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}