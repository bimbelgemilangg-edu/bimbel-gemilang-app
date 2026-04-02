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
  ImageIcon, Users, Layers,
  Search, UserCheck, Eye, Sparkles
} from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  // --- STATE UTAMA ---
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [releaseDate, setReleaseDate] = useState(""); 
  const [coverImage, setCoverImage] = useState(null);
  const [blocks, setBlocks] = useState([]); 
  const [quizData, setQuizData] = useState([]); 
  const [loading, setLoading] = useState(false);

  // --- STATE TARGETING & DINAMIS ---
  const [targetKategori, setTargetKategori] = useState("Semua"); 
  const [targetKelas, setTargetKelas] = useState("Semua"); 
  const [targetSiswaId, setTargetSiswaId] = useState("Semua"); 
  const [studentSearch, setStudentSearch] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  
  const COLLECTION_NAME = "bimbel_modul";

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

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1024, useWebWorker: true };
      try {
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => setCoverImage(reader.result);
        reader.readAsDataURL(compressedFile);
      } catch (error) { alert("Gagal kompres: " + error.message); }
    }
  };

  const formatExternalLink = (url) => {
    if (url.includes('canva.com') && url.includes('/edit')) return url.split('?')[0].replace('/edit', '/view?embed');
    if (url.includes('drive.google.com') && url.includes('/view')) return url.replace('/view', '/preview');
    return url;
  };

  const addBlock = (type) => {
    const newBlock = { 
      id: Date.now(), type, content: "", 
      title: type === 'assignment' ? "TUGAS: INSTRUKSI PENGERJAAN" : "SUB-MATERI BARU",
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

  const addQuizQuestion = () => {
    setQuizData([...quizData, { 
      id: Date.now(), question: "", options: ["", "", "", ""], correctAnswer: 0, 
      hasDeadline: false, startTime: "", endTime: "" 
    }]);
  };

  const handleSave = async () => {
    if (!title || !subject) return alert("Judul dan Mata Pelajaran wajib diisi!");
    setLoading(true);

    const payload = {
      title: title.toUpperCase(),
      subject: subject.toUpperCase(),
      releaseDate,
      coverImage,
      blocks,
      quizData,
      targetKategori,
      targetKelas,
      targetSiswaId,
      authorName: localStorage.getItem('userName') || "Admin Guru",
      updatedAt: serverTimestamp(),
      deadlineTugas: blocks.find(b => b.type === 'assignment')?.endTime || "",
      deadlineQuiz: quizData[0]?.endTime || ""
    };

    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, COLLECTION_NAME), payload);
      }
      alert("🚀 MODUL BERHASIL DIPUBLISH!");
      navigate('/guru/modul');
    } catch (error) { alert("Gagal menyimpan: " + error.message); }
    setLoading(false);
  };

  const filteredStudents = studentsList.filter(s => {
    const matchesSearch = (s.nama || "").toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = targetKelas === "Semua" || s.kelasSekolah === targetKelas;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="main-content-wrapper">
      <div className="teacher-container-padding" style={{paddingBottom: '150px'}}>
        
        {/* HEADER BAR */}
        <div style={st.topBar}>
          <div style={st.breadCrumb}>Modul / <span style={{color:'#673ab7'}}>{editId ? "Edit Materi" : "Buat Baru"}</span></div>
          <div style={{display:'flex', gap: 12}}>
            <button onClick={() => navigate('/guru/modul')} style={st.btnBack}><ArrowLeft size={16}/> Kembali</button>
            <button onClick={handleSave} disabled={loading} className="teacher-btn-primary" style={st.btnPublish}>
              <Save size={18}/> {loading ? "Menyimpan..." : "PUBLISH MODUL"}
            </button>
          </div>
        </div>

        <div className="teacher-card" style={st.formCard}>
          {/* SAMPUL & IDENTITAS */}
          <div style={st.sectionHeader}><Sparkles size={18} color="#673ab7"/> Sampul & Identitas Modul</div>
          <div style={st.coverGrid}>
            <div style={st.coverUploadBox}>
              {coverImage ? (
                <div style={st.coverPreviewWrapper}>
                  <img src={coverImage} alt="Preview" style={st.coverImage} />
                  <button onClick={() => setCoverImage(null)} style={st.btnRemoveCover}><Trash2 size={14}/></button>
                </div>
              ) : (
                <label style={st.coverPlaceholder}>
                  <input type="file" accept="image/*" hidden onChange={handleCoverUpload} />
                  <div style={st.uploadCircle}><Upload size={24} color="#673ab7" /></div>
                  <span style={st.uploadText}>UNGGAH SAMPUL</span>
                </label>
              )}
            </div>
            <div style={st.identityInputs}>
              <input placeholder="JUDUL MATERI UTAMA..." style={st.mainInput} value={title} onChange={(e) => setTitle(e.target.value)} />
              <input placeholder="Contoh: Matematika, Bahasa Inggris..." style={st.subInput} value={subject} onChange={(e) => setSubject(e.target.value)} />
              <div style={st.globalDateRow}>
                 <Calendar size={14} color="#673ab7"/>
                 <span style={{fontSize:11, fontWeight:'800', color:'#64748b', textTransform:'uppercase'}}>Jadwal Rilis:</span>
                 <input type="datetime-local" style={st.cleanDateInput} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* TARGETING */}
          <div style={st.sectionHeader}><Users size={18} color="#673ab7"/> Pengaturan Target Siswa</div>
          <div style={st.targetGrid}>
             <div style={st.targetBox}>
                <label style={st.labelIcon}>Kategori Program</label>
                <select className="teacher-input" style={st.selectInput} value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)}>
                   <option value="Semua">Semua Program</option>
                   <option value="Reguler">Reguler (Bimbel)</option>
                   <option value="English">English Course</option>
                </select>
             </div>
             <div style={st.targetBox}>
                <label style={st.labelIcon}>Jenjang Kelas</label>
                <select className="teacher-input" style={st.selectInput} value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)}>
                   <option value="Semua">Semua Kelas</option>
                   {availableClasses.map(kls => <option key={kls} value={kls}>{kls}</option>)}
                </select>
             </div>
          </div>

          <div style={st.searchBoxSiswa}>
             <label style={st.labelIcon}>Cari Siswa Spesifik (Opsional)</label>
             <div style={st.siswaSelectRow}>
                <div style={{flex: 1, position:'relative'}}>
                   <Search style={st.searchIconInside} size={16}/>
                   <input 
                     placeholder="Ketik nama siswa untuk memfilter list..." 
                     className="teacher-input"
                     style={{paddingLeft: 40, width:'100%'}} 
                     value={studentSearch} 
                     onChange={(e) => setStudentSearch(e.target.value)}
                   />
                </div>
                <select className="teacher-input" style={{flex: 1}} value={targetSiswaId} onChange={(e) => setTargetSiswaId(e.target.value)}>
                   <option value="Semua">Kirim ke Semua Siswa</option>
                   {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelasSekolah})</option>)}
                </select>
             </div>
             {targetSiswaId !== "Semua" && (
               <div style={st.targetAlert}>
                  <UserCheck size={14}/> Modul terkunci hanya untuk siswa: {studentsList.find(s => s.id === targetSiswaId)?.nama}
               </div>
             )}
          </div>

          <div style={st.divider} />

          {/* MATERI */}
          <div style={st.sectionHeader}><FileText size={18} color="#673ab7"/> Susunan Materi & Tugas</div>
          {blocks.map((block) => (
            <div key={block.id} style={st.blockCard}>
              <div style={st.blockHeader}>
                <div style={st.typeBadge}>{block.type.toUpperCase()}</div>
                <button onClick={() => removeBlock(block.id)} style={st.btnTrash}><Trash2 size={16}/></button>
              </div>
              <input placeholder="Judul Bagian Materi..." style={st.blockTitleInput} value={block.title} onChange={(e) => updateBlock(block.id, 'title', e.target.value)} />
              <textarea 
                placeholder={block.type === 'video' ? "Tempel Link Canva / YouTube / Drive di sini..." : "Tulis isi materi lengkap..."} 
                className="teacher-input"
                style={st.textArea} 
                value={block.content} 
                onChange={(e) => updateBlock(block.id, 'content', e.target.value)} 
              />

              {block.content && (block.content.includes('canva.com') || block.content.includes('youtube.com') || block.content.includes('drive.google.com')) && (
                <div style={st.smartPreview}>
                  <div style={st.previewLabel}><Eye size={12}/> Live Smart View Preview</div>
                  <iframe src={block.content} style={st.iframePreview} title="Preview" allowFullScreen />
                </div>
              )}

              {block.type === 'assignment' && (
                <div style={st.deadlineBox}>
                  <div style={st.deadlineCheckRow}>
                    <input type="checkbox" checked={block.hasDeadline} onChange={(e) => updateBlock(block.id, 'hasDeadline', e.target.checked)} />
                    <span>Aktifkan Batas Pengumpulan Tugas</span>
                  </div>
                  {block.hasDeadline && (
                    <div style={st.deadlineFlex}>
                      <div style={st.subInputGroup}><label>Mulai:</label><input type="datetime-local" className="teacher-input" style={st.dateInputMini} value={block.startTime} onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)} /></div>
                      <div style={st.subInputGroup}><label>Deadline:</label><input type="datetime-local" className="teacher-input" style={st.dateInputMini} value={block.endTime} onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)} /></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* KUIS */}
          {quizData.length > 0 && <div style={st.sectionHeader}><HelpCircle size={18} color="#10b981"/> Bank Soal Kuis Interaktif</div>}
          {quizData.map((q, idx) => (
            <div key={q.id} style={st.quizCard}>
              <div style={st.blockHeader}>
                <span style={st.quizBadge}>SOAL #{idx + 1}</span>
                <button onClick={() => setQuizData(quizData.filter(i => i.id !== q.id))} style={st.btnTrash}><Trash2 size={16}/></button>
              </div>
              <textarea placeholder="Tulis pertanyaan kuis..." className="teacher-input" style={{minHeight:'80px'}} value={q.question} onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, question: e.target.value} : item))} />
              <div style={st.optGrid}>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{...st.optItem, borderColor: q.correctAnswer === oIdx ? '#10b981' : '#e2e8f0', background: q.correctAnswer === oIdx ? '#f0fdf4' : '#fff'}}>
                    <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => setQuizData(quizData.map(item => item.id === q.id ? {...item, correctAnswer: oIdx} : item))} />
                    <input style={st.optInput} placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`} value={opt} onChange={(e) => {
                      const newOpts = [...q.options];
                      newOpts[oIdx] = e.target.value;
                      setQuizData(quizData.map(item => item.id === q.id ? {...item, options: newOpts} : item));
                    }} />
                  </div>
                ))}
              </div>

              {idx === 0 && (
                <div style={st.quizDeadlineBox}>
                  <div style={st.deadlineCheckRow}>
                    <input type="checkbox" checked={q.hasDeadline} onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, hasDeadline: e.target.checked} : item))} />
                    <span style={{color:'#166534'}}>Atur Batas Waktu Kuis (Global)</span>
                  </div>
                  {q.hasDeadline && (
                    <div style={st.deadlineFlex}>
                      <div style={st.subInputGroup}><label>Batas Akhir:</label><input type="datetime-local" className="teacher-input" style={st.dateInputMini} value={q.endTime} onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, endTime: e.target.value} : item))} /></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* FLOATING ACTION BAR */}
          <div style={st.fabBar}>
            <span style={st.fabLabel}>TAMBAH KOMPONEN:</span>
            <button onClick={() => addBlock('text')} style={st.fab} title="Tambah Teks"><FileText size={18}/></button>
            <button onClick={() => addBlock('video')} style={st.fab} title="Tambah Media/Link"><LinkIcon size={18}/></button>
            <button onClick={() => addBlock('assignment')} style={st.fab} title="Tambah Tugas"><Upload size={18}/></button>
            <button onClick={addQuizQuestion} style={st.fab} title="Tambah Kuis"><HelpCircle size={18}/></button>
            <div style={st.fabDivider} />
            <button onClick={handleSave} style={st.btnSaveFab}>{loading ? "..." : "SIMPAN MODUL"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const st = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap:'wrap', gap:'15px' },
  breadCrumb: { fontSize: '13px', color: '#94a3b8', fontWeight: '700', textTransform:'uppercase', letterSpacing:'1px' },
  btnBack: { padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color:'#64748b' },
  btnPublish: { padding: '12px 25px', borderRadius: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 20px rgba(103, 58, 183, 0.3)' },
  
  formCard: { padding: '40px', borderRadius: '30px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '25px', marginTop: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', textTransform:'uppercase' },
  
  coverGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '40px' },
  coverUploadBox: { height: '180px', borderRadius: '24px', background: '#f8fafc', border: '2px dashed #cbd5e1', overflow: 'hidden', position:'relative' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  uploadCircle: { background:'#fff', padding:12, borderRadius:'50%', boxShadow:'0 4px 10px rgba(0,0,0,0.05)', marginBottom:10 },
  uploadText: { fontSize: 10, fontWeight:'900', color:'#673ab7' },
  coverImage: { width: '100%', height: '100%', objectFit: 'cover' },
  coverPreviewWrapper: { width: '100%', height: '100%', position: 'relative' },
  btnRemoveCover: { position: 'absolute', top: 12, right: 12, background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', padding: '6px', cursor: 'pointer', zIndex: 10 },
  
  identityInputs: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' },
  mainInput: { border: 'none', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: '900', outline: 'none', color: '#0f172a', width: '100%', background:'transparent' },
  subInput: { border: 'none', fontSize: '16px', outline: 'none', color: '#64748b', fontWeight:'600', width: '100%', background:'transparent' },
  globalDateRow: { display:'flex', alignItems:'center', gap:10, marginTop:15, background:'#f1f5f9', padding:'8px 15px', borderRadius:'12px', width:'fit-content' },
  cleanDateInput: { border:'none', background:'transparent', fontSize:'12px', outline:'none', fontWeight:'bold', color:'#1e293b' },
  
  targetGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px' },
  targetBox: { display:'flex', flexDirection:'column', gap:8 },
  labelIcon: { fontSize:'10px', fontWeight:'900', color:'#94a3b8', textTransform:'uppercase', marginLeft: 5 },
  selectInput: { width: '100%' },
  searchBoxSiswa: { marginTop: 25, background: '#f8fafc', padding: '25px', borderRadius: '24px', border:'1px solid #f1f5f9' },
  siswaSelectRow: { display:'flex', gap: 15, marginTop: 12, flexWrap:'wrap' },
  searchIconInside: { position:'absolute', left: 15, top: '50%', transform:'translateY(-50%)', color:'#94a3b8' },
  targetAlert: { marginTop: 15, display:'flex', alignItems:'center', gap: 8, color:'#059669', fontSize: 12, fontWeight: '800', background:'#dcfce7', padding:'10px 15px', borderRadius:'12px' },
  
  divider: { height: '2px', background: '#f1f5f9', margin: '50px 0' },
  blockCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '25px', marginBottom: '25px' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  typeBadge: { fontSize: '10px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '6px 14px', borderRadius: '10px' },
  btnTrash: { background: '#fff1f2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '10px', borderRadius: '12px' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '18px', fontWeight: '900', outline: 'none', marginBottom: '15px', color: '#1e293b', paddingLeft: 5 },
  textArea: { width: '100%', minHeight: '130px', borderRadius: '18px', padding: '20px', fontSize: '15px', lineHeight: 1.6 },
  
  smartPreview: { marginTop: '20px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', background:'#000' },
  previewLabel: { background: '#1e293b', padding: '8px 20px', fontSize: '10px', fontWeight: '800', color:'#fff', display: 'flex', alignItems: 'center', gap: 8 },
  iframePreview: { width: '100%', height: '400px', border: 'none' },
  
  deadlineBox: { marginTop: '20px', padding: '20px', background: '#fffbeb', borderRadius: '20px', border: '1px solid #fef3c7' },
  deadlineCheckRow: { display:'flex', alignItems:'center', gap:10, marginBottom:15, fontSize:13, fontWeight:'800', color:'#92400e' },
  deadlineFlex: { display: 'flex', gap: '15px', flexWrap:'wrap' },
  subInputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  dateInputMini: { padding: '10px', fontSize: '12px', fontWeight:'700' },
  
  quizCard: { border: '2px solid #f1f5f9', borderRadius: '24px', padding: '30px', marginBottom: '25px', background: '#fff' },
  quizBadge: { fontSize: '10px', fontWeight: '900', color: '#10b981', background: '#d1fae5', padding: '6px 14px', borderRadius: '10px' },
  optGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: 20 },
  optItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '15px', border: '2px solid', borderRadius: '18px', transition:'0.2s' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent', fontWeight: '700', color:'#1e293b' },
  quizDeadlineBox: { marginTop: 25, padding: '20px', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #bbf7d0' },
  
  fabBar: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', background: '#1e293b', padding: '12px 20px', borderRadius: '24px', alignItems: 'center', zIndex: 9999, boxShadow:'0 15px 40px rgba(0,0,0,0.2)' },
  fabLabel: { fontSize: '9px', fontWeight: '900', color: '#94a3b8', marginRight: 5 },
  fab: { background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', padding: '12px', borderRadius: '15px', transition:'0.2s' },
  fabDivider: { width:'1px', height:'25px', background:'rgba(255,255,255,0.1)', margin:'0 5px' },
  btnSaveFab: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', fontSize:'13px' }
};

export default ManageMateri;