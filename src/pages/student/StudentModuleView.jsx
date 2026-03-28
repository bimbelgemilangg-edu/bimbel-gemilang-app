import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Clock, BookOpen, FileText, PlayCircle, Send, ChevronRight, ChevronLeft } from 'lucide-react';

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [modul, setModul] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      const docRef = doc(db, "bimbel_modul", modulId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setModul(snap.data());
      setLoading(false);
    };
    fetchDetail();
  }, [modulId]);

  if (loading) return <div style={st.loader}>Menyiapkan materi cerdas...</div>;

  return (
    <div style={st.container}>
      {/* HEADER DENGAN COVER IMAGE */}
      <div style={st.heroSection}>
        <button onClick={onBack} style={st.backFloating}><ArrowLeft size={20} /> Kembali</button>
        <img 
          src={modul?.coverUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000"} 
          style={st.heroImg} 
          alt="Cover" 
        />
        <div style={st.heroOverlay}>
          <span style={st.subjectBadge}>{modul?.subject || "Materi Umum"}</span>
          <h1 style={st.mainTitle}>{modul?.title}</h1>
          <div style={st.metaHero}>
            <div style={st.metaItem}><Clock size={16}/> {modul?.deadline || "Tanpa Batas"}</div>
            <div style={st.metaItem}><BookOpen size={16}/> {modul?.contentBlocks?.length || 0} Bagian</div>
          </div>
        </div>
      </div>

      <div style={st.contentWrapper}>
        <div style={st.descriptionBox}>
          <h3>Deskripsi Materi</h3>
          <p>{modul?.desc}</p>
        </div>

        {/* LIST MATERI BERDASARKAN BLOK */}
        {modul?.contentBlocks?.map((block, idx) => (
          <div key={idx} style={st.contentCard}>
            <div style={st.blockHeader}>
              <div style={st.blockNumber}>{idx + 1}</div>
              <h4>{block.title || "Bagian Materi"}</h4>
            </div>

            {/* RENDER BERDASARKAN TIPE */}
            {block.type === 'materi' && (
              <div style={st.textBody}>{block.content}</div>
            )}

            {block.type === 'media' && (
              <div style={st.mediaPreviewBox}>
                <p style={{fontSize: 12, color: '#64748b', marginBottom: 10}}>Preview Dokumen/Video:</p>
                <div style={st.iframeWrapper}>
                  {/* Preview PPT/PDF Cerdas menggunakan Google Docs Viewer */}
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(block.content)}&embedded=true`}
                    style={st.iframe}
                    frameBorder="0"
                  ></iframe>
                </div>
                <a href={block.content} target="_blank" rel="noreferrer" style={st.btnLink}>
                   Buka Full Screen ↗
                </a>
              </div>
            )}

            {block.type === 'assignment' && (
              <div style={st.taskBox}>
                <div style={st.taskInfo}>
                  <FileText color="#e67e22" />
                  <div>
                    <p style={{margin:0, fontWeight:'bold'}}>Tugas Mandiri</p>
                    <small>{block.content}</small>
                  </div>
                </div>
                <button style={st.btnUpload}>Kirim Tugas Sekarang</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const st = {
  container: { background: '#f0f2f5', minHeight: '100vh', paddingBottom: 50 },
  loader: { padding: 100, textAlign: 'center', fontSize: 18, color: '#64748b' },
  heroSection: { height: '350px', position: 'relative', overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', 
    padding: '40px 60px', color: 'white' 
  },
  backFloating: { 
    position: 'absolute', top: 20, left: 20, zIndex: 10, 
    background: 'rgba(255,255,255,0.9)', border: 'none', 
    padding: '10px 20px', borderRadius: '30px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold'
  },
  subjectBadge: { background: '#3498db', padding: '5px 15px', borderRadius: '20px', fontSize: 12, fontWeight: 'bold' },
  mainTitle: { fontSize: 36, margin: '10px 0' },
  metaHero: { display: 'flex', gap: 25, fontSize: 14, opacity: 0.9 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 6 },
  contentWrapper: { maxWidth: '900px', margin: '-40px auto 0', position: 'relative', zIndex: 5, padding: '0 20px' },
  descriptionBox: { 
    background: 'white', padding: 25, borderRadius: '15px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: 25 
  },
  contentCard: { 
    background: 'white', padding: 30, borderRadius: '20px', 
    marginBottom: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' 
  },
  blockHeader: { display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 },
  blockNumber: { 
    width: 35, height: 35, background: '#f0f7ff', color: '#007bff', 
    borderRadius: '50%', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', fontWeight: 'bold' 
  },
  textBody: { lineHeight: 1.8, color: '#2c3e50', fontSize: 16, whiteSpace: 'pre-wrap' },
  mediaPreviewBox: { marginTop: 15, background: '#f8fafc', padding: 15, borderRadius: 12 },
  iframeWrapper: { 
    width: '100%', height: '450px', borderRadius: '10px', 
    overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' 
  },
  iframe: { width: '100%', height: '100%' },
  btnLink: { 
    display: 'inline-block', marginTop: 15, color: '#3498db', 
    textDecoration: 'none', fontWeight: 'bold', fontSize: 14 
  },
  taskBox: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    background: '#fff9f0', padding: 20, borderRadius: 12, border: '1px solid #ffe8cc' 
  },
  taskInfo: { display: 'flex', gap: 12, alignItems: 'center' },
  btnUpload: { 
    background: '#e67e22', color: 'white', border: 'none', 
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
  }
};

export default StudentModuleView;