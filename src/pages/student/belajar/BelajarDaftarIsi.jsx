// src/pages/student/belajar/BelajarDaftarIsi.jsx
// ============================================================
// MATERI v2 -- DAFTAR ISI (route /siswa/belajar/:materiId)
// Visual: tema "Gemilang Biru" (docs/desain/mockup-ui-gemilang.png)
// -- gaya panel "Daftar Materi" mockup: lingkaran nomor, centang
// hijau selesai, status "x/y selesai" / "Belum dibaca". Turn 5.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, CheckCircle2, Clock3, FileText, BookOpen,
} from 'lucide-react';
import {
  muatMateriDanBab, muatProgressSiswa, persenBab,
  muatProfilAkses, cocokMateriUntukSiswa,
} from '../../../services/materiV2Service';
import {
  T, kartuDasar, lingkaranNomor, barLuar, barDalam, halamanDasar,
} from './tema';

export default function BelajarDaftarIsi() {
  const { materiId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '';
  const studentKelas =
    localStorage.getItem('studentKelas') ||
    localStorage.getItem('studentGrade') || '';

  const [materi, setMateri] = useState(null);
  const [babList, setBabList] = useState([]);
  const [progresMap, setProgresMap] = useState({});
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { materi: m, babList: bl } = await muatMateriDanBab(materiId);
      setMateri(m);
      setBabList(bl);
      setProgresMap(await muatProgressSiswa(studentId));
      setProfil(await muatProfilAkses(
        studentId, studentKelas,
        localStorage.getItem('studentProgram') || ''
      ));
      setLoading(false);
    })();
  }, [materiId, studentId]);

  const progresTotal = useMemo(() => {
    if (!babList.length) return 0;
    const total = babList.reduce(
      (a, b) => a + persenBab(b, progresMap[b.id]), 0);
    return Math.round(total / babList.length);
  }, [babList, progresMap]);

  const totalMenit = useMemo(
    () => babList.reduce((a, b) => a + (Number(b.estimasiMenit) || 0), 0),
    [babList]);

  // bab "aktif" = bab belum selesai pertama (rekomendasi lanjut)
  const idxAktif = useMemo(() =>
    babList.findIndex((b) => persenBab(b, progresMap[b.id]) < 100),
  [babList, progresMap]);

  if (loading) {
    return <div style={halamanDasar}><div style={S.kosong}>Memuat materi...</div></div>;
  }
  if (materi && profil
    && !cocokMateriUntukSiswa(materi, profil, studentKelas)) {
    return (
      <div style={halamanDasar}>
        <div style={S.kosong}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🔒</div>
          Materi ini untuk jenjang/program lain, bukan untuk
          akunmu. Hubungi admin bila merasa ini keliru.
        </div>
      </div>
    );
  }
  if (!materi) {
    return (
      <div style={halamanDasar}>
        <div style={S.kosong}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🤔</div>
          Materi tidak ditemukan atau belum diterbitkan.
          <div style={{ marginTop: 14 }}>
            <button type="button" style={S.btnKembali}
              onClick={() => navigate('/siswa/belajar')}>
              <ArrowLeft size={15} /> Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={halamanDasar}>
      {/* Hero biru gradasi gaya mockup */}
      <div style={S.hero}>
        <div style={S.heroGlow} />
        <button type="button" style={S.backBtn} aria-label="Kembali"
          onClick={() => navigate('/siswa/belajar')}>
          <ArrowLeft size={18} />
        </button>
        <div style={S.heroRow}>
          <span style={S.heroCover}>{materi.emoji || '📘'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.heroChips}>
              <span style={S.heroChip}>{materi.mapel || '-'}</span>
              <span style={S.heroChip}>Kelas {materi.kelas || '-'}</span>
            </div>
            <h1 style={S.heroJudul}>{materi.judul}</h1>
            <p style={S.heroMeta}>
              <BookOpen size={12} /> {babList.length} bagian
              {totalMenit > 0 ? ` • ±${totalMenit} menit baca` : ''}
            </p>
          </div>
          {/* Progres kanan ala mockup */}
          <div style={S.progresKanan}>
            <div style={S.progresLabel}>Progress Materi</div>
            <div style={{ ...S.progresAngka }}>
              {progresTotal}%
            </div>
            <div style={{ ...barLuar(6), width: 150, background: 'rgba(255,255,255,.25)' }}>
              <div style={{ ...barDalam(progresTotal, '#fff') }} />
            </div>
          </div>
        </div>
        {materi.deskripsi && <p style={S.heroDesk}>{materi.deskripsi}</p>}
      </div>

      {/* Daftar bab */}
      <div style={S.isi}>
        <div style={S.seksiLabel}>
          <FileText size={14} /> DAFTAR MATERI • {babList.length} BAGIAN
        </div>
        {babList.length === 0 ? (
          <div style={S.kosong}>
            Belum ada bab di materi ini.
            Admin/guru bisa menambahkannya lewat Manajer Materi.
          </div>
        ) : (
          <div style={S.list}>
            {babList.map((bab, i) => {
              const persen = persenBab(bab, progresMap[bab.id]);
              const selesai = persen === 100;
              const aktif = i === idxAktif;
              const soal = (bab.ujiPemahaman || []).length;
              return (
                <button key={bab.id} type="button"
                  onClick={() => navigate(`/siswa/belajar/${materiId}/${bab.id}`)}
                  style={{
                    ...S.kartuBab,
                    ...(aktif ? S.kartuBabAktif : null),
                  }}>
                  <span style={lingkaranNomor(selesai ? 'selesai' : aktif ? 'aktif' : 'biasa')}>
                    {selesai ? <CheckCircle2 size={18} /> : i + 1}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <span style={S.babJudul}>{bab.judul}</span>
                    <span style={S.babMeta}>
                      {selesai ? 'Selesai dibaca'
                        : persen > 0 ? `${persen}% selesai`
                          : 'Belum dibaca'}
                      {(bab.sections || []).length ? ` • ${(bab.sections).length} bagian` : ''}
                      {soal ? ` • ${soal} soal` : ''}
                      {bab.estimasiMenit ? ` • ±${bab.estimasiMenit} mnt` : ''}
                    </span>
                  </span>
                  <ChevronRight size={16} color={T.samar} />
                </button>
              );
            })}
          </div>
        )}
        <div style={S.footHint}>
          <Clock3 size={13} />
          Tip: selesaikan bab berurutan — setiap bab punya kuis
          pemantapan di tab Latihan Soal.
        </div>
      </div>
    </div>
  );
}

