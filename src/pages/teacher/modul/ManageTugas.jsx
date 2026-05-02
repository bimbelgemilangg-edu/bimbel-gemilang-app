import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Edit3, Clock, ArrowLeft, BookOpen, Target, Users, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageTugas = () => {
  const [tugas, setTugas] = useState({ 
    title: '', 
    desc: '', 
    deadline: '',
    targetKategori: 'Reguler',
    targetKelas: '1 SD'
  });
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availablePrograms] = useState(['Reguler', 'English']);
  const [showConfig, setShowConfig] = useState(true);
  const [warningShown, setWarningShown] = useState(false);
  const navigate = useNavigate();

  // Ambil daftar kelas dari database
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snapSiswa = await getDocs(collection(db, "students"));
        const siswaData = snapSiswa.docs.map(d => d.data());
        const kelas = [...new Set(siswaData.map(s => s.kelasSekolah).filter(Boolean))];
        kelas.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setAvailableClasses(['Semua', ...kelas]);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setAvailableClasses(['Semua', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '7 SMP', '8 SMP', '9 SMP']);
      }
    };
    fetchClasses();
  }, []);

  // Peringatan jika target masih "Semua"
  useEffect(() => {
    if ((tugas.targetKelas === 'Semua' || tugas.targetKategori === 'Semua') && !warningShown && tugas.title) {
      setWarningShown(true);
      setTimeout(() => setWarningShown(false), 5000);
    }
  }, [tugas.targetKelas, tugas.targetKategori, tugas.title, warningShown]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!tugas.title) return alert("❌ Judul tugas wajib diisi!");
    if (!tugas.desc) return alert("❌ Instruksi tugas wajib diisi!");
    
    // Peringatan jika target masih "Semua"
    if (tugas.targetKelas === 'Semua' && tugas.targetKategori === 'Semua') {
      if (!window.confirm("⚠️ Peringatan: Tugas ini akan muncul untuk SEMUA siswa (semua kelas dan program).\n\nLanjutkan?")) {
        return;
      }
    } else if (tugas.targetKelas === 'Semua') {
      if (!window.confirm(`⚠️ Peringatan: Tugas ini akan muncul untuk SEMUA kelas pada program ${tugas.targetKategori}.\n\nLanjutkan?`)) {
        return;
      }
    } else if (tugas.targetKategori === 'Semua') {
      if (!window.confirm(`⚠️ Peringatan: Tugas ini akan muncul untuk SEMUA program pada kelas ${tugas.targetKelas}.\n\nLanjutkan?`)) {
        return;
      }
    }
    
    setLoading(true);
    try {
      // 🔥 SIMPAN KE "bimbel_modul" DENGAN FIELD LENGKAP
      await addDoc(collection(db, "bimbel_modul"), {
        title: tugas.title.toUpperCase(),
        subject: "Tugas",
        description: tugas.desc,
        deadlineTugas: tugas.deadline || null,
        type: 'assignment',
        targetKategori: tugas.targetKategori,
        targetKelas: tugas.targetKelas,
        status: 'aktif',
        blocks: [{ 
          id: Date.now(), 
          type: 'assignment', 
          title: "Instruksi Tugas", 
          content: tugas.desc,
          endTime: tugas.deadline || null
        }],
        quizData: [],
        authorName: localStorage.getItem('teacherName') || localStorage.getItem('userName') || "Guru",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert(`✅ Tugas "${tugas.title}" berhasil dipublikasikan!`);
      navigate('/guru/modul');
    } catch (err) {
      console.error("Error creating tugas:", err);
      alert("❌ Gagal mengirim tugas: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={() => navigate('/guru/modul')} style={styles.btnBack}>
          <ArrowLeft size={18}/> Kembali ke Modul
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <Edit3 size={28} color="#673ab7" />
          </div>
          <h2 style={styles.title}>Buat Tugas Baru</h2>
          <p style={styles.subtitle}>Tugas akan muncul di dashboard siswa dan halaman E-Learning</p>
        </div>

        {/* Peringatan jika target masih "Semua" */}
        {warningShown && (tugas.targetKelas === 'Semua' || tugas.targetKategori === 'Semua') && (
          <div style={styles.warningBox}>
            <AlertCircle size={16} color="#f59e0b" />
            <span style={styles.warningText}>
              ⚠️ Perhatikan: Tugas ini akan muncul untuk {tugas.targetKelas === 'Semua' ? 'SEMUA KELAS' : `kelas ${tugas.targetKelas}`} 
              pada program {tugas.targetKategori === 'Semua' ? 'SEMUA PROGRAM' : tugas.targetKategori}.
            </span>
          </div>
        )}

        <form onSubmit={handleCreate} style={styles.form}>
          {/* JUDUL TUGAS */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Edit3 size={14} /> Judul Tugas <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              style={styles.input} 
              placeholder="Contoh: Tugas Matematika Aljabar" 
              value={tugas.title}
              onChange={e => setTugas({...tugas, title: e.target.value})} 
            />
          </div>

          {/* INSTRUKSI */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <BookOpen size={14} /> Instruksi / Deskripsi Tugas <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea 
              style={{...styles.input, height: '120px', resize: 'vertical'}} 
              placeholder="Tuliskan detail apa yang harus dikerjakan siswa, format pengumpulan, dan kriteria penilaian..." 
              value={tugas.desc}
              onChange={e => setTugas({...tugas, desc: e.target.value})} 
            />
          </div>

          {/* BATAS WAKTU */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Clock size={14} /> Batas Waktu Pengumpulan (Opsional)
            </label>
            <input 
              type="datetime-local" 
              style={styles.input} 
              value={tugas.deadline}
              onChange={e => setTugas({...tugas, deadline: e.target.value})} 
            />
            <p style={styles.hintText}>Kosongkan jika tidak ada batas waktu</p>
          </div>

          {/* TOMBOL KONFIGURASI TARGET */}
          <button 
            type="button" 
            onClick={() => setShowConfig(!showConfig)}
            style={styles.btnConfig}
          >
            <Target size={14} /> {showConfig ? 'Sembunyikan' : 'Tampilkan'} Pengaturan Target
          </button>

          {/* TARGET PUBLISH */}
          {showConfig && (
            <div style={styles.configPanel}>
              <div style={styles.configHeader}>
                <Shield size={14} color="#3b82f6" />
                <span style={styles.configHeaderText}>🎯 Target Publikasi Tugas</span>
              </div>
              
              <div style={styles.configRow}>
                <div style={styles.configGroup}>
                  <label style={styles.labelSmall}>
                    <Users size={12} /> Program / Kategori
                  </label>
                  <select 
                    value={tugas.targetKategori}
                    onChange={e => setTugas({...tugas, targetKategori: e.target.value})}
                    style={styles.select}
                    className={tugas.targetKategori === 'Semua' ? 'warning-select' : ''}
                  >
                    <option value="Reguler">📚 Reguler</option>
                    <option value="English">🗣️ English</option>
                    <option value="Semua">🌐 Semua Program</option>
                  </select>
                </div>
                <div style={styles.configGroup}>
                  <label style={styles.labelSmall}>
                    <Target size={12} /> Kelas
                  </label>
                  <select 
                    value={tugas.targetKelas}
                    onChange={e => setTugas({...tugas, targetKelas: e.target.value})}
                    style={styles.select}
                    className={tugas.targetKelas === 'Semua' ? 'warning-select' : ''}
                  >
                    {availableClasses.map(k => (
                      <option key={k} value={k}>{k === 'Semua' ? '📋 Semua Kelas' : k}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={styles.infoBox}>
                <AlertCircle size={12} color={tugas.targetKelas === 'Semua' || tugas.targetKategori === 'Semua' ? '#f59e0b' : '#10b981'} />
                <span style={styles.infoText}>
                  {tugas.targetKelas === 'Semua' && tugas.targetKategori === 'Semua' ? (
                    <strong style={{ color: '#f59e0b' }}>⚠️ Peringatan: Tugas ini akan muncul untuk SEMUA siswa!</strong>
                  ) : tugas.targetKelas === 'Semua' ? (
                    <span>Tugas akan muncul untuk <strong>SEMUA KELAS</strong> pada program <strong>{tugas.targetKategori}</strong>.</span>
                  ) : tugas.targetKategori === 'Semua' ? (
                    <span>Tugas akan muncul untuk <strong>SEMUA PROGRAM</strong> pada kelas <strong>{tugas.targetKelas}</strong>.</span>
                  ) : (
                    <span>Tugas akan muncul untuk program <strong>{tugas.targetKategori}</strong> - Kelas <strong>{tugas.targetKelas}</strong>.</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* TOMBOL SUBMIT */}
          <button 
            type="submit" 
            disabled={loading}
            style={loading ? styles.btnDisabled : styles.btnSubmit}
          >
            {loading ? (
              <>
                <div style={styles.spinnerSmall}></div>
                Memproses...
              </>
            ) : (
              '📤 Publikasikan Tugas'
            )}
          </button>
        </form>

        {/* INFO PENTING */}
        <div style={styles.infoFooter}>
          <CheckCircle size={14} color="#10b981" />
          <span style={styles.infoFooterText}>
            Tugas yang sudah dipublikasikan akan langsung terlihat di dashboard siswa dan halaman E-Learning.
            Siswa dapat mengupload jawaban berupa file atau teks.
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .warning-select {
          border-color: #f59e0b !important;
          background-color: #fffbeb !important;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: { 
    padding: '40px 20px', 
    background: '#f8fafc', 
    minHeight: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center' 
  },
  topBar: { 
    width: '100%', 
    maxWidth: '700px', 
    marginBottom: '20px' 
  },
  btnBack: { 
    background: 'none', 
    border: 'none', 
    color: '#64748b', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    fontWeight: 'bold',
    fontSize: '13px'
  },
  card: { 
    background: 'white', 
    width: '100%', 
    maxWidth: '700px', 
    padding: '32px', 
    borderRadius: '24px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  header: { 
    textAlign: 'center', 
    marginBottom: '28px' 
  },
  iconCircle: { 
    background: '#f3e8ff', 
    width: '64px', 
    height: '64px', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    margin: '0 auto 15px' 
  },
  title: { 
    fontSize: '22px', 
    color: '#1e293b', 
    fontWeight: '800',
    margin: '0 0 4px 0'
  },
  subtitle: { 
    fontSize: '12px', 
    color: '#64748b', 
    margin: 0 
  },
  warningBox: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  warningText: {
    fontSize: '11px',
    color: '#b45309',
    flex: 1
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px' 
  },
  inputGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  label: { 
    fontSize: '13px', 
    fontWeight: 'bold', 
    color: '#475569', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px' 
  },
  labelSmall: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    display: 'block',
    marginBottom: '4px'
  },
  input: { 
    padding: '12px 14px', 
    borderRadius: '10px', 
    border: '1px solid #e2e8f0', 
    outline: 'none', 
    fontSize: '14px', 
    transition: '0.2s',
    fontFamily: 'inherit'
  },
  hintText: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '4px'
  },
  btnConfig: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center'
  },
  configPanel: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  configHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '12px'
  },
  configHeaderText: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1e293b'
  },
  configRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px'
  },
  configGroup: {
    flex: 1
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '12px',
    background: 'white',
    outline: 'none'
  },
  infoBox: {
    background: '#eef2ff',
    padding: '10px',
    borderRadius: '8px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start'
  },
  infoText: {
    fontSize: '10px',
    color: '#4338ca',
    lineHeight: '1.4',
    flex: 1
  },
  btnSubmit: { 
    background: '#673ab7', 
    color: 'white', 
    border: 'none', 
    padding: '14px', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    marginTop: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: '0.3s'
  },
  btnDisabled: { 
    background: '#cbd5e1', 
    color: '#94a3b8', 
    border: 'none', 
    padding: '14px', 
    borderRadius: '12px', 
    cursor: 'not-allowed', 
    marginTop: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid white',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite'
  },
  infoFooter: {
    marginTop: '24px',
    padding: '12px',
    background: '#f0fdf4',
    borderRadius: '10px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    border: '1px solid #bbf7d0'
  },
  infoFooterText: {
    fontSize: '11px',
    color: '#166534',
    lineHeight: '1.4',
    flex: 1
  }
};

export default ManageTugas;