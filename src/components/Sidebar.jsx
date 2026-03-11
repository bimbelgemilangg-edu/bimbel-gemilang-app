import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mengambil data guru dari state lokasi saat ini
  const guru = location.state?.teacher;

  const menuItems = [
    { 
      name: 'Beranda', 
      icon: '🏠', 
      path: '/guru/dashboard' 
    },
    { 
      name: 'Input Nilai', 
      icon: '📝', 
      path: '/guru/grades/input' 
    },
    { 
      name: 'Kelola Nilai', 
      icon: '🛠️', 
      path: '/guru/grades/manage' 
    },
    { 
      name: 'Riwayat Mengajar', 
      icon: '📜', 
      path: '/guru/history' 
    },
    { 
      name: 'Absen Susulan', 
      icon: '➕', 
      path: '/guru/manual-absensi' 
    },
  ];

  const handleNavigation = (path) => {
    // Navigasi dengan membawa state guru agar tidak kepental ke login
    navigate(path, { state: { teacher: guru } });
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      navigate('/login-guru');
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoArea}>
        <h2 style={styles.logoText}>BIMBEL</h2>
        <span style={styles.logoSub}>GEMILANG</span>
      </div>

      <div style={styles.menuContainer}>
        {menuItems.map((item) => (
          <div
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            style={{
              ...styles.menuItem,
              backgroundColor: location.pathname === item.path ? '#34495e' : 'transparent',
              borderLeft: location.pathname === item.path ? '4px solid #3498db' : '4px solid transparent',
            }}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span style={styles.menuName}>{item.name}</span>
          </div>
        ))}
      </div>

      <div style={styles.logoutSection}>
        <button onClick={handleLogout} style={styles.btnLogout}>
          🚪 Keluar Akun
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '250px',
    height: '100vh',
    background: '#2c3e50',
    color: 'white',
    position: 'fixed',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
    zIndex: 100
  },
  logoArea: {
    padding: '30px 20px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  logoText: {
    margin: 0,
    letterSpacing: '2px',
    fontSize: '24px',
    color: '#3498db'
  },
  logoSub: {
    fontSize: '12px',
    color: '#bdc3c7'
  },
  menuContainer: {
    flex: 1,
    padding: '20px 0'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    cursor: 'pointer',
    transition: '0.3s',
    marginBottom: '5px'
  },
  icon: {
    marginRight: '15px',
    fontSize: '18px'
  },
  menuName: {
    fontSize: '14px',
    fontWeight: '500'
  },
  logoutSection: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  btnLogout: {
    width: '100%',
    padding: '12px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: '0.3s'
  }
};

export default Sidebar;