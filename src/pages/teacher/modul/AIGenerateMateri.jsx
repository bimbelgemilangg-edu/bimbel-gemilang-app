// src/pages/teacher/modul/AIGenerateMateri.jsx
import React, { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle, AlertCircle, Wand2 } from 'lucide-react';

// props:
// - subject: mapel guru (buat konteks AI)
// - onGenerated: (blocksArray) => void  -> parent yang masukin ke `sections`
// - onClose: () => void
const AIGenerateMateri = ({ subject, onGenerated, onClose }) => {
  const [topic, setTopic] = useState('');
  const [poinText, setPoinText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    const poinList = poinText.split('\n').map(p => p.trim()).filter(Boolean);

    if (!topic.trim()) return setError('❌ Judul Bab wajib diisi!');
    if (poinList.length === 0) return setError('❌ Minimal 1 poin materi!');
    if (poinList.length > 8) return setError('❌ Maksimal 8 poin per generate (biar hasil tetap fokus & tidak lama).');

    setGenerating(true);
    const generatedBlocks = [];

    try {
      for (let i = 0; i < poinList.length; i++) {
        const poin = poinList[i];
        setProgress({ current: i + 1, total: poinList.length, label: `Menulis bagian: "${poin}"...` });

        // 1. Generate teks bagian ini
        const genRes = await fetch('/api/generateMateriSection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, mapel: subject, poin, poinIndex: i, totalPoin: poinList.length }),
        });
        const genData = await genRes.json();

        if (!genRes.ok || !genData.success) {
          throw new Error(genData.error || `Gagal generate bagian "${poin}"`);
        }

        // 2. Kalau butuh gambar, cari foto asli
        let imageUrl = null;
        let imageCredit = null;
        if (genData.needs_image && genData.image_keyword) {
          setProgress({ current: i + 1, total: poinList.length, label: `Mencari foto: "${genData.image_keyword}"...` });
          try {
            const imgRes = await fetch('/api/searchImage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keyword: genData.image_keyword }),
            });
            const imgData = await imgRes.json();
            if (imgData.found) {
              imageUrl = imgData.url;
              imageCredit = imgData.credit;
            }
          } catch (e) {
            // gambar gagal, gapapa, lanjut tanpa gambar
          }
        }

        const isMnemonic = genData.highlight_type === 'mnemonic' && genData.flashcard_front && genData.flashcard_back;

        const imageHtml = imageUrl
          ? `<div style="margin:14px 0;text-align:center;">
               <img src="${imageUrl}" alt="${genData.title}" style="max-width:100%;border-radius:10px;max-height:280px;object-fit:cover;" />
               <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Sumber: ${imageCredit || 'Wikimedia Commons'}</div>
             </div>`
          : '';

        // Kalau FUN FACT -> tetap tempel sebagai kotak statis di dalam HTML (gak butuh interaksi)
        const funfactHtml = (!isMnemonic && genData.funfact_html)
          ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:8px;margin-top:14px;">
               <div style="font-weight:700;font-size:12px;color:#f59e0b;margin-bottom:4px;">💡 Tau Gak Sih?</div>
               <div style="font-size:13px;color:#334155;">${genData.funfact_html}</div>
             </div>`
          : '';

        const finalHtml = `
          <div style="margin-bottom:20px;">
            ${genData.content_html}
            ${imageHtml}
            ${funfactHtml}
          </div>
        `.trim();

        // Kalau MNEMONIC -> jadi data flashcard interaktif TERPISAH (bukan HTML statis),
        // supaya bisa dirender jadi kartu yang beneran bisa di-klik/flip di sisi siswa.
        const interactive = isMnemonic
          ? { type: 'flashcard', front: genData.flashcard_front, back: genData.flashcard_back }
          : null;

        generatedBlocks.push({
          id: Date.now() + i,
          type: 'text',
          format: 'html', // penanda buat StudentModuleView biar dirender sebagai HTML
          title: genData.title || poin,
          content: finalHtml,
          interactive, // { type: 'flashcard', front, back } atau null
          fileName: '', mimeType: '', fileSize: 0, filePath: '',
          endTime: '', allowedFileType: 'all', quizId: null, quizTitle: '', quizQuestions: 0,
        });
      }

      onGenerated(generatedBlocks);
      onClose();
    } catch (e) {
      setError('❌ ' + e.message + ' — bagian yang sudah jadi tetap disimpan, coba generate ulang sisanya.');
      if (generatedBlocks.length > 0) onGenerated(generatedBlocks);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={!generating ? onClose : undefined}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}><Sparkles size={18} color="#8b5cf6" /> Generate Materi dengan AI</span>
          {!generating && <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>}
        </div>

        {!generating ? (
          <>
            <div style={styles.field}>
              <label style={styles.label}>📖 Judul Bab / Topik</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Contoh: Jarak, Kecepatan, dan Waktu" style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>📝 Poin-poin yang harus dibahas (1 baris = 1 poin, maks 8)</label>
              <textarea
                value={poinText}
                onChange={e => setPoinText(e.target.value)}
                placeholder={`Contoh:\nPengertian jarak, kecepatan, waktu\nRumus dasar V = J/W\nContoh soal sehari-hari`}
                style={styles.textarea}
              />
            </div>
            {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}
            <button onClick={handleGenerate} style={styles.generateBtn}>
              <Wand2 size={16} /> Generate Materi
            </button>
            <p style={styles.hint}>💡 AI akan menulis tiap poin jadi bacaan gaya blog, otomatis cari foto asli kalau relevan, kasih kotak "Tau Gak Sih?" untuk fun fact, atau kartu flashcard yang bisa di-flip kalau materinya butuh dihafal (mnemonic).</p>
          </>
        ) : (
          <div style={styles.progressBox}>
            <Loader2 size={32} className="spin-ai" color="#8b5cf6" />
            <p style={styles.progressLabel}>{progress.label}</p>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
            <span style={styles.progressCount}>{progress.current} / {progress.total} bagian</span>
          </div>
        )}
      </div>
      <style>{`@keyframes spinAi{to{transform:rotate(360deg)}} .spin-ai{animation:spinAi 1s linear infinite}`}</style>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: 'white', borderRadius: 16, padding: 20, width: '100%', maxWidth: 480, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 15, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' },
  field: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', minHeight: 100, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  errorBox: { background: '#fee2e2', color: '#ef4444', padding: 10, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 },
  generateBtn: { width: '100%', padding: 12, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hint: { fontSize: 10, color: '#94a3b8', marginTop: 10, lineHeight: 1.5 },
  progressBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 0' },
  progressLabel: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  progressBarBg: { width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', background: 'linear-gradient(90deg,#8b5cf6,#6d28d9)', transition: 'width 0.3s ease' },
  progressCount: { fontSize: 11, fontWeight: 700, color: '#8b5cf6' },
};

export default AIGenerateMateri;