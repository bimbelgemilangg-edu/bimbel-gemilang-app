// src/utils/passwordHash.js
// ============================================================
// Logika hash & validasi kredensial — MODUL MURNI, tanpa Firebase.
//
// 🔥 Kenapa dipisah dari adminAuth.js: adminAuth meng-impor `../firebase`
// yang menginisialisasi aplikasi Firebase, sehingga tidak bisa dijalankan
// di Node. Dengan memisahkan bagian murni ini, logika keamanannya bisa
// DIUJI (lihat tests/passwordHash.test.mjs) — dan kode kriptografi
// adalah kode yang paling tidak boleh dikirim tanpa test.
//
// Skema: PBKDF2-HMAC-SHA256, salt acak 16 byte per akun, 210.000 iterasi.
// Password asli tidak pernah disimpan di mana pun.
// ============================================================

// Jumlah iterasi PBKDF2. 210.000 masih nyaman di HP kelas bawah
// (~200-400 ms) tapi cukup mahal untuk serangan tebak offline.
export const PBKDF2_ITERATIONS = 210000;

// Panjang salt dalam byte (16 byte = 128 bit).
export const SALT_BYTES = 16;

// ------------------------------------------------------------
// KONVERSI HEX / BYTE
// ------------------------------------------------------------

export const bufToHex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const hexToBuf = (hex) => {
  const bersih = String(hex || '');
  if (bersih.length % 2 !== 0) {
    throw new Error(`Salt/hash hex harus berjumlah genap, dapat ${bersih.length} karakter.`);
  }
  const bytes = new Uint8Array(bersih.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const kode = parseInt(bersih.substr(i * 2, 2), 16);
    if (Number.isNaN(kode)) {
      throw new Error(`Karakter hex tidak sah pada posisi ${i * 2}.`);
    }
    bytes[i] = kode;
  }
  return bytes.buffer;
};

// ------------------------------------------------------------
// SALT
// ------------------------------------------------------------

export const buatSalt = () => {
  const bytes = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(bytes);
  return bufToHex(bytes);
};

// ------------------------------------------------------------
// HASHING
// ------------------------------------------------------------

// crypto.subtle hanya ada di secure context (HTTPS / localhost).
// Aplikasi ini jalan di Vercel (HTTPS) jadi aman, tapi pesannya harus
// jelas kalau suatu saat dibuka lewat HTTP polos -- jangan sampai
// admin melihat "undefined is not an object".
export const pastikanWebCrypto = () => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error(
      'Browser/koneksi ini tidak mendukung Web Crypto (butuh HTTPS). '
      + 'Buka aplikasi lewat https:// atau localhost, bukan http://.',
    );
  }
};

/**
 * Turunkan hash dari password + salt memakai PBKDF2-HMAC-SHA256.
 * @param {string} password  password mentah
 * @param {string} saltHex   salt dalam bentuk hex
 * @param {number} [iterations]
 * @returns {Promise<string>} hash 256-bit dalam bentuk hex (64 karakter)
 */
export async function hashPassword(password, saltHex, iterations = PBKDF2_ITERATIONS) {
  pastikanWebCrypto();
  if (typeof password !== 'string' || password === '') {
    throw new Error('Password harus berupa string tidak kosong.');
  }
  if (!Number.isInteger(iterations) || iterations < 1000) {
    throw new Error(`Iterasi PBKDF2 tidak wajar: ${iterations}`);
  }
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBuf(saltHex),
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    256,
  );
  return bufToHex(bits);
}

/**
 * Perbandingan dua string dengan waktu yang seragam, supaya penyerang
 * tidak bisa menyimpulkan kecocokan dari seberapa cepat fungsi kembali.
 */
export function perbandinganAman(a, b) {
  const sa = String(a || '');
  const sb = String(b || '');
  if (sa.length !== sb.length) return false;
  let beda = 0;
  for (let i = 0; i < sa.length; i += 1) {
    // XOR per karakter; `beda` hanya jadi 0 kalau semua karakter sama.
    beda |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return beda === 0;
}

/**
 * Cocokkan password mentah dengan akun tersimpan.
 *
 * Sengaja memakai salt & jumlah iterasi yang TERSIMPAN di dokumen, bukan
 * konstanta saat ini. Jadi akun yang dibuat dengan versi lebih lama tetap
 * bisa login (dan bisa di-hash ulang secara bertahap nanti kalau
//  PBKDF2_ITERATIONS dinaikkan).
 *
 * @returns {Promise<boolean>}
 */
export async function verifikasiPassword(password, akun) {
  if (!akun || !akun.passwordHash || !akun.passwordSalt) return false;
  if (typeof password !== 'string' || password === '') return false;
  const iterations = Number(akun.passwordIterations) || PBKDF2_ITERATIONS;
  const kandidat = await hashPassword(password, akun.passwordSalt, iterations);
  return perbandinganAman(kandidat, akun.passwordHash);
}

// ------------------------------------------------------------
// VALIDASI USERNAME
// ------------------------------------------------------------

/** Username selalu disimpan dalam bentuk ternormalisasi ini. */
export const normalisasiUsername = (u) =>
  String(u || '').trim().toLowerCase().replace(/\s+/g, '');

// Dicadangkan supaya tidak bentrok dengan label sistem/jejak audit.
export const USERNAME_DILARANG = ['owner', 'admin', 'root', 'system', 'null', 'undefined', 'anon'];

/**
 * @returns {string|null} pesan kesalahan, atau null kalau sah
 */
export function validasiUsername(username) {
  const mentah = String(username === null || username === undefined ? '' : username).trim();
  const u = normalisasiUsername(mentah);

  // 🔥 DIPERBAIKI (ditangkap oleh tests/passwordHash.test.mjs): cek spasi
  // harus dilakukan pada input MENTAH, bukan hasil normalisasi.
  // `normalisasiUsername` membuang SEMUA spasi, jadi kalau yang diuji
  // hasil normalisasinya, "siti kasir" lolos dan diam-diam berubah jadi
  // "sitikasir" -- bertentangan dengan pesan error di bawah, dan bikin
  // admin bingung kenapa username-nya berbeda dari yang diketik.
  if (/\s/.test(mentah)) {
    return 'Username tidak boleh mengandung spasi. Pakai titik, strip, atau underscore, contoh: siti.kasir';
  }
  if (u.length < 3) return 'Username minimal 3 karakter.';
  if (u.length > 24) return 'Username maksimal 24 karakter.';
  if (!/^[a-z0-9._-]+$/.test(u)) {
    return 'Username hanya boleh huruf kecil, angka, titik, strip, dan underscore.';
  }
  if (USERNAME_DILARANG.includes(u)) {
    return `Username "${u}" dicadangkan sistem, pilih yang lain.`;
  }
  return null;
}

// ------------------------------------------------------------
// VALIDASI PASSWORD
// ------------------------------------------------------------

export function validasiPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password minimal 8 karakter.';
  }
  if (password.length > 128) return 'Password maksimal 128 karakter.';
  if (/^\d+$/.test(password)) {
    return 'Password jangan hanya angka, campur dengan huruf.';
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    return 'Password jangan hanya huruf, campur dengan angka.';
  }
  return null;
}

export default {
  PBKDF2_ITERATIONS,
  SALT_BYTES,
  USERNAME_DILARANG,
  bufToHex,
  hexToBuf,
  buatSalt,
  pastikanWebCrypto,
  hashPassword,
  perbandinganAman,
  verifikasiPassword,
  normalisasiUsername,
  validasiUsername,
  validasiPassword,
};
