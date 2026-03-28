import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
// PERBAIKAN: Import serverTimestamp dari firestore, bukan dari firebase/timestamp
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'; 
import { ArrowLeft, Play, FileText, HelpCircle, Send, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [modul, setModul] = useState(null);
  const [answers, setAnswers] = useState({}); 
  const [quizResult, setQuizResult] = useState(null);
  const [isLate, setIsLate] = useState(false);

  useEffect(() => {
    const fetchModul = async () => {
      try {
        const docRef = doc(db, "bimbel_modul", modulId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setModul(data);
          
          // Logika Cek Tenggat Waktu
          if (data.deadline) {
            const now = new Date();
            const deadlineDate = new Date(data.deadline);
            if (now > deadlineDate) setIsLate(true);
          }
        }
      } catch (error) {
        console.error("Error fetching modul:", error);
      }
    };
    if (modulId) fetchModul();
  }, [modulId]);

  const handleQuizSubmit = async (blockId, questions) => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[`${blockId}_${idx}`] === q.correct) score++;
    });
    
    const finalScore = Math.round((score / questions.length) * 100);
    setQuizResult(finalScore);

    try {
      await addDoc(collection(db, "quiz_results"), {
        modulId,
        modulTitle: modul.title,
        studentId: studentData.id,
        studentName: studentData.nama,
        score: finalScore,
        submittedAt: serverTimestamp() // Ini sekarang bekerja dengan benar
      });
      alert(`Kuis selesai! Skor kamu: ${finalScore}`);
    } catch (e) {
      console.error("Gagal simpan skor:", e);
    }
  };

  if (!modul) return <div style={{padding: 20, textAlign: 'center'}}>Memuat Materi...</div>;

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}><ArrowLeft size={18}/> Kembali ke Daftar</button>

      <div style={styles.header}>
        <h1 style={{margin: 0, fontSize: '24px', color: '#1e293b'}}>{modul.title}</h1>
        <p style={{color: '#64748b', marginTop: 10, fontSize: '14px'}}>{modul.desc || modul.description}</p>
        <div style={isLate ? styles.lateBadge : styles.deadlineBadge}>
          <Clock size={14}/> {isLate ? "Tenggat Berakhir: " : "Batas Pengumpulan: "} 
          {modul.deadline ? new Date(modul.deadline).toLocaleString() : "-"}
        </div>
      </div>

      {modul.contentBlocks?.map((block, index) => (
        <div key={block.id || index} style={styles.blockCard}>
          <div style={styles.blockType}>
            {block.type === 'materi' && <FileText size={16} color="#4285f4"/>}
            {block.type === 'media' && <Play size={16} color="#ea4335"/>}
            {block.type === 'quiz' && <HelpCircle size={16} color="#fbbc05"/>}
            <span style={{marginLeft: 8, fontWeight: 'bold', fontSize: '12px', color: '#64748b'}}>
              {block.type?.toUpperCase()}
            </span>
          </div>

          <h3 style={{margin: '15px 0', fontSize: '18px', color: '#334155'}}>{block.title}</h3>

          {block.type === 'materi' && <div style={styles.textBody}>{block.content}</div>}

          {block.type === 'media' && (
            <div style={styles.mediaBox}>
               <a href={block.content} target="_blank" rel="noreferrer" style={styles.link}>
                 Klik untuk Buka Link Materi / Video ↗
               </a>
            </div>
          )}

          {block.type === 'quiz' && (
            <div style={styles.quizBox}>
              {block.quizData?.map((q, qIdx) => (
                <div key={qIdx} style={{marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 15}}>
                  <p style={{fontWeight: '600', color: '#334155'}}>{qIdx + 1}. {q.q}</p>
                  {q.options?.map((opt, oIdx) => (
                    <label key={oIdx} style={styles.optionLabel}>
                      <input 
                        type="radio" 
                        name={`quiz_${block.id}_${qIdx}`}
                        onChange={() => setAnswers({...answers, [`${block.id}_${qIdx}`]: oIdx})}
                        disabled={quizResult !== null}
                      /> <span style={{marginLeft: 8}}>{opt}</span>
                    </label>
                  ))}
                </div>
              ))}
              {quizResult === null ? (
                <button onClick={() => handleQuizSubmit(block.id, block.quizData)} style={styles.submitBtn}>
                  <Send size={16}/> Kirim Jawaban Kuis
                </button>
              ) : (
                <div style={styles.scoreBoard}>Skor Kamu: {quizResult} / 100</div>
              )}
            </div>
          )}

          {block.type === 'assignment' && (
            <div style={styles.taskBox}>
              <p style={{fontSize: '14px', color: '#475569'}}>{block.content || "Silakan unggah file tugas Anda di sini."}</p>
              {isLate ? (
                <div style={{color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5, marginTop: 10}}>
                  <AlertTriangle size={14}/> Maaf, pengumpulan ditutup (Melewati tenggat).
                </div>
              ) : (
                <div style={{marginTop: 15}}>
                   <input type="file" style={{fontSize: '13px'}} />
                   <button style={styles.upBtn}>Kirim Tugas</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
  backBtn: { background: 'white', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '8px 15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  header: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 25 },
  deadlineBadge: { marginTop: 15, padding: '8px 12px', background: '#f0f9ff', color: '#0369a1', borderRadius: '6px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 8 },
  lateBadge: { marginTop: 15, padding: '8px 12px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 8 },
  blockCard: { background: 'white', padding: '25px', borderRadius: '15px', marginBottom: 20, boxShadow: '0 2px 5px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' },
  blockType: { display: 'flex', alignItems: 'center' },
  textBody: { lineHeight: '1.7', color: '#475569', whiteSpace: 'pre-wrap', fontSize: '15px' },
  mediaBox: { padding: '20px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', border: '1px dashed #cbd5e1' },
  link: { color: '#2563eb', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' },
  quizBox: { marginTop: 15 },
  optionLabel: { display: 'flex', alignItems: 'center', padding: '12px', background: '#f8fafc', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', border: '1px solid #f1f5f9' },
  submitBtn: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', marginTop: 10 },
  scoreBoard: { padding: '20px', background: '#f0fdf4', color: '#166534', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #bbf7d0', fontSize: '18px' },
  taskBox: { padding: '20px', background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '12px', marginTop: 10 },
  upBtn: { marginLeft: '10px', padding: '8px 15px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default StudentModuleView;