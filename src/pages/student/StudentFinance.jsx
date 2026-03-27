import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // PERBAIKAN PATH: Naik 2 tingkat ke folder src
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { Wallet, Lock, AlertTriangle, PhoneCall, CheckCircle2, History, Info } from 'lucide-react';

const StudentFinance = () => {
  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ambil ID dari login (Pastikan saat login ID ini disimpan di localStorage)
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    const loadFinanceData = async () => {
      if (!studentId) return;
      try {
        // 1. Ambil Profil & Status Blokir
        const sSnap = await getDoc(doc(db, "students", studentId));
        if (sSnap.exists()) setStudent(sSnap.data());

        // 2. Ambil Detail Cicilan
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
    loadData();
  }, [studentId]);

  if (loading) return <div style={{padding: 50, textAlign: 'center'}}>Menganalisa Data Keuangan...</div>;

  // SISTEM PROTEKSI: Jika Admin mengaktifkan isBlocked
  if (student?.isBlocked) {
    return (
      <div style={styles.lockOverlay}>
        <div style={styles.lockCard}>
          <div style={styles.lockIcon}><Lock size={40} color="#ef4444" /></div>
          <h2 style={{color: '#1e293b'}}>Akses Terbatas</h2>
          <p style={{color: '#64748b', marginBottom: '20px'}}>
            Halo **{student.nama}**, portal kamu dinonaktifkan sementara karena kendala administrasi.
          </p>
          <div style={styles.alertBox}>
            <AlertTriangle size={16} />
            <span>Harap selesaikan pembayaran untuk membuka akses Materi, Quiz, dan Raport.</span>
          </div>
          <button style={styles.btnWa} onClick={() => window.open('https://wa.me/628123456789')}>
            <PhoneCall size={18} /> Hubungi Admin Keuangan
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
          <h2 style={{margin: 0, color: 'white'}}>Keuangan & Administrasi</h2>
          <p style={{margin: 0, color: '#dbeafe', fontSize: '14px'}}>{student?.nama || 'Siswa'}</p>
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
        <div style={styles.cardTitle}><History size={18} /> Detail Cicilan Pembayaran</div>
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
                  <td style={styles.td}>Cicilan ke-{item.bulanKe}</td>
                  <td style={styles.tdBold}>Rp {item.nominal?.toLocaleString()}</td>
                  <td style={styles.td}>
                    {item.status === 'Lunas' ? (
                      <span style={styles.badgeLunas}><CheckCircle2 size={12}/> Lunas</span>
                    ) : (
                      <span style={styles.badgeBelum}>⏳ Menunggu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.footerNote}>
        <Info size={16} />
        <span>Data diperbarui secara otomatis setelah Admin memvalidasi pembayaran Anda.</span>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  lockOverlay: { height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lockCard: { background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #fee2e2' },
  lockIcon: { background: '#fee2e2', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  alertBox: { background: '#fefce8', padding: '15px', borderRadius: '12px', display: 'flex', gap: '10px', color: '#854d0e', fontSize: '13px', textAlign: 'left', marginBottom: '20px' },
  btnWa: { background: '#2563eb', color: 'white', border: 'none', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  headerCard: { background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '25px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  iconCircle: { background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
  statCard: { background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  statValueRed: { fontSize: '18px', fontWeight: 'bold', color: '#ef4444' },
  statValueGreen: { fontSize: '18px', fontWeight: 'bold', color: '#10b981' },
  mainCard: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardTitle: { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 20px', fontSize: '14px' },
  tdBold: { padding: '12px 20px', fontSize: '14px', fontWeight: 'bold' },
  badgeLunas: { background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  badgeBelum: { background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' },
  footerNote: { marginTop: '20px', padding: '15px', borderRadius: '10px', background: '#f0f9ff', color: '#0369a1', fontSize: '12px', display: 'flex', gap: '10px', alignItems: 'center' }
};

export default StudentFinance;