import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";

/* ─── STAR FIELD ─────────────────────────────────────── */
const StarField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.6 + 0.2,
      o: Math.random(), speed: Math.random() * 0.4 + 0.1,
      twinkle: Math.random() * Math.PI * 2
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.twinkle += 0.025;
        const opacity = 0.35 + Math.sin(s.twinkle) * 0.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

/* ─── SHOOTING STARS ─────────────────────────────────── */
const ShootingStars = () => {
  const [shots, setShots] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      setShots(s => [...s.slice(-3), { id, x: Math.random() * 80 + 5, y: Math.random() * 40 }]);
      setTimeout(() => setShots(s => s.filter(x => x.id !== id)), 1200);
    }, 2800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      {shots.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: 120, height: 2,
          background: 'linear-gradient(90deg, rgba(255,220,80,0.9), transparent)',
          borderRadius: 2,
          animation: 'shoot 1.1s ease-out forwards',
          transform: 'rotate(-30deg)'
        }} />
      ))}
    </div>
  );
};

/* ─── FLOATING PARTICLES ─────────────────────────────── */
const Particles = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
    {Array.from({ length: 18 }).map((_, i) => (
      <div key={i} style={{
        position: 'absolute',
        left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
        width: Math.random() * 4 + 1, height: Math.random() * 4 + 1,
        borderRadius: '50%',
        background: i % 3 === 0 ? '#f39c12' : i % 3 === 1 ? '#8b5cf6' : '#fff',
        opacity: 0.15 + Math.random() * 0.2,
        animation: `drift ${8 + Math.random() * 12}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 8}s`
      }} />
    ))}
  </div>
);

/* ─── NAVBAR ─────────────────────────────────────────── */
const Navbar = ({ onDaftar }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const scrollTo = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(5,7,18,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(243,156,18,0.2)' : 'none',
      transition: 'all 0.4s', padding: '0 24px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <img src="/logo.png" alt="Gemilang" style={{ height: 44, filter: 'drop-shadow(0 0 8px rgba(243,156,18,0.5))' }} />
      {/* Desktop */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="nav-desktop">
        {[['beranda','Beranda'],['aktivitas','Aktivitas'],['pengajar','Pengajar'],['berita','Berita'],['tentang','Tentang'],['kontak','Kontak']].map(([id,label]) => (
          <button key={id} onClick={() => scrollTo(id)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)',
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            fontFamily: "'Orbitron', sans-serif", letterSpacing: 0.5,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.target.style.color='#f39c12'; e.target.style.background='rgba(243,156,18,0.1)'; }}
          onMouseLeave={e => { e.target.style.color='rgba(255,255,255,0.8)'; e.target.style.background='none'; }}>
            {label}
          </button>
        ))}
        <button onClick={onDaftar} style={{
          background: 'linear-gradient(135deg, #f39c12, #e67e22)',
          border: 'none', color: '#0a0a1a', padding: '9px 20px', borderRadius: 20,
          fontWeight: 700, fontSize: 13, cursor: 'pointer', marginLeft: 8,
          fontFamily: "'Orbitron', sans-serif",
          boxShadow: '0 0 16px rgba(243,156,18,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={e => { e.target.style.transform='scale(1.05)'; e.target.style.boxShadow='0 0 24px rgba(243,156,18,0.6)'; }}
        onMouseLeave={e => { e.target.style.transform='scale(1)'; e.target.style.boxShadow='0 0 16px rgba(243,156,18,0.4)'; }}>
          🚀 DAFTAR
        </button>
      </div>
      {/* Hamburger */}
      <button onClick={() => setMenuOpen(!menuOpen)} className="nav-mobile" style={{
        background: 'none', border: '1px solid rgba(243,156,18,0.4)', color: '#f39c12',
        width: 40, height: 40, borderRadius: 8, cursor: 'pointer', fontSize: 18
      }}>☰</button>
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, background: 'rgba(5,7,18,0.98)',
          backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(243,156,18,0.2)',
          padding: 20, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 99
        }}>
          {[['beranda','Beranda'],['aktivitas','Aktivitas'],['pengajar','Pengajar'],['berita','Berita'],['tentang','Tentang'],['kontak','Kontak']].map(([id,label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)',
              padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
              textAlign: 'left', fontSize: 15, fontFamily: "'Orbitron', sans-serif"
            }}>{label}</button>
          ))}
          <button onClick={() => { onDaftar(); setMenuOpen(false); }} style={{
            background: 'linear-gradient(135deg,#f39c12,#e67e22)', border: 'none',
            color: '#0a0a1a', padding: 14, borderRadius: 10, fontWeight: 700,
            fontSize: 15, cursor: 'pointer', marginTop: 8, fontFamily: "'Orbitron', sans-serif"
          }}>🚀 DAFTAR SEKARANG</button>
        </div>
      )}
    </nav>
  );
};

