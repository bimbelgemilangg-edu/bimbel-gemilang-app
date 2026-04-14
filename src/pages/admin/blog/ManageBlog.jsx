import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../../../firebase';
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, deleteDoc, doc, setDoc, getDoc, updateDoc
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// BASE64 IMAGE ENGINE dengan CROP TOOL
// ═══════════════════════════════════════════════════════════════
const imageToBase64 = (file, onProgress, maxPx = 600, quality = 0.78) =>
  new Promise((resolve, reject) => {
    if (!file) { reject(new Error('Tidak ada file')); return; }
    if (!file.type.startsWith('image/')) { reject(new Error('File harus berupa gambar')); return; }
    if (file.size > 15 * 1024 * 1024) { reject(new Error('Ukuran file maksimal 15MB')); return; }
    onProgress?.(10);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = e => {
      onProgress?.(30);
      const img = new Image();
      img.onerror = () => reject(new Error('Gambar rusak'));
      img.onload = () => {
        onProgress?.(55);
        const ratio = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        onProgress?.(85);
        const b64 = canvas.toDataURL('image/jpeg', quality);
        onProgress?.(100);
        console.log(`✅ ${w}×${h}px ~${Math.round(b64.length * 0.75 / 1024)}KB`);
        resolve(b64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

// CROP MODAL — square crop interaktif sebelum upload
const CropModal = ({ file, onDone, onCancel }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.75;
    const x = (img.naturalWidth - size) / 2;
    const y = (img.naturalHeight - size) / 2;
    setCrop({ x, y, size });
  }, [imgLoaded]);

  const drawCrop = useCallback(() => {
    if (!canvasRef.current || !imgRef.current || !imgLoaded) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(crop.x, crop.y, crop.size, crop.size);
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 3;
    ctx.strokeRect(crop.x, crop.y, crop.size, crop.size);
    // grid lines
    ctx.strokeStyle = 'rgba(243,156,18,0.4)';
    ctx.lineWidth = 1;
    [1/3, 2/3].forEach(f => {
      ctx.beginPath(); ctx.moveTo(crop.x + crop.size * f, crop.y); ctx.lineTo(crop.x + crop.size * f, crop.y + crop.size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(crop.x, crop.y + crop.size * f); ctx.lineTo(crop.x + crop.size, crop.y + crop.size * f); ctx.stroke();
    });
  }, [crop, imgLoaded]);

  useEffect(() => { drawCrop(); }, [drawCrop]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const onMouseDown = e => {
    const pos = getPos(e, canvasRef.current);
    const inCrop = pos.x >= crop.x && pos.x <= crop.x + crop.size && pos.y >= crop.y && pos.y <= crop.y + crop.size;
    if (inCrop) setDrag({ startX: pos.x - crop.x, startY: pos.y - crop.y });
  };

  const onMouseMove = e => {
    if (!drag || !canvasRef.current) return;
    const pos = getPos(e, canvasRef.current);
    const canvas = canvasRef.current;
    const newX = Math.max(0, Math.min(canvas.width - crop.size, pos.x - drag.startX));
    const newY = Math.max(0, Math.min(canvas.height - crop.size, pos.y - drag.startY));
    setCrop(c => ({ ...c, x: newX, y: newY }));
  };

  const onMouseUp = () => setDrag(null);

  const changeSize = delta => {
    setCrop(c => {
      const newSize = Math.max(100, Math.min(Math.min(canvasRef.current?.width || 9999, canvasRef.current?.height || 9999), c.size + delta));
      const newX = Math.max(0, Math.min((canvasRef.current?.width || 9999) - newSize, c.x));
      const newY = Math.max(0, Math.min((canvasRef.current?.height || 9999) - newSize, c.y));
      return { x: newX, y: newY, size: newSize };
    });
  };

  const doApply = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement('canvas');
    out.width = 400; out.height = 400;
    out.getContext('2d').drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, 400, 400);
    const b64 = out.toDataURL('image/jpeg', 0.82);
    onDone(b64);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#0d1220', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 18, padding: 24, maxWidth: 600, width: '100%' }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 14, marginBottom: 16 }}>✂️ Crop Foto — Geser kotak kuning</div>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 10, cursor: drag ? 'grabbing' : 'grab', touchAction: 'none' }}>
          <img ref={imgRef} src={imgSrc} onLoad={() => setImgLoaded(true)} style={{ display: 'none' }} alt="" />
          <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => changeSize(-50)} style={{ ...btnSm, background: 'rgba(255,255,255,0.08)' }}>− Kecilkan</button>
          <button onClick={() => changeSize(50)} style={{ ...btnSm, background: 'rgba(255,255,255,0.08)' }}>+ Besarkan</button>
          <div style={{ flex: 1 }} />
          <button onClick={onCancel} style={{ ...btnSm, background: 'rgba(231,76,60,0.15)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.3)' }}>Batal</button>
          <button onClick={doApply} style={{ ...btnSm, background: 'linear-gradient(135deg,#f39c12,#e67e22)', color: '#0a0a1a', fontWeight: 800 }}>✓ Terapkan Crop</button>
        </div>
      </div>
    </div>
  );
};

const btnSm = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'Orbitron',sans-serif", color: 'white' };

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: '#080a12', bgCard: 'rgba(255,255,255,0.035)', border: 'rgba(255,255,255,0.08)',
  borderGold: 'rgba(243,156,18,0.35)', gold: '#f39c12', muted: 'rgba(255,255,255,0.4)',
  mutedMore: 'rgba(255,255,255,0.22)', green: '#25D366', red: '#e74c3c', text: 'rgba(255,255,255,0.88)',
};
const inp = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: "'Nunito',sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' };
const cardS = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: '24px 26px', marginBottom: 20 };
const btnG = { padding: '11px 24px', background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', borderRadius: 10, color: '#0a0a1a', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 6 };
const btnR = { padding: '5px 12px', background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, color: C.red, fontSize: 11, cursor: 'pointer' };

// ═══════════════════════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════════════════════
const Row = ({ label, children, hint }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: "'Orbitron',sans-serif" }}>
      {label}{hint && <span style={{ fontSize: 10, color: C.mutedMore, textTransform: 'none', fontFamily: "'Nunito',sans-serif", letterSpacing: 0 }}>— {hint}</span>}
    </label>
    {children}
  </div>
);
const SH = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontFamily: "'Orbitron',sans-serif", color: C.gold, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span> {title}
    </div>
    {sub && <div style={{ fontSize: 11, color: C.muted, paddingLeft: 26, marginTop: 3 }}>{sub}</div>}
  </div>
);
const OK = ({ show, msg = 'Tersimpan!' }) => show ? <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 8, color: C.green, fontSize: 13 }}>✓ {msg}</div> : null;
const ErrBox = ({ msg }) => msg ? <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 8, color: '#ff7b7b', fontSize: 12 }}>⚠️ {msg}</div> : null;
const Bar = ({ val }) => {
  if (!val || val <= 0 || val >= 100) return null;
  const label = val < 30 ? 'Membaca...' : val < 55 ? 'Memuat gambar...' : val < 85 ? 'Mengkompresi...' : 'Menyimpan...';
  return <div style={{ marginTop: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 11, color: C.muted }}>{label}</span><span style={{ fontSize: 11, color: C.gold, fontFamily: "'Orbitron',sans-serif" }}>{val}%</span></div><div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${val}%`, background: 'linear-gradient(90deg,#f39c12,#e67e22)', borderRadius: 2, transition: 'width 0.4s' }} /></div></div>;
};
const SizeBadge = ({ base64 }) => { if (!base64) return null; const kb = Math.round(base64.length * 0.75 / 1024); const color = kb < 60 ? C.green : kb < 100 ? C.gold : C.red; return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: `${color}18`, color, border: `1px solid ${color}40`, fontFamily: "'Orbitron',sans-serif", marginLeft: 8 }}>~{kb}KB</span>; };
const LI = ({ children }) => <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>{children}</div>;
const Grid2 = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;

// ═══════════════════════════════════════════════════════════════
// HOOK: useUpload dengan crop support
// ═══════════════════════════════════════════════════════════════
const useUpload = (withCrop = false) => {
  const [prog, setProg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState('');
  const [cropFile, setCropFile] = useState(null);
  const [pendingResolve, setPendingResolve] = useState(null);

  const process = async (file) => {
    if (!file) return '';
    if (withCrop) {
      return new Promise(resolve => {
        setCropFile(file);
        setPendingResolve(() => resolve);
      });
    }
    return processRaw(file);
  };

  const processRaw = async (file) => {
    setLoading(true); setErr(''); setProg(0); setResult('');
    try {
      const b64 = await imageToBase64(file, setProg);
      setResult(b64); setLoading(false); return b64;
    } catch (e) { setErr(e.message); setLoading(false); setProg(0); return ''; }
  };

  const onCropDone = async (b64) => {
    setCropFile(null);
    setResult(b64);
    if (pendingResolve) { pendingResolve(b64); setPendingResolve(null); }
  };

  const onCropCancel = () => {
    setCropFile(null);
    if (pendingResolve) { pendingResolve(''); setPendingResolve(null); }
  };

  const reset = () => { setProg(0); setLoading(false); setErr(''); setResult(''); setCropFile(null); };

  return { prog, loading, err, result, process, reset, cropFile, onCropDone, onCropCancel };
};

// ═══════════════════════════════════════════════════════════════
// USAGE MONITOR
// ═══════════════════════════════════════════════════════════════
const UsageMonitor = ({ teachers, contacts, testimoni, berita, penghargaan }) => {
  const all = [...teachers, ...contacts, ...testimoni, ...berita, ...penghargaan];
  const n = all.filter(x => x.photoUrl?.startsWith('data:') || x.imageUrl?.startsWith('data:')).length;
  const kb = n * 75; const mb = (kb / 1024).toFixed(2); const pct = Math.min((kb / (1024 * 1024)) * 100, 100).toFixed(1);
  const color = pct < 50 ? C.green : pct < 80 ? C.gold : C.red;
  return <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
    <span style={{ fontSize: 22 }}>🗄️</span>
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5, marginBottom: 6 }}>ESTIMASI PEMAKAIAN FIRESTORE</div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}><div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} /></div>
      <div style={{ fontSize: 11, color: C.muted }}>{n} foto · ~{mb}MB dari 1GB <span style={{ color, fontFamily: "'Orbitron',sans-serif" }}>({pct}%)</span></div>
    </div>
    <div style={{ fontSize: 11, color: C.mutedMore, textAlign: 'right' }}>Sisa ~{(1024 - kb / 1024).toFixed(0)}MB<br /><span style={{ color: C.green }}>✓ AMAN</span></div>
  </div>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: AKTIVITAS
// ═══════════════════════════════════════════════════════════════
const TabAktivitas = ({ blogs }) => {
  const [url, setUrl] = useState(''); const [caption, setCaption] = useState(''); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!url.trim() || !caption.trim()) return;
    const type = url.includes('tiktok.com') ? 'tiktok' : url.includes('instagram.com') ? 'instagram' : 'link';
    await addDoc(collection(db, 'web_blog'), { url: url.trim(), caption: caption.trim(), type, createdAt: serverTimestamp() });
    setUrl(''); setCaption(''); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <>
    <div style={cardS}>
      <SH icon="🎬" title="Tambah Konten Aktivitas" sub="Link TikTok atau Instagram" />
      <div style={{ background: 'rgba(243,156,18,0.06)', border: `1px solid ${C.borderGold}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
        ⚠️ <strong style={{ color: C.gold }}>TikTok:</strong> Gunakan link desktop penuh → <code style={{ color: C.gold, background: 'rgba(243,156,18,0.1)', padding: '1px 5px', borderRadius: 4 }}>https://www.tiktok.com/@username/video/12345</code>
      </div>
      <Row label="Link TikTok / Instagram"><input style={inp} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.tiktok.com/@bimbelgemilang/video/..." /></Row>
      <Row label="Caption"><input style={inp} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Tips Belajar Matematika Seru" /></Row>
      <button style={btnG} onClick={add}>+ Tambah</button><OK show={ok} msg="Konten ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Daftar Konten (${blogs.length})`} />
      {!blogs.length && <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Belum ada konten.</p>}
      {blogs.map(b => <LI key={b.id}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: b.type === 'tiktok' ? 'rgba(0,0,0,0.5)' : 'rgba(131,58,180,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, border: `1px solid ${C.border}` }}>{b.type === 'tiktok' ? '♪' : '◻'}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.caption}</div><div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{b.url}</div></div>
        <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 10, background: 'rgba(243,156,18,0.12)', color: C.gold, fontFamily: "'Orbitron',sans-serif", flexShrink: 0 }}>{b.type}</span>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_blog', b.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: PENGAJAR — dengan crop
// ═══════════════════════════════════════════════════════════════
const TabPengajar = ({ teachers }) => {
  const [f, setF] = useState({ nama: '', spesialisasi: '', wa: '', bio: '' });
  const [file, setFile] = useState(null); const [ok, setOk] = useState(false);
  const up = useUpload(true); // withCrop = true

  const add = async () => {
    if (!f.nama.trim() || !file) return;
    const photoUrl = await up.process(file);
    if (!photoUrl) return;
    await addDoc(collection(db, 'web_teachers_gallery'), { ...f, photoUrl, createdAt: serverTimestamp() });
    setF({ nama: '', spesialisasi: '', wa: '', bio: '' }); setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return <>
    {up.cropFile && <CropModal file={up.cropFile} onDone={up.onCropDone} onCancel={up.onCropCancel} />}
    <div style={cardS}>
      <SH icon="👨‍🚀" title="Tambah Pengajar / Astronot" sub="Foto akan di-crop dulu sebelum upload — hasil selalu rapi" />
      <Grid2>
        <Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama lengkap" /></Row>
        <Row label="Spesialisasi"><input style={inp} value={f.spesialisasi} onChange={e => setF({ ...f, spesialisasi: e.target.value })} placeholder="Guru Matematika" /></Row>
      </Grid2>
      <Row label="WhatsApp" hint="628xxx"><input style={inp} value={f.wa} onChange={e => setF({ ...f, wa: e.target.value })} placeholder="6281234567890" /></Row>
      <Row label="Bio Singkat"><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} placeholder="Pengalaman mengajar..." /></Row>
      <Row label="Foto *" hint="akan dibuka crop tool dulu">
        <input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />
        {up.result && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}><img src={up.result} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.gold}` }} /><SizeBadge base64={up.result} /><span style={{ fontSize: 11, color: C.green }}>✓ Siap upload</span></div>}
      </Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>{up.loading ? `⏳ ${up.prog}%...` : '+ Tambah Pengajar'}</button>
      <OK show={ok} msg="Pengajar berhasil ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Tim Pengajar (${teachers.length})`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 14 }}>
        {teachers.map(t => <div key={t.id} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 12px' }}>
          <img src={t.photoUrl} alt={t.nama} style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.gold}`, marginBottom: 10 }} />
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{t.nama}</div>
          <div style={{ fontSize: 11, color: C.gold, marginBottom: 12 }}>{t.spesialisasi}</div>
          <button style={btnR} onClick={() => window.confirm(`Hapus ${t.nama}?`) && deleteDoc(doc(db, 'web_teachers_gallery', t.id))}>Hapus</button>
        </div>)}
      </div>
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: BERITA
// ═══════════════════════════════════════════════════════════════
const KATEGORI_LIST = ['BERITA', 'PENGUMUMAN', 'PRESTASI', 'KEGIATAN', 'PRESS', 'INFO'];
const TabBerita = ({ berita }) => {
  const [f, setF] = useState({ judul: '', isi: '', kategori: 'BERITA' }); const [file, setFile] = useState(null); const [ok, setOk] = useState(false);
  const up = useUpload();
  const add = async () => {
    if (!f.judul.trim() || !f.isi.trim()) return;
    let imageUrl = ''; if (file) { imageUrl = await up.process(file); if (!imageUrl) return; }
    await addDoc(collection(db, 'web_berita'), { ...f, imageUrl, createdAt: serverTimestamp() });
    setF({ judul: '', isi: '', kategori: 'BERITA' }); setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <>
    <div style={cardS}>
      <SH icon="📰" title="Tulis Berita / Pengumuman" />
      <Row label="Judul *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Judul berita..." /></Row>
      <Row label="Kategori"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{KATEGORI_LIST.map(k => <button key={k} onClick={() => setF({ ...f, kategori: k })} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", background: f.kategori === k ? 'rgba(243,156,18,0.18)' : 'rgba(255,255,255,0.04)', border: f.kategori === k ? `1px solid ${C.gold}` : `1px solid ${C.border}`, color: f.kategori === k ? C.gold : C.muted, transition: 'all 0.2s' }}>{k}</button>)}</div></Row>
      <Row label="Isi Berita *"><textarea style={{ ...inp, minHeight: 130, resize: 'vertical', lineHeight: 1.7 }} value={f.isi} onChange={e => setF({ ...f, isi: e.target.value })} placeholder="Isi berita lengkap..." /></Row>
      <Row label="Foto Cover" hint="opsional"><input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />{up.result && <div style={{ marginTop: 6, display: 'flex', alignItems: 'center' }}><img src={up.result} alt="" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6, border: `1px solid ${C.borderGold}` }} /><SizeBadge base64={up.result} /></div>}</Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>{up.loading ? `⏳ ${up.prog}%...` : '🚀 Publikasikan'}</button>
      <OK show={ok} msg="Berita dipublikasikan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Berita (${berita.length})`} />
      {berita.map(b => <LI key={b.id}>
        {b.imageUrl ? <img src={b.imageUrl} alt="" style={{ width: 54, height: 40, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 54, height: 40, borderRadius: 7, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📰</div>}
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.judul}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}><span style={{ color: C.gold, fontFamily: "'Orbitron',sans-serif", fontSize: 10 }}>{b.kategori}</span> · {b.createdAt?.toDate?.()?.toLocaleDateString('id-ID')}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_berita', b.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: TESTIMONI
// ═══════════════════════════════════════════════════════════════
const TabTestimoni = ({ testimoni }) => {
  const [f, setF] = useState({ nama: '', kelas: '', isi: '', bintang: 5 }); const [file, setFile] = useState(null); const [ok, setOk] = useState(false);
  const up = useUpload(true);
  const add = async () => {
    if (!f.nama.trim() || !f.isi.trim()) return;
    let photoUrl = ''; if (file) { photoUrl = await up.process(file); if (!photoUrl) return; }
    await addDoc(collection(db, 'web_testimoni'), { ...f, photoUrl, createdAt: serverTimestamp() });
    setF({ nama: '', kelas: '', isi: '', bintang: 5 }); setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <>
    {up.cropFile && <CropModal file={up.cropFile} onDone={up.onCropDone} onCancel={up.onCropCancel} />}
    <div style={cardS}>
      <SH icon="⭐" title="Tambah Testimoni" />
      <Grid2>
        <Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama siswa / ortu" /></Row>
        <Row label="Kelas / Asal"><input style={inp} value={f.kelas} onChange={e => setF({ ...f, kelas: e.target.value })} placeholder="Kelas 9A / Orang Tua" /></Row>
      </Grid2>
      <Row label="Isi Testimoni *"><textarea style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.7 }} value={f.isi} onChange={e => setF({ ...f, isi: e.target.value })} placeholder="Kesan dan pesan..." /></Row>
      <Row label="Rating"><div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, width: 'fit-content' }}>{[1,2,3,4,5].map(n => <button key={n} onClick={() => setF({ ...f, bintang: n })} style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', filter: n <= f.bintang ? 'none' : 'grayscale(1) opacity(0.25)', transform: n <= f.bintang ? 'scale(1.1)' : 'scale(1)' }}>⭐</button>)}<span style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>{f.bintang}/5</span></div></Row>
      <Row label="Foto" hint="opsional, akan di-crop"><input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />{up.result && <div style={{ marginTop: 6, display: 'flex', alignItems: 'center' }}><img src={up.result} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.borderGold}` }} /><SizeBadge base64={up.result} /></div>}</Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>{up.loading ? `⏳ ${up.prog}%...` : '+ Tambah Testimoni'}</button>
      <OK show={ok} msg="Testimoni ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Testimoni (${testimoni.length})`} />
      {testimoni.map(t => <LI key={t.id}>
        {t.photoUrl ? <img src={t.photoUrl} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${C.borderGold}` }} /> : <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(243,156,18,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>}
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{t.nama} <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>· {t.kelas}</span></div><div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{t.isi}"</div></div>
        <span style={{ color: C.gold, fontSize: 12, flexShrink: 0 }}>{'⭐'.repeat(t.bintang)}</span>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_testimoni', t.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: PENGHARGAAN
// ═══════════════════════════════════════════════════════════════
const TabPenghargaan = ({ penghargaan }) => {
  const [f, setF] = useState({ judul: '', tahun: new Date().getFullYear().toString(), deskripsi: '' }); const [file, setFile] = useState(null); const [ok, setOk] = useState(false);
  const up = useUpload();
  const add = async () => {
    if (!f.judul.trim()) return;
    let imageUrl = ''; if (file) { imageUrl = await up.process(file); if (!imageUrl) return; }
    await addDoc(collection(db, 'web_penghargaan'), { ...f, imageUrl, createdAt: serverTimestamp() });
    setF({ judul: '', tahun: new Date().getFullYear().toString(), deskripsi: '' }); setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <>
    <div style={cardS}>
      <SH icon="🏆" title="Tambah Penghargaan / Award" />
      <Grid2><Row label="Nama *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Bimbel Terpercaya..." /></Row><Row label="Tahun"><input style={inp} value={f.tahun} onChange={e => setF({ ...f, tahun: e.target.value })} placeholder="2025" /></Row></Grid2>
      <Row label="Deskripsi"><input style={inp} value={f.deskripsi} onChange={e => setF({ ...f, deskripsi: e.target.value })} placeholder="Keterangan singkat" /></Row>
      <Row label="Foto" hint="opsional"><input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} /></Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>{up.loading ? `⏳ ${up.prog}%...` : '+ Tambah'}</button>
      <OK show={ok} msg="Penghargaan ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Penghargaan (${penghargaan.length})`} />
      {penghargaan.map(p => <LI key={p.id}>
        {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: 46, height: 46, borderRadius: 9, objectFit: 'cover', flexShrink: 0, border: `1px solid ${C.borderGold}` }} /> : <div style={{ width: 46, height: 46, borderRadius: 9, background: 'rgba(243,156,18,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏆</div>}
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{p.judul}</div><div style={{ fontSize: 12, color: C.muted }}>{p.tahun}{p.deskripsi ? ` · ${p.deskripsi}` : ''}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_penghargaan', p.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: KEUNGGULAN
// ═══════════════════════════════════════════════════════════════
const ICONS_LIST = ['🎯','📚','👨‍🏫','💰','🏫','⭐','🚀','🏆','💡','🔬','🎓','🌟','🖥️','📐','🏅','🤝','✨','🛸','🌙','⚡','🎮','📊','🔒','🌈'];
const TabKeunggulan = ({ keunggulan }) => {
  const [f, setF] = useState({ icon: '🎯', judul: '', deskripsi: '', link: '' }); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!f.judul.trim() || !f.deskripsi.trim()) return;
    await addDoc(collection(db, 'web_keunggulan'), { ...f, createdAt: serverTimestamp() });
    setF({ icon: '🎯', judul: '', deskripsi: '', link: '' }); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <>
    <div style={cardS}>
      <SH icon="✨" title="Tambah Kartu Keunggulan" />
      <Row label="Pilih Icon"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{ICONS_LIST.map(ic => <button key={ic} onClick={() => setF({ ...f, icon: ic })} style={{ width: 42, height: 42, borderRadius: 9, border: f.icon === ic ? `2px solid ${C.gold}` : `1px solid ${C.border}`, background: f.icon === ic ? 'rgba(243,156,18,0.12)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', fontSize: 20, transition: 'all 0.15s' }}>{ic}</button>)}</div></Row>
      <Grid2><Row label="Judul *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Tentor Berpengalaman" /></Row><Row label="Link" hint="opsional"><input style={inp} value={f.link} onChange={e => setF({ ...f, link: e.target.value })} placeholder="https://..." /></Row></Grid2>
      <Row label="Deskripsi *"><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={f.deskripsi} onChange={e => setF({ ...f, deskripsi: e.target.value })} placeholder="Penjelasan singkat..." /></Row>
      <button style={btnG} onClick={add}>+ Tambah Kartu</button><OK show={ok} msg="Kartu ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Kartu Keunggulan (${keunggulan.length})`} />
      {keunggulan.map(k => <LI key={k.id}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(243,156,18,0.08)', border: `1px solid ${C.borderGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{k.icon}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{k.judul}</div><div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.deskripsi}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_keunggulan', k.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: KONTAK
// ═══════════════════════════════════════════════════════════════
const TabKontak = ({ contacts }) => {
  const [f, setF] = useState({ nama: '', jabatan: '', wa: '' }); const [file, setFile] = useState(null); const [ok, setOk] = useState(false);
  const up = useUpload(true);
  const add = async () => {
    if (!f.nama.trim() || !f.wa.trim() || !file) { alert('Nama, WA, dan foto wajib'); return; }
    const photoUrl = await up.process(file);
    if (!photoUrl) return;
    await addDoc(collection(db, 'web_contacts'), { ...f, photoUrl });
    setF({ nama: '', jabatan: '', wa: '' }); setFile(null); up.reset(); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <>
    {up.cropFile && <CropModal file={up.cropFile} onDone={up.onCropDone} onCancel={up.onCropCancel} />}
    <div style={cardS}>
      <SH icon="💬" title="Tambah Kontak Admin" sub="Minimal 1 kontak agar WA aktif di website" />
      <Grid2><Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama admin" /></Row><Row label="Jabatan"><input style={inp} value={f.jabatan} onChange={e => setF({ ...f, jabatan: e.target.value })} placeholder="Admin / Pemilik" /></Row></Grid2>
      <Row label="No. WhatsApp *" hint="628xxx"><input style={inp} value={f.wa} onChange={e => setF({ ...f, wa: e.target.value })} placeholder="6281234567890" /></Row>
      <Row label="Foto *" hint="akan di-crop otomatis"><input type="file" accept="image/*" onChange={e => { setFile(e.target.files[0]); up.reset(); }} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />{up.result && <div style={{ marginTop: 6, display: 'flex', alignItems: 'center' }}><img src={up.result} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,211,102,0.5)' }} /><SizeBadge base64={up.result} /></div>}</Row>
      <Bar val={up.prog} /><ErrBox msg={up.err} />
      <button style={{ ...btnG, marginTop: 12, opacity: up.loading ? 0.7 : 1 }} onClick={add} disabled={up.loading}>{up.loading ? `⏳ ${up.prog}%...` : '+ Tambah Kontak'}</button>
      <OK show={ok} msg="Kontak ditambahkan!" />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Kontak (${contacts.length})`} />
      {!contacts.length && <p style={{ color: C.red, fontSize: 13 }}>⚠️ Belum ada kontak! WA tidak aktif.</p>}
      {contacts.map(c => <LI key={c.id}>
        <img src={c.photoUrl} alt={c.nama} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,211,102,0.4)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{c.nama}</div><div style={{ fontSize: 12, color: C.muted }}>{c.jabatan} · {c.wa}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_contacts', c.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: TENTANG — FULL EDIT semua konten
// ═══════════════════════════════════════════════════════════════
const TabTentang = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const [founderFile, setFounderFile] = useState(null);
  const up = useUpload(true);

  const save = async () => {
    await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true });
    setOk(true); setTimeout(() => setOk(false), 2500);
  };

  const uploadFounder = async () => {
    if (!founderFile) return;
    const b64 = await up.process(founderFile);
    if (!b64) return;
    setSettings({ ...settings, founderPhoto: b64 });
    setFounderFile(null);
  };

  const S = (key) => ({ value: settings[key] || '', onChange: e => setSettings({ ...settings, [key]: e.target.value }) });

  return <>
    {up.cropFile && <CropModal file={up.cropFile} onDone={up.onCropDone} onCancel={up.onCropCancel} />}

    {/* FOUNDER */}
    <div style={cardS}>
      <SH icon="👤" title="Profil Founder" sub="Tampil di section Tentang Kami" />
      <Grid2>
        <Row label="Nama Founder"><input style={inp} {...S('founderName')} placeholder="Wildan Bima Prakusya, S.I.Kom." /></Row>
        <Row label="Gelar / Jabatan"><input style={inp} {...S('founderTitle')} placeholder="Founder & CEO" /></Row>
      </Grid2>
      <Row label="Pesan Founder"><textarea style={{ ...inp, minHeight: 120, resize: 'vertical', lineHeight: 1.7 }} {...S('founderMessage')} placeholder="Pesan dari founder kepada orang tua dan siswa..." /></Row>
      <Row label="Foto Founder" hint="akan di-crop">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {settings.founderPhoto && <img src={settings.founderPhoto} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.gold}` }} />}
          <div style={{ flex: 1 }}>
            <input type="file" accept="image/*" onChange={e => setFounderFile(e.target.files[0])} style={{ ...inp, padding: '9px 14px', cursor: 'pointer' }} />
            {founderFile && <button style={{ ...btnG, marginTop: 8, fontSize: 12 }} onClick={uploadFounder}>Upload Foto Founder</button>}
          </div>
        </div>
      </Row>
    </div>

    {/* VISI MISI */}
    <div style={cardS}>
      <SH icon="🎯" title="Visi, Misi & Tagline" />
      <Row label="Visi"><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} {...S('visi')} placeholder="Menjadi mitra belajar terdepan..." /></Row>
      <Row label="Misi"><textarea style={{ ...inp, minHeight: 100, resize: 'vertical', lineHeight: 1.7 }} {...S('misiLengkap')} placeholder="Program komprehensif berfokus pada..." /></Row>
      <Row label="Tagline Utama"><input style={inp} {...S('taglineUtama')} placeholder="Kami percaya setiap anak punya cara sendiri untuk menjadi GEMILANG!" /></Row>
    </div>

    {/* CORE VALUES */}
    <div style={cardS}>
      <SH icon="💎" title="Core Values (Nilai Inti)" sub="Tampil sebagai kartu di section Tentang" />
      {[['coreValue1Title','Judul 1','Pondasi Kuat'],['coreValue1Desc','Deskripsi 1','Kami membangun pemahaman konseptual yang mendalam...'],
        ['coreValue2Title','Judul 2','Pencerahan Kreatif'],['coreValue2Desc','Deskripsi 2','Kami menyalakan api kecerdasan dan kreativitas...'],
        ['coreValue3Title','Judul 3','Aplikasi Nyata'],['coreValue3Desc','Deskripsi 3','Kami melengkapi siswa dengan keterampilan praktis...'],
        ['coreValue4Title','Judul 4','Komitmen Bersama'],['coreValue4Desc','Deskripsi 4','Kami menjalin kemitraan aktif dengan orang tua...']
      ].reduce((rows, item, i) => {
        if (i % 2 === 0) rows.push([]);
        rows[rows.length - 1].push(item);
        return rows;
      }, []).map((pair, ri) => (
        <Grid2 key={ri}>
          {pair.map(([key, label, ph]) => (
            key.includes('Desc') ?
              <Row key={key} label={label}><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} {...S(key)} placeholder={ph} /></Row> :
              <Row key={key} label={label}><input style={inp} {...S(key)} placeholder={ph} /></Row>
          ))}
        </Grid2>
      ))}
    </div>

    {/* OPERASIONAL */}
    <div style={cardS}>
      <SH icon="🕐" title="Info Operasional" sub="Jam buka, lokasi, dll — semua bisa diubah" />
      <Grid2>
        <Row label="Hari Operasional"><input style={inp} {...S('hariOperasional')} placeholder="Senin – Sabtu" /></Row>
        <Row label="Jam Operasional"><input style={inp} {...S('jamOperasional')} placeholder="13.00 – 17.00 WIB" /></Row>
      </Grid2>
      <Grid2>
        <Row label="Jam SD"><input style={inp} {...S('jamSD')} placeholder="13.00 – 14.00 WIB (60 menit)" /></Row>
        <Row label="Jam SMP"><input style={inp} {...S('jamSMP')} placeholder="14.30 – 16.00 WIB (90 menit)" /></Row>
      </Grid2>
      <Row label="Alamat Lengkap"><input style={inp} {...S('alamat')} placeholder="Kampung Dua, Jatiluhur, Desa Glagahagung, Kec. Purwoharjo, Banyuwangi" /></Row>
      <Row label="Link Google Maps"><input style={inp} {...S('mapsUrl')} placeholder="https://maps.google.com/..." /></Row>
      <Row label="Kapasitas Kelas"><input style={inp} {...S('kapasitasKelas')} placeholder="Maks. 15 siswa per kelas" /></Row>
      <Row label="Catatan Tambahan"><textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} {...S('catatanOperasional')} placeholder="Info tambahan yang ingin ditampilkan..." /></Row>
    </div>

    <button style={btnG} onClick={save}>💾 Simpan Semua Data Tentang Kami</button>
    <OK show={ok} msg="Data Tentang Kami tersimpan!" />
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: PROGRAM — SD & SMP detail
// ═══════════════════════════════════════════════════════════════
const TabProgram = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); setOk(true); setTimeout(() => setOk(false), 2500); };
  const S = (key) => ({ value: settings[key] || '', onChange: e => setSettings({ ...settings, [key]: e.target.value }) });
  return <>
    {/* SD */}
    <div style={cardS}>
      <SH icon="🏫" title="Program Sekolah Dasar (SD)" sub="Konten tampil di section Program website" />
      <Grid2>
        <Row label="Judul Program SD"><input style={inp} {...S('sdJudul')} placeholder="Program SD Kelas 3-6" /></Row>
        <Row label="Durasi Sesi"><input style={inp} {...S('sdDurasi')} placeholder="60 menit per sesi" /></Row>
      </Grid2>
      <Row label="Deskripsi Program SD"><textarea style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.7 }} {...S('sdDeskripsi')} placeholder="Program SD Bimbel Gemilang dirancang untuk meletakkan fondasi akademik yang kuat..." /></Row>
      <Row label="Mata Pelajaran SD" hint="pisahkan dengan koma"><input style={inp} {...S('sdMapel')} placeholder="Matematika, IPA, IPS, Bahasa Indonesia, Bahasa Inggris, TIK/PAI" /></Row>
      <Row label="Fokus Utama 1"><input style={inp} {...S('sdFokus1')} placeholder="Literasi dan Numerasi" /></Row>
      <Row label="Fokus Utama 2"><input style={inp} {...S('sdFokus2')} placeholder="Sinkronisasi Kurikulum Merdeka" /></Row>
      <Row label="Fokus Utama 3"><input style={inp} {...S('sdFokus3')} placeholder="Persiapan Ujian (UH, PTS, PAT, AKM)" /></Row>
    </div>

    {/* SMP */}
    <div style={cardS}>
      <SH icon="🎓" title="Program SMP / MTs" sub="Konten tampil di section Program website" />
      <Grid2>
        <Row label="Judul Program SMP"><input style={inp} {...S('smpJudul')} placeholder="Program SMP Kelas 7-9" /></Row>
        <Row label="Durasi Sesi"><input style={inp} {...S('smpDurasi')} placeholder="90 menit per sesi" /></Row>
      </Grid2>
      <Row label="Deskripsi Program SMP"><textarea style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.7 }} {...S('smpDeskripsi')} placeholder="Program SMP dirancang untuk mendorong siswa melewati batas pengetahuan dasar..." /></Row>
      <Row label="Mata Pelajaran SMP" hint="pisahkan dengan koma"><input style={inp} {...S('smpMapel')} placeholder="IPA, IPS, Matematika, Bahasa Indonesia, Bahasa Inggris, TIK/PAI" /></Row>
      <Row label="Fokus Utama 1"><input style={inp} {...S('smpFokus1')} placeholder="Sinkronisasi Modul & Kurikulum" /></Row>
      <Row label="Fokus Utama 2"><input style={inp} {...S('smpFokus2')} placeholder="Persiapan Ujian Kelas 7 & 8 (UH, PTS, PAT)" /></Row>
      <Row label="Fokus Utama 3"><input style={inp} {...S('smpFokus3')} placeholder="Persiapan Kelas 9 & Masuk SMA (TKA/SPSB)" /></Row>
    </div>

    {/* FASILITAS */}
    <div style={cardS}>
      <SH icon="🏛️" title="Fasilitas" sub="Daftar fasilitas yang tampil di website" />
      {[['fas1','Fasilitas 1','Ruang Kelas ber-AC dengan proyektor'],['fas2','Fasilitas 2','Taman Outdoor untuk belajar santai'],['fas3','Fasilitas 3','Area Mengerjakan Tugas ber-WiFi'],['fas4','Fasilitas 4','CCTV 24 jam untuk keamanan'],['fas5','Fasilitas 5','Toilet bersih dan terawat'],['fas6','Fasilitas 6','Resepsionis / Admin yang responsif']].map(([key, label, ph]) => (
        <Row key={key} label={label}><input style={inp} {...S(key)} placeholder={ph} /></Row>
      ))}
    </div>

    <button style={btnG} onClick={save}>💾 Simpan Data Program</button>
    <OK show={ok} msg="Data Program tersimpan!" />
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: FORMULIR — edit opsi pendaftaran
// ═══════════════════════════════════════════════════════════════
const TabFormulir = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); setOk(true); setTimeout(() => setOk(false), 2500); };
  const S = (key) => ({ value: settings[key] || '', onChange: e => setSettings({ ...settings, [key]: e.target.value }) });
  return <>
    <div style={cardS}>
      <SH icon="📋" title="Pengaturan Formulir Pendaftaran" sub="Semua opsi di formulir pendaftaran publik bisa diubah di sini" />

      <Row label="Pesan Pembuka Formulir"><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} {...S('formPesan')} placeholder="Daftarkan putra/putri Anda sekarang dan mulai perjalanan belajar yang menyenangkan!" /></Row>

      <Row label="Pilihan Kelas" hint="pisahkan dengan koma"><input style={inp} {...S('formKelas')} placeholder="SD 3,SD 4,SD 5,SD 6,SMP 7,SMP 8,SMP 9" /></Row>
      <Row label="Pilihan Pekerjaan Orang Tua" hint="pisahkan dengan koma"><input style={inp} {...S('formOrtu')} placeholder="Petani,Buruh,Pedagang,PNS,Wiraswasta,Guru,Lainnya" /></Row>
      <Row label="Pilihan Mata Pelajaran" hint="pisahkan dengan koma"><input style={inp} {...S('formMapel')} placeholder="Matematika,IPA,IPS,Bahasa Indonesia,Bahasa Inggris,Semua Mapel" /></Row>

      <Row label="Label Tombol Kirim"><input style={inp} {...S('formTombolLabel')} placeholder="💬 Kirim via WhatsApp" /></Row>
      <Row label="Pesan WA Header" hint="baris pertama pesan WA yang dikirim"><input style={inp} {...S('formWaHeader')} placeholder="*PENDAFTARAN BIMBEL GEMILANG* 🚀" /></Row>
      <Row label="Pesan WA Footer" hint="baris terakhir pesan WA"><input style={inp} {...S('formWaFooter')} placeholder="Mohon dikonfirmasi, terima kasih!" /></Row>
    </div>

    <div style={cardS}>
      <SH icon="⚙️" title="Pengaturan Cepat — Trial Class" sub="Aktifkan promosi kelas percobaan" />
      <Row label="Teks Banner Trial Class"><input style={inp} {...S('trialBanner')} placeholder="🎉 BELAJAR BARENG 7 HARI — Coba Dulu, Baru Daftar!" /></Row>
      <Row label="Deskripsi Trial"><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} {...S('trialDeskripsi')} placeholder="Ikuti 7 hari belajar gratis, kenali metode kami, baru putuskan." /></Row>
      <Row label="Aktif?" hint="isi 'ya' untuk tampilkan banner trial"><input style={inp} {...S('trialAktif')} placeholder="ya / tidak" /></Row>
    </div>

    <button style={btnG} onClick={save}>💾 Simpan Pengaturan Formulir</button>
    <OK show={ok} msg="Pengaturan formulir tersimpan!" />
  </>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: STATISTIK
