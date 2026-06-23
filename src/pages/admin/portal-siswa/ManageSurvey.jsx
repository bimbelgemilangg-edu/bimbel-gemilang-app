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
    try {
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
    } catch (err) {
      console.error("Error fetch data:", err);
    }
    setLoading(false);
  };

  const fetchClasses = async () => {
    try {
      const snap = await getDocs(collection(db, "students"));
      const classes = [...new Set(snap.docs.map(d => d.data().kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setAvailableClasses(classes);
    } catch (err) {
      console.error("Error fetch classes:", err);
    }
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

  const handleDelete = async (id) => { if (!window.confirm("Hapus survei ini?")) return; await deleteDoc(doc(db, "surveys", id)); fetchData(); };
  const handleToggleStatus = async (id, cur) => { await updateDoc(doc(db, "surveys", id), { status: cur === 'aktif' ? 'arsip' : 'aktif' }); fetchData(); };

  // ============================================================
  // ANALYTICS - SUPPORT PILIHAN GANDA & TEKS
  // ============================================================
  const getAnalytics = (sid) => {
    const survey = surveys.find(s => s.id === sid);
    if (!survey) return null;
    const rlist = responses[sid] || [];
    const analytics = survey.questions.map((q, qi) => {
      const counts = {};
      const isText = q.type === 'teks';
      const textAnswers = [];
      
      if (!isText && q.options) {
        q.options.filter(o => o).forEach(o => { counts[o] = 0; });
      }
      
      rlist.forEach(r => {
        const a = r.answers?.[qi]?.answer;
        if (a) {
          if (isText) {
            textAnswers.push(a);
          } else if (counts[a] !== undefined) {
            counts[a]++;
          }
        }
      });
      
      return { 
        question: q.question, 
        type: q.type || 'pilihan',
        counts, 
        textAnswers,
        total: rlist.length 
      };
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
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={22} /> Pusat Survei
          </h2>
          <button onClick={() => { resetForm(); setShowForm(!showForm); setShowAnalytics(null); }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> {showForm ? 'Tutup Form' : 'Buat Survei'}
          </button>
        </div>

        {/* FORM BUAT/EDIT SURVEI */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 25 }}>
            <h3 style={{ margin: '0 0 15px', fontSize: 16, fontWeight: 700 }}>{editingId ? '✏️ Edit Survei' : '📝 Buat Survei Baru'}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 15 }}>
              <div>
                <label style={s.label}>Judul Survei</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Judul..." style={s.input} required />
              </div>
              <div>
                <label style={s.label}>Target Responden</label>
                <select value={form.targetType} onChange={e => setForm({...form, targetType: e.target.value})} style={s.select}>
                  <option value="semua_siswa">👥 Semua Siswa</option>
                  <option value="semua_guru">👨‍🏫 Semua Guru</option>
                  <option value="semua">🌐 Semua</option>
                  <option value="jenjang">📚 Per Jenjang</option>
                </select>
              </div>
            </div>

            {form.targetType === 'jenjang' && (
              <div style={{ marginBottom: 15 }}>
                <label style={s.label}>Pilih Kelas Spesifik</label>
                <select value={form.targetKelas} onChange={e => setForm({...form, targetKelas: e.target.value})} style={s.select}>
                  <option value="Semua">Semua Kelas</option>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm({...form, isRequired: e.target.checked})} /> Wajib diisi
              </label>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 3 }}>Deadline</label>
                <input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} style={s.input} />
              </div>
            </div>

            {/* DAFTAR PERTANYAAN */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 15, marginBottom: 15 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#475569' }}>Daftar Pertanyaan:</h4>
              
              {form.questions.map((q, idx) => (
                <div key={q.id} style={{ background: '#f8fafc', padding: 15, borderRadius: 10, marginBottom: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Pertanyaan #{idx + 1}</span>
                    {form.questions.length > 1 && (
                      <button type="button" onClick={() => removeQ(q.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <X size={14} /> Hapus
                      </button>
                    )}
                  </div>
                  
                  <input 
                    value={q.question} 
                    onChange={e => updateQ(q.id, 'question', e.target.value)} 
                    placeholder="Tulis teks pertanyaan..." 
                    style={{...s.input, marginBottom: 10}} 
                    required 
                  />
                  
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, marginRight: 10, fontWeight: 600 }}>Tipe Respon:</label>
                    <select 
                      value={q.type || 'pilihan'} 
                      onChange={e => updateQ(q.id, 'type', e.target.value)} 
                      style={{...s.select, width: 'auto', padding: '4px 10px', height: 'auto'}}
                    >
                      <option value="pilihan">🔘 Pilihan Ganda</option>
                      <option value="teks">✍️ Isian Teks Bebas</option>
                    </select>
                  </div>

                  {/* Opsi Pilihan Ganda */}
                  {(!q.type || q.type === 'pilihan') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                      {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                        <input 
                          key={oIdx} 
                          value={opt} 
                          onChange={e => updateOpt(q.id, oIdx, e.target.value)} 
                          placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`} 
                          style={{...s.input, padding: '8px 12px', fontSize: 12}} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button 
                type="button" 
                onClick={addQ} 
                style={{ 
                  width: '100%', padding: 12, 
                  border: '2px dashed #cbd5e1', borderRadius: 8, 
                  background: 'white', cursor: 'pointer', 
                  fontWeight: 600, fontSize: 13, color: '#64748b',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.color = '#3b82f6'; }}
                onMouseLeave={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.color = '#64748b'; }}
              >
                <Plus size={14} /> Tambah Pertanyaan
              </button>
            </div>

            <button 
              type="submit" 
              style={{ 
                width: '100%', padding: 14, 
                background: '#10b981', color: 'white', 
                border: 'none', borderRadius: 10, 
                fontWeight: 800, fontSize: 14, 
                cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.target.style.background = '#059669'; }}
              onMouseLeave={(e) => { e.target.style.background = '#10b981'; }}
            >
              <Save size={16} /> {editingId ? 'Update Survei' : 'Terbitkan Survei'}
            </button>
          </form>
        )}

        {/* ANALYTICS PANEL */}
        {showAnalytics && getAnalytics(showAnalytics) && (
          <div style={{ background: 'white', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 25 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📊 Hasil Analisis: {getAnalytics(showAnalytics).survey.title}</h3>
              <button onClick={() => setShowAnalytics(null)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Tutup</button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 15px 0' }}>📦 Total Respon: {getAnalytics(showAnalytics).totalResponden}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {getAnalytics(showAnalytics).analytics.map((an, i) => (
                <div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#1e293b' }}>
                    Q{i+1}. {an.question}
                  </div>
                  
                  {an.type === 'teks' ? (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      {an.textAnswers.length === 0 ? (
                        <small style={{color: '#94a3b8'}}>Belum ada isian teks.</small>
                      ) : (
                        an.textAnswers.map((txt, ti) => (
                          <div key={ti} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                            • {txt}
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(an.counts).map(([opt, val]) => {
                        const pct = an.total > 0 ? Math.round((val / an.total) * 100) : 0;
                        return (
                          <div key={opt} style={{ fontSize: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span>{opt}</span>
                              <span>{val} ({pct}%)</span>
                            </div>
                            <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
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
                    <button onClick={() => openEdit(survey)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#fef3c7', color: '#b45309', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <Edit3 size={11} /> Edit
                    </button>
                    <button onClick={() => setShowAnalytics(showAnalytics===survey.id?null:survey.id)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#e0e7ff', color: '#3730a3', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <BarChart3 size={11} /> Analisis
                    </button>
                    <button onClick={() => setShowRespondents(showRespondents===survey.id?null:survey.id)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <Users size={11} /> Responden
                    </button>
                    <button onClick={() => handleToggleStatus(survey.id, survey.status)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50 }}>
                      {survey.status==='aktif'?'Arsip':'Aktifkan'}
                    </button>
                    <button onClick={() => handleDelete(survey.id)} style={{ padding: 7, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>

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
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const s = {
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#fff' },
  select: { width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: 'white' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 },
};

export default ManageSurvey;