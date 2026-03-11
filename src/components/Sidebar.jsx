import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // CEK SIAPA YANG LOGIN (Admin atau Guru)
  const isAdmin = localStorage.getItem('isLoggedIn') === 'true'; 
  const isGuru = localStorage.getItem('isGuruLoggedIn') === 'true';

  return (
    <div style={styles.sidebar}>
      {/* HEADER LOGO */}
      <div style={styles.logo}>
        <h3 style={{margin:0, color:'#ecf0f1'}}>BIMBEL GEMILANG</h3>
        <p style={{fontSize: '11px', opacity: 0.7, margin:0, marginTop:5}}>
            {isAdmin ? "ADMINISTRATOR PANEL" : "TEACHER PORTAL"}
        </p>
      </div>

      {/* NAV MENU (Scrollable) */}
      <nav style={styles.nav}>
        {/* --- MENU KHUSUS ADMIN --- */}
        {isAdmin && (
          <>
            <Link to="/admin" style={isActive('/admin') ? styles.linkActive : styles.link}>🏠 Dashboard</Link>
            <Link to="/admin/schedule" style={isActive('/admin/schedule') ? styles.linkActive : styles.link}>📅 Jadwal & Kelas</Link>
            
            <div style={styles.sectionTitle}>SISWA</div>
            <Link to="/admin/students" style={isActive('/admin/students') ? styles.linkActive : styles.link}>👨‍🎓 Data Siswa</Link>
            <Link to="/admin/students/add" style={isActive('/admin/students/add') ? styles.linkActive : styles.link}>➕ Pendaftaran Baru</Link>

            <Link to="/admin/grades" style={isActive('/admin/grades') ? styles.linkActive : styles.link}>🏆 Laporan & Rapor</Link>

            <div style={styles.sectionTitle}>GURU & HRD</div>
            <Link to="/admin/teachers" style={isActive('/admin/teachers') ? styles.linkActive : styles.link}>👨‍🏫 Data Guru & KPI</Link>
            <Link to="/admin/teachers/salaries" style={isActive('/admin/teachers/salaries') ? styles.linkActive : styles.link}>💰 Rekap Gaji & Slip</Link>

            <div style={styles.sectionTitle}>KEUANGAN</div>
            <Link to="/admin/finance" style={isActive('/admin/finance') ? styles.linkActive : styles.link}>📊 Pusat Keuangan</Link>
            
            <div style={styles.sectionTitle}>SYSTEM</div>
            <Link to="/admin/settings" style={isActive('/admin/settings') ? styles.linkActive : styles.link}>⚙️ Pengaturan Pusat</Link>
          </>
        )}

        {/* --- MENU KHUSUS GURU --- */}
        {isGuru && (
          <>
            <Link to="/guru/dashboard" style={isActive('/guru/dashboard') ? styles.linkActive : styles.link}>🏠 Dashboard Guru</Link>
            
            <div style={styles.sectionTitle}>PERSONAL</div>
            <Link to="/guru/profile" style={isActive('/guru/profile') ? styles.linkActive : styles.link}>👤 Profil & Skor KPI</Link>
            
            <div style={styles.sectionTitle}>AKADEMIK</div>
            <Link to="/guru/grades/input" style={isActive('/guru/grades/input') ? styles.linkActive : styles.link}>📝 Input Nilai Siswa</Link>
            <Link to="/guru/history" style={isActive('/guru/history') ? styles.linkActive : styles.link}>🕒 Riwayat Mengajar</Link>
          </>
        )}
      </nav>

      {/* FOOTER TOMBOL KELUAR */}
      <div style={styles.footer}>
        <Link to="/" style={styles.logout} onClick={() => {
            if(window.confirm('Apakah Anda yakin ingin keluar?')) {
                localStorage.clear();
            }
        }}>
            🚪 Keluar
        </Link>
      </div>
    </div>
  );
};

const styles = {
  sidebar: { width: '250px', backgroundColor: '#2c3e50', height: '100vh', color: 'white', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', zIndex: 100, boxShadow: '2px 0 5px rgba(0,0,0,0.1)' },
  logo: { padding: '20px', borderBottom: '1px solid #34495e', textAlign: 'center', background: '#243342', flexShrink: 0 },
  nav: { padding: '10px 0', flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' },
  sectionTitle: { fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d', padding: '15px 20px 5px 20px', letterSpacing: '1px' },
  link: { display: 'block', padding: '10px 20px', color: '#bdc3c7', textDecoration: 'none', transition: '0.3s', fontSize: '14px' },
  linkActive: { display: 'block', padding: '10px 20px', backgroundColor: '#34495e', color: 'white', textDecoration: 'none', borderLeft: '4px solid #3498db', fontWeight: 'bold' },
  footer: { padding: '15px 20px', borderTop: '1px solid #34495e', background: '#243342', flexShrink: 0 },
  logout: { color: '#e74c3c', textDecoration: 'none', fontWeight: 'bold', display:'block', textAlign:'center', padding:10, border:'1px solid #e74c3c', borderRadius:5, fontSize:'14px' }
};

export default Sidebar;