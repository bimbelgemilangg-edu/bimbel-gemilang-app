import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, addDoc, doc, getDoc, updateDoc, 
  serverTimestamp 
} from "firebase/firestore"; 
import { HelpCircle, Plus, Trash2, CheckCircle, ArrowLeft, Save, Layout } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Ambil ID Modul jika datang dari halaman ManageMateri
  const modulId = searchParams.get('modulId');
  
  const [loading, setLoading] = useState(false);
  const [quizInfo, setQuizInfo] = useState({ title: '', subject: '', deadline: '' });
  const [questions, setQuestions] = useState([
    { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }
  ]);

  const COLLECTION_NAME = "bimbel_modul";

  // LOAD DATA JIKA EDIT KUIS DARI MATERI
  useEffect(() => {
    if (modulId) {
      const fetchCurrentQuiz = async () => {
        try {
          const snap = await getDoc(doc(db, COLLECTION_NAME, modulId));
          if (snap.exists()) {
            const data = snap.data();
            setQuizInfo({
              title: data.title || "",
              subject: data.subject || "",
              deadline: data.deadlineQuiz || ""
            });
            if (data.quizData && data.quizData.length > 0) {
              setQuestions(data.quizData.map((q, idx) => ({
                id: q.id || Date.now() + idx,
                q: q.question,
                options: q.options,
                correct: q.correctAnswer
              })));
            }
          }
        } catch (err) { console.error("Error loading quiz:", err); }
      };
      fetchCurrentQuiz();
    }
  }, [modulId]);

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }]);
  };

  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQ = (id, val) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, q: val } : q));
  };

  const updateOpt = (qId, optIdx, val) => {
    setQuestions(prev => prev.map(q => {
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
    const formattedQuizData = questions.map(q => ({
      id: q.id,
      question: q.q,
      options: q.options,
      correctAnswer: q.correct,
      hasDeadline: !!quizInfo.deadline
    }));

    try {
      if (modulId) {
        // UPDATE KUIS DI DALAM MATERI YANG SUDAH ADA
        await updateDoc(doc(db, COLLECTION_NAME, modulId), {
          quizData: formattedQuizData,
          deadlineQuiz: quizInfo.deadline,
          updatedAt: serverTimestamp()
        });
        alert("🚀 Kuis di dalam Modul berhasil diperbarui!");
      } else {
        // BUAT MODUL TIPE KUIS BARU
        await addDoc(collection(db, COLLECTION_NAME), {
          title: quizInfo.title.toUpperCase(),
          subject: quizInfo.subject.toUpperCase(),
          type: 'quiz',
          blocks: [], 
          quizData: formattedQuizData,
          deadlineQuiz: quizInfo.deadline,
          authorName: localStorage.getItem('userName') || "Admin Guru",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert("🚀 Kuis Baru Berhasil Dipublikasikan!");
      }
      navigate('/guru/modul');
    } catch (err) {
      alert("Gagal simpan kuis: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerNav}>
        <button onClick={() => navigate(-1)} style={styles.btnBack}><ArrowLeft size={18}/> Kembali</button>
        <div style={{display:'flex', gap: 10}}>
           {modulId && <span style={styles.badgeEdit}><Layout size={14}/> Editing Linked Quiz</span>}
           <button onClick={handleSaveQuiz} disabled={loading} style={styles.btnSave}>
             <Save size={18}/> {loading ? "..." : "Simpan Kuis"}
           </button>
        </div>
      </div>

      <div style={styles.setupCard}>
        <h2 style={{display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 20px 0', fontSize:'18px'}}>
          <HelpCircle color="#673ab7"/> {modulId ? "Update Detail Kuis" : "Buat Kuis Baru"}
        </h2>
        <input 
          style={styles.mainInput} 
          placeholder="Judul Kuis..." 
          value={quizInfo.title}
          onChange={(e) => setQuizInfo({...quizInfo, title: e.target.value})}
        />
        <div style={{display: 'flex', gap: 15, marginTop: 15, flexWrap:'wrap'}}>
          <input 
            style={styles.subInput} 
            placeholder="Mata Pelajaran" 
            value={quizInfo.subject}
            onChange={(e) => setQuizInfo({...quizInfo, subject: e.target.value})}
          />
          <div style={styles.dateWrapper}>
            <span style={{fontSize:'10px', color:'#64748b', fontWeight:'800'}}>DEADLINE:</span>
            <input 
              type="datetime-local" 
              style={styles.dateInput} 
              value={quizInfo.deadline}
              onChange={(e) => setQuizInfo({...quizInfo, deadline: e.target.value})}
            />
          </div>
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
            {item.options.map((opt, optIdx) => {
              const uniqueInputId = `radio-${item.id}-${optIdx}`;
              return (
                <div key={optIdx} style={{
                  ...styles.optItem, 
                  borderColor: item.correct === optIdx ? '#10b981' : '#e2e8f0', 
                  background: item.correct === optIdx ? '#f0fdf4' : '#fff'
                }}>
                  <input 
                    type="radio" 
                    id={uniqueInputId}
                    name={`correct-${item.id}`}
                    checked={item.correct === optIdx} 
                    onChange={() => setQuestions(prev => prev.map(q => q.id === item.id ? {...q, correct: optIdx} : q))} 
                  />
                  <input 
                    style={styles.optInput} 
                    placeholder={`Opsi ${optIdx + 1}`} 
                    value={opt}
                    onChange={(e) => updateOpt(item.id, optIdx, e.target.value)}
                  />
                  <label htmlFor={uniqueInputId} style={{cursor:'pointer', display:'flex', alignItems:'center'}}>
                    {item.correct === optIdx ? <CheckCircle size={18} color="#10b981"/> : <div style={styles.circleCheck}/>}
                  </label>
                </div>
              );
            })}
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
  container: { padding: '40px 20px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  headerNav: { width: '100%', maxWidth: '750px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' },
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display:'flex', alignItems:'center', gap:8, fontWeight:'bold', fontSize:'13px' },
  btnSave: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow:'0 4px 12px rgba(103, 58, 183, 0.3)' },
  badgeEdit: { background:'#e0e7ff', color:'#4338ca', padding:'8px 15px', borderRadius:'10px', fontSize:'11px', fontWeight:'800', display:'flex', alignItems:'center', gap:6 },
  setupCard: { background: 'white', width: '100%', maxWidth: '750px', padding: '30px', borderRadius: '24px', marginBottom: '25px', border:'1px solid #e2e8f0' },
  mainInput: { width: '100%', fontSize: '22px', fontWeight: '900', border: 'none', borderBottom: '2px solid #f1f5f9', outline: 'none', paddingBottom: 10, color:'#1e293b' },
  subInput: { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize:'13px', fontWeight:'600' },
  dateWrapper: { flex: 1, display:'flex', flexDirection:'column', gap:4 },
  dateInput: { padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize:'12px', fontWeight:'bold', background:'#f8fafc' },
  qCard: { background: 'white', width: '100%', maxWidth: '750px', padding: '25px', borderRadius: '24px', marginBottom: '20px', border:'1px solid #e2e8f0' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  qNumber: { fontSize: '11px', fontWeight: '900', color: '#673ab7', background:'#f3e8ff', padding:'4px 12px', borderRadius:'8px' },
  btnDel: { background: '#fff1f2', border: 'none', color: '#ef4444', cursor: 'pointer', padding:'8px', borderRadius:'10px' },
  qInput: { width: '100%', minHeight: '90px', padding: '18px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9', outline: 'none', marginBottom: 20, fontSize:'14px', fontWeight:'600', lineHeight:'1.5' },
  optGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' },
  optItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px', border: '2px solid #e2e8f0', borderRadius: '16px', transition:'0.2s' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontWeight: '700', background: 'transparent' },
  circleCheck: { width: 18, height: 18, borderRadius: '50%', border: '2px solid #cbd5e1' },
  btnAdd: { width: '100%', maxWidth: '750px', padding: '18px', border: '2px dashed #cbd5e1', color: '#64748b', background: 'white', borderRadius: '20px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition:'0.2s' }
};

export default ManageQuiz;