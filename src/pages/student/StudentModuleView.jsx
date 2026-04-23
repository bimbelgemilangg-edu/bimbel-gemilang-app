import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { ArrowLeft, Clock, FileText, CheckCircle, UploadCloud, Eye, Link as LinkIcon, HelpCircle, AlertCircle, FileDigit, User, Trash2, X, Send, Zap, Calendar, Maximize2, Download, BookOpen, Target, ChevronRight } from 'lucide-react';

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [modul, setModul] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [submittedTasks, setSubmittedTasks] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [localFiles, setLocalFiles] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('materi');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTugasExpired, setIsTugasExpired] = useState(false);
  const [isQuizExpired, setIsQuizExpired] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
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
          
          // Cek deadline tugas (dari blocks)
          const assignmentBlock = (data.blocks || []).find(b => b.type === 'assignment' && b.endTime);
          if (assignmentBlock?.endTime) {
            setIsTugasExpired(now > new Date(assignmentBlock.endTime));
          }
          
          // Cek deadline kuis
          if (data.deadlineQuiz) {
            setIsQuizExpired(now > new Date(data.deadlineQuiz));
          }

          checkExistingSubmissions(modulId);
          checkQuizStatus(modulId);
        }
      } catch (err) { console.error("Fetch Detail Error:", err); } 
      finally { setLoading(false); }
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
      completed[doc.data().blockId] = { docId: doc.id, fileUrl: doc.data().fileUrl, fileName: doc.data().fileName || "Lihat File" };
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

  const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const dl = new Date(deadline);
    const diff = dl - currentTime;
    if (diff <= 0) return { text: '⛔ Deadline terlewat', color: '#ef4444', urgent: true };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return { text: `⏳ ${days} hari ${hours % 24} jam lagi`, color: days <= 1 ? '#f59e0b' : '#10b981', urgent: days <= 1 };
    return { text: `⚠️ ${hours} jam lagi`, color: '#f59e0b', urgent: true };
  };

  const handleFileChange = (e, blockId) => {
    if (isTugasExpired) return alert("❌ Pengumpulan sudah ditutup.");
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return alert("❌ Format tidak didukung! Gunakan PDF atau Gambar.");
    if (file.size > 50 * 1024 * 1024) return alert("File terlalu besar. Maksimal 50MB.");
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalFiles({...localFiles, [blockId]: { name: file.name, data: reader.result, type: file.type, size: (file.size / 1024).toFixed(1) + " KB" }});
    };
    reader.readAsDataURL(file);
  };

  const submitTask = async (blockId, blockTitle) => {
    const fileToUpload = localFiles[blockId];
    if (!fileToUpload) return;
    setUploading({ ...uploading, [blockId]: true });
    try {
      const { uploadToDrive } = await import('../../services/uploadService');
      const result = await uploadToDrive(fileToUpload.data, fileToUpload.name, fileToUpload.type);
      if (result.success) {
        const payload = {
          modulId, modulTitle: modul.title, blockId, blockTitle,
          studentId: studentData?.uid || studentData?.id,
          studentName: studentData?.nama, studentClass: studentData?.kelasSekolah || 'Umum',
          fileUrl: result.downloadURL, fileName: fileToUpload.name, filePath: result.filePath,
          submittedAt: serverTimestamp(), status: 'Pending', type: 'assignment'
        };
        const docRef = await addDoc(collection(db, 'jawaban_tugas'), payload);
        setSubmittedTasks({ ...submittedTasks, [blockId]: { docId: docRef.id, fileUrl: result.downloadURL, fileName: fileToUpload.name } });
        const updatedLocal = { ...localFiles };
        delete updatedLocal[blockId];
        setLocalFiles(updatedLocal);
        alert('✅ Tugas berhasil diupload!');
      } else { throw new Error(result.error || 'Upload gagal'); }
    } catch (err) { alert('❌ Gagal upload: ' + err.message); } 
    finally { setUploading({ ...uploading, [blockId]: false }); }
  };

  const handleDeleteTask = async (blockId) => {
    if (isTugasExpired) return alert("❌ Tidak dapat menarik tugas.");
    if (!window.confirm("Yakin ingin menarik kembali tugas ini?")) return;
    try {
      const taskInfo = submittedTasks[blockId];
      if (taskInfo?.docId) { await deleteDoc(doc(db, "jawaban_tugas", taskInfo.docId)); const newSubmitted = { ...submittedTasks }; delete newSubmitted[blockId]; setSubmittedTasks(newSubmitted); }
    } catch (err) { alert("Gagal menarik data."); }
  };

  const handleQuizSubmit = async () => {
    if (isQuizExpired) return alert("❌ Kuis sudah ditutup.");
    const quizData = modul?.quizData || [];
    const totalQuestions = quizData.length;
    if (totalQuestions === 0) return alert("Tidak ada soal.");
    const unanswered = quizData.filter(q => quizAnswers[q.id] === undefined);
    if (unanswered.length > 0) return alert(`❌ Kamu belum menjawab ${unanswered.length} soal.`);
    if (!window.confirm("Kirim kuis sekarang? Jawaban tidak bisa diubah.")) return;
    try {
      let correctCount = 0;
      quizData.forEach((q) => { if (quizAnswers[q.id] === q.correctAnswer) correctCount++; });
      const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
      const payload = {
        modulId, modulTitle: modul.title,
        studentId: studentData?.uid || studentData?.id,
        studentName: studentData?.nama, studentClass: studentData?.kelasSekolah || "Umum",
        answers: quizAnswers, correctAnswers: correctCount, totalQuestions: totalQuestions,
        score: calculatedScore, submittedAt: serverTimestamp(), status: "Dinilai", gradedAt: serverTimestamp(), type: "quiz"
      };
      await addDoc(collection(db, "jawaban_kuis"), payload);
      setQuizSubmitted(true);
      alert(`🎉 Kuis selesai!\n\nNilai: ${calculatedScore}\nBenar: ${correctCount}/${totalQuestions}`);
    } catch (err) { alert("Gagal mengirim kuis."); }
  };

  const renderSmartMedia = (block) => {
    const contentUrl = block.content || block.fileUrl || block.url || block.file;
    if (!contentUrl) return null;
    const fName = block.fileName || "Dokumen_Materi";
    const fType = block.mimeType || "";
    const isPdf = fType === 'application/pdf' || contentUrl.toLowerCase().includes('.pdf') || contentUrl.includes('supabase');
    
    if (isPdf) {
      const embedSrc = `https://docs.google.com/viewer?url=${encodeURIComponent(contentUrl)}&embedded=true`;
      return (
        <div style={st.mediaGroup}>
          <div style={st.pdfDownloadBox}>
            <FileText size={40} color="#673ab7" />
            <div style={{flex: 1, overflow: 'hidden'}}>
              <h4 style={{margin: '0 0 5px 0', fontSize: 16, color: '#1e293b'}}>Dokumen Materi</h4>
              <p style={{margin: 0, fontSize: 12, color: '#64748b'}}>{fName}</p>
            </div>
            <a href={contentUrl} target="_blank" rel="noreferrer" download style={st.btnDownloadBase64}><Download size={16}/> Buka/Unduh</a>
          </div>
          <iframe src={embedSrc} style={st.iframe(isMobile)} title="PDF Viewer" loading="lazy"></iframe>
        </div>
      );
    }
    const isImage = contentUrl.startsWith('data:image/') || contentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || fType.startsWith('image/');
    if (isImage) {
      return (
        <div style={st.mediaGroup}>
          <img src={contentUrl} style={st.base64Img} alt="Materi Visual" />
          <div style={st.mediaFooter}>
            <span style={{fontSize: 12, color: '#64748b'}}>{fName}</span>
            <a href={contentUrl} target="_blank" rel="noreferrer" download style={st.btnSmallLink}><Download size={12}/> Unduh</a>
          </div>
        </div>
      );
    }
    let embedUrl = contentUrl;
    let showIframe = false;
    if (contentUrl.includes('canva.com') || contentUrl.includes('youtube.com') || contentUrl.includes('docs.google.com')) {
      if (contentUrl.includes('youtube.com') || contentUrl.includes('youtu.be')) {
        const videoId = contentUrl.split('v=')[1]?.split('&')[0] || contentUrl.split('/').pop();
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      showIframe = true;
    }
    if (showIframe) {
      return (
        <div style={st.mediaGroup}>
          <div style={{ width: '100%', background: '#000' }}><iframe src={embedUrl} style={st.iframe(isMobile)} allowFullScreen title="Preview" loading="lazy"></iframe></div>
          <div style={st.mediaFooter}><span style={{fontSize: 12, color: '#64748b'}}><Zap size={12} color="#f59e0b"/> Preview Aktif</span><a href={contentUrl} target="_blank" rel="noreferrer" style={st.btnSmallLink}><Maximize2 size={12}/> Layar Penuh</a></div>
        </div>
      );
    }
    return (
      <div style={st.linkBox(isMobile)}>
        <div style={st.linkIconCircle}><LinkIcon size={20} color="#673ab7"/></div>
        <div style={{flex: 1, overflow: 'hidden'}}>
          <p style={{margin:0, fontSize:11, color:'#94a3b8', fontWeight:'bold'}}>TAUTAN MATERI</p>
          <p style={{margin:'2px 0 8px', fontSize:14, color:'#1e293b', fontWeight:'600'}}>{contentUrl}</p>
          <a href={contentUrl} target="_blank" rel="noreferrer" style={st.btnLinkExternal(isMobile)}>Buka Link ↗</a>
        </div>
      </div>
    );
  };

  if (loading) return <div style={st.loader}><div style={st.spinner}></div> Membuka Modul...</div>;

  // Hitung progres
  const materiBlocks = (modul?.blocks || []).filter(b => b.type !== 'assignment');
  const tugasBlocks = (modul?.blocks || []).filter(b => b.type === 'assignment');
  const totalTugas = tugasBlocks.length;
  const selesaiTugas = tugasBlocks.filter(b => submittedTasks[b.id]).length;
  const progresTugas = totalTugas > 0 ? Math.round((selesaiTugas / totalTugas) * 100) : 100;
  const kuisSelesai = quizSubmitted || (modul?.quizData?.length || 0) === 0;
  const totalProgres = Math.round(((progresTugas + (kuisSelesai ? 100 : 0)) / 2));

  return (
    <div style={st.container}>
      {/* HEADER */}
      <div style={st.heroSection(isMobile)}>
        <button onClick={onBack} style={st.backFloating(isMobile)}><ArrowLeft size={16} /> {!isMobile && "Kembali"}</button>
        <img src={modul?.coverImage || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000"} style={st.heroImg} alt="Cover" />
        <div style={st.heroOverlay(isMobile)}>
          <div style={st.badgeRow}>
            <span style={st.subjectBadge}>{modul?.subject || "Materi Umum"}</span>
            <span style={st.categoryBadge}>{modul?.targetKategori || "Semua"}</span>
          </div>
          <h1 style={st.mainTitle(isMobile)}>{modul?.title}</h1>
          <div style={st.metaInfo}>
            <span style={st.metaItem}><User size={14}/> {modul?.authorName || "Guru"}</span>
            <span style={st.metaItem}><Calendar size={14}/> {formatDate(modul?.createdAt)}</span>
          </div>
          {/* 🔥 PROGRESS BAR */}
          <div style={st.progressContainer}>
            <div style={st.progressBar}>
              <div style={{...st.progressFill, width: `${totalProgres}%`}}></div>
            </div>
            <span style={st.progressText}>{totalProgres}% Selesai</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={st.tabBar(isMobile)}>
        <button onClick={() => setActiveTab('materi')} style={st.tab(activeTab === 'materi')}>
          <BookOpen size={14} /> Materi ({materiBlocks.length})
        </button>
        <button onClick={() => setActiveTab('tugas')} style={st.tab(activeTab === 'tugas')}>
          <Send size={14} /> Tugas ({selesaiTugas}/{totalTugas})
        </button>
        {modul?.quizData?.length > 0 && (
          <button onClick={() => setActiveTab('kuis')} style={st.tab(activeTab === 'kuis')}>
            <HelpCircle size={14} /> Kuis {kuisSelesai ? '✅' : '❓'}
          </button>
        )}
      </div>

      <div style={st.contentWrapper(isMobile)}>
              {/* TAB MATERI */}
              {activeTab === 'materi' && materiBlocks.map((block, idx) => (
          <div key={block.id} style={st.contentCard(isMobile)}>
            <div style={st.blockHeader}>
              <div style={st.blockLabel}>{block.type === 'file' ? '📁 FILE/MODUL' : block.type === 'video' ? '🔗 LINK/VIDEO' : '📄 BAGIAN ' + (idx + 1)}</div>
              <h3 style={st.blockTitle(isMobile)}>{block.title}</h3>
            </div>
            {block.type === 'text' && <div style={st.textBody(isMobile)}>{block.content}</div>}
            {(block.type === 'video' || block.type === 'file') && <div style={st.mediaContainer}>{renderSmartMedia(block)}</div>}
          </div>
        ))}

        {/* TAB TUGAS */}
        {activeTab === 'tugas' && (
          <>
            {tugasBlocks.length === 0 ? (
              <div style={st.emptyState}><CheckCircle size={40} color="#10b981" /><p>Tidak ada tugas untuk modul ini.</p></div>
            ) : (
              tugasBlocks.map((block) => {
                const timeRemaining = getTimeRemaining(block.endTime);
                const isExpired = isTugasExpired || (block.endTime && new Date(block.endTime) < currentTime);
                return (
                  <div key={block.id} style={st.contentCard(isMobile)}>
                    <div style={st.blockHeader}>
                      <div style={{...st.blockLabel, color: '#f59e0b'}}>📝 TUGAS MANDIRI</div>
                      <h3 style={st.blockTitle(isMobile)}>{block.title}</h3>
                    </div>
                    <div style={st.textBody(isMobile)}>{block.content}</div>
                    
                    {/* DEADLINE COUNTDOWN */}
                    {timeRemaining && (
                      <div style={{...st.deadlineAlert, color: timeRemaining.color, background: timeRemaining.color + '15'}}>
                        <Clock size={16} /> {timeRemaining.text}
                      </div>
                    )}

                    {/* UPLOAD AREA */}
                    <div style={st.assignmentBox(isMobile, isExpired)}>
                      {submittedTasks[block.id] ? (
                        <div style={{display:'flex', flexDirection:'column', gap:8, width:'100%'}}>
                          <div style={st.successUpload}><CheckCircle size={16}/> Berhasil Dikumpul</div>
                          <a href={submittedTasks[block.id].fileUrl} target="_blank" rel="noreferrer" style={st.btnPreview}><Eye size={14}/> Lihat File</a>
                        </div>
                      ) : isExpired ? (
                        <div style={st.lockedBadge}><AlertCircle size={16}/> Batas Waktu Terlewat</div>
                      ) : localFiles[block.id] ? (
                        <div style={st.previewContainer(isMobile)}>
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <FileDigit size={16} color="#673ab7"/><span>{localFiles[block.id].name}</span>
                            <button onClick={() => { const u = {...localFiles}; delete u[block.id]; setLocalFiles(u); }} style={st.btnClosePreview}><X size={12}/></button>
                          </div>
                          <button onClick={() => submitTask(block.id, block.title)} disabled={uploading[block.id]} style={st.btnSubmitFinal}>
                            {uploading[block.id] ? "Mengirim..." : <><Send size={14}/> Kirim Jawaban</>}
                          </button>
                        </div>
                      ) : (
                        <>
                          <input type="file" id={`file-${block.id}`} style={{display:'none'}} onChange={(e) => handleFileChange(e, block.id)} accept=".pdf,image/*" />
                          <label htmlFor={`file-${block.id}`} style={st.btnUpload(isMobile)}>📎 Pilih File Tugas</label>
                          <p style={{fontSize:10, color:'#94a3b8', marginTop:6}}>Maks 50MB (PDF/Gambar)</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* TAB KUIS */}
        {activeTab === 'kuis' && modul?.quizData?.length > 0 && (
          <div style={{...st.contentCard(isMobile), borderTop: `6px solid ${isQuizExpired ? '#ef4444' : '#673ab7'}`}}>
            <div style={st.quizHeader(isMobile)}>
              <div style={st.quizIconBox}><HelpCircle size={24} color="white"/></div>
              <div>
                <h2 style={{margin:0, fontSize: isMobile ? 18 : 22}}>Kuis Evaluasi</h2>
                {modul.deadlineQuiz && (
                  <p style={{margin:0, fontSize:12, color: isQuizExpired ? '#ef4444' : '#64748b'}}>
                    {getTimeRemaining(modul.deadlineQuiz)?.text || 'Deadline: ' + formatDate(modul.deadlineQuiz)}
                  </p>
                )}
              </div>
            </div>
            {modul.quizData.map((q, qIdx) => (
              <div key={q.id} style={st.quizItem}>
                <p style={st.questionText(isMobile)}><span style={st.qNumber}>{qIdx + 1}</span> {q.question}</p>
                <div style={st.optionsGrid}>
                  {q.options.map((opt, oIdx) => (
                    <button key={oIdx} disabled={quizSubmitted || isQuizExpired} onClick={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})}
                      style={{...st.optButton(isMobile), backgroundColor: quizAnswers[q.id] === oIdx ? '#673ab7' : '#f8fafc', color: quizAnswers[q.id] === oIdx ? 'white' : '#1e293b', borderColor: quizAnswers[q.id] === oIdx ? '#673ab7' : '#e2e8f0'}}>
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
                <div style={st.quizDoneBadge}><CheckCircle size={20}/> {quizSubmitted ? "Kuis Selesai" : "Batas Waktu Habis"}</div>
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
  heroSection: (m) => ({ height: m ? '250px' : '340px', position: 'relative', width: '100%', overflow: 'hidden' }),
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: (m) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))', padding: m ? '20px' : '40px 8%', color: 'white' }),
  backFloating: (m) => ({ position: 'absolute', top: m ? 15 : 25, left: m ? 15 : 25, zIndex: 10, background: 'white', border: 'none', padding: m ? '8px 12px' : '12px 24px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: '800', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', color:'#1e293b' }),
  badgeRow: { display: 'flex', gap: 10, marginBottom: 10, flexWrap:'wrap' },
  subjectBadge: { background: '#673ab7', padding: '6px 16px', borderRadius: '10px', fontSize: 10, fontWeight: '900', textTransform:'uppercase' },
  categoryBadge: { background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '10px', fontSize: 10, fontWeight:'bold' },
  mainTitle: (m) => ({ fontSize: m ? 20 : 30, margin: '0 0 10px', fontWeight: '900', lineHeight: 1.2 }),
  metaInfo: { display: 'flex', gap: 15, fontSize: 12, opacity: 0.9, alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', gap: 6 },
  progressContainer: { marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#10b981', borderRadius: 3, transition: 'width 0.5s' },
  progressText: { fontSize: 11, fontWeight: 'bold', color: '#10b981' },
  
  tabBar: (m) => ({ display: 'flex', gap: 4, background: 'white', margin: m ? '0 15px' : '0 20px', borderRadius: 14, padding: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', position: 'relative', zIndex: 5, top: m ? -20 : -30 }),
  tab: (active) => ({ flex: 1, padding: '10px', border: 'none', background: active ? '#673ab7' : 'transparent', color: active ? 'white' : '#64748b', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: '0.2s', whiteSpace: 'nowrap' }),
  
  contentWrapper: (m) => ({ maxWidth: '950px', margin: m ? '0 auto' : '-20px auto 0', padding: m ? '0 15px' : '0 20px' }),
  contentCard: (m) => ({ background: 'white', padding: m ? 20 : 30, borderRadius: m ? 16 : 22, marginBottom: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }),
  blockHeader: { marginBottom: 15, borderLeft: '4px solid #673ab7', paddingLeft: 12 },
  blockLabel: { fontSize: 10, fontWeight: '900', color: '#673ab7', marginBottom: 4 },
  blockTitle: (m) => ({ fontSize: m ? 18 : 22, margin: 0, color: '#0f172a', fontWeight: '800' }),
  textBody: (m) => ({ lineHeight: 1.8, color: '#334155', fontSize: m ? 14 : 16, whiteSpace: 'pre-wrap' }),
  mediaContainer: { marginTop: 15, borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', background:'#f8fafc' },
  mediaGroup: { display: 'flex', flexDirection: 'column' },
  pdfDownloadBox: { display:'flex', alignItems:'center', gap:15, padding:20, background:'#f8fafc', borderBottom:'1px solid #e2e8f0' },
  btnDownloadBase64: { background:'#673ab7', color:'white', padding:'8px 15px', borderRadius:10, textDecoration:'none', fontSize:12, fontWeight:'bold', display:'flex', alignItems:'center', gap:6, flexShrink: 0 },
  base64Img: { width:'100%', maxHeight:'500px', objectFit:'contain', background:'#0f172a' },
  mediaFooter: { padding: '12px 15px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnSmallLink: { fontSize: 12, fontWeight: '800', color: '#673ab7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 },
  iframe: (m) => ({ width: '100%', height: m ? '220px' : '450px', border: 'none' }),
  linkBox: (m) => ({ padding: m ? 15 : 25, display: 'flex', alignItems: 'center', gap: 15, background: '#f8fafc', borderRadius:15 }),
  linkIconCircle: { padding: 12, background: 'white', borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  btnLinkExternal: (m) => ({ color: 'white', background:'#673ab7', padding:'8px 15px', borderRadius:'10px', fontSize:12, fontWeight: '800', textDecoration: 'none', display:'inline-block', width: m ? '100%' : 'auto', textAlign:'center' }),
  
  deadlineAlert: { padding: '10px 15px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', fontSize: 13, marginBottom: 15 },
  assignmentBox: (m, expired) => ({ marginTop: 15, padding: m ? 15 : 20, borderRadius: 14, background: expired ? '#fef2f2' : '#fffbeb', border: '1px solid ' + (expired ? '#fecaca' : '#fde68a') }),
  previewContainer: (m) => ({ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white' }),
  btnClosePreview: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '2px 6px', borderRadius: 4, cursor: 'pointer', marginLeft: 'auto' },
  successUpload: { color: '#059669', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 6, background: '#dcfce7', padding: 10, borderRadius: 8 },
  btnPreview: { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 },
  lockedBadge: { color: '#ef4444', fontWeight: '800', background: '#fee2e2', padding: 10, borderRadius: 8, textAlign:'center' },
  btnUpload: (m) => ({ background: '#f59e0b', color: 'white', padding: '12px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: '800', fontSize: 13, display:'inline-block', width:'100%', textAlign:'center' }),
  btnSubmitFinal: { width: '100%', background: '#673ab7', color: 'white', border: 'none', padding: 10, borderRadius: 10, cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  
  quizHeader: (m) => ({ display: 'flex', alignItems: 'center', gap: 15, marginBottom: m ? 20 : 25 }),
  quizIconBox: { background: '#673ab7', padding: 10, borderRadius: 14 },
  quizItem: { marginBottom: 20 },
  questionText: (m) => ({ fontSize: m ? 15 : 17, fontWeight: '800', color: '#1e293b', marginBottom: 12, display: 'flex', gap: 10 }),
  qNumber: { background: '#f1f5f9', color: '#673ab7', minWidth: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:13, fontWeight: 'bold' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 8 },
  optButton: (m) => ({ padding: m ? '12px 14px' : '14px 18px', borderRadius: 12, border: '2px solid', textAlign: 'left', transition: '0.2s', fontSize: m ? 13 : 14, fontWeight: '700', cursor: 'pointer' }),
  quizFooter: { marginTop: 15 },
  btnSubmitQuiz: { width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#673ab7', color: 'white', fontWeight: '900', fontSize: 15, cursor: 'pointer' },
  quizDoneBadge: { textAlign: 'center', padding: 15, background: '#f0fdf4', color: '#15803d', borderRadius: 14, fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #bbf7d0' },
  emptyState: { textAlign: 'center', padding: 40, color: '#94a3b8' },
};

export default StudentModuleView;