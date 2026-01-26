import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Users, 
  Clock, X, Save, Trash2, Edit, CheckCircle, Info
} from 'lucide-react';

const ROOMS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
const TIME_SLOTS = ["13:00", "14:30", "16:00", "18:30", "20:00"];
const DAYS_NAME = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AdminSchedule({ db }) {
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Kalender State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState("SEMUA RUANG");
  const [selectedDateDetail, setSelectedDateDetail] = useState(null); // Modal Detail Hari

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '', type: 'routine', day: '', date: '', startTime: '', endTime: '',
    subject: '', teacherName: '', room: '', studentIds: []
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

  // Filter jadwal berdasarkan tanggal kalender
  const getSchedulesForDate = (dayNumber) => {
    const dateObj = new Date(year, month, dayNumber);
    const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayNameIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dateObj.getDay()];
    
    return schedules.filter(s => {
      const isRoomMatch = selectedRoom === "SEMUA RUANG" || s.room === selectedRoom;
      const isRoutine = s.type === 'routine' && s.day === dayNameIndo;
      const isBooking = s.type === 'booking' && s.date === dateStr;
      return isRoomMatch && (isRoutine || isBooking);
    });
  };

  // --- HANDLERS ---
  const openDayDetail = (dayNumber) => {
    const dateObj = new Date(year, month, dayNumber);
    setSelectedDateDetail({
      dayNumber,
      fullDate: dateObj.toISOString().split('T')[0],
      dayName: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dateObj.getDay()]
    });
  };

  const handleCreateNew = (room, time) => {
    setFormData({
      id: '', type: 'routine', 
      day: selectedDateDetail.dayName, 
      date: selectedDateDetail.fullDate,
      startTime: time, endTime: '', // Nanti diisi manual
      subject: '', teacherName: '', room: room, studentIds: []
    });
    setIsEditing(false);
    setShowForm(true); // Buka form di atas modal detail
  };

  const handleEditExisting = (sch) => {
    setFormData({ ...sch }); // Load data jadwal yang diklik
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.studentIds.length === 0) return alert("Pilih minimal 1 siswa!");
    
    try {
      if (isEditing) {
        await updateDoc(doc(db, "schedules", formData.id), { ...formData, updatedAt: serverTimestamp() });
        alert("Kelas Berhasil Diupdate!");
      } else {
        await addDoc(collection(db, "schedules"), { ...formData, createdAt: serverTimestamp() });
        alert("Kelas Baru Terjadwal!");
      }
      setShowForm(false); // Tutup form
      // Modal Detail Biarkan Terbuka agar user lihat perubahannya
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    if(confirm("Yakin hapus jadwal ini?")) {
      await deleteDoc(doc(db, "schedules", formData.id));
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
      
      {/* 1. HEADER & NAVIGASI BULAN (Compact) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-3 rounded-xl"><CalIcon size={24}/></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">{monthName}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase">Manajemen Kelas</p>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["SEMUA RUANG", ...ROOMS].map(r => (
            <button key={r} onClick={() => setSelectedRoom(r)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${selectedRoom === r ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* 2. KALENDER GRID (Responsive & Tidak Terlalu Besar) */}
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
              <div key={dayNum} onClick={() => openDayDetail(dayNum)} className="border-r border-b p-2 hover:bg-blue-50 cursor-pointer transition-colors min-h-[100px] relative group">
                <span className="text-sm font-black text-slate-700 group-hover:text-blue-600">{dayNum}</span>
                <div className="mt-1 flex flex-col gap-1">
                  {daySchedules.slice(0, 3).map(s => (
                    <div key={s.id} className="text-[9px] font-bold bg-white border border-slate-200 p-1 rounded shadow-sm truncate text-slate-600">
                      <span className="text-blue-600">{s.startTime}</span> {s.subject}
                    </div>
                  ))}
                  {daySchedules.length > 3 && <div className="text-[9px] text-center font-bold text-slate-400">+{daySchedules.length-3} More</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MODAL DETAIL HARI (MATRIKS JADWAL) */}
      {selectedDateDetail && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase">{selectedDateDetail.dayName}, {selectedDateDetail.dayNumber} {monthName}</h3>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Klik Slot untuk Edit / Tambah</p>
              </div>
              <button onClick={() => setSelectedDateDetail(null)} className="bg-white/10 p-2 rounded-full hover:bg-red-500 transition-all"><X size={20}/></button>
            </div>

            {/* Content Table Scrollable */}
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
                        // Cari jadwal di slot ini (match room & time start)
                        const match = getSchedulesForDate(selectedDateDetail.dayNumber).find(s => s.room === room && s.startTime.startsWith(time.substring(0,2)));
                        return (
                          <td key={room} className="border p-2 min-w-[140px] align-top">
                            {match ? (
                              <button 
                                onClick={() => handleEditExisting(match)} 
                                className="w-full bg-blue-100 border border-blue-200 p-3 rounded-xl text-left hover:bg-blue-200 hover:scale-[1.02] transition-all shadow-sm group"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[10px] font-black text-blue-700 uppercase bg-white/50 px-1 rounded">{match.subject}</span>
                                  <Edit size={12} className="text-blue-400 opacity-0 group-hover:opacity-100"/>
                                </div>
                                <div className="text-[9px] font-bold text-slate-500 truncate mb-1">{match.teacherName}</div>
                                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400">
                                  <Users size={10}/> {match.studentIds?.length || 0} Siswa
                                </div>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleCreateNew(room, time)}
                                className="w-full h-full min-h-[60px] border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                              >
                                <Plus size={16}/>
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

      {/* 4. MODAL FORM (INPUT/EDIT) - TUMPUK DI ATAS MODAL DETAIL */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
              <h3 className="font-black text-xl uppercase tracking-widest">{isEditing ? 'Edit Kelas & Siswa' : 'Jadwal Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[80vh] overflow-y-auto">
              {/* Kolom Kiri: Info Kelas */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Mapel</label><input required className="inp uppercase" value={formData.subject} onChange={e=>setFormData({...formData, subject:e.target.value})}/></div>
                  <div><label className="lbl">Tentor</label><select required className="inp" value={formData.teacherName} onChange={e=>setFormData({...formData, teacherName:e.target.value})}><option value="">Pilih...</option>{teachers.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Mulai</label><input type="time" className="inp" value={formData.startTime} onChange={e=>setFormData({...formData, startTime:e.target.value})}/></div>
                  <div><label className="lbl">Selesai</label><input type="time" className="inp" value={formData.endTime} onChange={e=>setFormData({...formData, endTime:e.target.value})}/></div>
                </div>
                <div><label className="lbl">Ruang</label><select className="inp" value={formData.room} onChange={e=>setFormData({...formData, room:e.target.value})}>{ROOMS.map(r=><option key={r}>{r}</option>)}</select></div>
                
                {isEditing && (
                  <button type="button" onClick={handleDelete} className="w-full py-3 mt-4 border-2 border-red-100 text-red-500 rounded-xl font-bold text-xs uppercase hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 size={16}/> Hapus Kelas Ini</button>
                )}
              </div>

              {/* Kolom Kanan: Pilih Siswa */}
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <label className="lbl text-blue-600 mb-0">Siswa Paralel ({formData.studentIds.length})</label>
                  <span className="text-[9px] bg-slate-100 px-2 py-1 rounded text-slate-500">Centang untuk memilih</span>
                </div>
                <div className="flex-1 bg-slate-50 border rounded-2xl p-4 overflow-y-auto max-h-[300px] grid grid-cols-1 gap-2">
                  {students.map(s => {
                    const isSel = formData.studentIds.includes(s.id);
                    return (
                      <div key={s.id} onClick={()=>toggleStudent(s.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                        {isSel ? <CheckCircle size={16} className="shrink-0"/> : <div className="w-4 h-4 border-2 rounded-full border-slate-200 shrink-0"></div>}
                        <div className="truncate text-xs font-bold uppercase">{s.name} <span className={`text-[9px] ml-1 ${isSel?'text-blue-200':'text-slate-400'}`}>({s.schoolLevel})</span></div>
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
        /* Scrollbar Halus */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}