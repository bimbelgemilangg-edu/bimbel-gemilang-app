import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import SidebarGuru from '../../components/SidebarGuru'; 

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
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

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
          setFotoUrl(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "teachers", guru.id), { wa, fotoUrl });
      alert("✅ Profil diperbarui!");
      fetchProfile();
    } catch (error) { alert("Gagal: " + error.message); }
  };

  if (loading) return <div style={{padding:100, textAlign:'center'}}>Memuat...</div>;

  return (
    <div style={{ display: 'flex' }}>
      <SidebarGuru />
      <div style={{ marginLeft: '250px', padding: '40px', width: 'calc(100% - 250px)', background: '#f4f7f6', minHeight: '100vh' }}>
        <div style={{ background:'white', padding:35, borderRadius:20, boxShadow:'0 10px 30px rgba(0,0,0,0.08)', maxWidth:'450px', margin:'0 auto' }}>
            <div style={{textAlign: 'center', marginBottom: 20}}>
                <img src={fotoUrl || "https://via.placeholder.com/120"} style={{ width:120, height:120, borderRadius:'50%', objectFit:'cover', border: '4px solid #fff' }} alt="Profil" />
                <h2 style={{margin: '10px 0 5px 0'}}>{guru?.nama}</h2>
                <p style={{color: '#7f8c8d'}}>{guru?.mapel}</p>
            </div>

            <div style={{ background:'linear-gradient(135deg, #fff9c4 0%, #fff176 100%)', padding:20, borderRadius:15, textAlign:'center' }}>
                <p style={{margin:0, fontSize:12, fontWeight:'bold'}}>SKOR KPI SAYA</p>
                <div style={{fontSize:45, fontWeight:'bold'}}>{parseFloat(guru?.kpiScore || 0).toFixed(1)}</div>
            </div>

            <form onSubmit={handleUpdate} style={{marginTop:25}}>
                <label style={{fontSize:12, fontWeight:'bold'}}>WhatsApp</label>
                <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: 15 }} value={wa} onChange={e=>setWa(e.target.value)} />
                <label style={{fontSize:12, fontWeight:'bold'}}>Ganti Foto</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{marginBottom:20, display:'block'}} />
                <button type="submit" style={{ width:'100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '10px', fontWeight:'bold', cursor:'pointer' }}>Update Profil</button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;