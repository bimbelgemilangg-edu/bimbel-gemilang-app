import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { ArrowLeft, Clock, BookOpen, FileText, CheckCircle, UploadCloud, Eye } from 'lucide-react';

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [modul, setModul] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({}); // Tracking status per blok tugas
  const [submittedTasks, setSubmittedTasks] = useState({}); // Simpan status tugas yang sudah dikumpul

  useEffect(() => {
    const fetchDetail = async () => {
      const docRef = doc(db, "bimbel_modul", modulId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setModul(snap.data());
        checkExistingSubmissions(modulId);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [modulId]);

  // Cek apakah siswa sudah pernah mengumpul tugas di modul ini
  const checkExistingSubmissions = async (mId) => {
    const q = query(
      collection(db, "jawaban_tugas"),
      where("modulId", "==", mId),
      where("studentId", "==", studentData?.uid || "")
    );
    const snap = await getDocs(q);
    const completed = {};
    snap.forEach(doc => {
      completed[doc.data().blockId] = doc.data().fileUrl;
    });
    setSubmittedTasks(completed);
  };

  // FUNGSI UPLOAD TUGAS CERDAS (Base64 agar cepat & aman)
  const handleTaskUpload = async (e, blockId, blockTitle) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading({ ...uploading, [blockId]: true });

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const payload = {
          modulId,
          modulTitle: modul.title,
          blockId,
          blockTitle,
          studentId: studentData?.uid,
          studentName: studentData?.nama,
          studentClass: studentData?.kelasSekolah,
          fileUrl: reader.result, // File dalam bentuk teks Base64
          submittedAt: serverTimestamp(),
          status: "Pending"
        };

        await addDoc(collection(db, "jawaban_tugas"), payload);
        setSubmittedTasks({ ...submittedTasks, [blockId]: reader.result });
        alert("🚀 Tugas berhasil terkirim ke Guru!");
      } catch (err) {
        alert("Gagal upload: " + err.message);
      } finally {
        setUploading({ ...uploading, [blockId]: false });
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div style={st.loader}>Membuka Ruang Belajar...</div>;

  return (
    <div style={st.container}>
      {/* HERO SECTION DENGAN GAMBAR SAMPUL DARI GURU */}
      <div style={st.heroSection}>
        <button onClick={onBack} style={st.backFloating}><ArrowLeft size={18} /> Kembali</button>
        <img 
          src={modul?.coverUrl || modul?.coverImage || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000"} 
          style={st.heroImg} 
          alt="Cover" 
        />
        <div style={st.heroOverlay}>
          <div style={st.badgeRow}>
            <span style={st.subjectBadge}>{modul?.target?.grade || "Umum"}</span>
            {modul?.deadline && <span style={st.deadlineBadge}><Clock size={12}/> Deadline: {new Date(modul.deadline).toLocaleString()}</span>}
          </div>
          <h1 style={st.mainTitle}>{modul?.title}</h1>
          <p style={st.heroDesc}>{modul?.desc}</p>
        </div>
      </div>

      <div style={st.contentWrapper}>
        {modul?.contentBlocks?.map((block, idx) => (
          <div key={idx} style={st.contentCard}>
            <div style={st.blockHeader}>
              <div style={st.blockLabel}>BAGIAN {idx + 1}: {block.type.toUpperCase()}</div>
              <h3 style={st.blockTitle}>{block.title}</h3>
            </div>

            {/* --- RENDER: MATERI TEKS --- */}
            {block.type === 'materi' && <div style={st.textBody}>{block.content}</div>}

            {/* --- RENDER: PREVIEW SMART (PPT/VIDEO/PDF) --- */}
            {block.type === 'media' && (
              <div style={st.mediaContainer}>
                <div style={st.previewHeader}>
                  <Eye size={16}/> Smart Preview (Scroll/Geser untuk melihat isi)
                </div>
                <div style={st.iframeWrapper}>
                   {/* Mesin Preview Cerdas menggunakan Google Docs Viewer */}
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(block.content)}&embedded=true`}
                    style={st.iframe}
                    frameBorder="0"
                    title="Preview Materi"
                  ></iframe>
                </div>
                <a href={block.content} target="_blank" rel="noreferrer" style={st.btnLink}>Buka di Tab Baru ↗</a>
              </div>
            )}

            {/* --- RENDER: ASSIGNMENT (UPLOAD TUGAS) --- */}
            {block.type === 'assignment' && (
              <div style={st.assignmentBox}>
                <div style={st.assignInfo}>
                   <FileText size={24} color="#f39c12"/>
                   <div>
                      <p style={{margin:0, fontWeight:'bold'}}>Instruksi Tugas:</p>
                      <p style={{margin:0, fontSize:14, color:'#555'}}>{block.content}</p>
                   </div>
                </div>

                {submittedTasks[block.id] ? (
                  <div style={st.successUpload}>
                    <CheckCircle size={18} color="#27ae60"/> 
                    <span>Tugas Sudah Terkirim</span>
                  </div>
                ) : (
                  <div style={st.uploadAction}>
                    <input 
                      type="file" 
                      id={`file-${block.id}`} 
                      style={{display:'none'}} 
                      onChange={(e) => handleTaskUpload(e, block.id, block.title)}
                    />
                    <label htmlFor={`file-${block.id}`} style={uploading[block.id] ? st.btnLoading : st.btnUpload}>
                      {uploading[block.id] ? "Sedang Mengirim..." : <><UploadCloud size={18}/> Unggah Jawaban</>}
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const st = {
  container: { background: '#f8f9fa', minHeight: '100vh', paddingBottom: 80 },
  loader: { padding: '100px', textAlign: 'center', fontWeight: 'bold' },
  heroSection: { height: '400px', position: 'relative', width: '100%' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '50px 8% 30px', color: 'white' },
  backFloating: { position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'white', border: 'none', padding: '10px 18px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  badgeRow: { display: 'flex', gap: 10, marginBottom: 15 },
  subjectBadge: { background: '#673ab7', padding: '5px 15px', borderRadius: '20px', fontSize: 12, fontWeight: 'bold' },
  deadlineBadge: { background: 'rgba(231, 76, 60, 0.8)', padding: '5px 15px', borderRadius: '20px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 },
  mainTitle: { fontSize: 38, margin: '5px 0', fontWeight: '800' },
  heroDesc: { fontSize: 16, opacity: 0.9, maxWidth: '700px' },
  contentWrapper: { maxWidth: '1000px', margin: '-50px auto 0', position: 'relative', zIndex: 5, padding: '0 20px' },
  contentCard: { background: 'white', padding: '30px', borderRadius: '20px', marginBottom: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  blockHeader: { marginBottom: 20 },
  blockLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
  blockTitle: { fontSize: 22, margin: '5px 0', color: '#1e293b' },
  textBody: { lineHeight: 1.8, color: '#334155', fontSize: 16, whiteSpace: 'pre-wrap' },
  mediaContainer: { marginTop: 20, background: '#f1f5f9', padding: 15, borderRadius: '15px' },
  previewHeader: { fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontWeight: 'bold' },
  iframeWrapper: { width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0' },
  iframe: { width: '100%', height: '100%' },
  btnLink: { display: 'inline-block', marginTop: 12, color: '#673ab7', textDecoration: 'none', fontSize: 13, fontWeight: 'bold' },
  assignmentBox: { marginTop: 20, background: '#fff9eb', border: '1px solid #ffeaa7', padding: '20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  assignInfo: { display: 'flex', gap: 15, alignItems: 'center' },
  uploadAction: { marginLeft: 20 },
  btnUpload: { background: '#f39c12', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, transition: '0.3s' },
  btnLoading: { background: '#ccc', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'not-allowed' },
  successUpload: { display: 'flex', alignItems: 'center', gap: 8, color: '#27ae60', fontWeight: 'bold', fontSize: 14 }
};

export default StudentModuleView;