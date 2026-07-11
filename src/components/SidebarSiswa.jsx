// src/components/SidebarSiswa.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, X, Home, BarChart2, BookOpen, Wallet, 
  Trophy, TrendingUp, GraduationCap, Calendar, 
  User, Hash
} from 'lucide-react';

// Logo dari folder public
const LogoBimbel = "/logo-gemilang.png";

const SidebarSiswa = ({ activeMenu, setActiveMenu, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [studentData, setStudentData] = useState({ name: '', nim: '', kelas: '' });

  // ===== EFFECTS =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    
    // Ambil data siswa
    const name = localStorage.getItem('studentName') || 'Siswa';
    const nim = localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
    const kelas = localStorage.getItem('studentKelas') || 
                  localStorage.getItem('studentGrade') || '';
    
    setStudentData({ name, nim, kelas });
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== MENU ITEMS =====
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <Home size={18}/>, 
      path: '/siswa/dashboard',
      color: '#3b82f6'
    },
    { 
      id: 'materi', 
      label: '📚 E-Learning', 
      icon: <BookOpen size={18}/>, 
      path: '/siswa/materi',
      color: '#10b981',
      badge: 'Baru'
    },
    { 
      id: 'smart-rapor', 
      label: '📊 Smart Raport', 
      icon: <TrendingUp size={18}/>, 
      path: '/siswa/smart-rapor',
      color: '#8b5cf6'
    },
    { 
      id: 'leaderboard', 
      label: '🏆 Papan Peringkat', 
      icon: <Trophy size={18}/>, 
      path: '/siswa/leaderboard',
      color: '#f59e0b'
    },
    { 
      id: 'rapor', 
      label: '📋 Nilai & Progres', 
      icon: <BarChart2 size={18}/>, 
      path: '/siswa/rapor',
      color: '#ef4444'
    },
    { 
      id: 'keuangan', 
      label: '💰 Administrasi', 
      icon: <Wallet size={18}/>, 
      path: '/siswa/keuangan',
      color: '#06b6d4'
    },
    { 
      id: 'jadwal', 
      label: '📅 Jadwal', 
      icon: <Calendar size={18}/>, 
      path: '/siswa/jadwal',
      color: '#ec4899'
    },
  ];

  // ===== HANDLERS =====
  const handleMenuClick = (item) => {
    if (typeof setActiveMenu === 'function') {
      setActiveMenu(item.id);
    }
    if (item.path) {
      navigate(item.path);
    }
    if (isMobile && typeof setIsOpen === 'function') {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Apakah kamu yakin ingin keluar dari portal siswa?")) {
      localStorage.removeItem("isSiswaLoggedIn");
      localStorage.removeItem("role");
      localStorage.removeItem("studentId");
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentNim");
      localStorage.removeItem("studentKelas");
      localStorage.removeItem("studentGrade");
      navigate('/login-siswa');
    }
  };

  // ===== GET INITIALS =====
  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      {isMobile && isOpen && (
        <div onClick={() => setIsOpen(false)} style={styles.overlay} />
      )}

      <div style={{
        ...styles.sidebar,
        transform: isOpen || !isMobile ? 'translateX(0)' : 'translateX(-100%)',
        position: isMobile ? 'fixed' : 'fixed', // ← TETAP FIXED
      }}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.brandWrapper}>
            <img 
              src={LogoBimbel} 
              alt="Bimbel Gemilang" 
              style={styles.logoSidebar} 
              onError={(e) => { 
                e.target.style.display = 'none'; 
              }} 
            />
            <span style={styles.brandText}>Bimbel Gemilang</span>
          </div>
          
          {isMobile && (
            <button onClick={() => setIsOpen(false)} style={styles.closeMobileBtn}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* PROFILE CARD */}
        <div style={styles.profileCard}>
          <div style={styles.profileAvatar}>
            {getInitials(studentData.name)}
          </div>
          <div style={styles.profileInfo}>
            <div style={styles.profileName}>{studentData.name}</div>
            <div style={styles.profileMeta}>
              <span style={styles.profileNim}>
                <Hash size={10} /> {studentData.nim || 'Belum ada ID'}
              </span>
              {studentData.kelas && (
                <span style={styles.profileKelas}>
                  <GraduationCap size={10} /> {studentData.kelas}
                </span>
              )}
            </div>
          </div>
        </div>

        <hr style={styles.divider} />
        
        {/* MENU */}
        <ul style={styles.menuList}>
          {menuItems.map((item) => {
            const isActive = activeMenu === item.id || location.pathname === item.path;
            return (
              <li 
                key={item.id}
                onClick={() => handleMenuClick(item)}
                style={{ 
                  ...styles.menuItem,
                  background: isActive ? `${item.color}20` : 'transparent',
                  borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                  color: isActive ? item.color : '#94a3b8'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ 
                  ...styles.menuIcon,
                  color: isActive ? item.color : '#64748b'
                }}>
                  {item.icon}
                </span>
                <span style={styles.menuLabel}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    ...styles.menuBadge,
                    background: item.color,
                  }}>
                    {item.badge}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* FOOTER */}
        <div style={styles.footer}>
          <button 
            onClick={() => navigate('/siswa/profile')} 
            style={styles.profileBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <User size={16} /> Profil
          </button>
          <button 
            onClick={handleLogout} 
            style={styles.logoutBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ef4444';
            }}
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>

        {/* VERSION */}
        <div style={styles.version}>
          <span>v2.0.0</span>
          <span>•</span>
          <span>Bimbel Gemilang</span>
        </div>
      </div>
    </>
  );
};

