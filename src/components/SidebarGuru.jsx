import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, User, BookOpen, Edit, 
  History, Calendar, ClipboardCheck, LogOut, Menu, X,
  Database
} from 'lucide-react';

const SidebarGuru = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobileView(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menu = [
    { name: 'Dashboard', path: '/guru/dashboard', icon: <LayoutDashboard size={20}/> },
    { name: 'E-Learning', path: '/guru/modul', icon: <BookOpen size={20}/> },
    { name: 'Pemeriksaan Tugas', path: '/guru/cek-tugas', icon: <ClipboardCheck size={20}/> },
    { name: 'Jadwal Mengajar', path: '/guru/schedule', icon: <Calendar size={20}/> },
    { name: 'Absensi Siswa', path: '/guru/attendance', icon: <ClipboardCheck size={20}/> },
    { name: 'Input Nilai / Rapor', path: '/guru/grades/input', icon: <Edit size={20}/> },
    { name: 'Generate Raport', path: '/guru/generate-raport', icon: <Database size={20}/> }, // BARU
    { name: 'Riwayat Sesi', path: '/guru/history', icon: <History size={20}/> },
    { name: 'Profil Saya', path: '/guru/profile', icon: <User size={20}/> },
  ];

  const toggleSidebar = () => setIsMobileOpen(!isMobileOpen);
  const closeSidebar = () => setIsMobileOpen(false);

  return (
    <>
      {/* Tombol Hamburger */}
      {isMobileView && (
        <button onClick={toggleSidebar} style={{
          position: 'fixed',
          top: '15px',
          left: isMobileOpen ? '210px' : '15px',
          zIndex: 1100,
          background: '#1a252f',
          color: '#f1c40f',
          border: '2px solid #f1c40f',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.3s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* Overlay */}
      {isMobileOpen && isMobileView && (
        <div onClick={closeSidebar} style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 999
        }} />
      )}

      {/* Sidebar */}
      <div style={{
        width: '260px',
        background: '#1a252f',
        color: 'white',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        transform: isMobileView ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        boxShadow: isMobileOpen ? '10px 0 30px rgba(0,0,0,0.3)' : 'none',
        transition: 'transform 0.3s ease-in-out, boxShadow 0.3s ease'
      }}>
        <div style={{ padding: '30px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ background: '#f1c40f', padding: 5, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: 14 }}>GE</span>
          </div>
          <h3 style={{ color: 'white', margin: 0, fontSize: 18 }}>GEMILANG <span style={{ color: '#f1c40f' }}>EDU</span></h3>
        </div>
        
        <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => isMobileView && closeSidebar()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px',
                  textDecoration: 'none', fontSize: '14px', transition: '0.2s', marginBottom: '4px',
                  background: isActive ? 'rgba(241, 196, 15, 0.15)' : 'transparent',
                  borderLeft: isActive ? '4px solid #f1c40f' : '4px solid transparent',
                  color: isActive ? '#f1c40f' : '#bdc3c7',
                  fontWeight: isActive ? '600' : '400'
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login-guru'; }} 
          style={{
            margin: '20px', padding: '12px', background: '#c0392b', border: 'none',
            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px', fontWeight: 'bold', borderRadius: '8px'
          }}
        >
          <LogOut size={18} /> Keluar Sistem
        </button>
      </div>
    </>
  );
};

export default SidebarGuru;