import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { 
  Plus, Trash2, CheckCircle, ArrowLeft, Save, 
  Layout, FileText, Sparkles, X, Wand2
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

  // === LOGIKA ENGINE: SMART PARSE AUTOMATION ===
  const handleSmartGenerate = () => {
    if (!bulkText.trim()) return;

    // Split berdasarkan pola angka di awal baris (1. atau 1) atau No. 1)
    const rawBlocks = bulkText.split(/\n(?=\d+[\.\)\s]|No\.\s*\d+)/i);
    
    const parsedQuestions = rawBlocks.map((block, index) => {
      const lines = block.trim().split('\n').filter(l => l.trim() !== "");
      if (lines.length === 0) return null;

      // Baris pertama dianggap pertanyaan (bersihkan nomor di depannya)
      const questionText = lines[0].replace(/^\d+[\.\)\s]*|No\.\s*\d+[\.\)\s]*/i, '').trim();
      
      // Ambil baris yang mengandung pola pilihan A, B, C, D atau a, b, c, d
      const optionLines = lines.slice(1).filter(l => /^[A-E][\.\)\s]/i.test(l.trim()));
      const options = optionLines.map(opt => opt.replace(/^[A-E][\.\)\s]*/i, '').trim());
      
      // Standarisasi: Pastikan ada 4 opsi (jika kurang, tambah kosong)
      const finalOptions = [...options];
      while (finalOptions.length < 4) finalOptions.push("");

      return {
        id: Date.now() + index + Math.random(),
        q: questionText,
        options: finalOptions.slice(0, 4),
        correct: 0 // Default jawaban A, guru tinggal klik mana yang benar
      };
    }).filter(Boolean);

    if (parsedQuestions.length > 0) {
      // Jika list awal kosong (hanya placeholder), ganti semua. Jika tidak, tambahkan.
      if (questions.length === 1 && questions[0].q === "") {
        setQuestions(parsedQuestions);
      } else {
        setQuestions([...questions, ...parsedQuestions]);
      }
      setBulkText("");
      setShowImport(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!modulId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "bimbel_modul", modulId), {
        quizData: questions.map(q => ({ id: q.id, question: q.q, options: q.options, correctAnswer: q.correct })),
        deadlineQuiz: quizInfo.deadline,
        updatedAt: serverTimestamp()
      });
      alert("✅ BERHASIL! " + questions.length + " Soal Tersimpan.");
      navigate(-1);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div style={st.container(isMobile)}>
      {/* MODAL SMART IMPORT */}
      {showImport && (
        <div style={st.modalOverlay}>
          <div style={st.modalContent(isMobile)}>
            <div style={st.modalHeader}>
              <h3 style={{margin:0, display:'flex', alignItems:'center', gap:10}}>
                <Wand2 size={22} color="#673ab7"/> Auto-Generate Quiz
              </h3>
              <button onClick={() => setShowImport(false)} style={st.btnClose}><X/></button>
            </div>
            <p style={{fontSize:12, color:'#64748b', marginBottom:15}}>
              Paste teks soal Anda di bawah. Sistem akan otomatis memisahkan pertanyaan dan opsi.
            </p>
            <textarea 
              style={st.bulkArea} 
              placeholder={"Contoh:\n1. Apa ibukota Indonesia?\nA. Jakarta\nB. Bandung\nC. Surabaya\nD. Medan\n\n2. Siapa presiden pertama?..."}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button onClick={handleSmartGenerate} style={st.btnGenerate}>
              PROSES {bulkText.split(/\n(?=\d+[\.\)])/).length} POTENSI SOAL
            </button>
          </div>
        </div>
      )}

      <div style={st.headerNav}>
        <button onClick={() => navigate(-1)} style={st.btnBack}><ArrowLeft size={18}/> Kembali</button>
        <div style={{display:'flex', gap:10}}>
           <button onClick={() => setShowImport(true)} style={st.btnImport}>
             <Sparkles size={18}/> Bulk Import
           </button>
           <button onClick={handleSaveQuiz} disabled={loading} style={st.btnSave}>
            <Save size={18}/> {loading ? "..." : "Simpan Kuis"}
          </button>
        </div>
      </div>

      <div style={st.infoCard}>
        <div style={st.badgeInfo}><Layout size={14}/> TERKONEKSI: {quizInfo.title}</div>
        <div style={{display:'flex', alignItems:'center', gap:10, marginTop:10}}>
            <span style={{fontSize:11, fontWeight:800, color:'#64748b'}}>DEADLINE:</span>
            <input type="datetime-local" style={st.dateInput} value={quizInfo.deadline} onChange={(e) => setQuizInfo({...quizInfo, deadline: e.target.value})} />
        </div>
      </div>

      {/* LIST PERTANYAAN */}
      <div style={{width:'100%', maxWidth:'800px'}}>
        {questions.map((item, idx) => (
          <div key={item.id} style={st.qCard}>
            <div style={st.qHeader}>
              <span style={st.qNumber}>SOAL #{idx + 1}</span>
              <button onClick={() => setQuestions(questions.filter(q => q.id !== item.id))} style={st.btnDel}><Trash2 size={16}/></button>
            </div>
            
            <textarea 
              style={st.qInput} 
              placeholder="Tulis pertanyaan..."
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
                    placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                    onChange={(e) => {
                      const newOpts = [...item.options];
                      newOpts[optIdx] = e.target.value;
                      setQuestions(questions.map(q => q.id === item.id ? {...q, options: newOpts} : q));
                    }} 
                    onClick={(e) => e.stopPropagation()} 
                  />
                  {item.correct === optIdx && <CheckCircle size={16} color="#10b981"/>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setQuestions([...questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }])} style={st.btnAdd}>
        <Plus size={18}/> Tambah Pertanyaan Manual
      </button>
    </div>
  );
};

