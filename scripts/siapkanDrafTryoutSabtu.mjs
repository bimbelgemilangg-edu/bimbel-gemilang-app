// scripts/siapkanDrafTryoutSabtu.mjs
// ============================================================
// Penyiap draf try out UTBK untuk slot SABTU minggu ini, untuk dijalankan
// dari mesin/CI yang MEMBAWA konfigurasi Firebase sendiri:
//
//     set -a; source .env.local; set +a
//     node scripts/siapkanDrafTryoutSabtu.mjs
//
// 🔥 PAGAR: menolak konfigurasi yang menunjuk Firestore produksi kecuali
// diberi --produksi-sadar. Ini alasan mengapa refactor pakaiDb() ada:
// sebelum itu, mesin try out mengimpor db dari src/firebase.js yang di Node
// polos jatuh ke produksi -- cron seperti ini akan menulis draf ke database
// siswa sungguhan tanpa siapa pun menyadarinya.
//
// Alur: cari template Sabtu di koleksi tryout_template_otomatis; bila belum
// ada, buat dari templateTryoutUtbkSabtu() (155 soal / 195 menit persis sheet
// KOMPONEN owner); lalu siapkanDrafMingguIni() membuat PAKET DRAF untuk slot
// Sabtu -- status 'draf', TIDAK terlihat siswa sampai admin menerbitkannya
// di halaman Jadwal Try Out Otomatis. Otomasi berhenti sengaja di sini:
// penerbitan adalah keputusan manusia.
// ============================================================
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { pakaiDb, siapkanDrafMingguIni, COL_TEMPLATE } from '../src/utils/mesinTryOutOtomatis.js';
import { templateTryoutUtbkSabtu, TOTAL_SOAL_UTBK, TOTAL_MENIT_UTBK } from '../src/utils/templateTryoutUtbk.js';

const PRODUKSI = 'gemilangsystem';
const env = process.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.SEED_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.SEED_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.SEED_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.SEED_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.SEED_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID || env.SEED_APP_ID,
};
if (!config.projectId || !config.apiKey) {
  console.error('❌ Konfigurasi Firebase tidak ada. Ekspor VITE_FIREBASE_* dulu (lihat docs/CARA-MENCOBA-FITUR.md).');
  process.exit(1);
}
if (config.projectId === PRODUKSI && !process.argv.includes('--produksi-sadar')) {
  console.error(`❌ MENOLAK: konfigurasi menunjuk produksi (${PRODUKSI}).`);
  console.error('   Draf Sabtu seharusnya disiapkan di proyek dev, atau lewat klik admin.');
  console.error('   Paksa dengan --produksi-sadar hanya bila memang itu niatnya.');
  process.exit(1);
}

const app = initializeApp(config);
pakaiDb(getFirestore(app));
console.log(`Menyiapkan draf try out Sabtu di proyek: ${config.projectId}`);

const snap = await getDocs(collection(pakaiDb(), COL_TEMPLATE));
const namaTemplate = templateTryoutUtbkSabtu().nama;
let template = snap.docs.map((d) => ({ id: d.id, ...d.data() })).find((t) => t.nama === namaTemplate && t.aktif !== false);
if (!template) {
  const payload = { ...templateTryoutUtbkSabtu(), createdAt: serverTimestamp() };
  const ref = await addDoc(collection(pakaiDb(), COL_TEMPLATE), payload);
  template = { id: ref.id, ...payload };
  console.log(`+ template dibuat: ${namaTemplate} (${TOTAL_SOAL_UTBK} soal / ${TOTAL_MENIT_UTBK} menit, hari Sabtu)`);
} else {
  console.log(`= template ditemukan: ${template.nama} (${template.id})`);
}

const hasil = await siapkanDrafMingguIni(template, { jamBuka: template.jamBuka || '07:00' });
for (const h of hasil) {
  if (h.skipped) console.log(`  - lewat: ${h.judul || h.alasan} (${h.alasan || 'sudah ada'})`);
  else if (h.ok) console.log(`  + draf: ${h.judul} (${h.totalSoal} soal)`);
  else console.log(`  ❌ gagal: ${h.error || h.judul}`);
}
console.log('\nDraf berstatus "draf": tidak terlihat siswa sampai diterbitkan admin.');
process.exit(0);
