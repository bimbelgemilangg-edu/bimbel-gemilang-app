// src/utils/auditLog.js
// ============================================================
// 🔥 BARU (akuntabilitas): jejak "SIAPA melakukan APA, KAPAN, dari
// perangkat apa" untuk semua aksi sensitif di area admin.
//
// Motivasinya sederhana: selama ini semua staf masuk pakai SATU
// password bersama, jadi kalau ada transaksi keuangan yang salah,
// data siswa yang berubah, atau kwitansi yang hilang -- tidak ada
// cara mengetahui siapa pelakunya. Dengan akun per orang + log ini,
// owner bisa menelusuri.
//
// Prinsip desain:
//  1. TIDAK PERNAH memblokir atau menggagalkan aksi pengguna. Semua
//     penulisan log bersifat fire-and-forget; kalau Firestore error
//     (kuota habis, offline), aksi utama tetap jalan. Kegagalan log
//     hanya dicatat ke console.
//  2. Tidak menyimpan data sensitif mentah (tidak ada password, tidak
//     ada hash, tidak ada PIN). Nominal uang boleh, karena justru itu
//     yang perlu diaudit.
//  3. Murah: satu dokumen kecil per kejadian, tanpa sub-koleksi.
//
// Struktur dokumen `audit_logs/{autoId}`:
//   waktu            Timestamp
//   aktor            username | 'owner' | 'admin-legacy' | 'tak-diketahui'
//   aktorNama        nama tampilan
//   peran            'kasir' | 'manajer' | 'owner' | 'legacy' | 'sistem'
//   kategori         'auth' | 'keuangan' | 'siswa' | 'guru' | 'akun' | 'konten' | 'lainnya'
//   aksi             string bertitik, mis. 'login.gagal', 'keuangan.transaksi.hapus'
//   target           ringkasan objek yang disentuh (mis. "Siswa: Budi (smp-3)")
//   detail           object bebas (nominal, alasan, dst) -- HARUS bebas password
//   perangkat        ringkasan browser/OS
// ============================================================

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { ambilSesiAdmin, ringkasanPerangkat } from './adminAuth';

export const COLLECTION_AUDIT = 'audit_logs';

export const KATEGORI = {
  AUTH: 'auth',
  KEUANGAN: 'keuangan',
  SISWA: 'siswa',
  GURU: 'guru',
  AKUN: 'akun',
  KONTEN: 'konten',
  LAINNYA: 'lainnya',
};

export const LABEL_KATEGORI = {
  auth: '🔐 Login & Keamanan',
  keuangan: '💰 Keuangan',
  siswa: '🎓 Siswa',
  guru: '👨‍🏫 Guru',
  akun: '👤 Akun Admin',
  konten: '📖 Materi & Soal',
  lainnya: '📌 Lainnya',
};

// Label manusiawi untuk aksi-aksi yang paling sering muncul. Aksi baru
// cukup ditambahkan di sini supaya tampilan log enak dibaca.
export const LABEL_AKSI = {
  'login.sukses': 'Berhasil masuk',
  'login.gagal': 'GAGAL masuk',
  'login.legacy': 'Masuk pakai password bersama (lama)',
  'logout': 'Keluar',
  'akun.buat': 'Buat akun admin baru',
  'akun.ubah': 'Ubah akun admin',
  'akun.nonaktif': 'Nonaktifkan akun admin',
  'akun.aktifkan': 'Aktifkan kembali akun admin',
  'akun.hapus': 'Hapus akun admin',
  'akun.resetpassword': 'Reset password akun admin',
  'akun.gantipassword': 'Ganti password sendiri',
  'keuangan.transaksi.tambah': 'Catat transaksi keuangan',
  'keuangan.transaksi.ubah': 'Ubah transaksi keuangan',
  'keuangan.transaksi.hapus': 'Hapus transaksi keuangan',
  'keuangan.kwitansi.buat': 'Terbitkan kwitansi',
  'keuangan.setorkas': 'Setor / tutup kas',
  'keuangan.honor.ubah': 'Ubah honor tentor',
  'pengaturan.ubah': 'Ubah pengaturan global',
};

/**
 * Ambil identitas aktor dari sesi yang sedang aktif.
 * Dipanggil tiap kali menulis log supaya selalu jujur soal siapa.
 */
export function aktorSaatIni() {
  // Owner (sesi PIN) punya prioritas -- dia super admin.
  if (
    typeof window !== 'undefined' &&
    window.localStorage.getItem('isOwnerLoggedIn') === 'true' &&
    window.localStorage.getItem('role') === 'owner'
  ) {
    return { aktor: 'owner', aktorNama: 'Owner', peran: 'owner' };
  }
  const sesi = ambilSesiAdmin();
  if (sesi) {
    return {
      aktor: sesi.username || (sesi.peran === 'legacy' ? 'admin-legacy' : 'tak-diketahui'),
      aktorNama: sesi.nama || sesi.username || 'Admin',
      peran: sesi.peran || 'legacy',
    };
  }
  return { aktor: 'tak-diketahui', aktorNama: '(tidak ada sesi)', peran: 'sistem' };
}

