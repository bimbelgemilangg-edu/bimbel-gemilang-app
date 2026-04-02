import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { Trash2, Plus, ArrowLeft, Eye, Upload, Instagram, Box, MoveVertical, Globe, UserCheck, Users } from 'lucide-react';
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
  const [imgPosition, setImgPosition] = useState("center"); 
  const [targetPortal, setTargetPortal] = useState("Siswa"); // Fitur Baru: Target Distribusi
  const [loading, setLoading] = useState(false);

  // --- 1. SMART URL BYPASS ENGINE (STAY PERSISTENT) ---
  const processSmartUrl = (url) => {
    if (!url || typeof url !== 'string') return "";
    try {
      if (url.includes("instagram.com")) {
        const cleanUrl = url.split("?")[0].replace(/\/$/, "");
        return `https://corsproxy.io/?${encodeURIComponent(cleanUrl + '/media/?size=l')}`;
      }
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
      return url;
    } catch (err) {
      return url; 
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

  // --- 2. ENGINE KOMPRESI TINGKAT DEWA (STAY PERSISTENT) ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setImagePreview(compressedBase64);
        setBase64Image(compressedBase64);
      }
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalImageUrl = uploadMethod === "upload" ? base64Image : processSmartUrl(externalUrl);

    if(!finalImageUrl || !newTitle) return alert("Sistem: Judul dan Gambar belum lengkap!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "student_contents"), {
        imageUrl: finalImageUrl,
        originalUrl: externalUrl || finalImageUrl,
        title: newTitle,
        content: newContent,
        method: uploadMethod,
        imgPosition: imgPosition,
        targetPortal: targetPortal, // DATA BARU: Tujuan Pengumuman
        createdAt: serverTimestamp()
      });
      // Reset State
      setNewTitle(""); setNewContent(""); setExternalUrl(""); 
      setImagePreview(null); setBase64Image(""); setImgPosition("center");
      setTargetPortal("Siswa");
      fetchPosters();
      alert(`✅ Sistem: Berhasil dipublikasikan ke Portal ${targetPortal}!`);
    } catch (err) {
      console.error(err);
      alert("❌ Terjadi Error saat menyimpan ke server.");
    }
    setLoading(false);
  };

  const handleImageError = (e) => {
    if (externalUrl.includes('instagram')) {
      e.target.src = 'https://placehold.co/800x450/e1306c/white?text=📸+POSTINGAN+INSTAGRAM\n\nKlik+Icon+Mata+Untuk+Melihat';
    } else {
      e.target.src = 'https://placehold.co/800x450/2c3e50/white?text=Media+Tidak+Dapat+Dimuat';
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <button onClick={() => navigate('/admin/portal')} style={styles.btnBack}><ArrowLeft size={16}/> Kembali ke Hub</button>
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h2 style={{ color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box size={28} color="#3b82f6" /> Smart Media Engine v2.1
        </h2>
        <span style={styles.hackerBadge}>🔥 Anti-Lag & Auto-Compressor Aktif</span>
      </div>
      
      <div style={styles.inputCard}>
        <div style={styles.tabHeader}>
            <button onClick={() => {setUploadMethod('link'); setImagePreview(null);}} style={{...styles.tabBtn, borderBottom: uploadMethod === 'link' ? '3px solid #3b82f6' : 'none', color: uploadMethod === 'link' ? '#3b82f6' : '#64748b'}}>
                <Instagram size={16}/> Smart Link Injector
            </button>
            <button onClick={() => {setUploadMethod('upload'); setImagePreview(null);}} style={{...styles.tabBtn, borderBottom: uploadMethod === 'upload' ? '3px solid #3b82f6' : 'none', color: uploadMethod === 'upload' ? '#3b82f6' : '#64748b'}}>
                <Upload size={16}/> Upload Super Cepat
            </button>
        </div>

        <div style={styles.formGrid}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <input placeholder="Judul Pengumuman" value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={styles.input}/>
            
            {/* FITUR BARU: TARGET PORTAL SELECTOR */}
            <div style={styles.targetWrapper}>
                <span style={{fontSize: '12px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px'}}>TAMPILKAN DI DASHBOARD:</span>
                <div style={styles.targetGrid}>
                    <button type="button" onClick={() => setTargetPortal("Siswa")} style={{...styles.targetBtn, backgroundColor: targetPortal === "Siswa" ? "#3b82f6" : "#fff", color: targetPortal === "Siswa" ? "#fff" : "#64748b", borderColor: targetPortal === "Siswa" ? "#3b82f6" : "#e2e8f0"}}>
                        <Users size={14}/> Siswa
                    </button>
                    <button type="button" onClick={() => setTargetPortal("Guru")} style={{...styles.targetBtn, backgroundColor: targetPortal === "Guru" ? "#10b981" : "#fff", color: targetPortal === "Guru" ? "#fff" : "#64748b", borderColor: targetPortal === "Guru" ? "#10b981" : "#e2e8f0"}}>
                        <UserCheck size={14}/> Guru
                    </button>
                    <button type="button" onClick={() => setTargetPortal("Semua")} style={{...styles.targetBtn, backgroundColor: targetPortal === "Semua" ? "#6366f1" : "#fff", color: targetPortal === "Semua" ? "#fff" : "#64748b", borderColor: targetPortal === "Semua" ? "#6366f1" : "#e2e8f0"}}>
                        <Globe size={14}/> Semua
                    </button>
                </div>
            </div>

            <textarea placeholder="Isi berita / keterangan press release..." value={newContent} onChange={e=>setNewContent(e.target.value)} style={styles.textArea}/>
          </div>

          <div style={styles.mediaBox}>
            {uploadMethod === "link" ? (
              <div style={{width: '100%'}}>
                <input 
                    placeholder="Paste link Instagram / YouTube di sini..." 
                    value={externalUrl}
                    onChange={(e) => {
                        setExternalUrl(e.target.value);
                        setImagePreview(processSmartUrl(e.target.value)); 
                    }}
                    style={styles.input}
                />
                {externalUrl && (
                    <div style={styles.previewWrapper}>
                        <img src={processSmartUrl(externalUrl)} style={{...styles.miniPreview, objectPosition: imgPosition}} alt="Preview" onError={handleImageError}/>
                        <div style={styles.gridControl}>
                            <MoveVertical size={14} /> Posisi: 
                            <select value={imgPosition} onChange={e => setImgPosition(e.target.value)} style={styles.selectBtn}>
                                <option value="top">Atas</option>
                                <option value="center">Tengah</option>
                                <option value="bottom">Bawah</option>
                            </select>
                        </div>
                    </div>
                )}
              </div>
            ) : (
              <div style={{width: '100%', textAlign: 'center'}}>
                {imagePreview ? (
                  <div style={styles.previewWrapper}>
                    <img src={imagePreview} style={{...styles.miniPreview, objectPosition: imgPosition}} alt="Preview" />
                    <button onClick={() => {setImagePreview(null); setBase64Image("");}} style={styles.btnRemoveImg}>Hapus</button>
                    <div style={styles.gridControl}>
                        <MoveVertical size={14} /> Posisi: 
                        <select value={imgPosition} onChange={e => setImgPosition(e.target.value)} style={styles.selectBtn}>
                            <option value="top">Atas</option>
                            <option value="center">Tengah</option>
                            <option value="bottom">Bawah</option>
                        </select>
                    </div>
                  </div>
                ) : (
                  <label style={styles.uploadLabel}>
                    <Upload size={35} color="#cbd5e1" style={{marginBottom: '10px'}} />
                    <b style={{color: '#475569', fontSize: '14px'}}>Pilih Foto dari Perangkat</b>
                    <span style={{fontSize: '11px', color: '#94a3b8', marginTop: '5px'}}>Sistem otomatis mengompres foto jadi ringan!</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} style={styles.btnSave}>
          {loading ? "Menyimpan ke Database..." : `🚀 Luncurkan ke Dashboard ${targetPortal}`}
        </button>
      </div>

      <div style={styles.grid}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <div style={styles.targetBadge}>Portal: {p.targetPortal || "Siswa"}</div>
            <img src={p.imageUrl} style={{...styles.imgPreview, objectPosition: p.imgPosition || 'center'}} alt="poster" onError={handleImageError} />
            <div style={{padding: '15px'}}>
                <b style={styles.pTitle}>{p.title}</b>
                <div style={styles.actionArea}>
                    <button onClick={() => window.open(p.originalUrl || p.imageUrl, '_blank')} style={styles.btnView}><Eye size={14}/> Lihat Asli</button>
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
    btnBack: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' },
    hackerBadge: { background: '#dcfce7', color: '#166534', padding: '5px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #bbf7d0' },
    inputCard: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e2e8f0' },
    tabHeader: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9' },
    tabBtn: { background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' },
    formGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px', marginBottom: '20px' },
    input: { padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc' },
    textArea: { padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', minHeight: '100px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#f8fafc', resize: 'vertical' },
    
    targetWrapper: { padding: '10px 0' },
    targetGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
    targetBtn: { padding: '10px', borderRadius: '10px', border: '1px solid', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: '0.2s' },
    
    mediaBox: { border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '15px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', position: 'relative' },
    uploadLabel: { cursor: 'pointer', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
    
    previewWrapper: { position: 'relative', width: '100%', marginTop: '15px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: 'white' },
    miniPreview: { width: '100%', height: '180px', objectFit: 'cover', display: 'block' },
    btnRemoveImg: { position: 'absolute', top: 10, right: 10, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
    
    gridControl: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: 'rgba(255,255,255,0.9)', position: 'absolute', bottom: 10, left: 10, borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#334155', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    selectBtn: { border: 'none', background: 'transparent', fontWeight: 'bold', color: '#3b82f6', outline: 'none', cursor: 'pointer' },

    btnSave: { background: '#2563eb', color: 'white', border: 'none', padding: '16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', width: '100%', transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
    posterItem: { position: 'relative', background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
    targetBadge: { position: 'absolute', top: 10, left: 10, background: 'rgba(30, 41, 59, 0.8)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', zIndex: 1, backdropFilter: 'blur(4px)' },
    imgPreview: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
    pTitle: { fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '10px', lineHeight: '1.4' },
    actionArea: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginTop: 'auto' },
    btnView: { background: '#f1f5f9', border: 'none', color: '#3b82f6', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' },
    btnDel: { background: '#fee2e2', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }
};

export default ManagePoster;