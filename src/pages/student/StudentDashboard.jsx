import React, { useState } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';

const StudentDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const studentName = localStorage.getItem('studentName');

  // Konten akan berubah sesuai menu yang dipilih di Sidebar
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <div><h4>Selamat Datang, {studentName}!</h4><p>Gunakan menu di samping untuk melihat progres belajarmu.</p></div>;
      case 'nilai':
        return <div><h4>📊 Nilai Akademik</h4><p>Data nilai akan muncul di sini.</p></div>;
      case 'materi':
        return <div><h4>📚 Materi Belajar</h4><p>Belum ada materi tersedia.</p></div>;
      case 'keuangan':
        return <div><h4>💰 Data Keuangan</h4><p>Khusus untuk Orang Tua memantau SPP.</p></div>;
      default:
        return <p>Pilih Menu</p>;
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '270px', padding: '20px', width: '100%' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default StudentDashboard;