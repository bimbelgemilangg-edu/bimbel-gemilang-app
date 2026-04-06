import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
  ArrowLeft, Clock, FileText, CheckCircle, UploadCloud, Eye, Link as LinkIcon,
  HelpCircle, AlertCircle, FileDigit, User, Trash2, X, Send, Zap,
  Calendar, Maximize2, Download
} from 'lucide-react';

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [modul, setModul] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({}); 
  const [submittedTasks, setSubmittedTasks] = useState({}); 
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [localFiles, setLocalFiles] = useState({}); 
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTugasExpired, setIsTugasExpired] = useState(false);
  const [isQuizExpired, setIsQuizExpired] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          
          if (data.deadline) {
             setIsTugasExpired(now > (data.deadline.toDate ? data.deadline.toDate() : new Date(data.deadline)));
          }
          if (data.deadlineQuiz) {
             setIsQuizExpired(now > (data.deadlineQuiz.toDate ? data.deadlineQuiz.toDate() : new Date(data.deadlineQuiz)));
          }

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
    if (!studentData?.uid && !studentData?.id) return;
    const studentId = studentData.uid || studentData.id;
    const q = query(collection(db, "jawaban_tugas"), where("modulId", "==", mId), where("studentId", "==", studentId));
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
    if (!studentData?.uid && !studentData?.id) return;
    const studentId = studentData.uid || studentData.id;
    const q = query(collection(db, "jawaban_kuis"), where("modulId", "==", mId), where("studentId", "==", studentId));
    const snap = await getDocs(q);
    if (!snap.empty) setQuizSubmitted(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleFileChange = (e, blockId) => {
    if (isTugasExpired) return alert("❌ Pengumpulan sudah ditutup.");
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return alert("Format tidak didukung. Gunakan PDF, DOCX, atau Gambar.");
    if (file.size > 2500000) return alert("File terlalu besar. Maksimal 2.5MB.");

    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalFiles({
        ...localFiles,
        [blockId]: { name: file.name, data: reader.result, type: file.type, size: (file.size / 1024).toFixed(1) + " KB" }
      });
    };
    reader.readAsDataURL(file);
  };

  const submitTask = async (blockId, blockTitle) => {
    const fileToUpload = localFiles[blockId];
    if (!fileToUpload) return;
    setUploading({ ...uploading, [blockId]: true });
    try {
      const payload = {
        modulId, modulTitle: modul.title, blockId, blockTitle,
        studentId: studentData?.uid || studentData?.id,
        studentName: studentData?.nama, studentClass: studentData?.kelasSekolah || "Umum",
        fileUrl: fileToUpload.data, fileName: fileToUpload.name,
        submittedAt: serverTimestamp(), status: "Pending", type: "assignment", deviceInfo: navigator.userAgent
      };
      const docRef = await addDoc(collection(db, "jawaban_tugas"), payload);
      setSubmittedTasks({ ...submittedTasks, [blockId]: { docId: docRef.id, fileUrl: fileToUpload.data, fileName: fileToUpload.name } });
      const updatedLocal = { ...localFiles };
      delete updatedLocal[blockId];
      setLocalFiles(updatedLocal);
      alert("🚀 Tugas berhasil dikirim secara aman!");
    } catch (err) {
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
    } catch (err) { alert("Gagal menarik data."); }
  };

  const handleQuizSubmit = async () => {
    if (isQuizExpired) return alert("❌ Kuis sudah ditutup.");
    const totalQuest = modul?.quizData?.length || 0;
    if (Object.keys(quizAnswers).length < totalQuest) return alert(`Lengkapi semua ${totalQuest} jawaban.`);
    if (!window.confirm("Kirim kuis sekarang?")) return;
    try {
      const payload = {
        modulId, modulTitle: modul.title,
        studentId: studentData?.uid || studentData?.id,
        studentName: studentData?.nama, studentClass: studentData?.kelasSekolah || "Umum",
        answers: quizAnswers, submittedAt: serverTimestamp(), type: "quiz"
      };
      await addDoc(collection(db, "jawaban_kuis"), payload);
      setQuizSubmitted(true);
      alert("🎉 Kuis berhasil diselesaikan!");
    } catch (err) { alert("Gagal mengirim kuis."); }
  };

  const renderSmartMedia = (block) => {
    // FIX: Ambil nilai URL dari kemungkinan properti yang disimpan Firebase (content, fileUrl, url, atau file)
    const contentUrl = block.content || block.fileUrl || block.url || block.file;
    if (!contentUrl) return null;

    const fName = block.fileName || "Dokumen_Materi";
    const fType = block.mimeType || "";

    // 1. Render Base64 / Storage URL PDF
    const isPdf = fType === 'application/pdf' || contentUrl.startsWith('data:application/pdf') || contentUrl.toLowerCase().includes('.pdf') || (contentUrl.includes('firebasestorage') && contentUrl.includes('%2F') && !contentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i));

    if (isPdf) {
      const embedSrc = contentUrl.startsWith('data:')
        ? contentUrl
        : `https://docs.google.com/viewer?url=${encodeURIComponent(contentUrl)}&embedded=true`;

      return (
        <div style={st.mediaGroup}>
          <div style={st.pdfDownloadBox}>
            <FileText size={40} color="#673ab7" />
            <div style={{flex: 1, overflow: 'hidden'}}>
              <h4 style={{margin: '0 0 5px 0', fontSize: 16, color: '#1e293b'}}>Dokumen Materi</h4>
              <p style={{margin: 0, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{fName}</p>
            </div>
            <a href={contentUrl} target="_blank" rel="noreferrer" download={fName} style={st.btnDownloadBase64}>
              <Download size={16}/> Buka/Unduh
            </a>
          </div>
          <iframe src={embedSrc} style={st.iframe(isMobile)} title="PDF Viewer" loading="lazy"></iframe>
        </div>
      );
    }

    // 2. Render Base64 / Storage URL Image
    const isImage = contentUrl.startsWith('data:image/') || contentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || fType.startsWith('image/');
    if (isImage) {
      return (
        <div style={st.mediaGroup}>
          <img src={contentUrl} style={st.base64Img} alt="Materi Visual" />
          <div style={st.mediaFooter}>
            <span style={{fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%'}}>{fName}</span>
            <a href={contentUrl} target="_blank" rel="noreferrer" download={fName} style={st.btnSmallLink}><Download size={12}/> Unduh</a>
          </div>
        </div>
      );
    }

    // 3. Render External URLs (Canva, YT, Drive)
    let embedUrl = contentUrl;
    let showIframe = false;

    if (contentUrl.includes('canva.com') || contentUrl.includes('canva.link')) {
      if (contentUrl.includes('canva.com/design')) {
        const baseUrl = contentUrl.split('?')[0];
        embedUrl = baseUrl.endsWith('/view') ? `${baseUrl}?embed` : `${baseUrl}/view?embed`;
      }
      showIframe = true;
    } else if (contentUrl.includes('youtube.com') || contentUrl.includes('youtu.be')) {
      const videoId = contentUrl.split('v=')[1]?.split('&')[0] || contentUrl.split('/').pop();
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      showIframe = true;
    } else if (contentUrl.includes('docs.google.com')) {
      if (contentUrl.includes('/presentation')) embedUrl = contentUrl.replace(/\/edit.*$/, '/embed');
      else if (contentUrl.includes('/document')) embedUrl = contentUrl.replace(/\/edit.*$/, '/pub?embedded=true');
      showIframe = true;
    }

    if (showIframe) {
      return (
        <div style={st.mediaGroup}>
          <div style={{ width: '100%', background: '#000' }}>
            <iframe src={embedUrl} style={st.iframe(isMobile)} allowFullScreen title="Preview Materi" loading="lazy"></iframe>
          </div>
          <div style={st.mediaFooter}>
            <span style={{fontSize: 12, color: '#64748b', display:'flex', alignItems:'center', gap:4}}><Zap size={12} color="#f59e0b"/> Preview Aktif</span>
            <a href={contentUrl} target="_blank" rel="noreferrer" style={st.btnSmallLink}><Maximize2 size={12}/> Layar Penuh</a>
          </div>
        </div>
      );
    }

    // 4. Fallback Tautan Standar
    return (
        <div style={st.linkBox(isMobile)}>
          <div style={st.linkIconCircle}><LinkIcon size={20} color="#673ab7"/></div>
          <div style={{flex: 1, overflow: 'hidden'}}>
            <p style={{margin:0, fontSize:11, color:'#94a3b8', fontWeight:'bold'}}>TAUTAN MATERI</p>
            <p style={{margin:'2px 0 8px', fontSize:14, color:'#1e293b', fontWeight:'600', textOverflow:'ellipsis', whiteSpace:'nowrap', overflow:'hidden'}}>{contentUrl}</p>
            <a href={contentUrl} target="_blank" rel="noreferrer" style={st.btnLinkExternal(isMobile)}>Buka Link ↗</a>
          </div>
        </div>
    );
  };

  if (loading) return <div style={st.loader}><div style={st.spinner}></div> Membuka Sistem...</div>;

  return (
    <div style={st.container}>
      <div style={st.heroSection(isMobile)}>
        <button onClick={onBack} style={st.backFloating(isMobile)}><ArrowLeft size={16} /> {!isMobile && "Kembali"}</button>
        <img src={modul?.coverImage || modul?.coverUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000"} style={st.heroImg} alt="Cover" />
        <div style={st.heroOverlay(isMobile)}>
          <div style={st.badgeRow}>
            <span style={st.subjectBadge}>{modul?.subject || "Materi Umum"}</span>
            <span style={st.categoryBadge}>{modul?.targetKategori || "Semua"}</span>
          </div>
          <h1 style={st.mainTitle(isMobile)}>{modul?.title}</h1>
          <div style={st.metaInfo}>
             <span style={st.metaItem}><User size={14}/> {modul?.authorName || "Guru Gemilang"}</span>
             <span style={st.metaItem}><Calendar size={14}/> Rilis: {formatDate(modul?.createdAt)}</span>
             {modul?.deadline && (
               <span style={{...st.deadlineInfo, color: isTugasExpired ? '#ff4d4d' : '#4ade80'}}>
                 <Clock size={14}/> {isTugasExpired ? "Tugas Berakhir" : `Tenggat: ${formatDate(modul.deadline)}`}
               </span>
             )}
          </div>
        </div>
      </div>

      <div style={st.contentWrapper(isMobile)}>
        {modul?.blocks?.map((block, idx) => (
          <div key={block.id} style={st.contentCard(isMobile)}>
            <div style={st.blockHeader}>
              <div style={st.blockLabel}>
                {block.type === 'assignment' ? (
                  <span style={{display:'flex', alignItems:'center', gap:4}}><FileText size={12}/> TUGAS MANDIRI</span>
                ) : (
                  <span>BAGIAN {idx + 1}</span>
                )}
              </div>
              <h3 style={st.blockTitle(isMobile)}>{block.title}</h3>
            </div>

            {block.type === 'text' && <div style={st.textBody(isMobile)}>{block.content}</div>}
            
            {(block.type === 'video' || block.type === 'link' || block.type === 'file') && (
               <div style={st.mediaContainer}>
                 {renderSmartMedia(block)}
               </div>
            )}

            {block.type === 'assignment' && (
              <div style={{...st.assignmentBox(isMobile), background: isTugasExpired ? '#fef2f2' : '#fffbeb'}}>
                <div style={st.assignInfo(isMobile)}>
                   <div style={st.iconCircle}><UploadCloud size={20} color={isTugasExpired ? "#ef4444" : "#f59e0b"}/></div>
                   <div>
                      <p style={st.assignTitle}>Instruksi Tugas</p>
                      <p style={st.assignText}>{block.content}</p>
                   </div>
                </div>

                <div style={st.assignActionArea(isMobile)}>
                  {submittedTasks[block.id] ? (
                    <div style={{display:'flex', flexDirection:'column', gap:10, alignItems: isMobile ? 'flex-start' : 'flex-end', width:'100%'}}>
                      <div style={st.successUpload(isMobile)}><CheckCircle size={18}/> Berhasil Dikumpul</div>
                      <div style={{display:'flex', gap:10, width:'100%'}}>
                        <a href={submittedTasks[block.id].fileUrl} target="_blank" rel="noreferrer" style={st.btnSmallPreview(isMobile)}>
                          <Eye size={14}/> Lihat File
                        </a>
                        {!isTugasExpired && (
                           <button onClick={() => handleDeleteTask(block.id)} style={st.btnSmallDelete(isMobile)}>
                             <Trash2 size={14}/> Tarik Data
                           </button>
                        )}
                      </div>
                    </div>
                  ) : isTugasExpired ? (
                    <div style={st.lockedBadge(isMobile)}><AlertCircle size={18}/> Batas Waktu Terlewat</div>
                  ) : localFiles[block.id] ? (
                    <div style={st.previewContainer(isMobile)}>
                       <div style={st.previewHeader}>
                          <div style={{display:'flex', alignItems:'center', gap:8, overflow:'hidden'}}>
                            <FileDigit size={18} color="#673ab7"/>
                            <div style={{textAlign:'left', overflow:'hidden'}}>
                              <p style={st.previewName}>{localFiles[block.id].name}</p>
                              <p style={{fontSize:10, color:'#94a3b8', margin:0}}>{localFiles[block.id].size}</p>
                            </div>
                          </div>
                          <button onClick={() => { const updated = {...localFiles}; delete updated[block.id]; setLocalFiles(updated); }} style={st.btnClosePreview}><X size={14}/></button>
                       </div>
                       
                       {localFiles[block.id].type.includes('image') && (
                         <img src={localFiles[block.id].data} style={st.previewImg} alt="Preview" />
                       )}

                       <button onClick={() => submitTask(block.id, block.title)} disabled={uploading[block.id]} style={st.btnSubmitFinal}>
                         {uploading[block.id] ? "Mengirim..." : <><Send size={14}/> Kirim Jawaban</>}
                       </button>
                    </div>
                  ) : (
                    <>
                      <input type="file" id={`file-${block.id}`} style={{display:'none'}} onChange={(e) => handleFileChange(e, block.id)} accept=".pdf,.docx,image/*" />
                      <label htmlFor={`file-${block.id}`} style={st.btnUpload(isMobile)}>Pilih File Tugas</label>
                      <p style={{fontSize:10, color:'#94a3b8', marginTop:8, textAlign: isMobile ? 'left' : 'right'}}>Maks 2.5MB (PDF/DOCX/IMG)</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {modul?.quizData?.length > 0 && (
          <div style={{...st.contentCard(isMobile), borderTop: `6px solid ${isQuizExpired ? '#ef4444' : '#673ab7'}`}}>
             <div style={st.quizHeader(isMobile)}>
                <div style={st.quizIconBox}><HelpCircle size={24} color="white"/></div>
                <div>
                  <h2 style={{margin:0, fontSize: isMobile ? 18 : 22}}>Kuis Evaluasi</h2>
                  {modul.deadlineQuiz && (
                    <p style={{margin:0, fontSize:12, color: isQuizExpired ? '#ef4444' : '#64748b'}}>
                      Deadline: {formatDate(modul.deadlineQuiz)}
                    </p>
                  )}
                </div>
             </div>
             
             {modul.quizData.map((q, qIdx) => (
               <div key={q.id} style={st.quizItem}>
                  <p style={st.questionText(isMobile)}><span style={st.qNumber}>{qIdx + 1}</span> {q.question}</p>
                  <div style={st.optionsGrid}>
                     {q.options.map((opt, oIdx) => (
                       <button 
                         key={oIdx} disabled={quizSubmitted || isQuizExpired} onClick={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})}
                         style={{
                           ...st.optButton(isMobile),
                           backgroundColor: quizAnswers[q.id] === oIdx ? '#673ab7' : '#f8fafc',
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
                   <CheckCircle size={20}/> {quizSubmitted ? "Kuis Selesai" : "Batas Waktu Habis"}
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
  heroSection: (m) => ({ height: m ? '300px' : '380px', position: 'relative', width: '100%', overflow: 'hidden' }),
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: (m) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))', padding: m ? '30px 20px' : '60px 8%', color: 'white' }),
  backFloating: (m) => ({ position: 'absolute', top: m ? 15 : 25, left: m ? 15 : 25, zIndex: 10, background: 'white', border: 'none', padding: m ? '10px 15px' : '12px 24px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: '800', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', color:'#1e293b' }),
  badgeRow: { display: 'flex', gap: 10, marginBottom: 10, flexWrap:'wrap' },
  subjectBadge: { background: '#673ab7', padding: '6px 16px', borderRadius: '10px', fontSize: 10, fontWeight: '900', textTransform:'uppercase' },
  categoryBadge: { background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: '10px', fontSize: 10, fontWeight:'bold' },
  mainTitle: (m) => ({ fontSize: m ? 24 : 38, margin: '0 0 10px', fontWeight: '900', lineHeight: 1.2 }),
  metaInfo: { display: 'flex', gap: 15, fontSize: 12, opacity: 0.9, alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', gap: 6 },
  deadlineInfo: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: '900', background:'rgba(0,0,0,0.5)', padding:'4px 10px', borderRadius:8 },
  contentWrapper: (m) => ({ maxWidth: '950px', margin: m ? '-20px auto 0' : '-50px auto 0', position: 'relative', zIndex: 5, padding: m ? '0 15px' : '0 20px' }),
  contentCard: (m) => ({ background: 'white', padding: m ? '20px' : '40px', borderRadius: m ? '20px' : '28px', marginBottom: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }),
  blockHeader: { marginBottom: 20, borderLeft: '4px solid #673ab7', paddingLeft: 15 },
  blockLabel: { fontSize: 10, fontWeight: '900', color: '#673ab7', marginBottom: 5 },
  blockTitle: (m) => ({ fontSize: m ? 20 : 26, margin: 0, color: '#0f172a', fontWeight: '800' }),
  textBody: (m) => ({ lineHeight: 1.8, color: '#334155', fontSize: m ? 15 : 16, whiteSpace: 'pre-wrap' }),
  mediaContainer: { marginTop: 20, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', background:'#f8fafc' },
  mediaGroup: { display: 'flex', flexDirection: 'column' },
  pdfDownloadBox: { display:'flex', alignItems:'center', gap:15, padding:20, background:'#f8fafc', borderBottom:'1px solid #e2e8f0' },
  btnDownloadBase64: { background:'#673ab7', color:'white', padding:'8px 15px', borderRadius:10, textDecoration:'none', fontSize:12, fontWeight:'bold', display:'flex', alignItems:'center', gap:6, flexShrink: 0 },
  base64Img: { width:'100%', maxHeight:'500px', objectFit:'contain', background:'#0f172a' },
  mediaFooter: { padding: '12px 15px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnSmallLink: { fontSize: 12, fontWeight: '800', color: '#673ab7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 },
  iframe: (m) => ({ width: '100%', height: m ? '250px' : '520px', border: 'none' }),
  linkBox: (m) => ({ padding: m ? '15px' : '25px', display: 'flex', alignItems: 'center', gap: 15, background: '#f8fafc', borderRadius:'15px' }),
  linkIconCircle: { padding: 12, background: 'white', borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  btnLinkExternal: (m) => ({ color: 'white', background:'#673ab7', padding:'8px 15px', borderRadius:'10px', fontSize:12, fontWeight: '800', textDecoration: 'none', display:'inline-block', width: m ? '100%' : 'auto', textAlign:'center' }),
  assignmentBox: (m) => ({ marginTop: 25, padding: m ? '20px' : '30px', borderRadius: '20px', display: 'flex', flexDirection: m ? 'column' : 'row', justifyContent: 'space-between', alignItems: m ? 'flex-start' : 'center', gap: 20 }),
  assignInfo: (m) => ({ display: 'flex', gap: 15, alignItems: 'flex-start', width: '100%' }),
  iconCircle: { padding: '10px', background: 'white', borderRadius: '12px', boxShadow: '0 5px 10px rgba(0,0,0,0.05)' },
  assignTitle: { margin: 0, fontWeight: '900', fontSize: 15 },
  assignText: { margin: '6px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 },
  assignActionArea: (m) => ({ width: m ? '100%' : '240px', textAlign: m ? 'left' : 'right' }),
  btnUpload: (m) => ({ background: '#f59e0b', color: 'white', padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', fontWeight: '800', fontSize: 13, display:'block', width:'100%', textAlign:'center' }),
  previewContainer: (m) => ({ background: 'white', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', width: '100%' }),
  previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  previewName: { fontSize: 11, fontWeight: '800', color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' },
  btnClosePreview: { border: 'none', background: '#fee2e2', color: '#ef4444', padding: '4px', borderRadius: '6px', cursor: 'pointer' },
  previewImg: { width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', marginBottom: 12 },
  btnSubmitFinal: { width: '100%', background: '#673ab7', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  successUpload: (m) => ({ color: '#059669', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: m ? 'center' : 'flex-end', gap: 8, background: '#dcfce7', padding: '12px', borderRadius: '12px', width:'100%' }),
  btnSmallDelete: (m) => ({ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:6 }),
  btnSmallPreview: (m) => ({ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', textDecoration: 'none', flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:6 }),
  lockedBadge: (m) => ({ color: '#ef4444', fontWeight: '800', background: '#fee2e2', padding: '12px', borderRadius: '12px', textAlign:'center', width:'100%' }),
  quizHeader: (m) => ({ display: 'flex', alignItems: 'center', gap: 15, marginBottom: m ? 25 : 35 }),
  quizIconBox: { background: '#673ab7', padding: '10px', borderRadius: '14px' },
  quizItem: { marginBottom: 30 },
  questionText: (m) => ({ fontSize: m ? 16 : 18, fontWeight: '800', color: '#1e293b', marginBottom: 15, display: 'flex', gap: 12 }),
  qNumber: { background: '#f1f5f9', color: '#673ab7', minWidth: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:14 },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 10 },
  optButton: (m) => ({ padding: m ? '14px 18px' : '16px 20px', borderRadius: '14px', border: '2px solid', textAlign: 'left', transition: '0.2s', fontSize: m ? 14 : 15, fontWeight: '700' }),
  quizFooter: { marginTop: 20 },
  btnSubmitQuiz: { width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#673ab7', color: 'white', fontWeight: '900', fontSize: 16, cursor: 'pointer' },
  quizDoneBadge: { textAlign: 'center', padding: '20px', background: '#f0fdf4', color: '#15803d', borderRadius: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: '1px solid #bbf7d0' }
};

export default StudentModuleView;