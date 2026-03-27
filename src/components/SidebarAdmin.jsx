import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
    { name: 'Kelola Siswa', icon: '👥', path: '/admin/students' },
    { name: 'Keuangan', icon: '💰', path: '/admin/finance' },
    { name: 'Laporan Rapor', icon: '📊', path: '/admin/reports' },
  ];

  const handleLogout = () => {
    if (window.confirm("Keluar dari Panel Admin?")) {
      localStorage.removeItem('adminData');
      localStorage.removeItem('role');
      navigate('/login-admin'); // Sesuaikan rute login adminmu
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoArea}>
        <h2 style={styles.logoText}>ADMIN</h2>
        <span style={styles.logoSub}>GEMILANG SYSTEM</span>
      </div>
      <div style={styles.menuContainer}>
        {menuItems.map((item) => (
          <div key={item.path} onClick={() => navigate(item.path)}
            style={{...styles.menuItem, backgroundColor: location.pathname.includes(item.path) ? '#34495e' : 'transparent'}}>
            <span>{item.icon}</span> <span style={{marginLeft:15}}>{item.name}</span>
          </div>
        ))}
      </div>
      <div style={styles.logoutSection}>
        <button onClick={handleLogout} style={styles.btnLogout}>🚪 Keluar Admin</button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: { width: '250px', height: '100vh', background: '#2c3e50', color: 'white', position: 'fixed', display: 'flex', flexDirection: 'column' },
  logoArea: { padding: '30px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign:'center' },
  logoText: { margin: 0, color: '#e67e22' },
  logoSub: { fontSize: '10px' },
  menuContainer: { flex: 1, padding: '20px 0' },
  menuItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', transition: '0.3s' },
  logoutSection: { padding: '20px' },
  btnLogout: { width: '100%', padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default SidebarAdmin;