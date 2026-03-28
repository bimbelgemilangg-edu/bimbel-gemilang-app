import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, Trash2, Video, FileText, 
  HelpCircle, Clock, ArrowLeft, Upload, 
  Calendar, Sparkles, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  // State Utama
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [releaseDate, setReleaseDate] = useState(""); 
  const [blocks, setBlocks] = useState([]); 
  const [quizData, setQuizData] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [deadlineTugas, setDeadlineTugas] = useState("");
  const [deadlineQuiz, setDeadlineQuiz] = useState("");

  const COLLECTION_NAME = "bimbel_modul";

  // Kondisi UI: Tenggat hanya muncul jika ada Tugas atau Kuis
  const hasAssignment = blocks.some(b => b.type === 'assignment');
  const hasQuiz = quizData.length > 0;

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
        setBlocks(data.blocks || (data.content ? [{id: Date.now(), type: 'text', content: data.content, title: 'Materi'}] : []));
        setQuizData(data.quizData || []);
        setDeadlineTugas(data.deadlineTugas || "");
        setDeadlineQuiz(data.deadlineQuiz || "");
      }
    } catch (err) { console.error("Error fetching:", err); }
  };

  // Logic merubah link Canva Edit ke Embed agar bisa muncul Preview
  const formatExternalLink = (url) => {
    if (url.includes('canva.com') && url.includes('/edit')) {
      return url.split('?')[0].replace('/edit', '/view?embed');
    }
    return url;
  };

  // --- MANAJEMEN KONTEN ---
  const addBlock = (type) => {
    setBlocks([...blocks, { 
      id: Date.now(), 
      type, 
      content: "", 
      title: type === 'assignment' ? "TUGAS: UPLOAD CATATAN" : "SUB-MATERI" 
    }]);
  };

  const updateBlock = (id, field, value) => {
    // Jika input adalah link, otomatis jalankan formatter
    const finalValue = field === 'content' ? formatExternalLink(value) : value;
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: finalValue } : b));
  };

  const removeBlock = (id) => setBlocks(blocks.filter(b => b.id !== id));

  const addQuizQuestion = () => {
    setQuizData([...quizData, { 
      id: Date.now(), 
      question: "", 
      options: ["", "", "", ""], 
      correctAnswer: 0 
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
      type: "materi",
      blocks,
      quizData,
      deadlineTugas: hasAssignment ? deadlineTugas : null,
      deadlineQuiz: hasQuiz ? deadlineQuiz : null,
      updatedAt: serverTimestamp()
    };

    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, COLLECTION_NAME), payload);
      }
      alert("Modul Berhasil Disimpan!");
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
        {/* Header Modul */}
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

        {/* Kotak Pengaturan Tanggal (Biru & Ungu) */}
        <div style={styles.headerDates}>
          <div style={styles.dateBox}>
            <label style={{...styles.label, color: '#3b82f6'}}><Calendar size={14}/> Tanggal Rilis Modul</label>
            <input type="datetime-local" style={styles.dateInput} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
          </div>
          
          {hasAssignment && (
            <div style={styles.dateBox}>
              <label style={styles.label}><Clock size={14}/> Tenggat Upload Catatan</label>
              <input type="datetime-local" style={styles.dateInput} value={deadlineTugas} onChange={(e) => setDeadlineTugas(e.target.value)} />
            </div>
          )}

          {hasQuiz && (
            <div style={styles.dateBox}>
              <label style={styles.label}><Clock size={14}/> Tenggat Kuis</label>
              <input type="datetime-local" style={styles.dateInput} value={deadlineQuiz} onChange={(e) => setDeadlineQuiz(e.target.value)} />
            </div>
          )}
        </div>

        {/* Render Materi/Blocks */}
        {blocks.map((block, idx) => (
          <div key={block.id} style={styles.blockCard}>
            <div style={styles.blockHeader}>
              <span style={styles.badge}>{block.type === 'assignment' ? 'UPLOAD TUGAS' : `BAGIAN ${idx + 1}`}</span>
              <button onClick={() => removeBlock(block.id)} style={styles.btnTrash}><Trash2 size={16}/></button>
            </div>
            
            <input 
              placeholder="Judul Bagian/Instruksi..." 
              style={styles.blockTitleInput}
              value={block.title}
              onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
            />
            <textarea 
              placeholder={block.type === 'video' ? "Tempel Link Canva/YouTube/PDF..." : "Tulis materi atau detail tugas..."}
              style={styles.textArea}
              value={block.content}
              onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
            />

            {/* Live Preview untuk Canva / Video agar Guru tahu link berhasil */}
            {block.content.includes('canva.com') && (
              <div style={styles.previewContainer}>
                <p style={styles.previewText}>Preview Canva Terdeteksi:</p>
                <iframe src={block.content} style={styles.previewIframe} allowFullScreen></iframe>
              </div>
            )}
          </div>
        ))}

        {/* Render Kuis */}
        {quizData.length > 0 && <h4 style={{color:'#673ab7', marginBottom: '15px', marginTop: '30px'}}>Interaktif Kuis</h4>}
        {quizData.map((q, idx) => (
          <div key={q.id} style={styles.quizCard}>
            <div style={styles.blockHeader}>
              <span style={styles.badge}>SOAL {idx + 1}</span>
              <button onClick={() => setQuizData(quizData.filter(item => item.id !== q.id))} style={styles.btnTrash}><Trash2 size={16}/></button>
            </div>
            <textarea 
              placeholder="Pertanyaan..." 
              style={{...styles.textArea, minHeight: '60px', marginBottom: '15px'}}
              value={q.question}
              onChange={(e) => setQuizData(quizData.map(item => item.id === q.id ? {...item, question: e.target.value} : item))}
            />
            <div style={styles.optGrid}>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} style={{...styles.optItem, borderColor: q.correctAnswer === oIdx ? '#673ab7' : '#e2e8f0'}}>
                  <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => setQuizData(quizData.map(item => item.id === q.id ? {...item, correctAnswer: oIdx} : item))} />
                  <input 
                    style={styles.optInput} 
                    placeholder={`Opsi ${oIdx + 1}`} 
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

        {/* Floating Bar Navigasi */}
        <div style={styles.fabBar}>
          <button onClick={() => addBlock('text')} style={styles.fab} title="Tambah Teks"><FileText size={20}/></button>
          <button onClick={() => addBlock('video')} style={styles.fab} title="Link Canva/Video"><LinkIcon size={20}/></button>
          <button onClick={() => addBlock('assignment')} style={styles.fab} title="Upload Tugas"><Upload size={20}/></button>
          <button onClick={addQuizQuestion} style={styles.fab} title="Tambah Kuis"><HelpCircle size={20}/></button>
          <div style={{width: '1px', height: '25px', background: '#475569', margin: '0 10px'}}/>
          <button onClick={handleSave} style={styles.btnSaveFab}>SAVE</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '850px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnBack: { padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  btnPublish: { padding: '10px 25px', borderRadius: '30px', border: 'none', background: '#673ab7', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  formCard: { background: 'white', width: '100%', maxWidth: '850px', padding: '40px', borderRadius: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', position: 'relative', marginBottom: '120px' },
  mainInput: { width: '100%', border: 'none', fontSize: '32px', fontWeight: 'bold', outline: 'none', color: '#1e293b' },
  subInput: { width: '100%', border: 'none', fontSize: '18px', outline: 'none', color: '#64748b', marginTop: '10px' },
  divider: { height: '1px', background: '#f1f5f9', margin: '30px 0' },
  headerDates: { display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '15px' },
  dateBox: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#673ab7', display: 'flex', alignItems: 'center', gap: 5 },
  dateInput: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' },
  blockCard: { border: '1px solid #f1f5f9', borderRadius: '15px', padding: '20px', marginBottom: '20px', position: 'relative' },
  quizCard: { border: '1px solid #e2e8f0', background: '#fcfcfd', borderRadius: '15px', padding: '20px', marginBottom: '20px' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  badge: { fontSize: '10px', fontWeight: 'bold', color: '#673ab7', background: '#f3e8ff', padding: '4px 10px', borderRadius: '6px' },
  btnTrash: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '18px', fontWeight: 'bold', outline: 'none', marginBottom: '15px' },
  textArea: { width: '100%', minHeight: '120px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', outline: 'none', background: '#f8fafc', fontSize: '14px', lineHeight: '1.6' },
  previewContainer: { marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' },
  previewText: { fontSize: '11px', color: '#64748b', marginBottom: '8px' },
  previewIframe: { width: '100%', height: '400px', border: 'none', borderRadius: '10px' },
  optGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  optItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px' },
  fabBar: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', background: '#1e293b', padding: '12px 25px', borderRadius: '25px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', alignItems: 'center', zIndex: 999 },
  fab: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', transition: '0.2s' },
  btnSaveFab: { background: '#673ab7', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }
};

export default ManageMateri;