// scripts/bersihkan_bank_soal_dummy.js
// ============================================================
// Utilitas pembersih butir uji coba / dummy di koleksi bank_soal
// Menandai status butir uji coba menjadi 'arsip' atau menghapus
// butir yang tidak valid (tanpa teks / seed sementara).
// ============================================================

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';

// Inisialisasi Firebase konfigurasi client (atau gunakan environment)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

export async function bersihkanButirDummyBankSoal() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getFirestore(app);

  console.log('🔍 Memeriksa dokumen di bank_soal...');
  const snap = await getDocs(collection(db, 'bank_soal'));
  const batch = writeBatch(db);
  let countDummy = 0;

  snap.forEach((d) => {
    const data = d.data() || {};
    const teks = String(data.teksSoal || data.soal || data.pertanyaan || '').trim();
    const isSeed = d.id.startsWith('seed-') || d.id.startsWith('dummy-');
    const isUjiCoba = teks.toLowerCase().includes('uji coba') || teks.toLowerCase().includes('dummy') || teks.length < 5;

    if (isSeed || isUjiCoba) {
      console.log(`Menandai arsip butir dummy: ${d.id}`);
      batch.update(doc(db, 'bank_soal', d.id), { status: 'arsip', diarsipkanPada: new Date().toISOString() });
      countDummy++;
    }
  });

  if (countDummy > 0) {
    await batch.commit();
    console.log(`✅ Berhasil mengarsipkan ${countDummy} butir dummy.`);
  } else {
    console.log('✨ Tidak ditemukan butir dummy yang perlu dibersihkan.');
  }
}
