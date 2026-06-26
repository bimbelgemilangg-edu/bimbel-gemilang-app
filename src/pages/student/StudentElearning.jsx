// src/pages/student/StudentElearning.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase';
import { 
  collection, getDocs, doc, getDoc, updateDoc, addDoc, 
  serverTimestamp, query, orderBy, where, deleteDoc, runTransaction 
} from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Clock, ChevronLeft, ChevronRight, FileText, 
  Video, Link as LinkIcon, Calendar, User, Send, 
  CheckCircle, XCircle, AlertCircle, Download, Eye, 
  ExternalLink, FileQuestion, Award, ChevronDown, ChevronUp,
  Search, Filter, Layers, FolderOpen, Star, TrendingUp,
  MessageSquare, Paperclip, Upload, X, Menu, Home, Grid3x3, List,
  Image as ImageIcon, Play, File, HelpCircle, Hash, Tag,
  UserCheck, GraduationCap, Sparkles, Zap, Shield, Database,
  BarChart3, Activity, PieChart, Bell, BellOff, Clock4,
  CalendarDays, Timer, Award as AwardIcon, Trophy, Medal,
  Flame, Target, Compass, MapPin, Rocket, Coffee, Sun,
  Moon, Cloud, CloudRain, Snowflake, Wind, Droplets
} from 'lucide-react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { uploadElearningFile, deleteFile, supabase } from '../../services/uploadService';

// ============================================================
// CONSTANTS
// ============================================================
const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  PDF: ['application/pdf'],
  DOC: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

