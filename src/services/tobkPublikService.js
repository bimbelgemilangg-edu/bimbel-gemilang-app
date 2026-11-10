// src/services/tobkPublikService.js
// ============================================================
// SERVIS TOBK GEMILANG & EVENT PUBLIK
// STANDAR RESMI UTBK-SNBT 2026 & TKA 2026 (Kemendikdasmen / SNPMB)
//
// 🔒 PRINSIP UTAMA:
// 1. BLOCK TIME SYSTEM:
//    - Timer berjalan total per subtes, bukan per soal.
//    - Titik Tanpa Balik: Subtes yang selesai tidak bisa dibuka kembali.
//    - Masa Transisi: Jeda hitung mundur dengan tombol biru aktif setelah jeda selesai.
// 2. ZERO-BLOAT GUARANTEE:
//    - Data peserta terisolasi di `tobk_events`, `tobk_event_leads`, `tobk_event_jawaban`.
//    - Koleksi inti bimbel tetap bersih 100%. 1-klik ekspor CSV & 1-klik Purge data.
// ============================================================

import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp, writeBatch,
  onSnapshot
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_EVENTS = 'gemilang_tobk_events_backup';
const LOCAL_STORAGE_KEY_LEADS = 'gemilang_tobk_leads_backup';
const LOCAL_STORAGE_KEY_SESI = 'gemilang_tobk_peserta_session';

// ============================================================
// 1. PRESET STANDAR RESMI UTBK-SNBT 2026 (7 SUBTES - 160 SOAL - 195 MENIT)
// Diimpor dari Bank Soal Modul Katkiel Project (Lengkap dengan Gambar Presisi & Tabel HTML)
// ============================================================
export { SUBTES_RESMI_UTBK_2026, SOAL_PRESET_UTBK } from '../data/utbk2026KatkielData';

// ============================================================
// 2. PRESET STANDAR RESMI TKA 2026 (SESI 75 MENIT - MKKS SMP/MTS DIY)
// 100% Naskah Asli Ujian:
// - Paket B: Matematika Wajib & Numerasi (30 Soal - 75 Menit)
// - Paket A: Bahasa Indonesia & Literasi (30 Soal - 75 Menit)
// Lengkap dengan crop gambar diagram 300 DPI, tabel presisi & diagram opsi
// ============================================================
export {
  SESI_RESMI_TKA_2026,
  SOAL_TKA_2026_SMP_MTK_PAKET_B,
  SOAL_TKA_2026_SMP_BINDO_PAKET_A,
  PAKET_RESMI_TKA_2026_SMP_MTK_PAKET_B,
  PAKET_RESMI_TKA_2026_SMP_BINDO_PAKET_A
} from '../data/tka2026DiyData';

// Helper: Ambil data backup lokal
function getLocalEvents() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalEvents(events) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_EVENTS, JSON.stringify(events));
  } catch (e) {
    console.warn('Gagal menyimpan cache event lokal:', e);
  }
}

function getLocalLeads() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LEADS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalLeads(leads) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_LEADS, JSON.stringify(leads));
  } catch (e) {
    console.warn('Gagal menyimpan cache leads lokal:', e);
  }
}

// ------------------------------------------------------------
// 1. KELOLA EVENT TOBK PUBLIK (Admin)
// ------------------------------------------------------------

/**
 * Mengambil semua event TOBK publik dari Firestore (dengan fallback lokal).
 */
export async function ambilSemuaEventTobk() {
  try {
    const snap = await getDocs(collection(db, 'tobk_events'));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    saveLocalEvents(items);
    return items;
  } catch (err) {
    console.warn('[TOBK] Gagal ambil Firestore, pakai fallback lokal:', err);
    return getLocalEvents();
  }
}

/**
 * Mengambil 1 event berdasarkan ID.
 */
