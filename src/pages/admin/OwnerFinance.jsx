// src/pages/admin/OwnerFinance.jsx
// 🔥 HALAMAN BARU: dashboard keuangan LENGKAP khusus Owner. Beda sama
// FinanceDashboard.jsx (yang cuma nunjukkin kas & piutang buat kerja
// harian admin), halaman ini ngasih gambaran "profit yang SESUNGGUHNYA
// aman diambil" -- bukan cuma kas yang ada di rekening. Konsepnya:
//
//   Pendapatan yang KEPAKE bulan ini
//   - HPP (honor guru yang beneran keluar bulan ini)
//   - Biaya Tetap (sewa, listrik, dll)
//   - Penyusutan aset (AC, proyektor, dll)
//   = PROFIT BERSIH (yang aman diambil)
//
// Dipisahkan jelas dari "Kewajiban Belum Terpenuhi" -- duit yang UDAH
// masuk kas tapi masih "milik" sesi belajar yang belum diajarkan (siswa
// yang bayar 3/6 bulan sekaligus).
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  Crown, LogOut, Wallet, TrendingUp, TrendingDown, AlertCircle,
  ShieldCheck, PiggyBank, Receipt, Calculator, Info, Eye, EyeOff
} from 'lucide-react';

const OwnerFinance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [privacyMode, setPrivacyMode] = useState(false);

  const [saldo, setSaldo] = useState({ tunai: 0, bank: 0, total: 0 });
  const [piutang, setPiutang] = useState(0);
  const [pendapatanKepake, setPendapatanKepake] = useState(0);
  const [kewajiban, setKewajiban] = useState(0);
  const [hpp, setHpp] = useState(0);
  const [totalFixedCost, setTotalFixedCost] = useState(0);
  const [totalPenyusutan, setTotalPenyusutan] = useState(0);
  const [jumlahSiswaAktif, setJumlahSiswaAktif] = useState(0);
  const [fixedCostsList, setFixedCostsList] = useState([]);
  const [assetsList, setAssetsList] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hitungSemua = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const bulanIni = now.toISOString().slice(0, 7); // YYYY-MM

        // ===== 1. AMBIL SETTINGS (biaya tetap & aset) =====
        const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
        const fixedCosts = settingsData.fixedCosts || [];
        const assets = settingsData.assets || [];
        setFixedCostsList(fixedCosts);
        setAssetsList(assets);

        const totalFC = fixedCosts.reduce((s, f) => s + (parseInt(f.amountPerMonth) || 0), 0);
        setTotalFixedCost(totalFC);

        const totalDep = assets.reduce((s, a) => {
          const bulan = parseInt(a.usefulLifeMonths) || 0;
          return s + (bulan > 0 ? Math.round((parseInt(a.purchasePrice) || 0) / bulan) : 0);
        }, 0);
        setTotalPenyusutan(totalDep);

        // ===== 2. SALDO KAS (dari SELURUH riwayat finance_logs) =====
        const logsSnap = await getDocs(collection(db, "finance_logs"));
        let tunai = 0, bank = 0;
        logsSnap.forEach(d => {
          const data = d.data();
          const amt = parseInt(data.amount || 0);
          if (data.type === 'Pemasukan') {
            if (data.method === 'Tunai') tunai += amt; else bank += amt;
          } else {
            if (data.method === 'Tunai') tunai -= amt; else bank -= amt;
          }
        });
        setSaldo({ tunai, bank, total: tunai + bank });

        // ===== 3. DATA SISWA: Piutang, Pendapatan Kepake, Kewajiban =====
        const studentsSnap = await getDocs(collection(db, "students"));
        let totalPiutang = 0;
        let totalPendapatanKepake = 0;
        let totalKewajiban = 0;
        let aktifCount = 0;

        studentsSnap.forEach(d => {
          const s = d.data();
          const totalTagihan = parseInt(s.totalTagihan || 0);
          const totalBayar = parseInt(s.totalBayar || 0);
          const sisa = totalTagihan - totalBayar;
          if (sisa > 0) totalPiutang += sisa;

          const mulai = s.tanggalMulai ? new Date(s.tanggalMulai) : null;
          const selesai = s.tanggalSelesai ? new Date(s.tanggalSelesai) : null;
          const nilaiBulanan = parseInt(s.paketHargaBulanan || 0);

          if (!mulai || !selesai || !nilaiBulanan) return;

          // Paket siswa ini "aktif" (nyentuh) bulan ini?
          const mulaiBulan = mulai.toISOString().slice(0, 7);
          const selesaiBulan = selesai.toISOString().slice(0, 7);
          const aktifBulanIni = mulaiBulan <= bulanIni && selesaiBulan >= bulanIni;

          if (aktifBulanIni) {
            totalPendapatanKepake += nilaiBulanan;
            aktifCount++;
          }

          // Kewajiban belum terpenuhi: sisa bulan dari SEKARANG (atau
          // mulai, mana yang lebih akhir) sampai tanggalSelesai.
          const acuan = mulai > now ? mulai : now;
          if (selesai > acuan) {
            const bulanTersisa = (selesai.getFullYear() - acuan.getFullYear()) * 12 + (selesai.getMonth() - acuan.getMonth());
            if (bulanTersisa > 0) {
              totalKewajiban += bulanTersisa * nilaiBulanan;
            }
          }
        });

        setPiutang(totalPiutang);
        setPendapatanKepake(totalPendapatanKepake);
        setKewajiban(totalKewajiban);
        setJumlahSiswaAktif(aktifCount);

        // ===== 4. HPP: honor guru yang BENERAN keluar bulan ini =====
        const teacherLogsSnap = await getDocs(collection(db, "teacher_logs"));
        let totalHpp = 0;
        teacherLogsSnap.forEach(d => {
          const data = d.data();
          const tgl = (data.tanggal || '').split(' ')[0];
          if (tgl.startsWith(bulanIni)) {
            totalHpp += parseInt(data.nominal || 0);
          }
        });
        setHpp(totalHpp);

      } catch (error) {
        console.error("Error hitung keuangan owner:", error);
      }
      setLoading(false);
    };
    hitungSemua();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Keluar dari Portal Owner?")) {
      localStorage.removeItem("isOwnerLoggedIn");
      localStorage.removeItem("role");
      navigate("/");
    }
  };

  const profitBersih = pendapatanKepake - hpp - totalFixedCost - totalPenyusutan;
  const rp = (num) => privacyMode ? "Rp ••••••••" : "Rp " + (num || 0).toLocaleString('id-ID');

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <div style={styles.spinner}></div>
          <p>Menghitung data keuangan dari seluruh sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContent(isMobile)}>

        {/* HEADER */}
        <div style={styles.ownerTopBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.ownerBadge}><Crown size={16} color="#78350f" /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#78350f' }}>Portal Owner</div>
              <div style={{ fontSize: 10, color: '#92400e' }}>Bimbel Gemilang</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.btnLogoutOwner}>
            <LogOut size={14} /> Keluar
          </button>
        </div>

        <div style={styles.ownerTabs}>
          <div style={styles.ownerTab} onClick={() => navigate('/owner/settings')}>⚙️ Pengaturan</div>
          <div style={styles.ownerTabActive}>📊 Keuangan</div>
        </div>

        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.pageTitle}>📊 Keuangan Lengkap</h2>
            <p style={styles.subtitle}>Data ditarik langsung dari transaksi, siswa aktif, honor guru, biaya tetap, dan penyusutan aset.</p>
          </div>
          <button onClick={() => setPrivacyMode(!privacyMode)} style={styles.privacyBtn(privacyMode)}>
            {privacyMode ? <><Eye size={14} /> Tampilkan</> : <><EyeOff size={14} /> Sembunyikan</>}
          </button>
        </div>

        {/* ===== BAGIAN 1: KAS vs PROFIT (ini yang jawab ketakutan utama) ===== */}
        <div style={styles.heroGrid(isMobile)}>
          <div style={styles.heroCard('#1e293b')}>
            <Wallet size={20} color="rgba(255,255,255,0.6)" />
            <span style={styles.heroLabel}>Kas Yang Ada Sekarang</span>
            <h1 style={styles.heroValue}>{rp(saldo.total)}</h1>
            <div style={styles.heroDetail}>
              <span>💵 Tunai: {rp(saldo.tunai)}</span>
              <span>💳 Bank: {rp(saldo.bank)}</span>
            </div>
            <p style={styles.heroNote}>⚠️ Ini BUKAN profit. Sebagian titipan siswa yang bayar di muka.</p>
          </div>

          <div style={styles.heroCard(profitBersih >= 0 ? '#065f46' : '#7f1d1d')}>
            <ShieldCheck size={20} color="rgba(255,255,255,0.6)" />
            <span style={styles.heroLabel}>Profit Bersih Bulan Ini (Aman Diambil)</span>
            <h1 style={styles.heroValue}>{rp(profitBersih)}</h1>
            <div style={styles.heroDetail}>
              <span>Dari {jumlahSiswaAktif} siswa aktif bulan ini</span>
            </div>
            <p style={styles.heroNote}>✅ Ini yang sudah "kepake" (diajarkan) dikurangi semua biaya.</p>
          </div>
        </div>

        {/* ===== BAGIAN 2: KEWAJIBAN & PIUTANG (jawab ketakutan spesifik) ===== */}
        <div style={styles.warnGrid(isMobile)}>
          <div style={styles.warnCard('#fff7ed', '#f97316')}>
            <PiggyBank size={18} color="#f97316" />
            <span style={styles.warnLabel}>Kewajiban Belum Terpenuhi</span>
            <h3 style={{...styles.warnValue, color: '#f97316'}}>{rp(kewajiban)}</h3>
            <p style={styles.warnDesc}>Duit yang SUDAH masuk kas, tapi masih "milik" sesi belajar yang BELUM diajarkan (siswa bayar 3/6 bulan di muka). <b>Jangan diambil dulu</b> -- ini yang bikin was-was selama ini.</p>
          </div>
          <div style={styles.warnCard('#fef2f2', '#ef4444')}>
            <AlertCircle size={18} color="#ef4444" />
            <span style={styles.warnLabel}>Piutang (Belum Dibayar Siswa)</span>
            <h3 style={{...styles.warnValue, color: '#ef4444'}}>{rp(piutang)}</h3>
            <p style={styles.warnDesc}>Tagihan yang belum dilunasi siswa. Ini beda dari Kewajiban di atas -- ini duit yang belum masuk sama sekali.</p>
          </div>
        </div>

        {/* ===== BAGIAN 3: RINCIAN PERHITUNGAN PROFIT ===== */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><Calculator size={16} /> Rincian Perhitungan Profit Bulan Ini</h3>
          <div style={styles.calcRow}>
            <span>Pendapatan yang Kepake ({jumlahSiswaAktif} siswa × nilai paket bulanan)</span>
            <b style={{ color: '#10b981' }}>+ {rp(pendapatanKepake)}</b>
          </div>
          <div style={styles.calcRow}>
            <span>HPP — Honor Guru (yang beneran keluar bulan ini)</span>
            <b style={{ color: '#ef4444' }}>- {rp(hpp)}</b>
          </div>
          <div style={styles.calcRow}>
            <span>Biaya Tetap ({fixedCostsList.length} pos: {fixedCostsList.map(f => f.label).join(', ') || '-'})</span>
            <b style={{ color: '#ef4444' }}>- {rp(totalFixedCost)}</b>
          </div>
          <div style={styles.calcRow}>
            <span>Penyusutan Aset ({assetsList.length} aset)</span>
            <b style={{ color: '#ef4444' }}>- {rp(totalPenyusutan)}</b>
          </div>
          <div style={styles.calcTotal}>
            <span>= PROFIT BERSIH</span>
            <b style={{ color: profitBersih >= 0 ? '#10b981' : '#ef4444' }}>{rp(profitBersih)}</b>
          </div>

          <div style={styles.infoBoxBlue}>
            <Info size={14} />
            <span style={{ fontSize: 11 }}>
              "Pendapatan yang Kepake" dihitung dari siswa yang paketnya nyentuh bulan berjalan, BUKAN dari kas yang masuk bulan ini. Kalau owner mau atur Biaya Tetap atau Aset, buka tab "⚙️ Pengaturan".
            </span>
          </div>
        </div>

      </div>

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const styles = {
  wrapper: { background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ padding: m ? '15px' : '30px', width: '100%', maxWidth: 1300, margin: '0 auto', boxSizing: 'border-box' }),
  spinner: { width: 36, height: 36, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },

  ownerTopBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid #fbbf24', padding: '10px 16px', borderRadius: 12, marginBottom: 16 },
  ownerBadge: { width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnLogoutOwner: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'white', color: '#92400e', border: '1px solid #fbbf24', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  ownerTabs: { display: 'flex', gap: 8, marginBottom: 16 },
  ownerTabActive: { padding: '8px 16px', borderRadius: 8, background: '#1e293b', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'default' },
  ownerTab: { padding: '8px 16px', borderRadius: 8, background: 'white', color: '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: '1px solid #e2e8f0' },

  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  pageTitle: { margin: 0, color: '#1e293b', fontSize: 20 },
  subtitle: { color: '#94a3b8', fontSize: 12, margin: '4px 0 0', maxWidth: 480 },
  privacyBtn: (on) => ({ padding: '8px 14px', borderRadius: 20, border: '2px solid #1e293b', background: on ? '#1e293b' : 'white', color: on ? 'white' : '#1e293b', cursor: 'pointer', fontWeight: 'bold', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }),

  heroGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 15, marginBottom: 16 }),
  heroCard: (bg) => ({ background: bg, padding: 20, borderRadius: 16, color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }),
  heroLabel: { display: 'block', fontSize: 11, opacity: 0.8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { margin: '8px 0', fontSize: 26, fontWeight: 'bold' },
  heroDetail: { display: 'flex', gap: 16, fontSize: 11, opacity: 0.85, marginBottom: 8, flexWrap: 'wrap' },
  heroNote: { fontSize: 10, opacity: 0.75, margin: 0, lineHeight: 1.5 },

  warnGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 15, marginBottom: 20 }),
  warnCard: (bg, color) => ({ background: bg, padding: 16, borderRadius: 14, border: `1px solid ${color}30` }),
  warnLabel: { display: 'block', fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: 700 },
  warnValue: { margin: '6px 0', fontSize: 20, fontWeight: 'bold' },
  warnDesc: { fontSize: 10.5, color: '#64748b', margin: 0, lineHeight: 1.6 },

  card: { background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  cardTitle: { margin: '0 0 14px', fontSize: 15, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  calcRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc', fontSize: 12, gap: 10 },
  calcTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 4px', marginTop: 6, borderTop: '2px solid #1e293b', fontSize: 15, fontWeight: 900 },
  infoBoxBlue: { background: '#eff6ff', padding: 12, borderRadius: 8, border: '1px solid #bfdbfe', marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8, color: '#1e40af' },
};

export default OwnerFinance;