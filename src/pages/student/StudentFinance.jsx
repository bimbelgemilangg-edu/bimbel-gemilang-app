import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import SidebarSiswa from '../../components/SidebarSiswa';

const StudentFinance = () => {
  const [tagihanData, setTagihanData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ambil ID Siswa dari localStorage (yang diset saat LoginSiswa)
  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');

  useEffect(() => {
    const fetchFinance = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        // Ambil Tagihan dari koleksi finance_tagihan (Sesuai Struktur Admin kamu)
        const q = query(collection(db, "finance_tagihan"), where("studentId", "==", studentId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Ambil dokumen pertama (kontrak aktif)
          setTagihanData({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        }
      } catch (e) {
        console.error("Gagal mengambil data keuangan:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchFinance();
  }, [studentId]);

  return (
    <div style={{ display: 'flex', background: '#f8f9fa', minHeight: '100vh' }}>
      <SidebarSiswa activeMenu="keuangan" />
      
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>💰 Portal Keuangan</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Halo {studentName}, pantau status cicilan kursusmu di sini.</p>
        </div>

        {loading ? (
          <div style={styles.statusBox}>Memuat informasi tagihan...</div>
        ) : !tagihanData ? (
          <div style={styles.emptyBox}>
            <h3>Belum Ada Data Tagihan</h3>
            <p>Sepertinya akunmu belum terdaftar dalam sistem cicilan. Silakan hubungi admin bimbel.</p>
          </div>
        ) : (
          <div style={styles.container}>
            {/* CARD RINGKASAN */}
            <div style={styles.summaryGrid}>
              <div style={{ ...styles.summaryCard, borderLeft: '5px solid #e74c3c' }}>
                <small style={{ color: '#7f8c8d' }}>SISA TAGIHAN</small>
                <h2 style={{ margin: '5px 0', color: '#c0392b' }}>
                  Rp {tagihanData.sisaTagihan?.toLocaleString() || 0}
                </h2>
              </div>
              <div style={{ ...styles.summaryCard, borderLeft: '5px solid #2ecc71' }}>
                <small style={{ color: '#7f8c8d' }}>STATUS AKUN</small>
                <h2 style={{ margin: '5px 0', color: '#27ae60' }}>
                  {tagihanData.sisaTagihan === 0 ? "LUNAS ✨" : "AKTIF"}
                </h2>
              </div>
            </div>

            {/* TABEL RINCIAN (SAMA DENGAN DISPLAY ADMIN) */}
            <div style={styles.cardTable}>
              <h3 style={{ marginBottom: 20 }}>Rincian Cicilan & History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ background: '#f4f6f8' }}>
                      <th style={styles.th}>Bulan</th>
                      <th style={styles.th}>Jatuh Tempo</th>
                      <th style={styles.th}>Nominal</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagihanData.detailCicilan?.map((item, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.td}>Cicilan ke-{item.bulanKe}</td>
                        <td style={styles.td}>{item.jatuhTempo}</td>
                        <td style={styles.td}>Rp {item.nominal?.toLocaleString()}</td>
                        <td style={styles.td}>
                          <span style={item.status === 'Lunas' ? styles.badgeLunas : styles.badgeBelum}>
                            {item.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {item.status === 'Lunas' ? (
                            <small style={{ color: '#27ae60' }}>Dibayar pada {item.tanggalBayar}</small>
                          ) : (
                            <small style={{ color: '#e67e22' }}>Menunggu Pembayaran</small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.noteBox}>
              <small><b>Catatan:</b> Pembayaran dilakukan secara tunai/transfer ke Admin Bimbel Gemilang. Status akan diperbarui otomatis setelah Admin memvalidasi pembayaran Anda.</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', fontFamily: 'sans-serif' },
  header: { marginBottom: '30px' },
  statusBox: { padding: '20px', color: '#666' },
  emptyBox: { background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  summaryCard: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  cardTable: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 10px', textAlign: 'left', borderBottom: '2px solid #eee', color: '#7f8c8d', fontSize: '13px' },
  td: { padding: '15px 10px', borderBottom: '1px solid #f9f9f9', fontSize: '14px' },
  tr: { transition: '0.2s' },
  badgeLunas: { background: '#d4edda', color: '#155724', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgeBelum: { background: '#fff3cd', color: '#856404', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  noteBox: { marginTop: '10px', padding: '15px', background: '#ebf5fb', borderRadius: '8px', color: '#2980b9', fontSize: '12px' }
};

export default StudentFinance;