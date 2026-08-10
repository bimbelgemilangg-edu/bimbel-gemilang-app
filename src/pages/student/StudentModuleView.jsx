// src/pages/student/StudentModuleView.jsx
import React, { useState, useEffect, useReducer, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
  ArrowLeft, Clock, FileText, CheckCircle, Eye, 
  Link as LinkIcon, HelpCircle, Trash2, X, Send, 
  Download, BookOpen, Hash, Tag, Upload, User,
  AlertCircle, Lock, Shield, Zap, Award, ExternalLink,
  FileQuestion, Calendar, Users, Target, Edit3, EyeOff,
  FileImage, FileVideo, Play, Youtube, Globe,
  FileSpreadsheet, FileArchive, FileCode, Maximize2,
  Sparkles, ChevronRight, BookMarked, PartyPopper
} from 'lucide-react';
import { uploadElearningFile } from '../../services/uploadService';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import katex from 'katex';

// ============================================================
// 🔥 BARU: "LAPISAN USIA" -- SD vs REMAJA (SMP-SMA)
// ============================================================
// Riset desain anak (SD) vs remaja (SMP-SMA) beda kebutuhan visualnya:
// SD butuh warna cerah, elemen besar, feedback seru & instan (lebih
// "playful"); remaja mulai risih sama tampilan kekanakan, lebih cocok
// desain bersih & modern tapi tetap hangat, dengan gamifikasi yang
// dibungkus lebih "dewasa" (progress/streak, bukan bintang-bintang).
// Dideteksi otomatis dari field kelasSekolah siswa (mis. "3 SD", "9 SMP",
// "12 SMA") -- tidak perlu setting manual apa pun dari guru/admin.
// ============================================================
// 🔥 GERBANG AKSES PER PAKET MAPEL
// ============================================================
// Bimbel Gemilang punya strategi harga paket per mapel (1 mapel / 2 mapel
// / 4 mapel lengkap khusus SD) -- siswa yang cuma daftar 1 mapel (misal
// Matematika doang) SEHARUSNYA gak otomatis bisa akses modul mapel lain
// (IPA, Bahasa Indonesia, dst) walau dia satu kelas/kategori sama siswa
// yang bayar paket lengkap.
//
// `enrolledSubjects` diisi lewat halaman administrasi siswa (Edit Siswa)
// -- bisa berisi KODE mapel (mis. "MAPEL-004") atau NAMA mapel (mis.
// "Matematika"), atau "Semua" buat paket lengkap. Kalau field ini kosong
// (belum diisi admin), akses DIBLOKIR -- bukan lagi diizinkan default.
//
// 🔥 FIX BUG "siswa sudah didaftarkan mapelnya tapi tetap Akses Ditolak":
// sebelumnya pencocokan CUMA lewat KODE mapel (modul.kodeMapel vs
// enrolledSubjects). Masalahnya kode mapel di dokumen modul (asalnya dari
// data guru) dan kode mapel di enrolledSubjects siswa (asalnya dari
// dokumen "mapel") bisa beda format/belum sinkron -- terutama buat guru
// lama atau modul lama -- padahal NAMA mapelnya sama persis. Sekarang
// pencocokan coba lewat KODE dulu (paling akurat kalau datanya konsisten),
// dan kalau gak ketemu, coba juga lewat NAMA mapel (dinormalisasi huruf
// kecil + spasi) sebagai fallback -- supaya siswa yang benar didaftarkan
// (baik dicatat pakai kode ATAU nama) tetap ketemu aksesnya.
const hasSubjectAccess = (enrolledSubjects, modulSubject, modulKodeMapel) => {
  if (!modulSubject || modulSubject.toLowerCase().trim() === 'umum') return true; // konten umum selalu bisa diakses siapa saja
  const norm = (s) => String(s || '').toLowerCase().trim();
  const modulCodes = String(modulKodeMapel || '').split(',').map(norm).filter(Boolean);
  const modulNameNorm = norm(modulSubject);

  if (modulCodes.length === 0 && !modulNameNorm) return true; // modul ini gak punya kode/nama mapel -> gak ada dasar buat blokir (masalah data materi, bukan siswa)
  if (!Array.isArray(enrolledSubjects) || enrolledSubjects.length === 0) return false; // kosong = BLOKIR
  if (enrolledSubjects.some(s => norm(s) === 'semua')) return true;

  return enrolledSubjects.some(s => {
    const es = norm(s);
    return modulCodes.includes(es) || es === modulNameNorm;
  });
};

// ============================================================
// 🔥 DIHAPUS: deriveEnrolledSubjectsFromSchedule()
// ============================================================
// Dulu menurunkan akses mapel dari jadwal_bimbel otomatis. Sekarang
// DIHAPUS TOTAL -- satu-satunya sumber akses adalah `enrolledSubjects`
// manual, lihat penjelasan di hasSubjectAccess() di atas dan di
// StudentDashboard.jsx.

const getAgeTier = (kelasSekolah) => {
  const k = (kelasSekolah || '').toUpperCase();
  if (k.includes('SD')) return 'sd';
  return 'remaja'; // SMP & SMA digabung -- dua-duanya sama-sama remaja
};

// 🔥 Warna aksen per mata pelajaran -- bantu siswa (terutama SD yang belum
// lancar baca) mengenali mapel dari WARNA sebelum sempat baca teksnya.
const SUBJECT_THEME = (subject = '') => {
  const s = subject.toLowerCase();
  const table = [
    { keys: ['matemat', 'math'], color: '#3b82f6', bg: '#eff6ff', emoji: '🔢' },
    { keys: ['ipa', 'sains', 'science', 'fisika', 'kimia', 'biologi'], color: '#10b981', bg: '#f0fdf4', emoji: '🔬' },
    { keys: ['ips', 'sosial', 'sejarah', 'geografi', 'ekonomi'], color: '#f59e0b', bg: '#fffbeb', emoji: '🌍' },
    { keys: ['bahasa indonesia', 'b. indonesia'], color: '#ef4444', bg: '#fef2f2', emoji: '📖' },
    { keys: ['english', 'inggris'], color: '#8b5cf6', bg: '#f5f3ff', emoji: '🗣️' },
    { keys: ['tka', 'kompetensi'], color: '#06b6d4', bg: '#ecfeff', emoji: '🚀' },
  ];
  const match = table.find(t => t.keys.some(k => s.includes(k)));
  return match || { color: '#673ab7', bg: '#f5f3ff', emoji: '✨' };
};

// 🔥 Estimasi waktu baca -- riset nunjukin nampilin estimasi waktu di awal
// menurunkan tingkat siswa berhenti baca di tengah jalan (mereka tahu
// komitmennya berapa lama, gak berasa "gak ada ujungnya").
const estimateReadingMinutes = (blocks) => {
  const wordsPerMinute = 130; // dikalibrasi buat kecepatan baca anak-remaja
  let totalWords = 0;
  (blocks || []).forEach(b => {
    if (b.type === 'text') {
      const plain = (b.content || '').replace(/<[^>]+>/g, ' ');
      totalWords += plain.split(/\s+/).filter(Boolean).length;
    }
  });
  return Math.max(1, Math.round(totalWords / wordsPerMinute));
};

// ============================================================
// CONSTANTS
// ============================================================
const ALLOWED_FILE_TYPES = {
  all: { label: 'Semua File', accept: '*/*' },
  pdf: { label: 'PDF', accept: '.pdf,application/pdf' },
  image: { label: 'Gambar', accept: 'image/*' },
  word: { label: 'Word/DOCX', accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

// ============================================================
// 🔥 RENDER MATH - SUPPORT KATEX
// ============================================================
const renderMath = (text) => {
  if (!text) return null;
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return <BlockMath key={i} math={part.substring(2, part.length - 2)} />; }
      catch (e) { return <span key={i} style={{color:'red'}}>{part}</span>; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={i} math={part.substring(1, part.length - 1)} />; }
      catch (e) { return <span key={i} style={{color:'red'}}>{part}</span>; }
    }
    return <span key={i}>{part}</span>;
  });
};

// ============================================================
// 🔥 RENDER MATH DI DALAM HTML STRING (khusus konten hasil AI)
// ============================================================
const renderMathInHtml = (html) => {
  if (!html) return html;
  let result = html;
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (match, expr) => {
    try {
      return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: true });
    } catch (e) {
      return match;
    }
  });
  result = result.replace(/\$([^$\n]+?)\$/g, (match, expr) => {
    try {
      return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: false });
    } catch (e) {
      return match;
    }
  });
  return result;
};

// ============================================================
// HELPERS
// ============================================================
const formatDate = (ts) => {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const formatFileSize = (b) => {
  if (!b) return '0 B';
  if (b<1024) return b+' B';
  if (b<1048576) return (b/1024).toFixed(1)+' KB';
  return (b/1048576).toFixed(1)+' MB';
};

const getTimeRemaining = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { text: '⛔ Terlewat', color: '#ef4444', expired: true };
  const h = Math.floor(diff/3600000);
  const d = Math.floor(h/24);
  if (d > 0) return { text: `⏳ ${d} hari ${h%24} jam`, color: d<=1?'#f59e0b':'#10b981', expired: false };
  return { text: `⚠️ ${h} jam`, color: '#f59e0b', expired: false };
};

// ============================================================
// 🔥 DETEKSI JENIS LINK
// ============================================================
const getLinkType = (url) => {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('canva.com') || url.includes('canva.cn')) return 'canva';
  if (url.includes('docs.google.com') || url.includes('drive.google.com')) return 'google';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.endsWith('.pdf')) return 'pdf';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
  if (url.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i)) return 'office';
  if (url.startsWith('http://') || url.startsWith('https://')) return 'link';
  return 'unknown';
};

