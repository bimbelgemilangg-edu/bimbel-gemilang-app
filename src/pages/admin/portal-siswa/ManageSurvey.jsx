import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Plus, Trash2, Eye, RefreshCw, CheckCircle, X, ArrowLeft, Home, ChevronRight, BarChart3, Send, Target, Users, Calendar, ClipboardList, Edit3, Save } from 'lucide-react';

const ManageSurvey = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [responses, setResponses] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(null);
  const [showRespondents, setShowRespondents] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);

  // Form state
  const [form, setForm] = useState({
    title: '', targetType: 'semua_siswa', targetKelas: 'Semua',
    isRequired: false, deadline: '', status: 'aktif',
    questions: [{ id: Date.now(), type: 'pilihan', question: '', options: ['', '', '', ''] }]
  });

  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  useEffect(() => { fetchData(); fetchClasses(); }, []);

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
    const classes = [...new Set(snap.docs.map(d => d.data().kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    setAvailableClasses(classes);
  };

  const resetForm = () => {
    setForm({ title: '', targetType: 'semua_siswa', targetKelas: 'Semua', isRequired: false, deadline: '', status: 'aktif', questions: [{ id: Date.now(), type: 'pilihan', question: '', options: ['', '', '', ''] }] });
    setEditingId(null);
  };

  const openEdit = (survey) => {
    setForm({ ...survey, deadline: survey.deadline || '' });
    setEditingId(survey.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addQ = () => setForm({ ...form, questions: [...form.questions, { id: Date.now(), type: 'pilihan', question: '', options: ['', '', '', ''] }] });
  const updateQ = (qId, field, value) => setForm({ ...form, questions: form.questions.map(q => q.id === qId ? { ...q, [field]: value } : q) });
  const updateOpt = (qId, oIdx, value) => setForm({ ...form, questions: form.questions.map(q => q.id !== qId ? q : { ...q, options: q.options.map((o, i) => i === oIdx ? value : o) }) });
  const removeQ = (qId) => setForm({ ...form, questions: form.questions.filter(q => q.id !== qId) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return alert("Judul wajib!");
    const payload = { ...form, questions: form.questions.filter(q => q.question.trim()), updatedAt: serverTimestamp() };
    try {
      if (editingId) {
        await updateDoc(doc(db, "surveys", editingId), payload);
        alert("✅ Survei diperbarui!");
      } else {
        await addDoc(collection(db, "surveys"), { ...payload, createdAt: serverTimestamp() });
        alert("✅ Survei diterbitkan!");
      }
      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err) { alert("❌ " + err.message); }
  };

  const handleDelete = async (id) => { if (!window.confirm("Hapus?")) return; await deleteDoc(doc(db, "surveys", id)); fetchData(); };
  const handleToggleStatus = async (id, cur) => { await updateDoc(doc(db, "surveys", id), { status: cur === 'aktif' ? 'arsip' : 'aktif' }); fetchData(); };

  const getAnalytics = (sid) => {
    const survey = surveys.find(s => s.id === sid);
    if (!survey) return null;
    const rlist = responses[sid] || [];
    const analytics = survey.questions.map((q, qi) => {
      const counts = {};
      q.options.filter(o => o).forEach(o => { counts[o] = 0; });
      rlist.forEach(r => { const a = r.answers?.[qi]?.answer; if (a && counts[a] !== undefined) counts[a]++; });
      return { question: q.question, counts, total: rlist.length };
    });
    return { survey, analytics, totalResponden: rlist.length, respondents: rlist };
  };

  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? 0 : 250, padding: isMobile ? 15 : 30, width: '100%', boxSizing: 'border-box', transition: '0.3s' }}>
        
        {/* BREADCRUMB */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <button onClick={() => navigate('/admin/portal')} style={s.btnBack}><ArrowLeft size={14} /> Portal</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Home size={12} color="#94a3b8" /><ChevronRight size={12} color="#94a3b8" />
            <span style={{ color: '#94a3b8' }}>Portal</span><ChevronRight size={12} color="#94a3b8" />
            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>Survei</span>
          </div>
        </div>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b' }}><ClipboardList size={22} /> Pusat Survei</h2>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> {showForm ? 'Tutup Form' : 'Buat Survei'}
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 25 }}>
            <h3 style={{ margin: '0 0 15px', fontSize: 16, fontWeight: 700 }}>{editingId ? '✏️ Edit Survei' : '📝 Buat Survei Baru'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 15 }}>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Judul..." style={s.input} required />
              <select value={form.targetType} onChange={e => setForm({...form, targetType: e.target.value})} style={s.select}>
                <option value="semua_siswa">👥 Semua Siswa</option>
                <option value="semua_guru">👨‍🏫 Semua Guru</option>
                <option value="semua">🌐 Semua</option>
                <option value="jenjang">📚 Per Jenjang</option>
              </select>
              {form.targetType === 'jenjang' && <select value={form.targetKelas} onChange={e => setForm({...form, targetKelas: e.target.value})} style={s.select}>{availableClasses.map(k => <option key={k} value={k}>{k}</option>)}</select>}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={form.isRequired} onChange={e => setForm({...form, isRequired: e.target.checked})} /> Wajib diisi</label>
              <div><label style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 3 }}>Deadline</label><input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} style={s.input} /></div>
            </div>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Pertanyaan</h4>
            {form.questions.map((q, qi) => (
              <div key={q.id} style={{ background: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b' }}>PERTANYAAN {qi+1}</span>
                  {form.questions.length > 1 && <button type="button" onClick={() => removeQ(q.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={14}/></button>}
                </div>
                <input value={q.question} onChange={e => updateQ(q.id, 'question', e.target.value)} placeholder="Tulis pertanyaan..." style={s.input} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                  {q.options.map((opt, oi) => <input key={oi} value={opt} onChange={e => updateOpt(q.id, oi, e.target.value)} placeholder={`Opsi ${String.fromCharCode(65+oi)}`} style={{ padding: 6, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 11 }} />)}
                </div>
              </div>
            ))}
            <button type="button" onClick={addQ} style={{ width: '100%', padding: 10, border: '2px dashed #cbd5e1', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12, color: '#64748b', marginBottom: 15 }}><Plus size={14} /> Tambah Pertanyaan</button>
            <button type="submit" style={{ width: '100%', padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Save size={14} /> {editingId ? 'Update Survei' : 'Terbitkan Survei'}
            </button>
          </form>
        )}

        {/* DAFTAR SURVEI */}
        {loading ? <div style={{ textAlign: 'center', padding: 50 }}><div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div></div> :
        surveys.length === 0 ? <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' }}><ClipboardList size={48} /><p>Belum ada survei.</p></div> :
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {surveys.map(survey => {
            const rcount = (responses[survey.id] || []).length;
            return (
              <div key={survey.id} style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', borderLeft: `5px solid ${survey.status==='aktif'?'#10b981':'#94a3b8'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: survey.isRequired ? '#fee2e2' : '#e0e7ff', color: survey.isRequired ? '#ef4444' : '#3730a3' }}>
                    {survey.isRequired ? '🔴 WAJIB' : '🔵 OPSIONAL'}
                  </span>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: survey.status==='aktif'?'#dcfce7':'#f1f5f9', color: survey.status==='aktif'?'#166534':'#64748b' }}>
                    {survey.status==='aktif'?'🟢 Aktif':'📦 Arsip'}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{survey.title}</h3>
                <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#94a3b8', marginBottom: 10, flexWrap: 'wrap' }}>
                  <span><Target size={10} /> {survey.targetType}</span>
                  <span><Users size={10} /> {rcount} respons</span>
                  {survey.deadline && <span><Calendar size={10} /> {new Date(survey.deadline).toLocaleDateString('id-ID')}</span>}
                </div>
                
                {/* TOMBOL AKSI */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => openEdit(survey)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#fef3c7', color: '#b45309', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50 }}>
                    <Edit3 size={11} /> Edit
                  </button>
                  <button onClick={() => setShowAnalytics(showAnalytics===survey.id?null:survey.id)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#e0e7ff', color: '#3730a3', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50 }}>
                    <BarChart3 size={11} /> Analisis
                  </button>
                  <button onClick={() => setShowRespondents(showRespondents===survey.id?null:survey.id)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50 }}>
                    <Users size={11} /> Responden
                  </button>
                  <button onClick={() => handleToggleStatus(survey.id, survey.status)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50 }}>
                    {survey.status==='aktif'?'Arsip':'Aktifkan'}
                  </button>
                  <button onClick={() => handleDelete(survey.id)} style={{ padding: 7, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 10 }}>
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* ANALYTICS */}
                {showAnalytics === survey.id && getAnalytics(survey.id) && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                    {getAnalytics(survey.id).analytics.map((a, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{i+1}. {a.question}</div>
                        {Object.entries(a.counts).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 10, width: '40%' }}>{k}</span>
                            <div style={{ flex: 1, height: 12, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${a.total>0?(v/a.total)*100:0}%`, background: '#3b82f6', borderRadius: 6 }}></div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, width: 40, textAlign: 'right' }}>{v} ({a.total>0?Math.round((v/a.total)*100):0}%)</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div style={{ fontSize: 10, color: '#64748b' }}>Total: {getAnalytics(survey.id).totalResponden} responden</div>
                  </div>
                )}

                {/* RESPONDEN LIST */}
                {showRespondents === survey.id && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12, maxHeight: 200, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>📋 Daftar Responden ({(responses[survey.id]||[]).length})</div>
                    {(responses[survey.id]||[]).length === 0 ? (
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>Belum ada yang mengisi.</p>
                    ) : (
                      (responses[survey.id]||[]).map(r => (
                        <div key={r.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                          <span><strong>{r.userName || 'Anonim'}</strong></span>
                          <span style={{ color: '#94a3b8', fontSize: 10 }}>
                            {r.submittedAt?.toDate ? new Date(r.submittedAt.toDate()).toLocaleString('id-ID') : '-'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
};

const s = {
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  input: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: 'white' },
};

export default ManageSurvey;