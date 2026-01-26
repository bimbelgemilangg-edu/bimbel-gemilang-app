import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, Clock, User, Plus, Trash2, X, Users, BookOpen, MapPin, CheckCircle, Edit, Save, ChevronRight, Info } from 'lucide-react';

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
// Slot Jam standar Bimbel (Bisa Anda sesuaikan)
const TIME_SLOTS = ["13:00", "14:30", "16:00", "18:30", "20:00"];
const ROOMS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

export default function AdminSchedule({ db }) {
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // UI State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const initialForm = {
    type: 'routine',
    day: 'Senin',
    startTime: '',
    endTime: '',
    subject: '',
    teacherName: '',
    room: 'MERKURIUS',
    studentIds: []
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, "schedules")), s => setSchedules(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(query(collection(db, "students")), s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u3 = onSnapshot(query(collection(db, "users")), s => setTeachers(s.docs.map(d => ({id: d.id, ...d.data()})).filter(u => u.role === 'guru')));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- ACTIONS ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.studentIds.length === 0) return alert("Pilih minimal 1 siswa!");
    
    try {
      if (isEditing) {
        await updateDoc(doc(db, "schedules", editId), { ...formData, updatedAt: serverTimestamp() });
        alert("Jadwal Berhasil Diperbarui!");
      } else {
        await addDoc(collection(db, "schedules"), { ...formData, createdAt: serverTimestamp() });
        alert("Jadwal Baru Diterbitkan!");
      }
      closeModal();
    } catch (err) { alert(err.message); }
  };

  const handleSlotClick = (day, time) => {
    setFormData({ ...initialForm, day, startTime: time });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditExisting = (sch) => {
    setFormData({ ...sch });
    setEditId(sch.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Hapus jadwal ini?")) {
      await deleteDoc(doc(db, "schedules", id));
      closeModal();
    }
  };

  const closeModal = () => { setShowModal(false); setIsEditing(false); setEditId(null); setFormData(initialForm); };

  const toggleStudent = (id) => {
    const current = [...formData.studentIds];
    const idx = current.indexOf(id);
    if (idx > -1) current.splice(idx, 1);
    else current.push(id);
    setFormData({ ...formData, studentIds: current });
  };

  return (
    <div className="space-y-8 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-xl">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg"><Calendar size={32}/></div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Master Kalender Jadwal</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Klik pada kolom jam untuk menambah atau edit siswa paralel</p>
          </div>
        </div>
      </div>

      {/* KALENDER GRID (ULTRA WIDE) */}
      <div className="bg-white rounded-[3rem] border-4 border-gray-50 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-6 border-r border-white/10 w-24 text-xs font-black uppercase tracking-widest">JAM</th>
                {DAYS.map(day => (
                  <th key={day} className="p-6 border-r border-white/10 min-w-[200px] text-sm font-black uppercase tracking-widest">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time} className="border-b border-gray-100 group">
                  <td className="p-6 bg-slate-50 border-r border-gray-100 text-center font-black text-slate-400 text-lg">{time}</td>
                  {DAYS.map(day => {
                    // Cari jadwal yang cocok dengan hari dan jam (pembulatan jam depan)
                    const matches = schedules.filter(s => s.day === day && s.startTime.startsWith(time.substring(0,2)));
                    
                    return (
                      <td key={day} className="p-2 border-r border-gray-100 relative min-h-[120px]">
                        {matches.length > 0 ? (
                          <div className="space-y-2">
                            {matches.map(sch => (
                              <div 
                                key={sch.id} 
                                onClick={() => handleEditExisting(sch)}
                                className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg cursor-pointer hover:bg-blue-700 transition-all active:scale-95 group/item relative overflow-hidden"
                              >
                                <div className="flex justify-between items-start mb-1">
                                   <p className="text-[10px] font-black opacity-60 uppercase">{sch.room}</p>
                                   <Edit size={12} className="opacity-0 group-hover/item:opacity-100 transition-all"/>
                                </div>
                                <p className="font-black text-xs uppercase leading-tight mb-2">{sch.subject}</p>
                                <div className="flex items-center gap-1 opacity-80">
                                   <Users size={10}/>
                                   <p className="text-[9px] font-bold uppercase">{sch.studentIds?.length || 0} Siswa Paralel</p>
                                </div>
                                <p className="text-[8px] mt-1 font-black bg-white/20 inline-block px-2 py-0.5 rounded uppercase">{sch.teacherName}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleSlotClick(day, time)}
                            className="w-full h-24 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-200 hover:border-blue-200 hover:text-blue-200 hover:bg-blue-50 transition-all"
                          >
                            <Plus size={32}/>
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

      {/* MODAL INPUT / EDIT (MODERN LOOK) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-10 flex justify-between items-center text-white px-16">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">{isEditing ? 'Kelola Kelas Paralel' : 'Tambah Jadwal Baru'}</h3>
                <p className="text-blue-100 font-bold uppercase text-xs tracking-[0.3em] mt-1">{formData.day} @ {formData.startTime}</p>
              </div>
              <button onClick={closeModal} className="bg-white/20 p-4 rounded-full hover:bg-white/40 transition-all"><X size={32}/></button>
            </div>

            <form onSubmit={handleSave} className="p-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* KIRI: DETAIL KELAS */}
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="lbl">Mata Pelajaran</label><input required className="inp" placeholder="CONTOH: MATEMATIKA" value={formData.subject} onChange={e=>setFormData({...formData, subject:e.target.value.toUpperCase()})}/></div>
                  <div className="space-y-2"><label className="lbl">Tentor (Guru)</label><select required className="inp font-bold" value={formData.teacherName} onChange={e=>setFormData({...formData, teacherName:e.target.value})}><option value="">-- Pilih Guru --</option>{teachers.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="lbl">Jam Mulai</label><input type="time" required className="inp text-xl" value={formData.startTime} onChange={e=>setFormData({...formData, startTime:e.target.value})}/></div>
                  <div className="space-y-2"><label className="lbl">Jam Selesai</label><input type="time" required className="inp text-xl" value={formData.endTime} onChange={e=>setFormData({...formData, endTime:e.target.value})}/></div>
                </div>

                <div className="space-y-2"><label className="lbl">Ruang Belajar</label><select className="inp font-bold" value={formData.room} onChange={e=>setFormData({...formData, room:e.target.value})}>{ROOMS.map(r=><option key={r}>{r}</option>)}</select></div>

                {isEditing && (
                  <button type="button" onClick={()=>handleDelete(formData.id)} className="w-full py-4 border-4 border-red-50 text-red-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"><Trash2 size={18}/> Hapus Seluruh Sesi Ini</button>
                )}
              </div>

              {/* KANAN: PILIH SISWA (PARALEL) */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <label className="lbl text-blue-600">Daftar Siswa (Paralel)</label>
                   <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase">{formData.studentIds.length} Anak Terpilih</span>
                </div>
                <div className="bg-slate-50 border-4 border-slate-50 rounded-[3rem] p-6 max-h-[400px] overflow-y-auto grid grid-cols-2 gap-3 shadow-inner">
                  {students.map(s => {
                    const isSelected = formData.studentIds.includes(s.id);
                    return (
                      <div key={s.id} onClick={()=>toggleStudent(s.id)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${isSelected?'bg-blue-600 border-blue-400 text-white shadow-lg':'bg-white border-gray-100 text-gray-400'}`}>
                        {isSelected ? <CheckCircle size={18}/> : <div className="w-[18px] h-[18px] border-2 rounded-full border-gray-200"></div>}
                        <div className="overflow-hidden"><p className="text-[10px] font-black uppercase truncate">{s.name}</p><p className={`text-[8px] font-bold ${isSelected?'text-blue-100':'text-gray-300'}`}>{s.schoolLevel}</p></div>
                      </div>
                    )
                  })}
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-2xl hover:bg-blue-600 active:scale-95 transition-all mt-4 flex items-center justify-center gap-4">
                  <Save size={28}/> {isEditing ? 'Update Paralel' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .lbl { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-left: 12px; margin-bottom: 8px; }
        .inp { width: 100%; border: 4px solid #f8fafc; padding: 18px; border-radius: 24px; font-weight: 800; color: #1e293b; outline: none; transition: all 0.3s; background: #f8fafc; }
        .inp:focus { border-color: #2563eb; background: white; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.1); }
      `}</style>
    </div>
  );
}