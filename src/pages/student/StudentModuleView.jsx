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
  Download, BookOpen, Hash, Tag, Upload, User,
  AlertCircle, Lock, Shield, Zap, Award, ExternalLink,
  FileQuestion, Calendar, Users, Target, Edit3, EyeOff,
  FileImage, FileVideo, Play, Youtube, Globe,
  FileSpreadsheet, FileArchive, FileCode, Maximize2
} from 'lucide-react';
import { uploadElearningFile } from '../../services/uploadService';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

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
// 🔥 RENDER MATH - SUPPORT KATEX
// ============================================================
const renderMath = (text) => {
  if (!text) return null;
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return <BlockMath key={i} math={part.substring(2, part.length - 2)} />; }
      catch (e) { return <span key={i} style={{color:'red'}}>{part}</span>; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={i} math={part.substring(1, part.length - 1)} />; }
      catch (e) { return <span key={i} style={{color:'red'}}>{part}</span>; }
    }
    return <span key={i}>{part}</span>;
  });
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
// 🔥 DETEKSI JENIS LINK
// ============================================================
const getLinkType = (url) => {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('canva.com') || url.includes('canva.cn')) return 'canva';
  if (url.includes('docs.google.com') || url.includes('drive.google.com')) return 'google';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.endsWith('.pdf')) return 'pdf';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
  if (url.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i)) return 'office';
  if (url.startsWith('http://') || url.startsWith('https://')) return 'link';
  return 'unknown';
};

