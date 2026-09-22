// src/services/materiV2Service.js
// ============================================================
// LAPISAN DATA MATERI v2 -- satu-satunya pintu akses data untuk
// halaman /siswa/belajar (lihat docs/RENCANA-ROMBAK-MATERI.md).
//
// Prinsip HEMAT KUOTA (paket gratis Firebase Spark):
//  1. Satu getDocs per halaman, andalkan persistentLocalCache
//     (sudah aktif di src/firebase.js) -- kunjungan ulang dibaca
//     dari cache, tidak menembak server.
//  2. Progress ditulis DEBOUNCE + merge -- 1 bab maksimal 1 tulis
//     per jeda, bukan per klik.
//  3. Tidak ada listener realtime di Fase 1-2 (listener hanya
//     untuk sesi presentasi guru di Fase 3, dok-nya kecil).
//  4. File besar (PDF/gambar) TIDAK disimpan di Firestore --
//     pakai Supabase Storage via services/uploadService.js.
//
// Mode contoh: bila `materi_v2` kosong/tak terjangkau, jatuh ke
// src/data/materiV2Contoh.js + progress di localStorage, supaya
// UI bisa dipreview sebelum admin mengisi materi asli.
// ============================================================
import { db } from '../firebase';
import {
  collection, getDoc, getDocs, doc, query, setDoc, where, limit,
} from 'firebase/firestore';
import { MATERI_CONTOH } from '../data/materiV2Contoh';
import {
  cocokkanJenjang, cocokkanKelas, ekstrakAngkaKelas,
} from '../utils/aksesKontenSiswa';

export const KOL_MATERI = 'materi_v2';
export const KOL_PROGRES = 'progres_materi_v2';

// Status mode terakhir: false = Firestore asli, true = data contoh.
let modeContoh = false;
export const sedangModeContoh = () => modeContoh;

const KEY_PROGRES_LOKAL = 'gemilang:materi-v2-progres';
const KEY_TERAKHIR = 'gemilang:last-reader-v2';

// ---------------- util ----------------
const bacaProgresLokal = () => {
  try { return JSON.parse(localStorage.getItem(KEY_PROGRES_LOKAL) || '{}'); }
  catch { return {}; }
};
const tulisProgresLokal = (map) => {
  try { localStorage.setItem(KEY_PROGRES_LOKAL, JSON.stringify(map)); }
  catch { /* localStorage penuh/blokir -- progres contoh tidak kritis */ }
};

// debounce tulis per key supaya 1 bab = 1 write (hemat kuota)
const timerTulis = new Map();
const tulisDebounced = (key, fn, jedaMs = 1500) => {
  if (timerTulis.has(key)) clearTimeout(timerTulis.get(key));
  timerTulis.set(key, setTimeout(() => {
    timerTulis.delete(key);
    fn().catch((e) => console.error('Gagal simpan progres:', e));
  }, jedaMs));
};
export const paksaFlushTulisan = () => {
  timerTulis.forEach((t) => clearTimeout(t));
  timerTulis.clear();
};

// ---------------- kesesuaian jenjang/program ----------------

const normalisasiJenjang = (raw) => {
  const v = String(raw || '').toLowerCase();
  if (v.includes('smp') || v.includes('mts')) return 'smp';
  if (v.includes('sma') || v.includes('ma') || v.includes('smk')) return 'sma';
  if (v.includes('sd') || v.includes('mi')) return 'sd';
  return '';
};

/**
 * Profil akses siswa (jenjang + program) untuk menyaring materi
 * agar SESUAI JENJANG & PROGRAM bimbelnya (request owner Turn 12).
 */
export async function muatProfilAkses(studentId, kelasLokal, programLokal) {
  let jenjang = '';
  let program = programLokal || '';
  if (studentId) {
    try {
      const snap = await getDocs(query(
        collection(db, 'students'), where('studentId', '==', studentId), limit(1)
      ));
      if (!snap.empty) {
        const d = snap.docs[0].data();
        jenjang = normalisasiJenjang(d.jenjang || d.programType || '');
        program = d.program || program;
      }
    } catch (e) {
      console.warn('Gagal muat profil siswa:', e);
    }
  }
  if (!jenjang) jenjang = normalisasiJenjang(kelasLokal);
  return { jenjang, program: program || 'Reguler' };
}

/**
 * Aturan saring materi v2 per siswa:
 *  - jenjang wajib cocok (pakai cocokkanJenjang, SMA termasuk UTBK/SNBT)
 *  - kelas satu arah: siswa boleh materi kelas sendiri & di bawahnya
 *  - program: bila materi ber-program khusus, harus sama dg program siswa
 * Materi tanpa field tsb dianggap untuk semua.
 */
export const cocokMateriUntukSiswa = (m, profil, kelasLokal) => {
  if (m.jenjang && profil.jenjang && !cocokkanJenjang(m.jenjang, profil.jenjang)) return false;
  const angka = ekstrakAngkaKelas(kelasLokal);
  if (m.kelas && angka && !cocokkanKelas({ tingkatKelas: String(m.kelas) }, angka)) return false;
  if (m.program && m.program !== 'semua' && profil.program
    && String(m.program) !== String(profil.program)) return false;
  return true;
};

/** Daftar materi aktif (sudah difilter status). Urut: urutan lalu judul. */
export async function muatDaftarMateri() {
  try {
    const snap = await getDocs(
      query(collection(db, KOL_MATERI), where('status', '==', 'aktif'))
    );
    if (!snap.empty) {
      modeContoh = false;
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) =>
        (a.urutan || 0) - (b.urutan || 0) ||
        String(a.judul).localeCompare(String(b.judul)));
      return list;
    }
  } catch (e) {
    console.warn('materi_v2 tak terjangkau, pakai data contoh:', e);
  }
  modeContoh = true;
  return MATERI_CONTOH.map((m) => ({ ...m }));
}

