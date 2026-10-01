// tests/passwordHash.test.mjs
// ============================================================
// Test untuk logika hash & validasi kredensial admin.
//
// Dijalankan langsung dengan Node (tanpa framework):
//     node tests/passwordHash.test.mjs
//
// Kenapa perlu: ini kode KEAMANAN. PBKDF2, salt, dan perbandingan
// waktu-seragam tidak bisa diverifikasi dengan membaca kode saja —
// salah sedikit (mis. salt tidak benar-benar acak, atau perbandingan
// memakai `===`) dan seluruh skema login jadi lemah tanpa ada gejala
// yang terlihat. Test ini yang menangkap hal itu.
//
// Modul yang diuji (`src/utils/passwordHash.js`) SENGAJA tidak
// meng-impor Firebase, jadi bisa jalan di Node apa adanya.
// Node 20+ sudah menyediakan Web Crypto di global `crypto`.
// ============================================================

import assert from 'node:assert/strict';
import {
  PBKDF2_ITERATIONS,
  SALT_BYTES,
  USERNAME_DILARANG,
  bufToHex,
  hexToBuf,
  buatSalt,
  hashPassword,
  perbandinganAman,
  verifikasiPassword,
  normalisasiUsername,
  validasiUsername,
  validasiPassword,
} from '../src/utils/passwordHash.js';

let lulus = 0;
let gagal = 0;
const mulai = Date.now();

async function uji(nama, fn) {
  try {
    await fn();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal += 1;
    console.log(`  ✗ ${nama}`);
    console.log(`      ${String(e && e.message ? e.message : e).split('\n').join('\n      ')}`);
  }
}

function bagian(judul) {
  console.log(`\n${judul}`);
}

// Untuk test yang sensitif waktu, pakai iterasi kecil supaya cepat.
const ITERASI_CEPAT = 2000;

console.log('passwordHash — test logika keamanan kredensial admin');

// ============================================================
bagian('Konversi hex');
// ============================================================

await uji('bufToHex/hexToBuf saling membalik (round-trip)', () => {
  const asli = new Uint8Array([0, 1, 15, 16, 127, 128, 255]).buffer;
  const hex = bufToHex(asli);
  assert.equal(hex, '00010f107f80ff');
  assert.deepEqual(new Uint8Array(hexToBuf(hex)), new Uint8Array(asli));
});

await uji('hexToHex menolak panjang ganjil', () => {
  assert.throws(() => hexToBuf('abc'), /genap/);
});

await uji('hexToBuf menolak karakter bukan hex', () => {
  assert.throws(() => hexToBuf('zz'), /tidak sah/);
});

await uji('hexToBuf menerima string kosong', () => {
  assert.equal(new Uint8Array(hexToBuf('')).length, 0);
});

// ============================================================
bagian('Salt');
// ============================================================

await uji(`buatSalt menghasilkan ${SALT_BYTES * 2} karakter hex`, () => {
  const s = buatSalt();
  assert.equal(s.length, SALT_BYTES * 2);
  assert.match(s, /^[0-9a-f]+$/);
});

await uji('buatSalt benar-benar acak (1000 salt semua unik)', () => {
  const himpunan = new Set();
  for (let i = 0; i < 1000; i += 1) himpunan.add(buatSalt());
  assert.equal(himpunan.size, 1000, 'ada salt yang kembar — RNG tidak acak');
});

await uji('salt yang beda menghasilkan hash yang beda untuk password sama', async () => {
  const pw = 'password-yang-sama';
  const h1 = await hashPassword(pw, buatSalt(), ITERASI_CEPAT);
  const h2 = await hashPassword(pw, buatSalt(), ITERASI_CEPAT);
  assert.notEqual(h1, h2, 'hash identik untuk salt berbeda — berarti salt tidak dipakai');
});

// ============================================================
bagian('PBKDF2 hashing');
// ============================================================

