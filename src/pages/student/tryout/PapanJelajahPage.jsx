// PapanJelajahPage.jsx
// ============================================================
// 🚀 ROMBAK TOTAL tampilan try out siswa (permintaan owner 13-14 Okt 2026):
// tema luar angkasa penuh, header profil + XP + api streak ala Duolingo,
// baris BERLIAN RANGKAIAN MISI pekanan, kartu pos maskot astronot pegang
// papan mapel (sprite 6x5 dari asset postcard owner), hanya misi mendatang /
// hari itu yang tampil besar, arsip rapi terlipat dengan LINGKARAN SKOR,
// dan tab "Papan Analitik" pengganti leaderboard (tren pekan, tempo,
// evaluasi subtes, tips) khusus TKA/UTBK.
// Hidup hanya lewat sakelar fitur 'papanJelajah' (default MATI) sehingga
// try out Sabtu 17 Okt di produksi tidak terganggu sama sekali.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, doc, documentId, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Rocket, CalendarDays, ChevronDown, Sparkles, Timer, Target, Flame, Star } from 'lucide-react';
import {
  posisiMascotUntukMapel, buatDeskripsiPaket, hitungAnalitik, potongUntukQuery,
  rangkaianMisi, statusMisi,
} from '../../../utils/papanJelajah.js';
import { hitungTotalSkor } from '../../../utils/skorSoalTryOut.js';

const SPRITE = '/mascot/mascot-mapel.png';
const ms = (v) => (typeof v?.toDate === 'function' ? v.toDate().getTime() : v ? new Date(v).getTime() : null);
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tgl = (m) => (m ? `${new Date(m).getDate()} ${BULAN[new Date(m).getMonth()]}` : '-');
const jam = (m) => (m ? `${String(new Date(m).getHours()).padStart(2, '0')}.${String(new Date(m).getMinutes()).padStart(2, '0')}` : '');
// Jam dibaca SATU KALI saat modul dimuat: aturan eslint react-hooks/purity
// melarang Date.now() dipanggil di dalam render (hasilnya bisa berubah-ubah
// antar render). Untuk pengelompokan misi, jam saat halaman dibuka cukup.
const WAKTU_MUAT = Date.now();

const st = {
  bungkus: {
    minHeight: '100%', padding: '20px 16px 60px', color: '#eef1ff',
    background: 'radial-gradient(1200px 500px at 80% -10%, rgba(124,58,237,.35), transparent 60%), radial-gradient(900px 420px at 10% 0%, rgba(249,115,22,.22), transparent 55%), linear-gradient(180deg,#0b1030 0%,#141a45 55%,#0b1030 100%)',
    backgroundImage: 'radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.7), transparent), radial-gradient(1.5px 1.5px at 70% 12%, rgba(255,255,255,.55), transparent), radial-gradient(1.5px 1.5px at 45% 70%, rgba(255,255,255,.4), transparent), radial-gradient(2px 2px at 88% 40%, rgba(255,255,255,.5), transparent), radial-gradient(1200px 500px at 80% -10%, rgba(124,58,237,.35), transparent 60%), linear-gradient(180deg,#0b1030 0%,#141a45 55%,#0b1030 100%)',
    borderRadius: 18,
  },
  kartu: {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16,
    padding: 14, display: 'flex', gap: 14, alignItems: 'center', backdropFilter: 'blur(6px)',
  },
  mascot: (pos, ukuran = 74) => (pos ? {
    width: ukuran, height: ukuran, borderRadius: 14, flex: '0 0 auto',
    backgroundImage: `url(${SPRITE})`, backgroundSize: '600% 500%', backgroundPosition: `${pos.xPct}% ${pos.yPct}%`,
    backgroundRepeat: 'no-repeat', border: '1px solid rgba(255,255,255,.25)', boxShadow: '0 6px 18px rgba(0,0,0,.35)',
  } : {
    width: ukuran, height: ukuran, borderRadius: 14, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg,#312e81,#7c3aed)', fontSize: ukuran / 2.4, border: '1px solid rgba(255,255,255,.25)',
  }),
  lingkaranTanggal: {
    width: 78, height: 78, borderRadius: '50%', flex: '0 0 auto', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'conic-gradient(#f97316,#7c3aed,#f97316)', padding: 3,
  },
  lingkaranDalam: {
    width: '100%', height: '100%', borderRadius: '50%', background: '#10163c', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  chip: (warna = '#7c3aed') => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
    background: `${warna}22`, color: '#fff', border: `1px solid ${warna}88`, marginRight: 6,
  }),
  tombol: {
    marginTop: 10, padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 800,
    background: 'linear-gradient(90deg,#f97316,#7c3aed)', color: '#fff', fontSize: 14,
  },
  tombolPendamping: {
    marginTop: 10, padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,.25)',
    cursor: 'pointer', fontWeight: 700, background: 'transparent', color: '#c3c9ef', fontSize: 13,
  },
  deskripsi: { color: '#c3c9ef', fontSize: 12.5, lineHeight: 1.55, margin: '6px 0 0' },
  sub: { color: '#9aa3d6', fontSize: 12.5, margin: '2px 0 0' },
};

/** Lingkaran skor SVG (donat) -- angka bulat di tengah, warna ikut nilai. */
function RingSkor({ persen, ukuran = 46 }) {
  const kosong = persen === null || persen === undefined;
  const p = Math.max(0, Math.min(100, kosong ? 0 : persen));
  const r = (ukuran - 6) / 2;
  const kel = 2 * Math.PI * r;
  const warna = kosong ? '#64748b' : p >= 70 ? '#4ade80' : p >= 50 ? '#f97316' : '#f87171';
  return (
    <svg width={ukuran} height={ukuran} style={{ flex: '0 0 auto' }} role="img" aria-label={kosong ? 'belum ada skor' : `skor ${p} persen`}>
      <circle cx={ukuran / 2} cy={ukuran / 2} r={r} stroke="rgba(255,255,255,.15)" strokeWidth={5} fill="none" />
      {!kosong ? (
        <circle
          cx={ukuran / 2} cy={ukuran / 2} r={r} stroke={warna} strokeWidth={5} fill="none"
          strokeDasharray={`${(kel * p) / 100} ${kel}`} strokeLinecap="round"
          transform={`rotate(-90 ${ukuran / 2} ${ukuran / 2})`}
        />
      ) : null}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="#fff" fontSize={ukuran / 3.4} fontWeight={800}>
        {kosong ? '–' : p}
      </text>
    </svg>
  );
}

/** Baris berlian rangkaian misi pekanan + api streak harian. */
function KartuRangkaian({ rangkaian, streakHarian, statusStreak }) {
  const pesan = streakHarian > 0 && statusStreak === 'aman'
    ? `Api streak-mu menyala ${streakHarian} hari — aman hari ini. Sampai jumpa di misi Sabtu!`
    : streakHarian > 0 && statusStreak === 'berisiko'
      ? `Api streak-mu ${streakHarian} hari tapi belum aman hari ini — kerjakan latihan harianmu biar tidak padam!`
      : streakHarian > 0
        ? `Streak-mu ${streakHarian} hari. Nyalakan lagi lewat latihan harian & misi Sabtu!`
        : 'Nyalakan api pertamamu: kerjakan latihan harian atau misi try out Sabtu!';
  return (
    <div style={{ ...st.kartu, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>
          <Flame size={15} style={{ verticalAlign: -3, color: '#f97316' }} /> Rangkaian misimu
        </div>
        <span style={st.chip(rangkaian.beruntun > 0 ? '#f97316' : '#64748b')}>
          🔥 {rangkaian.beruntun} pekan beruntun
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        {rangkaian.pekan.map((pk) => (
          <div key={pk.awalMs} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: 34, height: 34, margin: '4px auto 6px', transform: 'rotate(45deg)', borderRadius: 9,
              background: pk.aktif ? 'linear-gradient(135deg,#f97316,#7c3aed)' : 'transparent',
              border: pk.aktif ? '1px solid rgba(255,255,255,.4)' : `2px dashed ${pk.pekanIni ? 'rgba(249,115,22,.65)' : 'rgba(255,255,255,.22)'}`,
              boxShadow: pk.aktif ? '0 4px 16px rgba(124,58,237,.55)' : undefined,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ transform: 'rotate(-45deg)', fontSize: 14 }}>{pk.aktif ? '🚀' : pk.pekanIni ? '🛰️' : ''}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: pk.pekanIni ? 800 : 600, color: pk.pekanIni ? '#ffb27d' : '#9aa3d6' }}>
              {pk.pekanIni ? 'kini' : pk.label}
            </div>
          </div>
        ))}
      </div>
      <p style={{ ...st.deskripsi, margin: 0 }}>{pesan}</p>
    </div>
  );
}

