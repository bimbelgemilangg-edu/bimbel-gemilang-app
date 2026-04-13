import React, { useState, useEffect } from 'react';
import { db, storage } from '../../../firebase';
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, deleteDoc, doc, setDoc, getDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const uploadFile = (file, folder, onProgress) => new Promise((resolve, reject) => {
  const r = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  const task = uploadBytesResumable(r, file);
  task.on('state_changed',
    s => onProgress?.(Math.round(s.bytesTransferred / s.totalBytes * 100)),
    reject,
    () => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject)
  );
});

const C = { bg: '#0a0c14', bgCard: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', gold: '#f39c12', muted: 'rgba(255,255,255,0.45)' };
const inp = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' };
const cardS = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 };
const btnG = { padding: '10px 22px', background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', borderRadius: 10, color: '#0a0a1a', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif" };
const btnR = { padding: '6px 14px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8, color: '#e74c3c', fontSize: 12, cursor: 'pointer' };
const Row = ({ label, children }) => (<div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6, letterSpacing: 0.5 }}>{label}</label>{children}</div>);
const OK = ({ show }) => show ? <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, color: '#25D366', fontSize: 13 }}>✓ Tersimpan!</div> : null;
const Bar = ({ val }) => val > 0 && val < 100 ? <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: `${val}%`, background: 'linear-gradient(90deg,#f39c12,#e67e22)', borderRadius: 3, transition: 'width 0.3s' }} /></div> : null;
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
    try { const url = await uploadFile(file, 'teachers', setProg); await addDoc(collection(db, 'web_teachers_gallery'), { ...f, photoUrl: url, createdAt: serverTimestamp() }); setF({ nama: '', spesialisasi: '', wa: '', bio: '' }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500); } catch (e) { console.error(e); }
    setLoading(false);
  };
  return <>
    <div style={cardS}>
      <SH icon="👨‍🚀" title="Tambah Pengajar / Astronot" />
      <Grid2><Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama lengkap" /></Row><Row label="Spesialisasi"><input style={inp} value={f.spesialisasi} onChange={e => setF({ ...f, spesialisasi: e.target.value })} placeholder="Guru Matematika" /></Row></Grid2>
      <Row label="WhatsApp (628xxx)"><input style={inp} value={f.wa} onChange={e => setF({ ...f, wa: e.target.value })} placeholder="6281234567890" /></Row>
      <Row label="Bio Singkat"><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} placeholder="Pengalaman mengajar..." /></Row>
      <Row label="Foto *"><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...inp, padding: '9px 14px' }} /></Row>
      <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Upload ${prog}%...` : '+ Tambah Pengajar'}</button><OK show={ok} />
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
    let imageUrl = ''; if (file) imageUrl = await uploadFile(file, 'berita', setProg);
    await addDoc(collection(db, 'web_berita'), { ...f, imageUrl, createdAt: serverTimestamp() });
    setF({ judul: '', isi: '', kategori: 'BERITA' }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500); setLoading(false);
  };
  return <>
    <div style={cardS}>
      <SH icon="📰" title="Tulis Berita / Pengumuman / Press" />
      <Row label="Judul *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Judul berita" /></Row>
      <Row label="Kategori"><select style={inp} value={f.kategori} onChange={e => setF({ ...f, kategori: e.target.value })}>{['BERITA', 'PENGUMUMAN', 'PRESTASI', 'KEGIATAN', 'PRESS', 'INFO'].map(k => <option key={k}>{k}</option>)}</select></Row>
      <Row label="Isi Berita *"><textarea style={{ ...inp, minHeight: 130, resize: 'vertical' }} value={f.isi} onChange={e => setF({ ...f, isi: e.target.value })} placeholder="Isi berita lengkap..." /></Row>
      <Row label="Foto (opsional)"><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...inp, padding: '9px 14px' }} /></Row>
      <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Upload ${prog}%...` : '🚀 Publikasikan'}</button><OK show={ok} />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Berita (${berita.length})`} />
      {berita.map(b => <LI key={b.id}>
        {b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: 50, height: 38, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.judul}</div><div style={{ fontSize: 11, color: C.muted }}>{b.kategori} · {b.createdAt?.toDate?.()?.toLocaleDateString('id-ID')}</div></div>
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
    let photoUrl = ''; if (file) photoUrl = await uploadFile(file, 'testimoni', setProg);
    await addDoc(collection(db, 'web_testimoni'), { ...f, photoUrl, createdAt: serverTimestamp() });
    setF({ nama: '', kelas: '', isi: '', bintang: 5 }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500); setLoading(false);
  };
  return <>
    <div style={cardS}>
      <SH icon="⭐" title="Tambah Testimoni" />
      <Grid2><Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama siswa / orang tua" /></Row><Row label="Kelas / Asal"><input style={inp} value={f.kelas} onChange={e => setF({ ...f, kelas: e.target.value })} placeholder="Kelas 9 / Orang Tua" /></Row></Grid2>
      <Row label="Isi Testimoni *"><textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={f.isi} onChange={e => setF({ ...f, isi: e.target.value })} placeholder="Kesan dan pesan..." /></Row>
      <Row label="Rating"><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{[1,2,3,4,5].map(n => <button key={n} onClick={() => setF({ ...f, bintang: n })} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', filter: n <= f.bintang ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</button>)}<span style={{ color: C.muted, fontSize: 13 }}>{f.bintang}/5</span></div></Row>
      <Row label="Foto (opsional)"><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...inp, padding: '9px 14px' }} /></Row>
      <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Upload ${prog}%...` : '+ Tambah Testimoni'}</button><OK show={ok} />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Testimoni (${testimoni.length})`} />
      {testimoni.map(t => <LI key={t.id}>
        {t.photoUrl ? <img src={t.photoUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(243,156,18,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>}
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{t.nama} <span style={{ color: C.muted, fontWeight: 400 }}>· {t.kelas}</span></div><div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.isi}</div></div>
        <span style={{ color: '#f39c12', fontSize: 13, flexShrink: 0 }}>{'⭐'.repeat(t.bintang)}</span>
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
    let imageUrl = ''; if (file) imageUrl = await uploadFile(file, 'penghargaan', setProg);
    await addDoc(collection(db, 'web_penghargaan'), { ...f, imageUrl, createdAt: serverTimestamp() });
    setF({ judul: '', tahun: '', deskripsi: '' }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500); setLoading(false);
  };
  return <>
    <div style={cardS}>
      <SH icon="🏆" title="Tambah Penghargaan / Award" />
      <Grid2><Row label="Nama Penghargaan *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Bimbel Terbaik..." /></Row><Row label="Tahun"><input style={inp} value={f.tahun} onChange={e => setF({ ...f, tahun: e.target.value })} placeholder="2024" /></Row></Grid2>
      <Row label="Deskripsi"><input style={inp} value={f.deskripsi} onChange={e => setF({ ...f, deskripsi: e.target.value })} placeholder="Keterangan singkat" /></Row>
      <Row label="Foto Piala / Sertifikat"><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...inp, padding: '9px 14px' }} /></Row>
      <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Upload ${prog}%...` : '+ Tambah Penghargaan'}</button><OK show={ok} />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Penghargaan (${penghargaan.length})`} />
      {penghargaan.map(p => <LI key={p.id}>
        {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(243,156,18,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏆</div>}
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{p.judul}</div><div style={{ fontSize: 12, color: C.muted }}>{p.tahun} · {p.deskripsi}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_penghargaan', p.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

/* KEUNGGULAN */
const ICONS_LIST = ['🎯','📚','👨‍🏫','💰','🏫','⭐','🚀','🏆','💡','🔬','🎓','🌟','🖥️','📐','🏅','🤝'];
const TabKeunggulan = ({ keunggulan }) => {
  const [f, setF] = useState({ icon: '🎯', judul: '', deskripsi: '', link: '' }); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!f.judul || !f.deskripsi) return;
    await addDoc(collection(db, 'web_keunggulan'), { ...f, createdAt: serverTimestamp() });
    setF({ icon: '🎯', judul: '', deskripsi: '', link: '' }); setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return <>
    <div style={cardS}>
      <SH icon="✨" title="Tambah Kartu Keunggulan / Fasilitas" />
      <Row label="Pilih Icon"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{ICONS_LIST.map(ic => <button key={ic} onClick={() => setF({ ...f, icon: ic })} style={{ width: 40, height: 40, borderRadius: 8, border: f.icon === ic ? '2px solid #f39c12' : '1px solid rgba(255,255,255,0.15)', background: f.icon === ic ? 'rgba(243,156,18,0.15)' : 'transparent', cursor: 'pointer', fontSize: 20 }}>{ic}</button>)}</div></Row>
      <Grid2><Row label="Judul *"><input style={inp} value={f.judul} onChange={e => setF({ ...f, judul: e.target.value })} placeholder="Materi Lengkap" /></Row><Row label="Link (opsional — jika bisa diklik)"><input style={inp} value={f.link} onChange={e => setF({ ...f, link: e.target.value })} placeholder="https://... atau kosongkan" /></Row></Grid2>
      <Row label="Deskripsi *"><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={f.deskripsi} onChange={e => setF({ ...f, deskripsi: e.target.value })} placeholder="Penjelasan singkat keunggulan" /></Row>
      <button style={btnG} onClick={add}>+ Tambah Kartu</button><OK show={ok} />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Kartu Keunggulan (${keunggulan.length})`} />
      {keunggulan.map(k => <LI key={k.id}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{k.icon}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{k.judul}</div><div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.deskripsi}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_keunggulan', k.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

/* KONTAK */
const TabKontak = ({ contacts }) => {
  const [f, setF] = useState({ nama: '', jabatan: '', wa: '' });
  const [file, setFile] = useState(null); const [prog, setProg] = useState(0); const [loading, setLoading] = useState(false); const [ok, setOk] = useState(false);
  const add = async () => {
    if (!f.nama || !f.wa || !file) { alert('Nama, WA, dan foto wajib diisi'); return; }
    setLoading(true); const url = await uploadFile(file, 'contacts', setProg);
    await addDoc(collection(db, 'web_contacts'), { ...f, photoUrl: url });
    setF({ nama: '', jabatan: '', wa: '' }); setFile(null); setProg(0); setOk(true); setTimeout(() => setOk(false), 2500); setLoading(false);
  };
  return <>
    <div style={cardS}>
      <SH icon="💬" title="Tambah Kontak Admin" />
      <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
        💡 Minimal 1 kontak harus ada agar tombol WhatsApp di website aktif dan bisa ditekan.
      </div>
      <Grid2><Row label="Nama *"><input style={inp} value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} placeholder="Nama admin" /></Row><Row label="Jabatan"><input style={inp} value={f.jabatan} onChange={e => setF({ ...f, jabatan: e.target.value })} placeholder="Admin / Pengajar" /></Row></Grid2>
      <Row label="No. WhatsApp * (628xxx)"><input style={inp} value={f.wa} onChange={e => setF({ ...f, wa: e.target.value })} placeholder="6281234567890" /></Row>
      <Row label="Foto *"><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ ...inp, padding: '9px 14px' }} /></Row>
      <Bar val={prog} /><button style={btnG} onClick={add} disabled={loading}>{loading ? `Upload ${prog}%...` : '+ Tambah Kontak'}</button><OK show={ok} />
    </div>
    <div style={cardS}>
      <SH icon="📋" title={`Kontak (${contacts.length})`} />
      {!contacts.length && <p style={{ color: '#e74c3c', fontSize: 13 }}>⚠️ Belum ada kontak! Tambahkan sekarang agar WA aktif.</p>}
      {contacts.map(c => <LI key={c.id}>
        <img src={c.photoUrl} alt={c.nama} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,211,102,0.4)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{c.nama}</div><div style={{ fontSize: 12, color: C.muted }}>{c.jabatan} · {c.wa}</div></div>
        <button style={btnR} onClick={() => window.confirm('Hapus?') && deleteDoc(doc(db, 'web_contacts', c.id))}>Hapus</button>
      </LI>)}
    </div>
  </>;
};

