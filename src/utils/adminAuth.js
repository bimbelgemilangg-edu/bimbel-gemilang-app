// ============================================================
// ⚠️⚠️ BACA INI DULU SEBELUM MENGANDALKAN FILE INI ⚠️⚠️
//
// Pemisahan akun admin memberi AKUNTABILITAS (siapa melakukan apa
// tercatat di jejak audit) dan menghapus password teks polos.
//
// TAPI IA BUKAN PERBAIKAN KEAMANAN selama Firestore Security Rules
// masih terbuka. Hasil uji 2026-10-01 pada proyek `gemilangsystem`:
// siapa pun bisa MEMBACA, MENULIS, dan MENGHAPUS seluruh database
// tanpa login. Konsekuensinya untuk file ini:
//
//   - `admin_users` ikut terbaca publik -> hash password bisa
//     diunduh lalu ditebak secara offline.
//   - `admin_users` ikut TERTULIS publik -> orang asing bisa
//     menyisipkan akun {peran:'manajer', aktif:true} sendiri.
//   - Semua cek peran di sini berjalan di BROWSER, jadi bisa
//     dilewati lewat DevTools. Hanya Rules yang tidak bisa dilewati.
//
// Perbaikan yang sesungguhnya, beserta urutan langkahnya, ada di:
//   docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md
//
// Struktur file ini SENGAJA dipusatkan di satu tempat supaya saat
// backend-nya dipindah ke Firebase Auth (langkah yang benar), yang
// perlu diubah cuma file ini -- bukan puluhan komponen.
// ============================================================
//
// src/utils/adminAuth.js
// ============================================================
// 🔥 BARU (pemisahan akun Admin): sebelumnya SEMUA staf admin masuk
// pakai SATU password bersama (settings/global_config.adminPassword),
// tanpa username. Akibatnya:
//   - tidak ada akuntabilitas (kalau ada data salah, tidak bisa
//     diketahui siapa yang mengubah),
//   - ganti staf = ganti password untuk semua orang,
//   - tidak bisa mencabut akses satu orang saja.
//
// Sekarang setiap staf admin punya akun sendiri (username + password)
// tersimpan di koleksi Firestore `admin_users`, dengan password yang
// DI-HASH (PBKDF2-HMAC-SHA256 + salt acak per akun). Password asli
// TIDAK PERNAH disimpan, tidak di Firestore dan tidak di localStorage.
//
// Peran akun admin:
//   - 'kasir'   : operasional harian (siswa, keuangan kas, kwitansi,
//                 pendaftaran, jadwal). TIDAK bisa lihat gaji guru,
//                 pengaturan global, atau portal owner.
//   - 'manajer' : semua hak kasir + kelola akun admin & baca audit log.
// Owner tetap punya jalurnya sendiri (PIN, LoginOwner.jsx) dan otomatis
// dianggap punya hak tertinggi di area admin.
//
// ⚠️ KOMPATIBILITAS: password admin lama TETAP berfungsi selama owner
// belum menonaktifkannya, supaya tidak ada staf yang terkunci saat
// update ini dipasang. Lihat `loginAdmin()` bagian "jalur warisan" dan
// `izinkanLoginLegacy` di Settings.
// ============================================================

import { db } from '../firebase';
import {
  collection, getDocs, getDoc, doc, setDoc, updateDoc, serverTimestamp,
  query, where,
} from 'firebase/firestore';

// ------------------------------------------------------------
// KONSTANTA
// ------------------------------------------------------------

export const COLLECTION_ADMIN = 'admin_users';
export const KEY_SESSION = 'adminSession';

// 🔥 DIUBAH (keputusan owner 2026-10-01): peran utama staf bukan "kasir"
// lagi melainkan OPERASIONAL. Staf operasional memegang kendali penuh atas
// tentor, siswa, validasi sesi, DAN menu gaji -- yang dulu dibatasi dari
// "kasir". Peran lama 'kasir' tetap diterima dan DIPETAKAN ke operasional
// supaya akun & sesi lama tidak rusak.
export const PERAN_ADMIN = {
  KASIR: 'kasir', // legacy -- diperlakukan sama dengan operasional
  OPERASIONAL: 'operasional',
  MANAJER: 'manajer',
};

