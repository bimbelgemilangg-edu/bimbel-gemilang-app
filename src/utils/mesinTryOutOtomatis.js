// src/utils/mesinTryOutOtomatis.js
// Hybrid: sistem memilih soal; admin hanya rules + wajib TERBITKAN.
// status paket: 'draf' (belum tampil siswa) | 'aktif' | 'nonaktif'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
// 🔥 BARU (2026-10-10): db bisa DIGANTI dari skrip (cron/seed) lewat pakaiDb().
// Sebelumnya berkas ini mengimpor db langsung dari src/firebase.js, yang di
// Node polos jatuh ke konfigurasi PRODUKSI -- artinya skrip penjadwal Sabtu
// akan menulis draf ke database produksi tanpa pagar. Dengan injeksi ini,
// skrip wajib membawa instansinya sendiri dan menolak produksi secara eksplisit.
import { db as dbBawaan } from '../firebase';

let dbPakai = dbBawaan;

/** Ganti instansi Firestore (untuk skrip). Kembalikan ke bawaan bila null. */
export function pakaiDb(instansi) {
  dbPakai = instansi || dbBawaan;
  return dbPakai;
}
// 🔥 BARU (audit 2026-10-10): targetKelas/targetKategori DINORMALKAN saat
// ditulis. Sebelumnya berkas ini menulis ARRAY (['Semua']) sementara
// rakitTryOutTentor.js & TerbitkanTryOutPage.jsx menulis STRING, dan semua
// pembacanya membandingkan dengan === terhadap string. ['Semua'] === 'Semua'
// bernilai false -- paket dari jadwal otomatis bisa tidak pernah muncul ke
// siswa tanpa error. Pembacanya sekarang toleran (utils/cocokkanTargetPaket.js),
// dan penulisnya dinormalkan supaya dokumen baru tidak menambah variasi bentuk.
import { bentukKanonikTarget } from './cocokkanTargetPaket.js';
// 🔥 BARU (2026-10-10): alias mapel UTBK diambil dari MAPEL_UTBK, bukan
// ditulis ulang di sini. Urutan PENTING: entri UTBK harus dicocokkan sebelum
// bind/bing/mtk, karena nama UTBK mengandung nama mapel kurikulum
// ('Literasi/Bahasa Indonesia' mengandung 'bahasa indonesia').
// kodeMapel & cocokkanMapel dipindah ke util murni supaya bisa diuji
// tanpa Firestore (2026-10-10). Diimpor SEKALIGUS di-re-export supaya
// pemakai lama tidak perlu mengubah impornya.
import { kodeMapel, cocokkanMapel } from './aliasMapel.js';

export { kodeMapel, cocokkanMapel };

export const COL_BANK = 'bank_soal';
export const COL_PAKET = 'tryout_paket';
export const COL_TEMPLATE = 'tryout_template_otomatis';

export function acakArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

const norm = (s) => String(s || '').toLowerCase().trim();

/** SMA == SMA/MA == SMA-MA; SMP == SMP/MTs */
export function normJenjang(s) {
  const t = norm(s).replace(/[^a-z0-9]/g, '');
  if (!t) return '';
  if (t.startsWith('sma') || t === 'ma' || t.includes('smama')) return 'sma';
  if (t.startsWith('smp') || t.includes('mts')) return 'smp';
  if (t.startsWith('sd') || t === 'mi' || t.startsWith('sdmi')) return 'sd';
  return t;
}




export function cocokkanJenjang(soalJenjang, targetJenjang) {
  const t = normJenjang(targetJenjang);
  if (!t) return true;
  const s = normJenjang(soalJenjang);
  if (!s) return true;
  return s === t;
}