/** Satu materi + daftar bab-nya (bab di-embed saat mode contoh). */
export async function muatMateriDanBab(materiId) {
  if (modeContoh) {
    const m = MATERI_CONTOH.find((x) => x.id === materiId);
    if (!m) return { materi: null, babList: [] };
    return { materi: { ...m }, babList: [...(m.bab || [])] };
  }
  try {
    const [mSnap, bSnap] = await Promise.all([
      getDoc(doc(db, KOL_MATERI, materiId)),
      getDocs(collection(db, KOL_MATERI, materiId, 'bab')),
    ]);
    const materi = mSnap.exists() ? { id: mSnap.id, ...mSnap.data() } : null;
    const babList = bSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    babList.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    return { materi, babList };
  } catch (e) {
    console.error('Gagal muat materi:', e);
    const m = MATERI_CONTOH.find((x) => x.id === materiId);
    if (m) { modeContoh = true; return { materi: { ...m }, babList: [...(m.bab || [])] }; }
    return { materi: null, babList: [] };
  }
}

/** Satu bab lengkap (sections + ujiPemahaman). */
export async function muatBab(materiId, babId) {
  const { materi, babList } = await muatMateriDanBab(materiId);
  const bab = babList.find((b) => b.id === babId) || null;
  return { materi, bab };
}

// ---------------- progress siswa ----------------

/** Semua progress milik satu siswa: { [babId]: {..} } */
export async function muatProgressSiswa(studentId) {
  if (!studentId) return {};
  if (modeContoh) return bacaProgresLokal()[studentId] || {};
  try {
    const snap = await getDocs(
      query(collection(db, KOL_PROGRES), where('studentId', '==', studentId))
    );
    const map = {};
    snap.docs.forEach((d) => { map[d.data().babId || d.id] = d.data(); });
    return map;
  } catch (e) {
    console.warn('Gagal muat progres, pakai cache lokal:', e);
    return bacaProgresLokal()[studentId] || {};
  }
}

/**
 * Simpan/gabung progress satu bab. Debounced (hemat kuota).
 * patch contoh: { selesaiSections: [0,1], halamanTerbaca: 3 }
 */
export function simpanProgressBab(studentId, materiId, babId, patch) {
  if (!studentId || !babId) return;
  const gabung = () => {
    const lokal = bacaProgresLokal();
    const milik = lokal[studentId] || {};
    const lama = milik[babId] || {};
    const baru = { ...lama, ...patch, studentId, materiId, babId, diupdate: Date.now() };
    milik[babId] = baru;
    lokal[studentId] = milik;
    tulisProgresLokal(lokal);
    if (modeContoh) return Promise.resolve();
    return setDoc(doc(db, KOL_PROGRES, `${studentId}_${babId}`), baru, { merge: true });
  };
  tulisDebounced(`${studentId}_${babId}`, gabung);
}

/** Progress bab saat ini (baca cepat, tanpa server). */
export function bacaProgressBabCepat(studentId, babId) {
  const lokal = bacaProgresLokal()[studentId];
  return lokal?.[babId] || null;
}

// ---------------- "lanjutkan membaca" ----------------
export const bacaTerakhir = () => {
  try { return JSON.parse(localStorage.getItem(KEY_TERAKHIR) || 'null'); }
  catch { return null; }
};
export const simpanTerakhir = (info) => {
  try { localStorage.setItem(KEY_TERAKHIR, JSON.stringify(info)); }
  catch { /* opsional */ }
};

// ---------------- administrasi (Manajer Materi v2, Fase 4) ----------------

/** Semua materi (termasuk draft/arsip) untuk manajer admin. */
export async function muatSemuaMateri() {
  try {
    const snap = await getDocs(collection(db, KOL_MATERI));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    return list;
  } catch (e) {
    console.error('Gagal muat semua materi:', e);
    return [];
  }
}

/** Simpan materi (buat baru bila id null). Return id. */
export async function simpanMateri(id, data) {
  const pakaiId = id || `m_${Date.now()}`;
  await setDoc(doc(db, KOL_MATERI, pakaiId), {
    ...data, diupdatePada: Date.now(),
  }, { merge: true });
  return pakaiId;
}

/** Simpan bab (buat baru bila babId null). Return babId. */
export async function simpanBab(materiId, babId, data) {
  const pakaiId = babId || `b_${Date.now()}`;
  await setDoc(doc(db, KOL_MATERI, materiId, 'bab', pakaiId), {
    ...data, diupdatePada: Date.now(),
  }, { merge: true });
  return pakaiId;
}

/** Hapus bab permanen (hati-hati; admin hanya). */
export async function hapusBab(materiId, babId) {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, KOL_MATERI, materiId, 'bab', babId));
}

// ---------------- perhitungan ringkas ----------------
export const jumlahUnitBab = (bab) =>
  Math.max(1, (bab?.sections || []).length) + ((bab?.ujiPemahaman || []).length ? 1 : 0);

export const unitSelesaiBab = (bab, prog) => {
  if (!prog) return 0;
  const baca = prog.selesaiBab ? (bab?.sections || []).length : (prog.selesaiSections || []).length;
  return Math.min(baca, (bab?.sections || []).length) + (prog.quizTerbaik != null ? 1 : 0);
};

export const persenBab = (bab, prog) => {
  const total = jumlahUnitBab(bab);
  return total ? Math.min(100, Math.round((unitSelesaiBab(bab, prog) / total) * 100)) : 0;
};
