// src/pages/teacher/modul/WordImportQuiz.jsx
import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import imageCompression from 'browser-image-compression';
import { X, Loader2, AlertCircle, FileText, Upload, CheckCircle2 } from 'lucide-react';

// ⚠️ DEPENDENSI BARU: file ini sekarang pakai `jszip` (bukan `mammoth` lagi
// sama sekali -- lihat penjelasan besar di bawah kenapa). Kalau belum ada,
// jalankan dulu: npm install jszip

// ============================================================
// 🔥 ROMBAK TOTAL: BACA XML MENTAH WORD LANGSUNG, BUKAN LEWAT MAMMOTH LAGI
// ============================================================
// KENAPA DIROMBAK TOTAL (bukan cuma ditambal): sebelumnya file ini pakai
// `mammoth` buat convert .docx -> HTML dulu, baru HTML itu "ditebak"
// strukturnya (mana soal, mana opsi jawaban) lewat heuristik nesting/jumlah
// item daftar. Setelah CEK LANGSUNG isi XML asli dari 2 file contoh yang
// dikirim (TES_TKA.docx, ipa_tka.docx), ternyata:
//
//  1. Soal DAN opsi jawaban itu SATU SISTEM PENOMORAN BERTINGKAT Word yang
//     SAMA (satu numId), bedanya cuma level indentasi -- ilvl=0 untuk soal,
//     ilvl=1 untuk opsi jawaban. Ini BUKAN dua daftar terpisah (yang
//     diasumsikan versi "diperbaiki jumlah item" sebelumnya), dan JUGA
//     BUKAN daftar bersarang HTML yang rapi (yang diasumsikan versi
//     ASLINYA) -- mammoth sering "memutus" rangkaian level ini jadi
//     beberapa <ol> terpisah begitu ada paragraf tanpa nomor di tengah
//     (mis. gambar diagram, kalimat lanjutan soal) -- yang HAMPIR SELALU
//     ada di soal ujian bergambar. Begitu list-nya "putus", mammoth
//     kehilangan info level aslinya, dan heuristik apapun yang nebak dari
//     HTML hasil konversi itu jadi gak reliable.
//  2. Gambar bisa nempel di paragraf SOAL (diagram di tengah soal), atau
//     malah di paragraf OPSI JAWABAN itu sendiri (opsi berupa gambar,
//     bukan teks -- persis soal pola susunan kubus).
//
// Solusinya: BACA LANGSUNG info level (ilvl) dari XML asli Word (word/
// document.xml di dalam file .docx, yang sebenarnya cuma file ZIP). Info
// level ini tersimpan PERSIS & PASTI di file aslinya -- gak perlu ditebak
// lewat konversi HTML apapun. Dengan ini, soal vs opsi jawaban dikelompokkan
// 100% akurat sesuai yang Word beneran simpan, apapun bentuk gangguan di
// tengahnya (gambar, kalimat lanjutan, dst).

const MIN_IMAGE_BYTES = 2 * 1024; // gambar di bawah ini kemungkinan cuma bullet/ikon, bukan diagram soal
const QUESTIONS_PER_PACKAGE = 5; // dipecah per soal (bukan per karakter) biar tiap request ke server ringan & gak timeout

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';

// ============================================================
// 🔥 BACA STRUKTUR SOAL LANGSUNG DARI XML ASLI FILE .docx
// ============================================================
// Hasilnya: array soal, tiap soal = { stemText, stemImages, options }
// options = array { text, images, bold } -- `bold` dipakai buat mendeteksi
// jawaban benar (guru menandai jawaban benar dengan menebalkan teksnya,
// sesuai instruksi yang sudah ada di panel ini).
async function parseDocxStructured(arrayBuffer, onProgress) {
  let zip;
  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch (e) {
    throw new Error('File bukan format .docx yang valid (mungkin sebenarnya .doc lama, atau filenya rusak). Buka di Word lalu Save As ➜ pilih .docx, baru upload lagi.');
  }

  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) {
    throw new Error('Struktur file .docx tidak dikenali (word/document.xml tidak ditemukan). Coba Save As ulang dari Word.');
  }
  const documentXmlText = await documentXmlFile.async('text');
  const doc = new DOMParser().parseFromString(documentXmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Gagal membaca isi file Word (XML rusak). Coba Save As ulang dari Word, lalu upload lagi.');
  }

  // Peta relationship id (rId) -> path file gambar di dalam zip
  const relMap = {};
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (relsFile) {
    const relsText = await relsFile.async('text');
    const relsDoc = new DOMParser().parseFromString(relsText, 'application/xml');
    Array.from(relsDoc.getElementsByTagName('Relationship')).forEach(rel => {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      if (id && target) relMap[id] = `word/${target}`;
    });
  }

  const paragraphs = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));

  // Cache biar gambar yg dipakai berkali-kali gak dikompres ulang tiap ketemu
  const imageCache = new Map(); // path -> dataUri terkompres, atau null kalau ditolak/gagal
  let realImageCounter = 0;

  const resolveParagraphImages = async (p) => {
    const blips = Array.from(p.getElementsByTagNameNS(A_NS, 'blip'));
    const out = [];
    for (const blip of blips) {
      const rId = blip.getAttributeNS(R_NS, 'embed');
      if (!rId || !relMap[rId]) continue;
      const path = relMap[rId];

      if (imageCache.has(path)) {
        const cached = imageCache.get(path);
        if (cached) out.push(cached);
        continue;
      }

      const file = zip.file(path);
      if (!file) { imageCache.set(path, null); continue; }

      try {
        const base64 = await file.async('base64');
        const approxBytes = Math.floor(base64.length * 0.75);
        if (approxBytes < MIN_IMAGE_BYTES) { imageCache.set(path, null); continue; }

        const ext = (path.split('.').pop() || 'png').toLowerCase();
        const mime = ext === 'jpg' ? 'jpeg' : (ext === 'svg' ? 'svg+xml' : ext);
        const rawDataUri = `data:image/${mime};base64,${base64}`;

        onProgress?.(`Mengecilkan gambar ${++realImageCounter}...`);
        const blob = await (await fetch(rawDataUri)).blob();
        const compressedBlob = await imageCompression(blob, {
          maxSizeMB: 0.25,
          maxWidthOrHeight: 1000,
          useWebWorker: true,
        });
        const compressedDataUri = await imageCompression.getDataUrlFromFile(compressedBlob);
        imageCache.set(path, compressedDataUri);
        out.push(compressedDataUri);
      } catch (e) {
        console.error('[WordImportQuiz] Gagal proses gambar ' + path + ':', e);
        imageCache.set(path, null);
      }
    }
    return out;
  };

  const getParagraphText = (p) => {
    let text = '';
    const walk = (node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType !== 1) continue;
        const local = child.localName;
        if (local === 't') text += child.textContent;
        else if (local === 'tab') text += ' ';
        else if (local === 'br' || local === 'cr') text += ' ';
        else walk(child);
      }
    };
    walk(p);
    return text.replace(/\s+/g, ' ').trim();
  };

  const getIlvl = (p) => {
    const numPrList = p.getElementsByTagNameNS(W_NS, 'numPr');
    if (numPrList.length === 0) return null; // paragraf biasa, gak masuk daftar bernomor
    const ilvlList = numPrList[0].getElementsByTagNameNS(W_NS, 'ilvl');
    if (ilvlList.length === 0) return 0;
    const n = parseInt(ilvlList[0].getAttributeNS(W_NS, 'val'), 10);
    return isNaN(n) ? 0 : n;
  };

  const isBold = (p) => {
    const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
    const textRuns = runs.filter(r => getParagraphText(r).length > 0);
    if (textRuns.length === 0) return false;
    return textRuns.every(r => {
      const bEls = r.getElementsByTagNameNS(W_NS, 'b');
      if (bEls.length === 0) return false;
      const val = bEls[0].getAttributeNS(W_NS, 'val');
      return val === null || val === '' || val === '1' || val === 'true';
    });
  };

  // ---- KELOMPOKKAN PARAGRAF JADI SOAL + OPSI, PAKAI ilvl ASLI DARI WORD ----
  // ilvl null/0 = bagian dari SOAL (stem/pertanyaan) -- termasuk paragraf
  // lanjutan tanpa nomor sama sekali (kalimat sambungan, gambar diagram).
  // ilvl >= 1 = OPSI JAWABAN.
  // Begitu ketemu paragraf ilvl null/0 SETELAH sudah ada opsi terkumpul,
  // itu tandanya soal BARU dimulai -- soal sebelumnya ditutup dulu.
  const questions = [];
  let stemParts = [];
  let stemImages = [];
  let options = [];

  const finalizeQuestion = () => {
    if (stemParts.length === 0 && options.length === 0) return;
    questions.push({
      stemText: stemParts.join(' ').replace(/\s+/g, ' ').trim(),
      stemImages: [...stemImages],
      options: options.map(o => ({ ...o })),
    });
    stemParts = [];
    stemImages = [];
    options = [];
  };

  for (const p of paragraphs) {
    const ilvl = getIlvl(p);
    const text = getParagraphText(p);
    const images = await resolveParagraphImages(p);
    if (!text && images.length === 0) continue; // paragraf beneran kosong, lewati

    if (ilvl === null || ilvl === 0) {
      if (options.length > 0) finalizeQuestion(); // soal baru dimulai
      if (text) stemParts.push(text);
      if (images.length) stemImages.push(...images);
    } else {
      options.push({ text, images, bold: isBold(p) });
    }
  }
  finalizeQuestion();

  return questions;
}