export async function ambilSoalDariBank(opts) {
  const {
    mapel,
    jenjang,
    kelas,
    bab,
    level,
    jumlah = 10,
    excludeIds = new Set(),
    kelompok,
  } = opts || {};

  let snap;
  try {
    snap = await getDocs(
      query(collection(dbPakai, COL_BANK), where('status', '==', 'aktif'), limit(1500))
    );
  } catch (_e) {
    // Sengaja ditelan: query pertama menyaring status 'aktif' dan butuh index
    // gabungan. Kalau indexnya belum ada Firestore melempar error, dan
    // mengambil tanpa saringan tetap lebih berguna daripada gagal total --
    // penyaringan status lalu dilakukan di sisi pemanggil.
    snap = await getDocs(query(collection(dbPakai, COL_BANK), limit(1500)));
  }

  let pool = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (mapel) {
    pool = pool.filter((s) => cocokkanMapel(s.mapel || s.mataPelajaran, mapel));
  }
  if (jenjang) {
    pool = pool.filter((s) => cocokkanJenjang(s.jenjang, jenjang));
  }
  if (kelas) {
    const k = String(kelas);
    pool = pool.filter((s) => {
      const sk = String(s.kelas || s.tingkatKelas || '');
      return !sk || sk === k || sk.includes(k);
    });
  }
  if (bab) {
    const b = norm(bab);
    pool = pool.filter((s) => {
      const t = norm(s.bab || s.topik);
      return t.includes(b) || b.includes(t);
    });
  }
  if (level) {
    const l = norm(level);
    pool = pool.filter((s) => !s.level || norm(s.level) === l);
  }
  if (kelompok) {
    const g = norm(kelompok);
    pool = pool.filter((s) => !s.kelompok || norm(s.kelompok).includes(g));
  }

  pool = pool.filter((s) => !excludeIds.has(s.id));
  pool = acakArray(pool);

  if (pool.length < jumlah) {
    const snap2 = await getDocs(query(collection(dbPakai, COL_BANK), limit(1500)));
    let extra = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (mapel) {
      extra = extra.filter((s) => cocokkanMapel(s.mapel || s.mataPelajaran, mapel));
    }
    if (jenjang) {
      extra = extra.filter((s) => cocokkanJenjang(s.jenjang, jenjang));
    }
    const ada = new Set(pool.map((s) => s.id));
    for (const s of acakArray(extra)) {
      if (!ada.has(s.id)) {
        pool.push(s);
        ada.add(s.id);
      }
      if (pool.length >= jumlah) break;
    }
  }
  return pool.slice(0, jumlah);
}

export async function idSoalBaruDipakai(jenjang, batasPaket = 10) {
  const snap = await getDocs(collection(dbPakai, COL_PAKET));
  const paket = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => {
      if (!jenjang) return true;
      const t = String(p.jenjangTemplate || p.jenjang || '').toLowerCase();
      return !t || t === String(jenjang).toLowerCase();
    })
    .sort((a, b) => {
      const ta = (a.createdAt && a.createdAt.toMillis && a.createdAt.toMillis())
        || new Date(a.waktuBuka || 0).getTime()
        || 0;
      const tb = (b.createdAt && b.createdAt.toMillis && b.createdAt.toMillis())
        || new Date(b.waktuBuka || 0).getTime()
        || 0;
      return tb - ta;
    })
    .slice(0, batasPaket);

  const ids = new Set();
  for (const p of paket) {
    for (const s of p.daftarSoal || []) {
      if (s.id) ids.add(s.id);
    }
  }
  return ids;
}

export async function susunSoalDariKomposisi(template, excludeIds) {
  const hasil = [];
  const grupMapel = [];
  const kekurangan = [];
  const dipakai = new Set(excludeIds || []);
  for (const baris of template.komposisi || []) {
    const butuh = Number(baris.jumlah) || 10;
    // eslint-disable-next-line no-await-in-loop
    const ambil = await ambilSoalDariBank({
      mapel: baris.mapel,
      jenjang: template.jenjang,
      kelas: template.kelas || null,
      bab: baris.bab || null,
      level: baris.level || null,
      jumlah: butuh,
      excludeIds: dipakai,
      kelompok: baris.kelompok || template.kelompokBank || null,
    });
    const ids = [];
    for (const s of ambil) {
      dipakai.add(s.id);
      hasil.push(s);
      ids.push(s.id);
    }
    if (ids.length < butuh) {
      kekurangan.push({
        mapel: baris.mapel,
        butuh,
        dapat: ids.length,
      });
    }
    const jml = ids.length;
    let durasi = Number(baris.durasiMenit);
    if (!durasi || durasi < 1) {
      durasi = Math.max(10, Math.round(Math.max(jml, 1) * 1.3));
    }
    grupMapel.push({
      mapel: baris.mapel,
      soalIds: ids,
      durasiMenit: durasi,
      jumlah: jml,
    });
  }
  return { daftarSoal: hasil, grupMapel, kekurangan };
}