// ============================================================
// 🔥 RENDER FILE - LANGSUNG TAMPIL DENGAN CARD
// ============================================================
const FileViewer = ({ url, fileName, fileType, fileSize, title }) => {
  const linkType = getLinkType(url);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const getIcon = () => {
    switch(linkType) {
      case 'pdf': return <FileText size={20} color="#ef4444" />;
      case 'image': return <FileImage size={20} color="#10b981" />;
      case 'youtube': return <Youtube size={20} color="#ff0000" />;
      case 'canva': return <Globe size={20} color="#00c4cc" />;
      case 'google': return <FileText size={20} color="#4285f4" />;
      case 'office': return <FileSpreadsheet size={20} color="#217346" />;
      default: return <FileText size={20} color="#3b82f6" />;
    }
  };
  
  const getFileTypeLabel = () => {
    switch(linkType) {
      case 'pdf': return '📄 PDF';
      case 'image': return '🖼️ Gambar';
      case 'youtube': return '▶️ YouTube';
      case 'canva': return '🎨 Canva';
      case 'google': return '📂 Google Docs';
      case 'office': return '📊 Office File';
      default: return '📎 File';
    }
  };
  
  const getFileSizeLabel = () => {
    if (fileSize) return formatFileSize(fileSize);
    return '';
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleOpenNewTab = () => {
    window.open(url, '_blank');
  };
  
  // 🔥 RENDER KONTEN LANGSUNG
  const renderContent = () => {
    switch(linkType) {
      case 'youtube': {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
        if (match) {
          return (
            <div style={styles.iframeWrapper}>
              <iframe 
                src={`https://www.youtube.com/embed/${match[1]}`} 
                frameBorder="0" 
                allowFullScreen 
                style={styles.iframe}
                title="YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          );
        }
        return <p style={styles.errorText}>⚠️ Link YouTube tidak valid</p>;
      }
      
      case 'pdf': {
        return (
          <div style={styles.iframeWrapper}>
            <iframe 
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
              style={styles.iframe}
              title="PDF Viewer"
            />
          </div>
        );
      }
      
      case 'image': {
        return (
          <div style={styles.imageWrapper}>
            <img src={url} alt={fileName || 'Gambar'} style={styles.image} />
          </div>
        );
      }
      
      case 'canva': {
        return (
          <div style={styles.iframeWrapper}>
            <iframe src={url} style={styles.iframe} title="Canva" allowFullScreen />
          </div>
        );
      }
      
      case 'google': {
        return (
          <div style={styles.iframeWrapper}>
            <iframe src={url} style={styles.iframe} title="Google Docs" allowFullScreen />
          </div>
        );
      }
      
      case 'link': {
        return (
          <div style={styles.linkCard}>
            <Globe size={24} color="#3b82f6" />
            <div style={styles.linkInfo}>
              <div style={styles.linkTitle}>{fileName || 'Link'}</div>
              <div style={styles.linkUrl}>{url}</div>
            </div>
          </div>
        );
      }
      
      default: {
        return (
          <div style={styles.unknownCard}>
            <FileText size={40} color="#94a3b8" />
            <p style={styles.unknownText}>File tidak dapat ditampilkan langsung</p>
            <button onClick={handleOpenNewTab} style={styles.btnOpenTab}>
              <ExternalLink size={14} /> Buka di Tab Baru
            </button>
          </div>
        );
      }
    }
  };
  
  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.iconWrapper}>{getIcon()}</span>
          <div style={styles.headerInfo}>
            <div style={styles.fileName}>{fileName || title || 'File'}</div>
            <div style={styles.fileMeta}>
              <span style={styles.fileType}>{getFileTypeLabel()}</span>
              {getFileSizeLabel() && (
                <span style={styles.fileSize}>• {getFileSizeLabel()}</span>
              )}
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={handleOpenNewTab} style={styles.btnNewTab} title="Buka di tab baru">
            <ExternalLink size={16} />
          </button>
          <button onClick={handleDownload} style={styles.btnDownload} title="Unduh file">
            <Download size={16} />
          </button>
        </div>
      </div>
      
      {/* CONTENT */}
      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

// ============================================================
// 🔥 FLASHCARD MNEMONIC - KARTU BISA DI-FLIP
// ============================================================
const FlashcardWidget = ({ front, back }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        marginTop: 16,
        perspective: 1000,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        ✨ Cara Gemilang — Klik kartu untuk lihat jawaban
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 110,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* SISI DEPAN */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxShadow: '0 6px 16px rgba(139,92,246,0.3)',
          }}
        >
          <span style={{ color: 'white', fontSize: 22, fontWeight: 900, textAlign: 'center', letterSpacing: 1 }}>
            {front}
          </span>
        </div>
        {/* SISI BELAKANG */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: '#f5f3ff',
            border: '2px solid #8b5cf6',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <span style={{ color: '#4c1d95', fontSize: 14, fontWeight: 600, textAlign: 'center', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: back }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 🔥 STYLES
// ============================================================
const styles = {
  container: {
    background: 'white',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    marginTop: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: 8
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 150
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  headerInfo: {
    flex: 1,
    minWidth: 0
  },
  fileName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
    wordBreak: 'break-word'
  },
  fileMeta: {
    display: 'flex',
    gap: 6,
    fontSize: 10,
    color: '#94a3b8',
    flexWrap: 'wrap'
  },
  fileType: {
    fontWeight: 500
  },
  fileSize: {
    color: '#94a3b8'
  },
  headerActions: {
    display: 'flex',
    gap: 4
  },
  btnNewTab: {
    padding: '6px 10px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s'
  },
  btnDownload: {
    padding: '6px 10px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s'
  },
  content: {
    padding: '0'
  },
  iframeWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    background: '#000'
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none'
  },
  imageWrapper: {
    padding: '12px',
    background: '#f8fafc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 500,
    overflow: 'hidden'
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: 4
  },
  linkCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    background: '#f8fafc',
    borderRadius: 8,
    margin: '12px'
  },
  linkInfo: {
    flex: 1,
    minWidth: 0
  },
  linkTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b'
  },
  linkUrl: {
    fontSize: 11,
    color: '#94a3b8',
    wordBreak: 'break-all'
  },
  unknownCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '30px 20px',
    background: '#f8fafc'
  },
  unknownText: {
    fontSize: 13,
    color: '#94a3b8'
  },
  btnOpenTab: {
    padding: '8px 20px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  errorText: {
    padding: '20px',
    color: '#ef4444',
    textAlign: 'center'
  }
};

