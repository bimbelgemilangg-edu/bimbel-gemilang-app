// src/data/eventTryoutTerjadwalData.js
// ==============================================================================
// JADWAL EVENT TRYOUT TERJADWAL SMA (2 KALI SEMINGGU) — AMBISPTN BENCHMARK
//
// Karakteristik:
// 1. Jadwal rutin 2x sebulan khusus siswa SMA / UTBK.
// 2. Bahasa marketing profesional:
//    - Tryout Fundamental UTBK 1 & 2 (Awal bulan)
//    - Ambis UTBK (Seri akselerasi tengah bulan)
//    - Siap UTBK (Seri uji ketahanan wacana & waktu)
//    - Berjuang UTBK (Seri akbar penentuan passing grade)
// 3. Terkunci dengan token resmi panitia & terhubung langsung ke Portal CBT
//    Profesional (/tobk/ruang-tunggu).
// ==============================================================================

import { SUBTES_RESMI_UTBK_2026, SOAL_PRESET_UTBK } from './utbk2026KatkielData.js';

// Daftar Nama Bulan Bahasa Indonesia
const BULAN_IND = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI_IND = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTanggalInd(tglStr) {
  const d = new Date(tglStr);
  if (isNaN(d.getTime())) return tglStr;
  const hari = HARI_IND[d.getDay()];
  const tgl = d.getDate();
  const bln = BULAN_IND[d.getMonth()];
  const thn = d.getFullYear();
  return `${hari}, ${tgl} ${bln} ${thn}`;
}

