import React from 'react';

export default function App() {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f8fafc',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        padding: '50px',
        backgroundColor: 'white',
        borderRadius: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        border: '8px solid #2563eb'
      }}>
        <h1 style={{ 
          fontSize: '60px', 
          fontWeight: '900', 
          color: '#1e293b',
          margin: 0,
          letterSpacing: '-2px'
        }}>
          WILDAN <span style={{ color: '#2563eb' }}>BIMBEL</span>
        </h1>
        <p style={{ 
          marginTop: '20px', 
          fontWeight: 'bold', 
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Status Sistem: <span style={{ color: '#059669' }}>TERKONEKSI</span>
        </p>
      </div>
      <p style={{ marginTop: '30px', color: '#cbd5e1', fontSize: '12px' }}>
        Jika Anda melihat layar ini, berarti server Anda AKTIF.
      </p>
    </div>
  );
}