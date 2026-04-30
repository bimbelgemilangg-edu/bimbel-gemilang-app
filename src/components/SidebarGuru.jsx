import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, User, BookOpen, Edit, 
  History, Calendar, ClipboardCheck, LogOut, Database, 
  FileText, HelpCircle, Clock, Users, CheckSquare,
  Award, TrendingUp, BarChart3, Settings, Bell,
  Home, Folder, File, Grid, Layers, List, PlusCircle,
  Star, Gift, Coffee, Target, PieChart, Shield
} from 'lucide-react';

const SidebarGuru = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobileView(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const closeSidebar = () => {
    if (isMobileView) setIsMobileOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm("Keluar dari Dashboard Guru?")) {
      localStorage.clear();
      navigate('/login-guru');
    }
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isSubmenuActive = (submenus) => {
    if (!submenus) return false;
    return submenus.some(sub => isActive(sub.path));
  };

  // Menu structure with submenus
  const menuGroups = [
    {
      name: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/guru/dashboard', icon: <LayoutDashboard size={18}/> },
        { name: 'Profil Saya', path: '/guru/profile', icon: <User size={18}/> },
      ]
    },
    {
      name: 'PEMBELAJARAN',
      items: [
        { 
          name: 'E-Learning', 
          icon: <BookOpen size={18}/>,
          submenus: [
            { name: 'Kelola Modul', path: '/guru/modul', icon: <Folder size={14}/> },
            { name: 'Buat Modul Baru', path: '/guru/modul/materi', icon: <PlusCircle size={14}/> },
            { name: 'Buat Kuis', path: '/guru/manage-quiz', icon: <HelpCircle size={14}/> },
            { name: 'Buat Tugas', path: '/guru/manage-tugas', icon: <FileText size={14}/> },
          ]
        },
        { 
          name: 'Penilaian', 
          icon: <Edit size={18}/>,
          submenus: [
            { name: 'Input Nilai', path: '/guru/grades/input', icon: <Edit size={14}/> },
            { name: 'Riwayat Nilai', path: '/guru/grades/manage', icon: <History size={14}/> },
            { name: 'Generate Raport', path: '/guru/generate-raport', icon: <Database size={14}/> },
          ]
        },
        { 
          name: 'Pemeriksaan', 
          icon: <ClipboardCheck size={18}/>,
          submenus: [
            { name: 'Cek Tugas Siswa', path: '/guru/cek-tugas', icon: <FileText size={14}/> },
            { name: 'Nilai Kuis Otomatis', path: '/guru/cek-tugas?tab=kuis', icon: <HelpCircle size={14}/> },
          ]
        },
      ]
    },
    {
      name: 'OPERASIONAL',
      items: [
        { 
          name: 'Jadwal & Absensi', 
          icon: <Calendar size={18}/>,
          submenus: [
            { name: 'Jadwal Mengajar', path: '/guru/schedule', icon: <Calendar size={14}/> },
            { name: 'Absensi Siswa', path: '/guru/attendance', icon: <ClipboardCheck size={14}/> },
            { name: 'Input Manual', path: '/guru/manual-input', icon: <Edit size={14}/> },
            { name: 'Class Session', path: '/guru/class-session', icon: <Users size={14}/> },
          ]
        },
        { name: 'Riwayat Sesi', path: '/guru/history', icon: <History size={18}/> },
      ]
    },
    {
      name: 'LAINNYA',
      items: [
        { name: 'Pengaturan', path: '/guru/settings', icon: <Settings size={18}/> },
      ]
    }
  ];

  return (
    <>
      {/* Tombol Hamburger Mobile */}
      {isMobileView && (
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)} 
          style={{
            position: 'fixed',
            top: '15px',
            left: isMobileOpen ? '210px' : '15px',
            zIndex: 1100,
            background: '#1a252f',
            color: '#f1c40f',
            border: '2px solid #f1c40f',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'left 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* Overlay Mobile */}
      {isMobileOpen && isMobileView && (
        <div 
          onClick={() => setIsMobileOpen(false)} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 999
          }} 
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: '#1a252f',
        color: 'white',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        transform: isMobileView ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        boxShadow: isMobileOpen ? '10px 0 30px rgba(0,0,0,0.3)' : 'none',
        transition: 'transform 0.3s ease-in-out, boxShadow 0.3s ease',
        overflowY: 'auto'
      }}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoIcon}>
              <BookOpen size={22} color="#f1c40f" />
            </div>
            <div>
              <h3 style={styles.logoText}>GEMILANG <span style={{color: '#f1c40f'}}>EDU</span></h3>
              <p style={styles.logoSubtext}>Portal Guru</p>
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
                          backgroundColor: isSubmenuActive(item.submenus) ? 'rgba(241, 196, 15, 0.15)' : 'transparent',
                          color: isSubmenuActive(item.submenus) ? '#f1c40f' : '#bdc3c7',
                          borderLeft: isSubmenuActive(item.submenus) ? '3px solid #f1c40f' : '3px solid transparent',
                        }}
                      >
                        <span style={styles.navIcon}>{item.icon}</span>
                        <span style={styles.navLabel}>{item.name}</span>
                        <span style={styles.navArrow}>
                          {expandedMenus[item.name] ? '▲' : '▼'}
                        </span>
                      </button>
                      {expandedMenus[item.name] && (
                        <div style={styles.submenuContainer}>
                          {item.submenus.map((sub, subIdx) => (
                            <Link
                              key={subIdx}
                              to={sub.path}
                              onClick={closeSidebar}
                              style={{
                                ...styles.submenuLink,
                                backgroundColor: isActive(sub.path) ? 'rgba(241, 196, 15, 0.15)' : 'transparent',
                                color: isActive(sub.path) ? '#f1c40f' : '#94a3b8',
                                borderLeft: isActive(sub.path) ? '3px solid #f1c40f' : '3px solid transparent',
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
                      onClick={closeSidebar}
                      style={{
                        ...styles.navLink,
                        backgroundColor: isActive(item.path) ? 'rgba(241, 196, 15, 0.15)' : 'transparent',
                        color: isActive(item.path) ? '#f1c40f' : '#bdc3c7',
                        borderLeft: isActive(item.path) ? '3px solid #f1c40f' : '3px solid transparent',
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
            <span>Guru Panel</span>
          </div>
          <button onClick={handleLogout} style={styles.btnLogout}>
            <LogOut size={16} style={{marginRight: '8px'}}/>
            Keluar Sistem
          </button>
        </div>
      </div>
    </>
  );
};

const styles = {
  logoSection: { 
    padding: '24px 20px', 
    borderBottom: '1px solid rgba(255,255,255,0.05)',
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
    background: 'rgba(241, 196, 15, 0.15)',
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
    marginBottom: '20px'
  },
  groupTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '8px 12px',
    marginTop: '4px'
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
    color: '#64748b',
    fontSize: '10px'
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
    borderTop: '1px solid rgba(255,255,255,0.05)',
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
    backgroundColor: '#c0392b', 
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

export default SidebarGuru;