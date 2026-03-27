import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import { Download, Award, BookOpen, Info, Star } from 'lucide-react';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentId) return;
      try {
        const q = query(collection(db, "student_grades"), where("studentId", "==", studentId));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => doc.data());
        
        // Data Dummy jika Firebase kosong agar kamu bisa lihat fiturnya langsung
        setGrades(data.length > 0 ? data : [
          { mapel: 'MATEMATIKA', topik: 'Aljabar & Logika', nilai: 88, deskripsi: 'Sangat menguasai penyelesaian variabel kompleks. Pertahankan ketelitian pada operasi pembagian.' },
          { mapel: 'BAHASA INGGRIS', topik: 'Reading Comprehension', nilai: 82, deskripsi: 'Kemampuan memahami teks narasi sangat baik. Perlu memperdalam kosakata istilah teknis.' }
        ]);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchGrades();
  }, [studentId]);

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Menganalisis Data Rapor...</div>;

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.4s ease-out' }}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Rapor Akademik & Capaian</h2>
          <p style={{color: '#64748b', margin: '5px 0 0 0'}}>Pantau grafik perkembangan belajarmu secara real-time.</p>
        </div>
        <button style={styles.btnPdf}><Download size={18}/> Cetak PDF</button>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.iconCircle}><Star color="#f59e0b" fill="#f59e0b" size={20}/></div>
          <div>
            <span style={styles.summaryLabel}>Indeks Prestasi Kumulatif</span>
            <h2 style={{margin: 0, color: '#1e293b'}}>GPA: 3.85</h2>
          </div>
        </div>
        <div style={{...styles.summaryCard, background: '#f0fdf4', borderColor: '#bbf7d0'}}>
          <div style={{...styles.iconCircle, background: '#dcfce7'}}><Award color="#166534" size={20}/></div>
          <div>
            <span style={styles.summaryLabel}>Status Kelulusan</span>
            <h2 style={{margin: 0, color: '#166534'}}>SANGAT BAIK</h2>
          </div>
        </div>
      </div>

      <div style={styles.gradeList}>
        {grades.map((item, idx) => (
          <div key={idx} style={styles.gradeCard}>
            <div style={styles.cardTop}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={styles.mapelIcon}><BookOpen size={20} color="#3b82f6"/></div>
                <div>
                  <b style={{fontSize: '17px', color: '#1e293b'}}>{item.mapel}</b>
                  <div style={{fontSize: '13px', color: '#94a3b8'}}>{item.topik}</div>
                </div>
              </div>
              <div style={styles.scoreCircle}>
                <span style={{fontSize: '22px', fontWeight: '900'}}>{item.nilai}</span>
              </div>
            </div>
            
            <div style={styles.descBox}>
              <div style={{display:'flex', gap: '8px', color: '#475569', fontWeight: '600', fontSize: '13px', marginBottom: '8px'}}>
                <Info size={16} color="#3b82f6"/> Analisis Capaian:
              </div>
              <p style={styles.descText}>{item.deskripsi}</p>
            </div>

            <div style={styles.progressContainer}>
               <div style={{...styles.progressFill, width: `${item.nilai}%`}}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { fontSize: '26px', fontWeight: '800', color: '#1e293b', margin: 0 },
  btnPdf: { background: '#ef4444', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  summaryCard: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '18px' },
  iconCircle: { width: '50px', height: '50px', borderRadius: '14px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' },
  gradeList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  gradeCard: { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  mapelIcon: { width: '45px', height: '45px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scoreCircle: { background: '#3b82f6', color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #dbeafe' },
  descBox: { background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '20px' },
  descText: { fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.6' },
  progressContainer: { height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '10px' }
};

export default StudentGrades;