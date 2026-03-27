import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { Trash2, Plus, ArrowLeft, Eye, Newspaper, Upload, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagePoster = () => {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // Untuk nampilin gambar pas milih
  const [base64Image, setBase64Image] = useState(""); // Ini yang dikirim ke database
  const [loading, setLoading] = useState(false);

  const fetchPosters = async () => {
    const q = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setPosters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchPosters(); }, []);

  // FUNGSI UNTUK HANDLE PILIH GAMBAR DARI HP/LAPTOP
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) { // Limit 1MB biar Firestore gak keberatan
        alert("Ukuran gambar terlalu besar! Maksimal 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Tampilkan di UI
        setBase64Image(reader.result); // Simpan datanya
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if(!base64Image || !newTitle) return alert("Judul dan Gambar wajib diisi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "student_contents"), {
        imageUrl: base64Image, // Kita simpan kode gambarnya di sini
        title: newTitle,
        content: newContent,
        createdAt: serverTimestamp()
      });
      setNewTitle(""); setNewContent(""); setImagePreview(null); setBase64Image("");
      fetchPosters();
      alert("Berita Berhasil Dipublikasikan!");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <button onClick={() => navigate('/admin/portal')} style={styles.btnBack}><ArrowLeft size={16}/> Kembali ke Hub</button>
      <h2 style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Newspaper size={28} color="#3498db" /> Publikasi Berita & Poster
      </h2>
      
      <div style={styles.inputCard}>
        <h4 style={{marginTop: 0}}>Buat Konten Baru</h4>
        <div style={styles.formGrid}>
          {/* INPUT JUDUL */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input 
              placeholder="Judul Berita / Judul Poster" 
              value={newTitle} 
              onChange={e=>setNewTitle(e.target.value)} 
              style={styles.input}
            />
            <textarea 
              placeholder="Tulis isi berita atau detail pengumuman (Press Release)..." 
              value={newContent} 
              onChange={e=>setNewContent(e.target.value)} 
              style={styles.textArea}
            />
          </div>

          {/* INPUT GAMBAR */}
          <div style={styles.uploadBox}>
            {imagePreview ? (
              <div style={styles.previewContainer}>
                <img src={imagePreview} style={styles.previewImg} alt="Preview" />
                <button onClick={() => {setImagePreview(null); setBase64Image("");}} style={styles.btnRemoveImg}>Ganti Gambar</button>
              </div>
            ) : (
              <label style={styles.uploadLabel}>
                <Upload size={30} color="#94a3b8" />
                <span style={{fontSize: '13px', color: '#64748b', textAlign: 'center'}}>Klik untuk Upload Gambar <br/>(HP/Komputer)</span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
              </label>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} style={styles.btnSave}>
          <Plus size={18} /> {loading ? "Sedang Mengirim..." : "Terbitkan Sekarang"}
        </button>
      </div>

      <h4 style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <ImageIcon size={20} /> Konten yang Sedang Tayang
      </h4>
      <div style={styles.grid}>
        {posters.map(p => (
          <div key={p.id} style={styles.posterItem}>
            <div style={{...styles.imgPreview, backgroundImage: `url(${p.imageUrl})`}}>
               <div style={styles.dateBadge}>
                  {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('id-ID') : 'Baru saja'}
               </div>
            </div>
            <div style={{padding: '15px'}}>
                <b style={styles.pTitle}>{p.title}</b>
                <p style={styles.pDesc}>{p.content ? p.content.substring(0, 60) + "..." : "Tanpa deskripsi"}</p>
                <div style={styles.actionArea}>
                    <button style={styles.btnView}><Eye size={14}/> Preview</button>
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
    formGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '15px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' },
    textArea: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '120px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' },
    
    // Style Box Upload
    uploadBox: { border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', overflow: 'hidden', minHeight: '180px' },
    uploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', width: '100%', padding: '20px' },
    previewContainer: { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' },
    previewImg: { width: '100%', height: '150px', objectFit: 'cover' },
    btnRemoveImg: { background: '#ef4444', color: 'white', border: 'none', padding: '5px', fontSize: '11px', cursor: 'pointer' },

    btnSave: { background: '#22c55e', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    posterItem: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #eee' },
    imgPreview: { width: '100%', aspectRatio: '16/9', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
    dateBadge: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '5px', fontSize: '10px' },
    pTitle: { fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '5px' },
    pDesc: { fontSize: '13px', color: '#64748b', margin: 0 },
    actionArea: { display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' },
    btnView: { background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' },
    btnDel: { background: '#fff1f1', color: '#ef4444', border: '1px solid #fee2e2', padding: '6px', borderRadius: '6px', cursor: 'pointer' }
};

export default ManagePoster;