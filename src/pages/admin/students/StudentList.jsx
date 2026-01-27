import React, { useState, useMemo } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Search, Printer, FileText, MapPin, Trash2, Edit, X, User } from 'lucide-react';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

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

  const handleDelete = async (id) => {
    if(confirm("Hapus Siswa Permanen?")) await deleteDoc(doc(db, "students", id));
  };

  const handlePrint = (mode, data = null) => {
    setPrintData(data);
    setPrintMode(mode);
    setTimeout(() => { window.print(); }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* --- DASHBOARD UI --- */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.map(s => (
          <div key={s.id} onClick={()=>onSelect(s)} className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-100 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-slate-400 font-black text-2xl uppercase">{s.name.substring(0,2)}</div>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${s.schoolLevel==='SD'?'bg-orange-100 text-orange-600':'bg-purple-100 text-purple-600'}`}>{s.schoolLevel}</span>
            </div>
            <div className="mb-4">
              <h3 className="text-2xl font-black text-slate-800 uppercase truncate mb-1">{s.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MapPin size={12}/> {s.schoolName || '-'}</p>
            </div>
            <div className="flex gap-2 relative z-10">
              <button onClick={(e)=>{e.stopPropagation(); handlePrint('SINGLE', s)}} className="flex-1 bg-slate-100 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-800 hover:text-white transition-all">Cetak</button>
              <button onClick={(e)=>{e.stopPropagation(); handleDelete(s.id)}} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- PRINT TEMPLATE (CSS FIXED FOR A4) --- */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 m-0 w-full h-full overflow-visible">
        
        {/* MODE 1: LAPORAN SEMUA SISWA (TABEL) */}
        {printMode === 'ALL' && (
          <div className="p-10 w-full">
            <div className="text-center border-b-4 border-black pb-4 mb-8">
              <h1 className="text-2xl font-black uppercase tracking-widest">Laporan Data Siswa</h1>
              <p className="text-sm font-bold uppercase mt-1">Bimbel Gemilang • {new Date().getFullYear()}</p>
            </div>
            {/* Tabel dengan width 100% dan page-break handling */}
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2 w-8 text-center">No</th>
                  <th className="border border-black p-2 text-left">Nama Lengkap</th>
                  <th className="border border-black p-2 text-left">Sekolah</th>
                  <th className="border border-black p-2 text-center">Jenjang</th>
                  <th className="border border-black p-2 text-center">Kelas</th>
                  <th className="border border-black p-2 text-center">Kontak Ortu</th>
                  <th className="border border-black p-2 text-left">Alamat</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr key={s.id} style={{pageBreakInside: 'avoid'}}>
                    <td className="border border-black p-2 text-center">{i+1}</td>
                    <td className="border border-black p-2 font-bold uppercase">{s.name}</td>
                    <td className="border border-black p-2 uppercase">{s.schoolName}</td>
                    <td className="border border-black p-2 text-center">{s.schoolLevel}</td>
                    <td className="border border-black p-2 text-center">{s.schoolGrade}</td>
                    <td className="border border-black p-2 text-center">{s.emergencyWAPhone}</td>
                    <td className="border border-black p-2 truncate max-w-[150px]">{s.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 2: LAPORAN INDIVIDU (PROFIL) */}
        {printMode === 'SINGLE' && printData && (
          <div className="p-10 w-full max-w-[210mm] mx-auto">
            <div className="border-4 border-black p-8 rounded-[2rem]">
              <div className="text-center border-b-4 border-black pb-6 mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">{printData.name}</h1>
                <p className="text-sm font-bold uppercase tracking-widest bg-black text-white inline-block px-4 py-1 rounded">Profil Siswa Gemilang</p>
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-xs mb-8">
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Panggilan</span> <span className="font-bold uppercase">{printData.nickname}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Jenis Kelamin</span> <span className="font-bold uppercase">{printData.gender==='L'?'Laki-laki':'Perempuan'}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Tempat, Tgl Lahir</span> <span className="font-bold uppercase">{printData.pob}, {printData.dob}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Alamat</span> <span className="font-bold uppercase text-right w-1/2">{printData.address}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Asal Sekolah</span> <span className="font-bold uppercase">{printData.schoolName}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Jenjang / Kelas</span> <span className="font-bold uppercase">{printData.schoolLevel} / {printData.schoolGrade}</span></div>
              </div>

              <h3 className="font-black uppercase text-sm mb-4 border-l-4 border-black pl-2">Data Orang Tua</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-xs mb-8">
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Nama Ayah</span> <span className="font-bold uppercase">{printData.fatherName}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Pekerjaan Ayah</span> <span className="font-bold uppercase">{printData.fatherJob}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Nama Ibu</span> <span className="font-bold uppercase">{printData.motherName}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1"><span className="font-bold text-gray-500 uppercase">Pekerjaan Ibu</span> <span className="font-bold uppercase">{printData.motherJob}</span></div>
                <div className="flex justify-between border-b border-gray-300 pb-1 col-span-2"><span className="font-bold text-gray-500 uppercase">Kontak Darurat (WA)</span> <span className="font-black text-lg">{printData.emergencyWAPhone}</span></div>
              </div>

              <h3 className="font-black uppercase text-sm mb-4 border-l-4 border-black pl-2">Status Akademik</h3>
              <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl border border-black">
                <div><p className="text-[10px] font-bold uppercase text-gray-500">Tanggal Bergabung</p><p className="font-black">{printData.joinedAt}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-gray-500">Paket Terdaftar</p><p className="font-black">{printData.packageDuration} Bulan</p></div>
                <div><p className="text-[10px] font-bold uppercase text-gray-500">Status</p><p className="font-black bg-black text-white px-2 rounded">AKTIF</p></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .print\\:block { position: absolute; top: 0; left: 0; width: 100%; min-height: 100vh; z-index: 9999; background: white; }
          .print\\:hidden { display: none !important; }
          /* Mencegah tabel terpotong jelek */
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}