import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, deleteDoc, doc, setDoc, getDoc
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// BASE64 IMAGE ENGINE
// Tidak pakai Firebase Storage sama sekali — foto dikecilkan
// otomatis lalu disimpan langsung ke Firestore sebagai teks Base64.
// Max output: ~80KB per foto (sangat hemat Firestore quota).
// ═══════════════════════════════════════════════════════════════
const imageToBase64 = (file, onProgress) =>
  new Promise((resolve, reject) => {
    if (!file) { reject(new Error('Tidak ada file')); return; }
    if (!file.type.startsWith('image/')) { reject(new Error('File harus berupa gambar')); return; }
    if (file.size > 10 * 1024 * 1024) { reject(new Error('Ukuran file maksimal 10MB')); return; }

    onProgress?.(10);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = e => {
      onProgress?.(30);
      const img = new Image();
      img.onerror = () => reject(new Error('File gambar rusak'));
      img.onload = () => {
        onProgress?.(50);
        const MAX = 600;
        const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        onProgress?.(80);
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        onProgress?.(100);
        console.log(`✅ Foto dikompresi: ${w}×${h}px, ~${Math.round(base64.length * 0.75 / 1024)}KB`);
        resolve(base64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: '#080a12',
  bgCard: 'rgba(255,255,255,0.035)',
  border: 'rgba(255,255,255,0.08)',
  borderGold: 'rgba(243,156,18,0.35)',
  gold: '#f39c12',
  muted: 'rgba(255,255,255,0.4)',
  mutedMore: 'rgba(255,255,255,0.22)',
  green: '#25D366',
  red: '#e74c3c',
  text: 'rgba(255,255,255,0.88)',
};

const inp = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${C.border}`,
  borderRadius: 10, color: C.text, fontSize: 14,
  fontFamily: "'Nunito', sans-serif", outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
};

const cardS = {
  background: C.bgCard, border: `1px solid ${C.border}`,
  borderRadius: 18, padding: '24px 26px', marginBottom: 20,
};

const btnG = {
  padding: '11px 24px',
  background: 'linear-gradient(135deg, #f39c12, #e67e22)',
  border: 'none', borderRadius: 10, color: '#0a0a1a',
  fontWeight: 800, fontSize: 13, cursor: 'pointer',
  fontFamily: "'Orbitron', sans-serif", letterSpacing: 0.5,
  transition: 'opacity 0.2s, transform 0.15s',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const btnR = {
  padding: '5px 12px', background: 'rgba(231,76,60,0.12)',
  border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8,
  color: C.red, fontSize: 11, cursor: 'pointer',
  fontFamily: "'Nunito', sans-serif", transition: 'background 0.2s',
};

// ═══════════════════════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════════════════════
const Row = ({ label, children, hint }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: "'Orbitron', sans-serif" }}>
      {label}
      {hint && <span style={{ fontSize: 10, color: C.mutedMore, textTransform: 'none', fontFamily: "'Nunito', sans-serif", letterSpacing: 0 }}>— {hint}</span>}
    </label>
    {children}
  </div>
);

const SH = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontFamily: "'Orbitron', sans-serif", color: C.gold, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span> {title}
    </div>
    {sub && <div style={{ fontSize: 11, color: C.muted, paddingLeft: 26, marginTop: 3 }}>{sub}</div>}
  </div>
);

const OK = ({ show, msg = 'Tersimpan!' }) => show
  ? <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 8, color: C.green, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>✓ {msg}</div>
  : null;

const ErrBox = ({ msg }) => msg
  ? <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 8, color: '#ff7b7b', fontSize: 12 }}>⚠️ {msg}</div>
  : null;

const Bar = ({ val }) => {
  if (!val || val <= 0 || val >= 100) return null;
  const label = val < 30 ? 'Membaca file...' : val < 50 ? 'Memuat gambar...' : val < 80 ? 'Mengkompresi...' : 'Menyimpan...';
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
        <span style={{ fontSize: 11, color: C.gold, fontFamily: "'Orbitron', sans-serif" }}>{val}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${val}%`, background: 'linear-gradient(90deg,#f39c12,#e67e22)', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

const ImgPreview = ({ file }) => {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!file) { setSrc(null); return; }
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (!src) return null;
  return (
    <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
      <img src={src} alt="preview" style={{ width: 68, height: 68, borderRadius: 10, objectFit: 'cover', border: `2px solid ${C.borderGold}` }} />
      <div style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '2px 5px', fontSize: 8, color: C.gold, fontFamily: "'Orbitron', sans-serif" }}>PREVIEW</div>
    </div>
  );
};

const SizeBadge = ({ base64 }) => {
  if (!base64) return null;
  const kb = Math.round(base64.length * 0.75 / 1024);
  const color = kb < 60 ? C.green : kb < 100 ? C.gold : C.red;
  return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: `${color}18`, color, border: `1px solid ${color}40`, fontFamily: "'Orbitron', sans-serif", marginLeft: 8 }}>~{kb}KB</span>;
};

