import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { Trash2, Plus, ArrowLeft, Eye, Newspaper, Upload, Link as LinkIcon, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagePoster = () => {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [externalUrl, setExternalUrl] = useState(""); // Untuk link IG/Canva/Drive
  const [imagePreview, setImagePreview] = useState(null); 
  const [base64Image, setBase64Image] = useState(""); 
  const [uploadMethod, setUploadMethod] = useState("link"); // 'link' atau 'upload'
  const [loading, setLoading] = useState(false);

  const fetchPosters = async () => {
    const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setPosters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchPosters(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) {
        alert("Ukuran gambar terlalu besar! Maksimal 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setBase64Image(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalImageUrl = uploadMethod === "upload" ? base64Image : externalUrl;

    if(!finalImageUrl || !newTitle) return alert("Judul dan Sumber Gambar (Link/File) wajib diisi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "student_contents"), {
        imageUrl: finalImageUrl,
        title: newTitle,
        content: newContent,
        method: uploadMethod,
        createdAt: serverTimestamp()
      });
      setNewTitle(""); setNewContent(""); setExternalUrl(""); setImagePreview(null); setBase64Image("");
      fetchPosters();
      alert("Konten Berhasil Dipublikasikan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan konten.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <button onClick={() => navigate('/admin/portal')} style={styles.btnBack}><ArrowLeft size={16}/> Kembali ke Hub</button>
      <h2 style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Newspaper size={28} color="#3498db" /> Publikasi Berita & Media
      </h2>
      
      <div style={styles.inputCard}>
        <div style={styles.tabHeader}>
            <button 
                onClick={() => setUploadMethod('link')} 
                style={{...styles.tabBtn, borderBottom: uploadMethod === 'link' ? '3px solid #3498db' : 'none', color: uploadMethod === 'link' ? '#3498db' : '#94a3b8'}}
            >
                <LinkIcon size={16}/> Pakai Link (IG / Canva / Drive)
            </button>
            <button 
                onClick={() => setUploadMethod('upload')} 
                style={{...styles.tabBtn, borderBottom: uploadMethod === 'upload' ? '3px solid #3498db' : 'none', color: uploadMethod === 'upload' ? '#3498db' : '#94a3b8'}}
            >
                <Upload size={16}/> Upload File Langsung
            </button>
        </div>

        <div style={styles.formGrid}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input 
              placeholder="Judul Postingan / Berita" 
              value={newTitle} 
              onChange={e=>setNewTitle(e.target.value)} 
              style={styles.input}
            />
            <textarea 
              placeholder="Tulis Press Release atau detail berita di sini..." 
              value={newContent} 
              onChange={e=>setNewContent(e.target.value)} 
              style={styles.textArea}
            />
          </div>

          <div style={styles.mediaBox}>
            {uploadMethod === "link" ? (
              <div style={styles.linkInputArea}>
                <Globe size={40} color="#cbd5e1" style={{marginBottom: '10px'}}/>
                <p style={{fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '10px'}}>Masukkan URL postingan Instagram, <br/> thumbnail Canva, atau link gambar Drive.</p>
                <input 
                    placeholder="https://www.instagram.com/p/..." 
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    style={styles.input}
                />
              </div>
            ) : (
              imagePreview ? (
                <div style={styles.previewContainer}>
                  <img src={imagePreview} style={styles.previewImg} alt="Preview" />
                  <button onClick={() => {setImagePreview(null); setBase64Image("");}} style={styles.btnRemoveImg}>Ganti Gambar</button>
                </div>
              ) : (
                <label style={styles.uploadLabel}>
                  <Upload size={30} color="#94a3b8" />
                  <span style={{fontSize: '13px', color: '#64748b'}}>Pilih File Gambar</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                </label>
              )
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} style={styles.btnSave}>
          <Plus size={18} /> {loading ? "Sedang Memproses..." : "Terbitkan Konten"}
        </button>
      </div>

      <h4 style={{marginBottom: '15px'}}>Konten Berjalan</h4>
      <div style={styles.grid}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <div style={{...styles.imgPreview, backgroundImage: `url(${p.imageUrl})`, backgroundColor: '#e2e8f0'}}>
               <div style={styles.methodBadge}>{p.method === 'link' ? '🔗 Link' : '📁 File'}</div>
            </div>
            <div style={{padding: '15px'}}>
                <b style={styles.pTitle}>{p.title}</b>
                <p style={styles.pDesc}>{p.content ? p.content.substring(0, 50) + "..." : "Klik untuk baca selengkapnya"}</p>
                <div style={styles.actionArea}>
                    <button style={styles.btnView} onClick={() => window.open(p.imageUrl, '_blank')}><Eye size={14}/> Cek Sumber</button>
                    <button onClick={() => deleteDoc(doc(db, "student_contents", p.id)).then(fetchPosters)} style={styles.btnDel}>
                        <Trash2 size={14}/>
                    </button>
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
    inputCard: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e2e8f0' },
    tabHeader: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9' },
    tabBtn: { background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '15px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    textArea: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '120px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' },
    mediaBox: { border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', overflow: 'hidden', padding: '10px' },
    linkInputArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
    uploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '20px' },
    previewContainer: { width: '100%', textAlign: 'center' },
    previewImg: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' },
    btnRemoveImg: { background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', marginTop: '5px', borderRadius: '4px' },
    btnSave: { background: '#22c55e', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    posterItem: { background: 'white', borderRadius: '15px', overflow: 'hidden', border: '1px solid #eee' },
    imgPreview: { width: '100%', aspectRatio: '16/9', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
    methodBadge: { position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' },
    pTitle: { fontSize: '15px', color: '#1e293b', fontWeight: 'bold', display: 'block' },
    pDesc: { fontSize: '12px', color: '#64748b', marginTop: '5px' },
    actionArea: { display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' },
    btnView: { background: 'none', border: 'none', color: '#3498db', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    btnDel: { background: '#fff1f1', color: '#ef4444', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }
};

export default ManagePoster;