/* ─── AUTO SLIDER ────────────────────────────────────── */
const AutoSlider = ({ items, renderItem, height = 420 }) => {
  const [cur, setCur] = useState(0);
  const [drag, setDrag] = useState(null);
  const timerRef = useRef(null);
  const reset = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCur(c => (c + 1) % items.length), 4000);
  };
  useEffect(() => { reset(); return () => clearInterval(timerRef.current); }, [items.length]);
  const go = i => { setCur(i); reset(); };
  const onTouchStart = e => setDrag(e.touches[0].clientX);
  const onTouchEnd = e => {
    if (drag === null) return;
    const diff = drag - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length);
    setDrag(null);
  };
  if (!items.length) return null;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, height }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{
        display: 'flex', transition: 'transform 0.6s cubic-bezier(.77,0,.18,1)',
        transform: `translateX(-${cur * 100}%)`, height: '100%'
      }}>
        {items.map((item, i) => (
          <div key={i} style={{ minWidth: '100%', height: '100%' }}>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
      {/* Arrows */}
      {items.length > 1 && <>
        <button onClick={() => go((cur - 1 + items.length) % items.length)} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(243,156,18,0.4)',
          color: '#f39c12', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
          fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', transition: 'all 0.2s', zIndex: 2
        }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(243,156,18,0.3)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.6)'}>‹</button>
        <button onClick={() => go((cur + 1) % items.length)} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(243,156,18,0.4)',
          color: '#f39c12', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
          fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', transition: 'all 0.2s', zIndex: 2
        }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(243,156,18,0.3)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.6)'}>›</button>
      </>}
      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 2 }}>
        {items.map((_, i) => (
          <button key={i} onClick={() => go(i)} style={{
            width: i === cur ? 20 : 8, height: 8, borderRadius: 4,
            background: i === cur ? '#f39c12' : 'rgba(255,255,255,0.3)',
            border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s'
          }} />
        ))}
      </div>
    </div>
  );
};

/* ─── SECTION WRAPPER ────────────────────────────────── */
const Section = ({ id, children, style = {} }) => (
  <section id={id} style={{ position: 'relative', zIndex: 2, padding: '80px 20px', ...style }}>
    <div style={{ maxWidth: 960, margin: '0 auto' }}>{children}</div>
  </section>
);

const SectionTitle = ({ icon, title, sub }) => (
  <div style={{ textAlign: 'center', marginBottom: 48 }}>
    <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
    <h2 style={{
      fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(20px,4vw,32px)',
      color: '#f39c12', margin: '0 0 12px',
      textShadow: '0 0 20px rgba(243,156,18,0.5)'
    }}>{title}</h2>
    {sub && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>{sub}</p>}
    <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg,transparent,#f39c12,transparent)', margin: '16px auto 0' }} />
  </div>
);

