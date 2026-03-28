import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, User, BookOpen, Edit, 
  History, Calendar, ClipboardCheck, FileBarChart, LogOut 
} from 'lucide-react';

const SidebarGuru = () => {
  const location = useLocation();

  const menu = [
    { name: 'Dashboard', path: '/guru/dashboard', icon: <LayoutDashboard size={20}/> },
    { name: 'E-Learning', path: '/guru/modul', icon: <BookOpen size={20}/> },
    { name: 'Jadwal Mengajar', path: '/guru/schedule', icon: <Calendar size={20}/> },
    { name: 'Absensi Siswa', path: '/guru/attendance', icon: <ClipboardCheck size={20}/> },
    { name: 'Input Nilai / Rapor', path: '/guru/grades/input', icon: <Edit size={20}/> },
    { name: 'Riwayat Sesi', path: '/guru/history', icon: <History size={20}/> },
    { name: 'Profil Saya', path: '/guru/profile', icon: <User size={20}/> },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoArea}>
        <div style={{background:'#f1c40f', padding:5, borderRadius:8}}>
           <img src="/logo-gemilang.png.png" alt="Logo" style={{ width: '30px' }} />
        </div>
        <h3 style={{ color: 'white', margin: 0, fontSize: 18 }}>GEMILANG <span style={{color:'#f1c40f'}}>EDU</span></h3>
      </div>
      
      <nav style={styles.nav}>
        {menu.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{
                ...styles.navItem,
                background: isActive ? 'rgba(241, 196, 15, 0.15)' : 'transparent',
                borderLeft: isActive ? '4px solid #f1c40f' : '4px solid transparent',
                color: isActive ? '#f1c40f' : '#bdc3c7'
              }}
            >
              {item.icon}
              <span style={{fontWeight: isActive ? '600' : '400'}}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <button onClick={() => { localStorage.clear(); window.location.href = '/login-guru'; }} style={styles.logoutBtn}>
        <LogOut size={18} /> Keluar Sistem
      </button>
    </div>
  );
};

const styles = {
  sidebar: { width: '260px', background: '#1a252f', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100 },
  logoArea: { padding: '30px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  nav: { flex: 1, padding: '20px 0', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', textDecoration: 'none', fontSize: '14px', transition: '0.2s' },
  logoutBtn: { margin: '20px', padding: '12px', background: '#c0392b', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', borderRadius: '8px' }
};

export default SidebarGuru;