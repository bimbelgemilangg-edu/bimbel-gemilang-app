// src/pages/student/belajar/BelajarHome.jsx
// ============================================================
// MATERI v2 -- BERANDA BELAJAR SISWA (route /siswa/belajar)
// Fase 1 rombak tampilan materi (docs/RENCANA-ROMBAK-MATERI.md).
//
// ⚠️ CATATAN DESAIN: gaya visual di file ini adalah PLACEHOLDER
// yang bersih & netral. Identitas visual final mengikuti FOTO
// DESAIN dari owner (lihat DOKUMEN-PROYEK.md Turn 4) -- struktur
// data/navigasi sudah final, styling yang akan disesuaikan.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Play, ChevronRight, BookOpen, Lock, FlaskConical,
} from 'lucide-react';
import {
  muatDaftarMateri, muatProgressSiswa, sedangModeContoh,
  bacaTerakhir, persenBab,
} from '../../../services/materiV2Service';

export default function BelajarHome() {
  const navigate = useNavigate();
  const nama = localStorage.getItem('studentName') || 'Siswa Gemilang';
  const studentId = localStorage.getItem('studentId') || '';
  const studentKelas =
    localStorage.getItem('studentKelas') ||
    localStorage.getItem('studentGrade') || '';

  const [materiList, setMateriList] = useState([]);
  const [progresMap, setProgresMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState('');
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [modeContoh, setModeContoh] = useState(false);
  const terakhir = bacaTerakhir();

  useEffect(() => {
    (async () => {
      const list = await muatDaftarMateri();
      setMateriList(list);
      setModeContoh(sedangModeContoh());
      setProgresMap(await muatProgressSiswa(studentId));
      setLoading(false);
    })();
  }, [studentId]);

  const mapelList = useMemo(() => {
    const set = new Set(materiList.map((m) => m.mapel).filter(Boolean));
    return ['Semua', ...Array.from(set).sort()];
  }, [materiList]);

  const terlihat = useMemo(() => materiList.filter((m) => {
    // Filter longgar di beranda: semua materi ditampilkan;
    // pencarian & filter mapel menyempitkan daftar.
    if (filterMapel !== 'Semua' && m.mapel !== filterMapel) return false;
    if (cari.trim()) {
      const q = cari.trim().toLowerCase();
      const teks = [m.judul, m.mapel, m.deskripsi]
        .filter(Boolean).join(' ').toLowerCase();
      if (!teks.includes(q)) return false;
    }
    return true;
  }), [materiList, filterMapel, cari]);

  const persenMateri = (m) => {
    const babs = m.bab || [];
    if (modeContoh && babs.length) {
      const total = babs.reduce((a, b) => a + persenBab(b, progresMap[b.id]), 0);
      return Math.round(total / babs.length);
    }
    // Non-contoh: daftar bab penuh dimuat di halaman daftar isi;
    // di beranda tampilkan progres ringkas dari field tercache.
    return Number(m.progresRingkas?.[studentId] ?? 0);
  };

  return (
    <div style={S.page}>
      {/* Kopf / sambutan */}
      <div style={S.hero}>
        <div style={S.heroGlow} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={S.sapa}>Halo, <b>{nama}</b> 👋</p>
          <h1 style={S.judul}>Mau belajar apa hari ini?</h1>
          <p style={S.sub}>
            {studentKelas ? `Kelas ${studentKelas} • ` : ''}
            Pilih materi, baca, lalu uji pemahamanmu.
          </p>
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
        {terakhir?.materiId && (
          <button type="button" style={S.lanjut}
            onClick={() => navigate(
              `/siswa/belajar/${terakhir.materiId}/${terakhir.babId}`
            )}>
            <span style={S.lanjutIcon}><Play size={15} fill="currentColor" /></span>
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span style={S.lanjutLabel}>Lanjutkan membaca</span>
              <span style={S.lanjutTitle}>{terakhir.judul || 'Bab terakhir'}</span>
            </span>
            <ChevronRight size={17} color="#6d5bd0" />
          </button>
        )}

        {/* Pencarian */}
        <div style={S.cariWrap}>
          <Search size={16} color="#94a3b8" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari materi atau mapel..."
            aria-label="Cari materi"
            style={S.cariInput}
          />
        </div>

        {/* Filter mapel */}
        <div style={S.chipRow}>
          {mapelList.map((mp) => (
            <button key={mp} type="button"
              onClick={() => setFilterMapel(mp)}
              style={{
                ...S.chip,
                ...(filterMapel === mp ? S.chipAktif : null),
              }}>
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
                  style={{ ...S.kartu, borderTop: `4px solid ${m.warna || '#4C6EF5'}` }}>
                  <div style={S.kartuTop}>
                    <span style={{ ...S.cover, background: `${m.warna || '#4C6EF5'}15` }}>
                      {m.emoji || '📘'}
                    </span>
                    {m.premium && (
                      <span style={S.badgePremium}><Lock size={10} /> Premium</span>
                    )}
                  </div>
                  <div style={S.kartuJudul}>{m.judul}</div>
                  <div style={S.kartuMeta}>
                    <BookOpen size={12} /> {m.mapel || '-'} • Kelas {m.kelas || '-'}
                  </div>
                  <div style={S.barLatar}>
                    <div style={{
                      ...S.barIsi,
                      width: `${persen}%`,
                      background: m.warna || '#4C6EF5',
                    }} />
                  </div>
                  <div style={S.kartuFoot}>
                    <span>{persen > 0 ? `${persen}% selesai` : 'Mulai belajar'}</span>
                    <ChevronRight size={15} color="#cbd5e1" />
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

// ---------- style placeholder (menunggu foto desain owner) ----------
const S = {
  page: { minHeight: '100vh', background: '#F6F7FB', fontFamily: 'sans-serif' },
  hero: {
    position: 'relative', overflow: 'hidden',
    padding: '22px 18px 26px',
    background: 'linear-gradient(150deg,#4338CA 0%,#6D28D9 60%,#1E1B4B 100%)',
  },
  heroGlow: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,.14), transparent 42%)',
  },
  sapa: { margin: 0, color: 'rgba(255,255,255,.8)', fontSize: 12.5 },
  judul: { margin: '4px 0 4px', color: '#fff', fontSize: 21, fontWeight: 800 },
  sub: { margin: 0, color: 'rgba(255,255,255,.72)', fontSize: 12.5, lineHeight: 1.5 },
  isi: { padding: '14px 16px 34px', maxWidth: 960, margin: '0 auto' },
  bannerContoh: {
    display: 'flex', gap: 8, alignItems: 'center',
    background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E',
    borderRadius: 12, padding: '9px 12px', fontSize: 11.5,
    lineHeight: 1.5, marginBottom: 12,
  },
  lanjut: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    background: '#fff', border: '1px solid #E4DEF9', borderRadius: 14,
    padding: '11px 13px', marginBottom: 12, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67,56,202,.07)',
  },
  lanjutIcon: {
    width: 34, height: 34, borderRadius: 11, background: '#6D28D9',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  lanjutLabel: {
    display: 'block', color: '#6D28D9', fontSize: 10.5, fontWeight: 800,
    letterSpacing: .3,
  },
  lanjutTitle: {
    display: 'block', color: '#334155', fontSize: 12.5, fontWeight: 700,
    marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cariWrap: {
    display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
    border: '1px solid #E7E9F2', borderRadius: 13, padding: '10px 12px',
    marginBottom: 10,
  },
  cariInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none',
    background: 'transparent', fontSize: 13, color: '#1e293b',
  },
  chipRow: {
    display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4,
    marginBottom: 12, scrollbarWidth: 'none',
  },
  chip: {
    flexShrink: 0, border: '1px solid #E1E4EF', background: '#fff',
    color: '#64748b', borderRadius: 999, padding: '6px 13px',
    fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  },
  chipAktif: {
    background: '#4338CA', borderColor: '#4338CA', color: '#fff',
  },
  kosong: {
    textAlign: 'center', color: '#8b93a7', background: '#fff',
    borderRadius: 16, padding: '34px 20px', fontSize: 13, lineHeight: 1.7,
  },
  grid: {
    display: 'grid', gap: 12,
    gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))',
  },
  kartu: {
    background: '#fff', borderRadius: 16, padding: 14,
    border: '1px solid #EDEFF6', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 3px 12px rgba(30,27,75,.05)',
    display: 'flex', flexDirection: 'column', gap: 7,
  },
  kartuTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cover: {
    width: 44, height: 44, borderRadius: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 22,
  },
  badgePremium: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A',
    borderRadius: 999, padding: '3px 8px', fontSize: 9.5, fontWeight: 800,
  },
  kartuJudul: { fontWeight: 800, fontSize: 14, color: '#1e293b', lineHeight: 1.35 },
  kartuMeta: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 11, color: '#94a3b8',
  },
  barLatar: { height: 6, borderRadius: 99, background: '#EEF0F7', overflow: 'hidden' },
  barIsi: { height: '100%', borderRadius: 99, transition: 'width .3s ease' },
  kartuFoot: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 11, fontWeight: 700, color: '#64748b',
  },
};
