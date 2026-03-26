import React from 'react';
import { useNavigate } from 'react-router-dom';

const SidebarSiswa = ({ activeMenu, setActiveMenu }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: '🏠 Dashboard', role: 'both' },
    { id: 'nilai', label: '📊 Nilai & Progres', role: 'both' },
    { id: 'materi', label: '📚 Materi Belajar', role: 'student' },
    { id: 'keuangan', label: '💰 Administrasi', role: 'parent' },
  ];

  const handleLogout = () => {
    localStorage.clear(); // Bersihkan semua session
    navigate('/login-siswa');
  };

  return (
    <div style={{ width: '250px', height: '100vh', background: '#2c3e50', color: 'white', padding: '20px', position: 'fixed' }}>
      <h3>Bimbel Gemilang</h3>
      <hr />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {menuItems.map((item) => (
          <li 
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            style={{ 
              padding: '12px', 
              cursor: 'pointer', 
              background: activeMenu === item.id ? '#34495e' : 'transparent',
              borderRadius: '5px',
              marginBottom: '5px'
            }}
          >
            {item.label}
          </li>
        ))}
      </ul>
      <button 
        onClick={handleLogout}
        style={{ marginTop: '50px', width: '100%', padding: '10px', background: '#e74c3c', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer' }}
      >
        Keluar
      </button>
    </div>
  );
};

export default SidebarSiswa;