export const LABEL_PERAN_ADMIN = {
  operasional: 'Admin Operasional',
  kasir: 'Admin Operasional', // label legacy disamakan
  manajer: 'Admin Manajer',
  owner: 'Owner (Super Admin)',
  legacy: 'Admin (akun lama bersama)',
};

// Satu tempat pemetaan peran lama -> baru. Semua pemeriksaan peran
// sebaiknya lewat sini supaya tidak ada cabang yang lupa migrasi.
// (Dinamai normalisasiPeranAdmin, bukan peranEfektif, karena nama itu
// sudah dipakai sebagai parameter simpanSesiAdmin di berkas ini.)
export const normalisasiPeranAdmin = (peran) =>
  (peran === 'kasir' ? PERAN_ADMIN.OPERASIONAL : peran);

// ------------------------------------------------------------
// LOGIKA HASH & VALIDASI
// ------------------------------------------------------------
// 🔥 Dipindah ke ./passwordHash.js (modul murni, tanpa Firebase) supaya
// bisa DIUJI di Node -- lihat tests/passwordHash.test.mjs. Kode kriptografi
// tidak boleh dikirim tanpa test. Di sini cuma di-re-export agar pemanggil
// lama (yang meng-impor dari adminAuth) tetap jalan tanpa diubah.
// ------------------------------------------------------------

export {
  PBKDF2_ITERATIONS,
  SALT_BYTES,
  USERNAME_DILARANG,
  bufToHex,
  hexToBuf,
  buatSalt,
  pastikanWebCrypto,
  hashPassword,
  perbandinganAman,
  verifikasiPassword,
  normalisasiUsername,
  validasiUsername,
  validasiPassword,
} from './passwordHash';

// Dipakai langsung di dalam modul ini.
import {
  hashPassword,
  verifikasiPassword,
  buatSalt,
  normalisasiUsername,
  validasiUsername,
  validasiPassword,
  PBKDF2_ITERATIONS,
} from './passwordHash';

// ------------------------------------------------------------
// BACA DAFTAR AKUN
// ------------------------------------------------------------

/** Ambil semua akun admin. */
export async function ambilSemuaAdmin() {
  const snap = await getDocs(collection(db, COLLECTION_ADMIN));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => normalisasiUsername(a.username).localeCompare(normalisasiUsername(b.username)));
}

/** Cari satu akun berdasarkan username (case-insensitive). */
export async function cariAdminByUsername(username) {
  const u = normalisasiUsername(username);
  if (!u) return null;
  // Username disimpan sudah dinormalisasi, tapi data lama mungkin belum --
  // jadi query pakai where dulu, fallback ke scan penuh kalau tidak ketemu.
  try {
    const q = query(collection(db, COLLECTION_ADMIN), where('username', '==', u));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }
  } catch (e) {
    console.warn('[adminAuth] query where gagal, fallback scan penuh:', e);
  }
  const semua = await ambilSemuaAdmin();
  return semua.find((a) => normalisasiUsername(a.username) === u) || null;
}

/** Apakah sudah ada minimal satu akun admin bernama? */
export async function sudahAdaAkunAdmin() {
  const semua = await ambilSemuaAdmin();
  return semua.length > 0;
}

// ------------------------------------------------------------
// CRUD AKUN
// ------------------------------------------------------------

/**
 * Buat akun admin baru.
 * @returns {Promise<{id:string}>}
 */