await uji('hash berbentuk 64 karakter hex (256-bit)', async () => {
  const h = await hashPassword('rahasia123', buatSalt(), ITERASI_CEPAT);
  assert.equal(h.length, 64);
  assert.match(h, /^[0-9a-f]{64}$/);
});

await uji('deterministik: password + salt + iterasi sama => hash sama', async () => {
  const salt = buatSalt();
  const a = await hashPassword('rahasia123', salt, ITERASI_CEPAT);
  const b = await hashPassword('rahasia123', salt, ITERASI_CEPAT);
  assert.equal(a, b);
});

await uji('iterasi berbeda => hash berbeda (iterasi benar-benar dipakai)', async () => {
  const salt = buatSalt();
  const a = await hashPassword('rahasia123', salt, 1000);
  const b = await hashPassword('rahasia123', salt, 2000);
  assert.notEqual(a, b);
});

await uji('COCOK dengan vektor uji PBKDF2-HMAC-SHA256 standar (uji silang implementasi)', async () => {
  // Nilai rujukan dihitung dengan implementasi INDEPENDEN (hashlib Python),
  // bukan dengan kode yang sedang diuji. Ini yang membuktikan parameter kita
  // tidak keliru -- misalnya salah pakai SHA-512, atau salt & password
  // tertukar posisinya. password='passwd', salt='salt', dkLen=32 byte.
  //
  // hashPassword() punya pengaman yang menolak iterasi < 1000 (masuk akal
  // untuk produksi), jadi vektor ber-iterasi kecil diverifikasi lewat
  // crypto.subtle secara langsung -- tetap menguji pemahaman parameter kita.
  const saltHex = bufToHex(new TextEncoder().encode('salt'));

  async function deriv(pw, saltHx, iterasi) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hexToBuf(saltHx), iterations: iterasi, hash: 'SHA-256' }, key, 256,
    );
    return bufToHex(bits);
  }

  // (a) vektor iterasi kecil -> lewat deriv() langsung
  assert.equal(
    await deriv('passwd', saltHex, 1),
    '55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc',
    'vektor c=1 tidak cocok',
  );
  assert.equal(
    await deriv('passwd', saltHex, 2),
    '2d412f896e76685e30df569f0a740634e31f031f749d607d9e44210bffb91a6a',
    'vektor c=2 tidak cocok',
  );

  // (b) vektor c=4096 -> lewat hashPassword() yang sedang dipakai produksi.
  //     Ini uji yang paling penting: membuktikan fungsi yang benar-benar
  //     dipakai login menghasilkan output standar.
  assert.equal(
    await hashPassword('passwd', saltHex, 4096),
    '21943fd5b7a10905c38fad60157ff498e1e81df1e03254325682a74dca3b2be8',
    'hashPassword() tidak cocok dengan vektor c=4096',
  );

  // (c) deriv() dan hashPassword() harus sepakat untuk input yang sama
  assert.equal(
    await hashPassword('passwd', saltHex, 4096),
    await deriv('passwd', saltHex, 4096),
    'hashPassword() dan crypto.subtle langsung menghasilkan beda',
  );
});

await uji('menolak password kosong', async () => {
  await assert.rejects(() => hashPassword('', buatSalt(), ITERASI_CEPAT), /tidak kosong/);
});

await uji('menolak iterasi tidak wajar', async () => {
  await assert.rejects(() => hashPassword('abc12345', buatSalt(), 10), /tidak wajar/);
  await assert.rejects(() => hashPassword('abc12345', buatSalt(), 1.5), /tidak wajar/);
});

await uji('iterasi produksi sesuai konstanta dan cukup mahal', () => {
  assert.equal(PBKDF2_ITERATIONS, 210000);
  assert.ok(PBKDF2_ITERATIONS >= 150000, 'iterasi terlalu rendah untuk PBKDF2-SHA256');
});

