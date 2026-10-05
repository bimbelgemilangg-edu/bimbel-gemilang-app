// scripts/backupFirestore.mjs
// ============================================================
// 🔥 BACKUP MINGGUAN seluruh Firestore ke Firebase Storage
// (sabuk pengaman #1 keputusan risk-acceptance owner,
//  docs/KEPUTUSAN-RISIKO-FIRESTORE.md).
//
// Dijalankan oleh GitHub Actions: .github/workflows/backup-mingguan.yml
// (Sabtu 20.00 UTC = Minggu 03.00 WIB) atau manual lewat tombol
// "Run workflow" di tab Actions.
//
// KENAPA TIDAK DI VERCEL LAGI (sejarah Okt 2026, penting):
//   Backup ini awalnya function Vercel (api/backupFirestore.js, PR #105).
//   Sejak itu SEMUA deploy Vercel merah. Delapan branch probe membuktikan:
//   isi file tidak berpengaruh -- function KE-13 apa pun (bahkan isi trivial
//   satu baris, bahkan salinan persis function lain) membuat build Vercel
//   gagal; semua pohon berisi 12 function hijau. Batas aman proyek ini: 12
//   function pada mesin build Vercel paket sekarang. Menghapus 1 function
//   (file ini menggantikannya di luar Vercel) membuka lagi deploy, termasuk
//   fitur tryout-terhubung-tentor yang tertahan sejak PR #106.
//   JANGAN memindahkan backup ini kembali ke folder api/ tanpa menaikkan
//   paket/build machine Vercel lebih dulu dan uji deploy sungguhan.
//
// SYARAT HIDUP (secret GitHub, bukan env Vercel):
//   FIREBASE_SERVICE_ACCOUNT = JSON key service account
//   FIREBASE_STORAGE_BUCKET  = opsional; kosong = bucket bawaan proyek
// Kalau secret belum diisi, script mengingatkan lalu keluar kode 0
// (workflow hijau tapi TIDAK ada backup minggu itu -- cek lognya).
//
// HASIL: folder backups/<stamp>/ di bucket -- satu JSON per koleksi
//   (format polos {__id, ...data}, sama seperti ekspor manual) + MANIFEST.json.
// Retensi manual: hapus folder backup lama dari Storage, sisakan minimal
// 4 minggu terakhir.
// ============================================================

import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!saRaw) {
  console.log('::warning::FIREBASE_SERVICE_ACCOUNT belum diisi di secret GitHub Actions.');
  console.log('::warning::Backup minggu ini DILEWATI. Isi secretnya: GitHub -> Settings -> Secrets and variables -> Actions.');
  process.exit(0);
}

let sa;
try { sa = JSON.parse(saRaw); }
catch { sa = JSON.parse(saRaw.replace(/\\n/g, '\n')); }
if (getApps().length === 0) initializeApp({ credential: cert(sa) });

const db = getFirestore();
const bucket = process.env.FIREBASE_STORAGE_BUCKET
  ? getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET)
  : getStorage().bucket();

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
const folder = `backups/${stamp}`;
const manifest = { waktu: new Date().toISOString(), sumber: 'github-actions', koleksi: {} };

const koleksiList = await db.listCollections();
for (const colRef of koleksiList) {
  const snap = await colRef.get();
  const rows = [];
  snap.forEach((d) => rows.push({ __id: d.id, ...d.data() }));
  await bucket.file(`${folder}/${colRef.id}.json`).save(JSON.stringify(rows), {
    contentType: 'application/json',
  });
  manifest.koleksi[colRef.id] = rows.length;
  console.log(`  ✔ ${colRef.id}: ${rows.length} dokumen`);
}
await bucket.file(`${folder}/MANIFEST.json`).save(JSON.stringify(manifest, null, 2), {
  contentType: 'application/json',
});

const total = Object.values(manifest.koleksi).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
console.log(`SELESAI: gs://${bucket.name}/${folder}/ -- ${koleksiList.length} koleksi, ${total} dokumen.`);
