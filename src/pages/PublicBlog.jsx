import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";

/* ─── STAR CANVAS ─────────────────────────────────────── */
const Stars = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const stars = Array.from({ length: 220 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.2, t: Math.random() * Math.PI * 2, s: Math.random() * 0.018 + 0.008 }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => { s.t += s.s; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.sin(s.t) * 0.28})`; ctx.fill(); });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onR = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    window.addEventListener('resize', onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

/* ─── SHOOTING STARS ──────────────────────────────────── */
const Shooting = () => {
  const [shots, setShots] = useState([]);
  useEffect(() => {
    const iv = setInterval(() => {
      const id = Date.now();
      setShots(s => [...s.slice(-4), { id, x: Math.random() * 80 + 5, y: Math.random() * 45 }]);
      setTimeout(() => setShots(s => s.filter(x => x.id !== id)), 1200);
    }, 3200);
    return () => clearInterval(iv);
  }, []);
  return <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
    {shots.map(s => <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: 130, height: 2, background: 'linear-gradient(90deg,rgba(255,220,80,0.9),transparent)', borderRadius: 2, animation: 'shoot 1.1s ease-out forwards', transform: 'rotate(-28deg)' }} />)}
  </div>;
};

/* ─── AUTO SLIDER ─────────────────────────────────────── */
const Slider = ({ items, render, height = 420 }) => {
  const [cur, setCur] = useState(0); const [drag, setDrag] = useState(null); const timer = useRef(null);
  const reset = () => { clearInterval(timer.current); if (items.length > 1) timer.current = setInterval(() => setCur(c => (c + 1) % items.length), 4500); };
  useEffect(() => { reset(); return () => clearInterval(timer.current); }, [items.length]);
  const go = i => { setCur(i); reset(); };
  if (!items.length) return <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)', fontFamily: "'Orbitron',sans-serif", fontSize: 13 }}>Belum ada data</div>;
  return <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, height }}
    onTouchStart={e => setDrag(e.touches[0].clientX)}
    onTouchEnd={e => { if (drag === null) return; const d = drag - e.changedTouches[0].clientX; if (Math.abs(d) > 40) go(d > 0 ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length); setDrag(null); }}>
    <div style={{ display: 'flex', transition: 'transform 0.65s cubic-bezier(.77,0,.18,1)', transform: `translateX(-${cur * 100}%)`, height: '100%' }}>
      {items.map((item, i) => <div key={i} style={{ minWidth: '100%', height: '100%' }}>{render(item, i)}</div>)}
    </div>
    {items.length > 1 && <>
      <button onClick={() => go((cur - 1 + items.length) % items.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(243,156,18,0.4)', color: '#f39c12', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', zIndex: 2 }}>‹</button>
      <button onClick={() => go((cur + 1) % items.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(243,156,18,0.4)', color: '#f39c12', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', zIndex: 2 }}>›</button>
    </>}
    <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 2 }}>
      {items.map((_, i) => <button key={i} onClick={() => go(i)} style={{ width: i === cur ? 20 : 8, height: 8, borderRadius: 4, background: i === cur ? '#f39c12' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />)}
    </div>
  </div>;
};

/* ─── NAVBAR ──────────────────────────────────────────── */
const Nav = ({ onDaftar, settings }) => {
  const [sc, setSc] = useState(false); const [open, setOpen] = useState(false);
  useEffect(() => { const fn = () => setSc(window.scrollY > 40); window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn); }, []);
  const go = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); };
  const links = [['beranda', 'Beranda'], ['aktivitas', 'Aktivitas'], ['pengajar', 'Pengajar'], ['program', 'Program'], ['tentang', 'Tentang'], ['berita', 'Berita'], ['kontak', 'Kontak']];
  return <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: sc ? 'rgba(5,7,18,0.96)' : 'transparent', backdropFilter: sc ? 'blur(16px)' : 'none', borderBottom: sc ? '1px solid rgba(243,156,18,0.15)' : 'none', transition: 'all 0.4s', padding: '0 20px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    {/* LOGO — mix-blend-mode untuk hilangkan background putih */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="/logo-gemilang.png.png" alt="Gemilang" style={{ height: 42, filter: 'drop-shadow(0 0 10px rgba(243,156,18,0.5))', mixBlendMode: 'screen' }} onError={e => { e.target.style.display = 'none'; }} />
    </div>
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="nd">
      {links.map(([id, label]) => <button key={id} onClick={() => go(id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.3, transition: 'all 0.2s' }} onMouseEnter={e => { e.target.style.color = '#f39c12'; e.target.style.background = 'rgba(243,156,18,0.08)'; }} onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.75)'; e.target.style.background = 'none'; }}>{label}</button>)}
      <button onClick={onDaftar} style={{ background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', color: '#0a0a1a', padding: '8px 18px', borderRadius: 20, fontWeight: 800, fontSize: 12, cursor: 'pointer', marginLeft: 6, fontFamily: "'Orbitron',sans-serif", boxShadow: '0 0 14px rgba(243,156,18,0.35)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>{settings.heroBtnDaftar || '🚀 DAFTAR'}</button>
    </div>
    <button onClick={() => setOpen(!open)} className="nm" style={{ background: 'none', border: '1px solid rgba(243,156,18,0.4)', color: '#f39c12', width: 38, height: 38, borderRadius: 8, cursor: 'pointer', fontSize: 18 }}>☰</button>
    {open && <div style={{ position: 'fixed', top: 62, left: 0, right: 0, background: 'rgba(5,7,18,0.98)', backdropFilter: 'blur(20px)', padding: 16, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 99, borderBottom: '1px solid rgba(243,156,18,0.15)' }}>
      {links.map(([id, label]) => <button key={id} onClick={() => go(id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', padding: '11px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontFamily: "'Orbitron',sans-serif" }}>{label}</button>)}
      <button onClick={() => { onDaftar(); setOpen(false); }} style={{ background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', color: '#0a0a1a', padding: 13, borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 6, fontFamily: "'Orbitron',sans-serif" }}>{settings.heroBtnDaftar || '🚀 DAFTAR SEKARANG'}</button>
    </div>}
  </nav>;
};

/* ─── SECTION WRAPPER ─────────────────────────────────── */
const Sec = ({ id, children, bg = 'transparent' }) => <section id={id} style={{ position: 'relative', zIndex: 2, padding: '72px 20px', background: bg }}><div style={{ maxWidth: 980, margin: '0 auto' }}>{children}</div></section>;
const Title = ({ icon, title, sub }) => <div style={{ textAlign: 'center', marginBottom: 48 }}>
  <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
  <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 'clamp(18px,4vw,30px)', color: '#f39c12', margin: '0 0 10px', textShadow: '0 0 24px rgba(243,156,18,0.4)' }}>{title}</h2>
  {sub && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, maxWidth: 480, margin: '0 auto' }}>{sub}</p>}
  <div style={{ width: 56, height: 2, background: 'linear-gradient(90deg,transparent,#f39c12,transparent)', margin: '14px auto 0' }} />
</div>;

/* ─── ASTRONOT MASCOT SVG ──────────────────────────────── */
const AstroFloat = ({ size = 120, style = {} }) => (
  <div style={{ animation: 'float 4s ease-in-out infinite', ...style }}>
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="60" cy="75" rx="28" ry="32" fill="white" />
      <ellipse cx="60" cy="75" rx="28" ry="32" fill="url(#astroBody)" opacity="0.3" />
      {/* Helmet */}
      <circle cx="60" cy="45" r="26" fill="white" />
      <circle cx="60" cy="45" r="20" fill="#7C3AED" opacity="0.15" />
      <circle cx="60" cy="45" r="16" fill="#0a0c1a" />
      {/* Face */}
      <circle cx="55" cy="43" r="3" fill="white" opacity="0.9" />
      <circle cx="65" cy="43" r="3" fill="white" opacity="0.9" />
      <path d="M54 50 Q60 54 66 50" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* Visor reflection */}
      <ellipse cx="52" cy="37" rx="4" ry="2.5" fill="white" opacity="0.25" transform="rotate(-20 52 37)" />
      {/* Suit details */}
      <rect x="48" y="65" width="8" height="6" rx="2" fill="#f39c12" opacity="0.8" />
      <rect x="64" y="65" width="8" height="6" rx="2" fill="#f39c12" opacity="0.8" />
      {/* Logo on suit */}
      <circle cx="60" cy="80" r="6" fill="#7C3AED" opacity="0.6" />
      <circle cx="60" cy="80" r="3" fill="#f39c12" opacity="0.8" />
      {/* Arms */}
      <ellipse cx="35" cy="72" rx="8" ry="12" fill="white" transform="rotate(-15 35 72)" />
      <ellipse cx="85" cy="72" rx="8" ry="12" fill="white" transform="rotate(15 85 72)" />
      {/* Legs */}
      <ellipse cx="50" cy="103" rx="7" ry="10" fill="white" />
      <ellipse cx="70" cy="103" rx="7" ry="10" fill="white" />
      {/* Boots */}
      <ellipse cx="50" cy="112" rx="9" ry="5" fill="#7C3AED" opacity="0.7" />
      <ellipse cx="70" cy="112" rx="9" ry="5" fill="#7C3AED" opacity="0.7" />
      {/* Orange accents */}
      <path d="M33 68 Q32 72 33 76" stroke="#f39c12" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M87 68 Q88 72 87 76" stroke="#f39c12" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      {/* Stars around */}
      <circle cx="15" cy="30" r="2" fill="#f39c12" opacity="0.6" />
      <circle cx="105" cy="25" r="1.5" fill="#f39c12" opacity="0.5" />
      <circle cx="10" cy="90" r="1.5" fill="white" opacity="0.4" />
      <defs>
        <linearGradient id="astroBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#f39c12" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

/* ─── DAFTAR MODAL ────────────────────────────────────── */
const Modal = ({ contacts, onClose, settings }) => {
  const [f, setF] = useState({ nama: '', hp: '', kelas: '', desa: '', ortu: '', mapel: [], catatan: '' });
  const kelasList = (settings.formKelas || 'SD 3,SD 4,SD 5,SD 6,SMP 7,SMP 8,SMP 9').split(',').map(s => s.trim());
  const ortuList = (settings.formOrtu || 'Petani,Buruh,Pedagang,PNS,Wiraswasta,Guru,Lainnya').split(',').map(s => s.trim());
  const mapelList = (settings.formMapel || 'Matematika,IPA,IPS,Bahasa Indonesia,Bahasa Inggris,Semua Mapel').split(',').map(s => s.trim());
  const tgl = m => setF(p => ({ ...p, mapel: p.mapel.includes(m) ? p.mapel.filter(x => x !== m) : [...p.mapel, m] }));
  const kirim = () => {
    if (!f.nama || !f.hp || !f.kelas) { alert('Mohon isi nama, nomor HP, dan kelas.'); return; }
    const wa = contacts[0]?.wa || settings.waDefault || '6281234567890';
    const header = settings.formWaHeader || '*PENDAFTARAN BIMBEL GEMILANG* 🚀';
    const footer = settings.formWaFooter || 'Mohon dikonfirmasi, terima kasih!';
    const pesan = `${header}\n\n👤 Nama: ${f.nama}\n📞 HP/WA: ${f.hp}\n🏫 Kelas: ${f.kelas}\n🏡 Desa: ${f.desa || '-'}\n👨‍👩‍👦 Pekerjaan Ortu: ${f.ortu || '-'}\n📚 Mapel: ${f.mapel.join(', ') || '-'}\n📝 Catatan: ${f.catatan || '-'}\n\n${footer}`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(pesan)}`, '_blank');
    onClose();
  };
  const iS = { width: '100%', padding: '10px 13px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: "'Nunito',sans-serif", outline: 'none', boxSizing: 'border-box' };
  const lS = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 5, letterSpacing: 0.5, fontFamily: "'Orbitron',sans-serif" };

  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg,#0d1a35,#0a0f1e)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 0 60px rgba(243,156,18,0.12)' }}>
      {/* Trial banner */}
      {settings.trialAktif === 'ya' && settings.trialBanner && (
        <div style={{ background: 'linear-gradient(135deg,rgba(243,156,18,0.15),rgba(230,126,34,0.1))', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#f39c12', fontFamily: "'Orbitron',sans-serif", textAlign: 'center' }}>
          {settings.trialBanner}
          {settings.trialDeskripsi && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: "'Nunito',sans-serif" }}>{settings.trialDeskripsi}</div>}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 15, margin: 0 }}>🚀 Formulir Pendaftaran</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer' }}>✕</button>
      </div>
      {settings.formPesan && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18, lineHeight: 1.6 }}>{settings.formPesan}</p>}
      {[{ label: 'Nama Lengkap Siswa *', key: 'nama', ph: 'Budi Santoso' }, { label: 'No. HP / WhatsApp *', key: 'hp', ph: '08xxxxxxxxxx' }, { label: 'Alamat / Desa', key: 'desa', ph: 'Desa Sukamaju, Kec. Genteng' }].map(({ label, key, ph }) => (
        <div key={key} style={{ marginBottom: 14 }}><label style={lS}>{label}</label><input value={f[key]} onChange={e => setF(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={iS} /></div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={lS}>Kelas / Jenjang *</label><select value={f.kelas} onChange={e => setF(p => ({ ...p, kelas: e.target.value }))} style={{ ...iS, background: 'rgba(10,12,20,0.9)' }}><option value="">Pilih...</option>{kelasList.map(k => <option key={k} style={{ background: '#0a0c14' }}>{k}</option>)}</select></div>
        <div><label style={lS}>Pekerjaan Ortu</label><select value={f.ortu} onChange={e => setF(p => ({ ...p, ortu: e.target.value }))} style={{ ...iS, background: 'rgba(10,12,20,0.9)' }}><option value="">Pilih...</option>{ortuList.map(k => <option key={k} style={{ background: '#0a0c14' }}>{k}</option>)}</select></div>
      </div>
      <div style={{ marginBottom: 14 }}><label style={lS}>Mata Pelajaran yang Diinginkan</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>{mapelList.map(m => <button key={m} onClick={() => tgl(m)} style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", background: f.mapel.includes(m) ? 'rgba(243,156,18,0.2)' : 'rgba(255,255,255,0.05)', border: f.mapel.includes(m) ? '1px solid #f39c12' : '1px solid rgba(255,255,255,0.12)', color: f.mapel.includes(m) ? '#f39c12' : 'rgba(255,255,255,0.65)', transition: 'all 0.2s' }}>{m}</button>)}</div></div>
      <div style={{ marginBottom: 20 }}><label style={lS}>Catatan (opsional)</label><textarea value={f.catatan} onChange={e => setF(p => ({ ...p, catatan: e.target.value }))} placeholder="Pertanyaan atau info tambahan..." style={{ ...iS, minHeight: 70, resize: 'vertical' }} /></div>
      <button onClick={kirim} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#25D366,#1da851)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", boxShadow: '0 0 18px rgba(37,211,102,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>{settings.formTombolLabel || '💬 Kirim via WhatsApp'}</button>
    </div>
  </div>;
};

/* ─── MAIN ────────────────────────────────────────────── */
export default function PublicBlog() {
  const [blogs, setBlogs] = useState([]); const [teachers, setTeachers] = useState([]); const [contacts, setContacts] = useState([]);
  const [berita, setBerita] = useState([]); const [testimoni, setTestimoni] = useState([]); const [penghargaan, setPenghargaan] = useState([]);
  const [keunggulan, setKeunggulan] = useState([]);
  const [settings, setSettings] = useState({
    heroTitle: 'GEMILANG', heroSub: 'Eksplorasi Ilmu di Galaksi Pengetahuan',
    heroDeskripsi: 'Bimbel terpercaya di Desa Glagahagung, Banyuwangi', heroBtnDaftar: '🚀 DAFTAR SEKARANG', heroBtnSekunder: '▶ LIHAT AKTIVITAS',
    mapsUrl: '', tiktokUrl: '', igUrl: '', waDefault: '', alamat: 'Desa Glagahagung, Banyuwangi',
    hariOperasional: 'Senin – Sabtu', jamOperasional: '13.00 – 17.00 WIB',
    jamSD: '13.00 – 14.00 WIB', jamSMP: '14.30 – 16.00 WIB',
    kapasitasKelas: 'Maks. 15 siswa per kelas',
    stat1Num: '100+', stat1Label: 'Siswa Aktif', stat2Num: '3+', stat2Label: 'Tahun Berpengalaman', stat3Num: 'SD–SMP', stat3Label: 'Jenjang', stat4Num: '95%', stat4Label: 'Nilai Naik',
    founderName: 'Wildan Bima Prakusya, S.I.Kom.', founderTitle: 'Founder & CEO', founderMessage: '', founderPhoto: '',
    visi: 'Menjadi mitra belajar terdepan...', misiLengkap: 'Program komprehensif...', taglineUtama: '"Kami percaya setiap anak punya cara sendiri untuk menjadi GEMILANG!"',
    coreValue1Title: 'Pondasi Kuat', coreValue1Desc: 'Membangun pemahaman konseptual mendalam.',
    coreValue2Title: 'Pencerahan Kreatif', coreValue2Desc: 'Menyalakan api kecerdasan dan kreativitas.',
    coreValue3Title: 'Aplikasi Nyata', coreValue3Desc: 'Keterampilan praktis untuk ujian dan tantangan.',
    coreValue4Title: 'Komitmen Bersama', coreValue4Desc: 'Kemitraan aktif dengan orang tua.',
    sdJudul: 'SD Kelas 3–6', sdDurasi: '60 menit', sdDeskripsi: 'Fondasi akademik kuat dengan Literasi dan Numerasi.', sdMapel: 'Matematika, IPA, IPS, Bahasa Indonesia, Bahasa Inggris, TIK/PAI', sdFokus1: 'Literasi & Numerasi', sdFokus2: 'Kurikulum Merdeka', sdFokus3: 'Persiapan Ujian',
    smpJudul: 'SMP Kelas 7–9', smpDurasi: '90 menit', smpDeskripsi: 'Penguasaan konsep mendalam dan HOTS.', smpMapel: 'IPA, IPS, Matematika, Bahasa Indonesia, Bahasa Inggris, TIK/PAI', smpFokus1: 'Sinkronisasi Modul', smpFokus2: 'Persiapan UH, PTS, PAT', smpFokus3: 'Persiapan Ujian & Masuk SMA',
    fas1: 'Ruang Kelas ber-AC dengan Proyektor', fas2: 'Taman Outdoor', fas3: 'Area Mengerjakan Tugas ber-WiFi', fas4: 'CCTV 24 jam', fas5: 'Toilet bersih', fas6: 'Admin responsif',
    formKelas: 'SD 3,SD 4,SD 5,SD 6,SMP 7,SMP 8,SMP 9', formOrtu: 'Petani,Buruh,Pedagang,PNS,Wiraswasta,Guru,Lainnya',
    formMapel: 'Matematika,IPA,IPS,Bahasa Indonesia,Bahasa Inggris,Semua Mapel',
    formPesan: '', formTombolLabel: '💬 Kirim via WhatsApp', formWaHeader: '*PENDAFTARAN BIMBEL GEMILANG* 🚀', formWaFooter: 'Mohon dikonfirmasi, terima kasih!',
    trialBanner: '', trialDeskripsi: '', trialAktif: 'tidak',
    secAktivitasJudul: 'MISI AKTIVITAS', secAktivitasSub: 'Saksikan langsung kegiatan seru Bimbel Gemilang',
    secPengajarJudul: 'ASTRONOT KAMI', secPengajarSub: 'Para pendidik berpengalaman siap membimbing',
    secBeritaJudul: 'SINYAL BERITA', secBeritaSub: 'Informasi terbaru dari markas Bimbel Gemilang',
    secKontakJudul: 'HUBUNGI KAMI', secKontakSub: 'Tim kami siap membantu',
    footerCopyright: `© ${new Date().getFullYear()} BIMBEL GEMILANG · ALL RIGHTS RESERVED`,
    footerTagline: 'Membangun Generasi Gemilang dari Desa',
  });
  const [showDaftar, setShowDaftar] = useState(false); const [selBerita, setSelBerita] = useState(null);

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

  const getEmbed = item => {
    if (item.type === 'tiktok') { const p = item.url.split('/video/'); return p.length > 1 ? `https://www.tiktok.com/embed/v2/${p[1].split('?')[0]}` : null; }
    return null;
  };

  const waUrl = contacts[0] ? `https://wa.me/${contacts[0].wa}` : settings.waDefault ? `https://wa.me/${settings.waDefault}` : '#';
  const coreValues = [
    { icon: '🏗️', title: settings.coreValue1Title, desc: settings.coreValue1Desc },
    { icon: '💡', title: settings.coreValue2Title, desc: settings.coreValue2Desc },
    { icon: '🎯', title: settings.coreValue3Title, desc: settings.coreValue3Desc },
    { icon: '🤝', title: settings.coreValue4Title, desc: settings.coreValue4Desc },
  ];
  const fasilitas = [settings.fas1, settings.fas2, settings.fas3, settings.fas4, settings.fas5, settings.fas6].filter(Boolean);

  return <div style={{ background: '#05070f', color: 'white', minHeight: '100vh', fontFamily: "'Nunito',sans-serif", overflowX: 'hidden' }}>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <style>{`
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
      @keyframes floatSlow{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(3deg)}}
      @keyframes shoot{0%{opacity:1;transform:rotate(-28deg) translateX(0)}100%{opacity:0;transform:rotate(-28deg) translateX(190px) translateY(85px)}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(243,156,18,0.4)}50%{box-shadow:0 0 0 14px rgba(243,156,18,0)}}
      @keyframes orbit{from{transform:rotate(0deg) translateX(64px) rotate(0deg)}to{transform:rotate(360deg) translateX(64px) rotate(-360deg)}}
      @keyframes shimmer{0%{opacity:0.5}50%{opacity:1}100%{opacity:0.5}}
      *{box-sizing:border-box}
      ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#05070f}::-webkit-scrollbar-thumb{background:#f39c12;border-radius:3px}
      .nd{display:flex!important}.nm{display:none!important}
      @media(max-width:768px){.nd{display:none!important}.nm{display:flex!important;align-items:center;justify-content:center}}
      .ch:hover{transform:translateY(-6px)!important;box-shadow:0 18px 40px rgba(243,156,18,0.14)!important}
      .ch{transition:transform 0.3s,box-shadow 0.3s}
      option{background:#0a0c14}
    `}</style>

    <Stars /><Shooting />
    <Nav onDaftar={() => setShowDaftar(true)} settings={settings} />

    {/* ════════════ HERO ════════════ */}
    <section id="beranda" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 20px 60px', position: 'relative', zIndex: 2 }}>
      {/* Mascot decorative */}
      <div style={{ position: 'absolute', right: '5%', top: '20%', opacity: 0.18, pointerEvents: 'none' }} className="nd">
        <AstroFloat size={160} />
      </div>
      <div style={{ position: 'absolute', left: '4%', bottom: '25%', opacity: 0.12, pointerEvents: 'none' }} className="nd">
        <AstroFloat size={100} style={{ animationDelay: '1.5s' }} />
      </div>

      <div style={{ animation: 'fadeUp 1s ease both', animationDelay: '0.15s' }}>
        {/* LOGO dengan mix-blend-mode untuk hapus background putih */}
        <div style={{ marginBottom: 22 }}>
          <img src="/logo-gemilang.png.png" alt="Logo Gemilang" style={{ height: 110, filter: 'drop-shadow(0 0 28px rgba(243,156,18,0.6))', mixBlendMode: 'screen', animation: 'float 3.5s ease-in-out infinite' }} onError={e => { e.target.style.display = 'none'; }} />
        </div>
      </div>

      <div style={{ animation: 'fadeUp 1s ease both', animationDelay: '0.3s' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 20, padding: '5px 16px', marginBottom: 18, fontSize: 11, color: '#f39c12', fontFamily: "'Orbitron',sans-serif", letterSpacing: 1 }}>✦ BIMBINGAN BELAJAR TERPERCAYA · GLAGAHAGUNG</div>
        <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 'clamp(28px,7vw,72px)', fontWeight: 900, margin: '0 0 14px', lineHeight: 1.05 }}>
          SELAMAT DATANG DI<br /><span style={{ color: '#f39c12', textShadow: '0 0 32px rgba(243,156,18,0.55)' }}>{settings.heroTitle}</span>
        </h1>
        <p style={{ fontSize: 'clamp(13px,2vw,17px)', color: 'rgba(255,255,255,0.55)', maxWidth: 540, margin: '0 auto 10px', lineHeight: 1.85 }}>{settings.heroSub}</p>
        {settings.heroDeskripsi && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 440, margin: '0 auto 32px' }}>{settings.heroDeskripsi}</p>}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 1s ease both', animationDelay: '0.5s' }}>
        <button onClick={() => setShowDaftar(true)} style={{ background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', color: '#0a0a1a', padding: '13px 30px', borderRadius: 30, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", boxShadow: '0 0 24px rgba(243,156,18,0.4)', animation: 'pulse 2.5s infinite', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>{settings.heroBtnDaftar}</button>
        <button onClick={() => document.getElementById('aktivitas')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', border: '1px solid rgba(243,156,18,0.45)', color: '#f39c12', padding: '13px 30px', borderRadius: 30, fontSize: 13, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(243,156,18,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{settings.heroBtnSekunder}</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 32, marginTop: 60, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 1s ease both', animationDelay: '0.65s' }}>
        {[[settings.stat1Num, settings.stat1Label], [settings.stat2Num, settings.stat2Label], [settings.stat3Num, settings.stat3Label], [settings.stat4Num, settings.stat4Label]].map(([num, label], i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: '#f39c12' }}>{num}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: 0.4 }}>
        <div style={{ fontSize: 9, fontFamily: "'Orbitron',sans-serif", letterSpacing: 3, color: 'rgba(255,255,255,0.5)' }}>SCROLL</div>
        <div style={{ width: 1, height: 36, background: 'linear-gradient(180deg,rgba(243,156,18,0.6),transparent)' }} />
      </div>
    </section>

    {/* ════════════ TRIAL BANNER ════════════ */}
    {settings.trialAktif === 'ya' && settings.trialBanner && (
      <div style={{ position: 'relative', zIndex: 2, background: 'linear-gradient(135deg,rgba(243,156,18,0.12),rgba(124,58,237,0.08))', borderTop: '1px solid rgba(243,156,18,0.2)', borderBottom: '1px solid rgba(243,156,18,0.2)', padding: '16px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 'clamp(12px,2vw,15px)', marginBottom: 6 }}>{settings.trialBanner}</div>
        {settings.trialDeskripsi && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{settings.trialDeskripsi}</div>}
        <button onClick={() => setShowDaftar(true)} style={{ marginTop: 12, padding: '9px 22px', background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', borderRadius: 20, color: '#0a0a1a', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif" }}>Daftar Sekarang →</button>
      </div>
    )}

    {/* ════════════ AKTIVITAS ════════════ */}
    <Sec id="aktivitas">
      <Title icon="🎬" title={settings.secAktivitasJudul} sub={settings.secAktivitasSub} />
      <Slider height={440} items={blogs} render={item => {
        const embed = getEmbed(item);
        return <div style={{ height: '100%', position: 'relative', cursor: 'pointer', borderRadius: 20, overflow: 'hidden', background: '#0d1a2e' }} onClick={() => window.open(item.url, '_blank')}>
          {embed ? <iframe src={embed} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} title="Video" /> :
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0d1a35,#1a0a2e)', gap: 14 }}>
              <div style={{ width: 70, height: 70, background: 'rgba(243,156,18,0.12)', border: '2px solid #f39c12', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>▶</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', padding: '0 40px' }}>{item.caption}</p>
              <span style={{ fontSize: 12, color: 'rgba(243,156,18,0.7)', fontFamily: "'Orbitron',sans-serif" }}>Klik untuk menonton →</span>
            </div>}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 20px 18px', background: 'linear-gradient(transparent,rgba(0,0,0,0.85))' }}>
            <span style={{ background: item.type === 'tiktok' ? 'rgba(0,0,0,0.7)' : 'linear-gradient(135deg,#833ab4,#fd1d1d)', padding: '3px 11px', borderRadius: 10, fontSize: 11, fontFamily: "'Orbitron',sans-serif" }}>{item.type === 'tiktok' ? '♪ TikTok' : '◻ Instagram'}</span>
            <p style={{ margin: '7px 0 0', fontSize: 14, fontWeight: 700 }}>{item.caption}</p>
          </div>
        </div>;
      }} />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
        {settings.tiktokUrl && <button onClick={() => window.open(settings.tiktokUrl, '_blank')} style={{ padding: '11px 22px', background: '#111', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", fontSize: 12, transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>♪ TikTok Kami</button>}
        {settings.igUrl && <button onClick={() => window.open(settings.igUrl, '_blank')} style={{ padding: '11px 22px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border: 'none', color: 'white', borderRadius: 10, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", fontSize: 12, transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>◻ Instagram Kami</button>}
      </div>
    </Sec>

    {/* ════════════ PENGAJAR ════════════ */}
    <Sec id="pengajar" bg="rgba(243,156,18,0.03)">
      <Title icon="👨‍🚀" title={settings.secPengajarJudul} sub={settings.secPengajarSub} />
      <Slider height={360} items={teachers} render={t => (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 28, maxWidth: 380 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
              <img src={t.photoUrl} alt={t.nama} style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f39c12', boxShadow: '0 0 28px rgba(243,156,18,0.35)' }} />
              <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '1px solid rgba(243,156,18,0.2)', pointerEvents: 'none' }}>
                <div style={{ width: 9, height: 9, background: '#f39c12', borderRadius: '50%', position: 'absolute', top: -4, left: 'calc(50% - 4px)', animation: 'orbit 7s linear infinite' }} />
              </div>
            </div>
            <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 17, color: 'white', margin: '0 0 5px' }}>{t.nama}</h3>
            <p style={{ color: 'rgba(243,156,18,0.8)', fontSize: 13, margin: '0 0 8px' }}>{t.spesialisasi}</p>
            {t.bio && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.75, margin: '0 0 16px' }}>{t.bio}</p>}
            {t.wa && <button onClick={() => window.open(`https://wa.me/${t.wa}`, '_blank')} style={{ padding: '9px 20px', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontFamily: "'Orbitron',sans-serif", transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.12)'}>💬 Hubungi</button>}
          </div>
        </div>
      )} />
    </Sec>

    {/* ════════════ KEUNGGULAN ════════════ */}
    {keunggulan.length > 0 && <Sec id="keunggulan">
      <Title icon="✨" title="KEUNGGULAN KAMI" sub="Mengapa keluarga memilih Bimbel Gemilang" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
        {keunggulan.map(k => (
          <div key={k.id} className="ch" onClick={() => k.link && window.open(k.link, '_blank')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, cursor: k.link ? 'pointer' : 'default', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 34, marginBottom: 14 }}>{k.icon}</div>
            <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: 'white', margin: '0 0 9px' }}>{k.judul}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{k.deskripsi}</p>
            {k.link && <div style={{ marginTop: 12, fontSize: 11, color: '#f39c12', fontFamily: "'Orbitron',sans-serif" }}>Selengkapnya →</div>}
          </div>
        ))}
      </div>
    </Sec>}

    {/* ════════════ PROGRAM ════════════ */}
    <Sec id="program" bg="rgba(124,58,237,0.04)">
      <Title icon="📖" title="PROGRAM KAMI" sub="Dirancang sesuai kebutuhan akademis SD dan SMP" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        {/* SD */}
        <div className="ch" style={{ background: 'linear-gradient(135deg,rgba(243,156,18,0.08),rgba(124,58,237,0.05))', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 20, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(243,156,18,0.15)', border: '1px solid rgba(243,156,18,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏫</div>
            <div><h3 style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 15, margin: 0 }}>{settings.sdJudul}</h3><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>⏱ {settings.sdDurasi}</div></div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 16 }}>{settings.sdDeskripsi}</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, marginBottom: 8 }}>MATA PELAJARAN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {settings.sdMapel.split(',').map(m => <span key={m} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.2)', color: '#f39c12' }}>{m.trim()}</span>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, marginBottom: 8 }}>FOKUS UTAMA</div>
            {[settings.sdFokus1, settings.sdFokus2, settings.sdFokus3].filter(Boolean).map((f, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><span style={{ color: '#f39c12', fontSize: 12 }}>✦</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{f}</span></div>)}
          </div>
        </div>

        {/* SMP */}
        <div className="ch" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(243,156,18,0.05))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎓</div>
            <div><h3 style={{ fontFamily: "'Orbitron',sans-serif", color: '#a78bfa', fontSize: 15, margin: 0 }}>{settings.smpJudul}</h3><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>⏱ {settings.smpDurasi}</div></div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 16 }}>{settings.smpDeskripsi}</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, marginBottom: 8 }}>MATA PELAJARAN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {settings.smpMapel.split(',').map(m => <span key={m} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>{m.trim()}</span>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, marginBottom: 8 }}>FOKUS UTAMA</div>
            {[settings.smpFokus1, settings.smpFokus2, settings.smpFokus3].filter(Boolean).map((f, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><span style={{ color: '#a78bfa', fontSize: 12 }}>✦</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{f}</span></div>)}
          </div>
        </div>
      </div>

      {/* Fasilitas */}
      <div style={{ marginTop: 36, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px 28px' }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 13, marginBottom: 18, textAlign: 'center' }}>🏛️ FASILITAS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {fasilitas.map((f, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: '#f39c12', fontSize: 16, flexShrink: 0 }}>✦</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
          </div>)}
        </div>
      </div>

      {/* Jam operasional */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        {[['🕐', 'Hari Operasional', settings.hariOperasional], ['⏰', 'Jam Operasional', settings.jamOperasional], ['📚', 'Kelas SD', settings.jamSD], ['📘', 'Kelas SMP', settings.jamSMP], ['👥', 'Kapasitas', settings.kapasitasKelas]].map(([icon, label, val]) => val && (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{val}</div>
          </div>
        ))}
      </div>
    </Sec>

    {/* ════════════ BERITA ════════════ */}
    <Sec id="berita" bg="rgba(139,92,246,0.03)">
      <Title icon="📡" title={settings.secBeritaJudul} sub={settings.secBeritaSub} />
      {berita.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
        {berita.map(b => <div key={b.id} className="ch" onClick={() => setSelBerita(b)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
          {b.imageUrl && <img src={b.imageUrl} alt={b.judul} style={{ width: '100%', height: 155, objectFit: 'cover' }} />}
          <div style={{ padding: 18 }}>
            <span style={{ fontSize: 10, color: '#f39c12', fontFamily: "'Orbitron',sans-serif", letterSpacing: 1 }}>{b.kategori || 'BERITA'}</span>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '7px 0', lineHeight: 1.45 }}>{b.judul}</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: 0 }}>{b.isi?.substring(0, 90)}...</p>
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{b.createdAt?.toDate?.()?.toLocaleDateString('id-ID')}</div>
          </div>
        </div>)}
      </div> : <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.25)', fontFamily: "'Orbitron',sans-serif", fontSize: 13 }}>Belum ada berita</div>}
    </Sec>

    {/* ════════════ TESTIMONI ════════════ */}
    {testimoni.length > 0 && <Sec id="testimoni" bg="rgba(37,211,102,0.02)">
      <Title icon="⭐" title="TESTIMONI" sub="Apa kata mereka tentang Bimbel Gemilang" />
      <Slider height={250} items={testimoni} render={t => (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 32px', maxWidth: 560, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 12 }}>{'⭐'.repeat(t.bintang)}</div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, margin: '0 0 18px', fontStyle: 'italic' }}>"{t.isi}"</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              {t.photoUrl ? <img src={t.photoUrl} alt={t.nama} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f39c12' }} /> : <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(243,156,18,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>}
              <div style={{ textAlign: 'left' }}><div style={{ fontSize: 14, fontWeight: 700 }}>{t.nama}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.kelas}</div></div>
            </div>
          </div>
        </div>
      )} />
    </Sec>}

    {/* ════════════ PENGHARGAAN ════════════ */}
    {penghargaan.length > 0 && <Sec id="penghargaan">
      <Title icon="🏆" title="PENGHARGAAN" sub="Pengakuan atas dedikasi kami" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {penghargaan.map(p => <div key={p.id} className="ch" style={{ background: 'rgba(243,156,18,0.06)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          {p.imageUrl ? <img src={p.imageUrl} alt={p.judul} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', margin: '0 auto 12px', display: 'block', border: '2px solid rgba(243,156,18,0.4)' }} /> : <div style={{ fontSize: 42, marginBottom: 12 }}>🏆</div>}
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: '#f39c12', margin: '0 0 5px' }}>{p.judul}</h3>
          {p.tahun && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{p.tahun}</div>}
          {p.deskripsi && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{p.deskripsi}</p>}
        </div>)}
      </div>
    </Sec>}

    {/* ════════════ TENTANG — FULL ════════════ */}
    <Sec id="tentang" bg="rgba(124,58,237,0.04)">
      <Title icon="🌌" title="TENTANG KAMI" sub="Misi, visi, dan kisah di balik Bimbel Gemilang" />

      {/* Tagline */}
      {settings.taglineUtama && (
        <div style={{ textAlign: 'center', marginBottom: 44, padding: '24px 32px', background: 'linear-gradient(135deg,rgba(243,156,18,0.08),rgba(124,58,237,0.06))', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 18 }}>
          <div style={{ fontSize: 'clamp(14px,2.5vw,20px)', color: '#f39c12', fontStyle: 'italic', lineHeight: 1.7, fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>{settings.taglineUtama}</div>
        </div>
      )}

      {/* Visi Misi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginBottom: 36 }}>
        <div className="ch" style={{ background: 'rgba(243,156,18,0.07)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 16, padding: 26 }}>
          <div style={{ fontSize: 30, marginBottom: 12 }}>🔭</div>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 13, margin: '0 0 10px' }}>VISI KAMI</h3>
          <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, fontSize: 13 }}>{settings.visi}</p>
        </div>
        <div className="ch" style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, padding: 26 }}>
          <div style={{ fontSize: 30, marginBottom: 12 }}>🚀</div>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", color: '#a78bfa', fontSize: 13, margin: '0 0 10px' }}>MISI KAMI</h3>
          <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, fontSize: 13 }}>{settings.misiLengkap}</p>
        </div>
      </div>

      {/* Core Values */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>💎 NILAI INTI KAMI</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
          {coreValues.map((cv, i) => <div key={i} className="ch" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '22px 20px' }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>{cv.icon}</div>
            <h4 style={{ fontFamily: "'Orbitron',sans-serif", color: 'white', fontSize: 12, margin: '0 0 8px' }}>{cv.title}</h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{cv.desc}</p>
          </div>)}
        </div>
      </div>

      {/* Founder */}
      {(settings.founderName || settings.founderMessage) && (
        <div style={{ background: 'linear-gradient(135deg,#0d1a35,#0a0f1e)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 20, padding: '32px 28px', marginBottom: 36, display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            {settings.founderPhoto ? <img src={settings.founderPhoto} alt={settings.founderName} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f39c12', boxShadow: '0 0 20px rgba(243,156,18,0.3)', marginBottom: 8 }} /> : <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(243,156,18,0.12)', border: '2px solid rgba(243,156,18,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, marginBottom: 8 }}>👤</div>}
            <div style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 11, marginBottom: 3 }}>{settings.founderName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{settings.founderTitle}</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 12, marginBottom: 14, letterSpacing: 1 }}>FROM THE FOUNDER</div>
            <h3 style={{ fontFamily: "'Orbitron',sans-serif", color: 'white', fontSize: 18, margin: '0 0 16px', lineHeight: 1.3 }}>Building Foundations,<br />Igniting Futures</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, margin: 0 }}>{settings.founderMessage}</p>
          </div>
        </div>
      )}

      {/* Maskot Astronot showcase */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, flexWrap: 'wrap', padding: '20px 0', marginBottom: 36, opacity: 0.85 }}>
        <AstroFloat size={80} style={{ animationDelay: '0s' }} />
        <AstroFloat size={110} style={{ animationDelay: '0.8s' }} />
        <AstroFloat size={90} style={{ animationDelay: '1.6s' }} />
        <AstroFloat size={75} style={{ animationDelay: '0.4s' }} />
        <AstroFloat size={100} style={{ animationDelay: '1.2s' }} />
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        {[['📍', 'Lokasi Kami', settings.alamat || 'Desa Glagahagung, Banyuwangi'],
          ['🕐', 'Jam Operasional', `${settings.hariOperasional} · ${settings.jamOperasional}`],
          ['📞', 'Hubungi Kami', contacts[0] ? `WA: ${contacts[0].wa}` : 'Lihat bagian Kontak'],
          ['👥', 'Kapasitas Kelas', settings.kapasitasKelas || 'Maks. 15 siswa/kelas'],
          ...(settings.catatanOperasional ? [['📌', 'Catatan', settings.catatanOperasional]] : [])
        ].map(([icon, title, desc]) => <div key={title} className="ch" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", color: 'white', fontSize: 12, margin: '0 0 8px' }}>{title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, fontSize: 13, margin: 0 }}>{desc}</p>
        </div>)}
      </div>
    </Sec>

    {/* ════════════ KONTAK ════════════ */}
    <Sec id="kontak">
      <Title icon="📡" title={settings.secKontakJudul} sub={settings.secKontakSub} />
      {contacts.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16, marginBottom: 36 }}>
        {contacts.map(c => <div key={c.id} className="ch" onClick={() => window.open(`https://wa.me/${c.wa}`, '_blank')} style={{ background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 16, padding: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={c.photoUrl} alt={c.nama} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,211,102,0.45)', flexShrink: 0 }} />
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>{c.nama}</div><div style={{ fontSize: 12, color: '#25D366', marginTop: 2 }}>● Online · Klik Chat WA</div>{c.jabatan && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{c.jabatan}</div>}</div>
        </div>)}
      </div> : <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: "'Orbitron',sans-serif" }}>Belum ada data kontak</div>}
      {settings.mapsUrl && <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <button onClick={() => window.open(settings.mapsUrl, '_blank')} style={{ padding: '13px 28px', background: 'transparent', border: '1px solid rgba(243,156,18,0.45)', color: '#f39c12', borderRadius: 12, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", fontSize: 13, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(243,156,18,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>📍 LIHAT LOKASI DI MAPS</button>
      </div>}
    </Sec>

    {/* ════════════ FOOTER ════════════ */}
    <footer style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 20px', textAlign: 'center' }}>
      <img src="/logo-gemilang.png.png" alt="Logo" style={{ height: 46, marginBottom: 12, mixBlendMode: 'screen', filter: 'drop-shadow(0 0 8px rgba(243,156,18,0.35))' }} onError={e => { e.target.style.display = 'none'; }} />
      {settings.footerTagline && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '0 0 6px', fontStyle: 'italic' }}>{settings.footerTagline}</p>}
      {settings.alamat && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: '0 0 6px' }}>📍 {settings.alamat}</p>}
      <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10, margin: 0, fontFamily: "'Orbitron',sans-serif", letterSpacing: 1 }}>{settings.footerCopyright}</p>
      {/* Mascot kecil di footer */}
      <div style={{ position: 'absolute', right: 20, bottom: 10, opacity: 0.15, pointerEvents: 'none' }}>
        <AstroFloat size={60} />
      </div>
    </footer>

    {/* WA FLOATING */}
    {(contacts.length > 0 || settings.waDefault) && (
      <a href={waUrl} target="_blank" rel="noreferrer" style={{ position: 'fixed', bottom: 22, right: 22, width: 56, height: 56, background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, zIndex: 150, boxShadow: '0 4px 20px rgba(37,211,102,0.5)', animation: 'pulse 2.5s infinite', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>💬</a>
    )}

    {/* MODALS */}
    {showDaftar && <Modal contacts={contacts} onClose={() => setShowDaftar(false)} settings={settings} />}
    {selBerita && <div onClick={() => setSelBerita(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg,#0d1a35,#0a0f1e)', border: '1px solid rgba(243,156,18,0.25)', borderRadius: 20, padding: 28, maxWidth: 580, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        {selBerita.imageUrl && <img src={selBerita.imageUrl} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 18, objectFit: 'cover', maxHeight: 220 }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div><span style={{ fontSize: 10, color: '#f39c12', fontFamily: "'Orbitron',sans-serif", letterSpacing: 1 }}>{selBerita.kategori}</span><h2 style={{ fontFamily: "'Orbitron',sans-serif", color: '#f39c12', fontSize: 17, margin: '6px 0 0' }}>{selBerita.judul}</h2></div>
          <button onClick={() => setSelBerita(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer', marginLeft: 12, flexShrink: 0 }}>✕</button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.95, fontSize: 14, whiteSpace: 'pre-wrap' }}>{selBerita.isi}</p>
        <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{selBerita.createdAt?.toDate?.()?.toLocaleDateString('id-ID')}</div>
      </div>
    </div>}
  </div>;
}