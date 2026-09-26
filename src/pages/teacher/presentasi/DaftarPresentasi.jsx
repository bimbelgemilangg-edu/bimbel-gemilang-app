// src/pages/teacher/presentasi/DaftarPresentasi.jsx
// ============================================================
// FASE 3 -- DAFTAR PRESENTASI GURU (route /guru/presentasi)
// Pilih materi & bab untuk dibuka di Panggung Presentasi.
// Tema Gemilang Biru (docs/desain/mockup-ui-gemilang.png).
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Projector, ChevronRight, Radio, BookOpen, FlaskConical,
} from 'lucide-react';
import {
  muatDaftarMateri, muatMateriDanBab, sedangModeContoh,
} from '../../../services/materiV2Service';
import { cariSesiAktif, bacaIdentitasGuru } from '../../../services/sesiPresentasiService';
// Turn 91: menu Presentasi & PPT Versiku DIGABUNG — halaman ini kini
// punya 2 tab: "Panggung & Baca" dan "PPT Versiku" (komponen embed).
import PptVersiGuru from './PptVersiGuru';
import { T, kartuDasar, halamanDasar, lingkaranNomor } from '../../student/belajar/tema';

export default function DaftarPresentasi() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('panggung');
  const [materiList, setMateriList] = useState([]);
  const [babMap, setBabMap] = useState({});
  const [sesiAktif, setSesiAktif] = useState(null);
  const [modeContoh, setModeContoh] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await muatDaftarMateri();
      setMateriList(list);
      setModeContoh(sedangModeContoh());
      // Turn 76: banner sesi hanya milik SAYA (guru lain bisa paralel).
      setSesiAktif(await cariSesiAktif({ guruId: bacaIdentitasGuru().guruId }));
      setLoading(false);
    })();
  }, []);

  const bukaBab = async (materiId) => {
    if (babMap[materiId]) return;
    const { babList } = await muatMateriDanBab(materiId);
    setBabMap((m) => ({ ...m, [materiId]: babList }));
  };

  return (
    <div style={halamanDasar}>
      <div style={S.hero}>
        <div style={S.heroIkon}><Projector size={22} /></div>
        <div>
          <h1 style={S.heroJudul}>Panggung Presentasi</h1>
          <p style={S.heroSub}>
            Layar kelas dan layar siswa tampil sama persis —
            bedah materi & latihan bersama secara realtime.
          </p>
        </div>
      </div>

      <div style={S.isi}>
        {/* Turn 91: satu menu, dua halaman (tab). */}
        <div style={S.tabRow}>
          <button type="button" style={tab === 'panggung' ? S.tabAktif : S.tab}
            onClick={() => setTab('panggung')}>
            <Projector size={14} /> Panggung & Baca
          </button>
          <button type="button" style={tab === 'pptku' ? S.tabAktif : S.tab}
            onClick={() => setTab('pptku')}>
            <BookOpen size={14} /> PPT Versiku
          </button>
        </div>
        {tab === 'pptku' ? (
          <PptVersiGuru embed />
        ) : (
          <>
        {sesiAktif && (
          <button type="button" style={S.bannerSesi}
            onClick={() => navigate(
              `/guru/presentasi/${sesiAktif.materiId}/${sesiAktif.babId}`)}>
            <Radio size={15} />
            <span style={{ flex: 1, textAlign: 'left' }}>
              <b>Sesi masih aktif</b> — lanjutkan ke panggung.
            </span>
            <ChevronRight size={16} />
          </button>
        )}
        {modeContoh && (
          <div style={S.bannerContoh}>
            <FlaskConical size={14} />
            Mode contoh: materi asli belum ada; pakai materi contoh dulu.
          </div>
        )}

        {loading ? (
          <div style={S.kosong}>Memuat materi...</div>
        ) : materiList.length === 0 ? (
          <div style={S.kosong}>
            Belum ada materi aktif. Materi v2 dapat diterbitkan
            lewat Manajer Materi (Fase 4).
          </div>
        ) : (
          <div style={S.grid}>
            {materiList.map((m) => {
              const babs = babMap[m.id];
              return (
                <div key={m.id} style={S.kartu}>
                  <button type="button" style={S.kartuHead}
                    onClick={() => bukaBab(m.id)}>
                    <span style={S.cover}>{m.emoji || '📘'}</span>
                    <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <span style={S.kartuJudul}>{m.judul}</span>
                      <span style={S.kartuMeta}>
                        <BookOpen size={12} /> {m.mapel} • Kelas {m.kelas}
                      </span>
                    </span>
                    <ChevronRight size={16} color={T.samar} />
                  </button>
                  {babs && (
                    <div style={S.babList}>
                      {babs.map((b, i) => (
                        <div key={b.id} style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                          <button type="button" style={{ ...S.babItem, flex: 1 }}
                            onClick={() => navigate(`/guru/presentasi/${m.id}/${b.id}`)}>
                            <span style={lingkaranNomor('biasa')}>{i + 1}</span>
                            <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                              <span style={S.babJudul}>{b.judul}</span>
                              <span style={S.babMeta}>
                                {(b.sections || []).length} bagian •
                                {' '}{(b.ujiPemahaman || []).length} soal
                              </span>
                            </span>
                            <Projector size={15} color={T.biru} />
                          </button>
                          {/* Turn 91: guru bisa BACA materi seperti versi siswa. */}
                          <button type="button" title="Baca materi seperti versi siswa"
                            style={S.bacaBtn}
                            onClick={() => navigate(`/guru/belajar/${m.id}/${b.id}`)}>
                            📖
                          </button>
                        </div>
                      ))}
                      {babs.length === 0 && (
                        <div style={S.babKosong}>Belum ada bab.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  tabRow: { display: 'flex', gap: 8, marginBottom: 14 },
  tab: {
    display: 'inline-flex', gap: 7, alignItems: 'center',
    border: `1px solid ${T.garis}`, background: '#fff', color: T.teks,
    borderRadius: 999, padding: '8px 15px', fontSize: 12.5, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  tabAktif: {
    display: 'inline-flex', gap: 7, alignItems: 'center',
    border: '1px solid transparent', background: T.biru, color: '#fff',
    borderRadius: 999, padding: '8px 15px', fontSize: 12.5, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  bacaBtn: {
    flexShrink: 0, width: 40, borderRadius: 12, border: `1px solid ${T.garis}`,
    background: '#fff', cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  hero: {
    display: 'flex', gap: 13, alignItems: 'center',
    padding: '20px 22px', background: T.gradasiHero,
  },
  heroIkon: {
    width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,.18)',
    border: '1px solid rgba(255,255,255,.28)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroJudul: { margin: 0, color: '#fff', fontSize: 20, fontWeight: 800 },
  heroSub: { margin: '3px 0 0', color: 'rgba(255,255,255,.8)', fontSize: 12.5 },
  isi: { padding: '16px 18px 40px', maxWidth: 980, margin: '0 auto' },
  bannerSesi: {
    display: 'flex', gap: 9, alignItems: 'center', width: '100%',
    background: T.hijauLatar, border: `1px solid ${T.hijauGaris}`,
    color: T.hijauTeks, borderRadius: 12, padding: '11px 14px',
    fontSize: 12.5, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
    fontFamily: 'inherit',
  },
  bannerContoh: {
    display: 'flex', gap: 8, alignItems: 'center',
    background: T.amberLatar, border: `1px solid ${T.amberGaris}`,
    color: T.amberTeks, borderRadius: 12, padding: '9px 13px',
    fontSize: 11.5, marginBottom: 12,
  },
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '34px 20px', fontSize: 13, lineHeight: 1.7,
  },
  grid: { display: 'grid', gap: 13, gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' },
  kartu: { ...kartuDasar, overflow: 'hidden' },
  kartuHead: {
    display: 'flex', gap: 12, alignItems: 'center', width: '100%',
    background: 'none', border: 'none', padding: 14, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cover: {
    width: 44, height: 44, borderRadius: 12, background: T.kotakBiru,
    border: `1px solid ${T.kotakBiruGaris}`, fontSize: 21,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  kartuJudul: { display: 'block', fontWeight: 800, fontSize: 14, color: T.judul },
  kartuMeta: {
    display: 'flex', gap: 4, alignItems: 'center',
    fontSize: 11, color: T.samar, marginTop: 2,
  },
  babList: {
    display: 'flex', flexDirection: 'column', gap: 7,
    padding: '0 12px 13px',
  },
  babItem: {
    display: 'flex', gap: 10, alignItems: 'center', width: '100%',
    background: T.latar, border: `1px solid ${T.garisLembut}`,
    borderRadius: 11, padding: '9px 10px', cursor: 'pointer', fontFamily: 'inherit',
  },
  babJudul: { display: 'block', fontWeight: 700, fontSize: 12.5, color: T.judul },
  babMeta: { display: 'block', fontSize: 10.5, color: T.samar, marginTop: 2 },
  babKosong: { color: T.samar, fontSize: 11.5, textAlign: 'center', padding: 6 },
};
