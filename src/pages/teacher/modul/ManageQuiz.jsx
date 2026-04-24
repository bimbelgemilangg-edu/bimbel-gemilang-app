import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Plus, Trash2, CheckCircle, ArrowLeft, Save, Layout, FileText, X, Calculator, Target, BookOpen, Users, Send } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

const ManageQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modulId = searchParams.get('modulId'); // Jika dari modul
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);
  
  // Data Quiz
  const [quizTitle, setQuizTitle] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState([{ id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }]);
  
  // Target Publish
  const [publishTarget, setPublishTarget] = useState('modul'); // 'mandiri' | 'modul' | 'jenjang'
  const [selectedModul, setSelectedModul] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedProgram, setSelectedProgram] = useState("Semua");
  
  // Data referensi
  const [modulList, setModulList] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjects, setSubjects] = useState(["Umum"]);
  
  // Bulk import
  const [showImport, setShowImport] = useState(false);
  const [bulkText, setBulkText] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 AMBIL DATA REFERENSI
  useEffect(() => {
    const fetchRefs = async () => {
      // Modul list
      const snapModul = await getDocs(query(collection(db, "bimbel_modul"), orderBy("updatedAt", "desc")));
      setModulList(snapModul.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Kelas dari siswa
      const snapSiswa = await getDocs(collection(db, "students"));
      const siswaData = snapSiswa.docs.map(d => d.data());
      const kelas = [...new Set(siswaData.map(s => s.kelasSekolah))].filter(Boolean).sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
      setAvailableClasses(kelas);
      
      // Mapel dari guru
      const snapGuru = await getDocs(collection(db, "teachers"));
      const guruData = snapGuru.docs.map(d => d.data());
      const mapel = [...new Set(guruData.map(t => t.mapel).filter(Boolean))];
      if (mapel.length === 0) mapel.push("Umum");
      setSubjects(mapel.sort());
    };
    fetchRefs();
  }, []);

  // 🔥 AMBIL DATA QUIZ JIKA EDIT
  useEffect(() => {
    if (modulId) {
      setPublishTarget('modul');
      setSelectedModul(modulId);
      const fetchQuiz = async () => {
        const snap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (snap.exists()) {
          const data = snap.data();
          setQuizTitle(data.title || "");
          setQuizSubject(data.subject || "");
          setDeadline(data.deadlineQuiz || "");
          if (data.quizData?.length > 0) {
            setQuestions(data.quizData.map((q, idx) => ({
              id: q.id || Date.now() + idx,
              q: q.question,
              options: q.options,
              correct: q.correctAnswer || 0
            })));
          }
        }
      };
      fetchQuiz();
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

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const blocks = bulkText.split(/\n(?=\d+[\.\$\s])/);
    const parsed = blocks.map((block, idx) => {
      const lines = block.trim().split('\n').filter(l => l.trim());
      if (lines.length === 0) return null;
      const qt = lines[0].replace(/^\d+[\.\$\s]*/, '').trim();
      const opts = lines.slice(1).filter(l => /^[A-E][\.\$\s]/i.test(l.trim())).map(o => o.replace(/^[A-E][\.\$\s]*/i, '').trim());
      while (opts.length < 4) opts.push("");
      return { id: Date.now() + idx, q: qt, options: opts.slice(0,4), correct: 0 };
    }).filter(Boolean);
    if (parsed.length > 0) {
      setQuestions(prev => (prev.length === 1 && prev[0].q === "") ? parsed : [...prev, ...parsed]);
      setBulkText("");
      setShowImport(false);
    }
  };

  const handleSaveQuiz = async () => {
    const valid = questions.filter(q => q.q.trim());
    if (valid.length === 0) return alert("❌ Minimal 1 soal!");
    if (!quizTitle) return alert("❌ Judul kuis wajib diisi!");
    
    setLoading(true);
    try {
      const quizPayload = {
        quizData: valid.map(q => ({ id: q.id, question: q.q.trim(), options: q.options, correctAnswer: q.correct })),
        totalQuestions: valid.length,
        deadlineQuiz: deadline || null,
        updatedAt: serverTimestamp()
      };

      if (publishTarget === 'modul') {
        // 🔥 SIMPAN KE MODUL YANG DIPILIH
        if (!selectedModul) return alert("❌ Pilih modul tujuan!");
        await updateDoc(doc(db, "bimbel_modul", selectedModul), quizPayload);
        alert(`✅ Kuis disimpan ke modul!`);
      } else {
        // 🔥 SIMPAN SEBAGAI KUIS MANDIRI
        await addDoc(collection(db, "bimbel_modul"), {
          title: quizTitle.toUpperCase(),
          subject: quizSubject || "Kuis",
          quizData: quizPayload.quizData,
          totalQuestions: quizPayload.totalQuestions,
          deadlineQuiz: deadline || null,
          type: 'kuis_mandiri',
          targetKategori: publishTarget === 'jenjang' ? selectedProgram : "Semua",
          targetKelas: publishTarget === 'jenjang' ? selectedKelas : "Semua",
          status: 'aktif',
          authorName: localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert(`✅ Kuis mandiri diterbitkan!`);
      }
      navigate(-1);
    } catch (err) { alert("❌ Gagal: " + err.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14}/> Kembali
        </button>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#1e293b' }}>
          ❓ {modulId ? 'Edit Kuis Modul' : 'Buat Kuis Baru'}
        </h2>
        <button onClick={handleSaveQuiz} disabled={loading} style={{ background: '#673ab7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Send size={14}/> {loading ? '...' : 'Terbitkan'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* SIDEBAR KIRI */}
        <div style={{ width: isMobile ? '100%' : '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* IDENTITAS QUIZ */}
          <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b' }}><FileText size={14} /> Identitas Kuis</h4>
            <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Judul kuis..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }} />
            <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box', background: 'white' }}>
              <option value="">Mapel</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* TARGET PUBLISH */}
          <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b' }}><Target size={14} /> Target Publish</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => setPublishTarget('mandiri')} style={{
                padding: '8px 12px', borderRadius: 6, border: publishTarget === 'mandiri' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                background: publishTarget === 'mandiri' ? '#eef2ff' : 'white', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600
              }}>
                <Send size={14} color={publishTarget === 'mandiri' ? '#3b82f6' : '#94a3b8'} /> Kuis Mandiri (Langsung ke Siswa)
              </button>

              <button onClick={() => setPublishTarget('modul')} style={{
                padding: '8px 12px', borderRadius: 6, border: publishTarget === 'modul' ? '2px solid #10b981' : '1px solid #e2e8f0',
                background: publishTarget === 'modul' ? '#f0fdf4' : 'white', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600
              }}>
                <BookOpen size={14} color={publishTarget === 'modul' ? '#10b981' : '#94a3b8'} /> Tautkan ke Modul
              </button>

              <button onClick={() => setPublishTarget('jenjang')} style={{
                padding: '8px 12px', borderRadius: 6, border: publishTarget === 'jenjang' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                background: publishTarget === 'jenjang' ? '#fffbeb' : 'white', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600
              }}>
                <Users size={14} color={publishTarget === 'jenjang' ? '#f59e0b' : '#94a3b8'} /> Tautkan ke Jenjang
              </button>
            </div>

            {/* DROPDOWN SESUAI TARGET */}
            {publishTarget === 'modul' && (
              <select value={selectedModul} onChange={e => setSelectedModul(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #10b981', fontSize: 11, outline: 'none', marginTop: 8, background: 'white', boxSizing: 'border-box' }}>
                <option value="">Pilih Modul...</option>
                {modulList.filter(m => !m.type || m.type !== 'kuis_mandiri').map(m => <option key={m.id} value={m.id}>{m.title || m.id}</option>)}
              </select>
            )}

            {publishTarget === 'jenjang' && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #f59e0b', fontSize: 11, background: 'white', boxSizing: 'border-box' }}>
                  <option value="Semua">Semua Program</option>
                  <option value="Reguler">📚 Reguler</option>
                  <option value="English">🗣️ English</option>
                </select>
                <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #f59e0b', fontSize: 11, background: 'white', boxSizing: 'border-box' }}>
                  <option value="Semua">Semua Kelas</option>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* INFO SOAL */}
          <div style={{ background: '#f0fdf4', padding: 10, borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 600, color: '#166534' }}>
            📊 {questions.filter(q => q.q.trim()).length} soal aktif
          </div>

          {/* BULK IMPORT BUTTON */}
          <button onClick={() => setShowImport(true)} style={{ width: '100%', padding: 10, background: 'white', border: '1px solid #673ab7', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, color: '#673ab7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Calculator size={14} /> Bulk Import Soal
          </button>
        </div>

        {/* AREA SOAL */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {questions.map((item, idx) => (
            <div key={item.id} style={{ background: 'white', padding: isMobile ? 15 : 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#673ab7', background: '#f3e8ff', padding: '4px 10px', borderRadius: 6 }}>SOAL {idx + 1}</span>
                <button onClick={() => setQuestions(questions.filter(q => q.id !== item.id))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={14}/></button>
              </div>
              
              <textarea value={item.q} onChange={e => setQuestions(questions.map(q => q.id === item.id ? {...q, q: e.target.value} : q))}
                placeholder="Tulis soal... ($ untuk rumus matematika)"
                style={{ width: '100%', minHeight: 55, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 6 }} />

              {item.q && <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, marginBottom: 10, fontSize: 12 }}>{renderMath(item.q)}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 6 }}>
                {item.options.map((opt, oIdx) => (
                  <div key={oIdx} onClick={() => setQuestions(questions.map(q => q.id === item.id ? {...q, correct: oIdx} : q))} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${item.correct === oIdx ? '#10b981' : '#e2e8f0'}`, background: item.correct === oIdx ? '#f0fdf4' : 'white'
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${item.correct === oIdx ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.correct === oIdx && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981' }}></div>}
                    </div>
                    <input value={opt} placeholder={`Opsi ${String.fromCharCode(65+oIdx)}`} onChange={e => {
                      const newOpts = [...item.options]; newOpts[oIdx] = e.target.value;
                      setQuestions(questions.map(q => q.id === item.id ? {...q, options: newOpts} : q));
                    }} onClick={e => e.stopPropagation()} style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 500, fontSize: 12, outline: 'none' }} />
                    {item.correct === oIdx && <CheckCircle size={12} color="#10b981"/>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={() => setQuestions([...questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }])} style={{
            width: '100%', padding: 12, border: '2px dashed #cbd5e1', background: 'white', borderRadius: 10, fontWeight: 700, color: '#64748b', cursor: 'pointer', fontSize: 12
          }}>
            <Plus size={14}/> Tambah Soal
          </button>
        </div>
      </div>

      {/* MODAL BULK IMPORT */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 550, padding: 25, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>📥 Bulk Import Soal</h3>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X/></button>
            </div>
            <div style={{ background: '#eef2ff', padding: 10, borderRadius: 8, fontSize: 10, color: '#4338ca', marginBottom: 12 }}>
              <b>Format:</b> 1. Soal $x^2$ (Enter) A. Opsi (Enter) B. Opsi...
            </div>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
              placeholder={"1. Berapa $\\sqrt{64}$?\nA. 6\nB. 8\nC. 10\nD. 12"}
              style={{ width: '100%', height: 220, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'monospace', marginBottom: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            <button onClick={handleBulkImport} style={{ width: '100%', padding: 12, background: '#673ab7', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>PROSES</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuiz;