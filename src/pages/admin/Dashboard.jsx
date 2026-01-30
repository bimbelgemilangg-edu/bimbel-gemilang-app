import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

const Dashboard = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={{margin:0, color:'#2c3e50'}}>Dashboard Admin</h2>
            <p style={{margin:'5px 0 0 0', color:'#7f8c8d'}}>Sistem Informasi Akademik Bimbel Gemilang</p>
          </div>
          <div style={styles.clock}>
            {time.toLocaleTimeString('id-ID')} WIB
          </div>
        </div>

        {/* Info Cards (Ringkasan) */}
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>👨‍🎓 Total Siswa</h3>
            <p style={styles.bigNumber}>120</p>
            <small>Siswa Aktif</small>
          </div>
          <div style={styles.card}>
            <h3>👨‍🏫 Guru/Tentor</h3>
            <p style={styles.bigNumber}>15</p>
            <small>Terdaftar</small>
          </div>
          <div style={styles.card}>
            <h3>💰 Kas Masuk</h3>
            <p style={{...styles.bigNumber, color:'#27ae60'}}>Rp 15.2jt</p>
            <small>Bulan Ini</small>
          </div>
          <div style={styles.cardWarning}>
            <h3>⚠️ Tunggakan</h3>
            <p style={{...styles.bigNumber, color:'#c0392b'}}>5</p>
            <small>Perlu Ditagih</small>
          </div>
        </div>

        <div style={styles.banner}>
          <h3>👋 Selamat Datang!</h3>
          <p>Silakan gunakan menu di samping kiri untuk mengelola Jadwal, Siswa, Guru, atau Keuangan.</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', fontFamily:'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)' },
  clock: { fontSize: '24px', fontWeight: 'bold', color: '#3498db' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow:'0 2px 4px rgba(0,0,0,0.05)' },
  cardWarning: { background: '#fff0f0', padding: '20px', borderRadius: '10px', textAlign: 'center', border:'1px solid #ffcccc' },
  bigNumber: { fontSize: '32px', fontWeight: 'bold', margin: '10px 0', color: '#2c3e50' },
  banner: { background: '#e8f6f3', padding: '20px', borderRadius: '10px', border:'1px solid #d1f2eb', color:'#16a085' }
};

export default Dashboard;