const STATUS_COLORS = {
  not_submitted: { bg: '#fee2e2', color: '#ef4444', label: 'Belum' },
  submitted: { bg: '#fef3c7', color: '#f59e0b', label: 'Terkirim' },
  graded: { bg: '#dcfce7', color: '#10b981', label: 'Dinilai' }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const formatDate = (date) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('id-ID', { 
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getTimeRemaining = (deadline) => {
  if (!deadline) return null;
  const dl = new Date(deadline);
  const now = new Date();
  const diff = dl - now;
  if (diff <= 0) return { text: '⛔ Terlewat', color: '#ef4444', isExpired: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return { text: `⏳ ${days}d ${hours % 24}j lagi`, color: days <= 1 ? '#f59e0b' : '#10b981', isExpired: false };
  return { text: `⚠️ ${hours}j lagi`, color: '#f59e0b', isExpired: false };
};

const getInitials = (name) => {
  if (!name) return 'S';
  return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
};

// ============================================================
// SUB-COMPONENTS
// ============================================================
const FilePreviewModal = ({ file, onClose }) => {
  if (!file) return null;
  const isImage = FILE_TYPES.IMAGE.some(t => file.type?.includes(t) || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  const isPDF = FILE_TYPES.PDF.some(t => file.type?.includes(t) || file.url?.match(/\.pdf$/i));
  
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={modalStyles.closeBtn}><X size={20} /></button>
        <h4 style={modalStyles.title}>{file.name || 'Preview'}</h4>
        <div style={modalStyles.body}>
          {isImage && <img src={file.url} alt={file.name} style={modalStyles.image} />}
          {isPDF && (
            <iframe 
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`} 
              style={modalStyles.iframe} 
              title="PDF Preview" 
            />
          )}
          {!isImage && !isPDF && (
            <div style={modalStyles.fallback}>
              <File size={48} color="#94a3b8" />
              <p>Tidak dapat preview file ini</p>
              <a href={file.url} download style={modalStyles.downloadBtn}>
                <Download size={16} /> Unduh File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, backdropFilter: 'blur(4px)'
  },
  content: {
    background: 'white', borderRadius: 16, maxWidth: '90vw', maxHeight: '90vh',
    width: '100%', maxWidth: 900, overflow: 'hidden', position: 'relative'
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.95)',
    border: 'none', borderRadius: '50%', width: 36, height: 36,
    cursor: 'pointer', zIndex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: { padding: '16px 20px', margin: 0, fontSize: 14, fontWeight: 700, borderBottom: '1px solid #e2e8f0' },
  body: { padding: 20, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: { maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' },
  iframe: { width: '100%', height: '70vh', border: 'none' },
  fallback: { textAlign: 'center', padding: 40, color: '#94a3b8' },
  downloadBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: '#3b82f6', color: 'white', padding: '10px 20px',
    borderRadius: 8, textDecoration: 'none', marginTop: 12
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentElearning = () => {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterMapel, setFilterMapel] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // ===== STUDENT DATA (BERBASIS ID) =====
  const [studentId, setStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [studentKelas, setStudentKelas] = useState("");
  const [studentKategori, setStudentKategori] = useState("");
  const [studentNim, setStudentNim] = useState("");
  
  // ===== SUBMISSIONS =====
  const [submissions, setSubmissions] = useState({});
  const [quizSubmissions, setQuizSubmissions] = useState({});
  
  // ===== MODALS =====
  const [previewFile, setPreviewFile] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [assignmentAnswer, setAssignmentAnswer] = useState("");
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [activeTab, setActiveTab] = useState('materi');
  
  // ===== STATS =====
  const [stats, setStats] = useState({
    totalModules: 0,
    totalAssignments: 0,
    submittedAssignments: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    avgScore: 0
  });

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ambil data siswa dari localStorage & Firestore
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const sId = localStorage.getItem('studentId');
        const sName = localStorage.getItem('studentName');
        
        setStudentId(sId);
        setStudentName(sName || "Siswa");
        
        if (sId) {
          const docSnap = await getDoc(doc(db, "students", sId));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStudentData({ id: sId, ...data });
            setStudentKelas(data.kelasSekolah || "");
            setStudentKategori(data.kategori || "Reguler");
            setStudentNim(data.studentId || data.nim || sId);
          }
        }
      } catch (error) {
        console.error("Error load student data:", error);
      }
    };
    loadStudentData();
  }, []);

  // Fetch modules setelah data siswa siap
  useEffect(() => {
    if (studentKategori && studentKelas) {
      fetchModules();
    }
  }, [studentKategori, studentKelas]);

  // Filter modules
  useEffect(() => {
    let filtered = modules;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.title?.toLowerCase().includes(term) ||
        m.subject?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term)
      );
    }
    
    if (filterType === 'module') {
      filtered = filtered.filter(m => m.type !== 'kuis_mandiri');
    } else if (filterType === 'quiz') {
      filtered = filtered.filter(m => m.type === 'kuis_mandiri');
    } else if (filterType === 'assignment') {
      filtered = filtered.filter(m => m.blocks?.some(b => b.type === 'assignment'));
    }
    
    if (filterMapel !== 'all') {
      filtered = filtered.filter(m => m.subject === filterMapel || m.kodeMapel === filterMapel);
    }
    
    setFilteredModules(filtered);
  }, [searchTerm, filterType, filterMapel, modules]);

  // Auto-select module from URL param
  useEffect(() => {
    const selectedModuleId = localStorage.getItem('selectedModuleId');
    if (selectedModuleId && modules.length > 0) {
      const target = modules.find(m => m.id === selectedModuleId);
      if (target) setSelectedModule(target);
      localStorage.removeItem('selectedModuleId');
    }
  }, [modules]);

  // ============================================================
  // FETCH FUNCTIONS (BERBASIS ID UNIK)
  // ============================================================
  const fetchModules = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "bimbel_modul"),
        where("status", "==", "aktif"),
        orderBy("updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      
      let allModules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      allModules = allModules.filter(module => {
        const targetKategori = module.targetKategori || "Semua";
        const targetKelas = module.targetKelas || "Semua";
        const kategoriMatch = targetKategori === "Semua" || targetKategori === studentKategori;
        const kelasMatch = targetKelas === "Semua" || targetKelas === studentKelas;
        return kategoriMatch && kelasMatch;
      });
      
      allModules = allModules.filter(module => {
        if (module.sendToSpecificStudents && module.selectedStudents?.length > 0) {
          return module.selectedStudents.some(s => 
            s.studentId === studentNim || s.id === studentId
          );
        }
        return true;
      });
      
      setModules(allModules);
      setFilteredModules(allModules);
      
      if (studentId) await fetchSubmissions(studentId);
      if (studentId) await fetchQuizSubmissions(studentId);
      
      const assignments = allModules.filter(m => m.blocks?.some(b => b.type === 'assignment'));
      const quizzes = allModules.filter(m => m.quizData?.length > 0);
      
      setStats({
        totalModules: allModules.length,
        totalAssignments: assignments.length,
        submittedAssignments: Object.keys(submissions).length,
        totalQuizzes: quizzes.length,
        completedQuizzes: Object.keys(quizSubmissions).length,
        avgScore: 0
      });
      
    } catch (error) {
      console.error("Error fetch modules:", error);
      const snapshot = await getDocs(collection(db, "bimbel_modul"));
      let allModules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allModules = allModules.filter(m => m.status === "aktif");
      setModules(allModules);
      setFilteredModules(allModules);
    }
    setLoading(false);
  };

  const fetchSubmissions = async (sId) => {
    try {
      const q = query(
        collection(db, "jawaban_tugas"),
        where("studentId", "==", sId)
      );
      const snapshot = await getDocs(q);
      const submissionsMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        submissionsMap[data.modulId] = { id: doc.id, ...data };
      });
      setSubmissions(submissionsMap);
    } catch (error) {
      console.error("Error fetch submissions:", error);
    }
  };

  const fetchQuizSubmissions = async (sId) => {
    try {
      const q = query(
        collection(db, "jawaban_kuis"),
        where("studentId", "==", sId)
      );
      const snapshot = await getDocs(q);
      const submissionsMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        submissionsMap[data.modulId] = { id: doc.id, ...data };
      });
      setQuizSubmissions(submissionsMap);
    } catch (error) {
      console.error("Error fetch quiz submissions:", error);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleModuleClick = (module) => {
    setSelectedModule(module);
    setActiveTab('materi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedModule(null);
    setActiveTab('materi');
  };

  const handlePreviewFile = (url, name, type) => {
    setPreviewFile({ url, name, type });
  };

  // ============================================================
  // SUBMIT ASSIGNMENT (DENGAN SUPABASE UPLOAD)
  // ============================================================
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;
    if (!assignmentAnswer && !assignmentFile) {
      return alert("❌ Harap isi jawaban atau upload file!");
    }
    
    setSubmitting(true);
    try {
      let fileUrl = null, filePath = null, fileName = null;
      
      if (assignmentFile) {
        const result = await uploadElearningFile(assignmentFile, 'tugas');
        if (!result.success) throw new Error(result.error);
        fileUrl = result.downloadURL;
        filePath = result.filePath;
        fileName = assignmentFile.name;
      }
      
      await addDoc(collection(db, "jawaban_tugas"), {
        modulId: selectedModule.id,
        modulTitle: selectedModule.title,
        blockId: selectedAssignment.id,
        blockTitle: selectedAssignment.title,
        studentId: studentId,
        studentName: studentName,
        studentNim: studentNim,
        studentKelas: studentKelas,
        question: selectedAssignment.content,
        answer: assignmentAnswer,
        fileUrl,
        filePath,
        fileName,
        status: "Pending",
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      alert("✅ Tugas berhasil dikirim!");
      setSelectedAssignment(null);
      setAssignmentAnswer("");
      setAssignmentFile(null);
      await fetchSubmissions(studentId);
      
    } catch (error) {
      console.error("Submit error:", error);
      alert("❌ Gagal mengirim tugas: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RENDER: MODULE CARD
  // ============================================================
  const renderModuleCard = (module) => {
    const isQuiz = module.type === 'kuis_mandiri';
    const hasAssignment = module.blocks?.some(b => b.type === 'assignment');
    const hasQuiz = module.quizData?.length > 0;
    const submission = submissions[module.id];
    const quizSub = quizSubmissions[module.id];
    const coverImage = module.coverImage || module.imageUrl || null;
    const isSubmitted = !!submission;
    const isQuizDone = !!quizSub;
    const status = submission?.status || 'not_submitted';
    const statusInfo = STATUS_COLORS[status] || STATUS_COLORS.not_submitted;

    return (
      <div 
        key={module.id} 
        onClick={() => handleModuleClick(module)}
        style={cardStyles.card}
      >
        <div style={cardStyles.cover}>
          {coverImage ? (
            <img src={coverImage} alt={module.title} style={cardStyles.coverImage} />
          ) : (
            <div style={cardStyles.coverPlaceholder}>
              {isQuiz ? <FileQuestion size={40} color="#8b5cf6" /> : <BookOpen size={40} color="#3b82f6" />}
            </div>
          )}
          
          <div style={cardStyles.badgeTop}>
            {isQuiz ? (
              <span style={{...cardStyles.badge, background: '#8b5cf6', color: 'white' }}>
                <FileQuestion size={10} /> Kuis
              </span>
            ) : (
              <span style={{...cardStyles.badge, background: '#3b82f6', color: 'white' }}>
                <BookOpen size={10} /> Modul
              </span>
            )}
          </div>
          
          {isSubmitted && (
            <span style={{...cardStyles.badgeStatus, background: statusInfo.bg, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          )}
          
          {isQuizDone && (
            <span style={{...cardStyles.badgeStatus, background: '#dcfce7', color: '#10b981' }}>
              ✅ Selesai
            </span>
          )}
          
          {module.guruId && (
            <span style={cardStyles.idBadge}>
              <Hash size={8} /> {module.guruId}
            </span>
          )}
        </div>
        
        <div style={cardStyles.body}>
          <h3 style={cardStyles.title}>{module.title}</h3>
          <div style={cardStyles.subject}>
            <BookOpen size={12} /> {module.subject || 'Materi'}
            {module.kodeMapel && <span style={cardStyles.mapelTag}><Tag size={8} /> {module.kodeMapel}</span>}
          </div>
          
          <div style={cardStyles.meta}>
            {hasAssignment && <span style={cardStyles.metaItem}><Send size={10} /> Tugas</span>}
            {hasQuiz && <span style={cardStyles.metaItem}><HelpCircle size={10} /> Kuis</span>}
            {module.totalKonten > 0 && <span style={cardStyles.metaItem}><Layers size={10} /> {module.totalKonten}</span>}
          </div>
          
          <button style={cardStyles.btn}>
            Buka <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  const cardStyles = {
    card: {
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #f1f5f9',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    cover: {
      position: 'relative',
      height: 140,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden',
      flexShrink: 0
    },
    coverImage: { width: '100%', height: '100%', objectFit: 'cover' },
    coverPlaceholder: {
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    badgeTop: {
      position: 'absolute', top: 10, left: 10,
      display: 'flex', gap: 4, flexWrap: 'wrap'
    },
    badge: {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 12,
      fontSize: 9, fontWeight: 700,
      backdropFilter: 'blur(4px)'
    },
    badgeStatus: {
      position: 'absolute', top: 10, right: 10,
      padding: '2px 10px', borderRadius: 12,
      fontSize: 9, fontWeight: 700,
      backdropFilter: 'blur(4px)'
    },
    idBadge: {
      position: 'absolute', bottom: 10, left: 10,
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 8px', borderRadius: 10,
      fontSize: 8, color: '#3b82f6',
      background: 'rgba(255,255,255,0.9)',
      fontWeight: 600
    },
    body: { padding: 14, flex: 1, display: 'flex', flexDirection: 'column' },
    title: { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', lineHeight: 1.3 },
    subject: {
      fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4,
      marginBottom: 8
    },
    mapelTag: {
      fontSize: 8, color: '#8b5cf6', background: '#ede9fe',
      padding: '1px 6px', borderRadius: 4,
      display: 'inline-flex', alignItems: 'center', gap: 2
    },
    meta: {
      display: 'flex', gap: 6, flexWrap: 'wrap',
      marginBottom: 10, marginTop: 'auto'
    },
    metaItem: {
      fontSize: 9, padding: '2px 8px', borderRadius: 10,
      background: '#f1f5f9', color: '#64748b',
      display: 'inline-flex', alignItems: 'center', gap: 3
    },
    btn: {
      width: '100%', padding: 8,
      background: '#3b82f6', color: 'white',
      border: 'none', borderRadius: 8,
      fontSize: 11, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
    }
  };

  // ============================================================
  // RENDER: MODULE DETAIL
  // ============================================================
  const renderModuleDetail = () => {
    if (!selectedModule) return null;
    
    const assignments = selectedModule.blocks?.filter(b => b.type === 'assignment') || [];
    const materials = selectedModule.blocks?.filter(b => b.type !== 'assignment') || [];
    const hasQuiz = selectedModule.quizData?.length > 0;
    const coverImage = selectedModule.coverImage || selectedModule.imageUrl || null;
    const submission = submissions[selectedModule.id];
    const isSubmitted = !!submission;
    const quizSub = quizSubmissions[selectedModule.id];
    const isQuizDone = !!quizSub;

    return (
      <div style={detailStyles.container}>
        <div style={detailStyles.header}>
          <button onClick={handleBack} style={detailStyles.backBtn}>
            <ChevronLeft size={20} /> Kembali
          </button>
          <div style={detailStyles.titleSection}>
            <h1 style={detailStyles.title}>{selectedModule.title}</h1>
            <div style={detailStyles.meta}>
              <span style={detailStyles.metaItem}>
                <BookOpen size={14} /> {selectedModule.subject || 'Materi'}
              </span>
              {selectedModule.kodeMapel && (
                <span style={{...detailStyles.metaItem, background: '#ede9fe', color: '#8b5cf6' }}>
                  <Tag size={12} /> {selectedModule.kodeMapel}
                </span>
              )}
              {selectedModule.guruId && (
                <span style={{...detailStyles.metaItem, background: '#eef2ff', color: '#3b82f6' }}>
                  <Hash size={12} /> {selectedModule.guruId}
                </span>
              )}
              <span style={detailStyles.metaItem}>
                <User size={12} /> {selectedModule.guruName || selectedModule.authorName || 'Guru'}
              </span>
            </div>
          </div>
        </div>

        {coverImage && (
          <div style={detailStyles.cover}>
            <img src={coverImage} alt={selectedModule.title} style={detailStyles.coverImage} />
          </div>
        )}

        {selectedModule.description && (
          <div style={detailStyles.desc}>
            <p>{selectedModule.description}</p>
          </div>
        )}

        <div style={detailStyles.tabs}>
          <button 
            onClick={() => setActiveTab('materi')}
            style={{...detailStyles.tab, background: activeTab === 'materi' ? '#3b82f6' : '#f1f5f9', color: activeTab === 'materi' ? 'white' : '#64748b' }}
          >
            <BookOpen size={14} /> Materi ({materials.length})
          </button>
          {assignments.length > 0 && (
            <button 
              onClick={() => setActiveTab('tugas')}
              style={{...detailStyles.tab, background: activeTab === 'tugas' ? '#f59e0b' : '#f1f5f9', color: activeTab === 'tugas' ? 'white' : '#64748b' }}
            >
              <Send size={14} /> Tugas ({assignments.length})
            </button>
          )}
          {hasQuiz && (
            <button 
              onClick={() => setActiveTab('kuis')}
              style={{...detailStyles.tab, background: activeTab === 'kuis' ? '#8b5cf6' : '#f1f5f9', color: activeTab === 'kuis' ? 'white' : '#64748b' }}
            >
              <HelpCircle size={14} /> Kuis {isQuizDone ? '✅' : ''}
            </button>
          )}
        </div>

        <div style={detailStyles.content}>
          
          {activeTab === 'materi' && materials.map((block, idx) => (
            <div key={block.id} style={detailStyles.block}>
              <div style={detailStyles.blockHeader}>
                <span style={detailStyles.blockType}>
                  {block.type === 'text' ? '📄' : block.type === 'file' ? '📁' : block.type === 'video' ? '🎥' : '📝'}
                  {' '}{block.type?.toUpperCase() || 'MATERI'}
                </span>
                <h3 style={detailStyles.blockTitle}>{block.title || `Bagian ${idx + 1}`}</h3>
              </div>
              
              {block.type === 'text' && (
                <div style={detailStyles.textContent}>{block.content}</div>
              )}
              
              {block.type === 'file' && block.content && (
                <div style={detailStyles.fileBlock}>
                  <div style={detailStyles.fileInfo}>
                    <FileText size={24} color="#3b82f6" />
                    <span>{block.fileName || 'File'}</span>
                    {block.fileSize && <span style={detailStyles.fileSize}>{(block.fileSize / 1024).toFixed(1)} KB</span>}
                  </div>
                  <div style={detailStyles.fileActions}>
                    <button onClick={() => handlePreviewFile(block.content, block.fileName, block.mimeType)} style={detailStyles.previewBtn}>
                      <Eye size={14} /> Preview
                    </button>
                    <a href={block.content} download style={detailStyles.downloadBtn}>
                      <Download size={14} /> Unduh
                    </a>
                  </div>
                </div>
              )}
              
              {block.type === 'video' && block.content && (
                <div style={detailStyles.videoBlock}>
                  {block.content.includes('youtube.com') || block.content.includes('youtu.be') ? (
                    <iframe 
                      src={`https://www.youtube.com/embed/${block.content.split('v=')[1]?.split('&')[0] || block.content.split('/').pop()}`}
                      style={detailStyles.videoIframe}
                      allowFullScreen
                      title="Video"
                    />
                  ) : (
                    <a href={block.content} target="_blank" rel="noopener noreferrer" style={detailStyles.linkExternal}>
                      <ExternalLink size={16} /> Buka Link Video
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}

          {activeTab === 'tugas' && assignments.map((block) => {
            const timeRem = getTimeRemaining(block.endTime);
            const isExpired = timeRem?.isExpired || false;
            const isSubmitted = !!submissions[selectedModule.id];
            
            return (
              <div key={block.id} style={{...detailStyles.block, borderLeft: '4px solid #f59e0b' }}>
                <div style={detailStyles.blockHeader}>
                  <span style={{...detailStyles.blockType, color: '#f59e0b' }}>📝 TUGAS</span>
                  <h3 style={detailStyles.blockTitle}>{block.title}</h3>
                </div>
                
                <div style={detailStyles.textContent}>{block.content}</div>
                
                {timeRem && (
                  <div style={{...detailStyles.deadline, color: timeRem.color, background: timeRem.color + '15' }}>
                    <Clock size={14} /> {timeRem.text}
                  </div>
                )}
                
                {isSubmitted ? (
                  <div style={detailStyles.submittedBox}>
                    <CheckCircle size={16} color="#10b981" />
                    <span>Tugas telah dikirim</span>
                    <button 
                      onClick={() => {
                        const sub = submissions[selectedModule.id];
                        if (sub?.fileUrl) handlePreviewFile(sub.fileUrl, sub.fileName);
                      }}
                      style={detailStyles.viewSubmitBtn}
                    >
                      <Eye size={14} /> Lihat
                    </button>
                  </div>
                ) : isExpired ? (
                  <div style={{...detailStyles.submittedBox, background: '#fee2e2', color: '#ef4444' }}>
                    <XCircle size={16} /> Deadline terlewat
                  </div>
                ) : (
                  <button 
                    onClick={() => setSelectedAssignment(block)}
                    style={detailStyles.submitBtn}
                  >
                    <Send size={14} /> Kumpulkan Tugas
                  </button>
                )}
              </div>
            );
          })}

          {activeTab === 'kuis' && hasQuiz && (
            <div style={{...detailStyles.block, borderLeft: '4px solid #8b5cf6' }}>
              <div style={detailStyles.blockHeader}>
                <span style={{...detailStyles.blockType, color: '#8b5cf6' }}>❓ KUIS</span>
                <h3 style={detailStyles.blockTitle}>Evaluasi Pembelajaran</h3>
              </div>
              
              <div style={detailStyles.quizInfo}>
                <span>📝 {selectedModule.quizData?.length || 0} soal</span>
                {selectedModule.deadlineQuiz && (
                  <span>⏰ Deadline: {formatDate(selectedModule.deadlineQuiz)}</span>
                )}
              </div>
              
              {isQuizDone ? (
                <div style={detailStyles.submittedBox}>
                  <CheckCircle size={16} color="#10b981" />
                  <span>Kuis selesai! Nilai: {quizSub?.score || 0}</span>
                  <button onClick={() => navigate(`/siswa/kuis/${selectedModule.id}`)} style={detailStyles.viewSubmitBtn}>
                    <Eye size={14} /> Detail
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => navigate(`/siswa/kuis/${selectedModule.id}`)}
                  style={{...detailStyles.submitBtn, background: '#8b5cf6' }}
                >
                  <HelpCircle size={14} /> Mulai Kuis
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const detailStyles = {
    container: { width: '100%', maxWidth: 900, margin: '0 auto' },
    header: { marginBottom: 24 },
    backBtn: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'white', border: '1px solid #e2e8f0',
      padding: '8px 16px', borderRadius: 10,
      cursor: 'pointer', fontSize: 13, fontWeight: 600,
      marginBottom: 12
    },
    titleSection: { marginTop: 4 },
    title: { fontSize: 24, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' },
    meta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    metaItem: {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, color: '#64748b', background: '#f1f5f9',
      padding: '3px 10px', borderRadius: 6
    },
    cover: { borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
    coverImage: { width: '100%', maxHeight: 200, objectFit: 'cover' },
    desc: { background: '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 13, color: '#475569', lineHeight: 1.6 },
    tabs: { display: 'flex', gap: 4, background: 'white', padding: 4, borderRadius: 12, marginBottom: 20, border: '1px solid #e2e8f0' },
    tab: {
      flex: 1, padding: '8px 12px', borderRadius: 8,
      border: 'none', fontWeight: 700, fontSize: 11,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
    },
    content: { display: 'flex', flexDirection: 'column', gap: 12 },
    block: { background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' },
    blockHeader: { marginBottom: 12 },
    blockType: { fontSize: 9, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' },
    blockTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '4px 0 0' },
    textContent: { fontSize: 14, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
    fileBlock: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, background: '#f8fafc', borderRadius: 8 },
    fileInfo: { display: 'flex', alignItems: 'center', gap: 8 },
    fileSize: { fontSize: 10, color: '#94a3b8' },
    fileActions: { display: 'flex', gap: 6 },
    previewBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#eef2ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#3b82f6' },
    downloadBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#64748b', textDecoration: 'none' },
    videoBlock: { borderRadius: 8, overflow: 'hidden' },
    videoIframe: { width: '100%', height: 300, border: 'none' },
    linkExternal: { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 },
    deadline: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, marginTop: 8 },
    submittedBox: { display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#dcfce7', borderRadius: 8, marginTop: 8, fontSize: 12, fontWeight: 600, color: '#166534' },
    viewSubmitBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, marginLeft: 'auto' },
    submitBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f59e0b', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 8 },
    quizInfo: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748b', marginBottom: 12 }
  };

  // ============================================================
  // RENDER: SUBMIT ASSIGNMENT MODAL
  // ============================================================
  const renderSubmitModal = () => {
    if (!selectedAssignment) return null;
    
    return (
      <div style={modalStyles.overlay} onClick={() => setSelectedAssignment(null)}>
        <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📝 Kumpulkan Tugas</h3>
            <button onClick={() => setSelectedAssignment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Soal/Instruksi</label>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>{selectedAssignment.content}</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Jawaban Anda</label>
              <textarea 
                value={assignmentAnswer} 
                onChange={(e) => setAssignmentAnswer(e.target.value)} 
                placeholder="Tulis jawaban di sini..." 
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Upload File (Opsional)</label>
              <div style={{ border: '2px dashed #e2e8f0', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer' }}>
                <input 
                  type="file" 
                  id="assignmentFile" 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                  onChange={(e) => setAssignmentFile(e.target.files[0])} 
                  style={{ display: 'none' }} 
                />
                <label htmlFor="assignmentFile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <Upload size={24} color="#94a3b8" />
                  <span style={{ fontSize: 13, color: '#64748b' }}>{assignmentFile ? assignmentFile.name : 'Klik untuk upload file'}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>PDF, DOC, DOCX, JPG, PNG (Max 10MB)</span>
                </label>
              </div>
              {assignmentFile && (
                <button onClick={() => setAssignmentFile(null)} style={{ marginTop: 8, background: '#fee2e2', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>
                  <X size={12} /> Hapus File
                </button>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={() => setSelectedAssignment(null)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
            <button onClick={handleSubmitAssignment} disabled={submitting} style={{ padding: '10px 24px', background: '#10b981', border: 'none', borderRadius: 8, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
              {submitting ? 'Mengirim...' : 'Kirim Tugas'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: MAIN
  // ============================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #652D90', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Memuat materi pembelajaran...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (selectedModule) {
    return (
      <>
        {renderModuleDetail()}
        {renderSubmitModal()}
        {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      </>
    );
  }

  // ============================================================
  // RENDER: MODULE LIST
  // ============================================================
  const subjects = useMemo(() => {
    const mapelSet = new Set();
    modules.forEach(m => {
      if (m.subject) mapelSet.add(m.subject);
      if (m.kodeMapel) mapelSet.add(m.kodeMapel);
    });
    return ['all', ...Array.from(mapelSet)];
  }, [modules]);

  return (
    <div style={listStyles.container}>
      <div style={listStyles.header}>
        <div>
          <h1 style={listStyles.title}>
            <BookOpen size={28} color="#652D90" /> E-Learning
          </h1>
          <p style={listStyles.subtitle}>
            {studentName} • {studentKategori} • Kelas {studentKelas}
            {studentNim && <span style={listStyles.nimBadge}><Hash size={10} /> {studentNim}</span>}
          </p>
        </div>
        <div style={listStyles.viewToggle}>
          <button onClick={() => setViewMode('grid')} style={{...listStyles.viewBtn, background: viewMode === 'grid' ? '#652D90' : '#f1f5f9', color: viewMode === 'grid' ? 'white' : '#64748b' }}>
            <Grid3x3 size={16} />
          </button>
          <button onClick={() => setViewMode('list')} style={{...listStyles.viewBtn, background: viewMode === 'list' ? '#652D90' : '#f1f5f9', color: viewMode === 'list' ? 'white' : '#64748b' }}>
            <List size={16} />
          </button>
        </div>
      </div>

      <div style={listStyles.statsRow}>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.totalModules}</span>
          <span style={listStyles.statLabel}>📚 Modul</span>
        </div>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.totalAssignments}</span>
          <span style={listStyles.statLabel}>📝 Tugas</span>
        </div>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.submittedAssignments}/{stats.totalAssignments}</span>
          <span style={listStyles.statLabel}>✅ Terkirim</span>
        </div>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.totalQuizzes}</span>
          <span style={listStyles.statLabel}>❓ Kuis</span>
        </div>
      </div>

      <div style={listStyles.filterBar}>
        <div style={listStyles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari materi, mapel, atau ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={listStyles.searchInput} 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={listStyles.clearBtn}>✕</button>
          )}
        </div>
        <div style={listStyles.filterGroup}>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            style={listStyles.filterSelect}
          >
            <option value="all">Semua</option>
            <option value="module">📚 Modul</option>
            <option value="assignment">📝 Tugas</option>
            <option value="quiz">❓ Kuis</option>
          </select>
          <select 
            value={filterMapel} 
            onChange={(e) => setFilterMapel(e.target.value)} 
            style={listStyles.filterSelect}
          >
            <option value="all">📖 Semua Mapel</option>
            {subjects.filter(s => s !== 'all').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <div style={listStyles.emptyState}>
          <BookOpen size={56} color="#cbd5e1" />
          <h3 style={listStyles.emptyTitle}>Belum ada materi</h3>
          <p style={listStyles.emptyDesc}>
            {searchTerm ? 'Coba ubah kata kunci pencarian' : `Belum ada materi untuk ${studentKategori} - Kelas ${studentKelas}`}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={listStyles.grid}>
          {filteredModules.map(module => renderModuleCard(module))}
        </div>
      ) : (
        <div style={listStyles.list}>
          {filteredModules.map(module => {
            const isQuiz = module.type === 'kuis_mandiri';
            const submission = submissions[module.id];
            const status = submission?.status || 'not_submitted';
            const statusInfo = STATUS_COLORS[status] || STATUS_COLORS.not_submitted;
            
            return (
              <div 
                key={module.id} 
                onClick={() => handleModuleClick(module)} 
                style={listStyles.listItem}
              >
                <div style={listStyles.listItemIcon}>
                  {isQuiz ? <HelpCircle size={20} color="#8b5cf6" /> : <BookOpen size={20} color="#3b82f6" />}
                </div>
                <div style={listStyles.listItemContent}>
                  <div style={listStyles.listItemHeader}>
                    <span style={listStyles.listItemTitle}>{module.title}</span>
                    <span style={{...listStyles.listItemStatus, background: statusInfo.bg, color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div style={listStyles.listItemMeta}>
                    <span>{module.subject || 'Materi'}</span>
                    {module.kodeMapel && <span style={listStyles.listItemTag}>{module.kodeMapel}</span>}
                    {module.guruId && <span style={listStyles.listItemTag}><Hash size={8} /> {module.guruId}</span>}
                  </div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            );
          })}
        </div>
      )}

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
};

const listStyles = {
  container: { maxWidth: 1200, margin: '0 auto', padding: '20px', minHeight: '100vh', background: '#f8fafc' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  subtitle: { fontSize: 13, color: '#64748b', margin: '4px 0 0' },
  nimBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, background: '#eef2ff', color: '#3b82f6', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, marginLeft: 6 },
  viewToggle: { display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 10 },
  viewBtn: { padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 },
  statItem: { background: 'white', padding: '12px 16px', borderRadius: 12, border: '1px solid #f1f5f9', textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: 900, color: '#1e293b', display: 'block' },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 500 },
  filterBar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  searchBox: { flex: 2, display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', minWidth: 200 },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 },
  filterGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterSelect: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { display: 'flex', alignItems: 'center', gap: 12, background: 'white', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', transition: '0.2s' },
  listItemIcon: { width: 40, height: 40, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listItemContent: { flex: 1, minWidth: 0 },
  listItemHeader: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  listItemTitle: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  listItemStatus: { padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 600 },
  listItemMeta: { display: 'flex', gap: 8, fontSize: 11, color: '#94a3b8', marginTop: 2, flexWrap: 'wrap' },
  listItemTag: { display: 'inline-flex', alignItems: 'center', gap: 2, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontSize: 9 },
  emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: '2px dashed #e2e8f0', color: '#94a3b8' },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#64748b', margin: '12px 0 4px' },
  emptyDesc: { fontSize: 13 }
};

// ============================================================
// EXPORT
// ============================================================
export default StudentElearning;