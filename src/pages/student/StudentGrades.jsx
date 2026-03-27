import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Download, Award, BookOpen, Info, Target, TrendingUp } from 'lucide-react';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentId) return;
      try {
        // SINKRONISASI: Mengambil dari collection "grades" (sesuai kode guru)
        const q = query(
          collection(db, "grades"), 
          where("studentId", "==", studentId)
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Urutkan berdasarkan tanggal terbaru di sisi client jika index belum ada
        data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        setGrades(data);
      } catch (err) { 
        console.error("Error fetching grades:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchGrades();
  }, [studentId]);

  // Hitung GPA Sederhana (Rata-rata Nilai / 25 untuk skala 4)
  const calculateGPA = () => {
    if (grades.length === 0) return "0.0";
    const avg = grades.reduce((acc, curr) => acc + curr.nilai, 0) / grades.length;
    return (avg / 25).toFixed(2);
  };

  const handleDownloadPDF = () => {
    alert("Fitur ekspor PDF sedang disiapkan oleh sistem. Silakan hubungi admin untuk cetak fisik.");
  };

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Menganalisis Capaian Akademik...</div>;

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease' }}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📊 Progres & Capaian Belajar</h2>
          <p style={{color: '#64748b', margin: '5px 0 0 0'}}>Data real-time berdasarkan input pengajar.</p>
        </div>
        <button onClick={handleDownloadPDF} style={styles.btnPdf}><Download size={18}/> Download PDF</button>
      </div>

      {/* GPA & TREN CARD */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.iconCircle}><Award color="#f59e0b" size={24}/></div>
          <div>
            <span style={styles.summaryLabel}>Indeks Prestasi (GPA)</span>
            <h2 style={{margin: 0, color: '#1e293b'}}>{calculateGPA()} <span style={{fontSize: '14px', color: '#94a3b8'}}>/ 4.0</span></h2>
          </div>
        </div>
        <div style={{...styles.summaryCard, background: '#eff6ff'}}>
          <div style={{...styles.iconCircle, background: '#dbeafe'}}><TrendingUp color="#3b82f6" size={24}/></div>
          <div>
            <span style={styles.summaryLabel}>Total Materi Tuntas</span>
            <h2 style={{margin: 0, color: '#1e293b'}}>{grades.length} Topik</h2>
          </div>
        </div>
      </div>

      {/* DETAIL PER MATA PELAJARAN */}
      <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b'}}>Rincian Nilai & Analisis Karakter</h3>
      
      {grades.length === 0 ? (
        <div style={styles.emptyBox}>Belum ada data nilai yang diinput oleh guru.</div>
      ) : (
        <div style={styles.gradeList}>
          {grades.map((item, idx) => (
            <div key={idx} style={styles.gradeCard}>
              <div style={styles.cardTop}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={styles.mapelBadge}>{item.mapel}</div>
                  <div>
                    <b style={{fontSize: '16px', color: '#1e293b'}}>{item.topik}</b>
                    <div style={{fontSize: '12px', color: '#94a3b8'}}>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <div style={styles.scoreBox}>
                   <span style={{fontSize: '10px', fontWeight: 'bold', color: '#94a3b8'}}>NILAI</span>
                   <div style={{fontSize: '24px', fontWeight: '900', color: item.nilai >= 75 ? '#22c55e' : '#ef4444'}}>{item.nilai}</div>
                </div>
              </div>

              {/* BAR PROGRESS */}
              <div style={styles.progressBg}><div style={{...styles.progressFill, width: `${item.nilai}%`}}></div></div>

              {/* ANALISIS KARAKTER (Data dari Qualitative Guru) */}
              <div style={styles.charGrid}>
                <div style={styles.charItem}>
                  <Target size={14} color="#3b82f6"/> 
                  <span>Pemahaman: <b>{item.qualitative?.pemahaman || 0}/5</b></span>
                </div>
                <div style={styles.charItem}>
                  <Target size={14} color="#3b82f6"/> 
                  <span>Aplikasi: <b>{item.qualitative?.aplikasi || 0}/5</b></span>
                </div>
                <div style={styles.charItem}>
                  <Target size={14} color="#3b82f6"/> 
                  <span>Kemandirian: <b>{item.qualitative?.mandiri || 0}/5</b></span>
                </div>
              </div>

              {/* DESKRIPSI OTOMATIS BERDASARKAN NILAI */}
              <div style={styles.descBox}>
                <Info size={16} color="#64748b" style={{marginTop: '2px'}}/>
                <p style={styles.descText}>
                  {item.nilai >= 85 ? `Luar biasa! Penguasaan materi ${item.topik} sudah sangat matang.` : 
                   item.nilai >= 75 ? `Sudah mencapai KKM. Tingkatkan lagi pemahaman pada aspek aplikasi soal.` : 
                   `Perlu bimbingan intensif pada topik ini. Segera jadwalkan konsultasi dengan pengajar.`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 },
  btnPdf: { background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  summaryCard: { background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  iconCircle: { width: '50px', height: '50px', borderRadius: '15px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: '12px', color: '#64748b', fontWeight: 'bold' },
  gradeList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  gradeCard: { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  mapelBadge: { background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' },
  scoreBox: { textAlign: 'right' },
  progressBg: { height: '8px', background: '#f1f5f9', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '10px' },
  charGrid: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  charItem: { fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px' },
  descBox: { background: '#f8fafc', padding: '15px', borderRadius: '12px', display: 'flex', gap: '10px' },
  descText: { fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' },
  emptyBox: { textAlign: 'center', padding: '40px', background: 'white', borderRadius: '20px', color: '#94a3b8', border: '1px dashed #e2e8f0' }
};

export default StudentGrades;