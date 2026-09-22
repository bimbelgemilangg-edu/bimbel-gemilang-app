// src/pages/student/belajar/BelajarHome.jsx
// ============================================================
// MATERI v2 -- BERANDA BELAJAR SISWA (route /siswa/belajar)
// Visual: tema "Gemilang Biru" mengikuti mockup resmi owner
// (docs/desain/mockup-ui-gemilang.png) -- Turn 5.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Play, ChevronRight, BookOpen, Lock, FlaskConical, Star,
} from 'lucide-react';
import {
  muatDaftarMateri, muatProgressSiswa, sedangModeContoh,
  bacaTerakhir, simpanTerakhir, muatMateriDanBab,
  persenBab, muatProfilAkses, cocokMateriUntukSiswa,
} from '../../../services/materiV2Service';
import MaskotAstronot from '../../../components/MaskotAstronot';
import {
  T, kartuDasar, chip, barLuar, barDalam, halamanDasar,
} from './tema';

export default function BelajarHome() {
  const navigate = useNavigate();
  const nama = localStorage.getItem('studentName') || 'Siswa Gemilang';
  const studentId = localStorage.getItem('studentId') || '';
  const studentKelas =
    localStorage.getItem('studentKelas') ||
    localStorage.getItem('studentGrade') || '';

  const [materiList, setMateriList] = useState([]);
  const [progresMap, setProgresMap] = useState({});
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState('');
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [modeContoh, setModeContoh] = useState(false);
  const [terakhirOk, setTerakhirOk] = useState(false);
  const terakhir = bacaTerakhir();

  // ANTI-HANTU (Turn 29): riwayat "lanjutkan membaca" diverifikasi dulu;
  // bila materi/bab-nya sudah dihapus admin, riwayat dibersihkan agar
  // tidak terus memanggil dokumen yang tidak ada.
  useEffect(() => {
    let hidup = true;
    (async () => {
      if (!terakhir?.materiId) { if (hidup) setTerakhirOk(false); return; }
      const { materi, babList } = await muatMateriDanBab(terakhir.materiId);
      const ada = !!materi && (babList || []).some((b) => b.id === terakhir.babId);
      if (!hidup) return;
      if (!ada) { simpanTerakhir(null); setTerakhirOk(false); }
      else setTerakhirOk(true);
    })();
    return () => { hidup = false; };
  }, [terakhir]);

  useEffect(() => {
    (async () => {
      const list = await muatDaftarMateri();
      setMateriList(list);
      setModeContoh(sedangModeContoh());
      setProgresMap(await muatProgressSiswa(studentId));
      // Filter jenjang/program: materi harus sesuai jenjang &
      // program siswa (banyak program bimbel) -- request owner.
      setProfil(await muatProfilAkses(
        studentId, studentKelas,
        localStorage.getItem('studentProgram') || ''
      ));
      setLoading(false);
    })();
  }, [studentId, studentKelas]);

  const mapelList = useMemo(() => {
    const set = new Set(materiList.map((m) => m.mapel).filter(Boolean));
    return ['Semua', ...Array.from(set).sort()];
  }, [materiList]);

  const terlihat = useMemo(() => materiList.filter((m) => {
    if (filterMapel !== 'Semua' && m.mapel !== filterMapel) return false;
    if (cari.trim()) {
      const q = cari.trim().toLowerCase();
      const teks = [m.judul, m.mapel, m.deskripsi]
        .filter(Boolean).join(' ').toLowerCase();
      if (!teks.includes(q)) return false;
    }
    // Kesesuaian jenjang & program (aturan bersama di service)
    if (profil && !cocokMateriUntukSiswa(m, profil, studentKelas)) return false;
    return true;
  }), [materiList, filterMapel, cari, profil, studentKelas]);

  const persenMateri = (m) => {
    const babs = m.bab || [];
    if (modeContoh && babs.length) {
      const total = babs.reduce((a, b) => a + persenBab(b, progresMap[b.id]), 0);
      return Math.round(total / babs.length);
    }
    return Number(m.progresRingkas?.[studentId] ?? 0);
  };

  return (
    <div style={halamanDasar}>
      {/* Hero biru gradasi + maskot (gaya sidebar mockup) */}
      <div style={S.hero}>
        <div style={S.heroGlow} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 14, alignItems: 'center' }}>
          <MaskotAstronot size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={S.sapa}>Halo, <b>{nama}</b> 👋</p>
            <h1 style={S.judul}>Mau belajar apa hari ini?</h1>
            <p style={S.sub}>
              {studentKelas ? `Kelas ${studentKelas} • ` : ''}
              Baca materi, tonton video, lalu uji pemahamanmu.
            </p>
            <span style={S.level}>
              <Star size={11} fill="currentColor" /> Belajar Nyaman, Prestasi Gemilang!
            </span>
          </div>
        </div>
      </div>

      <div style={S.isi}>
        {modeContoh && (
          <div style={S.bannerContoh}>
            <FlaskConical size={15} />
            <span>
              <b>Mode contoh</b> — materi asli belum ada di server.
              Isi contoh ini otomatis hilang setelah admin menerbitkan
              materi sungguhan.
            </span>
          </div>
        )}

        {/* Lanjutkan membaca */}
        {terakhirOk && terakhir?.materiId && (
          <button type="button" style={S.lanjut}
            onClick={() => navigate(
              `/siswa/belajar/${terakhir.materiId}/${terakhir.babId}`
            )}>
            <span style={S.lanjutIcon}><Play size={14} fill="currentColor" /></span>
            <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <span style={S.lanjutLabel}>LANJUTKAN MEMBACA</span>
              <span style={S.lanjutTitle}>{terakhir.judul || 'Bab terakhir'}</span>
            </span>
            <ChevronRight size={17} color={T.biru} />
          </button>
        )}

        {/* Pencarian pill */}
        <div style={S.cariWrap}>
          <Search size={16} color={T.samar} />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari materi, bab, atau kata kunci..."
            aria-label="Cari materi"
            style={S.cariInput}
          />
        </div>

        {/* Filter mapel */}
        <div style={S.chipRow}>
          {mapelList.map((mp) => (
            <button key={mp} type="button"
              onClick={() => setFilterMapel(mp)}
              style={chip(filterMapel === mp)}>
              {mp}
            </button>
          ))}
        </div>

        {/* Daftar materi */}
        {loading ? (
          <div style={S.kosong}>Memuat materi...</div>
        ) : terlihat.length === 0 ? (
          <div style={S.kosong}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
            Belum ada materi yang cocok. Coba kata kunci lain,
            atau tunggu admin menerbitkan materi baru.
          </div>
        ) : (
          <div style={S.grid}>
            {terlihat.map((m) => {
              const persen = persenMateri(m);
              return (
                <button key={m.id} type="button"
                  onClick={() => navigate(`/siswa/belajar/${m.id}`)}
                  style={S.kartu}>
                  <div style={S.kartuTop}>
                    <span style={S.cover}>{m.emoji || '📘'}</span>
                    {m.premium && (
                      <span style={S.badgePremium}><Lock size={10} /> Premium</span>
                    )}
                  </div>
                  <div style={S.kartuJudul}>{m.judul}</div>
                  <div style={S.kartuMeta}>
                    <BookOpen size={12} /> {m.mapel || '-'} • Kelas {m.kelas || '-'}
                  </div>
                  <div style={barLuar(6)}>
                    <div style={barDalam(persen)} />
                  </div>
                  <div style={S.kartuFoot}>
                    <span>{persen > 0 ? `${persen}% selesai` : 'Mulai belajar'}</span>
                    <ChevronRight size={15} color={T.samar} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  hero: {
    position: 'relative', overflow: 'hidden',
    padding: '22px 20px 26px', background: T.gradasiHero,
  },
  heroGlow: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(circle at 85% 10%, rgba(255,255,255,.18), transparent 45%)',
  },
  sapa: { margin: 0, color: 'rgba(255,255,255,.85)', fontSize: 12.5 },
  judul: { margin: '4px 0 4px', color: '#fff', fontSize: 22, fontWeight: 800 },
  sub: { margin: 0, color: 'rgba(255,255,255,.78)', fontSize: 12.5, lineHeight: 1.5 },
  level: {
    display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
    background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)',
    color: '#FFE9A8', borderRadius: 999, padding: '4px 11px',
    fontSize: 10.5, fontWeight: 800,
  },
  isi: { padding: '14px 16px 34px', maxWidth: 1000, margin: '0 auto' },
  bannerContoh: {
    display: 'flex', gap: 8, alignItems: 'center',
    background: T.amberLatar, border: `1px solid ${T.amberGaris}`, color: T.amberTeks,
    borderRadius: 12, padding: '9px 12px', fontSize: 11.5,
    lineHeight: 1.5, marginBottom: 12,
  },
  lanjut: {
    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
    ...kartuDasar, padding: '11px 13px', marginBottom: 12, cursor: 'pointer',
  },
  lanjutIcon: {
    width: 34, height: 34, borderRadius: 10, background: T.biru,
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 4px 12px rgba(30,155,240,.35)',
  },
  lanjutLabel: {
    display: 'block', color: T.biruGelap, fontSize: 10, fontWeight: 800,
    letterSpacing: .6,
  },
  lanjutTitle: {
    display: 'block', color: T.judul, fontSize: 13, fontWeight: 700,
    marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cariWrap: {
    display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
    border: `1px solid ${T.garis}`, borderRadius: 999, padding: '11px 16px',
    marginBottom: 10, boxShadow: T.bayanganKecil,
  },
  cariInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none',
    background: 'transparent', fontSize: 13, color: T.teks, fontFamily: 'inherit',
  },
  chipRow: {
    display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4,
    marginBottom: 14, scrollbarWidth: 'none',
  },
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '34px 20px', fontSize: 13, lineHeight: 1.7,
  },
  grid: {
    display: 'grid', gap: 13,
    gridTemplateColumns: 'repeat(auto-fill,minmax(235px,1fr))',
  },
  kartu: {
    ...kartuDasar, padding: 15, cursor: 'pointer', textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 8, width: '100%',
    transition: 'transform .15s ease, box-shadow .15s ease',
  },
  kartuTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cover: {
    width: 46, height: 46, borderRadius: 13, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 22,
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
  },
  badgePremium: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    background: T.amberLatar, color: T.amberTeks, border: `1px solid ${T.amberGaris}`,
    borderRadius: 999, padding: '3px 9px', fontSize: 9.5, fontWeight: 800,
  },
  kartuJudul: { fontWeight: 800, fontSize: 14.5, color: T.judul, lineHeight: 1.35 },
  kartuMeta: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 11, color: T.samar,
  },
  kartuFoot: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 11, fontWeight: 700, color: T.samar,
  },
};
