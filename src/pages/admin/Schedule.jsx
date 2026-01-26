import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Users, 
  Clock, MapPin, X, Save, Trash2, Edit, CheckCircle, Info
} from 'lucide-react';

const ROOMS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
const TIME_SLOTS = ["13:00", "14:30", "16:00", "18:30", "20:00"];
const DAYS_NAME = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AdminSchedule({ db }) {
  // --- STATE DATA ---
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // --- STATE KALENDER ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState("SEMUA RUANG");
  const [selectedDate, setSelectedDate] = useState(null); // Tanggal yang diklik

  // --- STATE MODAL/FORM ---
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    type: 'routine', day: '', date: '', startTime: '13:00', endTime: '14:30',
    subject: '', teacherName: '', room: 'MERKURIUS', studentIds: []
  });

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "schedules"), s => setSchedules(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, "students"), s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u3 = onSnapshot(query(collection(db, "users")), s => setTeachers(s.docs.map(d => ({id: d.id, ...d.data()})).filter(u => u.role === 'guru')));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- LOGIKA KALENDER ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { firstDay, days, year, month };
  };

  const { firstDay, days, year, month } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- LOGIKA FILTER JADWAL ---
  const getSchedulesForDate = (dayNumber) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const dayNameIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date(year, month, dayNumber).getDay()];
    
    return schedules.filter(s => {
      const isCorrectRoom = selectedRoom === "SEMUA RUANG" || s.room === selectedRoom;
      const isRoutine = s.type === 'routine' && s.day === dayNameIndo;
      const isBooking = s.type === 'booking' && s.date === dateStr;
      return isCorrectRoom && (isRoutine || isBooking);
    });
  };

  // --- ACTIONS ---
  const handleOpenDetail = (dayNumber) => {
    const dateObj = new Date(year, month, dayNumber);
    setSelectedDate({
      dayNumber,
      fullDate: dateObj.toISOString().split('T')[0],
      dayName: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dateObj.getDay()]
    });
  };

  const handleCreateInSlot = (room, time) => {
    setFormData({
      ...formData,
      type: 'routine',
      day: selectedDate.dayName,
      date: selectedDate.fullDate,
      startTime: time,
      room: room,
      studentIds: []
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (sch) => {
    setFormData(sch);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.studentIds.length === 0) return alert("Pilih minimal 1 siswa!");
    try {
      if (isEditing) await updateDoc(doc(db, "schedules", formData.id), { ...formData, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, "schedules"), { ...formData, createdAt: serverTimestamp() });
      setShowForm(false);
      alert("Jadwal Tersimpan!");
    } catch (err) { alert(err.message); }
  };

  const toggleStudent = (id) => {
    const current = [...formData.studentIds];
    const idx = current.indexOf(id);
    if (idx > -1) current.splice(idx, 1);
    else current.push(id);
    setFormData({ ...formData, studentIds: current });
  };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* 1. HEADER & RUANGAN SELECTOR */}
      <div className="bg-white p-10 rounded-[3rem] border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-slate-900 p-5 rounded-[1.5rem] text-white shadow-xl"><CalIcon size={40}/></div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">{monthName}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pilih Ruangan untuk melihat ketersediaan</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-2 rounded-[2rem] shadow-inner overflow-x-auto max-w-full">
          {["SEMUA RUANG", ...ROOMS].map(r => (
            <button 
              key={r} 
              onClick={() => setSelectedRoom(r)}
              className={`px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${selectedRoom === r ? 'bg-white text-blue-600 shadow-lg' : 'text-gray-400'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-4 bg-gray-50 rounded-full hover:bg-white hover:shadow-md transition-all"><ChevronLeft/></button>
          <button onClick={nextMonth} className="p-4 bg-gray-50 rounded-full hover:bg-white hover:shadow-md transition-all"><ChevronRight/></button>
        </div>
      </div>

      {/* 2. GRID KALENDER BULANAN */}
      <div className="bg-white rounded-[4rem] border-8 border-white shadow-2xl overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-900 text-white">
          {DAYS_NAME.map(d => <div key={d} className="p-6 text-center font-black text-xs uppercase tracking-[0.3em] opacity-50">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t">
          {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} className="h-40 bg-gray-50/50 border-r border-b"></div>)}
          {[...Array(days)].map((_, i) => {
            const dayNum = i + 1;
            const daySchedules = getSchedulesForDate(dayNum);
            return (
              <div 
                key={dayNum} 
                onClick={() => handleOpenDetail(dayNum)}
                className="h-48 border-r border-b p-4 hover:bg-blue-50 transition-all cursor-pointer group relative"
              >
                <span className="font-black text-2xl text-slate-300 group-hover:text-blue-600 transition-colors">{dayNum}</span>
                <div className="mt-2 space-y-1">
                  {daySchedules.slice(0, 3).map(s => (
                    <div key={s.id} className="text-[8px] font-black bg-blue-600 text-white p-1 rounded uppercase truncate shadow-sm">
                      {s.startTime} - {s.subject}
                    </div>
                  ))}
                  {daySchedules.length > 3 && <div className="text-[8px] font-bold text-blue-400">+{daySchedules.length - 3} Lainnya</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MODAL DETAIL TANGGAL (RUANG VS JAM) */}
      {selectedDate && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-10 flex justify-between items-center text-white">
              <div>
                <h3 className="text-4xl font-black uppercase tracking-tighter">{selectedDate.dayName}, {selectedDate.dayNumber} {monthName}</h3>
                <p className="text-blue-400 font-bold uppercase text-xs tracking-widest mt-2">Pilih slot kosong untuk menambah jadwal paralel</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="bg-white/10 p-5 rounded-full hover:bg-red-500 transition-all"><X size={32}/></button>
            </div>

            <div className="flex-1 overflow-auto p-10">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-6 bg-gray-50 border w-32 font-black uppercase text-xs">JAM</th>
                    {ROOMS.map(r => <th key={r} className="p-6 bg-gray-50 border font-black uppercase text-xs">{r}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(time => (
                    <tr key={time}>
                      <td className="p-6 border bg-gray-50 text-center font-black text-xl text-slate-400">{time}</td>
                      {ROOMS.map(room => {
                        const match = getSchedulesForDate(selectedDate.dayNumber).find(s => s.room === room && s.startTime === time);
                        return (
                          <td key={room} className="p-4 border min-w-[200px]">
                            {match ? (
                              <div 
                                onClick={() => handleEdit(match)}
                                className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl cursor-pointer hover:bg-blue-700 transition-all active:scale-95 group"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <p className="font-black text-sm uppercase">{match.subject}</p>
                                  <Edit size={14} className="opacity-0 group-hover:opacity-100"/>
                                </div>
                                <p className="text-[10px] font-bold opacity-60 uppercase mb-4">{match.teacherName}</p>
                                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl">
                                   <Users size={12}/>
                                   <p className="text-[10px] font-black uppercase">{match.studentIds?.length || 0} Siswa Paralel</p>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleCreateInSlot(room, time)}
                                className="w-full h-32 border-4 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-all gap-2"
                              >
                                <Plus size={32}/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Slot Kosong</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL FORM INPUT / PARALEL (BESAR) */}
      {showForm && (
        <div className="fixed inset-0 bg-blue-600/90 z-[600] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
             <div className="p-10 flex justify-between items-center border-b px-16">
                <h3 className="text-3xl font-black uppercase tracking-tighter">{isEditing ? 'Kelola Siswa Paralel' : 'Tambah Jadwal'}</h3>
                <button onClick={() => setShowForm(false)}><X size={32}/></button>
             </div>
             <form onSubmit={handleSave} className="p-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <div className="space-y-2"><label className="lbl">Mata Pelajaran</label><input required className="inp" value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value.toUpperCase()})}/></div>
                  <div className="space-y-2"><label className="lbl">Tentor</label><select required className="inp font-bold" value={formData.teacherName} onChange={e=>setFormData({...formData, teacherName: e.target.value})}><option value="">-- Pilih Guru --</option>{teachers.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="lbl">Jam Mulai</label><input type="time" className="inp" value={formData.startTime} onChange={e=>setFormData({...formData, startTime: e.target.value})}/></div>
                    <div className="space-y-2"><label className="lbl">Jam Selesai</label><input type="time" className="inp" value={formData.endTime} onChange={e=>setFormData({...formData, endTime: e.target.value})}/></div>
                  </div>
                  {isEditing && (
                    <button type="button" onClick={async () => {if(confirm("Hapus?")){await deleteDoc(doc(db,"schedules",formData.id)); setShowForm(false);}}} className="w-full py-4 text-red-500 font-black uppercase text-xs tracking-widest border-4 border-red-50 rounded-2xl hover:bg-red-50 transition-all">Hapus Sesi Ini</button>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="lbl text-blue-600">Pilih Siswa Paralel ({formData.studentIds.length})</label>
                  <div className="bg-gray-50 border-4 border-white rounded-[3rem] p-8 max-h-[400px] overflow-y-auto grid grid-cols-2 gap-4 shadow-inner">
                    {students.map(s => {
                      const isSel = formData.studentIds.includes(s.id);
                      return (
                        <div key={s.id} onClick={()=>toggleStudent(s.id)} className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-4 ${isSel ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400'}`}>
                          {isSel ? <CheckCircle size={20}/> : <div className="w-5 h-5 border-2 rounded-full border-gray-200"></div>}
                          <div className="overflow-hidden"><p className="text-xs font-black uppercase truncate">{s.name}</p><p className={`text-[8px] font-bold ${isSel?'text-blue-100':'text-gray-300'}`}>{s.schoolLevel}</p></div>
                        </div>
                      )
                    })}
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-2xl hover:bg-blue-600 active:scale-95 transition-all mt-4">Simpan Jadwal</button>
                </div>
             </form>
          </div>
        </div>
      )}

      <style>{`
        .lbl { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-left: 12px; margin-bottom: 8px; }
        .inp { width: 100%; border: 4px solid #f8fafc; padding: 20px; border-radius: 24px; font-weight: 800; color: #1e293b; outline: none; transition: all 0.3s; background: #f8fafc; font-size: 1.2rem; }
        .inp:focus { border-color: #2563eb; background: white; }
      `}</style>
    </div>
  );
}