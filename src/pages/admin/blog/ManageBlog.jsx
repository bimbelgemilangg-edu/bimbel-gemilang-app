import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db, storage } from '../../../firebase';
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, deleteDoc, doc, setDoc, getDoc, updateDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/* ─── HELPERS ─────────────────────────────────────────── */
const uploadFile = (file, folder, onProgress) => new Promise((resolve, reject) => {
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  const task = uploadBytesResumable(storageRef, file);
  task.on('state_changed',
    s => onProgress && onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
    reject,
    () => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject)
  );
});

const S = {
  input: {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, color: 'white', fontSize: 14, fontFamily: 'sans-serif',
    outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s'
  },
  label: { display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: 0.5 },
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 24, marginBottom: 20
  },
  cardTitle: { fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 14, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 },
  btn: {
    padding: '10px 22px', background: 'linear-gradient(135deg,#f39c12,#e67e22)',
    border: 'none', borderRadius: 10, color: '#0a0a1a', fontWeight: 700,
    fontSize: 13, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif",
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  btnDanger: {
    padding: '7px 14px', background: 'rgba(231,76,60,0.15)',
    border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8,
    color: '#e74c3c', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s'
  },
  btnSuccess: {
    padding: '10px 22px', background: 'linear-gradient(135deg,#25D366,#1da851)',
    border: 'none', borderRadius: 10, color: 'white', fontWeight: 700,
    fontSize: 13, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif"
  },
  progress: { width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  row: { marginBottom: 16 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 },
  listItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.07)'
  },
  badge: (color) => ({
    padding: '3px 10px', borderRadius: 10, fontSize: 11,
    background: `rgba(${color},0.15)`, color: `rgb(${color})`,
    fontFamily: "'Orbitron',sans-serif"
  }),
  successMsg: {
    background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)',
    color: '#25D366', padding: '10px 14px', borderRadius: 8,
    fontSize: 13, marginTop: 10, fontFamily: 'sans-serif'
  }
};

const FormRow = ({ label, children }) => (
  <div style={S.row}><label style={S.label}>{label}</label>{children}</div>
);
const SuccessMsg = ({ show }) => show ? <div style={S.successMsg}>✓ Berhasil disimpan!</div> : null;
const ProgressBar = ({ value }) => value > 0 && value < 100 ? (
  <div style={S.progress}><div style={{ height: '100%', width: `${value}%`, background: 'linear-gradient(90deg,#f39c12,#e67e22)', borderRadius: 3, transition: 'width 0.3s' }} /></div>
) : null;