await uji('hash produksi benar-benar butuh waktu nyata (bukan hash kosong)', async () => {
  const t0 = Date.now();
  await hashPassword('rahasia123', buatSalt());
  const ms = Date.now() - t0;
  assert.ok(ms >= 20, `hash produksi terlalu cepat (${ms}ms) — curiga iterasi tidak jalan`);
  assert.ok(ms <= 20000, `hash produksi terlalu lambat (${ms}ms) — akan menyulitkan di HP`);
});

// ============================================================
bagian('verifikasiPassword');
// ============================================================

await uji('menerima password yang benar', async () => {
  const salt = buatSalt();
  const akun = {
    passwordSalt: salt,
    passwordHash: await hashPassword('kopi-pagi-2026', salt, ITERASI_CEPAT),
    passwordIterations: ITERASI_CEPAT,
  };
  assert.equal(await verifikasiPassword('kopi-pagi-2026', akun), true);
});

await uji('menolak password yang salah', async () => {
  const salt = buatSalt();
  const akun = {
    passwordSalt: salt,
    passwordHash: await hashPassword('kopi-pagi-2026', salt, ITERASI_CEPAT),
    passwordIterations: ITERASI_CEPAT,
  };
  assert.equal(await verifikasiPassword('Kopi-Pagi-2026', akun), false);
  assert.equal(await verifikasiPassword('kopi-pagi-2026 ', akun), false);
  assert.equal(await verifikasiPassword('', akun), false);
});

await uji('akun tanpa hash/salt selalu ditolak (tidak crash)', async () => {
  assert.equal(await verifikasiPassword('apa-saja-1', null), false);
  assert.equal(await verifikasiPassword('apa-saja-1', {}), false);
  assert.equal(await verifikasiPassword('apa-saja-1', { passwordHash: 'x' }), false);
  assert.equal(await verifikasiPassword('apa-saja-1', { passwordSalt: 'y' }), false);
  // Akun soft-delete: hash dikosongkan -> harus ditolak.
  assert.equal(await verifikasiPassword('apa-saja-1', { passwordHash: '', passwordSalt: '' }), false);
});

await uji('akun lama tanpa field iterasi tetap bisa login (pakai default)', async () => {
  // Simulasi dokumen yang dibuat sebelum `passwordIterations` ada.
  const salt = buatSalt();
  const akun = {
    passwordSalt: salt,
    passwordHash: await hashPassword('warisan-2024', salt, PBKDF2_ITERATIONS),
    // passwordIterations sengaja TIDAK ada
  };
  assert.equal(await verifikasiPassword('warisan-2024', akun), true);
  assert.equal(await verifikasiPassword('salah-total', akun), false);
});

await uji('password bukan string ditolak tanpa melempar', async () => {
  const salt = buatSalt();
  const akun = {
    passwordSalt: salt,
    passwordHash: await hashPassword('abc12345', salt, ITERASI_CEPAT),
    passwordIterations: ITERASI_CEPAT,
  };
  assert.equal(await verifikasiPassword(undefined, akun), false);
  assert.equal(await verifikasiPassword(12345678, akun), false);
  assert.equal(await verifikasiPassword({ toString: () => 'abc12345' }, akun), false);
});

// ============================================================
bagian('perbandinganAman (constant-time)');
// ============================================================

await uji('benar untuk string identik, salah untuk beda', () => {
  assert.equal(perbandinganAman('abc', 'abc'), true);
  assert.equal(perbandinganAman('abc', 'abd'), false);
  assert.equal(perbandinganAman('abc', 'ab'), false);
  assert.equal(perbandinganAman('', ''), true);
});

await uji('tidak crash untuk null/undefined', () => {
  assert.equal(perbandinganAman(null, null), true);
  assert.equal(perbandinganAman(null, 'x'), false);
  assert.equal(perbandinganAman('x', undefined), false);
});

await uji('panjang beda langsung ditolak (jalur cepat)', () => {
  assert.equal(perbandinganAman('a'.repeat(64), 'a'.repeat(63) + 'b'), false);
});

// ============================================================
bagian('normalisasi & validasi username');
// ============================================================

