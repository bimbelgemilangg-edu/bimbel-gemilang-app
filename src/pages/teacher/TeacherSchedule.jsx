import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

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
        // Query mencocokkan field 'booker' dengan nama guru
        const q = query(
          collection(db, "jadwal_bimbel"),
          where("booker", "==", teacherName),
          orderBy("dateStr", "asc")
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter hanya jadwal hari ini ke depan
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
    <div className="main-content-wrapper">
      <div className="teacher-container-padding">
        <div style={styles.header}>
            <div style={styles.titleGroup}>
                <div style={styles.iconCircle}><Calendar size={24} color="white"/></div>
                <div>
                    <h2 style={styles.titleText}>Jadwal Mengajar</h2>
                    <p style={styles.subtitleText}>Halo, {teacherName}. Berikut jadwal kelas Anda.</p>
                </div>
            </div>
        </div>

        {loading ? (
            <div style={styles.loadingArea}>
                <div className="spinner-global"></div>
                <p>Memuat jadwal...</p>
            </div>
        ) : schedules.length === 0 ? (
            <div className="teacher-card" style={styles.emptyCard}>
                <Calendar size={48} color="#cbd5e1" style={{marginBottom: 15}}/>
                <h3>Belum Ada Jadwal</h3>
                <p>Tidak ada jadwal mengajar yang ditemukan untuk nama: <strong>{teacherName}</strong></p>
            </div>
        ) : (
            <div className="responsive-grid">
                {schedules.map((item) => (
                    <div key={item.id} className="teacher-card teacher-card-hover" style={styles.card}>
                        <div style={styles.dateHeader}>
                            <div style={styles.dateBadge}>
                                {new Date(item.dateStr).toLocaleDateString('id-ID', { 
                                    weekday: 'short', day: 'numeric', month: 'short' 
                                })}
                            </div>
                            <span style={styles.programBadge}>{item.program}</span>
                        </div>
                        
                        <h3 style={styles.classTitle}>{item.title || "Materi Umum"}</h3>
                        
                        <div style={styles.infoRow}>
                            <div style={styles.infoItem}>
                                <Clock size={14} color="#673ab7"/>
                                <span>{item.start} - {item.end}</span>
                            </div>
                            <div style={styles.infoItem}>
                                <MapPin size={14} color="#673ab7"/>
                                <span>Ruang {item.planet}</span>
                            </div>
                        </div>

                        <div style={styles.studentSection}>
                            <div style={styles.studentLabel}>
                                <Users size={14}/> {item.students?.length || 0} SISWA TERDAFTAR:
                            </div>
                            <div style={styles.studentList}>
                                {item.students && item.students.length > 0 
                                  ? item.students.map(s => s.nama).join(", ") 
                                  : "Belum ada siswa terpilih"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  header: { marginBottom: '30px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  iconCircle: { background: '#673ab7', padding: '12px', borderRadius: '16px' },
  titleText: { margin: 0, fontSize: '24px', fontWeight: '900', color: '#1e293b' },
  subtitleText: { color: '#64748b', fontSize: '14px', margin: 0 },
  card: { padding: '24px', borderLeft: '6px solid #673ab7', display: 'flex', flexDirection: 'column', gap: '15px', background:'white' },
  dateHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dateBadge: { background: '#f3e8ff', color: '#673ab7', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' },
  programBadge: { background: '#f8fafc', color: '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '700', border: '1px solid #e2e8f0' },
  classTitle: { margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '800' },
  infoRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569', fontWeight: '600' },
  studentSection: { borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginTop: '5px' },
  studentLabel: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', textTransform: 'uppercase' },
  studentList: { fontSize: '13px', color: '#1e293b', lineHeight: '1.5', fontWeight: '500' },
  loadingArea: { textAlign: 'center', padding: '100px', color: '#64748b' },
  emptyCard: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8', background: 'white', borderRadius: '25px', width: '100%' }
};

export default TeacherSchedule;