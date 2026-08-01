// src/pages/teacher/modul/WordImportQuiz.jsx
import React, { useState, useRef } from 'react';
import mammoth from 'mammoth/mammoth.browser';
import imageCompression from 'browser-image-compression';
import { X, Loader2, AlertCircle, FileText, Upload, CheckCircle2 } from 'lucide-react';

// 🔥 KENAPA DIPROSES DI BROWSER (BUKAN DIKIRIM MENTAH KE SERVER):
// File Word yang ada banyak gambar bisa gampang tembus beberapa MB, sementara
// server (Vercel) cuma terima request maksimal ~4.5MB. Kalau file dikirim
// mentah-mentah, PASTI ditolak untuk dokumen yang gambarnya banyak.
// Solusinya: dokumen dibongkar & dikecilin DI BROWSER dulu (teks diekstrak,
// gambar kecil/dekoratif dibuang, gambar asli dikompres), baru hasil yang udah
// ramping itu yang dikirim ke server buat diproses AI.

// 🔥 Dipecah per JUMLAH SOAL (bukan per jumlah karakter) supaya tiap request
// ke server isinya kecil & waktu prosesnya bisa ditebak. Server punya batas
// waktu 60 detik per request — kalau 1 request disuruh proses 40 soal
// sekaligus, pasti kelewat batas dan gagal total (timeout). Dengan 5 soal per
// paket, tiap request cuma butuh beberapa detik, jadi aman berapa pun jumlah
// soal di dokumennya (40, 100, dst) karena diproses bertahap satu per satu.
const QUESTIONS_PER_PACKAGE = 5;
// 🔥 FIX BUG: sebelumnya nilainya 8KB -- terlalu agresif buat diagram
// sederhana (mis. pola susunan kubus, garis-garis doang, sedikit warna) yang
// setelah dikompres bisa aja ukurannya di bawah itu, padahal itu GAMBAR SOAL
// PENTING, bukan bullet/ikon dekoratif. Diturunkan jauh supaya diagram garis
// sederhana gak ikut kebuang -- bullet/ikon asli Word biasanya di bawah 1-2KB,
// jadi ambang 2KB ini masih cukup buat nyaring itu tanpa ikut membuang
// diagram soal yang beneran penting.
const MIN_IMAGE_BYTES = 2 * 1024;
// 🔥 BARU: daftar dengan jumlah item segini ke bawah dianggap OPSI JAWABAN
// (diberi huruf a,b,c,d,...), lebih dari ini dianggap DAFTAR SOAL (diberi
// angka 1,2,3,...). Lihat penjelasan lengkap di extractPlainTextAndImages().
const MAX_OPTION_LIST_SIZE = 8;

