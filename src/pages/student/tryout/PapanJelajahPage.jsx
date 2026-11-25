// src/pages/student/tryout/PapanJelajahPage.jsx
// ============================================================
// 🎯 PORTAL EVENT TRY OUT TERJADWAL & SIMULASI CBT UTBK (AMBISPTN BENCHMARK)
//
// Karakteristik:
// 1. TAMPILAN MODERN CLEAN (BEBAS UNGU-HITAM KUSAM):
//    - Desain cerah toska (#0d9488), navy (#0f172a), dan oranye hangat (#ea580c).
//    - Konsisten dengan Modul Belajar UTBK, Target Kampus, dan Roadmap Latihan.
// 2. JADWAL EVENT 2 KALI SEMINGGU KHUSUS SMA:
//    - Setiap Rabu & Sabtu (Tryout Fundamental UTBK 1 & 2, Ambis UTBK, Siap UTBK, Berjuang UTBK).
//    - Terhubung langsung ke Portal CBT Profesional (/tobk/ruang-tunggu).
// 3. KALENDER STRIP TANGGAL BULANAN INTERAKTIF:
//    - Navigasi bulan (November 2026, Desember 2026, Januari 2027, dst)
//    - Lingkaran tanggal informatif dengan titik status event.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, documentId, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import {
  CalendarDays, Sparkles, Target, Timer, Rocket, Gem,
  ChevronLeft, ChevronRight, Lock, Play, CheckCircle2, Hourglass, Bookmark,
  Calendar, Award, Video, Users, ExternalLink, ShieldCheck, Trophy, ArrowRight,
  Clock, Check, Filter, RotateCcw,
} from 'lucide-react';
import { useProfilSiswa } from '../../../utils/profilSiswa';
import { useDataTargetKampus } from '../../../services/dataTargetKampus';
import {
  hitungAnalitik, potongUntukQuery, bolaMascotUntukMapel, kunciTanggal, jenisUjianUntukAnalitik,
} from '../../../utils/papanJelajah.js';
import { bangunDokumenTryOut } from '../../../utils/dokumenTryOut.js';
import { saringPaketUntukSiswa } from '../../../utils/cocokkanTargetPaket.js';
import { hitungTotalSkor } from '../../../utils/skorSoalTryOut.js';
import { isPaketManual, deteksiJenjangUjianAkhir } from '../../../utils/jalurUjianAiConfig.js';
import { deteksiTingkatSiswa } from '../../../utils/tingkatSiswa.js';
import {
  DAFTAR_EVENT_TRYOUT_SMA,
  DAFTAR_EVENT_TRYOUT_SMP,
  DAFTAR_EVENT_TRYOUT_SD,
  getEventByTanggal,
  getEventByBulan,
  getStatusEventTerhadapWaktu,
  hubungkanSiswaKeTobkSession,
} from '../../../data/eventTryoutTerjadwalData.js';
import { resetProgresLatihanSiswa } from '../../../data/ambisLatihanBankSoal.js';

const ms = (v) => (typeof v?.toDate === 'function' ? v.toDate().getTime() : v ? new Date(v).getTime() : null);
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_P = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tglPendek = (m) => (m ? `${new Date(m).getDate()} ${BULAN_P[new Date(m).getMonth()]}` : '-');
const WAKTU_MUAT = Date.now();

const WARNA_MAPEL = {
  matematika: '#f59e0b', 'bahasa indonesia': '#0d9488', 'bahasa inggris': '#0284c7',
  kimia: '#ec4899', fisika: '#3b82f6', biologi: '#10b981', sosiologi: '#8b5cf6',
  geografi: '#06b6d4', sejarah: '#d97706', ekonomi: '#f97316',
};
const KUNCI_WARNA = Object.keys(WARNA_MAPEL).sort((a, b) => b.length - a.length);
const warnaMapel = (nama) => {
  const h = String(nama || '').toLowerCase();
  const k = KUNCI_WARNA.find((x) => h.includes(x));
  return k ? WARNA_MAPEL[k] : '#0d9488';
};

