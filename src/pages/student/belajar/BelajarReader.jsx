// src/pages/student/belajar/BelajarReader.jsx
// ============================================================
// MATERI v2 -- READER SISWA (route /siswa/belajar/:materiId/:babId)
// Visual & struktur mengikuti mockup resmi owner:
// docs/desain/mockup-ui-gemilang.png (Turn 5).
//   - Topbar: Kembali | search pill | lonceng + avatar
//   - Breadcrumb chips, judul besar, progress "x/y bagian"
//   - Tab: Materi | Ringkasan | Video | Latihan Soal | Diskusi
//   - Kartu konten: rumus kotak biru, tips amber, langkah bernomor
//   - Kuis: satu soal per layar, feedback langsung, pagination
//   - Panel kanan desktop: Daftar Materi + kartu kutipan
//
// Integrasi mendatang (JANGAN dihapus):
//  - Fase 3: banner sinkron guru via `sesi_presentasi` di sini.
//  - Tab Video memakai bab.videoUrl (Supabase) bila diisi admin.
// ============================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, Lightbulb,
  TriangleAlert, Info, Image as IconGambar, RotateCcw, Search, Bell,
  PlayCircle, FileText, MessageCircle, XCircle, BookOpen, Star,
  Presentation,
} from 'lucide-react';
import { MathText } from '../../../components/MathText';
import IsiSections from '../../../components/belajar/IsiSections';
import {
  cariSesiAktif, pantauSesi, tandaiPeserta, kirimJawabanLive,
  antreMaju, batalAntre, pantauAntreanSaya,
} from '../../../services/sesiPresentasiService';
import {
  muatMateriDanBab, muatProgressSiswa, simpanProgressBab,
  simpanTerakhir, persenBab, paksaFlushTulisan,
} from '../../../services/materiV2Service';
import {
  T, kartuDasar, chip, lingkaranNomor, barLuar, barDalam,
  tombolPill, kotakTips, kotakSukses, halamanDasar,
  lencanaSeksi,
} from './tema';

const XP_BACA = 5;
const XP_BENAR = 10;