// ============================================================
// 🔥 KONVERSI HTML -> TEKS POLOS, PAKAI DOMPARSER ASLI (BUKAN REGEX)
// ============================================================
// 🔥 FIX BUG BESAR (ini kemungkinan akar dari "selalu gagal impor"):
// Sebelumnya, jenis penomoran (angka "1.2.3" buat soal vs huruf "a.b.c" buat
// opsi jawaban) ditentukan dari KEDALAMAN NESTING html -- asumsinya opsi
// jawaban itu daftar Word yang SENGAJA disarangkan DI DALAM item soal
// (<ol><li>soal<ol><li>opsi</li></ol></li></ol>). Asumsi ini SALAH untuk
// mayoritas dokumen ujian yang beneran dipakai guru: soal dan opsi jawaban
// hampir selalu berupa DUA DAFTAR TERPISAH yang cuma BERSEBELAHAN (bukan
// bersarang) -- atau bahkan opsinya cuma paragraf biasa yang ditik manual.
// Begitu strukturnya gak nested, kode lama salah total nebak jenis
// penomoran: opsi jawaban ikut kehitung "level 0" dan dikasih angka 1,2,3,4
// -- lalu sistem deteksi "ini soal baru" (yang nyari pola angka di awal
// baris) jadi ngira SETIAP OPSI adalah soal baru sendiri. Hasilnya
// berantakan total atau gagal.
//
// Mammoth juga TIDAK menyimpan info "list ini aslinya format angka atau
// huruf" di HTML dasarnya (dua-duanya sama-sama jadi <ol> generik) -- jadi
// kita gak bisa "baca" formatnya dari HTML. Solusi yang jauh lebih akurat:
// TEBAK dari JUMLAH ITEM per daftar, bukan dari kedalaman nesting. Daftar
// pendek (2-8 item) hampir pasti opsi jawaban (a/b/c/d/e) -- jarang ada
// soal ujian dengan lebih dari 8 pilihan. Daftar panjang (>8 item) hampir
// pasti daftar soal (1,2,3,...). Heuristik ini jalan baik untuk struktur
// bersarang MAUPUN bersebelahan, karena gak bergantung sama sekali pada
// posisi/kedalaman di pohon HTML.
function extractPlainTextAndImages(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const images = [];

  const walkList = (listEl) => {
    const liChildren = Array.from(listEl.children).filter(c => c.tagName.toLowerCase() === 'li');
    if (liChildren.length === 0) return '';
    const looksLikeOptions = liChildren.length <= MAX_OPTION_LIST_SIZE;
    let out = '';
    liChildren.forEach((li, idx) => {
      const marker = looksLikeOptions
        ? `${String.fromCharCode(97 + idx)}. ` // a. b. c. d. ...
        : `${idx + 1}. `; // 1. 2. 3. ...
      out += '\n' + marker + walkNode(li).trim() + '\n';
    });
    return out;
  };

  const walkNode = (node) => {
    let out = '';
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        if (tag === 'strong' || tag === 'b') {
          out += '**' + walkNode(child) + '**';
        } else if (tag === 'ol' || tag === 'ul') {
          out += walkList(child);
        } else if (tag === 'img') {
          const src = child.getAttribute('src') || '';
          if (src.startsWith('data:')) {
            images.push(src);
            out += `\n\x00IMG${images.length - 1}\x00\n`;
          }
        } else if (tag === 'br') {
          out += '\n';
        } else if (tag === 'p' || tag === 'div') {
          out += '\n' + walkNode(child) + '\n';
        } else {
          out += walkNode(child);
        }
      }
    }
    return out;
  };

  const rawText = walkNode(doc.body);
  return { rawText, images };
}

// ============================================================
// Kompres/bersihkan gambar yang dikumpulkan, HASILKAN PENANDA RINGAN
// (bukan tempel base64 utuh ke teks!) + peta gambar terpisah
// ============================================================
// 🔥 FIX FATAL: sebelumnya base64 gambar (bisa jutaan karakter buat 1
// dokumen) ditempel LANGSUNG di tengah teks yang dikirim ke AI. AI cuma
// butuh TAU "di sini ada gambar", dia sama sekali gak perlu (dan gak bisa
// dengan baik) "membaca" base64 sebagai teks — jadi semua data itu cuma
// jadi sampah yang bikin request ke AI kegedean & lambat, ujungnya sering
// gagal/timeout. Sekarang gambar diganti PENANDA RINGAN (cuma beberapa
// karakter, misal "[[IMG:3]]"), sementara data gambar aslinya disimpan
// terpisah di sini (imageMap) dan ditempel BALIK ke hasil parsing di sisi
// browser — bukan lewat AI sama sekali.
async function resolveImages(rawText, images, onProgress) {
  const seenSignatures = new Set();
  let text = rawText;
  let realImageCount = 0;
  const imageMap = {}; // { "0": dataURI, "1": dataURI, ... }

  for (let i = 0; i < images.length; i++) {
    const dataUri = images[i];
    const placeholder = `\x00IMG${i}\x00`;
    const base64Part = dataUri.split(',')[1] || '';
    const approxBytes = Math.floor(base64Part.length * 0.75);

    // Buang gambar kecil (kemungkinan besar cuma bullet/ikon pilihan a/b/c/d,
    // bukan diagram/foto soal beneran)
    if (approxBytes < MIN_IMAGE_BYTES) {
      text = text.replace(placeholder, '');
      continue;
    }

    // Buang duplikat persis (dokumen sering ada bagian yang keulang)
    const signature = dataUri.length + '_' + dataUri.slice(0, 80);
    if (seenSignatures.has(signature)) {
      text = text.replace(placeholder, '');
      continue;
    }
    seenSignatures.add(signature);

    try {
      onProgress?.(`Mengecilkan gambar ${++realImageCount}...`);
      const fetched = await fetch(dataUri);
      const blob = await fetched.blob();
      const compressedBlob = await imageCompression(blob, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      });
      const compressedDataUri = await imageCompression.getDataUrlFromFile(compressedBlob);
      const imgId = String(Object.keys(imageMap).length);
      imageMap[imgId] = compressedDataUri;
      // 🔥 Penanda RINGAN doang yang masuk ke teks (cuma ~10 karakter),
      // BUKAN data base64-nya. Data asli aman di imageMap, dipakai lagi nanti.
      text = text.replace(placeholder, `[[IMG:${imgId}]]`);
    } catch (e) {
      // Gagal kompres 1 gambar -> buang aja gambarnya, jangan gagalkan semuanya
      console.error('Gagal kompres gambar ke-' + i + ':', e);
      text = text.replace(placeholder, '');
    }
  }

  return { text: text.replace(/\n{3,}/g, '\n\n').trim(), imageMap, totalRealImages: Object.keys(imageMap).length };
}

