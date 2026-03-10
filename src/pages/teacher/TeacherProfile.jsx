import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import TeacherLayout from './TeacherLayout'; 

const TeacherProfile = () => {
  const [guru, setGuru] = useState(null);
  const [wa, setWa] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  const fetchProfile = async () => {
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
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "teachers", guru.id), { wa, fotoUrl });
    alert("✅ Profil diperbarui!");
    fetchProfile();
  };

  if (!guru) return <div style={{padding:50, textAlign:'center'}}>Memuat Profil...</div>;

  return (
    <TeacherLayout guru={guru}>
      <div style={{padding: '30px', maxWidth: '600px', margin: '0 auto'}}>
        <div style={{background:'white', padding:30, borderRadius:20, boxShadow:'0 5px 15px rgba(0,0,0,0.05)', textAlign:'center'}}>
            <img src={guru.fotoUrl || "https://via.placeholder.com/100"} style={{width:100, height:100, borderRadius:'50%', objectFit:'cover', marginBottom:15}} />
            <h2 style={{margin:0}}>{guru.nama}</h2>
            <p style={{color:'#666'}}>{guru.mapel} - {guru.cabang || 'Pusat'}</p>

            <div style={{background:'#fff9c4', padding:20, borderRadius:15, marginTop:20}}>
                <p style={{margin:0, fontWeight:'bold', color:'#856404'}}>SKOR KPI ANDA</p>
                <div style={{fontSize:40, fontWeight:'bold', color:'#333'}}>{guru.kpiScore || '5.0'}</div>
                <div style={{color:'#f1c40f', fontSize:20}}>
                    {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < Math.round(guru.kpiScore || 5) ? "★" : "☆"}</span>
                    ))}
                </div>
            </div>

            <form onSubmit={handleUpdate} style={{textAlign:'left', marginTop:30}}>
                <label style={{fontSize:12, fontWeight:'bold'}}>No. WhatsApp</label>
                <input style={styles.input} value={wa} onChange={e=>setWa(e.target.value)} placeholder="08..." />
                
                <label style={{fontSize:12, fontWeight:'bold'}}>Link Foto Profil (URL)</label>
                <input style={styles.input} value={fotoUrl} onChange={e=>setFotoUrl(e.target.value)} />
                
                <button type="submit" style={styles.btnSave}>Update Profil</button>
            </form>
        </div>
      </div>
    </TeacherLayout>
  );
};

const styles = {
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: 15, marginTop:5 },
    btnSave: { width:'100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default TeacherProfile;