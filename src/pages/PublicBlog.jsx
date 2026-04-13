import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Rocket, MapPin, MessageCircle, Users, BookOpen, Star, ChevronRight } from 'lucide-react';

const PublicBlog = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [blogContent, setBlogContent] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [webSettings, setWebSettings] = useState({
    visiMisi: "Menjadi pusat eksplorasi ilmu pengetahuan terbaik.",
    mapsUrl: "",
    heroTitle: "Bimbel Gemilang"
  });

  useEffect(() => {
    // Real-time listener untuk semua data (Multitasking)
    const unsubBlog = onSnapshot(query(collection(db, "web_blog"), orderBy("createdAt", "desc")), (snap) => {
      setBlogContent(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const unsubTeachers = onSnapshot(collection(db, "web_teachers_gallery"), (snap) => {
      setTeachers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const unsubContacts = onSnapshot(collection(db, "web_contacts"), (snap) => {
      setContacts(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubBlog(); unsubTeachers(); unsubContacts(); };
  }, []);

  return (
    <div style={styles.container}>
      {/* 1. HERO SECTION (Tampilan Depan) */}
      <section style={styles.sectionHero}>
        <div style={styles.floatingAstronaut}>👨‍🚀</div>
        <h1 style={styles.glitchText}>{webSettings.heroTitle}</h1>
        <p>Eksplorasi Ilmu di Galaksi Gemilang</p>
        <button style={styles.btnDaftar} onClick={() => window.location.href='#daftar'}>
          DAFTAR SEKARANG <ChevronRight size={18} />
        </button>
      </section>

      {/* 2. VIDEO AKTIVITAS (Auto-Slider) */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><Rocket size={20}/> Aktivitas Astronot Gemilang</h2>
        <div style={styles.horizontalScroll}>
          {blogContent.map(item => (
            <div key={item.id} style={styles.mediaCard}>
               {/* Logika Embed TikTok/IG seperti sebelumnya */}
               <iframe src={`https://www.tiktok.com/embed/v2/${item.url.split('/video/')[1]}`} style={styles.iframe} />
            </div>
          ))}
        </div>
      </section>

      {/* 3. TENAGA PENDIDIK (Tim Kami) */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><Users size={20}/> Commander & Crew (Pengajar)</h2>
        <div style={styles.horizontalScroll}>
          {teachers.map(t => (
            <div key={t.id} style={styles.teacherCard}>
              <img src={t.photoUrl} style={styles.teacherImg} alt={t.nama} />
              <h4>{t.nama}</h4>
              <p>{t.spesialisasi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HUBUNGI KAMI (Contact Person) */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><MessageCircle size={20}/> Hubungi Stasiun Bumi</h2>
        <div style={styles.contactGrid}>
          {contacts.map(c => (
            <div key={c.id} style={styles.contactCard} onClick={() => window.open(`https://wa.me/${c.wa}`)}>
              <img src={c.photoUrl} style={styles.contactAvatar} />
              <div>
                <strong>{c.nama}</strong>
                <p>Klik untuk Chat</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ALAMAT (Maps) */}
      <footer style={styles.footer}>
        <div style={styles.mapsCard}>
           <h3 style={{display:'flex', alignItems:'center', gap:10}}><MapPin/> Lokasi Orbit Kami</h3>
           <button onClick={() => window.open(webSettings.mapsUrl)} style={styles.btnMaps}>Buka Google Maps</button>
        </div>
      </footer>
    </div>
  );
};

// CSS-in-JS untuk kemudahan copy-paste
const styles = {
  container: { background: '#05070a', color: 'white', minHeight: '100vh', overflowX: 'hidden' },
  sectionHero: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'radial-gradient(circle, #1a2a6c, #b21f1f, #fdbb2d)', position: 'relative' },
  floatingAstronaut: { fontSize: '80px', animation: 'float 3s infinite ease-in-out', marginBottom: 20 },
  glitchText: { fontSize: '3rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '5px' },
  btnDaftar: { padding: '15px 40px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginTop: 30 },
  section: { padding: '60px 20px' },
  sectionTitle: { fontSize: '1.5rem', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: 15, color: '#f39c12' },
  horizontalScroll: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none' },
  mediaCard: { minWidth: '300px', height: '500px', background: '#161b22', borderRadius: '20px', overflow: 'hidden' },
  teacherCard: { minWidth: '180px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px' },
  teacherImg: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: 15, border: '3px solid #f39c12' },
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' },
  contactCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#1c1f26', borderRadius: '15px', cursor: 'pointer' },
  contactAvatar: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' },
  footer: { padding: '40px 20px', background: '#0b0e14' },
  btnMaps: { width: '100%', padding: '12px', background: 'transparent', border: '1px solid #f39c12', color: '#f39c12', borderRadius: '10px', cursor: 'pointer', marginTop: 15 }
};

export default PublicBlog;