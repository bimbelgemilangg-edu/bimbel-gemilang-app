import React from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarGuru from '../../components/SidebarGuru';

const TeacherLayout = ({ children, guru }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8f9fa' }}>
      <SidebarGuru />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', overflowY: 'auto' }}>
        <header style={styles.topHeader}>
          <div>
            <h4 style={{margin:0}}>Halo, {guru?.nama || 'Pengajar'} ✨</h4>
            <small style={{color:'#7f8c8d'}}>Bimbel Gemilang - Portal Akademik</small>
          </div>
          <div style={styles.avatar}>{guru?.nama?.charAt(0)}</div>
        </header>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  topHeader: { background: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' },
  avatar: { width: '35px', height: '35px', background: '#3498db', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }
};

export default TeacherLayout;