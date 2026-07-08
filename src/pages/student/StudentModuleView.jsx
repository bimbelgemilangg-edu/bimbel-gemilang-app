// src/pages/student/StudentModuleView.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs, deleteDoc, updateDoc 
} from "firebase/firestore";
import { 
  ArrowLeft, Clock, FileText, CheckCircle, UploadCloud, 
  Eye, Link as LinkIcon, HelpCircle, AlertCircle, FileDigit, 
  User, Trash2, X, Send, Zap, Calendar, Maximize2, 
  Download, BookOpen, Hash, Tag, File, Image as ImageIcon,
  FileArchive, Upload, Check, AlertTriangle,
  List, Grid, Filter, ChevronDown, ChevronUp, Settings,
  Menu, Home, LogOut
} from 'lucide-react';
import { uploadElearningFile, deleteFile, supabase } from '../../services/uploadService';
import SidebarSiswa from '../../components/SidebarSiswa';

// ============================================================
// CONSTANTS - JENIS FILE YANG DIIZINKAN
// ============================================================
const ALLOWED_FILE_TYPES = {
  all: { label: 'Semua File', accept: '*/*', icon: <File size={16} /> },
  pdf: { label: 'PDF', accept: '.pdf,application/pdf', icon: <File size={16} color="#ef4444" /> },
  image: { label: 'Gambar', accept: 'image/*', icon: <ImageIcon size={16} color="#10b981" /> },
  word: { label: 'Word/DOCX', accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: <FileText size={16} color="#3b82f6" /> },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const formatDate = (ts) => {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { 
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit' 
  });
};