export async function buatAdmin({ username, nama, jabatan, peran, password, dibuatOleh }) {
  const u = normalisasiUsername(username);
  const errU = validasiUsername(u);
  if (errU) throw new Error(errU);
  const errP = validasiPassword(password);
  if (errP) throw new Error(errP);
  if (!nama || !String(nama).trim()) throw new Error('Nama lengkap wajib diisi.');

  const existing = await cariAdminByUsername(u);
  // Akun yang masih hidup -> username benar-benar terpakai.
  // Akun yang sudah soft-delete -> boleh dipakai ulang (dokumennya ditimpa),
  // supaya owner tidak terjebak username yang "digantung" selamanya.
  if (existing && !existing.dihapus && existing.aktif !== false) {
    throw new Error(`Username "${u}" sudah dipakai akun lain.`);
  }

  const salt = buatSalt();
  const passwordHash = await hashPassword(password, salt);

  const id = u; // pakai username sebagai document id -> dijamin unik
  const payload = {
    username: u,
    nama: String(nama).trim(),
    jabatan: String(jabatan || '').trim(),
    peran: peran === PERAN_ADMIN.MANAJER ? PERAN_ADMIN.MANAJER : PERAN_ADMIN.OPERASIONAL,
    aktif: true,
    passwordHash,
    passwordSalt: salt,
    passwordIterations: PBKDF2_ITERATIONS,
    dibuatOleh: dibuatOleh || 'owner',
    dibuatPada: serverTimestamp(),
    terakhirLogin: null,
    terakhirLoginPerangkat: '',
    jumlahLogin: 0,
    wajibGantiPassword: false,
  };
  await setDoc(doc(db, COLLECTION_ADMIN, id), payload);
  return { id };
}

/** Ubah profil/peran/status aktif (tanpa sentuh password). */
export async function perbaruiAdmin(id, perubahan) {
  const bersih = { ...perubahan };
  // Field yang tidak boleh diubah sembarangan dari sini.
  delete bersih.passwordHash;
  delete bersih.passwordSalt;
  delete bersih.passwordIterations;
  delete bersih.username;
  delete bersih.id;
  Object.keys(bersih).forEach((k) => bersih[k] === undefined && delete bersih[k]);
  if (Object.keys(bersih).length === 0) return;
  await updateDoc(doc(db, COLLECTION_ADMIN, id), bersih);
}

/** Set password baru (reset oleh manajer/owner, atau ganti sendiri). */
export async function gantiPasswordAdmin(id, passwordBaru, { wajibGanti = false } = {}) {
  const errP = validasiPassword(passwordBaru);
  if (errP) throw new Error(errP);
  const salt = buatSalt();
  const passwordHash = await hashPassword(passwordBaru, salt);
  await updateDoc(doc(db, COLLECTION_ADMIN, id), {
    passwordHash,
    passwordSalt: salt,
    passwordIterations: PBKDF2_ITERATIONS,
    wajibGantiPassword: !!wajibGanti,
    passwordDigantiPada: serverTimestamp(),
  });
}

/**
 * Hapus akun. DIBLOKIR kalau ini satu-satunya akun manajer yang aktif,
 * supaya owner tidak kehilangan kemampuan mengelola akun dari sisi admin.
 */
export async function hapusAdmin(id) {
  const semua = await ambilSemuaAdmin();
  const target = semua.find((a) => a.id === id);
  if (!target) throw new Error('Akun tidak ditemukan.');
  const manajerAktif = semua.filter(
    (a) => a.aktif !== false && a.peran === PERAN_ADMIN.MANAJER,
  );
  if (target.peran === PERAN_ADMIN.MANAJER && manajerAktif.length <= 1) {
    throw new Error(
      'Ini satu-satunya akun Manajer yang aktif. Aktifkan/promosikan akun manajer lain dulu, ' +
      'baru akun ini boleh dihapus. (Owner dengan PIN selalu tetap bisa masuk.)',
    );
  }
  // Firestore: hapus dengan menandai + kosongkan hash, supaya jejak audit
  // tetap punya referensi. Kalau owner mau benar-benar hilang, pakai
  // deleteDoc -- tapi soft-delete lebih aman untuk audit.
  await updateDoc(doc(db, COLLECTION_ADMIN, id), {
    aktif: false,
    dihapus: true,
    dihapusPada: serverTimestamp(),
    passwordHash: '',
    passwordSalt: '',
  });
}

