import React, { useState } from 'react';
import { MonitorPlay, QrCode, FileText, Trash2, Link as LinkIcon, Plus, Image as ImageIcon, Save, X, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';

export default function TeacherSmartClass({ db, user }) {
  const [mode, setMode] = useState('dashboard'); // dashboard | editor | projector
  
  // --- STATE DATA ---
  const [materials, setMaterials] = useState([]); 
  // Struktur Quiz: { title: "Kuis Matematika", questions: [] }
  const [activeQuiz, setActiveQuiz] = useState(null); 
  const [currentSlide, setCurrentSlide] = useState(-1);

  // --- STATE EDITOR ---
  const [editorTitle, setEditorTitle] = useState("");
  const [editorQuestions, setEditorQuestions] = useState([]);

  // --- FUNGSI EDITOR SOAL ---
  const startNewQuiz = () => {
    setEditorTitle("Kuis Baru");
    // Siapkan 1 slot kosong awal
    setEditorQuestions([{ id: 1, text: "", hasImage: false, imagePreview: null, options: {A:"", B:"", C:"", D:""}, answer: "A" }]);
    setMode('editor');
  };

  const addQuestionSlot = () => {
    setEditorQuestions([
      ...editorQuestions, 
      { id: editorQuestions.length + 1, text: "", hasImage: false, imagePreview: null, options: {A:"", B:"", C:"", D:""}, answer: "A" }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const newQ = [...editorQuestions];
    newQ[index][field] = value;
    setEditorQuestions(newQ);
  };

  const updateOption = (index, optKey, value) => {
    const newQ = [...editorQuestions];
    newQ[index].options[optKey] = value;
    setEditorQuestions(newQ);
  };

  const handleImageUpload = (index, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newQ = [...editorQuestions];
        newQ[index].imagePreview = reader.result; // Simpan sbg Base64 (Sementara)
        setEditorQuestions(newQ);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveQuizToProjector = () => {
    if(!editorTitle) return alert("Isi Judul Kuis!");
    setActiveQuiz({ title: editorTitle, questions: editorQuestions });
    setMode('dashboard');
    alert("Soal Siap Ditampilkan!");
  };

  // --- FUNGSI MATERI ---
  const addMaterial = (type) => {
    const title = prompt("Judul Materi:");
    const content = prompt(type === 'link' ? "Masukkan URL:" : "Nama File:");
    if(title && content) setMaterials([...materials, { type, title, content }]);
  };

  // ================= VIEW: PROJECTOR MODE (PRESENTASI) =================
  if (mode === 'projector') {
    const currentQ = activeQuiz.questions[currentSlide];

    return (
      <div className="fixed inset-0 bg-slate-950 z-[1000] flex flex-col text-white font-sans animate-in fade-in duration-500">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-6 bg-white/5 backdrop-blur-md absolute top-0 w-full z-10">
          <div>
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-yellow-400">Gemilang Smart Class</h2>
            <p className="text-xs font-bold text-white/50 uppercase">{activeQuiz?.title}</p>
          </div>
          <button onClick={()=>setMode('dashboard')} className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all">Tutup Layar</button>
        </div>
        
        {/* Main Slide Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          
          {currentSlide === -1 ? (
            // COVER & QR
            <div className="text-center animate-in zoom-in duration-500">
              <h1 className="text-6xl md:text-8xl font-black mb-10 tracking-tighter text-white">SIAP UNTUK KUIS?</h1>
              <div className="bg-white p-6 rounded-[2rem] inline-block shadow-[0_0_100px_rgba(37,99,235,0.5)]">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GEMILANG_QUIZ`} alt="QR" className="rounded-xl w-64 h-64"/>
              </div>
              <p className="mt-8 text-2xl font-bold text-blue-400 uppercase tracking-widest animate-pulse">Scan QR Code</p>
            </div>
          ) : currentQ ? (
            // SOAL SLIDE
            <div className="w-full max-w-7xl h-full flex flex-col justify-center animate-in slide-in-from-right duration-500">
              <div className="flex items-start gap-8 h-full pt-20 pb-20">
                
                {/* Area Soal (Kiri) */}
                <div className={`${currentQ.imagePreview ? 'w-1/2' : 'w-full'} flex flex-col justify-center`}>
                  <div className="bg-blue-600 px-6 py-2 rounded-full w-fit mb-6 font-black text-lg uppercase tracking-widest shadow-lg">Soal No. {currentSlide + 1}</div>
                  <h1 className={`${currentQ.imagePreview ? 'text-3xl' : 'text-5xl'} font-black leading-tight mb-10`}>{currentQ.text}</h1>
                  
                  {/* Grid Jawaban */}
                  <div className={`grid ${currentQ.imagePreview ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                    {['A','B','C','D'].map((opt) => (
                      <div key={opt} className={`bg-white/10 border-4 border-white/5 p-6 rounded-[1.5rem] flex items-center gap-4 ${currentQ.imagePreview ? 'text-xl' : 'text-2xl'} font-bold`}>
                        <span className="bg-white text-black w-10 h-10 flex items-center justify-center rounded-full font-black text-sm">{opt}</span>
                        <span>{currentQ.options[opt]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Area Gambar (Kanan - Jika Ada) */}
                {currentQ.imagePreview && (
                  <div className="w-1/2 h-full flex items-center justify-center bg-black/30 rounded-[3rem] border-4 border-white/10 p-4">
                    <img src={currentQ.imagePreview} alt="Soal" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"/>
                  </div>
                )}

              </div>
            </div>
          ) : (
            // SELESAI
            <div className="text-center animate-bounce">
              <h1 className="text-9xl font-black text-green-500 tracking-tighter">SELESAI!</h1>
              <p className="text-2xl text-white font-bold mt-4 uppercase">Kumpulkan Jawaban Anda</p>
            </div>
          )}
        </div>

        {/* Navigation Bar */}
        <div className="h-24 bg-white/5 backdrop-blur-md flex justify-between items-center px-10 absolute bottom-0 w-full border-t border-white/10">
          <button onClick={()=>setCurrentSlide(p => Math.max(-1, p - 1))} className="text-white hover:bg-white/20 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2"><ChevronLeft/> Sebelumnya</button>
          
          <div className="flex gap-2 overflow-x-auto max-w-xl px-4 scrollbar-hide">
            {activeQuiz?.questions.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full shrink-0 transition-all ${i===currentSlide?'bg-yellow-400 scale-150':'bg-white/20'}`}></div>
            ))}
          </div>

          <button onClick={()=>setCurrentSlide(p => Math.min(activeQuiz.questions.length, p + 1))} className="text-white hover:bg-white/20 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2">Selanjutnya <ChevronRight/></button>
        </div>
      </div>
    );
  }

  // ================= VIEW: EDITOR MODE (INPUT SOAL) =================
  if (mode === 'editor') {
    return (
      <div className="min-h-screen bg-slate-50 p-8 animate-in slide-in-from-bottom duration-500 pb-32">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Editor */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl flex justify-between items-center sticky top-4 z-40 border-4 border-blue-50">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Judul Kuis / Latihan</label>
              <input 
                className="text-3xl font-black text-slate-800 outline-none bg-transparent w-full placeholder:text-slate-300" 
                placeholder="Ketikan Judul Kuis..." 
                value={editorTitle}
                onChange={(e)=>setEditorTitle(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setMode('dashboard')} className="p-4 rounded-2xl bg-gray-100 hover:bg-red-100 text-slate-500 hover:text-red-500 transition-all"><X size={24}/></button>
              <button onClick={saveQuizToProjector} className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all flex items-center gap-2"><Save size={20}/> Simpan & Siap</button>
            </div>
          </div>

          {/* List Soal */}
          {editorQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 group hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-lg text-xs font-black uppercase">Soal Nomor {idx + 1}</span>
                <button onClick={()=>{const n=[...editorQuestions]; n.splice(idx,1); setEditorQuestions(n);}} className="text-red-300 hover:text-red-500"><Trash2 size={20}/></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Soal Text */}
                <div className="lg:col-span-2 space-y-4">
                  <textarea 
                    className="w-full bg-slate-50 p-6 rounded-3xl font-bold text-lg text-slate-700 outline-none focus:bg-blue-50 focus:text-blue-900 transition-all resize-none h-32 border-2 border-transparent focus:border-blue-200" 
                    placeholder="Tulis pertanyaan disini..."
                    value={q.text}
                    onChange={(e)=>updateQuestion(idx, 'text', e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    {['A','B','C','D'].map(opt => (
                      <div key={opt} className="flex items-center gap-3 bg-white border-2 border-slate-100 p-3 rounded-2xl focus-within:border-blue-400">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs cursor-pointer transition-all ${q.answer===opt?'bg-green-500 text-white':'bg-slate-200 text-slate-500'}`} onClick={()=>updateQuestion(idx, 'answer', opt)}>{opt}</span>
                        <input 
                          className="w-full outline-none font-bold text-sm text-slate-600 bg-transparent" 
                          placeholder={`Jawaban ${opt}`}
                          value={q.options[opt]}
                          onChange={(e)=>updateOption(idx, opt, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kolom Gambar */}
                <div className="space-y-4">
                  <div className={`h-full min-h-[200px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${q.hasImage ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                    {q.imagePreview ? (
                      <>
                        <img src={q.imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80"/>
                        <button onClick={()=>{updateQuestion(idx, 'imagePreview', null); updateQuestion(idx, 'hasImage', false);}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg z-10 hover:scale-110"><Trash2 size={16}/></button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon size={40} className="mx-auto text-slate-300 mb-2"/>
                        <p className="text-xs font-bold text-slate-400 uppercase">Tarik Gambar / Klik Upload</p>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>{updateQuestion(idx, 'hasImage', true); handleImageUpload(idx, e.target.files[0]);}}/>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Tombol Tambah Soal */}
          <button onClick={addQuestionSlot} className="w-full py-6 border-4 border-dashed border-slate-300 rounded-[2.5rem] text-slate-400 font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-3">
            <Plus size={24}/> Tambah Baris Soal Baru
          </button>
        </div>
      </div>
    );
  }

  // ================= VIEW: DASHBOARD (MENU UTAMA) =================
  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* Header Smart Class */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3.5rem] border shadow-xl gap-8">
        <div>
          <h2 className="text-4xl font-black uppercase text-slate-800 tracking-tighter">Smart Classroom</h2>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest">Manajemen Materi & Kuis Interaktif</p>
        </div>
        
        <div className="flex gap-4">
          <button onClick={startNewQuiz} className="bg-blue-600 text-white px-8 py-5 rounded-[2.5rem] font-black uppercase shadow-xl flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95">
            <Plus size={20}/> Buat Set Soal
          </button>
          
          {activeQuiz ? (
            <button onClick={()=>{setCurrentSlide(-1); setMode('projector');}} className="bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] font-black uppercase shadow-xl flex items-center gap-3 hover:bg-black transition-all active:scale-95 animate-pulse">
              <MonitorPlay size={20}/> Mulai Proyektor
            </button>
          ) : (
            <button disabled className="bg-gray-100 text-gray-400 px-8 py-5 rounded-[2.5rem] font-black uppercase cursor-not-allowed flex items-center gap-3">
              <MonitorPlay size={20}/> Belum Ada Kuis
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* PANEL MATERI */}
        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 h-fit">
          <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><FileText className="text-blue-600"/> Materi Ajar</h3>
          <div className="flex gap-4 mb-8">
            <button onClick={()=>addMaterial('file')} className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-[2rem] font-black text-xs uppercase hover:bg-blue-600 hover:text-white transition-all flex justify-center gap-2"><UploadCloud size={16}/> File</button>
            <button onClick={()=>addMaterial('link')} className="flex-1 py-4 bg-purple-50 text-purple-600 rounded-[2rem] font-black text-xs uppercase hover:bg-purple-600 hover:text-white transition-all flex justify-center gap-2"><LinkIcon size={16}/> Link</button>
          </div>
          <div className="space-y-4">
            {materials.map((m, i) => (
              <div key={i} className="flex items-center gap-4 p-5 border-2 border-slate-50 rounded-[2rem] hover:border-blue-200 transition-all cursor-pointer group">
                <div className="p-4 bg-slate-100 rounded-2xl">{m.type==='link'?<LinkIcon size={20}/>:<FileText size={20}/>}</div>
                <div className="flex-1 overflow-hidden"><h4 className="font-black text-sm uppercase truncate">{m.title}</h4><p className="text-[10px] text-slate-400 truncate">{m.content}</p></div>
                <button className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"><Trash2 size={20}/></button>
              </div>
            ))}
            {materials.length===0 && <div className="text-center py-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-bold">Materi Kosong</div>}
          </div>
        </div>

        {/* PANEL STATUS KUIS */}
        <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden h-fit">
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase mb-2 flex items-center gap-3"><QrCode className="text-yellow-400"/> Status Kuis</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">Kuis yang siap ditampilkan</p>
            
            {activeQuiz ? (
              <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                <h4 className="text-3xl font-black uppercase mb-2">{activeQuiz.title}</h4>
                <div className="flex gap-4 mt-6">
                  <div className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold uppercase">{activeQuiz.questions.length} Soal</div>
                  <div className="bg-green-600 px-4 py-2 rounded-xl text-xs font-bold uppercase">Ready</div>
                </div>
                <button onClick={startNewQuiz} className="mt-8 w-full py-4 bg-white/5 border border-white/20 rounded-2xl font-bold text-xs uppercase hover:bg-white hover:text-black transition-all">Edit / Buat Baru</button>
              </div>
            ) : (
              <div className="text-center py-12 border-4 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 font-bold">
                Belum ada kuis aktif.<br/>Klik "Buat Set Soal" diatas.
              </div>
            )}
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 p-10"><MonitorPlay size={200}/></div>
        </div>

      </div>
    </div>
  );
}