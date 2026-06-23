// src/pages/PublicBlog.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";

// ... (SEMUA KODE ASLI KAMU, TAPI SAYA TAMBAHKAN TEMA DI BAWAH)

// ============================================================
// ════════════ TEMA CONTEXT ════════════
// ============================================================
const ThemeContext = React.createContext();

// ============================================================
// ════════════ NAVBAR DENGAN TEMA ════════════
// ============================================================
const Nav = ({ onDaftar, settings, theme, toggleTheme }) => {
  const [sc, setSc] = useState(false); const [open, setOpen] = useState(false);
  const isDark = theme === 'dark';
  
  useEffect(() => { const fn = () => setSc(window.scrollY > 40); window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn); }, []);
  const go = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); };
  const links = [['beranda', 'Beranda'], ['aktivitas', 'Aktivitas'], ['pengajar', 'Pengajar'], ['program', 'Program'], ['berita', 'Berita'], ['kontak', 'Kontak']];
  
  return <nav style={{ 
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, 
    background: sc ? (isDark ? 'rgba(5,7,18,0.94)' : 'rgba(255,255,255,0.92)') : 'transparent',
    backdropFilter: sc ? 'blur(14px)' : 'none',
    borderBottom: sc ? `1px solid ${isDark ? 'rgba(243,156,18,0.1)' : 'rgba(0,0,0,0.05)'}` : 'none',
    transition: 'all 0.4s', padding: '0 16px', height: 58, 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* 🔥 LOGO - PASTIKAN FILE ADA DI public/ */}
      <img 
        src="/logo-gemilang.png.png" 
        alt="Logo Gemilang" 
        style={{ 
          height: 34, 
          filter: isDark ? 'drop-shadow(0 0 10px rgba(243,156,18,0.4))' : 'none', 
          mixBlendMode: isDark ? 'screen' : 'normal'
        }} 
        onError={(e) => { 
          console.error('Logo tidak ditemukan! Cek file di public/logo-gemilang.png.png');
          e.target.style.display = 'none'; 
        }} 
      />
    </div>
    
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="nd">
      {links.map(([id, label]) => <button key={id} onClick={() => go(id)} style={{ 
        background: 'none', border: 'none', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, 
        fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.3, transition: 'all 0.2s'
      }} onMouseEnter={e => { e.target.style.color = isDark ? '#f39c12' : '#1a237e'; }} onMouseLeave={e => { e.target.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'; }}>{label}</button>)}
      
      {/* 🔥 TOMBOL TOGGLE TEMA */}
      <button onClick={toggleTheme} style={{ 
        background: 'none', border: `1px solid ${isDark ? 'rgba(243,156,18,0.3)' : 'rgba(26,35,126,0.2)'}`,
        borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', 
        color: isDark ? '#f39c12' : '#1a237e', fontSize: 14,
        transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginLeft: 4
      }} onMouseEnter={e => e.currentTarget.style.transform = 'rotate(20deg)'} onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}>
        {isDark ? '☀️' : '🌙'}
      </button>
      
      <button onClick={onDaftar} style={{ 
        background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', 
        color: '#0a0a1a', padding: '7px 16px', borderRadius: 16, fontWeight: 700, 
        fontSize: 11, cursor: 'pointer', marginLeft: 4, fontFamily: "'Orbitron',sans-serif",
        boxShadow: isDark ? '0 0 14px rgba(243,156,18,0.3)' : '0 0 12px rgba(243,156,18,0.15)',
        transition: 'transform 0.2s'
      }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        {settings.heroBtnDaftar || '🚀 DAFTAR'}
      </button>
    </div>
    
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {/* 🔥 TOMBOL TOGGLE TEMA (MOBILE) */}
      <button onClick={toggleTheme} style={{ 
        background: 'none', border: `1px solid ${isDark ? 'rgba(243,156,18,0.3)' : 'rgba(26,35,126,0.2)'}`,
        borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', 
        color: isDark ? '#f39c12' : '#1a237e', fontSize: 14,
        transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }} className="nm" onMouseEnter={e => e.currentTarget.style.transform = 'rotate(20deg)'} onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}>
        {isDark ? '☀️' : '🌙'}
      </button>
      <button onClick={() => setOpen(!open)} className="nm" style={{ background: 'none', border: `1px solid ${isDark ? 'rgba(243,156,18,0.4)' : 'rgba(26,35,126,0.2)'}`, color: isDark ? '#f39c12' : '#1a237e', width: 34, height: 34, borderRadius: 6, cursor: 'pointer', fontSize: 16 }}>☰</button>
    </div>
    
    {open && <div style={{ 
      position: 'fixed', top: 58, left: 0, right: 0, 
      background: isDark ? 'rgba(5,7,18,0.97)' : 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(16px)', padding: 14, 
      display: 'flex', flexDirection: 'column', gap: 2, zIndex: 99,
      borderBottom: `1px solid ${isDark ? 'rgba(243,156,18,0.1)' : 'rgba(0,0,0,0.05)'}`
    }}>
      {links.map(([id, label]) => <button key={id} onClick={() => go(id)} style={{ background: 'none', border: 'none', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)', padding: '10px 14px', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: 12, fontFamily: "'Orbitron',sans-serif" }}>{label}</button>)}
      <button onClick={() => { onDaftar(); setOpen(false); }} style={{ background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', color: '#0a0a1a', padding: 12, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 4, fontFamily: "'Orbitron',sans-serif" }}>{settings.heroBtnDaftar || '🚀 DAFTAR SEKARANG'}</button>
    </div>}
  </nav>;
};

// ============================================================
// ════════════ MAIN (DENGAN TEMA) ════════════
// ============================================================
export default function PublicBlog() {
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  // 🔥 SEMUA STATE ASLI KAMU
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

  // 🔥 EFFECTS ASLI KAMU
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

  // 🔥 WARNA BERDASARKAN TEMA
  const bgColor = isDark ? '#05070f' : '#f0f4f8';
  const textColor = isDark ? 'white' : '#1a1a2e';
  const accentColor = isDark ? '#f39c12' : '#1a237e';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'white';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // 🔥 STARS HANYA DI MODE MALAM
  const Stars = () => {
    const ref = useRef(null);
    useEffect(() => {
      const c = ref.current; if (!c) return;
      const ctx = c.getContext('2d');
      let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
      const stars = Array.from({ length: 180 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.2, t: Math.random() * Math.PI * 2, s: Math.random() * 0.018 + 0.008 }));
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

  // 🔥 ASTROFLOAT (TETAP)
  const AstroFloat = ({ size = 80, style = {} }) => (
    <div style={{ animation: 'float 4s ease-in-out infinite', ...style }}>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="75" rx="28" ry="32" fill="white" />
        <ellipse cx="60" cy="75" rx="28" ry="32" fill="url(#astroBody)" opacity="0.3" />
        <circle cx="60" cy="45" r="26" fill="white" />
        <circle cx="60" cy="45" r="20" fill="#7C3AED" opacity="0.15" />
        <circle cx="60" cy="45" r="16" fill="#0a0c1a" />
        <circle cx="55" cy="43" r="3" fill="white" opacity="0.9" />
        <circle cx="65" cy="43" r="3" fill="white" opacity="0.9" />
        <path d="M54 50 Q60 54 66 50" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
        <ellipse cx="52" cy="37" rx="4" ry="2.5" fill="white" opacity="0.25" transform="rotate(-20 52 37)" />
        <rect x="48" y="65" width="8" height="6" rx="2" fill="#f39c12" opacity="0.8" />
        <rect x="64" y="65" width="8" height="6" rx="2" fill="#f39c12" opacity="0.8" />
        <circle cx="60" cy="80" r="6" fill="#7C3AED" opacity="0.6" />
        <circle cx="60" cy="80" r="3" fill="#f39c12" opacity="0.8" />
        <ellipse cx="35" cy="72" rx="8" ry="12" fill="white" transform="rotate(-15 35 72)" />
        <ellipse cx="85" cy="72" rx="8" ry="12" fill="white" transform="rotate(15 85 72)" />
        <ellipse cx="50" cy="103" rx="7" ry="10" fill="white" />
        <ellipse cx="70" cy="103" rx="7" ry="10" fill="white" />
        <ellipse cx="50" cy="112" rx="9" ry="5" fill="#7C3AED" opacity="0.7" />
        <ellipse cx="70" cy="112" rx="9" ry="5" fill="#7C3AED" opacity="0.7" />
        <path d="M33 68 Q32 72 33 76" stroke="#f39c12" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <path d="M87 68 Q88 72 87 76" stroke="#f39c12" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
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

  // 🔥 SLIDER (TETAP)
  const Slider = ({ items, render, height = 400 }) => {
    const [cur, setCur] = useState(0); const [drag, setDrag] = useState(null); const timer = useRef(null);
    const reset = () => { clearInterval(timer.current); if (items.length > 1) timer.current = setInterval(() => setCur(c => (c + 1) % items.length), 4500); };
    useEffect(() => { reset(); return () => clearInterval(timer.current); }, [items.length]);
    const go = i => { setCur(i); reset(); };
    if (!items.length) return <div style={{ textAlign: 'center', padding: 40, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 13 }}>Belum ada data</div>;
    return <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, height, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.06)' }}
      onTouchStart={e => setDrag(e.touches[0].clientX)}
      onTouchEnd={e => { if (drag === null) return; const d = drag - e.changedTouches[0].clientX; if (Math.abs(d) > 40) go(d > 0 ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length); setDrag(null); }}>
      <div style={{ display: 'flex', transition: 'transform 0.65s cubic-bezier(.77,0,.18,1)', transform: `translateX(-${cur * 100}%)`, height: '100%' }}>
        {items.map((item, i) => <div key={i} style={{ minWidth: '100%', height: '100%' }}>{render(item, i)}</div>)}
      </div>
      {items.length > 1 && <>
        <button onClick={() => go((cur - 1 + items.length) % items.length)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', border: `1px solid ${accentColor}30`, color: accentColor, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(8px)', zIndex: 2 }}>‹</button>
        <button onClick={() => go((cur + 1) % items.length)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', border: `1px solid ${accentColor}30`, color: accentColor, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(8px)', zIndex: 2 }}>›</button>
      </>}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 2 }}>
        {items.map((_, i) => <button key={i} onClick={() => go(i)} style={{ width: i === cur ? 18 : 6, height: 6, borderRadius: 3, background: i === cur ? accentColor : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />)}
      </div>
    </div>;
  };

  // 🔥 SECTION WRAPPER
  const Sec = ({ id, children, bg = 'transparent' }) => <section id={id} style={{ position: 'relative', zIndex: 2, padding: '60px 20px', background: bg || (isDark ? 'rgba(5,7,18,0.5)' : 'rgba(255,255,255,0.5)'), borderBottom: `1px solid ${borderColor}` }}><div style={{ maxWidth: 980, margin: '0 auto' }}>{children}</div></section>;
  const Title = ({ icon, title, sub }) => <div style={{ textAlign: 'center', marginBottom: 40 }}>
    <div style={{ fontSize: 32, marginBottom: 6 }}>{icon}</div>
    <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 'clamp(18px,3.5vw,28px)', color: accentColor, margin: '0 0 8px', textShadow: isDark ? `0 0 24px ${accentColor}40` : 'none' }}>{title}</h2>
    {sub && <p style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', fontSize: 13, maxWidth: 480, margin: '0 auto' }}>{sub}</p>}
    <div style={{ width: 48, height: 2, background: `linear-gradient(90deg,transparent,${accentColor},transparent)`, margin: '12px auto 0' }} />
  </div>;

  // 🔥 MODAL (TETAP)
  const Modal = ({ contacts, onClose }) => {
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
    const iS = { width: '100%', padding: '10px 13px', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 10, color: isDark ? 'white' : '#1a1a2e', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
    const lS = { display: 'block', fontSize: 11, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginBottom: 4, letterSpacing: 0.5, fontFamily: "'Orbitron',sans-serif" };
    return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: isDark ? 'linear-gradient(135deg,#0d1a35,#0a0f1e)' : 'white', border: `1px solid ${isDark ? 'rgba(243,156,18,0.3)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: isDark ? '0 0 60px rgba(243,156,18,0.08)' : '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", color: accentColor, fontSize: 15, margin: 0 }}>🚀 Formulir Pendaftaran</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        {settings.formPesan && <p style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginBottom: 18, lineHeight: 1.6 }}>{settings.formPesan}</p>}
        {[{ label: 'Nama Lengkap Siswa *', key: 'nama', ph: 'Budi Santoso' }, { label: 'No. HP / WhatsApp *', key: 'hp', ph: '08xxxxxxxxxx' }, { label: 'Alamat / Desa', key: 'desa', ph: 'Desa Sukamaju' }].map(({ label, key, ph }) => (
          <div key={key} style={{ marginBottom: 14 }}><label style={lS}>{label}</label><input value={f[key]} onChange={e => setF(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={iS} /></div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div><label style={lS}>Kelas / Jenjang *</label><select value={f.kelas} onChange={e => setF(p => ({ ...p, kelas: e.target.value }))} style={{ ...iS, background: isDark ? 'rgba(10,12,20,0.9)' : 'white' }}><option value="">Pilih...</option>{kelasList.map(k => <option key={k} style={{ background: isDark ? '#0a0c14' : 'white' }}>{k}</option>)}</select></div>
          <div><label style={lS}>Pekerjaan Ortu</label><select value={f.ortu} onChange={e => setF(p => ({ ...p, ortu: e.target.value }))} style={{ ...iS, background: isDark ? 'rgba(10,12,20,0.9)' : 'white' }}><option value="">Pilih...</option>{ortuList.map(k => <option key={k} style={{ background: isDark ? '#0a0c14' : 'white' }}>{k}</option>)}</select></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={lS}>Mata Pelajaran</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{mapelList.map(m => <button key={m} onClick={() => tgl(m)} style={{ padding: '4px 12px', borderRadius: 14, fontSize: 11, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", background: f.mapel.includes(m) ? 'rgba(243,156,18,0.15)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: f.mapel.includes(m) ? `1px solid #f39c12` : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, color: f.mapel.includes(m) ? '#f39c12' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', transition: 'all 0.2s' }}>{m}</button>)}</div></div>
        <div style={{ marginBottom: 20 }}><label style={lS}>Catatan (opsional)</label><textarea value={f.catatan} onChange={e => setF(p => ({ ...p, catatan: e.target.value }))} placeholder="Pertanyaan atau info tambahan..." style={{ ...iS, minHeight: 60, resize: 'vertical' }} /></div>
        <button onClick={kirim} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#25D366,#1da851)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", boxShadow: '0 0 18px rgba(37,211,102,0.25)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>{settings.formTombolLabel || '💬 Kirim via WhatsApp'}</button>
      </div>
    </div>;
  };

  return (
    <div style={{ background: bgColor, color: textColor, minHeight: '100vh', fontFamily: "'Nunito',sans-serif", overflowX: 'hidden', transition: 'background 0.6s ease, color 0.6s ease' }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      
      {/* ⭐ BINTANG HANYA DI MODE MALAM */}
      {isDark && <Stars />}
      {isDark && <Shooting />}
      
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes shoot{0%{opacity:1;transform:rotate(-28deg) translateX(0)}100%{opacity:0;transform:rotate(-28deg) translateX(190px) translateY(85px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(243,156,18,0.4)}50%{box-shadow:0 0 0 14px rgba(243,156,18,0)}}
        @keyframes orbit{from{transform:rotate(0deg) translateX(60px) rotate(0deg)}to{transform:rotate(360deg) translateX(60px) rotate(-360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${isDark ? '#05070f' : '#f0f4f8'}}::-webkit-scrollbar-thumb{background:#f39c12;border-radius:3px}
        .ch:hover{transform:translateY(-4px)!important;box-shadow:${isDark ? '0 12px 32px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.08)'}!important}
        .ch{transition:transform 0.3s,box-shadow 0.3s}
        .nd{display:flex!important}.nm{display:none!important}
        @media(max-width:768px){.nd{display:none!important}.nm{display:flex!important;align-items:center;justify-content:center}}
        option{background:${isDark ? '#0a0c14' : 'white'}}
      `}</style>

      {/* ═══════ NAVBAR DENGAN TEMA ═══════ */}
      <Nav onDaftar={() => setShowDaftar(true)} settings={settings} theme={theme} toggleTheme={toggleTheme} />

      {/* ═══════ HERO ═══════ */}
      <section id="beranda" style={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 20px 60px', position: 'relative', zIndex: 2,
        background: isDark ? 'transparent' : 'linear-gradient(135deg,#e8f0fe 0%,#d4e4f7 100%)'
      }}>
        {isDark && (
          <>
            <div style={{ position: 'absolute', right: '5%', top: '15%', opacity: 0.15, pointerEvents: 'none' }} className="nd"><AstroFloat size={140} /></div>
            <div style={{ position: 'absolute', left: '4%', bottom: '20%', opacity: 0.1, pointerEvents: 'none' }} className="nd"><AstroFloat size={90} style={{ animationDelay: '1.5s' }} /></div>
          </>
        )}
        
        <div style={{ animation: 'fadeUp 1s ease both', animationDelay: '0.15s', marginBottom: 18 }}>
          <img src="/logo-gemilang.png.png" alt="Logo Gemilang" style={{ 
            height: isDark ? 110 : 100, 
            filter: isDark ? 'drop-shadow(0 0 28px rgba(243,156,18,0.6))' : 'drop-shadow(0 0 20px rgba(26,35,126,0.15))',
            mixBlendMode: isDark ? 'screen' : 'normal',
            animation: 'float 3.5s ease-in-out infinite'
          }} onError={(e) => { console.error('Logo tidak ditemukan!'); e.target.style.display = 'none'; }} />
        </div>

        <div style={{ animation: 'fadeUp 1s ease both', animationDelay: '0.3s' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(243,156,18,0.1)' : 'rgba(26,35,126,0.06)', border: `1px solid ${isDark ? 'rgba(243,156,18,0.3)' : 'rgba(26,35,126,0.15)'}`, borderRadius: 20, padding: '4px 14px', marginBottom: 14, fontSize: 10, color: accentColor, fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5 }}>✦ BIMBINGAN BELAJAR TERPERCAYA · GLAGAHAGUNG</div>
          <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 'clamp(26px,6vw,64px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.05, color: isDark ? 'white' : '#1a1a2e' }}>
            SELAMAT DATANG DI<br /><span style={{ color: accentColor, textShadow: isDark ? `0 0 32px ${accentColor}80` : `0 0 20px ${accentColor}30` }}>{settings.heroTitle}</span>
          </h1>
          <p style={{ fontSize: 'clamp(12px,1.8vw,16px)', color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)', maxWidth: 520, margin: '0 auto 8px', lineHeight: 1.8 }}>{settings.heroSub}</p>
          {settings.heroDeskripsi && <p style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', maxWidth: 420, margin: '0 auto 28px' }}>{settings.heroDeskripsi}</p>}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 1s ease both', animationDelay: '0.5s' }}>
          <button onClick={() => setShowDaftar(true)} style={{ background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none', color: '#0a0a1a', padding: '12px 28px', borderRadius: 30, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", boxShadow: '0 0 24px rgba(243,156,18,0.35)', animation: 'pulse 2.5s infinite', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>{settings.heroBtnDaftar}</button>
          <button onClick={() => document.getElementById('aktivitas')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', border: `1px solid ${isDark ? 'rgba(243,156,18,0.4)' : 'rgba(26,35,126,0.3)'}`, color: accentColor, padding: '12px 28px', borderRadius: 30, fontSize: 13, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(243,156,18,0.08)' : 'rgba(26,35,126,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{settings.heroBtnSekunder}</button>
        </div>

        <div style={{ display: 'flex', gap: 28, marginTop: 50, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 1s ease both', animationDelay: '0.65s' }}>
          {[[settings.stat1Num, settings.stat1Label], [settings.stat2Num, settings.stat2Label], [settings.stat3Num, settings.stat3Label], [settings.stat4Num, settings.stat4Label]].map(([num, label], i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, color: accentColor }}>{num}</div>
              <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.4 }}>
          <div style={{ fontSize: 8, fontFamily: "'Orbitron',sans-serif", letterSpacing: 3, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)' }}>SCROLL</div>
          <div style={{ width: 1, height: 30, background: `linear-gradient(180deg,${accentColor},transparent)` }} />
        </div>
      </section>

      {/* ═══════ ISI KONTEN (SEMUA ASLI) ═══════ */}
      {/* 🔥 PAKAI COMPONENT YANG SUDAH DIBUAT DI ATAS */}

      {/* AKTIVITAS */}
      <Sec id="aktivitas">
        <Title icon="🎬" title={settings.secAktivitasJudul} sub={settings.secAktivitasSub} />
        <Slider height={380} items={blogs} render={item => {
          const embed = getEmbed(item);
          return <div style={{ height: '100%', position: 'relative', cursor: 'pointer', borderRadius: 16, overflow: 'hidden', background: isDark ? '#0d1a2e' : '#e8ecf1' }} onClick={() => window.open(item.url, '_blank')}>
            {embed ? <iframe src={embed} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} title="Video" /> :
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDark ? 'linear-gradient(135deg,#0d1a35,#1a0a2e)' : 'linear-gradient(135deg,#e8ecf1,#d5dce8)', gap: 12 }}>
                <div style={{ width: 60, height: 60, background: isDark ? 'rgba(243,156,18,0.12)' : 'rgba(26,35,126,0.06)', border: `2px solid ${accentColor}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>▶</div>
                <p style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontSize: 13, textAlign: 'center', padding: '0 30px' }}>{item.caption}</p>
              </div>}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '30px 18px 14px', background: `linear-gradient(transparent,${isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)'})` }}>
              <span style={{ background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)', padding: '2px 10px', borderRadius: 8, fontSize: 10, fontFamily: "'Orbitron',sans-serif", color: 'white' }}>{item.type === 'tiktok' ? '♪ TikTok' : '◻ Instagram'}</span>
              <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 700, color: 'white' }}>{item.caption}</p>
            </div>
          </div>;
        }} />
      </Sec>

      {/* PENGAJAR */}
      <Sec id="pengajar" bg={isDark ? 'rgba(243,156,18,0.03)' : 'rgba(26,35,126,0.01)'}>
        <Title icon="👨‍🚀" title={settings.secPengajarJudul} sub={settings.secPengajarSub} />
        <Slider height={320} items={teachers} render={t => (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: 24, maxWidth: 340 }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
                <img src={t.photoUrl} alt={t.nama} style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${accentColor}`, boxShadow: isDark ? `0 0 28px ${accentColor}40` : `0 0 20px ${accentColor}20` }} />
                {isDark && <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '1px solid rgba(243,156,18,0.15)', pointerEvents: 'none' }}>
                  <div style={{ width: 7, height: 7, background: '#f39c12', borderRadius: '50%', position: 'absolute', top: -3, left: 'calc(50% - 3px)', animation: 'orbit 7s linear infinite' }} />
                </div>}
              </div>
              <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, color: isDark ? 'white' : '#1a1a2e', margin: '0 0 4px' }}>{t.nama}</h3>
              <p style={{ color: accentColor, fontSize: 12, margin: '0 0 6px' }}>{t.spesialisasi}</p>
              {t.bio && <p style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', fontSize: 12, lineHeight: 1.7, margin: '0 0 12px' }}>{t.bio}</p>}
            </div>
          </div>
        )} />
      </Sec>

      {/* KEUNGGULAN */}
      {keunggulan.length > 0 && (
        <Sec id="keunggulan">
          <Title icon="✨" title="KEUNGGULAN KAMI" sub="Mengapa keluarga memilih Bimbel Gemilang" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16 }}>
            {keunggulan.map(k => (
              <div key={k.id} className="ch" onClick={() => k.link && window.open(k.link, '_blank')} style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 22, cursor: k.link ? 'pointer' : 'default', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{k.icon}</div>
                <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: isDark ? 'white' : '#1a1a2e', margin: '0 0 8px' }}>{k.judul}</h3>
                <p style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 1.7, margin: 0 }}>{k.deskripsi}</p>
              </div>
            ))}
          </div>
        </Sec>
      )}

      {/* PROGRAM */}
      <Sec id="program" bg={isDark ? 'rgba(124,58,237,0.04)' : 'rgba(26,35,126,0.01)'}>
        <Title icon="📖" title="PROGRAM KAMI" sub="Dirancang sesuai kebutuhan akademis SD dan SMP" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          <div className="ch" style={{ background: isDark ? 'linear-gradient(135deg,rgba(243,156,18,0.08),rgba(124,58,237,0.05))' : 'white', border: `1px solid ${isDark ? 'rgba(243,156,18,0.2)' : 'rgba(26,35,126,0.08)'}`, borderRadius: 16, padding: 24, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: isDark ? 'rgba(243,156,18,0.15)' : 'rgba(26,35,126,0.06)', border: `1px solid ${isDark ? 'rgba(243,156,18,0.3)' : 'rgba(26,35,126,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏫</div>
              <div><h3 style={{ fontFamily: "'Orbitron',sans-serif", color: accentColor, fontSize: 14, margin: 0 }}>{settings.sdJudul}</h3><div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>⏱ {settings.sdDurasi}</div></div>
            </div>
            <p style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', lineHeight: 1.7, marginBottom: 14 }}>{settings.sdDeskripsi}</p>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5, marginBottom: 6 }}>MATA PELAJARAN</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {settings.sdMapel.split(',').map(m => <span key={m} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: isDark ? 'rgba(243,156,18,0.1)' : 'rgba(26,35,126,0.04)', border: `1px solid ${isDark ? 'rgba(243,156,18,0.2)' : 'rgba(26,35,126,0.08)'}`, color: accentColor }}>{m.trim()}</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5, marginBottom: 6 }}>FOKUS</div>
              {[settings.sdFokus1, settings.sdFokus2, settings.sdFokus3].filter(Boolean).map((f, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}><span style={{ color: accentColor, fontSize: 10 }}>✦</span><span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{f}</span></div>)}
            </div>
          </div>

          <div className="ch" style={{ background: isDark ? 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(243,156,18,0.05))' : 'white', border: `1px solid ${isDark ? 'rgba(124,58,237,0.25)' : 'rgba(26,35,126,0.08)'}`, borderRadius: 16, padding: 24, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(26,35,126,0.06)', border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(26,35,126,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎓</div>
              <div><h3 style={{ fontFamily: "'Orbitron',sans-serif", color: isDark ? '#a78bfa' : '#1a237e', fontSize: 14, margin: 0 }}>{settings.smpJudul}</h3><div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>⏱ {settings.smpDurasi}</div></div>
            </div>
            <p style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', lineHeight: 1.7, marginBottom: 14 }}>{settings.smpDeskripsi}</p>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5, marginBottom: 6 }}>MATA PELAJARAN</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {settings.smpMapel.split(',').map(m => <span key={m} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(26,35,126,0.04)', border: `1px solid ${isDark ? 'rgba(124,58,237,0.25)' : 'rgba(26,35,126,0.08)'}`, color: isDark ? '#a78bfa' : '#1a237e' }}>{m.trim()}</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5, marginBottom: 6 }}>FOKUS</div>
              {[settings.smpFokus1, settings.smpFokus2, settings.smpFokus3].filter(Boolean).map((f, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}><span style={{ color: isDark ? '#a78bfa' : '#1a237e', fontSize: 10 }}>✦</span><span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{f}</span></div>)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${borderColor}`, borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", color: accentColor, fontSize: 12, marginBottom: 14, textAlign: 'center' }}>🏛️ FASILITAS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
            {[settings.fas1, settings.fas2, settings.fas3, settings.fas4, settings.fas5, settings.fas6].filter(Boolean).map((f, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderRadius: 8, border: `1px solid ${borderColor}` }}>
              <span style={{ color: accentColor, fontSize: 14, flexShrink: 0 }}>✦</span>
              <span style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)' }}>{f}</span>
            </div>)}
          </div>
        </div>
      </Sec>

      {/* BERITA */}
      <Sec id="berita" bg={isDark ? 'rgba(139,92,246,0.03)' : 'rgba(26,35,126,0.01)'}>
        <Title icon="📡" title={settings.secBeritaJudul} sub={settings.secBeritaSub} />
        {berita.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {berita.map(b => <div key={b.id} className="ch" onClick={() => setSelBerita(b)} style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
            {b.imageUrl && <img src={b.imageUrl} alt={b.judul} style={{ width: '100%', height: 140, objectFit: 'cover' }} />}
            <div style={{ padding: 16 }}>
              <span style={{ fontSize: 9, color: accentColor, fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5 }}>{b.kategori || 'BERITA'}</span>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: isDark ? 'white' : '#1a1a2e', margin: '5px 0', lineHeight: 1.4 }}>{b.judul}</h3>
              <p style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', lineHeight: 1.6, margin: 0 }}>{b.isi?.substring(0, 80)}...</p>
            </div>
          </div>)}
        </div> : <div style={{ textAlign: 'center', padding: 40, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', fontSize: 13 }}>Belum ada berita</div>}
      </Sec>

      {/* TESTIMONI */}
      {testimoni.length > 0 && (
        <Sec id="testimoni" bg={isDark ? 'rgba(37,211,102,0.02)' : 'rgba(26,35,126,0.01)'}>
          <Title icon="⭐" title="TESTIMONI" sub="Apa kata mereka tentang Bimbel Gemilang" />
          <Slider height={220} items={testimoni} render={t => (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'white', border: `1px solid ${borderColor}`, borderRadius: 16, padding: '22px 28px', maxWidth: 520, width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 10 }}>{'⭐'.repeat(t.bintang)}</div>
                <p style={{ fontSize: 14, color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)', lineHeight: 1.7, margin: '0 0 14px', fontStyle: 'italic' }}>"{t.isi}"</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  {t.photoUrl ? <img src={t.photoUrl} alt={t.nama} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentColor}` }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: isDark ? 'rgba(243,156,18,0.15)' : 'rgba(26,35,126,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>}
                  <div style={{ textAlign: 'left' }}><div style={{ fontSize: 13, fontWeight: 700, color: isDark ? 'white' : '#1a1a2e' }}>{t.nama}</div><div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>{t.kelas}</div></div>
                </div>
              </div>
            </div>
          )} />
        </Sec>
      )}

      {/* PENGHARGAAN */}
      {penghargaan.length > 0 && (
        <Sec id="penghargaan">
          <Title icon="🏆" title="PENGHARGAAN" sub="Pengakuan atas dedikasi kami" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {penghargaan.map(p => <div key={p.id} className="ch" style={{ background: isDark ? 'rgba(243,156,18,0.06)' : 'white', border: `1px solid ${isDark ? 'rgba(243,156,18,0.2)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 14, padding: 18, textAlign: 'center' }}>
              {p.imageUrl ? <img src={p.imageUrl} alt={p.judul} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', margin: '0 auto 10px', display: 'block', border: `2px solid ${isDark ? 'rgba(243,156,18,0.4)' : 'rgba(0,0,0,0.08)'}` }} /> : <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>}
              <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: accentColor, margin: '0 0 4px' }}>{p.judul}</h3>
              {p.tahun && <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginBottom: 4 }}>{p.tahun}</div>}
              {p.deskripsi && <p style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 1.6, margin: 0 }}>{p.deskripsi}</p>}
            </div>)}
          </div>
        </Sec>
      )}

      {/* KONTAK */}
      <Sec id="kontak">
        <Title icon="📡" title={settings.secKontakJudul} sub={settings.secKontakSub} />
        {contacts.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14, marginBottom: 28 }}>
          {contacts.map(c => <div key={c.id} className="ch" onClick={() => window.open(`https://wa.me/${c.wa}`, '_blank')} style={{ background: isDark ? 'rgba(37,211,102,0.07)' : 'white', border: `1px solid ${isDark ? 'rgba(37,211,102,0.2)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={c.photoUrl} alt={c.nama} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${isDark ? 'rgba(37,211,102,0.4)' : 'rgba(37,211,102,0.3)'}`, flexShrink: 0 }} />
            <div><div style={{ fontWeight: 700, fontSize: 13, color: isDark ? 'white' : '#1a1a2e' }}>{c.nama}</div><div style={{ fontSize: 11, color: '#25D366' }}>● Online · Chat WA</div></div>
          </div>)}
        </div> : <div style={{ textAlign: 'center', padding: 30, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', fontSize: 13 }}>Belum ada kontak</div>}
        {settings.mapsUrl && <div style={{ textAlign: 'center' }}>
          <button onClick={() => window.open(settings.mapsUrl, '_blank')} style={{ padding: '10px 24px', background: 'transparent', border: `1px solid ${isDark ? 'rgba(243,156,18,0.4)' : 'rgba(26,35,126,0.3)'}`, color: accentColor, borderRadius: 10, cursor: 'pointer', fontFamily: "'Orbitron',sans-serif", fontSize: 12, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(243,156,18,0.08)' : 'rgba(26,35,126,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>📍 LIHAT LOKASI DI MAPS</button>
        </div>}
      </Sec>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 2, borderTop: `1px solid ${borderColor}`, padding: '28px 20px', textAlign: 'center' }}>
        <img src="/logo-gemilang.png.png" alt="Logo" style={{ height: 40, marginBottom: 10, mixBlendMode: isDark ? 'screen' : 'normal', filter: isDark ? 'drop-shadow(0 0 8px rgba(243,156,18,0.3))' : 'none' }} onError={(e) => { e.target.style.display = 'none'; }} />
        {settings.footerTagline && <p style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 11, margin: '0 0 4px', fontStyle: 'italic' }}>{settings.footerTagline}</p>}
        {settings.alamat && <p style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontSize: 10, margin: '0 0 4px' }}>📍 {settings.alamat}</p>}
        <p style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)', fontSize: 9, margin: 0, fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5 }}>{settings.footerCopyright}</p>
        {isDark && <div style={{ position: 'absolute', right: 16, bottom: 8, opacity: 0.1, pointerEvents: 'none' }}><AstroFloat size={50} /></div>}
      </footer>

      {/* WA FLOATING */}
      {(contacts.length > 0 || settings.waDefault) && (
        <a href={waUrl} target="_blank" rel="noreferrer" style={{ position: 'fixed', bottom: 20, right: 20, width: 50, height: 50, background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, zIndex: 150, boxShadow: '0 4px 20px rgba(37,211,102,0.4)', animation: 'pulse 2.5s infinite', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>💬</a>
      )}

      {/* MODALS */}
      {showDaftar && <Modal contacts={contacts} onClose={() => setShowDaftar(false)} />}
      {selBerita && <div onClick={() => setSelBerita(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: isDark ? 'linear-gradient(135deg,#0d1a35,#0a0f1e)' : 'white', border: `1px solid ${isDark ? 'rgba(243,156,18,0.25)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 16, padding: 24, maxWidth: 540, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
          {selBerita.imageUrl && <img src={selBerita.imageUrl} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 14, objectFit: 'cover', maxHeight: 200 }} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><span style={{ fontSize: 9, color: accentColor, fontFamily: "'Orbitron',sans-serif", letterSpacing: 0.5 }}>{selBerita.kategori}</span><h2 style={{ fontFamily: "'Orbitron',sans-serif", color: accentColor, fontSize: 16, margin: '4px 0 0' }}>{selBerita.judul}</h2></div>
            <button onClick={() => setSelBerita(null)} style={{ background: 'none', border: 'none', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 20, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
          <p style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', lineHeight: 1.9, fontSize: 13, whiteSpace: 'pre-wrap', marginTop: 12 }}>{selBerita.isi}</p>
        </div>
      </div>}
    </div>
  );
}