import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  GraduationCap, UserPlus, Save, Trash2, X, Search, Filter, 
  Printer, FileText, MapPin, User, BarChart3, TrendingUp, Calendar
} from 'lucide-react';

// --- HELPER FORMAT ---
const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function AdminStudents({ db }) {
  // --- STATE DATA ---
  const [students, setStudents] = useState([]);
  const [classLogs, setClassLogs] = useState([]); // Data Absensi
  const [prices, setPrices] = useState(null);
  
  // --- STATE FILTER & UI ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("SEMUA");
  const [filterGrade, setFilterGrade] = useState("SEMUA");
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(null); 
  const [isEditing, setIsEditing] = useState(false);
  const [printMode, setPrintMode] = useState(null); 

  // --- FORM STATE ---
  const initialForm = {
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "", emergencyWAPhone: "",
    fatherName: "", motherName: "", packageDuration: "1"
  };
  const [formData, setFormData] = useState(initialForm);
  const [activeTab, setActiveTab] = useState('biodata');
  const [dpAmountStr, setDpAmountStr] = useState("");
  const [includeRegFee, setIncludeRegFee] = useState(true);

  // --- 1. LOAD DATA (SISWA & LOG ABSENSI) ---
  useEffect(() => {
    // Load Siswa
    const qStudents = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubStudents = onSnapshot(qStudents, (s) => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    // Load Log Kelas (Untuk Laporan Absensi di PDF)
    const qLogs = query(collection(db, "class_logs"), orderBy("date", "desc"));
    const unsubLogs = onSnapshot(qLogs, (s) => setClassLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));

    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    
    return () => { unsubStudents(); unsubLogs(); };
  }, [db]);

  // --- 2. ANALISIS DATA (UNTUK PDF STRATEGI) ---
  const analysisData = useMemo(() => {
    const trend = new Array(12).fill(0);
    let sdCount = 0, smpCount = 0;

    students.forEach(s => {
      // Hitung Jenjang
      if (s.schoolLevel === 'SD') sdCount++;
      else smpCount++;

      // Hitung Tren Bulanan (Berdasarkan createdAt atau joinedAt)
      if (s.createdAt) {
        const d = s.createdAt.toDate();
        if (d.getFullYear() === new Date().getFullYear()) {
          trend[d.getMonth()]++;
        }
      }
    });

    return { trend, sdCount, smpCount, total: students.length };
  }, [students]);

  // --- 3. LOGIKA PRINT ---
  const handlePrint = (mode, studentData = null) => {
    setShowProfile(studentData); // Set profile agar ter-render di DOM
    setPrintMode(mode);
    // Beri waktu sedikit agar DOM ter-render sebelum window.print()
    setTimeout(() => {
      window.print();
      // Reset mode print setelah dialog print muncul (user cancel/print)
      // setPrintMode(null); -> Jangan langsung null, biar user liat preview dulu kalau mau
    }, 500);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.schoolName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = filterLevel === "SEMUA" || s.schoolLevel === filterLevel;
      const matchGrade = filterGrade === "SEMUA" || s.schoolGrade === filterGrade;
      return matchName && matchLevel && matchGrade;
    });
  }, [students, searchTerm, filterLevel, filterGrade]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoc(doc(db, "students", formData.id), formData);
        alert("Data Diupdate!");
      } else {
        const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
        const total = (prices?.[priceKey] || 0) + (includeRegFee ? (prices?.pendaftaran || 0) : 0);
        const bayar = parseRupiah(dpAmountStr);
        const sisa = total - bayar;

        await runTransaction(db, async (t) => {
          const ref = doc(collection(db, "students"));
          t.set(ref, { ...formData, status: 'active', joinedAt: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
          if(bayar > 0) t.set(doc(collection(db, "payments")), { studentName: formData.name, amount: bayar, method: 'Tunai', date: serverTimestamp(), category: 'Pendaftaran', description: 'DP Pendaftaran' });
          if(sisa > 0) t.set(doc(collection(db, "invoices")), { studentId: ref.id, studentName: formData.name, totalAmount: sisa, remainingAmount: sisa, status: 'unpaid', dueDate: new Date().toISOString().split('T')[0], details: 'Sisa Pembayaran Paket', createdAt: serverTimestamp() });
        });
        alert("Pendaftaran Berhasil!");
      }
      setShowForm(false); setFormData(initialForm); setIsEditing(false);
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => { if(confirm("Hapus Permanen?")) await deleteDoc(doc(db, "students", id)); };

  // --- RENDER ---
  return (
    <div className="space-y-8 w-full max-w-[1600px] mx-auto pb-20 font-sans">
      
      {/* ==============================================
          AREA PDF LAPORAN (PRINT ONLY)
          ============================================== */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 h-auto overflow-visible">
        
        {/* === MODE 1: LAPORAN ANALISIS & STRATEGI (ALL) === */}
        {printMode === 'ALL' && (
          <div className="w-full">
            {/* Header Laporan */}
            <div className="text-center border-b-4 border-black pb-4 mb-8">
              <h1 className="text-3xl font-black uppercase tracking-widest">Laporan Evaluasi Pendaftaran Siswa</h1>
              <p className="text-sm font-bold uppercase tracking-[0.3em] mt-2">Bimbel Gemilang • Tahun 2026</p>
            </div>

            {/* Analisis Statistik (Dashboard Mini) */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="border-2 border-black p-4 text-center">
                <p className="text-[10px] font-black uppercase mb-1">Total Siswa Aktif</p>
                <p className="text-4xl font-black">{analysisData.total}</p>
              </div>
              <div className="border-2 border-black p-4 text-center">
                <p className="text-[10px] font-black uppercase mb-1">Populasi SD</p>
                <p className="text-4xl font-black">{analysisData.sdCount}</p>
              </div>
              <div className="border-2 border-black p-4 text-center">
                <p className="text-[10px] font-black uppercase mb-1">Populasi SMP</p>
                <p className="text-4xl font-black">{analysisData.smpCount}</p>
              </div>
            </div>

            {/* Grafik Pertumbuhan (SVG Manual agar support semua browser) */}
            <div className="mb-8 border-2 border-black p-6">
              <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2"><TrendingUp size={14}/> Grafik Tren Pendaftaran (Bulanan)</h3>
              <div className="h-32 flex items-end justify-between gap-2 px-2">
                {analysisData.trend.map((val, i) => {
                  const max = Math.max(...analysisData.trend, 1);
                  const h = (val / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full bg-black relative" style={{height: `${h}%`, minHeight: '1px'}}>
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold">{val > 0 ? val : ''}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase">{MONTHS[i]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tabel Data Siswa */}
            <h3 className="text-xs font-black uppercase mb-2">Database Siswa Terdaftar</h3>
            <table className="w-full text-[10px] border-collapse border border-black">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2 w-8">No</th>
                  <th className="border border-black p-2 text-left">Nama Lengkap</th>
                  <th className="border border-black p-2 text-left">Asal Sekolah</th>
                  <th className="border border-black p-2 text-center">Jenjang</th>
                  <th className="border border-black p-2 text-center">WA Ortu</th>
                  <th className="border border-black p-2 text-center">Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td className="border border-black p-2 text-center">{i+1}</td>
                    <td className="border border-black p-2 font-bold uppercase">{s.name}</td>
                    <td className="border border-black p-2">{s.schoolName}</td>
                    <td className="border border-black p-2 text-center">{s.schoolLevel} - {s.schoolGrade}</td>
                    <td className="border border-black p-2 text-center">{s.emergencyWAPhone}</td>
                    <td className="border border-black p-2 text-center">{s.joinedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === MODE 2: PROFIL SISWA & ABSENSI (SINGLE) === */}
        {printMode === 'SINGLE' && showProfile && (
          <div className="w-full">
            {/* Header Profil */}
            <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{showProfile.name}</h1>
                <p className="text-sm font-bold uppercase tracking-widest">{showProfile.schoolName} • {showProfile.schoolLevel}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-gray-500">Laporan Akademik Siswa</p>
                <p className="text-xl font-black">{new Date().getFullYear()}</p>
              </div>
            </div>

            {/* Biodata Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
              <div className="space-y-2">
                <div className="flex border-b border-black/20 pb-1"><span className="w-32 font-bold uppercase text-[10px]">Nama Panggilan</span> <span>{showProfile.nickname || '-'}</span></div>
                <div className="flex border-b border-black/20 pb-1"><span className="w-32 font-bold uppercase text-[10px]">Tempat/Tgl Lahir</span> <span>{showProfile.pob}, {showProfile.dob}</span></div>
                <div className="flex border-b border-black/20 pb-1"><span className="w-32 font-bold uppercase text-[10px]">Jenis Kelamin</span> <span>{showProfile.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div>
                <div className="flex border-b border-black/20 pb-1"><span className="w-32 font-bold uppercase text-[10px]">Kelas Saat Ini</span> <span>{showProfile.schoolGrade}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex border-b border-black/20 pb-1"><span className="w-32 font-bold uppercase text-[10px]">Nama Ayah</span> <span>{showProfile.fatherName || '-'}</span></div>
                <div className="flex border-b border-black/20 pb-1"><span className="w-32 font-bold uppercase text-[10px]">Nama Ibu</span> <span>{showProfile.motherName || '-'}</span></div>
                <div className="flex border-b border-black/20 pb-1"><span className="w-32 font-bold uppercase text-[10px]">Kontak Darurat</span> <span className="font-bold">{showProfile.emergencyWAPhone}</span></div>
                <div className="flex border-b border-black/20 pb-1"><span className="w-32 font-bold uppercase text-[10px]">Alamat Rumah</span> <span>{showProfile.address || '-'}</span></div>
              </div>
            </div>

            {/* Rekap Kehadiran (Auto Filter from Class Logs) */}
            <div className="mb-8">
              <h3 className="text-sm font-black uppercase mb-4 border-l-4 border-black pl-2 flex items-center gap-2"><Calendar size={16}/> Riwayat Kehadiran Kelas</h3>
              <table className="w-full text-[10px] border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 w-10 text-center">No</th>
                    <th className="border border-black p-2 text-left">Tanggal</th>
                    <th className="border border-black p-2 text-left">Mata Pelajaran</th>
                    <th className="border border-black p-2 text-left">Tentor</th>
                    <th className="border border-black p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classLogs.filter(log => log.studentsLog.some(s => s.id === showProfile.id)).length === 0 ? (
                    <tr><td colSpan="5" className="p-4 text-center italic text-gray-500">Belum ada data kehadiran untuk siswa ini.</td></tr>
                  ) : (
                    classLogs.filter(log => log.studentsLog.some(s => s.id === showProfile.id))
                    .map((log, idx) => {
                      const status = log.studentsLog.find(s => s.id === showProfile.id)?.status || '-';
                      return (
                        <tr key={log.id}>
                          <td className="border border-black p-2 text-center">{idx + 1}</td>
                          <td className="border border-black p-2 font-bold">{log.date}</td>
                          <td className="border border-black p-2 uppercase">{log.subject}</td>
                          <td className="border border-black p-2 uppercase">{log.teacherName}</td>
                          <td className="border border-black p-2 text-center font-black">
                            <span className={`px-2 py-0.5 rounded border border-black ${status==='Hadir'?'bg-white':'bg-gray-200'}`}>{status.toUpperCase()}</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==============================================
          DASHBOARD SCREEN (LAYAR ADMIN)
          ============================================== */}
      <div className="print:hidden space-y-8">
        
        {/* HEADER */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6 w-full xl:w-auto">
            <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-lg"><GraduationCap size={40}/></div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Database Siswa</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredStudents.length} Siswa Terdaftar</p>
            </div>
          </div>

          {/* FILTER SEARCH */}
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto bg-slate-50 p-2 rounded-[2.5rem]">
            <div className="flex items-center px-6 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1">
              <Search size={20} className="text-slate-400"/>
              <input className="p-4 bg-transparent outline-none font-bold text-slate-700 w-full" placeholder="Cari Nama / Sekolah..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            </div>
            <div className="flex gap-2">
              <select className="bg-white px-6 py-4 rounded-[2rem] font-black text-xs uppercase text-slate-600 border hover:border-blue-400" value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}><option value="SEMUA">Semua Jenjang</option><option value="SD">SD</option><option value="SMP">SMP</option></select>
              <select className="bg-white px-6 py-4 rounded-[2rem] font-black text-xs uppercase text-slate-600 border hover:border-blue-400" value={filterGrade} onChange={e=>setFilterGrade(e.target.value)}><option value="SEMUA">Kelas</option>{[1,2,3,4,5,6,7,8,9].map(n=><option key={n} value={n.toString()}>{n}</option>)}</select>
            </div>
          </div>

          <div className="flex gap-2 w-full xl:w-auto">
            <button onClick={() => handlePrint('ALL')} className="flex-1 xl:flex-none bg-slate-800 text-white px-6 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 shadow-xl flex items-center justify-center gap-2"><BarChart3 size={18}/> Analisis & Laporan</button>
            <button onClick={() => { setIsEditing(false); setFormData(initialForm); setShowForm(true); }} className="flex-1 xl:flex-none bg-blue-600 text-white px-6 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl flex items-center justify-center gap-2"><UserPlus size={18}/> Tambah Siswa</button>
          </div>
        </div>

        {/* GRID SISWA */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map(s => (
            <div key={s.id} onClick={() => {setShowProfile(s); setPrintMode(null);}} className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-slate-100 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-slate-400 font-black text-2xl uppercase border-2 border-white shadow-sm">{s.name.substring(0,2)}</div>
                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.schoolLevel==='SD'?'bg-orange-100 text-orange-600':'bg-purple-100 text-purple-600'}`}>{s.schoolLevel} • Kls {s.schoolGrade}</span>
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2 truncate">{s.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MapPin size={12}/> {s.schoolName || '-'}</p>
              </div>
              <div className="flex gap-2 relative z-10">
                <button onClick={(e) => { e.stopPropagation(); setFormData(s); setIsEditing(true); setShowForm(true); }} className="flex-1 bg-yellow-50 text-yellow-600 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-yellow-500 hover:text-white transition-all">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handlePrint('SINGLE', s); }} className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"><FileText size={14}/> PDF Profil</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 flex justify-between items-center text-white">
              <h3 className="text-2xl font-black uppercase tracking-widest">{isEditing ? 'Edit Siswa' : 'Pendaftaran Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="bg-white/20 p-3 rounded-full hover:bg-red-500 transition-all"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto">
              <div className="flex gap-4 mb-6 bg-slate-100 p-2 rounded-[2rem] w-fit">
                {['biodata', 'ortu', 'paket'].map(t => (
                  <button type="button" key={t} onClick={()=>setActiveTab(t)} className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase transition-all ${activeTab===t?'bg-white shadow text-blue-600':'text-slate-400'}`}>{t}</button>
                ))}
              </div>
              {activeTab === 'biodata' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="col-span-2"><label className="lbl">Nama Lengkap</label><input required className="inp text-xl uppercase" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
                  <div><label className="lbl">Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/></div>
                  <div><label className="lbl">Gender</label><select className="inp" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                  <div><label className="lbl">Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/></div>
                  <div className="flex gap-4"><div className="flex-1"><label className="lbl">Jenjang</label><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select></div><div className="flex-1"><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div></div>
                  <div className="col-span-2"><label className="lbl">Alamat</label><input className="inp" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})}/></div>
                </div>
              )}
              {activeTab === 'ortu' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div><label className="lbl">Ayah</label><input className="inp" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/></div>
                  <div><label className="lbl">Ibu</label><input className="inp" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/></div>
                  <div className="col-span-2"><label className="lbl text-green-600">WA Darurat</label><input required className="inp border-green-200 bg-green-50 text-green-800" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/></div>
                </div>
              )}
              {activeTab === 'paket' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200"><label className="lbl">Durasi</label><select className="inp text-xl" value={formData.packageDuration} onChange={e=>setFormData({...formData,packageDuration:e.target.value})}><option value="1">1 Bulan</option><option value="3">3 Bulan</option><option value="6">6 Bulan</option></select></div>
                  {!isEditing && (
                    <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                      <div className="flex items-center gap-3 mb-4"><input type="checkbox" checked={includeRegFee} onChange={e=>setIncludeRegFee(e.target.checked)} className="w-5 h-5 accent-blue-600"/><span className="font-bold text-sm uppercase">Biaya Pendaftaran?</span></div>
                      <label className="lbl">Bayar DP (Rp)</label><input className="inp text-3xl text-blue-600" placeholder="0" value={dpAmountStr} onChange={e=>setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/>
                    </div>
                  )}
                  <button className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">{isEditing ? 'Simpan' : 'Daftarkan'}</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* PROFIL MODAL (VIEW ONLY) */}
      {showProfile && !printMode && (
        <div className="fixed inset-0 bg-slate-900/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={()=>setShowProfile(null)}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300" onClick={e=>e.stopPropagation()}>
            <div className="bg-slate-100 p-10 text-center relative">
              <button onClick={()=>setShowProfile(null)} className="absolute top-6 right-6 p-3 bg-white rounded-full shadow hover:text-red-500"><X size={20}/></button>
              <div className="w-32 h-32 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-black text-slate-300 shadow-xl">{showProfile.name.substring(0,2)}</div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{showProfile.name}</h2>
              <p className="text-blue-500 font-bold uppercase text-xs tracking-widest mt-1">{showProfile.schoolName}</p>
            </div>
            <div className="p-10">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Kelas</p><p className="font-bold text-slate-800">{showProfile.schoolLevel} - {showProfile.schoolGrade}</p></div>
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Kontak</p><p className="font-bold text-green-600">{showProfile.emergencyWAPhone}</p></div>
              </div>
              <button onClick={()=>handlePrint('SINGLE', showProfile)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase hover:bg-black transition-all flex items-center justify-center gap-2"><Printer size={18}/> Cetak Laporan Lengkap</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lbl { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; display: block; }
        .inp { width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 16px; font-weight: 700; color: #1e293b; outline: none; }
        .inp:focus { border-color: #2563eb; background: #eff6ff; }
        
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body, html { height: auto !important; overflow: visible !important; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}