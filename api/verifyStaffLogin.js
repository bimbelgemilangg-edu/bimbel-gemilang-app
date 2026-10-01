// api/verifyStaffLogin.js
// ============================================================
// 🔥 BARU (perbaikan insiden Firestore terbuka): verifikasi kredensial
// staf (Admin & Owner) DIPINDAH KE SERVER.
//
// MASALAH YANG DISELESAIKAN
// Sebelumnya LoginOwner.jsx dan Login.jsx membaca dokumen
// `settings/global_config` langsung dari browser untuk membandingkan
// PIN/password. Itu memaksa dokumen tersebut TERBACA PUBLIK di
// Firestore Rules — sehingga siapa pun bisa membaca `ownerPin` dan
// `adminPassword` (teks polos) dari DevTools tanpa login. Hasil uji
// 2026-10-01 membuktikan keduanya memang terekspos.
//
// Dengan endpoint ini, browser TIDAK PERNAH perlu membaca kredensial.
// Ia mengirim dugaan password ke sini; server yang membandingkan dan
// hanya menjawab "boleh/tidak" + identitas. `settings/global_config`
// dan `admin_users` lalu bisa dikunci total di Rules:
//     match /settings/{id}   { allow read, write: if false; }
//     match /admin_users/{id}{ allow read, write: if false; }
//
// SYARAT AGAR ENDPOINT INI HIDUP
// Butuh Firebase Admin SDK, yang memerlukan service account:
//   FIREBASE_SERVICE_ACCOUNT  = isi JSON key service account (satu string)
//   FIREBASE_PROJECT_ID       = gemilangsystem
// Kalau belum dikonfigurasi, endpoint menjawab 501 dan klien otomatis
// jatuh ke jalur lama (lihat loginAdmin di src/utils/adminAuth.js), jadi
// memasang kode ini TIDAK memutus aplikasi yang sedang live.
//
// CATATAN KEJUJURAN
// Ini memindahkan kredensial keluar dari jangkauan publik, tapi ia
// BUKAN autentikasi sejati: jawabannya hanya "boleh/tidak", bukan token
// yang bisa diverifikasi Rules. Jadi pembatasan peran per-staf tetap
// membutuhkan Firebase Auth + custom claims (Jalan A di runbook).
// Endpoint ini adalah LANGKAH 2, bukan langkah terakhir.
// ============================================================

import crypto from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// ------------------------------------------------------------
// Inisialisasi Admin SDK (sekali per instance function)
// ------------------------------------------------------------
let adminSiap = false;
let adminError = '';

function siapkanAdmin() {
  if (adminSiap) return true;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      adminError = 'FIREBASE_SERVICE_ACCOUNT belum diisi di environment Vercel.';
      return false;
    }

    // Vercel menyimpan variabel berisi newline sebagai teks ter-escape,
    // jadi '\n' literal perlu dikembalikan jadi newline asli.
    let sa;
    try {
      sa = JSON.parse(raw);
    } catch {
      sa = JSON.parse(raw.replace(/\\n/g, '\n'));
    }
    if (!sa.project_id) {
      sa.project_id = process.env.FIREBASE_PROJECT_ID || 'gemilangsystem';
    }

    // Instance function bisa dipakai ulang (warm start), jadi app hanya
    // boleh diinisialisasi SEKALI. Tanpa penjagaan ini, inisialisasi kedua
    // melempar "app already exists".
    if (getApps().length === 0) {
      initializeApp({ credential: cert(sa) });
    }
    adminSiap = true;
    return true;
  } catch (e) {
    adminError = `Gagal inisialisasi Firebase Admin: ${e?.message || e}`;
    return false;
  }
}

// ------------------------------------------------------------
// Utilitas
// ------------------------------------------------------------
const izinkanCors = (req, res) => {
  // Vercel biasanya same-origin, tapi header dipasang eksplisit supaya
  // pratinjau/deploy preview di domain lain tetap bisa memanggil.
  const asal = req.headers.origin;
  const diizinkan =
    !asal ||
    asal.endsWith('.vercel.app') ||
    asal === 'http://localhost:5173' ||
    asal === 'http://localhost:4173';
  if (asal && diizinkan) {
    res.setHeader('Access-Control-Allow-Origin', asal);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Perlambatan brute-force sederhana. ⚠️ TERBATAS: Vercel Functions
// bersifat stateless & multi-instance, jadi peta ini hanya menahan
// percobaan beruntun ke instance yang sama — bukan pertahanan serius.
// Perlindungan yang sebenarnya harus di lapisan Rules + Firebase Auth.
const percobaan = new Map();
const MAKS_PERCOBAAN = 8;
const JENDELA_MS = 10 * 60 * 1000;

function cekBatas(kunci) {
  const sekarang = Date.now();
  const daftar = (percobaan.get(kunci) || []).filter((t) => sekarang - t < JENDELA_MS);
  percobaan.set(kunci, daftar);
  if (daftar.length >= MAKS_PERCOBAAN) {
    const tunggu = Math.ceil((JENDELA_MS - (sekarang - daftar[0])) / 60000);
    return `Terlalu banyak percobaan. Coba lagi dalam ~${tunggu} menit.`;
  }
  daftar.push(sekarang);
  return null;
}

/** PBKDF2-HMAC-SHA256, identik dengan implementasi browser di passwordHash.js. */
function pbkdf2Hex(password, saltHex, iterations) {
  const buf = crypto.pbkdf2Sync(
    password,
    Buffer.from(saltHex, 'hex'),
    iterations,
    32,          // 256 bit, sama dengan deriveBits(..., 256) di browser
    'sha256',
  );
  return buf.toString('hex');
}

/** Perbandingan waktu-seragam. */
function amanSetara(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

const normalisasiUsername = (u) =>
  String(u || '').trim().toLowerCase().replace(/\s+/g, '');

// ------------------------------------------------------------
// Handler
// ------------------------------------------------------------
export default async function handler(req, res) {
  izinkanCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Belum dikonfigurasi -> 501. Klien menangkap kode ini dan jatuh ke
  // jalur lama, jadi deploy kode ini saja tidak mengubah perilaku apa pun.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return res.status(501).json({
      ok: false,
      belumDikonfigurasi: true,
      pesan: 'Verifikasi server belum diaktifkan (FIREBASE_SERVICE_ACCOUNT kosong).',
    });
  }
  if (!siapkanAdmin()) {
    return res.status(503).json({ ok: false, pesan: adminError || 'Admin SDK belum siap.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { jalur, username, password } = body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ ok: false, pesan: 'Password wajib diisi.' });
  }

  const db = getFirestore();

  try {
    // ============================================================
    // JALUR OWNER — PIN
    // ============================================================
    if (jalur === 'owner') {
      const dibatasi = cekBatas('owner');
      if (dibatasi) return res.status(429).json({ ok: false, pesan: dibatasi });

      const snap = await db.collection('settings').doc('global_config').get();
      const pin = snap.exists ? snap.data()?.ownerPin : null;
      if (!pin) {
        return res.status(401).json({
          ok: false,
          pesan: 'PIN Owner belum diatur di sistem. Hubungi pengembang.',
        });
      }
      if (!amanSetara(password, pin)) {
        return res.status(401).json({ ok: false, pesan: 'PIN Owner salah.' });
      }
      return res.status(200).json({
        ok: true,
        jalur: 'owner',
        peran: 'owner',
        nama: 'Owner',
        username: 'owner',
      });
    }

    // ============================================================
    // JALUR ADMIN
    // ============================================================
    if (jalur === 'admin') {
      const u = normalisasiUsername(username);
      const batas = u ? `admin:${u}` : 'admin:legacy';
      const dibatasi = cekBatas(batas);
      if (dibatasi) return res.status(429).json({ ok: false, pesan: dibatasi });

      // ---- (a) akun bernama di admin_users ----
      if (u) {
        const ref = db.collection('admin_users').doc(u);
        const snapAkun = await ref.get();
        // Fallback: dokumen mungkin tidak memakai username sebagai id.
        let akun = snapAkun.exists ? { id: ref.id, ...snapAkun.data() } : null;
        if (!akun) {
          const q = await db.collection('admin_users')
            .where('username', '==', u).limit(1).get();
          if (!q.empty) akun = { id: q.docs[0].id, ...q.docs[0].data() };
        }

        // Pesan sengaja generik: jangan bocorkan apakah username ada.
        const GENERIK = 'Username atau password salah.';
        if (!akun) return res.status(401).json({ ok: false, pesan: GENERIK });
        if (akun.aktif === false || akun.dihapus) {
          return res.status(403).json({
            ok: false,
            pesan: 'Akun ini sudah dinonaktifkan. Hubungi Owner/Manajer.',
          });
        }
        if (!akun.passwordHash || !akun.passwordSalt) {
          return res.status(403).json({
            ok: false,
            pesan: 'Akun ini belum punya password. Minta Manajer meresetnya.',
          });
        }

        const iterasi = Number(akun.passwordIterations) || 210000;
        const kandidat = pbkdf2Hex(password, akun.passwordSalt, iterasi);
        if (!amanSetara(kandidat, akun.passwordHash)) {
          return res.status(401).json({ ok: false, pesan: GENERIK });
        }

        // Sukses. Perbarui metadata login; kegagalan di sini tidak
        // boleh membatalkan login.
        await ref.set({
          terakhirLogin: new Date().toISOString(),
          jumlahLogin: (Number(akun.jumlahLogin) || 0) + 1,
        }, { merge: true }).catch(() => {});

        return res.status(200).json({
          ok: true,
          jalur: 'admin-akun',
          peran: akun.peran === 'manajer' ? 'manajer' : 'kasir',
          nama: akun.nama || akun.username,
          username: akun.username,
          jabatan: akun.jabatan || '',
          wajibGantiPassword: akun.wajibGantiPassword === true,
        });
      }

      // ---- (b) jalur warisan: password bersama ----
      const snapCfg = await db.collection('settings').doc('global_config').get();
      const cfg = snapCfg.exists ? snapCfg.data() : {};

      if (cfg.izinkanLoginAdminLegacy === false) {
        return res.status(403).json({
          ok: false,
          pesan: 'Login dengan password bersama sudah dinonaktifkan Owner. Isi username akun Anda.',
        });
      }
      if (!cfg.adminPassword) {
        return res.status(401).json({
          ok: false,
          pesan: 'Isi username akun admin Anda. (Belum punya akun? Minta Owner membuatnya di menu Pengguna Admin.)',
        });
      }
      if (!amanSetara(password, cfg.adminPassword)) {
        return res.status(401).json({ ok: false, pesan: 'Username atau password salah.' });
      }
      return res.status(200).json({
        ok: true,
        jalur: 'admin-legacy',
        peran: 'legacy',
        nama: 'Admin (akun bersama)',
        username: '',
      });
    }

    return res.status(400).json({ ok: false, pesan: "Parameter 'jalur' harus 'admin' atau 'owner'." });
  } catch (e) {
    console.error('[verifyStaffLogin] error:', e);
    // Jangan bocorkan detail internal ke klien.
    return res.status(500).json({ ok: false, pesan: 'Terjadi kesalahan server saat memverifikasi.' });
  }
}
