import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, User, BookOpen, Edit, 
  History, Calendar, ClipboardCheck, LogOut, Menu, X,
  Database, FileText, Upload, Award, CheckSquare,
  Clock, Users, Settings, FileSpreadsheet
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
    { 
      name: 'Dashboard', 
      path: '/guru/dashboard', 
      icon: <LayoutDashboard size={20}/> 
    },
    { 
      name: 'Jadwal Mengajar', 
      path: '/guru/schedule', 
      icon: <Calendar size={20}/> 
    },
    { 
      name: 'E-Learning', 
      path: '/guru/modul', 
      icon: <BookOpen size={20}/> 
    },
    { 
      name: 'Pemeriksaan Tugas', 
      path: '/guru/cek-tugas', 
      icon: <ClipboardCheck size={20}/> 
    },
    { 
      name: 'Absensi Siswa', 
      path: '/guru/attendance', 
      icon: <Users size={20}/> 
    },
    { 
      name: 'Input Nilai / Rapor', 
      path: '/guru/grades/input', 
      icon: <Edit size={20}/> 
    },
    { 
      name: 'Generate Raport', 
      path: '/guru/generate-raport', 
      icon: <Database size={20}/> 
    },
    { 
      name: 'Riwayat Sesi', 
      path: '/guru/history', 
      icon: <History size={20}/> 
    },
    { 
      name: 'Profil Saya', 
      path: '/guru/profile', 
      icon: <User size={20}/> 
    },
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
        {/* Logo */}
        <div style={{ 
          padding: '25px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{ 
            background: '#f1c40f', 
            padding: 6, 
            borderRadius: 10, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 36,
            height: 36
          }}>
            <span style={{ fontWeight: 'bold', fontSize: 14, color: '#1a252f' }}>GE</span>
          </div>
          <div>
            <h3 style={{ color: 'white', margin: 0, fontSize: 16, fontWeight: 700 }}>
              GEMILANG <span style={{ color: '#f1c40f' }}>EDU</span>
            </h3>
            <p style={{ margin: 0, fontSize: 9, color: '#94a3b8', letterSpacing: 1 }}>
              TEACHER PORTAL
            </p>
          </div>
        </div>
        
        {/* Menu */}
        <nav style={{ 
          flex: 1, 
          padding: '16px 10px', 
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent'
        }}>
          {menu.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/guru/dashboard' && location.pathname.startsWith(item.path));
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => isMobileView && closeSidebar()}
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px', 
                  padding: '11px 16px',
                  textDecoration: 'none', 
                  fontSize: '13px', 
                  transition: 'all 0.2s ease',
                  marginBottom: '2px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(241, 196, 15, 0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid #f1c40f' : '3px solid transparent',
                  color: isActive ? '#f1c40f' : '#94a3b8',
                  fontWeight: isActive ? '600' : '400',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  opacity: isActive ? 1 : 0.6
                }}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    right: 12,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#f1c40f'
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.15)'
        }}>
          <button 
            onClick={() => { 
              localStorage.clear(); 
              window.location.href = '/login-guru'; 
            }} 
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(192, 57, 43, 0.15)',
              border: '1px solid rgba(192, 57, 43, 0.3)',
              color: '#e74c3c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: '600',
              borderRadius: '8px',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(192, 57, 43, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(192, 57, 43, 0.15)';
            }}
          >
            <LogOut size={16} /> Keluar Sistem
          </button>
          
          <div style={{
            textAlign: 'center',
            marginTop: 8,
            fontSize: 8,
            color: '#475569',
            letterSpacing: 0.5
          }}>
            v2.0 • Gemilang Edu
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarGuru;