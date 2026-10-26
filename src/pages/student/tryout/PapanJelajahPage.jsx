// PapanJelajahPage.jsx
// ============================================================
// 🎯 ROMBAK TOTAL 14 Okt 2026 (permintaan owner, referensi Duolingo):
//   - profil + level + gem XP di atas;
//   - kartu STREAK oranye dengan api 7 hari (ala Duolingo streak);
//   - baris bendera "popular languages" DIGANTI KALENDER BULANAN:
//     lingkaran tanggal yang bisa digeser; siswa MEMILIH TANGGAL, bukan
//     membuka arsip — misi lama & hasilnya tetap hidup di tanggalnya;
//   - kartu streak api/beruntun TIDAK ada di sini: itu milik menu
//     Latihan Harian (keputusan owner 14 Okt 2026 sore).
//   - daftar misi di BAWAH tanggal terpilih: satu kartu = satu test
//     (subtes), ikon BOLA 3D per mapel (astronot dinilai "kurang pas");
//   - tanggal kosong menawarkan LATIHAN HARIAN (/siswa/latihan-harian)
//     karena visi owner: latihan harian ala Duolingo untuk TKA→UTBK.
// Tab "Papan Analitik" (pengganti leaderboard) TIDAK berubah perilaku.
// Hidup di balik sakelar fitur 'papanJelajah' (default MATI).
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
// 🔥 2026-10-25 (revisi owner): strip tanggal berhenti di hari ini.
import { jumlahTanggalTampil, bolehBulanBerikutnya } from '../../../utils/kalenderMisi';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import {
  CalendarDays, Sparkles, Target, Timer, Rocket, Gem,
  ChevronLeft, ChevronRight, Lock, Play, CheckCircle2, Hourglass, Bookmark,
} from 'lucide-react';
import {
  hitungAnalitik, potongUntukQuery, bolaMascotUntukMapel, kunciTanggal, jenisUjianUntukAnalitik,
} from '../../../utils/papanJelajah.js';
import { bangunDokumenTryOut } from '../../../utils/dokumenTryOut.js';
import { saringPaketUntukSiswa } from '../../../utils/cocokkanTargetPaket.js';
import { hitungTotalSkor } from '../../../utils/skorSoalTryOut.js';

const ms = (v) => (typeof v?.toDate === 'function' ? v.toDate().getTime() : v ? new Date(v).getTime() : null);
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_P = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tglPendek = (m) => (m ? `${new Date(m).getDate()} ${BULAN_P[new Date(m).getMonth()]}` : '-');
// Jam dibaca SATU KALI saat modul dimuat (eslint react-hooks/purity).
const WAKTU_MUAT = Date.now();

const WARNA_MAPEL = {
  matematika: '#F59E0B', 'bahasa indonesia': '#2563EB', 'bahasa inggris': '#0EA5E9',
  kimia: '#EC4899', fisika: '#4F46E5', biologi: '#22C55E', sosiologi: '#8B5CF6',
  geografi: '#0284C7', sejarah: '#D97706', ekonomi: '#06B6D4',
};
const KUNCI_WARNA = Object.keys(WARNA_MAPEL).sort((a, b) => b.length - a.length);
const warnaMapel = (nama) => {
  const h = String(nama || '').toLowerCase();
  const k = KUNCI_WARNA.find((x) => h.includes(x));
  return k ? WARNA_MAPEL[k] : '#7C3AED';
};

const st = {
  bungkus: {
    minHeight: '100%', padding: '18px 14px 60px', color: '#eef1ff', borderRadius: 18,
    background: 'radial-gradient(1200px 500px at 80% -10%, rgba(124,58,237,.35), transparent 60%), radial-gradient(900px 420px at 10% 0%, rgba(249,115,22,.22), transparent 55%), linear-gradient(180deg,#0b1030 0%,#141a45 55%,#0b1030 100%)',
  },
  kartu: {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16,
    padding: 14, backdropFilter: 'blur(6px)',
  },
  tab: (aktif) => ({
    padding: '8px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.18)', cursor: 'pointer',
    background: aktif ? 'linear-gradient(90deg,#7c3aed,#f97316)' : 'transparent', color: '#fff', fontWeight: 700, fontSize: 13,
  }),
  chip: (warna = '#7c3aed') => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: `${warna}22`, color: '#fff', border: `1px solid ${warna}88`, marginRight: 6,
  }),
  deskripsi: { color: '#c3c9ef', fontSize: 12.5, lineHeight: 1.55, margin: '6px 0 0' },
};

