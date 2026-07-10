// src/pages/teacher/TeacherLayout.jsx
import React, { useState, useEffect } from 'react';
import SidebarGuru from '../../components/SidebarGuru';

const TeacherLayout = ({ children }) => { // ← PAKAI children, BUKAN Outlet
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ambil data guru dari localStorage
  const [guru, setGuru] = useState(null);
  useEffect(() => {
    const stored = localStorage.getItem('teacherData');
    if (stored) {
      try {
        setGuru(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing teacher data:", e);
      }
    }
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#f8fafc' }}>
      <SidebarGuru />
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '260px',
        transition: 'margin-left 0.3s ease',
        width: isMobile ? '100%' : 'calc(100% - 260px)',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}>
        <header style={{
          background: 'white',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <div style={{ paddingLeft: isMobile ? '50px' : '0px' }}>
            <h4 style={{ margin: 0, fontSize: 13, color: '#1e293b' }}>
              Halo, {guru?.nama || 'Pengajar'} ✨
            </h4>
            <small style={{ color: '#7f8c8d', fontSize: 10 }}>
              Bimbel Gemilang - Portal Akademik
            </small>
          </div>
          <div style={{
            width: 32,
            height: 32,
            background: '#3498db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            fontSize: 12
          }}>
            {guru?.nama?.charAt(0) || 'G'}
          </div>
        </header>
        <div style={{
          padding: isMobile ? 10 : 20,
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 'calc(100vh - 60px)'
        }}>
          {children} {/* ← PAKAI children, BUKAN Outlet */}
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;