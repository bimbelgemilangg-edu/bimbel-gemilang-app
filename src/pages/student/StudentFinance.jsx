import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { Wallet, Lock, AlertTriangle, PhoneCall, CheckCircle2, History, Info } from 'lucide-react';

const StudentFinance = () => {
  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ambil ID siswa dari localStorage. 
  // Pastikan saat login siswa, kamu menyimpan ID dokumennya di key 'studentId'
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    const loadFinanceData = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        const sSnap = await getDoc(doc(db, "students", studentId));
        if (sSnap.exists()) {
          setStudent(sSnap.data());
        }

        const q = query(collection(db, "finance_tagihan"), where("studentId", "==", studentId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          setTagihan(qSnap.docs[0].data());
        }
      } catch (err) {
        console.error("Error loading finance:", err);
      } finally {
        setLoading(false);
      }
    };
    loadFinanceData();
  }, [studentId]);

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Memuat data keuangan...</div>;

  if (!studentId) return <div style={{padding: '50px', textAlign: 'center'}}>Sesi tidak valid. Silakan login kembali.</div>;

  if (student?.isBlocked) {
    return (
      <div style={styles.lockOverlay}>
        <div style={styles.lockCard}>
          <div style={styles.lockIcon}><Lock size={40} color="#ef4444" /></div>
          <h2 style={{color: '#1e293b'}}>Akses Dibatasi</h2>
          <p style={{color: '#64748b', marginBottom: '20px'}}>
            Halo **{student.nama}**, portal kamu dinonaktifkan sementara karena kendala administrasi.
          </p>
          <div style={styles.alertBox}>
            <AlertTriangle size={16} />
            <span>Harap hubungi admin untuk aktivasi kembali.</span>
          </div>
          <button style={styles.btnWa} onClick={() => window.open('https://wa.me/628123456789')}>
            <PhoneCall size={18} /> Hubungi Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerCard}>
        <div style={styles.iconCircle}><Wallet size={24} color="white" /></div>
        <div>
          <h2 style={{margin: 0, color: 'white', fontSize: '18px'}}>Informasi Administrasi</h2>
          <p style={{margin: 0, color: '#dbeafe', fontSize: '12px'}}>{student?.nama}</p>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Sisa Tagihan</span>
          <div style={styles.statValueRed}>Rp {tagihan?.sisaTagihan?.toLocaleString() || 0}</div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Terbayar</span>
          <div style={styles.statValueGreen}>Rp {student?.totalBayar?.toLocaleString() || 0}</div>
        </div>
      </div>

      <div style={styles.mainCard}>
        <div style={styles.cardTitle}><History size={18} /> Rincian Cicilan</div>
        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead style={{background: '#f8fafc'}}>
              <tr>
                <th style={styles.th}>Bulan</th>
                <th style={styles.th}>Nominal</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tagihan?.detailCicilan?.map((item, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.td}>Cicilan {item.bulanKe}</td>
                  <td style={styles.tdBold}>Rp {item.nominal?.toLocaleString()}</td>
                  <td style={styles.td}>
                    {item.status === 'Lunas' ? (
                      <span style={styles.badgeLunas}><CheckCircle2 size={10}/> Lunas</span>
                    ) : (
                      <span style={styles.badgeBelum}>Menunggu</span>
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

// ... (Gunakan styles yang sama dengan sebelumnya)
const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' },
  lockOverlay: { height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lockCard: { background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' },
  lockIcon: { background: '#fee2e2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
  alertBox: { background: '#fefce8', padding: '12px', borderRadius: '10px', display: 'flex', gap: '8px', color: '#854d0e', fontSize: '12px', textAlign: 'left', marginBottom: '20px' },
  btnWa: { background: '#2563eb', color: 'white', border: 'none', width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 'bold' },
  headerCard: { background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  iconCircle: { background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  statCard: { background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '10px', color: '#64748b', fontWeight: 'bold' },
  statValueRed: { fontSize: '16px', fontWeight: 'bold', color: '#ef4444' },
  statValueGreen: { fontSize: '16px', fontWeight: 'bold', color: '#10b981' },
  mainCard: { background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardTitle: { padding: '15px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 15px', textAlign: 'left', fontSize: '10px', color: '#64748b' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 15px', fontSize: '13px' },
  tdBold: { padding: '10px 15px', fontSize: '13px', fontWeight: 'bold' },
  badgeLunas: { background: '#d1fae5', color: '#065f46', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  badgeBelum: { background: '#fef3c7', color: '#92400e', padding: '3px 6px', borderRadius: '4px', fontSize: '10px' }
};

export default StudentFinance;