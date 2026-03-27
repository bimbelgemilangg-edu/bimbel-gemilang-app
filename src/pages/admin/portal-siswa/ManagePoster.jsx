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

  // --- FUNGSI CERDAS: TRANSFORMER URL ---
  const processSmartUrl = (url) => {
    if (!url) return "";
    
    // 1. Jika ini link Instagram Post
    if (url.includes("instagram.com/p/") || url.includes("instagram.com/reels/")) {
      // Hilangkan query string (setelah tanda ?)
      const cleanUrl = url.split("?")[0];
      // Trik Instagram: Tambahkan /media/?size=l untuk mendapatkan file gambar aslinya secara publik
      return `${cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/'}media/?size=l`;
    }

    // 2. Jika ini link YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    // 3. Jika link Canva atau lainnya, kita kembalikan URL aslinya 
    // (Akan ditangani oleh CSS placeholder jika gagal muat)
    return url;
  };

  const fetchPosters = async () => {
    const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setPosters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    
    // Gunakan fungsi cerdas sebelum simpan
    const finalImageUrl = uploadMethod === "upload" ? base64Image : processSmartUrl(externalUrl);

    if(!finalImageUrl || !newTitle) return alert("Judul dan Sumber (Link/File) wajib diisi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "student_contents"), {
        imageUrl: finalImageUrl,
        originalUrl: externalUrl || "", // Simpan link asli untuk ditekan siswa nantinya
        title: newTitle,
        content: newContent,
        method: uploadMethod,
        createdAt: serverTimestamp()
      });
      setNewTitle(""); setNewContent(""); setExternalUrl(""); setImagePreview(null); setBase64Image("");
      fetchPosters();
      alert("Sistem Berhasil Mengolah & Menerbitkan Konten!");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <button onClick={() => navigate('/admin/portal')} style={styles.btnBack}><ArrowLeft size={16}/> Kembali ke Hub</button>
      <h2 style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Box size={28} color="#f39c12" /> Smart Media Publisher
      </h2>
      
      <div style={styles.inputCard}>
        <div style={styles.tabHeader}>
            <button 
                onClick={() => setUploadMethod('link')} 
                style={{...styles.tabBtn, borderBottom: uploadMethod === 'link' ? '3px solid #3498db' : 'none', color: uploadMethod === 'link' ? '#3498db' : '#94a3b8'}}
            >
                <Instagram size={16}/> Smart Link (IG/YT/Web)
            </button>
            <button 
                onClick={() => setUploadMethod('upload')} 
                style={{...styles.tabBtn, borderBottom: uploadMethod === 'upload' ? '3px solid #3498db' : 'none', color: uploadMethod === 'upload' ? '#3498db' : '#94a3b8'}}
            >
                <Upload size={16}/> Upload File
            </button>
        </div>

        <div style={styles.formGrid}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input placeholder="Judul Pengumuman" value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={styles.input}/>
            <textarea placeholder="Isi berita lengkap (Press Release)..." value={newContent} onChange={e=>setNewContent(e.target.value)} style={styles.textArea}/>
          </div>

          <div style={styles.mediaBox}>
            {uploadMethod === "link" ? (
              <div style={styles.linkInputArea}>
                <div style={styles.smartBadge}>Auto-Detect Mode</div>
                <input 
                    placeholder="Tempel link Instagram / Canva / Drive di sini..." 
                    value={externalUrl}
                    onChange={(e) => {
                        setExternalUrl(e.target.value);
                        setImagePreview(processSmartUrl(e.target.value)); // Preview langsung
                    }}
                    style={styles.input}
                />
                {imagePreview && uploadMethod === 'link' && (
                    <img src={imagePreview} style={styles.miniPreview} alt="Preview Otomatis" onError={(e) => e.target.src='https://placehold.co/600x400?text=Link+Terdeteksi'} />
                )}
              </div>
            ) : (
              imagePreview ? (
                <div style={styles.previewContainer}>
                  <img src={imagePreview} style={styles.previewImg} alt="Preview" />
                  <button onClick={() => {setImagePreview(null); setBase64Image("");}} style={styles.btnRemoveImg}>Ganti</button>
                </div>
              ) : (
                <label style={styles.uploadLabel}>
                  <Upload size={30} color="#94a3b8" />
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                </label>
              )
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} style={styles.btnSave}>
          {loading ? "Sistem sedang mengolah data..." : "Publikasikan ke Dashboard Siswa"}
        </button>
      </div>

      <div style={styles.grid}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <div style={{...styles.imgPreview, backgroundImage: `url(${p.imageUrl})`}}>
               <div style={styles.methodBadge}>{p.originalUrl.includes('instagram') ? 'IG Post' : 'Media'}</div>
            </div>
            <div style={{padding: '12px'}}>
                <b style={styles.pTitle}>{p.title}</b>
                <div style={styles.actionArea}>
                    <button style={styles.btnView} onClick={() => window.open(p.originalUrl || p.imageUrl, '_blank')}><Eye size={14}/> Cek Sumber</button>
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
    tabHeader: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9' },
    tabBtn: { background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '15px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    textArea: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    mediaBox: { border: '2px solid #f1f5f9', borderRadius: '12px', padding: '15px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    smartBadge: { alignSelf: 'center', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px' },
    linkInputArea: { display: 'flex', flexDirection: 'column', width: '100%' },
    miniPreview: { width: '100%', height: '80px', objectFit: 'cover', marginTop: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' },
    uploadLabel: { cursor: 'pointer', padding: '30px', display: 'flex', justifyContent: 'center', width: '100%' },
    previewContainer: { position: 'relative', width: '100%' },
    previewImg: { width: '100%', borderRadius: '8px' },
    btnRemoveImg: { position: 'absolute', top: 5, right: 5, background: 'rgba(231, 76, 60, 0.8)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' },
    btnSave: { background: '#2c3e50', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
    posterItem: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    imgPreview: { width: '100%', aspectRatio: '16/9', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
    methodBadge: { position: 'absolute', top: 8, left: 8, background: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    pTitle: { fontSize: '14px', color: '#2c3e50', marginBottom: '10px', display: 'block' },
    actionArea: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' },
    btnView: { background: 'none', border: 'none', color: '#3498db', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
    btnDel: { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }
};

export default ManagePoster;