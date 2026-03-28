import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression'; // WAJIB INSTALL: npm install browser-image-compression
import { 
  Save, Trash2, FileText, HelpCircle, Clock, 
  ArrowLeft, Upload, Calendar, Link as LinkIcon, 
  Image as ImageIcon, graduationCap, Users, Layers,
  ChevronDown, AlertCircle
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

  // --- STATE TARGETING ---
  const [targetKategori, setTargetKategori] = useState("Semua"); 
  const [targetKelas, setTargetKelas] = useState("Semua"); 
  
  const COLLECTION_NAME = "bimbel_modul";

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
      }
    } catch (err) { console.error("Error fetching:", err); }
  };

  // --- FITUR BARU: KOMPRESI GAMBAR OTOMATIS ---
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Jika file adalah gambar, kompres otomatis sebelum simpan
    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 0.5,          // Maksimal 500KB agar tidak error di Firestore
        maxWidthOrHeight: 1280, // Resolusi tetap tajam
        useWebWorker: true,
      };

      try {
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => setCoverImage(reader.result);
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        alert("Gagal mengompres gambar: " + error.message);
      }
    } else {
      alert("Hanya file gambar yang diperbolehkan untuk sampul.");
    }
  };

  const formatExternalLink = (url) => {
    if (url.includes('canva.com') && url.includes('/edit')) {
      return url.split('?')[0].replace('/edit', '/view?embed');
    }
    // Tambahan: Auto-embed Google Drive/Slides
    if (url.includes('drive.google.com') && url.includes('/view')) {
        return url.replace('/view', '/preview');
    }
    return url;
  };

  // --- MANAJEMEN BLOK MATERI ---
  const addBlock = (type) => {
    const newBlock = { 
      id: Date.now(), 
      type, 
      content: "", 
      title: type === 'assignment' ? "TUGAS: INSTRUKSI PENGERJAAN" : "SUB-MATERI BARU",
      hasDeadline: false,
      startTime: "",
      endTime: ""
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, field, value) => {
    // Gunakan formatter otomatis jika field yang diupdate adalah content
    const finalValue = field === 'content' ? formatExternalLink(value) : value;
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: finalValue } : b));
  };

  const removeBlock = (id) => {
    if(window.confirm("Hapus bagian ini?")) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
  };

  // --- MANAJEMEN KUIS ---
  const addQuizQuestion = () => {
    setQuizData([...quizData, { 
      id: Date.now(), 
      question: "", 
      options: ["", "", "", ""], 
      correctAnswer: 0,
      endTime: "" 
    }]);
  };

  // --- PROSES PUBLISH ---
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
    } catch (error) { 
      alert("Gagal menyimpan: " + error.message); 
    }
    setLoading(false);
  };

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
        {/* SECTION 1: SAMPUL & IDENTITAS */}
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
                <span style={{fontSize: 11, fontWeight:'bold', color:'#673ab7', marginTop:8}}>KLIK UNTUK UNGGAH SAMPUL</span>
              </label>
            )}
          </div>
          
          <div style={st.identityInputs}>
            <input 
              placeholder="JUDUL MATERI UTAMA..." 
              style={st.mainInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input 
              placeholder="Mata Pelajaran (Contoh: Matematika, Fisika...)" 
              style={st.subInput}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <div style={st.globalDateRow}>
               <Calendar size={14} color="#64748b"/>
               <span style={{fontSize:12, color:'#64748b'}}>Rilis Modul:</span>
               <input type="datetime-local" style={st.cleanDateInput} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* SECTION 2: TARGETING */}
        <div style={st.sectionHeader}><Layers size={18}/> Pengaturan Target Siswa</div>
        <div style={st.targetGrid}>
           <div style={st.targetBox}>
              <label style={st.labelIcon}><Users size={14}/> Kategori Program</label>
              <select style={st.selectInput} value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)}>
                 <option value="Semua">Semua Program</option>
                 <option value="Reguler">Reguler (Bimbel)</option>
                 <option value="Privat">Privat</option>
                 <option value="Intensif">Intensif UTBK</option>
              </select>
           </div>
           <div style={st.targetBox}>
              <label style={st.labelIcon}><Layers size={14}/> Jenjang Kelas</label>
              <select style={st.selectInput} value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)}>
                 <option value="Semua">Semua Kelas</option>
                 <option value="7">Kelas 7 SMP</option>
                 <option value="8">Kelas 8 SMP</option>
                 <option value="9">Kelas 9 SMP</option>
                 <option value="10">Kelas 10 SMA</option>
                 <option value="11">Kelas 11 SMA</option>
                 <option value="12">Kelas 12 SMA</option>
              </select>
           </div>
        </div>

        <div style={st.divider} />

        {/* SECTION 3: KONTEN MATERI */}
        <div style={st.sectionHeader}><FileText size={18}/> Susunan Materi & Tugas</div>
        {blocks.map((block, idx) => (
          <div key={block.id} style={st.blockCard}>
            <div style={st.blockHeader}>
              <div style={st.typeBadge}>
                {block.type === 'text' && <FileText size={12}/>}
                {block.type === 'video' && <LinkIcon size={12}/>}
                {block.type === 'assignment' && <Upload size={12}/>}
                {block.type.toUpperCase()}
              </div>
              <button onClick={() => removeBlock(block.id)} style={st.btnTrash}><Trash2 size={16}/></button>
            </div>
            
            <input 
              placeholder="Nama Bagian (Contoh: Pengenalan Aljabar)" 
              style={st.blockTitleInput}
              value={block.title}
              onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
            />

            <textarea 
              placeholder={block.type === 'video' ? "Tempel Link Canva, YouTube, atau Link Google Slides/PDF..." : "Masukkan isi materi..."}
              style={st.textArea}
              value={block.content}
              onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
            />

            {block.type === 'assignment' && (
              <div style={st.deadlineBox}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                  <input type="checkbox" checked={block.hasDeadline} onChange={(e) => updateBlock(block.id, 'hasDeadline', e.target.checked)} />
                  <span style={{fontSize:12, fontWeight:'bold', color:'#92400e'}}>Atur Tenggat Pengumpulan</span>
                </div>
                {block.hasDeadline && (
                  <div style={st.deadlineFlex}>
                    <div style={st.subInputGroup}>
                      <label>Mulai Dibuka:</label>
                      <input type="datetime-local" style={st.dateInputMini} value={block.startTime} onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)} />
                    </div>
                    <div style={st.subInputGroup}>
                      <label>Batas Akhir:</label>
                      <input type="datetime-local" style={st.dateInputMini} value={block.endTime} onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* SECTION 4: KUIS INTERAKTIF */}
        {quizData.map((q, idx) => (
          <div key={q.id} style={st.quizCard}>
            <div style={st.blockHeader}>
              <span style={st.quizBadge}><HelpCircle size={12}/> SOAL NOMOR {idx + 1}</span>
              <button onClick={() => setQuizData(quizData.filter(i => i.id !== q.id))} style={st.btnTrash}><Trash2 size={16}/></button>
            </div>
            
            <div style={st.quizDeadlineRow}>
               <Clock size={12}/> <span>Tenggat Kuis:</span>
               <input type="datetime-local" style={st.dateInputMini} value={q.endTime} onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, endTime: e.target.value} : item))} />
            </div>

            <textarea 
              placeholder="Tuliskan pertanyaan kuis..." 
              style={{...st.textArea, minHeight: '80px', marginBottom: '20px', border:'1px solid #ddd'}}
              value={q.question}
              onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, question: e.target.value} : item))}
            />

            <div style={st.optGrid}>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} style={{
                  ...st.optItem, 
                  borderColor: q.correctAnswer === oIdx ? '#673ab7' : '#e2e8f0',
                  background: q.correctAnswer === oIdx ? '#f5f3ff' : '#fff'
                }}>
                  <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => setQuizData(quizData.map(item => item.id === q.id ? {...item, correctAnswer: oIdx} : item))} />
                  <input 
                    style={st.optInput} 
                    placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`} 
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...q.options];
                      newOpts[oIdx] = e.target.value;
                      setQuizData(quizData.map(item => item.id === q.id ? {...item, options: newOpts} : item));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* FLOATING ACTION BAR */}
        <div style={st.fabBar}>
          <div style={st.fabLabel}>TAMBAH:</div>
          <button onClick={() => addBlock('text')} style={st.fab} title="Teks"><FileText size={18}/></button>
          <button onClick={() => addBlock('video')} style={st.fab} title="Media/Link"><LinkIcon size={18}/></button>
          <button onClick={() => addBlock('assignment')} style={st.fab} title="Tugas"><Upload size={18}/></button>
          <button onClick={handleSave} style={st.btnSaveFab}>SIMPAN MODUL</button>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const st = {
  container: { padding: '40px 20px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  breadCrumb: { fontSize: '14px', color: '#64748b', fontWeight: '600' },
  btnBack: { padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  btnPublish: { padding: '12px 30px', borderRadius: '15px', border: 'none', background: '#673ab7', color: 'white', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(103, 58, 183, 0.2)' },
  formCard: { background: 'white', width: '100%', maxWidth: '900px', padding: '50px', borderRadius: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)', marginBottom: '150px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', marginTop: '40px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
  coverGrid: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '30px', marginBottom: '40px' },
  coverUploadBox: { height: '160px', borderRadius: '24px', background: '#f1f5f9', border: '2px dashed #cbd5e1', overflow: 'hidden' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  coverImage: { width: '100%', height: '100%', objectFit: 'cover' },
  btnRemoveCover: { position: 'absolute', top: 10, right: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer' },
  identityInputs: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  mainInput: { border: 'none', fontSize: '32px', fontWeight: '900', outline: 'none', color: '#0f172a', width: '100%', letterSpacing: '-0.5px' },
  subInput: { border: 'none', fontSize: '16px', outline: 'none', color: '#64748b', marginTop: '10px', width: '100%', fontWeight: '500' },
  globalDateRow: { display:'flex', alignItems:'center', gap:10, marginTop:20, background:'#f8fafc', padding:'8px 15px', borderRadius:'10px', width:'fit-content' },
  cleanDateInput: { border:'none', background:'transparent', fontSize:'12px', outline:'none', fontWeight:'bold', color:'#1e293b' },
  targetGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' },
  targetBox: { display:'flex', flexDirection:'column', gap:8 },
  labelIcon: { fontSize:'11px', fontWeight:'800', color:'#64748b', display:'flex', alignItems:'center', gap:6 },
  selectInput: { padding:'12px', borderRadius:'12px', border:'1px solid #e2e8f0', background:'#fff', outline:'none', fontWeight:'600', fontSize:'14px' },
  divider: { height: '1px', background: '#f1f5f9', margin: '40px 0' },
  blockCard: { background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '25px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  typeBadge: { fontSize: '9px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '5px 12px', borderRadius: '8px', display:'flex', alignItems:'center', gap:5 },
  btnTrash: { background: '#fff1f2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '10px' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '20px', fontWeight: '800', outline: 'none', marginBottom: '15px', color: '#1e293b' },
  textArea: { width: '100%', minHeight: '120px', border: 'none', borderRadius: '16px', padding: '20px', outline: 'none', background: '#f8fafc', fontSize: '15px', lineHeight: 1.6, color: '#334155' },
  deadlineBox: { marginTop: '20px', padding: '20px', background: '#fffbeb', borderRadius: '18px', border: '1px solid #fef3c7' },
  deadlineFlex: { display: 'flex', gap: '20px' },
  subInputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: 5 },
  dateInputMini: { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' },
  quizCard: { border: '2px solid #f1f5f9', borderRadius: '24px', padding: '30px', marginBottom: '25px' },
  quizBadge: { fontSize: '10px', fontWeight: '900', color: '#10b981', background: '#d1fae5', padding: '5px 12px', borderRadius: '8px', display:'flex', alignItems:'center', gap:5 },
  quizDeadlineRow: { display:'flex', alignItems:'center', gap:8, fontSize:'11px', color:'#64748b', marginBottom:15, background:'#f8fafc', padding:'8px 12px', borderRadius:'10px', width:'fit-content' },
  optGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  optItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '15px', border: '2px solid', borderRadius: '16px', transition: '0.2s' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent', fontWeight: '600' },
  fabBar: { position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', background: '#1e293b', padding: '12px 20px', borderRadius: '24px', alignItems: 'center', zIndex: 1000, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  fabLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', marginLeft: '10px' },
  fab: { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '12px', transition: '0.2s' },
  fabDivider: { width: '1px', height: '30px', background: '#334155', margin: '0 10px' },
  btnSaveFab: { background: '#673ab7', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }
};

export default ManageMateri;