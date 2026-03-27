import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarGuru = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const guru = JSON.parse(localStorage.getItem('teacherData'));

  const menuItems = [
    { name: 'Beranda Guru', icon: '🏠', path: '/guru/dashboard' },
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
    <div style={{...styles.sidebar, background: '#1a252f'}}>
      <div style={styles.logoArea}>
        <h2 style={{...styles.logoText, color: '#3498db'}}>GURU</h2>
        <span style={styles.logoSub}>PORTAL PENGAJAR</span>
      </div>
      <div style={styles.profileBox}>
        <small>Pengajar Aktif:</small>
        <div style={{fontWeight:'bold'}}>{guru?.nama || 'Guru'}</div>
      </div>
      <div style={styles.menuContainer}>
        {menuItems.map((item) => (
          <div key={item.path} onClick={() => navigate(item.path)}
            style={{...styles.menuItem, backgroundColor: location.pathname.includes(item.path) ? '#2c3e50' : 'transparent'}}>
            <span>{item.icon}</span> <span style={{marginLeft:15}}>{item.name}</span>
          </div>
        ))}
      </div>
      <div style={styles.logoutSection}>
        <button onClick={handleLogout} style={styles.btnLogout}>🚪 Keluar</button>
      </div>
    </div>
  );
};

// Gunakan styles yang mirip dengan Admin tapi bisa bedakan warna sedikit
const styles = { /* ... sama dengan admin ... */ };
styles.profileBox = { padding: '15px 20px', background: 'rgba(52, 152, 219, 0.2)', margin: '10px', borderRadius: '5px' };

export default SidebarGuru;