// ------------------------------------------------------------------------------
// GENERATOR JADWAL EVENT RESMI UTBK SMA (TEPAT 2 KALI SEBULAN)
// Seri berganti setiap bulan:
// - November 2026 : Fondasi UTBK 1 & 2
// - Desember 2026 : Ambis UTBK 1 & 2
// - Januari 2027  : Siap UTBK 1 & 2
// - Februari 2027 : Berjuang UTBK 1 & 2
// - Maret 2027    : Puncak UTBK 1 & 2 (Gladi Bersih)
// ------------------------------------------------------------------------------
function susunEventRutinSma() {
  const masterJadwalPerBulan = [
    // NOVEMBER 2026: Fondasi UTBK
    {
      tglIso: '2026-11-18',
      judul: 'Tryout Fondasi UTBK 1 — Seri November 2026',
      subjudul: 'Pemetaan fondasi awal TPS & penguasaan logika penalaran analitis',
      badgeKategori: 'Fondasi UTBK',
      token: 'FONDASI-1',
    },
    {
      tglIso: '2026-11-28',
      judul: 'Tryout Fondasi UTBK 2 — Seri November 2026',
      subjudul: 'Pemantapan literasi bahasa, pemahaman wacana kritis & penalaran matematika',
      badgeKategori: 'Fondasi UTBK',
      token: 'FONDASI-2',
    },

    // DESEMBER 2026: Ambis UTBK
    {
      tglIso: '2026-12-09',
      judul: 'Ambis UTBK 1 — Seri Desember 2026',
      subjudul: 'Akselerasi kecepatan berhitung aljabar kuantitatif & penalaran deduktif',
      badgeKategori: 'Ambis UTBK',
      token: 'AMBIS-1',
    },
    {
      tglIso: '2026-12-19',
      judul: 'Ambis UTBK 2 — Seri Desember 2026',
      subjudul: 'Simulasi akbar tengah tahun dan evaluasi ketahanan pengerjaan 195 menit',
      badgeKategori: 'Ambis UTBK',
      token: 'AMBIS-2',
    },

    // JANUARI 2027: Siap UTBK
    {
      tglIso: '2027-01-13',
      judul: 'Siap UTBK 1 — Seri Januari 2027',
      subjudul: 'Uji ketahanan wacana analitis, problem solving & kekebalan distraktor',
      badgeKategori: 'Siap UTBK',
      token: 'SIAP-1',
    },
    {
      tglIso: '2027-01-23',
      judul: 'Siap UTBK 2 — Seri Januari 2027',
      subjudul: 'Peringkat nasional antarcabang dan kalibrasi passing grade prodi impian',
      badgeKategori: 'Siap UTBK',
      token: 'SIAP-2',
    },

    // FEBRUARI 2027: Berjuang UTBK
    {
      tglIso: '2027-02-10',
      judul: 'Berjuang UTBK 1 — Seri Februari 2027',
      subjudul: 'Simulasi akbar penentuan passing grade dan pemetaan skor per subtes',
      badgeKategori: 'Berjuang UTBK',
      token: 'BERJUANG-1',
    },
    {
      tglIso: '2027-02-27',
      judul: 'Berjuang UTBK 2 — Seri Februari 2027',
      subjudul: 'Uji kesiapan penuh 7 subtes dengan standar pembobotan IRT resmi SNPMB',
      badgeKategori: 'Berjuang UTBK',
      token: 'BERJUANG-2',
    },

    // MARET 2027: Puncak UTBK (Gladi Bersih)
    {
      tglIso: '2027-03-10',
      judul: 'Puncak UTBK 1 — Seri Maret 2027',
      subjudul: 'Gladi bersih pra-UTBK real CBT dan simulasi kondisi ujian sesungguhnya',
      badgeKategori: 'Puncak UTBK',
      token: 'PUNCAK-1',
    },
    {
      tglIso: '2027-03-27',
      judul: 'Puncak UTBK 2 — Seri Maret 2027',
      subjudul: 'Final battle & evaluasi menyeluruh sebelum pelaksanaan resmi UTBK-SNBT',
      badgeKategori: 'Puncak UTBK',
      token: 'PUNCAK-2',
    },
  ];

  return masterJadwalPerBulan.map((item) => {
    const id = `event_utbk_${item.tglIso.replace(/-/g, '_')}`;
    return {
      id,
      judul: item.judul,
      subjudul: item.subjudul,
      kategori: 'SMA',
      jenjang: 'SMA',
      badgeKategori: item.badgeKategori,
      tanggalIso: item.tglIso,
      hariFormatted: formatTanggalInd(item.tglIso),
      jamMulai: '08:00',
      jamSelesai: '23:59 WIB',
      durasiMenit: 195,
      totalSoal: 160,
      sistemSkor: 'Item Response Theory (IRT Skala 1000)',
      token: item.token,
      tokenAktif: true,
      maksimalPelanggaran: 3,
      wajibKamera: true,
      daftarSubtes: [
        { nama: 'Penalaran Umum (PU)', jumlahSoal: 30, durasiMenit: 30 },
        { nama: 'Pengetahuan & Pemahaman Umum (PPU)', jumlahSoal: 20, durasiMenit: 15 },
        { nama: 'Pemahaman Bacaan & Menulis (PBM)', jumlahSoal: 20, durasiMenit: 25 },
        { nama: 'Pengetahuan Kuantitatif (PK)', jumlahSoal: 20, durasiMenit: 20 },
        { nama: 'Literasi Bahasa Indonesia (LBIN)', jumlahSoal: 30, durasiMenit: 43 },
        { nama: 'Literasi Bahasa Inggris (LBING)', jumlahSoal: 20, durasiMenit: 20 },
        { nama: 'Penalaran Matematika (PM)', jumlahSoal: 20, durasiMenit: 43 },
      ],
      tentorPendamping: 'Tim Akademik Bimbel Gemilang & Tentor Master UTBK',
      liveReviewJadwal: `${formatTanggalInd(item.tglIso)} • 19:30 - 21:00 WIB via Google Meet`,
    };
  });
}

export const DAFTAR_EVENT_TRYOUT_SMA = susunEventRutinSma();

export const KUNCI_OVERRIDE_EVENT_TRYOUT = 'gemilang_event_tryout_overrides';

/**
 * Mengambil map override event tryout yang telah diatur oleh admin (token kustom, status aktif, paket soal terhubung)
 */
export function ambilOverrideEventMap() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KUNCI_OVERRIDE_EVENT_TRYOUT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Menyimpan konfigurasi override event dari admin
 */
export function simpanOverrideEvent(eventId, partialData) {
  if (typeof localStorage === 'undefined' || !eventId) return;
  try {
    const current = ambilOverrideEventMap();
    current[eventId] = { ...(current[eventId] || {}), ...partialData, updatedAt: new Date().toISOString() };
    localStorage.setItem(KUNCI_OVERRIDE_EVENT_TRYOUT, JSON.stringify(current));

    // Sinkronkan juga ke gemilang_tobk_events_backup
    const rawBackup = localStorage.getItem('gemilang_tobk_events_backup');
    let eventsList = rawBackup ? JSON.parse(rawBackup) : [];
    const idx = eventsList.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      eventsList[idx] = { ...eventsList[idx], ...partialData };
      localStorage.setItem('gemilang_tobk_events_backup', JSON.stringify(eventsList));
    }
  } catch (err) {
    console.warn('Gagal simpan override event:', err);
  }
}

