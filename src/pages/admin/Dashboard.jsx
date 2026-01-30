import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar'; // Import Sidebar

const Dashboard = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatHari = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex' }}>
      {/* 1. PASANG SIDEBAR DISINI */}
      <Sidebar />

      {/* 2. KONTEN UTAMA (Digeser ke kanan) */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div>
            <h2>Selamat Datang, Admin!</h2>
            <p>{formatHari}</p>
          </div>
        </div>

        {/* Info Cards */}
        <div style={styles.grid}>
          <div style={styles.cardInfo}>
            <h3>120</h3>
            <p>Total Siswa Aktif</p>
          </div>
          <div style={styles.cardInfo}>
            <h3>Rp 5.2M</h3>
            <p>Pemasukan Bulan Ini</p>
          </div>
          <div style={styles.cardWarning}>
            <h3>5 Siswa</h3>
            <p>Menunggak SPP</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', backgroundColor: '#f4f6f8', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  cardInfo: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center' },
  cardWarning: { background: '#fff0f0', padding: '20px', borderRadius: '10px', border: '1px solid #ffcccc', textAlign: 'center', color: '#c0392b' }
};

export default Dashboard;