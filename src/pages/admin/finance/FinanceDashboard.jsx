import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview | mutasi | tagihan | catat
  
  // --- STATE DATA (DUMMY) ---
  const [saldo, setSaldo] = useState({ tunai: 5000000, bank: 15000000 });
  const [transaksi, setTransaksi] = useState([
    { id: 1, tanggal: "2026-01-29", ket: "Bayar Listrik", tipe: "Keluar", metode: "Tunai", nominal: 500000 },
    { id: 2, tanggal: "2026-01-30", ket: "SPP Budi", tipe: "Masuk", metode: "Bank", nominal: 350000 },
  ]);
  const [tagihanSiswa, setTagihanSiswa] = useState([
    { id: 1, nama: "Budi Santoso", kelas: "5 SD", ortu: "62812345678", piutang: 150000 },
    { id: 2, nama: "Siti Aminah", kelas: "9 SMP", ortu: "62898765432", piutang: 300000 },
  ]);

  // Data Grafik
  const dataGrafik = [
    { name: 'Minggu 1', Masuk: 4000000, Keluar: 2400000 },
    { name: 'Minggu 2', Masuk: 3000000, Keluar: 1398000 },
    { name: 'Minggu 3', Masuk: 2000000, Keluar: 9800000 }, // Defisit contoh
    { name: 'Minggu 4', Masuk: 2780000, Keluar: 3908000 },
  ];

  // --- LOGIKA UTAMA ---

  // 1. Fungsi Pembayaran Tagihan (Otomatis masuk Saldo)
  const handleBayarTagihan = (siswa, metode) => {
    if (window.confirm(`Terima pembayaran Rp ${siswa.piutang.toLocaleString()} dari ${siswa.nama} via ${metode}?`)) {
      // 1. Update Saldo
      setSaldo(prev => ({
        ...prev,
        [metode.toLowerCase()]: prev[metode.toLowerCase()] + siswa.piutang
      }));

      // 2. Catat Mutasi Otomatis
      const mutasiBaru = {
        id: Date.now(),
        tanggal: new Date().toISOString().split('T')[0],
        ket: `Pembayaran SPP: ${siswa.nama}`,
        tipe: "Masuk",
        metode: metode,
        nominal: siswa.piutang
      };
      setTransaksi([mutasiBaru, ...transaksi]);

      // 3. Nol-kan Tagihan Siswa
      const updateSiswa = tagihanSiswa.map(item => 
        item.id === siswa.id ? { ...item, piutang: 0 } : item
      );
      setTagihanSiswa(updateSiswa);
      
      alert("Pembayaran Berhasil! Saldo bertambah & Tagihan lunas.");
    }
  };

  // 2. Fungsi Hapus Transaksi (Proteksi Owner)
  const handleDeleteTransaksi = (id) => {
    const pin = prompt("⚠️ AKSES TERBATAS: Masukkan PIN Owner untuk menghapus data keuangan:");
    if (pin === "1234") { // Nanti diganti sistem login owner asli
      setTransaksi(transaksi.filter(item => item.id !== id));
      alert("Data berhasil dihapus.");
    } else {
      alert("PIN Salah! Akses ditolak.");
    }
  };

  // 3. Kirim WA Tagihan
  const handleWhatsApp = (siswa) => {
    const pesan = `Halo Ortu ${siswa.nama}, mohon segera melunasi tunggakan sebesar Rp ${siswa.piutang.toLocaleString()}. Terima kasih.`;
    window.open(`https://wa.me/${siswa.ortu}?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        {/* HEADER & TABS */}
        <div style={styles.header}>
          <h2>💰 Keuangan & Kasir</h2>
          <div style={styles.tabs}>
            <button style={activeTab === 'overview' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('overview')}>📊 Analisis</button>
            <button style={activeTab === 'mutasi' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('mutasi')}>📝 Mutasi Data</button>
            <button style={activeTab === 'tagihan' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('tagihan')}>👨‍🎓 Tagihan Siswa</button>
            <button style={activeTab === 'catat' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('catat')}>➕ Catat Transaksi</button>
          </div>
        </div>

        {/* --- KONTEN: OVERVIEW & ANALISIS --- */}
        {activeTab === 'overview' && (
          <div>
            <div style={styles.cardGrid}>
              <div style={styles.cardInfo}>
                <p>Total Saldo Tunai</p>
                <h3 style={{color: '#27ae60'}}>Rp {saldo.tunai.toLocaleString()}</h3>
              </div>
              <div style={styles.cardInfo}>
                <p>Total Saldo Bank</p>
                <h3 style={{color: '#2980b9'}}>Rp {saldo.bank.toLocaleString()}</h3>
              </div>
              <div style={styles.cardInfo}>
                <p>Total Aset (Tunai + Bank)</p>
                <h3>Rp {(saldo.tunai + saldo.bank).toLocaleString()}</h3>
              </div>
            </div>

            <div style={styles.chartCard}>
              <h3>📈 Grafik Arus Kas Bulan Ini</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataGrafik}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Masuk" fill="#27ae60" name="Pemasukan" />
                  <Bar dataKey="Keluar" fill="#c0392b" name="Pengeluaran" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- KONTEN: MUTASI (Data Keuangan) --- */}
        {activeTab === 'mutasi' && (
          <div style={styles.card}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: '20px'}}>
              <h3>Riwayat Transaksi</h3>
              <button style={styles.btnDownload} onClick={() => alert("Fitur Download Excel akan aktif saat database tersambung.")}>📥 Download Laporan</button>
            </div>
            <table style={styles.table}>
              <thead>
                <tr style={{background: '#eee'}}>
                  <th style={styles.th}>Tanggal</th>
                  <th style={styles.th}>Keterangan</th>
                  <th style={styles.th}>Metode</th>
                  <th style={styles.th}>Masuk/Keluar</th>
                  <th style={styles.th}>Nominal</th>
                  <th style={styles.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>{item.tanggal}</td>
                    <td style={styles.td}>{item.ket}</td>
                    <td style={styles.td}>{item.metode}</td>
                    <td style={styles.td}>
                      <span style={item.tipe === 'Masuk' ? styles.badgeIn : styles.badgeOut}>{item.tipe}</span>
                    </td>
                    <td style={styles.td}>Rp {item.nominal.toLocaleString()}</td>
                    <td style={styles.td}>
                      <button style={styles.btnDelete} onClick={() => handleDeleteTransaksi(item.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- KONTEN: TAGIHAN SISWA --- */}
        {activeTab === 'tagihan' && (
          <div style={styles.card}>
            <h3>Daftar Piutang Siswa</h3>
            <table style={styles.table}>
              <thead>
                <tr style={{background: '#eee'}}>
                  <th style={styles.th}>Nama Siswa</th>
                  <th style={styles.th}>Kelas</th>
                  <th style={styles.th}>Total Tunggakan</th>
                  <th style={styles.th}>Aksi Penagihan</th>
                </tr>
              </thead>
              <tbody>
                {tagihanSiswa.map((siswa) => (
                  <tr key={siswa.id} style={styles.tr}>
                    <td style={styles.td}><b>{siswa.nama}</b></td>
                    <td style={styles.td}>{siswa.kelas}</td>
                    <td style={styles.td}><span style={{color: siswa.piutang > 0 ? 'red' : 'green', fontWeight:'bold'}}>Rp {siswa.piutang.toLocaleString()}</span></td>
                    <td style={styles.td}>
                      {siswa.piutang > 0 ? (
                        <div style={{display:'flex', gap:'5px'}}>
                          <button style={styles.btnWA} onClick={() => handleWhatsApp(siswa)}>📲 WA</button>
                          <button style={styles.btnPay} onClick={() => handleBayarTagihan(siswa, 'Tunai')}>Bayar Tunai</button>
                          <button style={styles.btnPayBank} onClick={() => handleBayarTagihan(siswa, 'Bank')}>Transfer</button>
                        </div>
                      ) : (
                        <span style={styles.badgeIn}>LUNAS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- KONTEN: INPUT MANUAL --- */}
        {activeTab === 'catat' && (
          <div style={{...styles.card, maxWidth: '500px'}}>
            <h3>➕ Catat Pengeluaran/Pemasukan Lain</h3>
            <div style={styles.formGroup}>
              <label>Jenis Transaksi</label>
              <select style={styles.input}><option>Pengeluaran (Expense)</option><option>Pemasukan Lain (Income)</option></select>
            </div>
            <div style={styles.formGroup}>
              <label>Keterangan</label>
              <input style={styles.input} type="text" placeholder="Contoh: Beli Spidol" />
            </div>
            <div style={styles.formGroup}>
              <label>Nominal (Rp)</label>
              <input style={styles.input} type="number" placeholder="0" />
            </div>
            <div style={styles.formGroup}>
              <label>Sumber Dana</label>
              <select style={styles.input}><option>Tunai (Kas)</option><option>Bank (Transfer)</option></select>
            </div>
            <button style={styles.btnSave}>Simpan Transaksi</button>
          </div>
        )}

      </div>
    </div>
  );
};

// STYLING CSS LENGKAP
const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { marginBottom: '20px' },
  tabs: { display: 'flex', gap: '10px', marginTop: '10px' },
  tab: { padding: '10px 20px', border: 'none', background: '#ddd', cursor: 'pointer', borderRadius: '5px' },
  tabActive: { padding: '10px 20px', border: 'none', background: '#2c3e50', color: 'white', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' },
  
  cardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' },
  cardInfo: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center' },
  chartCard: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px' },
  
  badgeIn: { background: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  badgeOut: { background: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  
  btnDownload: { background: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  btnDelete: { background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  
  btnWA: { background: '#25D366', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' },
  btnPay: { background: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' },
  btnPayBank: { background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },

  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', marginTop: '5px' },
  btnSave: { width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default FinanceDashboard;