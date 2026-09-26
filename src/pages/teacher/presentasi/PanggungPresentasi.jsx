// src/pages/teacher/presentasi/PanggungPresentasi.jsx
// ============================================================
// FASE 3 -- PANGGUNG PRESENTASI GURU (route /guru/presentasi/:materiId/:babId)
// Layar proyektor = layar siswa (sinkron realtime via `sesi_presentasi`).
// Alur pertemuan: Mulai Sesi -> bedah bagian per bagian (siswa ikut
// scroll) -> Latihan bersama (soal live, statistik jawaban realtime)
// -> Mode bebas -> Akhiri Sesi.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Play, Square, ChevronLeft, ChevronRight, Users,
  Radio, Eye, EyeOff, Hand, Magnet, CheckCircle2, Presentation, Star,
  FileText,
} from 'lucide-react';
import { muatMateriDanBab } from '../../../services/materiV2Service';
// Turn 91: monitor mode ujian (rekap nilai live + akhiri paksa).
import { dengarUjian, akhiriUjian } from '../../../services/sesiService';
import {
  cariSesiAktif, pantauSesi, pantauPeserta, pantauJawaban,
  mulaiSesi, akhiriSesi, setPosisiSesi, setModeSesi, ubahSesi,
  pantauAntrean, setStatusAntrean, beriXpGuru, bacaIdentitasGuru,
} from '../../../services/sesiPresentasiService';
import IsiSections from '../../../components/belajar/IsiSections';
import { buatSlide, SlideView } from '../../../components/belajar/slideMateri';
import { MathText } from '../../../components/MathText';
import { T, kartuDasar, halamanDasar, tombolPill } from '../../student/belajar/tema';

