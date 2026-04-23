import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarGuru from '../../components/SidebarGuru';

const TeacherLayout = ({ guru }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar otomatis handle dirinya sendiri (muncul/sembunyi) */}
      <SidebarGuru />
      
      {/* SEMUA MENU (Dashboard, Nilai, dll) masuk ke sini */}
      <main className="main-content">
        <header style={styles.topHeader}>
          <div style={styles.headerInfo}>
            <h4 style={{ margin: 0 }}>Halo, {guru?.nama || 'Pengajar'} ✨</h4>
            <small style={{ color: '#7f8c8d' }}>Bimbel Gemilang - Portal Akademik</small>
          </div>
          <div style={styles.avatar}>{guru?.nama?.charAt(0) || 'G'}</div>
        </header>

        {/* Padding konten utama */}
        <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', marginLeft: window.innerWidth <= 1024 ? 0 : '0px' }}>
          <Outlet /> 
        </div>
      </main>
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
    zIndex: 99
  },
  headerInfo: {
    paddingLeft: window.innerWidth <= 1024 ? '50px' : '0px'
  },
  avatar: { width: '35px', height: '35px', background: '#3498db', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }
};

export default TeacherLayout;