// ------------------------------------------------------------
// SESI (localStorage)
// ------------------------------------------------------------

/**
 * Bentuk objek sesi. Disimpan di localStorage sebagai JSON.
 * SENGATJA tetap menulis `isLoggedIn` + `role` yang lama supaya SEMUA
 * guard/komponen yang sudah ada (AdminRoute, ManageFinance, dll) terus
 * berfungsi tanpa perlu diubah serentak.
 */
function bentukSesi(akun, peranEfektif) {
  return {
    username: akun?.username || '',
    nama: akun?.nama || (peranEfektif === 'owner' ? 'Owner' : 'Admin'),
    jabatan: akun?.jabatan || '',
    peran: peranEfektif,
    loginAt: new Date().toISOString(),
  };
}

export function simpanSesiAdmin(akun, peranEfektif) {
  const sesi = bentukSesi(akun, peranEfektif);
  localStorage.setItem(KEY_SESSION, JSON.stringify(sesi));
  // Kompatibilitas guard lama.
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('role', 'admin');
  // Sesi admin meniadakan sesi owner (aturan lama dipertahankan).
  localStorage.removeItem('isOwnerLoggedIn');
  return sesi;
}

/** Baca sesi admin saat ini (null kalau tidak ada / rusak). */
export function ambilSesiAdmin() {
  try {
    const raw = localStorage.getItem(KEY_SESSION);
    if (!raw) return null;
    const sesi = JSON.parse(raw);
    if (!sesi || typeof sesi !== 'object') return null;
    return sesi;
  } catch {
    return null;
  }
}

/** Nama tampilan untuk header/sidebar. */
export function namaAdminAktif() {
  const sesi = ambilSesiAdmin();
  if (sesi?.nama) return sesi.nama;
  if (localStorage.getItem('isLoggedIn') === 'true') return 'Admin';
  return '';
}

/** Peran akun admin yang sedang login ('kasir' | 'manajer' | 'legacy' | null). */
export function peranAdminAktif() {
  const sesi = ambilSesiAdmin();
  return sesi?.peran || null;
}

export function isManajerSession() {
  const p = peranAdminAktif();
  return p === PERAN_ADMIN.MANAJER || p === 'owner';
}

/** Bersihkan semua jejak sesi admin. */
export function hapusSesiAdmin() {
  localStorage.removeItem(KEY_SESSION);
  localStorage.removeItem('isLoggedIn');
  // `role` hanya dihapus kalau memang sedang admin, supaya tidak
  // menghapus sesi guru/siswa yang kebetulan nyangkut di key yang sama.
  if (localStorage.getItem('role') === 'admin') localStorage.removeItem('role');
}

// ------------------------------------------------------------
// VERIFIKASI LEWAT SERVER (dipakai kalau sudah diaktifkan)
// ------------------------------------------------------------

/**
 * Coba verifikasi kredensial ke `api/verifyStaffLogin.js`.
 *
 * 🔥 KENAPA ADA FALLBACK: endpoint itu butuh FIREBASE_SERVICE_ACCOUNT di
 * Vercel. Selama variabelnya belum diisi, endpoint menjawab 501 dan fungsi
 * ini melapor `tersedia: false`, sehingga klien jatuh ke verifikasi
 * sisi-browser yang lama. Artinya kode ini AMAN dipasang lebih dulu —
 * perilaku aplikasi live tidak berubah sampai Owner benar-benar
 * mengaktifkan service account-nya.
 *
 * Setelah aktif, browser tidak lagi perlu membaca `settings/global_config`
 * maupun `admin_users`, sehingga kedua koleksi itu bisa dikunci total di
 * Firestore Rules.
 *
 * @returns {Promise<{tersedia:boolean, data?:object, alasan?:string}>}
 */
