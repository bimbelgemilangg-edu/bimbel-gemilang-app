import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { Trash2, Plus, ArrowLeft, Eye, Newspaper, Upload, Link as LinkIcon, Globe, Instagram, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagePoster = () => {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [externalUrl, setExternalUrl] = useState(""); 
  const [imagePreview, setImagePreview] = useState(null); 
  const [base64Image, setBase64Image] = useState(""); 
  const [uploadMethod, setUploadMethod] = useState("link"); 
  const [loading, setLoading] = useState(false);

  // --- FUNGSI CERDAS DENGAN PROTEKSI ERROR ---
  const processSmartUrl = (url) => {
    if (!url || typeof url !== 'string') return "";
    try {
      // 1. Instagram
      if (url.includes("instagram.com/p/") || url.includes("instagram.com/reels/")) {
        const cleanUrl = url.split("?")[0];
        return `${cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/'}media/?size=l`;
      }
      // 2. YouTube
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
      return url;
    } catch (err) {
      return url; // Balikin link asli kalau gagal olah
    }
  };

  const fetchPosters = async () => {
    try {
      const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPosters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Gagal ambil data:", err);
    }
  };

  useEffect(() => { fetchPosters(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    const finalImageUrl = uploadMethod === "upload" ? base64Image : processSmartUrl(externalUrl);

    if(!finalImageUrl || !newTitle) return alert("Judul dan Sumber Gambar wajib diisi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "student_contents"), {
        imageUrl: finalImageUrl,
        originalUrl: externalUrl || finalImageUrl,
        title: newTitle,
        content: newContent,
        method: uploadMethod,
        createdAt: serverTimestamp()
      });
      setNewTitle(""); setNewContent(""); setExternalUrl(""); setImagePreview(null); setBase64Image("");
      fetchPosters();
      alert("Berhasil Terbit!");
    } catch (err) {
      console.error(err);
      alert("Terjadi Error saat menyimpan.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <button onClick={() => navigate('/admin/portal')} style={styles.btnBack}><ArrowLeft size={16}/> Kembali</button>
      <h2 style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Box size={28} color="#f39c12" /> Smart Media Publisher
      </h2>
      
      <div style={styles.inputCard}>
        <div style={styles.tabHeader}>
            <button onClick={() => {setUploadMethod('link'); setImagePreview(null);}} style={{...styles.tabBtn, borderBottom: uploadMethod === 'link' ? '3px solid #3498db' : 'none'}}>
                <Instagram size={16}/> Smart Link
            </button>
            <button onClick={() => {setUploadMethod('upload'); setImagePreview(null);}} style={{...styles.tabBtn, borderBottom: uploadMethod === 'upload' ? '3px solid #3498db' : 'none'}}>
                <Upload size={16}/> Upload File
            </button>
        </div>

        <div style={styles.formGrid}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input placeholder="Judul Pengumuman" value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={styles.input}/>
            <textarea placeholder="Isi berita lengkap..." value={newContent} onChange={e=>setNewContent(e.target.value)} style={styles.textArea}/>
          </div>

          <div style={styles.mediaBox}>
            {uploadMethod === "link" ? (
              <div style={styles.linkInputArea}>
                <input 
                    placeholder="Tempel link IG / YT / Canva..." 
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    style={styles.input}
                />
                {externalUrl && (
                    <img 
                      src={processSmartUrl(externalUrl)} 
                      style={styles.miniPreview} 
                      alt="Preview" 
                      onError={(e) => { e.target.src='https://placehold.co/400x250?text=Preview+Not+Available'; }}
                    />
                )}
              </div>
            ) : (
              <div style={{width: '100%', textAlign: 'center'}}>
                {imagePreview ? (
                  <img src={imagePreview} style={styles.previewImg} alt="Preview" />
                ) : (
                  <label style={styles.uploadLabel}>
                    <Upload size={30} color="#94a3b8" />
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} style={styles.btnSave}>
          {loading ? "Memproses..." : "Publikasikan Sekarang"}
        </button>
      </div>

      <div style={styles.grid}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <div style={{...styles.imgPreview, backgroundImage: `url(${p.imageUrl})`}}></div>
            <div style={{padding: '12px'}}>
                <b style={styles.pTitle}>{p.title}</b>
                <div style={styles.actionArea}>
                    <button onClick={() => deleteDoc(doc(db, "student_contents", p.id)).then(fetchPosters)} style={styles.btnDel}><Trash2 size={16}/></button>
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
    tabHeader: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9' },
    tabBtn: { background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' },
    formGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '15px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    textArea: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    mediaBox: { border: '2px dashed #f1f5f9', borderRadius: '12px', padding: '15px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' },
    linkInputArea: { display: 'flex', flexDirection: 'column', width: '100%' },
    miniPreview: { width: '100%', height: '100px', objectFit: 'cover', marginTop: '10px', borderRadius: '8px' },
    uploadLabel: { cursor: 'pointer', padding: '20px', display: 'flex', justifyContent: 'center', width: '100%' },
    previewImg: { width: '100%', borderRadius: '8px', maxHeight: '150px', objectFit: 'cover' },
    btnSave: { background: '#2c3e50', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
    posterItem: { background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' },
    imgPreview: { width: '100%', aspectRatio: '16/9', backgroundSize: 'cover', backgroundPosition: 'center' },
    pTitle: { fontSize: '14px', color: '#2c3e50', display: 'block' },
    actionArea: { display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' },
    btnDel: { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }
};

export default ManagePoster;