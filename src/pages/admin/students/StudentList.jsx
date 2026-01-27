import React, { useState, useMemo } from 'react';
import { Search, GraduationCap, UserPlus, Filter, MapPin, ChevronRight } from 'lucide-react';

export default function StudentList({ students, onSelect, onCreate }) {
  const [search, setSearch] = useState("");
  const [filterLvl, setFilterLvl] = useState("SEMUA");

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchName = s.name.toLowerCase().includes(search.toLowerCase());
      const matchLvl = filterLvl === "SEMUA" || s.schoolLevel === filterLvl;
      return matchName && matchLvl;
    });
  }, [students, search, filterLvl]);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6 w-full xl:w-auto">
          <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-lg"><GraduationCap size={40}/></div>
          <div><h2 className="text-3xl font-black uppercase text-slate-800">Manajemen Siswa</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Data Ditampilkan</p></div>
        </div>
        <div className="flex gap-4 w-full xl:w-auto bg-slate-50 p-2 rounded-[2.5rem]">
          <div className="flex items-center px-6 bg-white rounded-[2rem] shadow-sm flex-1"><Search size={20} className="text-slate-400"/><input className="p-4 bg-transparent outline-none font-bold w-full" placeholder="Cari Siswa..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select className="bg-white px-6 py-4 rounded-[2rem] font-bold text-xs uppercase" value={filterLvl} onChange={e=>setFilterLvl(e.target.value)}><option value="SEMUA">Semua</option><option value="SD">SD</option><option value="SMP">SMP</option></select>
        </div>
        <button onClick={onCreate} className="bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] font-black text-xs uppercase hover:bg-blue-600 shadow-xl transition-all flex items-center gap-3"><UserPlus size={18}/> Siswa Baru</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(s => (
          <div key={s.id} onClick={()=>onSelect(s)} className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-100 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-slate-400 font-black text-2xl uppercase">{s.name.substring(0,2)}</div>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${s.schoolLevel==='SD'?'bg-orange-100 text-orange-600':'bg-purple-100 text-purple-600'}`}>{s.schoolLevel}</span>
            </div>
            <div className="mb-4">
              <h3 className="text-2xl font-black text-slate-800 uppercase truncate mb-1">{s.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MapPin size={12}/> {s.schoolName || '-'}</p>
            </div>
            <div className="flex justify-end"><div className="p-3 bg-slate-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all"><ChevronRight size={20}/></div></div>
          </div>
        ))}
      </div>
    </div>
  );
}