import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { Wallet, Lock, History, ShieldCheck, AlertCircle, Clock } from 'lucide-react';

const StudentFinance = () => {
  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiryInfo, setExpiryInfo] = useState({ daysLeft: null, status: 'normal' });
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    const loadFinance = async () => {
      if (!studentId) return;
      try {
        const sSnap = await getDoc(doc(db, "students", studentId));
        if (sSnap.exists()) {
          const data = sSnap.data();
          setStudent(data);

          // Logika Perhitungan Masa Aktif
          if (data.tanggalMulai && data.durasiBulan) {
            const today = new Date();
            const startDate = new Date(data.tanggalMulai);
            const endDate = new Date(startDate.setMonth(startDate.getMonth() + parseInt(data.durasiBulan)));
            
            const diffTime = endDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 0) {
              setExpiryInfo({ daysLeft: 0, status: 'expired' });
            } else if (diffDays <= 7) {
              setExpiryInfo({ daysLeft: diffDays, status: 'warning' });
            }
          }
        }

        const q = query(collection(db, "finance_tagihan"), where("studentId", "==", studentId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) setTagihan(qSnap.docs[0].data());
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadFinance();
  }, [studentId]);

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Menyinkronkan Data Keuangan...</div>;

  // Render Tampilan Blokir
  if (student?.isBlocked) {
    return (
      <div style={styles.lockContainer}>
        <div style={styles.lockCard}>
          <Lock size={50} color="#ef4444" style={{marginBottom: '20px'}}/>
          <h2 style={{margin: '0 0 10px 0', color: '#1e293b'}}>Akses Akun Terbatas</h2>
          <p style={{color: '#64748b', fontSize: '14px', lineHeight: '1.6'}}>
            Mohon maaf, akses ke rapor dan materi belajar ditangguhkan sementara karena kendala administrasi. 
            Silakan selesaikan kewajiban pembayaran Anda.
          </p>
          <button style={styles.btnWa} onClick={() => window.open('https://wa.me/628123456789')}>Hubungi Admin Sekarang</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* NOTIFIKASI PERINGATAN MASA AKTIF */}
      {expiryInfo.status !== 'normal' && (
        <div style={{
          ...styles.alertBox,
          background: expiryInfo.status === 'expired' ? '#fee2e2' : '#fff7ed',
          border: `1px solid ${expiryInfo.status === 'expired' ? '#ef4444' : '#f97316'}`,
        }}>
          <AlertCircle color={expiryInfo.status === 'expired' ? '#ef4444' : '#f97316'} size={24} />
          <div style={{flex: 1}}>
            <b style={{color: expiryInfo.status === 'expired' ? '#b91c1c' : '#9a3412', display: 'block'}}>
              {expiryInfo.status === 'expired' ? 'Masa Paket Belajar Habis!' : 'Perhatian: Masa Paket Segera Berakhir'}
            </b>
            <span style={{fontSize: '13px', color: expiryInfo.status === 'expired' ? '#ef4444' : '#c2410c'}}>
              {expiryInfo.status === 'expired' 
                ? 'Paket Anda telah berakhir. Silakan hubungi admin untuk perpanjangan agar tetap bisa mengakses materi.' 
                : `Paket belajar Anda akan berakhir dalam ${expiryInfo.daysLeft} hari lagi. Segera lakukan perpanjangan.`}
            </span>
          </div>
        </div>
      )}

      <div style={styles.financeHeader}>
        <div style={styles.headerInfo}>
          <div style={styles.iconBg}><Wallet color="white" size={24}/></div>
          <div>
            <h2 style={{margin: 0, color: 'white'}}>Informasi Pembayaran</h2>
            <p style={{margin: '4px 0 0 0', color: '#dbeafe', fontSize: '13px'}}>Kelola tagihan dan riwayat pembayaranmu.</p>
          </div>
        </div>
        <div style={styles.statusBadge}>
          <ShieldCheck size={16}/> 
          {student?.status === 'Aktif' ? 'Akun Aktif' : student?.status}
        </div>
      </div>

      <div style={styles.gridStats}>
        <div style={styles.cardStat}>
          <span style={styles.labelStat}>Sisa Tagihan</span>
          <div style={{...styles.valueStat, color: '#ef4444'}}>Rp {tagihan?.sisaTagihan?.toLocaleString() || 0}</div>
        </div>
        <div style={styles.cardStat}>
          <span style={styles.labelStat}>Total Terbayar</span>
          <div style={{...styles.valueStat, color: '#10b981'}}>Rp {student?.totalBayar?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* INFO MASA PAKET */}
      <div style={{...styles.cardStat, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px'}}>
        <div style={{background: '#f1f5f9', padding: '10px', borderRadius: '12px'}}><Clock size={20} color="#64748b"/></div>
        <div>
          <span style={styles.labelStat}>Masa Aktif Paket</span>
          <div style={{fontSize: '16px', fontWeight: 'bold', color: '#1e293b'}}>
            {student?.tanggalMulai ? `Mulai: ${student.tanggalMulai} (${student.durasiBulan} Bulan)` : 'Belum Diatur'}
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}><History size={18}/> Riwayat Cicilan / Tagihan</div>
        <table style={styles.table}>
          <thead style={{background: '#f8fafc'}}>
            <tr>
              <th style={styles.th}>Deskripsi</th>
              <th style={styles.th}>Nominal</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {tagihan?.detailCicilan?.map((item, idx) => (
              <tr key={idx} style={{borderBottom: '1px solid #f1f5f9'}}>
                <td style={styles.td}>Cicilan Bulan Ke-{item.bulanKe}</td>
                <td style={styles.td}><b>Rp {item.nominal?.toLocaleString()}</b></td>
                <td style={styles.td}>
                   <span style={item.status === 'Lunas' ? styles.badgeLunas : styles.badgeWait}>
                     {item.status}
                   </span>
                </td>
              </tr>
            ))}
            {!tagihan?.detailCicilan && (
              <tr>
                <td colSpan="3" style={{...styles.td, textAlign: 'center', color: '#94a3b8', padding: '40px'}}>
                  Belum ada riwayat tagihan cicilan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  financeHeader: { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '30px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
  iconBg: { background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '15px' },
  statusBadge: { background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' },
  gridStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' },
  cardStat: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  labelStat: { fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  valueStat: { fontSize: '24px', fontWeight: '800', marginTop: '8px' },
  tableCard: { background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 20px', textAlign: 'left', fontSize: '13px', color: '#64748b' },
  td: { padding: '18px 20px', fontSize: '14px' },
  badgeLunas: { background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' },
  badgeWait: { background: '#fff7ed', color: '#c2410c', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' },
  lockContainer: { padding: '60px 20px', textAlign: 'center' },
  lockCard: { maxWidth: '450px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '30px', border: '1px solid #fee2e2', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  btnWa: { background: '#2563eb', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer', transition: 'background 0.3s' },
  alertBox: { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderRadius: '18px', marginBottom: '25px' }
};

export default StudentFinance;