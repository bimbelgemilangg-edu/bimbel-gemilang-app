import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, Trash2, FileText, HelpCircle, Clock, ArrowLeft, Upload, Calendar, 
  Users, Eye, Sparkles, FileUp, Type, Video, ChevronRight, ChevronLeft,
  CheckCircle, BookOpen, Target, Send, Plus, X, Image as ImageIcon
} from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [deadlineQuiz, setDeadlineQuiz] = useState("");
  const [tugasBlocks, setTugasBlocks] = useState([]);
  const [targetKategori, setTargetKategori] = useState("Semua");
  const [targetKelas, setTargetKelas] = useState("Semua");
  const [mingguKe, setMingguKe] = useState(1);
  const [tahunAjaran, setTahunAjaran] = useState("2025/2026");
  const [statusModul, setStatusModul] = useState("aktif");
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [authorName] = useState(localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru");

  const COLLECTION_NAME = "bimbel_modul";
  const SUBJECTS = ["Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS", "PPKn", "Umum"];
  const STATUS_OPTIONS = [
    { value: 'aktif', label: '🟢 Aktif (Minggu Ini)', color: '#10b981' },
    { value: 'terjadwal', label: '🟡 Terjadwal (Minggu Depan)', color: '#f59e0b' },
    { value: 'arsip', label: '📦 Arsip (Sudah Lewat)', color: '#64748b' }
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchContextData = async () => {
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudentsList(data);
      const classes = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setAvailableClasses(classes);
    };
    fetchContextData();
  }, []);

  useEffect(() => {
    if (editId) fetchModulData();
    else if (subject && targetKelas !== "Semua" && mingguKe) {
      setTitle(`${subject} - Kelas ${targetKelas} - Minggu ke-${mingguKe}`);
    }
  }, [editId, subject, targetKelas, mingguKe]);

  const fetchModulData = async () => {
    const docRef = doc(db, COLLECTION_NAME, editId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      setTitle(data.title || "");
      setSubject(data.subject || "");
      setCoverImage(data.coverImage || null);
      setBlocks((data.blocks || []).filter(b => b.type !== 'assignment'));
      setQuizData(data.quizData || []);
      setDeadlineQuiz(data.deadlineQuiz || "");
      setTargetKategori(data.targetKategori || "Semua");
      setTargetKelas(data.targetKelas || "Semua");
      setMingguKe(data.mingguKe || 1);
      setTahunAjaran(data.tahunAjaran || "2025/2026");
      setStatusModul(data.status || "aktif");
      setTanggalMulai(data.tanggalMulai || "");
      setTanggalSelesai(data.tanggalSelesai || "");
      setTugasBlocks((data.blocks || []).filter(b => b.type === 'assignment'));
    }
  };

  const convertBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const handleFileUpload = async (e, blockId = null) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return alert("❌ File terlalu besar! Maksimal 50MB.");
    try {
      const base64 = await convertBase64(file);
      const { uploadToDrive } = await import('../../../services/uploadService');
      const result = await uploadToDrive(base64, file.name, file.type);
      if (result.success) {
        if (blockId) {
          setBlocks(blocks.map(b => b.id === blockId ? { ...b, content: result.downloadURL, fileName: file.name, mimeType: file.type, fileUrl: result.downloadURL } : b));
        } else setCoverImage(result.downloadURL);
        alert("✅ File berhasil diupload!");
      } else alert("❌ Upload gagal: " + result.error);
    } catch (err) { alert("❌ Upload error: " + err.message); }
  };

  const addBlock = (type) => setBlocks([...blocks, { id: Date.now(), type, content: "", fileName: "", mimeType: "", title: type === 'file' ? "📁 MODUL PDF/GAMBAR" : type === 'video' ? "🔗 LINK/VIDEO" : "📄 MATERI TEKS" }]);
  const updateBlock = (id, field, value) => setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  const removeBlock = (id) => { if(window.confirm("Hapus?")) setBlocks(blocks.filter(b => b.id !== id)); };
  const addTugasBlock = () => setTugasBlocks([...tugasBlocks, { id: Date.now(), type: 'assignment', title: '📝 TUGAS MANDIRI', content: '', endTime: '' }]);
  const updateTugasBlock = (id, field, value) => setTugasBlocks(tugasBlocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  const removeTugasBlock = (id) => setTugasBlocks(tugasBlocks.filter(b => b.id !== id));

  const handleSave = async () => {
    if (!title || !subject) return alert("❌ Judul dan Mata Pelajaran wajib diisi!");
    setLoading(true);
    const allBlocks = [...blocks, ...tugasBlocks];
    const payload = {
      title: title.toUpperCase(), subject: subject.toUpperCase(), coverImage, blocks: allBlocks,
      quizData, deadlineQuiz: deadlineQuiz || null, targetKategori, targetKelas,
      mingguKe: parseInt(mingguKe) || 1, tahunAjaran, status: statusModul,
      tanggalMulai: tanggalMulai || new Date().toISOString().split('T')[0], tanggalSelesai: tanggalSelesai || "",
      authorName, updatedAt: serverTimestamp()
    };
    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
        alert("✅ MODUL BERHASIL DIPERBARUI!");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, COLLECTION_NAME), payload);
        alert("✅ MODUL BARU BERHASIL DIPUBLISH!");
      }
      navigate('/guru/modul');
    } catch (error) { alert("❌ Gagal menyimpan: " + error.message); }
    setLoading(false);
  };

  const progressPercent = ((currentStep - 1) / 2) * 100;

  return (
    <div style={st.container(isMobile)}>
      <div style={st.header}>
        <button onClick={() => navigate('/guru/modul')} style={st.btnBack(isMobile)}><ArrowLeft size={16} /> {!isMobile && 'Kembali'}</button>
        <h2 style={st.headerTitle(isMobile)}>{editId ? '✏️ Edit Modul' : '📚 Buat Modul Baru'}</h2>
        <div style={{width: isMobile ? 0 : 100}}></div>
      </div>

      <div style={st.progressContainer}>
        <div style={st.progressBar}><div style={{...st.progressFill, width: `${progressPercent}%`}}></div></div>
        <div style={st.stepsIndicator(isMobile)}>
          {[1,2,3].map(s => (
            <React.Fragment key={s}>
              <div style={st.stepDot(currentStep >= s)} onClick={() => setCurrentStep(s)}>
                <span style={st.stepNum}>{s}</span>
                <span style={st.stepLabel(isMobile)}>{s===1?'Materi':s===2?'Tugas & Kuis':'Target'}</span>
              </div>
              {s < 3 && <div style={st.stepLine(currentStep > s)}></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {currentStep === 1 && (
        <div style={st.stepContent}>
          <div style={st.sectionCard}>
            <div style={st.sectionHeader}><BookOpen size={18} color="#3b82f6" /><h3>Identitas Modul</h3></div>
            <div style={st.formGrid(isMobile)}>
              <div style={st.formGroup}>
                <label style={st.formLabel}>Mata Pelajaran *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={st.formSelect}>
                  <option value="">Pilih Mapel...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={st.formGroup}>
                <label style={st.formLabel}>Judul Modul *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Matematika - Kelas 5 SD - Minggu ke-3" style={st.formInput} />
              </div>
            </div>
            <div style={{marginTop: 15}}>
              <label style={st.formLabel}>Cover Modul</label>
              <div style={st.coverBox}>
                {coverImage ? (
                  <div style={st.coverPreview}><img src={coverImage} alt="Cover" style={st.coverImg} /><button onClick={() => setCoverImage(null)} style={st.btnRemoveImg}>✕</button></div>
                ) : (
                  <label style={st.coverPlaceholder}><input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e)} /><ImageIcon size={30} color="#94a3b8" /><span>Upload Cover</span></label>
                )}
              </div>
            </div>
          </div>

          <div style={st.sectionCard}>
            <div style={st.sectionHeader}><FileText size={18} color="#10b981" /><h3>Materi Pembelajaran</h3><span style={{fontSize: 11, color: '#94a3b8', marginLeft: 'auto'}}>{blocks.length} materi</span></div>
            {blocks.length === 0 && <div style={st.emptyState}><FileUp size={40} color="#cbd5e1" /><p>Belum ada materi.</p></div>}
            {blocks.map(block => (
              <div key={block.id} style={st.blockCard}>
                <div style={st.blockHeader}><span style={st.blockBadge(block.type)}>{block.type==='file'?'📁 FILE':block.type==='video'?'🔗 LINK':'📄 TEKS'}</span><button onClick={() => removeBlock(block.id)} style={st.btnRemove}><X size={14}/></button></div>
                <input placeholder="Judul materi..." value={block.title} onChange={e => updateBlock(block.id, 'title', e.target.value)} style={st.blockTitleInput} />
                {block.type === 'file' ? (
                  <label style={st.uploadArea}><input type="file" accept=".pdf,image/*" hidden onChange={(e) => handleFileUpload(e, block.id)} /><FileUp size={20} color="#3b82f6" /><span>{block.fileName || "Klik untuk Upload (Max 50MB)"}</span></label>
                ) : block.type === 'video' ? (
                  <input placeholder="Tempel link YouTube, Canva..." value={block.content} onChange={e => updateBlock(block.id, 'content', e.target.value)} style={st.textArea} />
                ) : (
                  <textarea placeholder="Tulis penjelasan materi..." value={block.content} onChange={e => updateBlock(block.id, 'content', e.target.value)} style={st.textArea} />
                )}
                {block.content && block.type === 'file' && <div style={st.previewMini}><Eye size={12}/> {block.fileName || 'File terupload'}</div>}
              </div>
            ))}
            <div style={st.addButtons}>
              <button onClick={() => addBlock('text')} style={st.btnAddType}><Type size={14}/> Teks</button>
              <button onClick={() => addBlock('file')} style={st.btnAddType}><FileUp size={14}/> File</button>
              <button onClick={() => addBlock('video')} style={st.btnAddType}><Video size={14}/> Link</button>
            </div>
          </div>
          <div style={st.navButtons}><div></div><button onClick={() => setCurrentStep(2)} style={st.btnNext}>Lanjut <ChevronRight size={16}/></button></div>
        </div>
      )}

      {currentStep === 2 && (
        <div style={st.stepContent}>
          <div style={st.sectionCard}>
            <div style={st.sectionHeader}><Send size={18} color="#f59e0b" /><h3>Tugas Mandiri</h3><button onClick={addTugasBlock} style={st.btnAddSmall}><Plus size={14}/> Tambah</button></div>
            {tugasBlocks.length === 0 && <div style={st.emptyState}><Send size={40} color="#cbd5e1" /><p>Opsional.</p></div>}
            {tugasBlocks.map(block => (
              <div key={block.id} style={st.tugasCard}>
                <div style={st.blockHeader}><span style={st.blockBadge('assignment')}>📝 TUGAS</span><button onClick={() => removeTugasBlock(block.id)} style={st.btnRemove}><X size={14}/></button></div>
                <input placeholder="Judul tugas..." value={block.title} onChange={e => updateTugasBlock(block.id, 'title', e.target.value)} style={st.blockTitleInput} />
                <textarea placeholder="Instruksi tugas..." value={block.content} onChange={e => updateTugasBlock(block.id, 'content', e.target.value)} style={st.textArea} />
                <div style={st.deadlineRow}><Clock size={14} color="#f59e0b"/><span style={{fontSize: 12, fontWeight: 700, color: '#b45309'}}>Deadline:</span><input type="datetime-local" value={block.endTime} onChange={e => updateTugasBlock(block.id, 'endTime', e.target.value)} style={st.deadlineInput}/></div>
              </div>
            ))}
          </div>
          <div style={st.sectionCard}>
            <div style={st.sectionHeader}><HelpCircle size={18} color="#8b5cf6" /><h3>Evaluasi Kuis</h3></div>
            <div style={st.quizInfo}>
              {quizData?.length > 0 ? (
                <div style={st.quizReady}><CheckCircle size={20} color="#10b981"/><span>🔥 {quizData.length} Soal Siap</span><button onClick={() => { if(!editId) return alert("Simpan dulu (Langkah 3)!"); navigate(`/guru/manage-quiz?modulId=${editId}`); }} style={st.btnEditQuiz}>Edit Kuis</button></div>
              ) : (
                <div style={st.quizEmpty}><HelpCircle size={20} color="#94a3b8"/><span>Belum ada soal.</span><button onClick={() => alert("Simpan dulu (Langkah 3).")} style={st.btnCreateQuiz}>+ Buat Kuis</button></div>
              )}
            </div>
            <div style={{marginTop: 15}}><label style={st.formLabel}>Deadline Kuis</label><input type="datetime-local" value={deadlineQuiz} onChange={e => setDeadlineQuiz(e.target.value)} style={st.formInput}/></div>
          </div>
          <div style={st.navButtons}><button onClick={() => setCurrentStep(1)} style={st.btnPrev}><ChevronLeft size={16}/> Kembali</button><button onClick={() => setCurrentStep(3)} style={st.btnNext}>Lanjut <ChevronRight size={16}/></button></div>
        </div>
      )}

      {currentStep === 3 && (
        <div style={st.stepContent}>
          <div style={st.sectionCard}>
            <div style={st.sectionHeader}><Target size={18} color="#ef4444" /><h3>Target & Penjadwalan</h3></div>
            <div style={st.formGrid(isMobile)}>
              <div style={st.formGroup}><label style={st.formLabel}>Program</label><select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={st.formSelect}><option value="Semua">Semua</option><option value="Reguler">📚 Reguler</option><option value="English">🗣️ English</option></select></div>
              <div style={st.formGroup}><label style={st.formLabel}>Kelas</label><select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={st.formSelect}><option value="Semua">Semua</option>{availableClasses.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
              <div style={st.formGroup}><label style={st.formLabel}>Minggu Ke-</label><input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} style={st.formInput}/></div>
              <div style={st.formGroup}><label style={st.formLabel}>Tahun Ajaran</label><input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} style={st.formInput} placeholder="2025/2026"/></div>
            </div>
            <div style={{marginTop: 15}}>
              <label style={st.formLabel}>Status Modul</label>
              <div style={st.statusButtons}>{STATUS_OPTIONS.map(opt => <button key={opt.value} onClick={() => setStatusModul(opt.value)} style={st.statusBtn(statusModul === opt.value, opt.color)}>{statusModul === opt.value && <CheckCircle size={14}/>} {opt.label}</button>)}</div>
            </div>
            <div style={{...st.formGrid(isMobile), marginTop: 15}}>
              <div style={st.formGroup}><label style={st.formLabel}>Tgl Mulai</label><input type="date" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} style={st.formInput}/></div>
              <div style={st.formGroup}><label style={st.formLabel}>Tgl Selesai</label><input type="date" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} style={st.formInput}/></div>
            </div>
          </div>
          <div style={st.sectionCard}>
            <div style={st.sectionHeader}><CheckCircle size={18} color="#10b981"/><h3>Ringkasan</h3></div>
            <div style={st.summaryGrid}>
              <div style={st.summaryItem}><BookOpen size={14}/> {subject||'-'}</div>
              <div style={st.summaryItem}><FileText size={14}/> {title||'-'}</div>
              <div style={st.summaryItem}><Users size={14}/> {targetKategori}/{targetKelas}</div>
              <div style={st.summaryItem}><FileUp size={14}/> {blocks.length + tugasBlocks.length} Materi</div>
              <div style={st.summaryItem}><HelpCircle size={14}/> {quizData?.length||0} Soal</div>
              <div style={st.summaryItem}><Calendar size={14}/> Minggu ke-{mingguKe}</div>
              <div style={st.summaryItem}><Target size={14}/> {STATUS_OPTIONS.find(o=>o.value===statusModul)?.label}</div>
            </div>
          </div>
          <div style={st.navButtons}><button onClick={() => setCurrentStep(2)} style={st.btnPrev}><ChevronLeft size={16}/> Kembali</button><button onClick={handleSave} disabled={loading} style={st.btnPublish}><Save size={18}/> {loading?'Menyimpan...':editId?'💾 Update':'🚀 Terbitkan'}</button></div>
        </div>
      )}
    </div>
  );
};