const LI = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>{children}</div>
);

const Grid2 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>
);

// ═══════════════════════════════════════════════════════════════
// HOOK: useUpload
// ═══════════════════════════════════════════════════════════════
const useUpload = () => {
  const [prog, setProg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState('');

  const process = async (file) => {
    if (!file) return '';
    setLoading(true); setErr(''); setProg(0); setResult('');
    try {
      const b64 = await imageToBase64(file, setProg);
      setResult(b64); setLoading(false); return b64;
    } catch (e) {
      setErr(e.message); setLoading(false); setProg(0); return '';
    }
  };

  const reset = () => { setProg(0); setLoading(false); setErr(''); setResult(''); };
  return { prog, loading, err, result, process, reset };
};

// ═══════════════════════════════════════════════════════════════
// FIRESTORE USAGE MONITOR
// ═══════════════════════════════════════════════════════════════
const UsageMonitor = ({ teachers, contacts, testimoni, berita, penghargaan }) => {
  const allDocs = [...teachers, ...contacts, ...testimoni, ...berita, ...penghargaan];
  const countPhotos = allDocs.filter(x => x.photoUrl?.startsWith('data:') || x.imageUrl?.startsWith('data:')).length;
  const estimasiKB = countPhotos * 75;
  const estimasiMB = (estimasiKB / 1024).toFixed(2);
  const persen = Math.min((estimasiKB / (1024 * 1024)) * 100, 100).toFixed(1);
  const color = persen < 50 ? C.green : persen < 80 ? C.gold : C.red;
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 22 }}>🗄️</span>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Orbitron', sans-serif", letterSpacing: 0.5, marginBottom: 6 }}>ESTIMASI PEMAKAIAN FIRESTORE (FOTO BASE64)</div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
          <div style={{ height: '100%', width: `${persen}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>{countPhotos} foto · ~{estimasiMB}MB dari 1GB gratis <span style={{ color, fontFamily: "'Orbitron', sans-serif" }}>({persen}%)</span></div>
      </div>
      <div style={{ fontSize: 11, color: C.mutedMore, textAlign: 'right', flexShrink: 0 }}>
        Sisa ~{(1024 - estimasiKB / 1024).toFixed(0)}MB<br />
        <span style={{ color: C.green, fontFamily: "'Orbitron', sans-serif" }}>✓ AMAN</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB: AKTIVITAS
// ═══════════════════════════════════════════════════════════════
const TabAktivitas = ({ blogs }) => {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [ok, setOk] = useState(false);

  const add = async () => {
    if (!url.trim() || !caption.trim()) return;
    const type = url.includes('tiktok.com') ? 'tiktok' : url.includes('instagram.com') ? 'instagram' : 'link';
    await addDoc(collection(db, 'web_blog'), { url: url.trim(), caption: caption.trim(), type, createdAt: serverTimestamp() });
    setUrl(''); setCaption(''); setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return <>
    <div style={cardS}>
      <SH icon="🎬" title="Tambah Konten Aktivitas" sub="Link TikTok atau Instagram — tidak perlu upload foto" />
      <div style={{ background: 'rgba(243,156,18,0.06)', border: `1px solid ${C.borderGold}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
        ⚠️ <strong style={{ color: C.gold }}>TikTok:</strong> Gunakan link desktop penuh →{' '}
        <code style={{ color: C.gold, background: 'rgba(243,156,18,0.1)', padding: '1px 5px', borderRadius: 4 }}>https://www.tiktok.com/@username/video/12345</code><br />
        Link pendek <code style={{ color: C.red }}>vt.tiktok.com</code> tidak bisa embed.
      </div>
      <Row label="Link TikTok / Instagram">
        <input style={inp} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.tiktok.com/@bimbelgemilang/video/..." />
      </Row>
      <Row label="Caption">
        <input style={inp} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Tips Belajar Matematika Seru" />
      </Row>
      <button style={btnG} onClick={add}>+ Tambah</button>
      <OK show={ok} msg="Konten berhasil ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Daftar Konten (${blogs.length})`} />
      {!blogs.length && <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Belum ada konten aktivitas.</p>}
      {blogs.map(b => (
        <LI key={b.id}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: b.type === 'tiktok' ? 'rgba(0,0,0,0.5)' : 'rgba(131,58,180,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, border: `1px solid ${C.border}` }}>
            {b.type === 'tiktok' ? '♪' : '◻'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.caption}</div>
            <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{b.url}</div>
          </div>
          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 10, background: 'rgba(243,156,18,0.12)', color: C.gold, fontFamily: "'Orbitron', sans-serif", flexShrink: 0 }}>{b.type}</span>
          <button style={btnR} onClick={() => window.confirm('Hapus konten ini?') && deleteDoc(doc(db, 'web_blog', b.id))}>Hapus</button>
        </LI>
      ))}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: PENGAJAR
