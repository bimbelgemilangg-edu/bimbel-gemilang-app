import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { Plus, Trash2, CheckCircle, ArrowLeft, Save, Layout, FileText, Sparkles, X, Wand2, Calculator } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
      const fetchData = async () => {
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
        } catch (err) { console.error(err); }
      };
      fetchData();
    }
  }, [modulId]);

  const renderMath = (text) => {
    if (!text) return null;
    const parts = text.split(/(\$.*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        try { return <InlineMath key={i} math={part.substring(1, part.length - 1)} />; } 
        catch (e) { return <span key={i} style={{color:'red'}}>{part}</span>; }
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleSmartGenerate = () => {
    if (!bulkText.trim()) return;
    const rawBlocks = bulkText.split(/\n(?=\d+[\.\$\s])/);
    const parsed = rawBlocks.map((block, index) => {
      const lines = block.trim().split('\n').filter(l => l.trim() !== "");
      if (lines.length === 0) return null;
      const qt = lines[0].replace(/^\d+[\.\$\s]*/, '').trim();
      const opts = lines.slice(1).filter(l => /^[A-E][\.\$\s]/i.test(l.trim())).map(o => o.replace(/^[A-E][\.\$\s]*/i, '').trim());
      while (opts.length < 4) opts.push("");
      return { id: Date.now() + index + Math.random(), q: qt, options: opts.slice(0, 4), correct: 0 };
    }).filter(Boolean);
    if (parsed.length > 0) {
      setQuestions(prev => (prev.length === 1 && prev[0].q === "") ? parsed : [...prev, ...parsed]);
      setBulkText("");
      setShowImport(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!modulId) return alert("Modul ID tidak ditemukan!");
    const valid = questions.filter(q => q.q.trim() !== '');
    if (valid.length === 0) return alert("Minimal 1 soal harus diisi!");
    setLoading(true);
    try {
      await updateDoc(doc(db, "bimbel_modul", modulId), {
        quizData: valid.map(q => ({ id: q.id, question: q.q.trim(), options: q.options, correctAnswer: q.correct })),
        totalQuestions: valid.length,
        deadlineQuiz: quizInfo.deadline,
        updatedAt: serverTimestamp()
      });
      alert(`✅ ${valid.length} soal tersimpan!`);
      navigate(-1);
    } catch (err) { alert("Gagal: " + err.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14}/> Kembali
        </button>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' }}>
          ❓ {modulId ? 'Edit Kuis' : 'Buat Kuis'}
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowImport(true)} style={{ background: 'white', color: '#673ab7', border: '1px solid #673ab7', padding: '8px 12px', borderRadius: 8, fontWeight: 600, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calculator size={14}/> Bulk Import
          </button>
          <button onClick={handleSaveQuiz} disabled={loading} style={{ background: '#673ab7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={14}/> {loading ? '...' : `Simpan (${questions.filter(q => q.q.trim()).length})`}
          </button>
        </div>
      </div>

      {/* INFO */}
      <div style={{ background: 'white', padding: 15, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#673ab7', marginBottom: 10 }}><Layout size={12} /> Modul: {quizInfo.title || modulId || 'Mandiri'}</div>
        <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Deadline Kuis</label>
        <input type="datetime-local" value={quizInfo.deadline} onChange={e => setQuizInfo({...quizInfo, deadline: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ marginTop: 10, padding: 8, background: '#f0fdf4', borderRadius: 6, fontSize: 10, color: '#166534', fontWeight: 600 }}>
          📊 Total Soal Aktif: <strong>{questions.filter(q => q.q.trim()).length}</strong>
        </div>
      </div>

      {/* MODAL BULK IMPORT */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 550, padding: 25, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Wand2 size={18} color="#673ab7"/> Bulk Math Importer</h3>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X/></button>
            </div>
            <div style={{ background: '#eef2ff', padding: 10, borderRadius: 8, fontSize: 10, color: '#4338ca', marginBottom: 12 }}>
              Format: <b>1. Soal $x^2$ (Enter) A. Opsi 1 (Enter) B. Opsi 2...</b>
            </div>
            <textarea style={{ width: '100%', height: 220, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'monospace', marginBottom: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder={"1. Berapa hasil $\\sqrt{64}$?\nA. 6\nB. 8\nC. 10\nD. 12"}
              value={bulkText} onChange={e => setBulkText(e.target.value)}
            />
            <button onClick={handleSmartGenerate} style={{ width: '100%', padding: 12, background: '#673ab7', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>PROSES & IMPORT</button>
          </div>
        </div>
      )}

      {/* SOAL */}
      {questions.map((item, idx) => (
        <div key={item.id} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 15, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#673ab7', background: '#f3e8ff', padding: '4px 10px', borderRadius: 6 }}>SOAL {idx + 1}</span>
            <button onClick={() => setQuestions(questions.filter(q => q.id !== item.id))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={14}/></button>
          </div>
          
          <textarea style={{ width: '100%', minHeight: 60, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }}
            placeholder="Tulis soal... (Gunakan $ untuk rumus)"
            value={item.q} onChange={e => setQuestions(questions.map(q => q.id === item.id ? {...q, q: e.target.value} : q))}
          />

          {item.q && (
            <div style={{ padding: 10, background: '#f8fafc', borderRadius: 8, marginBottom: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 4 }}>PREVIEW:</span>
              {renderMath(item.q)}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {item.options.map((opt, oIdx) => (
              <div key={oIdx} onClick={() => setQuestions(questions.map(q => q.id === item.id ? {...q, correct: oIdx} : q))} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${item.correct === oIdx ? '#10b981' : '#e2e8f0'}`,
                background: item.correct === oIdx ? '#f0fdf4' : 'white'
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${item.correct === oIdx ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.correct === oIdx && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></div>}
                </div>
                <input value={opt} placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`} onChange={e => {
                  const newOpts = [...item.options];
                  newOpts[oIdx] = e.target.value;
                  setQuestions(questions.map(q => q.id === item.id ? {...q, options: newOpts} : q));
                }} onClick={e => e.stopPropagation()} style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 600, fontSize: 13, outline: 'none' }} />
                {item.correct === oIdx && <CheckCircle size={14} color="#10b981"/>}
              </div>
            ))}
          </div>
          {item.options.some(o => o) && (
            <div style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: 11, color: '#64748b' }}>
              {item.options.map((opt, oIdx) => opt && <div key={oIdx}>{String.fromCharCode(65 + oIdx)}. {renderMath(opt)}</div>)}
            </div>
          )}
        </div>
      ))}

      <button onClick={() => setQuestions([...questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }])} style={{
        width: '100%', padding: 14, border: '2px dashed #cbd5e1', background: 'white', borderRadius: 10, fontWeight: 700, color: '#64748b', cursor: 'pointer', fontSize: 13
      }}>
        <Plus size={16}/> Tambah Soal Baru
      </button>
    </div>
  );
};

export default ManageQuiz;