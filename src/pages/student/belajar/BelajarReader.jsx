// src/pages/student/belajar/BelajarReader.jsx
// ============================================================
// MATERI v2 -- READER SISWA (route /siswa/belajar/:materiId/:babId)
// Fase 1-2 rombak tampilan materi (docs/RENCANA-ROMBAK-MATERI.md).
//
// ⚠️ Gaya visual PLACEHOLDER -- identitas final mengikuti FOTO
// DESAIN owner. Yang sudah final: struktur data, alur baca,
// kuis pemantapan, penyimpanan progress + XP.
//
// Catatan integrasi mendatang (JANGAN dihapus):
//  - Fase 3: banner "guru sedang menjelaskan" via listener
//    `sesi_presentasi` (materiId+babId, status aktif) di sini.
//  - PDF/HTML: tipe bab 'pdf'/'html' masih placeholder; renderer
//    lama ada di components/buku/ bila ingin dipakai ulang.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ChevronRight, Lightbulb, TriangleAlert,
  Info, Image as IconGambar, RotateCcw, Sparkles, BookOpen, FileText,
} from 'lucide-react';
import { MathText, MathBlock } from '../../../components/MathText';
import {
  muatMateriDanBab, muatProgressSiswa, simpanProgressBab,
  simpanTerakhir, persenBab, paksaFlushTulisan,
} from '../../../services/materiV2Service';

const XP_BACA = 5;   // konsisten dgn konstanta reader lama
const XP_BENAR = 10;

