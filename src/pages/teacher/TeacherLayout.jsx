import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarGuru from '../../components/SidebarGuru';

const TeacherLayout = ({ guru }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <SidebarGuru />
      
      <main className="main-content">
        <header style={{
          background: 'white',
          padding: '15px 25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <div style={{ paddingLeft: isMobile ? '50px' : '0px' }}>
            <h4 style={{ margin: 0 }}>Halo, {guru?.nama || 'Pengajar'} ✨</h4>
            <small style={{ color: '#7f8c8d' }}>Bimbel Gemilang - Portal Akademik</small>
          </div>
          <div style={{ width: '35px', height: '35px', background: '#3498db', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
            {guru?.nama?.charAt(0) || 'G'}
          </div>
        </header>

        <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;