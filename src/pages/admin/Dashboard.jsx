import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  // LOGIKA WAKTU
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000); // Update tiap menit
    return () => clearInterval(timer);
  }, []);

  const formatHari = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatJam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // DATA CONTOH
  const jadwal = [
    { id: 1, ruang: "R.01", kelas: "4 SD", mapel: "Matematika", jam: "14:00 - 15:30" },
    { id: 2, ruang: "R.02", kelas: "9 SMP", mapel: "B. Inggris", jam: "16:00 - 17:30" },
  ];

  const tunggakan = [
    { id: 1, nama: "Budi S.", nominal: "Rp 150.000" },
    { id: 2, nama: "Siti A.", nominal: "Rp 300.000" },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2>Selamat Datang, Admin!</h2>
          <p>{formatHari}</p>
        </div>
        <h1>{formatJam}</h1>
      </div>

      {/* Konten */}
      <div style={styles.grid}>
        {/* Kartu Jadwal */}
        <div style={styles.card}>
          <h3>📅 Jadwal Hari Ini</h3>
          <ul style={styles.list}>
            {jadwal.map(item => (
              <li key={item.id} style={styles.item}>
                <b>{item.jam}</b> - {item.ruang} <br/>
                {item.mapel} ({item.kelas})
              </li>
            ))}
          </ul>
        </div>

        {/* Kartu Tunggakan */}
        <div style={styles.cardWarning}>
          <h3>⚠️ Tunggakan</h3>
          <ul style={styles.list}>
            {tunggakan.map(item => (
              <li key={item.id} style={styles.itemWarning}>
                {item.nama} - <b>{item.nominal}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', fontFamily: 'sans-serif', background: '#f4f4f4', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '8px' },
  cardWarning: { background: '#fff0f0', padding: '20px', borderRadius: '8px', border: '1px solid #ffcccc' },
  list: { listStyle: 'none', padding: 0 },
  item: { borderBottom: '1px solid #eee', padding: '10px 0' },
  itemWarning: { borderBottom: '1px solid #ffcccc', padding: '10px 0', color: '#d32f2f' }
};

export default Dashboard;