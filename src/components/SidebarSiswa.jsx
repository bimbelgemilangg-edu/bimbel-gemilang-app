import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, X, Home, BarChart2, BookOpen, Wallet, 
  Menu, Calendar, CheckSquare, Trophy, TrendingUp, 
  User
} from 'lucide-react';

// Logo dari folder public
const LogoBimbel = "/logo-gemilang.png";

const SidebarSiswa = ({ activeMenu, setActiveMenu, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sinkronkan activeMenu berdasarkan URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/siswa/dashboard') setActiveMenu('dashboard');
    else if (path === '/siswa/rapor') setActiveMenu('rapor');
    else if (path === '/siswa/smart-rapor') setActiveMenu('smart-rapor');
    else if (path === '/siswa/leaderboard') setActiveMenu('leaderboard');
    else if (path === '/siswa/materi') setActiveMenu('materi');
    else if (path === '/siswa/keuangan') setActiveMenu('keuangan');
    else if (path === '/siswa/jadwal') setActiveMenu('jadwal');
    else if (path === '/siswa/absensi') setActiveMenu('absensi');
    else if (path === '/siswa/profil') setActiveMenu('profil');
  }, [location.pathname, setActiveMenu]);

  const handleMenuClick = (id, path) => {
    setActiveMenu(id);
    if (path) {
      navigate(path);
    }
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    if(window.confirm("Apakah kamu yakin ingin keluar dari portal siswa?")) {
      localStorage.removeItem("isSiswaLoggedIn");
      localStorage.removeItem("role");
      localStorage.removeItem("studentId");
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentGrade");
      localStorage.removeItem("selectedModuleId");
      navigate('/login-siswa');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18}/>, path: '/siswa/dashboard' },
    { id: 'materi', label: 'Materi Belajar', icon: <BookOpen size={18}/>, path: '/siswa/materi' },
    { id: 'jadwal', label: 'Jadwal Belajar', icon: <Calendar size={18}/>, path: '/siswa/jadwal' },
    { id: 'absensi', label: 'Kehadiran Saya', icon: <CheckSquare size={18}/>, path: '/siswa/absensi' },
    { id: 'rapor', label: 'Nilai & Raport', icon: <BarChart2 size={18}/>, path: '/siswa/rapor' },
    { id: 'smart-rapor', label: 'Smart Raport', icon: <TrendingUp size={18}/>, path: '/siswa/smart-rapor' },
    { id: 'leaderboard', label: 'Papan Peringkat', icon: <Trophy size={18}/>, path: '/siswa/leaderboard' },
    { id: 'keuangan', label: 'Administrasi', icon: <Wallet size={18}/>, path: '/siswa/keuangan' },
  ];

  return (
    <>
      {/* Overlay Mobile - Klik di luar sidebar untuk menutup */}
      {isMobile && isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 998
          }} 
        />
      )}

      {/* Tombol Hamburger Mobile */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed',
            top: '12px',
            left: isOpen ? '230px' : '12px',
            zIndex: 1100,
            background: '#1e293b',
            color: '#f59e0b',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'left 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <Menu size={22} />
        </button>
      )}

      {/* Sidebar */}
      <div style={{
        width: '260px',
        height: '100vh',
        background: '#1e293b',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease',
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        boxShadow: isMobile && isOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none'
      }}>
        {/* Header Logo */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <img 
            src={LogoBimbel} 
            alt="Logo" 
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'white' }}>Bimbel Gemilang</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Siswa Portal</div>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMenuClick(item.id, item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeMenu === item.id ? '#3b82f6' : 'transparent',
                color: activeMenu === item.id ? 'white' : '#94a3b8'
              }}
            >
              {item.icon}
              <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Footer Logout */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #334155'
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '12px',
              transition: '0.3s'
            }}
          >
            <LogOut size={16} /> Keluar
          </button>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#64748b',
            marginTop: '12px'
          }}>
            <span>Version 2.0.0</span>
            <span>© 2026</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarSiswa;