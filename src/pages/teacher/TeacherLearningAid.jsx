// src/pages/teacher/TeacherLearningAid.jsx
//
// 🔥 "ALAT BANTU GURU" — TERPISAH TOTAL dari E-Learning (yang tampil ke
// siswa). Ini ruang kerja PRIVAT guru: upload buku paket SEKALI, jadi bank
// referensi permanen, lalu cari topik & generate alat bantu belajar yang
// DIGROUNDING ke buku itu (AI baca bagian buku yang relevan, bukan
// mengarang dari pengetahuan umumnya) -- lengkap dengan Capaian
// Pembelajaran, RPP ringkas, dan materi inti bergaya Cara Gemilang.
//
// 🔥 BARU: dulu guru harus isi manual "Dari Halaman X sampai Y" -- padahal
// nomor halaman FISIK PDF hampir selalu beda dari nomor cetak di buku
// (kegeser gara-gara cover, kata pengantar, daftar isi). Sekarang begitu
// buku diupload, sistem otomatis MEMETAKAN tiap Bab ke halaman fisiknya
// (lewat /api/detectBookChapters, dipanggil SEKALI saat upload, bukan tiap
// generate). Guru tinggal KLIK nama babnya, gak perlu ngitung halaman sama
// sekali. Kalau deteksinya gagal/buku gak berstruktur bab jelas, tetap ada
// jalur manual sebagai cadangan.
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
  ChevronRight, Hash, CheckCircle, ListTree, PencilLine, ArrowLeft
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// ============================================================
// RENDER RUMUS DI DALAM HTML (sama pola dengan file lain di sistem)
// ============================================================
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

// ============================================================
// EKSTRAK TEKS PDF PER HALAMAN (di browser, gak lewat server)
// ============================================================
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

// ============================================================
// 🔥 DETEKSI STRUKTUR BAB — dipanggil sekali pas upload. Gagal pun gak
// masalah, upload buku tetap lanjut (fallback ke halaman manual nanti).
// ============================================================
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

