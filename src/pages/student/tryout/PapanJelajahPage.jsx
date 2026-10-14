// PapanJelajahPage.jsx
// ============================================================
// 🎨 DESAIN v3 (permintaan owner 14 Okt 2026 siang, lewat mockup Duolingo):
// "tampilan harus seperti ini, persis seperti ini" -> tema TERANG krem-oranye
// ala Duolingo (kartu streak oranye, kartu mapel pastel, tombol gembul),
// BUKAN tema gelap sebelumnya.
// "jangan crop foto maskot astronotku" -> sprite CSS 6x5 DIPENSIUNKAN; tiap
// mapel memakai satu file PNG maskot UTUH (public/mascot/mapel/*.png hasil
// scripts/pecah-mascot.py) yang ditempel sebagai stiker putih di kartu pastel.
// "arsip jangan di bawah ... masukkan di Rangkaian misimu ... bisa digeser ke
// samping ... tanggal ikut kalender ... hari ini sampai sebulan ke depan" ->
// baris berlian pekanan + arsip lipatan DIGANTI satu strip kalender HARIAN
// yang bisa digeser: ke kiri tanggal-tanggal try out sebelumnya (sekalian
// hasilnya), ke kanan sampai sebulan ke depan; ketuk tanggal = kartu misinya.
// Hidup hanya lewat sakelar fitur 'papanJelajah' (default MATI) sehingga
// try out Sabtu 17 Okt di produksi tidak terganggu sama sekali.
// ============================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, doc, documentId, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Rocket, CalendarDays, ChevronLeft, ChevronRight, Sparkles, Timer, Target, Flame, Star } from 'lucide-react';
import {
  buatDeskripsiPaket, hitungAnalitik, potongUntukQuery,
  rangkaianMisi, statusMisi, urlMascotUntukMapel, kalenderMisi, tanggalMisiMs,
} from '../../../utils/papanJelajah.js';
import { hitungTotalSkor } from '../../../utils/skorSoalTryOut.js';

const ms = (v) => (typeof v?.toDate === 'function' ? v.toDate().getTime() : v ? new Date(v).getTime() : null);
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const tgl = (m) => (m ? `${new Date(m).getDate()} ${BULAN[new Date(m).getMonth()]}` : '-');
const jam = (m) => (m ? `${String(new Date(m).getHours()).padStart(2, '0')}.${String(new Date(m).getMinutes()).padStart(2, '0')}` : '');
// Jam dibaca SATU KALI saat modul dimuat: aturan eslint react-hooks/purity
// melarang Date.now() dipanggil di dalam render (hasilnya bisa berubah-ubah
// antar render). Untuk pengelompokan misi, jam saat halaman dibuka cukup.
const WAKTU_MUAT = Date.now();

// Palet terang peta mockup Duolingo owner: krem, oranye menyala, pastel kartu.
const W = {
  krem: '#FFF9F3',
  tinta: '#4B3F35',
  sub: '#A8968A',
  isi: '#6B5B4E',
  oranye: '#F45D00',
  oranyeTua: '#C2410C',
  oranyeLembut: '#FBE4CE',
  emas: '#FFD44D',
  garis: '#F4E4D2',
  putih: '#FFFFFF',
};
const PASTEL = ['#FFD9E8', '#D8E9FF', '#DDF5D4', '#FFF0BF', '#E9DCFF', '#D9F3EF'];
const DAFTAR_TAB = [
  { k: 'misi', label: 'Misi', Ikon: CalendarDays },
  { k: 'analitik', label: 'Papan Analitik', Ikon: Sparkles },
];

