// src/pages/admin/OwnerFinance.jsx
// 🔥 PUSAT KOMANDO KEUANGAN OWNER (rombak besar, permintaan owner:
// "posisi sekarang bingung, mau lihat seluruh transaksi & keadaan uang
// realtime, bisa download analisis laporan lengkap, akhir tahun bisa
// cek neraca detail bisnis").
//
// Halaman ini sekarang punya 4 tab, semuanya REAL-TIME (onSnapshot --
// begitu admin mencatat transaksi, angka owner ikut berubah tanpa
// refresh):
//   📡 Posisi Real-time  -> posisi uang sekali lirik + feed transaksi
//                           live + cicilan yang jatuh tempo
//   🧾 Semua Transaksi   -> SELURUH riwayat sejak awal usaha, filter
//                           lengkap, download Excel/CSV
//   📈 Analisis          -> laba rugi 2 basis (kas & akrual), grafik
//                           tren 12 bulan, kategori, per siswa
//   🏦 Neraca & Laporan  -> neraca per tanggal (bisa 31 Des buat tutup
//                           buku), arus kas tahunan, download laporan
//                           lengkap PDF/Excel
//
// Semua perhitungan hidup di ./owner/keuanganOwnerUtils.js (fungsi
// murni, satu sumber kebenaran). Aturan main uang dipertahankan dari
// perbaikan bug saldo kembar: pemasukan ber-metode 'Cicilan' adalah
// KOMITMEN yang belum diterima -- bukan kas; data lama tanpa metode
// dihitung ke total tapi ditampilkan terpisah; semua tanggal memakai
// waktu lokal (WIB), bukan UTC.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, doc, onSnapshot } from "firebase/firestore";
import { Crown, LogOut, Eye, EyeOff } from 'lucide-react';
import {
  normalisasiLog, normalisasiStudent, normalisasiTagihan, normalisasiTeacherLog,
} from './owner/keuanganOwnerUtils';
import PanelPosisi from './owner/PanelPosisi';
import PanelTransaksi from './owner/PanelTransaksi';
import PanelAnalisis from './owner/PanelAnalisis';
import PanelNeraca from './owner/PanelNeraca';

const TABS = [
  { id: 'posisi', label: '📡 Posisi Real-time' },
  { id: 'transaksi', label: '🧾 Semua Transaksi' },
  { id: 'analisis', label: '📈 Analisis' },
  { id: 'neraca', label: '🏦 Neraca & Laporan' },
];