const getTimeRemaining = (deadline, currentTime) => {
  if (!deadline) return null;
  const dl = new Date(deadline);
  const diff = dl - currentTime;
  if (diff <= 0) return { text: '⛔ Terlewat', color: '#ef4444', isExpired: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return { 
    text: `⏳ ${days} hari ${hours % 24} jam lagi`, 
    color: days <= 1 ? '#f59e0b' : '#10b981', 
    isExpired: false 
  };
  return { text: `⚠️ ${hours} jam lagi`, color: '#f59e0b', isExpired: false };
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ============================================================
// COMPONENT: FilePreviewBeforeUpload
// ============================================================
const FilePreviewBeforeUpload = ({ file, onConfirm, onCancel, uploading }) => {
  if (!file) return null;
  
  const isImage = file.type?.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  const previewUrl = URL.createObjectURL(file);
  
  return (
    <div style={previewModalStyles.overlay}>
      <div style={previewModalStyles.content}>
        <div style={previewModalStyles.header}>
          <h4 style={previewModalStyles.title}>📎 Preview File</h4>
          <button onClick={onCancel} style={previewModalStyles.closeBtn}><X size={20} /></button>
        </div>
        
        <div style={previewModalStyles.body}>
          <div style={previewModalStyles.fileInfo}>
            <FileText size={24} color="#3b82f6" />
            <div>
              <div style={previewModalStyles.fileName}>{file.name}</div>
              <div style={previewModalStyles.fileMeta}>
                {formatFileSize(file.size)} • {file.type || 'Unknown'}
              </div>
            </div>
          </div>
          
          <div style={previewModalStyles.previewArea}>
            {isImage ? (
              <img src={previewUrl} alt="Preview" style={previewModalStyles.previewImage} />
            ) : isPDF ? (
              <embed src={previewUrl} type="application/pdf" style={previewModalStyles.previewEmbed} />
            ) : (
              <div style={previewModalStyles.previewFallback}>
                <File size={48} color="#94a3b8" />
                <p>File siap diupload</p>
                <span style={previewModalStyles.fileType}>{file.type || 'Unknown'}</span>
              </div>
            )}
          </div>
          
          <div style={previewModalStyles.actions}>
            <button onClick={onCancel} style={previewModalStyles.btnCancel} disabled={uploading}>
              Batal
            </button>
            <button onClick={onConfirm} disabled={uploading} style={previewModalStyles.btnConfirm}>
              {uploading ? (
                <><div style={previewModalStyles.spinner}></div> Mengupload...</>
              ) : (
                <><Upload size={16} /> Upload ke Server</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const previewModalStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, backdropFilter: 'blur(4px)'
  },
  content: {
    background: 'white', borderRadius: 16, maxWidth: 600, width: '100%',
    maxHeight: '90vh', overflow: 'auto', animation: 'slideUp 0.3s ease'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #e2e8f0'
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  body: { padding: 20 },
  fileInfo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  fileName: { fontWeight: 600, fontSize: 14 },
  fileMeta: { fontSize: 11, color: '#94a3b8' },
  previewArea: {
    background: '#f8fafc', borderRadius: 8, overflow: 'hidden',
    minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #e2e8f0', marginBottom: 16
  },
  previewImage: { maxWidth: '100%', maxHeight: 300, objectFit: 'contain' },
  previewEmbed: { width: '100%', height: 300, border: 'none' },
  previewFallback: { textAlign: 'center', padding: 40, color: '#94a3b8' },
  fileType: { fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  btnCancel: {
    padding: '8px 20px', background: '#f1f5f9', border: 'none',
    borderRadius: 8, fontWeight: 600, cursor: 'pointer', color: '#64748b'
  },
  btnConfirm: {
    padding: '8px 20px', background: '#10b981', border: 'none',
    borderRadius: 8, fontWeight: 700, color: 'white', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6
  },
  spinner: {
    width: 16, height: 16, border: '2px solid white',
    borderTop: '2px solid transparent', borderRadius: '50%',
    animation: 'spin 0.6s linear infinite'
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const navigate = useNavigate();
  
  // ===== SIDEBAR STATE =====
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('materi');
  
  // ===== STATES =====
  const [modul, setModul] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [submittedTasks, setSubmittedTasks] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [localFiles, setLocalFiles] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTugasExpired, setIsTugasExpired] = useState(false);
  const [isQuizExpired, setIsQuizExpired] = useState(false);
  const [activeTab, setActiveTab] = useState('materi');
  const [previewImage, setPreviewImage] = useState(null);
  const [textAnswers, setTextAnswers] = useState({});
  
  // ===== PREVIEW BEFORE UPLOAD =====
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingBlockId, setPendingBlockId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // ===== STUDENT ID =====
  const [studentId, setStudentId] = useState(null);
  const [studentNim, setStudentNim] = useState('');

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Ambil student data
  useEffect(() => {
    const sId = studentData?.uid || studentData?.id || localStorage.getItem('studentId');
    const sNim = studentData?.studentId || 
                 studentData?.nim || 
                 studentData?.studentNim || 
                 localStorage.getItem('studentNim') || 
                 localStorage.getItem('studentId');
    
    setStudentId(sId);
    setStudentNim(sNim);
    
    console.log('🔍 Student NIM loaded:', sNim);
  }, [studentData]);

  // Fetch modul detail - LANGSUNG EKSEKUSI TANPA DELAY
  useEffect(() => {
    const fetchDetail = async () => {
      if (!modulId || !studentNim) {
        console.warn('⚠️ Menunggu data lengkap...');
        return;
      }
      
      try {
        setLoading(true);
        const docRef = doc(db, "bimbel_modul", modulId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setModul(data);
          
          const now = new Date();
          const assignmentBlock = (data.blocks || []).find(b => b.type === 'assignment' && b.endTime);
          if (assignmentBlock?.endTime) {
            setIsTugasExpired(now > new Date(assignmentBlock.endTime));
          }
          if (data.deadlineQuiz) {
            setIsQuizExpired(now > new Date(data.deadlineQuiz));
          }
          
          // Jalankan query data secara paralel
          await Promise.all([
            checkExistingSubmissions(modulId),
            checkQuizStatus(modulId)
          ]);
        } else {
          console.error('❌ Modul tidak ditemukan');
        }
      } catch (err) { 
        console.error('Error fetching module:', err); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchDetail();
  }, [modulId, studentNim]);

  // ============================================================
  // CHECK SUBMISSIONS - OPTIMASI DENGAN QUERY MENGGUNAKAN NIM
  // ============================================================
  const checkExistingSubmissions = async (mId) => {
    if (!studentNim) {
      console.warn('⚠️ checkExistingSubmissions: studentNim tidak tersedia');
      return;
    }
    
    try {
      const q = query(
        collection(db, "jawaban_tugas"),
        where("modulId", "==", mId),
        where("studentNim", "==", studentNim)
      );
      const snap = await getDocs(q);
      const completed = {};
      
      snap.forEach(doc => { 
        const data = doc.data();
        completed[data.blockId] = { 
          docId: doc.id, 
          fileUrl: data.fileUrl, 
          fileName: data.fileName || "Lihat File",
          textAnswer: data.answer || data.textAnswer || '',
          status: data.status || 'Pending'
        }; 
      });
      
      setSubmittedTasks(completed);
      console.log(`✅ Found ${Object.keys(completed).length} submissions for NIM: ${studentNim}`);
    } catch (err) {
      console.error('Error checking submissions:', err);
    }
  };

  const checkQuizStatus = async (mId) => {
    if (!studentNim) {
      console.warn('⚠️ checkQuizStatus: studentNim tidak tersedia');
      return;
    }
    
    try {
      const q = query(
        collection(db, "jawaban_kuis"),
        where("modulId", "==", mId),
        where("studentNim", "==", studentNim)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setQuizSubmitted(true);
      }
      console.log(`✅ Quiz status checked for NIM: ${studentNim}`);
    } catch (err) {
      console.error('Error checking quiz status:', err);
    }
  };

  // ============================================================
  // UPLOAD HANDLERS
  // ============================================================
  const handleFileChange = (e, blockId) => {
    if (isTugasExpired) {
      alert("❌ Deadline terlewat.");
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;
    
    const block = modul?.blocks?.find(b => b.id === blockId);
    const allowedType = block?.allowedFileType || 'all';
    const allowed = ALLOWED_FILE_TYPES[allowedType];
    
    if (allowed && allowed.accept !== '*/*') {
      const acceptPattern = allowed.accept.replace(/,/g, '|');
      const regex = new RegExp(acceptPattern.replace(/\./g, '\\.').replace(/\*/g, '.*'), 'i');
      const isValid = regex.test(file.type) || regex.test(file.name);
      if (!isValid) {
        alert(`❌ Format file tidak diizinkan. Hanya: ${allowed.label}`);
        return;
      }
    }
    
    if (file.size > 50 * 1024 * 1024) {
      alert("❌ Maksimal 50MB.");
      return;
    }
    
    setPendingFile(file);
    setPendingBlockId(blockId);
    setShowPreviewModal(true);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || !pendingBlockId) return;
    
    const blockId = pendingBlockId;
    const file = pendingFile;
    
    setUploading(prev => ({...prev, [blockId]: true}));
    setShowPreviewModal(false);
    
    try {
      const result = await uploadElearningFile(file, 'tugas');
      
      if (result.success) {
        const payload = {
          modulId,
          modulTitle: modul.title,
          blockId,
          blockTitle: modul.blocks?.find(b => b.id === blockId)?.title || 'Tugas',
          studentId: studentId,
          studentNim: studentNim,
          studentName: studentData?.nama || localStorage.getItem('studentName') || 'Siswa',
          studentClass: studentData?.kelasSekolah || 'Umum',
          guruId: modul.guruId || '',
          fileUrl: result.downloadURL,
          filePath: result.filePath,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          answer: textAnswers[blockId] || '',
          submittedAt: serverTimestamp(),
          status: 'Pending',
          type: 'assignment'
        };
        
        const docRef = await addDoc(collection(db, 'jawaban_tugas'), payload);
        
        setSubmittedTasks({
          ...submittedTasks, 
          [blockId]: { 
            docId: docRef.id, 
            fileUrl: result.downloadURL, 
            fileName: file.name,
            textAnswer: textAnswers[blockId] || '',
            status: 'Pending'
          }
        });
        
        setLocalFiles({...localFiles, [blockId]: null});
        alert('✅ Tugas berhasil diupload!');
      } else {
        alert('❌ Upload gagal: ' + result.error);
      }
    } catch (err) { 
      alert('❌ Gagal: ' + err.message); 
    } finally {
      setUploading(prev => ({...prev, [blockId]: false}));
      setPendingFile(null);
      setPendingBlockId(null);
    }
  };

  const handleCancelUpload = () => {
    setShowPreviewModal(false);
    setPendingFile(null);
    setPendingBlockId(null);
  };

  const handleDeleteTask = async (blockId) => {
    if (isTugasExpired) {
      alert("❌ Tidak bisa menarik.");
      return;
    }
    
    if (!window.confirm("Tarik tugas?")) return;
    
    try {
      const info = submittedTasks[blockId];
      if (info?.docId) { 
        await deleteDoc(doc(db, "jawaban_tugas", info.docId)); 
        const ns = {...submittedTasks}; 
        delete ns[blockId]; 
        setSubmittedTasks(ns); 
        alert('✅ Tugas berhasil ditarik');
      }
    } catch (err) { 
      alert("❌ Gagal menarik tugas: " + err.message); 
    }
  };

  // ============================================================
  // QUIZ HANDLERS
  // ============================================================
  const handleQuizSubmit = async () => {
    if (isQuizExpired) {
      alert("❌ Kuis ditutup.");
      return;
    }
    
    const qd = modul?.quizData || [];
    if (qd.length === 0) {
      alert("Tidak ada soal.");
      return;
    }
    
    const unas = qd.filter(q => quizAnswers[q.id] === undefined);
    if (unas.length > 0) {
      alert(`❌ ${unas.length} soal belum dijawab.`);
      return;
    }
    
    if (!window.confirm("Kirim kuis?")) return;
    
    try {
      let correct = 0;
      qd.forEach(q => { 
        if (quizAnswers[q.id] === q.correctAnswer) correct++; 
      });
      
      const score = Math.round((correct / qd.length) * 100);
      
      await addDoc(collection(db, "jawaban_kuis"), {
        modulId, 
        modulTitle: modul.title,
        studentId: studentId,
        studentNim: studentNim,
        studentName: studentData?.nama || localStorage.getItem('studentName') || 'Siswa',
        studentClass: studentData?.kelasSekolah || "Umum",
        guruId: modul.guruId || '',
        answers: quizAnswers,
        correctAnswers: correct,
        totalQuestions: qd.length,
        score,
        submittedAt: serverTimestamp(),
        status: "Dinilai",
        gradedAt: serverTimestamp(),
        type: "quiz"
      });
      
      setQuizSubmitted(true);
      alert(`🎉 Nilai: ${score}\nBenar: ${correct}/${qd.length}`);
    } catch (err) { 
      alert("❌ Gagal mengirim kuis: " + err.message); 
    }
  };

  // ============================================================
  // RENDER MEDIA
  // ============================================================
  const renderMedia = (block) => {
    const contentUrl = block.content || block.fileUrl || block.url || block.file;
    if (!contentUrl) return null;
    
    const fName = block.fileName || "Dokumen";
    const fType = block.mimeType || "";
    const isDoc = fType.includes('pdf') || fType.includes('word') || fType.includes('document') || 
                  contentUrl.toLowerCase().includes('.pdf') || contentUrl.toLowerCase().includes('.doc') || 
                  contentUrl.includes('supabase');

    if (isDoc) {
      const embedSrc = `https://docs.google.com/viewer?url=${encodeURIComponent(contentUrl)}&embedded=true`;
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
            <FileText size={36} color="#673ab7" />
            <div style={{flex:1, overflow:'hidden' }}>
              <div style={{fontWeight:700, fontSize:14 }}>{fName}</div>
              <div style={{fontSize:10, color:'#94a3b8' }}>Klik untuk unduh</div>
            </div>
            <a href={contentUrl} target="_blank" rel="noreferrer" download style={{ background:'#673ab7', color:'white', padding:'8px 14px', borderRadius:8, textDecoration:'none', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
              <Download size={14} /> Unduh
            </a>
          </div>
          <iframe src={embedSrc} style={{ width:'100%', height:isMobile?280:500, border:'none' }} title="Viewer" loading="lazy"></iframe>
        </div>
      );
    }

    if (contentUrl.startsWith('data:image/') || contentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || fType.startsWith('image/')) {
      return (
        <img 
          src={contentUrl} 
          style={{ width:'100%', maxHeight:500, objectFit:'contain', borderRadius:12, border:'1px solid #e2e8f0', cursor:'pointer' }} 
          alt="" 
          onClick={() => setPreviewImage(contentUrl)} 
        />
      );
    }

    let embedUrl = contentUrl;
    let showIframe = false;
    
    if (contentUrl.includes('youtube.com') || contentUrl.includes('youtu.be')) {
      const vid = contentUrl.split('v=')[1]?.split('&')[0] || contentUrl.split('/').pop();
      embedUrl = `https://www.youtube.com/embed/${vid}`;
      showIframe = true;
    } else if (contentUrl.includes('canva.com') || contentUrl.includes('docs.google.com')) {
      showIframe = true;
    }

    if (showIframe) {
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <iframe src={embedUrl} style={{ width:'100%', height:isMobile?250:450, border:'none' }} allowFullScreen title="Preview" loading="lazy"></iframe>
        </div>
      );
    }

    return (
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:16, background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
        <LinkIcon size={20} color="#673ab7"/>
        <a href={contentUrl} target="_blank" rel="noreferrer" style={{ color:'#673ab7', fontWeight:700, fontSize:13 }}>
          Buka Link Materi ↗
        </a>
      </div>
    );
  };

  // ============================================================
  // RENDER UTAMA - BEBAS TYPO & MARGIN DINAMIS ANTI-KETUTUPAN
  // ============================================================
  if (loading) {
    return (
      <div style={styles.wrapper}>
        <SidebarSiswa 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <div style={{...styles.mainContent, marginLeft: isMobile ? 0 : '270px'}}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Membuka Modul...</p>
          </div>
        </div>
      </div>
    );
  }

  const tugasBlocks = (modul?.blocks || []).filter(b => b.type === 'assignment');
  const materiBlocks = (modul?.blocks || []).filter(b => b.type !== 'assignment');

  return (
    <div style={styles.wrapper}>
      {/* ===== SIDEBAR PORTAL SISWA ===== */}
      <SidebarSiswa 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* ===== MAIN CONTENT - TERDORONG KE KANAN DI LAPTOP ===== */}
      <div style={{
        ...styles.mainContent,
        marginLeft: isMobile ? 0 : '270px',
        transition: 'margin-left 0.3s ease'
      }}>
        
        {/* ===== MOBILE HEADER - MUNCUL DI HP DENGAN TOMBOL MENU AKTIF ===== */}
        <div style={{
          ...styles.mobileHeader,
          display: isMobile ? 'flex' : 'none'
        }}>
          <button 
            onClick={() => setSidebarOpen(true)} 
            style={styles.menuBtn}
          >
            <Menu size={24} color="#1e293b" />
          </button>
          <span style={styles.mobileTitle}>{modul?.title || 'Modul'}</span>
          <div style={{ width: 24 }}></div>
        </div>

        {/* ===== HERO BANNER MATERI ===== */}
        <div style={{ height: isMobile ? 200 : 280, position: 'relative', width: '100%', overflow: 'hidden' }}>
          <button onClick={onBack} style={{ 
            position:'absolute', top:isMobile?10:18, left:isMobile?10:18, zIndex:10, 
            background:'rgba(255,255,255,0.95)', border:'none', padding:isMobile?'8px 12px':'10px 18px', 
            borderRadius:30, cursor:'pointer', display:'flex', alignItems:'center', gap:6, 
            fontWeight:800, boxShadow:'0 10px 25px rgba(0,0,0,0.15)', color:'#1e293b', 
            fontSize:isMobile?11:13 
          }}>
            <ArrowLeft size={14} /> {!isMobile && 'Kembali'}
          </button>
          <img 
            src={modul?.coverImage || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000"} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            alt="" 
          />
          <div style={{ 
            position:'absolute', bottom:0, left:0, right:0, 
            background:'linear-gradient(transparent,rgba(15,23,42,0.95))', 
            padding:isMobile?'20px 15px':'35px 6%', color:'white' 
          }}>
            <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
              <span style={{ background:'#673ab7', padding:'4px 10px', borderRadius:8, fontSize:9, fontWeight:800 }}>
                {modul?.subject || 'Umum'}
              </span>
              <span style={{ background:'rgba(255,255,255,0.2)', padding:'4px 10px', borderRadius:8, fontSize:9 }}>
                {modul?.targetKategori || 'Semua'} • {modul?.targetKelas || 'Semua'}
              </span>
              {modul?.guruId && (
                <span style={{ background:'rgba(59,130,246,0.3)', padding:'4px 10px', borderRadius:8, fontSize:8 }}>
                  <Hash size={8} /> {modul.guruId}
                </span>
              )}
              {modul?.kodeMapel && (
                <span style={{ background:'rgba(139,92,246,0.3)', padding:'4px 10px', borderRadius:8, fontSize:8 }}>
                  <Tag size={8} /> {modul.kodeMapel}
                </span>
              )}
            </div>
            <h1 style={{ fontSize:isMobile?18:26, margin:'0 0 6px', fontWeight:900, lineHeight:1.2 }}>
              {modul?.title}
            </h1>
            <div style={{ display:'flex', gap:12, fontSize:11, opacity:0.8, flexWrap:'wrap' }}>
              <span><User size={12} /> {modul?.authorName || modul?.guruName || 'Guru'}</span>
              <span><Calendar size={12} /> {formatDate(modul?.createdAt)}</span>
              {studentNim && <span><Hash size={12} /> NIM: {studentNim}</span>}
            </div>
          </div>
        </div>

        {/* ===== NAVIGASI TABS MATERI & TUGAS ===== */}
        <div style={{ 
          display:'flex', gap:4, background:'white', 
          margin:isMobile?'-20px 12px 0':'-30px 20px 0', 
          borderRadius:12, padding:5, 
          boxShadow:'0 4px 12px rgba(0,0,0,0.06)', 
          position:'relative', zIndex:5, flexWrap:'wrap' 
        }}>
          <button
            onClick={() => setActiveTab('materi')}
            style={{ 
              flex:1, padding:'10px', border:'none', borderRadius:8, 
              fontWeight:700, fontSize:12, cursor:'pointer', 
              background:activeTab==='materi'?'#673ab7':'transparent', 
              color:activeTab==='materi'?'white':'#64748b', 
              display:'flex', alignItems:'center', justifyContent:'center', gap:6, 
              minWidth:80 
            }}
          >
            <BookOpen size={14} /> Materi ({materiBlocks.length})
          </button>
          
          {tugasBlocks.length > 0 && (
            <button
              onClick={() => setActiveTab('tugas')}
              style={{ 
                flex:1, padding:'10px', border:'none', borderRadius:8, 
                fontWeight:700, fontSize:12, cursor:'pointer', 
                background:activeTab==='tugas'?'#673ab7':'transparent', 
                color:activeTab==='tugas'?'white':'#64748b', 
                display:'flex', alignItems:'center', justifyContent:'center', gap:6, 
                minWidth:80 
              }}
            >
              <Send size={14} /> Tugas ({Object.keys(submittedTasks).length}/{tugasBlocks.length})
            </button>
          )}

          {modul?.quizData?.length > 0 && (
            <button
              onClick={() => setActiveTab('kuis')}
              style={{ 
                flex:1, padding:'10px', border:'none', borderRadius:8, 
                fontWeight:700, fontSize:12, cursor:'pointer', 
                background:activeTab==='kuis'?'#673ab7':'transparent', 
                color:activeTab==='kuis'?'white':'#64748b', 
                display:'flex', alignItems:'center', justifyContent:'center', gap:6, 
                minWidth:80 
              }}
            >
              <HelpCircle size={14} /> Kuis {quizSubmitted ? '✅' : ''}
            </button>
          )}
        </div>

        {/* ===== KONTEN MATERI AKTIF ===== */}
        <div style={{ maxWidth:900, margin:'0 auto', padding:isMobile?'15px 12px':'20px' }}>
          {activeTab === 'materi' && materiBlocks.map((block, idx) => (
            <div key={block.id} style={{ 
              background:'white', padding:isMobile?18:25, 
              borderRadius:isMobile?14:18, marginBottom:12, 
              boxShadow:'0 2px 8px rgba(0,0,0,0.03)', border:'1px solid #f1f5f9' 
            }}>
              <div style={{ marginBottom:12, borderLeft:'4px solid #673ab7', paddingLeft:10 }}>
                <div style={{ fontSize:9, fontWeight:800, color:'#673ab7', marginBottom:2 }}>
                  {block.type==='file'?'📁 FILE':block.type==='video'?'🔗 LINK':'📄 BAGIAN '+(idx+1)}
                </div>
                <h3 style={{ fontSize:isMobile?16:20, margin:0, color:'#0f172a', fontWeight:800 }}>
                  {block.title}
                </h3>
              </div>
              {block.type==='text' && 
                <div style={{ lineHeight:1.8, color:'#334155', fontSize:isMobile?14:16, whiteSpace:'pre-wrap' }}>
                  {block.content}
                </div>
              }
              {(block.type==='video' || block.type==='file') && 
                <div style={{marginTop:10}}>{renderMedia(block)}</div>
              }
            </div>
          ))}

          {/* ===== KONTEN TUGAS AKTIF ===== */}
          {activeTab === 'tugas' && tugasBlocks.map(block => {
            const timeRem = getTimeRemaining(block.endTime, currentTime);
            const isExpired = isTugasExpired || (block.endTime && new Date(block.endTime) < currentTime);
            const isSubmitted = !!submittedTasks[block.id];
            const submission = submittedTasks[block.id];
            const allowedFileType = block.allowedFileType || 'all';
            const fileTypeInfo = ALLOWED_FILE_TYPES[allowedFileType] || ALLOWED_FILE_TYPES.all;
            
            return (
              <div key={block.id} style={{ 
                background:'white', padding:isMobile?18:25, 
                borderRadius:isMobile?14:18, marginBottom:12, 
                boxShadow:'0 2px 8px rgba(0,0,0,0.03)', 
                border:'1px solid #f1f5f9', borderLeft:'4px solid #f59e0b' 
              }}>
                <div style={{ marginBottom:12, paddingLeft:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:9, fontWeight:800, color:'#f59e0b' }}>📝 TUGAS</span>
                    <span style={{ fontSize:8, background:'#f1f5f9', padding:'2px 6px', borderRadius:4, color:'#64748b' }}>
                      {fileTypeInfo.icon} {fileTypeInfo.label}
                    </span>
                  </div>
                  <h3 style={{ fontSize:isMobile?16:20, margin:0, color:'#0f172a', fontWeight:800 }}>
                    {block.title}
                  </h3>
                </div>
                <div style={{ 
                  lineHeight:1.8, color:'#334155', fontSize:isMobile?14:16, 
                  whiteSpace:'pre-wrap', marginBottom:15 
                }}>
                  {block.content}
                </div>

                {timeRem && (
                  <div style={{ 
                    padding:10, borderRadius:8, marginBottom:15, 
                    display:'flex', alignItems:'center', gap:8, 
                    fontWeight:700, fontSize:12, 
                    background:timeRem.color+'15', color:timeRem.color 
                  }}>
                    <Clock size={14} /> {timeRem.text}
                  </div>
                )}

                {/* Text Answer Input */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>
                    ✍️ Tulis Jawaban (Opsional)
                  </label>
                  <textarea 
                    value={textAnswers[block.id] || ''}
                    onChange={(e) => setTextAnswers({...textAnswers, [block.id]: e.target.value})}
                    placeholder="Tulis jawaban di sini..."
                    disabled={isSubmitted || isExpired}
                    style={{ 
                      width:'100%', padding:10, borderRadius:8, border:'1px solid #e2e8f0',
                      fontSize:13, fontFamily:'inherit', resize:'vertical', minHeight:60,
                      background: isSubmitted ? '#f8fafc' : 'white',
                      color: isSubmitted ? '#94a3b8' : '#1e293b'
                    }}
                  />
                </div>

                {isSubmitted ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ 
                      color:'#059669', fontWeight:700, background:'#dcfce7', 
                      padding:10, borderRadius:8, display:'flex', alignItems:'center', gap:6, fontSize:12 
                    }}>
                      <CheckCircle size={16} /> Terkumpul
                    </div>
                    {submission.textAnswer && (
                      <div style={{ background:'#f8fafc', padding:8, borderRadius:6, fontSize:12, color:'#475569' }}>
                        <span style={{ fontWeight:600 }}>Jawaban:</span> {submission.textAnswer}
                      </div>
                    )}
                    {submission.fileUrl && (
                      <a href={submission.fileUrl} target="_blank" rel="noreferrer" style={{ 
                        background:'#f1f5f9', color:'#64748b', padding:10, borderRadius:8, 
                        fontSize:12, fontWeight:600, textDecoration:'none', textAlign:'center', 
                        display:'flex', alignItems:'center', justifyContent:'center', gap:6 
                      }}>
                        <Eye size={14} /> Lihat File
                      </a>
                    )}
                    {!isExpired && (
                      <button onClick={() => handleDeleteTask(block.id)} style={{ 
                        background:'#fee2e2', color:'#ef4444', border:'none', 
                        padding:10, borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' 
                      }}>
                        Tarik Data
                      </button>
                    )}
                  </div>
                ) : isExpired ? (
                  <div style={{ 
                    color:'#ef4444', fontWeight:700, background:'#fee2e2', 
                    padding:10, borderRadius:8, textAlign:'center', fontSize:12 
                  }}>
                    ⛔ Deadline Terlewat
                  </div>
                ) : (
                  <div>
                    <label style={{ 
                      display:'block', background:'#f59e0b', color:'white', 
                      padding:12, borderRadius:8, textAlign:'center', 
                      fontWeight:700, fontSize:12, cursor:'pointer' 
                    }}>
                      📎 {fileTypeInfo.icon} Pilih File ({fileTypeInfo.label})
                      <input 
                        type="file" 
                        accept={fileTypeInfo.accept} 
                        hidden 
                        onChange={(e) => handleFileChange(e, block.id)} 
                      />
                    </label>
                    {localFiles[block.id] && (
                      <div style={{ marginTop:8, fontSize:11, color:'#10b981', display:'flex', alignItems:'center', gap:6 }}>
                        <CheckCircle size={14} /> {localFiles[block.id].name} siap diupload
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ===== KONTEN KUIS AKTIF ===== */}
          {activeTab === 'kuis' && modul?.quizData?.length > 0 && (
            <div style={{ 
              background:'white', padding:isMobile?18:25, borderRadius:isMobile?14:18, 
              marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.03)', 
              border:'1px solid #f1f5f9', borderTop:'4px solid '+(isQuizExpired?'#ef4444':'#673ab7') 
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ background:'#673ab7', padding:10, borderRadius:12 }}>
                  <HelpCircle size={20} color="white"/>
                </div>
                <div>
                  <h2 style={{ margin:0, fontSize:isMobile?16:20 }}>Kuis Evaluasi</h2>
                  {modul.deadlineQuiz && (
                    <p style={{ margin:0, fontSize:11, color:isQuizExpired?'#ef4444':'#64748b' }}>
                      {getTimeRemaining(modul.deadlineQuiz, currentTime)?.text || 'Deadline: '+formatDate(modul.deadlineQuiz)}
                    </p>
                  )}
                </div>
              </div>
              {modul.quizData.map((q, qIdx) => (
                <div key={q.id} style={{ marginBottom:18 }}>
                  <p style={{ fontSize:isMobile?14:16, fontWeight:800, color:'#1e293b', display:'flex', gap:10, flexDirection:'column' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ 
                        background:'#f1f5f9', color:'#673ab7', minWidth:28, height:28, 
                        borderRadius:8, display:'flex', alignItems:'center', 
                        justifyContent:'center', fontSize:13, flexShrink:0 
                      }}>
                        {qIdx+1}
                      </span>
                      {q.question}
                    </span>
                    {q.questionImage && (
                      <img 
                        src={q.questionImage} 
                        alt="Gambar Soal" 
                        style={{ 
                          maxWidth:'100%', maxHeight:isMobile?200:300, objectFit:'contain', 
                          borderRadius:10, border:'1px solid #e2e8f0', marginTop:8, cursor:'pointer' 
                        }}
                        onClick={() => setPreviewImage(q.questionImage)}
                      />
                    )}
                  </p>
                  <div style={{ display:'grid', gap:6, marginTop:8 }}>
                    {q.options.map((opt, oIdx) => {
                      const optionImage = q.optionImages?.[oIdx];
                      return (
                        <button 
                          key={oIdx} 
                          disabled={quizSubmitted || isQuizExpired} 
                          onClick={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})}
                          style={{
                            padding: isMobile?'10px 14px':'12px 16px', 
                            borderRadius:10, border:'2px solid', textAlign:'left', 
                            fontSize:isMobile?13:14, fontWeight:700, cursor:'pointer',
                            background: quizAnswers[q.id]===oIdx?'#673ab7':'#f8fafc', 
                            color: quizAnswers[q.id]===oIdx?'white':'#1e293b', 
                            borderColor: quizAnswers[q.id]===oIdx?'#673ab7':'#e2e8f0',
                            display:'flex', flexDirection:'column', gap:6
                          }}
                        >
                          <span style={{display:'flex', alignItems:'center', gap:6}}>
                            <span style={{ opacity:0.6, minWidth:20 }}>
                              {String.fromCharCode(65+oIdx)}.
                            </span> {opt}
                          </span>
                          {optionImage && (
                            <img 
                              src={optionImage} 
                              alt={`Opsi ${String.fromCharCode(65+oIdx)}`}
                              style={{ 
                                maxWidth:'100%', maxHeight:isMobile?120:180, objectFit:'contain', 
                                borderRadius:8, border:'1px solid rgba(255,255,255,0.3)',
                                marginLeft:26, marginTop:4 
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{ marginTop:15 }}>
                {!quizSubmitted && !isQuizExpired ? (
                  <button onClick={handleQuizSubmit} style={{ 
                    width:'100%', padding:14, borderRadius:12, border:'none', 
                    background:'#673ab7', color:'white', fontWeight:800, fontSize:15, cursor:'pointer' 
                  }}>
                    Kirim Jawaban Kuis
                  </button>
                ) : (
                  <div style={{ 
                    textAlign:'center', padding:14, background:'#f0fdf4', 
                    color:'#15803d', borderRadius:12, fontWeight:700, fontSize:13 
                  }}>
                    <CheckCircle size={18} /> {quizSubmitted ? 'Kuis Selesai' : 'Waktu Habis'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL PREVIEW GAMBAR FULLSCREEN */}
        {previewImage && (
          <div 
            onClick={() => setPreviewImage(null)}
            style={{ 
              position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999,
              display:'flex', alignItems:'center', justifyContent:'center', padding:20, cursor:'pointer' 
            }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
              style={{ 
                position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.2)', 
                color:'white', border:'none', borderRadius:'50%', width:40, height:40, 
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 
              }}
            ><X size={24}/></button>
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{ maxWidth:'95%', maxHeight:'90vh', objectFit:'contain', borderRadius:12 }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* MODAL PREVIEW SEBELUM UPLOAD */}
        {showPreviewModal && pendingFile && (
          <FilePreviewBeforeUpload 
            file={pendingFile}
            onConfirm={handleConfirmUpload}
            onCancel={handleCancelUpload}
            uploading={uploading[pendingBlockId] || false}
          />
        )}

        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc'
  },
  mainContent: {
    flex: 1,
    marginLeft: 0,
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease',
    overflowX: 'hidden'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '70vh',
    gap: 16
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #652D90',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  mobileHeader: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  mobileTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e293b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '60%'
  }
};

export default StudentModuleView;