// src/pages/teacher/modul/AIGenerateMateri.jsx
import React, { useState } from 'react';
import { Sparkles, X, Loader2, AlertCircle, Wand2, BookOpen } from 'lucide-react';

// props:
// - subject: mapel guru (buat konteks AI)
// - onGenerated: (blocksArray) => void  -> parent yang masukin ke `sections`
// - onClose: () => void
const AIGenerateMateri = ({ subject, onGenerated, onClose }) => {
  const [topic, setTopic] = useState('');
  const [kelas, setKelas] = useState('');
  const [poinText, setPoinText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    if (!topic.trim()) return setError('❌ Judul materi wajib diisi!');

    setGenerating(true);
    setStatusLabel('Menyusun buku digital... (30-60 detik)');

    try {
      // 1️⃣ SEKALI PANGGIL -> dapat seluruh bagian modul
      const res = await fetch('/api/generateMateriSection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          mapel: subject,
          kelas: kelas.trim(),
          poin: poinText.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyusun materi');
      }

      const sections = data.sections || [];
      const blocks = [];

      // 2️⃣ Lengkapi tiap bagian dengan foto (Wikimedia - GRATIS, tidak memakai kuota AI)
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        setStatusLabel(`Merapikan bagian ${i + 1} dari ${sections.length}: "${s.title}"`);

        let imageUrl = null;
        let imageCredit = null;
        if (s.needs_image && s.image_keyword) {
          try {
            const imgRes = await fetch('/api/searchImage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keyword: s.image_keyword }),
            });
            const imgData = await imgRes.json();
            if (imgData.found) {
              imageUrl = imgData.url;
              imageCredit = imgData.credit;
            }
          } catch (e) {
            // foto gagal -> lanjut tanpa foto, materi tetap jadi
          }
        }

        const imageHtml = imageUrl
          ? `<div style="margin:14px 0;text-align:center;">
               <img src="${imageUrl}" alt="${s.title}" style="max-width:100%;border-radius:10px;max-height:280px;object-fit:cover;" />
               <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Sumber: ${imageCredit || 'Wikimedia Commons'}</div>
             </div>`
          : '';

        const funfactHtml = (s.highlight_type === 'funfact' && s.funfact_html)
          ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:8px;margin-top:14px;">
               <div style="font-weight:700;font-size:12px;color:#f59e0b;margin-bottom:4px;">💡 Tau Gak Sih?</div>
               <div style="font-size:13px;color:#334155;">${s.funfact_html}</div>
             </div>`
          : '';

        const finalHtml = `
          <div style="margin-bottom:20px;">
            ${s.content_html}
            ${imageHtml}
            ${funfactHtml}
          </div>
        `.trim();

        const interactive = (s.highlight_type === 'mnemonic')
          ? { type: 'flashcard', front: s.flashcard_front, back: s.flashcard_back }
          : null;

        blocks.push({
          id: Date.now() + i,
          type: 'text',
          format: 'html',
          title: s.title,
          content: finalHtml,
          interactive,
          fileName: '', mimeType: '', fileSize: 0, filePath: '',
          endTime: '', allowedFileType: 'all', quizId: null, quizTitle: '', quizQuestions: 0,
        });
      }

      onGenerated(blocks);
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
            <Sparkles size={18} color="#8b5cf6" /> Buat Buku Digital dengan AI
          </span>
          {!generating && <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>}
        </div>

        {!generating ? (
          <>
            <div style={styles.field}>
              <label style={styles.label}>📖 Judul Materi <span style={{ color: '#ef4444' }}>*wajib</span></label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Contoh: Pola Bilangan"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>🎓 Kelas / Jenjang (opsional)</label>
              <input
                value={kelas}
                onChange={e => setKelas(e.target.value)}
                placeholder="Contoh: Kelas 8 SMP"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>📝 Arahan khusus (opsional — kosongkan kalau mau AI susun sendiri)</label>
              <textarea
                value={poinText}
                onChange={e => setPoinText(e.target.value)}
                placeholder={`Kosongkan saja kalau tidak ada permintaan khusus.\n\nAtau isi kalau ada yang wajib dibahas, contoh:\nFokus ke barisan aritmatika dan geometri\nSertakan soal cerita tentang jual beli`}
                style={styles.textarea}
              />
            </div>

            {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}

            <button onClick={handleGenerate} style={styles.generateBtn}>
              <Wand2 size={16} /> Buat Buku Digital
            </button>

            <div style={styles.hintBox}>
              <BookOpen size={13} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                AI akan menyusun <b>satu modul lengkap</b> terbagi beberapa bagian. Untuk materi berhitung
                (Matematika/Fisika/Kimia), fokusnya ke <b>rumus, contoh soal bertahap, dan Langkah Gemilang</b> —
                bukan penjelasan panjang. Untuk materi bacaan, penjelasannya lebih naratif dengan contoh nyata.
              </span>
            </div>
          </>
        ) : (
          <div style={styles.progressBox}>
            <Loader2 size={34} className="spin-ai" color="#8b5cf6" />
            <p style={styles.progressLabel}>{statusLabel}</p>
            <div style={styles.progressBarBg}><div style={styles.progressBarIndeterminate} /></div>
            <span style={styles.progressNote}>Mohon jangan tutup halaman ini dulu ya</span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spinAi{to{transform:rotate(360deg)}}
        .spin-ai{animation:spinAi 1s linear infinite}
        @keyframes slideAi{0%{margin-left:-40%}100%{margin-left:100%}}
      `}</style>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: 'white', borderRadius: 16, padding: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 15, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' },
  field: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', minHeight: 90, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  errorBox: { background: '#fee2e2', color: '#ef4444', padding: 10, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 12, lineHeight: 1.5 },
  generateBtn: { width: '100%', padding: 12, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hintBox: { display: 'flex', gap: 6, fontSize: 10, color: '#64748b', marginTop: 12, lineHeight: 1.6, background: '#faf5ff', padding: 10, borderRadius: 8, border: '1px solid #ede9fe' },
  progressBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 0' },
  progressLabel: { fontSize: 13, color: '#475569', textAlign: 'center', fontWeight: 600, lineHeight: 1.5 },
  progressBarBg: { width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarIndeterminate: { width: '40%', height: '100%', background: 'linear-gradient(90deg,#8b5cf6,#6d28d9)', borderRadius: 4, animation: 'slideAi 1.4s ease-in-out infinite' },
  progressNote: { fontSize: 10, color: '#94a3b8' },
};

export default AIGenerateMateri;