// TODO(audit 2026-10-10): parameter ke-3 TIDAK PERNAH DIPAKAI -- waktuTutup
// slot selalu dihardcode 23:59, berapa pun durasi try out-nya. Artinya try out
// 90 menit yang dibuka 07:00 tetap "buka" sampai tengah malam. Kemungkinan
// besar ini niat yang belum terlaksana (durasi seharusnya ikut menentukan
// batas pengerjaan), jadi parameter TIDAK dihapus -- hanya ditandai '_' supaya
// lint jujur soal keadaannya. Memakai durasi untuk menutup slot lebih awal
// adalah PERUBAHAN PERILAKU pada try out yang sudah berjalan: keputusan owner,
// bukan efek samping pembersihan lint.
export function hitungSlotMingguIni(hariDalamMinggu, jamBuka, _durasiMenit) {
  const hari = hariDalamMinggu || [1, 4];
  const jam = jamBuka || '07:00';
  const now = new Date();
  const parts = String(jam).split(':');
  const hh = parseInt(parts[0], 10) || 0;
  const mm = parseInt(parts[1], 10) || 0;
  const day = now.getDay();
  const senin = new Date(now);
  senin.setHours(0, 0, 0, 0);
  const diff = day === 0 ? -6 : 1 - day;
  senin.setDate(senin.getDate() + diff);

  const slots = [];
  for (let i = 0; i < hari.length; i += 1) {
    const h = hari[i];
    const offsetDariSenin = h === 0 ? 6 : h - 1;
    const buka = new Date(senin);
    buka.setDate(senin.getDate() + offsetDariSenin);
    buka.setHours(hh, mm, 0, 0);
    const tutupPaket = new Date(buka);
    tutupPaket.setHours(23, 59, 0, 0);
    slots.push({
      hari: h,
      waktuBuka: buka.toISOString(),
      waktuTutup: tutupPaket.toISOString(),
      label: buka.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }),
    });
  }
  return slots;
}

export function ringkasSoalUntukAdmin(daftarSoal) {
  const byMapel = {};
  const list = daftarSoal || [];
  for (let i = 0; i < list.length; i += 1) {
    const s = list[i];
    const m = s.mapel || s.mataPelajaran || 'Lainnya';
    byMapel[m] = (byMapel[m] || 0) + 1;
  }
  return {
    total: list.length,
    perMapel: byMapel,
  };
}

/**
 * Siapkan DRAF paket (status: draf) - siswa BELUM melihat.
 * Admin wajib terbitkan dulu.
 */
