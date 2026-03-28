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
  Image as ImageIcon, Users, Layers,
  Search, UserCheck, Eye
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

  // FETCH DATA SISWA & KELAS DINAMIS
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

  // KOMPRESI GAMBAR
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

  // FORMAT LINK UNTUK SMART VIEW (CANVA, YOUTUBE, DRIVE)
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

  // KUIS DENGAN TENGGAT WAKTU PER SOAL/GRUP
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
    <div style={st.container}>
      <div style={st.topBar}>
        <div style={st.breadCrumb}>Modul / {editId ? "Edit Materi" : "Buat Materi Baru"}</div>
        <div style={{display:'flex', gap: 12}}>
          <button onClick={() => navigate('/guru/modul')} style={st.btnBack}><ArrowLeft size={16}/> Kembali</button>
          <button onClick={handleSave} disabled={loading} style={st.btnPublish}>
            <Save size={18}/> {loading ? "Proses..." : "PUBLISH SEKARANG"}
          </button>
        </div>
      </div>

      <div style={st.formCard}>
        {/* SAMPUL & IDENTITAS */}
        <div style={st.sectionHeader}><ImageIcon size={18}/> Sampul & Identitas Modul</div>
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
                <Upload size={24} color="#673ab7" />
                <span style={{fontSize: 10, fontWeight:'bold', color:'#673ab7', marginTop:8, textAlign:'center'}}>KLIK UNTUK UNGGAH SAMPUL</span>
              </label>
            )}
          </div>
          <div style={st.identityInputs}>
            <input placeholder="JUDUL MATERI UTAMA..." style={st.mainInput} value={title} onChange={(e) => setTitle(e.target.value)} />
            <input placeholder="Mata Pelajaran..." style={st.subInput} value={subject} onChange={(e) => setSubject(e.target.value)} />
            <div style={st.globalDateRow}>
               <Calendar size={14} color="#64748b"/>
               <span style={{fontSize:12, color:'#64748b'}}>Rilis Modul:</span>
               <input type="datetime-local" style={st.cleanDateInput} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* TARGETING */}
        <div style={st.sectionHeader}><Layers size={18}/> Pengaturan Target Siswa</div>
        <div style={st.targetGrid}>
           <div style={st.targetBox}>
              <label style={st.labelIcon}><Users size={14}/> Kategori Program</label>
              <select style={st.selectInput} value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)}>
                 <option value="Semua">Semua Program</option>
                 <option value="Reguler">Reguler (Bimbel)</option>
                 <option value="English">English Course</option>
              </select>
           </div>
           <div style={st.targetBox}>
              <label style={st.labelIcon}><Layers size={14}/> Jenjang Kelas</label>
              <select style={st.selectInput} value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)}>
                 <option value="Semua">Semua Kelas</option>
                 {availableClasses.map(kls => <option key={kls} value={kls}>{kls}</option>)}
              </select>
           </div>
        </div>

        <div style={st.searchBoxSiswa}>
           <label style={st.labelIcon}><Search size={14}/> Cari Siswa Spesifik (Opsional)</label>
           <div style={{display:'flex', gap: 10, marginTop: 10}}>
              <div style={{flex: 1, position:'relative'}}>
                 <Search style={{position:'absolute', left: 12, top: 12, color:'#94a3b8'}} size={16}/>
                 <input 
                   placeholder="Ketik nama siswa..." 
                   style={{...st.selectInput, paddingLeft: 40, width:'100%'}} 
                   value={studentSearch} 
                   onChange={(e) => setStudentSearch(e.target.value)}
                 />
              </div>
              <select style={{...st.selectInput, flex: 1}} value={targetSiswaId} onChange={(e) => setTargetSiswaId(e.target.value)}>
                 <option value="Semua">Kirim ke Semua Siswa</option>
                 {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelasSekolah})</option>)}
              </select>
           </div>
           {targetSiswaId !== "Semua" && (
             <div style={{marginTop: 10, display:'flex', alignItems:'center', gap: 5, color:'#059669', fontSize: 11, fontWeight: 'bold'}}>
                <UserCheck size={14}/> Modul ini hanya akan tampil di akun {studentsList.find(s => s.id === targetSiswaId)?.nama}
             </div>
           )}
        </div>

        <div style={st.divider} />

        {/* MATERI & SMART VIEW */}
        <div style={st.sectionHeader}><FileText size={18}/> Susunan Materi & Tugas</div>
        {blocks.map((block) => (
          <div key={block.id} style={st.blockCard}>
            <div style={st.blockHeader}>
              <div style={st.typeBadge}>{block.type.toUpperCase()}</div>
              <button onClick={() => removeBlock(block.id)} style={st.btnTrash}><Trash2 size={16}/></button>
            </div>
            <input placeholder="Nama Bagian..." style={st.blockTitleInput} value={block.title} onChange={(e) => updateBlock(block.id, 'title', e.target.value)} />
            <textarea 
              placeholder={block.type === 'video' ? "Tempel Link Canva/YT/Slides di sini..." : "Tulis isi materi..."} 
              style={st.textArea} 
              value={block.content} 
              onChange={(e) => updateBlock(block.id, 'content', e.target.value)} 
            />

            {/* SMART VIEW INTEGRATION */}
            {block.content && (block.content.includes('canva.com') || block.content.includes('youtube.com') || block.content.includes('drive.google.com')) && (
              <div style={st.smartPreview}>
                <div style={st.previewLabel}><Eye size={12}/> Smart View Preview</div>
                <iframe src={block.content} style={st.iframePreview} title="Preview Content" allowFullScreen />
              </div>
            )}

            {block.type === 'assignment' && (
              <div style={st.deadlineBox}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                  <input type="checkbox" checked={block.hasDeadline} onChange={(e) => updateBlock(block.id, 'hasDeadline', e.target.checked)} />
                  <span style={{fontSize:12, fontWeight:'bold', color:'#92400e'}}>Atur Tenggat Tugas</span>
                </div>
                {block.hasDeadline && (
                  <div style={st.deadlineFlex}>
                    <div style={st.subInputGroup}><label>Mulai:</label><input type="datetime-local" style={st.dateInputMini} value={block.startTime} onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)} /></div>
                    <div style={st.subInputGroup}><label>Batas:</label><input type="datetime-local" style={st.dateInputMini} value={block.endTime} onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)} /></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* KUIS & DEADLINE KUIS */}
        {quizData.length > 0 && <div style={st.sectionHeader}><HelpCircle size={18}/> Bank Soal Kuis</div>}
        {quizData.map((q, idx) => (
          <div key={q.id} style={st.quizCard}>
            <div style={st.blockHeader}>
              <span style={st.quizBadge}>SOAL NOMOR {idx + 1}</span>
              <button onClick={() => setQuizData(quizData.filter(i => i.id !== q.id))} style={st.btnTrash}><Trash2 size={16}/></button>
            </div>
            <textarea placeholder="Pertanyaan..." style={{...st.textArea, minHeight:'80px', border:'1px solid #ddd'}} value={q.question} onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, question: e.target.value} : item))} />
            <div style={st.optGrid}>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} style={{...st.optItem, borderColor: q.correctAnswer === oIdx ? '#673ab7' : '#e2e8f0', background: q.correctAnswer === oIdx ? '#f5f3ff' : '#fff'}}>
                  <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => setQuizData(quizData.map(item => item.id === q.id ? {...item, correctAnswer: oIdx} : item))} />
                  <input style={st.optInput} placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`} value={opt} onChange={(e) => {
                    const newOpts = [...q.options];
                    newOpts[oIdx] = e.target.value;
                    setQuizData(quizData.map(item => item.id === q.id ? {...item, options: newOpts} : item));
                  }} />
                </div>
              ))}
            </div>

            {/* QUIZ DEADLINE (PER GRUP/SOAL PERTAMA) */}
            {idx === 0 && (
              <div style={{...st.deadlineBox, marginTop: 20, background: '#f0fdf4', borderColor: '#bbf7d0'}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                  <input type="checkbox" checked={q.hasDeadline} onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, hasDeadline: e.target.checked} : item))} />
                  <span style={{fontSize:12, fontWeight:'bold', color:'#166534'}}>Atur Tenggat Waktu Kuis</span>
                </div>
                {q.hasDeadline && (
                  <div style={st.deadlineFlex}>
                    <div style={st.subInputGroup}><label>Batas Pengerjaan:</label><input type="datetime-local" style={st.dateInputMini} value={q.endTime} onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, endTime: e.target.value} : item))} /></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* FLOATING ACTION BAR */}
        <div style={st.fabBar}>
          <div style={st.fabLabel}>TAMBAH:</div>
          <button onClick={() => addBlock('text')} style={st.fab} title="Teks"><FileText size={18}/></button>
          <button onClick={() => addBlock('video')} style={st.fab} title="Media/Link"><LinkIcon size={18}/></button>
          <button onClick={() => addBlock('assignment')} style={st.fab} title="Tugas"><Upload size={18}/></button>
          <button onClick={addQuizQuestion} style={st.fab} title="Kuis"><HelpCircle size={18}/></button>
          <button onClick={handleSave} style={st.btnSaveFab}>SIMPAN MODUL</button>
        </div>
      </div>
    </div>
  );
};

const st = {
  container: { padding: '40px 20px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  breadCrumb: { fontSize: '14px', color: '#64748b', fontWeight: '600' },
  btnBack: { padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  btnPublish: { padding: '12px 30px', borderRadius: '15px', border: 'none', background: '#673ab7', color: 'white', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(103, 58, 183, 0.2)' },
  formCard: { background: 'white', width: '100%', maxWidth: '900px', padding: '50px', borderRadius: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)', marginBottom: '150px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', marginTop: '40px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
  coverGrid: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '30px', marginBottom: '40px' },
  coverUploadBox: { height: '160px', borderRadius: '24px', background: '#f1f5f9', border: '2px dashed #cbd5e1', overflow: 'hidden', position:'relative' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  coverImage: { width: '100%', height: '100%', objectFit: 'cover' },
  btnRemoveCover: { position: 'absolute', top: 10, right: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', zIndex: 10 },
  identityInputs: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  mainInput: { border: 'none', fontSize: '30px', fontWeight: '900', outline: 'none', color: '#0f172a', width: '100%' },
  subInput: { border: 'none', fontSize: '16px', outline: 'none', color: '#64748b', marginTop: '10px', width: '100%' },
  globalDateRow: { display:'flex', alignItems:'center', gap:10, marginTop:20, background:'#f8fafc', padding:'8px 15px', borderRadius:'10px', width:'fit-content' },
  cleanDateInput: { border:'none', background:'transparent', fontSize:'12px', outline:'none', fontWeight:'bold' },
  targetGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' },
  targetBox: { display:'flex', flexDirection:'column', gap:8 },
  labelIcon: { fontSize:'11px', fontWeight:'800', color:'#64748b', display:'flex', alignItems:'center', gap:6 },
  selectInput: { padding:'12px', borderRadius:'12px', border:'1px solid #e2e8f0', background:'#fff', outline:'none', fontWeight:'600', fontSize:'14px' },
  searchBoxSiswa: { marginTop: 20, background: '#f8fafc', padding: '20px', borderRadius: '20px' },
  divider: { height: '1px', background: '#f1f5f9', margin: '40px 0' },
  blockCard: { background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '25px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  typeBadge: { fontSize: '9px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '5px 12px', borderRadius: '8px' },
  btnTrash: { background: '#fff1f2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '10px' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '18px', fontWeight: '800', outline: 'none', marginBottom: '15px', color: '#1e293b' },
  textArea: { width: '100%', minHeight: '120px', border: 'none', borderRadius: '16px', padding: '20px', outline: 'none', background: '#f8fafc', fontSize: '15px', lineHeight: 1.6, color: '#334155' },
  smartPreview: { marginTop: '15px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  previewLabel: { background: '#f1f5f9', padding: '5px 15px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 },
  iframePreview: { width: '100%', height: '350px', border: 'none' },
  deadlineBox: { marginTop: '20px', padding: '20px', background: '#fffbeb', borderRadius: '18px', border: '1px solid #fef3c7' },
  deadlineFlex: { display: 'flex', gap: '20px' },
  subInputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: 5 },
  dateInputMini: { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' },
  quizCard: { border: '2px solid #f1f5f9', borderRadius: '24px', padding: '30px', marginBottom: '25px' },
  quizBadge: { fontSize: '10px', fontWeight: '900', color: '#10b981', background: '#d1fae5', padding: '5px 12px', borderRadius: '8px' },
  optGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: 15 },
  optItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '15px', border: '2px solid', borderRadius: '16px' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent', fontWeight: '600' },
  fabBar: { position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', background: '#1e293b', padding: '12px 20px', borderRadius: '24px', alignItems: 'center', zIndex: 1000 },
  fabLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8' },
  fab: { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '12px' },
  btnSaveFab: { background: '#673ab7', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }
};

export default ManageMateri;