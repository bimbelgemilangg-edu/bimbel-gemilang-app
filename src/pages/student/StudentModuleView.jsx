// src/pages/student/StudentModuleView.jsx
import React, { useState, useEffect, useReducer } from 'react';
import { db } from '../../firebase';
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
  ArrowLeft, Clock, FileText, CheckCircle, 
  Eye, Link as LinkIcon, HelpCircle,
  Trash2, X, Send, Calendar, Download, BookOpen, 
  Hash, Tag, File, Image as ImageIcon, Upload, Menu
} from 'lucide-react';
import { uploadElearningFile } from '../../services/uploadService';
import SidebarSiswa from '../../components/SidebarSiswa';

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
// HELPER
// ============================================================
const formatDate = (ts) => {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const getTimeRemaining = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { text: '⛔ Terlewat', color: '#ef4444', expired: true };
  const h = Math.floor(diff/3600000);
  const d = Math.floor(h/24);
  if (d > 0) return { text: `⏳ ${d}h ${h%24}j`, color: d<=1?'#f59e0b':'#10b981', expired: false };
  return { text: `⚠️ ${h}j`, color: '#f59e0b', expired: false };
};

const formatFileSize = (b) => {
  if (!b) return '0 B';
  if (b<1024) return b+' B';
  if (b<1048576) return (b/1024).toFixed(1)+' KB';
  return (b/1048576).toFixed(1)+' MB';
};

