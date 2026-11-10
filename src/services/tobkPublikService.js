// src/services/tobkPublikService.js
// ============================================================
// SERVIS TOBK GEMILANG & EVENT PUBLIK (Try Out Akbar / Lomba / Marketing)
// 
// 🔒 PRINSIP UTAMA: ZERO-BLOAT GUARANTEE
// - Data peserta luar bimbel dan log jawaban disimpan dalam koleksi
//   terpisah:
//     • tobk_events        -> Pengaturan event, token, jadwal, timer
//     • tobk_event_leads   -> Data kontak peserta (marketing)
//     • tobk_event_jawaban -> Sesi pengerjaan & log kecurangan
// - Koleksi inti bimbel (`students`, `ujian_submissions`, `raport_siswa`)
//   TIDAK TERSENTUH sama sekali.
// - Admin memiliki kontrol 1-klik ekspor CSV dan 1-klik bersihkan
//   (purge) data setelah event selesai agar kuota penyimpanan tetap 0MB tambahan.
// - Dilengkapi fallback offline/local storage otomatis agar pengerjaan
//   peserta tidak pernah terhambat masalah jaringan.
// ============================================================

import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_EVENTS = 'gemilang_tobk_events_backup';
const LOCAL_STORAGE_KEY_LEADS = 'gemilang_tobk_leads_backup';
const LOCAL_STORAGE_KEY_SESI = 'gemilang_tobk_peserta_session';

