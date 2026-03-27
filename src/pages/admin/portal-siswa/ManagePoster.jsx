import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { Trash2, Plus, ArrowLeft, Eye, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagePoster = () => {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState(""); // Isi berita detail
  const [loading, setLoading] = useState(false);

  const fetchPosters = async () => {
    const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setPosters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchPosters(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if(!newUrl || !newTitle) return alert("Judul dan URL Gambar wajib diisi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "student_contents"), {
        imageUrl: newUrl,
        title: newTitle,
        content: newContent, // Press release detail
        createdAt: serverTimestamp()
      });
      setNewUrl(""); setNewTitle(""); setNewContent(""); 
      fetchPosters();
      alert("Berita Berhasil Dipublikasikan!");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <button onClick={() => navigate('/admin/portal')} style={styles.btnBack}><ArrowLeft size={16}/> Kembali ke Hub</button>
      <h2 style={{ color: '#2c3e50' }}><Newspaper size={24} /> Publikasi Berita & Poster</h2>
      
      {/* FORM INPUT BERITA */}
      <div style={styles.inputCard}>
        <h4 style={{marginTop: 0}}>Buat Konten Baru</h4>
        <div style={styles.formGrid}>
          <input placeholder="Judul Berita / Judul Poster" value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={styles.input}/>
          <input placeholder="URL Gambar (Rasio 16:9 disarankan)" value={newUrl} onChange={e=>setNewUrl(e.target.value)} style={styles.input}/>
        </div>
        <textarea 
          placeholder="Tulis isi berita atau detail pengumuman di sini (Press Release)..." 
          value={newContent} 
          onChange={e=>setNewContent(e.target.value)} 
          style={styles.textArea}
        />
        <button onClick={handleSave} disabled={loading} style={styles.btnSave}>
          {loading ? "Memproses..." : "Terbitkan Berita"}
        </button>
      </div>

      {/* GRID DAFTAR BERITA */}
      <h4 style={{marginBottom: '15px'}}>Konten yang Sedang Tayang</h4>
      <div style={styles.grid}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <div style={{...styles.imgPreview, backgroundImage: `url(${p.imageUrl})`}}>
               <div style={styles.dateBadge}>{p.createdAt?.toDate().toLocaleDateString('id-ID')}</div>
            </div>
            <div style={{padding: '15px'}}>
                <b style={styles.pTitle}>{p.title}</b>
                <p style={styles.pDesc}>{p.content ? p.content.substring(0, 60) + "..." : "Tanpa deskripsi"}</p>
                <div style={styles.actionArea}>
                    <button style={styles.btnView}><Eye size={14}/> Cek Preview</button>
                    <button onClick={() => deleteDoc(doc(db, "student_contents", p.id)).then(fetchPosters)} style={styles.btnDel}><Trash2 size={14}/></button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
    btnBack: { background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' },
    inputCard: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' },
    textArea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', marginBottom: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    btnSave: { background: '#27ae60', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    posterItem: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #eee' },
    imgPreview: { width: '100%', aspectRatio: '16/9', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
    dateBadge: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '5px', fontSize: '10px' },
    pTitle: { fontSize: '16px', color: '#2c3e50', display: 'block', marginBottom: '5px' },
    pDesc: { fontSize: '13px', color: '#7f8c8d', margin: 0 },
    actionArea: { display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' },
    btnView: { background: '#f1f2f6', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', color: '#2f3542' },
    btnDel: { background: '#fff5f5', color: '#e74c3c', border: '1px solid #fed7d7', padding: '6px', borderRadius: '6px', cursor: 'pointer' }
};

export default ManagePoster;