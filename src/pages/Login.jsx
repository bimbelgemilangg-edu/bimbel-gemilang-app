import React from 'react';
import { useNavigate } from 'react-router-dom'; // Wajib import ini

const Login = () => {
  const navigate = useNavigate(); // Wajib pasang ini

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Bimbel Gemilang</h1>
        <p style={styles.subtitle}>Sistem Informasi Akademik</p>

        {/* Form Login Tentor */}
        <div style={styles.formGroup}>
          <label style={styles.label}>ID Tentor</label>
          <input 
            type="text" 
            placeholder="Masukkan ID..." 
            style={styles.input}
          />
          <button style={styles.buttonTentor}>
            Masuk Sebagai Tentor
          </button>
        </div>

        {/* Opsi Admin di Bawah */}
        <div style={styles.footer}>
          <div style={styles.divider}></div>
          <p style={styles.adminText}>Bukan Tentor?</p>
          
          {/* TOMBOL YANG SUDAH DIPERBAIKI */}
          <button 
            style={styles.buttonAdmin}
            onClick={() => navigate('/admin')} 
          >
            Login Admin
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
  loginBox: { width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', textAlign: 'center' },
  title: { color: '#2c3e50', marginBottom: '5px' },
  subtitle: { color: '#7f8c8d', marginBottom: '30px', fontSize: '14px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '15px' },
  label: { textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#34495e' },
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px' },
  buttonTentor: { padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  footer: { marginTop: '30px' },
  divider: { height: '1px', backgroundColor: '#ecf0f1', marginBottom: '20px' },
  adminText: { fontSize: '12px', color: '#95a5a6', marginBottom: '10px' },
  buttonAdmin: { background: 'none', border: 'none', color: '#7f8c8d', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }
};

export default Login;