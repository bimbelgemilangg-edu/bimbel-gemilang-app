import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { Trash2, Plus, ArrowLeft, Eye, Newspaper, Upload, Instagram, Box, Zap } from 'lucide-react';
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

  // --- FUNGSI HACKER: SMART URL EXTRACTOR ---
  const processSmartUrl = (url) => {
    if (!url || typeof url !== 'string') return "";
    try {
      // 1. Bersihkan link dari kode tracking (seperti ?utm_source=...)
      const cleanUrl = url.split("?")[0];

      // 2. Jika ini link YouTube (Tarik Thumbnail Kualitas Tinggi)
      if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
        const videoId = cleanUrl.includes("v=") ? url.split("v=")[1]?.split("&")[0] : cleanUrl.split("/").pop();
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }

      // 3. Jika sudah berupa link gambar langsung (.jpg, .png)
      if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        return cleanUrl;
      }

      // 4. THE HACKER TRICK: Untuk Instagram, Canva, TikTok, Berita, dll.
      // Kita gunakan API Microlink untuk mencuri Meta Image (OG:Image) dari website tersebut.
      return `https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}&embed=image.url`;
      
    } catch (err) {
      return url; // Jika gagal, kembalikan link aslinya
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

  // --- FUNGSI HACKER: BASE64 IMAGE ENCODER ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Mengubah file fisik menjadi string kode (Base64)
        setImagePreview(reader.result);
        setBase64Image(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Terapkan smart ekstrak sebelum masuk database
    const finalImageUrl = uploadMethod === "upload" ? base64Image : processSmartUrl(externalUrl);

    if(!finalImageUrl || !newTitle) return alert("Judul dan Sumber Gambar wajib diisi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "student_contents"), {
        imageUrl: finalImageUrl,
        originalUrl: uploadMethod === "link" ? externalUrl : finalImageUrl, // Simpan link IG asli
        title: newTitle,
        content: newContent,
        method: uploadMethod,
        createdAt: serverTimestamp()
      });
      setNewTitle(""); setNewContent(""); setExternalUrl(""); setImagePreview(null); setBase64Image("");
      fetchPosters();
      alert("Boom! Konten berhasil diterbitkan ke sistem! 🚀");
    } catch (err) {
      console.error(err);
      alert("Sistem Keamanan mendeteksi error saat menyimpan.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <button onClick={() => navigate('/admin/portal')} style={styles.btnBack}><ArrowLeft size={16}/> Kembali</button>
      <h2 style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Zap size={28} color="#f39c12" /> Smart Media Publisher
      </h2>
      <p style={{color: '#7f8c8d', marginTop: '-10px', marginBottom: '25px'}}>Sistem otomatis mengekstrak gambar dari link apapun atau mengubah file upload menjadi kode.</p>
      
      <div style={styles.inputCard}>
        <div style={styles.tabHeader}>
            <button onClick={() => {setUploadMethod('link'); setImagePreview(null);}} style={{...styles.tabBtn, borderBottom: uploadMethod === 'link' ? '3px solid #3498db' : 'none', color: uploadMethod === 'link' ? '#3498db' : '#94a3b8'}}>
                <Instagram size={16}/> Smart URL Extract
            </button>
            <button onClick={() => {setUploadMethod('upload'); setImagePreview(null);}} style={{...styles.tabBtn, borderBottom: uploadMethod === 'upload' ? '3px solid #3498db' : 'none', color: uploadMethod === 'upload' ? '#3498db' : '#94a3b8'}}>
                <Upload size={16}/> Upload PC/HP
            </button>
        </div>

        <div style={styles.formGrid}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input placeholder="Judul Postingan..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={styles.input}/>
            <textarea placeholder="Isi detail pengumuman (opsional)..." value={newContent} onChange={e=>setNewContent(e.target.value)} style={styles.textArea}/>
          </div>

          <div style={styles.mediaBox}>
            {uploadMethod === "link" ? (
              <div style={styles.linkInputArea}>
                <div style={styles.smartBadge}>⚡ Auto-Extract Mode Aktif</div>
                <input 
                    placeholder="Tempel link IG / YT / Canva di sini..." 
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    style={styles.input}
                />
                {externalUrl && (
                    <div style={styles.previewWrapper}>
                        <img 
                          src={processSmartUrl(externalUrl)} 
                          style={styles.miniPreview} 
                          alt="Preview" 
                          onError={(e) => { e.target.src='https://placehold.co/400x250?text=Sistem+Mengekstrak...'; }}
                        />
                        <span style={styles.previewTag}>Preview AI</span>
                    </div>
                )}
              </div>
            ) : (
              <div style={{width: '100%', textAlign: 'center'}}>
                {imagePreview ? (
                  <div style={styles.previewWrapper}>
                    <img src={imagePreview} style={styles.previewImg} alt="Preview" />
                    <button onClick={() => {setImagePreview(null); setBase64Image("");}} style={styles.btnRemoveImg}>Ganti File</button>
                  </div>
                ) : (
                  <label style={styles.uploadLabel}>
                    <Upload size={40} color="#3498db" style={{marginBottom: '10px'}} />
                    <b style={{color: '#2c3e50', fontSize: '14px'}}>Pilih Gambar dari Komputer/HP</b>
                    <span style={{color: '#94a3b8', fontSize: '12px'}}>Sistem otomatis mengubahnya ke kode Base64</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} style={styles.btnSave}>
          {loading ? "Menyuntikkan Data ke Server..." : "Publikasikan ke Siswa"}
        </button>
      </div>

      <h4 style={{marginBottom: '15px'}}>Media Terpublikasi</h4>
      <div style={styles.grid}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <div style={{...styles.imgPreview, backgroundImage: `url(${p.imageUrl})`}}>
                <div style={styles.methodBadge}>{p.method === 'upload' ? '📁 Lokal' : '🌐 Cloud'}</div>
            </div>
            <div style={{padding: '15px'}}>
                <b style={styles.pTitle}>{p.title}</b>
                <div style={styles.actionArea}>
                    <button onClick={() => window.open(p.originalUrl, '_blank')} style={styles.btnView}>
                        <Eye size={14}/> Kunjungi Sumber
                    </button>
                    <button onClick={() => deleteDoc(doc(db, "student_contents", p.id)).then(fetchPosters)} style={styles.btnDel}>
                        <Trash2 size={16}/>
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
    inputCard: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' },
    tabHeader: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9' },
    tabBtn: { background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' },
    formGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px', marginBottom: '20px' },
    input: { padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc' },
    textArea: { padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '130px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#f8fafc', resize: 'vertical' },
    mediaBox: { border: '2px dashed #cbd5e1', borderRadius: '15px', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px', position: 'relative' },
    smartBadge: { alignSelf: 'flex-start', background: '#dcfce7', color: '#166534', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', display: 'inline-block' },
    linkInputArea: { display: 'flex', flexDirection: 'column', width: '100%' },
    previewWrapper: { position: 'relative', width: '100%', marginTop: '15px', textAlign: 'center' },
    miniPreview: { width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    previewTag: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '5px', fontWeight: 'bold' },
    uploadLabel: { cursor: 'pointer', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' },
    previewImg: { width: '100%', borderRadius: '10px', maxHeight: '160px', objectFit: 'cover' },
    btnRemoveImg: { position: 'absolute', top: -10, right: -10, background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
    btnSave: { background: 'linear-gradient(135deg, #3498db, #2980b9)', color: 'white', border: 'none', padding: '16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', width: '100%', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(52, 152, 219, 0.4)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
    posterItem: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', transition: '0.3s' },
    imgPreview: { width: '100%', aspectRatio: '16/9', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', backgroundColor: '#e2e8f0' },
    methodBadge: { position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', color: '#2c3e50', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
    pTitle: { fontSize: '15px', color: '#1e293b', display: 'block', fontWeight: '700' },
    actionArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', marginTop: '10px', borderTop: '1px solid #f1f5f9' },
    btnView: { background: '#f1f5f9', border: 'none', color: '#3b82f6', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' },
    btnDel: { background: '#fee2e2', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }
};

export default ManagePoster;