export default function BelajarReader() {
  const { materiId, babId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '';
  const namaSiswa = localStorage.getItem('studentName') || 'Siswa Gemilang';
  const inisial = namaSiswa.split(' ').map((k) => k[0]).join('').slice(0, 2).toUpperCase();

  const [materi, setMateri] = useState(null);
  const [babList, setBabList] = useState([]);
  const [bab, setBab] = useState(null);
  const [progresMap, setProgresMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('materi');
  const [selesaiBaca, setSelesaiBaca] = useState(false);
  const [jawaban, setJawaban] = useState({});
  const [soalIdx, setSoalIdx] = useState(0);
  const [quizTersimpan, setQuizTersimpan] = useState(null);
  const [cari, setCari] = useState('');
  const [toast, setToast] = useState(null);
  const [sesiKuis, setSesiKuis] = useState(0);
  const kuisTersimpanSesi = useRef(false);
  const [lebar, setLebar] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 800));

  useEffect(() => {
    const onResize = () => setLebar(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const tampilPanel = lebar >= 1100;

  // ============ SESI PRESENTASI GURU (Fase 3) ============
  const [sesi, setSesi] = useState(null);
  const [antreanSaya, setAntreanSaya] = useState(null);
  const [abaikanIkuti, setAbaikanIkuti] = useState(false);
  const pesertaDitandai = useRef('');

  useEffect(() => {
    let unsub = null;
    let hidup = true;
    (async () => {
      const s = await cariSesiAktif();
      if (!hidup) return;
      if (s && s.materiId === materiId) {
        setSesi(s);
        unsub = pantauSesi(s.id, (sn) => setSesi(sn));
      } else {
        setSesi(null);
      }
    })();
    return () => { hidup = false; if (unsub) unsub(); };
  }, [materiId]);

  const sesiAktif = !!sesi && sesi.status === 'aktif';
  const sesiBabIni = sesiAktif && sesi.babId === babId;
  const ikutAktif = sesiBabIni && sesi.mode === 'mengikuti' && !abaikanIkuti;

  // tandai peserta sekali per sesi (dok kecil, tulis murah)
  useEffect(() => {
    if (sesiBabIni && sesi?.id && pesertaDitandai.current !== sesi.id) {
      pesertaDitandai.current = sesi.id;
      tandaiPeserta(sesi.id).catch(() => {});
    }
  }, [sesiBabIni, sesi]);

  // langganan antrean "coba maju" saya (dok kecil, hanya saat sesi)
  useEffect(() => {
    if (!sesiBabIni || !sesi?.id || !studentId) return undefined;
    return pantauAntreanSaya(sesi.id, studentId, setAntreanSaya);
  }, [sesiBabIni, sesi, studentId]);

  // Tab saat mengikuti sesi DITURUNKAN dari posisi guru (bukan setState).
  const tabAktifNow = ikutAktif
    ? (sesi?.posisi?.jenis === 'kuis' ? 'latihan'
      : sesi?.posisi?.jenis === 'slide' ? 'slide' : 'materi')
    : tab;

  // layar siswa mengikuti posisi guru: scroll halus ke bagian terkait
  useEffect(() => {
    if (!ikutAktif || !sesi?.posisi) return undefined;
    const p = sesi.posisi;
    if (p.jenis !== 'section') return undefined;
    const t = setTimeout(() => {
      const el = document.getElementById(`sec-${p.index}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 90);
    return () => clearTimeout(t);
  }, [ikutAktif, sesi]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { materi: m, babList: bl } = await muatMateriDanBab(materiId);
      setMateri(m);
      setBabList(bl);
      const b = bl.find((x) => x.id === babId) || null;
      setBab(b);
      const pm = await muatProgressSiswa(studentId);
      setProgresMap(pm);
      const p = pm[babId];
      if (p) {
        setSelesaiBaca(!!p.selesaiBab);
        if (p.quizTerbaik != null) setQuizTersimpan(p.quizTerbaik);
      }
      if (m && b) {
        simpanTerakhir({
          materiId: m.id, babId: b.id,
          judul: `${m.judul} — ${b.judul}`,
        });
      }
      setJawaban({});
      setSoalIdx(0);
      setTab('materi');
      kuisTersimpanSesi.current = false;
      setLoading(false);
    })();
  }, [materiId, babId, studentId]);

  const sections = useMemo(() => bab?.sections || [], [bab]);
  const kuis = useMemo(() => bab?.ujiPemahaman || [], [bab]);
  const idxBab = babList.findIndex((b) => b.id === babId);
  const babBerikut = idxBab >= 0 ? babList[idxBab + 1] : null;

  const tampilToast = useCallback((teks) => {
    setToast(teks);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const benarCount = useMemo(() =>
    kuis.reduce((a, s, i) => (jawaban[i] != null && jawaban[i] === s.jawaban ? a + 1 : a), 0),
  [kuis, jawaban]);
  const semuaDijawab = kuis.length > 0 && Object.keys(jawaban).length === kuis.length;

  // Simpan kuis lewat EVENT jawab (bukan effect) -- hemat render
  // & dijamin sekali per sesi berkat ref kuisTersimpanSesi.
  const pilihJawaban = (idxSoal, j) => {
    if (jawaban[idxSoal] != null) return;
    const baru = { ...jawaban, [idxSoal]: j };
    setJawaban(baru);
    if (Object.keys(baru).length !== kuis.length) return;
    if (kuisTersimpanSesi.current) return;
    kuisTersimpanSesi.current = true;
    const benar = kuis.reduce(
      (a, s, ix) => (baru[ix] === s.jawaban ? a + 1 : a), 0);
    const nilai = Math.round((benar / kuis.length) * 100);
    const hasil = { nilai, benar, total: kuis.length, pada: Date.now() };
    const lebihBaik = !quizTersimpan || nilai > quizTersimpan.nilai;
    const simpan = lebihBaik ? hasil : quizTersimpan;
    setQuizTersimpan(simpan);
    const xp = XP_BENAR * benar;
    simpanProgressBab(studentId, materiId, babId, { quizTerbaik: simpan, xp });
    tampilToast(`Kuis selesai — +${xp} XP ✨`);
  };

  const tandaiSelesaiBaca = () => {
    if (selesaiBaca) return;
    setSelesaiBaca(true);
    simpanProgressBab(studentId, materiId, babId, {
      selesaiBab: true,
      selesaiSections: sections.map((_, i) => i),
      xp: XP_BACA + (quizTersimpan ? XP_BENAR * (quizTersimpan.benar || 0) : 0),
    });
    tampilToast(`+${XP_BACA} XP — bagian selesai 🎉`);
  };

  const ulangKuis = () => {
    kuisTersimpanSesi.current = false;
    setSesiKuis((s) => s + 1);
    setJawaban({});
    setSoalIdx(0);
  };

  useEffect(() => () => paksaFlushTulisan(), []);

  if (loading) {
    return <div style={halamanDasar}><div style={S.kosong}>Memuat materi...</div></div>;
  }
  if (!bab || !materi) {
    return (
      <div style={halamanDasar}>
        <div style={S.kosong}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🤔</div>
          Bab tidak ditemukan.
          <div style={{ marginTop: 14 }}>
            <button type="button" style={tombolPill('primer')}
              onClick={() => navigate(`/siswa/belajar/${materiId}`)}>
              <ArrowLeft size={15} /> Ke daftar materi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const persen = persenBab(bab, {
    selesaiBab: selesaiBaca,
    selesaiSections: selesaiBaca ? sections.map((_, i) => i) : [],
    quizTerbaik: quizTersimpan,
  });
  const unitSelesai = (selesaiBaca ? 1 : 0) + (quizTersimpan ? 1 : 0);
  const unitTotal = 2;
  const babPanel = babList.filter((b) =>
    !cari.trim() || String(b.judul || '').toLowerCase().includes(cari.trim().toLowerCase()));

  return (
    <div style={halamanDasar}>
      {/* ================= TOPBAR ================= */}
      <header style={S.topbar}>
        <button type="button" style={S.kembali}
          onClick={() => navigate(`/siswa/belajar/${materiId}`)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={S.cariWrap}>
          <Search size={15} color={T.samar} />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari materi, bab, atau kata kunci..."
            aria-label="Cari bab"
            style={S.cariInput}
          />
        </div>
        <div style={S.topKanan}>
          <button type="button" style={S.ikonBulat} aria-label="Notifikasi">
            <Bell size={16} />
          </button>
          <span style={S.avatar} title={namaSiswa}>{inisial}</span>
        </div>
      </header>

      {/* ============ BANNER SESI PRESENTASI (Fase 3) ============ */}
      {sesiAktif && !sesiBabIni && (
        <div style={S.bannerSesi}>
          <span>
            📡 <b>{sesi.guruNama}</b> sedang menjelaskan bab lain
            di materi ini.
          </span>
          <button type="button" style={S.bannerBtn}
            onClick={() => navigate(`/siswa/belajar/${materiId}/${sesi.babId}`)}>
            Gabung sesi
          </button>
        </div>
      )}
      {sesiBabIni && sesi.mode === 'mengikuti' && (
        <div style={S.bannerSesi}>
          <span>
            📡 {ikutAktif
              ? <>Mengikuti sesi <b>{sesi.guruNama}</b> — layarmu mengikuti layar guru.</>
              : <>Kamu melepas sesi; guru masih menyajikan.</>}
          </span>
          <button type="button" style={S.bannerBtn}
            onClick={() => setAbaikanIkuti((v) => !v)}>
            {ikutAktif ? 'Lepas' : 'Ikuti lagi'}
          </button>
        </div>
      )}
      {sesiBabIni && sesi.mode === 'bebas' && (
        <div style={{ ...S.bannerSesi, background: T.amberLatar, borderColor: T.amberGaris, color: T.amberTeks }}>
          <span>✋ Mode bebas — guru memberi waktu membaca sendiri.</span>
        </div>
      )}

      <div style={S.badan}>
        {/* ================= KOLOM UTAMA ================= */}
        <main style={S.utama}>
          {/* breadcrumb + judul + progress */}
          <div style={S.headRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.chips}>
                <span style={S.chipKategori}>{materi.mapel || '-'}</span>
                <span style={S.chipKategoriOutline}>Kelas {materi.kelas || '-'}</span>
              </div>
              <h1 style={S.judulBesar}>{bab.judul}</h1>
              <div style={S.metaBab}>
                Bab {idxBab + 1} • {materi.judul}
              </div>
            </div>
            <div style={S.progresKanan}>
              <div style={S.progresLabelKecil}>
                <b>Progress Materi</b>
                <span>{unitSelesai} / {unitTotal} bagian</span>
              </div>
              <div style={{ ...barLuar(7), width: 190, maxWidth: '100%' }}>
                <div style={barDalam(persen)} />
              </div>
            </div>
          </div>

          {/* tabs */}
          <div style={S.tabRow} role="tablist">
            {[
              { id: 'materi', label: 'Materi', ikon: <BookOpen size={14} /> },
              { id: 'ringkasan', label: 'Ringkasan', ikon: <FileText size={14} /> },
              { id: 'video', label: 'Video', ikon: <PlayCircle size={14} /> },
              {
                id: 'slide', label: 'Slide', ikon: <Presentation size={14} />,
                hide: !bab.slideUrl,
              },
              { id: 'latihan', label: 'Latihan Soal', ikon: <CheckCircle2 size={14} /> },
              { id: 'diskusi', label: 'Diskusi', ikon: <MessageCircle size={14} />, soon: true },
            ].filter((t) => !t.hide).map((t) => (
              <button key={t.id} type="button" role="tab"
                aria-selected={tabAktifNow === t.id}
                disabled={t.soon}
                onClick={() => setTab(t.id)}
                style={{
                  ...S.tab,
                  ...(tabAktifNow === t.id ? S.tabAktif : null),
                  ...(t.soon ? S.tabSoon : null),
                }}>
                {t.ikon} {t.label}
                {t.soon && <span style={S.soonBadge}>Segera</span>}
              </button>
            ))}
          </div>

          {/* ---------- TAB MATERI ---------- */}
          {tabAktifNow === 'materi' && (
            <div style={{ ...kartuDasar, ...S.kartuKonten }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}>{idxBab + 1}</span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  {bab.judul}
                </span>
                <span style={S.emojiSeksi}>{materi.emoji || '📘'}</span>
              </div>
              {bab.ringkasan && <p style={S.ringkasan}>{bab.ringkasan}</p>}
              <IsiSections sections={sections} />
              <button type="button"
                onClick={tandaiSelesaiBaca}
                style={selesaiBaca ? tombolPill('hijau') : tombolPill('primer')}>
                {selesaiBaca
                  ? <><CheckCircle2 size={16} /> Bagian selesai dibaca</>
                  : <><CheckCircle2 size={16} /> Sudah kupahami — tandai selesai</>}
              </button>
            </div>
          )}

          {/* ---------- TAB RINGKASAN ---------- */}
          {tabAktifNow === 'ringkasan' && (
            <div style={{ ...kartuDasar, ...S.kartuKonten }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><FileText size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Ringkasan {bab.judul}
                </span>
              </div>
              <p style={S.paragraf}>
                {bab.ringkasan || 'Ringkasan belum tersedia untuk bagian ini.'}
              </p>
              {sections.filter((s) => s.jenis === 'langkah' || s.jenis === 'callout')
                .map((s, i) => (
                  <div key={i} style={s.jenis === 'callout' && String(s.tipe) === 'tips'
                    ? kotakTips : kotakSukses}>
                    <Lightbulb size={14} />
                    <span>
                      {s.judul ? <b>{s.judul}: </b> : null}
                      {s.teks || (s.items || []).join(' • ')}
                    </span>
                  </div>
                ))}
              <div style={S.kutipanKecil}>
                <Star size={13} fill="currentColor" />
                “Ilmu hari ini, masa depan nanti.” — Bimbel Gemilang
              </div>
            </div>
          )}

          {/* ---------- TAB VIDEO ---------- */}
          {tabAktifNow === 'video' && (
            <div style={{ ...kartuDasar, ...S.kartuKonten }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><PlayCircle size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Video Pembelajaran
                </span>
              </div>
              {bab.videoUrl ? (
                <div style={S.videoWrap}>
                  <video src={bab.videoUrl} controls style={S.videoEl} />
                </div>
              ) : (
                <div style={S.videoKosong}>
                  <PlayCircle size={30} />
                  <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.6 }}>
                    Video untuk bagian ini belum diunggah.
                    Guru/admin dapat menambahkan video lewat Manajer Materi
                    (disimpan di Supabase agar hemat kuota).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ---------- TAB SLIDE PPT ---------- */}
          {tabAktifNow === 'slide' && bab.slideUrl && (
            <div style={{ ...kartuDasar, ...S.kartuKonten }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><Presentation size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Slide Materi (PPT)
                </span>
                <a href={bab.slideUrl} target="_blank" rel="noreferrer"
                  style={S.unduhLink}>
                  Unduh PPT
                </a>
              </div>
              <iframe
                title="Slide materi"
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(bab.slideUrl)}`}
                style={S.slideFrame}
              />
              <p style={S.catatanKecil}>
                Perlu internet. Bila slide tidak tampil, unduh lalu buka
                di PowerPoint / Google Slides.
              </p>
            </div>
          )}

          {/* ---------- TAB LATIHAN SOAL ---------- */}
          {tabAktifNow === 'latihan' && (
            <div style={{ ...kartuDasar, ...S.kartuKonten }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><CheckCircle2 size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Latihan Soal • {kuis.length} soal
                </span>
                {quizTersimpan && (
                  <span style={S.nilaiChip}>Nilai terbaik: {quizTersimpan.nilai}</span>
                )}
              </div>
              {kuis.length === 0 ? (
                <div style={S.videoKosong}>
                  <FileText size={26} />
                  <p style={{ margin: '10px 0 0', fontSize: 13 }}>
                    Belum ada soal pemantapan untuk bagian ini.
                  </p>
                </div>
              ) : ikutAktif && sesi.posisi?.jenis === 'kuis'
                && kuis[Number(sesi.posisi.index)] ? (
                <LiveKuis
                  key={Number(sesi.posisi.index)}
                  sessionId={sesi.id}
                  soal={kuis[Number(sesi.posisi.index)]}
                  idx={Number(sesi.posisi.index)}
                  total={kuis.length}
                />
              ) : (
                <PanelKuis
                  key={`${babId}-${sesiKuis}`}
                  kuis={kuis}
                  jawaban={jawaban}
                  pilih={pilihJawaban}
                  soalIdx={soalIdx}
                  setSoalIdx={setSoalIdx}
                  benarCount={benarCount}
                  semuaDijawab={semuaDijawab}
                  ulangKuis={ulangKuis}
                />
              )}
            </div>
          )}

          {/* nav bab bawah */}
          <nav style={S.navBab}>
            {idxBab > 0 && (
              <button type="button" style={tombolPill('putih')}
                onClick={() => navigate(`/siswa/belajar/${materiId}/${babList[idxBab - 1].id}`)}>
                <ChevronLeft size={15} /> {babList[idxBab - 1].judul}
              </button>
            )}
            <span style={{ flex: 1 }} />
            {babBerikut ? (
              <button type="button" style={tombolPill('primer')}
                onClick={() => navigate(`/siswa/belajar/${materiId}/${babBerikut.id}`)}>
                {babBerikut.judul} <ChevronRight size={15} />
              </button>
            ) : selesaiBaca ? (
              <button type="button" style={tombolPill('primer')}
                onClick={() => navigate(`/siswa/belajar/${materiId}`)}>
                Selesai — ke daftar materi <ChevronRight size={15} />
              </button>
            ) : null}
          </nav>
        </main>

        {/* ================= PANEL KANAN (desktop) ================= */}
        {tampilPanel && (
          <aside style={S.panel}>
            <div style={{ ...kartuDasar, padding: 16 }}>
              <div style={S.panelJudul}>
                <BookOpen size={15} /> Daftar Materi
              </div>
              <div style={S.panelSub}>{babList.length} bagian</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {babPanel.map((b) => {
                  const p = persenBab(b, progresMap[b.id]);
                  const selesai = p === 100;
                  const asli = babList.indexOf(b);
                  const aktifNow = b.id === babId;
                  return (
                    <button key={b.id} type="button"
                      onClick={() => navigate(`/siswa/belajar/${materiId}/${b.id}`)}
                      style={{
                        ...S.panelItem,
                        ...(aktifNow ? S.panelItemAktif : null),
                      }}>
                      <span style={lingkaranNomor(aktifNow ? 'aktif' : selesai ? 'selesai' : 'biasa')}>
                        {asli + 1}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <span style={S.panelItemJudul}>{b.judul}</span>
                        <span style={S.panelItemMeta}>
                          {selesai ? 'Selesai dibaca' : p > 0 ? `${p}% selesai` : 'Belum dibaca'}
                        </span>
                      </span>
                      {selesai && <CheckCircle2 size={16} color={T.hijau} />}
                      <ChevronRight size={14} color={T.samar} />
                    </button>
                  );
                })}
                {babPanel.length === 0 && (
                  <div style={S.panelKosong}>Tidak ada bab yang cocok.</div>
                )}
              </div>
            </div>

            {/* kartu kutipan khas mockup */}
            <div style={S.kartuKutip}>
              <div style={{ fontStyle: 'italic', fontWeight: 700, fontSize: 13, lineHeight: 1.6 }}>
                “Ilmu hari ini,
                <br />masa depan nanti.”
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, opacity: .8 }}>
                — Bimbel Gemilang
              </div>
              <Star size={14} fill="currentColor" style={{ marginTop: 6 }} />
            </div>
          </aside>
        )}
      </div>

      {/* ===== widget antrean "coba maju" (sesi live) ===== */}
      {sesiBabIni && (
        <div style={S.queueWrap}>
          {(!antreanSaya || antreanSaya.status === 'selesai') && (
            <button type="button" style={S.queueBtn}
              onClick={() => antreMaju(sesi.id).catch(() => {})}>
              🙋 Coba Maju
            </button>
          )}
          {antreanSaya?.status === 'menunggu' && (
            <div style={S.queueChip}>
              ⏳ Menunggu giliran…
              <button type="button" style={S.queueBatal}
                onClick={() => batalAntre(sesi.id).catch(() => {})}>
                Batal
              </button>
            </div>
          )}
          {antreanSaya?.status === 'dipanggil' && (
            <div style={{ ...S.queueChip, ...S.queueDipanggil }}>
              🎉 Namamu dipanggil — maju ya!
            </div>
          )}
          {antreanSaya?.status === 'diberi' && (
            <div style={{ ...S.queueChip, ...S.queueDiberi }}>
              ⭐ +{antreanSaya.xpDiberi || 0} XP dari tentor!
            </div>
          )}
        </div>
      )}

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ---------------- panel kuis (satu soal per layar) ----------------
function PanelKuis({
  kuis, jawaban, pilih, soalIdx, setSoalIdx,
  benarCount, semuaDijawab, ulangKuis,
}) {
  const [lihatHasil, setLihatHasil] = useState(false);
  const soal = kuis[soalIdx];
  const dipilih = jawaban[soalIdx];
  const terkoreksi = dipilih != null;
  const benar = terkoreksi && dipilih === soal.jawaban;

  if (semuaDijawab && lihatHasil) {
    const nilai = Math.round((benarCount / kuis.length) * 100);
    return (
      <div style={S.hasilKuis}>
        <div style={S.hasilLingkaran}>{nilai}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.judul }}>
            {nilai >= 80 ? 'Luar biasa! 🏆' : nilai >= 60 ? 'Bagus, terus berlatih! ✨' : 'Semangat, coba lagi ya 💪'}
          </div>
          <div style={{ fontSize: 12.5, color: T.samar, marginTop: 3 }}>
            {benarCount} dari {kuis.length} soal benar.
          </div>
          <button type="button" style={{ ...tombolPill('putih'), marginTop: 10 }} onClick={ulangKuis}>
            <RotateCcw size={14} /> Ulangi latihan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={S.chipRow}>
        <span style={chip(true)}>Semua</span>
        <span style={chip(false)}>Pilihan Ganda</span>
        <span style={{ ...chip(false), opacity: .5 }}>Esai</span>
      </div>

      <div style={S.soalNomor}>Soal {soalIdx + 1} dari {kuis.length}</div>
      <div style={S.soalTeks}><MathText text={soal.soal} /></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(soal.opsi || []).map((op, j) => {
          let gaya = S.opsi;
          if (terkoreksi && j === soal.jawaban) gaya = { ...S.opsi, ...S.opsiBenar };
          else if (terkoreksi && dipilih === j) gaya = { ...S.opsi, ...S.opsiSalah };
          return (
            <button key={j} type="button" style={gaya} disabled={terkoreksi}
              onClick={() => pilih(soalIdx, j)}>
              <span style={{
                ...S.opsiBulat,
                ...(terkoreksi && j === soal.jawaban ? S.opsiBulatBenar : null),
                ...(terkoreksi && dipilih === j && !benar ? S.opsiBulatSalah : null),
              }}>
                {terkoreksi && j === soal.jawaban
                  ? <CheckCircle2 size={13} />
                  : terkoreksi && dipilih === j ? <XCircle size={13} /> : null}
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}><MathText text={op} /></span>
              <span style={S.opsiHuruf}>{String.fromCharCode(65 + j)}.</span>
            </button>
          );
        })}
      </div>

      {terkoreksi && (
        benar ? (
          <div style={kotakSukses}>
            <CheckCircle2 size={15} />
            <span>
              <b>Jawaban benar!</b>
              {soal.pembahasan ? <><br />{soal.pembahasan}</> : null}
            </span>
          </div>
        ) : (
          <div style={{ ...kotakTips, background: T.merahLatar, borderColor: T.merahGaris, color: '#B91C1C' }}>
            <XCircle size={15} />
            <span>
              <b>Belum tepat.</b> Jawaban yang benar: {String.fromCharCode(65 + soal.jawaban)}.
              {soal.pembahasan ? <><br />{soal.pembahasan}</> : null}
            </span>
          </div>
        )
      )}

      <div style={S.kuisNav}>
        <button type="button" style={S.panahBulat} disabled={soalIdx === 0}
          onClick={() => setSoalIdx((i) => Math.max(0, i - 1))}
          aria-label="Soal sebelumnya">
          <ChevronLeft size={16} />
        </button>
        <span style={S.kuisPosisi}>{soalIdx + 1} / {kuis.length}</span>
        {soalIdx < kuis.length - 1 ? (
          terkoreksi ? (
            <button type="button" style={tombolPill('primer')}
              onClick={() => setSoalIdx((i) => Math.min(kuis.length - 1, i + 1))}>
              Lanjut soal <ChevronRight size={14} />
            </button>
          ) : (
            <button type="button" style={S.panahBulat}
              onClick={() => setSoalIdx((i) => Math.min(kuis.length - 1, i + 1))}
              aria-label="Soal berikutnya">
              <ChevronRight size={16} />
            </button>
          )
        ) : terkoreksi ? (
          <button type="button" style={tombolPill('primer')}
            onClick={() => setLihatHasil(true)}>
            Lihat hasil <ChevronRight size={14} />
          </button>
        ) : (
          <span style={{ width: 36 }} />
        )}
      </div>
    </>
  );
}

// ---------------- kuis live bersama guru (Fase 3) ----------------
function LiveKuis({ sessionId, soal, idx, total }) {
  const [pilihan, setPilihan] = useState(null);
  const [terkirim, setTerkirim] = useState(false);
  const kirim = (j) => {
    if (terkirim) return;
    setPilihan(j);
    setTerkirim(true);
    kirimJawabanLive(sessionId, idx, j).catch(() => setTerkirim(false));
  };
  return (
    <>
      <div style={S.liveHead}>
        📡 Latihan bersama • soal {idx + 1} / {total}
      </div>
      <div style={S.soalTeks}><MathText text={soal.soal} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(soal.opsi || []).map((op, j) => (
          <button key={j} type="button"
            style={{
              ...S.opsi,
              ...(pilihan === j ? S.opsiDipilihLive : null),
            }}
            disabled={terkirim}
            onClick={() => kirim(j)}>
            <span style={S.opsiHuruf}>{String.fromCharCode(65 + j)}.</span>
            <span style={{ flex: 1, textAlign: 'left' }}><MathText text={op} /></span>
          </button>
        ))}
      </div>
      <div style={{ ...S.kotakInfoLive, ...(terkirim ? null : { opacity: .75 }) }}>
        {terkirim
          ? '✅ Jawabanmu terkirim ke guru — pembahasan muncul setelah sesi.'
          : 'Pilih jawabanmu; hasilnya langsung terlihat di layar guru.'}
      </div>
    </>
  );
}

// ---------------- gaya (tema Gemilang Biru) ----------------
const S = {
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '40px 20px', fontSize: 13, lineHeight: 1.7, margin: '60px 16px',
  },
  topbar: {
    position: 'sticky', top: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '10px 18px', background: 'rgba(255,255,255,.9)',
    backdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.garis}`,
  },
  kembali: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', color: T.biruGelap,
    fontWeight: 800, fontSize: 12.5, cursor: 'pointer', flexShrink: 0,
    fontFamily: 'inherit',
  },
  cariWrap: {
    flex: 1, maxWidth: 560, margin: '0 auto',
    display: 'flex', alignItems: 'center', gap: 8,
    background: T.latar, border: `1px solid ${T.garis}`,
    borderRadius: 999, padding: '9px 15px',
  },
  cariInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
    fontSize: 12.5, color: T.teks, fontFamily: 'inherit',
  },
  topKanan: { display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 },
  ikonBulat: {
    width: 34, height: 34, borderRadius: '50%', background: '#fff',
    border: `1px solid ${T.garis}`, color: T.samar, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: T.gradasiHero,
    color: '#fff', fontWeight: 800, fontSize: 11.5, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  badan: {
    display: 'flex', gap: 18, alignItems: 'flex-start',
    maxWidth: 1280, margin: '0 auto', padding: '18px 18px 44px',
  },
  utama: { flex: 1, minWidth: 0 },
  headRow: {
    display: 'flex', gap: 16, alignItems: 'flex-start',
    flexWrap: 'wrap', marginBottom: 14,
  },
  chips: { display: 'flex', gap: 6, marginBottom: 7 },
  chipKategori: {
    background: T.biru, color: '#fff', borderRadius: 8,
    padding: '4px 12px', fontSize: 10.5, fontWeight: 800,
  },
  chipKategoriOutline: {
    background: '#fff', color: T.samar, border: `1px solid ${T.garis}`,
    borderRadius: 8, padding: '4px 12px', fontSize: 10.5, fontWeight: 800,
  },
  judulBesar: { margin: 0, fontSize: 26, fontWeight: 800, color: T.judul, lineHeight: 1.25 },
  metaBab: { marginTop: 4, fontSize: 11.5, color: T.samar, fontWeight: 600 },
  progresKanan: { marginLeft: 'auto', textAlign: 'right' },
  progresLabelKecil: {
    display: 'flex', gap: 10, justifyContent: 'flex-end',
    fontSize: 11, color: T.samar, marginBottom: 6,
  },
  tabRow: {
    display: 'flex', gap: 4, background: '#fff',
    border: `1px solid ${T.garis}`, borderRadius: 13,
    padding: 5, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
    border: 'none', background: 'transparent', color: T.samar,
    borderRadius: 9, padding: '9px 16px', fontSize: 12.5, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  tabAktif: {
    background: T.biru, color: '#fff',
    boxShadow: '0 4px 12px rgba(30,155,240,.3)',
  },
  tabSoon: { opacity: .55, cursor: 'not-allowed' },
  soonBadge: {
    background: 'rgba(255,255,255,.25)', borderRadius: 999,
    padding: '1px 7px', fontSize: 9, fontWeight: 800,
  },
  kartuKonten: { padding: 22 },
  headSeksi: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  emojiSeksi: { fontSize: 26 },
  ringkasan: {
    margin: '0 0 16px', color: T.teks, fontSize: 13.5,
    lineHeight: 1.7, fontStyle: 'italic',
  },
  subJudul: {
    display: 'flex', alignItems: 'baseline', gap: 7,
    margin: '22px 0 8px', fontSize: 15.5, fontWeight: 800, color: T.judul,
  },
  subHuruf: { color: T.biru, fontStyle: 'italic' },
  paragraf: { margin: '0 0 13px', fontSize: 14, lineHeight: 1.85, color: T.teks },
  contohBox: {
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 12, padding: '13px 15px', margin: '0 0 15px',
  },
  contohJudul: {
    display: 'flex', alignItems: 'center', gap: 6, color: T.biruGelap,
    fontWeight: 800, fontSize: 12.5, marginBottom: 7,
  },
  gambar: { width: '100%', borderRadius: 12, display: 'block' },
  gambarKosong: {
    display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
    background: T.latar, border: `1px dashed ${T.garis}`, borderRadius: 12,
    color: T.samar, padding: 26, fontSize: 12.5,
  },
  gambarKet: { textAlign: 'center', color: T.samar, fontSize: 11.5, marginTop: 6 },
  langkahItem: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    fontSize: 13.5, lineHeight: 1.65, color: T.teks,
  },
  langkahNomor: {
    width: 24, height: 24, borderRadius: '50%', background: T.biru,
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0,
  },
  kutipanKecil: {
    display: 'flex', gap: 7, alignItems: 'center', color: T.biruGelap,
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 10, padding: '9px 12px', fontSize: 12,
    fontStyle: 'italic', fontWeight: 700, marginTop: 6,
  },
  videoWrap: { borderRadius: 14, overflow: 'hidden', background: '#0B2440' },
  videoEl: { width: '100%', display: 'block', aspectRatio: '16/9' },
  videoKosong: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', color: T.samar,
    background: T.latar, border: `1px dashed ${T.garis}`,
    borderRadius: 14, padding: '34px 22px',
  },
  nilaiChip: {
    background: T.hijauLatar, color: T.hijauTeks, border: `1px solid ${T.hijauGaris}`,
    borderRadius: 999, padding: '4px 11px', fontSize: 10.5, fontWeight: 800,
  },
  chipRow: { display: 'flex', gap: 7, marginBottom: 14 },
  soalNomor: { fontSize: 11, fontWeight: 800, color: T.samar, marginBottom: 6 },
  soalTeks: { fontSize: 14.5, lineHeight: 1.75, color: T.judul, fontWeight: 600, marginBottom: 13 },
  opsi: {
    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
    background: '#fff', border: `1.5px solid ${T.garis}`, borderRadius: 12,
    padding: '11px 13px', fontSize: 13, color: T.teks, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all .15s ease',
  },
  opsiBenar: { borderColor: T.hijau, background: T.hijauLatar },
  opsiSalah: { borderColor: T.merah, background: T.merahLatar },
  opsiBulat: {
    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${T.garis}`, background: '#fff', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  opsiBulatBenar: { background: T.hijau, borderColor: T.hijau },
  opsiBulatSalah: { background: T.merah, borderColor: T.merah },
  opsiHuruf: { color: T.samar, fontWeight: 800, fontSize: 11.5, flexShrink: 0 },
  kuisNav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, gap: 10,
  },
  panahBulat: {
    width: 36, height: 36, borderRadius: '50%', background: '#fff',
    border: `1px solid ${T.garis}`, color: T.biruGelap, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  kuisPosisi: { fontSize: 12, fontWeight: 800, color: T.samar },
  hasilKuis: { display: 'flex', gap: 16, alignItems: 'center', padding: '6px 0' },
  hasilLingkaran: {
    width: 64, height: 64, borderRadius: '50%', background: T.gradasiHero,
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 19, flexShrink: 0,
    boxShadow: '0 8px 20px rgba(30,155,240,.35)',
  },
  navBab: { display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' },
  panel: { width: 320, flexShrink: 0, position: 'sticky', top: 70 },
  panelJudul: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontWeight: 800, fontSize: 14.5, color: T.judul,
  },
  panelSub: { fontSize: 11, color: T.samar, marginTop: 2 },
  panelItem: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    background: T.latar, border: `1px solid ${T.garisLembut}`,
    borderRadius: 12, padding: '10px 11px', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  panelItemAktif: { background: '#fff', border: `1.5px solid ${T.biru}` },
  panelItemJudul: {
    display: 'block', fontWeight: 700, fontSize: 12.5, color: T.judul, lineHeight: 1.35,
  },
  panelItemMeta: { display: 'block', fontSize: 10.5, color: T.samar, marginTop: 2 },
  panelKosong: { color: T.samar, fontSize: 12, textAlign: 'center', padding: 10 },
  kartuKutip: {
    marginTop: 14, borderRadius: T.radius, padding: 16,
    background: T.gradasiHero, color: '#fff', textAlign: 'center',
    boxShadow: '0 8px 22px rgba(14,122,212,.3)',
  },
  toast: {
    position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)',
    background: '#0B2440', color: '#fff', borderRadius: 999,
    padding: '10px 18px', fontSize: 12.5, fontWeight: 700, zIndex: 60,
    boxShadow: '0 8px 24px rgba(11,36,64,.35)', whiteSpace: 'nowrap',
  },
  bannerSesi: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    color: T.biruDalam, padding: '9px 16px', fontSize: 12.5, fontWeight: 600,
    borderBottom: 'none',
  },
  bannerBtn: {
    marginLeft: 'auto', background: T.biru, color: '#fff', border: 'none',
    borderRadius: 9, padding: '6px 13px', fontSize: 11.5, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  liveHead: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    color: T.biruDalam, borderRadius: 999, padding: '6px 13px',
    fontSize: 11.5, fontWeight: 800, marginBottom: 12,
  },
  opsiDipilihLive: { borderColor: T.biru, background: T.kotakBiru },
  unduhLink: {
    color: T.biruGelap, fontSize: 11.5, fontWeight: 800,
    textDecoration: 'none', border: `1px solid ${T.kotakBiruGaris}`,
    background: T.kotakBiru, borderRadius: 9, padding: '5px 10px',
  },
  slideFrame: {
    width: '100%', height: '62vh', border: `1px solid ${T.garis}`,
    borderRadius: 12, background: '#fff',
  },
  catatanKecil: { color: T.samar, fontSize: 11, marginTop: 8 },
  queueWrap: {
    position: 'fixed', right: 16, bottom: 18, zIndex: 55,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
  },
  queueBtn: {
    background: T.biru, color: '#fff', border: 'none', borderRadius: 999,
    padding: '12px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
    fontFamily: 'inherit', boxShadow: '0 8px 22px rgba(30,155,240,.4)',
  },
  queueChip: {
    display: 'flex', alignItems: 'center', gap: 9,
    background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 999,
    padding: '10px 16px', fontSize: 12, fontWeight: 800, color: T.teks,
    boxShadow: '0 6px 18px rgba(16,84,148,.14)',
  },
  queueBatal: {
    background: T.latar, border: `1px solid ${T.garis}`, color: T.samar,
    borderRadius: 999, padding: '3px 10px', fontSize: 10.5,
    fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  },
  queueDipanggil: {
    background: T.hijauLatar, borderColor: T.hijauGaris, color: T.hijauTeks,
  },
  queueDiberi: {
    background: T.amberLatar, borderColor: T.amberGaris, color: T.amberTeks,
  },
  kotakInfoLive: {
    marginTop: 12, background: T.hijauLatar, border: `1px solid ${T.hijauGaris}`,
    color: T.hijauTeks, borderRadius: 10, padding: '9px 12px',
    fontSize: 12, fontWeight: 700,
  },
};
