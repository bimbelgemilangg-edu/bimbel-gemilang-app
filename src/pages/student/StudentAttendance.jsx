// src/pages/student/StudentAttendance.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil ID & Nama Siswa dari localStorage
  const studentId = localStorage.getItem('studentId');
  const studentNameLS = localStorage.getItem('studentName');

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentId && !studentNameLS) return;
      setLoading(true);
      try {
        // 🔥 FIX: sebelumnya CUMA cari lewat 1 skema ID (studentId dari
        // localStorage) -- ternyata nilai itu SERING SALAH (localStorage
        // nyimpen kode unik siswa, bukan ID dokumen Firestore asli yang
        // dipakai nulis data absensi). Sekarang dicari juga lewat NAMA
        // sebagai jaring pengaman kedua, biar tetap ketemu walau ID-nya
        // gak cocok.
        const queries = [
          studentId ? getDocs(query(collection(db, "attendance"), where("studentId", "==", studentId))) : Promise.resolve({ docs: [] }),
          studentNameLS ? getDocs(query(collection(db, "attendance"), where("studentName", "==", studentNameLS))) : Promise.resolve({ docs: [] }),
          studentNameLS ? getDocs(query(collection(db, "attendance"), where("namaSiswa", "==", studentNameLS))) : Promise.resolve({ docs: [] }),
        ];
        const [snapById, snapByName1, snapByName2] = await Promise.all(queries.map(p => p.catch(() => ({ docs: [] }))));

        const merged = new Map();
        [...snapById.docs, ...snapByName1.docs, ...snapByName2.docs].forEach(d => merged.set(d.id, { id: d.id, ...d.data() }));
        const data = Array.from(merged.values());

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
  }, [studentId, studentNameLS]);

  // Hitung Ringkasan
  const stats = {
    hadir: attendance.filter(x => x.status === 'Hadir').length,
    izin: attendance.filter(x => x.status === 'Izin' || x.status === 'Sakit').length,
    alpha: attendance.filter(x => x.status === 'Alpha').length,
  };

  // 🔥 FIX BUG ARSITEKTUR (pola yang sama ditemukan berulang kali di
  // StudentDashboard.jsx dan StudentSchedule.jsx): komponen ini sebelumnya
  // render <SidebarSiswa> SENDIRI + marginLeft:'250px' hardcoded (angka
  // offset KETIGA yang beda dari file lain — 250px di sini, 270px di
  // StudentSchedule, 260px yang benar di SidebarSiswa/SiswaLayout). Padahal
  // route "/siswa/absensi" di App.jsx SUDAH dibungkus <SiswaLayout> yang
  // JUGA render sidebar + offset-nya sendiri. Sekarang komponen ini HANYA
  // render kontennya sendiri, offset/sidebar sepenuhnya diserahkan ke
  // SiswaLayout.
  return (
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
  );
};

const styles = {
  mainContent: { width: '100%', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  header: { marginBottom: '25px' },
  statGrid: { display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' },
  statCard: { flex: '1 1 140px', background: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  tableCard: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', textAlign: 'left', fontSize: '13px', color: '#7f8c8d', borderBottom: '2px solid #f4f6f8' },
  td: { padding: '15px', borderBottom: '1px solid #f9f9f9', fontSize: '14px' },
  tr: { transition: '0.2s' },
  badgeGreen: { background: '#e1f7e3', color: '#1db446', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgeYellow: { background: '#fff9db', color: '#f08c00', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgeRed: { background: '#fff5f5', color: '#fa5252', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
};

export default StudentAttendance;