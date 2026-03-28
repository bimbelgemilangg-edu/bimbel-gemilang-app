import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/timestamp';
import { ArrowLeft, Play, FileText, HelpCircle, Send, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const [modul, setModul] = useState(null);
  const [answers, setAnswers] = useState({}); // Untuk Kuis
  const [quizResult, setQuizResult] = useState(null);
  const [isLate, setIsLate] = useState(false);

  useEffect(() => {
    const fetchModul = async () => {
      const docRef = doc(db, "bimbel_modul", modulId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setModul(data);
        // Cek Tenggat Waktu
        if (new Date() > new Date(data.deadline)) setIsLate(true);
      }
    };
    fetchModul();
  }, [modulId]);

  // LOGIKA HITUNG KUIS (RIIL)
  const handleQuizSubmit = async (blockId, questions) => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[`${blockId}_${idx}`] === q.correct) score++;
    });
    
    const finalScore = Math.round((score / questions.length) * 100);
    setQuizResult(finalScore);

    // Simpan ke Firebase Riil
    await addDoc(collection(db, "quiz_results"), {
      modulId,
      modulTitle: modul.title,
      studentId: studentData.id,
      studentName: studentData.nama,
      score: finalScore,
      submittedAt: serverTimestamp()
    });
    alert(`Kuis selesai! Skor kamu: ${finalScore}`);
  };

  if (!modul) return <div style={{padding: 20}}>Memuat Materi...</div>;

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}><ArrowLeft size={18}/> Kembali ke Daftar</button>

      {/* HEADER MATERI */}
      <div style={styles.header}>
        <h1 style={{margin: 0}}>{modul.title}</h1>
        <p style={{color: '#666', marginTop: 10}}>{modul.desc}</p>
        <div style={isLate ? styles.lateBadge : styles.deadlineBadge}>
          <Clock size={14}/> {isLate ? "Tenggat Berakhir: " : "Batas Pengumpulan: "} 
          {new Date(modul.deadline).toLocaleString()}
        </div>
      </div>

      {/* RENDER BLOK SECARA BERURUTAN */}
      {modul.contentBlocks.map((block, index) => (
        <div key={block.id} style={styles.blockCard}>
          <div style={styles.blockType}>
            {block.type === 'materi' && <FileText size={16} color="#4285f4"/>}
            {block.type === 'media' && <Play size={16} color="#ea4335"/>}
            {block.type === 'quiz' && <HelpCircle size={16} color="#fbbc05"/>}
            <span style={{marginLeft: 8, fontWeight: 'bold', fontSize: 12}}>{block.type.toUpperCase()}</span>
          </div>

          <h3 style={{margin: '10px 0'}}>{block.title}</h3>

          {/* KONTEN MATERI TEKS */}
          {block.type === 'materi' && <div style={styles.textBody}>{block.content}</div>}

          {/* KONTEN VIDEO/LINK */}
          {block.type === 'media' && (
            <div style={styles.mediaBox}>
               <a href={block.content} target="_blank" rel="noreferrer" style={styles.link}>
                 Klik untuk Buka Link Materi / Video External ↗
               </a>
            </div>
          )}

          {/* KONTEN KUIS (MODULAR) */}
          {block.type === 'quiz' && (
            <div style={styles.quizBox}>
              {block.quizData.map((q, qIdx) => (
                <div key={qIdx} style={{marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 15}}>
                  <p style={{fontWeight: '500'}}>{qIdx + 1}. {q.q}</p>
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} style={styles.optionLabel}>
                      <input 
                        type="radio" 
                        name={`quiz_${block.id}_${qIdx}`}
                        onChange={() => setAnswers({...answers, [`${block.id}_${qIdx}`]: oIdx})}
                        disabled={quizResult !== null}
                      /> {opt}
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

          {/* KONTEN UPLOAD TUGAS */}
          {block.type === 'assignment' && (
            <div style={styles.taskBox}>
              <p>{block.content || "Silakan unggah file tugas Anda di sini (PDF/Gambar)."}</p>
              {isLate ? (
                <div style={{color: 'red', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5}}>
                  <AlertTriangle size={14}/> Maaf, waktu pengumpulan sudah habis.
                </div>
              ) : (
                <input type="file" style={{marginTop: 10}} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '30px' },
  backBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 20 },
  header: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 25 },
  deadlineBadge: { marginTop: 15, padding: '8px 12px', background: '#e8f0fe', color: '#1967d2', borderRadius: '6px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 8 },
  lateBadge: { marginTop: 15, padding: '8px 12px', background: '#fce8e6', color: '#d93025', borderRadius: '6px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 8 },
  blockCard: { background: 'white', padding: '25px', borderRadius: '12px', marginBottom: 20, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  blockType: { display: 'flex', alignItems: 'center' },
  textBody: { lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' },
  mediaBox: { padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' },
  link: { color: '#1a73e8', fontWeight: 'bold', textDecoration: 'none' },
  quizBox: { marginTop: 15 },
  optionLabel: { display: 'block', padding: '10px', background: '#f8f9fa', marginBottom: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { background: '#673ab7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 },
  scoreBoard: { padding: '15px', background: '#e6fffa', color: '#2c7a7b', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #b2f5ea' },
  taskBox: { padding: '20px', border: '2px dashed #ddd', borderRadius: '8px', marginTop: 10 }
};

export default StudentModuleView;