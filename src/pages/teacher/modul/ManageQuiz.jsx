import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { HelpCircle, Plus, Trash2, CheckCircle, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quizInfo, setQuizInfo] = useState({ title: '', subject: '', deadline: '' });
  const [questions, setQuestions] = useState([
    { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }]);
  };

  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQ = (id, val) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, q: val } : q));
  };

  const updateOpt = (qId, optIdx, val) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleSaveQuiz = async () => {
    if (!quizInfo.title || !quizInfo.subject) return alert("Judul dan Mapel wajib diisi!");
    
    setLoading(true);
    try {
      // SINKRON: Simpan ke koleksi "moduls" agar muncul di ModulManager
      await addDoc(collection(db, "moduls"), {
        title: quizInfo.title,
        subject: quizInfo.subject,
        description: `Kuis Interaktif: ${quizInfo.title}`,
        deadlineQuiz: quizInfo.deadline,
        type: 'quiz',
        // Masukkan soal ke field quiz sesuai struktur Firestore kamu
        quiz: questions.map(q => ({
          question: q.q,
          options: q.options,
          correctAnswer: q.correct
        })),
        blocks: [], // Kosongkan blocks karena ini tipe kuis murni
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert("🚀 Kuis Berhasil Dipublikasikan!");
      navigate('/guru/modul');
    } catch (err) {
      alert("Gagal simpan kuis: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerNav}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack}><ArrowLeft size={18}/> Batal</button>
        <button onClick={handleSaveQuiz} disabled={loading} style={styles.btnSave}>
          <Save size={18}/> {loading ? "Menyimpan..." : "Publish Kuis"}
        </button>
      </div>

      <div style={styles.setupCard}>
        <h2 style={{display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 20px 0'}}><HelpCircle color="#673ab7"/> Buat Kuis Baru</h2>
        <input 
          style={styles.mainInput} 
          placeholder="Judul Kuis (Misal: Kuis Harian Biologi)" 
          onChange={(e) => setQuizInfo({...quizInfo, title: e.target.value})}
        />
        <div style={{display: 'flex', gap: 15, marginTop: 15}}>
          <input 
            style={styles.subInput} 
            placeholder="Mata Pelajaran" 
            onChange={(e) => setQuizInfo({...quizInfo, subject: e.target.value})}
          />
          <input 
            type="datetime-local" 
            style={styles.subInput} 
            onChange={(e) => setQuizInfo({...quizInfo, deadline: e.target.value})}
          />
        </div>
      </div>

      {questions.map((item, idx) => (
        <div key={item.id} style={styles.qCard}>
          <div style={styles.qHeader}>
            <span style={styles.qNumber}>PERTANYAAN #{idx + 1}</span>
            <button onClick={() => removeQuestion(item.id)} style={styles.btnDel}><Trash2 size={16}/></button>
          </div>
          <textarea 
            style={styles.qInput} 
            placeholder="Ketik soal kuis di sini..." 
            value={item.q}
            onChange={(e) => updateQ(item.id, e.target.value)}
          />
          <div style={styles.optGrid}>
            {item.options.map((opt, optIdx) => (
              <div key={optIdx} style={{...styles.optItem, borderColor: item.correct === optIdx ? '#673ab7' : '#e2e8f0'}}>
                <input 
                  type="radio" 
                  checked={item.correct === optIdx} 
                  onChange={() => setQuestions(questions.map(q => q.id === item.id ? {...q, correct: optIdx} : q))} 
                />
                <input 
                  style={styles.optInput} 
                  placeholder={`Opsi ${optIdx + 1}`} 
                  value={opt}
                  onChange={(e) => updateOpt(item.id, optIdx, e.target.value)}
                />
                {item.correct === optIdx && <CheckCircle size={14} color="#673ab7"/>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={addQuestion} style={styles.btnAdd}>
        <Plus size={18}/> Tambah Pertanyaan
      </button>
    </div>
  );
};

const styles = {
  container: { padding: '40px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  headerNav: { width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnBack: { background: 'white', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' },
  btnSave: { background: '#673ab7', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  setupCard: { background: 'white', width: '100%', maxWidth: '700px', padding: '30px', borderRadius: '20px', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  mainInput: { width: '100%', fontSize: '20px', fontWeight: 'bold', border: 'none', borderBottom: '2px solid #eee', outline: 'none', paddingBottom: 10 },
  subInput: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' },
  qCard: { background: 'white', width: '100%', maxWidth: '700px', padding: '25px', borderRadius: '20px', marginBottom: '20px', position: 'relative' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  qNumber: { fontSize: '12px', fontWeight: 'bold', color: '#673ab7' },
  btnDel: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  qInput: { width: '100%', minHeight: '80px', padding: '15px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', marginBottom: 20 },
  optGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  optItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px', border: '1px solid #eee', borderRadius: '10px' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '13px' },
  btnAdd: { width: '100%', maxWidth: '700px', padding: '15px', border: '2px dashed #673ab7', color: '#673ab7', background: 'transparent', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }
};

export default ManageQuiz;