const st = {
  bungkus: {
    minHeight: '100%', padding: '20px 16px 60px', color: W.tinta, borderRadius: 18,
    background: 'linear-gradient(180deg,#FFF9F3 0%,#FDEEDF 70%,#FCE7D2 100%)',
  },
  kartuPutih: {
    background: W.putih, borderRadius: 20, padding: 16,
    border: `2px solid ${W.garis}`, boxShadow: '0 2px 0 rgba(180,140,90,.08)',
  },
  chipPutih: (warnaTeks = W.oranye) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 14,
    background: W.putih, border: `2px solid ${W.garis}`, color: warnaTeks, fontWeight: 800, fontSize: 12.5,
  }),
  chipKecil: (warnaTeks = W.isi) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,.92)',
    color: warnaTeks, fontWeight: 800, fontSize: 10.5, marginRight: 6, marginTop: 6,
  }),
  tombolGembul: {
    marginTop: 10, padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: W.oranye, color: W.putih, fontWeight: 800, fontSize: 13, boxShadow: `0 3px 0 ${W.oranyeTua}`,
  },
  deskripsi: { color: W.isi, fontSize: 12.5, lineHeight: 1.55, margin: '6px 0 0' },
  stiker: (ukuran = 104) => ({
    width: ukuran, height: ukuran - 8, borderRadius: 16, background: W.putih, padding: 6, flex: '0 0 auto',
    boxShadow: '0 2px 0 rgba(120,80,40,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
};

/** Lingkaran skor SVG (donat) versi terang -- angka bulat di tengah. */
function RingSkor({ persen, ukuran = 46 }) {
  const kosong = persen === null || persen === undefined;
  const p = Math.max(0, Math.min(100, kosong ? 0 : persen));
  const r = (ukuran - 6) / 2;
  const kel = 2 * Math.PI * r;
  const warna = kosong ? '#C9B8A6' : p >= 70 ? '#22C55E' : p >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={ukuran} height={ukuran} style={{ flex: '0 0 auto' }} role="img" aria-label={kosong ? 'belum ada skor' : `skor ${p} persen`}>
      <circle cx={ukuran / 2} cy={ukuran / 2} r={r} stroke="#F1E3D3" strokeWidth={5} fill="none" />
      {!kosong ? (
        <circle
          cx={ukuran / 2} cy={ukuran / 2} r={r} stroke={warna} strokeWidth={5} fill="none"
          strokeDasharray={`${(kel * p) / 100} ${kel}`} strokeLinecap="round"
          transform={`rotate(-90 ${ukuran / 2} ${ukuran / 2})`}
        />
      ) : null}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill={W.tinta} fontSize={ukuran / 3.4} fontWeight={800}>
        {kosong ? '–' : p}
      </text>
    </svg>
  );
}

/** Stiker maskot UTUH satu mapel (tanpa crop) di atas kartu pastel. */
function StikerMascot({ mapel, ukuran = 104 }) {
  const m = urlMascotUntukMapel(mapel);
  return (
    <div style={st.stiker(ukuran)}>
      {m ? (
        <img
          src={m.url}
          alt={`Maskot astronot ${m.label}`}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <span style={{ fontSize: ukuran / 2.6 }} role="img" aria-label="maskot misi">🚀</span>
      )}
    </div>
  );
}

/** Skor per subtes satu sesi dari kunci jawaban mentah (untuk kartu & analitik). */
function subtesSesi(p, s) {
  const daftar = p?.daftarSoal || [];
  return (p?.subtes || []).map((sb) => {
    const ids = new Set(sb.soalIds || sb.daftarSoal || []);
    const kelompok = ids.size ? daftar.filter((q) => ids.has(q.id)) : [];
    const r = kelompok.length ? hitungTotalSkor(kelompok, s?.jawaban || {}) : null;
    return { nama: sb.nama || sb.judul || 'Subtes', skorPersen: r?.totalSkorPersen ?? null };
  }).filter((x) => x.skorPersen !== null);
}

const KEADAAN_TERBUKA = new Set(['berjalan', 'berlangsung', 'izin']);

