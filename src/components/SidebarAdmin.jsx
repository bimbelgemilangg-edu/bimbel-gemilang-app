import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Database } from 'lucide-react';

const SidebarAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

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

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: '🏠' },
    { name: 'Kelola Siswa', path: '/admin/students', icon: '👥' },
    { name: 'Kelola Guru', path: '/admin/teachers', icon: '👨‍🏫' }, 
    { name: 'Portal Siswa', path: '/admin/portal', icon: '📱' },
    { name: 'Blog & Galeri', path: '/admin/manage-blog', icon: '📰' },
    { name: 'Gaji Guru', path: '/admin/teachers/salaries', icon: '💰' },
    { name: 'Keuangan', path: '/admin/finance', icon: '💸' },
    { name: 'Jadwal', path: '/admin/schedule', icon: '📅' },
    { name: 'Laporan Rapor', path: '/admin/grades', icon: '📊' },
    { name: 'Bulk Generate Raport', path: '/admin/bulk-raport', icon: '🗄️' }, // BARU
    { name: 'Log Harian Admin', path: '/admin/daily-log', icon: '📝' },
    { name: 'Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* Tombol Hamburger */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          style={{
            position: 'fixed',
            top: '15px',
            left: isOpen ? '210px' : '15px',
            zIndex: 1100,
            background: '#2c3e50',
            color: '#f39c12',
            border: '2px solid #f39c12',
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

      {/* Overlay */}
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
            zIndex: 999
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
        <div style={styles.logoSection}>
          <h3 style={{ margin: 0, color: '#f39c12', letterSpacing: '1px' }}>ADMIN</h3>
          <p style={{ fontSize: 10, color: '#bdc3c7', margin: 0 }}>GEMILANG SYSTEM</p>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path + '/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                style={{
                  ...styles.navLink,
                  backgroundColor: isActive ? '#34495e' : 'transparent',
                  borderLeft: isActive ? '4px solid #f39c12' : '4px solid transparent',
                  color: isActive ? '#f39c12' : '#ecf0f1',
                }}
              >
                <span style={{ marginRight: 12, fontSize: '18px' }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={styles.footer}>
          <button onClick={handleLogout} style={styles.btnLogout}>
            🚪 Keluar Admin
          </button>
        </div>
      </div>
    </>
  );
};

const styles = {
  sidebar: { 
    width: '250px', 
    backgroundColor: '#2c3e50', 
    height: '100vh', 
    position: 'fixed', 
    left: 0, 
    top: 0, 
    color: 'white', 
    display: 'flex', 
    flexDirection: 'column',
    zIndex: 1000
  },
  logoSection: { padding: '30px 20px', textAlign: 'center', borderBottom: '1px solid #34495e' },
  nav: { flex: 1, padding: '20px 0', overflowY: 'auto' },
  navLink: { 
    display: 'flex', 
    alignItems: 'center', 
    padding: '15px 25px', 
    textDecoration: 'none', 
    fontSize: '14px', 
    transition: '0.2s', 
    marginBottom: '5px',
    fontWeight: '500'
  },
  footer: { padding: '20px', borderTop: '1px solid #34495e' },
  btnLogout: { 
    width: '100%', 
    padding: '12px', 
    backgroundColor: '#e74c3c', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    transition: '0.3s'
  }
};

export default SidebarAdmin;