const TeacherLearningAid = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('buat'); // 'buat' | 'upload'
  const fileInputRef = useRef(null);

  const [guruId, setGuruId] = useState('');
  const [guruName, setGuruName] = useState('');

  // ===== BANK BUKU REFERENSI =====
  const [bukuList, setBukuList] = useState([]);
  const [loadingBuku, setLoadingBuku] = useState(true);

  // ===== UPLOAD =====
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadMapel, setUploadMapel] = useState('');
  const [uploadKelas, setUploadKelas] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // ===== GENERATE =====
  const [selectedBukuId, setSelectedBukuId] = useState('');
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(null);
  const [showManualRange, setShowManualRange] = useState(false);
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(10);
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

  // ============================================================
  // UPLOAD BUKU PAKET
  // ============================================================
  const handleUploadPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('❌ Cuma file PDF yang didukung.');
      return;
    }
    if (!uploadTitle.trim()) {
      alert('❌ Isi dulu judul buku (mis. "Buku Paket Matematika Kelas 8 SMP") sebelum upload.');
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
        throw new Error('Tidak ada teks yang bisa dibaca dari PDF ini. Kemungkinan ini hasil scan/foto (bukan PDF teks asli) — coba pakai file PDF yang teksnya bisa di-select/copy.');
      }

      // 🔥 Deteksi struktur bab OTOMATIS supaya nanti guru tinggal klik nama
      // bab, gak perlu tau/hitung sendiri nomor halaman fisik PDF-nya.
      setUploadStatus('Memetakan struktur bab...');
      const chapters = await detectChapters(pages, uploadTitle.trim());

      setUploadStatus('Menyimpan ke bank referensi...');
      const bukuRef = await addDoc(collection(db, 'buku_referensi'), {
        title: uploadTitle.trim(),
        mapel: uploadMapel.trim() || 'Umum',
        kelas: uploadKelas.trim() || '-',
        fileName: file.name,
        totalPages: pages.length,
        chapters, // [] kalau deteksi gagal -- generate tab otomatis fallback ke manual
        guruId, guruName,
        createdAt: serverTimestamp(),
      });

      // 🔥 Simpan tiap halaman sebagai dokumen TERPISAH di subcollection
      // (bukan 1 dokumen raksasa) -- buku 300+ halaman bisa gampang tembus
      // batas ukuran 1 dokumen Firestore (1MB) kalau digabung jadi satu.
      // Ditulis per 400 biar aman di bawah batas 500 operasi/batch Firestore.
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

      const chapterNote = chapters.length > 0
        ? `Sistem berhasil memetakan ${chapters.length} bab -- nanti tinggal klik nama babnya, gak perlu isi nomor halaman.`
        : `Sistem belum berhasil memetakan bab otomatis untuk buku ini -- nanti bisa atur halaman manual saat generate.`;
      alert(`✅ "${uploadTitle}" berhasil diupload (${pages.length} halaman)!\n\n${chapterNote}`);
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
    if (!window.confirm(`Hapus "${buku.title}" dari bank referensi? Semua ${buku.totalPages} halaman yang tersimpan ikut terhapus.`)) return;
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

  // ============================================================
  // GENERATE ALAT BANTU (GROUNDED KE BUKU YANG DIPILIH)
  // ============================================================
  const selectedBuku = bukuList.find(b => b.id === selectedBukuId);
  const hasChapters = (selectedBuku?.chapters || []).length > 0;

  const handleSelectBuku = (id) => {
    setSelectedBukuId(id);
    setSelectedChapterIdx(null);
    setShowManualRange(false);
    setPageStart(1);
    setPageEnd(10);
  };

  const handleSelectChapter = (idx, chapter) => {
    setSelectedChapterIdx(idx);
    setPageStart(chapter.startPage);
    setPageEnd(chapter.endPage);
  };

  const handleGenerate = async () => {
    setError('');
    if (!selectedBukuId) return setError('❌ Pilih dulu buku referensinya.');
    if (hasChapters && !showManualRange && selectedChapterIdx === null) {
      return setError('❌ Pilih dulu bab/bagian yang mau dijadikan sumber.');
    }
    if (!topic.trim()) return setError('❌ Isi dulu topik yang mau dicari (mis. "Integral Tak Tentu").');
    if (pageStart < 1 || pageEnd < pageStart) return setError('❌ Rentang halaman tidak valid.');
    if (pageEnd - pageStart > 25) {
      const lanjut = window.confirm('⚠️ Rentang halaman cukup luas (>25 halaman). Prosesnya bisa lebih lama dan hasilnya kurang fokus. Tetap lanjut?');
      if (!lanjut) return;
    }

    setGenerating(true);
    setResult(null);
    setStatusLabel(`Membaca halaman ${pageStart}-${pageEnd} dari "${selectedBuku.title}"...`);

    try {
      const q = query(
        collection(db, 'buku_referensi', selectedBukuId, 'pages'),
        where('pageNumber', '>=', Number(pageStart)),
        where('pageNumber', '<=', Number(pageEnd))
      );
      const snap = await getDocs(q);
      const sourceText = snap.docs
        .map(d => d.data())
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map(p => p.text)
        .join('\n\n');

      if (!sourceText.trim()) {
        throw new Error('Gak ada teks ditemukan di rentang halaman itu. Cek lagi nomor halamannya.');
      }

      setStatusLabel('AI menyusun Capaian Pembelajaran, RPP, dan materi... (30-60 detik)');

      const res = await fetch('/api/generateGuruLearningAid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          mapel: selectedBuku.mapel,
          kelas: kelasTopik.trim() || selectedBuku.kelas,
          arahan: arahan.trim(),
          sourceText,
          sourceTitle: selectedBuku.title,
          pageRange: `${pageStart}-${pageEnd}`,
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

  // ============================================================
  // RENDER
  // ============================================================
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

      {/* TAB */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setActiveTab('buat')} style={tabBtnStyle(activeTab === 'buat')}>
          <Sparkles size={14} /> Buat Alat Bantu
        </button>
        <button onClick={() => setActiveTab('upload')} style={tabBtnStyle(activeTab === 'upload')}>
          <Upload size={14} /> Buku Referensi ({bukuList.length})
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB: UPLOAD BUKU */}
      {/* ============================================================ */}
      {activeTab === 'upload' && (
        <div>
          <div style={cardStyle}>
            <h4 style={cardTitleStyle}><Upload size={16} /> Upload Buku Paket Baru</h4>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
              Upload SEKALI per buku, dipakai berkali-kali selamanya buat generate topik apa pun dari buku itu. Sistem
              otomatis memetakan bab-babnya, jadi nanti tinggal klik nama babnya. Butuh PDF yang teksnya bisa
              di-select (bukan hasil scan foto halaman).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Judul buku (wajib)" style={inputStyle} disabled={uploading} />
              <input value={uploadMapel} onChange={e => setUploadMapel(e.target.value)} placeholder="Mapel (mis. Matematika)" style={inputStyle} disabled={uploading} />
              <input value={uploadKelas} onChange={e => setUploadKelas(e.target.value)} placeholder="Kelas (mis. 8 SMP)" style={inputStyle} disabled={uploading} />
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{b.title}</div>
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

      {/* ============================================================ */}
      {/* TAB: BUAT ALAT BANTU */}
      {/* ============================================================ */}
      {activeTab === 'buat' && (
        <div>
          {bukuList.length === 0 && !loadingBuku ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: 30 }}>
              <BookOpen size={32} color="#cbd5e1" />
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>
                Belum ada buku referensi. Upload buku paket dulu di tab "Buku Referensi" sebelum bisa generate alat bantu.
              </p>
              <button onClick={() => setActiveTab('upload')} style={{ marginTop: 10, padding: '8px 18px', background: '#673ab7', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Upload Buku Sekarang
              </button>
            </div>
          ) : (
            <div style={cardStyle}>
              <h4 style={cardTitleStyle}><Search size={16} /> Cari Topik dari Buku Referensi</h4>

              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>📚 Buku Referensi</label>
                <select value={selectedBukuId} onChange={e => handleSelectBuku(e.target.value)} style={selectStyle}>
                  <option value="">-- Pilih Buku --</option>
                  {bukuList.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.mapel} · {b.kelas} · {b.totalPages} hal)</option>
                  ))}
                </select>
              </div>

              {/* ============================================================
                  🔥 PEMILIHAN SUMBER -- daftar bab (klik nama) sebagai jalur
                  utama, halaman manual cuma jalur cadangan buat kasus khusus
                  (buku tanpa struktur bab jelas, atau topik lintas-bab).
                  ============================================================ */}
              {selectedBuku && (
                <div style={{ marginBottom: 10 }}>
                  {hasChapters && !showManualRange ? (
                    <div>
                      <label style={labelStyle}><ListTree size={12} style={{ verticalAlign: -2 }} /> Pilih Bab / Bagian</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: 6, background: '#fafafa' }}>
                        {selectedBuku.chapters.map((c, idx) => {
                          const active = selectedChapterIdx === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectChapter(idx, c)}
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
                        onClick={() => setShowManualRange(true)}
                        style={{ marginTop: 6, background: 'none', border: 'none', fontSize: 10, color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <PencilLine size={11} /> Topik saya lintas-bab / gak ada di daftar? Atur halaman manual
                      </button>
                    </div>
                  ) : (
                    <div>
                      {hasChapters && (
                        <button
                          type="button"
                          onClick={() => setShowManualRange(false)}
                          style={{ marginBottom: 8, background: 'none', border: 'none', fontSize: 10, color: '#673ab7', textDecoration: 'underline', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <ArrowLeft size={11} /> Kembali pilih dari daftar bab
                        </button>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={labelStyle}>Dari Halaman</label>
                          <input type="number" min={1} max={selectedBuku.totalPages} value={pageStart} onChange={e => setPageStart(parseInt(e.target.value) || 1)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Sampai Halaman</label>
                          <input type="number" min={1} max={selectedBuku.totalPages} value={pageEnd} onChange={e => setPageEnd(parseInt(e.target.value) || 1)} style={inputStyle} />
                        </div>
                      </div>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: '6px 0 0' }}>
                        💡 Nomor halaman di sini mengikuti urutan FISIK file PDF (halaman pertama = cover), bukan
                        nomor cetak di buku. Cek dulu di file PDF-nya buku ini ada di halaman fisik berapa.
                        {!hasChapters && ' Sistem belum berhasil memetakan bab otomatis untuk buku ini.'}
                      </p>
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
                <input value={kelasTopik} onChange={e => setKelasTopik(e.target.value)} placeholder={selectedBuku?.kelas || 'Kelas 12 SMA'} style={inputStyle} />
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

          {/* ============================================================ */}
          {/* HASIL GENERATE */}
          {/* ============================================================ */}
          {result && (
            <div style={{ marginTop: 16 }}>
              <div style={{ ...cardStyle, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6d28d9', marginBottom: 4 }}>
                  📖 Sumber: {result.sourceTitle} (hal. {result.pageRange})
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{topic}</h3>
              </div>

              {/* CAPAIAN PEMBELAJARAN */}
              <div style={resultSectionStyle}>
                <div style={resultSectionHeader('#0d9488', '#f0fdfa')}>
                  <Target size={16} color="#0d9488" /> Capaian Pembelajaran
                </div>
                <div
                  style={{ fontSize: 13, color: '#134e4a', lineHeight: 1.8, padding: '14px 16px' }}
                  dangerouslySetInnerHTML={{ __html: renderMathInHtml(result.capaian_pembelajaran) }}
                />
              </div>

              {/* RPP RINGKAS */}
              <div style={resultSectionStyle}>
                <div style={resultSectionHeader('#b45309', '#fffbeb')}>
                  <ClipboardList size={16} color="#b45309" /> RPP Ringkas
                </div>
                <div
                  style={{ fontSize: 13, color: '#78350f', lineHeight: 1.8, padding: '14px 16px' }}
                  dangerouslySetInnerHTML={{ __html: renderMathInHtml(result.rpp_ringkas) }}
                />
              </div>

              {/* MATERI INTI */}
              <div style={resultSectionStyle}>
                <div style={resultSectionHeader('#673ab7', '#faf5ff')}>
                  <Sparkles size={16} color="#673ab7" /> Materi Inti — Cara Gemilang
                </div>
                <div
                  style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8, padding: '14px 16px' }}
                  dangerouslySetInnerHTML={{ __html: renderMathInHtml(result.materi_inti) }}
                />
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

// ============================================================
// STYLES
// ============================================================
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