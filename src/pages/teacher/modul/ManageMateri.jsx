import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
// PERBAIKAN DI SINI: Menggunakan firebase/firestore
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, Plus, Trash2, Image, Video, FileText, 
  HelpCircle, ChevronDown, ChevronUp, Clock 
} from 'lucide-react';

const ManageMateri = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [blocks, setBlocks] = useState([]); 
  const [quiz, setQuiz] = useState([]); 
  const [loading, setLoading] = useState(false);

  // LOGIKA TENGGAT WAKTU
  const [deadlineTugas, setDeadlineTugas] = useState("");
  const [deadlineQuiz, setDeadlineQuiz] = useState("");

  useEffect(() => {
    if (editId) {
      fetchExistingModul();
    }
  }, [editId]);

  const fetchExistingModul = async () => {
    try {
      const docRef = doc(db, "moduls", editId);
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

  const addBlock = (type) => {
    setBlocks([...blocks, { 
      id: Date.now(), 
      type, 
      content: "", 
      title: type === 'assignment' ? "TUGAS BARU" : "SUB-MATERI BARU" 
    }]);
  };

  const removeBlock = (id) => setBlocks(blocks.filter(b => b.id !== id));

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleSave = async () => {
    if (!title || !subject) return alert("Judul dan Mapel wajib diisi!");
    
    setLoading(true);
    
    // Validasi agar tidak ada data undefined
    const payload = {
      title: title || "",
      subject: subject || "",
      description: description || "",
      blocks: blocks.map(b => ({
        id: b.id || Date.now(),
        type: b.type || "text",
        title: b.title || "",
        content: b.content || ""
      })),
      quiz: quiz.map(q => ({
        question: q.question || "",
        options: q.options || ["", "", "", ""],
        correctAnswer: q.correctAnswer || 0
      })),
      deadlineTugas: deadlineTugas || null,
      deadlineQuiz: deadlineQuiz || null,
      updatedAt: serverTimestamp()
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "moduls", editId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "moduls"), payload);
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
      <div style={styles.topBar}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack}>Batal</button>
        <button onClick={handleSave} disabled={loading} style={styles.btnPublish}>
          <Save size={18}/> {loading ? "Menyimpan..." : "PUBLISH MODUL"}
        </button>
      </div>

      <div style={styles.formCard}>
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

        {/* INPUT TENGGAT WAKTU */}
        <div style={styles.deadlineSection}>
          <div style={styles.deadlineItem}>
            <label style={styles.label}><Clock size={14}/> Tenggat Tugas</label>
            <input 
              type="datetime-local" 
              style={styles.dateInput}
              value={deadlineTugas}
              onChange={(e) => setDeadlineTugas(e.target.value)}
            />
          </div>
          <div style={styles.deadlineItem}>
            <label style={styles.label}><Clock size={14}/> Tenggat Kuis</label>
            <input 
              type="datetime-local" 
              style={styles.dateInput}
              value={deadlineQuiz}
              onChange={(e) => setDeadlineQuiz(e.target.value)}
            />
          </div>
        </div>

        {blocks.map((block) => (
          <div key={block.id} style={styles.blockCard}>
            <div style={styles.blockHeader}>
              <span style={styles.blockBadge}>{block.type.toUpperCase()}</span>
              <button onClick={() => removeBlock(block.id)} style={styles.btnTrash}><Trash2 size={16}/></button>
            </div>
            
            <input 
              placeholder="Judul Bagian..." 
              style={styles.blockTitleInput}
              value={block.title}
              onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
            />

            {block.type === 'text' && (
              <textarea 
                placeholder="Tulis materi..." 
                style={styles.textArea}
                value={block.content}
                onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
              />
            )}

            {block.type === 'video' && (
              <input 
                placeholder="Link URL Video..." 
                style={styles.blockTitleInput}
                value={block.content}
                onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
              />
            )}

            {block.type === 'assignment' && (
              <textarea 
                placeholder="Instruksi Tugas..." 
                style={styles.textArea}
                value={block.content}
                onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
              />
            )}
          </div>
        ))}

        <div style={styles.fabContainer}>
          <button onClick={() => addBlock('text')} style={styles.fab} title="Teks"><FileText size={20}/></button>
          <button onClick={() => addBlock('video')} style={styles.fab} title="Video"><Video size={20}/></button>
          <button onClick={() => addBlock('assignment')} style={styles.fab} title="Tugas"><Save size={20}/></button>
        </div>
      </div>
    </div>
  );
};

// ... Styles tetap sama seperti sebelumnya ...
const styles = {
  container: { padding: '40px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnBack: { padding: '10px 20px', borderRadius: '10px', border: '1px solid #ddd', cursor: 'pointer', background: 'white' },
  btnPublish: { padding: '10px 25px', borderRadius: '30px', border: 'none', background: '#673ab7', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  formCard: { background: 'white', width: '100%', maxWidth: '800px', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative' },
  mainInput: { width: '100%', border: 'none', fontSize: '28px', fontWeight: 'bold', outline: 'none', color: '#1e293b' },
  subInput: { width: '100%', border: 'none', fontSize: '16px', outline: 'none', color: '#64748b', marginTop: '10px' },
  divider: { height: '1px', background: '#eee', margin: '25px 0' },
  deadlineSection: { display: 'flex', gap: '20px', marginBottom: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' },
  deadlineItem: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#673ab7', display: 'flex', alignItems: 'center', gap: '5px' },
  dateInput: { padding: '8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px' },
  blockCard: { border: '1px solid #eee', borderRadius: '15px', padding: '20px', marginBottom: '20px', position: 'relative' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  blockBadge: { fontSize: '10px', fontWeight: 'bold', color: '#673ab7', letterSpacing: '1px' },
  btnTrash: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  blockTitleInput: { width: '100%', border: 'none', fontSize: '18px', fontWeight: '600', outline: 'none', marginBottom: '15px', color: '#334155' },
  textArea: { width: '100%', minHeight: '120px', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '15px', fontSize: '14px', outline: 'none', background: '#f8fafc' },
  fabContainer: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', background: '#1e293b', padding: '12px 25px', borderRadius: '50px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  fab: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', transition: '0.2s' }
};

export default ManageMateri;