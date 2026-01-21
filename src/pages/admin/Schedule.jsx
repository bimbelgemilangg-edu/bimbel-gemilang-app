import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, doc, onSnapshot, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { Calendar, ChevronLeft, ChevronRight, X, Trash2, CheckSquare, Square } from 'lucide-react';

const DAYS_INDONESIA = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_INDONESIA = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const getDayName = (dateObj) => DAYS_INDONESIA[dateObj.getDay()];
const formatDateStr = (dateObj) => dateObj.toISOString().split('T')[0];

export default function AdminSchedule({ db }) {
  const ROOMS = ["Merkurius", "Venus", "Bumi", "Mars", "Jupiter"];
  const [selectedRoom, setSelectedRoom] = useState("Merkurius");
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]); 

  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [scheduleType, setScheduleType] = useState('routine'); 
  const [newSchedule, setNewSchedule] = useState({ subject: "", teacherId: "", teacherName: "", day: "Senin", date: "", startTime: "14:00", endTime: "15:30", studentIds: [] });

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, "schedules")), snap => setSchedules(snap.docs.map(d => ({id:d.id, ...d.data()}))));
    const u2 = onSnapshot(query(collection(db, "users"), where("role","==","guru")), snap => setTeachers(snap.docs.map(d => ({id:d.id, ...d.data()}))));
    const u3 = onSnapshot(query(collection(db, "students"), orderBy("name")), snap => setStudents(snap.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); 
  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));
  const toggleStudent = (id) => { const current = newSchedule.studentIds || []; setNewSchedule({...newSchedule, studentIds: current.includes(id) ? current.filter(x => x !== id) : [...current, id]}); };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    const guru = teachers.find(t => t.id === newSchedule.teacherId);
    await addDoc(collection(db, "schedules"), { ...newSchedule, room: selectedRoom, type: scheduleType, teacherName: guru?.name || '?', date: formatDateStr(selectedDate), day: getDayName(selectedDate) });
    setIsAdding(false); setNewSchedule({ subject: "", teacherId: "", teacherName: "", day: "Senin", date: "", startTime: "14:00", endTime: "15:30", studentIds: [] });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="text-blue-600"/> Jadwal {selectedRoom}</h2>
        <div className="flex bg-gray-200 p-1 rounded-lg">{ROOMS.map(r => <button key={r} onClick={()=>setSelectedRoom(r)} className={`px-4 py-2 rounded text-xs font-bold ${selectedRoom===r?'bg-white text-blue-600 shadow':'text-gray-500'}`}>{r}</button>)}</div>
        <div className="flex items-center gap-2 bg-white p-1 rounded border"><button onClick={()=>changeMonth(-1)} className="p-1 hover:bg-gray-100"><ChevronLeft size={18}/></button><span className="font-bold text-xs w-24 text-center">{MONTHS_INDONESIA[currentDate.getMonth()]} {currentDate.getFullYear()}</span><button onClick={()=>changeMonth(1)} className="p-1 hover:bg-gray-100"><ChevronRight size={18}/></button></div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {DAYS_INDONESIA.map(d => <div key={d} className="bg-gray-50 p-2 text-center font-bold text-[10px] text-gray-500 uppercase">{d}</div>)}
          {Array(getFirstDayOfMonth(currentDate)).fill(null).map((_,i) => <div key={`blank-${i}`} className="bg-gray-50 min-h-[80px]"/>)}
          {Array.from({length: getDaysInMonth(currentDate)}, (_,i) => i+1).map(day => {
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = formatDateStr(dateObj);
            const events = schedules.filter(s => s.room === selectedRoom && ((s.type === 'routine' && s.day === getDayName(dateObj)) || (s.type === 'booking' && s.date === dateStr)));
            return (
              <div key={day} onClick={() => { setSelectedDate(dateObj); setIsAdding(false); setShowModal(true); }} className="bg-white min-h-[80px] p-1 relative cursor-pointer hover:bg-blue-50">
                <span className="text-[10px] font-bold text-gray-400">{day}</span>
                <div className="flex flex-col gap-1 mt-1">{events.slice(0, 3).map((e, idx) => <div key={idx} className={`h-1.5 rounded-full ${e.type === 'routine' ? 'bg-green-400' : 'bg-purple-400'}`} />)}{events.length > 3 && <div className="text-[8px] text-center text-gray-300">+{events.length-3}</div>}</div>
              </div>
            );
          })}
        </div>
      </div>
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4 border-b pb-2"><div><h3 className="font-bold text-lg">{formatDateStr(selectedDate)}</h3><p className="text-xs text-gray-400">{selectedRoom}</p></div><button onClick={()=>setShowModal(false)}><X size={20}/></button></div>
            {isAdding ? (
              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-lg"><button type="button" onClick={()=>setScheduleType('routine')} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${scheduleType==='routine'?'bg-white shadow text-green-600':'text-gray-500'}`}>RUTIN</button><button type="button" onClick={()=>setScheduleType('booking')} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${scheduleType==='booking'?'bg-white shadow text-purple-600':'text-gray-500'}`}>BOOKING</button></div>
                <input placeholder="Mapel" required className="w-full border p-2 rounded text-sm" value={newSchedule.subject} onChange={e=>setNewSchedule({...newSchedule, subject:e.target.value})}/>
                <select required className="w-full border p-2 rounded text-sm" value={newSchedule.teacherId} onChange={e=>setNewSchedule({...newSchedule, teacherId:e.target.value})}><option value="">Pilih Guru</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
                <div className="flex gap-2"><input type="time" required className="border p-2 rounded text-sm flex-1" value={newSchedule.startTime} onChange={e=>setNewSchedule({...newSchedule, startTime:e.target.value})}/><input type="time" required className="border p-2 rounded text-sm flex-1" value={newSchedule.endTime} onChange={e=>setNewSchedule({...newSchedule, endTime:e.target.value})}/></div>
                <div className="border rounded p-2 bg-gray-50"><label className="text-xs font-bold text-gray-500 block mb-2">Pilih Siswa ({newSchedule.studentIds.length})</label><div className="h-32 overflow-y-auto grid grid-cols-2 gap-2">{students.map(s => (<div key={s.id} onClick={() => toggleStudent(s.id)} className={`text-xs p-2 rounded border cursor-pointer flex items-center gap-2 ${newSchedule.studentIds.includes(s.id) ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-200'}`}>{newSchedule.studentIds.includes(s.id) ? <CheckSquare size={14}/> : <Square size={14}/>}{s.name}</div>))}</div></div>
                <div className="flex gap-2"><button type="button" onClick={()=>setIsAdding(false)} className="flex-1 py-2 text-gray-500 text-sm">Batal</button><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-bold text-sm">Simpan</button></div>
              </form>
            ) : (
              <div className="space-y-2">{schedules.filter(s => s.room === selectedRoom && ((s.type === 'routine' && s.day === getDayName(selectedDate)) || (s.type === 'booking' && s.date === formatDateStr(selectedDate)))).map(ev => (<div key={ev.id} className={`p-3 border rounded flex justify-between items-center ${ev.type==='routine'?'bg-green-50 border-green-200':'bg-purple-50 border-purple-200'}`}><div><div className="text-xs font-bold">{ev.startTime} - {ev.subject}</div><div className="text-[10px] text-gray-500">{ev.teacherName}</div></div><button onClick={async () => await deleteDoc(doc(db, "schedules", ev.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>))}<button onClick={() => setIsAdding(true)} className="w-full mt-4 py-3 border-2 border-dashed border-blue-200 text-blue-500 text-sm font-bold rounded hover:bg-blue-50">+ Tambah Jadwal Baru</button></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}