/* STATISTIK */
const TabStatistik = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); setOk(true); setTimeout(() => setOk(false), 2500); };
  const fields = [['stat1Num','Angka 1','100+'],['stat1Label','Label 1','Siswa Aktif'],['stat2Num','Angka 2','3+'],['stat2Label','Label 2','Tahun Berpengalaman'],['stat3Num','Angka 3','SD–SMA'],['stat3Label','Label 3','Jenjang Tersedia'],['stat4Num','Angka 4','95%'],['stat4Label','Label 4','Nilai Naik']];
  return <div style={cardS}>
    <SH icon="📊" title="Edit Statistik Halaman Utama" />
    <div style={{ background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Angka-angka ini tampil di bagian bawah hero. Isi dengan data nyata bimbel kamu.</div>
    <Grid2>{fields.map(([key, label, ph]) => <Row key={key} label={label}><input style={inp} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} placeholder={ph} /></Row>)}</Grid2>
    <button style={btnG} onClick={save}>💾 Simpan Statistik</button><OK show={ok} />
  </div>;
};

/* SETTINGS */
const TabSettings = ({ settings, setSettings }) => {
  const [ok, setOk] = useState(false);
  const save = async () => { await setDoc(doc(db, 'web_settings', 'general'), settings, { merge: true }); setOk(true); setTimeout(() => setOk(false), 2500); };
  return <>
    <div style={cardS}>
      <SH icon="🚀" title="Teks Halaman Utama (Hero)" />
      <Grid2><Row label="Nama Bimbel (judul besar)"><input style={inp} value={settings.heroTitle || ''} onChange={e => setSettings({ ...settings, heroTitle: e.target.value })} placeholder="GEMILANG" /></Row><Row label="Tagline / Sub Judul"><input style={inp} value={settings.heroSub || ''} onChange={e => setSettings({ ...settings, heroSub: e.target.value })} placeholder="Eksplorasi Ilmu di Galaksi..." /></Row></Grid2>
      <Row label="Visi & Misi"><textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={settings.visiMisi || ''} onChange={e => setSettings({ ...settings, visiMisi: e.target.value })} placeholder="Menjadi pusat pembelajaran terbaik..." /></Row>
      <Row label="Alamat Lengkap"><input style={inp} value={settings.alamat || ''} onChange={e => setSettings({ ...settings, alamat: e.target.value })} placeholder="Jl. Contoh No.1, Desa, Kecamatan" /></Row>
    </div>
    <div style={cardS}>
      <SH icon="📱" title="Media Sosial & Maps" />
      <Grid2><Row label="Link TikTok"><input style={inp} value={settings.tiktokUrl || ''} onChange={e => setSettings({ ...settings, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/@..." /></Row><Row label="Link Instagram"><input style={inp} value={settings.igUrl || ''} onChange={e => setSettings({ ...settings, igUrl: e.target.value })} placeholder="https://instagram.com/..." /></Row></Grid2>
      <Row label="Link Google Maps"><input style={inp} value={settings.mapsUrl || ''} onChange={e => setSettings({ ...settings, mapsUrl: e.target.value })} placeholder="https://maps.google.com/..." /></Row>
    </div>
    <button style={btnG} onClick={save}>💾 Simpan Semua Pengaturan</button><OK show={ok} />
  </>;
};

/* MAIN */
export default function ManageBlog() {
  const [tab, setTab] = useState('aktivitas');
  const [blogs, setBlogs] = useState([]); const [teachers, setTeachers] = useState([]); const [contacts, setContacts] = useState([]);
  const [berita, setBerita] = useState([]); const [testimoni, setTestimoni] = useState([]); const [penghargaan, setPenghargaan] = useState([]);
  const [keunggulan, setKeunggulan] = useState([]);
  const [settings, setSettings] = useState({ heroTitle: 'GEMILANG', heroSub: 'Eksplorasi Ilmu di Galaksi Pengetahuan', visiMisi: '', mapsUrl: '', tiktokUrl: '', igUrl: '', alamat: '', stat1Num: '100+', stat1Label: 'Siswa Aktif', stat2Num: '3+', stat2Label: 'Tahun Berpengalaman', stat3Num: 'SD–SMA', stat3Label: 'Jenjang Tersedia', stat4Num: '95%', stat4Label: 'Nilai Naik' });

  useEffect(() => {
    const q = (col, ord) => ord ? query(collection(db, col), orderBy(ord, 'desc')) : collection(db, col);
    const u1 = onSnapshot(q('web_blog','createdAt'), s => setBlogs(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2 = onSnapshot(q('web_teachers_gallery','createdAt'), s => setTeachers(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u3 = onSnapshot(q('web_contacts',null), s => setContacts(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u4 = onSnapshot(q('web_berita','createdAt'), s => setBerita(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u5 = onSnapshot(q('web_testimoni','createdAt'), s => setTestimoni(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u6 = onSnapshot(q('web_penghargaan','createdAt'), s => setPenghargaan(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u7 = onSnapshot(q('web_keunggulan','createdAt'), s => setKeunggulan(s.docs.map(d=>({id:d.id,...d.data()}))));
    getDoc(doc(db,'web_settings','general')).then(s => { if(s.exists()) setSettings(p=>({...p,...s.data()})); });
    return () => { u1();u2();u3();u4();u5();u6();u7(); };
  }, []);

  const tabs = [
    {key:'aktivitas',icon:'🎬',label:'Aktivitas',count:blogs.length},
    {key:'pengajar',icon:'👨‍🚀',label:'Pengajar',count:teachers.length},
    {key:'berita',icon:'📰',label:'Berita',count:berita.length},
    {key:'testimoni',icon:'⭐',label:'Testimoni',count:testimoni.length},
    {key:'penghargaan',icon:'🏆',label:'Penghargaan',count:penghargaan.length},
    {key:'keunggulan',icon:'✨',label:'Keunggulan',count:keunggulan.length},
    {key:'kontak',icon:'💬',label:'Kontak',count:contacts.length},
    {key:'statistik',icon:'📊',label:'Statistik',count:null},
    {key:'settings',icon:'⚙️',label:'Pengaturan',count:null},
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg, color:'white', fontFamily:"'Nunito',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box}input,select,textarea{color:white!important}input:focus,select:focus,textarea:focus{border-color:rgba(243,156,18,0.6)!important;outline:none}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#f39c12;border-radius:2px}option{background:#1a1a2e}`}</style>
      {/* SIDEBAR */}
      <div style={{ width:240, background:'rgba(255,255,255,0.03)', borderRight:`1px solid ${C.border}`, position:'fixed', top:0, left:0, height:'100vh', display:'flex', flexDirection:'column', zIndex:50, overflowY:'auto', flexShrink:0 }}>
        <div style={{ padding:'20px 18px 16px', borderBottom:`1px solid ${C.border}` }}>
          <img src="/logo-gemilang.png.png" alt="Logo" style={{ height:38, marginBottom:6, filter:'drop-shadow(0 0 8px rgba(243,156,18,0.5))' }} onError={e=>{e.target.style.display='none'}} />
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, color:'rgba(243,156,18,0.7)', letterSpacing:2 }}>MISSION CONTROL</div>
        </div>
        <nav style={{ padding:'12px 10px', flex:1 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:2, textAlign:'left', transition:'all 0.2s', background:tab===t.key?'rgba(243,156,18,0.15)':'transparent', borderLeft:tab===t.key?'3px solid #f39c12':'3px solid transparent', color:tab===t.key?'#f39c12':C.muted, fontFamily:"'Orbitron',sans-serif", fontSize:11 }}>
              <span style={{ fontSize:15 }}>{t.icon}</span>
              <span style={{ flex:1 }}>{t.label}</span>
              {t.count!==null && <span style={{ background:'rgba(243,156,18,0.2)', color:'#f39c12', fontSize:10, padding:'2px 7px', borderRadius:10 }}>{t.count}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}`, fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'sans-serif' }}>Web Gemilang · Admin</div>
      </div>
      {/* MAIN CONTENT */}
      <div style={{ marginLeft:240, flex:1, padding:'24px 28px 60px', overflowY:'auto' }}>
        <div style={{ marginBottom:24, paddingBottom:18, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:'clamp(15px,2.5vw,20px)', color:'#f39c12', margin:0 }}>{tabs.find(t=>t.key===tab)?.icon} {tabs.find(t=>t.key===tab)?.label}</h1>
            <p style={{ color:C.muted, fontSize:12, margin:'4px 0 0', fontFamily:'sans-serif' }}>Mission Control · Bimbel Gemilang</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[['🎬',blogs.length,'Konten'],['👨‍🚀',teachers.length,'Pengajar'],['📰',berita.length,'Berita'],['⭐',testimoni.length,'Testimoni']].map(([icon,count,label])=>(
              <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 14px', textAlign:'center', minWidth:60 }}>
                <div style={{ fontSize:16 }}>{icon}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:15, color:'#f39c12', fontWeight:700 }}>{count}</div>
                <div style={{ fontSize:10, color:C.muted }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
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