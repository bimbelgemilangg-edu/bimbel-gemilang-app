import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, Trash2, FileText, HelpCircle, Clock, ArrowLeft, FileUp, Type, Video, X, 
  Image as ImageIcon, BookOpen, Send, Layers, ChevronDown, ChevronUp, Settings, 
  Eye, Copy, CheckCircle, Calendar, Users, Target, AlertCircle, RefreshCw, 
  Maximize2, Minimize2, Smartphone, Tablet, Laptop, Info, ExternalLink,
  Bold, Italic, Underline, List, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight,
  CalendarDays, Timer, Award
} from 'lucide-react';

// Simple Editor Component (tanpa library eksternal)
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
    // Set focus kembali ke textarea
    setTimeout(() => textarea.focus(), 10);
  };
  
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', gap: 4, padding: 8, background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap'
      }}>
        <button type="button" onClick={() => applyFormat('bold')} style={toolbarBtn} title="Bold (teks **tebal** )">B</button>
        <button type="button" onClick={() => applyFormat('italic')} style={toolbarBtn} title="Italic (teks *miring*)">I</button>
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

const toolbarBtn = {
  background: 'none', border: 'none', padding: '4px 10px', 
  borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
  color: '#64748b', transition: '0.2s'
};

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [showTips, setShowTips] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [showScheduledInfo, setShowScheduledInfo] = useState(false);
  
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
    // Default: 2 hari dari sekarang jam 00:00
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().slice(0, 16);
  });
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  
  // QUIZ TERKAIT
  const [quizData, setQuizData] = useState([]);
  const [deadlineQuiz, setDeadlineQuiz] = useState("");
  
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

  // Auto-save draft setiap 30 detik
  useEffect(() => {
    if (!editId && title) {
      const timer = setTimeout(() => {
        const draft = {
          title, subject, coverImage, description, sections, 
          targetKategori, targetKelas, mingguKe, tahunAjaran, statusModul,
          tanggalMulai, tanggalSelesai,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('draft_modul', JSON.stringify(draft));
        setAutoSaveStatus('Draft tersimpan');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [title, subject, coverImage, description, sections, targetKategori, targetKelas, mingguKe, tahunAjaran, statusModul, tanggalMulai, tanggalSelesai, editId]);

  // Load draft
  useEffect(() => {
    if (!editId) {
      const draft = localStorage.getItem('draft_modul');
      if (draft) {
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
        }
      }
    }
  }, [editId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchContext = async () => {
      const snapSiswa = await getDocs(collection(db, "students"));
      const data = snapSiswa.docs.map(d => d.data());
      const classes = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setAvailableClasses(['Semua', ...classes]);
      
      const snapGuru = await getDocs(collection(db, "teachers"));
      const guruData = snapGuru.docs.map(d => d.data());
      const mapelList = [...new Set(guruData.map(t => t.mapel).filter(Boolean))];
      if (mapelList.length === 0) mapelList.push("Umum");
      setSubjects(['Umum', ...mapelList.sort()]);
    };
    fetchContext();
  }, []);

  useEffect(() => {
    if (editId) fetchModulData();
  }, [editId]);

  const fetchModulData = async () => {
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
      setDeadlineQuiz(data.deadlineQuiz || "");
      setTargetKategori(data.targetKategori || "Reguler");
      setTargetKelas(data.targetKelas || "1 SD");
      setMingguKe(data.mingguKe || 1);
      setTahunAjaran(data.tahunAjaran || "2025/2026");
      setStatusModul(data.status || "aktif");
      if (data.tanggalMulai) setTanggalMulai(data.tanggalMulai);
      if (data.tanggalSelesai) setTanggalSelesai(data.tanggalSelesai);
    }
  };

  const convertBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const handleFileUpload = async (e, sectionId = null) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return alert("❌ Maksimal 50MB!");
    try {
      const base64 = await convertBase64(file);
      const { uploadToDrive } = await import('../../../services/uploadService');
      const result = await uploadToDrive(base64, file.name, file.type);
      if (result.success) {
        if (sectionId) setSections(sections.map(s => s.id === sectionId ? { ...s, content: result.downloadURL, fileName: file.name, mimeType: file.type } : s));
        else setCoverImage(result.downloadURL);
        alert("✅ File berhasil diupload!");
      }
    } catch (err) { console.error(err); alert("❌ Upload gagal: " + err.message); }
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

  const updateSection = (id, field, value) => setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  
  const removeSection = (id) => {
    if (window.confirm("Hapus section ini?")) {
      setSections(sections.filter(s => s.id !== id));
      if (activeSection === id) setActiveSection(sections.length > 1 ? sections[0]?.id : null);
    }
  };

  const moveSection = (id, direction) => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const newSections = [...sections];
    if (direction === 'up' && idx > 0) [newSections[idx], newSections[idx - 1]] = [newSections[idx - 1], newSections[idx]];
    else if (direction === 'down' && idx < sections.length - 1) [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
    setSections(newSections);
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
    return match ? match[1] : null;
  };

  const handleSave = async () => {
    if (!title) return alert("❌ Judul modul wajib diisi!");
    if (!subject) return alert("❌ Mata pelajaran wajib dipilih!");
    
    // Validasi untuk status terjadwal
    if (statusModul === 'terjadwal' && !tanggalMulai) {
      return alert("❌ Silakan isi tanggal mulai untuk modul terjadwal!");
    }
    
    // Validasi target
    if (targetKelas === "Semua" && targetKategori === "Semua") {
      if (!window.confirm("⚠️ PERINGATAN: Modul ini akan muncul untuk SEMUA siswa (semua kelas dan program).\n\nLanjutkan?")) return;
    } else if (targetKelas === "Semua") {
      if (!window.confirm(`⚠️ PERINGATAN: Modul ini akan muncul untuk SEMUA KELAS pada program ${targetKategori}.\n\nLanjutkan?`)) return;
    } else if (targetKategori === "Semua") {
      if (!window.confirm(`⚠️ PERINGATAN: Modul ini akan muncul untuk SEMUA PROGRAM pada kelas ${targetKelas}.\n\nLanjutkan?`)) return;
    }
    
    setSaving(true);
    const payload = {
      title: title.toUpperCase(), 
      subject: subject.toUpperCase(), 
      coverImage, 
      description,
      blocks: sections,
      quizData, 
      deadlineQuiz: deadlineQuiz || null, 
      targetKategori, 
      targetKelas,
      mingguKe: parseInt(mingguKe) || 1, 
      tahunAjaran, 
      status: statusModul,
      updatedAt: serverTimestamp()
    };
    
    // Tambahkan jadwal hanya jika status terjadwal
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

  const activeSec = sections.find(s => s.id === activeSection);

  // Render preview siswa
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
          
          {/* Status Badge untuk siswa */}
          {isNotYetActive && (
            <div style={{ background: '#fef3c7', padding: 8, borderRadius: 8, marginBottom: 16, textAlign: 'center', border: '1px solid #fde68a' }}>
              <Clock size={14} color="#f59e0b" style={{ display: 'inline', marginRight: 4 }} />
              <span style={{ fontSize: 11, color: '#b45309' }}>Modul akan tersedia pada {scheduleDate.toLocaleDateString('id-ID')} pukul {scheduleDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
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
              <p style={{ fontSize: 11, color: '#166534' }}>Deadline: {deadlineQuiz ? new Date(deadlineQuiz).toLocaleDateString('id-ID') : 'Tidak ada deadline'}</p>
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
    if (!activeSec) return null;
    
    if (activeSec.type === 'text') {
      return (
        <SimpleEditor 
          value={activeSec.content} 
          onChange={value => updateSection(activeSec.id, 'content', value)}
          placeholder="Tulis materi di sini... Gunakan toolbar untuk format teks (**, *, [link])"
        />
      );
    }
    
    if (activeSec.type === 'file') {
      return activeSec.content ? (
        <div style={{ textAlign: 'center', padding: 20, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <FileText size={40} color="#3b82f6" />
          <p style={{ fontWeight: 600, fontSize: 13 }}>{activeSec.fileName || 'File'}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            <a href={activeSec.content} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600, fontSize: 12 }}>🔍 Buka</a>
            <button onClick={() => updateSection(activeSec.id, 'content', '')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>🗑️ Hapus</button>
          </div>
        </div>
      ) : (
        <label style={s.uploadBox}>
          <FileUp size={30} color="#94a3b8" />
          <span>Upload PDF/DOCX/PPT/Gambar (Max 50MB)</span>
          <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" hidden onChange={(e) => handleFileUpload(e, activeSec.id)} />
        </label>
      );
    }
    
    if (activeSec.type === 'video') {
      const youtubeId = getYouTubeId(activeSec.content);
      return (
        <>
          <input 
            value={activeSec.content} 
            onChange={e => updateSection(activeSec.id, 'content', e.target.value)} 
            placeholder="Tempel link YouTube, Canva, Google Drive..." 
            style={s.input} 
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
    
    if (activeSec.type === 'assignment') {
      return (
        <div>
          <textarea 
            value={activeSec.content} 
            onChange={e => updateSection(activeSec.id, 'content', e.target.value)} 
            placeholder="Tulis instruksi tugas di sini..."
            style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, padding: 12, background: '#fffbeb', borderRadius: 8 }}>
            <Clock size={18} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>Deadline Tugas:</span>
            <input 
              type="datetime-local" 
              value={activeSec.endTime} 
              onChange={e => updateSection(activeSec.id, 'endTime', e.target.value)} 
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12, outline: 'none' }} 
            />
          </div>
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>💡 Kosongkan deadline jika tidak ada batas waktu pengumpulan.</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* AUTO SAVE STATUS */}
      {autoSaveStatus && (
        <div style={{ position: 'fixed', bottom: 80, right: 20, background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: 20, fontSize: 11, zIndex: 100 }}>
          💾 {autoSaveStatus}
        </div>
      )}
      
      {/* TIPS PANDUAN */}
      {showTips && (
        <div style={{ background: '#eef2ff', borderRadius: 12, padding: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Info size={18} color="#3b82f6" />
            <span style={{ fontSize: 12, color: '#1e40af' }}>💡 Tips: Gunakan preview untuk melihat tampilan siswa, pastikan target kelas sesuai!</span>
          </div>
          <button onClick={() => setShowTips(false)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 11 }}>Tutup</button>
        </div>
      )}
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => navigate('/guru/modul')} style={s.btnBack(isMobile)}>
          <ArrowLeft size={14} /> {!isMobile && 'Kembali'}
        </button>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' }}>
          {editId ? '✏️ Edit Modul' : '📚 Buat Modul Baru'}
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowPreview(!showPreview)} style={{
            background: showPreview ? '#3b82f6' : '#f1f5f9', color: showPreview ? 'white' : '#64748b',
            border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4
          }}>
            <Eye size={14} /> {showPreview ? 'Edit Mode' : 'Preview Siswa'}
          </button>
          {editId && (
            <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={s.btnPreview(isMobile)}>
              <ExternalLink size={14} /> Live View
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={s.btnSave(isMobile)}>
            <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update' : 'Terbitkan'}
          </button>
        </div>
      </div>

      {showPreview ? (
        renderStudentPreview()
      ) : (
        <div style={{ display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row' }}>
          
          {/* SIDEBAR KIRI */}
          <div style={{ width: isMobile ? '100%' : '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            {/* IDENTITAS MODUL */}
            <div style={s.card}>
              <h4 style={s.cardTitle}><BookOpen size={14} /> Identitas Modul</h4>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Judul modul..." 
                style={s.input} 
              />
              <select 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                style={{...s.input, background:'white'}}
              >
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Deskripsi singkat modul (akan tampil di dashboard siswa)..."
                style={{...s.input, minHeight: 60, resize: 'vertical'}}
              />
              <label style={{ display: 'block', height: 80, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: '2px dashed #e2e8f0', marginTop: 4 }}>
                {coverImage ? <img src={coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11, flexDirection: 'column', gap: 4 }}><ImageIcon size={18} />Upload Cover</div>}
                <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e)} />
              </label>
              <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>Cover akan tampil di halaman modul siswa</p>
            </div>

            {/* TARGET PUBLIKASI */}
            <div style={s.card}>
              <h4 style={s.cardTitle}><Target size={14} /> Target Publikasi</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={s.select}>
                  <option value="Reguler">📚 Reguler</option>
                  <option value="English">🗣️ English</option>
                  <option value="Semua">🌐 Semua Program</option>
                </select>
                <select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={s.select}>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              {(targetKelas === "Semua" || targetKategori === "Semua") && (
                <div style={{ background: '#fef3c7', padding: 8, borderRadius: 6, fontSize: 10, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={12} /> Modul akan muncul untuk {(targetKelas === "Semua" ? 'SEMUA KELAS ' : '')} {(targetKategori === "Semua" ? 'SEMUA PROGRAM' : '')}
                </div>
              )}
            </div>

            {/* PENGATURAN LAINNYA + JADWAL */}
            <div style={s.card}>
              <h4 style={s.cardTitle}><Settings size={14} /> Pengaturan & Jadwal</h4>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} placeholder="Minggu ke-" style={s.inputSmall} />
                <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} placeholder="Tahun Ajaran" style={s.inputSmall} />
              </div>
              
              {/* Status Pilihan */}
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
              
              {/* 🔥 FORM JADWAL (hanya untuk status terjadwal) */}
              {statusModul === 'terjadwal' && (
                <div style={{ 
                  background: '#fffbeb', 
                  padding: 12, 
                  borderRadius: 8, 
                  marginTop: 8,
                  border: '1px solid #fde68a'
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarDays size={14} /> Jadwal Rilis Modul
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: '#92400e', display: 'block', marginBottom: 4 }}>Tanggal & Jam Mulai *</label>
                      <input 
                        type="datetime-local" 
                        value={tanggalMulai} 
                        onChange={e => setTanggalMulai(e.target.value)} 
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 11, background: 'white' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: '#92400e', display: 'block', marginBottom: 4 }}>Tanggal Selesai (Opsional)</label>
                      <input 
                        type="datetime-local" 
                        value={tanggalSelesai} 
                        onChange={e => setTanggalSelesai(e.target.value)} 
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 11, background: 'white' }}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: 9, color: '#92400e', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> Modul akan otomatis aktif pada tanggal dan jam yang ditentukan.
                  </p>
                </div>
              )}
              
              {/* Info Status */}
              {statusModul === 'aktif' && (
                <div style={{ background: '#dcfce7', padding: 8, borderRadius: 6, fontSize: 10, color: '#166534', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={12} /> Modul akan langsung aktif dan dapat diakses siswa.
                </div>
              )}
              {statusModul === 'arsip' && (
                <div style={{ background: '#f1f5f9', padding: 8, borderRadius: 6, fontSize: 10, color: '#64748b', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📦 Modul tidak akan tampil di dashboard siswa.
                </div>
              )}
            </div>

            {/* DAFTAR KONTEN */}
            <div style={s.card}>
              <h4 style={s.cardTitle}><Layers size={14} /> Struktur Konten ({sections.length})</h4>
              {sections.length === 0 && (
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px dashed #e2e8f0' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Belum ada konten.</p>
                  <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>Klik tombol di bawah untuk menambah</p>
                </div>
              )}
              {sections.map((sec, idx) => (
                <div key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: activeSection === sec.id ? '#eef2ff' : '#f8fafc', 
                  border: `1px solid ${activeSection === sec.id ? '#3b82f6' : '#e2e8f0'}`,
                  transition: '0.2s'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 'up'); }} style={s.btnArrow} disabled={idx === 0}><ChevronUp size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 'down'); }} style={s.btnArrow} disabled={idx === sections.length - 1}><ChevronDown size={12} /></button>
                  </div>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    {sec.type === 'text' ? '📄' : sec.type === 'file' ? '📁' : sec.type === 'video' ? '🎥' : '📝'}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.title || `Bagian ${idx + 1}`}</span>
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }} style={s.btnX}><X size={12} /></button>
                </div>
              ))}
            </div>

            {/* TOMBOL TAMBAH KONTEN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {[
                { type: 'text', icon: <Type size={13} />, label: 'Teks', desc: 'Materi tulisan + format', color: '#3b82f6' },
                { type: 'file', icon: <FileUp size={13} />, label: 'File', desc: 'Upload PDF/DOC/PPT', color: '#10b981' },
                { type: 'video', icon: <Video size={13} />, label: 'Video', desc: 'YouTube & link', color: '#ef4444' },
                { type: 'assignment', icon: <Send size={13} />, label: 'Tugas', desc: 'Instruksi & deadline', color: '#f59e0b' }
              ].map(btn => (
                <button 
                  key={btn.type} 
                  onClick={() => addSection(btn.type)} 
                  style={{
                    padding: '8px', background: 'white', border: `1px solid ${btn.color}20`, borderRadius: 8, 
                    cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', gap: 6, color: btn.color, transition: '0.2s'
                  }}
                  title={btn.desc}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>

            {/* QUIZ */}
            <div style={s.card}>
              <h4 style={s.cardTitle}><HelpCircle size={14} /> Kuis / Evaluasi</h4>
              {quizData?.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, background: '#f0fdf4', padding: 8, borderRadius: 6 }}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>{quizData.length} soal</span>
                  <button 
                    onClick={() => { if(!editId) return alert("Simpan modul dulu!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} 
                    style={{ marginLeft: 'auto', background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 10 }}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { if(!editId) return alert("Simpan modul dulu!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} 
                  style={{ width: '100%', padding: 8, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <HelpCircle size={14} /> + Buat Kuis
                </button>
              )}
              {deadlineQuiz && (
                <p style={{ fontSize: 9, color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> Deadline kuis: {new Date(deadlineQuiz).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
          </div>

          {/* AREA EDITOR KANAN */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!activeSec ? (
              <div style={s.emptyEditor}>
                <Layers size={48} color="#cbd5e1" />
                <h3 style={{ fontSize: 16, marginTop: 12 }}>Pilih atau Tambah Konten</h3>
                <p style={{ fontSize: 12, marginTop: 4 }}>Klik salah satu konten di sidebar kiri, atau tambah konten baru.</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>💡 Tips: Gunakan preview (👁️) untuk melihat tampilan siswa!</p>
              </div>
            ) : (
              <div style={s.editorCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, 
                      background: activeSec.type === 'assignment' ? '#fef3c7' : '#e0e7ff', 
                      color: activeSec.type === 'assignment' ? '#b45309' : '#3730a3' }}>
                      {activeSec.type === 'text' ? '📄 TEKS' : activeSec.type === 'file' ? '📁 FILE' : activeSec.type === 'video' ? '🎥 VIDEO' : '📝 TUGAS'}
                    </span>
                    {activeSec.endTime && (
                      <span style={{ fontSize: 9, background: '#fef3c7', padding: '2px 8px', borderRadius: 12, color: '#b45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> Deadline: {new Date(activeSec.endTime).toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowPreview(true)} style={{ background: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} /> Preview
                    </button>
                    <button onClick={() => removeSection(activeSec.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>

                <input 
                  value={activeSec.title} 
                  onChange={e => updateSection(activeSec.id, 'title', e.target.value)} 
                  placeholder="Judul section (contoh: Bab 1, Pengertian, dll)" 
                  style={s.titleInput} 
                />

                {renderEditorContent()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM BAR - FIXED */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: isMobile ? 0 : 260, right: 0, 
        background: 'white', borderTop: '1px solid #e2e8f0', padding: '10px 20px', 
        display: 'flex', justifyContent: 'flex-end', gap: 10, zIndex: 50 
      }}>
        <button onClick={() => navigate('/guru/modul')} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Batal
        </button>
        {editId && (
          <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={{ padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ExternalLink size={14} /> Live Preview
          </button>
        )}
        <button onClick={handleSave} disabled={saving} style={{ 
          padding: '10px 25px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, 
          fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', 
          display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.6 : 1
        }}>
          <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update Modul' : 'Terbitkan Modul'}
        </button>
      </div>
    </div>
  );
};

// Styles
const s = {
  btnBack: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m?12:13, display: 'flex', alignItems: 'center', gap: 4 }),
  btnSave: (m) => ({ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: m?12:13, display: 'flex', alignItems: 'center', gap: 6 }),
  btnPreview: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m?11:12, display: 'flex', alignItems: 'center', gap: 4 }),
  card: { background: 'white', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
  cardTitle: { margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },
  input: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 8, boxSizing: 'border-box', transition: '0.2s' },
  inputSmall: { flex: 1, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 10, outline: 'none', boxSizing: 'border-box' },
  select: { flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, background: 'white', outline: 'none', cursor: 'pointer' },
  btnArrow: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  btnX: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyEditor: { textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '2px dashed #e2e8f0', color: '#94a3b8' },
  editorCard: { background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' },
  titleInput: { width: '100%', border: 'none', fontSize: 16, fontWeight: 700, outline: 'none', marginBottom: 16, padding: '4px 0', color: '#1e293b', borderBottom: '2px solid #e2e8f0' },
  uploadBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '30px 20px', border: '2px dashed #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#f8fafc', color: '#64748b', fontSize: 13, transition: '0.2s' },
};

export default ManageMateri;