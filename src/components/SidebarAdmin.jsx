// src/components/SidebarAdmin.jsx
// ============================================================
// Sidebar admin -- termasuk menu BARU "Manajer Buku Digital"
// (/admin/buku) di grup MATERI (BUKU DIGITAL).
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, Users, GraduationCap, Calendar,
  CreditCard, FileText, Settings, LogOut, BookOpen,
  ClipboardList, Globe, TrendingUp, UserPlus, DollarSign,
  FileUp, Briefcase, Brain, Rocket, ClipboardCheck, Sparkles, BarChart3, Trophy,
  UploadCloud, Trash2, FolderTree, BookMarked, GitMerge, Archive,
  Crown, Lock, Receipt, KeyRound, History, Wallet, Toolbox
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection, getDocs, query, where, getCountFromServer,
  doc, setDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { isOwnerSession } from '../utils/roleAkses';
// 🔥 BARU: jendela bayar honor (7 hari terakhir bulan) untuk menu owner.
import { isJendelaBayar, tanggalLokalHariIni } from '../pages/admin/owner/keuanganOwnerUtils';
// 🔥 BARU (pemisahan akun Admin): sidebar sekarang tahu SIAPA yang
// sedang login (nama + peran), bukan cuma label generik "Admin".
import {
  ambilSesiAdmin, hapusSesiAdmin, isManajerSession, LABEL_PERAN_ADMIN,
} from '../utils/adminAuth';
import { catatAudit, KATEGORI } from '../utils/auditLog';

const SidebarAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [badgePiutang, setBadgePiutang] = useState(0);
  const [badgeSiswaBaru, setBadgeSiswaBaru] = useState(0);
  const [badgePendaftaran, setBadgePendaftaran] = useState(0);
  const [badgeLamaranTentor, setBadgeLamaranTentor] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const KEY_BADGE = 'gemilang:admin-badges';
    const fetchBadges = async () => {
      try {
        // HEMAT KUOTA (Turn 27): badge di-cache 5 menit di sessionStorage.
        // Sebelumnya query students + 2 agregasi jalan tiap 3 menit per
        // tab admin -> ikut memicu 429 resource-exhausted paket gratis.
        const c = sessionStorage.getItem(KEY_BADGE);
        if (c) {
          const b = JSON.parse(c);
          if (Date.now() - (b.t || 0) < 300000) {
            setBadgePiutang(b.piutang || 0);
            setBadgeSiswaBaru(b.baru || 0);
            setBadgePendaftaran(b.pendaftaran || 0);
            setBadgeLamaranTentor(b.lamaran || 0);
            return;
          }
        }
        const snap = await getDocs(collection(db, "students"));
        let piutang = 0, baru = 0;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        snap.forEach(doc => {
          const s = doc.data();
          const sisa = (parseInt(s.totalTagihan || 0)) - (parseInt(s.totalBayar || 0));
          if (sisa > 0) piutang++;
          const createdAt = s.createdAt?.toDate?.() || new Date();
          if (createdAt >= sevenDaysAgo && parseInt(s.totalBayar || 0) === 0) baru++;
        });

        setBadgePiutang(piutang);
        setBadgeSiswaBaru(baru);

        const pendingQuery = query(collection(db, "online_registrations"), where("paymentStatus", "==", "pending"));
        const countSnap = await getCountFromServer(pendingQuery);
        setBadgePendaftaran(countSnap.data().count);

        const lamaranBaruQuery = query(collection(db, "tutor_applications"), where("status", "==", "baru"));
        const lamaranCountSnap = await getCountFromServer(lamaranBaruQuery);
        setBadgeLamaranTentor(lamaranCountSnap.data().count);

        sessionStorage.setItem(KEY_BADGE, JSON.stringify({
          t: Date.now(),
          piutang,
          baru,
          pendaftaran: countSnap.data().count,
          lamaran: lamaranCountSnap.data().count,
        }));
      } catch { /* silent */ }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 180000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Keluar dari Dashboard Admin?")) {
      // 🔥 BARU: catat siapa yang keluar SEBELUM sesinya dihapus, supaya
      // jejak audit tetap tahu aktor-nya (bukan "tak-diketahui").
      catatAudit('logout', { kategori: KATEGORI.AUTH, target: 'Keluar dari Portal Admin' });
      hapusSesiAdmin();
      localStorage.clear();
      navigate('/');
    }
  };

  const handleLinkClick = () => {
    if (isMobile) setIsOpen(false);
  };

  // 🔥 BARU (beres-beres sidebar 2026-10-01): catat setiap klik menu ke
  // koleksi `statistik_menu`. Tujuannya sederhana: bulan depan keputusan
  // "menu ini masih dipakai atau tidak" diambil dari FAKTA klik, bukan
  // dari rasa bingung. Fire-and-forget: kegagalan mencatat TIDAK boleh
  // mengganggu navigasi.
  const rekamKlikMenu = (path, label) => {
    try {
      const polos = String(path).replace(/[?#].*$/, '');
      const slug = polos.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'root';
      setDoc(doc(db, 'statistik_menu', slug), {
        path: polos,
        label,
        klik: increment(1),
        terakhir: serverTimestamp(),
      }, { merge: true }).catch(() => {});
    } catch { /* navigasi jangan pernah gagal karena statistik */ }
  };

  const isActive = (path) => {
    // 🔥 UPGRADE: link dengan query (mis. /admin/finance?tab=kasir)
    // dianggap aktif hanya kalau pathname + query-nya cocok -- biar
    // "Tutup Kasir" tidak ikut menyala saat admin buka tab Dashboard.
    if (path.includes('?')) {
      return (location.pathname + location.search).startsWith(path);
    }
    if (path === '/admin') return location.pathname === '/admin';
    if (path === '/admin/finance' && location.search) {
      // Tab finance non-default aktif -> menu "Keuangan" biasa tidak menyala.
      return false;
    }
    return location.pathname.startsWith(path);
  };

  // 🔥 UPGRADE (pemisahan hak akses): Owner = super admin (lihat semua +
  // grup OWNER). Admin kasir = menu operasional harian saja; menu yang
  // membocorkan keuangan besar (Gaji Guru, Pengaturan/global, Portal
  // Owner) DISEMBUNYIKAN dari kasir.
  const owner = isOwnerSession();
  // 🔥 BARU (pemisahan akun Admin): identitas staf yang sedang login.
  // Manajer mendapat grup menu KEAMANAN (kelola akun + jejak audit).
  const manajer = isManajerSession();
  const sesiAdmin = ambilSesiAdmin();
  const namaTampil = owner
    ? 'Owner'
    : (sesiAdmin?.nama || (sesiAdmin?.peran === 'legacy' ? 'Admin (akun bersama)' : 'Admin'));
  const peranTampil = owner
    ? 'Owner (Super Admin)'
    : (LABEL_PERAN_ADMIN[sesiAdmin?.peran] || 'Admin Kasir');
  const inisialNama = (namaTampil || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'A';

  const menuGroups = [
    {
      label: 'UTAMA',
      items: [
        { name: 'Dashboard',    path: '/admin',            icon: <LayoutDashboard size={18} /> },
        { name: 'Dashboard Analisis', path: '/admin/analisis', icon: <BarChart3 size={18} /> },
        { name: 'Jadwal Harian',path: '/admin/schedule',   icon: <Calendar size={18} /> },
        { name: 'Log Harian',   path: '/admin/daily-log',  icon: <ClipboardList size={18} /> },
      ]
    },
    {
      label: 'AKADEMIK',
      items: [
        { name: 'Kelola Siswa', path: '/admin/students',         icon: <Users size={18} />,        badge: badgeSiswaBaru > 0 ? badgeSiswaBaru : null, badgeColor: '#3b82f6' },
        { name: 'Manajemen Absensi', path: '/admin/attendance', icon: <ClipboardCheck size={18} /> },
        { name: 'Kelola Guru',  path: '/admin/teachers',         icon: <GraduationCap size={18} /> },
        // 🔥 BARU (pembagian kewenangan): kerja operasional admin untuk
        // absensi tentor -- validasi sesi & unduh riwayat, tanpa uang.
        { name: 'Sesi & Validasi Guru', path: '/admin/teachers/sesi', icon: <ClipboardCheck size={18} /> },
        { name: 'Rapor & Nilai',path: '/admin/grades',           icon: <TrendingUp size={18} /> },
        { name: 'Portal Siswa', path: '/admin/portal',           icon: <Globe size={18} /> },
        // 🔥 Materi v2 & Bank Materi DIPINDAH ke halaman Perkakas
        // (/admin/perkakas) -- sidebar terlalu penuh; routenya tetap hidup.
      ]
    },
    {
      label: 'KEUANGAN',
      items: [
        { name: 'Keuangan',  path: '/admin/finance',            icon: <CreditCard size={18} />, badge: badgePiutang > 0 ? badgePiutang : null, badgeColor: '#ef4444' },
        // 🔥 BARU (kasir): kwitansi bernomor + logo, bisa dicetak ulang.
        { name: 'Kwitansi', path: '/admin/finance?tab=kwitansi', icon: <Receipt size={18} /> },
        // 🔥 BARU (kasir): tutup kas / setor uang fisik ke owner.
        { name: 'Tutup Kasir', path: '/admin/finance?tab=kasir', icon: <Lock size={18} /> },
        // 🔥 DIUBAH (keputusan owner 2026-10-01): rekap gaji guru sekarang
        // wilayah ADMIN OPERASIONAL -- admin yang memegang kendali validasi
        // sesi, nominal, dan tarif. Owner tinggal mengeksekusi pembayaran.
        { name: 'Gaji Guru', path: '/admin/teachers/salaries', icon: <FileText size={18} /> },
      ]
    },
    // 🔥 BARU: grup khusus owner -- jalan pintas ke portal keuangan owner
    // (posisi uang real-time, rekonsiliasi, honor tentor, neraca).
    ...(owner ? [{
      label: '👑 OWNER',
      items: [
        { name: 'Portal Keuangan Owner', path: '/owner/finance', icon: <Crown size={18} /> },
        // 🔥 BARU (pembagian kewenangan): pintu bayar honor. Muncul di
        // SIDEBAR hanya pada 7 hari terakhir bulan ("minggu terakhir") --
        // alur yang diminta owner: admin memvalidasi sesi sepanjang bulan,
        // lalu owner membayar di akhir bulan. Halaman tujuannya sendiri
        // tetap bisa dibuka kapan pun lewat Portal Keuangan (tab Honor),
        // supaya uang tidak pernah terjebak cuma karena kalender.
        ...(isJendelaBayar(tanggalLokalHariIni()) ? [{
          name: 'Bayar Tentor', path: '/owner/finance?tab=honor', icon: <Wallet size={18} />,
          badge: 'akhir bulan', badgeColor: '#f59e0b',
        }] : []),
        { name: 'Pengaturan Global', path: '/owner/settings', icon: <Settings size={18} /> },
      ]
    }] : []),
    // 🔥 BARU (pemisahan akun Admin): grup KEAMANAN -- hanya Owner dan
    // admin berperan Manajer. Kasir tidak melihat grup ini sama sekali.
    ...((owner || manajer) ? [{
      label: '🔐 KEAMANAN',
      items: [
        { name: 'Pengguna Admin', path: '/admin/pengguna', icon: <KeyRound size={18} /> },
        { name: 'Jejak Aktivitas', path: '/admin/audit',  icon: <History size={18} /> },
      ]
    }] : []),
    {
      label: '📋 PENDAFTARAN',
      items: [
        { name: 'Pendaftaran Online',  path: '/admin/pendaftaran',         icon: <UserPlus size={18} />,  badge: badgePendaftaran > 0 ? badgePendaftaran : null, badgeColor: '#f59e0b' },
        { name: 'Manajemen Harga',     path: '/admin/pendaftaran/harga',   icon: <DollarSign size={18} /> },
        { name: 'Lamaran Tentor/Staff',path: '/admin/pendaftaran/tentor',  icon: <Briefcase size={18} />, badge: badgeLamaranTentor > 0 ? badgeLamaranTentor : null, badgeColor: '#8b5cf6' },
      ]
    },
    // 🔥 BARU (beres-beres sidebar): 21 perkakas yang dulu memenuhi
    // grup MATERI (5 item) dan BANK SOAL (16 item) kini berada di satu
    // pintu: halaman Perkakas dengan kartu berdeskripsi + angka klik.
    // Tidak ada rute yang dihapus -- bookmark lama tetap jalan.
    {
      label: '🧰 KONTEN & PERKAKAS',
      items: [
        { name: 'Bank Soal & Perkakas', path: '/admin/perkakas', icon: <Toolbox size={18} /> },
      ]
    },
    {
      label: 'LAINNYA',
      items: [
        { name: 'Blog & Galeri', path: '/admin/blog',     icon: <BookOpen size={18} /> },
        // Pengaturan global (harga paket, PIN owner, password admin) =
        // ranah owner. Kasir tidak perlu (routenya juga sudah dikunci).
        ...(owner ? [{ name: 'Pengaturan', path: '/admin/settings', icon: <Settings size={18} /> }] : []),
      ]
    }
  ];

  return (
    <>
      {isMobile && (
        <button onClick={() => setIsOpen(!isOpen)} style={styles.hamburger(isOpen)}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {isOpen && isMobile && (
        <div onClick={() => setIsOpen(false)} style={styles.overlay} />
      )}

      <aside style={styles.sidebar(isOpen, isMobile)}>
        <div style={styles.logoSection}>
          <img src="/pwa-192x192.png" alt="Logo" style={styles.logoImg} />
          <div>
            <h3 style={styles.logoTitle}>BIMBEL GEMILANG</h3>
            <p style={styles.logoSub}>Admin Panel v2.0</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} style={styles.menuGroup}>
              <span style={styles.groupLabel}>{group.label}</span>
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { rekamKlikMenu(item.path, item.name); handleLinkClick(); }}
                  style={styles.navLink(active)}
                >
                    <span style={styles.navIcon(active)}>{item.icon}</span>
                    <span style={styles.navText(active)}>{item.name}</span>
                    {item.badge && <span style={styles.badge(item.badgeColor)}>{item.badge}</span>}
                    {active && <div style={styles.activeDot} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userInfo}>
            {/* 🔥 BARU: avatar inisial nama asli, bukan huruf "A" generik.
                Sekarang jelas SIAPA yang sedang memegang sesi ini. */}
            <div style={styles.userAvatar(owner)}>{owner ? '👑' : inisialNama}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={styles.userName} title={namaTampil}>{namaTampil}</div>
              <div style={styles.userRole}>{peranTampil}</div>
              {/* Peringatan halus selama masih ada yang pakai password
                  bersama -- identitasnya tidak jelas di jejak audit. */}
              {!owner && sesiAdmin?.peran === 'legacy' && (
                <div style={styles.warnLegacy} title="Anda masuk tanpa username, jadi aksi Anda tercatat sebagai 'akun bersama'. Minta Owner/Manajer membuatkan akun sendiri.">
                  ⚠ akun bersama
                </div>
              )}
            </div>
          </div>
          <button onClick={handleLogout} style={styles.btnLogout}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
};

const styles = {
  hamburger: (open) => ({
    position: 'fixed', top: 12, left: open ? 220 : 12, zIndex: 1100,
    background: '#1e293b', color: '#fbbf24', border: '2px solid #fbbf24',
    borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'left 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  }),
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 999
  },
  sidebar: (open, mobile) => ({
    width: 260, backgroundColor: '#0f172a', height: '100vh',
    position: 'fixed', left: 0, top: 0, zIndex: 1000,
    display: 'flex', flexDirection: 'column',
    transform: mobile ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
    transition: 'transform 0.3s ease',
    boxShadow: '4px 0 20px rgba(0,0,0,0.3)', overflow: 'hidden'
  }),
  logoSection: { padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' },
  logoImg: { width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(251,191,36,0.3)', objectFit: 'cover' },
  logoTitle: { margin: 0, color: '#fbbf24', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  logoSub: { margin: 0, color: '#64748b', fontSize: 10 },
  nav: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  menuGroup: { marginBottom: 2 },
  groupLabel: { display: 'block', padding: '16px 20px 6px', fontSize: 10, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 1.5 },
  navLink: (active) => ({ display: 'flex', alignItems: 'center', padding: '10px 20px', margin: '1px 8px', borderRadius: 8, textDecoration: 'none', background: active ? 'rgba(251,191,36,0.08)' : 'transparent', transition: '0.2s', position: 'relative', cursor: 'pointer' }),
  navIcon: (active) => ({ marginRight: 12, color: active ? '#fbbf24' : '#94a3b8', transition: '0.2s' }),
  navText: (active) => ({ fontSize: 13, fontWeight: active ? '600' : '400', color: active ? '#fbbf24' : '#cbd5e1', flex: 1 }),
  activeDot: { width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', position: 'absolute', right: 14 },
  badge: (color) => ({ background: color, color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 'bold', minWidth: 20, textAlign: 'center' }),
  footer: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 12 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  // 🔥 BARU: warna avatar membedakan Owner (emas) dari staf admin (biru),
  // jadi sekali lirik langsung kelihatan siapa yang pegang sesi ini.
  userAvatar: (owner) => ({
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    background: owner ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #60a5fa, #2563eb)',
    color: owner ? '#0f172a' : '#ffffff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: owner ? 14 : 12, letterSpacing: 0.3,
  }),
  // Nama asli bisa panjang -> dipotong rapi, jangan mendesak tombol Keluar.
  userName: {
    color: '#e2e8f0', fontSize: 12, fontWeight: '600',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150,
  },
  userRole: { color: '#64748b', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 },
  warnLegacy: {
    color: '#fbbf24', fontSize: 9, fontWeight: 700, marginTop: 2,
    background: 'rgba(245,158,11,0.13)', border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: 5, padding: '1px 5px', display: 'inline-block', cursor: 'help',
  },
  btnLogout: { width: '100%', padding: '10px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: '600', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: '0.2s' }
};

export default SidebarAdmin;