import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoBimbel from '../assets/logo.png'; // Path logo-mu

const SplashLauncher = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* LOGO BESAR DI TENGAH (Estetika persis gambar kamu) */}
      <img src={LogoBimbel} alt="Bimbel Gemilang" style={styles.logoSplash} />
      
      {/* Teks Deskriptif (Opsional, tapi bagus untuk konteks) */}
      <p style={styles.tagline}>Sistem Informasi Akademik & Absensi</p>
      
      {/* Navigasi Cepat (Simulasi masuk ke portal) */}
      <div style={styles.quickLaunch}>
        <button onClick={() => navigate('/login-siswa')} style={styles.btnLaunchSiswa}>
          Masuk Portal Siswa
        </button>
        <button onClick={() => navigate('/login-guru')} style={styles.btnLaunchGuru}>
          Masuk Portal Guru
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#ffffff', // Putih bersih sesuai gambar
    fontFamily: 'sans-serif',
    padding: '20px',
    textAlign: 'center'
  },
  logoSplash: {
    maxWidth: '280px', // Versi besar di splash
    objectFit: 'contain',
    marginBottom: '15px'
  },
  tagline: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '60px'
  },
  quickLaunch: {
    display: 'flex',
    gap: '15px',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '300px'
  },
  btnLaunchSiswa: {
    background: '#3b82f6', // Biru primary dari palette logo
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  btnLaunchGuru: {
    background: '#1e293b', // Biru gelap
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default SplashLauncher;