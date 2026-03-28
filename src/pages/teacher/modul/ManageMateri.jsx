import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, Plus, Trash2, Video, FileText, 
  HelpCircle, Clock, ArrowLeft, CheckCircle
} from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  // State Utama
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [blocks, setBlocks] = useState([]); // Untuk materi (Teks/Video/Tugas)
  const [quiz, setQuiz] = useState([]); // Untuk Kuis (Daftar Pertanyaan)
  const [loading, setLoading] = useState(false);

  // State Tenggat Waktu
  const [deadlineTugas, setDeadlineTugas] = useState("");
  const [deadlineQuiz, setDeadlineQuiz] = useState("");

  // KUNCI: Sesuai gambar Firebase kamu
  const COLLECTION_NAME = "bimbel_modul";

  useEffect(() => {
    if (editId) {
      fetchExistingModul();
    }
  }, [editId]);

  const fetchExistingModul = async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, editId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || "");
        setSubject(data.subject || "");
        setDescription(data.description || "");
        setBlocks(data.blocks || []);
        setQuiz(data.quiz || []);
        setDeadlineTugas(data.deadlineTugas || "");
        setDeadlineQuiz(data.deadlineQuiz || "");
      }
    } catch (err) {
      console.error("Gagal ambil data:", err);
    }
  };

  // --- LOGIKA MATERI (BLOCKS) ---
  const addBlock = (type) => {
    setBlocks([...blocks, { 
      id: Date.now(), 
      type, 
      content: "", 
      title: type === 'assignment' ? "TUGAS BARU" : "SUB-MATERI BARU" 
    }]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => setBlocks(blocks.filter(b => b.id !== id));

  // --- LOGIKA KUIS (QUESTIONS) ---
  const addQuizQuestion = () => {
    setQuiz([...quiz, { 
      id: Date.now(), 
      question: "", 
      options: ["", "", "", ""], 
      correctAnswer: 0 
    }]);
  };

  const updateQuizQuestion = (id, field, value) => {
    setQuiz(quiz.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateQuizOption = (qId, optIdx, value) => {
    setQuiz(quiz.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const removeQuizQuestion = (id) => setQuiz(quiz.filter(q => q.id !== id));

  // --- SIMPAN DATA ---
  const handleSave = async () => {
    if (!title) return alert("Judul Modul wajib diisi!");
    
    setLoading(true);
    const payload = {
      title,
      subject: subject || "Umum",
      description: description || "",
      type: "materi",
      blocks: blocks,
      quiz: quiz,
      deadlineTugas: deadlineTugas || null,
      deadlineQuiz: deadlineQuiz || null,
      updatedAt: serverTimestamp()
    };

    try {
      if (editId) {
        await updateDoc(doc(db, COLLECTION_NAME, editId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, COLLECTION_NAME), payload);
      }
      alert("Modul Berhasil Dipublikasi!");
      navigate('/guru/modul');
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Gagal menyimpan: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* Tombol Atas */}
      <div style={styles.topBar}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack}>
           <ArrowLeft size={18}/> Kembali
        </button>
        <button onClick={handleSave} disabled={loading} style={styles.btnPublish}>
          <Save size={18}/> {loading ? "Menyimpan..." : "PUBLISH MODUL"}
        </button>
      </div>

      <div style={styles.formCard}>
        {/* Input Judul Utama */}
        <input 
          placeholder="Judul Modul..." 
          style={styles.mainInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input 
          placeholder="Mata Pelajaran (Contoh: Matematika)..." 
          style={styles.subInput}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        
        <div style={styles.divider} />

        {/* Input Deadline */}
        <div style={styles.deadlineSection}>
          <div style={styles.deadlineItem}>
            <label style={styles.label}><Clock size={14}/> Tenggat Tugas</label>
            <input type="datetime-local" style={styles.dateInput} value={deadlineTugas} onChange={(e) => setDeadlineTugas(e.target.value)} />
          </div>
          <div style={styles.deadlineItem}>
            <label style={styles.label}><Clock size={14}/> Tenggat Kuis</label>
            <input type="datetime-local" style={styles.dateInput} value={deadlineQuiz} onChange={(e) => setDeadlineQuiz(e.target.value)} />
          </div>
        </div>

        {/* Render Materi (Blocks) */}
        {blocks.map((block, idx) => (
          <div key={block.id} style={styles.blockCard}>
            <div style={styles.blockHeader}>
              <span style={styles.blockBadge}>BAGIAN {idx + 1}: {block.type.toUpperCase()}</span>
              <button onClick={() => removeBlock(block.id)} style={styles.btnTrash}><Trash2 size={16}/></button>
            </div>
            <input 
              placeholder="Judul Bagian..." 
              style={styles.blockTitleInput}
              value={block.title}
              onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
            />
            <textarea 
              placeholder={block.type === 'video' ? "Tempel Link URL Video di sini..." : "Tulis isi materi/instruksi tugas..."}
              style={styles.textArea}
              value={block.content}
              onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
            />
          </div>
        ))}

        {/* Render Kuis (Fitur Tambah Soal Kembali) */}
        {quiz.length > 0 && <h3 style={{marginTop: 40, color: '#673ab7'}}>Daftar Pertanyaan Kuis</h3>}
        {quiz.map((q, idx) => (
          <div key={q.id} style={styles.quizCard}>
            <div style={styles.blockHeader}>
              <span style={styles.blockBadge}>SOAL KUIS #{idx + 1}</span>
              <button onClick={() => removeQuizQuestion(q.id)} style={styles.btnTrash}><Trash2 size={16}/></button>
            </div>
            <textarea 
              placeholder="Ketik Pertanyaan..." 
              style={{...styles.textArea, minHeight: '60px', marginBottom: '15px'}}
              value={q.question}
              onChange={(e) => updateQuizQuestion(q.id, 'question', e.target.value)}
            />
            <div style={styles.optGrid}>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} style={{...styles.optItem, borderColor: q.correctAnswer === oIdx ? '#673ab7' : '#e2e8f0'}}>
                  <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => updateQuizQuestion(q.id, 'correctAnswer', oIdx)} />
                  <input 
                    style={styles.optInput} 
                    placeholder={`Opsi ${oIdx + 1}`} 
                    value={opt}
                    onChange={(e) => updateQuizOption(q.id, oIdx, e.target.value)}
                  />
                  {q.correctAnswer === oIdx && <CheckCircle size={14} color="#673ab7"/>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Floating Action Bar (Bar Hitam di Bawah) */}
        <div style={styles.fabContainer}>
          <button onClick={() => addBlock('text')} style={styles.fab} title="Tambah Teks"><FileText size={20}/></button>
          <button onClick={() => addBlock('video')} style={styles.fab} title="Tambah Video"><Video size={20}/></button>
          <button onClick={() => addBlock('assignment')} style={styles.fab} title="Tambah Tugas"><Save size={20}/></button>
          <button onClick={addQuizQuestion} style={styles.fab} title="Tambah Kuis"><HelpCircle size={20}/></button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnBack: { border: 'none', background: 'none', color: '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
  btnPublish: { padding: '12px 25px', borderRadius: '30px', border: 'none', background: '#673ab7', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  formCard: { background: 'white', width: '100%', maxWidth: '800px', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', marginBottom: '100px' },
  mainInput: { width: '100%', border: 'none', fontSize: '28px', fontWeight: 'bold', outline: 'none', color: '#1e293b' },
  subInput: { width: '100%', border: 'none', fontSize: '16px', outline: 'none', color: '#64748b', marginTop: '10px' },
  divider: { height: '1px', background: '#eee', margin: '25px 0' },
  deadlineSection: { display: 'flex', gap: '20px', marginBottom: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' },
  deadlineItem: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#673ab7', display: 'flex', alignItems: 'center', gap: '5px' },
  dateInput: { padding: '8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' },
  blockCard: { border: '1px solid #eee', borderRadius: '15px', padding: '20px', marginBottom: '20px' },
  quizCard: { border: '1px solid #e2e8f0', background: '#fcfcfd', borderRadius: '15px', padding: '20px', marginBottom: '20px' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  blockBadge: { fontSize: '10px', fontWeight: 'bold', color: '#673ab7', letterSpacing: '1px' },
  btnTrash: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '18px', fontWeight: '600', outline: 'none', marginBottom: '15px' },
  textArea: { width: '100%', minHeight: '100px', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '15px', fontSize: '14px', outline: 'none', background: '#f8fafc', resize: 'vertical' },
  optGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  optItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px', border: '1px solid #eee', borderRadius: '10px', background: 'white' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '13px' },
  fabContainer: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', background: '#1e293b', padding: '12px 30px', borderRadius: '50px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 1000 },
  fab: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '5px' }
};

export default ManageMateri;