/**
 * Tulis satu entri jejak audit. TIDAK PERNAH melempar error ke pemanggil.
 *
 * @param {string} aksi     mis. 'login.gagal'
 * @param {object} [opt]
 * @param {string} [opt.kategori]  salah satu KATEGORI
 * @param {string} [opt.target]    ringkasan objek yang disentuh
 * @param {object} [opt.detail]    data tambahan (bebas password!)
 * @param {object} [opt.aktorOverride] paksa aktor tertentu (mis. untuk
 *                                   login gagal yang belum punya sesi)
 */
export function catatAudit(aksi, opt = {}) {
  const { kategori = KATEGORI.LAINNYA, target = '', detail = null, aktorOverride = null } = opt;

  // Buang field yang tidak boleh pernah masuk log.
  let detailAman = detail;
  if (detail && typeof detail === 'object') {
    detailAman = {};
    for (const [k, v] of Object.entries(detail)) {
      const kl = k.toLowerCase();
      if (kl.includes('password') || kl.includes('hash') || kl.includes('salt') || kl.includes('pin')) {
        detailAman[k] = '[disaring]';
      } else if (v === undefined) {
        continue;
      } else {
        detailAman[k] = v;
      }
    }
  }

  const payload = {
    waktu: serverTimestamp(),
    ...(aktorOverride || aktorSaatIni()),
    kategori,
    aksi: String(aksi || 'lainnya'),
    target: String(target || '').slice(0, 300),
    detail: detailAman,
    perangkat: ringkasanPerangkat(),
    url: typeof window !== 'undefined' ? String(window.location.pathname || '').slice(0, 200) : '',
  };

  try {
    addDoc(collection(db, COLLECTION_AUDIT), payload).catch((e) => {
      // Sengaja ditelan: jejak audit tidak boleh menggagalkan aksi pengguna.
      console.warn('[auditLog] gagal menulis jejak (aksi tetap jalan):', aksi, e?.message || e);
    });
  } catch (e) {
    console.warn('[auditLog] gagal menulis jejak:', e?.message || e);
  }
}

/**
 * Baca jejak audit terbaru untuk halaman penelusuran.
 * @param {object} opt
 * @param {number} [opt.jumlah=100]
 * @param {string} [opt.aktor]   filter per orang
 * @param {string} [opt.kategori]
 * @param {Date}   [opt.sejak]
 */
export async function bacaAudit({ jumlah = 100, aktor = '', kategori = '', sejak = null } = {}) {
  try {
    let q;
    const constraints = [];
    if (aktor) constraints.push(where('aktor', '==', aktor));
    if (kategori) constraints.push(where('kategori', '==', kategori));
    if (sejak) constraints.push(where('waktu', '>=', Timestamp.fromDate(sejak)));

    // Firestore butuh composite index untuk where + orderBy sekaligus.
    // Supaya halaman ini TIDAK pernah mati karena index belum dibuat, kita
    // pakai strategi: kalau ada filter, ambil tanpa orderBy lalu urutkan
    // di memori (jumlahnya kecil). Kalau tanpa filter, baru pakai orderBy.
    if (constraints.length > 0) {
      q = query(collection(db, COLLECTION_AUDIT), ...constraints, limit(Math.min(jumlah * 3, 500)));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => waktuMs(b.waktu) - waktuMs(a.waktu));
      return rows.slice(0, jumlah);
    }

    q = query(collection(db, COLLECTION_AUDIT), orderBy('waktu', 'desc'), limit(Math.min(jumlah, 300)));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[auditLog] gagal membaca jejak:', e);
    throw e;
  }
}

/** Ubah Timestamp Firestore / string / null jadi milidetik yang aman diurut. */
export function waktuMs(w) {
  if (!w) return 0;
  if (typeof w.toDate === 'function') return w.toDate().getTime();
  if (typeof w.seconds === 'number') return w.seconds * 1000;
  const t = new Date(w).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Format waktu ke gaya Indonesia yang ringkas. */
export function formatWaktu(w) {
  const ms = waktuMs(w);
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return new Date(ms).toISOString();
  }
}

/** Label manusiawi sebuah aksi. */
export function labelAksi(aksi) {
  return LABEL_AKSI[aksi] || String(aksi || '').replace(/\./g, ' · ');
}

export default {
  COLLECTION_AUDIT,
  KATEGORI,
  LABEL_KATEGORI,
  LABEL_AKSI,
  aktorSaatIni,
  catatAudit,
  bacaAudit,
  waktuMs,
  formatWaktu,
  labelAksi,
};
