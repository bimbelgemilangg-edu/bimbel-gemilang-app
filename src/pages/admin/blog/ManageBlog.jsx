import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db, storage } from '../../../firebase';
import { 
  collection, addDoc, serverTimestamp, onSnapshot, 
  query, orderBy, deleteDoc, doc, setDoc, getDoc 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  Rocket, Users, MessageCircle, Settings, 
  Trash2, Plus, Upload, Link as LinkIcon 
} from 'lucide-react';

const ManageBlog = () => {
  const [activeTab, setActiveTab] = useState('video');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // State Data
  const [blogs, setBlogs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [settings, setSettings] = useState({ visiMisi: '', mapsUrl: '', heroTitle: '' });

  // Form States
  const [formData, setFormData] = useState({ title: '', url: '', name: '', role: '', wa: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Listeners untuk sinkronisasi data real-time
    const unsubBlog = onSnapshot(query(collection(db, "web_blog"), orderBy("createdAt", "desc")), (snap) => {
      setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTeachers = onSnapshot(collection(db, "web_teachers_gallery"), (snap) => {
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubContacts = onSnapshot(collection(db, "web_contacts"), (snap) => {
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const fetchSettings = async () => {
      const docRef = doc(db, "web_settings", "general");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setSettings(docSnap.data());
    };
    fetchSettings();
    return () => { unsubBlog(); unsubTeachers(); unsubContacts(); };
  }, []);

  // Fungsi Upload File ke Firebase Storage
  const handleUploadFile = (file, folder, callback) => {
    if (!file) return;
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => console.error(error),
      () => getDownloadURL(uploadTask.snapshot.ref).then((url) => callback(url))
    );
  };

  // HANDLER: Tambah Blog (TikTok/IG)
  const addBlog = async (e) => {
    e.preventDefault();
    let type = formData.url.includes("tiktok.com") ? "tiktok" : formData.url.includes("instagram.com") ? "instagram" : "image";
    await addDoc(collection(db, "web_blog"), { url: formData.url, caption: formData.title, type, createdAt: serverTimestamp() });
    setFormData({ ...formData, url: '', title: '' });
  };

  // HANDLER: Tambah Guru
  const addTeacher = (e) => {
    e.preventDefault();
    setLoading(true);
    handleUploadFile(file, 'teachers', async (url) => {
      await addDoc(collection(db, "web_teachers_gallery"), { nama: formData.name, spesialisasi: formData.role, photoUrl: url });
      setLoading(false); setFile(null); setFormData({ ...formData, name: '', role: '' });
      setProgress(0);
    });
  };

  // HANDLER: Simpan Settings
  const saveSettings = async () => {
    await setDoc(doc(db, "web_settings", "general"), settings);
    alert("Informasi Web Berhasil Diupdate!");
  };

  const deleteData = async (coll, id) => {
    if (window.confirm("Hapus data ini dari sistem?")) await deleteDoc(doc(db, coll, id));
  };

  return (
    <div style={styles.container}>
      <SidebarAdmin />
      <div style={styles.content}>
        <div style={styles.header}>
          <h2>🛰️ Space Master Control</h2>
          <p>Kelola orbit konten Bimbel Gemilang secara real-time.</p>
        </div>

        {/* TAB NAVIGATION */}
        <div style={styles.tabs}>
          <button onClick={() => setActiveTab('video')} style={activeTab === 'video' ? styles.tabActive : styles.tab}><Rocket size={16}/> Aktivitas</button>
          <button onClick={() => setActiveTab('teachers')} style={activeTab === 'teachers' ? styles.tabActive : styles.tab}><Users size={16}/> Guru</button>
          <button onClick={() => setActiveTab('contacts')} style={activeTab === 'contacts' ? styles.tabActive : styles.tab}><MessageCircle size={16}/> Kontak</button>
          <button onClick={() => setActiveTab('settings')} style={activeTab === 'settings' ? styles.tabActive : styles.tab}><Settings size={16}/> Info Web</button>
        </div>

        {/* TAB CONTENT: VIDEO/BLOG */}
        {activeTab === 'video' && (
          <div style={styles.card}>
            <h3>Tambah Aktivitas (TikTok/IG)</h3>
            <form onSubmit={addBlog} style={styles.formInline}>
              <input style={styles.input} placeholder="Link TikTok/IG" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required />
              <input style={styles.input} placeholder="Caption Singkat" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <button style={styles.btnPrimary}><Plus size={18}/> Tambah</button>
            </form>
            <div style={styles.list}>
              {blogs.map(b => (
                <div key={b.id} style={styles.listItem}>
                  <span>{b.caption} ({b.type})</span>
                  <Trash2 size={18} color="#e74c3c" style={{cursor:'pointer'}} onClick={() => deleteData("web_blog", b.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: TEACHERS */}
        {activeTab === 'teachers' && (
          <div style={styles.card}>
            <h3>Tambah Tenaga Pendidik</h3>
            <form onSubmit={addTeacher} style={styles.formStack}>
              <input style={styles.input} placeholder="Nama Guru" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input style={styles.input} placeholder="Bidang (Contoh: Guru Matematika)" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required />
              <input type="file" onChange={e => setFile(e.target.files[0])} required />
              {progress > 0 && <progress value={progress} max="100" style={{width:'100%'}} />}
              <button disabled={loading} style={styles.btnPrimary}><Upload size={18}/> {loading ? 'Mengorbit...' : 'Simpan Data Guru'}</button>
            </form>
            <div style={styles.grid}>
              {teachers.map(t => (
                <div key={t.id} style={styles.gridItem}>
                  <img src={t.photoUrl} alt="Guru" style={styles.thumb} />
                  <p><strong>{t.nama}</strong></p>
                  <Trash2 size={16} onClick={() => deleteData("web_teachers_gallery", t.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={styles.card}>
            <h3>Konfigurasi Informasi Web</h3>
            <div style={styles.formStack}>
              <label>Judul Utama (Hero Title)</label>
              <input style={styles.input} value={settings.heroTitle} onChange={e => setSettings({...settings, heroTitle: e.target.value})} />
              <label>Visi & Misi</label>
              <textarea style={{...styles.input, height:80}} value={settings.visiMisi} onChange={e => setSettings({...settings, visiMisi: e.target.value})} />
              <label>Link Google Maps (Iframe/URL)</label>
              <input style={styles.input} value={settings.mapsUrl} onChange={e => setSettings({...settings, mapsUrl: e.target.value})} />
              <button onClick={saveSettings} style={styles.btnPrimary}>Simpan Perubahan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
  content: { marginLeft: '260px', padding: '40px', width: '100%' },
  header: { marginBottom: '30px' },
  tabs: { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' },
  tab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' },
  tabActive: { padding: '10px 20px', border: 'none', borderBottom: '2px solid #f39c12', color: '#f39c12', background: 'rgba(243, 156, 18, 0.1)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
  card: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  formInline: { display: 'flex', gap: '10px', marginBottom: '20px' },
  formStack: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' },
  btnPrimary: { padding: '12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 },
  list: { marginTop: '20px' },
  listItem: { display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', marginTop: '20px' },
  gridItem: { textAlign: 'center', border: '1px solid #f1f5f9', padding: '10px', borderRadius: '10px' },
  thumb: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }
};

export default ManageBlog;