export default function BelajarReader() {
  const { materiId, babId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '';

  const [materi, setMateri] = useState(null);
  const [babList, setBabList] = useState([]);
  const [bab, setBab] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selesaiBaca, setSelesaiBaca] = useState(false);
  const [jawaban, setJawaban] = useState({});   // { [iSoal]: idxOpsi }
  const [quizSelesai, setQuizSelesai] = useState(false);
  const [quizTerbaik, setQuizTerbaik] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { materi: m, babList: bl } = await muatMateriDanBab(materiId);
      setMateri(m);
      setBabList(bl);
      const b = bl.find((x) => x.id === babId) || null;
      setBab(b);
      const progMap = await muatProgressSiswa(studentId);
      const p = progMap[babId];
      if (p) {
        setSelesaiBaca(!!p.selesaiBab);
        if (p.quizTerbaik != null) {
          setQuizTerbaik(p.quizTerbaik);
          setQuizSelesai(true);
        }
      }
      if (m && b) {
        simpanTerakhir({
          materiId: m.id, babId: b.id,
          judul: `${m.judul} — ${b.judul}`,
        });
      }
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
    kuis.reduce((a, s, i) => (jawaban[i] === s.jawaban ? a + 1 : a), 0),
  [kuis, jawaban]);

  const tandaiSelesaiBaca = () => {
    if (selesaiBaca) return;
    setSelesaiBaca(true);
    simpanProgressBab(studentId, materiId, babId, {
      selesaiBab: true,
      selesaiSections: sections.map((_, i) => i),
      xp: (quizTerbaik ? XP_BENAR * quizTerbaik.benar : 0) + XP_BACA,
    });
    tampilToast(`+${XP_BACA} XP — bacaan selesai 🎉`);
  };

  const kumpulKuis = () => {
    if (quizSelesai) return;
    const benar = benarCount;
    const hasil = { nilai: Math.round((benar / kuis.length) * 100), benar, total: kuis.length, pada: Date.now() };
    const lebihBaik = !quizTerbaik || hasil.nilai > quizTerbaik.nilai;
    setQuizSelesai(true);
    setQuizTerbaik(lebihBaik ? hasil : quizTerbaik);
    const xp = XP_BENAR * benar + (selesaiBaca ? 0 : XP_BACA);
    simpanProgressBab(studentId, materiId, babId, {
      quizTerbaik: lebihBaik ? hasil : quizTerbaik,
      ...(selesaiBaca ? {} : { selesaiBab: true, selesaiSections: sections.map((_, i) => i) }),
      xp,
    });
    if (!selesaiBaca) setSelesaiBaca(true);
    tampilToast(`Kuis terkumpul — +${xp} XP ✨`);
  };

  const ulangKuis = () => {
    setJawaban({});
    setQuizSelesai(false);
  };

  // flush progress yg masih menunggu debounce saat pindah halaman
  useEffect(() => () => paksaFlushTulisan(), []);

  if (loading) {
    return <div style={S.page}><div style={S.kosong}>Memuat materi...</div></div>;
  }
  if (!bab || !materi) {
    return (
      <div style={S.page}>
        <div style={S.kosong}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🤔</div>
          Bab tidak ditemukan.
          <div style={{ marginTop: 14 }}>
            <button type="button" style={S.btnUtama}
              onClick={() => navigate(`/siswa/belajar/${materiId}`)}>
              <ArrowLeft size={15} /> Ke daftar isi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const persen = persenBab(bab, {
    selesaiBab: selesaiBaca,
    selesaiSections: selesaiBaca ? sections.map((_, i) => i) : [],
    quizTerbaik: quizSelesai ? quizTerbaik : null,
  });

  return (
    <div style={S.page}>
      {/* Bar atas lengket */}
      <header style={S.topbar}>
        <button type="button" style={S.backBtn} aria-label="Kembali"
          onClick={() => navigate(`/siswa/belajar/${materiId}`)}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.topJudul}>{bab.judul}</div>
          <div style={S.topMeta}>
            <BookOpen size={11} /> {materi.judul}
          </div>
        </div>
        <div style={S.persenChip} aria-label={`Progres ${persen} persen`}>{persen}%</div>
      </header>
      <div style={S.barLatarTop}><div style={{ ...S.barIsiTop, width: `${persen}%` }} /></div>

      <main style={S.isi}>
        {/* ---- KONTEN BAB ---- */}
        {String(bab.tipe || 'teks') !== 'teks' && (
          <div style={S.placeholderTipe}>
            <FileText size={22} />
            <p>
              Bab bertipe <b>{bab.tipe}</b> akan memakai renderer khusus
              (PDF/HTML/video) pada Fase 2. Untuk sekarang, materi baru
              disarankan bertipe <b>teks terstruktur</b>.
            </p>
          </div>
        )}

        {bab.ringkasan && <p style={S.ringkasan}>{bab.ringkasan}</p>}

        {sections.map((sec, i) => (
          <SectionView key={i} sec={sec} warna={materi.warna || '#4C6EF5'} />
        ))}

        {/* ---- TOMBOL SELESAI BACA ---- */}
        <button type="button"
          onClick={tandaiSelesaiBaca}
          style={selesaiBaca ? { ...S.btnSelesai, ...S.btnSelesaiDone } : S.btnSelesai}>
          {selesaiBaca
            ? <><CheckCircle2 size={17} /> Bacaan selesai ditandai</>
            : <><CheckCircle2 size={17} /> Sudah kupahami — tandai selesai</>}
        </button>

        {/* ---- KUIS PEMANTAPAN ---- */}
        {kuis.length > 0 && (
          <section style={S.kuisBox}>
            <div style={S.kuisHead}>
              <Sparkles size={16} color="#B45309" />
              <span>Uji Pemahaman • {kuis.length} soal</span>
            </div>
            {kuis.map((s, i) => {
              const dipilih = jawaban[i];
              const dikoreksi = quizSelesai || dipilih != null;
              return (
                <div key={i} style={S.soal}>
                  <div style={S.soalTeks}>
                    <b style={{ color: '#94a3b8' }}>{i + 1}.</b>{' '}
                    <MathText text={s.soal} />
                  </div>
                  <div style={S.opsiList}>
                    {(s.opsi || []).map((op, j) => {
                      let gaya = S.opsi;
                      if (dikoreksi && j === s.jawaban) gaya = { ...S.opsi, ...S.opsiBenar };
                      else if (dikoreksi && dipilih === j) gaya = { ...S.opsi, ...S.opsiSalah };
                      else if (dipilih === j) gaya = { ...S.opsi, ...S.opsiDipilih };
                      return (
                        <button key={j} type="button" style={gaya}
                          disabled={quizSelesai}
                          onClick={() => setJawaban((a) => ({ ...a, [i]: j }))}>
                          <span style={S.opsiHuruf}>{String.fromCharCode(65 + j)}</span>
                          <span style={{ flex: 1, textAlign: 'left' }}><MathText text={op} /></span>
                          {dikoreksi && j === s.jawaban && <CheckCircle2 size={15} color="#16A34A" />}
                        </button>
                      );
                    })}
                  </div>
                  {(quizSelesai || (dipilih != null && dipilih !== s.jawaban)) && s.pembahasan && (
                    <div style={S.bahas}>
                      <Lightbulb size={13} color="#B45309" /> {s.pembahasan}
                    </div>
                  )}
                </div>
              );
            })}
            {!quizSelesai ? (
              <button type="button" style={S.btnUtama}
                disabled={Object.keys(jawaban).length < kuis.length}
                onClick={kumpulKuis}>
                Kumpulkan jawaban
                {Object.keys(jawaban).length < kuis.length &&
                  ` (${Object.keys(jawaban).length}/${kuis.length})`}
              </button>
            ) : (
              <div style={S.hasilBox}>
                <div style={S.hasilNilai}>
                  {quizTerbaik?.nilai ?? Math.round((benarCount / kuis.length) * 100)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={S.hasilJudul}>
                    {benarCount === kuis.length ? 'Sempurna! 🏆' : 'Kuis selesai ✨'}
                  </div>
                  <div style={S.hasilMeta}>
                    {benarCount}/{kuis.length} benar
                    {quizTerbaik ? ` • nilai terbaik ${quizTerbaik.nilai}` : ''}
                  </div>
                  <button type="button" style={S.btnUlang} onClick={ulangKuis}>
                    <RotateCcw size={13} /> Coba lagi
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ---- NAVIGASI BAB ---- */}
        <nav style={S.navBab}>
          {idxBab > 0 && (
            <button type="button" style={S.btnNav}
              onClick={() => navigate(`/siswa/belajar/${materiId}/${babList[idxBab - 1].id}`)}>
              ← {babList[idxBab - 1].judul}
            </button>
          )}
          {babBerikut && (
            <button type="button" style={{ ...S.btnNav, ...S.btnNavNext }}
              onClick={() => navigate(`/siswa/belajar/${materiId}/${babBerikut.id}`)}>
              {babBerikut.judul} <ChevronRight size={15} />
            </button>
          )}
          {!babBerikut && selesaiBaca && (
            <button type="button" style={{ ...S.btnNav, ...S.btnNavNext }}
              onClick={() => navigate(`/siswa/belajar/${materiId}`)}>
              Materi selesai — kembali ke daftar isi <ChevronRight size={15} />
            </button>
          )}
        </nav>
      </main>

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ---------------- renderer per jenis section ----------------
function SectionView({ sec, warna }) {
  const jenis = String(sec?.jenis || 'paragraf');
  if (jenis === 'judul') return <h2 style={S.judulSeksi}><MathText text={sec.teks} /></h2>;
  if (jenis === 'paragraf') return <p style={S.paragraf}><MathText text={sec.teks} /></p>;
  if (jenis === 'rumus') {
    return (
      <div style={S.rumusBox}>
        <MathBlock text={sec.latex || sec.teks || ''} />
      </div>
    );
  }
  if (jenis === 'callout') {
    const tipe = String(sec.tipe || 'info');
    const ikon = tipe === 'tips' ? <Lightbulb size={15} /> :
      tipe === 'peringatan' ? <TriangleAlert size={15} /> : <Info size={15} />;
    const palet = tipe === 'tips'
      ? { bg: '#FFFBEB', bd: '#FDE68A', fg: '#92400E' }
      : tipe === 'peringatan'
        ? { bg: '#FEF2F2', bd: '#FECACA', fg: '#B91C1C' }
        : { bg: '#EFF6FF', bd: '#BFDBFE', fg: '#1D4ED8' };
    return (
      <div style={{ ...S.callout, background: palet.bg, borderColor: palet.bd }}>
        <span style={{ color: palet.fg, flexShrink: 0, marginTop: 2 }}>{ikon}</span>
        <span>
          {sec.judul && <b style={{ color: palet.fg, display: 'block', marginBottom: 2 }}>{sec.judul}</b>}
          <span style={{ color: palet.fg, opacity: .92 }}><MathText text={sec.teks} /></span>
        </span>
      </div>
    );
  }
  if (jenis === 'contoh') {
    return (
      <div style={{ ...S.contohBox, borderLeftColor: warna }}>
        <div style={{ ...S.contohJudul, color: warna }}>{sec.judul || 'Contoh'}</div>
        <p style={S.paragraf}><MathText text={sec.teks} /></p>
        {sec.pembahasan && (
          <div style={S.bahas}><Lightbulb size={13} color="#B45309" /> {sec.pembahasan}</div>
        )}
      </div>
    );
  }
  if (jenis === 'gambar') {
    return (
      <figure style={S.gambarWrap}>
        {sec.url
          ? <img src={sec.url} alt={sec.keterangan || ''} style={S.gambar} loading="lazy" />
          : <div style={S.gambarKosong}><IconGambar size={22} /> Gambar menyusul</div>}
        {sec.keterangan && <figcaption style={S.gambarKet}>{sec.keterangan}</figcaption>}
      </figure>
    );
  }
  if (jenis === 'langkah') {
    return (
      <ol style={S.langkahList}>
        {(sec.items || []).map((it, i) => (
          <li key={i} style={S.langkahItem}>
            <span style={{ ...S.langkahNomor, background: `${warna}14`, color: warna }}>{i + 1}</span>
            <span><MathText text={it} /></span>
          </li>
        ))}
      </ol>
    );
  }
  return <p style={S.paragraf}><MathText text={sec.teks} /></p>;
}

// ---------------- style placeholder ----------------
const S = {
  page: { minHeight: '100vh', background: '#FCFCFE', fontFamily: 'sans-serif', paddingBottom: 60 },
  kosong: {
    textAlign: 'center', color: '#8b93a7', background: '#fff', borderRadius: 16,
    padding: '40px 20px', fontSize: 13, lineHeight: 1.7, margin: '60px 16px',
  },
  topbar: {
    position: 'sticky', top: 0, zIndex: 20, display: 'flex', gap: 10,
    alignItems: 'center', padding: '10px 14px',
    background: 'rgba(252,252,254,.92)', backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #EEF0F6',
  },
  backBtn: {
    width: 34, height: 34, borderRadius: '50%', border: '1px solid #E7E9F2',
    background: '#fff', color: '#334155', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  topJudul: {
    fontWeight: 800, fontSize: 13.5, color: '#1e293b',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  topMeta: {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#94a3b8',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  persenChip: {
    flexShrink: 0, background: '#EEF2FF', color: '#4338CA', fontWeight: 800,
    fontSize: 11, borderRadius: 999, padding: '5px 10px',
  },
  barLatarTop: { position: 'sticky', top: 55, zIndex: 19, height: 3, background: '#EEF0F7' },
  barIsiTop: { height: '100%', background: '#4338CA', transition: 'width .3s ease' },
  isi: { maxWidth: 680, margin: '0 auto', padding: '20px 18px 30px' },
  ringkasan: {
    margin: '0 0 18px', padding: '12px 14px', background: '#F4F5FB',
    borderRadius: 12, color: '#475569', fontSize: 13, lineHeight: 1.65, fontStyle: 'italic',
  },
  placeholderTipe: {
    display: 'flex', gap: 10, alignItems: 'flex-start', margin: '0 0 16px',
    background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 12,
    padding: 14, color: '#64748b', fontSize: 12.5, lineHeight: 1.6,
  },
  judulSeksi: { fontSize: 17, fontWeight: 800, color: '#1e293b', margin: '26px 0 8px' },
  paragraf: { fontSize: 14.5, lineHeight: 1.85, color: '#334155', margin: '0 0 14px' },
  rumusBox: {
    background: '#F6F5FF', border: '1px solid #E4DEF9', borderRadius: 12,
    padding: '6px 12px', margin: '0 0 16px', overflowX: 'auto',
  },
  callout: {
    display: 'flex', gap: 9, border: '1px solid', borderRadius: 12,
    padding: '11px 13px', margin: '0 0 16px', fontSize: 13, lineHeight: 1.65,
  },
  contohBox: {
    background: '#fff', border: '1px solid #EDEFF6', borderLeft: '4px solid',
    borderRadius: 12, padding: '13px 15px', margin: '0 0 16px',
  },
  contohJudul: { fontWeight: 800, fontSize: 12.5, marginBottom: 6 },
  bahas: {
    marginTop: 8, background: '#FFFBEB', border: '1px solid #FDE68A',
    color: '#92400E', borderRadius: 10, padding: '9px 11px',
    fontSize: 12.5, lineHeight: 1.6, display: 'flex', gap: 7, alignItems: 'flex-start',
  },
  gambarWrap: { margin: '0 0 16px' },
  gambar: { width: '100%', borderRadius: 12, display: 'block' },
  gambarKosong: {
    display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
    background: '#F1F5F9', border: '1px dashed #CBD5E1', borderRadius: 12,
    color: '#94a3b8', padding: 26, fontSize: 12.5,
  },
  gambarKet: { textAlign: 'center', color: '#94a3b8', fontSize: 11.5, marginTop: 6 },
  langkahList: { listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  langkahItem: { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.65, color: '#334155' },
  langkahNomor: {
    width: 24, height: 24, borderRadius: 8, flexShrink: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11.5,
  },
  btnSelesai: {
    display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '13px 16px', borderRadius: 13, cursor: 'pointer',
    background: '#4338CA', color: '#fff', border: 'none',
    fontWeight: 800, fontSize: 13.5, margin: '22px 0 10px',
  },
  btnSelesaiDone: { background: '#ECFDF5', color: '#15803D', border: '1px solid #BBF7D0', cursor: 'default' },
  kuisBox: {
    background: '#fff', border: '1px solid #EDEFF6', borderRadius: 16,
    padding: 16, marginTop: 18, boxShadow: '0 3px 12px rgba(30,27,75,.05)',
  },
  kuisHead: {
    display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800,
    fontSize: 12.5, color: '#B45309', background: '#FFFBEB',
    border: '1px solid #FDE68A', borderRadius: 10, padding: '8px 11px', marginBottom: 14,
  },
  soal: { marginBottom: 18 },
  soalTeks: { fontSize: 14, lineHeight: 1.7, color: '#1e293b', marginBottom: 9 },
  opsiList: { display: 'flex', flexDirection: 'column', gap: 7 },
  opsi: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    background: '#fff', border: '1.5px solid #E7E9F2', borderRadius: 11,
    padding: '10px 12px', fontSize: 13, color: '#334155', cursor: 'pointer',
    transition: 'border-color .15s ease, background .15s ease',
  },
  opsiHuruf: {
    width: 24, height: 24, borderRadius: 8, background: '#F1F5F9',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 11, color: '#64748b', flexShrink: 0,
  },
  opsiDipilih: { borderColor: '#4338CA', background: '#EEF2FF' },
  opsiBenar: { borderColor: '#16A34A', background: '#F0FDF4' },
  opsiSalah: { borderColor: '#DC2626', background: '#FEF2F2' },
  btnUtama: {
    display: 'inline-flex', gap: 7, alignItems: 'center', justifyContent: 'center',
    background: '#4338CA', color: '#fff', border: 'none', borderRadius: 12,
    padding: '12px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', width: '100%',
  },
  hasilBox: { display: 'flex', gap: 14, alignItems: 'center', background: '#F6F5FF', borderRadius: 13, padding: 14 },
  hasilNilai: {
    width: 58, height: 58, borderRadius: '50%', background: '#4338CA', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 17, flexShrink: 0,
  },
  hasilJudul: { fontWeight: 800, fontSize: 14, color: '#1e293b' },
  hasilMeta: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
  btnUlang: {
    display: 'inline-flex', gap: 5, alignItems: 'center', marginTop: 8,
    background: '#fff', border: '1px solid #DDD6FE', color: '#6D28D9',
    borderRadius: 9, padding: '6px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  },
  navBab: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 },
  btnNav: {
    display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center',
    background: '#fff', border: '1px solid #E7E9F2', color: '#475569',
    borderRadius: 12, padding: '11px 14px', fontSize: 12.5, fontWeight: 700,
    cursor: 'pointer', textAlign: 'center',
  },
  btnNavNext: { background: '#EEF2FF', borderColor: '#C7D2FE', color: '#4338CA' },
  toast: {
    position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)',
    background: '#1E1B4B', color: '#fff', borderRadius: 999,
    padding: '10px 18px', fontSize: 12.5, fontWeight: 700, zIndex: 60,
    boxShadow: '0 8px 24px rgba(30,27,75,.3)', whiteSpace: 'nowrap',
  },
};
