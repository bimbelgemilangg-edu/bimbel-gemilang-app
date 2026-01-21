import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, setDoc, getDoc, serverTimestamp, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { Users, Key, Calendar, Trash2, Edit, CheckCircle, Filter, BarChart3, Clock, BookOpen, X, Save } from 'lucide-react';

export default function AdminTeachers({ db }) {
  const [activeTab, setActiveTab] = useState('jurnal'); 
  
  const [teachers, setTeachers] = useState([]);
  const [classLogs, setClassLogs] = useState([]); 
  const [token, setToken] = useState("");
  
  // State Master Guru
  const [form, setForm] = useState({ name: "", phone: "", subject: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // State Filter Jurnal
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [filterTeacher, setFilterTeacher] = useState('all'); 

  // State Edit Jurnal (Action Admin)
  const [editingLog, setEditingLog] = useState(null); // Data log yang sedang diedit

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, "users"), where("role","==","guru")), s => setTeachers(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const u2 = onSnapshot(query(collection(db, "class_logs"), orderBy("timestamp", "desc")), s => setClassLogs(s.docs.map(d => ({id:d.id, ...d.data()}))));
    getDoc(doc(db, "settings", "attendanceToken")).then(s => s.exists() && setToken(s.data().token));
    return () => { u1(); u2(); };
  }, [db]);

  // --- LOGIKA FILTERING ---
  const filteredLogs = classLogs.filter(log => {
    const matchMonth = log.date?.startsWith(filterMonth);
    const matchTeacher = filterTeacher === 'all' || log.teacherName === filterTeacher;
    return matchMonth && matchTeacher;
  });

  const totalClasses = filteredLogs.length;

  // --- ACTIONS JURNAL (EDIT & DELETE) ---
  const handleDeleteLog = async (id) => {
    if(confirm("Hapus log aktivitas ini? Data kehadiran siswa di jam ini juga akan terhapus.")) {
      await deleteDoc(doc(db, "class_logs", id));
    }
  };

  const handleUpdateLog = async (e) => {
    e.preventDefault();
    try {
      const logRef = doc(db, "class_logs", editingLog.id);
      await updateDoc(logRef, {
        subject: editingLog.subject,
        room: editingLog.room,
        startTime: editingLog.startTime,
        endTime: editingLog.endTime,
        date: editingLog.date
      });
      setEditingLog(null);
      alert("Detail Aktivitas Berhasil Diperbarui!");
    } catch (err) { alert(err.message); }
  };

  // --- ACTIONS MASTER GURU ---
  const saveToken = async () => { await setDoc(doc(db, "settings", "attendanceToken"), { token: token.toUpperCase() }); alert("Token Disimpan!"); };
  const handleSaveGuru = async (e) => { e.preventDefault(); if(isEditing) await updateDoc(doc(db, "users", editId), form); else await addDoc(collection(db, "users"), { ...form, role: "guru", createdAt: serverTimestamp() }); setForm({name:"",phone:"",subject:""}); setIsEditing(false); setEditId(null); };
  const handleDeleteGuru = async (id) => { if(confirm("Hapus guru?")) await deleteDoc(doc(db, "users", id)); };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-20">
      {/* HEADER TAB */}
      <div className="flex border-b bg-white rounded-t-[2rem] overflow-hidden shadow-sm">
        <button onClick={()=>setActiveTab('jurnal')} className={`flex-1 md:flex-none px-10 py-6 font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab==='jurnal'?'bg-blue-600 text-white shadow-xl':'text-gray-400 hover:bg-gray-50'}`}><Calendar size={20}/> LOG AKTIVITAS GURU</button>
        <button onClick={()=>setActiveTab('data')} className={`flex-1 md:flex-none px-10 py-6 font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab==='data'?'bg-blue-600 text-white shadow-xl':'text-gray-400 hover:bg-gray-50'}`}><Users size={20}/> MASTER GURU & TOKEN</button>
      </div>

      {/* TAB 1: JURNAL DENGAN FITUR EDIT/HAPUS */}
      {activeTab === 'jurnal' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* FILTER BAR - FULL WIDTH */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
            <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Filter size={24}/></div>
              <input type="month" className="border-4 border-gray-50 p-3 rounded-2xl font-black text-gray-700 outline-none focus:border-blue-500 transition-all" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}/>
              <select className="border-4 border-gray-50 p-3 rounded-2xl font-black text-gray-700 outline-none focus:border-blue-500 transition-all min-w-[200px]" value={filterTeacher} onChange={e=>setFilterTeacher(e.target.value)}>
                <option value="all">Semua Tentor</option>
                {teachers.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            
            <div className="bg-slate-900 px-8 py-4 rounded-[1.5rem] text-center shadow-xl">
              <div className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Total Mengajar</div>
              <div className="text-3xl font-black text-white">{totalClasses} <span className="text-sm font-normal opacity-50">Sesi</span></div>
            </div>
          </div>

          {/* TABEL AKTIVITAS - LEBAR MAKSIMAL */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest w-16 text-center">No</th>
                    <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Waktu & Tanggal</th>
                    <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Nama Tentor</th>
                    <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Mata Pelajaran</th>
                    <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Absensi Siswa</th>
                    <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-6 text-center font-black text-gray-300">{idx + 1}</td>
                      <td className="p-6">
                        <div className="font-black text-blue-900 flex items-center gap-2"><Calendar size={14}/> {log.date}</div>
                        <div className="text-xs font-bold text-gray-400 flex items-center gap-2 mt-1"><Clock size={12}/> {log.startTime} - {log.endTime}</div>
                      </td>
                      <td className="p-6 font-black text-gray-700 uppercase tracking-tight">{log.teacherName}</td>
                      <td className="p-6">
                        <div className="font-black text-gray-800">{log.subject}</div>
                        <div className="text-[10px] font-bold text-blue-500 uppercase">Ruang: {log.room}</div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {log.studentsLog?.map((s,i) => (
                            <span key={i} className={`text-[9px] font-black px-2 py-1 rounded-lg border ${s.status==='Hadir'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200 line-through'}`}>
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={()=>setEditingLog(log)} className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl hover:bg-yellow-600 hover:text-white shadow-sm transition-all" title="Edit Detail"><Edit size={18}/></button>
                          <button onClick={()=>handleDeleteLog(log.id)} className="p-3 bg-red-100 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white shadow-sm transition-all" title="Hapus Permanen"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length===0 && <tr><td colSpan="6" className="p-20 text-center text-gray-300 font-bold italic bg-gray-50">Tidak ada log aktivitas untuk periode ini.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER GURU & TOKEN */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-500">
          {/* TOKEN CARD */}
          <div className="lg:col-span-3 bg-gradient-to-r from-slate-900 to-blue-900 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-blue-600/30 p-5 rounded-[1.5rem] border border-blue-400/30"><Key size={32} className="text-blue-400"/></div>
              <div><h3 className="text-2xl font-black tracking-tight">TOKEN SISTEM GURU</h3><p className="opacity-50 text-sm font-bold uppercase tracking-widest">Kunci akses harian untuk seluruh tentor.</p></div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <input value={token} onChange={e=>setToken(e.target.value.toUpperCase())} className="bg-white/10 border-2 border-white/20 p-4 rounded-2xl font-black text-3xl text-center tracking-[0.5em] w-full md:w-48 outline-none focus:border-blue-400 transition-all" placeholder="****"/>
              <button onClick={saveToken} className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Update</button>
            </div>
          </div>

          {/* FORM INPUT GURU */}
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl h-fit">
            <h3 className="text-xl font-black mb-8 text-gray-800 flex items-center gap-3 uppercase tracking-tighter"><Users size={24} className="text-blue-600"/> {isEditing?'Koreksi Data':'Perekrutan Guru'}</h3>
            <form onSubmit={handleSaveGuru} className="space-y-6">
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Nama Lengkap</label><input className="w-full border-4 border-gray-50 p-4 rounded-2xl font-bold focus:border-blue-500 outline-none" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Spesialisasi Mapel</label><input className="w-full border-4 border-gray-50 p-4 rounded-2xl font-bold focus:border-blue-500 outline-none" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Nomor WhatsApp</label><input className="w-full border-4 border-gray-50 p-4 rounded-2xl font-bold focus:border-blue-500 outline-none" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
              <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">{isEditing?'Simpan Perubahan':'Daftarkan Guru'}</button>
              {isEditing && <button type="button" onClick={()=>{setIsEditing(false); setForm({name:"",phone:"",subject:""})}} className="w-full text-red-500 font-bold text-xs uppercase">Batalkan Edit</button>}
            </form>
          </div>

          {/* LIST GURU */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center"><h3 className="font-black text-gray-700 uppercase tracking-widest">Database Tentor Aktif</h3></div>
            <div className="overflow-y-auto h-[500px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-100 z-10"><tr className="border-b"><th className="p-6 text-[10px] font-black uppercase text-gray-400">Tentor</th><th className="p-6 text-[10px] font-black uppercase text-gray-400">Kontak</th><th className="p-6 text-center text-[10px] font-black uppercase text-gray-400">Aksi</th></tr></thead>
                <tbody className="divide-y">
                  {teachers.map(t=>(
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-6"><div className="font-black text-gray-800 uppercase">{t.name}</div><div className="text-xs font-bold text-blue-500 uppercase">{t.subject}</div></td>
                      <td className="p-6 font-mono text-xs font-bold text-gray-400">{t.phone}</td>
                      <td className="p-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={()=>handleEdit(t)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/></button>
                          <button onClick={()=>handleDeleteGuru(t.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT JURNAL (ADMIN POWER) --- */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
              <div><h3 className="text-2xl font-black uppercase tracking-tighter">Edit Detail Aktivitas</h3><p className="opacity-70 text-xs font-bold uppercase">Koreksi Data Mengajar Tentor</p></div>
              <button onClick={()=>setEditingLog(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleUpdateLog} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="lbl">Mata Pelajaran</label>
                  <input className="inp" value={editingLog.subject} onChange={e=>setEditingLog({...editingLog, subject:e.target.value})} required/>
                </div>
                <div>
                  <label className="lbl">Ruangan</label>
                  <input className="inp" value={editingLog.room} onChange={e=>setEditingLog({...editingLog, room:e.target.value})} required/>
                </div>
                <div>
                  <label className="lbl">Tanggal</label>
                  <input type="date" className="inp" value={editingLog.date} onChange={e=>setEditingLog({...editingLog, date:e.target.value})} required/>
                </div>
                <div>
                  <label className="lbl">Jam Mulai</label>
                  <input type="time" className="inp text-xl" value={editingLog.startTime} onChange={e=>setEditingLog({...editingLog, startTime:e.target.value})} required/>
                </div>
                <div>
                  <label className="lbl">Jam Selesai</label>
                  <input type="time" className="inp text-xl" value={editingLog.endTime} onChange={e=>setEditingLog({...editingLog, endTime:e.target.value})} required/>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={()=>setEditingLog(null)} className="flex-1 py-5 rounded-2xl font-black text-gray-400 uppercase tracking-widest bg-gray-50 border-2 border-gray-100">Batal</button>
                <button type="submit" className="flex-2 bg-blue-600 text-white py-5 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                  <Save size={20}/> Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .lbl { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-left: 8px; margin-bottom: 8px; }
        .inp { width: 100%; border: 4px solid #f8fafc; padding: 16px; border-radius: 20px; font-weight: 800; color: #1e293b; outline: none; transition: all 0.3s; }
        .inp:focus { border-color: #2563eb; background: white; shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
      `}</style>
    </div>
  );
}