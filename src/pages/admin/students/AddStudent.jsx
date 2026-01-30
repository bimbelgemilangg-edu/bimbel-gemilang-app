import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar'; // Pakai Sidebar

const StudentList = () => {
  const navigate = useNavigate();
  
  // STATE untuk Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenjang, setFilterJenjang] = useState("Semua");

  // DATA DUMMY (Nanti dari Firebase)
  const dataSiswa = [
    { id: 1, nama: "Adit Sopo", kelas: "4 SD", jenjang: "SD", status: "Aktif" },
    { id: 2, nama: "Jarwo Kuat", kelas: "9 SMP", jenjang: "SMP", status: "Non-Aktif" },
    { id: 3, nama: "Denis Kancil", kelas: "6 SD", jenjang: "SD", status: "Aktif" },
    { id: 4, nama: "Siti Nurhaliza", kelas: "8 SMP", jenjang: "SMP", status: "Aktif" },
  ];

  // LOGIKA FILTERING (PENTING)
  const filteredData = dataSiswa.filter((siswa) => {
    const matchSearch = siswa.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenjang = filterJenjang === "Semua" || siswa.jenjang === filterJenjang;
    return matchSearch && matchJenjang;
  });

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2 style={{margin: 0}}>📂 Manajemen Data Siswa</h2>
          <button style={styles.btnAdd} onClick={() => navigate('/admin/students/add')}>
            + Siswa Baru
          </button>
        </div>

        {/* --- PANEL FILTER & PENCARIAN --- */}
        <div style={styles.filterBar}>
          <input 
            type="text" 
            placeholder="🔍 Cari nama siswa..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select 
            style={styles.filterSelect} 
            value={filterJenjang}
            onChange={(e) => setFilterJenjang(e.target.value)}
          >
            <option value="Semua">Semua Jenjang</option>
            <option value="SD">SD (Sekolah Dasar)</option>
            <option value="SMP">SMP (Menengah)</option>
          </select>
        </div>

        {/* --- TABEL DATA --- */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={{background: '#ecf0f1'}}>
                <th style={styles.th}>Nama Siswa</th>
                <th style={styles.th}>Kelas</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Aksi / Menu</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((siswa) => (
                <tr key={siswa.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{siswa.nama}</strong><br/>
                    <span style={{fontSize:'12px', color:'#7f8c8d'}}>ID: {siswa.id}00{siswa.id}</span>
                  </td>
                  <td style={styles.td}>{siswa.kelas}</td>
                  <td style={styles.td}>
                    <span style={siswa.status === 'Aktif' ? styles.badgeActive : styles.badgeInactive}>
                      {siswa.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionGroup}>
                      <button style={styles.btnAction} title="Edit Data">✏️ Edit</button>
                      <button style={styles.btnAction} title="Keuangan">💰 Bayar</button>
                      <button style={styles.btnAction} title="Absensi">📅 Absen</button>
                      
                      {/* Tombol Toggle Status */}
                      {siswa.status === 'Aktif' ? (
                         <button style={styles.btnDanger} title="Non-Aktifkan">⛔ Stop</button>
                      ) : (
                         <button style={styles.btnSuccess} title="Aktifkan">✅ Aktif</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && <p style={{textAlign:'center', padding:'20px'}}>Data tidak ditemukan.</p>}
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f6f8', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnAdd: { background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  
  filterBar: { display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  searchInput: { flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd' },
  filterSelect: { padding: '10px', borderRadius: '5px', border: '1px solid #ddd', width: '200px' },

  tableCard: { background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#7f8c8d' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '15px' },
  
  badgeActive: { background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  badgeInactive: { background: '#f8d7da', color: '#721c24', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },

  actionGroup: { display: 'flex', gap: '5px' },
  btnAction: { padding: '5px 10px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  btnDanger: { padding: '5px 10px', border: 'none', background: '#e74c3c', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  btnSuccess: { padding: '5px 10px', border: 'none', background: '#2ecc71', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
};

export default StudentList;