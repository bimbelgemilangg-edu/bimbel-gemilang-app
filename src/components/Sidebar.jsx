import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. Deteksi Role dan Data User
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'guru');
  const [userData, setUserData] = useState(() => {
    const savedGuru = localStorage.getItem('teacherData');
    const savedAdmin = localStorage.getItem('adminData');
    return savedGuru ? JSON.parse(savedGuru) : (savedAdmin ? JSON.parse(savedAdmin) : null);
  });

  // 2. Definisi Menu Berdasarkan Role
  const adminMenu = [
    { name: 'Beranda Admin', icon: '🏠', path: '/admin/dashboard' },
    { name: 'Kelola Siswa', icon: '👥', path: '/admin/students' },
    { name: 'Keuangan', icon: '💰', path: '/admin/finance' },
    { name: 'Laporan Rapor', icon: '📊', path: '/admin/reports' },
  ];

  const guruMenu = [
    { name: 'Beranda Guru', icon: '🏠', path: '/guru/dashboard' },
    { name: 'Input Nilai', icon: '📝', path: '/guru/grades/input' },
    { name: 'Kelola Nilai', icon: '🛠️', path: '/guru/grades/manage' },
    { name: 'Riwayat Mengajar', icon: '📜', path: '/guru/history' },
    { name: 'Absen Susulan', icon: '➕', path: '/guru/manual-absensi' },
  ];

  // Pilih menu mana yang mau ditampilkan
  const currentMenu = userRole === 'admin' ? adminMenu : guruMenu;

  const handleLogout = () => {
    if (window.confirm("Yakin ingin keluar?")) {
      localStorage.clear(); // Bersihkan SEMUA agar tidak kecantol lagi
      navigate('/login'); // Arahkan ke halaman login utama
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoArea}>
        <h2 style={styles.logoText}>BIMBEL</h2>
        <span style={styles.logoSub}>GEMILANG</span>
      </div>

      <div style={styles.menuContainer}>
        {currentMenu.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
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

      {/* Identitas User yang Dinamis */}
      <div style={styles.profileBox}>
          <small style={{color:'#bdc3c7'}}>{userRole === 'admin' ? 'Admin Aktif:' : 'Guru Aktif:'}</small>
          <div style={{fontWeight:'bold', color:'#3498db', fontSize:14}}>
            {userRole === 'admin' ? 'Super Admin' : (userData?.nama || 'Pengajar')}
          </div>
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
  menuContainer: { flex: 1, padding: '20px 0', overflowY: 'auto' },
  menuItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', transition: '0.3s' },
  icon: { marginRight: '15px' },
  menuName: { fontSize: '14px' },
  profileBox: { padding: '15px 20px', background: 'rgba(0,0,0,0.2)', margin: '10px', borderRadius: '8px' },
  logoutSection: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  btnLogout: { width: '100%', padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' }
};

export default Sidebar;