import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, User, BookOpen, Edit, 
  History, FileSpreadsheet, LogOut 
} from 'lucide-react';

const SidebarGuru = () => {
  const location = useLocation();

  const menu = [
    { name: 'Dashboard', path: '/guru/dashboard', icon: <LayoutDashboard size={20}/> },
    { name: 'E-Learning', path: '/guru/modul', icon: <BookOpen size={20}/> }, // INI KONEKSINYA
    { name: 'Profil', path: '/guru/profile', icon: <User size={20}/> },
    { name: 'Input Nilai', path: '/guru/grades/input', icon: <Edit size={20}/> },
    { name: 'Riwayat', path: '/guru/history', icon: <History size={20}/> },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoArea}>
        <img src="/logo-gemilang.png.png" alt="Logo" style={{ width: '40px' }} />
        <h3 style={{ color: 'white', margin: 0 }}>GEMILANG <span style={{color:'#f1c40f'}}>EDU</span></h3>
      </div>
      
      <nav style={styles.nav}>
        {menu.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            style={{
              ...styles.navItem,
              background: location.pathname === item.path ? '#34495e' : 'transparent',
              borderLeft: location.pathname === item.path ? '4px solid #f1c40f' : '4px solid transparent'
            }}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <button onClick={() => { localStorage.clear(); window.location.href = '/login-guru'; }} style={styles.logoutBtn}>
        <LogOut size={20} /> Keluar
      </button>
    </div>
  );
};

const styles = {
  sidebar: { width: '260px', background: '#2c3e50', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed' },
  logoArea: { padding: '30px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #34495e' },
  nav: { flex: 1, padding: '20px 0' },
  navItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'white', textDecoration: 'none', fontSize: '14px', transition: '0.3s' },
  logoutBtn: { padding: '20px', background: '#e74c3c', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }
};

export default SidebarGuru;