const OwnerFinance = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [tab, setTab] = useState('posisi');
  const [terakhirUpdate, setTerakhirUpdate] = useState(null);

  // Data mentah dari listener, lalu dinormalisasi sekali via useMemo.
  const [logsRaw, setLogsRaw] = useState([]);
  const [studentsRaw, setStudentsRaw] = useState([]);
  const [tagihanRaw, setTagihanRaw] = useState([]);
  const [teacherRaw, setTeacherRaw] = useState([]);
  const [settings, setSettings] = useState({});
  const [siap, setSiap] = useState({ logs: false, students: false, tagihan: false, teacher: false, settings: false });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 REAL-TIME: sebelumnya halaman ini cuma getDocs sekali saat dibuka
  // -- kalau admin mencatat transaksi di tab lain, owner harus refresh
  // manual (dan sering lupa, ujungnya "angkanya beda, bingung").
  // Sekarang semua koleksi dipantau live. Query tanpa filter where,
  // jadi tidak butuh composite index dan biayanya sama seperti dulu.
  useEffect(() => {
    const tandaiSiap = (kunci) => setSiap(prev => ({ ...prev, [kunci]: true }));

    const unsubLogs = onSnapshot(collection(db, "finance_logs"), (snap) => {
      setLogsRaw(snap.docs);
      setTerakhirUpdate(Date.now());
      tandaiSiap('logs');
    }, () => tandaiSiap('logs'));

    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      setStudentsRaw(snap.docs);
      setTerakhirUpdate(Date.now());
      tandaiSiap('students');
    }, () => tandaiSiap('students'));

    const unsubTagihan = onSnapshot(collection(db, "finance_tagihan"), (snap) => {
      setTagihanRaw(snap.docs);
      setTerakhirUpdate(Date.now());
      tandaiSiap('tagihan');
    }, () => tandaiSiap('tagihan'));

    const unsubTeacher = onSnapshot(collection(db, "teacher_logs"), (snap) => {
      setTeacherRaw(snap.docs);
      setTerakhirUpdate(Date.now());
      tandaiSiap('teacher');
    }, () => tandaiSiap('teacher'));

    const unsubSettings = onSnapshot(doc(db, "settings", "global_config"), (snap) => {
      setSettings(snap.exists() ? snap.data() : {});
      tandaiSiap('settings');
    }, () => tandaiSiap('settings'));

    return () => {
      unsubLogs(); unsubStudents(); unsubTagihan(); unsubTeacher(); unsubSettings();
    };
  }, []);

  const logs = useMemo(() => logsRaw.map(normalisasiLog), [logsRaw]);
  const students = useMemo(() => studentsRaw.map(normalisasiStudent), [studentsRaw]);
  const tagihanList = useMemo(() => tagihanRaw.map(normalisasiTagihan), [tagihanRaw]);
  const teacherLogs = useMemo(() => teacherRaw.map(normalisasiTeacherLog), [teacherRaw]);

  const handleLogout = useCallback(() => {
    if (window.confirm("Keluar dari Portal Owner?")) {
      localStorage.removeItem("isOwnerLoggedIn");
      localStorage.removeItem("role");
      navigate("/");
    }
  }, [navigate]);

  const rp = useCallback((num) => privacyMode
    ? "Rp ••••••••"
    : "Rp " + Math.round(num || 0).toLocaleString('id-ID'),
  [privacyMode]);

  const semuaSiap = siap.logs && siap.students && siap.tagihan && siap.teacher && siap.settings;

  if (!semuaSiap) {
    return (
      <div style={styles.wrapper}>
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <div style={styles.spinner}></div>
          <p>Menyambungkan ke data keuangan real-time...</p>
        </div>
      </div>
    );
  }

  const panelProps = { logs, students, tagihanList, teacherLogs, settings, rp, isMobile };

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContent(isMobile)}>

        {/* HEADER PORTAL OWNER */}
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
            <h2 style={styles.pageTitle}>📊 Pusat Komando Keuangan</h2>
            <p style={styles.subtitle}>
              Seluruh transaksi & posisi uang dipantau REAL-TIME — perubahan apa pun yang dicatat admin langsung muncul di sini tanpa refresh.
            </p>
          </div>
          <button onClick={() => setPrivacyMode(!privacyMode)} style={styles.privacyBtn(privacyMode)}>
            {privacyMode ? <><Eye size={14} /> Tampilkan</> : <><EyeOff size={14} /> Sembunyikan</>}
          </button>
        </div>

        {/* SUB-TAB */}
        <div style={styles.subTabBar}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={styles.subTab(tab === t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PANEL AKTIF */}
        {tab === 'posisi' && (
          <PanelPosisi {...panelProps} terakhirUpdate={terakhirUpdate} />
        )}
        {tab === 'transaksi' && (
          <PanelTransaksi logs={logs} rp={rp} isMobile={isMobile} />
        )}
        {tab === 'analisis' && (
          <PanelAnalisis {...panelProps} privacyMode={privacyMode} />
        )}
        {tab === 'neraca' && (
          <PanelNeraca {...panelProps} />
        )}

      </div>

      <style>{`
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)}}
      `}</style>
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

  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 },
  pageTitle: { margin: 0, color: '#1e293b', fontSize: 20 },
  subtitle: { color: '#94a3b8', fontSize: 12, margin: '4px 0 0', maxWidth: 560, lineHeight: 1.6 },
  privacyBtn: (on) => ({ padding: '8px 14px', borderRadius: 20, border: '2px solid #1e293b', background: on ? '#1e293b' : 'white', color: on ? 'white' : '#1e293b', cursor: 'pointer', fontWeight: 'bold', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }),

  subTabBar: { display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' },
  subTab: (aktif) => ({
    padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 11.5, whiteSpace: 'nowrap',
    border: aktif ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
    background: aktif ? '#e0f2fe' : 'white',
    color: aktif ? '#0369a1' : '#64748b',
  }),
};

export default OwnerFinance;
