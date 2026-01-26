import React, { useState } from 'react';
import { MonitorPlay, QrCode, FileText, Trash2, Link as LinkIcon, Plus } from 'lucide-react';

export default function TeacherSmartClass({ db, user }) {
  const [mode, setMode] = useState('manage'); // manage | projector
  const [materials, setMaterials] = useState([]); 
  const [questions, setQuestions] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(-1); // -1 = Cover QR, 0..n = Soal

  // --- CRUD LOKAL (Bisa disambungkan ke Firebase jika mau permanen) ---
  const addMaterial = (type) => {
    const title = prompt("Judul Materi:");
    const content = prompt(type === 'link' ? "Masukkan URL:" : "Nama File:");
    if(title && content) setMaterials([...materials, { type, title, content }]);
  };

  const addQuestion = () => {
    const q = prompt("Pertanyaan:");
    if(q) setQuestions([...questions, { q, options: ["A", "B", "C", "D"] }]);
  };

  // --- TAMPILAN PROYEKTOR (BIOSKOP MODE) ---
  if (mode === 'projector') {
    return (
      <div className="fixed inset-0 bg-black z-[1000] flex flex-col text-white font-sans animate-in fade-in duration-700">
        <div className="flex justify-between items-center p-8 bg-white/5 backdrop-blur-md absolute top-0 w-full">
          <h2 className="text-xl font-black uppercase tracking-[0.3em] text-yellow-400">Gemilang Smart Class</h2>
          <button onClick={()=>setMode('manage')} className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all">Matikan Proyektor</button>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-10">
          {currentSlide === -1 ? (
            <div className="text-center animate-in zoom-in duration-500">
              <h1 className="text-7xl font-black mb-12 tracking-tighter">SIAP UNTUK KUIS?</h1>
              <div className="bg-white p-8 rounded-[3rem] inline-block shadow-[0_0_100px_rgba(255,255,255,0.3)]">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GEMILANG_QUIZ`} alt="Scan Me" className="rounded-2xl"/>
              </div>
              <p className="mt-10 text-3xl font-bold text-blue-400 uppercase tracking-widest">Scan QR Code</p>
            </div>
          ) : (
            questions[currentSlide] ? (
              <div className="w-full max-w-6xl animate-in slide-in-from-right duration-500">
                <div className="bg-blue-600 px-8 py-3 rounded-full w-fit mb-8 font-black text-xl uppercase tracking-widest shadow-lg shadow-blue-500/50">Pertanyaan {currentSlide + 1}</div>
                <h1 className="text-5xl md:text-7xl font-black leading-tight mb-16">{questions[currentSlide].q}</h1>
                <div className="grid grid-cols-2 gap-8">
                  {questions[currentSlide].options.map((opt, i) => (
                    <div key={i} className="bg-white/10 border-[6px] border-white/10 p-10 rounded-[3rem] text-4xl font-bold hover:bg-white hover:text-blue-900 hover:border-white transition-all cursor-pointer">
                      <span className="opacity-50 mr-6 font-mono">{String.fromCharCode(65+i)}.</span> Opsi Jawaban {opt}
                    </div>
                  ))}
                </div>
              </div>
            ) : <h1 className="text-8xl font-black text-green-400 tracking-tighter animate-bounce">KUIS SELESAI! 🎉</h1>
          )}
        </div>

        <div className="p-8 bg-white/5 backdrop-blur-md flex justify-between items-center absolute bottom-0 w-full">
          <button onClick={()=>setCurrentSlide(p => Math.max(-1, p - 1))} className="text-white/50 hover:text-white font-black text-lg uppercase tracking-widest flex items-center gap-4 hover:bg-white/10 px-6 py-3 rounded-2xl transition-all">&larr; Mundur</button>
          <div className="flex gap-3">
            {questions.map((_, i) => <div key={i} className={`w-4 h-4 rounded-full transition-all ${i===currentSlide?'bg-yellow-400 scale-125':'bg-white/20'}`}></div>)}
          </div>
          <button onClick={()=>setCurrentSlide(p => Math.min(questions.length, p + 1))} className="text-white/50 hover:text-white font-black text-lg uppercase tracking-widest flex items-center gap-4 hover:bg-white/10 px-6 py-3 rounded-2xl transition-all">Lanjut &rarr;</button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN MANAJEMEN (ADMIN GURU) ---
  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3.5rem] border shadow-xl gap-8">
        <div><h2 className="text-4xl font-black uppercase text-slate-800 tracking-tighter">Smart Classroom</h2><p className="text-slate-400 font-bold mt-2 uppercase tracking-widest">Pusat Kendali Materi & Proyektor</p></div>
        <button onClick={()=>{setCurrentSlide(-1); setMode('projector');}} className="bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black uppercase shadow-2xl flex items-center gap-4 hover:bg-blue-600 transition-all active:scale-95"><MonitorPlay size={24}/> Aktifkan Proyektor</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* PANEL MATERI */}
        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
          <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><FileText className="text-blue-600"/> Materi Ajar</h3>
          <div className="flex gap-4 mb-8">
            <button onClick={()=>addMaterial('file')} className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-[2rem] font-black text-xs uppercase hover:bg-blue-600 hover:text-white transition-all">+ File</button>
            <button onClick={()=>addMaterial('link')} className="flex-1 py-4 bg-purple-50 text-purple-600 rounded-[2rem] font-black text-xs uppercase hover:bg-purple-600 hover:text-white transition-all">+ Link Web</button>
          </div>
          <div className="space-y-4">
            {materials.map((m, i) => (
              <div key={i} className="flex items-center gap-4 p-5 border-2 border-slate-50 rounded-[2rem] hover:border-blue-200 transition-all cursor-pointer group">
                <div className="p-4 bg-slate-100 rounded-2xl">{m.type==='link'?<LinkIcon size={20}/>:<FileText size={20}/>}</div>
                <div className="flex-1 overflow-hidden"><h4 className="font-black text-sm uppercase truncate">{m.title}</h4><p className="text-[10px] text-slate-400 truncate">{m.content}</p></div>
                <button className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
              </div>
            ))}
            {materials.length===0 && <div className="text-center py-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-bold">Materi Kosong</div>}
          </div>
        </div>

        {/* PANEL SOAL */}
        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
          <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><QrCode className="text-orange-600"/> Bank Soal</h3>
          <button onClick={addQuestion} className="w-full py-5 border-4 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black uppercase hover:border-orange-400 hover:text-orange-500 transition-all mb-8 flex items-center justify-center gap-2"><Plus size={20}/> Buat Soal Baru</button>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="p-6 bg-orange-50 rounded-[2.5rem] border border-orange-100 flex justify-between items-center group hover:bg-orange-100 transition-all">
                <span className="font-black text-sm uppercase text-orange-900 line-clamp-1">Soal {i+1}: {q.q}</span>
                <span className="text-[10px] font-black bg-white px-3 py-1 rounded-lg text-orange-400 shadow-sm">4 Opsi</span>
              </div>
            ))}
            {questions.length===0 && <div className="text-center py-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-bold">Belum ada soal</div>}
          </div>
        </div>
      </div>
    </div>
  );
}