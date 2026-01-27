import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  GraduationCap, UserPlus, Save, Trash2, Edit, X, Search, Filter, 
  Printer, FileText, MoreHorizontal, MapPin, Phone, User, BookOpen
} from 'lucide-react';

// --- HELPER FORMAT ---
const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminStudents({ db }) {
  // --- STATE DATA ---
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  
  // --- STATE FILTER & SEARCH (AGAR TIDAK LEMOT) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("SEMUA"); // SD, SMP
  const [filterGrade, setFilterGrade] = useState("SEMUA"); // 1, 2, 3...

  // --- STATE MODAL ---
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(null); // Data siswa utk view profile
  const [isEditing, setIsEditing] = useState(false);
  const [printMode, setPrintMode] = useState(null); // 'ALL' or 'SINGLE'

  // --- FORM STATE ---
  const initialForm = {
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "", emergencyWAPhone: "",
    fatherName: "", motherName: "", packageDuration: "1"
  };
  const [formData, setFormData] = useState(initialForm);
  const [activeTab, setActiveTab] = useState('biodata');
  
  // Keuangan Form
  const [dpAmountStr, setDpAmountStr] = useState("");
  const [includeRegFee, setIncludeRegFee] = useState(true);

  // --- 1. LOAD DATA ---
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (s) => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    return () => unsub();
  }, [db]);

  // --- 2. SMART FILTERING (MEMOIZED) ---
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.schoolName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = filterLevel === "SEMUA" || s.schoolLevel === filterLevel;
      const matchGrade = filterGrade === "SEMUA" || s.schoolGrade === filterGrade;
      return matchName && matchLevel && matchGrade;
    });
  }, [students, searchTerm, filterLevel, filterGrade]);

  // --- 3. ACTIONS ---
  const handleEditClick = (s) => {
    setFormData(s);
    setIsEditing(true);
    setShowForm(true);
    setShowProfile(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoc(doc(db, "students", formData.id), formData);
        alert("Data Siswa Diperbarui!");
      } else {
        // Logika Pendaftaran Baru (Sama seperti sebelumnya)
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
        alert("Siswa Baru Berhasil Didaftarkan!");
      }
      setShowForm(false); setFormData(initialForm); setIsEditing(false);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDelete = async (id) => {
    if(confirm("Hapus Permanen? Data tidak bisa kembali.")) await deleteDoc(doc(db, "students", id));
  };

  // --- 4. RENDER UI ---
  return (
    <div className="space-y-8 w-full max-w-[1600px] mx-auto pb-20 font-sans">
      
      {/* HEADER & CONTROLS */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6 w-full xl:w-auto">
          <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-lg"><GraduationCap size={40}/></div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Database Siswa</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredStudents.length} Siswa Ditemukan</p>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto bg-slate-50 p-3 rounded-[2.5rem]">
          <div className="flex items-center px-6 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1">
            <Search size={20} className="text-slate-400"/>
            <input 
              className="p-4 bg-transparent outline-none font-bold text-slate-700 w-full" 
              placeholder="Cari Nama / Sekolah..." 
              value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            <select className="bg-white px-6 py-4 rounded-[2rem] font-black text-xs uppercase text-slate-600 border border-slate-200 outline-none cursor-pointer hover:border-blue-400 transition-all" value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}>
              <option value="SEMUA">Semua Jenjang</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
            </select>
            <select className="bg-white px-6 py-4 rounded-[2rem] font-black text-xs uppercase text-slate-600 border border-slate-200 outline-none cursor-pointer hover:border-blue-400 transition-all" value={filterGrade} onChange={e=>setFilterGrade(e.target.value)}>
              <option value="SEMUA">Semua Kelas</option>
              {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n.toString()}>Kelas {n}</option>)}
            </select>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 w-full xl:w-auto">
          <button onClick={() => { setPrintMode('ALL'); setTimeout(()=>window.print(), 500); }} className="flex-1 xl:flex-none bg-slate-800 text-white px-8 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 shadow-xl flex items-center justify-center gap-3 transition-all"><Printer size={18}/> Laporan PDF</button>
          <button onClick={() => { setIsEditing(false); setFormData(initialForm); setShowForm(true); }} className="flex-1 xl:flex-none bg-blue-600 text-white px-8 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl flex items-center justify-center gap-3 transition-all"><UserPlus size={18}/> Siswa Baru</button>
        </div>
      </div>

      {/* GRID SISWA (LAYOUT MODERN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredStudents.map(s => (
          <div key={s.id} onClick={() => setShowProfile(s)} className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="bg-slate-100 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-slate-400 font-black text-2xl uppercase border-2 border-white shadow-sm">
                {s.name.substring(0,2)}
              </div>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.schoolLevel==='SD'?'bg-orange-100 text-orange-600':'bg-purple-100 text-purple-600'}`}>
                {s.schoolLevel} • Kls {s.schoolGrade}
              </span>
            </div>
            
            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2 truncate">{s.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MapPin size={12}/> {s.schoolName || 'Sekolah Tidak Ada'}</p>
            </div>

            {/* BUTTONS AREA - STOP PROPAGATION AGAR TIDAK MEMBUKA PROFIL */}
            <div className="flex gap-2 relative z-20">
              <button onClick={(e) => { e.stopPropagation(); handleEditClick(s); }} className="flex-1 bg-yellow-50 text-yellow-600 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-yellow-500 hover:text-white transition-all">Edit</button>
              <button onClick={(e) => { e.stopPropagation(); setShowProfile(s); setPrintMode('SINGLE'); setTimeout(()=>window.print(), 500); }} className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-800 hover:text-white transition-all">Cetak Profil</button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
            </div>

            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-500"><User size={200}/></div>
          </div>
        ))}
      </div>

      {/* --- MODAL FORM PENDAFTARAN / EDIT --- */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden my-10 animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 flex justify-between items-center text-white">
              <h3 className="text-2xl font-black uppercase tracking-widest">{isEditing ? 'Edit Data Siswa' : 'Form Pendaftaran'}</h3>
              <button onClick={() => setShowForm(false)} className="bg-white/20 p-3 rounded-full hover:bg-red-500 transition-all"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="flex gap-4 mb-6 bg-slate-100 p-2 rounded-[2rem] w-fit">
                <button type="button" onClick={()=>setActiveTab('biodata')} className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase transition-all ${activeTab==='biodata'?'bg-white shadow text-blue-600':'text-slate-400'}`}>1. Biodata</button>
                <button type="button" onClick={()=>setActiveTab('ortu')} className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase transition-all ${activeTab==='ortu'?'bg-white shadow text-blue-600':'text-slate-400'}`}>2. Orang Tua</button>
                <button type="button" onClick={()=>setActiveTab('paket')} className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase transition-all ${activeTab==='paket'?'bg-white shadow text-blue-600':'text-slate-400'}`}>3. Paket Belajar</button>
              </div>

              {activeTab === 'biodata' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="col-span-2"><label className="lbl">Nama Lengkap</label><input required className="inp text-xl uppercase" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
                  <div><label className="lbl">Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/></div>
                  <div><label className="lbl">Jenis Kelamin</label><select className="inp" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                  <div><label className="lbl">Asal Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/></div>
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="lbl">Jenjang</label><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select></div>
                    <div className="flex-1"><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div>
                  </div>
                  <div className="col-span-2"><label className="lbl">Alamat</label><input className="inp" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})}/></div>
                </div>
              )}

              {activeTab === 'ortu' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div><label className="lbl">Nama Ayah</label><input className="inp" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/></div>
                  <div><label className="lbl">Nama Ibu</label><input className="inp" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/></div>
                  <div className="col-span-2"><label className="lbl text-green-600">WhatsApp Darurat (Wajib)</label><input required className="inp border-green-200 bg-green-50 text-green-800" placeholder="08xxxxx" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/></div>
                </div>
              )}

              {activeTab === 'paket' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                    <label className="lbl">Durasi Paket</label>
                    <select className="inp text-xl" value={formData.packageDuration} onChange={e=>setFormData({...formData,packageDuration:e.target.value})}>
                      <option value="1">1 Bulan</option><option value="3">3 Bulan</option><option value="6">6 Bulan</option>
                    </select>
                  </div>
                  {!isEditing && (
                    <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                      <div className="flex items-center gap-3 mb-4"><input type="checkbox" checked={includeRegFee} onChange={e=>setIncludeRegFee(e.target.checked)} className="w-5 h-5 accent-blue-600"/><span className="font-bold text-sm uppercase">Termasuk Biaya Pendaftaran?</span></div>
                      <label className="lbl">Bayar DP Sekarang (Rp)</label>
                      <input className="inp text-3xl text-blue-600" placeholder="0" value={dpAmountStr} onChange={e=>setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/>
                    </div>
                  )}
                  <button className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">{isEditing ? 'Simpan Perubahan' : 'Daftarkan Siswa'}</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PROFILE VIEW (DETAIL SISWA) --- */}
      {showProfile && !isEditing && (
        <div className="fixed inset-0 bg-slate-900/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={()=>setShowProfile(null)}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300" onClick={e=>e.stopPropagation()}>
            <div className="bg-slate-100 p-10 text-center relative">
              <button onClick={()=>setShowProfile(null)} className="absolute top-6 right-6 p-3 bg-white rounded-full shadow hover:text-red-500"><X size={20}/></button>
              <div className="w-32 h-32 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-black text-slate-300 shadow-xl">{showProfile.name.substring(0,2)}</div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{showProfile.name}</h2>
              <p className="text-blue-500 font-bold uppercase text-xs tracking-widest mt-1">{showProfile.schoolName}</p>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Jenjang</p><p className="font-bold text-slate-800">{showProfile.schoolLevel} - Kls {showProfile.schoolGrade}</p></div>
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Bergabung</p><p className="font-bold text-slate-800">{showProfile.joinedAt}</p></div>
                <div className="p-4 bg-slate-50 rounded-2xl col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase">WA Darurat</p><p className="font-bold text-green-600 text-xl">{showProfile.emergencyWAPhone}</p></div>
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Ayah</p><p className="font-bold text-slate-800">{showProfile.fatherName || '-'}</p></div>
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Ibu</p><p className="font-bold text-slate-800">{showProfile.motherName || '-'}</p></div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>{handleEditClick(showProfile)}} className="flex-1 bg-yellow-400 text-yellow-900 py-4 rounded-2xl font-black uppercase hover:bg-yellow-500 transition-all">Edit Data</button>
                <button onClick={()=>{setPrintMode('SINGLE'); setTimeout(()=>window.print(), 500);}} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black uppercase hover:bg-black transition-all">Cetak Data</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINT AREA (HIDDEN) --- */}
      <div className="hidden print:block fixed inset-0 bg-white z-[1000] p-10">
        {printMode === 'ALL' ? (
          <div>
            <h1 className="text-3xl font-black uppercase text-center mb-10 border-b-4 border-black pb-4">Laporan Data Siswa Bimbel Gemilang</h1>
            <table className="w-full text-xs border-collapse border border-black">
              <thead><tr className="bg-gray-200"><th className="border p-2">No</th><th className="border p-2">Nama</th><th className="border p-2">Sekolah</th><th className="border p-2">Kelas</th><th className="border p-2">WA Ortu</th><th className="border p-2">Gabung</th></tr></thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr key={s.id}><td className="border p-2 text-center">{i+1}</td><td className="border p-2 font-bold uppercase">{s.name}</td><td className="border p-2">{s.schoolName}</td><td className="border p-2 text-center">{s.schoolLevel} - {s.schoolGrade}</td><td className="border p-2">{s.emergencyWAPhone}</td><td className="border p-2 text-center">{s.joinedAt}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : showProfile ? (
          <div className="max-w-2xl mx-auto border-4 border-black p-10 rounded-[3rem]">
            <h1 className="text-4xl font-black uppercase text-center mb-2">Biodata Siswa</h1>
            <p className="text-center text-sm font-bold uppercase tracking-widest mb-10">Bimbel Gemilang</p>
            <div className="space-y-6 text-lg">
              <div className="border-b-2 border-black pb-2 flex justify-between"><span className="font-bold">Nama Lengkap</span><span className="uppercase">{showProfile.name}</span></div>
              <div className="border-b-2 border-black pb-2 flex justify-between"><span className="font-bold">Sekolah</span><span className="uppercase">{showProfile.schoolName}</span></div>
              <div className="border-b-2 border-black pb-2 flex justify-between"><span className="font-bold">Jenjang/Kelas</span><span className="uppercase">{showProfile.schoolLevel} / {showProfile.schoolGrade}</span></div>
              <div className="border-b-2 border-black pb-2 flex justify-between"><span className="font-bold">Kontak Darurat</span><span>{showProfile.emergencyWAPhone}</span></div>
              <div className="border-b-2 border-black pb-2 flex justify-between"><span className="font-bold">Nama Ayah</span><span className="uppercase">{showProfile.fatherName}</span></div>
              <div className="border-b-2 border-black pb-2 flex justify-between"><span className="font-bold">Nama Ibu</span><span className="uppercase">{showProfile.motherName}</span></div>
              <div className="border-b-2 border-black pb-2 flex justify-between"><span className="font-bold">Tanggal Gabung</span><span>{showProfile.joinedAt}</span></div>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        .lbl { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; display: block; letter-spacing: 0.05em; }
        .inp { width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 16px; font-weight: 700; color: #1e293b; outline: none; transition: all 0.2s; }
        .inp:focus { border-color: #2563eb; background: #eff6ff; }
        @media print { body * { visibility: hidden; } .print\\:block, .print\\:block * { visibility: visible; } .print\\:block { position: absolute; left: 0; top: 0; width: 100%; height: 100%; } }
      `}</style>
    </div>
  );
}