/* ─── TAB: AKTIVITAS ──────────────────────────────────── */
const TabAktivitas = ({ blogs }) => {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [msg, setMsg] = useState(false);

  const add = async () => {
    if (!url || !caption) return;
    const type = url.includes('tiktok.com') ? 'tiktok' : url.includes('instagram.com') ? 'instagram' : 'link';
    await addDoc(collection(db, 'web_blog'), { url, caption, type, createdAt: serverTimestamp() });
    setUrl(''); setCaption(''); setMsg(true); setTimeout(() => setMsg(false), 2500);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>🎬 Tambah Aktivitas (TikTok / Instagram)</div>
        <div style={{ background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
          ⚠️ Untuk TikTok: gunakan link desktop penuh seperti<br />
          <code style={{ color: '#f39c12' }}>https://www.tiktok.com/@username/video/12345</code><br />
          Link pendek <code style={{ color: '#e74c3c' }}>vt.tiktok.com</code> tidak bisa di-embed otomatis.
        </div>
        <FormRow label="Link TikTok / Instagram">
          <input style={S.input} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.tiktok.com/@username/video/..." />
        </FormRow>
        <FormRow label="Caption / Deskripsi">
          <input style={S.input} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Contoh: Tips Belajar Matematika" />
        </FormRow>
        <button style={S.btn} onClick={add}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(243,156,18,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
          + Tambah Aktivitas
        </button>
        <SuccessMsg show={msg} />
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📋 Daftar Aktivitas ({blogs.length})</div>
        {blogs.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Belum ada aktivitas.</p> : blogs.map(b => (
          <div key={b.id} style={S.listItem}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: b.type === 'tiktok' ? 'rgba(0,0,0,0.7)' : 'rgba(131,58,180,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {b.type === 'tiktok' ? '♪' : '◻'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.caption}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.url}</div>
            </div>
            <span style={S.badge(b.type === 'tiktok' ? '255,255,255' : '243,156,18')}>{b.type}</span>
            <button style={S.btnDanger} onClick={() => { if (window.confirm('Hapus?')) deleteDoc(doc(db, 'web_blog', b.id)); }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(231,76,60,0.15)'}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── TAB: ASTRONOT (GURU) ────────────────────────────── */
const TabAstronot = ({ teachers }) => {
  const [nama, setNama] = useState('');
  const [spesialisasi, setSpesialisasi] = useState('');
  const [wa, setWa] = useState('');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(false);

  const add = async () => {
    if (!nama || !file) return;
    setLoading(true);
    try {
      const url = await uploadFile(file, 'teachers', setProgress);
      await addDoc(collection(db, 'web_teachers_gallery'), { nama, spesialisasi, wa, photoUrl: url });
      setNama(''); setSpesialisasi(''); setWa(''); setFile(null); setProgress(0);
      setMsg(true); setTimeout(() => setMsg(false), 2500);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>👨‍🚀 Tambah Astronot / Pengajar</div>
        <div style={S.row2}>
          <FormRow label="Nama Lengkap *"><input style={S.input} value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama pengajar" /></FormRow>
          <FormRow label="Spesialisasi / Bidang"><input style={S.input} value={spesialisasi} onChange={e => setSpesialisasi(e.target.value)} placeholder="Guru Matematika" /></FormRow>
        </div>
        <FormRow label="No. WhatsApp (untuk kontak)">
          <input style={S.input} value={wa} onChange={e => setWa(e.target.value)} placeholder="628xxxxxxxxxx" />
        </FormRow>
        <FormRow label="Foto Pengajar *">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...S.input, padding: '9px 14px' }} />
        </FormRow>
        <ProgressBar value={progress} />
        <button style={S.btn} onClick={add} disabled={loading}>
          {loading ? `Mengunggah... ${progress}%` : '+ Tambah Pengajar'}
        </button>
        <SuccessMsg show={msg} />
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📋 Daftar Pengajar ({teachers.length})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16 }}>
          {teachers.map(t => (
            <div key={t.id} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, position: 'relative' }}>
              <img src={t.photoUrl} alt={t.nama} style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f39c12', marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 4 }}>{t.nama}</div>
              <div style={{ fontSize: 11, color: 'rgba(243,156,18,0.8)', marginBottom: 10 }}>{t.spesialisasi}</div>
              <button style={S.btnDanger} onClick={() => { if (window.confirm('Hapus?')) deleteDoc(doc(db, 'web_teachers_gallery', t.id)); }}>Hapus</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── TAB: BERITA ─────────────────────────────────────── */
const TabBerita = ({ berita }) => {
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [kategori, setKategori] = useState('BERITA');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(false);

  const add = async () => {
    if (!judul || !isi) return;
    setLoading(true);
    let imageUrl = '';
    if (file) imageUrl = await uploadFile(file, 'berita', setProgress);
    await addDoc(collection(db, 'web_berita'), { judul, isi, kategori, imageUrl, createdAt: serverTimestamp() });
    setJudul(''); setIsi(''); setFile(null); setProgress(0);
    setMsg(true); setTimeout(() => setMsg(false), 2500);
    setLoading(false);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>📰 Tulis Berita / Pengumuman</div>
        <FormRow label="Judul Berita *"><input style={S.input} value={judul} onChange={e => setJudul(e.target.value)} placeholder="Judul berita" /></FormRow>
        <div style={S.row}>
          <label style={S.label}>Kategori</label>
          <select style={S.input} value={kategori} onChange={e => setKategori(e.target.value)}>
            {['BERITA','PENGUMUMAN','PRESTASI','KEGIATAN','INFO'].map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <FormRow label="Isi Berita *">
          <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical' }} value={isi} onChange={e => setIsi(e.target.value)} placeholder="Tulis isi berita di sini..." />
        </FormRow>
        <FormRow label="Foto Berita (opsional)">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...S.input, padding: '9px 14px' }} />
        </FormRow>
        <ProgressBar value={progress} />
        <button style={S.btn} onClick={add} disabled={loading}>{loading ? `Mengunggah... ${progress}%` : '+ Publikasikan Berita'}</button>
        <SuccessMsg show={msg} />
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📋 Daftar Berita ({berita.length})</div>
        {berita.map(b => (
          <div key={b.id} style={S.listItem}>
            {b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: 48, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.judul}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{b.kategori} · {b.createdAt?.toDate?.()?.toLocaleDateString('id-ID')}</div>
            </div>
            <button style={S.btnDanger} onClick={() => { if (window.confirm('Hapus berita ini?')) deleteDoc(doc(db, 'web_berita', b.id)); }}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── TAB: KONTAK ADMIN ───────────────────────────────── */
const TabKontak = ({ contacts }) => {
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [wa, setWa] = useState('');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(false);

  const add = async () => {
    if (!nama || !wa || !file) return;
    setLoading(true);
    const url = await uploadFile(file, 'contacts', setProgress);
    await addDoc(collection(db, 'web_contacts'), { nama, jabatan, wa, photoUrl: url });
    setNama(''); setJabatan(''); setWa(''); setFile(null); setProgress(0);
    setMsg(true); setTimeout(() => setMsg(false), 2500);
    setLoading(false);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>💬 Tambah Kontak Admin</div>
        <div style={S.row2}>
          <FormRow label="Nama *"><input style={S.input} value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama admin" /></FormRow>
          <FormRow label="Jabatan"><input style={S.input} value={jabatan} onChange={e => setJabatan(e.target.value)} placeholder="Admin / Pengajar" /></FormRow>
        </div>
        <FormRow label="No. WhatsApp * (format: 628xxx)">
          <input style={S.input} value={wa} onChange={e => setWa(e.target.value)} placeholder="6281234567890" />
        </FormRow>
        <FormRow label="Foto *">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...S.input, padding: '9px 14px' }} />
        </FormRow>
        <ProgressBar value={progress} />
        <button style={S.btn} onClick={add} disabled={loading}>{loading ? `Mengunggah... ${progress}%` : '+ Tambah Kontak'}</button>
        <SuccessMsg show={msg} />
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📋 Daftar Kontak ({contacts.length})</div>
        {contacts.map(c => (
          <div key={c.id} style={S.listItem}>
            <img src={c.photoUrl} alt={c.nama} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,211,102,0.4)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.nama}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{c.jabatan} · {c.wa}</div>
            </div>
            <button style={S.btnDanger} onClick={() => { if (window.confirm('Hapus?')) deleteDoc(doc(db, 'web_contacts', c.id)); }}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── TAB: PENGATURAN ─────────────────────────────────── */
const TabSettings = ({ settings, setSettings }) => {
  const [msg, setMsg] = useState(false);
  const save = async () => {
    await setDoc(doc(db, 'web_settings', 'general'), settings);
    setMsg(true); setTimeout(() => setMsg(false), 2500);
  };
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>⚙️ Pengaturan Website</div>
      <div style={S.row2}>
        <FormRow label="Nama Bimbel (Hero Title)"><input style={S.input} value={settings.heroTitle || ''} onChange={e => setSettings({ ...settings, heroTitle: e.target.value })} /></FormRow>
        <FormRow label="Tagline / Sub Hero"><input style={S.input} value={settings.heroSub || ''} onChange={e => setSettings({ ...settings, heroSub: e.target.value })} /></FormRow>
      </div>
      <FormRow label="Visi & Misi">
        <textarea style={{ ...S.input, minHeight: 100, resize: 'vertical' }} value={settings.visiMisi || ''} onChange={e => setSettings({ ...settings, visiMisi: e.target.value })} />
      </FormRow>
      <div style={S.row2}>
        <FormRow label="Link TikTok"><input style={S.input} value={settings.tiktokUrl || ''} onChange={e => setSettings({ ...settings, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/@..." /></FormRow>
        <FormRow label="Link Instagram"><input style={S.input} value={settings.igUrl || ''} onChange={e => setSettings({ ...settings, igUrl: e.target.value })} placeholder="https://instagram.com/..." /></FormRow>
      </div>
      <FormRow label="Link Google Maps"><input style={S.input} value={settings.mapsUrl || ''} onChange={e => setSettings({ ...settings, mapsUrl: e.target.value })} placeholder="https://maps.google.com/..." /></FormRow>
      <button style={S.btn} onClick={save}>💾 Simpan Pengaturan</button>
      <SuccessMsg show={msg} />
    </div>
  );
};

/* ─── MAIN ADMIN COMPONENT ────────────────────────────── */
const ManageBlog = () => {
  const [activeTab, setActiveTab] = useState('aktivitas');
  const [blogs, setBlogs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [berita, setBerita] = useState([]);
  const [settings, setSettings] = useState({ heroTitle: 'GEMILANG', heroSub: '', visiMisi: '', mapsUrl: '', tiktokUrl: '', igUrl: '' });

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'web_blog'), orderBy('createdAt', 'desc')), s => setBlogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, 'web_teachers_gallery'), s => setTeachers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(collection(db, 'web_contacts'), s => setContacts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u4 = onSnapshot(query(collection(db, 'web_berita'), orderBy('createdAt', 'desc')), s => setBerita(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const fetchSettings = async () => { const s = await getDoc(doc(db, 'web_settings', 'general')); if (s.exists()) setSettings(s.data()); };
    fetchSettings();
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const tabs = [
    { key: 'aktivitas', icon: '🎬', label: 'Aktivitas', count: blogs.length },
    { key: 'astronot', icon: '👨‍🚀', label: 'Astronot', count: teachers.length },
    { key: 'berita', icon: '📰', label: 'Berita', count: berita.length },
    { key: 'kontak', icon: '💬', label: 'Kontak', count: contacts.length },
    { key: 'settings', icon: '⚙️', label: 'Pengaturan', count: null },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05070f', color: 'white', fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing:border-box; }
        input, select, textarea { color:white!important; }
        input:focus, select:focus, textarea:focus { border-color:rgba(243,156,18,0.6)!important; }
        input[type=file] { cursor:pointer; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#f39c12; border-radius:2px; }
        @media(max-width:768px) { .admin-sidebar-desktop{display:none!important} .admin-body{margin-left:0!important} }
      `}</style>

      {/* SIDEBAR */}
      <div className="admin-sidebar-desktop" style={{ width: 240, background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.08)', position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src="/logo.png" alt="Logo" style={{ height: 40, filter: 'drop-shadow(0 0 8px rgba(243,156,18,0.5))', marginBottom: 8 }} />
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: 'rgba(243,156,18,0.7)', letterSpacing: 2 }}>MISSION CONTROL</div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              marginBottom: 4, textAlign: 'left', transition: 'all 0.2s',
              background: activeTab === t.key ? 'rgba(243,156,18,0.15)' : 'transparent',
              borderLeft: activeTab === t.key ? '3px solid #f39c12' : '3px solid transparent',
              color: activeTab === t.key ? '#f39c12' : 'rgba(255,255,255,0.6)',
              fontFamily: "'Orbitron',sans-serif", fontSize: 12
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {t.count !== null && <span style={{ background: 'rgba(243,156,18,0.2)', color: '#f39c12', fontSize: 10, padding: '2px 7px', borderRadius: 10 }}>{t.count}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif' }}>
          Web Gemilang Promosi · Admin
        </div>
      </div>

      {/* CONTENT */}
      <div className="admin-body" style={{ marginLeft: 240, flex: 1, padding: '28px 28px 60px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 'clamp(16px,3vw,22px)', color: '#f39c12', margin: 0 }}>
              {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0', fontFamily: 'sans-serif' }}>Mission Control · Bimbel Gemilang</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[['🎬', blogs.length, 'Konten'], ['👨‍🚀', teachers.length, 'Pengajar'], ['📰', berita.length, 'Berita'], ['💬', contacts.length, 'Kontak']].map(([icon, count, label]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>{icon}</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, color: '#f39c12', fontWeight: 700 }}>{count}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'aktivitas' && <TabAktivitas blogs={blogs} />}
        {activeTab === 'astronot' && <TabAstronot teachers={teachers} />}
        {activeTab === 'berita' && <TabBerita berita={berita} />}
        {activeTab === 'kontak' && <TabKontak contacts={contacts} />}
        {activeTab === 'settings' && <TabSettings settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
};

export default ManageBlog;