/** Satu sel tanggal di strip kalender: tampilan per keadaan misi hari itu. */
function SelKalender({ hari, hariIni, terpilih, onPilih, buatRef }) {
  const d = new Date(hari.awalMs);
  const terbuka = KEADAAN_TERBUKA.has(hari.keadaan);
  const gayaSel = {
    width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, boxSizing: 'border-box',
  };
  if (hari.keadaan === 'kosong') {
    Object.assign(gayaSel, { background: 'rgba(255,255,255,.10)', color: 'rgba(255,255,255,.5)' });
  } else if (terbuka) {
    Object.assign(gayaSel, { background: W.putih, boxShadow: '0 3px 0 rgba(0,0,0,.18)' });
  } else if (hari.keadaan === 'selesai') {
    Object.assign(gayaSel, { background: W.emas, boxShadow: '0 3px 0 rgba(0,0,0,.14)' });
  } else if (hari.keadaan === 'mendatang') {
    Object.assign(gayaSel, { background: 'rgba(255,255,255,.16)', border: '2px dashed rgba(255,255,255,.65)' });
  } else { // terlewat
    Object.assign(gayaSel, { background: 'rgba(0,0,0,.22)', border: '2px solid rgba(255,255,255,.18)' });
  }
  const bingkai = terpilih
    ? { outline: '3px solid #FFFFFF', outlineOffset: 2 }
    : (hariIni ? { outline: '2px solid rgba(255,255,255,.85)', outlineOffset: 2 } : {});
  const warnaLabel = hari.keadaan === 'kosong' ? 'rgba(255,255,255,.45)'
    : hari.keadaan === 'selesai' ? '#FFE9A8'
      : terbuka ? '#FFFFFF' : 'rgba(255,255,255,.9)';
  return (
    <button
      type="button"
      ref={buatRef(hari.kunci)}
      onClick={() => onPilih(hari.kunci)}
      aria-label={`Tanggal ${d.getDate()} ${BULAN[d.getMonth()]}${hari.misi.length ? `, ${hari.misi.length} misi` : ', tidak ada misi'}`}
      aria-pressed={terpilih}
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, ...bingkai, borderRadius: 18 }}
    >
      <span style={gayaSel}>
        {hari.keadaan === 'kosong' ? '·' : hari.keadaan === 'terlewat' ? '💤' : '🚀'}
      </span>
      <span style={{ fontSize: 9.5, fontWeight: hariIni || terpilih ? 800 : 700, color: warnaLabel, whiteSpace: 'nowrap' }}>
        {d.getDate()} {BULAN[d.getMonth()]}
      </span>
    </button>
  );
}

