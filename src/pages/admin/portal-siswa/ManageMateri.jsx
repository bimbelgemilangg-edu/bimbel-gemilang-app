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
  Users, Eye, Sparkles, FileUp, Layout, Type, Video, Plus
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

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return alert("❌ File terlalu besar! Maksimal 50MB.");
    }

    try {
      // Konversi ke Base64 dulu
      const base64 = await convertBase64(file);
      
      // Upload ke Supabase
      const { uploadToDrive } = await import('../../../services/uploadService');
      const result = await uploadToDrive(base64, file.name, file.type);
      
      if (result.success) {
        if (blockId) {
          setBlocks(blocks.map(b => b.id === blockId ? { 
            ...b, 
            content: result.downloadURL, 
            fileName: file.name,
            mimeType: file.type,
            fileUrl: result.downloadURL,
            filePath: result.filePath
          } : b));
        } else {
          setCoverImage(result.downloadURL);
        }
        alert("✅ File berhasil diupload ke Supabase Storage!");
      } else {
        throw new Error(result.error || "Upload gagal");
      }
      
    } catch (err) { 
      alert("❌ Gagal upload: " + err.message); 
    }
  };

  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const formatExternalLink = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('canva.com') && url.includes('/edit')) return url.split('?')[0].replace('/edit', '/view?embed');
    if (url.includes('drive.google.com') && url.includes('/view')) return url.replace('/view', '/preview');
    return url;
  };

  const addBlock = (type) => {
    const newBlock = { 
      id: Date.now(), 
      type, 
      content: "", 
      fileName: "",
      mimeType: "",
      title: type === 'assignment' ? "INSTRUKSI TUGAS" : type === 'file' ? "MODUL PDF/GAMBAR" : "SUB-MATERI BARU",
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
        alert("✅ MODUL BERHASIL DIPERBARUI!");
      } else {
        payload.createdAt = serverTimestamp();
        const newDoc = await addDoc(collection(db, COLLECTION_NAME), payload);
        alert("✅ MODUL BARU BERHASIL DIPUBLISH!");
        navigate(`/guru/modul/materi?edit=${newDoc.id}`);
      }
    } catch (error) { alert("Gagal menyimpan: " + error.message); }
    setLoading(false);
  };
  const renderSmartPreview = (block) => {
    const { content, mimeType, fileName } = block;
    if (!content) return null;

    if (mimeType === 'application/pdf' || content?.toLowerCase().includes('.pdf') || content?.includes('supabase')) {
      const embedSrc = `https://docs.google.com/viewer?url=${encodeURIComponent(content)}&embedded=true`;
      return (
        <div style={st.smartPreview}>
          <div style={st.previewLabel}><Eye size={12}/> PRATINJAU PDF</div>
          <iframe src={embedSrc} style={st.iframePreview(isMobile)} title="PDF Preview" allowFullScreen />
          <a href={content} target="_blank" rel="noreferrer" style={{display:'block', padding:10, textAlign:'center', background:'#f8fafc', color:'#673ab7', fontWeight:'bold', textDecoration:'none'}}>
            📄 Buka PDF di Tab Baru
          </a>
        </div>
      );
    }

    if (content.startsWith('data:image/') || content?.includes('supabase')) {
      return (
        <div style={st.smartPreview}>
          <div style={st.previewLabel}><Eye size={12}/> PRATINJAU GAMBAR</div>
          <img src={content} alt="Preview" style={st.imgPreview(isMobile)} />
        </div>
      );
    }

    if (content.includes('canva.com') || content.includes('youtube.com') || content.includes('drive.google.com')) {
      return (
        <div style={st.smartPreview}>
          <div style={st.previewLabel}><Eye size={12}/> PRATINJAU LINK</div>
          <iframe src={content} style={st.iframePreview(isMobile)} title="Preview" allowFullScreen />
        </div>
      );
    }

    return (
      <div style={st.pdfPreviewPlaceholder}>
        <FileText size={40} color="#673ab7" />
        <p style={{fontSize:12, fontWeight:'800', marginTop:10}}>DOKUMEN PDF SIAP DIUNDUH SISWA</p>
        <small>{fileName}</small>
      </div>
    );
  };

  return (
    <div className="main-content-wrapper" style={{ marginLeft: isMobile ? 0 : '260px', transition: '0.3s', background:'#f4f7fe' }}>
      <div className="teacher-container-padding" style={{ padding: isMobile ? '15px' : '30px', paddingBottom: '150px' }}>
        
        <div style={st.topBar}>
          <div>
            <div style={st.breadCrumb}>MODUL SISTEM / <span style={{color:'#673ab7'}}>{editId ? "PENGATURAN MATERI" : "BUAT BARU"}</span></div>
            <h2 style={{margin:0, fontWeight:900, fontSize:isMobile ? '18px' : '24px'}}>Manajemen Materi</h2>
          </div>
          <div style={{display:'flex', gap: 10}}>
            <button onClick={() => navigate('/guru/modul')} style={st.btnBack(isMobile)}><ArrowLeft size={16}/></button>
            <button onClick={handleSave} disabled={loading} style={st.btnPublish(isMobile)}>
               {loading ? "..." : <><Save size={18}/> <span>SIMPAN</span></>}
            </button>
          </div>
        </div>

        <div className="teacher-card" style={st.formCard(isMobile)}>
          
          <div style={st.sectionHeader}><Sparkles size={18} color="#673ab7"/> IDENTITAS & SAMPUL</div>
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
                  <span style={st.uploadText}>UPLOAD SAMPUL</span>
                </label>
              )}
            </div>
            <div style={st.identityInputs}>
              <input placeholder="TULIS JUDUL MATERI DI SINI..." style={st.mainInput(isMobile)} value={title} onChange={(e) => setTitle(e.target.value)} />
              <input placeholder="Mata Pelajaran (Contoh: Matematika, B. Inggris)" style={st.subInput} value={subject} onChange={(e) => setSubject(e.target.value)} />
              <div style={st.globalDateRow}>
                 <Calendar size={14} color="#673ab7"/>
                 <input type="datetime-local" style={st.cleanDateInput} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={st.sectionHeader}><Users size={18} color="#673ab7"/> PENGATURAN TARGET SISWA</div>
          <div style={st.targetGrid(isMobile)}>
             <div style={st.inputWrapper}>
                <label style={st.label}>Program Belajar</label>
                <select style={st.select} value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)}>
                    <option value="Semua">Semua Program</option>
                    <option value="Reguler">Reguler</option>
                    <option value="English">English</option>
                </select>
             </div>
             <div style={st.inputWrapper}>
                <label style={st.label}>Tingkat Kelas</label>
                <select style={st.select} value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)}>
                    <option value="Semua">Semua Kelas</option>
                    {availableClasses.map(kls => <option key={kls} value={kls}>{kls}</option>)}
                </select>
             </div>
          </div>

          <div style={st.divider} />

          <div style={st.sectionHeader}><FileText size={18} color="#673ab7"/> KONTEN PEMBELAJARAN</div>
          
          {blocks.length === 0 && (
            <div style={st.emptyState}>
                <Layout size={40} color="#cbd5e1" />
                <p>Belum ada materi. Gunakan tombol di bawah untuk menambah teks, file, atau video.</p>
            </div>
          )}

          {blocks.map((block) => (
            <div key={block.id} style={st.blockCard}>
              <div style={st.blockHeader}>
                <div style={st.typeBadge(block.type)}>{block.type === 'file' ? '📁 FILE/MODUL' : block.type === 'video' ? '🔗 LINK/VIDEO' : block.type === 'assignment' ? '📝 TUGAS' : '📄 TEKS'}</div>
                <button onClick={() => removeBlock(block.id)} style={st.btnTrash}><Trash2 size={16}/></button>
              </div>
              
              <input placeholder="Judul Bagian (Contoh: Pengenalan Aljabar)" style={st.blockTitleInput} value={block.title} onChange={(e) => updateBlock(block.id, 'title', e.target.value)} />
              
              {block.type === 'file' ? (
                <div style={st.fileUploadArea}>
                  <input type="file" id={`f-${block.id}`} accept=".pdf,image/*" hidden onChange={(e) => handleFileUpload(e, block.id)} />
                  <label htmlFor={`f-${block.id}`} style={st.fileLabel}>
                    <FileUp size={24} color="#673ab7" /> 
                    <div style={{textAlign:'left'}}>
                        <div style={{fontWeight:900, fontSize:14}}>{block.fileName || "Klik untuk Upload PDF/Gambar"}</div>
                        <div style={{fontSize:11, color:'#64748b'}}>Maksimal ukuran file: 50MB</div>
                    </div>
                  </label>
                </div>
              ) : (
                <textarea 
                  placeholder={block.type === 'video' ? "Tempel Link Canva, YouTube, atau Google Drive di sini..." : "Tuliskan penjelasan materi secara detail..."} 
                  style={st.textArea} value={block.content} 
                  onChange={(e) => updateBlock(block.id, 'content', e.target.value)} 
                />
              )}

              {block.content && renderSmartPreview(block)}

              {block.type === 'assignment' && (
                <div style={st.deadlineBox}>
                  <div style={st.deadlineCheckRow}>
                    <input type="checkbox" checked={block.hasDeadline} onChange={(e) => updateBlock(block.id, 'hasDeadline', e.target.checked)} />
                    <span style={{fontWeight:900}}>Aktifkan Batas Waktu (Deadline)</span>
                  </div>
                  {block.hasDeadline && (
                    <div style={st.deadlineFlex(isMobile)}>
                      <div style={{flex:1}}>
                        <label style={st.miniLabel}>Mulai Tugas</label>
                        <input type="datetime-local" style={st.dateInputMini} value={block.startTime} onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)} />
                      </div>
                      <div style={{flex:1}}>
                        <label style={st.miniLabel}>Batas Akhir</label>
                        <input type="datetime-local" style={st.dateInputMini} value={block.endTime} onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div style={st.quizSection}>
            <div style={st.sectionHeader}><HelpCircle size={18} color="#673ab7"/> EVALUASI KUIS</div>
            <div style={st.quizStatusCard(isMobile)}>
              <div style={{flex: 1}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '14px', fontWeight: '900'}}>
                  {quizData?.length > 0 ? `🔥 ${quizData.length} Pertanyaan Aktif` : "Kuis Belum Dibuat"}
                </h4>
                <p style={{margin: 0, fontSize: '12px', color: '#64748b'}}>Siswa akan mengerjakan kuis ini setelah membaca materi di atas.</p>
              </div>
              <button onClick={() => {
                  if (!editId) return alert("Simpan Materi dahulu agar sistem bisa membuat ID Kuis!");
                  navigate(`/guru/manage-quiz?modulId=${editId}`);
                }} style={st.btnManageQuiz}>
                <Layout size={16}/> {quizData?.length > 0 ? "EDIT KUIS" : "BUAT KUIS SEKARANG"}
              </button>
            </div>
          </div>

          <div style={st.fabBar(isMobile)}>
            <div style={st.fabGroup}>
                <button onClick={() => addBlock('text')} style={st.toolBtn}><Type size={18}/><span>Teks</span></button>
                <button onClick={() => addBlock('file')} style={st.toolBtn}><FileUp size={18}/><span>File</span></button>
                <button onClick={() => addBlock('video')} style={st.toolBtn}><Video size={18}/><span>Link</span></button>
                <button onClick={() => addBlock('assignment')} style={st.toolBtn}><Clock size={18}/><span>Tugas</span></button>
            </div>
            <div style={{width:2, height:30, background:'rgba(255,255,255,0.2)', margin:'0 10px'}} />
            <button onClick={handleSave} style={st.btnSaveFab(isMobile)}>{loading ? "..." : "PUBLISH"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const st = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  breadCrumb: { fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing:1 },
  btnBack: (m) => ({ padding: '12px', borderRadius: '15px', border: '1px solid #e2e8f0', background: 'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }),
  btnPublish: (m) => ({ padding: m ? '12px 20px' : '12px 30px', borderRadius: '15px', fontWeight: '900', background:'#673ab7', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, boxShadow:'0 10px 20px rgba(103, 58, 183, 0.3)' }),
  formCard: (m) => ({ padding: m ? '20px' : '40px', borderRadius: '30px', background: '#fff', boxShadow:'0 4px 30px rgba(0,0,0,0.03)' }),
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, fontSize: '12px', fontWeight: '900', marginBottom: '25px', marginTop: '40px', color:'#1e293b', opacity:0.8 },
  coverGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '220px 1fr', gap: '30px', marginBottom: '30px' }),
  coverUploadBox: { height: '160px', borderRadius: '25px', background: '#f8fafc', border: '2px dashed #cbd5e1', position:'relative', overflow:'hidden' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  uploadCircle: { background:'#fff', padding:12, borderRadius:'18px', marginBottom:10, boxShadow:'0 5px 15px rgba(0,0,0,0.05)' },
  uploadText: { fontSize: 10, fontWeight:'900', color:'#673ab7' },
  coverImage: { width: '100%', height: '100%', objectFit: 'cover' },
  btnRemoveCover: { position: 'absolute', top: 10, right: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', padding: '6px' },
  mainInput: (m) => ({ border: 'none', fontSize: m ? '1.5rem' : '2.2rem', fontWeight: '900', outline: 'none', width: '100%', color:'#1e293b' }),
  subInput: { border: 'none', fontSize: '16px', outline: 'none', color: '#64748b', width: '100%', marginTop:5 },
  globalDateRow: { display:'flex', alignItems:'center', gap:10, marginTop:15, background:'#f8fafc', padding:'8px 15px', borderRadius:'12px', width:'fit-content', border:'1px solid #f1f5f9' },
  cleanDateInput: { border:'none', background:'transparent', fontSize:'12px', outline:'none', fontWeight:'bold', color:'#673ab7' },
  targetGrid: (m) => ({ display:'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap:'20px' }),
  inputWrapper: { display:'flex', flexDirection:'column', gap:8 },
  label: { fontSize:11, fontWeight:900, color:'#94a3b8' },
  select: { padding:'12px', borderRadius:'12px', border:'1px solid #e2e8f0', outline:'none', fontWeight:'bold', fontSize:14 },
  divider: { height: '1px', background: '#f1f5f9', margin: '40px 0' },
  emptyState: { textAlign:'center', padding:'40px', background:'#f8fafc', borderRadius:'20px', border:'2px dashed #e2e8f0', color:'#94a3b8', fontSize:14 },
  blockCard: { border: '1px solid #f1f5f9', borderRadius: '25px', padding: '25px', marginBottom: '25px', background:'#fff', transition:'0.3s' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  typeBadge: (type) => ({ fontSize: '9px', fontWeight: '900', color: type === 'assignment' ? '#f59e0b' : '#673ab7', background: type === 'assignment' ? '#fffbeb' : '#f3e8ff', padding: '6px 12px', borderRadius: '10px' }),
  btnTrash: { background: '#fff1f2', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '12px', cursor:'pointer' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '18px', fontWeight: '900', outline: 'none', marginBottom: '15px', color:'#1e293b' },
  textArea: { width: '100%', minHeight: '120px', borderRadius: '18px', padding: '18px', fontSize: '14px', border:'1px solid #f1f5f9', outline:'none', background:'#fbfcfd' },
  fileUploadArea: { padding: '30px', border: '2px dashed #e2e8f0', borderRadius: '20px', textAlign: 'center', background:'#f8fafc', cursor:'pointer' },
  fileLabel: { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15 },
  smartPreview: { marginTop: '20px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f1f5f9' },
  previewLabel: { background: '#f8fafc', padding: '8px 15px', fontSize: '10px', fontWeight: '900', color:'#94a3b8', borderBottom:'1px solid #f1f5f9' },
  pdfPreviewPlaceholder: { padding: '40px', textAlign:'center', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center' },
  iframePreview: (m) => ({ width: '100%', height: m ? '250px' : '450px', border: 'none' }),
  imgPreview: (m) => ({ width: '100%', maxHeight: m ? '350px' : '600px', objectFit: 'contain' }),
  deadlineBox: { marginTop: '20px', padding: '20px', background: '#fffbeb', borderRadius: '20px', border:'1px solid #fef3c7' },
  deadlineCheckRow: { display:'flex', alignItems:'center', gap:10, fontSize: '13px' },
  deadlineFlex: (m) => ({ display: 'flex', gap: '20px', marginTop: '15px', flexDirection: m ? 'column' : 'row' }),
  miniLabel: { fontSize:10, fontWeight:900, color:'#b45309', display:'block', marginBottom:5 },
  dateInputMini: { fontSize: '12px', padding: '10px', border:'1px solid #fde68a', borderRadius:'10px', width:'100%', background:'#fff' },
  quizSection: { marginTop: '40px', paddingBottom: '20px' },
  quizStatusCard: (m) => ({ display: 'flex', flexDirection: m ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', background: '#673ab7', padding: '25px', borderRadius: '25px', color:'#fff', gap: m ? '20px' : '0', boxShadow:'0 15px 30px rgba(103, 58, 183, 0.2)' }),
  btnManageQuiz: { background: '#fff', color: '#673ab7', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  fabBar: (m) => ({ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', background: '#1e293b', padding: '12px 20px', borderRadius: '25px', alignItems: 'center', zIndex: 9999, boxShadow:'0 20px 40px rgba(0,0,0,0.2)', width: m ? '90%' : 'auto', justifyContent:'center' }),
  fabGroup: { display:'flex', gap:10 },
  toolBtn: { background:'transparent', border:'none', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer', padding:'0 10px', opacity:0.8 },
  btnSaveFab: (m) => ({ background: '#673ab7', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '18px', fontWeight: '900', fontSize:'12px', cursor:'pointer' })
};

export default ManageMateri;