import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const SidebarAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Keluar dari Dashboard Admin?")) {
      localStorage.clear();
      navigate('/');
    }
  };

  // DAFTAR MENU LENGKAP (Telah disinkronkan dengan App.jsx)
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: '🏠' },
    { name: 'Kelola Siswa', path: '/admin/students', icon: '👥' },
    { name: 'Kelola Guru', path: '/admin/teachers', icon: '👨‍🏫' }, 
    { name: 'Gaji Guru', path: '/admin/teachers/salaries', icon: '💰' }, // Menu Gaji Baru
    { name: 'Keuangan', path: '/admin/finance', icon: '💸' },
    { name: 'Jadwal', path: '/admin/schedule', icon: '📅' },
    { name: 'Laporan Rapor', path: '/admin/grades', icon: '📊' },
    { name: 'Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoSection}>
        <h3 style={{ margin: 0, color: '#f39c12', letterSpacing: '1px' }}>ADMIN</h3>
        <p style={{ fontSize: 10, color: '#bdc3c7', margin: 0 }}>GEMILANG SYSTEM</p>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          // Logika isActive untuk mendeteksi menu yang sedang dibuka
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    zIndex: 100
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