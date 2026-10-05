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
// Service account harus berhak membaca Firestore dan menulis ke Storage
// (Storage Admin + Cloud Datastore user). Service account bawaan Firebase
// (<project>@appspot.gserviceaccount.com) sudah berhak keduanya.
//
// HASIL: folder backups/<stamp>/ di bucket -- satu JSON per koleksi
//   (format polos: {__id, ...data} sama seperti ekspor manual) + MANIFEST.json.
// Retensi dikelola manual: hapus folder backup lama dari Storage bila sudah
// tidak perlu (biarkan minimal 4 minggu terakhir).
//
// ⚠️ CATATAN TEKNIS -- JANGAN menambahkan `import ... from 'firebase-admin/...'`
//   ke file ini tanpa uji deploy dulu! Sejarah lengkap (Okt 2026):
//   1) PR #105 memakai firebase-admin/storage -> semua deploy Vercel merah.
//   2) Dikira rantai @google-cloud/storage; diganti REST, masih merah.
//   3) Probe membuktikan: isi file TIDAK berpengaruh -- salinan PERSIS
//      verifyStaffLogin.js pun merah bila ditaruh sebagai fungsi KEDUA yang
//      mengimpor firebase-admin (probe/vercel-duplikat & probe/vercel-nama-lain
//      merah; probe/vercel-hanya-pkg & probe/vercel-klien-106 hijau).
//   Kesimpulan: build Vercel proyek ini hanya kuat SATU function yang memuat
//   firebase-admin (verifyStaffLogin). Maka backup ini 100% REST murni:
//   OAuth2 JWT RS256 (node:crypto) + Firestore REST API + Storage JSON API.
//   Tanpa dependensi berat sama sekali.
// ============================================================

import { createSign } from 'node:crypto';

const izinkan = (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  return bearer === secret || req.query?.secret === secret;
};

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

// Mintakan access token OAuth2 dari kredensial service account (JWT RS256).
async function tokenGoogle(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url({ alg: 'RS256', typ: 'JWT' });
  const claim = b64url({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
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
    throw new Error(`Token Google ditolak: ${JSON.stringify(j).slice(0, 200)}`);
  }
  return j.access_token;
}

// ---------- Firestore REST ----------
// Nilai dokumen datang sebagai proto-JSON ({stringValue:...}, {mapValue:...}).
// Dua fungsi di bawah menerjemahkannya ke JS polos; diekspor agar bisa diuji.
export function decodeNilai(v) {
  if (v === null || typeof v !== 'object') return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('stringValue' in v) return v.stringValue;
  if ('bytesValue' in v) return v.bytesValue;
  if ('geoPointValue' in v) return v.geoPointValue;
  if ('referenceValue' in v) return v.referenceValue;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decodeNilai);
  if ('mapValue' in v) return decodeFields(v.mapValue?.fields || {});
  return null;
}

export function decodeFields(fields) {
  const o = {};
  for (const [k, val] of Object.entries(fields)) o[k] = decodeNilai(val);
  return o;
}

async function daftarKoleksi(token, pid) {
  const url = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents:listCollectionIds`;
  const ids = [];
  let pageToken;
  do {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ pageSize: 300, pageToken: pageToken || undefined }),
    });
    if (!r.ok) throw new Error(`listCollectionIds gagal: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    ids.push(...(j.collectionIds || []));
    pageToken = j.nextPageToken;
  } while (pageToken);
  return ids;
}

async function ambilKoleksi(token, pid, koleksi) {
  const rows = [];
  let pageToken;
  const prefix = `/documents/${koleksi}/`;
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${koleksi}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Baca koleksi ${koleksi} gagal: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    for (const d of j.documents || []) {
      const idx = (d.name || '').lastIndexOf(prefix);
      rows.push({ __id: idx >= 0 ? d.name.slice(idx + prefix.length) : d.name, ...decodeFields(d.fields || {}) });
    }
    pageToken = j.nextPageToken;
  } while (pageToken);
  return rows;
}

// ---------- Storage REST ----------
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
    const pid = process.env.FIREBASE_PROJECT_ID || sa.project_id;
    const bucket = process.env.FIREBASE_STORAGE_BUCKET || `${sa.project_id}.appspot.com`;
    const token = await tokenGoogle(sa);

    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const folder = `backups/${stamp}`;
    const koleksiList = await daftarKoleksi(token, pid);
    const manifest = { waktu: new Date().toISOString(), sumber: 'rest', koleksi: {} };

    for (const koleksi of koleksiList) {
      const rows = await ambilKoleksi(token, pid, koleksi);
      await uploadJson(token, bucket, `${folder}/${koleksi}.json`, JSON.stringify(rows));
      manifest.koleksi[koleksi] = rows.length;
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
