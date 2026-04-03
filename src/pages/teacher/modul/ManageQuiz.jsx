import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { 
  Plus, Trash2, CheckCircle, ArrowLeft, Save, 
  Layout, FileText, Sparkles, X, Wand2, Calculator
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Library Matematika
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

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
            setQuizInfo({ 
              title: data.title || "", 
              subject: data.subject || "", 
              deadline: data.deadlineQuiz || "" 
            });
            if (data.quizData && data.quizData.length > 0) {
              setQuestions(data.quizData.map((q, idx) => ({
                id: q.id || Date.now() + idx + Math.random(), 
                q: q.question, 
                options: q.options, 
                correct: q.correctAnswer || 0
              })));
            } else {
              setQuestions([{ id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }]);
            }
          }
        } catch (err) { console.error("Firestore Fetch Error:", err); }
      };
      fetchCurrentData();
    }
  }, [modulId]);

  const renderMath = (text) => {
    if (!text) return null;
    const parts = text.split(/(\$.*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        try {
          return <InlineMath key={i} math={part.substring(1, part.length - 1)} />;
        } catch (e) {
          return <span key={i} style={{color:'red'}}>{part}</span>;
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleSmartGenerate = () => {
    if (!bulkText.trim()) return;
    // Regex lebih kuat untuk menangkap angka soal dan pilihan A-D/E
    const rawBlocks = bulkText.split(/\n(?=\d+[\.\)\s])/);
    
    const parsedQuestions = rawBlocks.map((block, index) => {
      const lines = block.trim().split('\n').filter(l => l.trim() !== "");
      if (lines.length === 0) return null;

      const questionText = lines[0].replace(/^\d+[\.\)\s]*/, '').trim();
      const optionLines = lines.slice(1).filter(l => /^[A-E][\.\)\s]/i.test(l.trim()));
      
      const options = optionLines.map(opt => opt.replace(/^[A-E][\.\)\s]*/i, '').trim());
      const finalOptions = [...options];
      while (finalOptions.length < 4) finalOptions.push("");

      return {
        id: Date.now() + index + Math.random(),
        q: questionText,
        options: finalOptions.slice(0, 4),
        correct: 0
      };
    }).filter(Boolean);

    if (parsedQuestions.length > 0) {
      setQuestions(prev => (prev.length === 1 && prev[0].q === "") ? parsedQuestions : [...prev, ...parsedQuestions]);
      setBulkText("");
      setShowImport(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!modulId) return alert("Modul ID tidak ditemukan!");
    setLoading(true);
    try {
      await updateDoc(doc(db, "bimbel_modul", modulId), {
        quizData: questions.map(q => ({ 
          id: q.id, 
          question: q.q, 
          options: q.options, 
          correctAnswer: q.correct 
        })),
        deadlineQuiz: quizInfo.deadline,
        updatedAt: serverTimestamp()
      });
      alert("✅ DATA TERSIMPAN: " + questions.length + " Soal berhasil diperbarui.");
      navigate(-1);
    } catch (err) { 
      alert("Gagal menyimpan: " + err.message); 
    }
    setLoading(false);
  };

  return (
    <div style={st.container(isMobile)}>
      {showImport && (
        <div style={st.modalOverlay}>
          <div style={st.modalContent(isMobile)}>
            <div style={st.modalHeader}>
              <h3 style={{margin:0, display:'flex', alignItems:'center', gap:10}}><Wand2 size={20} color="#673ab7"/> Bulk Math Importer</h3>
              <button onClick={() => setShowImport(false)} style={st.btnClose}><X/></button>
            </div>
            <div style={st.mathHint}>
              Format: <b>1. Soal $x^2$ (Enter) A. Opsi 1 (Enter) B. Opsi 2...</b>
            </div>
            <textarea 
              style={st.bulkArea} 
              placeholder="Contoh:&#10;1. Berapa hasil $\sqrt{64}$?&#10;A. 6&#10;B. 8&#10;C. 10&#10;D. 12"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button onClick={handleSmartGenerate} style={st.btnGenerate}>PROSES & IMPORT</button>
          </div>
        </div>
      )}

      <div style={st.headerNav}>
        <button onClick={() => navigate(-1)} style={st.btnBack}><ArrowLeft size={18}/> Batal</button>
        <div style={{display:'flex', gap:10}}>
           <button onClick={() => setShowImport(true)} style={st.btnImport}><Calculator size={18}/> Bulk Import</button>
           <button onClick={handleSaveQuiz} disabled={loading} style={st.btnSave}>
            <Save size={18}/> {loading ? "..." : "Simpan Kuis"}
          </button>
        </div>
      </div>

      <div style={st.infoCard}>
        <div style={st.badgeInfo}><Layout size={14}/> MODUL ID: {modulId}</div>
        <div style={{marginTop:10}}>
          <label style={{fontSize:11, fontWeight:800, color:'#64748b', display:'block', marginBottom:5}}>BATAS WAKTU (DEADLINE):</label>
          <input type="datetime-local" style={st.dateInput} value={quizInfo.deadline} onChange={(e) => setQuizInfo({...quizInfo, deadline: e.target.value})} />
        </div>
      </div>

      <div style={{width:'100%', maxWidth:'800px'}}>
        {questions.map((item, idx) => (
          <div key={item.id} style={st.qCard}>
            <div style={st.qHeader}>
              <span style={st.qNumber}>SOAL NOMOR {idx + 1}</span>
              <button onClick={() => setQuestions(questions.filter(q => q.id !== item.id))} style={st.btnDel}><Trash2 size={16}/></button>
            </div>
            
            <textarea 
              style={st.qInput} 
              placeholder="Tulis soal di sini... (Gunakan $ untuk rumus)"
              value={item.q} 
              onChange={(e) => setQuestions(questions.map(q => q.id === item.id ? {...q, q: e.target.value} : q))} 
            />

            <div style={st.mathPreview}>
               <span style={{fontSize:9, fontWeight:900, color:'#94a3b8', display:'block', marginBottom:5}}>VISUAL PREVIEW:</span>
               {renderMath(item.q)}
            </div>

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
                  <div style={{flex:1}}>
                    <input 
                      style={st.optInput} 
                      value={opt} 
                      placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                      onChange={(e) => {
                        const newOpts = [...item.options];
                        newOpts[optIdx] = e.target.value;
                        setQuestions(questions.map(q => q.id === item.id ? {...q, options: newOpts} : q));
                      }} 
                      onClick={(e) => e.stopPropagation()} 
                    />
                    <div style={{fontSize:12, marginTop:4, color:'#475569'}}>{renderMath(opt)}</div>
                  </div>
                  {item.correct === optIdx && <CheckCircle size={16} color="#10b981"/>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setQuestions([...questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }])} style={st.btnAdd}>
        <Plus size={18}/> Tambah Soal Baru
      </button>
    </div>
  );
};

const st = {
  container: (m) => ({ padding: '30px 20px', paddingBottom: '150px', background: '#f8fafc', minHeight: '100vh', marginLeft: m ? 0 : '260px', display: 'flex', flexDirection: 'column', alignItems: 'center' }),
  headerNav: { width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  btnSave: { background: '#673ab7', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  btnImport: { background: '#fff', color: '#673ab7', border: '1px solid #673ab7', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, cursor:'pointer' },
  infoCard: { background: 'white', width: '100%', maxWidth: '800px', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' },
  badgeInfo: { fontSize: '10px', fontWeight: '900', color: '#673ab7', display: 'flex', gap: 5, alignItems:'center' },
  dateInput: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', outline:'none', fontSize:'14px' },
  qCard: { background: 'white', width: '100%', padding: '25px', borderRadius: '24px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  qNumber: { fontSize: '10px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '4px 12px', borderRadius: '8px' },
  btnDel: { background: '#fff1f2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' },
  qInput: { width: '100%', minHeight: '80px', padding: '15px', borderRadius: '15px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '15px', fontWeight: '600', outline: 'none', marginBottom: 10 },
  mathPreview: { padding: '15px', background: '#f1f5f9', borderRadius: '12px', marginBottom: 15, border: '1px solid #e2e8f0' },
  optGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: '12px' }),
  optItem: (act) => ({ 
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px', borderRadius: '16px', border: '2px solid', 
    borderColor: act ? '#10b981' : '#f1f5f9', background: act ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: '0.2s'
  }),
  radioCircle: (act) => ({ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${act ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink:0 }),
  radioInner: { width: 10, height: 10, borderRadius: '50%', background: '#10b981' },
  optInput: { width:'100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '700', fontSize: '13px' },
  btnAdd: { width: '100%', maxWidth: '800px', padding: '18px', border: '2px dashed #cbd5e1', background: 'white', borderRadius: '20px', fontWeight: '800', color: '#64748b', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)' },
  modalContent: (m) => ({ background: 'white', width: '100%', maxWidth: '600px', padding: '30px', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  mathHint: { background: '#eef2ff', padding: '12px', borderRadius: '12px', fontSize: '11px', color: '#4338ca', marginBottom: 15, lineHeight:'1.5' },
  btnClose: { background: 'none', border: 'none', cursor: 'pointer' },
  bulkArea: { width: '100%', height: '250px', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'monospace', marginBottom: 15, outline: 'none' },
  btnGenerate: { width: '100%', padding: '15px', background: '#673ab7', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }
};

export default ManageQuiz;