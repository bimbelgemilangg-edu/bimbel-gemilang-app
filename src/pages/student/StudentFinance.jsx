import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { Wallet, Lock, AlertTriangle, PhoneCall, CheckCircle2, History, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentFinance = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ambil ID siswa dari localStorage
  const studentId = localStorage.getItem("studentId"); 
  const isSiswaLoggedIn = localStorage.getItem('isSiswaLoggedIn') === 'true';

  useEffect(() => {
    // PROTEKSI INTERNAL: Jika tidak login, arahkan ke login siswa
    if (!isSiswaLoggedIn) {
      navigate('/login-siswa');
      return;
    }

    const loadFinanceData = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        // 1. Ambil data siswa untuk cek isBlocked
        const sSnap = await getDoc(doc(db, "students", studentId));
        if (sSnap.exists()) {
          setStudent(sSnap.data());
        }

        // 2. Ambil detail cicilan
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
  }, [studentId, isSiswaLoggedIn, navigate]);

  if (loading) return <div style={{padding: '100px', textAlign: 'center', fontFamily: 'sans-serif'}}>Mengecek status keuangan...</div>;

  // TAMPILAN JIKA TERBLOKIR
  if (student?.isBlocked) {
    return (
      <div style={styles.lockOverlay}>
        <div style={styles.lockCard}>
          <div style={styles.lockIcon}><Lock size={40} color="#ef4444" /></div>
          <h2 style={{color: '#1e293b', margin: '0 0 10px 0'}}>Akses Diblokir</h2>
          <p style={{color: '#64748b', marginBottom: '20px', fontSize: '14px'}}>
            Halo **{student.nama}**, portal kamu ditangguhkan sementara karena ada kendala administrasi.
          </p>
          <div style={styles.alertBox}>
            <AlertTriangle size={16} />
            <span>Segera selesaikan tunggakan untuk membuka akses materi dan rapor.</span>
          </div>
          <button style={styles.btnWa} onClick={() => window.open('https://wa.me/628123456789')}>
            <PhoneCall size={18} /> Hubungi Admin Gemilang
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
          <h2 style={{margin: 0, color: 'white', fontSize: '20px'}}>Status Administrasi</h2>
          <p style={{margin: 0, color: '#dbeafe', fontSize: '13px'}}>{student?.nama || 'Siswa'}</p>
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
        <div style={styles.cardTitle}><History size={18} /> Riwayat Pembayaran</div>
        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead style={{background: '#f8fafc'}}>
              <tr>
                <th style={styles.th}>Keterangan</th>
                <th style={styles.th}>Nominal</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tagihan?.detailCicilan?.length > 0 ? (
                tagihan.detailCicilan.map((item, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>Cicilan ke-{item.bulanKe}</td>
                    <td style={styles.tdBold}>Rp {item.nominal?.toLocaleString()}</td>
                    <td style={styles.td}>
                      {item.status === 'Lunas' ? (
                        <span style={styles.badgeLunas}><CheckCircle2 size={12}/> Lunas</span>
                      ) : (
                        <span style={styles.badgeBelum}>Belum Bayar</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{padding: '30px', textAlign: 'center', color: '#94a3b8'}}>Data tagihan tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={styles.footerNote}>
         <Info size={14} />
         <span>Informasi lebih lanjut hubungi bagian keuangan di kantor bimbel.</span>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif' },
  lockOverlay: { height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  lockCard: { background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px', border: '1px solid #fee2e2' },
  lockIcon: { background: '#fee2e2', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  alertBox: { background: '#fefce8', padding: '15px', borderRadius: '12px', display: 'flex', gap: '10px', color: '#854d0e', fontSize: '13px', textAlign: 'left', marginBottom: '25px', border: '1px solid #fef08a' },
  btnWa: { background: '#2563eb', color: 'white', border: 'none', width: '100%', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  headerCard: { background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', padding: '30px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  iconCircle: { background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '15px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
  statCard: { background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValueRed: { fontSize: '20px', fontWeight: 'bold', color: '#ef4444', marginTop: '5px' },
  statValueGreen: { fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginTop: '5px' },
  mainCard: { background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  cardTitle: { padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 20px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px 20px', fontSize: '14px', color: '#475569' },
  tdBold: { padding: '15px 20px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' },
  badgeLunas: { background: '#d1fae5', color: '#065f46', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' },
  badgeBelum: { background: '#fff7ed', color: '#c2410c', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' },
  footerNote: { marginTop: '15px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }
};

export default StudentFinance;