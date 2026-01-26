import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Users, 
  Clock, X, Save, Trash2, Edit, CheckCircle, Info, List, Grid
} from 'lucide-react';

const ROOMS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
const TIME_SLOTS = ["13:00", "14:30", "16:00", "18:30", "20:00"];
const DAYS_NAME = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const FULL_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function AdminSchedule({ db }) {
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // View Mode: 'calendar' atau 'list' (SOLUSI DATA HILANG)
  const [viewMode, setViewMode] = useState('calendar');

  // Kalender State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState("SEMUA RUANG");
  const [selectedDateDetail, setSelectedDateDetail] = useState(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '', type: 'routine', day: 'Senin', date: '', startTime: '', endTime: '',
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

  const getSchedulesForDate = (dayNumber) => {
    const dateObj = new Date(year, month, dayNumber);
    const dateStr = dateObj.toISOString().split('T')[0];
    const dayNameIndo = FULL_DAYS[dateObj.getDay()];
    
    return schedules.filter(s => {
      // Normalisasi filter agar data lama tetap muncul (Case Insensitive)
      const roomMatch = selectedRoom === "SEMUA RUANG" || (s.room && s.room.toUpperCase() === selectedRoom);
      
      const isRoutine = s.type === 'routine' && s.day === dayNameIndo;
      const isBooking = s.type === 'booking' && s.date === dateStr;
      
      return roomMatch && (isRoutine || isBooking);
    });
  };

  // --- HANDLERS ---
  const openDayDetail = (dayNumber) => {
    const dateObj = new Date(year, month, dayNumber);
    setSelectedDateDetail({
      dayNumber,
      fullDate: dateObj.toISOString().split('T')[0],
      dayName: FULL_DAYS[dateObj.getDay()]
    });
  };

  const handleCreateNew = (room, time) => {
    setFormData({
      id: '', type: 'routine', 
      day: selectedDateDetail.dayName, 
      date: selectedDateDetail.fullDate,
      startTime: time, endTime: '',
      subject: '', teacherName: '', room: room, studentIds: []
    });
    setIsEditing(false);
    setShowForm(true);
  };

  // Handler Edit yang bisa dipanggil dari Kalender MAUPUN List View
  const handleEditExisting = (sch) => {
    setFormData({ 
      ...sch,
      // Pastikan field ada (untuk data lama)
      studentIds: sch.studentIds || [],
      room: sch.room || 'MERKURIUS',
      type: sch.type || 'routine',
      day: sch.day || 'Senin'
    }); 
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.studentIds.length === 0) return alert("Pilih minimal 1 siswa!");
    try {
      if (isEditing) {
        await updateDoc(doc(db, "schedules", formData.id), { ...formData, updatedAt: serverTimestamp() });
        alert("Jadwal Diperbarui!");
      } else {
        await addDoc(collection(db, "schedules"), { ...formData, createdAt: serverTimestamp() });
        alert("Jadwal Baru Dibuat!");
      }
      setShowForm(false);
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(confirm("Hapus jadwal ini permanen?")) {
      await deleteDoc(doc(db, "schedules", id));
      setShowForm(false);
    }
  };

  const toggleStudent = (id) => {
    const current = [...formData.studentIds];
    const idx = current.indexOf(id);
    if (idx > -1) current.splice(idx, 1); else current.push(id);
    setFormData({ ...formData, studentIds: current });
  };

  return (
    <div className="w-full h-full p-4 flex flex-col gap-4 font-sans text-slate-800">
      
      {/* 1. HEADER CONTROL */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-3 rounded-xl"><CalIcon size={24}/></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Jadwal Kelas</h2>
            <p className="text-xs text-slate-400 font-bold uppercase">Manajemen Ruang & Waktu</p>
          </div>
        </div>
        
        {/* VIEW MODE TOGGLE (SOLUSI MASALAH ANDA) */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={()=>setViewMode('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode==='calendar'?'bg-white text-blue-600 shadow-sm':'text-gray-400'}`}>
            <Grid size={14}/> Kalender
          </button>
          <button onClick={()=>setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode==='list'?'bg-white text-blue-600 shadow-sm':'text-gray-400'}`}>
            <List size={14}/> Semua Daftar ({schedules.length})
          </button>
        </div>

        {viewMode === 'calendar' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-[500px]">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-lg"><ChevronLeft size={16}/></button>
            <span className="font-black text-sm uppercase min-w-[100px] text-center">{monthName}</span>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-lg"><ChevronRight size={16}/></button>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            {["SEMUA RUANG", ...ROOMS].map(r => (
              <button key={r} onClick={() => setSelectedRoom(r)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${selectedRoom === r ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2A. MODE KALENDER (DEFAULT) */}
      {viewMode === 'calendar' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 bg-slate-50 border-b">
            {DAYS_NAME.map(d => <div key={d} className="p-3 text-center text-xs font-black text-slate-400 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} className="border-r border-b bg-slate-50/30"></div>)}
            {[...Array(days)].map((_, i) => {
              const dayNum = i + 1;
              const daySchedules = getSchedulesForDate(dayNum);
              return (
                <div key={dayNum} onClick={() => openDayDetail(dayNum)} className="border-r border-b p-2 hover:bg-blue-50 cursor-pointer transition-colors min-h-[100px] group relative">
                  <span className="text-sm font-black text-slate-700 group-hover:text-blue-600">{dayNum}</span>
                  <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                    {daySchedules.slice(0, 3).map(s => (
                      <div key={s.id} className="text-[9px] font-bold bg-white border border-slate-200 p-1 rounded shadow-sm truncate text-slate-600 border-l-4 border-l-blue-500 pl-2">
                        {s.startTime} {s.subject}
                      </div>
                    ))}
                    {daySchedules.length > 3 && <div className="text-[9px] text-center font-bold text-slate-400">+{daySchedules.length-3} More</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2B. MODE LIST (PENYELAMAT DATA) */}
      {viewMode === 'list' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-yellow-50 border-b border-yellow-100 text-yellow-700 text-xs font-bold flex items-center gap-2">
            <Info size={16}/> Jika jadwal tidak muncul di kalender, edit lewat sini untuk memperbaiki format Ruangan/Hari.
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map(sch => (
                <div key={sch.id} className="border-2 border-slate-100 rounded-xl p-4 hover:border-blue-300 transition-all bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${sch.type==='routine'?'bg-blue-100 text-blue-600':'bg-purple-100 text-purple-600'}`}>{sch.type}</span>
                    <button onClick={()=>handleEditExisting(sch)} className="p-2 bg-slate-100 rounded-lg hover:bg-yellow-100 text-slate-500 hover:text-yellow-600"><Edit size={14}/></button>
                  </div>
                  <h4 className="font-black text-lg text-slate-800 uppercase">{sch.subject}</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">{sch.teacherName}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-2 rounded-lg">
                    <div>Hari: {sch.day || sch.date}</div>
                    <div>Jam: {sch.startTime} - {sch.endTime}</div>
                    <div>Ruang: {sch.room}</div>
                    <div>Murid: {sch.studentIds?.length || 0} Org</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL DETAIL HARI (MATRIKS) */}
      {selectedDateDetail && viewMode === 'calendar' && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div><h3 className="text-2xl font-black uppercase">{selectedDateDetail.dayName}, {selectedDateDetail.dayNumber} {monthName}</h3></div>
              <button onClick={() => setSelectedDateDetail(null)} className="bg-white/10 p-2 rounded-full hover:bg-red-500 transition-all"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border bg-slate-50 text-center text-xs font-black text-slate-500 uppercase sticky top-0 z-10 w-24">JAM</th>
                    {ROOMS.map(r => <th key={r} className="p-3 border bg-slate-50 text-center text-xs font-black text-slate-500 uppercase sticky top-0 z-10">{r}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(time => (
                    <tr key={time}>
                      <td className="p-4 border bg-slate-50 text-center font-black text-sm text-slate-400">{time}</td>
                      {ROOMS.map(room => {
                        const match = getSchedulesForDate(selectedDateDetail.dayNumber).find(s => s.room === room && s.startTime.startsWith(time.substring(0,2)));
                        return (
                          <td key={room} className="border p-2 min-w-[140px] align-top">
                            {match ? (
                              <button onClick={() => handleEditExisting(match)} className="w-full bg-blue-100 border border-blue-200 p-3 rounded-xl text-left hover:bg-blue-200 hover:scale-[1.02] transition-all shadow-sm group">
                                <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-black text-blue-700 uppercase bg-white/50 px-1 rounded">{match.subject}</span><Edit size={12} className="text-blue-400 opacity-0 group-hover:opacity-100"/></div>
                                <div className="text-[9px] font-bold text-slate-500 truncate mb-1">{match.teacherName}</div>
                                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400"><Users size={10}/> {match.studentIds?.length || 0} Siswa</div>
                              </button>
                            ) : (
                              <button onClick={() => handleCreateNew(room, time)} className="w-full h-full min-h-[60px] border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all"><Plus size={16}/></button>
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

      {/* 4. MODAL FORM INPUT/EDIT */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
              <h3 className="font-black text-xl uppercase tracking-widest">{isEditing ? 'Edit Jadwal' : 'Jadwal Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Mapel</label><input required className="inp uppercase" value={formData.subject} onChange={e=>setFormData({...formData, subject:e.target.value})}/></div>
                  <div><label className="lbl">Tentor</label><select required className="inp" value={formData.teacherName} onChange={e=>setFormData({...formData, teacherName:e.target.value})}><option value="">Pilih...</option>{teachers.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                </div>
                <div><label className="lbl">Hari (Rutin)</label><select className="inp" value={formData.day} onChange={e=>setFormData({...formData, day:e.target.value})}>{FULL_DAYS.map(d=><option key={d}>{d}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Mulai</label><input type="time" className="inp" value={formData.startTime} onChange={e=>setFormData({...formData, startTime:e.target.value})}/></div>
                  <div><label className="lbl">Selesai</label><input type="time" className="inp" value={formData.endTime} onChange={e=>setFormData({...formData, endTime:e.target.value})}/></div>
                </div>
                <div><label className="lbl">Ruang</label><select className="inp" value={formData.room} onChange={e=>setFormData({...formData, room:e.target.value})}>{ROOMS.map(r=><option key={r}>{r}</option>)}</select></div>
                {isEditing && (
                  <button type="button" onClick={()=>handleDelete(formData.id)} className="w-full py-3 mt-4 border-2 border-red-100 text-red-500 rounded-xl font-bold text-xs uppercase hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 size={16}/> Hapus</button>
                )}
              </div>
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2"><label className="lbl text-blue-600 mb-0">Pilih Siswa ({formData.studentIds.length})</label><span className="text-[9px] bg-slate-100 px-2 py-1 rounded text-slate-500">Centang</span></div>
                <div className="flex-1 bg-slate-50 border rounded-2xl p-4 overflow-y-auto max-h-[300px] grid grid-cols-1 gap-2">
                  {students.map(s => {
                    const isSel = formData.studentIds.includes(s.id);
                    return (
                      <div key={s.id} onClick={()=>toggleStudent(s.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                        {isSel ? <CheckCircle size={16} className="shrink-0"/> : <div className="w-4 h-4 border-2 rounded-full border-slate-200 shrink-0"></div>}
                        <div className="truncate text-xs font-bold uppercase">{s.name}</div>
                      </div>
                    )
                  })}
                </div>
                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-sm mt-4 shadow-lg hover:bg-blue-600 transition-all">{isEditing ? 'Simpan Perubahan' : 'Buat Jadwal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .lbl { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .inp { width: 100%; border: 1px solid #cbd5e1; padding: 10px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #1e293b; outline: none; }
        .inp:focus { border-color: #2563eb; ring: 2px solid #bfdbfe; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}