// ============================================================
// 🔥 RENDER FILE - LANGSUNG TAMPIL DENGAN CARD
// ============================================================
const FileViewer = ({ url, fileName, fileType, fileSize, title }) => {
  const linkType = getLinkType(url);
  
  const getIcon = () => {
    switch(linkType) {
      case 'pdf': return <FileText size={20} color="#ef4444" />;
      case 'image': return <FileImage size={20} color="#10b981" />;
      case 'youtube': return <Youtube size={20} color="#ff0000" />;
      case 'canva': return <Globe size={20} color="#00c4cc" />;
      case 'google': return <FileText size={20} color="#4285f4" />;
      case 'office': return <FileSpreadsheet size={20} color="#217346" />;
      default: return <FileText size={20} color="#3b82f6" />;
    }
  };
  
  const getFileTypeLabel = () => {
    switch(linkType) {
      case 'pdf': return '📄 PDF';
      case 'image': return '🖼️ Gambar';
      case 'youtube': return '▶️ YouTube';
      case 'canva': return '🎨 Canva';
      case 'google': return '📂 Google Docs';
      case 'office': return '📊 Office File';
      default: return '📎 File';
    }
  };
  
  const getFileSizeLabel = () => {
    if (fileSize) return formatFileSize(fileSize);
    return '';
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleOpenNewTab = () => {
    window.open(url, '_blank');
  };
  
  const renderContent = () => {
    switch(linkType) {
      case 'youtube': {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
        if (match) {
          return (
            <div style={styles.iframeWrapper}>
              <iframe 
                src={`https://www.youtube.com/embed/${match[1]}`} 
                frameBorder="0" 
                allowFullScreen 
                style={styles.iframe}
                title="YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          );
        }
        return <p style={styles.errorText}>⚠️ Link YouTube tidak valid</p>;
      }
      case 'pdf': {
        return (
          <div style={styles.iframeWrapper}>
            <iframe 
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
              style={styles.iframe}
              title="PDF Viewer"
            />
          </div>
        );
      }
      case 'image': {
        return (
          <div style={styles.imageWrapper}>
            <img src={url} alt={fileName || 'Gambar'} style={styles.image} />
          </div>
        );
      }
      case 'canva': {
        return (
          <div style={styles.iframeWrapper}>
            <iframe src={url} style={styles.iframe} title="Canva" allowFullScreen />
          </div>
        );
      }
      case 'google': {
        return (
          <div style={styles.iframeWrapper}>
            <iframe src={url} style={styles.iframe} title="Google Docs" allowFullScreen />
          </div>
        );
      }
      case 'link': {
        return (
          <div style={styles.linkCard}>
            <Globe size={24} color="#3b82f6" />
            <div style={styles.linkInfo}>
              <div style={styles.linkTitle}>{fileName || 'Link'}</div>
              <div style={styles.linkUrl}>{url}</div>
            </div>
          </div>
        );
      }
      default: {
        return (
          <div style={styles.unknownCard}>
            <FileText size={40} color="#94a3b8" />
            <p style={styles.unknownText}>File tidak dapat ditampilkan langsung</p>
            <button onClick={handleOpenNewTab} style={styles.btnOpenTab}>
              <ExternalLink size={14} /> Buka di Tab Baru
            </button>
          </div>
        );
      }
    }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.iconWrapper}>{getIcon()}</span>
          <div style={styles.headerInfo}>
            <div style={styles.fileName}>{fileName || title || 'File'}</div>
            <div style={styles.fileMeta}>
              <span style={styles.fileType}>{getFileTypeLabel()}</span>
              {getFileSizeLabel() && (
                <span style={styles.fileSize}>• {getFileSizeLabel()}</span>
              )}
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={handleOpenNewTab} style={styles.btnNewTab} title="Buka di tab baru">
            <ExternalLink size={16} />
          </button>
          <button onClick={handleDownload} style={styles.btnDownload} title="Unduh file">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

// ============================================================
// 🔥 FLASHCARD MNEMONIC - KARTU BISA DI-FLIP
// ============================================================
const FlashcardWidget = ({ front, back }) => {
  const [flipped, setFlipped] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleFlip = () => {
    setAnimating(true);
    setTimeout(() => {
      setFlipped(f => !f);
      setAnimating(false);
    }, 160);
  };

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#8b5cf6', marginBottom: 8, letterSpacing: 0.3 }}>
        ✨ CARA GEMILANG — cara cepat menghafal
      </div>
      <div
        onClick={handleFlip}
        style={{
          width: '100%',
          minHeight: 130,
          borderRadius: 16,
          padding: '22px 20px',
          boxSizing: 'border-box',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'transform 0.16s ease, box-shadow 0.16s ease',
          transform: animating ? 'scaleX(0.04)' : 'scaleX(1)',
          ...(flipped
            ? { background: '#faf7ff', border: '2px solid #8b5cf6' }
            : { background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', border: '2px solid transparent', boxShadow: '0 8px 20px rgba(139,92,246,0.28)' }
          ),
        }}
      >
        {!flipped ? (
          <>
            <span style={{
              color: 'white', fontSize: 20, fontWeight: 900,
              textAlign: 'center', lineHeight: 1.5, letterSpacing: 0.3,
            }}>
              "{front}"
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600,
              background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20,
            }}>
              👆 Ketuk untuk lihat artinya
            </span>
          </>
        ) : (
          <>
            <div
              style={{ color: '#4c1d95', fontSize: 14, fontWeight: 600, lineHeight: 2, width: '100%' }}
              dangerouslySetInnerHTML={{ __html: renderMathInHtml(back) }}
            />
            <span style={{
              color: '#7c3aed', fontSize: 11, fontWeight: 600,
              background: '#ede9fe', padding: '4px 12px', borderRadius: 20, marginTop: 4,
            }}>
              👆 Ketuk untuk balik lagi
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 🔥 LATIHAN INTERAKTIF (cek pemahaman, TIDAK dinilai)
// ============================================================
const PracticeWidget = ({ questions }) => {
  const [picked, setPicked] = useState({});
  const [revealed, setRevealed] = useState({});

  if (!Array.isArray(questions) || questions.length === 0) return null;

  const pick = (qi, oi) => {
    if (revealed[qi]) return;
    setPicked(p => ({ ...p, [qi]: oi }));
  };
  const check = (qi) => {
    if (picked[qi] === undefined) return;
    setRevealed(r => ({ ...r, [qi]: true }));
  };
  const retry = (qi) => {
    setPicked(p => { const n = { ...p }; delete n[qi]; return n; });
    setRevealed(r => { const n = { ...r }; delete n[qi]; return n; });
  };

  const doneCount = Object.keys(revealed).length;
  const correctCount = Object.keys(revealed)
    .filter(qi => picked[qi] === questions[qi]?.answer).length;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, flexWrap: 'wrap', marginBottom: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#0d9488', letterSpacing: 0.3 }}>
          📝 CEK PEMAHAMAN — latihan santai, tidak dinilai
        </div>
        {doneCount > 0 && (
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#0f766e',
            background: '#ccfbf1', padding: '3px 10px', borderRadius: 20,
          }}>
            Benar {correctCount} dari {doneCount} dijawab
          </div>
        )}
      </div>

      {questions.map((q, qi) => {
        const sel = picked[qi];
        const open = !!revealed[qi];
        const isRight = open && sel === q.answer;

        return (
          <div key={qi} style={{
            background: 'white',
            border: `1px solid ${open ? (isRight ? '#5eead4' : '#fca5a5') : '#e2e8f0'}`,
            borderLeft: `4px solid ${open ? (isRight ? '#0d9488' : '#ef4444') : '#94a3b8'}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            transition: 'border-color 0.25s ease',
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{qi + 1}</span>
              <div
                style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: renderMathInHtml(q.q) }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(q.options || []).map((opt, oi) => {
                const chosen = sel === oi;
                const correct = q.answer === oi;
                let bg = 'white', border = '#e2e8f0', color = '#334155', mark = null;

                if (open) {
                  if (correct) {
                    bg = '#f0fdfa'; border = '#0d9488'; color = '#115e59'; mark = '✅';
                  } else if (chosen) {
                    bg = '#fef2f2'; border = '#ef4444'; color = '#991b1b'; mark = '❌';
                  } else {
                    color = '#94a3b8';
                  }
                } else if (chosen) {
                  bg = '#eef2ff'; border = '#6366f1'; color = '#3730a3';
                }

                return (
                  <button
                    key={oi}
                    onClick={() => pick(qi, oi)}
                    disabled={open}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      textAlign: 'left', width: '100%',
                      padding: '9px 12px', borderRadius: 9,
                      border: `1.5px solid ${border}`, background: bg, color,
                      cursor: open ? 'default' : 'pointer',
                      fontSize: 13, lineHeight: 1.5,
                      transition: 'background 0.18s ease, border-color 0.18s ease',
                    }}
                  >
                    <span style={{
                      flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                      border: `1.5px solid ${border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800,
                      background: chosen && !open ? '#6366f1' : 'transparent',
                      color: chosen && !open ? 'white' : border,
                    }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span
                      style={{ flex: 1 }}
                      dangerouslySetInnerHTML={{ __html: renderMathInHtml(String(opt)) }}
                    />
                    {mark && <span style={{ flexShrink: 0 }}>{mark}</span>}
                  </button>
                );
              })}
            </div>

            {!open ? (
              <button
                onClick={() => check(qi)}
                disabled={sel === undefined}
                style={{
                  marginTop: 10, width: '100%', padding: '9px 0', borderRadius: 9,
                  border: 'none', fontSize: 12, fontWeight: 800,
                  background: sel === undefined ? '#f1f5f9' : 'linear-gradient(135deg,#14b8a6,#0d9488)',
                  color: sel === undefined ? '#94a3b8' : 'white',
                  cursor: sel === undefined ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {sel === undefined ? 'Pilih dulu jawabanmu' : '🔍 Cek Jawaban'}
              </button>
            ) : (
              <div className="gem-reveal" style={{ marginTop: 10 }}>
                <div style={{
                  background: isRight ? '#f0fdfa' : '#fffbeb',
                  border: `1px solid ${isRight ? '#99f6e4' : '#fde68a'}`,
                  borderRadius: 10, padding: '11px 13px',
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, marginBottom: 5,
                    color: isRight ? '#0f766e' : '#b45309',
                  }}>
                    {isRight ? '🎉 Tepat sekali!' : '💡 Belum tepat — ini penjelasannya'}
                  </div>
                  <div
                    style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: renderMathInHtml(q.explain || '') }}
                  />
                </div>
                <button
                  onClick={() => retry(qi)}
                  style={{
                    marginTop: 8, background: 'none', border: 'none',
                    color: '#0d9488', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', padding: 0, textDecoration: 'underline',
                  }}
                >
                  ↺ Coba lagi soal ini
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// 🔥 KONTEN AI YANG BISA DIPENCET
// ============================================================
const AIContentBlock = ({ html }) => {
  const wrapRef = useRef(null);
  const [pop, setPop] = useState(null);

  const handleClick = (e) => {
    const el = e.target.closest ? e.target.closest('.gem-pop') : null;
    if (!el) { setPop(null); return; }
    e.preventDefault();
    e.stopPropagation();
    const text = el.getAttribute('data-info') || '';
    if (!text || !wrapRef.current) return;

    const cRect = wrapRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const maxW = cRect.width;
    const width = Math.min(300, Math.max(180, maxW - 12));
    const centerX = rect.left - cRect.left + rect.width / 2;
    const left = Math.max(4, Math.min(centerX - width / 2, maxW - width - 4));
    setPop({
      term: el.textContent,
      text,
      top: rect.bottom - cRect.top + 10,
      left,
      width,
      arrowX: Math.max(12, Math.min(centerX - left, width - 12)),
    });
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div
        className="cdtx cdtx-html"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: renderMathInHtml(html) }}
      />
      {pop && (
        <>
          <div
            onClick={() => setPop(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div
            className="gem-pop-bubble"
            style={{
              position: 'absolute',
              top: pop.top, left: pop.left, width: pop.width,
              zIndex: 50,
              background: '#312e81',
              borderRadius: 12,
              padding: '11px 13px',
              boxShadow: '0 10px 28px rgba(49,46,129,0.35)',
            }}
          >
            <div style={{
              position: 'absolute', top: -6, left: pop.arrowX - 6,
              width: 12, height: 12, background: '#312e81',
              transform: 'rotate(45deg)', borderRadius: 2,
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#c7d2fe', marginBottom: 4, letterSpacing: 0.3 }}>
                  💡 {pop.term}
                </div>
                <div style={{ fontSize: 12.5, color: 'white', lineHeight: 1.65 }}>
                  {pop.text}
                </div>
              </div>
              <button
                onClick={() => setPop(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                  cursor: 'pointer', padding: '2px 4px', color: 'white', flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                }}
                aria-label="Tutup penjelasan"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// 🔥 BARU: SKELETON LOADING -- kerangka konten (bukan spinner polos).
// Kerangka ini bikin loading TERASA jauh lebih cepat (riset UX: skeleton
// dipersepsikan ~30-40% lebih cepat dibanding spinner walau waktu
// aktualnya sama), karena siswa langsung lihat "bentuk" halamannya alih-
// alih layar kosong berputar-putar.
// ============================================================
const ModuleSkeleton = () => (
  <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
    <style>{`
      @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      .gem-skel { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%); background-size: 800px 100%; animation: shimmer 1.4s linear infinite; border-radius: 12px; }
    `}</style>
    <div className="gem-skel" style={{ height: 160, marginBottom: 20 }} />
    <div className="gem-skel" style={{ height: 28, width: '70%', marginBottom: 10 }} />
    <div className="gem-skel" style={{ height: 14, width: '40%', marginBottom: 26 }} />
    {[1, 2, 3].map(i => (
      <div key={i} style={{ marginBottom: 16 }}>
        <div className="gem-skel" style={{ height: 16, width: '30%', marginBottom: 10 }} />
        <div className="gem-skel" style={{ height: 14, marginBottom: 6 }} />
        <div className="gem-skel" style={{ height: 14, marginBottom: 6 }} />
        <div className="gem-skel" style={{ height: 14, width: '80%' }} />
      </div>
    ))}
  </div>
);

// ============================================================
// REDUCER
// ============================================================
const initialState = {
  modul: null, loading: true, error: null, hasAccess: false,
  uploading: {}, submittedTasks: {},
  quizStatus: {},
  quizScores: {},
  textAnswers: {}, activeTab: 'materi', previewImage: null,
  pendingFile: null, pendingBlockId: null, showPreviewModal: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODUL': return { ...state, modul: action.payload, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
    case 'SET_ACCESS': return { ...state, hasAccess: action.payload };
    case 'SET_UPLOADING': return { ...state, uploading: { ...state.uploading, [action.blockId]: action.value } };
    case 'SET_SUBMITTED_TASKS': return { ...state, submittedTasks: action.payload };
    case 'SET_QUIZ_STATUS': return { ...state, quizStatus: { ...state.quizStatus, [action.quizId]: action.status } };
    case 'SET_QUIZ_SCORE': return { ...state, quizScores: { ...state.quizScores, [action.quizId]: action.score } };
    case 'SET_TEXT_ANSWERS': return { ...state, textAnswers: { ...state.textAnswers, [action.blockId]: action.value } };
    case 'SET_ACTIVE_TAB': return { ...state, activeTab: action.payload };
    case 'SET_PREVIEW_IMAGE': return { ...state, previewImage: action.payload };
    case 'SET_PENDING_FILE': return { ...state, pendingFile: action.file, pendingBlockId: action.blockId, showPreviewModal: true };
    case 'CLEAR_PENDING': return { ...state, pendingFile: null, pendingBlockId: null, showPreviewModal: false };
    default: return state;
  }
}

const MODUL_CACHE_PREFIX = 'gemilang_modulCache_';

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentModuleView = ({ modulId, onBack, studentData }) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [studentNim, setStudentNim] = useState('');
  const [studentKelas, setStudentKelas] = useState('');
  const [studentProgram, setStudentProgram] = useState('');
  // 🔥 BARU: sudah lewat berapa persen konten yang di-scroll -- progress
  // bar tipis yang nempel di atas, kasih siswa rasa "ada ujungnya" & rasa
  // pencapaian pas nyampe 100%.
  const [scrollProgress, setScrollProgress] = useState(0);
  // 🔥 BARU: tanda "sudah dibaca" per bagian materi -- disimpan ringan di
  // localStorage (bukan database, gak perlu skema baru) semata buat kasih
  // sinyal "kompetensi tercapai" ke siswa (centang hijau), bukan buat
  // pelaporan ke guru.
  const [readBlocks, setReadBlocks] = useState({});
  const contentRef = useRef(null);

  // ===== RESPONSIVE =====
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ===== AMBIL DATA SISWA =====
  useEffect(() => {
    const nim = studentData?.studentId || studentData?.nim || studentData?.studentNim || 
                localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
    const kelas = studentData?.kelasSekolah || localStorage.getItem('studentKelas') || '';
    const program = studentData?.kategori || studentData?.program || localStorage.getItem('studentProgram') || 'Reguler';
    
    setStudentNim(nim);
    setStudentKelas(kelas);
    setStudentProgram(program);
  }, [studentData]);

  const ageTier = useMemo(() => getAgeTier(studentKelas), [studentKelas]);

  // ===== FETCH MODUL =====
  // 🔥 BARU: strategi "cache-first" -- kalau modul ini PERNAH dibuka
  // sebelumnya di perangkat ini, tampilkan LANGSUNG dari cache (TANPA
  // skeleton/spinner sama sekali, terasa instan), sambil diam-diam
  // refresh data terbaru di belakang layar. Loading spinner/skeleton
  // cuma muncul di kunjungan PERTAMA KALI (memang gak ada cara
  // menampilkan data yang belum pernah diambil), tapi setelah itu siswa
  // hampir gak pernah lihat layar loading lagi buat modul yang sama.
  useEffect(() => {
    if (!modulId) return;
    let cancelled = false;
    const cacheKey = MODUL_CACHE_PREFIX + modulId;

    const fetchAll = async (isBackgroundRefresh) => {
      if (!isBackgroundRefresh) dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const snap = await getDoc(doc(db, "bimbel_modul", modulId));
        if (cancelled) return;
        
        if (!snap.exists()) {
          dispatch({ type: 'SET_ERROR', payload: 'Modul tidak ditemukan' });
          return;
        }
        
        const data = snap.data();
        
        const nim = studentNim || localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
        const kelas = studentKelas || localStorage.getItem('studentKelas') || '';
        const program = studentProgram || localStorage.getItem('studentProgram') || 'Reguler';
        // 🔥 BERUBAH: daftar mapel yang dibayar siswa ini SEKARANG HANYA
        // dari field manual `enrolledSubjects` (prop studentData atau cache
        // localStorage) -- turunan otomatis dari jadwal_bimbel DIHAPUS
        // TOTAL. Kalau kosong, dianggap belum diisi admin (bukan lagi
        // "izinkan sementara") -- lihat StudentDashboard.jsx buat penjelasan
        // lengkap kenapa ini sengaja dibalik jadi ketat.
        let enrolledSubjectsRaw = studentData?.enrolledSubjects || localStorage.getItem('studentEnrolledSubjects');
        if (typeof enrolledSubjectsRaw === 'string') {
          try { enrolledSubjectsRaw = JSON.parse(enrolledSubjectsRaw); } catch (e) { enrolledSubjectsRaw = null; }
        }
        
        let hasAccess = false;
        
        if (data.sendToSpecificStudents) {
          const studentIds = data.studentIds || [];
          const selectedStudentIds = (data.selectedStudents || []).map(s => s.studentId || s.id);
          const allTargetIds = [...studentIds, ...selectedStudentIds];
          // 🔥 Guru MEMILIH LANGSUNG siswa ini secara manual -- dianggap izin
          // khusus dari guru (misal buat trial/bonus lintas mapel), jadi
          // SENGAJA tidak ikut kena batasan paket mapel di bawah. Guru tetap
          // pegang kendali penuh buat ngasih akses ekstra kalau memang mau.
          hasAccess = allTargetIds.includes(nim) || allTargetIds.includes(studentData?.id);
        }
        
        if (!hasAccess) {
          const targetKelas = data.targetKelas || 'Semua';
          const targetKategori = data.targetKategori || 'Semua';
          const matchKelas = targetKelas === 'Semua' || targetKelas === kelas;
          const matchProgram = targetKategori === 'Semua' || targetKategori === program;
          // 🔥 BARU: buat targeting umum (bukan pilihan manual guru), akses
          // sekarang JUGA harus lolos cek paket mapel -- ini yang mencegah
          // siswa paket 1 mapel otomatis ikut kebuka modul mapel lain.
          const matchSubject = hasSubjectAccess(enrolledSubjectsRaw, data.subject, data.kodeMapel);
          hasAccess = matchKelas && matchProgram && matchSubject;

          // 🔥 BARU: log detail alasan akses ditolak/diterima -- kalau ada
          // laporan "modul gak bisa dibuka via Tautkan Jenjang" lagi, buka
          // Console browser (F12) pas kejadian, cari baris ini buat lihat
          // PERSIS bagian mana yang gak cocok (kelas/kategori/mapel).
          console.log('[Cek Akses Modul]', {
            hasAccess,
            modulTitle: data.title,
            modulSubject: data.subject,
            modulKodeMapel: data.kodeMapel,
            modulTargetKelas: targetKelas,
            modulTargetKategori: targetKategori,
            studentKelas: kelas,
            studentProgram: program,
            studentEnrolledSubjects: enrolledSubjectsRaw,
            matchKelas, matchProgram, matchSubject,
          });

          // 🔥 BARU: kalau alasan gagalnya SPESIFIK karena paket mapel (bukan
          // kelas/kategori), kasih pesan yang jelas -- biar siswa/ortu ngerti
          // ini soal paket langganan, bukan dikira bug/error sistem.
          if (matchKelas && matchProgram && !matchSubject) {
            dispatch({ type: 'SET_ERROR', payload: `Modul ini untuk mapel ${data.subject || '-'}, sedangkan paketmu belum termasuk mapel ini. Hubungi admin Bimbel Gemilang untuk info upgrade paket.` });
            dispatch({ type: 'SET_ACCESS', payload: false });
            return;
          }
        }
        
        if (!hasAccess) {
          dispatch({ type: 'SET_ERROR', payload: 'Anda tidak memiliki akses ke modul ini' });
          dispatch({ type: 'SET_ACCESS', payload: false });
          return;
        }
        
        dispatch({ type: 'SET_ACCESS', payload: true });
        dispatch({ type: 'SET_MODUL', payload: data });

        // 🔥 Simpan ke cache buat kunjungan BERIKUTNYA (bukan yang sekarang)
        try { localStorage.setItem(cacheKey, JSON.stringify({ data, cachedAt: Date.now() })); } catch (e) { /* penuh/gak tersedia, gak fatal */ }

        // 🔥 AMBIL STATUS KUIS — PARALEL
        if (nim) {
          const quizBlocks = (data.blocks || []).filter(b => b.type === 'quiz' && b.quizId);

          const [quizResults, snapTugas] = await Promise.all([
            Promise.all(
              quizBlocks.map(block => {
                const qJawaban = query(
                  collection(db, "jawaban_kuis"),
                  where("modulId", "==", block.quizId),
                  where("studentNim", "==", nim)
                );
                return getDocs(qJawaban).then(snap => ({ quizId: block.quizId, snap }));
              })
            ),
            getDocs(
              query(collection(db,"jawaban_tugas"), where("modulId","==",modulId), where("studentNim","==",nim))
            ),
          ]);

          if (cancelled) return;

          quizResults.forEach(({ quizId, snap }) => {
            if (!snap.empty) {
              const lastData = snap.docs[0].data();
              dispatch({ type: 'SET_QUIZ_STATUS', quizId, status: 'done' });
              dispatch({ type: 'SET_QUIZ_SCORE', quizId, score: lastData.score || 0 });
            } else {
              dispatch({ type: 'SET_QUIZ_STATUS', quizId, status: 'pending' });
            }
          });
          
          const completed = {};
          snapTugas.forEach(d => { 
            const dt = d.data(); 
            completed[dt.blockId] = { 
              docId:d.id, 
              fileUrl:dt.fileUrl, 
              fileName:dt.fileName||'Lihat File', 
              textAnswer:dt.answer||dt.textAnswer||'', 
              status:dt.status||'Pending' 
            }; 
          });
          dispatch({ type:'SET_SUBMITTED_TASKS', payload: completed });
        }
        
      } catch(e) { 
        if (!cancelled && !isBackgroundRefresh) {
          console.error(e);
          dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat modul: ' + e.message });
        } else if (!cancelled) {
          console.error('Gagal refresh modul di belakang layar:', e);
        }
      }
      if (!cancelled && !isBackgroundRefresh) dispatch({ type: 'SET_LOADING', payload: false });
    };

    // Coba tampilkan dari cache dulu buat kesan instan
    let hasCachedVersion = false;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data) {
          dispatch({ type: 'SET_ACCESS', payload: true });
          dispatch({ type: 'SET_MODUL', payload: parsed.data });
          hasCachedVersion = true;
        }
      }
    } catch (e) { /* cache rusak, abaikan */ }

    fetchAll(hasCachedVersion);
    return () => { cancelled = true; };
  }, [modulId, studentNim, studentKelas, studentProgram]);

  // 🔥 BARU: lacak progress scroll konten -- dipakai buat progress bar
  // tipis di atas & buat auto-tandai "sudah dibaca" begitu sebuah bagian
  // sudah kelewat sepenuhnya di layar.
  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) { setScrollProgress(100); return; }
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setScrollProgress(Math.round((scrolled / total) * 100));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [state.modul]);

  const toggleReadBlock = (blockId) => {
    setReadBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  // ============================================================
  // UPLOAD HANDLER
  // ============================================================
  const handleFileChange = (e, blockId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 52428800) return alert("❌ Maks 50MB.");
    dispatch({ type:'SET_PENDING_FILE', file, blockId });
  };

  const handleConfirmUpload = async () => {
    const { pendingFile: file, pendingBlockId: blockId, modul } = state;
    if (!file || !blockId || !modul) return;
    
    dispatch({ type:'SET_UPLOADING', blockId, value: true });
    dispatch({ type:'CLEAR_PENDING' });
    
    try {
      const result = await uploadElearningFile(file, 'tugas');
      if (!result.success) throw new Error(result.error);
      
      const payload = {
        modulId, 
        modulTitle: modul.title, 
        blockId,
        studentNim, 
        studentName: localStorage.getItem('studentName')||'Siswa',
        studentClass: studentKelas || '',
        subject: modul.subject||modul.kodeMapel||'',
        guruId: modul.guruId || '',
        fileUrl: result.downloadURL, 
        filePath: result.filePath,
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        answer: state.textAnswers[blockId]||'',
        submittedAt: serverTimestamp(), 
        status:'Pending'
      };

      await addDoc(collection(db,"jawaban_tugas"), payload);
      dispatch({ type:'SET_SUBMITTED_TASKS', payload: {...state.submittedTasks, [blockId]: payload} });
      alert('✅ Tugas berhasil diupload!');
    } catch(e) { alert('❌ '+e.message); }
    dispatch({ type:'SET_UPLOADING', blockId, value: false });
  };

  const handleDeleteTask = async (blockId) => {
    if (!confirm("Yakin ingin menarik tugas ini?")) return;
    try {
      const info = state.submittedTasks[blockId];
      if (info?.docId) await deleteDoc(doc(db,"jawaban_tugas",info.docId));
      const ns = {...state.submittedTasks}; delete ns[blockId];
      dispatch({ type:'SET_SUBMITTED_TASKS', payload: ns });
      alert('✅ Tugas berhasil ditarik');
    } catch(e) { alert('❌ '+e.message); }
  };

  // ============================================================
  // RENDER CONTENT - MATERI & QUIZ BERSELANG
  // ============================================================
  const theme = SUBJECT_THEME(state.modul?.subject);

  const renderContent = (block, idx) => {
    const isRead = !!readBlocks[block.id];

    // 🔥 JIKA QUIZ
    if (block.type === 'quiz') {
      const isDone = state.quizStatus[block.quizId] === 'done';
      const score = state.quizScores[block.quizId] || 0;
      
      return (
        <div key={block.id} style={{
          ...styles.quizCard(ageTier),
          background: block.quizId ? (isDone ? '#f0fdf4' : styles.quizActiveBg(ageTier)) : '#f8fafc',
          border: block.quizId ? (isDone ? '2px solid #10b981' : `2px solid ${styles.quizActiveBorder(ageTier)}`) : '2px dashed #e2e8f0',
          opacity: block.quizId ? 1 : 0.6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: ageTier === 'sd' ? 52 : 44, height: ageTier === 'sd' ? 52 : 44, borderRadius: 16,
              background: block.quizId ? (isDone ? '#dcfce7' : 'rgba(255,255,255,0.6)') : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FileQuestion size={ageTier === 'sd' ? 28 : 22} color={block.quizId ? (isDone ? '#10b981' : styles.quizActiveBorder(ageTier)) : '#94a3b8'} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: ageTier === 'sd' ? 18 : 16, fontWeight: 800, color: block.quizId ? (isDone ? '#166534' : '#1e293b') : '#94a3b8' }}>
                {block.quizTitle || block.title || 'Kuis'}
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: block.quizId ? (isDone ? '#166534' : '#64748b') : '#94a3b8', fontWeight: 600 }}>
                {block.quizQuestions || 0} soal
                {isDone && ` • ✅ Selesai (Nilai: ${score})`}
              </p>
            </div>
            {isDone && <span style={{ fontSize: 22 }}>🏆</span>}
          </div>
          
          {block.quizId ? (
            <button
              onClick={() => navigate(`/siswa/kuis/${block.quizId}`)}
              style={{
                width: '100%',
                padding: ageTier === 'sd' ? '14px' : '12px',
                background: isDone ? '#3b82f6' : 'white',
                color: isDone ? 'white' : styles.quizActiveBorder(ageTier),
                border: isDone ? 'none' : `2px solid ${styles.quizActiveBorder(ageTier)}`,
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isDone ? <Eye size={18} /> : <Zap size={18} />}
              {isDone ? 'Lihat Hasil & Pembahasan' : 'Yuk, Mulai Kuis!'}
            </button>
          ) : (
            <div style={{ padding: '10px 20px', background: '#f1f5f9', borderRadius: 10, color: '#94a3b8', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
              ⏳ Menunggu kuis dari guru
            </div>
          )}
        </div>
      );
    }
    
    // 🔥 MATERI (text, file, video)
    const typeLabels = { text: 'MATERI', file: 'FILE', video: 'VIDEO' };
    
    return (
      <div key={block.id} className="cd" style={styles.contentCard(ageTier)}>
        <div style={styles.cdt(theme)}>
          <small style={{ color: theme.color }}>
            {theme.emoji} {typeLabels[block.type] || 'BAGIAN'} {idx + 1}
          </small>
          <h3 style={styles.cdtHeading(ageTier)}>{renderMath(block.title) || `Bagian ${idx + 1}`}</h3>
        </div>
        
        {block.type === 'text' && block.format === 'html' && (
          <AIContentBlock html={block.content} />
        )}
        {block.type === 'text' && block.format !== 'html' && (
          <div style={styles.cdtx(ageTier)}>{renderMath(block.content)}</div>
        )}
        {block.interactive?.type === 'flashcard' && block.interactive.front && (
          <FlashcardWidget front={block.interactive.front} back={block.interactive.back} />
        )}
        {block.interactive?.practice?.length > 0 && (
          <PracticeWidget questions={block.interactive.practice} />
        )}
        
        {(block.type === 'file' || block.type === 'video') && (
          <FileViewer 
            url={block.content}
            fileName={block.fileName || block.title || 'File'}
            fileType={block.mimeType}
            fileSize={block.fileSize}
            title={block.title}
          />
        )}

        {/* 🔥 BARU: tombol "Tandai Sudah Dibaca" -- cuma buat materi teks
            (bukan file/video/quiz), kasih siswa rasa pencapaian (competence)
            per bagian, bukan cuma di akhir modul. Disimpan lokal saja
            (localStorage), tidak mempengaruhi nilai/laporan ke guru. */}
        {block.type === 'text' && (
          <button
            onClick={() => toggleReadBlock(block.id)}
            style={styles.readToggle(isRead, ageTier)}
          >
            <CheckCircle size={16} />
            {isRead ? 'Sudah dibaca ✓' : 'Tandai sudah dibaca'}
          </button>
        )}
      </div>
    );
  };

  // ============================================================
  // LOADING -- skeleton, bukan spinner polos
  // ============================================================
  if (state.loading) return <ModuleSkeleton />;

  // ============================================================
  // ERROR / NO ACCESS
  // ============================================================
  if (state.error || !state.hasAccess) {
    return (
      <div className="no-access">
        <div className="no-access-icon"><Lock size={48} color="#94a3b8" /></div>
        <h2>Akses Ditolak</h2>
        <p>{state.error || 'Anda tidak memiliki akses ke modul ini'}</p>
        <button onClick={onBack} className="cbb" style={{position:'relative',top:0,left:0}}>
          <ArrowLeft size={14}/> Kembali
        </button>
      </div>
    );
  }

  // 🔥 FILTER KONTEN
  const allBlocks = state.modul?.blocks || [];
  const materiBlocks = allBlocks.filter(b => b.type !== 'assignment');
  const tugasBlocks = allBlocks.filter(b => b.type === 'assignment');
  const quizBlocks = allBlocks.filter(b => b.type === 'quiz');
  const hasQuiz = quizBlocks.length > 0;
  const readingMinutes = estimateReadingMinutes(materiBlocks);
  const materiTextBlocks = materiBlocks.filter(b => b.type === 'text');
  const readCount = materiTextBlocks.filter(b => readBlocks[b.id]).length;

  // ============================================================
  // RENDER UTAMA
  // ============================================================
  return (
    <>
      {/* 🔥 PROGRESS BAR SCROLL -- nempel di paling atas, kasih rasa "ada
          ujungnya" pas baca materi panjang. */}
      <div style={styles.scrollBarBg}>
        <div style={{ ...styles.scrollBarFill, width: `${scrollProgress}%`, background: theme.color }} />
      </div>

      <div ref={contentRef}>
        {/* COVER */}
        <div className="cv" style={{ background: `linear-gradient(160deg, ${theme.color}dd, ${theme.color}99)` }}>
          <button onClick={onBack} className="cbb"><ArrowLeft size={14}/> {!isMobile&&'Kembali'}</button>
          {state.modul?.coverImage ? (
            <img src={state.modul.coverImage} alt="" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: ageTier === 'sd' ? 90 : 60, opacity: 0.35 }}>
              {theme.emoji}
            </div>
          )}
          <div className="cvo">
            <div className="cvt">
              <span className="tp" style={{ background: theme.color }}>{theme.emoji} {state.modul?.subject||'Umum'}</span>
              <span className="tg">{state.modul?.targetKategori||'Semua'} • {state.modul?.targetKelas||'Semua'}</span>
              {state.modul?.sendToSpecificStudents && <span className="ts">🔒 Khusus</span>}
            </div>
            <h1 style={{ fontSize: ageTier === 'sd' ? 26 : 22 }}>{renderMath(state.modul?.title)}</h1>
            <div className="cvm">
              <span><User size={12}/> {state.modul?.authorName||state.modul?.guruName||'Guru'}</span>
              <span><Clock size={12}/> ~{readingMinutes} menit baca</span>
              {studentKelas && <span>🎓 {studentKelas}</span>}
            </div>
          </div>
        </div>

        {/* TABS -- diperbesar & dibikin lebih jelas ikonnya, terutama buat SD */}
        <div className="tb" style={{ padding: ageTier === 'sd' ? 8 : 5 }}>
          <button className={`tbt ${state.activeTab==='materi'?'act':''}`} style={{ padding: ageTier === 'sd' ? '14px 8px' : '10px' }} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'materi'})}>
            <BookOpen size={ageTier === 'sd' ? 18 : 14}/> Materi ({materiBlocks.length})
          </button>
          {tugasBlocks.length>0 && (
            <button className={`tbt ${state.activeTab==='tugas'?'act':''}`} style={{ padding: ageTier === 'sd' ? '14px 8px' : '10px' }} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'tugas'})}>
              <Send size={ageTier === 'sd' ? 18 : 14}/> Tugas ({Object.keys(state.submittedTasks).length}/{tugasBlocks.length})
            </button>
          )}
          {hasQuiz && (
            <button className={`tbt ${state.activeTab==='kuis'?'act':''}`} style={{ padding: ageTier === 'sd' ? '14px 8px' : '10px' }} onClick={()=>dispatch({type:'SET_ACTIVE_TAB',payload:'kuis'})}>
              <FileQuestion size={ageTier === 'sd' ? 18 : 14}/> Kuis ({quizBlocks.filter(b => b.quizId).length}/{quizBlocks.length})
            </button>
          )}
        </div>

        {/* CONTENT */}
        <div className="ct">
          {/* 🔥 MATERI + QUIZ BERSELANG */}
          {state.activeTab==='materi' && (
            <div>
              {materiTextBlocks.length > 0 && (
                <div style={styles.readProgressBanner(theme)}>
                  <span>📚 {readCount} dari {materiTextBlocks.length} bagian sudah kamu tandai selesai</span>
                  <div style={styles.readProgressBarBg}>
                    <div style={{ ...styles.readProgressBarFill, width: `${materiTextBlocks.length ? (readCount/materiTextBlocks.length)*100 : 0}%`, background: theme.color }} />
                  </div>
                </div>
              )}
              {materiBlocks.length === 0 && (
                <div className="em">Belum ada materi</div>
              )}
              {materiBlocks.map((block, idx) => renderContent(block, idx))}
            </div>
          )}

          {/* 🔥 TUGAS */}
          {state.activeTab==='tugas' && (
            <div>
              {tugasBlocks.length === 0 && <div className="em">Tidak ada tugas</div>}
              {tugasBlocks.map(b => {
                const sub = state.submittedTasks[b.id];
                const expired = b.endTime && new Date(b.endTime) < new Date();
                return (
                  <div key={b.id} className="cd tg" style={styles.contentCard(ageTier)}>
                    <div className="cdt"><small>📝 TUGAS</small><h3 style={styles.cdtHeading(ageTier)}>{b.title}</h3></div>
                    <div style={styles.cdtx(ageTier)}>{renderMath(b.content)}</div>
                    {b.endTime && <div className="dl"><Clock size={14}/> {getTimeRemaining(b.endTime)?.text}</div>}
                    <textarea 
                      value={state.textAnswers[b.id]||''} 
                      onChange={e=>dispatch({type:'SET_TEXT_ANSWERS',blockId:b.id,value:e.target.value})} 
                      placeholder="Tulis jawaban..." 
                      disabled={!!sub||expired} 
                      className="ta"
                    />
                    {sub ? (
                      <div className="sb">
                        <div className="sbb"><CheckCircle size={16}/> Terkumpul</div>
                        {sub.fileUrl && <a href={sub.fileUrl} target="_blank" className="bv"><Eye size={14}/> Lihat File</a>}
                        {!expired && <button onClick={()=>handleDeleteTask(b.id)} className="bd">Tarik Data</button>}
                      </div>
                    ) : expired ? <div className="ex">⛔ Deadline Terlewat</div> : (
                      <label className="ul">📎 Pilih File <input type="file" hidden onChange={e=>handleFileChange(e,b.id)} disabled={state.uploading[b.id]}/></label>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 🔥 KUIS - DAFTAR SEMUA KUIS */}
          {state.activeTab==='kuis' && (
            <div>
              {quizBlocks.length === 0 && <div className="em">Tidak ada kuis</div>}
              {quizBlocks.map((block, idx) => renderContent(block, idx))}
            </div>
          )}
        </div>
      </div>

      {/* PREVIEW IMAGE */}
      {state.previewImage && (
        <div className="po" onClick={()=>dispatch({type:'SET_PREVIEW_IMAGE',payload:null})}>
          <button className="poc" onClick={e=>{e.stopPropagation();dispatch({type:'SET_PREVIEW_IMAGE',payload:null});}}><X size={24}/></button>
          <img src={state.previewImage} alt="" onClick={e=>e.stopPropagation()}/>
        </div>
      )}

      {/* UPLOAD PREVIEW */}
      {state.showPreviewModal && state.pendingFile && (
        <div className="po" style={{background:'rgba(0,0,0,0.7)'}}>
          <div className="puc">
            <div className="puch"><h4>📎 Preview</h4><button onClick={()=>dispatch({type:'CLEAR_PENDING'})}><X size={20}/></button></div>
            <div className="pucb">
              <div className="pui"><FileText size={24}/><div><b>{state.pendingFile.name}</b><small>{formatFileSize(state.pendingFile.size)}</small></div></div>
              {state.pendingFile.type?.startsWith('image/') ? <img src={URL.createObjectURL(state.pendingFile)} className="pui2" alt=""/> :
               state.pendingFile.type==='application/pdf' ? <embed src={URL.createObjectURL(state.pendingFile)} className="pue"/> :
               <div className="puf"><FileText size={48} color="#94a3b8"/><p>File siap upload</p></div>}
              <div className="pua">
                <button onClick={()=>dispatch({type:'CLEAR_PENDING'})} className="bc" disabled={state.uploading[state.pendingBlockId]}>Batal</button>
                <button onClick={handleConfirmUpload} disabled={state.uploading[state.pendingBlockId]} className="bs">
                  {state.uploading[state.pendingBlockId]?'Uploading...':<><Upload size={16}/> Upload</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .no-access{display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;padding:20px;text-align:center}
        .no-access-icon{width:80px;height:80px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .no-access h2{font-size:24px;font-weight:800;color:#1e293b;margin:0}
        .no-access p{color:#64748b;font-size:13px;margin:8px 0 20px}
        
        .cv{height:260px;position:relative;overflow:hidden}
        .cv img{width:100%;height:100%;object-fit:cover}
        .cvo{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(15,23,42,.85));padding:30px 5%;color:#fff}
        .cvo h1{font-weight:900;margin:4px 0}
        .cvt{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
        .cvt span{padding:4px 10px;border-radius:8px;font-size:9px;font-weight:800}
        .tg{background:rgba(255,255,255,.2)}.ts{background:#f59e0b;color:#1e293b}
        .cvm{display:flex;gap:12px;font-size:11px;opacity:.9;flex-wrap:wrap}
        .cbb{background:rgba(255,255,255,.95);border:0;padding:8px 14px;border-radius:30px;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.1);color:#1e293b;font-size:12px;position:absolute;top:16px;left:16px;z-index:2}
        .tb{display:flex;gap:4px;background:#fff;margin:-24px 20px 0;border-radius:14px;box-shadow:0 4px 12px rgba(0,0,0,.08);position:relative;z-index:5;flex-wrap:wrap}
        .tbt{flex:1;border:0;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;background:0;color:#64748b;display:flex;align-items:center;justify-content:center;gap:6px;min-width:80px;transition:.2s}
        .tbt.act{background:#673ab7;color:#fff}
        .ct{max-width:720px;margin:0 auto;padding:20px}
        .cdt{margin-bottom:12px;border-left:4px solid currentColor;padding-left:10px}
        .cdt small{font-size:9px;font-weight:800;display:block}
        .cdtx-html{white-space:normal}
        .cdtx-html p{margin-bottom:12px}
        .cdtx-html img{max-width:100%;border-radius:10px}
        .cdtx-html b{color:#1e293b}
        .cdtx-html ul,.cdtx-html ol{margin:10px 0 12px 20px}
        .cdtx-html li{margin-bottom:6px}
        .cdtx-html pre{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;overflow-x:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;line-height:1.7;margin:10px 0}
        .gem-pop{color:#4f46e5;font-weight:700;background:#eef2ff;border-bottom:2px dotted #6366f1;cursor:pointer;padding:1px 4px;border-radius:4px;transition:background .15s}
        .gem-pop:active{background:#c7d2fe}
        .gem-pop-bubble{animation:gemPopIn .16s ease-out}
        @keyframes gemPopIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .gem-reveal{animation:gemReveal .28s ease-out}
        @keyframes gemReveal{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .gem-pop::after{content:"👆";font-size:9px;vertical-align:super;margin-left:1px;opacity:.5}
        .em{text-align:center;padding:40px;color:#94a3b8}
        .tg{border-left:4px solid #f59e0b}
        .dl{padding:8px 12px;border-radius:8px;margin-bottom:12px;display:flex;align-items:center;gap:8px;font-weight:700;font-size:12px;background:#fef3c7;color:#b45309}
        .ta{width:100%;padding:10px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;font-family:inherit;resize:vertical;min-height:60px;margin-bottom:12px}
        .sb{display:flex;flex-direction:column;gap:8px}
        .sbb{color:#059669;font-weight:700;background:#dcfce7;padding:10px;border-radius:8px;display:flex;align-items:center;gap:6px;font-size:12px}
        .bv{background:#f1f5f9;color:#64748b;padding:10px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px}
        .bd{background:#fee2e2;color:#ef4444;border:0;padding:10px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer}
        .ex{color:#ef4444;font-weight:700;background:#fee2e2;padding:10px;border-radius:8px;text-align:center;font-size:12px}
        .ul{display:block;background:#f59e0b;color:#fff;padding:12px;border-radius:8px;text-align:center;font-weight:700;font-size:12px;cursor:pointer}
        .po{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer}
        .po img{max-width:95%;max-height:90vh;object-fit:contain;border-radius:12px}
        .poc{position:absolute;top:20px;right:20px;background:rgba(255,255,255,.2);color:#fff;border:0;border-radius:50%;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .puc{background:#fff;border-radius:16px;max-width:500px;width:100%;max-height:90vh;overflow:auto}
        .puch{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #e2e8f0}
        .puch h4{font-size:16px;font-weight:700}.puch button{background:0;border:0;cursor:pointer}
        .pucb{padding:20px}
        .pui{display:flex;align-items:center;gap:12px;margin-bottom:16px}
        .pui b{font-size:14px;font-weight:600;display:block}.pui small{font-size:11px;color:#94a3b8}
        .pui2{width:100%;max-height:300px;object-fit:contain;border-radius:8px}
        .pue{width:100%;height:300px;border:0;border-radius:8px}
        .puf{text-align:center;padding:40px;color:#94a3b8}
        .pua{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
        .bc{padding:8px 20px;background:#f1f5f9;border:0;border-radius:8px;font-weight:600;cursor:pointer;color:#64748b}
        .bs{padding:8px 20px;background:#10b981;border:0;border-radius:8px;font-weight:700;color:#fff;cursor:pointer;display:flex;align-items:center;gap:6px}
        .bs:disabled{opacity:.6;cursor:not-allowed}
        @media(max-width:768px){.cv{height:200px}.tb{margin:-20px 12px 0}.ct{padding:15px 12px}}
      `}</style>
    </>
  );
};

// ============================================================
// STYLES (JS objects, dipakai bareng sama CSS class di atas)
// ============================================================
const styles = {
  container: { background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 150 },
  iconWrapper: { width: 32, height: 32, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo: { flex: 1, minWidth: 0 },
  fileName: { fontSize: 13, fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' },
  fileMeta: { display: 'flex', gap: 6, fontSize: 10, color: '#94a3b8', flexWrap: 'wrap' },
  fileType: { fontWeight: 500 },
  fileSize: { color: '#94a3b8' },
  headerActions: { display: 'flex', gap: 4 },
  btnNewTab: { padding: '6px 10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnDownload: { padding: '6px 10px', background: '#3b82f6', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: { padding: '0' },
  iframeWrapper: { position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000' },
  iframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  imageWrapper: { padding: '12px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: 500, overflow: 'hidden' },
  image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 },
  linkCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#f8fafc', borderRadius: 8, margin: '12px' },
  linkInfo: { flex: 1, minWidth: 0 },
  linkTitle: { fontSize: 13, fontWeight: 600, color: '#1e293b' },
  linkUrl: { fontSize: 11, color: '#94a3b8', wordBreak: 'break-all' },
  unknownCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 20px', background: '#f8fafc' },
  unknownText: { fontSize: 13, color: '#94a3b8' },
  btnOpenTab: { padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 },
  errorText: { padding: '20px', color: '#ef4444', textAlign: 'center' },

  // 🔥 Progress bar scroll global
  scrollBarBg: { position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.06)', zIndex: 200 },
  scrollBarFill: { height: '100%', transition: 'width 0.15s ease' },

  // 🔥 Kartu konten -- ukuran & padding beda per tier usia
  contentCard: (tier) => ({
    background: '#fff', padding: tier === 'sd' ? 26 : 22, borderRadius: tier === 'sd' ? 20 : 16,
    marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,.02)', border: '1px solid #f1f5f9',
  }),
  cdt: (theme) => ({ marginBottom: 12, borderLeft: `4px solid ${theme.color}`, paddingLeft: 10, color: theme.color }),
  cdtHeading: (tier) => ({ fontSize: tier === 'sd' ? 22 : 18, color: '#0f172a', fontWeight: 800, margin: '2px 0 0' }),
  cdtx: (tier) => ({
    lineHeight: tier === 'sd' ? 2 : 1.8, color: '#334155',
    fontSize: tier === 'sd' ? 17 : 15, whiteSpace: 'pre-wrap',
  }),

  // 🔥 Tombol "sudah dibaca"
  readToggle: (isRead, tier) => ({
    marginTop: 16, padding: tier === 'sd' ? '12px 20px' : '9px 16px',
    borderRadius: 12, border: isRead ? '2px solid #10b981' : '2px dashed #cbd5e1',
    background: isRead ? '#f0fdf4' : 'white', color: isRead ? '#166534' : '#64748b',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  }),

  // 🔥 Banner progress baca (di atas daftar materi)
  readProgressBanner: (theme) => ({
    background: theme.bg, border: `1px solid ${theme.color}30`, borderRadius: 14,
    padding: '12px 16px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: theme.color,
  }),
  readProgressBarBg: { marginTop: 8, height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' },
  readProgressBarFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },

  // 🔥 Kartu kuis
  quizCard: (tier) => ({ padding: tier === 'sd' ? 22 : 18, borderRadius: tier === 'sd' ? 20 : 16, marginBottom: 14 }),
  quizActiveBg: (tier) => tier === 'sd' ? '#f5f3ff' : '#faf9ff',
  quizActiveBorder: (tier) => '#8b5cf6',
};

export default StudentModuleView;