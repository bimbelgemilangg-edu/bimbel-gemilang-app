// src/pages/admin/portal-siswa/ManageSurvey.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { uploadElearningFile } from '../../../services/uploadService';
import * as XLSX from 'xlsx';
import {
  Plus, Trash2, RefreshCw, X, ArrowLeft, Home, ChevronRight, BarChart3,
  Target, Users, Calendar, ClipboardList, Edit3, Save, Image as ImageIcon,
  Sparkles, Download, Loader2, Award, PieChart
} from 'lucide-react';

// ============================================================
// 🔥 KATEGORI WARNA (buat bagan skor gaya belajar/kepuasan dll)
// ============================================================
const CATEGORY_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

const emptyQuestion = () => ({
  id: Date.now() + Math.random(),
  type: 'pilihan',
  question: '',
  options: ['', '', '', ''],
  // 🔥 BARU: dipakai kalau mode survei = 'skor_kategori'. Tiap opsi jawaban
  // dipetakan ke satu kategori (misal opsi A = "Visual"), sejajar index
  // dengan array `options`.
  optionCategories: ['', '', '', ''],
});

const emptyForm = () => ({
  title: '',
  coverImage: '',
  coverFilePath: '',
  targetType: 'semua_siswa',
  targetKelas: 'Semua',
  isRequired: false,
  deadline: '',
  status: 'aktif',
  // 🔥 BARU: 'biasa' = survei biasa (tally jawaban apa adanya, tanpa nilai).
  // 'skor_kategori' = tiap opsi punya kategori (misal gaya belajar: Visual/
  // Auditori/Kinestetik, atau kepuasan: Puas/Cukup/Kurang), sistem menghitung
  // KATEGORI DOMINAN tiap responden + bagan agregatnya. Tetap BUKAN nilai
  // akademik (tidak ada benar/salah), cuma pengelompokan.
  mode: 'biasa',
  categories: ['', '', ''],
  questions: [emptyQuestion()],
});

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
  const [saving, setSaving] = useState(false);

  // Upload & generate cover
  const coverInputRef = useRef(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [searchingCover, setSearchingCover] = useState(false);

  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
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
      // 🔥 Diambil LANGSUNG dari koleksi students (bukan lewat jadwal),
      // konsisten dengan perbaikan di modul E-Learning sebelumnya.
      const snap = await getDocs(collection(db, "students"));
      const classes = [...new Set(snap.docs.map(d => d.data().kelasSekolah))].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setAvailableClasses(classes);
    } catch (err) {
      console.error("Error fetch classes:", err);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const openEdit = (survey) => {
    // 🔥 FIX: dulu `{...survey}` disebar mentah-mentah ke form, termasuk field
    // `id` (dobel dengan ID dokumen asli) dan Timestamp createdAt/updatedAt
    // lama yang ikut nempel. Sekarang cuma field yang relevan yang diambil,
    // dengan nilai default aman kalau survei lama belum punya field baru
    // (coverImage, mode, categories, optionCategories) sama sekali.
    setForm({
      title: survey.title || '',
      coverImage: survey.coverImage || '',
      coverFilePath: survey.coverFilePath || '',
      targetType: survey.targetType || 'semua_siswa',
      targetKelas: survey.targetKelas || 'Semua',
      isRequired: !!survey.isRequired,
      deadline: survey.deadline || '',
      status: survey.status || 'aktif',
      mode: survey.mode || 'biasa',
      categories: (survey.categories?.length ? survey.categories : ['', '', '']),
      questions: (survey.questions?.length ? survey.questions : [emptyQuestion()]).map(q => ({
        ...q,
        options: q.options?.length ? q.options : ['', '', '', ''],
        optionCategories: q.optionCategories?.length ? q.optionCategories : ['', '', '', ''],
      })),
    });
    setEditingId(survey.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================
  // 🔥 COVER IMAGE — upload manual & cari otomatis
  // (pola sama persis dengan cover modul materi, biar konsisten)
  // ============================================================
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('❌ File harus berupa gambar!'); return; }
    setUploadingCover(true);
    try {
      const result = await uploadElearningFile(file, 'cover');
      if (result?.success) {
        setForm(f => ({ ...f, coverImage: result.downloadURL, coverFilePath: result.filePath }));
      } else {
        alert('❌ Gagal upload: ' + (result?.error || 'tidak diketahui'));
      }
    } catch (err) {
      alert('❌ Gagal upload: ' + err.message);
    }
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSearchCoverAuto = async () => {
    if (!form.title.trim()) { alert('⚠️ Isi judul survei dulu, baru bisa dicarikan gambar otomatis.'); return; }
    setSearchingCover(true);
    try {
      const res = await fetch('/api/searchImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: form.title }),
      });
      const data = await res.json();
      if (data.success && data.found) {
        setForm(f => ({ ...f, coverImage: data.url, coverFilePath: '' }));
      } else {
        alert('⚠️ Tidak ketemu gambar yang aman & relevan buat judul ini. Coba upload manual, atau ganti dulu judulnya jadi lebih spesifik.');
      }
    } catch (err) {
      alert('❌ Gagal mencari gambar: ' + err.message);
    }
    setSearchingCover(false);
  };

  const addQ = () => setForm({ ...form, questions: [...form.questions, emptyQuestion()] });
  const updateQ = (qId, field, value) => setForm({ ...form, questions: form.questions.map(q => q.id === qId ? { ...q, [field]: value } : q) });
  const updateOpt = (qId, oIdx, value) => setForm({ ...form, questions: form.questions.map(q => q.id !== qId ? q : { ...q, options: q.options.map((o, i) => i === oIdx ? value : o) }) });
  const updateOptCategory = (qId, oIdx, value) => setForm({ ...form, questions: form.questions.map(q => q.id !== qId ? q : { ...q, optionCategories: (q.optionCategories || ['', '', '', '']).map((c, i) => i === oIdx ? value : c) }) });
  const removeQ = (qId) => setForm({ ...form, questions: form.questions.filter(q => q.id !== qId) });
  const updateCategory = (idx, value) => setForm({ ...form, categories: form.categories.map((c, i) => i === idx ? value : c) });
  const addCategory = () => setForm({ ...form, categories: [...form.categories, ''] });
  const removeCategory = (idx) => setForm({ ...form, categories: form.categories.filter((_, i) => i !== idx) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("❌ Judul wajib diisi!");

    const validQuestions = form.questions.filter(q => q.question.trim());
    if (validQuestions.length === 0) return alert("❌ Minimal 1 pertanyaan yang terisi!");

    if (form.mode === 'skor_kategori') {
      const validCategories = form.categories.filter(c => c.trim());
      if (validCategories.length < 2) {
        return alert("❌ Mode Skor/Kategori butuh minimal 2 kategori (misal: Visual, Auditori, Kinestetik)!");
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        coverImage: form.coverImage || '',
        coverFilePath: form.coverFilePath || '',
        targetType: form.targetType,
        targetKelas: form.targetType === 'jenjang' ? form.targetKelas : 'Semua',
        isRequired: !!form.isRequired,
        deadline: form.deadline || null,
        status: form.status,
        mode: form.mode,
        categories: form.mode === 'skor_kategori' ? form.categories.filter(c => c.trim()) : [],
        questions: validQuestions,
        updatedAt: serverTimestamp(),
      };

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
    } catch (err) {
      alert("❌ " + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => { if (!window.confirm("Hapus survei ini? Semua respons yang sudah masuk TIDAK ikut terhapus otomatis.")) return; await deleteDoc(doc(db, "surveys", id)); fetchData(); };
  const handleToggleStatus = async (id, cur) => { await updateDoc(doc(db, "surveys", id), { status: cur === 'aktif' ? 'arsip' : 'aktif' }); fetchData(); };

  // ============================================================
  // 🔥 ANALYTICS — support tally biasa DAN skor/kategori
  // ============================================================
  const normalize = (s = '') => String(s).trim().toLowerCase();

  const getAnalytics = (sid) => {
    const survey = surveys.find(s => s.id === sid);
    if (!survey) return null;
    const rlist = responses[sid] || [];
    const isSkor = survey.mode === 'skor_kategori';

    // Per-pertanyaan: tally jawaban (dicocokkan case/whitespace-insensitive
    // biar lebih tahan banting daripada sekadar cocok persis).
    const analytics = survey.questions.map((q, qi) => {
      const counts = {};
      const isText = q.type === 'teks';
      const textAnswers = [];
      if (!isText && q.options) q.options.filter(o => o).forEach(o => { counts[o] = 0; });

      rlist.forEach(r => {
        const a = r.answers?.[qi]?.answer;
        if (!a) return;
        if (isText) { textAnswers.push(a); return; }
        const match = (q.options || []).find(o => normalize(o) === normalize(a));
        if (match !== undefined) counts[match] = (counts[match] || 0) + 1;
      });

      return { question: q.question, type: q.type || 'pilihan', counts, textAnswers, total: rlist.length };
    });

    // 🔥 Skor/kategori: hitung kategori dominan PER RESPONDEN, lalu agregat
    // berapa banyak responden yang dominan di tiap kategori (buat bagan).
    let categoryChart = null;
    let respondentCategories = {};
    if (isSkor) {
      const tally = {};
      (survey.categories || []).forEach(c => { tally[c] = 0; });

      rlist.forEach(r => {
        const perCategoryCount = {};
        survey.questions.forEach((q, qi) => {
          const a = r.answers?.[qi]?.answer;
          if (!a || !q.options) return;
          const idx = q.options.findIndex(o => normalize(o) === normalize(a));
          const cat = idx >= 0 ? q.optionCategories?.[idx] : null;
          if (cat) perCategoryCount[cat] = (perCategoryCount[cat] || 0) + 1;
        });
        // Kategori dengan hitungan tertinggi buat responden ini
        let dominant = null, max = 0;
        Object.entries(perCategoryCount).forEach(([cat, cnt]) => {
          if (cnt > max) { max = cnt; dominant = cat; }
        });
        respondentCategories[r.id] = dominant;
        if (dominant) tally[dominant] = (tally[dominant] || 0) + 1;
      });

      categoryChart = tally;
    }

    return { survey, analytics, totalResponden: rlist.length, respondents: rlist, isSkor, categoryChart, respondentCategories };
  };

  // ============================================================
  // 🔥 EXPORT KE EXCEL — dulu fitur ini SAMA SEKALI TIDAK ADA, padahal
  // "hasil bisa didownload" adalah kebutuhan inti survei buat admin.
  // ============================================================
  const handleExport = (sid) => {
    const data = getAnalytics(sid);
    if (!data) return;
    const { survey, respondents, isSkor, respondentCategories } = data;

    if (respondents.length === 0) {
      alert('⚠️ Belum ada responden yang mengisi survei ini.');
      return;
    }

    const rows = respondents.map(r => {
      const row = {
        'Nama': r.userName || 'Anonim',
        'Peran': r.userRole || '-',
        'Waktu Isi': r.submittedAt?.toDate ? r.submittedAt.toDate().toLocaleString('id-ID') : '-',
      };
      survey.questions.forEach((q, qi) => {
        row[`Q${qi + 1}. ${q.question}`] = r.answers?.[qi]?.answer || '-';
      });
      if (isSkor) {
        row['Kategori Dominan'] = respondentCategories[r.id] || '-';
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Survei");
    const safeName = (survey.title || 'survei').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
    XLSX.writeFile(wb, `Hasil_${safeName}.xlsx`);
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

            {/* 🔥 COVER IMAGE — dulu TIDAK ADA sama sekali, padahal survei
                wajib butuh banner buat ditampilkan di portal. */}
            <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row', marginBottom: 18 }}>
              <label style={{
                width: isMobile ? '100%' : 180, height: 110, flexShrink: 0, borderRadius: 10,
                border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
              }}>
                {uploadingCover ? (
                  <Loader2 size={22} className="spin-survey" color="#3b82f6" />
                ) : form.coverImage ? (
                  <img src={form.coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                    <ImageIcon size={22} />
                    <span style={{ fontSize: 9, marginTop: 4 }}>Upload Cover</span>
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} disabled={uploadingCover} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                <button type="button" onClick={handleSearchCoverAuto} disabled={searchingCover} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  background: '#ede9fe', border: 'none', borderRadius: 8, cursor: searchingCover ? 'wait' : 'pointer',
                  fontSize: 12, fontWeight: 700, color: '#7c3aed',
                }}>
                  {searchingCover ? <Loader2 size={14} className="spin-survey" /> : <Sparkles size={14} />}
                  {searchingCover ? 'Mencari...' : 'Cari Gambar Otomatis'}
                </button>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, maxWidth: 260 }}>
                  Dicari otomatis berdasarkan judul survei (Wikimedia, sudah difilter aman). Kalau kurang cocok, upload manual saja.
                </p>
                {form.isRequired && !form.coverImage && (
                  <p style={{ fontSize: 10, color: '#b45309', margin: 0, fontWeight: 600 }}>
                    ⚠️ Survei WAJIB tampil sebagai banner — cover sangat disarankan diisi.
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 15 }}>
              <div>
                <label style={s.label}>Judul Survei</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul..." style={s.input} required />
              </div>
              <div>
                <label style={s.label}>Target Responden</label>
                <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value })} style={s.select}>
                  <option value="semua_siswa">👥 Semua Siswa</option>
                  <option value="semua_guru">👨‍🏫 Semua Tentor</option>
                  <option value="semua">🌐 Siswa & Tentor</option>
                  <option value="jenjang">📚 Kelas Tertentu (Siswa)</option>
                </select>
              </div>
            </div>

            {form.targetType === 'jenjang' && (
              <div style={{ marginBottom: 15 }}>
                <label style={s.label}>Pilih Kelas Spesifik</label>
                <select value={form.targetKelas} onChange={e => setForm({ ...form, targetKelas: e.target.value })} style={s.select}>
                  <option value="Semua">Semua Kelas</option>
                  {availableClasses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm({ ...form, isRequired: e.target.checked })} /> Wajib diisi (tampil banner)
              </label>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 3 }}>Deadline (opsional)</label>
                <input type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} style={s.input} />
              </div>
            </div>

            {/* 🔥 MODE SURVEI — BARU. Ini yang memungkinkan survei gaya belajar
                / kepuasan belajar punya hasil berupa SKOR & BAGAN, bukan cuma
                tally polos. */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 15, marginBottom: 15 }}>
              <label style={s.label}>Mode Survei</label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setForm({ ...form, mode: 'biasa' })} style={s.modeBtn(form.mode === 'biasa')}>
                  <ClipboardList size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>Survei Biasa</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>Tally jawaban apa adanya, tanpa skor</div>
                  </div>
                </button>
                <button type="button" onClick={() => setForm({ ...form, mode: 'skor_kategori' })} style={s.modeBtn(form.mode === 'skor_kategori')}>
                  <Award size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>Skor / Kategori</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>Cocok untuk gaya belajar, kepuasan, dll</div>
                  </div>
                </button>
              </div>

              {form.mode === 'skor_kategori' && (
                <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12 }}>
                  <label style={{ ...s.label, color: '#b45309' }}>Daftar Kategori (contoh: Visual, Auditori, Kinestetik)</label>
                  {form.categories.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <input value={c} onChange={e => updateCategory(idx, e.target.value)} placeholder={`Kategori ${idx + 1}`} style={{ ...s.input, background: 'white' }} />
                      {form.categories.length > 2 && (
                        <button type="button" onClick={() => removeCategory(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addCategory} style={{ fontSize: 11, color: '#b45309', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    <Plus size={12} /> Tambah Kategori
                  </button>
                  <p style={{ fontSize: 10, color: '#92400e', marginTop: 8, marginBottom: 0 }}>
                    💡 Nanti tiap OPSI JAWABAN di bawah dipetakan ke salah satu kategori ini. Sistem otomatis menghitung kategori dominan tiap siswa + bagan agregatnya.
                  </p>
                </div>
              )}
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
                    style={{ ...s.input, marginBottom: 10 }}
                    required
                  />

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, marginRight: 10, fontWeight: 600 }}>Tipe Respon:</label>
                    <select
                      value={q.type || 'pilihan'}
                      onChange={e => updateQ(q.id, 'type', e.target.value)}
                      style={{ ...s.select, width: 'auto', padding: '4px 10px', height: 'auto', display: 'inline-block' }}
                    >
                      <option value="pilihan">🔘 Pilihan Ganda</option>
                      {/* 🔥 Isian teks bebas gak relevan untuk mode skor/kategori
                          (gak bisa dipetakan ke kategori manapun), jadi disembunyikan. */}
                      {form.mode !== 'skor_kategori' && <option value="teks">✍️ Isian Teks Bebas</option>}
                    </select>
                  </div>

                  {/* Opsi Pilihan Ganda (+ kategori kalau mode skor) */}
                  {(!q.type || q.type === 'pilihan') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', gap: 6 }}>
                          <input
                            value={opt}
                            onChange={e => updateOpt(q.id, oIdx, e.target.value)}
                            placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`}
                            style={{ ...s.input, padding: '8px 12px', fontSize: 12, flex: form.mode === 'skor_kategori' ? 1.5 : 1 }}
                          />
                          {form.mode === 'skor_kategori' && (
                            <select
                              value={q.optionCategories?.[oIdx] || ''}
                              onChange={e => updateOptCategory(q.id, oIdx, e.target.value)}
                              style={{ ...s.select, flex: 1, padding: '8px 10px', fontSize: 11, background: '#fffbeb' }}
                            >
                              <option value="">— kategori —</option>
                              {form.categories.filter(c => c.trim()).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          )}
                        </div>
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
                }}
              >
                <Plus size={14} /> Tambah Pertanyaan
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%', padding: 14,
                background: saving ? '#94a3b8' : '#10b981', color: 'white',
                border: 'none', borderRadius: 10,
                fontWeight: 800, fontSize: 14,
                cursor: saving ? 'wait' : 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {saving ? <Loader2 size={16} className="spin-survey" /> : <Save size={16} />}
              {saving ? 'Menyimpan...' : (editingId ? 'Update Survei' : 'Terbitkan Survei')}
            </button>
          </form>
        )}

        {/* ANALYTICS PANEL */}
        {showAnalytics && getAnalytics(showAnalytics) && (() => {
          const data = getAnalytics(showAnalytics);
          const maxCat = data.categoryChart ? Math.max(1, ...Object.values(data.categoryChart)) : 1;
          return (
            <div style={{ background: 'white', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 25 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📊 Hasil Analisis: {data.survey.title}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleExport(showAnalytics)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Download size={13} /> Download Excel
                  </button>
                  <button onClick={() => setShowAnalytics(null)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Tutup</button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 15px 0' }}>📦 Total Respon: {data.totalResponden}</p>

              {/* 🔥 BAGAN KATEGORI DOMINAN (khusus mode skor_kategori) */}
              {data.isSkor && (
                <div style={{ marginBottom: 20, padding: 14, background: '#faf5ff', borderRadius: 10, border: '1px solid #e9d5ff' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PieChart size={15} /> Sebaran Kategori Dominan ({data.totalResponden} responden)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(data.categoryChart).map(([cat, cnt], ci) => (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600 }}>{cat}</span>
                          <span>{cnt} siswa ({data.totalResponden > 0 ? Math.round(cnt / data.totalResponden * 100) : 0}%)</span>
                        </div>
                        <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${(cnt / maxCat) * 100}%`, height: '100%', background: CATEGORY_COLORS[ci % CATEGORY_COLORS.length], borderRadius: 5, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {data.analytics.map((an, i) => (
                  <div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#1e293b' }}>
                      Q{i + 1}. {an.question}
                    </div>

                    {an.type === 'teks' ? (
                      <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        {an.textAnswers.length === 0 ? (
                          <small style={{ color: '#94a3b8' }}>Belum ada isian teks.</small>
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
          );
        })()}

        {/* DAFTAR SURVEI */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}><div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin-survey 1s linear infinite', margin: '0 auto 12px' }}></div></div>
        ) : surveys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
            <ClipboardList size={48} /><p>Belum ada survei.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {surveys.map(survey => {
              const rcount = (responses[survey.id] || []).length;
              return (
                <div key={survey.id} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', borderLeft: `5px solid ${survey.status === 'aktif' ? '#10b981' : '#94a3b8'}` }}>
                  {survey.coverImage && (
                    <div style={{ height: 90, overflow: 'hidden' }}>
                      <img src={survey.coverImage} alt={survey.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: survey.isRequired ? '#fee2e2' : '#e0e7ff', color: survey.isRequired ? '#ef4444' : '#3730a3' }}>
                        {survey.isRequired ? '🔴 WAJIB' : '🔵 OPSIONAL'}
                      </span>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: survey.status === 'aktif' ? '#dcfce7' : '#f1f5f9', color: survey.status === 'aktif' ? '#166534' : '#64748b' }}>
                        {survey.status === 'aktif' ? '🟢 Aktif' : '📦 Arsip'}
                      </span>
                      {survey.mode === 'skor_kategori' && (
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#faf5ff', color: '#7c3aed', fontWeight: 700 }}>
                          <Award size={9} /> Skor/Kategori
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{survey.title}</h3>
                    <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#94a3b8', marginBottom: 10, flexWrap: 'wrap' }}>
                      <span><Target size={10} /> {{
                        semua_siswa: 'Semua Siswa', semua_guru: 'Semua Tentor', semua: 'Siswa & Tentor', jenjang: `Kelas ${survey.targetKelas || ''}`,
                      }[survey.targetType] || survey.targetType}</span>
                      <span><Users size={10} /> {rcount} respons</span>
                      {survey.deadline && <span><Calendar size={10} /> {new Date(survey.deadline).toLocaleDateString('id-ID')}</span>}
                    </div>

                    {/* TOMBOL AKSI */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button onClick={() => openEdit(survey)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#fef3c7', color: '#b45309', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <Edit3 size={11} /> Edit
                      </button>
                      <button onClick={() => setShowAnalytics(showAnalytics === survey.id ? null : survey.id)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#e0e7ff', color: '#3730a3', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <BarChart3 size={11} /> Analisis
                      </button>
                      <button onClick={() => setShowRespondents(showRespondents === survey.id ? null : survey.id)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <Users size={11} /> Responden
                      </button>
                      <button onClick={() => handleToggleStatus(survey.id, survey.status)} style={{ flex: 1, padding: 7, borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 10, minWidth: 50 }}>
                        {survey.status === 'aktif' ? 'Arsip' : 'Aktifkan'}
                      </button>
                      <button onClick={() => handleExport(survey.id)} title="Download Excel" style={{ padding: 7, borderRadius: 6, border: 'none', background: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Download size={11} />
                      </button>
                      <button onClick={() => handleDelete(survey.id)} style={{ padding: 7, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* RESPONDEN LIST */}
                    {showRespondents === survey.id && (() => {
                      const data = getAnalytics(survey.id);
                      return (
                        <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12, maxHeight: 220, overflowY: 'auto' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>📋 Daftar Responden ({(responses[survey.id] || []).length})</div>
                          {(responses[survey.id] || []).length === 0 ? (
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>Belum ada yang mengisi.</p>
                          ) : (
                            (responses[survey.id] || []).map(r => (
                              <div key={r.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 11, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <span><strong>{r.userName || 'Anonim'}</strong></span>
                                {survey.mode === 'skor_kategori' && data?.respondentCategories?.[r.id] && (
                                  <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', background: '#faf5ff', padding: '1px 8px', borderRadius: 10 }}>
                                    {data.respondentCategories[r.id]}
                                  </span>
                                )}
                                <span style={{ color: '#94a3b8', fontSize: 10 }}>
                                  {r.submittedAt?.toDate ? r.submittedAt.toDate().toLocaleString('id-ID') : '-'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin-survey{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.spin-survey{animation:spin-survey 0.8s linear infinite}`}</style>
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
  modeBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10,
    border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: active ? '#eff6ff' : 'white',
    color: active ? '#1e40af' : '#64748b', cursor: 'pointer', textAlign: 'left',
  }),
};

export default ManageSurvey;