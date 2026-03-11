import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import Sidebar from '../../components/Sidebar'; 

const TeacherProfile = () => {
  const [guru, setGuru] = useState(null);
  const [wa, setWa] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const saved = JSON.parse(localStorage.getItem('teacherData'));
      if (saved) {
        const q = query(collection(db, "teachers"), where("email", "==", saved.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setGuru(data);
          setWa(data.wa || "");
          setFotoUrl(data.fotoUrl || "");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // KOMPRESI GAMBAR AGAR TIDAK LEBIH DARI 1MB
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFotoUrl(dataUrl);
        };
      };
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "teachers", guru.id), { 
        wa: wa || "", 
        fotoUrl: fotoUrl || "" 
      });
      alert("✅ Profil berhasil diperbarui!");
      fetchProfile();
    } catch (error) {
      alert("Gagal memperbarui profil: " + error.message);
    }
  };

  if (loading) return <div style={{padding:100, textAlign:'center'}}>Memuat Profil...</div>;
  if (!guru) return <div style={{padding:100, textAlign:'center'}}>Data Tidak Ditemukan.</div>;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.container}>
        <div style={styles.card}>
            <div style={{textAlign: 'center', marginBottom: 20}}>
                <img src={fotoUrl || "https://via.placeholder.com/120"} style={styles.profileImg} alt="Profil" />
                <h2 style={{margin: '10px 0 5px 0'}}>{guru.nama}</h2>
                <p style={{color: '#7f8c8d', margin: 0}}>{guru.mapel} | {guru.cabang || 'Pusat'}</p>
            </div>

            <div style={styles.kpiBox}>
                <p style={{margin:0, fontSize:12, fontWeight:'bold', color:'#856404'}}>SKOR KPI SAYA</p>
                <div style={{fontSize:45, fontWeight:'bold', color:'#2c3e50'}}>{parseFloat(guru.kpiScore || 0).toFixed(1)}</div>
                <div style={{color:'#f1c40f', fontSize:22}}>
                    {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < Math.round(guru.kpiScore || 0) ? "★" : "☆"}</span>
                    ))}
                </div>
            </div>

            <form onSubmit={handleUpdate} style={{marginTop:25}}>
                <label style={styles.label}>No. WhatsApp Aktif</label>
                <input style={styles.input} value={wa} onChange={e=>setWa(e.target.value)} placeholder="08..." />
                
                <label style={styles.label}>Ganti Foto Profil (Upload File)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{marginBottom:20, display:'block', fontSize:12}} />
                
                <button type="submit" style={styles.btnSave}>Update Profil</button>
            </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
    container: { marginLeft: '250px', padding: '40px', width: '100%', background: '#f4f7f6', minHeight: '100vh' },
    card: { background:'white', padding:35, borderRadius:20, boxShadow:'0 10px 30px rgba(0,0,0,0.08)', maxWidth:'450px', margin:'0 auto' },
    profileImg: { width:120, height:120, borderRadius:'50%', objectFit:'cover', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    kpiBox: { background:'linear-gradient(135deg, #fff9c4 0%, #fff176 100%)', padding:20, borderRadius:15, textAlign:'center', marginTop:10 },
    label: { fontSize:12, fontWeight:'bold', color:'#34495e', display:'block', marginBottom:5 },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: 15, boxSizing: 'border-box' },
    btnSave: { width:'100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }
};

export default TeacherProfile;