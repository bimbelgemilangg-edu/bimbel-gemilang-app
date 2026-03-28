import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, Trash2, FileText, HelpCircle, Clock, 
  ArrowLeft, Upload, Calendar, Link as LinkIcon, Image as ImageIcon
} from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  // State Utama
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [releaseDate, setReleaseDate] = useState(""); 
  const [coverImage, setCoverImage] = useState(null); // FITUR SAMPUL DIKEMBALIKAN
  const [blocks, setBlocks] = useState([]); 
  const [quizData, setQuizData] = useState([]); 
  const [loading, setLoading] = useState(false);
  
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
      }
    } catch (err) { console.error("Error fetching:", err); }
  };

  // Handler Upload Sampul (Base64)
  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const formatExternalLink = (url) => {
    if (url.includes('canva.com') && url.includes('/edit')) {
      return url.split('?')[0].replace('/edit', '/view?embed');
    }
    return url;
  };

  // --- MANAJEMEN KONTEN ---
  const addBlock = (type) => {
    const newBlock = { 
      id: Date.now(), 
      type, 
      content: "", 
      title: type === 'assignment' ? "TUGAS: UPLOAD CATATAN" : "SUB-MATERI",
      // Fitur baru: Checklist Tenggat per Bagian
      hasDeadline: false,
      startTime: "",
      endTime: ""
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => setBlocks(blocks.filter(b => b.id !== id));

  const addQuizQuestion = () => {
    setQuizData([...quizData, { 
      id: Date.now(), 
      question: "", 
      options: ["", "", "", ""], 
      correctAnswer: 0,
      hasDeadline: false,
      endTime: "" 
    }]);
  };

  // --- PROSES SIMPAN ---
  const handleSave = async () => {
    if (!title) return alert("Judul Modul wajib diisi!");
    setLoading(true);

    const payload = {
      title,
      subject: subject || "UMUM",
      releaseDate,
      coverImage, // Simpan Sampul
      blocks,
      quizData,
      updatedAt: serverTimestamp()
    };

    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, COLLECTION_NAME), payload);
      }
      alert("✅ Modul Berhasil Dipublish!");
      navigate('/guru/modul');
    } catch (error) { alert("Error: " + error.message); }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack}>
           <ArrowLeft size={18}/> Batal
        </button>
        <button onClick={handleSave} disabled={loading} style={styles.btnPublish}>
          <Save size={18}/> {loading ? "Menyimpan..." : "PUBLISH MODUL"}
        </button>
      </div>

      <div style={styles.formCard}>
        {/* Upload Sampul Modul */}
        <div style={styles.coverSection}>
          {coverImage ? (
            <div style={styles.coverPreviewWrapper}>
              <img src={coverImage} alt="Sampul" style={styles.coverImage} />
              <button onClick={() => setCoverImage(null)} style={styles.btnRemoveCover}><Trash2 size={14}/></button>
            </div>
          ) : (
            <label style={styles.coverPlaceholder}>
              <input type="file" accept="image/*" hidden onChange={handleCoverUpload} />
              <ImageIcon size={32} color="#94a3b8" />
              <span style={{fontSize: 12, color: '#94a3b8', marginTop: 8}}>Upload Sampul Modul (JPG/PNG)</span>
            </label>
          )}
        </div>

        <input 
          placeholder="Judul Modul..." 
          style={styles.mainInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input 
          placeholder="Mata Pelajaran..." 
          style={styles.subInput}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        
        <div style={styles.divider} />

        {/* Rilis Modul Global */}
        <div style={styles.dateBoxGlobal}>
          <label style={{...styles.label, color: '#3b82f6'}}><Calendar size={14}/> Tanggal Rilis Modul</label>
          <input type="datetime-local" style={styles.dateInput} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
        </div>

        {/* Render Materi Blocks */}
        {blocks.map((block, idx) => (
          <div key={block.id} style={styles.blockCard}>
            <div style={styles.blockHeader}>
              <span style={styles.badge}>{block.type === 'assignment' ? 'PENUGASAN' : `BAGIAN ${idx + 1}`}</span>
              <button onClick={() => removeBlock(block.id)} style={styles.btnTrash}><Trash2 size={16}/></button>
            </div>
            
            <input 
              placeholder="Judul Bagian/Instruksi..." 
              style={styles.blockTitleInput}
              value={block.title}
              onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
            />
            <textarea 
              placeholder={block.type === 'video' ? "Tempel Link Canva/YouTube..." : "Tulis materi atau detail tugas..."}
              style={styles.textArea}
              value={block.content}
              onChange={(e) => updateBlock(block.id, 'content', formatExternalLink(e.target.value))}
            />

            {/* FITUR BARU: TENGGAT PER BAGIAN TUGAS */}
            {block.type === 'assignment' && (
              <div style={styles.deadlineSection}>
                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={block.hasDeadline} 
                    onChange={(e) => updateBlock(block.id, 'hasDeadline', e.target.checked)} 
                  />
                  Aktifkan Tenggat Waktu (Buka & Tutup)
                </label>
                {block.hasDeadline && (
                  <div style={styles.deadlineInputs}>
                    <div style={styles.inputGroup}>
                      <span style={styles.labelSmall}>Dibuka Pada:</span>
                      <input type="datetime-local" style={styles.dateInputSmall} value={block.startTime} onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)} />
                    </div>
                    <div style={styles.inputGroup}>
                      <span style={styles.labelSmall}>Ditutup Pada:</span>
                      <input type="datetime-local" style={styles.dateInputSmall} value={block.endTime} onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Render Kuis */}
        {quizData.length > 0 && <h4 style={{color:'#673ab7', marginBottom: '15px', marginTop: '30px'}}>Kuis Interaktif</h4>}
        {quizData.map((q, idx) => (
          <div key={q.id} style={styles.quizCard}>
            <div style={styles.blockHeader}>
              <span style={styles.badge}>PERTANYAAN {idx + 1}</span>
              <button onClick={() => setQuizData(quizData.filter(item => item.id !== q.id))} style={styles.btnTrash}><Trash2 size={16}/></button>
            </div>
            {/* Fitur Tenggat Kuis Terintegrasi */}
            <div style={{marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center'}}>
               <label style={{fontSize: 11, fontWeight: 'bold'}}><Clock size={12}/> Tenggat Kuis:</label>
               <input type="datetime-local" style={styles.dateInputSmall} value={q.endTime} onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, endTime: e.target.value} : item))} />
            </div>
            <textarea 
              placeholder="Tulis soal kuis..." 
              style={{...styles.textArea, minHeight: '60px', marginBottom: '15px'}}
              value={q.question}
              onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, question: e.target.value} : item))}
            />
            <div style={styles.optGrid}>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} style={{...styles.optItem, borderColor: q.correctAnswer === oIdx ? '#673ab7' : '#e2e8f0', background: q.correctAnswer === oIdx ? '#f5f3ff' : 'white'}}>
                  <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => setQuizData(quizData.map(item => item.id === q.id ? {...item, correctAnswer: oIdx} : item))} />
                  <input 
                    style={styles.optInput} 
                    placeholder={`Pilihan ${oIdx + 1}`} 
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

        <div style={styles.fabBar}>
          <button onClick={() => addBlock('text')} style={styles.fab} title="Teks Materi"><FileText size={20}/></button>
          <button onClick={() => addBlock('video')} style={styles.fab} title="Link Canva/Video"><LinkIcon size={20}/></button>
          <button onClick={() => addBlock('assignment')} style={styles.fab} title="Kotak Tugas"><Upload size={20}/></button>
          <button onClick={addQuizQuestion} style={styles.fab} title="Tambah Kuis"><HelpCircle size={20}/></button>
          <div style={{width: '1px', height: '25px', background: '#475569', margin: '0 10px'}}/>
          <button onClick={handleSave} style={styles.btnSaveFab}>SIMPAN</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '850px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnBack: { padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'white', fontWeight: 'bold', cursor: 'pointer' },
  btnPublish: { padding: '10px 25px', borderRadius: '30px', border: 'none', background: '#673ab7', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  formCard: { background: 'white', width: '100%', maxWidth: '850px', padding: '40px', borderRadius: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', position: 'relative', marginBottom: '120px' },
  coverSection: { width: '100%', height: '200px', borderRadius: '20px', background: '#f8fafc', border: '2px dashed #e2e8f0', marginBottom: '30px', overflow: 'hidden' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  coverPreviewWrapper: { position: 'relative', width: '100%', height: '100%' },
  coverImage: { width: '100%', height: '100%', objectFit: 'cover' },
  btnRemoveCover: { position: 'absolute', top: 10, right: 10, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' },
  mainInput: { width: '100%', border: 'none', fontSize: '32px', fontWeight: 'bold', outline: 'none', color: '#1e293b' },
  subInput: { width: '100%', border: 'none', fontSize: '18px', outline: 'none', color: '#64748b', marginTop: '10px' },
  divider: { height: '1px', background: '#f1f5f9', margin: '30px 0' },
  dateBoxGlobal: { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' },
  dateInput: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', marginTop: '8px' },
  blockCard: { border: '1px solid #f1f5f9', borderRadius: '15px', padding: '20px', marginBottom: '20px', position: 'relative' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  badge: { fontSize: '10px', fontWeight: 'bold', color: '#673ab7', background: '#f3e8ff', padding: '4px 10px', borderRadius: '6px' },
  btnTrash: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '18px', fontWeight: 'bold', outline: 'none', marginBottom: '15px' },
  textArea: { width: '100%', minHeight: '100px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', outline: 'none', background: '#f8fafc', fontSize: '14px' },
  deadlineSection: { marginTop: '15px', padding: '12px', background: '#fdf4ff', borderRadius: '10px', border: '1px dashed #d8b4fe' },
  checkboxLabel: { fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, color: '#673ab7', cursor: 'pointer' },
  deadlineInputs: { display: 'flex', gap: 15, marginTop: 10 },
  inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: 5 },
  labelSmall: { fontSize: '11px', color: '#64748b' },
  dateInputSmall: { padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' },
  quizCard: { border: '1px solid #e2e8f0', background: '#fcfcfd', borderRadius: '15px', padding: '20px', marginBottom: '20px' },
  optGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  optItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent' },
  fabBar: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', background: '#1e293b', padding: '12px 25px', borderRadius: '25px', alignItems: 'center', zIndex: 999 },
  fab: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' },
  btnSaveFab: { background: '#673ab7', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }
};

export default ManageMateri;