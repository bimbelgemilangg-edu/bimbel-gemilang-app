import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, setDoc, getDoc, serverTimestamp, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { Users, Key, Calendar, Trash2, Edit, CheckCircle, Filter, BarChart3 } from 'lucide-react';

export default function AdminTeachers({ db }) {
  const [activeTab, setActiveTab] = useState('jurnal'); 
  
  const [teachers, setTeachers] = useState([]);
  const [classLogs, setClassLogs] = useState([]); 
  const [token, setToken] = useState("");
  
  // State Form Guru
  const [form, setForm] = useState({ name: "", phone: "", subject: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // --- STATE BARU: FILTER JURNAL ---
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // Default Bulan Ini (YYYY-MM)
  const [filterTeacher, setFilterTeacher] = useState('all'); // Default Semua Guru

  useEffect(() => {
    // 1. Ambil Data Guru
    const u1 = onSnapshot(query(collection(db, "users"), where("role","==","guru")), s => setTeachers(s.docs.map(d => ({id:d.id, ...d.data()}))));
    
    // 2. Ambil Semua Log (Nanti difilter di frontend biar cepat)
    const u2 = onSnapshot(query(collection(db, "class_logs"), orderBy("timestamp", "desc")), s => setClassLogs(s.docs.map(d => ({id:d.id, ...d.data()}))));
    
    // 3. Token
    getDoc(doc(db, "settings", "attendanceToken")).then(s => s.exists() && setToken(s.data().token));
    
    return () => { u1(); u2(); };
  }, [db]);

  // --- LOGIKA FILTERING ---
  const filteredLogs = classLogs.filter(log => {
    const matchMonth = log.date.startsWith(filterMonth);
    const matchTeacher = filterTeacher === 'all' || log.teacherName === filterTeacher;
    return matchMonth && matchTeacher;
  });

  // --- LOGIKA REKAP (HITUNG TOTAL) ---
  const totalClasses = filteredLogs.length;
  const totalStudentsPresent = filteredLogs.reduce((acc, curr) => {
    const hadir = curr.studentsLog?.filter(s => s.status === 'Hadir').length || 0;
    return acc + hadir;
  }, 0);

  // --- CRUD GURU & TOKEN ---
  const saveToken = async () => { await setDoc(doc(db, "settings", "attendanceToken"), { token: token.toUpperCase() }); alert("Token Disimpan!"); };
  const handleSaveGuru = async (e) => { e.preventDefault(); if(isEditing) await updateDoc(doc(db, "users", editId), form); else await addDoc(collection(db, "users"), { ...form, role: "guru", createdAt: serverTimestamp() }); setForm({name:"",phone:"",subject:""}); setIsEditing(false); setEditId(null); };
  const handleDelete = async (id) => { if(confirm("Hapus?")) await deleteDoc(doc(db, "users", id)); };
  const handleEdit = (t) => { setForm(t); setIsEditing(true); setEditId(t.id); };

  return (
    <div className="space-y-6">
      <div className="flex border-b bg-white rounded-t-xl overflow-hidden">
        <button onClick={()=>setActiveTab('jurnal')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${activeTab==='jurnal'?'text-blue-600 border-b-2 border-blue-600 bg-blue-50':'text-gray-500'}`}><Calendar size={16}/> Jurnal & Rekap</button>
        <button onClick={()=>setActiveTab('data')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${activeTab==='data'?'text-orange-600 border-b-2 border-orange-600 bg-orange-50':'text-gray-500'}`}><Users size={16}/> Master Guru & Token</button>
      </div>

      {/* TAB 1: JURNAL KELAS DENGAN FILTER & REKAP */}
      {activeTab === 'jurnal' && (
        <div className="space-y-4">
          
          {/* AREA FILTER & REKAP (FITUR BARU) */}
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
              <div className="flex gap-2 items-center w-full md:w-auto">
                <div className="bg-blue-100 p-2 rounded text-blue-600"><Filter size={18}/></div>
                <div className="flex gap-2 w-full">
                  <input type="month" className="border p-2 rounded text-sm font-bold text-gray-600" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}/>
                  <select className="border p-2 rounded text-sm font-bold text-gray-600 flex-1" value={filterTeacher} onChange={e=>setFilterTeacher(e.target.value)}>
                    <option value="all">Semua Guru</option>
                    {teachers.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              
              {/* KARTU REKAP KECIL */}
              <div className="flex gap-4">
                <div className="bg-blue-50 px-4 py-2 rounded border border-blue-100 text-center">
                  <div className="text-[10px] uppercase font-bold text-blue-400">Total Kelas</div>
                  <div className="text-xl font-black text-blue-700">{totalClasses}</div>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded border border-green-100 text-center">
                  <div className="text-[10px] uppercase font-bold text-green-400">Siswa Hadir</div>
                  <div className="text-xl font-black text-green-700">{totalStudentsPresent}</div>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL DATA FILTERED */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex gap-2 items-center"><BarChart3 size={16}/> Data Aktivitas</h3>
              <span className="text-xs text-gray-400">Menampilkan {filteredLogs.length} data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Guru</th>
                    <th className="p-3">Mapel</th>
                    <th className="p-3">Kehadiran Siswa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3 text-center text-gray-400 text-xs">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-blue-900">{log.date}</div>
                        <div className="text-xs text-gray-500">{log.startTime} - {log.endTime}</div>
                      </td>
                      <td className="p-3 font-bold">{log.teacherName}</td>
                      <td className="p-3">{log.subject} <span className="text-gray-400 text-xs">({log.room})</span></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {log.studentsLog?.filter(s=>s.status==='Hadir').map((s,i) => (
                            <span key={i} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">{s.name}</span>
                          ))}
                          {log.studentsLog?.filter(s=>s.status!=='Hadir').map((s,i) => (
                            <span key={i} className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 line-through" title={s.status}>{s.name}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length===0 && <tr><td colSpan="5" className="p-10 text-center text-gray-400 bg-gray-50 italic">Tidak ada aktivitas pada filter ini.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA GURU & TOKEN (TETAP SAMA) */}
      {activeTab === 'data' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-3 bg-white p-6 rounded-xl border flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-full"><Key className="text-yellow-600"/></div>
            <div><h3 className="font-bold">Token Login Guru</h3><p className="text-xs text-gray-500">Guru wajib memasukkan ini saat buka aplikasi.</p></div>
            <input value={token} onChange={e=>setToken(e.target.value.toUpperCase())} className="border-2 p-2 rounded text-center font-bold tracking-widest uppercase w-32 ml-auto" placeholder="TOKEN"/>
            <button onClick={saveToken} className="bg-black text-white px-4 py-2 rounded font-bold">SIMPAN</button>
          </div>

          <div className="md:col-span-1 bg-white p-6 rounded-xl border">
            <h3 className="font-bold mb-4">{isEditing?'Edit Guru':'Tambah Guru'}</h3>
            <form onSubmit={handleSaveGuru} className="space-y-3">
              <input className="w-full border p-2 rounded" placeholder="Nama Lengkap" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
              <input className="w-full border p-2 rounded" placeholder="No HP" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
              <input className="w-full border p-2 rounded" placeholder="Mapel" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/>
              <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">SIMPAN</button>
              {isEditing && <button type="button" onClick={()=>{setIsEditing(false); setForm({name:"",phone:"",subject:""})}} className="w-full bg-gray-100 py-2 rounded text-xs">Batal</button>}
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border overflow-y-auto h-80">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100"><tr><th className="p-3">Nama</th><th className="p-3">HP</th><th className="p-3 text-center">Aksi</th></tr></thead>
              <tbody className="divide-y">{teachers.map(t=><tr key={t.id}><td className="p-3 font-bold">{t.name}<div className="text-xs font-normal text-gray-500">{t.subject}</div></td><td className="p-3">{t.phone}</td><td className="p-3 text-center"><button onClick={()=>handleEdit(t)} className="text-blue-500 mx-1"><Edit size={14}/></button><button onClick={()=>handleDelete(t.id)} className="text-red-500 mx-1"><Trash2 size={14}/></button></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}