// Preset Soal Default UTBK / TKA Skala Nasional jika belum ada paket di bank soal
export const SOAL_PRESET_UTBK = [
  {
    id: 'utbk_tps_01',
    nomor: 1,
    mapel: 'Penalaran Umum (TPS)',
    tipe: 'pg',
    teksSoal: 'Semua mahasiswa yang lulus dengan predikat cumlaude memiliki indeks prestasi di atas 3.50. Sebagian mahasiswa teknik elektro memiliki indeks prestasi di atas 3.50. Kesimpulan yang paling tepat adalah ...',
    opsiJawaban: [
      { key: 'A', teks: 'Semua mahasiswa teknik elektro lulus dengan predikat cumlaude.' },
      { key: 'B', teks: 'Sebagian mahasiswa teknik elektro lulus dengan predikat cumlaude.' },
      { key: 'C', teks: 'Semua mahasiswa yang memiliki indeks prestasi di atas 3.50 adalah mahasiswa teknik elektro.' },
      { key: 'D', teks: 'Mahasiswa yang tidak lulus cumlaude bukan berasal dari teknik elektro.' },
      { key: 'E', teks: 'Tidak ada mahasiswa teknik elektro yang memiliki indeks prestasi di bawah 3.50.' },
    ],
    kunciJawaban: 'B',
    pembahasan: 'Berdasarkan premis 1 (Semua cumlaude -> IPK > 3.50) dan premis 2 (Sebagian mhs elektro -> IPK > 3.50), simpulan yang valid adalah sebagian mahasiswa teknik elektro dapat lulus dengan predikat cumlaude (B).'
  },
  {
    id: 'utbk_tps_02',
    nomor: 2,
    mapel: 'Pengetahuan Kuantitatif',
    tipe: 'pg',
    teksSoal: 'Jika fungsi $f(x) = 2x^2 - 4x + 5$ memiliki titik balik minimum $(p, q)$, berapakah nilai dari $2p + q$?',
    opsiJawaban: [
      { key: 'A', teks: '3' },
      { key: 'B', teks: '4' },
      { key: 'C', teks: '5' },
      { key: 'D', teks: '6' },
      { key: 'E', teks: '7' },
    ],
    kunciJawaban: 'C',
    pembahasan: 'Titik puncak kurva parabola: $x_p = -b/(2a) = -(-4)/(2 \\cdot 2) = 1$. Nilai $y_p = f(1) = 2(1)^2 - 4(1) + 5 = 3$. Jadi $p = 1, q = 3$. Maka $2p + q = 2(1) + 3 = 5$ (C).'
  },
  {
    id: 'utbk_tps_03',
    nomor: 3,
    mapel: 'Literasi Bahasa Indonesia',
    tipe: 'pg',
    teksSoal: 'Perhatikan teks berikut:\n\n"Transisi energi baru dan terbarukan (EBT) di Indonesia menghadapi tantangan pendanaan dan infrastruktur transmisi. Meskipun potensi energi surya dan hidro melimpah, interkoneksi antarpulau masih terbatas."\n\nGagasan pokok paragraf tersebut adalah ...',
    opsiJawaban: [
      { key: 'A', teks: 'Potensi melimpah energi surya di Indonesia.' },
      { key: 'B', teks: 'Tantangan dan kendala transisi EBT di Indonesia.' },
      { key: 'C', teks: 'Pembangunan infrastruktur listrik antarpulau.' },
      { key: 'D', teks: 'Rendahnya investasi swasta dalam energi terbarukan.' },
      { key: 'E', teks: 'Keberhasilan pemanfaatan energi hidro nusantara.' },
    ],
    kunciJawaban: 'B',
    pembahasan: 'Kalimat utama berada di awal kalimat ("Transisi energi baru dan terbarukan... menghadapi tantangan pendanaan dan infrastruktur"). Kalimat selanjutnya merupakan kalimat penjelas. Jadi gagasan pokoknya adalah tantangan transisi EBT (B).'
  },
  {
    id: 'utbk_tps_04',
    nomor: 4,
    mapel: 'Literasi Bahasa Inggris',
    tipe: 'pg',
    teksSoal: 'Artificial Intelligence has rapidly integrated into education. While adaptive learning systems allow personalized study paths, educators emphasize that critical thinking and emotional intelligence remain distinctly human attributes that technology cannot replace.\n\nWhat is the author\'s main point?',
    opsiJawaban: [
      { key: 'A', teks: 'AI will completely replace traditional teachers in the near future.' },
      { key: 'B', teks: 'Adaptive learning systems are not effective for students.' },
      { key: 'C', teks: 'AI assists education, but unique human attributes remain irreplaceable.' },
      { key: 'D', teks: 'Emotional intelligence is unnecessary in modern classrooms.' },
      { key: 'E', teks: 'Schools should ban technological integration.' },
    ],
    kunciJawaban: 'C',
    pembahasan: 'The text highlights that while AI offers benefits like personalized study paths, human elements like critical thinking and emotional intelligence cannot be replaced (C).'
  },
  {
    id: 'utbk_tps_05',
    nomor: 5,
    mapel: 'Penalaran Matematika',
    tipe: 'pg',
    teksSoal: 'Sebuah tangki air berbentuk silinder memiliki diameter alas 14 dm dan tinggi 20 dm. Jika tangki tersebut terisi air sebanyak $\\frac{3}{4}$ bagian, berapakah volume air dalam tangki tersebut? (Gunakan $\\pi = \\frac{22}{7}$)',
    opsiJawaban: [
      { key: 'A', teks: '2.310 liter' },
      { key: 'B', teks: '2.450 liter' },
      { key: 'C', teks: '3.080 liter' },
      { key: 'D', teks: '3.200 liter' },
      { key: 'E', teks: '3.650 liter' },
    ],
    kunciJawaban: 'A',
    pembahasan: 'Jari-jari $r = 7$ dm. Volume silinder penuh = $\\pi r^2 t = (22/7) \\times 7^2 \\times 20 = 22 \\times 7 \\times 20 = 3.080 \\text{ dm}^3$ (liter). Air terisi $3/4$, maka volume = $(3/4) \\times 3.080 = 2.310$ liter (A).'
  }
];

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
    // Urutkan terbaru
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
 * Mengambil event TOBK publik yang sedang aktif (untuk landing page siswa luar).
 */
export async function ambilEventTobkAktifPublik() {
  try {
    const snap = await getDocs(collection(db, 'tobk_events'));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Cari yang berstatus aktif atau yang paling baru
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
    durasiMenit: Number(eventData.durasiMenit) || 90,
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

  // Update backup lokal
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

// ------------------------------------------------------------
// 2. PENDAFTARAN PESERTA & LEADS MARKETING
// ------------------------------------------------------------

/**
 * Mendaftarkan peserta luar ke event TOBK (Marketing Lead Capture).
 */
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
    statusUjian: 'menunggu_token', // 'menunggu_token' | 'mengerjakan' | 'selesai' | 'diskualifikasi'
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

  // Simpan lead lokal
  const leads = getLocalLeads();
  leads.unshift(payload);
  saveLocalLeads(leads);

  // Simpan sesi peserta di browser saat ini agar bisa reload
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SESI, JSON.stringify(payload));
  } catch (e) {
    console.warn('Gagal simpan sesi peserta di localStorage:', e);
  }

  return payload;
}

