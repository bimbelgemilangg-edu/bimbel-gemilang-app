import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { CheckCircle, Circle, XCircle, Clock, ExternalLink, AlertTriangle, UserCheck, UserX } from 'lucide-react';

export default function TeacherActiveSession({ db, user, sessionId, scheduleData, onFinish }) {
  const [studentList, setStudentList] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1. Load Data Siswa yang ada di Jadwal ini
    const load = async () => {
      const snap = await getDocs(collection(db, "students"));
      // Filter siswa sesuai ID yang ada di jadwal
      const students = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(s => scheduleData.studentIds?.includes(s.id));
      setStudentList(students);
      
      // Init Status Awal (Alpha semua)
      const att = {}; 
      students.forEach(s => att[s.id] = 'Alpha');
      setAttendance(att);
    };
    load();
  }, [db, scheduleData]);

  // --- LOGIKA TOGGLE (HANYA HIJAU / PUTIH) ---
  const togglePresence = async (studentId) => {
    const currentStatus = attendance[studentId];
    
    // Jika sekarang 'Hadir', ubah jadi 'Alpha'. Jika bukan 'Hadir', ubah jadi 'Hadir'.
    const newStatus = currentStatus === 'Hadir' ? 'Alpha' : 'Hadir';
    
    // Update State Lokal
    const newState = { ...attendance, [studentId]: newStatus };
    setAttendance(newState);
    
    // Update Database Realtime
    const updatedLogs = studentList.map(s => ({
      id: s.id, 
      name: s.name, 
      status: s.id === studentId ? newStatus : newState[s.id]
    }));
    
    await updateDoc(doc(db, "class_logs", sessionId), { studentsLog: updatedLogs });
  };

  const handleFinish = async () => {
    await updateDoc(doc(db, "class_logs", sessionId), { 
      endTime: new Date().toLocaleTimeString('id-ID'), 
      status: 'completed' 
    });
    onFinish();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in zoom-in-95 duration-300 font-sans">
      
      {/* HEADER KELAS */}
      <div className="bg-blue-600 text-white p-8 md:p-10 rounded-b-[3.5rem] shadow-2xl sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2"><span className="bg-blue-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">Live Class</span></div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">{scheduleData?.subject}</h1>
            <p className="font-bold text-lg mt-2 opacity-90 flex items-center gap-2"><Clock size={20}/> {scheduleData?.startTime} - Selesai</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-white text-red-600 px-10 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3 border-4 border-white/20">
            <XCircle size={20}/> Tutup Kelas
          </button>
        </div>
      </div>

      {/* GRID ABSENSI (SIMPLE TOGGLE) */}
      <div className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
        <p className="text-center text-slate-400 font-black uppercase tracking-[0.2em] text-xs mb-8">Tap Siswa yang Hadir untuk Menghijaukan</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {studentList.map(s => {
            const isPresent = attendance[s.id] === 'Hadir';
            
            return (
              <button 
                key={s.id} 
                onClick={() => togglePresence(s.id)}
                className={`relative p-6 rounded-[2.5rem] border-[6px] transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[220px] group ${isPresent ? 'bg-green-500 border-green-600 shadow-xl shadow-green-200 scale-105' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg'}`}
              >
                {/* ICON STATUS */}
                <div className={`p-4 rounded-full transition-all ${isPresent ? 'bg-white text-green-600' : 'bg-slate-50 text-slate-300'}`}>
                  {isPresent ? <UserCheck size={48} strokeWidth={3}/> : <UserX size={48} strokeWidth={3}/>}
                </div>

                {/* NAMA SISWA */}
                <div className="text-center">
                  <h3 className={`font-black text-xl uppercase leading-none mb-1 ${isPresent ? 'text-white' : 'text-slate-700'}`}>{s.name}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isPresent ? 'text-green-100' : 'text-slate-400'}`}>
                    {isPresent ? 'HADIR' : 'ABSEN'}
                  </p>
                </div>

                {/* INDIKATOR POJOK */}
                {isPresent && (
                  <div className="absolute top-4 right-4 text-white animate-bounce">
                    <CheckCircle size={24} fill="white" className="text-green-600"/>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* MODAL TUTUP KELAS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white p-12 rounded-[3.5rem] text-center max-w-md w-full shadow-2xl animate-in zoom-in">
            <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-8"><AlertTriangle size={48}/></div>
            <h3 className="text-3xl font-black uppercase mb-4 tracking-tighter">Sudah Selesai?</h3>
            <p className="text-xs text-slate-400 font-bold uppercase mb-10 tracking-widest">Pastikan Jurnal Guru sudah diisi.</p>
            
            <a href="https://docs.google.com/forms/d/e/1FAIpQLScExDWWtEHH-S1TAkL7_krYyZP-vTFplFxd4GpDKm_Abvqxdg/viewform" target="_blank" className="bg-blue-50 text-blue-600 py-4 px-8 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 mb-8 hover:bg-blue-100 border-2 border-blue-100 transition-all">
              <ExternalLink size={20}/> Isi Jurnal Mengajar
            </a>
            
            <div className="flex gap-4">
              <button onClick={()=>setShowModal(false)} className="flex-1 py-5 rounded-[2rem] font-bold bg-gray-100 text-slate-400 uppercase tracking-widest hover:bg-gray-200">Batal</button>
              <button onClick={handleFinish} className="flex-1 py-5 rounded-[2rem] font-bold bg-red-600 text-white uppercase tracking-widest shadow-xl hover:bg-red-700">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}