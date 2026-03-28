import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
  ArrowLeft, Clock, BookOpen, FileText, 
  CheckCircle, UploadCloud, Eye, Link as LinkIcon,
  HelpCircle, ChevronRight, PlayCircle, AlertCircle,
  FileDigit, Info, User, Trash2, X, Send, File, Zap
} from 'lucide-react';

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [modul, setModul] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({}); 
  const [submittedTasks, setSubmittedTasks] = useState({}); 
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  // State untuk Smart Preview & Local Buffer
  const [localFiles, setLocalFiles] = useState({}); 

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTugasExpired, setIsTugasExpired] = useState(false);
  const [isQuizExpired, setIsQuizExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const docRef = doc(db, "bimbel_modul", modulId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setModul(data);
          const now = new Date();
          if (data.deadlineTugas) setIsTugasExpired(now > new Date(data.deadlineTugas));
          if (data.deadlineQuiz) setIsQuizExpired(now > new Date(data.deadlineQuiz));
          checkExistingSubmissions(modulId);
          checkQuizStatus(modulId);
        }
      } catch (err) {
        console.error("Fetch Detail Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [modulId]);

  const checkExistingSubmissions = async (mId) => {
    if (!studentData?.uid) return;
    const q = query(
      collection(db, "jawaban_tugas"),
      where("modulId", "==", mId),
      where("studentId", "==", studentData.uid)
    );
    const snap = await getDocs(q);
    const completed = {};
    snap.forEach(doc => {
      completed[doc.data().blockId] = {
        docId: doc.id,
        fileUrl: doc.data().fileUrl,
        fileName: doc.data().fileName || "Lihat File"
      };
    });
    setSubmittedTasks(completed);
  };

  const checkQuizStatus = async (mId) => {
    if (!studentData?.uid) return;
    const q = query(
      collection(db, "jawaban_kuis"),
      where("modulId", "==", mId),
      where("studentId", "==", studentData.uid)
    );
    const snap = await getDocs(q);
    if (!snap.empty) setQuizSubmitted(true);
  };

  // --- FEATURE: SMART COMPRESSION & PREVIEW ---
  const handleFileChange = (e, blockId) => {
    if (isTugasExpired) return alert("❌ Pengumpulan sudah ditutup.");
    const file = e.target.files[0];
    if (!file) return;

    // Support: PDF, DOCX, Images
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return alert("Format tidak didukung. Gunakan PDF, DOCX, atau Gambar.");
    }

    if (file.size > 2500000) { // 2.5MB Soft Limit
      return alert("File terlalu besar. Maksimal 2.5MB.");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalFiles({
        ...localFiles,
        [blockId]: {
          name: file.name,
          data: reader.result,
          type: file.type,
          size: (file.size / 1024).toFixed(1) + " KB"
        }
      });
    };
    reader.readAsDataURL(file);
  };

  // --- FEATURE: ANTI-ERROR SUBMISSION ---
  const submitTask = async (blockId, blockTitle) => {
    const fileToUpload = localFiles[blockId];
    if (!fileToUpload) return;

    setUploading({ ...uploading, [blockId]: true });
    try {
      const payload = {
        modulId,
        modulTitle: modul.title,
        blockId,
        blockTitle,
        studentId: studentData?.uid || studentData?.id,
        studentName: studentData?.nama,
        studentClass: studentData?.kelasSekolah || "Umum",
        fileUrl: fileToUpload.data, 
        fileName: fileToUpload.name,
        submittedAt: serverTimestamp(),
        status: "Pending",
        type: "assignment",
        deviceInfo: navigator.userAgent
      };

      const docRef = await addDoc(collection(db, "jawaban_tugas"), payload);
      
      setSubmittedTasks({ 
        ...submittedTasks, 
        [blockId]: { docId: docRef.id, fileUrl: fileToUpload.data, fileName: fileToUpload.name } 
      });

      // Clear local preview after success
      const updatedLocal = { ...localFiles };
      delete updatedLocal[blockId];
      setLocalFiles(updatedLocal);

      alert("🚀 Tugas berhasil dikirim secara aman!");
    } catch (err) {
      console.error("Submission Error:", err);
      alert("Terjadi gangguan jaringan. Silakan coba lagi.");
    } finally {
      setUploading({ ...uploading, [blockId]: false });
    }
  };

  const handleDeleteTask = async (blockId) => {
    if (isTugasExpired) return alert("❌ Tidak dapat menarik tugas yang sudah melewati deadline.");
    if (!window.confirm("Yakin ingin menarik kembali tugas ini?")) return;

    try {
      const taskInfo = submittedTasks[blockId];
      if (taskInfo?.docId) {
        await deleteDoc(doc(db, "jawaban_tugas", taskInfo.docId));
        const newSubmitted = { ...submittedTasks };
        delete newSubmitted[blockId];
        setSubmittedTasks(newSubmitted);
      }
    } catch (err) {
      alert("Gagal menarik data.");
    }
  };

  const handleQuizSubmit = async () => {
    if (isQuizExpired) return alert("❌ Kuis sudah ditutup.");
    const totalQuest = modul?.quizData?.length || 0;
    if (Object.keys(quizAnswers).length < totalQuest) {
      return alert(`Lengkapi semua ${totalQuest} jawaban.`);
    }
    if (!window.confirm("Kirim kuis sekarang?")) return;

    try {
      const payload = {
        modulId,
        modulTitle: modul.title,
        studentId: studentData?.uid || studentData?.id,
        studentName: studentData?.nama,
        studentClass: studentData?.kelasSekolah || "Umum",
        answers: quizAnswers,
        submittedAt: serverTimestamp(),
        type: "quiz"
      };
      await addDoc(collection(db, "jawaban_kuis"), payload);
      setQuizSubmitted(true);
      alert("🎉 Kuis berhasil diselesaikan!");
    } catch (err) {
      alert("Gagal mengirim kuis.");
    }
  };

  const renderSmartMedia = (url) => {
    const isGoogleDrive = url.includes('drive.google.com');
    const isCanva = url.includes('canva.com');
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    
    if (isCanva || isGoogleDrive || isYouTube) {
        let embedUrl = url;
        if (isYouTube) {
            const videoId = url.split('v=')[1] || url.split('/').pop();
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        return (
            <div style={st.iframeWrapper}>
                <iframe src={embedUrl} style={st.iframe} allowFullScreen title="Materi" allow="autoplay"></iframe>
            </div>
        );
    }
    return (
        <div style={st.linkBox}>
          <LinkIcon size={20} color="#673ab7"/>
          <div style={{flex: 1}}>
            <p style={{margin:0, fontSize:12, color:'#64748b', fontWeight:'bold'}}>TAUTAN MATERI:</p>
            <a href={url} target="_blank" rel="noreferrer" style={st.btnLinkExternal}>Buka Link Materi ↗</a>
          </div>
        </div>
    );
  };

  if (loading) return <div style={st.loader}><div style={st.spinner}></div> Membuka Modul...</div>;

  return (
    <div style={st.container}>
      {/* HEADER AREA */}
      <div style={st.heroSection}>
        <button onClick={onBack} style={st.backFloating}><ArrowLeft size={18} /> Kembali</button>
        <img src={modul?.coverImage || modul?.coverUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000"} style={st.heroImg} alt="Cover" />
        <div style={st.heroOverlay}>
          <div style={st.badgeRow}>
            <span style={st.subjectBadge}>{modul?.subject || "Materi Umum"}</span>
            <span style={st.categoryBadge}>{modul?.targetKategori || "Semua"}</span>
          </div>
          <h1 style={st.mainTitle}>{modul?.title}</h1>
          <div style={st.metaInfo}>
             <span style={st.metaItem}><User size={14}/> {modul?.authorName || "Guru Gemilang"}</span>
             {modul?.deadlineTugas && (
               <span style={{...st.deadlineInfo, color: isTugasExpired ? '#ff4d4d' : '#4ade80'}}>
                 <Clock size={14}/> {isTugasExpired ? "Tugas Berakhir" : `Deadline: ${new Date(modul.deadlineTugas).toLocaleString()}`}
               </span>
             )}
          </div>
        </div>
      </div>

      <div style={st.contentWrapper}>
        {modul?.blocks?.map((block, idx) => (
          <div key={block.id} style={st.contentCard}>
            <div style={st.blockHeader}>
              <div style={st.blockLabel}>
                {block.type === 'assignment' ? (
                  <span style={{display:'flex', alignItems:'center', gap:4}}><FileText size={12}/> TUGAS</span>
                ) : (
                  <span>BAGIAN {idx + 1}</span>
                )}
              </div>
              <h3 style={st.blockTitle}>{block.title}</h3>
            </div>

            {block.type === 'text' && <div style={st.textBody}>{block.content}</div>}
            {block.type === 'video' && <div style={st.mediaContainer}>{renderSmartMedia(block.content)}</div>}

            {block.type === 'assignment' && (
              <div style={{...st.assignmentBox, background: isTugasExpired ? '#fef2f2' : '#fffbeb'}}>
                <div style={st.assignInfo}>
                   <div style={st.iconCircle}><UploadCloud size={20} color={isTugasExpired ? "#ef4444" : "#f59e0b"}/></div>
                   <div>
                      <p style={st.assignTitle}>Instruksi Tugas</p>
                      <p style={st.assignText}>{block.content}</p>
                   </div>
                </div>

                <div style={st.assignActionArea}>
                  {/* CASE 1: SUDAH SUBMIT */}
                  {submittedTasks[block.id] ? (
                    <div style={{display:'flex', flexDirection:'column', gap:10, alignItems:'flex-end'}}>
                      <div style={st.successUpload}><CheckCircle size={18}/> Berhasil Dikumpul</div>
                      <div style={{display:'flex', gap:10}}>
                        <a href={submittedTasks[block.id].fileUrl} target="_blank" rel="noreferrer" style={st.btnSmallPreview}>
                          <Eye size={12}/> Lihat File
                        </a>
                        {!isTugasExpired && (
                           <button onClick={() => handleDeleteTask(block.id)} style={st.btnSmallDelete}>
                             <Trash2 size={12}/> Tarik
                           </button>
                        )}
                      </div>
                    </div>
                  ) : isTugasExpired ? (
                    <div style={st.lockedBadge}><AlertCircle size={18}/> Terkunci</div>
                  ) : localFiles[block.id] ? (
                    /* CASE 2: PREVIEW MODE (LOCAL) */
                    <div style={st.previewContainer}>
                       <div style={st.previewHeader}>
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <FileDigit size={18} color="#673ab7"/>
                            <div style={{textAlign:'left'}}>
                              <p style={st.previewName}>{localFiles[block.id].name}</p>
                              <p style={{fontSize:10, color:'#94a3b8', margin:0}}>{localFiles[block.id].size}</p>
                            </div>
                          </div>
                          <button onClick={() => {
                            const updated = {...localFiles}; delete updated[block.id]; setLocalFiles(updated);
                          }} style={st.btnClosePreview}><X size={14}/></button>
                       </div>
                       
                       {localFiles[block.id].type.includes('image') && (
                         <img src={localFiles[block.id].data} style={st.previewImg} alt="Preview" />
                       )}

                       <button 
                         onClick={() => submitTask(block.id, block.title)} 
                         disabled={uploading[block.id]}
                         style={st.btnSubmitFinal}
                       >
                         {uploading[block.id] ? "Mengirim..." : <><Send size={14}/> Kirim Jawaban</>}
                       </button>
                    </div>
                  ) : (
                    /* CASE 3: READY TO PICK */
                    <>
                      <input 
                        type="file" id={`file-${block.id}`} style={{display:'none'}} 
                        onChange={(e) => handleFileChange(e, block.id)} 
                        accept=".pdf,.docx,image/*"
                      />
                      <label htmlFor={`file-${block.id}`} style={st.btnUpload}>Pilih & Preview File</label>
                      <p style={{fontSize:10, color:'#94a3b8', marginTop:8}}>Format: PDF, Docs, Gambar (Max 2.5MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* SECTION KUIS */}
        {modul?.quizData?.length > 0 && (
          <div style={{...st.contentCard, borderTop: `6px solid ${isQuizExpired ? '#ef4444' : '#673ab7'}`}}>
             <div style={st.quizHeader}>
                <div style={st.quizIconBox}><HelpCircle size={24} color="white"/></div>
                <div>
                  <h2 style={{margin:0, fontSize:22}}>Kuis Pemahaman</h2>
                  {modul.deadlineQuiz && (
                    <p style={{margin:0, fontSize:12, color: isQuizExpired ? '#ef4444' : '#64748b'}}>
                      Deadline: {new Date(modul.deadlineQuiz).toLocaleString()}
                    </p>
                  )}
                </div>
             </div>
             
             {modul.quizData.map((q, qIdx) => (
               <div key={q.id} style={st.quizItem}>
                  <p style={st.questionText}><span style={st.qNumber}>{qIdx + 1}</span> {q.question}</p>
                  <div style={st.optionsGrid}>
                     {q.options.map((opt, oIdx) => (
                       <button 
                         key={oIdx}
                         disabled={quizSubmitted || isQuizExpired}
                         onClick={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})}
                         style={{
                           ...st.optButton,
                           backgroundColor: quizAnswers[q.id] === oIdx ? '#673ab7' : 'white',
                           color: quizAnswers[q.id] === oIdx ? 'white' : '#1e293b',
                           borderColor: quizAnswers[q.id] === oIdx ? '#673ab7' : '#e2e8f0',
                         }}
                       >
                         <span style={{opacity:0.6, marginRight:8}}>{String.fromCharCode(65 + oIdx)}.</span> {opt}
                       </button>
                     ))}
                  </div>
               </div>
             ))}

             <div style={st.quizFooter}>
               {!quizSubmitted && !isQuizExpired ? (
                 <button onClick={handleQuizSubmit} style={st.btnSubmitQuiz}>Kirim Jawaban Kuis</button>
               ) : (
                 <div style={st.quizDoneBadge}>
                   <CheckCircle size={20}/> Kuis Selesai
                 </div>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const st = {
  container: { background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 },
  loader: { height: '100vh', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', gap:15, fontWeight: 'bold', color: '#673ab7' },
  spinner: { width: 40, height: 40, border: '4px solid #f3e8ff', borderTop: '4px solid #673ab7', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  heroSection: { height: '380px', position: 'relative', width: '100%', overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))', padding: '60px 8%', color: 'white' },
  backFloating: { position: 'absolute', top: 25, left: 25, zIndex: 10, background: 'white', border: 'none', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: '800', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', color:'#1e293b' },
  badgeRow: { display: 'flex', gap: 10, marginBottom: 15 },
  subjectBadge: { background: '#673ab7', padding: '6px 16px', borderRadius: '10px', fontSize: 11, fontWeight: '800' },
  categoryBadge: { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: '10px', fontSize: 11 },
  mainTitle: { fontSize: 38, margin: '0 0 15px', fontWeight: '900', lineHeight: 1.2 },
  metaInfo: { display: 'flex', gap: 25, fontSize: 14, opacity: 0.9, alignItems: 'center' },
  metaItem: { display: 'flex', alignItems: 'center', gap: 8 },
  deadlineInfo: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: '800' },
  contentWrapper: { maxWidth: '950px', margin: '-50px auto 0', position: 'relative', zIndex: 5, padding: '0 20px' },
  contentCard: { background: 'white', padding: '40px', borderRadius: '28px', marginBottom: 30, boxShadow: '0 15px 35px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
  blockHeader: { marginBottom: 25, borderLeft: '4px solid #673ab7', paddingLeft: 20 },
  blockLabel: { fontSize: 11, fontWeight: '900', color: '#673ab7', marginBottom: 8 },
  blockTitle: { fontSize: 26, margin: 0, color: '#0f172a', fontWeight: '800' },
  textBody: { lineHeight: 1.9, color: '#334155', fontSize: 17, whiteSpace: 'pre-wrap' },
  mediaContainer: { marginTop: 25, borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  iframeWrapper: { width: '100%', height: '520px', background: '#f1f5f9' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  linkBox: { padding: '25px', display: 'flex', alignItems: 'center', gap: 15, background: '#f8fafc', borderRadius:'15px' },
  btnLinkExternal: { color: '#673ab7', fontWeight: '800', textDecoration: 'none' },
  assignmentBox: { marginTop: 25, padding: '30px', borderRadius: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 25 },
  assignInfo: { display: 'flex', gap: 18, alignItems: 'flex-start', flex: 1 },
  iconCircle: { padding: '12px', background: 'white', borderRadius: '15px', boxShadow: '0 5px 10px rgba(0,0,0,0.05)' },
  assignTitle: { margin: 0, fontWeight: '800', fontSize: 16 },
  assignText: { margin: '6px 0 0', fontSize: 14, color: '#64748b', lineHeight: 1.5 },
  assignActionArea: { minWidth: '240px', textAlign: 'right' },
  btnUpload: { background: '#f59e0b', color: 'white', padding: '14px 28px', borderRadius: '14px', cursor: 'pointer', fontWeight: '800', fontSize: 14, display:'inline-block' },
  previewContainer: { background: 'white', padding: '18px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', width: '240px' },
  previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  previewName: { fontSize: 12, fontWeight: '700', color: '#1e293b', margin: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' },
  btnClosePreview: { border: 'none', background: '#fee2e2', color: '#ef4444', padding: '4px', borderRadius: '6px', cursor: 'pointer' },
  previewImg: { width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', marginBottom: 12 },
  btnSubmitFinal: { width: '100%', background: '#673ab7', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  successUpload: { color: '#059669', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', padding: '12px 24px', borderRadius: '14px' },
  btnSmallDelete: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  btnSmallPreview: { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', textDecoration: 'none', display:'inline-block' },
  lockedBadge: { color: '#ef4444', fontWeight: '800', background: '#fee2e2', padding: '12px 24px', borderRadius: '14px' },
  quizHeader: { display: 'flex', alignItems: 'center', gap: 18, marginBottom: 40 },
  quizIconBox: { background: '#673ab7', padding: '12px', borderRadius: '16px' },
  quizItem: { marginBottom: 40 },
  questionText: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20, display: 'flex', gap: 12 },
  qNumber: { background: '#f1f5f9', color: '#673ab7', minWidth: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 12 },
  optButton: { padding: '18px 24px', borderRadius: '16px', border: '2px solid', textAlign: 'left', transition: '0.2s', fontSize: 15, fontWeight: '600' },
  quizFooter: { marginTop: 20 },
  btnSubmitQuiz: { width: '100%', padding: '20px', borderRadius: '18px', border: 'none', background: '#673ab7', color: 'white', fontWeight: '900', fontSize: 17, cursor: 'pointer' },
  quizDoneBadge: { textAlign: 'center', padding: '25px', background: '#f0fdf4', color: '#15803d', borderRadius: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, border: '1px solid #bbf7d0' }
};

export default StudentModuleView;