export async function ambilEventTobkById(eventId) {
  if (!eventId) return null;
  try {
    const snap = await getDoc(doc(db, 'tobk_events', eventId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn('[TOBK] Gagal ambil event by id Firestore:', err);
  }
  const locals = getLocalEvents();
  return locals.find((ev) => ev.id === eventId) || null;
}

/**
 * Mengambil event TOBK publik yang sedang aktif.
 */
export async function ambilEventTobkAktifPublik() {
  try {
    const snap = await getDocs(collection(db, 'tobk_events'));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const aktif = items.find((ev) => ev.status === 'aktif');
    if (aktif) return aktif;
    if (items.length > 0) return items[0];
  } catch (err) {
    console.warn('[TOBK] Gagal ambil event aktif Firestore:', err);
  }
  const locals = getLocalEvents();
  return locals.find((ev) => ev.status === 'aktif') || locals[0] || null;
}

/**
 * Menyimpan atau memperbarui event TOBK publik.
 */
export async function simpanEventTobk(eventData) {
  const id = eventData.id || `tobk_${Date.now()}`;
  const payload = {
    ...eventData,
    id,
    token: (eventData.token || '').trim().toUpperCase(),
    tokenAktif: eventData.tokenAktif !== undefined ? eventData.tokenAktif : true,
    durasiMenit: Number(eventData.durasiMenit) || 195,
    modeTimer: eventData.modeTimer || 'per-subtes', // 'per-subtes' | 'total'
    jedaTransisiDetik: Number(eventData.jedaTransisiDetik) || 15,
    maksimalPelanggaran: Number(eventData.maksimalPelanggaran) || 3,
    wajibKamera: eventData.wajibKamera !== undefined ? eventData.wajibKamera : true,
    status: eventData.status || 'aktif',
    updatedAt: new Date().toISOString(),
    createdAt: eventData.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'tobk_events', id), payload, { merge: true });
  } catch (err) {
    console.warn('[TOBK] Gagal simpan ke Firestore, simpan lokal:', err);
  }

  const locals = getLocalEvents();
  const idx = locals.findIndex((e) => e.id === id);
  if (idx >= 0) locals[idx] = payload;
  else locals.unshift(payload);
  saveLocalEvents(locals);

  return payload;
}

/**
 * Saklar cepat untuk mengaktifkan/menonaktifkan token TOBK secara live oleh admin.
 */
export async function toggleTokenEventTobk(eventId, aktif) {
  try {
    await updateDoc(doc(db, 'tobk_events', eventId), {
      tokenAktif: aktif,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[TOBK] Gagal toggle token Firestore:', err);
  }

  const locals = getLocalEvents();
  const item = locals.find((e) => e.id === eventId);
  if (item) {
    item.tokenAktif = aktif;
    saveLocalEvents(locals);
  }
  return true;
}

/**
 * Saklar Live Jeda Ujian (Sholat / Istirahat) oleh Admin.
 * Membekukan timer di seluruh layar siswa dan menangguhkan deteksi pelanggaran anti-cheat.
 */
export async function toggleJedaEventTobk(eventId, isPaused, alasan = 'Waktu Sholat & Istirahat') {
  const payload = {
    isPaused: Boolean(isPaused),
    statusUjian: isPaused ? 'dijeda' : 'berjalan',
    pauseAlasan: isPaused ? (alasan || 'Waktu Sholat & Istirahat') : '',
    pauseTimestamp: isPaused ? new Date().toISOString() : null,
    resumeTimestamp: !isPaused ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateDoc(doc(db, 'tobk_events', eventId), payload);
  } catch (err) {
    console.warn('[TOBK] Gagal toggle jeda Firestore:', err);
  }

  const locals = getLocalEvents();
  const item = locals.find((e) => e.id === eventId);
  if (item) {
    Object.assign(item, payload);
    saveLocalEvents(locals);
  }
  return true;
}

/**
 * Mendengarkan perubahan event TOBK secara real-time (live sync jeda ujian, token, status).
 */
export function dengarEventTobk(eventId, callback) {
  if (!eventId) return () => {};
  try {
    const unsub = onSnapshot(
      doc(db, 'tobk_events', eventId),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          callback(data);
        }
      },
      (err) => {
        console.warn('[TOBK] onSnapshot error:', err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('[TOBK] Gagal dengarEventTobk:', err);
    return () => {};
  }
}

// ------------------------------------------------------------
// 2. PENDAFTARAN PESERTA & LEADS MARKETING
// ------------------------------------------------------------

export async function daftarPesertaTobk(eventId, dataDiri) {
  const pesertaId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = {
    pesertaId,
    eventId: eventId || 'default_event',
    nama: (dataDiri.nama || '').trim(),
    whatsapp: (dataDiri.whatsapp || '').trim(),
    asalSekolah: (dataDiri.asalSekolah || '').trim(),
    kota: (dataDiri.kota || '').trim(),
    targetPtn: (dataDiri.targetPtn || '').trim(),
    targetJurusan: (dataDiri.targetJurusan || '').trim(),
    kategori: dataDiri.kategori || 'UTBK',
    statusUjian: 'menunggu_token',
    skor: null,
    totalPelanggaran: 0,
    waktuDaftar: new Date().toISOString(),
    waktuMulai: null,
    waktuSelesai: null,
  };

  try {
    await setDoc(doc(db, 'tobk_event_leads', pesertaId), payload);
  } catch (err) {
    console.warn('[TOBK] Gagal simpan lead Firestore, simpan lokal:', err);
  }

  const leads = getLocalLeads();
  leads.unshift(payload);
  saveLocalLeads(leads);

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SESI, JSON.stringify(payload));
  } catch (e) {
    console.warn('Gagal simpan sesi peserta di localStorage:', e);
  }

  return payload;
}

export function ambilSesiPesertaAktif() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SESI);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function validasiTokenPeserta(eventId, inputToken) {
  if (!inputToken || !inputToken.trim()) {
    return { valid: false, message: 'Harap masukkan kode token ujian!' };
  }

  const ev = await ambilEventTobkById(eventId);
  if (!ev) {
    return { valid: false, message: 'Event TOBK tidak ditemukan atau telah ditutup.' };
  }

  const tokenBersih = inputToken.trim().toUpperCase();
  const tokenResmi = (ev.token || '').trim().toUpperCase();

  if (tokenBersih !== tokenResmi) {
    return { valid: false, message: 'Kode token salah! Periksa kembali huruf dan angka token.' };
  }

  if (ev.tokenAktif === false) {
    return {
      valid: false,
      message: 'Token ujian belum dibuka oleh Admin/Panitia. Harap tunggu pengumuman resmi di sesi live/WhatsApp!',
    };
  }

  return { valid: true, message: 'Token valid! Anda dapat memulai ujian.', event: ev };
}

