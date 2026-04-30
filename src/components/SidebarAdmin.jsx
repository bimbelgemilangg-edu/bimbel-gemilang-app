import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Users, UserCog, Megaphone, 
  Newspaper, DollarSign, Calendar, BarChart3, Database, 
  FileText, Settings, LogOut, CreditCard, BookOpen, 
  ClipboardList, Image, HelpCircle, TrendingUp, Award,
  School, Mail, Phone, MapPin, Clock, CheckSquare, 
  Target, PieChart, Shield, Bell, Star, Gift, Coffee,
  Home, Folder, File, Grid, Layers, List, PlusCircle,
  Edit3, Trash2, Eye, Upload, Download, RefreshCw
} from 'lucide-react';

const SidebarAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  // Menu structure with submenus
  const menuGroups = [
    {
      name: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18}/> },
      ]
    },
    {
      name: 'MANAJEMEN',
      items: [
        { name: 'Kelola Siswa', path: '/admin/students', icon: <Users size={18}/> },
        { name: 'Kelola Guru', path: '/admin/teachers', icon: <UserCog size={18}/> },
      ]
    },
    {
      name: 'AKADEMIK',
      items: [
        { 
          name: 'Portal Siswa', 
          icon: <School size={18}/>,
          submenus: [
            { name: 'Dashboard Portal', path: '/admin/portal', icon: <Home size={14}/> },
            { name: 'Kelola Materi', path: '/admin/portal/manage-materi', icon: <BookOpen size={14}/> },
            { name: 'Kelola Poster', path: '/admin/portal/poster', icon: <Image size={14}/> },
            { name: 'Kelola Survey', path: '/admin/portal/survey', icon: <ClipboardList size={14}/> },
            { name: 'Kelola Pengumuman', path: '/admin/portal/pengumuman', icon: <Megaphone size={14}/> },
            { name: 'Kelola Keuangan Portal', path: '/admin/portal/finance', icon: <CreditCard size={14}/> },
          ]
        },
        { 
          name: 'Manajemen Jadwal', 
          icon: <Calendar size={18}/>,
          submenus: [
            { name: 'Jadwal Mengajar', path: '/admin/schedule', icon: <Clock size={14}/> },
            { name: 'Jadwal Guru', path: '/admin/teachers/schedule', icon: <UserCog size={14}/> },
          ]
        },
        { 
          name: 'Laporan Rapor', 
          icon: <BarChart3 size={18}/>,
          submenus: [
            { name: 'Grade Report', path: '/admin/grades', icon: <FileText size={14}/> },
            { name: 'Bulk Generate Raport', path: '/admin/bulk-raport', icon: <Database size={14}/> },
          ]
        },
      ]
    },
    {
      name: 'KEUANGAN',
      items: [
        { 
          name: 'Keuangan', 
          icon: <DollarSign size={18}/>,
          submenus: [
            { name: 'Dashboard Keuangan', path: '/admin/finance/dashboard', icon: <PieChart size={14}/> },
            { name: 'Pemasukan', path: '/admin/finance/income', icon: <TrendingUp size={14}/> },
            { name: 'Pengeluaran', path: '/admin/finance/expense', icon: <TrendingUp size={14}/> },
            { name: 'Hutang/Piutang', path: '/admin/finance/debt', icon: <CreditCard size={14}/> },
            { name: 'History Transaksi', path: '/admin/finance/history', icon: <List size={14}/> },
          ]
        },
        { name: 'Gaji Guru', path: '/admin/teachers/salaries', icon: <Award size={18}/> },
      ]
    },
    {
      name: 'KONTEN & BLOG',
      items: [
        { name: 'Blog & Galeri', path: '/admin/manage-blog', icon: <Newspaper size={18}/> },
      ]
    },
    {
      name: 'PENGATURAN',
      items: [
        { name: 'Log Harian Admin', path: '/admin/daily-log', icon: <FileText size={18}/> },
        { name: 'Settings', path: '/admin/settings', icon: <Settings size={18}/> },
      ]
    }
  ];

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isSubmenuActive = (submenus) => {
    if (!submenus) return false;
    return submenus.some(sub => isActive(sub.path));
  };

  return (
    <>
      {/* Tombol Hamburger Mobile */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          style={{
            position: 'fixed',
            top: '15px',
            left: isOpen ? '210px' : '15px',
            zIndex: 1100,
            background: '#1e293b',
            color: '#f59e0b',
            border: '2px solid #f59e0b',
            borderRadius: '10px',
            padding: '8px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'left 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* Overlay Mobile */}
      {isOpen && isMobile && (
        <div 
          onClick={() => setIsOpen(false)} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 998
          }} 
        />
      )}

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        boxShadow: isOpen ? '10px 0 30px rgba(0,0,0,0.3)' : 'none',
        transition: 'transform 0.3s ease, boxShadow 0.3s ease'
      }}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoIcon}>
              <School size={24} color="#f59e0b" />
            </div>
            <div>
              <h3 style={styles.logoText}>BIMBEL <span style={{color: '#f59e0b'}}>GEMILANG</span></h3>
              <p style={styles.logoSubtext}>Admin Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} style={styles.navGroup}>
              <div style={styles.groupTitle}>{group.name}</div>
              {group.items.map((item, itemIdx) => (
                <div key={itemIdx}>
                  {item.submenus ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        style={{
                          ...styles.navButton,
                          backgroundColor: isSubmenuActive(item.submenus) ? '#334155' : 'transparent',
                          color: isSubmenuActive(item.submenus) ? '#f59e0b' : '#cbd5e1',
                          borderLeft: isSubmenuActive(item.submenus) ? '3px solid #f59e0b' : '3px solid transparent',
                        }}
                      >
                        <span style={styles.navIcon}>{item.icon}</span>
                        <span style={styles.navLabel}>{item.name}</span>
                        <span style={styles.navArrow}>
                          {expandedMenus[item.name] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </button>
                      {expandedMenus[item.name] && (
                        <div style={styles.submenuContainer}>
                          {item.submenus.map((sub, subIdx) => (
                            <Link
                              key={subIdx}
                              to={sub.path}
                              onClick={handleLinkClick}
                              style={{
                                ...styles.submenuLink,
                                backgroundColor: isActive(sub.path) ? '#334155' : 'transparent',
                                color: isActive(sub.path) ? '#f59e0b' : '#94a3b8',
                                borderLeft: isActive(sub.path) ? '3px solid #f59e0b' : '3px solid transparent',
                              }}
                            >
                              <span style={styles.submenuIcon}>{sub.icon}</span>
                              <span style={styles.submenuLabel}>{sub.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      style={{
                        ...styles.navLink,
                        backgroundColor: isActive(item.path) ? '#334155' : 'transparent',
                        color: isActive(item.path) ? '#f59e0b' : '#cbd5e1',
                        borderLeft: isActive(item.path) ? '3px solid #f59e0b' : '3px solid transparent',
                      }}
                    >
                      <span style={styles.navIcon}>{item.icon}</span>
                      <span style={styles.navLabel}>{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.versionInfo}>
            <span>Version 2.0.0</span>
            <span>© 2026 Gemilang Edu</span>
          </div>
          <button onClick={handleLogout} style={styles.btnLogout}>
            <LogOut size={16} style={{marginRight: '8px'}}/>
            Keluar Admin
          </button>
        </div>
      </div>
    </>
  );
};

const styles = {
  sidebar: { 
    width: '280px', 
    backgroundColor: '#1e293b', 
    height: '100vh', 
    position: 'fixed', 
    left: 0, 
    top: 0, 
    color: 'white', 
    display: 'flex', 
    flexDirection: 'column',
    zIndex: 1000,
    overflowY: 'auto'
  },
  logoSection: { 
    padding: '20px 20px', 
    borderBottom: '1px solid #334155',
    marginBottom: '10px'
  },
  logoWrapper: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px'
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    background: '#334155',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: { 
    margin: 0, 
    fontSize: '14px', 
    fontWeight: '800', 
    letterSpacing: '1px',
    color: 'white'
  },
  logoSubtext: { 
    fontSize: '9px', 
    color: '#94a3b8', 
    margin: '2px 0 0 0'
  },
  nav: { 
    flex: 1, 
    padding: '0 12px', 
    overflowY: 'auto'
  },
  navGroup: {
    marginBottom: '16px'
  },
  groupTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '8px 12px',
    marginTop: '8px'
  },
  navLink: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    padding: '10px 12px', 
    textDecoration: 'none', 
    fontSize: '13px', 
    transition: '0.2s', 
    marginBottom: '2px',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  navButton: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    padding: '10px 12px', 
    textDecoration: 'none', 
    fontSize: '13px', 
    transition: '0.2s', 
    marginBottom: '2px',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    background: 'none',
    border: 'none',
    textAlign: 'left'
  },
  navIcon: { 
    width: '20px',
    display: 'flex',
    alignItems: 'center'
  },
  navLabel: { 
    flex: 1
  },
  navArrow: {
    color: '#64748b'
  },
  submenuContainer: {
    paddingLeft: '32px',
    marginBottom: '4px'
  },
  submenuLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    textDecoration: 'none',
    fontSize: '12px',
    transition: '0.2s',
    borderRadius: '6px',
    marginBottom: '2px',
    cursor: 'pointer'
  },
  submenuIcon: {
    width: '16px',
    display: 'flex',
    alignItems: 'center'
  },
  submenuLabel: {
    flex: 1
  },
  footer: { 
    padding: '16px', 
    borderTop: '1px solid #334155',
    marginTop: 'auto'
  },
  versionInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: '#64748b',
    marginBottom: '12px'
  },
  btnLogout: { 
    width: '100%', 
    padding: '10px', 
    backgroundColor: '#ef4444', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.3s'
  }
};

// Import tambahan yang diperlukan untuk icons
const ChevronDown = ({ size, color }) => <span style={{ fontSize: size }}>▼</span>;
const ChevronUp = ({ size, color }) => <span style={{ fontSize: size }}>▲</span>;

export default SidebarAdmin;