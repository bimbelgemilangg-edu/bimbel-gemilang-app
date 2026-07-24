// src/pages/teacher/modul/ManageMateri.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../../firebase';
import { 
  collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, 
  getDocs, deleteDoc, query, where, orderBy, limit
} from "firebase/firestore";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadElearningFile, deleteFile, supabase } from '../../../services/uploadService';
import AIGenerateMateri from './AIGenerateMateri';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Save, Trash2, FileText, HelpCircle, Clock, ArrowLeft, 
  FileUp, Type, Video, X, Image as ImageIcon, BookOpen, 
  Send, Layers, ChevronDown, ChevronUp, Settings, Eye, 
  CheckCircle, Calendar, Users, Target, AlertCircle, 
  Smartphone, Tablet, Laptop, Info, ExternalLink, CalendarDays, 
  Archive, UserPlus, UserCheck, Search, Loader2, Hash, Tag, 
  Zap, Sparkles, Filter, User, GraduationCap, 
  FileSpreadsheet, FileImage, File, FileVideo,
  Upload, Cloud, Server, RefreshCw, Home, ChevronRight,
  Globe, Link, Plus, Minus, Copy, Edit, MoreVertical,
  GripVertical, Move, FolderOpen, Rocket, Gift, Star,
  Edit3, FileQuestion, Youtube
} from 'lucide-react';

// ============================================================
// CONSTANTS
// ============================================================
const FILE_TYPE_OPTIONS = [
  { value: 'all', label: '📁 Semua File', accept: '*/*', icon: <File size={14} /> },
  { value: 'pdf', label: '📄 PDF', accept: '.pdf,application/pdf', icon: <File size={14} color="#ef4444" /> },
  { value: 'image', label: '🖼️ Gambar', accept: 'image/*', icon: <FileImage size={14} color="#10b981" /> },
  { value: 'word', label: '📝 Word/DOCX', accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: <FileText size={14} color="#3b82f6" /> },
];

// ============================================================
// 🔥 RENDER MATH DI DALAM HTML STRING (buat preview guru)
// ============================================================
const renderMathInHtml = (html) => {
  if (!html) return html;
  let result = html;
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (match, expr) => {
    try {
      return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: true });
    } catch (e) {
      return match;
    }
  });
  result = result.replace(/\$([^$\n]+?)\$/g, (match, expr) => {
    try {
      return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: false });
    } catch (e) {
      return match;
    }
  });
  return result;
};

// ============================================================
// DETEKSI JENIS LINK
// ============================================================
const getLinkType = (url) => {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('canva.com') || url.includes('canva.cn')) return 'canva';
  if (url.includes('docs.google.com') || url.includes('drive.google.com')) return 'google';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.startsWith('http://') || url.startsWith('https://')) return 'link';
  return 'unknown';
};

// ============================================================
// 🔥 RENDER LINK PREVIEW - DIPERBAIKI DENGAN TAMPILAN RAPI
// ============================================================
const renderLinkPreview = (url) => {
  if (!url) return null;
  const type = getLinkType(url);
  
  if (type === 'youtube') {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
    if (match) {
      return (
        <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000' }}>
          <iframe 
            width="100%" 
            height="300" 
            src={`https://www.youtube.com/embed/${match[1]}`} 
            frameBorder="0" 
            allowFullScreen 
            style={{ display: 'block' }} 
            title="YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );
    }
    return <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠️ Link YouTube tidak valid</p>;
  }
  
  if (type === 'canva') {
    return (
      <div style={{ borderRadius: 8, background: '#f0fdf4', padding: 16, border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ background: '#00c4cc', padding: '4px 10px', borderRadius: 4, fontSize: 10, color: 'white', fontWeight: 'bold' }}>CANVA</div>
          <span style={{ fontSize: 11, color: '#64748b', wordBreak: 'break-all' }}>{url}</span>
        </div>
        <iframe 
          src={url} 
          style={{ width: '100%', height: 400, border: 'none', borderRadius: 8, background: 'white' }} 
          allowFullScreen 
          title="Canva" 
        />
        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>💡 Desain Canva tampil di atas</p>
      </div>
    );
  }
  
  if (type === 'google') {
    return (
      <div style={{ borderRadius: 8, background: '#f8fafc', padding: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ background: '#4285f4', padding: '4px 10px', borderRadius: 4, fontSize: 10, color: 'white', fontWeight: 'bold' }}>GOOGLE</div>
          <span style={{ fontSize: 11, color: '#64748b', wordBreak: 'break-all' }}>{url}</span>
        </div>
        <iframe 
          src={url} 
          style={{ width: '100%', height: 400, border: 'none', borderRadius: 8, background: 'white' }} 
          allowFullScreen 
          title="Google Docs" 
        />
      </div>
    );
  }
  
  if (type === 'link') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <Link size={24} color="#3b82f6" />
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}>
          {url}
        </a>
      </div>
    );
  }
  
  return null;
};