// ============================================================
// Ubah hasil parseDocxStructured() jadi paket teks siap dikirim ke AI,
// PLUS peta gambar terpisah -- persis pola lama (penanda ringan [[IMG:n]]
// di teks, data gambar aslinya disimpan terpisah, TIDAK PERNAH dikirim
// sebagai base64 mentah ke AI supaya request tetap ringan & cepat).
// ============================================================
function buildPackages(structuredQuestions, perPackage) {
  const imageMap = {};
  let imgCounter = 0;
  const registerImage = (dataUri) => {
    const id = String(imgCounter++);
    imageMap[id] = dataUri;
    return `[[IMG:${id}]]`;
  };

  const questionTexts = structuredQuestions.map((q, qi) => {
    let block = `${qi + 1}. ${q.stemText}`;
    q.stemImages.forEach(img => { block += ' ' + registerImage(img); });
    q.options.forEach((opt, oi) => {
      const letter = String.fromCharCode(97 + oi);
      let optText = opt.text;
      opt.images.forEach(img => { optText += (optText ? ' ' : '') + registerImage(img); });
      block += `\n${letter}. ${opt.bold ? `**${optText}**` : optText}`;
    });
    return block;
  });

  const packages = [];
  for (let i = 0; i < questionTexts.length; i += perPackage) {
    packages.push(questionTexts.slice(i, i + perPackage).join('\n\n'));
  }
  return { packages, imageMap, totalRealImages: Object.keys(imageMap).length };
}

// 🔥 Helper: tempel gambar dari placeholder [[IMG:n]] balik ke satu string,
// kembalikan { cleanText, imageDataUri } -- dipakai buat teks soal MAUPUN
// teks tiap opsi jawaban.
const IMG_TAG_REGEX = /\[\[IMG:(\d+)\]\]/;
function extractImageFromText(text, imageMap) {
  const raw = String(text || '');
  const match = raw.match(IMG_TAG_REGEX);
  let cleanText = raw;
  let imageDataUri = '';
  if (match && imageMap[match[1]]) {
    imageDataUri = imageMap[match[1]];
    cleanText = raw.replace(IMG_TAG_REGEX, '').trim();
  } else if (IMG_TAG_REGEX.test(raw)) {
    // Penanda ada tapi gambarnya gak ketemu di map (mis. kebuang krn kekecilan)
    cleanText = raw.replace(IMG_TAG_REGEX, '').trim();
  }
  // Buang sisa penanda bold kosongan ("**" / "****") kalau setelah gambar
  // diambil teksnya jadi kosong -- daripada nyimpen sampah simbol doang.
  cleanText = /^\*+$/.test(cleanText) ? '' : cleanText;
  return { cleanText, imageDataUri };
}

