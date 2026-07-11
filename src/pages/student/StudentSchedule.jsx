// src/pages/student/StudentSchedule.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import SidebarSiswa from '../../components/SidebarSiswa';

const StudentSchedule = () => {
  const [mySchedules, setMySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  
  // Ambil ID Siswa dari localStorage
  const studentId = localStorage.getItem('studentId');

  // Helper tanggal
  const getSmartDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchMySchedules = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const todayStr = getSmartDateString(new Date());

        const q = query(
          collection(db, "jadwal_bimbel"), 
          where("dateStr", ">=", todayStr),
          orderBy("dateStr", "asc")
        );
        
        const snap = await getDocs(q);
        const allSchedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Filter jadwal yang mengandung studentId
        const myData = allSchedules.filter(item => 
          item.students && item.students.some(s => s.id === studentId || s.studentId === studentId)
        );

        setMySchedules(myData);
      } catch (e) {
        console.error("Error loading schedule:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMySchedules();
  }, [studentId]);

  return (
    <div style={{ display: 'flex', background: '#f0f2f5', minHeight: '100vh' }}>
      <SidebarSiswa activeMenu="jadwal" />
      
      <div style={{
        ...styles.content,
        marginLeft: isMobile ? '0px' : '270px', // ← DINAMIS
        padding: isMobile ? '15px' : '30px',
      }}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>📅 Jadwal Belajar Kamu</h2>
          <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>Pantau jadwal harian dan persiapkan diri untuk belajar!</p>
        </div>

        {loading ? (
          <div style={styles.statusText}>Memvalidasi jadwal...</div>
        ) : mySchedules.length === 0 ? (
          <div style={styles.emptyCard}>
            <p>Belum ada jadwal belajar mendatang untukmu.</p>
            <small>Hubungi Admin jika jadwal belum muncul.</small>
          </div>
        ) : (
          <div style={{
            ...styles.scheduleGrid,
            gridTemplateColumns: isMobile 
              ? '1fr' 
              : 'repeat(auto-fill, minmax(280px, 1fr))', // ← AUTO-FILL
          }}>
            {mySchedules.map(item => (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.badgePlanet}>🪐 {item.planet}</div>
                  <div style={styles.badgeProgram}>{item.program}</div>
                </div>
                
                <h3 style={styles.title}>{item.title || "Sesi Belajar"}</h3>
                
                <div style={styles.infoRow}>
                  <span style={styles.icon}>⏰</span> 
                  <span style={styles.infoText}>{item.start} - {item.end}</span>
                </div>
                
                <div style={styles.infoRow}>
                  <span style={styles.icon}>🗓️</span> 
                  <span style={styles.infoText}>
                    {new Date(item.dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>

                <div style={styles.teacherSection}>
                  <small style={{ color: '#999' }}>Guru Pengajar:</small>
                  <div style={styles.teacherName}>👨‍🏫 {item.teacherName || item.booker}</div>
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
  content: { 
    width: '100%', 
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
    maxWidth: '100vw',
    overflowX: 'hidden'
  },
  header: { marginBottom: '30px' },
  statusText: { padding: '20px', color: '#666' },
  emptyCard: { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '15px', 
    textAlign: 'center', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)', 
    color: '#7f8c8d' 
  },
  scheduleGrid: { 
    display: 'grid', 
    gap: '20px',
    width: '100%'
  },
  card: { 
    background: 'white', 
    borderRadius: '15px', 
    padding: '20px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
    border: '1px solid #f0f0f0' 
  },
  cardTop: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    marginBottom: '15px' 
  },
  badgePlanet: { 
    background: '#e3f2fd', 
    color: '#1976d2', 
    padding: '4px 10px', 
    borderRadius: '20px', 
    fontSize: '11px', 
    fontWeight: 'bold' 
  },
  badgeProgram: { 
    background: '#fff3e0', 
    color: '#f57c00', 
    padding: '4px 10px', 
    borderRadius: '20px', 
    fontSize: '11px', 
    fontWeight: 'bold' 
  },
  title: { 
    fontSize: '18px', 
    margin: '0 0 15px 0', 
    color: '#2c3e50' 
  },
  infoRow: { 
    display: 'flex', 
    alignItems: 'center', 
    marginBottom: '8px' 
  },
  icon: { marginRight: '10px', fontSize: '16px' },
  infoText: { fontSize: '14px', color: '#555' },
  teacherSection: { 
    marginTop: '15px', 
    paddingTop: '15px', 
    borderTop: '1px dashed #eee' 
  },
  teacherName: { 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    marginTop: '3px' 
  }
};

export default StudentSchedule;