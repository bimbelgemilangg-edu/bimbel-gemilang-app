import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, Home, BarChart2, BookOpen, Wallet, Trophy, TrendingUp } from 'lucide-react';

// Memanggil file dari folder public
const LogoBimbel = "/logo-gemilang.png"; 

const SidebarSiswa = ({ activeMenu, setActiveMenu, isOpen, setIsOpen }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18}/>, path: '/siswa/dashboard' },
    { id: 'rapor', label: 'Nilai & Progres', icon: <BarChart2 size={18}/>, path: '/siswa/rapor' },
    { id: 'smart-rapor', label: 'Smart Raport', icon: <TrendingUp size={18}/>, path: '/siswa/smart-rapor' }, // BARU
    { id: 'leaderboard', label: 'Papan Peringkat', icon: <Trophy size={18}/>, path: '/siswa/leaderboard' }, // BARU
    { id: 'materi', label: 'Materi Belajar', icon: <BookOpen size={18}/>, path: '/siswa/materi' },
    { id: 'keuangan', label: 'Administrasi', icon: <Wallet size={18}/>, path: '/siswa/keuangan' },
  ];

  const isMobile = window.innerWidth <= 768;

  const handleMenuClick = (item) => {
    setActiveMenu(item.id);
    if (item.path) {
      navigate(item.path);
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
          <div style={styles.brandWrapper}>
            <img 
              src={LogoBimbel} 
              alt="" 
              style={styles.logoSidebar} 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <span style={styles.brandText}>Bimbel Gemilang</span>
          </div>
          
          {isMobile && (
            <button onClick={() => setIsOpen(false)} style={styles.closeMobileBtn}>
              <X size={20} />
            </button>
          )}
        </div>
        
        <hr style={styles.divider} />
        
        <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
          {menuItems.map((item) => (
            <li 
              key={item.id}
              onClick={() => handleMenuClick(item)}
              style={{ 
                ...styles.menuItem,
                background: activeMenu === item.id ? '#3b82f6' : 'transparent',
                color: activeMenu === item.id ? 'white' : '#94a3b8'
              }}
            >
              <span style={{marginRight: '12px'}}>{item.icon}</span>
              {item.label}
            </li>
          ))}
        </ul>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} style={{marginRight: '10px'}}/>
          Keluar
        </button>
      </div>
    </>
  );
};

const styles = {
  sidebar: { 
    width: '260px', height: '100vh', background: '#1e293b', color: 'white', padding: '25px 20px', 
    position: 'fixed', left: 0, top: 0, zIndex: 1000,
    transition: 'transform 0.3s ease', display: 'flex', flexDirection: 'column'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  brandWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoSidebar: { maxHeight: '30px', objectFit: 'contain' },
  brandText: { fontWeight: 'bold', fontSize: '15px' },
  closeMobileBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer' },
  divider: { border: '0', borderTop: '1px solid #334155', marginBottom: '20px' },
  menuItem: { padding: '12px 15px', cursor: 'pointer', borderRadius: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', fontSize: '14px', transition: '0.2s' },
  logoutBtn: { 
    marginTop: 'auto', 
    width: '100%', 
    padding: '12px', 
    background: '#ef4444', 
    border: 'none', 
    color: 'white', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: 'bold',
    transition: '0.3s'
  },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(2px)' }
};

export default SidebarSiswa;