/**
 * Terapkan data override admin pada suatu objek event
 */
export function terapkanOverrideEvent(event) {
  if (!event || !event.id) return event;
  const overrides = ambilOverrideEventMap();
  const ov = overrides[event.id];
  return ov ? { ...event, ...ov } : event;
}

/**
 * Mengambil seluruh event yang dijadwalkan pada tanggal tertentu (YYYY-MM-DD)
 */
export function getEventByTanggal(tanggalIso) {
  if (!tanggalIso) return [];
  return DAFTAR_EVENT_TRYOUT_SMA
    .filter((ev) => ev.tanggalIso === tanggalIso)
    .map(terapkanOverrideEvent);
}

/**
 * Mengambil seluruh event dalam satu bulan (tahun YYYY, bulan 0-11)
 */
export function getEventByBulan(tahun, bulanIndex) {
  const prefix = `${tahun}-${String(bulanIndex + 1).padStart(2, '0')}`;
  return DAFTAR_EVENT_TRYOUT_SMA
    .filter((ev) => ev.tanggalIso.startsWith(prefix))
    .map(terapkanOverrideEvent);
}

/**
 * Memeriksa status ketersediaan event terhadap waktu sekarang
 */
export function getStatusEventTerhadapWaktu(event, waktuKiniMs = Date.now()) {
  if (!event || !event.tanggalIso) return 'belum_terbuka';

  const hariIniIso = new Date(waktuKiniMs).toISOString().slice(0, 10);
  if (event.tanggalIso === hariIniIso) {
    return 'sedang_berlangsung';
  } else if (event.tanggalIso > hariIniIso) {
    return 'terjadwal_mendatang';
  } else {
    return 'arsip_selesai';
  }
}

// Fallback memori in-memory jika di luar browser (Node test runner)
const memoriTobkFallback = new Map();

/**
 * Menghubungkan akun siswa yang sedang login ke sesi portal CBT profesional (/tobk)
 * Siswa tidak perlu lagi mengisi formulir pendaftaran umum dari awal.
 */
export function hubungkanSiswaKeTobkSession({ event, profil = {}, targetKampus = null }) {
  if (!event) return null;

  try {
    const studentId = (typeof localStorage !== 'undefined' ? localStorage.getItem('studentId') || localStorage.getItem('studentNim') : '') || profil.studentId || profil.id || 'STD-GEMILANG';
    const nama = profil.nama || profil.name || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentName') : '') || 'Sahabat Gemilang';
    const kelas = profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentKelas') : '') || '12 SMA';
    const asalSekolah = profil.asalSekolah || 'Bimbel Gemilang';
    const noHp = profil.telepon || profil.noHp || profil.wa || '081234567890';

    const targetPtn = targetKampus?.namaPtn || 'Universitas Impian';
    const targetJurusan = targetKampus?.namaProdi || 'Jurusan Pilihan';

    const pesertaId = `tobk_${studentId}_${event.id}`;
    const sesiPeserta = {
      pesertaId,
      studentId,
      nama,
      whatsapp: noHp,
      asalSekolah,
      kota: 'Indonesia',
      targetPtn,
      targetJurusan,
      eventId: event.id,
      eventJudul: event.judul,
      kategori: 'UTBK',
      tokenResmi: event.token,
      waktuDaftar: new Date().toISOString(),
      isSiswaGemilang: true,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gemilang_tobk_peserta_session', JSON.stringify(sesiPeserta));

      const backupKey = 'gemilang_tobk_events_backup';
      const rawBackup = localStorage.getItem(backupKey);
      let eventsList = rawBackup ? JSON.parse(rawBackup) : [];
      const idx = eventsList.findIndex((e) => e.id === event.id);

      const eventFull = {
        ...event,
        tokenAktif: true,
        daftarSoal: Array.isArray(SOAL_PRESET_UTBK) ? SOAL_PRESET_UTBK : [],
      };

      if (idx >= 0) {
        eventsList[idx] = { ...eventsList[idx], ...eventFull };
      } else {
        eventsList.unshift(eventFull);
      }
      localStorage.setItem(backupKey, JSON.stringify(eventsList));
    } else {
      memoriTobkFallback.set('gemilang_tobk_peserta_session', JSON.stringify(sesiPeserta));
      memoriTobkFallback.set(event.id, event);
    }

    return sesiPeserta;
  } catch (err) {
    console.error('Gagal menghubungkan siswa ke sesi TOBK:', err);
    return null;
  }
}
