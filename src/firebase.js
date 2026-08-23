import { initializeApp } from "firebase/app";

import {
  initializeFirestore
} from "firebase/firestore";

import { getAuth } from "firebase/auth";

import { getStorage } from "firebase/storage";

// ✅ Storage tetap dipakai oleh panel lain.
// Foto pada beberapa fitur tetap dapat disimpan
// sesuai konfigurasi yang sudah berjalan.

const firebaseConfig = {
  apiKey:
    "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",

  authDomain:
    "gemilangsystem.firebaseapp.com",

  projectId:
    "gemilangsystem",

  storageBucket:
    "gemilangsystem.appspot.com",

  messagingSenderId:
    "1078433073773",

  appId:
    "1:1078433073773:web:cdb13ae553efbc1d1bcd64"
};

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

const db =
  initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling:
        true,
    }
  );

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
};