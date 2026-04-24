import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, Trash2, FileText, HelpCircle, Clock, ArrowLeft, Upload, Calendar, 
  Users, Eye, FileUp, Type, Video, Plus, X, Image as ImageIcon, GripVertical,
  BookOpen, Link, Send, CheckCircle, Layers
} from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // IDENTITAS
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  
  // SECTIONS (Google Form Style)
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  
  // TARGET
  const [targetKategori, setTargetKategori] = useState("Semua");
  const [targetKelas, setTargetKelas] = useState("Semua");
  const [mingguKe, setMingguKe] = useState(1);
  const [tahunAjaran, setTahunAjaran] = useState("2025/2026");
  const [statusModul, setStatusModul] = useState("aktif");
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  
  // QUIZ (terpisah)
  const [linkedQuizId, setLinkedQuizId] = useState(null);
  const [quizData, setQuizData] = useState([]);
  
  const [availableClasses, setAvailableClasses] = useState([]);
  const [authorName] = useState(localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru");
  const [showSettings, setShowSettings] = useState(false);

  const COLLECTION_NAME = "bimbel_modul";
  const SUBJECTS = ["Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS", "PPKn", "Umum"];
  const STATUS_OPTIONS = [
    { value: 'aktif', label: '🟢 Aktif', color: '#10b981' },
    { value: 'terjadwal', label: '🟡 Terjadwal', color: '#f59e0b' },
    { value: 'arsip', label: '📦 Arsip', color: '#64748b' }
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchContext = async () => {
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs.map(d => d.data());
      const classes = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setAvailableClasses(classes);
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
      setSections(data.blocks || []);
      setQuizData(data.quizData || []);
      setTargetKategori(data.targetKategori || "Semua");
      setTargetKelas(data.targetKelas || "Semua");
      setMingguKe(data.mingguKe || 1);
      setTahunAjaran(data.tahunAjaran || "2025/2026");
      setStatusModul(data.status || "aktif");
      setTanggalMulai(data.tanggalMulai || "");
      setTanggalSelesai(data.tanggalSelesai || "");
      setLinkedQuizId(data.linkedQuizId || null);
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
        if (sectionId) {
          setSections(sections.map(s => s.id === sectionId ? { ...s, content: result.downloadURL, fileName: file.name, mimeType: file.type } : s));
        } else {
          setCoverImage(result.downloadURL);
        }
        alert("✅ File diupload!");
      } else alert("❌ Gagal: " + result.error);
    } catch (err) { alert("❌ Error: " + err.message); }
  };

  // 🔥 TAMBAH SECTION BARU
  const addSection = (type) => {
    const newSection = {
      id: Date.now(),
      type,
      title: type === 'text' ? '📄 Materi Teks' : type === 'file' ? '📁 File/Modul' : type === 'video' ? '🔗 Link/Video' : '📝 Tugas',
      content: '',
      fileName: '',
      mimeType: '',
      endTime: '',
      hasDeadline: false
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
  };

  // 🔥 UPDATE SECTION
  const updateSection = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // 🔥 HAPUS SECTION
  const removeSection = (id) => {
    if (window.confirm("Hapus section ini?")) {
      setSections(sections.filter(s => s.id !== id));
      if (activeSection === id) setActiveSection(null);
    }
  };

  // 🔥 SIMPAN MODUL
  const handleSave = async () => {
    if (!title) return alert("❌ Judul modul wajib diisi!");
    setSaving(true);
    const payload = {
      title: title.toUpperCase(),
      subject: subject.toUpperCase(),
      coverImage,
      blocks: sections,
      quizData,
      targetKategori,
      targetKelas,
      mingguKe: parseInt(mingguKe) || 1,
      tahunAjaran,
      status: statusModul,
      tanggalMulai: tanggalMulai || new Date().toISOString().split('T')[0],
      tanggalSelesai: tanggalSelesai || "",
      linkedQuizId,
      authorName,
      updatedAt: serverTimestamp()
    };
    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
        alert("✅ Modul diperbarui!");
      } else {
        payload.createdAt = serverTimestamp();
        const newDoc = await addDoc(collection(db, COLLECTION_NAME), payload);
        alert("✅ Modul baru diterbitkan!");
        navigate(`/guru/modul/materi?edit=${newDoc.id}`);
      }
    } catch (err) { alert("❌ Gagal: " + err.message); }
    setSaving(false);
  };

  const activeSec = sections.find(s => s.id === activeSection);

  return (
    <div style={st.wrapper}>
      {/* HEADER */}
      <div style={st.header}>
        <button onClick={() => navigate('/guru/modul')} style={st.btnBack(isMobile)}><ArrowLeft size={16} /> {!isMobile && 'Kembali'}</button>
        <h2 style={st.headerTitle(isMobile)}>{editId ? '✏️ Edit Modul' : '📚 Buat Modul Baru'}</h2>
        <button onClick={handleSave} disabled={saving} style={st.btnSave(isMobile)}>
          <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      <div style={st.mainGrid(isMobile)}>
        {/* SIDEBAR KIRI: DAFTAR SECTION */}
        <div style={st.sidebar(isMobile)}>
          {/* IDENTITAS */}
          <div style={st.sidebarCard}>
            <h4 style={st.sidebarTitle}><BookOpen size={14} /> Identitas</h4>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Judul modul..." 
              style={st.input} 
            />
            <select value={subject} onChange={e => setSubject(e.target.value)} style={st.select}>
              <option value="">Mata Pelajaran</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            {/* COVER */}
            <label style={st.coverLabel}>
              {coverImage ? (
                <img src={coverImage} alt="Cover" style={st.coverPreview} />
              ) : (
                <div style={st.coverPlaceholder}><ImageIcon size={20} color="#94a3b8" /><span>Cover</span></div>
              )}
              <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e)} />
            </label>
          </div>

          {/* DAFTAR SECTION */}
          <div style={st.sidebarCard}>
            <h4 style={st.sidebarTitle}><Layers size={14} /> Konten ({sections.length})</h4>
            {sections.length === 0 && (
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: 10 }}>Belum ada konten. Tambah section di bawah.</p>
            )}
            {sections.map((sec, idx) => (
              <div 
                key={sec.id} 
                onClick={() => setActiveSection(sec.id)}
                style={{
                  ...st.sectionItem,
                  background: activeSection === sec.id ? '#eef2ff' : 'white',
                  borderColor: activeSection === sec.id ? '#3b82f6' : '#e2e8f0'
                }}
              >
                <span style={{ fontSize: 18 }}>
                  {sec.type === 'text' ? '📄' : sec.type === 'file' ? '📁' : sec.type === 'video' ? '🔗' : '📝'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sec.title || `Section ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{sec.type}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }} style={st.btnRemoveSm}><X size={12} /></button>
              </div>
            ))}
          </div>

          {/* TOMBOL TAMBAH SECTION */}
          <div style={st.addButtons}>
            <button onClick={() => addSection('text')} style={st.btnAddType}><Type size={14} /> Teks</button>
            <button onClick={() => addSection('file')} style={st.btnAddType}><FileUp size={14} /> File</button>
            <button onClick={() => addSection('video')} style={st.btnAddType}><Video size={14} /> Link</button>
            <button onClick={() => addSection('assignment')} style={st.btnAddType}><Send size={14} /> Tugas</button>
          </div>

          {/* QUIZ LINK */}
          <div style={st.sidebarCard}>
            <h4 style={st.sidebarTitle}><HelpCircle size={14} /> Kuis</h4>
            {linkedQuizId ? (
              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                <CheckCircle size={14} /> Terhubung
                <button onClick={() => navigate(`/guru/manage-quiz?modulId=${editId || linkedQuizId}`)} style={st.btnLink}>Edit Kuis</button>
              </div>
            ) : (
              <button onClick={() => {
                if (!editId) return alert("Simpan modul dulu sebelum membuat kuis!");
                navigate(`/guru/manage-quiz?modulId=${editId}`);
              }} style={st.btnCreateQuiz}>
                + Buat Kuis
              </button>
            )}
          </div>

          {/* SETTINGS TOGGLE */}
          <button onClick={() => setShowSettings(!showSettings)} style={st.btnSettings}>
            ⚙️ {showSettings ? 'Sembunyikan' : 'Pengaturan Target'}
          </button>

          {/* SETTINGS PANEL */}
          {showSettings && (
            <div style={st.sidebarCard}>
              <div style={st.formGroup}>
                <label style={st.label}>Program</label>
                <select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={st.select}>
                  <option value="Semua">Semua</option>
                  <option value="Reguler">📚 Reguler</option>
                  <option value="English">🗣️ English</option>
                </select>
              </div>
              <div style={st.formGroup}>
                <label style={st.label}>Kelas</label>
                <select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={st.select}>
                  <option value="Semua">Semua</option>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={st.formGroup}>
                <label style={st.label}>Minggu Ke-</label>
                <input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} style={st.input} />
              </div>
              <div style={st.formGroup}>
                <label style={st.label}>Tahun Ajaran</label>
                <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} style={st.input} />
              </div>
              <div style={st.formGroup}>
                <label style={st.label}>Status</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setStatusModul(opt.value)} style={{
                      padding: '4px 10px', borderRadius: 6, border: statusModul === opt.value ? `2px solid ${opt.color}` : '1px solid #e2e8f0',
                      background: statusModul === opt.value ? `${opt.color}15` : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 10,
                      color: statusModul === opt.value ? opt.color : '#64748b'
                    }}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AREA EDIT SECTION */}
        <div style={st.editorArea(isMobile)}>
          {!activeSec ? (
            <div style={st.emptyEditor}>
              <Layers size={48} color="#cbd5e1" />
              <h3>Pilih Section</h3>
              <p>Klik section di sidebar kiri, atau tambah section baru.</p>
            </div>
          ) : (
            <div style={st.editorCard}>
              <div style={st.editorHeader}>
                <span style={st.badge(activeSec.type)}>
                  {activeSec.type === 'text' ? '📄 TEKS' : activeSec.type === 'file' ? '📁 FILE' : activeSec.type === 'video' ? '🔗 LINK' : '📝 TUGAS'}
                </span>
                <button onClick={() => removeSection(activeSec.id)} style={st.btnRemove}><Trash2 size={14} /> Hapus</button>
              </div>

              <input 
                value={activeSec.title} 
                onChange={e => updateSection(activeSec.id, 'title', e.target.value)}
                placeholder="Judul section..."
                style={st.titleInput}
              />

              {activeSec.type === 'text' && (
                <textarea 
                  value={activeSec.content} 
                  onChange={e => updateSection(activeSec.id, 'content', e.target.value)}
                  placeholder="Tulis materi di sini..."
                  style={st.textarea}
                />
              )}

              {activeSec.type === 'file' && (
                <div>
                  {activeSec.content ? (
                    <div style={st.filePreview}>
                      <FileText size={40} color="#3b82f6" />
                      <p>{activeSec.fileName || 'File terupload'}</p>
                      <a href={activeSec.content} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600 }}>Buka File</a>
                      <button onClick={() => updateSection(activeSec.id, 'content', '')} style={st.btnRemoveSm}>Ganti</button>
                    </div>
                  ) : (
                    <label style={st.uploadBox}>
                      <input type="file" accept=".pdf,image/*" hidden onChange={(e) => handleFileUpload(e, activeSec.id)} />
                      <FileUp size={30} color="#94a3b8" />
                      <span>Upload PDF/Gambar (Max 50MB)</span>
                    </label>
                  )}
                </div>
              )}

              {activeSec.type === 'video' && (
                <input 
                  value={activeSec.content} 
                  onChange={e => updateSection(activeSec.id, 'content', e.target.value)}
                  placeholder="Tempel link YouTube, Canva, Google Drive..."
                  style={st.input}
                />
              )}

              {activeSec.type === 'assignment' && (
                <div>
                  <textarea 
                    value={activeSec.content} 
                    onChange={e => updateSection(activeSec.id, 'content', e.target.value)}
                    placeholder="Instruksi tugas..."
                    style={st.textarea}
                  />
                  <div style={st.deadlineRow}>
                    <Clock size={14} color="#f59e0b" />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Deadline:</span>
                    <input 
                      type="datetime-local" 
                      value={activeSec.endTime} 
                      onChange={e => updateSection(activeSec.id, 'endTime', e.target.value)}
                      style={st.deadlineInput}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const st = {
  wrapper: { maxWidth: 1100, margin: '0 auto', padding: '20px', paddingBottom: 100 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  btnBack: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m?12:13, display: 'flex', alignItems: 'center', gap: 4 }),
  headerTitle: (m) => ({ margin: 0, fontSize: m?16:20, fontWeight: 800, color: '#1e293b' }),
  btnSave: (m) => ({ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: m?12:13, display: 'flex', alignItems: 'center', gap: 6 }),
  
  mainGrid: (m) => ({ display: 'flex', gap: 20, flexDirection: m ? 'column' : 'row' }),
  
  // SIDEBAR
  sidebar: (m) => ({ width: m ? '100%' : '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }),
  sidebarCard: { background: 'white', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' },
  sidebarTitle: { margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },
  sectionItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid', cursor: 'pointer', marginBottom: 4, transition: '0.2s' },
  btnRemoveSm: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '2px 4px', borderRadius: 4, cursor: 'pointer' },
  
  // BUTTONS
  addButtons: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  btnAddType: { padding: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#64748b' },
  btnCreateQuiz: { width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  btnLink: { marginLeft: 8, background: '#e0e7ff', color: '#3730a3', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10 },
  btnSettings: { width: '100%', padding: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, color: '#64748b', textAlign: 'left' },
  
  // FORM
  input: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 6 },
  select: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 6, background: 'white' },
  formGroup: { marginBottom: 8 },
  label: { fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 },
  
  // COVER
  coverLabel: { display: 'block', height: 80, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: '2px dashed #e2e8f0', marginTop: 6 },
  coverPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#94a3b8', fontSize: 11 },
  
  // EDITOR
  editorArea: (m) => ({ flex: 1, minWidth: 0 }),
  emptyEditor: { textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' },
  editorCard: { background: 'white', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  badge: (type) => ({ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: type === 'assignment' ? '#fef3c7' : '#e0e7ff', color: type === 'assignment' ? '#b45309' : '#3730a3' }),
  btnRemove: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 },
  titleInput: { width: '100%', border: 'none', fontSize: 18, fontWeight: 700, outline: 'none', marginBottom: 15, padding: '8px 0', color: '#1e293b' },
  textarea: { width: '100%', minHeight: 200, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 },
  uploadBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '30px 20px', border: '2px dashed #e2e8f0', borderRadius: 12, cursor: 'pointer', background: '#f8fafc', color: '#64748b', fontSize: 13 },
  filePreview: { textAlign: 'center', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  deadlineRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, background: '#fffbeb', borderRadius: 8 },
  deadlineInput: { padding: '6px 10px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12, outline: 'none' },
};

export default ManageMateri;