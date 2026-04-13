import React, { useState } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Layout, Send, Link as LinkIcon, Type } from 'lucide-react';

const ManageBlog = () => {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!url || !caption) return alert("Isi semua field!");
    
    setLoading(true);
    let category = "image";
    if (url.includes("tiktok.com")) category = "tiktok";
    if (url.includes("instagram.com")) category = "instagram";

    try {
      await addDoc(collection(db, "web_blog"), {
        url,
        caption,
        type: category,
        createdAt: serverTimestamp()
      });
      alert("Konten berhasil meluncur ke orbit website!");
      setUrl(""); 
      setCaption("");
    } catch (err) { 
      console.error(err);
      alert("Gagal upload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: '260px', padding: '30px', width: '100%' }}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>🚀 Mission Control: Blog & Galeri</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Kelola konten aktivitas luar angkasa Bimbel Gemilang</p>
        </div>

        <div style={styles.card}>
          <form onSubmit={handleUpload}>
            <div style={styles.inputGroup}>
              <label style={styles.label}><LinkIcon size={14} /> Link Media (TikTok / Instagram / URL Foto)</label>
              <input 
                style={styles.input} 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="https://www.tiktok.com/@user/video/..." 
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}><Type size={14} /> Keterangan Aktivitas</label>
              <textarea 
                style={{ ...styles.input, height: '100px', resize: 'none' }} 
                value={caption} 
                onChange={e => setCaption(e.target.value)} 
                placeholder="Tuliskan cerita singkat keseruan aktivitas ini..."
                required
              />
            </div>

            <button type="submit" style={styles.btn} disabled={loading}>
              <Send size={18} /> {loading ? 'Mengirim...' : 'Publikasikan Konten'}
            </button>
          </form>
        </div>

        <div style={styles.infoBox}>
          <strong>Tips Astronot:</strong>
          <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
            <li>Pastikan link TikTok/IG bersifat publik.</li>
            <li>Gunakan kalimat yang menarik untuk menarik minat calon siswa.</li>
            <li>Konten akan otomatis muncul di halaman <code>/aktivitas</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: { marginBottom: '30px' },
  card: { 
    background: 'white', 
    padding: '25px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    maxWidth: '600px'
  },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' },
  input: { 
    width: '100%', 
    padding: '12px', 
    borderRadius: '10px', 
    border: '1px solid #e2e8f0', 
    fontSize: '14px', 
    boxSizing: 'border-box',
    outline: 'none'
  },
  btn: { 
    width: '100%', 
    padding: '14px', 
    background: '#f39c12', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    transition: '0.3s'
  },
  infoBox: {
    marginTop: '30px',
    padding: '20px',
    background: '#e0f2fe',
    borderRadius: '12px',
    color: '#0369a1',
    maxWidth: '600px',
    border: '1px solid #bae6fd'
  }
};

export default ManageBlog; // WAJIB ADA AGAR TIDAK ERROR BUILD