// ═══════════════════════════════════════════════════════════════
const TabStatistik = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); setOk(true); setTimeout(() => setOk(false), 2500); };
  const fields = [['stat1Num','Angka 1','100+'],['stat1Label','Label 1','Siswa Aktif'],['stat2Num','Angka 2','3+'],['stat2Label','Label 2','Tahun Berpengalaman'],['stat3Num','Angka 3','SD–SMP'],['stat3Label','Label 3','Jenjang'],['stat4Num','Angka 4','95%'],['stat4Label','Label 4','Nilai Naik']];
  return <div style={cardS}>
    <SH icon="📊" title="Statistik Hero" sub="Angka-angka di bagian atas website" />
    <Grid2>{fields.map(([key, label, ph]) => <Row key={key} label={label}><input style={inp} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} placeholder={ph} /></Row>)}</Grid2>
    <button style={btnG} onClick={save}>💾 Simpan</button><OK show={ok} msg="Statistik tersimpan!" />
  </div>;
};

// ═══════════════════════════════════════════════════════════════
// TAB: SETTINGS — hero, sosmed, branding
// ═══════════════════════════════════════════════════════════════
const TabSettings = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); setOk(true); setTimeout(() => setOk(false), 2500); };
  const S = (key) => ({ value: settings[key] || '', onChange: e => setSettings({ ...settings, [key]: e.target.value }) });
  return <>
    <div style={cardS}>
      <SH icon="🚀" title="Hero — Halaman Utama" />
      <Grid2><Row label="Nama Bimbel (besar)"><input style={inp} {...S('heroTitle')} placeholder="GEMILANG" /></Row><Row label="Tagline"><input style={inp} {...S('heroSub')} placeholder="Eksplorasi Ilmu di Galaksi..." /></Row></Grid2>
      <Row label="Sub-tagline / Deskripsi Hero"><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} {...S('heroDeskripsi')} placeholder="Bimbel terpercaya di Desa Glagahagung..." /></Row>
      <Row label="Teks Tombol Daftar"><input style={inp} {...S('heroBtnDaftar')} placeholder="🚀 DAFTAR SEKARANG" /></Row>
      <Row label="Teks Tombol Sekunder"><input style={inp} {...S('heroBtnSekunder')} placeholder="▶ LIHAT AKTIVITAS" /></Row>
    </div>
    <div style={cardS}>
      <SH icon="📱" title="Media Sosial & Kontak Digital" />
      <Grid2><Row label="TikTok URL"><input style={inp} {...S('tiktokUrl')} placeholder="https://tiktok.com/@bimbelgemilang" /></Row><Row label="Instagram URL"><input style={inp} {...S('igUrl')} placeholder="https://instagram.com/bimbelgemilang" /></Row></Grid2>
      <Row label="WhatsApp Default" hint="backup jika belum ada kontak"><input style={inp} {...S('waDefault')} placeholder="6281234567890" /></Row>
      <Row label="Email (opsional)"><input style={inp} {...S('email')} placeholder="info@bimbelgemilang.com" /></Row>
    </div>
    <div style={cardS}>
      <SH icon="🎨" title="Teks Section Website" sub="Judul dan subjudul tiap section bisa diubah" />
      {[['secAktivitasJudul','Judul Section Aktivitas','MISI AKTIVITAS'],['secAktivitasSub','Sub Aktivitas','Saksikan langsung kegiatan seru'],
        ['secPengajarJudul','Judul Section Pengajar','ASTRONOT KAMI'],['secPengajarSub','Sub Pengajar','Para pendidik berpengalaman siap membimbing'],
        ['secBeritaJudul','Judul Section Berita','SINYAL BERITA'],['secBeritaSub','Sub Berita','Informasi terbaru dari markas Gemilang'],
        ['secKontakJudul','Judul Section Kontak','HUBUNGI KAMI'],['secKontakSub','Sub Kontak','Tim kami siap membantu']
      ].map(([key, label, ph]) => <Row key={key} label={label}><input style={inp} {...S(key)} placeholder={ph} /></Row>)}
    </div>
    <div style={cardS}>
      <SH icon="⚖️" title="Footer" />
      <Row label="Teks Copyright"><input style={inp} {...S('footerCopyright')} placeholder="© 2025 BIMBEL GEMILANG · ALL RIGHTS RESERVED" /></Row>
      <Row label="Teks Tagline Footer"><input style={inp} {...S('footerTagline')} placeholder="Membangun Generasi Gemilang dari Desa" /></Row>
    </div>
    <button style={btnG} onClick={save}>💾 Simpan Semua Pengaturan</button>
    <OK show={ok} msg="Pengaturan tersimpan!" />
  </>;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ManageBlog() {
  const [tab, setTab] = useState('aktivitas');
  const [blogs, setBlogs] = useState([]); const [teachers, setTeachers] = useState([]); const [contacts, setContacts] = useState([]);
  const [berita, setBerita] = useState([]); const [testimoni, setTestimoni] = useState([]); const [penghargaan, setPenghargaan] = useState([]);
  const [keunggulan, setKeunggulan] = useState([]);
  const [settings, setSettings] = useState({
    heroTitle: 'GEMILANG', heroSub: 'Eksplorasi Ilmu di Galaksi Pengetahuan',
    heroDeskripsi: 'Bimbel terpercaya di Desa Glagahagung, Banyuwangi — mendampingi siswa SD & SMP meraih prestasi terbaik.',
    heroBtnDaftar: '🚀 DAFTAR SEKARANG', heroBtnSekunder: '▶ LIHAT AKTIVITAS',
    mapsUrl: '', tiktokUrl: '', igUrl: '', waDefault: '', email: '', alamat: 'Kampung Dua, Jatiluhur, Desa Glagahagung, Kec. Purwoharjo, Banyuwangi',
    hariOperasional: 'Senin – Sabtu', jamOperasional: '13.00 – 17.00 WIB',
    jamSD: '13.00 – 14.00 WIB (60 menit)', jamSMP: '14.30 – 16.00 WIB (90 menit)',
    kapasitasKelas: 'Maks. 15 siswa per kelas', catatanOperasional: '',
    stat1Num: '100+', stat1Label: 'Siswa Aktif', stat2Num: '3+', stat2Label: 'Tahun Berpengalaman', stat3Num: 'SD–SMP', stat3Label: 'Jenjang', stat4Num: '95%', stat4Label: 'Nilai Naik',
    founderName: 'Wildan Bima Prakusya, S.I.Kom.', founderTitle: 'Founder & CEO',
    founderMessage: 'It is with great enthusiasm that I welcome you to Gemilang Learning Center. My academic background in Communication and advanced studies in Management have instilled in me a firm belief: that quality education is the key to unlocking a brighter future for our children.',
    founderPhoto: '',
    visi: 'Menjadi mitra belajar terdepan dalam mencetak generasi yang tidak hanya cerdas akademis, tetapi juga berdaya cipta dan siap menghadapi tantangan masa depan.',
    misiLengkap: 'Program komprehensif berfokus pada penguatan pondasi konseptual, pengembangan pola pikir kritis dan keterampilan praktis siswa untuk kesiapan akademis, didukung lingkungan belajar yang inspiratif serta kemitraan aktif dengan orang tua.',
    taglineUtama: '"Kami percaya setiap anak punya cara sendiri untuk menjadi GEMILANG!"',
    coreValue1Title: 'Pondasi Kuat', coreValue1Desc: 'Membangun pemahaman konseptual yang mendalam terhadap materi akademis inti.',
    coreValue2Title: 'Pencerahan Kreatif', coreValue2Desc: 'Menyalakan api kecerdasan dan kreativitas melalui metode belajar inovatif.',
    coreValue3Title: 'Aplikasi Nyata', coreValue3Desc: 'Melengkapi siswa dengan keterampilan praktis untuk menguasai ujian dan tantangan akademis.',
    coreValue4Title: 'Komitmen Bersama', coreValue4Desc: 'Menjalin kemitraan aktif dengan orang tua melalui komunikasi terbuka dan laporan perkembangan.',
    sdJudul: 'SD Kelas 3–6', sdDurasi: '60 menit per sesi',
    sdDeskripsi: 'Dirancang untuk meletakkan fondasi akademik yang kuat, terutama pada kemampuan dasar Literasi dan Numerasi. Suasana belajar menyenangkan namun terstruktur.',
    sdMapel: 'Matematika, IPA, IPS, Bahasa Indonesia, Bahasa Inggris, TIK/PAI',
    sdFokus1: 'Literasi & Numerasi', sdFokus2: 'Sinkronisasi Kurikulum Merdeka', sdFokus3: 'Persiapan UH, PTS, PAT, AKM, & Ujian Sekolah',
    smpJudul: 'SMP Kelas 7–9', smpDurasi: '90 menit per sesi',
    smpDeskripsi: 'Mendorong siswa melewati batas pengetahuan dasar menuju penguasaan konsep mendalam dan kemampuan berpikir tingkat tinggi (HOTS).',
    smpMapel: 'IPA, IPS, Matematika, Bahasa Indonesia, Bahasa Inggris, TIK/PAI',
    smpFokus1: 'Sinkronisasi Modul & Kurikulum', smpFokus2: 'Persiapan UH, PTS, PAT kelas 7 & 8', smpFokus3: 'Persiapan Ujian Sekolah & Masuk SMA (TKA/SPSB)',
    fas1: 'Ruang Kelas ber-AC dengan Proyektor', fas2: 'Taman Outdoor untuk belajar santai',
    fas3: 'Area Mengerjakan Tugas ber-WiFi', fas4: 'CCTV 24 jam untuk keamanan',
    fas5: 'Toilet bersih dan terawat', fas6: 'Admin/Resepsionis yang responsif',
    formKelas: 'SD 3,SD 4,SD 5,SD 6,SMP 7,SMP 8,SMP 9',
    formOrtu: 'Petani,Buruh,Pedagang,PNS,Wiraswasta,Guru,Lainnya',
    formMapel: 'Matematika,IPA,IPS,Bahasa Indonesia,Bahasa Inggris,Semua Mapel',
    formPesan: 'Daftarkan sekarang dan mulai perjalanan belajar yang menyenangkan!',
    formTombolLabel: '💬 Kirim via WhatsApp',
    formWaHeader: '*PENDAFTARAN BIMBEL GEMILANG* 🚀',
    formWaFooter: 'Mohon dikonfirmasi, terima kasih!',
    trialBanner: '🎉 BELAJAR BARENG 7 HARI — Coba Dulu, Baru Daftar!',
    trialDeskripsi: 'Ikuti 7 hari belajar gratis, kenali metode kami, baru putuskan.',
    trialAktif: 'ya',
    secAktivitasJudul: 'MISI AKTIVITAS', secAktivitasSub: 'Saksikan langsung kegiatan seru Bimbel Gemilang',
    secPengajarJudul: 'ASTRONOT KAMI', secPengajarSub: 'Para pendidik berpengalaman siap membimbing',
    secBeritaJudul: 'SINYAL BERITA', secBeritaSub: 'Informasi terbaru dari markas Bimbel Gemilang',
    secKontakJudul: 'HUBUNGI KAMI', secKontakSub: 'Tim kami siap membantu',
    footerCopyright: `© ${new Date().getFullYear()} BIMBEL GEMILANG · ALL RIGHTS RESERVED`,
    footerTagline: 'Membangun Generasi Gemilang dari Desa',
  });

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
    { key: 'tentang', icon: '🌌', label: 'Tentang', count: null },
    { key: 'program', icon: '📖', label: 'Program', count: null },
    { key: 'formulir', icon: '📋', label: 'Formulir', count: null },
    { key: 'statistik', icon: '📊', label: 'Statistik', count: null },
    { key: 'settings', icon: '⚙️', label: 'Pengaturan', count: null },
  ];

  const currentTab = tabs.find(t => t.key === tab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Nunito',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        input,select,textarea{color:${C.text}!important}
        input:focus,select:focus,textarea:focus{border-color:rgba(243,156,18,0.5)!important;box-shadow:0 0 0 3px rgba(243,156,18,0.07)!important}
        input[type="file"]::file-selector-button{background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.3);color:#f39c12;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-family:'Orbitron',sans-serif;margin-right:10px}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(243,156,18,0.25);border-radius:2px}
        option{background:#0a0c18}
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: 'rgba(255,255,255,0.02)', borderRight: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 50, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
          <img src="/logo-gemilang.png.png" alt="Logo" style={{ height: 34, marginBottom: 6, filter: 'drop-shadow(0 0 10px rgba(243,156,18,0.5)) brightness(1.1)' }} onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 7.5, color: 'rgba(243,156,18,0.55)', letterSpacing: 2.5 }}>MISSION CONTROL</div>
          <div style={{ fontSize: 10, color: C.mutedMore, marginTop: 2 }}>Web Bimbel Gemilang</div>
        </div>
        <nav style={{ padding: '8px 6px', flex: 1 }}>
          {/* Divider labels */}
          {[
            { divider: 'KONTEN', before: 'aktivitas' },
            { divider: 'INFORMASI', before: 'tentang' },
            { divider: 'KONFIGURASI', before: 'statistik' },
          ].map(d => null)}
          {tabs.map((t, i) => {
            const dividers = { aktivitas: 'KONTEN', tentang: 'INFORMASI', statistik: 'KONFIGURASI' };
            return <React.Fragment key={t.key}>
              {dividers[t.key] && <div style={{ fontSize: 8.5, color: C.mutedMore, fontFamily: "'Orbitron',sans-serif", letterSpacing: 1.5, padding: '12px 12px 4px' }}>{dividers[t.key]}</div>}
              <button onClick={() => setTab(t.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', marginBottom: 1, textAlign: 'left', background: tab === t.key ? 'rgba(243,156,18,0.11)' : 'transparent', borderLeft: tab === t.key ? `3px solid ${C.gold}` : '3px solid transparent', color: tab === t.key ? C.gold : C.muted, fontFamily: "'Orbitron',sans-serif", fontSize: 9.5, letterSpacing: 0.3, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 13 }}>{t.icon}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
                {t.count !== null && <span style={{ background: tab === t.key ? 'rgba(243,156,18,0.18)' : 'rgba(255,255,255,0.05)', color: tab === t.key ? C.gold : C.mutedMore, fontSize: 10, padding: '1px 6px', borderRadius: 7, fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>{t.count}</span>}
              </button>
            </React.Fragment>;
          })}
        </nav>
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.mutedMore, marginBottom: 2 }}>📦 Foto → Firestore (Base64)</div>
          <div style={{ fontSize: 9, color: C.green }}>✓ Tanpa Firebase Storage</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 220, flex: 1, padding: '22px 26px 60px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 'clamp(13px,2vw,17px)', color: C.gold, margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 8 }}>{currentTab?.icon} {currentTab?.label}</h1>
            <p style={{ color: C.mutedMore, fontSize: 10.5, margin: 0 }}>Mission Control · Bimbel Gemilang · Glagahagung, Banyuwangi</p>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {[['🎬', blogs.length, 'Konten'], ['👨‍🚀', teachers.length, 'Pengajar'], ['📰', berita.length, 'Berita'], ['⭐', testimoni.length, 'Testimoni'], ['💬', contacts.length, 'Kontak']].map(([icon, count, label]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 9, padding: '6px 11px', textAlign: 'center', minWidth: 50 }}>
                <div style={{ fontSize: 13 }}>{icon}</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: C.gold, fontWeight: 700, lineHeight: 1.1 }}>{count}</div>
                <div style={{ fontSize: 8.5, color: C.mutedMore, marginTop: 1, fontFamily: "'Orbitron',sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <UsageMonitor teachers={teachers} contacts={contacts} testimoni={testimoni} berita={berita} penghargaan={penghargaan} />

        {tab === 'aktivitas' && <TabAktivitas blogs={blogs} />}
        {tab === 'pengajar' && <TabPengajar teachers={teachers} />}
        {tab === 'berita' && <TabBerita berita={berita} />}
        {tab === 'testimoni' && <TabTestimoni testimoni={testimoni} />}
        {tab === 'penghargaan' && <TabPenghargaan penghargaan={penghargaan} />}
        {tab === 'keunggulan' && <TabKeunggulan keunggulan={keunggulan} />}
        {tab === 'kontak' && <TabKontak contacts={contacts} />}
        {tab === 'tentang' && <TabTentang settings={settings} setSettings={setSettings} />}
        {tab === 'program' && <TabProgram settings={settings} setSettings={setSettings} />}
        {tab === 'formulir' && <TabFormulir settings={settings} setSettings={setSettings} />}
        {tab === 'statistik' && <TabStatistik settings={settings} setSettings={setSettings} />}
        {tab === 'settings' && <TabSettings settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
}