// props:
// - onParsed: (questionsArray) => void  -> parent yang gabungin ke `questions`
// - onClose: () => void
const WordImportQuiz = ({ onParsed, onClose }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('❌ Hanya file .docx (Word) yang didukung. Kalau punyanya .doc lama, buka di Word lalu Save As ➜ pilih format .docx dulu.');
      return;
    }

    setFileName(file.name);
    setProcessing(true);

    try {
      // 1. Baca .docx (sebenarnya file ZIP) & ambil struktur soal LANGSUNG
      //    dari XML asli Word -- akurat 100% sesuai yang Word simpan, gak
      //    ditebak dari hasil konversi HTML apapun.
      setStatusLabel('Membaca struktur soal dari file Word...');
      const arrayBuffer = await file.arrayBuffer();
      const structuredQuestions = await parseDocxStructured(arrayBuffer, (msg) => setStatusLabel(msg));

      if (structuredQuestions.length === 0) {
        throw new Error('Tidak ditemukan soal berformat daftar bernomor Word di file ini. Pastikan soal & opsi jawaban dibuat pakai fitur List/Numbering bawaan Word (bukan diketik manual sebagai teks biasa).');
      }

      // 🔥 BARU: jaring pengaman -- soal dengan jumlah opsi jawaban di luar
      // kewajaran (kurang dari 2, atau lebih dari 6) biasanya nandain ada
      // masalah FORMAT di sumber dokumennya sendiri (mis. opsi pertama
      // "a." kebetulan ketik nempel jadi satu paragraf sama kalimat soal,
      // bukan pakai fitur List Word yang semestinya -- ini gak bisa
      // ditebak parser manapun dengan pasti). Daripada diam-diam
      // mengimpor soal yang kemungkinan rusak, di sini dicatat dulu
      // nomor-nomornya supaya guru tau PERSIS soal mana yang perlu dicek
      // manual setelah impor -- bukan harus scroll semua satu-satu.
      const suspiciousIndexes = structuredQuestions
        .map((q, i) => ({ i, count: q.options.length }))
        .filter(x => x.count < 2 || x.count > 6)
        .map(x => x.i + 1);

      // 2. Susun jadi paket teks siap kirim ke AI + peta gambar terpisah
      const { packages, imageMap, totalRealImages } = buildPackages(structuredQuestions, QUESTIONS_PER_PACKAGE);
      console.log(`[WordImportQuiz] ${structuredQuestions.length} soal terdeteksi, ${totalRealImages} gambar valid, ${packages.length} paket kiriman.`);

      // 3. Kirim tiap paket satu-satu ke AI (server) — cuma teks + penanda
      //    ringan "[[IMG:n]]", TANPA data gambar beneran, jadi ringan & cepat
      let allQuestions = [];
      let failedPackages = 0;
      for (let i = 0; i < packages.length; i++) {
        setStatusLabel(
          packages.length > 1
            ? `Memproses bagian ${i + 1} dari ${packages.length}...`
            : 'AI sedang memisahkan soal...'
        );
        try {
          const res = await fetch('/api/smartParseQuiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: packages[i] }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.questions) {
            allQuestions = allQuestions.concat(data.questions);
          } else {
            failedPackages++;
            console.error(`[WordImportQuiz] Paket ${i + 1} gagal:`, data?.error || res.statusText);
          }
        } catch (e) {
          failedPackages++;
          console.error(`[WordImportQuiz] Paket ${i + 1} error jaringan:`, e);
        }
      }

      if (allQuestions.length === 0) {
        throw new Error('Tidak ada soal yang berhasil diproses AI. Coba lagi (mungkin kuota AI lagi penuh), atau cek Console browser (F12) buat detail errornya.');
      }

      // 4. Tempel BALIK gambar asli — baik di SOAL maupun di OPSI JAWABAN.
      allQuestions = allQuestions.map(q => {
        let next = { ...q };

        // Gambar SOAL (dari field qImage ATAU nyempil di teks soal)
        const fromQImage = extractImageFromText(next.qImage, imageMap);
        if (fromQImage.imageDataUri) {
          next.qImage = fromQImage.imageDataUri;
        } else {
          const fromQuestionText = extractImageFromText(next.q, imageMap);
          if (fromQuestionText.imageDataUri) {
            next.qImage = fromQuestionText.imageDataUri;
            next.q = fromQuestionText.cleanText;
          } else if (IMG_TAG_REGEX.test(next.qImage || '')) {
            next.qImage = '';
          }
        }

        // 🔥 Gambar di OPSI JAWABAN (mis. soal pola kubus yang tiap
        // pilihannya berupa gambar, bukan teks) -- dipindah ke
        // `optionImages` + `optionsAreImages` diaktifkan otomatis, persis
        // seperti kalau guru upload gambar opsi secara manual.
        if (Array.isArray(next.options) && next.options.length > 0) {
          const optionImages = ['', '', '', ''];
          let hasOptionImage = false;
          const cleanedOptions = next.options.slice(0, 4).map((opt, idx) => {
            const resolved = extractImageFromText(opt, imageMap);
            if (resolved.imageDataUri) {
              optionImages[idx] = resolved.imageDataUri;
              hasOptionImage = true;
            }
            return resolved.cleanText;
          });
          if (hasOptionImage) {
            next.options = cleanedOptions.length === 4 ? cleanedOptions : [...cleanedOptions, ...Array(4 - cleanedOptions.length).fill('')];
            next.optionImages = optionImages;
            next.optionsAreImages = true;
          }
        }

        return next;
      });

      onParsed(allQuestions);

      const totalImagesUsed = allQuestions.filter(q => q.qImage || q.optionsAreImages).length;
      let noteMsg = '';
      if (failedPackages > 0) {
        noteMsg += `⚠️ ${failedPackages} dari ${packages.length} bagian gagal diproses (kemungkinan kuota AI penuh atau koneksi terputus). Cek dulu apakah ada nomor soal yang terlewat.\n\n`;
      }
      if (totalRealImages > 0) {
        noteMsg += `🖼️ ${totalRealImages} gambar terdeteksi di dokumen, ${totalImagesUsed} soal berhasil ditempeli gambar. Cek satu-satu sebelum diterbitkan.\n\n`;
      }
      if (suspiciousIndexes.length > 0) {
        noteMsg += `⚠️ Soal nomor ${suspiciousIndexes.join(', ')} punya jumlah opsi jawaban yang gak biasa (kurang dari 2 atau lebih dari 6) -- kemungkinan format aslinya di Word agak beda (mis. opsi pertama nempel jadi satu paragraf sama soalnya). Tolong cek & rapikan manual soal-soal itu sebelum diterbitkan ke siswa.`;
      }
      if (noteMsg) alert(`✅ ${allQuestions.length} soal berhasil diimpor.\n\n${noteMsg}`);

      onClose();
    } catch (err) {
      console.error('[WordImportQuiz] Gagal impor:', err);
      setError('❌ ' + err.message);
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.overlay} onClick={!processing ? onClose : undefined}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}><FileText size={18} color="#2563eb" /> Import Soal dari Word</span>
          {!processing && <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>}
        </div>

        {!processing ? (
          <>
            <label style={styles.dropZone}>
              <Upload size={28} color="#94a3b8" />
              <span style={styles.dropTitle}>Klik untuk pilih file .docx</span>
              <span style={styles.dropSub}>Format Word (.docx) — file besar & banyak gambar tetap aman</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                hidden
                onChange={handleFileChange}
              />
            </label>

            {error && <div style={styles.errorBox}><AlertCircle size={14} /> {error}</div>}

            <div style={styles.guideBox}>
              <div style={styles.guideTitle}><CheckCircle2 size={13} color="#2563eb" /> Cara menyiapkan file Word-nya:</div>
              <ul style={styles.guideList}>
                <li>Soal & opsi jawaban dibuat pakai fitur <b>List/Numbering bawaan Word</b> (soal level 1, opsi jawaban level 2/menjorok ke dalam) — bukan angka/huruf yang diketik manual</li>
                <li>Jawaban benar ditandai <b>bold/tebal</b> langsung di opsinya</li>
                <li>Gambar (kalau ada) ditempel langsung di dalam dokumen Word — termasuk kalau OPSI JAWABANNYA sendiri berupa gambar (bukan cuma soalnya)</li>
                <li>Kalau file masih PDF, convert dulu ke Word (banyak tools gratis di internet) sebelum upload di sini</li>
              </ul>
            </div>
          </>
        ) : (
          <div style={styles.progressBox}>
            <Loader2 size={34} className="spin-word" color="#2563eb" />
            <p style={styles.progressFileName}>{fileName}</p>
            <p style={styles.progressLabel}>{statusLabel}</p>
            <div style={styles.progressBarBg}><div style={styles.progressBarIndeterminate} /></div>
            <p style={styles.progressHint}>Diproses langsung di HP/laptop kamu dulu sebelum dikirim ke AI, jadi mungkin agak lama kalau gambarnya banyak. Jangan tutup halaman ini dulu ya.</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spinWord{to{transform:rotate(360deg)}}
        .spin-word{animation:spinWord 1s linear infinite}
        @keyframes slideWord{0%{margin-left:-40%}100%{margin-left:100%}}
      `}</style>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: 'white', borderRadius: 16, padding: 20, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 15, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' },
  dropZone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '30px 20px', border: '2px dashed #93c5fd', borderRadius: 12,
    cursor: 'pointer', background: '#eff6ff', marginBottom: 14,
  },
  dropTitle: { fontSize: 13, fontWeight: 700, color: '#1e40af' },
  dropSub: { fontSize: 10, color: '#64748b' },
  errorBox: { background: '#fee2e2', color: '#ef4444', padding: 10, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 12, lineHeight: 1.5 },
  guideBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 },
  guideTitle: { fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  guideList: { margin: 0, paddingLeft: 18, fontSize: 11, color: '#475569', lineHeight: 1.8 },
  progressBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0' },
  progressFileName: { fontSize: 12, color: '#1e293b', fontWeight: 700 },
  progressLabel: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 1.5 },
  progressBarBg: { width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarIndeterminate: { width: '40%', height: '100%', background: 'linear-gradient(90deg,#2563eb,#1d4ed8)', borderRadius: 4, animation: 'slideWord 1.4s ease-in-out infinite' },
  progressHint: { fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
};

export default WordImportQuiz;