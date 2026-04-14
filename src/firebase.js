import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// ✅ Storage TIDAK dipakai di ManageBlog/PublicBlog — foto disimpan Base64 di Firestore
// Storage tetap diimport agar panel guru/siswa yang sudah pakai tidak error
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ",
  authDomain: "gemilangsystem.firebaseapp.com",
  projectId: "gemilangsystem",
  storageBucket: "gemilangsystem.appspot.com",
  messagingSenderId: "1078433073773",
  appId: "1:1078433073773:web:cdb13ae553efbc1d1bcd64"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // tetap ada untuk panel lain

export { db, auth, storage, firebaseConfig };