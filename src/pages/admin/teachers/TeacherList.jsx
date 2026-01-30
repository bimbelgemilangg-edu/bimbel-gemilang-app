import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar';

const TeacherList = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'absensi'
  
  // --- STATE DATA (DUMMY) ---
  const [teachers, setTeachers] = useState([
    { id: 1, nama: "Budi Harsono", mapel: "Matematika", status: "Aktif" },
    { id: 2, nama: "Siti Nurhaliza", mapel: "Bahasa Inggris", status: "Aktif" },
    { id: 3, nama: "Joko Anwar", mapel: "Fisika", status: "Cuti" },
  ]);

  const [attendance, setAttendance] = useState([
    { id: 101, tanggal: "2026-01-30", nama: "Budi Harsono", status: "Hadir", jam: "07:45" },
    { id: 102, tanggal: "2026-01-30", nama: "Siti Nurhaliza", status: "Izin", jam: "-" },
    { id: 103, tanggal: "2026-01-29", nama: "Budi Harsono", status: "Hadir", jam: "07:50" },
  ]);

  // --- STATE FORM TAMBAH GURU ---
  const [newTeacher, setNewTeacher] = useState({ nama: "", mapel: "" });

  // --- FUNGSI LOGIKA ---

  // 1. Tambah Guru Baru
  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!newTeacher.nama || !newTeacher.mapel) return alert("Isi semua data!");
    
    const newItem = {
      id: Date.now(),
      nama: newTeacher.nama,
      mapel: newTeacher.mapel,
      status: "Aktif"
    };
    setTeachers([...teachers, newItem]);
    setNewTeacher({ nama: "", mapel: "" }); // Reset form
    alert("Guru berhasil didaftarkan!");
  };

  // 2. Edit Absensi
  const handleEditAbsensi = (id) => {
    const newStatus = prompt("Ubah Status (Hadir/Izin/Sakit/Alpha):");
    if (newStatus) {
      setAttendance(attendance.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
    }
  };

  // 3. DOWNLOAD LAPORAN ABSENSI (CSV)
  const downloadCSV = () => {
    const headers = ["Tanggal", "Nama Guru", "Status", "Jam Masuk"];
    const csvContent = [
      headers.join(","), // Header Row
      ...attendance.map(item => `${item.tanggal},${item.nama},${item.status},${item.jam}`) // Data Rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Laporan_Absensi_Guru.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        <div style={styles.header}>
          <h2>👨‍🏫 Manajemen Guru & Tentor</h2>
          <div style={styles.tabs}>
            <button style={activeTab === 'list' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('list')}>📋 Daftar Guru</button>
            <button style={activeTab === 'absensi' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('absensi')}>📅 Data Absensi</button>
          </div>
        </div>

        {/* --- TAB 1: DAFTAR GURU --- */}
        {activeTab === 'list' && (
          <div>
            {/* Form Tambah Guru */}
            <div style={styles.cardForm}>
              <h4>+ Daftarkan Guru Baru</h4>
              <form onSubmit={handleAddTeacher} style={styles.formRow}>
                <input 
                  style={styles.input} 
                  placeholder="Nama Lengkap" 
                  value={newTeacher.nama}
                  onChange={e => setNewTeacher({...newTeacher, nama: e.target.value})}
                />
                <select 
                  style={styles.select}
                  value={newTeacher.mapel}
                  onChange={e => setNewTeacher({...newTeacher, mapel: e.target.value})}
                >
                  <option value="">Pilih Mapel...</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="IPA">IPA (Fisika/Kimia/Biologi)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                </select>
                <button type="submit" style={styles.btnSave}>Simpan</button>
              </form>
            </div>

            {/* Tabel Guru */}
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr style={{background: '#eee'}}>
                    <th style={styles.th}>Nama Guru</th>
                    <th style={styles.th}>Mata Pelajaran</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}><b>{t.nama}</b></td>
                      <td style={styles.td}>{t.mapel}</td>
                      <td style={styles.td}>
                        <span style={t.status === 'Aktif' ? styles.badgeActive : styles.badgeInactive}>{t.status}</span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.btnEdit}>Edit Profil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 2: ABSENSI --- */}
        {activeTab === 'absensi' && (
          <div style={styles.card}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h3>Rekap Absensi</h3>
              <button style={styles.btnDownload} onClick={downloadCSV}>📥 Download Excel (CSV)</button>
            </div>
            
            <table style={styles.table}>
              <thead>
                <tr style={{background: '#eee'}}>
                  <th style={styles.th}>Tanggal</th>
                  <th style={styles.th}>Nama Guru</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Jam Masuk</th>
                  <th style={styles.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((absen) => (
                  <tr key={absen.id} style={styles.tr}>
                    <td style={styles.td}>{absen.tanggal}</td>
                    <td style={styles.td}><b>{absen.nama}</b></td>
                    <td style={styles.td}>
                      <span style={
                        absen.status === 'Hadir' ? styles.badgeActive : 
                        absen.status === 'Izin' ? styles.badgeWarning : styles.badgeInactive
                      }>
                        {absen.status}
                      </span>
                    </td>
                    <td style={styles.td}>{absen.jam}</td>
                    <td style={styles.td}>
                      <button style={styles.btnSmall} onClick={() => handleEditAbsensi(absen.id)}>✏️ Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { marginBottom: '20px' },
  tabs: { display: 'flex', gap: '10px', marginTop: '10px' },
  tab: { padding: '10px 20px', border: 'none', background: '#ddd', cursor: 'pointer', borderRadius: '5px' },
  tabActive: { padding: '10px 20px', border: 'none', background: '#2c3e50', color: 'white', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' },
  
  card: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginTop: '20px' },
  cardForm: { background: '#e8f6f3', padding: '20px', borderRadius: '8px', border: '1px solid #d1f2eb' },
  
  formRow: { display: 'flex', gap: '10px', marginTop: '10px' },
  input: { flex: 2, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
  select: { flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
  btnSave: { flex: 1, background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px' },

  badgeActive: { background: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  badgeWarning: { background: '#fff3cd', color: '#856404', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  badgeInactive: { background: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },

  btnDownload: { background: '#2980b9', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnEdit: { background: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
  btnSmall: { background: '#bdc3c7', padding: '5px 10px', borderRadius: '3px', border: 'none', cursor: 'pointer' }
};

export default TeacherList;