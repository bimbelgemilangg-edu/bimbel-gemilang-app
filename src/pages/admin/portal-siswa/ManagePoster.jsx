import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { 
  Trash2, Plus, ArrowLeft, Eye, Upload, Instagram, Box, 
  MoveVertical, Globe, UserCheck, ShieldCheck, Zap
} from 'lucide-react';
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
  const [targetPortal, setTargetPortal] = useState("Semua"); // FITUR BARU: Targeting
  const [loading, setLoading] = useState(false);

  // --- 1. SMART URL BYPASS ENGINE ---
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
    } catch (err) { return url; }
  };

  const fetchPosters = async () => {
    try {
      const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPosters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error("Gagal ambil data:", err); }
  };

  useEffect(() => { fetchPosters(); }, []);

  // --- 2. HACKER-LEVEL COMPRESSION ENGINE (Anti-Lag & Storage Safe) ---
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
        const MAX_WIDTH = 1200; // Optimal Resolution
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        // Image Smoothing Quality High
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Kompresi 0.6 (Sweet spot antara size vs quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        setImagePreview(compressedBase64);
        setBase64Image(compressedBase64);
      }
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalImageUrl = uploadMethod === "upload" ? base64Image : processSmartUrl(externalUrl);

    if(!finalImageUrl || !newTitle) return alert("Sistem: Judul dan Gambar wajib diisi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "student_contents"), {
        imageUrl: finalImageUrl,
        originalUrl: externalUrl || "Internal Upload",
        title: newTitle,
        content: newContent,
        method: uploadMethod,
        imgPosition: imgPosition,
        targetPortal: targetPortal, // DATA BARU: Lokasi Publikasi
        createdAt: serverTimestamp(),
        engineVersion: "2.5-Hacker-Edition"
      });

      // Reset
      setNewTitle(""); setNewContent(""); setExternalUrl(""); 
      setImagePreview(null); setBase64Image(""); setImgPosition("center");
      fetchPosters();
      alert(`✅ PUBLIKASI BERHASIL: Ditampilkan di Portal ${targetPortal}`);
    } catch (err) {
      console.error(err);
      alert("❌ Critical Error: Gagal mengunggah ke database.");
    }
    setLoading(false);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://placehold.co/800x450/1e293b/white?text=Media+Terproteksi+atau+Link+Salah';
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <button onClick={() => navigate('/admin/portal')} style={styles.btnBack}><ArrowLeft size={16}/> Control Panel</button>
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
        <h2 style={{ color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '900' }}>
          <ShieldCheck size={32} color="#2563eb" /> Smart Media Engine <span style={{color: '#94a3b8', fontWeight: '400'}}>v2.5</span>
        </h2>
        <div style={{display: 'flex', gap: '10px'}}>
            <span style={styles.hackerBadge}><Zap size={12}/> Auto-Compressor ON</span>
            <span style={{...styles.hackerBadge, background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe'}}>Total: {posters.length} Media</span>
        </div>
      </div>
      
      <div style={styles.inputCard}>
        <div style={styles.tabHeader}>
            <button onClick={() => {setUploadMethod('link'); setImagePreview(null);}} style={{...styles.tabBtn, borderBottom: uploadMethod === 'link' ? '4px solid #2563eb' : 'none', color: uploadMethod === 'link' ? '#2563eb' : '#64748b'}}>
                <Instagram size={18}/> Smart Link Injector
            </button>
            <button onClick={() => {setUploadMethod('upload'); setImagePreview(null);}} style={{...styles.tabBtn, borderBottom: uploadMethod === 'upload' ? '4px solid #2563eb' : 'none', color: uploadMethod === 'upload' ? '#2563eb' : '#64748b'}}>
                <Upload size={18}/> Direct Hardware Upload
            </button>
        </div>

        <div style={styles.formGrid}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div style={styles.inputGroup}>
                <label style={styles.labelHeader}>Detail Publikasi</label>
                <input placeholder="Ketik Judul Menarik Di Sini..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={styles.input}/>
                <textarea placeholder="Tuliskan isi berita atau deskripsi lengkap..." value={newContent} onChange={e=>setNewContent(e.target.value)} style={styles.textArea}/>
            </div>

            <div style={styles.inputGroup}>
                <label style={styles.labelHeader}>Targeting & Layout</label>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                    <div style={styles.selectWrapper}>
                        <Globe size={14} style={styles.selectIcon}/>
                        <select value={targetPortal} onChange={e => setTargetPortal(e.target.value)} style={styles.fullSelect}>
                            <option value="Semua">Tampilkan di Semua</option>
                            <option value="Siswa">Portal Siswa Saja</option>
                            <option value="Guru">Portal Guru Saja</option>
                        </select>
                    </div>
                    <div style={styles.selectWrapper}>
                        <MoveVertical size={14} style={styles.selectIcon}/>
                        <select value={imgPosition} onChange={e => setImgPosition(e.target.value)} style={styles.fullSelect}>
                            <option value="center">Focus: Tengah</option>
                            <option value="top">Focus: Atas</option>
                            <option value="bottom">Focus: Bawah</option>
                        </select>
                    </div>
                </div>
            </div>
          </div>

          <div style={styles.mediaBox}>
            {uploadMethod === "link" ? (
              <div style={{width: '100%'}}>
                <input 
                    placeholder="Input Link Instagram / YouTube..." 
                    value={externalUrl}
                    onChange={(e) => {
                        setExternalUrl(e.target.value);
                        setImagePreview(processSmartUrl(e.target.value)); 
                    }}
                    style={styles.input}
                />
                {imagePreview ? (
                    <div style={styles.previewWrapper}>
                        <img src={imagePreview} style={{...styles.miniPreview, objectPosition: imgPosition}} alt="Preview" onError={handleImageError}/>
                        <div style={styles.activeLabel}>Live Preview</div>
                    </div>
                ) : (
                    <div style={styles.placeholderMedia}>
                        <Instagram size={40} color="#cbd5e1"/>
                        <p style={{fontSize: 12, color: '#94a3b8', marginTop: 10}}>Sistem akan otomatis mengambil thumbnail media</p>
                    </div>
                )}
              </div>
            ) : (
              <div style={{width: '100%', textAlign: 'center'}}>
                {imagePreview ? (
                  <div style={styles.previewWrapper}>
                    <img src={imagePreview} style={{...styles.miniPreview, objectPosition: imgPosition}} alt="Preview" />
                    <button onClick={() => {setImagePreview(null); setBase64Image("");}} style={styles.btnRemoveImg}>Ganti Foto</button>
                    <div style={styles.activeLabel}>Auto-Compressed Image</div>
                  </div>
                ) : (
                  <label style={styles.uploadLabel}>
                    <div style={styles.uploadCircle}>
                        <Upload size={30} color="#2563eb" />
                    </div>
                    <b style={{color: '#1e293b', fontSize: '15px'}}>Pilih Media Lokal</b>
                    <span style={{fontSize: '11px', color: '#64748b', marginTop: '8px', maxWidth: '200px'}}>Resolusi akan dioptimasi otomatis agar hemat penyimpanan Cloud Firestore</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} style={{...styles.btnSave, opacity: loading ? 0.7 : 1}}>
          {loading ? "PROSES ENKRIPSI & UPLOAD..." : "PUBLIKASIKAN KE PORTAL TERPILIH"}
        </button>
      </div>

      <h3 style={{fontWeight: '900', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 10}}>
        <Box size={20}/> Live Media Management
      </h3>

      <div style={styles.grid}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <div style={styles.posterImgContainer}>
                <img src={p.imageUrl} style={{...styles.imgPreview, objectPosition: p.imgPosition || 'center'}} alt="poster" onError={handleImageError} />
                <div style={styles.targetBadge}>
                    {p.targetPortal === 'Guru' ? <UserCheck size={10}/> : <Globe size={10}/>}
                    {p.targetPortal || 'Semua'}
                </div>
            </div>
            <div style={{padding: '18px'}}>
                <b style={styles.pTitle}>{p.title}</b>
                <p style={{fontSize: 11, color: '#94a3b8', marginBottom: 15, height: 32, overflow: 'hidden'}}>{p.content || "Tanpa deskripsi..."}</p>
                <div style={styles.actionArea}>
                    <button onClick={() => window.open(p.originalUrl || p.imageUrl, '_blank')} style={styles.btnView}><Eye size={14}/> Preview</button>
                    <button onClick={() => { if(window.confirm("Hapus media ini?")) deleteDoc(doc(db, "student_contents", p.id)).then(fetchPosters)}} style={styles.btnDel}><Trash2 size={16}/></button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
    btnBack: { background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: 13, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    hackerBadge: { background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 5 },
    inputCard: { background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', marginBottom: '40px', border: '1px solid #e2e8f0' },
    tabHeader: { display: 'flex', gap: '25px', marginBottom: '25px', borderBottom: '2px solid #f1f5f9' },
    tabBtn: { background: 'none', border: 'none', padding: '15px 5px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.3s' },
    labelHeader: { fontSize: '12px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' },
    inputGroup: { display: 'flex', flexDirection: 'column' },
    formGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px', marginBottom: '25px' },
    input: { padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px', width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', fontWeight: '600' },
    textArea: { padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '120px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#f8fafc', resize: 'none', fontSize: '14px', marginTop: '10px' },
    
    selectWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    selectIcon: { position: 'absolute', left: '12px', color: '#2563eb' },
    fullSelect: { width: '100%', padding: '12px 12px 12px 35px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: '800', fontSize: '12px', color: '#1e293b', appearance: 'none', cursor: 'pointer' },

    mediaBox: { border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '260px', position: 'relative' },
    placeholderMedia: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    uploadLabel: { cursor: 'pointer', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
    uploadCircle: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' },
    
    previewWrapper: { position: 'relative', width: '100%', borderRadius: '15px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
    miniPreview: { width: '100%', height: '220px', objectFit: 'cover', display: 'block' },
    activeLabel: { position: 'absolute', bottom: 10, right: 10, background: '#2563eb', color: 'white', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '50px' },
    btnRemoveImg: { position: 'absolute', top: 10, right: 10, background: 'rgba(255, 255, 255, 0.9)', color: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '900', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },

    btnSave: { background: '#2563eb', color: 'white', border: 'none', padding: '20px', borderRadius: '15px', cursor: 'pointer', fontWeight: '900', fontSize: '16px', width: '100%', transition: '0.3s', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)', letterSpacing: '1px' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
    posterItem: { background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: '0.3s' },
    posterImgContainer: { position: 'relative', width: '100%', aspectRatio: '16/9' },
    imgPreview: { width: '100%', height: '100%', objectFit: 'cover' },
    targetBadge: { position: 'absolute', top: 12, left: 12, background: 'rgba(15, 23, 42, 0.8)', color: 'white', padding: '5px 12px', borderRadius: '50px', fontSize: '10px', fontWeight: '800', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 6 },
    pTitle: { fontSize: '16px', color: '#0f172a', display: 'block', marginBottom: '8px', fontWeight: '800' },
    actionArea: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '15px' },
    btnView: { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#2563eb', padding: '8px 15px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' },
    btnDel: { background: '#fff1f2', border: 'none', color: '#e11d48', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }
};

export default ManagePoster;