// ============================================================
// PREVIEW COMPONENT - UNTUK FILE
// ============================================================
const FilePreview = ({ url, fileName, fileType }) => {
  const [previewError, setPreviewError] = useState(false);
  if (!url) return null;
  
  // 🔥 CEK APAKAH INI LINK (YouTube, Canva, Google, dll)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const linkType = getLinkType(url);
    if (linkType !== 'unknown') {
      const preview = renderLinkPreview(url);
      if (preview) return preview;
    }
  }
  
  // 🔥 GAMBAR
  if (fileType?.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return (
      <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f8fafc', maxHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={url} alt={fileName || 'Preview'} style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }} onError={() => setPreviewError(true)} />
        {previewError && <div style={{ padding: 20, color: '#ef4444', textAlign: 'center' }}>Gagal memuat gambar</div>}
      </div>
    );
  }
  
  // 🔥 PDF
  if (fileType === 'application/pdf' || url.match(/\.pdf$/i)) {
    return (
      <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f8fafc', padding: 16, textAlign: 'center' }}>
        <div style={{ marginBottom: 8 }}><File size={40} color="#ef4444" /></div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 16px', background: '#ef4444', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>📄 Buka PDF</a>
        <embed src={url} type="application/pdf" style={{ width: '100%', height: 400, marginTop: 12, border: 'none', borderRadius: 8 }} />
      </div>
    );
  }
  
  // 🔥 FILE LAIN
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f8fafc', borderRadius: 8, justifyContent: 'center' }}>
      <FileText size={32} color="#3b82f6" />
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>📎 {fileName || 'Buka File'}</a>
    </div>
  );
};

