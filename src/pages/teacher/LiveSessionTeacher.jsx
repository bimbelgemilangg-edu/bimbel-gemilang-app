// src/pages/teacher/LiveSessionTeacher.jsx
// PINTU SESI LIVE GURU: 📖 Materi Interaktif (bab buku digital) &
// ✍️ Soal & Pembahasan (bank soal). Sesuai sesiService.js asli repo:
// buatSesi() hanya menyimpan field dasar, jadi field tambahan
// (mode/sumber/daftarSoal/slideAktif) ditulis lewat ubahSesi() segera
// setelah sesi dibuat -- siswa pasti menerimanya.
// Fitur: manajemen sesi aktif, auto-akhiri sesi lama bab sama, fullscreen
// proyektor, badge tipe + petunjuk, grid CBT B/S, monitor nama+pilihan
// siswa (privat), pembahasan HTML privat guru, tipografi matematika asli.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import katexCss from 'katex/dist/katex.min.css?inline';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { parseDaftarSoal, parseSlides, bersihVerdikt, CSS_MODUL } from '../../utils/parseSoal';
import { percantikMatika, CSS_MATIKA } from '../../utils/matika';
import { renderLatexHtml } from '../../utils/renderLatexHtml';
import { buatSesi, dengarSesi, dengarPeserta, dengarJawaban, dengarTanya, hapusTanya, dengarRelawan, pilihRelawan, selesaikanMaju, mulaiTimerSesi, jedaTimerSesi, resetTimerSesi, ubahSesi, akhiriSesi } from '../../services/sesiService';
import { beriXpKeberanian, XP_KEBERANIAN_MAJU } from '../../services/xpService';
import { TAHAP_KELAS, tahapDenganId, formatTimer, sisaTimer } from '../../utils/tahapKelas';
import '../../components/buku/liveSession.css';