export async function siapkanDrafDariTemplate(template, slot, rules) {
  const r = rules || {};
    const exclude = await idSoalBaruDipakai(template.jenjang, 10);
  const susunan = await susunSoalDariKomposisi(template, exclude);
  let daftarSoal = susunan.daftarSoal || [];
  const grupMapel = susunan.grupMapel || [];
  const soalAcak = r.soalAcak !== false && template.soalAcak !== false;
  // Acak dalam tiap mapel (bukan campur antar mapel) agar subtes tetap utuh
  if (soalAcak) {
    const byId = {};
    daftarSoal.forEach((s) => { byId[s.id] = s; });
    const ordered = [];
    grupMapel.forEach((g) => {
      g.soalIds = acakArray(g.soalIds || []);
      g.soalIds.forEach((id) => { if (byId[id]) ordered.push(byId[id]); });
    });
    daftarSoal = ordered.length ? ordered : acakArray(daftarSoal);
  }

  const kekurangan = susunan.kekurangan || [];
  if (!daftarSoal.length) {
    const rinci = (template.komposisi || [])
      .map((b) => b.mapel)
      .filter(Boolean)
      .join(', ');
    return {
      ok: false,
      error:
        'Bank soal kosong/tidak cocok untuk "' + template.nama + '". '
        + 'Cek: (1) soal sudah diimpor lewat Impor Soal HTML AI, (2) mapel sama (Geografi=Geografi, huruf besar/kecil tidak masalah), '
        + '(3) jenjang SMA sama dengan SMA/MA, (4) status soal aktif. Template butuh: '
        + (rinci || 'komposisi mapel belum diisi') + '.',
    };
  }

  const judul = template.nama + ' - ' + slot.label;
  const antiCheat = r.antiCheatAktif !== false && template.antiCheatAktif !== false;
  const kamera = !!(r.wajibKamera != null ? r.wajibKamera : template.wajibKamera);
  const pembahasan = r.tampilkanPembahasan !== false && template.tampilkanPembahasan !== false;
  const modeTimer = r.modeTimer || template.modeTimer || 'per-subtes';
  const durasi = Number(r.durasiTotalMenit != null ? r.durasiTotalMenit : template.durasiTotalMenit)
    || grupMapel.reduce((a, g) => a + (Number(g.durasiMenit) || 0), 0)
    || 90;

  // Subtes per mapel (timer terpisah, tidak bisa balik ke mapel sebelumnya)
  const subtes = modeTimer === 'per-subtes'
    ? grupMapel.filter((g) => (g.soalIds || []).length > 0).map((g) => ({
        nama: g.mapel,
        durasiMenit: Number(g.durasiMenit) || 20,
        soalIds: g.soalIds,
      }))
    : [];

  const payload = {
    judul,
    status: 'draf',
    targetKelas: bentukKanonikTarget(template.targetKelas),
    targetKategori: bentukKanonikTarget(template.targetKategori),
    daftarSoal,
    totalSoal: daftarSoal.length,
    modeTimer,
    durasiTotalMenit: durasi,
    subtes,
    antiCheatAktif: antiCheat,
    wajibKamera: kamera,
    soalAcak,
    tampilkanPembahasan: pembahasan,
    waktuBuka: slot.waktuBuka,
    waktuTutup: slot.waktuTutup,
    otomatis: true,
    templateId: template.id || null,
    jenjangTemplate: template.jenjang || '',
    komposisi: template.komposisi || [],
    rulesSnapshot: {
      soalAcak,
      antiCheatAktif: antiCheat,
      wajibKamera: kamera,
      tampilkanPembahasan: pembahasan,
      modeTimer,
      durasiTotalMenit: durasi,
    },
    ringkas: ringkasSoalUntukAdmin(daftarSoal),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    sumber: 'mesin-otomatis',
  };

  const ref = await addDoc(collection(dbPakai, COL_PAKET), payload);
  return {
    ok: true,
    id: ref.id,
    judul,
    totalSoal: daftarSoal.length,
    // 🔥 BARU (audit 2026-10-10): `kekurangan` sebelumnya dihitung oleh
    // susunSoalDariKomposisi lalu DIBUANG di sini -- jadi paket yang kekurangan
    // soal dibuat tanpa satu pun laporan. Field tambahan ini tidak mengubah
    // perilaku pemanggil yang sudah ada (mereka membaca ok/id/judul/totalSoal),
    // tapi membuat admin bisa tahu bahwa "30 soal diminta, 22 didapat".
    // TODO: tampilkan di log hasil JadwalTryOutOtomatisPage.
    kekurangan,
    ringkas: payload.ringkas,
    slot,
    status: 'draf',
  };
}

