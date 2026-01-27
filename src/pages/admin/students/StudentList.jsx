import React, { useState, useMemo } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Search, Printer, MapPin, Trash2, Edit, X, User } from 'lucide-react';

export default function StudentList({ db, students, classLogs, onSelect, onCreate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("SEMUA");
  const [filterGrade, setFilterGrade] = useState("SEMUA");
  const [printMode, setPrintMode] = useState(null); 
  const [printData, setPrintData] = useState(null);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLvl = filterLevel === "SEMUA" || s.schoolLevel === filterLevel;
      const matchGrade = filterGrade === "SEMUA" || s.schoolGrade === filterGrade;
      return matchName && matchLvl && matchGrade;
    });
  }, [students, searchTerm, filterLevel, filterGrade]);

  const handlePrint = (mode, data = null) => {
    setPrintData(data);
    setPrintMode(mode);
    setTimeout(() => { window.print(); }, 800);
  };

  const handleDelete = async (id) => {
    if(confirm("Hapus Siswa Permanen?")) await deleteDoc(doc(db, "students", id));
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* HEADER DASHBOARD */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6 w-full xl:w-auto">
          <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-lg"><User size={40}/></div>
          <div><h2 className="text-3xl font-black text-slate-800 uppercase">Data Siswa</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredStudents.length} Siswa</p></div>
        </div>
        <div className="flex gap-4 w-full xl:w-auto bg-slate-50 p-2 rounded-[2.5rem]">
          <div className="flex items-center px-6 bg-white rounded-[2rem] shadow-sm flex-1"><Search size={20} className="text-slate-400"/><input className="p-4 bg-transparent outline-none font-bold w-full" placeholder="Cari..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
          <select className="bg-white px-6 py-4 rounded-[2rem] font-bold text-xs uppercase" value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}><option value="SEMUA">Semua</option><option value="SD">SD</option><option value="SMP">SMP</option></select>
        </div>
        <div className="flex gap-3">
          <button onClick={()=>handlePrint('ALL')} className="bg-slate-800 text-white px-6 py-4 rounded-[2rem] font-black text-xs uppercase hover:bg-black shadow-lg flex gap-2"><Printer size={18}/> Laporan Full</button>
          <button onClick={onCreate} className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase hover:bg-blue-700 shadow-lg flex gap-2"><User size={18}/> Baru</button>
        </div>
      </div>

      {/* GRID SISWA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.map(s => (
          <div key={s.id} onClick={()=>onSelect(s)} className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl uppercase">{s.name.substring(0,2)}</div>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${s.schoolLevel==='SD'?'bg-orange-100 text-orange-600':'bg-purple-100 text-purple-600'}`}>{s.schoolLevel}</span>
            </div>
            <div className="mb-4">
              <h3 className="text-2xl font-black text-slate-800 uppercase truncate mb-1">{s.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MapPin size={12}/> {s.schoolName || '-'}</p>
            </div>
            <div className="flex gap-2 relative z-10">
              <button onClick={(e)=>{e.stopPropagation(); handlePrint('SINGLE', s)}} className="flex-1 bg-slate-100 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-800 hover:text-white transition-all">Cetak Profil</button>
              <button onClick={(e)=>{e.stopPropagation(); handleDelete(s.id)}} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- CSS KHUSUS PRINT (SOLUSI NEMPEL) --- */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            background: white; 
            font-family: Arial, sans-serif;
            color: black;
          }
          /* Tabel agar tidak nempel */
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; font-size: 10px; }
          th { background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; }
          h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; text-align: center; }
          .header-print { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
          
          /* Grid Profil agar tidak nempel */
          .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .profile-row { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px; display: flex; justify-content: space-between; font-size: 12px; }
          .label { font-weight: bold; text-transform: uppercase; color: #555; }
        }
      `}</style>

      {/* --- TEMPLATE CETAK (HIDDEN DI LAYAR) --- */}
      <div className="print-area hidden">
        
        {/* FORMAT 1: LAPORAN SEMUA SISWA */}
        {printMode === 'ALL' && (
          <div>
            <div className="header-print">
              <h1>Laporan Data Siswa</h1>
              <p>Bimbel Gemilang • Total: {filteredStudents.length} Siswa</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{width: '5%'}}>No</th>
                  <th>Nama Lengkap</th>
                  <th>Asal Sekolah</th>
                  <th style={{width: '10%'}}>Jenjang</th>
                  <th style={{width: '10%'}}>Kelas</th>
                  <th style={{width: '15%'}}>Kontak Ortu</th>
                  <th>Alamat</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{textAlign: 'center'}}>{i+1}</td>
                    <td style={{fontWeight: 'bold'}}>{s.name}</td>
                    <td>{s.schoolName}</td>
                    <td style={{textAlign: 'center'}}>{s.schoolLevel}</td>
                    <td style={{textAlign: 'center'}}>{s.schoolGrade}</td>
                    <td>{s.emergencyWAPhone}</td>
                    <td>{s.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FORMAT 2: PROFIL SATU SISWA */}
        {printMode === 'SINGLE' && printData && (
          <div>
            <div className="header-print">
              <h1>{printData.name}</h1>
              <p>PROFIL SISWA • {printData.schoolName}</p>
            </div>

            <div className="profile-grid">
              <div>
                <h3 style={{fontSize:'14px', borderBottom:'2px solid black', marginBottom:'10px'}}>Biodata Siswa</h3>
                <div className="profile-row"><span className="label">Panggilan</span> <span>{printData.nickname}</span></div>
                <div className="profile-row"><span className="label">TTL</span> <span>{printData.pob}, {printData.dob}</span></div>
                <div className="profile-row"><span className="label">Gender</span> <span>{printData.gender==='L'?'Laki-laki':'Perempuan'}</span></div>
                <div className="profile-row"><span className="label">Alamat</span> <span>{printData.address}</span></div>
              </div>
              <div>
                <h3 style={{fontSize:'14px', borderBottom:'2px solid black', marginBottom:'10px'}}>Data Orang Tua</h3>
                <div className="profile-row"><span className="label">Ayah</span> <span>{printData.fatherName} ({printData.fatherJob})</span></div>
                <div className="profile-row"><span className="label