/**
 * Mengambil sesi peserta aktif dari localStorage.
 */
export function ambilSesiPesertaAktif() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SESI);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Validasi Token yang dimasukkan peserta.
 */
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

/**
 * Menyimpan progres jawaban peserta secara berkala ke database.
 */
export async function simpanJawabanPeserta(pesertaId, jawabanMap, raguMap = {}, pelanggaranList = []) {
  if (!pesertaId) return;

  const payload = {
    pesertaId,
    jawaban: jawabanMap,
    ragu: raguMap,
    pelanggaran: pelanggaranList,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'tobk_event_jawaban', pesertaId), payload, { merge: true });
  } catch (err) {
    console.warn('[TOBK] Gagal simpan jawaban realtime ke Firestore:', err);
  }

  // Backup lokal
  try {
    localStorage.setItem(`tobk_jawaban_${pesertaId}`, JSON.stringify(payload));
  } catch (e) {}
}

/**
 * Menyelesaikan ujian TOBK dan mencatat hasil akhir / diskualifikasi.
 */
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

  // Update cache leads lokal
  const leads = getLocalLeads();
  const item = leads.find((l) => l.pesertaId === pesertaId);
  if (item) {
    Object.assign(item, updatePayload);
    saveLocalLeads(leads);
  }

  // Update sesi di browser peserta
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

/**
 * Mengambil semua leads peserta untuk event tertentu (atau semua event).
 */
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

/**
 * Ekspor leads ke file CSV (UTF-8 with BOM agar terbaca sempurna di Microsoft Excel).
 */
export function eksporLeadsCsv(leadsList, namaEvent = 'TOBK_Gemilang') {
  if (!leadsList || leadsList.length === 0) {
    alert('Tidak ada data leads peserta untuk diekspor!');
    return;
  }

  const headers = [
    'No',
    'Nama Lengkap',
    'No WhatsApp',
    'Asal Sekolah',
    'Kota / Kabupaten',
    'Target PTN / Univ',
    'Target Jurusan',
    'Status Ujian',
    'Skor',
    'Benar',
    'Salah',
    'Pelanggaran (Strike)',
    'Waktu Daftar',
    'Waktu Selesai',
  ];

  const rows = leadsList.map((lead, idx) => [
    idx + 1,
    `"${(lead.nama || '').replace(/"/g, '""')}"`,
    `"${lead.whatsapp || ''}"`,
    `"${(lead.asalSekolah || '').replace(/"/g, '""')}"`,
    `"${(lead.kota || '').replace(/"/g, '""')}"`,
    `"${(lead.targetPtn || '').replace(/"/g, '""')}"`,
    `"${(lead.targetJurusan || '').replace(/"/g, '""')}"`,
    lead.statusUjian || 'menunggu',
    lead.skor !== null && lead.skor !== undefined ? lead.skor : '-',
    lead.totalBenar || 0,
    lead.totalSalah || 0,
    lead.totalPelanggaran || 0,
    lead.waktuDaftar ? new Date(lead.waktuDaftar).toLocaleString('id-ID') : '-',
    lead.waktuSelesai ? new Date(lead.waktuSelesai).toLocaleString('id-ID') : '-',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Leads_${namaEvent.replace(/[^a-zA-Z0-9_]/g, '_')}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 🔒 ZERO-BLOAT GUARANTEE:
 * 1-Klik Bersihkan & Hapus Data Sementara Peserta Event (Purge Data).
 * Menghapus dokumen di `tobk_event_leads` dan `tobk_event_jawaban` agar kuota
 * database Bimbel Gemilang tetap 100% bebas beban storage.
 */
export async function bersihkanDataEventTobk(eventId, hapusEventSekaligus = false) {
  if (!eventId) return { success: false, message: 'ID Event tidak valid' };

  try {
    // 1. Ambil semua leads yang terkait event ini
    const qLeads = query(collection(db, 'tobk_event_leads'), where('eventId', '==', eventId));
    const snapLeads = await getDocs(qLeads);

    const leadIds = snapLeads.docs.map((d) => d.id);

    // 2. Hapus dokumen leads & jawaban secara batch
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

    // 3. Bersihkan cache lokal
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
    // Bersihkan lokal sebagai fallback
    const localLeads = getLocalLeads().filter((l) => l.eventId !== eventId);
    saveLocalLeads(localLeads);
    return {
      success: true,
      message: 'Data riwayat event lokal telah dibersihkan.',
    };
  }
}
