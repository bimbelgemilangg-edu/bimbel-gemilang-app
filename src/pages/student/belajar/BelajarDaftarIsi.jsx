// src/pages/student/belajar/BelajarDaftarIsi.jsx
// ============================================================
// MATERI v2 -- DAFTAR ISI (route /siswa/belajar/:materiId)
// Fase 1 rombak tampilan materi (docs/RENCANA-ROMBAK-MATERI.md).
// ⚠️ Gaya visual PLACEHOLDER -- final mengikuti foto desain owner.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, CheckCircle2, Clock3, FileText,
} from 'lucide-react';
import {
  muatMateriDanBab, muatProgressSiswa, persenBab,
} from '../../../services/materiV2Service';

export default function BelajarDaftarIsi() {
  const { materiId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '';

  const [materi, setMateri] = useState(null);
  const [babList, setBabList] = useState([]);
  const [progresMap, setProgresMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { materi: m, babList: bl } = await muatMateriDanBab(materiId);
      setMateri(m);
      setBabList(bl);
      setProgresMap(await muatProgressSiswa(studentId));
      setLoading(false);
    })();
  }, [materiId, studentId]);

  const warna = materi?.warna || '#4C6EF5';

  const progresTotal = useMemo(() => {
    if (!babList.length) return 0;
    const total = babList.reduce(
      (a, b) => a + persenBab(b, progresMap[b.id]), 0);
    return Math.round(total / babList.length);
  }, [babList, progresMap]);

  const totalMenit = useMemo(
    () => babList.reduce((a, b) => a + (Number(b.estimasiMenit) || 0), 0),
    [babList]);

  if (loading) {
    return <div style={S.page}><div style={S.kosong}>Memuat materi...</div></div>;
  }
  if (!materi) {
    return (
      <div style={S.page}>
        <div style={S.kosong}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🤔</div>
          Materi tidak ditemukan atau belum diterbitkan.
          <div style={{ marginTop: 14 }}>
            <button type="button" style={S.btnBack}
              onClick={() => navigate('/siswa/belajar')}>
              <ArrowLeft size={15} /> Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Hero materi */}
      <div style={{ ...S.hero, background: `linear-gradient(150deg, ${warna} 0%, #1E1B4B 100%)` }}>
        <div style={S.heroGlow} />
        <button type="button" style={S.backBtn} aria-label="Kembali"
          onClick={() => navigate('/siswa/belajar')}>
          <ArrowLeft size={19} />
        </button>
        <div style={S.heroRow}>
          <span style={S.heroCover}>{materi.emoji || '📘'}</span>
          <div style={{ flex: 1 }}>
            <h1 style={S.heroJudul}>{materi.judul}</h1>
            <p style={S.heroMeta}>
              {materi.mapel || '-'} • Kelas {materi.kelas || '-'} •
              {' '}{babList.length} bab
              {totalMenit > 0 ? ` • ±${totalMenit} menit` : ''}
            </p>
          </div>
        </div>
        {materi.deskripsi && <p style={S.heroDesk}>{materi.deskripsi}</p>}
        {/* Progres keseluruhan */}
        <div style={S.progresBox}>
          <div style={S.progresRow}>
            <span>Progres belajarmu</span>
            <b>{progresTotal}%</b>
          </div>
          <div style={S.barLatar}>
            <div style={{ ...S.barIsi, width: `${progresTotal}%` }} />
          </div>
        </div>
      </div>

      {/* Daftar bab */}
      <div style={S.isi}>
        <div style={S.seksiLabel}>
          <FileText size={14} /> DAFTAR BAB
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
              const soal = (bab.ujiPemahaman || []).length;
              return (
                <button key={bab.id} type="button"
                  onClick={() => navigate(`/siswa/belajar/${materiId}/${bab.id}`)}
                  style={S.kartuBab}>
                  <span style={{
                    ...S.nomor,
                    background: selesai ? '#DCFCE7' : `${warna}14`,
                    color: selesai ? '#16A34A' : warna,
                  }}>
                    {selesai ? <CheckCircle2 size={18} /> : i + 1}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    <span style={S.babJudul}>{bab.judul}</span>
                    <span style={S.babMeta}>
                      {(bab.sections || []).length} bagian
                      {soal ? ` • ${soal} soal pemantapan` : ''}
                      {bab.estimasiMenit ? ` • ±${bab.estimasiMenit} mnt` : ''}
                    </span>
                    {persen > 0 && persen < 100 && (
                      <span style={S.barLatarKecil}>
                        <span style={{
                          ...S.barIsiKecil,
                          width: `${persen}%`,
                          background: warna,
                        }} />
                      </span>
                    )}
                  </span>
                  <span style={{
                    ...S.persen,
                    color: selesai ? '#16A34A' : '#94a3b8',
                  }}>
                    {selesai ? 'Selesai' : persen > 0 ? `${persen}%` : ''}
                  </span>
                  <ChevronRight size={16} color="#cbd5e1" />
                </button>
              );
            })}
          </div>
        )}
        <div style={S.footHint}>
          <Clock3 size={13} />
          Tip: selesaikan bab berurutan — setiap bab punya kuis
          pemantapan di ujungnya.
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#F6F7FB', fontFamily: 'sans-serif' },
  hero: { position: 'relative', overflow: 'hidden', padding: '16px 16px 20px' },
  heroGlow: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(circle at 80% 10%, rgba(255,255,255,.15), transparent 45%)',
  },
  backBtn: {
    position: 'relative', zIndex: 1, width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(255,255,255,.16)', border: 'none', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', marginBottom: 12,
  },
  heroRow: {
    position: 'relative', zIndex: 1, display: 'flex', gap: 12, alignItems: 'center',
  },
  heroCover: {
    width: 54, height: 66, borderRadius: 12, flexShrink: 0, fontSize: 27,
    background: 'rgba(255,255,255,.16)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  heroJudul: { margin: 0, color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1.3 },
  heroMeta: { margin: '3px 0 0', color: 'rgba(255,255,255,.75)', fontSize: 11.5 },
  heroDesk: {
    position: 'relative', zIndex: 1, margin: '10px 0 0',
    color: 'rgba(255,255,255,.85)', fontSize: 12, lineHeight: 1.55,
  },
  progresBox: { position: 'relative', zIndex: 1, marginTop: 14 },
  progresRow: {
    display: 'flex', justifyContent: 'space-between',
    color: 'rgba(255,255,255,.85)', fontSize: 11, fontWeight: 700, marginBottom: 5,
  },
  barLatar: { height: 7, borderRadius: 99, background: 'rgba(255,255,255,.2)', overflow: 'hidden' },
  barIsi: { height: '100%', borderRadius: 99, background: '#fff', transition: 'width .3s ease' },
  isi: { padding: '16px 16px 34px', maxWidth: 720, margin: '0 auto' },
  seksiLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11.5, fontWeight: 800, color: '#64748b',
    letterSpacing: .4, marginBottom: 10,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  kartuBab: {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
    background: '#fff', border: '1px solid #EDEFF6', borderRadius: 14,
    padding: '12px 13px', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(30,27,75,.04)',
  },
  nomor: {
    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 13,
  },
  babJudul: {
    display: 'block', fontWeight: 700, fontSize: 13.5, color: '#1e293b',
    lineHeight: 1.35,
  },
  babMeta: { display: 'block', fontSize: 10.5, color: '#94a3b8', marginTop: 2 },
  barLatarKecil: {
    display: 'block', height: 4, borderRadius: 99, background: '#EEF0F7',
    marginTop: 6, overflow: 'hidden', maxWidth: 180,
  },
  barIsiKecil: { display: 'block', height: '100%', borderRadius: 99 },
  persen: { fontSize: 10.5, fontWeight: 800, minWidth: 46, textAlign: 'right' },
  kosong: {
    textAlign: 'center', color: '#8b93a7', background: '#fff',
    borderRadius: 16, padding: '34px 20px', fontSize: 13, lineHeight: 1.7,
    margin: 16,
  },
  btnBack: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#4338CA', color: '#fff', border: 'none', borderRadius: 10,
    padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
  },
  footHint: {
    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
    color: '#94a3b8', fontSize: 11, marginTop: 18, textAlign: 'center',
  },
};
