import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { 
  Plus, Trash2, CheckCircle, ArrowLeft, Save, 
  Layout, FileText, Sparkles, X 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modulId = searchParams.get('modulId');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [quizInfo, setQuizInfo] = useState({ title: '', subject: '', deadline: '' });
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (modulId) {
      const fetchCurrentData = async () => {
        try {
          const snap = await getDoc(doc(db, "bimbel_modul", modulId));
          if (snap.exists()) {
            const data = snap.data();
            setQuizInfo({ title: data.title || "", subject: data.subject || "", deadline: data.deadlineQuiz || "" });
            if (data.quizData?.length > 0) {
              setQuestions(data.quizData.map((q, idx) => ({
                id: q.id || Date.now() + idx, q: q.question, options: q.options, correct: q.correctAnswer
              })));
            } else {
              setQuestions([{ id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }]);
            }
          }
        } catch (err) { console.error(err); }
      };
      fetchCurrentData();
    }
  }, [modulId]);

  // LOGIKA SMART GENERATE (MEMISAHKAN SOAL & JAWABAN)
  const handleSmartGenerate = () => {
    if (!bulkText.trim()) return;
    
    // Regex untuk mendeteksi angka soal (1. atau 1) ) dan opsi (A. atau a.)
    const rawBlocks = bulkText.split(/\n(?=\d+[\.\)])/); 
    const parsedQuestions = rawBlocks.map((block, index) => {
      const lines = block.trim().split('\n');
      const questionText = lines[0].replace(/^\d+[\.\)]\s*/, '');
      
      // Ambil opsi A, B, C, D
      const optionLines = lines.slice(1).filter(l => /^[A-E][\.\)]/i.test(l.trim()));
      const options = optionLines.map(opt => opt.replace(/^[A-E][\.\)]\s*/i, '').trim());
      
      // Pastikan selalu ada 4 slot opsi
      while (options.length < 4) options.push("");

      return {
        id: Date.now() + index,
        q: questionText,
        options: options.slice(0, 4),
        correct: 0 // Default jawaban pertama, guru tinggal ganti klik
      };
    });

    setQuestions([...questions, ...parsedQuestions].filter(q => q.q !== ""));
    setBulkText("");
    setShowImport(false);
  };

  const handleSaveQuiz = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "bimbel_modul", modulId), {
        quizData: questions.map(q => ({ id: q.id, question: q.q, options: q.options, correctAnswer: q.correct })),
        deadlineQuiz: quizInfo.deadline,
        updatedAt: serverTimestamp()
      });
      alert("✅ KUIS BERHASIL DISIMPAN!");
      navigate(-1);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div style={st.container(isMobile)}>
      {/* MODAL IMPORT */}
      {showImport && (
        <div style={st.modalOverlay}>
          <div style={st.modalContent(isMobile)}>
            <div style={st.modalHeader}>
              <h3 style={{margin:0}}><Sparkles size={20} color="#673ab7"/> Smart Bulk Import</h3>
              <button onClick={() => setShowImport(false)} style={st.btnClose}><X/></button>
            </div>
            <p style={{fontSize:12, color:'#64748b'}}>Paste soal dengan format: <b>1. Pertanyaan (Enter) A. Opsi A (Enter) B. Opsi B...</b></p>
            <textarea 
              style={st.bulkArea} 
              placeholder="Contoh:&#10;1. Siapa penemu lampu?&#10;A. Edison&#10;B. Tesla&#10;C. Newton&#10;D. Einstein"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button onClick={handleSmartGenerate} style={st.btnGenerate}>GENERATE SEKARANG</button>
          </div>
        </div>
      )}

      <div style={st.headerNav}>
        <button onClick={() => navigate(-1)} style={st.btnBack}><ArrowLeft size={18}/> Kembali</button>
        <div style={{display:'flex', gap:10}}>
           <button onClick={() => setShowImport(true)} style={st.btnImport}><FileText size={18}/> Bulk Import</button>
           <button onClick={handleSaveQuiz} disabled={loading} style={st.btnSave}>
            <Save size={18}/> {loading ? "..." : "Simpan"}
          </button>
        </div>
      </div>

      <div style={st.infoCard}>
        <div style={st.badgeInfo}><Layout size={14}/> MATERI: {quizInfo.title}</div>
        <input type="datetime-local" style={st.dateInput} value={quizInfo.deadline} onChange={(e) => setQuizInfo({...quizInfo, deadline: e.target.value})} />
      </div>

      {questions.map((item, idx) => (
        <div key={item.id} style={st.qCard}>
          <div style={st.qHeader}>
            <span style={st.qNumber}>PERTANYAAN #{idx + 1}</span>
            <button onClick={() => setQuestions(questions.filter(q => q.id !== item.id))} style={st.btnDel}><Trash2 size={16}/></button>
          </div>
          <textarea 
            style={st.qInput} 
            value={item.q} 
            onChange={(e) => setQuestions(questions.map(q => q.id === item.id ? {...q, q: e.target.value} : q))} 
          />
          <div style={st.optGrid(isMobile)}>
            {item.options.map((opt, optIdx) => (
              <div 
                key={optIdx} 
                onClick={() => setQuestions(questions.map(q => q.id === item.id ? {...q, correct: optIdx} : q))}
                style={st.optItem(item.correct === optIdx)}
              >
                <div style={st.radioCircle(item.correct === optIdx)}>
                  {item.correct === optIdx && <div style={st.radioInner}/>}
                </div>
                <input 
                  style={st.optInput} 
                  value={opt} 
                  placeholder={`Jawaban ${optIdx + 1}`}
                  onChange={(e) => {
                    const newOpts = [...item.options];
                    newOpts[optIdx] = e.target.value;
                    setQuestions(questions.map(q => q.id === item.id ? {...q, options: newOpts} : q));
                  }} 
                />
                {item.correct === optIdx && <CheckCircle size={16} color="#10b981"/>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={() => setQuestions([...questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }])} style={st.btnAdd}>
        <Plus size={18}/> Tambah Soal Manual
      </button>
    </div>
  );
};

const st = {
  container: (m) => ({ padding: '30px 20px', paddingBottom: '150px', background: '#f8fafc', minHeight: '100vh', marginLeft: m ? 0 : '260px', display: 'flex', flexDirection: 'column', alignItems: 'center' }),
  headerNav: { width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  btnSave: { background: '#673ab7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  btnImport: { background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
  infoCard: { background: 'white', width: '100%', maxWidth: '800px', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' },
  badgeInfo: { fontSize: '10px', fontWeight: '900', color: '#673ab7', marginBottom: 10, display: 'flex', gap: 5 },
  dateInput: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 'bold' },
  qCard: { background: 'white', width: '100%', maxWidth: '800px', padding: '25px', borderRadius: '24px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  qNumber: { fontSize: '10px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '4px 10px', borderRadius: '8px' },
  btnDel: { background: '#fff1f2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' },
  qInput: { width: '100%', minHeight: '80px', padding: '15px', borderRadius: '15px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '14px', fontWeight: '600', marginBottom: 15, outline: 'none' },
  optGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: '12px' }),
  optItem: (act) => ({ 
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px', borderRadius: '16px', border: '2px solid', 
    borderColor: act ? '#10b981' : '#f1f5f9', background: act ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: '0.2s' 
  }),
  radioCircle: (act) => ({ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${act ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  radioInner: { width: 10, height: 10, borderRadius: '50%', background: '#10b981' },
  optInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontWeight: '700', fontSize: '13px' },
  btnAdd: { width: '100%', maxWidth: '800px', padding: '18px', border: '2px dashed #cbd5e1', background: 'white', borderRadius: '20px', fontWeight: '800', color: '#64748b', cursor: 'pointer' },
  // Modal Styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
  modalContent: (m) => ({ background: 'white', width: '100%', maxWidth: '600px', padding: '25px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  btnClose: { background: 'none', border: 'none', cursor: 'pointer' },
  bulkArea: { width: '100%', height: '250px', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'monospace', marginBottom: 15, outline: 'none' },
  btnGenerate: { width: '100%', padding: '15px', background: '#673ab7', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }
};

export default ManageQuiz;