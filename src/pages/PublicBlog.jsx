import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { Rocket, MapPin, MessageCircle, Users, ChevronRight, Star, Play } from 'lucide-react';

const PublicBlog = () => {
  const [blogContent, setBlogContent] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [settings, setSettings] = useState({ 
    heroTitle: 'GEMILANG', 
    visiMisi: '', 
    mapsUrl: 'https://maps.google.com' 
  });

  useEffect(() => {
    const unsubBlog = onSnapshot(query(collection(db, "web_blog"), orderBy("createdAt", "desc")), (snap) => {
      setBlogContent(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTeachers = onSnapshot(collection(db, "web_teachers_gallery"), (snap) => {
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubContacts = onSnapshot(collection(db, "web_contacts"), (snap) => {
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const fetchSettings = async () => {
      const s = await getDoc(doc(db, "web_settings", "general"));
      if (s.exists()) setSettings(s.data());
    };
    fetchSettings();
    return () => { unsubBlog(); unsubTeachers(); unsubContacts(); };
  }, []);

  // Fungsi Deteksi Video ID
  const getEmbedUrl = (item) => {
    if (item.type === 'tiktok') {
      // Jika link pendek vt.tiktok, iframe sering gagal. Kita paksa redirect saat klik.
      if (item.url.includes('vt.tiktok.com')) return null; 
      const parts = item.url.split('/video/');
      return parts.length > 1 ? `https://www.tiktok.com/embed/v2/${parts[1].split('?')[0]}` : null;
    }
    return null;
  };

  const handleDaftar = () => {
    // Arahkan ke WhatsApp Admin pertama sebagai jalur pendaftaran tercepat
    if (contacts.length > 0) {
      const waUrl = `https://wa.me/${contacts[0].wa}?text=Halo%20Gemilang!%20Saya%20ingin%20daftar%20bimbel.`;
      window.open(waUrl, '_blank');
    } else {
      alert("Maaf, stasiun pendaftaran sedang offline. Coba lagi nanti!");
    }
  };

  return (
    <div style={styles.container}>
      {/* HERO */}
      <section style={styles.sectionHero}>
        <div style={styles.floatingAstronaut}>👨‍🚀</div>
        <h1 style={styles.title}>SELAMAT DATANG DI <span style={{ color: '#f39c12' }}>{settings.heroTitle}</span></h1>
        <p style={styles.subtitle}>{settings.visiMisi || "Eksplorasi Ilmu di Galaksi Gemilang"}</p>
        <button style={styles.btnDaftar} onClick={handleDaftar}>
          DAFTAR SEKARANG <ChevronRight size={20} />
        </button>
      </section>

      {/* AKTIVITAS (VIDEO/FOTO) */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><Star color="#f39c12" /> Misi Aktivitas Kami</h2>
        <div style={styles.horizontalScroll}>
          {blogContent.map(item => {
            const embed = getEmbedUrl(item);
            return (
              <div key={item.id} style={styles.mediaCard} onClick={() => window.open(item.url, '_blank')}>
                {embed ? (
                  <iframe src={embed} style={styles.iframe} title="TikTok" />
                ) : (
                  <div style={styles.placeholderVideo}>
                    <Play size={40} />
                    <p>Klik untuk Lihat Video</p>
                    <small style={{fontSize: 9}}>{item.caption}</small>
                  </div>
                )}
                <div style={styles.overlayText}>{item.caption}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TENAGA PENDIDIK */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><Users color="#f39c12" /> Commander & Crew</h2>
        <div style={styles.horizontalScroll}>
          {teachers.map(t => (
            <div key={t.id} style={styles.teacherCard}>
              <img src={t.photoUrl} alt={t.nama} style={styles.teacherImg} />
              <h4 style={{margin: '10px 0 5px'}}>{t.nama}</h4>
              <p style={{fontSize: 12, color: '#bdc3c7'}}>{t.spesialisasi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KONTAK ADMIN */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><MessageCircle color="#f39c12" /> Hubungi Stasiun Bumi</h2>
        <div style={styles.contactGrid}>
          {contacts.map(c => (
            <div key={c.id} style={styles.contactCard} onClick={() => window.open(`https://wa.me/${c.wa}`)}>
              <img src={c.photoUrl} style={styles.avatar} alt="Admin" />
              <div>
                <div style={{fontWeight: 'bold'}}>{c.nama}</div>
                <div style={{fontSize: 12, color: '#2ecc71'}}>• Online (Klik untuk Chat)</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER & MAPS */}
      <footer style={styles.footer}>
        <button style={styles.btnMaps} onClick={() => window.open(settings.mapsUrl, '_blank')}>
          <MapPin size={18} /> LIHAT LOKASI BIMBEL DI MAPS
        </button>
        <p style={{marginTop: 20, fontSize: 11, color: '#555'}}>© 2026 Bimbel Gemilang Space System</p>
      </footer>
    </div>
  );
};

const styles = {
  container: { background: '#05070a', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' },
  sectionHero: { height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 20, background: 'radial-gradient(circle at center, #1a2a6c 0%, #05070a 100%)' },
  floatingAstronaut: { fontSize: 60, marginBottom: 20, animation: 'float 3s infinite ease-in-out' },
  title: { fontSize: '2.5rem', fontWeight: 'bold', margin: 0 },
  subtitle: { color: '#bdc3c7', marginTop: 10, maxWidth: 500 },
  btnDaftar: { marginTop: 30, padding: '15px 35px', background: '#f39c12', border: 'none', borderRadius: 50, color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16 },
  section: { padding: '40px 20px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.4rem', marginBottom: 20 },
  horizontalScroll: { display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 15 },
  mediaCard: { minWidth: 260, height: 400, background: '#161b22', borderRadius: 15, overflow: 'hidden', position: 'relative', cursor: 'pointer' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  placeholderVideo: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#1c232b', color: '#f39c12', textAlign: 'center', padding: 20 },
  overlayText: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', fontSize: 12 },
  teacherCard: { minWidth: 160, textAlign: 'center' },
  teacherImg: { width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f39c12' },
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 15 },
  contactCard: { display: 'flex', alignItems: 'center', gap: 15, padding: 15, background: '#161b22', borderRadius: 12, cursor: 'pointer' },
  avatar: { width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' },
  footer: { padding: 40, textAlign: 'center', borderTop: '1px solid #161b22' },
  btnMaps: { padding: '12px 25px', background: 'transparent', border: '1px solid #f39c12', color: '#f39c12', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }
};

export default PublicBlog;