const st = {
  container: (m) => ({ padding: m ? '10px' : '20px', paddingBottom: 120, maxWidth: 900, margin: '0 auto' }),
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  btnBack: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: m?12:14, display: 'flex', alignItems: 'center', gap: 6 }),
  headerTitle: (m) => ({ margin: 0, fontSize: m?18:22, fontWeight: 800, color: '#1e293b' }),
  progressContainer: { marginBottom: 25 },
  progressBar: { height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 15 },
  progressFill: { height: '100%', background: '#3b82f6', borderRadius: 3, transition: 'width 0.3s' },
  stepsIndicator: (m) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: m?4:10 }),
  stepDot: (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: active?1:0.4 }),
  stepNum: { width: 30, height: 30, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 },
  stepLabel: (m) => ({ fontSize: m?9:11, fontWeight: 700, color: '#64748b', marginTop: 4 }),
  stepLine: (active) => ({ flex: 1, height: 3, background: active?'#3b82f6':'#e2e8f0', maxWidth: 50 }),
  stepContent: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionCard: { background: 'white', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  formGrid: (m) => ({ display: 'grid', gridTemplateColumns: m?'1fr':'1fr 1fr', gap: 12 }),
  formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  formLabel: { fontSize: 12, fontWeight: 700, color: '#64748b' },
  formInput: { padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
  formSelect: { padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'white' },
  coverBox: { height: 130, borderRadius: 12, border: '2px dashed #e2e8f0', overflow: 'hidden' },
  coverPreview: { position: 'relative', width: '100%', height: '100%' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  btnRemoveImg: { position: 'absolute', top: 6, right: 6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6, color: '#94a3b8' },
  emptyState: { textAlign: 'center', padding: 25, color: '#94a3b8' },
  blockCard: { border: '1px solid #f1f5f9', borderRadius: 12, padding: 14, marginBottom: 10, background: '#fafcfd' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  blockBadge: (type) => ({ fontSize: 10, fontWeight: 800, color: type==='assignment'?'#f59e0b':'#3b82f6', background: type==='assignment'?'#fef3c7':'#e0e7ff', padding: '4px 10px', borderRadius: 8 }),
  btnRemove: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: 4, borderRadius: 6, cursor: 'pointer' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: 15, fontWeight: 700, outline: 'none', marginBottom: 8, padding: '6px 0', color: '#1e293b' },
  uploadArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '2px dashed #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#f8fafc', fontSize: 13, color: '#64748b' },
  textArea: { width: '100%', minHeight: 70, padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  previewMini: { marginTop: 6, padding: '6px 10px', background: '#f0fdf4', borderRadius: 6, fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 },
  addButtons: { display: 'flex', gap: 6, marginTop: 12 },
  btnAddType: { flex: 1, padding: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#64748b' },
  tugasCard: { border: '1px solid #fef3c7', borderRadius: 12, padding: 14, marginBottom: 10, background: '#fffdf5' },
  deadlineRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  deadlineInput: { padding: '6px 10px', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, outline: 'none' },
  quizInfo: { padding: 14, background: '#fafafa', borderRadius: 10, border: '1px solid #f1f5f9' },
  quizReady: { display: 'flex', alignItems: 'center', gap: 10 },
  quizEmpty: { display: 'flex', alignItems: 'center', gap: 10 },
  btnEditQuiz: { marginLeft: 'auto', background: '#e0e7ff', color: '#3730a3', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  btnCreateQuiz: { marginLeft: 'auto', background: '#3b82f6', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  btnAddSmall: { background: '#fef3c7', color: '#b45309', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  statusButtons: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  statusBtn: (active, color) => ({ flex: 1, minWidth: 130, padding: '8px 10px', borderRadius: 10, border: active?`2px solid ${color}`:'1px solid #e2e8f0', background: active?`${color}10`:'white', cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', color: active?color:'#64748b' }),
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 },
  summaryItem: { padding: '8px 10px', background: '#f8fafc', borderRadius: 8, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 600 },
  navButtons: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },
  btnPrev: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' },
  btnNext: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 },
  btnPublish: { background: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 10px rgba(16,185,129,0.3)' },
};

export default ManageMateri;