const S = {
  hero: { position: 'relative', overflow: 'hidden', padding: '16px 18px 22px', background: T.gradasiHero },
  heroGlow: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(circle at 82% 8%, rgba(255,255,255,.18), transparent 46%)',
  },
  backBtn: {
    position: 'relative', zIndex: 1, width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.25)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', marginBottom: 12,
  },
  heroRow: {
    position: 'relative', zIndex: 1, display: 'flex', gap: 14, alignItems: 'center',
    flexWrap: 'wrap',
  },
  heroCover: {
    width: 56, height: 68, borderRadius: 13, flexShrink: 0, fontSize: 28,
    background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  heroChips: { display: 'flex', gap: 6, marginBottom: 6 },
  heroChip: {
    background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)',
    color: '#fff', borderRadius: 8, padding: '3px 10px',
    fontSize: 10.5, fontWeight: 800,
  },
  heroJudul: { margin: 0, color: '#fff', fontSize: 21, fontWeight: 800, lineHeight: 1.3 },
  heroMeta: {
    margin: '4px 0 0', color: 'rgba(255,255,255,.8)', fontSize: 11.5,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  progresKanan: { marginLeft: 'auto', textAlign: 'right' },
  progresLabel: { color: 'rgba(255,255,255,.8)', fontSize: 10.5, fontWeight: 800, letterSpacing: .4 },
  progresAngka: { color: '#fff', fontSize: 20, fontWeight: 800, margin: '2px 0 5px' },
  heroDesk: {
    position: 'relative', zIndex: 1, margin: '12px 0 0',
    color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 1.6,
  },
  isi: { padding: '16px 16px 34px', maxWidth: 760, margin: '0 auto' },
  seksiLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11.5, fontWeight: 800, color: T.samar,
    letterSpacing: .5, marginBottom: 11,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  kartuBab: {
    display: 'flex', alignItems: 'center', gap: 13, width: '100%',
    ...kartuDasar, padding: '13px 15px', cursor: 'pointer',
    transition: 'transform .15s ease, box-shadow .15s ease',
  },
  kartuBabAktif: {
    border: `1.5px solid ${T.biru}`,
    boxShadow: '0 6px 18px rgba(30,155,240,.16)',
  },
  babJudul: {
    display: 'block', fontWeight: 800, fontSize: 13.5, color: T.judul,
    lineHeight: 1.35,
  },
  babMeta: { display: 'block', fontSize: 10.5, color: T.samar, marginTop: 3 },
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '34px 20px', fontSize: 13, lineHeight: 1.7, margin: 16,
  },
  btnKembali: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: T.biru, color: '#fff', border: 'none', borderRadius: 11,
    padding: '10px 17px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(30,155,240,.3)',
  },
  footHint: {
    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
    color: T.samar, fontSize: 11, marginTop: 20, textAlign: 'center',
  },
};
