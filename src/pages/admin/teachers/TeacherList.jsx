import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';

const TeacherList = () => {
  // STATE
  const [dailyCode, setDailyCode] = useState("");
  const [teachers, setTeachers] = useState([
    { id: 1, nama: "Pak Budi", mapel: "Matematika" },
    { id: 2, nama: "Bu Siti", mapel: "Bahasa Inggris" },
    { id: 3, nama: "Pak Joko", mapel: "Fisika" },
  ]);

  // Load Kode Lama (jika ada)
  useEffect(() => {
    const savedCode = localStorage.getItem("DAILY_TEACHER_CODE");
    if (savedCode) setDailyCode(savedCode);
  }, []);

  // Simpan Kode Harian
  const handleSaveCode = () => {
    if (!dailyCode) return alert("Kode tidak boleh kosong!");
    localStorage.setItem("DAILY_TEACHER_CODE", dailyCode);
    alert(`✅ Kode Harian Diset: ${dailyCode}\nBerikan kode ini kepada guru untuk memulai kelas.`);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        <div style={styles.header}>
          <h2>👨‍🏫 Manajemen Guru & Kode Akses</h2>
        </div>

        {/* --- FITUR SET KODE HARIAN --- */}
        <div style={styles.codeCard}>
          <div style={{flex: 1}}>
            <h3 style={{marginTop:0, color:'#d35400'}}>🔑 Set Kode Akses Harian</h3>
            <p style={{fontSize:'14px', color:'#555'}}>
              Kode ini wajib dimasukkan guru untuk membuka kelas dan melakukan absensi hari ini.
              Ganti kode ini setiap hari untuk keamanan.
            </p>
          </div>
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
            <input 
              type="text" 
              value={dailyCode}
              onChange={(e) => setDailyCode(e.target.value)}
              placeholder="Contoh: GEMILANG-01"
              style={styles.inputCode}
            />
            <button onClick={handleSaveCode} style={styles.btnSaveCode}>Update Kode</button>
          </div>
        </div>

        {/* DAFTAR GURU */}
        <div style={styles.card}>
          <h3>Daftar Guru Terdaftar</h3>
          <table style={styles.table}>
            <thead>
              <tr style={{background:'#eee'}}>
                <th style={styles.th}>Nama Guru</th>
                <th style={styles.th}>Mapel</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}><b>{t.nama}</b></td>
                  <td style={styles.td}>{t.mapel}</td>
                  <td style={styles.td}><span style={styles.badge}>Aktif</span></td>
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
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  header: { marginBottom: '20px' },
  
  codeCard: { background: '#fbeee6', padding: '20px', borderRadius: '10px', border: '1px solid #e67e22', marginBottom: '20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  inputCode: { padding: '12px', fontSize: '18px', fontWeight: 'bold', border: '2px solid #d35400', borderRadius: '5px', width: '200px', textAlign: 'center', letterSpacing:'1px' },
  btnSaveCode: { padding: '12px 20px', background: '#d35400', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize:'14px' },

  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px' },
  badge: { background: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight:'bold' }
};

export default TeacherList;