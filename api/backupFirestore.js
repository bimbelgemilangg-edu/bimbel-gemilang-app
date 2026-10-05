// api/backupFirestore.js
// ============================================================
// 🔥 BARU (sabuk pengaman #1 keputusan risk-acceptance owner):
// BACKUP MINGGUAN otomatis seluruh Firestore ke Firebase Storage.
//
// Jadwal: Vercel cron, lihat vercel.json (Sabtu 20:00 UTC = Minggu 03.00 WIB).
// Bisa juga dipicu manual: GET/POST /api/backupFirestore?secret=<CRON_SECRET>
//
// SYARAT HIDUP (sama seperti verifyStaffLogin):
//   FIREBASE_SERVICE_ACCOUNT  = JSON key service account di env Vercel
//   CRON_SECRET               = string acak pilihan Anda; Vercel mengirimnya
//                               otomatis sebagai Bearer token pada cron.
// Selama keduanya belum diisi, endpoint menjawab 501 dan tidak berbuat
// apa-apa -- aman dipush lebih dulu.
//
// HASIL: bucket Storage gs://gemilangsystem.appspot.com/backups/<stamp>/
//   satu JSON per koleksi + MANIFEST.json (jumlah dokumen per koleksi).
// Retensi dikelola manual: hapus folder backup lama dari Storage bila
// sudah tidak perlu (biarkan minimal 4 minggu terakhir).
//
// KENAPA INI ADA: owner sadar memilih Firestore tetap terbuka demi
// kolaborasi (docs/KEPUTUSAN-RISIKO-FIRESTORE.md). Konsekuensi terburuk
// pilihan itu adalah orang luar MENGHAPUS data. Backup mingguan + latihan
// restore adalah yang membuat konsekuensi itu tidak fatal.
// ============================================================

import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const izinkan = (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  return bearer === secret || req.query?.secret === secret;
};

export default async function handler(req, res) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return res.status(501).json({ ok: false, pesan: 'FIREBASE_SERVICE_ACCOUNT belum diisi.' });
  }
  if (!izinkan(req)) {
    return res.status(401).json({ ok: false, pesan: 'Secret cron tidak cocok.' });
  }

  try {
    let sa;
    try { sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); }
    catch { sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n')); }
    if (getApps().length === 0) initializeApp({ credential: cert(sa) });

    const db = getFirestore();
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const bucket = getStorage().bucket();
    const folder = `backups/${stamp}`;

    const koleksiList = await db.listCollections();
    const manifest = { waktu: new Date().toISOString(), koleksi: {} };

    for (const colRef of koleksiList) {
      const snap = await colRef.get();
      const rows = [];
      snap.forEach((d) => rows.push({ __id: d.id, ...d.data() }));
      const json = JSON.stringify(rows);
      await bucket.file(`${folder}/${colRef.id}.json`).save(json, {
        contentType: 'application/json',
      });
      manifest.koleksi[colRef.id] = rows.length;
    }
    await bucket.file(`${folder}/MANIFEST.json`).save(JSON.stringify(manifest, null, 2), {
      contentType: 'application/json',
    });

    const total = Object.values(manifest.koleksi)
      .reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
    return res.status(200).json({ ok: true, folder, jumlahKoleksi: koleksiList.length, totalDokumen: total });
  } catch (e) {
    console.error('[backupFirestore] gagal:', e);
    return res.status(500).json({ ok: false, pesan: String(e?.message || e) });
  }
}