/** Kartu misi ala kartu topik Duolingo: pastel + maskot utuh + tombol gembul. */
function KartuMisi({ baris, onBuka }) {
  const { paket, sesi, status } = baris;
  const buka = ms(paket.waktuBuka);
  const mapel = (paket.komposisi || [])[0]?.mapel || (paket.subtes || [])[0]?.nama || paket.judul || '';
  const m = urlMascotUntukMapel(mapel);
  const pastel = PASTEL[(m?.indeks ?? 3) % PASTEL.length];
  const keadaan = status?.keadaan || 'berlangsung';
  const deskripsi = paket.deskripsi || buatDeskripsiPaket({
    jenjang: paket.jenjangTemplate, jenisUjian: paket.jenisUjian, komposisi: paket.komposisi,
    durasiMenit: paket.durasiTotalMenit, jumlahSubtes: (paket.subtes || []).length, tampilkanPembahasan: paket.tampilkanPembahasan,
  });
  const chipStatus = {
    berjalan: ['#15803D', '⏳ LANJUTAN MENUNGGU'],
    izin: ['#B45309', '🎟️ KESEMPATAN KEDUA'],
    berlangsung: ['#15803D', 'SEDANG BERLANGSUNG'],
    mendatang: ['#C2410C', `DIBUKA ${tgl(buka)}, ${jam(buka)}`],
    selesai: ['#6D28D9', 'SELESAI'],
    terlewat: ['#6B7280', 'TERLEWAT'],
  }[keadaan] || ['#C2410C', `Dibuka ${tgl(buka)}`];
  const cta = {
    berjalan: '⏳ LANJUTKAN MISI',
    izin: '🎟️ PAKAI KESEMPATAN KEDUA',
    berlangsung: '🚀 MULAI MISI SEKARANG',
  }[keadaan];
  return (
    <div style={{ background: pastel, borderRadius: 20, padding: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15.5, color: W.tinta, lineHeight: 1.3 }}>{paket.judul}</div>
        <div>
          <span style={st.chipKecil(chipStatus[0])}>{chipStatus[1]}</span>
          <span style={st.chipKecil('#8A6D3B')}>{paket.totalSoal} soal</span>
          <span style={st.chipKecil('#1D4ED8')}>{(paket.subtes || []).length} subtes</span>
          {paket.durasiTotalMenit ? <span style={st.chipKecil('#0F766E')}>{paket.durasiTotalMenit} mnt</span> : null}
        </div>
        <p style={st.deskripsi}>{deskripsi}</p>
        {cta ? (
          <button type="button" style={st.tombolGembul} onClick={() => onBuka(paket.id)}>{cta}</button>
        ) : null}
        {!cta && keadaan === 'mendatang' ? (
          <div style={{ ...st.deskripsi, marginTop: 8, fontWeight: 700, color: '#9A3412' }}>
            🔒 Terbuka otomatis {tgl(buka)} pukul {jam(buka)} — nanti saat strip ini menyala putih, misinya sudah bisa dimulai!
          </div>
        ) : null}
        {!cta && keadaan === 'selesai' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <RingSkor persen={sesi?.status === 'selesai' ? Math.round(sesi.totalSkorPersen || 0) : null} ukuran={44} />
            <div style={{ fontSize: 12, color: W.isi, fontWeight: 700 }}>
              Misi tuntas {tgl(ms(sesi?.waktuSelesai))}.
              {paket.tampilkanPembahasan === false ? ' Pembahasan tidak dibuka di layar — bedah soal bareng tentor, ya.' : ''}
            </div>
          </div>
        ) : null}
        {!cta && keadaan === 'terlewat' ? (
          <div style={{ ...st.deskripsi, marginTop: 8, color: '#B91C1C', fontWeight: 700 }}>
            💤 Misi ini terlewat. Chat tentormu dan minta paket susulan — soal setara & pembahasan bisa dipelajari setelah selesai.
          </div>
        ) : null}
      </div>
      <StikerMascot mapel={mapel} />
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
  const [terpilih, setTerpilih] = useState(null);
  const [muat, setMuat] = useState(true);
  const stripRef = useRef(null);
  const selRef = useRef({});
  const scrollPertama = useRef(false);

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
        // Tanpa dokumen paketnya, judul/mapel hilang dan misi lama DIAM-DIAM
        // lenyap dari strip kalender & analitik. Ambil paket yang kurang per
        // chunk (batas operator 'in' Firestore) ke state TERPISAH; untuk
        // kalender hanya paket yang PUNYA sesi selesai yang ditampilkan.
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

  // Semua misi siswa (paket aktif + paket riwayat bersesi) lengkap dengan
  // tanggal kalendernya -- bahan strip harian pengganti arsip lipatan.
  const misi = useMemo(() => {
    const gabungan = [];
    const tambah = (p, hanyaBilaSesi) => {
      const s = sesiPerPaket.get(p.id);
      if (hanyaBilaSesi && !s) return;
      const status = statusMisi({
        waktuBukaMs: ms(p.waktuBuka), waktuTutupMs: ms(p.waktuTutup),
        sesiStatus: s?.status || null, izinSampaiMs: ms(izinPerPaket[p.id]?.waktuBerlakuSampai), kiniMs: kini,
      });
      const tanggalMs = tanggalMisiMs({
        keadaan: status.keadaan, bukaMs: ms(p.waktuBuka), selesaiMs: ms(s?.waktuSelesai), kiniMs: kini,
      });
      gabungan.push({
        id: p.id, paket: p, sesi: s, status, tanggalMs, keadaan: status.keadaan,
      });
    };
    paket.forEach((p) => tambah(p, false));
    paketRiwayat.forEach((p) => tambah(p, true));
    return gabungan;
  }, [paket, paketRiwayat, sesiPerPaket, izinPerPaket, kini]);

  const kalender = useMemo(() => kalenderMisi(misi, kini), [misi, kini]);

  // Tanggal terpilih mengikuti default kalender (hari ini bermisi -> hari
  // ini; kalau tidak, mendatang terdekat; kalau tidak ada, misi terakhir).
  useEffect(() => {
    if (muat) return;
    if (!terpilih || !kalender.hari.some((h) => h.kunci === terpilih)) setTerpilih(kalender.kunciPilihan);
  }, [muat, kalender, terpilih]);

  // Strip dibuka pada tanggal terpilih (biasanya hari ini) supaya pandangan
  // pertama = hari ini s.d. sebulan ke depan; geser kiri = riwayat otomatis.
  useEffect(() => {
    if (muat || tab !== 'misi' || !terpilih) return;
    const kotak = stripRef.current;
    const el = selRef.current[terpilih];
    if (!kotak || !el) return;
    if (!scrollPertama.current) {
      kotak.scrollLeft = Math.max(0, el.offsetLeft - 10);
      scrollPertama.current = true;
      return;
    }
    const kiri = kotak.scrollLeft;
    const kanan = kiri + kotak.clientWidth;
    if (el.offsetLeft < kiri + 4 || el.offsetLeft + el.offsetWidth > kanan - 4) {
      kotak.scrollTo({ left: Math.max(0, el.offsetLeft - kotak.clientWidth / 2 + el.offsetWidth / 2), behavior: 'smooth' });
    }
  }, [muat, tab, terpilih, kalender]);

  const geserStrip = (arah) => {
    const kotak = stripRef.current;
    if (kotak) kotak.scrollBy({ left: arah * 224, behavior: 'smooth' });
  };

  // Pabrik ref sel kalender: menyimpan elemen per kunci tanggal supaya
  // strip bisa di-scroll otomatis ke tanggal terpilih (props tak dimodifikasi).
  const buatRefSel = (kunci) => (el) => { selRef.current[kunci] = el; };

  const rangkaian = useMemo(() => rangkaianMisi(
    sesi.filter((s) => s.status === 'selesai').map((s) => ms(s.waktuSelesai)).filter((m) => m !== null),
    kini, 6,
  ), [sesi, kini]);

  // 🛡️ AUDIT 2026-10-13: analitik boleh melihat paket riwayat (arsip/
  // nonaktif) supaya sesi lama tidak hilang dari tren.
  const paketUntukAnalitik = useMemo(() => [...paket, ...paketRiwayat], [paket, paketRiwayat]);

  const analitik = useMemo(() => hitungAnalitik(
    [...sesiPerPaket.values()].filter((s) => s.status === 'selesai').map((s) => {
      const p = paketUntukAnalitik.find((x) => x.id === (s.paketId || s.tryoutId));
      return {
        nama: p?.judul || 'Try out',
        jenisUjian: p?.jenisUjian || '',
        totalSkorPersen: s.totalSkorPersen,
        waktuSelesaiMs: ms(s.waktuSelesai),
        createdAtMs: ms(s.createdAt),
        totalSoal: p?.totalSoal || (p?.daftarSoal || []).length,
        subtes: subtesSesi(p, s),
      };
    }),
  ), [sesiPerPaket, paketUntukAnalitik]);

  if (muat) return <div style={{ padding: 30, color: W.sub }}>🛰️ Menyiapkan papan jelajah…</div>;

  const hariTerpilih = kalender.hari.find((h) => h.kunci === terpilih) || null;
  const prioritas = { berjalan: 0, berlangsung: 1, izin: 2, mendatang: 3, selesai: 4, terlewat: 5 };
  const misiTerpilih = hariTerpilih
    ? [...hariTerpilih.misi].sort((a, b) => (prioritas[a.keadaan] - prioritas[b.keadaan])
      || (ms(a.paket.waktuBuka) || 0) - (ms(b.paket.waktuBuka) || 0))
    : [];
  const dTerpilih = hariTerpilih ? new Date(hariTerpilih.awalMs) : null;
  const inisial = (nama || 'S').trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join('').toUpperCase();
  const pesanStreak = progres.streak > 0 && progres.statusStreak === 'aman'
    ? `Api streak-mu menyala ${progres.streak} hari — aman hari ini. Sampai jumpa di misi berikutnya!`
    : progres.streak > 0 && progres.statusStreak === 'berisiko'
      ? `Api streak-mu ${progres.streak} hari tapi belum aman hari ini — kerjakan latihan harianmu biar tidak padam!`
      : progres.streak > 0
        ? `Streak-mu ${progres.streak} hari. Nyalakan lagi lewat latihan harian & misi try out!`
        : 'Nyalakan api pertamamu: kerjakan latihan harian atau misi try out!';
  return (
    <div style={st.bungkus}>
      <style>{'.pj-strip{scrollbar-width:none;-ms-overflow-style:none}.pj-strip::-webkit-scrollbar{display:none}'}</style>

      {/* ===== HEADER PROFIL + XP + STREAK (peta mockup Duolingo owner) ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: W.oranye, fontWeight: 900, fontSize: 18, color: W.putih, boxShadow: `0 3px 0 ${W.oranyeTua}`,
          }}>{inisial}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2, color: W.oranye }}>{nama}</div>
            <div style={{ color: W.sub, fontSize: 12, fontWeight: 700 }}>{kelas ? `🎓 ${kelas} · ` : ''}Penjelajah Gemilang</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={st.chipPutih(W.oranye)}><Star size={14} color="#F59E0B" fill="#FDE047" /> {progres.xp} XP</span>
          <span style={st.chipPutih('#0E7490')}>+{progres.xpMingguIni} pekan ini</span>
          <span style={st.chipPutih(progres.streak > 0 ? W.oranye : W.sub)}>🔥 {progres.streak} hari</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '16px 0 10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: W.tinta }}>🪐 Papan Jelajah</h2>
          <p style={{ margin: '2px 0 0', color: W.sub, fontSize: 12.5, fontWeight: 600 }}>
            Misi try out & papan analitik pribadimu — bukan perlombaan, perjalananmu sendiri.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: W.oranyeLembut, borderRadius: 999, padding: 4 }}>
          {DAFTAR_TAB.map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => pindahTab(t.k)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
                borderRadius: 999, padding: '8px 16px', fontWeight: 800, fontSize: 12.5,
                background: tab === t.k ? W.putih : 'transparent',
                color: tab === t.k ? W.oranye : '#C0653A',
                boxShadow: tab === t.k ? '0 2px 0 rgba(180,90,20,.12)' : undefined,
              }}
            >
              <t.Ikon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'misi' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ===== KARTU STREAK + STRIP KALENDER HARIAN (pengganti arsip) ===== */}
          <div style={{ background: W.oranye, borderRadius: 24, padding: 16, boxShadow: `0 4px 0 ${W.oranyeTua}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: W.putih }}>
                <Flame size={16} style={{ verticalAlign: -3 }} fill="#FFD44D" color="#F45D00" /> Rangkaian misimu
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,.22)',
                color: W.putih, fontWeight: 800, fontSize: 11.5,
              }}>🔥 {rangkaian.beruntun} pekan beruntun</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => geserStrip(-1)}
                aria-label="Geser kalender ke kiri (misi sebelumnya)"
                style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.2)', color: W.putih, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><ChevronLeft size={18} /></button>
              <div ref={stripRef} className="pj-strip" style={{ overflowX: 'auto', display: 'flex', gap: 8, padding: '6px 2px 10px', flex: 1 }}>
                {kalender.hari.map((h) => (
                  <SelKalender
                    key={h.kunci}
                    hari={h}
                    hariIni={h.kunci === kalender.kunciHariIni}
                    terpilih={h.kunci === terpilih}
                    onPilih={setTerpilih}
                    buatRef={buatRefSel}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => geserStrip(1)}
                aria-label="Geser kalender ke kanan (misi mendatang)"
                style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.2)', color: W.putih, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><ChevronRight size={18} /></button>
            </div>
            <div style={{
              background: W.putih, borderRadius: 14, padding: '10px 14px', color: '#C05621',
              fontWeight: 700, fontSize: 12.5, textAlign: 'center',
            }}>{pesanStreak}</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
              ↔ Geser strip: ke kiri tanggal-tanggal try out sebelumnya (beserta hasilnya), ke kanan sampai sebulan ke depan. Ketuk tanggal untuk membuka misinya.
            </div>
          </div>

          {/* ===== KARTU MISI PADA TANGGAL TERPILIH ===== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: W.tinta }}>
              {dTerpilih ? `📅 ${HARI[dTerpilih.getDay()]}, ${dTerpilih.getDate()} ${BULAN[dTerpilih.getMonth()]}` : ''}
            </div>
            {misiTerpilih.length ? (
              <span style={{ ...st.chipKecil(W.oranye), marginTop: 0 }}>{misiTerpilih.length} misi</span>
            ) : null}
          </div>
          {misiTerpilih.length ? misiTerpilih.map((b) => (
            <KartuMisi key={b.id} baris={b} onBuka={(id) => navigate(`/siswa/tryout/${id}`)} />
          )) : (
            <div style={st.kartuPutih}>
              🌙 Tidak ada misi pada tanggal ini. Geser strip ke tanggal bertanda 🚀 untuk melihat misi atau hasilnya.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analitik.jumlahSesi === 0 ? (
            <div style={st.kartuPutih}>
              🛰️ Papan Analitik khusus try out TKA & UTBK. Selesaikan misi TKA/UTBK pertamamu, tren nilai pekananmu akan muncul di sini.
            </div>
          ) : (
            <>
              <div style={st.kartuPutih}>
                <div style={{ fontWeight: 800, fontSize: 14, color: W.tinta }}>
                  <Target size={15} style={{ verticalAlign: -3, color: W.oranye }} /> Tren skor TKA/UTBK per pekan
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'flex-end' }}>
                  {analitik.tren.map((t) => (
                    <div key={t.label} style={{ textAlign: 'center' }}>
                      <RingSkor persen={t.skor} ukuran={54} />
                      <div style={{ fontSize: 10.5, color: W.sub, marginTop: 4, fontWeight: 700 }}>{t.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: t.delta === null ? W.sub : t.delta >= 0 ? '#16A34A' : '#DC2626' }}>
                        {t.delta === null ? '—' : `${t.delta >= 0 ? '▲ +' : '▼ '}${t.delta}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {analitik.subtesRata.length ? (
                <>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: W.tinta }}>🎯 Peta mapelmu</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10 }}>
                    {analitik.subtesRata.map((s, i) => (
                      <div key={s.nama} style={{ background: PASTEL[i % PASTEL.length], borderRadius: 20, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <StikerMascot mapel={s.nama} ukuran={72} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: W.tinta }}>{s.nama}</div>
                          <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,.75)', marginTop: 6 }}>
                            <div style={{ height: '100%', width: `${Math.min(100, s.skor)}%`, borderRadius: 999, background: W.oranye }} />
                          </div>
                          <div style={{ fontSize: 11, color: W.isi, fontWeight: 700, marginTop: 4 }}>rata-rata skor mu di mapel ini</div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 20, color: W.oranye, flex: '0 0 auto' }}>{s.skor}%</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              {analitik.kecepatan ? (
                <div style={st.kartuPutih}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: W.tinta }}>
                    <Timer size={15} style={{ verticalAlign: -3, color: W.oranye }} /> Tempo kerja (misi terakhir)
                  </div>
                  <div style={{ fontSize: 13, marginTop: 6, color: W.isi }}>
                    ~<b style={{ fontSize: 20, color: analitik.kecepatan.wajar ? '#16A34A' : '#DC2626' }}>{analitik.kecepatan.detikPerSoal}</b> detik/soal
                    {' '}(target ≤ 90). Perekam tempo per subtes dipasang setelah try out Sabtu.
                  </div>
                </div>
              ) : null}
              <div style={st.kartuPutih}>
                <div style={{ fontWeight: 800, fontSize: 14, color: W.tinta }}>
                  <Rocket size={15} style={{ verticalAlign: -3, color: W.oranye }} /> Evaluasi & tips pintar
                </div>
                {analitik.evaluasi ? <p style={st.deskripsi}>{analitik.evaluasi}</p> : null}
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, color: W.isi, lineHeight: 1.7 }}>
                  {analitik.tips.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
