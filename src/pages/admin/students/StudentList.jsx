import React from 'react';
import { Link } from 'react-router-dom';

const StudentList = () => {
  // Data Dummy Sementara (Nanti diganti Firebase)
  const dataSiswa = [
    { id: 1, nama: "Adit Sopo", kelas: "4 SD", sekolah: "SDN 1 Glagahagung", status: "Aktif" },
    { id: 2, nama: "Jarwo Kuat", kelas: "9 SMP", sekolah: "SMPN 1 Purwoharjo", status: "Non-Aktif" },
  ];

  return (
    <div style={styles.container}>
      {/* Header Halaman */}
      <div style={styles.header}>
        <h2 style={styles.title}>📂 Manajemen Siswa</h2>
        <button style={styles.addButton}>+ Tambah Siswa Baru</button>
      </div>

      {/* Navigasi Kembali */}
      <Link to="/admin" style={styles.backLink}>← Kembali ke Dashboard</Link>

      {/* Tabel Data */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Nama Lengkap</th>
              <th style={styles.th}>Kelas</th>
              <th style={styles.th}>Asal Sekolah</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dataSiswa.map((siswa) => (
              <tr key={siswa.id} style={styles.tr}>
                <td style={styles.td}><strong>{siswa.nama}</strong></td>
                <td style={styles.td}>{siswa.kelas}</td>
                <td style={styles.td}>{siswa.sekolah}</td>
                <td style={styles.td}>
                  <span style={siswa.status === 'Aktif' ? styles.badgeActive : styles.badgeInactive}>
                    {siswa.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.btnEdit}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styling CSS
const styles = {
  container: { padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, color: '#2c3e50' },
  addButton: { backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  backLink: { display: 'inline-block', marginBottom: '20px', textDecoration: 'none', color: '#3498db', fontWeight: 'bold' },
  tableContainer: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#ecf0f1' },
  th: { padding: '15px', textAlign: 'left', color: '#7f8c8d', fontSize: '14px', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '15px', color: '#2c3e50' },
  badgeActive: { backgroundColor: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  badgeInactive: { backgroundColor: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  btnEdit: { backgroundColor: '#f1c40f', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', color: '#fff' }
};

export default StudentList;