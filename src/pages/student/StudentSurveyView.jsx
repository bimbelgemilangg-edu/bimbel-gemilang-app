// src/pages/student/StudentSurveyView.jsx
// ============================================================
// 🔥 HALAMAN INI SEBELUMNYA TIDAK ADA SAMA SEKALI. Dashboard sudah
// menaruh tombol "Isi Sekarang" yang mengarah ke /siswa/survei/:id,
// tapi halaman tujuannya belum pernah dibuat, dan rute itu juga belum
// terdaftar di App.jsx — makanya siswa yang klik langsung "kepental"
// (dilempar balik ke halaman awal karena rute tidak dikenal).
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, Send, AlertCircle } from 'lucide-react';

const StudentSurveyView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const studentId = localStorage.getItem('studentId') || '';
  const studentName = localStorage.getItem('studentName') || 'Siswa';
  const studentNim = localStorage.getItem('studentNim') || studentId;

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const snap = await getDoc(doc(db, 'surveys', id));
        if (!snap.exists()) {
          setSurvey(null);
          setLoading(false);
          return;
        }
        setSurvey({ id: snap.id, ...snap.data() });

        // 🔥 Cek apakah siswa ini SUDAH PERNAH mengisi survei ini, biar
        // gak bisa submit dobel. Dicek ke beberapa kemungkinan nama field
        // sekaligus (konsisten dengan cara dashboard mengecek hal yang sama).
        const respSnap = await getDocs(
          query(collection(db, 'survey_responses'), where('surveyId', '==', id))
        );
        const sudahIsi = respSnap.docs.some(d => {
          const r = d.data();
          return [r.userId, r.studentId, r.respondentId, r.nim].some(v => v && v === studentNim);
        });
        setAlreadyAnswered(sudahIsi);
      } catch (err) {
        console.error('Gagal ambil survei:', err);
      }
      setLoading(false);
    };
    fetchSurvey();
  }, [id, studentNim]);

  const handleAnswer = (qIndex, value) => {
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const allAnswered = survey?.questions?.every((_, i) => (answers[i] || '').toString().trim().length > 0);

  const handleSubmit = async () => {
    if (!allAnswered) {
      alert('⚠️ Semua pertanyaan wajib dijawab dulu sebelum mengirim.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'survey_responses'), {
        surveyId: id,
        // 🔥 Disimpan dengan beberapa nama field sekaligus supaya konsisten
        // dan tahan banting terhadap bagian sistem lain yang mengecek
        // beda-beda nama field (userId/studentId/respondentId/nim).
        studentId: studentNim,
        userId: studentNim,
        respondentId: studentNim,
        nim: studentNim,
        userName: studentName,
        userRole: 'siswa',
        answers: (survey.questions || []).map((q, i) => ({ question: q.question, answer: answers[i] || '' })),
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      alert('❌ Gagal mengirim jawaban: ' + err.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!survey) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <AlertCircle size={44} color="#ef4444" />
        <h3 style={{ marginTop: 12 }}>Survei tidak ditemukan</h3>
        <p style={{ color: '#64748b', fontSize: 13 }}>Mungkin sudah dihapus oleh admin.</p>
        <button onClick={() => navigate('/siswa/dashboard')} style={{ marginTop: 12, padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  if (submitted || alreadyAnswered) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 24 }}>
        <CheckCircle size={56} color="#10b981" />
        <h2 style={{ marginTop: 16, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
          {submitted ? 'Terima kasih!' : 'Sudah Pernah Diisi'}
        </h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
          {submitted ? 'Jawabanmu untuk survei ini sudah tersimpan.' : 'Kamu sudah mengisi survei ini sebelumnya.'}
        </p>
        <button onClick={() => navigate('/siswa/dashboard')} style={{ marginTop: 20, padding: '10px 22px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 60px' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
        <ArrowLeft size={16} /> Kembali
      </button>

      {survey.coverImage && (
        <img src={survey.coverImage} alt={survey.title} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 16, marginBottom: 16 }} />
      )}

      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: survey.isRequired ? '#fee2e2' : '#e0e7ff', color: survey.isRequired ? '#ef4444' : '#3730a3' }}>
          {survey.isRequired ? '🔴 WAJIB DIISI' : '🔵 OPSIONAL'}
        </span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '8px 0 20px' }}>{survey.title}</h1>

      {(survey.questions || []).map((q, i) => (
        <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
            {i + 1}. {q.question}
          </div>

          {q.type === 'teks' ? (
            <textarea
              value={answers[i] || ''}
              onChange={e => handleAnswer(i, e.target.value)}
              placeholder="Tulis jawabanmu..."
              rows={3}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(q.options || []).filter(o => o).map((opt, oi) => (
                <label key={oi} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${answers[i] === opt ? '#3b82f6' : '#e2e8f0'}`,
                  background: answers[i] === opt ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: 13,
                }}>
                  <input
                    type="radio"
                    name={`q-${i}`}
                    checked={answers[i] === opt}
                    onChange={() => handleAnswer(i, opt)}
                    style={{ accentColor: '#3b82f6' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={submitting || !allAnswered}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14,
          background: (!allAnswered || submitting) ? '#cbd5e1' : '#10b981', color: 'white',
          cursor: (!allAnswered || submitting) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
        }}
      >
        <Send size={16} /> {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
      </button>
      {!allAnswered && (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
          Semua pertanyaan wajib dijawab dulu sebelum bisa dikirim.
        </p>
      )}
    </div>
  );
};

export default StudentSurveyView;