const st = {
  container: (m) => ({ padding: '30px 20px', paddingBottom: '150px', background: '#f8fafc', minHeight: '100vh', marginLeft: m ? 0 : '260px', display: 'flex', flexDirection: 'column', alignItems: 'center' }),
  headerNav: { width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: 10 },
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:5 },
  btnSave: { background: '#673ab7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display:'flex', alignItems:'center', gap:8 },
  btnImport: { background: '#fff', color: '#673ab7', border: '1px solid #673ab7', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, cursor:'pointer' },
  infoCard: { background: 'white', width: '100%', maxWidth: '800px', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  badgeInfo: { fontSize: '10px', fontWeight: '900', color: '#673ab7', display: 'flex', gap: 5, alignItems:'center' },
  dateInput: { padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' },
  qCard: { background: 'white', width: '100%', padding: '25px', borderRadius: '24px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems:'center' },
  qNumber: { fontSize: '10px', fontWeight: '900', color: '#673ab7', background: '#f3e8ff', padding: '4px 12px', borderRadius: '8px' },
  btnDel: { background: '#fff1f2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' },
  qInput: { width: '100%', minHeight: '80px', padding: '15px', borderRadius: '15px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '14px', fontWeight: '600', marginBottom: 15, outline: 'none', resize:'vertical' },
  optGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: '12px' }),
  optItem: (act) => ({ 
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px', borderRadius: '16px', border: '2px solid', 
    borderColor: act ? '#10b981' : '#f1f5f9', background: act ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: '0.2s' 
  }),
  radioCircle: (act) => ({ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${act ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink:0 }),
  radioInner: { width: 10, height: 10, borderRadius: '50%', background: '#10b981' },
  optInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontWeight: '700', fontSize: '13px', color: '#1e293b' },
  btnAdd: { width: '100%', maxWidth: '800px', padding: '18px', border: '2px dashed #cbd5e1', background: 'white', borderRadius: '20px', fontWeight: '800', color: '#64748b', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)' },
  modalContent: (m) => ({ background: 'white', width: '100%', maxWidth: '700px', padding: '30px', borderRadius: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems:'center' },
  btnClose: { background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '50%' },
  bulkArea: { width: '100%', height: '300px', padding: '20px', borderRadius: '18px', border: '2px solid #e2e8f0', fontSize: '13px', fontFamily: 'monospace', marginBottom: 20, outline: 'none', background: '#fdfdfd' },
  btnGenerate: { width: '100%', padding: '16px', background: '#673ab7', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', letterSpacing: '0.5px' }
};

export default ManageQuiz;