/* ─── REGISTRATION MODAL ─────────────────────────────── */
const DaftarModal = ({ contacts, onClose }) => {
  const [form, setForm] = useState({ nama:'', hp:'', kelas:'', desa:'', ortu:'', mapel:[], catatan:'' });
  const mapelList = ['Matematika','IPA','IPS','Bhs. Indonesia','Bhs. Inggris','Semua Mapel'];
  const toggleMapel = m => setForm(f => ({ ...f, mapel: f.mapel.includes(m) ? f.mapel.filter(x=>x!==m) : [...f.mapel,m] }));
  const submit = () => {
    if (!form.nama || !form.hp || !form.kelas) { alert('Mohon isi nama, nomor HP, dan kelas.'); return; }
    const wa = contacts[0]?.wa || '6281234567890';
    const pesan = `*PENDAFTARAN BIMBEL GEMILANG* 🚀\n\n👤 Nama: ${form.nama}\n📞 HP/WA: ${form.hp}\n🏫 Kelas: ${form.kelas}\n🏡 Desa: ${form.desa||'-'}\n👨‍👩‍👦 Pekerjaan Ortu: ${form.ortu||'-'}\n📚 Mapel: ${form.mapel.join(', ')||'-'}\n📝 Catatan: ${form.catatan||'-'}\n\nMohon dikonfirmasi, terima kasih!`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(pesan)}`, '_blank');
    onClose();
  };
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background: 'linear-gradient(135deg,#0d1a35,#0a0f1e)',
        border: '1px solid rgba(243,156,18,0.35)', borderRadius: 20,
        padding: '32px 28px', width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 0 60px rgba(243,156,18,0.15)'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 style={{ fontFamily:"'Orbitron',sans-serif", color:'#f39c12', fontSize:18, margin:0 }}>🚀 Formulir Pendaftaran</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:22, cursor:'pointer' }}>✕</button>
        </div>
        {[
          { label:'Nama Lengkap Siswa *', key:'nama', placeholder:'Budi Santoso' },
          { label:'No. HP / WhatsApp *', key:'hp', placeholder:'08xxxxxxxxxx' },
          { label:'Alamat / Desa', key:'desa', placeholder:'Desa Sukamaju, Kec. Genteng' },
          { label:'Catatan (opsional)', key:'catatan', placeholder:'Pertanyaan atau info tambahan...' }
        ].map(({ label, key, placeholder }) => (
          <div key={key} style={{ marginBottom:16 }}>
            <label style={lbl}>{label}</label>
            <input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} style={inp} />
          </div>
        ))}
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Kelas / Jenjang *</label>
          <select value={form.kelas} onChange={e=>setForm(f=>({...f,kelas:e.target.value}))} style={inp}>
            <option value="">Pilih kelas...</option>
            {['SD Kelas 4','SD Kelas 5','SD Kelas 6','SMP Kelas 7','SMP Kelas 8','SMP Kelas 9','SMA Kelas 10','SMA Kelas 11','SMA Kelas 12'].map(k=><option key={k}>{k}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Pekerjaan Orang Tua</label>
          <select value={form.ortu} onChange={e=>setForm(f=>({...f,ortu:e.target.value}))} style={inp}>
            <option value="">Pilih...</option>
            {['Petani','Buruh','Pedagang','PNS/ASN','Wiraswasta','Lainnya'].map(k=><option key={k}>{k}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={lbl}>Mata Pelajaran yang Diminati</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
            {mapelList.map(m=>(
              <button key={m} onClick={()=>toggleMapel(m)} style={{
                padding:'6px 14px', borderRadius:20, fontSize:13, cursor:'pointer', fontFamily:'sans-serif',
                background: form.mapel.includes(m) ? 'rgba(243,156,18,0.25)' : 'rgba(255,255,255,0.06)',
                border: form.mapel.includes(m) ? '1px solid #f39c12' : '1px solid rgba(255,255,255,0.15)',
                color: form.mapel.includes(m) ? '#f39c12' : 'rgba(255,255,255,0.7)',
                transition:'all 0.2s'
              }}>{m}</button>
            ))}
          </div>
        </div>
        <button onClick={submit} style={{
          width:'100%', padding:15, background:'linear-gradient(135deg,#25D366,#1da851)',
          border:'none', borderRadius:12, color:'white', fontWeight:700,
          fontSize:16, cursor:'pointer', fontFamily:"'Orbitron',sans-serif",
          boxShadow:'0 0 20px rgba(37,211,102,0.3)', transition:'transform 0.2s'
        }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'}
        onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
          💬 Kirim via WhatsApp
        </button>
      </div>
    </div>
  );
};
const lbl = { display:'block', fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:'sans-serif', marginBottom:6, letterSpacing:0.5 };
const inp = { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, fontFamily:'sans-serif', outline:'none', boxSizing:'border-box' };

/* ─── MAIN COMPONENT ─────────────────────────────────── */
const PublicBlog = () => {
  const [blogContent, setBlogContent] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [berita, setBerita] = useState([]);
  const [settings, setSettings] = useState({ heroTitle:'GEMILANG', heroSub:'Eksplorasi Ilmu di Galaksi Pengetahuan', visiMisi:'', mapsUrl:'', igUrl:'', tiktokUrl:'' });
  const [showDaftar, setShowDaftar] = useState(false);
  const [selectedBerita, setSelectedBerita] = useState(null);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db,'web_blog'), orderBy('createdAt','desc')), s => setBlogContent(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2 = onSnapshot(collection(db,'web_teachers_gallery'), s => setTeachers(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u3 = onSnapshot(collection(db,'web_contacts'), s => setContacts(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u4 = onSnapshot(query(collection(db,'web_berita'), orderBy('createdAt','desc')), s => setBerita(s.docs.map(d=>({id:d.id,...d.data()}))));
    const fetchSettings = async () => { const s = await getDoc(doc(db,'web_settings','general')); if(s.exists()) setSettings(s.data()); };
    fetchSettings();
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const getEmbedUrl = item => {
    if (item.type === 'tiktok') {
      const parts = item.url.split('/video/');
      return parts.length > 1 ? `https://www.tiktok.com/embed/v2/${parts[1].split('?')[0]}` : null;
    }
    return null;
  };

  return (
    <div style={{ background:'#05070f', color:'white', minHeight:'100vh', fontFamily:"'Nunito', sans-serif", overflowX:'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shoot { 0%{opacity:1;transform:rotate(-30deg) translateX(0)} 100%{opacity:0;transform:rotate(-30deg) translateX(180px) translateY(80px)} }
        @keyframes drift { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-20px) translateX(10px)} 66%{transform:translateY(10px) translateX(-10px)} }
        @keyframes pulse-gold { 0%,100%{box-shadow:0 0 0 0 rgba(243,156,18,0.4)} 50%{box-shadow:0 0 0 12px rgba(243,156,18,0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(60px) rotate(0deg)} to{transform:rotate(360deg) translateX(60px) rotate(-360deg)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#05070f; }
        ::-webkit-scrollbar-thumb { background:#f39c12; border-radius:3px; }
        .nav-mobile { display:none; }
        @media(max-width:768px) { .nav-desktop{display:none!important} .nav-mobile{display:flex!important} }
        .card-hover { transition:transform 0.3s, box-shadow 0.3s; }
        .card-hover:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(243,156,18,0.15)!important; }
        input, select, textarea { background:rgba(255,255,255,0.07)!important; color:white!important; }
        input:focus, select:focus, textarea:focus { border-color:rgba(243,156,18,0.6)!important; outline:none; }
      `}</style>

      <StarField />
      <ShootingStars />
      <Particles />
      <Navbar onDaftar={() => setShowDaftar(true)} />

      {/* ── HERO ── */}
      <section id="beranda" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'80px 20px 60px', position:'relative', zIndex:2 }}>
        <div style={{ animation:'fadeUp 1s ease both', animationDelay:'0.2s' }}>
          <img src="/logo.png" alt="Logo" style={{ height:100, marginBottom:24, filter:'drop-shadow(0 0 24px rgba(243,156,18,0.6))', animation:'float 3s ease-in-out infinite' }} />
        </div>
        <div style={{ animation:'fadeUp 1s ease both', animationDelay:'0.4s' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(243,156,18,0.1)', border:'1px solid rgba(243,156,18,0.3)', borderRadius:20, padding:'6px 18px', marginBottom:20, fontSize:13, color:'#f39c12', fontFamily:"'Orbitron',sans-serif" }}>
            ✦ BIMBINGAN BELAJAR TERPERCAYA
          </div>
          <h1 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:'clamp(32px,8vw,72px)', fontWeight:900, margin:'0 0 16px', lineHeight:1.1 }}>
            SELAMAT DATANG DI<br />
            <span style={{ color:'#f39c12', textShadow:'0 0 30px rgba(243,156,18,0.6)' }}>{settings.heroTitle}</span>
          </h1>
          <p style={{ fontSize:'clamp(14px,2vw,18px)', color:'rgba(255,255,255,0.6)', maxWidth:540, margin:'0 auto 36px', lineHeight:1.8 }}>
            {settings.heroSub}
          </p>
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', animation:'fadeUp 1s ease both', animationDelay:'0.6s' }}>
          <button onClick={() => setShowDaftar(true)} style={{
            background:'linear-gradient(135deg,#f39c12,#e67e22)', border:'none', color:'#0a0a1a',
            padding:'14px 32px', borderRadius:30, fontWeight:700, fontSize:16, cursor:'pointer',
            fontFamily:"'Orbitron',sans-serif", boxShadow:'0 0 24px rgba(243,156,18,0.45)',
            animation:'pulse-gold 2s infinite', transition:'transform 0.2s'
          }}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'}
          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
            🚀 DAFTAR SEKARANG
          </button>
          <button onClick={() => document.getElementById('aktivitas')?.scrollIntoView({behavior:'smooth'})} style={{
            background:'transparent', border:'1px solid rgba(243,156,18,0.5)', color:'#f39c12',
            padding:'14px 32px', borderRadius:30, fontWeight:600, fontSize:15, cursor:'pointer',
            fontFamily:"'Orbitron',sans-serif", transition:'all 0.2s'
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(243,156,18,0.1)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; }}>
            ▶ LIHAT AKTIVITAS
          </button>
        </div>
        {/* Stats */}
        <div style={{ display:'flex', gap:32, marginTop:64, flexWrap:'wrap', justifyContent:'center', animation:'fadeUp 1s ease both', animationDelay:'0.8s' }}>
          {[['🌟','100+','Siswa Aktif'],['🏆','3+','Tahun Berpengalaman'],['📚','SD–SMA','Jenjang Tersedia'],['⭐','95%','Nilai Naik']].map(([icon,num,label])=>(
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:24 }}>{icon}</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:700, color:'#f39c12' }}>{num}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
        {/* Scroll hint */}
        <div style={{ position:'absolute', bottom:30, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:0.5 }}>
          <div style={{ fontSize:11, fontFamily:"'Orbitron',sans-serif", letterSpacing:2, color:'rgba(255,255,255,0.5)' }}>SCROLL</div>
          <div style={{ width:1, height:40, background:'linear-gradient(180deg,rgba(243,156,18,0.6),transparent)' }} />
        </div>
      </section>

      {/* ── AKTIVITAS (VIDEO/BLOG SLIDER) ── */}
      <Section id="aktivitas">
        <SectionTitle icon="🎬" title="MISI AKTIVITAS" sub="Saksikan langsung kegiatan seru di Bimbel Gemilang" />
        {blogContent.length > 0 ? (
          <AutoSlider items={blogContent} height={440} renderItem={(item) => {
            const embed = getEmbedUrl(item);
            return (
              <div style={{ height:'100%', position:'relative', cursor:'pointer', borderRadius:20, overflow:'hidden', background:'#0d1a2e' }}
                onClick={() => window.open(item.url,'_blank')}>
                {embed ? (
                  <iframe src={embed} style={{ width:'100%', height:'100%', border:'none', pointerEvents:'none' }} title="Video" />
                ) : (
                  <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0d1a35,#1a0a2e)', gap:16 }}>
                    <div style={{ width:70, height:70, background:'rgba(243,156,18,0.15)', border:'2px solid #f39c12', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>▶</div>
                    <p style={{ color:'rgba(255,255,255,0.7)', fontSize:15, textAlign:'center', padding:'0 40px' }}>{item.caption}</p>
                    <span style={{ fontSize:12, color:'rgba(243,156,18,0.7)', fontFamily:"'Orbitron',sans-serif" }}>Klik untuk menonton →</span>
                  </div>
                )}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'40px 24px 20px', background:'linear-gradient(transparent,rgba(0,0,0,0.85))' }}>
                  <span style={{ background: item.type==='tiktok'?'rgba(0,0,0,0.7)':'linear-gradient(135deg,#833ab4,#fd1d1d)', padding:'3px 12px', borderRadius:10, fontSize:11, fontFamily:"'Orbitron',sans-serif" }}>
                    {item.type==='tiktok'?'♪ TikTok':'◻ Instagram'}
                  </span>
                  <p style={{ margin:'8px 0 0', fontSize:15, fontWeight:600, color:'white' }}>{item.caption}</p>
                </div>
              </div>
            );
          }} />
        ) : (
          <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,0.3)', fontFamily:"'Orbitron',sans-serif" }}>Belum ada konten aktivitas</div>
        )}
        {/* Sosmed buttons */}
        <div style={{ display:'flex', gap:14, justifyContent:'center', marginTop:28, flexWrap:'wrap' }}>
          {settings.tiktokUrl && <button onClick={()=>window.open(settings.tiktokUrl,'_blank')} style={{ padding:'12px 24px', background:'#010101', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:10, cursor:'pointer', fontFamily:"'Orbitron',sans-serif", fontSize:13, display:'flex', alignItems:'center', gap:8, transition:'transform 0.2s' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>♪ TikTok Kami</button>}
          {settings.igUrl && <button onClick={()=>window.open(settings.igUrl,'_blank')} style={{ padding:'12px 24px', background:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border:'none', color:'white', borderRadius:10, cursor:'pointer', fontFamily:"'Orbitron',sans-serif", fontSize:13, display:'flex', alignItems:'center', gap:8, transition:'transform 0.2s' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>◻ Instagram Kami</button>}
        </div>
      </Section>

      {/* ── PENGAJAR ── */}
      <Section id="pengajar" style={{ background:'rgba(243,156,18,0.03)' }}>
        <SectionTitle icon="👨‍🚀" title="ASTRONOT KAMI" sub="Para pendidik berpengalaman yang siap membimbingmu" />
        {teachers.length > 0 ? (
          <AutoSlider items={teachers} height={320} renderItem={(t) => (
            <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center', padding:24 }}>
                <div style={{ position:'relative', display:'inline-block', marginBottom:16 }}>
                  <img src={t.photoUrl} alt={t.nama} style={{ width:120, height:120, borderRadius:'50%', objectFit:'cover', border:'3px solid #f39c12', boxShadow:'0 0 24px rgba(243,156,18,0.4)' }} />
                  <div style={{ position:'absolute', inset:-6, borderRadius:'50%', border:'1px solid rgba(243,156,18,0.3)', animation:'orbit 8s linear infinite' }}>
                    <div style={{ width:8, height:8, background:'#f39c12', borderRadius:'50%', position:'absolute', top:-4, left:'50%', transform:'translateX(-50%)' }} />
                  </div>
                </div>
                <h3 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, color:'white', margin:'0 0 6px' }}>{t.nama}</h3>
                <p style={{ color:'rgba(243,156,18,0.8)', fontSize:14, margin:'0 0 12px', fontFamily:'sans-serif' }}>{t.spesialisasi}</p>
                {t.wa && <button onClick={()=>window.open(`https://wa.me/${t.wa}`,'_blank')} style={{ padding:'8px 20px', background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.4)', color:'#25D366', borderRadius:20, cursor:'pointer', fontSize:12, fontFamily:"'Orbitron',sans-serif" }}>💬 Hubungi</button>}
              </div>
            </div>
          )} />
        ) : (
          <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,0.3)', fontFamily:"'Orbitron',sans-serif" }}>Belum ada data pengajar</div>
        )}
      </Section>

      {/* ── BERITA ── */}
      <Section id="berita">
        <SectionTitle icon="📡" title="SINYAL BERITA" sub="Informasi terbaru dari markas Bimbel Gemilang" />
        {berita.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
            {berita.map(b => (
              <div key={b.id} className="card-hover" onClick={()=>setSelectedBerita(b)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, overflow:'hidden', cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
                {b.imageUrl && <img src={b.imageUrl} alt={b.judul} style={{ width:'100%', height:160, objectFit:'cover' }} />}
                <div style={{ padding:18 }}>
                  <span style={{ fontSize:11, color:'#f39c12', fontFamily:"'Orbitron',sans-serif", letterSpacing:1 }}>{b.kategori || 'BERITA'}</span>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'white', margin:'8px 0 8px', lineHeight:1.4 }}>{b.judul}</h3>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6, margin:0 }}>{b.isi?.substring(0,100)}...</p>
                  <div style={{ marginTop:12, fontSize:12, color:'rgba(255,255,255,0.3)' }}>{b.createdAt?.toDate?.()?.toLocaleDateString('id-ID') || ''}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,0.3)', fontFamily:"'Orbitron',sans-serif" }}>Belum ada berita</div>
        )}
      </Section>

      {/* ── TENTANG ── */}
      <Section id="tentang" style={{ background:'rgba(139,92,246,0.04)' }}>
        <SectionTitle icon="🌌" title="TENTANG KAMI" sub="Misi dan visi Bimbel Gemilang" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          <div className="card-hover" style={{ background:'rgba(243,156,18,0.07)', border:'1px solid rgba(243,156,18,0.2)', borderRadius:16, padding:28 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🎯</div>
            <h3 style={{ fontFamily:"'Orbitron',sans-serif", color:'#f39c12', fontSize:16, margin:'0 0 12px' }}>VISI & MISI</h3>
            <p style={{ color:'rgba(255,255,255,0.65)', lineHeight:1.8, fontSize:14 }}>{settings.visiMisi || 'Menjadi pusat pembelajaran terbaik yang melahirkan generasi gemilang berprestasi dari desa.'}</p>
          </div>
          {[['📚','Materi Lengkap','SD hingga SMA semua mata pelajaran tersedia dengan metode modern.'],['👨‍🏫','Pengajar Berdedikasi','Tenaga pendidik berpengalaman dan berkomitmen mendampingi setiap siswa.'],['💰','Biaya Terjangkau','Harga bersahabat tanpa kompromi kualitas, cocok untuk semua kalangan.']].map(([icon,title,desc])=>(
            <div key={title} className="card-hover" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>{icon}</div>
              <h3 style={{ fontFamily:"'Orbitron',sans-serif", color:'white', fontSize:15, margin:'0 0 10px' }}>{title}</h3>
              <p style={{ color:'rgba(255,255,255,0.55)', lineHeight:1.8, fontSize:14 }}>{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── KONTAK ── */}
      <Section id="kontak">
        <SectionTitle icon="📡" title="HUBUNGI STASIUN BUMI" sub="Tim kami siap membantu kamu" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:18, marginBottom:40 }}>
          {contacts.map(c => (
            <div key={c.id} className="card-hover" onClick={()=>window.open(`https://wa.me/${c.wa}`,'_blank')} style={{ background:'rgba(37,211,102,0.07)', border:'1px solid rgba(37,211,102,0.2)', borderRadius:16, padding:20, cursor:'pointer', display:'flex', alignItems:'center', gap:16 }}>
              <img src={c.photoUrl} alt={c.nama} style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(37,211,102,0.5)' }} />
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{c.nama}</div>
                <div style={{ fontSize:12, color:'#25D366', marginTop:2 }}>● Online · Klik untuk Chat</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{c.jabatan || 'Admin'}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Maps */}
        {settings.mapsUrl && (
          <div style={{ textAlign:'center' }}>
            <button onClick={()=>window.open(settings.mapsUrl,'_blank')} style={{ padding:'14px 32px', background:'transparent', border:'1px solid rgba(243,156,18,0.5)', color:'#f39c12', borderRadius:12, cursor:'pointer', fontFamily:"'Orbitron',sans-serif", fontSize:14, transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(243,156,18,0.1)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              📍 LIHAT LOKASI DI MAPS
            </button>
          </div>
        )}
      </Section>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:2, borderTop:'1px solid rgba(255,255,255,0.08)', padding:'32px 20px', textAlign:'center' }}>
        <img src="/logo.png" alt="Logo" style={{ height:48, marginBottom:12, filter:'drop-shadow(0 0 8px rgba(243,156,18,0.4))' }} />
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:0, fontFamily:"'Orbitron',sans-serif", letterSpacing:1 }}>© {new Date().getFullYear()} BIMBEL GEMILANG · ALL RIGHTS RESERVED</p>
      </footer>

      {/* ── WA FLOATING ── */}
      <button onClick={()=>contacts[0]&&window.open(`https://wa.me/${contacts[0].wa}`,'_blank')} style={{
        position:'fixed', bottom:24, right:24, width:56, height:56, background:'#25D366',
        border:'none', borderRadius:'50%', cursor:'pointer', zIndex:150, fontSize:24,
        boxShadow:'0 4px 20px rgba(37,211,102,0.5)', animation:'pulse-gold 2s infinite',
        display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.2s'
      }}
      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>💬</button>

      {/* ── MODALS ── */}
      {showDaftar && <DaftarModal contacts={contacts} onClose={()=>setShowDaftar(false)} />}
      {selectedBerita && (
        <div onClick={()=>setSelectedBerita(null)} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'linear-gradient(135deg,#0d1a35,#0a0f1e)', border:'1px solid rgba(243,156,18,0.3)', borderRadius:20, padding:28, maxWidth:580, width:'100%', maxHeight:'85vh', overflowY:'auto' }}>
            {selectedBerita.imageUrl && <img src={selectedBerita.imageUrl} alt="" style={{ width:'100%', borderRadius:12, marginBottom:16, objectFit:'cover', maxHeight:200 }} />}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <h2 style={{ fontFamily:"'Orbitron',sans-serif", color:'#f39c12', fontSize:18, margin:'0 0 12px', flex:1 }}>{selectedBerita.judul}</h2>
              <button onClick={()=>setSelectedBerita(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:22, cursor:'pointer', marginLeft:12 }}>✕</button>
            </div>
            <p style={{ color:'rgba(255,255,255,0.75)', lineHeight:1.9, fontSize:14, fontFamily:'sans-serif' }}>{selectedBerita.isi}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBlog;