import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { ArrowLeft, Clock, FileText, CheckCircle, UploadCloud, Eye, Link as LinkIcon, HelpCircle, AlertCircle, FileDigit, User, Trash2, X, Send, Zap, Calendar, Maximize2, Download } from 'lucide-react';

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
          if (data.deadline) setIsTugasExpired(now > new Date(data.deadline));
          if (data.deadlineQuiz) setIsQuizExpired(now > new Date(data.deadlineQuiz));
          checkExistingSubmissions(modulId);
          checkQuizStatus(modulId);
        }
      } catch (err) { console.error(err); } 
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
    snap.forEach(doc => { completed[doc.data().blockId] = { docId: doc.id, fileUrl: doc.data().fileUrl, fileName: doc.data().fileName || "Lihat File" }; });
    setSubmittedTasks(completed);
  };

  const checkQuizStatus = async (mId) => {
    if (!studentData?.uid && !studentData?.id) return;
    const studentId = studentData.uid || studentData.id;
    const q = query(collection(db, "jawaban_kuis"), where("modulId", "==", mId), where("studentId", "==", studentId));
    const snap = await getDocs(q);
    if (!snap.empty) setQuizSubmitted(true);
  };

  const formatDate = (ts) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleFileChange = (e, blockId) => {
    if (isTugasExpired) return alert("❌ Deadline terlewat.");
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return alert("❌ Format: PDF, DOCX, atau Gambar.");
    if (file.size > 50 * 1024 * 1024) return alert("Maks 50MB.");
    const reader = new FileReader();
    reader.onloadend = () => setLocalFiles({...localFiles, [blockId]: { name: file.name, data: reader.result, type: file.type, size: (file.size/1024).toFixed(1)+" KB" }});
    reader.readAsDataURL(file);
  };

  const submitTask = async (blockId, blockTitle) => {
    const f = localFiles[blockId];
    if (!f) return;
    setUploading({...uploading, [blockId]: true});
    try {
      const { uploadToDrive } = await import('../../services/uploadService');
      const result = await uploadToDrive(f.data, f.name, f.type);
      if (result.success) {
        const payload = { modulId, modulTitle: modul.title, blockId, blockTitle, studentId: studentData?.uid || studentData?.id, studentName: studentData?.nama, studentClass: studentData?.kelasSekolah || 'Umum', fileUrl: result.downloadURL, fileName: f.name, filePath: result.filePath, submittedAt: serverTimestamp(), status: 'Pending', type: 'assignment' };
        const docRef = await addDoc(collection(db, 'jawaban_tugas'), payload);
        setSubmittedTasks({...submittedTasks, [blockId]: { docId: docRef.id, fileUrl: result.downloadURL, fileName: f.name }});
        const updated = {...localFiles}; delete updated[blockId]; setLocalFiles(updated);
        alert('✅ Tugas terupload!');
      }
    } catch (err) { alert('❌ Gagal: '+err.message); } 
    finally { setUploading({...uploading, [blockId]: false}); }
  };

  const handleDeleteTask = async (blockId) => {
    if (isTugasExpired) return alert("❌ Tidak bisa menarik.");
    if (!window.confirm("Tarik tugas?")) return;
    try {
      const info = submittedTasks[blockId];
      if (info?.docId) { await deleteDoc(doc(db, "jawaban_tugas", info.docId)); const ns = {...submittedTasks}; delete ns[blockId]; setSubmittedTasks(ns); }
    } catch (err) { alert("Gagal."); }
  };

  const handleQuizSubmit = async () => {
    if (isQuizExpired) return alert("❌ Kuis ditutup.");
    const qd = modul?.quizData || [];
    if (qd.length === 0) return alert("Tidak ada soal.");
    const unas = qd.filter(q => quizAnswers[q.id] === undefined);
    if (unas.length > 0) return alert(`❌ ${unas.length} soal belum dijawab.`);
    if (!window.confirm("Kirim kuis?")) return;
    try {
      let correct = 0;
      qd.forEach(q => { if (quizAnswers[q.id] === q.correctAnswer) correct++; });
      const score = Math.round((correct / qd.length) * 100);
      await addDoc(collection(db, "jawaban_kuis"), { modulId, modulTitle: modul.title, studentId: studentData?.uid || studentData?.id, studentName: studentData?.nama, studentClass: studentData?.kelasSekolah || "Umum", answers: quizAnswers, correctAnswers: correct, totalQuestions: qd.length, score, submittedAt: serverTimestamp(), status: "Dinilai", gradedAt: serverTimestamp(), type: "quiz" });
      setQuizSubmitted(true);
      alert(`🎉 Nilai: ${score}\nBenar: ${correct}/${qd.length}`);
    } catch (err) { alert("Gagal."); }
  };

  const renderSmartMedia = (block) => {
    const contentUrl = block.content || block.fileUrl || block.url || block.file;
    if (!contentUrl) return null;
    const fName = block.fileName || "Dokumen";
    const fType = block.mimeType || "";

    // 🔥 DETEKSI DOKUMEN (PDF, DOCX, DOC, PPT)
    const isDocument = fType === 'application/pdf' || 
      fType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fType === 'application/msword' ||
      fType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      fType === 'application/vnd.ms-powerpoint' ||
      contentUrl.startsWith('data:application/pdf') || 
      contentUrl.toLowerCase().includes('.pdf') || 
      contentUrl.toLowerCase().includes('.docx') || 
      contentUrl.toLowerCase().includes('.doc') ||
      contentUrl.toLowerCase().includes('.ppt') ||
      contentUrl.includes('supabase');

    if (isDocument) {
      const embedSrc = `https://docs.google.com/viewer?url=${encodeURIComponent(contentUrl)}&embedded=true`;
      return (
        <div style={st.mediaGroup}>
          <div style={st.pdfDownloadBox}>
            <FileText size={40} color="#673ab7" />
            <div style={{flex: 1, overflow: 'hidden'}}>
              <h4 style={{margin: '0 0 5px 0', fontSize: 16, color: '#1e293b'}}>Dokumen Materi</h4>
              <p style={{margin: 0, fontSize: 12, color: '#64748b'}}>{fName}</p>
            </div>
            <a href={contentUrl} target="_blank" rel="noreferrer" download style={{background:'#673ab7',color:'white',padding:'8px 15px',borderRadius:10,textDecoration:'none',fontSize:12,fontWeight:'bold',display:'flex',alignItems:'center',gap:6,flexShrink:0}}><Download size={16}/> Unduh</a>
          </div>
          <iframe src={embedSrc} style={{width:'100%',height:isMobile?250:450,border:'none'}} title="Viewer" loading="lazy"></iframe>
        </div>
      );
    }

    const isImage = contentUrl.startsWith('data:image/') || contentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || fType.startsWith('image/');
    if (isImage) {
      return (
        <div style={st.mediaGroup}>
          <img src={contentUrl} style={{width:'100%',maxHeight:500,objectFit:'contain',background:'#0f172a'}} alt="" />
          <div style={{padding:12,background:'white',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,color:'#64748b'}}>{fName}</span>
            <a href={contentUrl} target="_blank" rel="noreferrer" download style={{fontSize:12,fontWeight:800,color:'#673ab7',textDecoration:'none'}}><Download size={12}/> Unduh</a>
          </div>
        </div>
      );
    }

    let embedUrl = contentUrl;
    let showIframe = false;
    if (contentUrl.includes('youtube.com') || contentUrl.includes('youtu.be')) {
      const vid = contentUrl.split('v=')[1]?.split('&')[0] || contentUrl.split('/').pop();
      embedUrl = `https://www.youtube.com/embed/${vid}`;
      showIframe = true;
    } else if (contentUrl.includes('canva.com') || contentUrl.includes('docs.google.com')) {
      showIframe = true;
    }

    if (showIframe) {
      return (
        <div style={st.mediaGroup}>
          <div style={{width:'100%',background:'#000'}}><iframe src={embedUrl} style={{width:'100%',height:isMobile?250:450,border:'none'}} allowFullScreen title="Preview" loading="lazy"></iframe></div>
          <div style={{padding:12,background:'white',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,color:'#64748b',display:'flex',alignItems:'center',gap:4}}><Zap size={12} color="#f59e0b"/> Preview</span>
            <a href={contentUrl} target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:800,color:'#673ab7',textDecoration:'none'}}><Maximize2 size={12}/> Layar Penuh</a>
          </div>
        </div>
      );
    }

    return (
      <div style={{padding:isMobile?15:25,display:'flex',alignItems:'center',gap:15,background:'#f8fafc',borderRadius:15}}>
        <div style={{padding:12,background:'white',borderRadius:12}}><LinkIcon size={20} color="#673ab7"/></div>
        <div style={{flex:1,overflow:'hidden'}}>
          <p style={{margin:0,fontSize:11,color:'#94a3b8',fontWeight:'bold'}}>TAUTAN MATERI</p>
          <p style={{margin:'2px 0 8px',fontSize:14,color:'#1e293b',fontWeight:600}}>{contentUrl}</p>
          <a href={contentUrl} target="_blank" rel="noreferrer" style={{color:'white',background:'#673ab7',padding:'8px 15px',borderRadius:10,fontSize:12,fontWeight:800,textDecoration:'none',display:'inline-block'}}>Buka Link ↗</a>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{height:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:15,fontWeight:'bold',color:'#673ab7'}}><div style={{width:40,height:40,border:'4px solid #f3e8ff',borderTop:'4px solid #673ab7',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div> Membuka...</div>;

  return (
    <div style={{background:'#f8fafc',minHeight:'100vh',paddingBottom:100}}>
      {/* HERO */}
      <div style={{height:isMobile?220:300,position:'relative',width:'100%',overflow:'hidden'}}>
        <button onClick={onBack} style={{position:'absolute',top:isMobile?12:20,left:isMobile?12:20,zIndex:10,background:'white',border:'none',padding:isMobile?'8px 12px':'10px 18px',borderRadius:30,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:800,boxShadow:'0 10px 25px rgba(0,0,0,0.15)',color:'#1e293b',fontSize:isMobile?11:13}}><ArrowLeft size={14}/> {!isMobile&&'Kembali'}</button>
        <img src={modul?.coverImage||"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000"} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
        <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(15,23,42,0.95))',padding:isMobile?'20px':'40px 8%',color:'white'}}>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <span style={{background:'#673ab7',padding:'4px 12px',borderRadius:8,fontSize:9,fontWeight:800}}>{modul?.subject||'Umum'}</span>
            <span style={{background:'rgba(255,255,255,0.2)',padding:'4px 12px',borderRadius:8,fontSize:9,fontWeight:700}}>{modul?.targetKategori||'Semua'}</span>
          </div>
          <h1 style={{fontSize:isMobile?18:28,margin:'0 0 8px',fontWeight:900,lineHeight:1.2}}>{modul?.title}</h1>
          <div style={{display:'flex',gap:12,fontSize:11,opacity:0.9}}><span><User size={12}/> {modul?.authorName||'Guru'}</span><span><Calendar size={12}/> {formatDate(modul?.createdAt)}</span></div>
        </div>
      </div>

      {/* KONTEN */}
      <div style={{maxWidth:900,margin:isMobile?'-15px auto 0':'-35px auto 0',padding:isMobile?'0 12px':'0 20px',position:'relative',zIndex:5}}>
        {modul?.blocks?.map((block, idx) => (
          <div key={block.id} style={{background:'white',padding:isMobile?18:30,borderRadius:isMobile?16:22,marginBottom:15,boxShadow:'0 4px 12px rgba(0,0,0,0.03)',border:'1px solid #f1f5f9'}}>
            <div style={{marginBottom:15,borderLeft:'4px solid #673ab7',paddingLeft:12}}>
              <div style={{fontSize:9,fontWeight:800,color:'#673ab7',marginBottom:3}}>{block.type==='assignment'?'📝 TUGAS':block.type==='file'?'📁 FILE':block.type==='video'?'🔗 LINK':'📄 BAGIAN '+(idx+1)}</div>
              <h3 style={{fontSize:isMobile?18:22,margin:0,color:'#0f172a',fontWeight:800}}>{block.title}</h3>
            </div>

            {block.type==='text'&&<div style={{lineHeight:1.8,color:'#334155',fontSize:isMobile?14:16,whiteSpace:'pre-wrap'}}>{block.content}</div>}
            {(block.type==='video'||block.type==='file')&&<div style={{marginTop:15,borderRadius:14,overflow:'hidden',border:'1px solid #e2e8f0'}}>{renderSmartMedia(block)}</div>}

            {block.type==='assignment'&&(
              <div style={{marginTop:15,padding:isMobile?15:20,borderRadius:14,background:isTugasExpired?'#fef2f2':'#fffbeb',border:'1px solid '+(isTugasExpired?'#fecaca':'#fde68a')}}>
                <div style={{display:'flex',gap:10,marginBottom:15}}>
                  <div style={{padding:10,background:'white',borderRadius:10}}><UploadCloud size={18} color={isTugasExpired?"#ef4444":"#f59e0b"}/></div>
                  <div><b style={{fontSize:14}}>Instruksi Tugas</b><p style={{margin:'4px 0 0',fontSize:12,color:'#64748b'}}>{block.content}</p></div>
                </div>

                {submittedTasks[block.id] ? (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{color:'#059669',fontWeight:700,background:'#dcfce7',padding:10,borderRadius:8,display:'flex',alignItems:'center',gap:6}}><CheckCircle size={16}/> Terkumpul</div>
                    <a href={submittedTasks[block.id].fileUrl} target="_blank" rel="noreferrer" style={{background:'#f1f5f9',color:'#64748b',border:'none',padding:10,borderRadius:8,fontSize:12,fontWeight:600,textDecoration:'none',textAlign:'center'}}><Eye size={14}/> Lihat</a>
                    {!isTugasExpired&&<button onClick={()=>handleDeleteTask(block.id)} style={{background:'#fee2e2',color:'#ef4444',border:'none',padding:10,borderRadius:8,fontWeight:700,fontSize:12}}>Tarik Data</button>}
                  </div>
                ) : isTugasExpired ? (
                  <div style={{color:'#ef4444',fontWeight:700,background:'#fee2e2',padding:10,borderRadius:8,textAlign:'center'}}>⛔ Deadline Terlewat</div>
                ) : localFiles[block.id] ? (
                  <div style={{padding:12,borderRadius:10,border:'1px solid #e2e8f0',background:'white'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}><FileDigit size={16} color="#673ab7"/><span style={{fontSize:12,fontWeight:700}}>{localFiles[block.id].name}</span><button onClick={()=>{const u={...localFiles};delete u[block.id];setLocalFiles(u);}} style={{marginLeft:'auto',background:'#fee2e2',color:'#ef4444',border:'none',padding:'4px 8px',borderRadius:4,cursor:'pointer'}}><X size={12}/></button></div>
                    <button onClick={()=>submitTask(block.id,block.title)} disabled={uploading[block.id]} style={{width:'100%',marginTop:8,padding:10,background:'#673ab7',color:'white',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer'}}>{uploading[block.id]?'Mengirim...':'Kirim Jawaban'}</button>
                  </div>
                ) : (
                  <label style={{display:'block',background:'#f59e0b',color:'white',padding:12,borderRadius:8,textAlign:'center',fontWeight:700,fontSize:12,cursor:'pointer'}}>📎 Pilih File (PDF/DOCX/Gambar, Max 50MB)<input type="file" accept=".pdf,.doc,.docx,image/*" hidden onChange={(e)=>handleFileChange(e,block.id)} /></label>
                )}
              </div>
            )}
          </div>
        ))}

        {/* KUIS */}
        {modul?.quizData?.length>0&&(
          <div style={{...{background:'white',padding:isMobile?18:30,borderRadius:isMobile?16:22,marginBottom:15,boxShadow:'0 4px 12px rgba(0,0,0,0.03)',border:'1px solid #f1f5f9'},borderTop:'5px solid '+(isQuizExpired?'#ef4444':'#673ab7')}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <div style={{background:'#673ab7',padding:10,borderRadius:12}}><HelpCircle size={22} color="white"/></div>
              <div><h2 style={{margin:0,fontSize:isMobile?16:20}}>Kuis Evaluasi</h2>{modul.deadlineQuiz&&<p style={{margin:0,fontSize:11,color:isQuizExpired?'#ef4444':'#64748b'}}>Deadline: {formatDate(modul.deadlineQuiz)}</p>}</div>
            </div>
            {modul.quizData.map((q,qIdx)=>(
              <div key={q.id} style={{marginBottom:20}}>
                <p style={{fontSize:isMobile?14:16,fontWeight:800,color:'#1e293b',display:'flex',gap:10}}><span style={{background:'#f1f5f9',color:'#673ab7',minWidth:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>{qIdx+1}</span>{q.question}</p>
                <div style={{display:'grid',gap:8}}>
                  {q.options.map((opt,oIdx)=>(
                    <button key={oIdx} disabled={quizSubmitted||isQuizExpired} onClick={()=>setQuizAnswers({...quizAnswers,[q.id]:oIdx})} style={{padding:isMobile?'10px 14px':'12px 16px',borderRadius:10,border:'2px solid',textAlign:'left',fontSize:isMobile?13:14,fontWeight:700,cursor:'pointer',background:quizAnswers[q.id]===oIdx?'#673ab7':'#f8fafc',color:quizAnswers[q.id]===oIdx?'white':'#1e293b',borderColor:quizAnswers[q.id]===oIdx?'#673ab7':'#e2e8f0'}}>
                      <span style={{opacity:0.6,marginRight:6}}>{String.fromCharCode(65+oIdx)}.</span>{opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{marginTop:15}}>
              {!quizSubmitted&&!isQuizExpired?<button onClick={handleQuizSubmit} style={{width:'100%',padding:14,borderRadius:12,border:'none',background:'#673ab7',color:'white',fontWeight:800,fontSize:15,cursor:'pointer'}}>Kirim Jawaban Kuis</button>:<div style={{textAlign:'center',padding:15,background:'#f0fdf4',color:'#15803d',borderRadius:12,fontWeight:700}}>✅ {quizSubmitted?'Kuis Selesai':'Waktu Habis'}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const st = {
  mediaGroup: { display: 'flex', flexDirection: 'column' },
  pdfDownloadBox: { display:'flex',alignItems:'center',gap:15,padding:20,background:'#f8fafc',borderBottom:'1px solid #e2e8f0' },
};

export default StudentModuleView;