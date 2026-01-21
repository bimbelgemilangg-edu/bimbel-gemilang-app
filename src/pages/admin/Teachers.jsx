import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, setDoc, getDoc, serverTimestamp, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { Users, Key, Calendar, DollarSign, CheckCircle, Trash2, Edit, Save, X, BookOpen, AlertCircle } from 'lucide-react';

const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminTeachers({ db }) {
  const [activeTab, setActiveTab] = useState('jurnal'); // Default ke Jurnal biar Admin langsung liat kinerja
  
  const [teachers, setTeachers] = useState([]);
  const [classLogs, setClassLogs] = useState([]); // Data Jurnal Mengajar
  const [token, setToken] = useState("");
  
  // State Form
  const [form, setForm] = useState({ name: "", phone: "", subject: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // State Gaji
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [ratePerMeetingStr, setRatePerMeetingStr] = useState("");
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, "users"), where("role","==","guru")), s => setTeachers(s.docs.map(d => ({id:d.id, ...d.data()}))));
    
    // AMBIL JURNAL KELAS (Yang disubmit Guru)
    const u2 = onSnapshot(query(collection(db, "class_logs"), orderBy("timestamp", "desc")), s => {
      setClassLogs(s.docs.map(d => ({id:d.id, ...d.data()})));
    });

    getDoc(doc(db, "settings", "attendanceToken")).then(s => s.exists() && setToken(s.data().token));
    return () => { u1(); u2(); };
  }, [db]);

  // --- FUNGSI ADMIN EDIT ABSENSI SISWA ---
  const updateStudentStatus = async (logId, studentId, newStatus, currentLog) => {
    const updatedStudents = currentLog.studentsLog.map(s => 
      s.id === studentId ? { ...s, status: newStatus } : s
    );
    await updateDoc(doc(db, "class_logs", logId), { studentsLog: updatedStudents });
  };

  // --- FUNGSI GAJI BERDASARKAN JURNAL ---
  const calculateSalary = () => {
    if (!selectedTeacher) return { count: 0, total: 0 };
    // Hitung berdasarkan JURNAL KELAS, bukan login token
    const count = classLogs.filter(log => 
      log.teacherName === selectedTeacher.name && 
      log.date.startsWith(salaryMonth)
    ).length;
    const rate = parseRupiah(ratePerMeetingStr);
    return { count, total: count * rate };
  };

  const handlePaySalary = async () => {
    const { count, total } = calculateSalary();
    if (total <= 0) return alert("Total 0");
    if (confirm(`Bayar Rp ${formatRupiah(total)}?`)) {
      await addDoc(collection(db, "payments"), {
        amount: total, method: "Tunai", type: "expense", category: "Gaji Guru",
        description: `Gaji ${selectedTeacher.name} (${salaryMonth} - ${count} Sesi)`, date: serverTimestamp(), studentName: '-'
      });
      alert("Tercatat!");
    }
  };

  // ... (Fungsi CRUD Guru & Token sama seperti sebelumnya, dipersingkat di sini)
  const saveToken = async () => { await setDoc(doc(db, "settings", "attendanceToken"), { token: token.toUpperCase() }); alert("Saved"); };
  const handleSaveGuru = async (e) => { e.preventDefault(); await addDoc(collection(db, "users"), { ...form, role: "guru", createdAt: serverTimestamp() }); setForm({name:"",phone:"",subject:""}); };
  const handleDelete = async (id) => { if(confirm("Hapus?")) await deleteDoc(doc(db, "users", id)); };

  return (
    <div className="space-y-6">
      <div className="flex border-b bg-white rounded-t-xl overflow-hidden">
        <button onClick={()=>setActiveTab('jurnal')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${activeTab==='jurnal'?'text-blue-600 border-b-2 border-blue-600 bg-blue-50':'text-gray-500'}`}><BookOpen size={16}/> Jurnal Kelas (Realtime)</button>
        <button onClick={()=>setActiveTab('gaji')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${activeTab==='gaji'?'text-green-600 border-b-2 border-green-600 bg-green-50':'text-gray-500'}`}><DollarSign size={16}/> Payroll</button>
        <button onClick={()=>setActiveTab('data')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${activeTab==='data'?'text-orange-600 border-b-2 border-orange-600 bg-orange-50':'text-gray-500'}`}><Users size={16}/> Master Guru</button>
      </div>

      {/* TAB 1: JURNAL KELAS (MONITORING) */}
      {activeTab === 'jurnal' && (
        <div className="space-y-4">
          {classLogs.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex justify-between items-start border-b pb-2 mb-2">
                <div>
                  <h4 className="font-bold text-lg text-blue-800">{log.subject} <span className="text-gray-500 text-sm font-normal">({log.room})</span></h4>
                  <p className="text-xs text-gray-500">{log.date} • {log.startTime} - {log.endTime} • <b>{log.teacherName}</b></p>
                </div>
                <button onClick={()=>deleteDoc(doc(db, "class_logs", log.id))} className="text-red-300 hover:text-red-600"><Trash2 size={16}/></button>
              </div>
              
              {/* ABSENSI SISWA DI KELAS INI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {log.studentsLog?.map((s, idx) => (
                  <div key={idx} className={`text-xs p-2 rounded border flex justify-between items-center ${s.status==='Hadir'?'bg-green-50 border-green-200':s.status==='Sakit'?'bg-yellow-50 border-yellow-200':'bg-red-50 border-red-200'}`}>
                    <span className="font-bold truncate w-20">{s.name}</span>
                    <select 
                      className="bg-transparent font-bold outline-none cursor-pointer" 
                      value={s.status} 
                      onChange={(e) => updateStudentStatus(log.id, s.id, e.target.value, log)}
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Izin">Izin</option>
                      <option value="Alpha">Alpha</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {classLogs.length === 0 && <div className="text-center py-10 text-gray-400">Belum ada kelas yang diselesaikan guru.</div>}
        </div>
      )}

      {/* TAB 2: PAYROLL (GAJI) */}
      {activeTab === 'gaji' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-green-700 mb-4">Hitung Gaji (Based on Jurnal)</h3>
            <div className="space-y-3">
              <select className="w-full border p-2 rounded" onChange={e => setSelectedTeacher(teachers.find(t => t.id === e.target.value))}>
                <option value="">-- Pilih Guru --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="month" className="w-full border p-2 rounded" value={salaryMonth} onChange={e=>setSalaryMonth(e.target.value)}/>
              
              <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
                <div className="text-xs font-bold text-green-800 uppercase">Jumlah Sesi Mengajar</div>
                <div className="text-3xl font-black text-green-900 my-1">{calculateSalary().count}</div>
                <div className="text-[10px] text-green-600">Sesuai Jurnal Kelas yang Masuk</div>
              </div>

              <input className="w-full text-xl font-bold border-b-2 border-green-600 p-2 outline-none" placeholder="Honor per Sesi (Rp)" value={ratePerMeetingStr} onChange={e => setRatePerMeetingStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/>
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold">Total:</span>
                <span className="text-xl font-black">Rp {formatRupiah(calculateSalary().total)}</span>
              </div>
              <button onClick={handlePaySalary} className="w-full bg-green-600 text-white py-3 rounded font-bold shadow hover:bg-green-700">BAYAR SEKARANG</button>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl border"><h3 className="font-bold text-gray-500">Logika Sistem:</h3><ul className="text-sm list-disc pl-4 text-gray-400 mt-2"><li>Gaji dihitung dari jumlah kartu "Jurnal Kelas" yang dibuat guru.</li><li>Jika guru lupa klik "Akhiri Kelas", data tidak masuk ke sini.</li><li>Pembayaran otomatis memotong saldo kas di menu Keuangan.</li></ul></div>
        </div>
      )}

      {/* TAB 3: DATA GURU (SIMPLE) */}
      {activeTab === 'data' && (
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex gap-2 mb-6 border-b pb-4">
            <input value={token} onChange={e=>setToken(e.target.value.toUpperCase())} className="border-2 p-2 rounded text-center font-bold tracking-widest uppercase w-32" placeholder="TOKEN"/>
            <button onClick={saveToken} className="bg-black text-white px-4 rounded font-bold">Update Token</button>
          </div>
          <form onSubmit={handleSaveGuru} className="flex gap-2 mb-4"><input className="border p-2 rounded flex-1" placeholder="Nama Guru" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className="border p-2 rounded w-32" placeholder="HP" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><button className="bg-blue-600 text-white px-4 rounded font-bold">+</button></form>
          <div className="h-64 overflow-y-auto space-y-2">{teachers.map(t=><div key={t.id} className="p-2 border rounded flex justify-between bg-gray-50"><span>{t.name}</span><button onClick={()=>handleDelete(t.id)}><Trash2 size={14} className="text-red-400"/></button></div>)}</div>
        </div>
      )}
    </div>
  );
}