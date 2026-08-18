// src/pages/student/StudentFinance.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc, query, collection, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { Wallet, Lock, History, ShieldCheck, AlertCircle, Clock, Receipt, CalendarClock } from 'lucide-react';

const StudentFinance = () => {
  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiryInfo, setExpiryInfo] = useState({ daysLeft: null, status: 'normal' });
  // 🔥 BARU: riwayat pembayaran (finance_logs milik siswa ini) -- beda dari
  // `tagihan.detailCicilan` yang cuma nunjukkin JADWAL cicilan, ini
  // nunjukkin TRANSAKSI yang BENERAN sudah tercatat/dibayar, lengkap
  // tanggal & metode -- lebih transparan buat siswa/ortu lihat histori
  // pembayaran mereka sendiri.
  const [paymentHistory, setPaymentHistory] = useState([]);

  // 🔥 AMBIL NIM & DOC ID DARI LOCALSTORAGE
  const studentNim = localStorage.getItem("studentNim") || localStorage.getItem("studentId") || '';
  const studentDocId = localStorage.getItem("studentId") || '';

  useEffect(() => {
    if (!studentNim && !studentDocId) {
      setLoading(false);
      return;
    }

    // 🔥 FIX BUG NYATA (Bug #4 dari analisis): sebelumnya data diambil
    // SEKALI doang pas halaman dibuka (`getDoc`/`getDocs` biasa) -- kalau
    // admin catat pembayaran ATAU perpanjangan SAAT siswa lagi buka
    // halaman ini, siswa gak akan lihat perubahannya sampai refresh
    // manual. Sekarang dokumen siswanya dipantau pakai `onSnapshot` --
    // begitu ada perubahan di sisi admin, halaman ini otomatis ke-update
    // sendiri tanpa siswa perlu refresh.
    let unsubStudent = null;
    let unsubTagihan = null;
    let unsubLogs = null;
    let cancelled = false;

    const setupListeners = async () => {
      // Cari dulu doc ID siswa yang BENAR (lewat query studentId kalau ada
      // NIM, fallback ke doc ID langsung) -- baru setelah itu pasang
      // listener real-time ke dokumen yang tepat.
      let resolvedDocId = null;
      let resolvedStudentId = studentNim;

      if (studentNim) {
        try {
          const q = query(collection(db, "students"), where("studentId", "==", studentNim));
          const snap = await getDocs(q);
          if (!snap.empty) resolvedDocId = snap.docs[0].id;
        } catch (e) { /* lanjut ke fallback */ }
      }
      if (!resolvedDocId && studentDocId) {
        try {
          const sSnap = await getDoc(doc(db, "students", studentDocId));
          if (sSnap.exists()) resolvedDocId = sSnap.id;
        } catch (e) { /* ignore */ }
      }

      if (!resolvedDocId || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      unsubStudent = onSnapshot(doc(db, "students", resolvedDocId), (sSnap) => {
        if (!sSnap.exists()) { setLoading(false); return; }
        const studentData = { id: sSnap.id, ...sSnap.data() };
        setStudent(studentData);
        resolvedStudentId = studentData.studentId || resolvedStudentId;

        // 🔥 FIX BUG NYATA (Bug #2 dari analisis): sebelumnya masa aktif
        // dihitung SENDIRI di sini dari `tanggalMulai + durasiBulan`
        // (bulan) -- PADAHAL sisi admin (termasuk alur "Perpanjang Paket")
        // pakai field `tanggalSelesai` yang tersimpan LANGSUNG di database
        // sebagai satu-satunya sumber kebenaran. Dua perhitungan
        // independen ini rawan geser beda (mis. admin pernah edit manual,
        // atau pembulatan bulan beda) -- akibatnya siswa bisa gak lihat
        // peringatan yang seharusnya ada, atau lihat versi yang beda dari
        // yang admin lihat. Sekarang PAKAI `tanggalSelesai` LANGSUNG, sama
        // persis sumbernya dengan StudentList.jsx & FinanceDashboard.jsx
        // di sisi admin -- satu sumber kebenaran, gak ada lagi risiko
        // beda hitungan.
        if (studentData.tanggalSelesai) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const selesai = new Date(studentData.tanggalSelesai); selesai.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            setExpiryInfo({ daysLeft: 0, status: 'expired' });
          } else if (diffDays <= 7) {
            setExpiryInfo({ daysLeft: diffDays, status: 'warning' });
          } else {
            setExpiryInfo({ daysLeft: diffDays, status: 'normal' });
          }
        }

        setLoading(false);
      }, (err) => { console.error("Gagal memantau data siswa:", err); setLoading(false); });

      // Tagihan -- juga dipantau real-time
      const qTagihan = query(
        collection(db, "finance_tagihan"),
        where("studentId", "==", studentNim || resolvedStudentId || studentDocId)
      );
      unsubTagihan = onSnapshot(qTagihan, (qSnap) => {
        if (!qSnap.empty) {
          setTagihan({ id: qSnap.docs[0].id, ...qSnap.docs[0].data() });
        } else {
          setTagihan(null);
        }
      }, (err) => console.error("Gagal memantau tagihan:", err));

      // 🔥 BARU: riwayat pembayaran (finance_logs) -- transaksi yang
      // BENERAN tercatat/dibayar (Pemasukan), diurutkan terbaru dulu.
      const qLogs = query(
        collection(db, "finance_logs"),
        where("studentId", "==", studentNim || resolvedStudentId || studentDocId)
      );
      unsubLogs = onSnapshot(qLogs, (logSnap) => {
        const logs = logSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(l => l.type === 'Pemasukan')
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setPaymentHistory(logs);
      }, (err) => console.error("Gagal memantau riwayat pembayaran:", err));
    };

    setupListeners();

    return () => {
      cancelled = true;
      if (unsubStudent) unsubStudent();
      if (unsubTagihan) unsubTagihan();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  // 🔥 FIX BUG NYATA #1 (paling utama dari laporan "peringatan tagihan gak
  // muncul"): sebelumnya halaman ini CUMA punya 1 jenis peringatan (tanggal
  // masa aktif habis) -- TIDAK ADA peringatan sama sekali soal cicilan yang
  // sudah lewat jatuh tempo tapi belum dibayar, padahal tiap cicilan punya
  // field `jatuhTempo` & `status` yang sebenarnya cukup buat ngecek itu.
  // Siswa yang telat bayar cicilan (walau masa paketnya masih jauh dari
  // habis) gak akan lihat peringatan apa pun. Sekarang dihitung di sini:
  // semua cicilan yang jatuhTempo-nya sudah lewat DAN statusnya belum
  // "Lunas" dikumpulkan, buat ditampilkan sebagai alert terpisah dari
  // alert masa aktif.
  const overdueInstallments = (() => {
    if (!Array.isArray(tagihan?.detailCicilan)) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return tagihan.detailCicilan
      .map((item, idx) => {
        if (item.status === 'Lunas' || !item.jatuhTempo) return null;
        const due = new Date(item.jatuhTempo); due.setHours(0, 0, 0, 0);
        const daysLate = Math.floor((today - due) / (1000 * 60 * 60 * 24));
        if (daysLate <= 0) return null; // belum jatuh tempo, bukan telat
        return { ...item, idx, daysLate };
      })
      .filter(Boolean)
      .sort((a, b) => b.daysLate - a.daysLate);
  })();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #652D90', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
        Menyinkronkan Data Keuangan...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={styles.lockContainer}>
        <div style={styles.lockCard}>
          <AlertCircle size={50} color="#f59e0b" style={{ marginBottom: '20px' }} />
          <h2 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Data Tidak Ditemukan</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
            Data keuangan tidak dapat dimuat. Silakan hubungi admin.
          </p>
        </div>
      </div>
    );
  }

  // Render Tampilan Blokir
  if (student?.isBlocked) {
    return (
      <div style={styles.lockContainer}>
        <div style={styles.lockCard}>
          <Lock size={50} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h2 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Akses Akun Terbatas</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
            Mohon maaf, akses ke rapor dan materi belajar ditangguhkan sementara karena kendala administrasi. 
            Silakan selesaikan kewajiban pembayaran Anda.
          </p>
          <button style={styles.btnWa} onClick={() => window.open('https://wa.me/628123456789')}>
            Hubungi Admin Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* NOTIFIKASI PERINGATAN MASA AKTIF -- warna/skema TETAP seperti semula, cuma sumber datanya yang dibenerin (lihat penjelasan di atas) */}
      {expiryInfo.status !== 'normal' && (
        <div style={{
          ...styles.alertBox,
          background: expiryInfo.status === 'expired' ? '#fee2e2' : '#fff7ed',
          border: `1px solid ${expiryInfo.status === 'expired' ? '#ef4444' : '#f97316'}`,
        }}>
          <AlertCircle color={expiryInfo.status === 'expired' ? '#ef4444' : '#f97316'} size={24} />
          <div style={{ flex: 1 }}>
            <b style={{ color: expiryInfo.status === 'expired' ? '#b91c1c' : '#9a3412', display: 'block' }}>
              {expiryInfo.status === 'expired' ? 'Masa Paket Belajar Habis!' : 'Perhatian: Masa Paket Segera Berakhir'}
            </b>
            <span style={{ fontSize: '13px', color: expiryInfo.status === 'expired' ? '#ef4444' : '#c2410c' }}>
              {expiryInfo.status === 'expired' 
                ? 'Paket Anda telah berakhir. Silakan hubungi admin untuk perpanjangan agar tetap bisa mengakses materi.' 
                : `Paket belajar Anda akan berakhir dalam ${expiryInfo.daysLeft} hari lagi. Segera lakukan perpanjangan.`}
            </span>
          </div>
        </div>
      )}

      {/* 🔥 BARU: ALERT CICILAN TELAT -- terpisah dari alert masa aktif di atas,
          nutup Bug #1. Gak ada tombol WA (sengaja, gak ada sumber nomor admin
          yang pasti/terkonfigurasi -- daripada hardcode nomor yang mungkin
          salah/kadaluarsa). */}
      {overdueInstallments.length > 0 && (
        <div style={{ ...styles.alertBox, background: '#fef2f2', border: '1px solid #ef4444' }}>
          <CalendarClock color="#ef4444" size={24} />
          <div style={{ flex: 1 }}>
            <b style={{ color: '#b91c1c', display: 'block', marginBottom: 6 }}>
              {overdueInstallments.length === 1 ? 'Ada Cicilan yang Telat Dibayar' : `Ada ${overdueInstallments.length} Cicilan yang Telat Dibayar`}
            </b>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {overdueInstallments.map(item => (
                <span key={item.idx} style={{ fontSize: '13px', color: '#ef4444' }}>
                  • Cicilan Bulan Ke-{item.bulanKe}: <b>Rp {item.nominal?.toLocaleString()}</b> — terlambat {item.daysLate} hari (jatuh tempo {new Date(item.jatuhTempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={styles.financeHeader}>
        <div style={styles.headerInfo}>
          <div style={styles.iconBg}><Wallet color="white" size={24} /></div>
          <div>
            <h2 style={{ margin: 0, color: 'white' }}>Informasi Pembayaran</h2>
            <p style={{ margin: '4px 0 0 0', color: '#dbeafe', fontSize: '13px' }}>Kelola tagihan dan riwayat pembayaranmu.</p>
          </div>
        </div>
        <div style={styles.statusBadge}>
          <ShieldCheck size={16} /> 
          {student?.status === 'Aktif' ? 'Akun Aktif' : student?.status || 'Aktif'}
        </div>
      </div>

      <div style={styles.gridStats}>
        <div style={styles.cardStat}>
          <span style={styles.labelStat}>Sisa Tagihan</span>
          <div style={{ ...styles.valueStat, color: '#ef4444' }}>Rp {tagihan?.sisaTagihan?.toLocaleString() || 0}</div>
        </div>
        <div style={styles.cardStat}>
          <span style={styles.labelStat}>Total Terbayar</span>
          <div style={{ ...styles.valueStat, color: '#10b981' }}>Rp {student?.totalBayar?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* INFO MASA PAKET */}
      <div style={{ ...styles.cardStat, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px' }}><Clock size={20} color="#64748b" /></div>
        <div>
          <span style={styles.labelStat}>Masa Aktif Paket</span>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
            {student?.tanggalMulai ? `Mulai: ${student.tanggalMulai} — Berakhir: ${student.tanggalSelesai || '-'}` : 'Belum Diatur'}
          </div>
        </div>
      </div>

      <div style={{ ...styles.tableCard, marginBottom: 25 }}>
        <div style={styles.tableHeader}><History size={18} /> Jadwal Cicilan / Tagihan</div>
        <table style={styles.table}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={styles.th}>Deskripsi</th>
              <th style={styles.th}>Nominal</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {tagihan?.detailCicilan?.length > 0 ? (
              tagihan.detailCicilan.map((item, idx) => {
                const isOverdue = overdueInstallments.some(o => o.idx === idx);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={styles.td}>Cicilan Bulan Ke-{item.bulanKe}</td>
                    <td style={styles.td}><b>Rp {item.nominal?.toLocaleString()}</b></td>
                    <td style={styles.td}>
                      <span style={item.status === 'Lunas' ? styles.badgeLunas : (isOverdue ? styles.badgeTerlambat : styles.badgeWait)}>
                        {item.status === 'Lunas' ? 'Lunas' : (isOverdue ? 'Terlambat' : item.status)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                  Belum ada riwayat tagihan cicilan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔥 BARU: RIWAYAT PEMBAYARAN -- transaksi yang beneran sudah tercatat
          dibayar (bukan cuma jadwal). Lebih transparan buat siswa/ortu lihat
          histori pembayaran mereka sendiri sejak awal daftar. */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}><Receipt size={18} /> Riwayat Pembayaran</div>
        <table style={styles.table}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={styles.th}>Tanggal</th>
              <th style={styles.th}>Keterangan</th>
              <th style={styles.th}>Metode</th>
              <th style={styles.th}>Nominal</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.length > 0 ? (
              paymentHistory.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={styles.td}>{item.date ? new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                  <td style={styles.td}>{item.note || item.category || '-'}</td>
                  <td style={styles.td}>{item.method || '-'}</td>
                  <td style={styles.td}><b style={{ color: '#10b981' }}>Rp {(item.amount || 0).toLocaleString()}</b></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                  Belum ada riwayat pembayaran tercatat.
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
  financeHeader: { 
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
    padding: '30px', borderRadius: '24px', display: 'flex', 
    justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: '25px', flexWrap: 'wrap', gap: 15 
  },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
  iconBg: { background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '15px' },
  statusBadge: { 
    background: '#dcfce7', color: '#166534', padding: '8px 16px', 
    borderRadius: '100px', fontSize: '12px', fontWeight: 'bold', 
    display: 'flex', alignItems: 'center', gap: '6px' 
  },
  gridStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' },
  cardStat: { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  labelStat: { fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  valueStat: { fontSize: '24px', fontWeight: '800', marginTop: '8px' },
  tableCard: { background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { 
    padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', 
    display: 'flex', alignItems: 'center', gap: '10px' 
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 20px', textAlign: 'left', fontSize: '13px', color: '#64748b' },
  td: { padding: '18px 20px', fontSize: '14px' },
  badgeLunas: { 
    background: '#dcfce7', color: '#166534', padding: '6px 12px', 
    borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' 
  },
  badgeWait: { 
    background: '#fff7ed', color: '#c2410c', padding: '6px 12px', 
    borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' 
  },
  // 🔥 BARU: badge khusus buat cicilan yang KETAHUAN telat (beda dari
  // "Belum Lunas" biasa yang masih dalam tenggat) -- merah, biar beda
  // urgensinya keliatan sekilas mata dibanding yang masih wajar nunggu.
  badgeTerlambat: {
    background: '#fee2e2', color: '#b91c1c', padding: '6px 12px',
    borderRadius: '8px', fontSize: '12px', fontWeight: 'bold'
  },
  lockContainer: { padding: '60px 20px', textAlign: 'center' },
  lockCard: { 
    maxWidth: '450px', margin: '0 auto', background: 'white', 
    padding: '40px', borderRadius: '30px', border: '1px solid #fee2e2', 
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
  },
  btnWa: { 
    background: '#2563eb', color: 'white', border: 'none', 
    padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', 
    marginTop: '20px', cursor: 'pointer', transition: 'background 0.3s' 
  },
  alertBox: { 
    display: 'flex', alignItems: 'center', gap: '15px', 
    padding: '20px', borderRadius: '18px', marginBottom: '25px' 
  }
};

export default StudentFinance;