export async function verifikasiLewatServer({ jalur, username, password }) {
  try {
    const res = await fetch('/api/verifyStaffLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jalur, username, password }),
    });
    // 501 = belum dikonfigurasi, 503 = Admin SDK gagal siap,
    // 404 = endpoint belum ter-deploy. Semuanya berarti "pakai jalur lama".
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      return { tersedia: false, alasan: `server menjawab ${res.status}` };
    }
    const data = await res.json().catch(() => ({}));
    return { tersedia: true, data };
  } catch (e) {
    // Jaringan gagal / CORS / endpoint tak ada -> jangan kunci orang di luar.
    return { tersedia: false, alasan: String(e?.message || e) };
  }
}

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

/**
 * Login admin.
 *
 * Urutan percobaan:
 *  1. Akun bernama di `admin_users` (username + password)  <- jalur baru
 *  2. Password admin lama bersama (`settings.adminPassword`) <- jalur warisan,
 *     hanya kalau username dikosongkan DAN owner belum menonaktifkannya.
 *
 * @returns {Promise<{ok:boolean, sesi?:object, pesan?:string, jalur?:string, akun?:object}>}
 */
export async function loginAdmin({ username, password, izinkanLegacy = true }) {
  const u = normalisasiUsername(username);

  // ============================================================
  // TAHAP 1 — coba verifikasi di SERVER.
  // Kalau sudah diaktifkan, ini satu-satunya jalur yang dipakai dan
  // browser tidak menyentuh dokumen kredensial sama sekali.
  // ============================================================
  const server = await verifikasiLewatServer({ jalur: 'admin', username: u, password });

  if (server.tersedia) {
    const d = server.data || {};
    if (!d.ok) {
      return { ok: false, pesan: d.pesan || 'Username atau password salah.', jalur: 'server' };
    }
    const akun = {
      username: d.username || '',
      nama: d.nama || (d.peran === 'legacy' ? 'Admin (akun bersama)' : 'Admin'),
      jabatan: d.jabatan || '',
      peran: d.peran || PERAN_ADMIN.KASIR,
    };
    const sesi = simpanSesiAdmin(
      akun,
      normalisasiPeranAdmin(akun.peran) || PERAN_ADMIN.OPERASIONAL,
    );
    return {
      ok: true,
      sesi,
      akun,
      // 'server-akun' | 'server-legacy' -- dipakai jejak audit & pesan migrasi
      jalur: d.jalur === 'admin-legacy' ? 'legacy' : 'baru',
      lewatServer: true,
      wajibGantiPassword: d.wajibGantiPassword === true,
    };
  }

  // ============================================================
  // TAHAP 2 — FALLBACK: verifikasi di browser (perilaku lama).
  // Dipakai selama FIREBASE_SERVICE_ACCOUNT belum diisi di Vercel.
  // ⚠️ Jalur ini MEMBACA `settings/global_config` dan `admin_users`
  // dari klien, jadi selama ia yang dipakai, kedua koleksi itu TIDAK
  // BISA dikunci di Rules. Lihat docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md
  // ============================================================

  // ---- 2a. akun bernama di admin_users ----
  if (u) {
    const akun = await cariAdminByUsername(u);

    // 🔥 SENGAJA: pesan untuk "username tidak ada" dan "password salah"
    // DIBUAT SAMA. Kalau dibedakan, orang luar bisa menebak-nebak sampai
    // menemukan username yang terdaftar (user enumeration), lalu fokus
    // menebak password akun itu saja. Username yang dicoba tetap tercatat
    // lengkap di jejak audit, jadi owner tidak kehilangan visibilitas.
    const PESAN_KREDENSIAL_SALAH = 'Username atau password salah.';

    if (!akun) return { ok: false, pesan: PESAN_KREDENSIAL_SALAH, jalur: 'baru' };
    // Dua keadaan di bawah TETAP diberi pesan yang jelas, karena bukan
    // soal kredensial salah -- staf ini memang perlu diarahkan ke orang
    // yang bisa memperbaiki akunnya.
    if (akun.aktif === false || akun.dihapus) {
      return { ok: false, pesan: 'Akun ini sudah dinonaktifkan. Hubungi Owner/Manajer.', jalur: 'baru' };
    }
    if (!akun.passwordHash) {
      return { ok: false, pesan: 'Akun ini belum punya password. Minta Manajer mereset passwordnya.', jalur: 'baru' };
    }
    const cocok = await verifikasiPassword(password, akun);
    if (!cocok) return { ok: false, pesan: PESAN_KREDENSIAL_SALAH, jalur: 'baru', akun };

    // Sukses -> catat metadata login (fire-and-forget, jangan blokir UI).
    updateDoc(doc(db, COLLECTION_ADMIN, akun.id), {
      terakhirLogin: serverTimestamp(),
      terakhirLoginPerangkat: ringkasanPerangkat(),
      jumlahLogin: (Number(akun.jumlahLogin) || 0) + 1,
    }).catch(() => {});

    const sesi = simpanSesiAdmin(
      akun,
      normalisasiPeranAdmin(akun.peran) || PERAN_ADMIN.OPERASIONAL,
    );
    return { ok: true, sesi, jalur: 'baru', akun, lewatServer: false };
  }

  // ---- 2b. jalur warisan: password bersama ----
  if (!izinkanLegacy) {
    return {
      ok: false,
      pesan: 'Login dengan password bersama sudah dinonaktifkan Owner. Isi username akun Anda.',
      jalur: 'legacy-ditolak',
    };
  }

  const snap = await getDoc(doc(db, 'settings', 'global_config'));
  const legacyPw = snap.exists() ? snap.data()?.adminPassword : null;
  if (!legacyPw) {
    return {
      ok: false,
      pesan: 'Isi username akun admin Anda. (Belum punya akun? Minta Owner membuatnya di menu Pengguna Admin.)',
      jalur: 'legacy-kosong',
    };
  }
  if (password !== legacyPw) {
    return { ok: false, pesan: 'Username atau password salah.', jalur: 'legacy' };
  }

  const akunLegacy = {
    username: '',
    nama: 'Admin (akun bersama)',
    jabatan: '',
    peran: 'legacy',
  };
  const sesi = simpanSesiAdmin(akunLegacy, 'legacy');
  return { ok: true, sesi, jalur: 'legacy', akun: akunLegacy, lewatServer: false };
}