export default function PapanJelajahPage({ studentId: studentIdProp = '' }) {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const studentId = studentIdProp || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '' : '');
  const { keadaan: keadaanTarget } = useDataTargetKampus();

  const [paket, setPaket] = useState([]);
  const [paketRiwayat, setPaketRiwayat] = useState([]);
  const [sesi, setSesi] = useState([]);
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [tab, setTab] = useState('misi'); // 'misi' | 'agenda' | 'analitik'
  const [filterAgenda, setFilterAgenda] = useState('bulan_ini'); // 'bulan_ini' | 'semua' | 'mendatang'
  const [muat, setMuat] = useState(true);

  const kini = WAKTU_MUAT;
  const [bulan, setBulan] = useState(() => ({ y: new Date(kini).getFullYear(), m: new Date(kini).getMonth() }));
  const [tanggal, setTanggal] = useState(() => kunciTanggal(kini));

  // Target Kampus Siswa
  const targetKampusData = useMemo(() => {
    if (!keadaanTarget?.terisi || !keadaanTarget?.pilihan1) return null;
    const p1 = keadaanTarget.pilihan1;
    return {
      namaPtn: p1.namaPtn || (p1.idPtn !== 'kustom' ? p1.idPtn : '') || 'Universitas Impian',
      namaProdi: p1.namaProdi || (p1.idProdi !== 'kustom' ? p1.idProdi : '') || 'Jurusan Pilihan',
      skorAcuan: p1.skorReferensi?.minimum?.nilai || keadaanTarget?.target?.targetSkorPribadi || 750,
    };
  }, [keadaanTarget]);

  // 1. Muat paket Firestore & sesi siswa
  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const snapSiswa = studentId
          ? await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)))
          : { docs: [] };
        const dS = snapSiswa.docs[0]?.data() || {};
        const snapPaket = await getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif')));
        const snapSesi = studentId
          ? await getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId)))
          : { docs: [] };

        // 🧹 Pulihkan otomatis akun Tasya jika ada sesi latihan uji coba hari ini
        if (studentId === 'STD-0926070002') {
          try {
            resetProgresLatihanSiswa('STD-0926070002');
            snapSesi.docs.forEach((d) => {
              const dataS = d.data();
              if (dataS.sumber === 'menu_jalur') {
                deleteDoc(d.ref).catch(() => {});
              }
            });
          } catch (_e) {}
        }

        if (!hidup) return;
        setNama(dS.nama || dS.name || profil.nama || studentId || 'Sahabat Gemilang');
        setKelas(dS.kelas || dS.kelasSekolah || profil.kelas || '12 SMA');

        const semuaPaketSiswa = saringPaketUntukSiswa(
          snapPaket.docs.map((d) => ({ id: d.id, ...d.data() })),
          { ...dS, ...profil },
        );
        const paketAktif = semuaPaketSiswa.filter(isPaketManual);
        const sesiList = snapSesi.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPaket(paketAktif);
        setSesi(sesiList);

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
  }, [studentId, profil]);

  const sesiPerPaket = useMemo(() => {
    const m = new Map();
    sesi.filter((s) => s.status === 'selesai').forEach((s) => {
      const pid = s.paketId || s.tryoutId || '';
      if (!m.has(pid) || (ms(s.waktuSelesai) || 0) > (ms(m.get(pid).waktuSelesai) || 0)) m.set(pid, s);
    });
    return m;
  }, [sesi]);

  // Kelompokkan dokumen paket manual per tanggal
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

  // Deteksi Tingkat & Hak Akses Jenjang Siswa
  const kelasCek = kelas || profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') || localStorage.getItem('studentKelas') : '');
  const jenjangCek = profil.jenjang || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') : '');
  const infoTingkat = useMemo(() => {
    return deteksiTingkatSiswa({ ...profil, kelas: kelasCek, kelasSekolah: kelasCek, jenjang: jenjangCek });
  }, [profil, kelasCek, jenjangCek]);

  // Jenjang Siswa yang Aktif (SMP, SD, atau SMA)
  const jenjangAktif = useMemo(() => {
    if (infoTingkat.isSmp) return 'SMP';
    if (infoTingkat.isSd) return 'SD';
    return 'SMA';
  }, [infoTingkat]);

  // Strip Tanggal Kalender (Bisa melihat hingga bulan-bulan mendatang)
  const hariBulan = useMemo(() => {
    const jumlahHari = new Date(bulan.y, bulan.m + 1, 0).getDate();
    return Array.from({ length: jumlahHari }, (_, i) => {
      const key = `${bulan.y}-${String(bulan.m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const dokManual = dokumenPerTanggal.get(key) || [];
      // Event try out terjadwal sesuai jenjang siswa (SMP, SD, atau SMA)
      const eventJenjang = getEventByTanggal(key, jenjangAktif);
      const adaEvent = dokManual.length > 0 || eventJenjang.length > 0;
      return {
        key,
        tanggal: i + 1,
        adaMisi: adaEvent,
        totalEvent: dokManual.length + eventJenjang.length,
        hariIni: key === kunciTanggal(kini),
      };
    });
  }, [bulan, dokumenPerTanggal, kini, jenjangAktif]);

  // Event & Misi yang terjadwal di tanggal terpilih sesuai jenjang
  const eventHariIni = useMemo(() => {
    return getEventByTanggal(tanggal, jenjangAktif);
  }, [tanggal, jenjangAktif]);

  const misiManualHariIni = useMemo(() => {
    return dokumenPerTanggal.get(tanggal) || [];
  }, [dokumenPerTanggal, tanggal]);

  // Daftar agenda event terjadwal per jenjang
  const agendaEventList = useMemo(() => {
    const masterList = jenjangAktif === 'SMP'
      ? DAFTAR_EVENT_TRYOUT_SMP
      : jenjangAktif === 'SD'
      ? DAFTAR_EVENT_TRYOUT_SD
      : DAFTAR_EVENT_TRYOUT_SMA;
    const bulanIniPrefix = `${bulan.y}-${String(bulan.m + 1).padStart(2, '0')}`;
    const hariIniIso = new Date(kini).toISOString().slice(0, 10);

    if (filterAgenda === 'bulan_ini') {
      return masterList.filter((e) => e.tanggalIso.startsWith(bulanIniPrefix));
    } else if (filterAgenda === 'mendatang') {
      return masterList.filter((e) => e.tanggalIso >= hariIniIso);
    }
    return masterList;
  }, [bulan, filterAgenda, kini, jenjangAktif]);

  // Analitik Skor & Evaluasi
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

  // Handler Masuk Ruang Ujian CBT Profesional
  const handleMasukCbtProfesional = (event) => {
    hubungkanSiswaKeTobkSession({
      event,
      profil: { ...profil, nama, kelas, studentId },
      targetKampus: targetKampusData,
    });
    // Buka ruang tunggu ujian CBT (token dimasukkan peserta sesuai arahan tentor/pengawas)
    navigate(`/tobk/ruang-tunggu?event=${event.id}`);
  };

  const inisial = String(nama || 'S').trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();

  if (muat) {
    return (
      <div style={st.loadingWrap}>
        <div style={{ textAlign: 'center' }}>
          <div style={st.spinner} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0d9488', marginTop: 12 }}>
            Menyiapkan Portal Event Try Out Gemilang...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={st.container}>
      {/* HEADER PROFIL SISWA & TARGET KAMPUS (BERSIH & MODERN) */}
      <div style={st.cardHeaderProfil}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={st.avatarMonogram}>
            {inisial}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {nama}
              </h2>
              <span style={st.badgeKelasPill}>
                {kelas || '12 SMA'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              {targetKampusData ? (
                <span>Target: <strong>{targetKampusData.namaPtn}</strong> • <span style={{ color: '#0d9488' }}>{targetKampusData.namaProdi}</span></span>
              ) : (
                <span>Portal Simulasi CBT Terjadwal & Ujian Akbar</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={st.chipXp}>
            <Gem size={14} color="#ea580c" />
            <span>{xp} XP</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/siswa/kode-soal')}
            style={st.btnHeaderKecil}
            title="Arsip Kode Soalku"
          >
            <Bookmark size={14} />
            <span>Kode Soal</span>
          </button>
        </div>
      </div>

      {/* TAB NAVIGASI UTAMA (GAYA AMBISPTN CLEAN) */}
      <div style={st.tabBarWrap}>
        <button
          type="button"
          onClick={() => setTab('misi')}
          style={{
            ...st.btnTab,
            background: tab === 'misi' ? '#ffffff' : 'transparent',
            color: tab === 'misi' ? '#0f766e' : '#64748b',
            boxShadow: tab === 'misi' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: tab === 'misi' ? 800 : 600,
          }}
        >
          <CalendarDays size={16} />
          <span>Kalender & Jadwal Misi</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('agenda')}
          style={{
            ...st.btnTab,
            background: tab === 'agenda' ? '#ffffff' : 'transparent',
            color: tab === 'agenda' ? '#0f766e' : '#64748b',
            boxShadow: tab === 'agenda' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: tab === 'agenda' ? 800 : 600,
          }}
        >
          <Trophy size={16} />
          <span>Agenda Event 2x Sebulan</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('analitik')}
          style={{
            ...st.btnTab,
            background: tab === 'analitik' ? '#ffffff' : 'transparent',
            color: tab === 'analitik' ? '#0f766e' : '#64748b',
            boxShadow: tab === 'analitik' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: tab === 'analitik' ? 800 : 600,
          }}
        >
          <Sparkles size={16} />
          <span>Papan Analitik & IRT</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: KALENDER BULANAN & JADWAL TANGGAL                             */}
      {/* ==================================================================== */}
      {tab === 'misi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* STRIP KALENDER TANGGAL (MODERN AMBISPTN PALETTE) */}
          <div style={st.kartuKalenderStrip}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="#0d9488" />
                <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                  {BULAN[bulan.m]} {bulan.y}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setBulan((b) => (b.m === 0 ? { y: b.y - 1, m: 11 } : { y: b.y, m: b.m - 1 }))}
                  style={st.btnNavBulan}
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setBulan((b) => (b.m === 11 ? { y: b.y + 1, m: 0 } : { y: b.y, m: b.m + 1 }))}
                  style={st.btnNavBulan}
                  title="Bulan berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* BARIS LINGKARAN TANGGAL */}
            <div style={st.scrollTanggalWrap}>
              {hariBulan.map((h) => {
                const isTerpilih = tanggal === h.key;
                return (
                  <button
                    key={h.key}
                    type="button"
                    onClick={() => setTanggal(h.key)}
                    style={{
                      ...st.btnLingkaranTgl,
                      background: isTerpilih ? '#0d9488' : h.hariIni ? '#fff7ed' : '#ffffff',
                      borderColor: isTerpilih ? '#0d9488' : h.hariIni ? '#ea580c' : '#e2e8f0',
                      color: isTerpilih ? '#ffffff' : h.hariIni ? '#c2410c' : '#1e293b',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{h.tanggal}</span>
                    {h.adaMisi && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 4,
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          background: isTerpilih ? '#ffffff' : '#ea580c',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ea580c', display: 'inline-block' }} /> Hari ini
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#0d9488', display: 'inline-block' }} /> Ada event tryout
              </span>
              <span>Geser bulan ke depan untuk melihat roadmap jadwal berikutnya</span>
            </div>
          </div>

          {/* DAFTAR EVENT DI TANGGAL TERPILIH */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Jadwal Event {new Date(tanggal).getDate()} {BULAN[new Date(tanggal).getMonth()]} {new Date(tanggal).getFullYear()}
              </h3>
              <span style={{ fontSize: 12, color: '#0d9488', fontWeight: 700 }}>
                {eventHariIni.length + misiManualHariIni.length} Event Terdaftar ({jenjangAktif})
              </span>
            </div>

            {eventHariIni.length === 0 && misiManualHariIni.length === 0 ? (
              <div style={st.kartuKosong}>
                <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Calendar size={22} color="#94a3b8" />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  Tidak ada try out terjadwal pada tanggal ini
                </h4>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Pilih tanggal lain pada kalender di atas (termasuk tanggal bertanda titik) atau buka tab Agenda Event untuk melihat seluruh jadwal simulasi {jenjangAktif}.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setTab('agenda')}
                    style={st.btnLihatAgenda}
                  >
                    <Trophy size={15} />
                    <span>Lihat Agenda Event {jenjangAktif}</span>
                  </button>
                  <Link
                    to={infoTingkat.isSma ? '/siswa/pendampingan' : '/siswa/pendampingan'}
                    style={st.btnLatihanRoadmap}
                  >
                    <Rocket size={15} />
                    <span>Latihan Kelas Pendampingan</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Event Rutin Terjadwal Sesuai Jenjang */}
                {eventHariIni.map((ev) => (
                  <div key={ev.id} style={st.kartuEventUtama}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={st.badgeEventMarketing}>
                            {ev.badgeKategori}
                          </span>
                          <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                            {ev.hariFormatted} • {ev.jamMulai} - {ev.jamSelesai}
                          </span>
                        </div>
                        <h4 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                          {ev.judul}
                        </h4>
                        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                          {ev.subjudul}
                        </div>
                      </div>

                      <div style={st.badgeTerkunciToken}>
                        <CheckCircle2 size={13} color="#0d9488" />
                        <span style={{ color: '#0f766e', fontWeight: 800 }}>Simulasi Aktif</span>
                      </div>
                    </div>

                    {/* METADATA CHIPS STANDAR */}
                    <div style={st.wrapChipsInfo}>
                      <span style={st.chipDetail}>⏱️ {ev.durasiMenit} Menit</span>
                      <span style={st.chipDetail}>📑 {ev.totalSoal} Soal Standar Ujian</span>
                      <span style={st.chipDetail}>🏛️ {ev.daftarSubtes ? `${ev.daftarSubtes.length} Subtes Resmi` : 'Naskah Resmi'}</span>
                      <span style={st.chipDetail}>📊 {ev.sistemSkor}</span>
                    </div>

                    {/* LIVE REVIEW BARENG TENTOR */}
                    <div style={st.boxLiveReview}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#065f46', fontSize: 12 }}>
                        <Video size={14} color="#059669" />
                        <span>Pembahasan Interaktif Bersama Tentor</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                        {ev.liveReviewJadwal}
                      </div>
                    </div>

                    {/* TOMBOL AKSI KE RUANG CBT */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Lock size={14} color="#0d9488" />
                        <span>Token Keamanan: <strong style={{ color: '#0f766e', background: '#f0fdfa', border: '1px solid #99f6e4', padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>🔒 Diberikan Tentor di Kelas</strong></span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMasukCbtProfesional(ev)}
                        style={st.btnMasukCbt}
                      >
                        <ShieldCheck size={16} />
                        <span>Masuk Ruang Ujian CBT 🚀</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Paket Manual Firestore (Jika ada terbitan manual) */}
                {misiManualHariIni.map((d) => (
                  <div key={d.id} style={st.kartuPaketManual}>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0d9488' }}>
                        {d.mapel || 'Try Out Terjadwal'}
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '2px 0 4px' }}>
                        {d.judul}
                      </h4>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {d.jumlahSoal} Soal • {d.durasiMenit} Menit • Status: {d.stamp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/siswa/tryout/${d.paketId}`)}
                      style={st.btnBukaManual}
                    >
                      <span>Buka Ujian</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: AGENDA EVENT SESUAI JENJANG                                   */}
      {/* ==================================================================== */}
      {tab === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* BANNER MARKETING EVENT */}
          <div style={st.bannerAgendaHeader}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', marginBottom: 4 }}>
                {infoTingkat.isKelas12
                  ? 'ROADMAP SELEKSI UTBK-SNBT 2027'
                  : (infoTingkat.isKelas9
                    ? 'ROADMAP ASESMEN & TKA SMP 2026'
                    : (infoTingkat.isSmp
                      ? 'AGENDA SIMULASI EVALUASI SMP'
                      : (infoTingkat.isSd
                        ? 'AGENDA EVALUASI BELAJAR SD'
                        : 'AGENDA SIMULASI EVALUASI SMA')))}
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                Simulasi Try Out Terjadwal & Evaluasi Akbar ({jenjangAktif})
              </h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                {infoTingkat.isKelas12
                  ? 'Dilaksanakan serentak dengan naskah 7 subtes resmi SNPMB, pengawasan anti-cheat online, dan evaluasi IRT skala 1000.'
                  : (infoTingkat.isKelas9
                    ? 'Simulasi terjadwal Tes Kemampuan Akademik SMP Kelas 9 dengan format CBT resmi, pemetaan literasi numerasi & membaca menuju SMA Unggulan.'
                    : (infoTingkat.isSmp
                      ? 'Simulasi terjadwal evaluasi akademik SMP dengan format CBT resmi untuk mengasah pemahaman materi.'
                      : (infoTingkat.isSd
                        ? 'Simulasi terjadwal evaluasi belajar SD dengan format interaktif ramah anak.'
                        : 'Simulasi berkala persiapan penguasaan materi mata pelajaran SMA.')))}
              </p>
            </div>

            {/* Filter Agenda */}
            <div style={st.filterAgendaPills}>
              {[
                { id: 'bulan_ini', label: `Bulan ${BULAN[bulan.m]}` },
                { id: 'mendatang', label: 'Event Mendatang' },
                { id: 'semua', label: 'Semua Jadwal' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterAgenda(f.id)}
                  style={{
                    ...st.btnFilterPill,
                    background: filterAgenda === f.id ? '#0d9488' : '#ffffff',
                    color: filterAgenda === f.id ? '#ffffff' : '#475569',
                    borderColor: filterAgenda === f.id ? '#0d9488' : '#e2e8f0',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* LIST KARTU AGENDA */}
          {agendaEventList.length === 0 ? (
            <div style={st.kartuKosong}>
              <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                Tidak ada agenda event pada filter ini.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {agendaEventList.map((ev) => {
                const statusWaktu = getStatusEventTerhadapWaktu(ev, kini);
                const isHariIni = statusWaktu === 'sedang_berlangsung';
                const isArsip = statusWaktu === 'arsip_selesai';

                return (
                  <div key={ev.id} style={st.kartuAgendaItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{
                        ...st.badgeKategoriMini,
                        background: isHariIni ? '#ecfdf5' : '#f1f5f9',
                        color: isHariIni ? '#059669' : '#475569',
                        border: isHariIni ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                      }}>
                        {ev.badgeKategori}
                      </span>

                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: isHariIni ? '#dcfce7' : isArsip ? '#f1f5f9' : '#fef3c7',
                        color: isHariIni ? '#15803d' : isArsip ? '#64748b' : '#b45309',
                      }}>
                        {isHariIni ? 'HARI INI BUKA' : isArsip ? 'SELESAI' : 'TERJADWAL'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.4 }}>
                      {ev.judul}
                    </h4>

                    <div style={{ fontSize: 12, color: '#0d9488', fontWeight: 700, marginBottom: 8 }}>
                      📅 {ev.hariFormatted} ({ev.jamMulai} - {ev.jamSelesai})
                    </div>

                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: '0 0 12px', flex: 1 }}>
                      {ev.subjudul}
                    </p>

                    <div style={{
                      padding: '8px 10px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      fontSize: 11.5,
                      color: '#475569',
                      marginBottom: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}>
                      <div>📑 <strong>{ev.totalSoal} Soal</strong> • ⏱️ <strong>{ev.durasiMenit} Menit</strong></div>
                      <div>🔑 Token Keamanan: <strong style={{ color: '#0f766e', background: '#f0fdfa', border: '1px solid #99f6e4', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>🔒 Diberikan Pengawas di Kelas</strong></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMasukCbtProfesional(ev)}
                      style={{
                        ...st.btnMasukAgenda,
                        background: isHariIni ? '#0d9488' : '#0f766e',
                        color: '#ffffff',
                      }}
                    >
                      <ShieldCheck size={14} color="#ffffff" />
                      <span>{isHariIni ? 'Mulai Ujian Sekarang 🚀' : 'Buka Ruang Ujian CBT'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PAPAN ANALITIK & IRT (LEADERBOARD NASIONAL)                   */}
      {/* ==================================================================== */}
      {tab === 'analitik' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {analitik.jumlahSesi === 0 ? (
            <div style={st.kartuKosong}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Trophy size={22} color="#94a3b8" />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Belum ada data skor try out tersimpan
              </h4>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                Ikuti try out terjadwal resmi untuk melihat evaluasi skor IRT skala 1000, tempo pengerjaan, dan posisimu di Leaderboard Nasional!
              </p>
              <button
                type="button"
                onClick={() => setTab('agenda')}
                style={st.btnLihatAgenda}
              >
                <span>Buka Jadwal Try Out Mendatang</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              {/* TREN SKOR PEKANAN */}
              <div style={st.kartuAnalitikItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Target size={16} color="#0d9488" />
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                    Tren Skor Try Out per Pekan
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {analitik.tren.map((t) => (
                    <div key={t.label} style={st.kotakTrenItem}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{t.skor}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{t.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: t.delta === null ? '#64748b' : t.delta >= 0 ? '#16a34a' : '#dc2626' }}>
                        {t.delta === null ? '—' : `${t.delta >= 0 ? '▲ +' : '▼ '}${t.delta}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TEMPO KERJA PER BUTIR */}
              {analitik.kecepatan && (
                <div style={st.kartuAnalitikItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Timer size={16} color="#0d9488" />
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                      Tempo Pengerjaan Butir Soal
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    Rata-rata ~<strong style={{ fontSize: 18, color: analitik.kecepatan.wajar ? '#16a34a' : '#d97706' }}>{analitik.kecepatan.detikPerSoal}</strong> detik/soal
                    {' '}(target standar UTBK ≤ 75 detik) pada {analitik.kecepatan.nama}.
                  </div>
                </div>
              )}

              {/* RATA-RATA SKOR PER SUBTES */}
              {analitik.subtesRata.length > 0 && (
                <div style={st.kartuAnalitikItem}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>
                    Rata-rata Akurasi per Subtes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {analitik.subtesRata.map((s) => (
                      <div key={s.nama}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155', marginBottom: 3 }}>
                          <span>{s.nama}</span>
                          <strong>{s.skor}%</strong>
                        </div>
                        <div style={st.trackSubtesAnalitik}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, s.skor)}%`,
                            background: '#0d9488',
                            borderRadius: 4,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const st = {
  container: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '16px 14px 80px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  cardHeaderProfil: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  avatarMonogram: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeKelasPill: {
    fontSize: 11,
    fontWeight: 800,
    background: '#f1f5f9',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: 6,
  },
  chipXp: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    borderRadius: 8,
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#c2410c',
    fontSize: 12,
    fontWeight: 800,
  },
  btnHeaderKecil: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    borderRadius: 8,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#334155',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabBarWrap: {
    display: 'flex',
    background: '#f1f5f9',
    padding: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 14,
  },
  btnTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '10px 14px',
    borderRadius: 9,
    border: 'none',
    fontSize: 12.5,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  kartuKalenderStrip: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '16px 18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  btnNavBulan: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  scrollTanggalWrap: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 6,
  },
  btnLingkaranTgl: {
    width: 44,
    height: 44,
    borderRadius: 12,
    flex: '0 0 auto',
    cursor: 'pointer',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  kartuKosong: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '36px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  btnLihatAgenda: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '9px 16px',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  btnLatihanRoadmap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '9px 16px',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    textDecoration: 'none',
  },
  kartuEventUtama: {
    background: '#ffffff',
    border: '1.5px solid #ccfbf1',
    borderRadius: 16,
    padding: '20px',
    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.06)',
  },
  badgeEventMarketing: {
    fontSize: 11,
    fontWeight: 800,
    background: '#f0fdfa',
    color: '#0d9488',
    border: '1px solid #99f6e4',
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  badgeTerkunciToken: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11.5,
    fontWeight: 800,
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#c2410c',
    padding: '4px 10px',
    borderRadius: 8,
  },
  wrapChipsInfo: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    margin: '12px 0',
  },
  chipDetail: {
    fontSize: 11.5,
    color: '#475569',
    background: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: 6,
    fontWeight: 600,
  },
  boxLiveReview: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    padding: '10px 12px',
  },
  btnMasukCbt: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
  },
  btnMasukAgenda: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '11px 16px',
    borderRadius: 10,
    border: 'none',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
    transition: 'all 0.15s ease',
  },
  kartuPaketManual: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  btnBukaManual: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid #0d9488',
    background: '#f0fdfa',
    color: '#0d9488',
    fontWeight: 800,
    fontSize: 12,
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  bannerAgendaHeader: {
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%)',
    border: '1px solid #ccfbf1',
    borderRadius: 16,
    padding: '20px 22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  filterAgendaPills: {
    display: 'flex',
    background: '#e0f2fe',
    padding: 3,
    borderRadius: 10,
    gap: 2,
  },
  kartuAgendaItem: {
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  badgeLiveNow: {
    fontSize: 10.5,
    fontWeight: 900,
    background: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '2px 8px',
    borderRadius: 6,
  },
  kartuAnalitikItem: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  kotakTrenItem: {
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '10px 16px',
    textAlign: 'center',
    minWidth: 90,
  },
  trackSubtesAnalitik: {
    height: 7,
    background: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  loadingWrap: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #ccfbf1',
    borderTopColor: '#0d9488',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
};