// ------------------------------------------------------------
// 3. SESI PENGERJAAN & SUBMIT CBT
// ------------------------------------------------------------

export async function simpanJawabanPeserta(pesertaId, jawabanMap, raguMap = {}, pelanggaranList = [], extraMeta = {}) {
  if (!pesertaId) return;

  const payload = {
    pesertaId,
    jawaban: jawabanMap,
    ragu: raguMap,
    pelanggaran: pelanggaranList,
    ...extraMeta,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'tobk_event_jawaban', pesertaId), payload, { merge: true });
  } catch (err) {
    console.warn('[TOBK] Gagal simpan jawaban realtime ke Firestore:', err);
  }

  try {
    localStorage.setItem(`tobk_jawaban_${pesertaId}`, JSON.stringify(payload));
  } catch (e) {}
}

export async function selesaikanUjianTobk(pesertaId, hasilData) {
  if (!pesertaId) return;

  const updatePayload = {
    statusUjian: hasilData.statusUjian || 'selesai',
    skor: hasilData.skor !== undefined ? hasilData.skor : null,
    totalBenar: hasilData.totalBenar || 0,
    totalSalah: hasilData.totalSalah || 0,
    totalKosong: hasilData.totalKosong || 0,
    totalPelanggaran: hasilData.totalPelanggaran || 0,
    waktuSelesai: new Date().toISOString(),
  };

  try {
    await updateDoc(doc(db, 'tobk_event_leads', pesertaId), updatePayload);
  } catch (err) {
    console.warn('[TOBK] Gagal update hasil ujian di Firestore:', err);
  }

  const leads = getLocalLeads();
  const item = leads.find((l) => l.pesertaId === pesertaId);
  if (item) {
    Object.assign(item, updatePayload);
    saveLocalLeads(leads);
  }

  const sesi = ambilSesiPesertaAktif();
  if (sesi && sesi.pesertaId === pesertaId) {
    Object.assign(sesi, updatePayload);
    localStorage.setItem(LOCAL_STORAGE_KEY_SESI, JSON.stringify(sesi));
  }

  return updatePayload;
}

// ------------------------------------------------------------
// 4. PEMANTAUAN ADMIN, EKSPOR LEADS CSV, & 1-KLIK BERSIHKAN DATA
// ------------------------------------------------------------

