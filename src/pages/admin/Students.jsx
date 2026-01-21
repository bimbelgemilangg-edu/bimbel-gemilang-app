import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { GraduationCap, UserPlus, Save, Trash2, Edit, X, CheckSquare, Square, MessageCircle, Calculator, Printer, ClipboardList, CheckCircle, AlertCircle, TrendingUp, BarChart3, FileText } from 'lucide-react';

// --- HELPER ---
const formatRupiah = (value) => {
  if (!value && value !== 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const parseRupiah = (value) => {
  if (!value) return 0;
  return parseInt(value.replace(/\./g, '') || '0', 10);
};

const MONTHS_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// --- MINI CHART COMPONENT UNTUK PDF ---
const StudentGrowthChartPDF = ({ data }) => {
  const max = Math.max(...data, 5);
  const h = 100;
  const w = 500;
  const points = data.map((v, i) => `${(i * (w / 11))},${h - (v / max * h)}`).join(' ');

  return (
    <div className="w-full border-2 border-black p-6 my-6">
      <p className="text-[10px] font-black uppercase mb-4 text-center">Grafik Tren Pendaftaran Siswa Baru (Jan - Des 2026)</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 overflow-visible">
        <polyline fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
        {data.map((v, i) => (
          <circle key={i} cx={(i * (w / 11))} cy={h - (v / max * h)} r="3" fill="black" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-[8px] font-black">
        {MONTHS_LABEL.map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
};

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  const [classLogs, setClassLogs] = useState([]); 
  
  // State UI
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('biodata'); 

  // State Modal
  const [showCardModal, setShowCardModal] = useState(false);
  const [showAbsensiModal, setShowAbsensiModal] = useState(false);
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

  // --- ANALISIS STRATEGI DATA ---
  const getMarketingAnalysis = () => {
    const trend = new Array(12).fill(0);
    const sd = students.filter(s => s.schoolLevel === 'SD').length;
    const smp = students.filter(s => s.schoolLevel === 'SMP').length;
    
    students.forEach(s => {
      if(s.createdAt) {
        const m = s.createdAt.toDate().getMonth();
        trend[m]++;
      }
    });
    return { trend, sd, smp, total: students.length };
  };

  // --- LOGIKA UPDATE ABSENSI (ADMIN ACTION) ---
  const handleUpdateAbsensi = async (logId, newStatus) => {
    const log = classLogs.find(l => l.id === logId);
    if (!log) return;
    const updatedStudentsLog = log.studentsLog.map(s => s.id === selectedStudent.id ? { ...s, status: newStatus } : s);
    await updateDoc(doc(db, "class_logs", logId), { studentsLog: updatedStudentsLog });
    alert("Status Diperbarui!");
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
    if (isEditing) { await updateDoc(doc(db, "students", editId), formData); alert("Data Diupdate!"); resetForm(); return; }
    const fin = calculateFinancials();
    if (fin.sisaHutang < 0) return alert("Bayar kelebihan!");

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
        }
      });
      alert("Siswa Berhasil Didaftarkan!"); resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => { if(confirm("Hapus Siswa?")) await deleteDoc(doc(db, "students", id)); };
  const resetForm = () => { setShowForm(false); setIsEditing(false); setEditId(null); setFormData(initialForm); setDpAmountStr(""); setInstallmentPlan(1); };
  
  const getStudentStats = (studentId) => {
    const logs = classLogs.filter(l => l.studentsLog.some(s => s.id === studentId));
    const hadir = logs.filter(l => l.studentsLog.find(s => s.id === studentId).status === 'Hadir').length;
    const sakit = logs.filter(l => l.studentsLog.find(s => s.id === studentId).status === 'Sakit').length;
    const izin = logs.filter(l => l.studentsLog.find(s => s.id === studentId).status === 'Izin').length;
    const alpha = logs.filter(l => l.studentsLog.find(s => s.id === studentId).status === 'Alpha').length;
    return { total: logs.length, hadir, sakit, izin, alpha, logs };
  };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* ==============================================
          AREA PDF LAPORAN ANALISIS STRATEGI (PRINT ONLY)
          ============================================== */}
      <div className="hidden print:block w-full text-black p-10 bg-white">
        <div className="text-center border-b-4 border-black pb-6 mb-10">
          <h1 className="text-3xl font-black uppercase tracking-[0.2em]">LAPORAN ANALISIS STRATEGI PENDAFTARAN</h1>
          <p className="text-lg font-bold mt-2">BIMBEL GEMILANG • TAHUN 2026</p>
        </div>

        {/* RINGKASAN MARKETING */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="border-2 border-black p-6 text-center">
            <p className="text-[10px] font-black uppercase mb-1">Total Murid Aktif</p>
            <p className="text-4xl font-black">{getMarketingAnalysis().total}</p>
          </div>
          <div className="border-2 border-black p-6 text-center">
            <p className="text-[10px] font-black uppercase mb-1">Total Jenjang SD</p>
            <p className="text-4xl font-black">{getMarketingAnalysis().sd}</p>
          </div>
          <div className="border-2 border-black p-6 text-center">
            <p className="text-[10px] font-black uppercase mb-1">Total Jenjang SMP</p>
            <p className="text-4xl font-black">{getMarketingAnalysis().smp}</p>
          </div>
        </div>

        {/* GRAFIK PERTUMBUHAN DI PDF */}
        <div className="mb-10">
          <h3 className="font-black text-sm uppercase mb-4 border-l-8 border-black pl-4">Grafik Pertumbuhan Pendaftaran</h3>
          <StudentGrowthChartPDF data={getMarketingAnalysis().trend} />
          <p className="text-[9px] italic text-gray-500 text-center">Grafik ini menunjukkan performa marketing tiap bulan dalam merekrut siswa baru.</p>
        </div>

        {/* DAFTAR SISWA UNTUK PDF */}
        <h3 className="font-black text-sm uppercase mb-4">Daftar Lengkap Database Siswa</h3>
        <table className="w-full text-[10px] text-left border-collapse border-2 border-black">
          <thead className="bg-gray-100 border-b-2 border-black">
            <tr>
              <th className="p-2 border-r border-black">No</th>
              <th className="p-2 border-r border-black">Nama Lengkap</th>
              <th className="p-2 border-r border-black">Sekolah</th>
              <th className="p-2 border-r border-black">Jenjang</th>
              <th className="p-2 border-r border-black text-center">Status</th>
              <th className="p-2 text-right">Tgl Gabung</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr key={s.id} className="border-b border-black">
                <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                <td className="p-2 border-r border-black font-bold uppercase">{s.name}</td>
                <td className="p-2 border-r border-black">{s.schoolName}</td>
                <td className="p-2 border-r border-black">{s.schoolLevel} - Kls {s.schoolGrade}</td>
                <td className="p-2 border-r border-black text-center">AKTIF</td>
                <td className="p-2 text-right">{s.joinedAt || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==============================================
          DASHBOARD SISWA (LAYAR UTAMA)
          ============================================== */}
      <div className="print:hidden space-y-8">
        
        {/* HEADER DENGAN TOMBOL PDF BARU */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] border shadow-xl gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-5 rounded-[1.5rem] text-white shadow-lg"><GraduationCap size={40}/></div>
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Manajemen Siswa</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{students.length} Siswa Terdaftar di Database</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl active:scale-95 transition-all">
              <FileText size={20}/> Download Analisis PDF
            </button>
            <button onClick={()=>{resetForm(); setShowForm(!showForm)}} className="flex-1 bg-blue-600 text-white px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl active:scale-95 transition-all">
              <UserPlus size={20}/> {showForm ? 'Batal' : 'Pendaftaran Baru'}
            </button>
          </div>
        </div>

        {/* FORM INPUT (BIODATA & KEUANGAN) */}
        {showForm && (
          <div className="bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-blue-50 p-6 flex justify-between items-center border-b border-blue-100 px-12">
               <h3 className="text-xl font-black text-blue-800 uppercase tracking-widest">{isEditing ? 'Koreksi Data Siswa' : 'Formulir Pendaftaran'}</h3>
               <button onClick={resetForm} className="bg-white p-2 rounded-full shadow-sm hover:text-red-500 transition-all"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-12">
              <div className="flex gap-4 mb-10 bg-gray-50 p-2 rounded-[2rem] w-fit">
                <button type="button" onClick={()=>setActiveTab('biodata')} className={`px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all ${activeTab==='biodata'?'bg-white text-blue-600 shadow-lg':'text-gray-400'}`}>1. Biodata</button>
                <button type="button" onClick={()=>setActiveTab('keuangan')} className={`px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all ${activeTab==='keuangan'?'bg-white text-blue-600 shadow-lg':'text-gray-400'}`}>2. Administrasi</button>
              </div>

              {activeTab === 'biodata' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-2"><label className="lbl">Nama Lengkap Siswa</label><input required className="inp text-xl uppercase" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
                  <div className="space-y-2"><label className="lbl">Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/></div>
                  <div className="space-y-2"><label className="lbl">Jenis Kelamin</label><select className="inp font-bold" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                  <div className="space-y-2"><label className="lbl">Tempat Lahir</label><input className="inp" value={formData.pob} onChange={e=>setFormData({...formData,pob:e.target.value})}/></div>
                  <div className="space-y-2"><label className="lbl">Tanggal Lahir</label><input type="date" className="inp" value={formData.dob} onChange={e=>setFormData({...formData,dob:e.target.value})}/></div>
                  <div className="md:col-span-2 border-t pt-8 mt-4"><label className="text-sm font-black text-blue-600 uppercase tracking-widest">Informasi Akademik & Orang Tua</label></div>
                  <div className="space-y-2"><label className="lbl">Nama Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/></div>
                  <div className="flex gap-4"><div className="flex-1 space-y-2"><label className="lbl">Jenjang</label><select className="inp font-bold" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select></div><div className="flex-1 space-y-2"><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div></div>
                  <div className="space-y-2"><label className="lbl">Nama Ayah</label><input className="inp" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/></div>
                  <div className="space-y-2"><label className="lbl">Nama Ibu</label><input className="inp" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/></div>
                  <div className="md:col-span-2 bg-green-50 p-6 rounded-[2rem] border-2 border-green-100 space-y-3"><label className="text-xs font-black text-green-700 uppercase tracking-widest block">Nomor WhatsApp Darurat (Wajib)</label><input required className="w-full bg-white border-4 border-green-100 p-4 rounded-2xl font-black text-2xl text-green-700 focus:border-green-500 outline-none" placeholder="08xxxxxxxxxx" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/></div>
                  <button type="button" onClick={()=>setActiveTab('keuangan')} className="md:col-span-2 bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Lanjut ke Administrasi &rarr;</button>
                </div>
              )}

              {activeTab === 'keuangan' && (
                <div className="space-y-8 animate-in slide-in-from-right duration-500">
                  <div className="bg-gray-50 p-10 rounded-[3rem] border-4 border-gray-100"><h4 className="font-black text-gray-700 uppercase tracking-widest mb-6 flex gap-3"><Calculator size={24} className="text-blue-600"/> Penentuan Paket Belajar</h4><div className="grid grid-cols-2 gap-8"><div><label className="lbl">Jenjang Terpilih</label><div className="w-full border-4 border-white p-5 rounded-2xl font-black text-xl bg-white text-blue-600">{formData.schoolLevel}</div></div><div><label className="lbl">Durasi Paket</label><select className="w-full border-4 border-white p-5 rounded-2xl font-black text-xl focus:border-blue-600 outline-none" value={formData.packageDuration} onChange={e=>setFormData({...formData, packageDuration:e.target.value})}><option value="1">1 Bulan</option><option value="3">3 Bulan</option><option value="6">6 Bulan</option></select></div></div></div>
                  {!isEditing && (
                    <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-10"><Calculator size={150}/></div>
                      <h4 className="font-black uppercase tracking-widest mb-8 border-b border-white/20 pb-4">Rincian Keuangan Siswa</h4>
                      <div onClick={() => setIncludeRegFee(!includeRegFee)} className="flex items-center gap-4 cursor-pointer mb-8 bg-white/10 p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all">{includeRegFee ? <CheckSquare size={32}/> : <Square size={32} className="opacity-40"/>}<div><span className="text-lg font-black uppercase tracking-tighter">Biaya Pendaftaran</span><p className="text-xs opacity-60">Tambahkan Rp {formatRupiah(prices?.pendaftaran||0)}</p></div></div>
                      <div className="flex justify-between items-center mb-10 bg-white text-blue-600 p-8 rounded-[2rem] shadow-inner"><span className="text-xl font-black uppercase tracking-widest">TOTAL TAGIHAN</span><span className="text-5xl font-black tracking-tighter">Rp {formatRupiah(calculateFinancials().total)}</span></div>
                      <div className="grid md:grid-cols-2 gap-10">
                        <div><label className="text-[10px] font-black uppercase tracking-widest mb-3 block opacity-60">Bayar Sekarang (DP)</label><input className="w-full bg-white/10 border-4 border-white/20 p-6 rounded-2xl font-black text-3xl text-white outline-none focus:border-white" placeholder="Rp 0" value={dpAmountStr} onChange={e => setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/></div>
                        <div><label className="text-[10px] font-black uppercase tracking-widest mb-3 block opacity-60">Sisa Piutang</label><div className="text-5xl font-black tracking-tighter text-yellow-300">Rp {formatRupiah(calculateFinancials().sisaHutang)}</div></div>
                      </div>
                      {calculateFinancials().sisaHutang > 0 && (
                        <div className="mt-10 pt-10 border-t border-white/20"><label className="text-xs font-black uppercase tracking-widest text-yellow-300 mb-4 block text-center">Skema Cicilan Piutang</label><div className="flex gap-4"><input type="date" className="flex-1 bg-white/10 border-2 border-white/20 p-4 rounded-xl font-bold" value={startDate} onChange={e=>setStartDate(e.target.value)}/><select className="flex-1 bg-white/10 border-2 border-white/20 p-4 rounded-xl font-bold" value={installmentPlan} onChange={e=>setInstallmentPlan(parseInt(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}x Kali Bayar</option>)}</select></div></div>
                      )}
                    </div>
                  )}
                  <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 active:scale-95 transition-all">{isEditing ? 'Simpan Perubahan' : 'Selesaikan & Cetak Invoice'}</button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* LIST SISWA GRID (ULTRA WIDE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(s => (
            <div key={s.id} className="p-8 border-4 border-gray-50 rounded-[3rem] bg-white shadow-sm hover:border-blue-200 transition-all group relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-2xl text-slate-800 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{s.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.schoolName}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase">Kls {s.schoolGrade}</span>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={()=>openCard(s)} className="flex-1 p-4 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-600 hover:text-white transition-all flex flex-col items-center gap-1"><Printer size={20}/><span className="text-[8px] font-black uppercase">Laporan</span></button>
                  <button onClick={()=>openAbsensi(s)} className="flex-1 p-4 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-600 hover:text-white transition-all flex flex-col items-center gap-1"><ClipboardList size={20}/><span className="text-[8px] font-black uppercase">Absensi</span></button>
                  <button onClick={()=>handleEditClick(s)} className="flex-1 p-4 bg-yellow-50 text-yellow-600 rounded-2xl hover:bg-yellow-600 hover:text-white transition-all flex flex-col items-center gap-1"><Edit size={20}/><span className="text-[8px] font-black uppercase">Edit</span></button>
                  <button onClick={()=>handleDelete(s.id)} className="flex-1 p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all flex flex-col items-center gap-1"><Trash2 size={20}/><span className="text-[8px] font-black uppercase">Hapus</span></button>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform"><GraduationCap size={120}/></div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL 1: KARTU KEAKTIFAN (LAPORAN HARIAN) --- */}
      {showCardModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/90 z-[500] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white rounded-[3rem] overflow-hidden max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between p-8 bg-gray-50 border-b">
              <h3 className="font-black text-gray-700 uppercase tracking-widest">Laporan Keaktifan</h3>
              <button onClick={()=>setShowCardModal(false)}><X size={32} className="text-gray-400 hover:text-red-500"/></button>
            </div>
            <div id="activity-card-print" className="p-10 bg-white">
                <div className="text-center border-b-4 border-black pb-6 mb-8">
                  <h1 className="font-black text-2xl text-blue-900 italic tracking-tighter">GEMILANG</h1>
                  <p className="text-[10px] font-black uppercase tracking-widest">Student Performance Report</p>
                </div>
                <div className="mb-8 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                  <h2 className="font-black text-2xl text-slate-800 uppercase tracking-tighter mb-1">{selectedStudent.name}</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedStudent.schoolLevel} • {selectedStudent.schoolName}</p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center mb-8">
                  {['hadir','sakit','izin','alpha'].map(st => (
                    <div key={st} className="bg-white border-2 border-slate-100 p-3 rounded-2xl shadow-sm">
                      <div className="text-xl font-black">{getStudentStats(selectedStudent.id)[st]}</div>
                      <div className="text-[8px] font-black uppercase opacity-40">{st}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] font-bold text-gray-300 text-center uppercase tracking-widest">Laporan dihasilkan secara otomatis oleh sistem</p>
            </div>
            <div className="p-8 border-t"><button onClick={()=>{const content = document.getElementById('activity-card-print').innerHTML; const win = window.open('','','width=600,height=800'); win.document.write(`<html><head><link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"></head><body class="p-10">${content}</body></html>`); win.document.close(); setTimeout(()=> {win.print(); win.close();}, 500);}} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl">CETAK KARTU</button></div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT ABSENSI (ADMIN POWER) --- */}
      {showAbsensiModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/90 z-[500] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white rounded-[3.5rem] w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-300">
            <div className="flex justify-between p-10 border-b bg-gray-50/50">
              <div><h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Edit Absensi Siswa</h3><p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Siswa: {selectedStudent.name}</p></div>
              <button onClick={()=>setShowAbsensiModal(false)}><X size={40} className="text-gray-400 hover:text-red-500"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-100 text-[10px] font-black uppercase tracking-widest"><th className="p-5 border-b">Tanggal</th><th className="p-5 border-b">Mata Pelajaran</th><th className="p-5 border-b">Tindakan Admin</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {getStudentStats(selectedStudent.id).logs.map(log => (
                    <tr key={log.id} className="hover:bg-blue-50/20 transition-all">
                      <td className="p-5 font-bold text-slate-500">{log.date}</td>
                      <td className="p-5 font-black text-slate-800 uppercase">{log.subject}</td>
                      <td className="p-5">
                        <select className="w-full border-4 border-gray-100 p-2 rounded-xl font-black text-xs cursor-pointer outline-none focus:border-blue-600" value={log.studentsLog.find(s => s.id === selectedStudent.id)?.status} onChange={(e) => handleUpdateAbsensi(log.id, e.target.value)}>
                          <option value="Hadir">Hadir</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option><option value="Alpha">Alpha</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {getStudentStats(selectedStudent.id).logs.length === 0 && <div className="py-20 text-center text-gray-300 font-bold italic">Belum ada catatan kehadiran.</div>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lbl { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-left: 8px; margin-bottom: 8px; display: block; }
        .inp { width: 100%; border: 4px solid #f8fafc; padding: 16px; border-radius: 20px; font-weight: 800; color: #1e293b; outline: none; transition: all 0.3s; }
        .inp:focus { border-color: #2563eb; background: white; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}