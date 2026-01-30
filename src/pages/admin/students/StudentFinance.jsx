import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';

const StudentFinance = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Data Dummy Siswa
  const student = { id: id, nama: "Adit Sopo", kelas: "4 SD", saldo: 0 };

  // Data Tagihan
  const [bills, setBills] = useState([
    { id: 1, nama: "SPP Januari 2026", nominal: 150000, status: "Belum Lunas" },
    { id: 2, nama: "Modul Matematika", nominal: 50000, status: "Lunas" },
  ]);

  // Fungsi Bayar
  const handlePay = (billId) => {
    if (window.confirm("Konfirmasi pembayaran ini diterima?")) {
      setBills(bills.map(b => b.id === billId ? { ...b, status: "Lunas" } : b));
      alert("Pembayaran Berhasil! Saldo Masuk ke Kas.");
    }
  };

  // Fungsi Tambah Tagihan Manual
  const handleAddBill = () => {
    const namaTagihan = prompt("Nama Tagihan (Misal: Uang Gedung):");
    const nominal = prompt("Nominal (Rp):");
    if (namaTagihan && nominal) {
      const newBill = {
        id: Date.now(),
        nama: namaTagihan,
        nominal: parseInt(nominal),
        status: "Belum Lunas"
      };
      setBills([newBill, ...bills]);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <button style={styles.btnBack} onClick={() => navigate('/admin/students')}>← Kembali</button>
        
        <div style={styles.header}>
          <h2>💰 Keuangan Siswa: {student.nama}</h2>
          <button style={styles.btnAdd} onClick={handleAddBill}>+ Tambah Tagihan</button>
        </div>

        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={{background: '#eee'}}>
                <th style={styles.th}>Nama Tagihan</th>
                <th style={styles.th}>Nominal</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.id} style={styles.tr}>
                  <td style={styles.td}>{bill.nama}</td>
                  <td style={styles.td}>Rp {bill.nominal.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={bill.status === 'Lunas' ? styles.lunas : styles.belum}>
                      {bill.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {bill.status === 'Belum Lunas' ? (
                      <button style={styles.btnPay} onClick={() => handlePay(bill.id)}>Bayar Sekarang</button>
                    ) : (
                      <button style={styles.btnPrint} onClick={() => alert("Mencetak Kuitansi...")}>🖨 Cetak</button>
                    )}
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
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
  btnBack: { marginBottom: '20px', cursor: 'pointer', padding: '5px 10px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btnAdd: { background: '#2c3e50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
  card: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px' },
  lunas: { background: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  belum: { background: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  btnPay: { background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  btnPrint: { background: '#7f8c8d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }
};

export default StudentFinance;