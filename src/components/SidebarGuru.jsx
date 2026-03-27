import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarGuru = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const guru = JSON.parse(localStorage.getItem('teacherData'));

  // KITA TAMBAHKAN MENU MODUL DI SINI
  const menuItems = [
    { name: 'Beranda Guru', icon: '🏠', path: '/guru/dashboard' },
    { name: 'Kelola Modul (E-Learn)', icon: '📚', path: '/guru/modul' }, // MENU BARU
    { name: 'Input Nilai', icon: '📝', path: '/guru/grades/input' },
    { name: 'Absen Susulan', icon: '➕', path: '/guru/manual-absensi' },
  ];

  const handleLogout = () => {
    if (window.confirm("Guru ingin keluar?")) {
      localStorage.removeItem('teacherData');
      navigate('/login-guru');
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoArea}>
        <h2 style={{...styles.logoText, color: '#3498db'}}>GURU</h2>
        <span style={styles.logoSub}>PORTAL PENGAJAR</span>
      </div>
      
      <div style={styles.profileBox}>
        <small>Pengajar Aktif:</small>
        <div style={{fontWeight:'bold'}}>{guru?.nama || 'Guru Gemilang'}</div>
      </div>

      <div style={styles.menuContainer}>
        {menuItems.map((item) => (
          <div key={item.path} onClick={() => navigate(item.path)}
            style={{
              ...styles.menuItem, 
              backgroundColor: location.pathname === item.path ? '#34495e' : 'transparent',
              borderLeft: location.pathname === item.path ? '4px solid #3498db' : '4px solid transparent'
            }}>
            <span style={{fontSize: '20px'}}>{item.icon}</span> 
            <span style={{marginLeft:15, fontWeight: location.pathname === item.path ? 'bold' : 'normal'}}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.logoutSection}>
        <button onClick={handleLogout} style={styles.btnLogout}>🚪 Keluar</button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: { width: '260px', height: '100vh', background: '#1a252f', color: 'white', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column' },
  logoArea: { padding: '30px 20px', textAlign: 'center', borderBottom: '1px solid #2c3e50' },
  logoText: { margin: 0, fontSize: '24px', letterSpacing: '2px' },
  logoSub: { fontSize: '10px', opacity: 0.6 },
  profileBox: { padding: '15px 20px', background: 'rgba(52, 152, 219, 0.15)', margin: '15px', borderRadius: '10px', border: '1px solid rgba(52,152,219,0.3)' },
  menuContainer: { flex: 1, padding: '10px 0' },
  menuItem: { padding: '15px 25px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: '0.2s', color: '#ecf0f1' },
  logoutSection: { padding: '20px', borderTop: '1px solid #2c3e50' },
  btnLogout: { width: '100%', padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default SidebarGuru;