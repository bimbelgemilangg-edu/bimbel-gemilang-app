import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Plus, Trash2, Eye, RefreshCw, CheckCircle, X, ArrowLeft, Home, ChevronRight, BarChart3, Send, Target, Users, Calendar, ClipboardList, AlertCircle, Search } from 'lucide-react';

const ManageSurvey = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [responses, setResponses] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [alertMsg, setAlertMsg] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    targetType: 'semua_siswa',
    targetKelas: 'Semua',
    isRequired: false,
    deadline: '',
    questions: [{ id: Date.now(), type: 'pilihan', question: '', options: ['', '', '', ''] }]
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchData();
    fetchClasses();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "surveys"), orderBy("createdAt", "desc")));
    setSurveys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const respSnap = await getDocs(collection(db, "survey_responses"));
    const respMap = {};
    respSnap.docs.forEach(d => {
      const data = d.data();
      if (!respMap[data.surveyId]) respMap[data.surveyId] = [];
      respMap[data.surveyId].push({ id: d.id, ...data });
    });
    setResponses(respMap);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const snap = await getDocs(collection(db, "students"));
    const data = snap.docs.map(d => d.data());
    const classes = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    setAvailableClasses(classes);
  };

  const addQuestion = () => {
    setForm({ ...form, questions: [...form.questions, { id: Date.now(), type: 'pilihan', question: '', options: ['', '', '', ''] }] });
  };

  const updateQuestion = (qId, field, value) => {
    setForm({ ...form, questions: form.questions.map(q => q.id === qId ? { ...q, [field]: value } : q) });
  };

  const updateOption = (qId, oIdx, value) => {
    setForm({
      ...form,
      questions: form.questions.map(q => {
        if (q.id !== qId) return q;
        const newOpts = [...q.options];
        newOpts[oIdx] = value;
        return { ...q, options: newOpts };
      })
    });
  };

  const removeQuestion = (qId) => {
    setForm({ ...form, questions: form.questions.filter(q => q.id !== qId) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return alert("Judul survei wajib diisi!");
    try {
      await addDoc(collection(db, "surveys"), {
        ...form,
        questions: form.questions.filter(q => q.question.trim()),
        createdAt: serverTimestamp(),
        status: 'aktif'
      });
      alert("✅ Survei diterbitkan!");
      setForm({ title: '', targetType: 'semua_siswa', targetKelas: 'Semua', isRequired: false, deadline: '', questions: [{ id: Date.now(), type: 'pilihan', question: '', options: ['', '', '', ''] }] });
      setShowForm(false);
      fetchData();
    } catch (err) { alert("❌ Gagal: " + err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus survei ini?")) return;
    await deleteDoc(doc(db, "surveys", id));
    fetchData();
  };

  const handleToggleStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, "surveys", id), { status: currentStatus === 'aktif' ? 'arsip' : 'aktif' });
    fetchData();
  };

  const getAnalytics = (surveyId) => {
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return null;
    const respList = responses[surveyId] || [];
    const analytics = survey.questions.map((q, qIdx) => {
      const counts = {};
      q.options.forEach(opt => { if (opt) counts[opt] = 0; });
      respList.forEach(r => {
        const answer = r.answers?.[qIdx]?.answer;
        if (answer && counts[answer] !== undefined) counts[answer]++;
      });
      return { question: q.question, type: q.type, counts, total: respList.length };
    });
    return { survey, analytics, totalResponden: respList.length };
  };

  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? 0 : 250, padding: isMobile ? 15 : 30, width: '100%', boxSizing: 'border-box', transition: '0.3s' }}>
        
        {/* BREADCRUMB */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <button onClick={() => navigate('/admin/portal')} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Portal Siswa
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Home size={12} color="#94a3b8" /><ChevronRight size={12} color="#94a3b8" />
            <span style={{ color: '#94a3b8' }}>Portal</span><ChevronRight size={12} color="#94a3b8" />
            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>Survei</span>
          </div>
        </div>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b' }}><ClipboardList size={22} /> Pusat Survei</h2>
          <button onClick={() => setShowForm(!showForm)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> {showForm ? 'Tutup Form' : 'Buat Survei'}
          </button>
        </div>

        {/* FORM BUAT SURVEI */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 25 }}>
            <h3 style={{ margin: '0 0 15px', fontSize: 16, fontWeight: 700 }}>📝 Buat Survei Baru</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 15 }}>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Judul survei..." style={s.input} required />
              <select value={form.targetType} onChange={e => setForm({...form, targetType: e.target.value})} style={s.select}>
                <option value="semua_siswa">👥 Semua Siswa</option>
                <option value="semua_guru">👨‍🏫 Semua Guru</option>
                <option value="semua">🌐 Semua (Guru & Siswa)</option>
                <option value="jenjang">📚 Per Jenjang/Kelas</option>
              </select>
              {form.targetType === 'jenjang' && (
                <select value={form.targetKelas} onChange={e => setForm({...form, targetKelas: e.target.value})} style={s.select}>
                  <option value="Semua">Semua Kelas</option>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm({...form, isRequired: e.target.checked})} style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Wajib diisi</span>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Deadline (opsional)</label>
                <input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} style={s.input} />
              </div>
            </div>

            {/* PERTANYAAN */}
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Pertanyaan</h4>
            {form.questions.map((q, qIdx) => (
              <div key={q.id} style={{ background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>PERTANYAAN {qIdx + 1}</span>
                  {form.questions.length > 1 && <button type="button" onClick={() => removeQuestion(q.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={14} /></button>}
                </div>
                <input value={q.question} onChange={e => updateQuestion(q.id, 'question', e.target.value)} placeholder="Tulis pertanyaan..." style={s.input} />
                {q.type === 'pilihan' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                    {q.options.map((opt, oIdx) => (
                      <input key={oIdx} value={opt} onChange={e => updateOption(q.id, oIdx, e.target.value)} placeholder={`Opsi ${String.fromCharCode(65+oIdx)}`} style={{ padding: 6, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 11 }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addQuestion} style={{ width: '100%', padding: 10, border: '2px dashed #cbd5e1', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12, color: '#64748b', marginBottom: 15 }}>
              <Plus size={14} /> Tambah Pertanyaan
            </button>
            <button type="submit" style={{ width: '100%', padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              <Send size={14} /> Terbitkan Survei
            </button>
          </form>
        )}

        {/* DAFTAR SURVEI */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}><div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div></div>
        ) : surveys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
            <ClipboardList size={48} /><p>Belum ada survei.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {surveys.map(survey => {
              const respCount = (responses[survey.id] || []).length;
              return (
                <div key={survey.id} style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', borderLeft: `5px solid ${survey.status === 'aktif' ? '#10b981' : '#94a3b8'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: survey.isRequired ? '#fee2e2' : '#e0e7ff', color: survey.isRequired ? '#ef4444' : '#3730a3' }}>
                      {survey.isRequired ? '🔴 WAJIB' : '🔵 OPSIONAL'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: survey.status === 'aktif' ? '#dcfce7' : '#f1f5f9', color: survey.status === 'aktif' ? '#166534' : '#64748b' }}>
                      {survey.status === 'aktif' ? '🟢 Aktif' : '📦 Arsip'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{survey.title}</h3>
                  <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>
                    <span><Target size={10} /> {survey.targetType === 'semua_siswa' ? 'Siswa' : survey.targetType === 'semua_guru' ? 'Guru' : survey.targetType === 'jenjang' ? survey.targetKelas : 'Semua'}</span>
                    <span><Users size={10} /> {respCount} respons</span>
                    {survey.deadline && <span><Calendar size={10} /> {new Date(survey.deadline).toLocaleDateString('id-ID')}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => setShowAnalytics(showAnalytics === survey.id ? null : survey.id)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#e0e7ff', color: '#3730a3', cursor: 'pointer', fontWeight: 600, fontSize: 10 }}>
                      <BarChart3 size={11} /> Analisis
                    </button>
                    <button onClick={() => handleToggleStatus(survey.id, survey.status)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#fef3c7', color: '#b45309', cursor: 'pointer', fontWeight: 600, fontSize: 10 }}>
                      {survey.status === 'aktif' ? 'Arsipkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => handleDelete(survey.id)} style={{ padding: 7, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 10 }}>
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* ANALYTICS DROPDOWN */}
                  {showAnalytics === survey.id && (
                    <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                      {getAnalytics(survey.id)?.analytics.map((a, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{i+1}. {a.question}</div>
                          {Object.entries(a.counts).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 10, width: '40%' }}>{key}</span>
                              <div style={{ flex: 1, height: 14, background: '#f1f5f9', borderRadius: 7, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${a.total > 0 ? (val / a.total) * 100 : 0}%`, background: '#3b82f6', borderRadius: 7, transition: 'width 0.5s' }}></div>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, width: 40, textAlign: 'right' }}>{val} ({a.total > 0 ? Math.round((val/a.total)*100) : 0}%)</span>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>Total responden: {getAnalytics(survey.id)?.totalResponden}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const s = {
  input: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: 'white' },
};

export default ManageSurvey;