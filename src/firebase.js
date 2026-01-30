// Import fungsi wajib dari SDK Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Untuk Database
import { getAuth } from "firebase/auth"; // Untuk Login Admin

// Konfigurasi Kunci (Sesuai data Anda)
const firebaseConfig = {
  apiKey: "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",
  authDomain: "gemilangsystem.firebaseapp.com",
  projectId: "gemilangsystem",
  storageBucket: "gemilangsystem.firebasestorage.app",
  messagingSenderId: "1078433073773",
  appId: "1:1078433073773:web:cdb13ae553efbc1d1bcd64"
};

// 1. Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// 2. Inisialisasi Layanan (Export agar bisa dipakai di file lain)
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log("🔥 Firebase berhasil dihubungkan!");