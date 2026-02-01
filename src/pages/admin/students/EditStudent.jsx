import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  // State Form
  const [formData, setFormData] = useState({
    nama: "",
    kelasSekolah: "",
    sekolah: "", // jika ada field sekolah
    ortu: { ayah: "", hp: "" }
  });

  // 1. FETCH DATA SISWA DARI FIREBASE
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const docRef = doc(db, "students", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            nama: data.nama || "",
            kelasSekolah: data.kelasSekolah || "",
            sekolah: data.sekolah || "",
            ortu: data.ortu || { ayah: "", hp: "" }
          });
        } else {
          alert("Siswa tidak ditemukan!");
          navigate('/admin/students');
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate]);

  // 2. SIMPAN PERUBAHAN KE FIREBASE
  const handleSave = async () => {
    try {
      const docRef = doc(db, "students", id);
      await updateDoc(docRef, {
        nama: formData.nama,
        kelasSekolah: formData.kelasSekolah,
        sekolah: formData.sekolah, // Opsional jika ada
        ortu: formData.ortu
      });
      alert("✅ Data berhasil diperbarui!");
      navigate('/admin/students');
    } catch (e) {
      console.error(e);
      alert("Gagal update data.");
    }
  };

  if(loading) return <div style={{padding:50}}>Loading Data...</div>;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2>✏️ Edit Data Siswa</h2>
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
            <label>Kelas Sekolah</label>
            <select style={styles.input} value={formData.kelasSekolah} onChange={(e) => setFormData({...formData, kelasSekolah: e.target.value})}>
              <option>4 SD</option>
              <option>5 SD</option>
              <option>6 SD</option>
              <option>7 SMP</option>
              <option>8 SMP</option>
              <option>9 SMP</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label>Nama Ayah</label>
            <input style={styles.input} value={formData.ortu.ayah} onChange={(e) => setFormData({...formData, ortu: {...formData.ortu, ayah: e.target.value}})} />
          </div>
          <div style={styles.formGroup}>
            <label>No HP Ortu</label>
            <input style={styles.input} value={formData.ortu.hp} onChange={(e) => setFormData({...formData, ortu: {...formData.ortu, hp: e.target.value}})} />
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
  card: { background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btnSave: { padding: '10px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },
  btnCancel: { padding: '10px 20px', background: '#ccc', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default EditStudent;