import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagePoster = () => {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const fetchPosters = async () => {
    const snap = await getDocs(collection(db, "student_contents"));
    setPosters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchPosters(); }, []);

  const handleSave = async () => {
    if(!newUrl) return alert("URL Gambar wajib diisi!");
    await addDoc(collection(db, "student_contents"), {
      imageUrl: newUrl,
      title: newTitle,
      createdAt: serverTimestamp()
    });
    setNewUrl(""); setNewTitle(""); fetchPosters();
  };

  return (
    <div style={{ padding: '30px' }}>
      <button onClick={() => navigate(-1)} style={styles.btnBack}><ArrowLeft size={16}/> Kembali</button>
      <h3>🖼️ Kelola Poster Slider</h3>
      
      <div style={styles.inputCard}>
        <input placeholder="Judul Poster" value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={styles.input}/>
        <input placeholder="URL Gambar (16:9)" value={newUrl} onChange={e=>setNewUrl(e.target.value)} style={styles.input}/>
        <button onClick={handleSave} style={styles.btnSave}>Pasang Poster</button>
      </div>

      <div style={styles.list}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <img src={p.imageUrl} style={styles.imgPreview} alt="poster"/>
            <div style={{padding: '10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span>{p.title}</span>
                <button onClick={() => deleteDoc(doc(db, "student_contents", p.id)).then(fetchPosters)} style={styles.btnDel}><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
    btnBack: { background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' },
    inputCard: { background: 'white', padding: '20px', borderRadius: '12px', display: 'flex', gap: '10px', marginBottom: '20px' },
    input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' },
    btnSave: { background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
    list: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    posterItem: { background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    imgPreview: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
    btnDel: { background: '#ff7675', color: 'white', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer' }
};

export default ManagePoster;