// ============================================================
// SIMPLE EDITOR
// ============================================================
const SimpleEditor = ({ value, onChange, placeholder }) => {
  const applyFormat = (format) => {
    const textarea = document.getElementById('editor-textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let newText = value;
    
    switch(format) {
      case 'bold': newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end); break;
      case 'italic': newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end); break;
      case 'underline': newText = value.substring(0, start) + `<u>${selectedText}</u>` + value.substring(end); break;
      case 'list': newText = value.substring(0, start) + `\n- ${selectedText}` + value.substring(end); break;
      case 'link':
        const url = prompt('Masukkan URL:', 'https://');
        if (url) newText = value.substring(0, start) + `[${selectedText}](${url})` + value.substring(end);
        break;
      default: break;
    }
    
    onChange(newText);
    setTimeout(() => textarea.focus(), 10);
  };
  
  const toolbarBtn = { background: 'none', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b', transition: '0.2s' };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 2, padding: 6, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        {[
          { label: 'B', format: 'bold', title: 'Bold' },
          { label: 'I', format: 'italic', title: 'Italic' },
          { label: 'U', format: 'underline', title: 'Underline' },
          { label: '• List', format: 'list', title: 'Bullet List' },
          { label: '🔗 Link', format: 'link', title: 'Insert Link' }
        ].map(btn => (
          <button key={btn.format} type="button" onClick={() => applyFormat(btn.format)} style={toolbarBtn} title={btn.title}>
            {btn.label}
          </button>
        ))}
      </div>
      <textarea
        id="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', minHeight: 200, padding: 12, border: 'none', outline: 'none', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
      />
      <div style={{ padding: 6, background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 9, color: '#94a3b8', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>💡 **bold** • *italic* • [teks](url) link</span>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [showRawHtml, setShowRawHtml] = useState(false);
  
  const [guruData, setGuruData] = useState(null);
  const [guruId, setGuruId] = useState('');
  const [kodeMapel, setKodeMapel] = useState('');
  const [guruName, setGuruName] = useState('');
  
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverFilePath, setCoverFilePath] = useState('');
  const [description, setDescription] = useState("");
  const [modulId, setModulId] = useState(null);
  
  const [sections, setSections] = useState([]);
  
  const [targetKategori, setTargetKategori] = useState("Reguler");
  const [targetKelas, setTargetKelas] = useState("Semua");
  const [mingguKe, setMingguKe] = useState(1);
  const [tahunAjaran, setTahunAjaran] = useState("2025/2026");
  const [statusModul, setStatusModul] = useState("aktif");
  const [tanggalMulai, setTanggalMulai] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().slice(0, 16);
  });
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [sendToSpecificStudents, setSendToSpecificStudents] = useState(false);
  
  const [stats, setStats] = useState({ totalSiswa: 0, totalJadwal: 0, totalMapel: 0, totalKonten: 0 });
  const [quizData, setQuizData] = useState([]);
  
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [authorName, setAuthorName] = useState("");

  const COLLECTION_NAME = "bimbel_modul";
  const STATUS_OPTIONS = [
    { value: 'aktif', label: 'Aktif', color: '#10b981', bg: '#dcfce7', icon: <CheckCircle size={12} /> },
    { value: 'terjadwal', label: 'Terjadwal', color: '#f59e0b', bg: '#fef3c7', icon: <CalendarDays size={12} /> },
    { value: 'arsip', label: 'Arsip', color: '#64748b', bg: '#f1f5f9', icon: <Archive size={12} /> }
  ];

  const CONTENT_TYPES = [
    { type: 'text', icon: <Type size={16} />, label: 'Teks', sub: 'Tulis materi manual', color: '#3b82f6', bg: '#e0e7ff' },
    { type: 'file', icon: <FileUp size={16} />, label: 'Upload File', sub: 'PDF, Word, Gambar', color: '#10b981', bg: '#dcfce7' },
    { type: 'video', icon: <Video size={16} />, label: 'Tempel Link', sub: 'YouTube, Canva, Google Docs', color: '#ef4444', bg: '#fee2e2' },
    { type: 'assignment', icon: <Send size={16} />, label: 'Tugas/PR', color: '#f59e0b', bg: '#fef3c7' },
    { type: 'quiz', icon: <FileQuestion size={16} />, label: 'Kuis', color: '#8b5cf6', bg: '#ede9fe' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTeacherData = useCallback(async () => {
    try {
      const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
      const teacherName = saved.nama || '';
      const teacherId = saved.guruId || saved.id || '';
      
      setAuthorName(teacherName);
      setGuruId(teacherId);
      setGuruName(teacherName);
      
      if (teacherName) {
        const qGuru = query(collection(db, "teachers"), where("nama", "==", teacherName));
        const snapGuru = await getDocs(qGuru);
        if (!snapGuru.empty) {
          const guru = snapGuru.docs[0].data();
          setGuruData(guru);
          setKodeMapel(guru.kodeMapel || '');
          setSubject(guru.mapel || '');
          if (guru.mapel) setSubjects([guru.mapel]);
        }
      }
      return { teacherName, teacherId };
    } catch (e) {
      console.error("Error fetching teacher:", e);
      return { teacherName: '', teacherId: '' };
    }
  }, []);

  const fetchStudentsFromSchedules = useCallback(async (teacherName) => {
    if (!teacherName) return [];
    
    try {
      const qJadwal = query(
        collection(db, "jadwal_bimbel"),
        where("teacherName", "==", teacherName),
        orderBy("dateStr", "desc"),
        limit(100)
      );
      const snapJadwal = await getDocs(qJadwal);
      const schedules = snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const studentIdSet = new Set();
      schedules.forEach(schedule => {
        if (schedule.students) {
          schedule.students.forEach(s => {
            const sid = s.studentId || s.id;
            if (sid) studentIdSet.add(sid);
          });
        }
      });
      
      const siswaList = [];
      if (studentIdSet.size > 0) {
        const qSiswa = query(collection(db, "students"));
        const snapSiswa = await getDocs(qSiswa);
        const allSiswa = snapSiswa.docs.map(d => ({ id: d.id, ...d.data() }));
        
        allSiswa.forEach(s => {
          const sid = s.studentId || s.id;
          if (studentIdSet.has(sid)) {
            siswaList.push({
              id: s.id,
              studentId: sid,
              nama: s.nama || 'Siswa',
              kelasSekolah: s.kelasSekolah || '-',
              program: s.kategori || 'Reguler',
              isActive: s.status === 'Aktif' && !s.isBlocked
            });
          }
        });
        siswaList.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      }
      
      setStats(prev => ({
        ...prev,
        totalSiswa: siswaList.length,
        totalJadwal: schedules.length,
        totalMapel: new Set(schedules.map(s => s.mapelId || s.mapel)).size
      }));
      
      return siswaList;
    } catch (e) {
      console.error("Error fetching schedules:", e);
      return [];
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { teacherName } = await fetchTeacherData();
        const siswaFromJadwal = await fetchStudentsFromSchedules(teacherName);
        setAllStudents(siswaFromJadwal);
        setFilteredStudents(siswaFromJadwal);
        
        if (editId) await fetchModulData();
        
        const snapSiswa = await getDocs(collection(db, "students"));
        const classes = [...new Set(snapSiswa.docs.map(d => d.data().kelasSekolah).filter(Boolean))];
        setAvailableClasses(['Semua', ...classes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))]);
        
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [editId]);

  const fetchModulData = async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, editId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setModulId(editId);
        setTitle(data.title || "");
        setSubject(data.subject || "");
        setCoverImage(data.coverImage || null);
        setCoverFilePath(data.coverFilePath || '');
        setDescription(data.description || "");
        setSections(data.blocks || []);
        setQuizData(data.quizData || []);
        setTargetKategori(data.targetKategori || "Reguler");
        setTargetKelas(data.targetKelas || "Semua");
        setMingguKe(data.mingguKe || 1);
        setTahunAjaran(data.tahunAjaran || "2025/2026");
        setStatusModul(data.status || "aktif");
        if (data.tanggalMulai) setTanggalMulai(data.tanggalMulai);
        if (data.tanggalSelesai) setTanggalSelesai(data.tanggalSelesai);
        if (data.selectedStudents) setSelectedStudents(data.selectedStudents);
        if (data.sendToSpecificStudents !== undefined) setSendToSpecificStudents(data.sendToSpecificStudents);
        setStats(prev => ({ ...prev, totalKonten: data.blocks?.length || 0 }));
      }
    } catch (error) {
      console.error("Error fetching modul:", error);
    }
  };

  useEffect(() => {
    if (!studentSearch.trim()) {
      setFilteredStudents(allStudents);
      return;
    }
    const search = studentSearch.toLowerCase();
    setFilteredStudents(allStudents.filter(s => 
      (s.nama || '').toLowerCase().includes(search) ||
      (s.studentId || '').toLowerCase().includes(search)
    ));
  }, [studentSearch, allStudents]);

  const handleFileUpload = async (file, type = 'materi') => {
    if (!file) return null;
    if (file.size > 50 * 1024 * 1024) {
      alert("❌ Maksimal 50MB!");
      return null;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus({ type: 'loading', message: `Mengupload ${file.name}...` });

    try {
      const result = await uploadElearningFile(file, type);

      if (result.success) {
        setUploadProgress(100);
        setUploadStatus({ type: 'success', message: '✅ File berhasil diunggah!' });
        setTimeout(() => setUploadStatus({ type: '', message: '' }), 2000);
        return result;
      } else {
        setUploadStatus({ type: 'error', message: `❌ ${result.error}` });
        alert("❌ Upload gagal: " + result.error);
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({ type: 'error', message: `❌ ${error.message}` });
      alert("❌ Terjadi kesalahan: " + error.message);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setTimeout(() => setUploadStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('❌ File harus berupa gambar!');
      return;
    }
    const result = await handleFileUpload(file, 'cover');
    if (result?.success) {
      setCoverImage(result.downloadURL);
      setCoverFilePath(result.filePath);
    }
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSectionFileUpload = async (e, sectionId) => {
    const file = e.target.files[0];
    if (!file) return;

    const result = await handleFileUpload(file, 'materi');
    
    if (result?.success) {
      setSections(sections.map(s => 
        s.id === sectionId 
          ? { 
              ...s, 
              content: result.downloadURL,
              fileName: result.fileName,
              mimeType: file.type,
              fileSize: file.size,
              filePath: result.filePath
            } 
          : s
      ));
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSection = async (id) => {
    if (!window.confirm("Hapus konten ini?")) return;
    
    const section = sections.find(s => s.id === id);
    if (section?.filePath) {
      try {
        await deleteFile(section.filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    
    setSections(sections.filter(s => s.id !== id));
    if (editingSection === id) setEditingSection(null);
    setStats(prev => ({ ...prev, totalKonten: sections.length - 1 }));
  };

  const handleDeleteModul = async () => {
    if (!modulId) return;
    if (!window.confirm(`⚠️ Hapus modul "${title}"?`)) return;
    
    try {
      const filePaths = sections.filter(s => s.filePath).map(s => s.filePath);
      if (coverFilePath) filePaths.push(coverFilePath);
      
      if (filePaths.length > 0) {
        await supabase.storage.from('materi-bimbel').remove(filePaths);
      }
      
      await deleteDoc(doc(db, COLLECTION_NAME, modulId));
      alert('✅ Modul berhasil dihapus!');
      navigate('/guru/modul');
    } catch (error) {
      console.error('Error deleting modul:', error);
      alert('❌ Gagal menghapus modul: ' + error.message);
    }
  };

  const addSection = (type) => {
    const titles = { 
      text: '📄 Materi Teks', 
      file: '📁 Upload File (PDF/Word/Gambar)', 
      video: '🔗 Link (YouTube/Canva/Google Docs)', 
      assignment: '📝 Tugas/PR',
      quiz: '❓ Kuis'
    };
    const newSection = { 
      id: Date.now(), 
      type, 
      title: titles[type] || '', 
      content: '', 
      fileName: '', 
      mimeType: '', 
      fileSize: 0,
      filePath: '',
      endTime: '',
      allowedFileType: 'all',
      quizId: null,
      quizTitle: '',
      quizQuestions: 0
    };
    setSections([...sections, newSection]);
    setEditingSection(newSection.id);
    setShowAddMenu(false);
    setStats(prev => ({ ...prev, totalKonten: sections.length + 1 }));
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const moveSection = (id, direction) => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const newSections = [...sections];
    if (direction === 'up' && idx > 0) {
      [newSections[idx], newSections[idx - 1]] = [newSections[idx - 1], newSections[idx]];
    } else if (direction === 'down' && idx < sections.length - 1) {
      [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
    }
    setSections(newSections);
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents(prev => {
      const exists = prev.some(s => s.studentId === student.studentId);
      if (exists) {
        return prev.filter(s => s.studentId !== student.studentId);
      } else {
        return [...prev, { 
          id: student.id, 
          studentId: student.studentId, 
          nama: student.nama,
          kelasSekolah: student.kelasSekolah
        }];
      }
    });
  };

  const selectAllFiltered = () => {
    const alreadySelected = selectedStudents.map(s => s.studentId);
    const newStudents = filteredStudents.filter(s => !alreadySelected.includes(s.studentId));
    setSelectedStudents(prev => [...prev, ...newStudents.map(s => ({
      id: s.id,
      studentId: s.studentId,
      nama: s.nama,
      kelasSekolah: s.kelasSekolah
    }))]);
  };

  const getStudentInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };

  // ============================================================
  // 🔥 HANDLE SAVE
  // ============================================================
  const handleSave = async () => {
    if (!title) return alert("❌ Judul modul wajib diisi!");
    if (!subject) return alert("❌ Mata pelajaran wajib dipilih!");
    if (statusModul === 'terjadwal' && !tanggalMulai) {
      return alert("❌ Silakan isi tanggal mulai!");
    }
    if (sendToSpecificStudents && selectedStudents.length === 0) {
      return alert("❌ Pilih minimal 1 siswa!");
    }
    
    const quizSections = sections.filter(s => s.type === 'quiz');
    const invalidQuiz = quizSections.find(s => !s.quizId);
    if (invalidQuiz) {
      return alert(`⚠️ Kuis "${invalidQuiz.title || 'Tanpa Judul'}" belum dibuat! Klik "Buat Kuis" untuk membuatnya.`);
    }
    
    setSaving(true);
    
    const payload = {
      title: title.toUpperCase(),
      subject: subject.toUpperCase(),
      guruId: guruId,
      kodeMapel: kodeMapel,
      guruName: guruName,
      coverImage,
      coverFilePath,
      description,
      blocks: sections,
      quizData,
      targetKategori,
      targetKelas,
      mingguKe: parseInt(mingguKe) || 1,
      tahunAjaran,
      status: statusModul,
      sendToSpecificStudents,
      selectedStudents: sendToSpecificStudents ? selectedStudents : [],
      studentIds: sendToSpecificStudents ? selectedStudents.map(s => s.studentId) : [],
      totalKonten: sections.length,
      updatedAt: serverTimestamp(),
      updatedBy: authorName,
    };
    
    if (statusModul === 'terjadwal') {
      payload.tanggalMulai = tanggalMulai;
      payload.tanggalSelesai = tanggalSelesai || null;
    }
    
    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
        alert("✅ Modul berhasil diperbarui!");
      } else {
        payload.createdAt = serverTimestamp();
        payload.createdBy = authorName;
        const newDoc = await addDoc(collection(db, COLLECTION_NAME), payload);
        alert(`✅ Modul "${title}" berhasil diterbitkan!`);
        navigate(`/guru/modul/materi?edit=${newDoc.id}`);
        return;
      }
    } catch (err) {
      alert("❌ Gagal: " + err.message);
    }
    setSaving(false);
  };

  // ============================================================
  // 🔥 BUKA MANAGE QUIZ DARI MODUL
  // ============================================================
  const openQuizEditor = (section) => {
    if (!modulId) {
      alert('⚠️ Simpan modul terlebih dahulu sebelum membuat kuis!');
      return;
    }
    navigate(`/guru/modul/quiz?modulId=${modulId}&sectionId=${section.id}`);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ============================================================
  // RENDER KONTEN EDITOR
  // ============================================================
  const renderContentEditor = () => {
    const section = sections.find(s => s.id === editingSection);
    if (!section) return null;

    const typeIcons = { text: '📄', file: '📁', video: '🎥', assignment: '📝', quiz: '❓' };
    const typeColors = { text: '#3b82f6', file: '#10b981', video: '#ef4444', assignment: '#f59e0b', quiz: '#8b5cf6' };

    return (
      <div style={{ 
        background: '#f8fafc', 
        padding: 16, 
        borderRadius: 10, 
        border: '1px solid #e2e8f0',
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: typeColors[section.type], background: typeColors[section.type] + '15', padding: '4px 10px', borderRadius: 6 }}>
              {typeIcons[section.type]} {section.type.toUpperCase()}
              {section.format === 'html' && ' • AI'}
            </span>
            <input 
              value={section.title} 
              onChange={e => updateSection(editingSection, 'title', e.target.value)} 
              placeholder="Judul konten..." 
              style={{ 
                border: 'none', 
                background: 'transparent', 
                fontSize: 14, 
                fontWeight: 700, 
                color: '#1e293b',
                outline: 'none',
                minWidth: 150
              }} 
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => moveSection(editingSection, 'up')} style={{ padding: '4px 6px', background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              <ChevronUp size={12} />
            </button>
            <button onClick={() => moveSection(editingSection, 'down')} style={{ padding: '4px 6px', background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              <ChevronDown size={12} />
            </button>
            <button onClick={() => removeSection(editingSection)} style={{ padding: '4px 6px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              <Trash2 size={12} />
            </button>
            <button onClick={() => setEditingSection(null)} style={{ padding: '4px 6px', background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
        </div>

        {/* TEXT */}
        {section.type === 'text' && section.format === 'html' && (
          <div>
            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 11, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> Konten ini dibuat oleh AI. Ini sudah siap tampil ke siswa — gak perlu diapa-apain lagi kecuali mau diedit.
            </div>

            <div style={{ padding: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>👁️ TAMPILAN UNTUK SISWA</div>
              <div dangerouslySetInnerHTML={{ __html: renderMathInHtml(section.content) }} />
            </div>

            <button
              type="button"
              onClick={() => setShowRawHtml(v => !v)}
              style={{
                marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 10, color: '#94a3b8', textDecoration: 'underline', padding: 0
              }}
            >
              {showRawHtml ? '▲ Sembunyikan kode (lanjutan)' : '▼ Mau edit tulisannya langsung? Klik di sini (lanjutan, teknis)'}
            </button>

            {showRawHtml && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>
                  ⚠️ Ini kode HTML mentah, cuma buat yang mau edit teksnya manual. Boleh diabaikan kalau isinya udah pas seperti tampilan di atas.
                </p>
                <textarea
                  value={section.content}
                  onChange={e => updateSection(editingSection, 'content', e.target.value)}
                  style={{ width: '100%', minHeight: 180, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        )}
        {section.type === 'text' && section.format !== 'html' && (
          <SimpleEditor 
            value={section.content} 
            onChange={value => updateSection(editingSection, 'content', value)} 
            placeholder="Tulis materi di sini..." 
          />
        )}

        {/* FILE */}
        {section.type === 'file' && (
          <div>
            {section.content ? (
              <div>
                <div style={{ padding: 12, background: 'white', borderRadius: 8, marginBottom: 8 }}>
                  <FilePreview url={section.content} fileName={section.fileName} fileType={section.mimeType} />
                </div>
                <button onClick={() => { updateSection(editingSection, 'content', ''); updateSection(editingSection, 'fileName', ''); }} style={{ padding: '4px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                  Hapus File
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '30px 20px', border: '2px dashed #e2e8f0', borderRadius: 8, cursor: 'pointer', background: 'white' }}>
                {uploading ? (
                  <>
                    <Loader2 size={24} className="spin" />
                    <span>Uploading... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <FileUp size={24} color="#94a3b8" />
                    <span style={{ fontWeight: 600 }}>Upload File</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>PDF, DOCX, PPT, Gambar (Max 50MB)</span>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" hidden onChange={(e) => handleSectionFileUpload(e, editingSection)} disabled={uploading} />
              </label>
            )}
          </div>
        )}

        {/* 🔥 VIDEO/LINK - DENGAN PREVIEW RAPI */}
        {section.type === 'video' && (
          <div>
            <input 
              value={section.content} 
              onChange={e => updateSection(editingSection, 'content', e.target.value)} 
              placeholder="Tempel link YouTube, Canva, Google Docs..." 
              style={{ 
                width: '100%', 
                padding: 10, 
                borderRadius: 8, 
                border: '1px solid #e2e8f0', 
                fontSize: 13, 
                outline: 'none', 
                boxSizing: 'border-box' 
              }} 
            />
            {section.content && (
              <div style={{ marginTop: 10 }}>
                <div style={{ 
                  background: 'white', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  overflow: 'hidden',
                  padding: 12,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: getLinkType(section.content) === 'youtube' ? '#fee2e2' :
                                 getLinkType(section.content) === 'canva' ? '#f0fdf4' :
                                 getLinkType(section.content) === 'google' ? '#e0e7ff' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getLinkType(section.content) === 'youtube' && <Youtube size={16} color="#ef4444" />}
                      {getLinkType(section.content) === 'canva' && <Globe size={16} color="#00c4cc" />}
                      {getLinkType(section.content) === 'google' && <FileText size={16} color="#4285f4" />}
                      {getLinkType(section.content) === 'link' && <Link size={16} color="#3b82f6" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                        {getLinkType(section.content) === 'youtube' ? 'YouTube Video' :
                         getLinkType(section.content) === 'canva' ? 'Canva Design' :
                         getLinkType(section.content) === 'google' ? 'Google Docs' : 'Link'}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', wordBreak: 'break-all' }}>{section.content}</div>
                    </div>
                    <a href={section.content} target="_blank" rel="noopener noreferrer" style={{
                      padding: '4px 12px', 
                      background: '#3b82f6', 
                      color: 'white', 
                      borderRadius: 6,
                      textDecoration: 'none', 
                      fontSize: 10, 
                      fontWeight: 600, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      flexShrink: 0
                    }}>
                      <ExternalLink size={12} /> Buka
                    </a>
                  </div>
                  
                  {/* 🔥 PREVIEW KONTEN LANGSUNG */}
                  {getLinkType(section.content) === 'youtube' && (
                    <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                      <iframe 
                        width="100%" height="250" 
                        src={`https://www.youtube.com/embed/${section.content.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)?.[1] || ''}`} 
                        frameBorder="0" allowFullScreen 
                        title="YouTube"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  )}
                  
                  {getLinkType(section.content) === 'canva' && (
                    <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8, background: '#00c4cc', color: 'white' }}>
                        <Globe size={14} /> CANVA
                      </div>
                      <iframe 
                        src={section.content} 
                        style={{ width: '100%', height: 350, border: 'none' }} 
                        allowFullScreen 
                        title="Canva" 
                      />
                    </div>
                  )}
                  
                  {getLinkType(section.content) === 'google' && (
                    <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8, background: '#4285f4', color: 'white' }}>
                        <FileText size={14} /> GOOGLE
                      </div>
                      <iframe 
                        src={section.content} 
                        style={{ width: '100%', height: 350, border: 'none' }} 
                        allowFullScreen 
                        title="Google Docs" 
                      />
                    </div>
                  )}
                  
                  {getLinkType(section.content) === 'link' && (
                    <div style={{ 
                      padding: 16, background: '#f8fafc', borderRadius: 8,
                      display: 'flex', alignItems: 'center', gap: 12
                    }}>
                      <Link size={24} color="#3b82f6" />
                      <a href={section.content} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all' }}>
                        {section.content}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
              💡 Support: YouTube, Canva, Google Docs/Sheets/Slides, Vimeo, dan link lainnya
            </div>
          </div>
        )}

        {/* ASSIGNMENT */}
        {section.type === 'assignment' && (
          <div>
            <textarea 
              value={section.content} 
              onChange={e => updateSection(editingSection, 'content', e.target.value)} 
              placeholder="Instruksi tugas..." 
              style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical' }} 
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 600 }}>Jenis File</label>
                <select value={section.allowedFileType} onChange={e => updateSection(editingSection, 'allowedFileType', e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11 }}>
                  {FILE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 600 }}>Deadline</label>
                <input type="datetime-local" value={section.endTime} onChange={e => updateSection(editingSection, 'endTime', e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11 }} />
              </div>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {section.type === 'quiz' && (
          <div style={{ 
            background: section.quizId ? '#f0fdf4' : '#ede9fe', 
            padding: 16, 
            borderRadius: 8, 
            border: `2px solid ${section.quizId ? '#10b981' : '#8b5cf6'}` 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FileQuestion size={20} color={section.quizId ? '#10b981' : '#8b5cf6'} />
              <span style={{ fontWeight: 700, fontSize: 14, color: section.quizId ? '#166534' : '#6d28d9' }}>
                {section.quizTitle || 'Kuis'}
              </span>
              {section.quizId ? (
                <>
                  <span style={{ 
                    background: '#10b981', 
                    color: 'white', 
                    padding: '2px 10px', 
                    borderRadius: 10,
                    fontSize: 9,
                    fontWeight: 700
                  }}>
                    {section.quizQuestions || 0} soal
                  </span>
                  <span style={{ 
                    background: '#dcfce7', 
                    color: '#166534', 
                    padding: '2px 10px', 
                    borderRadius: 10,
                    fontSize: 9,
                    fontWeight: 700
                  }}>
                    ✅ Tersimpan
                  </span>
                </>
              ) : (
                <span style={{ 
                  background: '#fef3c7', 
                  color: '#b45309', 
                  padding: '2px 10px', 
                  borderRadius: 10,
                  fontSize: 9,
                  fontWeight: 700
                }}>
                  ⚠️ Belum dibuat
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => openQuizEditor(section)}
                style={{
                  padding: '8px 16px',
                  background: section.quizId ? '#10b981' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Edit3 size={14} /> {section.quizId ? 'Edit Kuis' : 'Buat Kuis'}
              </button>
              
              {section.quizId && (
                <button
                  onClick={() => window.open(`/siswa/kuis/${section.quizId}`, '_blank')}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Eye size={14} /> Preview
                </button>
              )}
              
              {section.quizId && (
                <button
                  onClick={() => {
                    if (!confirm('Hapus kuis dari modul ini? (Data kuis tetap tersimpan)')) return;
                    updateSection(editingSection, 'quizId', null);
                    updateSection(editingSection, 'quizTitle', '');
                    updateSection(editingSection, 'quizQuestions', 0);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#fee2e2',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 11
                  }}
                >
                  <Trash2 size={14} /> Hapus dari Modul
                </button>
              )}
            </div>
            
            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
              {section.quizId 
                ? '💡 Klik "Edit Kuis" untuk mengubah soal, timer, atau pengaturan lainnya' 
                : '💡 Klik "Buat Kuis" untuk membuka editor kuis lengkap (AI Generate, 6 tipe soal, timer, dll)'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // STYLES
  // ============================================================
  const styles = {
    container: { maxWidth: 900, margin: '0 auto', paddingBottom: 100, padding: isMobile ? 12 : 20 },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 },
    spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #652D90', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
    btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 12 : 13, display: 'flex', alignItems: 'center', gap: 4 },
    pageTitle: { margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b' },
    headerActions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
    btnSave: { background: '#10b981', color: 'white', border: 'none', padding: isMobile ? '6px 14px' : '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 12 : 13, display: 'flex', alignItems: 'center', gap: 6 },
    card: { background: 'white', padding: isMobile ? 14 : 20, borderRadius: 14, border: '1px solid #f1f5f9', marginBottom: 16 },
    cardTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
    input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' },
    textarea: { width: '100%', minHeight: 60, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', resize: 'vertical', fontFamily: 'inherit' },
    select: { padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: 'white', outline: 'none', cursor: 'pointer' },
    coverUpload: { display: 'block', height: 100, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: '2px dashed #e2e8f0', background: '#f8fafc' },
    sectionItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: 6, transition: '0.2s' },
    sectionLabel: { flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
    badge: { fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10 },
    floatingFooter: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', padding: isMobile ? '10px 16px' : '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10, zIndex: 50, flexWrap: 'wrap' },
    btnFooterCancel: { padding: isMobile ? '8px 14px' : '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: isMobile ? 12 : 13, cursor: 'pointer' },
    btnFooterSave: { padding: isMobile ? '8px 18px' : '10px 25px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: isMobile ? 12 : 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
    addMenu: { position: 'relative', marginTop: 8 },
    addButton: { width: '100%', padding: '12px', border: '2px dashed #cbd5e1', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: '0.2s' },
    addMenuOptions: { position: 'absolute', bottom: '100%', left: 0, right: 0, background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: 8, marginBottom: 8, zIndex: 10 },
    deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Memuat data...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack}>
          <ArrowLeft size={14} /> {!isMobile && 'Kembali'}
        </button>
        <h2 style={styles.pageTitle}>
          {editId ? '✏️ Edit Modul' : '📚 Buat Modul Baru'}
          {modulId && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>#{modulId}</span>}
        </h2>
        <div style={styles.headerActions}>
          {editId && (
            <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={{ ...styles.btnBack }}>
              <Eye size={14} /> Live
            </button>
          )}
          {modulId && (
            <button onClick={handleDeleteModul} style={styles.deleteBtn}>
              <Trash2 size={14} /> Hapus
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{ ...styles.btnSave, opacity: saving ? 0.6 : 1 }}>
            <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update' : 'Terbitkan'}
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1️⃣ COVER & IDENTITAS */}
      {/* ========================================================== */}
      <div style={styles.card}>
        <h4 style={styles.cardTitle}><BookOpen size={18} /> 1. Cover & Identitas</h4>
        <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
          <label style={{ ...styles.coverUpload, width: isMobile ? '100%' : 120, flexShrink: 0 }}>
            {coverImage ? (
              <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <ImageIcon size={24} />
                <span style={{ fontSize: 9 }}>Upload Cover</span>
              </div>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />
          </label>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul modul..." style={styles.input} />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={{ ...styles.select, flex: 1 }}>
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {kodeMapel && <span style={{ background: '#ede9fe', padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center' }}>📌 {kodeMapel}</span>}
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi modul..." style={styles.textarea} />
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2️⃣ KONTEN MODUL */}
      {/* ========================================================== */}
      <div style={styles.card}>
        <h4 style={styles.cardTitle}><Layers size={18} /> 2. Konten Modul ({sections.length})</h4>
        
        {sections.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 8 }}>
            <FolderOpen size={32} color="#cbd5e1" />
            <p style={{ marginTop: 8, fontSize: 13 }}>Belum ada konten. Klik tombol di bawah untuk menambahkan.</p>
          </div>
        )}

        {sections.map((sec, idx) => {
          const typeIcons = { text: '📄', file: '📁', video: '🎥', assignment: '📝', quiz: '❓' };
          const typeColors = { text: '#3b82f6', file: '#10b981', video: '#ef4444', assignment: '#f59e0b', quiz: '#8b5cf6' };
          const isEditing = editingSection === sec.id;
          
          return (
            <div key={sec.id}>
              <div 
                style={{ 
                  ...styles.sectionItem, 
                  borderColor: isEditing ? '#3b82f6' : '#e2e8f0',
                  borderWidth: isEditing ? '2px' : '1px',
                  background: isEditing ? '#eef2ff' : '#f8fafc'
                }}
                onClick={() => setEditingSection(isEditing ? null : sec.id)}
              >
                <span style={{ fontSize: 16 }}>{typeIcons[sec.type]}</span>
                <span style={styles.sectionLabel}>
                  {sec.title || `Konten ${idx + 1}`}
                  {sec.format === 'html' && (
                    <span style={{ fontSize: 9, color: '#8b5cf6', background: '#ede9fe', padding: '1px 8px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <Sparkles size={9} /> AI
                    </span>
                  )}
                  {sec.type === 'quiz' && sec.quizId && (
                    <span style={{ fontSize: 9, color: '#10b981', background: '#dcfce7', padding: '1px 8px', borderRadius: 10 }}>
                      ✅ {sec.quizQuestions || 0} soal
                    </span>
                  )}
                  {sec.type === 'quiz' && !sec.quizId && (
                    <span style={{ fontSize: 9, color: '#f59e0b', background: '#fef3c7', padding: '1px 8px', borderRadius: 10 }}>
                      ⚠️ Belum dibuat
                    </span>
                  )}
                  {sec.fileName && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>📎 {sec.fileName}</span>}
                </span>
                <span style={{ ...styles.badge, background: typeColors[sec.type] + '15', color: typeColors[sec.type] }}>
                  {sec.type.toUpperCase()}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={14} />
                </button>
              </div>
              
              {isEditing && renderContentEditor()}
            </div>
          );
        })}

        {/* TOMBOL TAMBAH KONTEN */}
        <div style={styles.addMenu}>
          {showAddMenu ? (
            <div style={styles.addMenuOptions} className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 6 }}>
                {CONTENT_TYPES.map(item => (
                  <button
                    key={item.type}
                    onClick={() => addSection(item.type)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 8,
                      border: `2px solid ${item.color}30`,
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: '0.2s',
                      color: item.color
                    }}
                  >
                    {item.icon}
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{item.label}</span>
                    {item.sub && (
                      <span style={{ fontSize: 8, fontWeight: 400, color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
                        {item.sub}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowAddMenu(false)}
                style={{ width: '100%', marginTop: 6, padding: 6, background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: '#64748b' }}
              >
                Tutup
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => setShowAddMenu(true)}
                style={{ ...styles.addButton, flex: 1 }}
              >
                <Plus size={18} /> Tambah Konten
              </button>
              <button 
                onClick={() => setShowAIGenerate(true)}
                style={{ ...styles.addButton, flex: 1, border: '2px dashed #8b5cf6', color: '#8b5cf6', background: '#faf5ff' }}
              >
                <Sparkles size={18} /> Generate dengan AI
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3️⃣ TARGET & PENGATURAN */}
      {/* ========================================================== */}
      <div style={styles.card}>
        <h4 style={styles.cardTitle}><Settings size={18} /> 3. Target & Pengaturan</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>🎯 Target</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={{ ...styles.select, flex: 1 }}>
                <option value="Reguler">📚 Reguler</option>
                <option value="English">🗣️ English</option>
                <option value="Semua">🌐 Semua</option>
              </select>
              <select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={{ ...styles.select, flex: 1 }}>
                {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={sendToSpecificStudents} onChange={() => setSendToSpecificStudents(!sendToSpecificStudents)} />
                <UserPlus size={14} /> Kirim ke siswa tertentu
              </label>
              {sendToSpecificStudents && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Cari siswa..." style={{ ...styles.input, paddingLeft: 28, fontSize: 11 }} onFocus={() => setShowStudentPicker(true)} />
                    </div>
                    <button onClick={selectAllFiltered} style={{ padding: '4px 12px', background: '#e0e7ff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#3730a3' }}>Pilih Semua</button>
                  </div>
                  {selectedStudents.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {selectedStudents.slice(0, 10).map(s => (
                        <span key={s.studentId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eef2ff', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: '#3730a3' }}>
                          {s.nama}
                          <button onClick={() => toggleStudentSelection(s)} style={{ background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                        </span>
                      ))}
                      {selectedStudents.length > 10 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{selectedStudents.length - 10}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>⚙️ Pengaturan</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} placeholder="Minggu" style={{ ...styles.input, flex: 1, fontSize: 11 }} />
              <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} placeholder="Tahun" style={{ ...styles.input, flex: 1, fontSize: 11 }} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setStatusModul(opt.value)} style={{ 
                  flex: 1, padding: '6px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  background: statusModul === opt.value ? opt.color : '#f1f5f9',
                  color: statusModul === opt.value ? 'white' : '#64748b',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
            {statusModul === 'terjadwal' && (
              <div style={{ background: '#fffbeb', padding: 10, borderRadius: 8, marginTop: 8, border: '1px solid #fde68a' }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#92400e', display: 'block', marginBottom: 4 }}>📅 Jadwal Rilis</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="datetime-local" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} style={{ ...styles.input, fontSize: 11 }} />
                  <input type="datetime-local" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} style={{ ...styles.input, fontSize: 11 }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL: GENERATE DENGAN AI */}
      {/* ========================================================== */}
      {showAIGenerate && (
        <AIGenerateMateri
          subject={subject}
          onGenerated={(newBlocks) => {
            setSections(prev => [...prev, ...newBlocks]);
            setStats(prev => ({ ...prev, totalKonten: sections.length + newBlocks.length }));
          }}
          onClose={() => setShowAIGenerate(false)}
        />
      )}

      {/* ========================================================== */}
      {/* FOOTER */}
      {/* ========================================================== */}
      <div style={styles.floatingFooter}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnFooterCancel}>Batal</button>
        {editId && (
          <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={{ ...styles.btnFooterCancel, background: 'white', border: '1px solid #e2e8f0' }}>
            <Eye size={14} /> Preview
          </button>
        )}
        <button onClick={handleSave} disabled={saving} style={{ ...styles.btnFooterSave, opacity: saving ? 0.6 : 1 }}>
          <Rocket size={16} /> {saving ? 'Menyimpan...' : editId ? 'Update Modul' : 'Terbitkan Modul'}
        </button>
      </div>
    </div>
  );
};

export default ManageMateri;