export default function PanggungPresentasi() {
  const { materiId, babId } = useParams();
  const navigate = useNavigate();

  const [materi, setMateri] = useState(null);
  const [bab, setBab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sesi, setSesi] = useState(null);
  const [peserta, setPeserta] = useState([]);
  const [jawaban, setJawaban] = useState([]);
  // Turn 91: mode ujian — durasi menit, rekap submit, tick countdown.
  const [durasiMenit, setDurasiMenit] = useState(30);
  const [ujianList, setUjianList] = useState([]);
  const [nowUji, setNowUji] = useState(() => Date.now());
  useEffect(() => {
    if (!sesi || !sesi.id) return undefined;
    return dengarUjian(sesi.id, setUjianList);
  }, [sesi?.id]);
  useEffect(() => {
    if (!sesi || sesi.posisi?.jenis !== 'kuisPaket') return undefined;
    const id = window.setInterval(() => setNowUji(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sesi?.id, sesi?.posisi?.jenis]);
  const [antrean, setAntrean] = useState([]);
  const [tampilKunci, setTampilKunci] = useState(false);
  const [lebar, setLebar] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 900));

  useEffect(() => {
    const onR = () => setLebar(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const tampilSamping = lebar >= 1100;

  useEffect(() => {
    (async () => {
      const { materi: m, babList } = await muatMateriDanBab(materiId);
      setMateri(m);
      setBab(babList.find((b) => b.id === babId) || null);
      // Turn 76: hanya sesi MILIK SAYA di bab ini — sesi guru lain yang paralel
      // tidak boleh membuat panggung ini menempel ke kelas sebelah.
      const aktif = await cariSesiAktif({ guruId: bacaIdentitasGuru().guruId, babId });
      if (aktif && aktif.babId === babId) setSesi(aktif);
      setLoading(false);
    })();
  }, [materiId, babId]);

  // listener realtime hanya saat sesi aktif di bab ini
  useEffect(() => {
    if (!sesi?.id || sesi.status !== 'aktif') return undefined;
    const u1 = pantauSesi(sesi.id, (sn) => setSesi(sn));
    const u2 = pantauPeserta(sesi.id, setPeserta);
    const u3 = pantauJawaban(sesi.id, setJawaban);
    const u4 = pantauAntrean(sesi.id, setAntrean);
    return () => { u1(); u2(); u3(); u4(); };
  }, [sesi?.id, sesi?.status]);

  const sections = useMemo(() => bab?.sections || [], [bab]);
  // Turn 77: mode PPT — bacaan disusun jadi slide rapi (gambar utuh + caption).
  const slides = useMemo(() => buatSlide(sections), [sections]);
  const kuis = useMemo(() => bab?.ujiPemahaman || [], [bab]);
  const { guruId } = bacaIdentitasGuru();
  // PPT versi guru menimpa slide resmi saat kelasnya berlangsung
  const slideEfektif = bab?.slideVersiGuru?.[guruId] || bab?.slideUrl || '';
  const posisi = sesi?.posisi || { jenis: 'section', index: 0 };
  const idx = Number(posisi.index) || 0;
  const sesiAktif = sesi?.status === 'aktif';

  const geser = (jenis, indexBaru) => {
    if (!sesi?.id) return;
    // saat menampilkan slide, siarkan URL versi aktif ke siswa
    const extra = jenis === 'slide' ? { slideUrlAktif: slideEfektif } : {};
    setPosisiSesi(sesi.id, { jenis, index: indexBaru }, extra).catch(() => {});
  };

  // statistik jawaban live untuk soal saat ini (pg / pgMulti / tabel)
  const statSoal = useMemo(() => {
    if (posisi.jenis !== 'kuis') return null;
    const masuk = jawaban.filter((j) => Number(j.soalIndex) === idx);
    const sNow = kuis[idx] || {};
    const fmt = String(sNow.tipe || 'pg');
    if (fmt === 'tabel') {
      const kolom = Array.isArray(sNow.kolom) && sNow.kolom.length
        ? sNow.kolom : ['Benar', 'Salah'];
      const perBaris = (sNow.baris || []).map((_, r) =>
        kolom.map((_, c) => masuk.filter(
          (m2) => Array.isArray(m2.pilihan) && m2.pilihan[r] === c).length));
      return { responden: masuk.length, perBaris, kolom, fmt };
    }
    const perOpsi = (sNow.opsi || []).map((_, j) =>
      masuk.filter((m2) => (Array.isArray(m2.pilihan)
        ? m2.pilihan.includes(j)
        : Number(m2.pilihan) === j)).length);
    return { responden: masuk.length, perOpsi, fmt };
  }, [jawaban, posisi.jenis, idx, kuis]);

  if (loading) {
    return <div style={halamanDasar}><div style={S.kosong}>Memuat panggung...</div></div>;
  }
  if (!bab || !materi) {
    return (
      <div style={halamanDasar}>
        <div style={S.kosong}>
          Bab tidak ditemukan.
          <div style={{ marginTop: 12 }}>
            <button type="button" style={tombolPill('primer')}
              onClick={() => navigate('/guru/presentasi')}>
              <ArrowLeft size={15} /> Ke daftar presentasi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const offsetHuruf = posisi.jenis === 'section'
    ? sections.slice(0, idx).filter(
      (s) => String(s.jenis || 'paragraf') === 'judul').length
    : 0;

  return (
    <div style={halamanDasar}>
      {/* ---------- header panggung ---------- */}
      <header style={S.topbar}>
        <button type="button" style={S.kembali}
          onClick={() => navigate('/guru/presentasi')}>
          <ArrowLeft size={16} /> Daftar
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.judulTop}>{bab.judul}</div>
          <div style={S.metaTop}>{materi.judul} • {materi.mapel}</div>
        </div>
        <span style={sesiAktif ? S.chipLive : S.chipOff}>
          <Radio size={12} /> {sesiAktif ? 'SESI AKTIF' : 'BELUM MULAI'}
        </span>
        <span style={S.chipPeserta}>
          <Users size={13} /> {peserta.length}
        </span>
      </header>

      {/* ---------- area proyektor ---------- */}
      <main style={{ ...S.panggung, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ ...S.layar, flex: 1, minWidth: 0 }}>
          {posisi.jenis === 'section' ? (
            slides[idx] ? (
              <div style={S.zoomWrap}>
                <div style={S.penanda}>
                  📽 Slide {idx + 1} / {slides.length} (mode PPT)
                </div>
                <SlideView slide={slides[idx]} />
              </div>
            ) : (
              <div style={S.kosong}>Tidak ada slide untuk ditampilkan.</div>
            )
          ) : posisi.jenis === 'kuisPaket' ? (
            <div style={S.zoomWrap}>
              <div style={S.penanda}>
                📝 MODE UJIAN • {kuis.length} soal • timer mundur di layar siswa
              </div>
              {(() => {
                const deadline = sesi?.ujianSelesaiAt || (sesi?.ujianMulaiAt
                  ? sesi.ujianMulaiAt + (Number(sesi.durasiMenit) || 30) * 60000 : null);
                const sisa = deadline ? Math.max(0, deadline - nowUji) : null;
                const mm = sisa !== null ? Math.floor(sisa / 60000) : null;
                const ss = sisa !== null ? Math.floor((sisa % 60000) / 1000) : null;
                return (
                  <div style={{ padding: '10px 2px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        fontVariantNumeric: 'tabular-nums', fontWeight: 900, fontSize: 22,
                        color: sisa !== null && sisa < 60000 ? '#DC2626' : '#4338ca',
                      }}>
                        {sisa !== null ? `⏳ ${mm}:${String(ss).padStart(2, '0')}` : '⏳ —'}
                      </span>
                      <span style={{ fontSize: 12.5, color: '#64748b' }}>
                        {peserta.length} peserta • {ujianList.length} mengumpulkan
                      </span>
                      <span style={{ flex: 1 }} />
                      {!sesi?.ujianSelesaiAt && (
                        <button type="button" style={tombolPill('merah')}
                          onClick={() => akhiriUjian(sesi.id).catch(() => {})}>
                          ⏹ Akhiri Sekarang
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {peserta.map((p) => {
                        const u = ujianList.find((x) => x.siswaId === p.siswaId);
                        const n = jawaban.filter((j2) => j2.siswaId === p.siswaId).length;
                        return (
                          <div key={p.siswaId} style={{
                            display: 'flex', gap: 8, alignItems: 'center', fontSize: 13,
                            background: '#fff', border: '1px solid #eef1f6',
                            borderRadius: 10, padding: '7px 10px',
                          }}>
                            <span style={{ flex: 1, textAlign: 'left', fontWeight: 700 }}>{p.nama || p.siswaId}</span>
                            {u ? (
                              <span style={{ fontWeight: 900, color: '#15803D', background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 999, padding: '2px 10px', fontSize: 12 }}>
                                terkumpul • nilai {u.skor}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: 12 }}>
                                mengerjakan • {Math.min(n, kuis.length)}/{kuis.length} terjawab
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {peserta.length === 0 && (
                        <div style={{ fontSize: 12.5, color: '#64748b' }}>Belum ada peserta bergabung.</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : posisi.jenis === 'kuis' ? (
            kuis[idx] && (
              <div style={S.zoomWrap}>
                <div style={S.penanda}>
                  Latihan bersama • soal {idx + 1} / {kuis.length}
                </div>
                {kuis[idx].soalGambar && (
                  <img src={kuis[idx].soalGambar} alt="Gambar soal"
                    style={S.soalGambarBesar} />
                )}
                {/* Sumber soal tidak ditampilkan ke peserta (Turn 35). */}
                <div style={S.soalBesar}><MathText text={kuis[idx].soal} /></div>
                {String(kuis[idx].tipe || 'pg') === 'pgMulti' && (
                  <div style={S.formatChipProyektor}>
                    ☑️ Format ujian asli: centang lebih dari satu pernyataan benar
                  </div>
                )}
                {String(kuis[idx].tipe || 'pg') === 'tabel' ? (
                  <table style={S.tabelProyektor}>
                    <thead>
                      <tr>
                        <th style={S.tabelProyektorSel}>Pernyataan</th>
                        {(statSoal?.kolom || ['Benar', 'Salah']).map((k) => (
                          <th key={k} style={S.tabelProyektorSel}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(kuis[idx].baris || []).map((bar, r) => (
                        <tr key={r}>
                          <td style={S.tabelProyektorSel}>
                            <MathText text={bar} />
                          </td>
                          {(statSoal?.kolom || ['Benar', 'Salah']).map((k, c) => {
                            const n = statSoal?.perBaris?.[r]?.[c] || 0;
                            const kunci = tampilKunci
                              && (kuis[idx].jawaban || [])[r] === c;
                            return (
                              <td key={c} style={{
                                ...S.tabelProyektorSel, textAlign: 'center',
                                ...(kunci ? S.tabelProyektorKunci : null),
                              }}>
                                {n} siswa {kunci ? '✓ kunci' : ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <>
                    {String(kuis[idx].tipe || 'pg') === 'isian'
                      || String(kuis[idx].tipe || 'pg') === 'uraian' ? (
                      <div style={S.catatanProyektor}>
                        Soal berbentuk {String(kuis[idx].tipe)} — jawaban siswa
                        berupa teks; {statSoal?.responden || 0} respons masuk.
                        {tampilKunci && (
                          <> Kunci/referensi: {String(kuis[idx].jawaban || '')} {kuis[idx].pembahasan || ''}</>
                        )}
                      </div>
                    ) : null}
                    {String(kuis[idx].tipe || 'pg') === 'jodoh' && (
                      <div style={S.catatanProyektor}>
                        Soal menjodohkan: {(kuis[idx].premis || []).length} premis
                        (kiri) memilih pasangan dari kolam respons (kanan);
                        satu respons boleh dipakai lebih dari satu premis.
                        Statistik per respons di bawah.
                        {tampilKunci && (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {(kuis[idx].premis || []).map((pr, r) => {
                              const c = (kuis[idx].jawaban || [])[r];
                              return (
                                <div key={r}>
                                  {r + 1}. {pr} →{' '}
                                  <b>
                                    {c == null ? '—'
                                      : `${String.fromCharCode(65 + c)}. ${(kuis[idx].opsi || [])[c]}`}
                                  </b>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(kuis[idx].opsi || []).map((op, j) => {
                      const n = statSoal?.perOpsi[j] || 0;
                      const total = statSoal?.responden || 0;
                      const persen = total ? Math.round((n / total) * 100) : 0;
                      const kunci = tampilKunci && (
                        String(kuis[idx].tipe || 'pg') === 'pgMulti'
                          ? (kuis[idx].jawaban || []).includes(j)
                          : j === kuis[idx].jawaban);
                      return (
                        <div key={j} style={{
                          ...S.opsiProyektor,
                          ...(kunci ? S.opsiProyektorKunci : null),
                        }}>
                          <span style={S.opsiHurufBesar}>
                            {String.fromCharCode(65 + j)}.
                          </span>
                          <span style={{ flex: 1 }}><MathText text={op} /></span>
                          <span style={S.statChip}>
                            {n} ({persen}%)
                          </span>
                          {kunci && <CheckCircle2 size={18} color={T.hijau} />}
                        </div>
                      );
                    })}
                    </div>
                  </>
                )}
                {tampilKunci && kuis[idx].pembahasanGambar && (
                  <img src={kuis[idx].pembahasanGambar} alt="Gambar pembahasan"
                    style={S.pembahasanImg} loading="lazy" />
                )}
                {tampilKunci && kuis[idx].pembahasanGambarKet && (
                  <div style={{ textAlign: 'center', color: '#64748B', fontSize: 12.5, marginTop: 6 }}>
                    🔍 {kuis[idx].pembahasanGambarKet}
                  </div>
                )}
                <div style={S.statFoot}>
                  {statSoal?.responden || 0} siswa menjawab •
                  {' '}{peserta.length} peserta sesi
                </div>
              </div>
            )
          ) : posisi.jenis === 'slide' && slideEfektif ? (
            <>
              <iframe
                title="Slide proyektor"
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(slideEfektif)}`}
                style={S.slideBesar}
              />
              {bab.slideVersiGuru?.[guruId] && (
                <div style={S.versikuChip}>📽 Menayangkan PPT versimu</div>
              )}
            </>
          ) : posisi.jenis === 'pdf' && bab.pdfUrl ? (
            <iframe
              title="Modul PDF proyektor"
              src={bab.pdfUrl}
              style={S.slideBesar}
            />
          ) : (
            <div style={S.kosong}>Posisi tidak dikenali.</div>
          )}
        </div>
          <div style={{ ...S.kartuAntreMobil, ...(tampilSamping ? { display: 'none' } : null) }}>
            <PanelAntrean
              antrean={antrean}
              sessionId={sesiAktif ? sesi.id : null}
            />
          </div>
        {tampilSamping && (
          <aside style={S.sisi}>
            <PanelAntrean
              antrean={antrean}
              sessionId={sesiAktif ? sesi.id : null}
            />
          </aside>
        )}
      </main>

      {/* ---------- bar kontrol guru ---------- */}
      <footer style={S.kontrol}>
        {sesiAktif && sesi?.kode && (
          <button type="button" style={tombolPill('primer')}
            title="Kode sesi untuk siswa — ketuk untuk menyalin"
            onClick={() => { try { navigator.clipboard?.writeText(sesi.kode); } catch { /* noop */ } }}>
            🔑 Kode sesi: <b style={{ letterSpacing: 3 }}>{sesi.kode}</b> · ketuk utk salin
          </button>
        )}
        {!sesiAktif ? (
          <button type="button" style={tombolPill('primer')}
            onClick={async () => {
              const id = await mulaiSesi(materiId, babId, {
                kelas: materi?.kelas ?? '', mapel: materi?.mapel || '',
                judulMateri: materi?.judul || '', judulBab: bab?.judul || '',
              });
              setSesi({
                id, materiId, babId, status: 'aktif', mode: 'mengikuti',
                posisi: { jenis: 'section', index: 0 },
              });
            }}>
            <Play size={15} /> Mulai Sesi — sinkronkan layar siswa
          </button>
        ) : (
          <>
            <button type="button" style={tombolPill('putih')}
              disabled={posisi.jenis === 'section' && idx === 0}
              onClick={() => (posisi.jenis === 'kuis' || posisi.jenis === 'kuisPaket')
                ? geser('section', slides.length - 1)
                : geser('section', Math.max(0, idx - 1))}>
              <ChevronLeft size={15} />
            </button>
            {posisi.jenis === 'section' ? (
              <button type="button" style={tombolPill('primer')}
                disabled={idx >= slides.length - 1}
                onClick={() => geser('section', idx + 1)}>
                Slide berikutnya <ChevronRight size={15} />
              </button>
            ) : posisi.jenis === 'kuisPaket' ? (
              <button type="button" style={tombolPill('primer')}
                onClick={() => geser('section', 0)}>
                ⬅ Kembali ke slide
              </button>
            ) : (
              <button type="button" style={tombolPill('primer')}
                disabled={idx >= kuis.length - 1}
                onClick={() => { setTampilKunci(false); geser('kuis', idx + 1); }}>
                Soal berikutnya <ChevronRight size={15} />
              </button>
            )}
            {sesiAktif && posisi.jenis !== 'kuisPaket' && kuis.length > 0 && (
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number" min="1" max="180" value={durasiMenit}
                  aria-label="Durasi ujian (menit)"
                  onChange={(e) => setDurasiMenit(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: 64, borderRadius: 10, border: `1px solid ${T.garis}`,
                    padding: '9px 6px', fontSize: 13, fontWeight: 800,
                    textAlign: 'center', color: T.judul, background: '#fff',
                  }} />
                <button type="button" style={tombolPill('primer')}
                  onClick={() => {
                    setTampilKunci(false);
                    setPosisiSesi(sesi.id,
                      { jenis: 'kuisPaket', indexes: kuis.map((_, i2) => i2) },
                      {
                        kunciTerbuka: false,
                        ujianMulaiAt: Date.now(),
                        durasiMenit: Number(durasiMenit) || 30,
                        ujianSelesaiAt: null,
                      }).catch(() => {});
                  }}>
                  📝 Mulai Ujian • {kuis.length} soal • {durasiMenit} mnt
                </button>
              </span>
            )}
            {sesiAktif && posisi.jenis === 'kuis' && (
              <button type="button" style={tombolPill('hijau')}
                onClick={() => ubahSesi(sesi.id, { kunciTerbuka: !sesi.kunciTerbuka }).catch(() => {})}>
                {sesi.kunciTerbuka ? '🔒 Tutup pembahasan' : '🔓 Buka pembahasan'}
              </button>
            )}
            <span style={S.pemisah} />
            {posisi.jenis === 'section' ? (
              <button type="button" style={tombolPill('putih')}
                disabled={kuis.length === 0}
                onClick={() => { setTampilKunci(false); geser('kuis', 0); }}>
                🎯 Latihan soal 1
              </button>
            ) : (
              <button type="button" style={tombolPill('putih')}
                onClick={() => geser('section', idx > 0 ? idx : 0)}>
                📖 Kembali ke bagian {Math.min(idx + 1, sections.length) || 1}
              </button>
            )}
            {posisi.jenis === 'kuis' && (
              <button type="button" style={tombolPill('putih')}
                onClick={() => setTampilKunci((v) => !v)}>
                {tampilKunci ? <EyeOff size={14} /> : <Eye size={14} />}
                {tampilKunci ? ' Sembunyikan kunci' : ' Tampilkan kunci'}
              </button>
            )}
            {slideEfektif && (
              <button type="button" style={tombolPill('putih')}
                onClick={() => geser('slide', 0)}>
                <Presentation size={14} /> Slide
              </button>
            )}
            {bab.pdfUrl && (
              <button type="button" style={tombolPill('putih')}
                onClick={() => geser('pdf', 0)}>
                <FileText size={14} /> PDF
              </button>
            )}
            <span style={S.pemisah} />
            <button type="button"
              style={tombolPill(sesi.mode === 'mengikuti' ? 'primer' : 'putih')}
              onClick={() => setModeSesi(sesi.id,
                sesi.mode === 'mengikuti' ? 'bebas' : 'mengikuti')}>
              {sesi.mode === 'mengikuti'
                ? <><Magnet size={14} /> Mode mengikuti</>
                : <><Hand size={14} /> Mode bebas</>}
            </button>
            <button type="button"
              style={{ ...tombolPill('putih'), color: '#B91C1C', borderColor: T.merahGaris }}
              onClick={async () => {
                await akhiriSesi(sesi.id);
                setSesi((s) => (s ? { ...s, status: 'selesai' } : s));
              }}>
              <Square size={13} /> Akhiri
            </button>
          </>
        )}
      </footer>
    </div>
  );
}

// ---------- panel antrean maju + reward XP tentor ----------
function PanelAntrean({ antrean, sessionId }) {
  if (!sessionId) return null;
  const urut = (a, b) => (a.pada?.seconds || 0) - (b.pada?.seconds || 0);
  const menunggu = antrean.filter((a) => a.status === 'menunggu').sort(urut);
  const dipanggil = antrean.filter((a) => a.status === 'dipanggil');
  const panggil = (uid) => setStatusAntrean(sessionId, uid, 'dipanggil').catch(() => {});
  const beri = async (uid, n) => {
    try {
      await beriXpGuru(uid, n);
      await setStatusAntrean(sessionId, uid, 'diberi', n);
    } catch (e) { console.error('Gagal beri XP:', e); }
  };
  const tutup = (uid) => setStatusAntrean(sessionId, uid, 'selesai').catch(() => {});
  return (
    <div style={{ ...kartuDasar, padding: 14 }}>
      <div style={S.sisiJudul}>
        <Hand size={15} /> Antrean Maju
        {menunggu.length > 0 && <span style={S.sisiBadge}>{menunggu.length}</span>}
      </div>
      {menunggu.length === 0 && dipanggil.length === 0 && (
        <div style={S.sisiKosong}>
          Belum ada siswa yang mengajukan diri.
          Siswa menekan tombol 🙋 di layarnya.
        </div>
      )}
      {dipanggil.map((a) => (
        <div key={a.id} style={{ ...S.antreRow, background: T.hijauLatar, borderColor: T.hijauGaris }}>
          <span style={S.antreNama}>🎤 {a.nama}</span>
          <span style={S.antreBtnRow}>
            {[10, 20, 50].map((n) => (
              <button key={n} type="button" style={S.xpBtn}
                onClick={() => beri(a.id, n)}>
                <Star size={11} fill="currentColor" /> +{n}
              </button>
            ))}
            <button type="button" style={S.antreBtn} onClick={() => tutup(a.id)}>
              Selesai
            </button>
          </span>
        </div>
      ))}
      {menunggu.map((a) => (
        <div key={a.id} style={S.antreRow}>
          <span style={S.antreNama}>🙋 {a.nama}</span>
          <button type="button" style={S.antreBtn} onClick={() => panggil(a.id)}>
            Panggil
          </button>
        </div>
      ))}
    </div>
  );
}

const S = {
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '40px 20px', fontSize: 13, margin: '60px 16px',
  },
  topbar: {
    position: 'sticky', top: 0, zIndex: 30, display: 'flex', gap: 12,
    alignItems: 'center', padding: '10px 18px',
    background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${T.garis}`,
  },
  kembali: {
    display: 'inline-flex', gap: 6, alignItems: 'center', background: 'none',
    border: 'none', color: T.biruGelap, fontWeight: 800, fontSize: 12.5,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  judulTop: {
    fontWeight: 800, fontSize: 14, color: T.judul,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  metaTop: { fontSize: 10.5, color: T.samar },
  chipLive: {
    display: 'inline-flex', gap: 5, alignItems: 'center',
    background: T.hijauLatar, color: T.hijauTeks, border: `1px solid ${T.hijauGaris}`,
    borderRadius: 999, padding: '5px 11px', fontSize: 10.5, fontWeight: 800,
  },
  chipOff: {
    display: 'inline-flex', gap: 5, alignItems: 'center',
    background: T.latar, color: T.samar, border: `1px solid ${T.garis}`,
    borderRadius: 999, padding: '5px 11px', fontSize: 10.5, fontWeight: 800,
  },
  chipPeserta: {
    display: 'inline-flex', gap: 5, alignItems: 'center',
    background: T.kotakBiru, color: T.biruDalam, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 800,
  },
  panggung: { padding: '18px 20px 110px', maxWidth: 1050, margin: '0 auto' },
  layar: { ...kartuDasar, padding: '26px 30px', minHeight: '62vh' },
  zoomWrap: { zoom: 1.28 },
  penanda: {
    display: 'inline-block', background: T.kotakBiru,
    border: `1px solid ${T.kotakBiruGaris}`, color: T.biruDalam,
    borderRadius: 999, padding: '5px 13px', fontSize: 11.5,
    fontWeight: 800, marginBottom: 14,
  },
  sumberChip: {
    display: 'inline-block', background: T.latar, border: `1px solid ${T.garis}`,
    color: T.samar, borderRadius: 999, padding: '4px 12px',
    fontSize: 11, fontWeight: 800, marginBottom: 10,
  },
  soalGambarBesar: {
    display: 'block', width: '100%', maxWidth: 760, background: '#fff',
    border: `1px solid ${T.garis}`, borderRadius: 12, padding: 8,
    margin: '0 0 14px',
  },
  soalBesar: {
    fontSize: 17, fontWeight: 700, color: T.judul,
    lineHeight: 1.6, marginBottom: 16,
  },
  opsiProyektor: {
    display: 'flex', gap: 12, alignItems: 'center',
    border: `1.5px solid ${T.garis}`, borderRadius: 13,
    padding: '12px 15px', fontSize: 14.5, color: T.teks, background: '#fff',
  },
  opsiProyektorKunci: { borderColor: T.hijau, background: T.hijauLatar },
  opsiHurufBesar: { fontWeight: 800, color: T.samar },
  statChip: {
    background: T.latar, border: `1px solid ${T.garis}`, borderRadius: 999,
    padding: '3px 10px', fontSize: 11.5, fontWeight: 800, color: T.biruGelap,
  },
  statFoot: { marginTop: 14, fontSize: 12, color: T.samar, fontWeight: 700 },
  kontrol: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
    display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
    justifyContent: 'center', padding: '12px 16px',
    background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(10px)',
    borderTop: `1px solid ${T.garis}`,
  },
  pemisah: { width: 1, height: 26, background: T.garis, margin: '0 4px' },
  versikuChip: {
    display: 'inline-flex', marginTop: 10, background: T.kotakBiru,
    border: `1px solid ${T.kotakBiruGaris}`, color: T.biruDalam,
    borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: 800,
  },
  formatChipProyektor: {
    fontSize: 13, fontWeight: 800, color: T.biruDalam,
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 10, padding: '8px 12px', margin: '0 0 10px',
  },
  tabelProyektor: {
    width: '100%', borderCollapse: 'collapse', background: '#fff',
    border: `1px solid ${T.garis}`, fontSize: 15, margin: '4px 0 10px',
  },
  tabelProyektorSel: {
    border: `1px solid ${T.garis}`, padding: '10px 12px',
    textAlign: 'left', color: T.teks, fontWeight: 600,
  },
  tabelProyektorKunci: { background: T.hijauLatar, color: T.hijauTeks },
  catatanProyektor: {
    fontSize: 14, color: T.teks, background: T.kotakBiru,
    border: `1px solid ${T.kotakBiruGaris}`, borderRadius: 10,
    padding: '10px 12px', marginBottom: 10, lineHeight: 1.6,
  },
  pembahasanImg: {
    display: 'block', width: '100%', maxWidth: 560, margin: '10px auto 0',
    borderRadius: 10, border: `1px solid ${T.garis}`, background: '#fff',
  },
  slideBesar: {
    width: '100%', height: '68vh', border: `1px solid ${T.garis}`,
    borderRadius: 12, background: '#fff',
  },
  sisi: { width: 300, flexShrink: 0, position: 'sticky', top: 66 },
  kartuAntreMobil: { marginTop: 14 },
  sisiJudul: {
    display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800,
    fontSize: 13.5, color: T.judul, marginBottom: 10,
  },
  sisiBadge: {
    background: T.biru, color: '#fff', borderRadius: 999,
    padding: '1px 8px', fontSize: 10.5, fontWeight: 800,
  },
  sisiKosong: { color: T.samar, fontSize: 11.5, lineHeight: 1.6, padding: '4px 2px' },
  antreRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    border: `1px solid ${T.garis}`, borderRadius: 11,
    padding: '8px 10px', marginBottom: 8, background: T.latar,
  },
  antreNama: { flex: 1, minWidth: 0, fontWeight: 700, fontSize: 12.5, color: T.judul },
  antreBtnRow: { display: 'flex', gap: 5, alignItems: 'center' },
  antreBtn: {
    background: '#fff', border: `1px solid ${T.garis}`, color: T.biruGelap,
    borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  xpBtn: {
    display: 'inline-flex', gap: 3, alignItems: 'center',
    background: T.amberLatar, border: `1px solid ${T.amberGaris}`,
    color: T.amberTeks, borderRadius: 8, padding: '5px 8px',
    fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  },
};
