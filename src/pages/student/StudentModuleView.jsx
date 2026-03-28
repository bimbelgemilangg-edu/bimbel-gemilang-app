import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { 
  ArrowLeft, Clock, BookOpen, FileText, 
  CheckCircle, UploadCloud, Eye, Link as LinkIcon,
  HelpCircle, ChevronRight, PlayCircle, AlertCircle
} from 'lucide-react';

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [modul, setModul] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({}); 
  const [submittedTasks, setSubmittedTasks] = useState({}); 
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  // State untuk status deadline
  const [isTugasExpired, setIsTugasExpired] = useState(false);
  const [isQuizExpired, setIsQuizExpired] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const docRef = doc(db, "bimbel_modul", modulId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setModul(data);
          
          // Cek Deadline secara real-time
          const now = new Date();
          if (data.deadlineTugas) setIsTugasExpired(now > new Date(data.deadlineTugas));
          if (data.deadlineQuiz) setIsQuizExpired(now > new Date(data.deadlineQuiz));
          
          checkExistingSubmissions(modulId);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [modulId]);

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

  const handleTaskUpload = async (e, blockId, blockTitle) => {
    if (isTugasExpired) return alert("❌ Maaf, waktu pengumpulan tugas sudah berakhir.");
    
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
          fileUrl: reader.result, 
          submittedAt: serverTimestamp(),
          status: "Pending",
          isLate: isTugasExpired // Tandai jika terlambat
        };

        await addDoc(collection(db, "jawaban_tugas"), payload);
        setSubmittedTasks({ ...submittedTasks, [blockId]: reader.result });
        alert("🚀 Catatan berhasil diunggah!");
      } catch (err) {
        alert("Gagal upload: " + err.message);
      } finally {
        setUploading({ ...uploading, [blockId]: false });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuizSubmit = async () => {
    if (isQuizExpired) return alert("❌ Maaf, kuis sudah ditutup.");
    if (Object.keys(quizAnswers).length < (modul?.quizData?.length || 0)) {
      return alert("Mohon selesaikan semua pertanyaan kuis!");
    }
    
    try {
      const payload = {
        modulId,
        studentId: studentData?.uid,
        studentName: studentData?.nama,
        answers: quizAnswers,
        submittedAt: serverTimestamp(),
        type: "quiz",
        isLate: isQuizExpired
      };
      await addDoc(collection(db, "jawaban_kuis"), payload);
      setQuizSubmitted(true);
      alert("✅ Jawaban kuis berhasil dikirim!");
    } catch (err) {
      alert("Gagal kirim kuis: " + err.message);
    }
  };

  if (loading) return <div style={st.loader}>Membuka Ruang Belajar...</div>;

  return (
    <div style={st.container}>
      <div style={st.heroSection}>
        <button onClick={onBack} style={st.backFloating}><ArrowLeft size={18} /> Kembali</button>
        <img 
          src={modul?.coverUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000"} 
          style={st.heroImg} 
          alt="Cover" 
        />
        <div style={st.heroOverlay}>
          <div style={st.badgeRow}>
            <span style={st.subjectBadge}>{modul?.subject || "Umum"}</span>
            {modul?.releaseDate && <span style={st.releaseBadge}><Clock size={12}/> Rilis: {new Date(modul.releaseDate).toLocaleDateString()}</span>}
          </div>
          <h1 style={st.mainTitle}>{modul?.title}</h1>
          <div style={st.metaInfo}>
             {modul?.deadlineTugas && (
               <span style={{...st.deadlineInfo, color: isTugasExpired ? '#ff4d4d' : 'white'}}>
                 <Clock size={14}/> {isTugasExpired ? "Tugas Berakhir" : `Deadline Tugas: ${new Date(modul.deadlineTugas).toLocaleString()}`}
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
                {block.type === 'assignment' ? 'PENUGASAN' : `BAGIAN ${idx + 1}`}
              </div>
              <h3 style={st.blockTitle}>{block.title}</h3>
            </div>

            {block.type === 'text' && <div style={st.textBody}>{block.content}</div>}

            {block.type === 'video' && (
              <div style={st.mediaContainer}>
                {block.content.includes('canva.com') ? (
                  <div style={st.iframeWrapper}>
                    <iframe src={block.content} style={st.iframe} allowFullScreen title="Canva Materi"></iframe>
                  </div>
                ) : block.content.includes('youtube.com') || block.content.includes('youtu.be') ? (
                  <div style={st.iframeWrapper}>
                    <iframe 
                      src={`https://www.youtube.com/embed/${block.content.split('v=')[1] || block.content.split('/').pop()}`} 
                      style={st.iframe} 
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div style={st.linkBox}>
                    <LinkIcon size={20}/>
                    <a href={block.content} target="_blank" rel="noreferrer" style={st.btnLinkExternal}>Buka Materi Eksternal ↗</a>
                  </div>
                )}
              </div>
            )}

            {block.type === 'assignment' && (
              <div style={{...st.assignmentBox, border: isTugasExpired ? '1px solid #ffcccc' : '1px solid #fef3c7', background: isTugasExpired ? '#fff5f5' : '#fffbeb'}}>
                <div style={st.assignInfo}>
                   <div style={st.iconCircle}><UploadCloud size={20} color={isTugasExpired ? "#ff4d4d" : "#f39c12"}/></div>
                   <div>
                      <p style={{...st.assignTitle, color: isTugasExpired ? '#cc0000' : '#92400e'}}>
                        Instruksi Tugas {isTugasExpired && "(Waktu Habis)"}
                      </p>
                      <p style={st.assignText}>{block.content}</p>
                   </div>
                </div>

                {submittedTasks[block.id] ? (
                  <div style={st.successUpload}>
                    <CheckCircle size={18}/> <span>Sudah Dikumpul</span>
                  </div>
                ) : isTugasExpired ? (
                  <div style={{color: '#ff4d4d', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5}}>
                    <AlertCircle size={18}/> Terkunci
                  </div>
                ) : (
                  <div style={st.uploadAction}>
                    <input 
                      type="file" id={`file-${block.id}`} 
                      style={{display:'none'}} 
                      onChange={(e) => handleTaskUpload(e, block.id, block.title)}
                    />
                    <label htmlFor={`file-${block.id}`} style={uploading[block.id] ? st.btnLoading : st.btnUpload}>
                      {uploading[block.id] ? "Mengirim..." : "Unggah Catatan"}
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {modul?.quizData?.length > 0 && (
          <div style={{...st.contentCard, borderTop: isQuizExpired ? '5px solid #ff4d4d' : '5px solid #673ab7'}}>
             <div style={st.quizHeader}>
                <HelpCircle size={24} color={isQuizExpired ? "#ff4d4d" : "#673ab7"}/>
                <h2 style={{margin:0, fontSize:22}}>Kuis {isQuizExpired && "(Ditutup)"}</h2>
             </div>
             
             {modul.quizData.map((q, qIdx) => (
               <div key={q.id} style={st.quizItem}>
                  <p style={st.questionText}>{qIdx + 1}. {q.question}</p>
                  <div style={st.optionsGrid}>
                     {q.options.map((opt, oIdx) => (
                       <button 
                         key={oIdx}
                         disabled={quizSubmitted || isQuizExpired}
                         onClick={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})}
                         style={{
                           ...st.optButton,
                           backgroundColor: quizAnswers[q.id] === oIdx ? (isQuizExpired ? '#ff4d4d' : '#673ab7') : 'white',
                           color: quizAnswers[q.id] === oIdx ? 'white' : '#1e293b',
                           opacity: isQuizExpired && quizAnswers[q.id] !== oIdx ? 0.6 : 1,
                           cursor: isQuizExpired ? 'not-allowed' : 'pointer'
                         }}
                       >
                         {opt}
                       </button>
                     ))}
                  </div>
               </div>
             ))}

             {!quizSubmitted && !isQuizExpired ? (
               <button onClick={handleQuizSubmit} style={st.btnSubmitQuiz}>Kirim Jawaban Kuis</button>
             ) : isQuizExpired ? (
               <div style={{...st.quizDoneBadge, background: '#fff5f5', color: '#cc0000'}}>
                 <AlertCircle size={20}/> Waktu pengerjaan kuis telah berakhir.
               </div>
             ) : (
               <div style={st.quizDoneBadge}><CheckCircle size={20}/> Anda telah menyelesaikan kuis ini</div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

const st = {
  container: { background: '#f0f2f5', minHeight: '100vh', paddingBottom: 100 },
  loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#673ab7' },
  heroSection: { height: '350px', position: 'relative', width: '100%', overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '40px 8%', color: 'white' },
  backFloating: { position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  badgeRow: { display: 'flex', gap: 10, marginBottom: 15 },
  subjectBadge: { background: '#673ab7', padding: '5px 15px', borderRadius: '8px', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  releaseBadge: { background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 },
  mainTitle: { fontSize: 32, margin: '0 0 10px', fontWeight: '800' },
  metaInfo: { display: 'flex', gap: 20, fontSize: 13 },
  deadlineInfo: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' },
  contentWrapper: { maxWidth: '900px', margin: '-40px auto 0', position: 'relative', zIndex: 5, padding: '0 20px' },
  contentCard: { background: 'white', padding: '35px', borderRadius: '24px', marginBottom: 25, boxShadow: '0 10px 25px rgba(0,0,0,0.03)' },
  blockHeader: { marginBottom: 20 },
  blockLabel: { fontSize: 10, fontWeight: 'bold', color: '#673ab7', background: '#f3e8ff', padding: '4px 12px', borderRadius: '6px', display: 'inline-block', marginBottom: 8 },
  blockTitle: { fontSize: 24, margin: 0, color: '#1e293b', fontWeight: '700' },
  textBody: { lineHeight: 1.8, color: '#475569', fontSize: 16, whiteSpace: 'pre-wrap' },
  mediaContainer: { marginTop: 20, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  iframeWrapper: { width: '100%', height: '500px', background: '#000' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  linkBox: { padding: '20px', display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc' },
  btnLinkExternal: { color: '#673ab7', fontWeight: 'bold', textDecoration: 'none' },
  assignmentBox: { marginTop: 20, padding: '25px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  assignInfo: { display: 'flex', gap: 15, alignItems: 'flex-start' },
  iconCircle: { background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  assignTitle: { margin: 0, fontWeight: 'bold' },
  assignText: { margin: '4px 0 0', fontSize: 14, color: '#64748b' },
  btnUpload: { background: '#f59e0b', color: 'white', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },
  btnLoading: { background: '#ccc', color: 'white', padding: '12px 25px', borderRadius: '12px', cursor: 'not-allowed' },
  successUpload: { color: '#059669', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, background: '#ecfdf5', padding: '10px 20px', borderRadius: '12px' },
  quizHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 },
  quizItem: { marginBottom: 30, paddingBottom: 20, borderBottom: '1px dashed #e2e8f0' },
  questionText: { fontSize: 17, fontWeight: '600', color: '#1e293b', marginBottom: 15 },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  optButton: { padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'left', transition: '0.2s', fontSize: 14, fontWeight: '500' },
  btnSubmitQuiz: { width: '100%', padding: '16px', borderRadius: '15px', border: 'none', background: '#673ab7', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginTop: 10 },
  quizDoneBadge: { textAlign: 'center', padding: '20px', background: '#f0fdf4', color: '#15803d', borderRadius: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }
};

export default StudentModuleView;