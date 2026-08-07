// src/pages/teacher/TeacherLearningAid.jsx
//
// 🔥 "ALAT BANTU GURU" — TERPISAH TOTAL dari E-Learning (yang tampil ke
// siswa). Upload buku paket sekali, jadi bank referensi permanen, lalu cari
// topik & generate alat bantu belajar yang DIGROUNDING ke buku itu.
//
// 🔥 BARU (revisi ini) — 2 masalah nyata yang dibenerin:
//
// 1) DUA JENIS BUKU DIGABUNG SEBAGAI SUMBER, bukan pilih salah satu.
//    Buku Guru sudah TERSTRUKTUR persis format Capaian Pembelajaran/Tujuan
//    Pembelajaran, sedangkan Buku Siswa isinya materi inti yang lebih dalam
//    (rumus, contoh soal). Sekarang guru bisa upload & tandai jenis
//    bukunya (Siswa/Guru/Lainnya), lalu saat generate boleh gabung DUA
//    buku sekaligus sebagai sumber -- RPP & Capaian Pembelajaran ditarik
//    utamanya dari Buku Guru, Materi Inti dari Buku Siswa.
//
// 2) KALAU SUMBER TERNYATA GAK CUKUP buat topik yang diminta (misal guru
//    minta "Integral" tapi rentang yang dipilih cuma Bab Turunan Fungsi),
//    backend sekarang WAJIB balas flag terpisah `source_insufficient`,
//    BUKAN nulis kalimat penolakan di dalam isi hasil seolah itu konten
//    beneran. Depan sini ditampilin sebagai peringatan jelas + tombol buat
//    cari ulang, bukan kartu hasil yang isinya membingungkan.
//
// ⚠️ DEPENDENSI: `pdfjs-dist` (baca teks dari PDF buku paket di browser).
// ⚠️ Backend endpoint: /api/generateGuruLearningAid dan /api/detectBookChapters

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import {
  collection, addDoc, doc, getDocs, deleteDoc, query, where,
  orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import {
  GraduationCap, Upload, BookOpen, Sparkles, Loader2, X, Trash2,
  FileText, Search, Target, ClipboardList, Wand2, AlertCircle,
  ChevronRight, Hash, CheckCircle, ListTree, PencilLine, ArrowLeft,
  Link2, Plus, RefreshCw
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const BOOK_TYPES = [
  { value: 'siswa', label: '📗 Buku Siswa' },
  { value: 'guru', label: '📘 Buku Guru' },
  { value: 'lainnya', label: '📄 Lainnya' },
];

const renderMathInHtml = (html) => {
  if (!html) return html;
  let result = html;
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (m, expr) => {
    try { return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: true }); }
    catch (e) { return m; }
  });
  result = result.replace(/\$([^$\n]+?)\$/g, (m, expr) => {
    try { return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: false }); }
    catch (e) { return m; }
  });
  return result;
};

const extractPdfPages = async (file, onProgress) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
    pages.push({ pageNumber: i, text });
  }
  return pages;
};

const detectChapters = async (pages, bookTitle) => {
  try {
    const res = await fetch('/api/detectBookChapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle,
        totalPages: pages.length,
        pages: pages.map(p => ({ pageNumber: p.pageNumber, snippet: p.text.slice(0, 160) })),
      }),
    });
    const data = await res.json();
    return data?.success ? (data.chapters || []) : [];
  } catch (e) {
    console.error('Deteksi struktur bab gagal, lanjut tanpa itu:', e);
    return [];
  }
};

const emptySourceState = () => ({ bukuId: '', chapterIdx: null, showManualRange: false, pageStart: 1, pageEnd: 10 });