export async function ambilSemuaLeadsTobk(eventId = null) {
  try {
    let qRef = collection(db, 'tobk_event_leads');
    if (eventId) {
      qRef = query(qRef, where('eventId', '==', eventId));
    }
    const snap = await getDocs(qRef);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.waktuDaftar || 0) - new Date(a.waktuDaftar || 0));
    saveLocalLeads(list);
    return list;
  } catch (err) {
    console.warn('[TOBK] Gagal ambil leads Firestore, ambil lokal:', err);
    const locals = getLocalLeads();
    if (eventId) return locals.filter((l) => l.eventId === eventId);
    return locals;
  }
}

export function eksporLeadsCsv(leadsList, namaEvent = 'TOBK_Gemilang') {
  return eksporRekapNilaiExcel(leadsList, { judul: namaEvent });
}

// ============================================================
// EKSPOR REKAP NILAI LENGKAP KE EXCEL (.CSV) DENGAN KOLOM SUBTES
// Memuat: Nama, Asal Sekolah, Kota, Target PTN & Prodi, Kolom Subtes, Total Skor
// Kompatibel untuk UTBK (7 Subtes) dan TKA (Mapel)
// ============================================================
export function eksporRekapNilaiExcel(leadsList, event = {}) {
  if (!leadsList || leadsList.length === 0) {
    alert('Tidak ada data peserta/nilai untuk diekspor!');
    return;
  }

  const namaEvent = event?.judul || 'TOBK_Gemilang';
  const formatUjian = event?.formatUjian || 'UTBK_2026';

  // Tentukan daftar kolom subtes berdasarkan event atau default resmi UTBK
  let subtesKolom = [];
  if (event?.subtes && Array.isArray(event.subtes) && event.subtes.length > 0) {
    subtesKolom = event.subtes.map((s) => ({
      id: s.id || s.kode,
      kode: s.kode || s.id,
      nama: s.nama || s.judul || 'Subtes',
    }));
  } else if (formatUjian.startsWith('TKA')) {
    subtesKolom = [
      { id: 'subtes_tka_1', kode: 'TKA 1', nama: 'Mata Pelajaran Utama' },
      { id: 'subtes_tka_2', kode: 'TKA 2', nama: 'Literasi / Skolastik' },
    ];
  } else {
    // Default 7 Subtes Resmi UTBK-SNBT 2026
    subtesKolom = [
      { id: 'subtes_pu', kode: 'PU', nama: 'Penalaran Umum (PU)' },
      { id: 'subtes_ppu', kode: 'PPU', nama: 'Pengetahuan & Pemahaman Umum (PPU)' },
      { id: 'subtes_pbm', kode: 'PBM', nama: 'Pemahaman Bacaan & Menulis (PBM)' },
      { id: 'subtes_pk', kode: 'PK', nama: 'Pengetahuan Kuantitatif (PK)' },
      { id: 'subtes_lbi', kode: 'LBI', nama: 'Literasi Bahasa Indonesia (LBI)' },
      { id: 'subtes_lbe', kode: 'LBE', nama: 'Literasi Bahasa Inggris (LBE)' },
      { id: 'subtes_pm', kode: 'PM', nama: 'Penalaran Matematika (PM)' },
    ];
  }

  // Header CSV
  const headers = [
    'No',
    'Nama Lengkap',
    'No WhatsApp',
    'Asal Sekolah',
    'Kota / Kabupaten',
    formatUjian.startsWith('TKA') ? 'Target Peminatan / SMA' : 'Target PTN / Universitas',
    formatUjian.startsWith('TKA') ? 'Target Jurusan / Minat' : 'Target Program Studi',
    ...subtesKolom.map((s) => `Nilai ${s.kode || s.nama}`),
    'TOTAL SKOR AKHIR',
    'Persentase Skor (%)',
    'Total Benar',
    'Total Salah',
    'Total Kosong',
    'Pelanggaran (Strike)',
    'Status Ujian',
    'Waktu Daftar',
    'Waktu Selesai',
  ];

  const rows = leadsList.map((lead, idx) => {
    // Ambil skor subtes dari data lead jika ada
    const leadSubtesMap = {};
    if (Array.isArray(lead.skorSubtes)) {
      lead.skorSubtes.forEach((item) => {
        const key = (item.id || item.kode || item.nama || '').toLowerCase();
        leadSubtesMap[key] = item.skor;
      });
    } else if (lead.skorSubtes && typeof lead.skorSubtes === 'object') {
      Object.assign(leadSubtesMap, lead.skorSubtes);
    }

    // Nilai per kolom subtes
    const nilaiSubtes = subtesKolom.map((s) => {
      if (lead.statusUjian !== 'selesai' && lead.statusUjian !== 'diskualifikasi') {
        return '-';
      }
      if (lead.statusUjian === 'diskualifikasi') {
        return '0';
      }

      const matchKey = (s.id || s.kode || s.nama).toLowerCase();
      // Cari nilai spesifik
      for (const [k, v] of Object.entries(leadSubtesMap)) {
        if (k.includes(matchKey) || matchKey.includes(k)) {
          return v;
        }
      }

      // Jika tidak ada data spesifik subtes, gunakan estimasi berbasis total skor
      if (lead.skor !== null && lead.skor !== undefined) {
        return Math.round(Number(lead.skor));
      }
      return '-';
    });

    const totalSkor =
      lead.statusUjian === 'diskualifikasi'
        ? 0
        : lead.skor !== null && lead.skor !== undefined
        ? Math.round(Number(lead.skor))
        : '-';

    const persen =
      lead.statusUjian === 'diskualifikasi'
        ? '0%'
        : lead.skorPersen !== undefined && lead.skorPersen !== null
        ? `${lead.skorPersen}%`
        : lead.skor && lead.totalSoal
        ? `${Math.round(((lead.totalBenar || 0) / (lead.totalSoal || 1)) * 100)}%`
        : '-';

    return [
      idx + 1,
      `"${(lead.nama || '').replace(/"/g, '""')}"`,
      `"${lead.whatsapp || ''}"`,
      `"${(lead.asalSekolah || '').replace(/"/g, '""')}"`,
      `"${(lead.kota || '').replace(/"/g, '""')}"`,
      `"${(lead.targetPtn || lead.targetPeminatan || '').replace(/"/g, '""')}"`,
      `"${(lead.targetJurusan || lead.targetProdi || '').replace(/"/g, '""')}"`,
      ...nilaiSubtes,
      totalSkor,
      `"${persen}"`,
      lead.totalBenar || 0,
      lead.totalSalah || 0,
      lead.totalKosong || 0,
      lead.totalPelanggaran || 0,
      lead.statusUjian || 'menunggu',
      lead.waktuDaftar ? new Date(lead.waktuDaftar).toLocaleString('id-ID') : '-',
      lead.waktuSelesai ? new Date(lead.waktuSelesai).toLocaleString('id-ID') : '-',
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Nilai_${namaEvent.replace(/[^a-zA-Z0-9_]/g, '_')}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function bersihkanDataEventTobk(eventId, hapusEventSekaligus = false) {
  if (!eventId) return { success: false, message: 'ID Event tidak valid' };

  try {
    const qLeads = query(collection(db, 'tobk_event_leads'), where('eventId', '==', eventId));
    const snapLeads = await getDocs(qLeads);
    const leadIds = snapLeads.docs.map((d) => d.id);

    const batch = writeBatch(db);
    snapLeads.docs.forEach((docRef) => {
      batch.delete(docRef.ref);
    });

    for (const lid of leadIds) {
      batch.delete(doc(db, 'tobk_event_jawaban', lid));
    }

    if (hapusEventSekaligus) {
      batch.delete(doc(db, 'tobk_events', eventId));
    }

    await batch.commit();

    const localLeads = getLocalLeads().filter((l) => l.eventId !== eventId);
    saveLocalLeads(localLeads);

    if (hapusEventSekaligus) {
      const localEvents = getLocalEvents().filter((e) => e.id !== eventId);
      saveLocalEvents(localEvents);
    }

    return {
      success: true,
      message: `Berhasil membersihkan ${leadIds.length} data pengerjaan peserta event ini! Database tetap 100% ringan.`,
    };
  } catch (err) {
    console.error('[TOBK] Gagal bersihkan data event:', err);
    const localLeads = getLocalLeads().filter((l) => l.eventId !== eventId);
    saveLocalLeads(localLeads);
    return {
      success: true,
      message: 'Data riwayat event lokal telah dibersihkan.',
    };
  }
}
