import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, X, Home, BarChart2, BookOpen, Wallet, 
  Menu, Calendar, CheckSquare, Trophy, TrendingUp, 
  Award, Star, Settings, Bell, User, HelpCircle,
  FileText, Clock, Target, Zap, Shield, Coffee,
  Gift, Smile, Heart, Compass, Globe, Sparkles,
  Moon, Sun, Cloud, Droplet, Wind, Feather,
  Crown, Medal, Gem, Diamond, Circle, Square
} from 'lucide-react';

// Logo dari folder public
const LogoBimbel = "/logo-gemilang.png";

const SidebarSiswa = ({ activeMenu, setActiveMenu, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sinkronkan activeMenu berdasarkan URL saat pertama kali load
  useEffect(() => {
    const path = location.pathname;
    if (path === '/siswa/dashboard') setActiveMenu('dashboard');
    else if (path === '/siswa/rapor') setActiveMenu('rapor');
    else if (path === '/siswa/smart-rapor') setActiveMenu('smart-rapor');
    else if (path === '/siswa/leaderboard') setActiveMenu('leaderboard');
    else if (path === '/siswa/materi') setActiveMenu('materi');
    else if (path === '/siswa/keuangan') setActiveMenu('keuangan');
    else if (path === '/siswa/jadwal') setActiveMenu('jadwal');
    else if (path === '/siswa/absensi') setActiveMenu('absensi');
    else if (path === '/siswa/profil') setActiveMenu('profil');
  }, [location.pathname, setActiveMenu]);

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const handleMenuClick = (id, path) => {
    setActiveMenu(id);
    if (path) {
      navigate(path);
    }
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    if(window.confirm("Apakah kamu yakin ingin keluar dari portal siswa?")) {
      localStorage.removeItem("isSiswaLoggedIn");
      localStorage.removeItem("role");
      localStorage.removeItem("studentId");
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentGrade");
      navigate('/login-siswa');
    }
  };

  // Menu structure with submenus
  const menuGroups = [
    {
      name: 'UTAMA',
      items: [
        { 
          id: 'dashboard', 
          label: 'Dashboard', 
          icon: <Home size={18}/>, 
          path: '/siswa/dashboard' 
        },
      ]
    },
    {
      name: 'BELAJAR',
      items: [
        { 
          id: 'materi', 
          label: 'Materi Belajar', 
          icon: <BookOpen size={18}/>, 
          path: '/siswa/materi' 
        },
        { 
          id: 'jadwal', 
          label: 'Jadwal Belajar', 
          icon: <Calendar size={18}/>, 
          path: '/siswa/jadwal' 
        },
        { 
          id: 'absensi', 
          label: 'Kehadiran Saya', 
          icon: <CheckSquare size={18}/>, 
          path: '/siswa/absensi' 
        },
      ]
    },
    {
      name: 'PRESTASI',
      items: [
        { 
          id: 'rapor', 
          label: 'Nilai & Raport', 
          icon: <BarChart2 size={18}/>, 
          path: '/siswa/rapor' 
        },
        { 
          id: 'smart-rapor', 
          label: 'Smart Raport', 
          icon: <TrendingUp size={18}/>, 
          path: '/siswa/smart-rapor',
          badge: 'NEW',
          badgeColor: '#10b981'
        },
        { 
          id: 'leaderboard', 
          label: 'Papan Peringkat', 
          icon: <Trophy size={18}/>, 
          path: '/siswa/leaderboard',
          badge: '🔥',
          badgeColor: '#f59e0b'
        },
      ]
    },
    {
      name: 'LAINNYA',
      items: [
        { 
          id: 'keuangan', 
          label: 'Administrasi', 
          icon: <Wallet size={18}/>, 
          path: '/siswa/keuangan' 
        },
        { 
          id: 'profil', 
          label: 'Profil Saya', 
          icon: <User size={18}/>, 
          path: '/siswa/profil' 
        },
      ]
    }
  ];

  const getBadgeStyle = (badge, badgeColor) => ({
    background: badgeColor || '#ef4444',
    color: 'white',
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
    marginLeft: '8px'
  });

  return (
    <>
      {/* Overlay Mobile */}
      {isMobile && isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          style={styles.overlay} 
        />
      )}

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        transform: isOpen || !isMobile ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        {/* Header with Logo */}
        <div style={styles.header}>
          <div style={styles.brandWrapper}>
            <img 
              src={LogoBimbel} 
              alt="Logo" 
              style={styles.logoSidebar} 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <div>
              <span style={styles.brandText}>Bimbel Gemilang</span>
              <span style={styles.brandSubtext}>Siswa Portal</span>
            </div>
          </div>
          
          {isMobile && (
            <button onClick={() => setIsOpen(false)} style={styles.closeMobileBtn}>
              <X size={20} />
            </button>
          )}
        </div>
        
        <hr style={styles.divider} />
        
        {/* Navigation */}
        <div style={styles.navContainer}>
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} style={styles.navGroup}>
              <div style={styles.groupTitle}>{group.name}</div>
              {group.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMenuClick(item.id, item.path)}
                  style={{ 
                    ...styles.menuItem,
                    background: activeMenu === item.id ? '#3b82f6' : 'transparent',
                    color: activeMenu === item.id ? 'white' : '#94a3b8'
                  }}
                >
                  <span style={styles.menuIcon}>{item.icon}</span>
                  <span style={styles.menuLabel}>{item.label}</span>
                  {item.badge && (
                    <span style={getBadgeStyle(item.badge, item.badgeColor)}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer with User Info & Logout */}
        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              <User size={16} color="#94a3b8" />
            </div>
            <div>
              <div style={styles.userName}>Siswa</div>
              <div style={styles.userRole}>Gemilang Learner</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} style={{marginRight: '8px'}}/>
            Keluar
          </button>
          <div style={styles.versionInfo}>
            <span>Version 2.0.0</span>
            <span>© 2026</span>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  sidebar: { 
    width: '280px', 
    height: '100vh', 
    background: '#1e293b', 
    color: 'white', 
    padding: '0',
    position: 'fixed', 
    left: 0, 
    top: 0, 
    zIndex: 1000,
    transition: 'transform 0.3s ease', 
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '20px',
    borderBottom: '1px solid #334155'
  },
  brandWrapper: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  },
  logoSidebar: { 
    maxHeight: '40px', 
    objectFit: 'contain' 
  },
  brandText: { 
    fontWeight: 'bold', 
    fontSize: '14px',
    display: 'block',
    color: 'white'
  },
  brandSubtext: {
    fontSize: '9px',
    color: '#94a3b8',
    display: 'block'
  },
  closeMobileBtn: { 
    background: 'none', 
    border: 'none', 
    color: 'white', 
    cursor: 'pointer',
    padding: '4px'
  },
  divider: { 
    border: '0', 
    borderTop: '1px solid #334155', 
    margin: '0 20px' 
  },
  navContainer: {
    flex: 1,
    padding: '16px 12px',
    overflowY: 'auto'
  },
  navGroup: {
    marginBottom: '20px'
  },
  groupTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '8px 12px',
    marginBottom: '4px'
  },
  menuItem: { 
    padding: '10px 12px', 
    cursor: 'pointer', 
    borderRadius: '10px', 
    marginBottom: '4px', 
    display: 'flex', 
    alignItems: 'center', 
    fontSize: '13px', 
    fontWeight: '500',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  menuIcon: {
    width: '24px',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center'
  },
  menuLabel: {
    flex: 1
  },
  footer: { 
    padding: '16px 20px', 
    borderTop: '1px solid #334155',
    background: '#0f172a'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    marginBottom: '12px'
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    background: '#334155',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'white'
  },
  userRole: {
    fontSize: '9px',
    color: '#94a3b8'
  },
  logoutBtn: { 
    width: '100%', 
    padding: '10px', 
    background: '#ef4444', 
    border: 'none', 
    color: 'white', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: '600',
    fontSize: '12px',
    transition: '0.3s',
    marginBottom: '12px'
  },
  versionInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: '#64748b'
  },
  overlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(0,0,0,0.5)', 
    zIndex: 999, 
    backdropFilter: 'blur(2px)' 
  }
};

export default SidebarSiswa;