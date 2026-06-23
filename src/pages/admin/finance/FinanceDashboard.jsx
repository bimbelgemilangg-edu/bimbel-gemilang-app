import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, onSnapshot, getDocs, where, orderBy, limit } from "firebase/firestore";
import { 
  Eye, EyeOff, TrendingUp, TrendingDown, Wallet, 
  CreditCard, AlertCircle, Users, ArrowRight, DollarSign,
  Calendar, RefreshCw
} from 'lucide-react';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [privacyMode, setPrivacyMode] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Saldo
  const [balance, setBalance] = useState({ tunai: 0, bank: 0, total: 0 });
  
  // Statistik bulan ini
  const [monthStats, setMonthStats] = useState({ pemasukan: 0, pengeluaran: 0 });
  
  // Piutang
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [debtors, setDebtors] = useState([]);
  
  // Siswa baru belum bayar
  const [newStudents, setNewStudents] = useState([]);

  useEffect(() => {
    const qLogs = query(collection(db, "finance_logs"));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      let tunai = 0, bank = 0;
      let pemasukanBulanIni = 0, pengeluaranBulanIni = 0;
      const thisMonth = new Date().toISOString().slice(0, 7);
      
      snap.forEach(doc => {
        const data = doc.data();
        const amt = parseInt(data.amount || 0);
        
        // Hitung saldo total
        if (data.type === 'Pemasukan') {
          if (data.method === 'Tunai') tunai += amt; 
          else bank += amt;
        } else {
          if (data.method === 'Tunai') tunai -= amt; 
          else bank -= amt;
        }

        // Hitung statistik bulan ini
        if ((data.date || '').startsWith(thisMonth)) {
          if (data.type === 'Pemasukan') pemasukanBulanIni += amt;
          else pengeluaranBulanIni += amt;
        }
      });
      
      setBalance({ tunai, bank, total: tunai + bank });
      setMonthStats({ pemasukan: pemasukanBulanIni, pengeluaran: pengeluaranBulanIni });
    });

    // Fetch piutang & siswa baru
    const fetchDebtsAndNew = async () => {
      try {
        const snap = await getDocs(collection(db, "students"));
        let totalHutang = 0;
        let listNunggak = [];
        let listBaru = [];
        
        snap.forEach(doc => {
          const d = doc.data();
          const total = parseInt(d.totalTagihan || 0);
          const bayar = parseInt(d.totalBayar || 0);
          const sisa = total - bayar;
          
          if (sisa > 0) {
            totalHutang += sisa;
            listNunggak.push({ 
              id: doc.id, 
              nama: d.nama, 
              sisa: sisa, 
              studentId: d.studentId,
              kelas: d.kelasSekolah || '-' 
            });
          }

          // Siswa baru (7 hari terakhir) yang belum bayar
          const createdAt = d.createdAt?.toDate?.();
          if (createdAt) {
            const diffDays = (new Date() - createdAt) / (1000 * 60 * 60 * 24);
            if (diffDays <= 7 && bayar === 0) {
              listBaru.push({
                id: doc.id,
                nama: d.nama,
                studentId: d.studentId,
                totalTagihan: total
              });
            }
          }
        });
        
        setTotalPiutang(totalHutang);
        setDebtors(listNunggak.sort((a, b) => b.sisa - a.sisa).slice(0, 5));
        setNewStudents(listBaru);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    
    fetchDebtsAndNew();
    return () => unsubLogs();
  }, []);

  const rp = (num) => privacyMode ? "Rp ••••••••" : "Rp " + (num || 0).toLocaleString('id-ID');

  return (
    <div>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <h2 style={styles.pageTitle}>📊 Pusat Kontrol Keuangan</h2>
        <button onClick={() => setPrivacyMode(!privacyMode)} style={styles.privacyBtn(privacyMode)}>
          {privacyMode ? <><Eye size={16} /> Tampilkan</> : <><EyeOff size={16} /> Sembunyikan</>}
        </button>
      </div>

      {/* === SMART CARDS === */}
      <div style={styles.cardGrid}>
        {/* Total Aset */}
        <div style={styles.bigCard('#1e293b')}>
          <Wallet size={24} color="rgba(255,255,255,0.7)" />
          <span style={styles.bigLabel}>Total Aset</span>
          <h1 style={styles.bigValue}>{rp(balance.total)}</h1>
          <div style={styles.bigDetail}>
            <span>💵 Tunai: {rp(balance.tunai)}</span>
            <span>💳 Bank: {rp(balance.bank)}</span>
          </div>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div style={styles.mediumCard('#f0fdf4', '#10b981')}>
          <TrendingUp size={20} color="#10b981" />
          <span style={styles.mediumLabel}>Pemasukan Bulan Ini</span>
          <h2 style={{...styles.mediumValue, color: '#10b981'}}>{rp(monthStats.pemasukan)}</h2>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div style={styles.mediumCard('#fef2f2', '#ef4444')}>
          <TrendingDown size={20} color="#ef4444" />
          <span style={styles.mediumLabel}>Pengeluaran Bulan Ini</span>
          <h2 style={{...styles.mediumValue, color: '#ef4444'}}>{rp(monthStats.pengeluaran)}</h2>
        </div>

        {/* Total Piutang */}
        <div style={styles.mediumCard('#fff7ed', '#f97316')}>
          <AlertCircle size={20} color="#f97316" />
          <span style={styles.mediumLabel}>Total Piutang</span>
          <h2 style={{...styles.mediumValue, color: '#f97316'}}>{rp(totalPiutang)}</h2>
        </div>
      </div>

      {/* === ALERT SISWA BARU BELUM BAYAR === */}
      {newStudents.length > 0 && (
        <div style={styles.alertBox}>
          <div style={styles.alertHeader}>
            <Users size={18} />
            <strong>Siswa Baru Belum Dicatat Keuangannya</strong>
            <span style={styles.alertBadge}>{newStudents.length}</span>
          </div>
          <div style={styles.alertList}>
            {newStudents.map(s => (
              <div key={s.id} style={styles.alertItem}>
                <div>
                  <strong>{s.nama}</strong>
                  <span style={{fontSize: 10, color: '#94a3b8', marginLeft: 8}}>{s.studentId}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <span style={{fontWeight: 'bold', color: '#ef4444'}}>Rp {s.totalTagihan?.toLocaleString()}</span>
                  <button 
                    onClick={() => navigate(`/admin/students/finance/${s.id}`)}
                    style={styles.alertBtn}
                  >
                    Catat Pembayaran <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TOP 5 TUNGGAKAN === */}
      {debtors.length > 0 && (
        <div style={styles.debtBox}>
          <h3 style={styles.debtTitle}>⚠️ Top 5 Tunggakan Terbesar</h3>
          <div style={styles.debtList}>
            {debtors.map((d, i) => (
              <div key={i} style={styles.debtItem}>
                <div style={styles.debtRank(i)}>#{i + 1}</div>
                <div style={{flex: 1}}>
                  <strong>{d.nama}</strong>
                  <span style={{fontSize: 10, color: '#94a3b8', marginLeft: 6}}>{d.kelas}</span>
                </div>
                <span style={{fontWeight: 'bold', color: '#ef4444'}}>Rp {d.sisa.toLocaleString()}</span>
                <button 
                  onClick={() => navigate(`/admin/students/finance/${d.id}`)}
                  style={styles.debtBtn}
                >
                  <CreditCard size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { margin: 0, color: '#1e293b', fontSize: 20 },
  privacyBtn: (on) => ({ 
    padding: '8px 16px', borderRadius: 20, border: '2px solid #1e293b',
    background: on ? '#1e293b' : 'white', color: on ? 'white' : '#1e293b',
    cursor: 'pointer', fontWeight: 'bold', fontSize: 12,
    display: 'flex', alignItems: 'center', gap: 6
  }),

  // Cards
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 15, marginBottom: 24 },
  bigCard: (bg) => ({ background: bg, padding: 20, borderRadius: 16, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }),
  bigLabel: { display: 'block', fontSize: 11, opacity: 0.8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  bigValue: { margin: '8px 0', fontSize: 28, fontWeight: 'bold' },
  bigDetail: { display: 'flex', gap: 16, fontSize: 11, opacity: 0.8 },
  mediumCard: (bg, color) => ({ background: bg, padding: 16, borderRadius: 14, border: `1px solid ${color}30` }),
  mediumLabel: { display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 },
  mediumValue: { margin: '6px 0', fontSize: 22, fontWeight: 'bold' },

  // Alert Siswa Baru
  alertBox: { background: '#fff7ed', border: '2px solid #f97316', padding: 16, borderRadius: 14, marginBottom: 20 },
  alertHeader: { display: 'flex', alignItems: 'center', gap: 8, color: '#c2410c', marginBottom: 12, fontSize: 14 },
  alertBadge: { background: '#f97316', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' },
  alertList: { display: 'flex', flexDirection: 'column', gap: 8 },
  alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'white', borderRadius: 10, flexWrap: 'wrap', gap: 8 },
  alertBtn: { padding: '6px 12px', background: '#f97316', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 },

  // Debtors
  debtBox: { background: 'white', padding: 16, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  debtTitle: { margin: '0 0 12px 0', fontSize: 14, color: '#1e293b' },
  debtList: { display: 'flex', flexDirection: 'column', gap: 6 },
  debtItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fee2e2' },
  debtRank: (i) => ({ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#ef4444' : '#f87171', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }),
  debtBtn: { padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }
};

export default FinanceDashboard;