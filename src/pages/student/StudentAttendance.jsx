import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import SidebarSiswa from '../../components/SidebarSiswa';

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ambil ID Siswa dari localStorage
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        // Query ke koleksi 'attendance' berdasarkan studentId (Konek dengan data Admin)
        const q = query(
          collection(db, "attendance"), 
          where("studentId", "==", studentId)
        );
        
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Urutkan berdasarkan tanggal terbaru
        data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        setAttendance(data);
      } catch (e) {
        console.error("Gagal memuat absensi:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [studentId]);

  // Hitung Ringkasan
  const stats = {
    hadir: attendance.filter(x => x.status === 'Hadir').length,
    izin: attendance.filter(x => x.status === 'Izin' || x.status === 'Sakit').length,
    alpha: attendance.filter(x => x.status === 'Alpha').length,
  };

  return (
    <div style={{ display: 'flex', background: '#f8f9fa', minHeight: '100vh' }}>
      <SidebarSiswa activeMenu="absensi" />
      
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>📝 Riwayat Kehadiran</h2>
          <p style={{ color: '#666', marginTop: '5px' }}>Pantau kedisiplinan dan catatan kehadiranmu.</p>
        </div>

        {/* Ringkasan Statistik */}
        <div style={styles.statGrid}>
          <div style={{ ...styles.statCard, borderLeft: '5px solid #2ecc71' }}>
            <small>HADIR</small>
            <h3>{stats.hadir}</h3>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '5px solid #f1c40f' }}>
            <small>IZIN/SAKIT</small>
            <h3>{stats.izin}</h3>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '5px solid #e74c3c' }}>
            <small>ALPHA</small>
            <h3>{stats.alpha}</h3>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Memuat data kehadiran...</p>
        ) : (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: '#f4f6f8' }}>
                  <th style={styles.th}>Tanggal</th>
                  <th style={styles.th}>Mata Pelajaran</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                      Belum ada data kehadiran yang tercatat.
                    </td>
                  </tr>
                ) : (
                  attendance.map((item) => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { 
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                        })}
                      </td>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{item.mapel || "Umum"}</td>
                      <td style={styles.td}>
                        <span style={
                          item.status === 'Hadir' ? styles.badgeGreen : 
                          item.status === 'Alpha' ? styles.badgeRed : styles.badgeYellow
                        }>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#7f8c8d', fontSize: '13px' }}>
                        {item.keterangan || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', fontFamily: 'sans-serif' },
  header: { marginBottom: '25px' },
  statGrid: { display: 'flex', gap: '20px', marginBottom: '25px' },
  statCard: { flex: 1, background: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  tableCard: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', textAlign: 'left', fontSize: '13px', color: '#7f8c8d', borderBottom: '2px solid #f4f6f8' },
  td: { padding: '15px', borderBottom: '1px solid #f9f9f9', fontSize: '14px' },
  tr: { transition: '0.2s' },
  badgeGreen: { background: '#e1f7e3', color: '#1db446', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgeYellow: { background: '#fff9db', color: '#f08c00', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgeRed: { background: '#fff5f5', color: '#fa5252', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
};

export default StudentAttendance;