// ============================================================
// STATE REDUCER
// ============================================================
const initialState = {
  modul: null,
  loading: true,
  uploading: {},
  submittedTasks: {},
  quizAnswers: {},
  quizSubmitted: false,
  textAnswers: {},
  activeTab: 'materi',
  previewImage: null,
  isTugasExpired: false,
  isQuizExpired: false,
  pendingFile: null,
  pendingBlockId: null,
  showPreviewModal: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODUL':
      return { ...state, modul: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_UPLOADING':
      return { ...state, uploading: { ...state.uploading, [action.blockId]: action.value } };
    case 'SET_SUBMITTED_TASKS':
      return { ...state, submittedTasks: action.payload };
    case 'SET_QUIZ_ANSWERS':
      return { ...state, quizAnswers: { ...state.quizAnswers, [action.qId]: action.value } };
    case 'SET_QUIZ_SUBMITTED':
      return { ...state, quizSubmitted: action.payload };
    case 'SET_TEXT_ANSWERS':
      return { ...state, textAnswers: { ...state.textAnswers, [action.blockId]: action.value } };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_PREVIEW_IMAGE':
      return { ...state, previewImage: action.payload };
    case 'SET_TUGAS_EXPIRED':
      return { ...state, isTugasExpired: action.payload };
    case 'SET_QUIZ_EXPIRED':
      return { ...state, isQuizExpired: action.payload };
    case 'SET_PENDING_FILE':
      return { ...state, pendingFile: action.file, pendingBlockId: action.blockId, showPreviewModal: true };
    case 'CLEAR_PENDING':
      return { ...state, pendingFile: null, pendingBlockId: null, showPreviewModal: false };
    default:
      return state;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('materi');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [studentId, setStudentId] = useState(null);
  const [studentNim, setStudentNim] = useState('');

  // ===== RESPONSIVE =====
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ===== STUDENT DATA =====
  useEffect(() => {
    const sId = studentData?.uid || studentData?.id || localStorage.getItem('studentId');
    const sNim = studentData?.studentId || studentData?.nim || studentData?.studentNim || 
                 localStorage.getItem('studentNim') || localStorage.getItem('studentId');
    setStudentId(sId);
    setStudentNim(sNim);
  }, [studentData]);

  // ===== FETCH MODUL - SOLUSI ANTI MACET =====
  useEffect(() => {
    if (!modulId) return;

    const fetchModul = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // 🔥 Ambil NIM langsung dari localStorage (real-time, tanpa tunggu state React)
        const activeNim = studentData?.studentId || studentData?.nim || studentData?.studentNim || 
                          localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';

        const snap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (!snap.exists()) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return console.error('Modul tidak ditemukan');
        }
        
        const data = snap.data();
        dispatch({ type: 'SET_MODUL', payload: data });

        // Cek deadline
        const now = new Date();
        const assignBlock = (data.blocks || []).find(b => b.type === 'assignment' && b.endTime);
        if (assignBlock?.endTime) dispatch({ type: 'SET_TUGAS_EXPIRED', payload: now > new Date(assignBlock.endTime) });
        if (data.deadlineQuiz) dispatch({ type: 'SET_QUIZ_EXPIRED', payload: now > new Date(data.deadlineQuiz) });

        // 🔥 Jalankan query Firestore HANYA jika NIM tersedia
        if (activeNim) {
          // Cek tugas
          const q = query(collection(db, "jawaban_tugas"), where("modulId", "==", modulId), where("studentNim", "==", activeNim));
          const snapSub = await getDocs(q);
          const completed = {};
          snapSub.forEach(d => { 
            const dt = d.data(); 
            completed[dt.blockId] = { 
              docId: d.id, 
              fileUrl: dt.fileUrl, 
              fileName: dt.fileName || 'Lihat File', 
              textAnswer: dt.answer || dt.textAnswer || '', 
              status: dt.status || 'Pending' 
            }; 
          });
          dispatch({ type: 'SET_SUBMITTED_TASKS', payload: completed });

          // Cek kuis
          const qQuiz = query(collection(db, "jawaban_kuis"), where("modulId", "==", modulId), where("studentNim", "==", activeNim));
          const snapQuiz = await getDocs(qQuiz);
          if (!snapQuiz.empty) dispatch({ type: 'SET_QUIZ_SUBMITTED', payload: true });
        }

      } catch (e) { 
        console.error("Gagal fetch modul:", e); 
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    fetchModul();
  }, [modulId]);

  // ===== HANDLERS =====
  const handleFileChange = (e, blockId) => {
    if (state.isTugasExpired) return alert("❌ Deadline terlewat.");
    const file = e.target.files[0];
    if (!file) return;
    
    const block = state.modul?.blocks?.find(b => b.id === blockId);
    const at = block?.allowedFileType || 'all';
    const allowed = ALLOWED_FILE_TYPES[at];
    
    if (allowed?.accept !== '*/*') {
      const re = new RegExp(allowed.accept.replace(/,/g,'|').replace(/\./g,'\\.').replace(/\*/g,'.*'), 'i');
      if (!re.test(file.type) && !re.test(file.name)) return alert(`❌ Hanya: ${allowed.label}`);
    }
    if (file.size > 52428800) return alert("❌ Maks 50MB.");
    
    dispatch({ type: 'SET_PENDING_FILE', file, blockId });
  };

  const handleConfirmUpload = async () => {
    const { pendingFile: file, pendingBlockId: blockId } = state;
    if (!file || !blockId) return;
    
    dispatch({ type: 'SET_UPLOADING', blockId, value: true });
    dispatch({ type: 'CLEAR_PENDING' });
    
    try {
      const result = await uploadElearningFile(file, 'tugas');
      if (!result.success) return alert('❌ ' + result.error);
      
      const payload = {
        modulId, 
        modulTitle: state.modul.title, 
        blockId,
        blockTitle: state.modul.blocks?.find(b => b.id === blockId)?.title || 'Tugas',
        studentId, 
        studentNim,
        studentName: studentData?.nama || localStorage.getItem('studentName') || 'Siswa',
        studentClass: studentData?.kelasSekolah || 'Umum',
        guruId: state.modul.guruId || '',
        fileUrl: result.downloadURL, 
        filePath: result.filePath,
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        answer: state.textAnswers[blockId] || '',
        submittedAt: serverTimestamp(), 
        status: 'Pending', 
        type: 'assignment'
      };
      
      const docRef = await addDoc(collection(db, 'jawaban_tugas'), payload);
      dispatch({ type: 'SET_SUBMITTED_TASKS', payload: {
        ...state.submittedTasks, 
        [blockId]: { 
          docId: docRef.id, 
          fileUrl: result.downloadURL, 
          fileName: file.name, 
          textAnswer: state.textAnswers[blockId] || '', 
          status: 'Pending' 
        }
      }});
      alert('✅ Terupload!');
    } catch (e) { 
      alert('❌ ' + e.message); 
    }
    dispatch({ type: 'SET_UPLOADING', blockId, value: false });
  };

  const handleDeleteTask = async (blockId) => {
    if (state.isTugasExpired) return alert("❌ Tidak bisa menarik.");
    if (!confirm("Tarik?")) return;
    try {
      const info = state.submittedTasks[blockId];
      if (info?.docId) await deleteDoc(doc(db, "jawaban_tugas", info.docId));
      const ns = { ...state.submittedTasks }; 
      delete ns[blockId];
      dispatch({ type: 'SET_SUBMITTED_TASKS', payload: ns });
      alert('✅ Ditarik');
    } catch (e) { 
      alert('❌ ' + e.message); 
    }
  };

  const handleQuizSubmit = async () => {
    if (state.isQuizExpired) return alert("❌ Kuis ditutup.");
    const qd = state.modul?.quizData || [];
    if (!qd.length) return alert("Tidak ada soal.");
    const un = qd.filter(q => state.quizAnswers[q.id] === undefined);
    if (un.length) return alert(`❌ ${un.length} soal belum dijawab.`);
    if (!confirm("Kirim?")) return;
    
    try {
      let correct = 0;
      qd.forEach(q => { if (state.quizAnswers[q.id] === q.correctAnswer) correct++; });
      const score = Math.round((correct / qd.length) * 100);
      
      await addDoc(collection(db, "jawaban_kuis"), {
        modulId, 
        modulTitle: state.modul.title, 
        studentId, 
        studentNim,
        studentName: studentData?.nama || localStorage.getItem('studentName') || 'Siswa',
        studentClass: studentData?.kelasSekolah || 'Umum',
        guruId: state.modul.guruId || '',
        answers: state.quizAnswers, 
        correctAnswers: correct, 
        totalQuestions: qd.length, 
        score,
        submittedAt: serverTimestamp(), 
        status: "Dinilai", 
        gradedAt: serverTimestamp(), 
        type: "quiz"
      });
      dispatch({ type: 'SET_QUIZ_SUBMITTED', payload: true });
      alert(`🎉 Nilai: ${score}\nBenar: ${correct}/${qd.length}`);
    } catch (e) { 
      alert('❌ ' + e.message); 
    }
  };

  // ===== RENDER MEDIA =====
  const renderMedia = (block) => {
    const url = block.content || block.fileUrl || block.url || block.file;
    if (!url) return null;
    
    const fType = block.mimeType || '';
    const isDoc = fType.includes('pdf') || fType.includes('word') || url.includes('supabase') || url.includes('.pdf') || url.includes('.doc');
    
    if (isDoc) {
      return (
        <div className="media-doc">
          <div className="media-doc-header">
            <FileText size={36} color="#673ab7" />
            <div><b>{block.fileName || 'Dokumen'}</b><small>Klik unduh</small></div>
            <a href={url} target="_blank" download className="btn-download"><Download size={14}/> Unduh</a>
          </div>
          <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} className="media-iframe"></iframe>
        </div>
      );
    }
    
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fType.startsWith('image/')) {
      return <img src={url} className="media-image" onClick={() => dispatch({ type: 'SET_PREVIEW_IMAGE', payload: url })} alt="" />;
    }
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const vid = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return <iframe src={`https://www.youtube.com/embed/${vid}`} className="media-iframe" allowFullScreen />;
    }
    
    if (url.includes('canva.com') || url.includes('docs.google.com')) {
      return <iframe src={url} className="media-iframe" allowFullScreen />;
    }
    
    return <a href={url} target="_blank" className="media-link"><LinkIcon size={20}/> Buka Link ↗</a>;
  };

  // ===== LOADING =====
  if (state.loading) {
    return (
      <div className="student-wrapper">
        <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="student-main">
          <div className="loading-spin"><div className="spinner" /><p>Membuka Modul...</p></div>
        </div>
      </div>
    );
  }

  const tugasBlocks = (state.modul?.blocks || []).filter(b => b.type === 'assignment');
  const materiBlocks = (state.modul?.blocks || []).filter(b => b.type !== 'assignment');

  return (
    <div className="student-wrapper">
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="student-main">
        {/* MOBILE HEADER */}
        <div className="mobile-header">
          <button onClick={() => setSidebarOpen(true)} className="hamburger-btn"><Menu size={24}/></button>
          <span className="mobile-title">{state.modul?.title || 'Modul'}</span>
          <div style={{ width: 24 }} />
        </div>

        {/* COVER */}
        <div className="cover-section">
          <button onClick={onBack} className="back-btn"><ArrowLeft size={14}/> {!isMobile && 'Kembali'}</button>
          <img src={state.modul?.coverImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000'} alt="" />
          <div className="cover-overlay">
            <div className="cover-tags">
              <span className="tag-purple">{state.modul?.subject || 'Umum'}</span>
              <span className="tag-glass">{state.modul?.targetKategori || 'Semua'} • {state.modul?.targetKelas || 'Semua'}</span>
              {state.modul?.guruId && <span className="tag-blue"><Hash size={8}/> {state.modul.guruId}</span>}
            </div>
            <h1>{state.modul?.title}</h1>
            <div className="cover-meta">
              <span>👤 {state.modul?.authorName || state.modul?.guruName || 'Guru'}</span>
              <span>📅 {formatDate(state.modul?.createdAt)}</span>
              {studentNim && <span>🆔 {studentNim}</span>}
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="tab-nav">
          <button className={`tab-btn ${state.activeTab === 'materi' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'materi' })}>
            <BookOpen size={14}/> Materi ({materiBlocks.length})
          </button>
          {tugasBlocks.length > 0 && (
            <button className={`tab-btn ${state.activeTab === 'tugas' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'tugas' })}>
              <Send size={14}/> Tugas ({Object.keys(state.submittedTasks).length}/{tugasBlocks.length})
            </button>
          )}
          {state.modul?.quizData?.length > 0 && (
            <button className={`tab-btn ${state.activeTab === 'kuis' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'kuis' })}>
              <HelpCircle size={14}/> Kuis {state.quizSubmitted ? '✅' : ''}
            </button>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="content-area">
          {/* MATERI */}
          {state.activeTab === 'materi' && materiBlocks.map((block, idx) => (
            <div key={block.id} className="block-card">
              <div className="block-title">
                <small>{block.type === 'file' ? '📁 FILE' : block.type === 'video' ? '🔗 LINK' : `📄 BAGIAN ${idx+1}`}</small>
                <h3>{block.title}</h3>
              </div>
              {block.type === 'text' && <div className="block-text">{block.content}</div>}
              {(block.type === 'video' || block.type === 'file') && renderMedia(block)}
            </div>
          ))}

          {/* TUGAS */}
          {state.activeTab === 'tugas' && tugasBlocks.map(block => {
            const tr = getTimeRemaining(block.endTime);
            const expired = state.isTugasExpired || (block.endTime && new Date(block.endTime) < new Date());
            const submitted = !!state.submittedTasks[block.id];
            const sub = state.submittedTasks[block.id];
            const ft = ALLOWED_FILE_TYPES[block.allowedFileType || 'all'] || ALLOWED_FILE_TYPES.all;
            
            return (
              <div key={block.id} className="block-card tugas-card">
                <div className="block-title">
                  <small>📝 TUGAS • {ft.label}</small>
                  <h3>{block.title}</h3>
                </div>
                <div className="block-text">{block.content}</div>
                
                {tr && <div className="deadline-badge" style={{ background: tr.color + '20', color: tr.color }}><Clock size={14}/> {tr.text}</div>}
                
                <textarea 
                  value={state.textAnswers[block.id] || ''}
                  onChange={e => dispatch({ type: 'SET_TEXT_ANSWERS', blockId: block.id, value: e.target.value })}
                  placeholder="Tulis jawaban..."
                  disabled={submitted || expired}
                  className="answer-textarea"
                />
                
                {submitted ? (
                  <div className="submitted-box">
                    <div className="submitted-badge"><CheckCircle size={16}/> Terkumpul</div>
                    {sub.textAnswer && <div className="submitted-answer"><b>Jawaban:</b> {sub.textAnswer}</div>}
                    {sub.fileUrl && <a href={sub.fileUrl} target="_blank" className="btn-view"><Eye size={14}/> Lihat File</a>}
                    {!expired && <button onClick={() => handleDeleteTask(block.id)} className="btn-delete">Tarik Data</button>}
                  </div>
                ) : expired ? (
                  <div className="expired-box">⛔ Deadline Terlewat</div>
                ) : (
                  <label className="upload-label">
                    📎 Pilih File ({ft.label})
                    <input type="file" accept={ft.accept} hidden onChange={e => handleFileChange(e, block.id)} />
                  </label>
                )}
              </div>
            );
          })}

          {/* KUIS */}
          {state.activeTab === 'kuis' && state.modul?.quizData?.length > 0 && (
            <div className="block-card quiz-card">
              <div className="quiz-header">
                <div className="quiz-icon"><HelpCircle size={20} color="white"/></div>
                <div>
                  <h2>Kuis Evaluasi</h2>
                  {state.modul.deadlineQuiz && <small style={{ color: state.isQuizExpired ? '#ef4444' : '#64748b' }}>{getTimeRemaining(state.modul.deadlineQuiz)?.text || 'Deadline: ' + formatDate(state.modul.deadlineQuiz)}</small>}
                </div>
              </div>
              {state.modul.quizData.map((q, qi) => (
                <div key={q.id} className="quiz-item">
                  <p className="quiz-question">
                    <span className="quiz-num">{qi+1}</span>
                    {q.question}
                    {q.questionImage && <img src={q.questionImage} alt="Soal" className="quiz-q-img" onClick={() => dispatch({ type: 'SET_PREVIEW_IMAGE', payload: q.questionImage })}/>}
                  </p>
                  <div className="quiz-options">
                    {q.options.map((opt, oi) => (
                      <button key={oi} disabled={state.quizSubmitted || state.isQuizExpired} onClick={() => dispatch({ type: 'SET_QUIZ_ANSWERS', qId: q.id, value: oi })}
                        className={`quiz-opt ${state.quizAnswers[q.id] === oi ? 'selected' : ''}`}>
                        {String.fromCharCode(65+oi)}. {opt}
                        {q.optionImages?.[oi] && <img src={q.optionImages[oi]} alt={`Opsi ${String.fromCharCode(65+oi)}`} className="quiz-opt-img"/>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!state.quizSubmitted && !state.isQuizExpired ? (
                <button onClick={handleQuizSubmit} className="btn-submit-quiz">Kirim Jawaban Kuis</button>
              ) : (
                <div className="quiz-done"><CheckCircle size={18}/> {state.quizSubmitted ? 'Kuis Selesai' : 'Waktu Habis'}</div>
              )}
            </div>
          )}
        </div>

        {/* PREVIEW IMAGE MODAL */}
        {state.previewImage && (
          <div className="preview-overlay" onClick={() => dispatch({ type: 'SET_PREVIEW_IMAGE', payload: null })}>
            <button className="preview-close" onClick={e => { e.stopPropagation(); dispatch({ type: 'SET_PREVIEW_IMAGE', payload: null }); }}><X size={24}/></button>
            <img src={state.previewImage} alt="Preview" onClick={e => e.stopPropagation()}/>
          </div>
        )}

        {/* PREVIEW UPLOAD MODAL */}
        {state.showPreviewModal && state.pendingFile && (
          <div className="preview-upload-overlay">
            <div className="preview-upload-card">
              <div className="preview-upload-header">
                <h4>📎 Preview File</h4>
                <button onClick={() => dispatch({ type: 'CLEAR_PENDING' })}><X size={20}/></button>
              </div>
              <div className="preview-upload-body">
                <div className="preview-upload-info">
                  <FileText size={24} color="#3b82f6"/>
                  <div><b>{state.pendingFile.name}</b><small>{formatFileSize(state.pendingFile.size)}</small></div>
                </div>
                {state.pendingFile.type?.startsWith('image/') ? (
                  <img src={URL.createObjectURL(state.pendingFile)} alt="" className="preview-upload-img"/>
                ) : state.pendingFile.type === 'application/pdf' ? (
                  <embed src={URL.createObjectURL(state.pendingFile)} type="application/pdf" className="preview-upload-embed"/>
                ) : (
                  <div className="preview-upload-fallback"><File size={48}/><p>File siap diupload</p></div>
                )}
                <div className="preview-upload-actions">
                  <button onClick={() => dispatch({ type: 'CLEAR_PENDING' })} className="btn-cancel" disabled={state.uploading[state.pendingBlockId]}>Batal</button>
                  <button onClick={handleConfirmUpload} disabled={state.uploading[state.pendingBlockId]} className="btn-confirm">
                    {state.uploading[state.pendingBlockId] ? 'Uploading...' : <><Upload size={16}/> Upload</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS */}
      <style>{`
        :root {
          --sidebar-w: 270px;
          --purple: #673ab7;
          --bg: #f8fafc;
          --card: #ffffff;
          --border: #e2e8f0;
          --text: #1e293b;
          --text2: #64748b;
          --radius: 12px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .student-wrapper {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
        }

        .student-main {
          flex: 1;
          margin-left: var(--sidebar-w);
          min-height: 100vh;
          transition: margin-left 0.3s ease;
          overflow-x: hidden;
          padding-bottom: 40px;
        }

        /* MOBILE HEADER */
        .mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .hamburger-btn { background: none; border: none; cursor: pointer; padding: 4px; }
        .mobile-title { font-size: 14px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }

        /* LOADING */
        .loading-spin { display:flex; flex-direction:column; align-items:center; justify-content:center; height:70vh; gap:16px; color:var(--text2); font-size:13px; }
        .spinner { width:40px; height:40px; border:4px solid var(--border); border-top:4px solid var(--purple); border-radius:50%; animation:spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* COVER */
        .cover-section { height: 280px; position: relative; overflow: hidden; }
        .cover-section img { width: 100%; height: 100%; object-fit: cover; }
        .cover-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(15,23,42,0.95)); padding: 35px 6%; color: white; }
        .cover-overlay h1 { font-size: 26px; font-weight: 900; margin: 4px 0; line-height: 1.2; }
        .cover-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .cover-tags span { padding: 4px 10px; border-radius: 8px; font-size: 9px; font-weight: 800; }
        .tag-purple { background: var(--purple); }
        .tag-glass { background: rgba(255,255,255,0.2); }
        .tag-blue { background: rgba(59,130,246,0.3); font-size: 8px; }
        .cover-meta { display: flex; gap: 12px; font-size: 11px; opacity: 0.8; flex-wrap: wrap; }
        .back-btn { position: absolute; top: 18px; left: 18px; z-index: 10; background: rgba(255,255,255,0.95); border: none; padding: 10px 18px; border-radius: 30px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 800; box-shadow: 0 10px 25px rgba(0,0,0,0.15); color: var(--text); font-size: 13px; }

        /* TABS */
        .tab-nav { display: flex; gap: 4px; background: white; margin: -30px 20px 0; border-radius: 12px; padding: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); position: relative; z-index: 5; flex-wrap: wrap; }
        .tab-btn { flex: 1; padding: 10px; border: none; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; background: transparent; color: var(--text2); display: flex; align-items: center; justify-content: center; gap: 6px; min-width: 80px; transition: 0.2s; }
        .tab-btn.active { background: var(--purple); color: white; }

        /* CONTENT */
        .content-area { max-width: 900px; margin: 0 auto; padding: 20px; }
        .block-card { background: var(--card); padding: 25px; border-radius: 18px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .block-title { margin-bottom: 12px; border-left: 4px solid var(--purple); padding-left: 10px; }
        .block-title small { font-size: 9px; font-weight: 800; color: var(--purple); }
        .block-title h3 { font-size: 20px; color: #0f172a; font-weight: 800; }
        .block-text { line-height: 1.8; color: #334155; font-size: 16px; white-space: pre-wrap; }

        /* TUGAS */
        .tugas-card { border-left: 4px solid #f59e0b; }
        .deadline-badge { padding: 10px; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 12px; }
        .answer-textarea { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px; font-family: inherit; resize: vertical; min-height: 60px; margin-bottom: 12px; }
        .submitted-box { display: flex; flex-direction: column; gap: 8px; }
        .submitted-badge { color: #059669; font-weight: 700; background: #dcfce7; padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 6px; font-size: 12px; }
        .submitted-answer { background: #f8fafc; padding: 8px; border-radius: 6px; font-size: 12px; color: #475569; }
        .btn-view { background: #f1f5f9; color: var(--text2); padding: 10px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .btn-delete { background: #fee2e2; color: #ef4444; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; }
        .expired-box { color: #ef4444; font-weight: 700; background: #fee2e2; padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; }
        .upload-label { display: block; background: #f59e0b; color: white; padding: 12px; border-radius: 8px; text-align: center; font-weight: 700; font-size: 12px; cursor: pointer; }

        /* KUIS */
        .quiz-card { border-top: 4px solid var(--purple); }
        .quiz-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .quiz-icon { background: var(--purple); padding: 10px; border-radius: 12px; }
        .quiz-header h2 { font-size: 20px; }
        .quiz-item { margin-bottom: 18px; }
        .quiz-question { font-size: 16px; font-weight: 800; color: var(--text); display: flex; gap: 10px; flex-direction: column; }
        .quiz-num { background: #f1f5f9; color: var(--purple); min-width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .quiz-q-img { max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 10px; border: 1px solid var(--border); margin-top: 8px; cursor: pointer; }
        .quiz-options { display: grid; gap: 6px; margin-top: 8px; }
        .quiz-opt { padding: 12px 16px; border-radius: 10px; border: 2px solid var(--border); text-align: left; font-size: 14px; font-weight: 700; cursor: pointer; background: #f8fafc; color: var(--text); transition: 0.2s; }
        .quiz-opt.selected { background: var(--purple); color: white; border-color: var(--purple); }
        .quiz-opt:disabled { opacity: 0.7; cursor: not-allowed; }
        .quiz-opt-img { max-width: 100%; max-height: 120px; object-fit: contain; border-radius: 8px; margin-top: 4px; margin-left: 26px; }
        .btn-submit-quiz { width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--purple); color: white; font-weight: 800; font-size: 15px; cursor: pointer; margin-top: 15px; }
        .quiz-done { text-align: center; padding: 14px; background: #f0fdf4; color: #15803d; border-radius: 12px; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px; }

        /* MEDIA */
        .media-doc { border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
        .media-doc-header { display: flex; align-items: center; gap: 12px; padding: 14px; background: #f8fafc; border-bottom: 1px solid var(--border); }
        .media-doc-header b { font-size: 14px; font-weight: 700; }
        .media-doc-header small { font-size: 10px; color: #94a3b8; display: block; }
        .btn-download { background: var(--purple); color: white; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .media-iframe { width: 100%; height: 400px; border: none; }
        .media-image { width: 100%; max-height: 500px; object-fit: contain; border-radius: 12px; border: 1px solid var(--border); cursor: pointer; }
        .media-link { display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border); color: var(--purple); font-weight: 700; font-size: 13px; text-decoration: none; }

        /* PREVIEW OVERLAY */
        .preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; cursor: pointer; }
        .preview-overlay img { max-width: 95%; max-height: 90vh; object-fit: contain; border-radius: 12px; }
        .preview-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        /* UPLOAD PREVIEW MODAL */
        .preview-upload-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .preview-upload-card { background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow: auto; }
        .preview-upload-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
        .preview-upload-header h4 { font-size: 16px; font-weight: 700; }
        .preview-upload-header button { background: none; border: none; cursor: pointer; }
        .preview-upload-body { padding: 20px; }
        .preview-upload-info { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .preview-upload-info b { font-size: 14px; font-weight: 600; display: block; }
        .preview-upload-info small { font-size: 11px; color: #94a3b8; }
        .preview-upload-img { width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; }
        .preview-upload-embed { width: 100%; height: 300px; border: none; border-radius: 8px; }
        .preview-upload-fallback { text-align: center; padding: 40px; color: #94a3b8; }
        .preview-upload-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
        .btn-cancel { padding: 8px 20px; background: #f1f5f9; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; color: var(--text2); }
        .btn-confirm { padding: 8px 20px; background: #10b981; border: none; border-radius: 8px; font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .student-main { margin-left: 0; }
          .mobile-header { display: flex; }
          .cover-section { height: 200px; }
          .cover-overlay { padding: 20px 15px; }
          .cover-overlay h1 { font-size: 18px; }
          .back-btn { top: 10px; left: 10px; padding: 8px 12px; font-size: 11px; }
          .tab-nav { margin: -20px 12px 0; }
          .content-area { padding: 15px 12px; }
          .block-card { padding: 18px; border-radius: 14px; }
          .block-title h3 { font-size: 16px; }
          .block-text { font-size: 14px; }
          .media-iframe { height: 250px; }
          .quiz-opt { padding: 10px 14px; font-size: 13px; }
        }
      `}</style>
    </div>
  );
};

export default StudentModuleView;