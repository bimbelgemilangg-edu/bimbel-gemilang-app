import { initializeApp } from "firebase/app";

import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";

import { getStorage } from "firebase/storage";

// ✅ Storage tetap dipakai oleh panel lain.
// Foto pada beberapa fitur tetap dapat disimpan
// sesuai konfigurasi yang sudah berjalan.

// ============================================================
// KONFIGURASI — nilai tetap produksi, boleh ditimpa lewat VITE_FIREBASE_*
// ============================================================
// 🔥 BARU (audit 2026-10-10): .env.example sudah LAMA menyarankan ini —
// "Kalau nanti perlu lingkungan terpisah (development / staging /
// production), pindahkan blok firebaseConfig di src/firebase.js ke variabel
// VITE_FIREBASE_* dan daftarkan di sini." Ini pelaksanaannya.
//
// TUJUANNYA: fitur baru bisa diuji terhadap proyek Firebase KEDUA
// (mis. gemilangsystem-dev) tanpa sekali pun menyentuh data siswa produksi.
// Tanpa ini, preview Vercel dari sebuah branch TETAP menunjuk database
// produksi — berbahaya untuk fitur yang menulis.
//
// KENAPA NILAI TETAP DIPERTAHANKAN SEBAGAI FALLBACK: janji #1
// SOP-KESELAMATAN-PERUBAHAN — tidak ada perubahan yang boleh mengunci orang
// di luar. Tanpa fallback, build yang tidak punya env (termasuk build
// produksi hari ini) akan gagal total. Jadi: env diisi -> pakai env; env
// tidak ada -> persis seperti sebelumnya, tidak ada perilaku yang berubah.
//
// INI BUKAN KEBOCORAN. apiKey Firebase web adalah identifier publik, bukan
// secret (lihat .env.example). Yang menjaga data adalah Security Rules, bukan
// kerahasiaan nilai di bawah ini.
// ============================================================

const KONFIGURASI_PRODUKSI = {
  apiKey: "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",
  authDomain: "gemilangsystem.firebaseapp.com",
  projectId: "gemilangsystem",
  storageBucket: "gemilangsystem.appspot.com",
  messagingSenderId: "1078433073773",
  appId: "1:1078433073773:web:cdb13ae553efbc1d1bcd64",
};

// import.meta.env hanya ada di build Vite. Guard typeof menjaga berkas ini
// tetap bisa diimpor oleh skrip Node (tests/, scripts/) tanpa melempar error.
const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || KONFIGURASI_PRODUKSI.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || KONFIGURASI_PRODUKSI.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || KONFIGURASI_PRODUKSI.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || KONFIGURASI_PRODUKSI.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || KONFIGURASI_PRODUKSI.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || KONFIGURASI_PRODUKSI.appId,
};

// Penanda lingkungan yang TERLIHAT. Alasannya sama seperti __BUILD_STAMP__ di
// vite.config.js: keluhan "datanya kok beda / tidak konek" harus bisa dijawab
// dalam 2 detik — apakah aplikasi sedang menunjuk database dev atau produksi.
// projectId ikut dicetak karena itu memang identifier publik.
const LINGKUNGAN_FIREBASE =
  firebaseConfig.projectId === KONFIGURASI_PRODUKSI.projectId
    ? "produksi"
    : "dev/staging (BUKAN produksi)";

if (typeof console !== "undefined") {
  console.info(
    "[Gemilang] Firebase projectId: " + firebaseConfig.projectId +
    " — lingkungan: " + LINGKUNGAN_FIREBASE
  );
}

const app =
  initializeApp(
    firebaseConfig
  );

// ============================================================
// FIRESTORE
// ============================================================
// Gunakan auto-detect long polling.
//
// Tujuan:
// - membantu jaringan/proxy/browser yang bermasalah dengan
//   koneksi realtime Firestore berbasis transport tertentu.
// - tetap membiarkan SDK memilih transport yang lebih baik
//   ketika jaringan mendukungnya.
//
// Jangan memakai getFirestore(app) bersamaan dengan
// initializeFirestore(app, ...).
// ============================================================

let db;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (error) {
  // Fallback aman untuk browser private mode/IndexedDB yang tidak tersedia.
  console.warn('[Firestore] Cache persisten tidak tersedia; memakai cache sesi.', error);
  db = getFirestore(app);
}

// ============================================================
// AUTH
// ============================================================

const auth =
  getAuth(app);

// ============================================================
// STORAGE
// ============================================================

const storage =
  getStorage(app);

export {
  db,
  auth,
  storage,
  firebaseConfig,
  LINGKUNGAN_FIREBASE,
};