// ============================================================
// REDUCER
// ============================================================
const initialState = {
  modul: null, loading: true, error: null, hasAccess: false,
  uploading: {}, submittedTasks: {},
  quizStatus: {},
  quizScores: {},
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
    case 'SET_QUIZ_STATUS': return { ...state, quizStatus: { ...state.quizStatus, [action.quizId]: action.status } };
    case 'SET_QUIZ_SCORE': return { ...state, quizScores: { ...state.quizScores, [action.quizId]: action.score } };
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

  // ===== FETCH MODUL =====
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
        
        // 🔥 CEK AKSES
        const nim = studentNim || localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
        const kelas = studentKelas || localStorage.getItem('studentKelas') || '';
        const program = studentProgram || localStorage.getItem('studentProgram') || 'Reguler';
        
        let hasAccess = false;
        
        if (data.sendToSpecificStudents) {
          const studentIds = data.studentIds || [];
          const selectedStudentIds = (data.selectedStudents || []).map(s => s.studentId || s.id);
          const allTargetIds = [...studentIds, ...selectedStudentIds];
          hasAccess = allTargetIds.includes(nim) || allTargetIds.includes(studentData?.id);
        }
        
        if (!hasAccess) {
          const targetKelas = data.targetKelas || 'Semua';
          const targetKategori = data.targetKategori || 'Semua';
          const matchKelas = targetKelas === 'Semua' || targetKelas === kelas;
          const matchProgram = targetKategori === 'Semua' || targetKategori === program;
          hasAccess = matchKelas && matchProgram;
        }
        
        if (!hasAccess) {
          dispatch({ type: 'SET_ERROR', payload: 'Anda tidak memiliki akses ke modul ini' });
          dispatch({ type: 'SET_ACCESS', payload: false });
          return;
        }
        
        dispatch({ type: 'SET_ACCESS', payload: true });
        dispatch({ type: 'SET_MODUL', payload: data });

        // 🔥 AMBIL STATUS KUIS
        if (nim) {
          const quizBlocks = (data.blocks || []).filter(b => b.type === 'quiz' && b.quizId);
          
          for (const block of quizBlocks) {
            if (block.quizId) {
              const qJawaban = query(
                collection(db, "jawaban_kuis"),
                where("modulId", "==", block.quizId),
                where("studentNim", "==", nim)
              );
              const snapJawaban = await getDocs(qJawaban);
              
              if (!snapJawaban.empty) {
                const lastData = snapJawaban.docs[0].data();
                dispatch({ 
                  type: 'SET_QUIZ_STATUS', 
                  quizId: block.quizId, 
                  status: 'done' 
                });
                dispatch({ 
                  type: 'SET_QUIZ_SCORE', 
                  quizId: block.quizId, 
                  score: lastData.score || 0 
                });
              } else {
                dispatch({ 
                  type: 'SET_QUIZ_STATUS', 
                  quizId: block.quizId, 
                  status: 'pending' 
                });
              }
            }
          }
          
          // 🔥 AMBIL TUGAS
          const snapTugas = await getDocs(
            query(collection(db,"jawaban_tugas"), where("modulId","==",modulId), where("studentNim","==",nim))
          );
          
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

  // ============================================================
  // UPLOAD HANDLER
  // ============================================================
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
  // RENDER CONTENT - MATERI & QUIZ BERSELANG
  // ============================================================
  const renderContent = (block, idx) => {
    // 🔥 JIKA QUIZ
    if (block.type === 'quiz') {
      const isDone = state.quizStatus[block.quizId] === 'done';
      const score = state.quizScores[block.quizId] || 0;
      
      return (
        <div key={block.id} style={{ 
          background: block.quizId ? (isDone ? '#f0fdf4' : '#ede9fe') : '#f8fafc', 
          padding: 16, 
          borderRadius: 12,
          border: block.quizId 
            ? (isDone ? '2px solid #10b981' : '2px solid #8b5cf6') 
            : '2px dashed #e2e8f0',
          marginBottom: 12,
          opacity: block.quizId ? 1 : 0.6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <FileQuestion size={24} color={block.quizId ? (isDone ? '#10b981' : '#8b5cf6') : '#94a3b8'} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: block.quizId ? (isDone ? '#166534' : '#6d28d9') : '#94a3b8' }}>
                {block.quizTitle || block.title || 'Kuis'}
              </h4>
              <p style={{ margin: 0, fontSize: 11, color: block.quizId ? (isDone ? '#166534' : '#7c3aed') : '#94a3b8' }}>
                {block.quizQuestions || 0} soal
                {isDone && ` • ✅ Selesai (Nilai: ${score})`}
              </p>
            </div>
            {isDone && (
              <span style={{ 
                background: '#dcfce7', 
                color: '#166534',
                padding: '2px 10px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700
              }}>
                ✅ Selesai
              </span>
            )}
            {!block.quizId && (
              <span style={{ 
                background: '#fef3c7', 
                color: '#b45309',
                padding: '2px 10px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700
              }}>
                ⚠️ Belum tersedia
              </span>
            )}
          </div>
          
          {block.quizId ? (
            <button
              onClick={() => navigate(`/siswa/kuis/${block.quizId}`)}
              style={{
                padding: '10px 24px',
                background: isDone 
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                  : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: block.quizId ? 1 : 0.5
              }}
              disabled={!block.quizId}
            >
              {isDone ? <Eye size={16} /> : <Zap size={16} />}
              {isDone ? 'Lihat Detail Jawaban' : 'Mulai Kuis'}
            </button>
          ) : (
            <div style={{ 
              padding: '10px 20px', 
              background: '#f1f5f9', 
              borderRadius: 8, 
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-block'
            }}>
              ⚡ Menunggu kuis dari guru
            </div>
          )}
          
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
            {block.quizId 
              ? (isDone 
                ? 'Klik untuk melihat hasil dan pembahasan' 
                : 'Kerjakan kuis ini untuk menguji pemahaman Anda')
              : 'Guru belum membuat kuis untuk bagian ini'}
          </p>
        </div>
      );
    }
    
    // 🔥 MATERI (text, file, video)
    const typeIcons = { text: '📄', file: '📁', video: '🎥' };
    const typeLabels = { text: 'MATERI', file: 'FILE', video: 'VIDEO' };
    const typeColors = { text: '#3b82f6', file: '#10b981', video: '#ef4444' };
    
    return (
      <div key={block.id} className="cd">
        <div className="cdt">
          <small style={{ color: typeColors[block.type] }}>
            {typeIcons[block.type] || '📄'} {typeLabels[block.type] || 'BAGIAN'} {idx + 1}
          </small>
          <h3>{renderMath(block.title) || `Bagian ${idx + 1}`}</h3>
        </div>
        
        {/* 🔥 KONTEN TEKS - CEK APAKAH HTML (dari AI Generate) ATAU TEKS BIASA */}
        {block.type === 'text' && block.format === 'html' && (
          <div className="cdtx cdtx-html" dangerouslySetInnerHTML={{ __html: block.content }} />
        )}
        {block.type === 'text' && block.format !== 'html' && (
          <div className="cdtx">{renderMath(block.content)}</div>
        )}
        {block.interactive?.type === 'flashcard' && (
          <FlashcardWidget front={block.interactive.front} back={block.interactive.back} />
        )}
        
        {(block.type === 'file' || block.type === 'video') && (
          <FileViewer 
            url={block.content}
            fileName={block.fileName || block.title || 'File'}
            fileType={block.mimeType}
            fileSize={block.fileSize}
            title={block.title}
          />
        )}
      </div>
    );
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (state.loading) return (
    <div className="ls"><div className="sp"/><p>Memuat Modul...</p></div>
  );

  // ============================================================
  // ERROR / NO ACCESS
  // ============================================================
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

  // 🔥 FILTER KONTEN
  const allBlocks = state.modul?.blocks || [];
  const materiBlocks = allBlocks.filter(b => b.type !== 'assignment');
  const tugasBlocks = allBlocks.filter(b => b.type === 'assignment');
  const quizBlocks = allBlocks.filter(b => b.type === 'quiz');
  const hasQuiz = quizBlocks.length > 0;

  // ============================================================
  // RENDER UTAMA
  // ============================================================
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
            {state.modul?.sendToSpecificStudents && <span className="ts">🔒 Khusus</span>}
          </div>
          <h1>{renderMath(state.modul?.title)}</h1>
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
            <FileQuestion size={14}/> Kuis ({quizBlocks.filter(b => b.quizId).length}/{quizBlocks.length})
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="ct">
        {/* 🔥 MATERI + QUIZ BERSELANG */}
        {state.activeTab==='materi' && (
          <div>
            {materiBlocks.length === 0 && (
              <div className="em">Belum ada materi</div>
            )}
            {materiBlocks.map((block, idx) => renderContent(block, idx))}
          </div>
        )}

        {/* 🔥 TUGAS */}
        {state.activeTab==='tugas' && (
          <div>
            {tugasBlocks.length === 0 && <div className="em">Tidak ada tugas</div>}
            {tugasBlocks.map(b => {
              const sub = state.submittedTasks[b.id];
              const expired = b.endTime && new Date(b.endTime) < new Date();
              return (
                <div key={b.id} className="cd tg">
                  <div className="cdt"><small>📝 TUGAS</small><h3>{b.title}</h3></div>
                  <div className="cdtx">{renderMath(b.content)}</div>
                  {b.endTime && <div className="dl"><Clock size={14}/> {getTimeRemaining(b.endTime)?.text}</div>}
                  <textarea 
                    value={state.textAnswers[b.id]||''} 
                    onChange={e=>dispatch({type:'SET_TEXT_ANSWERS',blockId:b.id,value:e.target.value})} 
                    placeholder="Tulis jawaban..." 
                    disabled={!!sub||expired} 
                    className="ta"
                  />
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
            })}
          </div>
        )}

        {/* 🔥 KUIS - DAFTAR SEMUA KUIS */}
        {state.activeTab==='kuis' && (
          <div>
            {quizBlocks.length === 0 && <div className="em">Tidak ada kuis</div>}
            {quizBlocks.map(block => {
              const isDone = state.quizStatus[block.quizId] === 'done';
              const score = state.quizScores[block.quizId] || 0;
              
              return (
                <div key={block.id} style={{ 
                  background: block.quizId ? (isDone ? '#f0fdf4' : '#ede9fe') : '#f8fafc', 
                  padding: 16, 
                  borderRadius: 12,
                  border: block.quizId 
                    ? (isDone ? '2px solid #10b981' : '2px solid #8b5cf6') 
                    : '2px dashed #e2e8f0',
                  marginBottom: 12,
                  opacity: block.quizId ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <FileQuestion size={24} color={block.quizId ? (isDone ? '#10b981' : '#8b5cf6') : '#94a3b8'} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: block.quizId ? (isDone ? '#166534' : '#6d28d9') : '#94a3b8' }}>
                        {block.quizTitle || block.title || 'Kuis'}
                      </h4>
                      <p style={{ margin: 0, fontSize: 11, color: block.quizId ? (isDone ? '#166534' : '#7c3aed') : '#94a3b8' }}>
                        {block.quizQuestions || 0} soal
                        {isDone && ` • ✅ Selesai (Nilai: ${score})`}
                      </p>
                    </div>
                    {isDone && (
                      <span style={{ 
                        background: '#dcfce7', 
                        color: '#166534',
                        padding: '2px 10px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700
                      }}>
                        ✅ Selesai
                      </span>
                    )}
                    {!block.quizId && (
                      <span style={{ 
                        background: '#fef3c7', 
                        color: '#b45309',
                        padding: '2px 10px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700
                      }}>
                        ⚠️ Belum tersedia
                      </span>
                    )}
                  </div>
                  
                  {block.quizId ? (
                    <button
                      onClick={() => navigate(`/siswa/kuis/${block.quizId}`)}
                      style={{
                        padding: '10px 24px',
                        background: isDone 
                          ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                          : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 13,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      {isDone ? <Eye size={16} /> : <Zap size={16} />}
                      {isDone ? 'Lihat Detail Jawaban' : 'Mulai Kuis'}
                    </button>
                  ) : (
                    <div style={{ 
                      padding: '10px 20px', 
                      background: '#f1f5f9', 
                      borderRadius: 8, 
                      color: '#94a3b8',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      ⚡ Menunggu kuis dari guru
                    </div>
                  )}
                  
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
                    {block.quizId 
                      ? (isDone 
                        ? 'Klik untuk melihat hasil dan pembahasan' 
                        : 'Kerjakan kuis ini untuk menguji pemahaman Anda')
                      : 'Guru belum membuat kuis untuk bagian ini'}
                  </p>
                </div>
              );
            })}
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
               <div className="puf"><FileText size={48} color="#94a3b8"/><p>File siap upload</p></div>}
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
        .cdtx-html{white-space:normal}
        .cdtx-html p{margin-bottom:12px}
        .cdtx-html img{max-width:100%;border-radius:10px}
        .cdtx-html b{color:#1e293b}
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
        @media(max-width:768px){.cv{height:200px}.cvo h1{font-size:18px}.tb{margin:-20px 12px 0}.ct{padding:15px 12px}.cd{padding:18px;border-radius:14px}.cdt h3{font-size:16px}.cdtx{font-size:14px}}
      `}</style>
    </>
  );
};

export default StudentModuleView;