// ═══════════════════════════════════════════════════════════════
const TabPengajar = ({ teachers }) => {
  const [f, setF] = useState({ nama: '', spesialisasi: '', wa: '', bio: '' });
  const [file, setFile] = useState(null);
  const [ok, setOk] = useState(false);
  const up = useUpload();

  const add = async () => {
    if (!f.nama.trim() || !file) return;
    const photoUrl = await up.process(file);
    if (!photoUrl) return;
    await addDoc(collection(db, 'web_teachers_gallery'), { ...f, photoUrl, createdAt: serverTimestamp() });
    setF({ nama: '', spesialisasi: '', wa: '', bio: '' });
    setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return <>
    <div style={cardS}>
      <SH icon="👨‍🚀" title="Tambah Pengajar / Astronot" sub="Foto dikompresi otomatis ~50-80KB — hemat kuota Firestore" />
      <Grid2>
        <Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama lengkap pengajar" /></Row>
        <Row label="Spesialisasi"><input style={inp} value={f.spesialisasi} onChange={e => setF({ ...f, spesialisasi: e.target.value })} placeholder="Guru Matematika" /></Row>
      </Grid2>
      <Row label="WhatsApp" hint="format 628xxx">
        <input style={inp} value={f.wa} onChange={e => setF({ ...f, wa: e.target.value })} placeholder="6281234567890" />
      </Row>
      <Row label="Bio Singkat">
        <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} placeholder="Pengalaman mengajar, prestasi, dll..." />
      </Row>
      <Row label="Foto *" hint="otomatis dikompres, max 10MB input">
        <input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
          <ImgPreview file={file} />
          {up.result && <SizeBadge base64={up.result} />}
        </div>
      </Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>
        {up.loading ? `⏳ Memproses ${up.prog}%...` : '+ Tambah Pengajar'}
      </button>
      <OK show={ok} msg="Pengajar berhasil ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Tim Pengajar (${teachers.length})`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 14 }}>
        {teachers.map(t => (
          <div key={t.id} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 12px' }}>
            <img src={t.photoUrl} alt={t.nama} style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.gold}`, marginBottom: 10, boxShadow: '0 0 16px rgba(243,156,18,0.2)' }} />
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{t.nama}</div>
            <div style={{ fontSize: 11, color: C.gold, marginBottom: 12 }}>{t.spesialisasi}</div>
            <button style={btnR} onClick={() => window.confirm(`Hapus ${t.nama}?`) && deleteDoc(doc(db, 'web_teachers_gallery', t.id))}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: BERITA
// ═══════════════════════════════════════════════════════════════
const KATEGORI_LIST = ['BERITA', 'PENGUMUMAN', 'PRESTASI', 'KEGIATAN', 'PRESS', 'INFO'];

const TabBerita = ({ berita }) => {
  const [f, setF] = useState({ judul: '', isi: '', kategori: 'BERITA' });
  const [file, setFile] = useState(null);
  const [ok, setOk] = useState(false);
  const up = useUpload();

  const add = async () => {
    if (!f.judul.trim() || !f.isi.trim()) return;
    let imageUrl = '';
    if (file) { imageUrl = await up.process(file); if (!imageUrl) return; }
    await addDoc(collection(db, 'web_berita'), { ...f, imageUrl, createdAt: serverTimestamp() });
    setF({ judul: '', isi: '', kategori: 'BERITA' });
    setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return <>
    <div style={cardS}>
      <SH icon="📰" title="Tulis Berita / Pengumuman" sub="Foto opsional — dikompres otomatis kalau ada" />
      <Row label="Judul *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Judul berita yang menarik..." /></Row>
      <Row label="Kategori">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {KATEGORI_LIST.map(k => (
            <button key={k} onClick={() => setF({ ...f, kategori: k })} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: "'Orbitron', sans-serif", background: f.kategori === k ? 'rgba(243,156,18,0.18)' : 'rgba(255,255,255,0.04)', border: f.kategori === k ? `1px solid ${C.gold}` : `1px solid ${C.border}`, color: f.kategori === k ? C.gold : C.muted, transition: 'all 0.2s' }}>{k}</button>
          ))}
        </div>
      </Row>
      <Row label="Isi Berita *">
        <textarea style={{ ...inp, minHeight: 130, resize: 'vertical', lineHeight: 1.7 }} value={f.isi} onChange={e => setF({ ...f, isi: e.target.value })} placeholder="Tulis isi berita lengkap di sini..." />
      </Row>
      <Row label="Foto Cover" hint="opsional, dikompres otomatis">
        <input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
          <ImgPreview file={file} />
          {up.result && <SizeBadge base64={up.result} />}
        </div>
      </Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>
        {up.loading ? `⏳ Memproses ${up.prog}%...` : '🚀 Publikasikan'}
      </button>
      <OK show={ok} msg="Berita berhasil dipublikasikan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Berita (${berita.length})`} />
      {!berita.length && <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Belum ada berita.</p>}
      {berita.map(b => (
        <LI key={b.id}>
          {b.imageUrl ? <img src={b.imageUrl} alt={b.judul} style={{ width: 54, height: 40, borderRadius: 7, objectFit: 'cover', flexShrink: 0, border: `1px solid ${C.border}` }} />
            : <div style={{ width: 54, height: 40, borderRadius: 7, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📰</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.judul}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              <span style={{ color: C.gold, fontFamily: "'Orbitron', sans-serif", fontSize: 10 }}>{b.kategori}</span>
              {' · '}{b.createdAt?.toDate?.()?.toLocaleDateString('id-ID')}
            </div>
          </div>
          <button style={btnR} onClick={() => window.confirm('Hapus berita ini?') && deleteDoc(doc(db, 'web_berita', b.id))}>Hapus</button>
        </LI>
      ))}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: TESTIMONI
// ═══════════════════════════════════════════════════════════════
const TabTestimoni = ({ testimoni }) => {
  const [f, setF] = useState({ nama: '', kelas: '', isi: '', bintang: 5 });
  const [file, setFile] = useState(null);
  const [ok, setOk] = useState(false);
  const up = useUpload();

  const add = async () => {
    if (!f.nama.trim() || !f.isi.trim()) return;
    let photoUrl = '';
    if (file) { photoUrl = await up.process(file); if (!photoUrl) return; }
    await addDoc(collection(db, 'web_testimoni'), { ...f, photoUrl, createdAt: serverTimestamp() });
    setF({ nama: '', kelas: '', isi: '', bintang: 5 });
    setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return <>
    <div style={cardS}>
      <SH icon="⭐" title="Tambah Testimoni" sub="Cerita sukses siswa dan orang tua" />
      <Grid2>
        <Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama siswa / orang tua" /></Row>
        <Row label="Kelas / Asal"><input style={inp} value={f.kelas} onChange={e => setF({ ...f, kelas: e.target.value })} placeholder="Kelas 9A / Orang Tua" /></Row>
      </Grid2>
      <Row label="Isi Testimoni *">
        <textarea style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.7 }} value={f.isi} onChange={e => setF({ ...f, isi: e.target.value })} placeholder="Kesan dan pesan selama belajar di Bimbel Gemilang..." />
      </Row>
      <Row label="Rating">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, width: 'fit-content' }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setF({ ...f, bintang: n })} style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', filter: n <= f.bintang ? 'none' : 'grayscale(1) opacity(0.25)', transition: 'transform 0.1s', transform: n <= f.bintang ? 'scale(1.1)' : 'scale(1)' }}>⭐</button>
          ))}
          <span style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>{f.bintang}/5</span>
        </div>
      </Row>
      <Row label="Foto" hint="opsional">
        <input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
          <ImgPreview file={file} />
          {up.result && <SizeBadge base64={up.result} />}
        </div>
      </Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>
        {up.loading ? `⏳ Memproses ${up.prog}%...` : '+ Tambah Testimoni'}
      </button>
      <OK show={ok} msg="Testimoni berhasil ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Testimoni (${testimoni.length})`} />
      {!testimoni.length && <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Belum ada testimoni.</p>}
      {testimoni.map(t => (
        <LI key={t.id}>
          {t.photoUrl ? <img src={t.photoUrl} alt={t.nama} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${C.borderGold}` }} />
            : <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(243,156,18,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{t.nama} <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>· {t.kelas}</span></div>
            <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>"{t.isi}"</div>
          </div>
          <span style={{ color: C.gold, fontSize: 12, flexShrink: 0 }}>{'⭐'.repeat(t.bintang)}</span>
          <button style={btnR} onClick={() => window.confirm('Hapus testimoni ini?') && deleteDoc(doc(db, 'web_testimoni', t.id))}>Hapus</button>
        </LI>
      ))}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: PENGHARGAAN
// ═══════════════════════════════════════════════════════════════
const TabPenghargaan = ({ penghargaan }) => {
  const [f, setF] = useState({ judul: '', tahun: new Date().getFullYear().toString(), deskripsi: '' });
  const [file, setFile] = useState(null);
  const [ok, setOk] = useState(false);
  const up = useUpload();

  const add = async () => {
    if (!f.judul.trim()) return;
    let imageUrl = '';
    if (file) { imageUrl = await up.process(file); if (!imageUrl) return; }
    await addDoc(collection(db, 'web_penghargaan'), { ...f, imageUrl, createdAt: serverTimestamp() });
    setF({ judul: '', tahun: new Date().getFullYear().toString(), deskripsi: '' });
    setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return <>
    <div style={cardS}>
      <SH icon="🏆" title="Tambah Penghargaan / Award" />
      <Grid2>
        <Row label="Nama Penghargaan *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Bimbel Terpercaya..." /></Row>
        <Row label="Tahun"><input style={inp} value={f.tahun} onChange={e => setF({ ...f, tahun: e.target.value })} placeholder="2025" /></Row>
      </Grid2>
      <Row label="Deskripsi"><input style={inp} value={f.deskripsi} onChange={e => setF({ ...f, deskripsi: e.target.value })} placeholder="Keterangan singkat" /></Row>
      <Row label="Foto Piala / Sertifikat" hint="opsional">
        <input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
          <ImgPreview file={file} />
          {up.result && <SizeBadge base64={up.result} />}
        </div>
      </Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>
        {up.loading ? `⏳ Memproses ${up.prog}%...` : '+ Tambah Penghargaan'}
      </button>
      <OK show={ok} msg="Penghargaan berhasil ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Penghargaan (${penghargaan.length})`} />
      {penghargaan.map(p => (
        <LI key={p.id}>
          {p.imageUrl ? <img src={p.imageUrl} alt={p.judul} style={{ width: 46, height: 46, borderRadius: 9, objectFit: 'cover', flexShrink: 0, border: `1px solid ${C.borderGold}` }} />
            : <div style={{ width: 46, height: 46, borderRadius: 9, background: 'rgba(243,156,18,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏆</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{p.judul}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.tahun}{p.deskripsi ? ` · ${p.deskripsi}` : ''}</div>
          </div>
          <button style={btnR} onClick={() => window.confirm('Hapus penghargaan ini?') && deleteDoc(doc(db, 'web_penghargaan', p.id))}>Hapus</button>
        </LI>
      ))}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: KEUNGGULAN
// ═══════════════════════════════════════════════════════════════
const ICONS_LIST = ['🎯', '📚', '👨‍🏫', '💰', '🏫', '⭐', '🚀', '🏆', '💡', '🔬', '🎓', '🌟', '🖥️', '📐', '🏅', '🤝', '✨', '🛸', '🌙', '⚡'];

const TabKeunggulan = ({ keunggulan }) => {
  const [f, setF] = useState({ icon: '🎯', judul: '', deskripsi: '', link: '' });
  const [ok, setOk] = useState(false);

  const add = async () => {
    if (!f.judul.trim() || !f.deskripsi.trim()) return;
    await addDoc(collection(db, 'web_keunggulan'), { ...f, createdAt: serverTimestamp() });
    setF({ icon: '🎯', judul: '', deskripsi: '', link: '' });
    setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return <>
    <div style={cardS}>
      <SH icon="✨" title="Tambah Kartu Keunggulan" sub="Alasan kenapa orang tua memilih Gemilang" />
      <Row label="Pilih Icon">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ICONS_LIST.map(ic => (
            <button key={ic} onClick={() => setF({ ...f, icon: ic })} style={{ width: 42, height: 42, borderRadius: 9, border: f.icon === ic ? `2px solid ${C.gold}` : `1px solid ${C.border}`, background: f.icon === ic ? 'rgba(243,156,18,0.12)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', fontSize: 20, transition: 'all 0.15s' }}>{ic}</button>
          ))}
        </div>
      </Row>
      <Grid2>
        <Row label="Judul *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Tentor Berpengalaman" /></Row>
        <Row label="Link" hint="opsional"><input style={inp} value={f.link} onChange={e => setF({ ...f, link: e.target.value })} placeholder="https://... atau kosongkan" /></Row>
      </Grid2>
      <Row label="Deskripsi *">
        <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={f.deskripsi} onChange={e => setF({ ...f, deskripsi: e.target.value })} placeholder="Penjelasan singkat keunggulan ini..." />
      </Row>
      <button style={btnG} onClick={add}>+ Tambah Kartu</button>
      <OK show={ok} msg="Kartu keunggulan ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Kartu Keunggulan (${keunggulan.length})`} />
      {keunggulan.map(k => (
        <LI key={k.id}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(243,156,18,0.08)', border: `1px solid ${C.borderGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{k.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{k.judul}</div>
            <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{k.deskripsi}</div>
          </div>
          <button style={btnR} onClick={() => window.confirm('Hapus kartu ini?') && deleteDoc(doc(db, 'web_keunggulan', k.id))}>Hapus</button>
        </LI>
      ))}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: KONTAK
// ═══════════════════════════════════════════════════════════════
const TabKontak = ({ contacts }) => {
  const [f, setF] = useState({ nama: '', jabatan: '', wa: '' });
  const [file, setFile] = useState(null);
  const [ok, setOk] = useState(false);
  const up = useUpload();

  const add = async () => {
    if (!f.nama.trim() || !f.wa.trim() || !file) { alert('Nama, WA, dan foto wajib diisi'); return; }
    const photoUrl = await up.process(file);
    if (!photoUrl) return;
    await addDoc(collection(db, 'web_contacts'), { ...f, photoUrl });
    setF({ nama: '', jabatan: '', wa: '' });
    setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return <>
    <div style={cardS}>
      <SH icon="💬" title="Tambah Kontak Admin / WA" sub="Minimal 1 kontak agar tombol WhatsApp di website aktif" />
      <div style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.muted }}>
        💡 Kontak pertama yang tersimpan akan jadi WA utama di website publik.
      </div>
      <Grid2>
        <Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama admin" /></Row>
        <Row label="Jabatan"><input style={inp} value={f.jabatan} onChange={e => setF({ ...f, jabatan: e.target.value })} placeholder="Admin / Pemilik" /></Row>
      </Grid2>
      <Row label="No. WhatsApp *" hint="628xxx">
        <input style={inp} value={f.wa} onChange={e => setF({ ...f, wa: e.target.value })} placeholder="6281234567890" />
      </Row>
      <Row label="Foto *" hint="wajib, dikompres otomatis">
        <input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
          <ImgPreview file={file} />
          {up.result && <SizeBadge base64={up.result} />}
        </div>
      </Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>
        {up.loading ? `⏳ Memproses ${up.prog}%...` : '+ Tambah Kontak'}
      </button>
      <OK show={ok} msg="Kontak berhasil ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Kontak (${contacts.length})`} />
      {!contacts.length && <p style={{ color: C.red, fontSize: 13 }}>⚠️ Belum ada kontak! Tambahkan agar WA aktif di website.</p>}
      {contacts.map(c => (
        <LI key={c.id}>
          <img src={c.photoUrl} alt={c.nama} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,211,102,0.4)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{c.nama}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.jabatan} · {c.wa}</div>
          </div>
          <button style={btnR} onClick={() => window.confirm('Hapus kontak ini?') && deleteDoc(doc(db, 'web_contacts', c.id))}>Hapus</button>
        </LI>
      ))}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: STATISTIK
// ═══════════════════════════════════════════════════════════════
const TabStatistik = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); setOk(true); setTimeout(() => setOk(false), 2500); };
  const fields = [['stat1Num','Angka 1','100+'],['stat1Label','Label 1','Siswa Aktif'],['stat2Num','Angka 2','3+'],['stat2Label','Label 2','Tahun Berpengalaman'],['stat3Num','Angka 3','SD–SMP'],['stat3Label','Label 3','Jenjang Tersedia'],['stat4Num','Angka 4','95%'],['stat4Label','Label 4','Nilai Naik']];
  return (
    <div style={cardS}>
      <SH icon="📊" title="Statistik Hero" sub="Angka-angka ini tampil di bagian atas website publik" />
      <Grid2>{fields.map(([key, label, ph]) => (<Row key={key} label={label}><input style={inp} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} placeholder={ph} /></Row>))}</Grid2>
      <button style={btnG} onClick={save}>💾 Simpan Statistik</button>
      <OK show={ok} msg="Statistik tersimpan!" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB: SETTINGS
// ═══════════════════════════════════════════════════════════════
const TabSettings = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); setOk(true); setTimeout(() => setOk(false), 2500); };
  return <>
    <div style={cardS}>
      <SH icon="🚀" title="Teks Hero & Identitas" />
      <Grid2>
        <Row label="Nama Bimbel"><input style={inp} value={settings.heroTitle || ''} onChange={e => setSettings({ ...settings, heroTitle: e.target.value })} placeholder="GEMILANG" /></Row>
        <Row label="Tagline"><input style={inp} value={settings.heroSub || ''} onChange={e => setSettings({ ...settings, heroSub: e.target.value })} placeholder="Eksplorasi Ilmu di Galaksi..." /></Row>
      </Grid2>
      <Row label="Visi & Misi">
        <textarea style={{ ...inp, minHeight: 100, resize: 'vertical', lineHeight: 1.7 }} value={settings.visiMisi || ''} onChange={e => setSettings({ ...settings, visiMisi: e.target.value })} placeholder="Menjadi pusat pembelajaran terbaik..." />
      </Row>
      <Row label="Alamat Lengkap">
        <input style={inp} value={settings.alamat || ''} onChange={e => setSettings({ ...settings, alamat: e.target.value })} placeholder="Desa Glagahagung, Kec. Purwoharjo, Banyuwangi" />
      </Row>
    </div>
    <div style={cardS}>
      <SH icon="📱" title="Media Sosial & Maps" />
      <Grid2>
        <Row label="TikTok"><input style={inp} value={settings.tiktokUrl || ''} onChange={e => setSettings({ ...settings, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/@bimbelgemilang" /></Row>
        <Row label="Instagram"><input style={inp} value={settings.igUrl || ''} onChange={e => setSettings({ ...settings, igUrl: e.target.value })} placeholder="https://instagram.com/bimbelgemilang" /></Row>
      </Grid2>
      <Row label="Google Maps"><input style={inp} value={settings.mapsUrl || ''} onChange={e => setSettings({ ...settings, mapsUrl: e.target.value })} placeholder="https://maps.google.com/..." /></Row>
    </div>
    <button style={btnG} onClick={save}>💾 Simpan Semua Pengaturan</button>
    <OK show={ok} msg="Pengaturan tersimpan!" />
  </>;
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function ManageBlog() {
  const [tab, setTab] = useState('aktivitas');
  const [blogs, setBlogs] = useState([]); const [teachers, setTeachers] = useState([]); const [contacts, setContacts] = useState([]);
  const [berita, setBerita] = useState([]); const [testimoni, setTestimoni] = useState([]); const [penghargaan, setPenghargaan] = useState([]);
  const [keunggulan, setKeunggulan] = useState([]);
  const [settings, setSettings] = useState({ heroTitle: 'GEMILANG', heroSub: 'Eksplorasi Ilmu di Galaksi Pengetahuan', visiMisi: '', mapsUrl: '', tiktokUrl: '', igUrl: '', alamat: 'Desa Glagahagung, Banyuwangi', stat1Num: '100+', stat1Label: 'Siswa Aktif', stat2Num: '3+', stat2Label: 'Tahun Berpengalaman', stat3Num: 'SD–SMP', stat3Label: 'Jenjang Tersedia', stat4Num: '95%', stat4Label: 'Nilai Naik' });

  useEffect(() => {
    const q = (col, ord) => ord ? query(collection(db, col), orderBy(ord, 'desc')) : collection(db, col);
    const u1 = onSnapshot(q('web_blog', 'createdAt'), s => setBlogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(q('web_teachers_gallery', 'createdAt'), s => setTeachers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(q('web_contacts', null), s => setContacts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u4 = onSnapshot(q('web_berita', 'createdAt'), s => setBerita(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u5 = onSnapshot(q('web_testimoni', 'createdAt'), s => setTestimoni(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u6 = onSnapshot(q('web_penghargaan', 'createdAt'), s => setPenghargaan(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u7 = onSnapshot(q('web_keunggulan', 'createdAt'), s => setKeunggulan(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    getDoc(doc(db, 'web_settings', 'general')).then(s => { if (s.exists()) setSettings(p => ({ ...p, ...s.data() })); });
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
  }, []);

  const tabs = [
    { key: 'aktivitas', icon: '🎬', label: 'Aktivitas', count: blogs.length },
    { key: 'pengajar', icon: '👨‍🚀', label: 'Pengajar', count: teachers.length },
    { key: 'berita', icon: '📰', label: 'Berita', count: berita.length },
    { key: 'testimoni', icon: '⭐', label: 'Testimoni', count: testimoni.length },
    { key: 'penghargaan', icon: '🏆', label: 'Penghargaan', count: penghargaan.length },
    { key: 'keunggulan', icon: '✨', label: 'Keunggulan', count: keunggulan.length },
    { key: 'kontak', icon: '💬', label: 'Kontak', count: contacts.length },
    { key: 'statistik', icon: '📊', label: 'Statistik', count: null },
    { key: 'settings', icon: '⚙️', label: 'Pengaturan', count: null },
  ];

  const currentTab = tabs.find(t => t.key === tab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        input, select, textarea { color: ${C.text} !important; }
        input:focus, select:focus, textarea:focus { border-color: rgba(243,156,18,0.5) !important; box-shadow: 0 0 0 3px rgba(243,156,18,0.07) !important; }
        input[type="file"]::file-selector-button { background: rgba(243,156,18,0.1); border: 1px solid rgba(243,156,18,0.3); color: #f39c12; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'Orbitron', sans-serif; margin-right: 10px; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(243,156,18,0.25); border-radius: 2px; }
        option { background: #0a0c18; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 228, background: 'rgba(255,255,255,0.02)', borderRight: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 50, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '20px 18px 14px', borderBottom: `1px solid ${C.border}` }}>
          <img src="/logo-gemilang.png.png" alt="Logo" style={{ height: 36, marginBottom: 8, filter: 'drop-shadow(0 0 10px rgba(243,156,18,0.4))' }} onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 8, color: 'rgba(243,156,18,0.55)', letterSpacing: 2.5 }}>MISSION CONTROL</div>
          <div style={{ fontSize: 10, color: C.mutedMore, marginTop: 3 }}>Web Bimbel Gemilang</div>
        </div>
        <nav style={{ padding: '10px 8px', flex: 1 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left', background: tab === t.key ? 'rgba(243,156,18,0.11)' : 'transparent', borderLeft: tab === t.key ? `3px solid ${C.gold}` : '3px solid transparent', color: tab === t.key ? C.gold : C.muted, fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: 0.3, transition: 'all 0.15s' }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {t.count !== null && <span style={{ background: tab === t.key ? 'rgba(243,156,18,0.18)' : 'rgba(255,255,255,0.05)', color: tab === t.key ? C.gold : C.mutedMore, fontSize: 10, padding: '1px 7px', borderRadius: 8, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{t.count}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.mutedMore, marginBottom: 3 }}>📦 Foto → Firestore (Base64)</div>
          <div style={{ fontSize: 10, color: C.green }}>✓ Tanpa Firebase Storage</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 228, flex: 1, padding: '24px 28px 60px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(14px,2vw,18px)', color: C.gold, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {currentTab?.icon} {currentTab?.label}
            </h1>
            <p style={{ color: C.mutedMore, fontSize: 11, margin: 0 }}>Mission Control · Bimbel Gemilang · Glagahagung, Banyuwangi</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['🎬', blogs.length, 'Konten'], ['👨‍🚀', teachers.length, 'Pengajar'], ['📰', berita.length, 'Berita'], ['⭐', testimoni.length, 'Testimoni']].map(([icon, count, label]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 13px', textAlign: 'center', minWidth: 56 }}>
                <div style={{ fontSize: 14 }}>{icon}</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, color: C.gold, fontWeight: 700, lineHeight: 1.1 }}>{count}</div>
                <div style={{ fontSize: 9, color: C.mutedMore, marginTop: 2, fontFamily: "'Orbitron', sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Monitor */}
        <UsageMonitor teachers={teachers} contacts={contacts} testimoni={testimoni} berita={berita} penghargaan={penghargaan} />

        {/* Tab Content */}
        {tab === 'aktivitas' && <TabAktivitas blogs={blogs} />}
        {tab === 'pengajar' && <TabPengajar teachers={teachers} />}
        {tab === 'berita' && <TabBerita berita={berita} />}
        {tab === 'testimoni' && <TabTestimoni testimoni={testimoni} />}
        {tab === 'penghargaan' && <TabPenghargaan penghargaan={penghargaan} />}
        {tab === 'keunggulan' && <TabKeunggulan keunggulan={keunggulan} />}
        {tab === 'kontak' && <TabKontak contacts={contacts} />}
        {tab === 'statistik' && <TabStatistik settings={settings} setSettings={setSettings} />}
        {tab === 'settings' && <TabSettings settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
}