// ============================================================
// Pecah teks jadi beberapa paket berdasarkan batas nomor soal,
// supaya tiap paket yang dikirim ke server tetap kecil & aman
// ============================================================
function splitIntoPackages(text, perPackage) {
  const lines = text.split('\n');
  const blocks = [];
  let current = [];

  for (const line of lines) {
    const isNewQuestion = /^\d{1,3}[.)]\s+/.test(line.trim());
    if (isNewQuestion && current.length > 0) {
      blocks.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current.join('\n'));

  // Gabungkan tiap `perPackage` soal jadi satu paket kiriman
  const packages = [];
  for (let i = 0; i < blocks.length; i += perPackage) {
    const chunk = blocks.slice(i, i + perPackage).join('\n');
    if (chunk.trim().length > 10) packages.push(chunk);
  }
  return { packages, detectedQuestionBlocks: blocks.length };
}

// 🔥 Helper: tempel gambar dari placeholder [[IMG:n]] balik ke satu string,
// kembalikan { cleanText, imageDataUri } -- dipakai bareng buat teks soal
// MAUPUN teks tiap opsi jawaban.
const IMG_TAG_REGEX = /\[\[IMG:(\d+)\]\]/;
function extractImageFromText(text, imageMap) {
  const raw = String(text || '');
  const match = raw.match(IMG_TAG_REGEX);
  if (match && imageMap[match[1]]) {
    return { cleanText: raw.replace(IMG_TAG_REGEX, '').trim(), imageDataUri: imageMap[match[1]] };
  }
  // Penanda ada tapi gambarnya gak ketemu di map (mis. kebuang krn kekecilan) -- bersihkan aja teksnya
  if (IMG_TAG_REGEX.test(raw)) {
    return { cleanText: raw.replace(IMG_TAG_REGEX, '').trim(), imageDataUri: '' };
  }
  return { cleanText: raw, imageDataUri: '' };
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
      // 1. Baca & ekstrak isi Word LANGSUNG DI BROWSER (bukan dikirim ke server dulu)
      setStatusLabel('Membaca isi file Word...');
      const arrayBuffer = await file.arrayBuffer();
      const { value: html, messages: mammothMessages } = await mammoth.convertToHtml({ arrayBuffer });
      if (mammothMessages?.length) {
        // Peringatan dari mammoth (mis. gaya/format yang gak sepenuhnya
        // didukung) -- gak fatal, tapi berguna buat debug kalau ada laporan
        // "gagal impor" lagi ke depannya.
        console.warn('Peringatan mammoth saat baca Word:', mammothMessages);
      }

      // 2. Ubah HTML jadi teks polos (paham struktur soal+opsi, baik bersarang
      //    maupun bersebelahan), sambil kumpulin gambar buat diproses belakangan
      setStatusLabel('Membaca struktur soal...');
      const { rawText, images } = extractPlainTextAndImages(html);

      // 3. Kecilin gambar-gambarnya, GANTI jadi penanda ringan (bukan base64 utuh)
      setStatusLabel('Memeriksa gambar di dalam dokumen...');
      const { text: plainText, imageMap, totalRealImages } = await resolveImages(rawText, images, (msg) => setStatusLabel(msg));

      if (!plainText || plainText.trim().length < 10) {
        throw new Error('File Word kosong atau teksnya tidak bisa dibaca. Coba buka & Save As ulang file-nya di Word, lalu upload lagi.');
      }

      // 4. Pecah jadi paket-paket kecil biar aman dikirim (di bawah batas server)
      const { packages, detectedQuestionBlocks } = splitIntoPackages(plainText, QUESTIONS_PER_PACKAGE);
      if (packages.length === 0) {
        throw new Error('Tidak ditemukan soal. Pastikan tiap soal diawali nomor (1. 2. 3. dst) di baris tersendiri.');
      }
      console.log(`[WordImportQuiz] Terdeteksi ~${detectedQuestionBlocks} blok soal, ${totalRealImages} gambar valid, dipecah jadi ${packages.length} paket kiriman.`);

      // 5. Kirim tiap paket satu-satu ke AI (server) — cuma teks + penanda
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
          // Kalau 1 paket gagal, tetap lanjut ke paket berikutnya -> partial success
          failedPackages++;
          console.error(`[WordImportQuiz] Paket ${i + 1} error jaringan:`, e);
        }
      }

      if (allQuestions.length === 0) {
        throw new Error('Tidak ada soal yang berhasil diproses. Coba cek format penomoran soalnya, atau coba lagi (mungkin kuota AI lagi penuh).');
      }

      // 6. Tempel BALIK gambar asli — AI cuma megang penanda "[[IMG:n]]",
      //    data gambar sebenarnya (base64) diambil dari imageMap yang tadi
      //    disimpan di browser, TIDAK PERNAH ikut terkirim ke AI.
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
          } else {
            next.qImage = fromQImage.cleanText ? '' : (next.qImage || '');
            if (IMG_TAG_REGEX.test(next.qImage || '')) next.qImage = '';
          }
        }

        // 🔥 BARU: Gambar di OPSI JAWABAN (mis. soal pola kubus yang tiap
        // pilihannya berupa gambar, bukan teks) -- SEBELUMNYA SAMA SEKALI
        // TIDAK DITANGANI, jadi soal bergambar-di-opsi selalu rusak/hilang
        // pas diimpor. Sekarang tiap opsi dicek satu per satu; kalau ada
        // penanda gambarnya, dipindah ke `optionImages` dan `optionsAreImages`
        // otomatis diaktifkan supaya ManageQuiz.jsx menampilkannya sebagai
        // pilihan bergambar, persis seperti kalau guru upload manual.
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
        noteMsg += `⚠️ ${failedPackages} dari ${packages.length} bagian gagal diproses (kemungkinan kuota AI penuh atau koneksi terputus). Cek dulu apakah ada nomor soal yang terlewat — kalau ada, bisa diimpor ulang atau ditambah manual.\n\n`;
      }
      if (totalRealImages > 0) {
        noteMsg += `🖼️ ${totalRealImages} gambar terdeteksi di dokumen, ${totalImagesUsed} soal berhasil ditempeli gambar. Cek dulu satu-satu sebelum diterbitkan, terutama soal yang seharusnya bergambar tapi belum ada gambarnya.`;
      }
      if (noteMsg) {
        alert(`✅ ${allQuestions.length} soal berhasil diimpor.\n\n${noteMsg}`);
      }

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
                <li>Tiap soal diawali nomor, contoh: <b>1. Sebuah teko listrik...</b></li>
                <li>Jawaban benar ditandai <b>bold/tebal</b> langsung di depan opsinya</li>
                <li>Gambar (kalau ada) ditempel langsung di dalam dokumen Word, tepat dekat soalnya — termasuk kalau OPSI JAWABANNYA sendiri berupa gambar (bukan cuma soalnya)</li>
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