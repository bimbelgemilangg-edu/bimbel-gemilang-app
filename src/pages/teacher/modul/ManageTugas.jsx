import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Edit3, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageTugas = () => {
  const [tugas, setTugas] = useState({ title: '', desc: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!tugas.title || !tugas.desc) return alert("Judul dan Instruksi wajib diisi!");
    
    setLoading(true);
    try {
      // 🔥 PERBAIKAN: Simpan ke "bimbel_modul" (BUKAN "moduls")
      await addDoc(collection(db, "bimbel_modul"), {
        title: tugas.title.toUpperCase(),
        subject: "Tugas",
        description: tugas.desc,
        deadlineTugas: tugas.deadline || null,
        type: 'assignment', // Flag untuk identifikasi tugas
        targetKategori: "Semua", // Bisa diubah sesuai kebutuhan
        targetKelas: "Semua",
        status: 'aktif',
        // Struktur blocks agar terbaca di dashboard siswa
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

      alert("✅ Tugas berhasil dipublikasikan!");
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
          <ArrowLeft size={18}/> Kembali
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}><Edit3 size={24} color="#673ab7"/></div>
          <h2 style={styles.title}>Buat Tugas Baru</h2>
          <p style={styles.subtitle}>Tugas akan muncul di dashboard siswa</p>
        </div>

        <div style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Judul Tugas</label>
            <input 
              style={styles.input} 
              placeholder="Contoh: Tugas Matematika Aljabar" 
              onChange={e => setTugas({...tugas, title: e.target.value})} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Instruksi Lengkap</label>
            <textarea 
              style={{...styles.input, height: '120px', resize: 'none'}} 
              placeholder="Tuliskan detail apa yang harus dikerjakan siswa..." 
              onChange={e => setTugas({...tugas, desc: e.target.value})} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><Clock size={14}/> Batas Waktu Pengumpulan (Opsional)</label>
            <input 
              type="datetime-local" 
              style={styles.input} 
              onChange={e => setTugas({...tugas, deadline: e.target.value})} 
            />
          </div>

          <button 
            onClick={handleCreate} 
            disabled={loading}
            style={loading ? styles.btnDisabled : styles.btnSubmit}
          >
            {loading ? "Memproses..." : "Publikasikan Tugas"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '600px', marginBottom: '20px' },
  btnBack: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
  card: { background: 'white', width: '100%', maxWidth: '600px', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  header: { textAlign: 'center', marginBottom: '30px' },
  iconCircle: { background: '#f3e8ff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
  title: { fontSize: '22px', color: '#1e293b', fontWeight: '800' },
  subtitle: { fontSize: '12px', color: '#64748b', marginTop: '5px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' },
  input: { padding: '12px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', transition: '0.2s' },
  btnSubmit: { background: '#673ab7', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(103, 58, 183, 0.3)' },
  btnDisabled: { background: '#cbd5e1', color: '#94a3b8', border: 'none', padding: '15px', borderRadius: '12px', cursor: 'not-allowed', marginTop: '10px' }
};

export default ManageTugas;