// ============================================================
// STYLES - SEMUA DALAM OBJEK (TIDAK TERPUTUS)
// ============================================================
const styles = {
  sidebar: { 
    width: '270px', 
    height: '100vh', 
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    color: 'white', 
    padding: '20px 16px', 
    left: 0, 
    top: 0, 
    zIndex: 1000,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex', 
    flexDirection: 'column',
    overflowY: 'auto',
    boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
  },
  
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #334155'
  },
  brandWrapper: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px' 
  },
  logoSidebar: { 
    maxHeight: '32px', 
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)'
  },
  brandText: { 
    fontWeight: 800, 
    fontSize: '15px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px'
  },
  closeMobileBtn: { 
    background: 'none', 
    border: 'none', 
    color: 'white', 
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '8px'
  },
  
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  profileAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
    color: 'white',
    flexShrink: 0
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { 
    fontSize: '13px', 
    fontWeight: 700,
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  profileMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
    flexWrap: 'wrap'
  },
  profileNim: {
    fontSize: '9px',
    color: '#94a3b8',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    background: 'rgba(59,130,246,0.2)',
    padding: '1px 6px',
    borderRadius: '4px'
  },
  profileKelas: {
    fontSize: '9px',
    color: '#94a3b8',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    background: 'rgba(16,185,129,0.2)',
    padding: '1px 6px',
    borderRadius: '4px'
  },
  
  divider: { 
    border: '0', 
    borderTop: '1px solid #334155', 
    marginBottom: '16px' 
  },
  
  menuList: { 
    listStyle: 'none', 
    padding: 0, 
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  menuItem: { 
    padding: '10px 14px', 
    cursor: 'pointer', 
    borderRadius: '10px', 
    display: 'flex', 
    alignItems: 'center', 
    fontSize: '13px', 
    fontWeight: 500,
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  menuIcon: {
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    flexShrink: 0
  },
  menuLabel: { flex: 1 },
  menuBadge: {
    fontSize: '8px',
    fontWeight: 700,
    padding: '1px 8px',
    borderRadius: '10px',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  
  footer: {
    display: 'flex',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #334155',
    marginTop: '4px'
  },
  profileBtn: {
    flex: 1,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: '0.2s'
  },
  logoutBtn: {
    flex: 1,
    padding: '8px 12px',
    background: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: '0.2s'
  },
  
  version: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    paddingTop: '10px',
    marginTop: '8px',
    borderTop: '1px solid #334155',
    fontSize: '9px',
    color: '#475569'
  },
  
  overlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(0,0,0,0.6)', 
    zIndex: 999, 
    backdropFilter: 'blur(4px)'
  }
};

export default SidebarSiswa;