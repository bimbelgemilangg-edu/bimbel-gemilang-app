import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

const TeacherSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ambil data guru dari localStorage
  const teacherData = JSON.parse(localStorage.getItem('teacherData')) || {};
  const teacherName = teacherData.nama || "";

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!teacherName) return;
      setLoading(true);
      try {
        // Mengambil jadwal berdasarkan nama guru (booker)
        const q = query(
          collection(db, "jadwal_bimbel"),
          where("booker", "==", teacherName),
          orderBy("dateStr", "asc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter untuk hanya menampilkan jadwal mendatang atau hari ini
        const today = new Date().toISOString().split('T')[0];
        const upcoming = data.filter(item => item.dateStr >= today);
        
        setSchedules(upcoming);
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [teacherName]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📅 Jadwal Mengajar Anda</h2>
        <p style={styles.subtitle}>Daftar kelas yang terjadwal untuk Anda.</p>
      </div>

      {loading ? (
        <p>Memuat jadwal...</p>
      ) : schedules.length === 0 ? (
        <div style={styles.emptyCard}>
          <p>Tidak ada jadwal mengajar ditemukan.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {schedules.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.dateTag}>{item.dateStr}</div>
              <h3 style={styles.classTitle}>{item.title || "Materi Umum"}</h3>
              <div style={styles.infoRow}>
                <span>⏰ {item.start} - {item.end}</span>
                <span style={styles.programBadge}>{item.program}</span>
              </div>
              <div style={styles.studentList}>
                <strong>Siswa:</strong> {item.students?.join(", ") || "-"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '30px', background: '#f4f7f6', minHeight: '100vh' },
  header: { marginBottom: '30px' },
  title: { margin: 0, color: '#2c3e50' },
  subtitle: { color: '#7f8c8d', margin: '5px 0 0 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: '5px solid #3498db' },
  dateTag: { fontSize: '12px', fontWeight: 'bold', color: '#3498db', marginBottom: '10px' },
  classTitle: { margin: '0 0 10px 0', fontSize: '18px', color: '#2c3e50' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontSize: '14px' },
  programBadge: { background: '#ebf5fb', color: '#2980b9', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px' },
  studentList: { fontSize: '13px', color: '#636e72', borderTop: '1px solid #eee', paddingTop: '10px' },
  emptyCard: { background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center', color: '#95a5a6' }
};

export default TeacherSchedule;