const TeacherLearningAid = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('buat');
  const fileInputRef = useRef(null);

  const [guruId, setGuruId] = useState('');
  const [guruName, setGuruName] = useState('');

  const [bukuList, setBukuList] = useState([]);
  const [loadingBuku, setLoadingBuku] = useState(true);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadMapel, setUploadMapel] = useState('');
  const [uploadKelas, setUploadKelas] = useState('');
  const [uploadBookType, setUploadBookType] = useState('siswa');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const [primary, setPrimary] = useState(emptySourceState());
  const [secondaryEnabled, setSecondaryEnabled] = useState(false);
  const [secondary, setSecondary] = useState(emptySourceState());

  const [topic, setTopic] = useState('');
  const [kelasTopik, setKelasTopik] = useState('');
  const [arahan, setArahan] = useState('');
  const [generating, setGenerating] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
    setGuruId(saved.guruId || saved.id || '');
    setGuruName(saved.nama || '');
  }, []);

  const fetchBukuList = async () => {
    setLoadingBuku(true);
    try {
      const q = query(collection(db, 'buku_referensi'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setBukuList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Gagal ambil daftar buku referensi:', e);
    }
    setLoadingBuku(false);
  };

  useEffect(() => { fetchBukuList(); }, []);

  const handleUploadPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('❌ Cuma file PDF yang didukung.');
      return;
    }
    if (!uploadTitle.trim()) {
      alert('❌ Isi dulu judul buku sebelum upload.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      setUploadStatus('Membaca halaman 1...');
      const pages = await extractPdfPages(file, (cur, total) => {
        setUploadStatus(`Membaca halaman ${cur} dari ${total}...`);
      });

      if (pages.length === 0 || pages.every(p => !p.text)) {
        throw new Error('Tidak ada teks yang bisa dibaca dari PDF ini. Kemungkinan ini hasil scan/foto — coba pakai file PDF yang teksnya bisa di-select/copy.');
      }

      setUploadStatus('Memetakan struktur bab...');
      const chapters = await detectChapters(pages, uploadTitle.trim());

      setUploadStatus('Menyimpan ke bank referensi...');
      const bukuRef = await addDoc(collection(db, 'buku_referensi'), {
        title: uploadTitle.trim(),
        mapel: uploadMapel.trim() || 'Umum',
        kelas: uploadKelas.trim() || '-',
        bookType: uploadBookType,
        fileName: file.name,
        totalPages: pages.length,
        chapters,
        guruId, guruName,
        createdAt: serverTimestamp(),
      });

      const CHUNK = 400;
      for (let i = 0; i < pages.length; i += CHUNK) {
        const batch = writeBatch(db);
        pages.slice(i, i + CHUNK).forEach(p => {
          const pageRef = doc(db, 'buku_referensi', bukuRef.id, 'pages', String(p.pageNumber).padStart(5, '0'));
          batch.set(pageRef, p);
        });
        await batch.commit();
        setUploadStatus(`Menyimpan halaman ${Math.min(i + CHUNK, pages.length)} dari ${pages.length}...`);
      }

      const pairFound = bukuList.find(b =>
        (b.mapel || '').trim().toLowerCase() === (uploadMapel || 'Umum').trim().toLowerCase() &&
        (b.kelas || '').trim().toLowerCase() === (uploadKelas || '-').trim().toLowerCase() &&
        b.bookType && b.bookType !== uploadBookType
      );

      const chapterNote = chapters.length > 0
        ? `Sistem berhasil memetakan ${chapters.length} bab.`
        : `Sistem belum berhasil memetakan bab otomatis -- nanti bisa atur halaman manual saat generate.`;
      const pairNote = pairFound
        ? `\n\n📎 Ketemu pasangannya: "${pairFound.title}" sudah pernah diupload. Nanti pas generate, keduanya bisa digabung jadi sumber sekaligus.`
        : '';
      alert(`✅ "${uploadTitle}" berhasil diupload (${pages.length} halaman)!\n\n${chapterNote}${pairNote}`);
      setUploadTitle(''); setUploadMapel(''); setUploadKelas('');
      await fetchBukuList();
      setActiveTab('buat');
    } catch (err) {
      console.error('Gagal upload buku referensi:', err);
      alert('❌ ' + err.message);
    } finally {
      setUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteBuku = async (buku) => {
    if (!window.confirm(`Hapus "${buku.title}" dari bank referensi? Semua ${buku.totalPages} halaman ikut terhapus.`)) return;
    try {
      const pagesSnap = await getDocs(collection(db, 'buku_referensi', buku.id, 'pages'));
      const CHUNK = 400;
      const pageDocs = pagesSnap.docs;
      for (let i = 0; i < pageDocs.length; i += CHUNK) {
        const batch = writeBatch(db);
        pageDocs.slice(i, i + CHUNK).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      await deleteDoc(doc(db, 'buku_referensi', buku.id));
      setBukuList(prev => prev.filter(b => b.id !== buku.id));
    } catch (e) {
      alert('❌ Gagal menghapus: ' + e.message);
    }
  };

  const primaryBuku = bukuList.find(b => b.id === primary.bukuId);
  const secondaryBuku = bukuList.find(b => b.id === secondary.bukuId);

  const suggestedPair = primaryBuku
    ? bukuList.find(b =>
        b.id !== primaryBuku.id &&
        (b.mapel || '').trim().toLowerCase() === (primaryBuku.mapel || '').trim().toLowerCase() &&
        (b.kelas || '').trim().toLowerCase() === (primaryBuku.kelas || '').trim().toLowerCase() &&
        b.bookType && primaryBuku.bookType && b.bookType !== primaryBuku.bookType
      )
    : null;

  const handleSelectPrimary = (id) => {
    setPrimary({ ...emptySourceState(), bukuId: id });
    setSecondaryEnabled(false);
    setSecondary(emptySourceState());
  };

  const handleEnableSuggestedPair = () => {
    if (!suggestedPair) return;
    setSecondaryEnabled(true);
    setSecondary({ ...emptySourceState(), bukuId: suggestedPair.id });
  };

  const renderSourcePicker = (buku, source, setSource) => {
    if (!buku) return null;
    const hasChapters = (buku.chapters || []).length > 0;
    return (
      <div>
        {hasChapters && !source.showManualRange ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: 6, background: '#fafafa' }}>
              {buku.chapters.map((c, idx) => {
                const active = source.chapterIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSource({ ...source, chapterIdx: idx, pageStart: c.startPage, pageEnd: c.endPage })}
                    style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: 8,
                      border: active ? '2px solid #673ab7' : '1px solid #e2e8f0',
                      background: active ? '#f5f3ff' : 'white', cursor: 'pointer',
                      fontSize: 12, fontWeight: active ? 700 : 500, color: '#1e293b',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    }}
                  >
                    <span>
                      {c.title}
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400, marginTop: 2 }}>Halaman {c.startPage}–{c.endPage}</div>
                    </span>
                    {active && <CheckCircle size={16} color="#673ab7" style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setSource({ ...source, showManualRange: true })}
              style={{ marginTop: 6, background: 'none', border: 'none', fontSize: 10, color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <PencilLine size={11} /> Gak ada di daftar / lintas-bab? Atur halaman manual
            </button>
          </div>
        ) : (
          <div>
            {hasChapters && (
              <button
                type="button"
                onClick={() => setSource({ ...source, showManualRange: false })}
                style={{ marginBottom: 8, background: 'none', border: 'none', fontSize: 10, color: '#673ab7', textDecoration: 'underline', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ArrowLeft size={11} /> Kembali pilih dari daftar bab
              </button>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Dari Halaman</label>
                <input type="number" min={1} max={buku.totalPages} value={source.pageStart} onChange={e => setSource({ ...source, pageStart: parseInt(e.target.value) || 1 })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sampai Halaman</label>
                <input type="number" min={1} max={buku.totalPages} value={source.pageEnd} onChange={e => setSource({ ...source, pageEnd: parseInt(e.target.value) || 1 })} style={inputStyle} />
              </div>
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '6px 0 0' }}>
              💡 Nomor halaman ngikutin urutan FISIK file PDF, bukan nomor cetak di buku.
              {!hasChapters && ' Sistem belum berhasil memetakan bab otomatis untuk buku ini.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const fetchSourceText = async (bukuId, pageStart, pageEnd) => {
    const q = query(
      collection(db, 'buku_referensi', bukuId, 'pages'),
      where('pageNumber', '>=', Number(pageStart)),
      where('pageNumber', '<=', Number(pageEnd))
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data())
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map(p => p.text)
      .join('\n\n');
  };

  const handleGenerate = async () => {
    setError('');
    if (!primary.bukuId) return setError('❌ Pilih dulu buku referensi utamanya.');
    const primaryHasChapters = (primaryBuku?.chapters || []).length > 0;
    if (primaryHasChapters && !primary.showManualRange && primary.chapterIdx === null) {
      return setError('❌ Pilih dulu bab/bagian dari buku utama.');
    }
    if (!topic.trim()) return setError('❌ Isi dulu topik yang mau dicari.');
    if (primary.pageStart < 1 || primary.pageEnd < primary.pageStart) return setError('❌ Rentang halaman buku utama tidak valid.');
    if (secondaryEnabled) {
      if (!secondary.bukuId) return setError('❌ Pilih buku pasangannya, atau matikan opsi "gabung buku pasangan".');
      if (secondary.pageStart < 1 || secondary.pageEnd < secondary.pageStart) return setError('❌ Rentang halaman buku pasangan tidak valid.');
    }

    const totalSpan = (primary.pageEnd - primary.pageStart) + (secondaryEnabled ? (secondary.pageEnd - secondary.pageStart) : 0);
    if (totalSpan > 40) {
      const lanjut = window.confirm('⚠️ Total rentang halaman cukup luas. Prosesnya bisa lebih lama dan hasilnya kurang fokus. Tetap lanjut?');
      if (!lanjut) return;
    }

    setGenerating(true);
    setResult(null);
    setStatusLabel(`Membaca sumber dari "${primaryBuku.title}"...`);

    try {
      const textPrimary = await fetchSourceText(primary.bukuId, primary.pageStart, primary.pageEnd);
      let textSecondary = '';
      if (secondaryEnabled && secondary.bukuId) {
        setStatusLabel(`Membaca sumber dari "${secondaryBuku.title}"...`);
        textSecondary = await fetchSourceText(secondary.bukuId, secondary.pageStart, secondary.pageEnd);
      }

      if (!textPrimary.trim() && !textSecondary.trim()) {
        throw new Error('Gak ada teks ditemukan di rentang halaman yang dipilih. Cek lagi bab/halamannya.');
      }

      let sourceTextGuru = '', sourceLabelGuru = '';
      let sourceTextSiswa = '', sourceLabelSiswa = '';
      const bucket = (buku, text) => {
        if (!buku || !text?.trim()) return;
        if (buku.bookType === 'guru') {
          sourceTextGuru += (sourceTextGuru ? '\n\n' : '') + text;
          sourceLabelGuru = sourceLabelGuru ? `${sourceLabelGuru}, ${buku.title}` : buku.title;
        } else {
          sourceTextSiswa += (sourceTextSiswa ? '\n\n' : '') + text;
          sourceLabelSiswa = sourceLabelSiswa ? `${sourceLabelSiswa}, ${buku.title}` : buku.title;
        }
      };
      bucket(primaryBuku, textPrimary);
      if (secondaryEnabled) bucket(secondaryBuku, textSecondary);

      setStatusLabel('AI menyusun Capaian Pembelajaran, RPP, dan materi... (30-60 detik)');

      const pageRangeLabel = secondaryEnabled
        ? `${primaryBuku.title} (hal. ${primary.pageStart}-${primary.pageEnd}) + ${secondaryBuku.title} (hal. ${secondary.pageStart}-${secondary.pageEnd})`
        : `${primaryBuku.title} (hal. ${primary.pageStart}-${primary.pageEnd})`;

      const res = await fetch('/api/generateGuruLearningAid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          mapel: primaryBuku.mapel,
          kelas: kelasTopik.trim() || primaryBuku.kelas,
          arahan: arahan.trim(),
          sourceTextGuru, sourceLabelGuru,
          sourceTextSiswa, sourceLabelSiswa,
          pageRangeLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal generate alat bantu.');

      setResult(data);
    } catch (e) {
      setError('❌ ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? 12 : 24, paddingBottom: 80 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={24} color="#673ab7" /> Alat Bantu Guru
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
          Upload buku paket sekali, jadi bank referensi selamanya. Cari topik, sistem susunkan Capaian Pembelajaran,
          RPP, dan materi bergaya Cara Gemilang — <b>khusus buat kamu</b>, gak pernah tampil ke siswa.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setActiveTab('buat')} style={tabBtnStyle(activeTab === 'buat')}>
          <Sparkles size={14} /> Buat Alat Bantu
        </button>
        <button onClick={() => setActiveTab('upload')} style={tabBtnStyle(activeTab === 'upload')}>
          <Upload size={14} /> Buku Referensi ({bukuList.length})
        </button>
      </div>

      {activeTab === 'upload' && (
        <div>
          <div style={cardStyle}>
            <h4 style={cardTitleStyle}><Upload size={16} /> Upload Buku Paket Baru</h4>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
              Upload Buku Siswa DAN Buku Guru buat mapel+kelas yang sama (tandai jenisnya) supaya nanti bisa
              digabung jadi sumber sekaligus — Buku Guru buat Capaian Pembelajaran & RPP, Buku Siswa buat materi inti.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Judul buku (wajib)" style={inputStyle} disabled={uploading} />
              <input value={uploadMapel} onChange={e => setUploadMapel(e.target.value)} placeholder="Mapel (mis. Kimia)" style={inputStyle} disabled={uploading} />
              <input value={uploadKelas} onChange={e => setUploadKelas(e.target.value)} placeholder="Kelas (mis. 12 SMA)" style={inputStyle} disabled={uploading} />
              <select value={uploadBookType} onChange={e => setUploadBookType(e.target.value)} style={selectStyle} disabled={uploading}>
                {BOOK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <label style={{ ...uploadBoxStyle, opacity: uploading ? 0.7 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}>
              {uploading ? (
                <>
                  <Loader2 size={26} className="spin-lah" color="#673ab7" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#673ab7' }}>{uploadStatus}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Jangan tutup halaman ini dulu ya</span>
                </>
              ) : (
                <>
                  <FileText size={26} color="#94a3b8" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Klik buat pilih file PDF buku paket</span>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={handleUploadPdf} disabled={uploading} />
            </label>
          </div>

          <div style={cardStyle}>
            <h4 style={cardTitleStyle}><BookOpen size={16} /> Bank Buku Referensi ({bukuList.length})</h4>
            {loadingBuku ? (
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Memuat...</p>
            ) : bukuList.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 20 }}>Belum ada buku diupload.</p>
            ) : (
              bukuList.map(b => (
                <div key={b.id} style={bukuRowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {b.title}
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#673ab7', background: '#ede9fe', padding: '1px 8px', borderRadius: 10 }}>
                        {BOOK_TYPES.find(t => t.value === b.bookType)?.label || '📄 Lainnya'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      {b.mapel} · {b.kelas} · {b.totalPages} halaman · diupload {b.guruName || '-'}
                      {b.chapters?.length > 0 && <> · <span style={{ color: '#673ab7', fontWeight: 700 }}>{b.chapters.length} bab terdeteksi</span></>}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteBuku(b)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'buat' && (
        <div>
          {bukuList.length === 0 && !loadingBuku ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: 30 }}>
              <BookOpen size={32} color="#cbd5e1" />
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>
                Belum ada buku referensi. Upload buku paket dulu sebelum bisa generate alat bantu.
              </p>
              <button onClick={() => setActiveTab('upload')} style={{ marginTop: 10, padding: '8px 18px', background: '#673ab7', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Upload Buku Sekarang
              </button>
            </div>
          ) : (
            <div style={cardStyle}>
              <h4 style={cardTitleStyle}><Search size={16} /> Cari Topik dari Buku Referensi</h4>

              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>📚 Buku Utama</label>
                <select value={primary.bukuId} onChange={e => handleSelectPrimary(e.target.value)} style={selectStyle}>
                  <option value="">-- Pilih Buku --</option>
                  {bukuList.map(b => (
                    <option key={b.id} value={b.id}>
                      {BOOK_TYPES.find(t => t.value === b.bookType)?.label.split(' ')[0] || ''} {b.title} ({b.mapel} · {b.kelas})
                    </option>
                  ))}
                </select>
              </div>

              {primaryBuku && (
                <div style={{ marginBottom: 10 }}>
                  {renderSourcePicker(primaryBuku, primary, setPrimary)}
                </div>
              )}

              {primaryBuku && (
                <div style={{ marginBottom: 14, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer', marginBottom: secondaryEnabled ? 10 : 0 }}>
                    <input type="checkbox" checked={secondaryEnabled} onChange={e => { setSecondaryEnabled(e.target.checked); if (!e.target.checked) setSecondary(emptySourceState()); }} />
                    <Link2 size={13} /> Gabung dengan buku pasangan (mis. Buku Siswa + Buku Guru)
                  </label>

                  {suggestedPair && !secondaryEnabled && (
                    <button
                      type="button"
                      onClick={handleEnableSuggestedPair}
                      style={{ marginTop: 8, fontSize: 11, color: '#673ab7', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Sparkles size={12} /> Ketemu kemungkinan pasangannya: "{suggestedPair.title}" — klik buat gabungkan
                    </button>
                  )}

                  {secondaryEnabled && (
                    <div>
                      <select value={secondary.bukuId} onChange={e => setSecondary({ ...emptySourceState(), bukuId: e.target.value })} style={{ ...selectStyle, marginBottom: 8 }}>
                        <option value="">-- Pilih Buku Pasangan --</option>
                        {bukuList.filter(b => b.id !== primary.bukuId).map(b => (
                          <option key={b.id} value={b.id}>
                            {BOOK_TYPES.find(t => t.value === b.bookType)?.label.split(' ')[0] || ''} {b.title} ({b.mapel} · {b.kelas})
                          </option>
                        ))}
                      </select>
                      {secondaryBuku && renderSourcePicker(secondaryBuku, secondary, setSecondary)}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>🎯 Topik <span style={{ color: '#ef4444' }}>*wajib</span></label>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Contoh: Kedudukan Titik atau Garis terhadap Lingkaran" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>🎓 Kelas (opsional, default ikut buku)</label>
                <input value={kelasTopik} onChange={e => setKelasTopik(e.target.value)} placeholder={primaryBuku?.kelas || 'Kelas 12 SMA'} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>📝 Arahan khusus (opsional)</label>
                <textarea value={arahan} onChange={e => setArahan(e.target.value)} placeholder="Kosongkan kalau tidak ada, atau isi kalau ada penekanan khusus" style={textareaStyle} />
              </div>

              {error && <div style={errorBoxStyle}><AlertCircle size={14} /> {error}</div>}

              <button onClick={handleGenerate} disabled={generating} style={generateBtnStyle(generating)}>
                {generating ? <Loader2 size={16} className="spin-lah" /> : <Wand2 size={16} />}
                {generating ? 'Menyusun...' : 'Buat Alat Bantu Belajar'}
              </button>

              {generating && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#673ab7', textAlign: 'center', fontWeight: 600 }}>
                  {statusLabel}
                </div>
              )}
            </div>
          )}

          {result?.source_insufficient && (
            <div style={{ ...cardStyle, background: '#fffbeb', border: '1px solid #fde68a', marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertCircle size={22} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>
                    Sumber yang dipilih belum mencakup topik "{topic}"
                  </div>
                  <p style={{ fontSize: 12, color: '#78350f', lineHeight: 1.7, margin: 0 }}>{result.insufficient_note}</p>
                  <p style={{ fontSize: 11, color: '#92400e', marginTop: 8, fontStyle: 'italic' }}>
                    💡 Sistem sengaja TIDAK mengarang materi di luar buku yang kamu upload, biar gak ada info yang salah/gak akurat.
                    Coba cari bab lain di buku ini, atau gabungkan dengan buku pasangannya (Buku Siswa/Buku Guru) di atas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {result && !result.source_insufficient && (
            <div style={{ marginTop: 16 }}>
              <div style={{ ...cardStyle, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6d28d9', marginBottom: 4 }}>
                  📖 Sumber: {result.pageRangeLabel}
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{topic}</h3>
              </div>

              <div style={resultSectionStyle}>
                <div style={resultSectionHeader('#0d9488', '#f0fdfa')}>
                  <Target size={16} color="#0d9488" /> Capaian Pembelajaran
                </div>
                <div style={{ fontSize: 13, color: '#134e4a', lineHeight: 1.8, padding: '14px 16px' }} dangerouslySetInnerHTML={{ __html: renderMathInHtml(result.capaian_pembelajaran) }} />
              </div>

              <div style={resultSectionStyle}>
                <div style={resultSectionHeader('#b45309', '#fffbeb')}>
                  <ClipboardList size={16} color="#b45309" /> RPP Ringkas
                </div>
                <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.8, padding: '14px 16px' }} dangerouslySetInnerHTML={{ __html: renderMathInHtml(result.rpp_ringkas) }} />
              </div>

              <div style={resultSectionStyle}>
                <div style={resultSectionHeader('#673ab7', '#faf5ff')}>
                  <Sparkles size={16} color="#673ab7" /> Materi Inti — Cara Gemilang
                </div>
                <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8, padding: '14px 16px' }} dangerouslySetInnerHTML={{ __html: renderMathInHtml(result.materi_inti) }} />
              </div>

              <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
                💡 Hasil ini ditarik dari buku paket yang kamu upload sendiri — silakan cek ulang sebelum dipakai mengajar, terutama bagian hitungan.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spinLah { to { transform: rotate(360deg); } }
        .spin-lah { animation: spinLah 1s linear infinite; }
      `}</style>
    </div>
  );
};

const tabBtnStyle = (active) => ({
  padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
  background: active ? '#673ab7' : '#f1f5f9', color: active ? 'white' : '#64748b',
});
const cardStyle = { background: 'white', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 16 };
const cardTitleStyle = { margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 };
const inputStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, background: 'white', cursor: 'pointer' };
const textareaStyle = { ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' };
const labelStyle = { fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 };
const uploadBoxStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '26px 16px', border: '2px dashed #ddd6fe', borderRadius: 10, background: '#faf5ff' };
const bukuRowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, border: '1px solid #f1f5f9' };
const errorBoxStyle = { background: '#fee2e2', color: '#ef4444', padding: 10, borderRadius: 8, fontSize: 12, display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 10 };
const generateBtnStyle = (busy) => ({
  width: '100%', padding: 12, background: busy ? '#a78bfa' : 'linear-gradient(135deg,#673ab7,#8b5cf6)',
  color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13,
  cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
});
const resultSectionStyle = { background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12, overflow: 'hidden' };
const resultSectionHeader = (color, bg) => ({
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
  background: bg, borderBottom: `1px solid ${color}30`, fontSize: 12, fontWeight: 800, color,
});

export default TeacherLearningAid;