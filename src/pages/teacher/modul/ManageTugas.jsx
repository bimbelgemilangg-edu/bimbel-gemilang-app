import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Edit3, Clock, ArrowLeft, BookOpen, Target, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageTugas = () => {
  const [tugas, setTugas] = useState({ 
    title: '', 
    desc: '', 
    deadline: '',
    targetKategori: 'Semua',
    targetKelas: 'Semua'
  });
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [showConfig, setShowConfig] = useState(false);
  const navigate = useNavigate();

  // Ambil daftar kelas dari database
  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snapSiswa = await getDocs(collection(db, "students"));
        const siswaData = snapSiswa.docs.map(d => d.data());
        const kelas = [...new Set(siswaData.map(s => s.kelasSekolah).filter(Boolean))];
        kelas.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setAvailableClasses(kelas);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    fetchClasses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!tugas.title) return alert("❌ Judul tugas wajib diisi!");
    if (!tugas.desc) return alert("❌ Instruksi tugas wajib diisi!");
    
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
          <p style={styles.subtitle}>Tugas akan muncul di dashboard siswa dan di halaman E-Learning</p>
        </div>

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

          {/* TARGET PUBLISH (OPSIONAL) */}
          {showConfig && (
            <div style={styles.configPanel}>
              <p style={styles.configTitle}>🎯 Target Publikasi Tugas</p>
              <div style={styles.configRow}>
                <div style={styles.configGroup}>
                  <label style={styles.labelSmall}>
                    <Users size={12} /> Program
                  </label>
                  <select 
                    value={tugas.targetKategori}
                    onChange={e => setTugas({...tugas, targetKategori: e.target.value})}
                    style={styles.select}
                  >
                    <option value="Semua">📚 Semua Program</option>
                    <option value="Reguler">📚 Reguler</option>
                    <option value="English">🗣️ English</option>
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
                  >
                    <option value="Semua">📋 Semua Kelas</option>
                    {availableClasses.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.infoBox}>
                <AlertCircle size={12} color="#3b82f6" />
                <span style={styles.infoText}>
                  Tugas akan muncul untuk siswa dengan program dan kelas yang dipilih.
                  Jika memilih "Semua", tugas akan muncul untuk semua siswa.
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
  configTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0'
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