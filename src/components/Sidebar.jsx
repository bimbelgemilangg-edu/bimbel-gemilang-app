import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.sidebar}>
      {/* HEADER LOGO */}
      <div style={styles.logo}>
        <h3 style={{margin:0, color:'#ecf0f1'}}>BIMBEL GEMILANG</h3>
        <p style={{fontSize: '12px', opacity: 0.7, margin:0, marginTop:5}}>Administrator Panel</p>
      </div>

      {/* NAV MENU (Area ini yang akan bisa discroll) */}
      <nav style={styles.nav}>
        <Link to="/admin" style={isActive('/admin') ? styles.linkActive : styles.link}>
           🏠 Dashboard
        </Link>

        {/* JADWAL */}
        <Link to="/admin/schedule" style={isActive('/admin/schedule') ? styles.linkActive : styles.link}>
           📅 Jadwal & Kelas
        </Link>

        {/* MANAJEMEN SISWA */}
        <div style={styles.sectionTitle}>SISWA</div>
        <Link to="/admin/students" style={isActive('/admin/students') ? styles.linkActive : styles.link}>
           👨‍🎓 Data Siswa
        </Link>
        <Link to="/admin/students/add" style={isActive('/admin/students/add') ? styles.linkActive : styles.link}>
           ➕ Pendaftaran Baru
        </Link>

        {/* --- MENU RAPOR & NILAI --- */}
        <Link to="/admin/grades" style={isActive('/admin/grades') ? styles.linkActive : styles.link}>
           🏆 Laporan & Rapor
        </Link>

        {/* MANAJEMEN GURU */}
        <div style={styles.sectionTitle}>GURU & HRD</div>
        <Link to="/admin/teachers" style={isActive('/admin/teachers') ? styles.linkActive : styles.link}>
           👨‍🏫 Data Guru
        </Link>
        <Link to="/admin/teachers/salaries" style={isActive('/admin/teachers/salaries') ? styles.linkActive : styles.link}>
           💰 Rekap Gaji & Slip
        </Link>

        {/* KEUANGAN */}
        <div style={styles.sectionTitle}>KEUANGAN</div>
        <Link to="/admin/finance" style={isActive('/admin/finance') ? styles.linkActive : styles.link}>
           📊 Pusat Keuangan
        </Link>
        
        {/* PENGATURAN (Ditaruh normal di bawah keuangan, tidak dipaksa ke dasar agar aman) */}
        <div style={styles.sectionTitle}>SYSTEM</div>
        <Link to="/admin/settings" style={isActive('/admin/settings') ? styles.linkActive : styles.link}>
             ⚙️ Pengaturan Pusat
        </Link>
      </nav>

      {/* FOOTER TOMBOL KELUAR (Selalu menempel di bawah) */}
      <div style={styles.footer}>
        <Link to="/" style={styles.logout} onClick={() => {
            if(window.confirm('Keluar dari Admin?')) localStorage.removeItem('isLoggedIn');
        }}>
            🚪 Keluar
        </Link>
      </div>
    </div>
  );
};

// --- CSS YANG SUDAH DIPERBAIKI (Scrollable) ---
const styles = {
  sidebar: { 
      width: '250px', 
      backgroundColor: '#2c3e50', 
      height: '100vh', /* FIX: Pakai height pas 100vh agar tidak bablas ke bawah */
      color: 'white', 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      zIndex: 100, 
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)' 
  },
  logo: { 
      padding: '20px', 
      borderBottom: '1px solid #34495e', 
      textAlign: 'center', 
      background: '#243342',
      flexShrink: 0 // Logo jangan mengecil
  },
  nav: { 
      padding: '10px 0', 
      flex: 1, 
      overflowY: 'auto', // INI KUNCINYA: Scroll otomatis jika menu kepanjangan
      scrollbarWidth: 'thin', // CSS biar scrollbar tipis (Firefox)
      msOverflowStyle: 'none' // Hide scrollbar IE
  },
  sectionTitle: { fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d', padding: '15px 20px 5px 20px', letterSpacing: '1px' },
  link: { display: 'block', padding: '10px 20px', color: '#bdc3c7', textDecoration: 'none', transition: '0.3s', fontSize: '14px' },
  linkActive: { display: 'block', padding: '10px 20px', backgroundColor: '#34495e', color: 'white', textDecoration: 'none', borderLeft: '4px solid #3498db', fontWeight: 'bold' },
  footer: { 
      padding: '15px 20px', 
      borderTop: '1px solid #34495e', 
      background: '#243342',
      flexShrink: 0 // Footer jangan mengecil/hilang
  },
  logout: { color: '#e74c3c', textDecoration: 'none', fontWeight: 'bold', display:'block', textAlign:'center', padding:10, border:'1px solid #e74c3c', borderRadius:5, fontSize:'14px' }
};

export default Sidebar;