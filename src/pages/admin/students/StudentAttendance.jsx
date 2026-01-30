import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';

const StudentAttendance = () => {
  const navigate = useNavigate();
  // Mengambil ID siswa dari alamat URL (nanti dikirim dari halaman list)
  const { id } = useParams(); 

  // Data Dummy (Nanti dari Database)
  const studentInfo = { id: id, nama: "Adit Sopo (Contoh)", kelas: "4 SD" };
  
  const [attendanceData, setAttendanceData] = useState([
    { id: 1, tanggal: "2026-01-20", mapel: "Matematika", status: "Hadir", ket: "-" },
    { id: 2, tanggal: "2026-01-23", mapel: "B. Inggris", status: "Sakit", ket: "Demam" },
    { id: 3, tanggal: "2026-01-27", mapel: "Matematika", status: "Hadir", ket: "-" },
    { id: 4, tanggal: "2026-01-30", mapel: "B. Inggris", status: "Alpha", ket: "Tanpa Kabar" },
  ]);

  // Fungsi Ubah Status
  const handleEdit = (itemId) => {
    const newStatus = prompt("Masukkan Status Baru (Hadir/Sakit/Izin/Alpha):");
    if (newStatus) {
      const updatedData = attendanceData.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      );
      setAttendanceData(updatedData);
      alert("Status kehadiran berhasil diubah!");
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <button style={styles.btnBack} onClick={() => navigate('/admin/students')}>
            ← Kembali
          </button>
          <div style={{marginLeft: '20px'}}>
            <h2 style={{margin:0}}>Rekap Absensi Siswa</h2>
            <p style={{margin:'5px 0 0 0', color: '#7f8c8d'}}>
              Nama: <b>{studentInfo.nama}</b> | Kelas: {studentInfo.kelas}
            </p>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.summary}>
            <div style={styles.statBox}>
              <h3>{attendanceData.filter(x => x.status === 'Hadir').length}</h3>
              <p>Hadir</p>
            </div>
            <div style={styles.statBox}>
              <h3>{attendanceData.filter(x => x.status === 'Sakit').length}</h3>
              <p>Sakit</p>
            </div>
            <div style={styles.statBox}>
              <h3>{attendanceData.filter(x => x.status === 'Izin').length}</h3>
              <p>Izin</p>
            </div>
            <div style={styles.statBoxWarning}>
              <h3>{attendanceData.filter(x => x.status === 'Alpha').length}</h3>
              <p>Alpha</p>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={{background: '#f8f9fa'}}>
                <th style={styles.th}>Tanggal</th>
                <th style={styles.th}>Mata Pelajaran</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Keterangan</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{item.tanggal}</td>
                  <td style={styles.td}>{item.mapel}</td>
                  <td style={styles.td}>
                    <span style={
                      item.status === 'Hadir' ? styles.badgeGreen : 
                      item.status === 'Alpha' ? styles.badgeRed : styles.badgeYellow
                    }>
                      {item.status}
                    </span>
                  </td>
                  <td style={styles.td}>{item.ket}</td>
                  <td style={styles.td}>
                    <button style={styles.btnEdit} onClick={() => handleEdit(item.id)}>✏️ Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
  btnBack: { background: 'white', border: '1px solid #ddd', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  
  summary: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' },
  statBox: { flex: 1, textAlign: 'center', background: '#e8f6f3', padding: '15px', borderRadius: '8px', color: '#16a085' },
  statBoxWarning: { flex: 1, textAlign: 'center', background: '#fadbd8', padding: '15px', borderRadius: '8px', color: '#c0392b' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px' },
  
  badgeGreen: { background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  badgeYellow: { background: '#fff3cd', color: '#856404', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  badgeRed: { background: '#f8d7da', color: '#721c24', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  
  btnEdit: { background: '#f1c40f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }
};

export default StudentAttendance;