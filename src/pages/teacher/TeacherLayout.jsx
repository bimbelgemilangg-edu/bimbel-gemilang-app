import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';

const TeacherLayout = ({ children, guru, activeTab }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if(window.confirm("Keluar dari akun?")) {
        localStorage.removeItem('teacherData');
        navigate('/login-guru');
    }
  };

  return (
    <div style={styles.container}>
      {/* --- SIDEBAR TETAP --- */}
      <div style={styles.sidebar}>
        <div style={styles.logoArea}>
          <h3 style={styles.logoText}>GEMILANG <br/><span>Teacher Panel</span></h3>
        </div>
        
        <nav style={styles.navLinks}>
          <button 
            style={{...styles.navBtn, background: activeTab === 'dashboard' ? '#34495e' : 'transparent'}} 
            onClick={() => navigate('/guru/dashboard', {state:{teacher:guru}})}
          >
            🏠 Beranda
          </button>
          
          {/* MENU INPUT NILAI (Kembali Ditampilkan) */}
          <button 
            style={{...styles.navBtn, background: activeTab === 'grades' ? '#34495e' : 'transparent'}} 
            onClick={() => navigate('/guru/grades/input', {state:{teacher:guru}})}
          >
            📝 Input Nilai Siswa
          </button>

          <button 
            style={{...styles.navBtn, background: activeTab === 'history' ? '#34495e' : 'transparent'}} 
            onClick={() => navigate('/guru/history', {state:{teacher:guru}})}
          >
            📄 Riwayat Mengajar
          </button>

          <button 
            style={{...styles.navBtn, background: activeTab === 'manual' ? '#34495e' : 'transparent'}} 
            onClick={() => navigate('/guru/manual-input', {state:{teacher:guru}})}
          >
            ⚠️ Absen Susulan
          </button>
          
          <div style={styles.divider}></div>
          <p style={{fontSize:10, color:'#7f8c8d', marginLeft:15}}>MENU UPDATE (SOON)</p>
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>🚪 Keluar Akun</button>
      </div>

      {/* --- AREA KONTEN DINAMIS --- */}
      <div style={styles.mainContent}>
        {/* Header Atas */}
        <header style={styles.topHeader}>
          <div>
            <h4 style={{margin:0}}>Halo, {guru?.nama || 'Pengajar'} ✨</h4>
            <small style={{color:'#7f8c8d'}}>Bimbel Gemilang - Portal Akademik</small>
          </div>
          <div style={styles.avatar}>{guru?.nama?.charAt(0)}</div>
        </header>

        {/* Isi Halaman (Konten Berubah-ubah) */}
        <div style={styles.contentScroll}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', background: '#f8f9fa', overflow: 'hidden' },
  sidebar: { width: '260px', background: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column', padding: '20px', borderRight:'1px solid #3e5871' },
  logoArea: { paddingBottom: '20px', borderBottom: '1px solid #3e5871', marginBottom: '20px' },
  logoText: { margin: 0, fontSize: '18px', fontWeight:'bold', letterSpacing:'1px' },
  navLinks: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navBtn: { background: 'transparent', border: 'none', color: '#bdc3c7', padding: '12px 15px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize:'14px' },
  divider: { height: '1px', background: '#3e5871', margin: '15px 0' },
  logoutBtn: { background: '#c0392b', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column' },
  topHeader: { background: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' },
  avatar: { width: '35px', height: '35px', background: '#3498db', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' },
  contentScroll: { flex: 1, overflowY: 'auto', padding: '0px' } 
};

export default TeacherLayout;