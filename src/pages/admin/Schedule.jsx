import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Calendar, Clock, User, Plus, Trash2, X, Users, BookOpen, MapPin, CheckCircle, Edit, Save } from 'lucide-react';

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const ROOMS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

export default function AdminSchedule({ db }) {
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // UI State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const initialForm = {
    type: 'routine', // routine | booking
    day: 'Senin',
    date: '',
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.studentIds.length === 0) return alert("Pilih minimal 1 siswa!");
    if (!formData.teacherName) return alert("Pilih Tentor!");

    try {
      if (isEditing) {
        // --- LOGIKA EDIT / UPDATE ---
        await updateDoc(doc(db, "schedules", editId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert("Jadwal Berhasil Diperbarui!");
      } else {
        // --- LOGIKA TAMBAH BARU ---
        await addDoc(collection(db, "schedules"), {
          ...formData,
          createdAt: serverTimestamp()
        });
        alert("Jadwal Berhasil Dibuat!");
      }
      resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleEditClick = (sch) => {
    setFormData({
      type: sch.type,
      day: sch.day || 'Senin',
      date: sch.date || '',
      startTime: sch.startTime,
      endTime: sch.endTime,
      subject: sch.subject,
      teacherName: sch.teacherName,
      room: sch.room,
      studentIds: sch.studentIds || []
    });
    setEditId(sch.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Hapus jadwal ini?")) await deleteDoc(doc(db, "schedules", id));
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditId(null);
    setFormData(initialForm);
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
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] border shadow-xl gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-5 rounded-[1.5rem] text-white shadow-lg"><Calendar size={40}/></div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Manajemen Jadwal</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atur Sesi Belajar Rutin & Booking</p>
          </div>
        </div>
        <button onClick={()=>{ if(showForm) resetForm(); else setShowForm(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl">
          {showForm ? <X size={20}/> : <Plus size={20}/>} {showForm ? 'Tutup Panel' : 'Buat Jadwal Baru'}
        </button>
      </div>

      {/* FORM INPUT / EDIT */}
      {showForm && (
        <div className="bg-white rounded-[4rem] border-4 border-blue-50 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-blue-600 p-8 px-12 flex justify-between items-center">
            <h3 className="text-white font-black text-2xl uppercase tracking-widest">{isEditing ? 'Edit Jadwal / Tambah Siswa' : 'Konfigurasi Jadwal Baru'}</h3>
            <div className="bg-white/20 px-4 py-1 rounded-full text-white text-xs font-bold uppercase">{formData.type}</div>
          </div>
          
          <form onSubmit={handleSave} className="p-12 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* KOLOM 1: WAKTU & IDENTITAS */}
              <div className="space-y-6">
                <div className="flex gap-4 p-2 bg-gray-100 rounded-[2rem]">
                  <button type="button" onClick={()=>setFormData({...formData, type:'routine'})} className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase transition-all ${formData.type==='routine'?'bg-white text-blue-600 shadow-md':'text-gray-400'}`}>Rutin</button>
                  <button type="button" onClick={()=>setFormData({...formData, type:'booking'})} className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase transition-all ${formData.type==='booking'?'bg-white text-blue-600 shadow-md':'text-gray-400'}`}>Booking</button>
                </div>

                {formData.type === 'routine' ? (
                  <div className="space-y-2"><label className="lbl">Hari</label><select className="inp font-bold" value={formData.day} onChange={e=>setFormData({...formData, day:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></div>
                ) : (
                  <div className="space-y-2"><label className="lbl">Tanggal Khusus</label><input type="date" className="inp font-bold" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})}/></div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="lbl">Jam Mulai</label><input type="time" className="inp font-black text-xl" value={formData.startTime} onChange={e=>setFormData({...formData, startTime:e.target.value})} required/></div>
                  <div className="space-y-2"><label className="lbl">Jam Selesai</label><input type="time" className="inp font-black text-xl" value={formData.endTime} onChange={e=>setFormData({...formData, endTime:e.target.value})} required/></div>
                </div>

                <div className="space-y-2"><label className="lbl">Mata Pelajaran</label><input className="inp uppercase font-black" placeholder="CONTOH: MATEMATIKA" value={formData.subject} onChange={e=>setFormData({...formData, subject:e.target.value})} required/></div>
                
                <div className="space-y-2"><label className="lbl">Tentor (Guru)</label><select className="inp font-bold" value={formData.teacherName} onChange={e=>setFormData({...formData, teacherName:e.target.value})} required><option value="">-- Pilih Guru --</option>{teachers.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                
                <div className="space-y-2"><label className="lbl">Ruangan</label><select className="inp font-bold" value={formData.room} onChange={e=>setFormData({...formData, room:e.target.value})}>{ROOMS.map(r=><option key={r}>{r}</option>)}</select></div>
              </div>

              {/* KOLOM 2 & 3: PEMILIHAN SISWA (PARALEL) */}
              <div className="lg:col-span-2 space-y-4">
                <label className="lbl text-blue-600 flex items-center gap-2"><Users size={16}/> Pilih Siswa (Bisa Pilih Banyak untuk Paralel)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-4 bg-gray-50 rounded-[2.5rem] border-4 border-white shadow-inner">
                  {students.map(s => {
                    const isSelected = formData.studentIds.includes(s.id);
                    return (
                      <div key={s.id} onClick={()=>toggleStudent(s.id)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${isSelected?'bg-blue-600 border-blue-400 text-white shadow-lg':'bg-white border-gray-100 text-gray-500 hover:border-blue-200'}`}>
                        {isSelected ? <CheckCircle size={18}/> : <div className="w-[18px] h-[18px] border-2 rounded-full border-gray-200"></div>}
                        <div className="overflow-hidden"><p className="text-xs font-black uppercase truncate">{s.name}</p><p className={`text-[8px] font-bold ${isSelected?'text-blue-100':'text-gray-300'}`}>{s.schoolLevel} - Kls {s.schoolGrade}</p></div>
                      </div>
                    )
                  })}
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100"><p className="text-xs font-black text-blue-800 uppercase tracking-widest">Siswa Terpilih: {formData.studentIds.length} Anak</p></div>
              </div>

            </div>
            
            <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 active:scale-95 transition-all">
              {isEditing ? <><Save className="inline mr-3" size={28}/> Update Perubahan Jadwal</> : <><Plus className="inline mr-3" size={28}/> Terbitkan Jadwal Sekarang</>}
            </button>
          </form>
        </div>
      )}

      {/* DAFTAR JADWAL (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DAYS.map(dayName => {
          const daySchedules = schedules.filter(s => (s.type === 'routine' && s.day === dayName) || (s.type === 'booking' && s.day === dayName)).sort((a,b) => a.startTime.localeCompare(b.startTime));
          if (daySchedules.length === 0) return null;

          return (
            <div key={dayName} className="space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 border-l-8 border-blue-600 pl-4 mb-6">{dayName}</h3>
              <div className="space-y-6">
                {daySchedules.map(sch => (
                  <div key={sch.id} className="bg-white p-8 rounded-[3rem] border-4 border-gray-50 shadow-lg hover:border-blue-100 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{sch.type}</div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={()=>handleEditClick(sch)} className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl hover:bg-yellow-500 hover:text-white transition-all"><Edit size={18}/></button>
                        <button onClick={()=>handleDelete(sch.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-lg"><Clock size={24}/></div>
                      <div><p className="text-3xl font-black text-slate-800 tracking-tighter">{sch.startTime}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sampai {sch.endTime}</p></div>
                    </div>

                    <div className="space-y-4">
                      <div><label className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Mata Pelajaran</label><p className="text-xl font-black text-slate-800 uppercase leading-none">{sch.subject}</p></div>
                      <div><label className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Tentor Pengampu</label><p className="text-sm font-black text-slate-500 uppercase">{sch.teacherName}</p></div>
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-red-400"/><span className="text-xs font-black text-slate-400">RUANG {sch.room}</span></div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50">
                      <label className="text-[8px] font-black text-green-500 uppercase tracking-widest block mb-3">Siswa Terdaftar ({sch.studentIds?.length || 0} Anak)</label>
                      <div className="flex flex-wrap gap-2">
                        {sch.studentIds?.map(sid => {
                          const s = students.find(x => x.id === sid);
                          return s ? <span key={sid} className="bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 px-3 py-1 rounded-lg uppercase">{s.name}</span> : null;
                        })}
                      </div>
                    </div>
                    
                    <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform"><BookOpen size={150}/></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .lbl { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-left: 8px; margin-bottom: 8px; }
        .inp { width: 100%; border: 4px solid #f8fafc; padding: 16px; border-radius: 24px; font-weight: 800; color: #1e293b; outline: none; transition: all 0.3s; background: #f8fafc; }
        .inp:focus { border-color: #2563eb; background: white; shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
      `}</style>
    </div>
  );
}