// src/pages/student/StudentModuleView.jsx
import React, { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
  ArrowLeft, Clock, FileText, CheckCircle, Eye, 
  Link as LinkIcon, HelpCircle, Trash2, X, Send, 
  Download, BookOpen, Hash, Tag, File, Upload, User,
  AlertCircle, Lock, Shield, Zap, Award, ExternalLink
} from 'lucide-react';
import { uploadElearningFile } from '../../services/uploadService';

// ============================================================
// CONSTANTS
// ============================================================
const ALLOWED_FILE_TYPES = {
  all: { label: 'Semua File', accept: '*/*' },
  pdf: { label: 'PDF', accept: '.pdf,application/pdf' },
  image: { label: 'Gambar', accept: 'image/*' },
  word: { label: 'Word/DOCX', accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

// ============================================================
// HELPERS
// ============================================================
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

// ============================================================
// 🔥 DETEKSI JENIS LINK - UNTUK SISWA
// ============================================================
const getLinkType = (url) => {
  if (!url) return 'unknown';
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Canva
  if (url.includes('canva.com') || url.includes('canva.cn')) {
    return 'canva';
  }
  
  // Google Docs / Sheets / Slides / Drive
  if (url.includes('docs.google.com') || 
      url.includes('drive.google.com') ||
      url.includes('google.com/')) {
    return 'google';
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  // Umum
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return 'link';
  }
  
  return 'unknown';
};

// ============================================================
// 🔥 RENDER LINK - UNTUK SISWA (DENGAN CANVA & GOOGLE)
// ============================================================
const renderStudentLink = (url) => {
  if (!url) return null;
  
  const type = getLinkType(url);
  
  // YOUTUBE
  if (type === 'youtube') {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
    if (match) {
      return (
        <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000', marginTop: 8 }}>
          <iframe 
            width="100%" 
            height="300" 
            src={`https://www.youtube.com/embed/${match[1]}`} 
            frameBorder="0" 
            allowFullScreen 
            style={{ display: 'block' }}
            title="YouTube Video"
          />
        </div>
      );
    }
    return <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠️ Link YouTube tidak valid</p>;
  }
  
  // CANVA
  if (type === 'canva') {
    return (
      <div style={{ 
        borderRadius: 8, 
        overflow: 'hidden', 
        background: 'linear-gradient(135deg, #f0fdf4, #f8fafc)',
        padding: 16,
        border: '1px solid #bbf7d0',
        marginTop: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ 
            background: '#00c4cc', 
            padding: '4px 10px', 
            borderRadius: 4, 
            fontSize: 10, 
            color: 'white', 
            fontWeight: 'bold'
          }}>
            CANVA
          </div>
          <span style={{ fontSize: 11, color: '#64748b', wordBreak: 'break-all' }}>{url}</span>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#00c4cc',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 13,
            transition: '0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          <ExternalLink size={16} /> Buka di Canva
        </a>
        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
          💡 Klik tombol di atas untuk melihat desain Canva
        </p>
      </div>
    );
  }
  
  // GOOGLE DOCS
  if (type === 'google') {
    return (
      <div style={{ 
        borderRadius: 8, 
        overflow: 'hidden', 
        background: '#f8fafc',
        padding: 12,
        border: '1px solid #e2e8f0',
        marginTop: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ 
            background: '#4285f4', 
            padding: '4px 10px', 
            borderRadius: 4, 
            fontSize: 10, 
            color: 'white', 
            fontWeight: 'bold'
          }}>
            GOOGLE
          </div>
          <span style={{ fontSize: 11, color: '#64748b', wordBreak: 'break-all' }}>{url}</span>
        </div>
        <iframe 
          src={url} 
          style={{ 
            width: '100%', 
            height: 400, 
            border: 'none', 
            borderRadius: 8,
            background: 'white'
          }} 
          allowFullScreen
          title="Google Docs"
        />
        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
          💡 Jika tidak muncul, klik kanan → "Buka di tab baru"
        </p>
      </div>
    );
  }
  
  // VIMEO
  if (type === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) {
      return (
        <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000', marginTop: 8 }}>
          <iframe 
            width="100%" 
            height="300" 
            src={`https://player.vimeo.com/video/${match[1]}`} 
            frameBorder="0" 
            allowFullScreen 
            style={{ display: 'block' }}
            title="Vimeo Video"
          />
        </div>
      );
    }
    return <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠️ Link Vimeo tidak valid</p>;
  }
  
  // LINK BIASA
  if (type === 'link') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        padding: 16, 
        background: '#f8fafc', 
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        marginTop: 8
      }}>
        <LinkIcon size={24} color="#3b82f6" />
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            color: '#3b82f6', 
            fontWeight: 600, 
            textDecoration: 'none',
            wordBreak: 'break-all'
          }}
        >
          {url}
        </a>
      </div>
    );
  }
  
  return null;
};

