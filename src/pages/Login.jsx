import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const teachers = ["Pak Budi", "Bu Siti", "Pak Joko", "Bu Rina"]; // Nanti dari Database

  const handleLoginGuru = () => {
    if (!selectedTeacher) return alert("Pilih nama Anda terlebih dahulu!");
    
    // Bawa nama guru ke halaman dashboard
    navigate('/teacher', { state: { teacherName: selectedTeacher } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Bimbel Gemilang</h1>
        <p style={styles.subtitle}>Portal Akademik & Absensi</p>

        {/* --- FORM LOGIN GURU (DROPDOWN) --- */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Pilih Nama Anda</label>
          <select 
            style={styles.select} 
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            <option value="">-- Pilih Nama Guru --</option>
            {teachers.map((t, index) => (
              <option key={index} value={t}>{t}</option>
            ))}
          </select>

          <button style={styles.buttonTentor} onClick={handleLoginGuru}>
            Masuk Kelas
          </button>
        </div>

        {/* LOGIN ADMIN */}
        <div style={styles.footer}>
          <div style={styles.divider}></div>
          <p style={styles.adminText}>Administrator?</p>
          <Link to="/admin" style={styles.linkAdmin}>Login Admin</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
  loginBox: { backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
  title: { color: '#2c3e50', marginBottom: '5px', fontSize: '24px' },
  subtitle: { color: '#7f8c8d', marginBottom: '30px', fontSize: '14px' },
  formGroup: { marginBottom: '20px', textAlign: 'left' },
  label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e' },
  
  select: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px', backgroundColor: 'white' },
  
  buttonTentor: { width: '100%', padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.3s' },
  footer: { marginTop: '20px' },
  divider: { height: '1px', backgroundColor: '#eee', marginBottom: '15px' },
  adminText: { fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' },
  linkAdmin: { color: '#e74c3c', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }
};

export default Login;