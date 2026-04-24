import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Calendar, Clock, MapPin, Users, BookOpen } from 'lucide-react';

const TeacherSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const teacherData = JSON.parse(localStorage.getItem('teacherData')) || {};
  const teacherName = teacherData.nama || "";
  const teacherId = teacherData.id || "";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!teacherId && !teacherName) return;
    fetchSchedules();
  }, [teacherId, teacherName]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // 🔥 QUERY GANDA: Cari berdasarkan nama ATAU ID
      let allData = [];
      
      // Query by name
      if (teacherName) {
        const q1 = query(
          collection(db, "jadwal_bimbel"),
          where("booker", "==", teacherName),
          orderBy("dateStr", "asc")
        );
        const snap1 = await getDocs(q1);
        allData = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // Query by teacherId (dari field teacherId di jadwal)
      if (teacherId) {
        const q2 = query(
          collection(db, "jadwal_bimbel"),
          where("teacherId", "==", teacherId),
          orderBy("dateStr", "asc")
        );
        const snap2 = await getDocs(q2);
        const data2 = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Gabungkan, hindari duplikat
        data2.forEach(item => {
          if (!allData.find(d => d.id === item.id)) {
            allData.push(item);
          }
        });
      }

      // Filter hanya jadwal hari ini ke depan
      const today = new Date().toISOString().split('T')[0];
      const upcoming = allData.filter(item => item.dateStr >= today);
      
      // Sort by date
      upcoming.sort((a, b) => (a.dateStr || '').localeCompare(b.dateStr || ''));
      
      setSchedules(upcoming);
    } catch (err) { 
      console.error("Error:", err);
      // Fallback: coba tanpa orderBy
      try {
        const q = query(collection(db, "jadwal_bimbel"), where("booker", "==", teacherName));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const today = new Date().toISOString().split('T')[0];
        setSchedules(data.filter(item => item.dateStr >= today));
      } catch (e2) {
        console.error("Fallback error:", e2);
      }
    } 
    finally { setLoading(false); }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 25 }}>
        <div style={{ background: '#673ab7', padding: 12, borderRadius: 14 }}>
          <Calendar size={22} color="white" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b' }}>Jadwal Mengajar</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Halo, <strong>{teacherName}</strong>. Berikut jadwal kelas Anda yang akan datang.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #f3e8ff', borderTop: '3px solid #673ab7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b' }}>Memuat jadwal...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 18, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
          <Calendar size={48} color="#cbd5e1" style={{ marginBottom: 15 }} />
          <h3 style={{ margin: '0 0 8px', color: '#64748b' }}>Belum Ada Jadwal</h3>
          <p style={{ fontSize: 13 }}>Tidak ada jadwal mengajar untuk <strong>{teacherName}</strong>.</p>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>Hubungi Admin jika ini kesalahan.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {schedules.map((item) => (
            <div key={item.id} style={{
              background: 'white', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9',
              borderLeft: '5px solid #673ab7', boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              {/* TANGGAL & PROGRAM */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ background: '#f3e8ff', color: '#673ab7', padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                  📅 {new Date(item.dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span style={{ background: '#f8fafc', color: '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid #e2e8f0' }}>
                  {item.program}
                </span>
              </div>

              {/* JUDUL */}
              <h3 style={{ margin: '0 0 12px', fontSize: 17, color: '#1e293b', fontWeight: 800 }}>
                <BookOpen size={16} style={{ marginRight: 6 }} />
                {item.title || "Materi Umum"}
              </h3>

              {/* INFO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                  <Clock size={14} color="#673ab7" /> {item.start} - {item.end}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                  <MapPin size={14} color="#673ab7" /> Ruang {item.planet || '-'}
                </div>
              </div>

              {/* SISWA */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' }}>
                  <Users size={12} /> {item.students?.length || 0} Siswa Terdaftar
                </div>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {item.students && item.students.length > 0 
                    ? item.students.map(s => s.nama || s).join(", ") 
                    : "Belum ada siswa"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;