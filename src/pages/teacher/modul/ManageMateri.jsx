// src/pages/teacher/modul/ManageMateri.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../../firebase';
import { 
  collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, 
  getDocs, deleteDoc, query, where, orderBy, limit
} from "firebase/firestore";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, deleteFile } from '../../../services/uploadService';
import { 
  Save, Trash2, FileText, HelpCircle, Clock, ArrowLeft, 
  FileUp, Type, Video, X, Image as ImageIcon, BookOpen, 
  Send, Layers, ChevronDown, ChevronUp, Settings, Eye, 
  CheckCircle, Calendar, Users, Target, AlertCircle, 
  Smartphone, Tablet, Laptop, Info, ExternalLink, CalendarDays, 
  Archive, UserPlus, UserCheck, Search, Loader2, Hash, Tag, 
  Zap, Sparkles, Filter, User, GraduationCap, 
  FileSpreadsheet, FileImage, File, FileVideo,
  Upload, Cloud, Server
} from 'lucide-react';

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
        <iframe src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen title="Video" />
      </div>
    );
  }
  
  if (fileType?.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return (
      <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f8fafc', maxHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={url} alt={fileName || 'Preview'} style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }} onError={() => setPreviewError(true)} />
        {previewError && <div style={{ padding: 20, color: '#ef4444', textAlign: 'center' }}>Gagal memuat gambar</div>}
      </div>
    );
  }
  
  if (fileType === 'application/pdf' || url.match(/\.pdf$/i)) {
    return (
      <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f8fafc', padding: 16, textAlign: 'center' }}>
        <div style={{ marginBottom: 8 }}><File size={40} color="#ef4444" /></div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 16px', background: '#ef4444', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>📄 Buka PDF</a>
      </div>
    );
  }
  
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
        if (url) newText = value.substring(0, start) + `[${selectedText}](${url})` + value.substring(end);
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
    color: '#64748b'
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 2, padding: 6, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        {['B','I','U','• List','🔗 Link'].map((label, i) => {
          const formats = ['bold','italic','underline','list','link'];
          return <button key={i} type="button" onClick={() => applyFormat(formats[i])} style={toolbarBtn}>{label}</button>;
        })}
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
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [showTips, setShowTips] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
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

  // ============================================================
  // EFFECTS
  // ============================================================
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

  // ============================================================
  // 🔥 UPLOAD FILE - VERSI YANG BENAR
  // ============================================================
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
      // 1. TENTUKAN FOLDER BERDASARKAN TIPE FILE
      let folder = 'dokumen';
      if (type === 'cover') {
        folder = 'cover';
      } else if (file.type.includes('image')) {
        folder = 'gambar';
      } else if (file.type.includes('pdf')) {
        folder = 'pdf';
      }

      // 2. BUAT PATH UNIK
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const cleanFilePath = `${folder}/${uniqueFileName}`;

      console.log(`📤 Upload ke Supabase: ${cleanFilePath} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // 3. UPLOAD KE SUPABASE
      const { data, error: uploadError } = await supabase.storage
        .from('materi-bimbel')
        .upload(cleanFilePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);
        throw uploadError;
      }

      // 4. AMBIL PUBLIC URL
      const { data: { publicUrl } } = supabase.storage
        .from('materi-bimbel')
        .getPublicUrl(cleanFilePath);

      console.log('✅ Upload berhasil:', publicUrl);

      setUploadProgress(100);
      setUploadStatus({ type: 'success', message: '✅ File berhasil diunggah!' });
      setAutoSaveStatus('✅ File berhasil diunggah!');
      setTimeout(() => setAutoSaveStatus(''), 2000);

      return {
        success: true,
        downloadURL: publicUrl,
        filePath: cleanFilePath,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };

    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadStatus({ type: 'error', message: `❌ ${error.message}` });
      alert("❌ Upload gagal: " + error.message);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setTimeout(() => setUploadStatus({ type: '', message: '' }), 3000);
    }
  };

  // ============================================================
  // COVER UPLOAD
  // ============================================================
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
    }
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  // ============================================================
  // 🔥 SECTION FILE UPLOAD - VERSI YANG BENAR
  // ============================================================
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
              mimeType: result.fileType,
              fileSize: result.fileSize,
              filePath: result.filePath  // 🔥 Simpan cleanFilePath
            } 
          : s
      ));
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============================================================
  // DELETE SECTION + HAPUS FILE DARI SUPABASE
  // ============================================================
  const removeSection = async (id) => {
    if (!window.confirm("Hapus section ini? File terkait juga akan dihapus dari penyimpanan.")) return;
    
    const section = sections.find(s => s.id === id);
    if (section?.filePath) {
      try {
        const { error } = await supabase.storage
          .from('materi-bimbel')
          .remove([section.filePath]);
        if (error) {
          console.warn('⚠️ Gagal hapus file:', error);
        } else {
          console.log('✅ File berhasil dihapus dari Supabase');
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

  // ============================================================
  // DELETE MODUL + HAPUS SEMUA FILE
  // ============================================================
  const handleDeleteModul = async () => {
    if (!modulId) return;
    if (!window.confirm(`⚠️ Hapus modul "${title}"?\n\nSemua data dan file terkait akan dihapus permanen!`)) return;
    
    try {
      const filePaths = sections.filter(s => s.filePath).map(s => s.filePath);
      
      if (filePaths.length > 0) {
        const { error } = await supabase.storage
          .from('materi-bimbel')
          .remove(filePaths);
        if (error) console.warn('⚠️ Gagal hapus beberapa file:', error);
        else console.log(`✅ ${filePaths.length} file dihapus dari Supabase`);
      }
      
      if (coverImage) {
        const coverPath = coverImage.split('/').slice(-2).join('/');
        if (coverPath) {
          await supabase.storage.from('materi-bimbel').remove([coverPath]);
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

  // ============================================================
  // FUNGSI KONTEN LAINNYA
  // ============================================================
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
      endTime: '' 
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
    setShowPreview(false);
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

  // ============================================================
  // SISWA FUNCTIONS
  // ============================================================
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
  // SIMPAN MODUL
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
    
    setSaving(true);
    
    const payload = {
      title: title.toUpperCase(),
      subject: subject.toUpperCase(),
      guruId: guruId,
      kodeMapel: kodeMapel,
      guruName: guruName,
      coverImage,
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
  // RENDER FUNCTIONS
  // ============================================================
  const renderStudentPreview = () => {
    const previewWidth = previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : '100%';
    const isScheduled = statusModul === 'terjadwal' && tanggalMulai;
    const scheduleDate = isScheduled ? new Date(tanggalMulai) : null;
    const isNotYetActive = isScheduled && scheduleDate && scheduleDate > new Date();
    
    return (
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginTop: 16, background: '#f8fafc' }}>
        <div style={{ background: '#1e293b', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['mobile','tablet','desktop'].map(device => (
              <button key={device} onClick={() => setPreviewDevice(device)} style={{ padding: '4px 8px', borderRadius: 6, background: previewDevice === device ? '#3b82f6' : 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>
                {device === 'mobile' ? <Smartphone size={14} /> : device === 'tablet' ? <Tablet size={14} /> : <Laptop size={14} />}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Preview Tampilan Siswa</span>
          <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ maxWidth: previewWidth, margin: '0 auto', background: 'white', minHeight: 400, padding: 16, transition: 'all 0.3s ease' }}>
          {isNotYetActive && <div style={{ background: '#fef3c7', padding: 8, borderRadius: 8, marginBottom: 16, textAlign: 'center', border: '1px solid #fde68a', fontSize: 11, color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Clock size={14} /> Modul tersedia {scheduleDate.toLocaleDateString('id-ID')} {scheduleDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>}
          {sendToSpecificStudents && selectedStudents.length > 0 && <div style={{ background: '#e0e7ff', padding: 8, borderRadius: 8, marginBottom: 16, border: '1px solid #818cf8', fontSize: 11, color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><UserCheck size={14} /> Dikirim ke {selectedStudents.length} siswa</div>}
          {coverImage && <img src={coverImage} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', margin: 0, textAlign: 'center' }}>{title || 'Judul Modul'}</h2>
          <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 }}>{subject} • {targetKelas}</p>
          {guruId && <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>👨‍🏫 {guruId}</p>}
          {description && <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#475569' }}>{description}</div>}
          
          {sections.map((sec, idx) => (
            <div key={sec.id} style={{ marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 }}>{sec.title || `Bagian ${idx + 1}`}</h4>
              {sec.type === 'text' && <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sec.content}</div>}
              {sec.type === 'file' && sec.content && <FilePreview url={sec.content} fileName={sec.fileName} fileType={sec.mimeType} />}
              {sec.type === 'video' && sec.content && <FilePreview url={sec.content} fileName={sec.fileName} fileType={sec.mimeType} />}
              {sec.type === 'assignment' && <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fde68a' }}><p>📝 {sec.content || 'Instruksi tugas'}</p>{sec.endTime && <p style={{ fontSize: 11, color: '#f59e0b' }}>⏰ Deadline: {new Date(sec.endTime).toLocaleString('id-ID')}</p>}</div>}
            </div>
          ))}
          {quizData?.length > 0 && <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, fontWeight: 'bold', color: '#166534', textAlign: 'center' }}>❓ Kuis ({quizData.length} soal)</div>}
          <div style={{ marginTop: 20, textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}><p style={{ fontSize: 11, color: '#94a3b8' }}>✨ Ini adalah tampilan yang akan dilihat siswa ✨</p></div>
        </div>
      </div>
    );
  };

  const renderEditorContent = () => {
    if (!activeSection) return null;
    const section = sections.find(s => s.id === activeSection);
    if (!section) return null;
    
    if (section.type === 'text') {
      return <SimpleEditor value={section.content} onChange={value => updateSection(activeSection, 'content', value)} placeholder="Tulis materi di sini... Gunakan toolbar untuk format teks" />;
    }
    
    if (section.type === 'file') {
      return section.content ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <FileText size={36} color="#3b82f6" />
          <div><p style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{section.fileName || 'File'}</p><p style={{ fontSize: 10, color: '#94a3b8' }}>{formatFileSize(section.fileSize)}</p></div>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <a href={section.content} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', background: '#3b82f6', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 11, fontWeight: 600 }}>🔍 Buka</a>
            <button onClick={() => updateSection(activeSection, 'content', '')} style={{ padding: '4px 10px', background: '#fee2e2', color: '#ef4444', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>🗑️ Hapus</button>
          </div>
        </div>
      ) : (
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '30px 20px', border: '2px dashed #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#f8fafc', color: '#64748b', fontSize: 13 }}>
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
                <Upload size={30} color="#94a3b8" />
                <span>Upload PDF/DOCX/PPT/Gambar (Max 50MB)</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>Seret atau klik untuk upload</span>
              </>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" hidden onChange={(e) => handleSectionFileUpload(e, activeSection)} disabled={uploading} />
          </label>
          {uploadStatus.message && <div style={{ fontSize: 11, fontWeight: 600, marginTop: 8, textAlign: 'center', color: uploadStatus.type === 'error' ? '#ef4444' : '#10b981' }}>{uploadStatus.message}</div>}
        </div>
      );
    }
    
    if (section.type === 'video') {
      const youtubeId = getYouTubeId(section.content);
      return (
        <>
          <input value={section.content} onChange={e => updateSection(activeSection, 'content', e.target.value)} placeholder="Tempel link YouTube, Canva, Google Drive..." style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
          {youtubeId && <div style={{ marginTop: 12 }}><p style={{ fontSize: 11, color: '#10b981', marginBottom: 6 }}>✅ Preview video:</p><iframe width="100%" height="250" src={`https://www.youtube.com/embed/${youtubeId}`} frameBorder="0" allowFullScreen style={{ borderRadius: 8 }} /></div>}
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>💡 Link YouTube akan otomatis ditampilkan sebagai video player</p>
        </>
      );
    }
    
    if (section.type === 'assignment') {
      return (
        <div>
          <textarea value={section.content} onChange={e => updateSection(activeSection, 'content', e.target.value)} placeholder="Tulis instruksi tugas di sini..." style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', background: '#f8fafc' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, padding: 12, background: '#fffbeb', borderRadius: 8 }}>
            <Clock size={18} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>Deadline Tugas:</span>
            <input type="datetime-local" value={section.endTime} onChange={e => updateSection(activeSection, 'endTime', e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12, outline: 'none', background: 'white' }} />
          </div>
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>💡 Kosongkan jika tidak ada batas waktu</p>
        </div>
      );
    }
    
    return null;
  };

  // ============================================================
  // STYLES
  // ============================================================
  const styles = {
    container: { maxWidth: 1400, margin: '0 auto', paddingBottom: 100, paddingLeft: isMobile ? 12 : 16, paddingRight: isMobile ? 12 : 16 },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 },
    spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #652D90', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    autoSaveToast: { position: 'fixed', bottom: 80, right: 20, background: '#10b981', color: 'white', padding: '8px 20px', borderRadius: 20, fontSize: 11, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    tipsBanner: { background: '#eef2ff', borderRadius: 12, padding: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
    tipsClose: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 11 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
    btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 12 : 13, display: 'flex', alignItems: 'center', gap: 4 },
    pageTitle: { margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' },
    headerActions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
    btnPreview: { border: 'none', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 },
    btnLiveView: { background: 'white', border: '1px solid #e2e8f0', padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 },
    btnSave: { background: '#10b981', color: 'white', border: 'none', padding: isMobile ? '6px 14px' : '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 12 : 13, display: 'flex', alignItems: 'center', gap: 6 },
    mainGrid: { display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row' },
    sidebar: { width: isMobile ? '100%' : '350px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 },
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
    editorArea: { flex: 1, minWidth: 0 },
    emptyEditor: { textAlign: 'center', padding: isMobile ? 30 : 60, background: 'white', borderRadius: 12, border: '2px dashed #e2e8f0', color: '#94a3b8' },
    editorCard: { background: 'white', padding: isMobile ? 14 : 20, borderRadius: 12, border: '1px solid #f1f5f9' },
    editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
    editorTypeBadge: { fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6 },
    btnEditorPreview: { background: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 },
    btnEditorDelete: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 },
    sectionTitleInput: { width: '100%', border: 'none', fontSize: 16, fontWeight: 700, outline: 'none', marginBottom: 16, padding: '4px 0', color: '#1e293b', borderBottom: '2px solid #e2e8f0' },
    floatingFooter: { position: 'fixed', bottom: 0, left: isMobile ? 0 : 260, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', padding: isMobile ? '8px 12px' : '10px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, zIndex: 50, flexWrap: 'wrap' },
    btnFooterCancel: { padding: isMobile ? '8px 14px' : '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: isMobile ? 12 : 13, cursor: 'pointer' },
    btnFooterLive: { padding: isMobile ? '8px 14px' : '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: isMobile ? 12 : 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    btnFooterSave: { padding: isMobile ? '8px 18px' : '10px 25px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: isMobile ? 12 : 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
    statsRow: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8, marginBottom: 12 },
    statMini: { background: 'white', padding: '8px 12px', borderRadius: 10, border: '1px solid #f1f5f9', textAlign: 'center' },
    statMiniValue: { fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#1e293b' },
    statMiniLabel: { fontSize: 9, color: '#94a3b8' },
    idBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 9, background: '#eef2ff', color: '#3b82f6', fontWeight: 600 },
    mapelBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 9, background: '#ede9fe', color: '#8b5cf6', fontWeight: 600 }
  };

  // ============================================================
  // RENDER
  // ============================================================
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
      
      {autoSaveStatus && <div style={styles.autoSaveToast}>{autoSaveStatus}</div>}
      
      {showTips && (
        <div style={styles.tipsBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Info size={18} color="#3b82f6" />
            <span style={{ fontSize: 12, color: '#1e40af' }}>
              💡 Hanya siswa yang dijadwalkan dengan Anda yang muncul. {allStudents.length === 0 && 'Belum ada jadwal, hubungi admin.'}
            </span>
          </div>
          <button onClick={() => setShowTips(false)} style={styles.tipsClose}>Tutup</button>
        </div>
      )}
      
      <div style={styles.header}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack}>
          <ArrowLeft size={14} /> {!isMobile && 'Kembali'}
        </button>
        <h2 style={styles.pageTitle}>
          {editId ? '✏️ Edit Modul' : '📚 Buat Modul Baru'}
          {modulId && <span style={styles.idBadge}><Hash size={10} /> {modulId}</span>}
        </h2>
        <div style={styles.headerActions}>
          <button onClick={() => setShowPreview(!showPreview)} style={{ ...styles.btnPreview, background: showPreview ? '#3b82f6' : '#f1f5f9', color: showPreview ? 'white' : '#64748b' }}>
            <Eye size={14} /> {showPreview ? 'Edit' : 'Preview'}
          </button>
          {editId && (
            <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={styles.btnLiveView}>
              <ExternalLink size={14} /> {!isMobile && 'Live'}
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{ ...styles.btnSave, opacity: saving ? 0.6 : 1 }}>
            <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update' : 'Terbitkan'}
          </button>
          {modulId && (
            <button onClick={handleDeleteModul} style={{ ...styles.btnSave, background: '#ef4444', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
              <Trash2 size={14} /> Hapus Modul
            </button>
          )}
        </div>
      </div>

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
        renderStudentPreview()
      ) : (
        <div style={styles.mainGrid}>
          
          {/* ===== SIDEBAR ===== */}
          <div style={styles.sidebar}>
            
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
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi..." style={{...styles.input, minHeight: 60, resize: 'vertical'}} />
              <label style={styles.coverUpload}>
                {coverImage ? <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#94a3b8', padding: '20px 0' }}><ImageIcon size={18} /><span style={{ fontSize: 11 }}>Upload Cover</span></div>}
                <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />
              </label>
            </div>

            <div style={styles.card}>
              <h4 style={styles.cardTitle}><Target size={14} /> Target</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={styles.select}>
                  <option value="Reguler">📚 Reguler</option><option value="English">🗣️ English</option><option value="Semua">🌐 Semua</option>
                </select>
                <select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={styles.select}>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              {(targetKelas === "Semua" || targetKategori === "Semua") && (
                <div style={styles.warningBanner}><AlertCircle size={12} /> Modul untuk {(targetKelas === "Semua" ? 'SEMUA KELAS ' : '')}{(targetKategori === "Semua" ? 'SEMUA PROGRAM' : '')}</div>
              )}
              
              <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <input type="checkbox" checked={sendToSpecificStudents} onChange={() => setSendToSpecificStudents(!sendToSpecificStudents)} />
                  <UserPlus size={14} /> Kirim ke siswa tertentu
                </label>
                {sendToSpecificStudents && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Cari siswa..." style={{...styles.input, paddingLeft: 32, marginBottom: 0}} onFocus={() => setShowStudentPicker(true)} />
                      </div>
                      <button onClick={selectAllFiltered} style={styles.btnSelectAll}>Pilih Semua</button>
                    </div>
                    {allStudents.length === 0 && <div style={{ background: '#fef3c7', padding: 8, borderRadius: 6, fontSize: 10, color: '#b45309', marginTop: 6 }}>⚠️ Tidak ada siswa dijadwalkan. Hubungi admin.</div>}
                    {selectedStudents.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {selectedStudents.map(s => (
                          <span key={s.studentId} style={styles.studentTag}>
                            {getStudentInitials(s.nama)} <span style={{ fontSize: 10 }}>{s.nama}</span>
                            <span style={{ fontSize: 8, color: '#94a3b8', fontFamily: 'monospace' }}>#{s.studentId?.slice(-4)}</span>
                            <button onClick={() => toggleStudentSelection(s)} style={styles.removeTag}><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    {showStudentPicker && (
                      <div style={styles.studentPicker}>
                        <div style={styles.studentPickerHeader}>
                          <span style={{ fontSize: 11, fontWeight: 'bold' }}>📋 {filteredStudents.length} siswa</span>
                          <button onClick={() => setShowStudentPicker(false)} style={styles.closePicker}>✕</button>
                        </div>
                        <div style={styles.studentPickerList}>
                          {filteredStudents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 11 }}>
                              {studentSearch ? 'Tidak ditemukan' : 'Tidak ada siswa'}
                            </div>
                          ) : (
                            filteredStudents.map(s => {
                              const isSelected = selectedStudents.some(sel => sel.studentId === s.studentId);
                              return (
                                <div key={s.studentId} onClick={() => toggleStudentSelection(s)} style={{ ...styles.studentPickerItem, background: isSelected ? '#eef2ff' : 'transparent', borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent' }}>
                                  <div style={styles.studentPickerAvatar}>{getStudentInitials(s.nama)}</div>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{s.nama}<span style={styles.studentIdChip}>#{s.studentId}</span></div><div style={{ fontSize: 9, color: '#94a3b8' }}>{s.kelasSekolah || '-'}</div></div>
                                  {isSelected ? <CheckCircle size={16} color="#10b981" /> : <div style={{ width: 16, height: 16, border: '2px solid #d1d5db', borderRadius: '50%' }} />}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>{selectedStudents.length} dari {allStudents.length} siswa dipilih</div>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h4 style={styles.cardTitle}><Settings size={14} /> Pengaturan</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} placeholder="Minggu" style={styles.inputSmall} />
                <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} placeholder="Tahun" style={styles.inputSmall} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setStatusModul(opt.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: 'pointer', background: statusModul === opt.value ? opt.color : '#f1f5f9', color: statusModul === opt.value ? 'white' : '#64748b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }} title={opt.desc}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
              {statusModul === 'terjadwal' && (
                <div style={styles.scheduleBox}>
                  <p style={styles.scheduleTitle}><CalendarDays size={14} /> Jadwal Rilis</p>
                  <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}><label style={styles.scheduleLabel}>Mulai *</label><input type="datetime-local" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} style={styles.scheduleInput} /></div>
                    <div style={{ flex: 1 }}><label style={styles.scheduleLabel}>Selesai</label><input type="datetime-local" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} style={styles.scheduleInput} /></div>
                  </div>
                </div>
              )}
              {statusModul === 'aktif' && <div style={styles.statusMessageGreen}><CheckCircle size={12} /> Langsung aktif</div>}
              {statusModul === 'arsip' && <div style={styles.statusMessageGray}>📦 Tidak tampil di dashboard</div>}
            </div>

            <div style={styles.card}>
              <h4 style={styles.cardTitle}><Layers size={14} /> Konten ({sections.length})</h4>
              {sections.length === 0 && <div style={styles.emptyContent}><p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Belum ada konten</p></div>}
              {sections.map((sec, idx) => (
                <div key={sec.id} onClick={() => setActiveSection(sec.id)} style={{ ...styles.sectionItem, background: activeSection === sec.id ? '#eef2ff' : '#f8fafc', borderColor: activeSection === sec.id ? '#3b82f6' : '#e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 'up'); }} style={styles.btnArrow} disabled={idx === 0}><ChevronUp size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 'down'); }} style={styles.btnArrow} disabled={idx === sections.length - 1}><ChevronDown size={12} /></button>
                  </div>
                  <span style={styles.sectionLabel}>{sec.type === 'text' ? '📄' : sec.type === 'file' ? '📁' : sec.type === 'video' ? '🎥' : '📝'}<span>{sec.title || `Bagian ${idx + 1}`}</span></span>
                  <button onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }} style={styles.btnX}><X size={12} /></button>
                </div>
              ))}
            </div>

            <div style={styles.addSectionGrid}>
              {[
                { type: 'text', icon: <Type size={13} />, label: 'Teks', color: '#3b82f6' },
                { type: 'file', icon: <FileUp size={13} />, label: 'File', color: '#10b981' },
                { type: 'video', icon: <Video size={13} />, label: 'Video', color: '#ef4444' },
                { type: 'assignment', icon: <Send size={13} />, label: 'Tugas', color: '#f59e0b' }
              ].map(btn => (
                <button key={btn.type} onClick={() => addSection(btn.type)} style={{ ...styles.addSectionBtn, borderColor: `${btn.color}20`, color: btn.color }}>{btn.icon} {btn.label}</button>
              ))}
            </div>

            <div style={styles.card}>
              <h4 style={styles.cardTitle}><HelpCircle size={14} /> Kuis</h4>
              {quizData?.length > 0 ? (
                <div style={styles.quizInfo}><CheckCircle size={14} color="#10b981" /><span>{quizData.length} soal</span><button onClick={() => { if (!editId) return alert("Simpan dulu!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} style={styles.btnEditQuiz}>Edit</button></div>
              ) : (
                <button onClick={() => { if (!editId) return alert("Simpan dulu!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} style={styles.btnCreateQuiz}><HelpCircle size={14} /> + Buat Kuis</button>
              )}
            </div>
          </div>

          {/* ===== EDITOR ===== */}
          <div style={styles.editorArea}>
            {!activeSection ? (
              <div style={styles.emptyEditor}>
                <Layers size={48} color="#cbd5e1" />
                <h3 style={{ fontSize: 16, marginTop: 12 }}>Pilih atau Tambah Konten</h3>
                <p style={{ fontSize: 12, marginTop: 4 }}>Klik konten di sidebar atau tambah baru</p>
              </div>
            ) : (
              <div style={styles.editorCard}>
                <div style={styles.editorHeader}>
                  <span style={{ ...styles.editorTypeBadge, background: sections.find(s => s.id === activeSection)?.type === 'assignment' ? '#fef3c7' : '#e0e7ff', color: sections.find(s => s.id === activeSection)?.type === 'assignment' ? '#b45309' : '#3730a3' }}>
                    {sections.find(s => s.id === activeSection)?.type === 'text' ? '📄 TEKS' : sections.find(s => s.id === activeSection)?.type === 'file' ? '📁 FILE' : sections.find(s => s.id === activeSection)?.type === 'video' ? '🎥 VIDEO' : '📝 TUGAS'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowPreview(true)} style={styles.btnEditorPreview}><Eye size={12} /> Preview</button>
                    <button onClick={() => removeSection(activeSection)} style={styles.btnEditorDelete}><Trash2 size={12} /> Hapus</button>
                  </div>
                </div>

                <input value={sections.find(s => s.id === activeSection)?.title || ''} onChange={e => updateSection(activeSection, 'title', e.target.value)} placeholder="Judul section..." style={styles.sectionTitleInput} />
                {renderEditorContent()}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={styles.floatingFooter}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnFooterCancel}>Batal</button>
        {editId && <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={styles.btnFooterLive}><ExternalLink size={14} /> {!isMobile && 'Live Preview'}</button>}
        <button onClick={handleSave} disabled={saving} style={{ ...styles.btnFooterSave, opacity: saving ? 0.6 : 1 }}><Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update' : 'Terbitkan'}</button>
      </div>
    </div>
  );
};

export default ManageMateri;