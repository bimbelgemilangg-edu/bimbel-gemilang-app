import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Rocket, Star, Monitor, Smartphone, PlayCircle, ExternalLink } from 'lucide-react';

const PublicBlog = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "web_blog"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContent(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper untuk mengekstrak ID TikTok dari URL
  const getTikTokEmbed = (url) => {
    const match = url.match(/video\/(\d+)/);
    return match ? match[1] : null;
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND STARS DECORATION */}
      <div style={styles.stars}></div>

      {/* HERO SECTION */}
      <header style={styles.hero}>
        <Rocket size={48} color="#f39c12" style={styles.rocketIcon} />
        <h1 style={styles.title}>SELAMAT DATANG DI <span style={{ color: '#f39c12' }}>GEMILANG</span></h1>
        <p style={styles.subtitle}>Eksplorasi Tanpa Batas, Menembus Cakrawala Ilmu Pengetahuan</p>
        <div style={styles.badgeContainer}>
            <span style={styles.badge}><Star size={12} /> Galeri Aktivitas Luar Angkasa</span>
        </div>
      </header>

      {/* CONTENT GRID */}
      <main style={styles.main}>
        {loading ? (
          <div style={styles.loader}>Menghubungkan ke Stasiun Luar Angkasa...</div>
        ) : (
          <div style={styles.grid}>
            {content.map((item) => (
              <div key={item.id} style={styles.card}>
                <div style={styles.mediaContainer}>
                  {item.type === 'tiktok' ? (
                    <div style={styles.videoWrapper} onClick={() => window.open(item.url, '_blank')}>
                        <div style={styles.overlay}>
                            <PlayCircle size={40} color="white" />
                            <p>Tonton di TikTok</p>
                        </div>
                        <iframe
                            src={`https://www.tiktok.com/embed/v2/${getTikTokEmbed(item.url)}`}
                            style={styles.iframe}
                            title="TikTok Preview"
                        />
                    </div>
                  ) : item.type === 'instagram' ? (
                    <div style={styles.placeholderMedia} onClick={() => window.open(item.url, '_blank')}>
                        <ExternalLink size={30} />
                        <p>Lihat di Instagram</p>
                    </div>
                  ) : (
                    <img src={item.url} alt={item.caption} style={styles.image} />
                  )}
                </div>
                <div style={styles.cardInfo}>
                  <p style={styles.caption}>{item.caption}</p>
                  <small style={styles.date}>Misi Selesai: {item.createdAt?.toDate().toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>© 2026 Bimbel Gemilang - Menyiapkan Astronot Masa Depan</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#0b0e14', // Space Dark
    minHeight: '100vh',
    color: '#ecf0f1',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    padding: '20px',
    position: 'relative',
    overflowX: 'hidden'
  },
  stars: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'radial-gradient(white, rgba(255,255,255,0.2) 2px, transparent 40px)',
    backgroundSize: '100px 100px',
    opacity: 0.1,
    zIndex: 0
  },
  hero: {
    textAlign: 'center',
    padding: '60px 20px',
    position: 'relative',
    zIndex: 1
  },
  title: { fontSize: '2.5rem', marginBottom: '10px', fontWeight: '800', letterSpacing: '2px' },
  subtitle: { fontSize: '1.1rem', color: '#bdc3c7', maxWidth: '600px', margin: '0 auto 20px' },
  badgeContainer: { display: 'flex', justifyContent: 'center', gap: '10px' },
  badge: { 
    backgroundColor: 'rgba(243, 156, 18, 0.2)', 
    color: '#f39c12', 
    padding: '5px 15px', 
    borderRadius: '20px', 
    fontSize: '12px',
    border: '1px solid #f39c12',
    display: 'flex', alignItems: 'center', gap: '5px'
  },
  main: { position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // OTOMATIS RESPONSIVE
    gap: '25px',
    padding: '20px 0'
  },
  card: {
    backgroundColor: '#161b22',
    borderRadius: '15px',
    overflow: 'hidden',
    border: '1px solid #30363d',
    transition: 'transform 0.3s ease',
    cursor: 'pointer'
  },
  mediaContainer: { width: '100%', height: '400px', backgroundColor: '#000', position: 'relative' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  videoWrapper: { width: '100%', height: '100%', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none', pointerEvents: 'none' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    opacity: 0.8
  },
  placeholderMedia: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center', gap: '10px', color: '#f39c12'
  },
  cardInfo: { padding: '15px' },
  caption: { fontSize: '14px', marginBottom: '10px', lineHeight: '1.4' },
  date: { fontSize: '10px', color: '#8b949e' },
  loader: { textAlign: 'center', padding: '50px', color: '#f39c12' },
  footer: { textAlign: 'center', padding: '40px', color: '#484f58', fontSize: '12px' },
  rocketIcon: { marginBottom: '20px', filter: 'drop-shadow(0 0 10px #f39c12)' }
};

export default PublicBlog;