function BolaMapel({ mapel, ukuran = 68 }) {
  const src = bolaMascotUntukMapel(mapel);
  const warna = warnaMapel(mapel);
  if (src) {
    return (
      <img
        src={src}
        alt={`Bola ${mapel}`}
        style={{ width: ukuran, height: ukuran, objectFit: 'contain', flex: '0 0 auto', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.35))' }}
      />
    );
  }
  const inisial = String(mapel || '?').trim().slice(0, 2).toUpperCase();
  return (
    <div
      aria-label={`Bola ${mapel}`}
      style={{
        width: ukuran, height: ukuran, borderRadius: '50%', flex: '0 0 auto',
        background: `radial-gradient(circle at 32% 28%, #ffffffcc 0 12%, ${warna} 45%, ${warna}88 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 900, fontSize: ukuran / 3.2, boxShadow: '0 4px 10px rgba(0,0,0,.35)',
      }}
    >
      {inisial}
    </div>
  );
}

function KartuMisiBola({ dok, onBuka }) {
  const warna = warnaMapel(dok.mapel);
  const selesai = dok.statusPaket === 'selesai';
  const labelTombol = dok.bisaDibuka
    ? (dok.stamp === 'SEDANG DIKERJAKAN' ? 'LANJUTKAN TEST' : 'MULAI TEST')
    : selesai ? 'LIHAT HASIL' : dok.terkunci ? 'TERKUNCI' : dok.stamp === 'TERJADWAL' ? `DIBUKA ${tglPendek(dok.waktuBuka)}` : dok.stamp;
  const bisaKlik = dok.bisaDibuka || selesai;
  return (
    <div style={{
      background: `${warna}1f`, border: `1px solid ${warna}66`, borderRadius: 18, padding: 14,
      display: 'flex', gap: 12, alignItems: 'center', opacity: dok.terkunci ? 0.62 : 1,
    }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {dok.urutan ? (
            <span style={{ background: warna, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 900 }}>
              TEST {dok.urutan.ke}/{dok.urutan.dari}
            </span>
          ) : null}
          <span style={{
            border: `2px solid ${selesai ? '#4ade80' : dok.terkunci ? '#f87171' : '#fbbf24'}`,
            color: selesai ? '#4ade80' : dok.terkunci ? '#f87171' : '#fbbf24',
            borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 900, letterSpacing: 1, transform: 'rotate(-2deg)',
          }}
          >
            {dok.stamp}
          </span>
        </div>
        <div style={{ fontWeight: 900, fontSize: 16, marginTop: 6 }}>{dok.judul}</div>
        {dok.judulPaket && dok.judulPaket !== dok.judul ? (
          <div style={{ fontSize: 11.5, color: '#c3c9ef', marginTop: 2 }}>{dok.judulPaket}</div>
        ) : null}
        <div style={{ marginTop: 7 }}>
          <span style={st.chip(warna)}>{dok.jumlahSoal} soal</span>
          {dok.durasiMenit ? <span style={st.chip(warna)}>{dok.durasiMenit} mnt</span> : null}
          {dok.skor !== null && dok.skor !== undefined ? <span style={st.chip('#16a34a')}>akurasi {Math.round(dok.skor)}%</span> : null}
        </div>
        {dok.catatan ? <div style={{ ...st.deskripsi, fontSize: 11.5 }}>{dok.catatan}</div> : null}
        <button
          type="button"
          disabled={!bisaKlik}
          onClick={() => onBuka(dok)}
          style={{
            marginTop: 10, padding: '10px 18px', borderRadius: 12, border: 'none',
            cursor: bisaKlik ? 'pointer' : 'not-allowed', fontWeight: 900, fontSize: 13,
            background: bisaKlik ? `linear-gradient(90deg, ${warna}, #7c3aed)` : 'rgba(255,255,255,.12)',
            color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 7,
          }}
        >
          {dok.terkunci ? <Lock size={14} /> : selesai ? <CheckCircle2 size={14} /> : <Play size={14} />}
          {labelTombol}
        </button>
      </div>
      <BolaMapel mapel={dok.mapel} />
    </div>
  );
}

export default function PapanJelajahPage({ studentId = '' }) {
  const navigate = useNavigate();
  const [paket, setPaket] = useState([]);
  const [paketRiwayat, setPaketRiwayat] = useState([]);
  const [sesi, setSesi] = useState([]);
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [tab, setTab] = useState('misi');
  const [muat, setMuat] = useState(true);
  const kini = WAKTU_MUAT;
  const [bulan, setBulan] = useState(() => ({ y: new Date(kini).getFullYear(), m: new Date(kini).getMonth() }));
  const [tanggal, setTanggal] = useState(() => kunciTanggal(kini));

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const snapSiswa = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
        const dS = snapSiswa.docs[0]?.data() || {};
        const snapPaket = await getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif')));
        const snapSesi = await getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId)));
        if (!hidup) return;
        setNama(dS.nama || dS.name || studentId);
        setKelas(dS.kelas || dS.kelasSekolah || '');
        // 🔥 14 Okt 2026 (owner: "jangan semua tryout nyasar"): Papan Jelajah
        // dulu menampilkan SEMUA paket aktif ke SEMUA siswa. Sekarang difilter
        // target yang sama dengan Daftar Try Out lewat satu pintu util.
        const paketAktif = saringPaketUntukSiswa(
          snapPaket.docs.map((d) => ({ id: d.id, ...d.data() })),
          dS,
        );
        const sesiList = snapSesi.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPaket(paketAktif);
        setSesi(sesiList);
        // 🛡️ AUDIT 2026-10-13: paket riwayat (arsip/nonaktif) milik sesi lama
        // diambil terpisah supaya analitik tidak kehilangan jenisUjian.
        const idAktif = new Set(paketAktif.map((p) => p.id));
        const idKurang = [...new Set(
          sesiList.filter((s) => s.status === 'selesai')
            .map((s) => s.paketId || s.tryoutId)
            .filter((id) => id && !idAktif.has(id)),
        )];
        if (idKurang.length) {
          const riwayat = [];
          for (const chunk of potongUntukQuery(idKurang)) {
            const snapR = await getDocs(query(collection(db, 'tryout_paket'), where(documentId(), 'in', chunk)));
            snapR.docs.forEach((d) => riwayat.push({ id: d.id, ...d.data() }));
            if (!hidup) return;
          }
          if (hidup) setPaketRiwayat(riwayat);
        }
      } catch (e) {
        console.error('Gagal memuat papan jelajah:', e);
      } finally {
        if (hidup) setMuat(false);
      }
    })();
    return () => { hidup = false; };
  }, [studentId]);

  const sesiPerPaket = useMemo(() => {
    const m = new Map();
    sesi.filter((s) => s.status === 'selesai').forEach((s) => {
      const pid = s.paketId || s.tryoutId || '';
      if (!m.has(pid) || (ms(s.waktuSelesai) || 0) > (ms(m.get(pid).waktuSelesai) || 0)) m.set(pid, s);
    });
    return m;
  }, [sesi]);

  // Satu dokumen = satu test (subtes). Semua paket aktif dipecah, lalu
  // dikelompokkan per tanggal buka -> bahan kalender & daftar misi.
  const dokumenPerTanggal = useMemo(() => {
    const map = new Map();
    paket.forEach((p) => {
      bangunDokumenTryOut(p, { kini, sesi: sesiPerPaket.get(p.id) || null }).forEach((d) => {
        const key = d.waktuBuka ? kunciTanggal(d.waktuBuka) : null;
        if (!key) return;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(d);
      });
    });
    map.forEach((arr) => arr.sort((a, b) => (a.urutan?.ke || 1) - (b.urutan?.ke || 1)));
    return map;
  }, [paket, sesiPerPaket, kini]);

  const xp = useMemo(() => sesi.reduce((a, s) => a + (Number(s.xpFinal) || Number(s.xpMentah) || 0), 0), [sesi]);
  const level = 1 + Math.floor(xp / 100);

  const hariBulan = useMemo(() => {
    // 🔥 2026-10-25: bulan berjalan hanya menampilkan tanggal s.d. HARI INI;
    // bulan lalu penuh; bulan depan kosong & tombol majunya dinonaktifkan.
    const jumlah = jumlahTanggalTampil(bulan.y, bulan.m, kini);
    return Array.from({ length: jumlah }, (_, i) => {
      const key = `${bulan.y}-${String(bulan.m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const dok = dokumenPerTanggal.get(key) || [];
      return {
        key, tanggal: i + 1,
        adaMisi: dok.length > 0,
        selesaiSemua: dok.length > 0 && dok.every((d) => d.statusPaket === 'selesai'),
        hariIni: key === kunciTanggal(kini),
      };
    });
  }, [bulan, dokumenPerTanggal, kini]);

  const paketUntukAnalitik = useMemo(() => [...paket, ...paketRiwayat], [paket, paketRiwayat]);
  const analitik = useMemo(() => hitungAnalitik(
    [...sesiPerPaket.values()].map((s) => {
      const p = paketUntukAnalitik.find((x) => x.id === (s.paketId || s.tryoutId));
      const daftar = p?.daftarSoal || [];
      const subtes = (p?.subtes || []).map((sb) => {
        const ids = new Set(sb.soalIds || sb.daftarSoal || []);
        const kelompok = ids.size ? daftar.filter((q) => ids.has(q.id)) : [];
        const r = kelompok.length ? hitungTotalSkor(kelompok, s.jawaban || {}) : null;
        return { nama: sb.nama || sb.judul || 'Subtes', skorPersen: r?.totalSkorPersen ?? null };
      }).filter((x) => x.skorPersen !== null);
      return {
        nama: p?.judul || 'Try out',
        jenisUjian: jenisUjianUntukAnalitik(p),
        totalSkorPersen: s.totalSkorPersen,
        waktuSelesaiMs: ms(s.waktuSelesai),
        createdAtMs: ms(s.createdAt),
        totalSoal: p?.totalSoal || daftar.length,
        subtes,
      };
    }),
  ), [sesiPerPaket, paketUntukAnalitik]);

  if (muat) return <div style={{ padding: 30, color: '#9aa3d6' }}>🛰️ Menyiapkan papan jelajah…</div>;

  const misiTanggalIni = dokumenPerTanggal.get(tanggal) || [];
  const inisial = String(nama || 'S').trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={st.bungkus}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff',
          }}
          >
            {inisial}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{nama}</div>
            <div style={{ fontSize: 11.5, color: '#9aa3d6' }}>Level {level}{kelas ? ` · ${kelas}` : ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ ...st.chip('#f97316'), display: 'inline-flex', alignItems: 'center', gap: 5 }}><Gem size={13} /> {xp} XP</span>
          <button type="button" style={st.tab(tab === 'misi')} onClick={() => setTab('misi')}><CalendarDays size={14} style={{ verticalAlign: -2 }} /> Misi</button>
          <button type="button" style={st.tab(tab === 'analitik')} onClick={() => setTab('analitik')}><Sparkles size={14} style={{ verticalAlign: -2 }} /> Papan Analitik</button>
          {/* 🔖 20 Okt: pintu arsip kode soal — sinkron buku tulis & sistem */}
          <button type="button" style={st.tab(false)} onClick={() => navigate('/siswa/kode-soal')}><Bookmark size={14} style={{ verticalAlign: -2 }} /> Kode Soalku</button>
        </div>
      </div>

      {tab === 'misi' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          {/* ---------- kalender bulanian: geser tanggal ---------- */}
          <div style={st.kartu}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <button type="button" style={st.tab(false)} onClick={() => setBulan((b) => (b.m === 0 ? { y: b.y - 1, m: 11 } : { y: b.y, m: b.m - 1 }))}><ChevronLeft size={14} /></button>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{BULAN[bulan.m]} {bulan.y}</div>
              <button
                type="button"
                style={{ ...st.tab(false), opacity: bolehBulanBerikutnya(bulan.y, bulan.m, kini) ? 1 : 0.35, cursor: bolehBulanBerikutnya(bulan.y, bulan.m, kini) ? 'pointer' : 'not-allowed' }}
                disabled={!bolehBulanBerikutnya(bulan.y, bulan.m, kini)}
                title={bolehBulanBerikutnya(bulan.y, bulan.m, kini) ? 'Bulan berikutnya' : 'Strip tanggal berhenti di hari ini'}
                onClick={() => setBulan((b) => (b.m === 11 ? { y: b.y + 1, m: 0 } : { y: b.y, m: b.m + 1 }))}
              ><ChevronRight size={14} /></button>
            </div>
            {hariBulan.length === 0 && (
              <div style={{ fontSize: 12, color: '#9aa3d6', padding: '6px 2px' }}>
                Belum ada tanggal yang dapat ditampilkan pada bulan ini.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
              {hariBulan.map((h) => (
                <button
                  key={h.key}
                  type="button"
                  onClick={() => setTanggal(h.key)}
                  style={{
                    width: 46, height: 46, borderRadius: '50%', flex: '0 0 auto', cursor: 'pointer',
                    background: tanggal === h.key ? 'linear-gradient(135deg,#7c3aed,#f97316)' : h.adaMisi ? 'rgba(124,58,237,.25)' : 'rgba(255,255,255,.07)',
                    border: h.hariIni ? '2px solid #f97316' : '2px solid rgba(255,255,255,.15)',
                    color: '#fff', fontWeight: 800, fontSize: 13, position: 'relative',
                  }}
                >
                  {h.tanggal}
                  {h.adaMisi ? (
                    <span style={{
                      position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%',
                      background: h.selesaiSemua ? '#16a34a' : '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
                    }}
                    >
                      {h.selesaiSemua ? '✓' : '•'}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#9aa3d6', marginTop: 6 }}>
              Geser tanggal untuk meninjau hari lain: lingkaran ber-titik = ada misi, ✓ hijau = semua misi tanggal itu selesai. Strip berhenti di hari ini; bulan sebelumnya tersedia lewat tombol panah.
            </div>
          </div>

          {/* ---------- daftar misi tanggal terpilih ---------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>
              📅 Misi {new Date(tanggal).getDate()} {BULAN[new Date(tanggal).getMonth()]}
              {misiTanggalIni.length ? ` · ${misiTanggalIni.length} test` : ''}
            </div>
            {misiTanggalIni.length === 0 ? (
              <div style={st.kartu}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>🌙 Belum ada try out untuk kamu.</div>
                <p style={st.deskripsi}>
                  Yuk kerjakan misi harianmu! Latihan singkat setiap hari
                  melatih kemampuanmu dari TKA sampai UTBK.
                </p>
                <Link
                  to="/siswa/latihan-harian"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10, padding: '10px 16px', borderRadius: 12, background: 'linear-gradient(90deg,#f97316,#7c3aed)', color: '#fff', fontWeight: 900, fontSize: 13, textDecoration: 'none' }}
                >
                  <Rocket size={14} /> Latihan Harian
                </Link>
              </div>
            ) : misiTanggalIni.map((d) => (
              <KartuMisiBola key={d.id} dok={d} onBuka={(x) => navigate(`/siswa/tryout/${x.paketId}`)} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {analitik.jumlahSesi === 0 ? (
            <div style={st.kartu}>🛰️ Papan Analitik khusus try out TKA & UTBK. Selesaikan misi TKA/UTBK pertamamu, tren nilai pekananmu akan muncul di sini.</div>
          ) : (
            <>
              <div style={st.kartu}>
                <div style={{ fontWeight: 800, fontSize: 14 }}><Target size={15} style={{ verticalAlign: -3 }} /> Tren skor TKA/UTBK per pekan</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {analitik.tren.map((t) => (
                    <div key={t.label} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '8px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,.14)' }}>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{t.skor}</div>
                      <div style={{ fontSize: 10.5, color: '#9aa3d6' }}>{t.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: t.delta === null ? '#9aa3d6' : t.delta >= 0 ? '#4ade80' : '#f87171' }}>
                        {t.delta === null ? '—' : `${t.delta >= 0 ? '▲ +' : '▼ '}${t.delta}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {analitik.kecepatan ? (
                <div style={st.kartu}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}><Timer size={15} style={{ verticalAlign: -3 }} /> Tempo kerja (misi terakhir)</div>
                  <div style={{ fontSize: 13, marginTop: 6, color: '#c3c9ef' }}>
                    ~<b style={{ fontSize: 20, color: analitik.kecepatan.wajar ? '#4ade80' : '#f87171' }}>{analitik.kecepatan.detikPerSoal}</b> detik/soal
                    {' '}(target ≤ 90) pada {analitik.kecepatan.nama}.
                  </div>
                </div>
              ) : null}
              {analitik.subtesRata.length ? (
                <div style={st.kartu}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>📊 Rata-rata skor per subtes</div>
                  {analitik.subtesRata.map((s) => (
                    <div key={s.nama} style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c3c9ef' }}>
                        <span>{s.nama}</span><b>{s.skor}%</b>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,.12)', marginTop: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, s.skor)}%`, borderRadius: 999, background: 'linear-gradient(90deg,#f97316,#7c3aed)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={st.kartu}>
                <div style={{ fontWeight: 800, fontSize: 14 }}><Rocket size={15} style={{ verticalAlign: -3 }} /> Evaluasi & tips pintar</div>
                {analitik.evaluasi ? <p style={st.deskripsi}>{analitik.evaluasi}</p> : null}
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, color: '#c3c9ef', lineHeight: 1.7 }}>
                  {analitik.tips.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
              <div style={{ ...st.kartu, display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5, color: '#9aa3d6' }}>
                <Hourglass size={13} /> Analitik dihitung dari {analitik.jumlahSesi} sesi TKA/UTBK selesai milikmu.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
