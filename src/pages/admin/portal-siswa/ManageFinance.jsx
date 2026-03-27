import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Wallet, Calendar, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageFinance = () => {
  const navigate = useNavigate();
  // Idealnya ID siswa diambil dari data login (AuthContext), 
  // Untuk sementara kita asumsikan sistem tahu ID siswa yang sedang login.
  const studentId = localStorage.getItem("studentId"); 

  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentFinance = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      // 1. Ambil Profil Siswa
      const sSnap = await getDoc(doc(db, "students", studentId));
      if (sSnap.exists()) setStudent(sSnap.data());

      // 2. Ambil Data Tagihan Cicilan
      const q = query(collection(db, "finance_tagihan"), where("studentId", "==", studentId));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        setTagihan(qSnap.docs[0].data());
      }
    } catch (e) {
      console.error("Error fetching finance:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentFinance();
  }, [studentId]);

  if (loading) return <div style={styles.loader}>Memuat Informasi Keuangan...</div>;

  return (
    <div style={styles.container}>
      {/* Header Info */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.btnBack}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h2 style={styles.title}>Informasi Administrasi</h2>
        <p style={styles.subtitle}>Pantau status pembayaran dan cicilan kamu di sini.</p>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={{ ...styles.card, borderLeft: '5px solid #e74c3c' }}>
          <div style={styles.cardFlex}>
            <div>
              <small style={styles.label}>Sisa Tunggakan</small>
              <h3 style={styles.amountRed}>Rp {tagihan?.sisaTagihan?.toLocaleString() || 0}</h3>
            </div>
            <AlertCircle color="#e74c3c" size={32} />
          </div>
        </div>

        <div style={{ ...styles.card, borderLeft: '5px solid #2ecc71' }}>
          <div style={styles.cardFlex}>
            <div>
              <small style={styles.label}>Total Terbayar</small>
              <h3 style={styles.amountGreen}>Rp {student?.totalBayar?.toLocaleString() || 0}</h3>
            </div>
            <CheckCircle color="#2ecc71" size={32} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <Wallet size={20} color="#3498db" />
          <h4 style={{ margin: 0 }}>Riwayat & Rencana Cicilan</h4>
        </div>

        {!tagihan ? (
          <div style={styles.empty}>Belum ada data tagihan aktif.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Bulan</th>
                  <th style={styles.th}>Jatuh Tempo</th>
                  <th style={styles.th}>Nominal</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tagihan.detailCicilan?.map((item, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>Cicilan ke-{item.bulanKe}</td>
                    <td style={styles.td}>
                      <div style={styles.flexIcon}><Calendar size={14} /> {item.jatuhTempo}</div>
                    </td>
                    <td style={styles.tdBold}>Rp {item.nominal.toLocaleString()}</td>
                    <td style={styles.td}>
                      {item.status === 'Lunas' ? (
                        <span style={styles.badgeLunas}>✅ Lunas ({item.tanggalBayar})</span>
                      ) : (
                        <span style={styles.badgeBelum}>⏳ Menunggu Pembayaran</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div style={styles.footerNote}>
        <p><b>Catatan:</b> Jika terdapat perbedaan data, silakan hubungi Admin Bimbel Gemilang dengan membawa bukti bayar fisik/transfer.</p>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#2c3e50' },
  loader: { padding: '100px', textAlign: 'center', fontSize: '16px', color: '#7f8c8d' },
  header: { marginBottom: '30px' },
  btnBack: { background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: 0, marginBottom: '10px', fontWeight: 'bold' },
  title: { fontSize: '24px', fontWeight: '800', margin: '0 0 5px 0' },
  subtitle: { color: '#7f8c8d', margin: 0 },
  
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  cardFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#95a5a6', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' },
  amountRed: { margin: '5px 0 0 0', color: '#e74c3c', fontSize: '22px' },
  amountGreen: { margin: '5px 0 0 0', color: '#27ae60', fontSize: '22px' },

  tableCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableHeader: { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fcfcfc' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', textAlign: 'left', backgroundColor: '#f8f9fa', color: '#7f8c8d', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f1f1' },
  td: { padding: '15px', fontSize: '14px' },
  tdBold: { padding: '15px', fontSize: '14px', fontWeight: 'bold' },
  flexIcon: { display: 'flex', alignItems: 'center', gap: '8px' },
  
  badgeLunas: { background: '#d4edda', color: '#155724', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  badgeBelum: { background: '#fff3cd', color: '#856404', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  
  empty: { padding: '40px', textAlign: 'center', color: '#bdc3c7' },
  footerNote: { marginTop: '20px', padding: '15px', backgroundColor: '#ebf5fb', borderRadius: '8px', color: '#2980b9', fontSize: '13px', lineHeight: '1.6' }
};

export default ManageFinance;