// src/pages/student/StudentModuleView.jsx
import React, { useState, useEffect, useReducer } from 'react';
import { db } from '../../firebase';
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
  ArrowLeft, Clock, FileText, CheckCircle, Eye, 
  Link as LinkIcon, HelpCircle, Trash2, X, Send, 
  Download, BookOpen, Hash, Tag, File, Upload, Menu, User
} from 'lucide-react';
import { uploadElearningFile } from '../../services/uploadService';
import SidebarSiswa from '../../components/SidebarSiswa';

const ALLOWED_FILE_TYPES = {
  all: { label: 'Semua File', accept: '*/*' },
  pdf: { label: 'PDF', accept: '.pdf,application/pdf' },
  image: { label: 'Gambar', accept: 'image/*' },
  word: { label: 'Word/DOCX', accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

const formatDate = (ts) => {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const formatFileSize = (b) => {
  if (!b) return '0 B';
  if (b<1024) return b+' B';
  if (b<1048576) return (b/1024).toFixed(1)+' KB';
  return (b/1048576).toFixed(1)+' MB';
};

const getTimeRemaining = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { text: '⛔ Terlewat', color: '#ef4444', expired: true };
  const h = Math.floor(diff/3600000);
  const d = Math.floor(h/24);
  if (d > 0) return { text: `⏳ ${d} hari ${h%24} jam`, color: d<=1?'#f59e0b':'#10b981', expired: false };
  return { text: `⚠️ ${h} jam`, color: '#f59e0b', expired: false };
};

const initialState = {
  modul: null, loading: true, uploading: {}, submittedTasks: {},
  quizAnswers: {}, quizSubmitted: false, textAnswers: {},
  activeTab: 'materi', previewImage: null,
  pendingFile: null, pendingBlockId: null, showPreviewModal: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODUL': return { ...state, modul: action.payload, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_UPLOADING': return { ...state, uploading: { ...state.uploading, [action.blockId]: action.value } };
    case 'SET_SUBMITTED_TASKS': return { ...state, submittedTasks: action.payload };
    case 'SET_QUIZ_ANSWERS': return { ...state, quizAnswers: { ...state.quizAnswers, [action.qId]: action.value } };
    case 'SET_QUIZ_SUBMITTED': return { ...state, quizSubmitted: action.payload };
    case 'SET_TEXT_ANSWERS': return { ...state, textAnswers: { ...state.textAnswers, [action.blockId]: action.value } };
    case 'SET_ACTIVE_TAB': return { ...state, activeTab: action.payload };
    case 'SET_PREVIEW_IMAGE': return { ...state, previewImage: action.payload };
    case 'SET_PENDING_FILE': return { ...state, pendingFile: action.file, pendingBlockId: action.blockId, showPreviewModal: true };
    case 'CLEAR_PENDING': return { ...state, pendingFile: null, pendingBlockId: null, showPreviewModal: false };
    default: return state;
  }
}

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('materi');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [studentNim, setStudentNim] = useState('');

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Ambil NIM langsung
  useEffect(() => {
    const nim = studentData?.studentId || studentData?.nim || studentData?.studentNim || 
                localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
    setStudentNim(nim);
  }, [studentData]);

  // FETCH MODUL - TANPA studentNim dependency
  useEffect(() => {
    if (!modulId) return;
    let cancelled = false;

    const fetchAll = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Ambil NIM langsung dari localStorage (real-time)
        const activeNim = studentData?.studentId || studentData?.nim || studentData?.studentNim || 
                          localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';

        const snap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (cancelled) return;
        
        if (!snap.exists()) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
        
        const data = snap.data();
        dispatch({ type: 'SET_MODUL', payload: data });

        if (activeNim) {
          const [snapTugas, snapKuis] = await Promise.all([
            getDocs(query(collection(db,"jawaban_tugas"), where("modulId","==",modulId), where("studentNim","==",activeNim))),
            getDocs(query(collection(db,"jawaban_kuis"), where("modulId","==",modulId), where("studentNim","==",activeNim)))
          ]);
          
          if (cancelled) return;
          
          const completed = {};
          snapTugas.forEach(d => { 
            const dt = d.data(); 
            completed[dt.blockId] = { docId:d.id, fileUrl:dt.fileUrl, fileName:dt.fileName||'Lihat File', textAnswer:dt.answer||dt.textAnswer||'', status:dt.status||'Pending' }; 
          });
          dispatch({ type:'SET_SUBMITTED_TASKS', payload: completed });
          if (!snapKuis.empty) dispatch({ type:'SET_QUIZ_SUBMITTED', payload: true });
        }
      } catch(e) { 
        if (!cancelled) console.error(e); 
      }
      if (!cancelled) dispatch({ type: 'SET_LOADING', payload: false });
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [modulId]);

  const handleFileChange = (e, blockId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 52428800) return alert("❌ Maks 50MB.");
    dispatch({ type:'SET_PENDING_FILE', file, blockId });
  };

  const handleConfirmUpload = async () => {
    const { pendingFile: file, pendingBlockId: blockId, modul } = state;
    if (!file || !blockId || !modul) return;
    
    dispatch({ type:'SET_UPLOADING', blockId, value: true });
    dispatch({ type:'CLEAR_PENDING' });
    
    try {
      const result = await uploadElearningFile(file, 'tugas');
      if (!result.success) throw new Error(result.error);
      
      const payload = {
        modulId, modulTitle: modul.title, blockId,
        studentNim, studentName: localStorage.getItem('studentName')||'Siswa',
        studentClass: studentData?.kelasSekolah||'',
        subject: modul.subject||modul.kodeMapel||'',
        fileUrl: result.downloadURL, filePath: result.filePath,
        fileName: file.name, fileSize: file.size, fileType: file.type,
        answer: state.textAnswers[blockId]||'',
        submittedAt: serverTimestamp(), status:'Pending'
      };

      await addDoc(collection(db,"jawaban_tugas"), payload);
      dispatch({ type:'SET_SUBMITTED_TASKS', payload: {...state.submittedTasks, [blockId]: payload} });
      alert('✅ Terupload!');
    } catch(e) { alert('❌ '+e.message); }
    dispatch({ type:'SET_UPLOADING', blockId, value: false });
  };

  const handleDeleteTask = async (blockId) => {
    if (!confirm("Tarik tugas?")) return;
    try {
      const info = state.submittedTasks[blockId];
      if (info?.docId) await deleteDoc(doc(db,"jawaban_tugas",info.docId));
      const ns = {...state.submittedTasks}; delete ns[blockId];
      dispatch({ type:'SET_SUBMITTED_TASKS', payload: ns });
      alert('✅ Ditarik');
    } catch(e) { alert('❌ '+e.message); }
  };

  const handleQuizSubmit = async () => {
    const qd = state.modul?.quizData||[];
    if (!qd.length) return alert("Tidak ada soal.");
    const un = qd.filter(q => state.quizAnswers[q.id]===undefined);
    if (un.length) return alert(`❌ ${un.length} soal belum dijawab.`);
    if (!confirm("Kirim?")) return;
    
    try {
      let correct = 0;
      qd.forEach(q => { if (state.quizAnswers[q.id]===q.correctAnswer) correct++; });
      const score = Math.round((correct/qd.length)*100);
      
      await addDoc(collection(db,"jawaban_kuis"), {
        modulId, modulTitle: state.modul.title, studentNim,
        studentName: localStorage.getItem('studentName')||'Siswa',
        studentClass: studentData?.kelasSekolah||'',
        subject: state.modul.subject||state.modul.kodeMapel||'',
        answers: state.quizAnswers, correctAnswers: correct, totalQuestions: qd.length, score,
        submittedAt: serverTimestamp(), status:"Dinilai"
      });
      dispatch({ type:'SET_QUIZ_SUBMITTED', payload: true });
      alert(`🎉 Nilai: ${score}\nBenar: ${correct}/${qd.length}`);
    } catch(e) { alert('❌ '+e.message); }
  };

  const renderMedia = (block) => {
    const url = block.content || block.fileUrl || block.url || block.file;
    if (!url) return null;
    const fType = block.mimeType||'';
    const isDoc = fType.includes('pdf')||fType.includes('word')||url.includes('supabase')||url.includes('.pdf')||url.includes('.doc');
    
    if (isDoc) return (
      <div className="md">
        <div className="mdh">
          <FileText size={36} color="#673ab7"/>
          <div><b>{block.fileName||'Dokumen'}</b><small>Klik unduh</small></div>
          <a href={url} target="_blank" download className="btd"><Download size={14}/> Unduh</a>
        </div>
        <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} className="mdi"/>
      </div>
    );
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)||fType.startsWith('image/')) return <img src={url} className="mi" onClick={()=>dispatch({type:'SET_PREVIEW_IMAGE',payload:url})} alt=""/>;
    if (url.includes('youtube.com')||url.includes('youtu.be')) { const vid=url.split('v=')[1]?.split('&')[0]||url.split('/').pop(); return <iframe src={`https://www.youtube.com/embed/${vid}`} className="mdi" allowFullScreen/>; }
    if (url.includes('canva.com')||url.includes('docs.google.com')) return <iframe src={url} className="mdi" allowFullScreen/>;
    return <a href={url} target="_blank" className="ml"><LinkIcon size={20}/> Buka Link ↗</a>;
  };

  if (state.loading) return (
    <div className="sw">
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={sidebarOpen} setIsOpen={setSidebarOpen}/>
      <div className="sm" style={{marginLeft:isMobile?0:'270px'}}>
        <div className="ls"><div className="sp"/><p>Memuat Modul...</p></div>
      </div>
    </div>
  );

  const tugasBlocks = (state.modul?.blocks||[]).filter(b=>b.type==='assignment');
  const materiBlocks = (state.modul?.blocks||[]).filter(b=>b.type!=='assignment');

  return (
    <div className="sw">
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={sidebarOpen} setIsOpen={setSidebarOpen}/>
      
      <div className="sm" style={{marginLeft:isMobile?0:'270px'}}>
        {isMobile && (
          <div className="mh">
            <button onClick={()=>setSidebarOpen(true)} className="mhb"><Menu size={24}/></button>
            <span className="mht">{state.modul?.title||'Modul'}</span>
            <div style={{width:24}}/>
          </div>
        )}

        <div className="cv">
          <button onClick={onBack} className="cbb"><ArrowLeft size={14}/> {!isMobile&&'Kembali'}</button>
          <img src={state.modul?.coverImage||'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000'} alt=""/>
          <div className="cvo">
            <div className="cvt">
              <span className="tp">{state.modul?.subject||'Umum'}</span>
              <span className="tg">{state.modul?.targetKategori||'Semua'} • {state.modul?.targetKelas||'Semua'}</span>
            </div>
            <h1>{state.modul?.title}</h1>
            <div className="cvm">
              <span><User size={12}/> {state.modul?.authorName||state.modul?.guruName||'Guru'}</span>
              <span>📅 {formatDate(state.modul?.createdAt)}</span>
              {studentNim && <span>🆔 {studentNim}</span>}
            </div>
          </div>
        </div>

        <div className="tb">
          <button className={`tbt ${state.activeTab==='materi'?'act':''}`} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'materi'})}>
            <BookOpen size={14}/> Materi ({materiBlocks.length})
          </button>
          {tugasBlocks.length>0 && (
            <button className={`tbt ${state.activeTab==='tugas'?'act':''}`} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'tugas'})}>
              <Send size={14}/> Tugas ({Object.keys(state.submittedTasks).length}/{tugasBlocks.length})
            </button>
          )}
          {(state.modul?.quizData||[]).length>0 && (
            <button className={`tbt ${state.activeTab==='kuis'?'act':''}`} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'kuis'})}>
              <HelpCircle size={14}/> Kuis {state.quizSubmitted?'✅':''}
            </button>
          )}
        </div>

        <div className="ct">
          {state.activeTab==='materi' && (materiBlocks.length>0 ? materiBlocks.map((b,i)=>(
            <div key={b.id||i} className="cd">
              <div className="cdt"><small>{b.type==='file'?'📁 FILE':'📄 BAGIAN '+(i+1)}</small><h3>{b.title}</h3></div>
              {b.type==='text'&&<div className="cdtx">{b.content}</div>}
              {(b.type==='video'||b.type==='file')&&renderMedia(b)}
            </div>
          )) : <div className="em">Belum ada materi</div>)}

          {state.activeTab==='tugas' && (tugasBlocks.length>0 ? tugasBlocks.map(b=>{
            const sub = state.submittedTasks[b.id];
            const expired = b.endTime && new Date(b.endTime) < new Date();
            return (
              <div key={b.id} className="cd tg">
                <div className="cdt"><small>📝 TUGAS</small><h3>{b.title}</h3></div>
                <div className="cdtx">{b.content}</div>
                {b.endTime && <div className="dl"><Clock size={14}/> {getTimeRemaining(b.endTime)?.text}</div>}
                <textarea value={state.textAnswers[b.id]||''} onChange={e=>dispatch({type:'SET_TEXT_ANSWERS',blockId:b.id,value:e.target.value})} placeholder="Tulis jawaban..." disabled={!!sub||expired} className="ta"/>
                {sub ? (
                  <div className="sb">
                    <div className="sbb"><CheckCircle size={16}/> Terkumpul</div>
                    {sub.fileUrl && <a href={sub.fileUrl} target="_blank" className="bv"><Eye size={14}/> Lihat File</a>}
                    {!expired && <button onClick={()=>handleDeleteTask(b.id)} className="bd">Tarik Data</button>}
                  </div>
                ) : expired ? <div className="ex">⛔ Deadline Terlewat</div> : (
                  <label className="ul">📎 Pilih File <input type="file" hidden onChange={e=>handleFileChange(e,b.id)} disabled={state.uploading[b.id]}/></label>
                )}
              </div>
            );
          }) : <div className="em">Tidak ada tugas</div>)}

          {state.activeTab==='kuis' && (state.modul?.quizData||[]).length>0 && (
            <div className="cd kq">
              <div className="kqh"><div className="kqi"><HelpCircle size={20} color="white"/></div><h2>Kuis Evaluasi</h2></div>
              {state.modul.quizData.map((q,qi)=>(
                <div key={q.id} className="kqi2">
                  <p className="kqq"><span className="kqn">{qi+1}</span>{q.question}</p>
                  <div className="kqo">
                    {q.options.map((opt,oi)=>(
                      <button key={oi} disabled={state.quizSubmitted} onClick={()=>dispatch({type:'SET_QUIZ_ANSWERS',qId:q.id,value:oi})} className={`kqob ${state.quizAnswers[q.id]===oi?'sel':''}`}>
                        {String.fromCharCode(65+oi)}. {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!state.quizSubmitted ? <button onClick={handleQuizSubmit} className="bkq">Kirim Jawaban</button> : <div className="kqd"><CheckCircle size={18}/> Kuis Selesai</div>}
            </div>
          )}
        </div>

        {state.previewImage && (
          <div className="po" onClick={()=>dispatch({type:'SET_PREVIEW_IMAGE',payload:null})}>
            <button className="poc" onClick={e=>{e.stopPropagation();dispatch({type:'SET_PREVIEW_IMAGE',payload:null});}}><X size={24}/></button>
            <img src={state.previewImage} alt="" onClick={e=>e.stopPropagation()}/>
          </div>
        )}

        {state.showPreviewModal && state.pendingFile && (
          <div className="po" style={{background:'rgba(0,0,0,0.7)'}}>
            <div className="puc">
              <div className="puch"><h4>📎 Preview</h4><button onClick={()=>dispatch({type:'CLEAR_PENDING'})}><X size={20}/></button></div>
              <div className="pucb">
                <div className="pui"><FileText size={24}/><div><b>{state.pendingFile.name}</b><small>{formatFileSize(state.pendingFile.size)}</small></div></div>
                {state.pendingFile.type?.startsWith('image/') ? <img src={URL.createObjectURL(state.pendingFile)} className="pui2" alt=""/> :
                 state.pendingFile.type==='application/pdf' ? <embed src={URL.createObjectURL(state.pendingFile)} className="pue"/> :
                 <div className="puf"><File size={48}/><p>File siap upload</p></div>}
                <div className="pua">
                  <button onClick={()=>dispatch({type:'CLEAR_PENDING'})} className="bc" disabled={state.uploading[state.pendingBlockId]}>Batal</button>
                  <button onClick={handleConfirmUpload} disabled={state.uploading[state.pendingBlockId]} className="bs">
                    {state.uploading[state.pendingBlockId]?'Uploading...':<><Upload size={16}/> Upload</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .sw{display:flex;min-height:100vh;background:#f8fafc}
        .sm{flex:1;min-height:100vh;transition:margin-left .3s;overflow-x:hidden;padding-bottom:40px}
        .mh{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border-bottom:1px solid #e2e8f0;position:sticky;top:0;z-index:50}
        .mhb{background:0;border:0;cursor:pointer;padding:4px}
        .mht{font-size:14px;font-weight:700;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%}
        .ls{display:flex;flex-direction:column;align-items:center;justify-content:center;height:70vh;gap:16px;color:#64748b;font-size:13px}
        .sp{width:40px;height:40px;border:4px solid #e2e8f0;border-top:4px solid #673ab7;border-radius:50%;animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .cv{height:260px;position:relative;overflow:hidden}
        .cv img{width:100%;height:100%;object-fit:cover}
        .cvo{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(15,23,42,.95));padding:30px 5%;color:#fff}
        .cvo h1{font-size:24px;font-weight:900;margin:4px 0}
        .cvt{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
        .cvt span{padding:4px 10px;border-radius:8px;font-size:9px;font-weight:800}
        .tp{background:#673ab7}.tg{background:rgba(255,255,255,.2)}
        .cvm{display:flex;gap:12px;font-size:11px;opacity:.8;flex-wrap:wrap}
        .cbb{position:absolute;top:16px;left:16px;z-index:10;background:rgba(255,255,255,.95);border:0;padding:8px 14px;border-radius:30px;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.1);color:#1e293b;font-size:12px}
        .tb{display:flex;gap:4px;background:#fff;margin:-30px 20px 0;border-radius:12px;padding:5px;box-shadow:0 4px 12px rgba(0,0,0,.06);position:relative;z-index:5;flex-wrap:wrap}
        .tbt{flex:1;padding:10px;border:0;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;background:0;color:#64748b;display:flex;align-items:center;justify-content:center;gap:6px;min-width:80px;transition:.2s}
        .tbt.act{background:#673ab7;color:#fff}
        .ct{max-width:900px;margin:0 auto;padding:20px}
        .cd{background:#fff;padding:22px;border-radius:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.02);border:1px solid #f1f5f9}
        .cdt{margin-bottom:12px;border-left:4px solid #673ab7;padding-left:10px}
        .cdt small{font-size:9px;font-weight:800;color:#673ab7;display:block}
        .cdt h3{font-size:18px;color:#0f172a;font-weight:800;margin:2px 0 0}
        .cdtx{line-height:1.8;color:#334155;font-size:15px;white-space:pre-wrap}
        .em{text-align:center;padding:40px;color:#94a3b8}
        .tg{border-left:4px solid #f59e0b}
        .dl{padding:8px 12px;border-radius:8px;margin-bottom:12px;display:flex;align-items:center;gap:8px;font-weight:700;font-size:12px;background:#fef3c7;color:#b45309}
        .ta{width:100%;padding:10px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;font-family:inherit;resize:vertical;min-height:60px;margin-bottom:12px}
        .sb{display:flex;flex-direction:column;gap:8px}
        .sbb{color:#059669;font-weight:700;background:#dcfce7;padding:10px;border-radius:8px;display:flex;align-items:center;gap:6px;font-size:12px}
        .bv{background:#f1f5f9;color:#64748b;padding:10px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px}
        .bd{background:#fee2e2;color:#ef4444;border:0;padding:10px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer}
        .ex{color:#ef4444;font-weight:700;background:#fee2e2;padding:10px;border-radius:8px;text-align:center;font-size:12px}
        .ul{display:block;background:#f59e0b;color:#fff;padding:12px;border-radius:8px;text-align:center;font-weight:700;font-size:12px;cursor:pointer}
        .kq{border-top:4px solid #673ab7}
        .kqh{display:flex;align-items:center;gap:12px;margin-bottom:20px}
        .kqi{background:#673ab7;padding:10px;border-radius:12px}
        .kqh h2{font-size:20px}
        .kqi2{margin-bottom:18px}
        .kqq{font-size:15px;font-weight:800;color:#1e293b;display:flex;gap:10px;align-items:flex-start}
        .kqn{background:#f1f5f9;color:#673ab7;min-width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
        .kqo{display:grid;gap:6px;margin-top:10px}
        .kqob{padding:12px 16px;border-radius:10px;border:2px solid #e2e8f0;text-align:left;font-size:14px;font-weight:700;cursor:pointer;background:#f8fafc;color:#1e293b;transition:.2s}
        .kqob.sel{background:#673ab7;color:#fff;border-color:#673ab7}
        .kqob:disabled{opacity:.7;cursor:not-allowed}
        .bkq{width:100%;padding:14px;border-radius:12px;border:0;background:#673ab7;color:#fff;font-weight:800;font-size:15px;cursor:pointer;margin-top:15px}
        .kqd{text-align:center;padding:14px;background:#f0fdf4;color:#15803d;border-radius:12px;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px}
        .md{border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}
        .mdh{display:flex;align-items:center;gap:12px;padding:14px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
        .mdh b{font-size:14px;font-weight:700}.mdh small{font-size:10px;color:#94a3b8;display:block}
        .btd{background:#673ab7;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px;flex-shrink:0}
        .mdi{width:100%;height:400px;border:0}
        .mi{width:100%;max-height:500px;object-fit:contain;border-radius:12px;border:1px solid #e2e8f0;cursor:pointer}
        .ml{display:flex;align-items:center;gap:12px;padding:16px;background:#f8fafc;border-radius:12px;color:#673ab7;font-weight:700;text-decoration:none}
        .po{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer}
        .po img{max-width:95%;max-height:90vh;object-fit:contain;border-radius:12px}
        .poc{position:absolute;top:20px;right:20px;background:rgba(255,255,255,.2);color:#fff;border:0;border-radius:50%;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .puc{background:#fff;border-radius:16px;max-width:500px;width:100%;max-height:90vh;overflow:auto}
        .puch{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #e2e8f0}
        .puch h4{font-size:16px;font-weight:700}.puch button{background:0;border:0;cursor:pointer}
        .pucb{padding:20px}
        .pui{display:flex;align-items:center;gap:12px;margin-bottom:16px}
        .pui b{font-size:14px;font-weight:600;display:block}.pui small{font-size:11px;color:#94a3b8}
        .pui2{width:100%;max-height:300px;object-fit:contain;border-radius:8px}
        .pue{width:100%;height:300px;border:0;border-radius:8px}
        .puf{text-align:center;padding:40px;color:#94a3b8}
        .pua{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
        .bc{padding:8px 20px;background:#f1f5f9;border:0;border-radius:8px;font-weight:600;cursor:pointer;color:#64748b}
        .bs{padding:8px 20px;background:#10b981;border:0;border-radius:8px;font-weight:700;color:#fff;cursor:pointer;display:flex;align-items:center;gap:6px}
        .bs:disabled{opacity:.6;cursor:not-allowed}
        @media(max-width:768px){.cv{height:200px}.cvo h1{font-size:18px}.tb{margin:-20px 12px 0}.ct{padding:15px 12px}.cd{padding:18px;border-radius:14px}.cdt h3{font-size:16px}.cdtx{font-size:14px}.mdi{height:250px}}
      `}</style>
    </div>
  );
};

export default StudentModuleView;