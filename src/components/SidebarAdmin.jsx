// src/components/SidebarAdmin.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Users, GraduationCap, Calendar,
  CreditCard, FileText, Settings, LogOut, Bell, BookOpen,
  ClipboardList, Globe, TrendingUp, UserPlus, DollarSign
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const SidebarAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [badgePiutang, setBadgePiutang] = useState(0);
  const [badgeSiswaBaru, setBadgeSiswaBaru] = useState(0);
  const [badgePendaftaran, setBadgePendaftaran] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch badge counts
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        // Siswa piutang & baru
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

        // 🔥 Pendaftaran Online pending
        const pendaftaranSnap = await getDocs(collection(db, "online_registrations"));
        let pending = 0;
        pendaftaranSnap.forEach(doc => {
          const data = doc.data();
          if (data.paymentStatus === 'pending') pending++;
        });
        setBadgePendaftaran(pending);

      } catch (e) { /* silent */ }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Keluar dari Dashboard Admin?")) {
      localStorage.clear();
      navigate('/');
    }
  };

  const handleLinkClick = () => {
    if (isMobile) setIsOpen(false);
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  // ============================================================
  // MENU GROUPS
  // ============================================================
  const menuGroups = [
    {
      label: 'UTAMA',
      items: [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
        { name: 'Jadwal Harian', path: '/admin/schedule', icon: <Calendar size={18} /> },
        { name: 'Log Harian', path: '/admin/daily-log', icon: <ClipboardList size={18} /> },
      ]
    },
    {
      label: 'AKADEMIK',
      items: [
        { name: 'Kelola Siswa', path: '/admin/students', icon: <Users size={18} />, badge: badgeSiswaBaru > 0 ? badgeSiswaBaru : null, badgeColor: '#3b82f6' },
        { name: 'Kelola Guru', path: '/admin/teachers', icon: <GraduationCap size={18} /> },
        { name: 'Rapor & Nilai', path: '/admin/grades', icon: <TrendingUp size={18} /> },
        { name: 'Portal Siswa', path: '/admin/portal', icon: <Globe size={18} /> },
      ]
    },
    {
      label: 'KEUANGAN',
      items: [
        { name: 'Keuangan', path: '/admin/finance', icon: <CreditCard size={18} />, badge: badgePiutang > 0 ? badgePiutang : null, badgeColor: '#ef4444' },
        { name: 'Gaji Guru', path: '/admin/teachers/salaries', icon: <FileText size={18} /> },
      ]
    },
    {
      label: '📋 PENDAFTARAN',
      items: [
        { 
          name: 'Pendaftaran Online', 
          path: '/admin/pendaftaran', 
          icon: <UserPlus size={18} />,
          badge: badgePendaftaran > 0 ? badgePendaftaran : null,
          badgeColor: '#f59e0b'
        },
        { 
          name: 'Manajemen Harga', 
          path: '/admin/pendaftaran/harga', 
          icon: <DollarSign size={18} /> 
        },
      ]
    },
    {
      label: 'LAINNYA',
      items: [
        { name: 'Blog & Galeri', path: '/admin/blog', icon: <BookOpen size={18} /> },
        { name: 'Pengaturan', path: '/admin/settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      {/* Hamburger Button - Mobile */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          style={styles.hamburger(isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Overlay */}
      {isOpen && isMobile && (
        <div onClick={() => setIsOpen(false)} style={styles.overlay} />
      )}

      {/* Sidebar */}
      <aside style={styles.sidebar(isOpen, isMobile)}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <img 
            src="/pwa-192x192.png" 
            alt="Logo" 
            style={styles.logoImg}
          />
          <div>
            <h3 style={styles.logoTitle}>BIMBEL GEMILANG</h3>
            <p style={styles.logoSub}>Admin Panel v2.0</p>
          </div>
        </div>

        {/* Navigation */}
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
                    onClick={handleLinkClick}
                    style={styles.navLink(active)}
                  >
                    <span style={styles.navIcon(active)}>{item.icon}</span>
                    <span style={styles.navText(active)}>{item.name}</span>
                    {item.badge && (
                      <span style={styles.badge(item.badgeColor)}>{item.badge}</span>
                    )}
                    {active && <div style={styles.activeDot} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>A</div>
            <div>
              <div style={styles.userName}>Admin</div>
              <div style={styles.userRole}>Super Admin</div>
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

// ============================================================
// STYLES
// ============================================================
const styles = {
  hamburger: (open) => ({
    position: 'fixed',
    top: 12,
    left: open ? 220 : 12,
    zIndex: 1100,
    background: '#1e293b',
    color: '#fbbf24',
    border: '2px solid #fbbf24',
    borderRadius: 10,
    padding: '8px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'left 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  }),
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 999
  },
  sidebar: (open, mobile) => ({
    width: 260,
    backgroundColor: '#0f172a',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transform: mobile ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
    transition: 'transform 0.3s ease',
    boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
    overflow: 'hidden'
  }),
  logoSection: {
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  logoImg: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid rgba(251,191,36,0.3)',
    objectFit: 'cover'
  },
  logoTitle: { margin: 0, color: '#fbbf24', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  logoSub: { margin: 0, color: '#64748b', fontSize: 10 },
  nav: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  menuGroup: { marginBottom: 2 },
  groupLabel: {
    display: 'block',
    padding: '16px 20px 6px',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  navLink: (active) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    margin: '1px 8px',
    borderRadius: 8,
    textDecoration: 'none',
    background: active ? 'rgba(251,191,36,0.08)' : 'transparent',
    transition: '0.2s',
    position: 'relative',
    cursor: 'pointer',
    ':hover': {
      background: active ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)'
    }
  }),
  navIcon: (active) => ({
    marginRight: 12,
    color: active ? '#fbbf24' : '#94a3b8',
    transition: '0.2s'
  }),
  navText: (active) => ({
    fontSize: 13,
    fontWeight: active ? '600' : '400',
    color: active ? '#fbbf24' : '#cbd5e1',
    flex: 1
  }),
  activeDot: {
    width: 6, height: 6,
    borderRadius: '50%',
    background: '#fbbf24',
    position: 'absolute',
    right: 14
  },
  badge: (color) => ({
    background: color,
    color: 'white',
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center'
  }),
  footer: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  userAvatar: {
    width: 36, height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#0f172a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: 14
  },
  userName: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  userRole: { color: '#64748b', fontSize: 10 },
  btnLogout: {
    width: '100%',
    padding: '10px',
    background: 'rgba(239,68,68,0.15)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: '0.2s'
  }
};

export default SidebarAdmin;