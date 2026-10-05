// api/backupFirestore.js
// ============================================================
// 🔥 BACKUP MINGGUAN otomatis seluruh Firestore ke Firebase Storage
// (sabuk pengaman #1 keputusan risk-acceptance owner).
//
// Jadwal: Vercel cron, lihat vercel.json (Sabtu 20:00 UTC = Minggu 03.00 WIB).
// Bisa juga dipicu manual: GET/POST /api/backupFirestore?secret=<CRON_SECRET>
// atau header Authorization: Bearer <CRON_SECRET>.
//
// SYARAT HIDUP:
//   FIREBASE_SERVICE_ACCOUNT  = JSON key service account di env Vercel
//   CRON_SECRET               = string acak pilihan Anda; Vercel mengirimnya
//                               otomatis sebagai Bearer token pada cron.
// Opsional:
//   FIREBASE_STORAGE_BUCKET   = nama bucket tujuan; kalau kosong dipakai
//                               bucket bawaan proyek <project_id>.appspot.com.
// Selama dua syarat pertama belum diisi, endpoint menjawab 501 dan tidak
// berbuat apa-apa -- aman dipush lebih dulu.
//
// Service account harus berhak Storage Admin di bucket tsb. Service account
// bawaan Firebase (<project>@appspot.gserviceaccount.com) sudah berhak.
//
// HASIL: folder backups/<stamp>/ di bucket -- satu JSON per koleksi +
//   MANIFEST.json (jumlah dokumen per koleksi).
// Retensi dikelola manual: hapus folder backup lama dari Storage bila sudah
// tidak perlu (biarkan minimal 4 minggu terakhir).
//
// ⚠️ CATATAN TEKNIS -- JANGAN dikembalikan ke firebase-admin/storage tanpa
//   uji deploy dulu: upload di sini sengaja lewat REST murni (fetch + JWT
//   RS256 ditandatangani node:crypto). Sejarah: sejak PR #105 file ini
//   mengimpor `firebase-admin/storage`, dan SEMUA deploy Vercel sesudahnya
//   gagal di tahap build function (rantai dependensi @google-cloud/storage
//   tidak bisa dibundel Vercel). Dibuktikan lewat branch probe:
//   probe/vercel-hanya-api (merah) vs probe/vercel-hanya-pkg (hijau),
//   probe/vercel-api-lazy (merah juga walau import dinamis).
//   Sejak file ini berhenti mengimpor SDK storage, deploy hijau lagi.
// ============================================================

import { createSign } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const izinkan = (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  return bearer === secret || req.query?.secret === secret;
};

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

// Mintakan access token OAuth2 dari kredensial service account (JWT RS256).
async function tokenStorage(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url({ alg: 'RS256', typ: 'JWT' });
  const claim = b64url({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/devstorage.read_write',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const signer = createSign('RSA-SHA256');
  signer.update(`${head}.${claim}`);
  const jwt = `${head}.${claim}.${signer.sign(sa.private_key).toString('base64url')}`;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await r.json();
  if (!j.access_token) {
    throw new Error(`Token Storage ditolak: ${JSON.stringify(j).slice(0, 200)}`);
  }
  return j.access_token;
}

// Upload satu file JSON ke bucket lewat REST (multipart sederhana: media upload).
async function uploadJson(token, bucket, nama, isi) {
  const r = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(nama)}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: isi,
    },
  );
  if (!r.ok) {
    throw new Error(`Upload ${nama} gagal: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  }
}

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
    const bucket = process.env.FIREBASE_STORAGE_BUCKET || `${sa.project_id}.appspot.com`;
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const folder = `backups/${stamp}`;
    const token = await tokenStorage(sa);

    const koleksiList = await db.listCollections();
    const manifest = { waktu: new Date().toISOString(), koleksi: {} };

    for (const colRef of koleksiList) {
      const snap = await colRef.get();
      const rows = [];
      snap.forEach((d) => rows.push({ __id: d.id, ...d.data() }));
      await uploadJson(token, bucket, `${folder}/${colRef.id}.json`, JSON.stringify(rows));
      manifest.koleksi[colRef.id] = rows.length;
    }
    await uploadJson(token, bucket, `${folder}/MANIFEST.json`, JSON.stringify(manifest, null, 2));

    const total = Object.values(manifest.koleksi)
      .reduce((s, v) => (s + (typeof v === 'number' ? v : 0)), 0);
    return res.status(200).json({ ok: true, bucket, folder, jumlahKoleksi: koleksiList.length, totalDokumen: total });
  } catch (e) {
    console.error('[backupFirestore] gagal:', e);
    return res.status(500).json({ ok: false, pesan: String(e?.message || e) });
  }
}
