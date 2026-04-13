import React, { useState, useEffect } from 'react';
import { db, storage } from '../../../firebase';
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, deleteDoc, doc, setDoc, getDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// SMART COMPRESSION: Mengonversi & Kompres Gambar sebelum diupload ke Storage
const uploadFile = (file, folder, onProgress) => new Promise((resolve, reject) => {
  if (!file) return reject("No file");

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000; // Ukuran optimal
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_WIDTH) {
          width *= MAX_WIDTH / height;
          height = MAX_WIDTH;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Konversi ke Blob WebP untuk performa upload terbaik
      canvas.toBlob((blob) => {
        const r = ref(storage, `${folder}/${Date.now()}_image.webp`);
        const task = uploadBytesResumable(r, blob);
        
        task.on('state_changed',
          s => {
            const p = Math.round((s.bytesTransferred / s.totalBytes) * 100);
            onProgress?.(p);
          },
          err => {
            console.error("Upload Error:", err);
            reject(err);
          },
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              resolve(url);
            } catch (err) {
              reject(err);
            }
          }
        );
      }, 'image/webp', 0.7); // Kualitas 70%
    };
  };
  reader.onerror = (err) => reject(err);
});

const C = { bg: '#0a0c14', bgCard: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', gold: '#f39c12', muted: 'rgba(255,255,255,0.45)' };
const inp = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' };
const cardS = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 };
const btnG = { padding: '10px 22px', background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', borderRadius: 10, color: '#0a0a1a', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif" };
const btnR = { padding: '6px 14px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8, color: '#e74c3c', fontSize: 12, cursor: 'pointer' };
const Row = ({ label, children }) => (<div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6, letterSpacing: 0.5 }}>{label}</label>{children}</div>);
const OK = ({ show }) => show ? <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, color: '#25D366', fontSize: 13 }}>✓ Tersimpan!</div> : null;
const Bar = ({ val }) => val > 0 && val <= 100 ? <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: `${val}%`, background: 'linear-gradient(90deg,#f39c12,#e67e22)', borderRadius: 3, transition: 'width 0.3s' }} /></div> : null;
const SH = ({ icon, title }) => <div style={{ fontFamily: "'Orbitron',sans-serif", color: C.gold, fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>{icon} {title}</div>;
const LI = ({ children }) => <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{children}</div>;
const Grid2 = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;

/* AKTIVITAS */
const TabAktivitas = ({ blogs }) => {
  const [url, setUrl] = useState(''); const [caption, setCaption] = useState(''); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!url || !caption) return;
    const type = url.includes('tiktok.com') ? 'tiktok' : url.includes('instagram.com') ? 'instagram' : 'link';
    await addDoc(collection(db, 'web_blog'), { url, caption, type, createdAt: serverTimestamp() });
    setUrl(''); setCaption(''); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <>
    <div style={cardS}>
      <SH icon="🎬" title="Tambah Konten Aktivitas" />
      <div style={{ background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
        ⚠️ <strong style={{ color: '#f39c12' }}>TikTok:</strong> Gunakan link desktop penuh →{' '}
        <code style={{ color: '#f39c12' }}>https://www.tiktok.com/@username/video/12345</code><br />
        Link pendek <code style={{ color: '#e74c3c' }}>vt.tiktok.com</code> tidak bisa embed otomatis.
      </div>
      <Row label="Link TikTok / Instagram"><input style={inp} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.tiktok.com/@.../video/..." /></Row>
      <Row label="Caption"><input style={inp} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Tips Belajar Matematika" /></Row>
      <button style={btnG} onClick={add}>+ Tambah</button><OK show={ok} />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Daftar (${blogs.length})`} />
      {!blogs.length && <p style={{ color: C.muted, fontSize: 13 }}>Belum ada konten.</p>}
      {blogs.map(b => <LI key={b.id}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: b.type === 'tiktok' ? '#111' : 'rgba(131,58,180,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{b.type === 'tiktok' ? '♪' : '◻'}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.caption}</div><div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.url}</div></div>
        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 10, background: 'rgba(243,156,18,0.15)', color: '#f39c12', fontFamily: "'Orbitron',sans-serif", flexShrink: 0 }}>{b.type}</span>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_blog', b.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

/* PENGAJAR */
const TabPengajar = ({ teachers }) => {
  const [f, setF] = useState({ nama: '', spesialisasi: '', wa: '', bio: '' });
  const [file, setFile] = useState(null); const [prog, setProg] = useState(0); const [loading, setLoading] = useState(false); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!f.nama || !file) return; setLoading(true);
    try { 
      const url = await uploadFile(file, 'teachers', setProg); 
      await addDoc(collection(db, 'web_teachers_gallery'), { ...f, photoUrl: url, createdAt: serverTimestamp() }); 
      setF({ nama: '', spesialisasi: '', wa: '', bio: '' }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500); 
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  return <>
    <div style={cardS}>
      <SH icon="👨‍🚀" title="Tambah Pengajar / Astronot" />
      <Grid2><Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama lengkap" /></Row><Row label="Spesialisasi"><input style={inp} value={f.spesialisasi} onChange={e => setF({ ...f, spesialisasi: e.target.value })} placeholder="Guru Matematika" /></Row></Grid2>
      <Row label="WhatsApp (628xxx)"><input style={inp} value={f.wa} onChange={e => setF({ ...f, wa: e.target.value })} placeholder="6281234567890" /></Row>
      <Row label="Bio Singkat"><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} placeholder="Pengalaman mengajar..." /></Row>
      <Row label="Foto *"><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...inp, padding: '9px 14px' }} /></Row>
      <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Processing... ${prog}%` : '+ Tambah Pengajar'}</button><OK show={ok} />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Pengajar (${teachers.length})`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14 }}>
        {teachers.map(t => <div key={t.id} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
          <img src={t.photoUrl} alt={t.nama} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f39c12', marginBottom: 8 }} />
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{t.nama}</div>
          <div style={{ fontSize: 11, color: '#f39c12', marginBottom: 10 }}>{t.spesialisasi}</div>
          <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_teachers_gallery', t.id))}>Hapus</button>
        </div>)}
      </div>
    </div>
  </>;
};

/* BERITA */
const TabBerita = ({ berita }) => {
  const [f, setF] = useState({ judul: '', isi: '', kategori: 'BERITA' });
  const [file, setFile] = useState(null); const [prog, setProg] = useState(0); const [loading, setLoading] = useState(false); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!f.judul || !f.isi) return; setLoading(true);
    try {
      let imageUrl = ''; if (file) imageUrl = await uploadFile(file, 'berita', setProg);
      await addDoc(collection(db, 'web_berita'), { ...f, imageUrl, createdAt: serverTimestamp() });
      setF({ judul: '', isi: '', kategori: 'BERITA' }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  return <>
    <div style={cardS}>
      <SH icon="📰" title="Tulis Berita / Pengumuman" />
      <Row label="Judul *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} /></Row>
      <Row label="Kategori"><select style={inp} value={f.kategori} onChange={e => setF({ ...f, kategori: e.target.value })}>{['BERITA', 'PENGUMUMAN', 'PRESTASI', 'INFO'].map(k => <option key={k}>{k}</option>)}</select></Row>
      <Row label="Isi Berita *"><textarea style={{ ...inp, minHeight: 130 }} value={f.isi} onChange={e => setF({ ...f, isi: e.target.value })} /></Row>
      <Row label="Foto"><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={inp} /></Row>
      <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Processing... ${prog}%` : '🚀 Publikasikan'}</button><OK show={ok} />
    </div>
    <div style={cardS}>
      {berita.map(b => <LI key={b.id}>
        {b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: 50, height: 38, borderRadius: 6, objectFit: 'cover' }} />}
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{b.judul}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_berita', b.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

/* TESTIMONI */
const TabTestimoni = ({ testimoni }) => {
  const [f, setF] = useState({ nama: '', kelas: '', isi: '', bintang: 5 });
  const [file, setFile] = useState(null); const [prog, setProg] = useState(0); const [loading, setLoading] = useState(false); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!f.nama || !f.isi) return; setLoading(true);
    try {
      let photoUrl = ''; if (file) photoUrl = await uploadFile(file, 'testimoni', setProg);
      await addDoc(collection(db, 'web_testimoni'), { ...f, photoUrl, createdAt: serverTimestamp() });
      setF({ nama: '', kelas: '', isi: '', bintang: 5 }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  return <>
    <div style={cardS}>
      <SH icon="⭐" title="Tambah Testimoni" />
      <Grid2><Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} /></Row><Row label="Kelas"><input style={inp} value={f.kelas} onChange={e => setF({ ...f, kelas: e.target.value })} /></Row></Grid2>
      <Row label="Isi Testimoni *"><textarea style={{ ...inp, minHeight: 90 }} value={f.isi} onChange={e => setF({ ...f, isi: e.target.value })} /></Row>
      <Row label="Rating"><div style={{ display: 'flex', gap: 8 }}>{[1,2,3,4,5].map(n => <button key={n} onClick={() => setF({ ...f, bintang: n })} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', filter: n <= f.bintang ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</button>)}</div></Row>
      <Row label="Foto"><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={inp} /></Row>
      <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Processing... ${prog}%` : '+ Tambah Testimoni'}</button><OK show={ok} />
    </div>
    <div style={cardS}>
      {testimoni.map(t => <LI key={t.id}>
        {t.photoUrl && <img src={t.photoUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />}
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{t.nama}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_testimoni', t.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

/* PENGHARGAAN */
const TabPenghargaan = ({ penghargaan }) => {
  const [f, setF] = useState({ judul: '', tahun: '', deskripsi: '' });
  const [file, setFile] = useState(null); const [prog, setProg] = useState(0); const [loading, setLoading] = useState(false); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!f.judul) return; setLoading(true);
    try {
      let imageUrl = ''; if (file) imageUrl = await uploadFile(file, 'penghargaan', setProg);
      await addDoc(collection(db, 'web_penghargaan'), { ...f, imageUrl, createdAt: serverTimestamp() });
      setF({ judul: '', tahun: '', deskripsi: '' }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  return <div style={cardS}><SH icon="🏆" title="Tambah Penghargaan" />
    <Row label="Judul"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} /></Row>
    <Row label="Foto"><input type="file" onChange={e => setFile(e.target.files[0])} style={inp} /></Row>
    <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Processing... ${prog}%` : 'Simpan'}</button><OK show={ok} />
  </div>;
};

/* KONTAK */
const TabKontak = ({ contacts }) => {
  const [f, setF] = useState({ nama: '', jabatan: '', wa: '' });
  const [file, setFile] = useState(null); const [prog, setProg] = useState(0); const [loading, setLoading] = useState(false); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!f.nama || !file) return; setLoading(true);
    try {
      const url = await uploadFile(file, 'contacts', setProg);
      await addDoc(collection(db, 'web_contacts'), { ...f, photoUrl: url });
      setF({ nama: '', jabatan: '', wa: '' }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  return <div style={cardS}><SH icon="💬" title="Tambah Kontak Admin" />
    <Row label="Nama"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} /></Row>
    <Row label="WhatsApp"><input style={inp} value={f.wa} onChange={e => setF({ ...f, wa: e.target.value })} /></Row>
    <Row label="Foto Admin"><input type="file" onChange={e => setFile(e.target.files[0])} style={inp} /></Row>
    <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Processing... ${prog}%` : 'Tambah'}</button><OK show={ok} />
  </div>;
};

/* KEUNGGULAN */
const ICONS_LIST = ['🎯','📚','👨‍🏫','💰','🏫','⭐','🚀','🏆'];
const TabKeunggulan = ({ keunggulan }) => {
  const [f, setF] = useState({ icon: '🎯', judul: '', deskripsi: '' }); const [ok, setOk] = useState(false);
  const add = async () => {
    await addDoc(collection(db, 'web_keunggulan'), { ...f, createdAt: serverTimestamp() });
    setF({ icon: '🎯', judul: '', deskripsi: '' }); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <div style={cardS}><SH icon="✨" title="Keunggulan" />
    <Row label="Icon"><div style={{ display:'flex', gap:8 }}>{ICONS_LIST.map(ic => <button key={ic} onClick={()=>setF({...f,icon:ic})} style={{ fontSize:20, background:f.icon===ic?'#f39c12':'none', border:'1px solid #333' }}>{ic}</button>)}</div></Row>
    <Row label="Judul"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} /></Row>
    <button style={btnG} onClick={add}>Simpan</button><OK show={ok} />
  </div>;
};

/* STATISTIK & SETTINGS */
const TabStatistik = ({ settings, setSettings }) => {
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); alert('Tersimpan'); };
  return <div style={cardS}><SH icon="📊" title="Statistik" />
    <Grid2><Row label="Siswa"><input style={inp} value={settings.stat1Num || ''} onChange={e => setSettings({ ...settings, stat1Num: e.target.value })} /></Row><Row label="Label"><input style={inp} value={settings.stat1Label || ''} onChange={e => setSettings({ ...settings, stat1Label: e.target.value })} /></Row></Grid2>
    <button style={btnG} onClick={save}>Simpan</button></div>;
};

const TabSettings = ({ settings, setSettings }) => {
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); alert('Tersimpan'); };
  return <div style={cardS}><SH icon="⚙️" title="Pengaturan" />
    <Row label="Nama Bimbel"><input style={inp} value={settings.heroTitle || ''} onChange={e => setSettings({ ...settings, heroTitle: e.target.value })} /></Row>
    <button style={btnG} onClick={save}>Simpan</button></div>;
};

/* MAIN */
export default function ManageBlog() {
  const [tab, setTab] = useState('aktivitas');
  const [blogs, setBlogs] = useState([]); const [teachers, setTeachers] = useState([]); const [contacts, setContacts] = useState([]);
  const [berita, setBerita] = useState([]); const [testimoni, setTestimoni] = useState([]); const [penghargaan, setPenghargaan] = useState([]);
  const [keunggulan, setKeunggulan] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const unsub = [
      onSnapshot(query(collection(db, 'web_blog'), orderBy('createdAt', 'desc')), s => setBlogs(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db, 'web_teachers_gallery'), orderBy('createdAt', 'desc')), s => setTeachers(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db, 'web_contacts'), s => setContacts(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db, 'web_berita'), orderBy('createdAt', 'desc')), s => setBerita(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db, 'web_testimoni'), orderBy('createdAt', 'desc')), s => setTestimoni(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db, 'web_penghargaan'), orderBy('createdAt', 'desc')), s => setPenghargaan(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db, 'web_keunggulan'), orderBy('createdAt', 'desc')), s => setKeunggulan(s.docs.map(d=>({id:d.id,...d.data()})))),
    ];
    getDoc(doc(db,'web_settings','general')).then(s => s.exists() && setSettings(s.data()));
    return () => unsub.forEach(fn => fn());
  }, []);

  const tabs = [{key:'aktivitas',i:'🎬',l:'Aktivitas'},{key:'pengajar',i:'👨‍🚀',l:'Pengajar'},{key:'berita',i:'📰',l:'Berita'},{key:'testimoni',i:'⭐',l:'Testimoni'},{key:'penghargaan',i:'🏆',l:'Penghargaan'},{key:'keunggulan',i:'✨',l:'Keunggulan'},{key:'kontak',i:'💬',l:'Kontak'},{key:'statistik',i:'📊',l:'Statistik'},{key:'settings',i:'⚙️',l:'Pengaturan'}];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg, color:'white', fontFamily:"'Nunito',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{ width:240, background:'rgba(255,255,255,0.03)', borderRight:`1px solid ${C.border}`, position:'fixed', height:'100vh', padding:10 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)} style={{ width:'100%', padding:10, textAlign:'left', background:tab===t.key?'rgba(243,156,18,0.15)':'transparent', border:'none', color:tab===t.key?'#f39c12':'#ccc', cursor:'pointer', borderRadius:5, marginBottom:5, fontSize:12, fontFamily:"'Orbitron',sans-serif" }}>{t.i} {t.l}</button>
        ))}
      </div>
      <div style={{ marginLeft:240, flex:1, padding:30 }}>
        {tab==='aktivitas' && <TabAktivitas blogs={blogs}/>}
        {tab==='pengajar' && <TabPengajar teachers={teachers}/>}
        {tab==='berita' && <TabBerita berita={berita}/>}
        {tab==='testimoni' && <TabTestimoni testimoni={testimoni}/>}
        {tab==='penghargaan' && <TabPenghargaan penghargaan={penghargaan}/>}
        {tab==='keunggulan' && <TabKeunggulan keunggulan={keunggulan}/>}
        {tab==='kontak' && <TabKontak contacts={contacts}/>}
        {tab==='statistik' && <TabStatistik settings={settings} setSettings={setSettings}/>}
        {tab==='settings' && <TabSettings settings={settings} setSettings={setSettings}/>}
      </div>
    </div>
  );
}