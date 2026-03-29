import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarGuru from '../../components/SidebarGuru';

const TeacherLayout = ({ guru }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar tetap dipertahankan */}
      <SidebarGuru />
      
      {/* Container Utama dengan class 'main-content' dari index.css */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Header dengan penyesuaian padding untuk mobile */}
        <header style={styles.topHeader}>
          <div style={styles.headerInfo}>
            <h4 style={{ margin: 0, fontSize: '16px' }}>Halo, {guru?.nama || 'Pengajar'} ✨</h4>
            <small style={{ color: '#7f8c8d', fontSize: '11px' }}>Bimbel Gemilang - Portal Akademik</small>
          </div>
          <div style={styles.avatar}>{guru?.nama?.charAt(0) || 'G'}</div>
        </header>

        {/* Area Konten Dinamis */}
        <div style={styles.contentArea}>
          {/* Outlet adalah tempat halaman (Dashboard, Modul, dll) muncul */}
          <Outlet /> 
        </div>
      </div>
    </div>
  );
};

const styles = {
  topHeader: { 
    background: 'white', 
    padding: '15px 25px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 900
  },
  headerInfo: {
    /* Memberi ruang agar teks tidak tertabrak tombol hamburger di mobile */
    paddingLeft: window.innerWidth <= 1024 ? '45px' : '0px'
  },
  avatar: { 
    width: '35px', 
    height: '35px', 
    background: '#3498db', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: 'bold', 
    color: 'white',
    fontSize: '14px'
  },
  contentArea: { 
    padding: '20px',
    width: '100%',
    boxSizing: 'border-box'
  }
};

export default TeacherLayout;