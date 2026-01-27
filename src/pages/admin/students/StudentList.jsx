import React, { useState } from 'react';
import { Search, Plus, FileText, User } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function StudentList({ students = [], classLogs = [], onSelect, onCreate }) {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');

  // SAFE FILTER (Biar gak layar putih)
  const safeStudents = Array.isArray(students) ? students : [];

  const filteredStudents = safeStudents.filter(s => {
    const matchName = s.name?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'ALL' || s.schoolLevel === filterLevel;
    return matchName && matchLevel;
  });

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Siswa Bimbel Gemilang", 14, 15);
    doc.autoTable({
      startY: 20,
      head: [['Nama', 'Kelas', 'Sekolah', 'Wali Murid', 'No. HP']],
      body: filteredStudents.map(s => [s.name, s.grade, s.school, s.parentName, s.phone]),
    });
    doc.save("data-siswa-gemilang.pdf");
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">DATA SISWA</h1>
          <p className="text-sm font-bold text-slate-400">Total: {filteredStudents.length} Siswa</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPDF} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-200 transition-all flex items-center gap-2"><FileText size={16}/> PDF</button>
          <button onClick={onCreate} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-blue-700 shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"><Plus size={16}/> Tambah Siswa</button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 flex items-center gap-3 px-4 bg-slate-50 rounded-xl">
          <Search size={20} className="text-slate-400"/>
          <input type="text" placeholder="Cari nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent w-full py-3 font-bold text-slate-700 outline-none placeholder:text-slate-300"/>
        </div>
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="px-6 py-3 bg-slate-50 rounded-xl font-bold text-slate-600 outline-none text-xs uppercase">
          <option value="ALL">Semua Jenjang</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </select>
      </div>

      {/* LIST SISWA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-20 text-center"><div className="inline-block p-6 bg-slate-50 rounded-full mb-4 text-slate-300"><User size={48}/></div><h3 className="text-slate-400 font-bold">Tidak ada siswa ditemukan.</h3></div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student.id} onClick={() => onSelect(student)} className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 text-blue-600 group-hover:scale-125 transition-transform"><User size={80}/></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${student.schoolLevel === 'SD' ? 'bg-green-100 text-green-600' : student.schoolLevel === 'SMP' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>{student.schoolLevel}</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{student.name}</h3>
                <p className="text-xs font-bold text-slate-400 mb-6">{student.school} • Kelas {student.grade}</p>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Wali: {student.parentName || '-'}</span><span className="text-[10px] font-black text-blue-600 uppercase">Lihat Detail &rarr;</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}