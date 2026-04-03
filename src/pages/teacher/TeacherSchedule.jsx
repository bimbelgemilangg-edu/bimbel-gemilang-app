import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore"; // Hapus orderBy sementara
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

const TeacherSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const teacherData = JSON.parse(localStorage.getItem('teacherData')) || {};
  const teacherName = teacherData.nama || "";

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!teacherName) return;
      setLoading(true);
      try {
        // Query disederhanakan tanpa orderBy agar tidak terganjal masalah Indeks
        const q = query(
          collection(db, "jadwal_bimbel"),
          where("booker", "==", teacherName)
        );
        
        const snap = await getDocs(q);
        let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Lakukan pengurutan secara manual di sisi client (lebih aman)
        data.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
        
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
        {/* ... (Header tetap sama) ... */}
        
        {loading ? (
            <div style={styles.loadingArea}><p>Memuat jadwal...</p></div>
        ) : schedules.length === 0 ? (
            <div className="teacher-card" style={styles.emptyCard}>
                <h3>Belum Ada Jadwal</h3>
                <p>Cek apakah nama di profil ("{teacherName}") sama dengan di data Admin.</p>
            </div>
        ) : (
            <div className="responsive-grid">
                {schedules.map((item) => (
                    <div key={item.id} className="teacher-card" style={styles.card}>
                        <div style={styles.dateHeader}>
                            <div style={styles.dateBadge}>{item.dateStr}</div>
                            <span style={styles.programBadge}>{item.program}</span>
                        </div>
                        
                        <h3 style={styles.classTitle}>{item.title || "Materi Umum"}</h3>
                        
                        <div style={styles.infoRow}>
                            <div style={styles.infoItem}><Clock size={14}/> {item.start} - {item.end}</div>
                            <div style={styles.infoItem}><MapPin size={14}/> Ruang {item.planet}</div>
                        </div>

                        <div style={styles.studentSection}>
                            <div style={styles.studentLabel}><Users size={14}/> SISWA:</div>
                            <div style={styles.studentList}>
                                {/* PERBAIKAN: Ambil properti 'nama' dari dalam objek siswa */}
                                {item.students && item.students.length > 0 
                                  ? item.students.map(s => s.nama).join(", ") 
                                  : "Tidak ada siswa"}
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

// ... (styles tetap sama)
export default TeacherSchedule;