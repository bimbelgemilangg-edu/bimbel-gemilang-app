import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <h3>GEMILANG SYSTEM</h3>
        <p style={{fontSize: '12px', opacity: 0.7}}>Admin Panel</p>
      </div>

      <nav style={styles.nav}>
        {/* 1. Dashboard (JADWAL ADA DISINI SEKARANG) */}
        <Link to="/admin" style={isActive('/admin') ? styles.linkActive : styles.link}>
           🏠 Dashboard & Jadwal
        </Link>
        
        {/* 2. Siswa */}
        <Link to="/admin/students" style={isActive('/admin/students') ? styles.linkActive : styles.link}>
           👨‍🎓 Manajemen Siswa
        </Link>
        
        <Link to="/admin/students/add" style={isActive('/admin/students/add') ? styles.linkActive : styles.link}>
           ➕ Pendaftaran Baru
        </Link>

        {/* 3. Guru */}
        <Link to="/admin/teachers" style={isActive('/admin/teachers') ? styles.linkActive : styles.link}>
           👨‍🏫 Manajemen Guru
        </Link>
        
        {/* 4. Keuangan */}
        <Link to="/admin/finance" style={isActive('/admin/finance') ? styles.linkActive : styles.link}>
           💰 Keuangan & Kasir
        </Link>
      </nav>

      <div style={styles.footer}>
        <Link to="/" style={styles.logout}>Keluar</Link>
      </div>
    </div>
  );
};

const styles = {
  sidebar: { width: '250px', backgroundColor: '#2c3e50', minHeight: '100vh', color: 'white', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', zIndex: 100 },
  logo: { padding: '20px', borderBottom: '1px solid #34495e', textAlign: 'center' },
  nav: { padding: '20px 0', flex: 1 },
  link: { display: 'block', padding: '15px 20px', color: '#bdc3c7', textDecoration: 'none', transition: '0.3s' },
  linkActive: { display: 'block', padding: '15px 20px', backgroundColor: '#34495e', color: 'white', textDecoration: 'none', borderLeft: '4px solid #3498db' },
  footer: { padding: '20px', borderTop: '1px solid #34495e' },
  logout: { color: '#e74c3c', textDecoration: 'none', fontWeight: 'bold' }
};

export default Sidebar;