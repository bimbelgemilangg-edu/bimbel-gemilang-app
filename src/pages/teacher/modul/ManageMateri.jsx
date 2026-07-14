// src/pages/teacher/modul/ManageMateri.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../../firebase';
import { 
  collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, 
  getDocs, deleteDoc, query, where, orderBy, limit
} from "firebase/firestore";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadElearningFile, deleteFile, supabase } from '../../../services/uploadService';
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
  GripVertical, Move, FolderOpen
} from 'lucide-react';

// ============================================================
// CONSTANTS - JENIS FILE YANG DIIZINKAN UNTUK TUGAS
// ============================================================
const FILE_TYPE_OPTIONS = [
  { value: 'all', label: '📁 Semua File', accept: '*/*', icon: <File size={14} /> },
  { value: 'pdf', label: '📄 PDF', accept: '.pdf,application/pdf', icon: <File size={14} color="#ef4444" /> },
  { value: 'image', label: '🖼️ Gambar', accept: 'image/*', icon: <FileImage size={14} color="#10b981" /> },
  { value: 'word', label: '📝 Word/DOCX', accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: <FileText size={14} color="#3b82f6" /> },
];

// ============================================================
// PREVIEW COMPONENT
// ============================================================
const FilePreview = ({ url, fileName, fileType }) => {
  const [previewError, setPreviewError] = useState(false);
  
  if (!url) return null;
  
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
  if (youtubeMatch) {
    return (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden' }}>
        <iframe 
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
          allowFullScreen 
          title="Video Preview" 
        />
      </div>
    );
  }
  
  if (fileType?.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return (
      <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f8fafc', maxHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={url} 
          alt={fileName || 'Preview'} 
          style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }} 
          onError={() => setPreviewError(true)} 
        />
        {previewError && <div style={{ padding: 20, color: '#ef4444', textAlign: 'center' }}>Gagal memuat gambar</div>}
      </div>
    );
  }
  
  if (fileType === 'application/pdf' || url.match(/\.pdf$/i)) {
    return (
      <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f8fafc', padding: 16, textAlign: 'center' }}>
        <div style={{ marginBottom: 8 }}><File size={40} color="#ef4444" /></div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 16px', background: '#ef4444', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>
          📄 Buka PDF
        </a>
        <embed src={url} type="application/pdf" style={{ width: '100%', height: 400, marginTop: 12, border: 'none', borderRadius: 8 }} />
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f8fafc', borderRadius: 8, justifyContent: 'center' }}>
      <FileText size={32} color="#3b82f6" />
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
        📎 {fileName || 'Buka File'}
      </a>
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
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        break;
      case 'italic':
        newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
        break;
      case 'underline':
        newText = value.substring(0, start) + `<u>${selectedText}</u>` + value.substring(end);
        break;
      case 'list':
        newText = value.substring(0, start) + `\n- ${selectedText}` + value.substring(end);
        break;
      case 'link':
        const url = prompt('Masukkan URL:', 'https://');
        if (url) {
          newText = value.substring(0, start) + `[${selectedText}](${url})` + value.substring(end);
        }
        break;
      default:
        break;
    }
    
    onChange(newText);
    setTimeout(() => textarea.focus(), 10);
  };
  
  const toolbarBtn = {
    background: 'none', border: 'none', padding: '4px 10px', 
    borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
    color: '#64748b', transition: '0.2s'
  };

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
        style={{ width: '100%', minHeight: 250, padding: 12, border: 'none', outline: 'none', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
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
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  
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
  const [activeSection, setActiveSection] = useState(null);
  
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
        
        // Set active section ke yang pertama
        if (data.blocks?.length > 0) {
          setActiveSection(data.blocks[0].id);
        }
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
    if (!window.confirm("Hapus section ini? File terkait juga akan dihapus dari penyimpanan.")) return;
    
    const section = sections.find(s => s.id === id);
    if (section?.filePath) {
      try {
        const result = await deleteFile(section.filePath);
        if (result.success) {
          console.log('✅ File berhasil dihapus dari Supabase');
        } else {
          console.warn('⚠️ Gagal hapus file:', result.error);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    
    setSections(sections.filter(s => s.id !== id));
    if (activeSection === id) {
      setActiveSection(sections.length > 1 ? sections[0]?.id : null);
    }
    setStats(prev => ({ ...prev, totalKonten: sections.length - 1 }));
  };

  const handleDeleteModul = async () => {
    if (!modulId) return;
    if (!window.confirm(`⚠️ Hapus modul "${title}"?\n\nSemua data dan file terkait akan dihapus permanen!`)) return;
    
    try {
      const filePaths = sections.filter(s => s.filePath).map(s => s.filePath);
      
      if (coverFilePath) {
        filePaths.push(coverFilePath);
      }
      
      if (filePaths.length > 0) {
        const { error } = await supabase.storage
          .from('materi-bimbel')
          .remove(filePaths);
        
        if (error) {
          console.warn('⚠️ Gagal hapus beberapa file:', error);
        } else {
          console.log(`✅ ${filePaths.length} file berhasil dihapus dari Supabase`);
        }
      }
      
      await deleteDoc(doc(db, COLLECTION_NAME, modulId));
      
      alert('✅ Modul dan semua file terkait berhasil dihapus!');
      navigate('/guru/modul');
      
    } catch (error) {
      console.error('Error deleting modul:', error);
      alert('❌ Gagal menghapus modul: ' + error.message);
    }
  };

  const addSection = (type) => {
    const titles = { 
      text: '📄 Materi Teks', 
      file: '📁 File/Dokumen', 
      video: '🔗 Link/Video', 
      assignment: '📝 Tugas/PR' 
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
      allowedFileType: 'all' 
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
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

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
    return match ? match[1] : null;
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

  const handleSave = async () => {
    if (!title) return alert("❌ Judul modul wajib diisi!");
    if (!subject) return alert("❌ Mata pelajaran wajib dipilih!");
    if (statusModul === 'terjadwal' && !tanggalMulai) {
      return alert("❌ Silakan isi tanggal mulai!");
    }
    if (sendToSpecificStudents && selectedStudents.length === 0) {
      return alert("❌ Pilih minimal 1 siswa!");
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
        localStorage.removeItem('draft_modul');
        alert(`✅ Modul "${title}" berhasil diterbitkan!`);
        navigate(`/guru/modul/materi?edit=${newDoc.id}`);
        return;
      }
    } catch (err) {
      alert("❌ Gagal: " + err.message);
    }
    setSaving(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ============================================================
  // RENDER EDITOR CONTENT - LEBAR & PREVIEW LANGSUNG
  // ============================================================
  const renderEditorContent = () => {
    if (!activeSection) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? 40 : 80, 
          background: 'white', 
          borderRadius: 12, 
          border: '2px dashed #e2e8f0',
          color: '#94a3b8'
        }}>
          <FolderOpen size={48} color="#cbd5e1" />
          <h3 style={{ fontSize: 16, marginTop: 12, color: '#64748b' }}>Pilih atau Tambah Konten</h3>
          <p style={{ fontSize: 12, marginTop: 4 }}>Klik konten di sidebar kiri atau tambah baru</p>
        </div>
      );
    }

    const section = sections.find(s => s.id === activeSection);
    if (!section) return null;

    const typeIcons = {
      text: '📄',
      file: '📁',
      video: '🎥',
      assignment: '📝'
    };

    const typeLabels = {
      text: 'TEKS',
      file: 'FILE',
      video: 'VIDEO',
      assignment: 'TUGAS'
    };

    const typeColors = {
      text: '#3b82f6',
      file: '#10b981',
      video: '#ef4444',
      assignment: '#f59e0b'
    };

    return (
      <div style={{ 
        background: 'white', 
        padding: isMobile ? 14 : 20, 
        borderRadius: 12, 
        border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {/* HEADER EDITOR */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16, 
          flexWrap: 'wrap', 
          gap: 8 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ 
              fontSize: 10, 
              fontWeight: 800, 
              padding: '4px 12px', 
              borderRadius: 6,
              background: typeColors[section.type] + '15',
              color: typeColors[section.type],
              border: `1px solid ${typeColors[section.type]}30`
            }}>
              {typeIcons[section.type]} {typeLabels[section.type]}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>
              {section.fileName ? `📎 ${section.fileName}` : ''}
              {section.fileSize ? ` (${formatFileSize(section.fileSize)})` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              onClick={() => {
                const idx = sections.findIndex(s => s.id === activeSection);
                if (idx > 0) moveSection(activeSection, 'up');
              }}
              style={{ padding: '4px 8px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              title="Pindah ke atas"
            >
              <ChevronUp size={14} />
            </button>
            <button 
              onClick={() => {
                const idx = sections.findIndex(s => s.id === activeSection);
                if (idx < sections.length - 1) moveSection(activeSection, 'down');
              }}
              style={{ padding: '4px 8px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              title="Pindah ke bawah"
            >
              <ChevronDown size={14} />
            </button>
            <button 
              onClick={() => removeSection(activeSection)}
              style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              title="Hapus konten"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* JUDUL SECTION */}
        <input 
          value={section.title || ''} 
          onChange={e => updateSection(activeSection, 'title', e.target.value)} 
          placeholder="Judul section..." 
          style={{ 
            width: '100%', 
            border: 'none', 
            fontSize: 18, 
            fontWeight: 700, 
            outline: 'none', 
            marginBottom: 16, 
            padding: '4px 0', 
            color: '#1e293b',
            borderBottom: '2px solid #e2e8f0',
            background: 'transparent'
          }} 
        />

        {/* KONTEN EDITOR */}
        {section.type === 'text' && (
          <SimpleEditor 
            value={section.content} 
            onChange={value => updateSection(activeSection, 'content', value)} 
            placeholder="Tulis materi di sini... Gunakan toolbar untuk format teks" 
          />
        )}

        {section.type === 'file' && (
          <div>
            {section.content ? (
              <div>
                {/* PREVIEW FILE */}
                <div style={{ 
                  padding: 16, 
                  background: '#f8fafc', 
                  borderRadius: 8, 
                  border: '1px solid #e2e8f0',
                  marginBottom: 12
                }}>
                  <FilePreview 
                    url={section.content} 
                    fileName={section.fileName} 
                    fileType={section.mimeType} 
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button 
                    onClick={() => {
                      updateSection(activeSection, 'content', '');
                      updateSection(activeSection, 'fileName', '');
                      updateSection(activeSection, 'filePath', '');
                    }}
                    style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                  >
                    <Trash2 size={12} /> Hapus File
                  </button>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    {section.fileName} ({formatFileSize(section.fileSize)})
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '40px 20px', 
                  border: '2px dashed #e2e8f0', 
                  borderRadius: 10, 
                  cursor: 'pointer', 
                  background: '#f8fafc', 
                  color: '#64748b', 
                  fontSize: 13,
                  transition: '0.2s'
                }}>
                  {uploading ? (
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <Loader2 size={30} className="spin" />
                      <span>Mengunggah... {uploadProgress}%</span>
                      <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#3b82f6', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileUp size={36} color="#94a3b8" />
                      <span style={{ fontWeight: 600 }}>Upload File Materi</span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>PDF, DOCX, PPT, Gambar (Max 50MB)</span>
                      <span style={{ fontSize: 9, color: '#94a3b8' }}>Seret atau klik untuk upload</span>
                    </>
                  )}
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" 
                    hidden 
                    onChange={(e) => handleSectionFileUpload(e, activeSection)} 
                    disabled={uploading} 
                  />
                </label>
                {uploadStatus.message && (
                  <div style={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    marginTop: 8, 
                    textAlign: 'center', 
                    color: uploadStatus.type === 'error' ? '#ef4444' : '#10b981' 
                  }}>
                    {uploadStatus.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {section.type === 'video' && (
          <div>
            <input 
              value={section.content} 
              onChange={e => updateSection(activeSection, 'content', e.target.value)} 
              placeholder="Tempel link YouTube, Canva, Google Drive..." 
              style={{ 
                width: '100%', 
                padding: 10, 
                borderRadius: 8, 
                border: '1px solid #e2e8f0', 
                fontSize: 13, 
                outline: 'none', 
                boxSizing: 'border-box', 
                background: '#f8fafc' 
              }} 
            />
            {getYouTubeId(section.content) && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, color: '#10b981', marginBottom: 6 }}>✅ Preview video:</p>
                <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                  <iframe 
                    width="100%" 
                    height="300" 
                    src={`https://www.youtube.com/embed/${getYouTubeId(section.content)}`} 
                    frameBorder="0" 
                    allowFullScreen 
                    style={{ borderRadius: 8 }} 
                  />
                </div>
              </div>
            )}
            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>💡 Link YouTube akan otomatis ditampilkan sebagai video player</p>
          </div>
        )}

        {section.type === 'assignment' && (
          <div>
            <textarea 
              value={section.content} 
              onChange={e => updateSection(activeSection, 'content', e.target.value)} 
              placeholder="Tulis instruksi tugas di sini..." 
              style={{ 
                width: '100%', 
                minHeight: 120, 
                padding: 10, 
                borderRadius: 8, 
                border: '1px solid #e2e8f0', 
                fontSize: 13, 
                resize: 'vertical', 
                fontFamily: 'inherit', 
                background: '#f8fafc' 
              }} 
            />
            
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: '#f8fafc', 
              borderRadius: 8, 
              border: '1px solid #e2e8f0' 
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <FileUp size={14} /> Jenis File yang Diizinkan untuk Siswa
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FILE_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateSection(activeSection, 'allowedFileType', opt.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: section.allowedFileType === opt.value ? '2px solid #673ab7' : '1px solid #e2e8f0',
                      background: section.allowedFileType === opt.value ? '#f3e8ff' : 'white',
                      color: section.allowedFileType === opt.value ? '#673ab7' : '#64748b',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: section.allowedFileType === opt.value ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 6 }}>
                💡 Pilih jenis file yang boleh diupload siswa. "Semua File" untuk semua jenis.
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginTop: 12, 
              padding: 12, 
              background: '#fffbeb', 
              borderRadius: 8,
              flexWrap: 'wrap'
            }}>
              <Clock size={18} color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>Deadline Tugas:</span>
              <input 
                type="datetime-local" 
                value={section.endTime} 
                onChange={e => updateSection(activeSection, 'endTime', e.target.value)} 
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: 6, 
                  border: '1px solid #fde68a', 
                  fontSize: 12, 
                  outline: 'none', 
                  background: 'white' 
                }} 
              />
              <span style={{ fontSize: 10, color: '#94a3b8' }}>Kosongkan jika tidak ada batas waktu</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const styles = {
    container: { maxWidth: 1400, margin: '0 auto', paddingBottom: 100, paddingLeft: isMobile ? 12 : 16, paddingRight: isMobile ? 12 : 16 },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 },
    spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #652D90', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    tipsBanner: { background: '#eef2ff', borderRadius: 12, padding: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
    tipsClose: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 11 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
    btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 12 : 13, display: 'flex', alignItems: 'center', gap: 4 },
    pageTitle: { margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' },
    headerActions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
    btnSave: { background: '#10b981', color: 'white', border: 'none', padding: isMobile ? '6px 14px' : '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 12 : 13, display: 'flex', alignItems: 'center', gap: 6 },
    btnPreview: { border: 'none', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 },
    mainGrid: { display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row' },
    sidebar: { width: isMobile ? '100%' : '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 },
    editorArea: { flex: 1, minWidth: 0 },
    editorWrapper: { background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', padding: isMobile ? 14 : 20 },
    card: { background: 'white', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
    cardTitle: { margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },
    input: { width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 8, boxSizing: 'border-box', background: '#f8fafc' },
    inputSmall: { flex: 1, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 10, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' },
    select: { flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, background: 'white', outline: 'none', cursor: 'pointer' },
    coverUpload: { display: 'block', height: 80, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: '2px dashed #e2e8f0', marginTop: 4, background: '#f8fafc' },
    warningBanner: { background: '#fef3c7', padding: 8, borderRadius: 6, fontSize: 10, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 },
    scheduleBox: { background: '#fffbeb', padding: 12, borderRadius: 8, marginTop: 8, border: '1px solid #fde68a' },
    scheduleTitle: { fontSize: 11, fontWeight: 700, color: '#b45309', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
    scheduleLabel: { fontSize: 10, fontWeight: 600, color: '#92400e', display: 'block', marginBottom: 4 },
    scheduleInput: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 11, background: 'white' },
    statusMessageGreen: { background: '#dcfce7', padding: 8, borderRadius: 6, fontSize: 10, color: '#166534', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 },
    statusMessageGray: { background: '#f1f5f9', padding: 8, borderRadius: 6, fontSize: 10, color: '#64748b', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 },
    emptyContent: { background: '#f8fafc', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px dashed #e2e8f0' },
    sectionItem: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, border: '1px solid #e2e8f0' },
    sectionLabel: { flex: 1, fontSize: 11, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
    btnArrow: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
    btnX: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    addSectionGrid: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)', gap: 6 },
    addSectionBtn: { padding: isMobile ? '6px' : '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 10 : 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
    quizInfo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, background: '#f0fdf4', padding: 8, borderRadius: 6 },
    btnEditQuiz: { marginLeft: 'auto', background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 10 },
    btnCreateQuiz: { width: '100%', padding: 8, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
    btnSelectAll: { padding: '4px 8px', background: '#e0e7ff', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#3730a3', fontSize: 10, fontWeight: 600 },
    studentTag: { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eef2ff', padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: '#3730a3' },
    removeTag: { background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    studentPicker: { position: 'relative', marginTop: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 300, overflow: 'hidden' },
    studentPickerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e2e8f0' },
    closePicker: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14 },
    studentPickerList: { maxHeight: 250, overflowY: 'auto', padding: 4 },
    studentPickerItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' },
    studentPickerAvatar: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', flexShrink: 0 },
    studentIdChip: { fontSize: 8, color: '#94a3b8', fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 4px', borderRadius: 4 },
    statsRow: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8, marginBottom: 12 },
    statMini: { background: 'white', padding: '8px 12px', borderRadius: 10, border: '1px solid #f1f5f9', textAlign: 'center' },
    statMiniValue: { fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#1e293b' },
    statMiniLabel: { fontSize: 9, color: '#94a3b8' },
    idBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 9, background: '#eef2ff', color: '#3b82f6', fontWeight: 600 },
    mapelBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 9, background: '#ede9fe', color: '#8b5cf6', fontWeight: 600 },
    floatingFooter: { position: 'fixed', bottom: 0, left: isMobile ? 0 : 260, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', padding: isMobile ? '8px 12px' : '10px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, zIndex: 50, flexWrap: 'wrap' },
    btnFooterCancel: { padding: isMobile ? '8px 14px' : '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: isMobile ? 12 : 13, cursor: 'pointer' },
    btnFooterSave: { padding: isMobile ? '8px 18px' : '10px 25px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: isMobile ? 12 : 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
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

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
      
      {/* TIPS BANNER */}
      <div style={styles.tipsBanner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Info size={18} color="#3b82f6" />
          <span style={{ fontSize: 12, color: '#1e40af' }}>
            💡 Klik konten di sidebar kiri untuk mengedit. Preview langsung di area besar.
          </span>
        </div>
        <button onClick={() => setShowTips(false)} style={styles.tipsClose}>Tutup</button>
      </div>
      
      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack}>
          <ArrowLeft size={14} /> {!isMobile && 'Kembali'}
        </button>
        <h2 style={styles.pageTitle}>
          {editId ? '✏️ Edit Modul' : '📚 Buat Modul Baru'}
          {modulId && <span style={styles.idBadge}><Hash size={10} /> {modulId}</span>}
        </h2>
        <div style={styles.headerActions}>
          <button 
            onClick={() => setShowPreview(!showPreview)} 
            style={{ ...styles.btnPreview, background: showPreview ? '#3b82f6' : '#f1f5f9', color: showPreview ? 'white' : '#64748b' }}
          >
            <Eye size={14} /> {showPreview ? 'Edit' : 'Preview'}
          </button>
          {editId && (
            <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={{ ...styles.btnPreview, background: '#f1f5f9' }}>
              <ExternalLink size={14} /> {!isMobile && 'Live'}
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{ ...styles.btnSave, opacity: saving ? 0.6 : 1 }}>
            <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update' : 'Terbitkan'}
          </button>
          {modulId && (
            <button onClick={handleDeleteModul} style={{ ...styles.btnSave, background: '#ef4444' }}>
              <Trash2 size={14} /> Hapus
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div style={styles.statsRow}>
        <div style={styles.statMini}><div style={styles.statMiniValue}>{stats.totalSiswa}</div><div style={styles.statMiniLabel}>👥 Siswa</div></div>
        <div style={styles.statMini}><div style={styles.statMiniValue}>{stats.totalJadwal}</div><div style={styles.statMiniLabel}>📅 Jadwal</div></div>
        <div style={styles.statMini}><div style={styles.statMiniValue}>{stats.totalMapel}</div><div style={styles.statMiniLabel}>📘 Mapel</div></div>
        <div style={styles.statMini}><div style={styles.statMiniValue}>{stats.totalKonten}</div><div style={styles.statMiniLabel}>📄 Konten</div></div>
        <div style={styles.statMini}>
          <div style={styles.statMiniValue}>
            {guruId ? <span style={styles.idBadge}><Hash size={10} /> {guruId}</span> : '-'}
          </div>
          <div style={styles.statMiniLabel}>🆔 ID Guru</div>
        </div>
      </div>

      {showPreview ? (
        // PREVIEW MODE
        <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
              👁️ Preview Tampilan Siswa
            </h3>
            <button onClick={() => setShowPreview(false)} style={{ padding: '4px 10px', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
              <X size={14} /> Tutup
            </button>
          </div>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {coverImage && <img src={coverImage} alt="Cover" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />}
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', textAlign: 'center' }}>{title || 'Judul Modul'}</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>{subject} • {targetKelas}</p>
            {description && <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{description}</div>}
            
            {sections.map((sec, idx) => (
              <div key={sec.id} style={{ marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{sec.title || `Bagian ${idx + 1}`}</h4>
                {sec.type === 'text' && <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sec.content}</div>}
                {sec.type === 'file' && sec.content && <FilePreview url={sec.content} fileName={sec.fileName} fileType={sec.mimeType} />}
                {sec.type === 'video' && sec.content && <FilePreview url={sec.content} fileName={sec.fileName} fileType={sec.mimeType} />}
                {sec.type === 'assignment' && (
                  <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fde68a' }}>
                    <p>📝 {sec.content || 'Instruksi tugas'}</p>
                    {sec.endTime && <p style={{ fontSize: 11, color: '#f59e0b' }}>⏰ Deadline: {new Date(sec.endTime).toLocaleString('id-ID')}</p>}
                  </div>
                )}
              </div>
            ))}
            
            {quizData?.length > 0 && (
              <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0', textAlign: 'center', fontWeight: 700, color: '#166534' }}>
                ❓ Kuis ({quizData.length} soal)
              </div>
            )}
          </div>
        </div>
      ) : (
        // MAIN LAYOUT: SIDEBAR + EDITOR
        <div style={styles.mainGrid}>
          {/* SIDEBAR KIRI - KONTEN */}
          <div style={styles.sidebar}>
            
            {/* IDENTITAS */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><BookOpen size={14} /> Identitas</h4>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul modul..." style={styles.input} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={{...styles.select, flex: 1}}>
                  <option value="">Pilih Mata Pelajaran</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {kodeMapel && <span style={styles.mapelBadge}><Tag size={10} /> {kodeMapel}</span>}
              </div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi..." style={{...styles.input, minHeight: 50, resize: 'vertical'}} />
              <label style={styles.coverUpload}>
                {coverImage ? (
                  <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#94a3b8', padding: '16px 0' }}>
                    <ImageIcon size={18} />
                    <span style={{ fontSize: 10 }}>Upload Cover</span>
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />
              </label>
            </div>

            {/* TARGET */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><Target size={14} /> Target</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={styles.select}>
                  <option value="Reguler">📚 Reguler</option>
                  <option value="English">🗣️ English</option>
                  <option value="Semua">🌐 Semua</option>
                </select>
                <select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={styles.select}>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              
              <div style={{ marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                  <input type="checkbox" checked={sendToSpecificStudents} onChange={() => setSendToSpecificStudents(!sendToSpecificStudents)} />
                  <UserPlus size={14} /> Kirim ke siswa tertentu
                </label>
                {sendToSpecificStudents && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Cari siswa..." style={{...styles.input, paddingLeft: 28, marginBottom: 0, fontSize: 10}} onFocus={() => setShowStudentPicker(true)} />
                      </div>
                      <button onClick={selectAllFiltered} style={styles.btnSelectAll}>Pilih Semua</button>
                    </div>
                    {selectedStudents.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {selectedStudents.slice(0, 5).map(s => (
                          <span key={s.studentId} style={styles.studentTag}>
                            {getStudentInitials(s.nama)}
                            <button onClick={() => toggleStudentSelection(s)} style={styles.removeTag}><X size={10} /></button>
                          </span>
                        ))}
                        {selectedStudents.length > 5 && (
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>+{selectedStudents.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PENGATURAN */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><Settings size={14} /> Pengaturan</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} placeholder="Minggu" style={styles.inputSmall} />
                <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} placeholder="Tahun" style={styles.inputSmall} />
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setStatusModul(opt.value)} style={{ flex: 1, padding: '4px 6px', borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: 'pointer', background: statusModul === opt.value ? opt.color : '#f1f5f9', color: statusModul === opt.value ? 'white' : '#64748b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
              {statusModul === 'terjadwal' && (
                <div style={styles.scheduleBox}>
                  <p style={styles.scheduleTitle}><CalendarDays size={12} /> Jadwal Rilis</p>
                  <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.scheduleLabel}>Mulai *</label>
                      <input type="datetime-local" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} style={styles.scheduleInput} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.scheduleLabel}>Selesai</label>
                      <input type="datetime-local" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} style={styles.scheduleInput} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DAFTAR KONTEN */}
            <div style={styles.card}>
              <h4 style={{...styles.cardTitle, marginBottom: 8 }}>
                <Layers size={14} /> Konten ({sections.length})
              </h4>
              {sections.length === 0 && (
                <div style={styles.emptyContent}>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>Belum ada konten</p>
                </div>
              )}
              {sections.map((sec, idx) => {
                const typeIcons = { text: '📄', file: '📁', video: '🎥', assignment: '📝' };
                const isActive = activeSection === sec.id;
                return (
                  <div 
                    key={sec.id} 
                    onClick={() => setActiveSection(sec.id)} 
                    style={{ 
                      ...styles.sectionItem, 
                      background: isActive ? '#eef2ff' : '#f8fafc', 
                      borderColor: isActive ? '#3b82f6' : '#e2e8f0',
                      borderWidth: isActive ? '2px' : '1px'
                    }}
                  >
                    <span style={styles.sectionLabel}>
                      {typeIcons[sec.type] || '📄'}
                      <span style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sec.title || `Bagian ${idx + 1}`}
                      </span>
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }} 
                      style={{ ...styles.btnX, padding: 2 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* TOMBOL TAMBAH KONTEN */}
            <div style={styles.addSectionGrid}>
              {[
                { type: 'text', icon: <Type size={12} />, label: 'Teks', color: '#3b82f6' },
                { type: 'file', icon: <FileUp size={12} />, label: 'File', color: '#10b981' },
                { type: 'video', icon: <Video size={12} />, label: 'Video', color: '#ef4444' },
                { type: 'assignment', icon: <Send size={12} />, label: 'Tugas', color: '#f59e0b' }
              ].map(btn => (
                <button key={btn.type} onClick={() => addSection(btn.type)} style={{ ...styles.addSectionBtn, borderColor: `${btn.color}30`, color: btn.color }}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>

            {/* KUIS */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><HelpCircle size={14} /> Kuis</h4>
              {quizData?.length > 0 ? (
                <div style={styles.quizInfo}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>{quizData.length} soal</span>
                  <button onClick={() => { if (!editId) return alert("Simpan dulu!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} style={styles.btnEditQuiz}>Edit</button>
                </div>
              ) : (
                <button onClick={() => { if (!editId) return alert("Simpan dulu!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} style={styles.btnCreateQuiz}>
                  <HelpCircle size={14} /> + Buat Kuis
                </button>
              )}
            </div>
          </div>

          {/* AREA EDITOR - LEBAR */}
          <div style={styles.editorArea}>
            {renderEditorContent()}
          </div>
        </div>
      )}

      {/* FLOATING FOOTER */}
      <div style={styles.floatingFooter}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnFooterCancel}>Batal</button>
        {editId && (
          <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={{ ...styles.btnFooterCancel, background: 'white', border: '1px solid #e2e8f0' }}>
            <ExternalLink size={14} /> {!isMobile && 'Live Preview'}
          </button>
        )}
        <button onClick={handleSave} disabled={saving} style={{ ...styles.btnFooterSave, opacity: saving ? 0.6 : 1 }}>
          <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update' : 'Terbitkan'}
        </button>
      </div>
    </div>
  );
};

export default ManageMateri;