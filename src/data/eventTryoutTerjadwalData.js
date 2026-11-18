// src/data/eventTryoutTerjadwalData.js
// ==============================================================================
// JADWAL EVENT TRYOUT TERJADWAL SMA (2 KALI SEMINGGU) — AMBISPTN BENCHMARK
//
// Karakteristik:
// 1. Jadwal rutin 2x seminggu (setiap Rabu & Sabtu) khusus siswa SMA / UTBK.
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
// GENERATOR JADWAL EVENT 2 KALI SEMINGGU (RABU & SABTU)
// Dimulai dari November 2026 hingga Maret 2027
// ------------------------------------------------------------------------------
function susunEventRutinSma() {
  const events = [];
  const start = new Date(2026, 10, 1); // 1 Nov 2026
  const end = new Date(2027, 2, 31);   // 31 Mar 2027

  let cur = new Date(start);
  let counterRabu = 1;
  let counterSabtu = 1;
  let bulanLalu = -1;
  let nomorBulanFunda = 1;

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 3 = Rabu, 6 = Sabtu
    const y = cur.getFullYear();
    const m = cur.getMonth();
    const d = cur.getDate();
    const tglIso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (m !== bulanLalu) {
      bulanLalu = m;
      nomorBulanFunda = 1;
    }

    if (dayOfWeek === 3 || dayOfWeek === 6) {
      let judul = '';
      let subjudul = '';
      let badgeKategori = '';
      let token = '';

      if (dayOfWeek === 3) {
        // HARI RABU:
        if (nomorBulanFunda === 1) {
          judul = `Tryout Fundamental UTBK 1 — Seri ${BULAN_IND[m]}`;
          subjudul = 'Pemetaan fondasi awal TPS & penguasaan logika penalaran analitis';
          badgeKategori = 'Fundamental';
          token = `FUNDA-${m + 1}A`;
          nomorBulanFunda++;
        } else if (nomorBulanFunda === 2) {
          judul = `Ambis UTBK #${counterRabu} — Akselerasi Kecepatan Soal`;
          subjudul = 'Melatih ketepatan berhitung aljabar kuantitatif & penalaran deduktif';
          badgeKategori = 'Ambis UTBK';
          token = `AMBIS-${counterRabu}`;
        } else {
          judul = `Berjuang UTBK #${counterRabu} — Simulasi Akbar Tengah Pekan`;
          subjudul = 'Uji kesiapan penuh 7 subtes dengan standar pembobotan IRT resmi';
          badgeKategori = 'Berjuang UTBK';
          token = `BERJUANG-${counterRabu}`;
        }
        counterRabu++;
      } else if (dayOfWeek === 6) {
        // HARI SABTU:
        if (nomorBulanFunda === 2) {
          judul = `Tryout Fundamental UTBK 2 — Seri ${BULAN_IND[m]}`;
          subjudul = 'Pemantapan literasi bahasa, pemahaman wacana kritis & inferensi';
          badgeKategori = 'Fundamental';
          token = `FUNDA-${m + 1}B`;
          nomorBulanFunda++;
        } else if (counterSabtu % 2 === 0) {
          judul = `Siap UTBK #${counterSabtu} — Tantangan Ketahanan 195 Menit`;
          subjudul = 'Simulasi maraton mengasah reading stamina dan kekebalan distraktor';
          badgeKategori = 'Siap UTBK';
          token = `SIAP-${counterSabtu}`;
        } else {
          judul = `Ambis UTBK Akbar #${counterSabtu} — Peringkat Nasional Antarcabang`;
          subjudul = 'Bersaing sehat di Leaderboard Nasional dan evaluasi target prodi impian';
          badgeKategori = 'Ambis UTBK';
          token = `AMBIS-${counterSabtu}`;
        }
        counterSabtu++;
      }

      const id = `event_utbk_${tglIso.replace(/-/g, '_')}`;

      events.push({
        id,
        judul,
        subjudul,
        kategori: 'SMA',
        jenjang: 'SMA',
        badgeKategori,
        tanggalIso: tglIso,
        hariFormatted: formatTanggalInd(tglIso),
        jamMulai: '08:00',
        jamSelesai: '23:59 WIB',
        durasiMenit: 195,
        totalSoal: 160,
        sistemSkor: 'Item Response Theory (IRT Skala 1000)',
        token,
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
        liveReviewJadwal: `${formatTanggalInd(tglIso)} • 19:30 - 21:00 WIB via Google Meet`,
      });
    }

    cur.setDate(cur.getDate() + 1);
  }

  return events;
}

export const DAFTAR_EVENT_TRYOUT_SMA = susunEventRutinSma();

/**
 * Mengambil seluruh event yang dijadwalkan pada tanggal tertentu (YYYY-MM-DD)
 */
export function getEventByTanggal(tanggalIso) {
  if (!tanggalIso) return [];
  return DAFTAR_EVENT_TRYOUT_SMA.filter((ev) => ev.tanggalIso === tanggalIso);
}

/**
 * Mengambil seluruh event dalam satu bulan (tahun YYYY, bulan 0-11)
 */
export function getEventByBulan(tahun, bulanIndex) {
  const prefix = `${tahun}-${String(bulanIndex + 1).padStart(2, '0')}`;
  return DAFTAR_EVENT_TRYOUT_SMA.filter((ev) => ev.tanggalIso.startsWith(prefix));
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