await uji('normalisasi: huruf kecil, spasi dibuang, tepi dirapikan', () => {
  assert.equal(normalisasiUsername('  Siti.Kasir  '), 'siti.kasir');
  assert.equal(normalisasiUsername('BUDI 01'), 'budi01');
  assert.equal(normalisasiUsername('AdMiN-KaSir'), 'admin-kasir');
  assert.equal(normalisasiUsername(null), '');
  assert.equal(normalisasiUsername(undefined), '');
  assert.equal(normalisasiUsername(42), '42');
});

await uji('username sah diterima', () => {
  for (const u of ['siti', 'siti.kasir', 'budi_01', 'kasir-pagi', 'a1b2c3', 'xyz']) {
    assert.equal(validasiUsername(u), null, `${u} seharusnya sah`);
  }
});

await uji('username ditolak: terlalu pendek / terlalu panjang', () => {
  assert.match(validasiUsername('ab'), /minimal 3/);
  assert.match(validasiUsername(''), /minimal 3/);
  assert.match(validasiUsername('a'.repeat(25)), /maksimal 24/);
});

await uji('username ditolak: karakter tidak sah', () => {
  for (const u of ['siti kasir', 'budi@kasir', 'nama#1', 'user!', 'kasir$', 'a/b']) {
    assert.ok(validasiUsername(u), `${u} seharusnya ditolak`);
  }
});

await uji('username dicadangkan ditolak (semua variasi huruf besar/kecil)', () => {
  for (const u of USERNAME_DILARANG) {
    assert.ok(validasiUsername(u), `"${u}" seharusnya dicadangkan`);
    assert.ok(validasiUsername(u.toUpperCase()), `"${u.toUpperCase()}" seharusnya dicadangkan`);
  }
});

await uji('penolakan terjadi SETELAH normalisasi (bukan sebelum)', () => {
  // ' Owner ' -> ternormalisasi jadi 'owner' -> harus tetap ditolak.
  assert.ok(validasiUsername(' Owner '), 'varian ber-spasi dari "owner" harus ditolak');
  assert.ok(validasiUsername('ADMIN'), 'varian huruf besar dari "admin" harus ditolak');
});

// ============================================================
bagian('validasi password');
// ============================================================

await uji('password kuat diterima', () => {
  for (const p of ['kopi-pagi-2026', 'rahasia123', 'Bimbel2026!', 'panjang-cukup-1']) {
    assert.equal(validasiPassword(p), null, `"${p}" seharusnya sah`);
  }
});

await uji('password pendek ditolak', () => {
  assert.match(validasiPassword('abc12'), /minimal 8/);
  assert.match(validasiPassword(''), /minimal 8/);
  assert.match(validasiPassword(null), /minimal 8/);
  assert.match(validasiPassword(undefined), /minimal 8/);
});

await uji('password terlalu panjang ditolak', () => {
  assert.match(validasiPassword('a1'.repeat(70)), /maksimal 128/);
});

await uji('password hanya angka ditolak', () => {
  assert.match(validasiPassword('12345678'), /hanya angka/);
});

await uji('password hanya huruf ditolak', () => {
  assert.match(validasiPassword('password'), /hanya huruf/);
});

await uji('password bukan string ditolak tanpa crash', () => {
  assert.match(validasiPassword(12345678), /minimal 8/);
  assert.match(validasiPassword({}), /minimal 8/);
});

// ============================================================
// RINGKASAN
// ============================================================
const durasi = Date.now() - mulai;
console.log(`\n${'='.repeat(56)}`);
console.log(`  LULUS : ${lulus}`);
console.log(`  GAGAL : ${gagal}`);
console.log(`  Waktu : ${durasi} ms`);
console.log('='.repeat(56));

if (gagal > 0) {
  console.error('\n❌ ADA TEST YANG GAGAL — jangan commit.');
  process.exit(1);
}
console.log('\n✅ Semua test lulus.');
