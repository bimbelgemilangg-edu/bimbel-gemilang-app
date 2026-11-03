// src/services/logMengajarService.js
// ============================================================
// Pembaca `teacher_logs` untuk SEMUA halaman guru (dasbor + riwayat).
// Logika murninya (buang field gaji, urut, saring bulan) ada di
// utils/logMengajar.js dan teruji; berkas ini hanya mengurus kueri.
//
// TIGA aturan yang dipegang:
//  1. IDENTITAS TUNGGAL. Log ditulis ClassSession dengan `teacherId: teacher.id`
//     (docId Firestore), sementara sebagian halaman dulu mencari pakai kode
//     `guruId` (GURU-0xx) → 0 baris → kehadiran selalu 0% (register bug B-05).
//     Di sini pencarian selalu memakai SEMUA identitas guru (utils/identitasGuru
//     → daftarIdGuru), sehingga data lama maupun baru sama-sama terbaca.
//  2. BIAYA DIBATASI. Jalur cepat = `in` + orderBy + limit (butuh indeks
//     komposit teacherId+tanggal). Bila indeks itu belum dipasang di proyek,
//     Firestore menolak dengan `failed-precondition`; kegagalan tersebut
//     DICATAT di localStorage supaya percobaan berikut tidak mengulang
//     putaran yang sama, lalu dipakai jalur tanpa orderBy (indeks tunggal)
//     yang diurutkan di klien. Hanya kegagalan indeks yang boleh beralih jalur:
//     kuota/jaringan tetap dilempar agar halaman bisa melaporkannya jujur
//     (docs/POLICY-ERROR-DAN-KUOTA.md).
//  3. GAJI TIDAK IKUT PULANG. Field bernilai uang dibuang SEBELUM data masuk
//     state (lihat kepala utils/logMengajar.js — register bug B-26).
// ============================================================
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { potongUntukQuery } from '../utils/papanJelajah';
import { buangNominal, urutLogTerbaru } from '../utils/logMengajar';

/** Penanda "indeks komposit belum ada" (per-bagian, per perangkat). */
export const KUNCI_INDEKS_LOG = 'gemilang.indeksLogGuru.v1';

/** Batas dokumen: dasbor hanya butuh 30 terbaru; riwayat butuh satu bulan. */
export const BATAS_LOG_DASBOR = 30;
export const BATAS_LOG_RIWAYAT = 200;

function indeksMasihDicoba() {
  try {
    return localStorage.getItem(KUNCI_INDEKS_LOG) !== 'belum';
  } catch {
    return true; // mode privat: coba jalur cepat, paling gagal sekali
  }
}

function catatIndeksBelumAda() {
  try {
    localStorage.setItem(KUNCI_INDEKS_LOG, 'belum');
  } catch {
    /* tidak bisa menyimpan: percobaan berikut mencoba lagi, tidak fatal */
  }
}

const apakahGagalIndeks = (e) => e?.code === 'failed-precondition';

/**
 * Ambil log mengajar milik guru (semua identitasnya), terbaru dulu.
 * @param {object} o
 * @param {string[]} o.ids    daftar identitas guru (daftarIdGuru())
 * @param {number}  [o.batas] jumlah maksimum log yang dikembalikan
 * @returns {Promise<Array>} log TANPA field bernilai uang
 */
export async function bacaLogMengajar({ ids = [], batas = BATAS_LOG_DASBOR } = {}) {
  const chunks = potongUntukQuery(ids);
  if (chunks.length === 0) return [];

  const semua = [];
  const simpan = (snap) => snap.docs.forEach((d) => semua.push({ id: d.id, ...buangNominal(d.data()) }));
  let jalurCepat = indeksMasihDicoba();

  for (const chunk of chunks) {
    if (jalurCepat) {
      try {
        simpan(await getDocs(query(
          collection(db, 'teacher_logs'),
          where('teacherId', 'in', chunk),
          orderBy('tanggal', 'desc'),
          limit(batas),
        )));
        continue;
      } catch (e) {
        if (!apakahGagalIndeks(e)) throw e;
        jalurCepat = false;
        catatIndeksBelumAda();
      }
    }
    // Jalur cadangan: tanpa orderBy (cukup indeks tunggal), urut di klien.
    simpan(await getDocs(query(collection(db, 'teacher_logs'), where('teacherId', 'in', chunk))));
  }

  return urutLogTerbaru(semua, batas);
}

/**
 * Cadangan untuk data WARISAN yang log-nya hanya punya `namaGuru` (tidak punya
 * `teacherId` yang cocok). Dipanggil HANYA bila pencarian berbasis identitas
 * mengembalikan nol baris, jadi tidak menambah biaya pada kasus normal.
 * Catatan lubang: nama bukan identitas yang aman (dua guru bisa bernama sama) —
 * karena itu jalur ini tidak dipakai bila data berbasis ID sudah ketemu.
 */
export async function bacaLogMengajarBerdasarkanNama({ nama = '', batas = BATAS_LOG_RIWAYAT } = {}) {
  const bersih = String(nama || '').trim();
  if (!bersih) return [];
  const snap = await getDocs(query(collection(db, 'teacher_logs'), where('namaGuru', '==', bersih)));
  const semua = snap.docs.map((d) => ({ id: d.id, ...buangNominal(d.data()) }));
  return urutLogTerbaru(semua, batas);
}

export default { bacaLogMengajar, bacaLogMengajarBerdasarkanNama, KUNCI_INDEKS_LOG, BATAS_LOG_DASBOR, BATAS_LOG_RIWAYAT };
