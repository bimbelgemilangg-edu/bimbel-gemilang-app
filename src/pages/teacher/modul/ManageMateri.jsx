import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Trash2, FileText, HelpCircle, Clock, ArrowLeft, FileUp, Type, Video, X, Image as ImageIcon, BookOpen, Send, Layers, ChevronDown, ChevronUp, Settings, Eye, Copy, CheckCircle, Calendar, Users, Target } from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [saving, setSaving] = useState(false);
  
  // IDENTITAS
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  
  // KONTEN
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  
  // PENGATURAN (SELALU TERLIHAT)
  const [targetKategori, setTargetKategori] = useState("Semua");
  const [targetKelas, setTargetKelas] = useState("Semua");
  const [mingguKe, setMingguKe] = useState(1);
  const [tahunAjaran, setTahunAjaran] = useState("2025/2026");
  const [statusModul, setStatusModul] = useState("aktif");
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
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
      const snapSiswa = await getDocs(collection(db, "students"));
      const data = snapSiswa.docs.map(d => d.data());
      const classes = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setAvailableClasses(classes);
      
      const snapGuru = await getDocs(collection(db, "teachers"));
      const guruData = snapGuru.docs.map(d => d.data());
      const mapelList = [...new Set(guruData.map(t => t.mapel).filter(Boolean))];
      if (mapelList.length === 0) mapelList.push("Umum");
      setSubjects(mapelList.sort());
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
      setDeadlineQuiz(data.deadlineQuiz || "");
      setTargetKategori(data.targetKategori || "Semua");
      setTargetKelas(data.targetKelas || "Semua");
      setMingguKe(data.mingguKe || 1);
      setTahunAjaran(data.tahunAjaran || "2025/2026");
      setStatusModul(data.status || "aktif");
      setTanggalMulai(data.tanggalMulai || "");
      setTanggalSelesai(data.tanggalSelesai || "");
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
      }
    } catch (err) { console.error(err); }
  };

  const addSection = (type) => {
    const titles = { text: '📄 Materi Teks', file: '📁 File/Dokumen', video: '🔗 Link/Video', assignment: '📝 Tugas' };
    const newSection = { id: Date.now(), type, title: titles[type] || '', content: '', fileName: '', mimeType: '', endTime: '' };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
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

  const handleSave = async () => {
    if (!title) return alert("❌ Judul modul wajib diisi!");
    setSaving(true);
    const payload = {
      title: title.toUpperCase(), subject: subject.toUpperCase(), coverImage, blocks: sections,
      quizData, deadlineQuiz: deadlineQuiz || null, targetKategori, targetKelas,
      mingguKe: parseInt(mingguKe) || 1, tahunAjaran, status: statusModul,
      tanggalMulai: tanggalMulai || new Date().toISOString().split('T')[0],
      tanggalSelesai: tanggalSelesai || "", authorName, updatedAt: serverTimestamp()
    };
    try {
      if (editId) await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
      else { payload.createdAt = serverTimestamp(); const newDoc = await addDoc(collection(db, COLLECTION_NAME), payload); navigate(`/guru/modul/materi?edit=${newDoc.id}`); return; }
      alert("✅ Modul disimpan!");
    } catch (err) { alert("❌ Gagal: " + err.message); }
    setSaving(false);
  };

  const activeSec = sections.find(s => s.id === activeSection);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => navigate('/guru/modul')} style={s.btnBack(isMobile)}><ArrowLeft size={14} /> {!isMobile && 'Kembali'}</button>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' }}>{editId ? '✏️ Edit Modul' : '📚 Buat Modul Baru'}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {editId && <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={s.btnPreview(isMobile)}><Eye size={14} /> Preview</button>}
          <button onClick={handleSave} disabled={saving} style={s.btnSave(isMobile)}><Save size={14} /> {saving ? '...' : 'Simpan'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* SIDEBAR KIRI */}
        <div style={{ width: isMobile ? '100%' : '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* IDENTITAS */}
          <div style={s.card}>
            <h4 style={s.cardTitle}><BookOpen size={14} /> Identitas Modul</h4>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul modul..." style={s.input} />
            <select value={subject} onChange={e => setSubject(e.target.value)} style={{...s.input, background:'white'}}>
              <option value="">Mata Pelajaran</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={{ display: 'block', height: 80, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: '2px dashed #e2e8f0', marginTop: 4 }}>
              {coverImage ? <img src={coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11, flexDirection: 'column', gap: 4 }}><ImageIcon size={18} />Cover</div>}
              <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e)} />
            </label>
          </div>

          {/* PENGATURAN (SELALU TERLIHAT) */}
          <div style={s.card}>
            <h4 style={s.cardTitle}><Settings size={14} /> Pengaturan</h4>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={s.select}>
                <option value="Semua">Program</option><option value="Reguler">📚 Reguler</option><option value="English">🗣️ English</option>
              </select>
              <select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={s.select}>
                <option value="Semua">Kelas</option>{availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} placeholder="Minggu" style={s.inputSmall} />
              <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} placeholder="Thn Ajaran" style={s.inputSmall} />
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setStatusModul(opt.value)} style={{
                  padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                  border: statusModul === opt.value ? `2px solid ${opt.color}` : '1px solid #e2e8f0',
                  background: statusModul === opt.value ? `${opt.color}15` : 'white', color: statusModul === opt.value ? opt.color : '#64748b'
                }}>{opt.label}</button>
              ))}
            </div>
          </div>

          {/* DAFTAR KONTEN */}
          <div style={s.card}>
            <h4 style={s.cardTitle}><Layers size={14} /> Konten ({sections.length})</h4>
            {sections.length === 0 && <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: 15 }}>Belum ada konten.</p>}
            {sections.map((sec, idx) => (
              <div key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 3,
                background: activeSection === sec.id ? '#eef2ff' : '#f8fafc', border: `1px solid ${activeSection === sec.id ? '#3b82f6' : '#e2e8f0'}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <button onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 'up'); }} style={s.btnArrow}><ChevronUp size={10} /></button>
                  <button onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 'down'); }} style={s.btnArrow}><ChevronDown size={10} /></button>
                </div>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                  {sec.type === 'text' ? '📄' : sec.type === 'file' ? '📁' : sec.type === 'video' ? '🔗' : '📝'}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.title || `#${idx + 1}`}</span>
                </span>
                <button onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }} style={s.btnX}><X size={12} /></button>
              </div>
            ))}
          </div>

          {/* TAMBAH SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              { type: 'text', icon: <Type size={13} />, label: 'Teks' },
              { type: 'file', icon: <FileUp size={13} />, label: 'File' },
              { type: 'video', icon: <Video size={13} />, label: 'Link' },
              { type: 'assignment', icon: <Send size={13} />, label: 'Tugas' }
            ].map(btn => (
              <button key={btn.type} onClick={() => addSection(btn.type)} style={s.btnAddType}>{btn.icon} {btn.label}</button>
            ))}
          </div>

          {/* QUIZ */}
          <div style={s.card}>
            <h4 style={s.cardTitle}><HelpCircle size={14} /> Kuis</h4>
            {quizData?.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <CheckCircle size={14} color="#10b981" /> {quizData.length} soal
                <button onClick={() => { if(!editId) return alert("Simpan dulu!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} style={{ marginLeft: 'auto', background: '#e0e7ff', color: '#3730a3', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 10 }}>Edit</button>
              </div>
            ) : (
              <button onClick={() => { if(!editId) return alert("Simpan modul dulu!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} style={{ width: '100%', padding: 8, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>+ Buat Kuis</button>
            )}
          </div>
        </div>

        {/* AREA EDITOR KANAN */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!activeSec ? (
            <div style={s.emptyEditor}>
              <Layers size={48} color="#cbd5e1" />
              <h3>Pilih atau Tambah Section</h3>
              <p style={{ fontSize: 12 }}>Klik konten di sidebar kiri, atau tambah baru.</p>
            </div>
          ) : (
            <div style={s.editorCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: activeSec.type === 'assignment' ? '#fef3c7' : '#e0e7ff', color: activeSec.type === 'assignment' ? '#b45309' : '#3730a3' }}>
                  {activeSec.type === 'text' ? '📄 TEKS' : activeSec.type === 'file' ? '📁 FILE' : activeSec.type === 'video' ? '🔗 LINK' : '📝 TUGAS'}
                </span>
                <button onClick={() => removeSection(activeSec.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Trash2 size={12} /> Hapus</button>
              </div>

              <input value={activeSec.title} onChange={e => updateSection(activeSec.id, 'title', e.target.value)} placeholder="Judul section..." style={s.titleInput} />

              {activeSec.type === 'text' && <textarea value={activeSec.content} onChange={e => updateSection(activeSec.id, 'content', e.target.value)} placeholder="Tulis materi di sini..." style={s.textarea} />}

              {activeSec.type === 'file' && (
                activeSec.content ? (
                  <div style={{ textAlign: 'center', padding: 20, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <FileText size={40} color="#3b82f6" />
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{activeSec.fileName || 'File'}</p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                      <a href={activeSec.content} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600, fontSize: 12 }}>Buka</a>
                      <button onClick={() => updateSection(activeSec.id, 'content', '')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Hapus</button>
                    </div>
                  </div>
                ) : (
                  <label style={s.uploadBox}>
                    <FileUp size={30} color="#94a3b8" /><span>Upload PDF/DOCX/PPT/Gambar (Max 50MB)</span>
                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" hidden onChange={(e) => handleFileUpload(e, activeSec.id)} />
                  </label>
                )
              )}

              {activeSec.type === 'video' && <input value={activeSec.content} onChange={e => updateSection(activeSec.id, 'content', e.target.value)} placeholder="Tempel link YouTube, Canva, Google Drive..." style={s.input} />}

              {activeSec.type === 'assignment' && (
                <div>
                  <textarea value={activeSec.content} onChange={e => updateSection(activeSec.id, 'content', e.target.value)} placeholder="Instruksi tugas..." style={s.textarea} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: 10, background: '#fffbeb', borderRadius: 8 }}>
                    <Clock size={14} color="#f59e0b" /><span style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>Deadline:</span>
                    <input type="datetime-local" value={activeSec.endTime} onChange={e => updateSection(activeSec.id, 'endTime', e.target.value)} style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #fde68a', fontSize: 11, outline: 'none' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: isMobile ? 0 : 260, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, zIndex: 50, marginLeft: isMobile ? 0 : 0 }}>
        <button onClick={() => navigate('/guru/modul')} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Batal</button>
        {editId && <button onClick={() => window.open(`/siswa/materi/${editId}`, '_blank')} style={{ padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14} /> Preview</button>}
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 25px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save size={14} /> {saving ? 'Menyimpan...' : editId ? 'Update Modul' : 'Terbitkan Modul'}
        </button>
      </div>
    </div>
  );
};

const s = {
  btnBack: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m?12:13, display: 'flex', alignItems: 'center', gap: 4 }),
  btnSave: (m) => ({ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: m?12:13, display: 'flex', alignItems: 'center', gap: 6 }),
  btnPreview: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m?11:12, display: 'flex', alignItems: 'center', gap: 4 }),
  card: { background: 'white', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' },
  cardTitle: { margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },
  input: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' },
  inputSmall: { flex: 1, padding: 6, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 10, outline: 'none', boxSizing: 'border-box' },
  select: { flex: 1, padding: 6, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 10, background: 'white', boxSizing: 'border-box' },
  btnArrow: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 },
  btnX: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 },
  btnAddType: { padding: '7px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, color: '#64748b' },
  emptyEditor: { textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '2px dashed #e2e8f0', color: '#94a3b8' },
  editorCard: { background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' },
  titleInput: { width: '100%', border: 'none', fontSize: 16, fontWeight: 700, outline: 'none', marginBottom: 12, padding: '6px 0', color: '#1e293b' },
  textarea: { width: '100%', minHeight: 200, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 },
  uploadBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '30px 20px', border: '2px dashed #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#f8fafc', color: '#64748b', fontSize: 13 },
};

export default ManageMateri;