function KartuMisi({ paket, sesi, status, onBuka, besar = false }) {
  const buka = ms(paket.waktuBuka);
  const pos = posisiMascotUntukMapel((paket.komposisi || [])[0]?.mapel || paket.judul || '');
  const keadaan = status?.keadaan || 'berlangsung';
  const deskripsi = paket.deskripsi || buatDeskripsiPaket({
    jenjang: paket.jenjangTemplate, jenisUjian: paket.jenisUjian, komposisi: paket.komposisi,
    durasiMenit: paket.durasiTotalMenit, jumlahSubtes: (paket.subtes || []).length, tampilkanPembahasan: paket.tampilkanPembahasan,
  });
  const chipStatus = {
    berjalan: ['#16a34a', '⏳ LANJUTAN MENUNGGU'],
    izin: ['#f59e0b', '🎟️ KESEMPATAN KEDUA'],
    berlangsung: ['#16a34a', 'SEDANG BERLANGSUNG'],
    mendatang: ['#f97316', `DIBUKA ${tgl(buka)}, ${jam(buka)}`],
    selesai: ['#7c3aed', 'SELESAI'],
    terlewat: ['#64748b', 'TERLEWAT'],
  }[keadaan] || ['#f97316', `Dibuka ${tgl(buka)}`];
  const cta = {
    berjalan: '⏳ LANJUTKAN MISI',
    izin: '🎟️ PAKAI KESEMPATAN KEDUA',
    berlangsung: '🚀 MULAI MISI SEKARANG',
  }[keadaan];
  return (
    <div style={{ ...st.kartu, boxShadow: besar ? '0 14px 40px rgba(124,58,237,.35)' : undefined }}>
      {besar ? (
        <div style={st.lingkaranTanggal}>
          <div style={st.lingkaranDalam}>
            <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{buka ? new Date(buka).getDate() : '?'}</span>
            <span style={{ fontSize: 11, color: '#ffb27d', fontWeight: 800 }}>{buka ? BULAN[new Date(buka).getMonth()].toUpperCase() : ''}</span>
          </div>
        </div>
      ) : (
        <div style={st.mascot(pos)}>{pos ? null : '🚀'}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: besar ? 17 : 14.5 }}>{paket.judul}</div>
        <div style={{ marginTop: 5 }}>
          <span style={st.chip(chipStatus[0])}>{chipStatus[1]}</span>
          <span style={st.chip('#7c3aed')}>{paket.totalSoal} soal</span>
          <span style={st.chip('#0ea5e9')}>{(paket.subtes || []).length} subtes</span>
          {paket.durasiTotalMenit ? <span style={st.chip('#14b8a6')}>{paket.durasiTotalMenit} mnt</span> : null}
          {sesi?.status === 'selesai' ? <span style={st.chip('#16a34a')}>skor {Math.round(sesi.totalSkorPersen || 0)}%</span> : null}
        </div>
        <p style={st.deskripsi}>{deskripsi}</p>
        {besar ? (
          cta ? (
            <button type="button" style={st.tombol} onClick={() => onBuka(paket.id)}>{cta}</button>
          ) : (
            <div style={{ ...st.deskripsi, marginTop: 8 }}>
              🔒 Terbuka otomatis {tgl(buka)} pukul {jam(buka)} — set pengingat HP-mu, ya!
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

export default function PapanJelajahPage({ studentId = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [paket, setPaket] = useState([]);
  const [paketRiwayat, setPaketRiwayat] = useState([]);
  const [sesi, setSesi] = useState([]);
  const [izinPerPaket, setIzinPerPaket] = useState({});
  const [progres, setProgres] = useState({ xp: 0, xpMingguIni: 0, streak: 0, statusStreak: 'belum-pernah' });
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [tab, setTab] = useState('misi');
  const [arsipBuka, setArsipBuka] = useState(false);
  const [muat, setMuat] = useState(true);

  // Deep-link menu sidebar "Papan Analitik" -> /siswa/tryout?tab=analitik.
  // Tanpa parameter 'tab' -> kembali ke Misi, supaya klik menu "Papan
  // Jelajah" selalu menampilkan misi walau sebelumnya sedang di analitik.
  useEffect(() => {
    const ingin = new URLSearchParams(location.search).get('tab');
    setTab(ingin === 'analitik' ? 'analitik' : 'misi');
  }, [location.search]);

  // Tombol tab di header ikut menyamakan URL (replace, tanpa riwayat baru)
  // supaya sorotan sidebar & tab halaman tidak pernah berbeda pendapat.
  const pindahTab = (t) => {
    setTab(t);
    navigate(t === 'analitik' ? '/siswa/tryout?tab=analitik' : '/siswa/tryout', { replace: true });
  };

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const snapSiswa = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
        const dS = snapSiswa.docs[0]?.data() || {};
        const [snapPaket, snapSesi, snapIzin, snapProgres] = await Promise.all([
          getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif'))),
          getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId))),
          getDocs(query(collection(db, 'tryout_izin_ulang'), where('studentId', '==', studentId))),
          getDoc(doc(db, 'siswa_progress', studentId)).catch(() => null),
        ]);
        if (!hidup) return;
        setNama(dS.nama || dS.name || studentId);
        setKelas(dS.kelas || dS.kelasSekolah || '');
        const paketAktif = snapPaket.docs.map((d) => ({ id: d.id, ...d.data() }));
        const sesiList = snapSesi.docs.map((d) => ({ id: d.id, ...d.data() }));
        const izin = {};
        snapIzin.forEach((d) => { izin[d.data().paketId] = d.data(); });
        setIzinPerPaket(izin);
        setPaket(paketAktif);
        setSesi(sesiList);
        if (snapProgres && snapProgres.exists()) {
          const d = snapProgres.data();
          const hariIniStr = new Date(WAKTU_MUAT).toISOString().slice(0, 10);
          const streak = Number(d.streak) || 0;
          const soalHariIni = d.soalHariIniTanggal === hariIniStr ? (Number(d.soalHariIniCount) || 0) : 0;
          let statusStreak = 'belum-pernah';
          if (d.lastActiveDate) {
            const selisih = Math.round((new Date(hariIniStr).getTime() - new Date(d.lastActiveDate).getTime()) / 86400000);
            if (streak === 0 && selisih > 1) statusStreak = 'berakhir';
            else if (soalHariIni < (d.targetHarian || 10)) statusStreak = 'berisiko';
            else statusStreak = 'aman';
          }
          setProgres({ xp: Number(d.xp) || 0, xpMingguIni: Number(d.xpMingguIni) || 0, streak, statusStreak });
        }
        // 🛡️ AUDIT 2026-10-13 (bug arsip): sesi lama menunjuk paket yang
        // sudah 'arsip'/'nonaktif' -- di luar hasil query status=='aktif'.
        // Tanpa dokumen paketnya, jenisUjian/totalSoal hilang dan sesi itu
        // DIAM-DIAM terbuang dari Papan Analitik. Ambil paket yang kurang
        // per chunk (batas operator 'in' Firestore) ke state TERPISAH:
        // hanya untuk memperkaya analitik, TIDAK ikut daftar misi/arsip.
        const idAktif = new Set(paketAktif.map((p) => p.id));
        const idKurang = [...new Set(
          sesiList
            .filter((s) => s.status === 'selesai')
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

  const kini = WAKTU_MUAT;
  const sesiPerPaket = useMemo(() => {
    const m = new Map();
    sesi.filter((s) => s.status === 'selesai' || s.status === 'berjalan').forEach((s) => {
      const pid = s.paketId || s.tryoutId || '';
      const lama = m.get(pid);
      if (!lama || (ms(s.waktuSelesai) || ms(s.createdAt) || 0) > (ms(lama.waktuSelesai) || ms(lama.createdAt) || 0)) m.set(pid, s);
    });
    return m;
  }, [sesi]);

  const tergolong = useMemo(() => {
    const hidupList = [];
    const arsip = [];
    paket.forEach((p) => {
      const s = sesiPerPaket.get(p.id);
      const status = statusMisi({
        waktuBukaMs: ms(p.waktuBuka), waktuTutupMs: ms(p.waktuTutup),
        sesiStatus: s?.status || null, izinSampaiMs: ms(izinPerPaket[p.id]?.waktuBerlakuSampai), kiniMs: kini,
      });
      const baris = { paket: p, sesi: s, status };
      if (status.keadaan === 'selesai' || status.keadaan === 'terlewat') arsip.push(baris);
      else hidupList.push(baris);
    });
    const prioritas = { berjalan: 0, izin: 1, berlangsung: 2, mendatang: 3 };
    hidupList.sort((a, b) => (prioritas[a.status.keadaan] - prioritas[b.status.keadaan])
      || (ms(a.paket.waktuBuka) || 0) - (ms(b.paket.waktuBuka) || 0));
    arsip.sort((a, b) => (ms(b.paket.waktuBuka) || 0) - (ms(a.paket.waktuBuka) || 0));
    return { hidup: hidupList, arsip };
  }, [paket, sesiPerPaket, izinPerPaket, kini]);

  const rangkaian = useMemo(() => rangkaianMisi(
    sesi.filter((s) => s.status === 'selesai').map((s) => ms(s.waktuSelesai)).filter((m) => m !== null),
    kini, 6,
  ), [sesi, kini]);

  // 🛡️ AUDIT 2026-10-13: analitik boleh melihat paket riwayat (arsip/
  // nonaktif) supaya sesi lama tidak hilang dari tren; daftar misi & arsip
  // di tab sebelah TETAP hanya dari paket aktif.
  const paketUntukAnalitik = useMemo(() => [...paket, ...paketRiwayat], [paket, paketRiwayat]);

  const analitik = useMemo(() => hitungAnalitik(
    [...sesiPerPaket.values()].filter((s) => s.status === 'selesai').map((s) => {
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
        jenisUjian: p?.jenisUjian || '',
        totalSkorPersen: s.totalSkorPersen,
        waktuSelesaiMs: ms(s.waktuSelesai),
        createdAtMs: ms(s.createdAt),
        totalSoal: p?.totalSoal || daftar.length,
        subtes,
      };
    }),
  ), [sesiPerPaket, paketUntukAnalitik]);

  if (muat) return <div style={{ padding: 30, color: '#9aa3d6' }}>🛰️ Menyiapkan papan jelajah…</div>;

  const hero = tergolong.hidup[0];
  const inisial = (nama || 'S').trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join('').toUpperCase();
  return (
    <div style={st.bungkus}>
      {/* ===== HEADER PROFIL + XP + STREAK (peta mockup Duolingo owner) ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#f97316,#7c3aed)', fontWeight: 900, fontSize: 18, color: '#fff',
            boxShadow: '0 6px 18px rgba(124,58,237,.45)', border: '2px solid rgba(255,255,255,.35)',
          }}>{inisial}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{nama}</div>
            <div style={{ color: '#9aa3d6', fontSize: 12 }}>{kelas ? `🎓 ${kelas} · ` : ''}Penjelajah Gemilang</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={st.chip('#f59e0b')}><Star size={12} style={{ verticalAlign: -2 }} /> {progres.xp} XP</span>
          <span style={st.chip('#0ea5e9')}>+{progres.xpMingguIni} pekan ini</span>
          <span style={st.chip(progres.streak > 0 ? '#f97316' : '#64748b')}>🔥 {progres.streak} hari</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '14px 0 4px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: .4 }}>🪐 Papan Jelajah</h2>
          <p style={{ ...st.sub, marginBottom: 8 }}>Misi try out & papan analitik pribadimu — bukan perlombaan, perjalananmu sendiri.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={{ ...st.chip(tab === 'misi' ? '#7c3aed' : '#3f477a'), padding: '8px 18px', cursor: 'pointer', fontSize: 13 }} onClick={() => pindahTab('misi')}>
            <CalendarDays size={14} style={{ verticalAlign: -2 }} /> Misi
          </button>
          <button type="button" style={{ ...st.chip(tab === 'analitik' ? '#7c3aed' : '#3f477a'), padding: '8px 18px', cursor: 'pointer', fontSize: 13 }} onClick={() => pindahTab('analitik')}>
            <Sparkles size={14} style={{ verticalAlign: -2 }} /> Papan Analitik
          </button>
        </div>
      </div>

      {tab === 'misi' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <KartuRangkaian rangkaian={rangkaian} streakHarian={progres.streak} statusStreak={progres.statusStreak} />
          {hero ? <KartuMisi besar paket={hero.paket} sesi={hero.sesi} status={hero.status} onBuka={(id) => navigate(`/siswa/tryout/${id}`)} />
            : <div style={st.kartu}>🌙 Belum ada misi mendatang. Paket Sabtu berikutnya akan muncul otomatis di sini.</div>}
          {tergolong.hidup.slice(1).map((b, i) => (
            <div key={b.paket.id} style={{ transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg) translateX(${i % 2 === 0 ? 6 : -6}px)` }}>
              <KartuMisi paket={b.paket} sesi={b.sesi} status={b.status} onBuka={(id) => navigate(`/siswa/tryout/${id}`)} />
            </div>
          ))}
          {tergolong.arsip.length ? (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setArsipBuka((v) => !v)}
                style={{ ...st.chip('#3f477a'), padding: '8px 16px', cursor: 'pointer', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                🗄️ Arsip misi ({tergolong.arsip.length}) <ChevronDown size={14} style={{ transform: arsipBuka ? 'rotate(180deg)' : undefined }} />
              </button>
              {arsipBuka ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {tergolong.arsip.map(({ paket: p, sesi: s, status }) => {
                    const skor = s?.status === 'selesai' ? Math.round(s.totalSkorPersen || 0) : null;
                    return (
                      <div key={p.id} style={{ ...st.kartu, padding: 10 }}>
                        <RingSkor persen={skor} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.judul}</div>
                          <div style={{ color: '#9aa3d6', fontSize: 11.5 }}>{tgl(ms(p.waktuBuka))}</div>
                          {status.keadaan === 'terlewat' ? (
                            <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 3 }}>
                              Chat tentormu dan minta <b>paket susulan</b> — soal setara & pembahasan bisa dipelajari setelah selesai.
                            </div>
                          ) : null}
                        </div>
                        <div style={st.mascot(posisiMascotUntukMapel((p.komposisi || [])[0]?.mapel || p.judul || ''), 44)}>
                          {posisiMascotUntukMapel((p.komposisi || [])[0]?.mapel || p.judul || '') ? null : '🚀'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {analitik.jumlahSesi === 0 ? (
            <div style={st.kartu}>🛰️ Papan Analitik khusus try out TKA & UTBK. Selesaikan misi TKA/UTBK pertamamu, tren nilai pekananmu akan muncul di sini.</div>
          ) : (
            <>
              <div style={st.kartu}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}><Target size={15} style={{ verticalAlign: -3 }} /> Tren skor TKA/UTBK per pekan</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, alignItems: 'flex-end' }}>
                    {analitik.tren.map((t) => (
                      <div key={t.label} style={{ textAlign: 'center' }}>
                        <RingSkor persen={t.skor} ukuran={54} />
                        <div style={{ fontSize: 10.5, color: '#9aa3d6', marginTop: 4 }}>{t.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: t.delta === null ? '#9aa3d6' : t.delta >= 0 ? '#4ade80' : '#f87171' }}>
                          {t.delta === null ? '—' : `${t.delta >= 0 ? '▲ +' : '▼ '}${t.delta}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {analitik.kecepatan ? (
                <div style={st.kartu}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}><Timer size={15} style={{ verticalAlign: -3 }} /> Tempo kerja (misi terakhir)</div>
                    <div style={{ fontSize: 13, marginTop: 6, color: '#c3c9ef' }}>
                      ~<b style={{ fontSize: 20, color: analitik.kecepatan.wajar ? '#4ade80' : '#f87171' }}>{analitik.kecepatan.detikPerSoal}</b> detik/soal
                      {' '}(target ≤ 90). Perekam tempo per subtes dipasang setelah try out Sabtu.
                    </div>
                  </div>
                </div>
              ) : null}
              {analitik.subtesRata.length ? (
                <div style={st.kartu}>
                  <div style={{ flex: 1 }}>
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
                </div>
              ) : null}
              <div style={st.kartu}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}><Rocket size={15} style={{ verticalAlign: -3 }} /> Evaluasi & tips pintar</div>
                  {analitik.evaluasi ? <p style={st.deskripsi}>{analitik.evaluasi}</p> : null}
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, color: '#c3c9ef', lineHeight: 1.7 }}>
                    {analitik.tips.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