/** Admin klik TERBITKAN - status aktif, baru muncul di siswa */
export async function terbitkanDraf(paketId, rulesOverride) {
  const ro = rulesOverride || {};
  const patch = {
    status: 'aktif',
    diterbitkanAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (ro.soalAcak !== undefined) patch.soalAcak = !!ro.soalAcak;
  if (ro.antiCheatAktif !== undefined) patch.antiCheatAktif = !!ro.antiCheatAktif;
  if (ro.wajibKamera !== undefined) patch.wajibKamera = !!ro.wajibKamera;
  if (ro.tampilkanPembahasan !== undefined) patch.tampilkanPembahasan = !!ro.tampilkanPembahasan;
  if (ro.durasiTotalMenit !== undefined) patch.durasiTotalMenit = Number(ro.durasiTotalMenit) || 90;
  if (ro.waktuBuka) patch.waktuBuka = ro.waktuBuka;
  if (ro.waktuTutup) patch.waktuTutup = ro.waktuTutup;

  await updateDoc(doc(dbPakai, COL_PAKET, paketId), patch);
  return { ok: true, id: paketId };
}

export async function nonaktifkanPaket(paketId) {
  await updateDoc(doc(dbPakai, COL_PAKET, paketId), {
    status: 'nonaktif',
    updatedAt: serverTimestamp(),
  });
  return { ok: true };
}

/**
 * Siapkan draf untuk semua slot minggu ini (skip jika judul sudah ada).
 */
export async function siapkanDrafMingguIni(template, rules) {
  const r = rules || {};
  const slots = hitungSlotMingguIni(
    template.hariDalamMinggu || [1, 4],
    r.jamBuka || template.jamBuka || '07:00',
    r.durasiTotalMenit || template.durasiTotalMenit || 90
  );
  const existing = await getDocs(collection(dbPakai, COL_PAKET));
  const byJudul = new Map();
  existing.docs.forEach((d) => {
    byJudul.set(d.data().judul, { id: d.id, ...d.data() });
  });

  const hasil = [];
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    const judul = template.nama + ' - ' + slot.label;
    const ada = byJudul.get(judul);
    if (ada) {
      hasil.push({
        ok: true,
        skipped: true,
        judul,
        id: ada.id,
        status: ada.status,
        alasan: 'sudah ada (' + ada.status + ')',
      });
      // eslint-disable-next-line no-continue
      continue;
    }
    if (new Date(slot.waktuTutup) < new Date(Date.now() - 24 * 3600 * 1000)) {
      hasil.push({
        ok: true,
        skipped: true,
        judul,
        alasan: 'slot sudah lewat',
      });
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const res = await siapkanDrafDariTemplate(template, slot, r);
    hasil.push(res);
  }
  return hasil;
}


/** Alias kompatibilitas (nama lama di beberapa deploy) */
export async function generateMingguIniUntukTemplate(template, rules) {
  return siapkanDrafMingguIni(template, rules);
}

/** Alias: generate paket langsung (draf) untuk satu slot */
export async function generatePaketDariTemplate(template, slot, rules) {
  return siapkanDrafDariTemplate(template, slot, rules);
}

export const DEFAULT_TEMPLATE_SMA = {
  nama: 'Try Out Otomatis SMA',
  jenjang: 'SMA',
  kelas: '12',
  // STRING, bukan array -- lihat catatan impor bentukKanonikTarget di atas.
  targetKelas: 'Semua',
  targetKategori: 'Semua',
  komposisi: [
    { mapel: 'Bahasa Inggris', jumlah: 30, durasiMenit: 35 },
    { mapel: 'Bahasa Indonesia', jumlah: 20, durasiMenit: 25 },
    { mapel: 'Matematika', jumlah: 15, durasiMenit: 20 },
  ],
  hariDalamMinggu: [1, 4],
  jamBuka: '07:00',
  durasiTotalMenit: 90,
  modeTimer: 'per-subtes',
  antiCheatAktif: true,
  wajibKamera: false,
  soalAcak: true,
  tampilkanPembahasan: true,
  aktif: true,
};

export default {
  ambilSoalDariBank,
  cocokkanMapel,
  cocokkanJenjang,
  kodeMapel,
  normJenjang,
  susunSoalDariKomposisi,
  siapkanDrafDariTemplate,
  siapkanDrafMingguIni,
  terbitkanDraf,
  nonaktifkanPaket,
  hitungSlotMingguIni,
  ringkasSoalUntukAdmin,
  DEFAULT_TEMPLATE_SMA,
};
