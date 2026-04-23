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
  
  // 🔥 STEP 1: IDENTITAS & MATERI
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  
  // 🔥 STEP 2: TUGAS & KUIS
  const [quizData, setQuizData] = useState([]);
  const [deadlineQuiz, setDeadlineQuiz] = useState("");
  const [tugasBlocks, setTugasBlocks] = useState([]);
  
  // 🔥 STEP 3: TARGET & PUBLIKASI
  const [targetKategori, setTargetKategori] = useState("Semua");
  const [targetKelas, setTargetKelas] = useState("Semua");
  const [mingguKe, setMingguKe] = useState(1);
  const [tahunAjaran, setTahunAjaran] = useState("2025/2026");
  const [statusModul, setStatusModul] = useState("aktif");
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  
  const [studentsList, setStudentsList] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [authorName, setAuthorName] = useState(localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru");

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
      try {
        const snap = await getDocs(collection(db, "students"));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStudentsList(data);
        const classes = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setAvailableClasses(classes);
      } catch (err) { console.error("Error context:", err); }
    };
    fetchContextData();
  }, []);

  useEffect(() => {
    if (editId) fetchModulData();
    else {
      // 🔥 Auto-fill judul: "Mapel - Kelas - Minggu ke-X"
      if (subject && targetKelas !== "Semua" && mingguKe) {
        setTitle(`${subject} - Kelas ${targetKelas} - Minggu ke-${mingguKe}`);
      }
    }
  }, [editId, subject, targetKelas, mingguKe]);

  const fetchModulData = async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, editId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || "");
        setSubject(data.subject || "");
        setCoverImage(data.coverImage || null);
        setBlocks(data.blocks || []);
        setQuizData(data.quizData || []);
        setDeadlineQuiz(data.deadlineQuiz || "");
        setTargetKategori(data.targetKategori || "Semua");
        setTargetKelas(data.targetKelas || "Semua");
        setMingguKe(data.mingguKe || 1);
        setTahunAjaran(data.tahunAjaran || "2025/2026");
        setStatusModul(data.status || "aktif");
        setTanggalMulai(data.tanggalMulai || "");
        setTanggalSelesai(data.tanggalSelesai || "");
        if (data.blocks) {
          const tugas = data.blocks.filter(b => b.type === 'assignment');
          setTugasBlocks(tugas);
        }
      }
    } catch (err) { console.error("Error fetching:", err); }
  };

  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e, blockId = null) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) return alert("❌ File terlalu besar! Maksimal 50MB.");
    try {
      const base64 = await convertBase64(file);
      const { uploadToDrive } = await import('../../../services/uploadService');
      const result = await uploadToDrive(base64, file.name, file.type);
      if (result.success) {
        if (blockId) {
          setBlocks(blocks.map(b => b.id === blockId ? { ...b, content: result.downloadURL, fileName: file.name, mimeType: file.type, fileUrl: result.downloadURL, filePath: result.filePath } : b));
        } else {
          setCoverImage(result.downloadURL);
        }
        alert("✅ File berhasil diupload!");
      } else {
        throw new Error(result.error || "Upload gagal");
      }
    } catch (err) { alert("❌ Gagal upload: " + err.message); }
  };

  const addBlock = (type) => {
    const newBlock = { 
      id: Date.now(), type, content: "", fileName: "", mimeType: "",
      title: type === 'file' ? "📁 MODUL PDF/GAMBAR" : type === 'video' ? "🔗 LINK/VIDEO" : "📄 MATERI TEKS"
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => {
    if(window.confirm("Hapus bagian ini?")) setBlocks(blocks.filter(b => b.id !== id));
  };

  const addTugasBlock = () => {
    const newTugas = { id: Date.now(), type: 'assignment', title: '📝 TUGAS MANDIRI', content: '', hasDeadline: true, startTime: new Date().toISOString().split('T')[0], endTime: '' };
    setTugasBlocks([...tugasBlocks, newTugas]);
  };

  const updateTugasBlock = (id, field, value) => {
    setTugasBlocks(tugasBlocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeTugasBlock = (id) => {
    setTugasBlocks(tugasBlocks.filter(b => b.id !== id));
  };

  const handleSave = async () => {
    if (!title || !subject) return alert("❌ Judul dan Mata Pelajaran wajib diisi!");
    setLoading(true);
    
    // Gabungkan blocks materi + tugas
    const allBlocks = [...blocks, ...tugasBlocks];
    
    const payload = {
      title: title.toUpperCase(),
      subject: subject.toUpperCase(),
      coverImage,
      blocks: allBlocks,
      quizData,
      deadlineQuiz: deadlineQuiz || null,
      targetKategori,
      targetKelas,
      mingguKe: parseInt(mingguKe) || 1,
      tahunAjaran,
      status: statusModul,
      tanggalMulai: tanggalMulai || new Date().toISOString().split('T')[0],
      tanggalSelesai: tanggalSelesai || "",
      authorName,
      updatedAt: serverTimestamp()
    };

    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
        alert("✅ MODUL BERHASIL DIPERBARUI!");
        navigate('/guru/modul');
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, COLLECTION_NAME), payload);
        alert("✅ MODUL BARU BERHASIL DIPUBLISH!");
        navigate('/guru/modul');
      }
    } catch (error) { alert("❌ Gagal menyimpan: " + error.message); }
    setLoading(false);
  };

  const totalSteps = 3;
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div style={styles.container(isMobile)}>
      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack(isMobile)}>
          <ArrowLeft size={16} /> {!isMobile && 'Kembali'}
        </button>
        <h2 style={styles.headerTitle(isMobile)}>
          {editId ? '✏️ Edit Modul' : '📚 Buat Modul Baru'}
        </h2>
        <div style={{width: isMobile ? 0 : 100}}></div>
      </div>

      {/* 🔥 PROGRESS BAR */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${progressPercent}%`}}></div>
        </div>
        <div style={styles.stepsIndicator(isMobile)}>
          <div style={styles.stepDot(currentStep >= 1)} onClick={() => setCurrentStep(1)}>
            <span style={styles.stepNum}>1</span>
            <span style={styles.stepLabel(isMobile)}>Materi</span>
          </div>
          <div style={styles.stepLine(currentStep >= 2)}></div>
          <div style={styles.stepDot(currentStep >= 2)} onClick={() => setCurrentStep(2)}>
            <span style={styles.stepNum}>2</span>
            <span style={styles.stepLabel(isMobile)}>Tugas & Kuis</span>
          </div>
          <div style={styles.stepLine(currentStep >= 3)}></div>
          <div style={styles.stepDot(currentStep >= 3)} onClick={() => setCurrentStep(3)}>
            <span style={styles.stepNum}>3</span>
            <span style={styles.stepLabel(isMobile)}>Target & Terbitkan</span>
          </div>
        </div>
      </div>

      {/* 🔥 STEP 1: IDENTITAS & MATERI */}
      {currentStep === 1 && (
        <div style={styles.stepContent}>
          {/* IDENTITAS */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <BookOpen size={18} color="#3b82f6" />
              <h3>Identitas Modul</h3>
            </div>
            <div style={styles.formGrid(isMobile)}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Mata Pelajaran *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={styles.formSelect}>
                  <option value="">Pilih Mapel...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Judul Modul *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Matematika - Kelas 5 SD - Minggu ke-3"
                  style={styles.formInput}
                />
                <small style={{color: '#94a3b8', fontSize: 10}}>Auto-fill: Mapel - Kelas - Minggu ke-X</small>
              </div>
            </div>

            {/* COVER UPLOAD */}
            <div style={{marginTop: 15}}>
              <label style={styles.formLabel}>Cover Modul (Opsional)</label>
              <div style={styles.coverBox}>
                {coverImage ? (
                  <div style={styles.coverPreview}>
                    <img src={coverImage} alt="Cover" style={styles.coverImg} />
                    <button onClick={() => setCoverImage(null)} style={styles.btnRemoveImg}>✕</button>
                  </div>
                ) : (
                  <label style={styles.coverPlaceholder}>
                    <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e)} />
                    <ImageIcon size={30} color="#94a3b8" />
                    <span>Upload Cover</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* MATERI BLOCKS */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <FileText size={18} color="#10b981" />
              <h3>Materi Pembelajaran</h3>
              <span style={{fontSize: 11, color: '#94a3b8', marginLeft: 'auto'}}>{blocks.length} materi</span>
            </div>
            
            {blocks.length === 0 && (
              <div style={styles.emptyState}>
                <FileUp size={40} color="#cbd5e1" />
                <p>Belum ada materi. Klik tombol di bawah untuk menambah.</p>
              </div>
            )}

            {blocks.map((block, idx) => (
              <div key={block.id} style={styles.blockCard}>
                <div style={styles.blockHeader}>
                  <span style={styles.blockBadge(block.type)}>
                    {block.type === 'file' ? '📁 FILE' : block.type === 'video' ? '🔗 LINK' : '📄 TEKS'}
                  </span>
                  <button onClick={() => removeBlock(block.id)} style={styles.btnRemove}><X size={14} /></button>
                </div>
                <input 
                  placeholder="Judul materi..." 
                  value={block.title} 
                  onChange={e => updateBlock(block.id, 'title', e.target.value)}
                  style={styles.blockTitleInput}
                />
                {block.type === 'file' ? (
                  <label style={styles.uploadArea}>
                    <input type="file" accept=".pdf,image/*" hidden onChange={(e) => handleFileUpload(e, block.id)} />
                    <FileUp size={20} color="#3b82f6" />
                    <span>{block.fileName || "Klik untuk Upload PDF/Gambar (Max 50MB)"}</span>
                  </label>
                ) : block.type === 'video' ? (
                  <input 
                    placeholder="Tempel link YouTube, Canva, Google Drive..." 
                    value={block.content} 
                    onChange={e => updateBlock(block.id, 'content', e.target.value)}
                    style={styles.textArea}
                  />
                ) : (
                  <textarea 
                    placeholder="Tulis penjelasan materi..." 
                    value={block.content} 
                    onChange={e => updateBlock(block.id, 'content', e.target.value)}
                    style={styles.textArea}
                  />
                )}
                {/* Preview */}
                {block.content && block.type === 'file' && (
                  <div style={styles.previewMini}>
                    <Eye size={12} /> {block.fileName || 'File terupload'}
                  </div>
                )}
              </div>
            ))}

            {/* TOMBOL TAMBAH MATERI */}
            <div style={styles.addButtons}>
              <button onClick={() => addBlock('text')} style={styles.btnAddType}><Type size={14} /> Teks</button>
              <button onClick={() => addBlock('file')} style={styles.btnAddType}><FileUp size={14} /> File</button>
              <button onClick={() => addBlock('video')} style={styles.btnAddType}><Video size={14} /> Link</button>
            </div>
          </div>

          {/* NAVIGASI */}
          <div style={styles.navButtons}>
            <div></div>
            <button onClick={() => setCurrentStep(2)} style={styles.btnNext}>
              Lanjut ke Tugas & Kuis <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
            {/* 🔥 STEP 2: TUGAS & KUIS */}
            {currentStep === 2 && (
        <div style={styles.stepContent}>
          {/* TUGAS */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <Send size={18} color="#f59e0b" />
              <h3>Tugas Mandiri</h3>
              <button onClick={addTugasBlock} style={styles.btnAddSmall}><Plus size={14} /> Tambah Tugas</button>
            </div>

            {tugasBlocks.length === 0 && (
              <div style={styles.emptyState}>
                <Send size={40} color="#cbd5e1" />
                <p>Opsional. Tambah tugas jika ada PR/latihan.</p>
              </div>
            )}

            {tugasBlocks.map((block) => (
              <div key={block.id} style={styles.tugasCard}>
                <div style={styles.blockHeader}>
                  <span style={styles.blockBadge('assignment')}>📝 TUGAS</span>
                  <button onClick={() => removeTugasBlock(block.id)} style={styles.btnRemove}><X size={14} /></button>
                </div>
                <input 
                  placeholder="Judul tugas..." 
                  value={block.title} 
                  onChange={e => updateTugasBlock(block.id, 'title', e.target.value)}
                  style={styles.blockTitleInput}
                />
                <textarea 
                  placeholder="Instruksi tugas (apa yang harus dikerjakan siswa)..." 
                  value={block.content} 
                  onChange={e => updateTugasBlock(block.id, 'content', e.target.value)}
                  style={styles.textArea}
                />
                {/* DEADLINE */}
                <div style={styles.deadlineRow}>
                  <Clock size={14} color="#f59e0b" />
                  <span style={{fontSize: 12, fontWeight: 700, color: '#b45309'}}>Deadline:</span>
                  <input 
                    type="datetime-local" 
                    value={block.endTime} 
                    onChange={e => updateTugasBlock(block.id, 'endTime', e.target.value)}
                    style={styles.deadlineInput}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* KUIS */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <HelpCircle size={18} color="#8b5cf6" />
              <h3>Evaluasi Kuis</h3>
            </div>

            <div style={styles.quizInfo}>
              {quizData?.length > 0 ? (
                <div style={styles.quizReady}>
                  <CheckCircle size={20} color="#10b981" />
                  <span>🔥 {quizData.length} Soal Siap</span>
                  <button onClick={() => {
                    if (!editId) return alert("Simpan dulu modul ini (Langkah 3) sebelum membuat kuis!");
                    navigate(`/guru/manage-quiz?modulId=${editId}`);
                  }} style={styles.btnEditQuiz}>
                    Edit Kuis
                  </button>
                </div>
              ) : (
                <div style={styles.quizEmpty}>
                  <HelpCircle size={20} color="#94a3b8" />
                  <span>Belum ada soal kuis.</span>
                  <button onClick={() => alert("Simpan dulu modul ini (Langkah 3) lalu buat kuis.")} style={styles.btnCreateQuiz}>
                    + Buat Kuis
                  </button>
                </div>
              )}
            </div>

            {/* DEADLINE KUIS */}
            <div style={{marginTop: 15}}>
              <label style={styles.formLabel}>Deadline Kuis</label>
              <input 
                type="datetime-local" 
                value={deadlineQuiz} 
                onChange={e => setDeadlineQuiz(e.target.value)}
                style={styles.formInput}
              />
            </div>
          </div>

          {/* NAVIGASI */}
          <div style={styles.navButtons}>
            <button onClick={() => setCurrentStep(1)} style={styles.btnPrev}>
              <ChevronLeft size={16} /> Kembali
            </button>
            <button onClick={() => setCurrentStep(3)} style={styles.btnNext}>
              Lanjut ke Target & Terbitkan <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 🔥 STEP 3: TARGET & PUBLIKASI */}
      {currentStep === 3 && (
        <div style={styles.stepContent}>
          {/* TARGET */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <Target size={18} color="#ef4444" />
              <h3>Target & Penjadwalan</h3>
            </div>
            <div style={styles.formGrid(isMobile)}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Program</label>
                <select value={targetKategori} onChange={e => setTargetKategori(e.target.value)} style={styles.formSelect}>
                  <option value="Semua">Semua Program</option>
                  <option value="Reguler">📚 Reguler</option>
                  <option value="English">🗣️ English</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Kelas</label>
                <select value={targetKelas} onChange={e => setTargetKelas(e.target.value)} style={styles.formSelect}>
                  <option value="Semua">Semua Kelas</option>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Minggu Ke-</label>
                <input type="number" min="1" max="52" value={mingguKe} onChange={e => setMingguKe(e.target.value)} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tahun Ajaran</label>
                <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} style={styles.formInput} placeholder="2025/2026" />
              </div>
            </div>

            {/* STATUS */}
            <div style={{marginTop: 15}}>
              <label style={styles.formLabel}>Status Modul</label>
              <div style={styles.statusButtons}>
                {STATUS_OPTIONS.map(opt => (
                  <button 
                    key={opt.value}
                    onClick={() => setStatusModul(opt.value)}
                    style={styles.statusBtn(statusModul === opt.value, opt.color)}
                  >
                    {statusModul === opt.value && <CheckCircle size={14} />}
                    {opt.label}
                  </button>
                ))}
              </div>
              <small style={{color: '#94a3b8', fontSize: 10, marginTop: 5, display: 'block'}}>
                🟢 Aktif = muncul di siswa. 🟡 Terjadwal = minggu depan. 📦 Arsip = tersembunyi.
              </small>
            </div>

            {/* TANGGAL */}
            <div style={{...styles.formGrid(isMobile), marginTop: 15}}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tanggal Mulai</label>
                <input type="date" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tanggal Selesai</label>
                <input type="date" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} style={styles.formInput} />
              </div>
            </div>
          </div>

          {/* RINGKASAN */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <CheckCircle size={18} color="#10b981" />
              <h3>Ringkasan Modul</h3>
            </div>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}><BookOpen size={14} /> {subject || '-'}</div>
              <div style={styles.summaryItem}><FileText size={14} /> {title || '-'}</div>
              <div style={styles.summaryItem}><Users size={14} /> {targetKategori} / {targetKelas}</div>
              <div style={styles.summaryItem}><FileUp size={14} /> {blocks.length + tugasBlocks.length} Materi</div>
              <div style={styles.summaryItem}><HelpCircle size={14} /> {quizData?.length || 0} Soal Kuis</div>
              <div style={styles.summaryItem}><Calendar size={14} /> Minggu ke-{mingguKe} ({tahunAjaran})</div>
              <div style={styles.summaryItem}><Target size={14} /> Status: {STATUS_OPTIONS.find(o => o.value === statusModul)?.label || statusModul}</div>
            </div>
          </div>

          {/* TOMBOL SIMPAN */}
          <div style={styles.navButtons}>
            <button onClick={() => setCurrentStep(2)} style={styles.btnPrev}>
              <ChevronLeft size={16} /> Kembali
            </button>
            <button onClick={handleSave} disabled={loading} style={styles.btnPublish}>
              <Save size={18} /> {loading ? 'Menyimpan...' : editId ? '💾 Update Modul' : '🚀 Terbitkan Modul'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: (m) => ({ padding: m ? '15px' : '30px', paddingBottom: 150, background: '#f8fafc', minHeight: '100vh', maxWidth: 900, margin: '0 auto', marginLeft: m ? 0 : '260px', transition: 'margin-left 0.3s ease' }),
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  btnBack: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: m ? '8px 12px' : '10px 15px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: m ? 12 : 14, display: 'flex', alignItems: 'center', gap: 6 }),
  headerTitle: (m) => ({ margin: 0, fontSize: m ? 18 : 22, fontWeight: 800, color: '#1e293b' }),
  
  // PROGRESS
  progressContainer: { marginBottom: 30 },
  progressBar: { height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 15 },
  progressFill: { height: '100%', background: '#3b82f6', borderRadius: 3, transition: 'width 0.3s ease' },
  stepsIndicator: (m) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: m ? 4 : 10 }),
  stepDot: (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: active ? 1 : 0.4, transition: '0.3s' }),
  stepNum: { width: 30, height: 30, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 },
  stepLabel: (m) => ({ fontSize: m ? 9 : 11, fontWeight: 700, color: '#64748b', marginTop: 4, textAlign: 'center' }),
  stepLine: (active) => ({ flex: 1, height: 3, background: active ? '#3b82f6' : '#e2e8f0', transition: '0.3s', maxWidth: 60 }),
  
  stepContent: { display: 'flex', flexDirection: 'column', gap: 20 },
  
  // SECTION CARD
  sectionCard: { background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 },
  
  // FORM
  formGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 15 }),
  formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  formLabel: { fontSize: 12, fontWeight: 700, color: '#64748b' },
  formInput: { padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
  formSelect: { padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'white' },
  
  // COVER
  coverBox: { height: 140, borderRadius: 14, border: '2px dashed #e2e8f0', overflow: 'hidden' },
  coverPreview: { position: 'relative', width: '100%', height: '100%' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  btnRemoveImg: { position: 'absolute', top: 8, right: 8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 8, color: '#94a3b8' },
  
  // BLOCKS
  emptyState: { textAlign: 'center', padding: 30, color: '#94a3b8' },
  blockCard: { border: '1px solid #f1f5f9', borderRadius: 14, padding: 15, marginBottom: 12, background: '#fafcfd' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  blockBadge: (type) => ({ fontSize: 10, fontWeight: 800, color: type === 'assignment' ? '#f59e0b' : '#3b82f6', background: type === 'assignment' ? '#fef3c7' : '#e0e7ff', padding: '4px 10px', borderRadius: 8 }),
  btnRemove: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: 4, borderRadius: 6, cursor: 'pointer' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: 16, fontWeight: 700, outline: 'none', marginBottom: 10, padding: '8px 0', color: '#1e293b' },
  uploadArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '15px 20px', border: '2px dashed #e2e8f0', borderRadius: 12, cursor: 'pointer', background: '#f8fafc', fontSize: 13, color: '#64748b' },
  textArea: { width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  previewMini: { marginTop: 8, padding: '6px 10px', background: '#f0fdf4', borderRadius: 6, fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 },
  addButtons: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 15 },
  btnAddType: { flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#64748b' },
  
  // TUGAS
  tugasCard: { border: '1px solid #fef3c7', borderRadius: 14, padding: 15, marginBottom: 12, background: '#fffdf5' },
  deadlineRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  deadlineInput: { padding: '6px 10px', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, outline: 'none' },
  
  // QUIZ
  quizInfo: { padding: 15, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9' },
  quizReady: { display: 'flex', alignItems: 'center', gap: 10 },
  quizEmpty: { display: 'flex', alignItems: 'center', gap: 10 },
  btnEditQuiz: { marginLeft: 'auto', background: '#e0e7ff', color: '#3730a3', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  btnCreateQuiz: { marginLeft: 'auto', background: '#3b82f6', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  btnAddSmall: { background: '#fef3c7', color: '#b45309', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  
  // STATUS
  statusButtons: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  statusBtn: (active, color) => ({ flex: 1, minWidth: '140px', padding: '10px 12px', borderRadius: 10, border: active ? `2px solid ${color}` : '1px solid #e2e8f0', background: active ? `${color}10` : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', color: active ? color : '#64748b' }),
  
  // SUMMARY
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 },
  summaryItem: { padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 600 },
  
  // NAVIGATION
  navButtons: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },
  btnPrev: { background: 'white', border: '1px solid #e2e8f0', padding: '12px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  btnNext: { background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 },
  btnPublish: { background: '#10b981', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
};

export default ManageMateri;