import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, Home, BarChart2, BookOpen, Wallet } from 'lucide-react';

const SidebarSiswa = ({ activeMenu, setActiveMenu, isOpen, setIsOpen }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18}/> },
    { id: 'rapor', label: 'Nilai & Progres', icon: <BarChart2 size={18}/> },
    { id: 'materi', label: 'Materi Belajar', icon: <BookOpen size={18}/> },
    { id: 'keuangan', label: 'Administrasi', icon: <Wallet size={18}/> },
  ];

  const handleLogout = () => {
    if(window.confirm("Apakah kamu yakin ingin keluar?")) {
      localStorage.clear();
      navigate('/login-siswa');
    }
  };

  const handleMenuClick = (id) => {
    setActiveMenu(id);
    // Jika di HP, otomatis tutup sidebar setelah pilih menu
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* BACKGROUND GELAP SAAT SIDEBAR TERBUKA (Hanya di Mobile) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          style={styles.overlay}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <div style={{
        ...styles.sidebar,
        transform: isOpen ? 'translateX(0)' : (window.innerWidth <= 768 ? 'translateX(-100%)' : 'translateX(0)'),
      }}>
        <div style={styles.header}>
          <h3 style={{margin: 0, fontSize: '18px'}}>💎 Gemilang App</h3>
          {/* Tombol Tutup hanya muncul di Mobile */}
          <button onClick={() => setIsOpen(false)} style={styles.closeMobileBtn}>
            <X size={20} />
          </button>
        </div>
        
        <hr style={styles.divider} />
        
        <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
          {menuItems.map((item) => (
            <li 
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
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
    width: '260px', 
    height: '100vh', 
    background: '#1e293b', 
    color: 'white', 
    padding: '25px 20px', 
    position: 'fixed', 
    left: 0, 
    top: 0,
    zIndex: 1000,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 15px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  closeMobileBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: window.innerWidth <= 768 ? 'block' : 'none'
  },
  divider: { border: '0', borderTop: '1px solid #334155', marginBottom: '20px' },
  menuItem: { 
    padding: '12px 15px', 
    cursor: 'pointer', 
    borderRadius: '12px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    transition: '0.2s'
  },
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
    fontWeight: 'bold'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
    backdropFilter: 'blur(2px)'
  }
};

export default SidebarSiswa;