/** Ringkasan perangkat untuk jejak audit (bukan fingerprinting agresif). */
export function ringkasanPerangkat() {
  try {
    const ua = navigator.userAgent || '';
    // Ambil browser + OS seperlunya saja, buang detail yang tidak berguna.
    const browser =
      /Edg\//.test(ua) ? 'Edge'
      : /OPR\//.test(ua) ? 'Opera'
      : /Chrome\//.test(ua) ? 'Chrome'
      : /Safari\//.test(ua) ? 'Safari'
      : /Firefox\//.test(ua) ? 'Firefox'
      : 'Browser lain';
    const os =
      /Windows/.test(ua) ? 'Windows'
      : /Android/.test(ua) ? 'Android'
      : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
      : /Mac OS X/.test(ua) ? 'macOS'
      : /Linux/.test(ua) ? 'Linux'
      : 'OS lain';
    return `${browser} · ${os}`;
  } catch {
    return 'perangkat tidak diketahui';
  }
}

export default {
  PERAN_ADMIN,
  LABEL_PERAN_ADMIN,
  COLLECTION_ADMIN,
  PBKDF2_ITERATIONS,
  hashPassword,
  verifikasiPassword,
  normalisasiUsername,
  validasiUsername,
  validasiPassword,
  ambilSemuaAdmin,
  cariAdminByUsername,
  sudahAdaAkunAdmin,
  buatAdmin,
  perbaruiAdmin,
  gantiPasswordAdmin,
  hapusAdmin,
  simpanSesiAdmin,
  ambilSesiAdmin,
  hapusSesiAdmin,
  namaAdminAktif,
  peranAdminAktif,
  isManajerSession,
  normalisasiPeranAdmin,
  loginAdmin,
  verifikasiLewatServer,
  ringkasanPerangkat,
};
