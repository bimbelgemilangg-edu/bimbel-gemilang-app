import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  doc, getDoc, updateDoc, serverTimestamp 
} from "firebase/firestore"; 
import { 
  HelpCircle, Plus, Trash2, CheckCircle, 
  ArrowLeft, Save, AlertCircle, Layout 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modulId = searchParams.get('modulId');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!modulId);
  const [quizInfo, setQuizInfo] = useState({ title: '', subject: '', deadline: '' });
  const [questions, setQuestions] = useState([
    { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }
  ]);

  const COLLECTION_NAME = "bimbel_modul";

  // Handle Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (modulId) {
      const fetchCurrentData = async () => {
        try {
          const snap = await getDoc(doc(db, COLLECTION_NAME, modulId));
          if (snap.exists()) {
            const data = snap.data();
            setQuizInfo({
              title: data.title || "Kuis Tanpa Judul",
              subject: data.subject || "Umum",
              deadline: data.deadlineQuiz || ""
            });
            
            if (data.quizData && data.quizData.length > 0) {
              setQuestions(data.quizData.map((q, idx) => ({
                id: q.id || Date.now() + idx,
                q: q.question || '',
                options: q.options || ['', '', '', ''],
                correct: q.correctAnswer || 0
              })));
            }
          }
        } catch (err) {
          console.error("Gagal load data:", err);
        } finally {
          setFetching(false);
        }
      };
      fetchCurrentData();
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
    if (!modulId) return alert("Error: ID Materi tidak ditemukan!");
    setLoading(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, modulId);
      await updateDoc(docRef, {
        quizData: questions.map(q => ({
          id: q.id,
          question: q.q,
          options: q.options,
          correctAnswer: q.correct
        })),
        deadlineQuiz: quizInfo.deadline,
        updatedAt: serverTimestamp()
      });
      alert("🚀 Kuis Berhasil Disinkronkan!");
      navigate(-1);
    } catch (err) {
      alert("Gagal sinkron: " + err.message);
    }
    setLoading(false);
  };

  if (fetching) return <div style={styles.loadingFull}>Sinkronisasi Data Kuis...</div>;

  return (
    <div style={styles.container(isMobile)}>
      {/* Tombol Navigasi Atas */}
      <div style={styles.headerNav}>
        <button onClick={() => navigate(-1)} style={styles.btnBack}><ArrowLeft size={18}/> Batal</button>
        <button onClick={handleSaveQuiz} disabled={loading} style={styles.btnSave}>
          <Save size={18}/> {loading ? "..." : "Simpan Kuis"}
        </button>
      </div>

      <div style={styles.infoCard}>
        <div style={styles.badgeInfo}><Layout size={14}/> TERKONEKSI KE MATERI</div>
        <h2 style={styles.infoTitle}>{quizInfo.title}</h2>
        <p style={styles.infoSub}>{quizInfo.subject.toUpperCase()}</p>
        
        <div style={styles.deadlineBox}>
           <label style={styles.label}>Batas Waktu Pengerjaan:</label>
           <input 
             type="datetime-local" 
             style={styles.dateInput} 
             value={quizInfo.deadline}
             onChange={(e) => setQuizInfo({...quizInfo, deadline: e.target.value})}
           />
        </div>
      </div>

      {questions.map((item, idx) => (
        <div key={item.id} style={styles.qCard}>
          <div style={styles.qHeader}>
            <span style={styles.qNumber}>SOAL #{idx + 1}</span>
            <button onClick={() => removeQuestion(item.id)} style={styles.btnDel}><Trash2 size={16}/></button>
          </div>
          <textarea 
            style={styles.qInput} 
            placeholder="Tulis soal kuis di sini..." 
            value={item.q}
            onChange={(e) => updateQ(item.id, e.target.value)}
          />
          <div style={styles.optGrid(isMobile)}>
            {item.options.map((opt, optIdx) => {
              const inputId = `radio-${item.id}-${optIdx}`;
              return (
                <div key={optIdx} style={{
                  ...styles.optItem, 
                  borderColor: item.correct === optIdx ? '#10b981' : '#e2e8f0',
                  background: item.correct === optIdx ? '#f0fdf4' : '#fff'
                }}>
                  <input 
                    type="radio" 
                    id={inputId}
                    name={`correct-${item.id}`}
                    checked={item.correct === optIdx} 
                    onChange={() => setQuestions(prev => prev.map(q => q.id === item.id ? {...q, correct: optIdx} : q))} 
                  />
                  <input 
                    style={styles.optInput} 
                    placeholder={`Pilihan ${optIdx + 1}`} 
                    value={opt}
                    onChange={(e) => updateOpt(item.id, optIdx, e.target.value)}
                  />
                  <label htmlFor={inputId} style={{cursor:'pointer'}}>
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

      {!modulId && (
        <div style={styles.errorBanner}>
          <AlertCircle size={20}/> 
          Editor ini harus diakses melalui Kelola Materi.
        </div>
      )}
    </div>
  );
};

const styles = {
  // FIXED: Ditambahkan marginLeft agar tidak tertutup sidebar
  container: (m) => ({ 
    padding: '40px 20px', 
    background: '#f8fafc', 
    minHeight: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center',
    marginLeft: m ? '0' : '260px', // Sesuaikan lebar sidebar Anda
    paddingBottom: '120px', // Ruang agar tidak tertutup elemen bawah
    transition: 'margin 0.3s ease'
  }),
  loadingFull: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#64748b' },
  headerNav: { width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', zIndex: 10 },
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display:'flex', alignItems:'center', gap:8, fontWeight:'700', fontSize:'13px' },
  btnSave: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(103, 58, 183, 0.3)' },
  infoCard: { background: 'white', width: '100%', maxWidth: '800px', padding: '25px', borderRadius: '24px', marginBottom: '25px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  badgeInfo: { background: '#f1f5f9', color: '#64748b', padding: '5px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', width: 'fit-content', marginBottom: 10, display:'flex', alignItems:'center', gap:5 },
  infoTitle: { margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' },
  infoSub: { margin: '5px 0 20px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' },
  deadlineBox: { borderTop: '1px solid #f1f5f9', paddingTop: 15 },
  label: { display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: 8 },
  dateInput: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontWeight: '700' },
  qCard: { background: 'white', width: '100%', maxWidth: '800px', padding: '25px', borderRadius: '24px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  qNumber: { fontSize: '11px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '4px 12px', borderRadius: '8px' },
  btnDel: { background: '#fff1f2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '10px' },
  qInput: { width: '100%', minHeight: '90px', padding: '18px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9', outline: 'none', marginBottom: 20, fontSize: '14px', fontWeight: '600', lineHeight: '1.5' },
  optGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: '12px' }),
  optItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px', border: '2px solid', borderRadius: '16px', transition: '0.2s' },
  optInput: { flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontWeight: '700', background: 'transparent' },
  circleCheck: { width: 18, height: 18, borderRadius: '50%', border: '2px solid #cbd5e1' },
  btnAdd: { width: '100%', maxWidth: '800px', padding: '18px', border: '2px dashed #cbd5e1', color: '#64748b', background: 'white', borderRadius: '20px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '20px' },
  errorBanner: { marginTop: 20, color: '#ef4444', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }
};

export default ManageQuiz;