import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Users, 
  Clock, X, Save, Trash2, Edit, MapPin, CheckCircle, List
} from 'lucide-react';

const ROOMS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
const DAYS_NAME = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const FULL_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function AdminSchedule({ db }) {
  // Data
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Kalender & View
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateDetail, setSelectedDateDetail] = useState(null); // Modal Detail List

  // Form
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

  // Filter Jadwal Harian
  const getSchedulesForDate = (dayNumber) => {
    const dateObj = new Date(year, month, dayNumber);
    const dateStr = dateObj.toISOString().split('T')[0];
    const dayNameIndo = FULL_DAYS[dateObj.getDay()];
    
    return schedules.filter(s => {
      // Rutin: Cek Harinya (Senin/Selasa/dll)
      const isRoutine = s.type === 'routine' && s.day === dayNameIndo;
      // Booking: Cek Tanggalnya (2026-01-26)
      const isBooking = s.type === 'booking' && s.date === dateStr;
      return isRoutine || isBooking;
    }).sort((a,b) => a.startTime.localeCompare(b.startTime)); // Urutkan jam
  };

  // --- HANDLERS ---
  const openDayDetail = (dayNumber) => {
    const dateObj = new Date(year, month, dayNumber);
    setSelectedDateDetail({
      dayNumber,
      fullDate: dateObj.toISOString().split('T')[0],
      dayName: FULL_DAYS[dateObj.getDay()],
      list: getSchedulesForDate(dayNumber)
    });
  };

  const handleCreateNew = () => {
    setFormData({
      id: '', type: 'routine', // Default Rutin
      day: selectedDateDetail.dayName, 
      date: selectedDateDetail.fullDate,
      startTime: '', endTime: '',
      subject: '', teacherName: '', room: 'MERKURIUS', studentIds: []
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditExisting = (sch) => {
    setFormData({ ...sch }); 
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
      setShowForm(false);
      // Refresh detail modal
      if(selectedDateDetail) {
        openDayDetail(selectedDateDetail.dayNumber);
      }
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    if(confirm("Hapus Jadwal Ini Permanen?")) {
      await deleteDoc(doc(db, "schedules", formData.id));
      setShowForm(false);
      if(selectedDateDetail) openDayDetail(selectedDateDetail.dayNumber);
    }
  };

  const toggleStudent = (id) => {
    const current = [...formData.studentIds];
    const idx = current.indexOf(id);
    if (idx > -1) current.splice(idx, 1); else current.push(id);
    setFormData({ ...formData, studentIds: current });
  };

  return (
    <div className="w-full h-full p-6 font-sans text-slate-800">
      
      {/* 1. HEADER NAVIGASI */}
      <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-3 rounded-2xl"><CalIcon size={24}/></div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">{monthName}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kalender Akademik</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-3 bg-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all"><ChevronLeft size={20}/></button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-3 bg-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* 2. KALENDER GRID (BERSIH) */}
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200">
        <div className="grid grid-cols-7 bg-slate-50 border-b">
          {DAYS_NAME.map(d => <div key={d} className="p-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} className="border-r border-b bg-slate-50/20 min-h-[120px]"></div>)}
          {[...Array(days)].map((_, i) => {
            const dayNum = i + 1;
            const daySchedules = getSchedulesForDate(dayNum);
            return (
              <div key={dayNum} onClick={() => openDayDetail(dayNum)} className="border-r border-b p-3 hover:bg-blue-50 cursor-pointer transition-all min-h-[120px] group relative">
                <span className="text-lg font-black text-slate-700 group-hover:text-blue-600">{dayNum}</span>
                
                {/* Indikator Jadwal (Dot/Mini Bar) */}
                <div className="mt-2 space-y-1">
                  {daySchedules.slice(0, 3).map(s => (
                    <div key={s.id} className={`text-[9px] font-black px-2 py-1 rounded-lg truncate border-l-4 ${s.type==='routine' ? 'bg-red-50 text-red-600 border-red-500' : 'bg-blue-50 text-blue-600 border-blue-500'}`}>
                      {s.startTime} {s.subject}
                    </div>
                  ))}
                  {daySchedules.length > 3 && <div className="text-[9px] text-center font-bold text-slate-400">+{daySchedules.length-3} Lagi</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MODAL DETAIL TANGGAL (LIST VIEW) */}
      {selectedDateDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white p-8 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedDateDetail.dayName}, {selectedDateDetail.dayNumber} {monthName}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Daftar Kelas Aktif</p>
              </div>
              <button onClick={() => setSelectedDateDetail(null)} className="bg-white/10 p-3 rounded-full hover:bg-red-500 transition-all"><X size={20}/></button>
            </div>

            {/* List Jadwal (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {selectedDateDetail.list.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-bold italic">Belum ada jadwal di tanggal ini.</div>
              )}

              {selectedDateDetail.list.map(s => (
                <div key={s.id} className={`p-5 rounded-3xl border-2 shadow-sm flex justify-between items-center transition-all ${s.type==='routine' ? 'bg-white border-red-100 hover:border-red-300' : 'bg-white border-blue-100 hover:border-blue-300'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${s.type==='routine'?'bg-red-100 text-red-600':'bg-blue-100 text-blue-600'}`}>
                        {s.type === 'routine' ? 'Jadwal Paten' : 'Jadwal Booking'}
                      </span>
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1"><Clock size={12}/> {s.startTime} - {s.endTime}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase">{s.subject}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase">{s.teacherName}</p>
                    <div className="mt-2 flex items-center gap-4 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={12}/> {s.room}</span>
                      <span className="flex items-center gap-1"><Users size={12}/> {s.studentIds?.length || 0} Siswa</span>
                    </div>
                  </div>
                  <button onClick={()=>handleEditExisting(s)} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-800 hover:text-white transition-all shadow">
                    <Edit size={18}/>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Modal */}
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <button onClick={handleCreateNew} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Plus size={20}/> Tambah Jadwal Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL FORM (INPUT/EDIT) */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white shrink-0">
              <h3 className="font-black text-xl uppercase tracking-widest">{isEditing ? 'Edit Kelas & Siswa' : 'Tambah Kelas Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
              {/* Kolom Kiri */}
              <div className="space-y-4">
                {/* Tipe Jadwal Selector */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                  <button type="button" onClick={()=>setFormData({...formData, type:'routine'})} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.type==='routine'?'bg-red-500 text-white shadow':'text-gray-400'}`}>Paten (Rutin)</button>
                  <button type="button" onClick={()=>setFormData({...formData, type:'booking'})} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.type==='booking'?'bg-blue-500 text-white shadow':'text-gray-400'}`}>Booking (Sekali)</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Mapel</label><input required className="inp uppercase" value={formData.subject} onChange={e=>setFormData({...formData, subject:e.target.value})}/></div>
                  <div><label className="lbl">Tentor</label><select required className="inp" value={formData.teacherName} onChange={e=>setFormData({...formData, teacherName:e.target.value})}><option value="">Pilih...</option>{teachers.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                </div>
                
                {/* Pilihan Waktu Tergantung Tipe */}
                {formData.type === 'routine' ? (
                   <div><label className="lbl">Hari Rutin</label><select className="inp" value={formData.day} onChange={e=>setFormData({...formData, day:e.target.value})}>{FULL_DAYS.map(d=><option key={d}>{d}</option>)}</select></div>
                ) : (
                   <div><label className="lbl">Tanggal Booking</label><input type="date" className="inp" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})}/></div>
                )}

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
              <div className="flex flex-col h-full bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="lbl text-blue-600 mb-0">Pilih Siswa ({formData.studentIds.length})</label>
                  <span className="text-[9px] bg-white px-2 py-1 rounded text-slate-400 border">Centang Nama</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[300px] grid grid-cols-1 gap-2 pr-2">
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
        .inp { width: 100%; border: 1px solid #cbd5e1; padding: 12px; border-radius: 16px; font-size: 14px; font-weight: 700; color: #1e293b; outline: none; }
        .inp:focus { border-color: #2563eb; ring: 2px solid #bfdbfe; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}