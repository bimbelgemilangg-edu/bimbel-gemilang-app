// src/pages/admin/portal-siswa/PortalSiswaHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { 
  LayoutDashboard, Image, Bell, BookOpen, Wallet, 
  GraduationCap, ClipboardList, UserPlus, DollarSign,
  Home, ChevronRight
} from 'lucide-react';

const PortalSiswaHome = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================
  // MENU YANG TERSEDIA (HANYA YANG SUDAH ADA ROUTE-NYA)
  // ============================================================
  const menus = [
    { 
      id: 1, 
      title: 'Poster Slider', 
      icon: <Image size={28} />, 
      path: '/admin/portal/poster', 
      color: '#3498db', 
      desc: 'Atur gambar banner 16:9 di dashboard siswa.' 
    },
    { 
      id: 2, 
      title: 'Materi Portal', 
      icon: <BookOpen size={28} />, 
      path: '/admin/portal/materi', 
      color: '#27ae60', 
      desc: 'Kelola materi pembelajaran untuk siswa.' 
    },
    { 
      id: 3, 
      title: 'Survei & Kuesioner', 
      icon: <ClipboardList size={28} />, 
      path: '/admin/portal/survey', 
      color: '#06b6d4', 
      desc: 'Buat survei wajib/opsional untuk siswa & guru.' 
    },
    { 
      id: 4, 
      title: '📋 Pendaftaran Online', 
      icon: <UserPlus size={28} />, 
      path: '/admin/pendaftaran', 
      color: '#f59e0b', 
      desc: 'Kelola data pendaftaran siswa baru.' 
    },
    { 
      id: 5, 
      title: '💰 Manajemen Harga', 
      icon: <DollarSign size={28} />, 
      path: '/admin/pendaftaran/harga', 
      color: '#8b5cf6', 
      desc: 'Atur harga paket bimbel SD, SMP, SMA.' 
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      
      <div style={{ 
        marginLeft: isMobile ? 0 : 250, 
        padding: isMobile ? 15 : 30, 
        width: '100%', 
        boxSizing: 'border-box', 
        transition: '0.3s' 
      }}>
        
        {/* Breadcrumb */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          fontSize: 12,
          marginBottom: 20,
          color: '#94a3b8'
        }}>
          <Home size={12} color="#94a3b8" />
          <ChevronRight size={12} color="#94a3b8" />
          <span style={{ color: '#94a3b8' }}>Admin</span>
          <ChevronRight size={12} color="#94a3b8" />
          <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>Portal Siswa</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ 
            color: '#1e293b', 
            margin: '0 0 4px 0',
            fontSize: isMobile ? 20 : 26,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <LayoutDashboard size={isMobile ? 20 : 26} color="#3b82f6" />
            Pusat Kendali Portal Siswa
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
            Kelola semua konten yang akan tampil di aplikasi siswa.
          </p>
        </div>

        {/* Grid Menu */}
        <div style={styles.grid}>
          {menus.map((menu) => (
            <div 
              key={menu.id} 
              style={styles.card} 
              onClick={() => navigate(menu.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.04)';
              }}
            >
              <div style={{ ...styles.iconCircle, backgroundColor: menu.color }}>
                {menu.icon}
              </div>
              <h3 style={styles.title}>{menu.title}</h3>
              <p style={styles.desc}>{menu.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: 40,
          padding: '16px 20px',
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            💡 Total {menus.length} menu tersedia di Portal Siswa
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            Bimbel Gemilang v2.0
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
    gap: '20px' 
  },
  card: { 
    background: 'white', 
    padding: '24px 20px', 
    borderRadius: '14px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.04)', 
    textAlign: 'center', 
    cursor: 'pointer', 
    transition: 'all 0.3s ease', 
    border: '1px solid #f1f5f9',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
      borderColor: '#3b82f6'
    }
  },
  iconCircle: { 
    width: '64px', 
    height: '64px', 
    borderRadius: '50%', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    color: 'white', 
    margin: '0 auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  title: { 
    margin: '14px 0 6px 0', 
    fontSize: '15px', 
    fontWeight: 700, 
    color: '#1e293b' 
  },
  desc: { 
    fontSize: '12px', 
    color: '#94a3b8', 
    lineHeight: '1.6',
    margin: 0
  }
};

export default PortalSiswaHome;