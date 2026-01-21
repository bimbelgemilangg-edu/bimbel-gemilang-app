import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { GraduationCap, UserPlus, Save, Trash2, Edit, X, CheckSquare, Square, MessageCircle, Calculator, Printer, ClipboardList, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

// --- HELPER ---
const formatRupiah = (value) => {
  if (!value && value !== 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const parseRupiah = (value) => {
  if (!value) return 0;
  return parseInt(value.replace(/\./g, '') || '0', 10);
};
const generateWALink = (phone, name) => {
  if (!phone) return "#";
  let p = phone.replace(/\D/g, ''); if (p.startsWith('0')) p = '62' + p.substring(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(`Halo Wali Murid *${name}*, kami dari Admin Bimbel...`)}`;
};

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  const [classLogs, setClassLogs] = useState([]); // Data Absensi Seluruhnya
  
  // State UI
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('biodata'); 

  // State Modal
  const [showCardModal, setShowCardModal] = useState(false); // Modal Kartu Keaktifan
  const [showAbsensiModal, setShowAbsensiModal] = useState(false); // Modal Edit Absensi
  const [selectedStudent, setSelectedStudent] = useState(null);

  // --- DATA SISWA ---
  const initialForm = {
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "",
    fatherName: "", fatherJob: "", fatherPhone: "",
    motherName: "", motherJob: "", motherPhone: "",
    emergencyWAPhone: "", packageDuration: "1" 
  };
  const [formData, setFormData] = useState(initialForm);

  // --- STATE KEUANGAN ---
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [dpAmountStr, setDpAmountStr] = useState(""); 
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [installmentPlan, setInstallmentPlan] = useState(1); 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    const u2 = onSnapshot(query(collection(db, "class_logs"), orderBy("timestamp", "desc")), s => setClassLogs(s.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => { u1(); u2(); };
  }, [db]);

  // --- LOGIKA UPDATE ABSENSI ---
  const handleUpdateAbsensi = async (logId, newStatus) => {
    const log = classLogs.find(l => l.id === logId);
    if (!log) return;
    const updatedStudentsLog = log.studentsLog.map(s => s.id === selectedStudent.id ? { ...s, status: newStatus } : s);
    try {
      await updateDoc(doc(db, "class_logs", logId), { studentsLog: updatedStudentsLog });
      alert("Status Diperbarui!");
    } catch (err) { alert("Gagal: " + err.message); }
  };

  // --- HITUNG KEUANGAN ---
  const calculateFinancials = () => {
    if (!prices) return { packagePrice: 0, regFee: 0, total: 0, sisaHutang: 0 };
    const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
    const packagePrice = prices[priceKey] || 0;
    const regFee = includeRegFee ? (prices.pendaftaran || 0) : 0;
    const total = packagePrice + regFee;
    const bayarSekarang = parseRupiah(dpAmountStr);
    const sisaHutang = total - bayarSekarang;
    return { packagePrice, regFee, total, bayarSekarang, sisaHutang };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isEditing) { await updateDoc(doc(db, "students", editId), formData); alert("Update Sukses!"); resetForm(); return; }
    if (!prices) return alert("Harga Error");
    const fin = calculateFinancials();
    if (fin.sisaHutang < 0) return alert("Bayar Kebanyakan!");

    try {
      await runTransaction(db, async (t) => {
        const sRef = doc(collection(db, "students"));
        t.set(sRef, { ...formData, status: 'active', joinedAt: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
        if (fin.bayarSekarang > 0) t.set(doc(collection(db, "payments")), { studentName: formData.name, amount: fin.bayarSekarang, method: paymentMethod, date: serverTimestamp(), category: 'Pendaftaran', description: 'Pembayaran Awal' });
        
        if (fin.sisaHutang > 0) {
          const perMonth = Math.ceil(fin.sisaHutang / installmentPlan);
          for (let i = 0; i < installmentPlan; i++) {
            const due = new Date(startDate); due.setMonth(due.getMonth() + i);
            let amount = perMonth;
            if (i === installmentPlan - 1) amount = fin.sisaHutang - (perMonth * (installmentPlan - 1));
            t.set(doc(collection(db, "invoices")), { studentId: sRef.id, studentName: formData.name, totalAmount: amount, remainingAmount: amount, status: 'unpaid', type: 'cicilan', dueDate: due.toISOString().split('T')[0], waPhone: formData.emergencyWAPhone, details: `Cicilan ${i+1}/${installmentPlan}`, createdAt: serverTimestamp() });
          }
        } else {
          t.set(doc(collection(db, "invoices")), { studentId: sRef.id, studentName: formData.name, totalAmount: fin.total, remainingAmount: 0, status: 'paid', type: 'pendaftaran', dueDate: new Date().toISOString().split('T')[0], waPhone: formData.emergencyWAPhone, details: `LUNAS`, createdAt: serverTimestamp() });
        }
      });
      alert("Siswa Terdaftar!"); resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => { if(confirm("Hapus?")) await deleteDoc(doc(db, "students", id)); };
  const handleEditClick = (s) => { setFormData(s); setEditId(s.id); setIsEditing(true); setShowForm(true); setActiveTab('biodata'); };
  const resetForm = () => { setShowForm(false); setIsEditing(false); setEditId(null); setFormData(initialForm); setIncludeRegFee(true); setDpAmountStr(""); setInstallmentPlan(1); setStartDate(new Date().toISOString().split('T')[0]); };
  
  const openCard = (s) => { setSelectedStudent(s); setShowCardModal(true); };
  const openAbsensi = (s) => { setSelectedStudent(s); setShowAbsensiModal(true); };

  // --- HELPER UNTUK HITUNG STATISTIK SISWA ---
  const getStudentStats = (studentId) => {
    const logs = classLogs.filter(l => l.studentsLog.some(s => s.id === studentId));
    const hadir = logs.filter(l => l.studentsLog.find(s => s.id === studentId).status === 'Hadir').length;
    const sakit = logs.filter(l => l.studentsLog.find(s => s.id === studentId).status === 'Sakit').length;
    const izin = logs.filter(l => l.studentsLog.find(s => s.id === studentId).status === 'Izin').length;
    const alpha = logs.filter(l => l.studentsLog.find(s => s.id === studentId).status === 'Alpha').length;
    return { total: logs.length, hadir, sakit, izin, alpha, logs };
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border">
        <div><h2 className="font-bold text-xl flex items-center gap-2"><GraduationCap className="text-blue-600"/> Data Siswa</h2><p className="text-xs text-gray-500">{students.length} Siswa Aktif</p></div>
        <button onClick={()=>{resetForm(); setShowForm(!showForm)}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2 hover:bg-blue-700"><UserPlus size={18}/> {showForm ? 'Tutup' : 'Siswa Baru'}</button>
      </div>

      {/* FORM INPUT */}
      {showForm && (
        <div className="bg-white rounded-xl border shadow-lg overflow-hidden">
          <div className="bg-blue-50 p-4 flex justify-between items-center border-b border-blue-100">
             <h3 className="font-bold text-blue-800">{isEditing ? 'Edit Data' : 'Pendaftaran Siswa Baru'}</h3>
             <button onClick={resetForm}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
          </div>
          <form onSubmit={handleSave} className="p-6">
            <div className="flex border-b mb-6"><button type="button" onClick={()=>setActiveTab('biodata')} className={`px-4 py-2 font-bold ${activeTab==='biodata'?'text-blue-600 border-b-2 border-blue-600':'text-gray-400'}`}>1. Biodata</button><button type="button" onClick={()=>setActiveTab('keuangan')} className={`px-4 py-2 font-bold ${activeTab==='keuangan'?'text-blue-600 border-b-2 border-blue-600':'text-gray-400'}`}>2. Pembayaran</button></div>
            {activeTab === 'biodata' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="lbl">Nama Lengkap</label><input required className="inp" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
                <div><label className="lbl">Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/></div>
                <div><label className="lbl">Gender</label><select className="inp" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                <div><label className="lbl">Tempat Lahir</label><input className="inp" value={formData.pob} onChange={e=>setFormData({...formData,pob:e.target.value})}/></div>
                <div><label className="lbl">Tanggal Lahir</label><input type="date" className="inp" value={formData.dob} onChange={e=>setFormData({...formData,dob:e.target.value})}/></div>
                <div className="md:col-span-2 border-t pt-2 mt-2"><label className="lbl text-blue-600">Sekolah & Ortu</label></div>
                <div><label className="lbl">Nama Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/></div>
                <div className="flex gap-2"><div className="flex-1"><label className="lbl">Jenjang</label><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select></div><div className="flex-1"><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div></div>
                <div><label className="lbl">Nama Ayah</label><input className="inp" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/></div>
                <div><label className="lbl">Nama Ibu</label><input className="inp" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/></div>
                <div className="md:col-span-2 bg-green-50 p-2 rounded border border-green-200"><label className="lbl text-green-700">No WA</label><input required className="inp border-green-300" placeholder="08xxx" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/></div>
                <button type="button" onClick={()=>setActiveTab('keuangan')} className="btn-next md:col-span-2">Lanjut Bayar &rarr;</button>
              </div>
            )}
            {activeTab === 'keuangan' && (
              <div className="space-y-4">
                <div className="bg-white p-4 border rounded shadow-sm"><h4 className="font-bold text-gray-700 border-b pb-2 mb-3 flex gap-2"><Calculator size={18}/> PILIH PAKET</h4><div className="grid grid-cols-2 gap-4"><div><label className="lbl">Jenjang</label><input disabled className="inp bg-gray-100 font-bold" value={formData.schoolLevel} /></div><div><label className="lbl">Durasi</label><select className="inp font-bold bg-blue-50 text-blue-800" value={formData.packageDuration} onChange={e=>setFormData({...formData, packageDuration:e.target.value})}><option value="1">1 Bulan</option><option value="3">3 Bulan</option><option value="6">6 Bulan</option></select></div></div></div>
                {!isEditing && <div className="bg-blue-50 p-4 border border-blue-200 rounded-xl"><h4 className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-3">RINCIAN TAGIHAN</h4><div onClick={() => setIncludeRegFee(!includeRegFee)} className="flex items-center gap-2 cursor-pointer mb-3 bg-white p-2 rounded border">{includeRegFee ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-gray-400"/>}<div><span className="text-sm font-bold text-gray-700">Biaya Pendaftaran?</span><div className="text-xs text-gray-500">Rp {formatRupiah(prices?.pendaftaran||0)}</div></div></div><div className="flex justify-between items-center mb-4 bg-blue-100 p-3 rounded"><span className="font-bold text-blue-900">TOTAL:</span><span className="text-2xl font-black text-blue-800">Rp {formatRupiah(calculateFinancials().total)}</span></div><div className="grid md:grid-cols-2 gap-4"><div><label className="lbl">Bayar Sekarang</label><input className="inp font-bold text-lg" placeholder="Rp 0" value={dpAmountStr} onChange={e => setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/><div className="flex gap-1 mt-1"><button type="button" onClick={()=>setDpAmountStr("0")} className="text-[10px] bg-white border px-2 py-1 rounded">Nanti</button><button type="button" onClick={()=>setDpAmountStr(formatRupiah(calculateFinancials().total))} className="text-[10px] bg-green-100 text-green-700 border px-2 py-1 rounded font-bold">Lunas</button></div></div><div><label className="lbl">Sisa Hutang</label><div className={`text-xl font-black ${calculateFinancials().sisaHutang > 0 ? 'text-red-600' : 'text-green-600'}`}>Rp {formatRupiah(calculateFinancials().sisaHutang)}</div></div></div>{calculateFinancials().sisaHutang > 0 && <div className="mt-4 pt-4 border-t border-blue-200"><label className="lbl text-orange-700 mb-2">Setting Cicilan</label><div className="flex gap-2"><input type="date" className="inp w-1/2" value={startDate} onChange={e=>setStartDate(e.target.value)}/><select className="inp w-1/2" value={installmentPlan} onChange={e=>setInstallmentPlan(parseInt(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}x Kali Bayar</option>)}</select></div></div>}</div>}
                <div className="flex gap-2 pt-2"><button type="button" onClick={resetForm} className="flex-1 py-3 bg-white border rounded font-bold text-gray-500">Batal</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded font-bold shadow-lg hover:bg-blue-700">{isEditing ? 'SIMPAN PERUBAHAN' : 'PROSES PENDAFTARAN'}</button></div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* LIST SISWA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {students.map(s => (
          <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm hover:shadow-md">
            <div><div className="font-bold text-gray-800">{s.name}</div><div className="text-xs text-gray-500">{s.schoolLevel} - {s.schoolName}</div></div>
            <div className="flex gap-1">
              <button onClick={()=>openCard(s)} className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200" title="Laporan Keaktifan"><Printer size={16}/></button>
              <button onClick={()=>openAbsensi(s)} className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200" title="Absensi"><ClipboardList size={16}/></button>
              <a href={generateWALink(s.emergencyWAPhone, s.name)} target="_blank" className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"><MessageCircle size={16}/></a>
              <button onClick={()=>handleEditClick(s)} className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"><Edit size={16}/></button>
              <button onClick={()=>handleDelete(s.id)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: KARTU KEAKTIFAN SISWA (LAPORAN) --- */}
      {showCardModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl overflow-hidden max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between p-4 bg-gray-100 border-b">
              <h3 className="font-bold text-gray-700">Cetak Laporan Siswa</h3>
              <button onClick={()=>setShowCardModal(false)}><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1 bg-gray-50">
              {/* AREA YANG AKAN DIPRINT */}
              <div id="activity-card-print" className="bg-white p-6 border shadow-sm">
                <div className="text-center border-b pb-4 mb-4">
                  <h1 className="font-black text-xl text-blue-900 uppercase">LAPORAN KEAKTIFAN SISWA</h1>
                  <p className="text-xs text-gray-500">BIMBEL GEMILANG SYSTEM</p>
                </div>

                {/* INFO SISWA */}
                <div className="mb-6 bg-blue-50 p-3 rounded border border-blue-100">
                  <h2 className="font-bold text-lg text-gray-800">{selectedStudent.name}</h2>
                  <p className="text-xs text-gray-500">{selectedStudent.schoolLevel} - {selectedStudent.schoolName} (Kls {selectedStudent.schoolGrade})</p>
                </div>

                {/* STATISTIK KEHADIRAN */}
                <h4 className="font-bold text-xs uppercase text-gray-400 mb-2">Ringkasan Kehadiran</h4>
                <div className="grid grid-cols-4 gap-2 mb-6 text-center">
                  <div className="bg-green-100 p-2 rounded border border-green-200">
                    <div className="text-lg font-black text-green-700">{getStudentStats(selectedStudent.id).hadir}</div>
                    <div className="text-[8px] font-bold uppercase text-green-600">Hadir</div>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded border border-yellow-200">
                    <div className="text-lg font-black text-yellow-700">{getStudentStats(selectedStudent.id).izin}</div>
                    <div className="text-[8px] font-bold uppercase text-yellow-600">Izin</div>
                  </div>
                  <div className="bg-orange-100 p-2 rounded border border-orange-200">
                    <div className="text-lg font-black text-orange-700">{getStudentStats(selectedStudent.id).sakit}</div>
                    <div className="text-[8px] font-bold uppercase text-orange-600">Sakit</div>
                  </div>
                  <div className="bg-red-100 p-2 rounded border border-red-200">
                    <div className="text-lg font-black text-red-700">{getStudentStats(selectedStudent.id).alpha}</div>
                    <div className="text-[8px] font-bold uppercase text-red-600">Alpha</div>
                  </div>
                </div>

                {/* TABEL AKTIVITAS TERAKHIR */}
                <h4 className="font-bold text-xs uppercase text-gray-400 mb-2">Aktivitas Belajar Terakhir</h4>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50"><th className="p-2">Tanggal</th><th className="p-2">Mapel</th><th className="p-2 text-right">Status</th></tr>
                  </thead>
                  <tbody>
                    {getStudentStats(selectedStudent.id).logs.slice(0, 5).map((log, idx) => {
                      const status = log.studentsLog.find(s=>s.id===selectedStudent.id).status;
                      return (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="p-2 text-gray-600">{log.date}</td>
                          <td className="p-2 font-bold">{log.subject}</td>
                          <td className="p-2 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${status==='Hadir'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{status}</span>
                          </td>
                        </tr>
                      )
                    })}
                    {getStudentStats(selectedStudent.id).logs.length === 0 && <tr><td colSpan="3" className="p-4 text-center italic text-gray-400">Belum ada data.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-white border-t">
              <button 
                onClick={()=>{
                  const content = document.getElementById('activity-card-print').innerHTML;
                  const win = window.open('','','width=600,height=800');
                  win.document.write(`<html><head><title>Laporan Keaktifan</title><link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"></head><body class="bg-gray-100 p-8">${content}</body></html>`);
                  win.document.close();
                  win.focus();
                  setTimeout(() => { win.print(); win.close(); }, 500);
                }} 
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Printer size={18}/> CETAK PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ABSENSI & EDIT STATUS --- */}
      {showAbsensiModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="flex justify-between p-4 border-b">
              <div><h3 className="font-bold text-lg">Edit Absensi Siswa</h3><p className="text-xs text-gray-500">{selectedStudent.name}</p></div>
              <button onClick={()=>setShowAbsensiModal(false)}><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <table className="w-full text-sm text-left bg-white rounded-lg shadow overflow-hidden">
                <thead className="bg-blue-100 text-blue-800"><tr><th className="p-3">Tanggal</th><th className="p-3">Mapel</th><th className="p-3">Ubah Status</th></tr></thead>
                <tbody className="divide-y">
                  {getStudentStats(selectedStudent.id).logs.map(log => {
                    const myStatus = log.studentsLog.find(s => s.id === selectedStudent.id)?.status;
                    return (
                      <tr key={log.id}>
                        <td className="p-3">{log.date}</td><td className="p-3">{log.subject}</td>
                        <td className="p-3">
                          <select className="border p-1 rounded text-xs font-bold bg-gray-50 cursor-pointer" value={myStatus} onChange={(e) => handleUpdateAbsensi(log.id, e.target.value)}>
                            <option value="Hadir">Hadir</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option><option value="Alpha">Alpha</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`.lbl{font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:4px}.inp{width:100%;border:1px solid #d1d5db;padding:8px;border-radius:6px;font-size:0.9rem}.btn-next{width:100%;padding:12px;border-radius:8px;font-weight:bold;margin-top:10px;background:#eff6ff;color:#1d4ed8;border:1px solid #dbeafe}`}</style>
    </div>
  );
}