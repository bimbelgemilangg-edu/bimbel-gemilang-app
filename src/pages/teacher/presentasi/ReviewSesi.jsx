// src/pages/teacher/presentasi/ReviewSesi.jsx
// ============================================================
// REVIEW SESI & LEADERBOARD (Turn 94 — arahan owner):
// setelah ujian selesai (bahkan bila sesi terlanjur diakhiri),
// guru bisa membuka kembali:
//   1. 🏆 LEADERBOARD sesi (skor per siswa, medali, yang belum kumpul)
//   2. 🎯 BEDAH SOAL per nomor: distribusi jawaban seluruh kelas,
//      kunci, tingkat kebenaran, dan pembahasan dua jalur — untuk
//      dibahas bersama di proyektor (siswa berani maju membahas).
// Data dibaca dari sesi_kelas/{id}: doc sesi + peserta/ + jawaban/
// + ujian/ — permanen, tidak hilang saat sesi diakhiri.
// Route: /guru/review-sesi/:sesiId
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MathText } from '../../../components/MathText';
import { TeksSoal } from '../../student/belajar/BelajarReader';
import PembahasanBox from '../../../components/belajar/PembahasanBox';
import { T, kartuDasar, halamanDasar, tombolPill } from '../../student/belajar/tema';
import { ArrowLeft, Trophy, RefreshCw, Target, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { catatRiwayatLatihan } from '../../../services/riwayatLatihanService';

const tipeOf = (s) => {
  const t = String(s?.tipe || 'pg');
  if (t === 'pgMulti') return 'pgMulti';
  if (t === 'tabel') return 'tabel';
  return 'pg';
};

const S = {
  hero: {
    display: 'flex', gap: 13, alignItems: 'center',
    padding: '18px 22px', background: T.gradasiHero,
  },
  heroJudul: { margin: 0, color: '#fff', fontSize: 19, fontWeight: 800 },
  heroSub: { margin: '3px 0 0', color: 'rgba(255,255,255,.8)', fontSize: 12 },
  isi: { padding: '16px 18px 60px', maxWidth: 900, margin: '0 auto' },
  podium: (rank) => ({
    display: 'flex', gap: 12, alignItems: 'center',
    background: rank === 0 ? 'linear-gradient(90deg,#FFF9E8,#FFF3D6)' : rank === 1 ? 'linear-gradient(90deg,#F8FAFC,#EEF2F7)' : rank === 2 ? 'linear-gradient(90deg,#FFF6EE,#FDE8D7)' : '#fff',
    border: `1.5px solid ${rank === 0 ? '#F5C542' : rank === 1 ? '#CBD5E1' : rank === 2 ? '#F0B27A' : T.garis}`,
    borderRadius: 14, padding: '10px 14px', marginBottom: 8,
  }),
  medali: { fontSize: 22, width: 34, textAlign: 'center', flexShrink: 0 },
  nama: { flex: 1, fontWeight: 800, fontSize: 14.5, color: T.judul, textAlign: 'left' },
  skor: (rank) => ({
    fontWeight: 900, fontSize: rank === 0 ? 26 : 21,
    color: rank === 0 ? '#B45309' : T.biruDalam, fontVariantNumeric: 'tabular-nums',
  }),
  sub: { fontSize: 11, color: T.samar, fontWeight: 700 },
  chipNav: (aktif) => ({
    minWidth: 40, padding: '6px 8px', borderRadius: 10,
    border: `1.5px solid ${aktif ? 'transparent' : T.garis}`,
    background: aktif ? T.biru : '#fff', color: aktif ? '#fff' : T.teks,
    fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  }),
  barisOpsi: {
    display: 'flex', gap: 10, alignItems: 'center',
    padding: '8px 10px', borderRadius: 10, marginBottom: 6,
    border: `1.5px solid ${T.garis}`, background: '#fff',
  },
  barWrap: { flex: 1, height: 12, background: '#EEF2F7', borderRadius: 999, overflow: 'hidden' },
  bar: (pct, kunci) => ({
    width: `${pct}%`, height: '100%',
    background: kunci ? T.hijau : '#94A3B8',
    borderRadius: 999, transition: 'width .4s ease',
  }),
};

export default function ReviewSesi() {
  const { sesiId } = useParams();
  const navigate = useNavigate();
  const [sesi, setSesi] = useState(null);
  const [peserta, setPeserta] = useState([]);
  const [jawaban, setJawaban] = useState([]);
  const [ujian, setUjian] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soalAktif, setSoalAktif] = useState(0);
  const [bukaBahas, setBukaBahas] = useState({});
  const [syncPesan, setSyncPesan] = useState('');

  // Turn 97: pulihkan riwayat siswa untuk sesi LAMA (sebelum pencatatan
  // otomatis aktif) — idempoten lewat id ujian_<sesiId>.
  const syncKeRiwayat = async () => {
    if (!sesi) return;
    setSyncPesan('Menyinkronkan…');
    let ok = 0;
    for (const u of ujian) {
      const perSoal = jawaban
        .filter((j) => j.siswaId === u.siswaId)
        .map((j) => ({ i: Number(j.soalIdx), kredit: j.benar ? 1 : 0, jaw: j.jawaban ?? null }));
      const id = await catatRiwayatLatihan(u.siswaId, {
        jenis: 'ujian', kode: sesi.kode || '',
        materiId: sesi.materiId || sesi.bukuId || '',
        babId: sesi.babId || '',
        babJudul: sesi.catatan || '',
        nilai: u.skor, benar: u.benar, total: u.total, terjawab: u.terjawab,
        perSoal, tsMs: u.ts || Date.now(), backfill: true,
      }, `ujian_${sesiId}`);
      if (id) ok += 1;
    }
    setSyncPesan(ok === ujian.length
      ? `✅ ${ok} siswa tersinkron ke Riwayat Latihan mereka.`
      : `⚠️ ${ok}/${ujian.length} tersinkron — bila gagal, kemungkinan aturan Firestore menolak penulisan ini.`);
  };

  const muat = async () => {
    setLoading(true);
    try {
      const s = await getDoc(doc(db, 'sesi_kelas', sesiId));
      setSesi(s.exists() ? { id: s.id, ...s.data() } : null);
      const [p, j, u] = await Promise.all([
        getDocs(collection(db, 'sesi_kelas', sesiId, 'peserta')),
        getDocs(collection(db, 'sesi_kelas', sesiId, 'jawaban')),
        getDocs(collection(db, 'sesi_kelas', sesiId, 'ujian')),
      ]);
      setPeserta(p.docs.map((d) => ({ id: d.id, ...d.data() })));
      setJawaban(j.docs.map((d) => ({ id: d.id, ...d.data() })));
      setUjian(u.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.skor || 0) - (a.skor || 0)));
    } catch (e) {
      console.error('Gagal muat rekap sesi:', e);
    }
    setLoading(false);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat();
  }, [sesiId]); // eslint-disable-line react-hooks/exhaustive-deps

  const soalList = useMemo(() => (sesi?.daftarSoal || []), [sesi]);
  const belum = peserta.filter((p) => !ujian.some((u) => u.siswaId === p.siswaId));

  const statistikSoal = (i) => {
    const s = soalList[i];
    const t = tipeOf(s);
    const masuk = jawaban.filter((j) => Number(j.soalIdx) === i);
    if (t === 'pg') {
      const n = Math.max(1, masuk.length);
      const perOpsi = (s.opsi || []).map((_, oi) => masuk.filter((j) => Number(j.jawaban) === oi).length);
      const benarCount = masuk.filter((j) => Number(j.jawaban) === Number(s.jawaban)).length;
      return { t, masuk, perOpsi, benarCount, pct: Math.round((benarCount / n) * 100) };
    }
    if (t === 'pgMulti') {
      const kunci = s.jawaban || [];
      const n = Math.max(1, masuk.length);
      const perOpsi = (s.opsi || []).map((_, oi) => masuk.filter((j) => Array.isArray(j.jawaban) && j.jawaban.includes(oi)).length);
      const benarCount = masuk.filter((j) => Array.isArray(j.jawaban)
        && kunci.length === j.jawaban.length && kunci.every((k) => j.jawaban.includes(k))).length;
      return { t, masuk, perOpsi, benarCount, pct: Math.round((benarCount / n) * 100) };
    }
    // tabel: akurasi per baris
    const n = Math.max(1, masuk.length);
    const perBaris = (s.baris || []).map((_, r) => masuk.filter((j) => Array.isArray(j.jawaban) && j.jawaban[r] === (s.jawaban || [])[r]).length);
    const benarCount = masuk.filter((j) => Array.isArray(j.jawaban)
      && (s.jawaban || []).every((k, r) => j.jawaban[r] === k)).length;
    return { t, masuk, perBaris, benarCount, pct: Math.round((benarCount / n) * 100) };
  };

  const sNow = soalList[soalAktif];
  const stat = sNow ? statistikSoal(soalAktif) : null;

  return (
    <div style={halamanDasar}>
      <div style={S.hero}>
        <button type="button" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={S.heroJudul}>🎯 Review Sesi & Leaderboard</h1>
          <p style={S.heroSub}>
            Kode {sesi?.kode || '…'} • {sesi?.mode === 'ujian' ? 'Mode Ujian' : `Mode ${sesi?.mode || '-'}`}
            {' • '}{sesi?.status || '-'} • {soalList.length} soal
            {sesi?.durasiMenit ? ` • ${sesi.durasiMenit} menit` : ''}
          </p>
        </div>
        <button type="button" style={tombolPill('hijau')} onClick={muat}>
          <RefreshCw size={14} /> Muat ulang
        </button>
        {ujian.length > 0 && (
          <button type="button" style={tombolPill('putih')} onClick={syncKeRiwayat}>
            <Save size={14} /> Sync ke riwayat siswa
          </button>
        )}
      </div>
      {syncPesan && (
        <div style={{ maxWidth: 900, margin: '8px auto 0', fontSize: 12, fontWeight: 700, color: T.biruDalam }}>
          {syncPesan}
        </div>
      )}

      <div style={S.isi}>
        {loading ? (
          <div style={{ ...kartuDasar, padding: 30, textAlign: 'center', color: T.samar }}>Memuat rekap sesi…</div>
        ) : !sesi ? (
          <div style={{ ...kartuDasar, padding: 30, textAlign: 'center', color: T.samar }}>Sesi tidak ditemukan.</div>
        ) : (
          <>
            {/* ---------- LEADERBOARD ---------- */}
            <div style={{ ...kartuDasar, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Trophy size={18} color="#B45309" />
                <span style={{ fontWeight: 900, fontSize: 15.5, color: T.judul }}>Leaderboard Sesi</span>
                <span style={{ fontSize: 11.5, color: T.samar, marginLeft: 'auto' }}>
                  {ujian.length}/{peserta.length} mengumpulkan
                </span>
              </div>
              {ujian.length === 0 && (
                <div style={{ fontSize: 13, color: T.samar }}>
                  Belum ada siswa yang mengumpulkan jawaban pada sesi ini.
                </div>
              )}
              {ujian.map((u, i) => (
                <div key={u.siswaId || i} style={S.podium(i)}>
                  <div style={S.medali}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</div>
                  <div style={S.nama}>
                    {u.nama || u.siswaId}
                    <div style={S.sub}>{u.terjawab}/{u.total} terjawab • kredit {Number(u.benar || 0).toFixed(2)}</div>
                  </div>
                  <div style={S.skor(i)}>{u.skor}</div>
                </div>
              ))}
              {belum.length > 0 && (
                <div style={{ fontSize: 12, color: T.samar, marginTop: 8 }}>
                  Belum mengumpulkan: {belum.map((b) => b.nama || b.siswaId).join(', ')}
                </div>
              )}
            </div>

            {/* ---------- BEDAH SOAL ---------- */}
            <div style={{ ...kartuDasar, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Target size={17} color={T.biru} />
                <span style={{ fontWeight: 900, fontSize: 15.5, color: T.judul }}>Bedah Soal per Nomor</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {soalList.map((_, i) => {
                  const st = statistikSoal(i);
                  return (
                    <button key={i} type="button" style={S.chipNav(i === soalAktif)}
                      title={`Soal ${i + 1} • ${st.pct}% benar`}
                      onClick={() => setSoalAktif(i)}>
                      {i + 1}<span style={{ fontSize: 9.5, opacity: .75 }}> {st.pct}%</span>
                    </button>
                  );
                })}
              </div>
              {sNow ? (
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 900, color: T.judul, fontSize: 15 }}>Soal {soalAktif + 1}</span>
                    <span style={{
                      fontSize: 11.5, fontWeight: 900, borderRadius: 999, padding: '3px 11px',
                      background: stat.pct >= 70 ? T.hijauLatar : stat.pct >= 40 ? T.amberLatar : T.merahLatar,
                      color: stat.pct >= 70 ? T.hijauTeks : stat.pct >= 40 ? T.amberTeks : '#991B1B',
                      border: `1px solid ${stat.pct >= 70 ? T.hijauGaris : stat.pct >= 40 ? T.amberGaris : T.merahGaris}`,
                    }}>
                      {stat.pct}% kelas benar ({stat.benarCount}/{stat.masuk.length} jawaban)
                    </span>
                  </div>
                  <TeksSoal teks={sNow.soal} style={{ fontSize: 14.5, lineHeight: 1.8, color: T.teks, fontWeight: 500, marginBottom: 12 }} />
                  {sNow.soalGambar && (
                    <img src={sNow.soalGambar} alt="Gambar soal" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 10 }} />
                  )}
                  {(stat.t === 'pg' || stat.t === 'pgMulti') && (sNow.opsi || []).map((op, oi) => {
                    const cnt = stat.perOpsi[oi] || 0;
                    const pct = Math.round((cnt / Math.max(1, stat.masuk.length)) * 100);
                    const kunci = stat.t === 'pg' ? sNow.jawaban === oi : (sNow.jawaban || []).includes(oi);
                    return (
                      <div key={oi} style={{
                        ...S.barisOpsi,
                        borderColor: kunci ? T.hijauGaris : T.garis,
                        background: kunci ? T.hijauLatar : '#fff',
                      }}>
                        <span style={{ fontWeight: 800, fontSize: 12, color: T.samar, width: 18 }}>{String.fromCharCode(65 + oi)}.</span>
                        <span style={{ flex: 1.4, fontSize: 13, color: T.teks, lineHeight: 1.5, textAlign: 'left' }}>
                          <MathText text={op} />
                        </span>
                        <span style={S.barWrap}><span style={{ ...S.bar(pct, kunci), display: 'block' }} /></span>
                        <span style={{ width: 74, textAlign: 'right', fontSize: 12, fontWeight: 800, color: kunci ? T.hijauTeks : T.samar }}>
                          {cnt} siswa{stat.t === 'pgMulti' && kunci ? ' ✅' : ''}
                        </span>
                      </div>
                    );
                  })}
                  {stat.t === 'tabel' && (sNow.baris || []).map((bar, r) => {
                    const cnt = stat.perBaris[r] || 0;
                    const pct = Math.round((cnt / Math.max(1, stat.masuk.length)) * 100);
                    return (
                      <div key={r} style={S.barisOpsi}>
                        <span style={{ flex: 1.6, fontSize: 13, color: T.teks, lineHeight: 1.5, textAlign: 'left' }}>
                          {r + 1}. <MathText text={bar} />
                          <span style={{ color: T.hijauTeks, fontWeight: 800 }}> → {(sNow.kolom || [])[ (sNow.jawaban || [])[r] ]}</span>
                        </span>
                        <span style={S.barWrap}><span style={{ ...S.bar(pct, true), display: 'block' }} /></span>
                        <span style={{ width: 74, textAlign: 'right', fontSize: 12, fontWeight: 800, color: T.samar }}>{pct}% benar</span>
                      </div>
                    );
                  })}
                  <button type="button"
                    style={{ ...tombolPill('putih'), marginTop: 8 }}
                    onClick={() => setBukaBahas((o) => ({ ...o, [soalAktif]: !o[soalAktif] }))}>
                    {bukaBahas[soalAktif] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {bukaBahas[soalAktif] ? 'Tutup pembahasan' : 'Tampilkan pembahasan (bahas bersama kelas)'}
                  </button>
                  {bukaBahas[soalAktif] && <PembahasanBox soal={sNow} />}
                  <div style={{ fontSize: 11.5, color: T.samar, marginTop: 10, lineHeight: 1.6 }}>
                    💡 Tips pembahasan: panggil siswa lewat undian dari leaderboard
                    (atau sukarelawan maju) untuk menjelaskan pilihan mayoritas yang
                    salah — baris abu-abu di atas menunjukkan pengecoh yang paling banyak dipilih.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: T.samar }}>Sesi ini tidak menyimpan daftar soal.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
