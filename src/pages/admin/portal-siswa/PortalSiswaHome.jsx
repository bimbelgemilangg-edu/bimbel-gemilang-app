import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Image, Bell, BookOpen, Wallet, GraduationCap } from 'lucide-react';

const PortalSiswaHome = () => {
  const navigate = useNavigate();

  const menus = [
    { id: 1, title: 'Poster Slider', icon: <Image size={30} />, path: '/admin/portal/poster', color: '#3498db', desc: 'Atur gambar banner 16:9 di dashboard siswa.' },
    { id: 2, title: 'Timeline & Tugas', icon: <Bell size={30} />, path: '/admin/portal/timeline', color: '#e67e22', desc: 'Input tugas atau pengumuman penting.' },
    { id: 3, title: 'Pantau Materi', icon: <BookOpen size={30} />, path: '/admin/portal/materi', color: '#27ae60', desc: 'Lihat progres materi & upload PPT.' },
    { id: 4, title: 'Keuangan & SPP', icon: <Wallet size={30} />, path: '/admin/portal/finance', color: '#e74c3c', desc: 'Cek status pembayaran siswa.' },
    { id: 5, title: 'E-Rapor', icon: <GraduationCap size={30} />, path: '/admin/portal/rapor', color: '#9b59b6', desc: 'Input nilai hasil belajar siswa.' },
  ];

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '5px' }}>Pusat Kendali Portal Siswa</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Kelola semua konten yang akan tampil di aplikasi siswa.</p>

      <div style={styles.grid}>
        {menus.map((menu) => (
          <div 
            key={menu.id} 
            style={styles.card} 
            onClick={() => navigate(menu.path)}
          >
            <div style={{ ...styles.iconCircle, backgroundColor: menu.color }}>
              {menu.icon}
            </div>
            <h3 style={{ margin: '15px 0 5px 0' }}>{menu.title}</h3>
            <p style={styles.desc}>{menu.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #f0f0f0' },
  iconCircle: { width: '70px', height: '70px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', margin: '0 auto' },
  desc: { fontSize: '14px', color: '#7f8c8d', lineHeight: '1.5' }
};

export default PortalSiswaHome;