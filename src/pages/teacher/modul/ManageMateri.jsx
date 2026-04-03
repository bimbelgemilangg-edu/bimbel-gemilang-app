import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, addDoc, doc, getDoc, updateDoc, 
  serverTimestamp, getDocs 
} from "firebase/firestore"; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression'; 
import { 
  Save, Trash2, FileText, HelpCircle, Clock, 
  ArrowLeft, Upload, Calendar, Link as LinkIcon, 
  Users, Search, Eye, Sparkles, FileUp, Layout
} from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [releaseDate, setReleaseDate] = useState(""); 
  const [coverImage, setCoverImage] = useState(null);
  const [blocks, setBlocks] = useState([]); 
  const [quizData, setQuizData] = useState([]); 
  const [loading, setLoading] = useState(false);

  const [targetKategori, setTargetKategori] = useState("Semua"); 
  const [targetKelas, setTargetKelas] = useState("Semua"); 
  const [targetSiswaId, setTargetSiswaId] = useState("Semua"); 
  const [studentSearch, setStudentSearch] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  
  const COLLECTION_NAME = "bimbel_modul";

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
        const classes = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setAvailableClasses(classes);
      } catch (err) { console.error("Error context:", err); }
    };
    fetchContextData();
  }, []);

  useEffect(() => {
    if (editId) fetchModulData();
  }, [editId]);

  const fetchModulData = async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, editId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || "");
        setSubject(data.subject || "");
        setReleaseDate(data.releaseDate || "");
        setCoverImage(data.coverImage || null);
        setBlocks(data.blocks || []);
        setQuizData(data.quizData || []);
        setTargetKategori(data.targetKategori || "Semua");
        setTargetKelas(data.targetKelas || "Semua");
        setTargetSiswaId(data.targetSiswaId || "Semua");
      }
    } catch (err) { console.error("Error fetching:", err); }
  };

  const handleFileUpload = async (e, blockId = null) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
    try {
      let finalData;
      if (isImage) {
        const compressed = await imageCompression(file, options);
        finalData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(compressed);
        });
      } else {
        finalData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }
      if (blockId) {
        updateBlock(blockId, 'content', finalData);
        updateBlock(blockId, 'fileName', file.name);
      } else {
        setCoverImage(finalData);
      }
    } catch (err) { alert("Upload gagal: " + err.message); }
  };

  const formatExternalLink = (url) => {
    if (typeof url !== 'string') return url;
    if (url.includes('canva.com') && url.includes('/edit')) return url.split('?')[0].replace('/edit', '/view?embed');
    if (url.includes('drive.google.com') && url.includes('/view')) return url.replace('/view', '/preview');
    return url;
  };

  const addBlock = (type) => {
    const newBlock = { 
      id: Date.now(), type, content: "", fileName: "",
      title: type === 'assignment' ? "TUGAS: INSTRUKSI" : type === 'file' ? "LAMPIRAN FILE" : "SUB-MATERI BARU",
      hasDeadline: false, startTime: "", endTime: ""
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, field, value) => {
    const finalValue = field === 'content' ? formatExternalLink(value) : value;
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: finalValue } : b));
  };

  const removeBlock = (id) => {
    if(window.confirm("Hapus bagian ini?")) setBlocks(blocks.filter(b => b.id !== id));
  };

  const handleSave = async () => {
    if (!title || !subject) return alert("Judul dan Mata Pelajaran wajib diisi!");
    setLoading(true);
    const payload = {
      title: title.toUpperCase(), subject: subject.toUpperCase(),
      releaseDate, coverImage, blocks, quizData,
      targetKategori, targetKelas, targetSiswaId,
      authorName: localStorage.getItem('userName') || "Admin Guru",
      updatedAt: serverTimestamp(),
      deadlineTugas: blocks.find(b => b.type === 'assignment')?.endTime || "",
      deadlineQuiz: quizData[0]?.endTime || ""
    };
    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
        alert("🚀 MODUL BERHASIL DIPERBARUI!");
      } else {
        payload.createdAt = serverTimestamp();
        const newDoc = await addDoc(collection(db, COLLECTION_NAME), payload);
        alert("🚀 MODUL BARU BERHASIL DIPUBLISH!");
        navigate(`/guru/modul/materi?edit=${newDoc.id}`); // Tetap di halaman edit setelah simpan baru
      }
    } catch (error) { alert("Gagal menyimpan: " + error.message); }
    setLoading(false);
  };

  const filteredStudents = studentsList.filter(s => {
    const matchesSearch = (s.nama || "").toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = targetKelas === "Semua" || s.kelasSekolah === targetKelas;
    return matchesSearch && matchesClass;
  });

  const renderSmartPreview = (content) => {
    if (!content || typeof content !== 'string') return null;
    const isBase64 = content.startsWith('data:');
    const isPDF = content.includes('application/pdf');
    if (isBase64) {
      return isPDF ? (
        <embed src={content} type="application/pdf" style={st.iframePreview(isMobile)} />
      ) : (
        <img src={content} alt="Preview" style={st.imgPreview(isMobile)} />
      );
    }
    if (content.includes('canva.com') || content.includes('youtube.com') || content.includes('drive.google.com')) {
      return <iframe src={content} style={st.iframePreview(isMobile)} title="Preview" allowFullScreen />;
    }
    return null;
  };

  return (
    <div className="main-content-wrapper" style={{ marginLeft: isMobile ? 0 : '260px', transition: '0.3s' }}>
      <div className="teacher-container-padding" style={{ padding: isMobile ? '15px' : '30px', paddingBottom: '150px' }}>
        
        <div style={st.topBar}>
          <div style={st.breadCrumb}>Modul / <span style={{color:'#673ab7'}}>{editId ? "Edit Materi Mingguan" : "Baru"}</span></div>
          <div style={{display:'flex', gap: 8}}>
            <button onClick={() => navigate('/guru/modul')} style={st.btnBack(isMobile)}><ArrowLeft size={14}/> {!isMobile && "Kembali"}</button>
            <button onClick={handleSave} disabled={loading} className="teacher-btn-primary" style={st.btnPublish(isMobile)}>
              <Save size={16}/> {loading ? "..." : isMobile ? "SIMPAN" : "SIMPAN MODUL"}
            </button>
          </div>
        </div>

        <div className="teacher-card" style={st.formCard(isMobile)}>
          <div style={st.sectionHeader}><Sparkles size={18} color="#673ab7"/> Sampul & Identitas</div>
          <div style={st.coverGrid(isMobile)}>
            <div style={st.coverUploadBox}>
              {coverImage ? (
                <div style={st.coverPreviewWrapper}>
                  <img src={coverImage} alt="Preview" style={st.coverImage} />
                  <button onClick={() => setCoverImage(null)} style={st.btnRemoveCover}><Trash2 size={14}/></button>
                </div>
              ) : (
                <label style={st.coverPlaceholder}>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e)} />
                  <div style={st.uploadCircle}><Upload size={20} color="#673ab7" /></div>
                  <span style={st.uploadText}>SAMPUL</span>
                </label>
              )}
            </div>
            <div style={st.identityInputs}>
              <input placeholder="JUDUL MATERI MINGGUAN..." style={st.mainInput(isMobile)} value={title} onChange={(e) => setTitle(e.target.value)} />
              <input placeholder="Mata Pelajaran..." style={st.subInput} value={subject} onChange={(e) => setSubject(e.target.value)} />
              <div style={st.globalDateRow}>
                 <Calendar size={12} color="#673ab7"/>
                 <input type="datetime-local" style={st.cleanDateInput} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={st.sectionHeader}><Users size={18} color="#673ab7"/> Target Siswa</div>
          <div style={st.targetGrid(isMobile)}>
             <select className="teacher-input" value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)}>
                <option value="Semua">Semua Program</option>
                <option value="Reguler">Reguler</option>
                <option value="English">English</option>
             </select>
             <select className="teacher-input" value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)}>
                <option value="Semua">Semua Kelas</option>
                {availableClasses.map(kls => <option key={kls} value={kls}>{kls}</option>)}
             </select>
          </div>

          <div style={st.divider} />

          <div style={st.sectionHeader}><FileText size={18} color="#673ab7"/> Konten Modul (PPT/Materi/Tugas)</div>
          {blocks.map((block) => (
            <div key={block.id} style={st.blockCard}>
              <div style={st.blockHeader}>
                <div style={st.typeBadge}>{block.type.toUpperCase()}</div>
                <button onClick={() => removeBlock(block.id)} style={st.btnTrash}><Trash2 size={16}/></button>
              </div>
              <input placeholder="Judul Bagian..." style={st.blockTitleInput} value={block.title} onChange={(e) => updateBlock(block.id, 'title', e.target.value)} />
              
              {block.type === 'file' ? (
                <div style={st.fileUploadArea}>
                  <input type="file" id={`f-${block.id}`} hidden onChange={(e) => handleFileUpload(e, block.id)} />
                  <label htmlFor={`f-${block.id}`} style={st.fileLabel}>
                    <FileUp size={20} /> {block.fileName || "Upload PPT atau PDF Materi"}
                  </label>
                </div>
              ) : (
                <textarea 
                  placeholder={block.type === 'video' ? "Link Canva/YT/Drive..." : "Isi deskripsi materi..."} 
                  className="teacher-input" style={st.textArea} value={block.content} 
                  onChange={(e) => updateBlock(block.id, 'content', e.target.value)} 
                />
              )}

              {block.content && (
                <div style={st.smartPreview}>
                  <div style={st.previewLabel}><Eye size={12}/> Preview Konten</div>
                  {renderSmartPreview(block.content)}
                </div>
              )}

              {block.type === 'assignment' && (
                <div style={st.deadlineBox}>
                  <div style={st.deadlineCheckRow}>
                    <input type="checkbox" checked={block.hasDeadline} onChange={(e) => updateBlock(block.id, 'hasDeadline', e.target.checked)} />
                    <span>Aktifkan Deadline Tugas</span>
                  </div>
                  {block.hasDeadline && (
                    <div style={st.deadlineFlex(isMobile)}>
                      <input type="datetime-local" className="teacher-input" style={st.dateInputMini} value={block.startTime} onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)} />
                      <input type="datetime-local" className="teacher-input" style={st.dateInputMini} value={block.endTime} onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* --- BAGIAN KUIS BARU: TERHUBUNG KE MANAGE QUIZ --- */}
          <div style={st.quizSection}>
            <div style={st.sectionHeader}>
              <HelpCircle size={18} color="#673ab7"/> 
              <span style={{fontWeight:'800', color:'#1e293b'}}>Evaluasi Kuis Mingguan</span>
            </div>

            <div style={st.quizStatusCard(isMobile)}>
              <div style={{flex: 1}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '14px', fontWeight: '900'}}>
                  {quizData && quizData.length > 0 
                    ? `Tersedia ${quizData.length} Soal Kuis` 
                    : "Belum Ada Soal Kuis"}
                </h4>
                <p style={{margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500'}}>
                  {quizData && quizData.length > 0 
                    ? "Kelola pertanyaan melalui editor khusus agar input lebih lancar." 
                    : "Tambahkan kuis evaluasi khusus untuk materi minggu ini."}
                </p>
              </div>

              <button 
                type="button"
                onClick={() => {
                  if (!editId) return alert("Simpan Materi (Publish) terlebih dahulu agar bisa membuat kuis!");
                  navigate(`/guru/manage-quiz?modulId=${editId}`);
                }} 
                style={st.btnManageQuiz}
              >
                <Layout size={16}/> {quizData && quizData.length > 0 ? "Edit Soal Kuis" : "Mulai Buat Kuis"}
              </button>
            </div>
          </div>

          <div style={st.fabBar(isMobile)}>
            {!isMobile && <span style={st.fabLabel}>TAMBAH KONTEN:</span>}
            <button onClick={() => addBlock('text')} style={st.fab} title="Teks"><FileText size={16}/></button>
            <button onClick={() => addBlock('file')} style={st.fab} title="PPT/PDF"><FileUp size={16}/></button>
            <button onClick={() => addBlock('video')} style={st.fab} title="Link Video/Canva"><LinkIcon size={16}/></button>
            <button onClick={() => addBlock('assignment')} style={st.fab} title="Tugas"><Clock size={16}/></button>
            <div style={st.fabDivider} />
            <button onClick={handleSave} style={st.btnSaveFab(isMobile)}>{loading ? "..." : "SIMPAN MODUL"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const st = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  breadCrumb: { fontSize: '12px', fontWeight: '800', color: '#94a3b8' },
  btnBack: (m) => ({ padding: m ? '8px' : '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 'bold' }),
  btnPublish: (m) => ({ padding: m ? '8px 15px' : '12px 25px', borderRadius: '12px', fontWeight: '900', background:'#673ab7', color:'#fff', border:'none' }),
  formCard: (m) => ({ padding: m ? '20px' : '40px', borderRadius: '24px', background: '#fff' }),
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', fontWeight: '900', marginBottom: '20px', marginTop: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' },
  coverGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '200px 1fr', gap: '20px', marginBottom: '30px' }),
  coverUploadBox: { height: '150px', borderRadius: '18px', background: '#f8fafc', border: '2px dashed #cbd5e1', position:'relative' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  uploadCircle: { background:'#fff', padding:10, borderRadius:'50%', marginBottom:8 },
  uploadText: { fontSize: 9, fontWeight:'900', color:'#673ab7' },
  coverImage: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' },
  btnRemoveCover: { position: 'absolute', top: 8, right: 8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '5px' },
  mainInput: (m) => ({ border: 'none', fontSize: m ? '1.4rem' : '2rem', fontWeight: '900', outline: 'none', width: '100%' }),
  subInput: { border: 'none', fontSize: '14px', outline: 'none', color: '#64748b', width: '100%' },
  globalDateRow: { display:'flex', alignItems:'center', gap:8, marginTop:10, background:'#f1f5f9', padding:'6px 12px', borderRadius:'10px', width:'fit-content' },
  cleanDateInput: { border:'none', background:'transparent', fontSize:'11px', outline:'none', fontWeight:'bold' },
  targetGrid: (m) => ({ display:'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap:'15px' }),
  divider: { height: '2px', background: '#f1f5f9', margin: '30px 0' },
  blockCard: { border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '20px' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  typeBadge: { fontSize: '9px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '4px 10px', borderRadius: '8px' },
  btnTrash: { background: '#fff1f2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '10px' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '16px', fontWeight: '900', outline: 'none', marginBottom: '12px' },
  textArea: { width: '100%', minHeight: '100px', borderRadius: '15px', padding: '15px', fontSize: '14px', border:'1px solid #f1f5f9' },
  fileUploadArea: { padding: '20px', border: '2px dashed #e2e8f0', borderRadius: '15px', textAlign: 'center' },
  fileLabel: { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: '800', fontSize: '13px' },
  smartPreview: { marginTop: '15px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  previewLabel: { background: '#1e293b', padding: '6px 15px', fontSize: '9px', fontWeight: '800', color:'#fff' },
  iframePreview: (m) => ({ width: '100%', height: m ? '250px' : '400px', border: 'none' }),
  imgPreview: (m) => ({ width: '100%', maxHeight: m ? '300px' : '500px', objectFit: 'contain' }),
  deadlineBox: { marginTop: '15px', padding: '15px', background: '#fffbeb', borderRadius: '15px' },
  deadlineCheckRow: { display:'flex', alignItems:'center', gap:8, fontSize: '12px', fontWeight: '800' },
  deadlineFlex: (m) => ({ display: 'flex', gap: '10px', marginTop: '10px', flexDirection: m ? 'column' : 'row' }),
  dateInputMini: { fontSize: '11px', padding: '8px', border:'1px solid #ddd', borderRadius:'8px' },
  quizSection: { marginTop: '30px', borderTop: '2px dashed #f1f5f9', paddingTop: '20px' },
  quizStatusCard: (m) => ({ 
    display: 'flex', 
    flexDirection: m ? 'column' : 'row',
    alignItems: m ? 'flex-start' : 'center', 
    justifyContent: 'space-between', 
    background: '#f8fafc', 
    padding: '20px', 
    borderRadius: '16px', 
    border: '1px solid #e2e8f0',
    marginTop: '10px',
    gap: m ? '15px' : '0'
  }),
  btnManageQuiz: { 
    background: '#673ab7', 
    color: 'white', 
    border: 'none', 
    padding: '12px 20px', 
    borderRadius: '10px', 
    fontWeight: '800', 
    fontSize: '12px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8,
    boxShadow: '0 4px 10px rgba(103, 58, 183, 0.2)'
  },
  fabBar: (m) => ({ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', background: '#1e293b', padding: '10px', borderRadius: '20px', alignItems: 'center', zIndex: 9999, width: m ? '95%' : 'auto', justifyContent: 'center' }),
  fabLabel: { fontSize: '9px', fontWeight: '900', color: '#94a3b8', marginRight: 5 },
  fab: { background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '12px' },
  fabDivider: { width:'1px', height:'20px', background:'rgba(255,255,255,0.1)' },
  btnSaveFab: (m) => ({ background: '#673ab7', color: 'white', border: 'none', padding: m ? '10px 15px' : '10px 20px', borderRadius: '12px', fontWeight: '900', fontSize:'12px' })
};

export default ManageMateri;