import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State Form (Default Data Lama)
  const [formData, setFormData] = useState({
    nama: "Adit Sopo",
    kelas: "4 SD",
    sekolah: "SDN 1 Glagahagung",
    hp: "08123456789"
  });

  const handleSave = () => {
    alert("Data berhasil diperbarui!");
    navigate('/admin/students');
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2>✏️ Edit Data Siswa (ID: {id})</h2>
        <div style={styles.card}>
          <div style={styles.formGroup}>
            <label>Nama Lengkap</label>
            <input 
              style={styles.input} 
              value={formData.nama} 
              onChange={(e) => setFormData({...formData, nama: e.target.value})} 
            />
          </div>
          <div style={styles.formGroup}>
            <label>Kelas</label>
            <select style={styles.input} value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})}>
              <option>4 SD</option>
              <option>5 SD</option>
              <option>6 SD</option>
              <option>7 SMP</option>
              <option>8 SMP</option>
              <option>9 SMP</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label>Asal Sekolah</label>
            <input style={styles.input} value={formData.sekolah} onChange={(e) => setFormData({...formData, sekolah: e.target.value})} />
          </div>
          <div style={styles.formGroup}>
            <label>No HP Ortu</label>
            <input style={styles.input} value={formData.hp} onChange={(e) => setFormData({...formData, hp: e.target.value})} />
          </div>
          
          <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
             <button style={styles.btnSave} onClick={handleSave}>Simpan Perubahan</button>
             <button style={styles.btnCancel} onClick={() => navigate('/admin/students')}>Batal</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
  card: { background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btnSave: { padding: '10px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },
  btnCancel: { padding: '10px 20px', background: '#ccc', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default EditStudent;