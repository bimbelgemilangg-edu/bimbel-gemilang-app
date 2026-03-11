import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ambil data guru dari localStorage agar ANTI-BLANK
  const [guru, setGuru] = useState(() => {
    const saved = localStorage.getItem('teacherData');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!guru) {
      // Jika di local tidak ada, coba cek di state, kalau tetap tidak ada baru ke login
      const stateTeacher = location.state?.teacher;
      if (stateTeacher) {
        setGuru(stateTeacher);
        localStorage.setItem('teacherData', JSON.stringify(stateTeacher));
      } else {
        navigate('/login-guru');
      }
    }
  }, [guru, navigate, location.state]);

  const menuItems = [
    { name: 'Beranda', icon: '🏠', path: '/guru/dashboard' },
    { name: 'Input Nilai', icon: '📝', path: '/guru/grades/input' },
    { name: 'Kelola Nilai', icon: '🛠️', path: '/guru/grades/manage' },
    { name: 'Riwayat Mengajar', icon: '📜', path: '/guru/history' },
    { name: 'Absen Susulan', icon: '➕', path: '/guru/manual-absensi' },
  ];

  const handleNavigation = (path) => {
    // Navigasi tetap membawa state sebagai cadangan utama
    navigate(path, { state: { teacher: guru } });
  };

  const handleLogout = () => {
    if (window.confirm("Yakin ingin keluar?")) {
      localStorage.removeItem('teacherData');
      localStorage.removeItem('isGuruLoggedIn');
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
              cursor: 'pointer'
            }}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span style={styles.menuName}>{item.name}</span>
          </div>
        ))}
      </div>
      <div style={styles.profileBox}>
          <small style={{color:'#bdc3c7'}}>Guru Aktif:</small>
          <div style={{fontWeight:'bold', color:'#3498db', fontSize:14}}>{guru?.nama || 'Memuat...'}</div>
      </div>
      <div style={styles.logoutSection}>
        <button onClick={handleLogout} style={styles.btnLogout}>🚪 Keluar Akun</button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: { width: '250px', height: '100vh', background: '#2c3e50', color: 'white', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', zIndex: 100 },
  logoArea: { padding: '30px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoText: { margin: 0, letterSpacing: '2px', fontSize: '24px', color: '#3498db' },
  logoSub: { fontSize: '12px', color: '#bdc3c7' },
  menuContainer: { flex: 1, padding: '20px 0' },
  menuItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', transition: '0.3s' },
  icon: { marginRight: '15px' },
  menuName: { fontSize: '14px' },
  profileBox: { padding: '15px 20px', background: 'rgba(0,0,0,0.2)', margin: '10px' },
  logoutSection: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  btnLogout: { width: '100%', padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' }
};

export default Sidebar;