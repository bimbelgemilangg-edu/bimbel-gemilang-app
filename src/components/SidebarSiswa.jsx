import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, BarChart2, BookOpen, Wallet, Menu, X } from 'lucide-react';

const LogoBimbel = "/logo-gemilang.png";

const SidebarSiswa = ({ activeMenu, setActiveMenu, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18}/>, path: '/siswa/dashboard' },
    { id: 'rapor', label: 'Nilai & Progres', icon: <BarChart2 size={18}/>, path: '/siswa/rapor' },
    { id: 'materi', label: 'Materi Belajar', icon: <BookOpen size={18}/>, path: '/siswa/materi' },
    { id: 'keuangan', label: 'Administrasi', icon: <Wallet size={18}/>, path: '/siswa/keuangan' },
  ];

  const handleMenuClick = (id, path) => {
    setActiveMenu(id);
    if (path) navigate(path);
    if (isMobile) setIsOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm("Keluar dari portal siswa?")) {
      localStorage.clear();
      navigate('/login-siswa');
    }
  };

  return (
    <>
      {isMobile && isOpen && (
        <div onClick={() => setIsOpen(false)} style={styles.overlay} />
      )}

      <div style={{
        ...styles.sidebar,
        transform: isOpen || !isMobile ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        <div style={styles.header}>
          <img src={LogoBimbel} alt="Logo" style={styles.logo} onError={(e) => e.target.style.display = 'none'} />
          <span style={styles.brand}>Bimbel Gemilang</span>
          {isMobile && (
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}><X size={20} /></button>
          )}
        </div>
        
        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMenuClick(item.id, item.path)}
              style={{
                ...styles.menuItem,
                background: activeMenu === item.id ? '#3b82f6' : 'transparent',
                color: activeMenu === item.id ? 'white' : '#94a3b8'
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    background: '#1e293b',
    color: 'white',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1000,
    transition: 'transform 0.3s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logo: { width: '32px', height: '32px', objectFit: 'contain' },
  brand: { fontWeight: 'bold', fontSize: '14px' },
  closeBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: 'auto' },
  nav: { flex: 1, padding: '16px' },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '4px',
    fontSize: '13px'
  },
  logoutBtn: {
    margin: '16px',
    padding: '10px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 'bold'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999
  }
};

export default SidebarSiswa;