const S = {
  page: { maxWidth: 1150, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' },
  card: { background: '#fff', border: '1px solid #e3e6ef', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  select: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 11px', fontSize: 13, background: '#fff', minWidth: 220 },
  btn: { background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnH: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnW: { background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnR: { background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btn2: { background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  kode: { fontSize: 30, fontWeight: 900, letterSpacing: 5, color: '#4338ca', background: '#eef2ff', border: '2px dashed #a5b4fc', borderRadius: 12, padding: '8px 20px' },
  chip: { background: '#eef2ff', color: '#4338ca', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
  modeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 },
  modeCard: { background: '#fff', border: '2px solid #e2e8f0', borderRadius: 14, padding: 18, cursor: 'pointer', textAlign: 'left' },
  babRow: { display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' },
  slideBox: { background: '#0f172a', borderRadius: 14, padding: 18, minHeight: 320, color: '#e2e8f0' },
  bar: { height: 12, borderRadius: 6, minWidth: 3 },
  grid2: { display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 12 },
  gambarBox: { background: '#fff', border: '1px solid #e3e6ef', borderRadius: 10, padding: 10, marginBottom: 10 },
  tipeBadge: (t) => ({
    background: t === 'pg' ? '#dbeafe' : t === 'multi' ? '#fef3c7' : '#dcfce7',
    color: t === 'pg' ? '#1d4ed8' : t === 'multi' ? '#b45309' : '#166534',
    borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
  }),
  hurufBulat: { borderRadius: '50%', border: '2px solid #94a3b8', background: '#fff', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 },
  kotakCentang: { borderRadius: 6, border: '2px solid #94a3b8', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 },
  cbt: { border: '1px solid #e3e6ef', borderRadius: 12, overflow: 'hidden', background: '#fff', margin: '10px 0' },
  cbtHead: { display: 'grid', gridTemplateColumns: '1fr 88px 88px', background: '#4C6EF5', color: '#fff', fontWeight: 800 },
  cbtHeadText: { padding: '8px 12px' },
  cbtHeadOpt: { padding: '8px 4px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,.25)' },
  cbtRow: { display: 'grid', gridTemplateColumns: '1fr 88px 88px', borderTop: '1px solid #eef1f6' },
  cbtText: { padding: '10px 12px', lineHeight: 1.55 },
  cbtOpt: { display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #eef1f6', padding: '6px 0' },
  cbtRing: { borderRadius: '50%', border: '2px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 },
  cbtRingIsi: { background: '#16a34a', borderColor: '#16a34a', color: '#fff' },
  sesiRow: { display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px', marginBottom: 8, flexWrap: 'wrap' },
  siswaRow: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 11.5, marginBottom: 3 },
  siswaNama: { flex: 1, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  siswaJawab: { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '1px 7px', fontSize: 10.5, fontWeight: 800, color: '#4338ca', flexShrink: 0 },
  siswaBelum: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '1px 7px', fontSize: 10.5, fontWeight: 800, color: '#b45309', flexShrink: 0 },
};

function ringkasJawaban(soal, jw) {
  if (!soal || jw === undefined || jw === null) return '—';
  const t = soal.kunci?.tipe;
  if (t === 'pg') return typeof jw === 'number' ? String.fromCharCode(65 + jw) : String(jw);
  if (t === 'multi') return Array.isArray(jw) && jw.length ? jw.map((i) => i + 1).join(',') : '—';
  if (t === 'bs') return Array.isArray(jw) && jw.length ? jw.map((v) => (v ? 'B' : 'S')).join('') : '—';
  return '—';
}

export default function LiveSessionTeacher() {
  const [tahap, setTahap] = useState('mode');
  const [bukuList, setBukuList] = useState([]);
  const [bukuId, setBukuId] = useState('');
  const [babList, setBabList] = useState([]);
  const [babHtml, setBabHtml] = useState('');
  const [bankList, setBankList] = useState([]);
  const [bankPick, setBankPick] = useState(null);
  const [sesi, setSesi] = useState(null);
  const [peserta, setPeserta] = useState([]);
  const [jawaban, setJawaban] = useState([]);
  const [pertanyaan, setPertanyaan] = useState([]);
  const [relawan, setRelawan] = useState([]);
  const [isFs, setIsFs] = useState(false);
  const [sesiAktifList, setSesiAktifList] = useState([]);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [online, setOnline] = useState(() => navigator.onLine);
  const fsRef = useRef(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const uk = (n) => Math.round(n * (isFs ? 1.4 : 1));

  const guruId = (() => {
    try { const t = JSON.parse(localStorage.getItem('teacherData') || '{}'); return t.guruId || t.id || ''; } catch { return ''; }
  })();

  useEffect(() => {
    (async () => {
      try { const sn = await getDocs(collection(db, 'buku_digital')); setBukuList(sn.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { /* fallback offline */ }
      try {
        const sn = await getDocs(collection(db, 'bank_soal'));
        const grup = {};
        sn.docs.forEach((d) => {
          const s = { id: d.id, ...d.data() };
          if (s.status && s.status !== 'aktif') return;
          const key = (s.mataPelajaran || s.mapel || 'Umum') + '||' + (s.materi || 'Umum');
          if (!grup[key]) grup[key] = { key, mapel: s.mataPelajaran || s.mapel || 'Umum', materi: s.materi || 'Umum', items: [] };
          grup[key].items.push(s);
        });
        setBankList(Object.values(grup).filter((g) => g.items.length >= 3));
      } catch { /* fallback offline */ }
    })();
  }, []);

  const muatSesiAktif = async () => {
    try {
      const q = query(collection(db, 'sesi_kelas'), where('status', '==', 'aktif'));
      const sn = await getDocs(q);
      const list = sn.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.dibuatAt?.seconds || 0) - (a.dibuatAt?.seconds || 0));
      setSesiAktifList(list);
    } catch { /* fallback offline */ }
  };
  useEffect(() => { if (tahap === 'mode') muatSesiAktif(); }, [tahap]);

  useEffect(() => {
    if (!bukuId) { setBabList([]); return; }
    (async () => {
      try {
        const sn = await getDocs(collection(db, 'buku_digital', bukuId, 'bab'));
        const l = sn.docs.map((d) => ({ id: d.id, ...d.data() }));
        l.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setBabList(l);
      } catch { /* fallback offline */ }
    })();
  }, [bukuId]);

  useEffect(() => {
    if (!sesi) return undefined;
    const u1 = dengarSesi(sesi.id, (s) => { if (s) setSesi(s); });
    const u2 = dengarPeserta(sesi.id, setPeserta);
    const u3 = dengarJawaban(sesi.id, setJawaban);
    const u4 = dengarTanya(sesi.id, setPertanyaan);
    const u5 = dengarRelawan(sesi.id, setRelawan);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [sesi && sesi.id]);

  useEffect(() => {
    if (!sesi || sesi.mode !== 'materi' || !sesi.babId) return;
    (async () => {
      try {
        const s = await getDoc(doc(db, 'buku_digital', sesi.bukuId, 'bab', sesi.babId));
        if (s.exists()) setBabHtml(s.data().html || '');
      } catch { /* fallback offline */ }
    })();
  }, [sesi && sesi.id, sesi && sesi.mode]);

  useEffect(() => {
    if (!sesi || sesi.timerStatus !== 'running') return undefined;
    const id = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sesi && sesi.id, sesi && sesi.timerStatus]);

  const slides = useMemo(() => (babHtml ? parseSlides(babHtml) : []), [babHtml]);
  const soalDariHtml = useMemo(() => (babHtml ? parseDaftarSoal(babHtml) : []), [babHtml]);

  const daftarSoal = sesi ? (sesi.daftarSoal || []) : [];
  const slideNow = slides[sesi ? (sesi.slideAktif || 0) : 0] || null;
  const soalMateriNow = slideNow && slideNow.tipe === 'soal' ? daftarSoal[slideNow.soalIdx] : null;
  const soalBankNow = sesi && sesi.mode === 'bank' && sesi.soalAktif != null ? daftarSoal[sesi.soalAktif] : null;
  const soalNow = soalMateriNow || soalBankNow || null;
  const idxNow = soalMateriNow ? slideNow.soalIdx : (sesi ? sesi.soalAktif : null);
  const terbuka = sesi ? !!sesi.kunciTerbuka : false;
  const gambarNow = soalNow ? ((soalDariHtml[idxNow] || {}).gambarHtml || soalNow.gambarHtml || '') : '';
  const pembahasanHtmlNow = soalNow ? (soalNow.pembahasanHtml || (soalDariHtml[idxNow] || {}).pembahasanHtml || '') : '';
  const tipeNow = soalNow?.kunci?.tipe || null;
  const renderLiveMath = (html) => renderLatexHtml(percantikMatika(html || ''));

  const jwsNow = useMemo(() => (idxNow != null ? jawaban.filter((j) => j.soalIdx === idxNow) : []), [jawaban, idxNow]);
  const belum = peserta.filter((p) => !jwsNow.some((j) => j.siswaId === p.siswaId));
  const distribusi = useMemo(() => {
    if (!soalNow || !soalNow.kunci) return null;
    if (soalNow.kunci.tipe === 'pg') return (soalNow.pilihan || []).map((p, i) => ({ label: `${String.fromCharCode(65 + i)}. ${bersihVerdikt(p)}`, n: jwsNow.filter((j) => j.jawaban === i).length, nSalah: 0, benar: soalNow.kunci.pg === i }));
    if (soalNow.kunci.tipe === 'multi') return (soalNow.pilihan || []).map((p, i) => ({ label: bersihVerdikt(p), n: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban.includes(i)).length, nSalah: 0, benar: (soalNow.kunci.multi || []).includes(i) }));
    return (soalNow.pernyataan || []).map((p, i) => ({ label: bersihVerdikt(p), n: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban[i] === (soalNow.kunci.bs || [])[i]).length, nSalah: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban[i] !== undefined && j.jawaban[i] !== (soalNow.kunci.bs || [])[i]).length, benar: true }));
  }, [soalNow, jwsNow]);
  const maxN = distribusi ? Math.max(1, ...distribusi.map((d) => d.n + d.nSalah)) : 1;

  async function mulaiMateri(babItem) {
    const html = babItem.html || '';
    const soals = parseDaftarSoal(html);
    if (!soals.length) { alert('Bab ini tidak punya soal terparse.'); return; }
    try {
      const q = query(collection(db, 'sesi_kelas'), where('status', '==', 'aktif'), where('babId', '==', babItem.id));
      const sn = await getDocs(q);
      await Promise.all(sn.docs.map((d) => akhiriSesi(d.id)));
    } catch { /* fallback offline */ }
    const s = await buatSesi({ bukuId, babId: babItem.id, guruId, catatan: babItem.judul || '' });
    await ubahSesi(s.id, { mode: 'materi', sumber: 'buku', daftarSoal: soals, slideAktif: 0, soalAktif: null, kunciTerbuka: false, langkahTerbuka: 0 });
    setSesi({ id: s.id, kode: s.kode, mode: 'materi', sumber: 'buku', bukuId, babId: babItem.id, daftarSoal: soals, slideAktif: 0, soalAktif: null, kunciTerbuka: false, langkahTerbuka: 0, status: 'aktif' });
    setBabHtml(html);
    setTahap('live');
  }

  async function mulaiBank() {
    if (!bankPick) return;
    const soals = bankPick.items.map((s) => {
      const tipe = /benar|salah/i.test(s.tipe || '') ? 'bs' : /kompleks|multi/i.test(s.tipe || '') ? 'multi' : 'pg';
      const kunci = tipe === 'pg' ? { tipe: 'pg', pg: typeof s.kunciJawaban === 'number' ? s.kunciJawaban : 0 }
        : tipe === 'multi' ? { tipe: 'multi', multi: Array.isArray(s.kunciJawaban) ? s.kunciJawaban : [] }
        : { tipe: 'bs', bs: Array.isArray(s.kunciJawaban) ? s.kunciJawaban : [] };
      return {
        idx: 0, nomor: String(s.nomor || ''), tipe, level: s.level || 'sedang', sumber: 'Bank Soal',
        teks: s.soal || s.teks_soal || s.teks || '', pilihan: s.opsiJawaban || s.pilihan || [],
        pernyataan: s.pernyataan || [], kunci, langkah: s.langkah || [], pembahasan: s.pembahasan || '',
        pembahasanHtml: '', gambarHtml: '', gambarUrls: s.gambarUrls || [],
      };
    });
    const s = await buatSesi({ guruId, catatan: bankPick.materi });
    await ubahSesi(s.id, { mode: 'bank', sumber: 'bank', daftarSoal: soals, slideAktif: 0, soalAktif: null, kunciTerbuka: false, langkahTerbuka: 0 });
    setSesi({ id: s.id, kode: s.kode, mode: 'bank', sumber: 'bank', daftarSoal: soals, slideAktif: 0, soalAktif: null, kunciTerbuka: false, langkahTerbuka: 0, status: 'aktif' });
    setTahap('live');
  }

  const keSlide = (i) => ubahSesi(sesi.id, { slideAktif: Math.max(0, Math.min(slides.length - 1, i)), kunciTerbuka: false, langkahTerbuka: 0 });
  const masukFullscreen = () => { if (fsRef.current && fsRef.current.requestFullscreen) fsRef.current.requestFullscreen(); };
  const tahapAktif = tahapDenganId(sesi?.tahapKelas);
  const timerDetik = sisaTimer(sesi, clockNow);
  const ubahTahapKelas = (id) => ubahSesi(sesi.id, { tahapKelas: id });
  const mulaiTimer = (detik = sesi.timerDurasiDetik || 300) => mulaiTimerSesi(sesi.id, detik);
  const jedaTimer = () => jedaTimerSesi(sesi.id, timerDetik);
  const resetTimer = () => resetTimerSesi(sesi.id, sesi.timerDurasiDetik || 300);
  const panggilMaju = async (item) => {
    try { await pilihRelawan(sesi.id, item); } catch { window.alert('Siswa belum dapat dipanggil. Periksa koneksi lalu coba lagi.'); }
  };
  const selesaikanSiswaMaju = async () => {
    const aktif = sesi?.relawanAktif;
    if (!aktif) return;
    try {
      await beriXpKeberanian({ sesiId: sesi.id, siswaId: aktif.siswaId, nama: aktif.nama });
      await selesaikanMaju(sesi.id, aktif.siswaId);
    } catch { window.alert('XP belum berhasil dicatat. Jangan tutup sesi; coba tombol ini lagi.'); }
  };

  const warnaTeks = isFs ? '#e2e8f0' : '#1e293b';
  const warnaSub = isFs ? '#94a3b8' : '#64748b';
  const borderBaris = isFs ? '#334155' : '#e2e8f0';
  const bgBaris = (k) => (k ? (isFs ? '#14532d' : '#f0fdf4') : (isFs ? '#1e293b' : '#f8fafc'));
  const gayaBarisOpsi = (k) => ({
    display: 'flex', gap: uk(10), alignItems: 'center',
    padding: `${uk(8)}px ${uk(10)}px`, borderRadius: 10,
    border: `1px solid ${borderBaris}`, background: bgBaris(k),
    color: warnaTeks, fontSize: uk(13), marginBottom: 6,
  });

  if (tahap === 'mode') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>🔴 Mulai Sesi Kelas Live</h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>Pilih sumber sesi. Siswa bergabung lewat kode yang tampil di layar ini.</p>
        </div>
        {sesiAktifList.length > 0 && (
          <div style={S.card}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>🗂️ Sesi yang masih aktif ({sesiAktifList.length}) — akhiri yang sudah tidak dipakai</h4>
            {sesiAktifList.map((s) => (
              <div key={s.id} style={S.sesiRow}>
                <span style={{ ...S.chip, background: '#fff', borderColor: '#fde68a', color: '#92400e', fontSize: 13, fontWeight: 900, letterSpacing: 2 }}>{s.kode}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: '#334155' }}>
                  {s.catatan || 'Sesi'} • {s.mode === 'materi' ? '📖 Materi' : '✍️ Bank soal'}
                  {s.dibuatAt?.toDate ? ` • mulai ${s.dibuatAt.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </span>
                <button style={S.btn2} onClick={() => { setSesi(s); setTahap('live'); }}>Lanjutkan</button>
                <button style={S.btnR} onClick={async () => { if (window.confirm(`Akhiri sesi ${s.kode}?`)) { await akhiriSesi(s.id); muatSesiAktif(); } }}>Akhiri</button>
              </div>
            ))}
          </div>
        )}
        <div style={S.modeGrid}>
          <button style={S.modeCard} onClick={() => setTahap('buku')}>
            <div style={{ fontSize: 26 }}>📖</div>
            <div style={{ fontSize: 15, fontWeight: 800, margin: '6px 0 4px' }}>Materi Interaktif</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>Dari <b>bab buku digital</b>: slide materi tertata seperti PPT, lalu soal bab di akhir slide dikerjakan siswa secara interaktif.</div>
          </button>
          <button style={S.modeCard} onClick={() => setTahap('bank')}>
            <div style={{ fontSize: 26 }}>✍️</div>
            <div style={{ fontSize: 15, fontWeight: 800, margin: '6px 0 4px' }}>Soal & Pembahasan</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>Dari <b>bank soal</b>: latihan terpantau; pembahasan disampaikan guru secara lisan.</div>
          </button>
        </div>
      </div>
    );
  }

  if (tahap === 'buku' || tahap === 'bab') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.row}>
            <button style={S.btn2} onClick={() => setTahap(tahap === 'bab' ? 'buku' : 'mode')}>⬅ Kembali</button>
            <span style={{ fontSize: 15, fontWeight: 800 }}>📖 {tahap === 'buku' ? 'Pilih Buku Digital' : 'Pilih Bab'}</span>
          </div>
          {tahap === 'buku' ? (
            <div style={S.modeGrid}>
              {bukuList.map((b) => (
                <button key={b.id} style={S.modeCard} onClick={() => { setBukuId(b.id); setTahap('bab'); }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{b.judul}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{b.mapel || 'Buku digital'}</div>
                </button>
              ))}
            </div>
          ) : (
            babList.map((x) => (
              <div key={x.id} style={S.babRow} onClick={() => mulaiMateri(x)}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: '#ede9fe', color: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{x.urutan ?? '•'}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{x.judul}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{x.html ? 'siap' : 'tanpa html'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (tahap === 'bank') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.row}>
            <button style={S.btn2} onClick={() => setTahap('mode')}>⬅ Kembali</button>
            <span style={{ fontSize: 15, fontWeight: 800 }}>✍️ Pilih Paket Bank Soal</span>
          </div>
          {bankList.map((g) => (
            <div key={g.key} style={S.babRow} onClick={() => setBankPick(g)}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{g.materi}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{g.mapel} · {g.items.length} soal</span>
            </div>
          ))}
          {bankPick && <button style={{ ...S.btnH, marginTop: 10 }} onClick={mulaiBank}>🚀 Mulai Sesi Soal ({bankPick.items.length} soal)</button>}
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{katexCss}{CSS_MODUL}{CSS_MATIKA}</style>
      <style>{`
        .fs-area:fullscreen{background:#0f172a;overflow:auto;padding:28px}
        .fs-area:fullscreen .modmod{font-size:21px;line-height:1.7}
        .fs-exit{display:none}
        .fs-area:fullscreen .fs-exit{display:inline-block}
      `}</style>
      <div className="live-room-header" style={S.card}>
        <div style={S.row}>
          <span className="live-room-kicker">RUANG KENDALI GURU · TERHUBUNG REAL-TIME</span>
          <span style={S.kode}>{sesi.kode}</span>
          <span style={S.chip}>{sesi.mode === 'materi' ? '📖 Materi Interaktif' : '✍️ Soal & Pembahasan'}</span>
          <span style={S.chip}>👥 {peserta.length} siswa</span>
          {sesi.relawanAktif && <span className="live-courage-chip">🎤 {sesi.relawanAktif.nama} maju</span>}
          {sesi.mode === 'materi' && slideNow && <span style={S.chip}>Slide {(sesi.slideAktif || 0) + 1}/{slides.length}</span>}
          {soalNow && <span style={S.chip}>✍️ Soal {idxNow + 1}/{daftarSoal.length}</span>}
          {terbuka && <span style={{ ...S.chip, background: '#dcfce7', color: '#166534' }}>🔓 kunci terbuka</span>}
          <span style={{ flex: 1 }} />
          <button style={S.btnR} onClick={async () => { if (window.confirm('Akhiri sesi?')) { await akhiriSesi(sesi.id); setTahap('mode'); setSesi(null); } }}>⏹ Akhiri</button>
          <button style={S.btn2} onClick={() => window.open(`/guru/sesi-live/${sesi.id}/proyektor`, '_blank', 'noopener,noreferrer')}>📽️ Buka Proyektor</button>
        </div>
        <div className="live-room-overview">
          <div><strong>{peserta.length}</strong><span>Siswa terhubung</span></div>
          <div><strong>{jwsNow.length}</strong><span>Jawaban masuk</span></div>
          <div><strong>{pertanyaan.length}</strong><span>Pertanyaan masuk</span></div>
          <div className="live-room-tip">Gunakan layar kiri untuk menjelaskan. Panel kanan adalah kendali privat guru.</div>
        </div>
        <div className={`live-sync-status ${online && !sesi._fromCache ? 'is-online' : 'is-offline'}`} role="status" aria-live="polite">
          {(!online || sesi._fromCache) ? '○ Cache lokal — tunggu koneksi sesi aktif sebelum memindah soal/tahap.' : sesi._hasPendingWrites ? '◌ Perubahan tersimpan lokal — sedang dikirim ke siswa.' : '● Koneksi guru aktif — perubahan akan disebarkan ke siswa.'}
        </div>
        <div className="live-stage-control">
          <div className="live-stage-heading"><span>TAHAP KELAS</span><strong>{tahapAktif.ikon} {tahapAktif.label}</strong><small>{tahapAktif.bantuan}</small></div>
          <div className="live-stage-buttons">
            {TAHAP_KELAS.map((t) => <button type="button" key={t.id} className={t.id === tahapAktif.id ? 'active' : ''} onClick={() => ubahTahapKelas(t.id)}>{t.ikon} {t.label}</button>)}
          </div>
        </div>
        <div className="live-timer-control">
          <div><span className="live-stage-mini-label">TIMER KELAS</span><strong>{formatTimer(timerDetik)}</strong><small>{sesi.timerStatus === 'running' && timerDetik > 0 ? 'Berjalan di semua layar' : sesi.timerStatus === 'running' ? 'Waktu habis' : sesi.timerStatus === 'paused' ? 'Dijeda oleh guru' : 'Siap dimulai'}</small></div>
          <div className="live-timer-actions">
            {sesi.timerStatus === 'running' ? <button type="button" onClick={jedaTimer}>⏸ Jeda</button> : <button type="button" onClick={() => mulaiTimer(sesi.timerSisaDetik || sesi.timerDurasiDetik || 300)}>▶ Mulai</button>}
            <button type="button" onClick={resetTimer}>↺ Reset</button>
            <select aria-label="Durasi timer" value={sesi.timerDurasiDetik || 300} onChange={(e) => ubahSesi(sesi.id, { timerDurasiDetik: Number(e.target.value), timerSisaDetik: Number(e.target.value), timerStatus: 'idle' })}>
              <option value="60">1 menit</option><option value="180">3 menit</option><option value="300">5 menit</option><option value="600">10 menit</option>
            </select>
          </div>
        </div>
        {sesi.mode === 'materi' && (
          <div style={S.row}>
            <button style={S.btn2} disabled={(sesi.slideAktif || 0) <= 0} onClick={() => keSlide((sesi.slideAktif || 0) - 1)}>⬅ Slide</button>
            <button style={S.btn} disabled={(sesi.slideAktif || 0) >= slides.length - 1} onClick={() => keSlide((sesi.slideAktif || 0) + 1)}>Slide ➡</button>
            <select style={S.select} value={sesi.slideAktif || 0} onChange={(e) => keSlide(Number(e.target.value))}>
              {slides.map((sl, i) => (
                <option key={i} value={i}>{i + 1}. {sl.tipe === 'soal' ? `✍️ Soal ${sl.nomor}` : sl.tipe === 'cover' ? '🎯 Cover' : sl.tipe === 'refleksi' ? '💡 Refleksi' : sl.judul}</option>
              ))}
            </select>
          </div>
        )}
        {sesi.mode === 'bank' && (
          <div style={S.row}>
            <select style={S.select} value={sesi.soalAktif != null ? String(sesi.soalAktif) : ''} onChange={(e) => e.target.value !== '' && ubahSesi(sesi.id, { soalAktif: Number(e.target.value), kunciTerbuka: false, langkahTerbuka: 0 })}>
              <option value="">— pilih soal —</option>
              {daftarSoal.map((s, i) => <option key={i} value={i}>#{i + 1} ({s.tipe}) {String(s.teks).slice(0, 40)}</option>)}
            </select>
            {sesi.soalAktif != null && sesi.soalAktif < daftarSoal.length - 1 && (
              <button style={S.btn2} onClick={() => ubahSesi(sesi.id, { soalAktif: sesi.soalAktif + 1, kunciTerbuka: false, langkahTerbuka: 0 })}>➡ Soal Berikutnya</button>
            )}
          </div>
        )}
        {soalNow && (
          <div style={S.row}>
            {!terbuka && <button style={S.btnW} onClick={() => ubahSesi(sesi.id, { kunciTerbuka: true, langkahTerbuka: 1 })}>🔓 Buka Kunci ke Siswa</button>}
            {terbuka && <button style={S.btn2} onClick={() => ubahSesi(sesi.id, { kunciTerbuka: false, langkahTerbuka: 0 })}>🙈 Tutup Kunci</button>}
          </div>
        )}
      </div>

      <div style={S.grid2}>
        <div style={S.card} ref={fsRef} className="fs-area">
          <div style={{ ...S.row, marginBottom: 10 }}>
            <button style={S.btn2} onClick={masukFullscreen}>⛶ Layar Penuh (Proyektor)</button>
            <button className="fs-exit" style={S.btn2} onClick={() => document.exitFullscreen && document.exitFullscreen()}>⬅ Keluar Fullscreen</button>
          </div>
          {sesi.mode === 'materi' && slideNow && slideNow.tipe !== 'soal' && (
            <div style={S.slideBox}>
              {slideNow.tipe === 'cover' ? (
                <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                  <div style={{ fontSize: uk(11), letterSpacing: 3, color: '#94a3b8', fontWeight: 800 }}>BAB · MATERI</div>
                  <h1 style={{ fontSize: uk(30), margin: '10px 0', color: '#fff' }}>{slideNow.judul}</h1>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {(slideNow.chips || []).map((c, i) => <span key={i} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '3px 12px', fontSize: uk(11) }}>{c}</span>)}
                  </div>
                </div>
              ) : (
                <div className="modmod" style={{ background: '#fff', borderRadius: 12, padding: 14 }} dangerouslySetInnerHTML={{ __html: renderLiveMath(slideNow.html) }} />
              )}
            </div>
          )}
          {soalNow && (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ ...S.tipeBadge(tipeNow), fontSize: uk(11) }}>
                  {tipeNow === 'pg' ? '🅰️ PILIHAN GANDA' : tipeNow === 'multi' ? '☑️ PILIH LEBIH DARI SATU' : '⭕ BENAR / SALAH'}
                </span>
                <span style={{ fontSize: uk(12), color: warnaSub }}>
                  {tipeNow === 'pg' ? 'Siswa memilih SATU jawaban A–D.'
                    : tipeNow === 'multi' ? 'Siswa memilih SATU ATAU LEBIH pernyataan yang benar.'
                    : 'Siswa menilai BENAR atau SALAH untuk SETIAP pernyataan.'}
                </span>
              </div>
              {gambarNow ? (
                <div className="modmod" style={{ ...S.gambarBox, background: isFs ? '#1e293b' : '#fff' }} dangerouslySetInnerHTML={{ __html: renderLiveMath(gambarNow) }} />
              ) : (
                <div className="modmod live-stem" style={{ fontSize: uk(15), lineHeight: 1.6, marginBottom: 10, color: warnaTeks, fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: renderLiveMath(soalNow.teks) }} />
              )}
              {!gambarNow && soalNow.gambarUrls && soalNow.gambarUrls.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {soalNow.gambarUrls.map((u, i) => (
                    <img key={i} src={u} alt="" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, marginBottom: 6 }} />
                  ))}
                </div>
              )}
              {tipeNow === 'pg' && (soalNow.pilihan || []).map((p, i) => {
                const isKunci = terbuka && soalNow.kunci.pg === i;
                return (
                  <div key={i} style={gayaBarisOpsi(isKunci)}>
                    <span style={{ ...S.hurufBulat, width: uk(26), height: uk(26), fontSize: uk(12), ...(isKunci ? { background: '#16a34a', borderColor: '#16a34a', color: '#fff' } : isFs ? { borderColor: '#64748b', color: '#e2e8f0', background: '#0f172a' } : {}) }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ flex: 1 }} className="modmod"
                      dangerouslySetInnerHTML={{ __html: renderLiveMath(soalNow.pilihanHtml?.[i] || bersihVerdikt(p)) }} />
                    {isKunci && <span style={{ fontSize: uk(14) }}>✅</span>}
                  </div>
                );
              })}
              {tipeNow === 'multi' && (soalNow.pilihan || []).map((p, i) => {
                const isKunci = terbuka && (soalNow.kunci.multi || []).includes(i);
                return (
                  <div key={i} style={gayaBarisOpsi(isKunci)}>
                    <span style={{ ...S.kotakCentang, width: uk(22), height: uk(22), fontSize: uk(13), color: isKunci ? '#fff' : 'transparent', ...(isKunci ? { background: '#16a34a', borderColor: '#16a34a' } : isFs ? { borderColor: '#64748b', background: '#0f172a' } : {}) }}>
                      ✓
                    </span>
                    <span style={{ flex: 1 }} className="modmod"
                      dangerouslySetInnerHTML={{ __html: renderLiveMath(soalNow.pilihanHtml?.[i] || bersihVerdikt(p)) }} />
                  </div>
                );
              })}
              {tipeNow === 'bs' && (soalNow.pernyataan || []).length > 0 && (
                <div style={{ ...S.cbt, background: isFs ? '#0f172a' : '#fff', borderColor: borderBaris }}>
                  <div style={{ ...S.cbtHead, fontSize: uk(11) }}>
                    <span style={S.cbtHeadText}>Pernyataan</span>
                    <span style={S.cbtHeadOpt}>Benar</span>
                    <span style={S.cbtHeadOpt}>Salah</span>
                  </div>
                  {(soalNow.pernyataan || []).map((p, i) => {
                    const kunciB = (soalNow.kunci.bs || [])[i];
                    return (
                      <div key={i} style={{ ...S.cbtRow, borderTop: `1px solid ${isFs ? '#334155' : '#eef1f6'}` }}>
                        <div style={{ ...S.cbtText, fontSize: uk(13), color: warnaTeks }}>
                          {i + 1}. <span className="modmod"
                            dangerouslySetInnerHTML={{ __html: renderLiveMath(soalNow.pernyataanHtml?.[i] || bersihVerdikt(p)) }} />
                        </div>
                        <div style={{ ...S.cbtOpt, borderLeft: `1px solid ${isFs ? '#334155' : '#eef1f6'}` }}>
                          <span style={{ ...S.cbtRing, width: uk(26), height: uk(26), fontSize: uk(13), ...(terbuka && kunciB === true ? S.cbtRingIsi : isFs ? { borderColor: '#64748b', background: '#0f172a', color: 'transparent' } : {}) }}>✓</span>
                        </div>
                        <div style={{ ...S.cbtOpt, borderLeft: `1px solid ${isFs ? '#334155' : '#eef1f6'}` }}>
                          <span style={{ ...S.cbtRing, width: uk(26), height: uk(26), fontSize: uk(13), ...(terbuka && kunciB === false ? S.cbtRingIsi : isFs ? { borderColor: '#64748b', background: '#0f172a', color: 'transparent' } : {}) }}>✓</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {soalNow && !soalNow.pilihan?.length && !soalNow.pernyataan?.length && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10, fontSize: uk(12), color: '#92400e' }}>
                  ⚠️ Opsi/pernyataan soal ini tidak terbaca dari modul. Akhiri sesi lalu mulai ulang setelah parser diperbarui, atau periksa HTML bab di Manajer Buku Digital.
                </div>
              )}
            </div>
          )}
          {sesi.mode === 'materi' && !slideNow && <p style={{ fontSize: 12, color: '#64748b' }}>Memuat slide...</p>}
        </div>

        <div className="live-teacher-panel" style={S.card}>
          <div className="live-courage-panel">
            <div className="live-panel-title">🎤 Keberanian maju ke papan</div>
            {sesi.relawanAktif ? (
              <div className="live-courage-active">
                <div><span className="live-courage-label">DIPANGGIL GURU</span><strong>{sesi.relawanAktif.nama}</strong><small>Silakan maju ke papan dan jelaskan caramu.</small></div>
                <button type="button" onClick={selesaikanSiswaMaju}>✓ Selesai +{XP_KEBERANIAN_MAJU} XP</button>
              </div>
            ) : (
              <>
                <div className="live-panel-empty">Siswa yang menekan “Saya mau maju” akan muncul di sini.</div>
                <div className="live-courage-queue">
                  {relawan.filter((r) => r.status === 'menunggu').map((r) => (
                    <div className="live-courage-row" key={r.id}><strong>{r.nama || r.siswaId}</strong><span>siap mencoba</span><button type="button" onClick={() => panggilMaju(r)}>Panggil</button></div>
                  ))}
                </div>
              </>
            )}
          </div>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>📡 Jawaban siswa real-time</h4>
          {!soalNow && <p style={{ fontSize: 12, color: '#64748b' }}>{sesi.mode === 'materi' ? 'Navigasi slide; saat slide soal tampil, jawaban siswa masuk ke sini.' : 'Pilih soal untuk ditayangkan.'}</p>}
          {soalNow && (
            <>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                {jwsNow.length}/{peserta.length} menjawab • benar {jwsNow.filter((j) => j.benar).length}
              </div>
              {distribusi && distribusi.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, width: 160, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                  <div style={{ ...S.bar, width: `${((d.n + d.nSalah) / maxN) * 120}px`, background: terbuka ? (d.benar ? '#16a34a' : '#94a3b8') : '#4C6EF5' }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{terbuka ? (d.nSalah ? `${d.n}✓/${d.nSalah}✗` : d.n) : (d.n + d.nSalah)}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, borderTop: '1px dashed #e2e8f0', paddingTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Siapa menjawab apa (privat guru — belum dibahas):
                </div>
                {peserta.length === 0 && <div style={{ fontSize: 11, color: '#94a3b8' }}>Belum ada siswa bergabung.</div>}
                {peserta.map((p) => {
                  const j = jwsNow.find((x) => x.siswaId === p.siswaId);
                  return (
                    <div key={p.id} style={S.siswaRow}>
                      <span style={{ width: 16, textAlign: 'center' }}>{j ? (j.benar ? '✅' : '❌') : '⏳'}</span>
                      <span style={S.siswaNama}>{p.nama || p.siswaId}</span>
                      {j
                        ? <span style={S.siswaJawab}>{ringkasJawaban(soalNow, j.jawaban)}</span>
                        : <span style={S.siswaBelum}>belum</span>}
                    </div>
                  );
                })}
                {belum.length > 0 && <div style={{ fontSize: 10.5, color: '#f39c12', marginTop: 6 }}>Belum menjawab: {belum.map((p) => p.nama || p.siswaId).join(', ')}</div>}
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>
                  ⚠️ Panel ini hanya untuk layar guru. Saat proyeksi ke kelas, pakai ⛶ Layar Penuh supaya siswa hanya melihat area slide/soal.
                </div>
              </div>
              {(pembahasanHtmlNow || soalNow.pembahasan) && (
                <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: 'pointer', color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>🔒 Pembahasan (privat guru — tidak ikut diproyeksikan)</summary>
                  <div
                    className="modmod"
                    style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: 10, marginTop: 6 }}
                    dangerouslySetInnerHTML={{ __html: renderLiveMath(pembahasanHtmlNow || `<p>${soalNow.pembahasan}</p>`) }}
                  />
                </details>
              )}
              <div className="live-question-panel">
                <div className="live-panel-title">💬 Pertanyaan siswa</div>
                {pertanyaan.length === 0 && <div className="live-panel-empty">Belum ada pertanyaan. Siswa dapat mengirim pertanyaan dari panel mereka.</div>}
                {pertanyaan.slice(-6).map((t) => (
                  <div className="live-question-row" key={t.id}>
                    <div><strong>{t.nama || 'Siswa'}</strong><p>{t.teks}</p></div>
                    <button type="button" onClick={() => hapusTanya(sesi.id, t.id)}>Selesai</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
