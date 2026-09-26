// src/pages/teacher/presentasi/PptVersiGuru.jsx
// ============================================================
// FASE 4.1 -- PPT VERSIKU (route /guru/ppt-ku)
// Request owner Turn 14: admin mengunggah materi inti, GURU boleh
// mengunggah PPT versinya sendiri per bab. Versi guru dipakai di
// panggung presentasinya & layar siswa yang mengikuti sesi;
// siswa belajar mandiri tetap melihat slide resmi admin.
// Disimpan di bab.slideVersiGuru[guruId] (Supabase Storage).
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Presentation, Upload, Trash2, CheckCircle2, BookOpen,
} from 'lucide-react';
import {
  muatDaftarMateri, muatMateriDanBab, simpanSlideVersiGuru,
} from '../../../services/materiV2Service';
import { bacaIdentitasGuru } from '../../../services/sesiPresentasiService';
import { uploadElearningFile } from '../../../services/uploadService';
import {
  T, kartuDasar, halamanDasar, lingkaranNomor,
} from '../../student/belajar/tema';

export default function PptVersiGuru({ embed = false }) {
  const { guruId, guruNama } = bacaIdentitasGuru();
  const [materiList, setMateriList] = useState([]);
  const [babMap, setBabMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [pesan, setPesan] = useState('');
  const fileRefs = useRef({});

  useEffect(() => {
    let hidup = true;
    (async () => {
      const list = await muatDaftarMateri();
      if (!hidup) return;
      setMateriList(list);
      setLoading(false);
    })();
    return () => { hidup = false; };
  }, []);

  const bukaBab = async (materiId) => {
    if (babMap[materiId]) return;
    const { babList } = await muatMateriDanBab(materiId);
    setBabMap((m) => ({ ...m, [materiId]: babList }));
  };

  const upload = async (materiId, babId, file) => {
    if (!file) return;
    const key = `${materiId}_${babId}`;
    setUploading(key);
    setPesan('');
    try {
      const res = await uploadElearningFile(file, 'materi-v2');
      const url = res?.downloadURL || res?.url || '';
      if (!url) throw new Error('URL tidak dikembalikan Supabase.');
      await simpanSlideVersiGuru(materiId, babId, guruId, url);
      setBabMap((m) => ({
        ...m,
        [materiId]: (m[materiId] || []).map((b) => (b.id === babId
          ? { ...b, slideVersiGuru: { ...(b.slideVersiGuru || {}), [guruId]: url } }
          : b)),
      }));
      setPesan(`✅ PPT versimu terpasang: ${file.name}`);
    } catch (e) {
      setPesan(`Upload gagal: ${e.message}`);
    }
    setUploading('');
  };

  const hapusVersi = async (materiId, babId) => {
    if (!window.confirm('Hapus PPT versimu untuk bab ini?')) return;
    try {
      await simpanSlideVersiGuru(materiId, babId, guruId, null);
      setBabMap((m) => ({
        ...m,
        [materiId]: (m[materiId] || []).map((b) => {
          if (b.id !== babId) return b;
          const peta = { ...(b.slideVersiGuru || {}) };
          delete peta[guruId];
          return { ...b, slideVersiGuru: peta };
        }),
      }));
    } catch (e) {
      setPesan(`Gagal hapus: ${e.message}`);
    }
  };

  return (
    <div style={embed ? undefined : halamanDasar}>
      {!embed && (
      <div style={S.hero}>
        <div style={S.heroIkon}><Presentation size={22} /></div>
        <div>
          <h1 style={S.heroJudul}>PPT Versiku</h1>
          <p style={S.heroSub}>
            {guruNama} — unggah slide versimu sendiri per bab.
            Versimu otomatis dipakai di panggung presentasimu
            dan layar siswa yang mengikuti sesimu.
          </p>
        </div>
      </div>
      )}

      <div style={embed ? undefined : S.isi}>
        {pesan && (
          <div style={pesan.startsWith('✅') ? S.ok : S.err}>{pesan}</div>
        )}
        {loading ? (
          <div style={S.kosong}>Memuat materi...</div>
        ) : materiList.length === 0 ? (
          <div style={S.kosong}>
            Belum ada materi aktif. Materi inti diterbitkan admin
            lewat Manajer Materi v2.
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
                  </button>
                  {babs && (
                    <div style={S.babList}>
                      {babs.map((b, i) => {
                        const versiKu = b.slideVersiGuru?.[guruId];
                        const key = `${m.id}_${b.id}`;
                        return (
                          <div key={b.id} style={S.babItem}>
                            <span style={lingkaranNomor('biasa')}>{i + 1}</span>
                            <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                              <span style={S.babJudul}>{b.judul}</span>
                              <span style={S.babMeta}>
                                {b.slideUrl ? '📽 resmi ada' : '📽 resmi belum ada'}
                                {' • '}
                                {versiKu ? '✅ versiku terpasang' : 'versiku belum ada'}
                              </span>
                            </span>
                            <input
                              ref={(el) => { fileRefs.current[key] = el; }}
                              type="file" accept=".ppt,.pptx" style={{ display: 'none' }}
                              onChange={(e) => upload(m.id, b.id, e.target.files?.[0])}
                            />
                            <button type="button" style={S.btnKecil}
                              disabled={uploading === key}
                              onClick={() => fileRefs.current[key]?.click()}>
                              <Upload size={12} />
                              {uploading === key ? '…' : versiKu ? 'Ganti' : 'Upload'}
                            </button>
                            {versiKu && (
                              <button type="button"
                                style={{ ...S.btnKecil, color: '#B91C1C' }}
                                onClick={() => hapusVersi(m.id, b.id)}>
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
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
        <div style={S.foot}>
          <CheckCircle2 size={13} />
          Slide resmi admin tetap tersimpan; versimu hanya menimpa
          tampilan saat KELASMU berlangsung (siswa belajar mandiri
          melihat versi resmi).
        </div>
      </div>
    </div>
  );
}

const S = {
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
  heroSub: { margin: '3px 0 0', color: 'rgba(255,255,255,.8)', fontSize: 12.5, lineHeight: 1.5 },
  isi: { padding: '16px 18px 40px', maxWidth: 980, margin: '0 auto' },
  ok: {
    background: T.hijauLatar, border: `1px solid ${T.hijauGaris}`,
    color: T.hijauTeks, borderRadius: 10, padding: '9px 13px',
    fontSize: 12.5, marginBottom: 12,
  },
  err: {
    background: T.merahLatar, border: `1px solid ${T.merahGaris}`,
    color: '#B91C1C', borderRadius: 10, padding: '9px 13px',
    fontSize: 12.5, marginBottom: 12,
  },
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '34px 20px', fontSize: 13, lineHeight: 1.7,
  },
  grid: { display: 'grid', gap: 13, gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))' },
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
  babList: { display: 'flex', flexDirection: 'column', gap: 7, padding: '0 12px 13px' },
  babItem: {
    display: 'flex', gap: 9, alignItems: 'center',
    background: T.latar, border: `1px solid ${T.garisLembut}`,
    borderRadius: 11, padding: '9px 10px',
  },
  babJudul: { display: 'block', fontWeight: 700, fontSize: 12.5, color: T.judul },
  babMeta: { display: 'block', fontSize: 10.5, color: T.samar, marginTop: 2 },
  babKosong: { color: T.samar, fontSize: 11.5, textAlign: 'center', padding: 6 },
  btnKecil: {
    display: 'inline-flex', gap: 5, alignItems: 'center',
    background: '#fff', border: `1px solid ${T.garis}`, color: T.biruGelap,
    borderRadius: 9, padding: '6px 10px', fontSize: 11, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  },
  foot: {
    display: 'flex', gap: 7, alignItems: 'center', justifyContent: 'center',
    color: T.samar, fontSize: 11.5, marginTop: 18, textAlign: 'center',
  },
};
