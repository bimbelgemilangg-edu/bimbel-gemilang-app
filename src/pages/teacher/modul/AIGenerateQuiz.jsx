// src/pages/teacher/modul/AIGenerateQuiz.jsx
import React, { useState } from 'react';
import { Sparkles, X, Loader2, AlertCircle, Wand2, FileQuestion } from 'lucide-react';

const TYPE_OPTIONS = [
  { id: 'multiple', label: 'Pilihan Ganda' },
  { id: 'truefalse', label: 'Benar/Salah' },
  { id: 'multiselect', label: 'Pilih Lebih dari Satu' },
  { id: 'shortanswer', label: 'Isian Singkat' },
  { id: 'causeeffect', label: 'Sebab Akibat' },
  { id: 'matching', label: 'Menjodohkan' },
];

// props:
// - subject: mapel guru (konteks AI)
// - onGenerated: (questionsArray dalam format internal ManageQuiz) => void
// - onClose: () => void
const AIGenerateQuiz = ({ subject, onGenerated, onClose }) => {
  const [topic, setTopic] = useState('');
  const [kelas, setKelas] = useState('');
  const [jumlahSoal, setJumlahSoal] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState(['multiple']);
  const [arahan, setArahan] = useState('');
  const [generating, setGenerating] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const [error, setError] = useState('');

  const toggleType = (id) => {
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setError('');
    if (!topic.trim()) return setError('❌ Topik/materi kuis wajib diisi!');
    if (selectedTypes.length === 0) return setError('❌ Pilih minimal 1 tipe soal!');
    if (jumlahSoal < 1 || jumlahSoal > 20) return setError('❌ Jumlah soal antara 1-20!');

    setGenerating(true);
    setStatusLabel('AI sedang menyusun soal... (20-50 detik)');

    try {
      const res = await fetch('/api/generateQuizFromTopic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          mapel: subject,
          kelas: kelas.trim(),
          jumlahSoal,
          types: selectedTypes,
          arahan: arahan.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat soal');
      }

      const qs = data.questions || [];
      if (qs.length === 0) {
        throw new Error('AI tidak menghasilkan soal apapun, coba lagi.');
      }

      // Konversi ke format internal yang dipakai ManageQuiz.jsx (emptyQuestion shape)
      const converted = qs.map((q, i) => ({
        id: Date.now() + i,
        type: q.type || 'multiple',
        q: q.question || '',
        qImage: '',
        options: q.options && q.options.length ? q.options : ['', '', '', ''],
        optionImages: ['', '', '', ''],
        correct: typeof q.correct === 'number' ? q.correct : 0,
        correctAnswers: q.correctAnswers || [],
        explanation: q.explanation || '',
        statements: q.statements && q.statements.length ? q.statements : [{ text: '', isTrue: true }],
        readingText: '',
        subQuestions: [{ q: '', options: ['', '', '', ''], correct: 0 }],
        shortAnswer: q.shortAnswer || '',
        cause: q.cause || '',
        effect: q.effect || '',
        isCauseTrue: q.isCauseTrue !== undefined ? q.isCauseTrue : true,
        isEffectTrue: q.isEffectTrue !== undefined ? q.isEffectTrue : true,
        needsManualAnswer: false,
        optionsAreImages: false,
        matchingPairs: q.matchingPairs && q.matchingPairs.length ? q.matchingPairs : [{ left: '', right: '' }, { left: '', right: '' }],
      }));

      onGenerated(converted);

      if (data.possiblyTruncated) {
        alert(
          `✅ ${converted.length} soal berhasil dibuat!\n\n` +
          `⚠️ Catatan: kemungkinan belum semua soal yang diminta sempat dibuat karena topiknya luas. ` +
          `Cek dulu jumlahnya, generate lagi kalau masih kurang.`
        );
      }

      onClose();
    } catch (e) {
      setError('❌ ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={!generating ? onClose : undefined}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>
            <Sparkles size={18} color="#f59e0b" /> Generate Soal dari Topik
          </span>
          {!generating && <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>}
        </div>

        {!generating ? (
          <>
            <div style={styles.field}>
              <label style={styles.label}>📖 Topik/Materi Kuis <span style={{ color: '#ef4444' }}>*wajib</span></label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Contoh: Pola Bilangan"
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>🎓 Kelas/Jenjang (opsional)</label>
                <input
                  value={kelas}
                  onChange={e => setKelas(e.target.value)}
                  placeholder="Kelas 8 SMP"
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.field, width: 100 }}>
                <label style={styles.label}>🔢 Jumlah Soal</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={jumlahSoal}
                  onChange={e => setJumlahSoal(parseInt(e.target.value) || 1)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>📋 Tipe Soal (bisa pilih lebih dari 1)</label>
              <div style={styles.typeGrid}>
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleType(t.id)}
                    style={{
                      ...styles.typeBtn,
                      background: selectedTypes.includes(t.id) ? '#fef3c7' : 'white',
                      border: selectedTypes.includes(t.id) ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                      color: selectedTypes.includes(t.id) ? '#b45309' : '#64748b',
                    }}
                  >
                    {selectedTypes.includes(t.id) ? '✅ ' : ''}{t.label}
                  </button>
                ))}
              </div>
              <p style={styles.hintSmall}>
                💡 Kalau pilih lebih dari 1 tipe, AI akan mencampur jenisnya sesuai jumlah soal yang diminta.
              </p>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>📝 Arahan khusus (opsional)</label>
              <textarea
                value={arahan}
                onChange={e => setArahan(e.target.value)}
                placeholder="Kosongkan kalau tidak ada, atau isi contoh: fokus ke soal cerita jual beli"
                style={styles.textarea}
              />
            </div>

            {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}

            <button onClick={handleGenerate} style={styles.generateBtn}>
              <Wand2 size={16} /> Generate Soal
            </button>

            <div style={styles.hintBox}>
              <FileQuestion size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Soal & jawaban otomatis diisi AI (termasuk pembahasan), tapi <b>tetap cek dulu</b> sebelum
                diterbitkan ke siswa — terutama hitungan matematika dan kunci jawabannya.
              </span>
            </div>
          </>
        ) : (
          <div style={styles.progressBox}>
            <Loader2 size={34} className="spin-ai" color="#f59e0b" />
            <p style={styles.progressLabel}>{statusLabel}</p>
            <div style={styles.progressBarBg}><div style={styles.progressBarIndeterminate} /></div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spinAi{to{transform:rotate(360deg)}}
        .spin-ai{animation:spinAi 1s linear infinite}
        @keyframes slideAiQ{0%{margin-left:-40%}100%{margin-left:100%}}
      `}</style>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: 'white', borderRadius: 16, padding: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 15, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' },
  field: { marginBottom: 14 },
  row: { display: 'flex', gap: 10 },
  label: { fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', minHeight: 70, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  typeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  typeBtn: { padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, textAlign: 'left' },
  hintSmall: { fontSize: 9, color: '#94a3b8', marginTop: 6 },
  errorBox: { background: '#fee2e2', color: '#ef4444', padding: 10, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 12, lineHeight: 1.5 },
  generateBtn: { width: '100%', padding: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hintBox: { display: 'flex', gap: 6, fontSize: 10, color: '#64748b', marginTop: 12, lineHeight: 1.6, background: '#fffbeb', padding: 10, borderRadius: 8, border: '1px solid #fde68a' },
  progressBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 0' },
  progressLabel: { fontSize: 13, color: '#475569', textAlign: 'center', fontWeight: 600, lineHeight: 1.5 },
  progressBarBg: { width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarIndeterminate: { width: '40%', height: '100%', background: 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: 4, animation: 'slideAiQ 1.4s ease-in-out infinite' },
};

export default AIGenerateQuiz;