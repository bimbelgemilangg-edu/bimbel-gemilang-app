import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

const TeacherProfile = () => {
  const [guru, setGuru] = useState(null);
  const [wa, setWa] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Memuat...</div>;

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: isMobile ? 10 : 20 }}>
      <div style={{ background: 'white', padding: isMobile ? 20 : 30, borderRadius: 18, boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        
        {/* FOTO PROFIL */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img 
            src={fotoUrl || "https://via.placeholder.com/120"} 
            style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e2e8f0' }} 
            alt="Profil" 
          />
          <h2 style={{ margin: '10px 0 4px 0', fontSize: 20, color: '#1e293b' }}>{guru?.nama}</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{guru?.mapel || '-'}</p>
        </div>

        {/* KPI */}
        <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: 18, borderRadius: 14, textAlign: 'center', marginBottom: 25 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: '700', color: '#b45309' }}>SKOR KPI SAYA</p>
          <div style={{ fontSize: 38, fontWeight: '900', color: '#1e293b' }}>{parseFloat(guru?.kpiScore || 0).toFixed(1)}</div>
        </div>

        {/* FORM */}
        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ fontSize: 12, fontWeight: '700', color: '#64748b', display: 'block', marginBottom: 5 }}>Nomor WhatsApp</label>
            <input 
              style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} 
              value={wa} 
              onChange={e => setWa(e.target.value)} 
              placeholder="08xxx"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: '700', color: '#64748b', display: 'block', marginBottom: 5 }}>Ganti Foto Profil</label>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 12 }} />
          </div>

          <button 
            type="submit" 
            style={{ 
              width: '100%', padding: 12, background: '#1e293b', color: 'white', 
              border: 'none', borderRadius: 10, fontWeight: '700', cursor: 'pointer', 
              fontSize: 14 
            }}
          >
            💾 Update Profil
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherProfile;