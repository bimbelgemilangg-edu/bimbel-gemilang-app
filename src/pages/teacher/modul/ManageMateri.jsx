// src/pages/teacher/modul/ManageMateri.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, 
  getDocs, deleteDoc 
} from "firebase/firestore";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadToDrive } from '../../../services/uploadService';
import { 
  Save, Trash2, FileText, HelpCircle, Clock, ArrowLeft, FileUp, Type, Video, X, 
  Image as ImageIcon, BookOpen, Send, Layers, ChevronDown, ChevronUp, Settings, 
  Eye, Copy, CheckCircle, Calendar, Users, Target, AlertCircle, RefreshCw, 
  Smartphone, Tablet, Laptop, Info, ExternalLink,
  Bold, Italic, Underline, List, CalendarDays, Award, Archive, 
  UserPlus, UserCheck as UserCheckIcon, Search, Loader2, Check
} from 'lucide-react';

// ============================================
// SIMPLE EDITOR COMPONENT
// ============================================
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
      <div style={{ 
        display: 'flex', gap: 4, padding: 8, background: '#f8fafc', 
        borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap'
      }}>
        <button type="button" onClick={() => applyFormat('bold')} style={toolbarBtn} title="Bold (**teks**)"><b>B</b></button>
        <button type="button" onClick={() => applyFormat('italic')} style={toolbarBtn} title="Italic (*teks*)"><i>I</i></button>
        <button type="button" onClick={() => applyFormat('underline')} style={toolbarBtn} title="Underline"><u>U</u></button>
        <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }}></span>
        <button type="button" onClick={() => applyFormat('list')} style={toolbarBtn} title="List (bullet point)">• List</button>
        <button type="button" onClick={() => applyFormat('link')} style={toolbarBtn} title="Link (tambah URL)">🔗 Link</button>
      </div>
      <textarea
        id="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ 
          width: '100%', minHeight: 250, padding: 12, 
          border: 'none', outline: 'none', fontSize: 13, 
          resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6
        }}
      />
      <div style={{ padding: 8, background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>💡 Format: **teks** untuk bold</span>
        <span>*teks* untuk italic</span>
        <span>[teks](url) untuk link</span>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  // ===== RESPONSIVE STATE =====
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ===== STATES =====
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [showTips, setShowTips] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // IDENTITAS
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [description, setDescription] = useState("");
  
  // KONTEN
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  
  // PENGATURAN
  const [targetKategori, setTargetKategori] = useState("Reguler");
  const [targetKelas, setTargetKelas] = useState("1 SD");
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
  
  // TARGET SISWA SPESIFIK
  const [sendToSpecificStudents, setSendToSpecificStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  
  // QUIZ
  const [quizData, setQuizData] = useState([]);
  
  // DATA REFERENSI
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjects, setSubjects] = useState(["Umum"]);
  const [authorName] = useState(localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru");

  const COLLECTION_NAME = "bimbel_modul";
  const STATUS_OPTIONS = [
    { value: 'aktif', label: '🟢 Aktif', color: '#10b981', desc: 'Modul aktif dan bisa diakses siswa', icon: <CheckCircle size={12} /> },
    { value: 'terjadwal', label: '🟡 Terjadwal', color: '#f59e0b', desc: 'Modul akan aktif sesuai jadwal', icon: <CalendarDays size={12} /> },
    { value: 'arsip', label: '📦 Arsip', color: '#64748b', desc: 'Modul tidak aktif, hanya arsip', icon: <Archive size={12} /> }
  ];

  // ===== EFFECTS =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ambil data siswa
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snap = await getDocs(collection(db, "students"));
        const data = snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          studentId: d.data().studentId || d.id,
          nama: d.data().nama || 'Tidak bernama'
        }));
        data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
        setAllStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!editId && title) {
      const timer = setTimeout(() => {
        const draft = {
          title, subject, coverImage, description, sections, 
          targetKategori, targetKelas, mingguKe, tahunAjaran, statusModul,
          tanggalMulai, tanggalSelesai, sendToSpecificStudents, selectedStudents,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('draft_modul', JSON.stringify(draft));
        setAutoSaveStatus('💾 Draft tersimpan');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [title, subject, coverImage, description, sections, targetKategori, targetKelas, 
      mingguKe, tahunAjaran, statusModul, tanggalMulai, tanggalSelesai, 
      sendToSpecificStudents, selectedStudents, editId]);

  // Load draft
  useEffect(() => {
    if (!editId) {
      const draft = localStorage.getItem('draft_modul');
      if (draft) {
        try {
          const data = JSON.parse(draft);
          if (window.confirm('📝 Ada draft modul yang belum disimpan. Apakah ingin melanjutkan?')) {
            setTitle(data.title || '');
            setSubject(data.subject || '');
            setCoverImage(data.coverImage || null);
            setDescription(data.description || '');
            setSections(data.sections || []);
            setTargetKategori(data.targetKategori || 'Reguler');
            setTargetKelas(data.targetKelas || '1 SD');
            setMingguKe(data.mingguKe || 1);
            setTahunAjaran(data.tahunAjaran || '2025/2026');
            setStatusModul(data.statusModul || 'aktif');
            setTanggalMulai(data.tanggalMulai || (() => {
              const date = new Date();
              date.setDate(date.getDate() + 2);
              date.setHours(0, 0, 0, 0);
              return date.toISOString().slice(0, 16);
            })());
            setTanggalSelesai(data.tanggalSelesai || '');
            setSendToSpecificStudents(data.sendToSpecificStudents || false);
            setSelectedStudents(data.selectedStudents || []);
          }
        } catch (e) {
          console.error("Error loading draft:", e);
        }
      }
    }
  }, [editId]);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const snapSiswa = await getDocs(collection(db, "students"));
        const data = snapSiswa.docs.map(d => d.data());
        const classes = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setAvailableClasses(['Semua', ...classes]);
        
        const snapGuru = await getDocs(collection(db, "teachers"));
        const guruData = snapGuru.docs.map(d => d.data());
        const mapelList = [...new Set(guruData.map(t => t.mapel).filter(Boolean))];
        if (mapelList.length === 0) mapelList.push("Umum");
        setSubjects(['Umum', ...mapelList.sort()]);
      } catch (error) {
        console.error("Error fetching context:", error);
      }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    if (editId) fetchModulData();
  }, [editId]);

  // ===== FUNCTIONS =====
  const fetchModulData = async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, editId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || "");
        setSubject(data.subject || "");
        setCoverImage(data.coverImage || null);
        setDescription(data.description || "");
        setSections(data.blocks || []);
        setQuizData(data.quizData || []);
        setTargetKategori(data.targetKategori || "Reguler");
        setTargetKelas(data.targetKelas || "1 SD");
        setMingguKe(data.mingguKe || 1);
        setTahunAjaran(data.tahunAjaran || "2025/2026");
        setStatusModul(data.status || "aktif");
        if (data.tanggalMulai) setTanggalMulai(data.tanggalMulai);
        if (data.tanggalSelesai) setTanggalSelesai(data.tanggalSelesai);
        if (data.selectedStudents) setSelectedStudents(data.selectedStudents);
        if (data.sendToSpecificStudents !== undefined) setSendToSpecificStudents(data.sendToSpecificStudents);
      }
    } catch (error) {
      console.error("Error fetching modul:", error);
    }
  };

  const convertBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const handleFileUpload = async (file, type = 'cover') => {
    if (!file) return null;
    
    if (file.size > 50 * 1024 * 1024) {
      alert("❌ Maksimal 50MB!");
      return null;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const base64 = await convertBase64(file);
      const result = await uploadToDrive(base64, file.name, file.type);

      clearInterval(interval);
      setUploadProgress(100);

      if (result.success) {
        setAutoSaveStatus('✅ File berhasil diunggah!');
        setTimeout(() => setAutoSaveStatus(''), 2000);
        return result.downloadURL;
      } else {
        alert("❌ Upload gagal: " + result.error);
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Terjadi kesalahan: " + error.message);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('❌ File harus berupa gambar!');
      return;
    }

    const url = await handleFileUpload(file, 'cover');
    if (url) {
      setCoverImage(url);
    }
  };

  const handleSectionFileUpload = async (e, sectionId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const url = await handleFileUpload(file, 'materi');
    if (url) {
      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, content: url, fileName: file.name, mimeType: file.type } 
          : s
      ));
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
      endTime: '' 
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
    setShowPreview(false);
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  
  const removeSection = (id) => {
    if (window.confirm("Hapus section ini?")) {
      setSections(sections.filter(s => s.id !== id));
      if (activeSection === id) {
        setActiveSection(sections.length > 1 ? sections[0]?.id : null);
      }
    }
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
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
    return match ? match[1] : null;
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents(prev => {
      const exists = prev.some(s => s.id === student.id);
      if (exists) {
        return prev.filter(s => s.id !== student.id);
      } else {
        return [...prev, { id: student.id, nama: student.nama, studentId: student.studentId }];
      }
    });
  };

  const getStudentInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };

  const handleSave = async () => {
    if (!title) return alert("❌ Judul modul wajib diisi!");
    if (!subject || subject === "") return alert("❌ Mata pelajaran wajib dipilih!");
    
    if (statusModul === 'terjadwal' && !tanggalMulai) {
      return alert("❌ Silakan isi tanggal mulai untuk modul terjadwal!");
    }
    
    if (sendToSpecificStudents && selectedStudents.length === 0) {
      return alert("❌ Silakan pilih minimal 1 siswa untuk pengiriman spesifik!");
    }
    
    setSaving(true);
    const payload = {
      title: title.toUpperCase(), 
      subject: subject.toUpperCase(), 
      coverImage, 
      description,
      blocks: sections,
      quizData, 
      targetKategori, 
      targetKelas,
      mingguKe: parseInt(mingguKe) || 1, 
      tahunAjaran, 
      status: statusModul,
      sendToSpecificStudents: sendToSpecificStudents,
      selectedStudents: sendToSpecificStudents ? selectedStudents : [],
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

  // ===== RENDER FUNCTIONS =====
  const renderStudentPreview = () => {
    const previewWidth = previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : '100%';
    const isScheduled = statusModul === 'terjadwal' && tanggalMulai;
    const scheduleDate = isScheduled ? new Date(tanggalMulai) : null;
    const isNotYetActive = isScheduled && scheduleDate && scheduleDate > new Date();
    
    return (
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginTop: 16, background: '#f8fafc' }}>
        <div style={{ background: '#1e293b', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPreviewDevice('mobile')} style={{ padding: '4px 8px', borderRadius: 6, background: previewDevice === 'mobile' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10 }}><Smartphone size={14} /></button>
            <button onClick={() => setPreviewDevice('tablet')} style={{ padding: '4px 8px', borderRadius: 6, background: previewDevice === 'tablet' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10 }}><Tablet size={14} /></button>
            <button onClick={() => setPreviewDevice('desktop')} style={{ padding: '4px 8px', borderRadius: 6, background: previewDevice === 'desktop' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10 }}><Laptop size={14} /></button>
          </div>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Preview Tampilan Siswa</span>
          <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ maxWidth: previewWidth, margin: '0 auto', background: 'white', minHeight: 400, padding: 16, transition: 'all 0.3s ease' }}>
          
          {isNotYetActive && (
            <div style={{ background: '#fef3c7', padding: 8, borderRadius: 8, marginBottom: 16, textAlign: 'center', border: '1px solid #fde68a' }}>
              <Clock size={14} color="#f59e0b" style={{ display: 'inline', marginRight: 4 }} />
              <span style={{ fontSize: 11, color: '#b45309' }}>Modul akan tersedia pada {scheduleDate.toLocaleDateString('id-ID')} pukul {scheduleDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          
          {sendToSpecificStudents && selectedStudents.length > 0 && (
            <div style={{ background: '#e0e7ff', padding: 8, borderRadius: 8, marginBottom: 16, border: '1px solid #818cf8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#3730a3' }}>
                <UserCheckIcon size={14} />
                <span>Dikirim khusus untuk {selectedStudents.length} siswa</span>
              </div>
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            {coverImage && <img src={coverImage} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
            <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{title || 'Judul Modul'}</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{subject || 'Mata Pelajaran'} • {targetKelas !== 'Semua' ? targetKelas : 'Semua Kelas'}</p>
          </div>
          
          {description && (
            <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{description}</p>
            </div>
          )}
          
          {sections.map((sec, idx) => (
            <div key={sec.id} style={{ marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 }}>
                {sec.title || `Bagian ${idx + 1}`}
              </h3>
              {sec.type === 'text' && (
                <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sec.content}</div>
              )}
              {sec.type === 'file' && sec.content && (
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={24} color="#3b82f6" />
                  <span style={{ fontSize: 13 }}>{sec.fileName || 'File Materi'}</span>
                  <a href={sec.content} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 12 }}>📥 Unduh</a>
                </div>
              )}
              {sec.type === 'video' && sec.content && (
                getYouTubeId(sec.content) ? (
                  <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${getYouTubeId(sec.content)}`} frameBorder="0" allowFullScreen style={{ borderRadius: 8 }} />
                ) : (
                  <a href={sec.content} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>🔗 {sec.content}</a>
                )
              )}
              {sec.type === 'assignment' && (
                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fde68a' }}>
                  <p style={{ fontSize: 13, color: '#b45309', marginBottom: 8 }}>📝 Tugas: {sec.content || 'Instruksi tugas'}</p>
                  {sec.endTime && <p style={{ fontSize: 11, color: '#f59e0b' }}>⏰ Deadline: {new Date(sec.endTime).toLocaleString('id-ID')}</p>}
                </div>
              )}
            </div>
          ))}
          
          {quizData?.length > 0 && (
            <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 13, fontWeight: 'bold', color: '#166534' }}>❓ Kuis ({quizData.length} soal)</p>
            </div>
          )}
          
          <div style={{ marginTop: 20, textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>✨ Ini adalah tampilan yang akan dilihat siswa ✨</p>
          </div>
        </div>
      </div>
    );
  };

  const renderEditorContent = () => {
    if (!activeSection) return null;
    const section = sections.find(s => s.id === activeSection);
    if (!section) return null;
    
    if (section.type === 'text') {
      return (
        <SimpleEditor 
          value={section.content} 
          onChange={value => updateSection(activeSection, 'content', value)}
          placeholder="Tulis materi di sini... Gunakan toolbar untuk format teks (**, *, [link])"
        />
      );
    }
    
    if (section.type === 'file') {
      return section.content ? (
        <div style={{ textAlign: 'center', padding: 20, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <FileText size={40} color="#3b82f6" />
          <p style={{ fontWeight: 600, fontSize: 13 }}>{section.fileName || 'File'}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            <a href={section.content} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600, fontSize: 12 }}>🔍 Buka</a>
            <button onClick={() => updateSection(activeSection, 'content', '')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>🗑️ Hapus</button>
          </div>
        </div>
      ) : (
        <div>
          <label style={styles.uploadBox}>
            {uploading ? (
              <div style={{ textAlign: 'center' }}>
                <Loader2 size={30} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Mengunggah... {uploadProgress}%</span>
                <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 8 }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#3b82f6', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            ) : (
              <>
                <FileUp size={30} color="#94a3b8" />
                <span>Upload PDF/DOCX/PPT/Gambar (Max 50MB)</span>
              </>
            )}
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" 
              hidden 
              onChange={(e) => handleSectionFileUpload(e, activeSection)} 
              disabled={uploading}
            />
          </label>
        </div>
      );
    }
    
    if (section.type === 'video') {
      const youtubeId = getYouTubeId(section.content);
      return (
        <>
          <input 
            value={section.content} 
            onChange={e => updateSection(activeSection, 'content', e.target.value)} 
            placeholder="Tempel link YouTube, Canva, Google Drive..." 
            style={styles.input} 
          />
          {youtubeId && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: '#10b981', marginBottom: 6 }}>✅ Preview video:</p>
              <iframe width="100%" height="250" src={`https://www.youtube.com/embed/${youtubeId}`} frameBorder="0" allowFullScreen style={{ borderRadius: 8 }} />
            </div>
          )}
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>💡 Link YouTube akan otomatis ditampilkan sebagai video player</p>
        </>
      );
    }
    
    if (section.type === 'assignment') {
      return (
        <div>
          <textarea 
            value={section.content} 
            onChange={e => updateSection(activeSection, 'content', e.target.value)} 
            placeholder="Tulis instruksi tugas di sini..."
            style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, padding: 12, background: '#fffbeb', borderRadius: 8 }}>
            <Clock size={18} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>Deadline Tugas:</span>
            <input 
              type="datetime-local" 
              value={section.endTime} 
              onChange={e => updateSection(activeSection, 'endTime', e.target.value)} 
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12, outline: 'none' }} 
            />
          </div>
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>💡 Kosongkan deadline jika tidak ada batas waktu pengumpulan.</p>
        </div>
      );
    }
    
    return null;
  };

  // ============================================
  // STYLES - Semua style dalam objek JavaScript
  // ============================================
  const styles = {
    container: { 
      maxWidth: 1200, margin: '0 auto', paddingBottom: 100,
      paddingLeft: isMobile ? 12 : 16, 
      paddingRight: isMobile ? 12 : 16
    },
    
    autoSaveToast: {
      position: 'fixed', bottom: 80, right: 20, 
      background: '#10b981', color: 'white', 
      padding: '6px 16px', borderRadius: 20, fontSize: 11, 
      zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    },
    
    tipsBanner: {
      background: '#eef2ff', borderRadius: 12, padding: 12, 
      marginBottom: 20, display: 'flex', alignItems: 'center', 
      justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
    },
    tipsClose: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 11 },
    
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      marginBottom: 20, flexWrap: 'wrap', gap: 10
    },
    btnBack: {
      background: 'white', border: '1px solid #e2e8f0', 
      padding: isMobile ? '6px 10px' : '8px 14px', 
      borderRadius: 8, cursor: 'pointer', 
      fontWeight: 600, fontSize: isMobile ? 12 : 13, 
      display: 'flex', alignItems: 'center', gap: 4
    },
    pageTitle: { 
      margin: 0, 
      fontSize: isMobile ? 16 : 20, 
      fontWeight: 800, color: '#1e293b' 
    },
    headerActions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
    btnPreview: {
      border: 'none', padding: isMobile ? '6px 10px' : '8px 14px', 
      borderRadius: 8, cursor: 'pointer', fontWeight: 600, 
      fontSize: isMobile ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4
    },
    btnLiveView: {
      background: 'white', border: '1px solid #e2e8f0', 
      padding: isMobile ? '6px 10px' : '8px 14px', 
      borderRadius: 8, cursor: 'pointer', 
      fontWeight: 600, fontSize: isMobile ? 11 : 12, 
      display: 'flex', alignItems: 'center', gap: 4
    },
    btnSave: {
      background: '#10b981', color: 'white', border: 'none', 
      padding: isMobile ? '6px 14px' : '8px 20px', 
      borderRadius: 8, cursor: 'pointer', 
      fontWeight: 700, fontSize: isMobile ? 12 : 13, 
      display: 'flex', alignItems: 'center', gap: 6
    },
    
    mainGrid: { 
      display: 'flex', 
      gap: 20, 
      flexDirection: isMobile ? 'column' : 'row' 
    },
    
    sidebar: { 
      width: isMobile ? '100%' : '320px', 
      flexShrink: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 10 
    },
    
    card: { background: 'white', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' },
    cardTitle: { margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },
    
    input: { 
      width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', 
      fontSize: 12, outline: 'none', marginBottom: 8, boxSizing: 'border-box',
      background: '#f8fafc'
    },
    inputSmall: { 
      flex: 1, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', 
      fontSize: 10, outline: 'none', boxSizing: 'border-box',
      background: '#f8fafc'
    },
    select: { 
      flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', 
      fontSize: 11, background: 'white', outline: 'none', cursor: 'pointer'
    },
    
    coverUpload: {
      display: 'block', height: 80, borderRadius: 6, overflow: 'hidden', 
      cursor: 'pointer', border: '2px dashed #e2e8f0', marginTop: 4,
      background: '#f8fafc'
    },
    
    warningBanner: {
      background: '#fef3c7', padding: 8, borderRadius: 6, 
      fontSize: 10, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6
    },
    
    scheduleBox: {
      background: '#fffbeb', padding: 12, borderRadius: 8, 
      marginTop: 8, border: '1px solid #fde68a'
    },
    scheduleTitle: {
      fontSize: 11, fontWeight: 700, color: '#b45309', 
      marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6
    },
    scheduleLabel: {
      fontSize: 10, fontWeight: 600, color: '#92400e', 
      display: 'block', marginBottom: 4
    },
    scheduleInput: {
      width: '100%', padding: '8px 10px', borderRadius: 6, 
      border: '1px solid #fde68a', fontSize: 11, background: 'white'
    },
    
    statusMessageGreen: {
      background: '#dcfce7', padding: 8, borderRadius: 6, 
      fontSize: 10, color: '#166534', marginTop: 8, 
      display: 'flex', alignItems: 'center', gap: 6
    },
    statusMessageGray: {
      background: '#f1f5f9', padding: 8, borderRadius: 6, 
      fontSize: 10, color: '#64748b', marginTop: 8, 
      display: 'flex', alignItems: 'center', gap: 6
    },
    
    emptyContent: {
      background: '#f8fafc', padding: 20, borderRadius: 8, 
      textAlign: 'center', border: '1px dashed #e2e8f0'
    },
    sectionItem: {
      display: 'flex', alignItems: 'center', gap: 6, 
      padding: '8px 10px', borderRadius: 8, cursor: 'pointer', 
      marginBottom: 4, border: '1px solid #e2e8f0'
    },
    sectionLabel: {
      flex: 1, fontSize: 11, fontWeight: 600, color: '#1e293b', 
      display: 'flex', alignItems: 'center', gap: 6, minWidth: 0
    },
    btnArrow: {
      background: 'none', border: 'none', cursor: 'pointer', 
      padding: 2, borderRadius: 4, display: 'flex', 
      alignItems: 'center', justifyContent: 'center', opacity: 0.6
    },
    btnX: {
      background: 'none', border: 'none', color: '#ef4444', 
      cursor: 'pointer', padding: 4, borderRadius: 4, 
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    
    addSectionGrid: {
      display: 'grid', 
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)', 
      gap: 6
    },
    addSectionBtn: {
      padding: isMobile ? '6px' : '8px', 
      background: 'white', border: '1px solid #e2e8f0', 
      borderRadius: 8, cursor: 'pointer', fontWeight: 600, 
      fontSize: isMobile ? 10 : 11, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
    },
    
    quizInfo: {
      display: 'flex', alignItems: 'center', gap: 8, 
      fontSize: 11, background: '#f0fdf4', padding: 8, borderRadius: 6
    },
    btnEditQuiz: {
      marginLeft: 'auto', background: '#10b981', color: 'white', 
      border: 'none', padding: '4px 10px', borderRadius: 4, 
      cursor: 'pointer', fontWeight: 600, fontSize: 10
    },
    btnCreateQuiz: {
      width: '100%', padding: 8, background: '#3b82f6', color: 'white', 
      border: 'none', borderRadius: 6, cursor: 'pointer', 
      fontWeight: 600, fontSize: 11, display: 'flex', 
      alignItems: 'center', justifyContent: 'center', gap: 6
    },
    
    btnSelectAll: {
      padding: '6px 10px', background: '#e0e7ff', border: 'none', 
      borderRadius: 6, cursor: 'pointer', color: '#3730a3'
    },
    studentTag: {
      display: 'inline-flex', alignItems: 'center', gap: 4, 
      background: '#eef2ff', padding: '3px 8px', borderRadius: 12, 
      fontSize: 10, fontWeight: 600, color: '#3730a3'
    },
    removeTag: {
      background: 'none', border: 'none', color: '#3730a3', 
      cursor: 'pointer', padding: 0, display: 'flex', 
      alignItems: 'center', justifyContent: 'center'
    },
    studentPicker: {
      position: 'relative', marginTop: 8, 
      border: '1px solid #e2e8f0', borderRadius: 8, 
      background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
      zIndex: 10
    },
    studentPickerHeader: {
      display: 'flex', justifyContent: 'space-between', 
      alignItems: 'center', padding: '8px 12px', 
      borderBottom: '1px solid #e2e8f0'
    },
    closePicker: {
      background: 'none', border: 'none', cursor: 'pointer', 
      color: '#94a3b8', fontSize: 14
    },
    studentPickerList: {
      maxHeight: 200, overflowY: 'auto', padding: 4
    },
    studentPickerItem: {
      display: 'flex', alignItems: 'center', gap: 8, 
      padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
      transition: '0.2s'
    },
    studentPickerAvatar: {
      width: 28, height: 28, borderRadius: '50%', 
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      color: 'white', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', fontSize: 10, fontWeight: 'bold', flexShrink: 0
    },
    
    editorArea: { flex: 1, minWidth: 0 },
    emptyEditor: {
      textAlign: 'center', padding: isMobile ? 30 : 60, 
      background: 'white', borderRadius: 12, 
      border: '2px dashed #e2e8f0', color: '#94a3b8'
    },
    editorCard: { background: 'white', padding: isMobile ? 14 : 20, borderRadius: 12, border: '1px solid #e2e8f0' },
    editorHeader: {
      display: 'flex', justifyContent: 'space-between', 
      alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8
    },
    editorTypeBadge: {
      fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6
    },
    btnEditorPreview: {
      background: '#f1f5f9', border: 'none', padding: '5px 10px', 
      borderRadius: 6, cursor: 'pointer', fontSize: 11, 
      display: 'flex', alignItems: 'center', gap: 4
    },
    btnEditorDelete: {
      background: '#fee2e2', color: '#ef4444', border: 'none', 
      padding: '5px 10px', borderRadius: 6, cursor: 'pointer', 
      fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3
    },
    sectionTitleInput: {
      width: '100%', border: 'none', fontSize: 16, fontWeight: 700, 
      outline: 'none', marginBottom: 16, padding: '4px 0', 
      color: '#1e293b', borderBottom: '2px solid #e2e8f0'
    },
    uploadBox: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      gap: 10, padding: '30px 20px', border: '2px dashed #e2e8f0', 
      borderRadius: 10, cursor: 'pointer', background: '#f8fafc', 
      color: '#64748b', fontSize: 13
    },
    
    floatingFooter: {
      position: 'fixed', bottom: 0, 
      left: isMobile ? 0 : 260, 
      right: 0,
      background: 'white', borderTop: '1px solid #e2e8f0',
      padding: isMobile ? '8px 12px' : '10px 20px', 
      display: 'flex', 
      justifyContent: 'flex-end', gap: 10, zIndex: 50,
      flexWrap: 'wrap'
    },
    btnFooterCancel: {
      padding: isMobile ? '8px 14px' : '10px 20px', 
      background: '#f1f5f9', 
      border: 'none', borderRadius: 8, fontWeight: 600, 
      fontSize: isMobile ? 12 : 13, cursor: 'pointer'
    },
    btnFooterLive: {
      padding: isMobile ? '8px 14px' : '10px 20px', 
      background: 'white', 
      border: '1px solid #e2e8f0', borderRadius: 8, 
      fontWeight: 600, fontSize: isMobile ? 12 : 13, 
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
    },
    btnFooterSave: {
      padding: isMobile ? '8px 18px' : '10px 25px', 
      background: '#10b981', color: 'white', 
      border: 'none', borderRadius: 8, fontWeight: 700, 
      fontSize: isMobile ? 12 : 13, cursor: 'pointer', 
      display: 'flex', alignItems: 'center', gap: 6
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {autoSaveStatus && (
        <div style={styles.autoSaveToast}>
          {autoSaveStatus}
        </div>
      )}
      
      {showTips && (
        <div style={styles.tipsBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Info size={18} color="#3b82f6" />
            <span style={{ fontSize: 12, color: '#1e40af' }}>💡 Tips: Gunakan preview untuk melihat tampilan siswa, pastikan target kelas sesuai!</span>
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
        </h2>
        <div style={styles.headerActions}>
          <button onClick={() => setShowPreview(!showPreview)} style={{
            ...styles.btnPreview,
            background: showPreview ? '#3b82f6' : '#f1f5f9',
            color: showPreview ? 'white' : '#64748b'
          }}>
            <Eye size={14} /> {showPreview ? 'Edit Mode' : 'Preview Siswa'}
          </button>
          {editId && (
            <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={styles.btnLiveView}>
              <ExternalLink size={14} /> {!isMobile && 'Live View'}
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            ...styles.btnSave,
            opacity: saving ? 0.6 : 1
          }}>
            <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update' : 'Terbitkan'}
          </button>
        </div>
      </div>

      {showPreview ? (
        renderStudentPreview()
      ) : (
        <div style={styles.mainGrid}>
          
          {/* SIDEBAR KIRI */}
          <div style={styles.sidebar}>
            
            {/* Identitas Modul */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><BookOpen size={14} /> Identitas Modul</h4>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Judul modul..." 
                style={styles.input} 
              />
              <select 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                style={{...styles.input, background:'white'}}
              >
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Deskripsi singkat modul (akan tampil di dashboard siswa)..." 
                style={{...styles.input, minHeight: 60, resize: 'vertical'}} 
              />
              <label style={styles.coverUpload}>
                {coverImage ? (
                  <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                    <ImageIcon size={18} />
                    <span style={{ fontSize: 11 }}>Upload Cover</span>
                  </div>
                )}
                <input type="file" accept="image/*" hidden onChange={handleCoverUpload} />
              </label>
            </div>

            {/* Target Publikasi */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><Target size={14} /> Target Publikasi</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={styles.select}>
                  <option value="Reguler">📚 Reguler</option>
                  <option value="English">🗣️ English</option>
                  <option value="Semua">🌐 Semua Program</option>
                </select>
                <select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={styles.select}>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              {(targetKelas === "Semua" || targetKategori === "Semua") && (
                <div style={styles.warningBanner}>
                  <AlertCircle size={12} /> Modul akan muncul untuk {(targetKelas === "Semua" ? 'SEMUA KELAS ' : '')} {(targetKategori === "Semua" ? 'SEMUA PROGRAM' : '')}
                </div>
              )}
              
              {/* Kirim ke Siswa Tertentu */}
              <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={sendToSpecificStudents} 
                    onChange={() => setSendToSpecificStudents(!sendToSpecificStudents)} 
                  />
                  <UserPlus size={14} /> Kirim ke siswa tertentu
                </label>
                
                {sendToSpecificStudents && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          placeholder="Cari siswa..."
                          style={{...styles.input, paddingLeft: 32, marginBottom: 0}}
                          onFocus={() => setShowStudentPicker(true)}
                        />
                      </div>
                    </div>
                    
                    {selectedStudents.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {selectedStudents.map(s => (
                          <span key={s.id} style={styles.studentTag}>
                            {getStudentInitials(s.nama)}
                            <span style={{ fontSize: 10 }}>{s.nama}</span>
                            <button 
                              onClick={() => toggleStudentSelection(s)}
                              style={styles.removeTag}
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {showStudentPicker && (
                      <div style={styles.studentPicker}>
                        <div style={styles.studentPickerHeader}>
                          <span style={{ fontSize: 11, fontWeight: 'bold' }}>📋 Pilih Siswa</span>
                          <button onClick={() => setShowStudentPicker(false)} style={styles.closePicker}>✕</button>
                        </div>
                        <div style={styles.studentPickerList}>
                          {allStudents
                            .filter(s => 
                              (s.nama || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                              (s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase())
                            )
                            .slice(0, 20)
                            .map(s => {
                              const isSelected = selectedStudents.some(sel => sel.id === s.id);
                              return (
                                <div 
                                  key={s.id} 
                                  onClick={() => toggleStudentSelection(s)}
                                  style={{
                                    ...styles.studentPickerItem,
                                    background: isSelected ? '#eef2ff' : 'transparent'
                                  }}
                                >
                                  <div style={styles.studentPickerAvatar}>
                                    {getStudentInitials(s.nama)}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{s.nama}</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.studentId} • {s.kelasSekolah || '-'}</div>
                                  </div>
                                  {isSelected ? (
                                    <CheckCircle size={16} color="#10b981" />
                                  ) : (
                                    <div style={{ width: 16, height: 16, border: '2px solid #d1d5db', borderRadius: '50%' }} />
                                  )}
                                </div>
                              );
                            })}
                          {allStudents.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
                              Tidak ada siswa terdaftar
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                      {selectedStudents.length} siswa dipilih
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pengaturan & Jadwal */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><Settings size={14} /> Pengaturan & Jadwal</h4>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} placeholder="Minggu ke-" style={styles.inputSmall} />
                <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} placeholder="Tahun Ajaran" style={styles.inputSmall} />
              </div>
              
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {STATUS_OPTIONS.map(opt => (
                  <button 
                    key={opt.value} 
                    onClick={() => setStatusModul(opt.value)} 
                    style={{
                      flex: 1,
                      padding: '6px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      background: statusModul === opt.value ? opt.color : '#f1f5f9',
                      color: statusModul === opt.value ? 'white' : '#64748b',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                    }}
                    title={opt.desc}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
              
              {statusModul === 'terjadwal' && (
                <div style={styles.scheduleBox}>
                  <p style={styles.scheduleTitle}><CalendarDays size={14} /> Jadwal Rilis Modul</p>
                  <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.scheduleLabel}>Tanggal & Jam Mulai *</label>
                      <input type="datetime-local" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} style={styles.scheduleInput} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.scheduleLabel}>Tanggal Selesai (Opsional)</label>
                      <input type="datetime-local" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} style={styles.scheduleInput} />
                    </div>
                  </div>
                </div>
              )}
              
              {statusModul === 'aktif' && (
                <div style={styles.statusMessageGreen}>
                  <CheckCircle size={12} /> Modul akan langsung aktif dan dapat diakses siswa.
                </div>
              )}
              {statusModul === 'arsip' && (
                <div style={styles.statusMessageGray}>
                  📦 Modul tidak akan tampil di dashboard siswa.
                </div>
              )}
            </div>

            {/* Struktur Konten */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><Layers size={14} /> Struktur Konten ({sections.length})</h4>
              {sections.length === 0 && (
                <div style={styles.emptyContent}>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Belum ada konten.</p>
                </div>
              )}
              {sections.map((sec, idx) => (
                <div key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                  ...styles.sectionItem,
                  background: activeSection === sec.id ? '#eef2ff' : '#f8fafc',
                  borderColor: activeSection === sec.id ? '#3b82f6' : '#e2e8f0'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 'up'); }} style={styles.btnArrow} disabled={idx === 0}><ChevronUp size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 'down'); }} style={styles.btnArrow} disabled={idx === sections.length - 1}><ChevronDown size={12} /></button>
                  </div>
                  <span style={styles.sectionLabel}>
                    {sec.type === 'text' ? '📄' : sec.type === 'file' ? '📁' : sec.type === 'video' ? '🎥' : '📝'}
                    <span>{sec.title || `Bagian ${idx + 1}`}</span>
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }} style={styles.btnX}><X size={12} /></button>
                </div>
              ))}
            </div>

            {/* Tombol Tambah Konten */}
            <div style={styles.addSectionGrid}>
              {[
                { type: 'text', icon: <Type size={13} />, label: 'Teks', desc: 'Materi tulisan + format', color: '#3b82f6' },
                { type: 'file', icon: <FileUp size={13} />, label: 'File', desc: 'Upload PDF/DOC/PPT', color: '#10b981' },
                { type: 'video', icon: <Video size={13} />, label: 'Video', desc: 'YouTube & link', color: '#ef4444' },
                { type: 'assignment', icon: <Send size={13} />, label: 'Tugas', desc: 'Instruksi & deadline', color: '#f59e0b' }
              ].map(btn => (
                <button key={btn.type} onClick={() => addSection(btn.type)} style={{
                  ...styles.addSectionBtn,
                  borderColor: `${btn.color}20`,
                  color: btn.color
                }} title={btn.desc}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>

            {/* Kuis */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}><HelpCircle size={14} /> Kuis / Evaluasi</h4>
              {quizData?.length > 0 ? (
                <div style={styles.quizInfo}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>{quizData.length} soal</span>
                  <button 
                    onClick={() => { 
                      if (!editId) return alert("Simpan modul dulu!"); 
                      navigate(`/guru/manage-quiz?modulId=${editId}`); 
                    }} 
                    style={styles.btnEditQuiz}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { 
                    if (!editId) return alert("Simpan modul dulu!"); 
                    navigate(`/guru/manage-quiz?modulId=${editId}`); 
                  }} 
                  style={styles.btnCreateQuiz}
                >
                  <HelpCircle size={14} /> + Buat Kuis
                </button>
              )}
            </div>
          </div>

          {/* AREA EDITOR KANAN */}
          <div style={styles.editorArea}>
            {!activeSection ? (
              <div style={styles.emptyEditor}>
                <Layers size={48} color="#cbd5e1" />
                <h3 style={{ fontSize: 16, marginTop: 12 }}>Pilih atau Tambah Konten</h3>
                <p style={{ fontSize: 12, marginTop: 4 }}>Klik salah satu konten di sidebar kiri, atau tambah konten baru.</p>
              </div>
            ) : (
              <div style={styles.editorCard}>
                <div style={styles.editorHeader}>
                  <span style={{
                    ...styles.editorTypeBadge,
                    background: sections.find(s => s.id === activeSection)?.type === 'assignment' ? '#fef3c7' : '#e0e7ff',
                    color: sections.find(s => s.id === activeSection)?.type === 'assignment' ? '#b45309' : '#3730a3'
                  }}>
                    {sections.find(s => s.id === activeSection)?.type === 'text' ? '📄 TEKS' : 
                     sections.find(s => s.id === activeSection)?.type === 'file' ? '📁 FILE' : 
                     sections.find(s => s.id === activeSection)?.type === 'video' ? '🎥 VIDEO' : '📝 TUGAS'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowPreview(true)} style={styles.btnEditorPreview}>
                      <Eye size={12} /> Preview
                    </button>
                    <button onClick={() => removeSection(activeSection)} style={styles.btnEditorDelete}>
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>

                <input 
                  value={sections.find(s => s.id === activeSection)?.title || ''} 
                  onChange={e => updateSection(activeSection, 'title', e.target.value)} 
                  placeholder="Judul section (contoh: Bab 1, Pengertian, dll)" 
                  style={styles.sectionTitleInput} 
                />

                {renderEditorContent()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING FOOTER */}
      <div style={styles.floatingFooter}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnFooterCancel}>
          Batal
        </button>
        {editId && (
          <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={styles.btnFooterLive}>
            <ExternalLink size={14} /> {!isMobile && 'Live Preview'}
          </button>
        )}
        <button onClick={handleSave} disabled={saving} style={{
          ...styles.btnFooterSave,
          opacity: saving ? 0.6 : 1
        }}>
          <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update Modul' : 'Terbitkan Modul'}
        </button>
      </div>
    </div>
  );
};

export default ManageMateri;