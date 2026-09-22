// src/pages/student/gemilang/BukuBacaPage.jsx
// READER BUKU DIGITAL v7 -- TIGA MODE, SATU HALAMAN
//   TERSTRUKTUR | MODUL ASLI (PDF) | MODUL INTERAKTIF (HTML)
// v7: perbaikan kutip warna + file dibersihkan penuh (pengganti v6 rusak).
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft, CheckCircle2, XCircle, PenLine, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, BookOpen, Loader2, AlertTriangle,
} from 'lucide-react';
import { MathText, MathBlock } from '../../../components/MathText';
import VisualBuku, { GambarBuku } from '../../../components/buku/VisualBuku';
import { bukaPdf, renderHalamanKeCanvas } from '../../../utils/modulPdf';
import RendererHtmlBab from '../../../components/buku/RendererHtmlBab';
import ReaderControls from '../../../components/buku/ReaderControls';
import '../../../components/buku/buku.css';
import '../../../components/buku/bukuBookfeel.css'; // Bookfeel v2: ruang baca gaya buku cetak

const XP_SEKSI = 5;
const XP_MODUL = 5;
const XP_BENAR = 10;

export default function BukuBacaPage({ audience = 'student' }) {
  const { bukuId, babId } = useParams();
  const navigate = useNavigate();
  const isTeacher = audience === 'teacher';
  const studentId = isTeacher ? '' : (localStorage.getItem('studentId') || '');
  const basePath = isTeacher ? '/guru/buku' : '/siswa/buku';

  const [buku, setBuku] = useState(null);
  const [bab, setBab] = useState(null);
  const [siap, setSiap] = useState(false);
  const [selesaiSections, setSelesaiSections] = useState([]);
  const [quizTerbaik, setQuizTerbaik] = useState(null);
  const [mode, setMode] = useState('baca');
  const [jawaban, setJawaban] = useState({});
  const [hasil, setHasil] = useState(null);
  const [peringatan, setPeringatan] = useState(null);
  const [toast, setToast] = useState(null);
  const [readerTheme, setReaderTheme] = useState('paper');
  const [fontScale, setFontScale] = useState(1);
  const [focusMode, setFocusMode] = useState(false);
  const [layoutMode, setLayoutMode] = useState('scroll');
  const [sectionIndex, setSectionIndex] = useState(0);
  const [showContents, setShowContents] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [pageTurn, setPageTurn] = useState(false);
  const [teacherView, setTeacherView] = useState('guide');
  const keluarModeGuru = useCallback(() => setTeacherView('student'), []);

  const [halamanTerbaca, setHalamanTerbaca] = useState(0);
  const [selesaiModul, setSelesaiModul] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [halAktif, setHalAktif] = useState(0);
  const [zoomBaca, setZoomBaca] = useState(1);
  const [muatHal, setMuatHal] = useState(false);
  const canvasRef = useRef(null);
  const renderToken = useRef(0);
  const pdfMatikan = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [bSnap, babSnap] = await Promise.all([
          getDoc(doc(db, 'buku_digital', bukuId)),
          getDoc(doc(db, 'buku_digital', bukuId, 'bab', babId)),
        ]);
        if (bSnap.exists()) setBuku({ id: bSnap.id, ...bSnap.data() });
        if (babSnap.exists()) setBab({ id: babSnap.id, ...babSnap.data() });
      } catch (e) { console.error('Gagal muat bab:', e); }
      setSiap(true);
    })();
  }, [bukuId, babId]);

  useEffect(() => {
    if (!bab || !studentId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'siswa_buku_progress', `${studentId}_${bab.id}`));
        if (snap.exists()) {
          const d = snap.data();
          setSelesaiSections(d.selesaiSections || []);
          setQuizTerbaik(d.quizTerbaik ?? null);
          setHalamanTerbaca(Number(d.halamanTerbaca) || 0);
          setSelesaiModul(!!d.selesaiModul);
        }
      } catch (e) { console.error('Gagal muat progres buku:', e); }
    })();
  }, [bab, studentId]);

  const sections = useMemo(() => bab?.sections || [], [bab]);
  const ujiPemahaman = useMemo(() => bab?.ujiPemahaman || [], [bab]);

  useEffect(() => {
    try {
      const pref = JSON.parse(localStorage.getItem('gemilang:reader-preferences') || '{}');
      if (['paper', 'sepia', 'night'].includes(pref.theme)) setReaderTheme(pref.theme);
      if (Number(pref.fontScale)) setFontScale(Math.min(1.18, Math.max(0.9, Number(pref.fontScale))));
    } catch { /* preferensi rusak tidak boleh menghalangi buku dibaca */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('gemilang:reader-preferences', JSON.stringify({ theme: readerTheme, fontScale }));
    } catch { /* localStorage opsional */ }
  }, [readerTheme, fontScale]);

  useEffect(() => {
    if (!bab?.id) return;
    try {
      const posisi = JSON.parse(localStorage.getItem(`gemilang:reader-position:${bab.id}`) || '{}');
      if (Number.isInteger(posisi.sectionIndex)) setSectionIndex(Math.max(0, posisi.sectionIndex));
      setBookmarked(!!posisi.bookmarked);
    } catch { /* posisi lokal opsional */ }
  }, [bab?.id]);

  const simpanPosisiLokal = (patch) => {
    if (!bab?.id) return;
    try {
      const key = `gemilang:reader-position:${bab.id}`;
      const lama = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...lama, ...patch, updatedAt: Date.now() }));
      localStorage.setItem('gemilang:last-reader', JSON.stringify({
        bukuId, babId: bab.id, judul: bab.judul || '', updatedAt: Date.now(),
      }));
    } catch { /* posisi lokal opsional */ }
  };

  const modeHtml = !!bab && bab.tipe === 'html' && (!!bab.html || !!bab.htmlUrl);
  const modeModul = !!bab && !modeHtml && (bab.tipe === 'pdf' || ((!sections || sections.length === 0) && !!bab.pdfUrl));

  const daftarHalaman = useMemo(() => {
    if (!modeModul || !bab) return [];
    const total = Number(bab.jumlahHalaman) || 0;
    const mulai = Math.max(1, Number(bab.halamanMulai) || 1);
    const sampai = Math.min(total || 9999, Number(bab.halamanSelesai) || total || mulai);
    const out = [];
    for (let i = mulai; i <= Math.max(mulai, sampai); i++) out.push(i);
    return out.length ? out : [1];
  }, [modeModul, bab]);

  const simpanProgres = (patch) => {
    if (!studentId) return;
    setDoc(doc(db, 'siswa_buku_progress', `${studentId}_${bab.id}`), {
      studentId, babId: bab.id, ...patch, updatedAt: serverTimestamp(),
    }, { merge: true }).catch((e) => {
      console.error('Gagal simpan progres buku:', e);
      setPeringatan('Progres bacaan gagal tersimpan ke akunmu (koneksi). Coba buka lagi halaman ini sebentar lagi.');
    });
  };

  const tambahXp = async (xp) => {
    if (!studentId || xp <= 0) return;
    try {
      const jeda = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms));
      const ref = doc(db, 'siswa_progress', studentId);
      const snap = await Promise.race([getDoc(ref), jeda(8000)]);
      const ex = snap.exists() ? snap.data() : { xp: 0 };
      await Promise.race([setDoc(ref, { xp: (ex.xp || 0) + xp, updatedAt: serverTimestamp() }, { merge: true }), jeda(8000)]);
    } catch (e) {
      console.error('Gagal tambah XP buku:', e);
      setPeringatan('XP gagal tersimpan ke akunmu (koneksi lambat). Progres bacaan tetap aman tercatat.');
    }
  };

  const munculToast = (teks) => { setToast(teks); setTimeout(() => setToast(null), 1600); };

  const tandaiSelesai = (sid) => {
    if (selesaiSections.includes(sid)) return;
    const baru = [...selesaiSections, sid];
    setSelesaiSections(baru);
    simpanProgres({ selesaiSections: baru, terakhirDibacaSection: sid });
    const idx = sections.findIndex((sec) => sec.id === sid);
    if (idx >= 0) {
      const berikutnya = Math.min(Math.max(0, sections.length - 1), idx + 1);
      setSectionIndex(berikutnya);
      simpanPosisiLokal({ sectionIndex: berikutnya });
    }
    tambahXp(XP_SEKSI);
    munculToast(`+${XP_SEKSI} XP`);
  };

  const tandaiModulSelesai = () => {
    if (selesaiModul) return;
    setSelesaiModul(true);
    const terakhir = daftarHalaman[daftarHalaman.length - 1] || halamanTerbaca;
    setHalamanTerbaca(terakhir);
    simpanProgres({ selesaiModul: true, halamanTerbaca: terakhir });
    tambahXp(XP_MODUL);
    munculToast(`+${XP_MODUL} XP`);
  };

  useEffect(() => {
    if (!modeModul || !bab?.pdfUrl) return;
    let batal = false;
    setPdfError('');
    (async () => {
      try {
        const pdf = await bukaPdf(bab.pdfUrl);
        if (batal) { try { await pdf.destroy(); } catch { /* abaikan */ } return; }
        pdfMatikan.current = false;
        setPdfDoc(pdf);
      } catch (e) {
        console.error('Gagal memuat modul PDF:', e);
        if (!batal) setPdfError('Modul gagal dimuat: ' + (e?.message || e) + '. Periksa koneksi, lalu muat ulang halaman.');
      }
    })();
    return () => {
      batal = true;
      setPdfDoc((lama) => {
        if (lama && !pdfMatikan.current) { pdfMatikan.current = true; try { lama.destroy(); } catch { /* abaikan */ } }
        return null;
      });
    };
  }, [modeModul, bab?.pdfUrl]);

  useEffect(() => {
    if (!daftarHalaman.length) return;
    setHalAktif((prev) => {
      if (prev !== 0) return prev;
      try {
        const posisi = JSON.parse(localStorage.getItem(`gemilang:reader-position:${bab?.id}`) || '{}');
        if (Number.isInteger(posisi.pageIndex) && posisi.pageIndex > 0) {
          return Math.min(daftarHalaman.length - 1, posisi.pageIndex);
        }
      } catch { /* posisi lokal opsional */ }
      const idx = daftarHalaman.indexOf(halamanTerbaca);
      if (idx > 0 && idx < daftarHalaman.length - 1) return idx;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daftarHalaman.length, halamanTerbaca, bab?.id]);

  useEffect(() => {
    if (!modeModul || !daftarHalaman.length) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); ubahHalaman(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); ubahHalaman(1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeModul, daftarHalaman.length, halAktif]);

  useEffect(() => {
    if (!modeModul || !pdfDoc || !canvasRef.current || !daftarHalaman.length) return;
    const token = ++renderToken.current;
    setMuatHal(true);
    (async () => {
      try {
        const lebarLayar = typeof window !== 'undefined' ? Math.min(560, window.innerWidth - 28) : 480;
        const dpr = typeof window !== 'undefined' ? Math.min(2.5, window.devicePixelRatio || 1) : 2;
        const targetPx = Math.round(Math.min(2200, Math.max(700, lebarLayar * dpr) * zoomBaca));
        await renderHalamanKeCanvas(pdfDoc, daftarHalaman[halAktif], {
          maxLebar: targetPx,
          maxSkala: 5,
          canvas: canvasRef.current,
        });
        if (token !== renderToken.current) return;
        setMuatHal(false);
        const dibuka = daftarHalaman[halAktif];
        setHalamanTerbaca((prev) => {
          if (dibuka <= prev) return prev;
          simpanProgres({ halamanTerbaca: dibuka });
          return dibuka;
        });
      } catch (e) {
        console.error('Gagal merender halaman modul:', e);
        if (token === renderToken.current) { setMuatHal(false); setPdfError('Halaman gagal ditampilkan. Coba geser halaman atau muat ulang.'); }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeModul, pdfDoc, halAktif, zoomBaca, daftarHalaman]);

  const warna = buku?.warna || '#4C6EF5';

  const tampilkanHalaman = (nextIndex) => {
    const aman = Math.max(0, Math.min(daftarHalaman.length - 1, nextIndex));
    setPageTurn(true);
    window.setTimeout(() => setPageTurn(false), 260);
    setHalAktif(aman);
    simpanPosisiLokal({ pageIndex: aman, pageNumber: daftarHalaman[aman] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ubahHalaman = (delta) => tampilkanHalaman(halAktif + delta);

  const ubahSection = (nextIndex) => {
    const aman = Math.max(0, Math.min(Math.max(0, sections.length - 1), nextIndex));
    setSectionIndex(aman);
    simpanPosisiLokal({ sectionIndex: aman });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBookmark = () => {
    const berikutnya = !bookmarked;
    setBookmarked(berikutnya);
    simpanPosisiLokal({ bookmarked: berikutnya });
    munculToast(berikutnya ? 'Halaman ditandai untuk dibaca lagi' : 'Penanda dihapus');
  };

  const semuaTerjawab = ujiPemahaman.every((q) => {
    const j = jawaban[q.id];
    if (q.tipe === 'pg') return typeof j === 'number';
    if (q.tipe === 'multi') return Array.isArray(j) && j.length > 0;
    return Array.isArray(j) && j.length === (q.pernyataan || []).length && j.every((v) => typeof v === 'boolean');
  });

  const kumpulkanQuiz = () => {
    if (!semuaTerjawab) return;
    const daftar = ujiPemahaman.map((q) => {
      const j = jawaban[q.id];
      let benar = false;
      if (q.tipe === 'pg') benar = j === q.benar;
      else if (q.tipe === 'multi') benar = Array.isArray(j) && j.length === (q.benar || []).length && (q.benar || []).every((i) => j.includes(i));
      else benar = Array.isArray(j) && j.length === q.benar.length && j.every((v, i) => v === q.benar[i]);
      return { q, j, benar };
    });
    const benarCount = daftar.filter((x) => x.benar).length;
    const persen = daftar.length ? Math.round((benarCount / daftar.length) * 100) : 0;
    const xp = benarCount * XP_BENAR;
    const terbaik = Math.max(quizTerbaik || 0, persen);
    setHasil({ daftar, benarCount, persen, xp });
    setQuizTerbaik(terbaik);
    simpanProgres({ quizTerbaik: terbaik });
    tambahXp(xp);
    setMode('hasil');
    window.scrollTo(0, 0);
  };

  const renderBlok = (blok, i) => {
    let inti = null;
    if (blok.tipe === 'p' && blok.teks) inti = <p style={st.paragraf}><MathText text={blok.teks} /></p>;
    else if (blok.tipe === 'list' && Array.isArray(blok.items) && blok.items.length) inti = <ul style={st.list}>{blok.items.map((it, j) => <li key={j} style={{ marginBottom: 6 }}><MathText text={it} /></li>)}</ul>;
    else if (blok.tipe === 'math' && blok.teks) inti = <div style={st.boxMath}><MathBlock text={blok.teks} /></div>;
    else if (blok.tipe === 'contoh' && blok.teks) inti = <div style={st.boxContoh}><b>Contoh</b><div style={{ marginTop: 4 }}><MathText text={blok.teks} /></div></div>;
    else if (blok.tipe === 'tips' && blok.teks) inti = <div style={st.boxTips}><b>Tips</b><div style={{ marginTop: 4 }}><MathText text={blok.teks} /></div></div>;
    else if (blok.tipe === 'gambar' && blok.src) inti = <GambarBuku src={blok.src} alt={blok.alt} caption={blok.caption} />;
    const visual = blok.visual ? <VisualBuku visual={blok.visual} /> : null;
    if (!inti && !visual) return null;
    return <React.Fragment key={i}>{inti}{visual}</React.Fragment>;
  };

  const persenBaca = modeHtml
    ? (selesaiModul ? 100 : 0)
    : modeModul
      ? (daftarHalaman.length
        ? Math.round((Math.min(halamanTerbaca, daftarHalaman[daftarHalaman.length - 1]) - daftarHalaman[0] + 1) / daftarHalaman.length * 100)
        : 0)
      : (sections.length ? Math.round((selesaiSections.length / sections.length) * 100) : 0);
  const persenAman = Math.max(0, Math.min(100, persenBaca));

  const teksProgres = isTeacher
    ? 'Mode persiapan mengajar · pelajari konsep, cara cepat, dan kesalahan umum'
    : modeHtml
    ? `${selesaiModul ? 'selesai dibaca' : 'belum selesai dibaca'}${quizTerbaik != null ? ` • quiz terbaik ${quizTerbaik}%` : ''}`
    : modeModul
      ? `${daftarHalaman.length ? (Math.min(halamanTerbaca, daftarHalaman[daftarHalaman.length - 1]) - daftarHalaman[0] + 1) : 0}/${daftarHalaman.length} halaman dibaca${selesaiModul ? ' • selesai' : ''}${quizTerbaik != null ? ` • quiz terbaik ${quizTerbaik}%` : ''}`
      : `${selesaiSections.length}/${sections.length} seksi selesai${quizTerbaik != null ? ` • quiz terbaik ${quizTerbaik}%` : ''}`;

  const sectionsToRender = layoutMode === 'page'
    ? sections.slice(sectionIndex, sectionIndex + 1)
    : sections;

  if (!siap) {
    return <div style={st.pusat}><div style={{ fontSize: 32 }}>📖</div><div style={{ marginTop: 8 }}>Memuat bab...</div></div>;
  }
  if (!bab) {
    return (
      <div style={st.pusat}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📚</div>
        <div>Bab tidak ditemukan di database.</div>
        <button onClick={() => navigate('/siswa/buku')} style={{ ...st.tombolUtama, width: 'auto', marginTop: 16, padding: '10px 18px' }}>Kembali ke Rak Buku</button>
      </div>
    );
  }

  const lebarHalaman = modeHtml ? (isTeacher ? 1120 : 960) : 480;

  return (
    <div
      className={`gemilang-reader reader-theme-${readerTheme}${focusMode ? ' reader-focus' : ''}`}
      style={{ ...st.page, maxWidth: lebarHalaman }}
    >
      {toast && <div style={st.toast}>{toast}</div>}
      {peringatan && (
        <div style={st.peringatan}><AlertTriangle size={13} /> {peringatan}</div>
      )}

      <div className="reader-hero" style={{ ...st.hero, background: `linear-gradient(160deg, ${warna} 0%, #1E1B4B 100%)` }}>
        <div style={st.heroStars} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <button onClick={() => (mode === 'baca' ? navigate(`${basePath}/${bukuId}`) : setMode('baca'))} style={st.backBtn}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buku?.emoji || '📘'} {buku?.judul || ''}</div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{bab.judul}</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 }}>
              {modeModul && <span style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 5, padding: '1px 5px', marginRight: 5, fontSize: 9.5, fontWeight: 800 }}>MODUL ASLI</span>}
              {modeHtml && <span style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 5, padding: '1px 5px', marginRight: 5, fontSize: 9.5, fontWeight: 800 }}>{isTeacher ? 'PERSIAPAN GURU' : 'MODUL INTERAKTIF'}</span>}
              {teksProgres}
            </div>
          </div>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 10, marginTop: 14, position: 'relative', zIndex: 1 }}>
          <div style={{ height: '100%', width: `${persenAman}%`, background: 'linear-gradient(90deg, #FB923C, #FBBF24)', borderRadius: 10, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <ReaderControls
        theme={readerTheme}
        onTheme={setReaderTheme}
        fontScale={fontScale}
        onFontScale={setFontScale}
        focusMode={focusMode}
        onFocusMode={() => setFocusMode((v) => !v)}
        layoutMode={layoutMode}
        onLayoutMode={setLayoutMode}
        showLayout={!modeModul && !modeHtml && sections.length > 1}
        bookmarked={bookmarked}
        onBookmark={toggleBookmark}
        onContents={() => setShowContents((v) => !v)}
        progress={persenAman}
        pageLabel={modeModul ? `Halaman ${daftarHalaman[halAktif] || 1}` : `${Math.min(sectionIndex + 1, sections.length || 1)} dari ${sections.length || 1} bagian`}
      />

      {bookmarked && mode === 'baca' && (
        <div className="reader-bookmark-note">Penanda tersimpan di perangkat ini. Kamu bisa kembali melanjutkan dari bagian yang sama.</div>
      )}

      {showContents && mode === 'baca' && !modeModul && !modeHtml && (
        <aside className="reader-contents" aria-label="Daftar isi bab">
          <div className="reader-contents__head"><strong>Daftar isi bab</strong><button type="button" onClick={() => setShowContents(false)}>Tutup</button></div>
          {sections.map((sec, idx) => (
            <button
              type="button"
              key={sec.id}
              className={idx === sectionIndex ? 'is-current' : ''}
              onClick={() => { ubahSection(idx); setShowContents(false); }}
            >
              <span>{idx + 1}</span>
              <span>{sec.judul}</span>
              {selesaiSections.includes(sec.id) && <CheckCircle2 size={15} />}
            </button>
          ))}
        </aside>
      )}

      {mode === 'baca' && !modeModul && !modeHtml && (
        <div className="reader-content reader-structured" style={{ fontSize: `${fontScale}em` }}>
          {sectionsToRender.map((sec) => {
            const idx = sections.findIndex((item) => item.id === sec.id);
            const sudah = selesaiSections.includes(sec.id);
            return (
              <div key={sec.id} className="reader-surface" style={st.kartuSeksi}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{sec.judul}</div>
                  {sudah && <CheckCircle2 size={18} color="#22c55e" />}
                </div>
                {(sec.blocks || []).map(renderBlok)}
                <button
                  onClick={() => tandaiSelesai(sec.id)}
                  disabled={sudah}
                  style={{ ...st.tombolKecil, background: sudah ? '#dcfce7' : '#7C3AED', color: sudah ? '#166534' : 'white' }}
                >
                  {sudah ? 'Selesai dibaca' : 'Tandai selesai & lanjut'}
                </button>
                {idx < sections.length - 1 && (
                  <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 6 }}>Lanjut: {sections[idx + 1].judul}</div>
                )}
              </div>
            );
          })}
          {layoutMode === 'page' && sections.length > 1 && (
            <div className="reader-page-nav">
              <button type="button" disabled={sectionIndex <= 0} onClick={() => ubahSection(sectionIndex - 1)}>← Sebelumnya</button>
              <button type="button" disabled={sectionIndex >= sections.length - 1} onClick={() => ubahSection(sectionIndex + 1)}>Berikutnya →</button>
            </div>
          )}
        </div>
      )}

      {mode === 'baca' && modeModul && (
        <div style={{ padding: '12px 12px 96px' }}>
          {pdfError && (
            <div style={{ ...st.kartuSeksi, background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b', fontSize: 12 }}>
              ⚠️ {pdfError}
            </div>
          )}
          {!pdfDoc && !pdfError && (
            <div style={{ ...st.kartuSeksi, textAlign: 'center', color: '#64748b', fontSize: 12.5 }}>
              <Loader2 size={20} className="spin" style={{ margin: '0 auto 8px' }} />
              Memuat modul ({bab.namaFile || 'PDF'})...
            </div>
          )}
          {pdfDoc && (
            <>
              <div style={st.barHalaman}>
                <button style={st.tombolHal} disabled={halAktif <= 0} onClick={() => ubahHalaman(-1)}>
                  <ChevronLeft size={17} />
                </button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b' }}>
                    Halaman {daftarHalaman[halAktif]} <span style={{ color: '#94a3b8', fontWeight: 600 }}>({halAktif + 1}/{daftarHalaman.length})</span>
                  </div>
                  <input
                    type="range" min={0} max={Math.max(0, daftarHalaman.length - 1)} value={halAktif}
                    onChange={(e) => tampilkanHalaman(Number(e.target.value))}
                    className="slider-modul"
                    style={{ width: '100%', marginTop: 4, accentColor: '#7C3AED' }}
                  />
                </div>
                <button style={st.tombolHal} disabled={halAktif >= daftarHalaman.length - 1} onClick={() => ubahHalaman(1)}>
                  <ChevronRight size={17} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                <button onClick={() => setZoomBaca((z) => Math.max(0.8, +(z - 0.25).toFixed(2)))} style={st.tombolZoom}><ZoomOut size={14} /> Perkecil</button>
                <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center', minWidth: 42, textAlign: 'center' }}>{Math.round(zoomBaca * 100)}%</span>
                <button onClick={() => setZoomBaca((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))} style={st.tombolZoom}><ZoomIn size={14} /> Perbesar</button>
              </div>
              <div className={`reader-pdf-page${pageTurn ? ' is-turning' : ''}`} style={st.kotakModul}>
                {muatHal && <div style={st.muatHal}><Loader2 size={18} className="spin" /></div>}
                <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 10 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={tandaiModulSelesai}
                  disabled={selesaiModul}
                  style={{ ...st.tombolKecil, flex: 1, background: selesaiModul ? '#dcfce7' : '#7C3AED', color: selesaiModul ? '#166534' : 'white' }}
                >
                  {selesaiModul ? 'Modul selesai dibaca' : `Tandai selesai baca modul (+${XP_MODUL} XP)`}
                </button>
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 8, lineHeight: 1.6, textAlign: 'center' }}>
                Baca sampai tuntas, lalu kerjakan Uji Pemahaman di bawah. Modul ini tampilan aslinya dari buku cetak —
                perbesar kalau rumusnya kecil.
              </div>
            </>
          )}
        </div>
      )}

      {mode === 'baca' && modeHtml && (
        <div style={{ padding: '12px 12px 40px' }}>
          {isTeacher && (
            <div className="teacher-reader-switch">
              <div>
                <strong>Ruang Persiapan Guru</strong>
                <small>Mode panduan membuka kunci, Langkah Gemilang, dan catatan mengajar.</small>
              </div>
              <div className="teacher-reader-switch__actions">
                <button type="button" className={teacherView === 'guide' ? 'is-active' : ''} onClick={() => setTeacherView('guide')}>Panduan Guru</button>
                <button type="button" className={teacherView === 'student' ? 'is-active' : ''} onClick={() => setTeacherView('student')}>Pratinjau Siswa</button>
              </div>
            </div>
          )}
          <div style={st.kotakModul}>
            <RendererHtmlBab
              html={bab.html}
              htmlUrl={bab.htmlUrl}
              babId={bab.id}
              bukuId={bukuId}
              modePresentasi={isTeacher && teacherView === 'guide'}
              onKeluar={keluarModeGuru}
            />
          </div>
          {!isTeacher && <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              onClick={tandaiModulSelesai}
              disabled={selesaiModul}
              style={{ ...st.tombolKecil, flex: 1, background: selesaiModul ? '#dcfce7' : '#7C3AED', color: selesaiModul ? '#166534' : 'white' }}
            >
              {selesaiModul ? 'Modul selesai dibaca' : `Tandai selesai baca modul (+${XP_MODUL} XP)`}
            </button>
          </div>}
        </div>
      )}

      {mode === 'quiz' && (
        <div style={{ padding: '16px 16px 90px' }}>
          {ujiPemahaman.length === 0 ? (
            <div style={st.kartuSeksi}>
              <BookOpen size={18} color="#94a3b8" />
              <div style={{ marginTop: 6 }}>Belum ada soal pemantapan di bab ini.</div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
                Guru/admin bisa menambahkannya lewat Manajer Buku, bab ini, lalu Edit.
              </div>
            </div>
          ) : ujiPemahaman.map((q, i) => (
            <div key={q.id} style={st.kartuSeksi}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={st.nomorSoal}>{i + 1}</span>
                <div style={{ flex: 1, fontSize: 13.5, color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  <MathText text={q.soal} />
                </div>
              </div>
              {q.visual && <VisualBuku visual={q.visual} />}
              {q.gambar && <GambarBuku src={q.gambar.src} alt={q.gambar.alt} caption={q.gambar.caption} />}
              {q.tipe === 'pg' && <InputPg q={q} nilai={jawaban[q.id]} set={(v) => setJawaban((p) => ({ ...p, [q.id]: v }))} />}
              {q.tipe === 'multi' && <InputMulti q={q} nilai={jawaban[q.id]} set={(v) => setJawaban((p) => ({ ...p, [q.id]: v }))} />}
              {q.tipe === 'bs' && <InputBs q={q} nilai={jawaban[q.id]} set={(v) => setJawaban((p) => ({ ...p, [q.id]: v }))} />}
            </div>
          ))}
        </div>
      )}

      {mode === 'hasil' && hasil && (
        <div style={{ padding: '16px 16px 40px' }}>
          <div style={{ ...st.kartuSeksi, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>{hasil.persen >= 70 ? '🎉' : hasil.persen >= 40 ? '💪' : '📖'}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#7C3AED' }}>{hasil.persen}%</div>
            <div style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 10px' }}>{hasil.benarCount} benar dari {hasil.daftar.length} soal • +{hasil.xp} XP</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => { setJawaban({}); setHasil(null); setMode('quiz'); window.scrollTo(0, 0); }} style={{ ...st.tombolKecil, background: '#f1f5f9', color: '#334155' }}>Ulangi Quiz</button>
              <button onClick={() => setMode('baca')} style={{ ...st.tombolKecil, background: '#7C3AED', color: 'white' }}>Kembali ke Bacaan</button>
            </div>
          </div>
          {hasil.daftar.map((item, i) => (
            <div key={i} style={{ ...st.kartuSeksi, borderLeft: `4px solid ${item.benar ? '#22c55e' : '#ef4444'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {item.benar ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                <span style={{ fontSize: 11.5, fontWeight: 700, color: item.benar ? '#16a34a' : '#dc2626' }}>Soal {i + 1} — {item.benar ? 'Benar' : 'Kurang Tepat'}</span>
              </div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.6, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                <MathText text={item.q.soal} />
              </div>
              {item.q.visual && <VisualBuku visual={item.q.visual} />}
              {item.q.gambar && <GambarBuku src={item.q.gambar.src} alt={item.q.gambar.alt} caption={item.q.gambar.caption} />}
              <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 3 }}>Jawabanmu: <b>{teksJawaban(item.q, item.j)}</b></div>
              {!item.benar && <div style={{ fontSize: 11.5, color: '#16a34a', marginBottom: 3 }}>Kunci: <b>{teksKunci(item.q)}</b></div>}
              {item.q.pembahasan && (
                <div style={st.boxPembahasan}>
                  <b>Pembahasan</b>
                  <div style={{ marginTop: 4 }}><MathText text={item.q.pembahasan} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {mode !== 'hasil' && !modeHtml && (
        <div style={st.barBawah}>
          {mode === 'baca' ? (
            <button
              onClick={() => { setMode('quiz'); window.scrollTo(0, 0); }}
              style={{ ...st.tombolUtama, opacity: ujiPemahaman.length ? 1 : 0.55 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <PenLine size={16} />
                {ujiPemahaman.length ? `Uji Pemahaman Bab (${ujiPemahaman.length} soal)` : 'Belum ada soal di bab ini'}
              </span>
            </button>
          ) : (
            <button onClick={kumpulkanQuiz} disabled={!semuaTerjawab} style={{ ...st.tombolUtama, opacity: semuaTerjawab ? 1 : 0.4 }}>
              Kumpulkan Jawaban
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InputPg({ q, nilai, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(q.pilihan || []).map((p, i) => (
        <button key={i} onClick={() => set(i)} style={{ ...st.opsi, ...(nilai === i ? st.opsiAktif : {}) }}>
          <span style={st.huruf}>{String.fromCharCode(65 + i)}</span>
          <span style={{ flex: 1, textAlign: 'left' }}><MathText text={p} /></span>
        </button>
      ))}
    </div>
  );
}

function InputMulti({ q, nilai, set }) {
  const arr = Array.isArray(nilai) ? nilai : [];
  const toggle = (i) => set(arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(q.pilihan || []).map((p, i) => (
        <button key={i} onClick={() => toggle(i)} style={{ ...st.opsi, ...(arr.includes(i) ? st.opsiAktif : {}) }}>
          <span style={{ ...st.huruf, borderRadius: 6 }}>{arr.includes(i) ? '✓' : ''}</span>
          <span style={{ flex: 1, textAlign: 'left' }}><MathText text={p} /></span>
        </button>
      ))}
      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>Pilih lebih dari satu jawaban.</div>
    </div>
  );
}

function InputBs({ q, nilai, set }) {
  const arr = Array.isArray(nilai) ? nilai : Array((q.pernyataan || []).length).fill(null);
  const pilih = (i, v) => { const baru = [...arr]; baru[i] = v; set(baru); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(q.pernyataan || []).map((p, i) => (
        <div key={i} style={st.barisBs}>
          <div style={{ flex: 1, fontSize: 12.5, color: '#1e293b' }}><MathText text={p} /></div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => pilih(i, true)} style={{ ...st.pill, ...(arr[i] === true ? st.pillOk : {}) }}>Benar</button>
            <button onClick={() => pilih(i, false)} style={{ ...st.pill, ...(arr[i] === false ? st.pillNo : {}) }}>Salah</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const teksJawaban = (q, j) => {
  if (q.tipe === 'pg') return typeof j === 'number' ? (q.pilihan || [])[j] : '(kosong)';
  if (q.tipe === 'multi') return Array.isArray(j) && j.length ? j.slice().sort((a, b) => a - b).map((i) => (q.pilihan || [])[i]).join(' | ') : '(kosong)';
  return Array.isArray(j) ? j.map((v, i) => `${i + 1}) ${v ? 'Benar' : 'Salah'}`).join(', ') : '(kosong)';
};
const teksKunci = (q) => {
  if (q.tipe === 'pg') return (q.pilihan || [])[q.benar];
  if (q.tipe === 'multi') return (q.benar || []).map((i) => (q.pilihan || [])[i]).join(' | ');
  return (q.benar || []).map((v, i) => `${i + 1}) ${v ? 'Benar' : 'Salah'}`).join(', ');
};

const st = {
  page: { minHeight: '100vh', background: '#F4F2FF', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' },
  pusat: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: '#F4F2FF', fontFamily: 'sans-serif', textAlign: 'center', padding: 20 },
  hero: { position: 'relative', overflow: 'hidden', padding: '16px 16px 20px' },
  heroStars: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.08), transparent 45%)', pointerEvents: 'none' },
  backBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 },
  peringatan: { display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '10px 16px', fontSize: 11.5, color: '#92400e' },
  kartuSeksi: { background: 'white', borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: '0 4px 16px rgba(30,27,75,0.06)', textAlign: 'left', border: '1px solid transparent' },
  paragraf: { fontSize: 13.5, color: '#334155', lineHeight: 1.75, marginBottom: 10, textAlign: 'left' },
  list: { fontSize: 13.5, color: '#334155', lineHeight: 1.7, paddingLeft: 18, marginBottom: 10, textAlign: 'left' },
  boxMath: { background: '#F4F2FF', border: '1px solid #e9e5fb', borderRadius: 12, padding: '6px 10px', marginBottom: 12, overflowX: 'auto' },
  boxContoh: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 13, color: '#78350F', textAlign: 'left' },
  boxTips: { background: '#F4F2FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 13, color: '#4C1D95', textAlign: 'left' },
  boxPembahasan: { marginTop: 10, padding: 12, borderRadius: 12, background: '#F4F2FF', fontSize: 12.5, color: '#4C1D95', lineHeight: 1.6, textAlign: 'left' },
  barHalaman: { display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 14, padding: '8px 10px', marginBottom: 10, boxShadow: '0 2px 10px rgba(30,27,75,0.06)' },
  tombolHal: { background: '#F4F2FF', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5b21b6', flexShrink: 0 },
  tombolZoom: { display: 'flex', alignItems: 'center', gap: 5, background: 'white', border: '1px solid #e9e5fb', borderRadius: 999, padding: '6px 11px', fontSize: 11, fontWeight: 700, color: '#5b21b6', cursor: 'pointer' },
  kotakModul: { position: 'relative', background: 'white', borderRadius: 14, padding: 8, boxShadow: '0 4px 16px rgba(30,27,75,0.08)', overflow: 'hidden' },
  muatHal: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', zIndex: 2 },
  tombolUtama: { width: '100%', padding: 15, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 16px rgba(124,58,237,0.25)' },
  tombolKecil: { padding: '10px 14px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  nomorSoal: { width: 24, height: 24, borderRadius: '50%', background: '#ede9fe', color: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  opsi: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '2px solid #e9e5fb', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', fontSize: 13, color: '#1e293b' },
  opsiAktif: { borderColor: '#7C3AED', background: '#F4F2FF' },
  huruf: { width: 24, height: 24, borderRadius: '50%', background: '#f1f0f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#4C1D95', flexShrink: 0 },
  barisBs: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e9e5fb', borderRadius: 12, padding: '10px 12px' },
  pill: { padding: '6px 10px', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', fontSize: 11, fontWeight: 700, color: '#64748b', cursor: 'pointer' },
  pillOk: { background: '#22c55e', borderColor: '#22c55e', color: 'white' },
  pillNo: { background: '#ef4444', borderColor: '#ef4444', color: 'white' },
  barBawah: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 16px', background: 'rgba(255,255,255,0.96)', borderTop: '1px solid #e9e5fb', zIndex: 5, boxSizing: 'border-box' },
  toast: { position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', background: '#7C3AED', color: 'white', borderRadius: 999, padding: '8px 16px', fontWeight: 800, fontSize: 13, zIndex: 10, boxShadow: '0 6px 16px rgba(124,58,237,0.35)' },
};