// ============================================================
// REDUCER
// ============================================================
const initialState = {
  modul: null, loading: true, error: null, hasAccess: false,
  uploading: {}, submittedTasks: {},
  quizAnswers: {}, quizSubmitted: false, quizScore: null,
  textAnswers: {}, activeTab: 'materi', previewImage: null,
  pendingFile: null, pendingBlockId: null, showPreviewModal: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODUL': return { ...state, modul: action.payload, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
    case 'SET_ACCESS': return { ...state, hasAccess: action.payload };
    case 'SET_UPLOADING': return { ...state, uploading: { ...state.uploading, [action.blockId]: action.value } };
    case 'SET_SUBMITTED_TASKS': return { ...state, submittedTasks: action.payload };
    case 'SET_QUIZ_ANSWERS': return { ...state, quizAnswers: { ...state.quizAnswers, [action.qId]: action.value } };
    case 'SET_QUIZ_SUBMITTED': return { ...state, quizSubmitted: action.payload };
    case 'SET_QUIZ_SCORE': return { ...state, quizScore: action.payload };
    case 'SET_TEXT_ANSWERS': return { ...state, textAnswers: { ...state.textAnswers, [action.blockId]: action.value } };
    case 'SET_ACTIVE_TAB': return { ...state, activeTab: action.payload };
    case 'SET_PREVIEW_IMAGE': return { ...state, previewImage: action.payload };
    case 'SET_PENDING_FILE': return { ...state, pendingFile: action.file, pendingBlockId: action.blockId, showPreviewModal: true };
    case 'CLEAR_PENDING': return { ...state, pendingFile: null, pendingBlockId: null, showPreviewModal: false };
    default: return state;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [studentNim, setStudentNim] = useState('');
  const [studentKelas, setStudentKelas] = useState('');
  const [studentProgram, setStudentProgram] = useState('');

  // ===== RESPONSIVE =====
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ===== AMBIL DATA SISWA =====
  useEffect(() => {
    const nim = studentData?.studentId || studentData?.nim || studentData?.studentNim || 
                localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
    const kelas = studentData?.kelasSekolah || localStorage.getItem('studentKelas') || '';
    const program = studentData?.kategori || studentData?.program || localStorage.getItem('studentProgram') || 'Reguler';
    
    setStudentNim(nim);
    setStudentKelas(kelas);
    setStudentProgram(program);
  }, [studentData]);

  // ===== FETCH MODUL DENGAN FILTER AKSES =====
  useEffect(() => {
    if (!modulId) return;
    let cancelled = false;

    const fetchAll = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const snap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (cancelled) return;
        
        if (!snap.exists()) {
          dispatch({ type: 'SET_ERROR', payload: 'Modul tidak ditemukan' });
          return;
        }
        
        const data = snap.data();
        
        // 🔥 CEK HAK AKSES SISWA
        const nim = studentNim || localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
        const kelas = studentKelas || localStorage.getItem('studentKelas') || '';
        const program = studentProgram || localStorage.getItem('studentProgram') || 'Reguler';
        
        let hasAccess = false;
        let accessReason = '';
        
        // 1. Cek jika modul dikirim ke siswa tertentu
        if (data.sendToSpecificStudents) {
          const studentIds = data.studentIds || [];
          const selectedStudentIds = (data.selectedStudents || []).map(s => s.studentId || s.id);
          const allTargetIds = [...studentIds, ...selectedStudentIds];
          
          hasAccess = allTargetIds.includes(nim) || allTargetIds.includes(studentData?.id);
          accessReason = hasAccess ? 'Dikirim khusus ke Anda' : 'Tidak termasuk siswa yang dipilih';
        }
        
        // 2. Cek berdasarkan kelas dan program
        if (!hasAccess) {
          const targetKelas = data.targetKelas || 'Semua';
          const targetKategori = data.targetKategori || 'Semua';
          
          const matchKelas = targetKelas === 'Semua' || targetKelas === kelas;
          const matchProgram = targetKategori === 'Semua' || targetKategori === program;
          
          hasAccess = matchKelas && matchProgram;
          accessReason = hasAccess ? 
            `Kelas ${kelas} & Program ${program} cocok` : 
            `Target: ${targetKelas} | ${targetKategori}, Anda: ${kelas} | ${program}`;
        }
        
        // 3. Cek jika modul adalah milik guru (akses untuk semua)
        if (!hasAccess && !data.sendToSpecificStudents) {
          const targetKelas = data.targetKelas || 'Semua';
          const targetKategori = data.targetKategori || 'Semua';
          
          const matchKelas = targetKelas === 'Semua' || targetKelas === kelas;
          const matchProgram = targetKategori === 'Semua' || targetKategori === program;
          
          hasAccess = matchKelas && matchProgram;
        }
        
        // 🔥 JIKA TIDAK PUNYA AKSES
        if (!hasAccess) {
          console.log('❌ Akses ditolak:', accessReason);
          dispatch({ type: 'SET_ERROR', payload: 'Anda tidak memiliki akses ke modul ini. ' + accessReason });
          dispatch({ type: 'SET_ACCESS', payload: false });
          return;
        }
        
        // ✅ SISWA PUNYA AKSES
        dispatch({ type: 'SET_ACCESS', payload: true });
        dispatch({ type: 'SET_MODUL', payload: data });

        // Ambil data tugas & kuis yang sudah dikerjakan
        if (nim) {
          const [snapTugas, snapKuis] = await Promise.all([
            getDocs(query(collection(db,"jawaban_tugas"), where("modulId","==",modulId), where("studentNim","==",nim))),
            getDocs(query(collection(db,"jawaban_kuis"), where("modulId","==",modulId), where("studentNim","==",nim)))
          ]);
          
          if (cancelled) return;
          
          const completed = {};
          snapTugas.forEach(d => { 
            const dt = d.data(); 
            completed[dt.blockId] = { 
              docId:d.id, 
              fileUrl:dt.fileUrl, 
              fileName:dt.fileName||'Lihat File', 
              textAnswer:dt.answer||dt.textAnswer||'', 
              status:dt.status||'Pending' 
            }; 
          });
          dispatch({ type:'SET_SUBMITTED_TASKS', payload: completed });
          
          if (!snapKuis.empty) {
            dispatch({ type:'SET_QUIZ_SUBMITTED', payload: true });
            const kuisData = snapKuis.docs[0].data();
            dispatch({ type:'SET_QUIZ_SCORE', payload: kuisData.score || 0 });
          }
        }
        
      } catch(e) { 
        if (!cancelled) {
          console.error(e);
          dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat modul: ' + e.message });
        }
      }
      if (!cancelled) dispatch({ type: 'SET_LOADING', payload: false });
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [modulId, studentNim, studentKelas, studentProgram]);

  // ===== UPLOAD HANDLER =====
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
        modulId, 
        modulTitle: modul.title, 
        blockId,
        studentNim, 
        studentName: localStorage.getItem('studentName')||'Siswa',
        studentClass: studentKelas || '',
        subject: modul.subject||modul.kodeMapel||'',
        fileUrl: result.downloadURL, 
        filePath: result.filePath,
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        answer: state.textAnswers[blockId]||'',
        submittedAt: serverTimestamp(), 
        status:'Pending'
      };

      await addDoc(collection(db,"jawaban_tugas"), payload);
      dispatch({ type:'SET_SUBMITTED_TASKS', payload: {...state.submittedTasks, [blockId]: payload} });
      alert('✅ Tugas berhasil diupload!');
    } catch(e) { alert('❌ '+e.message); }
    dispatch({ type:'SET_UPLOADING', blockId, value: false });
  };

  const handleDeleteTask = async (blockId) => {
    if (!confirm("Yakin ingin menarik tugas ini?")) return;
    try {
      const info = state.submittedTasks[blockId];
      if (info?.docId) await deleteDoc(doc(db,"jawaban_tugas",info.docId));
      const ns = {...state.submittedTasks}; delete ns[blockId];
      dispatch({ type:'SET_SUBMITTED_TASKS', payload: ns });
      alert('✅ Tugas berhasil ditarik');
    } catch(e) { alert('❌ '+e.message); }
  };

  // ============================================================
  // 🔥 RENDER MEDIA - DENGAN DUKUNGAN CANVA & GOOGLE DOCS
  // ============================================================
  const renderMedia = (block) => {
    const url = block.content || block.fileUrl || block.url || block.file;
    if (!url) return null;
    const fType = block.mimeType || '';
    
    // 🔥 CEK APAKAH INI LINK (bukan file)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const linkType = getLinkType(url);
      if (linkType !== 'unknown') {
        return renderStudentLink(url);
      }
    }
    
    // FILE: PDF
    const isDoc = fType.includes('pdf') || fType.includes('word') || url.includes('supabase') || url.includes('.pdf') || url.includes('.doc');
    if (isDoc) {
      return (
        <div className="md">
          <div className="mdh">
            <FileText size={36} color="#673ab7"/>
            <div><b>{block.fileName||'Dokumen'}</b><small>Klik unduh</small></div>
            <a href={url} target="_blank" download className="btd"><Download size={14}/> Unduh</a>
          </div>
          <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} className="mdi"/>
        </div>
      );
    }
    
    // FILE: Gambar
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fType.startsWith('image/')) {
      return <img src={url} className="mi" onClick={()=>dispatch({type:'SET_PREVIEW_IMAGE',payload:url})} alt=""/>;
    }
    
    // FILE: Lainnya
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f8fafc', borderRadius: 8, marginTop: 8 }}>
        <FileText size={32} color="#3b82f6" />
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
          📎 {block.fileName || 'Buka File'}
        </a>
      </div>
    );
  };

  // ===== LOADING =====
  if (state.loading) return (
    <div className="ls"><div className="sp"/><p>Memuat Modul...</p></div>
  );

  // ===== ERROR / NO ACCESS =====
  if (state.error || !state.hasAccess) {
    return (
      <div className="no-access">
        <div className="no-access-icon"><Lock size={48} color="#94a3b8" /></div>
        <h2>Akses Ditolak</h2>
        <p>{state.error || 'Anda tidak memiliki akses ke modul ini'}</p>
        <button onClick={onBack} className="cbb" style={{position:'relative',top:0,left:0}}>
          <ArrowLeft size={14}/> Kembali
        </button>
      </div>
    );
  }

  const tugasBlocks = (state.modul?.blocks||[]).filter(b=>b.type==='assignment');
  const materiBlocks = (state.modul?.blocks||[]).filter(b=>b.type!=='assignment');
  const hasQuiz = (state.modul?.quizData||[]).length > 0;
  const quizSubmitted = state.quizSubmitted;
  const quizScore = state.quizScore;

  // ===== RENDER UTAMA =====
  return (
    <>
      {/* COVER */}
      <div className="cv">
        <button onClick={onBack} className="cbb"><ArrowLeft size={14}/> {!isMobile&&'Kembali'}</button>
        <img src={state.modul?.coverImage||'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000'} alt=""/>
        <div className="cvo">
          <div className="cvt">
            <span className="tp">{state.modul?.subject||'Umum'}</span>
            <span className="tg">{state.modul?.targetKategori||'Semua'} • {state.modul?.targetKelas||'Semua'}</span>
            {state.modul?.sendToSpecificStudents && (
              <span className="ts">🔒 Khusus</span>
            )}
          </div>
          <h1>{state.modul?.title}</h1>
          <div className="cvm">
            <span><User size={12}/> {state.modul?.authorName||state.modul?.guruName||'Guru'}</span>
            <span>📅 {formatDate(state.modul?.createdAt)}</span>
            {studentNim && <span>🆔 {studentNim}</span>}
            {studentKelas && <span>🎓 {studentKelas}</span>}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tb">
        <button className={`tbt ${state.activeTab==='materi'?'act':''}`} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'materi'})}>
          <BookOpen size={14}/> Materi ({materiBlocks.length})
        </button>
        {tugasBlocks.length>0 && (
          <button className={`tbt ${state.activeTab==='tugas'?'act':''}`} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'tugas'})}>
            <Send size={14}/> Tugas ({Object.keys(state.submittedTasks).length}/{tugasBlocks.length})
          </button>
        )}
        {hasQuiz && (
          <button className={`tbt ${state.activeTab==='kuis'?'act':''}`} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'kuis'})}>
            <HelpCircle size={14}/> Kuis {quizSubmitted ? '✅' : ''}
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="ct">
        {/* MATERI */}
        {state.activeTab==='materi' && (materiBlocks.length>0 ? materiBlocks.map((b,i)=>(
          <div key={b.id||i} className="cd">
            <div className="cdt"><small>{b.type==='file'?'📁 FILE':'📄 BAGIAN '+(i+1)}</small><h3>{b.title}</h3></div>
            {b.type==='text'&&<div className="cdtx">{b.content}</div>}
            {(b.type==='video'||b.type==='file')&&renderMedia(b)}
          </div>
        )) : <div className="em">Belum ada materi</div>)}

        {/* TUGAS */}
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

        {/* ============================================================
            🔥 KUIS - TAMPILAN BARU DENGAN TOMBOL KERJAKAN
            ============================================================ */}
        {state.activeTab==='kuis' && hasQuiz && (
          <div className="cd kq">
            <div className="kqh">
              <div className="kqi"><HelpCircle size={20} color="white"/></div>
              <h2>Kuis Evaluasi</h2>
            </div>
            
            {/* Info Kuis */}
            <div style={styles.quizInfo}>
              <div style={styles.quizInfoItem}>
                <BookOpen size={14} color="#3b82f6" />
                <span>{state.modul.quizData.length} Soal</span>
              </div>
              {state.modul.timeLimit > 0 && (
                <div style={styles.quizInfoItem}>
                  <Clock size={14} color="#f59e0b" />
                  <span>{state.modul.timeLimit} Menit</span>
                </div>
              )}
              {state.modul.maxAttempts > 1 && (
                <div style={styles.quizInfoItem}>
                  <Zap size={14} color="#8b5cf6" />
                  <span>Maks {state.modul.maxAttempts}x</span>
                </div>
              )}
              {state.modul.difficulty && (
                <div style={styles.quizInfoItem}>
                  <Award size={14} color="#10b981" />
                  <span>Tingkat {state.modul.difficulty}</span>
                </div>
              )}
              {quizSubmitted && (
                <div style={{...styles.quizInfoItem, background: '#dcfce7', borderColor: '#10b981'}}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>Nilai: {quizScore || 0}</span>
                </div>
              )}
            </div>

            {/* 🔥 TOMBOL KERJAKAN KUIS */}
            {!quizSubmitted ? (
              <div style={styles.quizAction}>
                <button 
                  onClick={() => navigate(`/siswa/kuis/${modulId}`)}
                  style={styles.btnStartQuiz}
                >
                  <Zap size={20} /> Mulai Kuis
                </button>
                <p style={styles.quizHint}>
                  ⚡ Klik tombol di atas untuk memulai kuis. 
                  {state.modul.timeLimit > 0 && ` Waktu: ${state.modul.timeLimit} menit.`}
                  {state.modul.maxAttempts > 1 && ` Bisa dikerjakan ${state.modul.maxAttempts} kali.`}
                </p>
              </div>
            ) : (
              <div className="kqd">
                <CheckCircle size={18} color="#10b981" />
                Kuis Selesai 
                {quizScore !== null && <span style={{ fontWeight: 900, marginLeft: 8 }}>• Nilai: {quizScore}</span>}
                <button 
                  onClick={() => navigate(`/siswa/kuis/${modulId}`)}
                  style={{
                    marginLeft: 12,
                    padding: '6px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 11
                  }}
                >
                  Lihat Detail
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PREVIEW IMAGE */}
      {state.previewImage && (
        <div className="po" onClick={()=>dispatch({type:'SET_PREVIEW_IMAGE',payload:null})}>
          <button className="poc" onClick={e=>{e.stopPropagation();dispatch({type:'SET_PREVIEW_IMAGE',payload:null});}}><X size={24}/></button>
          <img src={state.previewImage} alt="" onClick={e=>e.stopPropagation()}/>
        </div>
      )}

      {/* UPLOAD PREVIEW */}
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

      {/* CSS */}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .ls{display:flex;flex-direction:column;align-items:center;justify-content:center;height:70vh;gap:16px;color:#64748b;font-size:13px}
        .sp{width:40px;height:40px;border:4px solid #e2e8f0;border-top:4px solid #673ab7;border-radius:50%;animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        
        .no-access{display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;padding:20px;text-align:center}
        .no-access-icon{width:80px;height:80px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .no-access h2{font-size:24px;font-weight:800;color:#1e293b;margin:0}
        .no-access p{color:#64748b;font-size:13px;margin:8px 0 20px}
        
        .cv{height:260px;position:relative;overflow:hidden}
        .cv img{width:100%;height:100%;object-fit:cover}
        .cvo{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(15,23,42,.95));padding:30px 5%;color:#fff}
        .cvo h1{font-size:24px;font-weight:900;margin:4px 0}
        .cvt{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
        .cvt span{padding:4px 10px;border-radius:8px;font-size:9px;font-weight:800}
        .tp{background:#673ab7}.tg{background:rgba(255,255,255,.2)}.ts{background:#f59e0b;color:#1e293b}
        .cvm{display:flex;gap:12px;font-size:11px;opacity:.8;flex-wrap:wrap}
        .cbb{background:rgba(255,255,255,.95);border:0;padding:8px 14px;border-radius:30px;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.1);color:#1e293b;font-size:12px}
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
        .kqd{text-align:center;padding:14px;background:#f0fdf4;color:#15803d;border-radius:12px;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}
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
    </>
  );
};

// ============================================================
// STYLES TAMBAHAN
// ============================================================
const styles = {
  quizInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  quizInfoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 12,
    color: '#1e293b',
    fontWeight: 600
  },
  quizAction: {
    textAlign: 'center',
    padding: '20px 0'
  },
  btnStartQuiz: {
    padding: '14px 40px',
    background: 'linear-gradient(135deg, #673ab7, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 18,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 4px 20px rgba(103,58,183,0.35)',
    transition: 'transform 0.2s'
  },
  quizHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12
  }
};

export default StudentModuleView;