import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Calendar, Clock, CheckCircle, LogOut, PlayCircle, StopCircle, Key, X, Menu } from 'lucide-react';

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function TeacherDashboard({ db, user, onLogout }) {
  const [view, setView] = useState('today'); 
  const [schedules, setSchedules] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [studentList, setStudentList] = useState([]); 
  const [attendance, setAttendance] = useState({});
  
  // STATE TOKEN (GATEKEEPER)
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [dbToken, setDbToken] = useState("");

  // 1. AMBIL DATA JADWAL & TOKEN DARI DB
  useEffect(() => {
    // Ambil Token dari Admin
    getDoc(doc(db, "settings", "attendanceToken")).then(s => {
      if(s.exists()) setDbToken(s.data().token);
    });

    // Ambil Jadwal Guru
    const q = query(collection(db, "schedules"), where("teacherName", "==", user));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSchedules(all);
    });
    return () => unsub();
  }, [db, user]);

  // 2. VERIFIKASI TOKEN
  const verifyToken = (e) => {
    e.preventDefault();
    if (inputToken.toUpperCase() === dbToken) {
      setIsTokenVerified(true);
    } else {
      alert("Token Salah! Minta Token ke Admin.");
    }
  };

  // 3. LOGIKA KELAS
  const todayName = DAYS[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(s => (s.type === 'routine' && s.day === todayName) || (s.type === 'booking' && s.date === todayDate)).sort((a,b) => a.startTime.localeCompare(b.startTime));

  const handleStartClass = async (schedule) => {
    if (schedule.studentIds && schedule.studentIds.length > 0) {
      const snap = await getDocs(collection(db, "students"));
      const classStudents = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(s => schedule.studentIds.includes(s.id));
      setStudentList(classStudents);
    } else {
      setStudentList([]);
    }
    setActiveClass(schedule);
    setAttendance({});
  };

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleEndClass = async () => {
    if(!confirm("Akhiri kelas?")) return;
    const presentStudents = studentList.filter(s => attendance[s.id]).map(s => ({id: s.id, name: s.name, status: 'Hadir'}));
    const absentStudents = studentList.filter(s => !attendance[s.id]).map(s => ({id: s.id, name: s.name, status: 'Alpha'}));

    try {
      await addDoc(collection(db, "class_logs"), {
        teacherName: user,
        subject: activeClass.subject,
        room: activeClass.room,
        date: new Date().toISOString().split('T')[0],
        startTime: activeClass.startTime,
        endTime: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
        studentsLog: [...presentStudents, ...absentStudents],
        timestamp: serverTimestamp()
      });
      alert("Kelas Selesai & Absensi Tersimpan!");
      setActiveClass(null);
    } catch (err) { alert("Error: " + err.message); }
  };

  // --- TAMPILAN 1: GATEKEEPER TOKEN (SEBELUM MASUK) ---
  if (!isTokenVerified) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-gray-800">ABSENSI GURU</h1>
            <p className="text-gray-500">Masukkan Token Harian dari Admin</p>
          </div>
          <form onSubmit={verifyToken} className="space-y-4">
            <input 
              autoFocus
              value={inputToken} 
              onChange={e=>setInputToken(e.target.value)} 
              className="w-full text-center text-3xl font-black tracking-[0.5em] border-2 border-gray-300 rounded-xl p-4 uppercase focus:border-blue-600 outline-none"
              placeholder="TOKEN"
            />
            <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-transform active:scale-95">
              MASUK & MULAI MENGAJAR
            </button>
          </form>
          <button onClick={onLogout} className="w-full text-center text-red-500 font-bold mt-4 text-sm">Batal / Keluar</button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: DASHBOARD UTAMA (FULL WIDTH FIX) ---
  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* HEADER FULL WIDTH */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-black text-xl text-blue-900 uppercase tracking-wide">GURU: {user}</h1>
            <p className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Token Terverifikasi</p>
          </div>
          <button onClick={onLogout} className="text-red-500 bg-red-50 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-red-100">
            <LogOut size={16}/> Keluar
          </button>
        </div>
      </div>

      {/* CONTENT AREA (FULL WIDTH CONTAINER) */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6">
        
        {/* NAVIGASI */}
        <div className="flex gap-2 mb-6">
          <button onClick={()=>setView('today')} className={`px-6 py-3 rounded-lg font-bold text-sm shadow-sm transition-all ${view==='today'?'bg-blue-600 text-white':'bg-white text-gray-500'}`}>Jadwal Hari Ini</button>
          <button onClick={()=>setView('weekly')} className={`px-6 py-3 rounded-lg font-bold text-sm shadow-sm transition-all ${view==='weekly'?'bg-blue-600 text-white':'bg-white text-gray-500'}`}>Jadwal Mingguan</button>
        </div>

        {/* LIST JADWAL */}
        {view === 'today' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySchedules.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed text-gray-400">Tidak ada jadwal hari ini.</div>}
            
            {todaySchedules.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.type==='routine'?'bg-green-100 text-green-700':'bg-purple-100 text-purple-700'}`}>{s.type}</span>
                    <span className="text-lg font-black text-gray-800">{s.startTime}</span>
                  </div>
                  <h3 className="font-bold text-xl text-gray-800 mb-1">{s.subject}</h3>
                  <p className="text-sm text-gray-500 mb-4">{s.room}</p>
                </div>
                
                {activeClass?.id === s.id ? (
                  <button className="w-full bg-orange-100 text-orange-700 font-bold py-3 rounded-lg border border-orange-200 animate-pulse">Sedang Berlangsung...</button>
                ) : (
                  <button onClick={()=>handleStartClass(s)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200">
                    <PlayCircle size={20}/> MULAI KELAS
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'weekly' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {DAYS.map(day => {
              const events = schedules.filter(s => s.day === day && s.type === 'routine');
              if(events.length === 0) return null;
              return (
                <div key={day} className="border-b last:border-0">
                  <div className="bg-gray-50 px-4 py-2 font-bold text-xs text-gray-500 uppercase tracking-widest">{day}</div>
                  <div className="divide-y">
                    {events.map(s => (
                      <div key={s.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                        <span className="font-bold text-gray-800">{s.subject} <span className="font-normal text-gray-500 text-sm">({s.room})</span></span>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">{s.startTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL KELAS (FULL SCREEN OVERLAY) */}
      {activeClass && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col animate-in slide-in-from-bottom-5">
          <div className="bg-white p-4 flex justify-between items-center border-b shadow-md">
            <div>
              <h2 className="font-black text-xl text-gray-900">{activeClass.subject}</h2>
              <p className="text-gray-500 text-sm">Klik siswa yang <b>HADIR</b></p>
            </div>
            <button onClick={()=>setActiveClass(null)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {studentList.map(student => (
                <button 
                  key={student.id} 
                  onClick={()=>toggleAttendance(student.id)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                    attendance[student.id] 
                    ? 'bg-green-600 border-green-600 text-white shadow-xl scale-105' 
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  <CheckCircle size={40} className={attendance[student.id] ? "text-white" : "text-gray-200"}/>
                  <span className="font-bold text-lg">{student.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white border-t">
            <button onClick={handleEndClass} className="w-full max-w-7xl mx-auto bg-red-600 text-white font-black text-lg py-4 rounded-xl shadow-lg hover:bg-red-700 flex items-center justify-center gap-2">
              <StopCircle size={24}/> SELESAIKAN KELAS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}